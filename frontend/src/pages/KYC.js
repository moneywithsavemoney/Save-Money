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

  const isVerified = String(kycStatus).toLowerCase() === "approved";

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        
        {/* 1. TOP BRAND HEADER */}
        <div style={styles.brandHeader}>
          <div style={styles.brandLeft}>
            <div style={styles.brandLogoIcon}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path d="M3 17L9 11L13 15L21 7" stroke="#00e676" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M17 7H21V11" stroke="#00e676" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <div>
              <div style={styles.brandTitle}>SAVE <span style={{ color: "#00e676" }}>MONEY</span></div>
              <div style={styles.brandSubtitle}>Invest Today • Secure Tomorrow</div>
            </div>
          </div>

          <div style={styles.brandRightBadge}>
            <span style={styles.shieldGreenIcon}>🛡️</span>
            <div style={styles.badgeTextWrapper}>
              <span style={styles.badgeTitle}>KYC Verified ⌄</span>
              <span style={styles.badgeSub}>Your account is secure</span>
            </div>
            <span style={{ fontSize: "16px", marginLeft: "4px" }}>🌱💰</span>
          </div>
        </div>

        {/* 2. HERO BANNER CARD */}
        <div style={styles.heroCard}>
          <div style={styles.heroContent}>
            <div style={styles.heroHeaderTag}>Your Investment Profile</div>
            <h2 style={styles.heroTitle}>Welcome, {user.name || "Rama Basu Biswas"}</h2>
            <p style={styles.heroSubtitle}>Grow your wealth with trusted and secure investments.</p>
            <div style={styles.heroVerifiedTag}>
              🛡️ KYC Verified
            </div>
          </div>
          <div style={styles.heroGraphic}>
            <svg width="120" height="70" viewBox="0 0 120 70" fill="none">
              <path d="M10 55 L40 40 L70 48 L110 10" stroke="#00e676" strokeWidth="4" strokeLinecap="round"/>
              <polygon points="100,10 110,10 110,20" fill="#00e676" />
              <rect x="15" y="45" width="10" height="20" fill="#00e676" opacity="0.6" rx="2"/>
              <rect x="40" y="30" width="10" height="35" fill="#00e676" opacity="0.7" rx="2"/>
              <rect x="65" y="38" width="10" height="27" fill="#00e676" opacity="0.8" rx="2"/>
              <rect x="90" y="15" width="10" height="50" fill="#00e676" rx="2"/>
            </svg>
          </div>
        </div>

        {/* 3. PERSONAL INFORMATION CARD */}
        <div style={styles.card}>
          <div style={styles.cardHeader}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <div style={{ ...styles.sectionIconCircle, background: "#3b82f6" }}>👤</div>
              <div>
                <h3 style={styles.cardTitle}>Personal Information</h3>
                <p style={styles.cardSubtitle}>Your profile details</p>
              </div>
            </div>
            <button style={styles.editBtn}>✏️ Edit</button>
          </div>

          <div style={styles.infoGrid}>
            <InfoBox label="Name" value={user.name || "Rama Basu Biswas"} icon="👤" />
            <InfoBox label="Email" value={user.email || email || "romabasu457@gmail.com"} icon="✉️" />
            <InfoBox label="Mobile No." value={user.mobile || user.phone || "9007420560"} icon="📞" />
            <InfoBox label="Date of Birth" value={user.dob || "N/A"} icon="📅" />
            <InfoBox label="Gender" value={user.gender || "N/A"} icon="🚻" />
            <InfoBox label="Address" value={user.address || "N/A"} icon="📍" />
            <InfoBox label="Pan Number" value={panNumber || "EJPPB8604B"} icon="🪪" />
            <InfoBox label="Aadhaar Number" value={aadhaarNumber || "746180458576"} icon="🆔" />

            {/* KYC STATUS BOX */}
            <div style={styles.statusBoxApproved}>
              <div style={styles.statusIconCircle}>🛡️</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: "11px", color: "#64748b" }}>KYC Status</div>
                <div style={{ fontSize: "14px", fontWeight: "700", color: "#22c55e" }}>
                  {kycStatus === "approved" || !kycStatus ? "Approved" : kycStatus}
                </div>
              </div>
              <div style={styles.statusCheckCircle}>✓</div>
              <span style={{ color: "#64748b", fontSize: "14px", marginLeft: "4px" }}>›</span>
            </div>
          </div>
        </div>

        {/* 4. UPLOAD DOCUMENTS CARD */}
        <div style={styles.card}>
          <div style={styles.cardHeader}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <div style={{ ...styles.sectionIconCircle, background: "#8b5cf6" }}>📄</div>
              <div>
                <h3 style={styles.cardTitle}>Upload Documents</h3>
                <p style={styles.cardSubtitle}>Please upload clear and correct documents. All documents should be valid and unblurred.</p>
              </div>
            </div>
            <div style={styles.secureBadge}>🔒 Secure & Encrypted</div>
          </div>

          <div style={styles.uploadGrid}>
            <DocCard
              title="Aadhaar Card"
              subtitle="Upload front & back side of your Aadhaar card."
              file={aadhaarFile}
              setFile={setAadhaarFile}
              inputValue={aadhaarNumber}
              setInputValue={setAadhaarNumber}
              placeholder="746180458576"
            />
            <DocCard
              title="PAN Card"
              subtitle="Upload front & back side of your PAN card."
              file={panFile}
              setFile={setPanFile}
              inputValue={panNumber}
              setInputValue={setPanNumber}
              placeholder="EJPPB8604B"
            />
            <DocCard
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
              opacity: ["reviewing", "approved"].includes(String(kycStatus || "").toLowerCase()) ? 0.7 : 1
            }}
            onClick={submitKyc}
            disabled={loading}
          >
            ✈️ {loading ? "Submitting..." : "Submit KYC"} →
          </button>

          <div style={styles.securityText}>
            🛡️ Your information is safe and secure with us.
          </div>
        </div>

        {/* 5. HOW KYC PROCESS WORKS CARD */}
        <div style={styles.card}>
          <div style={styles.processHeader}>
            <div style={styles.processTitle}>⚡ How KYC Process Works</div>
            <div style={styles.processSub}>Fast • Secure • Trusted</div>
          </div>

          <div style={styles.stepsContainer}>
            <StepItem step="1" icon="☁️" title="Upload Documents" desc="Provide your KYC documents" />
            <div style={styles.stepArrow}>→</div>
            <StepItem step="2" icon="🔍" title="Verify Details" desc="We will verify your information" />
            <div style={styles.stepArrow}>→</div>
            <StepItem step="3" icon="🕒" title="Under Review" desc="Your request is being processed" />
            <div style={styles.stepArrow}>→</div>
            <StepItem step="4" icon="🛡️" title="Get Verified" desc="You will be notified soon" />
          </div>
        </div>

      </div>

      {/* 6. BOTTOM NAVIGATION BAR */}
      <div style={styles.bottomNav}>
        <NavItem icon="🏠" label="Home" active={true} />
        <NavItem icon="📊" label="Investments" active={false} />
        <NavItem icon="📄" label="Documents" active={false} />
        <NavItem icon="👤" label="Profile" active={false} />
      </div>
    </div>
  );
}

