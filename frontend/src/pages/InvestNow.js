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
    returnRate: 0,
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
          returnRate: Number(data.returnRate || 0),
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

  const statCards = [
    {
      title: "Total Invested",
      value: money(summary.totalInvestment),
      icon: "trend",
      color: "#10b981"
    },
    {
      title: "Total Return",
      value: money(summary.totalReturn),
      icon: "return",
      color: "#3b82f6"
    },
    {
      title: "Return Rate",
      value: `${summary.returnRate}%`,
      icon: "percent",
      color: "#8b5cf6"
    },
    {
      title: "Active Plan",
      value: summary.activePlan,
      icon: "calendar",
      color: "#f59e0b"
    }
  ];

  if (loading) {
    return (
      <div style={styles.loadingPage}>
        <div style={styles.loadingCard}>
          <div style={styles.loadingPiggy}>
            <PiggyArt small />
          </div>

          <h2 style={{ color: "#ffffff", margin: "10px 0 5px 0" }}>Loading Investment</h2>
          <p style={{ color: "#9ca3af", margin: 0 }}>Please wait...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.page}>
      <div style={styles.appWrap}>

        {/* HERO */}
        <section style={styles.heroCard}>
          <HeroNetwork />

          <div style={styles.heroLeft}>
            <div style={styles.heroLabelRow}>
              <p style={styles.heroLabel}>Total Investment Value</p>
              <button
                style={styles.eyeBtn}
                onClick={() => setShowInvestment(!showInvestment)}
              >
                {showInvestment ? "👁" : "🙈"}
              </button>
            </div>

            <h1 style={styles.heroAmount}>
              {showMoney(summary.totalInvestment)}
            </h1>

            <p style={styles.heroGain}>
              +{showInvestment ? money(summary.monthlyInvestment) : "₹ •••••"}{" "}
              <span style={{ color: "#a7f3d0", fontSize: "14px" }}>
                (▲ {summary.returnRate}%)
              </span>
            </p>

            <p style={styles.heroSub}>This Month Added</p>
          </div>

          <div style={styles.heroRight}>
            <PiggyArt />
          </div>
        </section>

        {/* QUICK ACTIONS */}
        <section style={styles.quickPanel}>
          <QuickAction
            icon="wallet"
            title="Add Money"
            subtitle="Top up balance"
            color="purple"
            onClick={() => navigate("/wallet")}
          />

          <div style={styles.quickDivider}></div>

          <QuickAction
            icon="paper"
            title="My Investments"
            subtitle="View all plans"
            color="green"
            onClick={() => navigate("/my-investment")}
          />
        </section>

        <SectionTitle title="Active Investment" />

        {/* ACTIVE INVESTMENT */}
        <section style={styles.activeGrid}>
          {plans.map((plan) => (
            <PlanCard key={plan.title} plan={plan} />
          ))}
        </section>

        <SectionTitle title="Coming Soon 🕒" />

        {/* COMING SOON */}
        <section style={styles.comingGrid}>
          {comingCards.map((item) => (
            <ComingCard key={item.title} item={item} onClick={comingSoon} />
          ))}
        </section>

        {/* MOTIVATION */}
        <section style={styles.motivationCard}>
          <div style={styles.trophyIcon}>🏆</div>
          <div style={styles.motivationText}>
            <h2 style={{ margin: "0 0 5px 0", fontSize: "18px", fontWeight: "bold" }}>
              Discipline Today, Wealth Tomorrow.
            </h2>
            <p style={{ margin: 0, opacity: 0.8, fontSize: "13px" }}>
              Small steps now, big freedom later.
            </p>
          </div>
        </section>

        {/* STATS */}
        <section style={styles.statsPanel}>
          {statCards.map((stat) => (
            <MiniStat key={stat.title} stat={stat} />
          ))}
        </section>

      </div>
    </div>
  );
}

function HeroNetwork() {
  return (
    <div style={styles.networkLayer}>
      <span style={styles.netDotA}></span>
      <span style={styles.netDotB}></span>
      <span style={styles.netCircleA}></span>
    </div>
  );
}

