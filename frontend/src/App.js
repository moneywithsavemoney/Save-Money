import { BrowserRouter, Routes, Route, useNavigate, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import { App as CapApp } from "@capacitor/app";
import { PushNotifications } from "@capacitor/push-notifications";
import axios from "axios";
import socket from "./socket";

import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { Toaster } from "react-hot-toast";

import Login from "./pages/Login";
import Register from "./pages/Register";
import Home from "./pages/Home";
import Wallet from "./pages/Wallet";
import Refer from "./pages/Refer";
import SaveMoney from "./pages/SaveMoney";
import InvestHistory from "./pages/InvestHistory";
import KYC from "./pages/KYC";
import Notifications from "./pages/Notifications";
import ForgotPassword from "./pages/ForgotPassword";
import UserAnalytics from "./pages/UserAnalytics";
import MyInvestment from "./pages/MyInvestment";

import AdminKYC from "./pages/AdminKYC";
import AdminNotification from "./pages/AdminNotification";
import AdminDashboard from "./pages/AdminDashboard";
import AdminAddon from "./pages/AdminAddon";

import PerformanceBonus from "./pages/PerformanceBonus";
import TeamBonus from "./pages/TeamBonus";
import RoyaltyBonus from "./pages/RoyaltyBonus";
import BonusHistory from "./pages/BonusHistory";

import ProtectedRoute from "./components/ProtectedRoute";
import AdminRoute from "./components/AdminRoute";
import Leaderboard from "./pages/Leaderboard";

import DailyReward from "./pages/DailyReward";
import InvestmentAssistant from "./pages/InvestmentAssistant";

import Support from "./pages/Support";
import AdminSupport from "./pages/AdminSupport";
import ReferralTree from "./pages/ReferralTree";
import LegalPages from "./pages/LegalPages";
import AdvancedAdminAnalytics from "./pages/AdvancedAdminAnalytics";
import AdminUserControl from "./pages/AdminUserControl";
import AdminOneTime from "./pages/AdminOneTime";
import AboutCompany from "./pages/AboutCompany";

import InvestNow from "./pages/InvestNow";
import OneTime from "./pages/OneTime";

import BankDetails from "./pages/BankDetails";
import Withdraw from "./pages/Withdraw";
import EcommerceHome from "./pages/EcommerceHome";


// 🟢 ব্যাক বাটন হ্যান্ডলার সাব-কম্পোনেন্ট
function BackButtonHandler() {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    let listener;

    const setupListener = async () => {
      listener = await CapApp.addListener("backButton", ({ canGoBack }) => {
        if (
          location.pathname === "/" ||
          location.pathname === "/home" ||
          location.pathname === "/login"
        ) {
          CapApp.exitApp();
        } else {
          navigate(-1);
        }
      });
    };

    setupListener();

    return () => {
      if (listener) {
        listener.remove();
      }
    };
  }, [location, navigate]);

  return null;
}

