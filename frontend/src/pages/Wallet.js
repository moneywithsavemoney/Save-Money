import { useEffect, useMemo, useState, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { toast } from "react-toastify";
import html2canvas from "html2canvas";
import { API } from "../config";

const DUMMY_P2P_USERS = [
  { "name": "Aarav Sharma", "walletId": "WAL682410", "mobile": "+91 9718 20381", "balance": 15000 },
  { "name": "Aditi Rao", "walletId": "WAL295174", "mobile": "+91 8142 90518", "balance": 4500 },
  { "name": "Aditya Patel", "walletId": "WAL830219", "mobile": "+91 7029 48192", "balance": 22000 }
];

export default function Wallet() {
  const navigate = useNavigate();
  const location = useLocation();
  const go = navigate;

  const email = localStorage.getItem("email") || "";
  const token = localStorage.getItem("token") || "";

  const [loading, setLoading] = useState(true);
  const [showBalance, setShowBalance] = useState(true);

  const [wallet, setWallet] = useState({
    walletId: "",
    name: "",
    avatar: "",
    balance: 0,
    todayBalance: 0,
    referral: 0,
    performance: 0,
    team: 0,
    royalty: 0
  });
  const [history, setHistory] = useState([]);

  const [addOpen, setAddOpen] = useState(false);
  const [addAmount, setAddAmount] = useState("");
  const [withdrawOpen, setWithdrawOpen] = useState(false);

  // P2P & History States
  const [p2pModalOpen, setP2pModalOpen] = useState(false);
  const [p2pUserList, setP2pUserList] = useState([]);
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [selectedP2pUser, setSelectedP2pUser] = useState(null);
  const [reviewText, setReviewText] = useState("");
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewsList, setReviewsList] = useState({});

  const [receiverWalletId, setReceiverWalletId] = useState("");
  const [transferAmount, setTransferAmount] = useState("");
  const [receiverInfo, setReceiverInfo] = useState(null);
  const [confirmTransferOpen, setConfirmTransferOpen] = useState(false);
  const [depositTxnId, setDepositTxnId] = useState("");

  const [shareOpen, setShareOpen] = useState(false);
  const [withdrawStatus, setWithdrawStatus] = useState(null);
  const [historyFilter, setHistoryFilter] = useState("all");
  const [showAllHistory, setShowAllHistory] = useState(false);

  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [selectedTxn, setSelectedTxn] = useState(null);
  const receiptRef = useRef(null);

  const [statusOverlay, setStatusOverlay] = useState({
    show: false,
    type: "info",
    message: ""
  });

  useEffect(() => {
    loadWallet();
    loadWithdrawStatus();
    loadP2pUsers();
  }, []);

  const triggerStatusOverlay = (type, message) => {
    setStatusOverlay({ show: true, type, message });
    setTimeout(() => {
      setStatusOverlay({ show: false, type: "info", message: "" });
    }, 2200);
  };

  const loadWallet = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API}/wallet-summary`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          authorization: token || ""
        },
        body: JSON.stringify({ email })
      });
      const data = await res.json();
      if (data.success) {
        setWallet({
          walletId: data.walletId || data.user?.walletId || "WAL327865",
          name: data.name || data.user?.name || "User",
          avatar: data.avatar || data.user?.photo || data.user?.photoImage || "",
          balance: Number(data.balance || 4.00),
          todayBalance: Number(data.todayBalance || 0),
          referral: Number(data.referral || 0),
          performance: Number(data.performance || 0),
          team: Number(data.team || 0),
          royalty: Number(data.royalty || 0)
        });
        setHistory(Array.isArray(data.history) ? data.history : []);
      }
    } catch (err) {
      console.log("WALLET LOAD ERROR:", err);
    } finally {
      setLoading(false);
    }
  };

  const loadWithdrawStatus = async () => {
    try {
      const res = await fetch(`${API}/auto-withdraw-status`, {
        method: "POST",
        headers: { "Content-Type": "application/json", authorization: token || "" },
        body: JSON.stringify({ email })
      });
      const data = await res.json();
      if (data.success) setWithdrawStatus(data);
    } catch (err) {
      console.log("WITHDRAW STATUS ERROR", err);
    }
  };

  const loadP2pUsers = async () => {
    try {
      const res = await fetch(`${API}/p2p-users`, {
        method: "GET",
        headers: { authorization: token || "" }
      });
      const data = await res.json();
      if (data.success && data.users && data.users.length > 0) {
        setP2pUserList(data.users);
        if (data.reviews) setReviewsList(data.reviews);
      } else {
        setP2pUserList(DUMMY_P2P_USERS);
      }
    } catch (err) {
      setP2pUserList(DUMMY_P2P_USERS);
    }
  };

  const copyWalletId = async () => {
    try {
      await navigator.clipboard.writeText(wallet.walletId);
      toast.success("Wallet ID copied");
    } catch {
      toast.error("Copy failed");
    }
  };

  const money = (n) => `₹ ${Number(n || 0).toFixed(2)}`;
  const visibleBalance = showBalance ? money(wallet.balance) : "₹ ••••••••";

  const inviteLink = useMemo(() => {
    const ref = wallet.walletId || email;
    return `${window.location.origin}/register?ref=${encodeURIComponent(ref)}`;
  }, [wallet.walletId, email]);

  const filteredHistory = history.filter((item) => {
    if (historyFilter === "all") return true;
    return String(item.type).toLowerCase() === historyFilter;
  });

  const visibleHistory = showAllHistory ? filteredHistory : filteredHistory.slice(0, 5);

  if (loading) {
    return (
      <div style={styles.loadingPage}>
        <div style={styles.loadingCard}>
          <div style={{ fontSize: "40px" }}>👛</div>
          <h2>Loading Wallet...</h2>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.page}>
      <style>{mobileResponsiveCSS}</style>

      {/* TOP BRAND HEADER (Matching Screenshot 2) */}
      <div style={styles.topNavbar}>
        <div style={styles.navBrand}>
          <div style={styles.logoIcon}>📈</div>
          <div>
            <h3 style={styles.brandTitle}>SAVE MONEY</h3>
            <span style={styles.brandSub}>inspired groww</span>
          </div>
        </div>
        <div style={styles.navRight}>
          <div style={styles.bellWrap} onClick={() => window.location.href = "/notifications"}>
            🔔
            <span style={styles.bellBadge}>1</span>
          </div>
          <div style={styles.userDropdown}>
            <div style={styles.userAvatar}>👤</div>
            <span style={styles.userName}>user ▾</span>
          </div>
        </div>
      </div>

      <div style={styles.appContainer}>
        {/* MY WALLET MAIN CARD (Matching Screenshot 2) */}
        <div style={styles.heroCard}>
          <div style={styles.heroTopRow}>
            <div style={styles.heroLeftHeader}>
              <div style={styles.walletIconBox}>👛</div>
              <div>
                <h2 style={styles.heroTitle}>My Wallet</h2>
                <p style={styles.heroSubtitle}>Manage your balance, track transactions and grow more.</p>
              </div>
            </div>
            {/* Wallet Artwork / Illustration */}
            <div style={styles.heroArt}>
              <div style={styles.walletGraphic}>💳</div>
            </div>
          </div>

          {/* BALANCE BOX */}
          <div style={styles.balanceBox}>
            <div style={styles.balanceCol}>
              <span style={styles.boxLabel}>WALLET ID</span>
              <div style={styles.walletIdVal}>
                {wallet.walletId}
                <button onClick={copyWalletId} style={styles.copyBtnInline}>📄</button>
              </div>
            </div>
            <div style={styles.boxDivider}></div>
            <div style={styles.balanceCol}>
              <span style={styles.boxLabel}>AVAILABLE BALANCE</span>
              <div style={styles.balanceVal}>
                {visibleBalance}
                <button onClick={() => setShowBalance(!showBalance)} style={styles.eyeBtnInline}>
                  {showBalance ? "👁" : "🙈"}
                </button>
              </div>
            </div>
          </div>

          {/* ACTION BUTTONS */}
          <div style={styles.actionBtnRow}>
            <button style={styles.btnAddCash} onClick={() => setAddOpen(true)}>
              <span style={{ fontSize: "16px" }}>＋</span> Add Cash
            </button>
            <button style={styles.btnWithdraw} onClick={() => setWithdrawOpen(true)}>
              🎰 Withdraw
            </button>
            <button style={styles.btnP2p} onClick={() => setP2pModalOpen(true)}>
              🛡️ P2P
            </button>
          </div>
        </div>

        {/* MY INCOME SOURCES (Matching Screenshot 2) */}
        <div style={styles.sectionHeaderRow}>
          <div>
            <h3 style={styles.sectionTitle}>My Income Sources</h3>
            <span style={styles.sectionSub}>4 Ways to Earn with SAVE MONEY</span>
          </div>
          <button style={styles.viewDetailsBtn} onClick={() => go("/income-details")}>
            View Details ➔
          </button>
        </div>

        <div style={styles.incomeGrid}>
          {/* Referral */}
          <div style={{ ...styles.incomeBox, background: "#e6f9f0" }}>
            <div style={{ ...styles.incomeIconCircle, background: "#10b981" }}>👥</div>
            <div>
              <p style={styles.incomeName}>Referral Income</p>
              <h3 style={styles.incomeAmount}>₹{wallet.referral}</h3>
              <div style={styles.incomeWaves}>~~~</div>
            </div>
            <span style={{ ...styles.arrowCircle, background: "#10b981" }}>›</span>
          </div>

          {/* Performance */}
          <div style={{ ...styles.incomeBox, background: "#fff8e6" }}>
            <div style={{ ...styles.incomeIconCircle, background: "#f59e0b" }}>📊</div>
            <div>
              <p style={styles.incomeName}>Performance Income</p>
              <h3 style={styles.incomeAmount}>₹{wallet.performance}</h3>
              <div style={{ ...styles.incomeWaves, color: "#f59e0b" }}>~~~</div>
            </div>
            <span style={{ ...styles.arrowCircle, background: "#f59e0b" }}>›</span>
          </div>

          {/* Team */}
          <div style={{ ...styles.incomeBox, background: "#f3e8ff" }}>
            <div style={{ ...styles.incomeIconCircle, background: "#8b5cf6" }}>👥</div>
            <div>
              <p style={styles.incomeName}>Team Income</p>
              <h3 style={styles.incomeAmount}>₹{wallet.team}</h3>
              <div style={{ ...styles.incomeWaves, color: "#8b5cf6" }}>~~~</div>
            </div>
            <span style={{ ...styles.arrowCircle, background: "#8b5cf6" }}>›</span>
          </div>

          {/* Royalty */}
          <div style={{ ...styles.incomeBox, background: "#e0f2fe" }}>
            <div style={{ ...styles.incomeIconCircle, background: "#0ea5e9" }}>👑</div>
            <div>
              <p style={styles.incomeName}>Royalty Income</p>
              <h3 style={styles.incomeAmount}>₹{wallet.royalty}</h3>
              <div style={{ ...styles.incomeWaves, color: "#0ea5e9" }}>~~~</div>
            </div>
            <span style={{ ...styles.arrowCircle, background: "#0ea5e9" }}>›</span>
          </div>
        </div>

        {/* INVITE BANNER (Matching Screenshot 2) */}
        <div style={styles.inviteBanner}>
          <div style={styles.inviteLeft}>
            <div style={styles.giftIcon}>🎁</div>
            <div>
              <span style={styles.growText}>Grow More</span>
              <h3 style={styles.inviteTitle}>Invite Your Friends</h3>
              <p style={styles.inviteSub}>& Earn Unlimited Rewards</p>
            </div>
          </div>
          <button style={styles.inviteNowBtn} onClick={() => setShareOpen(true)}>
            👤+ Invite Now ➔
          </button>
        </div>

        {/* WALLET HISTORY SECTION (Matching Screenshot 2) */}
        <div style={styles.historyCard}>
          <div style={styles.historyHeader}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <div style={styles.shieldIcon}>🛡️</div>
              <div>
                <h3 style={styles.historyTitleText}>Wallet History</h3>
                <p style={styles.historySubText}>Your recent transactions (Click to view receipt)</p>
              </div>
            </div>
            <select
              style={styles.filterDropdown}
              value={historyFilter}
              onChange={(e) => setHistoryFilter(e.target.value)}
            >
              <option value="all">All</option>
              <option value="credit">Credit</option>
              <option value="debit">Debit</option>
            </select>
          </div>

          <div style={styles.historyList}>
            {visibleHistory.length === 0 ? (
              <div style={styles.emptyText}>No Wallet History Found</div>
            ) : (
              visibleHistory.map((item, index) => {
                const rawType = String(item.type || "").toLowerCase();
                const isCredit = rawType.includes("credit") || rawType.includes("add") || rawType.includes("reward");
                const desc = item.description || item.note || item.type || "Daily reward added";

                return (
                  <div
                    key={index}
                    style={styles.historyRow}
                    onClick={() => setSelectedTxn({ ...item, isCredit, desc })}
                  >
                    <div style={styles.historyLeft}>
                      <div style={{
                        ...styles.arrowTypeCircle,
                        background: isCredit ? "#e6f9f0" : "#fee2e2",
                        color: isCredit ? "#10b981" : "#ef4444"
                      }}>
                        {isCredit ? "↓" : "↑"}
                      </div>
                      <div>
                        <h4 style={styles.itemTitle}>{desc}</h4>
                        <span style={styles.itemDate}>
                          {item.createdAt || item.date ? new Date(item.createdAt || item.date).toLocaleDateString("en-IN") : "24/9/2026"}
                        </span>
                      </div>
                    </div>

                    <div style={styles.historyRight}>
                      <div style={{
                        fontWeight: "800",
                        fontSize: "15px",
                        color: isCredit ? "#10b981" : "#ef4444"
                      }}>
                        {isCredit ? "+ ₹" : "- ₹"}{Math.abs(Number(item.amount || 2)).toLocaleString()}
                      </div>
                      <span style={styles.badgeSuccess}>Success</span>
                      <span style={styles.rowRightArrow}>›</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* BOTTOM FEATURES */}
        <div style={styles.bottomFeatures}>
          <div style={styles.featureItem}>
            <div style={styles.featureIcon}>🛡️</div>
            <div>
              <b>Secure Transactions</b>
              <p>Your money is 100% safe ›</p>
            </div>
          </div>

          <div style={styles.featureItem}>
            <div style={styles.featureIcon}>⚡</div>
            <div>
              <b>Instant Payments</b>
              <p>Quick transfer in seconds ›</p>
            </div>
          </div>

          <div style={styles.featureItem}>
            <div style={styles.featureIcon}>🏆</div>
            <div>
              <b>Trusted Platform</b>
              <p>Used by thousands of users ›</p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

const mobileResponsiveCSS = `
  @media (max-width: 768px) {
    .income-grid {
      grid-template-columns: repeat(2, 1fr) !important;
    }
  }
