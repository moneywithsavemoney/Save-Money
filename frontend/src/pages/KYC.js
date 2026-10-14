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
    if (status === "approved") return "(Approved)";
    if (status === "reviewing") return "(Reviewing)";
    if (status === "pending") return "(Pending)";
    if (status === "rejected") return "(Rejected)";
    return "(Not Submitted)";
  };

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        
        {/* 1. TOP BRAND HEADER */}
        <div style={styles.brandHeader}>
          <button style={styles.menuBtn} onClick={() => setIsDrawerOpen(!isDrawerOpen)}>
            ☰
          </button>
          
          <div style={styles.brandCenter}>
            <div style={styles.brandRow}>
              <span style={styles.greenChartIcon}>📈</span>
              <span style={styles.brandName}>SAVE MONEY</span>
            </div>
            <span style={styles.brandSub}>inspired groww</span>
          </div>

          <div style={styles.brandRightGraphic}>
            🌱💰
          </div>
        </div>

        {/* 2. HERO BANNER */}
        <div style={styles.heroCard}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div style={styles.heroShieldIcon}>🛡️</div>
            <div>
              <h1 style={styles.heroTitle}>KYC Verification</h1>
              <p style={styles.heroSubtitle}>
                Secure Your Account • Verify Your Identity<br />
                • Unlock Full Features
              </p>
            </div>
          </div>
          <div style={styles.heroTagline}>
            Your Security<br />Our Priority
          </div>
        </div>

        {/* 3. PERSONAL INFORMATION CARD */}
        <div style={styles.card}>
          <div style={styles.cardHeader}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <div style={styles.avatarIcon}>👤</div>
              <div>
                <h2 style={styles.cardTitle}>Personal Information</h2>
                <p style={styles.cardSubtitle}>Please provide your correct details</p>
              </div>
            </div>
            <span style={styles.accordionArrow}>▲</span>
          </div>

          <div style={styles.infoGrid} className="responsive-grid">
            <InfoBox icon="👤" label="Name" value={user.name || "N/A"} iconBg="#3b82f6" />
            <InfoBox icon="✉️" label="Email" value={user.email || email || "N/A"} iconBg="#6366f1" />
            <InfoBox icon="📞" label="Mobile No." value={user.mobile || user.phone || "N/A"} iconBg="#22c55e" />
            <InfoBox icon="📅" label="Date of Birth" value={user.dob || user.dateOfBirth || "N/A"} iconBg="#f97316" />
            <InfoBox icon="🚻" label="Gender" value={user.gender || "N/A"} iconBg="#ec4899" />
            <InfoBox icon="📍" label="Address" value={user.address || "N/A"} iconBg="#0284c7" />
            <InfoBox icon="🪪" label="Pan Number" value={panNumber || "N/A"} iconBg="#0ea5e9" />
            <InfoBox icon="🆔" label="Aadhaar Number" value={aadhaarNumber || "N/A"} iconBg="#a855f7" />

            {/* STATUS BOX */}
            <div style={styles.statusBoxFull}>
              <div style={styles.statusShieldIcon}>🛡️</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: "11px", color: "#94a3b8" }}>KYC Status</div>
                <div style={{ fontSize: "13px", fontWeight: "700", color: "#22c55e" }}>
                  {getStatusText()}
                </div>
              </div>
              <div style={styles.statusCheckMark}>✓</div>
            </div>
          </div>
        </div>

        {/* 4. UPLOAD DOCUMENTS CARD */}
        <div style={styles.card}>
          <div style={styles.cardHeader}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <div style={{ ...styles.avatarIcon, background: "#7c3aed" }}>📄</div>
              <div>
                <h2 style={styles.cardTitle}>Upload Documents</h2>
                <p style={styles.cardSubtitle}>
                  Please upload clear and correct documents. All documents should be valid and unblurred.
                </p>
              </div>
            </div>
            <span style={styles.accordionArrow}>▲</span>
          </div>

          <div style={styles.uploadGrid} className="responsive-upload-grid">
            <DocUploadBox
              icon="🪪"
              title="Aadhaar Card"
              subtitle="Upload front & back side of your Aadhaar card."
              btnText="Upload Image (Front & Back Side)"
              file={aadhaarFile}
              setFile={setAadhaarFile}
              iconBg="#2563eb"
              inputValue={aadhaarNumber}
              onInputChange={(e) => setAadhaarNumber(e.target.value)}
              inputPlaceholder="Enter 12 digit Aadhaar Number"
              maxLength={12}
            />
            <DocUploadBox
              icon="🪪"
              title="PAN Card"
              subtitle="Upload front & back side of your PAN card."
              btnText="Upload Image (Front & Back Side)"
              file={panFile}
              setFile={setPanFile}
              iconBg="#7c3aed"
              inputValue={panNumber}
              onInputChange={(e) => setPanNumber(e.target.value.toUpperCase())}
              inputPlaceholder="Enter 10 digit PAN Number"
              maxLength={10}
            />
            <DocUploadBox
              icon="👤"
              title="Your Photo"
              subtitle="Upload your recent clear photo."
              btnText="Upload Image (Clear & Recent)"
              file={photoFile}
              setFile={setPhotoFile}
              iconBg="#059669"
            />
          </div>

          <button
            style={{
              ...styles.submitBtn,
              opacity: ["reviewing", "approved"].includes(String(kycStatus || "").toLowerCase()) ? 0.6 : 1
            }}
            onClick={submitKyc}
            disabled={loading || ["reviewing", "approved"].includes(String(kycStatus || "").toLowerCase())}
          >
            🚀 {loading ? "Submitting..." : "Submit KYC"} ›
          </button>

          <p style={styles.securityNote}>
            🛡️ Your information is safe and secure with us.
          </p>
        </div>

        {/* 5. HOW KYC PROCESS WORKS */}
        <div style={styles.card}>
          <h3 style={styles.processTitle}>✨ How KYC Process Works</h3>
          <div style={styles.stepsGrid} className="responsive-steps">
            <StepCard stepNo="1" icon="☁️" title="Upload Documents" text="Provide your KYC documents" iconBg="#2563eb" />
            <StepCard stepNo="2" icon="👥" title="Verify Details" text="We will verify your information" iconBg="#7c3aed" />
            <StepCard stepNo="3" icon="👤" title="Under Review" text="Your request is being processed" iconBg="#0284c7" />
            <StepCard stepNo="4" icon="🛡️" title="Get Verified" text="You will be notified soon" iconBg="#059669" />
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

