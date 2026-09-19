import React from "react";

export default function AboutCompany() {
  return (
    <div style={styles.container}>
      <div style={styles.wrapper}>
        
        {/* Hero Section */}
        <div style={styles.heroSection}>
          <div style={styles.badge}>🚀 NEXT-GEN FINTECH PLATFORM</div>
          <h1 style={styles.title}>SAVE MONEY</h1>
          <p style={styles.slogan}>Smart Investing • Exponential Growth • Financial Freedom</p>
          <p style={styles.heroDesc}>
            Save Money is an institutional-grade algorithmic savings and diversified investment platform. 
            We help you maximize wealth growth while keeping your savings secure through modern digital technology.
          </p>
        </div>

        {/* Stats Grid */}
        <div style={styles.statsGrid}>
          <div style={styles.statCard}>
            <h3 style={styles.statNumber}>$50M+</h3>
            <p style={styles.statLabel}>Managed Digital Assets</p>
          </div>
          <div style={styles.statCard}>
            <h3 style={styles.statNumber}>100K+</h3>
            <p style={styles.statLabel}>Active Investors</p>
          </div>
          <div style={styles.statCard}>
            <h3 style={styles.statNumber}>99.9%</h3>
            <p style={styles.statLabel}>Platform Security Score</p>
          </div>
          <div style={styles.statCard}>
            <h3 style={styles.statNumber}>24/7</h3>
            <p style={styles.statLabel}>Instant Liquidity Payout</p>
          </div>
        </div>

        {/* Why Choose Us / Key Features */}
        <div style={styles.sectionHeader}>
          <h2 style={styles.sectionTitle}>Why Choose Save Money?</h2>
          <p style={styles.sectionSub}>Our Premium Investment Features</p>
        </div>

        <div style={styles.featuresGrid}>
          <div style={styles.featureCard}>
            <div style={styles.featureIcon}>🛡️</div>
            <h3 style={styles.featureTitle}>Bank-Grade Security</h3>
            <p style={styles.featureDesc}>
              Every transaction is protected with 256-bit SSL encryption and multi-factor security protocols.
            </p>
          </div>

          <div style={styles.featureCard}>
            <div style={styles.featureIcon}>📈</div>
            <h3 style={styles.featureTitle}>Auto-Balancing Portfolio</h3>
            <p style={styles.featureDesc}>
              Our smart algorithms work continuously to secure the best market returns with minimal risk.
            </p>
          </div>

          <div style={styles.featureCard}>
            <div style={styles.featureIcon}>⚡</div>
            <h3 style={styles.featureTitle}>Instant Cashout</h3>
            <p style={styles.featureDesc}>
              Complete freedom to withdraw your profit and principal at any time without delays.
            </p>
          </div>

          <div style={styles.featureCard}>
            <div style={styles.featureIcon}>🔍</div>
            <h3 style={styles.featureTitle}>100% Transparent Tracking</h3>
            <p style={styles.featureDesc}>
              Easily monitor where and how your investment is growing with our real-time analytics dashboard.
            </p>
          </div>
        </div>

        {/* Mission & Vision Section */}
        <div style={styles.splitSection}>
          <div style={styles.infoCard}>
            <div style={styles.cardHeader}>
              <span style={styles.cardIcon}>🎯</span>
              <h2 style={styles.cardTitle}>Our Mission</h2>
            </div>
            <p style={styles.cardDesc}>
              To cultivate disciplined saving habits in everyone and provide a sustainable path to reliable profits through digital financial products.
            </p>
          </div>

          <div style={styles.infoCard}>
            <div style={styles.cardHeader}>
              <span style={styles.cardIcon}>👁️</span>
              <h2 style={styles.cardTitle}>Our Vision</h2>
            </div>
            <p style={styles.cardDesc}>
              To lead the future global fintech industry as the most trusted and secure investment ecosystem.
            </p>
          </div>
        </div>

        {/* Risk Disclaimer & Notice */}
        <div style={styles.noticeBox}>
          <div style={styles.noticeHeader}>
            <span style={styles.noticeIcon}>⚠️</span>
            <h3 style={styles.noticeTitle}>Important Risk & Security Declaration</h3>
          </div>
          <p style={styles.noticeText}>
            Save Money is a private initiative fintech platform. All digital investments are subject to market fluctuations. Please carefully read and review our Terms & Conditions and Risk Policy before participating in any scheme.
          </p>
        </div>

        {/* Call To Action Card */}
        <div style={styles.ctaCard}>
          <h2 style={styles.ctaTitle}>Achieve Your Financial Freedom Today</h2>
          <p style={styles.ctaDesc}>Join smart investors and transform your savings into high-yield assets.</p>
          <button style={styles.ctaButton}>Start Investing</button>
        </div>

      </div>
    </div>
  );
}

