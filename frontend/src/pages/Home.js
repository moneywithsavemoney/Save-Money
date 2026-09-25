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
  const [latestUpdate, setLatestUpdate] = useState("No new announcement");
  const [latestUpdateText, setLatestUpdateText] = useState("");
  const [loading, setLoading] = useState(true);

  // 👇 ড্রয়ার ওপেন/ক্লোজ স্টেট ও ডাউনলোডিং অ্যানিমেশন স্টেট
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isDownloadingPlan, setIsDownloadingPlan] = useState(false);

  // 👇 পপআপ মোডালের স্টেট
  const [showOfferPopup, setShowOfferPopup] = useState(false);

  // 👇 স্বাইপ হ্যান্ডলার স্টেট
  const [touchStartX, setTouchStartX] = useState(0);
  const [touchStartY, setTouchStartY] = useState(0);

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

  const registerPushNotification = async () => {
    if (!("serviceWorker" in navigator) && !("PushManager" in window)) {
      return;
    }
    
    try {
      const registration = await navigator.serviceWorker.ready;
      
      const permissionResult = await Notification.requestPermission();
      if (permissionResult !== "granted") return;

      const keyRes = await fetch(`${API}/get-vapid-key`);
      const keyData = await keyRes.json();
      const publicVapidKey = keyData.publicKey;

      if (!publicVapidKey) return;

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

      await fetch(`${API}/save-push-subscription`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          authorization: token
        },
        body: JSON.stringify({ email: currentEmail, subscription: subscriptionData })
      });
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