function InfoBox({ label, value, icon }) {
  return (
    <div style={styles.infoBox}>
      <div style={styles.infoIcon}>{icon}</div>
      <div style={{ overflow: "hidden" }}>
        <div style={styles.infoLabel}>{label}</div>
        <div style={styles.infoValue}>{value}</div>
      </div>
    </div>
  );
}

function DocCard({ title, subtitle, file, setFile, inputValue, setInputValue, placeholder, isPhoto }) {
  return (
    <div style={styles.docCard}>
      <div style={styles.docIconCircle}>🪪</div>
      <h4 style={styles.docTitle}>{title}</h4>
      <p style={styles.docSubtitle}>{subtitle}</p>

      <label style={styles.uploadBtn}>
        ☁️ Upload Image
        <input type="file" hidden accept="image/*" onChange={(e) => setFile(e.target.files[0])} />
      </label>

      {!isPhoto ? (
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder={placeholder}
          style={styles.docInput}
        />
      ) : (
        <label style={styles.uploadPhotoBtn}>
          📷 Upload Photo
          <input type="file" hidden accept="image/*" onChange={(e) => setFile(e.target.files[0])} />
        </label>
      )}
    </div>
  );
}

function StepItem({ step, icon, title, desc }) {
  return (
    <div style={styles.stepBox}>
      <div style={styles.stepBadge}>{step}</div>
      <div style={styles.stepIcon}>{icon}</div>
      <div style={styles.stepTitle}>{title}</div>
      <div style={styles.stepDesc}>{desc}</div>
    </div>
  );
}

