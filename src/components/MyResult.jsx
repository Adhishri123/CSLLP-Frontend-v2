import React, { useEffect, useState } from "react";
import Layout from "./Layout";
import { getEmployeeResults } from "../services/api";

export default function MyResult({ user, onLogout }) {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function fetchResults() {
      try {
        const data = await getEmployeeResults(user.id);
        if (data && data.length > 0) {
          setResults(data);
        } else {
          setResults([]);
        }
      } catch (error) {
        console.error("Failed to fetch results:", error);
        setError("Failed to load your results. Please try again.");
        setResults([]);
      } finally {
        setLoading(false);
      }
    }

    fetchResults();
  }, [user.id]);

  const getGradeColor = (percentage) => {
    if (percentage >= 90) return '#16a34a'; // A+ - Green
    if (percentage >= 80) return '#22c55e'; // A - Light Green
    if (percentage >= 70) return '#eab308'; // B - Yellow
    if (percentage >= 60) return '#f97316'; // C - Orange
    if (percentage >= 50) return '#ef4444'; // D - Red
    return '#dc2626'; // F - Dark Red
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

  if (loading) {
    return (
      <Layout user={user} onLogout={onLogout}>
        <div className="my-results-container">
          <div className="loading-spinner">
            <div className="spinner"></div>
            <p>Loading your results...</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout user={user} onLogout={onLogout}>
      <div className="my-results-container">
        {/* Header */}
        <div className="results-header">
          <h1 className="results-title">
            <span className="title-icon">📊</span>
            My Exam Results
          </h1>
          <p className="results-subtitle">
            View your exam performance and progress across all courses
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="error-banner">
            <span className="error-icon">⚠️</span>
            {error}
          </div>
        )}

        {/* Results Content */}
        {results.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📝</div>
            <h3>No Exam Results Yet</h3>
            <p>You haven't completed any exams yet. Start an exam to see your results here.</p>
          </div>
        ) : (
          <div className="results-content">
            {/* Summary Cards */}
            <div className="summary-cards">
              <div className="summary-card">
                <div className="summary-icon">📚</div>
                <div className="summary-content">
                  <h3>{results.length}</h3>
                  <p>Exams Taken</p>
                </div>
              </div>
              
              <div className="summary-card">
                <div className="summary-icon">🎯</div>
                <div className="summary-content">
                  <h3>
                    {results.filter(r => r.percentage >= 60).length}
                  </h3>
                  <p>Exams Passed</p>
                </div>
              </div>
              
              <div className="summary-card">
                <div className="summary-icon">📈</div>
                <div className="summary-content">
                  <h3>
                    {results.length > 0 
                      ? Math.round(results.reduce((sum, r) => sum + (r.percentage || 0), 0) / results.length)
                      : 0
                    }%
                  </h3>
                  <p>Average Score</p>
                </div>
              </div>
            </div>

            {/* Results Table */}
            <div className="results-table-container">
              <table className="results-table">
                <thead>
                  <tr>
                    <th>Exam</th>
                    <th>Course</th>
                    <th>Score</th>
                    <th>Grade</th>
                    <th>Status</th>
                    <th>Started</th>
                    <th>Submitted</th>
                    <th>Duration</th>
                  </tr>
                </thead>
                <tbody>
                  {results.map((result) => (
                    <tr key={result.attemptId} className="result-row">
                      <td className="exam-info">
                        <div className="exam-title">{result.examTitle}</div>
                      </td>
                      <td className="course-info">
                        <div className="course-name">{result.courseName}</div>
                      </td>
                      <td className="score-info">
                        <div className="score-display">
                          <span className="score-value">{result.score || 0}</span>
                          <span className="score-separator">/</span>
                          <span className="total-marks">{result.totalMarks}</span>
                        </div>
                        <div className="percentage">
                          {result.percentage?.toFixed(1)}%
                        </div>
                      </td>
                      <td className="grade-info">
                        <span 
                          className="grade-badge"
                          style={{ backgroundColor: getGradeColor(result.percentage || 0) }}
                        >
                          {result.grade}
                        </span>
                      </td>
                      <td className="status-info">
                        {getStatusBadge(result.status)}
                      </td>
                      <td className="date-info">
                        {result.startedAt 
                          ? new Date(result.startedAt).toLocaleDateString() 
                          : 'N/A'
                        }
                      </td>
                      <td className="date-info">
                        {result.submittedAt 
                          ? new Date(result.submittedAt).toLocaleDateString() 
                          : 'Not Submitted'
                        }
                      </td>
                      <td className="duration-info">
                        {result.timeTakenMinutes 
                          ? `${result.timeTakenMinutes}m` 
                          : 'N/A'
                        }
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Feedback Section */}
            {results.some(r => r.feedback) && (
              <div className="feedback-section">
                <h3>📝 Instructor Feedback</h3>
                <div className="feedback-list">
                  {results
                    .filter(r => r.feedback)
                    .map((result) => (
                      <div key={result.attemptId} className="feedback-item">
                        <div className="feedback-exam">{result.examTitle}</div>
                        <div className="feedback-content">{result.feedback}</div>
                      </div>
                    ))
                  }
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </Layout>
  );
}

// CSS Styles for MyResults
const myResultsStyles = `
<style>
  .my-results-container {
    max-width: 1400px;
    margin: 0 auto;
    padding: 24px;
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
  }

  .results-header {
    text-align: center;
    margin-bottom: 32px;
  }

  .results-title {
    font-size: 2.5rem;
    font-weight: 700;
    margin: 0 0 8px 0;
    color: #1f2937;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 12px;
  }

  .title-icon {
    font-size: 2.8rem;
  }

  .results-subtitle {
    color: #6b7280;
    font-size: 1.1rem;
    margin: 0;
  }

  .error-banner {
    background: #fef2f2;
    border: 1px solid #fecaca;
    color: #dc2626;
    padding: 12px 16px;
    border-radius: 8px;
    margin-bottom: 24px;
    display: flex;
    align-items: center;
    gap: 8px;
    justify-content: center;
  }

  .summary-cards {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 20px;
    margin-bottom: 32px;
  }

  .summary-card {
    background: white;
    border: 1px solid #e5e7eb;
    border-radius: 12px;
    padding: 24px;
    text-align: center;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  }

  .summary-icon {
    font-size: 2.5rem;
    margin-bottom: 12px;
  }

  .summary-content h3 {
    font-size: 2rem;
    font-weight: 700;
    margin: 0 0 4px 0;
    color: #1f2937;
  }

  .summary-content p {
    color: #6b7280;
    margin: 0;
    font-weight: 500;
  }

  .results-table-container {
    background: white;
    border: 1px solid #e5e7eb;
    border-radius: 12px;
    overflow: hidden;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
    margin-bottom: 32px;
  }

  .results-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 0.9rem;
  }

  .results-table th {
    background: #f8fafc;
    padding: 16px;
    text-align: left;
    font-weight: 600;
    color: #374151;
    border-bottom: 1px solid #e5e7eb;
  }

  .results-table td {
    padding: 16px;
    border-bottom: 1px solid #f3f4f6;
  }

  .results-table tr:last-child td {
    border-bottom: none;
  }

  .results-table tr:hover {
    background: #f8fafc;
  }

  .exam-title {
    font-weight: 600;
    color: #1f2937;
  }

  .course-name {
    color: #6b7280;
  }

  .score-display {
    display: flex;
    align-items: center;
    gap: 4px;
    margin-bottom: 4px;
  }

  .score-value {
    font-weight: 700;
    color: #1f2937;
  }

  .score-separator {
    color: #9ca3af;
  }

  .total-marks {
    color: #6b7280;
  }

  .percentage {
    font-size: 0.8rem;
    color: #6b7280;
  }

  .grade-badge {
    padding: 6px 12px;
    border-radius: 20px;
    color: white;
    font-weight: 600;
    font-size: 0.8rem;
  }

  .status-badge {
    padding: 6px 12px;
    border-radius: 20px;
    font-size: 0.8rem;
    font-weight: 600;
  }

  .status-badge.completed { background: #dcfce7; color: #166534; }
  .status-badge.in-progress { background: #fef3c7; color: #92400e; }
  .status-badge.pending { background: #e0e7ff; color: #3730a3; }
  .status-badge.unknown { background: #f3f4f6; color: #6b7280; }

  .date-info, .duration-info {
    color: #6b7280;
    white-space: nowrap;
  }

  .feedback-section {
    background: white;
    border: 1px solid #e5e7eb;
    border-radius: 12px;
    padding: 24px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  }

  .feedback-section h3 {
    margin: 0 0 16px 0;
    color: #1f2937;
    font-size: 1.25rem;
  }

  .feedback-list {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  .feedback-item {
    padding: 16px;
    background: #f8fafc;
    border-radius: 8px;
    border-left: 4px solid #3b82f6;
  }

  .feedback-exam {
    font-weight: 600;
    color: #1f2937;
    margin-bottom: 8px;
  }

  .feedback-content {
    color: #4b5563;
    line-height: 1.5;
  }

  .empty-state {
    text-align: center;
    padding: 80px 24px;
    color: #6b7280;
  }

  .empty-icon {
    font-size: 4rem;
    margin-bottom: 16px;
    opacity: 0.5;
  }

  .empty-state h3 {
    font-size: 1.5rem;
    margin: 0 0 8px 0;
    color: #374151;
  }

  .loading-spinner {
    text-align: center;
    padding: 80px 24px;
  }

  .spinner {
    width: 40px;
    height: 40px;
    border: 4px solid #e5e7eb;
    border-left: 4px solid #3b82f6;
    border-radius: 50%;
    animation: spin 1s linear infinite;
    margin: 0 auto 16px;
  }

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }

  @media (max-width: 768px) {
    .my-results-container {
      padding: 16px;
    }

    .results-title {
      font-size: 2rem;
    }

    .summary-cards {
      grid-template-columns: 1fr;
    }

    .results-table-container {
      overflow-x: auto;
    }

    .results-table {
      min-width: 800px;
    }
  }
</style>
`;

// Add styles to document head
if (typeof document !== 'undefined') {
  const styleElement = document.createElement('style');
  styleElement.innerHTML = myResultsStyles;
  document.head.appendChild(styleElement);
}