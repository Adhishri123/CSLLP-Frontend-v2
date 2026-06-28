import React, { useEffect, useState, useContext } from "react";
import axiosInstance from "../apis/axiosConfig";
import StatCard from "../components/StatCard";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";

const HrDashboard = () => {
  const { user } = useContext(AuthContext);
  const [employeeCount, setEmployeeCount] = useState(0);
  const [monthlyPayroll, setMonthlyPayroll] = useState(0);
  const [pendingLeaves, setPendingLeaves] = useState(0);
  const [payslipCount, setPayslipCount] = useState(0);
  const [attendanceSummary, setAttendanceSummary] = useState({
    present: 0,
    absent: 0
  });
  const [loading, setLoading] = useState(true);
  const [showWelcomeAlert, setShowWelcomeAlert] = useState(true);

  const navigate = useNavigate();

  // Fetch Total Employees
  useEffect(() => {
    const fetchEmployeeCount = async () => {
      try {
        const response = await axiosInstance.get("http://localhost:8088/api/employees/count");
        const count = typeof response.data === "object" ? response.data.count : response.data;
        setEmployeeCount(count);
      } catch (error) {
        console.error("Error fetching employee count:", error.response || error);
        if (error.response?.status === 401) {
          navigate("/login");
        }
      }
    };
    
    fetchEmployeeCount();
  }, [navigate]);

  // Fetch Monthly Payroll
  useEffect(() => {
    const fetchMonthlyPayroll = async () => {
      try {
        const now = new Date();
        const month = now.getMonth() + 1;
        const year = now.getFullYear();

        const response = await axiosInstance.get(
          `http://localhost:8092/api/payroll/total-payroll?month=${month}&year=${year}`
        );
        const total = typeof response.data === "object" ? response.data.totalPayroll : response.data;
        setMonthlyPayroll(total || 0);
      } catch (error) {
        console.error("Error fetching monthly payroll:", error.response || error);
        setMonthlyPayroll(0);
      }
    };
    
    fetchMonthlyPayroll();
  }, []);

  // Fetch Pending Leaves Count
  useEffect(() => {
    const fetchPendingLeaves = async () => {
      try {
        const response = await axiosInstance.get("http://localhost:8093/api/leaves/pending/count");
        const count = typeof response.data === "object" ? response.data.count : response.data;
        setPendingLeaves(count || 0);
      } catch (error) {
        console.error("Error fetching pending leaves count:", error.response || error);
        setPendingLeaves(0);
      }
    };
    
    fetchPendingLeaves();
  }, []);

  // Fetch Total Payslip Count
  useEffect(() => {
    const fetchPayslipCount = async () => {
      try {
        const response = await axiosInstance.get("http://localhost:8092/api/payroll/payslip/count");
        const count = typeof response.data === "object" ? response.data.count : response.data;
        setPayslipCount(count || 0);
      } catch (error) {
        console.error("Error fetching payslip count:", error.response || error);
        setPayslipCount(0);
      }
    };
    
    fetchPayslipCount();
  }, []);

  // Fetch Attendance Summary
  useEffect(() => {
    const fetchAttendanceSummary = async () => {
      try {
        const today = new Date();
        const dateString = today.toISOString().split("T")[0];

        const response = await axiosInstance.get(
          `http://localhost:8094/api/attendance/present-absent-summary?date=${dateString}`
        );
        
        console.log("Attendance API Response:", response.data);

        const data = response.data;
        setAttendanceSummary({
          present: data.totalPresent ?? data.present ?? 0,
          absent: data.totalAbsent ?? data.absent ?? 0,
        });
      } catch (error) {
        console.error("Error fetching attendance summary:", error.response || error);
        setAttendanceSummary({ present: 0, absent: 0 });
      } finally {
        setLoading(false);
      }
    };
    
    fetchAttendanceSummary();
  }, []);

  //  Quick Actions Handlers
  const handleQuickAction = (action) => {
    switch (action) {
      case 'user-management':
        navigate('/user-management');
        break;
      case 'leave-requests':
        navigate('/leaves', { state: { activeTab: 'myrequests' } });
        break;
      case 'attendance':
        navigate('/attendance');
        break;
      case 'payslips':
        navigate('/payroll', { state: { activeTab: 'Payslips' } });
        break;
     
    }
  };

  // Show loading spinner
  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center vh-100">
        <div className="text-center">
          <div className="spinner-border text-primary" role="status" style={{ width: "3rem", height: "3rem" }}>
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-3 text-muted">Loading HR dashboard data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container-fluid">
      {/* Header Section */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="mb-1 fw-bold">📊 HR Dashboard</h2>
          <small className="text-muted fs-4">
            Overview of HR metrics and activities
          </small>
        </div>
      </div>

      {/* Welcome Banner */}
      {user && showWelcomeAlert && (
        <div className="alert alert-info alert-dismissible fade show mb-4" role="alert">
          <strong>Welcome back, {user.name || user.email}! 👋</strong> Here's your HR dashboard overview.
          <button 
            type="button" 
            className="btn-close" 
            data-bs-dismiss="alert"
            onClick={() => setShowWelcomeAlert(false)}
          ></button>
        </div>
      )}

      {/* Stats Cards - 8 Cards */}
      <div className="stats-grid mb-4" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem'}}>

        {/* Card 1: Total Users */}
        <div className="card border-0 shadow-sm h-100">
          <div className="card-body">
            <div className="d-flex justify-content-between align-items-start">
              <div>
                <h6 className="card-title text-muted mb-2">Total Users</h6>
                <h3 className="fw-bold text-primary">{employeeCount}</h3>
                <small className="text-muted">Active users</small>
              </div>
              <div className="bg-primary bg-opacity-10 p-3 rounded">
                <span style={{ fontSize: '1.5rem' }} className="text-primary">👥</span>
              </div>
            </div>
          </div>
        </div>
        
        {/* Card 2: Monthly Payroll */}
        <div className="card border-0 shadow-sm h-100">
          <div className="card-body">
            <div className="d-flex justify-content-between align-items-start">
              <div>
                <h6 className="card-title text-muted mb-2">Monthly Payroll</h6>
                <h3 className="fw-bold text-success">₹{monthlyPayroll.toLocaleString()}</h3>
                <small className="text-muted">Current month</small>
              </div>
              <div className="bg-success bg-opacity-10 p-3 rounded">
                <span style={{ fontSize: '1.5rem' }} className="text-success">💰</span>
              </div>
            </div>
          </div>
        </div>
        
        {/* Card 3: Pending Leaves */}
        <div className="card border-0 shadow-sm h-100">
          <div className="card-body">
            <div className="d-flex justify-content-between align-items-start">
              <div>
                <h6 className="card-title text-muted mb-2">Pending Leaves</h6>
                <h3 className="fw-bold text-warning">{pendingLeaves}</h3>
                <small className="text-muted">Awaiting approval</small>
              </div>
              <div className="bg-warning bg-opacity-10 p-3 rounded">
                <span style={{ fontSize: '1.5rem' }} className="text-warning">📅</span>
              </div>
            </div>
          </div>
        </div>

        {/* Card 4: Total Payslips */}
        <div className="card border-0 shadow-sm h-100">
          <div className="card-body">
            <div className="d-flex justify-content-between align-items-start">
              <div>
                <h6 className="card-title text-muted mb-2">Total Payslips</h6>
                <h3 className="fw-bold text-info">{payslipCount}</h3>
                <small className="text-muted">Generated this month</small>
              </div>
              <div className="bg-info bg-opacity-10 p-3 rounded">
                <span style={{ fontSize: '1.5rem' }} className="text-info">📄</span>
              </div>
            </div>
          </div>
        </div>
        
        {/* Card 5: Present Today */}
        <div className="card border-0 shadow-sm h-100">
          <div className="card-body">
            <div className="d-flex justify-content-between align-items-start">
              <div>
                <h6 className="card-title text-muted mb-2">Present Today</h6>
                <h3 className="fw-bold text-success">{attendanceSummary.present}</h3>
                <small className="text-muted">Today's attendance</small>
              </div>
              <div className="bg-success bg-opacity-10 p-3 rounded">
                <span style={{ fontSize: '1.5rem' }} className="text-success">✅</span>
              </div>
            </div>
          </div>
        </div>
        
        {/* Card 6: Absent Today */}
        <div className="card border-0 shadow-sm h-100">
          <div className="card-body">
            <div className="d-flex justify-content-between align-items-start">
              <div>
                <h6 className="card-title text-muted mb-2">Absent Today</h6>
                <h3 className="fw-bold text-danger">{attendanceSummary.absent}</h3>
                <small className="text-muted">Today's absentees</small>
              </div>
              <div className="bg-danger bg-opacity-10 p-3 rounded">
                <span style={{ fontSize: '1.5rem' }} className="text-danger">❌</span>
              </div>
            </div>
          </div>
        </div>

        {/* Card 7: Attendance Rate */}
        <div className="card border-0 shadow-sm h-100">
          <div className="card-body">
            <div className="d-flex justify-content-between align-items-start">
              <div>
                <h6 className="card-title text-muted mb-2">Attendance Rate</h6>
                <h3 className="fw-bold text-purple">
                  {attendanceSummary.present + attendanceSummary.absent > 0 
                    ? `${Math.round((attendanceSummary.present / (attendanceSummary.present + attendanceSummary.absent)) * 100)}%`
                    : "0%"}
                </h3>
                <small className="text-muted">Today's rate</small>
              </div>
              <div className="bg-purple bg-opacity-10 p-3 rounded">
                <span style={{ fontSize: '1.5rem' }} className="text-purple">📈</span>
              </div>
            </div>
          </div>
        </div>

        {/* Card 8: Departments */}
        <div className="card border-0 shadow-sm h-100">
          <div className="card-body">
            <div className="d-flex justify-content-between align-items-start">
              <div>
                <h6 className="card-title text-muted mb-2">Departments</h6>
                <h3 className="fw-bold text-secondary">5</h3>
                <small className="text-muted">Total departments</small>
              </div>
              <div className="bg-secondary bg-opacity-10 p-3 rounded">
                <span style={{ fontSize: '1.5rem' }} className="text-secondary">🏢</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions Section
      <div className="row mb-4">
        <div className="col-12">
          <div className="card border-0 shadow-sm">
            <div className="card-header bg-light border-0">
              <h5 className="card-title mb-0">🚀 Quick Actions</h5>
              <small className="text-muted">Quick access to frequently used HR features</small>
            </div>
            <div className="card-body">
              <div className="row g-2">
                <div className="col-xl-2 col-md-3 col-sm-4 col-6">
                  <button 
                    className="btn btn-outline-primary w-100"
                    onClick={() => handleQuickAction('employees')}
                    >
                      👥 Users Management
                  </button>
                </div>
                <div className="col-xl-2 col-md-3 col-sm-4 col-6">
                  <button 
                    className="btn btn-outline-success w-100"
                    onClick={() => handleQuickAction('leave-Management')}
                  >
                  
                    
                    📋 Leave Management

                  </button>
                </div>
                <div className="col-xl-2 col-md-3 col-sm-4 col-6">
                  <button 
                    className="btn btn-outline-warning w-100"
                    onClick={() => handleQuickAction('attendance')}
                  >
                    📊 Attendance
                  </button>
                </div>
                <div className="col-xl-2 col-md-3 col-sm-4 col-6">
                  <button 
                    className="btn btn-outline-info w-100"
                    onClick={() => handleQuickAction('payslips')}
                  >
                    💳 Payslips
                  </button>
                </div>
                <div className="col-xl-2 col-md-3 col-sm-4 col-6">
                  <button 
                    className="btn btn-outline-secondary w-100"
                    onClick={() => handleQuickAction('departments')}
                  >
                   */}
      {/* Quick Actions Section - 4 Cards in One Row */}
      <div className="row mb-4">
        <div className="col-12">
          <div className="card border-0 shadow-sm">
            <div className="card-header bg-light border-0">
              <h5 className="card-title mb-0">🚀 Quick Actions</h5>
              <small className="text-muted">Quick access to frequently used HR features</small>
            </div>
            <div className="card-body">
              <div className="row g-3">
              {/* Card 1: User Management */}
                <div className="col-md-3">
                  <div className="card border-0 bg-light h-100 quick-action-card">
                    <div className="card-body text-center p-4">
                      <div className="mb-3">
                        <i className="fas fa-users fa-2x text-primary"></i>
                      </div>
                      <h6 className="fw-bold text-dark">Users Management</h6>
                      <p className="text-muted small mb-3">Manage user data and records</p>
                      <button 
                        className="btn btn-outline-primary btn-sm w-100"
                        onClick={() => handleQuickAction('user-management')}
                      > 
                     Users Management
                      </button>
                    </div>
                  </div>
                </div>

                {/* Card 2: Leave Management */}
                <div className="col-md-3">
                  <div className="card border-0 bg-light h-100 quick-action-card">
                    <div className="card-body text-center p-4">
                      <div className="mb-3">
                        <i className="fas fa-calendar-alt fa-2x text-success"></i>
                      </div>
                      <h6 className="fw-bold text-dark">Leave Management</h6>
                      <p className="text-muted small mb-3">Manage leave requests</p>
                      <button 
                        className="btn btn-outline-success btn-sm w-100"
                        onClick={() => handleQuickAction('leave-requests')}
                      >
                        View Requests
                      </button>
                    </div>
                  </div>
                </div>

                {/* Card 3: Attendance */}
                <div className="col-md-3">
                  <div className="card border-0 bg-light h-100 quick-action-card">
                    <div className="card-body text-center p-4">
                      <div className="mb-3">
                        <i className="fas fa-clipboard-check fa-2x text-warning"></i>
                      </div>
                      <h6 className="fw-bold text-dark">Attendance</h6>
                      <p className="text-muted small mb-3">View and manage attendance</p>
                      <button 
                        className="btn btn-outline-warning btn-sm w-100"
                        onClick={() => handleQuickAction('attendance')}
                      >
                        View Attendance
                      </button>
                    </div>
                  </div>
                </div>

                {/* Card 4: Payroll */}
                <div className="col-md-3">
                  <div className="card border-0 bg-light h-100 quick-action-card">
                    <div className="card-body text-center p-4">
                      <div className="mb-3">
                        <i className="fas fa-file-invoice-dollar fa-2x text-danger"></i>
                      </div>
                      <h6 className="fw-bold text-dark">Payroll</h6>
                      <p className="text-muted small mb-3">Manage payroll and payslips</p>
                      <button 
                        className="btn btn-outline-danger btn-sm w-100"
                        onClick={() => handleQuickAction('payslips')}
                      >
                        View Payslips
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
                 {/* </div> </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div> */}

      {/* //Recent Activity Section
      <div className="row">
        <div className="col-md-6">
          <div className="card border-0 shadow-sm">
            <div className="card-header bg-light border-0">
              <h5 className="card-title mb-0">📋 Recent Activity</h5>
            </div>
            <div className="card-body">
              <ul className="list-unstyled">
                <li className="py-2 border-bottom">
                  <div className="d-flex justify-content-between">
                    <span>📝 New leave request from John Doe</span>
                    <small className="text-muted">2 min ago</small>
                  </div>
                </li>
                <li className="py-2 border-bottom">
                  <div className="d-flex justify-content-between">
                    <span>✅ Employee attendance marked for 50 employees</span>
                    <small className="text-muted">1 hour ago</small>
                  </div>
                </li>
                <li className="py-2 border-bottom">
                  <div className="d-flex justify-content-between">
                    <span>💰 Monthly payroll processed for May 2024</span>
                    <small className="text-muted">3 hours ago</small>
                  </div>
                </li>
                <li className="py-2">
                  <div className="d-flex justify-content-between">
                    <span>📄 5 new payslips generated</span>
                    <small className="text-muted">5 hours ago</small>
                  </div>
                </li>
              </ul>
            </div>
          </div>
        </div>

        <div className="col-md-6">
          <div className="card border-0 shadow-sm">
            <div className="card-header bg-light border-0">
              <h5 className="card-title mb-0">⚡ Quick Stats</h5>
            </div>
            <div className="card-body">
              <div className="row g-3">
                <div className="col-6">
                  <div className="p-3 bg-light rounded">
                    <h6 className="text-muted mb-1">Leaves Used</h6>
                    <h4 className="mb-0">23</h4>
                    <small className="text-muted">This month</small>
                  </div>
                </div>
                <div className="col-6">
                  <div className="p-3 bg-light rounded">
                    <h6 className="text-muted mb-1">New Hires</h6>
                    <h4 className="mb-0">4</h4>
                    <small className="text-muted">This month</small>
                  </div>
                </div>
                <div className="col-6">
                  <div className="p-3 bg-light rounded">
                    <h6 className="text-muted mb-1">Training Hours</h6>
                    <h4 className="mb-0">120</h4>
                    <small className="text-muted">This month</small>
                  </div>
                </div>
                <div className="col-6">
                  <div className="p-3 bg-light rounded">
                    <h6 className="text-muted mb-1">Reviews Due</h6>
                    <h4 className="mb-0">8</h4>
                    <small className="text-muted">This week</small>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div> */}

      {/* Custom CSS for colors */}
      <style>
        {`
          .text-purple {
            color: #6f42c1 !important;
          }
          .bg-purple {
            background-color: #6f42c1 !important;
          }
          .quick-action-card {
            transition: all 0.3s ease;
            cursor: pointer;
          }
          .quick-action-card:hover {
            transform: translateY(-5px);
            box-shadow: 0 8px 25px rgba(0,0,0,0.15);
          }
        `}
      </style>
    </div>
  );
};

export default HrDashboard;