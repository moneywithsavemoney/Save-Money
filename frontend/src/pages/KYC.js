import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { API } from "../config";

export default function KYC() {
  const navigate = useNavigate();

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
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  useEffect(() => {
    loadKyc();
  }, []);

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
      toast.info("KYC is already submitted or approved.");
      return;
    }

    if (!panNumber || panNumber.length !== 10) {
      toast.info("Enter valid 10 digit PAN number");
      return;
    }

    if (!aadhaarNumber || aadhaarNumber.length !== 12) {
      toast.info("Enter valid 12 digit Aadhaar number");
      return;
    }

    if (!aadhaarFile || !panFile || !photoFile) {
      toast.info("Please upload Aadhaar, PAN & Photo");
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
      toast.success(data.msg || "KYC submitted successfully!");

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

  const getStatusText = () => {
    const status = String(kycStatus || "").toLowerCase();
    if (status === "approved") return "Approved";
    if (status === "reviewing") return "Reviewing";
    if (status === "pending") return "Pending";
    if (status === "rejected") return "Rejected";
    return "Not Submitted";
  };

  return (
    <div style={styles.page}>
      
      {/* SIDEBAR OVERLAY & DRAWER */}
      {isDrawerOpen && (
        <div style={styles.drawerOverlay} onClick={() => setIsDrawerOpen(false)}>
          <div style={styles.drawerContent} onClick={(e) => e.stopPropagation()}>
            <div style={styles.drawerHeader}>
              <span style={styles.drawerTitle}>Menu</span>
              <button style={styles.closeBtn} onClick={() => setIsDrawerOpen(false)}>✕</button>
            </div>
            <ul style={styles.drawerNavList}>
              <li style={styles.drawerNavItem} onClick={() => { setIsDrawerOpen(false); navigate('/'); }}>🏠 Home</li>
              <li style={styles.drawerNavItem} onClick={() => { setIsDrawerOpen(false); navigate('/profile'); }}>👤 Profile</li>
              <li style={styles.drawerNavItem} onClick={() => { setIsDrawerOpen(false); navigate('/kyc'); }}>🛡️ KYC Status</li>
            </ul>
          </div>
        </div>
      )}

      <div style={styles.container}>
        
        {/* 1. TOP BRAND HEADER */}
        <div style={styles.brandHeader}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            {/* SIDEBAR HAMBURGER BUTTON */}
            <button style={styles.menuBtn} onClick={() => setIsDrawerOpen(true)}>
              ☰
            </button>
            <div style={styles.brandLogoBox}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#00e676" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="22 7 13.5 15.5 8.5 10.5 2 17"></polyline>
                <polyline points="16 7 22 7 22 13"></polyline>
              </svg>
            </div>
            <div>
              <div style={styles.brandRow}>
                <span style={styles.brandName}>SAVE <span style={{ color: "#00e676" }}>MONEY</span></span>
              </div>
              <div style={styles.brandSub}>Invest Today • Secure Tomorrow</div>
            </div>
          </div>

          <div style={styles.kycVerifiedBadge}>
            <div style={styles.badgeShieldIcon}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="3">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
              </svg>
            </div>
            <div style={{ display: "flex", flexDirection: "column", textAlign: "left" }}>
              <span style={{ fontSize: "11px", fontWeight: "700", color: "#fff", display: "flex", alignItems: "center", gap: "3px" }}>
                KYC Verified <span style={{ color: "#00e676" }}>✓</span>
              </span>
              <span style={{ fontSize: "8px", color: "#94a3b8" }}>Your account is secure</span>
            </div>
            <span style={{ fontSize: "16px", marginLeft: "4px" }}>🌱💰</span>
          </div>
        </div>

        {/* 2. HERO BANNER */}
        <div style={styles.heroCard}>
          <div style={{ flex: 1 }}>
            <div style={styles.heroSubHeader}>Your Investment Profile</div>
            <h1 style={styles.heroTitle}>Welcome, {user.name || "Rama Basu Biswas"}</h1>
            <p style={styles.heroSubtitle}>
              Grow your wealth with trusted and secure investments.
            </p>
            <div style={styles.heroKycPill}>
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#00e676" strokeWidth="3">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
              </svg>
              <span>KYC Verified</span>
            </div>
          </div>
          <div style={styles.heroGraphic}>
            <svg width="120" height="70" viewBox="0 0 120 70" fill="none">
              <path d="M5 60 Q 35 50, 65 30 T 115 10" stroke="#00e676" strokeWidth="3" fill="none" />
              <polygon points="115,10 105,12 112,20" fill="#00e676" />
              <rect x="25" y="45" width="8" height="20" rx="2" fill="#00e676" opacity="0.4" />
              <rect x="45" y="35" width="8" height="30" rx="2" fill="#00e676" opacity="0.6" />
              <rect x="65" y="25" width="8" height="40" rx="2" fill="#00e676" opacity="0.8" />
              <rect x="85" y="15" width="8" height="50" rx="2" fill="#00e676" opacity="1.0" />
            </svg>
          </div>
        </div>

        {/* 3. PERSONAL INFORMATION CARD */}
        <div style={styles.card}>
          <div style={styles.cardHeader}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <div style={styles.blueAvatarIcon}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                  <circle cx="12" cy="7" r="4"></circle>
                </svg>
              </div>
              <div>
                <h2 style={styles.cardTitle}>Personal Information</h2>
                <p style={styles.cardSubtitle}>Your profile details</p>
              </div>
            </div>
            <button style={styles.editBtn}>✏️ Edit</button>
          </div>

          <div style={styles.infoGrid} className="responsive-grid">
            <InfoBox icon="user" label="Name" value={user.name || "Rama Basu Biswas"} />
            <InfoBox icon="mail" label="Email" value={user.email || email || "romabasu457@gmail.com"} />
            <InfoBox icon="phone" label="Mobile No." value={user.mobile || user.phone || "9007420560"} />
            <InfoBox icon="calendar" label="Date of Birth" value={user.dob || user.dateOfBirth || "N/A"} />
            <InfoBox icon="gender" label="Gender" value={user.gender || "N/A"} />
            <InfoBox icon="map" label="Address" value={user.address || "N/A"} />
            <InfoBox icon="card" label="Pan Number" value={panNumber || "EJPPB8604B"} />
            <InfoBox icon="card" label="Aadhaar Number" value={aadhaarNumber || "746180458576"} />

            {/* STATUS BOX */}
            <div style={styles.statusBoxFull}>
              <div style={styles.statusShieldIcon}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="3">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
                </svg>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: "11px", color: "#94a3b8" }}>KYC Status</div>
                <div style={{ fontSize: "15px", fontWeight: "700", color: "#00e676" }}>
                  {getStatusText()}
                </div>
              </div>
              <div style={styles.statusCheckMark}>✓</div>
              <span style={{ color: "#94a3b8", fontSize: "14px" }}>›</span>
            </div>
          </div>
        </div>

        {/* 4. UPLOAD DOCUMENTS CARD */}
        <div style={styles.card}>
          <div style={styles.cardHeader}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <div style={styles.purpleFileIcon}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                  <polyline points="14 2 14 8 20 8"></polyline>
                  <line x1="16" y1="13" x2="8" y2="13"></line>
                  <line x1="16" y1="17" x2="8" y2="17"></line>
                  <polyline points="10 9 9 9 8 9"></polyline>
                </svg>
              </div>
              <div>
                <h2 style={styles.cardTitle}>Upload Documents</h2>
                <p style={styles.cardSubtitle}>
                  Please upload clear and correct documents. All documents should be valid and unblurred.
                </p>
              </div>
            </div>
            <div style={styles.secureBadge}>
              🔒 Secure & Encrypted
            </div>
          </div>

          <div style={styles.uploadGrid} className="responsive-upload-grid">
            <DocUploadBox
              icon="card"
              title="Aadhaar Card"
              subtitle="Upload front & back side of your Aadhaar card."
              file={aadhaarFile}
              setFile={setAadhaarFile}
              inputValue={aadhaarNumber}
              onInputChange={(e) => setAadhaarNumber(e.target.value)}
              placeholder="746180458576"
            />
            <DocUploadBox
              icon="card"
              title="PAN Card"
              subtitle="Upload front & back side of your PAN card."
              file={panFile}
              setFile={setPanFile}
              inputValue={panNumber}
              onInputChange={(e) => setPanNumber(e.target.value.toUpperCase())}
              placeholder="EJPPB8604B"
            />
            <DocUploadBox
              icon="user"
              title="Your Photo"
              subtitle="Upload your recent clear photo."
              file={photoFile}
              setFile={setPhotoFile}
              isPhoto={true}
            />
          </div>

          <button
            style={{
              ...styles.submitBtn,
              opacity: ["reviewing", "approved"].includes(String(kycStatus || "").toLowerCase()) ? 0.8 : 1
            }}
            onClick={submitKyc}
            disabled={loading}
          >
            ✈️ {loading ? "Submitting..." : "Submit KYC"} ➔
          </button>

          <p style={styles.securityNote}>
            🛡️ Your information is safe and secure with us.
          </p>
        </div>

        {/* 5. HOW KYC PROCESS WORKS */}
        <div style={styles.card}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
            <h3 style={styles.processTitle}>⚡ How KYC Process Works</h3>
            <span style={{ fontSize: "10px", color: "#64748b" }}>Fast • Secure • Trusted</span>
          </div>

          <div style={styles.stepsGrid} className="responsive-steps">
            <StepCard stepNo="1" icon="upload" title="Upload Documents" text="Provide your KYC documents" />
            <StepCard stepNo="2" icon="search" title="Verify Details" text="We will verify your information" />
            <StepCard stepNo="3" icon="clock" title="Under Review" text="Your request is being processed" />
            <StepCard stepNo="4" icon="shield" title="Get Verified" text="You will be notified soon" />
          </div>
        </div>

      </div>

      <style>{`
        @media (max-width: 600px) {
          .responsive-grid { grid-template-columns: 1fr !important; }
          .responsive-upload-grid { grid-template-columns: 1fr !important; }
          .responsive-steps { grid-template-columns: 1fr 1fr !important; }
        }
      `}</style>
    </div>
  );
}

