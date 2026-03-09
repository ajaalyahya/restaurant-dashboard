// src/components/PrivateRoute.js
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const PrivateRoute = ({ children }) => {
  const { user } = useAuth();

  if (user === undefined) {
    return (
      <div style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        height: "100vh",
        background: "#0a0a0f"
      }}>
        <div className="loader" />
      </div>
    );
  }

  return user ? children : <Navigate to="/login" replace />;
};

export default PrivateRoute;
