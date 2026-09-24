import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { API } from "../config";

export default function InvestNow() {
  const navigate = useNavigate();

  const email = localStorage.getItem("email") || "";
  const token = localStorage.getItem("token") || "";

  const [loading, setLoading] = useState(true);
  const [showInvestment, setShowInvestment] = useState(false);

  const [summary, setSummary] = useState({
    totalInvestment: 0,
    monthlyInvestment: 0,
    totalReturn: 0,
    returnRate: 17,
    activePlan: 0
  });

  useEffect(() => {
    loadSummary();

    return () => {
      setShowInvestment(false);
    };
  }, []);

  const loadSummary = async () => {
    try {
      setLoading(true);

      const res = await fetch(`${API}/investment-summary`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          authorization: token || ""
        },
        body: JSON.stringify({
          email
        })
      });

      const data = await res.json();

      if (data?.success) {
        setSummary({
          totalInvestment: Number(data.totalInvestment || 0),
          monthlyInvestment: Number(data.monthlyInvestment || 0),
          totalReturn: Number(data.totalReturn || 0),
          returnRate: Number(data.returnRate || 17),
          activePlan: Number(data.activePlan || 0)
        });
      }
    } catch (err) {
      console.log("INVESTMENT SUMMARY ERROR:", err);
    } finally {
      setLoading(false);
    }
  };

  const money = (n) => {
    return `₹ ${Number(n || 0).toLocaleString("en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })}`;
  };

  const showMoney = (amount) => {
    return showInvestment ? money(amount) : "₹ ••••••••";
  };

  const comingSoon = () => {
    toast.info("Temporary Unavailable - Coming Soon");
  };

  const plans = useMemo(() => {
    return [
      {
        type: "save",
        title: "SAVE MONEY",
        subtitle: "SIP Invest Plan",
        heading: "Start small, grow big",
        description:
          "Build your wealth step by step with our smart SIP saving plan.",
        icon: "plant",
        button: "Invest Now",
        onClick: () => navigate("/save-money")
      },
      {
        type: "one",
        title: "ONE TIME",
        subtitle: "Upgrade Money",
        heading: "Upgrade your future",
        description:
          "Make a smart move and unlock upgraded growth opportunities.",
        icon: "rocket",
        button: "Upgrade Now",
        onClick: () => navigate("/one-time")
      }
    ];
  }, [navigate]);

  const comingCards = [
    {
      title: "Invest GOLD",
      text: "Secure your future with the power of gold value.",
      icon: "gold",
      theme: "gold"
    },
    {
      title: "Invest SILVER",
      text: "Invest in silver and build a stable tomorrow.",
      icon: "silver",
      theme: "silver"
    },
    {
      title: "RECURRING DEPOSIT",
      text: "Save regularly and grow with disciplined returns.",
      icon: "piggy",
      theme: "rd"
    }
  ];

  if (loading) {
    return (
      <div style={styles.loadingPage}>
        <div style={styles.loadingCard}>
          <h2 style={{ color: "#1e293b", margin: "10px 0 5px 0" }}>Loading Investment</h2>
          <p style={{ color: "#64748b", margin: 0 }}>Please wait...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.page}>
      <div style={styles.appWrap}>

        {/* HERO CARD */}
        <section style={styles.heroCard}>
          <div style={styles.heroLeft}>
            <div style={styles.heroLabelRow}>
              <p style={styles.heroLabel}>Total Investment Value</p>
              <span style={styles.crownBadge}>👑</span>
            </div>

            <h1 style={styles.heroAmount}>
              {showMoney(summary.totalInvestment)}
              <button
                style={styles.eyeBtn}
                onClick={() => setShowInvestment(!showInvestment)}
              >
                ›
              </button>
            </h1>

            <div style={styles.heroGainRow}>
              <span style={styles.greenTag}>📈 {summary.returnRate}%</span>
            </div>
            <p style={styles.heroSub}>This Month Added</p>
          </div>

          <div style={styles.heroRight}>
            <div style={styles.piggyContainer}>
              <div style={styles.piggyCoin}>₹</div>
              <div style={styles.piggyIllustration}>🐷</div>
            </div>
          </div>
        </section>

        {/* QUICK ACTIONS */}
        <section style={styles.quickPanel}>
          <button style={styles.quickAction} onClick={() => navigate("/wallet")}>
            <div style={styles.quickIconPurple}>👛</div>
            <div>
              <h3 style={styles.quickTitle}>Add Money</h3>
              <p style={styles.quickSub}>Top up balance</p>
            </div>
            <span style={styles.arrowRight}>›</span>
          </button>

          <button style={styles.quickAction} onClick={() => navigate("/my-investment")}>
            <div style={styles.quickIconGreen}>📋</div>
            <div>
              <h3 style={styles.quickTitle}>My Investments</h3>
              <p style={styles.quickSub}>View all plans</p>
            </div>
            <span style={styles.arrowRight}>›</span>
          </button>
        </section>

        {/* ACTIVE INVESTMENT TITLE */}
        <div style={styles.sectionHeader}>
          <span style={styles.line}></span>
          <span style={styles.activeIcon}>📊</span>
          <h2 style={styles.sectionTitleText}>Active Investment</h2>
          <span style={styles.line}></span>
        </div>

        {/* ACTIVE INVESTMENT CARDS */}
        <section style={styles.activeGrid}>
          {plans.map((plan) => (
            <div
              key={plan.title}
              style={plan.type === "save" ? styles.saveCard : styles.oneCard}
            >
              <div>
                <div style={styles.cardHeaderIcon}>
                  {plan.type === "save" ? "🌱" : "🚀"}
                </div>
                <h3 style={styles.planTitle}>{plan.title}</h3>
                <span style={styles.planBadge}>{plan.subtitle}</span>

                <h2 style={styles.planHeading}>{plan.heading}</h2>
                <p style={styles.planDesc}>{plan.description}</p>
              </div>

              <button style={styles.actionBtn} onClick={plan.onClick}>
                <span>{plan.button}</span>
                <span style={styles.circleArrow}>›</span>
              </button>
            </div>
          ))}
        </section>

        {/* COMING SOON TITLE */}
        <div style={styles.sectionHeader}>
          <span style={styles.line}></span>
          <span style={styles.activeIcon}>🕒</span>
          <h2 style={styles.sectionTitleText}>Coming Soon</h2>
          <span style={styles.line}></span>
        </div>

        {/* COMING SOON CARDS */}
        <section style={styles.comingGrid}>
          {comingCards.map((item) => (
            <div key={item.title} style={styles.comingCard} onClick={comingSoon}>
              <span style={styles.pinkRibbon}>Coming Soon</span>
              <div style={styles.comingIconCircle}>
                {item.icon === "gold" ? "🪙" : item.icon === "silver" ? "🧱" : "🔄"}
              </div>
              <h4 style={styles.comingTitle}>{item.title}</h4>
              <p style={styles.comingDesc}>{item.text}</p>

              <div style={styles.comingBtnWrapper}>
                <button style={styles.comingPillBtn}>
                  🕒 Coming Soon
                </button>
              </div>
            </div>
          ))}
        </section>

        {/* MOTIVATION BANNER */}
        <section style={styles.motivationBanner}>
          <span style={styles.trophy}>🏆</span>
          <div>
            <h3 style={styles.motivationHeading}>Discipline Today, Wealth Tomorrow.</h3>
            <p style={styles.motivationSub}>Small steps now, big freedom later.</p>
          </div>
          <span style={styles.bannerArrow}>›</span>
        </section>

        {/* BOTTOM STATS */}
        <section style={styles.bottomStats}>
          <div style={styles.statBox}>
            <div style={{ ...styles.statIcon, background: "#10b981" }}>📈</div>
            <div>
              <p style={styles.statLabel}>Total Invested</p>
              <p style={styles.statValue}>{money(summary.totalInvestment)}</p>
            </div>
          </div>

          <div style={styles.statBox}>
            <div style={{ ...styles.statIcon, background: "#3b82f6" }}>₹</div>
            <div>
              <p style={styles.statLabel}>Total Return</p>
              <p style={styles.statValue}>{money(summary.totalReturn)}</p>
            </div>
          </div>

          <div style={styles.statBox}>
            <div style={{ ...styles.statIcon, background: "#8b5cf6" }}>%</div>
            <div>
              <p style={styles.statLabel}>Return Rate</p>
              <p style={styles.statValue}>{summary.returnRate}%</p>
            </div>
          </div>
        </section>

      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    background: "#f0f4f9", // Light clean background like 1st image
    padding: "12px",
    fontFamily: "'Segoe UI', Roboto, Helvetica, Arial, sans-serif"
  },

  appWrap: {
    width: "100%",
    maxWidth: "480px",
    margin: "0 auto"
  },

  loadingPage: {
    minHeight: "100vh",
    background: "#f0f4f9",
    display: "flex",
    justifyContent: "center",
    alignItems: "center"
  },

  loadingCard: {
    background: "#ffffff",
    padding: "24px",
    borderRadius: "20px",
    textAlign: "center"
  },

  /* HERO CARD */
  heroCard: {
    borderRadius: "24px",
    background: "linear-gradient(135deg, #2563eb, #7c3aed, #ec4899)", // Vibrant gradient as image 1
    padding: "20px",
    color: "#ffffff",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    boxShadow: "0 10px 25px rgba(37, 99, 235, 0.2)"
  },

  heroLeft: {
    flex: 1
  },

  heroLabelRow: {
    display: "flex",
    alignItems: "center",
    gap: "6px"
  },

  heroLabel: {
    margin: 0,
    fontSize: "15px",
    fontWeight: "600",
    opacity: 0.95
  },

  crownBadge: {
    fontSize: "14px",
    background: "rgba(255, 255, 255, 0.2)",
    borderRadius: "50%",
    padding: "2px 4px"
  },

  heroAmount: {
    margin: "6px 0",
    fontSize: "26px",
    fontWeight: "800",
    display: "flex",
    alignItems: "center",
    gap: "8px"
  },

  eyeBtn: {
    background: "none",
    border: "none",
    color: "#ffffff",
    fontSize: "20px",
    cursor: "pointer",
    padding: 0
  },

  heroGainRow: {
    marginTop: "4px"
  },

  greenTag: {
    background: "rgba(16, 185, 129, 0.25)",
    color: "#a7f3d0",
    padding: "3px 8px",
    borderRadius: "12px",
    fontSize: "13px",
    fontWeight: "700"
  },

  heroSub: {
    marginTop: "6px",
    fontSize: "12px",
    opacity: 0.8,
    margin: "4px 0 0 0"
  },

  heroRight: {
    width: "90px",
    display: "flex",
    justifyContent: "center"
  },

  piggyContainer: {
    position: "relative"
  },

  piggyCoin: {
    position: "absolute",
    top: "-10px",
    right: "15px",
    background: "#facc15",
    color: "#854d0e",
    borderRadius: "50%",
    width: "22px",
    height: "22px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: "bold",
    fontSize: "12px",
    border: "2px solid #ffffff"
  },

  piggyIllustration: {
    fontSize: "60px"
  },

  /* QUICK ACTIONS */
  quickPanel: {
    background: "#ffffff",
    borderRadius: "18px",
    padding: "12px 16px",
    margin: "14px 0",
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "12px",
    boxShadow: "0 4px 15px rgba(0,0,0,0.03)"
  },

  quickAction: {
    background: "#none",
    border: "none",
    display: "flex",
    alignItems: "center",
    gap: "10px",
    cursor: "pointer",
    textAlign: "left",
    padding: "4px"
  },

  quickIconPurple: {
    width: "38px",
    height: "38px",
    borderRadius: "12px",
    background: "#8b5cf6",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#ffffff",
    fontSize: "18px"
  },

  quickIconGreen: {
    width: "38px",
    height: "38px",
    borderRadius: "12px",
    background: "#10b981",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#ffffff",
    fontSize: "18px"
  },

  quickTitle: {
    margin: 0,
    fontSize: "14px",
    fontWeight: "700",
    color: "#0f172a"
  },

  quickSub: {
    margin: 0,
    fontSize: "11px",
    color: "#64748b"
  },

  arrowRight: {
    marginLeft: "auto",
    color: "#94a3b8",
    fontSize: "18px"
  },

  /* SECTION HEADERS */
  sectionHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",
    margin: "18px 0 12px 0"
  },

  line: {
    flex: 1,
    height: "1px",
    background: "#cbd5e1"
  },

  activeIcon: {
    fontSize: "16px"
  },

  sectionTitleText: {
    fontSize: "16px",
    fontWeight: "800",
    color: "#0f172a",
    margin: 0
  },

  /* ACTIVE INVESTMENT CARDS */
  activeGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "12px"
  },

  saveCard: {
    background: "linear-gradient(180deg, #10b981, #047857)",
    borderRadius: "20px",
    padding: "16px",
    color: "#ffffff",
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
    minHeight: "240px"
  },

  oneCard: {
    background: "linear-gradient(180deg, #3b82f6, #1d4ed8)",
    borderRadius: "20px",
    padding: "16px",
    color: "#ffffff",
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
    minHeight: "240px"
  },

  cardHeaderIcon: {
    width: "42px",
    height: "42px",
    background: "rgba(255,255,255,0.2)",
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "20px",
    marginBottom: "8px"
  },

  planTitle: {
    margin: 0,
    fontSize: "15px",
    fontWeight: "800",
    letterSpacing: "0.5px"
  },

  planBadge: {
    display: "inline-block",
    background: "#fef08a",
    color: "#854d0e",
    fontSize: "10px",
    fontWeight: "800",
    padding: "2px 8px",
    borderRadius: "10px",
    marginTop: "4px"
  },

  planHeading: {
    fontSize: "15px",
    fontWeight: "800",
    marginTop: "12px",
    marginBottom: "4px",
    lineHeight: "1.2"
  },

  planDesc: {
    fontSize: "11px",
    opacity: 0.9,
    margin: 0,
    lineHeight: "1.3"
  },

  actionBtn: {
    background: "#0f172a",
    color: "#ffffff",
    border: "none",
    borderRadius: "20px",
    padding: "8px 12px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    fontWeight: "700",
    fontSize: "12px",
    cursor: "pointer",
    marginTop: "12px"
  },

  circleArrow: {
    background: "rgba(255,255,255,0.2)",
    borderRadius: "50%",
    width: "18px",
    height: "18px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "12px"
  },

  /* COMING SOON CARDS */
  comingGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr 1fr",
    gap: "8px"
  },

  comingCard: {
    background: "#ffffff",
    borderRadius: "16px",
    padding: "12px 8px",
    position: "relative",
    border: "1px solid #e2e8f0",
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
    minHeight: "180px",
    boxShadow: "0 2px 8px rgba(0,0,0,0.02)"
  },

  pinkRibbon: {
    position: "absolute",
    top: 0,
    left: "50%",
    transform: "translateX(-50%)",
    background: "#ec4899",
    color: "#ffffff",
    fontSize: "8px",
    fontWeight: "800",
    padding: "2px 6px",
    borderRadius: "0 0 6px 6px",
    whiteSpace: "nowrap"
  },

  comingIconCircle: {
    width: "36px",
    height: "36px",
    background: "#f1f5f9",
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "18px",
    margin: "16px auto 6px auto"
  },

  comingTitle: {
    margin: "0 0 4px 0",
    fontSize: "11px",
    fontWeight: "800",
    color: "#1e293b",
    textAlign: "center"
  },

  comingDesc: {
    margin: 0,
    fontSize: "9px",
    color: "#64748b",
    textAlign: "center",
    lineHeight: "1.2"
  },

  comingBtnWrapper: {
    marginTop: "8px",
    textAlign: "center"
  },

  comingPillBtn: {
    background: "#cbd5e1",
    color: "#334155",
    border: "none",
    borderRadius: "12px",
    padding: "4px 8px",
    fontSize: "9px",
    fontWeight: "700",
    width: "100%"
  },

  /* MOTIVATION BANNER */
  motivationBanner: {
    background: "linear-gradient(90deg, #1e1b4b, #312e81)",
    borderRadius: "16px",
    padding: "12px 16px",
    color: "#ffffff",
    display: "flex",
    alignItems: "center",
    gap: "12px",
    marginTop: "16px"
  },

  trophy: {
    fontSize: "24px"
  },

  motivationHeading: {
    margin: 0,
    fontSize: "13px",
    fontWeight: "700"
  },

  motivationSub: {
    margin: 0,
    fontSize: "11px",
    opacity: 0.8
  },

  bannerArrow: {
    marginLeft: "auto",
    fontSize: "18px",
    opacity: 0.8
  },

  /* BOTTOM STATS */
  bottomStats: {
    background: "#ffffff",
    borderRadius: "16px",
    padding: "12px",
    marginTop: "12px",
    display: "grid",
    gridTemplateColumns: "1fr 1fr 1fr",
    gap: "8px",
    boxShadow: "0 2px 10px rgba(0,0,0,0.03)"
  },

  statBox: {
    display: "flex",
    alignItems: "center",
    gap: "6px"
  },

  statIcon: {
    width: "28px",
    height: "28px",
    borderRadius: "8px",
    color: "#ffffff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "12px",
    fontWeight: "bold"
  },

  statLabel: {
    margin: 0,
    fontSize: "9px",
    color: "#64748b"
  },

  statValue: {
    margin: 0,
    fontSize: "11px",
    fontWeight: "800",
    color: "#0f172a"
  }
};