function InfoBox({ icon, label, value }) {
  return (
    <div style={styles.infoBox}>
      <div style={styles.infoIconWrapper}>
        {icon === "user" && "👤"}
        {icon === "mail" && "✉️"}
        {icon === "phone" && "📞"}
        {icon === "calendar" && "📅"}
        {icon === "gender" && "🚻"}
        {icon === "map" && "📍"}
        {icon === "card" && "🪪"}
      </div>
      <div style={{ overflow: "hidden" }}>
        <div style={styles.infoLabel}>{label}</div>
        <div style={styles.infoValue}>{value}</div>
      </div>
    </div>
  );
}

function DocUploadBox({ icon, title, subtitle, file, setFile, inputValue, onInputChange, placeholder, isPhoto }) {
  return (
    <div style={styles.uploadCard}>
      <div style={styles.uploadHeaderIcon}>
        {isPhoto ? "👤" : "🪪"}
      </div>
      <h4 style={styles.uploadTitle}>{title}</h4>
      <p style={styles.uploadSubtitle}>{subtitle}</p>
      
      <label style={styles.uploadButtonLabel}>
        <span>☁️</span>
        <span>{file ? file.name : "Upload Image"}</span>
        <input type="file" hidden accept="image/*" onChange={(e) => setFile(e.target.files[0])} />
      </label>

      {isPhoto ? (
        <label style={styles.uploadPhotoSubLabel}>
          <span>🖼️</span>
          <span>Upload Photo</span>
          <input type="file" hidden accept="image/*" onChange={(e) => setFile(e.target.files[0])} />
        </label>
      ) : (
        <input
          type="text"
          value={inputValue}
          onChange={onInputChange}
          placeholder={placeholder}
          style={styles.textInputStyle}
        />
      )}
    </div>
  );
}

