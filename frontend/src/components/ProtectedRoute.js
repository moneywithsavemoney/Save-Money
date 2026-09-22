import React, { useState, useEffect } from "react";
import { Navigate } from "react-router-dom";

export default function ProtectedRoute({ children }) {
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    // LocalStorage থেকে টোকেন বা ইমেইল সেভ আছে কিনা চেক করা
    const token = localStorage.getItem("token") || localStorage.getItem("accessToken");
    const email = localStorage.getItem("email");

    if (token || email) {
      setIsAuthenticated(true);
    } else {
      setIsAuthenticated(false);
    }
    setLoading(false);
  }, []);

  // অ্যান্ড্রয়েড অ্যাপ লোড হওয়া পর্যন্ত অপেক্ষা করার জন্য
  if (loading) {
    return (
      <div style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        height: "100vh",
        background: "#0f172a",
        color: "white"
      }}>
        <h3>Loading...</h3>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
}