const handleDownloadApp = () => {
  // ফাইল পাথ (ফাইলটির নাম স্পেস ছাড়া save-money.apk রাখুন)
  const apkUrl = process.env.PUBLIC_URL 
    ? `${process.env.PUBLIC_URL}/save-money.apk` 
    : "/save-money.apk";
  
  // সরাসরি ডাউনলোডের জন্য উইন্ডো রিডাইরেক্ট ব্যবহার করুন
  window.location.href = apkUrl;
};



  const handleDownloadImage = async (imageUrl) => {
    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "OFFER_BANNAR.png";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      window.open(imageUrl, "_blank");
    }
  };

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
  }, []);

  useEffect(() => {
    loadHome();
    loadNotifications();
    loadLatestUpdate();
    registerPushNotification();

    const interval = setInterval(() => {
      loadLatestUpdate();
    }, 10000);

    const flag = localStorage.getItem("showLoginPopup");
    if (flag === "true") {
      setShowOfferPopup(true);
      localStorage.removeItem("showLoginPopup");
    }

    return () => clearInterval(interval);
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
      
      if (data?.latestUpdate || data?.announcement) {
        setLatestUpdate(data.latestUpdate || data.announcement);
      }

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

  const loadLatestUpdate = async () => {
    try {
      const res = await fetch(`${API}/latest-news`, {
        method: "GET",
        headers: {
          "Cache-Control": "no-cache"
        }
      });

      if (!res.ok) return;

      const data = await res.json();
      
      if (data) {
        const msg = data.message || data.latestUpdate || data.announcement || (typeof data === 'string' ? data : "");

        if (msg && msg.trim() !== "") {
          setLatestUpdateText(msg);
          setLatestUpdate(msg);
        }
      }
    } catch (err) {
      console.error("Failed to fetch latest news:", err);
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

  const wallet = Number(user?.wallet || user?.totalWallet || 0);
  const totalInvestment = Number(user?.totalInvestment || 0);
  const totalReturn = Number(user?.totalReturn || 0);
  const totalReferral = Number(user?.totalReferral || user?.referralCount || 0);
  const totalWithdraw = Number(user?.totalWithdraw || 0);

  const kycApproved =
    user?.kycStatus === "approved" ||
    user?.kycStatus === "Approved";

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
            onError={(e) => { e.target.style.display = 'none'; }}
          />
          <h2 style={{ marginTop: "15px", fontSize: "20px", fontWeight: "800" }}>Save Money</h2>
          <p style={{ color: "#94a3b8", fontSize: "14px" }}>Loading your dashboard...</p>
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

      {/* 👇 SIDEBAR DRAWER (চওড়া ও বাটন সাইজ কমানো এবং সুন্দর নিট লেআউট) */}
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

          {/* SIDEBAR CONTENT (WITH SMOOTH SCROLL FOR BUTTONS & TREE) */}
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

      {/* PHOTO POPUP MODAL */}
      {showOfferPopup && (
        <div style={styles.popupOverlay}>
          <div style={styles.popupCard}>
            <button
              style={styles.popupCloseBtn}
              onClick={() => setShowOfferPopup(false)}
            >
              ✕
            </button>

            <img
              src="/INDEPENDENCE OFFER.png"
              alt="INDEPENDENCE OFFER"
              style={styles.popupImage}
            />

            <button
              style={styles.popupDownloadBtn}
              onClick={() => handleDownloadImage("/INDEPENDENCE OFFER.png")}
            >
              📥 Download Offer Image
            </button>
          </div>
        </div>
      )}

      {statusOverlay.show && (
        <div style={styles.statusOverlayBg}>
          <div style={{
            ...styles.statusOverlayCard,
            borderTop: statusOverlay.type === "success" ? "6px solid #22c55e" : statusOverlay.type === "error" ? "6px solid #ef4444" : "6px solid #38bdf8"
          }}>
            <div style={{
              ...styles.statusOverlayIcon,
              background: statusOverlay.type === "success" ? "#dcfce7" : statusOverlay.type === "error" ? "#fee2e2" : "#e0f2fe",
              color: statusOverlay.type === "success" ? "#22c55e" : statusOverlay.type === "error" ? "#ef4444" : "#38bdf8"
            }}>
              {statusOverlay.type === "success" ? "✓" : statusOverlay.type === "error" ? "✕" : "ℹ"}
            </div>
            <h3 style={styles.statusOverlayText}>{statusOverlay.message}</h3>
          </div>
        </div>
      )}

      {/* TOP HEADER */}
      <div style={styles.topHeader}>
        <button 
          style={styles.menuButton}
          onClick={() => setIsDrawerOpen(true)}
        >
          ☰
        </button>

        <h2 style={styles.headerTitle}>
          Welcome, {name}
        </h2>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            style={styles.notificationButton}
            onClick={() => go("/notifications")}
          >
            <span>🔔</span>

            {notificationCount > 0 && (
              <small style={styles.notificationBadge}>
                {notificationCount}
              </small>
            )}
          </button>

          <button
            style={styles.logoutBtn}
            onClick={handleLogout}
          >
            Logout
          </button>
        </div>

      </div>

      {/* HERO PROFILE + WALLET */}
      <section style={styles.heroWrapper}>
        <div style={styles.heroGlow}></div>

        <div style={styles.profilePhotoCircle}>
          {profilePhoto ? (
            <img
              src={profilePhoto}
              alt="User"
              style={styles.profilePhoto}
            />
          ) : (
            <span style={styles.defaultProfileIcon}>👤</span>
          )}
        </div>

        <div style={styles.heroUserInfo}>
          <p style={styles.heroWelcome}>
            Welcome Back 👋
          </p>

          <div style={styles.heroNameRow}>
            <h1 style={styles.heroName}>
              {name}
            </h1>

            {kycApproved && (
              <span style={styles.verifiedBadge}>
                ✔
              </span>
            )}
          </div>

          <p style={styles.heroSubtitle}>
            Save Money, Secure Future 💚
          </p>
        </div>

        <div style={styles.heroWalletCard}>
          <p style={styles.heroWalletLabel}>Total Wallet</p>

          <h2 style={styles.heroWalletValue}>
            Scale: ₹{wallet.toFixed(2)}
          </h2>

          <span style={{ fontSize: "16px" }}>
            👛
          </span>
        </div>
      </section>

      {/* LIMITED OFFER ANNOUNCEMENT BAR (20S SPEED & FULL SCROLL FIX) */}
      <div style={styles.limitedOfferBar}>
        <div style={styles.limitedOfferBadge}>LIMITED OFFER 🔥</div>
        <div style={styles.marqueeContainer}>
          <div style={styles.marqueeText}>
            <span style={styles.announcementText}>
              {latestUpdateText || "Our platform had been experiencing issues for few days, but the server is running now. Thank you everyone for staying with us."}
            </span>
          </div>
        </div>
      </div>

      {/* STATS CARDS */}
      <section style={styles.statsGrid}>
        <DashboardStatCard
          icon="📈"
          title="Total Investment"
          value={`₹${totalInvestment.toFixed(0)}`}
          gradient="blue"
        />

        <DashboardStatCard
          icon="📊"
          title="Total Return"
          value={`₹${totalReturn.toFixed(2)}`}
          gradient="green"
        />

        <DashboardStatCard
          icon="👥"
          title="Total Referral"
          value={totalReferral}
          gradient="purple"
        />

        <DashboardStatCard
          icon="⬇️"
          title="Total Withdraw"
          value={`₹${totalWithdraw.toFixed(2)}`}
          gradient="orange"
        />
      </section>

      {/* MAIN ACTIONS */}
      <PremiumSectionTitle
        title="MAIN ACTIONS"
        color="#38d9ff"
      />

      <section style={styles.actionPanel}>
        <PremiumActionButton
          icon="💰"
          title="INVEST NOW"
          subtitle="Start Investing"
          gradient="invest"
          onClick={() => go("/invest-now")}
        />

        <PremiumActionButton
          icon="📈"
          title="My Investment"
          subtitle="View Details"
          gradient="myInvestment"
          onClick={() => go("/my-investment")}
        />

        <PremiumActionButton
          icon="👛"
          title="Wallet"
          subtitle="Add & Manage"
          gradient="wallet"
          onClick={() => go("/wallet")}
        />

        <PremiumActionButton
          icon="💸"
          title="Withdraw"
          subtitle="Request Payout"
          gradient="withdraw"
          onClick={() => navigate("/withdraw")}
        />

        <PremiumActionButton
          icon="👥"
          title="Refer & Earn"
          subtitle="Invite & Earn"
          gradient="refer"
          onClick={() => go("/refer")}
        />

        <PremiumActionButton
          icon="🧾"
          title="Leaderboard"
          subtitle="Top Referer"
          gradient="transaction"
          onClick={() => go("/leaderboard")}
        />
      </section>

      {/* MORE FEATURES */}
      <PremiumSectionTitle
        title="MORE FEATURES"
        color="#ffd84d"
      />

      <section style={styles.actionPanel}>
        <PremiumActionButton
          icon="✅"
          title="KYC Verification"
          subtitle="Verify Your Account"
          gradient="kyc"
          onClick={() => go("/kyc")}
        />

        <PremiumActionButton
          icon="🎁"
          title="Daily Reward"
          subtitle="Claim Reward"
          gradient="reward"
          onClick={() => go("/daily-reward")}
        />

        <PremiumActionButton
          icon="🏦"
          title="Bank Details"
          subtitle="Manage Bank Info"
          gradient="bank"
          onClick={() => navigate("/bank-details")}
        />

        <PremiumActionButton
          icon="📊"
          title="Investment Assistant"
          subtitle="Need You Help"
          gradient="plan"
          onClick={() => go("/investment-assistant")}
        />

        <PremiumActionButton
          icon="🕸️"
          title="Analytics"
          subtitle="User Analytics"
          gradient="notification"
          onClick={() => go("/analytics")}
        />

        <PremiumActionButton
          icon="🎧"
          title="Support"
          subtitle="Need Help?"
          gradient="support"
          onClick={() => go("/support")}
        />
      </section>

      {/* PURPLE PROMO BANNER */}
      <section style={styles.promoBanner}>
        <div style={styles.promoContent}>
          <h1 style={styles.promoTitle}>
            Grow Your Money
            <br />
            Build Your Future
          </h1>

          <p style={styles.promoSubtitle}>
            Invest Smart, Earn More
          </p>

          <button
            style={styles.promoButton}
            onClick={() => go("/save-money")}
          >
            Invest Now →
          </button>
        </div>

        <div style={styles.promoIcon}>
          💰📈
        </div>
      </section>

      {/* TRUST CARDS */}
      <section style={styles.trustPanel}>
        <TrustMiniCard
          icon="🔒"
          title="100% Secure"
          subtitle="Your money is safe"
        />

        <TrustMiniCard
          icon="⚡"
          title="Fast Payout"
          subtitle="Quick withdrawals"
        />

        <TrustMiniCard
          icon="🛡️"
          title="Trusted Platform"
          subtitle="Trusted by users"
        />

        <TrustMiniCard
          icon="💬"
          title="24/7 Support"
          subtitle="We are here"
        />
      </section>

      {/* ABOUT STRIP */}
      <button
        style={styles.aboutStrip}
        onClick={() => go("/about")}
      >
        🏢 About Save Money
      </button>

      {/* HELP TEXT */}
      <h1 style={styles.helpText}>
        HELP OTHER FOR EARN MORE 💸
      </h1>

      {/* APP DOWNLOAD CARD */}
      <div className="premium-download-card" style={styles.appDownloadCard}>
        <div style={styles.appGlowBackground}></div>
        
        <div style={styles.appTopBadge}>
          <span style={styles.appBadgePulse}></span>
          <span>OFFICIAL MOBILE APP</span>
        </div>

        <div style={styles.appDownloadHeader}>
          <div style={styles.appLogoContainer}>
            <img 
              src={process.env.PUBLIC_URL ? `${process.env.PUBLIC_URL}/logo512.png` : "/logo512.png"} 
              alt="Save Money Logo" 
              style={styles.appLogoImg} 
              onError={(e) => { e.target.style.display = 'none'; }}
            />
            <div style={styles.appOnlineDot}></div>
          </div>
          <div style={styles.appInfoTextCenter}>
            <h3 style={styles.appDownloadTitle}>Save Money App</h3>
            <p style={styles.appDownloadSub}>Fast, Ultra-Secure & Easy to Earn</p>
            <div style={styles.appRatingWrap}>
              <span style={{ color: "#facc15" }}>★ ★ ★ ★ ★</span>
              <span style={styles.appRatingText}>4.9 (10K+ Downloads)</span>
            </div>
          </div>
        </div>

        <div style={styles.appBtnGroup}>
          <button 
            className="premium-app-btn"
            style={styles.appDownloadBtn}
            onClick={handleDownloadApp}
          >
            <svg style={styles.appStoreSvg} viewBox="0 0 24 24">
              <path fill="#4285F4" d="M3.6,1.82C3.24,2.02 3,2.41 3,2.87V21.13C3,21.59 3.24,21.98 3.6,22.18L13.1,12.68L3.6,1.82Z" />
              <path fill="#34A853" d="M16.63,9.15L13.1,12.68L16.63,16.21L20.84,13.82C21.61,13.38 21.61,12.62 20.84,12.18L16.63,9.15Z" />
              <path fill="#EA4335" d="M3.6,1.82L13.1,11.32L16.63,7.79L5.34,1.38C4.78,1.06 4.1,1.22 3.6,1.82Z" />
              <path fill="#FBBC05" d="M3.6,22.18L13.1,12.68L16.63,16.21L5.34,22.62C4.78,22.94 4.1,22.78 3.6,22.18Z" />
            </svg>
            <div style={styles.btnTextWrapper}>
              <span style={styles.btnMiniLabel}>DIRECT APK</span>
              <span style={styles.btnMainLabel}>Download Android App</span>
            </div>
            <svg style={styles.downloadIconSvg} fill="currentColor" viewBox="0 0 24 24">
              <path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"/>
            </svg>
          </button>
        </div>
      </div>

      {/* FOOTER */}
      <footer style={styles.footer}>
        <h2 style={{ fontSize: "18px", fontWeight: "800", margin: "0 0 10px 0" }}>
          Save Money
        </h2>

        <div style={styles.footerLinks}>
          <button style={styles.footerLinkBtn} onClick={() => go("/legal/privacy")}>
            Privacy Policy
          </button>
          <button style={styles.footerLinkBtn} onClick={() => go("/legal/terms")}>
            Terms
          </button>
          <button style={styles.footerLinkBtn} onClick={() => go("/legal/refund")}>
            Refund
          </button>
          <button style={styles.footerLinkBtn} onClick={() => go("/legal/risk")}>
            Risk Disclosure
          </button>
          <button style={styles.footerLinkBtn} onClick={() => go("/legal/aml")}>
            AML & KYC
          </button>
          <button style={styles.footerLinkBtn} onClick={() => go("/legal/disclaimer")}>
            Disclaimer
          </button>
        </div>

        <p style={{ fontSize: "12px", color: "#64748b", margin: 0 }}>
          © 2026 Save Money. All Rights Reserved.
        </p>
      </footer>

      {/* BOTTOM NAVIGATION */}
      <nav style={styles.bottomNav}>
        <BottomNavItem
          icon="🏠"
          title="Home"
          active={location.pathname === "/home"}
          onClick={() => go("/home")}
        />
        <BottomNavItem
          icon="👛"
          title="Wallet"
          active={location.pathname === "/wallet"}
          onClick={() => go("/wallet")}
        />
        <BottomNavItem
          icon="👥"
          title="Refer"
          active={location.pathname === "/refer"}
          onClick={() => go("/refer")}
        />
        <BottomNavItem
          icon="🌲"
          title="tree"
          active={location.pathname === "/profile"}
          onClick={() => go("/referral-tree")}
        />
      </nav>

    </div>
  );
}

function DashboardStatCard({ icon, title, value, gradient }) {
  const gradientStyle = {
    blue: styles.statBlue,
    green: styles.statGreen,
    purple: styles.statPurple,
    orange: styles.statOrange
  };

  return (
    <div style={{ ...styles.statCard, ...gradientStyle[gradient] }}>
      <div style={styles.statIconWrap}>
        <span style={styles.statIcon}>{icon}</span>
      </div>

      <p style={styles.statTitle}>{title}</p>
      <h2 style={styles.statValue}>{value}</h2>
      <div style={styles.statGlow}></div>
    </div>
  );
}

function PremiumActionButton({ icon, title, subtitle, gradient, onClick }) {
  const gradientStyle = {
    invest: styles.actionInvest,
    myInvestment: styles.actionMyInvestment,
    wallet: styles.actionWallet,
    withdraw: styles.actionWithdraw,
    refer: styles.actionRefer,
    transaction: styles.actionTransaction,
    kyc: styles.actionKyc,
    reward: styles.actionReward,
    bank: styles.actionBank,
    plan: styles.actionPlan,
    notification: styles.actionNotification,
    support: styles.actionSupport
  };

  return (
    <button
      style={{
        ...styles.actionButton,
        ...gradientStyle[gradient]
      }}
      onClick={onClick}
    >
      <div style={styles.actionIconCircle}>{icon}</div>
      <div style={styles.actionTextBox}>
        <h3 style={styles.actionTitle}>{title}</h3>
        <p style={styles.actionSubtitle}>{subtitle}</p>
      </div>
      <div style={styles.actionShine}></div>
    </button>
  );
}

function PremiumSectionTitle({ title, color }) {
  return (
    <div style={styles.sectionTitleWrap}>
      <div style={styles.sectionLine}></div>
      <h2 style={{ ...styles.sectionTitleText, color }}>{title}</h2>
      <div style={styles.sectionLine}></div>
    </div>
  );
}

function TrustMiniCard({ icon, title, subtitle }) {
  return (
    <div style={styles.trustMiniCard}>
      <div style={styles.trustIconCircle}>{icon}</div>
      <div style={{ overflow: "hidden" }}>
        <h3 style={styles.trustTitle}>{title}</h3>
        <p style={styles.trustSubtitle}>{subtitle}</p>
      </div>
    </div>
  );
}

function BottomNavItem({ icon, title, active, onClick }) {
  return (
    <button
      style={{
        ...styles.bottomNavItem,
        ...(active ? styles.bottomNavItemActive : {})
      }}
      onClick={onClick}
    >
      <span style={styles.bottomNavIcon}>{icon}</span>
      <span style={styles.bottomNavText}>{title}</span>
    </button>
  );
}

const styles = {
  limitedOfferBar: {
    marginTop: "16px",
    background: "linear-gradient(180deg, #022013 0%, #043820 100%)",
    borderRadius: "16px",
    padding: "8px 12px",
    border: "1px solid #10b981",
    boxShadow: "0 0 15px rgba(16, 185, 129, 0.2)",
    display: "flex",
    alignItems: "center",
    gap: "10px",
    overflow: "hidden"
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
    animation: "marquee 20s linear infinite"
  },
  limitedOfferBadge: {
    background: "#f59e0b",
    color: "#000000",
    fontWeight: "900",
    fontSize: "10px",
    padding: "4px 8px",
    borderRadius: "6px",
    letterSpacing: "0.5px",
    whiteSpace: "nowrap",
    flexShrink: 0,
    boxShadow: "0 2px 6px rgba(0,0,0,0.3)"
  },
  announcementText: {
    fontSize: "12px",
    fontWeight: "700",
    color: "#ffffff"
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
  // 🟢 সাইডবার চওড়া কম করা হয়েছে (230px)
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
  // 🟢 সাইডবার বোতাম ও ট্রি প্ল্যান্টের স্ক্রোল এরিয়া
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
  // 🟢 বোতাম সাইজ ছোট করা হয়েছে
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

  // 🟢 পুরো সুন্দর ট্রি প্ল্যান্ট সেকশন
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
  },

  appDownloadCard: {
    position: "relative",
    marginTop: "28px",
    background: "linear-gradient(135deg, #061826 0%, #0b2f38 50%, #03141e 100%)",
    borderRadius: "24px",
    padding: "20px 16px",
    border: "1px solid rgba(34, 197, 94, 0.5)",
    boxShadow: "0 15px 35px rgba(0,0,0,0.6), inset 0 0 15px rgba(34, 197, 94, 0.15)",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "16px",
    overflow: "hidden"
  },
  appGlowBackground: {
    position: "absolute",
    top: "-30px",
    right: "-30px",
    width: "120px",
    height: "120px",
    background: "radial-gradient(circle, rgba(34,197,94,0.3) 0%, transparent 70%)",
    pointerEvents: "none"
  },
  appTopBadge: {
    display: "inline-flex",
    alignItems: "center",
    gap: "6px",
    background: "rgba(34, 197, 94, 0.15)",
    border: "1px solid rgba(34, 197, 94, 0.4)",
    padding: "5px 14px",
    borderRadius: "20px",
    color: "#4ade80",
    fontSize: "10px",
    fontWeight: "800",
    letterSpacing: "0.6px"
  },
  appBadgePulse: {
    width: "6px",
    height: "6px",
    borderRadius: "50%",
    background: "#22c55e",
    boxShadow: "0 0 8px #22c55e",
    animation: "appPulse 1.5s infinite"
  },
  appDownloadHeader: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    textAlign: "center",
    gap: "10px",
    width: "100%"
  },
  appLogoContainer: {
    position: "relative"
  },
  appLogoImg: {
    width: "62px",
    height: "62px",
    borderRadius: "18px",
    border: "2px solid #22c55e",
    objectFit: "contain",
    boxShadow: "0 6px 18px rgba(34, 197, 94, 0.3)"
  },
  appOnlineDot: {
    position: "absolute",
    bottom: "-2px",
    right: "-2px",
    width: "14px",
    height: "14px",
    borderRadius: "50%",
    background: "#22c55e",
    border: "2px solid #061826"
  },
  appInfoTextCenter: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    textAlign: "center"
  },
  appDownloadTitle: {
    margin: 0,
    fontSize: "18px",
    fontWeight: "900",
    color: "#ffffff",
    letterSpacing: "0.3px"
  },
  appDownloadSub: {
    margin: "4px 0 0 0",
    fontSize: "12px",
    color: "#94a3b8",
    fontWeight: "600"
  },
  appRatingWrap: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "6px",
    marginTop: "6px",
    fontSize: "11px"
  },
  appRatingText: {
    color: "#e2e8f0",
    fontWeight: "700"
  },
  appBtnGroup: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    width: "100%"
  },
  appDownloadBtn: {
    width: "100%",
    padding: "12px 18px",
    borderRadius: "16px",
    background: "linear-gradient(135deg, #16a34a 0%, #15803d 100%)",
    border: "1px solid #4ade80",
    color: "#ffffff",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "10px",
    boxShadow: "0 6px 20px rgba(22, 163, 74, 0.4)",
    transition: "transform 0.2s ease"
  },
  appStoreSvg: {
    width: "24px",
    height: "24px",
    flexShrink: 0
  },
  btnTextWrapper: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    textAlign: "center"
  },
  btnMiniLabel: {
    fontSize: "9px",
    fontWeight: "800",
    color: "#86efac",
    letterSpacing: "0.5px"
  },
  btnMainLabel: {
    fontSize: "14px",
    fontWeight: "900",
    color: "#ffffff"
  },
  downloadIconSvg: {
    width: "20px",
    height: "20px",
    flexShrink: 0
  },

  popupOverlay: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: "rgba(2, 6, 23, 0.75)",
    backdropFilter: "blur(6px)",
    zIndex: 100001,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "16px"
  },
  popupCard: {
    background: "#0f172a",
    borderRadius: "24px",
    padding: "20px",
    maxWidth: "420px",
    width: "100%",
    position: "relative",
    boxShadow: "0 25px 60px rgba(0,0,0,0.6)",
    border: "1px solid #1e293b",
    textAlign: "center"
  },
  popupCloseBtn: {
    position: "absolute",
    top: "12px",
    right: "12px",
    width: "34px",
    height: "34px",
    background: "rgba(255, 255, 255, 0.15)",
    backdropFilter: "blur(8px)",
    WebkitBackdropFilter: "blur(8px)",
    border: "1px solid rgba(255, 255, 255, 0.3)",
    clipPath: "polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)",
    color: "#ffffff",
    fontSize: "14px",
    fontWeight: "bold",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 2
  },
  popupImage: {
    width: "100%",
    maxHeight: "260px",
    objectFit: "cover",
    borderRadius: "16px",
    marginBottom: "14px"
  },
  popupDownloadBtn: {
    width: "100%",
    padding: "12px",
    border: "1px solid rgba(34, 197, 94, 0.4)",
    background: "rgba(34, 197, 94, 0.2)",
    backdropFilter: "blur(10px)",
    WebkitBackdropFilter: "blur(10px)",
    clipPath: "polygon(14px 0%, calc(100% - 14px) 0%, 100% 50%, calc(100% - 14px) 100%, 14px 100%, 0% 50%)",
    color: "#ffffff",
    fontWeight: "800",
    fontSize: "14px",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",
    boxShadow: "0 4px 14px rgba(0, 0, 0, 0.3)"
  },

  statusOverlayBg: {
    position: "fixed",
    inset: 0,
    background: "rgba(2, 6, 23, 0.65)",
    backdropFilter: "blur(8px)",
    zIndex: 100000,
    display: "flex",
    alignItems: "center",
    justifyContent: "center"
  },
  statusOverlayCard: {
    background: "#0f172a",
    padding: "24px 34px",
    borderRadius: "24px",
    textAlign: "center",
    boxShadow: "0 30px 70px rgba(0,0,0,0.5)",
    border: "1px solid #1e293b",
    maxWidth: "380px",
    width: "85%",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "14px"
  },
  statusOverlayIcon: {
    width: "58px",
    height: "58px",
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "28px",
    fontWeight: "bold"
  },
  statusOverlayText: {
    fontSize: "16px",
    color: "#ffffff",
    margin: 0,
    fontWeight: "800",
    lineHeight: "1.4"
  },

  page: {
    minHeight: "100vh",
    background: "linear-gradient(180deg,#020617 0%,#031026 45%,#020617 100%)",
    color: "white",
    padding: "0 12px 140px",
    fontFamily: "system-ui, -apple-system, sans-serif"
  },

  loadingPage: {
    minHeight: "100vh",
    background: "#020617",
    color: "white",
    display: "flex",
    alignItems: "center",
    justifyContent: "center"
  },

  loadingCard: {
    background: "#0f172a",
    padding: "30px",
    borderRadius: "24px",
    textAlign: "center",
    border: "1px solid #1e40af",
    boxShadow: "0 0 35px rgba(34,197,94,0.25)"
  },

  topHeader: {
    height: "60px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "0 4px"
  },

  menuButton: {
    background: "transparent",
    border: "none",
    color: "white",
    fontSize: "26px",
    cursor: "pointer",
    padding: "4px"
  },

  headerTitle: {
    margin: 0,
    fontSize: "15px",
    fontWeight: "800",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
    maxWidth: "180px"
  },

  logoutBtn: {
    height: "36px",
    padding: "0 12px",
    border: "1px solid rgba(239, 68, 68, 0.4)",
    background: "rgba(239, 68, 68, 0.2)",
    backdropFilter: "blur(10px)",
    WebkitBackdropFilter: "blur(10px)",
    clipPath: "polygon(8px 0%, calc(100% - 8px) 0%, 100% 50%, calc(100% - 8px) 100%, 8px 100%, 0% 50%)",
    color: "white",
    fontWeight: "800",
    fontSize: "12px",
    boxShadow: "0 4px 14px rgba(0, 0, 0, 0.35)",
    cursor: "pointer"
  },

  notificationButton: {
    position: "relative",
    background: "transparent",
    border: "none",
    color: "white",
    fontSize: "20px",
    cursor: "pointer",
    padding: "4px"
  },

  notificationBadge: {
    position: "absolute",
    top: "-2px",
    right: "-2px",
    background: "#ff1744",
    color: "white",
    width: "18px",
    height: "18px",
    borderRadius: "50%",
    fontSize: "10px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: "bold"
  },

  heroWrapper: {
    position: "relative",
    display: "flex",
    alignItems: "center",
    gap: "10px",
    padding: "14px 12px",
    borderRadius: "20px",
    overflow: "hidden",
    background: "radial-gradient(circle at 90% 0%,#22ff88 0%,transparent 34%),linear-gradient(135deg,#06152d,#043858,#08c96b)",
    border: "1px solid rgba(34,255,136,0.55)",
    boxShadow: "0 0 38px rgba(34,255,136,0.23)"
  },

  heroGlow: {
    position: "absolute",
    inset: 0,
    background: "linear-gradient(90deg,rgba(255,255,255,0.08),transparent,rgba(255,255,255,0.08))",
    pointerEvents: "none"
  },

  profilePhotoCircle: {
    width: "60px",
    height: "60px",
    borderRadius: "50%",
    background: "#334155",
    border: "2px solid #e0f2fe",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    zIndex: 2,
    flexShrink: 0,
    boxShadow: "0 0 12px rgba(255,255,255,0.35)"
  },

  profilePhoto: {
    width: "100%",
    height: "100%",
    objectFit: "cover"
  },

  defaultProfileIcon: {
    fontSize: "30px"
  },

  heroUserInfo: {
    flex: 1,
    zIndex: 2,
    overflow: "hidden"
  },

  heroWelcome: {
    margin: 0,
    fontSize: "11px",
    fontWeight: "700",
    color: "#cbd5e1"
  },

  heroNameRow: {
    display: "flex",
    alignItems: "center",
    gap: "5px"
  },

  heroName: {
    margin: "2px 0",
    fontSize: "15px",
    fontWeight: "800",
    lineHeight: "1.2",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis"
  },

  verifiedBadge: {
    width: "16px",
    height: "16px",
    borderRadius: "50%",
    background: "#2563eb",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "10px",
    fontWeight: "bold",
    flexShrink: 0
  },

  heroSubtitle: {
    margin: 0,
    fontSize: "10px",
    color: "#dcfce7",
    fontWeight: "600",
    whiteSpace: "nowrap"
  },

  heroWalletCard: {
    minWidth: "90px",
    borderRadius: "14px",
    padding: "8px 10px",
    background: "linear-gradient(135deg,#16ff75,#00b96b)",
    boxShadow: "0 8px 18px rgba(0,0,0,0.35)",
    zIndex: 2,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    flexShrink: 0
  },
  heroWalletLabel: {
    margin: 0,
    fontSize: "10px",
    fontWeight: "700",
    color: "#000000"
  },
  heroWalletValue: {
    margin: "2px 0",
    fontSize: "13px",
    fontWeight: "900",
    color: "#000000"
  },

  statsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(2, 1fr)",
    gap: "10px",
    marginTop: "14px"
  },

  statCard: {
    position: "relative",
    borderRadius: "16px",
    padding: "12px",
    overflow: "hidden",
    boxShadow: "0 8px 20px rgba(0,0,0,0.35)",
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
    minHeight: "90px"
  },

  statBlue: {
    background: "linear-gradient(135deg,#2f63ff,#061b91)"
  },

  statGreen: {
    background: "linear-gradient(135deg,#00f58a,#006b45)"
  },

  statPurple: {
    background: "linear-gradient(135deg,#9b35ff,#4c057a)"
  },

  statOrange: {
    background: "linear-gradient(135deg,#ff8a00,#c2410c)"
  },

  statIconWrap: {
    lineHeight: "1"
  },

  statIcon: {
    fontSize: "22px"
  },

  statTitle: {
    margin: "6px 0 2px",
    color: "rgba(255,255,255,0.9)",
    fontSize: "11px",
    fontWeight: "700",
    whiteSpace: "nowrap"
  },

  statValue: {
    margin: 0,
    fontSize: "16px",
    fontWeight: "900"
  },

  statGlow: {
    position: "absolute",
    right: "-15px",
    top: "-15px",
    width: "55px",
    height: "55px",
    borderRadius: "50%",
    background: "rgba(255,255,255,0.18)"
  },

  sectionTitleWrap: {
    margin: "20px 0 10px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px"
  },

  sectionLine: {
    flex: 1,
    height: "2px",
    borderRadius: "10px",
    background: "linear-gradient(90deg,transparent,#38bdf8,#facc15,transparent)"
  },

  sectionTitleText: {
    margin: 0,
    fontSize: "14px",
    fontWeight: "900",
    letterSpacing: "0.5px"
  },

  actionPanel: {
    background: "linear-gradient(180deg,#061936,#07101e)",
    border: "1.5px solid #1d4ed8",
    borderRadius: "20px",
    padding: "10px",
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: "10px",
    boxShadow: "inset 0 0 25px rgba(59,130,246,0.2)"
  },

  actionButton: {
    position: "relative",
    border: "1px solid rgba(255, 255, 255, 0.2)",
    background: "rgba(255, 255, 255, 0.08)",
    backdropFilter: "blur(8px)",
    WebkitBackdropFilter: "blur(8px)",
    clipPath: "polygon(10px 0%, calc(100% - 10px) 0%, 100% 50%, calc(100% - 10px) 100%, 10px 100%, 0% 50%)",
    padding: "10px 4px",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: "4px",
    overflow: "hidden",
    boxShadow: "0 6px 18px rgba(0,0,0,0.35)",
    cursor: "pointer"
  },

  actionIconCircle: {
    width: "36px",
    height: "36px",
    borderRadius: "12px",
    background: "rgba(255,255,255,0.18)",
    backdropFilter: "blur(6px)",
    WebkitBackdropFilter: "blur(6px)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "18px"
  },

  actionTextBox: {
    textAlign: "center",
    zIndex: 2,
    width: "100%"
  },

  actionTitle: {
    margin: 0,
    fontSize: "11px",
    fontWeight: "800",
    lineHeight: "1.1",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis"
  },

  actionSubtitle: {
    margin: "2px 0 0",
    fontSize: "9px",
    color: "rgba(255,255,255,0.8)",
    fontWeight: "600",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis"
  },

  actionShine: {
    position: "absolute",
    right: "-18px",
    top: "-18px",
    width: "50px",
    height: "50px",
    borderRadius: "50%",
    background: "rgba(255,255,255,0.12)"
  },

  actionInvest: {
    background: "rgba(0, 255, 117, 0.12)",
    border: "1px solid rgba(0, 255, 117, 0.3)"
  },
  actionMyInvestment: {
    background: "rgba(0, 180, 255, 0.12)",
    border: "1px solid rgba(0, 180, 255, 0.3)"
  },
  actionWallet: {
    background: "rgba(217, 70, 239, 0.12)",
    border: "1px solid rgba(217, 70, 239, 0.3)"
  },
  actionWithdraw: {
    background: "rgba(255, 107, 0, 0.12)",
    border: "1px solid rgba(255, 107, 0, 0.3)"
  },
  actionRefer: {
    background: "rgba(255, 0, 122, 0.12)",
    border: "1px solid rgba(255, 0, 122, 0.3)"
  },
  actionTransaction: {
    background: "rgba(0, 229, 255, 0.12)",
    border: "1px solid rgba(0, 229, 255, 0.3)"
  },
  actionKyc: {
    background: "rgba(0, 245, 255, 0.12)",
    border: "1px solid rgba(0, 245, 255, 0.3)"
  },
  actionReward: {
    background: "rgba(168, 85, 247, 0.12)",
    border: "1px solid rgba(168, 85, 247, 0.3)"
  },
  actionBank: {
    background: "rgba(255, 183, 3, 0.12)",
    border: "1px solid rgba(255, 183, 3, 0.3)"
  },
  actionPlan: {
    background: "rgba(0, 176, 255, 0.12)",
    border: "1px solid rgba(0, 176, 255, 0.3)"
  },
  actionNotification: {
    background: "rgba(255, 23, 68, 0.12)",
    border: "1px solid rgba(255, 23, 68, 0.3)"
  },
  actionSupport: {
    background: "rgba(0, 255, 117, 0.12)",
    border: "1px solid rgba(0, 255, 117, 0.3)"
  },

  promoBanner: {
    marginTop: "16px",
    borderRadius: "18px",
    padding: "16px",
    background: "linear-gradient(135deg,#4c1d95,#8b00ff,#9d00ff)",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    boxShadow: "0 8px 24px rgba(126,34,206,0.35)"
  },

  promoContent: {
    flex: 1
  },

  promoTitle: {
    margin: 0,
    fontSize: "16px",
    fontWeight: "900",
    lineHeight: "1.2"
  },

  promoSubtitle: {
    margin: "4px 0 0",
    fontSize: "11px",
    color: "#e9d5ff"
  },

  promoButton: {
    marginTop: "10px",
    border: "1px solid rgba(250, 204, 21, 0.5)",
    background: "rgba(250, 204, 21, 0.2)",
    backdropFilter: "blur(10px)",
    WebkitBackdropFilter: "blur(10px)",
    clipPath: "polygon(8px 0%, calc(100% - 8px) 0%, 100% 50%, calc(100% - 8px) 100%, 8px 100%, 0% 50%)",
    color: "#ffffff",
    fontWeight: "900",
    fontSize: "12px",
    cursor: "pointer",
    padding: "8px 14px"
  },

  promoIcon: {
    fontSize: "36px"
  },

  trustPanel: {
    display: "grid",
    gridTemplateColumns: "repeat(2, 1fr)",
    gap: "8px",
    marginTop: "14px",
    background: "#071831",
    borderRadius: "18px",
    padding: "10px",
    border: "1px solid #1e40af"
  },

  trustMiniCard: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    background: "rgba(15,23,42,0.65)",
    borderRadius: "12px",
    padding: "8px 10px"
  },

  trustIconCircle: {
    fontSize: "18px"
  },

  trustTitle: {
    margin: 0,
    fontSize: "11px",
    fontWeight: "800",
    whiteSpace: "nowrap"
  },

  trustSubtitle: {
    margin: "2px 0 0",
    color: "#94a3b8",
    fontSize: "9px",
    whiteSpace: "nowrap"
  },

  aboutStrip: {
    width: "100%",
    marginTop: "16px",
    padding: "12px",
    border: "1px solid rgba(6, 182, 212, 0.4)",
    background: "rgba(6, 182, 212, 0.2)",
    backdropFilter: "blur(10px)",
    WebkitBackdropFilter: "blur(10px)",
    clipPath: "polygon(12px 0%, calc(100% - 12px) 0%, 100% 50%, calc(100% - 12px) 100%, 12px 100%, 0% 50%)",
    color: "white",
    fontWeight: "900",
    fontSize: "13px",
    cursor: "pointer"
  },

  helpText: {
    textAlign: "center",
    color: "#22ff73",
    fontSize: "15px",
    fontWeight: "900",
    marginTop: "18px",
    letterSpacing: "0.5px"
  },

  footer: {
    textAlign: "center",
    padding: "20px 4px 10px",
    color: "#87CEEB"
  },

  footerLinks: {
    display: "flex",
    flexWrap: "wrap",
    gap: "8px",
    justifyContent: "center",
    marginBottom: "10px"
  },

  footerLinkBtn: {
    background: "transparent",
    border: "none",
    color: "#38bdf8",
    fontSize: "11px",
    fontWeight: "700",
    cursor: "pointer",
    padding: "2px 4px"
  },

  loadingLogoImg: {
    width: "80px",
    height: "80px",
    objectFit: "contain",
    borderRadius: "16px"
  },

  bottomNav: {
    position: "fixed",
    bottom: 0,
    left: 0,
    right: 0,
    height: "56px",
    background: "#020817",
    display: "grid",
    gridTemplateColumns: "repeat(4,1fr)",
    borderTop: "1px solid #1e40af",
    zIndex: 999
  },

  bottomNavItem: {
    border: "none",
    background: "transparent",
    color: "#94a3b8",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "11px",
    cursor: "pointer"
  },

  bottomNavItemActive: {
    background: "#0f2a5c",
    color: "white"
  },

  bottomNavIcon: {
    fontSize: "18px"
  },

  bottomNavText: {
    fontSize: "10px",
    marginTop: "2px"
  }
};

// 🟢 অ্যানিমেশন স্টাইল আপডেট (সম্পূর্ণ স্মুথ 20s ফুল অ্যানিমেশন)
const animationStyleSheet = document.createElement("style");
animationStyleSheet.type = "text/css";
animationStyleSheet.innerText = `
  @keyframes marquee {
    0% { transform: translateX(100%); }
    100% { transform: translateX(-100%); }
  }

  @keyframes appPulse {
    0% {
      transform: scale(0.95);
      box-shadow: 0 0 0 0 rgba(34, 197, 94, 0.7);
    }
    70% {
      transform: scale(1);
      box-shadow: 0 0 0 8px rgba(34, 197, 94, 0);
    }
    100% {
      transform: scale(0.95);
      box-shadow: 0 0 0 0 rgba(34, 197, 94, 0);
    }
  }

  .premium-app-btn:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 25px rgba(34, 197, 94, 0.6) !important;
  }

  .premium-download-card {
    transition: transform 0.3s ease, box-shadow 0.3s ease;
  }
`;
if (typeof document !== "undefined") {
  document.head.appendChild(animationStyleSheet);
}
