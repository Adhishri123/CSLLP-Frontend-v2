import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import CreateExamForm from "./CreateExamForm";
import EditExamForm from "./EditExamForm";
import { 
  getExams, 
  getExamsForEmployee, 
  getEmployeeResults, 
  checkExamEligibility, 
  startAttempt,
  updateExam,
  deleteExam
} from "../services/api";

export default function Examinations({ user }) {
  const [exams, setExams] = useState([]);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("available");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [checkingEligibility, setCheckingEligibility] = useState({});
  const [editingExam, setEditingExam] = useState(null);
  const [showEditForm, setShowEditForm] = useState(false);
  const navigate = useNavigate();

  const isAdminOrManager = user.role === "ADMIN" || user.role === "MANAGER";

  const fetchData = async () => {
    setLoading(true);
    setError("");
    try {
      if (activeTab === "available") {
        let examData = [];
        if (isAdminOrManager) {
           examData = await getExams();
           console.log("Admin Exams:", examData);
           examData = examData?.data || [];
        } 
        else {
           examData = await getExamsForEmployee(user.id);
          
          // Enhanced debugging
          console.log('🔍 Raw exam data from backend:', examData);
          
          // Extract array from response
          examData = examData?.data || [];
          console.log("🔍 Exam Array:", examData);

          // examData = examData.map(exam => {
          //   console.log(`🔍 Processing exam: ${exam.title}`, {
          //     isEligible: exam.isEligible,
          //     courseProgress: exam.courseProgress,
          //     status: exam.status,
          //     eligibilityMessage: exam.eligibilityMessage
          //   });
            
          //   return {
          //     ...exam,
          //     isEligible: exam.isEligible !== undefined ? exam.isEligible : false,
          //     courseProgress: exam.courseProgress !== undefined ? exam.courseProgress : 0,
          //     status: exam.status || 'LOCKED',
          //     eligibilityMessage: exam.eligibilityMessage || "Complete course to unlock exam"
          //   };
          // });

          examData = examData.map((exam) => ({
            ...exam,
            isEligible: exam.isEligible !== undefined? exam.isEligible : false,
            courseProgress: exam.courseProgress !== undefined ? exam.courseProgress : 0,
            status:exam.status || "LOCKED",
            eligibilityMessage: exam.eligibilityMessage || "Complete course to unlock exam",
          }));

          console.log('🔍 Processed exam data for display:', examData);
        }
        setExams(examData);
      } else if (activeTab === "results") {
        if (isAdminOrManager) {
          navigate('/reports');
          return;
        } else {
          const resultsData = await getEmployeeResults(user.id);
          console.log("Get exam result:",resultsData);
          setResults(resultsData?.data || []);
        }
      }
    } catch (err) {
      console.error("Error fetching data:", err);
      setError("Failed to load data. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [activeTab, user.id, user.role, isAdminOrManager, navigate]);

  // CRUD Operations
  const handleStartExam = async (examId) => {
    console.log('Starting exam with ID:', examId);
    setCheckingEligibility(prev => ({ ...prev, [examId]: true }));
    setError("");
    
    try {
      const eligibility = await checkExamEligibility(examId, user.id);
      console.log('Eligibility result:', eligibility);
      
      if (!eligibility?.data?.isEligible) {
        setError(eligibility?.data?.message || eligibility?.message || "You are not eligible to take this exam.");
        return;
      }

      // await startAttempt(examId, user.id);
      // navigate(`/examinations/take/${examId}`);

      const startResponse = await startAttempt(examId, user.id);

      console.log("Start Attempt Response:", startResponse);

      if (!startResponse?.success) {
        setError(
          startResponse?.message ||
          "Failed to start exam."
        );
        return;
      }

      console.log("Navigating...");
      console.log("Navigate URL:", `/examinations/take/${examId}`);
      navigate(`/examinations/take/${examId}`);
    } catch (err) {
      console.error('Error in handleStartExam:', err);
      setError(err.message || "Failed to start exam. Please try again.");
    } finally {
      setCheckingEligibility(prev => ({ ...prev, [examId]: false }));
    }
  };

  const handleEditExam = (exam) => {
    setEditingExam(exam);
    setShowEditForm(true);
    setActiveTab('create');
    setMessage("");
    setError("");
  };

  const handleDeleteExam = async (examId) => {
    if (!window.confirm('Are you sure you want to delete this exam? This action cannot be undone.')) {
      return;
    }

    try {
      setLoading(true);
      await deleteExam(examId);
      setMessage('✅ Exam deleted successfully!');
      
      // Refresh the exams list
      await fetchData();
    } catch (err) {
      console.error('Error deleting exam:', err);
      setError('❌ Failed to delete exam: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateExam = async (examData) => {
    try {
      setLoading(true);
      await updateExam(editingExam.id, examData);
      setMessage('✅ Exam updated successfully!');
      setShowEditForm(false);
      setEditingExam(null);
      
      // Refresh exams list
      await fetchData();
      setActiveTab('available');
    } catch (err) {
      console.error('Error updating exam:', err);
      setError('❌ Failed to update exam: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  const handleCancelEdit = () => {
    setShowEditForm(false);
    setEditingExam(null);
    setActiveTab('available');
  };

  const handleCreateSuccess = () => {
    setMessage('✅ Exam created successfully!');
    setActiveTab('available');
    fetchData();
  };

  const handleViewAllReports = () => {
    navigate('/reports');
  };

  const filteredExams = exams.filter((exam) =>
    exam.title?.toLowerCase().includes(search.toLowerCase()) ||
    exam.courseName?.toLowerCase().includes(search.toLowerCase())
  );

  // Helper Functions
  const getStatusBadge = (exam) => {
    if (isAdminOrManager) {
      return (
        <span style={exam.status === 'ACTIVE' ? styles.statusActive : styles.statusInactive}>
          {exam.status || 'ACTIVE'}
        </span>
      );
    }

    console.log(`🔍 Status badge for ${exam.title}:`, {
      status: exam.status,
      isEligible: exam.isEligible,
      courseProgress: exam.courseProgress,
      eligibilityMessage: exam.eligibilityMessage
    });

    if (!exam.isEligible || exam.status === 'LOCKED') {
      return (
        <span style={styles.statusLocked} title={exam.eligibilityMessage}>
          🔒 LOCKED ({exam.courseProgress}% Complete)
        </span>
      );
    }

    const attemptStatus = exam.attemptStatus || 'NOT_STARTED';
    const statusConfig = {
      'NOT_STARTED': { label: 'Available', style: styles.statusAvailable, icon: '🟢' },
      'IN_PROGRESS': { label: 'In Progress', style: styles.statusInProgress, icon: '🟡' },
      'COMPLETED': { label: 'Completed', style: styles.statusCompleted, icon: '🔵' }
    };

    const config = statusConfig[attemptStatus] || statusConfig.NOT_STARTED;
    
    return (
      <span style={config.style}>
        {config.icon} {config.label}
      </span>
    );
  };

  const getActionButton = (exam) => {
    const currentExamId = exam.examId || exam.id;

    if (isAdminOrManager) {
      return null;
    }

    console.log(`🔍 Button check for exam ${exam.title}:`, {
      status: exam.status,
      isEligible: exam.isEligible,
      attemptStatus: exam.attemptStatus,
      courseProgress: exam.courseProgress,
      eligibilityMessage: exam.eligibilityMessage
    });

    const isLocked = exam.status === 'LOCKED' || !exam.isEligible;
    
    if (isLocked) {
      return (
        <button style={styles.btnDisabled} disabled title={exam.eligibilityMessage}>
          🔒 {exam.eligibilityMessage || "Complete Course First"}
        </button>
      );
    }

    if (exam.attemptStatus === 'COMPLETED') {
      return (
        <div style={styles.completedStatus}>
          <div style={styles.completedIcon}>✅</div>
          <div style={styles.completedText}>
            <div style={styles.completedLabel}>Assessment Complete</div>
            <div style={styles.completedSubtitle}>Review your performance in Results</div>
          </div>
        </div>
      );
    }

    if (exam.attemptStatus === 'IN_PROGRESS') {
      return (
        <button 
          onClick={() => handleStartExam(currentExamId)}
          disabled={checkingEligibility[currentExamId]}
          style={styles.btnWarning}
        >
          {checkingEligibility[currentExamId] ? 'Checking...' : 'Continue Exam'}
        </button>
      );
    }

    return (
      <button 
        onClick={() => handleStartExam(currentExamId)}
        disabled={checkingEligibility[currentExamId]}
        style={styles.btnPrimary}
        title="Start the exam"
      >
        {checkingEligibility[currentExamId] ? 'Checking...' : 'Start Exam'}
      </button>
    );
  };

  const getAdminActions = (exam) => {
    if (!isAdminOrManager) return null;

    return (
      <div style={styles.adminActions}>
        <button 
          onClick={() => handleEditExam(exam)}
          style={styles.editBtn}
          title="Edit exam details"
        >
           Edit
        </button>
        <button 
          onClick={() => handleDeleteExam(exam.examId || exam.id)}
          style={styles.deleteBtn}
          title="Delete exam"
        >
           Delete
        </button>
      </div>
    );
  };

  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.spinner}></div>
        <p style={styles.loadingText}>Loading assessments...</p>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>
            {isAdminOrManager ? 'Exam Management' : 'My Assessments'}
          </h1>
          <p style={styles.subtitle}>
            {isAdminOrManager 
              ? 'Manage all exams and track employee performance' 
              : 'Track your learning progress and assessment results'
            }
          </p>
        </div>
        
        <div style={styles.headerActions}>
          {isAdminOrManager && (
            <button onClick={handleViewAllReports} style={styles.btnSecondary}>
              📊 View Reports
            </button>
          )}
        </div>
      </div>

      {/* Messages */}
      {error && (
        <div style={styles.errorBanner}>
          <span style={styles.errorIcon}>⚠️</span>
          <span style={styles.errorText}>{error}</span>
          <button onClick={() => setError('')} style={styles.errorClose}>×</button>
        </div>
      )}

      {message && (
        <div style={styles.successBanner}>
          <span style={styles.successIcon}>✅</span>
          <span style={styles.successText}>{message}</span>
          <button onClick={() => setMessage('')} style={styles.successClose}>×</button>
        </div>
      )}

      {/* Tabs */}
      <div style={styles.tabs}>
        <button
          style={activeTab === "available" ? styles.activeTab : styles.tabButton}
          onClick={() => {
            setActiveTab("available");
            setError("");
            setMessage("");
            setShowEditForm(false);
            setEditingExam(null);
          }}
        >
          {isAdminOrManager ? 'All Exams' : 'Available Exams'}
        </button>
        
        {!isAdminOrManager && (
          <button
            style={activeTab === "results" ? styles.activeTab : styles.tabButton}
            onClick={() => {
              setActiveTab("results");
              setError("");
              setMessage("");
            }}
          >
            My Results
          </button>
        )}
        
        {isAdminOrManager && (
          <button
            style={activeTab === "create" ? styles.activeTab : styles.tabButton}
            onClick={() => {
              setActiveTab("create");
              setError("");
              setMessage("");
              setShowEditForm(false);
              setEditingExam(null);
            }}
          >
            {showEditForm ? 'Edit Exam' : 'Create Exam'}
          </button>
        )}
      </div>

      {/* Search */}
      {activeTab === "available" && (
        <div style={styles.searchContainer}>
          <div style={styles.searchWrapper}>
            <span style={styles.searchIcon}>🔍</span>
            <input
              type="text"
              placeholder="Search exams by title or course..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={styles.searchInput}
            />
          </div>
        </div>
      )}

      {/* Tab Content */}
      {activeTab === "available" && (
        <div style={styles.examsGrid}>
          {filteredExams.length === 0 ? (
            <div style={styles.emptyState}>
              <div style={styles.emptyIcon}>📚</div>
              <h3 style={styles.emptyTitle}>No Assessments Available</h3>
              <p style={styles.emptyText}>
                {isAdminOrManager 
                  ? 'No exams have been created yet. Create your first exam to get started.' 
                  : 'No assessments available for your enrolled courses at this time.'
                }
              </p>
              {isAdminOrManager && (
                <button 
                  onClick={() => setActiveTab('create')}
                  style={styles.createFirstBtn}
                >
                  Create First Exam
                </button>
              )}
            </div>
          ) : (
            filteredExams.map((exam) => (
              <div key={exam.examId || exam.id} style={styles.examCard}>
                <div style={styles.examHeader}>
                  <h3 style={styles.examTitle}>{exam.title}</h3>
                  {getStatusBadge(exam)}
                </div>

                <p style={styles.examDescription}>
                  {exam.description || "No description provided."}
                </p>

                <div style={styles.examDetails}>
                  <div style={styles.detailItem}>
                    <span style={styles.detailLabel}>📚 Course:</span>
                    <span style={styles.detailValue}>{exam.courseName || `Course ${exam.courseId}`}</span>
                  </div>
                  
                  <div style={styles.detailItem}>
                    <span style={styles.detailLabel}>⏱ Duration:</span>
                    <span style={styles.detailValue}>{exam.durationMinutes} minutes</span>
                  </div>

                  {!isAdminOrManager && exam.courseProgress !== undefined && (
                    <div style={styles.detailItem}>
                      <span style={styles.detailLabel}>📊 Progress:</span>
                      <span style={styles.detailValue}>
                        <div style={styles.progressBar}>
                          <div 
                            style={{
                              ...styles.progressFill,
                              width: `${exam.courseProgress}%`
                            }}
                          ></div>
                          <span style={styles.progressText}>{exam.courseProgress}%</span>
                        </div>
                      </span>
                    </div>
                  )}

                  {!isAdminOrManager && exam.eligibilityMessage && (
                    <div style={styles.eligibilityMessage}>
                      <span style={styles.infoIcon}>ℹ️</span>
                      {exam.eligibilityMessage}
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                {!isAdminOrManager && (
                  <div style={styles.examActions}>
                    {getActionButton(exam)}
                  </div>
                )}

                {/* Admin Actions */}
                {getAdminActions(exam)}
              </div>
            ))
          )}
        </div>
      )}

      {activeTab === "results" && !isAdminOrManager && (
        <div style={styles.resultsSection}>
          <div style={styles.resultsHeader}>
            <h2 style={styles.resultsTitle}>Assessment Results</h2>
            <p style={styles.resultsSubtitle}>Your completed assessments and performance metrics</p>
          </div>

          {results.length === 0 ? (
            <div style={styles.emptyResults}>
              <div style={styles.emptyResultsIcon}>📝</div>
              <h3 style={styles.emptyResultsTitle}>No Assessments Completed</h3>
              <p style={styles.emptyResultsText}>
                You haven't completed any assessments yet. Start an exam to see your results here.
              </p>
            </div>
          ) : (
            <div style={styles.resultsGrid}>
              {results.map((result) => (
                <div key={result.attemptId} style={styles.resultCard}>
                  <div style={styles.resultHeader}>
                    <div style={styles.resultExamInfo}>
                      <h3 style={styles.resultExamTitle}>{result.examTitle}</h3>
                      <p style={styles.resultCourseName}>{result.courseName}</p>
                    </div>
                    <div style={styles.resultStatusBadge}>
                      <span style={getStatusStyle(result.status)}>
                        {result.status === 'COMPLETED' ? '✅ Completed' : '🟡 In Progress'}
                      </span>
                    </div>
                  </div>

                  <div style={styles.resultMetrics}>
                    <div style={styles.metric}>
                      <div style={styles.metricValue}>
                        {result.score || 0}<span style={styles.metricTotal}>/{result.totalMarks}</span>
                      </div>
                      <div style={styles.metricLabel}>Score</div>
                    </div>
                    
                    <div style={styles.metric}>
                      <div style={styles.metricValue}>
                        {result.percentage?.toFixed(1)}%
                      </div>
                      <div style={styles.metricLabel}>Percentage</div>
                    </div>
                    
                    <div style={styles.metric}>
                      <div style={styles.metricValue}>
                        <span style={{
                          ...styles.gradeBadge,
                          backgroundColor: getGradeColor(result.percentage || 0)
                        }}>
                          {result.grade}
                        </span>
                      </div>
                      <div style={styles.metricLabel}>Grade</div>
                    </div>
                  </div>

                  <div style={styles.resultDetails}>
                    <div style={styles.detailRow}>
                      <span style={styles.detailLabel}>Started:</span>
                      <span style={styles.detailValue}>
                        {result.startedAt 
                          ? new Date(result.startedAt).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })
                          : 'N/A'
                        }
                      </span>
                    </div>
                    
                    <div style={styles.detailRow}>
                      <span style={styles.detailLabel}>Submitted:</span>
                      <span style={styles.detailValue}>
                        {result.submittedAt 
                          ? new Date(result.submittedAt).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })
                          : 'Not Submitted'
                        }
                      </span>
                    </div>
                    
                    <div style={styles.detailRow}>
                      <span style={styles.detailLabel}>Duration:</span>
                      <span style={styles.detailValue}>
                        {result.timeTakenMinutes 
                          ? `${result.timeTakenMinutes} minutes` 
                          : 'N/A'
                        }
                      </span>
                    </div>
                  </div>

                  {result.feedback && (
                    <div style={styles.feedbackSection}>
                      <div style={styles.feedbackLabel}>Instructor Feedback</div>
                      <div style={styles.feedbackText}>{result.feedback}</div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === "create" && isAdminOrManager && (
        showEditForm && editingExam ? (
          <EditExamForm 
            exam={editingExam}
            onUpdate={handleUpdateExam}
            onCancel={handleCancelEdit}
          />
        ) : (
          <CreateExamForm onSuccess={handleCreateSuccess} />
        )
      )}
    </div>
  );
}

// Helper function for grade colors
function getGradeColor(percentage) {
  if (percentage >= 90) return '#16a34a';
  if (percentage >= 80) return '#22c55e';
  if (percentage >= 70) return '#eab308';
  if (percentage >= 60) return '#f97316';
  if (percentage >= 50) return '#ef4444';
  return '#dc2626';
}

// Helper function for status styles
function getStatusStyle(status) {
  switch (status) {
    case 'COMPLETED': 
      return {
        padding: '6px 12px',
        background: '#dcfce7',
        color: '#166534',
        borderRadius: '20px',
        fontSize: '12px',
        fontWeight: '600'
      };
    case 'IN_PROGRESS': 
      return {
        padding: '6px 12px',
        background: '#fef3c7',
        color: '#92400e',
        borderRadius: '20px',
        fontSize: '12px',
        fontWeight: '600'
      };
    default: 
      return {
        padding: '6px 12px',
        background: '#f3f4f6',
        color: '#6b7280',
        borderRadius: '20px',
        fontSize: '12px',
        fontWeight: '600'
      };
  }
}

const styles = {
  container: {
    maxWidth: "1200px",
    margin: "0 auto",
    padding: "24px",
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
    backgroundColor: "#f8fafc",
    minHeight: "100vh"
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: "32px",
    gap: "20px"
  },
  title: {
    fontSize: "32px",
    fontWeight: "bold",
    marginBottom: "8px",
    color: "#1f2937",
    background: "linear-gradient(135deg, #3b82f6, #1e40af)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent"
  },
  subtitle: {
    color: "#6b7280",
    margin: 0,
    fontSize: "16px",
    fontWeight: "500"
  },
  headerActions: {
    display: "flex",
    gap: "12px"
  },
  errorBanner: {
    background: "#fef2f2",
    border: "1px solid #fecaca",
    color: "#dc2626",
    padding: "16px",
    borderRadius: "12px",
    marginBottom: "24px",
    display: "flex",
    alignItems: "center",
    gap: "12px",
    boxShadow: "0 2px 8px rgba(0, 0, 0, 0.05)"
  },
  successBanner: {
    background: "#f0fdf4",
    border: "1px solid #bbf7d0",
    color: "#166534",
    padding: "16px",
    borderRadius: "12px",
    marginBottom: "24px",
    display: "flex",
    alignItems: "center",
    gap: "12px",
    boxShadow: "0 2px 8px rgba(0, 0, 0, 0.05)"
  },
  errorIcon: {
    fontSize: "18px"
  },
  successIcon: {
    fontSize: "18px"
  },
  errorText: {
    flex: 1,
    fontWeight: "500"
  },
  successText: {
    flex: 1,
    fontWeight: "500"
  },
  errorClose: {
    background: "none",
    border: "none",
    fontSize: "20px",
    cursor: "pointer",
    color: "#dc2626",
    width: "24px",
    height: "24px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: "4px",
    transition: "background-color 0.2s ease"
  },
  successClose: {
    background: "none",
    border: "none",
    fontSize: "20px",
    cursor: "pointer",
    color: "#166534",
    width: "24px",
    height: "24px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: "4px",
    transition: "background-color 0.2s ease"
  },
  tabs: {
    display: "flex",
    gap: "8px",
    marginBottom: "32px",
    background: "white",
    padding: "8px",
    borderRadius: "12px",
    boxShadow: "0 2px 8px rgba(0, 0, 0, 0.05)",
    border: "1px solid #e5e7eb"
  },
  tabButton: {
    padding: "12px 24px",
    backgroundColor: "transparent",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
    fontWeight: "500",
    color: "#6b7280",
    transition: "all 0.3s ease",
    flex: 1
  },
  activeTab: {
    padding: "12px 24px",
    backgroundColor: "#3b82f6",
    color: "white",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
    fontWeight: "600",
    boxShadow: "0 2px 4px rgba(59, 130, 246, 0.3)",
    flex: 1
  },
  searchContainer: {
    marginBottom: "32px"
  },
  searchWrapper: {
    position: "relative",
    maxWidth: "400px"
  },
  searchIcon: {
    position: "absolute",
    left: "16px",
    top: "50%",
    transform: "translateY(-50%)",
    fontSize: "18px",
    color: "#6b7280"
  },
  searchInput: {
    width: "100%",
    padding: "14px 16px 14px 48px",
    borderRadius: "12px",
    border: "2px solid #e5e7eb",
    fontSize: "16px",
    transition: "all 0.3s ease",
    backgroundColor: "white",
    boxShadow: "0 2px 4px rgba(0, 0, 0, 0.05)"
  },
  examsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(420px, 1fr))",
    gap: "24px"
  },
  examCard: {
    backgroundColor: "white",
    border: "1px solid #e5e7eb",
    borderRadius: "16px",
    padding: "24px",
    boxShadow: "0 4px 12px rgba(0, 0, 0, 0.05)",
    transition: "all 0.3s ease",
    position: "relative",
    overflow: "hidden"
  },
  examHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: "16px",
    gap: "12px"
  },
  examTitle: {
    fontSize: "20px",
    fontWeight: "600",
    margin: 0,
    color: "#1f2937",
    flex: 1,
    lineHeight: "1.4"
  },
  examDescription: {
    color: "#6b7280",
    marginBottom: "20px",
    lineHeight: "1.6",
    fontSize: "15px"
  },
  examDetails: {
    marginBottom: "24px"
  },
  detailItem: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "12px",
    padding: "8px 0"
  },
  detailLabel: {
    color: "#6b7280",
    fontWeight: "500",
    fontSize: "14px"
  },
  detailValue: {
    color: "#1f2937",
    fontWeight: "600",
    fontSize: "14px"
  },
  progressBar: {
    width: "120px",
    height: "8px",
    background: "#e5e7eb",
    borderRadius: "4px",
    position: "relative",
    overflow: "hidden"
  },
  progressFill: {
    height: "100%",
    background: "linear-gradient(90deg, #10b981, #34d399)",
    borderRadius: "4px",
    transition: "width 0.3s ease"
  },
  progressText: {
    position: "absolute",
    top: "50%",
    left: "50%",
    transform: "translate(-50%, -50%)",
    fontSize: "10px",
    color: "#374151",
    fontWeight: "700"
  },
  eligibilityMessage: {
    background: "#f0f9ff",
    border: "1px solid #bae6fd",
    borderRadius: "8px",
    padding: "12px",
    marginTop: "16px",
    fontSize: "14px",
    color: "#0369a1",
    display: "flex",
    alignItems: "center",
    gap: "8px"
  },
  infoIcon: {
    fontSize: "16px"
  },
  examActions: {
    display: "flex",
    gap: "12px"
  },
  adminActions: {
    display: 'flex',
    gap: '8px',
    marginTop: '16px',
    paddingTop: '16px',
    borderTop: '1px solid #e5e7eb'
  },
  editBtn: {
    padding: '10px 16px',
    background: '#fef3c7',
    color: '#92400e',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontWeight: '600',
    fontSize: '14px',
    flex: 1,
    transition: 'all 0.2s ease'
  },
  deleteBtn: {
    padding: '10px 16px',
    background: '#fee2e2',
    color: '#dc2626',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontWeight: '600',
    fontSize: '14px',
    flex: 1,
    transition: 'all 0.2s ease'
  },
  completedStatus: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    padding: "16px",
    background: "#f0fdf4",
    border: "1px solid #bbf7d0",
    borderRadius: "12px",
    width: "100%"
  },
  completedIcon: {
    fontSize: "24px",
    flexShrink: 0
  },
  completedText: {
    flex: 1
  },
  completedLabel: {
    color: "#166534",
    fontWeight: "600",
    fontSize: "15px",
    marginBottom: "4px"
  },
  completedSubtitle: {
    color: "#65a30d",
    fontSize: "13px",
    fontWeight: "500"
  },
  // Button Styles
  btnPrimary: {
    padding: "14px 24px",
    backgroundColor: "#3b82f6",
    color: "white",
    border: "none",
    borderRadius: "10px",
    fontWeight: "600",
    cursor: "pointer",
    transition: "all 0.3s ease",
    fontSize: "14px",
    boxShadow: "0 2px 4px rgba(59, 130, 246, 0.3)",
    flex: 1
  },
  btnSecondary: {
    padding: "14px 24px",
    backgroundColor: "#6b7280",
    color: "white",
    border: "none",
    borderRadius: "10px",
    fontWeight: "600",
    cursor: "pointer",
    transition: "all 0.3s ease",
    fontSize: "14px",
    boxShadow: "0 2px 4px rgba(107, 114, 128, 0.3)"
  },
  btnWarning: {
    padding: "14px 24px",
    backgroundColor: "#f59e0b",
    color: "white",
    border: "none",
    borderRadius: "10px",
    fontWeight: "600",
    cursor: "pointer",
    transition: "all 0.3s ease",
    fontSize: "14px",
    boxShadow: "0 2px 4px rgba(245, 158, 11, 0.3)",
    flex: 1
  },
  btnDisabled: {
    padding: "14px 24px",
    backgroundColor: "#f3f4f6",
    color: "#9ca3af",
    border: "none",
    borderRadius: "10px",
    fontWeight: "600",
    cursor: "not-allowed",
    fontSize: "14px",
    flex: 1
  },
  // Status Badges
  statusActive: {
    padding: "8px 16px",
    background: "#dcfce7",
    color: "#166534",
    borderRadius: "20px",
    fontSize: "12px",
    fontWeight: "600",
    border: "1px solid #bbf7d0"
  },
  statusInactive: {
    padding: "8px 16px",
    background: "#f3f4f6",
    color: "#6b7280",
    borderRadius: "20px",
    fontSize: "12px",
    fontWeight: "600",
    border: "1px solid #e5e7eb"
  },
  statusLocked: {
    padding: "8px 16px",
    background: "#fef3c7",
    color: "#92400e",
    borderRadius: "20px",
    fontSize: "12px",
    fontWeight: "600",
    border: "1px solid #fde68a"
  },
  statusAvailable: {
    padding: "8px 16px",
    background: "#dbeafe",
    color: "#1e40af",
    borderRadius: "20px",
    fontSize: "12px",
    fontWeight: "600",
    border: "1px solid #bfdbfe"
  },
  statusInProgress: {
    padding: "8px 16px",
    background: "#fef3c7",
    color: "#92400e",
    borderRadius: "20px",
    fontSize: "12px",
    fontWeight: "600",
    border: "1px solid #fde68a"
  },
  statusCompleted: {
    padding: "8px 16px",
    background: "#dcfce7",
    color: "#166534",
    borderRadius: "20px",
    fontSize: "12px",
    fontWeight: "600",
    border: "1px solid #bbf7d0"
  },
  // Results Section Styles
  resultsSection: {
    background: "white",
    borderRadius: "16px",
    border: "1px solid #e5e7eb",
    overflow: "hidden",
    boxShadow: "0 4px 12px rgba(0, 0, 0, 0.05)"
  },
  resultsHeader: {
    padding: "32px 32px 24px",
    borderBottom: "1px solid #f3f4f6"
  },
  resultsTitle: {
    fontSize: "24px",
    fontWeight: "bold",
    color: "#1f2937",
    marginBottom: "8px"
  },
  resultsSubtitle: {
    color: "#6b7280",
    fontSize: "16px",
    margin: 0
  },
  resultsGrid: {
    padding: "24px",
    display: "grid",
    gap: "24px"
  },
  resultCard: {
    border: "1px solid #e5e7eb",
    borderRadius: "16px",
    padding: "24px",
    transition: "all 0.3s ease",
    backgroundColor: "white",
    boxShadow: "0 2px 8px rgba(0, 0, 0, 0.04)"
  },
  resultHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: "20px"
  },
  resultExamInfo: {
    flex: 1
  },
  resultExamTitle: {
    fontSize: "18px",
    fontWeight: "600",
    color: "#1f2937",
    marginBottom: "4px"
  },
  resultCourseName: {
    color: "#6b7280",
    fontSize: "14px",
    margin: 0
  },
  resultStatusBadge: {
    flexShrink: 0
  },
  resultMetrics: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))",
    gap: "20px",
    marginBottom: "24px",
    padding: "20px",
    background: "#f8fafc",
    borderRadius: "12px"
  },
  metric: {
    textAlign: "center"
  },
  metricValue: {
    fontSize: "24px",
    fontWeight: "bold",
    color: "#1f2937",
    marginBottom: "4px"
  },
  metricTotal: {
    fontSize: "16px",
    color: "#6b7280",
    fontWeight: "normal"
  },
  metricLabel: {
    color: "#6b7280",
    fontSize: "14px",
    fontWeight: "500"
  },
  gradeBadge: {
    padding: "8px 16px",
    borderRadius: "20px",
    color: "white",
    fontWeight: "600",
    fontSize: "14px",
    display: "inline-block"
  },
  resultDetails: {
    marginBottom: "20px"
  },
  detailRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "12px 0",
    borderBottom: "1px solid #f3f4f6"
  },
  detailLabel: {
    color: "#6b7280",
    fontWeight: "500",
    fontSize: "14px"
  },
  detailValue: {
    color: "#1f2937",
    fontWeight: "600",
    fontSize: "14px"
  },
  feedbackSection: {
    padding: "16px",
    background: "#f0f9ff",
    border: "1px solid #bae6fd",
    borderRadius: "12px",
    marginTop: "16px"
  },
  feedbackLabel: {
    color: "#0369a1",
    fontWeight: "600",
    fontSize: "14px",
    marginBottom: "8px"
  },
  feedbackText: {
    color: "#1e40af",
    fontSize: "14px",
    lineHeight: "1.5"
  },
  // Empty States
  emptyState: {
    textAlign: "center",
    padding: "80px 24px",
    color: "#6b7280",
    gridColumn: "1 / -1"
  },
  emptyIcon: {
    fontSize: "64px",
    marginBottom: "24px",
    opacity: "0.5"
  },
  emptyTitle: {
    fontSize: "20px",
    fontWeight: "600",
    marginBottom: "12px",
    color: "#374151"
  },
  emptyText: {
    fontSize: "16px",
    lineHeight: "1.6",
    maxWidth: "400px",
    margin: "0 auto"
  },
  createFirstBtn: {
    background: "linear-gradient(135deg, #3b82f6, #1e40af)",
    color: "white",
    border: "none",
    padding: "12px 24px",
    borderRadius: "8px",
    cursor: "pointer",
    fontWeight: "600",
    marginTop: "16px",
    transition: "all 0.3s ease"
  },
  emptyResults: {
    textAlign: "center",
    padding: "80px 24px"
  },
  emptyResultsIcon: {
    fontSize: "64px",
    marginBottom: "24px",
    opacity: "0.5"
  },
  emptyResultsTitle: {
    fontSize: "20px",
    fontWeight: "600",
    marginBottom: "12px",
    color: "#374151"
  },
  emptyResultsText: {
    fontSize: "16px",
    lineHeight: "1.6",
    maxWidth: "400px",
    margin: "0 auto",
    color: "#6b7280"
  },
  // Loading
  loadingContainer: {
    textAlign: "center",
    padding: "120px 24px"
  },
  spinner: {
    width: "48px",
    height: "48px",
    border: "4px solid #e5e7eb",
    borderLeft: "4px solid #3b82f6",
    borderRadius: "50%",
    animation: "spin 1s linear infinite",
    margin: "0 auto 24px"
  },
  loadingText: {
    color: "#6b7280",
    fontSize: "16px",
    fontWeight: "500"
  }
};

// Add CSS animation for spinner
const spinnerStyles = `
@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
`;

// Add styles to document head
if (typeof document !== 'undefined') {
  const styleElement = document.createElement('style');
  styleElement.innerHTML = spinnerStyles;
  document.head.appendChild(styleElement);
}