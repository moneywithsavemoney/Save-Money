import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { API } from "../config";

export default function SaveMoney() {
  const navigate = useNavigate();

  // persistent storage
  const email = localStorage.getItem("email") || "";
  const token = localStorage.getItem("token") || "";

  // states
  const [balance, setBalance] = useState(0);
  const [amount, setAmount] = useState("");
  const [years, setYears] = useState(5);
  const [accepted, setAccepted] = useState(false);
  const [termsOpen, setTermsOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  // coupon states
  const [couponCode, setCouponCode] = useState("");
  const [discountAmount, setDiscountAmount] = useState(0);
  const [appliedCouponName, setAppliedCouponName] = useState("");

  // overlay
  const [statusOverlay, setStatusOverlay] = useState({
    show: false,
    type: "info",
    message: ""
  });

  // interactive focus states
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
      setBalance(Number(data.balance || data.wallet || 0));
    } catch (err) {
      console.log("CRITICAL WALLET BALANCE SYNC ERROR:", err);
    }
  };

  const getRate = (y) => {
    if (Number(y) === 1) return 11;
    if (Number(y) === 3) return 14;
    if (Number(y) === 5) return 20;
    if (Number(y) === 10) return 24;
    if (Number(y) === 15) return 27;
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

  const acceptTerms = () => {
    setAccepted(true);
    setTermsOpen(false);
    showStatusMsg("success", "Terms & Conditions Accepted!");
  };

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
      <div style={styles.neonMatrixGrid}></div>
      <div style={styles.dynamicAuraSphere1}></div>
      <div style={styles.dynamicAuraSphere2}></div>

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

      {/* MAIN CONTAINER WITH SIDEBAR & CONTENT */}
      <div style={styles.mainAppLayout}>
        
        {/* SIDEBAR AS IN 1ST SCREENSHOT (HOME.JS STYLED) */}
        <div style={styles.homeStyleSidebar}>
          <div style={styles.sidebarBrandSection}>
            <div style={styles.sidebarLogoBox}>
              <span style={{ fontSize: "20px" }}>🛡️</span>
            </div>
            <h2 style={styles.sidebarBrandTitle}>SAVE MONEY</h2>
            <p style={styles.sidebarBrandSubtitle}>Invest Small, Earn Big</p>
          </div>

          <div style={styles.sidebarMenuContainer}>
            <button style={{ ...styles.trapezoidMenuItem, backgroundColor: "#1d3557" }} onClick={() => navigate("/dashboard")}>
              <span>🏠</span> Dashboard
            </button>
            <button style={{ ...styles.trapezoidMenuItem, backgroundColor: "#065a60" }} onClick={() => navigate("/my-investment")}>
              <span>📈</span> My Investment
            </button>
            <button style={{ ...styles.trapezoidMenuItem, backgroundColor: "#7f5539", borderLeft: "4px solid #00ffa3" }}>
              <span>💰</span> Save Money
            </button>
            <button style={{ ...styles.trapezoidMenuItem, backgroundColor: "#4a154b" }} onClick={() => navigate("/one-time")}>
              <span>⚡</span> One Time
            </button>
            <button style={{ ...styles.trapezoidMenuItem, backgroundColor: "#1e3a8a" }} onClick={() => navigate("/plan-pdf")}>
              <span>📋</span> Plan PDF
            </button>
            <button style={{ ...styles.trapezoidMenuItem, backgroundColor: "#0f4c5c" }} onClick={() => navigate("/wallet")}>
              <span>🌐</span> Add Fund
            </button>
            <button style={{ ...styles.trapezoidMenuItem, backgroundColor: "#581845" }} onClick={() => navigate("/refer")}>
              <span>👥</span> Refer & Earn
            </button>
            <button style={{ ...styles.trapezoidMenuItem, backgroundColor: "#6b2d28" }} onClick={() => navigate("/withdraw")}>
              <span>➔</span> Withdraw
            </button>
            <button style={{ ...styles.trapezoidMenuItem, backgroundColor: "#4a154b" }} onClick={() => navigate("/daily-reward")}>
              <span>🎁</span> Daily Reward
            </button>
            <button style={{ ...styles.trapezoidMenuItem, backgroundColor: "#1e3a8a" }} onClick={() => navigate("/assistance")}>
              <span>📊</span> Investment Assistance
            </button>
            <button style={{ ...styles.trapezoidMenuItem, backgroundColor: "#2b2d42" }} onClick={() => navigate("/support")}>
              <span>🎧</span> Support
            </button>
            <button style={{ ...styles.trapezoidMenuItem, backgroundColor: "#4a154b" }} onClick={() => navigate("/profile")}>
              <span>👤</span> Profile
            </button>
            <button style={{ ...styles.trapezoidMenuItem, backgroundColor: "#581845" }} onClick={() => { localStorage.clear(); navigate("/login"); }}>
              <span>🚪</span> Logout
            </button>
          </div>

          <div style={styles.sidebarBottomBanner}>
            <img 
              src="https://images.unsplash.com/photo-1518531933037-91b2f5f229cc?auto=format&fit=crop&w=500&q=80" 
              alt="Plant Growth" 
              style={styles.sidebarBannerImage} 
            />
          </div>
        </div>

        {/* MAIN BODY DISPLAY CANVAS */}
        <div style={styles.ultimateMainCanvas}>
          
          <div style={styles.controlHelmRow}>
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

          <header style={styles.cyberBrandHeaderSection}>
            <h1 style={styles.cyberMainTitleText}>
              SAVE <span style={styles.cyberMainTitleHighlight}>MONEY</span>
            </h1>
            <p style={styles.cyberBrandSubtextPara}>INTELLIGENT WEALTH GENERATION SYSTEM</p>
          </header>

          {/* 2ND SCREENSHOT RESTRUCTURED: SIDE-BY-SIDE EQUAL PARALLEL BOXES */}
          <div style={styles.executiveTwinControlGrid}>
            
            {/* BOX 1: WALLET ASSET CONSOLE */}
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
                  <span style={styles.walletCapSubtextText}>Status: Fully Eligible for Auto-Investment</span>
                  <span style={styles.walletCapPercentageText}>100% Verified</span>
                </div>
              </div>

              <div style={styles.couponSectionContainer}>
                <div style={styles.inputFieldLabelFlexHeader}>
                  <span style={styles.inputFieldMainTitleLabel}>HAVE A PROMO / COUPON CODE?</span>
                  {appliedCouponName && <span style={styles.couponAppliedBadge}>APPLIED: {appliedCouponName}</span>}
                </div>

                {!appliedCouponName ? (
                  <div style={{
                    ...styles.cyberInputWrapperGlassBox,
                    borderColor: activeCouponFocus ? "#00ffa3" : "#334155",
                    height: "46px"
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
                    <span style={styles.appliedCouponSuccessText}>🎟️ {appliedCouponName} Applied (-₹{discountAmount})</span>
                    <button style={styles.removeCouponBtn} onClick={handleRemoveCoupon}>Remove</button>
                  </div>
                )}
              </div>

              <button 
                style={styles.walletActionInjectFundsBtn}
                onClick={() => (window.location.href = "/wallet")}
              >
                <span style={styles.btnAccentPlusSymbol}>+</span> DEPOSIT FRESH CAPITAL INTO POOL
              </button>
            </section>

            {/* BOX 2: SIP CONGREGATION INPUT METRICS CONFIGS */}
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

              <div style={styles.inputFieldComplexContainer}>
                <div style={styles.inputFieldLabelFlexHeader}>
                  <span style={styles.inputFieldMainTitleLabel}>CHOOSE MONTHLY COMMITMENT AMOUNT</span>
                  <span style={styles.inputFieldRightHandBadge}>MINIMUM BOUNDARY REQUIRED</span>
                </div>
                <div style={{
                  ...styles.cyberInputWrapperGlassBox,
                  borderColor: activeInputFocus ? "#00ffa3" : "#334155"
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
                    <span style={styles.validationWarningText}>System Warning: Minimum required config is ₹2000</span>
                  </div>
                )}
              </div>

              <div style={styles.tenureSelectionStructureBox}>
                <div style={styles.inputFieldLabelFlexHeader}>
                  <span style={styles.inputFieldMainTitleLabel}>SELECT ASSET ACCUMULATION TIMEFRAME</span>
                  <span style={styles.inputFieldRightHandBadgeAccent}>ROI ACTIVE</span>
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
                              : "#475569"
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
                  <div style={{...styles.summaryRow, borderTop: "1px solid rgba(255,255,255,0.1)", paddingTop: "6px", fontWeight: "bold"}}>
                    <span>Deducted from Wallet:</span>
                    <span style={{color: "#00d2ff"}}>{money(calc.finalPayableToday)}</span>
                  </div>
                </div>
              )}

              <div style={styles.adviceSystemBarWrapperBox}>
                <div style={styles.adviceSystemLightBulbIcon}>💡</div>
                <div style={styles.adviceSystemTextBodyBlock}>
                  <strong>Compounding Alert:</strong> Tenure &gt; 5 Years triggers exponential growth modules.
                </div>
              </div>

            </section>

          </div>

          {/* SEPARATOR */}
          <div style={styles.compoundingHeaderSeparatorBlock}>
            <div style={styles.separatorLineDecorativeLeft}></div>
            <span style={styles.separatorCentralHeadlineTitleText}>LIVE ASSET PROJECTION DATA SHEETS</span>
            <div style={styles.separatorLineDecorativeRight}></div>
          </div>

          {/* 3RD SCREENSHOT RESTRUCTURED: 2x2 BOXES GRID (2 TOP, 2 BOTTOM) */}
          <div style={styles.projectionFourColumnGrid}>
            
            {/* BOX 1 */}
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

            {/* BOX 2 */}
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

            {/* BOX 3 */}
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
              <p style={styles.projectionCellFooterNarrativeText}>Pure asset yield generation extracted via algorithmic interest modules.</p>
            </div>

            {/* BOX 4 */}
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
              <p style={styles.projectionCellFooterNarrativeText}>Total forecasted terminal capital extraction sum upon maturity.</p>
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
              <span style={styles.ultimateLaunchBtnIconBadgeNode}>🛡️</span> 
              <span style={styles.ultimateLaunchBtnMainStringLabelText}>
                {loading ? "AUTHORIZING DIGITAL SECURE DEPOSIT..." : "INITIATE & LAUNCH ASSET CONFIGURATION PLAN"}
              </span>
            </button>
          </div>

        </div>

      </div>

      {/* MODALS */}
      {termsOpen && (
        <div style={styles.modalSystemFallbackOverlayBlurScreen}>
          <div style={styles.modalSystemOuterBoxArchitecture}>
            <div style={styles.modalSystemHeaderTitleFlexRow}>
              <div style={styles.modalSystemHeaderIconBadge}>📋</div>
              <h2 style={styles.modalSystemHeaderMainTitleHeadlineText}>Terms & Conditions</h2>
            </div>
            
            <div style={styles.modalSystemInternalScrollableContentPanelBox}>
              <p style={styles.modalSystemParagraphParaBlockText}>Save Money SIP is a disciplined monthly saving and investment plan. Minimum investment is ₹2000.</p>
              <p style={styles.modalSystemParagraphParaBlockText}>User must select SIP duration and understand all estimated return values before confirming.</p>
              <p style={styles.modalSystemParagraphParaBlockText}>Returns shown inside the application are estimated values only.</p>
            </div>

            <button style={styles.modalSystemAcceptActionButtonTriggerElement} onClick={acceptTerms}>
              Accept & Commit Verification
            </button>
          </div>
        </div>
      )}

      {helpOpen && (
        <div style={styles.modalSystemFallbackOverlayBlurScreen}>
          <div style={{...styles.modalSystemOuterBoxArchitecture, borderColor: "#3b82f6"}}>
            <div style={styles.modalSystemHeaderTitleFlexRow}>
              <div style={{...styles.modalSystemHeaderIconBadge, color: "#3b82f6"}}>🧠</div>
              <h2 style={{...styles.modalSystemHeaderMainTitleHeadlineText, color: "#3b82f6"}}>Investment Assistant</h2>
            </div>
            
            <div style={styles.modalSystemInternalScrollableContentPanelBox}>
              <p style={styles.modalSystemParagraphParaBlockTextHelpTextBangla}>Save Money SIP প্ল্যান আপনাকে প্রতি মাসে নিয়মিত সঞ্চয় করতে সাহায্য করবে।</p>
              <p style={styles.modalSystemParagraphParaBlockTextHelpTextBangla}>সর্বনিম্ন SIP পরিমাণ ২,০০০ টাকা। মেয়াদ নির্বাচন করলে আনুমানিক রিটার্ন দেখতে পাবেন।</p>
            </div>

            <button 
              style={{...styles.modalSystemAcceptActionButtonTriggerElement, background: "linear-gradient(90deg, #3b82f6, #1d4ed8)"}} 
              onClick={() => setHelpOpen(false)}
            >
              Acknowledge & Close Core
            </button>
          </div>
        </div>
      )}

    </div>
  );
}

