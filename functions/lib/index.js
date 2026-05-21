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
exports.evaluateBonusPredictions = exports.onMatchUpdated = void 0;
const admin = __importStar(require("firebase-admin"));
const firestore_1 = require("firebase-functions/v2/firestore");
const https_1 = require("firebase-functions/v2/https");
const firestore_2 = require("firebase-admin/firestore");
admin.initializeApp();
const db = admin.firestore();
function computePoints(homeScore, awayScore, winner, phase, predHome, predAway, predTieWinner) {
    const isKnockout = phase !== 'group_stage';
    const isDraw = homeScore === awayScore;
    // Knockout draw at 90': exact = score + tieWinner, correct = tieWinner only
    if (isKnockout && isDraw) {
        const rightTie = winner != null && predTieWinner === winner;
        const rightScore = predHome === homeScore && predAway === awayScore;
        if (rightScore && rightTie)
            return { points: 3, isExact: true, isCorrectResult: true };
        if (rightTie)
            return { points: 1, isExact: false, isCorrectResult: true };
        return { points: 0, isExact: false, isCorrectResult: false };
    }
    // Group stage or knockout non-draw: exact = score, correct = result (G/E/P or winner)
    if (predHome === homeScore && predAway === awayScore) {
        return { points: 3, isExact: true, isCorrectResult: true };
    }
    let rightResult;
    if (isDraw) {
        rightResult = predHome === predAway;
    }
    else {
        const homeWon = homeScore > awayScore;
        rightResult = homeWon ? predHome > predAway : predHome < predAway;
    }
    if (rightResult)
        return { points: 1, isExact: false, isCorrectResult: true };
    return { points: 0, isExact: false, isCorrectResult: false };
}
async function scoreMatchPredictions(match) {
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
        const result = computePoints(homeScore, awayScore, winner, match.phase, pred.homeScore, pred.awayScore, pred.tieWinner);
        batch.update(predDoc.ref, {
            points: result.points,
            isExact: result.isExact,
            isCorrectResult: result.isCorrectResult,
        });
        batch.update(db.collection('users').doc(pred.userId), {
            'stats.totalPoints': firestore_2.FieldValue.increment(result.points),
            'stats.exactPredictions': firestore_2.FieldValue.increment(result.isExact ? 1 : 0),
            'stats.correctPredictions': firestore_2.FieldValue.increment(result.isCorrectResult ? 1 : 0),
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
        batch.update(predDoc.ref, { points: null, isExact: null, isCorrectResult: null });
        batch.update(db.collection('users').doc(pred.userId), {
            'stats.totalPoints': firestore_2.FieldValue.increment(-pts),
            'stats.exactPredictions': firestore_2.FieldValue.increment(pred.isExact ? -1 : 0),
            'stats.correctPredictions': firestore_2.FieldValue.increment(pred.isCorrectResult ? -1 : 0),
        });
    }
    await batch.commit();
}
async function rescoreMatchPredictions(oldMatch, newMatch) {
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
        const newResult = computePoints(newHome, newAway, newWinner, newMatch.phase, pred.homeScore, pred.awayScore, pred.tieWinner);
        const oldPts = (_a = pred.points) !== null && _a !== void 0 ? _a : 0;
        const ptsDelta = newResult.points - oldPts;
        const exactDelta = (newResult.isExact ? 1 : 0) - (pred.isExact ? 1 : 0);
        const correctDelta = (newResult.isCorrectResult ? 1 : 0) - (pred.isCorrectResult ? 1 : 0);
        batch.update(predDoc.ref, {
            points: newResult.points,
            isExact: newResult.isExact,
            isCorrectResult: newResult.isCorrectResult,
        });
        if (ptsDelta !== 0 || exactDelta !== 0 || correctDelta !== 0) {
            batch.update(db.collection('users').doc(pred.userId), {
                'stats.totalPoints': firestore_2.FieldValue.increment(ptsDelta),
                'stats.exactPredictions': firestore_2.FieldValue.increment(exactDelta),
                'stats.correctPredictions': firestore_2.FieldValue.increment(correctDelta),
            });
        }
    }
    await batch.commit();
}
// Awards +5pts to user(s) with most exact group stage predictions once all are finished.
async function checkAndAwardGroupBonus() {
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
    const exactCountsByUser = {};
    const CHUNK = 30;
    for (let i = 0; i < matchIds.length; i += CHUNK) {
        const chunk = matchIds.slice(i, i + CHUNK);
        const predsSnap = await db.collection('predictions')
            .where('matchId', 'in', chunk)
            .where('isExact', '==', true)
            .get();
        predsSnap.docs.forEach(d => {
            var _a;
            const uid = d.data().userId;
            exactCountsByUser[uid] = ((_a = exactCountsByUser[uid]) !== null && _a !== void 0 ? _a : 0) + 1;
        });
    }
    if (Object.keys(exactCountsByUser).length === 0)
        return;
    const maxExact = Math.max(...Object.values(exactCountsByUser));
    const winners = Object.entries(exactCountsByUser)
        .filter(([, count]) => count === maxExact)
        .map(([uid]) => uid);
    const batch = db.batch();
    for (const uid of winners) {
        batch.update(db.collection('users').doc(uid), {
            'stats.totalPoints': firestore_2.FieldValue.increment(5),
        });
    }
    await batch.commit();
}
exports.onMatchUpdated = (0, firestore_1.onDocumentUpdated)('matches/{matchId}', async (event) => {
    var _a, _b;
    const matchId = event.params.matchId;
    const beforeData = (_a = event.data) === null || _a === void 0 ? void 0 : _a.before.data();
    const afterData = (_b = event.data) === null || _b === void 0 ? void 0 : _b.after.data();
    if (!beforeData || !afterData)
        return;
    const oldMatch = Object.assign(Object.assign({}, beforeData), { id: matchId });
    const newMatch = Object.assign(Object.assign({}, afterData), { id: matchId });
    const wasFinished = oldMatch.status === 'finished' &&
        oldMatch.homeScore != null && oldMatch.awayScore != null;
    const isFinished = newMatch.status === 'finished' &&
        newMatch.homeScore != null && newMatch.awayScore != null;
    if (!wasFinished && !isFinished)
        return;
    if (!wasFinished && isFinished) {
        await scoreMatchPredictions(newMatch);
        if (newMatch.phase === 'group_stage') {
            await checkAndAwardGroupBonus();
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
            await rescoreMatchPredictions(oldMatch, newMatch);
        }
    }
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
    const normalize = (s) => (s !== null && s !== void 0 ? s : '').trim().toLowerCase();
    const usersSnap = await db.collection('users').get();
    const batch = db.batch();
    for (const userDoc of usersSnap.docs) {
        const bp = userDoc.data().bonusPredictions;
        if (!bp || bp.pointsAwarded)
            continue;
        let pts = 0;
        if (normalize(bp.topScorer) === normalize(topScorer))
            pts += 5;
        if (normalize(bp.goldenBall) === normalize(goldenBall))
            pts += 5;
        if (bp.mexicoPhase === mexicoPhase)
            pts += 5;
        if (bp.champion === champion)
            pts += 5;
        batch.update(userDoc.ref, {
            'bonusPredictions.pointsAwarded': true,
            'stats.totalPoints': firestore_2.FieldValue.increment(pts),
        });
    }
    await batch.commit();
    return { success: true };
});
//# sourceMappingURL=index.js.map