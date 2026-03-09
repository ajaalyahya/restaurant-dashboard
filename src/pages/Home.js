// src/pages/Home.js
import { useEffect, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../firebase/config";
import { useAuth } from "../context/AuthContext";
import { Link } from "react-router-dom";

const Home = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({ categories: 0, products: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [catSnap, prodSnap] = await Promise.all([
          getDocs(collection(db, "categories")),
          getDocs(collection(db, "products")),
        ]);
        setStats({ categories: catSnap.size, products: prodSnap.size });
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? "صباح الخير" : hour < 17 ? "مساء الخير" : "مساء النور";

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">
            {greeting}،{" "}
            <span className="accent">{user?.email?.split("@")[0]}</span>
          </h1>
          <p className="page-desc">إليك نظرة عامة على القائمة</p>
        </div>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon cat-icon">📂</div>
          <div className="stat-info">
            <div className="stat-value">
              {loading ? "—" : stats.categories}
            </div>
            <div className="stat-label">إجمالي الأصناف</div>
          </div>
          <Link to="/dashboard/categories" className="stat-link">
            إدارة الأصناف →
          </Link>
        </div>

        <div className="stat-card">
          <div className="stat-icon prod-icon">🍽</div>
          <div className="stat-info">
            <div className="stat-value">
              {loading ? "—" : stats.products}
            </div>
            <div className="stat-label">إجمالي المنتجات</div>
          </div>
          <Link to="/dashboard/products" className="stat-link">
            إدارة المنتجات →
          </Link>
        </div>
      </div>

      <div className="quick-actions">
        <h2 className="section-title">إجراءات سريعة</h2>
        <div className="actions-grid">
          <Link to="/dashboard/categories" className="action-card">
            <span className="action-icon">◈</span>
            <span className="action-label">إضافة صنف جديد</span>
          </Link>
          <Link to="/dashboard/products" className="action-card">
            <span className="action-icon">◉</span>
            <span className="action-label">إضافة منتج جديد</span>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Home;