`;

const styles = {
  page: {
    minHeight: "100vh",
    background: "#f0f4f9",
    fontFamily: "'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    paddingBottom: "30px"
  },
  topNavbar: {
    background: "#0052cc",
    color: "#fff",
    padding: "12px 20px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center"
  },
  navBrand: {
    display: "flex",
    alignItems: "center",
    gap: "10px"
  },
  logoIcon: {
    fontSize: "24px",
    background: "#ffb800",
    borderRadius: "8px",
    padding: "2px 6px"
  },
  brandTitle: {
    margin: 0,
    fontSize: "16px",
    fontWeight: "900",
    letterSpacing: "0.5px"
  },
  brandSub: {
    fontSize: "11px",
    opacity: 0.85
  },
  navRight: {
    display: "flex",
    alignItems: "center",
    gap: "15px"
  },
  bellWrap: {
    position: "relative",
    cursor: "pointer",
    fontSize: "18px"
  },
  bellBadge: {
    position: "absolute",
    top: "-5px",
    right: "-5px",
    background: "#ef4444",
    color: "#fff",
    borderRadius: "50%",
    fontSize: "10px",
    padding: "2px 5px",
    fontWeight: "bold"
  },
  userDropdown: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    cursor: "pointer",
    background: "rgba(255, 255, 255, 0.15)",
    padding: "4px 10px",
    borderRadius: "20px"
  },
  userAvatar: {
    background: "#22c55e",
    borderRadius: "50%",
    width: "24px",
    height: "24px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "12px"
  },
  userName: {
    fontSize: "13px",
    fontWeight: "600"
  },
  appContainer: {
    maxWidth: "800px",
    margin: "0 auto",
    padding: "12px"
  },
  heroCard: {
    background: "linear-gradient(135deg, #0284c7 0%, #2563eb 50%, #1d4ed8 100%)",
    borderRadius: "20px",
    padding: "20px",
    color: "#fff",
    boxShadow: "0 10px 20px rgba(37,99,235,0.2)",
    marginBottom: "20px"
  },
  heroTopRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "16px"
  },
  heroLeftHeader: {
    display: "flex",
    alignItems: "center",
    gap: "12px"
  },
  walletIconBox: {
    background: "rgba(255,255,255,0.2)",
    padding: "10px",
    borderRadius: "14px",
    fontSize: "24px"
  },
  heroTitle: {
    margin: 0,
    fontSize: "20px",
    fontWeight: "800"
  },
  heroSubtitle: {
    margin: 0,
    fontSize: "11px",
    opacity: 0.8
  },
  heroArt: {
    fontSize: "36px"
  },
  balanceBox: {
    background: "rgba(255, 255, 255, 0.15)",
    backdropFilter: "blur(10px)",
    borderRadius: "14px",
    padding: "12px 16px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: "16px"
  },
  balanceCol: {
    display: "flex",
    flexDirection: "column"
  },
  boxLabel: {
    fontSize: "10px",
    fontWeight: "700",
    opacity: 0.8
  },
  walletIdVal: {
    fontSize: "16px",
    fontWeight: "800",
    display: "flex",
    alignItems: "center",
    gap: "6px"
  },
  copyBtnInline: {
    background: "none",
    border: "none",
    color: "#fff",
    cursor: "pointer",
    fontSize: "12px"
  },
  boxDivider: {
    width: "1px",
    height: "30px",
    background: "rgba(255,255,255,0.2)"
  },
  balanceVal: {
    fontSize: "22px",
    fontWeight: "900",
    display: "flex",
    alignItems: "center",
    gap: "8px"
  },
  eyeBtnInline: {
    background: "none",
    border: "none",
    color: "#fff",
    cursor: "pointer"
  },
  actionBtnRow: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr 1fr",
    gap: "10px"
  },
  btnAddCash: {
    background: "#fff",
    color: "#0f172a",
    border: "none",
    borderRadius: "10px",
    padding: "10px",
    fontWeight: "800",
    fontSize: "13px",
    cursor: "pointer"
  },
  btnWithdraw: {
    background: "#f97316",
    color: "#fff",
    border: "none",
    borderRadius: "10px",
    padding: "10px",
    fontWeight: "800",
    fontSize: "13px",
    cursor: "pointer"
  },
  btnP2p: {
    background: "#0284c7",
    color: "#fff",
    border: "1px solid rgba(255,255,255,0.4)",
    borderRadius: "10px",
    padding: "10px",
    fontWeight: "800",
    fontSize: "13px",
    cursor: "pointer"
  },
  sectionHeaderRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "12px"
  },
  sectionTitle: {
    margin: 0,
    fontSize: "16px",
    fontWeight: "800",
    color: "#0f172a"
  },
  sectionSub: {
    fontSize: "11px",
    color: "#64748b"
  },
  viewDetailsBtn: {
    background: "#f1f5f9",
    color: "#6366f1",
    border: "none",
    padding: "6px 12px",
    borderRadius: "20px",
    fontSize: "11px",
    fontWeight: "700",
    cursor: "pointer"
  },
  incomeGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(4, 1fr)",
    gap: "10px",
    marginBottom: "16px"
  },
  incomeBox: {
    borderRadius: "14px",
    padding: "12px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    position: "relative"
  },
  incomeIconCircle: {
    width: "32px",
    height: "32px",
    borderRadius: "50%",
    color: "#fff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "14px"
  },
  incomeName: {
    margin: 0,
    fontSize: "11px",
    fontWeight: "700",
    color: "#334155"
  },
  incomeAmount: {
    margin: "2px 0 0 0",
    fontSize: "15px",
    fontWeight: "800"
  },
  incomeWaves: {
    fontSize: "10px",
    color: "#10b981"
  },
  arrowCircle: {
    width: "20px",
    height: "20px",
    borderRadius: "50%",
    color: "#fff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "12px",
    fontWeight: "bold"
  },
  inviteBanner: {
    background: "#fff",
    borderRadius: "16px",
    padding: "12px 16px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    boxShadow: "0 4px 12px rgba(0,0,0,0.03)",
    marginBottom: "16px",
    border: "1px solid #f1f5f9"
  },
  inviteLeft: {
    display: "flex",
    alignItems: "center",
    gap: "12px"
  },
  giftIcon: {
    fontSize: "28px"
  },
  growText: {
    fontSize: "10px",
    color: "#f59e0b",
    fontWeight: "800"
  },
  inviteTitle: {
    margin: 0,
    fontSize: "14px",
    fontWeight: "800",
    color: "#0f172a"
  },
  inviteSub: {
    margin: 0,
    fontSize: "11px",
    color: "#64748b"
  },
  inviteNowBtn: {
    background: "#a855f7",
    color: "#fff",
    border: "none",
    padding: "8px 14px",
    borderRadius: "20px",
    fontSize: "12px",
    fontWeight: "700",
    cursor: "pointer"
  },
  historyCard: {
    background: "#fff",
    borderRadius: "16px",
    padding: "16px",
    boxShadow: "0 4px 12px rgba(0,0,0,0.03)",
    marginBottom: "16px"
  },
  historyHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "12px",
    borderBottom: "1px solid #f1f5f9",
    paddingBottom: "10px"
  },
  shieldIcon: {
    background: "#e0f2fe",
    padding: "6px",
    borderRadius: "8px",
    fontSize: "16px"
  },
  historyTitleText: {
    margin: 0,
    fontSize: "15px",
    fontWeight: "800",
    color: "#0f172a"
  },
  historySubText: {
    margin: 0,
    fontSize: "10px",
    color: "#64748b"
  },
  filterDropdown: {
    border: "1px solid #e2e8f0",
    borderRadius: "8px",
    padding: "4px 8px",
    fontSize: "12px",
    outline: "none"
  },
  historyList: {
    display: "flex",
    flexDirection: "column",
    gap: "10px"
  },
  historyRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "8px 0",
    borderBottom: "1px solid #f8fafc",
    cursor: "pointer"
  },
  historyLeft: {
    display: "flex",
    alignItems: "center",
    gap: "10px"
  },
  arrowTypeCircle: {
    width: "30px",
    height: "30px",
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: "bold",
    fontSize: "14px"
  },
  itemTitle: {
    margin: 0,
    fontSize: "12px",
    fontWeight: "700",
    color: "#1e293b"
  },
  itemDate: {
    fontSize: "10px",
    color: "#94a3b8"
  },
  historyRight: {
    display: "flex",
    alignItems: "center",
    gap: "8px"
  },
  badgeSuccess: {
    background: "#dcfce7",
    color: "#15803d",
    fontSize: "9px",
    fontWeight: "800",
    padding: "2px 6px",
    borderRadius: "10px"
  },
  rowRightArrow: {
    fontSize: "16px",
    color: "#cbd5e1"
  },
  bottomFeatures: {
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: "10px"
  },
  featureItem: {
    background: "#fff",
    borderRadius: "12px",
    padding: "10px",
    display: "flex",
    alignItems: "center",
    gap: "8px",
    fontSize: "11px",
    boxShadow: "0 2px 8px rgba(0,0,0,0.02)"
  },
  featureIcon: {
    fontSize: "18px"
  },
  loadingPage: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "#f0f4f9"
  },
  loadingCard: {
    textAlign: "center"
  },
  emptyText: {
    textAlign: "center",
    color: "#94a3b8",
    padding: "20px",
    fontSize: "12px"
  }
};
