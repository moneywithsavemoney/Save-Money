import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

export default function InvestNow() {
  const navigate = useNavigate();
  const [showValue, setShowValue] = useState(false);
  const [loading, setLoading] = useState(false);

  const summary = {
    totalInvestment: 16000.0,
    totalReturn: 41882.13,
    returnRate: 17
  };

  const formatMoney = (val) => {
    return `₹ ${val.toLocaleString("en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })}`;
  };

  return (
    <div style={styles.pageBackground}>
      <div style={styles.appContainer}>
        
        {/* 1. TOP HERO CARD */}
        <div style={styles.heroCard}>
          <div style={styles.heroLeft}>
            <div style={styles.heroTitleRow}>
              <span style={styles.heroTitle}>Total Investment Value</span>
              <span style={styles.crownIcon}>👑</span>
            </div>
            
            <div style={styles.amountRow}>
              <h1 style={styles.amountText}>
                {showValue ? formatMoney(summary.totalInvestment) : "₹ ••••••••"}
              </h1>
              <span 
                style={styles.arrowToggle} 
                onClick={() => setShowValue(!showValue)}
              >
                ›
              </span>
            </div>

            <div style={styles.badgeRow}>
              <span style={styles.rateBadge}>📈 {summary.returnRate}%</span>
            </div>
            <p style={styles.subText}>This Month Added</p>
          </div>

          <div style={styles.heroRight}>
            <div style={styles.piggyWrapper}>
              <div style={styles.coinBadge}>₹</div>
              <div style={styles.piggyEmoji}>🐷</div>
            </div>
          </div>
        </div>

        {/* 2. QUICK ACTIONS (Add Money / My Investments) */}
        <div style={styles.quickActionBox}>
          <div style={styles.actionItem} onClick={() => navigate("/wallet")}>
            <div style={styles.iconBoxPurple}>👛</div>
            <div style={styles.actionTextGroup}>
              <span style={styles.actionTitle}>Add Money</span>
              <span style={styles.actionSub}>Top up balance</span>
            </div>
            <span style={styles.navArrow}>›</span>
          </div>

          <div style={styles.verticalDivider}></div>

          <div style={styles.actionItem} onClick={() => navigate("/my-investments")}>
            <div style={styles.iconBoxGreen}>📋</div>
            <div style={styles.actionTextGroup}>
              <span style={styles.actionTitle}>My Investments</span>
              <span style={styles.actionSub}>View all plans</span>
            </div>
            <span style={styles.navArrow}>›</span>
          </div>
        </div>

        {/* 3. SECTION HEADER: ACTIVE INVESTMENT */}
        <div style={styles.sectionDivider}>
          <div style={styles.glowLineLeft}></div>
          <div style={styles.sectionHeaderContent}>
            <span style={{ fontSize: "16px" }}>📊</span>
            <span style={styles.sectionTitle}>Active Investment</span>
          </div>
          <div style={styles.glowLineRight}></div>
        </div>

        {/* 4. ACTIVE INVESTMENT GRID */}
        <div style={styles.activeGrid}>
          {/* SAVE MONEY */}
          <div style={styles.saveMoneyCard}>
            <div style={styles.cardTopContent}>
              <div style={styles.cardCircleIconGreen}>🌱</div>
              <h3 style={styles.cardHeaderTitle}>SAVE MONEY</h3>
              <span style={styles.yellowBadge}>SIP Invest Plan</span>
              <h2 style={styles.cardMainHeading}>Start small, grow big</h2>
              <p style={styles.cardDescription}>
                Build your wealth step by step with our smart SIP saving plan.
              </p>
            </div>
            <button style={styles.btnInvestNow} onClick={() => navigate("/save-money")}>
              <span>Invest Now</span>
              <span style={styles.circleArrowGreen}>›</span>
            </button>
          </div>

          {/* ONE TIME */}
          <div style={styles.oneTimeCard}>
            <div style={styles.cardTopContent}>
              <div style={styles.cardCircleIconBlue}>🚀</div>
              <h3 style={styles.cardHeaderTitle}>ONE TIME</h3>
              <span style={styles.yellowBadge}>Upgrade Money</span>
              <h2 style={styles.cardMainHeading}>Upgrade your future</h2>
              <p style={styles.cardDescription}>
                Make a smart move and unlock upgraded growth opportunities.
              </p>
            </div>
            <button style={styles.btnUpgradeNow} onClick={() => navigate("/one-time")}>
              <span>Upgrade Now</span>
              <span style={styles.circleArrowBlue}>›</span>
            </button>
          </div>
        </div>

        {/* 5. SECTION HEADER: COMING SOON */}
        <div style={styles.sectionDivider}>
          <div style={styles.glowLineLeft}></div>
          <div style={styles.sectionHeaderContent}>
            <span style={{ fontSize: "16px" }}>🕒</span>
            <span style={styles.sectionTitle}>Coming Soon</span>
          </div>
          <div style={styles.glowLineRight}></div>
        </div>

        {/* 6. COMING SOON GRID */}
        <div style={styles.comingSoonGrid}>
          {/* GOLD */}
          <div style={styles.goldCard}>
            <div style={styles.topPinkTag}>Coming Soon</div>
            <div style={styles.goldIconCircle}>🪙</div>
            <h4 style={styles.comingCardTitle}>Invest GOLD</h4>
            <p style={styles.comingCardSub}>Secure your future with the power of gold value.</p>
            <div style={styles.goldBtnPill}>🕒 Coming Soon</div>
          </div>

          {/* SILVER */}
          <div style={styles.silverCard}>
            <div style={styles.topPinkTag}>Coming Soon</div>
            <div style={styles.silverIconCircle}>🧱</div>
            <h4 style={styles.comingCardTitle}>Invest SILVER</h4>
            <p style={styles.comingCardSub}>Invest in silver and build a stable tomorrow.</p>
            <div style={styles.silverBtnPill}>🕒 Coming Soon</div>
          </div>

          {/* RECURRING DEPOSIT */}
          <div style={styles.rdCard}>
            <div style={styles.topPinkTag}>Coming Soon</div>
            <div style={styles.rdIconCircle}>🔄</div>
            <h4 style={styles.comingCardTitle}>RECURRING DEPOSIT</h4>
            <p style={styles.comingCardSub}>Save regularly and grow with disciplined returns.</p>
            <div style={styles.rdBtnPill}>🕒 Coming Soon</div>
          </div>
        </div>

        {/* 7. DISCIPLINE BANNER */}
        <div style={styles.bannerContainer}>
          <div style={{ fontSize: "28px" }}>🏆</div>
          <div style={{ flex: 1 }}>
            <h4 style={styles.bannerTitle}>Discipline Today, Wealth Tomorrow.</h4>
            <p style={styles.bannerSub}>Small steps now, big freedom later.</p>
          </div>
          <span style={{ color: "#fff", opacity: 0.7, fontSize: "18px" }}>›</span>
        </div>

        {/* 8. BOTTOM STATS PANEL */}
        <div style={styles.bottomStatsCard}>
          <div style={styles.statGroup}>
            <div style={{ ...styles.statIcon, background: "#10b981" }}>📈</div>
            <div>
              <p style={styles.statLabel}>Total Invested</p>
              <h4 style={styles.statValue}>{formatMoney(summary.totalInvestment)}</h4>
            </div>
          </div>

          <div style={styles.statDividerVertical}></div>

          <div style={styles.statGroup}>
            <div style={{ ...styles.statIcon, background: "#3b82f6" }}>₹</div>
            <div>
              <p style={styles.statLabel}>Total Return</p>
              <h4 style={styles.statValue}>{formatMoney(summary.totalReturn)}</h4>
            </div>
          </div>

          <div style={styles.statDividerVertical}></div>

          <div style={styles.statGroup}>
            <div style={{ ...styles.statIcon, background: "#8b5cf6" }}>%</div>
            <div>
              <p style={styles.statLabel}>Return Rate</p>
              <h4 style={styles.statValue}>{summary.returnRate}%</h4>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

// 100% Matching CSS Styles
const styles = {
  pageBackground: {
    backgroundColor: "#ebf3fe", // Soft Light Blue Background (Target Matching)
    minHeight: "100vh",
    padding: "12px",
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
  },
  appContainer: {
    maxWidth: "420px",
    margin: "0 auto",
    display: "flex",
    flexDirection: "column",
    gap: "12px"
  },

  /* HERO */
  heroCard: {
    background: "linear-gradient(135deg, #2563eb 0%, #7c3aed 50%, #e11d48 100%)",
    borderRadius: "22px",
    padding: "18px 20px",
    color: "#fff",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    boxShadow: "0 8px 20px rgba(37, 99, 235, 0.2)"
  },
  heroLeft: { flex: 1 },
  heroTitleRow: { display: "flex", alignItems: "center", gap: "6px" },
  heroTitle: { fontSize: "14px", fontWeight: "700", opacity: 0.95 },
  crownIcon: { fontSize: "12px", background: "rgba(255,255,255,0.2)", padding: "2px 4px", borderRadius: "50%" },
  amountRow: { display: "flex", alignItems: "center", gap: "8px", margin: "4px 0" },
  amountText: { fontSize: "26px", fontWeight: "900", margin: 0 },
  arrowToggle: { fontSize: "22px", cursor: "pointer", fontWeight: "300" },
  badgeRow: { marginTop: "2px" },
  rateBadge: {
    background: "rgba(16, 185, 129, 0.25)",
    color: "#6ee7b7",
    padding: "2px 8px",
    borderRadius: "8px",
    fontSize: "12px",
    fontWeight: "800"
  },
  subText: { fontSize: "11px", margin: "4px 0 0 0", opacity: 0.8 },
  heroRight: { position: "relative" },
  piggyWrapper: { position: "relative" },
  piggyEmoji: { fontSize: "52px" },
  coinBadge: {
    position: "absolute",
    top: "-5px",
    right: "6px",
    background: "#facc15",
    color: "#854d0e",
    width: "20px",
    height: "20px",
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "11px",
    fontWeight: "bold",
    border: "2px solid #ffffff"
  },

  /* QUICK ACTIONS */
  quickActionBox: {
    background: "#ffffff",
    borderRadius: "18px",
    padding: "10px 14px",
    display: "flex",
    alignItems: "center",
    boxShadow: "0 2px 10px rgba(0,0,0,0.03)"
  },
  actionItem: {
    flex: 1,
    display: "flex",
    alignItems: "center",
    gap: "10px",
    cursor: "pointer"
  },
  iconBoxPurple: {
    width: "36px",
    height: "36px",
    borderRadius: "10px",
    background: "#8b5cf6",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#fff"
  },
  iconBoxGreen: {
    width: "36px",
    height: "36px",
    borderRadius: "10px",
    background: "#10b981",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#fff"
  },
  actionTextGroup: { display: "flex", flexDirection: "column" },
  actionTitle: { fontSize: "13px", fontWeight: "800", color: "#0f172a" },
  actionSub: { fontSize: "10px", color: "#64748b" },
  verticalDivider: { width: "1px", height: "28px", background: "#f1f5f9", margin: "0 10px" },
  navArrow: { marginLeft: "auto", color: "#cbd5e1", fontSize: "18px" },

  /* SECTION DIVIDER */
  sectionDivider: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    margin: "8px 0"
  },
  glowLineLeft: { flex: 1, height: "2px", background: "linear-gradient(90deg, transparent, #a855f7)" },
  glowLineRight: { flex: 1, height: "2px", background: "linear-gradient(90deg, #a855f7, transparent)" },
  sectionHeaderContent: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    padding: "0 10px"
  },
  sectionTitle: { fontSize: "16px", fontWeight: "800", color: "#1e1b4b" },

  /* ACTIVE GRID */
  activeGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" },
  saveMoneyCard: {
    background: "linear-gradient(160deg, #10b981 0%, #047857 100%)",
    borderRadius: "18px",
    padding: "14px",
    color: "#fff",
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
    minHeight: "230px"
  },
  oneTimeCard: {
    background: "linear-gradient(160deg, #2563eb 0%, #1d4ed8 100%)",
    borderRadius: "18px",
    padding: "14px",
    color: "#fff",
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
    minHeight: "230px"
  },
  cardTopContent: { display: "flex", flexDirection: "column", alignItems: "flex-start" },
  cardCircleIconGreen: {
    width: "38px",
    height: "38px",
    background: "rgba(255,255,255,0.2)",
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: "8px"
  },
  cardCircleIconBlue: {
    width: "38px",
    height: "38px",
    background: "rgba(255,255,255,0.2)",
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: "8px"
  },
  cardHeaderTitle: { margin: 0, fontSize: "14px", fontWeight: "800" },
  yellowBadge: {
    background: "#facc15",
    color: "#713f12",
    fontSize: "10px",
    fontWeight: "800",
    padding: "2px 6px",
    borderRadius: "6px",
    marginTop: "4px"
  },
  cardMainHeading: { fontSize: "15px", fontWeight: "800", margin: "10px 0 2px 0" },
  cardDescription: { fontSize: "10px", opacity: 0.85, lineHeight: "1.3", margin: 0 },
  
  btnInvestNow: {
    background: "#064e3b",
    color: "#fff",
    border: "none",
    borderRadius: "20px",
    padding: "6px 10px 6px 14px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    fontSize: "12px",
    fontWeight: "800",
    cursor: "pointer"
  },
  btnUpgradeNow: {
    background: "#172554",
    color: "#fff",
    border: "none",
    borderRadius: "20px",
    padding: "6px 10px 6px 14px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    fontSize: "12px",
    fontWeight: "800",
    cursor: "pointer"
  },
  circleArrowGreen: {
    background: "#34d399",
    color: "#064e3b",
    width: "18px",
    height: "18px",
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: "bold"
  },
  circleArrowBlue: {
    background: "#60a5fa",
    color: "#172554",
    width: "18px",
    height: "18px",
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: "bold"
  },

  /* COMING SOON GRID */
  comingSoonGrid: { display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "8px" },
  goldCard: {
    background: "linear-gradient(180deg, #fefce8 0%, #fef08a 100%)",
    borderRadius: "16px",
    padding: "10px 6px",
    textAlign: "center",
    position: "relative",
    border: "1px solid #fde047",
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
    minHeight: "175px"
  },
  silverCard: {
    background: "linear-gradient(180deg, #ffffff 0%, #e2e8f0 100%)",
    borderRadius: "16px",
    padding: "10px 6px",
    textAlign: "center",
    position: "relative",
    border: "1px solid #cbd5e1",
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
    minHeight: "175px"
  },
  rdCard: {
    background: "linear-gradient(180deg, #fff1f2 0%, #fecdd3 100%)",
    borderRadius: "16px",
    padding: "10px 6px",
    textAlign: "center",
    position: "relative",
    border: "1px solid #fda4af",
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
    minHeight: "175px"
  },

  topPinkTag: {
    position: "absolute",
    top: 0,
    left: "50%",
    transform: "translateX(-50%)",
    background: "#ec4899",
    color: "#fff",
    fontSize: "8px",
    fontWeight: "800",
    padding: "2px 8px",
    borderRadius: "0 0 6px 6px"
  },
  goldIconCircle: {
    width: "34px",
    height: "34px",
    background: "#fef08a",
    borderRadius: "50%",
    margin: "14px auto 0 auto",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "16px"
  },
  silverIconCircle: {
    width: "34px",
    height: "34px",
    background: "#cbd5e1",
    borderRadius: "50%",
    margin: "14px auto 0 auto",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "16px"
  },
  rdIconCircle: {
    width: "34px",
    height: "34px",
    background: "#fda4af",
    borderRadius: "50%",
    margin: "14px auto 0 auto",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "16px"
  },
  comingCardTitle: { fontSize: "10px", fontWeight: "800", margin: "4px 0 2px 0", color: "#0f172a" },
  comingCardSub: { fontSize: "8px", color: "#64748b", margin: 0, lineHeight: "1.2" },

  goldBtnPill: {
    background: "#eab308",
    color: "#fff",
    fontSize: "8px",
    fontWeight: "800",
    padding: "4px 0",
    borderRadius: "10px"
  },
  silverBtnPill: {
    background: "#64748b",
    color: "#fff",
    fontSize: "8px",
    fontWeight: "800",
    padding: "4px 0",
    borderRadius: "10px"
  },
  rdBtnPill: {
    background: "#e11d48",
    color: "#fff",
    fontSize: "8px",
    fontWeight: "800",
    padding: "4px 0",
    borderRadius: "10px"
  },

  /* BANNER */
  bannerContainer: {
    background: "linear-gradient(135deg, #1e1b4b 0%, #312e81 100%)",
    borderRadius: "16px",
    padding: "10px 14px",
    color: "#fff",
    display: "flex",
    alignItems: "center",
    gap: "10px"
  },
  bannerTitle: { fontSize: "12px", fontWeight: "800", margin: 0 },
  bannerSub: { fontSize: "10px", opacity: 0.8, margin: 0 },

  /* STATS CARD */
  bottomStatsCard: {
    background: "#ffffff",
    borderRadius: "16px",
    padding: "10px 12px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    boxShadow: "0 2px 8px rgba(0,0,0,0.03)"
  },
  statGroup: { display: "flex", alignItems: "center", gap: "6px" },
  statIcon: {
    width: "26px",
    height: "26px",
    borderRadius: "6px",
    color: "#fff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "11px",
    fontWeight: "bold"
  },
  statLabel: { fontSize: "9px", color: "#64748b", margin: 0 },
  statValue: { fontSize: "11px", fontWeight: "800", color: "#0f172a", margin: 0 },
  statDividerVertical: { width: "1px", height: "20px", background: "#f1f5f9" }
};
