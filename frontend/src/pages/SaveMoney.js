import { useEffect, useMemo, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { toast } from "react-toastify";
import { API } from "../config";

export default function SaveMoney() {
  // ROUTING & NAVIGATION
  const navigate = useNavigate();
  const location = useLocation();

  // LOCAL STORAGE
  const email = localStorage.getItem("email") || "";
  const token = localStorage.getItem("token") || "";
  const localName = localStorage.getItem("name") || "User";

  // STATES
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isDownloadingPlan, setIsDownloadingPlan] = useState(false);

  const [user, setUser] = useState({});
  const [balance, setBalance] = useState(0);
  const [amount, setAmount] = useState("");
  const [years, setYears] = useState(5);
  const [accepted, setAccepted] = useState(false);
  const [termsOpen, setTermsOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  // COUPON
  const [couponCode, setCouponCode] = useState("");
  const [discountAmount, setDiscountAmount] = useState(0);
  const [appliedCouponName, setAppliedCouponName] = useState("");

  // OVERLAY & INTERACTION
  const [statusOverlay, setStatusOverlay] = useState({
    show: false,
    type: "info",
    message: ""
  });
  const [hoveredCard, setHoveredCard] = useState(null);
  const [activeInputFocus, setActiveInputFocus] = useState(false);
  const [activeCouponFocus, setActiveCouponFocus] = useState(false);
  const [hoveredTenureNode, setHoveredTenureNode] = useState(null);

  const showStatusMsg = (type, message) => {
    setStatusOverlay({ show: true, type, message });
    setTimeout(() => {
      setStatusOverlay({ show: false, type: "info", message: "" });
    }, 3000);
  };

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
  }, []);

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
      setBalance(Number(data.balance || data.wallet || data.totalWallet || 4.00));
    } catch (err) {
      console.log("WALLETS SYNC ERROR:", err);
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
          body: JSON.stringify({ email })
        });
      }
    } catch (err) {
      console.log("Logout error:", err);
    } finally {
      localStorage.clear();
      navigate("/login");
      window.location.reload();
    }
  };

  const getRate = (y) => {
    if (Number(y) === 1) return 11;
    if (Number(y) === 3) return 15;
    if (Number(y) === 5) return 20;
    if (Number(y) === 10) return 25;
    if (Number(y) === 15) return 28;
    return 30;
  };

  const rate = getRate(years);

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

  const money = (n) => {
    return `₹ ${Number(n || 0).toLocaleString("en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })}`;
  };

  const openTerms = () => {
    if (accepted) {
      setAccepted(false);
      return;
    }
    setTermsOpen(true);
  };

  const confirmSip = async () => {
    if (Number(amount) < 500) {
      showStatusMsg("error", "Minimum SIP amount ₹500 required");
      return toast.info("Minimum SIP amount ₹500 required");
    }

    if (!accepted) {
      setTermsOpen(true);
      return;
    }

    if (Number(balance) < calc.finalPayableToday) {
      showStatusMsg("error", "Insufficient wallet balance");
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
      console.log("TRANSACTION ERROR:", err);
      showStatusMsg("error", "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.cyberPageWrapper}>
      {/* VIRTUALIZED LAYER */}
      <div style={styles.neonMatrixGrid}></div>

      {/* SIDEBAR DRAWER */}
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
                  src="/logo512.png" 
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
              <button style={styles.drawerNavItem} onClick={() => { navigate("/home"); setSidebarOpen(false); }}>
                <span>🏠</span> Dashboard
              </button>
              <button style={styles.drawerNavItem} onClick={() => { navigate("/my-investment"); setSidebarOpen(false); }}>
                <span>📈</span> My Investment
              </button>
              <button style={{...styles.drawerNavItem, ...styles.drawerNavItemActive}} onClick={() => { navigate("/save-money"); setSidebarOpen(false); }}>
                <span>💰</span> Save Money
              </button>
              <button style={styles.drawerNavItem} onClick={() => { navigate("/one-time"); setSidebarOpen(false); }}>
                <span>⚡</span> One Time
              </button>
              <button style={styles.drawerNavItem} onClick={() => { handleDownloadPlan(); setSidebarOpen(false); }}>
                <span>📋</span> Plan PDF
              </button>
              <button style={styles.drawerNavItem} onClick={() => { navigate("/wallet"); setSidebarOpen(false); }}>
                <span>🌐</span> Add Fund
              </button>
              <button style={styles.drawerNavItem} onClick={() => { navigate("/refer"); setSidebarOpen(false); }}>
                <span>👥</span> Refer & Earn
              </button>
              <button style={styles.drawerNavItem} onClick={() => { navigate("/withdraw"); setSidebarOpen(false); }}>
                <span>➔</span> Withdraw
              </button>
              <button style={styles.drawerNavItem} onClick={() => { navigate("/support"); setSidebarOpen(false); }}>
                <span>🎧</span> Support
              </button>
              <button style={styles.drawerNavItem} onClick={() => { setSidebarOpen(false); handleLogout(); }}>
                <span>🚪</span> Logout
              </button>
            </div>
          </div>

        </div>
      </div>

      {/* STATUS OVERLAY */}
      {statusOverlay.show && (
        <div style={styles.glassOverlayShield}>
          <div style={{
            ...styles.glassOverlayContainer,
            borderBottom: statusOverlay.type === "success" ? "4px solid #00ffa3" : "4px solid #ff4a4a"
          }}>
            <p style={styles.glassOverlayMessageText}>{statusOverlay.message}</p>
          </div>
        </div>
      )}

      {/* MAIN CANVAS */}
      <div style={styles.ultimateMainCanvas}>
        
        {/* TOP USER PROFILE HEADER */}
        <div style={styles.topUserHeaderRow}>
          <button style={styles.hamburgerBtn} onClick={() => setSidebarOpen(true)}>☰</button>
          
          <div style={styles.statusBadgeCapsule}>
            <span style={styles.greenDot}></span>
            <span style={styles.statusBadgeText}>SECURE CONNECTION<br/><b>SECURE</b></span>
          </div>

          <div style={styles.systemStatusTextCenter}>
            HEALTHY - AUTO-COMPOUNDING SYSTEM<br/>
            <span style={{color: '#00ffa3', fontWeight: 'bold'}}>● ACTIVE</span>
          </div>

          <div style={styles.userProfilePill}>
            <div style={styles.userAvatarCircle}>👤</div>
            <div style={styles.userInfoText}>
              <span style={styles.welcomeText}>Welcome Back</span>
              <span style={styles.userNameText}>{localName} ▾</span>
            </div>
          </div>
        </div>

        {/* HELM BUTTONS ROW */}
        <div style={styles.controlHelmRow}>
          <button style={styles.helmActionBtn} onClick={() => window.history.back()}>
            <span>💼</span> RETURN DASHBOARD
          </button>
          
          <button style={styles.helmHelpBtn} onClick={() => setHelpOpen(true)}>
            <span>🤖</span> ASSISTANT CORE
          </button>
        </div>

        {/* BRAND HEADER BANNER */}
        <header style={styles.cyberBrandHeaderSection}>
          <div style={styles.brandLeftGroup}>
            <div style={styles.cyberLogoHexagonWrap}>
              <div style={styles.cyberLogoCoreElement}>
                <span style={styles.cyberLogoSymbolText}>₹</span>
              </div>
            </div>
            <div style={styles.brandTitleTextGroup}>
              <h1 style={styles.cyberMainTitleText}>
                SAVE <span style={styles.cyberMainTitleHighlight}>MONEY</span>
              </h1>
              <p style={styles.cyberBrandSubtextPara}>INTELLIGENT WEALTH GENERATION SYSTEM</p>
            </div>
          </div>

          <div style={styles.brandRightBannerTag}>
            <span style={styles.planTodayText}>Plan Today 📈</span>
            <span style={styles.secureTomorrowText}>Secure Tomorrow</span>
          </div>
        </header>

        {/* 1. SECURE WALLET MANAGEMENT & WALLET ACTIONS */}
        <div style={styles.singleColumnStackedLayout}>
          <section style={styles.cyberLuxuryCardUnit}>
            <div style={styles.cardHeaderFlexBox}>
              <div style={styles.cardTitleBadgeRow}>
                <div style={styles.cardHeaderIconBoxContainer}>💳</div>
                <h3 style={styles.cardHeaderMainTitleText}>SECURE WALLET MANAGEMENT</h3>
              </div>
              <span style={styles.onlinePulseStatusText}>ONLINE POOL</span>
            </div>

            <div style={styles.walletAndActionsSplitGrid}>
              {/* Left: Wallet Info */}
              <div style={styles.walletBalanceDisplayBlock}>
                <div style={styles.walletMetaLabelRow}>
                  <span style={styles.walletMetaLabel}>LIQUID CAPITAL AVAILABILITY</span>
                  <span style={styles.walletSecureShieldTag}>● LIVE • UPDATED NOW</span>
                </div>
                <div style={styles.walletLargeNumericalSum}>
                  {money(balance)}
                </div>
                <div style={styles.walletProgressIndicatorTrack}>
                  <div style={styles.walletProgressIndicatorFillBar}></div>
                </div>
                <div style={styles.walletBottomCapLabelFlex}>
                  <span style={styles.walletCapSubtextText}>Total Capital in Pool</span>
                  <span style={styles.walletCapPercentageText}>100% Active</span>
                </div>

                {/* Promo Code Inside Left Panel as 1st Screenshot */}
                <div style={styles.innerPromoRow}>
                  <div style={styles.innerPromoIcon}>🪙</div>
                  <input
                    style={styles.innerPromoInput}
                    type="text"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value)}
                    placeholder="Have a Promo / Coupon Code? e.g. SAVE300"
                  />
                  <button style={styles.innerApplyBtn} onClick={handleApplyCoupon}>APPLY</button>
                </div>
              </div>

              {/* Right: Wallet Actions */}
              <div style={styles.walletActionsBlock}>
                <div style={styles.walletActionsHeader}>
                  <span>👛 WALLET ACTIONS</span>
                </div>
                <p style={styles.promoActionLabel}>Enter a Promo / Coupon Code?</p>
                <input
                  style={styles.walletActionInput}
                  type="text"
                  placeholder="Enter Code Here"
                />
                <button style={styles.walletActionApplyBtn}>APPLY</button>
              </div>
            </div>

            <button style={styles.walletActionInjectFundsBtn} onClick={() => navigate("/wallet")}>
              📥 DEPOSIT FRESH CAPITAL INTO POOL
            </button>
          </section>

          {/* 2. ASSET DEPLOYMENT CALIBRATION */}
          <section style={styles.cyberLuxuryCardUnit}>
            <div style={styles.cardHeaderFlexBox}>
              <div style={styles.cardTitleBadgeRow}>
                <div style={styles.cardHeaderIconBoxContainerAccent}>📈</div>
                <h3 style={styles.cardHeaderMainTitleText}>ASSET DEPLOYMENT CALIBRATION</h3>
              </div>
              <span style={styles.onlinePulseStatusTextAccent}>ONLINE READY</span>
            </div>

            <div style={styles.inputFieldComplexContainer}>
              <div style={styles.inputFieldLabelFlexHeader}>
                <span style={styles.inputFieldMainTitleLabel}>CHOOSE MONTHLY COMMITMENT AMOUNT</span>
                <div style={styles.bondLimitsPill}>
                  MINIMUM BOND: ₹500<br/>MAXIMUM BOND: ₹50,000
                </div>
              </div>
              
              <div style={styles.inputWithInvestBtnRow}>
                <div style={styles.cyberInputWrapperGlassBox}>
                  <div style={styles.cyberInputPrependCurrencySymbol}>₹</div>
                  <input
                    style={styles.cyberInputActualInputElement}
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="Enter Custom Investment Capital"
                  />
                </div>
                <button style={styles.investNowSideBtn} onClick={confirmSip}>INVEST NOW</button>
              </div>
            </div>

            <div style={styles.tenureSelectionStructureBox}>
              <span style={styles.inputFieldMainTitleLabel}>SELECT ASSET ACCUMULATION TIMEFRAME</span>

              <div style={styles.tenureGridSelectorLayoutMatrix}>
                {[1, 3, 5, 10, 15, 20].map((y) => {
                  const isSelected = years === y;
                  return (
                    <button
                      key={y}
                      style={{
                        ...styles.tenureSelectorNodeItemButton,
                        border: isSelected ? "2px solid #00ffa3" : "1px solid #1e293b",
                        background: isSelected ? "rgba(0,255,163,0.15)" : "#0b1329",
                        color: isSelected ? "#00ffa3" : "#fff"
                      }}
                      onClick={() => setYears(y)}
                    >
                      <div style={styles.tenureNodeYearLabelText}>{y} {y === 1 ? "YEAR PLAN" : "YEARS PLAN"}</div>
                      <div style={styles.tenureNodePercentageSubBadge}>Total Return</div>
                      <div style={styles.tenureRateText}>{getRate(y)}%</div>
                      {isSelected && <div style={styles.selectedCheckBadge}>✓</div>}
                    </button>
                  );
                })}
              </div>
            </div>

            <div style={styles.adviceSystemBarWrapperBox}>
              <div style={styles.adviceSystemLightBulbIcon}>💡</div>
              <div style={styles.adviceSystemTextBodyBlock}>
                <strong>Compounding Multiplier Area:</strong> Selection of a higher duration increases your return through compounding. Longer timeframes maximize capital growth, stability and historical performance.
              </div>
            </div>
          </section>
        </div>

        {/* SECTION SEPARATOR */}
        <div style={styles.compoundingHeaderSeparatorBlock}>
          <div style={styles.separatorLineDecorativeLeft}></div>
          <span style={styles.separatorCentralHeadlineTitleText}>LIVE ASSET PROJECTION DATA SHEETS</span>
          <div style={styles.separatorLineDecorativeRight}></div>
        </div>

        {/* 3. PROJECTION CARDS (1st Screenshot Layout - 2x2 Grid) */}
        <div style={styles.projectionGrid2x2Layout}>
          <div style={{...styles.projectionDataMetricsCardCellBlock, borderLeft: "4px solid #00ffa3"}}>
            <div style={styles.projectionCellTopMetaLine}>
              <div style={{...styles.projectionCellIconCircleBox, background: "rgba(0,255,163,0.2)", color: "#00ffa3"}}>📈</div>
              <span style={styles.projectionCellMetaTitleLabelText}>ESTIMATED COMPOUNDING RETURNS</span>
            </div>
            <div style={{...styles.projectionCellBigMetricValueText, color: "#00ffa3"}}>
              {money(calc.estimatedReturn)}
            </div>
            <div style={styles.projectionCellBottomStatusBarTrack}>
              <div style={{...styles.projectionCellStatusFillColorBar, backgroundColor: "#00ffa3", width: "100%"}}></div>
            </div>
            <p style={styles.projectionCellFooterNarrativeText}>Expected returns based on selected timeframe and investment model.</p>
          </div>

          <div style={{...styles.projectionDataMetricsCardCellBlock, borderLeft: "4px solid #00d2ff"}}>
            <div style={styles.projectionCellTopMetaLine}>
              <div style={{...styles.projectionCellIconCircleBox, background: "rgba(0,210,255,0.2)", color: "#00d2ff"}}>🪙</div>
              <span style={styles.projectionCellMetaTitleLabelText}>TOTAL REPLIED PRINCIPAL CAPITAL</span>
            </div>
            <div style={{...styles.projectionCellBigMetricValueText, color: "#00d2ff"}}>
              {money(calc.totalInvestment)}
            </div>
            <div style={styles.projectionCellBottomStatusBarTrack}>
              <div style={{...styles.projectionCellStatusFillColorBar, backgroundColor: "#00d2ff", width: "100%"}}></div>
            </div>
            <p style={styles.projectionCellFooterNarrativeText}>Total amount of principal allocated across all active plans.</p>
          </div>

          <div style={{...styles.projectionDataMetricsCardCellBlock, borderLeft: "4px solid #ffb800"}}>
            <div style={styles.projectionCellTopMetaLine}>
              <div style={{...styles.projectionCellIconCircleBox, background: "rgba(255,184,0,0.2)", color: "#ffb800"}}>🏆</div>
              <span style={styles.projectionCellMetaTitleLabelText}>NET COMPREHENSIVE INTEREST EARNED</span>
            </div>
            <div style={{...styles.projectionCellBigMetricValueText, color: "#ffb800"}}>
              {money(calc.totalInterest)}
            </div>
            <div style={styles.projectionCellBottomStatusBarTrack}>
              <div style={{...styles.projectionCellStatusFillColorBar, backgroundColor: "#ffb800", width: "100%"}}></div>
            </div>
            <p style={styles.projectionCellFooterNarrativeText}>Total interest earned from successful compounding cycles.</p>
          </div>

          <div style={{...styles.projectionDataMetricsCardCellBlock, borderLeft: "4px solid #cc00ff"}}>
            <div style={styles.projectionCellTopMetaLine}>
              <div style={{...styles.projectionCellIconCircleBox, background: "rgba(204,0,255,0.2)", color: "#cc00ff"}}>💎</div>
              <span style={styles.projectionCellMetaTitleLabelText}>ESTIMATED MATURITY ASSET VALUE</span>
            </div>
            <div style={{...styles.projectionCellBigMetricValueText, color: "#cc00ff"}}>
              {money(calc.totalReturn)}
            </div>
            <div style={styles.projectionCellBottomStatusBarTrack}>
              <div style={{...styles.projectionCellStatusFillColorBar, backgroundColor: "#cc00ff", width: "100%"}}></div>
            </div>
            <p style={styles.projectionCellFooterNarrativeText}>Projected value at the end of the selected plan period.</p>
          </div>
        </div>

        {/* 4. LEGAL DECLARATION */}
        <div style={styles.legalComplianceActionShieldContainerBox}>
          <div 
            style={{...styles.legalInteractiveClickableRowBox, ...(accepted ? styles.legalInteractiveClickableRowBoxActive : {})}}
            onClick={openTerms}
          >
            <div style={styles.legalPaperDocumentIconBadgeUnit}>📄</div>
            <div style={styles.legalTextStatementColumnLabelBlock}>
              <p style={styles.legalMainDeclarationSentenceText}>
                I hereby declare, advance and confirm that I have meticulously read, verified and mutually consented to the legally bound for this company's <span style={styles.legalHighLightHyperlinkText}>Terms & Conditions</span>, <span style={styles.legalHighLightHyperlinkText}>Asset Allocation Disclosure</span> & <span style={styles.legalHighLightHyperlinkText}>Risk Protocols</span>.
              </p>
              <div style={styles.termsLinksFlexRow}>
                <span style={styles.termsLinkItem}>Terms & Conditions</span> | 
                <span style={styles.termsLinkItem}> Asset Allocation Disclosure</span> | 
                <span style={styles.termsLinkItem}> Risk Protocols</span>
              </div>
            </div>
            <div style={{
              ...styles.legalCustomCheckboxSquareBox,
              backgroundColor: accepted ? "#00ffa3" : "transparent",
              borderColor: accepted ? "#00ffa3" : "#475569"
            }}>
              {accepted && <span style={styles.legalCheckboxCheckMarkCheck}>✓</span>}
            </div>
          </div>
        </div>

        {/* LAUNCH BUTTON */}
        <div style={styles.ultimateLaunchButtonCentralContainerFlex}>
          <button style={styles.ultimateLaunchCoreActionBtnElement} onClick={confirmSip} disabled={loading}>
            <span>🛡️</span>
            <span>{loading ? "PROCESSING..." : "COMMENCE SECURE SIP DEPLOYMENT"}</span>
            <span>➔</span>
          </button>
        </div>

        {/* FOOTER BADGES */}
        <div style={styles.footerSecurityBadgesRow}>
          <span>🛡️ SAFE</span> | <span>TRANSPARENT</span> | <span>SUSTAINABLE</span> | <span>YOUR WEALTH, OUR PRIORITY</span>
        </div>

      </div>

      {/* TERMS MODAL */}
      {termsOpen && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalCard}>
            <h3 style={{color: "#00ffa3", marginTop: 0}}>Terms & Conditions</h3>
            <p style={{fontSize: "13px", color: "#cbd5e1", lineHeight: "1.6"}}>
              By commencing this automated SIP deployment, you agree to lock-in funds for the selected tenure. All returns are calculated based on compounding interest rates.
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
              Need help regarding Save Money plans? You can reach out to our 24/7 support team via the Support section in the sidebar.
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
    background: "#030814",
    color: "#ffffff",
    padding: "10px 12px 60px",
    fontFamily: "system-ui, -apple-system, sans-serif",
    position: "relative"
  },
  neonMatrixGrid: {
    position: "absolute",
    inset: 0,
    backgroundImage: "radial-gradient(rgba(0,255,163,0.03) 1px, transparent 1px)",
    backgroundSize: "20px 20px",
    pointerEvents: "none"
  },
  drawerOverlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(0, 0, 0, 0.75)",
    backdropFilter: "blur(4px)",
    zIndex: 100002,
    transition: "all 0.3s"
  },
  drawerContainer: {
    position: "fixed",
    top: 0,
    bottom: 0,
    left: 0,
    background: "#08101e",
    width: "230px",
    padding: "12px 8px",
    display: "flex",
    flexDirection: "column",
    zIndex: 100003,
    transition: "transform 0.3s"
  },
  drawerHeader: {
    paddingBottom: "10px",
    borderBottom: "1px solid rgba(255,255,255,0.1)",
    marginBottom: "10px"
  },
  drawerBrand: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center"
  },
  drawerLogoWrapper: {
    width: "40px",
    height: "40px",
    borderRadius: "50%",
    background: "#064e3b",
    display: "flex",
    alignItems: "center",
    justifyContent: "center"
  },
  drawerLogoImg: {
    width: "24px",
    height: "24px"
  },
  drawerLogoText: {
    margin: 0,
    fontSize: "14px",
    color: "#fff"
  },
  drawerLogoSubtext: {
    fontSize: "10px",
    color: "#a7f3d0"
  },
  drawerScrollArea: {
    flex: 1,
    overflowY: "auto"
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
    padding: "8px 10px",
    background: "rgba(255,255,255,0.05)",
    border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: "6px",
    color: "#fff",
    fontSize: "12px",
    cursor: "pointer"
  },
  drawerNavItemActive: {
    background: "rgba(0,255,163,0.2)",
    borderColor: "#00ffa3"
  },
  glassOverlayShield: {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.6)",
    zIndex: 99999,
    display: "flex",
    alignItems: "center",
    justifyContent: "center"
  },
  glassOverlayContainer: {
    background: "#0f172a",
    padding: "16px 24px",
    borderRadius: "12px"
  },
  glassOverlayMessageText: {
    margin: 0,
    color: "#fff",
    fontSize: "14px"
  },
  ultimateMainCanvas: {
    maxWidth: "800px",
    margin: "0 auto",
    position: "relative",
    zIndex: 2
  },

  // Top profile header
  topUserHeaderRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: "12px",
    gap: "8px"
  },
  hamburgerBtn: {
    background: "rgba(255,255,255,0.05)",
    border: "1px solid rgba(255,255,255,0.2)",
    color: "#fff",
    padding: "6px 10px",
    borderRadius: "6px",
    cursor: "pointer",
    fontSize: "16px"
  },
  statusBadgeCapsule: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    background: "rgba(0,255,163,0.08)",
    border: "1px solid rgba(0,255,163,0.3)",
    padding: "4px 8px",
    borderRadius: "20px"
  },
  greenDot: {
    width: "6px",
    height: "6px",
    borderRadius: "50%",
    background: "#00ffa3"
  },
  statusBadgeText: {
    fontSize: "9px",
    color: "#00ffa3",
    lineHeight: "1"
  },
  systemStatusTextCenter: {
    fontSize: "9px",
    color: "#cbd5e1",
    textAlign: "center"
  },
  userProfilePill: {
    display: "flex",
    alignItems: "center",
    gap: "6px"
  },
  userAvatarCircle: {
    width: "28px",
    height: "28px",
    borderRadius: "50%",
    background: "#1e293b",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "12px"
  },
  userInfoText: {
    display: "flex",
    flexDirection: "column"
  },
  welcomeText: {
    fontSize: "8px",
    color: "#94a3b8"
  },
  userNameText: {
    fontSize: "11px",
    fontWeight: "bold"
  },

  controlHelmRow: {
    display: "flex",
    justifyContent: "space-between",
    gap: "10px",
    marginBottom: "15px"
  },
  helmActionBtn: {
    flex: 1,
    background: "#08152c",
    border: "1px solid #1e3a8a",
    color: "#fff",
    padding: "8px 12px",
    borderRadius: "20px",
    fontSize: "11px",
    fontWeight: "bold",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "6px"
  },
  helmHelpBtn: {
    flex: 1,
    background: "linear-gradient(90deg, #0284c7, #06b6d4)",
    border: "none",
    color: "#fff",
    padding: "8px 12px",
    borderRadius: "20px",
    fontSize: "11px",
    fontWeight: "bold",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "6px"
  },

  cyberBrandHeaderSection: {
    background: "linear-gradient(135deg, #051923 0%, #032b30 100%)",
    border: "1px solid #0f4c5c",
    borderRadius: "14px",
    padding: "12px 16px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: "15px"
  },
  brandLeftGroup: {
    display: "flex",
    alignItems: "center",
    gap: "12px"
  },
  cyberLogoHexagonWrap: {
    width: "42px",
    height: "42px",
    background: "#00ffa3",
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center"
  },
  cyberLogoCoreElement: {
    color: "#000"
  },
  cyberLogoSymbolText: {
    fontSize: "22px",
    fontWeight: "900"
  },
  brandTitleTextGroup: {},
  cyberMainTitleText: {
    margin: 0,
    fontSize: "20px",
    fontWeight: "900",
    letterSpacing: "1px"
  },
  cyberMainTitleHighlight: {
    color: "#00ffa3"
  },
  cyberBrandSubtextPara: {
    margin: 0,
    fontSize: "9px",
    color: "#94a3b8",
    letterSpacing: "0.5px"
  },
  brandRightBannerTag: {
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-end",
    borderLeft: "2px solid #00ffa3",
    paddingLeft: "8px"
  },
  planTodayText: {
    fontSize: "10px",
    color: "#fff",
    fontWeight: "bold"
  },
  secureTomorrowText: {
    fontSize: "10px",
    color: "#00ffa3",
    fontWeight: "bold"
  },

  singleColumnStackedLayout: {
    display: "flex",
    flexDirection: "column",
    gap: "15px"
  },
  cyberLuxuryCardUnit: {
    background: "#060d1f",
    border: "1px solid #132247",
    borderRadius: "14px",
    padding: "14px"
  },
  cardHeaderFlexBox: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "12px"
  },
  cardTitleBadgeRow: {
    display: "flex",
    alignItems: "center",
    gap: "8px"
  },
  cardHeaderIconBoxContainer: {
    width: "24px",
    height: "24px",
    background: "rgba(0,255,163,0.1)",
    borderRadius: "6px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center"
  },
  cardHeaderIconBoxContainerAccent: {
    width: "24px",
    height: "24px",
    background: "rgba(0,210,255,0.1)",
    borderRadius: "6px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center"
  },
  cardHeaderMainTitleText: {
    margin: 0,
    fontSize: "12px",
    fontWeight: "bold",
    letterSpacing: "0.5px"
  },
  onlinePulseStatusText: {
    fontSize: "9px",
    color: "#00ffa3",
    background: "rgba(0,255,163,0.1)",
    padding: "2px 6px",
    borderRadius: "10px"
  },
  onlinePulseStatusTextAccent: {
    fontSize: "9px",
    color: "#00d2ff",
    background: "rgba(0,210,255,0.1)",
    padding: "2px 6px",
    borderRadius: "10px"
  },

  walletAndActionsSplitGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "12px",
    marginBottom: "12px"
  },
  walletBalanceDisplayBlock: {
    background: "#030814",
    border: "1px solid #132247",
    borderRadius: "10px",
    padding: "10px"
  },
  walletMetaLabelRow: {
    display: "flex",
    justifyContent: "space-between",
    fontSize: "8px",
    color: "#94a3b8",
    marginBottom: "4px"
  },
  walletMetaLabel: {},
  walletSecureShieldTag: {
    color: "#00ffa3"
  },
  walletLargeNumericalSum: {
    fontSize: "18px",
    fontWeight: "bold",
    color: "#00ffa3",
    marginBottom: "6px"
  },
  walletProgressIndicatorTrack: {
    height: "4px",
    background: "#1e293b",
    borderRadius: "2px",
    overflow: "hidden",
    marginBottom: "6px"
  },
  walletProgressIndicatorFillBar: {
    width: "100%",
    height: "100%",
    background: "#00ffa3"
  },
  walletBottomCapLabelFlex: {
    display: "flex",
    justifyContent: "space-between",
    fontSize: "8px",
    color: "#64748b",
    marginBottom: "8px"
  },
  walletCapSubtextText: {},
  walletCapPercentageText: {},

  innerPromoRow: {
    display: "flex",
    alignItems: "center",
    background: "#091428",
    border: "1px solid #1e293b",
    borderRadius: "6px",
    padding: "2px 6px"
  },
  innerPromoIcon: {
    fontSize: "12px",
    marginRight: "4px"
  },
  innerPromoInput: {
    flex: 1,
    background: "transparent",
    border: "none",
    color: "#fff",
    fontSize: "9px",
    outline: "none"
  },
  innerApplyBtn: {
    background: "#00ffa3",
    color: "#000",
    border: "none",
    borderRadius: "4px",
    fontSize: "9px",
    fontWeight: "bold",
    padding: "3px 8px",
    cursor: "pointer"
  },

  walletActionsBlock: {
    background: "#030814",
    border: "1px solid #132247",
    borderRadius: "10px",
    padding: "10px",
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between"
  },
  walletActionsHeader: {
    fontSize: "10px",
    fontWeight: "bold",
    color: "#00d2ff"
  },
  promoActionLabel: {
    margin: "4px 0",
    fontSize: "9px",
    color: "#94a3b8"
  },
  walletActionInput: {
    background: "#091428",
    border: "1px solid #1e293b",
    borderRadius: "6px",
    padding: "6px 8px",
    color: "#fff",
    fontSize: "10px",
    outline: "none",
    marginBottom: "6px"
  },
  walletActionApplyBtn: {
    background: "#00ffa3",
    border: "none",
    borderRadius: "6px",
    padding: "6px",
    fontWeight: "bold",
    fontSize: "10px",
    color: "#000",
    cursor: "pointer"
  },

  walletActionInjectFundsBtn: {
    width: "100%",
    background: "linear-gradient(90deg, #0284c7, #06b6d4)",
    border: "none",
    borderRadius: "20px",
    padding: "10px",
    color: "#fff",
    fontWeight: "bold",
    fontSize: "11px",
    cursor: "pointer"
  },

  inputFieldComplexContainer: {
    marginBottom: "12px"
  },
  inputFieldLabelFlexHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "6px"
  },
  inputFieldMainTitleLabel: {
    fontSize: "10px",
    fontWeight: "bold",
    color: "#cbd5e1"
  },
  bondLimitsPill: {
    fontSize: "8px",
    color: "#ffb800",
    background: "rgba(255,184,0,0.1)",
    padding: "2px 6px",
    borderRadius: "4px",
    textAlign: "right"
  },
  inputWithInvestBtnRow: {
    display: "flex",
    gap: "8px"
  },
  cyberInputWrapperGlassBox: {
    flex: 1,
    display: "flex",
    alignItems: "center",
    background: "#030814",
    border: "1px solid #132247",
    borderRadius: "6px",
    padding: "0 8px"
  },
  cyberInputPrependCurrencySymbol: {
    color: "#00ffa3",
    fontWeight: "bold",
    marginRight: "6px"
  },
  cyberInputActualInputElement: {
    flex: 1,
    background: "transparent",
    border: "none",
    color: "#fff",
    padding: "8px 0",
    outline: "none",
    fontSize: "12px"
  },
  investNowSideBtn: {
    background: "#00ffa3",
    border: "none",
    borderRadius: "6px",
    padding: "0 14px",
    fontWeight: "bold",
    fontSize: "10px",
    color: "#000",
    cursor: "pointer"
  },

  tenureSelectionStructureBox: {
    marginBottom: "12px"
  },
  tenureGridSelectorLayoutMatrix: {
    display: "grid",
    gridTemplateColumns: "repeat(6, 1fr)",
    gap: "6px",
    marginTop: "6px"
  },
  tenureSelectorNodeItemButton: {
    borderRadius: "6px",
    padding: "8px 4px",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    position: "relative"
  },
  tenureNodeYearLabelText: {
    fontSize: "9px",
    fontWeight: "bold"
  },
  tenureNodePercentageSubBadge: {
    fontSize: "7px",
    color: "#94a3b8"
  },
  tenureRateText: {
    fontSize: "11px",
    fontWeight: "bold",
    color: "#00ffa3"
  },
  selectedCheckBadge: {
    position: "absolute",
    top: "-4px",
    right: "-4px",
    background: "#00ffa3",
    color: "#000",
    borderRadius: "50%",
    width: "12px",
    height: "12px",
    fontSize: "8px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: "bold"
  },

  adviceSystemBarWrapperBox: {
    display: "flex",
    gap: "8px",
    background: "#030814",
    border: "1px solid #132247",
    padding: "8px",
    borderRadius: "6px",
    fontSize: "9px",
    color: "#cbd5e1"
  },
  adviceSystemLightBulbIcon: {
    fontSize: "12px"
  },
  adviceSystemTextBodyBlock: {
    lineHeight: "1.3"
  },

  compoundingHeaderSeparatorBlock: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    margin: "18px 0 12px"
  },
  separatorLineDecorativeLeft: {
    flex: 1,
    height: "1px",
    background: "#132247"
  },
  separatorCentralHeadlineTitleText: {
    fontSize: "11px",
    fontWeight: "bold",
    color: "#00ffa3"
  },
  separatorLineDecorativeRight: {
    flex: 1,
    height: "1px",
    background: "#132247"
  },

  projectionGrid2x2Layout: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "10px",
    marginBottom: "15px"
  },
  projectionDataMetricsCardCellBlock: {
    background: "#060d1f",
    border: "1px solid #132247",
    borderRadius: "10px",
    padding: "10px"
  },
  projectionCellTopMetaLine: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    marginBottom: "6px"
  },
  projectionCellIconCircleBox: {
    width: "20px",
    height: "20px",
    borderRadius: "4px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "10px"
  },
  projectionCellMetaTitleLabelText: {
    fontSize: "8px",
    color: "#94a3b8",
    fontWeight: "bold"
  },
  projectionCellBigMetricValueText: {
    fontSize: "16px",
    fontWeight: "bold",
    marginBottom: "6px"
  },
  projectionCellBottomStatusBarTrack: {
    height: "3px",
    background: "#1e293b",
    borderRadius: "2px",
    overflow: "hidden",
    marginBottom: "6px"
  },
  projectionCellStatusFillColorBar: {
    height: "100%"
  },
  projectionCellFooterNarrativeText: {
    margin: 0,
    fontSize: "8px",
    color: "#64748b"
  },

  legalComplianceActionShieldContainerBox: {
    marginBottom: "15px"
  },
  legalInteractiveClickableRowBox: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    background: "#060d1f",
    border: "1px solid #132247",
    padding: "10px",
    borderRadius: "10px",
    cursor: "pointer"
  },
  legalInteractiveClickableRowBoxActive: {
    borderColor: "#00ffa3"
  },
  legalPaperDocumentIconBadgeUnit: {
    fontSize: "16px"
  },
  legalTextStatementColumnLabelBlock: {
    flex: 1
  },
  legalMainDeclarationSentenceText: {
    margin: 0,
    fontSize: "9px",
    color: "#cbd5e1",
    lineHeight: "1.3"
  },
  legalHighLightHyperlinkText: {
    color: "#00ffa3"
  },
  termsLinksFlexRow: {
    fontSize: "8px",
    color: "#00ffa3",
    marginTop: "4px"
  },
  termsLinkItem: {
    cursor: "pointer"
  },
  legalCustomCheckboxSquareBox: {
    width: "16px",
    height: "16px",
    borderRadius: "4px",
    border: "1px solid",
    display: "flex",
    alignItems: "center",
    justifyContent: "center"
  },
  legalCheckboxCheckMarkCheck: {
    fontSize: "10px",
    color: "#000",
    fontWeight: "bold"
  },

  ultimateLaunchButtonCentralContainerFlex: {
    display: "flex",
    justifyContent: "center",
    marginBottom: "12px"
  },
  ultimateLaunchCoreActionBtnElement: {
    width: "100%",
    background: "linear-gradient(90deg, #00ffa3, #00d2ff)",
    border: "none",
    borderRadius: "20px",
    padding: "12px",
    color: "#000",
    fontWeight: "900",
    fontSize: "12px",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px"
  },

  footerSecurityBadgesRow: {
    textAlign: "center",
    fontSize: "9px",
    color: "#64748b",
    letterSpacing: "0.5px"
  },

  modalOverlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.8)",
    backdropFilter: "blur(4px)",
    zIndex: 100005,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "20px"
  },
  modalCard: {
    background: "#0f172a",
    border: "1px solid #1e293b",
    borderRadius: "16px",
    padding: "20px",
    maxWidth: "360px",
    width: "100%"
  }
};
