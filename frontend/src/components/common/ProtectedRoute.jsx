import { Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

export default function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="page-loader">
        <div className="spinner text-primary-500" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return children;
}
