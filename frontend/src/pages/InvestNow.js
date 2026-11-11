import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

// Backend API Base URL
const API_BASE_URL = "https://save-moneyy-indol.vercel.app";

// AdMob Unit IDs Provided by User
const AD_IDS = {
  banner: "ca-app-pub-5325370327902904~5982828026",
  interstitial: "ca-app-pub-5325370327902904/9065266875",
  rewarded: "ca-app-pub-5325370327902904/6710566274"
};

export default function InvestNow() {
  const navigate = useNavigate();
  const [showValue, setShowValue] = useState(false);
  const [loading, setLoading] = useState(true);
  const [rewardPoints, setRewardPoints] = useState(0);

  // Dynamic user investment summary state
  const [summary, setSummary] = useState({
    totalInvestment: 0,
    totalReturn: 0,
    returnRate: 0
  });

  // 1. Page Load Ad (পেজে ঢুকলেই অ্যাড আসবে)
  useEffect(() => {
    toast.info("📺 Loading Welcome Ad...", { autoClose: 1500 });
    setTimeout(() => {
      console.log("Page Load Interstitial Ad Shown: ", AD_IDS.interstitial);
    }, 1500);
  }, []);

  // Fetch logged-in user's dynamic data
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem("token");

        const headers = {
          "Content-Type": "application/json"
        };

        if (token && token !== "undefined" && token !== "null") {
          headers["Authorization"] = `Bearer ${token}`;
        }

        const response = await fetch(`${API_BASE_URL}/api/user/investment-summary`, {
          method: "GET",
          headers: headers
        });

        if (response.ok) {
          const data = await response.json();
          setSummary({
            totalInvestment: data.totalInvestment || 0,
            totalReturn: data.totalReturn || 0,
            returnRate: data.returnRate || 0
          });
        } else {
          setSummary({ totalInvestment: 0, totalReturn: 0, returnRate: 0 });
        }
      } catch (error) {
        console.error("Error fetching investment data:", error);
        setSummary({ totalInvestment: 0, totalReturn: 0, returnRate: 0 });
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, []);

  // 2. Navigation / Button Click Ad (যেকোনো বাটনে ক্লিক করলে অ্যাড আসবে তারপর পেজ চেঞ্জ হবে)
  const handlePageChangeWithAd = (e, path) => {
    e.stopPropagation(); // Prevent trigger of background click
    toast.info("📺 Loading Ad before continuing...", { autoClose: 1000 });
    
    setTimeout(() => {
      console.log("Action Interstitial Ad Shown: ", AD_IDS.interstitial);
      navigate(path);
    }, 1200);
  };

  // 3. Screen Anywhere Click Ad (স্ক্রিনের ফাঁকা জায়গায় ক্লিক করলেও অ্যাড আসবে)
  const handleScreenClickAd = () => {
    toast.info("🪙 Rewarded Ad Loading...", { autoClose: 1000, toastId: "screen-ad" });
    
    setTimeout(() => {
      console.log("Screen Click Rewarded Ad Shown: ", AD_IDS.rewarded);
      // Optional: Give a small reward for clicking the screen ad
      setRewardPoints(prev => prev + 10);
    }, 1500);
  };

  const formatMoney = (val) => {
    return `₹ ${(val || 0).toLocaleString("en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })}`;
  };

  return (
    <div style={styles.pageBackground} onClick={handleScreenClickAd}>
      <div style={styles.appContainer}>
        
        {/* TOP BANNER AD UNIT (পেজের উপরের ব্যানার অ্যাড) */}
        <div style={styles.adBannerBox} onClick={(e) => e.stopPropagation()}>
          <span style={styles.adBadgeText}>Sponsored Ad ({AD_IDS.banner.substring(0, 25)}...)</span>
          <div style={styles.adBannerContent}>
            📢 Banner Advertisement Space Active
          </div>
        </div>

        {/* 1. TOP HERO CARD */}
        <div style={styles.heroCard} onClick={(e) => e.stopPropagation()}>
          <div style={styles.heroLeft}>
            <div style={styles.heroTitleRow}>
              <span style={styles.heroTitle}>Total Investment Value</span>
              <span style={styles.crownIcon}>👑</span>
            </div>
            
            <div style={styles.amountRow}>
              <h1 style={styles.amountText}>
                {loading
                  ? "Loading..."
                  : showValue
                  ? formatMoney(summary.totalInvestment)
                  : "₹ ••••••••"}
              </h1>
              <span 
                style={styles.arrowToggle} 
                onClick={(e) => { 
                  e.stopPropagation(); 
                  setShowValue(!showValue); 
                  handleScreenClickAd(); // Show ad on amount toggle as well
                }}
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

        {/* 2. QUICK ACTIONS */}
        <div style={styles.quickActionBox}>
          <div style={styles.actionItem} onClick={(e) => handlePageChangeWithAd(e, "/wallet")}>
            <div style={styles.iconBoxPurple}>👛</div>
            <div style={styles.actionTextGroup}>
              <span style={styles.actionTitle}>Add Money</span>
              <span style={styles.actionSub}>Top up balance</span>
            </div>
            <span style={styles.navArrow}>›</span>
          </div>

          <div style={styles.verticalDivider}></div>

          <div style={styles.actionItem} onClick={(e) => handlePageChangeWithAd(e, "/my-investments")}>
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
          <div style={styles.saveMoneyCard} onClick={(e) => handlePageChangeWithAd(e, "/save-money")}>
            <div style={styles.cardTopContent}>
              <div style={styles.cardCircleIconGreen}>🌱</div>
              <h3 style={styles.cardHeaderTitle}>SAVE MONEY</h3>
              <span style={styles.yellowBadge}>SIP Invest Plan</span>
              <h2 style={styles.cardMainHeading}>Start small, grow big</h2>
              <p style={styles.cardDescription}>
                Build your wealth step by step with our smart SIP saving plan.
              </p>
            </div>
            <button style={styles.btnInvestNow}>
              <span>Invest Now</span>
              <span style={styles.circleArrowGreen}>›</span>
            </button>
          </div>

          {/* ONE TIME */}
          <div style={styles.oneTimeCard} onClick={(e) => handlePageChangeWithAd(e, "/one-time")}>
            <div style={styles.cardTopContent}>
              <div style={styles.cardCircleIconBlue}>🚀</div>
              <h3 style={styles.cardHeaderTitle}>ONE TIME</h3>
              <span style={styles.yellowBadge}>Upgrade Money</span>
              <h2 style={styles.cardMainHeading}>Upgrade your future</h2>
              <p style={styles.cardDescription}>
                Make a smart move and unlock upgraded growth opportunities.
              </p>
            </div>
            <button style={styles.btnUpgradeNow}>
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
        <div style={styles.comingSoonGrid} onClick={(e) => { e.stopPropagation(); handleScreenClickAd(); }}>
          <div style={styles.goldCard}>
            <div style={styles.topPinkTag}>Coming Soon</div>
            <div style={styles.goldIconCircle}>🪙</div>
            <h4 style={styles.comingCardTitle}>Invest GOLD</h4>
            <p style={styles.comingCardSub}>Secure your future with gold value.</p>
            <div style={styles.goldBtnPill}>🕒 Coming Soon</div>
          </div>

          <div style={styles.silverCard}>
            <div style={styles.topPinkTag}>Coming Soon</div>
            <div style={styles.silverIconCircle}>🧱</div>
            <h4 style={styles.comingCardTitle}>Invest SILVER</h4>
            <p style={styles.comingCardSub}>Invest in silver & build tomorrow.</p>
            <div style={styles.silverBtnPill}>🕒 Coming Soon</div>
          </div>

          <div style={styles.rdCard}>
            <div style={styles.topPinkTag}>Coming Soon</div>
            <div style={styles.rdIconCircle}>🔄</div>
            <h4 style={styles.comingCardTitle}>RECURRING</h4>
            <p style={styles.comingCardSub}>Save regularly with discipline.</p>
            <div style={styles.rdBtnPill}>🕒 Coming Soon</div>
          </div>
        </div>

      </div>
    </div>
  );
}

