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

  // 👇 স্বাইপ হ্যান্ডলার স্টেট (বাঁদিক থেকে ডানদিকে টানলে সাইডবার খোলার জন্য)
  const [touchStartX, setTouchStartX] = useState(0);

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

  // 👇 স্বাইপ জেশ্চার ফাংশনালিটি
  const handleTouchStart = (e) => {
    setTouchStartX(e.touches[0].clientX);
  };

  const handleTouchEnd = (e) => {
    const touchEndX = e.changedTouches[0].clientX;
    // স্ক্রিনের বাম প্রান্ত থেকে (৫০ পিক্সেলের মধ্যে) যদি ডানদিকে ৫০ পিক্সেলের বেশি টান দেওয়া হয়
    if (touchStartX < 50 && touchEndX - touchStartX > 50) {
      setIsDrawerOpen(true);
    }
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

  // 👇 Save Money APK ডাউনলোডের জন্য হ্যান্ডলার
  const handleDownloadApp = () => {
    const link = document.createElement("a");
    link.href = "/Save Money.apk";
    link.download = "Save Money.apk";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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
      console.log("Image download error:", error);
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

          {/* SIDEBAR NAV BUTTONS (Zoomed & Enlarged) */}
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
          <p>Total Wallet</p>

          <h2>
            Scale: ₹{wallet.toFixed(2)}
          </h2>

          <span>
            👛
          </span>
        </div>
      </section>

      {/* 🟢 LIMITED OFFER ANNOUNCEMENT BAR */}
      <div style={styles.limitedOfferBar}>
        <div style={styles.marqueeContainer}>
          <div style={styles.marqueeText}>
            <span style={styles.limitedOfferBadge}>LIMITED OFFER 🔥</span>
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
          value={`₹${totalInvestment.toFixed(2)}`}
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
          <h1>
            Grow Your Money
            <br />
            Build Your Future
          </h1>

          <p>
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

      {/* 📱 APP DOWNLOAD SECTION */}
      <div style={styles.appDownloadCard}>
        <div style={styles.appDownloadHeader}>
          <img 
            src={process.env.PUBLIC_URL ? `${process.env.PUBLIC_URL}/logo512.png` : "/logo512.png"} 
            alt="Save Money Logo" 
            style={styles.appLogoImg} 
            onError={(e) => { e.target.style.display = 'none'; }}
          />
          <div>
            <h3 style={styles.appDownloadTitle}>download our save Money application</h3>
            <p style={styles.appDownloadSub}>Fast, Secure & Easy to Use</p>
          </div>
        </div>

        <button 
          style={styles.appDownloadBtn}
          onClick={handleDownloadApp}
        >
          {/* Play Store Logo SVG */}
          <svg style={{ width: "22px", height: "22px" }} viewBox="0 0 24 24">
            <path fill="#4285F4" d="M3.6,1.82C3.24,2.02 3,2.41 3,2.87V21.13C3,21.59 3.24,21.98 3.6,22.18L13.1,12.68L3.6,1.82Z" />
            <path fill="#34A853" d="M16.63,9.15L13.1,12.68L16.63,16.21L20.84,13.82C21.61,13.38 21.61,12.62 20.84,12.18L16.63,9.15Z" />
            <path fill="#EA4335" d="M3.6,1.82L13.1,11.32L16.63,7.79L5.34,1.38C4.78,1.06 4.1,1.22 3.6,1.82Z" />
            <path fill="#FBBC05" d="M3.6,22.18L13.1,12.68L16.63,16.21L5.34,22.62C4.78,22.94 4.1,22.78 3.6,22.18Z" />
          </svg>
          
          <span>Download App</span>

          {/* Download Icon SVG */}
          <svg style={{ width: "20px", height: "20px", marginLeft: "auto" }} fill="currentColor" viewBox="0 0 24 24">
            <path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"/>
          </svg>
        </button>
      </div>

      {/* FOOTER */}
      <footer style={styles.footer}>
        <h2>
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

        <p>
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

      <p style={styles.statTitle}>
        {title}
      </p>

      <h2 style={styles.statValue}>
        {value}
      </h2>

      <div style={styles.statGlow}></div>
    </div>
  );
}

