import { useEffect, useMemo, useState, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { toast } from "react-toastify";
import html2canvas from "html2canvas";
import { API } from "../config";

const DUMMY_P2P_USERS = [
  { "name": "Aarav Sharma", "walletId": "WAL682410", "mobile": "+91 9718 20381", "balance": 15000 },
  { "name": "Aditi Rao", "walletId": "WAL295174", "mobile": "+91 8142 90518", "balance": 4500 },
  { "name": "Aditya Patel", "walletId": "WAL830219", "mobile": "+91 7029 48192", "balance": 22000 },
  { "name": "Akash Verma", "walletId": "WAL194825", "mobile": "+91 6381 05928", "balance": 5000 },
  { "name": "Ananya Sen", "walletId": "WAL742018", "mobile": "+91 9472 10845", "balance": 12500 },
  { "name": "Aniket Chatterjee", "walletId": "WAL381905", "mobile": "+91 8891 30482", "balance": 30000 },
  { "name": "Anish Das", "walletId": "WAL918234", "mobile": "+91 7402 81935", "balance": 7800 },
  { "name": "Anjan Roy", "walletId": "WAL472910", "mobile": "+91 9152 74829", "balance": 2500 },
  { "name": "Ankita Mukherjee", "walletId": "WAL503819", "mobile": "+91 6291 04827", "balance": 45000 },
  { "name": "Ananya Banerjee", "walletId": "WAL829104", "mobile": "+91 8301 94820", "balance": 18200 }
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

  // --- P2P স্টেট ---
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
  const [isDownloadingPlan, setIsDownloadingPlan] = useState(false);

  const [selectedTxn, setSelectedTxn] = useState(null);
  const receiptRef = useRef(null);
  const overlayTimerRef = useRef(null);

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
    if (overlayTimerRef.current) clearTimeout(overlayTimerRef.current);
    
    setStatusOverlay({ show: true, type, message });
    
    // ৩ সেকেন্ডের জন্য শো করবে
    overlayTimerRef.current = setTimeout(() => {
      setStatusOverlay({ show: false, type: "info", message: "" });
    }, 3000);
  };

  const closeStatusOverlay = () => {
    if (overlayTimerRef.current) clearTimeout(overlayTimerRef.current);
    setStatusOverlay({ show: false, type: "info", message: "" });
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
          walletId: data.walletId || data.user?.walletId || "N/A",
          name: data.name || data.user?.name || "User",
          avatar: data.avatar || data.user?.photo || data.user?.photoImage || "",
          photo: data.user?.photo || "",
          photoImage: data.user?.photoImage || "",
          balance: Number(data.balance || 0),
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

  const loadWithdrawStatus = async () => {
    try {
      const res = await fetch(`${API}/auto-withdraw-status`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          authorization: token || ""
        },
        body: JSON.stringify({ email })
      });
      const data = await res.json();
      if (data.success) {
        setWithdrawStatus(data);
      }
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
      console.log("P2P LOAD ERROR:", err);
      setP2pUserList(DUMMY_P2P_USERS);
    }
  };

  const handleIWantP2P = async () => {
    if (Number(wallet.balance) <= 2000) {
      return triggerStatusOverlay("warning", "Your wallet balance must be greater than ₹2,000 to register for P2P!");
    }
    try {
      const res = await fetch(`${API}/register-p2p`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          authorization: token || ""
        },
        body: JSON.stringify({ email, walletId: wallet.walletId })
      });
      const data = await res.json();
      if (data.success) {
        triggerStatusOverlay("success", "Successfully registered for P2P! 🎉");
        loadP2pUsers();
      } else {
        triggerStatusOverlay("error", data.msg || "P2P Registration failed");
      }
    } catch (err) {
      console.log("P2P REGISTRATION ERROR:", err);
      triggerStatusOverlay("error", "Server error during P2P registration");
    }
  };

  const handleUndoP2P = async () => {
    try {
      const res = await fetch(`${API}/undo-p2p`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          authorization: token || ""
        },
        body: JSON.stringify({ email, walletId: wallet.walletId })
      });
      const data = await res.json();
      if (data.success) {
        triggerStatusOverlay("success", "Successfully removed from P2P senders.");
        loadP2pUsers();
      } else {
        triggerStatusOverlay("error", data.msg || "Failed to undo P2P");
      }
    } catch (err) {
      console.log("P2P UNDO ERROR:", err);
      triggerStatusOverlay("error", "Server error during P2P undo");
    }
  };

  const submitP2pReview = async () => {
    if (!reviewText.trim()) {
      return triggerStatusOverlay("warning", "Please write a review comment");
    }
    try {
      const res = await fetch(`${API}/p2p-review`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          authorization: token || ""
        },
        body: JSON.stringify({
          senderWalletId: selectedP2pUser.walletId,
          reviewerEmail: email,
          review: reviewText.trim(),
          rating: reviewRating
        })
      });
      const data = await res.json();
      if (data.success) {
        triggerStatusOverlay("success", "Review submitted successfully! ⭐");
        setReviewText("");
        setReviewRating(5);
        loadP2pUsers();
        const updatedReviews = await fetch(`${API}/p2p-users`).then(r => r.json());
        if(updatedReviews.success && updatedReviews.reviews) {
          setReviewsList(updatedReviews.reviews);
        }
      } else {
        triggerStatusOverlay("error", data.msg || "Failed to submit review");
      }
    } catch (err) {
      console.log("REVIEW ERROR:", err);
      triggerStatusOverlay("error", "Server connection error");
    }
  };

  const money = (n) => `₹ ${Number(n || 0).toLocaleString("en-IN")}.00`;
  const visibleBalance = showBalance ? money(wallet.balance) : "₹ ••••••••";

  const copyWalletId = async () => {
    try {
      await navigator.clipboard.writeText(wallet.walletId);
      toast.success("Wallet ID copied");
    } catch {
      toast.error("Copy failed");
    }
  };

  const openAddCash = () => {
    setAddAmount("");
    setAddOpen(true);
  };

  const handleAddMoney = async (amount) => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("https://save-money-vyv1.onrender.com/api/create-payment-order", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ amount })
      });

      const data = await res.json();

      if (res.ok && data.success) {
        if (data.paymentUrl) {
          window.location.href = data.paymentUrl;
        }
      } else {
        alert(data.msg || "Payment order creation failed");
      }
    } catch (err) {
      console.error("Payment Error:", err);
      alert("Server Connection Error!");
    }
  };

  const payViaUPI = () => {
    if (!addAmount || Number(addAmount) <= 0) {
      return triggerStatusOverlay("warning", "Please enter a valid amount");
    }
    handleAddMoney(addAmount);
  };

  const submitDepositRequest = async () => {
    if (!addAmount || Number(addAmount) <= 0) {
      return triggerStatusOverlay("warning", "Please enter a valid amount");
    }
    if (!depositTxnId || !depositTxnId.trim()) {
      return triggerStatusOverlay("warning", "Please enter the 12-digit UPI Ref No");
    }
    try {
      const res = await fetch(`${API}/deposit-request`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          authorization: token || ""
        },
        body: JSON.stringify({
          email: email,
          amount: Number(addAmount),
          txnId: depositTxnId.trim()
        })
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        return triggerStatusOverlay("error", data.msg || "Deposit request failed");
      }
      triggerStatusOverlay("success", data.msg || "Submitted successfully! Waiting for admin approval.");
      setAddOpen(false);
      setAddAmount("");
      setDepositTxnId("");
      loadWallet();
    } catch (err) {
      console.log("DEPOSIT ERROR:", err);
      triggerStatusOverlay("error", "Server connectivity error");
    }
  };

  const checkReceiver = async () => {
    if (!receiverWalletId.trim()) {
      return triggerStatusOverlay("warning", "Enter receiver wallet ID");
    }
    if (!transferAmount || Number(transferAmount) <= 0) {
      return triggerStatusOverlay("warning", "Enter valid amount");
    }
    const currentBalance = Number(wallet.balance || 0);
    if (currentBalance <= 2000) {
      return triggerStatusOverlay("warning", "Insufficient Balance! Minimum ₹2,000 must remain in your wallet.");
    }
    const maxAllowed = currentBalance - 2000;
    if (Number(transferAmount) > maxAllowed) {
      return triggerStatusOverlay("warning", `Limit Exceeded! You can only transfer up to ₹${maxAllowed.toLocaleString("en-IN")}`);
    }
    try {
      const res = await fetch(`${API}/wallet-user`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          authorization: token || ""
        },
        body: JSON.stringify({ walletId: receiverWalletId.trim() })
      });
      const data = await res.json();
      if (!data.success) {
        return triggerStatusOverlay("error", data.msg || "Receiver not found");
      }
      setReceiverInfo(data.user);
      setConfirmTransferOpen(true);
    } catch (err) {
      console.log("RECEIVER CHECK ERROR:", err);
      triggerStatusOverlay("error", "Receiver check failed");
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

  const sendTransfer = async () => {
    try {
      const res = await fetch(`${API}/wallet-transfer`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          authorization: token || ""
        },
        body: JSON.stringify({
          senderEmail: email,
          receiverWalletId: receiverWalletId.trim(),
          amount: Number(transferAmount)
        })
      });
      const data = await res.json();
      if (data.success) {
        triggerStatusOverlay("success", data.msg || "Transfer Completed Successfully! 🎉");
        setReceiverWalletId("");
        setTransferAmount("");
        setReceiverInfo(null);
        setConfirmTransferOpen(false);
        loadWallet();
      } else {
        triggerStatusOverlay("error", data.msg || "Transfer failed");
      }
    } catch (err) {
      console.log("TRANSFER ERROR:", err);
      triggerStatusOverlay("error", "Transfer failed due to server error");
    }
  };

  const inviteLink = useMemo(() => {
    const ref = wallet.walletId || email;
    return `${window.location.origin}/register?ref=${encodeURIComponent(ref)}`;
  }, [wallet.walletId, email]);

  const openInvite = async () => {
    const text = `Join Save Money and start your saving journey.\n${inviteLink}`;
    if (navigator.share) {
      try {
        await navigator.share({ title: "Save Money", text, url: inviteLink });
      } catch {
        setShareOpen(true);
      }
    } else {
      setShareOpen(true);
    }
  };

  const copyInviteLink = async () => {
    try {
      await navigator.clipboard.writeText(inviteLink);
      toast.success("Referral link copied");
    } catch {
      toast.error("Copy failed");
    }
  };

  const handleShareReceipt = async () => {
    if (!receiptRef.current) return;
    try {
      const canvas = await html2canvas(receiptRef.current, {
        useCORS: true,
        scale: 2,
        backgroundColor: "#0b0f19"
      });
      canvas.toBlob(async (blob) => {
        if (!blob) return;
        const file = new File([blob], `Receipt-${selectedTxn._id || "Txn"}.png`, { type: "image/png" });
        if (navigator.canShare && navigator.canShare({ files: [file] })) {
          try {
            await navigator.share({ files: [file], title: "Transaction Receipt", text: "Save Money Transaction Proof" });
          } catch (e) {
            downloadFallback(canvas);
          }
        } else {
          downloadFallback(canvas);
        }
      }, "image/png");
    } catch (err) {
      console.error("Receipt Generation Error:", err);
      toast.error("Failed to generate receipt image");
    }
  };

  const downloadFallback = (canvas) => {
    const link = document.createElement("a");
    link.download = `Receipt-${selectedTxn?._id || "transaction"}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
    toast.success("Receipt Image Saved!");
  };

  if (loading) {
    return (
      <div style={styles.loadingPage}>
        <div style={styles.loadingCard}>
          <div style={styles.loadingIcon}>👛</div>
          <h2>Loading Wallet...</h2>
        </div>
      </div>
    );
  }

  const filteredHistory = history.filter((item) => {
    if (historyFilter === "all") return true;
    return String(item.type).toLowerCase() === historyFilter;
  });

  const visibleHistory = showAllHistory ? filteredHistory : filteredHistory.slice(0, 5);

  return (
    <div style={styles.page}>
      <style>{mobileResponsiveCSS}</style>
      <div style={styles.app}>

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

        {/* --- ULTRA PREMIUM GLASSMORPHIC INFO OVERLAY --- */}
        {statusOverlay.show && (
          <div style={styles.statusOverlayBg}>
            <div style={{
              ...styles.statusOverlayCard,
              border: statusOverlay.type === "success" 
                ? "1px solid rgba(52, 211, 153, 0.4)" 
                : statusOverlay.type === "warning" 
                ? "1px solid rgba(251, 191, 36, 0.4)" 
                : "1px solid rgba(248, 113, 113, 0.4)",
              boxShadow: statusOverlay.type === "success"
                ? "0 20px 50px rgba(0, 0, 0, 0.8), 0 0 30px rgba(16, 185, 129, 0.3)"
                : statusOverlay.type === "warning"
                ? "0 20px 50px rgba(0, 0, 0, 0.8), 0 0 30px rgba(245, 158, 11, 0.3)"
                : "0 20px 50px rgba(0, 0, 0, 0.8), 0 0 30px rgba(239, 68, 68, 0.3)"
            }}>
              <div style={{
                ...styles.statusOverlayIcon,
                background: statusOverlay.type === "success" 
                  ? "radial-gradient(circle, rgba(16,185,129,0.3) 0%, rgba(5,150,105,0.1) 100%)" 
                  : statusOverlay.type === "warning" 
                  ? "radial-gradient(circle, rgba(245,158,11,0.3) 0%, rgba(217,119,6,0.1) 100%)" 
                  : "radial-gradient(circle, rgba(239,68,68,0.3) 0%, rgba(220,38,38,0.1) 100%)",
                color: statusOverlay.type === "success" ? "#34d399" : statusOverlay.type === "warning" ? "#fbbf24" : "#f87171",
                border: statusOverlay.type === "success" ? "1.5px solid #10b981" : statusOverlay.type === "warning" ? "1.5px solid #f59e0b" : "1.5px solid #ef4444"
              }}>
                {statusOverlay.type === "success" ? "✓" : statusOverlay.type === "warning" ? "⚠️" : "✕"}
              </div>
              
              <div style={{ flex: 1, width: "100%" }}>
                <span style={{
                  fontSize: "11px",
                  fontWeight: "800",
                  letterSpacing: "1.5px",
                  textTransform: "uppercase",
                  color: statusOverlay.type === "success" ? "#34d399" : statusOverlay.type === "warning" ? "#fbbf24" : "#f87171",
                  display: "block",
                  marginBottom: "4px"
                }}>
                  {statusOverlay.type === "success" ? "System Notification" : statusOverlay.type === "warning" ? "Attention Needed" : "Action Failed"}
                </span>
                <h3 style={styles.statusOverlayText}>{statusOverlay.message}</h3>
              </div>

              {/* BOTTOM CLOSE BUTTON */}
              <button 
                style={{
                  ...styles.statusOverlayCloseBtn,
                  background: statusOverlay.type === "success" 
                    ? "linear-gradient(135deg, #10b981, #059669)" 
                    : statusOverlay.type === "warning" 
                    ? "linear-gradient(135deg, #f59e0b, #d97706)" 
                    : "linear-gradient(135deg, #ef4444, #dc2626)"
                }} 
                onClick={closeStatusOverlay}
              >
                OK, CLOSE
              </button>
            </div>
          </div>
        )}

        {/* TOP HEADER */}
        <div style={styles.topHeader}>
          <div className="mobile-header-bar" style={styles.mobileHeaderBar}>
            <button 
              style={styles.menuButton}
              onClick={() => setIsDrawerOpen(true)}
            >
              ☰
            </button>

            <button style={styles.notifyBtn} onClick={() => window.location.href = "/notifications"}>
              🔔
            </button>

            <div style={styles.avatar}>
              {wallet.avatar || wallet.photo || wallet.photoImage ? (
                <img
                  src={wallet.avatar || wallet.photo || `${API}/${wallet.photoImage}`}
                  alt="user"
                  style={styles.avatarImg}
                />
              ) : (
                "👨‍💼"
              )}
            </div>
          </div>

          <header style={styles.header}>
            <div>
              <h1 style={styles.pageTitle}>My Wallet</h1>
              <div style={styles.titleWave}></div>
              <p style={styles.pageSub}>Manage your balance, track transactions and grow more.</p>
            </div>
          </header>

          <section style={styles.walletHero} className="wallet-hero-box">
            <button style={styles.eyeBtn} onClick={() => setShowBalance(!showBalance)}>
              {showBalance ? "👁" : "🙈"}
            </button>

            <div style={styles.walletLeft} className="wallet-left-content">
              <p style={styles.heroLabel}>WALLET ID</p>
              <h2 style={styles.walletId} className="wallet-id-text">
                {wallet.walletId}
                <button onClick={copyWalletId} style={styles.copyBtn}>📋</button>
              </h2>

              <div style={styles.dashedLine}></div>

              <p style={styles.heroLabel}>AVAILABLE BALANCE</p>
              <h1 style={styles.balanceText} className="balance-text-mobile">{visibleBalance}</h1>

              <div style={styles.heroActions} className="hero-actions-mobile">
                <button style={styles.addCashBtn} onClick={openAddCash}>
                  <b>＋</b> Add Cash
                </button>
                <button style={styles.withdrawBtn} onClick={() => setWithdrawOpen(true)}>
                  💳 Withdraw
                </button>
                <button style={styles.p2pMainBtn} onClick={() => setP2pModalOpen(true)}>
                  🤝 P2P
                </button>
              </div>
            </div>

            <WalletIllustration />
          </section>

          <section style={styles.incomePanel} className="income-panel-grid">
            <IncomeCard icon="👥" title="REFERRAL" amount={wallet.referral} color="#10b981" />
            <IncomeCard icon="📈" title="PERFORMANCE" amount={wallet.performance} color="#f59e0b" />
            <IncomeCard icon="👥" title="TEAM" amount={wallet.team} color="#2563eb" />
            <IncomeCard icon="👑" title="ROYALTY" amount={wallet.royalty} color="#9333ea" />
            <IncomeCard icon="👛" title="TODAY EARNING" amount={wallet.todayBalance} color="#14b8a6" />
          </section>

          <section style={styles.middleGrid} className="middle-grid-mobile">
            <div style={styles.transferCard} className="card-box-mobile">
              <div style={styles.transferIcon}>✈️</div>
              <h2 style={styles.transferTitle}>Wallet Transfer</h2>
              <p style={styles.transferSub}>Send money to another wallet instantly</p>

              <label style={styles.label}>Receiver Wallet ID</label>
              <div style={styles.inputWrap}>
                <input
                  style={styles.transferInput}
                  value={receiverWalletId}
                  onChange={(e) => setReceiverWalletId(e.target.value)}
                  placeholder="Enter Receiver Wallet ID"
                />
                <span style={styles.inputIcon}>👤</span>
              </div>

              <label style={styles.label}>Amount</label>
              <div style={styles.inputWrap}>
                <input
                  type="number"
                  style={styles.transferInput}
                  value={transferAmount}
                  onChange={(e) => setTransferAmount(e.target.value)}
                  placeholder="Enter Amount"
                />
                <span style={styles.inputIcon}>💳</span>
              </div>

              <button style={styles.transferBtn} onClick={checkReceiver}>
                ✈️ Transfer Now
              </button>
            </div>

            <div style={styles.inviteCard} className="card-box-mobile">
              <div style={styles.inviteTop}>Grow More</div>
              <h2 style={styles.inviteTitle}>Invite Your Friends</h2>
              <h3 style={styles.inviteTitle2}>& Earn Unlimited Rewards</h3>
              <div style={styles.giftBox} className="gift-box-mobile">🎁</div>
              <button style={styles.inviteBtn} className="invite-btn-mobile" onClick={openInvite}>Invite Now</button>
            </div>
          </section>

          <section style={styles.historyCard} className="card-box-mobile">
            <div style={styles.historyHeader} className="history-header-mobile">
              <div>
                <h2 style={styles.historyTitle}>🛡 Wallet History</h2>
                <p style={styles.historySub}>Your recent transactions (Click to view receipt)</p>
              </div>

              <select
                style={styles.filterSelect}
                value={historyFilter}
                onChange={(e) => {
                  setHistoryFilter(e.target.value);
                  setShowAllHistory(false);
                }}
              >
                <option value="all">All</option>
                <option value="credit">Credit</option>
                <option value="debit">Debit</option>
              </select>
            </div>

            <div style={styles.tableHead} className="table-head-desktop">
              <div>TYPE</div>
              <div>DESCRIPTION</div>
              <div>AMOUNT</div>
              <div>STATUS</div>
              <div>DATE & TIME</div>
            </div>

            {history.length === 0 && (
              <div style={styles.emptyHistory}>No Wallet History Found</div>
            )}

            {visibleHistory.map((item, index) => {
              const rawType = String(item.type || "").toLowerCase();
              const isCredit =
                rawType.includes("credit") ||
                rawType.includes("add") ||
                rawType.includes("deposit") ||
                rawType.includes("bonus");

              const desc =
                item.description ||
                item.note ||
                item.message ||
                item.remark ||
                item.type ||
                "Wallet Transaction";

              return (
                <div
                  key={index}
                  style={styles.clickableHistoryRow}
                  className="history-row-responsive"
                  onClick={() => setSelectedTxn({ ...item, isCredit, desc })}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <div
                      style={{
                        ...styles.typeCircle,
                        background: isCredit ? "#dcfce7" : "#fee2e2",
                        color: isCredit ? "#16a34a" : "#dc2626"
                      }}
                    >
                      {isCredit ? "↓" : "↑"}
                    </div>
                    <div>
                      <div style={styles.rowTitle}>{desc}</div>
                      <div style={styles.rowSub}>
                        {item.createdAt || item.date
                          ? new Date(item.createdAt || item.date).toLocaleDateString("en-IN")
                          : "N/A"}
                      </div>
                    </div>
                  </div>

                  <div style={{ textAlign: "right" }}>
                    <div style={{ color: isCredit ? "#16a34a" : "#dc2626", fontWeight: "700", fontSize: "15px" }}>
                      {isCredit ? "+" : "-"} ₹{Number(item.amount).toLocaleString()}
                    </div>
                    <span style={styles.successBadge}>Success</span>
                  </div>
                </div>
              );
            })}

            {filteredHistory.length > 5 && (
              <button style={styles.viewMore} onClick={() => setShowAllHistory(!showAllHistory)}>
                {showAllHistory ? "Show Less ▲" : "View More ▼"}
              </button>
            )}
          </section>

          <section style={styles.bottomFeatures} className="features-grid-mobile">
            <div style={styles.featureItem}>
              🛡
              <div>
                <b>Secure Transactions</b>
                <p>Your money is 100% safe</p>
              </div>
            </div>

            <div style={styles.featureItem}>
              ⚡
              <div>
                <b>Instant Payments</b>
                <p>Quick transfer in seconds</p>
              </div>
            </div>

            <div style={styles.featureItem}>
              🏆
              <div>
                <b>Trusted Platform</b>
                <p>Used by thousands of users</p>
              </div>
            </div>
          </section>

          {/* P2P Modal */}
          {p2pModalOpen && (
            <div style={styles.modalOverlay}>
              <div style={{ ...styles.modal, maxWidth: "600px", maxHeight: "85vh", overflowY: "auto" }} className="modal-inner-mobile">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "15px" }}>
                  <h2 style={{ margin: 0, fontSize: "20px" }}>🤝 P2P Marketplace</h2>
                  <button style={styles.depositCloseX} onClick={() => setP2pModalOpen(false)}>×</button>
                </div>
                
                <div style={{ background: "#f8fafc", padding: "12px", borderRadius: "16px", marginBottom: "16px", display: "flex", flexDirection: "column", gap: "10px" }}>
                  <div>
                    <h4 style={{ margin: "0 0 4px 0", fontSize: "14px" }}>Want to become a P2P Sender?</h4>
                    <p style={{ margin: 0, fontSize: "11px", color: "#64748b" }}>Requires minimum ₹2,000 wallet balance.</p>
                  </div>
                  <div style={{ display: "flex", gap: "8px" }}>
                    <button style={styles.iWantP2pBtn} onClick={handleIWantP2P}>I want P2P</button>
                    <button style={styles.undoP2pBtn} onClick={handleUndoP2P}>Undo</button>
                  </div>
                </div>

                <h3 style={{ fontSize: "16px", marginBottom: "10px" }}>Available P2P Senders</h3>
                
                {p2pUserList.length === 0 ? (
                  <p style={{ textAlign: "center", color: "#64748b", padding: "20px" }}>No P2P registered users found.</p>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                    {p2pUserList.map((user, idx) => {
                      const uReviews = reviewsList[user.walletId] || [];
                      const avgRating = uReviews.length > 0 ? (uReviews.reduce((acc, r) => acc + (r.rating || 5), 0) / uReviews.length).toFixed(1) : "5.0";
                      
                      return (
                        <div key={idx} style={styles.p2pUserCard}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <div>
                              <h4 style={{ margin: "0 0 2px 0", fontSize: "15px" }}>{user.name}</h4>
                              <div style={{ display: "flex", alignItems: "center", gap: "4px", marginBottom: "4px" }}>
                                <span style={{ fontSize: "12px", fontWeight: "800", color: "#f59e0b" }}>★ {avgRating}</span>
                                <span style={{ fontSize: "11px", color: "#64748b" }}>({uReviews.length} reviews)</span>
                              </div>
                              <p style={{ margin: "0 0 4px 0", fontSize: "12px", color: "#64748b" }}>📱 {user.mobile || "N/A"}</p>
                              <p style={{ margin: 0, fontSize: "13px", fontWeight: "700", color: "#16a34a" }}>Balance: ₹{Number(user.balance).toLocaleString()}</p>
                            </div>
                            
                            <div>
                              <button 
                                style={styles.reviewActionBtn}
                                onClick={() => {
                                  setSelectedP2pUser(user);
                                  setReviewModalOpen(true);
                                }}
                              >
                                Review
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                <button style={styles.popupBottomCloseBtn} onClick={() => setP2pModalOpen(false)}>
                  Close
                </button>
              </div>
            </div>
          )}

          {/* Review Modal */}
          {reviewModalOpen && selectedP2pUser && (
            <div style={styles.modalOverlay}>
              <div style={{ ...styles.modal, maxWidth: "480px", maxHeight: "85vh", overflowY: "auto" }} className="modal-inner-mobile">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                  <h2 style={{ margin: 0, fontSize: "18px" }}>Reviews for {selectedP2pUser.name}</h2>
                  <button style={styles.depositCloseX} onClick={() => setReviewModalOpen(false)}>×</button>
                </div>
                <p style={{ fontSize: "12px", color: "#64748b", margin: "0 0 15px 0" }}>Wallet ID: {selectedP2pUser.walletId}</p>

                <div style={{ background: "#f8fafc", padding: "14px", borderRadius: "16px", marginBottom: "18px", border: "1px solid #e2e8f0" }}>
                  <h4 style={{ margin: "0 0 8px 0", fontSize: "14px", color: "#1e293b" }}>Write a Review</h4>
                  
                  <div style={{ display: "flex", gap: "8px", fontSize: "22px", marginBottom: "10px", cursor: "pointer" }}>
                    {[1, 2, 3, 4, 5].map((star) => (
                      <span 
                        key={star} 
                        onClick={() => setReviewRating(star)}
                        style={{ color: star <= reviewRating ? "#f59e0b" : "#cbd5e1" }}
                      >
                        ★
                      </span>
                    ))}
                  </div>

                  <textarea
                    style={{ ...styles.depositInput, height: "70px", padding: "8px", resize: "none", fontSize: "13px" }}
                    placeholder="Write your review here..."
                    value={reviewText}
                    onChange={(e) => setReviewText(e.target.value)}
                  />

                  <button style={{ ...styles.sendMoneyBtn, height: "42px", marginTop: "10px", fontSize: "14px" }} onClick={submitP2pReview}>
                    Submit Review
                  </button>
                </div>

                <h4 style={{ margin: "0 0 10px 0", fontSize: "15px", color: "#1e293b" }}>User Reviews</h4>
                <div style={{ maxHeight: "200px", overflowY: "auto", display: "flex", flexDirection: "column", gap: "8px", marginBottom: "15px" }}>
                  {(!reviewsList[selectedP2pUser.walletId] || reviewsList[selectedP2pUser.walletId].length === 0) ? (
                    <p style={{ textAlign: "center", color: "#64748b", padding: "15px", fontSize: "13px" }}>No reviews available yet.</p>
                  ) : (
                    reviewsList[selectedP2pUser.walletId].map((rev, rIdx) => (
                      <div key={rIdx} style={{ background: "#ffffff", padding: "10px", borderRadius: "10px", border: "1px solid #e2e8f0" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                          <span style={{ fontSize: "12px", fontWeight: "700", color: "#1e293b" }}>{rev.reviewer || "User"}</span>
                          <span style={{ fontSize: "12px", color: "#f59e0b" }}>{"★".repeat(rev.rating || 5)}</span>
                        </div>
                        <p style={{ margin: 0, fontSize: "13px", color: "#475569" }}>{rev.comment}</p>
                      </div>
                    ))
                  )}
                </div>

                <button style={styles.closeBtn} onClick={() => setReviewModalOpen(false)}>Close</button>
              </div>
            </div>
          )}

          {/* Receipt Modal */}
          {selectedTxn && (
            <div style={styles.modalOverlay}>
              <div style={styles.receiptContainer} className="modal-inner-mobile">
                <div ref={receiptRef} style={styles.receiptCard}>
                  <div style={styles.receiptHeader}>
                    <div style={styles.receiptPulseIconCircle}>
                      <span style={styles.receiptCheckMark}>✓</span>
                    </div>
                    <h3 style={styles.receiptStatusText}>Verified Investment Transfer</h3>
                    <h1 style={{...styles.receiptAmountDisplay, color: selectedTxn.isCredit ? "#34d399" : "#f87171"}}>
                      ₹{Number(selectedTxn.amount).toLocaleString("en-IN")}.00
                    </h1>
                    <p style={styles.receiptTypeTag}>{selectedTxn.type === 'Debit' ? "WALLET TRANSFER SENT" : "WALLET TRANSFER RECEIVED"}</p>
                  </div>
                  
                  <div style={styles.receiptDivider}>
                    <div style={styles.receiptNotchLeft}></div>
                    <div style={styles.receiptNotchRight}></div>
                  </div>

                  <div style={styles.receiptBody}>
                    <div style={styles.receiptRowItem}>
                      <span style={styles.receiptLabelText}>Receiver Name</span>
                      <span style={styles.receiptValueText}>
                        {selectedTxn.type === 'Debit' 
                          ? (selectedTxn.receiverName || selectedTxn.desc?.match(/\(([^)]+)\)/)?.[1] || "N/A") 
                          : (selectedTxn.receiverName || wallet.name)}
                      </span>
                    </div>
                    <div style={styles.receiptRowItem}>
                      <span style={styles.receiptLabelText}>Sender Name</span>
                      <span style={styles.receiptValueText}>
                        {selectedTxn.type === 'Debit' 
                          ? (selectedTxn.senderName || wallet.name) 
                          : (selectedTxn.senderName || selectedTxn.desc?.match(/\(([^)]+)\)/)?.[1] || "N/A")}
                      </span>
                    </div>
                    <div style={styles.receiptRowItem}>
                      <span style={styles.receiptLabelText}>Transaction ID</span>
                      <span style={{...styles.receiptValueText, color: "#fbbf24"}}>{selectedTxn._id || selectedTxn.txnId || "N/A"}</span>
                    </div>
                    <div style={styles.receiptRowItem}>
                      <span style={styles.receiptLabelText}>Date & Time</span>
                      <span style={styles.receiptValueText}>
                        {new Date(selectedTxn.createdAt || selectedTxn.date).toLocaleString("en-IN")}
                      </span>
                    </div>
                    <div style={styles.receiptRowItem}>
                      <span style={styles.receiptLabelText}>Remarks</span>
                      <span style={styles.receiptValueText}>wallet transaction</span>
                    </div>
                    <div style={styles.receiptRowItem}>
                      <span style={styles.receiptLabelText}>Status</span>
                      <span style={styles.receiptStatusBadge}>SECURE & VERIFIED</span>
                    </div>
                  </div>

                  <div style={styles.receiptFooter}>
                    <p style={styles.receiptBrand}>💎 Premium SaveMoney Asset Management</p>
                  </div>
                </div>

                <div style={styles.receiptActionContainer}>
                  <button style={styles.receiptShareBtn} onClick={handleShareReceipt}>
                    📸 Share / Save Receipt Image
                  </button>
                  <button style={styles.receiptCloseBtn} onClick={() => setSelectedTxn(null)}>
                    Close Window
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Add Cash Modal */}
          {addOpen && (
            <div style={styles.depositOverlay}>
              <div style={styles.depositModal} className="modal-inner-mobile">
                <button style={styles.depositCloseX} onClick={() => setAddOpen(false)}>×</button>

                <div style={styles.depositIcon}>⚡</div>
                <h2 style={styles.depositTitle}>Direct UPI Add Cash</h2>
                <p style={styles.depositSub}>Enter amount, click Pay Now to use PhonePe/Paytm, and then submit the Transaction ID.</p>

                <label style={styles.depositLabel}>Amount (₹)</label>
                <input
                  style={styles.depositInput}
                  type="number"
                  placeholder="Enter amount (e.g. 500)"
                  value={addAmount}
                  onChange={(e) => setAddAmount(e.target.value)}
                />

                <button
                  style={{ ...styles.submitDepositBtn, background: "linear-gradient(135deg, #a855f7, #7c3aed)", marginBottom: "15px" }}
                  onClick={payViaUPI}
                >
                  📱 Pay Via PhonePe / Paytm / GPay
                </button>

                <div style={{ borderTop: "1px dashed #334155", margin: "15px 0", paddingTop: "10px" }}>
                  <p style={{ fontSize: "11px", color: "#94a3b8", textAlign: "center" }}>💡 After paying, copy the 12-digit UTR/Txn ID from your UPI app and paste below.</p>
                </div>

                <label style={styles.depositLabel}>Transaction ID / UTR No</label>
                <input
                  style={styles.depositInput}
                  type="text"
                  placeholder="Enter 12-digit Transaction ID"
                  value={depositTxnId}
                  onChange={(e) => setDepositTxnId(e.target.value)}
                />

                <button style={styles.submitDepositBtn} onClick={submitDepositRequest}>
                  Verify & Request Approval
                </button>
              </div>
            </div>
          )}

          {/* Withdraw Popup */}
          {withdrawOpen && (
            <div style={styles.modalOverlay}>
              <div style={styles.modal} className="modal-inner-mobile">
                <h2 style={{ fontSize: "20px" }}>💳 Auto Withdrawal</h2>
                {withdrawStatus && (
                  <div style={{ marginTop: "15px", padding: "12px", borderRadius: "12px", background: "#f8fafc" }}>
                    <p style={{ fontSize: "14px" }}>Status : <b>{withdrawStatus.enabled ? " ✅ Active" : " ❌ Paused"}</b></p>
                    {withdrawStatus.nextWithdrawal && (
                      <p style={{ fontSize: "14px" }}>Next Withdrawal : <b>{new Date(withdrawStatus.nextWithdrawal).toLocaleDateString("en-IN")}</b></p>
                    )}
                    {withdrawStatus.note?.length > 0 && (
                      <>
                        <h4 style={{ marginTop: "15px", marginBottom: "8px", color: "#0f172a", fontSize: "14px" }}>NOTE :</h4>
                        <ul style={{ paddingLeft: "18px", lineHeight: "24px", fontSize: "13px", color: "#475569" }}>
                          {withdrawStatus.note.map((item, index) => (
                            <li key={index}>{item}</li>
                          ))}
                        </ul>
                      </>
                    )}
                  </div>
                )}
                <button style={styles.closeBtn} onClick={() => setWithdrawOpen(false)}>
                  Okay, I Understand
                </button>
              </div>
            </div>
          )}

          {/* Transfer Confirm Modal */}
          {confirmTransferOpen && receiverInfo && (
            <div style={styles.modalOverlay}>
              <div style={styles.modal} className="modal-inner-mobile">
                <div style={styles.confirmTop}>
                  <div style={styles.confirmAvatar}>👤</div>
                  <h2 style={{ fontSize: "20px" }}>Confirm Transfer</h2>
                  <p style={{ fontSize: "12px" }}>Verify receiver details before sending money</p>
                </div>

                <div style={styles.receiverCard}>
                  <div>
                    <span>Receiver Name</span>
                    <h3>{receiverInfo.name}</h3>
                  </div>
                  <div>
                    <span>Wallet ID</span>
                    <h4>{receiverWalletId}</h4>
                  </div>
                  <div>
                    <span>Amount</span>
                    <h2 style={{ color: "#16a34a", fontSize: "22px" }}>₹{Number(transferAmount).toLocaleString()}</h2>
                  </div>
                </div>

                <button style={styles.sendMoneyBtn} onClick={sendTransfer}>Send Money</button>
                <button style={styles.cancelBtn} onClick={() => setConfirmTransferOpen(false)}>Cancel</button>
              </div>
            </div>
          )}

          {/* Share Modal */}
          {shareOpen && (
            <div style={styles.modalOverlay}>
              <div style={styles.modal} className="modal-inner-mobile">
                <h2>Invite Friends</h2>
                <p>Share your referral link</p>
                <div style={styles.shareGrid}>
                  <a href={`https://wa.me/?text=${encodeURIComponent(inviteLink)}`} target="_blank" rel="noreferrer" style={styles.shareBtn}>WhatsApp</a>
                  <a href={`https://t.me/share/url?url=${encodeURIComponent(inviteLink)}`} target="_blank" rel="noreferrer" style={styles.shareBtn}>Telegram</a>
                  <button style={styles.shareBtn} onClick={copyInviteLink}>Copy Link</button>
                </div>
                <button style={styles.closeBtn} onClick={() => setShareOpen(false)}>Close</button>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}

