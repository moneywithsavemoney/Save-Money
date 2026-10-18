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

  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isDownloadingPlan, setIsDownloadingPlan] = useState(false);
  const [showOfferPopup, setShowOfferPopup] = useState(false);

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
    window.location.href = "https://drive.google.com/uc?id=1IkMCEVF_RDBeiAW8sznXZCrJ4m40jOcU&confirm=t";
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

    setShowOfferPopup(true);

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
          <h2 style={{ marginTop: "15px", fontSize: "20px", fontWeight: "800", color: "#38bdf8" }}>Save Money</h2>
          <p style={{ color: "#94a3b8", fontSize: "14px" }}>Securing your dashboard...</p>
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
      <style>{premiumGlobalCSS}</style>

      {/* SIDEBAR DRAWER */}
      <div style={{
        ...styles.drawerOverlay,
        opacity: isDrawerOpen ? 1 : 0,
        visibility: isDrawerOpen ? "visible" : "hidden"
      }} onClick={() => setIsDrawerOpen(false)}>
        <div style={{
          ...styles.drawerContainer,
          transform: isDrawerOpen ? "translateX(0)" : "translateX(-100%)"
        }} onClick={(e) => e.stopPropagation()}>
          
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
                <span style={styles.drawerLogoSubtext}>Diamond Wealth Suite</span>
              </div>
            </div>
          </div>

          <div style={styles.drawerScrollArea}>
            <div style={styles.drawerNavList}>
              <button 
                style={{
                  ...styles.drawerNavItem,
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
                  ...(location.pathname === "/one-time" ? styles.drawerNavItemActive : {})
                }} 
                onClick={() => { go("/one-time"); setIsDrawerOpen(false); }}
              >
                <span style={styles.drawerNavIcon}>⚡</span>
                <span style={styles.drawerNavText}>One Time</span>
              </button>

              <button 
                style={styles.drawerNavItem} 
                onClick={() => { handleDownloadPlan(); setIsDrawerOpen(false); }}
                disabled={isDownloadingPlan}
              >
                <span style={styles.drawerNavIcon}>{isDownloadingPlan ? "⏳" : "📋"}</span>
                <span style={styles.drawerNavText}>{isDownloadingPlan ? "Downloading..." : "Plan PDF"}</span>
              </button>

              <button 
                style={{
                  ...styles.drawerNavItem,
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
                  background: "rgba(239, 68, 68, 0.2)",
                  border: "1px solid rgba(239, 68, 68, 0.4)"
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
              src="/OFFER_BANNER.png"
              alt="OFFER BANNER"
              style={styles.popupImage}
              loading="eager"
              decoding="async"
            />
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
      <section style={styles.heroWrapper} className="diamond-glow-box">
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
            Diamond Investor 👋
          </p>

          <div style={styles.heroNameRow}>
            <h1 style={styles.heroName}>
              {name}
            </h1>
            {kycApproved && (
              <span style={styles.verifiedBadge}>✔</span>
            )}
          </div>

          <p style={styles.heroSubtitle}>
            Secure Vault Active 💎
          </p>
        </div>

        <div style={styles.heroWalletCard}>
          <p style={styles.heroWalletLabel}>Total Wallet</p>
          <h2 style={styles.heroWalletValue}>
            ₹{wallet.toFixed(2)}
          </h2>
          <span style={{ fontSize: "14px" }}>👛</span>
        </div>
      </section>

      {/* LIMITED OFFER ANNOUNCEMENT BAR */}
      <div style={styles.limitedOfferBar}>
        <div style={styles.limitedOfferBadge}>UPDATE 🔥</div>
        <div style={styles.marqueeContainer}>
          <div style={styles.marqueeText}>
            <span style={styles.announcementText}>
              {latestUpdateText || "Please Download our Official Application For better Experience."}
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
        color="#38bdf8"
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
        color="#fbbf24"
      />

      <section style={styles.actionPanel}>
        <PremiumActionButton
          icon="✅"
          title="KYC Verification"
          subtitle="Verify Account"
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
          title="Investment Asst"
          subtitle="Get Assistance"
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

      {/* PROMO BANNER */}
      <section style={styles.promoBanner}>
        <div style={styles.promoContent}>
          <h1 style={styles.promoTitle}>
            Grow Your Wealth
            <br />
            Secure Your Future
          </h1>
          <p style={styles.promoSubtitle}>
            Institutional-grade daily returns & compounding.
          </p>
          <button
            style={styles.promoButton}
            onClick={() => go("/save-money")}
          >
            Invest Now →
          </button>
        </div>
        <div style={styles.promoIcon}>
          💎📈
        </div>
      </section>

      {/* TRUST CARDS */}
      <section style={styles.trustPanel}>
        <TrustMiniCard
          icon="🔒"
          title="100% Secure"
          subtitle="Encrypted Vault"
        />
        <TrustMiniCard
          icon="⚡"
          title="Instant Payout"
          subtitle="Quick execution"
        />
        <TrustMiniCard
          icon="🛡️"
          title="Regulated & Safe"
          subtitle="Trusted platform"
        />
        <TrustMiniCard
          icon="💬"
          title="24/7 Support"
          subtitle="Always available"
        />
      </section>

      {/* ABOUT STRIP */}
      <button
        style={styles.aboutStrip}
        onClick={() => go("/about")}
      >
        🏢 About Save Money Private Limited
      </button>

      {/* HELP TEXT */}
      <h1 style={styles.helpText}>
        HELP OTHERS EARN MORE 💸
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
        <h2 style={{ fontSize: "16px", fontWeight: "800", margin: "0 0 10px 0", color: "#38bdf8" }}>
          Save Money Private Limited
        </h2>

        <div style={styles.footerLinks}>
          <button style={styles.footerLinkBtn} onClick={() => go("/legal/privacy")}>Privacy</button>
          <button style={styles.footerLinkBtn} onClick={() => go("/legal/terms")}>Terms</button>
          <button style={styles.footerLinkBtn} onClick={() => go("/legal/refund")}>Refund</button>
          <button style={styles.footerLinkBtn} onClick={() => go("/legal/risk")}>Risk</button>
          <button style={styles.footerLinkBtn} onClick={() => go("/legal/aml")}>AML & KYC</button>
          <button style={styles.footerLinkBtn} onClick={() => go("/legal/disclaimer")}>Disclaimer</button>
        </div>

        <p style={{ fontSize: "11px", color: "#64748b", margin: 0 }}>
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
          title="Tree"
          active={location.pathname === "/referral-tree"}
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
  return (
    <button style={styles.actionButton} onClick={onClick}>
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

const premiumGlobalCSS = `
  @keyframes marquee {
    0% { transform: translateX(100%); }
    100% { transform: translateX(-100%); }
  }
  @keyframes appPulse {
    0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(56, 189, 248, 0.7); }
    70% { transform: scale(1); box-shadow: 0 0 0 8px rgba(56, 189, 248, 0); }
    100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(56, 189, 248, 0); }
  }
  .diamond-glow-box {
    border: 1px solid rgba(56, 189, 248, 0.4) !important;
    box-shadow: 0 10px 30px rgba(0,0,0,0.6), 0 0 20px rgba(56, 189, 248, 0.15) !important;
  }
  .premium-app-btn:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 25px rgba(56, 189, 248, 0.5) !important;
  }
`;

const styles = {
  limitedOfferBar: {
    marginTop: "14px",
    background: "linear-gradient(135deg, #090e1a 0%, #111827 100%)",
    borderRadius: "14px",
    padding: "8px 12px",
    border: "1px solid rgba(56, 189, 248, 0.3)",
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
    background: "#38bdf8",
    color: "#030712",
    fontWeight: "900",
    fontSize: "10px",
    padding: "3px 8px",
    borderRadius: "6px",
    letterSpacing: "0.5px",
    whiteSpace: "nowrap",
    flexShrink: 0
  },
  announcementText: {
    fontSize: "12px",
    fontWeight: "700",
    color: "#f8fafc"
  },

  drawerOverlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(3, 7, 18, 0.8)",
    backdropFilter: "blur(6px)",
    zIndex: 100002,
    display: "flex",
    justifyContent: "flex-start",
    transition: "opacity 0.3s ease, visibility 0.3s ease"
  },
  drawerContainer: {
    position: "fixed",
    top: 0, bottom: 0, left: 0,
    background: "#060913",
    width: "240px",
    height: "100vh",
    padding: "12px 10px",
    display: "flex",
    flexDirection: "column",
    boxShadow: "15px 0 40px rgba(0,0,0,0.9)",
    borderRight: "1px solid rgba(56, 189, 248, 0.2)",
    transform: "translateX(-100%)",
    transition: "transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
    overflow: "hidden",
    zIndex: 100003
  },
  drawerHeader: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    marginBottom: "10px",
    paddingBottom: "10px",
    borderBottom: "1px solid rgba(255, 255, 255, 0.08)"
  },
  drawerBrand: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "6px"
  },
  drawerLogoWrapper: {
    width: "44px",
    height: "44px",
    borderRadius: "50%",
    background: "radial-gradient(circle, #0284c7 0%, #0369a1 100%)",
    border: "2px solid #38bdf8",
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
    fontSize: "14px",
    fontWeight: "900",
    color: "#ffffff"
  },
  drawerLogoSubtext: {
    fontSize: "10px",
    color: "#38bdf8",
    fontWeight: "700"
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
    gap: "6px"
  },
  drawerNavItem: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    padding: "9px 12px",
    background: "rgba(255, 255, 255, 0.03)",
    border: "1px solid rgba(255, 255, 255, 0.06)",
    borderRadius: "10px",
    color: "#f8fafc",
    fontSize: "12px",
    fontWeight: "700",
    cursor: "pointer",
    textAlign: "left"
  },
  drawerNavItemActive: {
    background: "rgba(56, 189, 248, 0.15)",
    border: "1px solid #38bdf8",
    color: "#38bdf8"
  },
  drawerNavIcon: {
    fontSize: "16px",
    width: "20px",
    textAlign: "center"
  },
  drawerNavText: {
    flex: 1,
    fontSize: "12px"
  },
  treePlantOnlyWrapper: {
    marginTop: "auto",
    width: "100%",
    height: "90px",
    borderRadius: "12px",
    overflow: "hidden"
  },
  treePlantOnlyImg: {
    width: "100%",
    height: "100%",
    objectFit: "cover"
  },

  appDownloadCard: {
    position: "relative",
    marginTop: "24px",
    background: "linear-gradient(135deg, #090e1a 0%, #111827 50%, #1e1b4b 100%)",
    borderRadius: "20px",
    padding: "18px 16px",
    border: "1px solid rgba(56, 189, 248, 0.3)",
    boxShadow: "0 15px 35px rgba(0,0,0,0.6)",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "14px",
    overflow: "hidden"
  },
  appGlowBackground: {
    position: "absolute",
    top: "-30px",
    right: "-30px",
    width: "100px",
    height: "100px",
    background: "radial-gradient(circle, rgba(56,189,248,0.2) 0%, transparent 70%)",
    pointerEvents: "none"
  },
  appTopBadge: {
    display: "inline-flex",
    alignItems: "center",
    gap: "6px",
    background: "rgba(56, 189, 248, 0.12)",
    border: "1px solid rgba(56, 189, 248, 0.3)",
    padding: "4px 12px",
    borderRadius: "20px",
    color: "#38bdf8",
    fontSize: "10px",
    fontWeight: "800"
  },
  appBadgePulse: {
    width: "6px",
    height: "6px",
    borderRadius: "50%",
    background: "#38bdf8",
    animation: "appPulse 1.5s infinite"
  },
  appDownloadHeader: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    textAlign: "center",
    gap: "8px",
    width: "100%"
  },
  appLogoContainer: {
    position: "relative"
  },
  appLogoImg: {
    width: "56px",
    height: "56px",
    borderRadius: "16px",
    border: "2px solid #38bdf8",
    objectFit: "contain",
    boxShadow: "0 6px 18px rgba(56, 189, 248, 0.3)"
  },
  appOnlineDot: {
    position: "absolute",
    bottom: "-2px",
    right: "-2px",
    width: "12px",
    height: "12px",
    borderRadius: "50%",
    background: "#10b981",
    border: "2px solid #090e1a"
  },
  appInfoTextCenter: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center"
  },
  appDownloadTitle: {
    margin: 0,
    fontSize: "17px",
    fontWeight: "900",
    color: "#f8fafc"
  },
  appDownloadSub: {
    margin: "2px 0 0 0",
    fontSize: "11px",
    color: "#94a3b8"
  },
  appRatingWrap: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    marginTop: "4px",
    fontSize: "11px"
  },
  appRatingText: {
    color: "#cbd5e1",
    fontWeight: "700"
  },
  appBtnGroup: {
    width: "100%"
  },
  appDownloadBtn: {
    width: "100%",
    padding: "12px",
    borderRadius: "14px",
    background: "linear-gradient(135deg, #38bdf8 0%, #2563eb 100%)",
    border: "none",
    color: "#ffffff",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "10px",
    boxShadow: "0 6px 20px rgba(56, 189, 248, 0.3)",
    transition: "transform 0.2s ease"
  },
  appStoreSvg: {
    width: "22px",
    height: "22px",
    flexShrink: 0
  },
  btnTextWrapper: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center"
  },
  btnMiniLabel: {
    fontSize: "9px",
    fontWeight: "800",
    color: "#e0f2fe",
    letterSpacing: "0.5px"
  },
  btnMainLabel: {
    fontSize: "13px",
    fontWeight: "900",
    color: "#ffffff"
  },
  downloadIconSvg: {
    width: "18px",
    height: "18px",
    flexShrink: 0
  },

  popupOverlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(3, 7, 18, 0.8)",
    backdropFilter: "blur(6px)",
    zIndex: 100001,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "16px"
  },
  popupCard: {
    background: "#090e1a",
    borderRadius: "20px",
    padding: "18px",
    maxWidth: "90%",
    width: "380px",
    position: "relative",
    boxShadow: "0 25px 60px rgba(0,0,0,0.8)",
    border: "1px solid rgba(56, 189, 248, 0.3)",
    textAlign: "center"
  },
  popupCloseBtn: {
    position: "absolute",
    top: "10px",
    right: "10px",
    width: "30px",
    height: "30px",
    background: "rgba(255, 255, 255, 0.1)",
    border: "1px solid rgba(255, 255, 255, 0.2)",
    borderRadius: "50%",
    color: "#ffffff",
    fontSize: "12px",
    fontWeight: "bold",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 2
  },
  popupImage: {
    width: "100%",
    height: "auto",
    objectFit: "contain",
    borderRadius: "14px"
  },

  statusOverlayBg: {
    position: "fixed",
    inset: 0,
    background: "rgba(3, 7, 18, 0.8)",
    backdropFilter: "blur(6px)",
    zIndex: 100000,
    display: "flex",
    alignItems: "center",
    justifyContent: "center"
  },
  statusOverlayCard: {
    background: "#090e1a",
    padding: "20px 28px",
    borderRadius: "18px",
    textAlign: "center",
    boxShadow: "0 25px 50px rgba(0,0,0,0.7)",
    border: "1px solid rgba(56, 189, 248, 0.3)",
    maxWidth: "340px",
    width: "85%",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "12px"
  },
  statusOverlayIcon: {
    width: "50px",
    height: "50px",
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "24px",
    fontWeight: "bold"
  },
  statusOverlayText: {
    fontSize: "15px",
    color: "#ffffff",
    margin: 0,
    fontWeight: "800",
    lineHeight: "1.4"
  },

  page: {
    minHeight: "100vh",
    background: "#030712",
    color: "white",
    padding: "0 12px 130px",
    fontFamily: "system-ui, -apple-system, sans-serif"
  },
  loadingPage: {
    minHeight: "100vh",
    background: "#030712",
    color: "white",
    display: "flex",
    alignItems: "center",
    justifyContent: "center"
  },
  loadingCard: {
    background: "#090e1a",
    padding: "28px",
    borderRadius: "20px",
    textAlign: "center",
    border: "1px solid rgba(56, 189, 248, 0.3)",
    boxShadow: "0 0 30px rgba(56,189,248,0.2)"
  },
  topHeader: {
    height: "56px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "0 4px"
  },
  menuButton: {
    background: "rgba(255,255,255,0.05)",
    border: "1px solid rgba(255,255,255,0.1)",
    color: "#38bdf8",
    fontSize: "20px",
    cursor: "pointer",
    width: "40px",
    height: "40px",
    borderRadius: "12px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center"
  },
  headerTitle: {
    margin: 0,
    fontSize: "14px",
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
    background: "rgba(239, 68, 68, 0.15)",
    color: "#f87171",
    fontWeight: "800",
    fontSize: "11px",
    borderRadius: "10px",
    cursor: "pointer"
  },
  notificationButton: {
    position: "relative",
    background: "rgba(255,255,255,0.05)",
    border: "1px solid rgba(255,255,255,0.1)",
    color: "white",
    fontSize: "16px",
    cursor: "pointer",
    width: "40px",
    height: "40px",
    borderRadius: "12px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center"
  },
  notificationBadge: {
    position: "absolute",
    top: "-2px",
    right: "-2px",
    background: "#ef4444",
    color: "white",
    width: "16px",
    height: "16px",
    borderRadius: "50%",
    fontSize: "9px",
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
    padding: "16px 14px",
    borderRadius: "20px",
    overflow: "hidden",
    background: "linear-gradient(135deg, #090e1a 0%, #111827 50%, #1e1b4b 100%)",
    boxShadow: "0 15px 35px rgba(0,0,0,0.6)"
  },
  heroGlow: {
    position: "absolute",
    inset: 0,
    background: "linear-gradient(90deg,rgba(56,189,248,0.05),transparent,rgba(56,189,248,0.05))",
    pointerEvents: "none"
  },
  profilePhotoCircle: {
    width: "56px",
    height: "56px",
    borderRadius: "50%",
    background: "#1f2937",
    border: "2px solid #38bdf8",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    zIndex: 2,
    flexShrink: 0
  },
  profilePhoto: {
    width: "100%",
    height: "100%",
    objectFit: "cover"
  },
  defaultProfileIcon: {
    fontSize: "26px"
  },
  heroUserInfo: {
    flex: 1,
    zIndex: 2,
    overflow: "hidden"
  },
  heroWelcome: {
    margin: 0,
    fontSize: "10px",
    fontWeight: "700",
    color: "#94a3b8"
  },
  heroNameRow: {
    display: "flex",
    alignItems: "center",
    gap: "5px"
  },
  heroName: {
    margin: "2px 0",
    fontSize: "15px",
    fontWeight: "900",
    color: "#f8fafc",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis"
  },
  verifiedBadge: {
    width: "14px",
    height: "14px",
    borderRadius: "50%",
    background: "#10b981",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "9px",
    fontWeight: "bold",
    color: "#fff"
  },
  heroSubtitle: {
    margin: 0,
    fontSize: "10px",
    color: "#34d399",
    fontWeight: "700"
  },
  heroWalletCard: {
    minWidth: "85px",
    borderRadius: "14px",
    padding: "8px 10px",
    background: "rgba(56, 189, 248, 0.1)",
    border: "1px solid rgba(56, 189, 248, 0.3)",
    zIndex: 2,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    flexShrink: 0
  },
  heroWalletLabel: {
    margin: 0,
    fontSize: "9px",
    fontWeight: "800",
    color: "#94a3b8"
  },
  heroWalletValue: {
    margin: "2px 0",
    fontSize: "13px",
    fontWeight: "900",
    color: "#34d399"
  },

  statsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(2, 1fr)",
    gap: "10px",
    marginTop: "12px"
  },
  statCard: {
    position: "relative",
    borderRadius: "16px",
    padding: "12px",
    overflow: "hidden",
    boxShadow: "0 8px 20px rgba(0,0,0,0.3)",
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
    minHeight: "85px",
    border: "1px solid rgba(255,255,255,0.06)"
  },
  statBlue: { background: "linear-gradient(135deg,#090e1a,#1e3a8a)" },
  statGreen: { background: "linear-gradient(135deg,#090e1a,#065f46)" },
  statPurple: { background: "linear-gradient(135deg,#090e1a,#581c87)" },
  statOrange: { background: "linear-gradient(135deg,#090e1a,#7c2d12)" },

  statIconWrap: { lineHeight: "1" },
  statIcon: { fontSize: "20px" },
  statTitle: {
    margin: "4px 0 2px",
    color: "#94a3b8",
    fontSize: "11px",
    fontWeight: "700"
  },
  statValue: {
    margin: 0,
    fontSize: "15px",
    fontWeight: "900",
    color: "#f8fafc"
  },
  statGlow: {
    position: "absolute",
    right: "-15px",
    top: "-15px",
    width: "45px",
    height: "45px",
    borderRadius: "50%",
    background: "rgba(255,255,255,0.08)"
  },

  sectionTitleWrap: {
    margin: "18px 0 10px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px"
  },
  sectionLine: {
    flex: 1,
    height: "1px",
    background: "linear-gradient(90deg,transparent,rgba(56,189,248,0.4),transparent)"
  },
  sectionTitleText: {
    margin: 0,
    fontSize: "13px",
    fontWeight: "900",
    letterSpacing: "0.5px"
  },

  actionPanel: {
    background: "#090e1a",
    border: "1px solid rgba(56, 189, 248, 0.2)",
    borderRadius: "18px",
    padding: "10px",
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: "8px",
    boxShadow: "0 10px 25px rgba(0,0,0,0.5)"
  },
  actionButton: {
    position: "relative",
    border: "1px solid rgba(255, 255, 255, 0.08)",
    background: "rgba(255, 255, 255, 0.03)",
    borderRadius: "12px",
    padding: "10px 4px",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: "4px",
    cursor: "pointer",
    transition: "all 0.2s ease"
  },
  actionIconCircle: {
    width: "34px",
    height: "34px",
    borderRadius: "10px",
    background: "rgba(56, 189, 248, 0.12)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "16px"
  },
  actionTextBox: {
    textAlign: "center",
    width: "100%"
  },
  actionTitle: {
    margin: 0,
    fontSize: "11px",
    fontWeight: "800",
    color: "#f8fafc",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis"
  },
  actionSubtitle: {
    margin: "2px 0 0",
    fontSize: "9px",
    color: "#94a3b8",
    fontWeight: "600",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis"
  },
  actionShine: {
    position: "absolute",
    right: "-12px",
    top: "-12px",
    width: "40px",
    height: "40px",
    borderRadius: "50%",
    background: "rgba(255,255,255,0.05)"
  },

  promoBanner: {
    marginTop: "16px",
    borderRadius: "18px",
    padding: "16px",
    background: "linear-gradient(135deg,#090e1a,#1e1b4b,#311042)",
    border: "1px solid rgba(168, 85, 247, 0.3)",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    boxShadow: "0 10px 25px rgba(0,0,0,0.5)"
  },
  promoContent: { flex: 1 },
  promoTitle: {
    margin: 0,
    fontSize: "15px",
    fontWeight: "900",
    color: "#f8fafc",
    lineHeight: "1.3"
  },
  promoSubtitle: {
    margin: "4px 0 0",
    fontSize: "11px",
    color: "#c084fc"
  },
  promoButton: {
    marginTop: "10px",
    border: "1px solid rgba(168, 85, 247, 0.5)",
    background: "rgba(168, 85, 247, 0.2)",
    color: "#ffffff",
    fontWeight: "900",
    fontSize: "11px",
    borderRadius: "8px",
    cursor: "pointer",
    padding: "6px 12px"
  },
  promoIcon: { fontSize: "32px" },

  trustPanel: {
    display: "grid",
    gridTemplateColumns: "repeat(2, 1fr)",
    gap: "8px",
    marginTop: "14px",
    background: "#090e1a",
    borderRadius: "16px",
    padding: "10px",
    border: "1px solid rgba(255,255,255,0.08)"
  },
  trustMiniCard: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    background: "rgba(255,255,255,0.03)",
    borderRadius: "10px",
    padding: "8px 10px",
    border: "1px solid rgba(255,255,255,0.04)"
  },
  trustIconCircle: { fontSize: "16px" },
  trustTitle: {
    margin: 0,
    fontSize: "11px",
    fontWeight: "800",
    color: "#f8fafc"
  },
  trustSubtitle: {
    margin: "2px 0 0",
    color: "#94a3b8",
    fontSize: "9px"
  },

  aboutStrip: {
    width: "100%",
    marginTop: "14px",
    padding: "12px",
    border: "1px solid rgba(56, 189, 248, 0.3)",
    background: "rgba(56, 189, 248, 0.1)",
    borderRadius: "12px",
    color: "#38bdf8",
    fontWeight: "900",
    fontSize: "12px",
    cursor: "pointer"
  },

  helpText: {
    textAlign: "center",
    color: "#34d399",
    fontSize: "14px",
    fontWeight: "900",
    marginTop: "16px",
    letterSpacing: "0.5px"
  },

  footer: {
    textAlign: "center",
    padding: "18px 4px 10px",
    color: "#94a3b8"
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
    width: "70px",
    height: "70px",
    objectFit: "contain",
    borderRadius: "14px"
  },

  bottomNav: {
    position: "fixed",
    bottom: 0, left: 0, right: 0,
    height: "56px",
    background: "#060913",
    display: "grid",
    gridTemplateColumns: "repeat(4,1fr)",
    borderTop: "1px solid rgba(56, 189, 248, 0.2)",
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
    fontSize: "10px",
    cursor: "pointer"
  },
  bottomNavItemActive: {
    background: "rgba(56, 189, 248, 0.15)",
    color: "#38bdf8"
  },
  bottomNavIcon: { fontSize: "18px" },
  bottomNavText: { fontSize: "10px", marginTop: "2px" }
};
