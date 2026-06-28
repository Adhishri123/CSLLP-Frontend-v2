// 
import React, { useState, useEffect } from 'react';
import { getCourseReport, getPendingEnrollments, getUsers, getAdminStats } from '../services/api';

export default function AdminDashboard({ user }) {
  const [stats, setStats] = useState({
    totalCourses: 0,
    totalEmployees: 0,
    totalManagers: 0,
    totalUsers: 0,
    completedCourses: 0,
    pendingApprovals: 0,
    activeEnrollments: 0,
    totalFeedbacks: 0,
    totalDepartments: 5  // ✅ Added this
  });
  const [recentActivity, setRecentActivity] = useState([]);
  const [loading, setLoading] = useState(true);
  const [monthlyPayroll, setMonthlyPayroll] = useState(0); // ✅ Added this
  const [pendingLeaves, setPendingLeaves] = useState(0);
  const [payslipCount, setPayslipCount] = useState(0);
  const [attendanceSummary, setAttendanceSummary] = useState({ present: 0, absent: 0 });
  const [showWelcomeAlert, setShowWelcomeAlert] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      // Load course report
      const reportRes = await getCourseReport();
      console.log("📊 Course Report Response:", reportRes.data);
      
      if (reportRes.success) {
        const reportData = reportRes.data;
        setStats(prev => ({
          ...prev,
          totalCourses: reportData.totalCourses || 0,
          completedCourses: reportData.completedCourses || 0,
          pendingApprovals: reportData.pendingApprovals || 0,
          activeEnrollments: reportData.activeEnrollments || 0
        }));
      }

      // Load total employees, managers, hrs and total users
      const usersRes = await getUsers();
      console.log("📊 User Response:", usersRes.data);
      if (usersRes.success) {
        const users = usersRes.data || [];
        const employees = users.filter(u => u.role === 'EMPLOYEE');
        const managers = users.filter(u => u.role === 'MANAGER');
        const hrs = users.filter(u => u.role === 'HR');
        const totalUsers = employees.length + managers.length + hrs.length;
        
        setStats(prev => ({ 
          ...prev, 
          totalEmployees: employees.length,
          totalManagers: managers.length,
          totalUsers: totalUsers
        }));
      }

      // Load total feedbacks from admin stats
      const adminStatsRes = await getAdminStats();
      if (adminStatsRes.success) {
        const adminStats = adminStatsRes.data;
        setStats(prev => ({ 
          ...prev, 
          totalFeedbacks: adminStats.totalFeedbacks || 0 
        }));
      }

      // Load pending enrollments for activity
      const pendingRes = await getPendingEnrollments();
      if (pendingRes.success) {
        setRecentActivity((pendingRes.data || []).slice(0, 5));
      }

    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="text-center p-4">Loading dashboard...</div>;

  return (
    <div className="container-fluid">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="mb-1 fw-bold">📊 Admin Dashboard</h2>
          <small className="text-muted fs-4">
            Overview of platform metrics and activities
          </small>
        </div>
      </div>

      {/* Stats Cards - Row 1 */}
      <div className="row mb-4">
        <div className="col-md-3">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-start">
                <div>
                  <h6 className="card-title text-muted mb-2">Total Courses</h6>
                  <h3 className="fw-bold text-primary">{stats.totalCourses}</h3>
                  <small className="text-muted">Available in platform</small>
                </div>
                <div className="bg-primary bg-opacity-10 p-3 rounded">
                  <span style={{ fontSize: '1.5rem' }} className="text-primary">📚</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="col-md-3">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-start">
                <div>
                  <h6 className="card-title text-muted mb-2">Total Users</h6>
                  <h3 className="fw-bold text-info">{stats.totalUsers}</h3>
                  <small className="text-muted">Employees + Managers + HRs</small>
                </div>
                <div className="bg-info bg-opacity-10 p-3 rounded">
                  <span style={{ fontSize: '1.5rem' }} className="text-info">👥</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="col-md-3">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-start">
                <div>
                  <h6 className="card-title text-muted mb-2">Total Employees</h6>
                  <h3 className="fw-bold text-success">{stats.totalEmployees}</h3>
                  <small className="text-muted">Active employees</small>
                </div>
                <div className="bg-success bg-opacity-10 p-3 rounded">
                  <span style={{ fontSize: '1.5rem' }} className="text-success">💼</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="col-md-3">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-start">
                <div>
                  <h6 className="card-title text-muted mb-2">Total Managers</h6>
                  <h3 className="fw-bold text-warning">{stats.totalManagers}</h3>
                  <small className="text-muted">Team leaders</small>
                </div>
                <div className="bg-warning bg-opacity-10 p-3 rounded">
                  <span style={{ fontSize: '1.5rem' }} className="text-warning">👨‍💼</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards - Row 2 */}
      <div className="row mb-4">
        <div className="col-md-3">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-start">
                <div>
                  <h6 className="card-title text-muted mb-2">Completed</h6>
                  <h3 className="fw-bold text-secondary">{stats.completedCourses}</h3>
                  <small className="text-muted">Finished courses</small>
                </div>
                <div className="bg-secondary bg-opacity-10 p-3 rounded">
                  <span style={{ fontSize: '1.5rem' }} className="text-secondary">✅</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="col-md-3">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-start">
                <div>
                  <h6 className="card-title text-muted mb-2">Pending Approvals</h6>
                  <h3 className="fw-bold text-danger">{stats.pendingApprovals}</h3>
                  <small className="text-muted">Awaiting review</small>
                </div>
                <div className="bg-danger bg-opacity-10 p-3 rounded">
                  <span style={{ fontSize: '1.5rem' }} className="text-danger">⏳</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="col-md-3">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-start">
                <div>
                  <h6 className="card-title text-muted mb-2">Active Enrollments</h6>
                  <h3 className="fw-bold" style={{ color: '#6f42c1' }}>{stats.activeEnrollments}</h3>
                  <small className="text-muted">Currently learning</small>
                </div>
                <div className="p-3 rounded" style={{ backgroundColor: '#6f42c1', opacity: '0.1' }}>
                  <span style={{ fontSize: '1.5rem', color: '#6f42c1' }}>📈</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="col-md-3">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-start">
                <div>
                  <h6 className="card-title text-muted mb-2">Total Feedbacks</h6>
                  <h3 className="fw-bold" style={{ color: '#20c997' }}>{stats.totalFeedbacks}</h3>
                  <small className="text-muted">User feedback received</small>
                </div>
                <div className="p-3 rounded" style={{ backgroundColor: '#20c997', opacity: '0.1' }}>
                  <span style={{ fontSize: '1.5rem', color: '#20c997' }}>💬</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards - Row 3 */}
      <div className="row mb-4">
        <div className="col-md-3">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-start">
                <div>
                  <h6 className="card-title text-muted mb-2">Total Departments</h6>
                  <h3 className="fw-bold text-primary">{stats.totalDepartments}</h3>
                  <small className="text-muted">Available in platform</small>
                </div>
                <div className="bg-primary bg-opacity-10 p-3 rounded">
                  <span style={{ fontSize: '1.5rem' }} className="text-primary">🏢</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="col-md-3">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-start">
                <div>
                  <h6 className="card-title text-muted mb-2">Monthly Payroll</h6>
                  <h3 className="fw-bold text-success">₹{monthlyPayroll.toLocaleString()}</h3>
                  <small className="text-muted">Current month payroll</small>
                </div>
                <div className="bg-success bg-opacity-10 p-3 rounded">
                  <span style={{ fontSize: '1.5rem' }} className="text-success">💰</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="col-md-3">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-start">
                <div>
                  <h6 className="card-title text-muted mb-2">Pending Leaves</h6>
                  <h3 className="fw-bold text-warning">{pendingLeaves}</h3>
                  <small className="text-muted">Awaiting approval</small>
                </div>
                <div className="bg-warning bg-opacity-10 p-3 rounded">
                  <span style={{ fontSize: '1.5rem' }} className="text-warning">📋</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="col-md-3">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-start">
                <div>
                  <h6 className="card-title text-muted mb-2">Total Payslips</h6>
                  <h3 className="fw-bold text-info">{payslipCount}</h3>
                  <small className="text-muted">Generated payslips</small>
                </div>
                <div className="bg-info bg-opacity-10 p-3 rounded">
                  <span style={{ fontSize: '1.5rem' }} className="text-info">📄</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards - Row 4 */}
      <div className="row mb-4">
        <div className="col-md-3">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-start">
                <div>
                  <h6 className="card-title text-muted mb-2">Present Today</h6>
                  <h3 className="fw-bold text-success">{attendanceSummary.present}</h3>
                  <small className="text-muted">Employees present</small>
                </div>
                <div className="bg-success bg-opacity-10 p-3 rounded">
                  <span style={{ fontSize: '1.5rem' }} className="text-success">✅</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="col-md-3">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-start">
                <div>
                  <h6 className="card-title text-muted mb-2">Absent Today</h6>
                  <h3 className="fw-bold text-warning">{attendanceSummary.absent}</h3>
                  <small className="text-muted">Employees absent</small>
                </div>
                <div className="bg-warning bg-opacity-10 p-3 rounded">
                  <span style={{ fontSize: '1.5rem' }} className="text-warning">❌</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="col-md-3">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-start">
                <div>
                  <h6 className="card-title text-muted mb-2">Attendance Rate</h6>
                  <h3 className="fw-bold text-primary">
                    {attendanceSummary.present + attendanceSummary.absent > 0 
                      ? `${Math.round((attendanceSummary.present / (attendanceSummary.present + attendanceSummary.absent)) * 100)}%`
                      : "0%"}
                  </h3>
                  <small className="text-muted">Today's attendance</small>
                </div>
                <div className="bg-primary bg-opacity-10 p-3 rounded">
                  <span style={{ fontSize: '1.5rem' }} className="text-primary">📊</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions - Single Section with 10 Actions */}
      <div className="row mb-4">
        <div className="col-12">
          <div className="card shadow-sm">
            <div className="card-header bg-white border-0 py-3">
              <h5 className="mb-0 fw-bold text-dark">🚀 Quick Actions</h5>
              <p className="text-muted mb-0">Quick access to frequently used features</p>
            </div>
            <div className="card-body">
              <div className="row g-2">
                <div className="col-xl-2 col-md-3 col-sm-4 col-6">
                  <a href="/course-management" className="btn btn-outline-primary w-100 py-2">
                    ➕ Create Course
                  </a>
                </div>
                <div className="col-xl-2 col-md-3 col-sm-4 col-6">
                  <a href="/user-management" className="btn btn-outline-primary w-100 py-2">
                    👥 Manage Users
                  </a>
                </div>
                <div className="col-xl-2 col-md-3 col-sm-4 col-6">
                  <a href="/course-approvals" className="btn btn-outline-primary w-100 py-2">
                    ⏳ Review Approvals
                  </a>
                </div>
                <div className="col-xl-2 col-md-3 col-sm-4 col-6">
                  <a href="/study-materials" className="btn btn-outline-primary w-100 py-2">
                    📖 Study Materials
                  </a>
                </div>
                <div className="col-xl-2 col-md-3 col-sm-4 col-6">
                  <a href="/reports" className="btn btn-outline-primary w-100 py-2">
                    📊 View Reports
                  </a>
                </div>
                <div className="col-xl-2 col-md-3 col-sm-4 col-6">
                  <a href="/user-courses" className="btn btn-outline-primary w-100 py-2">
                    📈 User Progress
                  </a>
                </div>
                
                <div className="col-xl-2 col-md-3 col-sm-4 col-6">
                  <a href="/leave-management" className="btn btn-outline-warning w-100 py-2">
                    📅 Leave Management
                  </a>
                </div>
                <div className="col-xl-2 col-md-3 col-sm-4 col-6">
                  <a href="/attendance" className="btn btn-outline-info w-100 py-2">
                    ✅ Attendance
                  </a>
                </div>
                <div className="col-xl-2 col-md-3 col-sm-4 col-6">
                  <a href="/payroll" className="btn btn-outline-danger w-100 py-2">
                    💰 Payroll
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}