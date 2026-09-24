import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import CustomCursor from './components/CustomCursor';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Cases from './pages/Cases';
import CaseDetails from './pages/CaseDetails';
import Evidence from './pages/Evidence';
import EvidenceDetails from './pages/EvidenceDetails';
import UploadEvidence from './pages/UploadEvidence';
import Users from './pages/Users';
import AuditLogs from './pages/AuditLogs';
import Notifications from './pages/Notifications';
import Profile from './pages/Profile';
import Reports from './pages/Reports';
import SecurityCenter from './pages/SecurityCenter';
import SecurityEvents from './pages/SecurityEvents';
import SecurityEventDetails from './pages/SecurityEventDetails';
import NotFound from './pages/NotFound';

export default function App() {
  return (
    <>
      <CustomCursor />
      <Routes>
        <Route path="/login" element={<Login />} />

        <Route
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/cases" element={<Cases />} />
          <Route path="/cases/:id" element={<CaseDetails />} />
          <Route path="/evidence" element={<Evidence />} />
          <Route path="/evidence/:id" element={<EvidenceDetails />} />
          <Route
            path="/evidence/upload"
            element={
              <ProtectedRoute roles={['ADMIN', 'INVESTIGATOR']}>
                <UploadEvidence />
              </ProtectedRoute>
            }
          />
          <Route
            path="/users"
            element={
              <ProtectedRoute roles={['ADMIN']}>
                <Users />
              </ProtectedRoute>
            }
          />
          <Route
            path="/audit-logs"
            element={
              <ProtectedRoute roles={['ADMIN', 'SUPERVISOR']}>
                <AuditLogs />
              </ProtectedRoute>
            }
          />
          <Route
            path="/reports"
            element={
              <ProtectedRoute roles={['ADMIN', 'SUPERVISOR']}>
                <Reports />
              </ProtectedRoute>
            }
          />
          <Route
            path="/security"
            element={
              <ProtectedRoute roles={['ADMIN', 'SUPERVISOR']}>
                <SecurityCenter />
              </ProtectedRoute>
            }
          />
          <Route
            path="/security/events"
            element={
              <ProtectedRoute roles={['ADMIN', 'SUPERVISOR']}>
                <SecurityEvents />
              </ProtectedRoute>
            }
          />
          <Route
            path="/security/events/:id"
            element={
              <ProtectedRoute roles={['ADMIN', 'SUPERVISOR']}>
                <SecurityEventDetails />
              </ProtectedRoute>
            }
          />
          <Route path="/notifications" element={<Notifications />} />
          <Route path="/profile" element={<Profile />} />
        </Route>

        <Route path="*" element={<NotFound />} />
      </Routes>
    </>
  );
}
