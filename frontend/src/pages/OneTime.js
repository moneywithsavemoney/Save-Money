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
    if (user && user.bonusCode) return user.bonusCode;
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

  // New Investment Category & Plans State
  const [selectedCategory, setSelectedCategory] = useState("beginner"); // "beginner" or "pro"
  const [beginnerAmount, setBeginnerAmount] = useState(7500);
  const [proAmount, setProAmount] = useState(99999);
  const [tenureMonths, setTenureMonths] = useState(6);
  const [frequency, setFrequency] = useState("daily");

  const [showPlanModal, setShowPlanModal] = useState(false);
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

  // Dynamic Rate Calculation Engine
  const calculateRateAndReturn = () => {
    let rate = 0;
    let amt = selectedCategory === "beginner" ? beginnerAmount : proAmount;

    if (selectedCategory === "beginner") {
      if (amt === 7500) rate = 0.8;
      else if (amt === 15000) rate = tenureMonths >= 9 ? 1.2 : 1.0;
      else if (amt === 22500) rate = tenureMonths >= 9 ? 1.5 : 1.2;
      else if (amt === 30000) rate = tenureMonths >= 9 ? 1.7 : 1.5;
      else if (amt === 37500) rate = tenureMonths >= 9 ? 2.0 : 1.7;
    } else {
      if (amt === 99999) rate = 2.0;
      else if (amt === 139999) rate = 3.0;
      else if (amt === 189999) rate = 3.5;
      else if (amt === 249999) rate = 4.5;
      else if (amt === 500000) rate = 6.0;
    }

    const daily = (amt * rate) / 100;
    return { amt, rate, daily };
  };

  const { amt: currentAmount, rate: currentRate, daily: currentDailyReturn } = calculateRateAndReturn();
  const gstAmount = paymentMethodType === "fiat" ? Math.round(currentAmount * 0.02) : 0;
  const totalAddMoney = currentAmount + gstAmount;

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API}/api/onetime/dashboard`, {
        method: "POST",
        headers: { "Content-Type": "application/json", authorization: token },
        body: JSON.stringify({ email })
      });

      const data = await res.json();
      if (res.ok) {
        setUser(data.user || {});
        if (data.bonusList || data.user?.bonusList) {
          setBonusList(data.bonusList || data.user?.bonusList || []);
        }

        const rawHistory = Array.isArray(data.history) ? data.history : [];
        const sortedHistory = rawHistory.sort((a, b) => parseSafeDate(b.createdAt) - parseSafeDate(a.createdAt));
        setHistory(sortedHistory);

        if (data.stats) {
          setStats({
            totalInvested: data.stats.totalInvested || 15000,
            totalEarnings: data.stats.totalEarnings || 2951,
            totalWithdrawn: data.stats.totalWithdraw || 2121,
            availableBalance: data.stats.availableBalance || 584
          });
        }
        if (data.activeInvestment) setActiveInvestment(data.activeInvestment);
        if (data.user?.bankDetails) setBankForm(data.user.bankDetails);
      }
    } catch (err) {
      console.log("Dashboard load error", err);
    } finally {
      setLoading(false);
    }
  };

  const handleApplyBonusCode = async () => {
    if (!bonusInputCode) {
      triggerToast("অনুগ্রহ করে বোনাস কোড লিখুন", "error");
      return;
    }
    try {
      const res = await fetch(`${API}/api/onetime/apply-bonus`, {
        method: "POST",
        headers: { "Content-Type": "application/json", authorization: token },
        body: JSON.stringify({ email, bonusCode: bonusInputCode })
      });
      const data = await res.json();
      if (res.ok || data.success) {
        triggerToast("বোনাস কোড সফলভাবে যুক্ত হয়েছে!", "success");
        setBonusInputCode("");
        setUser((prev) => ({ ...prev, hasAppliedBonus: true }));
        await loadDashboardData();
      } else {
        triggerToast(data.message || "ভুল বোনাস কোড", "error");
      }
    } catch (err) {
      triggerToast("নেটওয়ার্ক ত্রুটি", "error");
    }
  };

  const handleStartInvestment = async () => {
    if (currentWalletBalance < currentAmount) {
      triggerToast(`অপর্যাপ্ত ব্যালেন্স! আপনার ওয়ালেটে আছে ₹${currentWalletBalance}। আগে ফান্ড যোগ করুন।`, "error");
      return;
    }

    try {
      setWithdrawing(true);
      const res = await fetch(`${API}/api/onetime/create-investment`, {
        method: "POST",
        headers: { "Content-Type": "application/json", authorization: token },
        body: JSON.stringify({
          email,
          amount: currentAmount,
          tenureMonths,
          category: selectedCategory
        })
      });

      const data = await res.json();
      if (res.ok || data.success) {
        triggerToast("🚀 ইনভেস্টমেন্ট সফলভাবে শুরু হয়েছে!", "success");
        setShowPlanModal(false);
        await loadDashboardData();
      } else {
        triggerToast(data.message || "ইনভেস্টমেন্ট ব্যর্থ হয়েছে", "error");
      }
    } catch (err) {
      triggerToast("সার্ভার ত্রুটি", "error");
    } finally {
      setWithdrawing(false);
    }
  };

  const handleDepositSubmit = async (e) => {
    e.preventDefault();
    if (!txnId || !screenshot) {
      triggerToast("লেনদেন আইডি এবং স্ক্রিনশট দিন", "error");
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
        triggerToast("ডিপোজিট রিকোয়েস্ট সাবমিট হয়েছে!", "success");
        setShowAddFundModal(false);
        setTxnId("");
        setScreenshot(null);
        await loadDashboardData();
      } else {
        triggerToast(data.message || "ফেইলড", "error");
      }
    } catch (err) {
      triggerToast("আপলোড ত্রুটি", "error");
    } finally {
      setDepositing(false);
    }
  };

  const handleWithdrawClick = () => {
    if (!user.bankDetails?.accountNumber) setShowBankModal(true);
    else setShowWithdrawModal(true);
  };

  const handleWithdrawSubmit = async () => {
    try {
      setWithdrawing(true);
      const res = await fetch(`${API}/api/onetime/withdraw`, {
        method: "POST",
        headers: { "Content-Type": "application/json", authorization: token },
        body: JSON.stringify({ email, amount: 500, bankDetails: user.bankDetails || bankForm })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        triggerToast("উইথড্র রিকোয়েস্ট সফল!", "success");
        setShowWithdrawModal(false);
        await loadDashboardData();
      } else {
        triggerToast(data.message || "ফেইলড", "error");
      }
    } catch (err) {
      triggerToast("উইথড্র ত্রুটি", "error");
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

  const displayedHistory = showAllHistory ? history : (history.length > 0 ? history.slice(0, 5) : [
    { createdAt: "20/10/2026", type: "Add Fund", amount: 7500, status: "Rejected", reason: "Insufficient Balance" },
    { createdAt: "19/10/2026", type: "Add Fund", amount: 1, status: "Success", reason: "-" },
    { createdAt: "19/10/2026", type: "30 Days", amount: 100, status: "Rejected", reason: "KYC Not Verified" },
    { createdAt: "19/10/2026", type: "Add Fund", amount: 1, status: "Success", reason: "-" },
    { createdAt: "18/10/2026", type: "Withdrawal", amount: 500, status: "Rejected", reason: "Payment Gateway Error" }
  ]);

  return (
    <div style={styles.page}>
      {/* SIDEBAR DRAWER */}
      <div style={{ ...styles.drawerOverlay, opacity: isDrawerOpen ? 1 : 0, visibility: isDrawerOpen ? "visible" : "hidden" }} onClick={() => setIsDrawerOpen(false)}>
        <div style={{ ...styles.drawerContainer, transform: isDrawerOpen ? "translateX(0)" : "translateX(-100%)" }} onClick={(e) => e.stopPropagation()}>
          <div style={styles.drawerHeader}>
            <h3 style={{ color: "#fff", margin: 0 }}>SAVE MONEY</h3>
            <span style={{ fontSize: "10px", color: "#4ade80" }}>Invest Small, Earn Big</span>
          </div>
          <div style={styles.drawerNavList}>
            <button style={styles.drawerNavItem} onClick={() => { navigate("/home"); setIsDrawerOpen(false); }}>🏠 Dashboard</button>
            <button style={styles.drawerNavItem} onClick={() => { navigate("/my-investment"); setIsDrawerOpen(false); }}>📈 My Investment</button>
            <button style={styles.drawerNavItem} onClick={() => { navigate("/wallet"); setIsDrawerOpen(false); }}>🌐 Add Fund</button>
            <button style={styles.drawerNavItem} onClick={() => { navigate("/refer"); setIsDrawerOpen(false); }}>👥 Refer & Earn</button>
            <button style={styles.drawerNavItem} onClick={() => { navigate("/withdraw"); setIsDrawerOpen(false); }}>➔ Withdraw</button>
            <button style={styles.drawerNavItem} onClick={() => { navigate("/kyc"); setIsDrawerOpen(false); }}>👤 Profile</button>
            <button style={{ ...styles.drawerNavItem, background: "rgba(239, 68, 68, 0.2)", color: "#f87171" }} onClick={() => { localStorage.clear(); navigate("/login"); }}>🚪 Logout</button>
          </div>
        </div>
      </div>

      <div style={styles.container}>
        {toast.show && (
          <div style={{ ...styles.toast, background: toast.type === "error" ? "#ef4444" : "#16a34a" }}>
            <span>{toast.msg}</span>
          </div>
        )}

        {/* HEADER */}
        <header style={styles.header}>
          <div style={styles.headerLeft}>
            <button style={styles.menuBtn} onClick={() => setIsDrawerOpen(true)}>
              <span style={styles.menuLine}></span>
              <span style={styles.menuLine}></span>
              <span style={styles.menuLine}></span>
            </button>
            <div style={styles.brandGroup}>
              <div style={styles.logoBadge}>📈</div>
              <div>
                <h1 style={styles.brandTitle}>Save Money</h1>
                <p style={styles.brandSub}>Invest Smartly & Secure Your Future</p>
              </div>
            </div>
          </div>

          <div style={styles.headerRight}>
            <button style={styles.goldBonusBtn} onClick={() => setShowBonusModal(true)}>
              🎁 Bonus <span style={styles.bonusBadgeCount}>0</span>
            </button>
            <div style={styles.userProfileCircle} onClick={() => navigate("/kyc")}>
              <span style={{ fontSize: "16px", color: "#fff" }}>👤</span>
              <span style={{ fontSize: "11px", color: "#e2e8f0" }}>User ▼</span>
            </div>
          </div>
        </header>

        {/* HERO BANNER */}
        <div style={styles.heroBannerGold}>
          <div style={styles.heroLeftText}>
            <h2 style={styles.welcomeTitle}>Welcome Back! 🖐</h2>
            <p style={styles.welcomeHeadline}>
              Chhote nivesh se <br />
              <strong style={{ color: "#facc15", fontSize: "15px" }}>badi kamai ka safar,</strong> <br />
              <span style={{ color: "#ffffff" }}>har mahine ka plan, hamesha</span>
            </p>
            <div style={styles.shieldBadgeRow}>
              <span>🛡️</span>
              <span style={{ fontSize: "10px", color: "#cbd5e1" }}>Invest small amounts monthly to get big returns together</span>
            </div>
          </div>
          <div style={styles.heroRightGraphic}>
            <div style={styles.growWealthText}>Grow <br /> Your <br /> Wealth</div>
            <img src="/tree plant.png" alt="Growth" style={styles.growthGraphicImg} onError={(e) => { e.target.style.display = 'none'; }} />
          </div>
        </div>

        {/* STATS QUAD GRID */}
        <section style={styles.statsQuadGrid}>
          <div style={styles.statGoldBox}>
            <div style={styles.statIconBadgeGreen}>👛</div>
            <span style={styles.statLabel}>Total Invested</span>
            <strong style={styles.statValue}>₹ {Number(stats.totalInvested).toLocaleString("en-IN")}</strong>
            <span style={styles.statTrendUp}>↗ +12%</span>
          </div>

          <div style={styles.statGoldBox}>
            <div style={styles.statIconBadgeGold}>🪙</div>
            <span style={styles.statLabel}>Total Earnings</span>
            <strong style={styles.statValue}>₹ {Number(stats.totalEarnings).toLocaleString("en-IN")}</strong>
            <span style={styles.statTrendUp}>↗ +18%</span>
          </div>

          <div style={styles.statGoldBox}>
            <div style={styles.statIconBadgePurple}>💸</div>
            <span style={styles.statLabel}>Total Withdraw</span>
            <strong style={styles.statValue}>₹ {Number(stats.totalWithdrawn).toLocaleString("en-IN")}</strong>
            <span style={styles.statTrendUp}>↗ +16%</span>
          </div>

          <div style={styles.statGoldBox}>
            <div style={styles.statIconBadgeBlue}>💳</div>
            <span style={styles.statLabel}>Available Balance</span>
            <strong style={styles.statValue}>₹ {currentWalletBalance.toLocaleString("en-IN")}</strong>
            <span style={styles.statTrendUp}>↗ +5%</span>
          </div>
        </section>

        {/* DAILY RETURN BANNER */}
        <section style={styles.dailyReturnHeroCard}>
          <div style={styles.dailyReturnLeft}>
            <span style={{ fontSize: "32px" }}>📅</span>
            <div>
              <span style={styles.dailyReturnLabel}>Daily Return</span>
              <strong style={styles.dailyReturnValue}>₹ 60.00</strong>
              <span style={styles.dailyReturnSub}>(Approx. Per Day)</span>
            </div>
          </div>

          <div style={styles.dailyReturnRight}>
            <span style={{ fontSize: "10px", color: "#cbd5e1" }}>Your Investment is</span>
            <strong style={{ fontSize: "13px", color: "#4ade80", display: "block" }}>Growing Every Day 📈</strong>
          </div>

          <div style={styles.dailyCardActionRow}>
            <button style={styles.goldAddFundBtn} onClick={() => setShowAddFundModal(true)}>
              <span style={styles.btnPlusCircle}>+</span>
              <div>
                <strong style={{ display: "block", fontSize: "12px" }}>Add Fund</strong>
                <span style={{ fontSize: "8px", opacity: 0.8 }}>Grow Your Balance</span>
              </div>
              <span style={{ marginLeft: "auto" }}>›</span>
            </button>

            <button style={styles.goldWithdrawBtn} onClick={handleWithdrawClick}>
              <span style={{ fontSize: "16px" }}>👛</span>
              <div>
                <strong style={{ display: "block", fontSize: "12px" }}>Withdraw</strong>
                <span style={{ fontSize: "8px", opacity: 0.8 }}>Get Your Money</span>
              </div>
              <span style={{ marginLeft: "auto" }}>›</span>
            </button>
          </div>
        </section>

        {/* MAKE A NEW INVESTMENT */}
        <section style={styles.newInvestmentSection}>
          <div style={styles.sectionHeaderRow}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span style={{ fontSize: "20px" }}>🌱</span>
              <div>
                <h3 style={styles.sectionTitle}>Make a New Investment</h3>
                <p style={styles.sectionSub}>Choose your plan and start growing your wealth today</p>
              </div>
            </div>
            <div style={styles.smallStepsBadge}>
              <span style={{ fontStyle: "italic", color: "#facc15", fontSize: "11px" }}>Small Steps</span>
              <strong style={{ display: "block", fontSize: "11px", color: "#fff" }}>Big Returns</strong>
            </div>
          </div>

          <div style={styles.planSelectionGrid}>
            <div style={styles.planCard}>
              <div style={styles.planCardHeader}>
                <div style={styles.sproutBadge}>🌱</div>
                <div>
                  <h4 style={styles.planTitle}>Beginner Investment</h4>
                  <p style={styles.planSub}>Safe • Stable • Good for Start</p>
                </div>
              </div>
              <ul style={styles.planFeatureList}>
                <li>✔ Low Risk</li>
                <li>✔ Daily Returns</li>
                <li>✔ Flexible Investment</li>
              </ul>
              <button style={styles.startBeginnerBtn} onClick={() => { setSelectedCategory("beginner"); setShowPlanModal(true); }}>
                Start Beginner ›
              </button>
            </div>

            <div style={{ ...styles.planCard, background: "linear-gradient(135deg, #130d02 0%, #261a04 100%)" }}>
              <div style={styles.planCardHeader}>
                <div style={styles.crownBadge}>👑</div>
                <div>
                  <h4 style={{ ...styles.planTitle, color: "#facc15" }}>Pro Investment</h4>
                  <p style={styles.planSub}>Higher Returns • Faster Growth</p>
                </div>
              </div>
              <ul style={styles.planFeatureList}>
                <li>✔ High Profit Potential</li>
                <li>✔ Premium Benefits</li>
                <li>✔ Advanced Plan</li>
              </ul>
              <button style={styles.startProBtn} onClick={() => { setSelectedCategory("pro"); setShowPlanModal(true); }}>
                Start Pro ›
              </button>
            </div>
          </div>
        </section>

        {/* TRANSACTION HISTORY */}
        <section style={styles.transactionSection}>
          <div style={styles.transHeaderRow}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span style={{ fontSize: "18px" }}>🕒</span>
              <h3 style={styles.transTitle}>Transaction History</h3>
              <span style={styles.liveUpdatesPill}>Live Updates</span>
            </div>
            <span style={styles.viewAllBtn} onClick={() => setShowAllHistory(!showAllHistory)}>
              View All Transactions ›
            </span>
          </div>

          <div style={styles.tableResponsive}>
            <table style={styles.historyTable}>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Type</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Reason</th>
                </tr>
              </thead>
              <tbody>
                {displayedHistory.map((item, idx) => {
                  const statusLower = (item.status || "").toLowerCase();
                  const isRejected = statusLower === "rejected" || statusLower === "failed";
                  return (
                    <tr key={idx}>
                      <td style={{ color: "#cbd5e1" }}>{item.createdAt || formatDate(item.date)}</td>
                      <td>{item.type}</td>
                      <td style={{ fontWeight: "bold" }}>₹ {Number(item.amount).toLocaleString("en-IN")}</td>
                      <td>
                        <span style={{
                          padding: "2px 6px",
                          borderRadius: "10px",
                          fontSize: "9px",
                          fontWeight: "bold",
                          background: isRejected ? "rgba(239, 68, 68, 0.2)" : "rgba(34, 197, 94, 0.2)",
                          color: isRejected ? "#f87171" : "#4ade80"
                        }}>
                          {isRejected ? "✖ Rejected" : "✔ Success"}
                        </span>
                      </td>
                      <td style={{ color: isRejected ? "#f87171" : "#94a3b8", fontSize: "10px" }}>
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

      {/* PLAN MODAL */}
      {showPlanModal && (
        <div style={styles.modalOverlay} onClick={() => setShowPlanModal(false)}>
          <div style={styles.modalCard} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h3>{selectedCategory === "beginner" ? "Beginner" : "Pro"} Plan Setup</h3>
              <button style={styles.closeBtn} onClick={() => setShowPlanModal(false)}>✕</button>
            </div>
            {selectedCategory === "beginner" ? (
              <div>
                <label style={styles.inputLabel}>Select Amount</label>
                <div style={styles.amountGrid}>
                  {[7500, 15000, 22500, 30000, 37500].map((amt) => (
                    <button key={amt} style={{ ...styles.amtChoiceBtn, background: beginnerAmount === amt ? "#22c55e" : "#0f2138" }} onClick={() => setBeginnerAmount(amt)}>
                      ₹{amt}
                    </button>
                  ))}
                </div>
                <label style={{ ...styles.inputLabel, marginTop: "10px" }}>Tenure (Months)</label>
                <div style={{ display: "flex", gap: "4px" }}>
                  {[6, 9, 12, 18, 24].map((m) => (
                    <button key={m} style={{ flex: 1, padding: "6px", background: tenureMonths === m ? "#2563eb" : "#0f2138", color: "#fff", border: "none", borderRadius: "6px" }} onClick={() => setTenureMonths(m)}>
                      {m}M
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div>
                <label style={styles.inputLabel}>Select Pro Amount (Min 12M)</label>
                <div style={styles.amountGrid}>
                  {[99999, 139999, 189999, 249999, 500000].map((amt) => (
                    <button key={amt} style={{ ...styles.amtChoiceBtn, background: proAmount === amt ? "#f59e0b" : "#0f2138" }} onClick={() => setProAmount(amt)}>
                      ₹{amt}
                    </button>
                  ))}
                </div>
              </div>
            )}
            <div style={styles.calculationPreview}>
              <div>Daily Rate: <strong style={{ color: "#facc15" }}>{currentRate}%</strong></div>
              <div>Daily Income: <strong style={{ color: "#4ade80" }}>₹ {currentDailyReturn.toFixed(2)}</strong></div>
            </div>
            <button style={styles.confirmInvestBtn} onClick={handleStartInvestment} disabled={withdrawing}>
              {withdrawing ? "Processing..." : "Confirm & Start 🚀"}
            </button>
          </div>
        </div>
      )}

      {/* BONUS MODAL */}
      {showBonusModal && (
        <div style={styles.modalOverlay} onClick={() => setShowBonusModal(false)}>
          <div style={styles.modalCard} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h3>🎁 Bonus & Referrals</h3>
              <button style={styles.closeBtn} onClick={() => setShowBonusModal(false)}>✕</button>
            </div>
            <div style={{ marginBottom: "10px" }}>
              <label style={styles.inputLabel}>Enter Bonus Code</label>
              <div style={{ display: "flex", gap: "6px", marginTop: "4px" }}>
                <input style={styles.modalInput} placeholder="e.g. ot324556" value={bonusInputCode} onChange={(e) => setBonusInputCode(e.target.value)} />
                <button style={{ padding: "8px 12px", background: "#16a34a", border: "none", color: "#fff", borderRadius: "6px", fontWeight: "bold" }} onClick={handleApplyBonusCode}>Apply</button>
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
              <h3>Add Investment Fund</h3>
              <button style={styles.closeBtn} onClick={() => setShowAddFundModal(false)}>✕</button>
            </div>
            <form onSubmit={handleDepositSubmit} style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              <p style={{ fontSize: "11px", color: "#cbd5e1" }}>Total: <strong style={{ color: "#facc15" }}>₹{totalAddMoney.toLocaleString("en-IN")}</strong> (Includes 2% GST)</p>
              <input style={styles.modalInput} placeholder="Transaction ID / UTR No." value={txnId} onChange={(e) => setTxnId(e.target.value)} required />
              <input type="file" accept="image/*" onChange={(e) => setScreenshot(e.target.files[0])} required />
              <button type="submit" style={styles.modalSubmitBtn} disabled={depositing}>{depositing ? "Submitting..." : "Submit Proof"}</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  page: { minHeight: "100vh", width: "100%", background: "#020813", padding: "12px", fontFamily: "sans-serif", color: "#fff", boxSizing: "border-box", display: "flex", justifyContent: "center" },
  container: { width: "100%", maxWidth: "480px", display: "flex", flexDirection: "column", gap: "14px" },
  loadingPage: { minHeight: "100vh", background: "#020813", display: "flex", alignItems: "center", justifyContent: "center" },
  spinner: { width: "36px", height: "36px", border: "3px solid rgba(250, 204, 21, 0.2)", borderTop: "3px solid #facc15", borderRadius: "50%", animation: "spin 1s linear infinite" },
  toast: { position: "fixed", top: "16px", left: "50%", transform: "translateX(-50px)", color: "#fff", padding: "8px 16px", borderRadius: "20px", zIndex: 99999, fontSize: "12px", fontWeight: "bold" },
  drawerOverlay: { position: "fixed", inset: 0, background: "rgba(0,0,0,0.8)", zIndex: 100000, transition: "0.3s" },
  drawerContainer: { position: "fixed", top: 0, bottom: 0, left: 0, width: "220px", background: "#071120", padding: "16px", display: "flex", flexDirection: "column", gap: "16px", zIndex: 100001, transition: "0.3s" },
  drawerHeader: { borderBottom: "1px solid rgba(255,255,255,0.1)", paddingBottom: "10px" },
  drawerNavList: { display: "flex", flexDirection: "column", gap: "8px" },
  drawerNavItem: { background: "rgba(255,255,255,0.05)", border: "none", padding: "10px", borderRadius: "8px", color: "#fff", textAlign: "left", cursor: "pointer", fontWeight: "bold", fontSize: "12px" },
  header: { display: "flex", alignItems: "center", justifyContent: "space-between" },
  headerLeft: { display: "flex", alignItems: "center", gap: "8px" },
  menuBtn: { background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px", padding: "8px", cursor: "pointer", display: "flex", flexDirection: "column", gap: "3px" },
  menuLine: { width: "16px", height: "2px", background: "#fff", borderRadius: "2px" },
  brandGroup: { display: "flex", alignItems: "center", gap: "6px" },
  logoBadge: { background: "linear-gradient(135deg, #f59e0b, #d97706)", padding: "4px 8px", borderRadius: "8px" },
  brandTitle: { margin: 0, fontSize: "15px", fontWeight: "900" },
  brandSub: { margin: 0, fontSize: "8px", color: "#cbd5e1" },
  headerRight: { display: "flex", alignItems: "center", gap: "6px" },
  goldBonusBtn: { background: "linear-gradient(135deg, #372502, #684806)", border: "1px solid #facc15", color: "#facc15", borderRadius: "20px", padding: "4px 8px", fontSize: "10px", fontWeight: "bold", display: "flex", alignItems: "center", gap: "4px", cursor: "pointer" },
  bonusBadgeCount: { background: "#ef4444", color: "#fff", borderRadius: "50%", width: "12px", height: "12px", fontSize: "8px", display: "flex", alignItems: "center", justifyContent: "center" },
  userProfileCircle: { display: "flex", alignItems: "center", gap: "4px", background: "rgba(255,255,255,0.08)", padding: "4px 8px", borderRadius: "20px", cursor: "pointer" },
  heroBannerGold: { background: "radial-gradient(circle at top right, #1f1704 0%, #080d1a 100%)", borderRadius: "14px", padding: "14px", border: "1px solid #d97706", display: "flex", justifyContent: "space-between" },
  heroLeftText: { flex: 1 },
  welcomeTitle: { margin: 0, fontSize: "18px", fontWeight: "900" },
  welcomeHeadline: { margin: "4px 0", fontSize: "11px", color: "#cbd5e1", lineHeight: "1.3" },
  shieldBadgeRow: { display: "flex", alignItems: "center", gap: "4px", marginTop: "6px" },
  heroRightGraphic: { display: "flex", flexDirection: "column", alignItems: "flex-end", justifyContent: "center" },
  growWealthText: { fontSize: "14px", fontWeight: "900", color: "#facc15", textAlign: "right", lineHeight: "1.1", fontFamily: "cursive" },
  growthGraphicImg: { width: "50px", marginTop: "4px" },
  statsQuadGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" },
  statGoldBox: { background: "#071120", borderRadius: "10px", padding: "10px", border: "1px solid rgba(250, 204, 21, 0.2)", display: "flex", flexDirection: "column", position: "relative" },
  statIconBadgeGreen: { background: "rgba(34, 197, 94, 0.2)", width: "22px", height: "22px", borderRadius: "6px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "11px" },
  statIconBadgeGold: { background: "rgba(245, 158, 11, 0.2)", width: "22px", height: "22px", borderRadius: "6px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "11px" },
  statIconBadgePurple: { background: "rgba(168, 85, 247, 0.2)", width: "22px", height: "22px", borderRadius: "6px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "11px" },
  statIconBadgeBlue: { background: "rgba(56, 189, 248, 0.2)", width: "22px", height: "22px", borderRadius: "6px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "11px" },
  statLabel: { fontSize: "9px", color: "#cbd5e1", marginTop: "4px" },
  statValue: { fontSize: "15px", fontWeight: "900", color: "#ffffff", marginTop: "2px" },
  statTrendUp: { position: "absolute", bottom: "6px", right: "6px", fontSize: "9px", color: "#22c55e", fontWeight: "bold" },
  dailyReturnHeroCard: { background: "linear-gradient(135deg, #0e1a05 0%, #071224 100%)", borderRadius: "14px", padding: "14px", border: "1px solid #22c55e", display: "flex", flexDirection: "column", gap: "10px" },
  dailyReturnLeft: { display: "flex", alignItems: "center", gap: "10px" },
  dailyReturnLabel: { fontSize: "11px", color: "#cbd5e1", fontWeight: "bold" },
  dailyReturnValue: { fontSize: "26px", color: "#facc15", fontWeight: "900", display: "block" },
  dailyReturnSub: { fontSize: "8px", color: "#94a3b8" },
  dailyReturnRight: { borderLeft: "2px solid rgba(255,255,255,0.1)", paddingLeft: "10px" },
  dailyCardActionRow: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" },
  goldAddFundBtn: { background: "linear-gradient(135deg, #f59e0b, #d97706)", border: "none", borderRadius: "10px", padding: "8px", color: "#000", display: "flex", alignItems: "center", gap: "6px", cursor: "pointer" },
  btnPlusCircle: { background: "#000", color: "#fff", borderRadius: "50%", width: "18px", height: "18px", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "bold", fontSize: "12px" },
  goldWithdrawBtn: { background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.2)", borderRadius: "10px", padding: "8px", color: "#fff", display: "flex", alignItems: "center", gap: "6px", cursor: "pointer" },
  newInvestmentSection: { background: "#060f1e", borderRadius: "14px", padding: "12px", border: "1px solid rgba(250, 204, 21, 0.2)" },
  sectionHeaderRow: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" },
  sectionTitle: { margin: 0, fontSize: "13px", fontWeight: "800", color: "#fff" },
  sectionSub: { margin: 0, fontSize: "8px", color: "#cbd5e1" },
  smallStepsBadge: { textAlign: "right" },
  planSelectionGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" },
  planCard: { background: "#030a16", borderRadius: "10px", padding: "10px", border: "1px solid rgba(255,255,255,0.1)", display: "flex", flexDirection: "column", gap: "8px" },
  planCardHeader: { display: "flex", alignItems: "center", gap: "6px" },
  sproutBadge: { background: "rgba(34, 197, 94, 0.2)", padding: "4px", borderRadius: "6px", fontSize: "14px" },
  crownBadge: { background: "rgba(245, 158, 11, 0.2)", padding: "4px", borderRadius: "6px", fontSize: "14px" },
  planTitle: { margin: 0, fontSize: "11px", fontWeight: "bold", color: "#fff" },
  planSub: { margin: 0, fontSize: "7px", color: "#cbd5e1" },
  planFeatureList: { listStyle: "none", padding: 0, margin: 0, fontSize: "9px", color: "#cbd5e1", display: "flex", flexDirection: "column", gap: "3px" },
  startBeginnerBtn: { background: "linear-gradient(135deg, #10b981, #059669)", border: "none", color: "#fff", borderRadius: "16px", padding: "6px", fontSize: "10px", fontWeight: "bold", cursor: "pointer" },
  startProBtn: { background: "linear-gradient(135deg, #f59e0b, #d97706)", border: "none", color: "#000", borderRadius: "16px", padding: "6px", fontSize: "10px", fontWeight: "bold", cursor: "pointer" },
  transactionSection: { background: "#060f1e", borderRadius: "14px", padding: "12px", border: "1px solid rgba(255,255,255,0.1)" },
  transHeaderRow: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" },
  transTitle: { margin: 0, fontSize: "12px", color: "#fff", fontWeight: "bold" },
  liveUpdatesPill: { background: "rgba(245, 158, 11, 0.2)", color: "#facc15", fontSize: "8px", padding: "2px 6px", borderRadius: "8px" },
  viewAllBtn: { color: "#facc15", fontSize: "9px", cursor: "pointer" },
  tableResponsive: { overflowX: "auto" },
  historyTable: { width: "100%", borderCollapse: "collapse", fontSize: "10px", textAlign: "left" },
  modalOverlay: { position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 99999 },
  modalCard: { background: "#071120", border: "1px solid #facc15", borderRadius: "14px", padding: "14px", width: "90%", maxWidth: "340px", color: "#fff" },
  modalHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" },
  closeBtn: { background: "transparent", border: "none", color: "#fff", fontSize: "14px", cursor: "pointer" },
  inputLabel: { fontSize: "10px", color: "#cbd5e1" },
  amountGrid: { display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "6px", marginTop: "4px" },
  amtChoiceBtn: { padding: "6px", borderRadius: "6px", color: "#fff", fontSize: "9px", fontWeight: "bold", cursor: "pointer", border: "none" },
  calculationPreview: { background: "#030a16", padding: "8px", borderRadius: "6px", margin: "10px 0", fontSize: "10px", display: "flex", flexDirection: "column", gap: "3px" },
  confirmInvestBtn: { width: "100%", padding: "8px", borderRadius: "6px", border: "none", background: "#22c55e", color: "#fff", fontWeight: "bold", cursor: "pointer", fontSize: "11px" },
  modalInput: { width: "100%", padding: "6px", borderRadius: "6px", border: "1px solid #334155", background: "#030a16", color: "#fff", fontSize: "11px", boxSizing: "border-box" },
  modalSubmitBtn: { width: "100%", padding: "8px", borderRadius: "6px", border: "none", background: "#f59e0b", color: "#000", fontWeight: "bold", cursor: "pointer", fontSize: "11px" }
};
