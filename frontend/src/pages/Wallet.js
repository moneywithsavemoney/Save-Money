import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { API } from "../config";

export default function Wallet() {
  const navigate = useNavigate();
  const email = localStorage.getItem("email") || "";
  const token = localStorage.getItem("token") || "";

  const [loading, setLoading] = useState(false);
  const [showBalance, setShowBalance] = useState(true);

  const [wallet, setWallet] = useState({
    walletId: "WAL327865",
    name: "User",
    balance: 4.00,
    todayBalance: 0,
    referral: 0,
    performance: 0,
    team: 0,
    royalty: 0
  });

  const [history] = useState([
    { id: 1, type: "credit", desc: "Daily reward added", date: "24/9/2026", amount: 2, status: "Success" },
    { id: 2, type: "credit", desc: "Daily reward added", date: "22/9/2026", amount: 2, status: "Success" },
    { id: 3, type: "debit", desc: "SIP Auto Renew Payment", date: "22/9/2026", amount: 2000, status: "Success" },
    { id: 4, type: "debit", desc: "Sallary Credit", date: "5/9/2026", amount: 19418, status: "Success" },
    { id: 5, type: "debit", desc: "SIP Renew Payment", date: "2/9/2026", amount: 2000, status: "Success" }
  ]);

  const [historyFilter, setHistoryFilter] = useState("all");
  const [showAllHistory, setShowAllHistory] = useState(false);

  useEffect(() => {
    loadWallet();
  }, []);

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
          walletId: data.walletId || "WAL327865",
          name: data.name || "User",
          balance: Number(data.balance || 4.00),
          todayBalance: Number(data.todayBalance || 0),
          referral: Number(data.referral || 0),
          performance: Number(data.performance || 0),
          team: Number(data.team || 0),
          royalty: Number(data.royalty || 0)
        });
      }
    } catch (err) {
      console.log("Wallet fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  const copyWalletId = () => {
    navigator.clipboard.writeText(wallet.walletId);
    toast.success("Wallet ID Copied!");
  };

  const filteredHistory = history.filter(item => {
    if (historyFilter === "credit") return item.type === "credit";
    if (historyFilter === "debit") return item.type === "debit";
    return true;
  });

  const visibleHistory = showAllHistory ? filteredHistory : filteredHistory.slice(0, 5);

  return (
    <div style={styles.container}>
      {/* Top Header */}
      <div style={styles.topHeader}>
        <div style={styles.menuIcon}>
          <span></span>
          <span></span>
          <span></span>
        </div>
        <div style={styles.rightHeader}>
          <div style={styles.bellBtn}>
            🔔<span style={styles.bellDot}></span>
          </div>
          <div style={styles.profilePill}>
            <div style={styles.avatar}>👤</div>
            <span style={styles.profileName}>User</span>
            <span style={{ fontSize: "10px", color: "#fff" }}>▼</span>
          </div>
        </div>
      </div>

      {/* Main Page Title */}
      <div style={styles.pageTitleBox}>
        <div style={styles.headerWalletIcon}>👛</div>
        <div>
          <h2 style={styles.mainHeading}>My Wallet</h2>
          <p style={styles.subHeading}>Manage your balance, track transactions and grow more.</p>
        </div>
      </div>

      {/* Wallet Card */}
      <div style={styles.heroCard}>
        <button style={styles.eyeBtn} onClick={() => setShowBalance(!showBalance)}>
          👁
        </button>

        <div style={styles.walletIdRow}>
          <div>
            <div style={styles.cardTag}>WALLET ID</div>
            <div style={styles.cardVal}>
              {wallet.walletId}
              <span onClick={copyWalletId} style={styles.copyIcon}>📋</span>
            </div>
          </div>
        </div>

        <div style={styles.dashedLine} />

        <div>
          <div style={styles.cardTag}>AVAILABLE BALANCE</div>
          <div style={styles.balanceText}>
            ₹ {showBalance ? wallet.balance.toFixed(2) : "••••••"}
          </div>
        </div>

        {/* 3D Illustration Graphics */}
        <div style={styles.graphicBox}>
          <div style={styles.illustrationBag}>👛</div>
          <div style={styles.coin1}>₹</div>
          <div style={styles.coin2}>₹</div>
          <div style={styles.arrowUp}>↗</div>
        </div>

        {/* Action Buttons */}
        <div style={styles.btnRow}>
          <button style={styles.addCashBtn} onClick={() => navigate("/add-cash")}>
            <span style={{ fontSize: "16px", fontWeight: "bold" }}>+</span> Add Cash
          </button>
          <button style={styles.withdrawBtn} onClick={() => navigate("/withdraw")}>
            💳 Withdraw
          </button>
          <button style={styles.p2pBtn} onClick={() => navigate("/p2p")}>
            🛡️ P2P
          </button>
        </div>
      </div>

      {/* 4 Grid Earnings */}
      <div style={styles.grid4}>
        <div style={styles.gridItem}>
          <div style={{ ...styles.gridIcon, background: "#10b981" }}>👥</div>
          <div style={styles.gridLabel}>REFERRAL</div>
          <div style={styles.gridValue}>₹{wallet.referral}</div>
          <div style={{ color: "#10b981", fontSize: "10px", letterSpacing: "1px" }}>~~~</div>
        </div>

        <div style={styles.gridItem}>
          <div style={{ ...styles.gridIcon, background: "#f59e0b" }}>📈</div>
          <div style={styles.gridLabel}>PERFORMANCE</div>
          <div style={styles.gridValue}>₹{wallet.performance}</div>
          <div style={{ color: "#f59e0b", fontSize: "10px", letterSpacing: "1px" }}>~~~</div>
        </div>

        <div style={styles.gridItem}>
          <div style={{ ...styles.gridIcon, background: "#2563eb" }}>👥</div>
          <div style={styles.gridLabel}>TEAM</div>
          <div style={styles.gridValue}>₹{wallet.team}</div>
          <div style={{ color: "#2563eb", fontSize: "10px", letterSpacing: "1px" }}>~~~</div>
        </div>

        <div style={styles.gridItem}>
          <div style={{ ...styles.gridIcon, background: "#9333ea" }}>👑</div>
          <div style={styles.gridLabel}>ROYALTY</div>
          <div style={styles.gridValue}>₹{wallet.royalty}</div>
          <div style={{ color: "#9333ea", fontSize: "10px", letterSpacing: "1px" }}>~~~</div>
        </div>
      </div>

      {/* Today Earning Strip */}
      <div style={styles.todayBar}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div style={styles.todayIconBox}>👛</div>
          <div>
            <div style={styles.todayTitle}>TODAY EARNING</div>
            <div style={styles.todayAmount}>
              ₹{wallet.todayBalance} <span style={{ color: "#10b981", fontSize: "11px" }}>~~~</span>
            </div>
          </div>
        </div>
        <div style={{ color: "#2563eb", fontWeight: "bold", fontSize: "18px" }}>›</div>
      </div>

      {/* Wallet History Card */}
      <div style={styles.historyCard}>
        <div style={styles.historyHeader}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <span style={{ color: "#2563eb" }}>🛡️</span>
              <h3 style={styles.historyTitleText}>Wallet History</h3>
            </div>
            <p style={styles.historySubText}>Your recent transactions (Click to view receipt)</p>
          </div>
          <select 
            style={styles.selectFilter} 
            value={historyFilter} 
            onChange={(e) => setHistoryFilter(e.target.value)}
          >
            <option value="all">All</option>
            <option value="credit">Credit</option>
            <option value="debit">Debit</option>
          </select>
        </div>

        <div style={styles.historyList}>
          {visibleHistory.map((item) => (
            <div key={item.id} style={styles.historyRow}>
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <div style={{
                  ...styles.arrowCircle,
                  background: item.type === "credit" ? "#dcfce7" : "#fee2e2",
                  color: item.type === "credit" ? "#16a34a" : "#dc2626"
                }}>
                  {item.type === "credit" ? "↓" : "↑"}
                </div>
                <div>
                  <div style={styles.itemDesc}>{item.desc}</div>
                  <div style={styles.itemDate}>{item.date}</div>
                </div>
              </div>

              <div style={{ textAlign: "right" }}>
                <div style={{
                  fontWeight: "800",
                  fontSize: "14px",
                  color: item.type === "credit" ? "#16a34a" : "#dc2626"
                }}>
                  {item.type === "credit" ? "+ ₹" : "- ₹"}{Number(item.amount).toLocaleString()}
                </div>
                <span style={styles.badgeSuccess}>Success</span>
              </div>
            </div>
          ))}
        </div>

        <button style={styles.viewMoreBtn} onClick={() => setShowAllHistory(!showAllHistory)}>
          {showAllHistory ? "Show Less ▲" : "View More ▼"}
        </button>
      </div>

      {/* Trust Badges */}
      <div style={styles.trustSection}>
        <div style={styles.trustCard}>
          <div style={styles.trustIconWrapper}>🛡️</div>
          <div>
            <div style={styles.trustMainTitle}>Secure Transactions</div>
            <div style={styles.trustSubTitle}>Your money is 100% safe</div>
          </div>
          <div style={styles.blueCheck}>✓</div>
        </div>

        <div style={styles.trustCard}>
          <div style={styles.trustIconWrapper}>⚡</div>
          <div>
            <div style={styles.trustMainTitle}>Instant Payments</div>
            <div style={styles.trustSubTitle}>Quick transfer in seconds</div>
          </div>
          <div style={{ marginLeft: "auto", fontSize: "16px" }}>🕒</div>
        </div>

        <div style={styles.trustCard}>
          <div style={styles.trustIconWrapper}>🏆</div>
          <div>
            <div style={styles.trustMainTitle}>Trusted Platform</div>
            <div style={styles.trustSubTitle}>Used by thousands of users</div>
          </div>
          <div style={{ marginLeft: "auto", fontSize: "16px" }}>👥</div>
        </div>
      </div>

      {/* Bottom Navigation */}
      <div style={styles.bottomNav}>
        <div style={styles.navItem} onClick={() => navigate("/home")}>
          <span style={styles.navIcon}>🏠</span>
          <span style={styles.navLabel}>Home</span>
        </div>

        <div style={{ ...styles.navItem, color: "#2563eb" }}>
          <span style={styles.navIcon}>👛</span>
          <span style={{ ...styles.navLabel, fontWeight: "bold" }}>Wallet</span>
        </div>

        <div style={styles.centerAddMoney} onClick={() => navigate("/add-cash")}>
          <div style={styles.plusBtn}>+</div>
          <span style={{ fontSize: "10px", marginTop: "2px", color: "#2563eb" }}>Add Money</span>
        </div>

        <div style={styles.navItem} onClick={() => navigate("/history")}>
          <span style={styles.navIcon}>🕒</span>
          <span style={styles.navLabel}>History</span>
        </div>

        <div style={styles.navItem} onClick={() => navigate("/profile")}>
          <span style={styles.navIcon}>👤</span>
          <span style={styles.navLabel}>Profile</span>
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: {
    minHeight: "100vh",
    background: "linear-gradient(180deg, #1d4ed8 0%, #3b82f6 200px, #f1f5f9 200px, #f1f5f9 100%)",
    padding: "12px 14px 80px 14px",
    boxSizing: "border-box",
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
  },
  topHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "14px"
  },
  menuIcon: {
    display: "flex",
    flexDirection: "column",
    gap: "4px",
    cursor: "pointer"
  },
  rightHeader: {
    display: "flex",
    alignItems: "center",
    gap: "10px"
  },
  bellBtn: {
    background: "#fff",
    borderRadius: "50%",
    width: "34px",
    height: "34px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
    cursor: "pointer",
    fontSize: "14px"
  },
  bellDot: {
    position: "absolute",
    top: "6px",
    right: "6px",
    width: "7px",
    height: "7px",
    background: "#ef4444",
    borderRadius: "50%",
    border: "1px solid #fff"
  },
  profilePill: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    background: "rgba(255, 255, 255, 0.25)",
    padding: "3px 10px 3px 4px",
    borderRadius: "20px"
  },
  avatar: {
    width: "26px",
    height: "26px",
    borderRadius: "50%",
    background: "#2563eb",
    color: "#fff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "12px"
  },
  profileName: {
    fontSize: "13px",
    fontWeight: "700",
    color: "#fff"
  },
  pageTitleBox: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    color: "#fff",
    marginBottom: "16px"
  },
  headerWalletIcon: {
    width: "44px",
    height: "44px",
    background: "#2563eb",
    borderRadius: "12px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "24px",
    boxShadow: "0 4px 10px rgba(0,0,0,0.15)"
  },
  mainHeading: {
    margin: 0,
    fontSize: "20px",
    fontWeight: "900"
  },
  subHeading: {
    margin: "2px 0 0 0",
    fontSize: "11px",
    opacity: 0.9
  },
  heroCard: {
    background: "linear-gradient(135deg, #7e22ce 0%, #c026d3 50%, #ec4899 100%)",
    borderRadius: "20px",
    padding: "18px",
    color: "#fff",
    position: "relative",
    boxShadow: "0 10px 20px rgba(126, 34, 206, 0.25)",
    marginBottom: "14px",
    overflow: "hidden"
  },
  eyeBtn: {
    position: "absolute",
    top: "16px",
    right: "16px",
    background: "rgba(255,255,255,0.2)",
    border: "none",
    borderRadius: "50%",
    width: "32px",
    height: "32px",
    color: "#fff",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center"
  },
  cardTag: {
    fontSize: "10px",
    fontWeight: "800",
    letterSpacing: "0.5px",
    opacity: 0.85
  },
  cardVal: {
    fontSize: "17px",
    fontWeight: "900",
    marginTop: "2px"
  },
  copyIcon: {
    marginLeft: "6px",
    cursor: "pointer",
    fontSize: "14px"
  },
  dashedLine: {
    borderTop: "1px dashed rgba(255,255,255,0.3)",
    margin: "12px 0"
  },
  balanceText: {
    fontSize: "28px",
    fontWeight: "900",
    marginTop: "2px"
  },
  graphicBox: {
    position: "absolute",
    right: "14px",
    bottom: "65px",
    width: "100px",
    height: "80px"
  },
  illustrationBag: {
    position: "absolute",
    right: "0",
    bottom: "0",
    width: "65px",
    height: "50px",
    background: "linear-gradient(135deg, #2563eb, #0284c7)",
    borderRadius: "12px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "26px",
    boxShadow: "-2px 4px 10px rgba(0,0,0,0.2)"
  },
  coin1: {
    position: "absolute",
    top: "8px",
    left: "10px",
    width: "26px",
    height: "26px",
    borderRadius: "50%",
    background: "#eab308",
    color: "#fff",
    fontWeight: "bold",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "13px"
  },
  coin2: {
    position: "absolute",
    top: "0px",
    left: "32px",
    width: "24px",
    height: "24px",
    borderRadius: "50%",
    background: "#f97316",
    color: "#fff",
    fontWeight: "bold",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "11px"
  },
  arrowUp: {
    position: "absolute",
    top: "-2px",
    right: "4px",
    color: "#22c55e",
    fontWeight: "900",
    fontSize: "18px"
  },
  btnRow: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr 1fr",
    gap: "8px",
    marginTop: "18px"
  },
  addCashBtn: {
    background: "#fff",
    color: "#2563eb",
    border: "none",
    borderRadius: "10px",
    padding: "10px 0",
    fontWeight: "800",
    fontSize: "12px",
    cursor: "pointer"
  },
  withdrawBtn: {
    background: "linear-gradient(135deg, #f97316, #fb923c)",
    color: "#fff",
    border: "none",
    borderRadius: "10px",
    padding: "10px 0",
    fontWeight: "800",
    fontSize: "12px",
    cursor: "pointer"
  },
  p2pBtn: {
    background: "linear-gradient(135deg, #0284c7, #38bdf8)",
    color: "#fff",
    border: "none",
    borderRadius: "10px",
    padding: "10px 0",
    fontWeight: "800",
    fontSize: "12px",
    cursor: "pointer"
  },
  grid4: {
    display: "grid",
    gridTemplateColumns: "repeat(4, 1fr)",
    gap: "8px",
    marginBottom: "10px"
  },
  gridItem: {
    background: "#fff",
    borderRadius: "14px",
    padding: "10px 4px",
    textAlign: "center",
    boxShadow: "0 2px 5px rgba(0,0,0,0.03)"
  },
  gridIcon: {
    width: "34px",
    height: "34px",
    borderRadius: "50%",
    color: "#fff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    margin: "0 auto 6px auto",
    fontSize: "15px"
  },
  gridLabel: {
    fontSize: "9px",
    fontWeight: "800",
    color: "#475569"
  },
  gridValue: {
    fontSize: "13px",
    fontWeight: "900",
    color: "#0f172a",
    margin: "2px 0"
  },
  todayBar: {
    background: "#e0f2fe",
    borderRadius: "14px",
    padding: "10px 14px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: "14px"
  },
  todayIconBox: {
    width: "32px",
    height: "32px",
    borderRadius: "50%",
    background: "#ec4899",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#fff",
    fontSize: "14px"
  },
  todayTitle: {
    fontSize: "10px",
    fontWeight: "800",
    color: "#0369a1"
  },
  todayAmount: {
    fontSize: "14px",
    fontWeight: "900",
    color: "#0c4a6e"
  },
  historyCard: {
    background: "#fff",
    borderRadius: "18px",
    padding: "14px",
    boxShadow: "0 4px 10px rgba(0,0,0,0.03)",
    marginBottom: "14px"
  },
  historyHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: "12px"
  },
  historyTitleText: {
    margin: 0,
    fontSize: "15px",
    fontWeight: "800",
    color: "#0f172a"
  },
  historySubText: {
    margin: "2px 0 0 0",
    fontSize: "10px",
    color: "#64748b"
  },
  selectFilter: {
    background: "#f8fafc",
    border: "1px solid #e2e8f0",
    borderRadius: "8px",
    padding: "4px 8px",
    fontSize: "11px",
    color: "#334155",
    outline: "none"
  },
  historyList: {
    display: "flex",
    flexDirection: "column",
    gap: "10px"
  },
  historyRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    paddingBottom: "8px",
    borderBottom: "1px solid #f1f5f9"
  },
  arrowCircle: {
    width: "30px",
    height: "30px",
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: "900",
    fontSize: "13px"
  },
  itemDesc: {
    fontSize: "12px",
    fontWeight: "700",
    color: "#1e293b"
  },
  itemDate: {
    fontSize: "10px",
    color: "#94a3b8"
  },
  badgeSuccess: {
    background: "#dcfce7",
    color: "#16a34a",
    fontSize: "9px",
    fontWeight: "800",
    padding: "2px 6px",
    borderRadius: "4px"
  },
  viewMoreBtn: {
    width: "100%",
    background: "#f8fafc",
    border: "none",
    padding: "8px",
    borderRadius: "8px",
    color: "#2563eb",
    fontWeight: "800",
    fontSize: "11px",
    marginTop: "8px",
    cursor: "pointer"
  },
  trustSection: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
    marginBottom: "16px"
  },
  trustCard: {
    background: "#fff",
    borderRadius: "14px",
    padding: "10px 14px",
    display: "flex",
    alignItems: "center",
    gap: "12px"
  },
  trustIconWrapper: {
    width: "32px",
    height: "32px",
    borderRadius: "50%",
    background: "#eff6ff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "15px"
  },
  trustMainTitle: {
    fontSize: "12px",
    fontWeight: "800",
    color: "#1e293b"
  },
  trustSubTitle: {
    fontSize: "10px",
    color: "#64748b"
  },
  blueCheck: {
    marginLeft: "auto",
    width: "18px",
    height: "18px",
    borderRadius: "50%",
    background: "#2563eb",
    color: "#fff",
    fontSize: "10px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center"
  },
  bottomNav: {
    position: "fixed",
    bottom: 0,
    left: 0,
    right: 0,
    background: "#fff",
    height: "58px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-around",
    boxShadow: "0 -4px 10px rgba(0,0,0,0.05)",
    zIndex: 100
  },
  navItem: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    color: "#64748b",
    cursor: "pointer"
  },
  navIcon: {
    fontSize: "18px"
  },
  navLabel: {
    fontSize: "10px",
    marginTop: "2px"
  },
  centerAddMoney: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    cursor: "pointer",
    marginTop: "-18px"
  },
  plusBtn: {
    width: "42px",
    height: "42px",
    borderRadius: "50%",
    background: "linear-gradient(135deg, #2563eb, #38bdf8)",
    color: "#fff",
    fontSize: "22px",
    fontWeight: "bold",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    boxShadow: "0 4px 8px rgba(37, 99, 235, 0.35)"
  }
};