function PiggyArt({ small }) {
  return (
    <div style={small ? styles.piggySmallStage : styles.piggyStage}>
      <div style={styles.pigCoin}>₹</div>
      <div style={small ? styles.pigBodySmall : styles.pigBody}>
        <span style={styles.pigEarLeft}></span>
        <span style={styles.pigEarRight}></span>
        <span style={styles.pigEyeLeft}></span>
        <span style={styles.pigEyeRight}></span>
        <span style={styles.pigNose}>••</span>
        <span style={styles.pigLegLeft}></span>
        <span style={styles.pigLegRight}></span>
        <span style={styles.pigTail}>↺</span>
      </div>
    </div>
  );
}

function QuickAction({ icon, title, subtitle, color, onClick }) {
  const iconStyle =
    color === "purple" ? styles.quickIconPurple : styles.quickIconGreen;

  return (
    <button style={styles.quickAction} onClick={onClick}>
      <div style={iconStyle}>{icon === "wallet" ? "💳" : "📋"}</div>
      <div>
        <h3 style={{ margin: "0 0 2px 0", fontSize: "15px", color: "#ffffff", fontWeight: "bold" }}>{title}</h3>
        <p style={{ margin: 0, fontSize: "12px", color: "#9ca3af" }}>{subtitle}</p>
      </div>
    </button>
  );
}

function SectionTitle({ title }) {
  return (
    <div style={styles.sectionTitle}>
      <div style={styles.sectionLineLeft}></div>
      <h2 style={{ color: "#ffffff", margin: 0, fontSize: "18px", fontWeight: "bold" }}>{title}</h2>
      <div style={styles.sectionLineRight}></div>
    </div>
  );
}

function PlanCard({ plan }) {
  const isSave = plan.type === "save";

  return (
    <div style={isSave ? styles.savePlanCard : styles.onePlanCard}>
      <div style={styles.planGlow}></div>

      <div style={styles.planTop}>
        <div style={styles.planImageCircle}>
          {plan.icon === "plant" ? (
            <div style={styles.plantArt}>
              <span style={styles.plantStem}></span>
              <span style={styles.plantLeafLeft}></span>
              <span style={styles.plantLeafRight}></span>
              <span style={styles.plantPot}></span>
              <span style={styles.plantCoin}>₹</span>
            </div>
          ) : (
            <div style={styles.rocketArt}>
              <span style={styles.rocketBody}></span>
              <span style={styles.rocketWindow}></span>
              <span style={styles.rocketFinLeft}></span>
              <span style={styles.rocketFinRight}></span>
              <span style={styles.rocketFire}></span>
            </div>
          )}
        </div>

        <div style={styles.planHeadingBox}>
          <h1 style={{ margin: 0, fontSize: "16px", fontWeight: "bold", color: "#ffffff" }}>{plan.title}</h1>
          <span style={styles.planSubtitleYellow}>{plan.subtitle}</span>
        </div>
      </div>

      <div style={styles.planContent}>
        <h2 style={styles.planContent_h2}>{plan.heading}</h2>
        <p style={styles.planContent_p}>{plan.description}</p>
      </div>

      <button
        style={{
          ...styles.planButton,
          color: isSave ? "#059669" : "#2563eb",
          background: "#1f2937"
        }}
        onClick={plan.onClick}
      >
        <span style={{ color: "#ffffff" }}>{plan.button}</span>
        <b
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: "24px",
            height: "24px",
            borderRadius: "50%",
            color: "#ffffff",
            background: isSave
              ? "linear-gradient(135deg,#10b981,#059669)"
              : "linear-gradient(135deg,#3b82f6,#2563eb)"
          }}
        >
          ›
        </b>
      </button>
    </div>
  );
}

function ComingCard({ item, onClick }) {
  const cardStyle =
    item.theme === "gold"
      ? styles.comingGold
      : item.theme === "silver"
      ? styles.comingSilver
      : styles.comingRd;

  return (
    <button style={{ ...styles.comingCard, ...cardStyle }} onClick={onClick}>
      <div style={styles.comingRibbon}>Coming Soon</div>

      <div style={styles.comingIconCircle}>
        {item.icon === "gold" && <GoldIcon />}
        {item.icon === "silver" && <SilverIcon />}
        {item.icon === "piggy" && <MiniPiggy />}
      </div>

      <h3 style={{ margin: "10px 0 4px 0", fontSize: "15px", color: "#ffffff", fontWeight: "bold" }}>{item.title}</h3>
      <p style={{ margin: "0 0 35px 0", fontSize: "12px", color: "#9ca3af", lineHeight: "1.3" }}>{item.text}</p>

      <div style={styles.comingButton}>🕒 Coming Soon</div>
    </button>
  );
}

