import React, { useEffect, useState, useRef, useMemo } from "react";
import { API } from "../config";
import { useNavigate, useLocation } from "react-router-dom";
import { toast } from "react-toastify";
import html2canvas from "html2canvas";

export default function Withdraw() {
  const navigate = useNavigate();
  const location = useLocation();

  const email = localStorage.getItem("email") || "";
  const token = localStorage.getItem("token") || "";

  const [amount, setAmount] = useState("");
  const [walletBalance, setWalletBalance] = useState(0);
  const [withdrawableBalance, setWithdrawableBalance] = useState(0);
  const [bank, setBank] = useState(null);
  const [history, setHistory] = useState([]); 
  
  const [filterType, setFilterType] = useState("All"); 
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  
  const [visibleCount, setVisibleCount] = useState(5);
  const [selectedTx, setSelectedTx] = useState(null);
  const receiptRef = useRef(null);
  const [loading, setLoading] = useState(false);

  // 👇 সাইডবার (Drawer) ও প্ল্যান ডাউনলোড স্টেট
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isDownloadingPlan, setIsDownloadingPlan] = useState(false);

  // 👇 স্বাইপ হ্যান্ডলার স্টেট
  const [touchStartX, setTouchStartX] = useState(0);
  const [touchStartY, setTouchStartY] = useState(0);

  const inputAmount = Number(amount) || 0;
  const tdsDeduction = inputAmount * 0.05;
  const finalBankCredit = inputAmount - tdsDeduction;

  useEffect(() => {
    loadInfo();
  }, []);

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

  const money = (n) =>
    `₹ ${Number(n || 0).toLocaleString("en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })}`;

  const loadInfo = async () => {
    try {
      const res = await fetch(`${API}/withdraw-info`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          authorization: token || ""
        },
        body: JSON.stringify({ email })
      });
      const data = await res.json();
      if (data.success) {
        setWalletBalance(data.todayBalance || 0);
        const historyList = data.history || [];
        setHistory(historyList);

        const today = new Date().toDateString();
        const hasActiveRequest = historyList.some((req) => {
          const reqDate = new Date(req.createdAt).toDateString();
          return reqDate === today && (req.status === "Pending" || req.status === "Success") && req.type !== "Credit";
        });

        if (hasActiveRequest) {
          setWithdrawableBalance(0);
        } else {
          setWithdrawableBalance((data.todayBalance || 0) * 0.8);
        }
        setBank(data.bank || null);
      }
    } catch (err) {
      console.log("ERROR:", err);
    }
  };

  const submitWithdraw = async () => {
    if (!bank || !bank.accountNumber) {
      toast.error("Please add your bank details first before withdrawing.");
      navigate("/bank-details");
      return;
    }

    if (Number(amount) < 100) {
      toast.info("Minimum withdrawal limit is ₹100");
      return;
    }
    if (Number(amount) > withdrawableBalance) {
      toast.info("Amount exceeds your withdrawable limit (80% of earnings)");
      return;
    }

    try {
      setLoading(true);
      const res = await fetch(`${API}/withdraw-request`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          authorization: token || ""
        },
        body: JSON.stringify({ email, amount })
      });
      const data = await res.json();
      
      if (data.success) {
        toast.success(data.msg || "Withdrawal request placed successfully");
        setAmount("");
        loadInfo();
      } else {
        toast.error(data.msg || "Failed to process withdrawal");
      }
    } catch (err) {
      toast.warning("Server error");
    } finally {
      setLoading(false);
    }
  };

  const handleBankClick = () => {
    navigate("/bank-details"); 
  };

  const handleShareToWhatsApp = async () => {
    if (!receiptRef.current) return;
    try {
      const canvas = await html2canvas(receiptRef.current, {
        useCORS: true,
        backgroundColor: "#ffffff",
        scale: 2 
      });
      
      canvas.toBlob(async (blob) => {
        if (!blob) return;
        const file = new File([blob], `Receipt_${selectedTx._id || "tx"}.png`, { type: "image/png" });

        if (navigator.canShare && navigator.canShare({ files: [file] })) {
          try {
            await navigator.share({
              files: [file],
              title: "Transaction Receipt",
              text: `Transaction Receipt of ${money(selectedTx.amount)} via SafeMoney Secure.`
            });
            return;
          } catch (e) {
            console.log("Web Share failed");
          }
        }

        const imageURL = canvas.toDataURL("image/png");
        const link = document.createElement("a");
        link.href = imageURL;
        link.download = `Receipt_${selectedTx._id || "tx"}.png`;
        link.click();
      }, "image/png");
    } catch (error) {
      console.error(error);
      toast.error("Failed to generate receipt share");
    }
  };

  const getStatusDetails = (status, type) => {
    if (type === "Credit") {
      return { text: "CREDITED", color: "#059669", bgColor: "#ecfdf5" };
    }
    if (status === "Rejected" || status === "Reject") {
      return { text: "REFUNDED", color: "#dc2626", bgColor: "#fef2f2" };
    }
    if (status === "Success" || status === "Approved") {
      return { text: "COMPLETED", color: "#059669", bgColor: "#ecfdf5" };
    }
    return { text: "PENDING", color: "#d97706", bgColor: "#fffbeb" };
  };

  const filteredHistory = history.filter((item) => {
    const isCredit = item.type === "Credit";
    if (filterType === "Credit" && !isCredit) return false;
    if (filterType === "Debit" && isCredit) return false;

    if (startDate || endDate) {
      const txDate = new Date(item.createdAt);
      txDate.setHours(0, 0, 0, 0);

      if (startDate) {
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        if (txDate < start) return false;
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        if (txDate > end) return false;
      }
    }
    return true;
  });

  const visibleHistory = filteredHistory.slice(0, visibleCount);

  return (
    <div 
      style={styles.page}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* 👇 SIDEBAR DRAWER */}
      <div style={{
        ...styles.drawerOverlay,
        opacity: isDrawerOpen ? 1 : 0,
        visibility: isDrawerOpen ? "visible" : "hidden"
      }} onClick={() => setIsDrawerOpen(false)}>
        <div style={{
          ...styles.drawerContainer,
          transform: isDrawerOpen ? "translateX(0)" : "translateX(-100%)"
        }} onClick={(e) => e.stopPropagation()}>
          
          {/* LOGO & BRANDING */}
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

          {/* SIDEBAR CONTENT */}
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

            {/* FULL VISIBLE TREE PLANT SECTION */}
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

      {/* TOP HEADER WITH DRAWER TOGGLE BUTTON */}
      <div style={styles.topNav}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <button style={styles.menuButton} onClick={() => setIsDrawerOpen(true)}>
            ☰
          </button>
          <button style={styles.backBtn} onClick={() => navigate(-1)}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
          </button>
        </div>

        <div style={styles.topCenterTitle}>
          <div style={styles.titleFlex}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>
            <h1 style={styles.mainHeading}>Withdraw Funds</h1>
          </div>
          <p style={styles.subHeading}>Transfer your earnings safely</p>
        </div>

        <div style={styles.secureBadge}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="3"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>
          <span style={{ fontSize: "12px", fontWeight: "700" }}>Secure</span>
        </div>
      </div>

      <section style={styles.balanceGrid}>
        <div style={{ ...styles.balanceCard, background: "linear-gradient(135deg, #1e293b 0%, #0f172a 100%)", borderColor: "#334155" }}>
          <div style={styles.cardHeaderFlex}>
            <div style={{ ...styles.walletIconBox, background: "linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)" }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2.5"><rect x="2" y="4" width="20" height="16" rx="2"></rect><path d="M12 11h10v2H12z"></path></svg>
            </div>
            <div style={styles.cardMeta}>
              <span style={styles.cardTag}>Today Wallet</span>
              <div style={styles.amountEyeRow}>
                <h2 style={styles.cardAmount}>{money(walletBalance)}</h2>
              </div>
            </div>
          </div>
          <p style={styles.cardDesc}>Available in wallet today</p>
        </div>

        <div style={{ ...styles.balanceCard, background: "linear-gradient(135deg, #1e293b 0%, #0f172a 100%)", borderColor: "#334155" }}>
          <div style={styles.cardHeaderFlex}>
            <div style={{ ...styles.walletIconBox, background: "linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%)" }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2.5"><rect x="2" y="4" width="20" height="16" rx="2"></rect><path d="M12 11h10v2H12z"></path></svg>
            </div>
            <div style={styles.cardMeta}>
              <span style={styles.cardTag}>Withdrawable Wallet</span>
              <div style={styles.amountEyeRow}>
                <h2 style={styles.cardAmount}>{money(withdrawableBalance)}</h2>
              </div>
            </div>
          </div>
          <p style={styles.cardDesc}>80% limit configuration applied</p>
          <div style={styles.percentageBadge}>80%</div>
        </div>
      </section>

      <section style={styles.glassContainer}>
        <h3 style={styles.sectionTitle}>Amount to Payout</h3>
        <div style={styles.inputWrapper}>
          <span style={styles.currencyPrefix}>₹</span>
          <input
            style={styles.input}
            type="number"
            placeholder="0.00"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
        </div>
        
        {inputAmount > 0 && (
          <div style={styles.calculationBox}>
            <div style={styles.calcRow}>
              <span style={styles.calcLabel}>Gross Amount</span>
              <span style={styles.calcValue}>{money(inputAmount)}</span>
            </div>
            <div style={styles.calcRow}>
              <span style={{ ...styles.calcLabel, color: "#f87171" }}>TDS Deduction (5%)</span>
              <span style={{ ...styles.calcValue, color: "#f87171" }}>- {money(tdsDeduction)}</span>
            </div>
            <div style={{ ...styles.calcRow, ...styles.calcTotalRow }}>
              <span style={{ ...styles.calcLabel, color: "#34d399", fontWeight: "700" }}>Net Bank Credit</span>
              <span style={{ ...styles.calcValue, color: "#34d399", fontWeight: "800" }}>{money(finalBankCredit)}</span>
            </div>
          </div>
        )}

        <p style={styles.minNotice}>Minimum withdrawal limit is ₹100</p>
        <button style={styles.submitBtn} onClick={submitWithdraw} disabled={loading}>
          {loading ? "Processing..." : (
            <span style={styles.btnContent}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" style={{ transform: "rotate(-45deg)" }}><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"></path></svg>
              Confirm & Withdraw
            </span>
          )}
        </button>
      </section>

      <section style={styles.glassContainer}>
        <div style={styles.sectionHeaderTitle}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#60a5fa" strokeWidth="2"><path d="M3 22v-4h18v4H3zM12 2L2 7h20L12 2zM4 9v7h3V9H4zm5 0v7h3V9H9zm5 0v7h3V9h-3zm5 0v7h3V9h-3z"/></svg>
          <h3 style={{ ...styles.sectionTitle, margin: 0 }}>Settlement Account</h3>
        </div>

        <div style={styles.bankGrid} onClick={handleBankClick}>
          {bank && bank.accountNumber ? (
            <>
              <div style={styles.bankFieldsGroup}>
                <div style={styles.bankMeta}>
                  <span style={styles.metaLabel}>HOLDER NAME</span>
                  <span style={styles.metaValue}>{bank.accountHolderName}</span>
                </div>
                <div style={styles.bankMeta}>
                  <span style={styles.metaLabel}>BANK NAME</span>
                  <span style={styles.metaValue}>{bank.bankName}</span>
                </div>
                <div style={styles.bankMeta}>
                  <span style={styles.metaLabel}>ACCOUNT NUMBER</span>
                  <span style={styles.metaValue}>{bank.accountNumber}</span>
                </div>
                <div style={styles.bankMeta}>
                  <span style={styles.metaLabel}>IFSC CODE</span>
                  <span style={styles.metaValue}>{bank.ifscCode}</span>
                </div>
              </div>
              <div style={styles.bankArrowContainer}>
                <button style={styles.bankActionCircle}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2.5"><polyline points="9 18 15 12 9 6"></polyline></svg>
                </button>
              </div>
            </>
          ) : (
            <div style={styles.noBankContainer}>
              <div style={styles.noBankContent}>
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
                <div>
                  <h4 style={styles.noBankTitle}>No Bank Account Added</h4>
                  <p style={styles.noBankDesc}>Click to add your bank details for withdrawals.</p>
                </div>
              </div>
              <button style={styles.addBankBtn}>Add Bank →</button>
            </div>
          )}
        </div>
      </section>

      <section style={styles.superGlassContainer}>
        <div style={styles.historySectionHeader}>
          <div style={styles.sectionHeaderTitle}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#60a5fa" strokeWidth="2.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline></svg>
            <h3 style={styles.superSectionTitle}>Audit Statement</h3>
          </div>
        </div>

        <div style={styles.filterWrapper}>
          <div style={styles.typeFilterGroup}>
            {["All", "Credit", "Debit"].map((type) => (
              <button
                key={type}
                onClick={() => setFilterType(type)}
                style={{
                  ...styles.filterTabBtn,
                  backgroundColor: filterType === type ? "#2563eb" : "#0f172a",
                  color: "#ffffff",
                  borderColor: filterType === type ? "#3b82f6" : "#334155"
                }}
              >
                {type}
              </button>
            ))}
          </div>
          
          <div style={styles.dateFilterGroup}>
            <div style={styles.dateInputBox}>
              <label style={styles.dateLabel}>From:</label>
              <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} style={styles.dateInput} />
            </div>
            <div style={styles.dateInputBox}>
              <label style={styles.dateLabel}>To:</label>
              <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} style={styles.dateInput} />
            </div>
          </div>
        </div>

        {filteredHistory.length === 0 ? (
          <div style={styles.superEmptyStateContainer}>
            <p style={styles.superEmptyMainText}>No matching statement records found.</p>
          </div>
        ) : (
          <div style={styles.historyListContainer}>
            {visibleHistory.map((x) => {
              const isCredit = x.type === "Credit";
              const statusInfo = getStatusDetails(x.status, x.type);
              const holderName = bank?.accountHolderName || "Account Holder";
              const firstLetter = holderName.charAt(0).toUpperCase();
              const isRejected = x.status === "Rejected" || x.status === "Reject";

              const displayTitle = isCredit 
                ? (x.bonusType || x.note || "Bonus Credited") 
                : holderName;

              return (
                <div key={x._id || x.createdAt} style={styles.historyRowItem} onClick={() => setSelectedTx(x)}>
                  <div style={styles.historyLeftSection}>
                    <div style={{
                      ...styles.avatarCircle, 
                      backgroundColor: isCredit ? "#d1fae5" : (isRejected ? "#fee2e2" : "#e0e7ff"),
                      color: isCredit ? "#065f46" : (isRejected ? "#b91c1c" : "#3730a3")
                    }}>
                      {firstLetter}
                    </div>
                    <div>
                      <div style={styles.historyHolderName}>{displayTitle}</div>
                      <div style={styles.historyDateText}>
                        {new Date(x.createdAt).toLocaleDateString("en-IN", { day: 'numeric', month: 'short' })}, {new Date(x.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                      </div>
                      <span style={{...styles.tagBadge, backgroundColor: statusInfo.bgColor, color: statusInfo.color}}>
                        {isCredit ? `💰 ${x.bonusType || "Credited"}` : (statusInfo.text === "COMPLETED" ? "💸 Withdrawal Sent" : statusInfo.text === "REFUNDED" ? "🔄 Refunded" : "⏳ Pending")}
                      </span>
                    </div>
                  </div>
                  
                  <div style={styles.historyRightSection}>
                    <div style={{
                      ...styles.historyAmtText, 
                      color: isCredit ? "#10b981" : (statusInfo.text === "REFUNDED" ? "#ef4444" : "#f87171")
                    }}>
                      {isCredit ? "+" : "-"} {money(x.amount)}
                    </div>
                    <div style={styles.fromBankText}>{isCredit ? "In 💳" : (isRejected ? "Returned 🔄" : "Out 🏦")}</div>
                  </div>
                </div>
              );
            })}
            
            {filteredHistory.length > visibleCount && (
              <button style={styles.viewMoreBtn} onClick={() => setVisibleCount(prev => prev + 5)}>
                View More ↓
              </button>
            )}
          </div>
        )}
      </section>

      {selectedTx && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalContentWrapper}>
            <div ref={receiptRef} style={styles.premiumReceiptCard}>
              <div style={styles.receiptHeader}>
                <div style={styles.logoPlaceholder}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="3"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>
                </div>
                <div>
                  <h3 style={styles.receiptBrand}>SafeMoney Secure</h3>
                  <span style={styles.receiptSubtitle}>Official Transaction Receipt</span>
                </div>
              </div>
              
              <div style={styles.statusSection}>
                <div style={styles.statusIcon}>✓</div>
                <h4 style={styles.statusText}>Transaction Successful</h4>
                <h2 style={styles.amountDisplay}>{selectedTx.type === "Credit" ? "+" : "-"} {money(selectedTx.amount)}</h2>
              </div>

              <div style={styles.detailsDivider}>
                <div style={styles.circleLeft}></div>
                <div style={styles.line}></div>
                <div style={styles.circleRight}></div>
              </div>

              <div style={styles.detailsGrid}>
                <div style={styles.row}><span>Transaction ID</span><span style={styles.val}>{selectedTx._id?.slice(-8).toUpperCase()}</span></div>
                <div style={styles.row}><span>Date</span><span style={styles.val}>{new Date(selectedTx.createdAt).toLocaleString()}</span></div>
                <div style={styles.row}><span>Type</span><span style={styles.val}>{selectedTx.type}</span></div>
                
                <div style={styles.row}>
                  <span>Description</span>
                  <span style={{ ...styles.val, textAlign: "right", maxWidth: "160px" }}>
                    {selectedTx.type === "Credit" ? (selectedTx.bonusType || selectedTx.note || "Bonus Credited") : "Bank Withdrawal Payout"}
                  </span>
                </div>

                <div style={styles.row}><span>Status</span><span style={{color: "#059669", fontWeight: "bold"}}>{selectedTx.status || "Completed"}</span></div>
              </div>

              <div style={styles.footerBranding}>
                <p>Transaction processed securely by SafeMoney</p>
              </div>
            </div>

            <button style={styles.shareBtn} onClick={handleShareToWhatsApp}>📸 Save / Share Receipt</button>
            <button style={styles.closeBtn} onClick={() => setSelectedTx(null)}>Close Window</button>
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
    maxWidth: "100vw",
    background: "linear-gradient(180deg, #090d16 0%, #0f172a 50%, #0b1325 100%)", 
    color: "#f8fafc", 
    padding: "16px 12px 48px 12px", 
    boxSizing: "border-box", 
    display: "flex", 
    flexDirection: "column", 
    gap: "18px", 
    overflowX: "hidden" 
  },
  menuButton: {
    background: "transparent",
    border: "none",
    color: "white",
    fontSize: "24px",
    cursor: "pointer",
    padding: "2px 6px"
  },
  topNav: { display: "flex", alignItems: "center", justifyContent: "space-between", gap: "6px", width: "100%" },
  backBtn: { width: "38px", height: "38px", borderRadius: "10px", border: "1px solid #334155", background: "#1e293b", color: "#ffffff", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" },
  topCenterTitle: { textAlign: "center", flex: 1 },
  titleFlex: { display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" },
  mainHeading: { fontSize: "18px", fontWeight: "800", margin: 0 }, 
  subHeading: { margin: "2px 0 0 0", fontSize: "11px", color: "#94a3b8" }, 
  secureBadge: { display: "flex", alignItems: "center", gap: "4px", background: "rgba(16, 185, 129, 0.12)", border: "1px solid #10b981", padding: "6px 8px", borderRadius: "8px", color: "#34d399" },
  
  balanceGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: "10px", width: "100%" },
  balanceCard: { position: "relative", padding: "14px 12px", borderRadius: "14px", border: "1px solid", display: "flex", flexDirection: "column", minHeight: "110px", boxSizing: "border-box" },
  cardHeaderFlex: { display: "flex", alignItems: "center", gap: "8px" },
  walletIconBox: { width: "36px", height: "36px", borderRadius: "10px", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 },
  cardMeta: { display: "flex", flexDirection: "column", gap: "2px", overflow: "hidden" },
  amountEyeRow: { display: "flex", alignItems: "center", gap: "4px", marginTop: "2px" },
  cardTag: { fontSize: "12px", fontWeight: "700", color: "#94a3b8" }, 
  cardAmount: { fontSize: "18px", fontWeight: "800", margin: 0, whiteSpace: "nowrap" }, 
  cardDesc: { margin: "10px 0 0 0", fontSize: "11px", color: "#94a3b8", fontWeight: "500" },
  percentageBadge: { position: "absolute", top: "10px", right: "10px", width: "28px", height: "28px", borderRadius: "50%", background: "rgba(14, 165, 233, 0.15)", border: "1px solid #0ea5e9", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "10px", fontWeight: "800", color: "#38bdf8" },
  
  glassContainer: { width: "100%", padding: "16px 14px", borderRadius: "16px", background: "#111c30", border: "1px solid #1e293b", boxSizing: "border-box" },
  sectionTitle: { margin: "0 0 12px 0", fontSize: "15px", fontWeight: "800" }, 
  inputWrapper: { display: "flex", alignItems: "center", background: "#0b1325", border: "1.5px solid #334155", borderRadius: "12px", padding: "0 14px" },
  currencyPrefix: { fontSize: "20px", fontWeight: "800", marginRight: "8px", color: "#3b82f6" },
  input: { width: "100%", height: "48px", border: "none", background: "transparent", color: "#ffffff", fontSize: "20px", fontWeight: "800", outline: "none" },
  calculationBox: { marginTop: "12px", padding: "10px 0", display: "flex", flexDirection: "column", gap: "8px", borderBottom: "1.5px dashed #1e293b" },
  calcRow: { display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%" },
  calcTotalRow: { marginTop: "6px", paddingTop: "10px", borderTop: "1px solid #1e293b" },
  calcLabel: { fontSize: "13px", fontWeight: "600", color: "#94a3b8" }, 
  calcValue: { fontSize: "14px", fontWeight: "700" },
  minNotice: { fontSize: "12px", color: "#94a3b8", margin: "10px 0 14px 2px", fontWeight: "500" },
  submitBtn: { width: "100%", height: "46px", border: "none", borderRadius: "12px", background: "linear-gradient(90deg, #3b82f6 0%, #1d4ed8 100%)", color: "#ffffff", fontWeight: "800", fontSize: "15px", cursor: "pointer" },
  btnContent: { display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" },
  sectionHeaderTitle: { display: "flex", alignItems: "center", gap: "8px" },
  
  bankGrid: { display: "flex", justifyContent: "space-between", alignItems: "center", background: "#0b1325", padding: "14px", borderRadius: "14px", border: "1px solid #1e293b", cursor: "pointer" },
  bankFieldsGroup: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", flex: 1 },
  bankMeta: { display: "flex", flexDirection: "column", gap: "2px" },
  metaLabel: { fontSize: "10px", fontWeight: "700", color: "#64748b" }, 
  metaValue: { fontSize: "13px", fontWeight: "800", wordBreak: "break-word" }, 
  bankArrowContainer: { paddingLeft: "8px" },
  bankActionCircle: { width: "32px", height: "32px", borderRadius: "50%", border: "none", background: "#1e293b", display: "flex", alignItems: "center", justifyContent: "center" },
  noBankContainer: { width: "100%", display: "flex", justifyContent: "space-between", alignItems: "center", gap: "10px", flexWrap: "wrap" },
  noBankContent: { display: "flex", alignItems: "center", gap: "10px", flex: 1 },
  noBankTitle: { fontSize: "14px", fontWeight: "800", color: "#f59e0b", margin: "0 0 2px 0" },
  noBankDesc: { fontSize: "11px", color: "#94a3b8", margin: 0 },
  addBankBtn: { background: "linear-gradient(90deg, #f59e0b 0%, #d97706 100%)", color: "#000000", border: "none", padding: "8px 12px", borderRadius: "8px", fontSize: "12px", fontWeight: "800", cursor: "pointer" },
  
  historySectionHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px", width: "100%" },
  superGlassContainer: { width: "100%", padding: "16px 14px", borderRadius: "16px", background: "#111c30", border: "1px solid #1e293b", boxSizing: "border-box" },
  superSectionTitle: { margin: 0, fontSize: "16px", fontWeight: "800" },
  superEmptyStateContainer: { textAlign: "center", padding: "30px 12px" },
  superEmptyMainText: { fontSize: "14px", color: "#94a3b8", fontWeight: "600" },
  filterWrapper: { display: "flex", flexDirection: "column", gap: "10px", marginBottom: "14px", background: "#0b1325", padding: "10px", borderRadius: "12px", border: "1px solid #1e293b" },
  typeFilterGroup: { display: "flex", gap: "6px" },
  filterTabBtn: { flex: 1, padding: "8px", border: "1px solid", borderRadius: "6px", cursor: "pointer", fontSize: "12px", fontWeight: "700" },
  dateFilterGroup: { display: "flex", gap: "8px", flexWrap: "wrap" },
  dateInputBox: { flex: 1, minWidth: "100px", display: "flex", flexDirection: "column", gap: "2px" },
  dateLabel: { fontSize: "10px", fontWeight: "700", color: "#94a3b8" },
  dateInput: { background: "#111c30", border: "1px solid #1e293b", color: "#ffffff", padding: "6px", borderRadius: "6px", fontSize: "11px", outline: "none", width: "100%", boxSizing: "border-box" },
  historyListContainer: { display: "flex", flexDirection: "column", gap: "2px" },
  historyRowItem: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 6px", borderBottom: "1px solid #1e293b", cursor: "pointer" },
  historyLeftSection: { display: "flex", alignItems: "center", gap: "10px" },
  avatarCircle: { width: "36px", height: "36px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "15px", fontWeight: "800", flexShrink: 0 },
  historyHolderName: { fontSize: "13px", fontWeight: "700", color: "#ffffff" },
  historyDateText: { fontSize: "11px", color: "#94a3b8", marginTop: "1px" },
  tagBadge: { display: "inline-block", padding: "2px 6px", borderRadius: "4px", fontSize: "10px", fontWeight: "700", marginTop: "4px" },
  historyRightSection: { textAlign: "right" },
  historyAmtText: { fontSize: "14px", fontWeight: "800" },
  fromBankText: { fontSize: "10px", color: "#64748b", marginTop: "1px" },
  viewMoreBtn: { width: "100%", background: "#1e293b", color: "#ffffff", border: "none", padding: "10px", borderRadius: "8px", cursor: "pointer", fontSize: "13px", fontWeight: "700", marginTop: "10px", textAlign: "center" },
  
  modalOverlay: { position: "fixed", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.75)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: "12px", overflowY: "auto" },
  modalContentWrapper: { width: "100%", maxWidth: "360px", display: "flex", flexDirection: "column", gap: "10px" },
  premiumReceiptCard: { backgroundColor: "#ffffff", color: "#1e293b", padding: "20px", borderRadius: "16px", boxShadow: "0 10px 25px rgba(0,0,0,0.2)" },
  receiptHeader: { display: "flex", alignItems: "center", gap: "10px", marginBottom: "14px" },
  logoPlaceholder: { width: "30px", height: "30px", background: "linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)", borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center" },
  receiptBrand: { fontSize: "15px", fontWeight: "800", margin: 0, color: "#0f172a" },
  receiptSubtitle: { fontSize: "11px", color: "#64748b", fontWeight: "600" },
  statusSection: { textAlign: "center", marginBottom: "14px" },
  statusIcon: { width: "40px", height: "40px", background: "#dcfce7", color: "#16a34a", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 8px", fontSize: "20px" },
  statusText: { fontSize: "12px", color: "#64748b", fontWeight: "600", margin: 0 },
  amountDisplay: { fontSize: "24px", fontWeight: "800", margin: "6px 0", color: "#0f172a" },
  detailsDivider: { display: "flex", alignItems: "center", margin: "14px 0" },
  circleLeft: { width: "16px", height: "16px", borderRadius: "50%", background: "#0f172a", marginLeft: "-28px" },
  line: { flex: 1, borderTop: "2px dashed #cbd5e1" },
  circleRight: { width: "16px", height: "16px", borderRadius: "50%", background: "#0f172a", marginRight: "-28px" },
  detailsGrid: { display: "flex", flexDirection: "column", gap: "10px" },
  row: { display: "flex", justifyContent: "space-between", fontSize: "12px", color: "#64748b", alignItems: "flex-start" },
  val: { fontWeight: "bold", color: "#0f172a" },
  footerBranding: { textAlign: "center", marginTop: "20px", fontSize: "10px", color: "#94a3b8" },
  shareBtn: { padding: "12px", background: "#3b82f6", color: "#fff", border: "none", borderRadius: "10px", cursor: "pointer", fontWeight: "bold", fontSize: "14px" },
  closeBtn: { padding: "12px", background: "#e2e8f0", color: "#475569", border: "none", borderRadius: "10px", cursor: "pointer", fontWeight: "bold", fontSize: "14px" },

  // 👇 DRAWER (SIDEBAR) STYLES (EXACTLY COPIED FROM HOME)
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