function NavItem({ icon, label, active }) {
  return (
    <div style={{ ...styles.navItem, color: active ? "#00e676" : "#64748b" }}>
      <div style={styles.navIcon}>{icon}</div>
      <div style={styles.navLabel}>{label}</div>
      {active && <div style={styles.activeIndicator} />}
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    backgroundColor: "#030712",
    color: "#ffffff",
    padding: "12px 12px 80px 12px",
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
  },
  container: {
    maxWidth: "480px",
    margin: "0 auto"
  },
  
  // Header
  brandHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: "16px"
  },
  brandLeft: {
    display: "flex",
    alignItems: "center",
    gap: "10px"
  },
  brandLogoIcon: {
    width: "36px",
    height: "36px",
    borderRadius: "8px",
    background: "rgba(0, 230, 118, 0.1)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center"
  },
  brandTitle: {
    fontSize: "18px",
    fontWeight: "900",
    letterSpacing: "0.5px"
  },
  brandSubtitle: {
    fontSize: "10px",
    color: "#94a3b8"
  },
  brandRightBadge: {
    display: "flex",
    alignItems: "center",
    background: "rgba(15, 23, 42, 0.8)",
    border: "1px solid #1e293b",
    borderRadius: "20px",
    padding: "4px 10px",
    gap: "6px"
  },
  shieldGreenIcon: {
    fontSize: "14px"
  },
  badgeTextWrapper: {
    display: "flex",
    flexDirection: "column"
  },
  badgeTitle: {
    fontSize: "11px",
    fontWeight: "700",
    color: "#ffffff"
  },
  badgeSub: {
    fontSize: "8px",
    color: "#64748b"
  },

  // Hero Card
  heroCard: {
    background: "linear-gradient(135deg, #022c22 0%, #064e3b 50%, #022c22 100%)",
    border: "1px solid #059669",
    borderRadius: "16px",
    padding: "16px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "16px"
  },
  heroContent: {
    flex: 1
  },
  heroHeaderTag: {
    fontSize: "11px",
    color: "#6ee7b7",
    marginBottom: "4px"
  },
  heroTitle: {
    margin: "0 0 6px 0",
    fontSize: "17px",
    fontWeight: "800",
    color: "#ffffff"
  },
  heroSubtitle: {
    margin: "0 0 10px 0",
    fontSize: "11px",
    color: "#a7f3d0",
    lineHeight: "1.3"
  },
  heroVerifiedTag: {
    display: "inline-flex",
    alignItems: "center",
    gap: "4px",
    background: "#059669",
    color: "#ffffff",
    fontSize: "10px",
    fontWeight: "700",
    padding: "3px 8px",
    borderRadius: "12px"
  },
  heroGraphic: {
    marginLeft: "10px"
  },

  // Card Core
  card: {
    background: "#0b1329",
    border: "1px solid #1e293b",
    borderRadius: "16px",
    padding: "16px",
    marginBottom: "16px"
  },
  cardHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: "14px"
  },
  sectionIconCircle: {
    width: "32px",
    height: "32px",
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "14px"
  },
  cardTitle: {
    margin: 0,
    fontSize: "15px",
    fontWeight: "700"
  },
  cardSubtitle: {
    margin: "2px 0 0 0",
    fontSize: "10px",
    color: "#64748b"
  },
  editBtn: {
    background: "#1e293b",
    border: "1px solid #334155",
    color: "#38bdf8",
    fontSize: "11px",
    fontWeight: "600",
    padding: "4px 12px",
    borderRadius: "14px",
    cursor: "pointer"
  },

  // Info Grid
  infoGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "10px"
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
  infoIcon: {
    width: "28px",
    height: "28px",
    borderRadius: "6px",
    background: "#1e293b",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "12px"
  },
  infoLabel: {
    fontSize: "10px",
    color: "#64748b"
  },
  infoValue: {
    fontSize: "12px",
    fontWeight: "700",
    color: "#ffffff"
  },

  // Status Box Approved
  statusBoxApproved: {
    gridColumn: "1 / -1",
    background: "rgba(34, 197, 94, 0.05)",
    border: "1px solid #16a34a",
    borderRadius: "12px",
    padding: "10px 14px",
    display: "flex",
    alignItems: "center",
    gap: "12px",
    marginTop: "4px"
  },
  statusIconCircle: {
    width: "30px",
    height: "30px",
    borderRadius: "50%",
    background: "#16a34a",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "14px"
  },
  statusCheckCircle: {
    width: "22px",
    height: "22px",
    borderRadius: "50%",
    background: "#22c55e",
    color: "#000000",
    fontWeight: "bold",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "12px"
  },

  // Document Uploads
  secureBadge: {
    background: "rgba(56, 189, 248, 0.1)",
    border: "1px solid rgba(56, 189, 248, 0.3)",
    color: "#38bdf8",
    fontSize: "10px",
    fontWeight: "600",
    padding: "4px 8px",
    borderRadius: "12px"
  },
  uploadGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: "8px",
    marginBottom: "14px"
  },
  docCard: {
    background: "#0f172a",
    border: "1px dashed #1e293b",
    borderRadius: "12px",
    padding: "10px 6px",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    textAlign: "center"
  },
  docIconCircle: {
    width: "28px",
    height: "28px",
    borderRadius: "6px",
    background: "#2563eb",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "14px",
    marginBottom: "6px"
  },
  docTitle: {
    margin: 0,
    fontSize: "11px",
    fontWeight: "700"
  },
  docSubtitle: {
    margin: "4px 0 8px 0",
    fontSize: "8px",
    color: "#64748b",
    lineHeight: "1.2",
    minHeight: "22px"
  },
  uploadBtn: {
    width: "100%",
    background: "#1e293b",
    border: "1px solid #334155",
    color: "#38bdf8",
    fontSize: "9px",
    fontWeight: "600",
    padding: "6px 0",
    borderRadius: "6px",
    cursor: "pointer",
    marginBottom: "6px"
  },
  uploadPhotoBtn: {
    width: "100%",
    background: "#1e293b",
    border: "1px solid #334155",
    color: "#94a3b8",
    fontSize: "9px",
    fontWeight: "600",
    padding: "6px 0",
    borderRadius: "6px",
    cursor: "pointer"
  },
  docInput: {
    width: "100%",
    background: "#030712",
    border: "1px solid #1e293b",
    borderRadius: "6px",
    padding: "4px 6px",
    color: "#ffffff",
    fontSize: "9px",
    textAlign: "center",
    boxSizing: "border-box"
  },

  // Submit Button
  submitBtn: {
    width: "100%",
    height: "44px",
    borderRadius: "22px",
    border: "none",
    background: "linear-gradient(90deg, #00e676 0%, #2563eb 100%)",
    color: "#ffffff",
    fontSize: "15px",
    fontWeight: "800",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px"
  },
  securityText: {
    textAlign: "center",
    fontSize: "10px",
    color: "#22c55e",
    marginTop: "10px"
  },

  // Process Steps
  processHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "12px"
  },
  processTitle: {
    fontSize: "13px",
    fontWeight: "700"
  },
  processSub: {
    fontSize: "9px",
    color: "#64748b"
  },
  stepsContainer: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between"
  },
  stepBox: {
    background: "#0f172a",
    border: "1px solid #1e293b",
    borderRadius: "10px",
    padding: "8px 4px",
    width: "22%",
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
    fontSize: "8px",
    width: "12px",
    height: "12px",
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center"
  },
  stepIcon: {
    fontSize: "14px",
    margin: "4px 0"
  },
  stepTitle: {
    fontSize: "8px",
    fontWeight: "700",
    marginBottom: "2px"
  },
  stepDesc: {
    fontSize: "7px",
    color: "#64748b",
    lineHeight: "1.1"
  },
  stepArrow: {
    color: "#334155",
    fontSize: "12px"
  },

  // Bottom Navigation Bar
  bottomNav: {
    position: "fixed",
    bottom: 0,
    left: 0,
    right: 0,
    height: "56px",
    background: "#090d16",
    borderTop: "1px solid #1e293b",
    display: "flex",
    justifyContent: "space-around",
    alignItems: "center",
    zIndex: 1000
  },
  navItem: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    cursor: "pointer",
    position: "relative"
  },
  navIcon: {
    fontSize: "16px"
  },
  navLabel: {
    fontSize: "9px",
    marginTop: "2px"
  },
  activeIndicator: {
    position: "absolute",
    bottom: "-6px",
    width: "20px",
    height: "2px",
    background: "#00e676",
    borderRadius: "2px"
  }
};
