"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.evaluateBonusPredictions = exports.sendMassNotification = exports.notifyResultsPublished = exports.sendDeadlineReminders = exports.getInvite = exports.onMatchUpdated = void 0;
const admin = __importStar(require("firebase-admin"));
const firestore_1 = require("firebase-functions/v2/firestore");
const https_1 = require("firebase-functions/v2/https");
const scheduler_1 = require("firebase-functions/v2/scheduler");
const firestore_2 = require("firebase-admin/firestore");
admin.initializeApp();
const db = admin.firestore();
const DEFAULT_SCORING = {
    correctPrediction: 3,
    correctTieWinner: 1,
    groupBonus: 5,
    bonusPrediction: 5,
    exactScore: 5,
    correctResult: 2,
    correctGoals: 1,
};
async function getScoringConfig() {
    const snap = await db.collection('config').doc('scoring').get();
    if (!snap.exists)
        return DEFAULT_SCORING;
    return Object.assign(Object.assign({}, DEFAULT_SCORING), snap.data());
}
function deriveResult(homeScore, awayScore) {
    if (homeScore > awayScore)
        return 'home';
    if (awayScore > homeScore)
        return 'away';
    return 'draw';
}
async function getMatchdayPredictionMode(matchdayId) {
    var _a, _b;
    const snap = await db.collection('matchdays').doc(matchdayId).get();
    return (_b = (_a = snap.data()) === null || _a === void 0 ? void 0 : _a.predictionMode) !== null && _b !== void 0 ? _b : 'result';
}
function computePoints(homeScore, awayScore, winner, phase, predResult, predTieWinner, cfg) {
    if (!predResult)
        return { points: 0, isCorrect: false };
    const matchResult = deriveResult(homeScore, awayScore);
    const isKnockout = phase !== 'group_stage';
    const isCorrect = predResult === matchResult;
    if (isKnockout && matchResult === 'draw') {
        if (!isCorrect)
            return { points: 0, isCorrect: false };
        const rightTie = winner != null && predTieWinner === winner;
        return { points: cfg.correctPrediction + (rightTie ? cfg.correctTieWinner : 0), isCorrect: true };
    }
    if (isCorrect)
        return { points: cfg.correctPrediction, isCorrect: true };
    return { points: 0, isCorrect: false };
}
function computeExactScorePoints(homeScore, awayScore, winner, phase, predHomeGoals, predAwayGoals, predTieWinner, cfg) {
    if (predHomeGoals === null || predAwayGoals === null)
        return { points: 0, isCorrect: false };
    const isExact = predHomeGoals === homeScore && predAwayGoals === awayScore;
    const isKnockout = phase !== 'group_stage';
    const actualResult = deriveResult(homeScore, awayScore);
    if (isExact) {
        let pts = cfg.exactScore;
        if (isKnockout && actualResult === 'draw') {
            const rightTie = winner != null && predTieWinner === winner;
            if (rightTie)
                pts += cfg.correctTieWinner;
        }
        return { points: pts, isCorrect: true };
    }
    const predictedResult = deriveResult(predHomeGoals, predAwayGoals);
    let pts = 0;
    if (predictedResult === actualResult) {
        pts += cfg.correctResult;
        if (isKnockout && actualResult === 'draw') {
            const rightTie = winner != null && predTieWinner === winner;
            if (rightTie)
                pts += cfg.correctTieWinner;
        }
    }
    if (predHomeGoals === homeScore)
        pts += cfg.correctGoals;
    if (predAwayGoals === awayScore)
        pts += cfg.correctGoals;
    return { points: pts, isCorrect: false };
}
async function scoreMatchPredictions(match, cfg, predictionMode) {
    const { homeScore, awayScore, winner } = match;
    if (homeScore == null || awayScore == null)
        return;
    const predsSnap = await db.collection('predictions')
        .where('matchId', '==', match.id)
        .get();
    if (predsSnap.empty)
        return;
    const batch = db.batch();
    for (const predDoc of predsSnap.docs) {
        const pred = predDoc.data();
        const scored = predictionMode === 'exact_score'
            ? computeExactScorePoints(homeScore, awayScore, winner, match.phase, pred.homeGoals, pred.awayGoals, pred.tieWinner, cfg)
            : computePoints(homeScore, awayScore, winner, match.phase, pred.result, pred.tieWinner, cfg);
        batch.update(predDoc.ref, {
            points: scored.points,
            isCorrect: scored.isCorrect,
        });
        batch.update(db.collection('users').doc(pred.userId), {
            'stats.totalPoints': firestore_2.FieldValue.increment(scored.points),
            'stats.correctPredictions': firestore_2.FieldValue.increment(scored.isCorrect ? 1 : 0),
        });
    }
    await batch.commit();
}
async function resetMatchPredictions(matchId) {
    var _a;
    const predsSnap = await db.collection('predictions')
        .where('matchId', '==', matchId)
        .get();
    const scored = predsSnap.docs.filter(d => d.data().points != null);
    if (scored.length === 0)
        return;
    const batch = db.batch();
    for (const predDoc of scored) {
        const pred = predDoc.data();
        const pts = (_a = pred.points) !== null && _a !== void 0 ? _a : 0;
        batch.update(predDoc.ref, { points: null, isCorrect: null });
        batch.update(db.collection('users').doc(pred.userId), {
            'stats.totalPoints': firestore_2.FieldValue.increment(-pts),
            'stats.correctPredictions': firestore_2.FieldValue.increment(pred.isCorrect ? -1 : 0),
        });
    }
    await batch.commit();
}
async function rescoreMatchPredictions(oldMatch, newMatch, cfg, predictionMode) {
    var _a;
    const { homeScore: newHome, awayScore: newAway, winner: newWinner } = newMatch;
    if (newHome == null || newAway == null)
        return;
    const predsSnap = await db.collection('predictions')
        .where('matchId', '==', newMatch.id)
        .get();
    if (predsSnap.empty)
        return;
    const batch = db.batch();
    for (const predDoc of predsSnap.docs) {
        const pred = predDoc.data();
        const newScored = predictionMode === 'exact_score'
            ? computeExactScorePoints(newHome, newAway, newWinner, newMatch.phase, pred.homeGoals, pred.awayGoals, pred.tieWinner, cfg)
            : computePoints(newHome, newAway, newWinner, newMatch.phase, pred.result, pred.tieWinner, cfg);
        const oldPts = (_a = pred.points) !== null && _a !== void 0 ? _a : 0;
        const ptsDelta = newScored.points - oldPts;
        const correctDelta = (newScored.isCorrect ? 1 : 0) - (pred.isCorrect ? 1 : 0);
        batch.update(predDoc.ref, {
            points: newScored.points,
            isCorrect: newScored.isCorrect,
        });
        if (ptsDelta !== 0 || correctDelta !== 0) {
            batch.update(db.collection('users').doc(pred.userId), {
                'stats.totalPoints': firestore_2.FieldValue.increment(ptsDelta),
                'stats.correctPredictions': firestore_2.FieldValue.increment(correctDelta),
            });
        }
    }
    await batch.commit();
}
// Awards groupBonus pts to user(s) with most exact group stage predictions once all are finished.
async function checkAndAwardGroupBonus(bonusPts) {
    var _a;
    const configRef = db.collection('config').doc('tournament');
    const configSnap = await configRef.get();
    if ((_a = configSnap.data()) === null || _a === void 0 ? void 0 : _a.groupBonusAwarded)
        return;
    const matchesSnap = await db.collection('matches')
        .where('phase', '==', 'group_stage')
        .get();
    const allFinished = matchesSnap.docs.length > 0 &&
        matchesSnap.docs.every(d => d.data().status === 'finished');
    if (!allFinished)
        return;
    // Atomically claim the award to prevent double-awarding on concurrent invocations
    let claimed = false;
    await db.runTransaction(async (tx) => {
        var _a;
        const snap = await tx.get(configRef);
        if ((_a = snap.data()) === null || _a === void 0 ? void 0 : _a.groupBonusAwarded)
            return;
        tx.set(configRef, { groupBonusAwarded: true }, { merge: true });
        claimed = true;
    });
    if (!claimed)
        return;
    const matchIds = matchesSnap.docs.map(d => d.id);
    const correctCountsByUser = {};
    const CHUNK = 30;
    for (let i = 0; i < matchIds.length; i += CHUNK) {
        const chunk = matchIds.slice(i, i + CHUNK);
        const predsSnap = await db.collection('predictions')
            .where('matchId', 'in', chunk)
            .where('isCorrect', '==', true)
            .get();
        predsSnap.docs.forEach(d => {
            var _a;
            const uid = d.data().userId;
            correctCountsByUser[uid] = ((_a = correctCountsByUser[uid]) !== null && _a !== void 0 ? _a : 0) + 1;
        });
    }
    if (Object.keys(correctCountsByUser).length === 0)
        return;
    const maxCorrect = Math.max(...Object.values(correctCountsByUser));
    const winners = Object.entries(correctCountsByUser)
        .filter(([, count]) => count === maxCorrect)
        .map(([uid]) => uid);
    const batch = db.batch();
    for (const uid of winners) {
        batch.update(db.collection('users').doc(uid), {
            'stats.totalPoints': firestore_2.FieldValue.increment(bonusPts),
        });
    }
    await batch.commit();
}
exports.onMatchUpdated = (0, firestore_1.onDocumentUpdated)('matches/{matchId}', async (event) => {
    var _a, _b, _c, _d;
    const matchId = event.params.matchId;
    const beforeData = (_a = event.data) === null || _a === void 0 ? void 0 : _a.before.data();
    const afterData = (_b = event.data) === null || _b === void 0 ? void 0 : _b.after.data();
    if (!beforeData || !afterData)
        return;
    const oldMatch = Object.assign(Object.assign({}, beforeData), { id: matchId, matchdayId: (_c = beforeData.matchdayId) !== null && _c !== void 0 ? _c : '' });
    const newMatch = Object.assign(Object.assign({}, afterData), { id: matchId, matchdayId: (_d = afterData.matchdayId) !== null && _d !== void 0 ? _d : '' });
    const wasFinished = oldMatch.status === 'finished' &&
        oldMatch.homeScore != null && oldMatch.awayScore != null;
    const isFinished = newMatch.status === 'finished' &&
        newMatch.homeScore != null && newMatch.awayScore != null;
    if (!wasFinished && !isFinished)
        return;
    const [cfg, predictionMode] = await Promise.all([
        getScoringConfig(),
        getMatchdayPredictionMode(newMatch.matchdayId),
    ]);
    if (!wasFinished && isFinished) {
        await scoreMatchPredictions(newMatch, cfg, predictionMode);
        if (newMatch.phase === 'group_stage') {
            await checkAndAwardGroupBonus(cfg.groupBonus);
        }
    }
    else if (wasFinished && !isFinished) {
        await resetMatchPredictions(oldMatch.id);
    }
    else {
        const scoresChanged = oldMatch.homeScore !== newMatch.homeScore ||
            oldMatch.awayScore !== newMatch.awayScore ||
            oldMatch.winner !== newMatch.winner;
        if (scoresChanged) {
            await rescoreMatchPredictions(oldMatch, newMatch, cfg, predictionMode);
        }
    }
});
exports.getInvite = (0, https_1.onCall)(async (request) => {
    const { token } = request.data;
    if (!token)
        throw new https_1.HttpsError('invalid-argument', 'Token requerido');
    const snap = await db.collection('invites').doc(token).get();
    if (!snap.exists)
        throw new https_1.HttpsError('not-found', 'Invitación no válida');
    const data = snap.data();
    if (data.expiresAt.toDate() < new Date()) {
        throw new https_1.HttpsError('deadline-exceeded', 'Invitación expirada');
    }
    return { email: data.email };
});
// ── Push notification helpers ─────────────────────────────────────────────────
async function getFcmTokens() {
    const snap = await db.collection('users').get();
    return snap.docs
        .map(d => d.data().fcmToken)
        .filter((t) => !!t);
}
async function sendPush(tokens, title, body) {
    if (tokens.length === 0)
        return;
    const result = await admin.messaging().sendEachForMulticast({ tokens, notification: { title, body } });
    // Limpiar tokens inválidos de Firestore
    const invalidTokens = result.responses
        .map((r, i) => (!r.success ? tokens[i] : null))
        .filter((t) => !!t);
    if (invalidTokens.length > 0) {
        const usersSnap = await db.collection('users')
            .where('fcmToken', 'in', invalidTokens)
            .get();
        const batch = db.batch();
        usersSnap.docs.forEach(d => batch.update(d.ref, { fcmToken: firestore_2.FieldValue.delete() }));
        await batch.commit();
    }
}
// Corre cada hora — avisa cuando falta ~1h para el cierre de una jornada abierta
exports.sendDeadlineReminders = (0, scheduler_1.onSchedule)('every 60 minutes', async () => {
    var _a;
    const now = new Date();
    const windowStart = new Date(now.getTime() + 50 * 60 * 1000); // 50 min desde ahora
    const windowEnd = new Date(now.getTime() + 70 * 60 * 1000); // 70 min desde ahora
    const matchdaysSnap = await db.collection('matchdays')
        .where('status', '==', 'open')
        .get();
    for (const mdDoc of matchdaysSnap.docs) {
        const md = mdDoc.data();
        const deadline = (_a = md.predictionDeadline) === null || _a === void 0 ? void 0 : _a.toDate();
        if (!deadline)
            continue;
        if (deadline < windowStart || deadline > windowEnd)
            continue;
        const tokens = await getFcmTokens();
        await sendPush(tokens, '⏰ ¡Cierre pronto!', `${md.name} cierra en 1 hora — completa tus pronósticos`);
    }
});
// Se dispara cuando cambia el estado de una jornada → avisa al pasar a 'closed' o 'finished'
exports.notifyResultsPublished = (0, firestore_1.onDocumentUpdated)('matchdays/{matchdayId}', async (event) => {
    var _a, _b;
    const before = (_a = event.data) === null || _a === void 0 ? void 0 : _a.before.data();
    const after = (_b = event.data) === null || _b === void 0 ? void 0 : _b.after.data();
    if (!before || !after)
        return;
    const wasOpen = before.status === 'open' || before.status === 'upcoming';
    const isClosed = after.status === 'closed' || after.status === 'finished';
    if (!wasOpen || !isClosed)
        return;
    const tokens = await getFcmTokens();
    await sendPush(tokens, '🏆 Resultados disponibles', `Los resultados de ${after.name} ya están publicados`);
});
exports.sendMassNotification = (0, https_1.onCall)(async (request) => {
    var _a;
    if (!request.auth)
        throw new https_1.HttpsError('unauthenticated', 'Not authenticated');
    const callerDoc = await db.collection('users').doc(request.auth.uid).get();
    if (((_a = callerDoc.data()) === null || _a === void 0 ? void 0 : _a.role) !== 'admin') {
        throw new https_1.HttpsError('permission-denied', 'Admins only');
    }
    const { title, body } = request.data;
    if (!(title === null || title === void 0 ? void 0 : title.trim()) || !(body === null || body === void 0 ? void 0 : body.trim())) {
        throw new https_1.HttpsError('invalid-argument', 'Título y mensaje requeridos');
    }
    const tokens = await getFcmTokens();
    await sendPush(tokens, title.trim(), body.trim());
    return { sent: tokens.length };
});
exports.evaluateBonusPredictions = (0, https_1.onCall)(async (request) => {
    var _a;
    if (!request.auth)
        throw new https_1.HttpsError('unauthenticated', 'Not authenticated');
    const callerDoc = await db.collection('users').doc(request.auth.uid).get();
    if (((_a = callerDoc.data()) === null || _a === void 0 ? void 0 : _a.role) !== 'admin') {
        throw new https_1.HttpsError('permission-denied', 'Admins only');
    }
    const { topScorer, goldenBall, mexicoPhase, champion } = request.data;
    if (!topScorer || !goldenBall || !mexicoPhase || !champion) {
        throw new https_1.HttpsError('invalid-argument', 'Faltan campos requeridos');
    }
    const cfg = await getScoringConfig();
    const bonusPts = cfg.bonusPrediction;
    const normalize = (s) => (s !== null && s !== void 0 ? s : '').trim().toLowerCase();
    const usersSnap = await db.collection('users').get();
    const batch = db.batch();
    for (const userDoc of usersSnap.docs) {
        const bp = userDoc.data().bonusPredictions;
        if (!bp || bp.pointsAwarded)
            continue;
        let pts = 0;
        if (normalize(bp.topScorer) === normalize(topScorer))
            pts += bonusPts;
        if (normalize(bp.goldenBall) === normalize(goldenBall))
            pts += bonusPts;
        if (bp.mexicoPhase === mexicoPhase)
            pts += bonusPts;
        if (bp.champion === champion)
            pts += bonusPts;
        batch.update(userDoc.ref, {
            'bonusPredictions.pointsAwarded': true,
            'stats.totalPoints': firestore_2.FieldValue.increment(pts),
        });
    }
    await batch.commit();
    return { success: true };
});
//# sourceMappingURL=index.js.map