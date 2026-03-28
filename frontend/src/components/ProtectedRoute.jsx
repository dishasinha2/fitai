import { Navigate } from 'react-router-dom';
import { getStoredUser, hasToken } from '../lib/session';

function ProtectedRoute({ children, adminOnly = false }) {
  if (!hasToken()) {
    return <Navigate to="/login" replace />;
  }

  if (adminOnly && getStoredUser()?.role !== 'admin') {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}

export default ProtectedRoute;