function InfoBox({ icon, label, value, iconBg }) {
  return (
    <div style={styles.infoBox}>
      <div style={{ ...styles.infoIconWrapper, background: iconBg }}>{icon}</div>
      <div style={{ overflow: "hidden" }}>
        <div style={styles.infoLabel}>{label}</div>
        <div style={styles.infoValue}>{value}</div>
      </div>
    </div>
  );
}

function DocUploadBox({ icon, title, subtitle, btnText, file, setFile, iconBg, inputValue, onInputChange, inputPlaceholder, maxLength }) {
  return (
    <div style={styles.uploadCard}>
      <div style={{ ...styles.uploadHeaderIcon, background: iconBg }}>{icon}</div>
      <h4 style={styles.uploadTitle}>{title}</h4>
      <p style={styles.uploadSubtitle}>{subtitle}</p>
      
      {onInputChange && (
        <input
          type="text"
          value={inputValue}
          onChange={onInputChange}
          placeholder={inputPlaceholder}
          maxLength={maxLength}
          style={styles.textInputStyle}
        />
      )}

      <label style={styles.uploadButtonLabel}>
        <span style={{ fontSize: "14px" }}>☁️</span>
        <span style={{ fontSize: "10px", fontWeight: "600" }}>
          {file ? file.name : btnText}
        </span>
        <input type="file" hidden accept="image/*" onChange={(e) => setFile(e.target.files[0])} />
      </label>
    </div>
  );
}

