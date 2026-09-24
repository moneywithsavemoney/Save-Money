import React, { useEffect, useState, useRef, useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import html2canvas from "html2canvas"; 
import { API } from "../config";

export default function Refer() {
  const navigate = useNavigate();
  const location = useLocation();

  const email = localStorage.getItem("email") || "";
  const token = localStorage.getItem("token") || "";

  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState({});
  const [history, setHistory] = useState([]);
  const [bonusHistory, setBonusHistory] = useState([]);
  const [performance, setPerformance] = useState({});
  const [team, setTeam] = useState({});
  const [royalty, setRoyalty] = useState({});
  const [treeData, setTreeData] = useState({});
  const [bonusModal, setBonusModal] = useState(null);
  const [statusFilter, setStatusFilter] = useState("All");
  const [referBonus, setReferBonus] = useState({});
  const [performanceFilter, setPerformanceFilter] = useState("thisMonth");
  
  // ড্রয়ার (সাইডবার) ও ডাউনলোড স্টেট
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isDownloadingPlan, setIsDownloadingPlan] = useState(false);

  // ট্রানসাকশান ডিটেইলস পপআপের জন্য স্টেট
  const [selectedTx, setSelectedTx] = useState(null);

  // মোডাল ক্যাপচার করার জন্য রেফ
  const shareAreaRef = useRef(null);

  // কাস্টম ডেট রেঞ্জ ফিল্টার স্টেট
  const [teamTimeFilter, setTeamTimeFilter] = useState("allTime"); 
  const [teamStartDate, setTeamStartDate] = useState("");
  const [teamEndDate, setTeamEndDate] = useState("");

  const [bonusFilter, setBonusFilter] = useState("All");
  const [showAllBonusHistory, setShowAllBonusHistory] = useState(false);
  
  const [selectedMonth, setSelectedMonth] = useState("");

  const [showPendingModal, setShowPendingModal] = useState(false);
  const [showTodayJoinModal, setShowTodayJoinModal] = useState(false);

  // প্রিমিয়াম ইনফো/স্ট্যাটাস মেসেজ ওভারলে স্টেট
  const [statusOverlay, setStatusOverlay] = useState({
    show: false,
    type: "info",
    message: ""
  });

  const go = (path) => {
    navigate(path);
  };

  // PLAN PDF ডাউনলোডের জন্য হ্যান্ডলার (Home.js সেম)
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

  const fileUrl = (path) => {
    if (!path) return "";
    if (path.startsWith("http://") || path.startsWith("https://")) return path;
    return `${API}/uploads/${path}`;
  };

  const profilePhoto = useMemo(() => {
    return fileUrl(
      user?.photo ||
      user?.profilePhoto ||
      user?.selfiePhoto ||
      ""
    );
  }, [user]);

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

  const getDynamicUserPhoto = (item) => {
    const rawPath = item?.fromPhoto || item?.photo || item?.profilePhoto || item?.selfiePhoto || "";
    return fileUrl(rawPath);
  };

  const triggerStatusOverlay = (type, message) => {
    setStatusOverlay({ show: true, type, message });
    setTimeout(() => {
      setStatusOverlay({ show: false, type: "info", message: "" });
    }, 2200);
  };

  const numberToWords = (num) => {
    if (!num) return "Zero Only";
    const a = ['', 'One ', 'Two ', 'Three ', 'Four ', 'Five ', 'Six ', 'Seven ', 'Eight ', 'Nine ', 'Ten ', 'Eleven ', 'Twelve ', 'Thirteen ', 'Fourteen ', 'Fifteen ', 'Sixteen ', 'Seventeen ', 'Eighteen ', 'Nineteen '];
    const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

    const numToWord = (n) => {
      if ((n = n.toString()).length > 9) return 'Overflow';
      let nArray = ('000000000' + n).substr(-9).match(/^(\d{2})(\d{2})(\d{2})(\d{1})(\d{2})$/);
      if (!nArray) return '';
      let str = '';
      str += (nArray[1] != 0) ? (a[Number(nArray[1])] || b[nArray[1][0]] + ' ' + a[nArray[1][1]]) + 'Crore ' : '';
      str += (nArray[2] != 0) ? (a[Number(nArray[2])] || b[nArray[2][0]] + ' ' + a[nArray[2][1]]) + 'Lakh ' : '';
      str += (nArray[3] != 0) ? (a[Number(nArray[3])] || b[nArray[3][0]] + ' ' + a[nArray[3][1]]) + 'Thousand ' : '';
      str += (nArray[4] != 0) ? (a[Number(nArray[4])] || b[nArray[4][0]] + ' ' + a[nArray[4][1]]) + 'Hundred ' : '';
      str += (nArray[5] != 0) ? ((str != '') ? 'and ' : '') + (a[Number(nArray[5])] || b[nArray[5][0]] + ' ' + a[nArray[5][1]]) : '';
      return str.trim();
    };

    const words = numToWord(Math.floor(num));
    return words ? `Rupees ${words} Only` : "Rupees Zero Only";
  };

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "smooth" });
  }, [bonusModal]);

  useEffect(() => {
    loadReferData();
  }, []);

  const loadReferData = async (month = "", year = new Date().getFullYear()) => {
    try {
      setLoading(true);
      const res = await fetch(`${API}/refer-data`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          authorization: token || ""
        },
        body: JSON.stringify({ email, month, year })
      });

      const data = await res.json();

      if (data.success) {
        setUser(data.user || {});
        setHistory(Array.isArray(data.history) ? data.history : []);
        setBonusHistory(Array.isArray(data.bonusHistory) ? data.bonusHistory : []);
        setPerformance(data.performance || {});
        setTeam(data.team || {}); 
        setRoyalty(data.royalty || {});
        setTreeData(data.treeData || {});
        setReferBonus(data.referBonus || {});
      }
    } catch (err) {
      console.log("REFER DATA ERROR:", err);
    } finally {
      setLoading(false);
    }
  };

  const getFilteredTeamHistory = () => {
    const teamHistoryList = team.history || [];
    const now = new Date();

    return teamHistoryList.filter((item) => {
      if (!item.date) return false;
      const d = new Date(item.date);
      d.setHours(0, 0, 0, 0);

      if (teamTimeFilter === "thisMonth") {
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
      }
      if (teamTimeFilter === "lastMonth") {
        const last = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        return d.getMonth() === last.getMonth() && d.getFullYear() === last.getFullYear();
      }
      if (teamTimeFilter === "customRange") {
        const start = teamStartDate ? new Date(teamStartDate) : null;
        const end = teamEndDate ? new Date(teamEndDate) : null;
        if (start) start.setHours(0, 0, 0, 0);
        if (end) end.setHours(23, 59, 59, 999);

        if (start && end) return d >= start && d <= end;
        if (start) return d >= start;
        if (end) return d <= end;
      }
      return true;
    });
  };

  const getDynamicLevelCounts = () => {
    const counts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    const filteredHistory = getFilteredTeamHistory();
    
    filteredHistory.forEach(item => {
      const lvl = Number(item.level);
      if (lvl >= 1 && lvl <= 5) {
        counts[lvl] += 1;
      }
    });

    if (teamTimeFilter === "allTime") {
      if (counts[1] === 0) {
        counts[1] = Array.isArray(history) ? history.length : (team.totalJoinCount?.[1] || 0);
      }
      for (let i = 2; i <= 5; i++) {
        if (counts[i] === 0) {
          counts[i] = team.totalJoinCount?.[i] || team.levelCount?.[i] || 0;
        }
      }
    }
    return counts;
  };

  const getDynamicLevelIncomes = () => {
    const incomes = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    const filteredHistory = getFilteredTeamHistory();

    filteredHistory.forEach(item => {
      const lvl = Number(item.level);
      if (lvl >= 1 && lvl <= 5) {
        incomes[lvl] += Number(item.amount || 0);
      }
    });

    if (teamTimeFilter === "allTime") {
      if (incomes[1] === 0) incomes[1] = team.level1Income || 0;
      if (incomes[2] === 0) incomes[2] = team.level2Income || 0;
      if (incomes[3] === 0) incomes[3] = team.level3Income || 0;
      if (incomes[4] === 0) incomes[4] = team.level4Income || 0;
      if (incomes[5] === 0) incomes[5] = team.level5Income || 0;
    }
    return incomes;
  };

  const filteredPerformanceHistory = (performance.history || []).filter((item) => {
    const d = new Date(item.date);
    const now = new Date();
    if (performanceFilter === "thisMonth") {
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    }
    if (performanceFilter === "lastMonth") {
      const last = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      return d.getMonth() === last.getMonth() && d.getFullYear() === last.getFullYear();
    }
    return true;
  });

  const money = (n) =>
    `₹${Number(n || 0).toLocaleString("en-IN", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    })}`;

  const referCode = user.referCode || user.referralCode || user.walletId || "SMREF0001";
  
  const perfAmt = Number(performance.balance || user.performanceIncome || 0);
  const teamAmt = Number(team.balance || user.teamIncome || 0);
  const royAmt = Number(royalty.balance || user.royaltyIncome || 0);
  const refAmt = Number(referBonus.totalBonus || user.referIncome || 0);

  const totalAllTimeBalance = perfAmt + teamAmt + royAmt + refAmt;
  const referLink = `${window.location.origin}/register?ref=${referCode}`;

  const copyText = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      triggerStatusOverlay("success", "Copied Successfully! 🎉");
    } catch {
      triggerStatusOverlay("error", "Copy failed!");
    }
  };

  // 🟢 আপডেট করা হোয়াটসঅ্যাপ শেয়ার হ্যান্ডলার (অ্যাপ সাপোর্ট সহ)
  const shareWhatsapp = () => {
    const text = `Join SAVE MONEY using my refer link: ${referLink}`;
    const encodedText = encodeURIComponent(text);
    
    // অ্যাপ ও ওয়েব উভয় ক্ষেত্রেই ডাইরেক্ট হোয়াটসঅ্যাপ খোলার জন্য
    const whatsappUrl = `whatsapp://send?text=${encodedText}`;
    const webUrl = `https://api.whatsapp.com/send?text=${encodedText}`;

    try {
      window.location.href = whatsappUrl;
      setTimeout(() => {
        window.open(webUrl, "_blank");
      }, 500);
    } catch (e) {
      window.open(webUrl, "_blank");
    }
  };

  const shareTelegram = () => {
    const text = `Join SAVE MONEY using my refer link: ${referLink}`;
    window.open(
      `https://t.me/share/url?url=${encodeURIComponent(referLink)}&text=${encodeURIComponent(
        "Join SAVE MONEY"
      )}`,
      "_blank"
    );
  };

  const handleShareTx = async (tx) => {
    if (!shareAreaRef.current) return;
    try {
      triggerStatusOverlay("info", "Generating receipt image... 📸");

      const canvas = await html2canvas(shareAreaRef.current, {
        useCORS: true, 
        backgroundColor: "#ffffff",
        scale: 2 
      });

      canvas.toBlob(async (blob) => {
        if (!blob) {
          triggerStatusOverlay("error", "Failed to generate image");
          return;
        }

        const file = new File([blob], `SaveMoney_Receipt_${tx._id || "tx"}.png`, { type: "image/png" });
        const shareText = `💰 Save Money Transaction details:\n\nAmount: ₹${tx.amount}\nFrom: ${tx.fromName || "User"}\nType: ${tx.bonusType}\nStatus: Paid/Success ✅`;

        if (navigator.canShare && navigator.canShare({ files: [file] })) {
          await navigator.share({
            files: [file],
            title: "Transaction Receipt",
            text: shareText
          });
        } else {
          const link = document.createElement("a");
          link.href = URL.createObjectURL(blob);
          link.download = `SaveMoney_Receipt_${tx._id || "tx"}.png`;
          link.click();
          
          copyText(shareText);
          alert("Receipt Image downloaded & text details copied!");
        }
      }, "image/png");

    } catch (error) {
      console.error("Share error:", error);
      triggerStatusOverlay("error", "Sharing failed!");
    }
  };

  const safeBonusHistory = Array.isArray(bonusHistory) ? bonusHistory : [];

  const filteredBonusHistory =
    bonusFilter === "All"
      ? safeBonusHistory
      : safeBonusHistory.filter((x) => x.bonusType === bonusFilter);

  const visibleBonusHistory = showAllBonusHistory
    ? filteredBonusHistory
    : filteredBonusHistory.slice(0, 5);

  const bonusCards = [
    { key: "performance", title: "Performance Bonus", amount: perfAmt, icon: "📈", color: "#c026d3", bg: "#fff0ff" },
    { key: "team", title: "Team Bonus", amount: teamAmt, icon: "👥", color: "#2563eb", bg: "#eff6ff" },
    { key: "royalty", title: "Royalty Bonus", amount: royAmt, icon: "👑", color: "#f97316", bg: "#fff7ed" },
    { key: "refer", title: "Refer Bonus", amount: refAmt, icon: "🎁", color: "#16a34a", bg: "#ecfdf5" }
  ];

  const getInitials = (name) => {
    if (!name) return "SM";
    return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
  };

  if (loading) {
    return (
      <div style={styles.loadingPage}>
        <div style={styles.loadingBox}>
          <div style={styles.loadingIcon}>🎁</div>
          <h2>Loading Refer World...</h2>
        </div>
      </div>
    );
  }

  const pendingRefers = history.filter((x) => x.status !== "Active");
  const todayJoinMembers = (team.history || []).filter((item) => {
    const itemDate = new Date(item.date).toDateString();
    const todayDate = new Date().toDateString();
    return itemDate === todayDate;
  });

  const dynamicCounts = getDynamicLevelCounts();
  const dynamicIncomes = getDynamicLevelIncomes();
  const selectedFilteredHistory = getFilteredTeamHistory();
  const selectedFilteredTotalIncome = selectedFilteredHistory.reduce((sum, item) => sum + Number(item.amount || 0), 0);

  return (
    <div style={styles.pageContainer}>
      <div style={styles.page}>
        
        {/* 👇 EXACT 100% SAME SIDEBAR DRAWER FROM HOME.JS */}
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

            {/* SIDEBAR NAV BUTTONS */}
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

            {/* PLANT IMAGE CONTAINER AT THE BOTTOM */}
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

        {/* STATUS OVERLAY */}
        {statusOverlay.show && (
          <div style={styles.statusOverlayBg}>
            <div style={{
              ...styles.statusOverlayCard,
              borderTop: statusOverlay.type === "success" ? "5px solid #10b981" : statusOverlay.type === "error" ? "5px solid #ef4444" : "5px solid #3b82f6"
            }}>
              <div style={{
                ...styles.statusOverlayIcon,
                background: statusOverlay.type === "success" ? "linear-gradient(135deg, #dcfce7, #bbf7d0)" : statusOverlay.type === "error" ? "linear-gradient(135deg, #fee2e2, #fecaca)" : "linear-gradient(135deg, #dbeafe, #bfdbfe)",
                color: statusOverlay.type === "success" ? "#16a34a" : statusOverlay.type === "error" ? "#dc2626" : "#2563eb"
              }}>
                {statusOverlay.type === "success" ? "✓" : statusOverlay.type === "error" ? "✕" : "ℹ"}
              </div>
              <h3 style={styles.statusOverlayText}>{statusOverlay.message}</h3>
            </div>
          </div>
        )}

        {/* TOP NAVIGATION / TOGGLES */}
        <div style={styles.topBar}>
          <button style={styles.drawerToggleBtn} onClick={() => setIsDrawerOpen(true)}>☰</button>
          <button style={styles.bellBtn} onClick={() => navigate("/notifications")}>🔔</button>
        </div>

        <header style={styles.header}>
          <p style={styles.welcome}>Welcome to</p>
          <h1 style={styles.mainTitle}>🎁 SAVE MONEY</h1>
          <h2 style={styles.referWorld}>Refer World</h2>
          <p style={styles.tagline}>Refer More, Earn More, Grow Together!</p>
        </header>

        <section style={styles.heroCard}>
          <div style={styles.heroLeft}>
            <div style={styles.avatarWrap}>
              <img
                style={styles.avatar}
                src={profilePhoto || "https://i.pravatar.cc/160?img=12"}
                alt="user"
              />
              <div style={styles.crown}>♛</div>
            </div>

            <div>
              <h2 style={{ fontSize: "18px", margin: "0 0 4px 0" }}>{user.name || "Save Money User"}</h2>
              <span style={styles.activeMember}>
                <span
                  style={{
                    ...styles.greenDot,
                    background:
                      String(user.activeStatus || "Inactive").toLowerCase() === "active"
                        ? "#22c55e"
                        : "#ef4444"
                  }}
                />
                {user.activeStatus || "Inactive"} Member
              </span>
              <p style={styles.smallText}>Refer ID</p>
              <div style={styles.referIdBox}>
                <span>{referCode}</span>
                <button onClick={() => copyText(referCode)}>Copy</button>
              </div>
            </div>
          </div>

          <div style={styles.heroRight}>
            <div style={styles.walletRound}>⚡</div>
            <p style={{ margin: "4px 0", fontSize: "12px", opacity: 0.9 }}>All Time Balance</p>
            <h1 style={{ margin: 0, fontSize: "24px" }}>{money(totalAllTimeBalance)}</h1>
          </div>
        </section>

        <section style={styles.linkCard}>
          <div style={styles.linkIcon}>🔗</div>
          <div style={styles.linkMiddle}>
            <h3 style={{ margin: "0 0 6px 0", fontSize: "15px" }}>Your Refer Link</h3>
            <div style={styles.copyBox}>
              <span style={styles.referLinkText}>{referLink}</span>
              <button style={styles.copyLinkBtn} onClick={() => copyText(referLink)}>
                🔗 Copy Link
              </button>
            </div>
          </div>
          <div style={styles.shareBox}>
            <h3 style={{ margin: "0 0 6px 0", fontSize: "13px" }}>Share via</h3>
            <div style={{ display: "flex", gap: "8px" }}>
              <button style={styles.whatsapp} onClick={shareWhatsapp}>🟢</button>
              <button style={styles.telegram} onClick={shareTelegram}>⌲</button>
            </div>
          </div>
        </section>

        <section style={styles.bonusGrid}>
          {bonusCards.map((b) => (
            <div key={b.key} style={{ ...styles.bonusCard, background: b.bg }}>
              <div style={{ ...styles.bonusIcon, background: b.color }}>
                {b.icon}
              </div>
              <h3 style={{ fontSize: "14px", margin: "8px 0 4px 0", color: "#334155" }}>{b.title}</h3>
              <h2 style={{ fontSize: "20px", margin: "0 0 10px 0", color: "#0f172a" }}>{money(b.amount)}</h2>
              <button
                style={{ ...styles.detailBtn, color: b.color }}
                onClick={() => setBonusModal(b.key)}
              >
                View Details
              </button>
            </div>
          ))}
        </section>

        <section style={styles.historyCard}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
            <div><h2 style={{ fontSize: "18px", fontWeight: "700", margin: 0 }}>💰 All Bonus History</h2></div>
            <select
              value={bonusFilter}
              onChange={(e) => setBonusFilter(e.target.value)}
              style={styles.filterSelect}
            >
              <option value="All">All Bonus</option>
              <option value="Referral Bonus">🎁 Referral</option>
              <option value="Performance Bonus">📈 Performance</option>
              <option value="Team Bonus">👥 Team</option>
              <option value="Royalty Bonus">👑 Royalty</option>
            </select>
          </div>

          <div style={styles.txListWrapper}>
            {filteredBonusHistory.length === 0 ? (
              <p style={{ textAlign: "center", padding: "20px", color: "#666" }}>No Bonus History Found</p>
            ) : (
              visibleBonusHistory.map((item, index) => {
                const isReceived = true;
                const userPhotoUrl = getDynamicUserPhoto(item);

                return (
                  <div 
                    key={index} 
                    style={styles.txItemRow} 
                    onClick={() => setSelectedTx(item)}
                  >
                    <div style={styles.txLeftSection}>
                      {userPhotoUrl ? (
                        <img 
                          style={styles.txUserAvatarImage} 
                          src={userPhotoUrl} 
                          alt={item.fromName || "User"} 
                        />
                      ) : (
                        <div style={{ 
                          ...styles.txAvatarCircle, 
                          background: "#f1f5f9", 
                          color: "#475569" 
                        }}>
                          {getInitials(item.fromName)}
                        </div>
                      )}
                      
                      <div style={styles.txMetaDetails}>
                        <h4 style={styles.txSenderName}>{item.fromName || "Save Money User"}</h4>
                        <p style={styles.txTimeStamp}>
                          {new Date(item.date).toDateString() === new Date().toDateString() 
                            ? `Received Today, ${new Date(item.date).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`
                            : `${new Date(item.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}, ${new Date(item.date).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`
                          }
                        </p>
                        <div style={styles.txTagBadge}>
                          💵 {item.bonusType || "Money Received"}
                        </div>
                      </div>
                    </div>

                    <div style={styles.txRightSection}>
                      <h3 style={{ ...styles.txAmountText, color: isReceived ? "#16a34a" : "#dc2626" }}>
                        {isReceived ? "+ " : "- "}{money(item.amount)}
                      </h3>
                      <p style={styles.txFromBankText}>In <span style={styles.upiIconSmall}>🌐</span></p>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <div style={styles.paytmBrandFooter}>
            <span style={{ fontWeight: "bold", color: "#7b20ff", textTransform: "uppercase", letterSpacing: "1px" }}>save money</span>
          </div>
        </section>

        {filteredBonusHistory.length > 5 && (
          <button
            style={styles.viewMoreBtn}
            onClick={() => setShowAllBonusHistory(!showAllBonusHistory)}
          >
            {showAllBonusHistory ? "Show Less ⌃" : "View More ⌄"}
          </button>
        )}

        <section style={styles.bottomBanner}>
          <div style={styles.bottomGift}>🎁</div>
          <div style={{ flex: 1 }}>
            <h2 style={{ fontSize: "16px", margin: "0 0 2px 0" }}>Keep Referring & Earning</h2>
            <p style={{ margin: 0, fontSize: "12px", opacity: 0.9 }}>Your network is your net worth.</p>
          </div>
          <button style={styles.referNowBtn} onClick={shareWhatsapp}>🔗 Refer Now</button>
        </section>

        {/* 📸 RECEIPT POPUP MODAL */}
        {selectedTx && (
          <div style={styles.modalOverlay} onClick={() => setSelectedTx(null)}>
            <div style={styles.txDetailsCard} onClick={(e) => e.stopPropagation()}>
              <div style={styles.txDetailsHeader}>
                <button style={styles.txBackArrow} onClick={() => setSelectedTx(null)}>←</button>
                <h3 style={{ margin: 0, fontSize: "18px" }}>Money Received</h3>
                <div style={{ display: "flex", gap: "15px" }}>
                  <span style={styles.txHeaderLink} onClick={() => handleShareTx(selectedTx)}>Share</span>
                  <span style={styles.txHeaderLink} onClick={() => alert("Help Center Clicked")}>Help</span>
                </div>
              </div>

              <div ref={shareAreaRef} style={styles.txDetailsInnerBox}>
                <div style={{ textAlign: "center", paddingBottom: "20px", borderBottom: "1px dashed #e2e8f0" }}>
                  <p style={{ margin: 0, color: "#666", fontSize: "14px" }}>Amount</p>
                  <h1 style={styles.txDetailMainAmount}>
                    {money(selectedTx.amount)} <span style={styles.verifiedCheck}>✓</span>
                  </h1>
                  <p style={{ margin: "4px 0", color: "#666", textTransform: "capitalize", fontSize: "13px" }}>
                    {numberToWords(selectedTx.amount)}
                  </p>
                  <div style={styles.moneyReceivedTag}>
                    💵 {selectedTx.bonusType || "Money Received"} {selectedTx.level ? `(Level ${selectedTx.level})` : ""}
                  </div>
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 0", borderBottom: "1px dashed #e2e8f0" }}>
                  <div>
                    <p style={styles.sectionLabel}>Income Source</p>
                    <h4 style={styles.sectionValueName}>{selectedTx.bonusType || "Referral Bonus"}</h4>
                    <p style={styles.sectionSubValue}>Credited successfully to your wallet</p>
                  </div>
                  <div style={{ ...styles.detailAvatarCircle, background: "#fef3c7", color: "#d97706" }}>
                    🎁
                  </div>
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "18px 0", borderBottom: "1px dashed #e2e8f0" }}>
                  <div>
                    <p style={styles.sectionLabel}>From</p>
                    <h4 style={styles.sectionValueName}>{selectedTx.fromName || "Sender User"} <span style={styles.blueTick}>✓</span></h4>
                    <p style={styles.sectionSubValue}>{selectedTx.fromEmail || "user@axl"}</p>
                  </div>
                  {getDynamicUserPhoto(selectedTx) ? (
                    <img style={styles.detailUserImage} src={getDynamicUserPhoto(selectedTx)} alt="Sender" />
                  ) : (
                    <div style={{ ...styles.detailAvatarCircle, background: "#e0f2fe", color: "#0369a1" }}>
                      {getInitials(selectedTx.fromName)}
                    </div>
                  )}
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "18px 0" }}>
                  <div>
                    <p style={styles.sectionLabel}>To</p>
                    <h4 style={styles.sectionValueName}>{user.name || "Save Money User"}</h4>
                    <p style={styles.sectionSubValue}>{user.email || "wallet@id"}</p>
                    <p style={styles.bankNameFooter}>Save Money Wallet - {referCode}</p>
                  </div>
                  <img style={styles.detailUserImage} src={profilePhoto || "https://i.pravatar.cc/160?img=12"} alt="Receiver" />
                </div>

                <div style={styles.txFooterMetaDetails}>
                  <p>Received at {new Date(selectedTx.date).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}, {new Date(selectedTx.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                  <p style={{ display: "flex", justifyContent: "space-between" }}>
                    <span>Ref No: TXN{Math.floor(100000000 + Math.random() * 900000000)}</span>
                    <span style={{ color: "#2563eb", cursor: "pointer", fontWeight: "bold" }} onClick={() => copyText("TXN123456")}>Copy</span>
                  </p>
                </div>
              </div>
              <button style={styles.imgCloseBtn} onClick={() => setSelectedTx(null)}>Close</button>
            </div>
          </div>
        )}

        {/* PERFORMANCE BONUS MODAL */}
        {bonusModal === "performance" && (
          <NewModal onClose={() => setBonusModal(null)}>
            <div style={styles.modalHeaderRow}>
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <div style={styles.perfHeaderIconBox}>📊</div>
                <h2 style={styles.modalMainTitle}>Performance Bonus</h2>
              </div>
              <button style={styles.modalRoundCloseBtn} onClick={() => setBonusModal(null)}>
                ✕
              </button>
            </div>

            {!performance?.enabled ? (
              <div style={{ padding: "10px 0" }}>
                {performance?.expired ? (
                  <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: "20px", padding: "25px", textAlign: "center" }}>
                    <div style={{ fontSize: "40px", marginBottom: "10px" }}>❌</div>
                    <h3 style={{ color: "#dc2626", margin: "0 0 8px 0", fontSize: "20px" }}>Performance Bonus Expired</h3>
                    <p style={{ color: "#991b1b", margin: 0, fontSize: "14px", lineHeight: "1.5" }}>You failed to complete 3 active referrals within 30 days of registration.</p>
                  </div>
                ) : (
                  <div style={{ background: "#fff7ed", border: "1px solid #ffedd5", borderRadius: "20px", padding: "20px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "15px" }}>
                      <span style={{ background: "#ffedd5", color: "#c2410c", padding: "4px 12px", borderRadius: "20px", fontWeight: "bold", fontSize: "12px" }}>Status: Inactive</span>
                      <span style={{ color: "#ea580c", fontWeight: "bold", fontSize: "13px" }}>⏳ {performance?.daysLeft || 0} Days Left</span>
                    </div>

                    <h3 style={{ color: "#9a3412", fontSize: "18px", margin: "0 0 6px 0" }}>Unlock Performance Bonus</h3>
                    <p style={{ color: "#c2410c", fontSize: "13px", margin: "0 0 20px 0", lineHeight: "1.4" }}>Complete 3 active referrals within 30 days of account creation to unlock your performance bonus.</p>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", background: "#ffffff", padding: "15px", borderRadius: "14px", border: "1px solid #fed7aa", textAlign: "center", marginBottom: "15px" }}>
                      <div>
                        <small style={{ color: "#9a3412", fontSize: "11px", display: "block" }}>Completed Active Refers</small>
                        <h2 style={{ margin: "4px 0 0", color: "#ea580c", fontSize: "22px" }}>{performance?.directActiveCount || 0} / 3</h2>
                      </div>
                      <div style={{ borderLeft: "1px solid #fed7aa" }}>
                        <small style={{ color: "#9a3412", fontSize: "11px", display: "block" }}>Remaining Needed</small>
                        <h2 style={{ margin: "4px 0 0", color: "#dc2626", fontSize: "22px" }}>
                          {Math.max(0, 3 - Number(performance?.directActiveCount || 0))}
                        </h2>
                      </div>
                    </div>

                    <div>
                      <div style={{ width: "100%", height: "8px", background: "#fed7aa", borderRadius: "10px", overflow: "hidden" }}>
                        <div style={{ width: `${Math.min(((performance?.directActiveCount || 0) / 3) * 100, 100)}%`, height: "100%", background: "#ea580c", borderRadius: "10px", transition: "width 0.3s ease" }} />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <>
                <div style={styles.perfGradientBanner}>
                  <div style={styles.bannerLeftInfo}>
                    <p style={styles.bannerSubText}>Total Performance Bonus</p>
                    <h1 style={styles.bannerMainAmount}>{money(performance?.balance || 0)}</h1>
                  </div>
                  <div style={styles.bannerRightBadgeWrap}>
                    <span style={styles.bannerStatusLabel}>Status</span>
                    <span style={styles.bannerActiveBadge}>● Active</span>
                  </div>
                  <div style={styles.bannerGraphicIllustration}>📈</div>
                </div>

                <div style={styles.twoColumnStatsGrid}>
                  <div style={styles.subStatCardItem}>
                    <div style={styles.statIconBadgePurp}>📅</div>
                    <div>
                      <p style={styles.statCardLabelText}>This Month Bonus</p>
                      <h3 style={styles.statCardAmountVal}>{money(performance?.thisMonthBonus || 0)}</h3>
                    </div>
                  </div>
                  <div style={{ ...styles.subStatCardItem, borderLeft: "1px solid #eef2f6" }}>
                    <div style={styles.statIconBadgeBlue}>📅</div>
                    <div>
                      <p style={styles.statCardLabelText}>Last Month Bonus</p>
                      <h3 style={styles.statCardAmountVal}>{money(performance?.lastMonthBonus || 0)}</h3>
                    </div>
                  </div>
                </div>

                <div style={styles.modalHorizontalLine} />

                <div style={{ marginBottom: "20px" }}>
                  <div style={styles.modernSelectInputWrapper}>
                    <span style={{ fontSize: "16px" }}>📅</span>
                    <select value={performanceFilter} onChange={(e) => setPerformanceFilter(e.target.value)} style={styles.modernDropdownField}>
                      <option value="thisMonth">This Month</option>
                      <option value="lastMonth">Last Month</option>
                      <option value="all">All</option>
                    </select>
                  </div>
                </div>

                <div style={styles.historyHeadingSection}>
                  <span style={{ fontSize: "18px", color: "#4f46e5" }}>🕒</span>
                  <h3 style={styles.historySectionTitleText}>Performance History</h3>
                </div>

                <div style={styles.modalDataLogsContainer}>
                  {!filteredPerformanceHistory || filteredPerformanceHistory.length === 0 ? (
                    <div style={styles.emptyHistoryStateBox}>
                      <div style={styles.emptyStateIconPurple}>📄</div>
                      <h4 style={styles.emptyStateMainTitle}>No History</h4>
                      <p style={styles.emptyStateSubtitleText}>Your performance history will appear here</p>
                    </div>
                  ) : (
                    filteredPerformanceHistory.map((item, index) => (
                      <div key={index} style={styles.historyItemRowCard}>
                        <div>
                          <h4 style={styles.logUserNameText}>{item.fromName || "User Name"}</h4>
                          <p style={styles.logDateSubText}>{new Date(item.date).toLocaleDateString("en-IN")}</p>
                        </div>
                        <h3 style={styles.logIncomeValueGreen}>+{money(item.amount)}</h3>
                      </div>
                    ))
                  )}
                </div>
              </>
            )}

            <button style={styles.modalFooterPrimaryBtn} onClick={() => setBonusModal(null)}>
              Close
            </button>
          </NewModal>
        )}

        {/* TEAM BONUS MODAL */}
        {bonusModal === "team" && (
          <NewModal onClose={() => setBonusModal(null)}>
            <div style={styles.modalHeaderRow}>
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <div style={styles.teamHeaderIconBox}>👥</div>
                <div>
                  <h2 style={styles.modalMainTitle}>Team Bonus</h2>
                  <p style={styles.modalSubTitleDescription}>View your team's performance and earnings</p>
                </div>
              </div>
              <button style={styles.modalRoundCloseBtn} onClick={() => setBonusModal(null)}>✕</button>
            </div>

            <div style={styles.teamMainAmountContainerCard}>
              <div style={{ display: "flex", flexDirection: "column" }}>
                <h1 style={styles.teamBigAmountHeading}>{money(team.balance || 0)}</h1>
                <p style={styles.teamAmountLabelCaptionText}>Total Team Bonus</p>
              </div>
              <div style={styles.teamStatusBadgeFlexBox}>
                <span style={{ fontSize: "12px", color: "#64748b" }}>Status</span>
                <span style={styles.teamActiveBadgeFill}>● Active</span>
              </div>
              <div style={styles.teamGraphicIllustrationRight}>👥</div>
            </div>

            <div style={styles.teamDualFlexGridWrapper}>
              <div style={styles.teamFlexGridHalfBlock}>
                <div style={styles.cardHeaderHeadingRow}>
                  <span>📊</span>
                  <h4 style={styles.cardBlockTitleInlineText}>Today's Report</h4>
                </div>
                <p style={styles.reportInsideLabelSubText}>Today's Income</p>
                <h3 style={styles.reportInsideValueBoldNumber}>{money(team.todayBonus || 0)}</h3>
                
                <button style={styles.networkJoinBadgeLinkBtn} onClick={() => setShowTodayJoinModal(true)}>
                  📈 Network Joining Today: {team.todayJoin || 0} (View All)
                </button>
              </div>

              <div style={styles.teamFlexGridHalfBlock}>
                <div style={styles.cardHeaderHeadingRow}>
                  <span>🕒</span>
                  <h4 style={styles.cardBlockTitleInlineText}>Select Time Frame</h4>
                </div>
                
                <div style={{ ...styles.modernSelectInputWrapper, marginTop: "15px" }}>
                  <span>🌐</span>
                  <select value={teamTimeFilter} onChange={(e) => setTeamTimeFilter(e.target.value)} style={styles.modernDropdownField}>
                    <option value="allTime">All Time</option>
                    <option value="thisMonth">This Month</option>
                    <option value="lastMonth">Last Month</option>
                    <option value="customRange">Select Date Range</option>
                  </select>
                </div>

                {teamTimeFilter === "customRange" && (
                  <div style={styles.customDateInputsFlexRow}>
                    <input type="date" value={teamStartDate} onChange={(e) => setTeamStartDate(e.target.value)} style={styles.datePickerInputField} />
                    <input type="date" value={teamEndDate} onChange={(e) => setTeamEndDate(e.target.value)} style={styles.datePickerInputField} />
                  </div>
                )}
              </div>
            </div>

            <div style={styles.sectionHeadingRowFlex}>
              <span>👥</span>
              <h3 style={styles.sectionTitleBlockHeader}>Total Level Members ({teamTimeFilter === "allTime" ? "All Time" : "Filtered"})</h3>
            </div>

            <div style={styles.levelHorizontalFlexTrack}>
              <div style={{ ...styles.levelHorizontalItemBox, borderLeft: "4px solid #16a34a", background: "#f0fdf4" }}>
                <h4 style={{ ...styles.levelLabelNumberTitle, color: "#16a34a" }}>L1</h4>
                <p style={styles.levelUserCountValueText}>Users: {dynamicCounts[1]}</p>
              </div>
              <div style={styles.levelHorizontalItemBox}><h4 style={styles.levelLabelNumberTitle}>L2</h4><p style={styles.levelUserCountValueText}>Users: {dynamicCounts[2]}</p></div>
              <div style={styles.levelHorizontalItemBox}><h4 style={styles.levelLabelNumberTitle}>L3</h4><p style={styles.levelUserCountValueText}>Users: {dynamicCounts[3]}</p></div>
              <div style={styles.levelHorizontalItemBox}><h4 style={styles.levelLabelNumberTitle}>L4</h4><p style={styles.levelUserCountValueText}>Users: {dynamicCounts[4]}</p></div>
              <div style={styles.levelHorizontalItemBox}><h4 style={styles.levelLabelNumberTitle}>L5</h4><p style={styles.levelUserCountValueText}>Users: {dynamicCounts[5]}</p></div>
            </div>

            <div style={styles.teamDualFlexGridWrapper}>
              <div style={styles.teamFlexGridHalfBlock}>
                <div style={styles.cardHeaderHeadingRow}><span>⚙️</span><h4 style={styles.cardBlockTitleInlineText}>Income Summary</h4></div>
                <div style={styles.summaryListItemsFlexColumn}>
                  <div style={styles.summaryTableRowLine}>
                    <span style={styles.summaryRowLabelCell}><span style={{marginRight:6}}>🔵</span> Selected Filter Total Income</span>
                    <span style={styles.summaryRowValueCellBlue}>{teamTimeFilter === "allTime" ? money(team.balance) : money(selectedFilteredTotalIncome)}</span>
                  </div>
                  <div style={styles.summaryTableRowLine}>
                    <span style={styles.summaryRowLabelCell}><span style={{marginRight:6}}>🟢</span> This Month Default Income</span>
                    <span style={styles.summaryRowValueCellDark}>{money(team.thisMonthBonus)}</span>
                  </div>
                  <div style={styles.summaryTableRowLine}>
                    <span style={styles.summaryRowLabelCell}><span style={{marginRight:6}}>🟣</span> Last Month Default Income</span>
                    <span style={styles.summaryRowValueCellDark}>{money(team.lastMonthBonus)}</span>
                  </div>
                </div>
              </div>

              <div style={styles.teamFlexGridHalfBlock}>
                <div style={styles.cardHeaderHeadingRow}><span>📊</span><h4 style={styles.cardBlockTitleInlineText}>Level Income ({teamTimeFilter === "allTime" ? "All Time" : "Filtered"})</h4></div>
                <div style={styles.levelIncomeDenseBlockGrid}>
                  <div style={styles.levelMiniBlockGridItem}><span style={styles.miniBlockLabelText}>Level 1</span><h5 style={styles.miniBlockValueAmountText}>{money(dynamicIncomes[1])}</h5></div>
                  <div style={styles.levelMiniBlockGridItem}><span style={styles.miniBlockLabelText}>Level 2</span><h5 style={styles.miniBlockValueAmountText}>{money(dynamicIncomes[2])}</h5></div>
                  <div style={styles.levelMiniBlockGridItem}><span style={styles.miniBlockLabelText}>Level 3</span><h5 style={styles.miniBlockValueAmountText}>{money(dynamicIncomes[3])}</h5></div>
                  <div style={styles.levelMiniBlockGridItem}><span style={styles.miniBlockLabelText}>Level 4</span><h5 style={styles.miniBlockValueAmountText}>{money(dynamicIncomes[4])}</h5></div>
                  <div style={styles.levelMiniBlockGridItem}><span style={styles.miniBlockLabelText}>Level 5</span><h5 style={styles.miniBlockValueAmountText}>{money(dynamicIncomes[5])}</h5></div>
                </div>
              </div>
            </div>

            <div style={styles.sectionHeadingRowFlex}><span>📄</span><h3 style={styles.sectionTitleBlockHeader}>Team Bonus History</h3></div>

            <div style={styles.modalDataLogsContainer}>
              {selectedFilteredHistory.length === 0 ? (
                <div style={styles.emptyHistoryStateBox}>
                  <div style={styles.emptyStateIconBlue}>📄</div>
                  <h4 style={styles.emptyStateMainTitle}>No Team Bonus History Found</h4>
                </div>
              ) : (
                <div style={styles.tableWrap}>
                  <table style={styles.table}>
                    <thead style={styles.tableHeaderStyleRow}>
                      <tr>
                        <th style={styles.tableHeadCellText}>User</th>
                        <th style={styles.tableHeadCellText}>Upline Name</th>
                        <th style={styles.tableHeadCellText}>Level</th>
                        <th style={styles.tableHeadCellText}>You Earned</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedFilteredHistory.map((item, index) => (
                        <tr key={index} style={styles.tableBodyRowItem}>
                          <td style={styles.tableDataCellText}><b>{item.fromName || "-"}</b><br/><small style={{color:"#64748b"}}>{item.fromEmail}</small></td>
                          <td style={styles.tableDataCellText}>{item.uplineName || "-"}</td>
                          <td style={styles.tableDataCellText}><span style={styles.tableLevelBadgeTag}>L{item.level || "-"}</span></td>
                          <td style={{ ...styles.tableDataCellText, fontWeight: "bold", color: "#2563eb" }}>{money(item.amount)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <button style={styles.modalFooterPrimaryBtn} onClick={() => setBonusModal(null)}>Close</button>
          </NewModal>
        )}

        {/* REFER BONUS MODAL */}
        {bonusModal === "refer" && (
          <NewModal onClose={() => setBonusModal(null)}>
            <div style={styles.modalHeaderRow}>
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <div style={styles.referGiftIconBox}>🎁</div>
                <div>
                  <h2 style={styles.modalMainTitle}>Refer Bonus</h2>
                  <p style={styles.modalSubTitleDescription}>Earn bonus from your direct referrals</p>
                </div>
              </div>
              <button style={styles.modalRoundCloseBtn} onClick={() => setBonusModal(null)}>✕</button>
            </div>

            <div style={styles.referSuccessCalloutAlertBanner}>
              <span style={styles.alertSuccessCheckIcon}>✓</span>
              <p style={styles.alertSuccessBannerInlineMessageText}>Congratulations! Every direct user's first investment gives you Refer Bonus.</p>
            </div>

            <div style={styles.teamDualFlexGridWrapper}>
              <div style={styles.referOrangeBannerCardContainer}>
                <p style={styles.orangeBannerSubTitleLabel}>Total Refer Bonus</p>
                <h1 style={styles.orangeBannerBigAmountDisplay}>{money(referBonus.totalBonus || 0)}</h1>
                <div style={styles.orangeBannerGraphicAssetIllustration}>💰</div>
              </div>

              <div style={styles.referPendingActionFlexCenterBlock}>
                <button style={styles.referOrangePendingArrowActionBtn} onClick={() => setShowPendingModal(false)}>
                  <span style={{marginRight:8}}>⏳</span> View Pending Refers ({pendingRefers.length}) <span style={{marginLeft:"auto", fontWeight:"bold"}}>˃</span>
                </button>
              </div>
            </div>

            <div style={styles.teamDualFlexGridWrapper}>
              <div style={{ ...styles.teamFlexGridHalfBlock, flex: 1.1 }}>
                <div style={styles.verticalMetricsFlexListColumn}>
                  <div style={styles.metricListingInlineRow}>
                    <div style={{display:"flex", alignItems:"center", gap:"10px"}}>
                      <span style={styles.metricIconCircleOrange}>📅</span>
                      <span style={styles.metricLabelNameText}>Today's Bonus</span>
                    </div>
                    <span style={styles.metricBoldValueNumberText}>{money(referBonus.todayBonus || 0)}</span>
                  </div>

                  <div style={styles.metricListingInlineRow}>
                    <div style={{display:"flex", alignItems:"center", gap:"10px"}}>
                      <span style={styles.metricIconCircleGreen}>📅</span>
                      <span style={styles.metricLabelNameText}>This Month Bonus</span>
                    </div>
                    <span style={styles.metricBoldValueNumberText}>{money(referBonus.todayBonus || 0)}</span>
                  </div>

                  <div style={styles.metricListingInlineRow}>
                    <div style={{display:"flex", alignItems:"center", gap:"10px"}}>
                      <span style={styles.metricIconCircleBlue}>📅</span>
                      <span style={styles.metricLabelNameText}>Last Month Bonus</span>
                    </div>
                    <span style={styles.metricBoldValueNumberText}>{money(referBonus.lastMonthBonus || 0)}</span>
                  </div>

                  <div style={styles.metricListingInlineRow}>
                    <div style={{display:"flex", alignItems:"center", gap:"10px"}}>
                      <span style={styles.metricIconCirclePurp}>💼</span>
                      <span style={styles.metricLabelNameText}>Total Refer Bonus</span>
                    </div>
                    <span style={styles.metricBoldValueNumberText}>{money(referBonus.totalBonus || 0)}</span>
                  </div>

                  <div style={{ ...styles.metricListingInlineRow, border: "none", paddingBottom: 0 }}>
                    <div style={{display:"flex", alignItems:"center", gap:"10px"}}>
                      <span style={styles.metricIconCircleOrange}>👥</span>
                      <span style={styles.metricLabelNameText}>Eligible Refers</span>
                    </div>
                    <span style={styles.metricBoldValueNumberText}>{referBonus.count || 0}</span>
                  </div>
                </div>
              </div>

              <div style={{ ...styles.teamFlexGridHalfBlock, flex: 0.9, display: "flex", flexDirection: "column", gap: "15px", background: "none", border: "none", padding: 0, boxShadow: "none" }}>
                <div style={styles.tripleSquareBadgesFlexRowTrack}>
                  <div style={styles.squareStatusBadgeMetricsItemBox}>
                    <div style={styles.squareIconTrackBlue}>👥</div>
                    <p style={styles.squareBadgeLabelCaption}>Total Direct</p>
                    <h3 style={styles.squareBadgeValueNumberHeading}>{history.length}</h3>
                  </div>

                  <div style={styles.squareStatusBadgeMetricsItemBox}>
                    <div style={styles.squareIconTrackGreen}>👤</div>
                    <p style={styles.squareBadgeLabelCaption}>Active Refers</p>
                    <h3 style={styles.squareBadgeValueNumberHeading}>{history.filter((x) => x.status === "Active").length}</h3>
                  </div>

                  <div style={styles.squareStatusBadgeMetricsItemBox}>
                    <div style={styles.squareIconTrackRed}>👤</div>
                    <p style={styles.squareBadgeLabelCaption}>Inactive</p>
                    <h3 style={styles.squareBadgeValueNumberHeading}>{history.filter((x) => x.status === "Inactive").length}</h3>
                  </div>
                </div>

                <div style={styles.modernSelectInputWrapper}>
                  <span style={{ fontSize: "16px" }}>📅</span>
                  <select
                    style={styles.modernDropdownField}
                    value={selectedMonth}
                    onChange={(e) => {
                      const value = e.target.value;
                      setSelectedMonth(value);
                      let targetMonth = "";
                      let targetYear = new Date().getFullYear();

                      if (value === "thisMonth") {
                        targetMonth = "";
                      } else if (value === "lastMonth") {
                        const d = new Date();
                        d.setMonth(d.getMonth() - 1);
                        targetMonth = String(d.getMonth() + 1);
                        targetYear = d.getFullYear();
                      } else {
                        targetMonth = value;
                      }
                      loadReferData(targetMonth, targetYear);
                    }}
                  >
                    <option value="thisMonth">This Month</option>
                    <option value="lastMonth">Last Month</option>
                    {Array.from({ length: 12 }, (_, i) => (
                      <option key={i+1} value={i+1}>{new Date(0, i).toLocaleString('en-US', { month: 'long' })}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div style={styles.historyHeadingSection}>
              <span style={{ fontSize: "18px", color: "#f97316" }}>🕒</span>
              <h3 style={styles.historySectionTitleText}>Bonus History</h3>
            </div>

            <div style={styles.modalDataLogsContainer}>
              <table style={styles.table}>
                <thead style={styles.tableHeaderStyleRow}>
                  <tr>
                    <th style={styles.tableHeadCellText}>User</th>
                    <th style={styles.tableHeadCellText}>Date</th>
                    <th style={styles.tableHeadCellText}>Level</th>
                    <th style={styles.tableHeadCellText}>Bonus</th>
                    <th style={styles.tableHeadCellText}>Type</th>
                  </tr>
                </thead>
                <tbody>
                  {(referBonus.history || []).length === 0 ? (
                    <tr>
                      <td colSpan="5" style={{ textAlign: "center", padding: "30px", color: "#64748b" }}>
                        No referral history found.
                      </td>
                    </tr>
                  ) : (
                    (referBonus.history || []).map((x, i) => {
                      const historyPhotoUrl = getDynamicUserPhoto(x);
                      return (
                        <tr key={i} style={styles.tableBodyRowItem}>
                          <td style={{ ...styles.tableDataCellText, display: "flex", alignItems: "center", gap: "10px" }}>
                            {historyPhotoUrl ? (
                              <img src={historyPhotoUrl} style={styles.tableAvatarIconRoundPhoto} alt="user" />
                            ) : (
                              <span style={styles.tableInitialPlaceholderBadgeCircle}>{x.fromName ? x.fromName[0] : "S"}</span>
                            )}
                            <div>
                              <b>{x.fromName || "User"}</b>
                              <br />
                              <small style={{ color: "#64748b" }}>{x.fromEmail}</small>
                            </div>
                          </td>
                          <td style={styles.tableDataCellText}>{x.date ? new Date(x.date).toLocaleDateString("en-IN") : "-"}</td>
                          <td style={styles.tableDataCellText}><span style={styles.tableLevelBadgeTag}>L{x.level || 1}</span></td>
                          <td style={{ ...styles.tableDataCellText, fontWeight: "bold", color: "#16a34a" }}>{money(x.amount)}</td>
                          <td style={styles.tableDataCellText}><small style={{ background: "#f1f5f9", padding: "4px 8px", borderRadius: "6px" }}>{x.note || "First Investment"}</small></td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            <button style={styles.referModalFooterCloseButton} onClick={() => setBonusModal(null)}>Close</button>
          </NewModal>
        )}

        {/* ROYALTY MODAL */}
        {bonusModal === "royalty" && (
          <Modal onClose={() => setBonusModal(null)}>
            <h2 style={{ margin: "0 0 10px 0" }}>👑 Royalty Bonus</h2>
            <h1 style={{ color: "#f97316", margin: "0 0 15px 0" }}>{money(royalty.balance)}</h1>
            <p>Status: <b>{royalty.enabled ? "Active" : "Inactive"}</b></p>
            <p>Direct Refer: <b>{royalty.directCount || 0}</b> / 50</p>
            <p>Remaining: <b>{royalty.remaining || 0}</b></p>
            <p style={styles.infoBox}>
              Royalty status will become active once 50 direct referrals are completed. You will receive a 3% royalty bonus on business generated after becoming active.
            </p>
            <button style={styles.closeBtn} onClick={() => setBonusModal(null)}>Close</button>
          </Modal>
        )}

        {/* PENDING REFERS SUB-MODAL */}
        {showPendingModal && (
          <div style={styles.subModalOverlay} onClick={() => setShowPendingModal(false)}>
            <div style={styles.modalBox} onClick={(e) => e.stopPropagation()}>
              <h2 style={{ color: "#ea580c" }}>⏳ Pending Refers List</h2>
              <div style={{ maxHeight: "350px", overflowY: "auto", margin: "20px 0", display: "flex", flexDirection: "column", gap: 10 }}>
                {pendingRefers.length === 0 ? (
                  <p style={{ textAlign: "center", color: "#94a3b8", padding: 20 }}>No pending refers available.</p>
                ) : (
                  pendingRefers.map((item, idx) => (
                    <div key={idx} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "#f8fafc", padding: "12px 16px", borderRadius: 14, border: "1px solid #e2e8f0" }}>
                      <div>
                        <b style={{ color: "#1e293b", fontSize: 15 }}>{item.name || "Save Money User"}</b><br />
                        <small style={{ color: "#64748b" }}>{item.email}</small>
                      </div>
                      <span style={{ fontSize: 12, padding: "6px 12px", borderRadius: 8, background: "#ffedd5", color: "#ea580c", fontWeight: 700 }}>Registered</span>
                    </div>
                  ))
                )}
              </div>
              <button style={{ ...styles.closeBtn, background: "#ea580c", color: "#fff" }} onClick={() => setShowPendingModal(false)}>Back</button>
            </div>
          </div>
        )}

        {/* TODAY JOIN MEMBERS SUB-MODAL */}
        {showTodayJoinModal && (
          <div style={styles.subModalOverlay} onClick={() => setShowTodayJoinModal(false)}>
            <div style={styles.modalBox} onClick={(e) => e.stopPropagation()}>
              <h2 style={{ color: "#2563eb" }}>📊 Today's Network Joining List</h2>
              <div style={{ maxHeight: "350px", overflowY: "auto", margin: "20px 0", display: "flex", flexDirection: "column", gap: 10 }}>
                {todayJoinMembers.length === 0 ? (
                  <p style={{ textAlign: "center", color: "#94a3b8", padding: 20 }}>No members joined today yet.</p>
                ) : (
                  todayJoinMembers.map((item, idx) => (
                    <div key={idx} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "#f8fafc", padding: "12px 16px", borderRadius: 14, border: "1px solid #e2e8f0" }}>
                      <div>
                        <b style={{ color: "#1e293b", fontSize: 15 }}>{item.fromName || "Save Money User"}</b><br />
                        <small style={{ color: "#64748b" }}>Level {item.level || "-"}</small>
                      </div>
                      <span style={{ fontSize: 12, padding: "6px 12px", borderRadius: 8, background: "#dbeafe", color: "#2563eb", fontWeight: 700 }}>Today Joined</span>
                    </div>
                  ))
                )}
              </div>
              <button style={{ ...styles.closeBtn, background: "#2563eb", color: "#fff" }} onClick={() => setShowTodayJoinModal(false)}>Back</button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

function NewModal({ children, onClose }) {
  return (
    <div style={styles.newModalOverlayOverlay} onClick={onClose}>
      <div style={styles.newModalContentWindowBox} onClick={(e) => e.stopPropagation()}>
        {children}
      </div>
    </div>
  );
}

function Modal({ children, onClose }) {
  return (
    <div style={styles.modalOverlay} onClick={onClose}>
      <div style={styles.modalBox} onClick={(e) => e.stopPropagation()}>
        {children}
      </div>
    </div>
  );
}

const styles = {
  // Page container & fix over-zoom issue
  pageContainer: {
    width: "100%",
    minHeight: "100vh",
    background: "linear-gradient(135deg, #fffaff 0%, #f8f3ff 100%)",
    display: "flex",
    justifyContent: "center",
    boxSizing: "border-box"
  },
  page: {
    width: "100%",
    maxWidth: "1000px",
    padding: "20px 16px",
    boxSizing: "border-box",
    position: "relative"
  },
  topBar: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "15px"
  },
  drawerToggleBtn: { 
    width: 48, 
    height: 48, 
    border: "none", 
    borderRadius: 14, 
    background: "white", 
    boxShadow: "0 8px 20px rgba(137,84,255,.15)", 
    fontSize: 22, 
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center"
  },
  bellBtn: {
    width: 48, 
    height: 48, 
    border: "none", 
    borderRadius: 14, 
    background: "white", 
    boxShadow: "0 8px 20px rgba(137,84,255,.15)", 
    fontSize: 20, 
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center"
  },

  /* SIDEBAR / DRAWER STYLES */
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
    width: "240px",
    height: "100vh",
    padding: "12px 10px",
    display: "flex",
    flexDirection: "column",
    boxShadow: "10px 0 30px rgba(0,0,0,0.85)",
    borderRight: "1px solid #1e293b",
    transform: "translateX(-100%)",
    transition: "transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
    overflow: "hidden",
    zIndex: 100003,
    boxSizing: "border-box"
  },
  drawerHeader: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: "8px",
    paddingBottom: "8px",
    borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
    flexShrink: 0
  },
  drawerBrand: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "4px"
  },
  drawerLogoWrapper: {
    width: "44px",
    height: "44px",
    borderRadius: "50%",
    background: "radial-gradient(circle, #03251a 0%, #064e3b 100%)",
    border: "2px solid #22c55e",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    boxShadow: "0 0 12px rgba(34, 197, 94, 0.35)"
  },
  drawerLogoImg: {
    width: "28px",
    height: "28px",
    objectFit: "contain"
  },
  drawerLogoText: {
    margin: 0,
    fontSize: "15px",
    fontWeight: "900",
    color: "#ffffff",
    letterSpacing: "0.8px",
    textAlign: "center"
  },
  drawerLogoSubtext: {
    fontSize: "10px",
    color: "#a7f3d0",
    fontWeight: "600",
    marginTop: "1px",
    textAlign: "center"
  },
  drawerNavList: {
    display: "flex",
    flexDirection: "column",
    gap: "6px",
    flexShrink: 0,
    overflowY: "auto",
    maxHeight: "calc(100vh - 200px)"
  },
  drawerNavItem: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    padding: "8px 14px",
    background: "rgba(255, 255, 255, 0.12)",
    backdropFilter: "blur(10px)",
    WebkitBackdropFilter: "blur(10px)",
    border: "1px solid rgba(255, 255, 255, 0.25)",
    clipPath: "polygon(12px 0%, calc(100% - 12px) 0%, 100% 50%, calc(100% - 12px) 100%, 12px 100%, 0% 50%)",
    color: "#ffffff",
    fontSize: "13px",
    fontWeight: "700",
    cursor: "pointer",
    textAlign: "left",
    transition: "all 0.25s ease",
    boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
    textShadow: "0 1px 2px rgba(0,0,0,0.5)"
  },
  drawerNavItemActive: {
    background: "rgba(255, 255, 255, 0.25)",
    border: "1px solid #ffffff",
    boxShadow: "0 0 16px rgba(255, 255, 255, 0.4)",
    fontWeight: "800"
  },
  drawerNavIcon: {
    fontSize: "18px",
    width: "22px",
    display: "inline-block",
    textAlign: "center"
  },
  drawerNavText: {
    flex: 1,
    fontSize: "13px",
    letterSpacing: "0.3px"
  },

  drawerNavDashboard: { background: "rgba(59, 130, 246, 0.2)", border: "1px solid rgba(59, 130, 246, 0.4)" },
  drawerNavMyInvestment: { background: "rgba(16, 185, 129, 0.2)", border: "1px solid rgba(16, 185, 129, 0.4)" },
  drawerNavSaveMoney: { background: "rgba(245, 158, 11, 0.2)", border: "1px solid rgba(245, 158, 11, 0.4)" },
  drawerNavOneTime: { background: "rgba(168, 85, 247, 0.2)", border: "1px solid rgba(168, 85, 247, 0.4)" },
  drawerNavPlan: { background: "rgba(6, 182, 212, 0.2)", border: "1px solid rgba(6, 182, 212, 0.4)" },
  drawerNavAddFund: { background: "rgba(20, 184, 166, 0.2)", border: "1px solid rgba(20, 184, 166, 0.4)" },
  drawerNavRefer: { background: "rgba(236, 72, 153, 0.2)", border: "1px solid rgba(236, 72, 153, 0.4)" },
  drawerNavWithdraw: { background: "rgba(249, 115, 22, 0.2)", border: "1px solid rgba(249, 115, 22, 0.4)" },
  drawerNavDailyReward: { background: "rgba(244, 63, 94, 0.2)", border: "1px solid rgba(244, 63, 94, 0.4)" },
  drawerNavInvestmentAssistant: { background: "rgba(2, 132, 199, 0.2)", border: "1px solid rgba(2, 132, 199, 0.4)" },
  drawerNavSupport: { background: "rgba(99, 102, 241, 0.2)", border: "1px solid rgba(99, 102, 241, 0.4)" },
  drawerNavProfile: { background: "rgba(236, 72, 153, 0.2)", border: "1px solid rgba(236, 72, 153, 0.4)" },
  drawerNavLogout: { background: "rgba(239, 68, 68, 0.2)", border: "1px solid rgba(239, 68, 68, 0.4)" },

  treePlantOnlyWrapper: {
    flex: 1,
    minHeight: 0,
    marginTop: "10px",
    marginBottom: "4px",
    width: "100%",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
    borderRadius: "16px",
    boxShadow: "0 6px 18px rgba(0, 0, 0, 0.4)"
  },
  treePlantOnlyImg: {
    width: "90%",
    height: "65%",
    objectFit: "cover",
    borderRadius: "16px"
  },

  /* HEADER & HERO */
  header: {
    textAlign: "center",
    marginBottom: "20px"
  },
  welcome: { margin: 0, fontSize: "12px", color: "#64748b", textTransform: "uppercase", letterSpacing: "1px" },
  mainTitle: { margin: "2px 0 0 0", fontSize: "22px", fontWeight: "900", color: "#0f172a" },
  referWorld: { margin: 0, fontSize: "16px", color: "#c026d3", fontWeight: "700" },
  tagline: { margin: "4px 0 0 0", fontSize: "12px", color: "#64748b" },

  heroCard: {
    background: "linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%)",
    borderRadius: "20px",
    padding: "18px 20px",
    color: "#fff",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    gap: "15px",
    boxShadow: "0 10px 25px -5px rgba(15, 23, 42, 0.3)",
    marginBottom: "16px"
  },
  heroLeft: { display: "flex", alignItems: "center", gap: "14px" },
  avatarWrap: { position: "relative", flexShrink: 0 },
  // 🟢 চাপটা ঠিক করার সিএসএস (objectFit, width/height, borderRadius)
  avatar: { 
    width: "56px", 
    height: "56px", 
    borderRadius: "50%", 
    objectFit: "cover", 
    border: "2px solid #a855f7",
    aspectRatio: "1/1",
    display: "block"
  },
  crown: { position: "absolute", top: "-10px", right: "-4px", fontSize: "14px", color: "#fbbf24" },
  activeMember: { display: "inline-flex", alignItems: "center", gap: "6px", background: "rgba(255,255,255,0.1)", padding: "2px 8px", borderRadius: "10px", fontSize: "11px" },
  greenDot: { width: "6px", height: "6px", borderRadius: "50%" },
  smallText: { margin: "6px 0 2px 0", fontSize: "10px", color: "#94a3b8" },
  referIdBox: { display: "flex", alignItems: "center", gap: "8px", background: "rgba(255,255,255,0.08)", padding: "4px 8px", borderRadius: "8px", fontSize: "12px", fontWeight: "bold" },
  heroRight: { textAlign: "right" },
  walletRound: { width: "32px", height: "32px", background: "rgba(255,255,255,0.1)", borderRadius: "50%", display: "inline-flex", alignItems: "center", justifyContent: "center" },

  linkCard: {
    background: "#fff",
    borderRadius: "18px",
    padding: "16px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    flexWrap: "wrap",
    gap: "12px",
    boxShadow: "0 4px 15px rgba(0,0,0,0.03)",
    marginBottom: "16px"
  },
  linkIcon: { fontSize: "24px" },
  linkMiddle: { flex: 1, minWidth: "200px" },
  copyBox: { display: "flex", alignItems: "center", gap: "8px", background: "#f8fafc", padding: "6px 10px", borderRadius: "10px", border: "1px solid #e2e8f0" },
  referLinkText: { flex: 1, fontSize: "12px", color: "#334155", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" },
  copyLinkBtn: { background: "#2563eb", color: "#fff", border: "none", padding: "6px 12px", borderRadius: "8px", fontSize: "11px", fontWeight: "bold", cursor: "pointer" },
  shareBox: { textAlign: "right" },
  whatsapp: { background: "#25d366", border: "none", width: "36px", height: "36px", borderRadius: "50%", color: "#fff", cursor: "pointer", fontSize: "16px", display: "inline-flex", alignItems: "center", justifyContent: "center" },
  telegram: { background: "#0088cc", border: "none", width: "36px", height: "36px", borderRadius: "50%", color: "#fff", cursor: "pointer", fontSize: "16px", display: "inline-flex", alignItems: "center", justifyContent: "center" },

  bonusGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
    gap: "12px",
    marginBottom: "20px"
  },
  bonusCard: {
    borderRadius: "16px",
    padding: "14px",
    textAlign: "center",
    boxShadow: "0 4px 12px rgba(0,0,0,0.02)"
  },
  bonusIcon: { width: "36px", height: "36px", borderRadius: "10px", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto", fontSize: "18px" },
  detailBtn: { background: "transparent", border: "none", fontSize: "12px", fontWeight: "700", cursor: "pointer" },

  historyCard: {
    background: "#fff",
    borderRadius: "20px",
    padding: "18px",
    boxShadow: "0 4px 20px rgba(0,0,0,0.03)",
    marginBottom: "16px"
  },
  filterSelect: { padding: "6px 12px", borderRadius: "10px", border: "1px solid #e2e8f0", outline: "none", fontSize: "12px", fontWeight: "600" },
  txListWrapper: { display: "flex", flexDirection: "column" },
  txItemRow: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 0", borderBottom: "1px solid #f1f5f9", cursor: "pointer" },
  txLeftSection: { display: "flex", alignItems: "center", gap: "10px" },
  // 🟢 ট্রানজাকশনের জন্য ইমেজের চাপটা ঠিক করার সিএসএস
  txUserAvatarImage: { 
    width: "40px", 
    height: "40px", 
    borderRadius: "50%", 
    objectFit: "cover", 
    aspectRatio: "1/1",
    flexShrink: 0
  },
  txAvatarCircle: { width: "40px", height: "40px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "bold", fontSize: "14px", flexShrink: 0 },
  txMetaDetails: { display: "flex", flexDirection: "column" },
  txSenderName: { margin: 0, fontSize: "14px", fontWeight: "600", color: "#1e293b" },
  txTimeStamp: { margin: "2px 0 0 0", fontSize: "11px", color: "#64748b" },
  txTagBadge: { display: "inline-flex", background: "#e8f5e9", color: "#2e7d32", fontSize: "10px", fontWeight: "700", padding: "2px 6px", borderRadius: "10px", marginTop: "2px" },
  txRightSection: { textAlign: "right" },
  txAmountText: { margin: 0, fontSize: "14px", fontWeight: "700" },
  txFromBankText: { margin: "2px 0 0 0", fontSize: "11px", color: "#64748b" },
  upiIconSmall: { fontSize: "11px" },
  paytmBrandFooter: { textAlign: "center", marginTop: "12px", fontSize: "12px" },

  viewMoreBtn: { width: "100%", padding: "10px", background: "#fff", border: "1px solid #e2e8f0", borderRadius: "12px", color: "#475569", fontWeight: "bold", cursor: "pointer", marginBottom: "20px" },

  bottomBanner: { background: "linear-gradient(135deg, #c026d3 0%, #7c3aed 100%)", borderRadius: "18px", padding: "16px", color: "#fff", display: "flex", alignItems: "center", gap: "12px" },
  bottomGift: { fontSize: "30px" },
  referNowBtn: { background: "#fff", color: "#7c3aed", border: "none", padding: "8px 14px", borderRadius: "10px", fontWeight: "bold", fontSize: "12px", cursor: "pointer" },

  /* MODALS AND OVERLAYS */
  modalOverlay: { position: "fixed", inset: 0, background: "rgba(15, 23, 42, 0.6)", backdropFilter: "blur(6px)", zIndex: 99999, display: "flex", alignItems: "center", justifyContent: "center", padding: "16px" },
  newModalOverlayOverlay: { position: "fixed", inset: 0, background: "rgba(15, 23, 42, 0.6)", backdropFilter: "blur(8px)", zIndex: 99999, display: "flex", alignItems: "center", justifyContent: "center", padding: "16px" },
  subModalOverlay: { position: "fixed", inset: 0, background: "rgba(0, 0, 0, 0.6)", zIndex: 100000, display: "flex", alignItems: "center", justifyContent: "center", padding: "16px" },
  
  modalBox: { background: "#fff", borderRadius: "20px", padding: "20px", width: "100%", maxWidth: "400px", boxShadow: "0 20px 40px rgba(0,0,0,0.2)" },
  newModalContentWindowBox: { width: "100%", maxWidth: "800px", maxHeight: "90vh", background: "#fff", borderRadius: "24px", padding: "20px", overflowY: "auto", boxSizing: "border-box" },
  
  txDetailsCard: { width: "100%", maxWidth: "380px", background: "#fff", borderRadius: "20px", padding: "16px", boxSizing: "border-box" },
  txDetailsHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", paddingBottom: "10px", borderBottom: "1px solid #f1f5f9" },
  txBackArrow: { background: "none", border: "none", fontSize: "20px", cursor: "pointer" },
  txHeaderLink: { color: "#2563eb", fontWeight: "bold", fontSize: "12px", cursor: "pointer" },
  txDetailsInnerBox: { padding: "12px 0" },
  txDetailMainAmount: { fontSize: "28px", fontWeight: "800", margin: "4px 0", color: "#0f172a" },
  verifiedCheck: { color: "#10b981" },
  moneyReceivedTag: { background: "#e8f5e9", color: "#16a34a", padding: "4px 10px", borderRadius: "12px", fontSize: "12px", fontWeight: "bold", display: "inline-block", marginTop: "6px" },
  sectionLabel: { margin: 0, fontSize: "11px", color: "#64748b" },
  sectionValueName: { margin: "2px 0 0 0", fontSize: "14px", fontWeight: "700", color: "#0f172a" },
  blueTick: { color: "#0284c7" },
  sectionSubValue: { margin: 0, fontSize: "11px", color: "#64748b" },
  bankNameFooter: { margin: "2px 0 0 0", fontSize: "10px", color: "#94a3b8" },
  detailAvatarCircle: { width: "36px", height: "36px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "bold", fontSize: "13px", flexShrink: 0 },
  // 🟢 ডিটেইল পপআপ এর ছবির জন্য সিএসএস
  detailUserImage: { 
    width: "36px", 
    height: "36px", 
    borderRadius: "50%", 
    objectFit: "cover", 
    aspectRatio: "1/1",
    flexShrink: 0 
  },
  txFooterMetaDetails: { background: "#f8fafc", padding: "10px", borderRadius: "10px", marginTop: "10px", fontSize: "11px", color: "#64748b" },
  imgCloseBtn: { width: "100%", padding: "10px", background: "#f1f5f9", border: "none", borderRadius: "10px", fontWeight: "bold", color: "#475569", cursor: "pointer", marginTop: "10px" },

  modalHeaderRow: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" },
  perfHeaderIconBox: { width: "40px", height: "40px", background: "#f3e8ff", borderRadius: "10px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "20px" },
  teamHeaderIconBox: { width: "40px", height: "40px", background: "#dbeafe", borderRadius: "10px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "20px" },
  referGiftIconBox: { width: "40px", height: "40px", background: "#fff7ed", borderRadius: "10px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "20px" },
  modalMainTitle: { margin: 0, fontSize: "18px", fontWeight: "700" },
  modalSubTitleDescription: { margin: 0, fontSize: "12px", color: "#64748b" },
  modalRoundCloseBtn: { width: "30px", height: "30px", borderRadius: "50%", background: "#f1f5f9", border: "none", cursor: "pointer" },
  
  perfGradientBanner: { background: "linear-gradient(135deg, #f3e8ff 0%, #fae8ff 100%)", borderRadius: "16px", padding: "16px", display: "flex", justifyContent: "space-between", alignItems: "center", position: "relative", marginBottom: "16px" },
  bannerLeftInfo: { zIndex: 1 },
  bannerSubText: { margin: 0, fontSize: "12px", color: "#6b21a8" },
  bannerMainAmount: { margin: "4px 0 0 0", fontSize: "28px", fontWeight: "800", color: "#2e1065" },
  bannerRightBadgeWrap: { textAlign: "right", zIndex: 1 },
  bannerStatusLabel: { fontSize: "11px", color: "#6b21a8", display: "block" },
  bannerActiveBadge: { background: "#dcfce7", color: "#16a34a", padding: "2px 8px", borderRadius: "10px", fontSize: "11px", fontWeight: "bold" },
  bannerGraphicIllustration: { position: "absolute", right: "10%", bottom: "-10px", fontSize: "60px", opacity: 0.1 },

  twoColumnStatsGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", background: "#f8fafc", borderRadius: "14px", padding: "12px", marginBottom: "16px" },
  subStatCardItem: { display: "flex", alignItems: "center", gap: "10px" },
  statIconBadgePurp: { width: "32px", height: "32px", background: "#f5e6ff", borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center" },
  statIconBadgeBlue: { width: "32px", height: "32px", background: "#e6f0ff", borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center" },
  statCardLabelText: { margin: 0, fontSize: "11px", color: "#64748b" },
  statCardAmountVal: { margin: 0, fontSize: "15px", fontWeight: "700" },
  modalHorizontalLine: { height: "1px", background: "#e2e8f0", margin: "16px 0" },
  modernSelectInputWrapper: { display: "flex", alignItems: "center", gap: "6px", border: "1px solid #e2e8f0", borderRadius: "10px", padding: "6px 10px", background: "#fff" },
  modernDropdownField: { border: "none", outline: "none", fontSize: "13px", fontWeight: "600", width: "100%", background: "transparent" },
  historyHeadingSection: { display: "flex", alignItems: "center", gap: "6px", marginBottom: "10px" },
  historySectionTitleText: { margin: 0, fontSize: "15px", fontWeight: "700" },
  modalDataLogsContainer: { border: "1px solid #e2e8f0", borderRadius: "14px", overflow: "hidden", background: "#fff", marginBottom: "16px" },
  emptyHistoryStateBox: { padding: "30px", textAlign: "center" },
  emptyStateIconPurple: { width: "40px", height: "40px", background: "#f3e8ff", color: "#a855f7", borderRadius: "50%", margin: "0 auto 8px", display: "flex", alignItems: "center", justifyContent: "center" },
  emptyStateIconBlue: { width: "40px", height: "40px", background: "#e0f2fe", color: "#0284c7", borderRadius: "50%", margin: "0 auto 8px", display: "flex", alignItems: "center", justifyContent: "center" },
  emptyStateMainTitle: { margin: 0, fontSize: "14px", fontWeight: "700" },
  emptyStateSubtitleText: { margin: "2px 0 0 0", fontSize: "12px", color: "#94a3b8" },
  modalFooterPrimaryBtn: { width: "100%", padding: "12px", background: "#ebe9fe", color: "#4f46e5", border: "none", borderRadius: "12px", fontSize: "14px", fontWeight: "bold", cursor: "pointer" },
  
  teamMainAmountContainerCard: { background: "linear-gradient(135deg, #eff6ff 0%, #e0f2fe 100%)", borderRadius: "16px", padding: "16px", display: "flex", justifyContent: "space-between", alignItems: "center", position: "relative", marginBottom: "16px" },
  teamBigAmountHeading: { margin: 0, fontSize: "28px", fontWeight: "800", color: "#1e3a8a" },
  teamAmountLabelCaptionText: { margin: "2px 0 0 0", fontSize: "12px", color: "#1e40af" },
  teamStatusBadgeFlexBox: { textAlign: "right" },
  teamActiveBadgeFill: { background: "#dcfce7", color: "#15803d", padding: "2px 8px", borderRadius: "10px", fontSize: "11px", fontWeight: "bold" },
  teamGraphicIllustrationRight: { position: "absolute", right: "10%", bottom: "-10px", fontSize: "60px", opacity: 0.1 },

  teamDualFlexGridWrapper: { display: "flex", gap: "12px", marginBottom: "16px", flexWrap: "wrap" },
  teamFlexGridHalfBlock: { flex: 1, minWidth: "220px", background: "#fff", border: "1px solid #e2e8f0", borderRadius: "14px", padding: "12px" },
  cardHeaderHeadingRow: { display: "flex", alignItems: "center", gap: "6px", borderBottom: "1px solid #f1f5f9", paddingBottom: "6px", marginBottom: "8px" },
  cardBlockTitleInlineText: { margin: 0, fontSize: "13px", fontWeight: "700" },
  reportInsideLabelSubText: { margin: 0, fontSize: "11px", color: "#64748b" },
  reportInsideValueBoldNumber: { margin: "2px 0 8px 0", fontSize: "20px", fontWeight: "800" },
  networkJoinBadgeLinkBtn: { width: "100%", padding: "8px", background: "#f0fdf4", border: "1px solid #bbf7d0", color: "#16a34a", borderRadius: "8px", fontSize: "11px", fontWeight: "bold", cursor: "pointer" },
  customDateInputsFlexRow: { display: "flex", gap: "6px", marginTop: "8px" },
  datePickerInputField: { flex: 1, border: "1px solid #e2e8f0", padding: "6px", borderRadius: "8px", fontSize: "11px" },

  sectionHeadingRowFlex: { display: "flex", alignItems: "center", gap: "6px", marginBottom: "10px" },
  sectionTitleBlockHeader: { margin: 0, fontSize: "14px", fontWeight: "700" },
  levelHorizontalFlexTrack: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(70px, 1fr))", gap: "8px", marginBottom: "16px" },
  levelHorizontalItemBox: { background: "#fff", border: "1px solid #e2e8f0", borderRadius: "10px", padding: "8px", textAlign: "center" },
  levelLabelNumberTitle: { margin: 0, fontSize: "13px", fontWeight: "800", color: "#475569" },
  levelUserCountValueText: { margin: "2px 0 0 0", fontSize: "11px", color: "#64748b" },

  summaryListItemsFlexColumn: { display: "flex", flexDirection: "column", gap: "8px" },
  summaryTableRowLine: { display: "flex", justifyContent: "space-between", fontSize: "12px" },
  summaryRowLabelCell: { color: "#475569" },
  summaryRowValueCellBlue: { fontWeight: "700", color: "#2563eb" },
  summaryRowValueCellDark: { fontWeight: "600", color: "#0f172a" },
  levelIncomeDenseBlockGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px" },
  levelMiniBlockGridItem: { background: "#f8fafc", padding: "6px 8px", borderRadius: "8px", border: "1px solid #f1f5f9" },
  miniBlockLabelText: { fontSize: "10px", color: "#64748b" },
  miniBlockValueAmountText: { margin: 0, fontSize: "12px", fontWeight: "700" },

  tableWrap: { overflowX: "auto" },
  table: { width: "100%", borderCollapse: "collapse", textAlign: "left" },
  tableHeaderStyleRow: { background: "#f8fafc" },
  tableHeadCellText: { padding: "8px 10px", fontSize: "11px", fontWeight: "700", color: "#475569" },
  tableBodyRowItem: { borderBottom: "1px solid #f1f5f9" },
  tableDataCellText: { padding: "8px 10px", fontSize: "12px", color: "#0f172a" },
  tableLevelBadgeTag: { background: "#f1f5f9", padding: "2px 6px", borderRadius: "6px", fontSize: "10px", fontWeight: "bold" },

  // 🟢 টেবিলের ভিতরের অবতোরের জন্য অবজেক্ট ফিট সিএসএস
  tableAvatarIconRoundPhoto: {
    width: "32px",
    height: "32px",
    borderRadius: "50%",
    objectFit: "cover",
    aspectRatio: "1/1",
    flexShrink: 0
  },
  tableInitialPlaceholderBadgeCircle: {
    width: "32px",
    height: "32px",
    borderRadius: "50%",
    background: "#e0e7ff",
    color: "#4338ca",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: "bold",
    fontSize: "12px",
    flexShrink: 0
  },

  referSuccessCalloutAlertBanner: { background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: "12px", padding: "10px 14px", display: "flex", alignItems: "center", gap: "8px", marginBottom: "16px" },
  alertSuccessCheckIcon: { width: "18px", height: "18px", borderRadius: "50%", background: "#16a34a", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "10px", fontWeight: "bold" },
  alertSuccessBannerInlineMessageText: { margin: 0, fontSize: "12px", fontWeight: "600", color: "#15803d" },
  
  referOrangeBannerCardContainer: { flex: 1, minWidth: "200px", background: "linear-gradient(135deg, #ffedd5 0%, #fed7aa 100%)", borderRadius: "16px", padding: "16px", position: "relative" },
  orangeBannerSubTitleLabel: { margin: 0, fontSize: "12px", color: "#c2410c" },
  orangeBannerBigAmountDisplay: { margin: "2px 0 0 0", fontSize: "26px", fontWeight: "800", color: "#7c2d12" },
  orangeBannerGraphicAssetIllustration: { position: "absolute", right: "10%", bottom: "-10px", fontSize: "50px", opacity: 0.1 },
  referPendingActionFlexCenterBlock: { flex: 1, minWidth: "200px", background: "#fff7ed", borderRadius: "16px", padding: "12px", display: "flex", alignItems: "center" },
  referOrangePendingArrowActionBtn: { width: "100%", padding: "10px", background: "#ea580c", color: "#fff", border: "none", borderRadius: "10px", fontSize: "12px", fontWeight: "bold", cursor: "pointer", display: "flex", alignItems: "center" },

  verticalMetricsFlexListColumn: { display: "flex", flexDirection: "column" },
  metricListingInlineRow: { display: "flex", justifyContent: "space-between", alignItems: "center", paddingBottom: "8px", borderBottom: "1px solid #f1f5f9", marginBottom: "8px" },
  metricIconCircleOrange: { width: "24px", height: "24px", borderRadius: "50%", background: "#fff7ed", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: "12px" },
  metricIconCircleGreen: { width: "24px", height: "24px", borderRadius: "50%", background: "#f0fdf4", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: "12px" },
  metricIconCircleBlue: { width: "24px", height: "24px", borderRadius: "50%", background: "#eff6ff", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: "12px" },
  metricIconCirclePurp: { width: "24px", height: "24px", borderRadius: "50%", background: "#faf5ff", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: "12px" },
  metricLabelNameText: { fontSize: "12px", color: "#475569" },
  metricBoldValueNumberText: { fontSize: "13px", fontWeight: "700" },

  tripleSquareBadgesFlexRowTrack: { display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "8px" },
  squareStatusBadgeMetricsItemBox: { background: "#fff", border: "1px solid #e2e8f0", borderRadius: "12px", padding: "8px", textAlign: "center" },
  squareIconTrackBlue: { width: "24px", height: "24px", borderRadius: "50%", background: "#eff6ff", color: "#2563eb", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 4px", fontSize: "12px" },
  squareIconTrackGreen: { width: "24px", height: "24px", borderRadius: "50%", background: "#f0fdf4", color: "#16a34a", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 4px", fontSize: "12px" },
  squareIconTrackRed: { width: "24px", height: "24px", borderRadius: "50%", background: "#fef2f2", color: "#dc2626", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 4px", fontSize: "12px" },
  squareBadgeLabelCaption: { margin: 0, fontSize: "10px", color: "#64748b" },
  squareBadgeValueNumberHeading: { margin: "2px 0 0 0", fontSize: "14px", fontWeight: "800", color: "#0f172a" },
  referModalFooterCloseButton: { width: "100%", padding: "12px", background: "#ffedd5", color: "#c2410c", border: "none", borderRadius: "12px", fontSize: "14px", fontWeight: "bold", cursor: "pointer" },

  loadingPage: { display: "flex", height: "100vh", justifyContent: "center", alignItems: "center", background: "#f8fafc" },
  loadingBox: { textAlign: "center" },
  loadingIcon: { fontSize: "40px" },

  statusOverlayBg: { position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", backdropFilter: "blur(4px)", zIndex: 100005, display: "flex", alignItems: "center", justifyContent: "center" },
  statusOverlayCard: { background: "#fff", padding: "20px 30px", borderRadius: "16px", textAlign: "center", boxShadow: "0 10px 30px rgba(0,0,0,0.2)" },
  statusOverlayIcon: { width: "48px", height: "48px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 10px", fontSize: "20px", fontWeight: "bold" },
  statusOverlayText: { margin: 0, fontSize: "15px", fontWeight: "700", color: "#1e293b" },

  infoBox: { background: "#fff7ed", border: "1px solid #ffedd5", color: "#c2410c", padding: "10px", borderRadius: "10px", fontSize: "12px", marginTop: "10px" },
  closeBtn: { width: "100%", padding: "10px", background: "#f1f5f9", border: "none", borderRadius: "10px", fontWeight: "bold", color: "#475569", cursor: "pointer", marginTop: "15px" }
};
