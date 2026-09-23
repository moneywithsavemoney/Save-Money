import { useEffect, useMemo, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { toast } from "react-toastify";
import { API } from "../config";
import axios from "axios";

function formatDate(d) {
  if (!d) return "N/A";

  return new Date(d).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric"
  });
}

export default function MyInvestment() {
  const navigate = useNavigate();
  const location = useLocation();

  const email = localStorage.getItem("email") || "";
  const token = localStorage.getItem("token") || "";

  const [loading, setLoading] = useState(true);
  const [investments, setInvestments] = useState([]);

  const [statementOpen, setStatementOpen] = useState(false);
  const [renewOpen, setRenewOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);

  // Home.js থেকে সাইডবার ও ডাউনলোডের স্টেটসমূহ
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isDownloadingPlan, setIsDownloadingPlan] = useState(false);

  // স্বাইপ হ্যান্ডলার স্টেট
  const [touchStartX, setTouchStartX] = useState(0);
  const [touchStartY, setTouchStartY] = useState(0);

  // কাস্টম অ্যালার্ট ও ডিটেইলস মডালের জন্য ডাইনামিক স্টেট
  const [customAlert, setCustomAlert] = useState({ show: false, title: "", message: "", type: "info" });

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
          body: JSON.stringify({ email: email })
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

  const getDaysLeft = (renewDate) => {
    if (!renewDate) return 0;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const renew = new Date(renewDate);
    renew.setHours(0, 0, 0, 0);

    const diff = Math.ceil(
      (renew - today) / (1000 * 60 * 60 * 24)
    );

    return diff > 0 ? diff : 0;
  };

  const isOverdue = (renewDate) => {
    if (!renewDate) return false;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const renew = new Date(renewDate);
    renew.setHours(0, 0, 0, 0);

    return today > renew;
  };

  useEffect(() => {
    loadInvestments();
  }, []);

  const loadInvestments = async () => {
    try {
      setLoading(true);

      const res = await fetch(`${API}/my-investments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          authorization: token || ""
        },
        body: JSON.stringify({ email })
      });

      const data = await res.json();

      if (data?.success) {
        setInvestments(Array.isArray(data.investments) ? data.investments : []);
      } else {
        setInvestments([]);
      }
    } catch (err) {
      console.log("MY INVESTMENT ERROR:", err);
      setInvestments([]);
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

  const date = (d) => {
    if (!d) return "N/A";

    return new Date(d).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric"
    });
  };

  const renewDateText = () => {
    if (!selectedPlan?.renewDate && !selectedPlan?.nextRenewDate) return "N/A";

    return formatDate(
      selectedPlan.renewDate || selectedPlan.nextRenewDate
    );
  };

  const downloadSlip = (planId, historyId) => {
    window.open(`${API}/investment-slip/${planId}/${historyId}`, "_blank");
  };

  const summary = useMemo(() => {
    const totalInvestment = investments.reduce(
      (sum, item) => sum + Number(item.totalPlanAmount || item.amount || 0),
      0
    );

    const investedAmount = investments.reduce((sum, item) => {
      if (item.history && Array.isArray(item.history) && item.history.length > 0) {
        const historySum = item.history.reduce((hSum, h) => hSum + Number(h.amount || 0), 0);
        return sum + historySum;
      } else {
        return sum + Number(item.amount || 0);
      }
    }, 0);

    const totalReturn = investments.reduce(
      (sum, item) => sum + Number(item.totalReturn || item.maturityAmount || 0),
      0
    );

    const activeInvestments = investments.filter(
      (item) => String(item.status || "").toLowerCase() === "active"
    ).length;

    const averageReturnRate =
      investments.length > 0
        ? investments.reduce(
            (sum, item) => sum + Number(item.returnRate || item.interestRate || item.rate || 0),
            0
          ) / investments.length
        : 0;

    return {
      totalInvestment,
      investedAmount,
      totalReturn,
      activeInvestments,
      averageReturnRate
    };
  }, [investments]);

  const copyId = async (id) => {
    try {
      await navigator.clipboard.writeText(id);
      setCustomAlert({
        show: true,
        title: "Success",
        message: "Investment ID copied to clipboard!",
        type: "info"
      });
    } catch {
      toast.error("Copy failed");
    }
  };

  const viewDetails = (inv) => {
    const detailsContent = (
      <div style={{ textAlign: "left", marginTop: "10px" }}>
        <div style={styles.detailRow}><span>📋 Plan Name:</span> <b>{inv.planName || inv.plan || "Investment"}</b></div>
        <div style={styles.detailRow}><span>💰 Total Amount:</span> <b>{money(inv.totalPlanAmount || inv.amount)}</b></div>
        <div style={styles.detailRow}><span>🪙 Invested:</span> <b>{money(inv.amount)}</b></div>
        <div style={styles.detailRow}><span>⚡ Status:</span> <b style={{ color: "#16a34a" }}>{inv.status || "Active"}</b></div>
      </div>
    );

    setCustomAlert({
      show: true,
      title: "Investment Details",
      message: detailsContent,
      type: "details"
    });
  };

  const certificate = (inv) => {
    const id = inv?._id || inv?.investmentId;

    if (!id) {
      toast.error("Investment ID not found");
      return;
    }

    window.open(`${API}/investment-certificate/${id}`, "_blank");
  };

  const downloadStatement = (inv) => {
    setSelectedPlan(inv);
    setStatementOpen(true);
  };

  const renewNow = (inv) => {
    setSelectedPlan(inv);
    setRenewOpen(true);
  };

  if (loading) {
    return (
      <div style={styles.loading}>
        <div style={styles.loadingBox}>
          <h2>Loading My Investment...</h2>
          <p>Please wait</p>
        </div>
      </div>
    );
  }

  return (
    <div 
      style={styles.page}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* CSS Keyframe Style for Modal Animation */}
      <style>
        {`
          @keyframes modalScale {
            0% { transform: scale(0.8); opacity: 0; }
            100% { transform: scale(1); opacity: 1; }
          }
        `}
      </style>

      {/* SIDEBAR DRAWER */}
      <div style={{
        ...styles.drawerOverlay,
        opacity: isDrawerOpen ? 1 : 0,
        visibility: isDrawerOpen ? "visible" : "hidden"
      }} onClick={() => setIsDrawerOpen(false)}>
        <div style={{
          ...styles.drawerContainer,
          transform: isDrawerOpen ? "translateX(0)" : "translateX(-100%)"
        }} onClick={(e) => e.stopPropagation()}>
          
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

      <div style={styles.wrap}>
        {/* FIXED HEADER WITHOUT BACK BUTTON */}
        <div style={styles.header}>
          <button style={styles.menuBtn} onClick={() => setIsDrawerOpen(true)}>
            ☰
          </button>

          <div style={styles.headerTitle}>
            <h1 style={{ margin: 0, fontSize: "20px", fontWeight: "800", color: "#fff", lineHeight: "1.2" }}>My Investment</h1>
            <p style={{ margin: 0, fontSize: "11px", color: "rgba(255, 255, 255, 0.7)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>Track, manage & grow your wealth</p>
          </div>

          <div style={styles.rightTop}>
            <div style={styles.secureBadge}>🛡 100% Secure</div>
            <button style={styles.bellBtn} onClick={() => navigate("/notifications")}>
              🔔
            </button>
          </div>
        </div>

        {investments.length === 0 ? (
          <EmptyInvestment navigate={navigate} />
        ) : (
          <>
            <SummaryHero summary={summary} money={money} />

            {investments.map((inv, index) => {
              const currentCardInvestedAmount = inv.history && Array.isArray(inv.history) && inv.history.length > 0
                ? inv.history.reduce((hSum, h) => hSum + Number(h.amount || 0), 0)
                : Number(inv.amount || 0);

              return (
                <InvestmentCard
                  key={inv._id || inv.investmentId || index}
                  inv={inv}
                  money={money}
                  date={date}
                  copyId={copyId}
                  viewDetails={viewDetails}
                  certificate={certificate}
                  downloadStatement={downloadStatement}
                  renewNow={renewNow}
                  daysLeft={getDaysLeft(inv?.renewDate || inv?.nextRenewDate)}  
                  isOverdue={isOverdue}            
                  requiredInvestment={inv.totalPlanAmount || inv.amount}
                  investedAmount={currentCardInvestedAmount} 
                />
              );
            })}

            <BottomBanner />
          </>
        )}

      </div>

      {statementOpen && selectedPlan && (
        <div style={styles.modalOverlay}>
          <div style={{ ...styles.modalBox, animation: "modalScale 0.3s ease-out forwards" }}>
            <h2>Payment Statement</h2>
            <p style={{ fontSize: "13px", color: "#64748b" }}>Start SIP payment and all renew payments are listed below.</p>

            {(selectedPlan.history || []).length === 0 ? (
              <p style={{ margin: "20px 0" }}>No payment slip found</p>
            ) : (
              selectedPlan.history.map((h, i) => (
                <div key={i} style={styles.slipRow}>
                  <div>
                    <b>{i === 0 ? "Start SIP Payment" : "Renew Payment"}</b>
                    <p style={{ fontSize: "12px", color: "#64748b", margin: "2px 0" }}>{formatDate(h.date)}</p>
                    <h3 style={{ color: "#16a34a", fontWeight: "800", margin: 0 }}>
                      ₹ {Number(h.amount || 0).toLocaleString("en-IN")}
                    </h3>
                  </div>

                  <button
                    style={styles.greenBtn}
                    onClick={() =>
                      downloadSlip(selectedPlan._id || selectedPlan.investmentId, h._id)
                    }
                  >
                    Download Slip
                  </button>
                </div>
              ))
            )}

            <button style={styles.closeBtn} onClick={() => setStatementOpen(false)}>
              Close
            </button>
          </div>
        </div>
      )}

      {renewOpen && selectedPlan && (
        <div style={styles.modalOverlay}>
          <div style={{ ...styles.modalBox, animation: "modalScale 0.3s ease-out forwards" }}>
            <h2>Renew Information</h2>

            <p style={{ fontSize: "13px", color: "#64748b" }}>
              Your SIP renewal is due exactly after 30 days from your investment start date.
            </p>

            <h3 style={{ fontSize: "14px", marginTop: "12px" }}>Renew Due Date</h3>

            <h2 style={{ color: "#16a34a", margin: "4px 0" }}>
              {renewDateText()}
            </h2>

            <h3 style={{ fontSize: "14px", marginTop: "12px" }}>Days Left For Renew</h3>

            {isOverdue(selectedPlan?.renewDate || selectedPlan?.nextRenewDate) ? (
              <h1 style={{ color: "#ef4444", margin: "4px 0" }}>Overdue</h1>
            ) : (
              <h1 style={{ color: "#7c3aed", margin: "4px 0" }}>
                {getDaysLeft(selectedPlan?.renewDate || selectedPlan?.nextRenewDate)} Days
              </h1>
            )}

            <p style={{ fontSize: "12px", color: "#64748b", marginTop: "8px" }}>
              Please renew on or before your renew due date. If the renew date is missed,
              your investment status may become inactive and bonus / auto withdrawal benefits
              may be affected.
            </p>

            <button
              style={{ ...styles.greenBtn, width: "100%", marginTop: "14px", padding: "12px" }}
              onClick={async () => {
                try {
                  const res = await axios.post(
                    `${API}/renew-invest`,
                    {
                      investmentId: selectedPlan._id
                    }
                  );

                  setRenewOpen(false);

                  setCustomAlert({ 
                    show: true, 
                    title: "Notification", 
                    message: res.data.msg,
                    type: "info"
                  });

                  if (res.data.success) {
                    loadInvestments(); 
                  }

                } catch (err) {
                  toast.error(
                    err?.response?.data?.msg ||
                    "Renew failed"
                  );
                }
              }}
            >
              Renew Payment
            </button>

            <button style={styles.closeBtn} onClick={() => setRenewOpen(false)}>
              Close
            </button>
          </div>
        </div>
      )}

      {/* BEAUTIFUL CENTERED ANIMATED POPUP */}
      {customAlert.show && (
        <div style={{
          position: "fixed",
          inset: 0,
          background: "rgba(5, 8, 66, 0.6)",
          backdropFilter: "blur(10px)", 
          WebkitBackdropFilter: "blur(10px)",
          zIndex: 99999,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "20px"
        }}>
          
          <div style={{
            width: "100%",
            maxWidth: "360px",
            background: "linear-gradient(145deg, #ffffff, #f0f4ff)",
            borderRadius: "24px",
            padding: "24px 20px",
            color: "#071747",
            boxShadow: "0 20px 50px rgba(0,0,0,0.3)",
            textAlign: "center",
            border: "1px solid rgba(255, 255, 255, 0.8)",
            animation: "modalScale 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards"
          }}>
            <div style={{ 
              width: "60px", 
              height: "60px", 
              margin: "0 auto 12px", 
              borderRadius: "50%", 
              background: customAlert.type === "details" ? "#e0f2fe" : "#dcfce7", 
              display: "flex", 
              alignItems: "center", 
              justifyContent: "center", 
              fontSize: "30px" 
            }}>
              {customAlert.type === "details" ? "📊" : "ℹ️"}
            </div>
            
            <h2 style={{ fontSize: "20px", fontWeight: "800", marginBottom: "8px", color: "#071747" }}>
              {customAlert.title}
            </h2>
            
            <div style={{ fontSize: "14px", fontWeight: "600", color: "#475569", marginBottom: "20px", lineHeight: "1.5" }}>
              {customAlert.message}
            </div>
            
            <button 
              style={{ 
                width: "100%", 
                padding: "12px", 
                fontSize: "15px", 
                fontWeight: "800", 
                background: customAlert.type === "details" ? "linear-gradient(135deg, #0969ff, #0242a5)" : "linear-gradient(135deg, #16a34a, #0d652d)", 
                color: "white", 
                border: "none", 
                borderRadius: "14px", 
                cursor: "pointer",
                boxShadow: "0 4px 12px rgba(0,0,0,0.15)"
              }} 
              onClick={() => setCustomAlert({ show: false, title: "", message: "", type: "info" })}
            >
              Okay, Got it
            </button>

          </div>
        </div>
      )}

    </div>
  );
}

function EmptyInvestment({ navigate }) {
  return (
    <div style={styles.emptyBox}>
      <div style={styles.emptyIcon}>📭</div>
      <h1 style={{ fontSize: "20px", margin: "10px 0" }}>No any investment start</h1>
      <p style={{ color: "#64748b", fontSize: "14px" }}>You have not started any investment yet.</p>

      <button style={styles.emptyBtn} onClick={() => navigate("/invest-now")}>
        Start Investment
      </button>
    </div>
  );
}

function SummaryHero({ summary, money }) {
  return (
    <section style={styles.hero}>
      <div style={styles.heroGrid}>
        <HeroItem
          icon="💼"
          title="Required Investment"
          value={money(summary.totalInvestment)}
        />

        <HeroItem
          icon="💰"
          title="Invested Amount"
          value={money(summary.investedAmount || 0)}
        />

        <HeroItem
          icon="🌱"
          title="Total Return (All Time)"
          value={money(summary.totalReturn)}
          green />

        <HeroItem icon="📊" title="Average Return Rate" value={`${summary.averageReturnRate.toFixed(2)}%`} green />
        <HeroItem icon="💼" title="Active Investments" value={summary.activeInvestments} />
      </div>

      <div style={styles.heroBottom}>
        🚀 Invest Today, <b>Secure Tomorrow</b>, Enjoy Freedom Forever.
      </div>
    </section>
  );
}

function HeroItem({ icon, title, value, green }) {
  return (
    <div style={styles.heroItem}>
      <span style={{ fontSize: "22px" }}>{icon}</span>
      <div>
        <p style={{ margin: 0, fontSize: "11px", opacity: 0.8 }}>{title}</p>
        <h2 style={{ margin: 0, fontSize: "15px", color: green ? "#20e58d" : "white" }}>{value}</h2>
      </div>
    </div>
  );
}

function InvestmentCard({
  inv,
  money,
  date,
  copyId,
  viewDetails,
  certificate,
  downloadStatement,
  renewNow,
  daysLeft,
  isOverdue,
  requiredInvestment,
  investedAmount,
}) {
  const isSave =
    String(inv.planType || inv.type || inv.planName || "")
      .toLowerCase()
      .includes("save");

  const theme = isSave
    ? {
        color: "#16c784",
        soft: "#effdf6",
        title: inv.planName || "Save Money",
        sub: inv.planSub || "SIP Invest Plan",
        icon: "plant"
      }
    : {
        color: "#0969ff",
        soft: "#f1f6ff",
        title: inv.planName || "One Time Investment",
        sub: inv.planSub || "Upgrade Money",
        icon: "rocket"
      };

  const investmentId =
    inv.investmentId || inv._id || `${isSave ? "SM" : "OT"}000000`;

  const amount = inv.amount || inv.totalAmount || inv.investAmount || 0;
  const monthlyReturn = inv.monthlyReturn || inv.monthlyEmi || inv.emi || 0;
  const years = inv.years || inv.tenure || inv.duration || 0;
  const returnRate = inv.returnRate || inv.interestRate || inv.rate || 0;
  const status = inv.status || "Active";
  const totalReturn = inv.totalReturn || inv.returnAmount || 0;
  const maturityAmount = inv.maturityAmount || Number(amount) + Number(totalReturn);
  const progress = inv.progress || 0;

  return (
    <section style={styles.card}>
      <div style={styles.cardHeader}>
        <div style={styles.planLogo}>
          {theme.icon === "plant" ? <PlantIcon /> : <RocketIcon />}
        </div>

        <div style={styles.planTitleArea}>
          <h2 style={{ color: theme.color, fontSize: "16px", margin: 0 }}>
            {theme.title} <span style={{ fontSize: "12px", opacity: 0.8 }}>({theme.sub})</span>
          </h2>

          <div style={{ ...styles.activeBadge, color: theme.color, borderColor: theme.color }}>
            ✅ Active Investment
          </div>
        </div>

        <button style={styles.idBox} onClick={() => copyId(investmentId)}>
          <p style={{ margin: 0, fontSize: "10px", color: "#64748b" }}>Investment ID</p>
          <b style={{ fontSize: "12px" }}>{String(investmentId).slice(0, 10)}...</b>
        </button>
      </div>

      <div style={styles.detailsGrid}>
        <Info icon="💰" title="Required Investment" value={money(requiredInvestment || amount)} color={theme.color} />
        <Info icon="🪙" title="Invested Amount" value={money(investedAmount || monthlyReturn)} color={theme.color} />
        <Info icon="📅" title={isSave ? "EMI / Monthly Return" : "Monthly Return"} value={money(monthlyReturn)} color={theme.color} />
        <Info icon="⌛" title="Years / Tenure" value={`${years} Years`} color={theme.color} />
        <Info icon="🗓" title="Start Date" value={date(inv.startDate || inv.createdAt)} color="#8b5cf6" />
        <Info icon="📅" title="End Date" value={date(inv.endDate || inv.maturityDate)} color="#ec4899" />
        <Info icon="🔄" title="Renew Date" value={date(inv.renewDate || inv.endDate || inv.maturityDate)} color="#f59e0b" />
        <Info icon="%" title="Return Rate" value={`${returnRate}%`} color={theme.color} />
        <Info icon="🛡" title="Status" value={status} color={theme.color} />
        <Info icon="💵" title="Total Return" value={money(totalReturn)} color={theme.color} />
      </div>

      <div style={{ ...styles.progressBox, background: theme.soft }}>
        <div style={styles.progressTop}>
          <span style={{ color: theme.color, fontSize: "12px" }}>📈 Investment Growth</span>
          <b style={{ background: theme.color, color: "white", padding: "2px 8px", borderRadius: "10px", fontSize: "11px" }}>{progress}%</b>
        </div>

        <div style={styles.progressTrack}>
          <div style={{ ...styles.progressFill, width: `${progress}%`, background: theme.color }} />
        </div>

        <div style={styles.maturityBox}>
          <p style={{ margin: 0, fontSize: "11px", color: "#64748b" }}>Expected Maturity Amount</p>
          <h2 style={{ color: theme.color, margin: "2px 0", fontSize: "18px" }}>{money(maturityAmount)}</h2>
          <div style={styles.daysLeftBox}>
            {isOverdue(inv?.renewDate || inv?.nextRenewDate) ? (
              <>⚠️ Renew overdue — Inactive</>
            ) : (
              <>
                ⏳ Renew due: {new Date(inv?.renewDate || inv?.nextRenewDate).toLocaleDateString("en-GB")}
                {" — "}{daysLeft} Days Left
              </>
            )}
          </div>
        </div>
      </div>

      <div style={styles.actions}>
        <button style={styles.btnAction} onClick={() => viewDetails(inv)}>👁 View</button>
        <button style={styles.btnAction} onClick={() => certificate(inv)}>🏅 Certificate</button>
        <button style={styles.btnAction} onClick={() => downloadStatement(inv)}>⬇️ Statement</button>
        <button style={styles.renewBtn} onClick={() => renewNow(inv)}>🔄 Renew</button>
      </div>
    </section>
  );
}

function Info({ icon, title, value, color }) {
  return (
    <div style={styles.info}>
      <div style={{ ...styles.infoIcon, color }}>{icon}</div>
      <div>
        <p style={{ margin: 0, fontSize: "10px", color: "#64748b" }}>{title}</p>
        <h3 style={{ margin: 0, color, fontSize: "12px", fontWeight: "800" }}>{value}</h3>
      </div>
    </div>
  );
}

function PlantIcon() {
  return (
    <div style={styles.plantIcon}>
      <span style={styles.leafA}></span>
      <span style={styles.leafB}></span>
      <span style={styles.stem}></span>
      <span style={styles.pot}>₹</span>
    </div>
  );
}

function RocketIcon() {
  return (
    <div style={styles.rocketIcon}>
      <span style={styles.rocketBody}></span>
      <span style={styles.rocketWindow}></span>
      <span style={styles.rocketFire}></span>
    </div>
  );
}

function BottomBanner() {
  return (
    <section style={styles.bottomBanner}>
      <div style={styles.trophy}>🏆</div>

      <div style={styles.bottomText}>
        <h2 style={{ margin: 0, fontSize: "15px" }}>Great Choice!</h2>
        <p style={{ margin: "2px 0 0 0", fontSize: "12px", color: "#475569" }}>Building a secure financial future.</p>
      </div>
    </section>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    background: "linear-gradient(180deg,#050842 0%,#082a93 38%,#dbeafe 100%)",
    padding: "12px 12px 60px",
    fontFamily: "system-ui, -apple-system, sans-serif",
    color: "#101a3a"
  },

  wrap: {
    maxWidth: "800px",
    margin: "0 auto"
  },

  loading: {
    minHeight: "100vh",
    background: "#050842",
    color: "white",
    display: "flex",
    justifyContent: "center",
    alignItems: "center"
  },

  loadingBox: {
    background: "rgba(255,255,255,.12)",
    padding: "24px",
    borderRadius: "20px",
    textAlign: "center"
  },

  header: {
    height: "60px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "10px",
    color: "white",
    marginBottom: "10px"
  },

  menuBtn: {
    background: "transparent",
    border: "none",
    color: "white",
    fontSize: "24px",
    cursor: "pointer",
    padding: "4px"
  },

  headerTitle: {
    flex: 1,
    textAlign: "left",
    marginLeft: "4px"
  },

  rightTop: {
    display: "flex",
    alignItems: "center",
    gap: "8px"
  },

  secureBadge: {
    background: "rgba(255,255,255,.15)",
    borderRadius: "12px",
    padding: "6px 10px",
    fontWeight: "800",
    fontSize: "11px",
    whiteSpace: "nowrap"
  },

  bellBtn: {
    border: "none",
    background: "transparent",
    color: "white",
    fontSize: "20px",
    cursor: "pointer"
  },

  emptyBox: {
    marginTop: "30px",
    background: "white",
    borderRadius: "20px",
    padding: "30px 15px",
    textAlign: "center",
    boxShadow: "0 10px 25px rgba(15,23,42,.15)"
  },

  emptyIcon: {
    fontSize: "50px"
  },

  emptyBtn: {
    marginTop: "14px",
    border: "none",
    borderRadius: "12px",
    padding: "12px 20px",
    background: "linear-gradient(135deg,#16c784,#059669)",
    color: "white",
    fontWeight: "800",
    fontSize: "14px",
    cursor: "pointer"
  },

  hero: {
    background: "linear-gradient(135deg,#2e1065,#4615a8,#1e0b58)",
    borderRadius: "20px",
    padding: "16px",
    color: "white",
    border: "1px solid rgba(255,255,255,.16)",
    boxShadow: "0 10px 25px rgba(0,0,0,.25)"
  },

  heroGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(2, 1fr)",
    gap: "12px"
  },

  heroItem: {
    display: "flex",
    alignItems: "center",
    gap: "10px"
  },

  heroBottom: {
    marginTop: "12px",
    textAlign: "center",
    borderTop: "1px solid rgba(255,255,255,.15)",
    paddingTop: "10px",
    fontSize: "12px",
    opacity: 0.9
  },

  card: {
    background: "linear-gradient(180deg,#ffffff,#f8fbff)",
    borderRadius: "20px",
    padding: "16px",
    marginTop: "14px",
    boxShadow: "0 8px 20px rgba(15,23,42,.1)",
    border: "1px solid rgba(255,255,255,.85)"
  },

  cardHeader: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    marginBottom: "12px"
  },

  planLogo: {
    width: "50px",
    height: "50px",
    borderRadius: "50%",
    background: "#eefdf6",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0
  },

  planTitleArea: {
    flex: 1
  },

  activeBadge: {
    display: "inline-block",
    marginTop: "4px",
    padding: "2px 8px",
    borderRadius: "8px",
    border: "1px solid",
    fontWeight: "800",
    fontSize: "10px",
    background: "#f8fffb"
  },

  idBox: {
    border: "1px solid #dbe3ef",
    borderRadius: "10px",
    background: "#f9fbff",
    textAlign: "left",
    padding: "6px 8px",
    cursor: "pointer"
  },

  detailsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(2, 1fr)",
    border: "1px solid #e5eaf3",
    borderRadius: "14px",
    overflow: "hidden",
    background: "#ffffff"
  },

  info: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    padding: "10px",
    borderRight: "1px solid #e5eaf3",
    borderBottom: "1px solid #e5eaf3"
  },

  infoIcon: {
    width: "28px",
    height: "28px",
    borderRadius: "50%",
    background: "#f1f5f9",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "14px",
    flexShrink: 0
  },

  progressBox: {
    marginTop: "12px",
    borderRadius: "12px",
    padding: "10px"
  },

  progressTop: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center"
  },

  progressTrack: {
    marginTop: "6px",
    height: "8px",
    borderRadius: "10px",
    background: "#dbeafe",
    overflow: "hidden"
  },

  progressFill: {
    height: "100%",
    borderRadius: "10px"
  },

  maturityBox: {
    textAlign: "right",
    marginTop: "6px"
  },

  actions: {
    marginTop: "12px",
    display: "grid",
    gridTemplateColumns: "repeat(2, 1fr)",
    gap: "8px"
  },

  btnAction: {
    padding: "8px",
    borderRadius: "10px",
    border: "1px solid #cbd5e1",
    background: "#fff",
    fontSize: "12px",
    fontWeight: "700",
    cursor: "pointer"
  },

  renewBtn: {
    padding: "8px",
    borderRadius: "10px",
    border: "none",
    background: "linear-gradient(135deg,#7c3aed,#6d28d9)",
    color: "white",
    fontSize: "12px",
    fontWeight: "700",
    cursor: "pointer"
  },

  bottomBanner: {
    marginTop: "14px",
    background: "linear-gradient(135deg,#fff7df,#ffffff)",
    borderRadius: "16px",
    padding: "12px 16px",
    display: "flex",
    alignItems: "center",
    gap: "12px"
  },

  trophy: {
    fontSize: "36px"
  },

  bottomText: {
    flex: 1
  },

  plantIcon: {
    position: "relative",
    width: "40px",
    height: "40px"
  },

  leafA: {
    position: "absolute",
    width: "18px",
    height: "12px",
    background: "#22c55e",
    borderRadius: "100% 0 100% 0",
    top: "4px",
    left: "6px"
  },

  leafB: {
    position: "absolute",
    width: "18px",
    height: "12px",
    background: "#16a34a",
    borderRadius: "0 100% 0 100%",
    top: "4px",
    right: "6px"
  },

  stem: {
    position: "absolute",
    width: "4px",
    height: "18px",
    background: "#15803d",
    left: "18px",
    top: "14px",
    borderRadius: "10px"
  },

  pot: {
    position: "absolute",
    bottom: "2px",
    left: "10px",
    width: "20px",
    height: "14px",
    borderRadius: "0 0 8px 8px",
    background: "#f59e0b",
    color: "#fff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "10px",
    fontWeight: "900"
  },

  rocketIcon: {
    position: "relative",
    width: "40px",
    height: "40px"
  },

  rocketBody: {
    position: "absolute",
    width: "16px",
    height: "30px",
    borderRadius: "50% 50% 10px 10px",
    background: "linear-gradient(180deg,#bae6fd,#0284c7)",
    left: "12px",
    top: "2px",
    transform: "rotate(28deg)"
  },

  rocketWindow: {
    position: "absolute",
    width: "7px",
    height: "7px",
    borderRadius: "50%",
    background: "#1d4ed8",
    left: "20px",
    top: "12px"
  },

  rocketFire: {
    position: "absolute",
    width: "14px",
    height: "14px",
    background: "linear-gradient(180deg,#facc15,#f97316)",
    borderRadius: "50% 50% 50% 0",
    left: "4px",
    bottom: "4px",
    transform: "rotate(25deg)"
  },

  modalOverlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,.6)",
    backdropFilter: "blur(4px)",
    zIndex: 9999,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "16px"
  },

  modalBox: {
    width: "100%",
    maxWidth: "380px",
    background: "white",
    borderRadius: "18px",
    padding: "18px",
    color: "#071747",
    boxShadow: "0 20px 40px rgba(0,0,0,.25)"
  },

  slipRow: {
    background: "#f8fafc",
    borderRadius: "12px",
    padding: "10px",
    marginTop: "8px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "8px"
  },

  greenBtn: {
    border: "none",
    borderRadius: "8px",
    padding: "8px 12px",
    background: "#16a34a",
    color: "white",
    fontWeight: "800",
    fontSize: "12px",
    cursor: "pointer"
  },

  daysLeftBox: {
    marginTop: "8px",
    background: "#fef3c7",
    color: "#92400e",
    border: "1px solid #facc15",
    borderRadius: "10px",
    padding: "8px",
    fontWeight: "800",
    fontSize: "11px",
    textAlign: "center"
  },

  closeBtn: {
    width: "100%",
    marginTop: "12px",
    border: "none",
    borderRadius: "10px",
    padding: "10px",
    background: "#e5e7eb",
    color: "#071747",
    fontWeight: "800",
    fontSize: "13px",
    cursor: "pointer"
  },

  detailRow: {
    display: "flex",
    justifyContent: "space-between",
    padding: "8px 0",
    borderBottom: "1px solid #f1f5f9",
    fontSize: "14px"
  },

  // SIDEBAR DRAWER STYLES
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