function GoldIcon() {
  return (
    <div style={styles.goldIcon}>
      <span>₹</span>
    </div>
  );
}

function SilverIcon() {
  return (
    <div style={styles.silverIcon}>
      <span>₹</span>
    </div>
  );
}

function MiniPiggy() {
  return (
    <div style={styles.miniPiggy}>
      <div style={styles.miniPigBody}>
        <span style={styles.miniPigEye}></span>
        <span style={styles.miniPigNose}>•</span>
      </div>
    </div>
  );
}

function MiniStat({ stat }) {
  return (
    <div style={styles.miniStat}>
      <div style={{ ...styles.miniIcon, background: stat.color }}>
        {stat.icon === "trend" && "↗"}
        {stat.icon === "return" && "₹"}
        {stat.icon === "percent" && "%"}
        {stat.icon === "calendar" && "▣"}
      </div>

      <div>
        <p style={{ margin: "0 0 2px 0", fontSize: "11px", color: "#9ca3af" }}>{stat.title}</p>
        <h3 style={{ margin: 0, fontSize: "14px", color: "#ffffff", fontWeight: "bold" }}>{stat.value}</h3>
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    background: "linear-gradient(180deg, #0f172a, #020617)",
    padding: "12px",
    fontFamily: "Arial, sans-serif",
    color: "#f8fafc"
  },

  appWrap: {
    width: "100%",
    maxWidth: "480px",
    margin: "0 auto"
  },

  loadingPage: {
    minHeight: "100vh",
    background: "#0f172a",
    display: "flex",
    justifyContent: "center",
    alignItems: "center"
  },

  loadingCard: {
    background: "#1e293b",
    padding: "24px",
    borderRadius: "20px",
    textAlign: "center",
    boxShadow: "0 18px 45px rgba(0,0,0,.4)"
  },

  loadingPiggy: {
    display: "flex",
    justifyContent: "center",
    marginBottom: "12px"
  },

  heroCard: {
    borderRadius: "24px",
    background: "linear-gradient(135deg,#31108f,#5b21b6,#db2777)",
    position: "relative",
    overflow: "hidden",
    padding: "20px",
    color: "white",
    boxShadow: "0 15px 30px rgba(0,0,0,.4)",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center"
  },

  networkLayer: {
    position: "absolute",
    inset: 0,
    opacity: 0.2
  },

  netDotA: {
    position: "absolute",
    top: "20px",
    right: "100px",
    width: "8px",
    height: "8px",
    borderRadius: "50%",
    background: "white"
  },

  netDotB: {
    position: "absolute",
    bottom: "20px",
    left: "40px",
    width: "10px",
    height: "10px",
    borderRadius: "50%",
    background: "#facc15"
  },

  netCircleA: {
    position: "absolute",
    right: "-20px",
    top: "-20px",
    width: "120px",
    height: "120px",
    border: "1px solid rgba(255,255,255,0.2)",
    borderRadius: "50%"
  },

  heroLeft: {
    position: "relative",
    zIndex: 5,
    flex: 1
  },

  heroLabelRow: {
    display: "flex",
    alignItems: "center",
    gap: "8px"
  },

  heroLabel: {
    margin: 0,
    fontSize: "14px",
    opacity: 0.9,
    fontWeight: "600"
  },

  heroAmount: {
    margin: "8px 0 4px",
    fontSize: "28px",
    fontWeight: "900",
    letterSpacing: "0.5px"
  },

  heroGain: {
    margin: 0,
    color: "#34d399",
    fontSize: "15px",
    fontWeight: "700"
  },

  heroSub: {
    marginTop: "4px",
    fontSize: "12px",
    opacity: 0.8
  },

  heroRight: {
    position: "relative",
    zIndex: 5,
    width: "90px",
    display: "flex",
    justifyContent: "center"
  },

  piggyStage: {
    position: "relative",
    width: "85px",
    height: "70px"
  },

  piggySmallStage: {
    position: "relative",
    width: "85px",
    height: "70px",
    margin: "0 auto"
  },

  pigCoin: {
    position: "absolute",
    top: "-6px",
    left: "30px",
    width: "24px",
    height: "24px",
    borderRadius: "50%",
    background: "linear-gradient(135deg,#fde047,#f59e0b)",
    color: "#92400e",
    border: "2px solid #fef3c7",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    fontWeight: "900",
    fontSize: "13px",
    zIndex: 8
  },

  pigBody: {
    position: "absolute",
    bottom: 0,
    left: 0,
    width: "80px",
    height: "52px",
    background: "linear-gradient(135deg,#ffb3c6,#f43f5e)",
    borderRadius: "35px 38px 28px 28px",
    boxShadow: "inset -5px -4px 0 rgba(0,0,0,.2)"
  },

  pigBodySmall: {
    position: "absolute",
    bottom: 0,
    left: 0,
    width: "80px",
    height: "52px",
    background: "linear-gradient(135deg,#ffb3c6,#f43f5e)",
    borderRadius: "35px 38px 28px 28px",
    boxShadow: "inset -5px -4px 0 rgba(0,0,0,.2)"
  },

  pigEarLeft: {
    position: "absolute",
    top: "-10px",
    left: "15px",
    width: "18px",
    height: "18px",
    background: "#ff758f",
    borderRadius: "6px 14px 6px 14px",
    transform: "rotate(28deg)"
  },

  pigEarRight: {
    position: "absolute",
    top: "-8px",
    right: "14px",
    width: "15px",
    height: "15px",
    background: "#ff758f",
    borderRadius: "6px 12px 6px 12px",
    transform: "rotate(45deg)"
  },

  pigEyeLeft: {
    position: "absolute",
    top: "16px",
    left: "45px",
    width: "4px",
    height: "4px",
    background: "#111827",
    borderRadius: "50%"
  },

  pigEyeRight: {
    position: "absolute",
    top: "16px",
    left: "58px",
    width: "4px",
    height: "4px",
    background: "#111827",
    borderRadius: "50%"
  },

  pigNose: {
    position: "absolute",
    right: "-5px",
    top: "22px",
    width: "22px",
    height: "16px",
    background: "#f43f5e",
    borderRadius: "50%",
    color: "#7f1d1d",
    fontSize: "7px",
    display: "flex",
    justifyContent: "center",
    alignItems: "center"
  },

  pigLegLeft: {
    position: "absolute",
    bottom: "-4px",
    left: "20px",
    width: "12px",
    height: "10px",
    background: "#f43f5e",
    borderRadius: "0 0 5px 5px"
  },

  pigLegRight: {
    position: "absolute",
    bottom: "-4px",
    right: "20px",
    width: "12px",
    height: "10px",
    background: "#f43f5e",
    borderRadius: "0 0 5px 5px"
  },

  pigTail: {
    position: "absolute",
    left: "-8px",
    top: "20px",
    color: "#f43f5e",
    fontSize: "14px",
    fontWeight: "900"
  },

  quickPanel: {
    padding: "16px",
    background: "#1e293b",
    borderRadius: "20px",
    margin: "14px 0",
    display: "grid",
    gridTemplateColumns: "1fr 1px 1fr",
    alignItems: "center",
    gap: "10px",
    boxShadow: "0 8px 20px rgba(0,0,0,.2)"
  },

  quickDivider: {
    height: "36px",
    background: "#334155"
  },

  quickAction: {
    border: "none",
    background: "transparent",
    display: "flex",
    alignItems: "center",
    gap: "10px",
    color: "#ffffff",
    textAlign: "left",
    cursor: "pointer",
    padding: 0
  },

  quickIconPurple: {
    width: 40,
    height: 40,
    borderRadius: "12px",
    background: "linear-gradient(135deg,#6d28d9,#8b5cf6)",
    color: "white",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 18
  },

  quickIconGreen: {
    width: 40,
    height: 40,
    borderRadius: "12px",
    background: "linear-gradient(135deg,#059669,#10b981)",
    color: "white",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 18
  },

  sectionTitle: {
    margin: "20px 0 14px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "12px"
  },

  sectionLineLeft: {
    flex: 1,
    height: "2px",
    borderRadius: "10px",
    background: "linear-gradient(90deg,transparent,#6d28d9)"
  },

  sectionLineRight: {
    flex: 1,
    height: "2px",
    borderRadius: "10px",
    background: "linear-gradient(90deg,#6d28d9,transparent)"
  },

  activeGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
    gap: "12px"
  },

  savePlanCard: {
    background: "linear-gradient(135deg,#065f46,#047857)",
    borderRadius: "20px",
    padding: "16px",
    position: "relative",
    overflow: "hidden",
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
    minHeight: "220px"
  },

  onePlanCard: {
    background: "linear-gradient(135deg,#1e3a8a,#1d4ed8)",
    borderRadius: "20px",
    padding: "16px",
    position: "relative",
    overflow: "hidden",
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
    minHeight: "220px"
  },

  planGlow: {
    position: "absolute",
    right: "-30px",
    top: "-30px",
    width: "100px",
    height: "100px",
    background: "rgba(255,255,255,.08)",
    borderRadius: "50%"
  },

  planTop: {
    position: "relative",
    zIndex: 2,
    display: "flex",
    flexDirection: "column",
    gap: "8px"
  },

  planImageCircle: {
    width: "60px",
    height: "60px",
    borderRadius: "50%",
    background: "#1f2937",
    display: "flex",
    alignItems: "center",
    justifyContent: "center"
  },

  planHeadingBox: {
    textAlign: "left",
    color: "white"
  },

  plantArt: {
    position: "relative",
    width: "40px",
    height: "40px"
  },

  plantStem: {
    position: "absolute",
    left: "19px",
    top: "10px",
    width: "3px",
    height: "18px",
    background: "#059669"
  },

  plantLeafLeft: {
    position: "absolute",
    left: "8px",
    top: "12px",
    width: "14px",
    height: "9px",
    background: "#10b981",
    borderRadius: "100% 0 100% 0",
    transform: "rotate(-20deg)"
  },

  plantLeafRight: {
    position: "absolute",
    right: "6px",
    top: "8px",
    width: "15px",
    height: "10px",
    background: "#34d399",
    borderRadius: "0 100% 0 100%",
    transform: "rotate(20deg)"
  },

  plantPot: {
    position: "absolute",
    bottom: "4px",
    left: "11px",
    width: "19px",
    height: "12px",
    background: "#ea580c",
    borderRadius: "0 0 6px 6px"
  },

  plantCoin: {
    position: "absolute",
    right: "0px",
    bottom: "3px",
    width: "14px",
    height: "14px",
    borderRadius: "50%",
    background: "#facc15",
    color: "#92400e",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    fontWeight: "900",
    fontSize: "9px"
  },

  rocketArt: {
    position: "relative",
    width: "40px",
    height: "40px"
  },

  rocketBody: {
    position: "absolute",
    left: "14px",
    top: "4px",
    width: "14px",
    height: "26px",
    background: "linear-gradient(180deg,#f0f9ff,#7dd3fc)",
    borderRadius: "50% 50% 8px 8px",
    transform: "rotate(25deg)"
  },

  rocketWindow: {
    position: "absolute",
    left: "20px",
    top: "12px",
    width: "6px",
    height: "6px",
    background: "#1d4ed8",
    borderRadius: "50%"
  },

  rocketFinLeft: {
    position: "absolute",
    left: "10px",
    bottom: "10px",
    width: "8px",
    height: "8px",
    background: "#dc2626",
    clipPath: "polygon(100% 0,0 100%,100% 100%)"
  },

  rocketFinRight: {
    position: "absolute",
    right: "8px",
    bottom: "8px",
    width: "8px",
    height: "8px",
    background: "#dc2626",
    clipPath: "polygon(0 0,0 100%,100% 100%)"
  },

  rocketFire: {
    position: "absolute",
    left: "8px",
    bottom: "2px",
    width: "14px",
    height: "14px",
    background: "linear-gradient(180deg,#facc15,#ea580c)",
    borderRadius: "50% 50% 50% 0",
    transform: "rotate(30deg)"
  },

  planContent: {
    position: "relative",
    zIndex: 2,
    color: "white",
    margin: "10px 0"
  },

  planContent_h2: {
    margin: "0 0 6px 0",
    fontSize: "18px",
    lineHeight: "1.2",
    fontWeight: "800"
  },

  planContent_p: {
    margin: 0,
    fontSize: "12px",
    lineHeight: "1.3",
    opacity: 0.8
  },

  planButton: {
    width: "100%",
    height: "40px",
    border: "none",
    borderRadius: "12px",
    fontSize: "14px",
    fontWeight: "800",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "0 12px",
    cursor: "pointer",
    boxShadow: "0 4px 12px rgba(0,0,0,.2)"
  },

  comingGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))",
    gap: "10px"
  },

  comingCard: {
    border: "none",
    borderRadius: "18px",
    padding: "14px",
    position: "relative",
    textAlign: "left",
    boxShadow: "0 8px 20px rgba(0,0,0,.2)",
    overflow: "hidden",
    cursor: "pointer"
  },

  comingGold: {
    background: "linear-gradient(135deg,#2e2509,#1e1805)"
  },

  comingSilver: {
    background: "linear-gradient(135deg,#1e293b,#0f172a)"
  },

  comingRd: {
    background: "linear-gradient(135deg,#2d1510,#1c0d0a)"
  },

  comingRibbon: {
    position: "absolute",
    top: 0,
    left: 12,
    background: "linear-gradient(135deg,#7c3aed,#9f1239)",
    color: "white",
    padding: "4px 10px",
    borderBottomLeftRadius: 8,
    borderBottomRightRadius: 8,
    fontSize: "10px",
    fontWeight: "900"
  },

  comingIconCircle: {
    marginTop: "24px",
    width: "42px",
    height: "42px",
    borderRadius: "12px",
    background: "#334155",
    display: "flex",
    alignItems: "center",
    justifyContent: "center"
  },

  goldIcon: {
    width: "28px",
    height: "28px",
    borderRadius: "50%",
    background: "linear-gradient(135deg,#eab308,#ca8a04)",
    color: "#451a03",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: "900",
    fontSize: "14px"
  },

  silverIcon: {
    width: "28px",
    height: "28px",
    borderRadius: "50%",
    background: "linear-gradient(135deg,#94a3b8,#64748b)",
    color: "#0f172a",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: "900",
    fontSize: "14px"
  },

  miniPiggy: {
    position: "relative",
    width: "30px",
    height: "24px"
  },

  miniPigBody: {
    position: "absolute",
    bottom: 0,
    left: 0,
    width: "28px",
    height: "20px",
    borderRadius: "12px",
    background: "#e11d48"
  },

  miniPigEye: {
    position: "absolute",
    top: "5px",
    right: "8px",
    width: "3px",
    height: "3px",
    borderRadius: "50%",
    background: "#111827"
  },

  miniPigNose: {
    position: "absolute",
    right: "-4px",
    top: "7px",
    width: "10px",
    height: "8px",
    borderRadius: "50%",
    background: "#fda4af",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "6px"
  },

  comingButton: {
    marginTop: "10px",
    background: "rgba(124,58,237,.15)",
    borderRadius: "10px",
    padding: "6px",
    color: "#a78bfa",
    textAlign: "center",
    fontWeight: "800",
    fontSize: "11px"
  },

  motivationCard: {
    marginTop: "16px",
    borderRadius: "20px",
    background: "linear-gradient(135deg,#1e1b4b,#311042,#0f172a)",
    color: "white",
    display: "flex",
    alignItems: "center",
    gap: "12px",
    boxShadow: "0 10px 20px rgba(0,0,0,.3)",
    padding: "14px"
  },

  trophyIcon: {
    fontSize: "36px"
  },

  motivationText: {
    textAlign: "left"
  },

  statsPanel: {
    background: "#1e293b",
    marginTop: "16px",
    borderRadius: "20px",
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "10px",
    padding: "12px",
    boxShadow: "0 8px 20px rgba(0,0,0,.2)"
  },

  miniStat: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    background: "#0f172a",
    padding: "10px",
    borderRadius: "14px"
  },

  miniIcon: {
    width: "32px",
    height: "32px",
    borderRadius: "10px",
    color: "white",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: "900",
    fontSize: "14px"
  },

  eyeBtn: {
    border: "1px solid rgba(255,255,255,.4)",
    background: "rgba(255,255,255,.08)",
    color: "white",
    width: "32px",
    height: "24px",
    borderRadius: "8px",
    cursor: "pointer",
    fontSize: "12px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center"
  },

  planSubtitleYellow: {
    display: "inline-block",
    marginTop: "4px",
    background: "#eab308",
    color: "#0f172a",
    padding: "3px 8px",
    borderRadius: "8px",
    fontWeight: "800",
    fontSize: "11px"
  }
};