// 🟢 গ্লোবাল বটম নেভিয়েশন বার কম্পোনেন্ট (সব পেজে নিচে শো করবে)
function GlobalBottomNav() {
  const navigate = useNavigate();
  const location = useLocation();

  // যে পেজগুলোতে বটম নেভিয়েশন দেখাতে চান না (যেমন Login বা Register)
  const hideNavPaths = ["/login", "/register", "/forgot-password", "/admin"];
  const shouldShowNav = !hideNavPaths.includes(location.pathname) && !location.pathname.startsWith("/admin");

  if (!shouldShowNav) return null;

  return (
    <nav style={{
      position: "fixed",
      bottom: 0,
      left: 0,
      right: 0,
      height: "56px",
      background: "#020817",
      display: "grid",
      gridTemplateColumns: "repeat(4, 1fr)",
      borderTop: "1px solid #1e40af",
      zIndex: 99999
    }}>
      <button
        style={{
          border: "none",
          background: location.pathname === "/home" || location.pathname === "/" ? "#0f2a5c" : "transparent",
          color: location.pathname === "/home" || location.pathname === "/" ? "white" : "#94a3b8",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "11px",
          cursor: "pointer"
        }}
        onClick={() => navigate("/home")}
      >
        <span style={{ fontSize: "18px" }}>🏠</span>
        <span style={{ fontSize: "10px", marginTop: "2px" }}>Home</span>
      </button>

      <button
        style={{
          border: "none",
          background: location.pathname === "/wallet" ? "#0f2a5c" : "transparent",
          color: location.pathname === "/wallet" ? "white" : "#94a3b8",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "11px",
          cursor: "pointer"
        }}
        onClick={() => navigate("/wallet")}
      >
        <span style={{ fontSize: "18px" }}>👛</span>
        <span style={{ fontSize: "10px", marginTop: "2px" }}>Wallet</span>
      </button>

      <button
        style={{
          border: "none",
          background: location.pathname === "/refer" ? "#0f2a5c" : "transparent",
          color: location.pathname === "/refer" ? "white" : "#94a3b8",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "11px",
          cursor: "pointer"
        }}
        onClick={() => navigate("/refer")}
      >
        <span style={{ fontSize: "18px" }}>👥</span>
        <span style={{ fontSize: "10px", marginTop: "2px" }}>Refer</span>
      </button>

      <button
        style={{
          border: "none",
          background: location.pathname === "/one-time" ? "#0f2a5c" : "transparent",
          color: location.pathname === "/one-time" ? "white" : "#94a3b8",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "11px",
          cursor: "pointer"
        }}
        onClick={() => navigate("/one-time")}
      >
        <span style={{ fontSize: "18px" }}>⚡</span>
        <span style={{ fontSize: "10px", marginTop: "2px" }}>Onetime</span>
      </button>
    </nav>
  );
}

