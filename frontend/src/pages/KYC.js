import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { toast } from "react-toastify";
import { API } from "../config";

export default function KYC() {
  const navigate = useNavigate();
  const location = useLocation();

  const email = localStorage.getItem("email") || "";
  const token = localStorage.getItem("token") || "";

  const [user, setUser] = useState({});
  const [aadhaarNumber, setAadhaarNumber] = useState("");
  const [panNumber, setPanNumber] = useState("");
  const [aadhaarFile, setAadhaarFile] = useState(null);
  const [panFile, setPanFile] = useState(null);
  const [photoFile, setPhotoFile] = useState(null);
  const [kycStatus, setKycStatus] = useState("");
  const [loading, setLoading] = useState(false);

  // 👇 সাইডবার ড্রয়ার ও ডাউনলোড স্টেট     
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isDownloadingPlan, setIsDownloadingPlan] = useState(false);

  // 👇 স্বাইপ হ্যান্ডলার স্টেট
  const [touchStartX, setTouchStartX] = useState(0);
  const [touchStartY, setTouchStartY] = useState(0);

  useEffect(() => {
    loadKyc();
  }, []);

  const handleTouchStart = (e) => {
    setTouchStartX(e.touches[0].clientX);
    setTouchStartY(e.touches[0].clientY);
  };

  const handleTouchEnd = (e) => {
    const touchEndX = e.changedTouches[0].clientX;
    const touchEndY = e.changedTouches[0].clientY;

    const diffX = touchEndX - touchStartX;
    const diffY = touchEndY - touchStartY;

    if (touchStartX < 80 && diffX > 60 && Math.abs(diffX) > Math.abs(diffY)) {
      setIsDrawerOpen(true);
    }
  };

  const handleDownloadPlan = () => {
    if (isDownloadingPlan) return;
    setIsDownloadingPlan(true);

    setTimeout(() => {
      const link = document.createElement("a");
      link.href = "/SAVE_MONEY_PRIVATE_LIMITED.pdf";
      link.download = "SAVE_MONEY_PRIVATE_LIMITED.pdf";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setIsDownloadingPlan(false);
    }, 1200);
  };

  const handleLogout = async () => {
    try {
      if (email) {
        await fetch(`${API}/logout`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ email })
        });
      }
    } catch (err) {
      console.log("Logout backend error:", err);
    } finally {
      localStorage.clear();
      navigate("/login");
      window.location.reload();
    }
  };

  const go = (path) => {
    navigate(path);
  };

  const loadKyc = async () => {
    try {
      const res = await fetch(`${API}/kyc-info`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          authorization: token
        },
        body: JSON.stringify({ email })
      });

      const data = await res.json();

      if (data.success) {
        const u = data.user || {};
        setUser(u);
        setAadhaarNumber(u.aadhaarNumber || u.aadhaar || "");
        setPanNumber(u.panNumber || u.pan || "");
        setKycStatus(u.kycStatus || "");
      }
    } catch (err) {
      console.log("KYC LOAD ERROR:", err);
    }
  };

  const submitKyc = async () => {
    const status = String(kycStatus || "").toLowerCase();

    if (["reviewing", "approved"].includes(status)) {
      toast.info("KYC already submitted.");
      return;
    }
    
    if (!aadhaarNumber || aadhaarNumber.length !== 12) {
      toast.info("Enter valid 12 digit Aadhaar number");
      return;
    }

    if (!panNumber || panNumber.length !== 10) {
      toast.info("Enter valid 10 digit PAN number");
      return;
    }

    if (!aadhaarFile || !panFile || !photoFile) {
      toast.info("Please upload Aadhaar, PAN and Photo");
      return;
    }

    try {
      setLoading(true);

      const formData = new FormData();
      formData.append("email", email);
      formData.append("aadhaarNumber", aadhaarNumber);
      formData.append("panNumber", panNumber);
      formData.append("aadhaarFile", aadhaarFile);
      formData.append("panFile", panFile);
      formData.append("photo", photoFile);

      const res = await fetch(`${API}/submit-kyc`, {
        method: "POST",
        headers: { authorization: token },
        body: formData
      });

      const data = await res.json();
      toast.success(data.msg || "KYC submitted");

      if (data.success) {
        setKycStatus("reviewing");
        loadKyc();
      }
    } catch (err) {
      console.log("KYC SUBMIT ERROR:", err);
      toast.info("KYC submit failed");
    } finally {
      setLoading(false);
    }
  };

  const statusText =
    kycStatus === "approved"
      ? "Approved"
      : kycStatus === "reviewing"
      ? "Reviewing"
      : kycStatus === "pending"
      ? "Pending"
      : kycStatus === "rejected"
      ? "Rejected"
      : "Not Submitted";

  return (
    <div 
      style={styles.page}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* 👇 SIDEBAR DRAWER (Home.js থেকে ১০০% সেম সাইডবার) */}
      <div style={{
        ...styles.drawerOverlay,
        opacity: isDrawerOpen ? 1 : 0,
        visibility: isDrawerOpen ? "visible" : "hidden"
      }} onClick={() => setIsDrawerOpen(false)}>
        <div style={{
          ...styles.drawerContainer,
          transform: isDrawerOpen ? "translateX(0)" : "translateX(-100%)"
        }} onClick={(e) => e.stopPropagation()}>
          
          {/* LOGO & BRANDING */}
          <div style={styles.drawerHeader}>
            <div style={styles.drawerBrand}>
              <div style={styles.drawerLogoWrapper}>
                <img 
                  src={process.env.PUBLIC_URL ? `${process.env.PUBLIC_URL}/logo512.png` : "/logo512.png"} 
                  alt="SM Logo" 
                  style={styles.drawerLogoImg} 
                  onError={(e) => { e.target.style.display = 'none'; }}
                />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <h3 style={styles.drawerLogoText}>SAVE MONEY</h3>
                <span style={styles.drawerLogoSubtext}>Invest Small, Earn Big</span>
              </div>
            </div>
          </div>

          {/* SIDEBAR CONTENT */}
          <div style={styles.drawerScrollArea}>
            <div style={styles.drawerNavList}>
              <button 
                style={{
                  ...styles.drawerNavItem,
                  ...styles.drawerNavDashboard,
                  ...(location.pathname === "/home" ? styles.drawerNavItemActive : {})
                }} 
                onClick={() => { go("/home"); setIsDrawerOpen(false); }}
              >
                <span style={styles.drawerNavIcon}>🏠</span>
                <span style={styles.drawerNavText}>Dashboard</span>
              </button>

              <button 
                style={{
                  ...styles.drawerNavItem,
                  ...styles.drawerNavMyInvestment,
                  ...(location.pathname === "/my-investment" ? styles.drawerNavItemActive : {})
                }} 
                onClick={() => { go("/my-investment"); setIsDrawerOpen(false); }}
              >
                <span style={styles.drawerNavIcon}>📈</span>
                <span style={styles.drawerNavText}>My Investment</span>
              </button>

              <button 
                style={{
                  ...styles.drawerNavItem,
                  ...styles.drawerNavSaveMoney,
                  ...(location.pathname === "/save-money" ? styles.drawerNavItemActive : {})
                }} 
                onClick={() => { go("/save-money"); setIsDrawerOpen(false); }}
              >
                <span style={styles.drawerNavIcon}>💰</span>
                <span style={styles.drawerNavText}>Save Money</span>
              </button>

              <button 
                style={{
                  ...styles.drawerNavItem,
                  ...styles.drawerNavOneTime,
                  ...(location.pathname === "/one-time" ? styles.drawerNavItemActive : {})
                }} 
                onClick={() => { go("/one-time"); setIsDrawerOpen(false); }}
              >
                <span style={styles.drawerNavIcon}>⚡</span>
                <span style={styles.drawerNavText}>One Time</span>
              </button>

              <button 
                style={{
                  ...styles.drawerNavItem,
                  ...styles.drawerNavPlan
                }} 
                onClick={() => { handleDownloadPlan(); setIsDrawerOpen(false); }}
                disabled={isDownloadingPlan}
              >
                <span style={styles.drawerNavIcon}>{isDownloadingPlan ? "⏳" : "📋"}</span>
                <span style={styles.drawerNavText}>{isDownloadingPlan ? "Downloading..." : "Plan PDF"}</span>
              </button>

              <button 
                style={{
                  ...styles.drawerNavItem,
                  ...styles.drawerNavAddFund,
                  ...(location.pathname === "/wallet" ? styles.drawerNavItemActive : {})
                }} 
                onClick={() => { go("/wallet"); setIsDrawerOpen(false); }}
              >
                <span style={styles.drawerNavIcon}>🌐</span>
                <span style={styles.drawerNavText}>Add Fund</span>
              </button>

              <button 
                style={{
                  ...styles.drawerNavItem,
                  ...styles.drawerNavRefer,
                  ...(location.pathname === "/refer" ? styles.drawerNavItemActive : {})
                }} 
                onClick={() => { go("/refer"); setIsDrawerOpen(false); }}
              >
                <span style={styles.drawerNavIcon}>👥</span>
                <span style={styles.drawerNavText}>Refer & Earn</span>
              </button>

              <button 
                style={{
                  ...styles.drawerNavItem,
                  ...styles.drawerNavWithdraw,
                  ...(location.pathname === "/withdraw" ? styles.drawerNavItemActive : {})
                }} 
                onClick={() => { go("/withdraw"); setIsDrawerOpen(false); }}
              >
                <span style={styles.drawerNavIcon}>➔</span>
                <span style={styles.drawerNavText}>Withdraw</span>
              </button>

              <button 
                style={{
                  ...styles.drawerNavItem,
                  ...styles.drawerNavDailyReward,
                  ...(location.pathname === "/daily-reward" ? styles.drawerNavItemActive : {})
                }} 
                onClick={() => { go("/daily-reward"); setIsDrawerOpen(false); }}
              >
                <span style={styles.drawerNavIcon}>🎁</span>
                <span style={styles.drawerNavText}>Daily Reward</span>
              </button>

              <button 
                style={{
                  ...styles.drawerNavItem,
                  ...styles.drawerNavInvestmentAssistant,
                  ...(location.pathname === "/investment-assistant" ? styles.drawerNavItemActive : {})
                }} 
                onClick={() => { go("/investment-assistant"); setIsDrawerOpen(false); }}
              >
                <span style={styles.drawerNavIcon}>📊</span>
                <span style={styles.drawerNavText}>Investment Assistance</span>
              </button>

              <button 
                style={{
                  ...styles.drawerNavItem,
                  ...styles.drawerNavSupport,
                  ...(location.pathname === "/support" ? styles.drawerNavItemActive : {})
                }} 
                onClick={() => { go("/support"); setIsDrawerOpen(false); }}
              >
                <span style={styles.drawerNavIcon}>🎧</span>
                <span style={styles.drawerNavText}>Support</span>
              </button>

              <button 
                style={{
                  ...styles.drawerNavItem,
                  ...styles.drawerNavProfile,
                  ...(location.pathname === "/kyc" ? styles.drawerNavItemActive : {})
                }} 
                onClick={() => { go("/kyc"); setIsDrawerOpen(false); }}
              >
                <span style={styles.drawerNavIcon}>👤</span>
                <span style={styles.drawerNavText}>Profile</span>
              </button>

              <button 
                style={{
                  ...styles.drawerNavItem,
                  ...styles.drawerNavLogout
                }} 
                onClick={() => { setIsDrawerOpen(false); handleLogout(); }}
              >
                <span style={styles.drawerNavIcon}>🚪</span>
                <span style={styles.drawerNavText}>Logout</span>
              </button>
            </div>

            {/* FULL VISIBLE TREE PLANT SECTION */}
            <div style={styles.treePlantOnlyWrapper}>
              <img 
                src="/tree plant.png" 
                alt="Tree Plant" 
                style={styles.treePlantOnlyImg}
                onError={(e) => {
                  if (e.target.src.includes('.png')) {
                    e.target.src = '/tree plant.jpg';
                  }
                }}
              />
            </div>
          </div>

        </div>
      </div>

      <div style={styles.container}>

        <div style={styles.hero}>
          <button style={styles.menuBtn} onClick={() => setIsDrawerOpen(true)}>
            ☰
          </button>

          <div style={styles.heroIcon}>🛡️</div>

          <div style={{ flex: 1 }}>
            <h1 style={styles.title}>
              KYC <span>Verification</span>
            </h1>
            <p style={styles.subtitle}>
              Secure your account. Complete KYC to unlock all features.
            </p>
          </div>

          <div style={styles.heroArt}>🪪🔐</div>
        </div>

        <div style={styles.card}>
          <div style={styles.cardHead}>
            <span style={styles.headIcon}>👤</span>
            <h2>Personal Information</h2>
          </div>

          <div style={styles.infoGrid} className="responsive-grid">
            <Info icon="👤" title="Name" value={user.name || "N/A"} color="#7c3aed" />
            <Info icon="✉️" title="Email" value={user.email || email} color="#0ea5e9" />
            <Info icon="📞" title="Mobile" value={user.mobile || "N/A"} color="#22c55e" />
            <Info icon="🎁" title="Referral Code" value={user.referCode || "N/A"} color="#f97316" />
            <Info icon="👛" title="Wallet ID" value={user.walletId || user.walletAddress || "N/A"} color="#a855f7" />
            <Info icon="📅" title="Account Created Date" value={user.createdAt ? new Date(user.createdAt).toLocaleDateString("en-IN") : "N/A"} color="#ec4899" />
            <Info icon="🆔" title="Aadhaar Number" value={aadhaarNumber || "Not Added"} color="#facc15" />
            <Info icon="💳" title="PAN Number" value={panNumber || "Not Added"} color="#38bdf8" />

            <div style={styles.statusBox}>
              <span style={styles.statusIcon}>✅</span>
              <div>
                <p style={{ margin: 0, fontSize: "12px", color: "#a7a3b7" }}>KYC Status</p>
                <b
                  style={{
                    ...styles.status,
                    color:
                      kycStatus === "approved"
                        ? "#22c55e"
                        : kycStatus === "reviewing"
                        ? "#38bdf8"
                        : "#facc15",
                    borderColor:
                      kycStatus === "approved"
                        ? "#22c55e"
                        : kycStatus === "reviewing"
                        ? "#38bdf8"
                        : "#facc15"
                  }}
                >
                  {statusText}
                </b>
              </div>
            </div>
          </div>
        </div>

        <div style={styles.card}>
          <div style={styles.cardHead}>
            <span style={styles.headIcon}>📄</span>
            <div>
              <h2 style={{ margin: 0, fontSize: "20px" }}>Upload Documents</h2>
              <p style={styles.muted}>
                Please upload clear and valid documents. All documents are secure and encrypted.
              </p>
            </div>
          </div>

          <DocUpload
            logo="🌈"
            title="Aadhaar Card"
            desc="Upload front side of your Aadhaar card"
            label="Aadhaar Number"
            placeholder="Enter 12 digit Aadhaar number"
            value={aadhaarNumber}
            onChange={(v) => setAadhaarNumber(v.replace(/\D/g, "").slice(0, 12))}
            file={aadhaarFile}
            setFile={setAadhaarFile}
          />

          <DocUpload
            logo="💳"
            title="PAN Card"
            desc="Upload front side of your PAN card"
            label="PAN Number"
            placeholder="Enter 10 digit PAN number"
            value={panNumber}
            onChange={(v) => setPanNumber(v.toUpperCase().slice(0, 10))}
            file={panFile}
            setFile={setPanFile}
          />

          <div style={styles.docRow} className="responsive-doc-row">
            <div style={styles.preview}>👨‍💼</div>

            <div style={styles.docMiddle}>
              <h3 style={{ margin: 0, fontSize: "18px" }}>Your Photo</h3>
              <p style={{ margin: "4px 0", fontSize: "13px", color: "#a7a3b7" }}>Upload your recent passport size photo</p>
            </div>

            <FileBox file={photoFile} setFile={setPhotoFile} text="Upload Photo" />
          </div>

          <button
            style={{
              ...styles.submitBtn,
              opacity: ["reviewing", "approved"].includes(String(kycStatus || "").toLowerCase()) ? 0.5 : 1
            }}
            onClick={submitKyc}
            disabled={loading || ["reviewing", "approved"].includes(String(kycStatus || "").toLowerCase())}
          >
            🛡 {loading ? "Submitting..." : "Submit KYC"} →
          </button>

          <p style={styles.safe}>🔒 Your information is 100% secure and encrypted</p>
        </div>

        <div style={styles.process}>
          <h2 style={{ fontSize: "20px", marginBottom: "16px" }}>✨ How KYC Process Works</h2>

          <div style={styles.steps} className="responsive-steps">
            <Step no="1" icon="☁️" title="Upload Documents" text="Upload Aadhaar, PAN & Photo" />
            <Step no="2" icon="📋" title="Verify Details" text="We verify your information" />
            <Step no="3" icon="🔍" title="Under Review" text="KYC takes 5-24 hours" />
            <Step no="4" icon="🛡️" title="Get Verified" text="Unlock all features" />
          </div>
        </div>

        <div style={styles.bottom} className="responsive-bottom">
          <Mini icon="🛡️" title="100% Secure" text="Your data is safe" />
          <Mini icon="🔐" title="Data Encrypted" text="Protected information" />
          <Mini icon="⏱️" title="Quick Verification" text="Within 24 hours" />
          <Mini icon="✅" title="Trusted Platform" text="Safe verification" />
        </div>

      </div>

      {/* 📱 Mobile CSS Auto Responsive Fixes */}
      <style>{`
        @media (max-width: 768px) {
          .responsive-grid {
            grid-template-columns: 1fr !important;
          }
          .responsive-doc-row {
            grid-template-columns: 1fr !important;
            text-align: center;
          }
          .responsive-steps {
            grid-template-columns: 1fr 1fr !important;
          }
          .responsive-bottom {
            grid-template-columns: 1fr 1fr !important;
          }
        }
        @media (max-width: 480px) {
          .responsive-steps, .responsive-bottom {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}

function Info({ icon, title, value, color }) {
  return (
    <div style={styles.info}>
      <span style={{ ...styles.infoIcon, background: color }}>{icon}</span>
      <div>
        <p style={{ margin: 0, fontSize: "12px", color: "#a7a3b7" }}>{title}</p>
        <b style={{ fontSize: "14px", wordBreak: "break-all" }}>{value}</b>
      </div>
    </div>
  );
}

function DocUpload({ logo, title, desc, label, placeholder, value, onChange, file, setFile }) {
  return (
    <div style={styles.docRow} className="responsive-doc-row">
      <div style={styles.preview}>{logo}</div>

      <div style={styles.docMiddle}>
        <h3 style={{ margin: 0, fontSize: "18px" }}>{title}</h3>
        <p style={{ margin: "4px 0 10px 0", fontSize: "13px", color: "#a7a3b7" }}>{desc}</p>

        <label style={{ fontSize: "12px", color: "#cbd5e1" }}>{label}</label>
        <input
          style={styles.input}
          value={value}
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value)}
        />
      </div>

      <FileBox file={file} setFile={setFile} text="Upload Image" />
    </div>
  );
}

function FileBox({ file, setFile, text }) {
  return (
    <label style={styles.fileBox}>
      <span>☁️</span>
      <b style={{ fontSize: "13px", margin: "4px 0" }}>{file ? file.name : text}</b>
      <small style={{ fontSize: "10px", color: "#94a3b8" }}>PNG, JPG (Max 2MB)</small>
      <input
        type="file"
        hidden
        accept="image/*"
        onChange={(e) => setFile(e.target.files[0])}
      />
    </label>
  );
}

function Step({ no, icon, title, text }) {
  return (
    <div style={styles.step}>
      <b style={{ background: "#7c3aed", color: "white", padding: "2px 8px", borderRadius: "10px", fontSize: "12px" }}>{no}</b>
      <span style={{ fontSize: "24px", display: "block", margin: "6px 0" }}>{icon}</span>
      <h4 style={{ margin: "4px 0", fontSize: "14px" }}>{title}</h4>
      <p style={{ margin: 0, fontSize: "11px", color: "#a7a3b7" }}>{text}</p>
    </div>
  );
}

function Mini({ icon, title, text }) {
  return (
    <div style={styles.mini}>
      <span style={{ fontSize: "20px" }}>{icon}</span>
      <div>
        <b style={{ fontSize: "12px" }}>{title}</b>
        <p style={{ margin: 0, fontSize: "10px", color: "#a7a3b7" }}>{text}</p>
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    background: "radial-gradient(circle at top right,#4c1d95,#12002f 45%,#050014)",
    color: "white",
    padding: "16px",
    fontFamily: "Arial, sans-serif"
  },

  container: {
    maxWidth: "1150px",
    margin: "0 auto"
  },

  hero: {
    display: "flex",
    alignItems: "center",
    gap: "14px",
    marginBottom: "20px",
    flexWrap: "wrap"
  },

  menuBtn: {
    width: "48px",
    height: "48px",
    borderRadius: "14px",
    border: "1px solid rgba(255,255,255,.15)",
    background: "rgba(255,255,255,.06)",
    color: "#c084fc",
    fontSize: "24px",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center"
  },

  heroIcon: {
    width: "60px",
    height: "60px",
    borderRadius: "18px",
    background: "linear-gradient(135deg,#7c3aed,#ec4899)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "30px",
    boxShadow: "0 0 20px rgba(168,85,247,.45)"
  },

  title: {
    margin: 0,
    fontSize: "28px",
    fontWeight: "900"
  },

  subtitle: {
    color: "#c4b5fd",
    fontSize: "13px",
    margin: "4px 0 0 0"
  },

  heroArt: {
    marginLeft: "auto",
    fontSize: "48px",
    filter: "drop-shadow(0 0 20px #a855f7)"
  },

  card: {
    background: "linear-gradient(145deg,rgba(42,15,92,.95),rgba(10,0,35,.98))",
    border: "1px solid rgba(168,85,247,.28)",
    borderRadius: "20px",
    padding: "20px",
    marginBottom: "20px",
    boxShadow: "0 0 32px rgba(168,85,247,.16)"
  },

  cardHead: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    marginBottom: "18px"
  },

  headIcon: {
    width: "42px",
    height: "42px",
    borderRadius: "12px",
    background: "linear-gradient(135deg,#7c3aed,#ec4899)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "20px"
  },

  muted: {
    color: "#a7a3b7",
    margin: "2px 0 0 0",
    fontSize: "12px"
  },

  infoGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "12px"
  },

  info: {
    background: "rgba(255,255,255,.035)",
    border: "1px solid rgba(255,255,255,.07)",
    borderRadius: "14px",
    padding: "12px",
    display: "flex",
    alignItems: "center",
    gap: "10px"
  },

  infoIcon: {
    width: "40px",
    height: "40px",
    borderRadius: "12px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "18px",
    flexShrink: 0
  },

  statusBox: {
    background: "rgba(255,255,255,.035)",
    border: "1px solid rgba(255,255,255,.07)",
    borderRadius: "14px",
    padding: "12px",
    display: "flex",
    alignItems: "center",
    gap: "10px"
  },

  statusIcon: {
    width: "40px",
    height: "40px",
    borderRadius: "12px",
    background: "#16a34a",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0
  },

  status: {
    display: "inline-block",
    padding: "4px 10px",
    borderRadius: "12px",
    border: "1px solid",
    fontWeight: "800",
    fontSize: "12px",
    marginTop: "4px"
  },

  docRow: {
    display: "grid",
    gridTemplateColumns: "120px 1fr 220px",
    gap: "16px",
    alignItems: "center",
    padding: "16px 0",
    borderBottom: "1px solid rgba(255,255,255,.08)"
  },

  preview: {
    height: "100px",
    borderRadius: "16px",
    background: "linear-gradient(145deg,#1f0758,#0b0225)",
    border: "1px solid rgba(255,255,255,.08)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "40px"
  },

  docMiddle: {},

  input: {
    width: "100%",
    marginTop: "6px",
    padding: "10px 12px",
    borderRadius: "10px",
    border: "1px solid rgba(168,85,247,.55)",
    background: "rgba(255,255,255,.05)",
    color: "white",
    outline: "none",
    fontSize: "14px",
    boxSizing: "border-box"
  },

  fileBox: {
    height: "100px",
    borderRadius: "16px",
    border: "2px dashed #2563eb",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    color: "white",
    textAlign: "center",
    padding: "8px"
  },

  submitBtn: {
    width: "100%",
    height: "52px",
    marginTop: "20px",
    borderRadius: "14px",
    border: "none",
    background: "linear-gradient(90deg,#6d5dfc,#ec168e)",
    color: "white",
    fontSize: "18px",
    fontWeight: "800",
    cursor: "pointer"
  },

  safe: {
    textAlign: "center",
    color: "#a7a3b7",
    fontSize: "12px",
    marginTop: "12px"
  },

  process: {
    background: "linear-gradient(145deg,rgba(42,15,92,.92),rgba(10,0,35,.95))",
    border: "1px solid rgba(168,85,247,.25)",
    borderRadius: "20px",
    padding: "18px",
    marginBottom: "16px"
  },

  steps: {
    display: "grid",
    gridTemplateColumns: "repeat(4,1fr)",
    gap: "10px",
    textAlign: "center"
  },

  step: {
    background: "rgba(255,255,255,.035)",
    borderRadius: "14px",
    padding: "12px"
  },

  bottom: {
    display: "grid",
    gridTemplateColumns: "repeat(4,1fr)",
    gap: "10px"
  },

  mini: {
    background: "linear-gradient(145deg,rgba(42,15,92,.92),rgba(10,0,35,.95))",
    border: "1px solid rgba(168,85,247,.25)",
    borderRadius: "14px",
    padding: "12px",
    display: "flex",
    gap: "10px",
    alignItems: "center"
  },

  // 👇 Home.js ড্রয়ার স্টাইলসমূহ
  drawerOverlay: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: "rgba(0, 0, 0, 0.75)",
    backdropFilter: "blur(6px)",
    zIndex: 100002,
    display: "flex",
    justifyContent: "flex-start",
    transition: "opacity 0.3s ease, visibility 0.3s ease"
  },
  drawerContainer: {
    position: "fixed",
    top: 0,
    bottom: 0,
    left: 0,
    background: "#08101e",
    width: "230px",
    height: "100vh",
    padding: "12px 8px",
    display: "flex",
    flexDirection: "column",
    boxShadow: "10px 0 30px rgba(0,0,0,0.85)",
    borderRight: "1px solid #1e293b",
    transform: "translateX(-100%)",
    transition: "transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
    overflow: "hidden",
    zIndex: 100003
  },
  drawerHeader: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: "10px",
    paddingBottom: "8px",
    borderBottom: "1px solid rgba(255, 255, 255, 0.1)",
    flexShrink: 0
  },
  drawerBrand: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "4px"
  },
  drawerLogoWrapper: {
    width: "42px",
    height: "42px",
    borderRadius: "50%",
    background: "radial-gradient(circle, #03251a 0%, #064e3b 100%)",
    border: "2px solid #22c55e",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    boxShadow: "0 0 10px rgba(34, 197, 94, 0.4)"
  },
  drawerLogoImg: {
    width: "26px",
    height: "26px",
    objectFit: "contain"
  },
  drawerLogoText: {
    margin: 0,
    fontSize: "15px",
    fontWeight: "900",
    color: "#ffffff",
    letterSpacing: "0.6px",
    textAlign: "center"
  },
  drawerLogoSubtext: {
    fontSize: "10px",
    color: "#a7f3d0",
    fontWeight: "600",
    marginTop: "1px",
    textAlign: "center"
  },
  drawerScrollArea: {
    flex: 1,
    overflowY: "auto",
    display: "flex",
    flexDirection: "column",
    gap: "10px",
    paddingRight: "2px"
  },
  drawerNavList: {
    display: "flex",
    flexDirection: "column",
    gap: "6px",
    flexShrink: 0
  },
  drawerNavItem: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    padding: "8px 12px",
    background: "rgba(255, 255, 255, 0.12)",
    backdropFilter: "blur(10px)",
    WebkitBackdropFilter: "blur(10px)",
    border: "1px solid rgba(255, 255, 255, 0.25)",
    clipPath: "polygon(10px 0%, calc(100% - 10px) 0%, 100% 50%, calc(100% - 10px) 100%, 10px 100%, 0% 50%)",
    color: "#ffffff",
    fontSize: "12px",
    fontWeight: "800",
    cursor: "pointer",
    textAlign: "left",
    transition: "all 0.25s ease",
    boxShadow: "0 2px 8px rgba(0,0,0,0.3)",
    textShadow: "0 1px 2px rgba(0,0,0,0.5)"
  },
  drawerNavItemActive: {
    background: "rgba(255, 255, 255, 0.3)",
    border: "1px solid #ffffff",
    boxShadow: "0 0 12px rgba(255, 255, 255, 0.5)",
    fontWeight: "900"
  },
  drawerNavIcon: {
    fontSize: "16px",
    width: "20px",
    display: "inline-block",
    textAlign: "center"
  },
  drawerNavText: {
    flex: 1,
    fontSize: "12px",
    letterSpacing: "0.3px",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis"
  },
  drawerNavDashboard: {
    background: "rgba(59, 130, 246, 0.25)",
    border: "1px solid rgba(59, 130, 246, 0.5)"
  },
  drawerNavMyInvestment: {
    background: "rgba(16, 185, 129, 0.25)",
    border: "1px solid rgba(16, 185, 129, 0.5)"
  },
  drawerNavSaveMoney: {
    background: "rgba(245, 158, 11, 0.25)",
    border: "1px solid rgba(245, 158, 11, 0.5)"
  },
  drawerNavOneTime: {
    background: "rgba(168, 85, 247, 0.25)",
    border: "1px solid rgba(168, 85, 247, 0.5)"
  },
  drawerNavPlan: {
    background: "rgba(6, 182, 212, 0.25)",
    border: "1px solid rgba(6, 182, 212, 0.5)"
  },
  drawerNavAddFund: {
    background: "rgba(20, 184, 166, 0.25)",
    border: "1px solid rgba(20, 184, 166, 0.5)"
  },
  drawerNavRefer: {
    background: "rgba(236, 72, 153, 0.25)",
    border: "1px solid rgba(236, 72, 153, 0.5)"
  },
  drawerNavWithdraw: {
    background: "rgba(249, 115, 22, 0.25)",
    border: "1px solid rgba(249, 115, 22, 0.5)"
  },
  drawerNavDailyReward: {
    background: "rgba(244, 63, 94, 0.25)",
    border: "1px solid rgba(244, 63, 94, 0.5)"
  },
  drawerNavInvestmentAssistant: {
    background: "rgba(2, 132, 199, 0.25)",
    border: "1px solid rgba(2, 132, 199, 0.5)"
  },
  drawerNavSupport: {
    background: "rgba(99, 102, 241, 0.25)",
    border: "1px solid rgba(99, 102, 241, 0.5)"
  },
  drawerNavProfile: {
    background: "rgba(236, 72, 153, 0.25)",
    border: "1px solid rgba(236, 72, 153, 0.5)"
  },
  drawerNavLogout: {
    background: "rgba(239, 68, 68, 0.25)",
    border: "1px solid rgba(239, 68, 68, 0.5)"
  },
  treePlantOnlyWrapper: {
    width: "100%",
    paddingTop: "6px",
    paddingBottom: "10px",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    flexShrink: 0
  },
  treePlantOnlyImg: {
    width: "100%",
    maxHeight: "110px",
    objectFit: "cover",
    borderRadius: "12px",
    boxShadow: "0 4px 12px rgba(0, 0, 0, 0.5)"
  }
};
