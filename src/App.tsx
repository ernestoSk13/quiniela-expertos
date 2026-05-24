import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider } from '@/context/AuthContext'
import { ThemeProvider } from '@/context/ThemeContext'
import { AdminRoute, GuestRoute, OnboardingRoute, ProtectedRoute } from '@/components/AuthGuard'
import Login from '@/pages/Login/Login'
import Onboarding from '@/pages/Onboarding/Onboarding'
import Dashboard from '@/pages/Dashboard/Dashboard'
import MatchdayPredictions from '@/pages/Predictions/MatchdayPredictions'
import AdminLayout from '@/pages/Admin/AdminLayout'
import MatchdayList from '@/pages/Admin/MatchdayList'
import MatchdayDetail from '@/pages/Admin/MatchdayDetail'
import AllowedUsers from '@/pages/Admin/AllowedUsers'
import UserProfiles from '@/pages/Admin/UserProfiles'
import BonusEvaluation from '@/pages/Admin/BonusEvaluation'
import AdminLeaderboard from '@/pages/Admin/AdminLeaderboard'
import AdminMetrics from '@/pages/Admin/AdminMetrics'
import AdminNotifications from '@/pages/Admin/AdminNotifications'
import ScoringConfig from '@/pages/Admin/ScoringConfig'
import InvitePage from '@/pages/Invite/InvitePage'
import Preferences from '@/pages/Preferences/Preferences'

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ThemeProvider>
          <Routes>
          {/* Pública */}
          <Route element={<GuestRoute />}>
            <Route path="/login" element={<Login />} />
          </Route>

          {/* Onboarding */}
          <Route element={<OnboardingRoute />}>
            <Route path="/onboarding" element={<Onboarding />} />
          </Route>

          {/* App */}
          <Route element={<ProtectedRoute />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/preferencias" element={<Preferences />} />
            <Route path="/jornada/:matchdayId" element={<MatchdayPredictions />} />
          </Route>

          {/* Admin */}
          <Route element={<AdminRoute />}>
            <Route path="/admin" element={<AdminLayout />}>
              <Route index element={<MatchdayList />} />
              <Route path="jornada/:matchdayId" element={<MatchdayDetail />} />
              <Route path="usuarios" element={<AllowedUsers />} />
              <Route path="jugadores" element={<UserProfiles />} />
              <Route path="bonus" element={<BonusEvaluation />} />
              <Route path="tabla" element={<AdminLeaderboard />} />
              <Route path="metricas" element={<AdminMetrics />} />
              <Route path="notificaciones" element={<AdminNotifications />} />
              <Route path="config" element={<ScoringConfig />} />
            </Route>
          </Route>

          {/* Pública — link de invitación (sin auth) */}
          <Route path="/invite/:token" element={<InvitePage />} />

          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </ThemeProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}