const styles = {
  container: {
    minHeight: "100vh",
    background: "radial-gradient(circle at top, #0f172a 0%, #020617 100%)",
    padding: "40px 16px",
    color: "#f8fafc",
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
  },

  wrapper: {
    maxWidth: "900px",
    margin: "0 auto",
    display: "flex",
    flexDirection: "column",
    gap: "32px",
  },

  heroSection: {
    textAlign: "center",
    padding: "36px 20px",
    background: "rgba(30, 41, 59, 0.4)",
    borderRadius: "28px",
    border: "1px solid rgba(255, 255, 255, 0.08)",
    backdropFilter: "blur(12px)",
    boxShadow: "0 20px 40px rgba(0,0,0,0.3)",
  },

  badge: {
    display: "inline-block",
    padding: "6px 16px",
    background: "rgba(16, 185, 129, 0.15)",
    color: "#10b981",
    borderRadius: "20px",
    fontSize: "12px",
    fontWeight: "700",
    letterSpacing: "1px",
    marginBottom: "16px",
    border: "1px solid rgba(16, 185, 129, 0.3)",
  },

  title: {
    fontSize: "36px",
    fontWeight: "900",
    color: "#ffffff",
    letterSpacing: "2px",
    margin: "0 0 8px 0",
  },

  slogan: {
    fontSize: "16px",
    color: "#38bdf8",
    fontWeight: "600",
    margin: "0 0 18px 0",
  },

  heroDesc: {
    fontSize: "15px",
    color: "#94a3b8",
    lineHeight: "1.7",
    maxWidth: "700px",
    margin: "0 auto",
  },

  statsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
    gap: "16px",
  },

  statCard: {
    background: "rgba(15, 23, 42, 0.6)",
    padding: "20px",
    borderRadius: "20px",
    border: "1px solid rgba(255, 255, 255, 0.05)",
    textAlign: "center",
  },

  statNumber: {
    fontSize: "28px",
    fontWeight: "800",
    color: "#10b981",
    margin: "0 0 6px 0",
  },

  statLabel: {
    fontSize: "13px",
    color: "#94a3b8",
    margin: 0,
  },

  sectionHeader: {
    textAlign: "center",
    marginTop: "16px",
  },

  sectionTitle: {
    fontSize: "24px",
    fontWeight: "700",
    color: "#f8fafc",
    margin: "0 0 6px 0",
  },

  sectionSub: {
    fontSize: "14px",
    color: "#64748b",
    margin: 0,
  },

  featuresGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
    gap: "20px",
  },

  featureCard: {
    background: "rgba(30, 41, 59, 0.5)",
    padding: "24px",
    borderRadius: "22px",
    border: "1px solid rgba(255, 255, 255, 0.06)",
    transition: "transform 0.2s ease",
  },

  featureIcon: {
    fontSize: "32px",
    marginBottom: "12px",
  },

  featureTitle: {
    fontSize: "18px",
    fontWeight: "700",
    color: "#f1f5f9",
    margin: "0 0 8px 0",
  },

  featureDesc: {
    fontSize: "14px",
    color: "#94a3b8",
    lineHeight: "1.6",
    margin: 0,
  },

  splitSection: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
    gap: "20px",
  },

  infoCard: {
    background: "linear-gradient(145deg, rgba(30, 41, 59, 0.7), rgba(15, 23, 42, 0.8))",
    padding: "28px",
    borderRadius: "24px",
    border: "1px solid rgba(255, 255, 255, 0.08)",
  },

  cardHeader: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    marginBottom: "14px",
  },

  cardIcon: {
    fontSize: "24px",
  },

  cardTitle: {
    fontSize: "20px",
    fontWeight: "700",
    color: "#f8fafc",
    margin: 0,
  },

  cardDesc: {
    fontSize: "14px",
    color: "#cbd5e1",
    lineHeight: "1.7",
    margin: 0,
  },

  noticeBox: {
    background: "rgba(245, 158, 11, 0.08)",
    border: "1px solid rgba(245, 158, 11, 0.3)",
    borderRadius: "20px",
    padding: "24px",
  },

  noticeHeader: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    marginBottom: "10px",
  },

  noticeIcon: {
    fontSize: "20px",
  },

  noticeTitle: {
    fontSize: "16px",
    fontWeight: "700",
    color: "#fbbf24",
    margin: 0,
  },

  noticeText: {
    fontSize: "13px",
    color: "#e2e8f0",
    lineHeight: "1.6",
    margin: 0,
  },

  ctaCard: {
    textAlign: "center",
    background: "linear-gradient(135deg, #059669 0%, #0284c7 100%)",
    padding: "36px 20px",
    borderRadius: "28px",
    boxShadow: "0 15px 35px rgba(5, 150, 105, 0.25)",
  },

  ctaTitle: {
    fontSize: "24px",
    fontWeight: "800",
    color: "#ffffff",
    margin: "0 0 10px 0",
  },

  ctaDesc: {
    fontSize: "14px",
    color: "#e0f2fe",
    margin: "0 0 20px 0",
  },

  ctaButton: {
    background: "#ffffff",
    color: "#0f172a",
    border: "none",
    padding: "14px 32px",
    fontSize: "15px",
    fontWeight: "800",
    borderRadius: "14px",
    cursor: "pointer",
    boxShadow: "0 10px 20px rgba(0,0,0,0.15)",
  },
};
