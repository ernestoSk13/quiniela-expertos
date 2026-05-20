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
            </Route>
          </Route>

          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </ThemeProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}
