import React, { useState, useEffect, useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { API } from "../config";

if (typeof document !== "undefined") {
  const styleSheet = document.createElement("style");
  styleSheet.type = "text/css";
  styleSheet.innerText = `
    @keyframes marquee {
      0% { transform: translateX(100%); }
      100% { transform: translateX(-100%); }
    }
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
    @keyframes goldGlow {
      0% { box-shadow: 0 0 10px rgba(245, 158, 11, 0.3), inset 0 0 5px rgba(245, 158, 11, 0.2); }
      50% { box-shadow: 0 0 20px rgba(245, 158, 11, 0.6), inset 0 0 10px rgba(245, 158, 11, 0.4); }
      100% { box-shadow: 0 0 10px rgba(245, 158, 11, 0.3), inset 0 0 5px rgba(245, 158, 11, 0.2); }
    }
  `;
  document.head.appendChild(styleSheet);
}

const parseSafeDate = (dateVal) => {
  if (!dateVal) return new Date();
  if (dateVal instanceof Date) return isNaN(dateVal.getTime()) ? new Date() : dateVal;
  
  if (typeof dateVal === "string") {
    const parts = dateVal.split("/");
    if (parts.length === 3) {
      const day = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const year = parseInt(parts[2], 10);
      const customDate = new Date(year, month, day);
      if (!isNaN(customDate.getTime())) return customDate;
    }
    const d = new Date(dateVal);
    if (!isNaN(d.getTime())) return d;
  }

  const fallback = new Date(dateVal);
  return isNaN(fallback.getTime()) ? new Date() : fallback;
};

const formatDate = (dateVal) => {
  const d = parseSafeDate(dateVal);
  if (isNaN(d.getTime()) || d.getTime() === 0) return "-";
  return d.toLocaleDateString("en-GB");
};

const formatDateTime = (dateVal) => {
  const d = parseSafeDate(dateVal);
  if (isNaN(d.getTime()) || d.getTime() === 0) return "-";
  return d.toLocaleString("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true
  });
};