function App() {
  const [popup, setPopup] = useState(null);

  // 🚀 অটো-আপডেট পপ-আপের জন্য স্টেট
  const [updateModal, setUpdateModal] = useState({
    show: false,
    downloadUrl: ""
  });

  // 🔔 FCM Push Notification টোকেন রেজিস্টার ও ব্যাকএন্ডে সেভ করার লজিক
  useEffect(() => {
    const initPushNotifications = async () => {
      try {
        let permStatus = await PushNotifications.checkPermissions();

        if (permStatus.receive === 'prompt') {
          permStatus = await PushNotifications.requestPermissions();
        }

        if (permStatus.receive === 'granted') {
          await PushNotifications.register();
        }
      } catch (err) {
        console.error("Push notification initialization error:", err);
      }
    };

    initPushNotifications();

    // ফায়ারবেস থেকে টোকেন জেনারেট হলে ব্যাকএন্ডের API-তে পাঠানো
    const tokenListener = PushNotifications.addListener('registration', async (token) => {
      const email = localStorage.getItem("email");
      const userId = localStorage.getItem("userId");

      if (token.value && (email || userId)) {
        try {
          await axios.post("https://save-money-backend.onrender.com/api/save-fcm-token", {
            userId: userId,
            email: email,
            fcmToken: token.value
          });
          console.log("FCM token synced successfully with backend");
        } catch (error) {
          console.error("Failed to save FCM token to backend:", error);
        }
      }
    });

    return () => {
      tokenListener.then(l => l.remove());
    };
  }, []);

  // 🔄 অটো-আপডেট চেকিং লজিক
  useEffect(() => {
    const checkAppUpdate = async () => {
      try {
        const res = await fetch(`https://save-moneyy-indol.vercel.app/update.json?t=${Date.now()}`);
        const data = await res.json();

        // ⚠️ আপনার ইনস্টল করা অ্যাপের বর্তমান ভার্সন (১)
        const currentVersionCode = 1;

        if (data && data.versionCode > currentVersionCode) {
          setUpdateModal({
            show: true,
            downloadUrl: data.downloadUrl
          });
        }
      } catch (err) {
        console.error("Update check failed:", err);
      }
    };

    checkAppUpdate();
  }, []);

  useEffect(() => {
    const email = localStorage.getItem("email");

    if (email) {
      socket.emit("join", email);
    }

    socket.on("new_notification", (data) => {
      setPopup(data);

      setTimeout(() => {
        setPopup(null);
      }, 5000);
    });

    return () => {
      socket.off("new_notification");
    };
  }, []);

  return (
    <BrowserRouter>
      {/* 🟢 ব্যাক বাটন লিসেনার যুক্ত করা হলো */}
      <BackButtonHandler />

      {/* 🟢 জুম ও মোবাইল ওভারফ্লো বন্ধ করার মূল কন্টেইনার Wrapper (নিচে প্যাডিং দেওয়া হয়েছে যাতে কন্টেন্ট ঢাকা না পড়ে) */}
      <div style={{ width: "100%", maxWidth: "100vw", overflowX: "hidden", minHeight: "100vh", boxSizing: "border-box", paddingBottom: "70px" }}>

        {/* 🚀 ইন-অ্যাপ অটো-আপডেট পপ-আপ মোডাল */}
        {updateModal.show && (
          <div style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.8)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 99999,
            padding: "20px"
          }}>
            <div style={{
              background: "#1e1b4b",
              borderRadius: "24px",
              padding: "24px",
              maxWidth: "360px",
              width: "100%",
              textAlign: "center",
              color: "#fff",
              border: "1px solid rgba(255,255,255,0.1)",
              boxShadow: "0 20px 50px rgba(0,0,0,0.5)"
            }}>
              <div style={{ fontSize: "48px", marginBottom: "10px" }}>🚀</div>
              <h3 style={{ margin: "0 0 8px 0", fontSize: "20px" }}>New Update Available!</h3>
              <p style={{ fontSize: "14px", color: "#94a3b8", lineHeight: "20px", marginBottom: "20px" }}>
                A new version of Save Money app is available with new features and performance improvements.
              </p>
              
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                <button
                  onClick={() => window.open(updateModal.downloadUrl, "_system")}
                  style={{
                    width: "100%",
                    padding: "14px",
                    borderRadius: "14px",
                    border: "none",
                    background: "linear-gradient(135deg,#22c55e,#10b981)",
                    color: "#fff",
                    fontWeight: "bold",
                    fontSize: "16px",
                    cursor: "pointer"
                  }}
                >
                  Update Now
                </button>

                {/* 🔴 স্কিপ বাটন যুক্ত করা হলো */}
                <button
                  onClick={() => setUpdateModal((prev) => ({ ...prev, show: false }))}
                  style={{
                    width: "100%",
                    padding: "12px",
                    borderRadius: "14px",
                    border: "1px solid rgba(255,255,255,0.2)",
                    background: "transparent",
                    color: "#cbd5e1",
                    fontWeight: "500",
                    fontSize: "14px",
                    cursor: "pointer"
                  }}
                >
                  Skip for Now
                </button>
              </div>
            </div>
          </div>
        )}

        {popup && (
          <div style={{
            position: "fixed",
            top: "20px",
            right: "20px",
            background: "#22c55e",
            color: "white",
            padding: "15px",
            borderRadius: "10px",
            zIndex: 9999
          }}>
            <h4>{popup.title}</h4>
            <p>{popup.message}</p>
          </div>
        )}

        <Routes>
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Home />
              </ProtectedRoute>
            }
          />

          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />

          <Route
            path="/leaderboard"
            element={
              <ProtectedRoute>
                <Leaderboard />
              </ProtectedRoute>
            }
          />

          <Route 
            path="/about" 
            element={
              <ProtectedRoute>
                <AboutCompany />
              </ProtectedRoute>
            } 
          />

          <Route
            path="/home"
            element={
              <ProtectedRoute>
                <Home />
              </ProtectedRoute>
            }
          />

          <Route
            path="/invest-now"
            element={
              <ProtectedRoute>
                <InvestNow />
              </ProtectedRoute>
            }
          />

          <Route 
            path="/bank-details" 
            element={
              <ProtectedRoute>
                <BankDetails />
              </ProtectedRoute>
            } 
          />

          <Route 
            path="/withdraw"
            element={   
              <ProtectedRoute>
                <Withdraw />   
              </ProtectedRoute>
            }
          />

          <Route
            path="/wallet"
            element={
              <ProtectedRoute>
                <Wallet />
              </ProtectedRoute>
            }
          />

          <Route
            path="/refer"
            element={
              <ProtectedRoute>
                <Refer />
              </ProtectedRoute>
            }
          />

          <Route
            path="/save-money"
            element={
              <ProtectedRoute>
                <SaveMoney />
              </ProtectedRoute>
            }
          />

          <Route
            path="/one-time"
            element={
              <ProtectedRoute>
                <OneTime />
              </ProtectedRoute>
            }
          />

          <Route
            path="/my-investment"
            element={
              <ProtectedRoute>
                <MyInvestment />
              </ProtectedRoute>
            }
          />

          <Route
            path="/invest-history"
            element={
              <ProtectedRoute>
                <InvestHistory />
              </ProtectedRoute>
            }
          />

          <Route
            path="/bonus-history"
            element={
              <ProtectedRoute>
                <BonusHistory />
              </ProtectedRoute>
            }
          />

          <Route
            path="/kyc"
            element={
              <ProtectedRoute>
                <KYC />
              </ProtectedRoute>
            }
          />

          <Route
            path="/notifications"
            element={
              <ProtectedRoute>
                <Notifications />
              </ProtectedRoute>
            }
          />

          <Route
            path="/legal/:type"
            element={
              <ProtectedRoute>
                <LegalPages />
              </ProtectedRoute>
            }
          />

          <Route
            path="/performance-bonus"
            element={
              <ProtectedRoute>
                <PerformanceBonus />
              </ProtectedRoute>
            }
          />

          <Route
            path="/team-bonus"
            element={
              <ProtectedRoute>
                <TeamBonus />
              </ProtectedRoute>
            }
          />

          <Route
            path="/royalty-bonus"
            element={
              <ProtectedRoute>
                <RoyaltyBonus />
              </ProtectedRoute>
            }
          />

          <Route
            path="/referral-tree"
            element={
              <ProtectedRoute>
                <ReferralTree />
              </ProtectedRoute>
            }
          />

          <Route
            path="/analytics"
            element={
              <ProtectedRoute>
                <UserAnalytics />
              </ProtectedRoute>
            }
          />

          <Route
            path="/daily-reward"
            element={
              <ProtectedRoute>
                <DailyReward />
              </ProtectedRoute>
            }
          />

          <Route
            path="/investment-assistant"
            element={
              <ProtectedRoute>
                <InvestmentAssistant />
              </ProtectedRoute>
            }
          />

          <Route path="/admin-addon" element={<ProtectedRoute><AdminAddon /></ProtectedRoute>} />

            <Route path="/ecommerce-home" element={<EcommerceHome />} />
            

          <Route
            path="/support"
            element={
              <ProtectedRoute>
                <Support />
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin"
            element={
              <AdminRoute>
                <AdminDashboard />
              </AdminRoute>
            }
          />

          <Route
            path="/admin-kyc"
            element={
              <AdminRoute>
                <AdminKYC />
              </AdminRoute>
            }
          />

          <Route
            path="/admin-analytics"
            element={
              <AdminRoute>
                <AdvancedAdminAnalytics />
              </AdminRoute>
            }
          />

          <Route
            path="/admin-user-control"
            element={
              <AdminRoute>
                <AdminUserControl />
              </AdminRoute>
            }
          />

          <Route
            path="/admin-one-time"
            element={
              <AdminRoute>
                <AdminOneTime />
              </AdminRoute>
            }
          />

          <Route
            path="/admin-support"
            element={
              <AdminRoute>
                <AdminSupport />
              </AdminRoute>
            }
          />

          <Route
            path="/admin-notify"
            element={
              <AdminRoute>
                <AdminNotification />
              </AdminRoute>
            }
          />

          <Route path="*" element={<Login />} />

        </Routes>

        <ToastContainer
          position="top-center"
          autoClose={2500}
          theme="dark"
        />

        <Toaster
          position="top-center"
          reverseOrder={false}
        />

      </div>

      {/* 🟢 গ্লোবাল ফিক্সড বটম নেভিয়েশন বার */}
      <GlobalBottomNav />
    </BrowserRouter>
  );
}

export default App;
