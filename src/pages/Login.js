// src/pages/Login.js
import { useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../firebase/config";
import { useNavigate } from "react-router-dom";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      navigate("/dashboard");
    } catch (err) {
      setError("البريد الإلكتروني أو كلمة المرور غير صحيحة");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.page}>

      {/* خلفية متحركة */}
      <div style={styles.bgLayer} />

      {/* الكارد */}
      <div style={styles.card}>

        {/* الشعار */}
        <img
          src="/mostakanMain.png"
          alt="مستكن"
          style={styles.logo}
        />

        <h1 style={styles.title}>تسجيل الدخول</h1>
        <p style={styles.sub}>لوحة التحكم</p>

        <form onSubmit={handleLogin} style={styles.form}>

          {/* البريد */}
          <div style={styles.group}>
            <label style={styles.label}>البريد الإلكتروني</label>
            <input
              type="email"
              placeholder="ادخل البريد الالكتروني"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              dir="ltr"
              style={styles.input}
              onFocus={(e) => (e.target.style.borderColor = "#243C2C")}
              onBlur={(e)  => (e.target.style.borderColor = "rgba(36,60,44,0.2)")}
            />
          </div>

          {/* كلمة المرور */}
          <div style={styles.group}>
            <label style={styles.label}>كلمة المرور</label>
            <input
              type="password"
              placeholder="ادخل كلمة السر"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              dir="ltr"
              style={styles.input}
              onFocus={(e) => (e.target.style.borderColor = "#243C2C")}
              onBlur={(e)  => (e.target.style.borderColor = "rgba(36,60,44,0.2)")}
            />
          </div>

          {error && <div style={styles.error}>{error}</div>}

          <button
            type="submit"
            disabled={loading}
            style={{
              ...styles.btn,
              opacity: loading ? 0.7 : 1,
              cursor: loading ? "not-allowed" : "pointer",
            }}
            onMouseEnter={(e) => { if (!loading) e.target.style.background = "#1a2e20"; }}
            onMouseLeave={(e) => { if (!loading) e.target.style.background = "#243C2C"; }}
          >
            {loading
              ? <span style={styles.spinner} />
              : "دخول "
            }
          </button>

        </form>
      </div>

      <style>{`
        @keyframes moveBg {
          from { background-position: 0 0; }
          to   { background-position: -2000px 0; }
        }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

const styles = {
  page: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
    overflow: "hidden",
    background: "#243c2c",
    fontFamily: "'IBM Plex Sans Arabic', sans-serif",
    direction: "rtl",
  },

  bgLayer: {
    position: "absolute",
    inset: 0,
    backgroundImage: "url(/bg.png)",
    backgroundRepeat: "repeat-x",
    backgroundSize: "cover",
    animation: "moveBg 40s linear infinite",
    zIndex: 0,
  },

  card: {
    position: "relative",
    zIndex: 1,
    background: "rgba(34, 68, 46, 0.75)",
    backdropFilter: "blur(16px)",
    WebkitBackdropFilter: "blur(16px)",
    border: "1px solid rgba(243,231,217,0.2)",
    borderRadius: 24,
    padding: "40px 36px",
    width: "100%",
    maxWidth: 420,
    margin: "0 16px",
    boxShadow: "0 24px 64px rgba(0,0,0,0.4)",
    animation: "fadeUp 0.4s ease",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
  },

  logo: {
    width: 100,
    height: 100,
    objectFit: "cover",
    marginBottom: 16,
  },

  title: {
    fontSize: 26,
    fontWeight: 700,
    color: "#F3E7D9",
    margin: "0 0 4px",
    textAlign: "center",
  },

  sub: {
    fontSize: 20,
    color: "rgba(243,231,217,0.55)",
    margin: "0 0 28px",
    textAlign: "center",
  },

  form: {
    width: "100%",
    display: "flex",
    flexDirection: "column",
    gap: 16,
  },

  group: {
    display: "flex",
    flexDirection: "column",
    gap: 6,
  },

  label: {
    fontSize: 13,
    fontWeight: 500,
    color: "rgba(243,231,217,0.7)",
  },

  input: {
    width: "100%",
    padding: "11px 14px",
    borderRadius: 12,
    border: "1px solid rgba(36,60,44,0.2)",
    background: "rgba(243,231,217,0.92)",
    color: "#1a1a1a",
    fontSize: 14,
    fontFamily: "inherit",
    outline: "none",
    transition: "border-color 0.2s",
    boxSizing: "border-box",
  },

  error: {
    padding: "10px 14px",
    background: "rgba(192,57,43,0.15)",
    border: "1px solid rgba(192,57,43,0.3)",
    borderRadius: 10,
    color: "#f08070",
    fontSize: 13,
    textAlign: "center",
  },

  btn: {
    width: "100%",
    padding: "12px",
    background: "#243C2C",
    color: "#F3E7D9",
    border: "none",
    borderRadius: 12,
    fontSize: 16,
    fontWeight: 700,
    fontFamily: "inherit",
    cursor: "pointer",
    transition: "background 0.2s",
    marginTop: 4,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    minHeight: 48,
  },

  spinner: {
    width: 18,
    height: 18,
    border: "2px solid rgba(243,231,217,0.3)",
    borderTopColor: "#F3E7D9",
    borderRadius: "50%",
    display: "inline-block",
    animation: "spin 0.7s linear infinite",
  },
};

export default Login;