import { useEffect, useMemo, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { API } from "../config";

export default function Home() {
  const navigate = useNavigate();
  const location = useLocation();

  const email = localStorage.getItem("email") || "";
  const token = localStorage.getItem("token") || "";
  const localName = localStorage.getItem("name") || "User";

  const [user, setUser] = useState({});
  const [notificationCount, setNotificationCount] = useState(0);
  const [loading, setLoading] = useState(true);

  // 👇 ড্রয়ার ওপেন/ক্লোজ স্টেট ও ডাউনলোডিং অ্যানিমেশন স্টেট
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isDownloadingPlan, setIsDownloadingPlan] = useState(false);

  // 👇 পপআপ মোডালের স্টেট (OneTime.js এর মতো অন রাখা হয়েছে)
  const [showOfferPopup, setShowOfferPopup] = useState(true);

  const [statusOverlay, setStatusOverlay] = useState({
    show: false,
    type: "info",
    message: ""
  });

  const triggerStatusOverlay = (type, message) => {
    setStatusOverlay({ show: true, type, message });
    setTimeout(() => {
      setStatusOverlay({ show: false, type: "info", message: "" }); 
    }, 2500);
  };

  // 👇 ব্রাউজার পুশ নোটিফিকেশন সাবস্ক্রাইব করার ফাংশন
  const registerPushNotification = async () => {
    if (!("serviceWorker" in navigator) && !("PushManager" in window)) {
      console.log("Push notifications not supported by this browser.");
      return;
    }
    
    try {
      const registration = await navigator.serviceWorker.ready;
      
      const permissionResult = await Notification.requestPermission();
      if (permissionResult !== "granted") {
        console.log("Notification permission not granted.");
        return;
      }

      const keyRes = await fetch(`${API}/get-vapid-key`);
      const keyData = await keyRes.json();
      const publicVapidKey = keyData.publicKey;

      if (!publicVapidKey) {
        console.log("VAPID public key not found from server.");
        return;
      }

      const convertedVapidKey = urlBase64ToUint8Array(publicVapidKey);

      let subscription = await registration.pushManager.getSubscription();
      if (!subscription) {
        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: convertedVapidKey
        });
      }

      const currentEmail = localStorage.getItem("email");
      if (!currentEmail) return;

      const subscriptionData = JSON.parse(JSON.stringify(subscription));

      const subRes = await fetch(`${API}/save-push-subscription`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          authorization: token
        },
        body: JSON.stringify({ email: currentEmail, subscription: subscriptionData })
      });

      const subData = await subRes.json();
      if (subRes.ok) {
        console.log("Push Notification Subscribed Successfully!", subData);
      } else {
        console.error("Failed to save push subscription on server:", subData);
      }
    } catch (error) {
      console.error("Push subscription error:", error);
    }
  };

  function urlBase64ToUint8Array(base64String) {
    const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/\-/g, "+").replace(/_/g, "/");
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }

  // 👇 PLAN PDF ডাউনলোডের জন্য হ্যান্ডলার
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

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
  }, []);

  useEffect(() => {
    loadHome();
    loadNotifications();
    registerPushNotification();

    const flag = localStorage.getItem("showLoginPopup");
    if (flag === "true") {
      setShowOfferPopup(true);
      localStorage.removeItem("showLoginPopup");
    }
  }, []);

  const loadHome = async () => {
    try {
      setLoading(true);

      const res = await fetch(`${API}/dashboard`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          authorization: token
        },
        body: JSON.stringify({ email })
      });

      const data = await res.json();

      if (data?.msg === "Token expired or invalid") {
        triggerStatusOverlay("error", "You are logout please login again");

        setTimeout(() => {
          localStorage.clear();
          navigate("/login");
          window.location.reload();
        }, 2500);
        return;
      }

      setUser(data || {});

    } catch (err) {
      console.log("HOME LOAD ERROR:", err);
    } finally {
      setLoading(false);
    }
  };

  const loadNotifications = async () => {
    try {
      const res = await fetch(`${API}/get-notifications`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          authorization: token
        },
        body: JSON.stringify({ email })
      });

      const data = await res.json();

      if (Array.isArray(data)) {
        const unread = data.filter((n) => !n.read).length;
        setNotificationCount(unread);
      }
    } catch (err) {
      console.log("Notification count error:", err);
    }
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

  const fileUrl = (file) => {
    if (!file) return "";
    if (file.startsWith("http")) return file;
    return `${API}/uploads/${file}`;
  };

  const name = user?.name || localName || "User";

  const profilePhoto = useMemo(() => {
    return fileUrl(
      user?.photo ||
      user?.profilePhoto ||
      user?.selfiePhoto ||
      ""
    );
  }, [user]);

  const go = (path) => {
    navigate(path);
  };

  if (loading) {
    return (
      <div style={styles.loadingPage}>
        <div style={styles.loadingCard}>
          <img 
            src={process.env.PUBLIC_URL ? `${process.env.PUBLIC_URL}/logo512.png` : "/logo512.png"} 
            alt="Logo" 
            style={styles.loadingLogoImg} 
            onError={(e) => {
              e.target.style.display = 'none';
            }}
          />
          <h2 style={{ marginTop: "15px", fontSize: "20px", fontWeight: "800" }}>Save Money</h2>
          <p style={{ color: "#94a3b8", fontSize: "14px" }}>Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.page}>

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
                  onError={(e) => {
                    e.target.style.display = 'none';
                  }}
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

      <div style={styles.container}>
        {/* Status Overlay */}
        {statusOverlay.show && (
          <div style={{
            ...styles.toast,
            background: statusOverlay.type === "error" ? "#ef4444" : "#16a34a"
          }}>
            {statusOverlay.message}
          </div>
        )}

        {/* 📢 TOP HIGHLIGHTED NOTICE BANNER (OneTime পেজের মতো স্লাইডিং মেসেজ) */}
        <div style={styles.topNoticeBanner}>
          <marquee behavior="scroll" direction="left" scrollamount="6" style={styles.marqueeText}>
            <span style={styles.noticeBadge}>NOTICE 📢</span>
            Our platform had been experiencing issues for two days, but the server is running now. Thank you everyone for staying with us.
          </marquee>
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
                Welcome Back, {name}! 👏
              </h1>
              <p style={styles.welcomeSub}>Invest smartly & secure your future</p>
            </div>
          </div>

          <div style={styles.headerRight}>
            <div style={styles.notifBtn} onClick={() => go("/notifications")}>
              🔔
              {notificationCount > 0 && (
                <span style={styles.notifBadge}>{notificationCount}</span>
              )}
            </div>

            <div style={styles.profileCircle} onClick={() => go("/kyc")}>
              {profilePhoto ? (
                <img src={profilePhoto} alt="User Profile" style={styles.profileImg} />
              ) : (
                <div style={styles.profileAvatarPlaceholder}>
                  <span style={{ fontSize: "16px", color: "#fff", fontWeight: "bold" }}>
                    {name.charAt(0).toUpperCase()}
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
              <span style={{ fontSize: "17px", fontWeight: "700", color: "#f1f5f9" }}>har mahine ka plan, hamesha</span>
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
              onError={(e) => {
                e.target.style.display = 'none';
              }}
            />
          </div>
        </div>

        {/* 4 STAT CARDS GRID */}
        <section style={styles.statsGridContainer}>
          <div style={styles.darkStatCard}>
            <div style={styles.statCardHeader}>
              <div style={{ ...styles.iconBox, background: "rgba(34, 197, 94, 0.15)" }}>
                <span style={{ color: "#22c55e", fontSize: "18px" }}>💼</span>
              </div>
              <span style={styles.statCardTitle}>Total Investment</span>
            </div>
            <strong style={styles.statCardValue}>
              ₹ {Number(user?.totalInvestment || 0).toLocaleString("en-IN")}
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
              ₹ {Number(user?.totalReturn || 0).toLocaleString("en-IN")}
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
              ₹ {Number(user?.totalWithdraw || 0).toLocaleString("en-IN")}
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
              ₹ {Number(user?.wallet || 0).toLocaleString("en-IN")}
            </strong>
          </div>
        </section>

        {/* QUICK ACTION BUTTONS */}
        <section style={styles.actionGridTriple}>
          <button style={styles.addInvestBtnDark} onClick={() => go("/wallet")}>
            + Add Fund
          </button>
          <button style={styles.startInvestBtnDark} onClick={() => go("/save-money")}>
            💰 Save Money
          </button>
          <button style={styles.withdrawBtnDark} onClick={() => go("/withdraw")}>
            ➔ Withdraw
          </button>
        </section>

        {/* WHY WE RAISE FUNDS */}
        <section style={styles.darkMainCard}>
          <h2 style={{ ...styles.darkCardTitle, color: "#22c55e", display: "flex", alignItems: "center", gap: "8px" }}>
            <span>💡</span> Why We Accept Investments & How Your Funds Work
          </h2>
          <p style={{ fontSize: "15px", color: "#cbd5e1", lineHeight: "1.6", marginTop: "-6px", marginBottom: "18px" }}>
            To generate stable, high-yield returns for our investors, we deploy capital into diversified, risk-managed financial channels:
          </p>
          <div style={styles.whyInvestGrid}>
            <div style={styles.whyInvestCard}>
              <div style={{ fontSize: "30px", marginBottom: "8px" }}>🏦</div>
              <strong style={{ color: "#ffffff", fontSize: "16px", display: "block", marginBottom: "6px" }}>
                Loan & Credit Services
              </strong>
              <p style={{ color: "#94a3b8", fontSize: "13px", margin: 0, lineHeight: "1.5" }}>
                We raise funds to provide secured & quick loan solutions including <strong>Personal Loans</strong>, <strong>Salary Advance Loans</strong>, and <strong>Home Loans</strong>.
              </p>
            </div>

            <div style={styles.whyInvestCard}>
              <div style={{ fontSize: "30px", marginBottom: "8px" }}>📊</div>
              <strong style={{ color: "#ffffff", fontSize: "16px", display: "block", marginBottom: "6px" }}>
                Strategic Market Investments
              </strong>
              <p style={{ color: "#94a3b8", fontSize: "13px", margin: 0, lineHeight: "1.5" }}>
                We re-invest capital into high-growth financial instruments such as <strong>Stocks</strong>, <strong>Systematic Investment Plans (SIPs)</strong>, and top-performing <strong>Mutual Funds</strong>.
              </p>
            </div>
          </div>
        </section>

        {/* TRUST BANNER */}
        <section style={styles.trustBannerDark}>
          <div style={styles.trustLeftContent}>
            <h3 style={{ margin: "0 0 8px 0", fontSize: "20px", color: "#ffffff", fontWeight: "800" }}>
              Invest Small, <br />
              <span style={{ color: "#4ade80" }}>Earn Big Returns Together</span>
            </h3>
            <p style={{ margin: "0 0 14px 0", opacity: 0.9, fontSize: "14px", color: "#cbd5e1" }}>
              Start investing today and secure your future.
            </p>
            <div style={styles.trustIllustrations}>
              <img 
                src="/small invest.png" 
                alt="Small Invest" 
                style={styles.trustImg}
                onError={(e) => { e.target.style.display = 'none'; }}
              />
            </div>
          </div>

          <div style={styles.trustRightList}>
            <div style={styles.trustItem}>
              <span style={styles.trustIcon}>🛡</span>
              <div>
                <strong style={styles.trustTitle}>100% Secure</strong>
                <span style={styles.trustSub}>Safe & Trusted Platform</span>
              </div>
            </div>

            <div style={styles.trustItem}>
              <span style={styles.trustIcon}>📈</span>
              <div>
                <strong style={styles.trustTitle}>High Returns</strong>
                <span style={styles.trustSub}>Better returns on your investments</span>
              </div>
            </div>

            <div style={styles.trustItem}>
              <span style={styles.trustIcon}>🕒</span>
              <div>
                <strong style={styles.trustTitle}>Smart & Simple</strong>
                <span style={styles.trustSub}>Easy invest, easy grow</span>
              </div>
            </div>
          </div>
        </section>

        {/* FOOTER FEATURES GRID */}
        <div style={styles.footerFeaturesGrid}>
          <div style={styles.featureBoxDark}>
            <span style={{ fontSize: "26px" }}>📈</span>
            <div>
              <strong style={{ fontSize: "15px", color: "#fff", display: "block" }}>High Returns</strong>
              <span style={{ fontSize: "13px", color: "#94a3b8" }}>Better returns on your investments</span>
            </div>
          </div>

          <div style={styles.featureBoxDark}>
            <span style={{ fontSize: "26px" }}>🎧</span>
            <div>
              <strong style={{ fontSize: "15px", color: "#fff", display: "block" }}>24/7 Support</strong>
              <span style={{ fontSize: "13px", color: "#94a3b8" }}>We are here to help you</span>
            </div>
          </div>

          <div style={styles.featureBoxDark}>
            <span style={{ fontSize: "26px" }}>👥</span>
            <div>
              <strong style={{ fontSize: "15px", color: "#fff", display: "block" }}>Trusted Platform</strong>
              <span style={{ fontSize: "13px", color: "#94a3b8" }}>Thousands of users trust us</span>
            </div>
          </div>
        </div>

        {/* FOOTER BRAND BAR */}
        <footer style={styles.footerBar}>
          <p style={styles.footerTagline}>
            Chhote nivesh, badi kamai ka sapna, ab hoga sach! <strong style={{ color: "#22c55e" }}>SAVE MONEY</strong> ke saath! 💚
          </p>
          <div style={styles.footerCopyRow}>
            <span>© 2026 SAVE MONEY. All Rights Reserved.</span>
            <span>Made with ❤️ for your better future</span>
          </div>
        </footer>
      </div>

      {/* 🎁 WELCOME POPUP MODAL (OneTime.js এর মতো পপআপ স্ট্রাকচার ও আপডেট করা নোটিশ) */}
      {showOfferPopup && (
        <div style={styles.modalOverlay}>
          <div style={styles.offerPopupCard}>
            <button style={styles.offerCloseBtn} onClick={() => setShowOfferPopup(false)}>✕</button>
            
            <div style={styles.offerHeaderBadge}>
              📢 SERVER NOTICE
            </div>

            <div style={styles.offerIconWrapper}>
              🚀
            </div>

            <h2 style={styles.offerTitle}>
              Server Restored & <span style={{ color: "#22c55e" }}>Live Now!</span>
            </h2>

            <p style={styles.offerDescription}>
              Our platform had been experiencing issues for two days, but the server is running now. Thank you everyone for staying with us.
            </p>

            <div style={styles.offerActionGroup}>
              <button 
                style={styles.offerReferBtn} 
                onClick={() => setShowOfferPopup(false)}
              >
                Continue to Dashboard
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

// ----------------- STYLES -----------------
const styles = {
  page: {
    minHeight: "100vh",
    width: "100%",
    background: "#030a16",
    padding: "20px 16px",
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
    color: "#f8fafc",
    boxSizing: "border-box",
    display: "flex",
    justifyContent: "center"
  },
  container: {
    width: "100%",
    maxWidth: "1000px",
    display: "flex",
    flexDirection: "column",
    gap: "22px"
  },
  loadingPage: {
    minHeight: "100vh",
    background: "#030a16",
    display: "flex",
    alignItems: "center",
    justifyContent: "center"
  },
  loadingCard: {
    textAlign: "center",
    color: "#fff"
  },
  loadingLogoImg: {
    width: "60px",
    height: "60px",
    objectFit: "contain"
  },
  toast: {
    position: "fixed",
    top: "20px",
    right: "20px",
    color: "white",
    padding: "14px 22px",
    borderRadius: "10px",
    boxShadow: "0 10px 25px rgba(0,0,0,0.6)",
    zIndex: 99999,
    fontWeight: "bold",
    fontSize: "15px"
  },

  // TOP NOTICE BANNER STYLES
  topNoticeBanner: {
    background: "linear-gradient(90deg, #052e16 0%, #064e3b 50%, #022c22 100%)",
    border: "1px solid #22c55e",
    borderRadius: "12px",
    padding: "10px 14px",
    overflow: "hidden",
    whiteSpace: "nowrap",
    boxShadow: "0 4px 15px rgba(34, 197, 94, 0.2)"
  },
  marqueeText: {
    fontSize: "16px",
    fontWeight: "700",
    color: "#e2e8f0",
    display: "flex",
    alignItems: "center"
  },
  noticeBadge: {
    background: "#f59e0b",
    color: "#000",
    fontWeight: "900",
    fontSize: "12px",
    padding: "4px 10px",
    borderRadius: "6px",
    letterSpacing: "0.5px",
    marginRight: "12px",
    display: "inline-block"
  },

  // HEADER
  header: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "8px 0"
  },
  headerLeft: {
    display: "flex",
    alignItems: "center",
    gap: "14px"
  },
  menuButton: {
    background: "transparent",
    border: "none",
    color: "white",
    fontSize: "30px",
    cursor: "pointer",
    padding: "0"
  },
  welcomeTitle: {
    margin: 0,
    fontSize: "22px",
    fontWeight: "800",
    color: "#ffffff"
  },
  welcomeSub: {
    margin: "4px 0 0 0",
    fontSize: "14px",
    color: "#94a3b8"
  },
  headerRight: {
    display: "flex",
    alignItems: "center",
    gap: "12px"
  },
  notifBtn: {
    fontSize: "22px",
    cursor: "pointer",
    position: "relative",
    background: "#0c1f38",
    padding: "8px",
    borderRadius: "50%",
    border: "1px solid rgba(255,255,255,0.1)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center"
  },
  notifBadge: {
    position: "absolute",
    top: "-2px",
    right: "-2px",
    background: "#ef4444",
    color: "#fff",
    fontSize: "10px",
    fontWeight: "bold",
    borderRadius: "50%",
    padding: "2px 6px"
  },
  profileCircle: {
    width: "48px",
    height: "48px",
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
    borderRadius: "50%",
    background: "#10b981",
    display: "flex",
    alignItems: "center",
    justifyContent: "center"
  },

  // HERO BANNER
  topHeroBanner: {
    background: "linear-gradient(135deg, #062319 0%, #06182e 100%)",
    borderRadius: "16px",
    padding: "24px 28px",
    border: "1px solid rgba(34, 197, 94, 0.3)",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    position: "relative",
    overflow: "hidden",
    minHeight: "150px",
    gap: "20px"
  },
  heroTextContent: {
    flex: 1,
    zIndex: 2
  },
  heroTitle: {
    margin: 0,
    fontSize: "24px",
    fontWeight: "800",
    color: "#ffffff",
    lineHeight: "1.4"
  },
  heroDesc: {
    margin: "12px 0 0 0",
    fontSize: "15px",
    color: "#cbd5e1"
  },
  heroImgWrapper: {
    width: "200px",
    height: "130px",
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

  // STAT CARDS
  statsGridContainer: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
    gap: "14px"
  },
  darkStatCard: {
    background: "#081628",
    borderRadius: "14px",
    padding: "16px 18px",
    border: "1px solid rgba(255, 255, 255, 0.12)",
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
    position: "relative",
    overflow: "hidden",
    minHeight: "95px"
  },
  statCardHeader: {
    display: "flex",
    alignItems: "center",
    gap: "10px"
  },
  iconBox: {
    width: "32px",
    height: "32px",
    borderRadius: "8px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center"
  },
  statCardTitle: {
    fontSize: "15px",
    color: "#cbd5e1",
    fontWeight: "600"
  },
  statCardValue: {
    fontSize: "24px",
    fontWeight: "900",
    color: "#ffffff",
    marginTop: "10px"
  },

  // ACTION BUTTONS
  actionGridTriple: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
    gap: "14px"
  },
  startInvestBtnDark: {
    height: "52px",
    borderRadius: "10px",
    border: "none",
    background: "#86efac",
    color: "#052e16",
    fontSize: "16px",
    fontWeight: "bold",
    cursor: "pointer"
  },
  addInvestBtnDark: {
    height: "52px",
    borderRadius: "10px",
    border: "none",
    background: "#2563eb",
    color: "white",
    fontSize: "16px",
    fontWeight: "bold",
    cursor: "pointer"
  },
  withdrawBtnDark: {
    height: "52px",
    borderRadius: "10px",
    background: "#0f172a",
    border: "1.5px solid #334155",
    color: "white",
    fontSize: "16px",
    fontWeight: "bold",
    cursor: "pointer"
  },

  // MAIN CARD
  darkMainCard: {
    background: "#081628",
    borderRadius: "16px",
    padding: "24px",
    border: "1px solid rgba(255, 255, 255, 0.1)"
  },
  darkCardTitle: {
    margin: "0 0 20px 0",
    fontSize: "20px",
    fontWeight: "800",
    color: "#ffffff"
  },
  whyInvestGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
    gap: "16px"
  },
  whyInvestCard: {
    background: "#040d1a",
    borderRadius: "12px",
    padding: "18px",
    border: "1px solid rgba(255, 255, 255, 0.1)"
  },

  // TRUST BANNER
  trustBannerDark: {
    background: "linear-gradient(135deg, #051a13 0%, #081728 100%)",
    borderRadius: "16px",
    padding: "24px 28px",
    border: "1px solid rgba(34, 197, 94, 0.3)",
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
    gap: "22px",
    alignItems: "center"
  },
  trustLeftContent: {
    display: "flex",
    flexDirection: "column"
  },
  trustIllustrations: {
    width: "100%",
    height: "130px",
    marginTop: "10px"
  },
  trustImg: {
    maxHeight: "100%",
    maxWidth: "100%",
    objectFit: "contain"
  },
  trustRightList: {
    display: "flex",
    flexDirection: "column",
    gap: "16px"
  },
  trustItem: {
    display: "flex",
    alignItems: "center",
    gap: "14px"
  },
  trustIcon: {
    fontSize: "24px",
    color: "#22c55e"
  },
  trustTitle: {
    fontSize: "15px",
    color: "#ffffff",
    display: "block",
    fontWeight: "700"
  },
  trustSub: {
    fontSize: "13px",
    color: "#94a3b8"
  },

  // FOOTER FEATURES GRID
  footerFeaturesGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
    gap: "14px"
  },
  featureBoxDark: {
    background: "#081628",
    borderRadius: "12px",
    padding: "16px",
    border: "1px solid rgba(255, 255, 255, 0.1)",
    display: "flex",
    alignItems: "center",
    gap: "14px"
  },

  // FOOTER BAR
  footerBar: {
    textAlign: "center",
    padding: "20px 0",
    borderTop: "1px solid rgba(255, 255, 255, 0.1)",
    marginTop: "12px"
  },
  footerTagline: {
    fontSize: "15px",
    color: "#cbd5e1",
    margin: "0 0 10px 0"
  },
  footerCopyRow: {
    display: "flex",
    justifyContent: "space-between",
    fontSize: "13px",
    color: "#64748b"
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
    width: "260px",
    height: "100vh",
    padding: "16px 14px",
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
    marginBottom: "12px",
    paddingBottom: "12px",
    borderBottom: "1px solid rgba(255, 255, 255, 0.1)",
    flexShrink: 0
  },
  drawerBrand: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "8px"
  },
  drawerLogoWrapper: {
    width: "52px",
    height: "52px",
    borderRadius: "50%",
    background: "radial-gradient(circle, #03251a 0%, #064e3b 100%)",
    border: "2px solid #22c55e",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    boxShadow: "0 0 12px rgba(34, 197, 94, 0.35)"
  },
  drawerLogoImg: {
    width: "32px",
    height: "32px",
    objectFit: "contain"
  },
  drawerLogoText: {
    margin: 0,
    fontSize: "18px",
    fontWeight: "900",
    color: "#ffffff",
    letterSpacing: "0.8px",
    textAlign: "center"
  },
  drawerLogoSubtext: {
    fontSize: "12px",
    color: "#a7f3d0",
    fontWeight: "600",
    marginTop: "2px",
    textAlign: "center"
  },
  drawerNavList: {
    display: "flex",
    flexDirection: "column",
    gap: "10px",
    flexShrink: 0,
    overflowY: "auto",
    maxHeight: "calc(100vh - 220px)"
  },
  drawerNavItem: {
    display: "flex",
    alignItems: "center",
    gap: "14px",
    padding: "12px 18px",
    background: "rgba(255, 255, 255, 0.12)",
    backdropFilter: "blur(10px)",
    WebkitBackdropFilter: "blur(10px)",
    border: "1px solid rgba(255, 255, 255, 0.25)",
    clipPath: "polygon(12px 0%, calc(100% - 12px) 0%, 100% 50%, calc(100% - 12px) 100%, 12px 100%, 0% 50%)",
    color: "#ffffff",
    fontSize: "15px",
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
    fontSize: "22px",
    width: "26px",
    display: "inline-block",
    textAlign: "center"
  },
  drawerNavText: {
    flex: 1,
    fontSize: "15px",
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
    marginTop: "14px",
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
    height: "70%",
    objectFit: "95%",
    borderRadius: "16px"
  },

  // MODAL OVERLAY STYLES
  modalOverlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(0, 0, 0, 0.8)",
    backdropFilter: "blur(6px)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 99999,
    padding: "16px"
  },

  // WELCOME OFFER POPUP STYLES (OneTime.js এর স্টাইল অনুসরণ করা হয়েছে)
  offerPopupCard: {
    background: "linear-gradient(145deg, #091a2e 0%, #031120 100%)",
    borderRadius: "24px",
    padding: "32px 24px 24px 24px",
    width: "100%",
    maxWidth: "400px",
    border: "2px solid #22c55e",
    boxShadow: "0 0 35px rgba(34, 197, 94, 0.3)",
    textAlign: "center",
    position: "relative"
  },
  offerCloseBtn: {
    position: "absolute",
    top: "14px",
    right: "14px",
    border: "none",
    background: "rgba(255,255,255,0.1)",
    color: "#fff",
    borderRadius: "50%",
    width: "32px",
    height: "32px",
    cursor: "pointer",
    fontSize: "14px"
  },
  offerHeaderBadge: {
    display: "inline-block",
    background: "rgba(34, 197, 94, 0.15)",
    color: "#4ade80",
    border: "1px solid rgba(34, 197, 94, 0.3)",
    padding: "6px 14px",
    borderRadius: "20px",
    fontSize: "12px",
    fontWeight: "bold",
    letterSpacing: "0.5px",
    marginBottom: "16px"
  },
  offerIconWrapper: {
    fontSize: "48px",
    marginBottom: "12px"
  },
  offerTitle: {
    margin: "0 0 10px 0",
    fontSize: "20px",
    fontWeight: "800",
    color: "#ffffff",
    lineHeight: "1.3"
  },
  offerDescription: {
    fontSize: "15px",
    color: "#cbd5e1",
    margin: "0 0 20px 0",
    lineHeight: "1.5"
  },
  offerActionGroup: {
    display: "flex",
    flexDirection: "column",
    gap: "10px"
  },
  offerReferBtn: {
    width: "100%",
    height: "48px",
    borderRadius: "12px",
    border: "none",
    background: "linear-gradient(135deg, #22c55e 0%, #16a34a 100%)",
    color: "#ffffff",
    fontSize: "16px",
    fontWeight: "800",
    cursor: "pointer",
    boxShadow: "0 4px 15px rgba(34, 197, 94, 0.4)"
  }
};
