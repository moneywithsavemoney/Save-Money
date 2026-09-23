import { useEffect, useMemo, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { toast } from "react-toastify";
import { API } from "../config";

export default function SaveMoney() {
  // =========================================================================
  // ROUTING & NAVIGATION FRAMEWORK INTERFACES
  // =========================================================================
  const navigate = useNavigate();
  const location = useLocation();

  // =========================================================================
  // PERSISTENT MEMORY EXTRADITION SECURITY STORAGE KEYS
  // =========================================================================
  const email = localStorage.getItem("email") || "";
  const token = localStorage.getItem("token") || "";
  const localName = localStorage.getItem("name") || "User";

  // =========================================================================
  // SIDEBAR STATE
  // =========================================================================
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isDownloadingPlan, setIsDownloadingPlan] = useState(false);

  // =========================================================================
  // REACTOR CORE STATE CONFIGURATOR INDICES
  // =========================================================================
  const [user, setUser] = useState({});
  const [balance, setBalance] = useState(0);
  const [amount, setAmount] = useState("");
  const [years, setYears] = useState(5);
  const [accepted, setAccepted] = useState(false);
  const [termsOpen, setTermsOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  // =========================================================================
  // COUPON & DISCOUNT STATE CONFIGURATIONS
  // =========================================================================
  const [couponCode, setCouponCode] = useState("");
  const [discountAmount, setDiscountAmount] = useState(0);
  const [appliedCouponName, setAppliedCouponName] = useState("");

  // =========================================================================
  // VISUAL OVERLAY SHEATH NOTIFIER STATES
  // =========================================================================
  const [statusOverlay, setStatusOverlay] = useState({
    show: false,
    type: "info",
    message: ""
  });

  // =========================================================================
  // HOVER INTERACTIVE SELECTION MAP UNITS
  // =========================================================================
  const [hoveredCard, setHoveredCard] = useState(null);
  const [activeInputFocus, setActiveInputFocus] = useState(false);
  const [activeCouponFocus, setActiveCouponFocus] = useState(false);
  const [hoveredTenureNode, setHoveredTenureNode] = useState(null);

  // =========================================================================
  // TRANSACTION FEEDBACK HUD EMITTER MODULE
  // =========================================================================
  const showStatusMsg = (type, message) => {
    setStatusOverlay({ show: true, type, message });
    setTimeout(() => {
      setStatusOverlay({ show: false, type: "info", message: "" });
    }, 3000);
  };

  // =========================================================================
  // SCROLL TIMING CORRECTION RUNNER
  // =========================================================================
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
  }, []);

  // =========================================================================
  // CORE WALLET BALANCE API SYNCHRONIZER
  // =========================================================================
  useEffect(() => {
    loadBalance();
  }, []);

  const loadBalance = async () => {
    try {
      const res = await fetch(`${API}/dashboard`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          authorization: token || ""
        },
        body: JSON.stringify({ email })
      });

      const data = await res.json();
      setUser(data || {});
      setBalance(Number(data.balance || data.wallet || data.totalWallet || 0));
    } catch (err) {
      console.log("CRITICAL WALLET BALANCE SYNC ERROR:", err);
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

  // =========================================================================
  // MATRIX RETRIEVAL DICTIONARY FOR YIELD PERCENTAGE INTEREST
  // =========================================================================
  const getRate = (y) => {
    if (Number(y) === 1) return 11;
    if (Number(y) === 3) return 14;
    if (Number(y) === 5) return 20;
    if (Number(y) === 10) return 24;
    if (Number(y) === 15) return 27;
    return 30;
  };

  const rate = getRate(years);

  // =========================================================================
  // COUPON APPLICATION HANDLER LOGIC
  // =========================================================================
  const handleApplyCoupon = () => {
    const code = couponCode.trim().toUpperCase();
    if (!code) {
      showStatusMsg("error", "Please enter a valid coupon code");
      return;
    }

    if (code === "SAVE300") {
      const sipAmt = Number(amount || 0);
      if (sipAmt <= 300) {
        showStatusMsg("error", "SIP amount must be greater than discount amount");
        return;
      }
      setDiscountAmount(300);
      setAppliedCouponName("SAVE300");
      showStatusMsg("success", "Coupon Applied Successfully! ₹300 OFF 🎉");
    } else {
      showStatusMsg("error", "Invalid or expired coupon code");
    }
  };

  const handleRemoveCoupon = () => {
    setDiscountAmount(0);
    setAppliedCouponName("");
    setCouponCode("");
    showStatusMsg("info", "Coupon removed");
  };

  // =========================================================================
  // MATHEMATICAL ACCELERATED COMPOUNDING CALCULATOR VECTOR ENGINE
  // =========================================================================
  const calc = useMemo(() => {
    const monthly = Number(amount || 0);
    const annualRate = Number(rate || 0);
    const totalYears = Number(years || 1);
    const r = annualRate / 100 / 12;
    const n = totalYears * 12;

    let maturityAmount = 0;
    let totalInterest = 0;

    if (r > 0) {
      maturityAmount = monthly * ((Math.pow(1 + r, n) - 1) / r) * (1 + r);
      totalInterest = maturityAmount - (monthly * n);
    } else {
      maturityAmount = monthly * n;
      totalInterest = 0;
    }

    const finalPayableToday = Math.max(0, monthly - discountAmount);

    return {
      monthly,
      totalInvestment: monthly * n,
      estimatedReturn: totalInterest,
      totalInterest,
      totalReturn: maturityAmount,
      finalPayableToday
    };
  }, [amount, years, rate, discountAmount]);

  // =========================================================================
  // HIGH DEFINITION LOCAL CURRENCY CONVERTER FORMATTER (INR)
  // =========================================================================
  const money = (n) => {
    return `₹ ${Number(n || 0).toLocaleString("en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })}`;
  };

  // =========================================================================
  // MODAL TRIGGER HANDLERS AND DISPATCH CONTROLLERS
  // =========================================================================
  const openTerms = () => {
    if (accepted) {
      setAccepted(false);
      return;
    }
    setTermsOpen(true);
  };

  // =========================================================================
  // TRANSACTION TRANSMISSION ARCHITECTURE COMMIT (API HANDLER)
  // =========================================================================
  const confirmSip = async () => {
    if (Number(amount) < 2000) {
      showStatusMsg("error", "Minimum SIP amount ₹2000 required");
      return toast.info("Minimum SIP amount ₹2000 required");
    }

    if (!accepted) {
      setTermsOpen(true);
      return;
    }

    if (Number(balance) < calc.finalPayableToday) {
      showStatusMsg("error", "Insufficient wallet balance for discounted SIP");
      return toast.error("Insufficient wallet balance");
    }

    try {
      setLoading(true);
      const res = await fetch(`${API}/start-invest`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          authorization: token || ""
        },
        body: JSON.stringify({
          email,
          amount: Number(amount),
          discountApplied: Number(discountAmount),
          finalDeductedAmount: Number(calc.finalPayableToday),
          monthlyReturn: Number(amount),
          years: Number(years),
          rate: Number(rate),
          totalPlanAmount: Number(calc.totalInvestment),
          totalInterest: Number(calc.totalInterest),
          maturityAmount: Number(calc.totalReturn)
        })
      });

      const data = await res.json();

      if (data.msg === "Token expired or invalid") {
        localStorage.clear();
        showStatusMsg("error", "Session expired. Logging out.");
        setTimeout(() => { window.location.href = "/login"; }, 2000);
        return;
      }

      if (data.success) {
        showStatusMsg("success", data.msg || "SIP Plan Started Successfully! 🌱");
        setAmount("");
        setDiscountAmount(0);
        setCouponCode("");
        setAppliedCouponName("");
        setAccepted(false);
        loadBalance();
      } else {
        showStatusMsg("info", data.msg || "Could not complete transaction");
      }
    } catch (err) {
      console.log("START SIP SYSTEM REJECTION DISPATCH ERROR:", err);
      showStatusMsg("error", "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.cyberPageWrapper}>
      {/* VIRTUALIZED LAYER INFRASTRUCTURE CORES */}
      <div style={styles.neonMatrixGrid}></div>
      <div style={styles.dynamicAuraSphere1}></div>
      <div style={styles.dynamicAuraSphere2}></div>
      <div style={styles.dynamicAuraSphere3}></div>

      {/* হোম পেজের মতো সাইডবার ড্রয়ার (Side-by-Side Drawer with Tree Plant) */}
      <div style={{
        ...styles.drawerOverlay,
        opacity: sidebarOpen ? 1 : 0,
        visibility: sidebarOpen ? "visible" : "hidden"
      }} onClick={() => setSidebarOpen(false)}>
        <div style={{
          ...styles.drawerContainer,
          transform: sidebarOpen ? "translateX(0)" : "translateX(-100%)"
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
                onClick={() => { navigate("/home"); setSidebarOpen(false); }}
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
                onClick={() => { navigate("/my-investment"); setSidebarOpen(false); }}
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
                onClick={() => { navigate("/save-money"); setSidebarOpen(false); }}
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
                onClick={() => { navigate("/one-time"); setSidebarOpen(false); }}
              >
                <span style={styles.drawerNavIcon}>⚡</span>
                <span style={styles.drawerNavText}>One Time</span>
              </button>

              <button 
                style={{
                  ...styles.drawerNavItem,
                  ...styles.drawerNavPlan
                }} 
                onClick={() => { handleDownloadPlan(); setSidebarOpen(false); }}
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
                onClick={() => { navigate("/wallet"); setSidebarOpen(false); }}
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
                onClick={() => { navigate("/refer"); setSidebarOpen(false); }}
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
                onClick={() => { navigate("/withdraw"); setSidebarOpen(false); }}
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
                onClick={() => { navigate("/daily-reward"); setSidebarOpen(false); }}
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
                onClick={() => { navigate("/investment-assistant"); setSidebarOpen(false); }}
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
                onClick={() => { navigate("/support"); setSidebarOpen(false); }}
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
                onClick={() => { navigate("/kyc"); setSidebarOpen(false); }}
              >
                <span style={styles.drawerNavIcon}>👤</span>
                <span style={styles.drawerNavText}>Profile</span>
              </button>

              <button 
                style={{
                  ...styles.drawerNavItem,
                  ...styles.drawerNavLogout
                }} 
                onClick={() => { setSidebarOpen(false); handleLogout(); }}
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

      {/* TOP DEPLOYMENT LEDGER BAR MONITOR */}
      <div style={styles.vipStatusBar}>
        <div style={styles.vipStatusIndicator}>
          <span style={styles.pulseNode}></span> LIVE CONNECTION SECURE
        </div>
        <div style={styles.vipTimestamp}>HIGH SPEED AUTO-COMPOUND ENGINE ACTIVE</div>
      </div>

      {/* SECURE POPUP SHIELD RADAR INTERFACE */}
      {statusOverlay.show && (
        <div style={styles.glassOverlayShield}>
          <div style={{
            ...styles.glassOverlayContainer,
            borderBottom: statusOverlay.type === "success" ? "4px solid #00ffa3" : statusOverlay.type === "error" ? "4px solid #ff4a4a" : "4px solid #00d2ff"
          }}>
            <div style={{
              ...styles.glassOverlayIconFrame,
              backgroundColor: statusOverlay.type === "success" ? "rgba(0,255,163,0.1)" : statusOverlay.type === "error" ? "rgba(255,74,74,0.1)" : "rgba(0,210,255,0.1)",
              color: statusOverlay.type === "success" ? "#00ffa3" : statusOverlay.type === "error" ? "#ff4a4a" : "#00d2ff"
            }}>
              {statusOverlay.type === "success" ? "✓" : statusOverlay.type === "error" ? "✕" : "⚡"}
            </div>
            <p style={styles.glassOverlayMessageText}>{statusOverlay.message}</p>
          </div>
        </div>
      )}

      {/* EXPANDED SYSTEM VIEW SCREEN ELEMENT CANVAS */}
      <div style={styles.ultimateMainCanvas}>
        
        {/* HELM HEAD ROW ACTION PACK CONTROLLERS */}
        <div style={styles.controlHelmRow}>
          <button 
            style={styles.hamburgerBtn}
            onClick={() => setSidebarOpen(true)}
          >
            ☰
          </button>

          <button 
            style={{...styles.helmActionBtn, ...(hoveredCard === 'back' ? styles.helmActionBtnHover : {})}}
            onMouseEnter={() => setHoveredCard('back')}
            onMouseLeave={() => setHoveredCard(null)}
            onClick={() => window.history.back()}
          >
            <span style={styles.helmBtnIcon}>◀</span> RETURN DASHBOARD
          </button>
          
          <div style={styles.helmCenterBadge}>
            <span style={styles.goldTextBadge}>QUANTUM VIP NETWORK ACCESS</span>
          </div>

          <button 
            style={{...styles.helmHelpBtn, ...(hoveredCard === 'help' ? styles.helmHelpBtnHover : {})}}
            onMouseEnter={() => setHoveredCard('help')}
            onMouseLeave={() => setHoveredCard(null)}
            onClick={() => setHelpOpen(true)}
          >
            ASSISTANT CORE <span style={styles.helpQuestionMark}>?</span>
          </button>
        </div>

        {/* MAXIMUM HIGH CONTRAST EXHILARATING HERO TITLE BRAND */}
        <header style={styles.cyberBrandHeaderSection}>
          <div style={styles.cyberLogoHexagonWrap}>
            <div style={styles.cyberLogoCoreElement}>
              <span style={styles.cyberLogoSymbolText}>₹</span>
            </div>
            {/* স্ক্রিনশটে মার্ক করা অ্যানিমেশন ঠিক করা হলো (অরবিট লাইন সচল ও প্রোপার রোটেশন অ্যানিমেশন সহ) */}
            <div style={styles.cyberLogoOrbitLine1}></div>
            <div style={styles.cyberLogoOrbitLine2}></div>
          </div>
          <h1 style={styles.cyberMainTitleText}>
            SAVE <span style={styles.cyberMainTitleHighlight}>MONEY</span>
          </h1>
          <div style={styles.cyberBrandDividerLine}>
            <div style={styles.cyberDividerCoreGlow}></div>
          </div>
          <p style={styles.cyberBrandSubtextPara}>INTELLIGENT WEALTH GENERATION SYSTEM</p>
        </header>

        {/* বক্স দুটোকে পাশাপাশি (Side-by-Side) করার লেআউট */}
        <div style={styles.executiveTwinControlLayout}>
          
          {/* ZONE BLOCK 1: WALLET ASSET CONSOLE */}
          <div style={styles.executivePanelZone}>
            <section 
              style={{...styles.cyberLuxuryCardUnit, ...(hoveredCard === 'wallet' ? styles.cyberLuxuryCardUnitHover : {})}}
              onMouseEnter={() => setHoveredCard('wallet')}
              onMouseLeave={() => setHoveredCard(null)}
            >
              <div style={styles.cardGlowCornerTop}></div>
              <div style={styles.cardHeaderFlexBox}>
                <div style={styles.cardTitleBadgeRow}>
                  <div style={styles.cardHeaderIconBoxContainer}>💳</div>
                  <h3 style={styles.cardHeaderMainTitleText}>SECURE WALLET MANAGEMENT</h3>
                </div>
                <span style={styles.onlinePulseStatusText}>ONLINE POOL</span>
              </div>

              <div style={styles.walletBalanceDisplayBlock}>
                <div style={styles.walletMetaLabelRow}>
                  <span style={styles.walletMetaLabel}>LIQUID CAPITAL AVAILABILITY</span>
                  <span style={styles.walletSecureShieldTag}>🔒 256-BIT CRYPTO VAULT</span>
                </div>
                <div style={styles.walletLargeNumericalSum}>
                  {money(balance)}
                </div>
                <div style={styles.walletProgressIndicatorTrack}>
                  <div style={styles.walletProgressIndicatorFillBar}></div>
                </div>
                <div style={styles.walletBottomCapLabelFlex}>
                  <span style={styles.walletCapSubtextText}>Status: Fully Eligible for Immediate Auto-Investment</span>
                  <span style={styles.walletCapPercentageText}>100% Verified</span>
                </div>
              </div>

              {/* কুপন সেকশন */}
              <div style={styles.couponSectionContainer}>
                <div style={styles.inputFieldLabelFlexHeader}>
                  <span style={styles.inputFieldMainTitleLabel}>HAVE A PROMO / COUPON CODE?</span>
                  {appliedCouponName && <span style={styles.couponAppliedBadge}>APPLIED: {appliedCouponName}</span>}
                </div>

                {!appliedCouponName ? (
                  <div style={{
                    ...styles.cyberInputWrapperGlassBox,
                    borderColor: activeCouponFocus ? "#00ffa3" : "#334155",
                    boxShadow: activeCouponFocus ? "0 0 20px rgba(0,255,163,0.15)" : "none",
                    height: "52px"
                  }}>
                    <input
                      style={styles.cyberInputActualInputElement}
                      type="text"
                      value={couponCode}
                      onFocus={() => setActiveCouponFocus(true)}
                      onBlur={() => setActiveCouponFocus(false)}
                      onChange={(e) => setCouponCode(e.target.value)}
                      placeholder="e.g. SAVE300"
                    />
                    <button 
                      style={styles.applyCouponBtnElement}
                      onClick={handleApplyCoupon}
                    >
                      APPLY
                    </button>
                  </div>
                ) : (
                  <div style={styles.appliedCouponInfoBox}>
                    <span style={styles.appliedCouponSuccessText}>🎟️ {appliedCouponName} Applied (-₹{discountAmount} Off)</span>
                    <button style={styles.removeCouponBtn} onClick={handleRemoveCoupon}>Remove</button>
                  </div>
                )}
              </div>

              <button 
                style={styles.walletActionInjectFundsBtn}
                onClick={() => navigate("/wallet")}
              >
                <span style={styles.btnAccentPlusSymbol}>+</span> DEPOSIT FRESH CAPITAL INTO POOL
              </button>
            </section>
          </div>

          {/* ZONE BLOCK 2: SIP CONGREGATION INPUT METRICS CONFIGS */}
          <div style={styles.executivePanelZone}>
            <section 
              style={{...styles.cyberLuxuryCardUnit, ...(hoveredCard === 'config' ? styles.cyberLuxuryCardUnitHover : {})}}
              onMouseEnter={() => setHoveredCard('config')}
              onMouseLeave={() => setHoveredCard(null)}
            >
              <div style={styles.cardGlowCornerTopAccent}></div>
              <div style={styles.cardHeaderFlexBox}>
                <div style={styles.cardTitleBadgeRow}>
                  <div style={styles.cardHeaderIconBoxContainerAccent}>🌱</div>
                  <h3 style={styles.cardHeaderMainTitleText}>ASSET DEPLOYMENT CALIBRATION</h3>
                </div>
                <span style={styles.onlinePulseStatusTextAccent}>CONFIG READY</span>
              </div>

              {/* MONETARY MAGNITUDE CONTROLLER ENTRY */}
              <div style={styles.inputFieldComplexContainer}>
                <div style={styles.inputFieldLabelFlexHeader}>
                  <span style={styles.inputFieldMainTitleLabel}>CHOOSE MONTHLY COMMITMENT AMOUNT</span>
                  <span style={styles.inputFieldRightHandBadge}>MINIMUM BOUNDARY REQUIRED</span>
                </div>
                <div style={{
                  ...styles.cyberInputWrapperGlassBox,
                  borderColor: activeInputFocus ? "#00ffa3" : "#334155",
                  boxShadow: activeInputFocus ? "0 0 20px rgba(0,255,163,0.15)" : "none"
                }}>
                  <div style={styles.cyberInputPrependCurrencySymbol}>₹</div>
                  <input
                    style={styles.cyberInputActualInputElement}
                    type="number"
                    value={amount}
                    onFocus={() => setActiveInputFocus(true)}
                    onBlur={() => setActiveInputFocus(false)}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="Enter Custom Investment Capital"
                  />
                  <div style={styles.cyberInputAppendBadgeUnit}>
                    <span style={styles.cyberInputAppendBadgeText}>INR VALUES</span>
                  </div>
                </div>

                {Number(amount || 0) > 0 && Number(amount) < 2000 && (
                  <div style={styles.cyberValidationWarningAlertBox}>
                    <span style={styles.validationWarningIcon}>⚠️</span> 
                    <span style={styles.validationWarningText}>System Threshold Warning: Minimum required configuration is ₹2000</span>
                  </div>
                )}
              </div>

              {/* TENURE SELECTION LAYOUT */}
              <div style={styles.tenureSelectionStructureBox}>
                <div style={styles.inputFieldLabelFlexHeader}>
                  <span style={styles.inputFieldMainTitleLabel}>SELECT ASSET ACCUMULATION TIMEFRAME</span>
                  <span style={styles.inputFieldRightHandBadgeAccent}>ROI SCALING SYSTEM ACTIVE</span>
                </div>

                <div style={styles.tenureGridSelectorLayoutMatrix}>
                  {[1, 3, 5, 10, 15, 20].map((y) => {
                    const isSelected = years === y;
                    const isNodeHovered = hoveredTenureNode === y;
                    
                    return (
                      <button
                        key={y}
                        style={{
                          ...styles.tenureSelectorNodeItemButton,
                          backgroundColor: isSelected 
                            ? "#00ffa3" 
                            : isNodeHovered 
                              ? "rgba(255, 255, 255, 0.15)" 
                              : "#1e293b",
                          borderColor: isSelected 
                            ? "#ffffff" 
                            : isNodeHovered 
                              ? "#00ffa3" 
                              : "#475569",
                          boxShadow: isSelected 
                            ? "0 0 20px rgba(0, 255, 163, 0.4)" 
                            : "none"
                        }}
                        onMouseEnter={() => setHoveredTenureNode(y)}
                        onMouseLeave={() => setHoveredTenureNode(null)}
                        onClick={() => setYears(y)}
                      >
                        <div style={{
                          ...styles.tenureNodeYearLabelText,
                          color: isSelected ? "#020617" : "#ffffff"
                        }}>
                          {y} {y === 1 ? "YEAR PLAN" : "YEARS PLAN"}
                        </div>
                        <div style={{
                          ...styles.tenureNodePercentageSubBadge,
                          color: isSelected ? "#090d16" : "#00ffa3"
                        }}>
                          Yield Rate: {getRate(y)}%
                        </div>
                        {isSelected && <div style={styles.tenureNodeSelectionCheckIndicatorCircle}>✓</div>}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* PAYMENT BREAKDOWN SUMMARY */}
              {Number(amount) > 0 && (
                <div style={styles.paymentSummaryBox}>
                  <div style={styles.summaryRow}>
                    <span>SIP Amount:</span>
                    <span>{money(amount)}</span>
                  </div>
                  {discountAmount > 0 && (
                    <div style={{...styles.summaryRow, color: "#00ffa3"}}>
                      <span>Coupon Discount:</span>
                      <span>- {money(discountAmount)}</span>
                    </div>
                  )}
                  <div style={{...styles.summaryRow, borderTop: "1px solid rgba(255,255,255,0.1)", paddingTop: "8px", fontWeight: "bold"}}>
                    <span>Deducted from Wallet (This Time):</span>
                    <span style={{color: "#00d2ff"}}>{money(calc.finalPayableToday)}</span>
                  </div>
                </div>
              )}

              {/* SYSTEM INFORMATIONAL BAR */}
              <div style={styles.adviceSystemBarWrapperBox}>
                <div style={styles.adviceSystemLightBulbIcon}>💡</div>
                <div style={styles.adviceSystemTextBodyBlock}>
                  <strong>Compounding Multiplier Alert:</strong> Selection of a tenure exceeding 5 Years triggers exponential growth modules, maximizing capital retention and interest yield loops.
                </div>
              </div>

            </section>
          </div>

        </div>

        {/* BOTTOM SECTION SEPARATOR */}
        <div style={styles.compoundingHeaderSeparatorBlock}>
          <div style={styles.separatorLineDecorativeLeft}></div>
          <span style={styles.separatorCentralHeadlineTitleText}>LIVE ASSET PROJECTION DATA SHEETS</span>
          <div style={styles.separatorLineDecorativeRight}></div>
        </div>

        {/* ৪টি বক্স উপরে দুটো নিচে দুটো (2x2 Grid) করার লেআউট */}
        <div style={styles.projectionGrid2x2Layout}>
          
          <div style={{...styles.projectionDataMetricsCardCellBlock, borderLeft: "5px solid #00ffa3"}}>
            <div style={styles.projectionCellTopMetaLine}>
              <div style={{...styles.projectionCellIconCircleBox, color: "#00ffa3", backgroundColor: "rgba(0,255,163,0.1)"}}>📈</div>
              <span style={styles.projectionCellMetaTitleLabelText}>ESTIMATED COMPOUNDING RETURNS</span>
            </div>
            <div style={{...styles.projectionCellBigMetricValueText, color: "#00ffa3"}}>
              {money(calc.estimatedReturn)}
            </div>
            <div style={styles.projectionCellBottomStatusBarTrack}>
              <div style={{...styles.projectionCellStatusFillColorBar, backgroundColor: "#00ffa3", width: "85%"}}></div>
            </div>
            <p style={styles.projectionCellFooterNarrativeText}>Estimated return accrual across selected timeline framework matrix.</p>
          </div>

          <div style={{...styles.projectionDataMetricsCardCellBlock, borderLeft: "5px solid #00d2ff"}}>
            <div style={styles.projectionCellTopMetaLine}>
              <div style={{...styles.projectionCellIconCircleBox, color: "#00d2ff", backgroundColor: "rgba(0,210,255,0.1)"}}>👛</div>
              <span style={styles.projectionCellMetaTitleLabelText}>TOTAL DEPLOYED PRINCIPAL CAPITAL</span>
            </div>
            <div style={{...styles.projectionCellBigMetricValueText, color: "#00d2ff"}}>
              {money(calc.totalInvestment)}
            </div>
            <div style={styles.projectionCellBottomStatusBarTrack}>
              <div style={{...styles.projectionCellStatusFillColorBar, backgroundColor: "#00d2ff", width: "60%"}}></div>
            </div>
            <p style={styles.projectionCellFooterNarrativeText}>Total cumulative sum of sequential net monthly deposits performed.</p>
          </div>

          <div style={{...styles.projectionDataMetricsCardCellBlock, borderLeft: "5px solid #ffb800"}}>
            <div style={styles.projectionCellTopMetaLine}>
              <div style={{...styles.projectionCellIconCircleBox, color: "#ffb800", backgroundColor: "rgba(255,184,0,0.1)"}}>🪙</div>
              <span style={styles.projectionCellMetaTitleLabelText}>NET COMPREHENSIVE INTEREST EARNED</span>
            </div>
            <div style={{...styles.projectionCellBigMetricValueText, color: "#ffb800"}}>
              {money(calc.totalInterest)}
            </div>
            <div style={styles.projectionCellBottomStatusBarTrack}>
              <div style={{...styles.projectionCellStatusFillColorBar, backgroundColor: "#ffb800", width: "70%"}}></div>
            </div>
            <p style={styles.projectionCellFooterNarrativeText}>Pure asset yield generation extracted via algorithmic standard interest modules.</p>
          </div>

          <div style={{...styles.projectionDataMetricsCardCellBlock, borderLeft: "5px solid #cc00ff"}}>
            <div style={styles.projectionCellTopMetaLine}>
              <div style={{...styles.projectionCellIconCircleBox, color: "#cc00ff", backgroundColor: "rgba(204,0,255,0.1)"}}>📊</div>
              <span style={styles.projectionCellMetaTitleLabelText}>ESTIMATED MATURITY ASSET VALUE</span>
            </div>
            <div style={{...styles.projectionCellBigMetricValueText, color: "#cc00ff"}}>
              {money(calc.totalReturn)}
            </div>
            <div style={styles.projectionCellBottomStatusBarTrack}>
              <div style={{...styles.projectionCellStatusFillColorBar, backgroundColor: "#cc00ff", width: "95%"}}></div>
            </div>
            <p style={styles.projectionCellFooterNarrativeText}>Total forecasted terminal capital extraction sum upon maturity event fulfillment.</p>
          </div>

        </div>

        {/* DISCLAIMER */}
        <div style={styles.systemAnalyticalDisclaimerBox}>
          <span style={styles.disclaimerIconInfoBadge}>i</span>
          <span style={styles.disclaimerTextMessagePara}>
            Mathematical forecasting projection model operates under high-fidelity compounding interest matrix calculations. Historical performance criteria configurations represent standard index projections.
          </span>
        </div>

        {/* LEGAL DECLARATION */}
        <div style={styles.legalComplianceActionShieldContainerBox}>
          <div 
            style={{...styles.legalInteractiveClickableRowBox, ...(accepted ? styles.legalInteractiveClickableRowBoxActive : {})}}
            onClick={openTerms}
          >
            <div style={{
              ...styles.legalCustomCheckboxSquareBox,
              backgroundColor: accepted ? "#00ffa3" : "#1e293b",
              borderColor: accepted ? "#00ffa3" : "#94a3b8"
            }}>
              {accepted && <span style={styles.legalCheckboxCheckMarkCheck}>✓</span>}
            </div>
            <div style={styles.legalTextStatementColumnLabelBlock}>
              <p style={styles.legalMainDeclarationSentenceText}>
                I hereby declare, authorize and confirm that I have meticulously read, verified and mutually consented to be legally bound by the comprehensive system-wide <b style={styles.legalHighLightHyperlinkText}>Terms, Conditions, Asset Allocation Disclosures & Risk Protocols</b>.
              </p>
            </div>
            <div style={{...styles.legalPaperDocumentIconBadgeUnit, color: accepted ? "#00ffa3" : "#cbd5e1"}}>📄</div>
          </div>
        </div>

        {/* LAUNCH BUTTON */}
        <div style={styles.ultimateLaunchButtonCentralContainerFlex}>
          <button 
            style={{
              ...styles.ultimateLaunchCoreActionBtnElement,
              opacity: loading ? 0.7 : 1,
              cursor: loading ? "not-allowed" : "pointer"
            }} 
            onClick={confirmSip} 
            disabled={loading}
          >
            <div style={styles.ultimateLaunchBtnGlowBackingTrack}></div>
            <span style={styles.ultimateLaunchBtnIconBadgeNode}>🛡️</span>
            <span style={styles.ultimateLaunchBtnMainTitleText}>
              {loading ? "PROCESSING SECURE TRANSACTION..." : "COMMENCE SECURE SIP DEPLOYMENT"}
            </span>
          </button>
        </div>

      </div>

      {/* TERMS MODAL */}
      {termsOpen && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalCard}>
            <h3 style={{color: "#00ffa3", marginTop: 0}}>Terms & Conditions</h3>
            <p style={{fontSize: "13px", color: "#cbd5e1", lineHeight: "1.6"}}>
              By commencing this automated SIP deployment, you agree to lock-in funds for the selected tenure. Early termination might be subject to system verification protocols. All returns are calculated based on algorithmic yield structures.
            </p>
            <div style={{display: "flex", gap: "10px", marginTop: "20px"}}>
              <button 
                style={{flex: 1, padding: "10px", background: "#00ffa3", border: "none", borderRadius: "8px", fontWeight: "bold", cursor: "pointer", color: "#000"}}
                onClick={() => { setAccepted(true); setTermsOpen(false); }}
              >
                I Agree & Accept
              </button>
              <button 
                style={{flex: 1, padding: "10px", background: "#334155", border: "none", borderRadius: "8px", fontWeight: "bold", cursor: "pointer", color: "#fff"}}
                onClick={() => setTermsOpen(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* HELP ASSISTANT MODAL */}
      {helpOpen && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalCard}>
            <h3 style={{color: "#00d2ff", marginTop: 0}}>Assistant Core Support</h3>
            <p style={{fontSize: "13px", color: "#cbd5e1", lineHeight: "1.6"}}>
              Need help regarding Save Money plans? You can reach out to our 24/7 support team via the Support section in the sidebar or check our detailed Plan PDF.
            </p>
            <button 
              style={{width: "100%", padding: "10px", background: "#00d2ff", border: "none", borderRadius: "8px", fontWeight: "bold", cursor: "pointer", color: "#000", marginTop: "15px"}}
              onClick={() => setHelpOpen(false)}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  cyberPageWrapper: {
    minHeight: "100vh",
    background: "linear-gradient(180deg,#020617 0%,#031026 45%,#020617 100%)",
    color: "#ffffff",
    padding: "0 12px 100px",
    fontFamily: "system-ui, -apple-system, sans-serif",
    position: "relative",
    overflowX: "hidden"
  },
  neonMatrixGrid: {
    position: "absolute",
    inset: 0,
    backgroundImage: "radial-gradient(rgba(0,255,163,0.05) 1px, transparent 1px)",
    backgroundSize: "24px 24px",
    pointerEvents: "none",
    zIndex: 1
  },
  dynamicAuraSphere1: {
    position: "absolute",
    top: "5%",
    left: "-10%",
    width: "300px",
    height: "300px",
    background: "radial-gradient(circle, rgba(0,255,163,0.1) 0%, transparent 70%)",
    pointerEvents: "none",
    zIndex: 1
  },
  dynamicAuraSphere2: {
    position: "absolute",
    top: "40%",
    right: "-10%",
    width: "350px",
    height: "350px",
    background: "radial-gradient(circle, rgba(0,210,255,0.1) 0%, transparent 70%)",
    pointerEvents: "none",
    zIndex: 1
  },
  dynamicAuraSphere3: {
    position: "absolute",
    bottom: "10%",
    left: "20%",
    width: "400px",
    height: "400px",
    background: "radial-gradient(circle, rgba(204,0,255,0.08) 0%, transparent 70%)",
    pointerEvents: "none",
    zIndex: 1
  },

  // সাইডবার স্টাইলস (হোম পেজের সাথে হুবহু মিল রেখে)
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
    borderRadius: "12px",
    boxShadow: "0 4px 12px rgba(0, 0, 0, 0.5)"
  },

  vipStatusBar: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "8px 12px",
    background: "rgba(15,23,42,0.8)",
    borderBottom: "1px solid rgba(255,255,255,0.1)",
    fontSize: "11px",
    position: "relative",
    zIndex: 2
  },
  vipStatusIndicator: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    color: "#00ffa3",
    fontWeight: "bold"
  },
  pulseNode: {
    width: "8px",
    height: "8px",
    background: "#00ffa3",
    borderRadius: "50%",
    boxShadow: "0 0 10px #00ffa3",
    animation: "pulseAnim 1.5s infinite"
  },
  vipTimestamp: {
    color: "#94a3b8"
  },

  glassOverlayShield: {
    position: "fixed",
    inset: 0,
    background: "rgba(2,6,23,0.7)",
    backdropFilter: "blur(6px)",
    zIndex: 99999,
    display: "flex",
    alignItems: "center",
    justifyContent: "center"
  },
  glassOverlayContainer: {
    background: "#0f172a",
    padding: "20px 30px",
    borderRadius: "16px",
    display: "flex",
    alignItems: "center",
    gap: "15px",
    boxShadow: "0 20px 40px rgba(0,0,0,0.5)",
    border: "1px solid #1e293b",
    maxWidth: "350px"
  },
  glassOverlayIconFrame: {
    width: "40px",
    height: "40px",
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "18px",
    fontWeight: "bold",
    flexShrink: 0
  },
  glassOverlayMessageText: {
    margin: 0,
    fontSize: "14px",
    fontWeight: "bold",
    color: "#fff"
  },

  ultimateMainCanvas: {
    position: "relative",
    zIndex: 2,
    maxWidth: "1200px",
    margin: "0 auto",
    paddingTop: "15px"
  },

  controlHelmRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: "20px",
    gap: "10px",
    flexWrap: "wrap"
  },
  hamburgerBtn: {
    background: "rgba(255,255,255,0.1)",
    border: "1px solid rgba(255,255,255,0.2)",
    color: "#fff",
    fontSize: "20px",
    padding: "6px 12px",
    borderRadius: "8px",
    cursor: "pointer"
  },
  helmActionBtn: {
    background: "rgba(15,23,42,0.9)",
    border: "1px solid #334155",
    color: "#fff",
    padding: "8px 14px",
    borderRadius: "10px",
    fontSize: "12px",
    fontWeight: "bold",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    gap: "6px",
    transition: "all 0.2s"
  },
  helmActionBtnHover: {
    borderColor: "#00ffa3",
    boxShadow: "0 0 12px rgba(0,255,163,0.3)"
  },
  helmBtnIcon: {
    color: "#00ffa3"
  },
  helmCenterBadge: {
    display: "none"
  },
  goldTextBadge: {
    color: "#ffd700",
    fontSize: "11px",
    fontWeight: "bold",
    letterSpacing: "1px"
  },
  helmHelpBtn: {
    background: "rgba(0,210,255,0.1)",
    border: "1px solid rgba(0,210,255,0.3)",
    color: "#00d2ff",
    padding: "8px 14px",
    borderRadius: "10px",
    fontSize: "12px",
    fontWeight: "bold",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    gap: "6px"
  },
  helmHelpBtnHover: {
    background: "rgba(0,210,255,0.2)",
    boxShadow: "0 0 12px rgba(0,210,255,0.3)"
  },
  helpQuestionMark: {
    background: "#00d2ff",
    color: "#020617",
    width: "16px",
    height: "16px",
    borderRadius: "50%",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "10px",
    fontWeight: "900"
  },

  cyberBrandHeaderSection: {
    textAlign: "center",
    marginBottom: "25px"
  },
  cyberLogoHexagonWrap: {
    width: "70px",
    height: "70px",
    margin: "0 auto 12px",
    position: "relative",
    display: "flex",
    alignItems: "center",
    justifyContent: "center"
  },
  cyberLogoCoreElement: {
    width: "48px",
    height: "48px",
    background: "linear-gradient(135deg, #00ffa3, #00d2ff)",
    borderRadius: "14px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    boxShadow: "0 0 20px rgba(0,255,163,0.4)",
    zIndex: 2
  },
  cyberLogoSymbolText: {
    fontSize: "24px",
    fontWeight: "900",
    color: "#020617"
  },
  // অ্যানিমেশন ঠিক করা হলো যাতে লোগোর চারপাশের রিং সচলভাবে ঘুরতে থাকে
  cyberLogoOrbitLine1: {
    position: "absolute",
    inset: 0,
    border: "2px dashed rgba(0,255,163,0.6)",
    borderRadius: "50%",
    animation: "spinSlow 8s linear infinite"
  },
  cyberLogoOrbitLine2: {
    position: "absolute",
    inset: "-6px",
    border: "1px solid rgba(0,210,255,0.4)",
    borderRadius: "50%",
    animation: "spinReverse 12s linear infinite"
  },
  cyberMainTitleText: {
    margin: 0,
    fontSize: "26px",
    fontWeight: "900",
    letterSpacing: "1px"
  },
  cyberMainTitleHighlight: {
    color: "#00ffa3",
    textShadow: "0 0 15px rgba(0,255,163,0.4)"
  },
  cyberBrandDividerLine: {
    width: "120px",
    height: "2px",
    background: "linear-gradient(90deg, transparent, #00ffa3, transparent)",
    margin: "8px auto"
  },
  cyberBrandSubtextPara: {
    margin: 0,
    fontSize: "11px",
    color: "#94a3b8",
    letterSpacing: "2px",
    fontWeight: "bold"
  },

  // পাশাপাশি (Side-by-Side) লেআউট
  executiveTwinControlLayout: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
    gap: "20px",
    marginBottom: "25px"
  },
  executivePanelZone: {
    display: "flex",
    flexDirection: "column"
  },

  cyberLuxuryCardUnit: {
    background: "rgba(15,23,42,0.85)",
    border: "1px solid #1e293b",
    borderRadius: "20px",
    padding: "20px",
    position: "relative",
    overflow: "hidden",
    boxShadow: "0 10px 30px rgba(0,0,0,0.5)",
    transition: "all 0.3s ease",
    height: "100%",
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between"
  },
  cyberLuxuryCardUnitHover: {
    borderColor: "rgba(0,255,163,0.4)",
    boxShadow: "0 15px 40px rgba(0,0,0,0.7), 0 0 20px rgba(0,255,163,0.15)"
  },
  cardGlowCornerTop: {
    position: "absolute",
    top: 0,
    right: 0,
    width: "80px",
    height: "80px",
    background: "radial-gradient(circle, rgba(0,255,163,0.15) 0%, transparent 70%)",
    pointerEvents: "none"
  },
  cardGlowCornerTopAccent: {
    position: "absolute",
    top: 0,
    right: 0,
    width: "80px",
    height: "80px",
    background: "radial-gradient(circle, rgba(0,210,255,0.15) 0%, transparent 70%)",
    pointerEvents: "none"
  },
  cardHeaderFlexBox: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "15px"
  },
  cardTitleBadgeRow: {
    display: "flex",
    alignItems: "center",
    gap: "10px"
  },
  cardHeaderIconBoxContainer: {
    width: "32px",
    height: "32px",
    background: "rgba(0,255,163,0.1)",
    borderRadius: "8px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "16px"
  },
  cardHeaderIconBoxContainerAccent: {
    width: "32px",
    height: "32px",
    background: "rgba(0,210,255,0.1)",
    borderRadius: "8px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "16px"
  },
  cardHeaderMainTitleText: {
    margin: 0,
    fontSize: "13px",
    fontWeight: "900",
    letterSpacing: "0.5px"
  },
  onlinePulseStatusText: {
    fontSize: "10px",
    color: "#00ffa3",
    fontWeight: "bold",
    background: "rgba(0,255,163,0.1)",
    padding: "3px 8px",
    borderRadius: "6px"
  },
  onlinePulseStatusTextAccent: {
    fontSize: "10px",
    color: "#00d2ff",
    fontWeight: "bold",
    background: "rgba(0,210,255,0.1)",
    padding: "3px 8px",
    borderRadius: "6px"
  },

  walletBalanceDisplayBlock: {
    background: "rgba(2,6,23,0.5)",
    border: "1px solid #334155",
    borderRadius: "14px",
    padding: "16px",
    marginBottom: "15px"
  },
  walletMetaLabelRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "6px"
  },
  walletMetaLabel: {
    fontSize: "10px",
    color: "#94a3b8",
    fontWeight: "bold"
  },
  walletSecureShieldTag: {
    fontSize: "9px",
    color: "#00ffa3"
  },
  walletLargeNumericalSum: {
    fontSize: "24px",
    fontWeight: "900",
    color: "#00ffa3",
    marginBottom: "10px"
  },
  walletProgressIndicatorTrack: {
    width: "100%",
    height: "6px",
    background: "#1e293b",
    borderRadius: "3px",
    overflow: "hidden",
    marginBottom: "8px"
  },
  walletProgressIndicatorFillBar: {
    width: "100%",
    height: "100%",
    background: "linear-gradient(90deg, #00ffa3, #00d2ff)",
    borderRadius: "3px"
  },
  walletBottomCapLabelFlex: {
    display: "flex",
    justifyContent: "space-between",
    fontSize: "10px",
    color: "#64748b"
  },
  walletCapSubtextText: {},
  walletCapPercentageText: {
    color: "#00ffa3",
    fontWeight: "bold"
  },

  couponSectionContainer: {
    marginBottom: "15px"
  },
  inputFieldLabelFlexHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "8px"
  },
  inputFieldMainTitleLabel: {
    fontSize: "11px",
    fontWeight: "bold",
    color: "#cbd5e1"
  },
  couponAppliedBadge: {
    fontSize: "10px",
    color: "#00ffa3",
    background: "rgba(0,255,163,0.1)",
    padding: "2px 6px",
    borderRadius: "4px"
  },
  cyberInputWrapperGlassBox: {
    display: "flex",
    alignItems: "center",
    background: "rgba(2,6,23,0.6)",
    border: "1px solid #334155",
    borderRadius: "12px",
    overflow: "hidden",
    transition: "all 0.2s"
  },
  cyberInputPrependCurrencySymbol: {
    paddingLeft: "15px",
    fontSize: "16px",
    fontWeight: "bold",
    color: "#00ffa3"
  },
  cyberInputActualInputElement: {
    flex: 1,
    background: "transparent",
    border: "none",
    color: "#fff",
    padding: "12px 10px",
    fontSize: "15px",
    fontWeight: "bold",
    outline: "none"
  },
  cyberInputAppendBadgeUnit: {
    paddingRight: "12px"
  },
  cyberInputAppendBadgeText: {
    fontSize: "10px",
    color: "#64748b",
    fontWeight: "bold"
  },
  applyCouponBtnElement: {
    background: "#00ffa3",
    color: "#020617",
    border: "none",
    padding: "0 16px",
    height: "100%",
    fontWeight: "900",
    fontSize: "11px",
    cursor: "pointer"
  },
  appliedCouponInfoBox: {
    background: "rgba(0,255,163,0.1)",
    border: "1px solid rgba(0,255,163,0.3)",
    padding: "10px 14px",
    borderRadius: "12px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center"
  },
  appliedCouponSuccessText: {
    fontSize: "12px",
    color: "#00ffa3",
    fontWeight: "bold"
  },
  removeCouponBtn: {
    background: "transparent",
    border: "none",
    color: "#ff4a4a",
    fontSize: "11px",
    fontWeight: "bold",
    cursor: "pointer"
  },

  walletActionInjectFundsBtn: {
    width: "100%",
    padding: "12px",
    background: "linear-gradient(135deg, #00ffa3, #00d2ff)",
    color: "#020617",
    border: "none",
    borderRadius: "12px",
    fontWeight: "900",
    fontSize: "12px",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",
    boxShadow: "0 4px 15px rgba(0,255,163,0.3)"
  },
  btnAccentPlusSymbol: {
    fontSize: "16px",
    fontWeight: "900"
  },

  inputFieldComplexContainer: {
    marginBottom: "15px"
  },
  inputFieldRightHandBadge: {
    fontSize: "9px",
    color: "#ffb800",
    background: "rgba(255,184,0,0.1)",
    padding: "2px 6px",
    borderRadius: "4px"
  },
  inputFieldRightHandBadgeAccent: {
    fontSize: "9px",
    color: "#00d2ff",
    background: "rgba(0,210,255,0.1)",
    padding: "2px 6px",
    borderRadius: "4px"
  },
  cyberValidationWarningAlertBox: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    marginTop: "6px",
    color: "#ff4a4a",
    fontSize: "10px",
    fontWeight: "bold"
  },
  validationWarningIcon: {},
  validationWarningText: {},

  tenureSelectionStructureBox: {
    marginBottom: "15px"
  },
  tenureGridSelectorLayoutMatrix: {
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: "8px",
    marginTop: "8px"
  },
  tenureSelectorNodeItemButton: {
    padding: "10px 6px",
    borderRadius: "10px",
    border: "1px solid",
    cursor: "pointer",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
    transition: "all 0.2s"
  },
  tenureNodeYearLabelText: {
    fontSize: "11px",
    fontWeight: "900",
    marginBottom: "2px"
  },
  tenureNodePercentageSubBadge: {
    fontSize: "9px",
    fontWeight: "bold"
  },
  tenureNodeSelectionCheckIndicatorCircle: {
    position: "absolute",
    top: "-5px",
    right: "-5px",
    width: "16px",
    height: "16px",
    background: "#020617",
    color: "#00ffa3",
    border: "1px solid #00ffa3",
    borderRadius: "50%",
    fontSize: "9px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: "bold"
  },

  paymentSummaryBox: {
    background: "rgba(2,6,23,0.5)",
    border: "1px solid #334155",
    borderRadius: "12px",
    padding: "12px",
    marginBottom: "15px",
    fontSize: "12px"
  },
  summaryRow: {
    display: "flex",
    justifyContent: "space-between",
    marginBottom: "6px"
  },

  adviceSystemBarWrapperBox: {
    display: "flex",
    gap: "10px",
    background: "rgba(255,184,0,0.05)",
    border: "1px solid rgba(255,184,0,0.2)",
    padding: "10px 12px",
    borderRadius: "10px",
    fontSize: "10px",
    color: "#cbd5e1"
  },
  adviceSystemLightBulbIcon: {
    fontSize: "14px"
  },
  adviceSystemTextBodyBlock: {
    lineHeight: "1.4"
  },

  compoundingHeaderSeparatorBlock: {
    display: "flex",
    alignItems: "center",
    gap: "15px",
    margin: "30px 0 20px"
  },
  separatorLineDecorativeLeft: {
    flex: 1,
    height: "1px",
    background: "linear-gradient(90deg, transparent, #334155)"
  },
  separatorCentralHeadlineTitleText: {
    fontSize: "12px",
    fontWeight: "900",
    color: "#00ffa3",
    letterSpacing: "1px",
    textAlign: "center"
  },
  separatorLineDecorativeRight: {
    flex: 1,
    height: "1px",
    background: "linear-gradient(90deg, #334155, transparent)"
  },

  // ৪টি বক্স উপরে দুটো নিচে দুটো (2x2 Grid) করার লেআউট
  projectionGrid2x2Layout: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
    gap: "15px",
    marginBottom: "20px"
  },
  projectionDataMetricsCardCellBlock: {
    background: "rgba(15,23,42,0.85)",
    border: "1px solid #1e293b",
    borderRadius: "16px",
    padding: "16px",
    position: "relative",
    overflow: "hidden",
    boxShadow: "0 8px 25px rgba(0,0,0,0.4)"
  },
  projectionCellTopMetaLine: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    marginBottom: "10px"
  },
  projectionCellIconCircleBox: {
    width: "28px",
    height: "28px",
    borderRadius: "6px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "14px",
    fontWeight: "bold"
  },
  projectionCellMetaTitleLabelText: {
    fontSize: "10px",
    fontWeight: "bold",
    color: "#94a3b8"
  },
  projectionCellBigMetricValueText: {
    fontSize: "20px",
    fontWeight: "900",
    marginBottom: "10px"
  },
  projectionCellBottomStatusBarTrack: {
    width: "100%",
    height: "4px",
    background: "#1e293b",
    borderRadius: "2px",
    overflow: "hidden",
    marginBottom: "8px"
  },
  projectionCellStatusFillColorBar: {
    height: "100%",
    borderRadius: "2px"
  },
  projectionCellFooterNarrativeText: {
    margin: 0,
    fontSize: "10px",
    color: "#64748b",
    lineHeight: "1.3"
  },

  systemAnalyticalDisclaimerBox: {
    display: "flex",
    gap: "10px",
    background: "rgba(15,23,42,0.6)",
    border: "1px solid #1e293b",
    padding: "12px 15px",
    borderRadius: "12px",
    marginBottom: "20px",
    alignItems: "center"
  },
  disclaimerIconInfoBadge: {
    width: "20px",
    height: "20px",
    background: "#334155",
    color: "#fff",
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "11px",
    fontWeight: "bold",
    flexShrink: 0
  },
  disclaimerTextMessagePara: {
    fontSize: "10px",
    color: "#94a3b8",
    lineHeight: "1.4",
    margin: 0
  },

  legalComplianceActionShieldContainerBox: {
    marginBottom: "25px"
  },
  legalInteractiveClickableRowBox: {
    display: "flex",
    alignItems: "flex-start",
    gap: "12px",
    background: "rgba(15,23,42,0.7)",
    border: "1px solid #334155",
    padding: "15px",
    borderRadius: "14px",
    cursor: "pointer",
    transition: "all 0.2s"
  },
  legalInteractiveClickableRowBoxActive: {
    borderColor: "#00ffa3",
    background: "rgba(0,255,163,0.03)"
  },
  legalCustomCheckboxSquareBox: {
    width: "20px",
    height: "20px",
    borderRadius: "6px",
    border: "2px solid",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    marginTop: "2px"
  },
  legalCheckboxCheckMarkCheck: {
    color: "#020617",
    fontSize: "12px",
    fontWeight: "900"
  },
  legalTextStatementColumnLabelBlock: {
    flex: 1
  },
  legalMainDeclarationSentenceText: {
    margin: 0,
    fontSize: "11px",
    color: "#cbd5e1",
    lineHeight: "1.5"
  },
  legalHighLightHyperlinkText: {
    color: "#00ffa3"
  },
  legalPaperDocumentIconBadgeUnit: {
    fontSize: "18px",
    flexShrink: 0
  },

  ultimateLaunchButtonCentralContainerFlex: {
    display: "flex",
    justifyContent: "center"
  },
  ultimateLaunchCoreActionBtnElement: {
    position: "relative",
    width: "100%",
    maxWidth: "450px",
    padding: "16px",
    background: "linear-gradient(135deg, #00ffa3, #00d2ff)",
    color: "#020617",
    border: "none",
    borderRadius: "16px",
    fontWeight: "900",
    fontSize: "14px",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "10px",
    boxShadow: "0 10px 30px rgba(0,255,163,0.4)",
    overflow: "hidden",
    transition: "transform 0.2s"
  },
  ultimateLaunchBtnGlowBackingTrack: {
    position: "absolute",
    inset: 0,
    background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent)",
    animation: "shimmer 2.5s infinite"
  },
  ultimateLaunchBtnIconBadgeNode: {
    fontSize: "18px"
  },
  ultimateLaunchBtnMainTitleText: {
    position: "relative",
    zIndex: 2,
    letterSpacing: "0.5px"
  },

  modalOverlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(2,6,23,0.8)",
    backdropFilter: "blur(6px)",
    zIndex: 100005,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "20px"
  },
  modalCard: {
    background: "#0f172a",
    border: "1px solid #1e293b",
    borderRadius: "20px",
    padding: "24px",
    maxWidth: "400px",
    width: "100%",
    boxShadow: "0 25px 50px rgba(0,0,0,0.7)"
  }
};

// গ্লোবাল অ্যানিমেশন স্টাইল শিট যুক্ত করা হলো (লোগোর অ্যানিমেশন ও পালস ইফেক্টের জন্য)
const animationStyleSheet = document.createElement("style");
animationStyleSheet.type = "text/css";
animationStyleSheet.innerText = `
  @keyframes spinSlow {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }

  @keyframes spinReverse {
    0% { transform: rotate(360deg); }
    100% { transform: rotate(0deg); }
  }

  @keyframes pulseAnim {
    0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(0,255,163,0.7); }
    70% { transform: scale(1); box-shadow: 0 0 0 8px rgba(0,255,163,0); }
    100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(0,255,163,0); }
  }

  @keyframes shimmer {
    0% { transform: translateX(-100%); }
    100% { transform: translateX(100%); }
  }
`;
if (typeof document !== "undefined") {
  document.head.appendChild(animationStyleSheet);
}