function StepCard({ stepNo, icon, title, text, iconBg }) {
  return (
    <div style={styles.stepCard}>
      <div style={styles.stepBadge}>{stepNo}</div>
      <div style={{ ...styles.stepIconCircle, background: iconBg }}>{icon}</div>
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
    padding: "12px",
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif"
  },
  container: {
    maxWidth: "460px",
    margin: "0 auto"
  },
  brandHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: "12px"
  },
  menuBtn: {
    width: "38px",
    height: "38px",
    borderRadius: "8px",
    border: "1px solid rgba(255,255,255,0.1)",
    background: "rgba(255,255,255,0.05)",
    color: "#fff",
    fontSize: "18px"
  },
  brandCenter: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center"
  },
  brandRow: {
    display: "flex",
    alignItems: "center",
    gap: "6px"
  },
  greenChartIcon: { fontSize: "18px", color: "#22c55e" },
  brandName: { fontSize: "16px", fontWeight: "900", letterSpacing: "0.5px" },
  brandSub: { fontSize: "9px", color: "#94a3b8", marginTop: "-2px" },
  brandRightGraphic: { fontSize: "20px" },

  heroCard: {
    background: "linear-gradient(135deg, #022c22 0%, #064e3b 60%, #022c22 100%)",
    border: "1px solid #059669",
    borderRadius: "14px",
    padding: "12px 14px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: "12px"
  },
  heroShieldIcon: {
    width: "38px",
    height: "38px",
    borderRadius: "10px",
    background: "rgba(34, 197, 94, 0.2)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "20px"
  },
  heroTitle: { margin: 0, fontSize: "15px", fontWeight: "800", color: "#34d399" },
  heroSubtitle: { margin: "2px 0 0 0", fontSize: "10px", color: "#a7f3d0", lineHeight: "1.2" },
  heroTagline: { fontSize: "10px", color: "#a7f3d0", textAlign: "right", fontStyle: "italic", lineHeight: "1.2" },

  card: {
    background: "linear-gradient(180deg, #0f172a 0%, #090d16 100%)",
    border: "1px solid #1e293b",
    borderRadius: "16px",
    padding: "14px",
    marginBottom: "12px"
  },
  cardHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: "12px"
  },
  avatarIcon: {
    width: "30px",
    height: "30px",
    borderRadius: "50%",
    background: "#2563eb",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "13px"
  },
  cardTitle: { margin: 0, fontSize: "14px", fontWeight: "700" },
  cardSubtitle: { margin: "2px 0 0 0", fontSize: "10px", color: "#64748b" },
  accordionArrow: { color: "#64748b", fontSize: "12px" },

  infoGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "8px"
  },
  infoBox: {
    background: "#1e293b80",
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
    borderRadius: "6px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "12px",
    flexShrink: 0
  },
  infoLabel: { fontSize: "10px", color: "#64748b" },
  infoValue: { fontSize: "11px", fontWeight: "700", color: "#ffffff", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" },

  statusBoxFull: {
    gridColumn: "1 / -1",
    background: "rgba(34, 197, 94, 0.08)",
    border: "1px solid rgba(34, 197, 94, 0.3)",
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
    background: "#16a34a",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "14px"
  },
  statusCheckMark: {
    width: "20px",
    height: "20px",
    borderRadius: "50%",
    background: "#22c55e",
    color: "#000",
    fontWeight: "bold",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "11px"
  },

  uploadGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: "8px",
    marginBottom: "12px"
  },
  uploadCard: {
    background: "#131c2e",
    border: "1px dashed #1e293b",
    borderRadius: "12px",
    padding: "10px 6px",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    textAlign: "center"
  },
  uploadHeaderIcon: {
    width: "30px",
    height: "30px",
    borderRadius: "8px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "14px",
    marginBottom: "6px"
  },
  uploadTitle: { margin: 0, fontSize: "11px", fontWeight: "700" },
  uploadSubtitle: { margin: "4px 0 8px 0", fontSize: "8px", color: "#64748b", minHeight: "22px" },
  textInputStyle: {
    width: "100%",
    background: "#0f172a",
    border: "1px solid #334155",
    borderRadius: "6px",
    padding: "6px 8px",
    color: "#ffffff",
    fontSize: "10px",
    marginBottom: "8px",
    boxSizing: "border-box",
    outline: "none"
  },
  uploadButtonLabel: {
    width: "100%",
    background: "#1e293b",
    border: "1px solid #334155",
    borderRadius: "8px",
    padding: "6px 2px",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "2px",
    cursor: "pointer",
    color: "#93c5fd"
  },

  submitBtn: {
    width: "100%",
    height: "40px",
    borderRadius: "20px",
    border: "none",
    background: "linear-gradient(90deg, #10b981 0%, #0284c7 100%)",
    color: "#ffffff",
    fontSize: "14px",
    fontWeight: "800",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "6px"
  },
  securityNote: { textAlign: "center", fontSize: "10px", color: "#22c55e", margin: "10px 0 0 0" },

  processTitle: { margin: "0 0 10px 0", fontSize: "12px", fontWeight: "700" },
  stepsGrid: { display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "6px" },
  stepCard: {
    background: "#131c2e",
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
    fontSize: "8px",
    width: "12px",
    height: "12px",
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center"
  },
  stepIconCircle: {
    width: "24px",
    height: "24px",
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "11px",
    margin: "2px 0 4px 0"
  },
  stepTitle: { margin: "2px 0", fontSize: "9px", fontWeight: "700" },
  stepText: { margin: 0, fontSize: "7px", color: "#64748b" }
};
