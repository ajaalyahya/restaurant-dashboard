// src/components/Sidebar.js
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const Sidebar = () => {
  const { logout, user } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const navItems = [
    { to: "/dashboard",            label: "الرئيسية", icon: "🏠", end: true },
    { to: "/dashboard/categories", label: "الأصناف",  icon: "📂" },
    { to: "/dashboard/products",   label: "المنتجات", icon: "🍽" },
  ];

  return (
    <aside className="sidebar">

      {/* الشعار في المنتصف */}
      <div style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "28px 20px 20px",
        borderBottom: "1px solid rgba(243,231,217,0.12)",
        gap: 10,
      }}>
        <img
          src="/mostakanMain.png"
          alt="مستكن"
          style={{
            width: 100, height: 100,
            borderRadius: 16,
            objectFit: "cover",
          }}
        />
      </div>

      <nav className="sidebar-nav">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}
          >
            <span className="nav-icon">{item.icon}</span>
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="sidebar-footer">
        <div className="user-info">
          <div className="user-avatar">
            {user?.email?.[0]?.toUpperCase() || "M"}
          </div>
          <div className="user-details">
            <div className="user-email">{user?.email}</div>
            <div className="user-role">مدير النظام</div>
          </div>
        </div>
        <button onClick={handleLogout} className="logout-btn">
          <span>خروج</span>
          <span>→</span>
        </button>
      </div>

    </aside>
  );
};

export default Sidebar;