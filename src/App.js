// src/App.js
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import PrivateRoute from "./components/PrivateRoute";
import Login from "./pages/Login";
import DashboardLayout from "./pages/DashboardLayout";
import Home from "./pages/Home";
import Categories from "./pages/Categories";
import Products from "./pages/Products";
import "./styles.css";

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            path="/dashboard"
            element={
              <PrivateRoute>
                <DashboardLayout />
              </PrivateRoute>
            }
          >
            <Route index element={<Home />} />
            <Route path="categories" element={<Categories />} />
            <Route path="products" element={<Products />} />
            <Route path="products/:category" element={<Products />} />
          </Route>
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
