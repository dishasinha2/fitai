import { Navigate } from 'react-router-dom';
import { hasToken } from '../lib/session';

function ProtectedRoute({ children }) {
  if (!hasToken()) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

export default ProtectedRoute;
