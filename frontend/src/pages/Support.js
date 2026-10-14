import { useState } from "react";

export default function Support() {
  // States
  const [name, setName] = useState("");
  const [mobile, setMobile] = useState("");
  const [referCode, setReferCode] = useState("");
  const [subject, setSubject] = useState("");
  const [problem, setProblem] = useState("");

  // Logic to redirect to Telegram
  const handleGetSupport = (e) => {
    e.preventDefault();

    if (!name.trim() || !mobile.trim() || !subject.trim() || !problem.trim()) {
      return alert("Please fill in your name, mobile number, subject, and problem fields.");
    }

    const telegramUsername = "savemoneysupport";
    
    // Formatted message structure
    const formattedMessage = `📌 New Support Request\n\n👤 Name: ${name}\n📞 Mobile: ${mobile}\nReferral Code: ${referCode || "N/A"}\n🔹 Subject: ${subject}\n❌ Problem: ${problem}`;
    
    // URL Encoding
    const encodedMessage = encodeURIComponent(formattedMessage);
    
    // Direct Telegram Link
    const telegramUrl = `https://t.me/${telegramUsername}?text=${encodedMessage}`;

    // Redirecting to Telegram
    window.open(telegramUrl, "_blank");
  };

  return (
    <div style={styles.container}>
      {/* Support Card Modal */}
      <div style={styles.modalCard}>
        
        {/* 1. Email Support Section (At top) */}
        <div style={styles.emailSupportBox}>
          <div style={styles.emailIcon}>✉️</div>
          <div style={styles.emailTitle}>For any problem resolution, contact us at:</div>
          <a href="mailto:savemoneyofficial.app@gmail.com" style={styles.emailAddress}>
            savemoneyofficial.app@gmail.com
          </a>
        </div>

        {/* OR Divider */}
        <div style={styles.dividerContainer}>
          <div style={styles.dividerLine} />
          <span style={styles.dividerText}>OR</span>
          <div style={styles.dividerLine} />
        </div>

        {/* 2. Telegram Support Form (Below) */}
        <div style={styles.modalHeader}>
          <h3 style={styles.modalTitle}>Start a New Conversation</h3>
        </div>
        
        <form onSubmit={handleGetSupport} style={styles.form}>
          {/* Name Input */}
          <input
            type="text"
            style={styles.modalInput}
            placeholder="Your Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />

          {/* Mobile Number Input */}
          <input
            type="tel"
            style={styles.modalInput}
            placeholder="Mobile Number"
            value={mobile}
            onChange={(e) => setMobile(e.target.value)}
            required
          />

          {/* Refer Code Input (Optional) */}
          <input
            type="text"
            style={styles.modalInput}
            placeholder="Referral Code (Optional)"
            value={referCode}
            onChange={(e) => setReferCode(e.target.value)}
          />

          {/* Subject Input */}
          <input
            type="text"
            style={styles.modalInput}
            placeholder="What is your issue about? (Subject)"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            required
          />
          
          {/* Problem Input */}
          <textarea
            style={styles.modalTextarea}
            placeholder="Describe your issue in detail..."
            value={problem}
            onChange={(e) => setProblem(e.target.value)}
            required
          />
          
          {/* Action Button */}
          <div style={styles.modalActions}>
            <button type="submit" style={styles.submitBtn}>
              Get Support
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}

const styles = {
  container: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    minHeight: "100vh",
    width: "100vw",
    backgroundImage: "linear-gradient(rgba(11, 19, 41, 0.85), rgba(2, 6, 23, 0.92)), url('https://images.unsplash.com/photo-1534536281715-e28d76689b4d?q=80&w=1920&auto=format&fit=crop')",
    backgroundSize: "cover",
    backgroundPosition: "center",
    color: "#f8fafc",
    fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
    boxSizing: "border-box",
    padding: "20px 0"
  },

  modalCard: {
    background: "#1e293b",
    width: "90%",
    maxWidth: "450px",
    borderRadius: "20px",
    padding: "24px",
    boxShadow: "0 10px 40px rgba(0, 0, 0, 0.6)",
    border: "1px solid rgba(255, 255, 255, 0.05)",
    boxSizing: "border-box"
  },

  emailSupportBox: {
    background: "rgba(15, 23, 42, 0.6)",
    border: "1px solid rgba(56, 189, 248, 0.2)",
    borderRadius: "14px",
    padding: "16px",
    textAlign: "center",
    marginBottom: "16px"
  },

  emailIcon: {
    fontSize: "22px",
    marginBottom: "6px"
  },

  emailTitle: {
    fontSize: "12px",
    color: "#94a3b8",
    marginBottom: "6px"
  },

  emailAddress: {
    fontSize: "13px",
    fontWeight: "700",
    color: "#38bdf8",
    textDecoration: "none",
    wordBreak: "break-all"
  },

  dividerContainer: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    margin: "16px 0",
    gap: "10px"
  },

  dividerLine: {
    flex: 1,
    height: "1px",
    background: "rgba(255, 255, 255, 0.1)"
  },

  dividerText: {
    fontSize: "12px",
    fontWeight: "700",
    color: "#64748b"
  },

  modalHeader: {
    marginBottom: "16px"
  },

  modalTitle: {
    margin: 0,
    fontSize: "16px",
    fontWeight: "600",
    color: "#ffffff"
  },

  form: {
    display: "flex",
    flexDirection: "column"
  },

  modalInput: {
    width: "100%",
    padding: "14px 16px",
    background: "#0f172a",
    border: "1px solid rgba(255, 255, 255, 0.08)",
    borderRadius: "10px",
    color: "white",
    marginBottom: "16px",
    fontSize: "14px",
    outline: "none",
    boxSizing: "border-box"
  },

  modalTextarea: {
    width: "100%",
    minHeight: "100px",
    padding: "14px 16px",
    background: "#0f172a",
    border: "1px solid rgba(255, 255, 255, 0.08)",
    borderRadius: "10px",
    color: "white",
    marginBottom: "20px",
    fontSize: "14px",
    outline: "none",
    resize: "none",
    lineHeight: "1.5",
    boxSizing: "border-box"
  },

  modalActions: {
    display: "flex",
    justifyContent: "flex-end"
  },

  submitBtn: {
    width: "100%",
    padding: "12px 24px",
    background: "#38bdf8",
    border: "none",
    color: "#0f172a",
    borderRadius: "10px",
    cursor: "pointer",
    fontWeight: "700",
    fontSize: "14px",
    transition: "background 0.2s, transform 0.1s",
    boxShadow: "0 4px 14px rgba(56, 189, 248, 0.2)"
  }
};
