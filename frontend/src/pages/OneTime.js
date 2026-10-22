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

  // States
  const [category, setCategory] = useState("beginner");
  const [tenureMonths, setTenureMonths] = useState(9);
  const [rate, setRate] = useState(1.2);
  const [amount, setAmount] = useState(15000);
  const [investing, setInvesting] = useState(false);

  // Popups & Modals
  const [showPlanModal, setShowPlanModal] = useState(false);
  const [modalCategory, setModalCategory] = useState("beginner");

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

  const mainAmount = Number(amount) || 0;
  const gstRate = paymentMethodType === "fiat" ? 0.02 : 0;
  const gstAmount = Math.round(mainAmount * gstRate);
  const tdsAmount = 0;
  const platformFee = 0;
  const totalAddMoney = mainAmount + gstAmount + tdsAmount + platformFee;

  const beginnerPlans = [
    { value: 7500, rate: 0.8, tenureOptions: [1], defaultTenure: 1, bonusDesc: "Up to ₹500 Once", icon: "🌱" },
    { value: 15000, rate: 1.2, tenureOptions: [6, 9], defaultTenure: 9, bonusDesc: "Up to ₹1,500/mo (2 Mos)", icon: "☘️" },
    { value: 22500, rate: 1.5, tenureOptions: [6, 9], defaultTenure: 9, bonusDesc: "Up to ₹2,250/mo (2 Mos)", icon: "🌿" },
    { value: 30000, rate: 1.7, tenureOptions: [6, 9], defaultTenure: 9, bonusDesc: "Up to ₹3,000/mo (3 Mos)", icon: "🌾" },
    { value: 37500, rate: 2.0, tenureOptions: [6, 9], defaultTenure: 9, bonusDesc: "Up to ₹3,750/mo (3 Mos)", icon: "🌳" }
  ];

  const proPlans = [
    { value: 99999, rate: 2.0, tenureOptions: [2], defaultTenure: 2, bonusDesc: "Flat 10% (2 Mos)", icon: "🔥" },
    { value: 139999, rate: 3.0, tenureOptions: [2], defaultTenure: 2, bonusDesc: "Flat 13.9% (2 Mos)", icon: "⚡" },
    { value: 189999, rate: 3.5, tenureOptions: [2], defaultTenure: 2, bonusDesc: "Flat 15% (2 Mos)", icon: "💎" },
    { value: 249999, rate: 4.5, tenureOptions: [3], defaultTenure: 3, bonusDesc: "Flat 18% (3 Mos)", icon: "👑" },
    { value: 500000, rate: 6.0, tenureOptions: [3], defaultTenure: 3, bonusDesc: "Flat 20% (3 Mos)", icon: "🚀" }
  ];

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

    let durationDays = 60; // Default fallback to 60 days
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
      return Number(activeInvestment.dailyReturn);
    }
    return (Number(amount) * Number(rate)) / 100;
  }, [amount, rate, activeInvestment, isInvestmentLocked]);

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

  const openPlanModal = (cat) => {
    if (isInvestmentLocked) {
      triggerToast("Your investment is currently locked.", "error");
      return;
    }
    setModalCategory(cat);
    setShowPlanModal(true);
  };

  const selectPlanFromModal = (p, cat) => {
    setCategory(cat);
    setAmount(p.value);
    setRate(p.rate);
    setTenureMonths(p.defaultTenure);
    setShowPlanModal(false);
  };

  const handleStartInvestment = async () => {
    if (isInvestmentLocked) {
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
          category,
          amount: Number(amount),
          duration: `${tenureMonths} Months`,
          durationDays: tenureMonths * 30,
          tenureMonths: tenureMonths,
          dailyReturn,
          rate,
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
        triggerToast("Deposit request submitted! Status: Pending", "success");
        setShowAddFundModal(false);

        const newPendingDeposit = {
          _id: data.deposit?._id || Date.now().toString(),
          type: "Add Fund",
          amount: Number(totalAddMoney),
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
    if (!totalAddMoney || totalAddMoney <= 0) {
      triggerToast("Please select a valid deposit amount", "error");
      return;
    }

    setRazorpayLoading(true);
    const resLoaded = await loadRazorpayScript();
    if (!resLoaded) {
      triggerToast("Razorpay SDK failed to load. Check your internet connection.", "error");
      setRazorpayLoading(false);
      return;
    }

    try {
      const orderRes = await fetch(`${API}/api/onetime/create-razorpay-order`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          authorization: token
        },
        body: JSON.stringify({ email, amount: Number(totalAddMoney) })
      });
      const orderData = await orderRes.json();

      if (!orderRes.ok || !orderData.success) {
        triggerToast(orderData.message || "Failed to create Razorpay order", "error");
        setRazorpayLoading(false);
        return;
      }

      const { orderId, keyId, currency } = orderData;

      const options = {
        key: keyId,
        amount: Number(totalAddMoney) * 100,
        currency: currency || "INR",
        name: "Save Money",
        description: "Add Fund to Wallet",
        order_id: orderId,
        handler: async function (response) {
          try {
            const verifyRes = await fetch(`${API}/api/onetime/verify-razorpay-payment`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                authorization: token
              },
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
              triggerToast("🎉 Payment Successful! Funds added to wallet.", "success");
              setShowAddFundModal(false);
              await loadDashboardData();
            } else {
              triggerToast(verifyData.message || "Payment verification failed", "error");
            }
          } catch (err) {
            triggerToast("Error verifying payment", "error");
          }
        },
        prefill: {
          name: user?.name || "SaveMoney User",
          email: email,
          contact: user?.mobile || user?.phone || ""
        },
        theme: {
          color: "#f59e0b"
        }
      };

      const paymentObject = new window.Razorpay(options);
      paymentObject.open();
    } catch (err) {
      console.error("Razorpay error:", err);
      triggerToast("Payment initialization failed", "error");
    } finally {
      setRazorpayLoading(false);
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

  const handleWithdrawSubmit = async (customAmt = null) => {
    const amountToWithdraw = customAmt || Number(dailyReturn);

    if (hasWithdrawnToday) {
      triggerToast("You have already placed a withdrawal request today!", "error");
      return;
    }

    if (currentWalletBalance < amountToWithdraw) {
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
          amount: Number(amountToWithdraw),
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
      triggerToast("Network error during withdrawal.", "error");
    } finally {
      setWithdrawing(false);
    }
  };

  const handleWithdrawInvestAmount = async () => {
    if (!activeInvestment) return;

    if (!user.bankDetails || !user.bankDetails.accountNumber) {
      setShowBankModal(true);
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
          amount: Number(activeInvestment.amount),
          isInvestAmountWithdrawal: true,
          investmentId: activeInvestment._id || activeInvestment.id,
          bankDetails: user.bankDetails || bankForm
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        triggerToast(data.message || "Invest Amount Withdrawal Request Submitted!", "success");
        setShowInvestWithdrawModal(false);
        await loadDashboardData();
      } else {
        triggerToast(data.message || "Withdrawal Failed", "error");
      }
    } catch (err) {
      console.error("Invest Amount Withdrawal error:", err);
      triggerToast("Network error during withdrawal.", "error");
    } finally {
      setWithdrawing(false);
    }
  };

  const handleConfirmReinvest = async () => {
    if (!activeInvestment) return;

    const reinvestAmount = Number(activeInvestment.amount || 0);

    try {
      setWithdrawing(true);
      const res = await fetch(`${API}/api/onetime/create-investment`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          authorization: token
        },
        body: JSON.stringify({
          email,
          category,
          amount: reinvestAmount,
          duration: `${tenureMonths} Months`,
          durationDays: tenureMonths * 30,
          dailyReturn: (reinvestAmount * rate) / 100,
          rate: rate,
          status: "Active"
        })
      });

      const data = await res.json();
      if (res.ok || data.success) {
        triggerToast("🚀 Reinvestment Started Successfully!", "success");
        setShowReinvestModal(false);
        await loadDashboardData();
      } else {
        triggerToast(data.message || "Failed to reinvest", "error");
      }
    } catch (err) {
      triggerToast("Network error during reinvestment", "error");
    } finally {
      setWithdrawing(false);
    }
  };

  const handleShareToWhatsApp = () => {
    if (!selectedTxn) return;

    const txnType = selectedTxn.type ? selectedTxn.type.toUpperCase() : "TRANSACTION DETAILS";
    const amountVal = Number(selectedTxn.amount || 0).toFixed(2);
    const statusVal = selectedTxn.status ? selectedTxn.status.toUpperCase() : "VERIFIED";
    const userName = user?.name || "SaveMoney User";
    const userEmail = email || "N/A";
    const txnIdVal = selectedTxn.transactionId || selectedTxn._id || selectedTxn.id || "N/A";
    const dateTimeVal = formatDateTime(selectedTxn.createdAt || selectedTxn.startDate || selectedTxn.date);
    const rejectReasonVal = selectedTxn.reason || selectedTxn.rejectReason || selectedTxn.note || selectedTxn.adminNote || selectedTxn.message || "";

    let message = `*💎 SAVE MONEY - TRANSACTION SLIP*\n\n`;
    message += `📌 *Type:* ${txnType}\n`;
    message += `💰 *Amount:* ₹${amountVal}\n`;
    message += `🟢 *Status:* ${statusVal}\n`;
    message += `👤 *User Name:* ${userName}\n`;
    message += `📧 *Email:* ${userEmail}\n`;
    message += `🆔 *Transaction ID / UTR:* ${txnIdVal}\n`;
    message += `📅 *Date & Time:* ${dateTimeVal}\n`;

    if (rejectReasonVal) {
      message += `⚠️ *Reject Reason:* ${rejectReasonVal}\n`;
    }

    message += `\n✨ *Premium SaveMoney Asset Management*`;

    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://api.whatsapp.com/send?text=${encodedMessage}`;
    window.open(whatsappUrl, "_blank");
  };

  const handleCopyWallet = () => {
    navigator.clipboard.writeText(COMPANY_WALLET_ADDRESS);
    triggerToast("Wallet Address Copied!", "success");
  };

  const fileUrl = (file) => {
    if (!file) return "";
    return file.startsWith("http") ? file : `${API}/uploads/${file}`;
  };

  const profilePhoto = fileUrl(user?.photo || user?.profilePhoto || user?.avatar || user?.image || "");

  if (loading) {
    return (
      <div style={styles.loadingPage}>
        <div style={{ textAlign: "center" }}>
          <div style={styles.spinner}></div>
          <h3 style={{ color: "#f59e0b", marginTop: "14px", fontSize: "18px", fontWeight: "700" }}>Loading Dashboard...</h3>
        </div>
      </div>
    );
  }

  const displayedHistory = showAllHistory ? history : history.slice(0, 5);

  return (
    <div style={styles.page}>
      {/* ON PAGE LOAD AUTOMATIC PROMOTIONAL BONUS RULES POPUP */}
      {showImagePopup && (
        <div style={styles.modalOverlay} onClick={() => setShowImagePopup(false)}>
          <div style={styles.animatedPopupCard} onClick={(e) => e.stopPropagation()}>
            <button style={styles.closeImagePopupBtn} onClick={() => setShowImagePopup(false)}>
              ✕
            </button>
            <img 
              src="/179571.png" 
              alt="Bonus Rules" 
              style={styles.bonusRulesImage}
              onError={(e) => {
                e.target.src = "https://i.ibb.co/Y4x20Jg/179571.png";
              }}
            />
            <button style={styles.gotItBtn} onClick={() => setShowImagePopup(false)}>
              Understand & Continue ➔
            </button>
          </div>
        </div>
      )}

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
          <div style={{ ...styles.toast, background: toast.type === "error" ? "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)" : "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)" }}>
            <span style={{ fontSize: "16px" }}>{toast.type === "error" ? "⚠️" : "✅"}</span>
            <span>{toast.msg}</span>
          </div>
        )}

        {/* TOP HEADER WITH CIRCULAR USER AVATAR ONLY */}
        <header style={styles.header}>
          <div style={styles.headerLeft}>
            <button style={styles.menuButton} onClick={() => setIsDrawerOpen(true)}>
              ☰
            </button>
            <div style={styles.brandTitleGroup}>
              <div style={styles.logoBox}>📈</div>
              <div>
                <h1 style={styles.brandTitle}>Save Money</h1>
                <p style={styles.brandSub}>Invest Smartly & Secure Your Future</p>
              </div>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <button style={styles.bonusPillBtn} onClick={() => setShowBonusModal(true)}>
              🎁 Bonus <span style={styles.notificationDot}>0</span>
            </button>

            {/* REFRESH BUTTON */}
            <button 
              style={styles.refreshIconBtn} 
              onClick={handleRefreshPage} 
              title="Refresh Dashboard"
            >
              <span style={{ display: "inline-block", animation: refreshing ? "spin 1s linear infinite" : "none" }}>🔄</span>
            </button>

            {/* CIRCULAR PROFILE PHOTO ONLY */}
            <div style={styles.userProfileCircleBtn} onClick={() => navigate("/kyc")}>
              {profilePhoto ? (
                <img 
                  src={profilePhoto} 
                  alt="User Avatar" 
                  style={styles.userAvatarImgOnly} 
                  onError={(e) => { e.target.style.display = 'none'; }}
                />
              ) : (
                <div style={styles.userAvatarIconOnly}>👤</div>
              )}
            </div>
          </div>
        </header>

        {/* HERO WELCOME BANNER (IN ENGLISH & WITH LIMITED OFFER RESTORED) */}
        <div style={styles.heroBanner}>
          <div style={styles.heroLeftContent}>
            <h2 style={styles.heroWelcomeTitle}>
              Welcome Back! 👋
            </h2>
            <div style={styles.heroSubtitle}>
              <strong style={{ color: "#78350f", fontSize: "12px", display: "block", marginBottom: "3px" }}>
                Small steps today lead to
              </strong>
              <span style={{ color: "#451a03", fontWeight: "900", fontSize: "13px" }}>
                a bright financial freedom tomorrow ✨
              </span>
            </div>

            {/* RESTORED LIMITED TIME OFFER BADGE */}
            <div style={styles.limitedOfferPill}>
              ⚡ Limited Time Offer: Get High Returns Today!
            </div>

            <div style={styles.heroBadgeRow}>
              <span style={styles.shieldIcon}>🛡️</span>
              <span style={{ fontSize: "10px", color: "#374151", fontWeight: "bold" }}>
                Invest small amounts monthly to unlock high exponential returns
              </span>
            </div>
          </div>
          <div style={styles.heroRightGraphic}>
            <div style={styles.growWealthTag}>Grow Your Wealth</div>
            <div style={styles.graphicCoinsContainer}>🌱💰🔒</div>
          </div>
        </div>

        {/* 4 STATS CARDS IN 2x2 GRID */}
        <section style={styles.statsGrid}>
          <div style={styles.statCard}>
            <div style={styles.statHeader}>
              <div style={{ ...styles.statIconBox, background: "#059669" }}>👛</div>
              <span style={styles.statTitle}>Total Invested</span>
            </div>
            <strong style={styles.statValue}>₹ {Number(stats.totalInvested || 0).toLocaleString("en-IN")}</strong>
            <span style={styles.statGrowthPositive}>↗ +12%</span>
          </div>

          <div style={styles.statCard}>
            <div style={styles.statHeader}>
              <div style={{ ...styles.statIconBox, background: "#d97706" }}>🪙</div>
              <span style={styles.statTitle}>Total Earnings</span>
            </div>
            <strong style={styles.statValue}>₹ {Number(stats.totalEarnings || 0).toLocaleString("en-IN")}</strong>
            <span style={styles.statGrowthPositive}>↗ +18%</span>
          </div>

          <div style={styles.statCard}>
            <div style={styles.statHeader}>
              <div style={{ ...styles.statIconBox, background: "#7c3aed" }}>💼</div>
              <span style={styles.statTitle}>Total Withdraw</span>
            </div>
            <strong style={styles.statValue}>₹ {Number(stats.totalWithdrawn || 0).toLocaleString("en-IN")}</strong>
            <span style={styles.statGrowthPositive}>↗ +16%</span>
          </div>

          <div style={styles.statCard}>
            <div style={styles.statHeader}>
              <div style={{ ...styles.statIconBox, background: "#0284c7" }}>💳</div>
              <span style={styles.statTitle}>Available Balance</span>
            </div>
            <strong style={styles.statValue}>₹ {currentWalletBalance.toLocaleString("en-IN")}</strong>
            <span style={styles.statGrowthPositive}>↗ +5%</span>
          </div>
        </section>

        {/* ACTIVE LIVE INVESTMENT CARD */}
        {activeInvestment && (
          <section style={styles.liveActiveInvestCard}>
            <div style={styles.liveInvestHeader}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span style={styles.livePulseDot}></span>
                <strong style={{ fontSize: "14px", color: "#facc15", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                  Active Investment Running ⚡
                </strong>
              </div>
              <span style={styles.activePlanTag}>
                {activeInvestment.category ? activeInvestment.category.toUpperCase() : "ACTIVE PLAN"}
              </span>
            </div>

            <div style={styles.liveInvestDetailsGrid}>
              <div style={styles.liveInvestDetailItem}>
                <span style={styles.liveDetailLabel}>Principal Amount</span>
                <strong style={styles.liveDetailValue}>
                  ₹ {Number(activeInvestment.amount || 0).toLocaleString("en-IN")}
                </strong>
              </div>

              <div style={styles.liveInvestDetailItem}>
                <span style={styles.liveDetailLabel}>Investment Duration</span>
                <strong style={{ ...styles.liveDetailValue, color: "#166534" }}>
                  ⏳ {investmentDurationDays}
                </strong>
              </div>

              <div style={styles.liveInvestDetailItem}>
                <span style={styles.liveDetailLabel}>Start Date</span>
                <strong style={{ ...styles.liveDetailValue, color: "#1e293b" }}>
                  {formatDate(activeInvestment.startDate || activeInvestment.createdAt)}
                </strong>
              </div>

              <div style={styles.liveInvestDetailItem}>
                <span style={styles.liveDetailLabel}>Maturity Date</span>
                <strong style={{ ...styles.liveDetailValue, color: "#1e3a8a" }}>
                  {calculatedMaturityDate}
                </strong>
              </div>
            </div>
          </section>
        )}

        {/* MATURED INVESTMENT CARD */}
        {activeInvestment && isMatured && (
          <section style={styles.maturedWalletCard}>
            <div style={styles.maturedCardHeader}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span style={{ fontSize: "20px" }}>🎉</span>
                <div>
                  <h3 style={{ margin: 0, fontSize: "14px", color: "#facc15", fontWeight: "800" }}>
                    Matured Investment Amount
                  </h3>
                  <p style={{ margin: 0, fontSize: "10px", color: "#cbd5e1" }}>
                    Maturity date ({calculatedMaturityDate}) completed! You can withdraw or reinvest your principal.
                  </p>
                </div>
              </div>
            </div>

            <div style={styles.maturedValueRow}>
              <div>
                <span style={{ fontSize: "11px", color: "#9ca3af" }}>Invest Amount</span>
                <strong style={{ fontSize: "18px", color: "#ffffff", display: "block" }}>
                  ₹ {Number(activeInvestment.amount || 0).toLocaleString("en-IN")}
                </strong>
              </div>
              <div style={{ display: "flex", gap: "6px" }}>
                <button 
                  style={styles.withdrawInvestBtn} 
                  onClick={() => setShowInvestWithdrawModal(true)}
                >
                  Withdraw
                </button>
                <button 
                  style={styles.reinvestBtn} 
                  onClick={() => setShowReinvestModal(true)}
                  disabled={withdrawing}
                >
                  Reinvest 🚀
                </button>
              </div>
            </div>
          </section>
        )}

        {/* DAILY RETURN CARD */}
        <section style={styles.dailyReturnCard}>
          <div style={styles.dailyReturnTopRow}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <div style={styles.goldRupee3DBox}>
                <span style={{ fontSize: "22px", fontWeight: "900", color: "#facc15" }}>₹</span>
              </div>
              <div>
                <span style={styles.dailyReturnLabel}>Daily Return</span>
                <strong style={styles.dailyReturnAmount}>₹ {dailyReturn.toFixed(2)}</strong>
                <span style={styles.dailyReturnSubtext}>(Approx. Per Day)</span>
              </div>
            </div>

            <div style={styles.growingRightBox}>
              <span style={styles.growingText}>Your Investment is</span>
              <strong style={styles.growingHighlight}>Growing Every Day 📈</strong>
            </div>
          </div>

          <div style={styles.actionPillGrid}>
            <button style={styles.addFundGoldBtn} onClick={() => setShowAddFundModal(true)}>
              <span style={styles.plusIconBg}>+</span>
              <div>
                <strong style={{ display: "block", fontSize: "14px", color: "#000" }}>Add Fund</strong>
                <span style={{ fontSize: "10px", color: "#374151" }}>Grow Your Balance</span>
              </div>
              <span style={{ marginLeft: "auto", color: "#000", fontWeight: "bold" }}>➔</span>
            </button>

            <button style={styles.withdrawGoldBtn} onClick={handleWithdrawClick}>
              <span style={styles.walletIconBgGold}>👛</span>
              <div>
                <strong style={{ display: "block", fontSize: "14px", color: "#000" }}>Withdraw</strong>
                <span style={{ fontSize: "10px", color: "#374151" }}>Get Your Money</span>
              </div>
              <span style={{ marginLeft: "auto", color: "#000", fontWeight: "bold" }}>➔</span>
            </button>
          </div>
        </section>

        {/* MAKE A NEW INVESTMENT SECTION */}
        <section style={styles.makeInvestmentCard}>
          <div style={styles.makeInvestHeader}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span style={{ fontSize: "20px" }}>🌱</span>
              <div>
                <h3 style={{ margin: 0, fontSize: "15px", color: "#fff", fontWeight: "800" }}>Make a New Investment</h3>
                <p style={{ margin: 0, fontSize: "10px", color: "#9ca3af" }}>Choose your plan and start growing your wealth today</p>
              </div>
            </div>
            <span style={styles.smallStepsTag}>⚡ Small Steps Big Returns</span>
          </div>

          <div style={styles.planCardGrid}>
            <div style={styles.beginnerCard}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
                <span style={styles.beginnerIconBadge}>🌱</span>
                <div>
                  <strong style={{ display: "block", fontSize: "14px", color: "#fff" }}>Beginner Investment</strong>
                  <span style={{ fontSize: "10px", color: "#a7f3d0" }}>Safe • Stable • Good for Start</span>
                </div>
              </div>

              <div style={styles.featureList}>
                <div style={styles.featureItem}>✓ Low Risk</div>
                <div style={styles.featureItem}>✓ Daily Returns</div>
                <div style={styles.featureItem}>✓ Flexible Investment</div>
              </div>

              <button style={styles.startBeginnerBtn} onClick={() => openPlanModal("beginner")}>
                Start Beginner ➔
              </button>
            </div>

            <div style={styles.proCard}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
                <span style={styles.proIconBadge}>👑</span>
                <div>
                  <strong style={{ display: "block", fontSize: "14px", color: "#fff" }}>Pro Investment</strong>
                  <span style={{ fontSize: "10px", color: "#fef08a" }}>Higher Returns • Faster Growth</span>
                </div>
              </div>

              <div style={styles.featureList}>
                <div style={styles.featureItem}>✓ High Profit Potential</div>
                <div style={styles.featureItem}>✓ Premium Benefits</div>
                <div style={styles.featureItem}>✓ Advanced Plan</div>
              </div>

              <button style={styles.startProBtn} onClick={() => openPlanModal("pro")}>
                Start Pro ➔
              </button>
            </div>
          </div>
        </section>

        {/* TRANSACTION HISTORY SECTION */}
        <section style={styles.historyCard}>
          <div style={styles.historyCardHeader}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span style={{ fontSize: "18px", color: "#facc15" }}>🔄</span>
              <h3 style={{ margin: 0, fontSize: "14px", color: "#fff", fontWeight: "800" }}>Transaction History</h3>
              <span style={styles.liveUpdatesPill}>Live Updates</span>
            </div>
          </div>

          <div style={styles.tableResponsiveWrapper}>
            <table style={styles.goldTable}>
              <thead>
                <tr>
                  <th style={styles.goldTh}>Date</th>
                  <th style={styles.goldTh}>Type</th>
                  <th style={styles.goldTh}>Amount</th>
                  <th style={styles.goldTh}>Status</th>
                  <th style={styles.goldTh}>Reason</th>
                </tr>
              </thead>
              <tbody>
                {displayedHistory.length === 0 ? (
                  <tr>
                    <td colSpan="5" style={styles.emptyTableTd}>No history found</td>
                  </tr>
                ) : (
                  displayedHistory.map((item, idx) => {
                    const itemTypeRaw = (item.type || "").toLowerCase();
                    const isDeposit = itemTypeRaw.includes("add fund") || itemTypeRaw.includes("deposit") || !!item.transactionId;
                    const isWithdraw = itemTypeRaw.includes("withdraw");
                    const isEarning = itemTypeRaw.includes("earning") || itemTypeRaw.includes("return") || itemTypeRaw.includes("profit") || itemTypeRaw.includes("daily");

                    let displayType = "OneTime";
                    let typeIcon = "🚀";
                    if (isDeposit) {
                      displayType = "Add Fund";
                      typeIcon = "💳";
                    } else if (isWithdraw) {
                      displayType = item.isInvestAmountWithdrawal ? "Invest Principal Wd" : "Withdrawal";
                      typeIcon = "💸";
                    } else if (isEarning || item.type === "Daily Return" || item.type === "Profit") {
                      displayType = "Daily Return";
                      typeIcon = "🪙";
                    } else if (item.duration) {
                      displayType = `${item.duration}`;
                    }

                    const rawStatus = item.status || "Pending";
                    const isSuccess = ["approved", "accepted", "success", "active", "completed"].includes(rawStatus.toLowerCase());
                    const isRejected = ["rejected", "cancelled", "failed"].includes(rawStatus.toLowerCase());
                    const displayStatus = rawStatus.toLowerCase() === "active" ? "Active" : (isSuccess ? "Success" : isRejected ? "Rejected" : "Pending");
                    
                    let rejectionReason = item.reason || item.rejectReason || item.note || item.adminNote || item.message || "";
                    if (!rejectionReason && isRejected) {
                      rejectionReason = "you are inactive member";
                    } else if (!rejectionReason) {
                      rejectionReason = "-";
                    }

                    return (
                      <tr key={item._id || idx} style={styles.goldTr} onClick={() => setSelectedTxn(item)}>
                        <td style={styles.goldTd}>{formatDate(item.createdAt || item.startDate)}</td>
                        <td style={styles.goldTd}>
                          <span style={{ marginRight: "4px" }}>{typeIcon}</span> {displayType}
                        </td>
                        <td style={styles.goldTd}>₹ {Number(item.amount || 0).toLocaleString("en-IN")}</td>
                        <td style={styles.goldTd}>
                          <span style={{
                            padding: "2px 8px",
                            borderRadius: "12px",
                            fontSize: "10px",
                            fontWeight: "bold",
                            background: isSuccess ? "rgba(34, 197, 94, 0.2)" : isRejected ? "rgba(239, 68, 68, 0.2)" : "rgba(234, 179, 8, 0.2)",
                            color: isSuccess ? "#4ade80" : isRejected ? "#f87171" : "#facc15",
                            border: `1px solid ${isSuccess ? "#22c55e" : isRejected ? "#ef4444" : "#facc15"}`
                          }}>
                            {isSuccess ? "✓ " : isRejected ? "✕ " : "⏳ "}{displayStatus}
                          </span>
                        </td>
                        <td style={{ ...styles.goldTd, color: isRejected ? "#f87171" : "#9ca3af", fontSize: "10px" }}>
                          {rejectionReason}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* VIEW MORE & VIEW LESS BUTTONS */}
          {history.length > 5 && (
            <div style={{ textAlign: "center", marginTop: "12px" }}>
              <button 
                style={styles.viewToggleBtn}
                onClick={() => setShowAllHistory(!showAllHistory)}
              >
                {showAllHistory ? "View Less ▲" : "View More ▼"}
              </button>
            </div>
          )}
        </section>

        <footer style={styles.footerBar}>
          <p style={styles.footerTagline}>
            Chhote nivesh, badi kamai ka sapna, ab hoga sach! <strong style={{ color: "#facc15" }}>SAVE MONEY</strong>! 💚
          </p>
          <div style={styles.footerCopyRow}>
            <span>© 2026 SAVE MONEY. All Rights Reserved.</span>
          </div>
        </footer>
      </div>

      {/* MODALS */}
      {showPlanModal && (
        <div style={styles.modalOverlay} onClick={() => setShowPlanModal(false)}>
          <div style={styles.planModalCardDark} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span style={{ fontSize: "20px" }}>{modalCategory === "beginner" ? "🌱" : "🔥"}</span>
                <h3 style={{ margin: 0, fontSize: "16px", color: "#fff", fontWeight: "800" }}>
                  {modalCategory === "beginner" ? "Beginner Investment Plans" : "Pro Investment Plans"}
                </h3>
              </div>
              <button style={styles.closeBtnDark} onClick={() => setShowPlanModal(false)}>✕</button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "10px", maxHeight: "380px", overflowY: "auto", paddingRight: "4px" }}>
              {(modalCategory === "beginner" ? beginnerPlans : proPlans).map((p) => {
                const isSelected = amount === p.value;
                const dailyAmt = (p.value * p.rate) / 100;
                const totReturn = dailyAmt * (p.defaultTenure * 30);
                const totPayout = p.value + totReturn;

                return (
                  <div
                    key={p.value}
                    style={{
                      background: isSelected 
                        ? "linear-gradient(135deg, #78350f 0%, #451a03 100%)"
                        : "#0f172a",
                      border: isSelected ? "2px solid #facc15" : "1px solid rgba(255, 255, 255, 0.1)",
                      borderRadius: "12px",
                      padding: "12px",
                      cursor: "pointer",
                      transition: "all 0.2s ease"
                    }}
                    onClick={() => selectPlanFromModal(p, modalCategory)}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                        <span style={{ fontSize: "16px" }}>{p.icon}</span>
                        <strong style={{ fontSize: "16px", color: "#fff" }}>₹{p.value.toLocaleString("en-IN")}</strong>
                      </div>
                      <span style={{ background: "rgba(250, 204, 21, 0.2)", color: "#facc15", fontSize: "11px", fontWeight: "bold", padding: "2px 8px", borderRadius: "12px" }}>
                        {p.rate}% Daily
                      </span>
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px", fontSize: "11px", color: "#cbd5e1", marginTop: "8px", background: "rgba(0,0,0,0.3)", padding: "8px", borderRadius: "8px" }}>
                      <div>Daily Return: <strong style={{ color: "#facc15" }}>₹{dailyAmt.toFixed(2)}</strong></div>
                      <div>Tenure: <strong style={{ color: "#38bdf8" }}>{p.defaultTenure} Months</strong></div>
                      <div>Total Return: <strong style={{ color: "#4ade80" }}>₹{totReturn.toLocaleString("en-IN")}</strong></div>
                      <div>Total Payout: <strong style={{ color: "#facc15" }}>₹{totPayout.toLocaleString("en-IN")}</strong></div>
                    </div>

                    <div style={{ marginTop: "6px", fontSize: "10px", color: "#fef08a", display: "flex", justifyContent: "space-between" }}>
                      <span>🎁 Bonus: {p.bonusDesc}</span>
                      <strong style={{ color: isSelected ? "#facc15" : "#38bdf8" }}>{isSelected ? "✓ Selected" : "Click to Select ➔"}</strong>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* BONUS MODAL */}
      {showBonusModal && (
        <div style={styles.modalOverlay} onClick={() => setShowBonusModal(false)}>
          <div style={styles.modalCardDark} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h3 style={{ margin: 0, fontSize: "16px", color: "#fff" }}>🎁 Bonus & Referral System</h3>
              <button style={styles.closeBtnDark} onClick={() => setShowBonusModal(false)}>✕</button>
            </div>

            {user?.hasAppliedBonus ? (
              <div style={{ background: "rgba(245, 158, 11, 0.1)", border: "1px solid #f59e0b", padding: "10px", borderRadius: "8px", textAlign: "center", marginBottom: "14px" }}>
                <span style={{ fontSize: "12px", color: "#facc15", fontWeight: "bold" }}>
                  ✅ Bonus Code Already Applied!
                </span>
                <p style={{ fontSize: "10px", color: "#cbd5e1", margin: "4px 0 0 0" }}>
                  You cannot change or apply another bonus code.
                </p>
              </div>
            ) : (
              <div style={{ marginBottom: "14px" }}>
                <label style={styles.labelDark}>Enter Bonus / Referral Code</label>
                <div style={{ display: "flex", gap: "6px", marginTop: "4px" }}>
                  <input 
                    style={{ ...styles.inputModalDark, flex: 1 }} 
                    placeholder="e.g. ot324556" 
                    value={bonusInputCode} 
                    onChange={(e) => setBonusInputCode(e.target.value)} 
                  />
                  <button 
                    style={{ ...styles.goldSubmitBtn, width: "80px", height: "38px" }}
                    onClick={handleApplyBonusCode}
                  >
                    Apply
                  </button>
                </div>
              </div>
            )}

            <div style={{ background: "#040d1a", padding: "10px", borderRadius: "8px", border: "1px dashed #facc15", marginBottom: "14px", textAlign: "center" }}>
              <span style={{ fontSize: "11px", color: "#94a3b8", display: "block" }}>Your Unique Bonus Code</span>
              <strong style={{ fontSize: "16px", color: "#facc15", letterSpacing: "1px" }}>
                {user?.bonusCode || user?.referralCode || getOrGenerateUniqueCode()}
              </strong>
              <button 
                style={{ display: "block", margin: "6px auto 0 auto", background: "transparent", border: "none", color: "#38bdf8", fontSize: "11px", cursor: "pointer", fontWeight: "bold" }}
                onClick={() => {
                  const codeToCopy = user?.bonusCode || user?.referralCode || getOrGenerateUniqueCode();
                  navigator.clipboard.writeText(codeToCopy);
                  triggerToast("Bonus Code Copied!", "success");
                }}
              >
                📋 Copy Code
              </button>
            </div>

            <div>
              <label style={{ ...styles.labelDark, marginBottom: "6px", display: "block" }}>Users Who Used Your Code & Invested</label>
              <div style={{ display: "flex", flexDirection: "column", gap: "6px", maxHeight: "150px", overflowY: "auto" }}>
                {bonusList.length === 0 ? (
                  <div style={{ textAlign: "center", padding: "12px", color: "#94a3b8", fontSize: "11px" }}>No users found yet</div>
                ) : (
                  bonusList.map((item, index) => (
                    <div key={item._id || index} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "#040d1a", padding: "8px 10px", borderRadius: "6px", border: "1px solid rgba(255,255,255,0.06)" }}>
                      <div>
                        <strong style={{ fontSize: "12px", color: "#fff", display: "block" }}>{item.name || item.username || item.investorEmail || "User"}</strong>
                        <span style={{ fontSize: "10px", color: "#94a3b8" }}>Joined: {formatDate(item.createdAt || item.date)}</span>
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <span style={{ fontSize: "11px", color: "#facc15", fontWeight: "bold", display: "block" }}>+₹{item.monthlyBonusAmount || 300}</span>
                        <span style={{ fontSize: "9px", padding: "1px 6px", borderRadius: "4px", background: "rgba(245, 158, 11, 0.2)", color: "#facc15", fontWeight: "bold" }}>
                          {item.status || "Success"}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* WITHDRAW MODAL */}
      {showWithdrawModal && (
        <div style={styles.modalOverlay}>
          <div style={styles.withdrawModalCardDark}>
            <div style={styles.modalHeader}>
              <h3 style={{ margin: 0, fontSize: "18px", color: "#fff" }}>Withdraw Funds</h3>
              <button style={styles.closeBtnDark} onClick={() => setShowWithdrawModal(false)}>✕</button>
            </div>
            
            <div style={{ ...styles.withdrawBalanceCard, borderColor: currentWalletBalance < dailyReturn ? "#f87171" : "#facc15", marginBottom: "12px" }}>
              <span style={{ fontSize: "12px", color: "#94a3b8" }}>Available Balance</span>
              <strong style={{ fontSize: "22px", color: currentWalletBalance < dailyReturn ? "#f87171" : "#facc15", display: "block" }}>
                ₹ {currentWalletBalance.toLocaleString("en-IN")}
              </strong>
            </div>

            <p style={{ fontSize: "12px", color: "#cbd5e1", textAlign: "center", marginBottom: "10px" }}>
              Withdraw Daily Return: <strong style={{ color: "#facc15" }}>₹{dailyReturn.toFixed(2)}</strong>
            </p>
            <button
              style={{
                ...styles.goldSubmitBtn,
                background: (currentWalletBalance < dailyReturn || hasWithdrawnToday) ? "#334155" : "linear-gradient(135deg, #fef08a 0%, #f59e0b 100%)"
              }}
              onClick={() => handleWithdrawSubmit()}
              disabled={withdrawing || currentWalletBalance < dailyReturn || hasWithdrawnToday}
            >
              {withdrawing ? "Processing..." : hasWithdrawnToday ? "Already Requested" : "Confirm Withdrawal"}
            </button>
          </div>
        </div>
      )}

      {/* TRANSACTION SLIP MODAL */}
      {selectedTxn && (
        <div style={styles.modalOverlay} onClick={() => setSelectedTxn(null)}>
          <div style={styles.slipCardDark} onClick={(e) => e.stopPropagation()}>
            <div style={styles.slipHeaderCheckGroup}>
              {["rejected", "cancelled", "failed"].includes((selectedTxn.status || "").toLowerCase()) ? (
                <div style={styles.slipCrossCircle}>✕</div>
              ) : (
                <div style={styles.slipCheckCircle}>✓</div>
              )}
              <h4 style={styles.slipHeaderTitle}>
                {selectedTxn.type ? selectedTxn.type.toUpperCase() : "TRANSACTION DETAILS"}
              </h4>
              <strong style={styles.slipAmountText}>
                ₹{Number(selectedTxn.amount || 0).toFixed(2)}
              </strong>
              <div style={styles.slipBadgeRow}>
                <span style={{ ...styles.slipStatusTag, ...getStatusStyleDark(selectedTxn.status) }}>
                  {selectedTxn.status ? selectedTxn.status.toUpperCase() : "VERIFIED"}
                </span>
              </div>
            </div>

            <div style={styles.slipDottedDivider} />

            <div style={styles.slipDetailsTable}>
              <div style={styles.slipRow}>
                <span style={styles.slipLabel}>Receiver / User Name</span>
                <strong style={styles.slipValue}>{user?.name || "SaveMoney User"}</strong>
              </div>

              <div style={styles.slipRow}>
                <span style={styles.slipLabel}>Sender / Account Email</span>
                <strong style={styles.slipValue}>{email || "N/A"}</strong>
              </div>

              <div style={styles.slipRow}>
                <span style={styles.slipLabel}>Transaction ID / UTR</span>
                <strong style={{ ...styles.slipValue, color: "#facc15", wordBreak: "break-all" }}>
                  {selectedTxn.transactionId || selectedTxn._id || selectedTxn.id || "SM-" + Math.random().toString(36).substr(2, 9)}
                </strong>
              </div>

              <div style={styles.slipRow}>
                <span style={styles.slipLabel}>Date & Time</span>
                <strong style={styles.slipValue}>
                  {formatDateTime(selectedTxn.createdAt || selectedTxn.startDate || selectedTxn.date)}
                </strong>
              </div>

              {(selectedTxn.reason || selectedTxn.rejectReason || selectedTxn.note || selectedTxn.adminNote || ["rejected", "cancelled", "failed"].includes((selectedTxn.status || "").toLowerCase())) && (
                <div style={{ ...styles.slipRow, background: "rgba(239, 68, 68, 0.1)", padding: "6px 8px", borderRadius: "6px" }}>
                  <span style={{ ...styles.slipLabel, color: "#f87171", fontWeight: "bold" }}>Reject Reason</span>
                  <strong style={{ ...styles.slipValue, color: "#f87171" }}>
                    {selectedTxn.reason || selectedTxn.rejectReason || selectedTxn.note || selectedTxn.adminNote || "you are inactive member"}
                  </strong>
                </div>
              )}

              <div style={styles.slipRow}>
                <span style={styles.slipLabel}>Remarks / Note</span>
                <strong style={styles.slipValue}>
                  {selectedTxn.type || "wallet transaction"}
                </strong>
              </div>

              <div style={styles.slipRow}>
                <span style={styles.slipLabel}>Security Status</span>
                <strong style={{ ...styles.slipValue, color: "#facc15" }}>SECURE & VERIFIED</strong>
              </div>
            </div>

            <div style={styles.slipFooterBranding}>
              💎 Premium SaveMoney Asset Management
            </div>

            <div style={styles.slipActionGrid}>
              <button 
                style={styles.slipShareBtn}
                onClick={handleShareToWhatsApp}
              >
                💬 Share on WhatsApp ➔
              </button>
              <button 
                style={styles.slipCloseBtn} 
                onClick={() => setSelectedTxn(null)}
              >
                Close Window
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ADD FUND MODAL */}
      {showAddFundModal && (
        <div style={styles.modalOverlay}>
          <div style={{ ...styles.modalCardDark, maxWidth: "400px", border: "1px solid rgba(245, 158, 11, 0.4)", boxShadow: "0 25px 50px rgba(0,0,0,0.8)" }}>
            <div style={styles.modalHeader}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span style={{ fontSize: "20px" }}>💎</span>
                <h3 style={{ margin: 0, fontSize: "16px", color: "#fff", fontWeight: "800" }}>Add Investment Fund</h3>
              </div>
              <button style={styles.closeBtnDark} onClick={() => setShowAddFundModal(false)}>✕</button>
            </div>

            <div style={{ display: "flex", gap: "8px", marginBottom: "14px" }}>
              <button
                type="button"
                style={{
                  flex: 1,
                  padding: "8px",
                  borderRadius: "8px",
                  border: paymentMethodType === "fiat" ? "2px solid #facc15" : "1px solid #334155",
                  background: paymentMethodType === "fiat" ? "rgba(245, 158, 11, 0.2)" : "#0f2138",
                  color: "#fff",
                  fontSize: "11px",
                  fontWeight: "bold",
                  cursor: "pointer"
                }}
                onClick={() => setPaymentMethodType("fiat")}
              >
                🇮🇳 UPI / Gateway (2% Fee)
              </button>
              <button
                type="button"
                style={{
                  flex: 1,
                  padding: "8px",
                  borderRadius: "8px",
                  border: paymentMethodType === "crypto" ? "2px solid #a855f7" : "1px solid #334155",
                  background: paymentMethodType === "crypto" ? "linear-gradient(135deg, rgba(168, 85, 247, 0.3), rgba(236, 72, 153, 0.3))" : "#0f2138",
                  color: "#fff",
                  fontSize: "11px",
                  fontWeight: "bold",
                  cursor: "pointer"
                }}
                onClick={() => setPaymentMethodType("crypto")}
              >
                🪙 Crypto (0% Fee) 🔥
              </button>
            </div>

            {paymentMethodType === "crypto" && (
              <div style={{ background: "linear-gradient(135deg, #7c3aed 0%, #db2777 100%)", borderRadius: "10px", padding: "10px", marginBottom: "14px", textAlign: "center", boxShadow: "0 4px 15px rgba(124, 58, 237, 0.4)" }}>
                <span style={{ fontSize: "12px", color: "#fff", fontWeight: "900", display: "block" }}>
                  🚀 CRYPTO DEPOSIT ACTIVE
                </span>
                <p style={{ fontSize: "11px", color: "#f3e8ff", margin: "3px 0 0 0" }}>
                  No Charges! Zero GST & Zero Platform Fee applied when paying via Crypto.
                </p>
              </div>
            )}

            <div style={{ background: "#040d1a", borderRadius: "10px", padding: "12px", border: "1px dashed rgba(255, 255, 255, 0.15)", marginBottom: "14px" }}>
              <span style={{ fontSize: "11px", fontWeight: "bold", color: "#38bdf8", display: "block", marginBottom: "8px" }}>
                📊 Deposit Calculation Summary
              </span>
              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", color: "#cbd5e1" }}>
                  <span>Invest Amount:</span>
                  <strong style={{ color: "#fff" }}>₹{mainAmount.toLocaleString("en-IN")}</strong>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", color: "#cbd5e1" }}>
                  <span>GST ({paymentMethodType === "fiat" ? "2%" : "0%"}):</span>
                  <strong style={{ color: paymentMethodType === "fiat" ? "#facc15" : "#4ade80" }}>₹{gstAmount.toLocaleString("en-IN")}</strong>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", color: "#cbd5e1" }}>
                  <span>TDS (0%):</span>
                  <strong style={{ color: "#4ade80" }}>₹{tdsAmount}</strong>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", color: "#cbd5e1" }}>
                  <span>Platform Fee (0%):</span>
                  <strong style={{ color: "#4ade80" }}>₹{platformFee}</strong>
                </div>
                <div style={{ height: "1px", background: "#1e293b", margin: "2px 0" }}></div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", fontWeight: "bold" }}>
                  <span style={{ color: "#facc15" }}>Total Add Money:</span>
                  <strong style={{ color: "#facc15", fontSize: "14px" }}>₹{totalAddMoney.toLocaleString("en-IN")}</strong>
                </div>
              </div>
            </div>

            {paymentMethodType === "fiat" ? (
              <div style={{ marginBottom: "10px" }}>
                <button 
                  type="button"
                  style={{
                    ...styles.goldSubmitBtn,
                    background: "linear-gradient(135deg, #fef08a 0%, #f59e0b 100%)",
                    color: "#000",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "8px"
                  }}
                  onClick={handleRazorpayPayment}
                  disabled={razorpayLoading}
                >
                  <span>⚡</span> {razorpayLoading ? "Processing Payment..." : `Pay ₹${totalAddMoney.toLocaleString("en-IN")} with Razorpay`}
                </button>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                <p style={{ fontSize: "11px", color: "#cbd5e1", margin: 0 }}>
                  Send crypto equivalent to <strong style={{ color: "#a855f7" }}>₹{totalAddMoney.toLocaleString("en-IN")}</strong> to the address below:
                </p>
                <div style={styles.walletBoxDark}>
                  <div style={styles.walletAddrRow}>
                    <span style={styles.walletText}>{COMPANY_WALLET_ADDRESS}</span>
                    <button style={{ ...styles.copyBtn, background: "#a855f7" }} onClick={handleCopyWallet}>Copy</button>
                  </div>
                </div>

                <form onSubmit={handleDepositSubmit} style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                  <div>
                    <label style={styles.labelDark}>Crypto Txn Hash / ID*</label>
                    <input style={styles.inputModalDark} placeholder="Enter Blockchain Hash" value={txnId} onChange={(e) => setTxnId(e.target.value)} required />
                  </div>
                  <div>
                    <label style={styles.labelDark}>Transfer Screenshot*</label>
                    <input type="file" accept="image/*" style={styles.fileInputDark} onChange={(e) => setScreenshot(e.target.files[0])} required />
                  </div>
                  <button type="submit" style={{ ...styles.goldSubmitBtn, background: "linear-gradient(135deg, #7c3aed 0%, #db2777 100%)", color: "#fff" }} disabled={depositing}>
                    {depositing ? "Submitting..." : "Submit Crypto Deposit Proof"}
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>
      )}

      {/* BANK DETAILS MODAL */}
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
              <button type="submit" style={styles.goldSubmitBtn}>Save Details</button>
            </form>
          </div>
        </div>
      )}

      {/* INVEST WITHDRAW MODAL */}
      {showInvestWithdrawModal && activeInvestment && (
        <div style={styles.modalOverlay}>
          <div style={styles.withdrawModalCardDark}>
            <div style={styles.modalHeader}>
              <h3 style={{ margin: 0, fontSize: "16px", color: "#fff" }}>Withdraw Invested Principal</h3>
              <button style={styles.closeBtnDark} onClick={() => setShowInvestWithdrawModal(false)}>✕</button>
            </div>
            <div style={{ ...styles.withdrawBalanceCard, borderColor: "#facc15" }}>
              <span style={{ fontSize: "12px", color: "#94a3b8" }}>Matured Invest Amount</span>
              <strong style={{ fontSize: "22px", color: "#facc15", display: "block" }}>
                ₹ {Number(activeInvestment.amount || 0).toLocaleString("en-IN")}
              </strong>
            </div>
            <button
              style={{
                ...styles.goldSubmitBtn,
                marginTop: "16px"
              }}
              onClick={handleWithdrawInvestAmount}
              disabled={withdrawing}
            >
              {withdrawing ? "Processing..." : "Confirm Invest Amount Withdrawal"}
            </button>
          </div>
        </div>
      )}

      {/* REINVEST MODAL */}
      {showReinvestModal && activeInvestment && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalCardDark}>
            <div style={styles.modalHeader}>
              <h3 style={{ margin: 0, fontSize: "16px", color: "#fff" }}>Reinvest Principal Amount</h3>
              <button style={styles.closeBtnDark} onClick={() => setShowReinvestModal(false)}>✕</button>
            </div>
            <div style={{ marginBottom: "12px", background: "#040d1a", padding: "10px", borderRadius: "8px" }}>
              <span style={{ fontSize: "11px", color: "#94a3b8", display: "block" }}>Amount to Reinvest</span>
              <strong style={{ fontSize: "18px", color: "#facc15" }}>₹{Number(activeInvestment.amount || 0).toLocaleString("en-IN")}</strong>
            </div>

            <div style={{ marginTop: "12px", background: "#040d1a", padding: "10px", borderRadius: "8px" }}>
              <span style={{ fontSize: "11px", color: "#94a3b8", display: "block" }}>Daily Earnings</span>
              <strong style={{ fontSize: "14px", color: "#38bdf8" }}>
                ₹{((Number(activeInvestment.amount || 0) * rate) / 100).toFixed(2)} / day
              </strong>
            </div>

            <button
              style={{
                ...styles.goldSubmitBtn,
                marginTop: "16px"
              }}
              onClick={handleConfirmReinvest}
              disabled={withdrawing}
            >
              {withdrawing ? "Processing..." : "Confirm Reinvest 🚀"}
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
    return { background: "rgba(250, 204, 21, 0.2)", color: "#facc15" };
  }
  if (s === "pending") {
    return { background: "rgba(234, 179, 8, 0.2)", color: "#facc15" };
  }
  return { background: "rgba(239, 68, 68, 0.2)", color: "#f87171" };
};

const styles = {
  page: {
    minHeight: "100vh",
    width: "100%",
    background: "#030712",
    padding: "12px",
    fontFamily: "system-ui, -apple-system, sans-serif",
    color: "#f9fafb",
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
    background: "#030712",
    display: "flex",
    alignItems: "center",
    justifyContent: "center"
  },
  spinner: {
    width: "36px",
    height: "36px",
    border: "3px solid rgba(245, 158, 11, 0.2)",
    borderTop: "3px solid #f59e0b",
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
    gap: "8px"
  },
  header: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "8px 0"
  },
  headerLeft: {
    display: "flex",
    alignItems: "center",
    gap: "10px"
  },
  menuButton: {
    background: "rgba(255,255,255,0.05)",
    border: "1px solid rgba(255,255,255,0.1)",
    color: "white",
    fontSize: "18px",
    borderRadius: "8px",
    padding: "6px 10px",
    cursor: "pointer"
  },
  brandTitleGroup: {
    display: "flex",
    alignItems: "center",
    gap: "8px"
  },
  logoBox: {
    width: "32px",
    height: "32px",
    background: "linear-gradient(135deg, #f59e0b 0%, #b45309 100%)",
    borderRadius: "8px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "16px"
  },
  brandTitle: {
    margin: 0,
    fontSize: "16px",
    fontWeight: "900",
    color: "#fff"
  },
  brandSub: {
    margin: 0,
    fontSize: "9px",
    color: "#9ca3af"
  },
  bonusPillBtn: {
    background: "linear-gradient(135deg, #d97706 0%, #78350f 100%)",
    border: "1px solid #facc15",
    color: "#fff",
    padding: "6px 10px",
    borderRadius: "20px",
    fontSize: "11px",
    fontWeight: "bold",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    gap: "4px"
  },
  refreshIconBtn: {
    background: "linear-gradient(135deg, #d97706 0%, #78350f 100%)",
    border: "1px solid #facc15",
    color: "#fff",
    padding: "6px 9px",
    borderRadius: "50%",
    fontSize: "12px",
    fontWeight: "bold",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center"
  },
  notificationDot: {
    background: "#ef4444",
    color: "#fff",
    borderRadius: "50%",
    padding: "1px 5px",
    fontSize: "9px"
  },

  /* CIRCULAR PROFILE PHOTO ONLY STYLES */
  userProfileCircleBtn: {
    width: "32px",
    height: "32px",
    borderRadius: "50%",
    border: "2px solid #facc15",
    overflow: "hidden",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    background: "#1f2937",
    boxShadow: "0 0 8px rgba(250, 204, 21, 0.3)"
  },
  userAvatarImgOnly: {
    width: "100%",
    height: "100%",
    objectFit: "cover"
  },
  userAvatarIconOnly: {
    width: "100%",
    height: "100%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "14px",
    color: "#fff"
  },

  heroBanner: {
    background: "linear-gradient(135deg, #f59e0b 0%, #b45309 100%)",
    border: "2px solid #facc15",
    borderRadius: "16px",
    padding: "14px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    boxShadow: "0 0 20px rgba(245, 158, 11, 0.4)",
    color: "#000"
  },
  heroLeftContent: {
    flex: 1
  },
  heroWelcomeTitle: {
    margin: 0,
    fontSize: "18px",
    fontWeight: "900",
    color: "#000"
  },
  heroSubtitle: {
    fontSize: "12px",
    color: "#1f2937",
    marginTop: "4px",
    lineHeight: "1.3"
  },

  /* RESTORED LIMITED OFFER PILL STYLE */
  limitedOfferPill: {
    display: "inline-block",
    background: "#000000",
    color: "#facc15",
    padding: "3px 8px",
    borderRadius: "20px",
    fontSize: "10px",
    fontWeight: "bold",
    marginTop: "6px",
    boxShadow: "0 2px 6px rgba(0,0,0,0.3)"
  },

  heroBadgeRow: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    marginTop: "8px"
  },
  shieldIcon: {
    fontSize: "12px"
  },
  heroRightGraphic: {
    textAlign: "right"
  },
  growWealthTag: {
    fontSize: "11px",
    color: "#451a03",
    fontWeight: "900"
  },
  graphicCoinsContainer: {
    fontSize: "28px",
    marginTop: "4px"
  },

  /* AUTOMATIC POPUP CARD STYLES */
  animatedPopupCard: {
    background: "#0f172a",
    border: "2px solid #facc15",
    borderRadius: "20px",
    padding: "12px",
    width: "100%",
    maxWidth: "380px",
    position: "relative",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    boxShadow: "0 20px 50px rgba(0, 0, 0, 0.9)",
    animation: "popupZoomIn 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards"
  },
  closeImagePopupBtn: {
    position: "absolute",
    top: "-12px",
    right: "-12px",
    width: "32px",
    height: "32px",
    borderRadius: "50%",
    background: "#ef4444",
    border: "2px solid #ffffff",
    color: "#ffffff",
    fontWeight: "bold",
    fontSize: "14px",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    boxShadow: "0 4px 10px rgba(0,0,0,0.5)",
    zIndex: 10
  },
  bonusRulesImage: {
    width: "100%",
    height: "auto",
    borderRadius: "12px",
    objectFit: "contain",
    maxHeight: "80vh"
  },
  gotItBtn: {
    width: "100%",
    marginTop: "12px",
    padding: "10px",
    background: "linear-gradient(135deg, #fef08a 0%, #f59e0b 100%)",
    border: "none",
    borderRadius: "10px",
    color: "#000",
    fontWeight: "bold",
    fontSize: "13px",
    cursor: "pointer",
    boxShadow: "0 4px 12px rgba(245, 158, 11, 0.4)"
  },

  statsGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "10px"
  },
  statCard: {
    background: "linear-gradient(135deg, #d97706 0%, #78350f 100%)",
    border: "1.5px solid #facc15",
    borderRadius: "12px",
    padding: "12px",
    display: "flex",
    flexDirection: "column",
    boxShadow: "0 0 12px rgba(245, 158, 11, 0.25)"
  },
  statHeader: {
    display: "flex",
    alignItems: "center",
    gap: "6px"
  },
  statIconBox: {
    width: "26px",
    height: "26px",
    borderRadius: "6px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "13px",
    color: "#fff"
  },
  statTitle: {
    fontSize: "11px",
    color: "#fef3c7",
    fontWeight: "600"
  },
  statValue: {
    fontSize: "17px",
    fontWeight: "900",
    color: "#ffffff",
    marginTop: "6px"
  },
  statGrowthPositive: {
    fontSize: "10px",
    color: "#a7f3d0",
    fontWeight: "bold",
    marginTop: "2px"
  },
  liveActiveInvestCard: {
    background: "linear-gradient(135deg, #111827 0%, #030712 100%)",
    border: "1px solid #facc15",
    borderRadius: "14px",
    padding: "12px",
    boxShadow: "0 0 15px rgba(250, 204, 21, 0.2)"
  },
  liveInvestHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "10px"
  },
  livePulseDot: {
    width: "8px",
    height: "8px",
    borderRadius: "50%",
    background: "#22c55e",
    boxShadow: "0 0 8px #22c55e"
  },
  activePlanTag: {
    background: "rgba(250, 204, 21, 0.2)",
    color: "#facc15",
    fontSize: "9px",
    padding: "2px 8px",
    borderRadius: "10px",
    fontWeight: "bold"
  },
  liveInvestDetailsGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "8px",
    background: "linear-gradient(135deg, #fef08a 0%, #f59e0b 100%)",
    padding: "10px",
    borderRadius: "10px",
    border: "1px solid #facc15"
  },
  liveInvestDetailItem: {
    display: "flex",
    flexDirection: "column"
  },
  liveDetailLabel: {
    fontSize: "10px",
    color: "#78350f",
    fontWeight: "700"
  },
  liveDetailValue: {
    fontSize: "13px",
    fontWeight: "900",
    color: "#000000"
  },
  maturedWalletCard: {
    background: "linear-gradient(135deg, #1f2937 0%, #111827 100%)",
    borderRadius: "14px",
    padding: "12px 14px",
    border: "1px solid #facc15",
    display: "flex",
    flexDirection: "column",
    gap: "10px"
  },
  maturedCardHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center"
  },
  maturedValueRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    background: "rgba(0,0,0,0.25)",
    padding: "8px 12px",
    borderRadius: "10px"
  },
  withdrawInvestBtn: {
    background: "linear-gradient(90deg, #10b981 0%, #0284c7 100%)",
    border: "none",
    color: "#ffffff",
    fontSize: "10px",
    fontWeight: "bold",
    padding: "7px 10px",
    borderRadius: "6px",
    cursor: "pointer",
    boxShadow: "0 2px 8px rgba(16, 185, 129, 0.3)"
  },
  reinvestBtn: {
    background: "linear-gradient(90deg, #f59e0b 0%, #d97706 100%)",
    border: "none",
    color: "#ffffff",
    fontSize: "10px",
    fontWeight: "bold",
    padding: "7px 10px",
    borderRadius: "6px",
    cursor: "pointer",
    boxShadow: "0 2px 8px rgba(245, 158, 11, 0.3)"
  },
  dailyReturnCard: {
    background: "linear-gradient(135deg, #1f2937 0%, #111827 100%)",
    border: "1px solid #facc15",
    borderRadius: "16px",
    padding: "14px",
    boxShadow: "0 0 20px rgba(245, 158, 11, 0.15)"
  },
  dailyReturnTopRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center"
  },
  goldRupee3DBox: {
    width: "44px",
    height: "44px",
    background: "linear-gradient(135deg, #78350f 0%, #451a03 100%)",
    border: "2px solid #facc15",
    borderRadius: "12px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    boxShadow: "0 0 10px rgba(250, 204, 21, 0.3)"
  },
  dailyReturnLabel: {
    fontSize: "12px",
    color: "#d1d5db",
    display: "block"
  },
  dailyReturnAmount: {
    fontSize: "24px",
    fontWeight: "900",
    color: "#facc15"
  },
  dailyReturnSubtext: {
    fontSize: "10px",
    color: "#9ca3af",
    marginLeft: "4px"
  },
  growingRightBox: {
    textAlign: "right"
  },
  growingText: {
    fontSize: "10px",
    color: "#9ca3af",
    display: "block"
  },
  growingHighlight: {
    fontSize: "11px",
    color: "#fff"
  },
  actionPillGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "10px",
    marginTop: "14px"
  },
  addFundGoldBtn: {
    background: "linear-gradient(135deg, #fef08a 0%, #f59e0b 100%)",
    border: "none",
    borderRadius: "25px",
    padding: "8px 12px",
    display: "flex",
    alignItems: "center",
    gap: "8px",
    cursor: "pointer"
  },
  plusIconBg: {
    width: "24px",
    height: "24px",
    background: "#000",
    color: "#fff",
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: "bold"
  },
  withdrawGoldBtn: {
    background: "linear-gradient(135deg, #fef08a 0%, #f59e0b 100%)",
    border: "none",
    borderRadius: "25px",
    padding: "8px 12px",
    display: "flex",
    alignItems: "center",
    gap: "8px",
    cursor: "pointer"
  },
  walletIconBgGold: {
    width: "24px",
    height: "24px",
    background: "#000",
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center"
  },
  makeInvestmentCard: {
    background: "#111827",
    border: "1px solid #facc15",
    borderRadius: "16px",
    padding: "14px",
    boxShadow: "0 0 15px rgba(250, 204, 21, 0.1)"
  },
  makeInvestHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "12px"
  },
  smallStepsTag: {
    fontSize: "10px",
    color: "#facc15",
    fontStyle: "italic"
  },
  planCardGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "10px"
  },
  beginnerCard: {
    background: "linear-gradient(135deg, #064e3b 0%, #022c22 100%)",
    border: "1px solid #10b981",
    borderRadius: "12px",
    padding: "12px"
  },
  beginnerIconBadge: {
    fontSize: "18px"
  },
  proCard: {
    background: "linear-gradient(135deg, #78350f 0%, #451a03 100%)",
    border: "1px solid #f59e0b",
    borderRadius: "12px",
    padding: "12px"
  },
  proIconBadge: {
    fontSize: "18px"
  },
  featureList: {
    display: "flex",
    flexDirection: "column",
    gap: "4px",
    margin: "10px 0"
  },
  featureItem: {
    fontSize: "10px",
    color: "#e5e7eb"
  },
  startBeginnerBtn: {
    width: "100%",
    background: "#10b981",
    border: "none",
    color: "#fff",
    padding: "8px",
    borderRadius: "20px",
    fontSize: "11px",
    fontWeight: "bold",
    cursor: "pointer"
  },
  startProBtn: {
    width: "100%",
    background: "linear-gradient(135deg, #fef08a 0%, #f59e0b 100%)",
    border: "none",
    color: "#000",
    padding: "8px",
    borderRadius: "20px",
    fontSize: "11px",
    fontWeight: "bold",
    cursor: "pointer"
  },
  historyCard: {
    background: "#111827",
    border: "1px solid #facc15",
    borderRadius: "16px",
    padding: "12px",
    boxShadow: "0 0 15px rgba(250, 204, 21, 0.1)"
  },
  historyCardHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "10px"
  },
  liveUpdatesPill: {
    background: "rgba(245, 158, 11, 0.2)",
    color: "#facc15",
    fontSize: "9px",
    padding: "2px 6px",
    borderRadius: "10px",
    fontWeight: "bold"
  },
  viewToggleBtn: {
    background: "rgba(250, 204, 21, 0.15)",
    border: "1px solid #facc15",
    color: "#facc15",
    padding: "6px 16px",
    borderRadius: "20px",
    fontSize: "11px",
    fontWeight: "bold",
    cursor: "pointer"
  },
  tableResponsiveWrapper: {
    overflowX: "auto"
  },
  goldTable: {
    width: "100%",
    borderCollapse: "collapse",
    fontSize: "11px"
  },
  goldTh: {
    textAlign: "left",
    padding: "8px",
    color: "#9ca3af",
    borderBottom: "1px solid rgba(255,255,255,0.1)"
  },
  goldTr: {
    borderBottom: "1px solid rgba(255,255,255,0.05)",
    cursor: "pointer"
  },
  goldTd: {
    padding: "8px",
    color: "#f3f4f6"
  },
  emptyTableTd: {
    textAlign: "center",
    padding: "16px",
    color: "#6b7280"
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
  modalOverlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.82)",
    backdropFilter: "blur(6px)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 99999,
    padding: "12px"
  },
  modalCardDark: {
    background: "#111827",
    border: "1px solid #facc15",
    borderRadius: "16px",
    padding: "16px",
    width: "100%",
    maxWidth: "360px"
  },
  planModalCardDark: {
    background: "#111827",
    border: "1px solid #facc15",
    borderRadius: "16px",
    padding: "16px",
    width: "100%",
    maxWidth: "400px"
  },
  withdrawModalCardDark: {
    background: "#111827",
    borderRadius: "16px",
    padding: "16px",
    width: "100%",
    maxWidth: "360px",
    border: "1px solid #facc15"
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
    background: "none",
    border: "none",
    color: "#fff",
    fontSize: "16px",
    cursor: "pointer"
  },
  goldSubmitBtn: {
    width: "100%",
    height: "38px",
    background: "linear-gradient(135deg, #fef08a 0%, #f59e0b 100%)",
    border: "none",
    borderRadius: "8px",
    color: "#000",
    fontWeight: "bold",
    fontSize: "12px",
    cursor: "pointer"
  },
  labelDark: {
    fontSize: "11px",
    fontWeight: "700",
    color: "#e2e8f0"
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
    background: "#f59e0b",
    color: "#000",
    border: "none",
    padding: "4px 8px",
    borderRadius: "4px",
    cursor: "pointer",
    fontSize: "10px",
    fontWeight: "bold"
  },
  drawerOverlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(0, 0, 0, 0.75)",
    backdropFilter: "blur(4px)",
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
    background: "#0b0f19",
    width: "230px",
    height: "100vh",
    padding: "12px 8px",
    display: "flex",
    flexDirection: "column",
    boxShadow: "10px 0 30px rgba(0,0,0,0.85)",
    borderRight: "1px solid #1f2937",
    transform: "translateX(-100%)",
    transition: "transform 0.3s ease",
    zIndex: 100003
  },
  drawerHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: "10px",
    paddingBottom: "8px",
    borderBottom: "1px solid rgba(255, 255, 255, 0.1)"
  },
  drawerBrand: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "4px"
  },
  drawerLogoWrapper: {
    width: "36px",
    height: "36px",
    borderRadius: "50%",
    background: "#f59e0b",
    display: "flex",
    alignItems: "center",
    justifyContent: "center"
  },
  drawerLogoImg: {
    width: "22px",
    height: "22px",
    objectFit: "contain"
  },
  drawerLogoText: {
    margin: 0,
    fontSize: "14px",
    fontWeight: "900",
    color: "#ffffff"
  },
  drawerLogoSubtext: {
    fontSize: "9px",
    color: "#facc15"
  },
  drawerScrollArea: {
    flex: 1,
    overflowY: "auto",
    display: "flex",
    flexDirection: "column",
    gap: "10px"
  },
  drawerNavList: {
    display: "flex",
    flexDirection: "column",
    gap: "6px"
  },
  drawerNavItem: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    padding: "8px 12px",
    background: "rgba(255, 255, 255, 0.05)",
    border: "1px solid rgba(255, 255, 255, 0.1)",
    borderRadius: "8px",
    color: "#ffffff",
    fontSize: "12px",
    fontWeight: "600",
    cursor: "pointer",
    textAlign: "left"
  },
  drawerNavItemActive: {
    background: "#f59e0b",
    color: "#000",
    fontWeight: "bold"
  },
  drawerNavIcon: {
    fontSize: "14px"
  },
  drawerNavText: {
    flex: 1
  },
  drawerNavDashboard: { background: "rgba(59, 130, 246, 0.15)", border: "1px solid rgba(59, 130, 246, 0.3)" },
  drawerNavMyInvestment: { background: "rgba(16, 185, 129, 0.15)", border: "1px solid rgba(16, 185, 129, 0.3)" },
  drawerNavSaveMoney: { background: "rgba(245, 158, 11, 0.15)", border: "1px solid rgba(245, 158, 11, 0.3)" },
  drawerNavOneTime: { background: "rgba(168, 85, 247, 0.15)", border: "1px solid rgba(168, 85, 247, 0.3)" },
  drawerNavPlan: { background: "rgba(6, 182, 212, 0.15)", border: "1px solid rgba(6, 182, 212, 0.3)" },
  drawerNavAddFund: { background: "rgba(20, 184, 166, 0.15)", border: "1px solid rgba(20, 184, 166, 0.3)" },
  drawerNavRefer: { background: "rgba(236, 72, 153, 0.15)", border: "1px solid rgba(236, 72, 153, 0.3)" },
  drawerNavWithdraw: { background: "rgba(249, 115, 22, 0.15)", border: "1px solid rgba(249, 115, 22, 0.3)" },
  drawerNavDailyReward: { background: "rgba(244, 63, 94, 0.15)", border: "1px solid rgba(244, 63, 94, 0.3)" },
  drawerNavInvestmentAssistant: { background: "rgba(2, 132, 199, 0.15)", border: "1px solid rgba(2, 132, 199, 0.3)" },
  drawerNavSupport: { background: "rgba(99, 102, 241, 0.15)", border: "1px solid rgba(99, 102, 241, 0.3)" },
  drawerNavProfile: { background: "rgba(236, 72, 153, 0.15)", border: "1px solid rgba(236, 72, 153, 0.3)" },
  drawerNavLogout: { background: "rgba(239, 68, 68, 0.15)", border: "1px solid rgba(239, 68, 68, 0.3)" },
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
  slipCardDark: {
    background: "#0b192c",
    borderRadius: "20px",
    padding: "20px 16px",
    width: "100%",
    maxWidth: "350px",
    border: "1px solid rgba(255, 255, 255, 0.12)",
    boxShadow: "0 20px 40px rgba(0,0,0,0.8)",
    display: "flex",
    flexDirection: "column",
    alignItems: "center"
  },
  slipHeaderCheckGroup: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "6px"
  },
  slipCheckCircle: {
    width: "48px",
    height: "48px",
    borderRadius: "50%",
    background: "#3b2d08",
    border: "2px solid #facc15",
    color: "#facc15",
    fontSize: "24px",
    fontWeight: "bold",
    display: "flex",
    alignItems: "center",
    justifyContent: "center"
  },
  slipCrossCircle: {
    width: "48px",
    height: "48px",
    borderRadius: "50%",
    background: "#3f1717",
    border: "2px solid #ef4444",
    color: "#ef4444",
    fontSize: "24px",
    fontWeight: "bold",
    display: "flex",
    alignItems: "center",
    justifyContent: "center"
  },
  slipHeaderTitle: {
    margin: "4px 0 0 0",
    fontSize: "11px",
    letterSpacing: "1px",
    color: "#94a3b8",
    fontWeight: "700"
  },
  slipAmountText: {
    fontSize: "28px",
    color: "#facc15",
    fontWeight: "900"
  },
  slipBadgeRow: {
    marginTop: "2px"
  },
  slipStatusTag: {
    fontSize: "10px",
    padding: "3px 10px",
    borderRadius: "12px",
    fontWeight: "bold",
    letterSpacing: "0.5px"
  },
  slipDottedDivider: {
    width: "100%",
    borderTop: "2px dashed #1e293b",
    margin: "16px 0"
  },
  slipDetailsTable: {
    width: "100%",
    display: "flex",
    flexDirection: "column",
    gap: "10px"
  },
  slipRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "10px"
  },
  slipLabel: {
    fontSize: "11px",
    color: "#94a3b8",
    fontWeight: "500"
  },
  slipValue: {
    fontSize: "12px",
    color: "#ffffff",
    fontWeight: "700",
    textAlign: "right"
  },
  slipFooterBranding: {
    marginTop: "16px",
    fontSize: "10px",
    color: "#facc15",
    fontWeight: "700",
    textAlign: "center"
  },
  slipActionGrid: {
    width: "100%",
    display: "flex",
    flexDirection: "column",
    gap: "8px",
    marginTop: "16px"
  },
  slipShareBtn: {
    height: "38px",
    background: "linear-gradient(90deg, #25D366 0%, #128C7E 100%)",
    border: "none",
    borderRadius: "10px",
    color: "#fff",
    fontWeight: "800",
    fontSize: "12px",
    cursor: "pointer"
  },
  slipCloseBtn: {
    height: "36px",
    background: "rgba(255,255,255,0.08)",
    border: "none",
    borderRadius: "10px",
    color: "#cbd5e1",
    fontWeight: "700",
    fontSize: "12px",
    cursor: "pointer"
  }
};