// Inline Styles
const styles = {
  pageBackground: {
    backgroundColor: "#ebf3fe",
    minHeight: "100vh",
    padding: "12px",
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    cursor: "pointer",
    paddingBottom: "80px"
  },
  appContainer: {
    maxWidth: "420px",
    margin: "0 auto",
    display: "flex",
    flexDirection: "column",
    gap: "12px"
  },
  adBannerBox: {
    background: "#ffffff",
    borderRadius: "12px",
    padding: "8px",
    textAlign: "center",
    border: "1px dashed #cbd5e1",
    cursor: "default"
  },
  adBadgeText: { fontSize: "9px", color: "#64748b", display: "block", marginBottom: "2px" },
  adBannerContent: { fontSize: "11px", fontWeight: "700", color: "#2563eb" },
  heroCard: {
    background: "linear-gradient(135deg, #2563eb 0%, #7c3aed 50%, #e11d48 100%)",
    borderRadius: "22px",
    padding: "18px 20px",
    color: "#fff",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    boxShadow: "0 8px 20px rgba(37, 99, 235, 0.2)",
    cursor: "default"
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
  activeGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" },
  saveMoneyCard: {
    background: "linear-gradient(160deg, #10b981 0%, #047857 100%)",
    borderRadius: "18px",
    padding: "14px",
    color: "#fff",
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
    minHeight: "230px",
    cursor: "pointer"
  },
  oneTimeCard: {
    background: "linear-gradient(160deg, #2563eb 0%, #1d4ed8 100%)",
    borderRadius: "18px",
    padding: "14px",
    color: "#fff",
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
    minHeight: "230px",
    cursor: "pointer"
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
    cursor: "pointer",
    pointerEvents: "none" // Click handled by parent card
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
    cursor: "pointer",
    pointerEvents: "none" // Click handled by parent card
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
  }
};
