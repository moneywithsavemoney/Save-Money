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
  const [razorpayLoading, setRazorpayLoading] = useState(false);

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
    setAddAmount("100");
    setAddOpen(true);
  };

  // 🟢 RAZORPAY PAYMENT INTEGRATION FROM ONETIME
  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      if (window.Razorpay) {
        resolve(true);
        return;
      }
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handleRazorpayPayment = async (amtToPay) => {
    const finalAmount = Number(amtToPay || addAmount);
    if (!finalAmount || finalAmount < 1) {
      return triggerStatusOverlay("warning", "Please enter a valid amount (Minimum ₹1)");
    }

    setRazorpayLoading(true);
    const resLoaded = await loadRazorpayScript();
    if (!resLoaded) {
      triggerStatusOverlay("error", "Razorpay SDK failed to load. Check internet connection.");
      setRazorpayLoading(false);
      return;
    }

    try {
      const orderRes = await fetch(`${API}/api/onetime/create-razorpay-order`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          authorization: token || ""
        },
        body: JSON.stringify({ email, amount: finalAmount })
      });
      const orderData = await orderRes.json();

      if (!orderRes.ok || !orderData.success) {
        triggerStatusOverlay("error", orderData.message || orderData.msg || "Failed to create payment order");
        setRazorpayLoading(false);
        return;
      }

      const { orderId, keyId, currency } = orderData;

      const options = {
        key: keyId,
        amount: finalAmount * 100,
        currency: currency || "INR",
        name: "Save Money",
        description: "Add Money to Diamond Vault",
        order_id: orderId,
        handler: async function (response) {
          try {
            const verifyRes = await fetch(`${API}/api/onetime/verify-razorpay-payment`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                authorization: token || ""
              },
              body: JSON.stringify({
                email,
                amount: finalAmount,
                razorpayOrderId: response.razorpay_order_id,
                razorpayPaymentId: response.razorpay_payment_id,
                razorpaySignature: response.razorpay_signature
              })
            });

            const verifyData = await verifyRes.json();
            if (verifyRes.ok && verifyData.success) {
              triggerStatusOverlay("success", "🎉 Payment Successful! Money added to wallet.");
              setAddOpen(false);
              loadWallet();
            } else {
              triggerStatusOverlay("error", verifyData.message || "Payment verification failed");
            }
          } catch (err) {
            triggerStatusOverlay("error", "Error verifying payment");
          }
        },
        prefill: {
          name: wallet.name || "SaveMoney User",
          email: email
        },
        theme: {
          color: "#38bdf8"
        }
      };

      const paymentObject = new window.Razorpay(options);
      paymentObject.open();
    } catch (err) {
      console.error("Razorpay error:", err);
      triggerStatusOverlay("error", "Payment initialization failed");
    } finally {
      setRazorpayLoading(false);
    }
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
        backgroundColor: "#060913"
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
          <div style={styles.loadingIcon}>💎</div>
          <h2 style={{ color: "#38bdf8", margin: "12px 0 0 0", fontSize: "16px", fontWeight: "700" }}>Securing Diamond Vault...</h2>
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
      <style>{diamondCutThemeCSS}</style>
      <div style={styles.app}>

        {/* SIDEBAR DRAWER */}
        <div 
          style={{
            ...styles.drawerOverlay,
            opacity: isDrawerOpen ? 1 : 0,
            visibility: isDrawerOpen ? "visible" : "hidden"
          }} 
          onClick={() => setIsDrawerOpen(false)}
        >
          <div 
            style={{        
              ...styles.drawerContainer,
              transform: isDrawerOpen ? "translateX(0)" : "translateX(-100%)"
            }} 
            onClick={(e) => e.stopPropagation()}
          >
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
                  <span style={styles.drawerLogoSubtext}>Diamond Wealth Management</span>
                </div>
              </div>
            </div>

            <div style={styles.drawerNavList}>
              <button style={{ ...styles.drawerNavItem, ...(location.pathname === "/home" ? styles.drawerNavItemActive : {}) }} onClick={() => { go("/home"); setIsDrawerOpen(false); }}>
                <span style={styles.drawerNavIcon}>🏠</span>
                <span style={styles.drawerNavText}>Dashboard</span>
              </button>

              <button style={{ ...styles.drawerNavItem, ...(location.pathname === "/my-investment" ? styles.drawerNavItemActive : {}) }} onClick={() => { go("/my-investment"); setIsDrawerOpen(false); }}>
                <span style={styles.drawerNavIcon}>📈</span>
                <span style={styles.drawerNavText}>My Investment</span>
              </button>

              <button style={{ ...styles.drawerNavItem, ...(location.pathname === "/save-money" ? styles.drawerNavItemActive : {}) }} onClick={() => { go("/save-money"); setIsDrawerOpen(false); }}>
                <span style={styles.drawerNavIcon}>💰</span>
                <span style={styles.drawerNavText}>Save Money</span>
              </button>

              <button style={{ ...styles.drawerNavItem, ...(location.pathname === "/one-time" ? styles.drawerNavItemActive : {}) }} onClick={() => { go("/one-time"); setIsDrawerOpen(false); }}>
                <span style={styles.drawerNavIcon}>⚡</span>
                <span style={styles.drawerNavText}>One Time</span>
              </button>

              <button style={styles.drawerNavItem} onClick={() => { handleDownloadPlan(); setIsDrawerOpen(false); }} disabled={isDownloadingPlan}>
                <span style={styles.drawerNavIcon}>{isDownloadingPlan ? "⏳" : "📋"}</span>
                <span style={styles.drawerNavText}>{isDownloadingPlan ? "Downloading..." : "Plan PDF"}</span>
              </button>

              <button style={{ ...styles.drawerNavItem, ...(location.pathname === "/wallet" ? styles.drawerNavItemActive : {}) }} onClick={() => { go("/wallet"); setIsDrawerOpen(false); }}>
                <span style={styles.drawerNavIcon}>💎</span>
                <span style={styles.drawerNavText}>Add Fund</span>
              </button>

              <button style={{ ...styles.drawerNavItem, ...(location.pathname === "/refer" ? styles.drawerNavItemActive : {}) }} onClick={() => { go("/refer"); setIsDrawerOpen(false); }}>
                <span style={styles.drawerNavIcon}>👥</span>
                <span style={styles.drawerNavText}>Refer & Earn</span>
              </button>

              <button style={{ ...styles.drawerNavItem, ...(location.pathname === "/withdraw" ? styles.drawerNavItemActive : {}) }} onClick={() => { go("/withdraw"); setIsDrawerOpen(false); }}>
                <span style={styles.drawerNavIcon}>➔</span>
                <span style={styles.drawerNavText}>Withdraw</span>
              </button>

              <button style={{ ...styles.drawerNavItem, ...(location.pathname === "/daily-reward" ? styles.drawerNavItemActive : {}) }} onClick={() => { go("/daily-reward"); setIsDrawerOpen(false); }}>
                <span style={styles.drawerNavIcon}>🎁</span>
                <span style={styles.drawerNavText}>Daily Reward</span>
              </button>

              <button style={{ ...styles.drawerNavItem, ...(location.pathname === "/investment-assistant" ? styles.drawerNavItemActive : {}) }} onClick={() => { go("/investment-assistant"); setIsDrawerOpen(false); }}>
                <span style={styles.drawerNavIcon}>📊</span>
                <span style={styles.drawerNavText}>Investment Assistance</span>
              </button>

              <button style={{ ...styles.drawerNavItem, ...(location.pathname === "/support" ? styles.drawerNavItemActive : {}) }} onClick={() => { go("/support"); setIsDrawerOpen(false); }}>
                <span style={styles.drawerNavIcon}>🎧</span>
                <span style={styles.drawerNavText}>Support</span>
              </button>

              <button style={{ ...styles.drawerNavItem, ...(location.pathname === "/kyc" ? styles.drawerNavItemActive : {}) }} onClick={() => { go("/kyc"); setIsDrawerOpen(false); }}>
                <span style={styles.drawerNavIcon}>👤</span>
                <span style={styles.drawerNavText}>Profile</span>
              </button>

              <button style={{ ...styles.drawerNavItem, background: "rgba(239, 68, 68, 0.15)", border: "1px solid rgba(239, 68, 68, 0.3)" }} onClick={() => { setIsDrawerOpen(false); handleLogout(); }}>
                <span style={styles.drawerNavIcon}>🚪</span>
                <span style={styles.drawerNavText}>Logout</span>
              </button>
            </div>

            <div style={styles.treePlantOnlyWrapper}>
              <img 
                src="/tree plant.png" 
                alt="Tree Plant" 
                style={styles.treePlantOnlyImg}
                onError={(e) => { if (e.target.src.includes('.png')) { e.target.src = '/tree plant.jpg'; } }}
              />
            </div>
          </div>
        </div>

        {statusOverlay.show && (
          <div style={styles.statusOverlayBg}>
            <div style={{
              ...styles.statusOverlayCard,
              borderTop: statusOverlay.type === "success" ? "4px solid #10b981" : statusOverlay.type === "warning" ? "4px solid #f59e0b" : "4px solid #ef4444"
            }}>
              <div style={{
                ...styles.statusOverlayIcon,
                background: statusOverlay.type === "success" ? "rgba(16,185,129,0.2)" : statusOverlay.type === "warning" ? "rgba(245,158,11,0.2)" : "rgba(239,68,68,0.2)",
                color: statusOverlay.type === "success" ? "#34d399" : statusOverlay.type === "warning" ? "#fbbf24" : "#f87171"
              }}>
                {statusOverlay.type === "success" ? "✓" : statusOverlay.type === "warning" ? "⚠" : "✕"}
              </div>
              <h3 style={styles.statusOverlayText}>{statusOverlay.message}</h3>
            </div>
          </div>
        )}

        {/* TOP NAVBAR & HEADER */}
        <div style={styles.topHeader}>
          <div style={styles.topNavbar}>
            <button style={styles.menuButton} onClick={() => setIsDrawerOpen(true)}>
              ☰
            </button>
            
            <div style={styles.navRightGroup}>
              <button style={styles.notifyBtn} onClick={() => window.location.href = "/notifications"}>
                🔔
              </button>
              <div style={styles.avatar}>
                {wallet.avatar || wallet.photo || wallet.photoImage ? (
                  <img src={wallet.avatar || wallet.photo || `${API}/${wallet.photoImage}`} alt="user" style={styles.avatarImg} />
                ) : (
                  "👤"
                )}
              </div>
            </div>
          </div>

          <header style={styles.header}>
            <div>
              <h1 style={styles.pageTitle}>Diamond Vault Wallet</h1>
              <div style={styles.titleWave}></div>
              <p style={styles.pageSub}>Institutional-grade secure asset management & live P2P settlement.</p>
            </div>
          </header>

          {/* DIAMOND HERO WALLET CARD */}
          <section style={styles.walletHero} className="diamond-cut-bg">
            <div className="shimmer-effect"></div>
            <button style={styles.eyeBtn} onClick={() => setShowBalance(!showBalance)}>
              {showBalance ? "👁" : "🙈"}
            </button>

            <div style={styles.walletLeft}>
              <div style={styles.heroBadgeRow}>
                <span style={styles.verifiedBadge}>💎 SECURE VAULT ACTIVE</span>
              </div>
              <p style={styles.heroLabel}>WALLET ID</p>
              <h2 style={styles.walletId}>
                {wallet.walletId}
                <button onClick={copyWalletId} style={styles.copyBtn}>📋</button>
              </h2>

              <div style={styles.dashedLine}></div>

              <p style={styles.heroLabel}>AVAILABLE BALANCE</p>
              <h1 style={styles.balanceText}>{visibleBalance}</h1>

              <div style={styles.heroActions}>
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

          {/* 4 BONUS INCOME CARDS */}
          <section style={styles.incomePanel}>
            <IncomeCard icon="👥" title="REFERRAL" amount={wallet.referral} color="#38bdf8" />
            <IncomeCard icon="📈" title="PERFORMANCE" amount={wallet.performance} color="#f59e0b" />
            <IncomeCard icon="👥" title="TEAM" amount={wallet.team} color="#6366f1" />
            <IncomeCard icon="👑" title="ROYALTY" amount={wallet.royalty} color="#a855f7" />
          </section>

          {/* TODAY EARNING LONG BANNER */}
          <section style={styles.todayBannerCard} className="diamond-card-glow">
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <div style={styles.todayBannerIcon}>👛</div>
                <div>
                  <h4 style={{ color: "#94a3b8", fontSize: "11px", fontWeight: "700", margin: 0, letterSpacing: "0.5px" }}>TODAY EARNING</h4>
                  <p style={{ color: "#34d399", fontSize: "10px", margin: "2px 0 0 0" }}>Real-time daily yield</p>
                </div>
              </div>
              <div style={{ textAlign: "right" }}>
                <h2 style={{ color: "#f8fafc", fontSize: "20px", fontWeight: "900", margin: 0 }}>₹{Number(wallet.todayBalance).toLocaleString()}</h2>
              </div>
            </div>
          </section>

          {/* MIDDLE GRID: TRANSFER & REFER */}
          <section style={styles.middleGrid}>
            <div style={styles.transferCard} className="diamond-card-glow">
              <div style={styles.transferIcon}>✈️</div>
              <h2 style={styles.transferTitle}>Wallet Transfer</h2>
              <p style={styles.transferSub}>Instant peer-to-peer secure transaction</p>

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

              <label style={styles.label}>Amount (₹)</label>
              <div style={styles.inputWrap}>
                <input
                  type="number"
                  style={styles.transferInput}
                  value={transferAmount}
                  onChange={(e) => setTransferAmount(e.target.value)}
                  placeholder="Enter Amount"
                />
                <span style={styles.inputIcon}>💎</span>
              </div>

              <button style={styles.transferBtn} onClick={checkReceiver}>
                ✈️ Transfer Now
              </button>
            </div>

            <div style={styles.inviteCard} className="diamond-card-glow">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", width: "100%", gap: "10px" }}>
                <div style={{ flex: 1 }}>
                  <div style={styles.inviteTop}>💎 UNLIMITED REWARDS</div>
                  <h2 style={styles.inviteTitle}>Invite & Earn</h2>
                  <p style={styles.inviteSubText}>Grow your network fast & unlock elite perks.</p>
                </div>
                <div style={styles.giftBox}>🎁</div>
              </div>
              <button style={styles.inviteBtn} onClick={openInvite}>Invite Now</button>
            </div>
          </section>

          {/* HISTORY SECTION */}
          <section style={styles.historyCard}>
            <div style={styles.historyHeader}>
              <div>
                <h2 style={styles.historyTitle}>🛡 Transaction Ledger</h2>
                <p style={styles.historySub}>Click any record to inspect verified digital receipt</p>
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

            <div style={styles.tableHead}>
              <div>TYPE</div>
              <div>DESCRIPTION</div>
              <div>AMOUNT</div>
              <div>STATUS</div>
              <div>DATE & TIME</div>
            </div>

            {history.length === 0 && (
              <div style={styles.emptyHistory}>No Wallet Transactions Recorded Yet</div>
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
                  onClick={() => setSelectedTxn({ ...item, isCredit, desc })}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <div
                      style={{
                        ...styles.typeCircle,
                        background: isCredit ? "rgba(16,185,129,0.15)" : "rgba(239,68,68,0.15)",
                        color: isCredit ? "#34d399" : "#f87171"
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
                    <div style={{ color: isCredit ? "#34d399" : "#f87171", fontWeight: "800", fontSize: "15px" }}>
                      {isCredit ? "+" : "-"} ₹{Number(item.amount).toLocaleString()}
                    </div>
                    <span style={styles.successBadge}>SECURE</span>
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

          {/* BOTTOM FEATURES */}
          <section style={styles.bottomFeatures}>
            <div style={styles.featureItem} className="diamond-feature-card">
              <div style={styles.featureIconBadge}>🛡️</div>
              <div>
                <b style={styles.featureTitle}>Institutional Security</b>
                <p style={styles.featureSub}>Military-grade encryption</p>
              </div>
            </div>

            <div style={styles.featureItem} className="diamond-feature-card">
              <div style={styles.featureIconBadge}>⚡</div>
              <div>
                <b style={styles.featureTitle}>Instant Settlement</b>
                <p style={styles.featureSub}>Lightning fast execution</p>
              </div>
            </div>

            <div style={styles.featureItem} className="diamond-feature-card">
              <div style={styles.featureIconBadge}>🏆</div>
              <div>
                <b style={styles.featureTitle}>Elite Portfolio</b>
                <p style={styles.featureSub}>Trusted globally</p>
              </div>
            </div>
          </section>

          {/* P2P Modal */}
          {p2pModalOpen && (
            <div style={styles.modalOverlay}>
              <div style={{ ...styles.modal, maxWidth: "600px", maxHeight: "85vh", overflowY: "auto" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "15px" }}>
                  <h2 style={{ margin: 0, fontSize: "20px", color: "#38bdf8" }}>🤝 P2P Diamond Marketplace</h2>
                  <button style={styles.depositCloseX} onClick={() => setP2pModalOpen(false)}>×</button>
                </div>
                
                <div style={{ background: "rgba(255,255,255,0.03)", padding: "14px", borderRadius: "16px", marginBottom: "16px", display: "flex", flexDirection: "column", gap: "10px", border: "1px solid rgba(255,255,255,0.08)" }}>
                  <div>
                    <h4 style={{ margin: "0 0 4px 0", fontSize: "14px", color: "#f8fafc" }}>Want to become a P2P Sender?</h4>
                    <p style={{ margin: 0, fontSize: "11px", color: "#94a3b8" }}>Requires minimum ₹2,000 wallet balance.</p>
                  </div>
                  <div style={{ display: "flex", gap: "8px" }}>
                    <button style={styles.iWantP2pBtn} onClick={handleIWantP2P}>I want P2P</button>
                    <button style={styles.undoP2pBtn} onClick={handleUndoP2P}>Undo</button>
                  </div>
                </div>

                <h3 style={{ fontSize: "15px", marginBottom: "10px", color: "#fbbf24" }}>Available P2P Senders</h3>
                
                {p2pUserList.length === 0 ? (
                  <p style={{ textAlign: "center", color: "#94a3b8", padding: "20px" }}>No P2P registered users found.</p>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                    {p2pUserList.map((user, idx) => {
                      const uReviews = reviewsList[user.walletId] || [];
                      const avgRating = uReviews.length > 0 ? (uReviews.reduce((acc, r) => acc + (r.rating || 5), 0) / uReviews.length).toFixed(1) : "5.0";
                      
                      return (
                        <div key={idx} style={{ background: "#060913", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "14px", padding: "12px", color: "#fff" }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <div>
                              <h4 style={{ margin: "0 0 2px 0", fontSize: "14px", color: "#f8fafc" }}>{user.name}</h4>
                              <div style={{ display: "flex", alignItems: "center", gap: "4px", marginBottom: "4px" }}>
                                <span style={{ fontSize: "12px", fontWeight: "800", color: "#f59e0b" }}>★ {avgRating}</span>
                                <span style={{ fontSize: "11px", color: "#94a3b8" }}>({uReviews.length} reviews)</span>
                              </div>
                              <p style={{ margin: "0 0 2px 0", fontSize: "12px", color: "#94a3b8" }}>📱 {user.mobile || "N/A"}</p>
                              <p style={{ margin: 0, fontSize: "13px", fontWeight: "700", color: "#34d399" }}>Balance: ₹{Number(user.balance).toLocaleString()}</p>
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
                  Close Window
                </button>
              </div>
            </div>
          )}

          {/* Review Modal */}
          {reviewModalOpen && selectedP2pUser && (
            <div style={styles.modalOverlay}>
              <div style={{ ...styles.modal, maxWidth: "480px", maxHeight: "85vh", overflowY: "auto" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                  <h2 style={{ margin: 0, fontSize: "18px", color: "#38bdf8" }}>Reviews for {selectedP2pUser.name}</h2>
                  <button style={styles.depositCloseX} onClick={() => setReviewModalOpen(false)}>×</button>
                </div>
                <p style={{ fontSize: "12px", color: "#94a3b8", margin: "0 0 15px 0" }}>Wallet ID: {selectedP2pUser.walletId}</p>

                <div style={{ background: "rgba(255,255,255,0.03)", padding: "14px", borderRadius: "16px", marginBottom: "18px", border: "1px solid rgba(255,255,255,0.08)" }}>
                  <h4 style={{ margin: "0 0 8px 0", fontSize: "14px", color: "#f8fafc" }}>Write a Review</h4>
                  
                  <div style={{ display: "flex", gap: "8px", fontSize: "22px", marginBottom: "10px", cursor: "pointer" }}>
                    {[1, 2, 3, 4, 5].map((star) => (
                      <span 
                        key={star} 
                        onClick={() => setReviewRating(star)}
                        style={{ color: star <= reviewRating ? "#f59e0b" : "#475569" }}
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

                <h4 style={{ margin: "0 0 10px 0", fontSize: "15px", color: "#fbbf24" }}>User Reviews</h4>
                <div style={{ maxHeight: "200px", overflowY: "auto", display: "flex", flexDirection: "column", gap: "8px", marginBottom: "15px" }}>
                  {(!reviewsList[selectedP2pUser.walletId] || reviewsList[selectedP2pUser.walletId].length === 0) ? (
                    <p style={{ textAlign: "center", color: "#94a3b8", padding: "15px", fontSize: "13px" }}>No reviews available yet.</p>
                  ) : (
                    reviewsList[selectedP2pUser.walletId].map((rev, rIdx) => (
                      <div key={rIdx} style={{ background: "#060913", padding: "10px", borderRadius: "10px", border: "1px solid rgba(255,255,255,0.08)" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                          <span style={{ fontSize: "12px", fontWeight: "700", color: "#38bdf8" }}>{rev.reviewer || "User"}</span>
                          <span style={{ fontSize: "12px", color: "#f59e0b" }}>{"★".repeat(rev.rating || 5)}</span>
                        </div>
                        <p style={{ margin: 0, fontSize: "13px", color: "#94a3b8" }}>{rev.comment}</p>
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
              <div style={styles.receiptContainer}>
                <div ref={receiptRef} style={styles.receiptCard}>
                  <div style={styles.receiptHeader}>
                    <div style={styles.receiptPulseIconCircle}>
                      <span style={styles.receiptCheckMark}>✓</span>
                    </div>
                    <h3 style={styles.receiptStatusText}>Diamond Vault Verified Receipt</h3>
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
                      <span style={styles.receiptValueText}>diamond vault transfer</span>
                    </div>
                    <div style={styles.receiptRowItem}>
                      <span style={styles.receiptLabelText}>Status</span>
                      <span style={styles.receiptStatusBadge}>SECURE & VERIFIED</span>
                    </div>
                  </div>

                  <div style={styles.receiptFooter}>
                    <p style={styles.receiptBrand}>💎 Save Money Private Limited - Asset Suite</p>
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

          {/* 🟢 BEAUTIFUL UPGRADED ADD CASH / ADD FUND MODAL WITH RAZORPAY BUY NOW */}
          {addOpen && (
            <div style={styles.depositOverlay}>
              <div style={styles.depositModal}>
                <button style={styles.depositCloseX} onClick={() => setAddOpen(false)}>×</button>

                <div style={styles.depositIcon}>💎</div>
                <h2 style={styles.depositTitle}>Add Cash to Diamond Vault</h2>
                <p style={styles.depositSub}>Enter amount to add cash instantly or submit manual UTR.</p>

                <label style={styles.depositLabel}>Amount (₹)</label>
                <input
                  style={styles.depositInput}
                  type="number"
                  min="1"
                  placeholder="Enter amount (Minimum ₹1)"
                  value={addAmount}
                  onChange={(e) => setAddAmount(e.target.value)}
                />

                {/* 🛒 BUY NOW / INSTANT PAY BUTTON */}
                <button
                  style={{
                    ...styles.submitDepositBtn,
                    background: "linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)",
                    marginBottom: "12px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "8px",
                    boxShadow: "0 4px 15px rgba(37, 99, 235, 0.4)"
                  }}
                  onClick={() => handleRazorpayPayment(addAmount)}
                  disabled={razorpayLoading}
                >
                  <span>⚡</span> {razorpayLoading ? "Processing Payment..." : `Buy Now ₹${addAmount || 0}`}
                </button>

                <div style={{ borderTop: "1px dashed rgba(255,255,255,0.12)", margin: "14px 0", paddingTop: "10px" }}>
                  <p style={{ fontSize: "11px", color: "#94a3b8", textAlign: "center", margin: "0 0 10px 0" }}>
                    💡 Or paste 12-digit UTR/Txn ID for Manual Deposit Review.
                  </p>
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
              <div style={styles.modal}>
                <h2 style={{ fontSize: "18px", color: "#38bdf8" }}>💳 Diamond Auto Withdrawal</h2>
                {withdrawStatus && (
                  <div style={{ marginTop: "15px", padding: "14px", borderRadius: "12px", background: "#060913", border: "1px solid rgba(255,255,255,0.08)" }}>
                    <p style={{ fontSize: "13px" }}>Status : <b style={{ color: withdrawStatus.enabled ? "#34d399" : "#f87171" }}>{withdrawStatus.enabled ? " ✅ Active" : " ❌ Paused"}</b></p>
                    {withdrawStatus.nextWithdrawal && (
                      <p style={{ fontSize: "13px" }}>Next Withdrawal : <b style={{ color: "#fbbf24" }}>{new Date(withdrawStatus.nextWithdrawal).toLocaleDateString("en-IN")}</b></p>
                    )}
                    {withdrawStatus.note?.length > 0 && (
                      <>
                        <h4 style={{ marginTop: "12px", marginBottom: "6px", color: "#38bdf8", fontSize: "13px" }}>NOTE :</h4>
                        <ul style={{ paddingLeft: "18px", lineHeight: "22px", fontSize: "12px", color: "#94a3b8" }}>
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
              <div style={styles.modal}>
                <div style={styles.confirmTop}>
                  <div style={styles.confirmAvatar}>💎</div>
                  <h2 style={{ fontSize: "18px", color: "#38bdf8" }}>Confirm Transfer</h2>
                  <p style={{ fontSize: "12px", color: "#94a3b8" }}>Verify receiver details before executing settlement</p>
                </div>

                <div style={styles.receiverCard}>
                  <div>
                    <span style={{ color: "#94a3b8", fontSize: "11px" }}>Receiver Name</span>
                    <h3 style={{ margin: "2px 0 6px 0", color: "#f8fafc", fontSize: "15px" }}>{receiverInfo.name}</h3>
                  </div>
                  <div>
                    <span style={{ color: "#94a3b8", fontSize: "11px" }}>Wallet ID</span>
                    <h4 style={{ margin: "2px 0 6px 0", color: "#38bdf8", fontSize: "14px" }}>{receiverWalletId}</h4>
                  </div>
                  <div>
                    <span style={{ color: "#94a3b8", fontSize: "11px" }}>Amount</span>
                    <h2 style={{ color: "#34d399", fontSize: "20px", margin: "2px 0 0 0" }}>₹{Number(transferAmount).toLocaleString()}</h2>
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
              <div style={styles.modal}>
                <h2 style={{ color: "#38bdf8", fontSize: "18px" }}>Invite Friends</h2>
                <p style={{ color: "#94a3b8", fontSize: "12px" }}>Share your referral diamond link</p>
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
    <div style={styles.walletArt}>
      <div style={styles.diamondShape1}></div>
      <div style={styles.diamondShape2}></div>
      <div style={styles.walletBag}>💎</div>
      <div style={styles.coin1}>₹</div>
      <div style={styles.coin2}>₹</div>
    </div>
  );
}

function IncomeCard({ icon, title, amount, color }) {
  return (
    <div style={styles.incomeCard} className="diamond-income-box">
      <div style={{ ...styles.incomeIcon, background: color, boxShadow: `0 0 12px ${color}55` }}>{icon}</div>
      <h4 style={{ color: "#94a3b8", fontSize: "10px", fontWeight: "700", margin: "4px 0" }}>{title}</h4>
      <h2 style={{ color: "#f8fafc", fontSize: "16px", fontWeight: "900", margin: 0 }}>₹{Number(amount).toLocaleString()}</h2>
      <div style={{ ...styles.incomeWave, color }}>✦ ✧ ✦</div>
    </div>
  );
}

const diamondCutThemeCSS = `
  @keyframes diamondShimmer {
    0% { transform: translateX(-100%); }
    100% { transform: translateX(100%); }
  }
  @keyframes floatAnim {
    0%, 100% { transform: translateY(0px); }
    50% { transform: translateY(-6px); }
  }
  .diamond-cut-bg {
    background: linear-gradient(135deg, #090e1a 0%, #111827 50%, #1e1b4b 100%) !important;
    border: 1px solid rgba(56, 189, 248, 0.25);
    position: relative;
    overflow: hidden;
  }
  .shimmer-effect {
    position: absolute;
    top: 0; left: 0; width: 100%; height: 100%;
    background: linear-gradient(90deg, transparent, rgba(255,255,255,0.05), transparent);
    animation: diamondShimmer 3s infinite;
    pointer-events: none;
  }
  .diamond-card-glow {
    background: #090e1a !important;
    border: 1px solid rgba(255, 255, 255, 0.08) !important;
    box-shadow: 0 10px 25px rgba(0,0,0,0.5);
  }
  .diamond-income-box {
    background: #090e1a !important;
    border: 1px solid rgba(255,255,255,0.08);
    border-radius: 14px;
    padding: 12px 6px;
    transition: all 0.3s ease;
  }
  .diamond-feature-card {
    background: #090e1a !important;
    border: 1px solid rgba(255,255,255,0.08);
    border-radius: 14px;
    padding: 12px 14px;
    display: flex;
    align-items: center;
    gap: 12px;
  }

  @media (max-width: 768px) {
    .wallet-hero-box {
      padding: 18px !important;
    }
    .wallet-art {
      display: none !important;
    }
    .balanceText {
      font-size: 28px !important;
    }
    .middleGrid {
      grid-template-columns: 1fr !important;
    }
    .bottomFeatures {
      grid-template-columns: 1fr !important;
      gap: 10px !important;
    }
    .incomePanel {
      grid-template-columns: repeat(2, 1fr) !important;
      gap: 8px !important;
    }
    .tableHead {
      display: none !important;
    }
  }
`;

const styles = {
  topNavbar: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: "16px",
    width: "100%"
  },
  navRightGroup: {
    display: "flex",
    alignItems: "center",
    gap: "12px"
  },
  menuButton: {
    background: "rgba(255,255,255,0.05)",
    border: "1px solid rgba(255,255,255,0.1)",
    fontSize: "22px",
    cursor: "pointer",
    color: "#38bdf8",
    width: "42px",
    height: "42px",
    borderRadius: "12px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center"
  },
  notifyBtn: {
    width: "42px",
    height: "42px",
    borderRadius: "12px",
    border: "1px solid rgba(255,255,255,0.1)",
    background: "rgba(255,255,255,0.05)",
    fontSize: "18px",
    cursor: "pointer",
    color: "#fff"
  },
  avatar: {
    width: "42px",
    height: "42px",
    borderRadius: "12px",
    background: "rgba(56,189,248,0.15)",
    border: "1px solid #38bdf8",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "20px",
    overflow: "hidden"
  },
  avatarImg: {
    width: "100%",
    height: "100%",
    objectFit: "cover"
  },
  drawerOverlay: {
    position: "fixed",
    top: 0, left: 0, right: 0, bottom: 0,
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
    width: "250px",
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
  drawerNavList: {
    display: "flex",
    flexDirection: "column",
    gap: "6px",
    overflowY: "auto",
    maxHeight: "calc(100vh - 200px)"
  },
  drawerNavItem: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    padding: "8px 12px",
    background: "rgba(255, 255, 255, 0.03)",
    border: "1px solid rgba(255, 255, 255, 0.05)",
    borderRadius: "10px",
    color: "#f8fafc",
    fontSize: "13px",
    fontWeight: "700",
    cursor: "pointer"
  },
  drawerNavItemActive: {
    background: "rgba(56, 189, 248, 0.15)",
    border: "1px solid #38bdf8",
    color: "#38bdf8"
  },
  drawerNavIcon: {
    fontSize: "16px"
  },
  drawerNavText: {
    fontSize: "12px"
  },
  treePlantOnlyWrapper: {
    marginTop: "auto",
    width: "100%",
    height: "100px",
    borderRadius: "12px",
    overflow: "hidden"
  },
  treePlantOnlyImg: {
    width: "100%",
    height: "100%",
    objectFit: "cover"
  },
  copyBtn: {
    background: "none",
    border: "none",
    cursor: "pointer",
    fontSize: "16px"
  },
  p2pMainBtn: {
    minWidth: "90px",
    height: "42px",
    border: "none",
    borderRadius: "12px",
    background: "linear-gradient(135deg,#38bdf8,#2563eb)",
    color: "white",
    fontWeight: "800",
    fontSize: "13px",
    cursor: "pointer"
  },
  iWantP2pBtn: {
    padding: "6px 12px",
    border: "none",
    borderRadius: "8px",
    background: "#10b981",
    color: "#fff",
    fontWeight: "800",
    fontSize: "12px",
    cursor: "pointer"
  },
  undoP2pBtn: {
    padding: "6px 12px",
    border: "none",
    borderRadius: "8px",
    background: "#ef4444",
    color: "#fff",
    fontWeight: "800",
    fontSize: "12px",
    cursor: "pointer"
  },
  reviewActionBtn: {
    padding: "6px 12px",
    borderRadius: "8px",
    border: "none",
    background: "rgba(56,189,248,0.15)",
    color: "#38bdf8",
    fontWeight: "800",
    fontSize: "12px",
    cursor: "pointer"
  },
  popupBottomCloseBtn: {
    width: "100%",
    height: "42px",
    marginTop: "14px",
    borderRadius: "12px",
    border: "none",
    background: "#111827",
    color: "#f8fafc",
    fontWeight: "700",
    fontSize: "13px",
    cursor: "pointer"
  },
  clickableHistoryRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "12px 8px",
    borderBottom: "1px solid rgba(255,255,255,0.05)",
    cursor: "pointer"
  },
  typeCircle: {
    width: "34px",
    height: "34px",
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: "900",
    fontSize: "14px"
  },
  rowTitle: {
    fontSize: "13px",
    fontWeight: "700",
    color: "#f8fafc"
  },
  rowSub: {
    fontSize: "11px",
    color: "#94a3b8"
  },
  successBadge: {
    background: "rgba(16,185,129,0.15)",
    color: "#34d399",
    fontSize: "9px",
    fontWeight: "800",
    padding: "2px 6px",
    borderRadius: "8px"
  },
  receiptContainer: {
    width: "100%",
    maxWidth: "360px",
    display: "flex",
    flexDirection: "column",
    gap: "14px"
  },
  receiptCard: {
    background: "#060913",
    borderRadius: "20px",
    border: "1px solid rgba(56, 189, 248, 0.3)",
    color: "#f8fafc"
  },
  receiptHeader: {
    padding: "20px 16px 14px 16px",
    textAlign: "center"
  },
  receiptPulseIconCircle: {
    width: "44px",
    height: "44px",
    borderRadius: "50%",
    background: "rgba(16, 185, 129, 0.15)",
    border: "1px solid rgba(16, 185, 129, 0.4)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    margin: "0 auto 8px auto"
  },
  receiptCheckMark: {
    color: "#34d399",
    fontSize: "20px",
    fontWeight: "900"
  },
  receiptStatusText: {
    fontSize: "11px",
    color: "#94a3b8",
    margin: "0 0 4px 0",
    fontWeight: "600",
    letterSpacing: "1px"
  },
  receiptAmountDisplay: {
    fontSize: "26px",
    fontWeight: "800",
    margin: "0 0 4px 0"
  },
  receiptTypeTag: {
    background: "rgba(255,255,255,0.05)",
    color: "#e2e8f0",
    padding: "3px 8px",
    borderRadius: "16px",
    fontSize: "10px",
    fontWeight: "700"
  },
  receiptDivider: {
    position: "relative",
    borderTop: "2px dashed rgba(255, 255, 255, 0.1)",
    margin: "0 12px"
  },
  receiptNotchLeft: {
    position: "absolute",
    left: "-18px",
    top: "-9px",
    width: "18px",
    height: "18px",
    borderRadius: "50%",
    background: "#030712"
  },
  receiptNotchRight: {
    position: "absolute",
    right: "-18px",
    top: "-9px",
    width: "18px",
    height: "18px",
    borderRadius: "50%",
    background: "#030712"
  },
  receiptBody: {
    padding: "14px",
    display: "flex",
    flexDirection: "column",
    gap: "10px"
  },
  receiptRowItem: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center"
  },
  receiptLabelText: {
    fontSize: "11px",
    color: "#94a3b8"
  },
  receiptValueText: {
    fontSize: "12px",
    color: "#ffffff",
    fontWeight: "700"
  },
  receiptStatusBadge: {
    background: "rgba(16, 185, 129, 0.2)",
    color: "#34d399",
    padding: "2px 6px",
    borderRadius: "4px",
    fontSize: "9px",
    fontWeight: "800"
  },
  receiptFooter: {
    background: "rgba(0, 0, 0, 0.3)",
    padding: "10px",
    textAlign: "center"
  },
  receiptBrand: {
    fontSize: "10px",
    color: "#38bdf8",
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
    height: "42px",
    border: "none",
    borderRadius: "12px",
    background: "linear-gradient(135deg,#38bdf8,#2563eb)",
    color: "#ffffff",
    fontWeight: "800",
    fontSize: "13px",
    cursor: "pointer"
  },
  receiptCloseBtn: {
    width: "100%",
    height: "40px",
    border: "none",
    borderRadius: "12px",
    background: "rgba(255, 255, 255, 0.05)",
    color: "#ffffff",
    fontWeight: "700",
    fontSize: "12px",
    cursor: "pointer"
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
    background: "#060913",
    border: "1px solid rgba(255,255,255,0.08)",
    padding: "18px 20px",
    borderRadius: "18px",
    textAlign: "center",
    maxWidth: "300px",
    width: "85%",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "10px"
  },
  statusOverlayIcon: {
    width: "44px",
    height: "44px",
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "20px",
    fontWeight: "bold"
  },
  statusOverlayText: {
    fontSize: "14px",
    color: "#f8fafc",
    margin: 0,
    fontWeight: "800",
    lineHeight: "1.4"
  },
  loadingPage: {
    minHeight: "100vh",
    background: "#030712",
    display: "flex",
    alignItems: "center",
    justifyContent: "center"
  },
  loadingCard: {
    background: "#060913",
    border: "1px solid rgba(56,189,248,0.2)",
    padding: "24px 32px",
    borderRadius: "18px",
    textAlign: "center"
  },
  loadingIcon: {
    fontSize: "42px"
  },
  page: {
    minHeight: "100vh",
    background: "#030712",
    padding: "12px",
    fontFamily: "Arial, sans-serif",
    color: "#f8fafc",
    boxSizing: "border-box"
  },
  app: {
    maxWidth: "1040px",
    margin: "0 auto"
  },
  header: {
    marginBottom: "14px"
  },
  pageTitle: {
    margin: 0,
    fontSize: "24px",
    fontWeight: "900",
    color: "#f8fafc"
  },
  titleWave: {
    width: "60px",
    height: "3px",
    borderRadius: "50px",
    background: "linear-gradient(90deg,#38bdf8,#10b981,#f59e0b)",
    marginTop: "4px"
  },
  pageSub: {
    color: "#94a3b8",
    fontSize: "12px",
    marginTop: "4px"
  },
  walletHero: {
    borderRadius: "20px",
    padding: "20px",
    color: "white",
    marginBottom: "14px"
  },
  walletLeft: {
    position: "relative",
    zIndex: 5
  },
  heroBadgeRow: {
    marginBottom: "6px"
  },
  verifiedBadge: {
    background: "rgba(16,185,129,0.12)",
    color: "#34d399",
    border: "1px solid rgba(16,185,129,0.25)",
    fontSize: "9px",
    fontWeight: "800",
    padding: "2px 8px",
    borderRadius: "16px",
    letterSpacing: "0.5px"
  },
  heroLabel: {
    fontSize: "10px",
    fontWeight: "800",
    color: "#94a3b8",
    margin: "4px 0"
  },
  walletId: {
    fontSize: "20px",
    margin: "2px 0 0",
    fontWeight: "900",
    display: "flex",
    alignItems: "center",
    gap: "6px",
    color: "#f8fafc"
  },
  dashedLine: {
    borderTop: "1px dashed rgba(255,255,255,.15)",
    margin: "12px 0"
  },
  balanceText: {
    fontSize: "30px",
    margin: "2px 0",
    fontWeight: "900",
    color: "#ffffff"
  },
  heroActions: {
    display: "flex",
    gap: "8px",
    marginTop: "14px"
  },
  addCashBtn: {
    flex: 1,
    height: "40px",
    border: "none",
    borderRadius: "10px",
    background: "#ffffff",
    color: "#030712",
    fontWeight: "800",
    fontSize: "13px",
    cursor: "pointer"
  },
  withdrawBtn: {
    flex: 1,
    height: "40px",
    border: "none",
    borderRadius: "10px",
    background: "linear-gradient(135deg,#f59e0b,#d97706)",
    color: "white",
    fontWeight: "800",
    fontSize: "13px",
    cursor: "pointer"
  },
  eyeBtn: {
    position: "absolute",
    top: "14px",
    right: "14px",
    width: "34px",
    height: "34px",
    borderRadius: "10px",
    border: "1px solid rgba(255,255,255,.15)",
    background: "rgba(255,255,255,.08)",
    color: "white",
    fontSize: "14px",
    zIndex: 8,
    cursor: "pointer"
  },
  walletArt: {
    position: "absolute",
    right: "30px",
    top: "30px",
    width: "180px",
    height: "140px",
    zIndex: 2
  },
  diamondShape1: {
    position: "absolute",
    right: "50px",
    top: "10px",
    width: "55px",
    height: "55px",
    background: "linear-gradient(135deg,#38bdf8,#0284c7)",
    transform: "rotate(45deg)",
    borderRadius: "6px",
    opacity: 0.7
  },
  diamondShape2: {
    position: "absolute",
    right: "10px",
    top: "20px",
    width: "45px",
    height: "45px",
    background: "linear-gradient(135deg,#10b981,#059669)",
    transform: "rotate(45deg)",
    borderRadius: "6px",
    opacity: 0.7
  },
  walletBag: {
    position: "absolute",
    right: "20px",
    bottom: "10px",
    width: "90px",
    height: "70px",
    borderRadius: "16px",
    background: "#060913",
    border: "1px solid rgba(56,189,248,0.3)",
    color: "#38bdf8",
    fontSize: "28px",
    fontWeight: "900",
    display: "flex",
    alignItems: "center",
    justifyContent: "center"
  },
  coin1: {
    position: "absolute",
    right: "5px",
    bottom: "10px",
    width: "32px",
    height: "32px",
    borderRadius: "50%",
    background: "linear-gradient(135deg,#fbbf24,#f59e0b)",
    color: "#78350f",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: "900",
    fontSize: "12px"
  },
  coin2: {
    position: "absolute",
    right: "40px",
    bottom: "-5px",
    width: "34px",
    height: "34px",
    borderRadius: "50%",
    background: "linear-gradient(135deg,#34d399,#10b981)",
    color: "#065f46",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: "900",
    fontSize: "12px"
  },
  incomePanel: {
    display: "grid",
    gridTemplateColumns: "repeat(4, 1fr)",
    gap: "10px",
    marginBottom: "10px"
  },
  incomeCard: {
    textAlign: "center"
  },
  incomeIcon: {
    width: "36px",
    height: "36px",
    margin: "0 auto 4px",
    borderRadius: "50%",
    color: "white",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "16px"
  },
  incomeWave: {
    fontSize: "10px",
    fontWeight: "900",
    marginTop: "2px"
  },
  todayBannerCard: {
    background: "#090e1a",
    borderRadius: "16px",
    padding: "14px 18px",
    marginBottom: "14px",
    border: "1px solid rgba(16,185,129,0.3)",
    boxShadow: "0 8px 20px rgba(0,0,0,0.4)"
  },
  todayBannerIcon: {
    width: "38px",
    height: "38px",
    borderRadius: "50%",
    background: "rgba(16, 185, 129, 0.15)",
    border: "1px solid rgba(16, 185, 129, 0.4)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "18px"
  },
  middleGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "14px",
    marginBottom: "14px"
  },
  transferCard: {
    borderRadius: "18px",
    padding: "16px"
  },
  transferIcon: {
    width: "38px",
    height: "38px",
    borderRadius: "10px",
    background: "linear-gradient(135deg,#38bdf8,#2563eb)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "18px",
    marginBottom: "8px"
  },
  transferTitle: {
    margin: 0,
    fontSize: "17px",
    color: "#f8fafc"
  },
  transferSub: {
    color: "#94a3b8",
    fontSize: "11px",
    marginBottom: "12px"
  },
  label: {
    display: "block",
    fontWeight: "700",
    fontSize: "11px",
    marginBottom: "4px",
    color: "#cbd5e1"
  },
  inputWrap: {
    height: "40px",
    borderRadius: "10px",
    background: "#060913",
    border: "1px solid rgba(255,255,255,0.08)",
    display: "flex",
    alignItems: "center",
    padding: "0 10px",
    marginBottom: "10px"
  },
  transferInput: {
    flex: 1,
    border: "none",
    outline: "none",
    fontSize: "13px",
    background: "transparent",
    color: "#fff"
  },
  inputIcon: {
    fontSize: "14px"
  },
  transferBtn: {
    width: "100%",
    height: "40px",
    border: "none",
    borderRadius: "10px",
    background: "linear-gradient(135deg,#38bdf8,#2563eb)",
    color: "white",
    fontSize: "13px",
    fontWeight: "800",
    cursor: "pointer"
  },
  inviteCard: {
    background: "#090e1a",
    borderRadius: "18px",
    padding: "16px",
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
    border: "1px solid rgba(255,255,255,0.08)"
  },
  inviteTop: {
    color: "#38bdf8",
    fontWeight: "800",
    fontSize: "11px",
    letterSpacing: "0.5px"
  },
  inviteTitle: {
    fontSize: "18px",
    margin: "4px 0 2px 0",
    color: "#f8fafc",
    fontWeight: "800"
  },
  inviteSubText: {
    color: "#94a3b8",
    fontSize: "11px",
    margin: 0,
    lineHeight: "1.3"
  },
  giftBox: {
    fontSize: "42px",
    lineHeight: 1
  },
  inviteBtn: {
    height: "40px",
    width: "100%",
    border: "none",
    borderRadius: "10px",
    background: "linear-gradient(135deg,#10b981,#059669)",
    color: "white",
    fontWeight: "800",
    fontSize: "13px",
    cursor: "pointer",
    marginTop: "12px"
  },
  historyCard: {
    background: "#090e1a",
    borderRadius: "18px",
    padding: "14px",
    border: "1px solid rgba(255,255,255,0.08)",
    marginBottom: "14px"
  },
  historyHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "12px"
  },
  historyTitle: {
    margin: 0,
    fontSize: "16px",
    color: "#f8fafc"
  },
  historySub: {
    margin: "2px 0 0",
    fontSize: "11px",
    color: "#94a3b8"
  },
  filterSelect: {
    padding: "4px 8px",
    borderRadius: "6px",
    border: "1px solid rgba(255,255,255,0.1)",
    background: "#060913",
    color: "#fff",
    outline: "none",
    fontSize: "11px"
  },
  tableHead: {
    display: "grid",
    gridTemplateColumns: "70px 1.6fr 1fr 1fr 1.2fr",
    fontSize: "10px",
    fontWeight: "800",
    color: "#94a3b8",
    paddingBottom: "6px",
    borderBottom: "1px solid rgba(255,255,255,0.08)"
  },
  emptyHistory: {
    textAlign: "center",
    padding: "16px",
    color: "#94a3b8",
    fontSize: "12px"
  },
  viewMore: {
    width: "100%",
    padding: "8px",
    border: "none",
    background: "#060913",
    color: "#38bdf8",
    fontWeight: "700",
    fontSize: "11px",
    borderRadius: "8px",
    marginTop: "8px",
    cursor: "pointer"
  },
  bottomFeatures: {
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: "10px"
  },
  featureItem: {
    background: "#090e1a",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: "12px",
    padding: "10px"
  },
  featureIconBadge: {
    width: "32px",
    height: "32px",
    borderRadius: "8px",
    background: "rgba(56,189,248,0.1)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "16px",
    color: "#38bdf8",
    flexShrink: 0
  },
  featureTitle: {
    fontSize: "12px",
    color: "#f8fafc",
    display: "block"
  },
  featureSub: {
    fontSize: "10px",
    color: "#94a3b8",
    margin: "2px 0 0 0"
  },
  modalOverlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(3, 7, 18, 0.8)",
    backdropFilter: "blur(6px)",
    zIndex: 100005,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "12px"
  },
  modal: {
    background: "#090e1a",
    color: "#fff",
    padding: "18px",
    borderRadius: "18px",
    width: "100%",
    maxWidth: "380px",
    boxSizing: "border-box",
    border: "1px solid rgba(56,189,248,0.2)"
  },
  depositOverlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(3, 7, 18, 0.8)",
    backdropFilter: "blur(6px)",
    zIndex: 100005,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "12px"
  },
  depositModal: {
    background: "#090e1a",
    color: "white",
    padding: "18px",
    borderRadius: "18px",
    width: "100%",
    maxWidth: "380px",
    position: "relative",
    boxSizing: "border-box",
    border: "1px solid rgba(56,189,248,0.3)",
    boxShadow: "0 20px 40px rgba(0,0,0,0.8)"
  },
  depositCloseX: {
    position: "absolute",
    top: "10px",
    right: "10px",
    background: "none",
    border: "none",
    color: "#94a3b8",
    fontSize: "20px",
    cursor: "pointer"
  },
  depositIcon: {
    fontSize: "28px",
    textAlign: "center",
    marginBottom: "4px"
  },
  depositTitle: {
    fontSize: "16px",
    textAlign: "center",
    margin: "0 0 4px 0",
    color: "#38bdf8"
  },
  depositSub: {
    fontSize: "11px",
    color: "#94a3b8",
    textAlign: "center",
    marginBottom: "14px"
  },
  depositLabel: {
    display: "block",
    fontSize: "11px",
    fontWeight: "700",
    marginBottom: "4px",
    color: "#cbd5e1"
  },
  depositInput: {
    width: "100%",
    height: "40px",
    borderRadius: "8px",
    border: "1px solid rgba(255,255,255,0.08)",
    background: "#060913",
    color: "white",
    padding: "0 10px",
    marginBottom: "10px",
    outline: "none",
    boxSizing: "border-box"
  },
  submitDepositBtn: {
    width: "100%",
    height: "40px",
    border: "none",
    borderRadius: "10px",
    background: "linear-gradient(135deg,#10b981,#059669)",
    color: "white",
    fontWeight: "800",
    fontSize: "13px",
    cursor: "pointer"
  },
  confirmTop: {
    textAlign: "center",
    marginBottom: "12px"
  },
  confirmAvatar: {
    fontSize: "30px"
  },
  receiverCard: {
    background: "#060913",
    border: "1px solid rgba(255,255,255,0.08)",
    padding: "10px",
    borderRadius: "10px",
    marginBottom: "12px"
  },
  sendMoneyBtn: {
    width: "100%",
    height: "40px",
    border: "none",
    borderRadius: "10px",
    background: "#10b981",
    color: "white",
    fontWeight: "800",
    fontSize: "13px",
    marginBottom: "6px",
    cursor: "pointer"
  },
  cancelBtn: {
    width: "100%",
    height: "36px",
    border: "none",
    borderRadius: "10px",
    background: "rgba(255,255,255,0.05)",
    color: "#94a3b8",
    fontWeight: "700",
    fontSize: "12px",
    cursor: "pointer"
  },
  closeBtn: {
    width: "100%",
    height: "36px",
    border: "none",
    borderRadius: "10px",
    background: "rgba(255,255,255,0.05)",
    color: "#94a3b8",
    fontWeight: "700",
    fontSize: "12px",
    marginTop: "8px",
    cursor: "pointer"
  },
  shareGrid: {
    display: "flex",
    gap: "8px",
    margin: "14px 0"
  },
  shareBtn: {
    flex: 1,
    padding: "8px",
    borderRadius: "8px",
    border: "none",
    background: "#2563eb",
    color: "white",
    textDecoration: "none",
    textAlign: "center",
    fontSize: "11px",
    fontWeight: "700"
  }
};