function PremiumActionButton({
  icon,
  title,
  subtitle,
  gradient,
  onClick
}) {
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
      <div style={styles.actionIconCircle}>
        {icon}
      </div>

      <div style={styles.actionTextBox}>
        <h3 style={styles.actionTitle}>
          {title}
        </h3>

        <p style={styles.actionSubtitle}>
          {subtitle}
        </p>
      </div>

      <div style={styles.actionShine}></div>
    </button>
  );
}

function PremiumSectionTitle({ title, color }) {
  return (
    <div style={styles.sectionTitleWrap}>
      <div style={styles.sectionLine}></div>

      <h2
        style={{
          ...styles.sectionTitleText,
          color
        }}
      >
        {title}
      </h2>

      <div style={styles.sectionLine}></div>
    </div>
  );
}

function TrustMiniCard({ icon, title, subtitle }) {
  return (
    <div style={styles.trustMiniCard}>
      <div style={styles.trustIconCircle}>
        {icon}
      </div>

      <div>
        <h3 style={styles.trustTitle}>
          {title}
        </h3>

        <p style={styles.trustSubtitle}>
          {subtitle}
        </p>
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
  // 🟢 2ND SCREENSHOT LIMITED OFFER BAR STYLES
  limitedOfferBar: {
    marginTop: "16px",
    background: "linear-gradient(180deg, #022013 0%, #043820 100%)",
    borderRadius: "16px",
    padding: "10px 14px",
    border: "1px solid #10b981",
    boxShadow: "0 0 15px rgba(16, 185, 129, 0.2)",
    display: "flex",
    alignItems: "center"
  },
  marqueeContainer: {
    overflow: "hidden",
    whiteSpace: "nowrap",
    width: "100%"
  },
  marqueeText: {
    display: "inline-flex",
    alignItems: "center",
    gap: "10px",
    paddingLeft: "100%",
    animation: "marquee 30s linear infinite"
  },
  limitedOfferBadge: {
    background: "#f59e0b",
    color: "#000000",
    fontWeight: "900",
    fontSize: "11px",
    padding: "4px 10px",
    borderRadius: "8px",
    letterSpacing: "0.5px",
    display: "inline-block",
    boxShadow: "0 2px 6px rgba(0,0,0,0.3)"
  },
  announcementText: {
    fontSize: "13px",
    fontWeight: "700",
    color: "#ffffff"
  },

  // 👇 DRAWER STYLES
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
    width: "270px",
    height: "100vh",
    padding: "16px 12px",
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
    paddingBottom: "10px",
    borderBottom: "1px solid rgba(255, 255, 255, 0.1)",
    flexShrink: 0
  },
  drawerBrand: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "6px"
  },
  drawerLogoWrapper: {
    width: "50px",
    height: "50px",
    borderRadius: "50%",
    background: "radial-gradient(circle, #03251a 0%, #064e3b 100%)",
    border: "2px solid #22c55e",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    boxShadow: "0 0 14px rgba(34, 197, 94, 0.4)"
  },
  drawerLogoImg: {
    width: "32px",
    height: "32px",
    objectFit: "contain"
  },
  drawerLogoText: {
    margin: 0,
    fontSize: "17px",
    fontWeight: "900",
    color: "#ffffff",
    letterSpacing: "0.8px",
    textAlign: "center"
  },
  drawerLogoSubtext: {
    fontSize: "11px",
    color: "#a7f3d0",
    fontWeight: "600",
    marginTop: "2px",
    textAlign: "center"
  },
  drawerNavList: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
    flexShrink: 0,
    overflowY: "auto",
    maxHeight: "calc(100vh - 210px)"
  },
  
  // 🔍 BIGGER / ZOOMED BUTTONS FOR SIDEBAR
  drawerNavItem: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    padding: "12px 16px",
    background: "rgba(255, 255, 255, 0.12)",
    backdropFilter: "blur(10px)",
    WebkitBackdropFilter: "blur(10px)",
    border: "1px solid rgba(255, 255, 255, 0.25)",
    clipPath: "polygon(14px 0%, calc(100% - 14px) 0%, 100% 50%, calc(100% - 14px) 100%, 14px 100%, 0% 50%)",
    color: "#ffffff",
    fontSize: "15px",
    fontWeight: "800",
    cursor: "pointer",
    textAlign: "left",
    transition: "all 0.25s ease",
    boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
    textShadow: "0 1px 2px rgba(0,0,0,0.5)"
  },
  drawerNavItemActive: {
    background: "rgba(255, 255, 255, 0.3)",
    border: "1px solid #ffffff",
    boxShadow: "0 0 18px rgba(255, 255, 255, 0.5)",
    fontWeight: "900"
  },
  drawerNavIcon: {
    fontSize: "22px",
    width: "26px",
    display: "inline-block",
    textAlign: "center"
  },
  drawerNavText: {
    flex: 1,
    fontSize: "14px",
    letterSpacing: "0.4px"
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
    objectFit: "95%",
    borderRadius: "16px"
  },

  // 📱 APP DOWNLOAD CARD STYLES
  appDownloadCard: {
    marginTop: "24px",
    background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)",
    borderRadius: "20px",
    padding: "18px",
    border: "1px solid rgba(34, 197, 94, 0.4)",
    boxShadow: "0 10px 25px rgba(0,0,0,0.5)",
    display: "flex",
    flexDirection: "column",
    gap: "14px"
  },
  appDownloadHeader: {
    display: "flex",
    alignItems: "center",
    gap: "12px"
  },
  appLogoImg: {
    width: "44px",
    height: "44px",
    borderRadius: "12px",
    border: "1px solid #22c55e",
    objectFit: "contain"
  },
  appDownloadTitle: {
    margin: 0,
    fontSize: "15px",
    fontWeight: "800",
    color: "#ffffff",
    textTransform: "capitalize"
  },
  appDownloadSub: {
    margin: "2px 0 0 0",
    fontSize: "12px",
    color: "#94a3b8"
  },
  appDownloadBtn: {
    width: "100%",
    padding: "12px 16px",
    borderRadius: "14px",
    background: "linear-gradient(135deg, #22c55e 0%, #16a34a 100%)",
    border: "none",
    color: "#ffffff",
    fontWeight: "900",
    fontSize: "15px",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    gap: "10px",
    boxShadow: "0 4px 15px rgba(34, 197, 94, 0.4)"
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
    fontSize: "15px",
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
    fontSize: "18px",
    color: "#ffffff",
    margin: 0,
    fontWeight: "800",
    lineHeight: "1.4"
  },

  page: {
    minHeight: "100vh",
    background:
      "linear-gradient(180deg,#020617 0%,#031026 45%,#020617 100%)",
    color: "white",
    padding: "0 16px 160px",
    fontFamily: "Arial, sans-serif"
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
    height: "64px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between"
  },

  menuButton: {
    background: "transparent",
    border: "none",
    color: "white",
    fontSize: "30px",
    cursor: "pointer"
  },

  headerTitle: {
    margin: 0,
    fontSize: "19px",
    fontWeight: "800"
  },

  logoutBtn: {
    height: "42px",
    padding: "0 18px",
    border: "1px solid rgba(239, 68, 68, 0.4)",
    background: "rgba(239, 68, 68, 0.2)",
    backdropFilter: "blur(10px)",
    WebkitBackdropFilter: "blur(10px)",
    clipPath: "polygon(10px 0%, calc(100% - 10px) 0%, 100% 50%, calc(100% - 10px) 100%, 10px 100%, 0% 50%)",
    color: "white",
    fontWeight: "800",
    fontSize: "14px",
    boxShadow: "0 4px 14px rgba(0, 0, 0, 0.35)",
    cursor: "pointer"
  },

  notificationButton: {
    position: "relative",
    background: "transparent",
    border: "none",
    color: "white",
    fontSize: "25px",
    cursor: "pointer"
  },

  notificationBadge: {
    position: "absolute",
    top: "-6px",
    right: "-6px",
    background: "#ff1744",
    color: "white",
    width: "21px",
    height: "21px",
    borderRadius: "50%",
    fontSize: "11px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: "bold"
  },

  heroWrapper: {
    position: "relative",
    display: "flex",
    alignItems: "center",
    gap: "12px",
    padding: "16px",
    borderRadius: "24px",
    overflow: "hidden",
    background:
      "radial-gradient(circle at 90% 0%,#22ff88 0%,transparent 34%),linear-gradient(135deg,#06152d,#043858,#08c96b)",
    border: "1px solid rgba(34,255,136,0.55)",
    boxShadow: "0 0 38px rgba(34,255,136,0.23)"
  },

  heroGlow: {
    position: "absolute",
    inset: 0,
    background:
      "linear-gradient(90deg,rgba(255,255,255,0.08),transparent,rgba(255,255,255,0.08))",
    pointerEvents: "none"
  },

  profilePhotoCircle: {
    width: "82px",
    height: "82px",
    borderRadius: "50%",
    background: "#334155",
    border: "3px solid #e0f2fe",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    zIndex: 2,
    boxShadow: "0 0 16px rgba(255,255,255,0.35)"
  },

  profilePhoto: {
    width: "100%",
    height: "100%",
    objectFit: "cover"
  },

  defaultProfileIcon: {
    fontSize: "43px"
  },

  heroUserInfo: {
    flex: 1,
    zIndex: 2
  },

  heroWelcome: {
    margin: 0,
    fontSize: "15px",
    fontWeight: "800"
  },

  heroNameRow: {
    display: "flex",
    alignItems: "center",
    gap: "7px"
  },

  heroName: {
    margin: "4px 0",
    fontSize: "25px",
    fontWeight: "900",
    lineHeight: "30px"
  },

  verifiedBadge: {
    width: "22px",
    height: "22px",
    borderRadius: "50%",
    background: "#2563eb",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "12px",
    fontWeight: "bold"
  },

  heroSubtitle: {
    margin: 0,
    fontSize: "12px",
    color: "#dcfce7",
    fontWeight: "700"
  },

  heroWalletCard: {
    minWidth: "105px",
    borderRadius: "18px",
    padding: "12px",
    background: "linear-gradient(135deg,#16ff75,#00b96b)",
    boxShadow: "0 12px 25px rgba(0,0,0,0.35)",
    zIndex: 2
  },

  statsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(4,1fr)",
    gap: "12px",
    marginTop: "16px"
  },

  statCard: {
    position: "relative",
    minHeight: "120px",
    borderRadius: "20px",
    padding: "14px",
    overflow: "hidden",
    boxShadow: "0 10px 25px rgba(0,0,0,0.45)"
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
    fontSize: "29px"
  },

  statIcon: {
    fontSize: "29px"
  },

  statTitle: {
    margin: "10px 0 4px",
    color: "rgba(255,255,255,0.9)",
    fontSize: "13px",
    fontWeight: "700"
  },

  statValue: {
    margin: 0,
    fontSize: "22px",
    fontWeight: "900"
  },

  statGlow: {
    position: "absolute",
    right: "-20px",
    top: "-20px",
    width: "75px",
    height: "75px",
    borderRadius: "50%",
    background: "rgba(255,255,255,0.18)"
  },

  sectionTitleWrap: {
    margin: "25px 0 13px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "10px"
  },

  sectionLine: {
    width: "70px",
    height: "3px",
    borderRadius: "10px",
    background: "linear-gradient(90deg,transparent,#38bdf8,#facc15,transparent)"
  },

  sectionTitleText: {
    margin: 0,
    fontSize: "19px",
    fontWeight: "900",
    letterSpacing: "1px"
  },

  actionPanel: {
    background: "linear-gradient(180deg,#061936,#07101e)",
    border: "2px solid #1d4ed8",
    borderRadius: "26px",
    padding: "14px",
    display: "grid",
    gridTemplateColumns: "repeat(3,1fr)",
    gap: "14px",
    boxShadow: "inset 0 0 35px rgba(59,130,246,0.25)"
  },

  actionButton: {
    position: "relative",
    border: "1px solid rgba(255, 255, 255, 0.25)",
    background: "rgba(255, 255, 255, 0.12)",
    backdropFilter: "blur(12px)",
    WebkitBackdropFilter: "blur(12px)",
    clipPath: "polygon(14px 0%, calc(100% - 14px) 0%, 100% 50%, calc(100% - 14px) 100%, 14px 100%, 0% 50%)",
    minHeight: "120px",
    color: "white",
    padding: "14px",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",
    overflow: "hidden",
    boxShadow: "0 10px 26px rgba(0,0,0,0.45)",
    cursor: "pointer"
  },

  actionIconCircle: {
    width: "46px",
    height: "46px",
    borderRadius: "16px",
    background: "rgba(255,255,255,0.22)",
    backdropFilter: "blur(8px)",
    WebkitBackdropFilter: "blur(8px)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "28px",
    boxShadow: "inset 0 0 12px rgba(255,255,255,0.2)"
  },

  actionTextBox: {
    textAlign: "center",
    zIndex: 2
  },

  actionTitle: {
    margin: 0,
    fontSize: "14px",
    fontWeight: "900"
  },

  actionSubtitle: {
    margin: "4px 0 0",
    fontSize: "11px",
    color: "rgba(255,255,255,0.92)",
    fontWeight: "700"
  },

  actionShine: {
    position: "absolute",
    right: "-22px",
    top: "-22px",
    width: "70px",
    height: "70px",
    borderRadius: "50%",
    background: "rgba(255,255,255,0.15)"
  },

  actionInvest: {
    background: "rgba(0, 255, 117, 0.15)",
    border: "1px solid rgba(0, 255, 117, 0.35)"
  },
  actionMyInvestment: {
    background: "rgba(0, 180, 255, 0.15)",
    border: "1px solid rgba(0, 180, 255, 0.35)"
  },
  actionWallet: {
    background: "rgba(217, 70, 239, 0.15)",
    border: "1px solid rgba(217, 70, 239, 0.35)"
  },
  actionWithdraw: {
    background: "rgba(255, 107, 0, 0.15)",
    border: "1px solid rgba(255, 107, 0, 0.35)"
  },
  actionRefer: {
    background: "rgba(255, 0, 122, 0.15)",
    border: "1px solid rgba(255, 0, 122, 0.35)"
  },
  actionTransaction: {
    background: "rgba(0, 229, 255, 0.15)",
    border: "1px solid rgba(0, 229, 255, 0.35)"
  },
  actionKyc: {
    background: "rgba(0, 245, 255, 0.15)",
    border: "1px solid rgba(0, 245, 255, 0.35)"
  },
  actionReward: {
    background: "rgba(168, 85, 247, 0.15)",
    border: "1px solid rgba(168, 85, 247, 0.35)"
  },
  actionBank: {
    background: "rgba(255, 183, 3, 0.15)",
    border: "1px solid rgba(255, 183, 3, 0.35)"
  },
  actionPlan: {
    background: "rgba(0, 176, 255, 0.15)",
    border: "1px solid rgba(0, 176, 255, 0.35)"
  },
  actionNotification: {
    background: "rgba(255, 23, 68, 0.15)",
    border: "1px solid rgba(255, 23, 68, 0.35)"
  },
  actionSupport: {
    background: "rgba(0, 255, 117, 0.15)",
    border: "1px solid rgba(0, 255, 117, 0.35)"
  },

  promoBanner: {
    marginTop: "18px",
    borderRadius: "23px",
    padding: "20px",
    background:
      "linear-gradient(135deg,#4c1d95,#8b00ff,#9d00ff)",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    boxShadow: "0 10px 28px rgba(126,34,206,0.35)"
  },

  promoContent: {
    flex: 1
  },

  promoButton: {
    marginTop: "12px",
    border: "1px solid rgba(250, 204, 21, 0.5)",
    background: "rgba(250, 204, 21, 0.2)",
    backdropFilter: "blur(10px)",
    WebkitBackdropFilter: "blur(10px)",
    clipPath: "polygon(10px 0%, calc(100% - 10px) 0%, 100% 50%, calc(100% - 10px) 100%, 10px 100%, 0% 50%)",
    color: "#ffffff",
    fontWeight: "900",
    cursor: "pointer",
    padding: "10px 18px"
  },

  promoIcon: {
    fontSize: "55px"
  },

  trustPanel: {
    display: "grid",
    gridTemplateColumns: "repeat(4,1fr)",
    gap: "10px",
    marginTop: "14px",
    background: "#071831",
    borderRadius: "22px",
    padding: "12px",
    border: "2px solid #1e40af"
  },

  trustMiniCard: {
    display: "flex",
    alignItems: "center",
    gap: "99px",
    fontSize: "12px",
    background: "rgba(15,23,42,0.65)",
    borderRadius: "15px",
    padding: "10px"
  },

  trustIconCircle: {
    fontSize: "24px"
  },

  trustTitle: {
    margin: 0,
    fontSize: "13px"
  },

  trustSubtitle: {
    margin: "3px 0 0",
    color: "#94a3b8",
    fontSize: "11px"
  },

  aboutStrip: {
    width: "calc(100% + 32px)",
    marginLeft: "-16px",
    marginTop: "20px",
    padding: "15px",
    border: "1px solid rgba(6, 182, 212, 0.4)",
    background: "rgba(6, 182, 212, 0.2)",
    backdropFilter: "blur(10px)",
    WebkitBackdropFilter: "blur(10px)",
    clipPath: "polygon(15px 0%, calc(100% - 15px) 0%, 100% 50%, calc(100% - 15px) 100%, 15px 100%, 0% 50%)",
    color: "white",
    fontWeight: "900",
    fontSize: "15px",
    cursor: "pointer"
  },

  helpText: {
    textAlign: "center",
    color: "#22ff73",
    fontSize: "22px",
    fontWeight: "900",
    marginTop: "22px"
  },

  footer: {
    textAlign: "center",
    padding: "24px 4px",
    color: "#87CEEB"
  },

  footerLinks: {
    display: "flex",
    flexWrap: "wrap",
    gap: "10px",
    justifyContent: "center",
    marginBottom: "12px"
  },

  footerLinkBtn: {
    background: "transparent",
    border: "none",
    color: "#38bdf8",
    fontSize: "12px",
    fontWeight: "700",
    cursor: "pointer"
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
    height: "62px",
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
    fontSize: "12px",
    cursor: "pointer"
  },

  bottomNavItemActive: {
    background: "#0f2a5c",
    color: "white"
  },

  bottomNavIcon: {
    fontSize: "21px"
  },

  bottomNavText: {
    fontSize: "10px",
    marginTop: "3px"
  }
};

const styleSheet = document.styleSheets[0];
const keyframes = `
@keyframes marquee {
  0% { transform: translate3d(0, 0, 0); }
  100% { transform: translate3d(-100%, 0, 0); }
}
`;
try {
  styleSheet.insertRule(keyframes, styleSheet.cssRules.length);
} catch (e) {}
