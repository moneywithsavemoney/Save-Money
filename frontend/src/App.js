import { BrowserRouter, Routes, Route, useNavigate, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import { App as CapApp } from "@capacitor/app";
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

// 🟢 ব্যাক বাটন হ্যান্ডলার সাব-কম্পোনেন্ট
function BackButtonHandler() {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    let listener;

    const setupListener = async () => {
      listener = await CapApp.addListener("backButton", ({ canGoBack }) => {
        // যদি ইউজার হোম, লগইন বা মেইন পেজে থাকে তবে ব্যাক চাপলে অ্যাপ ক্লোজ হবে
        if (
          location.pathname === "/" ||
          location.pathname === "/home" ||
          location.pathname === "/login"
        ) {
          CapApp.exitApp();
        } else {
          // অন্য কোনো সাব-পেজে থাকলে ১ ধাপ ব্যাক করে হোম/আগের পেজে ফিরবে
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

function App() {
  const [popup, setPopup] = useState(null);

  // 🚀 অটো-আপডেট পপ-আপের জন্য স্টেট
  const [updateModal, setUpdateModal] = useState({
    show: false,
    downloadUrl: ""
  });

  // 🔄 অটো-আপডেট চেকিং লজিক
  useEffect(() => {
    const checkAppUpdate = async () => {
      try {
        const res = await fetch("https://save-moneyy-indol.vercel.app/update.json");
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

      {/* 🟢 জুম ও মোবাইল ওভারফ্লো বন্ধ করার মূল কন্টেইনার Wrapper */}
      <div style={{ width: "100%", maxWidth: "100vw", overflowX: "hidden", minHeight: "100vh", boxSizing: "border-box" }}>

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
          {/* 🏠 রুট ইউআরএল হুক (ডিফল্ট হোমপেজে নিয়ে যাবে) */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Home />
              </ProtectedRoute>
            }
          />

          {/* 🔓 পাবলিক রুটস */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />

          {/* 🔒 প্রটেক্টেড রুটস (ইউজারদের জন্য) */}
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

          <Route
            path="/support"
            element={
              <ProtectedRoute>
                <Support />
              </ProtectedRoute>
            }
          />

          {/* 🛠️ অ্যাডমিন রুটস */}
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

          {/* 🔄 ফলব্যাক রুট */}
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
    </BrowserRouter>
  );
}

export default App;