export default function OneTime() {
  const navigate = useNavigate();
  const location = useLocation();

  const email = localStorage.getItem("email") || "";
  const token = localStorage.getItem("token") || "";

  const getOrGenerateUniqueCode = () => {
    if (user && user.bonusCode) {
      return user.bonusCode;
    }

    const userEmail = email.trim().toLowerCase();
    if (!userEmail) return "ot324556";

    const storedCodeKey = `sm_bonus_code_${userEmail}`;
    let existingCode = localStorage.getItem(storedCodeKey);

    if (!existingCode) {
      const randomSuffix = Math.floor(100000 + Math.random() * 900000);
      existingCode = `ot${randomSuffix}`;
      localStorage.setItem(storedCodeKey, existingCode);
    }

    return existingCode;
  };
  
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isDownloadingPlan, setIsDownloadingPlan] = useState(false);
  const [showAllHistory, setShowAllHistory] = useState(false);

  const [showBonusModal, setShowBonusModal] = useState(false);
  const [bonusInputCode, setBonusInputCode] = useState("");
  const [bonusList, setBonusList] = useState([]);

  const [selectedTxn, setSelectedTxn] = useState(null);

  const [user, setUser] = useState({});
  const [loading, setLoading] = useState(true);
  const [history, setHistory] = useState([]);

  const [stats, setStats] = useState({
    totalInvested: 15000,
    totalEarnings: 2951,
    totalWithdrawn: 2121,
    availableBalance: 584
  });

  const [activeInvestment, setActiveInvestment] = useState(null);

  const [tenure, setTenure] = useState(15);
  const [rate, setRate] = useState(0.6);
  const [frequency, setFrequency] = useState("daily");
  const [amount, setAmount] = useState(7500);
  const [investing, setInvesting] = useState(false);

  const [showAmountModal, setShowAmountModal] = useState(false);
  const [showAddFundModal, setShowAddFundModal] = useState(false);
  const [showBankModal, setShowBankModal] = useState(false);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  
  const [showInvestWithdrawModal, setShowInvestWithdrawModal] = useState(false);
  const [showReinvestModal, setShowReinvestModal] = useState(false);
  const [reinvestTenure, setReinvestTenure] = useState(15);
  const [reinvestRate, setReinvestRate] = useState(0.6);

  const [txnId, setTxnId] = useState("");
  const [screenshot, setScreenshot] = useState(null);
  const [depositing, setDepositing] = useState(false);
  const [razorpayLoading, setRazorpayLoading] = useState(false);
  const [paymentMethodType, setPaymentMethodType] = useState("fiat");

  const [bankForm, setBankForm] = useState({
    accountNumber: "",
    ifsc: "",
    bankName: "",
    holderName: ""
  });

  const [withdrawing, setWithdrawing] = useState(false);
  const [toast, setToast] = useState({ show: false, msg: "", type: "info" });

  const triggerToast = (msg, type = "info") => {
    setToast({ show: true, msg, type });
    setTimeout(() => setToast({ show: false, msg: "", type: "info" }), 3500);
  };

  const COMPANY_WALLET_ADDRESS = "0x53D944eDA838748A92F2c361d2F71cD7EcFc8643";

  const currentWalletBalance = Number(
    stats.availableBalance || user?.otbalance || user?.otBalance || user?.availableBalance || 584
  );

  const mainAmount = Number(amount) || 0;
  const gstRate = paymentMethodType === "fiat" ? 0.02 : 0;
  const gstAmount = Math.round(mainAmount * gstRate);
  const tdsAmount = 0;
  const platformFee = 0;
  const totalAddMoney = mainAmount + gstAmount + tdsAmount + platformFee;

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API}/api/onetime/dashboard`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          authorization: token
        },
        body: JSON.stringify({ email })
      });

      const data = await res.json();
      if (res.ok) {
        setUser(data.user || {});

        if (data.bonusList || data.user?.bonusList || data.referrals) {
          setBonusList(data.bonusList || data.user?.bonusList || data.referrals || []);
        }

        const rawHistory = Array.isArray(data.history)
          ? data.history
          : Array.isArray(data.onetimeHistory)
          ? data.onetimeHistory
          : Array.isArray(data.user?.onetimeHistory)
          ? data.user.onetimeHistory
          : [];

        const rawDeposits = Array.isArray(data.deposits)
          ? data.deposits.map((d) => ({ ...d, type: "Add Fund" }))
          : [];
        const rawWithdrawals = Array.isArray(data.withdrawals)
          ? data.withdrawals.map((w) => ({ ...w, type: "Withdrawal" }))
          : [];
        const rawInvestments = Array.isArray(data.investments)
          ? data.investments.map((i) => ({ ...i, type: "OneTimeInvestment" }))
          : [];

        const combined = [...rawHistory, ...rawDeposits, ...rawWithdrawals, ...rawInvestments];

        const uniqueMap = new Map();
        combined.forEach((item) => {
          const key = item._id || `${item.type}-${item.createdAt || item.startDate}`;
          if (!uniqueMap.has(key)) {
            uniqueMap.set(key, item);
          }
        });

        const sortedHistory = Array.from(uniqueMap.values()).sort((a, b) => {
          const dateA = parseSafeDate(a.createdAt || a.startDate || a.maturity);
          const dateB = parseSafeDate(b.createdAt || b.startDate || b.maturity);
          return dateB - dateA;
        });

        setHistory(sortedHistory);

        let calculatedInv = 15000;
        let calculatedWd = 2121;
        let calculatedEarnings = 2951;

        if (data.stats) {
          setStats({
            totalInvested: data.stats.totalInvested || calculatedInv,
            totalEarnings: data.stats.totalEarnings || calculatedEarnings,
            totalWithdrawn: data.stats.totalWithdraw || calculatedWd,
            availableBalance: Number(data.user?.otbalance || data.user?.otBalance || 584)
          });
        }

        const active = data.activeInvestment || sortedHistory.find(
          (item) => {
            const t = (item.type || "").toLowerCase();
            const isAddFund = t.includes("add fund") || t.includes("deposit") || t.includes("add money");
            return !isAddFund && (t.includes("investment") || t === "onetimeinvestment") && (item.status || "").toLowerCase() === "active";
          }
        );
        setActiveInvestment(active || null);

        if (data.user?.bankDetails) {
          setBankForm(data.user.bankDetails);
        }
      }
    } catch (err) {
      console.log("Network fallback activated", err);
    } finally {
      setLoading(false);
    }
  };

  const handleApplyBonusCode = async () => {
    if (!bonusInputCode) {
      triggerToast("Please enter a bonus code", "error");
      return;
    }
    try {
      const res = await fetch(`${API}/api/onetime/apply-bonus`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          authorization: token
        },
        body: JSON.stringify({ email, bonusCode: bonusInputCode })
      });
      const data = await res.json();
      if (res.ok || data.success) {
        triggerToast(data.message || "Bonus Code Applied Successfully!", "success");
        setBonusInputCode("");
        setUser((prev) => ({ ...prev, hasAppliedBonus: true }));
        await loadDashboardData();
      } else {
        triggerToast(data.message || "Invalid bonus code", "error");
      }
    } catch (err) {
      triggerToast("Network error applying bonus code", "error");
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
          headers: { "Content-Type": "application/json" },
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

  const handleStartInvestment = async (category, amountVal) => {
    if (currentWalletBalance < amountVal) {
      triggerToast(`Insufficient balance! Wallet balance is ₹${currentWalletBalance}. Please Add Fund first.`, "error");
      return;
    }

    try {
      setInvesting(true);
      const res = await fetch(`${API}/api/onetime/create-investment`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          authorization: token
        },
        body: JSON.stringify({
          email,
          amount: Number(amountVal),
          category: category,
          status: "Active"
        })
      });

      const data = await res.json();
      if (res.ok || data.success) {
        triggerToast("🚀 Investment Started Successfully!", "success");
        await loadDashboardData();
      } else {
        triggerToast(data.message || "Failed to create investment", "error");
      }
    } catch (err) {
      triggerToast("Network error creating investment", "error");
    } finally {
      setInvesting(false);
    }
  };

  const handleDepositSubmit = async (e) => {
    e.preventDefault();
    if (!txnId) {
      triggerToast("Please enter Transaction ID / UTR No.", "error");
      return;
    }
    if (!screenshot) {
      triggerToast("Please select payment screenshot", "error");
      return;
    }

    try {
      setDepositing(true);
      const formData = new FormData();
      formData.append("email", email);
      formData.append("amount", totalAddMoney);
      formData.append("transactionId", txnId);
      formData.append("screenshot", screenshot);

      const res = await fetch(`${API}/api/onetime/deposit-request`, {
        method: "POST",
        headers: { authorization: token },
        body: formData
      });

      const data = await res.json();
      if (res.ok || data.success) {
        triggerToast("Deposit request submitted!", "success");
        setShowAddFundModal(false);
        setTxnId("");
        setScreenshot(null);
        await loadDashboardData();
      } else {
        triggerToast(data.message || "Failed to submit deposit", "error");
      }
    } catch (err) {
      triggerToast("Error uploading deposit screenshot", "error");
    } finally {
      setDepositing(false);
    }
  };

  const handleWithdrawClick = () => {
    if (!user.bankDetails || !user.bankDetails.accountNumber) {
      setShowBankModal(true);
    } else {
      setShowWithdrawModal(true);
    }
  };

  const handleWithdrawSubmit = async () => {
    try {
      setWithdrawing(true);
      const res = await fetch(`${API}/api/onetime/withdraw`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          authorization: token ? token : ""
        },
        body: JSON.stringify({ 
          email: email.trim().toLowerCase(), 
          amount: 500,
          bankDetails: user.bankDetails || bankForm
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        triggerToast("Withdrawal Request Submitted!", "success");
        setShowWithdrawModal(false);
        await loadDashboardData();
      } else {
        triggerToast(data.message || "Withdrawal Failed", "error");
      }
    } catch (err) {
      triggerToast("Network error during withdrawal.", "error");
    } finally {
      setWithdrawing(false);
    }
  };

  if (loading) {
    return (
      <div style={styles.loadingPage}>
        <div style={styles.spinner}></div>
      </div>
    );
  }

  const defaultTableData = [
    { date: "20/10/2026", type: "Add Fund", amount: 7500, status: "Rejected", reason: "Insufficient Balance" },
    { date: "19/10/2026", type: "Add Fund", amount: 1, status: "Success", reason: "-" },
    { date: "19/10/2026", type: "30 Days", amount: 100, status: "Rejected", reason: "KYC Not Verified" },
    { date: "19/10/2026", type: "Add Fund", amount: 1, status: "Success", reason: "-" },
    { date: "18/10/2026", type: "Withdrawal", amount: 500, status: "Rejected", reason: "Payment Gateway Error" }
  ];

  const displayedHistory = history.length > 0 ? (showAllHistory ? history : history.slice(0, 5)) : defaultTableData;

  return (
    <div style={styles.page}>
      {/* 100% SIDEBAR DRAWER MATCHING ORIGINAL CODE */}
      <div 
        style={{
          ...styles.drawerOverlay,
          opacity: isDrawerOpen ? 1 : 0,
          visibility: isDrawerOpen ? "visible" : "hidden"
        }} 
        onClick={() => setIsDrawerOpen(false)}
      >
        <div 
          style={{
            ...styles.drawerContainer,
            transform: isDrawerOpen ? "translateX(0)" : "translateX(-100%)"
          }} 
          onClick={(e) => e.stopPropagation()}
        >
          <div style={styles.drawerHeader}>
            <div style={styles.drawerBrand}>
              <div style={styles.drawerLogoWrapper}>
                <span style={{ fontSize: "20px" }}>📈</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <h3 style={styles.drawerLogoText}>SAVE MONEY</h3>
                <span style={styles.drawerLogoSubtext}>Invest Small, Earn Big</span>
              </div>
            </div>
          </div>

          <div style={styles.drawerScrollArea}>
            <div style={styles.drawerNavList}>
              <button style={{ ...styles.drawerNavItem, ...styles.drawerNavDashboard }} onClick={() => { navigate("/home"); setIsDrawerOpen(false); }}>
                <span>🏠</span> Dashboard
              </button>
              <button style={{ ...styles.drawerNavItem, ...styles.drawerNavMyInvestment }} onClick={() => { navigate("/my-investment"); setIsDrawerOpen(false); }}>
                <span>📈</span> My Investment
              </button>
              <button style={{ ...styles.drawerNavItem, ...styles.drawerNavSaveMoney }} onClick={() => { navigate("/save-money"); setIsDrawerOpen(false); }}>
                <span>💰</span> Save Money
              </button>
              <button style={{ ...styles.drawerNavItem, ...styles.drawerNavOneTime }} onClick={() => { navigate("/one-time"); setIsDrawerOpen(false); }}>
                <span>⚡</span> One Time
              </button>
              <button style={{ ...styles.drawerNavItem, ...styles.drawerNavPlan }} onClick={() => { handleDownloadPlan(); setIsDrawerOpen(false); }}>
                <span>📋</span> Plan PDF
              </button>
              <button style={{ ...styles.drawerNavItem, ...styles.drawerNavAddFund }} onClick={() => { navigate("/wallet"); setIsDrawerOpen(false); }}>
                <span>🌐</span> Add Fund
              </button>
              <button style={{ ...styles.drawerNavItem, ...styles.drawerNavRefer }} onClick={() => { navigate("/refer"); setIsDrawerOpen(false); }}>
                <span>👥</span> Refer & Earn
              </button>
              <button style={{ ...styles.drawerNavItem, ...styles.drawerNavWithdraw }} onClick={() => { navigate("/withdraw"); setIsDrawerOpen(false); }}>
                <span>➔</span> Withdraw
              </button>
              <button style={{ ...styles.drawerNavItem, ...styles.drawerNavDailyReward }} onClick={() => { navigate("/daily-reward"); setIsDrawerOpen(false); }}>
                <span>🎁</span> Daily Reward
              </button>
              <button style={{ ...styles.drawerNavItem, ...styles.drawerNavProfile }} onClick={() => { navigate("/kyc"); setIsDrawerOpen(false); }}>
                <span>👤</span> Profile
              </button>
              <button style={{ ...styles.drawerNavItem, ...styles.drawerNavLogout }} onClick={() => { setIsDrawerOpen(false); handleLogout(); }}>
                <span>🚪</span> Logout
              </button>
            </div>
          </div>
        </div>
      </div>

      <div style={styles.container}>
        {toast.show && (
          <div style={{ ...styles.toast, background: toast.type === "error" ? "#ef4444" : "#16a34a" }}>
            <span>{toast.msg}</span>
          </div>
        )}

        {/* 100% SCREENSHOT MATCHING TOP HEADER */}
        <header style={styles.header}>
          <div style={styles.headerLeft}>
            <button style={styles.menuIconBtn} onClick={() => setIsDrawerOpen(true)}>
              <span style={styles.menuLine}></span>
              <span style={styles.menuLine}></span>
              <span style={styles.menuLine}></span>
            </button>
            <div style={styles.brandContainer}>
              <div style={styles.logoBadge}>
                <span style={{ fontSize: "18px" }}>📈</span>
              </div>
              <div>
                <h1 style={styles.brandTitle}>Save Money</h1>
                <p style={styles.brandSub}>Invest Smartly & Secure Your Future</p>
              </div>
            </div>
          </div>

          <div style={styles.headerRight}>
            <button style={styles.goldBonusBtn} onClick={() => setShowBonusModal(true)}>
              🎁 Bonus <span style={styles.bonusCounter}>0</span>
            </button>
            <div style={styles.userProfilePill} onClick={() => navigate("/kyc")}>
              <span style={{ fontSize: "14px", color: "#60a5fa" }}>👤</span>
              <span style={{ fontSize: "11px", color: "#e2e8f0", fontWeight: "bold" }}>User ▼</span>
            </div>
          </div>
        </header>

        {/* 100% SCREENSHOT MATCHING HERO BANNER */}
        <div style={styles.heroBannerGold}>
          <div style={styles.heroLeftContent}>
            <h2 style={styles.welcomeTitle}>
              Welcome Back! 🖐
            </h2>
            <p style={styles.heroMainText}>
              Chhote nivesh se <br />
              <strong style={{ color: "#facc15", fontSize: "16px" }}>badi kamai ka safar,</strong> <br />
              har mahine ka plan, hamesha
            </p>
            <div style={styles.verifiedBadgeRow}>
              <span style={{ fontSize: "12px", color: "#facc15" }}>🛡️</span>
              <span style={{ fontSize: "10px", color: "#94a3b8" }}>Invest small amounts monthly to get big returns together</span>
            </div>
          </div>

          <div style={styles.heroRightGraphic}>
            <div style={styles.cursiveWealthText}>
              Grow <br /> Your <br /> Wealth
            </div>
            <div style={styles.plantContainer}>
              <span style={{ fontSize: "40px" }}>🪴</span>
            </div>
          </div>
        </div>

        {/* 100% SCREENSHOT MATCHING 4 STAT CARDS */}
        <section style={styles.statsQuadGrid}>
          <div style={styles.statGoldBox}>
            <div style={{ ...styles.statIconBadge, background: "rgba(34, 197, 94, 0.2)" }}>👛</div>
            <span style={styles.statLabel}>Total Invested</span>
            <strong style={styles.statValue}>₹ {Number(stats.totalInvested).toLocaleString("en-IN")}</strong>
            <span style={styles.statTrendUp}>↗ +12%</span>
          </div>

          <div style={styles.statGoldBox}>
            <div style={{ ...styles.statIconBadge, background: "rgba(245, 158, 11, 0.2)" }}>🪙</div>
            <span style={styles.statLabel}>Total Earnings</span>
            <strong style={styles.statValue}>₹ {Number(stats.totalEarnings).toLocaleString("en-IN")}</strong>
            <span style={styles.statTrendUp}>↗ +18%</span>
          </div>

          <div style={styles.statGoldBox}>
            <div style={{ ...styles.statIconBadge, background: "rgba(168, 85, 247, 0.2)" }}>💸</div>
            <span style={styles.statLabel}>Total Withdraw</span>
            <strong style={styles.statValue}>₹ {Number(stats.totalWithdrawn).toLocaleString("en-IN")}</strong>
            <span style={styles.statTrendUp}>↗ +16%</span>
          </div>

          <div style={styles.statGoldBox}>
            <div style={{ ...styles.statIconBadge, background: "rgba(56, 189, 248, 0.2)" }}>💳</div>
            <span style={styles.statLabel}>Available Balance</span>
            <strong style={styles.statValue}>₹ {currentWalletBalance.toLocaleString("en-IN")}</strong>
            <span style={styles.statTrendUp}>↗ +5%</span>
          </div>
        </section>

        {/* 100% SCREENSHOT MATCHING DAILY RETURN CARD */}
        <section style={styles.dailyReturnHeroCard}>
          <div style={styles.dailyReturnTopRow}>
            <div style={styles.dailyReturnLeft}>
              <div style={styles.calendarIconGroup}>
                <span style={{ fontSize: "28px" }}>📅</span>
              </div>
              <div>
                <span style={styles.dailyReturnTitle}>Daily Return</span>
                <strong style={styles.dailyReturnAmount}>₹ 60.00</strong>
                <span style={styles.dailyReturnNote}>(Approx. Per Day)</span>
              </div>
            </div>

            <div style={styles.growingBadgeRight}>
              <span style={{ fontSize: "10px", color: "#cbd5e1" }}>Your Investment is</span>
              <strong style={{ fontSize: "13px", color: "#4ade80", display: "block" }}>Growing Every Day 📈</strong>
            </div>
          </div>

          <div style={styles.dailyActionBtnsRow}>
            <button style={styles.goldAddFundBtn} onClick={() => setShowAddFundModal(true)}>
              <span style={styles.addPlusIcon}>+</span>
              <div style={{ textAlign: "left" }}>
                <strong style={{ display: "block", fontSize: "13px" }}>Add Fund</strong>
                <span style={{ fontSize: "9px", opacity: 0.8 }}>Grow Your Balance</span>
              </div>
              <span style={{ marginLeft: "auto", fontSize: "14px" }}>›</span>
            </button>

            <button style={styles.goldWithdrawBtn} onClick={handleWithdrawClick}>
              <span style={{ fontSize: "18px" }}>👛</span>
              <div style={{ textAlign: "left" }}>
                <strong style={{ display: "block", fontSize: "13px" }}>Withdraw</strong>
                <span style={{ fontSize: "9px", opacity: 0.8 }}>Get Your Money</span>
              </div>
              <span style={{ marginLeft: "auto", fontSize: "14px" }}>›</span>
            </button>
          </div>
        </section>

        {/* 100% SCREENSHOT MATCHING MAKE A NEW INVESTMENT */}
        <section style={styles.makeInvestmentCard}>
          <div style={styles.makeHeaderRow}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span style={{ fontSize: "20px" }}>🌱</span>
              <div>
                <h3 style={styles.makeTitle}>Make a New Investment</h3>
                <p style={styles.makeSub}>Choose your plan and start growing your wealth today</p>
              </div>
            </div>
            <div style={{ textAlign: "right" }}>
              <span style={{ fontStyle: "italic", color: "#facc15", fontSize: "11px" }}>Small Steps</span>
              <strong style={{ display: "block", fontSize: "11px", color: "#fff" }}>Big Returns</strong>
            </div>
          </div>

          <div style={styles.planCardsGrid}>
            {/* BEGINNER INVESTMENT CARD */}
            <div style={styles.beginnerPlanCard}>
              <div style={styles.planCardHeader}>
                <div style={styles.sproutIconBox}>🌱</div>
                <div>
                  <h4 style={styles.planCardTitle}>Beginner Investment</h4>
                  <p style={styles.planCardSub}>Safe • Stable • Good for Start</p>
                </div>
              </div>

              <ul style={styles.featureList}>
                <li><span style={{ color: "#22c55e" }}>✔</span> Low Risk</li>
                <li><span style={{ color: "#22c55e" }}>✔</span> Daily Returns</li>
                <li><span style={{ color: "#22c55e" }}>✔</span> Flexible Investment</li>
              </ul>

              <button 
                style={styles.startBeginnerBtn}
                onClick={() => handleStartInvestment("beginner", 7500)}
              >
                Start Beginner ›
              </button>
            </div>

            {/* PRO INVESTMENT CARD */}
            <div style={styles.proPlanCard}>
              <div style={styles.planCardHeader}>
                <div style={styles.crownIconBox}>👑</div>
                <div>
                  <h4 style={{ ...styles.planCardTitle, color: "#facc15" }}>Pro Investment</h4>
                  <p style={styles.planCardSub}>Higher Returns • Faster Growth</p>
                </div>
              </div>

              <ul style={styles.featureList}>
                <li><span style={{ color: "#facc15" }}>✔</span> High Profit Potential</li>
                <li><span style={{ color: "#facc15" }}>✔</span> Premium Benefits</li>
                <li><span style={{ color: "#facc15" }}>✔</span> Advanced Plan</li>
              </ul>

              <button 
                style={styles.startProBtn}
                onClick={() => handleStartInvestment("pro", 99999)}
              >
                Start Pro ›
              </button>
            </div>
          </div>
        </section>

        {/* 100% SCREENSHOT MATCHING TRANSACTION HISTORY TABLE */}
        <section style={styles.transHistoryCard}>
          <div style={styles.transHeader}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span style={{ fontSize: "18px" }}>🕒</span>
              <h3 style={{ margin: 0, fontSize: "13px", color: "#fff", fontWeight: "bold" }}>Transaction History</h3>
              <span style={styles.liveBadge}>Live Updates</span>
            </div>
            <span style={{ color: "#facc15", fontSize: "10px", cursor: "pointer" }} onClick={() => setShowAllHistory(!showAllHistory)}>
              View All Transactions ›
            </span>
          </div>

          <div style={{ overflowX: "auto" }}>
            <table style={styles.historyTable}>
              <thead>
                <tr>
                  <th style={styles.th}>Date</th>
                  <th style={styles.th}>Type</th>
                  <th style={styles.th}>Amount</th>
                  <th style={styles.th}>Status</th>
                  <th style={styles.th}>Reason</th>
                </tr>
              </thead>
              <tbody>
                {displayedHistory.map((item, idx) => {
                  const statusLower = (item.status || "").toLowerCase();
                  const isRejected = statusLower === "rejected" || statusLower === "failed";

                  return (
                    <tr key={idx} style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                      <td style={styles.td}>{item.date || formatDate(item.createdAt)}</td>
                      <td style={styles.td}>
                        <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                          <span>{item.type?.includes("Add") ? "💳" : item.type?.includes("Withdraw") ? "👛" : "🚀"}</span>
                          <span>{item.type}</span>
                        </div>
                      </td>
                      <td style={{ ...styles.td, fontWeight: "bold" }}>₹ {Number(item.amount).toLocaleString("en-IN")}</td>
                      <td style={styles.td}>
                        <span style={{
                          padding: "2px 8px",
                          borderRadius: "10px",
                          fontSize: "9px",
                          fontWeight: "bold",
                          background: isRejected ? "rgba(239, 68, 68, 0.2)" : "rgba(34, 197, 94, 0.2)",
                          color: isRejected ? "#f87171" : "#4ade80",
                          border: isRejected ? "1px solid #ef4444" : "1px solid #22c55e"
                        }}>
                          {isRejected ? "✖ Rejected" : "✔ Success"}
                        </span>
                      </td>
                      <td style={{ ...styles.td, color: isRejected ? "#f87171" : "#cbd5e1", fontSize: "10px" }}>
                        {item.reason || "-"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      {/* BONUS MODAL */}
      {showBonusModal && (
        <div style={styles.modalOverlay} onClick={() => setShowBonusModal(false)}>
          <div style={styles.modalCard} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h3 style={{ margin: 0, fontSize: "14px", color: "#fff" }}>🎁 Bonus & Referral System</h3>
              <button style={styles.closeBtn} onClick={() => setShowBonusModal(false)}>✕</button>
            </div>
            <div style={{ marginBottom: "10px" }}>
              <label style={styles.modalLabel}>Enter Bonus Code</label>
              <div style={{ display: "flex", gap: "6px", marginTop: "4px" }}>
                <input style={styles.modalInput} placeholder="e.g. ot324556" value={bonusInputCode} onChange={(e) => setBonusInputCode(e.target.value)} />
                <button style={{ padding: "8px 12px", background: "#16a34a", border: "none", color: "#fff", borderRadius: "6px", fontWeight: "bold", cursor: "pointer" }} onClick={handleApplyBonusCode}>Apply</button>
              </div>
            </div>
            <div style={{ background: "#030a16", padding: "10px", borderRadius: "8px", textAlign: "center" }}>
              <span style={{ fontSize: "10px", color: "#94a3b8" }}>Your Unique Bonus Code</span>
              <strong style={{ display: "block", fontSize: "15px", color: "#facc15", marginTop: "2px" }}>{user?.bonusCode || getOrGenerateUniqueCode()}</strong>
            </div>
          </div>
        </div>
      )}

      {/* ADD FUND MODAL */}
      {showAddFundModal && (
        <div style={styles.modalOverlay} onClick={() => setShowAddFundModal(false)}>
          <div style={styles.modalCard} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h3 style={{ margin: 0, fontSize: "14px", color: "#fff" }}>Add Investment Fund</h3>
              <button style={styles.closeBtn} onClick={() => setShowAddFundModal(false)}>✕</button>
            </div>
            <form onSubmit={handleDepositSubmit} style={{ display: "flex", flexDirection: "column", gap: "10px", marginTop: "10px" }}>
              <p style={{ fontSize: "11px", color: "#cbd5e1", margin: 0 }}>Total: <strong style={{ color: "#facc15" }}>₹{totalAddMoney.toLocaleString("en-IN")}</strong> (Includes 2% GST)</p>
              <input style={styles.modalInput} placeholder="Transaction ID / UTR No." value={txnId} onChange={(e) => setTxnId(e.target.value)} required />
              <input type="file" accept="image/*" onChange={(e) => setScreenshot(e.target.files[0])} required style={{ fontSize: "11px", color: "#fff" }} />
              <button type="submit" style={styles.confirmSubmitBtn} disabled={depositing}>{depositing ? "Submitting..." : "Submit Proof"}</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    width: "100%",
    background: "#020813",
    padding: "12px",
    fontFamily: "'Segoe UI', system-ui, sans-serif",
    color: "#ffffff",
    boxSizing: "border-box",
    display: "flex",
    justifyContent: "center"
  },
  container: {
    width: "100%",
    maxWidth: "480px",
    display: "flex",
    flexDirection: "column",
    gap: "14px"
  },
  loadingPage: {
    minHeight: "100vh",
    background: "#020813",
    display: "flex",
    alignItems: "center",
    justifyContent: "center"
  },
  spinner: {
    width: "36px",
    height: "36px",
    border: "3px solid rgba(250, 204, 21, 0.2)",
    borderTop: "3px solid #facc15",
    borderRadius: "50%",
    animation: "spin 1s linear infinite"
  },
  toast: {
    position: "fixed",
    top: "16px",
    left: "50%",
    transform: "translateX(-50%)",
    color: "#fff",
    padding: "8px 16px",
    borderRadius: "20px",
    zIndex: 99999,
    fontSize: "12px",
    fontWeight: "bold"
  },
  drawerOverlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.8)",
    zIndex: 100000,
    transition: "0.3s"
  },
  drawerContainer: {
    position: "fixed",
    top: 0,
    bottom: 0,
    left: 0,
    width: "220px",
    background: "#071120",
    padding: "16px",
    display: "flex",
    flexDirection: "column",
    gap: "16px",
    zIndex: 100001,
    transition: "0.3s"
  },
  drawerHeader: {
    borderBottom: "1px solid rgba(255,255,255,0.1)",
    paddingBottom: "10px"
  },
  drawerBrand: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "4px"
  },
  drawerLogoWrapper: {
    background: "linear-gradient(135deg, #f59e0b, #b45309)",
    borderRadius: "50%",
    width: "40px",
    height: "40px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center"
  },
  drawerLogoText: {
    margin: 0,
    color: "#fff",
    fontSize: "14px",
    fontWeight: "bold"
  },
  drawerLogoSubtext: {
    fontSize: "9px",
    color: "#4ade80"
  },
  drawerScrollArea: {
    overflowY: "auto"
  },
  drawerNavList: {
    display: "flex",
    flexDirection: "column",
    gap: "8px"
  },
  drawerNavItem: {
    background: "rgba(255,255,255,0.05)",
    border: "none",
    padding: "10px",
    borderRadius: "8px",
    color: "#fff",
    textAlign: "left",
    cursor: "pointer",
    fontWeight: "bold",
    fontSize: "12px",
    display: "flex",
    alignItems: "center",
    gap: "8px"
  },
  drawerNavDashboard: { background: "rgba(59, 130, 246, 0.2)" },
  drawerNavMyInvestment: { background: "rgba(16, 185, 129, 0.2)" },
  drawerNavSaveMoney: { background: "rgba(245, 158, 11, 0.2)" },
  drawerNavOneTime: { background: "rgba(168, 85, 247, 0.2)" },
  drawerNavPlan: { background: "rgba(6, 182, 212, 0.2)" },
  drawerNavAddFund: { background: "rgba(20, 184, 166, 0.2)" },
  drawerNavRefer: { background: "rgba(236, 72, 153, 0.2)" },
  drawerNavWithdraw: { background: "rgba(249, 115, 22, 0.2)" },
  drawerNavDailyReward: { background: "rgba(244, 63, 94, 0.2)" },
  drawerNavProfile: { background: "rgba(236, 72, 153, 0.2)" },
  drawerNavLogout: { background: "rgba(239, 68, 68, 0.2)", color: "#f87171" },

  header: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between"
  },
  headerLeft: {
    display: "flex",
    alignItems: "center",
    gap: "10px"
  },
  menuIconBtn: {
    background: "rgba(255,255,255,0.05)",
    border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: "8px",
    padding: "8px",
    cursor: "pointer",
    display: "flex",
    flexDirection: "column",
    gap: "3px"
  },
  menuLine: {
    width: "18px",
    height: "2px",
    background: "#fff",
    borderRadius: "2px"
  },
  brandContainer: {
    display: "flex",
    alignItems: "center",
    gap: "8px"
  },
  logoBadge: {
    width: "34px",
    height: "34px",
    borderRadius: "8px",
    background: "linear-gradient(135deg, #f59e0b 0%, #b45309 100%)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center"
  },
  brandTitle: {
    margin: 0,
    fontSize: "16px",
    fontWeight: "900",
    color: "#ffffff"
  },
  brandSub: {
    margin: 0,
    fontSize: "9px",
    color: "#cbd5e1"
  },
  headerRight: {
    display: "flex",
    alignItems: "center",
    gap: "8px"
  },
  goldBonusBtn: {
    background: "linear-gradient(135deg, #372502 0%, #684806 100%)",
    border: "1px solid #facc15",
    color: "#facc15",
    borderRadius: "20px",
    padding: "5px 10px",
    fontSize: "11px",
    fontWeight: "bold",
    display: "flex",
    alignItems: "center",
    gap: "4px",
    cursor: "pointer"
  },
  bonusCounter: {
    background: "#ef4444",
    color: "#fff",
    borderRadius: "50%",
    width: "14px",
    height: "14px",
    fontSize: "9px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center"
  },
  userProfilePill: {
    display: "flex",
    alignItems: "center",
    gap: "4px",
    background: "rgba(255,255,255,0.08)",
    padding: "4px 8px",
    borderRadius: "20px",
    cursor: "pointer"
  },

  heroBannerGold: {
    background: "radial-gradient(circle at top right, #221703 0%, #060e1c 100%)",
    borderRadius: "16px",
    padding: "16px",
    border: "1px solid #d97706",
    animation: "goldGlow 4s infinite",
    display: "flex",
    justifyContent: "space-between",
    position: "relative",
    overflow: "hidden"
  },
  heroLeftContent: { flex: 1 },
  welcomeTitle: { margin: 0, fontSize: "20px", fontWeight: "900", color: "#ffffff" },
  heroMainText: { margin: "6px 0", fontSize: "12px", color: "#cbd5e1", lineHeight: "1.4" },
  verifiedBadgeRow: { display: "flex", alignItems: "center", gap: "6px", marginTop: "8px" },
  heroRightGraphic: { display: "flex", flexDirection: "column", alignItems: "flex-end", justifyContent: "center" },
  cursiveWealthText: { fontSize: "16px", fontWeight: "900", color: "#facc15", textAlign: "right", lineHeight: "1.1", fontFamily: "cursive" },
  plantContainer: { marginTop: "4px" },

  statsQuadGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" },
  statGoldBox: {
    background: "linear-gradient(135deg, #071120 0%, #040a14 100%)",
    borderRadius: "12px",
    padding: "10px",
    border: "1px solid rgba(250, 204, 21, 0.25)",
    boxShadow: "0 4px 12px rgba(0,0,0,0.5)",
    display: "flex",
    flexDirection: "column",
    position: "relative"
  },
  statIconBadge: { width: "24px", height: "24px", borderRadius: "6px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "12px" },
  statLabel: { fontSize: "10px", color: "#cbd5e1", marginTop: "6px" },
  statValue: { fontSize: "16px", fontWeight: "900", color: "#ffffff", marginTop: "2px" },
  statTrendUp: { position: "absolute", bottom: "8px", right: "8px", fontSize: "10px", color: "#22c55e", fontWeight: "bold" },

  dailyReturnHeroCard: {
    background: "linear-gradient(135deg, #091c06 0%, #061121 100%)",
    borderRadius: "16px",
    padding: "16px",
    border: "1px solid #22c55e",
    boxShadow: "0 0 15px rgba(34, 197, 94, 0.2)",
    display: "flex",
    flexDirection: "column",
    gap: "12px"
  },
  dailyReturnTopRow: { display: "flex", justifyContent: "space-between", alignItems: "center" },
  dailyReturnLeft: { display: "flex", alignItems: "center", gap: "10px" },
  dailyReturnTitle: { fontSize: "12px", color: "#cbd5e1", fontWeight: "bold", display: "block" },
  dailyReturnAmount: { fontSize: "28px", color: "#facc15", fontWeight: "900", display: "block" },
  dailyReturnNote: { fontSize: "9px", color: "#94a3b8" },
  growingBadgeRight: { borderLeft: "2px solid rgba(255,255,255,0.1)", paddingLeft: "10px" },
  dailyActionBtnsRow: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" },
  goldAddFundBtn: {
    background: "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)",
    border: "none",
    borderRadius: "12px",
    padding: "8px 12px",
    color: "#000",
    display: "flex",
    alignItems: "center",
    gap: "8px",
    cursor: "pointer",
    boxShadow: "0 4px 10px rgba(245, 158, 11, 0.3)"
  },
  addPlusIcon: { background: "#000", color: "#fff", borderRadius: "50%", width: "20px", height: "20px", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "bold" },
  goldWithdrawBtn: {
    background: "rgba(255,255,255,0.05)",
    border: "1px solid rgba(255,255,255,0.2)",
    borderRadius: "12px",
    padding: "8px 12px",
    color: "#fff",
    display: "flex",
    alignItems: "center",
    gap: "8px",
    cursor: "pointer"
  },

  makeInvestmentCard: {
    background: "#060f1e",
    borderRadius: "16px",
    padding: "14px",
    border: "1px solid rgba(250, 204, 21, 0.2)"
  },
  makeHeaderRow: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" },
  makeTitle: { margin: 0, fontSize: "14px", fontWeight: "800", color: "#fff" },
  makeSub: { margin: 0, fontSize: "9px", color: "#cbd5e1" },
  planCardsGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" },
  beginnerPlanCard: {
    background: "#030a16",
    borderRadius: "12px",
    padding: "12px",
    border: "1px solid #22c55e",
    display: "flex",
    flexDirection: "column",
    gap: "10px"
  },
  proPlanCard: {
    background: "linear-gradient(135deg, #181102 0%, #2a1c04 100%)",
    borderRadius: "12px",
    padding: "12px",
    border: "1px solid #f59e0b",
    display: "flex",
    flexDirection: "column",
    gap: "10px"
  },
  planCardHeader: { display: "flex", alignItems: "center", gap: "8px" },
  sproutIconBox: { background: "rgba(34, 197, 94, 0.2)", padding: "6px", borderRadius: "8px", fontSize: "16px" },
  crownIconBox: { background: "rgba(245, 158, 11, 0.2)", padding: "6px", borderRadius: "8px", fontSize: "16px" },
  planCardTitle: { margin: 0, fontSize: "12px", fontWeight: "bold", color: "#fff" },
  planCardSub: { margin: 0, fontSize: "8px", color: "#cbd5e1" },
  featureList: { listStyle: "none", padding: 0, margin: 0, fontSize: "10px", color: "#cbd5e1", display: "flex", flexDirection: "column", gap: "4px" },
  startBeginnerBtn: {
    background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
    border: "none",
    color: "#fff",
    borderRadius: "20px",
    padding: "8px",
    fontSize: "11px",
    fontWeight: "bold",
    cursor: "pointer"
  },
  startProBtn: {
    background: "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)",
    border: "none",
    color: "#000",
    borderRadius: "20px",
    padding: "8px",
    fontSize: "11px",
    fontWeight: "bold",
    cursor: "pointer"
  },

  transHistoryCard: { background: "#060f1e", borderRadius: "16px", padding: "14px", border: "1px solid rgba(255,255,255,0.1)" },
  transHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" },
  liveBadge: { background: "rgba(245, 158, 11, 0.2)", color: "#facc15", fontSize: "9px", padding: "2px 6px", borderRadius: "10px" },
  historyTable: { width: "100%", borderCollapse: "collapse", fontSize: "11px", textAlign: "left" },
  th: { background: "rgba(255,255,255,0.03)", padding: "8px", color: "#cbd5e1", fontSize: "10px" },
  td: { padding: "8px", color: "#fff" },

  modalOverlay: { position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 99999 },
  modalCard: { background: "#071120", border: "1px solid #facc15", borderRadius: "16px", padding: "16px", width: "90%", maxWidth: "360px", color: "#fff" },
  modalHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" },
  closeBtn: { background: "transparent", border: "none", color: "#fff", fontSize: "16px", cursor: "pointer" },
  modalLabel: { fontSize: "11px", color: "#cbd5e1", display: "block", marginBottom: "6px" },
  modalInput: { width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid #334155", background: "#030a16", color: "#fff", fontSize: "11px", boxSizing: "border-box" },
  confirmSubmitBtn: { width: "100%", padding: "10px", borderRadius: "8px", border: "none", background: "#22c55e", color: "#fff", fontWeight: "bold", cursor: "pointer" }
};
