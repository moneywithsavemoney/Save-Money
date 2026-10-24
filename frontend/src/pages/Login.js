import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { API } from "../config";

export default function Login() {
  const navigate = useNavigate();

  const [mode, setMode] = useState("email");
  const [email, setEmail] = useState("");
  const [mobile, setMobile] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [remember, setRemember] = useState(false);
  const [loading, setLoading] = useState(false);
  const [otpLoading, setOtpLoading] = useState(false);
  const [message, setMessage] = useState("");

  // 🔹 আপনার অ্যাপ লোগো (public ফোল্ডারে logo512.png নামে আছে)
  const appLogoUrl = "/logo512.png";

  useEffect(() => {
    const savedRemember = localStorage.getItem("rememberMe") === "true";
    const savedMode = localStorage.getItem("rememberMode") || "email";
    const savedLogin = localStorage.getItem("rememberLogin") || "";

    setRemember(savedRemember);
    if (savedRemember && savedLogin) {
      setMode(savedMode);
      if (savedMode === "mobile") {
        setMobile(savedLogin);
      } else {
        setEmail(savedLogin);
      }
    }
  }, []);

  const saveLogin = (data) => {
    const token = data.token || data.accessToken;

    localStorage.setItem("token", token || "");
    localStorage.setItem("accessToken", token || "");
    localStorage.setItem("email", data.email || data.user?.email || "");
    localStorage.setItem("name", data.name || data.user?.name || "");
    localStorage.setItem("role", data.role || data.user?.role || "user");

    if (data.user) {
      localStorage.setItem("user", JSON.stringify(data.user));
    }

    if (remember) {
      localStorage.setItem("rememberMe", "true");
      localStorage.setItem("rememberLogin", mode === "email" ? email : mobile);
      localStorage.setItem("rememberMode", mode);
    } else {
      localStorage.removeItem("rememberMe");
      localStorage.removeItem("rememberLogin");
      localStorage.removeItem("rememberMode");
    }

    const role = data.role || data.user?.role || "user";
    const currentEmail = data.email || data.user?.email || email;

    if (role === "admin") {
      navigate("/admin", { replace: true });
    } else if (role === "demo" || currentEmail.toLowerCase() === "demouser@gmail.com") {
      navigate("/ecommerce-home", { replace: true });
    } else {
      localStorage.setItem("showLoginPopup", "true");
      navigate("/home", { replace: true });
    }
  };

  const loginEmail = async () => {
    if (!email || !password) {
      setMessage("Please enter email and password");
      return;
    }

    if (email.trim().toLowerCase() === "demouser@gmail.com" && password === "demo@demo") {
      const demoData = {
        token: "demo-secret-token",
        email: "demouser@gmail.com",
        name: "Demo User",
        role: "demo"
      };
      saveLogin(demoData);
      return;
    }

    try {
      setLoading(true);
      setMessage("");

      const res = await fetch(`${API}/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          password
        })
      });

      const data = await res.json();

      if (!res.ok) {
        setMessage(data.msg || "Login failed");
        return;
      }

      saveLogin(data);
    } catch (err) {
      console.log("LOGIN ERROR:", err);
      setMessage("Backend connection failed");
    } finally {
      setLoading(false);
    }
  };

  const sendOtp = async () => {
    if (!mobile) {
      setMessage("Please enter mobile number");
      return;
    }

    try {
      setOtpLoading(true);
      setMessage("");

      const res = await fetch(`${API}/send-login-otp`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          mobile: mobile.trim()
        })
      });

      const data = await res.json();
      setMessage(data.msg || "OTP sent successfully");
    } catch (err) {
      console.log("OTP ERROR:", err);
      setMessage("OTP send failed");
    } finally {
      setOtpLoading(false);
    }
  };

  const loginMobile = async () => {
    if (!mobile || !otp) {
      setMessage("Please enter mobile number and OTP");
      return;
    }

    try {
      setLoading(true);
      setMessage("");

      const res = await fetch(`${API}/mobile-login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          mobile: mobile.trim(),
          otp: otp.trim()
        })
      });

      const data = await res.json();

      if (!res.ok) {
        setMessage(data.msg || "Mobile login failed");
        return;
      }

      saveLogin(data);
    } catch (err) {
      console.log("MOBILE LOGIN ERROR:", err);
      setMessage("Backend connection failed");
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = () => {
    if (mode === "email") {
      loginEmail();
    } else {
      loginMobile();
    }
  };

  const handleGoogleLogin = () => {
    console.log("Google Login Clicked");
  };

  const handleFacebookLogin = () => {
    console.log("Facebook Login Clicked");
  };

  const handleAppleLogin = () => {
    console.log("Apple Login Clicked");
  };

  return (
    <div style={styles.page}>
      <style>{animationStyles}</style>

      <div style={styles.mainCard}>

        {/* 🔹 টপ ব্যানার ও লোগো সেকশন (স্ক্রিনশটের মতো হুবহু) */}
        <div style={styles.topBannerArea}>
          <div style={styles.brandRow}>
            <div style={styles.logoBox}>
              <img 
                src={appLogoUrl} 
                alt="Logo" 
                style={styles.logoImg}
                onError={(e) => {
                  e.target.style.display = 'none';
                }}
              />
            </div>
            <div>
              <h2 style={styles.brandTitle}>SAVE MONEY</h2>
              <div style={styles.brandSubLine}></div>
              <p style={styles.brandSubText}>Save & Earn</p>
            </div>
            <div style={styles.piggyArea}>
              <div style={styles.piggyCoin}>₹</div>
              <div style={styles.piggyEmoji}>🐷</div>
            </div>
          </div>

          <h1 style={styles.welcomeTitle}>Welcome Back!</h1>
          <p style={styles.welcomeSub}>
            Login to continue your financial journey
          </p>
        </div>

        {/* 🔹 লগইন ফর্ম বক্স */}
        <div style={styles.loginBox}>

          <div style={styles.switchTop}>
            <div style={styles.switchBox}>
              <button
                type="button"
                style={{
                  ...styles.switchBtn,
                  ...(mode === "email" ? styles.switchActive : {})
                }}
                onClick={() => setMode("email")}
              >
                ✉ Email
              </button>

              <button
                type="button"
                style={{
                  ...styles.switchBtn,
                  ...(mode === "mobile" ? styles.switchActive : {})
                }}
                onClick={() => setMode("mobile")}
              >
                📱 Mobile
              </button>
            </div>

            <button
              type="button"
              style={styles.changeBtn}
              onClick={() => setMode(mode === "email" ? "mobile" : "email")}
            >
              ⇄ Change
            </button>
          </div>

          {message && (
            <div style={styles.messageBox}>
              {message}
            </div>
          )}

          {mode === "email" ? (
            <div key="email-fields">
              <div style={styles.inputActive}>
                <div style={styles.inputIcon}>✉</div>
                <input
                  style={styles.input}
                  placeholder="Email ID"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
                <div style={styles.sideIcon}>👤</div>
              </div>

              <div style={styles.inputBox}>
                <div style={styles.inputIcon}>🔒</div>
                <input
                  style={styles.input}
                  placeholder="Password"
                  type={showPass ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  style={styles.eyeBtn}
                  onClick={() => setShowPass(!showPass)}
                >
                  👁
                </button>
              </div>
            </div>
          ) : (
            <div key="mobile-fields">
              <div style={styles.inputActive}>
                <div style={styles.inputIcon}>📱</div>
                <input
                  style={styles.input}
                  placeholder="Mobile Number"
                  value={mobile}
                  onChange={(e) => setMobile(e.target.value)}
                />
                <button
                  type="button"
                  style={styles.sendOtp}
                  onClick={sendOtp}
                >
                  {otpLoading ? "..." : "Send OTP"}
                </button>
              </div>

              <div style={styles.inputBox}>
                <div style={styles.inputIcon}>🔐</div>
                <input
                  style={styles.input}
                  placeholder="Enter OTP"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                />
                <div style={styles.sideIcon}>✓</div>
              </div>
            </div>
          )}

          <div style={styles.optionsRow}>
            <label style={styles.remember}>
              <input
                type="checkbox"
                checked={remember}
                onChange={(e) => setRemember(e.target.checked)}
                style={styles.checkbox}
              />
              Remember Me
            </label>

            <button
              type="button"
              style={styles.forgot}
              onClick={() => navigate("/forgot-password")}
            >
              Forgot Password?
            </button>
          </div>

          <button
            type="button"
            style={styles.loginBtn}
            onClick={handleLogin}
            disabled={loading}
          >
            <span style={styles.lockCircle}>🔒</span>
            {loading ? "Please Wait..." : "Login Now"}
            <span style={styles.arrowCircle}>›</span>
          </button>

          <div style={styles.orRow}>
            <span style={styles.orLine}></span>
            <p style={{ margin: 0 }}>OR</p>
            <span style={styles.orLine}></span>
          </div>

          <div style={styles.socialRow}>
            <p style={{ margin: 0 }}>Login with</p>
            <button type="button" style={styles.googleBtn} onClick={handleGoogleLogin}>G</button>
            <button type="button" style={styles.facebookBtn} onClick={handleFacebookLogin}>f</button>
            <button type="button" style={styles.appleBtn} onClick={handleAppleLogin}></button>
          </div>

        </div>

        {/* 🔹 রেজিস্ট্রেশন কার্ড (স্ক্রিনশটের মতো) */}
        <div style={styles.registerCard}>
          <div style={styles.registerIconBox}>
            👤+
          </div>

          <div style={styles.registerContent}>
            <h3 style={{ margin: "0 0 2px 0", fontSize: "15px", color: "#0f172a", fontWeight: "800" }}>Don’t have an account?</h3>
            <p style={{ margin: 0, fontSize: "12px", color: "#64748b" }}>Create a new account and start saving with us.</p>
          </div>

          <button
            type="button"
            style={styles.registerBtn}
            onClick={() => navigate("/register")}
          >
            👤+ Register
          </button>
        </div>

        {/* 🔹 ট্রাস্ট বা সিকিউরিটি ফিচার সেকশন */}
        <div style={styles.trustRow}>
          <Trust icon="🛡️" title="100% Secure" text="& Safe" />
          <Trust icon="🔒" title="Your Data is" text="Protected" />
          <Trust icon="🎧" title="24/7 Customer" text="Support" />
          <Trust icon="⭐" title="Trusted by" text="Thousands" />
        </div>

      </div>
    </div>
  );
}

function Trust({ icon, title, text }) {
  return (
    <div style={styles.trustItem}>
      <div style={styles.trustIcon}>{icon}</div>
      <div style={styles.trustTitle}>{title}</div>
      <div style={styles.trustSub}>{text}</div>
    </div>
  );
}

const animationStyles = `
  button, input {
    transition: all 0.25s ease-in-out !important;
  }
  input:focus {
    box-shadow: 0 0 0 3px rgba(14, 165, 233, 0.2) !important;
  }
`;

const styles = {
  page: {
    minHeight: "100vh",
    width: "100%",
    background: "linear-gradient(180deg, #10b981 0%, #065f46 50%, #022c22 100%)",
    padding: "20px 12px",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    fontFamily: "Arial, sans-serif",
    boxSizing: "border-box"
  },

  mainCard: {
    width: "100%",
    maxWidth: "520px",
    background: "#ffffff",
    borderRadius: "36px",
    padding: "0 0 24px 0",
    boxShadow: "0 25px 60px rgba(0,0,0,0.3)",
    overflow: "hidden",
    boxSizing: "border-box"
  },

  topBannerArea: {
    background: "linear-gradient(135deg, #022c22 0%, #064e3b 50%, #047857 100%)",
    color: "white",
    padding: "24px 22px 20px 22px",
    position: "relative"
  },

  brandRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: "16px"
  },

  logoBox: {
    width: "48px",
    height: "48px",
    borderRadius: "14px",
    background: "#ffffff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    boxShadow: "0 4px 10px rgba(0,0,0,0.2)",
    flexShrink: 0
  },

  logoImg: {
    width: "100%",
    height: "100%",
    objectFit: "cover"
  },

  brandTitle: {
    margin: 0,
    fontSize: "20px",
    fontWeight: "900",
    letterSpacing: "0.5px",
    color: "#ffffff"
  },

  brandSubLine: {
    width: "80px",
    height: "2px",
    background: "#38bdf8",
    margin: "3px 0"
  },

  brandSubText: {
    margin: 0,
    fontSize: "12px",
    color: "#38bdf8",
    fontWeight: "600",
    letterSpacing: "1px"
  },

  piggyArea: {
    position: "relative",
    width: "60px",
    height: "55px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "42px"
  },

  piggyCoin: {
    position: "absolute",
    top: "-4px",
    left: "8px",
    width: "20px",
    height: "20px",
    background: "#facc15",
    color: "#0f172a",
    borderRadius: "50%",
    fontSize: "11px",
    fontWeight: "bold",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    boxShadow: "0 2px 5px rgba(0,0,0,0.3)",
    zIndex: 2
  },

  piggyEmoji: {
    filter: "drop-shadow(0 4px 8px rgba(0,0,0,0.2))"
  },

  welcomeTitle: {
    margin: "10px 0 4px 0",
    fontSize: "28px",
    color: "#ffffff",
    fontWeight: "900",
    letterSpacing: "-0.5px"
  },

  welcomeSub: {
    margin: 0,
    fontSize: "13px",
    color: "#cbd5e1",
    fontWeight: "500"
  },

  loginBox: {
    margin: "-16px 16px 0 16px",
    background: "white",
    borderRadius: "28px",
    padding: "20px 18px",
    boxShadow: "0 10px 30px rgba(15,23,42,0.06)",
    border: "1px solid #edf0f7",
    boxSizing: "border-box",
    position: "relative",
    zIndex: 2
  },

  switchTop: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "16px",
    gap: "8px"
  },

  switchBox: {
    display: "flex",
    background: "#f1f5f9",
    borderRadius: "14px",
    padding: "3px",
    border: "1px solid #e2e8f0",
    flex: 1,
    maxWidth: "260px"
  },

  switchBtn: {
    flex: 1,
    height: "40px",
    border: "none",
    borderRadius: "12px",
    fontSize: "13px",
    fontWeight: "800",
    cursor: "pointer",
    background: "transparent",
    color: "#64748b"
  },

  switchActive: {
    background: "linear-gradient(135deg, #0ea5e9, #10b981)",
    color: "white",
    boxShadow: "0 4px 12px rgba(14,165,233,0.3)"
  },

  changeBtn: {
    background: "transparent",
    border: "none",
    color: "#0ea5e9",
    fontSize: "13px",
    fontWeight: "800",
    cursor: "pointer",
    padding: "4px"
  },

  messageBox: {
    textAlign: "center",
    marginBottom: "12px",
    color: "#0ea5e9",
    fontWeight: "800",
    fontSize: "12px",
    background: "#f0f9ff",
    padding: "8px",
    borderRadius: "10px"
  },

  inputActive: {
    height: "54px",
    borderRadius: "16px",
    border: "1.8px solid #0ea5e9",
    display: "flex",
    alignItems: "center",
    overflow: "hidden",
    marginTop: "12px",
    background: "white"
  },

  inputBox: {
    height: "54px",
    borderRadius: "16px",
    border: "1.5px solid #10b981",
    display: "flex",
    alignItems: "center",
    overflow: "hidden",
    marginTop: "12px",
    background: "white"
  },

  inputIcon: {
    width: "46px",
    height: "100%",
    background: "#f8fafc",
    color: "#0ea5e9",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "18px",
    flexShrink: 0
  },

  input: {
    flex: 1,
    border: "none",
    outline: "none",
    height: "100%",
    padding: "0 12px",
    fontSize: "15px",
    color: "#111827",
    background: "transparent",
    minWidth: 0
  },

  sideIcon: {
    width: "44px",
    color: "#9ca3af",
    fontSize: "16px",
    textAlign: "center"
  },

  eyeBtn: {
    width: "44px",
    border: "none",
    background: "transparent",
    fontSize: "16px",
    cursor: "pointer"
  },

  sendOtp: {
    marginRight: "6px",
    border: "none",
    borderRadius: "10px",
    padding: "8px 12px",
    background: "linear-gradient(135deg,#0ea5e9,#10b981)",
    color: "white",
    fontWeight: "800",
    fontSize: "12px",
    cursor: "pointer",
    whiteSpace: "nowrap"
  },

  optionsRow: {
    marginTop: "14px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "8px"
  },

  remember: {
    display: "flex",
    gap: "6px",
    color: "#334155",
    fontSize: "13px",
    alignItems: "center",
    cursor: "pointer",
    fontWeight: "600"
  },

  checkbox: {
    width: "16px",
    height: "16px"
  },

  forgot: {
    border: "none",
    background: "transparent",
    color: "#2563eb",
    fontSize: "13px",
    fontWeight: "800",
    cursor: "pointer"
  },

  loginBtn: {
    marginTop: "18px",
    width: "100%",
    height: "56px",
    border: "none",
    borderRadius: "16px",
    background: "linear-gradient(90deg, #0062ff 0%, #00c6ff 100%)",
    color: "white",
    fontSize: "18px",
    fontWeight: "800",
    position: "relative",
    cursor: "pointer",
    boxShadow: "0 8px 20px rgba(0, 98, 255, 0.35)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center"
  },

  lockCircle: {
    position: "absolute",
    left: "12px",
    top: "9px",
    width: "38px",
    height: "38px",
    borderRadius: "50%",
    background: "rgba(255,255,255,0.2)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    fontSize: "16px"
  },

  arrowCircle: {
    position: "absolute",
    right: "12px",
    top: "9px",
    width: "38px",
    height: "38px",
    borderRadius: "50%",
    background: "white",
    color: "#0062ff",
    fontSize: "26px",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    fontWeight: "bold"
  },

  orRow: {
    marginTop: "18px",
    display: "flex",
    alignItems: "center",
    gap: "12px",
    justifyContent: "center",
    color: "#94a3b8",
    fontWeight: "800",
    fontSize: "12px"
  },

  orLine: {
    flex: 1,
    height: "1px",
    background: "#e2e8f0"
  },

  socialRow: {
    marginTop: "14px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "12px",
    fontSize: "13px",
    color: "#64748b"
  },

  googleBtn: {
    width: "38px",
    height: "38px",
    borderRadius: "50%",
    border: "1px solid #e2e8f0",
    background: "white",
    color: "#ef4444",
    fontWeight: "900",
    fontSize: "15px",
    cursor: "pointer"
  },

  facebookBtn: {
    width: "38px",
    height: "38px",
    borderRadius: "50%",
    border: "1px solid #e2e8f0",
    background: "#2563eb",
    color: "white",
    fontWeight: "900",
    fontSize: "16px",
    cursor: "pointer"
  },

  appleBtn: {
    width: "38px",
    height: "38px",
    borderRadius: "50%",
    border: "1px solid #e2e8f0",
    background: "#111827",
    color: "white",
    fontWeight: "900",
    fontSize: "16px",
    cursor: "pointer"
  },

  registerCard: {
    width: "calc(100% - 32px)",
    margin: "14px auto 0 auto",
    background: "linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)",
    borderRadius: "20px",
    padding: "14px 16px",
    display: "flex",
    alignItems: "center",
    gap: "12px",
    boxShadow: "0 4px 15px rgba(15,23,42,0.04)",
    border: "1px solid #e2e8f0",
    boxSizing: "border-box"
  },

  registerIconBox: {
    width: "42px",
    height: "42px",
    borderRadius: "14px",
    background: "linear-gradient(135deg, #38bdf8, #818cf8)",
    color: "white",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "18px",
    fontWeight: "bold",
    flexShrink: 0,
    boxShadow: "0 4px 10px rgba(56, 189, 248, 0.3)"
  },

  registerContent: {
    flex: 1
  },

  registerBtn: {
    border: "1.8px solid #d946ef",
    background: "white",
    color: "#9333ea",
    padding: "10px 14px",
    borderRadius: "14px",
    fontWeight: "800",
    fontSize: "12px",
    cursor: "pointer",
    whiteSpace: "nowrap",
    boxShadow: "0 4px 10px rgba(217, 70, 239, 0.15)"
  },

  trustRow: {
    width: "calc(100% - 32px)",
    margin: "16px auto 0 auto",
    display: "grid",
    gridTemplateColumns: "repeat(4, 1fr)",
    gap: "8px",
    boxSizing: "border-box"
  },

  trustItem: {
    textAlign: "center",
    color: "#334155",
    background: "#f8fafc",
    padding: "10px 4px",
    borderRadius: "14px",
    border: "1px solid #e2e8f0"
  },

  trustIcon: {
    fontSize: "20px",
    marginBottom: "4px"
  },

  trustTitle: {
    fontSize: "10px",
    fontWeight: "800",
    color: "#0f172a",
    lineHeight: "1.2"
  },

  trustSub: {
    fontSize: "10px",
    fontWeight: "700",
    color: "#64748b",
    lineHeight: "1.2"
  }
};
