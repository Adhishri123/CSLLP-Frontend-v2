import React, { useState, useEffect, useMemo } from 'react';
import { 
  getAnalytics, 
  getAllResults, 
  getExams, 
  getUsers, 
  getEmployeeResults,
  getManagerTeamEmployees,
  getPendingExamsCount,
  getTotalEmployeesCount
} from '../services/api';
import './Reports.css';

export default function Reports({ user }) {
  const [analytics, setAnalytics] = useState([]);
  const [allResults, setAllResults] = useState([]);
  const [exams, setExams] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [myResults, setMyResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState({});
  const [metricsLoading, setMetricsLoading] = useState(true);
  
  // ✅ SIMPLE SEARCH INSTEAD OF COMPLEX FILTERS
  const [searchTerm, setSearchTerm] = useState('');
  const [activeView, setActiveView] = useState('results');

  // Role-based configuration
  const roleConfig = {
    ADMIN: {
      title: "Admin Analytics Dashboard",
      subtitle: "Full analytics & management access",
      metrics: ['totalEmployees', 'totalExams', 'totalAttempts', 'pendingExams', 'averageScore'],
      searchPlaceholder: "Search by employee name, exam, course, email...",
      showAnalytics: true
    },
    MANAGER: {
      title: "Team Performance Dashboard", 
      subtitle: "Team performance insights",
      metrics: ['teamEmployees', 'teamExams', 'teamAttempts', 'teamPending', 'teamAverage'],
      searchPlaceholder: "Search by team member, exam, course, status...",
      showAnalytics: true
    },
    HR: {
      title: "HR Compliance Dashboard",
      subtitle: "Employee progress & compliance reports", 
      metrics: ['completionRate', 'avgScores', 'employeesPending', 'complianceScore'],
      searchPlaceholder: "Search by employee, course, email, status...",
      showAnalytics: true
    },
    EMPLOYEE: {
      title: "My Performance Dashboard",
      subtitle: "Your personal performance dashboard",
      metrics: ['myExamsTaken', 'myAverageScore', 'myPendingExams', 'myInProgressExams', 'myBestScore'],
      searchPlaceholder: "Search by exam, course, status, grade...",
      showAnalytics: false  // ✅ No analytics for employees
    }
  };

  const config = roleConfig[user.role] || roleConfig.EMPLOYEE;

  useEffect(() => {
    fetchReportData();
  }, []);

  useEffect(() => {
    if (!loading) {
      calculateMetrics();
    }
  }, [loading, employees, allResults, exams, myResults]);

  const fetchReportData = async () => {
    setLoading(true);
    setMetricsLoading(true);
    try {
      const basePromises = [getExams()];
      
      if (user.role === 'ADMIN' || user.role === 'HR') {
        basePromises.push(getAnalytics(), getAllResults(), getUsers());
      } 
      else if (user.role === 'MANAGER') {
        basePromises.push(getAnalytics(), getAllResults(), getManagerTeamEmployees(user.id));
      }
      else {
        basePromises.push(getEmployeeResults(user.id));
      }

      const [examsData, ...otherData] = await Promise.all(basePromises);

      setExams(examsData?.data || examsData || []);
      
      if (user.role === 'EMPLOYEE') {
        setMyResults(otherData[0]?.data || otherData[0] || []);
        setEmployees([]);
      } else {
        setAnalytics(otherData[0]?.data || otherData[0] || []);
        setAllResults(otherData[1]?.data || otherData[1] || []);
        
        const usersData = otherData[2];
        if (usersData) {
          const employeesData = usersData.data || usersData.body?.data || usersData;
          if (Array.isArray(employeesData)) {
            const filteredEmployees = employeesData.filter(u => 
              user.role === 'MANAGER' ? u.role === 'EMPLOYEE' : true
            );
            setEmployees(filteredEmployees);
          } else {
            setEmployees([]);
          }
        } else {
          setEmployees([]);
        }
      }
    } catch (error) {
      console.error('Error fetching report data:', error);
      setEmployees([]);
      setAllResults([]);
      setAnalytics([]);
      setMyResults([]);
    } finally {
      setLoading(false);
    }
  };

  const calculateMetrics = async () => {
    setMetricsLoading(true);
    const newMetrics = {};

    try {
      if (user.role === 'ADMIN') {
        try {
          const countResponse = await getTotalEmployeesCount();
          newMetrics.totalEmployees = countResponse.data || 0;
        } catch (error) {
          console.error('Error fetching employee count:', error);
          newMetrics.totalEmployees = employees.length;
        }

        newMetrics.totalExams = exams.length;
        newMetrics.totalAttempts = allResults.length;
        newMetrics.completed = allResults.filter(r => r.status === 'COMPLETED').length;
        
        let totalPendingExams = 0;
        try {
          for (const emp of employees) {
            const pendingResponse = await getPendingExamsCount(emp.id);
            totalPendingExams += pendingResponse.data || 0;
          }
        } catch (error) {
          console.error('Error fetching pending exams:', error);
          totalPendingExams = 0;
        }
        newMetrics.pendingExams = totalPendingExams;
        
        newMetrics.averageScore = allResults.length > 0 
          ? allResults.reduce((sum, result) => sum + (result.percentage || 0), 0) / allResults.length 
          : 0;
      } 
      else if (user.role === 'MANAGER') {
        const teamEmployees = employees;
        const teamEmployeeIds = teamEmployees.map(e => e.id);
        const teamResults = allResults.filter(r => teamEmployeeIds.includes(r.employeeId));
        
        newMetrics.teamEmployees = teamEmployees.length;
        newMetrics.teamExams = [...new Set(teamResults.map(r => r.examId))].length;
        newMetrics.teamAttempts = teamResults.length;
        newMetrics.teamCompleted = teamResults.filter(r => r.status === 'COMPLETED').length;
        newMetrics.teamAverage = teamResults.length > 0 
          ? teamResults.reduce((sum, result) => sum + (result.percentage || 0), 0) / teamResults.length 
          : 0;
        
        let teamPendingCount = 0;
        try {
          for (const emp of teamEmployees) {
            const pendingResponse = await getPendingExamsCount(emp.id);
            teamPendingCount += pendingResponse.data || 0;
          }
        } catch (error) {
          console.error('Error fetching team pending exams:', error);
          teamPendingCount = 0;
        }
        newMetrics.teamPending = teamPendingCount;
      }
      else if (user.role === 'HR') {
        const totalEmployees = employees.length;
        const completedResults = allResults.filter(r => r.status === 'COMPLETED');
        const employeesWithAttempts = [...new Set(allResults.map(r => r.employeeId))].length;
        
        newMetrics.completionRate = totalEmployees > 0 ? (employeesWithAttempts / totalEmployees) * 100 : 0;
        newMetrics.avgScores = completedResults.length > 0 
          ? completedResults.reduce((sum, result) => sum + (result.percentage || 0), 0) / completedResults.length 
          : 0;
        
        let employeesPendingCount = 0;
        try {
          for (const emp of employees) {
            const pendingResponse = await getPendingExamsCount(emp.id);
            if (pendingResponse.data > 0) {
              employeesPendingCount++;
            }
          }
        } catch (error) {
          console.error('Error fetching HR pending exams:', error);
          employeesPendingCount = 0;
        }
        newMetrics.employeesPending = employeesPendingCount;
        newMetrics.complianceScore = 85;
      }
      else {
        const completedResults = myResults.filter(r => r.status === 'COMPLETED');
        const inProgressResults = myResults.filter(r => r.status === 'IN_PROGRESS');
        
        let pendingCoursesCount = 0;
        try {
          const pendingResponse = await getPendingExamsCount(user.id);
          pendingCoursesCount = pendingResponse.data || 0;
        } catch (error) {
          console.error('Error fetching pending courses for employee:', error);
          pendingCoursesCount = 0;
        }
        
        newMetrics.myExamsTaken = myResults.length;
        newMetrics.myAverageScore = completedResults.length > 0 
          ? completedResults.reduce((sum, result) => sum + (result.percentage || 0), 0) / completedResults.length 
          : 0;
        newMetrics.myPendingExams = pendingCoursesCount;
        newMetrics.myInProgressExams = inProgressResults.length;
        newMetrics.myBestScore = completedResults.length > 0 
          ? Math.max(...completedResults.map(r => r.percentage || 0)) 
          : 0;
      }
    } catch (error) {
      console.error('Error calculating metrics:', error);
    } finally {
      setMetrics(newMetrics);
      setMetricsLoading(false);
    }
  };

  // ✅ SIMPLE SEARCH FUNCTIONALITY
  const filteredResults = useMemo(() => {
    if (!searchTerm.trim()) {
      return user.role === 'EMPLOYEE' ? myResults : allResults;
    }

    const term = searchTerm.toLowerCase().trim();
    
    if (user.role === 'EMPLOYEE') {
      return myResults.filter(result => 
        (result.examTitle && result.examTitle.toLowerCase().includes(term)) ||
        (result.courseName && result.courseName.toLowerCase().includes(term)) ||
        (result.status && result.status.toLowerCase().includes(term)) ||
        (result.grade && result.grade.toLowerCase().includes(term)) ||
        (result.percentage && result.percentage.toString().includes(term))
      );
    } else {
      return allResults.filter(result => 
        (result.employeeName && result.employeeName.toLowerCase().includes(term)) ||
        (result.examTitle && result.examTitle.toLowerCase().includes(term)) ||
        (result.courseName && result.courseName.toLowerCase().includes(term)) ||
        (result.status && result.status.toLowerCase().includes(term)) ||
        (result.employeeEmail && result.employeeEmail.toLowerCase().includes(term)) ||
        (result.percentage && result.percentage.toString().includes(term)) ||
        (result.employeeId && result.employeeId.toString().includes(term))
      );
    }
  }, [searchTerm, allResults, myResults, user.role]);

  const filteredEmployees = useMemo(() => {
    if (!searchTerm.trim()) return employees;
    
    const term = searchTerm.toLowerCase().trim();
    return employees.filter(employee => 
      // (employee.firstName && employee.firstName.toLowerCase().includes(term)) ||
      // (employee.lastName && employee.lastName.toLowerCase().includes(term)) ||
      (employee.fullName && employee.fullName.toLowerCase().includes(term)) ||
      (employee.email && employee.email.toLowerCase().includes(term)) ||
      (employee.name && employee.name.toLowerCase().includes(term)) ||
      (employee.id && employee.id.toString().includes(term))
    );
  }, [searchTerm, employees]);

  const filteredAnalytics = useMemo(() => {
    if (!searchTerm.trim()) return analytics;
    
    const term = searchTerm.toLowerCase().trim();
    return analytics.filter(item => 
      Object.values(item).some(value => 
        value && value.toString().toLowerCase().includes(term)
      )
    );
  }, [searchTerm, analytics]);

  if (loading) {
    return (
      <div className="reports-container">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Loading comprehensive reports...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="reports-container">
      {/* Header Section */}
      <div className="reports-header">
        <div className="header-content">
          <div className="role-badge">{user.role}</div>
          <h1 className="reports-title">{config.title}</h1>
          <p className="reports-subtitle">{config.subtitle}</p>
        </div>
        <div className="header-actions">
          <div className="view-switcher">
            <button
              className={`view-btn ${activeView === 'results' ? 'active' : ''}`}
              onClick={() => setActiveView('results')}
            >
              <span className="btn-icon">📋</span>
              <span className="btn-text">Results</span>
            </button>
            
            {/* ✅ CONDITIONAL ANALYTICS TAB - Only show for non-employee roles */}
            {config.showAnalytics && (
              <button
                className={`view-btn ${activeView === 'analytics' ? 'active' : ''}`}
                onClick={() => setActiveView('analytics')}
              >
                <span className="btn-icon">📈</span>
                <span className="btn-text">Analytics</span>
              </button>
            )}
            
            <button
              className={`view-btn ${activeView === 'export' ? 'active' : ''}`}
              onClick={() => setActiveView('export')}
            >
              <span className="btn-icon">💾</span>
              <span className="btn-text">Export</span>
            </button>
          </div>
        </div>
      </div>

      {/* Role-based Metrics Cards */}
      {metricsLoading ? (
        <div className="metrics-loading">
          <div className="loading-spinner small">
            <div className="spinner"></div>
            <p>Calculating metrics...</p>
          </div>
        </div>
      ) : (
        <div className="metrics-grid">
          {user.role === 'ADMIN' && (
            <>
              <MetricCard
                icon="👥"
                value={metrics.totalEmployees || 0}
                label="Total Employees"
                trend="Active workforce"
                type="primary"
              />
              <MetricCard
                icon="📝"
                value={metrics.totalExams || 0}
                label="Total Exams"
                trend="Active assessments"
                type="primary"
              />
              <MetricCard
                icon="🎯"
                value={metrics.totalAttempts || 0}
                label="Total Attempts"
                trend={`${metrics.completed || 0} completed`}
                type="success"
              />
              <MetricCard
                icon="⏳"
                value={metrics.pendingExams || 0}
                label="Pending Course Completions"
                trend="Courses with exams not completed yet"
                type="warning"
              />
              <MetricCard
                icon="📈"
                value={(metrics.averageScore || 0).toFixed(1)}
                label="Average Score"
                trend="Overall performance"
                type="info"
                isPercentage
              />
            </>
          )}

          {user.role === 'MANAGER' && (
            <>
              <MetricCard
                icon="👥"
                value={metrics.teamEmployees || 0}
                label="Team Employees"
                trend="Your team members"
                type="primary"
              />
              <MetricCard
                icon="📝"
                value={metrics.teamExams || 0}
                label="Team Exams"
                trend="Assigned to team"
                type="primary"
              />
              <MetricCard
                icon="🎯"
                value={metrics.teamAttempts || 0}
                label="Team Attempts"
                trend={`${metrics.teamCompleted || 0} completed`}
                type="success"
              />
              <MetricCard
                icon="⏳"
                value={metrics.teamPending || 0}
                label="Pending Course Completions"
                trend="Courses with exams not completed yet"
                type="warning"
              />
              <MetricCard
                icon="📈"
                value={(metrics.teamAverage || 0).toFixed(1)}
                label="Team Average Score"
                trend="Team performance"
                type="info"
                isPercentage
              />
            </>
          )}

          {user.role === 'HR' && (
            <>
              <MetricCard
                icon="📊"
                value={(metrics.completionRate || 0).toFixed(1)}
                label="Completion Rate"
                trend="Employee participation"
                type="primary"
                isPercentage
              />
              <MetricCard
                icon="⭐"
                value={(metrics.avgScores || 0).toFixed(1)}
                label="Average Scores"
                trend="Overall performance"
                type="success"
                isPercentage
              />
              <MetricCard
                icon="⏰"
                value={metrics.employeesPending || 0}
                label="Employees Pending"
                trend="Need course completion"
                type="warning"
              />
              <MetricCard
                icon="🛡️"
                value={metrics.complianceScore || 0}
                label="Compliance Score"
                trend="Meeting standards"
                type="info"
                isPercentage
              />
            </>
          )}

          {user.role === 'EMPLOYEE' && (
            <>
              <MetricCard
                icon="📝"
                value={metrics.myExamsTaken || 0}
                label="Exams Taken"
                trend="Your completed assessments"
                type="primary"
              />
              <MetricCard
                icon="📈"
                value={(metrics.myAverageScore || 0).toFixed(1)}
                label="Average Score"
                trend="Your performance"
                type="success"
                isPercentage
              />
              <MetricCard
                icon="⏳"
                value={metrics.myPendingExams || 0}
                label="Pending Courses"
                trend="Complete courses to unlock exams"
                type="warning"
              />
              <MetricCard
                icon="🔄"
                value={metrics.myInProgressExams || 0}
                label="Exams In Progress"
                trend="Currently taking"
                type="info"
              />
              <MetricCard
                icon="🏆"
                value={(metrics.myBestScore || 0).toFixed(1)}
                label="Best Score"
                trend="Personal best"
                type="info"
                isPercentage
              />
            </>
          )}
        </div>
      )}

      {/* ✅ SIMPLE SEARCH SECTION - REPLACES COMPLEX FILTERS */}
      <div className="search-section">
        <div className="section-header">
          <h3>🔍 Quick Search</h3>
          <p>Find exactly what you need instantly</p>
        </div>
        <div className="search-container">
          <div className="search-input-wrapper">
            <span className="search-icon">🔍</span>
            <input
              type="text"
              placeholder={config.searchPlaceholder}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
            {searchTerm && (
              <button 
                onClick={() => setSearchTerm('')}
                className="clear-search-btn"
                title="Clear search"
              >
                ✕
              </button>
            )}
          </div>
          <div className="search-actions">
            <button onClick={fetchReportData} className="btn-primary">
              <span className="btn-icon">🔄</span> Refresh Data
            </button>
          </div>
        </div>
        {searchTerm && (
          <div className="search-results-info">
            <span className="results-count">
              Found {activeView === 'results' ? filteredResults.length : 
                    activeView === 'analytics' ? filteredAnalytics.length : 
                    filteredEmployees.length} results for "{searchTerm}"
            </span>
            <button 
              onClick={() => setSearchTerm('')}
              className="clear-search-text-btn"
            >
              Clear search
            </button>
          </div>
        )}
      </div>

      {/* Data Views - PASS FILTERED DATA */}
      <div className="data-views-container">
        {activeView === 'analytics' && (
          <AnalyticsView 
            analytics={filteredAnalytics} 
            exams={exams} 
            employees={filteredEmployees} 
            userRole={user.role}
            myResults={myResults}
            searchTerm={searchTerm}
          />
        )}
        {activeView === 'results' && (
          <ResultsView 
            allResults={filteredResults} 
            exams={exams} 
            employees={filteredEmployees} 
            userRole={user.role}
            myResults={filteredResults}
            searchTerm={searchTerm}
          />
        )}
        {activeView === 'export' && (
          <ExportView 
            analytics={analytics} 
            allResults={allResults} 
            userRole={user.role}
            myResults={myResults}
          />
        )}
      </div>
    </div>
  );
}

// Metric Card Component
function MetricCard({ icon, value, label, trend, type, isPercentage = false }) {
  return (
    <div className={`metric-card ${type}`}>
      <div className="metric-icon">{icon}</div>
      <div className="metric-content">
        <h3 className="metric-value">
          {value}{isPercentage ? '%' : ''}
        </h3>
        <p className="metric-label">{label}</p>
        <div className="metric-trend">{trend}</div>
      </div>
    </div>
  );
}

// Results View Component
function ResultsView({ allResults, exams, employees, userRole, myResults, searchTerm }) {
  const results = userRole === 'EMPLOYEE' ? myResults : allResults;

  const getGradeColor = (percentage) => {
    if (percentage >= 90) return '#16a34a';
    if (percentage >= 80) return '#22c55e';
    if (percentage >= 70) return '#eab308';
    if (percentage >= 60) return '#f97316';
    if (percentage >= 50) return '#ef4444';
    return '#dc2626';
  };

  const calculateGrade = (percentage) => {
    if (percentage >= 90) return 'A+';
    if (percentage >= 80) return 'A';
    if (percentage >= 70) return 'B';
    if (percentage >= 60) return 'C';
    if (percentage >= 50) return 'D';
    return 'F';
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      'COMPLETED': { label: 'Completed', class: 'completed', icon: '✅' },
      'IN_PROGRESS': { label: 'In Progress', class: 'in-progress', icon: '🟡' },
      'REVIEW_PENDING': { label: 'Under Review', class: 'pending', icon: '⏳' }
    };

    const config = statusConfig[status] || { label: status, class: 'unknown', icon: '❓' };
    
    return (
      <span className={`status-badge ${config.class}`}>
        {config.icon} {config.label}
      </span>
    );
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    const options = {
      month: 'short',
      day: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    };
    
    const formatted = date.toLocaleDateString('en-US', options);
    return formatted.replace(',', ',');
  };

  const getTimeDifference = (startedAt, submittedAt) => {
    if (!startedAt || !submittedAt) return 'N/A';
    
    const start = new Date(startedAt);
    const end = new Date(submittedAt);
    const diffMs = end - start;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const remainingMins = diffMins % 60;

    if (diffHours > 0) {
      return `${diffHours}h ${remainingMins}m`;
    }
    return `${diffMins}m`;
  };

  // Employee View
  if (userRole === 'EMPLOYEE') {
    return (
      <div className="results-view">
        <div className="view-header">
          <h1 className="view-title">
            <span className="title-icon">📊</span>
            My Exam Results
            {searchTerm && (
              <span className="search-indicator">
                • Searching for "{searchTerm}"
              </span>
            )}
          </h1>
          <p className="view-subtitle">
            View your exam performance and progress across all courses
            {searchTerm && ` • ${results.length} results found`}
          </p>
        </div>

        {results.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">
              {searchTerm ? '🔍' : '📝'}
            </div>
            <h3>
              {searchTerm ? 'No Results Found' : 'No Exam Results Yet'}
            </h3>
            <p>
              {searchTerm 
                ? `No exam results found for "${searchTerm}". Try different search terms.`
                : "You haven't completed any exams yet. Complete your courses first to unlock exams."
              }
            </p>
            {searchTerm && (
              <button 
                onClick={() => window.location.reload()}
                className="btn-primary"
              >
                Clear Search
              </button>
            )}
          </div>
        ) : (
          <div className="results-content">
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Exam</th>
                    <th>Score</th>
                    <th>Grade</th>
                    <th>Status</th>
                    <th>Duration</th>
                    <th>Started</th>
                    <th>Submitted</th>
                  </tr>
                </thead>
                <tbody>
                  {results.map((result) => {
                    const grade = calculateGrade(result.percentage || 0);
                    return (
                      <tr key={result.attemptId} className="data-row">
                        <td className="exam-info">
                          <div className="exam-title">{result.examTitle}</div>
                          <div className="course-name">{result.courseName}</div>
                        </td>
                        <td className="score-info">
                          <div className="score-display">
                            <span className="score-value">{result.score || 0}</span>
                            <span className="score-separator">/</span>
                            <span className="total-marks">{result.totalMarks}</span>
                          </div>
                          <div 
                            className="percentage"
                            style={{ color: getGradeColor(result.percentage || 0) }}
                          >
                            {result.percentage?.toFixed(1)}%
                          </div>
                        </td>
                        <td className="grade-info">
                          <span 
                            className="grade-badge"
                            style={{ backgroundColor: getGradeColor(result.percentage || 0) }}
                          >
                            {grade}
                          </span>
                        </td>
                        <td className="status-info">
                          {getStatusBadge(result.status)}
                        </td>
                        <td className="duration-info">
                          {getTimeDifference(result.startedAt, result.submittedAt)}
                        </td>
                        <td className="date-info">
                          {result.startedAt 
                            ? formatDateTime(result.startedAt)
                            : 'N/A'
                          }
                        </td>
                        <td className="date-info">
                          {result.submittedAt 
                            ? formatDateTime(result.submittedAt)
                            : 'Not Submitted'
                          }
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    );
  }

  // HR View
  if (userRole === 'HR') {
    return (
      <div className="results-view">
        <div className="view-header">
          <h1 className="view-title">
            <span className="title-icon">👥</span>
            Employee Progress Report
            {searchTerm && (
              <span className="search-indicator">
                • Searching for "{searchTerm}"
              </span>
            )}
          </h1>
          <p className="view-subtitle">
            Employee completion status and average scores
            {searchTerm && ` • ${employees.length} employees found`}
          </p>
        </div>

        {employees.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">
              {searchTerm ? '🔍' : '📊'}
            </div>
            <h3>
              {searchTerm ? 'No Employees Found' : 'No Employee Data'}
            </h3>
            <p>
              {searchTerm 
                ? `No employees found for "${searchTerm}". Try different search terms.`
                : "No employee exam data available."
              }
            </p>
            {searchTerm && (
              <button 
                onClick={() => window.location.reload()}
                className="btn-primary"
              >
                Clear Search
              </button>
            )}
          </div>
        ) : (
          <div className="results-content">
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Employee Name</th>
                    <th>Employee ID</th>
                    <th>Completed Exams</th>
                    <th>Pending Exams</th>
                    <th>Average Score</th>
                    <th>Performance</th>
                    <th>Last Activity</th>
                  </tr>
                </thead>
                <tbody>
                  {employees.map((employee) => {
                    const employeeResults = allResults.filter(r => r.employeeId === employee.id);
                    const completed = employeeResults.filter(r => r.status === 'COMPLETED');
                    const pending = employeeResults.filter(r => r.status === 'IN_PROGRESS');
                    const avgScore = completed.length > 0 
                      ? completed.reduce((sum, r) => sum + (r.percentage || 0), 0) / completed.length 
                      : 0;
                    
                    const lastActivity = employeeResults
                      .filter(r => r.submittedAt || r.startedAt)
                      .sort((a, b) => new Date(b.submittedAt || b.startedAt) - new Date(a.submittedAt || a.startedAt))[0];

                    return (
                      <tr key={employee.id} className="data-row">
                        <td className="employee-info">
                          <div className="employee-details">
                            <div className="employee-name">
                              {/* <strong>
                                {employee.firstName && employee.lastName 
                                  ? `${employee.firstName} ${employee.lastName}`
                                  : employee.name || `Employee ${employee.id}`
                                }
                              </strong> */}
                              <strong>
                                {employee.fullName 
                                  ? `${employee.fullName}`
                                  : employee.name || `Employee ${employee.id}`
                                }
                              </strong>
                            </div>
                            <div className="employee-email">
                              {employee.email}
                            </div>
                          </div>
                        </td>
                        <td className="employee-id">
                          <span className="id-badge">
                            {employee.id}
                          </span>
                        </td>
                        <td className="completed-info">
                          <span className="count-badge success">{completed.length}</span>
                        </td>
                        <td className="pending-info">
                          <span className="count-badge warning">{pending.length}</span>
                        </td>
                        <td className="score-info">
                          <span 
                            className={`score-badge ${getScoreClass(avgScore)}`}
                            style={{ backgroundColor: getGradeColor(avgScore) + '20', color: getGradeColor(avgScore) }}
                          >
                            {avgScore.toFixed(1)}%
                          </span>
                        </td>
                        <td className="performance-info">
                          <div className="performance-indicator">
                            <span 
                              className="performance-dot"
                              style={{ backgroundColor: getGradeColor(avgScore) }}
                            ></span>
                            {getPerformanceLevel(avgScore)}
                          </div>
                        </td>
                        <td className="date-info">
                          {lastActivity 
                            ? formatDateTime(lastActivity.submittedAt || lastActivity.startedAt)
                            : 'No activity'
                          }
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Admin & Manager View
  return (
    <div className="results-view">
      <div className="view-header">
        <h1 className="view-title">
          <span className="title-icon">📊</span>
          {userRole === 'ADMIN' ? 'All Employee Exam Results' : 'Team Exam Results'}
          {searchTerm && (
            <span className="search-indicator">
              • Searching for "{searchTerm}"
            </span>
          )}
        </h1>
        <p className="view-subtitle">
          {userRole === 'ADMIN' 
            ? 'Complete overview of all employee exam attempts and results'
            : 'Team performance and exam completion status'
          }
          {searchTerm && ` • ${results.length} results found`}
        </p>
      </div>

      {results.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">
            {searchTerm ? '🔍' : '📝'}
          </div>
          <h3>
            {searchTerm ? 'No Results Found' : 'No Exam Results Yet'}
          </h3>
          <p>
            {searchTerm 
              ? `No exam results found for "${searchTerm}". Try different search terms.`
              : "No exam results available."
            }
          </p>
          {searchTerm && (
            <button 
              onClick={() => window.location.reload()}
              className="btn-primary"
            >
              Clear Search
            </button>
          )}
        </div>
      ) : (
        <div className="results-content">
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Employee Name</th>
                  <th>Employee ID</th>
                  <th>Exam</th>
                  <th>Score</th>
                  <th>Grade</th>
                  <th>Status</th>
                  <th>Duration</th>
                  <th>Started</th>
                  <th>Submitted</th>
                </tr>
              </thead>
              <tbody>
                {results.map((result) => {
                  const employee = employees.find(e => e.id === result.employeeId);
                  const grade = calculateGrade(result.percentage || 0);

                  return (
                    <tr key={result.attemptId || result.id} className="data-row">
                      <td className="employee-info">
                        <div className="employee-details">
                          <div className="employee-name">
                            {/* <strong>
                              {result.employeeName || (employee?.firstName && employee?.lastName 
                                ? `${employee.firstName} ${employee.lastName}`
                                : employee?.name || `Employee ${result.employeeId}`
                              )}
                            </strong> */}
                            <strong>
                              {result.employeeName || (employee?.fullName 
                                ? `${employee.fullName}`
                                : employee?.name || `Employee ${result.employeeId}`
                              )}
                            </strong>
                          </div>
                          <div className="employee-email">
                            {result.employeeEmail || employee?.email || 'No email'}
                          </div>
                        </div>
                      </td>
                      <td className="employee-id">
                        <span className="id-badge">
                          {result.employeeId}
                        </span>
                      </td>
                      <td className="exam-info">
                        <div className="exam-title">{result.examTitle}</div>
                        <div className="course-name">{result.courseName}</div>
                      </td>
                      <td className="score-info">
                        <div className="score-display">
                          <span className="score-value">{result.score || 0}</span>
                          <span className="score-separator">/</span>
                          <span className="total-marks">{result.totalMarks}</span>
                        </div>
                        <div 
                          className="percentage"
                          style={{ color: getGradeColor(result.percentage || 0) }}
                        >
                          {result.percentage?.toFixed(1)}%
                        </div>
                      </td>
                      <td className="grade-info">
                        <span 
                          className="grade-badge"
                          style={{ backgroundColor: getGradeColor(result.percentage || 0) }}
                        >
                          {grade}
                        </span>
                      </td>
                      <td className="status-info">
                        {getStatusBadge(result.status)}
                      </td>
                      <td className="duration-info">
                        {getTimeDifference(result.startedAt, result.submittedAt)}
                      </td>
                      <td className="date-info">
                        {result.startedAt 
                          ? formatDateTime(result.startedAt)
                          : 'N/A'
                        }
                      </td>
                      <td className="date-info">
                        {result.submittedAt 
                          ? formatDateTime(result.submittedAt)
                          : 'Not Submitted'
                        }
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

// Analytics View Component - IMPROVED
function AnalyticsView({ analytics, exams, employees, userRole, myResults, searchTerm }) {
  
  // Employee-specific useful analytics
  if (userRole === 'EMPLOYEE') {
    return (
      <div className="results-view">
        <div className="view-header">
          <h1 className="view-title">
            <span className="title-icon">💡</span>
            Learning Insights
            {searchTerm && (
              <span className="search-indicator">
                • Searching for "{searchTerm}"
              </span>
            )}
          </h1>
          <p className="view-subtitle">
            Personalized recommendations and progress insights
            {searchTerm && ` • ${analytics.length} results found`}
          </p>
        </div>
        <div className="analytics-content">
          <div className="employee-insights">
            <div className="insight-card primary">
              <div className="insight-icon">🎯</div>
              <div className="insight-content">
                <h4>Focus Areas</h4>
                <p>Review courses where you can improve your scores and focus on completing pending courses.</p>
              </div>
            </div>
            <div className="insight-card success">
              <div className="insight-icon">📈</div>
              <div className="insight-content">
                <h4>Progress Tracking</h4>
                <p>Monitor your learning journey and celebrate milestones as you complete exams.</p>
              </div>
            </div>
            <div className="insight-card info">
              <div className="insight-icon">🚀</div>
              <div className="insight-content">
                <h4>Next Steps</h4>
                <p>Continue with your assigned courses and exams to unlock new learning opportunities.</p>
              </div>
            </div>
            <div className="insight-card warning">
              <div className="insight-icon">⏱️</div>
              <div className="insight-content">
                <h4>Time Management</h4>
                <p>Track your exam completion times to improve your time management skills.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // For other roles - show analytics placeholder
  return (
    <div className="results-view">
      <div className="view-header">
        <h1 className="view-title">
          <span className="title-icon">📈</span>
          {userRole === 'ADMIN' ? 'System Analytics' : 
           userRole === 'MANAGER' ? 'Team Analytics' : 'HR Analytics'}
          {searchTerm && (
            <span className="search-indicator">
              • Searching for "{searchTerm}"
            </span>
          )}
        </h1>
        <p className="view-subtitle">
          {userRole === 'ADMIN' 
            ? 'Comprehensive platform performance insights'
            : userRole === 'MANAGER'
            ? 'Team performance metrics and trends'
            : 'Training compliance and employee progress analytics'
          }
          {searchTerm && ` • ${analytics.length} results found`}
        </p>
      </div>

      {analytics.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">🚀</div>
          <h3>Analytics Dashboard Coming Soon</h3>
          <p>
            We're building powerful analytics features to help you make data-driven decisions. 
            This section will include interactive charts, trends, and deep insights.
          </p>
          <div className="feature-preview">
            <h4>What to expect:</h4>
            <div className="feature-list">
              {userRole === 'ADMIN' && (
                <>
                  <div className="feature-item">
                    <span className="feature-icon">📊</span>
                    <span>System-wide performance trends</span>
                  </div>
                  <div className="feature-item">
                    <span className="feature-icon">👥</span>
                    <span>Employee engagement metrics</span>
                  </div>
                  <div className="feature-item">
                    <span className="feature-icon">📈</span>
                    <span>Course effectiveness analysis</span>
                  </div>
                  <div className="feature-item">
                    <span className="feature-icon">🎯</span>
                    <span>Exam difficulty insights</span>
                  </div>
                </>
              )}
              {userRole === 'MANAGER' && (
                <>
                  <div className="feature-item">
                    <span className="feature-icon">📊</span>
                    <span>Team performance trends</span>
                  </div>
                  <div className="feature-item">
                    <span className="feature-icon">🔍</span>
                    <span>Skill gap analysis</span>
                  </div>
                  <div className="feature-item">
                    <span className="feature-icon">📈</span>
                    <span>Individual progress tracking</span>
                  </div>
                  <div className="feature-item">
                    <span className="feature-icon">🎯</span>
                    <span>Training recommendations</span>
                  </div>
                </>
              )}
              {userRole === 'HR' && (
                <>
                  <div className="feature-item">
                    <span className="feature-icon">📊</span>
                    <span>Compliance tracking</span>
                  </div>
                  <div className="feature-item">
                    <span className="feature-icon">📈</span>
                    <span>Department performance</span>
                  </div>
                  <div className="feature-item">
                    <span className="feature-icon">🎯</span>
                    <span>Training effectiveness</span>
                  </div>
                  <div className="feature-item">
                    <span className="feature-icon">📋</span>
                    <span>Certification status</span>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="analytics-content">
          <div className="analytics-grid">
            <div className="analytics-card">
              <h4>Performance Trends</h4>
              <p>Interactive charts showing performance trends over time</p>
            </div>
            <div className="analytics-card">
              <h4>Score Distribution</h4>
              <p>Visual representation of score distribution across exams</p>
            </div>
            <div className="analytics-card">
              <h4>Completion Rates</h4>
              <p>Analytics on exam completion rates and patterns</p>
            </div>
            <div className="analytics-card">
              <h4>Time Analysis</h4>
              <p>Analysis of time spent on different types of exams</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Export View Component
function ExportView({ analytics, allResults, userRole, myResults }) {
  const exportToCSV = (data, filename) => {
    if (!data.length) {
      alert('No data available to export!');
      return;
    }
    
    const headers = Object.keys(data[0]);
    const csvContent = [
      headers.join(','),
      ...data.map(row => headers.map(header => JSON.stringify(row[header] || '')).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${filename}-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    window.URL.revokeObjectURL(url);
  };

  const generateSummaryReport = () => {
    alert('Summary report generation feature would be implemented here! This would generate a comprehensive PDF report with charts and insights.');
  };

  return (
    <div className="results-view">
      <div className="view-header">
        <h1 className="view-title">
          <span className="title-icon">💾</span>
          Export Reports
        </h1>
        <p className="view-subtitle">
          Download comprehensive reports for further analysis
        </p>
      </div>
      <div className="export-content">
        <div className="export-cards">
          {/* Admin Export Options */}
          {(userRole === 'ADMIN') && (
            <>
              <div className="export-card">
                <div className="export-icon">📊</div>
                <h4>Performance Analytics</h4>
                <p>Export detailed performance metrics and analytics data</p>
                <button
                  onClick={() => exportToCSV(analytics, 'performance-analytics')}
                  className="export-btn primary"
                  disabled={!analytics.length}
                >
                  <span className="btn-icon">📥</span>
                  <span className="btn-text">Download CSV</span>
                </button>
              </div>
              <div className="export-card">
                <div className="export-icon">📋</div>
                <h4>Exam Results</h4>
                <p>Export complete exam results with all attempt details</p>
                <button
                  onClick={() => exportToCSV(allResults, 'exam-results')}
                  className="export-btn success"
                  disabled={!allResults.length}
                >
                  <span className="btn-icon">📥</span>
                  <span className="btn-text">Download CSV</span>
                </button>
              </div>
              <div className="export-card">
                <div className="export-icon">👥</div>
                <h4>Employee Reports</h4>
                <p>Export comprehensive employee performance reports</p>
                <button
                  onClick={() => exportToCSV(allResults, 'employee-reports')}
                  className="export-btn info"
                  disabled={!allResults.length}
                >
                  <span className="btn-icon">📥</span>
                  <span className="btn-text">Download CSV</span>
                </button>
              </div>
            </>
          )}

          {/* Manager Export Options */}
          {(userRole === 'MANAGER') && (
            <>
              <div className="export-card">
                <div className="export-icon">👥</div>
                <h4>Team Data</h4>
                <p>Export team performance and exam results</p>
                <button
                  onClick={() => exportToCSV(allResults, 'team-data')}
                  className="export-btn primary"
                  disabled={!allResults.length}
                >
                  <span className="btn-icon">📥</span>
                  <span className="btn-text">Download CSV</span>
                </button>
              </div>
              <div className="export-card">
                <div className="export-icon">📈</div>
                <h4>Team Analytics</h4>
                <p>Export team performance metrics and insights</p>
                <button
                  onClick={() => exportToCSV(analytics, 'team-analytics')}
                  className="export-btn success"
                  disabled={!analytics.length}
                >
                  <span className="btn-icon">📥</span>
                  <span className="btn-text">Download CSV</span>
                </button>
              </div>
            </>
          )}

          {/* HR Export Options */}
          {(userRole === 'HR') && (
            <>
              <div className="export-card">
                <div className="export-icon">📊</div>
                <h4>Compliance Reports</h4>
                <p>Export employee compliance and training reports</p>
                <button
                  onClick={() => exportToCSV(allResults, 'compliance-reports')}
                  className="export-btn primary"
                  disabled={!allResults.length}
                >
                  <span className="btn-icon">📥</span>
                  <span className="btn-text">Download CSV</span>
                </button>
              </div>
              <div className="export-card">
                <div className="export-icon">👤</div>
                <h4>Employee Progress</h4>
                <p>Export employee training progress and completion</p>
                <button
                  onClick={() => exportToCSV(allResults, 'employee-progress')}
                  className="export-btn success"
                  disabled={!allResults.length}
                >
                  <span className="btn-icon">📥</span>
                  <span className="btn-text">Download CSV</span>
                </button>
              </div>
            </>
          )}

          {/* Employee Export Options */}
          {(userRole === 'EMPLOYEE') && (
            <div className="export-card">
              <div className="export-icon">👤</div>
              <h4>Personal Progress Report</h4>
              <p>Export your personal learning progress and performance data</p>
              <button
                onClick={() => exportToCSV(myResults, 'personal-progress')}
                className="export-btn warning"
                disabled={!myResults.length}
              >
                <span className="btn-icon">📥</span>
                <span className="btn-text">Download CSV</span>
              </button>
            </div>
          )}

          {/* Common Export Options */}
          <div className="export-card">
            <div className="export-icon">📄</div>
            <h4>Summary Report</h4>
            <p>Generate a comprehensive summary report with charts and insights</p>
            <button
              onClick={generateSummaryReport}
              className="export-btn info"
            >
              <span className="btn-icon">📊</span>
              <span className="btn-text">Generate Report</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Helper functions
function getScoreClass(score) {
  if (score >= 80) return 'excellent';
  if (score >= 70) return 'good';
  if (score >= 60) return 'average';
  return 'poor';
}

function getPerformanceLevel(score) {
  if (score >= 80) return 'Excellent';
  if (score >= 70) return 'Good';
  if (score >= 60) return 'Average';
  if (score >= 50) return 'Needs Improvement';
  return 'Poor';
}

//export default Reports;