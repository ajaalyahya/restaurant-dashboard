import { NavLink, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useState } from "react";

const Sidebar = () => {
  const { logout, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // تحديد الفرع الحالي من الـ URL
  const isAramco = location.pathname.includes("aramco");
  const [activeBranch, setActiveBranch] = useState(isAramco ? "aramco" : "main");

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const switchBranch = (branch) => {
    setActiveBranch(branch);
    if (branch === "aramco") {
      navigate("/dashboard/categories/aramco");
    } else {
      navigate("/dashboard/categories");
    }
  };

  const mainNav = [
    { to: "/dashboard",            label: "الرئيسية", icon: "🏠", end: true },
    { to: "/dashboard/categories", label: "الأصناف",  icon: "📂" },
    { to: "/dashboard/products",   label: "المنتجات", icon: "🍽" },
  ];

  const aramcoNav = [
    { to: "/dashboard",                   label: "الرئيسية",       icon: "🏠", end: true },
    { to: "/dashboard/categories/aramco", label: "الأصناف",        icon: "📂" },
    { to: "/dashboard/products/aramco",   label: "المنتجات",       icon: "🍽" },
  ];

  const navItems = activeBranch === "aramco" ? aramcoNav : mainNav;

  return (
    <aside className="sidebar">

      {/* الشعار */}
      <div style={{
        display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center",
        padding: "24px 20px 16px",
        borderBottom: "1px solid rgba(243,231,217,0.12)",
        gap: 10,
      }}>
        <img src="/mostakanMain.png" alt="مستكن"
          style={{ width: 90, height: 90, borderRadius: 16, objectFit: "cover" }} />
      </div>

      {/* سويتش الفرع */}
      <div style={{
        padding: "12px 14px",
        borderBottom: "1px solid rgba(243,231,217,0.12)",
      }}>
        <p style={{ fontSize: 11, color: "rgba(243,231,217,0.45)", marginBottom: 8, textAlign: "center" }}>
          الفرع الحالي
        </p>
        <div style={{ display: "flex", borderRadius: 10, overflow: "hidden", border: "1px solid rgba(243,231,217,0.15)" }}>
          <button
            onClick={() => switchBranch("main")}
            style={{
              flex: 1, padding: "8px 0", fontSize: 12, fontWeight: 700,
              fontFamily: "inherit", cursor: "pointer", border: "none",
              background: activeBranch === "main" ? "#F3E7D9" : "transparent",
              color: activeBranch === "main" ? "#243C2C" : "rgba(243,231,217,0.5)",
              transition: "all 0.2s",
            }}
          >
            🏠 رئيسي
          </button>
          <button
            onClick={() => switchBranch("aramco")}
            style={{
              flex: 1, padding: "8px 0", fontSize: 12, fontWeight: 700,
              fontFamily: "inherit", cursor: "pointer", border: "none",
              borderRight: "1px solid rgba(243,231,217,0.15)",
              background: activeBranch === "aramco" ? "#F3E7D9" : "transparent",
              color: activeBranch === "aramco" ? "#243C2C" : "rgba(243,231,217,0.5)",
              transition: "all 0.2s",
            }}
          >
            🏭 أرامكو
          </button>
        </div>
      </div>

      {/* الناف */}
      <nav className="sidebar-nav">
        {navItems.map((item) => (
          <NavLink key={item.to} to={item.to} end={item.end}
            className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}>
            <span className="nav-icon">{item.icon}</span>
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="sidebar-footer">
        <div className="user-info">
          <div className="user-avatar">{user?.email?.[0]?.toUpperCase() || "M"}</div>
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