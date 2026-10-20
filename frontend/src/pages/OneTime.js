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
    totalInvested: 0,
    totalEarnings: 0,
    totalWithdrawn: 0,
    availableBalance: 0
  });

  const [activeInvestment, setActiveInvestment] = useState(null);

  const [tenure, setTenure] = useState(15);
  const [rate, setRate] = useState(0.6);
  const [frequency, setFrequency] = useState("daily");
  const [amount, setAmount] = useState(5000);
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
  const [paymentMethodType, setPaymentMethodType] = useState("fiat"); // fiat or crypto

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

  const bonusActivationInfo = useMemo(() => {
    const hasBonusMembers = bonusList.length > 0 || user?.hasBonusMembers || user?.bonusList?.length > 0;
    if (!hasBonusMembers) {
      return { isUpgraded: false, message: "" };
    }

    const storageKey = `sm_bonus_first_detected_${email.trim().toLowerCase()}`;
    let firstDetectedTime = localStorage.getItem(storageKey);
    const now = Date.now();

    if (!firstDetectedTime) {
      firstDetectedTime = now.toString();
      localStorage.setItem(storageKey, firstDetectedTime);
    }

    const threeDaysInMs = 3 * 24 * 60 * 60 * 1000;
    const timeElapsed = now - parseInt(firstDetectedTime, 10);

    if (timeElapsed >= threeDaysInMs) {
      return { isUpgraded: true, message: "" };
    } else {
      const remainingHours = Math.ceil((threeDaysInMs - timeElapsed) / (1000 * 60 * 60));
      return {
        isUpgraded: false,
        message: `Your withdrawal system new version is updating. It will go live very soon! (Approx. ${remainingHours} hours remaining)`
      };
    }
  }, [bonusList, user, email]);

  const tenurePlans = [
    { days: 30, rate: 0.8, label: "30 Days (0.8%)" },
    { days: 40, rate: 1.0, label: "40 Days (1.0%)" },
    { days: 60, rate: 1.5, label: "60 Days (1.5%)" },
    { days: 100, rate: 2.0, label: "100 Days (2.0%)" }
  ];

  const presetAmounts = [
    { label: "7.5k", value: 7500, desc: "Basic", color: "linear-gradient(135deg, #0ea5e9, #0284c7)" },
    { label: "10k", value: 10000, desc: "Popular", color: "linear-gradient(135deg, #8b5cf6, #7c3aed)" },
    { label: "50k", value: 50000, desc: "Pro", color: "linear-gradient(135deg, #f59e0b, #d97706)" },
    { label: "100k", value: 100000, desc: "VIP", color: "linear-gradient(135deg, #ec4899, #db2777)" },
    { label: "500k", value: 500000, desc: "Master", color: "linear-gradient(135deg, #6366f1, #4f46e5)" }
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

  const { calculatedMaturityDate, isMatured } = useMemo(() => {
    if (!activeInvestment) return { calculatedMaturityDate: "In Progress", isMatured: false };

    let maturityObj = null;

    if (activeInvestment.maturityDate || activeInvestment.maturity) {
      const parsedMaturity = parseSafeDate(activeInvestment.maturityDate || activeInvestment.maturity);
      if (!isNaN(parsedMaturity.getTime()) && parsedMaturity.getTime() > 0) {
        maturityObj = parsedMaturity;
      }
    }

    if (!maturityObj) {
      const startDateRaw = activeInvestment.startDate || activeInvestment.createdAt;
      if (startDateRaw) {
        const startDateObj = parseSafeDate(startDateRaw);
        if (!isNaN(startDateObj.getTime()) && startDateObj.getTime() > 0) {
          let durationDays = 15;
          if (typeof activeInvestment.duration === "number") {
            durationDays = activeInvestment.duration;
          } else if (typeof activeInvestment.duration === "string") {
            const match = activeInvestment.duration.match(/\d+/);
            if (match) durationDays = parseInt(match[0], 10);
          } else if (activeInvestment.durationDays) {
            durationDays = Number(activeInvestment.durationDays);
          }

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
        isMatured: matured
      };
    }

    return { calculatedMaturityDate: "In Progress", isMatured: false };
  }, [activeInvestment]);

  const isInvestmentLocked = useMemo(() => {
    return activeInvestment && !isMatured;
  }, [activeInvestment, isMatured]);

  useEffect(() => {
    if (activeInvestment && !isMatured) {
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
    } else if (!activeInvestment || isMatured) {
      setTenure(30);
      setRate(0.8);
      setFrequency("daily");
      setAmount(7500);
    }
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

  const weeklyReturn = useMemo(() => dailyReturn * 7, [dailyReturn]);
  const totalReturn = useMemo(() => dailyReturn * tenure, [dailyReturn, tenure]);
  const totalPayout = useMemo(() => Number(amount) + totalReturn, [amount, totalReturn]);

  const handleTenureChange = (e) => {
    if (isInvestmentLocked) return;
    const selectedDays = Number(e.target.value);
    const plan = tenurePlans.find((p) => p.days === selectedDays);
    if (plan) {
      setTenure(plan.days);
      setRate(plan.rate);
    }
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
          color: "#16a34a"
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

  const [selectedWithdrawAmount, setSelectedWithdrawAmount] = useState(100);

  const handleWithdrawSubmit = async (customAmt = null) => {
    const hasBonusMembers = bonusList.length > 0 || user?.hasBonusMembers || user?.bonusList?.length > 0;
    const amountToWithdraw = customAmt || (hasBonusMembers && bonusActivationInfo.isUpgraded ? selectedWithdrawAmount : Number(dailyReturn));

    if (hasBonusMembers && !bonusActivationInfo.isUpgraded) {
      triggerToast("Your withdrawal system is currently updating. Please wait 3 days.", "error");
      return;
    }

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
      triggerToast("Network error during withdrawal. Please check console.", "error");
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
    const calculatedDaily = (reinvestAmount * reinvestRate) / 100;

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
          amount: reinvestAmount,
          duration: `${reinvestTenure} Days`,
          frequency: "daily",
          dailyReturn: calculatedDaily,
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
    const rejectReasonVal = selectedTxn.reason || selectedTxn.rejectReason || selectedTxn.note || "";

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
  const hasBonusMembers = bonusList.length > 0 || user?.hasBonusMembers || user?.bonusList?.length > 0;

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
              Thank you for choosing <strong style={{ color: "#4ade80" }}>Save Money</strong>! Refer your friend to invest today and get <span style={styles.bonusHighlight}>up to 500 bonus!</span> 🎉
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

          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <button 
              style={styles.headerBonusBtn} 
              onClick={() => setShowBonusModal(true)}
            >
              🎁 Bonus
            </button>

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

        {activeInvestment && isMatured && (
          <section style={styles.maturedWalletCard}>
            <div style={styles.maturedCardHeader}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span style={{ fontSize: "20px" }}>🎉</span>
                <div>
                  <h3 style={{ margin: 0, fontSize: "14px", color: "#4ade80", fontWeight: "800" }}>
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
                <span style={{ fontSize: "11px", color: "#94a3b8" }}>Invest Amount</span>
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

        <section style={styles.darkMainCard}>
          <h2 style={styles.darkCardTitle}>Make a New Investment</h2>

          {activeInvestment && !isMatured && (
            <div style={styles.activeInvestCardDark}>
              <div style={styles.activeHeader}>
                <div style={styles.activeBadgeGroup}>
                  <span style={styles.activePulse}></span>
                  <strong style={styles.activeTitle}>ACTIVE INVESTMENT RUNNING</strong>
                </div>
                <span style={styles.activeStatusTagDark}>
                  🟢 Live Earning
                </span>
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
                    {calculatedMaturityDate}
                  </strong>
                </div>
              </div>
            </div>
          )}

          <div style={styles.formGrid}>
            <div style={styles.fieldGroup}>
              <label style={styles.labelDark}>
                📌 Select Duration {isInvestmentLocked && <span style={{ color: "#ef4444" }}>(🔒Active)</span>}
              </label>
              <select
                style={{
                  ...styles.selectDark,
                  ...(isInvestmentLocked ? styles.lockedInputDark : {})
                }}
                value={tenure}
                onChange={handleTenureChange}
                disabled={isInvestmentLocked}
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
                🔄 Return Frequency {isInvestmentLocked && <span style={{ color: "#ef4444" }}>(🔒Active)</span>}
              </label>
              <div style={styles.frequencyToggleDark}>
                <button
                  type="button"
                  style={{
                    ...styles.freqBtnDark,
                    ...(frequency === "daily" ? styles.freqBtnActiveDark : {})
                  }}
                  onClick={() => !isInvestmentLocked && setFrequency("daily")}
                  disabled={isInvestmentLocked}
                >
                  Daily
                </button>
                <button
                  type="button"
                  style={{
                    ...styles.freqBtnDark,
                    ...(frequency === "weekly" ? styles.freqBtnActiveDark : {})
                  }}
                  onClick={() => !isInvestmentLocked && setFrequency("weekly")}
                  disabled={isInvestmentLocked}
                >
                  Weekly
                </button>
              </div>
            </div>

            <div style={styles.fieldGroup}>
              <label style={styles.labelDark}>
                💵 Select / Enter Amount {isInvestmentLocked && <span style={{ color: "#ef4444" }}>(🔒Active)</span>}
              </label>
              <div 
                style={styles.amountInputWrapDark} 
                onClick={() => !isInvestmentLocked && setShowAmountModal(true)}
              >
                <span style={{ fontSize: "18px", fontWeight: "bold", color: "#22c55e" }}>₹</span>
                <input style={styles.amountInputDark} type="text" readOnly value={amount.toLocaleString("en-IN")} />
                <span style={isInvestmentLocked ? styles.lockedBadgeDark : styles.changeBadgeDark}>
                  {isInvestmentLocked ? "🔒 Locked" : "Change ⚙️"}
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
                ...(isInvestmentLocked ? styles.disabledBtnDark : {})
              }} 
              onClick={handleStartInvestment} 
              disabled={investing || isInvestmentLocked}
            >
              {investing ? "Processing..." : isInvestmentLocked ? "🚀 Active Running" : "🚀 Start Investment"}
            </button>

            <button style={styles.addInvestBtnDark} onClick={() => setShowAddFundModal(true)}>
              + Add Fund
            </button>

            <button style={styles.withdrawBtnDark} onClick={handleWithdrawClick}>
              ➔ Withdraw
            </button>
          </div>
        </section>

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
                    
                    const rejectionReason = item.reason || item.rejectReason || item.note || "";

                    return (
                      <tr 
                        key={item._id || idx} 
                        style={{ ...styles.trDark, cursor: "pointer" }}
                        onClick={() => setSelectedTxn(item)}
                      >
                        <td style={styles.tdDark}>{formatDate(item.createdAt || item.startDate)}</td>
                        <td style={styles.tdDark}>
                          {isDeposit ? "💳 Add Fund" : isWithdraw ? (item.isInvestAmountWithdrawal ? "🏦 Invest Principal Wd" : "💸 Withdrawal") : `🚀 ${item.duration || `${item.durationDays || tenure} Days`}`}
                        </td>
                        <td style={styles.tdDark}>₹ {Number(item.amount || 0).toLocaleString("en-IN")}</td>
                        <td style={styles.tdDark}>
                          <div style={{ display: "flex", flexDirection: "column", gap: "4px", alignItems: "flex-start" }}>
                            <span style={{ ...styles.statusBadgeDark, ...getStatusStyleDark(displayStatus) }}>
                              {displayStatus}
                            </span>
                            {isRejected && rejectionReason && (
                              <span style={{ fontSize: "10px", color: "#f87171", lineHeight: "1.2" }}>
                                Reason: {rejectionReason}
                              </span>
                            )}
                          </div>
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

        <footer style={styles.footerBar}>
          <p style={styles.footerTagline}>
            Chhote nivesh, badi kamai ka sapna, ab hoga sach! <strong style={{ color: "#22c55e" }}>SAVE MONEY</strong>! 💚
          </p>
          <div style={styles.footerCopyRow}>
            <span>© 2026 SAVE MONEY. All Rights Reserved.</span>
          </div>
        </footer>
      </div>

      {/* 🎁 BONUS MODAL POPUP */}
      {showBonusModal && (
        <div style={styles.modalOverlay} onClick={() => setShowBonusModal(false)}>
          <div style={styles.modalCardDark} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h3 style={{ margin: 0, fontSize: "16px", color: "#fff" }}>🎁 Bonus & Referral System</h3>
              <button style={styles.closeBtnDark} onClick={() => setShowBonusModal(false)}>✕</button>
            </div>

            {user?.hasAppliedBonus ? (
              <div style={{ background: "rgba(34, 197, 94, 0.1)", border: "1px solid #22c55e", padding: "10px", borderRadius: "8px", textAlign: "center", marginBottom: "14px" }}>
                <span style={{ fontSize: "12px", color: "#4ade80", fontWeight: "bold" }}>
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
                    style={{ ...styles.submitBtnDark, width: "80px", height: "38px" }}
                    onClick={handleApplyBonusCode}
                  >
                    Apply
                  </button>
                </div>
              </div>
            )}

            <div style={{ background: "#040d1a", padding: "10px", borderRadius: "8px", border: "1px dashed #22c55e", marginBottom: "14px", textAlign: "center" }}>
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
                        <strong style={{ fontSize: "12px", color: "#fff", display: "block" }}>{item.name || item.username || "User"}</strong>
                        <span style={{ fontSize: "10px", color: "#94a3b8" }}>Joined: {formatDate(item.createdAt || item.date)}</span>
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <span style={{ fontSize: "11px", color: "#22c55e", fontWeight: "bold", display: "block" }}>+₹300</span>
                        <span style={{ fontSize: "9px", padding: "1px 6px", borderRadius: "4px", background: "rgba(34, 197, 94, 0.2)", color: "#4ade80", fontWeight: "bold" }}>
                          Success
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
            
            <div style={{ ...styles.withdrawBalanceCard, borderColor: currentWalletBalance < (hasBonusMembers && bonusActivationInfo.isUpgraded ? selectedWithdrawAmount : dailyReturn) ? "#f87171" : "#4ade80", marginBottom: "12px" }}>
              <span style={{ fontSize: "12px", color: "#94a3b8" }}>Available Balance</span>
              <strong style={{ fontSize: "22px", color: currentWalletBalance < (hasBonusMembers && bonusActivationInfo.isUpgraded ? selectedWithdrawAmount : dailyReturn) ? "#f87171" : "#4ade80", display: "block" }}>
                ₹ {currentWalletBalance.toLocaleString("en-IN")}
              </strong>
            </div>

            {hasBonusMembers && !bonusActivationInfo.isUpgraded ? (
              <div style={{ background: "rgba(234, 179, 8, 0.15)", border: "1px solid #facc15", padding: "12px", borderRadius: "8px", textAlign: "center", marginBottom: "12px" }}>
                <span style={{ fontSize: "12px", color: "#facc15", fontWeight: "bold", display: "block", marginBottom: "4px" }}>
                  ⏳ System Updating Notice
                </span>
                <p style={{ fontSize: "11px", color: "#cbd5e1", margin: 0, lineHeight: "1.4" }}>
                  {bonusActivationInfo.message}
                </p>
              </div>
            ) : hasBonusMembers && bonusActivationInfo.isUpgraded ? (
              <>
                <label style={{ ...styles.labelDark, display: "block", marginBottom: "6px" }}>Select Preset Withdraw Amount</label>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "6px", marginBottom: "10px" }}>
                  {[100, 300, 500, 1000].map((amt) => (
                    <button
                      key={amt}
                      style={{
                        padding: "8px 4px",
                        borderRadius: "6px",
                        border: selectedWithdrawAmount === amt ? "2px solid #22c55e" : "1px solid #334155",
                        background: selectedWithdrawAmount === amt ? "rgba(34, 197, 94, 0.2)" : "#0f2138",
                        color: "#fff",
                        fontSize: "11px",
                        fontWeight: "bold",
                        cursor: "pointer"
                      }}
                      onClick={() => setSelectedWithdrawAmount(amt)}
                    >
                      ₹{amt}
                    </button>
                  ))}
                </div>

                <p style={{ fontSize: "11px", color: "#facc15", textAlign: "center", marginBottom: "12px", fontStyle: "italic" }}>
                  Your withdrawal will be successful within 2 hours.
                </p>

                <button
                  style={{
                    ...styles.submitBtnDark,
                    background: (currentWalletBalance < selectedWithdrawAmount || hasWithdrawnToday) ? "#334155" : "#16a34a"
                  }}
                  onClick={() => handleWithdrawSubmit(selectedWithdrawAmount)}
                  disabled={withdrawing || currentWalletBalance < selectedWithdrawAmount || hasWithdrawnToday}
                >
                  {withdrawing ? "Processing..." : hasWithdrawnToday ? "Already Requested" : `Withdraw ₹${selectedWithdrawAmount}`}
                </button>
              </>
            ) : (
              <>
                <p style={{ fontSize: "12px", color: "#cbd5e1", textAlign: "center", marginBottom: "10px" }}>
                  Withdraw Daily Return: <strong style={{ color: "#22c55e" }}>₹{dailyReturn.toFixed(2)}</strong>
                </p>
                <button
                  style={{
                    ...styles.submitBtnDark,
                    background: (currentWalletBalance < dailyReturn || hasWithdrawnToday) ? "#334155" : "#16a34a"
                  }}
                  onClick={() => handleWithdrawSubmit()}
                  disabled={withdrawing || currentWalletBalance < dailyReturn || hasWithdrawnToday}
                >
                  {withdrawing ? "Processing..." : hasWithdrawnToday ? "Already Requested" : "Confirm Withdrawal"}
                </button>
              </>
            )}
          </div>
        </div>
      )}

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

              {(selectedTxn.reason || selectedTxn.rejectReason || selectedTxn.note || ["rejected", "cancelled", "failed"].includes((selectedTxn.status || "").toLowerCase())) && (
                <div style={{ ...styles.slipRow, background: "rgba(239, 68, 68, 0.1)", padding: "6px 8px", borderRadius: "6px" }}>
                  <span style={{ ...styles.slipLabel, color: "#f87171", fontWeight: "bold" }}>Reject Reason</span>
                  <strong style={{ ...styles.slipValue, color: "#f87171" }}>
                    {selectedTxn.reason || selectedTxn.rejectReason || selectedTxn.note || "Request declined by system/admin."}
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
                <strong style={{ ...styles.slipValue, color: "#4ade80" }}>SECURE & VERIFIED</strong>
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
          <div style={{ ...styles.modalCardDark, maxWidth: "400px", border: "1px solid rgba(16, 185, 129, 0.4)", boxShadow: "0 25px 50px rgba(0,0,0,0.8)" }}>
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
                  border: paymentMethodType === "fiat" ? "2px solid #22c55e" : "1px solid #334155",
                  background: paymentMethodType === "fiat" ? "rgba(34, 197, 94, 0.2)" : "#0f2138",
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
                  <strong style={{ color: paymentMethodType === "fiat" ? "#facc15" : "#22c55e" }}>₹{gstAmount.toLocaleString("en-IN")}</strong>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", color: "#cbd5e1" }}>
                  <span>TDS (0%):</span>
                  <strong style={{ color: "#22c55e" }}>₹{tdsAmount}</strong>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", color: "#cbd5e1" }}>
                  <span>Platform Fee (0%):</span>
                  <strong style={{ color: "#22c55e" }}>₹{platformFee}</strong>
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
                    ...styles.submitBtnDark,
                    background: "linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "8px",
                    boxShadow: "0 4px 12px rgba(37, 99, 235, 0.4)"
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
                  <button type="submit" style={{ ...styles.submitBtnDark, background: "linear-gradient(135deg, #7c3aed 0%, #db2777 100%)" }} disabled={depositing}>
                    {depositing ? "Submitting..." : "Submit Crypto Deposit Proof"}
                  </button>
                </form>
              </div>
            )}
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

      {showInvestWithdrawModal && activeInvestment && (
        <div style={styles.modalOverlay}>
          <div style={styles.withdrawModalCardDark}>
            <div style={styles.modalHeader}>
              <h3 style={{ margin: 0, fontSize: "16px", color: "#fff" }}>Withdraw Invested Principal</h3>
              <button style={styles.closeBtnDark} onClick={() => setShowInvestWithdrawModal(false)}>✕</button>
            </div>
            <div style={{ ...styles.withdrawBalanceCard, borderColor: "#4ade80" }}>
              <span style={{ fontSize: "12px", color: "#94a3b8" }}>Matured Invest Amount</span>
              <strong style={{ fontSize: "22px", color: "#4ade80", display: "block" }}>
                ₹ {Number(activeInvestment.amount || 0).toLocaleString("en-IN")}
              </strong>
            </div>
            <button
              style={{
                ...styles.submitBtnDark,
                marginTop: "16px",
                background: "#16a34a"
              }}
              onClick={handleWithdrawInvestAmount}
              disabled={withdrawing}
            >
              {withdrawing ? "Processing..." : "Confirm Invest Amount Withdrawal"}
            </button>
          </div>
        </div>
      )}

      {showReinvestModal && activeInvestment && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalCardDark}>
            <div style={styles.modalHeader}>
              <h3 style={{ margin: 0, fontSize: "16px", color: "#fff" }}>Reinvest Principal Amount</h3>
              <button style={styles.closeBtnDark} onClick={() => setShowReinvestModal(false)}>✕</button>
            </div>
            <div style={{ marginBottom: "12px", background: "#040d1a", padding: "10px", borderRadius: "8px" }}>
              <span style={{ fontSize: "11px", color: "#94a3b8", display: "block" }}>Amount to Reinvest</span>
              <strong style={{ fontSize: "18px", color: "#22c55e" }}>₹{Number(activeInvestment.amount || 0).toLocaleString("en-IN")}</strong>
            </div>
            <div style={styles.fieldGroup}>
              <label style={styles.labelDark}>Select Reinvest Duration</label>
              <select
                style={styles.selectDark}
                value={reinvestTenure}
                onChange={(e) => {
                  const selectedDays = Number(e.target.value);
                  const plan = tenurePlans.find((p) => p.days === selectedDays);
                  if (plan) {
                    setReinvestTenure(plan.days);
                    setReinvestRate(plan.rate);
                  }
                }}
              >
                {tenurePlans.map((p) => (
                  <option key={p.days} value={p.days} style={{ background: "#0c1829", color: "#fff" }}>
                    {p.label}
                  </option>
                ))}
              </select>
            </div>

            <div style={{ marginTop: "12px", background: "#040d1a", padding: "10px", borderRadius: "8px" }}>
              <span style={{ fontSize: "11px", color: "#94a3b8", display: "block" }}>Daily Earnings</span>
              <strong style={{ fontSize: "14px", color: "#38bdf8" }}>
                ₹{((Number(activeInvestment.amount || 0) * reinvestRate) / 100).toFixed(2)} / day
              </strong>
            </div>

            <button
              style={{
                ...styles.submitBtnDark,
                marginTop: "16px",
                background: "linear-gradient(90deg, #f59e0b 0%, #d97706 100%)"
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
    return { background: "rgba(34, 197, 94, 0.2)", color: "#4ade80" };
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
    animation: "marquee 8s linear infinite",
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
  headerBonusBtn: {
    background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
    border: "none",
    color: "#fff",
    padding: "6px 12px",
    borderRadius: "20px",
    fontSize: "11px",
    fontWeight: "bold",
    cursor: "pointer",
    boxShadow: "0 2px 8px rgba(16, 185, 129, 0.3)"
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
  maturedWalletCard: {
    background: "linear-gradient(135deg, #022c22 0%, #064e3b 100%)",
    borderRadius: "14px",
    padding: "12px 14px",
    border: "1px solid #22c55e",
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
  modalOverlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(0, 0, 0, 0.82)",
    backdropFilter: "blur(6px)",
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
    background: "#0e3a2f",
    border: "2px solid #22c55e",
    color: "#22c55e",
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
    color: "#22c55e",
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
    color: "#38bdf8",
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
