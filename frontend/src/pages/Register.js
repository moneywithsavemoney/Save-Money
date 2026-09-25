import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { toast } from "react-toastify";
import { API } from "../config";

export default function Register() {
  const navigate = useNavigate();
  const location = useLocation();

  const queryParams = new URLSearchParams(location.search);
  const urlReferCode = queryParams.get("ref") || ""; 

  // 🔹 আপনার অ্যাপ লোগোর URL বা লোকাল পাবলিক ফাইল পাথ এখানে দিন
  const appLogoUrl = "/logo512.png"; // অথবা যেমন: "https://your-domain.com/logo.png"

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

  // Email Verification States
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

  const sendOtpCode = async () => {
    if (!email) {
      toast.warning("Please enter your email address first");
      return;
    }

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
      toast.warning("Please enter your email OTP verification code");
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
    // Google Drive Direct Download Link
    const driveDirectLink = "https://drive.google.com/uc?export=download&id=1ageAEZgWi64IwoofI3N3hTN1sCFIVIcP";
    window.open(driveDirectLink, "_blank");
  };

  return (
    <div style={styles.page}>
      <style>{`
        @media (max-width: 768px) {
          .register-card {
            flex-direction: column !important;
            border-radius: 24px !important;
          }
          .register-left-panel {
            width: 100% !important;
            border-radius: 24px 24px 0 0 !important;
            padding: 24px 16px !important;
          }
          .register-right-panel {
            padding: 24px 16px !important;
          }
          .account-heading {
            font-size: 42px !important;
          }
          .brand-heading {
            font-size: 40px !important;
            line-height: 40px !important;
          }
          .bottom-features {
            grid-template-columns: repeat(2, 1fr) !important;
            display: grid !important;
          }
        }
      `}</style>

      <div style={styles.card} className="register-card">

        <div style={styles.leftPanel} className="register-left-panel">
          <div style={styles.piggyWrap}>
            <div style={styles.coin}>₹</div>
            <div style={styles.piggy}>
              <div style={styles.earLeft}></div>
              <div style={styles.earRight}></div>
              <div style={styles.eyeLeft}></div>
              <div style={styles.eyeRight}></div>
              <div style={styles.nose}>● ●</div>
              <div style={styles.legOne}></div>
              <div style={styles.legTwo}></div>
            </div>
          </div>

          <h1 style={styles.brand} className="brand-heading">
            save<br />
            money
          </h1>

          <p style={styles.brandSub}>
            Save Today, Secure Tomorrow
          </p>

          <h2 style={styles.why}>Why Join Us?</h2>

          <Benefit icon="🛡️" title="100% Secure" text="Your data is safe with us" />
          <Benefit icon="👛" title="Save More" text="Smart saving for a better future" />
          <Benefit icon="📈" title="Grow Faster" text="Achieve your financial goals" />
          <Benefit icon="🎁" title="Exciting Rewards" text="Earn rewards and benefits" />
        </div>

        <div style={styles.rightPanel} className="register-right-panel">
          <h2 style={styles.create}>Create Your</h2>
          <h1 style={styles.account} className="account-heading">Account</h1>

          <p style={styles.join}>
            Join <b>Save Money</b> and start your journey to financial freedom.
          </p>

          <InputBox color="#ff4cc4" icon="👤" placeholder="Full Name" value={name} setValue={setName} />
          <InputBox color="#7c3aed" icon="📱" placeholder="Mobile Number" value={mobile} setValue={setMobile} />
          
          <div style={{ ...styles.inputWrap, borderColor: isOtpVerified ? "#22c55e" : "#0ea5e9" }}>
            <div style={{ ...styles.iconBox, background: isOtpVerified ? "linear-gradient(135deg,#22c55e,#10b981)" : "linear-gradient(135deg,#0ea5e9,#7c3aed)" }}>
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
                ...styles.otpInlineBtn,
                opacity: (sendingOtp || otpTimer > 0 || isOtpVerified) ? 0.6 : 1,
                background: isOtpVerified ? "#10b981" : "linear-gradient(135deg,#0ea5e9,#7c3aed)"
              }}
              type="button"
              onClick={sendOtpCode}
              disabled={sendingOtp || otpTimer > 0 || isOtpVerified}
            >
              {isOtpVerified ? "Verified" : sendingOtp ? "Sending..." : otpTimer > 0 ? `${otpTimer}s` : isOtpSent ? "Resend" : "Send OTP"}
            </button>
          </div>

          {isOtpSent && (
            <div style={{ ...styles.inputWrap, borderColor: isOtpVerified ? "#22c55e" : "#f43f5e" }}>
              <div style={{ ...styles.iconBox, background: isOtpVerified ? "linear-gradient(135deg,#22c55e,#10b981)" : "linear-gradient(135deg,#f43f5e,#7c3aed)" }}>
                🔑
              </div>
              <input
                style={styles.input}
                placeholder="Enter 6-Digit Email OTP"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                disabled={isOtpVerified}
                maxLength={6}
              />
              <button
                style={{
                  ...styles.otpInlineBtn,
                  background: isOtpVerified ? "#22c55e" : "linear-gradient(135deg,#f43f5e,#e11d48)",
                  opacity: verifyingOtp ? 0.6 : 1
                }}
                type="button"
                onClick={verifyOtpCode}
                disabled={verifyingOtp || isOtpVerified}
              >
                {verifyingOtp ? "Verifying..." : isOtpVerified ? "Verified ✓" : "Verify OTP"}
              </button>
            </div>
          )}

          <div style={{ ...styles.inputWrap, borderColor: "#10b981" }}>
            <div style={{ ...styles.iconBox, background: "linear-gradient(135deg,#10b981,#22c55e)" }}>
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
            <div style={{ ...styles.iconBox, background: "linear-gradient(135deg,#f59e0b,#7c3aed)" }}>
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
            {loading ? "Creating Account..." : "Register Now"}
            <span style={styles.arrow}>›</span>
          </button>

          <p style={styles.loginText}>
            Already have an account?
            <span
              style={styles.loginLink}
              onClick={() => navigate("/login")}
            >
              Login
            </span>
          </p>

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

          <div style={styles.bottomFeatures} className="bottom-features">
            <div style={styles.bottomItem}>
              <div style={{ ...styles.bottomIcon, background: "linear-gradient(135deg,#22c55e,#86efac)" }}>🛡</div>
              <div>
                <div style={styles.bottomTitle}>100% Secure</div>
                <div style={styles.bottomText}>& Safe</div>
              </div>
            </div>

            <div style={styles.bottomItem}>
              <div style={{ ...styles.bottomIcon, background: "linear-gradient(135deg,#9333ea,#c084fc)" }}>🔒</div>
              <div>
                <div style={styles.bottomTitle}>Your Data is</div>
                <div style={styles.bottomText}>Protected</div>
              </div>
            </div>

            <div style={styles.bottomItem}>
              <div style={{ ...styles.bottomIcon, background: "linear-gradient(135deg,#2563eb,#60a5fa)" }}>🎧</div>
              <div>
                <div style={styles.bottomTitle}>24/7 Customer</div>
                <div style={styles.bottomText}>Support</div>
              </div>
            </div>

            <div style={styles.bottomItem}>
              <div style={{ ...styles.bottomIcon, background: "linear-gradient(135deg,#f59e0b,#facc15)" }}>⭐</div>
              <div>
                <div style={styles.bottomTitle}>Trusted by</div>
                <div style={styles.bottomText}>Thousands</div>
              </div>
            </div>
          </div>

        </div>
      </div>

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

            {/* 🔹 অরিজিনাল অ্যাপ লোগো সেকশন */}
            <div style={styles.appIconWrapper}>
              <img 
                src={appLogoUrl} 
                alt="App Logo" 
                style={styles.appLogoImg} 
                onError={(e) => {
                  // পিকচার ব্যাকআপ ট্রাই যদি ইমেজ লোড না হয়
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
      <div style={{ ...styles.iconBox, background: `linear-gradient(135deg,${color},#7c3aed)` }}>
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

function Benefit({ icon, title, text }) {
  return (
    <div style={styles.benefit}>
      <div style={styles.benefitIcon}>{icon}</div>

      <div>
        <h3 style={{ margin: 0, fontSize: "16px" }}>{title}</h3>
        <p style={{ margin: 0, fontSize: "13px", opacity: 0.9 }}>{text}</p>
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    background: "linear-gradient(135deg,#ffd18a,#eef3ff,#dff7ff)",
    padding: "15px",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    boxSizing: "border-box"
  },

  card: {
    width: "100%",
    maxWidth: "980px",
    background: "#fff",
    borderRadius: "36px",
    display: "flex",
    overflow: "hidden",
    boxShadow: "0 25px 70px rgba(0,0,0,.18)"
  },

  leftPanel: {
    width: "35%",
    background: "linear-gradient(180deg,#7c2cff,#4f20d8,#631bd9)",
    color: "white",
    padding: "32px 24px",
    position: "relative",
    boxSizing: "border-box"
  },

  piggyWrap: {
    position: "relative",
    width: "120px",
    height: "100px",
    marginBottom: "15px"
  },

  coin: {
    position: "absolute",
    top: "-8px",
    left: "42px",
    width: "36px",
    height: "36px",
    borderRadius: "50%",
    background: "#ffd43b",
    color: "#7c3aed",
    fontWeight: "900",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "20px",
    zIndex: 3,
    boxShadow: "0 8px 15px rgba(0,0,0,.2)"
  },

  piggy: {
    position: "absolute",
    bottom: 0,
    left: 0,
    width: "115px",
    height: "80px",
    borderRadius: "45px 50px 35px 35px",
    background: "linear-gradient(135deg,#ffb3c7,#ff6aa2)",
    boxShadow: "inset -10px -8px 0 rgba(255,0,100,.16)"
  },

  earLeft: {
    position: "absolute",
    top: "-14px",
    left: "20px",
    width: "26px",
    height: "26px",
    background: "#ff8ab8",
    borderRadius: "8px 20px 8px 20px",
    transform: "rotate(25deg)"
  },

  earRight: {
    position: "absolute",
    top: "-10px",
    right: "16px",
    width: "22px",
    height: "22px",
    background: "#ff8ab8",
    borderRadius: "8px 18px 8px 18px",
    transform: "rotate(45deg)"
  },

  eyeLeft: {
    position: "absolute",
    top: "24px",
    left: "68px",
    width: "6px",
    height: "6px",
    borderRadius: "50%",
    background: "#1e293b"
  },

  eyeRight: {
    position: "absolute",
    top: "24px",
    left: "88px",
    width: "6px",
    height: "6px",
    borderRadius: "50%",
    background: "#1e293b"
  },

  nose: {
    position: "absolute",
    right: "-6px",
    top: "30px",
    width: "30px",
    height: "22px",
    borderRadius: "50%",
    background: "#ff8ab8",
    color: "#7c2d12",
    fontSize: "7px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center"
  },

  legOne: {
    position: "absolute",
    bottom: "-6px",
    left: "28px",
    width: "16px",
    height: "14px",
    background: "#ff6aa2",
    borderRadius: "0 0 6px 6px"
  },

  legTwo: {
    position: "absolute",
    bottom: "-6px",
    right: "30px",
    width: "16px",
    height: "14px",
    background: "#ff6aa2",
    borderRadius: "0 0 6px 6px"
  },

  brand: {
    fontSize: "48px",
    lineHeight: "44px",
    margin: 0,
    fontWeight: "900",
    letterSpacing: "-1px"
  },

  brandSub: {
    marginTop: "12px",
    fontSize: "15px"
  },

  why: {
    color: "#ffde3b",
    marginTop: "30px",
    fontSize: "20px"
  },

  benefit: {
    display: "flex",
    gap: "12px",
    alignItems: "center",
    marginTop: "14px"
  },

  benefitIcon: {
    width: "42px",
    height: "42px",
    borderRadius: "12px",
    background: "linear-gradient(135deg,#38bdf8,#2563eb)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "20px",
    flexShrink: 0
  },

  rightPanel: {
    flex: 1,
    padding: "32px 28px",
    boxSizing: "border-box"
  },

  create: {
    textAlign: "center",
    fontSize: "26px",
    color: "#0f172a",
    margin: 0
  },

  account: {
    textAlign: "center",
    fontSize: "52px",
    margin: "-5px 0 10px",
    background: "linear-gradient(135deg,#ff2ebd,#8b2cff,#118cff)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
    fontWeight: "900"
  },

  join: {
    textAlign: "center",
    fontSize: "15px",
    color: "#475569",
    marginBottom: "20px"
  },

  inputWrap: {
    minHeight: "56px",
    border: "1.8px solid",
    borderRadius: "18px",
    display: "flex",
    alignItems: "center",
    padding: "0 12px",
    gap: "12px",
    marginTop: "12px",
    boxSizing: "border-box"
  },

  iconBox: {
    width: "40px",
    height: "40px",
    borderRadius: "12px",
    color: "white",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "20px",
    flexShrink: 0
  },

  input: {
    flex: 1,
    width: "100%",
    minWidth: 0,
    border: "none",
    outline: "none",
    fontSize: "16px",
    color: "#0f172a",
    background: "transparent"
  },

  otpInlineBtn: {
    padding: "8px 12px",
    background: "linear-gradient(135deg,#0ea5e9,#7c3aed)",
    color: "white",
    border: "none",
    borderRadius: "10px",
    fontSize: "13px",
    fontWeight: "bold",
    cursor: "pointer",
    whiteSpace: "nowrap"
  },

  eye: {
    border: "none",
    background: "transparent",
    fontSize: "20px",
    cursor: "pointer"
  },

  checkRow: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    marginTop: "18px",
    fontSize: "14px",
    color: "#334155"
  },

  checkbox: {
    width: "18px",
    height: "18px"
  },

  termsLink: {
    color: "#7c3aed",
    cursor: "pointer"
  },

  registerBtn: {
    width: "100%",
    height: "58px",
    border: "none",
    borderRadius: "18px",
    marginTop: "20px",
    background: "linear-gradient(135deg,#ff2ebd,#8b2cff,#412cff)",
    color: "white",
    fontSize: "20px",
    fontWeight: "900",
    position: "relative",
    boxShadow: "0 10px 20px rgba(124,58,237,.35)",
    cursor: "pointer"
  },

  arrow: {
    position: "absolute",
    right: "12px",
    top: "9px",
    width: "40px",
    height: "40px",
    borderRadius: "50%",
    background: "white",
    color: "#4f46e5",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "30px"
  },

  loginText: {
    textAlign: "center",
    marginTop: "16px",
    color: "#475569"
  },

  loginLink: {
    color: "#7c3aed",
    fontWeight: "900",
    cursor: "pointer",
    marginLeft: "6px"
  },

  disclaimer: {
    marginTop: "20px",
    background: "#f0fdf4",
    border: "1px solid #bbf7d0",
    borderRadius: "18px",
    padding: "14px",
    display: "flex",
    gap: "12px"
  },

  disIcon: {
    width: "42px",
    height: "42px",
    borderRadius: "12px",
    background: "linear-gradient(135deg,#22c55e,#16a34a)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "22px",
    flexShrink: 0
  },

  disclaimerTitle: {
    margin: 0,
    color: "#16a34a",
    fontSize: "15px"
  },

  disclaimerText: {
    color: "#334155",
    lineHeight: "20px",
    fontSize: "12px",
    marginTop: "4px"
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

  /* High-Premium Quality Popup Styles */
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
  },

  bottomFeatures: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "10px",
    marginTop: "24px"
  },

  bottomItem: {
    display: "flex",
    alignItems: "center",
    gap: "8px"
  },

  bottomIcon: {
    width: "36px",
    height: "36px",
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "white",
    fontSize: "13px",
    boxShadow: "0 4px 10px rgba(0,0,0,0.12)",
    flexShrink: 0
  },

  bottomTitle: {
    fontSize: "11px",
    fontWeight: "700",
    color: "#111827",
    lineHeight: "14px"
  },

  bottomText: {
    fontSize: "11px",
    fontWeight: "700",
    color: "#111827",
    lineHeight: "14px"
  }
};
