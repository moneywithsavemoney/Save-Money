import React, { useState, useEffect, useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { API } from "../config";

// Keyframe Style Injection for Marquee Animation
if (typeof document !== "undefined") {
  const styleSheet = document.createElement("style");
  styleSheet.type = "text/css";
  styleSheet.innerText = `
    @keyframes marquee {
      0% { transform: translateX(100%); }
      100% { transform: translateX(-100%); }
    }
  `;
  document.head.appendChild(styleSheet);
}

// Safe Date Parser
const parseSafeDate = (dateVal) => {
  if (!dateVal) return new Date(0);
  if (dateVal instanceof Date) return isNaN(dateVal) ? new Date(0) : dateVal;
  
  if (!isNaN(dateVal) && typeof dateVal !== "string") {
    return new Date(Number(dateVal));
  }

  if (typeof dateVal === "string") {
    const d = new Date(dateVal);
    if (!isNaN(d.getTime())) return d;

    const parts = dateVal.split(/[\/\-]/);
    if (parts.length === 3) {
      const month = parseInt(parts[0], 10) - 1;
      const day = parseInt(parts[1], 10);
      const year = parseInt(parts[2], 10);
      const customDate = new Date(year, month, day);
      if (!isNaN(customDate.getTime())) return customDate;
    }
  }

  const fallback = new Date(dateVal);
  return isNaN(fallback.getTime()) ? new Date(0) : fallback;
};

const formatDate = (dateVal) => {
  const d = parseSafeDate(dateVal);
  if (isNaN(d.getTime()) || d.getTime() === 0) return "-";
  return d.toLocaleDateString("en-GB");
};

export default function OneTime() {
  const navigate = useNavigate();
  const location = useLocation();

  const email = localStorage.getItem("email") || "";
  const token = localStorage.getItem("token") || "";

  // ----------------- WELCOME OFFER POPUP STATE -----------------
  const [showOfferPopup, setShowOfferPopup] = useState(true);

  // ----------------- SIDEBAR & PLAN STATES -----------------
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isDownloadingPlan, setIsDownloadingPlan] = useState(false);
  const [showAllHistory, setShowAllHistory] = useState(false);

  // ----------------- DASHBOARD STATES -----------------
  const [user, setUser] = useState({});
  const [loading, setLoading] = useState(true);
  const [history, setHistory] = useState([]);

  // Dynamic Dashboard Stats
  const [stats, setStats] = useState({
    totalInvested: 0,
    totalEarnings: 0,
    totalWithdrawn: 0,
    availableBalance: 0
  });

  // Active Investment Tracking
  const [activeInvestment, setActiveInvestment] = useState(null);

  // Investment Form State
  const [tenure, setTenure] = useState(15);
  const [rate, setRate] = useState(0.6);
  const [frequency, setFrequency] = useState("daily");
  const [amount, setAmount] = useState(5000);
  const [investing, setInvesting] = useState(false);

  // Modals State
  const [showAmountModal, setShowAmountModal] = useState(false);
  const [showAddFundModal, setShowAddFundModal] = useState(false);
  const [showBankModal, setShowBankModal] = useState(false);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);

  // Deposit Form State
  const [txnId, setTxnId] = useState("");
  const [screenshot, setScreenshot] = useState(null);
  const [depositing, setDepositing] = useState(false);

  // Bank Form State
  const [bankForm, setBankForm] = useState({
    accountNumber: "",
    ifsc: "",
    bankName: "",
    holderName: ""
  });

  const [withdrawing, setWithdrawing] = useState(false);

  // Toast State
  const [toast, setToast] = useState({ show: false, msg: "", type: "info" });

  const triggerToast = (msg, type = "info") => {
    setToast({ show: true, msg, type });
    setTimeout(() => setToast({ show: false, msg: "", type: "info" }), 3500);
  };

  const COMPANY_WALLET_ADDRESS = "0x53D944eDA838748A92F2c361d2F71cD7EcFc8643";

  const currentWalletBalance = Number(
    stats.availableBalance || user?.otbalance || user?.otBalance || user?.availableBalance || 0
  );

  const tenurePlans = [
    { days: 15, rate: 0.6, label: "15 Days (0.6%)" },
    { days: 30, rate: 0.8, label: "30 Days (0.8%)" },
    { days: 40, rate: 1.0, label: "40 Days (1.0%)" },
    { days: 60, rate: 1.5, label: "60 Days (1.5%)" },
    { days: 100, rate: 2.0, label: "100 Days (2.0%)" }
  ];

  const presetAmounts = [
    { label: "5k", value: 5000, desc: "Starter", color: "linear-gradient(135deg, #22c55e, #16a34a)" },
    { label: "7.5k", value: 7500, desc: "Basic", color: "linear-gradient(135deg, #0ea5e9, #0284c7)" },
    { label: "10k", value: 10000, desc: "Popular", color: "linear-gradient(135deg, #8b5cf6, #7c3aed)" },
    { label: "50k", value: 50000, desc: "Pro", color: "linear-gradient(135deg, #f59e0b, #d97706)" },
    { label: "100k", value: 100000, desc: "VIP", color: "linear-gradient(135deg, #ec4899, #db2777)" },
    { label: "500k", value: 500000, desc: "Master", color: "linear-gradient(135deg, #6366f1, #4f46e5)" }
  ];

  useEffect(() => {
    loadDashboardData();
  }, []);

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

  useEffect(() => {
    if (activeInvestment) {
      if (activeInvestment.amount) {
        setAmount(Number(activeInvestment.amount));
      }

      let days = 15;
      if (typeof activeInvestment.duration === "number") {
        days = activeInvestment.duration;
      } else if (typeof activeInvestment.duration === "string") {
        const match = activeInvestment.duration.match(/\d+/);
        if (match) days = parseInt(match[0], 10);
      } else if (activeInvestment.durationDays) {
        days = Number(activeInvestment.durationDays);
      }

      const matchedPlan = tenurePlans.find((p) => p.days === days);
      if (matchedPlan) {
        setTenure(matchedPlan.days);
        setRate(matchedPlan.rate);
      } else {
        setTenure(days);
        if (activeInvestment.dailyReturn && activeInvestment.amount) {
          const calcRate = (Number(activeInvestment.dailyReturn) / Number(activeInvestment.amount)) * 100;
          setRate(calcRate);
        }
      }

      if (activeInvestment.frequency) {
        setFrequency(activeInvestment.frequency.toLowerCase());
      }
    } else {
      setTenure(15);
      setRate(0.6);
      setFrequency("daily");
      setAmount(5000);
    }
  }, [activeInvestment]);

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
          const dateA = parseSafeDate(a.createdAt || a.startDate);
          const dateB = parseSafeDate(b.createdAt || b.startDate);
          return dateB - dateA;
        });

        setHistory(sortedHistory);

        const exactOneTimeEarnings = Number(
          data.stats?.totalEarnings ?? data.user?.oneTimeTotalEarnings ?? data.user?.totalEarnings ?? 0
        );

        let calculatedInv = 0;
        let calculatedWd = 0;

        sortedHistory.forEach((item) => {
          const t = (item.type || "").toLowerCase();
          const status = (item.status || "").toLowerCase();
          
          const isAddFund = t.includes("add fund") || t.includes("deposit") || t.includes("add money");
          const isInvestment = t.includes("investment") || t === "onetimeinvestment";
          const isValidStatus = status === "active" || status === "completed";

          if (!isAddFund && isInvestment && isValidStatus) {
            calculatedInv += Number(item.amount || 0);
          }

          if (t === "withdrawal" && (status === "approved" || status === "accepted" || status === "success")) {
            calculatedWd += Number(item.amount || 0);
          }
        });

        setStats({
          totalInvested: calculatedInv,
          totalEarnings: exactOneTimeEarnings,
          totalWithdrawn: calculatedWd,
          availableBalance: Number(data.user?.otbalance || data.user?.otBalance || 0)
        });

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
      } else {
        triggerToast(data.message || "Failed to load dashboard", "error");
      }
    } catch (err) {
      triggerToast("Network error. Please try again.", "error");
    } finally {
      setLoading(false);
    }
  };

  const dailyReturn = useMemo(() => {
    if (activeInvestment && activeInvestment.dailyReturn) {
      return Number(activeInvestment.dailyReturn);
    }
    return (Number(amount) * Number(rate)) / 100;
  }, [amount, rate, activeInvestment]);

  const hasWithdrawnToday = useMemo(() => {
    const todayStr = new Date().toDateString();
    return history.some((item) => {
      const typeStr = (item.type || "").toLowerCase();
      if (typeStr !== "withdrawal" && !typeStr.includes("withdraw")) return false;

      const itemDate = parseSafeDate(item.createdAt || item.startDate || item.date).toDateString();
      const status = (item.status || "").toLowerCase();

      const isBlocked = ["pending", "approved", "accepted", "success"].includes(status);
      return itemDate === todayStr && isBlocked;
    });
  }, [history]);

  const weeklyReturn = useMemo(() => dailyReturn * 7, [dailyReturn]);
  const totalReturn = useMemo(() => dailyReturn * tenure, [dailyReturn, tenure]);
  const totalPayout = useMemo(() => Number(amount) + totalReturn, [amount, totalReturn]);

  const handleTenureChange = (e) => {
    if (activeInvestment) return;
    const selectedDays = Number(e.target.value);
    const plan = tenurePlans.find((p) => p.days === selectedDays);
    if (plan) {
      setTenure(plan.days);
      setRate(plan.rate);
    }
  };

  const handleStartInvestment = async () => {
    if (activeInvestment) {
      triggerToast("Your investment is currently ongoing. No new investments can be made until it is finished.", "error");
      return;
    }

    if (currentWalletBalance < amount) {
      triggerToast(`Insufficient balance! Your wallet balance is ₹${currentWalletBalance}. Please Add Fund first.`, "error");
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
          amount: Number(amount),
          duration: `${tenure} Days`,
          frequency,
          dailyReturn,
          status: "Active"
        })
      });

      const data = await res.json();
      if (res.ok || data.success) {
        triggerToast("🚀 Investment Started Successfully!", "success");
        await loadDashboardData();
      } else {
        triggerToast(data.message || data.msg || "Failed to create investment", "error");
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
      formData.append("amount", amount);
      formData.append("transactionId", txnId);
      formData.append("screenshot", screenshot);

      const res = await fetch(`${API}/api/onetime/deposit-request`, {
        method: "POST",
        headers: { authorization: token },
        body: formData
      });

      const data = await res.json();
      if (res.ok || data.success) {
        triggerToast("Deposit request submitted! Status: Pending", "success");
        setShowAddFundModal(false);

        const newPendingDeposit = {
          _id: data.deposit?._id || Date.now().toString(),
          type: "Add Fund",
          amount: Number(amount),
          transactionId: txnId,
          status: "Pending",
          createdAt: new Date().toISOString()
        };

        setHistory((prev) => [newPendingDeposit, ...prev]);
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

  const handleSaveBankDetails = async (e) => {
    e.preventDefault();
    if (!bankForm.accountNumber || !bankForm.ifsc || !bankForm.bankName || !bankForm.holderName) {
      triggerToast("Please fill all bank details", "error");
      return;
    }

    try {
      const res = await fetch(`${API}/api/onetime/add-bank-details`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          authorization: token
        },
        body: JSON.stringify({ email, bankDetails: bankForm })
      });

      const data = await res.json();
      if (res.ok) {
        setUser((prev) => ({ ...prev, bankDetails: bankForm }));
        setShowBankModal(false);
        triggerToast("Bank Details Saved!", "success");
        setShowWithdrawModal(true);
      } else {
        triggerToast(data.message || "Failed to save bank details", "error");
      }
    } catch (err) {
      triggerToast("Failed to save bank details", "error");
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
    if (hasWithdrawnToday) {
      triggerToast("You have already placed a withdrawal request today!", "error");
      return;
    }

    if (currentWalletBalance < dailyReturn) {
      triggerToast(`Insufficient Wallet Balance! Your balance is ₹${currentWalletBalance}`, "error");
      return;
    }

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
          amount: Number(dailyReturn),
          bankDetails: user.bankDetails || bankForm
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        triggerToast(data.message || "Withdrawal Request Submitted!", "success");
        setShowWithdrawModal(false);
        await loadDashboardData();
      } else {
        triggerToast(data.message || "Withdrawal Failed", "error");
      }
    } catch (err) {
      console.error("Withdrawal error:", err);
      triggerToast("Network error during withdrawal. Please check console.", "error");
    } finally {
      setWithdrawing(false);
    }
  };

  const handleCopyWallet = () => {
    navigator.clipboard.writeText(COMPANY_WALLET_ADDRESS);
    triggerToast("Wallet Address Copied!", "success");
  };

  const fileUrl = (file) => {
    if (!file) return "";
    return file.startsWith("http") ? file : `${API}/uploads/${file}`;
  };

  const profilePhoto = fileUrl(user?.photo || user?.profilePhoto || user?.avatar || "");

  if (loading) {
    return (
      <div style={styles.loadingPage}>
        <div style={{ textAlign: "center" }}>
          <div style={styles.spinner}></div>
          <h3 style={{ color: "#22c55e", marginTop: "14px", fontSize: "18px", fontWeight: "700" }}>Loading Dashboard...</h3>
        </div>
      </div>
    );
  }

  const displayedHistory = showAllHistory ? history : history.slice(0, 5);

  return (
    <div style={styles.page}>
      {/* SIDEBAR DRAWER */}
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
                onClick={() => { navigate("/home"); setIsDrawerOpen(false); }}
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
                onClick={() => { navigate("/my-investment"); setIsDrawerOpen(false); }}
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
                onClick={() => { navigate("/save-money"); setIsDrawerOpen(false); }}
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
                onClick={() => { navigate("/one-time"); setIsDrawerOpen(false); }}
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
                onClick={() => { navigate("/wallet"); setIsDrawerOpen(false); }}
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
                onClick={() => { navigate("/refer"); setIsDrawerOpen(false); }}
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
                onClick={() => { navigate("/withdraw"); setIsDrawerOpen(false); }}
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
                onClick={() => { navigate("/daily-reward"); setIsDrawerOpen(false); }}
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
                onClick={() => { navigate("/investment-assistant"); setIsDrawerOpen(false); }}
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
                onClick={() => { navigate("/support"); setIsDrawerOpen(false); }}
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
                onClick={() => { navigate("/kyc"); setIsDrawerOpen(false); }}
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

      <div style={styles.container}>
        {/* TOAST ALERT */}
        {toast.show && (
          <div style={{ ...styles.toast, background: toast.type === "error" ? "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)" : "linear-gradient(135deg, #16a34a 0%, #15803d 100%)" }}>
            <span style={{ fontSize: "16px" }}>{toast.type === "error" ? "⚠️" : "✅"}</span>
            <span>{toast.msg}</span>
          </div>
        )}

        {/* FIXED SMOOTH MARQUEE NOTICE BANNER */}
        <div style={styles.topNoticeBanner}>
          <span style={styles.noticeBadge}>LIMITED OFFER 🔥</span>
          <div style={styles.marqueeContainer}>
            <div style={styles.marqueeText}>
              Thank you for choosing <strong style={{ color: "#4ade80" }}>Save Money</strong>! Refer your friend to invest today and get <span style={styles.bonusHighlight}>up to 15% flat bonus!</span> 🎉
            </div>
          </div>
        </div>

        {/* HEADER */}
        <header style={styles.header}>
          <div style={styles.headerLeft}>
            <button 
              style={styles.menuButton}
              onClick={() => setIsDrawerOpen(true)}
            >
              ☰
            </button>
            <div>
              <h1 style={styles.welcomeTitle}>
                Welcome Back! 👏
              </h1>
              <p style={styles.welcomeSub}>Invest smartly & secure your future</p>
            </div>
          </div>

          <div style={styles.profileCircle} onClick={() => navigate("/kyc")}>
            {profilePhoto ? (
              <img src={profilePhoto} alt="User Profile" style={styles.profileImg} />
            ) : (
              <div style={styles.profileAvatarPlaceholder}>
                <span style={{ fontSize: "16px", color: "#fff", fontWeight: "bold" }}>
                  {user?.name ? user.name.charAt(0).toUpperCase() : "U"}
                </span>
              </div>
            )}
          </div>
        </header>

        {/* TOP HERO BANNER */}
        <div style={styles.topHeroBanner}>
          <div style={styles.heroTextContent}>
            <h2 style={styles.heroTitle}>
              Chhote nivesh se <br />
              <span style={{ color: "#facc15" }}>badi kamai ka safar,</span> <br />
              <span style={{ color: "#f1f5f9" }}>har mahine ka plan, hamesha</span>
            </h2>
            <p style={styles.heroDesc}>
              Invest small amounts monthly to get big returns together
            </p>
          </div>
          <div style={styles.heroImgWrapper}>
            <img 
              src="/chhote nivesh.png" 
              alt="Chhote Nivesh" 
              style={styles.heroBannerImage}
              onError={(e) => { e.target.style.display = 'none'; }}
            />
          </div>
        </div>

        {/* STAT CARDS GRID */}
        <section style={styles.statsGridContainer}>
          <div style={styles.darkStatCard}>
            <div style={styles.statCardHeader}>
              <div style={{ ...styles.iconBox, background: "rgba(34, 197, 94, 0.15)" }}>
                <span style={{ color: "#22c55e", fontSize: "18px" }}>💼</span>
              </div>
              <span style={styles.statCardTitle}>Total Invested</span>
            </div>
            <strong style={styles.statCardValue}>
              ₹ {Number(stats.totalInvested || 0).toLocaleString("en-IN")}
            </strong>
          </div>

          <div style={styles.darkStatCard}>
            <div style={styles.statCardHeader}>
              <div style={{ ...styles.iconBox, background: "rgba(56, 189, 248, 0.15)" }}>
                <span style={{ color: "#38bdf8", fontSize: "18px" }}>💵</span>
              </div>
              <span style={styles.statCardTitle}>Total Earnings</span>
            </div>
            <strong style={styles.statCardValue}>
              ₹ {Number(stats.totalEarnings || 0).toLocaleString("en-IN")}
            </strong>
          </div>

          <div style={styles.darkStatCard}>
            <div style={styles.statCardHeader}>
              <div style={{ ...styles.iconBox, background: "rgba(168, 85, 247, 0.15)" }}>
                <span style={{ color: "#a855f7", fontSize: "18px" }}>💸</span>
              </div>
              <span style={styles.statCardTitle}>Total Withdraw</span>
            </div>
            <strong style={styles.statCardValue}>
              ₹ {Number(stats.totalWithdrawn || 0).toLocaleString("en-IN")}
            </strong>
          </div>

          <div style={styles.darkStatCard}>
            <div style={styles.statCardHeader}>
              <div style={{ ...styles.iconBox, background: "rgba(234, 179, 8, 0.15)" }}>
                <span style={{ color: "#eab308", fontSize: "18px" }}>🪙</span>
              </div>
              <span style={styles.statCardTitle}>Available Balance</span>
            </div>
            <strong style={styles.statCardValue}>
              ₹ {currentWalletBalance.toLocaleString("en-IN")}
            </strong>
          </div>
        </section>

        {/* MAKE NEW INVESTMENT PANEL */}
        <section style={styles.darkMainCard}>
          <h2 style={styles.darkCardTitle}>Make a New Investment</h2>

          {activeInvestment && (
            <div style={styles.activeInvestCardDark}>
              <div style={styles.activeHeader}>
                <div style={styles.activeBadgeGroup}>
                  <span style={styles.activePulse}></span>
                  <strong style={styles.activeTitle}>ACTIVE INVESTMENT RUNNING</strong>
                </div>
                <span style={styles.activeStatusTagDark}>🟢 Live Earning</span>
              </div>

              <div style={styles.activeStatsGrid}>
                <div style={styles.activeStatItem}>
                  <span style={styles.activeLabel}>Invested Amount</span>
                  <strong style={styles.activeValue}>₹{Number(activeInvestment.amount || 0).toLocaleString("en-IN")}</strong>
                </div>
                <div style={styles.activeStatItem}>
                  <span style={styles.activeLabel}>Plan Duration</span>
                  <strong style={styles.activeValue}>{activeInvestment.duration || `${activeInvestment.durationDays || tenure} Days`}</strong>
                </div>
                <div style={styles.activeStatItem}>
                  <span style={styles.activeLabel}>Daily Earnings</span>
                  <strong style={{ ...styles.activeValue, color: "#22c55e" }}>₹{Number(dailyReturn).toFixed(2)} / day</strong>
                </div>
                <div style={styles.activeStatItem}>
                  <span style={styles.activeLabel}>Maturity Date</span>
                  <strong style={{ ...styles.activeValue, color: "#38bdf8" }}>
                    {activeInvestment.maturityDate ? formatDate(activeInvestment.maturityDate) : "In Progress"}
                  </strong>
                </div>
              </div>
            </div>
          )}

          <div style={styles.formGrid}>
            <div style={styles.fieldGroup}>
              <label style={styles.labelDark}>
                📌 Select Duration {activeInvestment && <span style={{ color: "#ef4444" }}>(🔒Active)</span>}
              </label>
              <select
                style={{
                  ...styles.selectDark,
                  ...(activeInvestment ? styles.lockedInputDark : {})
                }}
                value={tenure}
                onChange={handleTenureChange}
                disabled={!!activeInvestment}
              >
                {tenurePlans.map((p) => (
                  <option key={p.days} value={p.days} style={{ background: "#0c1829", color: "#fff" }}>
                    {p.label}
                  </option>
                ))}
              </select>
            </div>

            <div style={styles.fieldGroup}>
              <label style={styles.labelDark}>
                🔄 Return Frequency {activeInvestment && <span style={{ color: "#ef4444" }}>(🔒Active)</span>}
              </label>
              <div style={styles.frequencyToggleDark}>
                <button
                  type="button"
                  style={{
                    ...styles.freqBtnDark,
                    ...(frequency === "daily" ? styles.freqBtnActiveDark : {})
                  }}
                  onClick={() => !activeInvestment && setFrequency("daily")}
                  disabled={!!activeInvestment}
                >
                  Daily
                </button>
                <button
                  type="button"
                  style={{
                    ...styles.freqBtnDark,
                    ...(frequency === "weekly" ? styles.freqBtnActiveDark : {})
                  }}
                  onClick={() => !activeInvestment && setFrequency("weekly")}
                  disabled={!!activeInvestment}
                >
                  Weekly
                </button>
              </div>
            </div>

            <div style={styles.fieldGroup}>
              <label style={styles.labelDark}>
                💵 Select / Enter Amount {activeInvestment && <span style={{ color: "#ef4444" }}>(🔒Active)</span>}
              </label>
              <div 
                style={styles.amountInputWrapDark} 
                onClick={() => !activeInvestment && setShowAmountModal(true)}
              >
                <span style={{ fontSize: "18px", fontWeight: "bold", color: "#22c55e" }}>₹</span>
                <input style={styles.amountInputDark} type="text" readOnly value={amount.toLocaleString("en-IN")} />
                <span style={activeInvestment ? styles.lockedBadgeDark : styles.changeBadgeDark}>
                  {activeInvestment ? "🔒 Locked" : "Change ⚙️"}
                </span>
              </div>
            </div>
          </div>

          <div style={styles.returnContainerDark}>
            <div style={styles.returnCardContent}>
              <span style={styles.returnBoxBagIcon}>🪙</span>
              <div>
                <div style={styles.returnCardTitleDark}>
                  You Will Get {frequency === "daily" ? "Daily" : "Weekly"} Return
                </div>
                <strong style={styles.returnCardValueDark}>
                  ₹ {frequency === "daily" ? dailyReturn.toFixed(2) : weeklyReturn.toFixed(2)}
                </strong>
                <span style={styles.returnCardNoteDark}>
                  (Approx. Return Per {frequency === "daily" ? "Day" : "Week"})
                </span>
              </div>
            </div>
          </div>

          <div style={styles.breakdownGridDark}>
            <div style={styles.breakBoxDark}>
              <span style={styles.breakLabelDark}>Investment Amount</span>
              <strong style={styles.breakValueDark}>₹ {Number(amount).toLocaleString("en-IN")}</strong>
            </div>
            <div style={styles.breakBoxDark}>
              <span style={styles.breakLabelDark}>Duration</span>
              <strong style={styles.breakValueDark}>{tenure} Days ({rate}%)</strong>
            </div>
            <div style={styles.breakBoxDark}>
              <span style={styles.breakLabelDark}>Total Return</span>
              <strong style={{ ...styles.breakValueDark, color: "#22c55e" }}>₹ {totalReturn.toLocaleString("en-IN")}</strong>
            </div>
            <div style={styles.breakBoxDark}>
              <span style={styles.breakLabelDark}>Total Payout</span>
              <strong style={{ ...styles.breakValueDark, color: "#38bdf8" }}>₹ {totalPayout.toLocaleString("en-IN")}</strong>
            </div>
          </div>

          <div style={styles.actionGridTriple}>
            <button 
              style={{
                ...styles.startInvestBtnDark,
                ...(activeInvestment ? styles.disabledBtnDark : {})
              }} 
              onClick={handleStartInvestment} 
              disabled={investing || !!activeInvestment}
            >
              {investing ? "Processing..." : activeInvestment ? "🚀 Active Running" : "🚀 Start Investment"}
            </button>

            <button style={styles.addInvestBtnDark} onClick={() => setShowAddFundModal(true)}>
              + Add Fund
            </button>

            <button style={styles.withdrawBtnDark} onClick={handleWithdrawClick}>
              ➔ Withdraw
            </button>
          </div>
        </section>

        {/* HISTORY TABLE */}
        <section style={styles.darkHistoryCard}>
          <div style={styles.historyHeader}>
            <h2 style={{ margin: 0, fontSize: "16px", color: "#f8fafc", fontWeight: "800" }}>Transaction History</h2>
            <span style={styles.refreshBtnDark} onClick={loadDashboardData}>🔄 Refresh</span>
          </div>

          <div style={styles.tableWrapper}>
            <table style={styles.tableDark}>
              <thead>
                <tr>
                  <th style={styles.thDark}>Date</th>
                  <th style={styles.thDark}>Type</th>
                  <th style={styles.thDark}>Amount</th>
                  <th style={styles.thDark}>Status</th>
                </tr>
              </thead>
              <tbody>
                {displayedHistory.length === 0 ? (
                  <tr>
                    <td colSpan="4" style={styles.emptyTdDark}>No history found</td>
                  </tr>
                ) : (
                  displayedHistory.map((item, idx) => {
                    const itemType = (item.type || "").toLowerCase();
                    const isDeposit = itemType.includes("add fund") || itemType.includes("deposit") || !!item.transactionId;
                    const isWithdraw = itemType.includes("withdraw");

                    const rawStatus = item.status || "Pending";
                    const isSuccess = ["approved", "accepted", "success", "active", "completed"].includes(rawStatus.toLowerCase());
                    const isRejected = ["rejected", "cancelled", "failed"].includes(rawStatus.toLowerCase());
                    const displayStatus = rawStatus.toLowerCase() === "active" ? "Active" : (isSuccess ? "Success" : isRejected ? "Rejected" : "Pending");

                    return (
                      <tr key={item._id || idx} style={styles.trDark}>
                        <td style={styles.tdDark}>{formatDate(item.createdAt || item.startDate)}</td>
                        <td style={styles.tdDark}>
                          {isDeposit ? "💳 Add Fund" : isWithdraw ? "💸 Withdrawal" : `🚀 ${item.duration || `${item.durationDays || tenure} Days`}`}
                        </td>
                        <td style={styles.tdDark}>₹ {Number(item.amount || 0).toLocaleString("en-IN")}</td>
                        <td style={styles.tdDark}>
                          <span style={{ ...styles.statusBadgeDark, ...getStatusStyleDark(displayStatus) }}>
                            {displayStatus}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          <div style={styles.viewAllFooter}>
            <span style={styles.viewAllLink} onClick={() => setShowAllHistory(!showAllHistory)}>
              {showAllHistory ? "Show Less 🔼" : "View All Transactions ➔"}
            </span>
          </div>
        </section>

        {/* FOOTER */}
        <footer style={styles.footerBar}>
          <p style={styles.footerTagline}>
            Chhote nivesh, badi kamai ka sapna, ab hoga sach! <strong style={{ color: "#22c55e" }}>SAVE MONEY</strong>! 💚
          </p>
          <div style={styles.footerCopyRow}>
            <span>© 2026 SAVE MONEY. All Rights Reserved.</span>
          </div>
        </footer>
      </div>

      {/* POPUP & MODALS */}
      {showOfferPopup && (
        <div style={styles.modalOverlay}>
          <div style={styles.offerPopupCard}>
            <button style={styles.offerCloseBtn} onClick={() => setShowOfferPopup(false)}>✕</button>
            <div style={styles.offerHeaderBadge}>🎁 EXCLUSIVE REFERRAL OFFER</div>
            <div style={styles.offerIconWrapper}>🚀</div>
            <h2 style={styles.offerTitle}>Thank you for choosing <span style={{ color: "#22c55e" }}>Save Money</span>!</h2>
            <p style={styles.offerDescription}>
              Refer your friend to invest today and get <br />
              <strong style={styles.offerHighlightText}>upto 15% flat bonus</strong> instantly!
            </p>
            <div style={styles.offerActionGroup}>
              <button style={styles.offerReferBtn} onClick={() => { setShowOfferPopup(false); navigate("/refer"); }}>
                👥 Refer Friend Now
              </button>
              <button style={styles.offerSkipBtn} onClick={() => setShowOfferPopup(false)}>Maybe Later</button>
            </div>
          </div>
        </div>
      )}

      {showAmountModal && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalCardDark}>
            <div style={styles.modalHeader}>
              <h3 style={{ margin: 0, fontSize: "18px", color: "#fff" }}>Select Amount</h3>
              <button style={styles.closeBtnDark} onClick={() => setShowAmountModal(false)}>✕</button>
            </div>
            <div style={styles.presetGrid}>
              {presetAmounts.map((p) => (
                <div
                  key={p.value}
                  style={{
                    ...styles.presetCard,
                    background: p.color,
                    border: amount === p.value ? "2px solid #ffffff" : "none"
                  }}
                  onClick={() => { setAmount(p.value); setShowAmountModal(false); }}
                >
                  <span style={styles.presetBadge}>{p.desc}</span>
                  <div style={styles.presetVal}>₹{p.value.toLocaleString("en-IN")}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {showAddFundModal && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalCardDark}>
            <div style={styles.modalHeader}>
              <h3 style={{ margin: 0, fontSize: "18px", color: "#fff" }}>Add Investment Fund</h3>
              <button style={styles.closeBtnDark} onClick={() => setShowAddFundModal(false)}>✕</button>
            </div>
            <p style={{ fontSize: "14px", color: "#cbd5e1", margin: "0 0 12px 0" }}>
              Send <strong style={{ color: "#22c55e" }}>₹{amount.toLocaleString("en-IN")}</strong> to company wallet:
            </p>
            <div style={styles.walletBoxDark}>
              <div style={styles.walletAddrRow}>
                <span style={styles.walletText}>{COMPANY_WALLET_ADDRESS}</span>
                <button style={styles.copyBtn} onClick={handleCopyWallet}>Copy</button>
              </div>
            </div>
            <form onSubmit={handleDepositSubmit} style={{ marginTop: "14px", display: "flex", flexDirection: "column", gap: "12px" }}>
              <div>
                <label style={styles.labelDark}>Transaction ID / UTR No.*</label>
                <input style={styles.inputModalDark} placeholder="Enter UTR / Txn Hash" value={txnId} onChange={(e) => setTxnId(e.target.value)} required />
              </div>
              <div>
                <label style={styles.labelDark}>Screenshot Proof*</label>
                <input type="file" accept="image/*" style={styles.fileInputDark} onChange={(e) => setScreenshot(e.target.files[0])} required />
              </div>
              <button type="submit" style={styles.submitBtnDark} disabled={depositing}>
                {depositing ? "Uploading..." : "Submit Deposit Proof"}
              </button>
            </form>
          </div>
        </div>
      )}

      {showBankModal && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalCardDark}>
            <div style={styles.modalHeader}>
              <h3 style={{ margin: 0, fontSize: "18px", color: "#fff" }}>Add Bank Details</h3>
              <button style={styles.closeBtnDark} onClick={() => setShowBankModal(false)}>✕</button>
            </div>
            <form onSubmit={handleSaveBankDetails} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <input style={styles.inputModalDark} placeholder="Holder Name" value={bankForm.holderName} onChange={(e) => setBankForm({ ...bankForm, holderName: e.target.value })} required />
              <input style={styles.inputModalDark} placeholder="Bank Name" value={bankForm.bankName} onChange={(e) => setBankForm({ ...bankForm, bankName: e.target.value })} required />
              <input style={styles.inputModalDark} placeholder="Account Number" value={bankForm.accountNumber} onChange={(e) => setBankForm({ ...bankForm, accountNumber: e.target.value })} required />
              <input style={styles.inputModalDark} placeholder="IFSC Code" value={bankForm.ifsc} onChange={(e) => setBankForm({ ...bankForm, ifsc: e.target.value })} required />
              <button type="submit" style={styles.submitBtnDark}>Save Details</button>
            </form>
          </div>
        </div>
      )}

      {showWithdrawModal && (
        <div style={styles.modalOverlay}>
          <div style={styles.withdrawModalCardDark}>
            <div style={styles.modalHeader}>
              <h3 style={{ margin: 0, fontSize: "18px", color: "#fff" }}>Withdraw Funds</h3>
              <button style={styles.closeBtnDark} onClick={() => setShowWithdrawModal(false)}>✕</button>
            </div>
            <div style={{ ...styles.withdrawBalanceCard, borderColor: currentWalletBalance < dailyReturn ? "#f87171" : "#4ade80" }}>
              <span style={{ fontSize: "12px", color: "#94a3b8" }}>Available Balance</span>
              <strong style={{ fontSize: "22px", color: currentWalletBalance < dailyReturn ? "#f87171" : "#4ade80", display: "block" }}>
                ₹ {currentWalletBalance.toLocaleString("en-IN")}
              </strong>
            </div>
            <button
              style={{
                ...styles.submitBtnDark,
                marginTop: "16px",
                background: (currentWalletBalance < dailyReturn || hasWithdrawnToday) ? "#334155" : "#16a34a"
              }}
              onClick={handleWithdrawSubmit}
              disabled={withdrawing || currentWalletBalance < dailyReturn || hasWithdrawnToday}
            >
              {withdrawing ? "Processing..." : hasWithdrawnToday ? "Already Requested" : "Confirm Withdrawal"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

const getStatusStyleDark = (status) => {
  const s = (status || "").toLowerCase();
  if (s === "success" || s === "active" || s === "approved" || s === "accepted") {
    return { background: "rgba(34, 197, 94, 0.2)", color: "#4ade80" };
  }
  if (s === "pending") {
    return { background: "rgba(234, 179, 8, 0.2)", color: "#facc15" };
  }
  return { background: "rgba(239, 68, 68, 0.2)", color: "#f87171" };
};

// ----------------- STYLES -----------------
const styles = {
  page: {
    minHeight: "100vh",
    width: "100%",
    background: "#030a16",
    padding: "12px",
    fontFamily: "system-ui, -apple-system, sans-serif",
    color: "#f8fafc",
    boxSizing: "border-box",
    display: "flex",
    justifyContent: "center"
  },
  container: {
    width: "100%",
    maxWidth: "480px",
    display: "flex",
    flexDirection: "column",
    gap: "16px"
  },
  loadingPage: {
    minHeight: "100vh",
    background: "#030a16",
    display: "flex",
    alignItems: "center",
    justifyContent: "center"
  },
  spinner: {
    width: "36px",
    height: "36px",
    border: "3px solid rgba(34, 197, 94, 0.2)",
    borderTop: "3px solid #22c55e",
    borderRadius: "50%",
    animation: "spin 1s linear infinite"
  },
  toast: {
    position: "fixed",
    top: "16px",
    left: "50%",
    transform: "translateX(-50%)",
    color: "white",
    padding: "10px 20px",
    borderRadius: "20px",
    zIndex: 999999,
    fontWeight: "700",
    fontSize: "13px",
    display: "flex",
    alignItems: "center",
    gap: "8px",
    boxShadow: "0 4px 15px rgba(0,0,0,0.5)"
  },
  topNoticeBanner: {
    background: "linear-gradient(90deg, #052e16 0%, #064e3b 100%)",
    border: "1px solid #22c55e",
    borderRadius: "10px",
    padding: "8px 12px",
    display: "flex",
    alignItems: "center",
    gap: "8px",
    overflow: "hidden"
  },
  noticeBadge: {
    background: "#f59e0b",
    color: "#000",
    fontWeight: "900",
    fontSize: "10px",
    padding: "2px 6px",
    borderRadius: "4px",
    whiteSpace: "nowrap",
    flexShrink: 0
  },
  marqueeContainer: {
    overflow: "hidden",
    whiteSpace: "nowrap",
    flex: 1,
    display: "flex",
    alignItems: "center"
  },
  marqueeText: {
    display: "inline-block",
    whiteSpace: "nowrap",
    animation: "marquee 25s linear infinite",
    fontSize: "11px",
    fontWeight: "600",
    color: "#e2e8f0"
  },
  bonusHighlight: {
    color: "#facc15",
    fontWeight: "900"
  },
  header: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between"
  },
  headerLeft: {
    display: "flex",
    alignItems: "center",
    gap: "12px"
  },
  menuButton: {
    background: "transparent",
    border: "none",
    color: "white",
    fontSize: "24px",
    cursor: "pointer",
    padding: "0"
  },
  welcomeTitle: {
    margin: 0,
    fontSize: "16px",
    fontWeight: "800",
    color: "#ffffff"
  },
  welcomeSub: {
    margin: 0,
    fontSize: "11px",
    color: "#94a3b8"
  },
  profileCircle: {
    width: "40px",
    height: "40px",
    borderRadius: "50%",
    background: "#0c1f38",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    border: "2px solid #10b981",
    cursor: "pointer"
  },
  profileImg: {
    width: "100%",
    height: "100%",
    objectFit: "cover"
  },
  profileAvatarPlaceholder: {
    width: "100%",
    height: "100%",
    background: "#10b981",
    display: "flex",
    alignItems: "center",
    justifyContent: "center"
  },
  topHeroBanner: {
    background: "linear-gradient(135deg, #062319 0%, #06182e 100%)",
    borderRadius: "14px",
    padding: "14px",
    border: "1px solid rgba(34, 197, 94, 0.3)",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "10px"
  },
  heroTextContent: {
    flex: 1
  },
  heroTitle: {
    margin: 0,
    fontSize: "13px",
    fontWeight: "700",
    color: "#ffffff",
    lineHeight: "1.3"
  },
  heroDesc: {
    margin: "6px 0 0 0",
    fontSize: "10px",
    color: "#cbd5e1"
  },
  heroImgWrapper: {
    width: "80px",
    height: "60px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0
  },
  heroBannerImage: {
    maxWidth: "100%",
    maxHeight: "100%",
    objectFit: "contain"
  },
  statsGridContainer: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "10px"
  },
  darkStatCard: {
    background: "#081628",
    borderRadius: "12px",
    padding: "12px",
    border: "1px solid rgba(255, 255, 255, 0.1)",
    display: "flex",
    flexDirection: "column"
  },
  statCardHeader: {
    display: "flex",
    alignItems: "center",
    gap: "6px"
  },
  iconBox: {
    width: "28px",
    height: "28px",
    borderRadius: "6px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center"
  },
  statCardTitle: {
    fontSize: "11px",
    color: "#cbd5e1",
    fontWeight: "600"
  },
  statCardValue: {
    fontSize: "16px",
    fontWeight: "800",
    color: "#ffffff",
    marginTop: "6px"
  },
  darkMainCard: {
    background: "#081628",
    borderRadius: "14px",
    padding: "14px",
    border: "1px solid rgba(255, 255, 255, 0.1)"
  },
  darkCardTitle: {
    margin: "0 0 12px 0",
    fontSize: "15px",
    fontWeight: "800",
    color: "#ffffff"
  },
  activeInvestCardDark: {
    background: "#040d1a",
    borderRadius: "10px",
    padding: "10px",
    marginBottom: "12px",
    border: "1px solid #16a34a"
  },
  activeHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "8px"
  },
  activeBadgeGroup: {
    display: "flex",
    alignItems: "center",
    gap: "6px"
  },
  activePulse: {
    width: "8px",
    height: "8px",
    borderRadius: "50%",
    background: "#22c55e"
  },
  activeTitle: {
    fontSize: "10px",
    color: "#22c55e"
  },
  activeStatusTagDark: {
    fontSize: "10px",
    background: "rgba(34, 197, 94, 0.2)",
    color: "#4ade80",
    padding: "2px 6px",
    borderRadius: "8px"
  },
  activeStatsGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "8px"
  },
  activeStatItem: {
    display: "flex",
    flexDirection: "column"
  },
  activeLabel: {
    fontSize: "10px",
    color: "#94a3b8"
  },
  activeValue: {
    fontSize: "12px",
    fontWeight: "bold",
    color: "#f8fafc"
  },
  formGrid: {
    display: "flex",
    flexDirection: "column",
    gap: "10px"
  },
  fieldGroup: {
    display: "flex",
    flexDirection: "column"
  },
  labelDark: {
    fontSize: "11px",
    fontWeight: "700",
    marginBottom: "4px",
    color: "#e2e8f0"
  },
  selectDark: {
    height: "40px",
    borderRadius: "8px",
    border: "1px solid #334155",
    background: "#0f2138",
    color: "#ffffff",
    padding: "0 10px",
    fontSize: "13px"
  },
  lockedInputDark: {
    opacity: 0.6,
    cursor: "not-allowed"
  },
  frequencyToggleDark: {
    display: "flex",
    gap: "8px",
    height: "40px"
  },
  freqBtnDark: {
    flex: 1,
    borderRadius: "8px",
    border: "1px solid #334155",
    background: "#0f2138",
    color: "#cbd5e1",
    fontSize: "12px",
    fontWeight: "bold"
  },
  freqBtnActiveDark: {
    background: "#16a34a",
    color: "#ffffff",
    borderColor: "#16a34a"
  },
  amountInputWrapDark: {
    height: "40px",
    borderRadius: "8px",
    border: "1px solid #334155",
    background: "#0f2138",
    padding: "0 10px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between"
  },
  amountInputDark: {
    border: "none",
    background: "transparent",
    fontSize: "14px",
    fontWeight: "bold",
    color: "#ffffff",
    outline: "none",
    width: "60%"
  },
  changeBadgeDark: {
    fontSize: "11px",
    color: "#38bdf8",
    fontWeight: "bold"
  },
  lockedBadgeDark: {
    fontSize: "11px",
    color: "#ef4444"
  },
  returnContainerDark: {
    background: "#dcfce7",
    borderRadius: "10px",
    padding: "12px",
    textAlign: "center",
    margin: "12px 0",
    color: "#166534"
  },
  returnCardContent: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "10px"
  },
  returnBoxBagIcon: {
    fontSize: "24px"
  },
  returnCardTitleDark: {
    fontSize: "12px",
    fontWeight: "700"
  },
  returnCardValueDark: {
    fontSize: "20px",
    fontWeight: "900",
    display: "block"
  },
  returnCardNoteDark: {
    fontSize: "10px"
  },
  breakdownGridDark: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "8px",
    background: "#040d1a",
    borderRadius: "8px",
    padding: "8px",
    margin: "12px 0"
  },
  breakBoxDark: {
    textAlign: "center"
  },
  breakLabelDark: {
    display: "block",
    fontSize: "10px",
    color: "#94a3b8"
  },
  breakValueDark: {
    fontSize: "12px",
    fontWeight: "bold",
    color: "#ffffff"
  },
  actionGridTriple: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr 1fr",
    gap: "8px"
  },
  startInvestBtnDark: {
    height: "40px",
    borderRadius: "8px",
    border: "none",
    background: "#22c55e",
    color: "#ffffff",
    fontSize: "11px",
    fontWeight: "bold",
    cursor: "pointer"
  },
  disabledBtnDark: {
    background: "#334155",
    color: "#94a3b8",
    cursor: "not-allowed"
  },
  addInvestBtnDark: {
    height: "40px",
    borderRadius: "8px",
    border: "none",
    background: "#2563eb",
    color: "white",
    fontSize: "11px",
    fontWeight: "bold",
    cursor: "pointer"
  },
  withdrawBtnDark: {
    height: "40px",
    borderRadius: "8px",
    background: "#0f172a",
    border: "1px solid #334155",
    color: "white",
    fontSize: "11px",
    fontWeight: "bold",
    cursor: "pointer"
  },
  darkHistoryCard: {
    background: "#081628",
    borderRadius: "14px",
    padding: "12px",
    border: "1px solid rgba(255, 255, 255, 0.1)"
  },
  historyHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "10px"
  },
  refreshBtnDark: {
    color: "#22c55e",
    fontSize: "11px",
    fontWeight: "bold",
    cursor: "pointer"
  },
  tableWrapper: {
    overflowX: "auto"
  },
  tableDark: {
    width: "100%",
    borderCollapse: "collapse",
    fontSize: "11px"
  },
  thDark: {
    background: "#040d1a",
    padding: "8px",
    color: "#cbd5e1",
    textAlign: "left"
  },
  trDark: {
    borderBottom: "1px solid rgba(255, 255, 255, 0.08)"
  },
  tdDark: {
    padding: "8px",
    color: "#f8fafc"
  },
  emptyTdDark: {
    textAlign: "center",
    padding: "16px",
    color: "#94a3b8"
  },
  statusBadgeDark: {
    padding: "2px 6px",
    borderRadius: "6px",
    fontSize: "10px",
    fontWeight: "bold"
  },
  viewAllFooter: {
    textAlign: "center",
    marginTop: "10px"
  },
  viewAllLink: {
    color: "#22c55e",
    fontSize: "11px",
    fontWeight: "bold",
    cursor: "pointer"
  },
  footerBar: {
    textAlign: "center",
    padding: "12px 0",
    borderTop: "1px solid rgba(255, 255, 255, 0.1)"
  },
  footerTagline: {
    fontSize: "11px",
    color: "#cbd5e1",
    margin: "0 0 4px 0"
  },
  footerCopyRow: {
    fontSize: "10px",
    color: "#64748b"
  },

  // SIDEBAR STYLES
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
    justifyContent: "center"
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
    border: "1px solid rgba(255, 255, 255, 0.25)",
    clipPath: "polygon(10px 0%, calc(100% - 10px) 0%, 100% 50%, calc(100% - 10px) 100%, 10px 100%, 0% 50%)",
    color: "#ffffff",
    fontSize: "12px",
    fontWeight: "800",
    cursor: "pointer",
    textAlign: "left"
  },
  drawerNavItemActive: {
    background: "rgba(255, 255, 255, 0.3)",
    border: "1px solid #ffffff",
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
    letterSpacing: "0.3px"
  },
  drawerNavDashboard: { background: "rgba(59, 130, 246, 0.25)", border: "1px solid rgba(59, 130, 246, 0.5)" },
  drawerNavMyInvestment: { background: "rgba(16, 185, 129, 0.25)", border: "1px solid rgba(16, 185, 129, 0.5)" },
  drawerNavSaveMoney: { background: "rgba(245, 158, 11, 0.25)", border: "1px solid rgba(245, 158, 11, 0.5)" },
  drawerNavOneTime: { background: "rgba(168, 85, 247, 0.25)", border: "1px solid rgba(168, 85, 247, 0.5)" },
  drawerNavPlan: { background: "rgba(6, 182, 212, 0.25)", border: "1px solid rgba(6, 182, 212, 0.5)" },
  drawerNavAddFund: { background: "rgba(20, 184, 166, 0.25)", border: "1px solid rgba(20, 184, 166, 0.5)" },
  drawerNavRefer: { background: "rgba(236, 72, 153, 0.25)", border: "1px solid rgba(236, 72, 153, 0.5)" },
  drawerNavWithdraw: { background: "rgba(249, 115, 22, 0.25)", border: "1px solid rgba(249, 115, 22, 0.5)" },
  drawerNavDailyReward: { background: "rgba(244, 63, 94, 0.25)", border: "1px solid rgba(244, 63, 94, 0.5)" },
  drawerNavInvestmentAssistant: { background: "rgba(2, 132, 199, 0.25)", border: "1px solid rgba(2, 132, 199, 0.5)" },
  drawerNavSupport: { background: "rgba(99, 102, 241, 0.25)", border: "1px solid rgba(99, 102, 241, 0.5)" },
  drawerNavProfile: { background: "rgba(236, 72, 153, 0.25)", border: "1px solid rgba(236, 72, 153, 0.5)" },
  drawerNavLogout: { background: "rgba(239, 68, 68, 0.25)", border: "1px solid rgba(239, 68, 68, 0.5)" },

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
    borderRadius: "12px"
  },

  // MODALS
  modalOverlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(0, 0, 0, 0.8)",
    backdropFilter: "blur(4px)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 99999,
    padding: "12px"
  },
  modalCardDark: {
    background: "#081628",
    borderRadius: "16px",
    padding: "16px",
    width: "100%",
    maxWidth: "360px",
    border: "1px solid rgba(255, 255, 255, 0.1)"
  },
  withdrawModalCardDark: {
    background: "#09182b",
    borderRadius: "16px",
    padding: "16px",
    width: "100%",
    maxWidth: "360px",
    border: "1px solid rgba(56, 189, 248, 0.3)"
  },
  withdrawBalanceCard: {
    padding: "12px",
    borderRadius: "10px",
    border: "1px solid",
    textAlign: "center"
  },
  modalHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "12px"
  },
  closeBtnDark: {
    border: "none",
    background: "#0f2138",
    color: "#fff",
    borderRadius: "50%",
    width: "28px",
    height: "28px",
    cursor: "pointer",
    fontSize: "14px"
  },
  offerPopupCard: {
    background: "#091a2e",
    borderRadius: "16px",
    padding: "20px",
    width: "100%",
    maxWidth: "340px",
    border: "1px solid #22c55e",
    textAlign: "center",
    position: "relative"
  },
  offerCloseBtn: {
    position: "absolute",
    top: "10px",
    right: "10px",
    border: "none",
    background: "rgba(255,255,255,0.1)",
    color: "#fff",
    borderRadius: "50%",
    width: "28px",
    height: "28px",
    cursor: "pointer"
  },
  offerHeaderBadge: {
    background: "rgba(34, 197, 94, 0.15)",
    color: "#4ade80",
    padding: "4px 10px",
    borderRadius: "12px",
    fontSize: "10px",
    fontWeight: "bold",
    marginBottom: "10px",
    display: "inline-block"
  },
  offerIconWrapper: {
    fontSize: "36px",
    marginBottom: "8px"
  },
  offerTitle: {
    margin: "0 0 8px 0",
    fontSize: "16px",
    fontWeight: "800",
    color: "#ffffff"
  },
  offerDescription: {
    fontSize: "12px",
    color: "#cbd5e1",
    margin: "0 0 14px 0"
  },
  offerHighlightText: {
    color: "#facc15",
    fontSize: "14px"
  },
  offerActionGroup: {
    display: "flex",
    flexDirection: "column",
    gap: "8px"
  },
  offerReferBtn: {
    height: "38px",
    borderRadius: "8px",
    border: "none",
    background: "#22c55e",
    color: "#ffffff",
    fontSize: "12px",
    fontWeight: "bold",
    cursor: "pointer"
  },
  offerSkipBtn: {
    height: "32px",
    borderRadius: "8px",
    border: "none",
    background: "transparent",
    color: "#94a3b8",
    fontSize: "11px",
    cursor: "pointer"
  },
  presetGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "8px"
  },
  presetCard: {
    borderRadius: "8px",
    padding: "10px",
    color: "white",
    cursor: "pointer",
    textAlign: "center"
  },
  presetBadge: { fontSize: "10px", fontWeight: "bold" },
  presetVal: { fontSize: "14px", fontWeight: "800" },
  walletBoxDark: {
    background: "#040d1a",
    padding: "10px",
    borderRadius: "8px",
    border: "1px solid #1e293b"
  },
  walletAddrRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "6px"
  },
  walletText: { fontSize: "10px", wordBreak: "break-all", color: "#fff" },
  copyBtn: {
    background: "#16a34a",
    color: "white",
    border: "none",
    padding: "4px 8px",
    borderRadius: "4px",
    cursor: "pointer",
    fontSize: "10px",
    fontWeight: "bold"
  },
  inputModalDark: {
    width: "100%",
    height: "38px",
    borderRadius: "8px",
    border: "1px solid #334155",
    background: "#0f2138",
    color: "#fff",
    padding: "0 10px",
    fontSize: "12px",
    boxSizing: "border-box"
  },
  fileInputDark: { width: "100%", fontSize: "11px", color: "#cbd5e1" },
  submitBtnDark: {
    height: "38px",
    borderRadius: "8px",
    border: "none",
    background: "#16a34a",
    color: "white",
    fontWeight: "bold",
    fontSize: "12px",
    cursor: "pointer",
    width: "100%"
  }
};
