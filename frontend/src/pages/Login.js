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

  // পেজ লোড হওয়ার সময় Remember Me চেক করা থাকলে ডেটা রিকভার করে ফিল্ডে বসিয়ে দিবে
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

    // Remember Me লজিক সঠিকভাবে হ্যান্ডেল করা
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

    if (role === "admin") {
      navigate("/admin", { replace: true });
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

      <div style={styles.bgCircleOne}></div>
      <div style={styles.bgCircleTwo}></div>
      <div style={styles.bgPill}></div>

      <div style={styles.mainCard}>

        <div style={styles.logoArea}>

          <div style={styles.piggyBase}>
            <div style={styles.coin}>₹</div>

            <div style={styles.piggy}>
              <span style={styles.earLeft}></span>
              <span style={styles.earRight}></span>
              <span style={styles.eyeLeft}></span>
              <span style={styles.eyeRight}></span>
              <span style={styles.nose}>••</span>
              <span style={styles.legLeft}></span>
              <span style={styles.legRight}></span>
            </div>
          </div>

          <h1 style={styles.logoText}>
            <span style={styles.logoSave}>save</span>{" "}
            <span style={styles.logoMoney}>money</span>
          </h1>

         <div style={styles.tagline}>
          <span style={styles.taglineLine}></span>
          <p style={{ margin: 0 }}>Save Today, Secure Tomorrow</p>
          <span style={styles.taglineLine}></span>
        </div>

          <h2 style={styles.welcomeTitle}>Welcome Back!</h2>
          <p style={styles.welcomeSub}>
            Login to continue your financial journey
          </p>
        </div>

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
            <>
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
            </>
          ) : (
            <>
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
            </>
          )}

          <div style={styles.optionsRow}>
            <label style={styles.remember}>
              <input
                type="checkbox"
                checked={remember}
                onChange={(e) => setRemember(e.target.checked)}
              />
              Remember Me
            </label>

           <button
              type="button"
              style={styles.forgot}
              onClick={() => {
                console.log("Forgot clicked");
                navigate("/forgot-password");
              }}
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

        <div style={styles.registerCard}>
          <div style={styles.registerIcon}>🪪</div>

          <div style={styles.registerContent}>
            <h3 style={{ margin: "0 0 4px 0", fontSize: "16px" }}>Don’t have an account?</h3>
            <p style={{ margin: 0, fontSize: "13px", color: "#64748b" }}>Create a new account and start saving with us.</p>
          </div>

          <button
            type="button"
            style={styles.registerBtn}
            onClick={() => navigate("/register")}
          >
            👤+ Register
          </button>
        </div>

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
      <p style={{ margin: 0 }}>
        {title}
        <br />
        {text}
      </p>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    width: "100%",
    maxWidth: "100vw",
    background: "linear-gradient(135deg,#e9f4ff 0%,#f7f1ff 45%,#ffeef8 100%)",
    padding: "16px 12px",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    fontFamily: "Arial, sans-serif",
    position: "relative",
    overflowX: "hidden",
    boxSizing: "border-box"
  },

  bgCircleOne: {
    position: "fixed",
    top: "-90px",
    left: "10%",
    width: "200px",
    height: "200px",
    border: "20px solid rgba(167,139,250,0.18)",
    borderRadius: "50%",
    pointerEvents: "none"
  },

  bgCircleTwo: {
    position: "fixed",
    right: "-40px",
    top: "42%",
    width: "120px",
    height: "80px",
    background: "rgba(244,114,182,0.25)",
    borderRadius: "90px",
    pointerEvents: "none"
  },

  bgPill: {
    position: "fixed",
    left: "-50px",
    bottom: "50px",
    width: "120px",
    height: "160px",
    background: "rgba(216,180,254,0.3)",
    borderRadius: "90px",
    transform: "rotate(35deg)",
    pointerEvents: "none"
  },

  mainCard: {
    width: "100%",
    maxWidth: "760px",
    background: "rgba(255,255,255,0.92)",
    borderRadius: "28px",
    padding: "24px 16px",
    boxShadow: "0 20px 50px rgba(99,102,241,0.15)",
    border: "1px solid rgba(255,255,255,0.9)",
    position: "relative",
    overflow: "hidden",
    zIndex: 2,
    boxSizing: "border-box"
  },

  logoArea: {
    textAlign: "center",
    position: "relative",
    zIndex: 2
  },

  piggyBase: {
    width: "150px",
    height: "115px",
    margin: "0 auto 10px",
    position: "relative",
    background: "linear-gradient(135deg,#7c3aed,#d946ef)",
    borderRadius: "70px 70px 24px 24px",
    display: "flex",
    justifyContent: "center",
    alignItems: "flex-end"
  },

  coin: {
    position: "absolute",
    top: "-14px",
    width: "42px",
    height: "42px",
    borderRadius: "50%",
    background: "linear-gradient(135deg,#facc15,#f97316)",
    color: "#92400e",
    fontWeight: "900",
    fontSize: "22px",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    border: "3px solid #ffd166",
    zIndex: 4
  },

  piggy: {
    width: "110px",
    height: "70px",
    background: "linear-gradient(135deg,#ffc2d1,#ff8fab)",
    borderRadius: "45px 50px 35px 35px",
    position: "relative",
    marginBottom: "14px"
  },

  earLeft: {
    position: "absolute",
    top: "-12px",
    left: "20px",
    width: "24px",
    height: "24px",
    background: "#ff8fab",
    borderRadius: "8px 18px 8px 18px",
    transform: "rotate(28deg)"
  },

  earRight: {
    position: "absolute",
    top: "-10px",
    right: "18px",
    width: "20px",
    height: "20px",
    background: "#ff8fab",
    borderRadius: "8px 16px 8px 16px",
    transform: "rotate(45deg)"
  },

  eyeLeft: {
    position: "absolute",
    top: "22px",
    left: "60px",
    width: "6px",
    height: "6px",
    background: "#111827",
    borderRadius: "50%"
  },

  eyeRight: {
    position: "absolute",
    top: "22px",
    left: "78px",
    width: "6px",
    height: "6px",
    background: "#111827",
    borderRadius: "50%"
  },

  nose: {
    position: "absolute",
    right: "-6px",
    top: "28px",
    width: "28px",
    height: "20px",
    background: "#fb7185",
    borderRadius: "50%",
    color: "#7f1d1d",
    fontSize: "8px",
    display: "flex",
    justifyContent: "center",
    alignItems: "center"
  },

  legLeft: {
    position: "absolute",
    bottom: "-5px",
    left: "28px",
    width: "16px",
    height: "12px",
    background: "#fb7185",
    borderRadius: "0 0 6px 6px"
  },

  legRight: {
    position: "absolute",
    bottom: "-5px",
    right: "26px",
    width: "16px",
    height: "12px",
    background: "#fb7185",
    borderRadius: "0 0 6px 6px"
  },

  logoText: {
    margin: 0,
    fontSize: "clamp(32px, 8vw, 48px)",
    lineHeight: "1.1",
    fontWeight: "900",
    letterSpacing: "-1px"
  },

  logoSave: {
    color: "#071b4d"
  },

  logoMoney: {
    color: "#22c55e"
  },

  tagline: {
    marginTop: "8px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "10px",
    color: "#4b5563",
    fontSize: "14px"
  },

  taglineLine: {
    width: "30px",
    height: "2px",
    borderRadius: "10px",
    background: "linear-gradient(135deg,#7c3aed,#ec4899)"
  },

  welcomeTitle: {
    margin: "18px 0 4px",
    fontSize: "clamp(22px, 5vw, 32px)",
    color: "#071b4d",
    fontWeight: "900"
  },

  welcomeSub: {
    margin: 0,
    fontSize: "14px",
    color: "#64748b",
    fontWeight: "600"
  },

  loginBox: {
    margin: "20px auto 0",
    width: "100%",
    background: "white",
    borderRadius: "20px",
    padding: "20px 14px",
    boxShadow: "0 10px 30px rgba(15,23,42,0.06)",
    border: "1px solid #edf0f7",
    boxSizing: "border-box"
  },

  switchTop: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "20px",
    gap: "8px"
  },

  switchBox: {
    display: "flex",
    background: "#f3f0fb",
    borderRadius: "14px",
    padding: "3px",
    border: "1px solid #ddd6fe",
    flex: 1,
    maxWidth: "280px"
  },

  switchBtn: {
    flex: 1,
    height: "44px",
    border: "none",
    borderRadius: "12px",
    fontSize: "14px",
    fontWeight: "800",
    cursor: "pointer",
    background: "transparent",
    color: "#64748b",
    padding: "0"
  },

  switchActive: {
    background: "linear-gradient(135deg,#5b21b6,#ec4899)",
    color: "white",
    boxShadow: "0 6px 16px rgba(124,58,237,0.25)"
  },

  changeBtn: {
    background: "transparent",
    border: "none",
    color: "#6d28d9",
    fontSize: "14px",
    fontWeight: "800",
    cursor: "pointer",
    padding: "4px"
  },

  messageBox: {
    textAlign: "center",
    marginBottom: "14px",
    color: "#7c3aed",
    fontWeight: "800",
    fontSize: "13px",
    background: "#f5f3ff",
    padding: "8px",
    borderRadius: "10px"
  },

  inputActive: {
    height: "56px",
    borderRadius: "14px",
    border: "1.8px solid #ec4899",
    display: "flex",
    alignItems: "center",
    overflow: "hidden",
    marginTop: "14px",
    background: "white"
  },

  inputBox: {
    height: "56px",
    borderRadius: "14px",
    border: "1.5px solid #e5e7eb",
    display: "flex",
    alignItems: "center",
    overflow: "hidden",
    marginTop: "14px",
    background: "white"
  },

  inputIcon: {
    width: "50px",
    height: "100%",
    background: "#f3f0fb",
    color: "#7c3aed",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "20px",
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
    fontSize: "18px",
    textAlign: "center"
  },

  eyeBtn: {
    width: "44px",
    border: "none",
    background: "transparent",
    fontSize: "18px",
    cursor: "pointer"
  },

  sendOtp: {
    marginRight: "6px",
    border: "none",
    borderRadius: "10px",
    padding: "8px 10px",
    background: "linear-gradient(135deg,#7c3aed,#ec4899)",
    color: "white",
    fontWeight: "800",
    fontSize: "12px",
    cursor: "pointer",
    whiteSpace: "nowrap"
  },

  optionsRow: {
    marginTop: "16px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "8px"
  },

  remember: {
    display: "flex",
    gap: "6px",
    color: "#64748b",
    fontSize: "13px",
    alignItems: "center",
    cursor: "pointer"
  },

  forgot: {
    border: "none",
    background: "transparent",
    color: "#6d28d9",
    fontSize: "13px",
    fontWeight: "800",
    cursor: "pointer"
  },

  loginBtn: {
    marginTop: "22px",
    width: "100%",
    height: "58px",
    border: "none",
    borderRadius: "18px",
    background: "linear-gradient(135deg,#4f46e5,#7c3aed,#ec4899)",
    color: "white",
    fontSize: "18px",
    fontWeight: "900",
    position: "relative",
    cursor: "pointer",
    boxShadow: "0 10px 20px rgba(124,58,237,0.3)"
  },

  lockCircle: {
    position: "absolute",
    left: "12px",
    top: "10px",
    width: "38px",
    height: "38px",
    borderRadius: "50%",
    background: "rgba(255,255,255,0.18)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    fontSize: "16px"
  },

  arrowCircle: {
    position: "absolute",
    right: "12px",
    top: "10px",
    width: "38px",
    height: "38px",
    borderRadius: "50%",
    background: "white",
    color: "#ec4899",
    fontSize: "28px",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    lineHeight: "28px"
  },

  orRow: {
    marginTop: "22px",
    display: "flex",
    alignItems: "center",
    gap: "12px",
    justifyContent: "center",
    color: "#64748b",
    fontWeight: "800",
    fontSize: "13px"
  },

  orLine: {
    flex: 1,
    height: "1px",
    background: "#e2e8f0"
  },

  socialRow: {
    marginTop: "16px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "14px",
    fontSize: "13px",
    color: "#64748b"
  },

  googleBtn: {
    width: "40px",
    height: "40px",
    borderRadius: "50%",
    border: "1px solid #e5e7eb",
    background: "white",
    color: "#ef4444",
    fontWeight: "900",
    fontSize: "16px",
    cursor: "pointer"
  },

  facebookBtn: {
    width: "40px",
    height: "40px",
    borderRadius: "50%",
    border: "1px solid #e5e7eb",
    background: "#2563eb",
    color: "white",
    fontWeight: "900",
    fontSize: "18px",
    cursor: "pointer"
  },

  appleBtn: {
    width: "40px",
    height: "40px",
    borderRadius: "50%",
    border: "1px solid #e5e7eb",
    background: "#111827",
    color: "white",
    fontWeight: "900",
    fontSize: "18px",
    cursor: "pointer"
  },

  registerCard: {
    width: "100%",
    margin: "18px auto 0",
    background: "white",
    borderRadius: "18px",
    padding: "16px 14px",
    display: "flex",
    alignItems: "center",
    gap: "12px",
    boxShadow: "0 8px 25px rgba(15,23,42,0.05)",
    border: "1px solid #edf0f7",
    boxSizing: "border-box",
    flexWrap: "wrap"
  },

  registerIcon: {
    fontSize: "36px"
  },

  registerContent: {
    flex: 1,
    minWidth: "150px"
  },

  registerBtn: {
    border: "1.5px solid #d946ef",
    background: "white",
    color: "#7c3aed",
    padding: "10px 14px",
    borderRadius: "14px",
    fontWeight: "800",
    fontSize: "13px",
    cursor: "pointer",
    whiteSpace: "nowrap"
  },

  trustRow: {
    width: "100%",
    margin: "20px auto 0",
    display: "grid",
    gridTemplateColumns: "repeat(2, 1fr)",
    gap: "12px",
    boxSizing: "border-box"
  },

  trustItem: {
    textAlign: "center",
    color: "#475569",
    fontSize: "11px",
    fontWeight: "700",
    background: "rgba(255,255,255,0.6)",
    padding: "8px",
    borderRadius: "12px"
  },

  trustIcon: {
    fontSize: "22px",
    marginBottom: "4px"
  }
};
