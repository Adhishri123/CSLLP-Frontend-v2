import React, { useState, useEffect, useContext } from 'react';
import { getMyCourses, getEnrollmentsByEmployee, getUserById } from '../services/api';
import axiosInstance from "../apis/axiosConfig";
import { AuthContext } from "../context/AuthContext";

export default function EmployeeDashboard({ user, onLogout }) {
  // Get user from JWT context (for HRMS data)
  const { user: authUser } = useContext(AuthContext);
  
  // ==================== E-LEARNING STATE (ORIGINAL) ====================
  const [manager, setManager] = useState(null);
  const [myCourses, setMyCourses] = useState([]);
  const [enrollments, setEnrollments] = useState([]);
  const [loading, setLoading] = useState(false);

  // ==================== HRMS STATE (ORIGINAL) ====================
  const [leaveStats, setLeaveStats] = useState({
    approvedLeaves: 0,
    pendingLeaves: 0,
    totalRequests: 0,
    leaveBalance: 0
  });
  const [attendanceStats, setAttendanceStats] = useState({
    presentDays: 0,
    absentDays: 0,
    leaveDays: 0,
    actualWorkingDays: 0,
    pendingPunches: 0,
    totalWorkHours: 0,
    averageWorkHours: 0,
    leaveDates: [],
    pendingPunchDates: []
  });
  const [dailyAttendance, setDailyAttendance] = useState([]);
  const [dailyLoading, setDailyLoading] = useState(false);
  const [loadingHRMS, setLoadingHRMS] = useState(true);
  const [attendanceLoading, setAttendanceLoading] = useState(true);
  const [selectedMonthYear, setSelectedMonthYear] = useState("");

  // Get employee ID from either prop or auth context
  const employeeId = user?.id || authUser?.id || authUser?.employeeId;
  const employeeName = user?.name || authUser?.name || authUser?.employeeName;

  // Initialize month/year for attendance
  useEffect(() => {
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth() + 1;
    const currentYear = currentDate.getFullYear();
    const defaultMonthYear = `${currentYear}-${currentMonth.toString().padStart(2, '0')}`;
    setSelectedMonthYear(defaultMonthYear);
  }, []);

  // ==================== LEARNING DASHBOARD FUNCTIONS ====================
  
  // Fetch manager info
  useEffect(() => {
    async function fetchManager() {
      if (user?.managerId) {
        setLoading(true);
        try {
          const res = await getUserById(user.managerId);
          console.log("Manager data:", res);
          if (res.data) {
            setManager(res.data);
          }
        } catch (error) {
          console.error('Error fetching manager:', error);
        } finally {
          setLoading(false);
        }
      }
    }
    fetchManager();
  }, [user?.managerId]);

  // Load learning dashboard data
  useEffect(() => {
    if (user?.id) {
      loadDashboardData();
    }
  }, [user?.id]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const coursesRes = await getMyCourses(user.id);
      if (coursesRes.success) {
        setMyCourses(coursesRes.data);
      }

      const enrollRes = await getEnrollmentsByEmployee(user.id);
      if (enrollRes.success) {
        setEnrollments(enrollRes.data);
      }
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  // ==================== HRMS FUNCTIONS ====================

  // Fetch Leave Stats
  useEffect(() => {
    if (!employeeId) { 
      setLoadingHRMS(false); 
      return; 
    }

    const fetchEmployeeData = async () => {
      try {
        setLoadingHRMS(true);
        
        const [balanceResponse, leavesResponse] = await Promise.all([
          axiosInstance.get(`http://localhost:8093/api/leaves/leave-balance/${employeeId}`),
          axiosInstance.get(`http://localhost:8093/api/leaves/employee/${employeeId}`)
        ]);
        
        const leaves = leavesResponse.data || [];
        const approvedLeaves = leaves.filter(l => l.status === 'APPROVED').length;
        const pendingLeaves = leaves.filter(l => l.status === 'PENDING').length;
        const totalRequests = leaves.length;
        const leaveBalance = Object.values(balanceResponse.data || {}).reduce(
          (sum, balance) => sum + (Number(balance) || 0), 0
        );
        
        setLeaveStats({ approvedLeaves, pendingLeaves, totalRequests, leaveBalance });
      } catch (error) {
        console.error("Error fetching leave data:", error);
      } finally {
        setLoadingHRMS(false);
      }
    };

    fetchEmployeeData();
  }, [employeeId]);

  // Fetch Monthly Attendance Summary
  useEffect(() => {
    if (!employeeId || !selectedMonthYear) { 
      setAttendanceLoading(false); 
      return; 
    }

    const fetchMonthlyAttendance = async () => {
      try {
        setAttendanceLoading(true);
        console.log("📊 Fetching monthly attendance for:", {
          employeeId,
          month: selectedMonthYear
        });

        const response = await axiosInstance.get(
          `http://localhost:8094/api/attendance/employee/${employeeId}/monthly-summary`,
          {
            params: {
              month: selectedMonthYear
            }
          }
        );

        console.log("✅ Monthly Attendance Response:", response.data);

        const data = response.data || {};
        
        setAttendanceStats({
          presentDays: data.presentDays || 0,
          absentDays: data.absentDays || 0,
          leaveDays: data.leaveDays || 0,
          actualWorkingDays: data.actualWorkingDays || 0,
          pendingPunches: data.pendingPunches || 0,
          totalWorkHours: parseFloat(data.totalWorkHours) || 0,
          averageWorkHours: parseFloat(data.averageWorkHours) || 0,
          leaveDates: data.leaveDates || [],
          pendingPunchDates: data.pendingPunchDates || []
        });

      } catch (error) {
        console.error("❌ Error fetching monthly attendance:", error);
        setAttendanceStats({
          presentDays: 0,
          absentDays: 0,
          leaveDays: 0,
          actualWorkingDays: 0,
          pendingPunches: 0,
          totalWorkHours: 0,
          averageWorkHours: 0,
          leaveDates: [],
          pendingPunchDates: []
        });
      } finally {
        setAttendanceLoading(false);
      }
    };

    fetchMonthlyAttendance();
  }, [employeeId, selectedMonthYear]);

  // ==================== HELPER FUNCTIONS ====================

  const handleMonthYearChange = (e) => setSelectedMonthYear(e.target.value);

  const generateMonthYearOptions = () => {
    const options = [];
    const currentDate = new Date();
    for (let i = 0; i < 12; i++) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
      const year = date.getFullYear();
      const month = date.getMonth() + 1;
      const value = `${year}-${month.toString().padStart(2, '0')}`;
      const label = date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
      options.unshift({ value, label });
    }
    return options;
  };

  const getMonthName = (monthYear) => {
    if (!monthYear) return '';
    const [year, month] = monthYear.split('-');
    return new Date(year, month - 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  };

  const calculateAttendanceRate = () => {
    if (attendanceStats.actualWorkingDays === 0) return 0;
    return ((attendanceStats.presentDays / attendanceStats.actualWorkingDays) * 100).toFixed(1);
  };

  // Calculate learning statistics
  const totalCourses = myCourses.length;
  const completedCourses = enrollments.filter(e => e.progress === 100).length;
  const inProgressCourses = enrollments.filter(e => e.progress > 0 && e.progress < 100).length;
  const averageProgress = enrollments.length > 0 
    ? Math.round(enrollments.reduce((sum, e) => sum + e.progress, 0) / enrollments.length)
    : 0;

  // Compute leave days from daily records
  const leaveRecords = dailyAttendance.filter(r => r.attendanceStatus === "LEAVE");

  // Get color for attendance rate
  const getRateColor = () => {
    const rate = calculateAttendanceRate();
    if (rate >= 90) return 'success';
    if (rate >= 75) return 'warning';
    return 'danger';
  };

  if (loading && loadingHRMS) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '60vh' }}>
        <div className="text-center">
          <div className="spinner-border text-primary" role="status" style={{ width: '3rem', height: '3rem' }}>
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-3 text-muted">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container-fluid px-3 py-3" style={{ backgroundColor: '#f0f2f5', minHeight: '100vh' }}>
      
      {/* ==================== HEADER ==================== */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="mb-1 fw-bold">🎯 My Dashboard</h2>
          <small className="text-muted">
            Track your learning progress and HRMS activities
          </small>
        </div>
        <div className="d-flex gap-2 align-items-center">
          <span>Welcome, {user?.name || employeeName}</span>
          <button className="btn btn-outline-primary btn-sm" onClick={loadDashboardData}>
            🔄 Refresh
          </button>
        </div>
      </div>

      {/* ==================== STATS CARDS - 2 PER ROW ==================== */}
      <div className="stats-grid mb-4" style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
        gap: '1rem'
      }}>
        {/* Card 1: Total Courses */}
        <div className="card border-0 shadow-sm h-100">
          <div className="card-body">
            <div className="d-flex justify-content-between align-items-start">
              <div>
                <h6 className="card-title text-muted mb-2">Total Courses</h6>
                <h3 className="fw-bold text-primary">{totalCourses}</h3>
                <small className="text-muted">Enrolled</small>
              </div>
              <div className="bg-primary bg-opacity-10 p-3 rounded">
                <span style={{ fontSize: '1.5rem' }} className="text-primary">📚</span>
              </div>
            </div>
          </div>
        </div>

        {/* Card 2: Completed Courses */}
        <div className="card border-0 shadow-sm h-100">
          <div className="card-body">
            <div className="d-flex justify-content-between align-items-start">
              <div>
                <h6 className="card-title text-muted mb-2">Completed</h6>
                <h3 className="fw-bold text-success">{completedCourses}</h3>
                <small className="text-muted">Finished courses</small>
              </div>
              <div className="bg-success bg-opacity-10 p-3 rounded">
                <span style={{ fontSize: '1.5rem' }} className="text-success">✅</span>
              </div>
            </div>
          </div>
        </div>

        {/* Card 3: Average Progress */}
        <div className="card border-0 shadow-sm h-100">
          <div className="card-body">
            <div className="d-flex justify-content-between align-items-start">
              <div>
                <h6 className="card-title text-muted mb-2">Avg Progress</h6>
                <h3 className="fw-bold text-info">{averageProgress}%</h3>
                <small className="text-muted">Overall learning</small>
              </div>
              <div className="bg-info bg-opacity-10 p-3 rounded">
                <span style={{ fontSize: '1.5rem' }} className="text-info">📊</span>
              </div>
            </div>
          </div>
        </div>

        {/* Card 4: Leave Balance */}
        <div className="card border-0 shadow-sm h-100">
          <div className="card-body">
            <div className="d-flex justify-content-between align-items-start">
              <div>
                <h6 className="card-title text-muted mb-2">Leave Balance</h6>
                <h3 className="fw-bold text-warning">{leaveStats.leaveBalance}</h3>
                <small className="text-muted">Remaining days</small>
              </div>
              <div className="bg-warning bg-opacity-10 p-3 rounded">
                <span style={{ fontSize: '1.5rem' }} className="text-warning">🎫</span>
              </div>
            </div>
          </div>
        </div>

        {/* Card 5: Present Days */}
        <div className="card border-0 shadow-sm h-100">
          <div className="card-body">
            <div className="d-flex justify-content-between align-items-start">
              <div>
                <h6 className="card-title text-muted mb-2">Present Days</h6>
                <h3 className="fw-bold text-success">
                  {attendanceLoading ? "..." : attendanceStats.presentDays}
                </h3>
                <small className="text-muted">/{attendanceStats.actualWorkingDays} days</small>
              </div>
              <div className="bg-success bg-opacity-10 p-3 rounded">
                <span style={{ fontSize: '1.5rem' }} className="text-success">✅</span>
              </div>
            </div>
          </div>
        </div>

        {/* Card 6: Absent Days */}
        <div className="card border-0 shadow-sm h-100">
          <div className="card-body">
            <div className="d-flex justify-content-between align-items-start">
              <div>
                <h6 className="card-title text-muted mb-2">Absent Days</h6>
                <h3 className="fw-bold text-danger">
                  {attendanceLoading ? "..." : attendanceStats.absentDays}
                </h3>
                <small className="text-muted">Total absences</small>
              </div>
              <div className="bg-danger bg-opacity-10 p-3 rounded">
                <span style={{ fontSize: '1.5rem' }} className="text-danger">❌</span>
              </div>
            </div>
          </div>
        </div>

        {/* Card 7: Leave Days */}
        <div className="card border-0 shadow-sm h-100">
          <div className="card-body">
            <div className="d-flex justify-content-between align-items-start">
              <div>
                <h6 className="card-title text-muted mb-2">Leave Days</h6>
                <h3 className="fw-bold text-info">
                  {attendanceLoading ? "..." : attendanceStats.leaveDays}
                </h3>
                <small className="text-muted">This month</small>
              </div>
              <div className="bg-info bg-opacity-10 p-3 rounded">
                <span style={{ fontSize: '1.5rem' }} className="text-info">🏖️</span>
              </div>
            </div>
          </div>
        </div>

        {/* Card 8: Attendance Rate */}
        <div className="card border-0 shadow-sm h-100">
          <div className="card-body">
            <div className="d-flex justify-content-between align-items-start">
              <div>
                <h6 className="card-title text-muted mb-2">Attendance Rate</h6>
                <h3 className={`fw-bold text-${getRateColor()}`}>
                  {attendanceLoading ? "..." : `${calculateAttendanceRate()}%`}
                </h3>
                <small className="text-muted">Overall attendance</small>
              </div>
              <div className={`bg-${getRateColor()} bg-opacity-10 p-3 rounded`}>
                <span style={{ fontSize: '1.5rem' }} className={`text-${getRateColor()}`}>📈</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ==================== QUICK ACTIONS ==================== */}
      <div className="row mb-4">
        <div className="col-12">
          <div className="card border-0 shadow-sm">
            <div className="card-header bg-light">
              <h5 className="card-title mb-0">🚀 Quick Actions</h5>
            </div>
            <div className="card-body">
              <div className="row g-2">
                <div className="col-xl-2 col-md-3 col-sm-4 col-6">
                  <a href="/course-enrollment" className="btn btn-outline-primary w-100">
                    📚 Browse Courses
                  </a>
                </div>
                <div className="col-xl-2 col-md-3 col-sm-4 col-6">
                  <a href="/my-courses" className="btn btn-outline-primary w-100">
                    🎓 My Courses
                  </a>
                </div>
                <div className="col-xl-2 col-md-3 col-sm-4 col-6">
                  <a href="/examinations" className="btn btn-outline-primary w-100">
                    📝 Exams
                  </a>
                </div>
                <div className="col-xl-2 col-md-3 col-sm-4 col-6">
                  <a href="/leaves" className="btn btn-outline-success w-100">
                    📋 Leave Request
                  </a>
                </div>
                <div className="col-xl-2 col-md-3 col-sm-4 col-6">
                  <a href="/attendance" className="btn btn-outline-info w-100">
                    📅 Attendance
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ==================== MAIN CONTENT ==================== */}
      <div className="row g-3">
        {/* LEFT COLUMN - Learning & Development */}
        <div className="col-lg-6">
          {/* Course Progress */}
          <div className="card border-0 shadow-sm">
            <div className="card-header bg-light">
              <h5 className="card-title mb-0">📈 Course Progress</h5>
            </div>
            <div className="card-body">
              {myCourses.length === 0 ? (
                <div className="text-center py-4">
                  <p className="text-muted">No courses enrolled yet.</p>
                  <a href="/course-enrollment" className="btn btn-primary">
                    Browse Courses
                  </a>
                </div>
              ) : (
                <div className="list-group list-group-flush">
                  {myCourses.slice(0, 5).map((item, index) => (
                    <div key={index} className="list-group-item px-0">
                      <div className="d-flex justify-content-between align-items-center mb-2">
                        <strong className="small">{item.course.title}</strong>
                        <span className="badge bg-primary">{item.progress}%</span>
                      </div>
                      <div className="progress" style={{ height: '6px' }}>
                        <div 
                          className="progress-bar" 
                          style={{ 
                            width: `${item.progress}%`,
                            background: 'linear-gradient(90deg, #667eea 0%, #764ba2 100%)'
                          }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Achievements */}
          <div className="card border-0 shadow-sm mt-3">
            <div className="card-header bg-light">
              <h5 className="card-title mb-0">🏆 Achievements</h5>
            </div>
            <div className="card-body">
              <div className="list-group list-group-flush">
                {completedCourses > 0 && (
                  <div className="list-group-item px-0">
                    <span className="badge bg-success me-2">✅</span>
                    Completed {completedCourses} course(s)
                  </div>
                )}
                {inProgressCourses > 0 && (
                  <div className="list-group-item px-0">
                    <span className="badge bg-info me-2">🚀</span>
                    {inProgressCourses} course(s) in progress
                  </div>
                )}
                {averageProgress >= 75 && (
                  <div className="list-group-item px-0">
                    <span className="badge bg-warning me-2">⭐</span>
                    Great progress! Keep it up
                  </div>
                )}
                <div className="list-group-item px-0">
                  <span className="badge bg-primary me-2">🎯</span>
                  Overall progress: {averageProgress}%
                </div>
                {calculateAttendanceRate() >= 85 && (
                  <div className="list-group-item px-0">
                    <span className="badge bg-success me-2">🏅</span>
                    Excellent attendance: {calculateAttendanceRate()}%
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN - HRMS */}
        <div className="col-lg-6">
          {/* Monthly Attendance Summary */}
          <div className="card border-0 shadow-sm">
            <div className="card-header bg-light">
              <div className="d-flex justify-content-between align-items-center">
                <h5 className="card-title mb-0">📊 Monthly Attendance</h5>
                <div className="d-flex align-items-center gap-2">
                  <span className="badge bg-primary">{attendanceStats.actualWorkingDays} Working Days</span>
                  <select
                    className="form-select form-select-sm w-auto"
                    value={selectedMonthYear}
                    onChange={handleMonthYearChange}
                    disabled={attendanceLoading}
                    style={{ minWidth: '100px' }}
                  >
                    {generateMonthYearOptions().map(option => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
            <div className="card-body">
              <div className="row g-2">
                {[
                  { title: "Present", value: attendanceStats.presentDays, color: "success", icon: "✅" },
                  { title: "Absent", value: attendanceStats.absentDays, color: "danger", icon: "❌" },
                  { title: "Leave", value: attendanceStats.leaveDays, color: "info", icon: "🏖️" },
                  { title: "Rate", value: `${calculateAttendanceRate()}%`, color: getRateColor(), icon: "📈" },
                ].map((card, i) => (
                  <div key={i} className="col-6">
                    <div className="card bg-light border-0">
                      <div className="card-body text-center py-3">
                        <div className="text-muted small">{card.icon} {card.title}</div>
                        <div className={`h4 fw-bold text-${card.color} mt-1`}>
                          {attendanceLoading ? "..." : card.value}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Work Hours */}
              <div className="row g-2 mt-2">
                {[
                  { icon: "⏱️", label: "Total Hours", value: `${attendanceStats.totalWorkHours}h` },
                  { icon: "📅", label: "Avg/Day", value: `${attendanceStats.averageWorkHours}h` },
                  { icon: "⚠️", label: "Pending Punches", value: attendanceStats.pendingPunches, color: "text-warning" },
                ].map((item, i) => (
                  <div key={i} className="col-4">
                    <div className="text-center">
                      <div className="text-muted small">{item.icon} {item.label}</div>
                      <div className="fw-bold">
                        {attendanceLoading ? "..." : item.value}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Leave Management Overview */}
          <div className="card border-0 shadow-sm mt-3">
            <div className="card-header bg-light">
              <h5 className="card-title mb-0">🎫 Leave Management</h5>
            </div>
            <div className="card-body">
              <div className="row g-2">
                {[
                  { title: "Approved", value: leaveStats.approvedLeaves, color: "success", icon: "✅" },
                  { title: "Pending", value: leaveStats.pendingLeaves, color: "warning", icon: "⏳" },
                  { title: "Total Requests", value: leaveStats.totalRequests, color: "info", icon: "📋" },
                ].map((card, i) => (
                  <div key={i} className="col-4">
                    <div className="text-center">
                      <div className="text-muted small">{card.icon} {card.title}</div>
                      <div className={`h4 fw-bold text-${card.color}`}>
                        {loadingHRMS ? "..." : card.value}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Status Information */}
              <div className="mt-3">
                {leaveStats.pendingLeaves > 0 && (
                  <div className="alert alert-warning border-0 mb-2 py-2">
                    <small><strong>{leaveStats.pendingLeaves} pending leave(s)</strong> waiting for approval</small>
                  </div>
                )}
                {attendanceStats.absentDays > 0 && (
                  <div className="alert alert-danger border-0 mb-2 py-2">
                    <small><strong>{attendanceStats.absentDays} absence(s)</strong> this month</small>
                  </div>
                )}
                {calculateAttendanceRate() >= 90 && (
                  <div className="alert alert-success border-0 mb-0 py-2">
                    <small><strong>Great attendance! 🎉</strong> Rate: {calculateAttendanceRate()}%</small>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ==================== FOOTER / MANAGER INFO ==================== */}
      {manager && (
        <div className="row mt-4">
          <div className="col-12">
            <div className="card border-0 shadow-sm">
              <div className="card-body">
                <div className="d-flex align-items-center gap-3">
                  <div className="bg-primary bg-opacity-10 p-3 rounded">
                    <span style={{ fontSize: '1.5rem' }}>👤</span>
                  </div>
                  <div>
                    <small className="text-muted d-block">Your Manager</small>
                    <span className="fw-bold">{manager.name}</span>
                    <span className="text-muted ms-2">• {manager.email}</span>
                    {manager.role && <span className="badge bg-primary ms-2">{manager.role}</span>}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}