// =========================================================================
// STYLES
// =========================================================================
const styles = {
  cyberPageWrapper: {
    minHeight: "100vh",
    width: "100vw",
    backgroundColor: "#060913",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    fontFamily: "'Inter', 'Segoe UI', Roboto, sans-serif",
    color: "#ffffff",
    overflowX: "hidden",
    position: "relative"
  },
  neonMatrixGrid: {
    position: "absolute",
    inset: 0,
    backgroundImage: `linear-gradient(rgba(255, 255, 255, 0.015) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 255, 255, 0.015) 1px, transparent 1px)`,
    backgroundSize: "40px 40px",
    pointerEvents: "none"
  },
  dynamicAuraSphere1: {
    position: "absolute",
    top: "-100px",
    left: "0",
    width: "500px",
    height: "500px",
    background: "radial-gradient(circle, rgba(0, 255, 163, 0.06) 0%, transparent 70%)",
    pointerEvents: "none"
  },
  dynamicAuraSphere2: {
    position: "absolute",
    bottom: "0",
    right: "0",
    width: "600px",
    height: "600px",
    background: "radial-gradient(circle, rgba(0, 210, 255, 0.05) 0%, transparent 70%)",
    pointerEvents: "none"
  },
  vipStatusBar: {
    width: "100%",
    height: "32px",
    backgroundColor: "#040711",
    borderBottom: "1px solid #1e293b",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "0 20px",
    boxSizing: "border-box",
    zIndex: 10
  },
  vipStatusIndicator: {
    fontSize: "11px",
    fontWeight: "700",
    color: "#00ffa3",
    display: "flex",
    alignItems: "center",
    gap: "8px"
  },
  pulseNode: {
    width: "6px",
    height: "6px",
    backgroundColor: "#00ffa3",
    borderRadius: "50%"
  },
  vipTimestamp: {
    fontSize: "10px",
    color: "#94a3b8",
    fontWeight: "600"
  },
  mainAppLayout: {
    display: "flex",
    width: "100%",
    maxWidth: "1350px",
    position: "relative",
    zIndex: 5,
    minHeight: "calc(100vh - 32px)"
  },

  /* 1ST SCREENSHOT EXACT HOME.JS SIDEBAR STYLING */
  homeStyleSidebar: {
    width: "280px",
    backgroundColor: "#090d16",
    borderRight: "1px solid rgba(255,255,255,0.08)",
    padding: "20px 14px",
    display: "flex",
    flexDirection: "column",
    gap: "16px",
    boxSizing: "border-box",
    flexShrink: 0
  },
  sidebarBrandSection: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    textAlign: "center",
    marginBottom: "10px"
  },
  sidebarLogoBox: {
    width: "48px",
    height: "48px",
    borderRadius: "50%",
    border: "2px solid #00ffa3",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0, 255, 163, 0.1)",
    marginBottom: "6px"
  },
  sidebarBrandTitle: {
    margin: 0,
    fontSize: "16px",
    fontWeight: "900",
    color: "#ffffff",
    letterSpacing: "1px"
  },
  sidebarBrandSubtitle: {
    margin: 0,
    fontSize: "10px",
    color: "#00ffa3",
    fontWeight: "600"
  },
  sidebarMenuContainer: {
    display: "flex",
    flexDirection: "column",
    gap: "6px",
    width: "100%"
  },
  trapezoidMenuItem: {
    width: "100%",
    padding: "10px 16px",
    clipPath: "polygon(0 0, 92% 0, 100% 50%, 92% 100%, 0 100%)",
    border: "none",
    color: "#ffffff",
    fontSize: "13px",
    fontWeight: "700",
    display: "flex",
    alignItems: "center",
    gap: "12px",
    cursor: "pointer",
    transition: "transform 0.2s ease"
  },
  sidebarBottomBanner: {
    marginTop: "auto",
    width: "100%",
    borderRadius: "16px",
    overflow: "hidden",
    height: "120px",
    border: "1px solid rgba(255,255,255,0.1)"
  },
  sidebarBannerImage: {
    width: "100%",
    height: "100%",
    objectFit: "cover"
  },

  /* MAIN CANVAS AREA */
  ultimateMainCanvas: {
    flex: 1,
    padding: "24px",
    boxSizing: "border-box",
    display: "flex",
    flexDirection: "column"
  },
  controlHelmRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "20px",
    width: "100%"
  },
  helmActionBtn: {
    padding: "8px 16px",
    borderRadius: "12px",
    border: "1px solid #334155",
    backgroundColor: "rgba(15, 23, 42, 0.8)",
    color: "#cbd5e1",
    fontSize: "11px",
    fontWeight: "700",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    gap: "6px"
  },
  helmActionBtnHover: {
    borderColor: "#00ffa3",
    color: "#ffffff"
  },
  helmBtnIcon: {
    fontSize: "10px"
  },
  helmCenterBadge: {
    backgroundColor: "rgba(30, 41, 59, 0.6)",
    border: "1px solid rgba(255, 215, 0, 0.3)",
    padding: "4px 12px",
    borderRadius: "20px"
  },
  goldTextBadge: {
    fontSize: "9px",
    fontWeight: "800",
    color: "#ffd700",
    letterSpacing: "1px"
  },
  helmHelpBtn: {
    padding: "8px 16px",
    borderRadius: "12px",
    border: "1px solid #334155",
    backgroundColor: "rgba(15, 23, 42, 0.8)",
    color: "#60a5fa",
    fontSize: "11px",
    fontWeight: "700",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    gap: "6px"
  },
  helmHelpBtnHover: {
    borderColor: "#60a5fa"
  },
  helpQuestionMark: {
    width: "14px",
    height: "14px",
    borderRadius: "50%",
    backgroundColor: "rgba(59, 130, 246, 0.25)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "9px"
  },
  cyberBrandHeaderSection: {
    textAlign: "center",
    marginBottom: "24px"
  },
  cyberMainTitleText: {
    margin: 0,
    fontSize: "28px",
    fontWeight: "900",
    letterSpacing: "2px"
  },
  cyberMainTitleHighlight: {
    color: "#00ffa3"
  },
  cyberBrandSubtextPara: {
    fontSize: "10px",
    letterSpacing: "2px",
    color: "#94a3b8",
    fontWeight: "700",
    margin: "4px 0 0"
  },

  /* 2ND SCREENSHOT RESTRUCTURED: SIDE-BY-SIDE EQUAL PARALLEL GRID */
  executiveTwinControlGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "20px",
    width: "100%",
    marginBottom: "24px"
  },
  cyberLuxuryCardUnit: {
    backgroundColor: "rgba(13, 20, 35, 0.75)",
    backdropFilter: "blur(12px)",
    borderRadius: "20px",
    border: "1px solid rgba(255, 255, 255, 0.08)",
    padding: "20px",
    boxSizing: "border-box",
    position: "relative",
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between"
  },
  cyberLuxuryCardUnitHover: {
    borderColor: "rgba(0, 255, 163, 0.3)"
  },
  cardGlowCornerTop: {
    position: "absolute",
    top: 0,
    left: "10%",
    width: "60px",
    height: "2px",
    background: "linear-gradient(90deg, transparent, #00d2ff, transparent)"
  },
  cardGlowCornerTopAccent: {
    position: "absolute",
    top: 0,
    left: "10%",
    width: "60px",
    height: "2px",
    background: "linear-gradient(90deg, transparent, #00ffa3, transparent)"
  },
  cardHeaderFlexBox: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "16px"
  },
  cardTitleBadgeRow: {
    display: "flex",
    alignItems: "center",
    gap: "10px"
  },
  cardHeaderIconBoxContainer: {
    width: "32px",
    height: "32px",
    borderRadius: "10px",
    backgroundColor: "rgba(0, 210, 255, 0.15)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "14px"
  },
  cardHeaderIconBoxContainerAccent: {
    width: "32px",
    height: "32px",
    borderRadius: "10px",
    backgroundColor: "rgba(0, 255, 163, 0.15)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "14px"
  },
  cardHeaderMainTitleText: {
    margin: 0,
    fontSize: "12px",
    fontWeight: "800",
    color: "#ffffff"
  },
  onlinePulseStatusText: {
    fontSize: "8px",
    fontWeight: "700",
    color: "#00d2ff",
    backgroundColor: "rgba(0, 210, 255, 0.15)",
    padding: "3px 8px",
    borderRadius: "6px"
  },
  onlinePulseStatusTextAccent: {
    fontSize: "8px",
    fontWeight: "700",
    color: "#00ffa3",
    backgroundColor: "rgba(0, 255, 163, 0.15)",
    padding: "3px 8px",
    borderRadius: "6px"
  },
  walletBalanceDisplayBlock: {
    backgroundColor: "rgba(2, 6, 12, 0.6)",
    border: "1px solid rgba(255,255,255,0.06)",
    borderRadius: "14px",
    padding: "16px",
    marginBottom: "14px"
  },
  walletMetaLabelRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "8px"
  },
  walletMetaLabel: {
    fontSize: "9px",
    fontWeight: "700",
    color: "#cbd5e1"
  },
  walletSecureShieldTag: {
    fontSize: "8px",
    color: "#94a3b8"
  },
  walletLargeNumericalSum: {
    fontSize: "26px",
    fontWeight: "900",
    color: "#ffffff",
    marginBottom: "10px"
  },
  walletProgressIndicatorTrack: {
    width: "100%",
    height: "4px",
    backgroundColor: "#334155",
    borderRadius: "10px",
    overflow: "hidden",
    marginBottom: "8px"
  },
  walletProgressIndicatorFillBar: {
    width: "100%",
    height: "100%",
    background: "linear-gradient(90deg, #00d2ff, #00ffa3)"
  },
  walletBottomCapLabelFlex: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center"
  },
  walletCapSubtextText: {
    fontSize: "9px",
    color: "#cbd5e1"
  },
  walletCapPercentageText: {
    fontSize: "9px",
    fontWeight: "700",
    color: "#00ffa3"
  },
  couponSectionContainer: {
    width: "100%",
    marginBottom: "14px"
  },
  couponAppliedBadge: {
    fontSize: "8px",
    fontWeight: "700",
    color: "#00ffa3",
    backgroundColor: "rgba(0,255,163,0.15)",
    padding: "2px 6px",
    borderRadius: "4px"
  },
  applyCouponBtnElement: {
    padding: "0 14px",
    height: "32px",
    backgroundColor: "#00ffa3",
    color: "#020617",
    fontWeight: "800",
    fontSize: "10px",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer"
  },
  appliedCouponInfoBox: {
    width: "100%",
    height: "40px",
    backgroundColor: "rgba(0,255,163,0.08)",
    border: "1px solid rgba(0,255,163,0.3)",
    borderRadius: "10px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "0 10px"
  },
  appliedCouponSuccessText: {
    fontSize: "11px",
    fontWeight: "700",
    color: "#00ffa3"
  },
  removeCouponBtn: {
    backgroundColor: "transparent",
    border: "none",
    color: "#ff4a4a",
    fontSize: "10px",
    fontWeight: "700",
    cursor: "pointer"
  },
  walletActionInjectFundsBtn: {
    width: "100%",
    height: "42px",
    borderRadius: "12px",
    background: "linear-gradient(90deg, #1e293b 0%, #0f172a 100%)",
    border: "1px solid rgba(255,255,255,0.08)",
    color: "#ffffff",
    fontSize: "11px",
    fontWeight: "700",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "6px"
  },
  btnAccentPlusSymbol: {
    color: "#00d2ff",
    fontSize: "14px"
  },
  inputFieldComplexContainer: {
    width: "100%",
    marginBottom: "14px"
  },
  inputFieldLabelFlexHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "6px"
  },
  inputFieldMainTitleLabel: {
    fontSize: "9px",
    fontWeight: "700",
    color: "#cbd5e1"
  },
  inputFieldRightHandBadge: {
    fontSize: "8px",
    fontWeight: "700",
    color: "#ff9c00",
    backgroundColor: "rgba(255,156,0,0.15)",
    padding: "2px 6px",
    borderRadius: "4px"
  },
  inputFieldRightHandBadgeAccent: {
    fontSize: "8px",
    fontWeight: "700",
    color: "#00ffa3",
    backgroundColor: "rgba(0,255,163,0.15)",
    padding: "2px 6px",
    borderRadius: "4px"
  },
  cyberInputWrapperGlassBox: {
    height: "42px",
    width: "100%",
    borderRadius: "10px",
    border: "1px solid #475569",
    backgroundColor: "rgba(2, 6, 12, 0.7)",
    display: "flex",
    alignItems: "center",
    padding: "0 10px",
    boxSizing: "border-box",
    gap: "8px"
  },
  cyberInputPrependCurrencySymbol: {
    fontSize: "15px",
    fontWeight: "800",
    color: "#00ffa3"
  },
  cyberInputActualInputElement: {
    flex: 1,
    border: "none",
    outline: "none",
    backgroundColor: "transparent",
    fontSize: "13px",
    fontWeight: "700",
    color: "#ffffff"
  },
  cyberInputAppendBadgeUnit: {
    backgroundColor: "rgba(255,255,255,0.06)",
    padding: "3px 6px",
    borderRadius: "6px"
  },
  cyberInputAppendBadgeText: {
    fontSize: "8px",
    fontWeight: "700",
    color: "#cbd5e1"
  },
  cyberValidationWarningAlertBox: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    marginTop: "6px",
    backgroundColor: "rgba(239, 68, 68, 0.12)",
    padding: "6px 10px",
    borderRadius: "8px"
  },
  validationWarningIcon: {
    fontSize: "10px"
  },
  validationWarningText: {
    fontSize: "10px",
    color: "#f87171",
    fontWeight: "600"
  },
  tenureSelectionStructureBox: {
    width: "100%",
    marginBottom: "14px"
  },
  tenureGridSelectorLayoutMatrix: {
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: "8px"
  },
  tenureSelectorNodeItemButton: {
    height: "50px",
    borderRadius: "10px",
    border: "1px solid",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    position: "relative",
    padding: "2px"
  },
  tenureNodeYearLabelText: {
    fontSize: "10px",
    fontWeight: "800"
  },
  tenureNodePercentageSubBadge: {
    fontSize: "8px",
    fontWeight: "700"
  },
  tenureNodeSelectionCheckIndicatorCircle: {
    position: "absolute",
    top: "-3px",
    right: "-3px",
    width: "14px",
    height: "14px",
    borderRadius: "50%",
    backgroundColor: "#ffffff",
    color: "#020617",
    fontSize: "8px",
    fontWeight: "900",
    display: "flex",
    alignItems: "center",
    justifyContent: "center"
  },
  paymentSummaryBox: {
    backgroundColor: "rgba(0, 210, 255, 0.04)",
    border: "1px solid rgba(0, 210, 255, 0.2)",
    borderRadius: "10px",
    padding: "10px",
    marginBottom: "12px",
    display: "flex",
    flexDirection: "column",
    gap: "4px"
  },
  summaryRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    fontSize: "10px",
    color: "#cbd5e1"
  },
  adviceSystemBarWrapperBox: {
    backgroundColor: "rgba(0, 210, 255, 0.05)",
    border: "1px dashed rgba(0, 210, 255, 0.3)",
    borderRadius: "10px",
    padding: "10px",
    display: "flex",
    alignItems: "center",
    gap: "8px"
  },
  adviceSystemLightBulbIcon: {
    fontSize: "14px",
    color: "#00d2ff"
  },
  adviceSystemTextBodyBlock: {
    fontSize: "10px",
    color: "#cbd5e1"
  },

  /* SEPARATOR LINE */
  compoundingHeaderSeparatorBlock: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
    margin: "10px 0 16px"
  },
  separatorLineDecorativeLeft: {
    flex: 1,
    height: "1px",
    background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.15))"
  },
  separatorLineDecorativeRight: {
    flex: 1,
    height: "1px",
    background: "linear-gradient(90deg, rgba(255,255,255,0.15), transparent)"
  },
  separatorCentralHeadlineTitleText: {
    padding: "0 12px",
    fontSize: "10px",
    fontWeight: "800",
    color: "#94a3b8",
    letterSpacing: "1.5px"
  },

  /* 3RD SCREENSHOT RESTRUCTURED: 2x2 BOXES GRID (2 TOP, 2 BOTTOM) */
  projectionFourColumnGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "16px",
    width: "100%",
    marginBottom: "20px"
  },
  projectionDataMetricsCardCellBlock: {
    backgroundColor: "rgba(10, 16, 30, 0.85)",
    borderRadius: "14px",
    border: "1px solid rgba(255,255,255,0.06)",
    padding: "16px",
    display: "flex",
    flexDirection: "column",
    gap: "8px"
  },
  projectionCellTopMetaLine: {
    display: "flex",
    alignItems: "center",
    gap: "8px"
  },
  projectionCellIconCircleBox: {
    width: "28px",
    height: "28px",
    borderRadius: "6px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "14px"
  },
  projectionCellMetaTitleLabelText: {
    fontSize: "10px",
    fontWeight: "700",
    color: "#ffffff"
  },
  projectionCellBigMetricValueText: {
    fontSize: "20px",
    fontWeight: "900"
  },
  projectionCellBottomStatusBarTrack: {
    width: "100%",
    height: "3px",
    backgroundColor: "rgba(255,255,255,0.05)",
    borderRadius: "3px"
  },
  projectionCellStatusFillColorBar: {
    height: "100%",
    borderRadius: "3px"
  },
  projectionCellFooterNarrativeText: {
    margin: 0,
    fontSize: "9px",
    color: "#cbd5e1"
  },
  systemAnalyticalDisclaimerBox: {
    width: "100%",
    backgroundColor: "rgba(15, 23, 42, 0.5)",
    border: "1px solid rgba(255,255,255,0.06)",
    borderRadius: "12px",
    padding: "12px",
    display: "flex",
    alignItems: "center",
    gap: "10px",
    marginBottom: "16px"
  },
  disclaimerIconInfoBadge: {
    width: "14px",
    height: "14px",
    borderRadius: "50%",
    border: "1px solid #cbd5e1",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "9px",
    color: "#ffffff",
    fontWeight: "700",
    flexShrink: 0
  },
  disclaimerTextMessagePara: {
    fontSize: "10px",
    color: "#ffffff",
    lineHeight: "1.4",
    margin: 0
  },
  legalComplianceActionShieldContainerBox: {
    width: "100%",
    marginBottom: "20px"
  },
  legalInteractiveClickableRowBox: {
    backgroundColor: "rgba(13, 20, 35, 0.6)",
    border: "1px solid #475569",
    borderRadius: "12px",
    padding: "12px 16px",
    display: "flex",
    alignItems: "center",
    gap: "12px",
    cursor: "pointer"
  },
  legalInteractiveClickableRowBoxActive: {
    borderColor: "rgba(0, 255, 163, 0.5)",
    backgroundColor: "rgba(0, 255, 163, 0.04)"
  },
  legalCustomCheckboxSquareBox: {
    width: "16px",
    height: "16px",
    borderRadius: "4px",
    border: "2px solid",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0
  },
  legalCheckboxCheckMarkCheck: {
    color: "#020617",
    fontSize: "10px",
    fontWeight: "900"
  },
  legalTextStatementColumnLabelBlock: {
    flex: 1
  },
  legalMainDeclarationSentenceText: {
    margin: 0,
    fontSize: "10px",
    color: "#ffffff",
    lineHeight: "1.4"
  },
  legalHighLightHyperlinkText: {
    color: "#00ffa3",
    fontWeight: "700"
  },
  legalPaperDocumentIconBadgeUnit: {
    fontSize: "16px",
    flexShrink: 0
  },
  ultimateLaunchButtonCentralContainerFlex: {
    width: "100%",
    display: "flex",
    justifyContent: "center",
    marginBottom: "20px"
  },
  ultimateLaunchCoreActionBtnElement: {
    width: "100%",
    height: "48px",
    borderRadius: "14px",
    border: "none",
    background: "linear-gradient(90deg, #00ffa3 0%, #00d2ff 50%, #3b82f6 100%)",
    color: "#020617",
    fontSize: "13px",
    fontWeight: "900",
    letterSpacing: "0.5px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px"
  },
  ultimateLaunchBtnIconBadgeNode: {
    fontSize: "16px"
  },
  ultimateLaunchBtnMainStringLabelText: {
    textShadow: "0 1px 1px rgba(255,255,255,0.3)"
  },
  modalSystemFallbackOverlayBlurScreen: {
    position: "fixed",
    inset: 0,
    backgroundColor: "rgba(2,4,10,0.92)",
    backdropFilter: "blur(10px)",
    zIndex: 99999,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "20px"
  },
  modalSystemOuterBoxArchitecture: {
    width: "100%",
    maxWidth: "400px",
    backgroundColor: "#0b111e",
    border: "1px solid rgba(0, 255, 163, 0.3)",
    borderRadius: "20px",
    padding: "20px"
  },
  modalSystemHeaderTitleFlexRow: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    marginBottom: "14px"
  },
  modalSystemHeaderIconBadge: {
    fontSize: "20px",
    color: "#00ffa3"
  },
  modalSystemHeaderMainTitleHeadlineText: {
    margin: 0,
    fontSize: "16px",
    fontWeight: "800",
    color: "#ffffff"
  },
  modalSystemInternalScrollableContentPanelBox: {
    maxHeight: "200px",
    overflowY: "auto",
    display: "flex",
    flexDirection: "column",
    gap: "10px"
  },
  modalSystemParagraphParaBlockText: {
    margin: 0,
    fontSize: "11px",
    color: "#cbd5e1",
    lineHeight: "1.5"
  },
  modalSystemParagraphParaBlockTextHelpTextBangla: {
    margin: 0,
    fontSize: "12px",
    color: "#ffffff",
    lineHeight: "1.5"
  },
  modalSystemAcceptActionButtonTriggerElement: {
    width: "100%",
    height: "42px",
    marginTop: "16px",
    border: "none",
    borderRadius: "12px",
    background: "linear-gradient(90deg, #00ffa3, #00b876)",
    color: "#020617",
    fontWeight: "800",
    fontSize: "12px",
    cursor: "pointer"
  },
  glassOverlayShield: {
    position: "fixed",
    inset: 0,
    backgroundColor: "rgba(2, 4, 10, 0.85)",
    backdropFilter: "blur(12px)",
    zIndex: 50000,
    display: "flex",
    alignItems: "center",
    justifyContent: "center"
  },
  glassOverlayContainer: {
    backgroundColor: "#0d1321",
    padding: "30px",
    borderRadius: "20px",
    textAlign: "center",
    border: "1px solid #334155",
    maxWidth: "400px",
    width: "85%",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "16px"
  },
  glassOverlayIconFrame: {
    width: "60px",
    height: "60px",
    borderRadius: "16px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "26px",
    fontWeight: "bold"
  },
  glassOverlayMessageText: {
    fontSize: "15px",
    color: "#ffffff",
    margin: 0,
    fontWeight: "700"
  }
};