function WalletIllustration() {
  return (
    <div style={styles.walletArt} className="wallet-art-mobile">
      <div style={styles.moneyNote1}></div>
      <div style={styles.moneyNote2}></div>
      <div style={styles.walletBag}>₹</div>
      <div style={styles.coin1}>₹</div>
      <div style={styles.coin2}>₹</div>
    </div>
  );
}

function IncomeCard({ icon, title, amount, color }) {
  return (
    <div style={styles.incomeCard} className="income-card-item">
      <div style={{ ...styles.incomeIcon, background: color }}>{icon}</div>
      <h4>{title}</h4>
      <h2>₹{Number(amount).toLocaleString()}</h2>
      <div style={{ ...styles.incomeWave, color }}>~~~</div>
    </div>
  );
}

const mobileResponsiveCSS = `
  @keyframes overlayPopIn {
    0% { opacity: 0; transform: scale(0.85) translateY(20px); }
    100% { opacity: 1; transform: scale(1) translateY(0); }
  }

  @media (max-width: 768px) {
    .mobile-header-bar {
      display: flex !important;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 12px;
    }
    .wallet-hero-box {
      padding: 20px !important;
      min-height: auto !important;
      border-radius: 20px !important;
    }
    .wallet-left-content {
      width: 100% !important;
    }
    .wallet-art-mobile {
      display: none !important;
    }
    .balance-text-mobile {
      font-size: 32px !important;
    }
    .wallet-id-text {
      font-size: 20px !important;
    }
    .hero-actions-mobile {
      display: grid !important;
      grid-template-columns: repeat(3, 1fr) !important;
      gap: 8px !important;
      margin-top: 16px !important;
    }
    .hero-actions-mobile button {
      min-width: unset !important;
      height: 42px !important;
      font-size: 12px !important;
      border-radius: 12px !important;
      padding: 0 4px !important;
    }
    .income-panel-grid {
      grid-template-columns: repeat(2, 1fr) !important;
      gap: 10px !important;
      padding: 14px !important;
      border-radius: 20px !important;
    }
    .income-card-item {
      border-right: none !important;
      border-bottom: 1px dashed #e2e8f0;
      padding-bottom: 10px !important;
    }
    .income-card-item h4 {
      font-size: 11px !important;
    }
    .income-card-item h2 {
      font-size: 16px !important;
    }
    .middle-grid-mobile {
      grid-template-columns: 1fr !important;
      gap: 14px !important;
    }
    .card-box-mobile {
      padding: 18px !important;
      border-radius: 20px !important;
    }
    .gift-box-mobile {
      font-size: 70px !important;
    }
    .invite-btn-mobile {
      position: static !important;
      width: 100% !important;
      margin-top: 10px;
    }
    .table-head-desktop {
      display: none !important;
    }
    .history-row-responsive {
      grid-template-columns: 1fr 1fr !important;
      padding: 12px 0 !important;
    }
    .history-header-mobile {
      flex-direction: column !important;
      align-items: flex-start !important;
      gap: 10px !important;
    }
    .features-grid-mobile {
      grid-template-columns: 1fr !important;
      gap: 12px !important;
    }
    .modal-inner-mobile {
      width: 92% !important;
      padding: 18px !important;
      border-radius: 20px !important;
    }
  }
`;

