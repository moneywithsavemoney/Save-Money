import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { toast } from "react-toastify";
import { API } from "../config";

export default function Register() {
  const navigate = useNavigate();
  const location = useLocation();

  const queryParams = new URLSearchParams(location.search);
  const urlReferCode = queryParams.get("ref") || ""; 

  // 🔹 আপনার অ্যাপ লোগো (public ফোল্ডারে logo512.png নামে আছে)
  const appLogoUrl = "/logo512.png";

  const [name, setName] = useState("");
  const [mobile, setMobile] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [referCode, setReferCode] = useState(urlReferCode);
  const [terms, setTerms] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showTerms, setShowTerms] = useState(false);

  // App Download Modal State
  const [showDownloadModal, setShowDownloadModal] = useState(false);

  // Email Verification States & Modal State
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [otp, setOtp] = useState("");
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [isOtpVerified, setIsOtpVerified] = useState(false);
  const [otpTimer, setOtpTimer] = useState(0);
  const [sendingOtp, setSendingOtp] = useState(false);
  const [verifyingOtp, setVerifyingOtp] = useState(false);

  useEffect(() => {
    let interval = null;
    if (otpTimer > 0) {
      interval = setInterval(() => {
        setOtpTimer((prev) => prev - 1);
      }, 1000);
    } else {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [otpTimer]);

  const handleVerifyEmailClick = async () => {
    if (!email) {
      toast.warning("Please enter your email address first");
      return;
    }

    setShowOtpModal(true);

    if (!isOtpSent) {
      sendOtpCode();
    }
  };

  const sendOtpCode = async () => {
    if (!email) return;

    try {
      setSendingOtp(true);
      const res = await fetch(`${API}/send-email-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase() })
      });

      const data = await res.json();
      if (res.ok || data.success) {
        setIsOtpSent(true);
        setIsOtpVerified(false);
        setOtpTimer(120);
        toast.success("Verification code sent to your email!");
      } else {
        toast.error(data.msg || "Failed to send OTP");
      }
    } catch (err) {
      console.log(err);
      toast.error("Failed to connect for sending OTP");
    } finally {
      setSendingOtp(false);
    }
  };

  const verifyOtpCode = async () => {
    if (!otp || otp.trim().length !== 6) {
      toast.warning("Please enter a valid 6-digit OTP");
      return;
    }

    try {
      setVerifyingOtp(true);
      const res = await fetch(`${API}/verify-email-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          email: email.trim().toLowerCase(), 
          otp: otp.trim() 
        })
      });

      const data = await res.json();
      if (res.ok || data.success) {
        setIsOtpVerified(true);
        setShowOtpModal(false);
        toast.success("Email verified successfully!");
      } else {
        toast.error(data.msg || "Invalid OTP");
      }
    } catch (err) {
      console.log(err);
      toast.error("Verification failed. Try again.");
    } finally {
      setVerifyingOtp(false);
    }
  };

  const register = async () => {
    if (!name || !mobile || !email || !password) {
      toast.warning("Please fill all required fields");
      return;
    }

    if (!terms) {
      toast.warning("Please accept Terms & Conditions");
      return;
    }

    if (!isOtpSent || !otp) {
      toast.warning("Please verify your email OTP first");
      return;
    }

    if (!isOtpVerified) {
      toast.warning("Please verify your email OTP first before registration");
      return;
    }

    try {
      setLoading(true);

      const res = await fetch(`${API}/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          name: name.trim(),
          mobile: mobile.trim(),
          email: email.trim().toLowerCase(),
          password,
          otp: otp.trim(),
          referCode: referCode.trim(),
          termsAccepted: true
        })
      });

      const data = await res.json();

      if (res.ok || data.success === true) {
        toast.success(data.msg || "Registered Successfully");
        setShowDownloadModal(true);
      } else {
        toast.error(data.msg || "Registration failed");
      }
    } catch (err) {
      console.log(err);
      toast.error("Registration failed");
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadApk = () => {
    const driveDirectLink = "https://drive.google.com/uc?id=1IkMCEVF_RDBeiAW8sznXZCrJ4m40jOcU&confirm=t";
    window.open(driveDirectLink, "_blank");
  };

  return (
    <div style={styles.page}>
      <style>{`
        @media (max-width: 768px) {
          .register-card {
            width: 100% !important;
            border-radius: 24px !important;
            margin: 10px !important;
          }
          .bottom-features-grid {
            grid-template-columns: repeat(2, 1fr) !important;
            display: grid !important;
            gap: 12px !important;
          }
        }
      `}</style>

      <div style={styles.card} className="register-card">

        {/* 🔹 নতুন ডিজাইন অনুযায়ী টপ ব্যানার সেকশন */}
        <div style={styles.topBanner}>
          <div style={styles.bannerHeaderRow}>
            <div style={styles.brandLogoBox}>
              <img 
                src={appLogoUrl} 
                alt="Logo" 
                style={styles.brandLogoImg}
                onError={(e) => {
                  e.target.style.display = 'none';
                }}
              />
            </div>
            <div>
              <h2 style={styles.brandTitleText}>SAVE MONEY</h2>
              <div style={styles.brandSubLine}></div>
              <p style={styles.brandSubText}>Save & Earn</p>
            </div>
            <div style={styles.bannerQuote}>
              Save<br />Today<br />Secure<br />Tomorrow
            </div>
          </div>

          <div style={styles.heroContentRow}>
            <div style={styles.heroTextContent}>
              <h1 style={styles.createHeading}>Create Your</h1>
              <h2 style={styles.accountHeading}>Account</h2>
              <p style={styles.joinSubText}>
                Join Save Money and start your journey to financial freedom.
              </p>
            </div>
            <div style={styles.piggyIllustration}>
              <div style={styles.miniCoin}>₹</div>
              <div style={styles.bigPiggy}>🐷</div>
            </div>
          </div>
        </div>

        {/* 🔹 ফর্ম এবং ইনপুট সেকশন */}
        <div style={styles.formContentArea}>
          <InputBox color="#4f46e5" icon="👤" placeholder="Full Name" value={name} setValue={setName} />
          <InputBox color="#9333ea" icon="📱" placeholder="Mobile Number" value={mobile} setValue={setMobile} />
          
          {/* Email Box with 'Verify Email' button matching new design */}
          <div style={{ ...styles.inputWrap, borderColor: isOtpVerified ? "#22c55e" : "#0ea5e9" }}>
            <div style={{ ...styles.iconBox, background: isOtpVerified ? "linear-gradient(135deg,#22c55e,#10b981)" : "linear-gradient(135deg,#0ea5e9,#0284c7)" }}>
              {isOtpVerified ? "✓" : "✉️"}
            </div>
            <input
              style={styles.input}
              placeholder="Email ID"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isOtpVerified}
            />
            <button
              style={{
                ...styles.verifyEmailBtn,
                background: isOtpVerified ? "#22c55e" : "linear-gradient(135deg,#0ea5e9,#10b981)"
              }}
              type="button"
              onClick={handleVerifyEmailClick}
              disabled={isOtpVerified}
            >
              <span style={{ fontSize: "14px" }}>✉️</span> {isOtpVerified ? "Verified" : "Verify Email"}
            </button>
          </div>

          <div style={{ ...styles.inputWrap, borderColor: "#10b981" }}>
            <div style={{ ...styles.iconBox, background: "linear-gradient(135deg,#10b981,#059669)" }}>
              🔒
            </div>

            <input
              style={styles.input}
              type={showPass ? "text" : "password"}
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />

            <button
              style={styles.eye}
              type="button"
              onClick={() => setShowPass(!showPass)}
            >
              👁
            </button>
          </div>

          <div style={{ ...styles.inputWrap, borderColor: "#f59e0b", background: urlReferCode ? "#f8fafc" : "transparent" }}>
            <div style={{ ...styles.iconBox, background: "linear-gradient(135deg,#f59e0b,#d97706)" }}>
              🎁
            </div>
            <input
              style={{
                ...styles.input,
                color: urlReferCode ? "#64748b" : "#0f172a",
                cursor: urlReferCode ? "not-allowed" : "text"
              }}
              placeholder="Refer Code Optional"
              value={referCode}
              onChange={(e) => !urlReferCode && setReferCode(e.target.value)}
              readOnly={!!urlReferCode}
            />
          </div>

          <label style={styles.checkRow}>
            <input
              type="checkbox"
              checked={terms}
              onChange={(e) => {
                e.preventDefault();
                if (!terms) {
                  setShowTerms(true);
                } else {
                  setTerms(false);
                }
              }}
              style={styles.checkbox}
            />

            <span>
              I agree to the{" "}
              <b
                style={styles.termsLink}
                onClick={(e) => {
                  e.preventDefault();
                  setShowTerms(true);
                }}
              >
                Terms & Conditions
              </b>
            </span>
          </label>

          <button
            style={{
              ...styles.registerBtn,
              opacity: (loading || !isOtpVerified) ? 0.7 : 1
            }}
            onClick={register}
            disabled={loading}
          >
            <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}>
              <span style={styles.btnUserIcon}>👤+</span> {loading ? "Creating Account..." : "Register Now"}
            </span>
            <span style={styles.arrow}>›</span>
          </button>

          <div style={styles.loginDividerRow}>
            <div style={styles.dividerLine}></div>
            <p style={styles.loginText}>
              Already have an account?
              <span
                style={styles.loginLink}
                onClick={() => navigate("/login")}
              >
                Login →
              </span>
            </p>
            <div style={styles.dividerLine}></div>
          </div>

          <div style={styles.disclaimer}>
            <div style={styles.disIcon}>🛡️</div>

            <div>
              <h3 style={styles.disclaimerTitle}>Disclaimer</h3>

              <p style={styles.disclaimerText}>
                Save Money is a private digital saving and investment initiative.
                Investment returns may vary based on company performance, market
                conditions, internal policies and future updates. Early closure may
                include deduction as per platform policy. Referral, performance,
                team, royalty and reward benefits are subject to eligibility rules.
              </p>
            </div>
          </div>

          <div style={styles.bottomFeatures} className="bottom-features-grid">
            <div style={styles.bottomItem}>
              <div style={{ ...styles.bottomIcon, background: "#22c55e" }}>✓</div>
              <div>
                <div style={styles.bottomTitle}>100% Secure</div>
                <div style={styles.bottomText}>& Safe</div>
              </div>
            </div>

            <div style={styles.bottomItem}>
              <div style={{ ...styles.bottomIcon, background: "#0ea5e9" }}>🎧</div>
              <div>
                <div style={styles.bottomTitle}>24/7 Customer</div>
                <div style={styles.bottomText}>Support</div>
              </div>
            </div>

            <div style={styles.bottomItem}>
              <div style={{ ...styles.bottomIcon, background: "#9333ea" }}>🔒</div>
              <div>
                <div style={styles.bottomTitle}>Your Data is</div>
                <div style={styles.bottomText}>Protected</div>
              </div>
            </div>

            <div style={styles.bottomItem}>
              <div style={{ ...styles.bottomIcon, background: "#f59e0b" }}>⭐</div>
              <div>
                <div style={styles.bottomTitle}>Trusted by</div>
                <div style={styles.bottomText}>Thousands</div>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* 🔹 1st Screenshot Design: Email Verification OTP Modal */}
      {showOtpModal && (
        <div style={styles.otpModalOverlay}>
          <div style={styles.otpModalCard}>
            <h2 style={styles.otpModalTitle}>Email Verification</h2>
            <p style={styles.otpSubText}>
              {sendingOtp ? "Sending OTP..." : `OTP sent to ${email || "your email"}`}[span_2](start_span)[span_2](end_span)
            </p>

            <div style={styles.otpFieldContainer}>
              <span style={styles.otpFieldLabel}>Enter OTP</span>
              <div style={styles.otpInputBox}>
                <span style={styles.lockIcon}>🔒</span>
                <input
                  type="text"
                  maxLength={6}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  placeholder=""
                  style={styles.otpRealInput}
                  autoFocus
                />
              </div>
            </div>

            <div style={styles.resendRow}>
              {otpTimer > 0 ? (
                <span style={{ fontSize: "12px", color: "#666" }}>Resend code in {otpTimer}s</span>
              ) : (
                <button 
                  type="button" 
                  onClick={sendOtpCode} 
                  disabled={sendingOtp}
                  style={styles.resendBtn}
                >
                  {sendingOtp ? "Sending..." : "Resend OTP"}
                </button>
              )}
            </div>

            <div style={styles.cancelBtnRow}>
              <button
                type="button"
                onClick={() => setShowOtpModal(false)}
                style={styles.cancelLinkBtn}
              >
                Cancel[span_3](start_span)[span_3](end_span)
              </button>
            </div>

            <button
              type="button"
              onClick={verifyOtpCode}
              disabled={verifyingOtp}
              style={styles.verifyModalBtn}
            >
              {verifyingOtp ? "Verifying..." : "Verify"}[span_4](start_span)[span_4](end_span)
            </button>
          </div>
        </div>
      )}

      {/* Terms & Conditions Modal */}
      {showTerms && (
        <div style={styles.modalOverlay}>
          <div style={styles.modal}>
            <h2 style={styles.modalTitle}>Save Money Terms & Conditions</h2>

            <div style={styles.modalBody}>
              <p>
                Save Money is a private digital saving and investment initiative created
                to help users build disciplined saving habits and explore digital earning
                opportunities through a structured platform.
              </p>
              <p>
                Users must complete registration with correct personal information and
                must complete KYC verification before accessing investment, referral,
                wallet and earning related features.
              </p>
              <p>
                Users are responsible for providing accurate mobile number, email ID,
                USDT wallet address, PAN details, Aadhaar details and uploaded documents.
                Wrong information may result in rejection, delay, freeze or restriction.
              </p>
              <p>
                If a user closes an investment before completing the selected tenure,
                the platform may deduct 20% from the principal investment amount and
                return the remaining principal without interest, according to company
                policy.
              </p>
              <p>
                Save Money works as a systematic saving and investment style platform.
                ROI may be updated, increased or decreased depending on company profit,
                business performance, risk factors, market conditions and internal
                decisions.
              </p>
              <p>
                Referral income, performance bonus, team bonus, royalty bonus and daily
                reward are not guaranteed income. These benefits depend on eligibility,
                active status, investment completion, renewals, direct referral tasks
                and other platform rules.
              </p>
              <p>
                Wallet balance, rewards, referral income and other earnings may be
                reviewed by admin before approval, withdrawal or adjustment. Any
                suspicious activity, fake account, duplicate KYC, false referral or
                policy violation may result in account block.
              </p>
              <p>
                Auto withdrawal is subject to renewal status, wallet eligibility, admin
                verification and company policy. Withdrawal delays may happen due to
                verification, bank or wallet network issues.
              </p>
              <p>
                Save Money aims to grow into a bigger, transparent and legally compliant
                financial technology ecosystem in the future. Users should use the
                platform only after understanding all possible risks and rules.
              </p>
              <p>
                By creating an account, the user confirms that they have read,
                understood and accepted all policies, risks, rules, conditions,
                deductions, renewal rules, KYC rules and platform limitations.
              </p>
            </div>

            <button
              style={styles.modalBtn}
              onClick={() => {
                setTerms(true);
                setShowTerms(false);
              }}
            >
              Accept & Continue
            </button>

            <button
              style={styles.closeBtn}
              onClick={() => {
                setTerms(false);
                setShowTerms(false);
              }}
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* High-Premium Quality Investment Pop-up Modal with Logo */}
      {showDownloadModal && (
        <div style={styles.modalOverlay}>
          <div style={styles.premiumModal}>
            <div style={styles.modalHeaderDecor}></div>
            
            <div style={styles.badgeWrap}>
              <span style={styles.goldBadge}>🎉 REGISTRATION SUCCESSFUL</span>
            </div>

            <div style={styles.appIconWrapper}>
              <img 
                src={appLogoUrl} 
                alt="App Logo" 
                style={styles.appLogoImg} 
                onError={(e) => {
                  e.target.style.display = 'none';
                  e.target.nextSibling.style.display = 'block';
                }}
              />
              <span style={{ display: 'none', fontSize: '36px' }}>💰</span>
            </div>

            <h2 style={styles.premiumTitle}>
              download our mobile application
            </h2>

            <p style={styles.premiumSubtext}>
              Get seamless investing, instant withdrawal tracking, and exclusive bonuses right on your smartphone.
            </p>

            <div style={styles.featureBox}>
              <div style={styles.featurePill}>⚡ Fast Withdrawals</div>
              <div style={styles.featurePill}>🔒 Top Security</div>
              <div style={styles.featurePill}>📊 Live Tracking</div>
            </div>

            <button
              style={styles.premiumDownloadBtn}
              onClick={handleDownloadApk}
            >
              <span style={{ fontSize: "22px" }}>🚀</span> Download Official App (APK)
            </button>

            <button
              style={styles.secondaryLoginBtn}
              onClick={() => {
                setShowDownloadModal(false);
                navigate("/login");
              }}
            >
              Continue to Login Panel →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function InputBox({ color, icon, placeholder, value, setValue }) {
  return (
    <div style={{ ...styles.inputWrap, borderColor: color }}>
      <div style={{ ...styles.iconBox, background: `linear-gradient(135deg,${color},#4f46e5)` }}>
        {icon}
      </div>

      <input
        style={styles.input}
        placeholder={placeholder}
        value={value}
        onChange={(e) => setValue(e.target.value)}
      />
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    background: "linear-gradient(180deg, #10b981 0%, #065f46 50%, #022c22 100%)",
    padding: "20px 15px",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    boxSizing: "border-box"
  },

  card: {
    width: "100%",
    maxWidth: "520px",
    background: "#ffffff",
    borderRadius: "36px",
    overflow: "hidden",
    boxShadow: "0 25px 60px rgba(0,0,0,0.3)",
    boxSizing: "border-box"
  },

  topBanner: {
    background: "linear-gradient(135deg, #022c22 0%, #064e3b 50%, #047857 100%)",
    color: "white",
    padding: "24px 22px 20px 22px",
    position: "relative",
    overflow: "hidden"
  },

  bannerHeaderRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: "15px"
  },

  brandLogoBox: {
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

  brandLogoImg: {
    width: "100%",
    height: "100%",
    objectFit: "cover"
  },

  brandTitleText: {
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

  bannerQuote: {
    fontSize: "11px",
    fontWeight: "700",
    textAlign: "right",
    lineHeight: "1.2",
    color: "#a7f3d0",
    fontStyle: "italic"
  },

  heroContentRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: "10px"
  },

  heroTextContent: {
    flex: 1
  },

  createHeading: {
    fontSize: "28px",
    fontWeight: "800",
    margin: 0,
    color: "#ffffff",
    letterSpacing: "-0.5px"
  },

  accountHeading: {
    fontSize: "38px",
    fontWeight: "900",
    margin: "0 0 8px 0",
    background: "linear-gradient(135deg, #38bdf8, #a7f3d0, #facc15)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
    letterSpacing: "-1px"
  },

  joinSubText: {
    fontSize: "13px",
    color: "#cbd5e1",
    margin: 0,
    lineHeight: "1.4"
  },

  piggyIllustration: {
    position: "relative",
    width: "80px",
    height: "70px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "52px"
  },

  miniCoin: {
    position: "absolute",
    top: "-5px",
    left: "15px",
    width: "22px",
    height: "22px",
    background: "#facc15",
    color: "#0f172a",
    borderRadius: "50%",
    fontSize: "12px",
    fontWeight: "bold",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    boxShadow: "0 2px 5px rgba(0,0,0,0.3)"
  },

  formContentArea: {
    padding: "24px 22px",
    background: "#ffffff",
    borderTopLeftRadius: "28px",
    borderTopRightRadius: "28px",
    marginTop: "-16px",
    position: "relative",
    zIndex: 2,
    boxSizing: "border-box"
  },

  inputWrap: {
    minHeight: "54px",
    border: "1.8px solid",
    borderRadius: "16px",
    display: "flex",
    alignItems: "center",
    padding: "0 12px",
    gap: "12px",
    marginTop: "14px",
    boxSizing: "border-box",
    background: "#ffffff"
  },

  iconBox: {
    width: "38px",
    height: "38px",
    borderRadius: "10px",
    color: "white",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "18px",
    flexShrink: 0
  },

  input: {
    flex: 1,
    width: "100%",
    minWidth: 0,
    border: "none",
    outline: "none",
    fontSize: "15px",
    color: "#0f172a",
    background: "transparent"
  },

  verifyEmailBtn: {
    padding: "8px 12px",
    background: "linear-gradient(135deg,#0ea5e9,#10b981)",
    color: "white",
    border: "none",
    borderRadius: "10px",
    fontSize: "12px",
    fontWeight: "bold",
    cursor: "pointer",
    whiteSpace: "nowrap",
    boxShadow: "0 4px 10px rgba(14,165,233,0.3)"
  },

  eye: {
    border: "none",
    background: "transparent",
    fontSize: "18px",
    cursor: "pointer"
  },

  checkRow: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    marginTop: "16px",
    fontSize: "14px",
    color: "#334155"
  },

  checkbox: {
    width: "18px",
    height: "18px"
  },

  termsLink: {
    color: "#2563eb",
    cursor: "pointer"
  },

  registerBtn: {
    width: "100%",
    height: "56px",
    border: "none",
    borderRadius: "16px",
    marginTop: "18px",
    background: "linear-gradient(90deg, #0062ff 0%, #00c6ff 100%)",
    color: "white",
    fontSize: "18px",
    fontWeight: "800",
    position: "relative",
    boxShadow: "0 8px 20px rgba(0, 98, 255, 0.35)",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center"
  },

  btnUserIcon: {
    fontSize: "15px",
    background: "rgba(255,255,255,0.2)",
    padding: "2px 6px",
    borderRadius: "6px"
  },

  arrow: {
    position: "absolute",
    right: "12px",
    top: "8px",
    width: "38px",
    height: "38px",
    borderRadius: "50%",
    background: "white",
    color: "#0062ff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "26px",
    fontWeight: "bold"
  },

  loginDividerRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "12px",
    marginTop: "18px"
  },

  dividerLine: {
    flex: 1,
    height: "1px",
    background: "#cbd5e1"
  },

  loginText: {
    textAlign: "center",
    margin: 0,
    color: "#475569",
    fontSize: "14px",
    whiteSpace: "nowrap"
  },

  loginLink: {
    color: "#16a34a",
    fontWeight: "800",
    cursor: "pointer",
    marginLeft: "6px"
  },

  disclaimer: {
    marginTop: "18px",
    background: "#f0fdf4",
    border: "1px solid #bbf7d0",
    borderRadius: "16px",
    padding: "14px",
    display: "flex",
    gap: "12px"
  },

  disIcon: {
    width: "38px",
    height: "38px",
    borderRadius: "10px",
    background: "linear-gradient(135deg,#22c55e,#16a34a)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "18px",
    flexShrink: 0,
    color: "white"
  },

  disclaimerTitle: {
    margin: 0,
    color: "#16a34a",
    fontSize: "14px",
    fontWeight: "bold"
  },

  disclaimerText: {
    color: "#334155",
    lineHeight: "18px",
    fontSize: "11px",
    marginTop: "3px"
  },

  bottomFeatures: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "8px",
    marginTop: "20px"
  },

  bottomItem: {
    display: "flex",
    alignItems: "center",
    gap: "6px"
  },

  bottomIcon: {
    width: "32px",
    height: "32px",
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "white",
    fontSize: "12px",
    boxShadow: "0 3px 8px rgba(0,0,0,0.15)",
    flexShrink: 0
  },

  bottomTitle: {
    fontSize: "10px",
    fontWeight: "700",
    color: "#111827",
    lineHeight: "13px"
  },

  bottomText: {
    fontSize: "10px",
    fontWeight: "700",
    color: "#111827",
    lineHeight: "13px"
  },

  /* 🔹 Screenshot 1 Exact Match Modal Styles */
  otpModalOverlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(0, 0, 0, 0.45)",
    backdropFilter: "blur(3px)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 99999,
    padding: "16px"
  },

  otpModalCard: {
    width: "100%",
    maxWidth: "340px",
    background: "#f8ecee",
    borderRadius: "28px",
    padding: "28px 22px 24px 22px",
    boxShadow: "0 10px 30px rgba(0,0,0,0.2)",
    boxSizing: "border-box",
    textAlign: "left"
  },

  otpModalTitle: {
    margin: 0,
    fontSize: "22px",
    fontWeight: "800",
    color: "#271b2d"
  },

  otpSubText: {
    margin: "12px 0 20px 0",
    fontSize: "13px",
    color: "#786d7e",
    fontWeight: "500"
  },

  otpFieldContainer: {
    position: "relative",
    marginTop: "10px"
  },

  otpFieldLabel: {
    position: "absolute",
    top: "-10px",
    left: "16px",
    background: "#f8ecee",
    padding: "0 6px",
    fontSize: "11px",
    color: "#786d7e",
    fontWeight: "600",
    zIndex: 2
  },

  otpInputBox: {
    height: "54px",
    border: "2px solid #d81b60",
    borderRadius: "18px",
    display: "flex",
    alignItems: "center",
    padding: "0 14px",
    gap: "10px",
    background: "#ffffff"
  },

  lockIcon: {
    fontSize: "18px",
    opacity: 0.7
  },

  otpRealInput: {
    width: "100%",
    border: "none",
    outline: "none",
    fontSize: "18px",
    letterSpacing: "3px",
    color: "#000",
    background: "transparent",
    fontWeight: "bold"
  },

  resendRow: {
    marginTop: "8px",
    textAlign: "right"
  },

  resendBtn: {
    background: "none",
    border: "none",
    color: "#d81b60",
    fontSize: "12px",
    fontWeight: "bold",
    cursor: "pointer"
  },

  cancelBtnRow: {
    textAlign: "right",
    marginTop: "14px",
    marginBottom: "12px"
  },

  cancelLinkBtn: {
    border: "none",
    background: "transparent",
    color: "#271b2d",
    fontSize: "15px",
    fontWeight: "600",
    cursor: "pointer"
  },

  verifyModalBtn: {
    width: "100%",
    height: "52px",
    borderRadius: "16px",
    border: "none",
    background: "#d81b60",
    color: "#ffffff",
    fontSize: "17px",
    fontWeight: "bold",
    cursor: "pointer",
    boxShadow: "0 4px 12px rgba(216,27,96,0.3)"
  },

  modalOverlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(11, 15, 25, 0.75)",
    backdropFilter: "blur(6px)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 9999,
    padding: "15px"
  },

  modal: {
    width: "100%",
    maxWidth: "480px",
    maxHeight: "85vh",
    background: "white",
    borderRadius: "24px",
    padding: "20px",
    boxShadow: "0 25px 70px rgba(0,0,0,.35)",
    boxSizing: "border-box"
  },

  modalTitle: {
    margin: 0,
    color: "#7c3aed",
    textAlign: "center",
    fontSize: "20px"
  },

  modalBody: {
    marginTop: "14px",
    maxHeight: "50vh",
    overflowY: "auto",
    color: "#334155",
    lineHeight: "22px",
    fontSize: "13px"
  },

  modalBtn: {
    width: "100%",
    marginTop: "16px",
    padding: "12px",
    border: "none",
    borderRadius: "12px",
    background: "linear-gradient(135deg,#7c3aed,#2563eb)",
    color: "white",
    fontWeight: "900",
    cursor: "pointer"
  },

  closeBtn: {
    width: "100%",
    marginTop: "8px",
    padding: "10px",
    border: "none",
    borderRadius: "12px",
    background: "#f1f5f9",
    color: "#475569",
    fontWeight: "800",
    cursor: "pointer"
  },

  premiumModal: {
    width: "100%",
    maxWidth: "440px",
    background: "linear-gradient(145deg, #1e1b4b, #0f172a)",
    borderRadius: "32px",
    padding: "28px 24px",
    boxShadow: "0 30px 90px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(255, 255, 255, 0.1)",
    boxSizing: "border-box",
    textAlign: "center",
    position: "relative",
    overflow: "hidden",
    color: "#ffffff"
  },

  modalHeaderDecor: {
    position: "absolute",
    top: "-50px",
    left: "50%",
    transform: "translateX(-50%)",
    width: "180px",
    height: "100px",
    background: "radial-gradient(circle, rgba(168,85,247,0.4) 0%, rgba(0,0,0,0) 70%)",
    pointerEvents: "none"
  },

  badgeWrap: {
    marginBottom: "16px"
  },

  goldBadge: {
    background: "linear-gradient(135deg, #f59e0b, #d97706)",
    color: "#fff",
    fontSize: "11px",
    fontWeight: "900",
    padding: "6px 16px",
    borderRadius: "20px",
    letterSpacing: "0.5px",
    textTransform: "uppercase",
    boxShadow: "0 4px 15px rgba(245, 158, 11, 0.3)"
  },

  appIconWrapper: {
    width: "76px",
    height: "76px",
    borderRadius: "22px",
    background: "linear-gradient(135deg, #a855f7, #6366f1)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    margin: "0 auto 16px",
    boxShadow: "0 10px 25px rgba(168, 85, 247, 0.4)",
    border: "2px solid rgba(255, 255, 255, 0.2)",
    overflow: "hidden"
  },

  appLogoImg: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
    borderRadius: "20px"
  },

  premiumTitle: {
    margin: "0 0 10px 0",
    fontSize: "22px",
    fontWeight: "800",
    textTransform: "lowercase",
    color: "#ffffff",
    letterSpacing: "-0.5px",
    lineHeight: "28px"
  },

  premiumSubtext: {
    fontSize: "13px",
    color: "#94a3b8",
    lineHeight: "20px",
    margin: "0 0 20px 0"
  },

  featureBox: {
    display: "flex",
    justifyContent: "center",
    gap: "8px",
    marginBottom: "24px",
    flexWrap: "wrap"
  },

  featurePill: {
    background: "rgba(255, 255, 255, 0.06)",
    border: "1px solid rgba(255, 255, 255, 0.1)",
    padding: "6px 12px",
    borderRadius: "12px",
    fontSize: "11px",
    color: "#cbd5e1",
    fontWeight: "600"
  },

  premiumDownloadBtn: {
    width: "100%",
    padding: "16px",
    border: "none",
    borderRadius: "18px",
    background: "linear-gradient(135deg, #22c55e, #10b981)",
    color: "#ffffff",
    fontSize: "16px",
    fontWeight: "800",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "10px",
    boxShadow: "0 12px 28px rgba(34, 197, 94, 0.35)",
    transition: "transform 0.2s"
  },

  secondaryLoginBtn: {
    width: "100%",
    marginTop: "12px",
    padding: "12px",
    border: "none",
    background: "transparent",
    color: "#94a3b8",
    fontSize: "13px",
    fontWeight: "700",
    cursor: "pointer"
  }
};
