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
    @keyframes popupZoomIn {
      0% { transform: scale(0.7); opacity: 0; }
      100% { transform: scale(1); opacity: 1; }
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
  const [refreshing, setRefreshing] = useState(false);

  // AUTO IMAGE POPUP ON PAGE LOAD
  const [showImagePopup, setShowImagePopup] = useState(true);

  const [showBonusModal, setShowBonusModal] = useState(false);
  const [bonusInputCode, setBonusInputCode] = useState("");
  const [bonusList, setBonusList] = useState([]);

  const [selectedTxn, setSelectedTxn] = useState(null);

  const [user, setUser] = useState({});
  const [loading, setLoading] = useState(true);
  const [history, setHistory] = useState([]);

  const [stats, setStats] = useState({
    totalInvested: 0,
    totalEarnings: 0,
    totalWithdrawn: 0,
    availableBalance: 0
  });

  const [activeInvestment, setActiveInvestment] = useState(null);

  // Dynamic Investment Modal & Form States (Fetched from Backend)
  const [showInvestmentModal, setShowInvestmentModal] = useState(false);
  const [category, setCategory] = useState("beginner"); 
  const [backendPlans, setBackendPlans] = useState({ beginner: [], pro: [] });
  const [selectedPlanConfig, setSelectedPlanConfig] = useState(null);
  const [tenureMonths, setTenureMonths] = useState(9);
  const [customProTenure, setCustomProTenure] = useState(12);
  const [investing, setInvesting] = useState(false);

  // Modals
  const [showAddFundModal, setShowAddFundModal] = useState(false);
  const [showBankModal, setShowBankModal] = useState(false);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);

  const [showInvestWithdrawModal, setShowInvestWithdrawModal] = useState(false);
  const [showReinvestModal, setShowReinvestModal] = useState(false);

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
    stats.availableBalance || user?.otbalance || user?.otBalance || user?.availableBalance || 0
  );

  const mainAmount = Number(selectedPlanConfig?.amount) || 0;
  const gstRate = paymentMethodType === "fiat" ? 0.02 : 0;
  const gstAmount = Math.round(mainAmount * gstRate);
  const totalAddMoney = mainAmount + gstAmount;

  // Active Tenure & Backend Calculated Summary
  const activeTenureMonths = category === "beginner" ? tenureMonths : Math.max(12, Number(customProTenure) || 12);

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

        // ব্যাকএন্ড থেকে প্ল্যান কনফিগারেশন ফেচ করা
        if (data.plans || data.backendPlans) {
          setBackendPlans(data.plans || data.backendPlans);
        }

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

        let calculatedInv = 0;
        let calculatedWd = 0;
        let calculatedEarnings = 0;

        sortedHistory.forEach((item) => {
          const t = (item.type || "").toLowerCase();
          const status = (item.status || "").toLowerCase();
          
          const isAddFund = t.includes("add fund") || t.includes("deposit") || t.includes("add money");
          const isInvestment = t.includes("investment") || t === "onetimeinvestment";
          const isEarning = t.includes("earning") || t.includes("profit") || t.includes("daily return") || t.includes("roi") || t.includes("bonus");
          const isValidStatus = status === "active" || status === "completed" || status === "success" || status === "approved";

          if (!isAddFund && isInvestment && isValidStatus) {
            calculatedInv += Number(item.amount || 0);
          }

          if (t === "withdrawal" && (status === "approved" || status === "accepted" || status === "success")) {
            calculatedWd += Number(item.amount || 0);
          }

          if (isEarning && isValidStatus) {
            calculatedEarnings += Number(item.amount || 0);
          }
        });

        const backendEarnings = Number(
          data.stats?.totalEarnings ?? 
          data.user?.oneTimeTotalEarnings ?? 
          data.user?.totalEarnings ?? 
          data.totalEarnings ?? 
          0
        );

        const finalTotalEarnings = backendEarnings > 0 ? backendEarnings : calculatedEarnings;

        setStats({
          totalInvested: calculatedInv,
          totalEarnings: finalTotalEarnings,
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
      setRefreshing(false);
    }
  };

  const handleRefreshPage = async () => {
    setRefreshing(true);
    triggerToast("Refreshing data...", "info");
    await loadDashboardData();
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
        triggerToast(data.message || "Invalid or already used bonus code", "error");
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

  const { calculatedMaturityDate, isMatured, investmentDurationDays } = useMemo(() => {
    if (!activeInvestment) return { calculatedMaturityDate: "In Progress", isMatured: false, investmentDurationDays: "60 Days" };

    let maturityObj = null;

    if (activeInvestment.maturityDate || activeInvestment.maturity) {
      const parsedMaturity = parseSafeDate(activeInvestment.maturityDate || activeInvestment.maturity);
      if (!isNaN(parsedMaturity.getTime()) && parsedMaturity.getTime() > 0) {
        maturityObj = parsedMaturity;
      }
    }

    let durationDays = 60;
    if (typeof activeInvestment.duration === "number") {
      durationDays = activeInvestment.duration;
    } else if (typeof activeInvestment.duration === "string") {
      const match = activeInvestment.duration.match(/\d+/);
      if (match) {
        const val = parseInt(match[0], 10);
        durationDays = activeInvestment.duration.toLowerCase().includes("month") ? val * 30 : val;
      }
    } else if (activeInvestment.durationDays) {
      durationDays = Number(activeInvestment.durationDays);
    } else if (activeInvestment.tenureMonths) {
      durationDays = Number(activeInvestment.tenureMonths) * 30;
    }

    if (!maturityObj) {
      const startDateRaw = activeInvestment.startDate || activeInvestment.createdAt;
      if (startDateRaw) {
        const startDateObj = parseSafeDate(startDateRaw);
        if (!isNaN(startDateObj.getTime()) && startDateObj.getTime() > 0) {
          maturityObj = new Date(startDateObj);
          maturityObj.setDate(maturityObj.getDate() + durationDays);
        }
      }
    }

    if (maturityObj) {
      const today = new Date();
      const matured = today >= maturityObj;
      return {
        calculatedMaturityDate: formatDate(maturityObj),
        isMatured: matured,
        investmentDurationDays: `${durationDays} Days`
      };
    }

    return { calculatedMaturityDate: "In Progress", isMatured: false, investmentDurationDays: `${durationDays} Days` };
  }, [activeInvestment]);

  const isInvestmentLocked = useMemo(() => {
    return activeInvestment && !isMatured;
  }, [activeInvestment, isMatured]);

  const dailyReturn = useMemo(() => {
    if (isInvestmentLocked && activeInvestment && activeInvestment.dailyReturn) {
      return Number(activeInvestment.downloads || activeInvestment.dailyReturn);
    }
    return Number(selectedPlanConfig?.dailyReturn || 0);
  }, [selectedPlanConfig, activeInvestment, isInvestmentLocked]);

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

  // Open Modal and Fetch Calculation from Backend
  const openInvestmentModal = async (cat) => {
    if (isInvestmentLocked) {
      triggerToast("Your investment is currently locked.", "error");
      return;
    }
    setCategory(cat);
    setShowInvestmentModal(true);

    try {
      const res = await fetch(`${API}/api/onetime/get-plan-config`, {
        method: "POST",
        headers: { "Content-Type": "application/json", authorization: token },
        body: JSON.stringify({ category: cat, tenureMonths: cat === "beginner" ? 9 : 12 })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setSelectedPlanConfig(data.planConfig);
      }
    } catch (err) {
      console.log("Error fetching plan config:", err);
    }
  };

  const handleStartInvestment = async () => {
    if (isInvestmentLocked) {
      triggerToast("Your investment is currently ongoing.", "error");
      return;
    }

    if (currentWalletBalance < Number(selectedPlanConfig?.amount || 0)) {
      triggerToast("Insufficient wallet balance!", "error");
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
          category,
          amount: Number(selectedPlanConfig?.amount),
          duration: `${activeTenureMonths} Months`,
          tenureMonths: activeTenureMonths,
          withdrawLogicUpdatePending: bonusList.length > 0
        })
      });

      const data = await res.json();
      if (res.ok || data.success) {
        triggerToast("🚀 Investment Started Successfully!", "success");
        setShowInvestmentModal(false);
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
    if (!txnId || !screenshot) {
      triggerToast("Please fill all details and select screenshot", "error");
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
        triggerToast("Deposit request submitted successfully!", "success");
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

  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      if (window.Razorpay) {
        resolve(true);
        return;
      }
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handleRazorpayPayment = async () => {
    setRazorpayLoading(true);
    const resLoaded = await loadRazorpayScript();
    if (!resLoaded) {
      triggerToast("Razorpay SDK failed to load.", "error");
      setRazorpayLoading(false);
      return;
    }

    try {
      const orderRes = await fetch(`${API}/api/onetime/create-razorpay-order`, {
        method: "POST",
        headers: { "Content-Type": "application/json", authorization: token },
        body: JSON.stringify({ email, amount: Number(totalAddMoney) })
      });
      const orderData = await orderRes.json();

      if (!orderRes.ok || !orderData.success) {
        triggerToast(orderData.message || "Failed to create order", "error");
        setRazorpayLoading(false);
        return;
      }

      const options = {
        key: orderData.keyId,
        amount: Number(totalAddMoney) * 100,
        currency: orderData.currency || "INR",
        name: "Save Money",
        description: "Add Fund",
        order_id: orderData.orderId,
        handler: async function (response) {
          const verifyRes = await fetch(`${API}/api/onetime/verify-razorpay-payment`, {
            method: "POST",
            headers: { "Content-Type": "application/json", authorization: token },
            body: JSON.stringify({
              email,
              amount: Number(totalAddMoney),
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature
            })
          });
          const verifyData = await verifyRes.json();
          if (verifyRes.ok && verifyData.success) {
            triggerToast("🎉 Payment Successful!", "success");
            setShowAddFundModal(false);
            await loadDashboardData();
          }
        },
        theme: { color: "#f59e0b" }
      };

      const paymentObject = new window.Razorpay(options);
      paymentObject.open();
    } catch (err) {
      triggerToast("Payment failed", "error");
    } finally {
      setRazorpayLoading(false);
    }
  };

  const handleSaveBankDetails = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API}/api/onetime/add-bank-details`, {
        method: "POST",
        headers: { "Content-Type": "application/json", authorization: token },
        body: JSON.stringify({ email, bankDetails: bankForm })
      });
      if (res.ok) {
        setUser((prev) => ({ ...prev, bankDetails: bankForm }));
        setShowBankModal(false);
        triggerToast("Bank Details Saved!", "success");
        setShowWithdrawModal(true);
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
    if (bonusList.length > 0) {
      triggerToast("Your withdrawal logic update in progress! Minimum 72 hours needed.", "error");
      return;
    }

    if (hasWithdrawnToday) {
      triggerToast("Already requested withdrawal today!", "error");
      return;
    }

    try {
      setWithdrawing(true);
      const res = await fetch(`${API}/api/onetime/withdraw`, {
        method: "POST",
        headers: { "Content-Type": "application/json", authorization: token },
        body: JSON.stringify({ email: email.trim().toLowerCase(), amount: Number(dailyReturn), bankDetails: user.bankDetails })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        triggerToast("Withdrawal Request Submitted!", "success");
        setShowWithdrawModal(false);
        await loadDashboardData();
      }
    } catch (err) {
      triggerToast("Withdrawal failed", "error");
    } finally {
      setWithdrawing(false);
    }
  };

  const profilePhoto = user?.photo || user?.profilePhoto || user?.avatar || "";

  if (loading) {
    return (
      <div style={styles.loadingPage}>
        <div style={styles.spinner}></div>
      </div>
    );
  }

  const displayedHistory = showAllHistory ? history : history.slice(0, 5);

  return (
    <div style={styles.page}>
      {showImagePopup && (
        <div style={styles.modalOverlay} onClick={() => setShowImagePopup(false)}>
          <div style={styles.animatedPopupCard} onClick={(e) => e.stopPropagation()}>
            <button style={styles.closeImagePopupBtn} onClick={() => setShowImagePopup(false)}>✕</button>
            <img src="/onetime.png" alt="Bonus Rules" style={styles.bonusRulesImage} />
            <button style={styles.gotItBtn} onClick={() => setShowImagePopup(false)}>Understand & Continue ➔</button>
          </div>
        </div>
      )}

      <div style={styles.container}>
        {toast.show && (
          <div style={{ ...styles.toast, background: toast.type === "error" ? "#ef4444" : "#f59e0b" }}>
            <span>{toast.msg}</span>
          </div>
        )}

        <header style={styles.header}>
          <div style={styles.headerLeft}>
            <button style={styles.menuButton} onClick={() => setIsDrawerOpen(true)}>☰</button>
            <div>
              <h1 style={styles.brandTitle}>Save Money</h1>
              <p style={styles.brandSub}>Invest Smartly</p>
            </div>
          </div>
          <button style={styles.bonusPillBtn} onClick={() => setShowBonusModal(true)}>
            🎁 Bonus ({bonusList.length})
          </button>
        </header>

        <section style={styles.statsGrid}>
          <div style={styles.statCard}>
            <span style={styles.statTitle}>Total Invested</span>
            <strong style={styles.statValue}>₹ {Number(stats.totalInvested || 0).toLocaleString("en-IN")}</strong>
          </div>
          <div style={styles.statCard}>
            <span style={styles.statTitle}>Total Earnings</span>
            <strong style={styles.statValue}>₹ {Number(stats.totalEarnings || 0).toLocaleString("en-IN")}</strong>
          </div>
        </section>

        <section style={styles.makeInvestmentCard}>
          <h3>Make a New Investment</h3>
          <div style={styles.planButtonGrid}>
            <button style={styles.beginnerPlanMainBtn} onClick={() => openInvestmentModal("beginner")}>
              🌱 Beginner Investment
            </button>
            <button style={styles.proPlanMainBtn} onClick={() => openInvestmentModal("pro")}>
              👑 Pro Investment
            </button>
          </div>
        </section>

        <section style={styles.historyCard}>
          <h3>Transaction History</h3>
          <table style={styles.goldTable}>
            <thead>
              <tr>
                <th>Date</th>
                <th>Type</th>
                <th>Amount</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {displayedHistory.map((item, idx) => (
                <tr key={item._id || idx} onClick={() => setSelectedTxn(item)}>
                  <td>{formatDate(item.createdAt || item.startDate)}</td>
                  <td>{item.type || "Transaction"}</td>
                  <td>₹ {Number(item.amount || 0)}</td>
                  <td>{item.status || "Success"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      </div>

      {showInvestmentModal && selectedPlanConfig && (
        <div style={styles.modalOverlay} onClick={() => setShowInvestmentModal(false)}>
          <div style={styles.investmentModalCardDark} onClick={(e) => e.stopPropagation()}>
            <h3>{category.toUpperCase()} INVESTMENT</h3>
            <p>Amount: ₹{selectedPlanConfig.amount}</p>
            <p>Daily Return: ₹{selectedPlanConfig.dailyReturn}</p>
            <p>Total Payout: ₹{selectedPlanConfig.totalPayout}</p>
            <button style={styles.goldSubmitBtn} onClick={handleStartInvestment} disabled={investing}>
              {investing ? "Processing..." : "Start Investment 🚀"}
            </button>
          </div>
        </div>
      )}

      {showWithdrawModal && (
        <div style={styles.modalOverlay}>
          <div style={styles.withdrawModalCardDark}>
            <h3>Withdraw Funds</h3>
            {bonusList.length > 0 ? (
              <div style={{ color: "#38bdf8", padding: "10px", textAlign: "center" }}>
                ⏳ Your withdrawal logic update in progress! Minimum 72 hours needed.
              </div>
            ) : (
              <button style={styles.goldSubmitBtn} onClick={handleWithdrawSubmit}>Confirm Withdrawal</button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  page: { minHeight: "100vh", background: "#030712", padding: "12px", color: "#f9fafb", display: "flex", justifyContent: "center" },
  container: { width: "100%", maxWidth: "480px", display: "flex", flexDirection: "column", gap: "14px" },
  toast: { position: "fixed", top: "16px", left: "50%", transform: "translateX(-50%)", color: "white", padding: "10px 20px", borderRadius: "20px", zIndex: 999999 },
  header: { display: "flex", justifyContent: "space-between", alignItems: "center" },
  headerLeft: { display: "flex", gap: "10px", alignItems: "center" },
  menuButton: { background: "transparent", border: "none", color: "#fff", fontSize: "18px" },
  brandTitle: { margin: 0, fontSize: "16px" },
  brandSub: { margin: 0, fontSize: "9px", color: "#9ca3af" },
  bonusPillBtn: { background: "#d97706", border: "none", color: "#fff", padding: "6px 10px", borderRadius: "20px" },
  statsGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" },
  statCard: { background: "#d97706", borderRadius: "12px", padding: "12px" },
  statTitle: { fontSize: "11px", color: "#fef3c7" },
  statValue: { fontSize: "17px", fontWeight: "900" },
  makeInvestmentCard: { background: "#111827", border: "1px solid #facc15", borderRadius: "16px", padding: "14px" },
  planButtonGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginTop: "10px" },
  beginnerPlanMainBtn: { background: "#10b981", border: "none", borderRadius: "12px", padding: "14px", color: "#fff", fontWeight: "bold" },
  proPlanMainBtn: { background: "#f59e0b", border: "none", borderRadius: "12px", padding: "14px", color: "#fff", fontWeight: "bold" },
  historyCard: { background: "#111827", border: "1px solid #facc15", borderRadius: "16px", padding: "12px" },
  goldTable: { width: "100%", borderCollapse: "collapse", fontSize: "11px" },
  modalOverlay: { position: "fixed", inset: 0, background: "rgba(0,0,0,0.8)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 99999 },
  animatedPopupCard: { background: "#0f172a", border: "2px solid #facc15", borderRadius: "20px", padding: "12px", maxWidth: "380px" },
  investmentModalCardDark: { background: "#0f172a", border: "1px solid #facc15", borderRadius: "16px", padding: "16px", width: "320px" },
  withdrawModalCardDark: { background: "#111827", borderRadius: "16px", padding: "16px", width: "320px", border: "1px solid #facc15" },
  goldSubmitBtn: { width: "100%", height: "38px", background: "#f59e0b", border: "none", borderRadius: "8px", fontWeight: "bold", cursor: "pointer", marginTop: "10px" },
  closeImagePopupBtn: { background: "#ef4444", color: "#fff", border: "none", borderRadius: "50%", width: "24px", height: "24px" },
  bonusRulesImage: { width: "100%", borderRadius: "12px" },
  gotItBtn: { width: "100%", marginTop: "10px", background: "#f59e0b", border: "none", padding: "8px", borderRadius: "8px", fontWeight: "bold" }
};