const styles = {
  mobileHeaderBar: {
    display: "none"
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
    zIndex: 100003
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
  drawerNavDashboard: {
    background: "rgba(59, 130, 246, 0.2)",
    border: "1px solid rgba(59, 130, 246, 0.4)"
  },
  drawerNavMyInvestment: {
    background: "rgba(16, 185, 129, 0.2)",
    border: "1px solid rgba(16, 185, 129, 0.4)"
  },
  drawerNavSaveMoney: {
    background: "rgba(245, 158, 11, 0.2)",
    border: "1px solid rgba(245, 158, 11, 0.4)"
  },
  drawerNavOneTime: {
    background: "rgba(168, 85, 247, 0.2)",
    border: "1px solid rgba(168, 85, 247, 0.4)"
  },
  drawerNavPlan: {
    background: "rgba(6, 182, 212, 0.2)",
    border: "1px solid rgba(6, 182, 212, 0.4)"
  },
  drawerNavAddFund: {
    background: "rgba(20, 184, 166, 0.2)",
    border: "1px solid rgba(20, 184, 166, 0.4)"
  },
  drawerNavRefer: {
    background: "rgba(236, 72, 153, 0.2)",
    border: "1px solid rgba(236, 72, 153, 0.4)"
  },
  drawerNavWithdraw: {
    background: "rgba(249, 115, 22, 0.2)",
    border: "1px solid rgba(249, 115, 22, 0.4)"
  },
  drawerNavDailyReward: {
    background: "rgba(244, 63, 94, 0.2)",
    border: "1px solid rgba(244, 63, 94, 0.4)"
  },
  drawerNavInvestmentAssistant: {
    background: "rgba(2, 132, 199, 0.2)",
    border: "1px solid rgba(2, 132, 199, 0.4)"
  },
  drawerNavSupport: {
    background: "rgba(99, 102, 241, 0.2)",
    border: "1px solid rgba(99, 102, 241, 0.4)"
  },
  drawerNavProfile: {
    background: "rgba(236, 72, 153, 0.2)",
    border: "1px solid rgba(236, 72, 153, 0.4)"
  },
  drawerNavLogout: {
    background: "rgba(239, 68, 68, 0.2)",
    border: "1px solid rgba(239, 68, 68, 0.4)"
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
    objectFit: "cover",
    borderRadius: "16px"
  },
  menuButton: {
    background: "none",
    border: "none",
    fontSize: "26px",
    cursor: "pointer",
    color: "#071747"
  },
  copyBtn: {
    background: "none",
    border: "none",
    cursor: "pointer",
    fontSize: "18px"
  },
  p2pMainBtn: {
    minWidth: "100px",
    height: "50px",
    border: "none",
    borderRadius: "16px",
    background: "linear-gradient(135deg,#06b6d4,#2563eb)",
    color: "white",
    fontWeight: "900",
    fontSize: "15px",
    boxShadow: "0 8px 20px rgba(6,182,212,.3)",
    cursor: "pointer"
  },
  iWantP2pBtn: {
    padding: "8px 12px",
    border: "none",
    borderRadius: "10px",
    background: "linear-gradient(135deg,#10b981,#059669)",
    color: "#fff",
    fontWeight: "800",
    fontSize: "12px",
    cursor: "pointer"
  },
  undoP2pBtn: {
    padding: "8px 12px",
    border: "none",
    borderRadius: "10px",
    background: "#ef4444",
    color: "#fff",
    fontWeight: "800",
    fontSize: "12px",
    cursor: "pointer"
  },
  p2pUserCard: {
    background: "#fff",
    border: "1px solid #e2e8f0",
    borderRadius: "16px",
    padding: "14px",
    boxShadow: "0 4px 12px rgba(0,0,0,0.03)"
  },
  reviewActionBtn: {
    padding: "8px 16px",
    borderRadius: "12px",
    border: "none",
    background: "#ede9fe",
    color: "#7c3aed",
    fontWeight: "800",
    fontSize: "13px",
    cursor: "pointer"
  },
  popupBottomCloseBtn: {
    width: "100%",
    height: "46px",
    marginTop: "16px",
    borderRadius: "14px",
    border: "none",
    background: "#f1f5f9",
    color: "#334155",
    fontWeight: "800",
    fontSize: "14px",
    cursor: "pointer"
  },
  clickableHistoryRow: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "12px 8px",
    borderBottom: "1px solid #eef2ff",
    cursor: "pointer"
  },
  typeCircle: {
    width: "36px",
    height: "36px",
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: "900",
    fontSize: "16px"
  },
  rowTitle: {
    fontSize: "14px",
    fontWeight: "700",
    color: "#0f172a"
  },
  rowSub: {
    fontSize: "12px",
    color: "#64748b"
  },
  successBadge: {
    background: "#dcfce7",
    color: "#15803d",
    fontSize: "10px",
    fontWeight: "800",
    padding: "2px 8px",
    borderRadius: "10px",
    display: "inline-block"
  },
  receiptContainer: {
    width: "100%",
    maxWidth: "380px",
    display: "flex",
    flexDirection: "column",
    gap: "16px",
    padding: "10px"
  },
  receiptCard: {
    background: "linear-gradient(145deg, #0f172a, #090d16)",
    borderRadius: "24px",
    boxShadow: "0 25px 60px rgba(0,0,0,0.5)",
    overflow: "hidden",
    fontFamily: "Arial, sans-serif",
    border: "1px solid rgba(212, 175, 55, 0.25)",
    color: "#f8fafc"
  },
  receiptHeader: {
    padding: "24px 16px 16px 16px",
    textAlign: "center"
  },
  receiptPulseIconCircle: {
    width: "50px",
    height: "50px",
    borderRadius: "50%",
    background: "rgba(16, 185, 129, 0.15)",
    border: "1px solid rgba(16, 185, 129, 0.4)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    margin: "0 auto 10px auto"
  },
  receiptCheckMark: {
    color: "#34d399",
    fontSize: "24px",
    fontWeight: "900"
  },
  receiptStatusText: {
    fontSize: "12px",
    color: "#94a3b8",
    margin: "0 0 6px 0",
    fontWeight: "600",
    letterSpacing: "1px",
    textTransform: "uppercase"
  },
  receiptAmountDisplay: {
    fontSize: "28px",
    fontWeight: "800",
    margin: "0 0 6px 0"
  },
  receiptTypeTag: {
    display: "inline-block",
    background: "rgba(255,255,255,0.08)",
    color: "#e2e8f0",
    padding: "4px 10px",
    borderRadius: "20px",
    fontSize: "10px",
    fontWeight: "700"
  },
  receiptDivider: {
    position: "relative",
    borderTop: "2px dashed rgba(255, 255, 255, 0.15)",
    margin: "0 12px",
    height: "0"
  },
  receiptNotchLeft: {
    position: "absolute",
    left: "-20px",
    top: "-10px",
    width: "20px",
    height: "20px",
    borderRadius: "50%",
    background: "#090d16"
  },
  receiptNotchRight: {
    position: "absolute",
    right: "-20px",
    top: "-10px",
    width: "20px",
    height: "20px",
    borderRadius: "50%",
    background: "#090d16"
  },
  receiptBody: {
    padding: "16px",
    display: "flex",
    flexDirection: "column",
    gap: "12px"
  },
  receiptRowItem: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center"
  },
  receiptLabelText: {
    fontSize: "12px",
    color: "#94a3b8"
  },
  receiptValueText: {
    fontSize: "13px",
    color: "#ffffff",
    fontWeight: "700"
  },
  receiptStatusBadge: {
    background: "rgba(16, 185, 129, 0.2)",
    color: "#34d399",
    padding: "3px 8px",
    borderRadius: "6px",
    fontSize: "10px",
    fontWeight: "800"
  },
  receiptFooter: {
    background: "rgba(0, 0, 0, 0.3)",
    padding: "12px",
    textAlign: "center"
  },
  receiptBrand: {
    fontSize: "11px",
    color: "#fbbf24",
    margin: 0,
    fontWeight: "700"
  },
  receiptActionContainer: {
    display: "flex",
    flexDirection: "column",
    gap: "8px"
  },
  receiptShareBtn: {
    width: "100%",
    height: "46px",
    border: "none",
    borderRadius: "14px",
    background: "linear-gradient(135deg,#d97706,#fbbf24)",
    color: "#0f172a",
    fontWeight: "900",
    fontSize: "14px",
    cursor: "pointer"
  },
  receiptCloseBtn: {
    width: "100%",
    height: "44px",
    border: "none",
    borderRadius: "14px",
    background: "rgba(255, 255, 255, 0.08)",
    color: "#ffffff",
    fontWeight: "700",
    fontSize: "13px",
    cursor: "pointer"
  },
  // STYLES FOR PREMIUM OVERLAY
  statusOverlayBg: {
    position: "fixed",
    inset: 0,
    background: "rgba(3, 7, 18, 0.75)",
    backdropFilter: "blur(8px)",
    WebkitBackdropFilter: "blur(8px)",
    zIndex: 100000,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "20px"
  },
  statusOverlayCard: {
    background: "linear-gradient(145deg, rgba(15, 23, 42, 0.95), rgba(8, 14, 28, 0.98))",
    padding: "24px",
    borderRadius: "24px",
    textAlign: "center",
    maxWidth: "340px",
    width: "90%",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "14px",
    animation: "overlayPopIn 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards"
  },
  statusOverlayIcon: {
    width: "56px",
    height: "56px",
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "26px",
    fontWeight: "bold"
  },
  statusOverlayText: {
    fontSize: "15px",
    color: "#f8fafc",
    margin: 0,
    fontWeight: "700",
    lineHeight: "1.4"
  },
  statusOverlayCloseBtn: {
    width: "100%",
    height: "42px",
    border: "none",
    borderRadius: "12px",
    color: "#ffffff",
    fontWeight: "900",
    fontSize: "13px",
    letterSpacing: "0.8px",
    cursor: "pointer",
    boxShadow: "0 6px 16px rgba(0,0,0,0.4)",
    marginTop: "4px"
  },
  loadingPage: {
    minHeight: "100vh",
    background: "#f4f7ff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontFamily: "Arial"
  },
  loadingCard: {
    background: "white",
    padding: "30px",
    borderRadius: "20px",
    textAlign: "center",
    boxShadow: "0 10px 25px rgba(15,23,42,.1)"
  },
  loadingIcon: {
    fontSize: "50px"
  },
  page: {
    minHeight: "100vh",
    background: "#f4f7ff",
    padding: "12px",
    fontFamily: "Arial, sans-serif",
    color: "#071747",
    boxSizing: "border-box"
  },
  app: {
    maxWidth: "1040px",
    margin: "0 auto"
  },
  header: {
    marginBottom: "16px"
  },
  pageTitle: {
    margin: 0,
    fontSize: "28px",
    fontWeight: "900",
    color: "#071747"
  },
  titleWave: {
    width: "70px",
    height: "4px",
    borderRadius: "50px",
    background: "linear-gradient(90deg,#ff8a00,#ec4899,#7c3aed)",
    marginTop: "4px"
  },
  pageSub: {
    color: "#64748b",
    fontSize: "13px",
    marginTop: "6px"
  },
  notifyBtn: {
    width: "44px",
    height: "44px",
    borderRadius: "50%",
    border: "none",
    background: "white",
    boxShadow: "0 6px 16px rgba(15,23,42,.08)",
    fontSize: "18px",
    cursor: "pointer"
  },
  avatar: {
    width: "44px",
    height: "44px",
    borderRadius: "50%",
    background: "#ede9fe",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "22px",
    overflow: "hidden"
  },
  avatarImg: {
    width: "100%",
    height: "100%",
    objectFit: "cover"
  },
  walletHero: {
    position: "relative",
    borderRadius: "24px",
    padding: "24px",
    color: "white",
    overflow: "hidden",
    background: "linear-gradient(135deg,#1614a8,#7c2cff,#ff4b78)",
    boxShadow: "0 15px 30px rgba(94,42,210,.25)",
    marginBottom: "16px"
  },
  walletLeft: {
    position: "relative",
    zIndex: 5
  },
  heroLabel: {
    letterSpacing: "1px",
    fontSize: "11px",
    fontWeight: "900",
    opacity: 0.8
  },
  walletId: {
    fontSize: "22px",
    margin: "4px 0 0",
    fontWeight: "900",
    display: "flex",
    alignItems: "center",
    gap: "8px"
  },
  dashedLine: {
    borderTop: "1px dashed rgba(255,255,255,.3)",
    margin: "14px 0"
  },
  balanceText: {
    fontSize: "36px",
    margin: "4px 0",
    fontWeight: "900"
  },
  heroActions: {
    display: "flex",
    gap: "10px",
    marginTop: "16px",
    flexWrap: "wrap"
  },
  addCashBtn: {
    minWidth: "100px",
    height: "46px",
    border: "none",
    borderRadius: "14px",
    background: "white",
    color: "#1e1b9b",
    fontWeight: "900",
    fontSize: "14px",
    cursor: "pointer"
  },
  withdrawBtn: {
    minWidth: "100px",
    height: "46px",
    border: "none",
    borderRadius: "14px",
    background: "linear-gradient(135deg,#ff4b63,#ff8a3d)",
    color: "white",
    fontWeight: "900",
    fontSize: "14px",
    cursor: "pointer"
  },
  eyeBtn: {
    position: "absolute",
    top: "16px",
    right: "16px",
    width: "38px",
    height: "38px",
    borderRadius: "12px",
    border: "1px solid rgba(255,255,255,.3)",
    background: "rgba(255,255,255,.15)",
    color: "white",
    fontSize: "16px",
    zIndex: 8,
    cursor: "pointer"
  },
  walletArt: {
    position: "absolute",
    right: "40px",
    top: "40px",
    width: "220px",
    height: "180px",
    zIndex: 2
  },
  moneyNote1: {
    position: "absolute",
    right: "60px",
    top: "10px",
    width: "80px",
    height: "55px",
    borderRadius: "12px",
    background: "linear-gradient(135deg,#21d06b,#0ea55f)",
    transform: "rotate(-16deg)"
  },
  moneyNote2: {
    position: "absolute",
    right: "20px",
    top: "20px",
    width: "80px",
    height: "55px",
    borderRadius: "12px",
    background: "linear-gradient(135deg,#41e6c3,#0ea5a0)",
    transform: "rotate(18deg)"
  },
  walletBag: {
    position: "absolute",
    right: "30px",
    bottom: "20px",
    width: "120px",
    height: "95px",
    borderRadius: "20px",
    background: "linear-gradient(145deg,#7c2cff,#ba31ff)",
    color: "#facc15",
    fontSize: "38px",
    fontWeight: "900",
    display: "flex",
    alignItems: "center",
    justifyContent: "center"
  },
  coin1: {
    position: "absolute",
    right: "10px",
    bottom: "20px",
    width: "42px",
    height: "42px",
    borderRadius: "50%",
    background: "linear-gradient(135deg,#facc15,#f59e0b)",
    color: "#92400e",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: "900"
  },
  coin2: {
    position: "absolute",
    right: "50px",
    bottom: "-5px",
    width: "45px",
    height: "45px",
    borderRadius: "50%",
    background: "linear-gradient(135deg,#fde047,#f97316)",
    color: "#92400e",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: "900"
  },
  incomePanel: {
    background: "white",
    borderRadius: "20px",
    padding: "16px",
    display: "grid",
    gridTemplateColumns: "repeat(5,1fr)",
    gap: "8px",
    boxShadow: "0 10px 20px rgba(15,23,42,.05)",
    marginBottom: "16px"
  },
  incomeCard: {
    textAlign: "center",
    padding: "8px 4px"
  },
  incomeIcon: {
    width: "44px",
    height: "44px",
    margin: "0 auto 8px",
    borderRadius: "50%",
    color: "white",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "20px"
  },
  incomeWave: {
    fontSize: "20px",
    fontWeight: "900",
    marginTop: "-4px"
  },
  middleGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "16px",
    marginBottom: "16px"
  },
  transferCard: {
    background: "#070a55",
    color: "white",
    borderRadius: "20px",
    padding: "20px"
  },
  transferIcon: {
    width: "46px",
    height: "46px",
    borderRadius: "14px",
    background: "linear-gradient(135deg,#2563eb,#06b6d4)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "22px",
    marginBottom: "10px"
  },
  transferTitle: {
    margin: 0,
    fontSize: "20px"
  },
  transferSub: {
    color: "#aab1d6",
    fontSize: "12px",
    marginBottom: "16px"
  },
  label: {
    display: "block",
    fontWeight: "700",
    fontSize: "12px",
    marginBottom: "6px"
  },
  inputWrap: {
    height: "46px",
    borderRadius: "12px",
    background: "white",
    display: "flex",
    alignItems: "center",
    padding: "0 12px",
    marginBottom: "14px"
  },
  transferInput: {
    flex: 1,
    border: "none",
    outline: "none",
    fontSize: "14px",
    color: "#000"
  },
  inputIcon: {
    fontSize: "18px"
  },
  transferBtn: {
    width: "100%",
    height: "46px",
    border: "none",
    borderRadius: "14px",
    background: "linear-gradient(135deg,#ff7a35,#ec168e)",
    color: "white",
    fontSize: "15px",
    fontWeight: "900",
    cursor: "pointer"
  },
  inviteCard: {
    background: "linear-gradient(135deg,#fff4d9,#ffffff)",
    borderRadius: "20px",
    padding: "20px",
    position: "relative",
    overflow: "hidden"
  },
  inviteTop: {
    color: "#f59e0b",
    fontWeight: "900",
    fontSize: "14px"
  },
  inviteTitle: {
    fontSize: "22px",
    margin: "6px 0 0"
  },
  inviteTitle2: {
    color: "#6d28d9",
    fontSize: "16px",
    margin: "4px 0"
  },
  giftBox: {
    fontSize: "80px",
    textAlign: "right"
  },
  inviteBtn: {
    height: "44px",
    minWidth: "120px",
    border: "none",
    borderRadius: "14px",
    background: "linear-gradient(135deg,#6d28d9,#ec4899)",
    color: "white",
    fontWeight: "900",
    fontSize: "14px",
    cursor: "pointer"
  },
  historyCard: {
    background: "white",
    borderRadius: "20px",
    padding: "16px",
    boxShadow: "0 10px 20px rgba(15,23,42,.05)",
    marginBottom: "16px"
  },
  historyHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "14px"
  },
  historyTitle: {
    margin: 0,
    fontSize: "18px"
  },
  historySub: {
    margin: "2px 0 0",
    fontSize: "11px",
    color: "#64748b"
  },
  filterSelect: {
    padding: "6px 10px",
    borderRadius: "8px",
    border: "1px solid #cbd5e1",
    outline: "none",
    fontSize: "12px"
  },
  tableHead: {
    display: "grid",
    gridTemplateColumns: "70px 1.6fr 1fr 1fr 1.2fr",
    fontSize: "11px",
    fontWeight: "800",
    color: "#94a3b8",
    paddingBottom: "8px",
    borderBottom: "1px solid #f1f5f9"
  },
  emptyHistory: {
    textAlign: "center",
    padding: "20px",
    color: "#94a3b8",
    fontSize: "13px"
  },
  viewMore: {
    width: "100%",
    padding: "10px",
    border: "none",
    background: "#f8fafc",
    color: "#475569",
    fontWeight: "700",
    fontSize: "12px",
    borderRadius: "10px",
    marginTop: "10px",
    cursor: "pointer"
  },
  bottomFeatures: {
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: "12px"
  },
  featureItem: {
    background: "white",
    padding: "12px",
    borderRadius: "16px",
    display: "flex",
    alignItems: "center",
    gap: "10px",
    fontSize: "12px"
  },
  modalOverlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.6)",
    backdropFilter: "blur(4px)",
    zIndex: 100005,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "12px"
  },
  modal: {
    background: "white",
    padding: "20px",
    borderRadius: "20px",
    width: "100%",
    maxWidth: "400px",
    boxSizing: "border-box"
  },
  depositOverlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.6)",
    backdropFilter: "blur(4px)",
    zIndex: 100005,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "12px"
  },
  depositModal: {
    background: "#0f172a",
    color: "white",
    padding: "20px",
    borderRadius: "20px",
    width: "100%",
    maxWidth: "400px",
    position: "relative",
    boxSizing: "border-box"
  },
  depositCloseX: {
    position: "absolute",
    top: "12px",
    right: "12px",
    background: "none",
    border: "none",
    color: "#94a3b8",
    fontSize: "24px",
    cursor: "pointer"
  },
  depositIcon: {
    fontSize: "32px",
    textAlign: "center",
    marginBottom: "6px"
  },
  depositTitle: {
    fontSize: "18px",
    textAlign: "center",
    margin: "0 0 6px 0"
  },
  depositSub: {
    fontSize: "11px",
    color: "#94a3b8",
    textAlign: "center",
    marginBottom: "16px"
  },
  depositLabel: {
    display: "block",
    fontSize: "12px",
    fontWeight: "700",
    marginBottom: "6px"
  },
  depositInput: {
    width: "100%",
    height: "44px",
    borderRadius: "10px",
    border: "1px solid #334155",
    background: "#1e293b",
    color: "white",
    padding: "0 12px",
    marginBottom: "12px",
    outline: "none",
    boxSizing: "border-box"
  },
  submitDepositBtn: {
    width: "100%",
    height: "46px",
    border: "none",
    borderRadius: "12px",
    background: "linear-gradient(135deg,#10b981,#059669)",
    color: "white",
    fontWeight: "800",
    fontSize: "14px",
    cursor: "pointer"
  },
  confirmTop: {
    textAlign: "center",
    marginBottom: "14px"
  },
  confirmAvatar: {
    fontSize: "36px"
  },
  receiverCard: {
    background: "#f8fafc",
    padding: "12px",
    borderRadius: "12px",
    marginBottom: "14px"
  },
  sendMoneyBtn: {
    width: "100%",
    height: "44px",
    border: "none",
    borderRadius: "12px",
    background: "#10b981",
    color: "white",
    fontWeight: "800",
    fontSize: "14px",
    marginBottom: "8px",
    cursor: "pointer"
  },
  cancelBtn: {
    width: "100%",
    height: "40px",
    border: "none",
    borderRadius: "12px",
    background: "#f1f5f9",
    color: "#475569",
    fontWeight: "700",
    fontSize: "13px",
    cursor: "pointer"
  },
  closeBtn: {
    width: "100%",
    height: "40px",
    border: "none",
    borderRadius: "12px",
    background: "#f1f5f9",
    color: "#475569",
    fontWeight: "700",
    fontSize: "13px",
    marginTop: "10px",
    cursor: "pointer"
  },
  shareGrid: {
    display: "flex",
    gap: "10px",
    margin: "16px 0"
  },
  shareBtn: {
    flex: 1,
    padding: "10px",
    borderRadius: "10px",
    border: "none",
    background: "#2563eb",
    color: "white",
    textDecoration: "none",
    textAlign: "center",
    fontSize: "12px",
    fontWeight: "700"
  }
};
