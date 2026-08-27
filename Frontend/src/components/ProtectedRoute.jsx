import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

function ProtectedRoute({ children }) {
    const { user, token, authLoading } = useAuth();

    if (authLoading) {
        return null; // could render a spinner here; kept minimal to avoid a flash
    }

    if (!user || !token) {
        return <Navigate to="/login" replace />;
    }

    return children;
}

export default ProtectedRoute;