function StepCard({ stepNo, icon, title, text }) {
  return (
    <div style={styles.stepCard}>
      <div style={styles.stepBadge}>{stepNo}</div>
      <div style={styles.stepIconCircle}>
        {icon === "upload" && "☁️"}
        {icon === "search" && "🔍"}
        {icon === "clock" && "🕒"}
        {icon === "shield" && "🛡️"}
      </div>
      <h5 style={styles.stepTitle}>{title}</h5>
      <p style={styles.stepText}>{text}</p>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    background: "#030712",
    color: "#ffffff",
    padding: "16px",
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
  },
  container: {
    maxWidth: "480px",
    margin: "0 auto"
  },

  /* DRAWER SIDEBAR STYLES */
  drawerOverlay: {
    position: "fixed",
    top: 0,
    left: 0,
    width: "100vw",
    height: "100vh",
    backgroundColor: "rgba(0,0,0,0.6)",
    zIndex: 9999,
    display: "flex"
  },
  drawerContent: {
    width: "250px",
    height: "100%",
    backgroundColor: "#0b1329",
    borderRight: "1px solid #1e293b",
    padding: "20px",
    display: "flex",
    flexDirection: "column",
    boxShadow: "4px 0 15px rgba(0,0,0,0.5)"
  },
  drawerHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "20px"
  },
  drawerTitle: { fontSize: "18px", fontWeight: "bold", color: "#ffffff" },
  closeBtn: { background: "none", border: "none", color: "#ffffff", fontSize: "18px", cursor: "pointer" },
  drawerNavList: { listStyle: "none", padding: 0, margin: 0 },
  drawerNavItem: { padding: "12px 0", borderBottom: "1px solid #1e293b", color: "#cbd5e1", cursor: "pointer" },

  /* BRAND HEADER */
  brandHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: "16px"
  },
  menuBtn: {
    width: "36px",
    height: "36px",
    borderRadius: "8px",
    border: "1px solid rgba(255,255,255,0.1)",
    background: "#0f172a",
    color: "#ffffff",
    fontSize: "18px",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center"
  },
  brandLogoBox: {
    width: "36px",
    height: "36px",
    borderRadius: "8px",
    background: "rgba(0,230,118,0.1)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center"
  },
  brandRow: { display: "flex", alignItems: "center" },
  brandName: { fontSize: "15px", fontWeight: "900", letterSpacing: "0.5px" },
  brandSub: { fontSize: "9px", color: "#64748b" },

  kycVerifiedBadge: {
    background: "rgba(15, 23, 42, 0.8)",
    border: "1px solid #1e293b",
    borderRadius: "20px",
    padding: "4px 10px",
    display: "flex",
    alignItems: "center",
    gap: "6px"
  },
  badgeShieldIcon: {
    width: "20px",
    height: "20px",
    borderRadius: "50%",
    background: "#00e676",
    display: "flex",
    alignItems: "center",
    justifyContent: "center"
  },

  /* HERO BANNER */
  heroCard: {
    background: "linear-gradient(135deg, #021e17 0%, #063d2e 60%, #031c15 100%)",
    border: "1px solid #065f46",
    borderRadius: "16px",
    padding: "16px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: "16px",
    position: "relative",
    overflow: "hidden"
  },
  heroSubHeader: { fontSize: "11px", color: "#34d399", fontWeight: "600", marginBottom: "4px" },
  heroTitle: { margin: 0, fontSize: "16px", fontWeight: "800", color: "#ffffff" },
  heroSubtitle: { margin: "4px 0 10px 0", fontSize: "10px", color: "#94a3b8" },
  heroKycPill: {
    display: "inline-flex",
    alignItems: "center",
    gap: "4px",
    background: "rgba(0, 230, 118, 0.15)",
    border: "1px solid rgba(0, 230, 118, 0.3)",
    padding: "3px 8px",
    borderRadius: "12px",
    fontSize: "9px",
    color: "#00e676",
    fontWeight: "700"
  },
  heroGraphic: { opacity: 0.8 },

  /* CARD GENERAL */
  card: {
    background: "#0b1329",
    border: "1px solid #1e293b",
    borderRadius: "16px",
    padding: "14px",
    marginBottom: "16px"
  },
  cardHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: "14px"
  },
  blueAvatarIcon: {
    width: "32px",
    height: "32px",
    borderRadius: "50%",
    background: "#2563eb",
    display: "flex",
    alignItems: "center",
    justifyContent: "center"
  },
  purpleFileIcon: {
    width: "32px",
    height: "32px",
    borderRadius: "10px",
    background: "#7c3aed",
    display: "flex",
    alignItems: "center",
    justifyContent: "center"
  },
  cardTitle: { margin: 0, fontSize: "14px", fontWeight: "700" },
  cardSubtitle: { margin: "2px 0 0 0", fontSize: "10px", color: "#64748b" },
  editBtn: {
    background: "#1e293b",
    border: "none",
    borderRadius: "12px",
    color: "#cbd5e1",
    fontSize: "11px",
    padding: "4px 10px",
    cursor: "pointer"
  },
  secureBadge: {
    background: "#0f2942",
    color: "#38bdf8",
    fontSize: "9px",
    fontWeight: "600",
    padding: "4px 8px",
    borderRadius: "12px",
    border: "1px solid #1e40af"
  },

  /* INFO GRID */
  infoGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "8px"
  },
  infoBox: {
    background: "#0f172a",
    border: "1px solid #1e293b",
    borderRadius: "10px",
    padding: "8px 10px",
    display: "flex",
    alignItems: "center",
    gap: "10px"
  },
  infoIconWrapper: {
    width: "28px",
    height: "28px",
    borderRadius: "8px",
    background: "#1e293b",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "12px",
    flexShrink: 0
  },
  infoLabel: { fontSize: "9px", color: "#64748b" },
  infoValue: { fontSize: "11px", fontWeight: "700", color: "#ffffff", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" },

  /* STATUS BOX */
  statusBoxFull: {
    gridColumn: "1 / -1",
    background: "rgba(0, 230, 118, 0.05)",
    border: "1px solid rgba(0, 230, 118, 0.2)",
    borderRadius: "10px",
    padding: "8px 12px",
    display: "flex",
    alignItems: "center",
    gap: "10px",
    marginTop: "4px"
  },
  statusShieldIcon: {
    width: "28px",
    height: "28px",
    borderRadius: "50%",
    background: "#00e676",
    display: "flex",
    alignItems: "center",
    justifyContent: "center"
  },
  statusCheckMark: {
    width: "18px",
    height: "18px",
    borderRadius: "50%",
    background: "#00e676",
    color: "#000",
    fontWeight: "bold",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "10px"
  },

  /* UPLOAD SECTION */
  uploadGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: "8px",
    marginBottom: "14px"
  },
  uploadCard: {
    background: "#0f172a",
    border: "1px solid #1e293b",
    borderRadius: "12px",
    padding: "10px 8px",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    textAlign: "center"
  },
  uploadHeaderIcon: {
    width: "28px",
    height: "28px",
    borderRadius: "8px",
    background: "#2563eb",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "12px",
    marginBottom: "6px"
  },
  uploadTitle: { margin: 0, fontSize: "11px", fontWeight: "700" },
  uploadSubtitle: { margin: "4px 0 8px 0", fontSize: "8px", color: "#64748b", minHeight: "22px" },
  
  uploadButtonLabel: {
    width: "100%",
    background: "#1e293b",
    border: "1px solid #334155",
    borderRadius: "6px",
    padding: "5px 0",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "4px",
    cursor: "pointer",
    color: "#93c5fd",
    fontSize: "9px",
    fontWeight: "600",
    marginBottom: "6px"
  },
  uploadPhotoSubLabel: {
    width: "100%",
    background: "#1e293b",
    border: "1px solid #334155",
    borderRadius: "6px",
    padding: "5px 0",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "4px",
    cursor: "pointer",
    color: "#cbd5e1",
    fontSize: "9px"
  },
  textInputStyle: {
    width: "100%",
    background: "#030712",
    border: "1px solid #1e293b",
    borderRadius: "6px",
    padding: "4px 6px",
    color: "#ffffff",
    fontSize: "9px",
    textAlign: "center",
    outline: "none"
  },

  submitBtn: {
    width: "100%",
    height: "38px",
    borderRadius: "20px",
    border: "none",
    background: "linear-gradient(90deg, #00c853 0%, #0288d1 100%)",
    color: "#ffffff",
    fontSize: "13px",
    fontWeight: "700",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "6px"
  },
  securityNote: { textAlign: "center", fontSize: "9px", color: "#00e676", margin: "8px 0 0 0" },

  /* PROCESS STEPS */
  processTitle: { margin: 0, fontSize: "12px", fontWeight: "700" },
  stepsGrid: { display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "6px" },
  stepCard: {
    background: "#0f172a",
    border: "1px solid #1e293b",
    borderRadius: "10px",
    padding: "8px 4px",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    textAlign: "center",
    position: "relative"
  },
  stepBadge: {
    position: "absolute",
    top: "4px",
    left: "4px",
    background: "#1e293b",
    color: "#94a3b8",
    fontSize: "7px",
    width: "12px",
    height: "12px",
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center"
  },
  stepIconCircle: {
    width: "22px",
    height: "22px",
    borderRadius: "50%",
    background: "#1e293b",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "10px",
    margin: "2px 0 4px 0"
  },
  stepTitle: { margin: "2px 0", fontSize: "8px", fontWeight: "700" },
  stepText: { margin: 0, fontSize: "7px", color: "#64748b" }
};
