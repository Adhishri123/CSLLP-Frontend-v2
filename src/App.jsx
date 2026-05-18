// src/App.jsx
import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";

// 🔴 ADD THIS IMPORT
import Layout from "./components/Layout";
import Login from "./pages/Login";

// Dashboard Components
import AdminDashboard from "./components/AdminDashboard";
import ManagerDashboard from "./components/ManagerDashboard";
import EmployeeDashboard from "./components/EmployeeDashboard";

// Course Components
// Course Components
import CourseEnrollment from "./components/CourseEnrollment";
import MyCourses from "./components/MyCourses";
import Examinations from "./components/Examinations";
import TakeExam from "./components/TakeExam";
import Certifications from "./components/Certifications";
// import Leaderboards from "./components/Leaderboards";
import CourseManagement from "./components/CourseManagement";
import CourseApprovals from "./components/CourseApprovals";
import UserManagement from "./pages/UserManagement";
import Reports from "./components/Reports";
import Feedback from "./components/Feedback";
import Profile from "./components/Profile";

import StudyMaterials from "./components/StudyMaterials";
import UserCourses from "./components/UserCourses"; // 🆕 NEW IMPORT

// Services
import { loadUserFromStorage, saveUserToStorage, clearUser } from "./services/api";

export default function App() {
  const [user, setUser] = useState(null);

  // Load logged-in user on refresh
  useEffect(() => {
    const saved = loadUserFromStorage();
    if (saved) setUser(saved);
  }, []);

  // Login handler
  function handleLogin(u) {
    saveUserToStorage(u);
    setUser(u);
  }

  // Logout handler
  function handleLogout() {
    clearUser();
    setUser(null);
  }

  // If not logged in → show login
  if (!user) return <Login onLogin={handleLogin} />;

  // 🔴 ADD THIS HELPER FUNCTION
  const getDashboardComponent = () => {
    if (user.role === "ADMIN") {
      return <AdminDashboard user={user} />;
    } else if (user.role === "MANAGER") {
      return <ManagerDashboard user={user} />;
    } else {
      return <EmployeeDashboard user={user} />;
    }
  };

  return (
    <Router>
      {/* 🔴 WRAP ALL ROUTES WITH LAYOUT COMPONENT */}
      <Layout user={user} onLogout={handleLogout}>
        <Routes>
          {/* Dashboard */}
          <Route path="/" element={getDashboardComponent()} />

          {/* Common Pages */}
          <Route path="/study-materials" element={<StudyMaterials user={user} />} />
          <Route path="/course-enrollment" element={<CourseEnrollment user={user} />} />
          
          {/* 🆕 UPDATED: My Courses - Employee Only */}
          <Route
            path="/my-courses"
            element={
              user.role === "EMPLOYEE" 
                ? <MyCourses user={user} />
                : <Navigate to="/" replace />
            }
          />
          
          {/* 🆕 UPDATED: User Courses - Admin Only */}
          <Route
            path="/user-courses"
            element={
              user.role === "ADMIN"
                ? <UserCourses user={user} />
                : <Navigate to="/" replace />
            }
          />

          <Route path="/examinations" element={<Examinations user={user} />} />
            <Route path="/examinations/take/:examId" element={<TakeExam user={user} />} /> {/* ✅ Added */}
          <Route path="/certifications" element={<Certifications user={user} />} />
          {/* <Route path="/leaderboards" element={<Leaderboards user={user} />} /> */}

          {/* Manager / Admin Pages */}
          <Route
            path="/course-management"
            element={
              user.role === "ADMIN" || user.role === "MANAGER" 
                ? <CourseManagement user={user} />
                : <Navigate to="/" replace />
            }
          />
          <Route
            path="/course-approvals"
            element={
              user.role === "ADMIN" || user.role === "MANAGER"
                ? <CourseApprovals user={user} />
                : <Navigate to="/" replace />
            }
          />

          {/* Admin Only Pages */}
          <Route
            path="/user-management"
            element={
              user.role === "ADMIN"
                ? <UserManagement user={user} />
                : <Navigate to="/" replace />
            }
          />
          {/* <Route
            path="/admin-panel"
            element={
              user.role === "ADMIN"
                ? <AdminPanel user={user} />
                : <Navigate to="/" replace />
            }
          /> */}

          {/* Common Pages */}
          <Route path="/reports" element={<Reports user={user} />} />
          <Route path="/feedback" element={<Feedback user={user} />} />
          <Route path="/profile" element={<Profile user={user} />} /> 

          {/* Fallback → redirect to dashboard */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Layout>
    </Router>
  );
}