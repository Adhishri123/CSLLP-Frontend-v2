import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getExamById, getQuestions, submitAttempt, startAttempt, checkExamEligibility } from "../services/api";

export default function TakeExam({ user }) {
  const { examId } = useParams();
  const navigate = useNavigate();

  const [exam, setExam] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [attemptStarted, setAttemptStarted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [result, setResult] = useState(null);
  const [timeLeft, setTimeLeft] = useState(null);
  const [currentQ, setCurrentQ] = useState(0);
  const [errorMessage, setErrorMessage] = useState("");
  const [checkingEligibility, setCheckingEligibility] = useState(false);
  const [totalExamMarks, setTotalExamMarks] = useState(0);

  // Fetch exam + questions
  useEffect(() => {
    async function fetchExam() {
      setLoading(true);
      try {
        // const data = await getExamById(examId);
        const examResponse = await getExamById(examId);
        console.log("Exam response :", examResponse);
        if (examResponse?.data) {
          setExam(examResponse.data);
          console.log("Exam response data :", examResponse.data);
          // const qs = await getQuestions(examId);
          // console.log("Exam que :", qs);
          // setQuestions(qs || []);
          
          // // Calculate total marks from questions
          // const totalMarks = qs?.reduce((sum, question) => sum + (question.marks || 1), 0) || 0;
          // setTotalExamMarks(totalMarks);

          const questionResponse = await getQuestions(examId);
          console.log("Question Response:", questionResponse);
          const qs = questionResponse?.data || [];
          console.log("Questions Array:", qs);
          setQuestions(qs);

          const totalMarks = qs.reduce(
            (sum, question) => sum + (question.marks || 1),
            0
          );

          setTotalExamMarks(totalMarks);
        }
      } catch (err) {
        console.error(err);
        setErrorMessage("Failed to load exam. Please try again.");
      } finally {
        setLoading(false);
      }
    }
    fetchExam();
  }, [examId]);

  // Timer logic
  useEffect(() => {
    if (exam && attemptStarted) {
      setTimeLeft(exam.durationMinutes * 60);
      const timer = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            handleAutoSubmit();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [exam, attemptStarted]);

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const handleAnswerChange = (qId, optionId) => {
    setAnswers((prev) => ({ ...prev, [qId]: [optionId] }));
  };

  const handleCheckEligibility = async () => {
    setCheckingEligibility(true);
    setErrorMessage("");
    try {
      const eligibility = await checkExamEligibility(examId, user.id);
      console.log("Check exam eligibility1 :", eligibility);
      
      if (!eligibility?.data?.isEligible) {
        setErrorMessage(eligibility?.data?.message || "You are not eligible to take this exam.");
        return false;
      }
      return true;
      console.log("Check exam eligibility2 :", eligibility);
    } catch (err) {
      setErrorMessage(err.message || "Failed to check eligibility.");
      return false;
    } finally {
      setCheckingEligibility(false);
    }
  };

  const handleStart = async () => {
    const isEligible = await handleCheckEligibility();
      console.log("Check eligibility :", isEligible);
      if (!isEligible) {
      console.log("User is not eligible");
      return;
    }

    try {
      console.log("Starting exam...");
      const response = await startAttempt(examId, user.id);
      console.log("Start Attempt Response:", response);
      // if (response) setAttemptStarted(true);
      if (response?.success) {
        setAttemptStarted(true);
      } else {
        setErrorMessage( response?.message || "Unable to start exam" );
      }
    } catch (err) {
      setErrorMessage(err.response?.data?.message || err.message || "Failed to start exam. Please try again.");
    }
  };

  const handleSubmit = async () => {
    try {
      const payload = { employeeId: user.id, answers };
      const res = await submitAttempt(examId, payload);
       console.log("Submit Response:", res);
      if (res?.success) {
        // Calculate percentage based on total exam marks
        // const percentage = totalExamMarks > 0 ? (res.score / totalExamMarks) * 100 : 0;
        // setResult({
        //   ...res,
        //   percentage: percentage,
        //   totalMarks: totalExamMarks
        // });
        const attempt = res.data;

        const percentage =
          totalExamMarks > 0
            ? (attempt.score / totalExamMarks) * 100
            : 0;

        setResult({
          ...attempt,
          percentage,
          totalMarks: totalExamMarks
        });
      }
    } catch (err) {
      console.error("Error submitting exam:", err);
      setErrorMessage("Failed to submit exam. Please try again.");
    } finally {
      setAttemptStarted(false);
    }
  };

  const handleAutoSubmit = async () => {
    if (attemptStarted) {
      try {
        const payload = { employeeId: user.id, answers };
        const res = await submitAttempt(examId, payload);
        // if (res) {
        //   // Calculate percentage based on total exam marks
        //   const percentage = totalExamMarks > 0 ? (res.score / totalExamMarks) * 100 : 0;
        //   setResult({
        //     ...res,
        //     percentage: percentage,
        //     totalMarks: totalExamMarks
        //   });
        // }
        if (res?.success) {

        const attempt = res.data;

        const percentage =
          totalExamMarks > 0
            ? (attempt.score / totalExamMarks) * 100
            : 0;

        setResult({
          ...attempt,
          percentage,
          totalMarks: totalExamMarks
        });
      }
      } catch (err) {
        console.error("Error auto-submitting exam:", err);
        setErrorMessage("Time's up! Your exam has been automatically submitted.");
      } finally {
        setAttemptStarted(false);
      }
    }
  };

  const handleExit = () => {
    if (attemptStarted && !result) {
      if (window.confirm("Are you sure you want to exit? Your progress will be saved, but you'll need to continue later.")) {
        navigate("/examinations");
      }
    } else {
      navigate("/examinations");
    }
  };

  if (loading || !exam) {
    return (
      <div className="take-exam-container">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Loading exam...</p>
        </div>
      </div>
    );
  }

  if (result) {
    console.log("RESULT OBJECT:", result);
    // Use the calculated percentage from result
    const percentage = result.percentage || 0;
    const passed = percentage >= 50;

    return (
      <div className="exam-result-container">
        <div className="result-card">
          <div className="result-icon">{passed ? "🎉" : "📝"}</div>
          <h2>Exam Completed: {exam.title}</h2>
          
          <div className="result-stats">
            <div className="stat-item">
              <span className="stat-label">Score</span>
              <span className="stat-value">{result.score} / {result.totalMarks || totalExamMarks}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Percentage</span>
              <span className="stat-value">{percentage.toFixed(1)}%</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Passing Criteria</span>
              <span className="stat-value">50%</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Status</span>
              <span className={`status-badge ${passed ? 'passed' : 'failed'}`}>
                {passed ? "✅ Passed" : "❌ Failed"}
              </span>
            </div>
          </div>

          {result.feedback && (
            <div className="feedback-section">
              <h3>Instructor Feedback</h3>
              <p>{result.feedback}</p>
            </div>
          )}

          <div className="result-actions">
            <button onClick={() => navigate("/examinations")} className="btn-primary">
              Back to Exams
            </button>
            <button onClick={() => navigate("/examinations?tab=results")} className="btn-outline">
              View All Results
            </button>
          </div>
        </div>
      </div>
    );
  }

  const question = questions[currentQ];
  const progress = ((currentQ + 1) / questions.length) * 100;

  return (
    <div className="take-exam-container">
      {/* Exam Header */}
      <div className="exam-header">
        <div className="exam-info">
          <h2 className="exam-title">{exam.title}</h2>
          <p className="exam-description">{exam.description}</p>
        </div>
        
        {attemptStarted && (
          <div className="exam-controls">
            <div className="timer">
              <span className="timer-icon">⏱</span>
              <span className="timer-text">{formatTime(timeLeft)}</span>
            </div>
            <div className="progress">
              <span className="progress-text">
                Question {currentQ + 1} of {questions.length}
              </span>
              <div className="progress-bar">
                <div 
                  className="progress-fill" 
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
            </div>
            <button onClick={handleExit} className="btn-exit">
              Exit Exam
            </button>
          </div>
        )}
      </div>

      {/* Error Message */}
      {errorMessage && (
        <div className="error-banner">
          <span className="error-icon">⚠️</span>
          {errorMessage}
          <button onClick={() => setErrorMessage('')} className="error-close">×</button>
        </div>
      )}

      {!attemptStarted ? (
        <div className="exam-start-screen">
          <div className="start-card">
            <div className="card-icon">📝</div>
            <h3>Ready to Start?</h3>
            <p>You are about to start the exam: <strong>{exam.title}</strong></p>
            
            <div className="exam-details">
              <div className="detail-item">
                <span className="detail-label">Duration:</span>
                <span className="detail-value">{exam.durationMinutes} minutes</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Questions:</span>
                <span className="detail-value">{questions.length} questions</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Total Marks:</span>
                <span className="detail-value">{totalExamMarks}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Passing Percentage:</span>
                <span className="detail-value">50%</span>
              </div>
            </div>

            <div className="instructions">
              <h4>Instructions:</h4>
              <ul>
                <li>You cannot pause the exam once started</li>
                <li>The timer will start immediately</li>
                <li>Navigate between questions using Next/Previous buttons</li>
                <li>Submit your exam when you're finished</li>
                <li>The exam will auto-submit when time expires</li>
                <li><strong>Passing Criteria: 50% or higher</strong></li>
              </ul>
            </div>

            <button 
              onClick={handleStart}
              disabled={checkingEligibility}
              className="btn-start"
            >
              {checkingEligibility ? 'Checking Eligibility...' : 'Start Exam'}
            </button>
          </div>
        </div>
      ) : question ? (
        <>
          {/* Question Card */}
          <div className="question-card">
            <div className="question-header">
              <h4 className="question-number">
                Question {currentQ + 1} of {questions.length}
              </h4>
              <span className="question-marks">Marks: {question.marks}</span>
            </div>
            
            <p className="question-text">{question.questionText}</p>

            {question.options?.length > 0 && (
              <div className="options-list">
                {question.options.map((opt, index) => (
                  <label key={opt.id} className="option-item">
                    <input
                      type="radio"
                      name={`q-${question.id}`}
                      value={opt.id}
                      checked={answers[question.id]?.includes(opt.id) || false}
                      onChange={() => handleAnswerChange(question.id, opt.id)}
                      className="option-input"
                    />
                    <span className="option-text">
                      <span className="option-letter">
                        {String.fromCharCode(65 + index)}
                      </span>
                      {opt.text}
                    </span>
                  </label>
                ))}
              </div>
            )}
          </div>

          {/* Navigation */}
          <div className="navigation-controls">
            <button
              type="button"
              onClick={() => setCurrentQ((prev) => Math.max(prev - 1, 0))}
              disabled={currentQ === 0}
              className="btn-nav prev"
            >
              Previous
            </button>

            {currentQ === questions.length - 1 ? (
              <button
                onClick={handleSubmit}
                className="btn-nav submit"
              >
                Submit Exam
              </button>
            ) : (
              <button
                onClick={() => setCurrentQ((prev) => prev + 1)}
                className="btn-nav next"
              >
                Next
              </button>
            )}
          </div>
        </>
      ) : (
        <div className="no-questions">
          <div className="empty-icon">❓</div>
          <h3>No Questions Available</h3>
          <p>This exam doesn't have any questions yet.</p>
        </div>
      )}
    </div>
  );
}

// CSS Styles for TakeExam - FIXED VERSION
const takeExamStyles = `
.take-exam-container {
  max-width: 800px;
  margin: 0 auto;
  padding: 24px;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
}

.exam-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 24px;
  gap: 20px;
}

.exam-info {
  flex: 1;
}

.exam-title {
  font-size: 1.75rem;
  font-weight: 700;
  margin: 0 0 8px 0;
  color: #1f2937;
}

.exam-description {
  color: #6b7280;
  margin: 0;
  line-height: 1.5;
}

.exam-controls {
  display: flex;
  flex-direction: column;
  gap: 12px;
  align-items: flex-end;
  flex-shrink: 0;
}

.timer {
  display: flex;
  align-items: center;
  gap: 8px;
  background: #fef2f2;
  padding: 8px 16px;
  border-radius: 20px;
  font-weight: 600;
  color: #dc2626;
}

.progress {
  text-align: right;
}

.progress-text {
  font-size: 0.9rem;
  color: #6b7280;
  margin-bottom: 4px;
  display: block;
}

.progress-bar {
  width: 150px;
  height: 6px;
  background: #e5e7eb;
  border-radius: 3px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: #3b82f6;
  transition: width 0.3s ease;
}

.btn-exit {
  padding: 8px 16px;
  background: #ef4444;
  color: white;
  border: none;
  border-radius: 6px;
  font-weight: 500;
  cursor: pointer;
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
}

.error-close {
  background: none;
  border: none;
  font-size: 1.2rem;
  cursor: pointer;
  margin-left: auto;
}

.exam-start-screen {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 60vh;
}

.start-card {
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: 32px;
  text-align: center;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
  max-width: 500px;
  width: 100%;
}

.card-icon {
  font-size: 4rem;
  margin-bottom: 16px;
}

.start-card h3 {
  font-size: 1.5rem;
  margin: 0 0 8px 0;
  color: #1f2937;
}

.start-card p {
  color: #6b7280;
  margin: 0 0 24px 0;
}

.exam-details {
  background: #f8fafc;
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 24px;
}

.detail-item {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
}

.detail-item:last-child {
  margin-bottom: 0;
}

.detail-label {
  color: #6b7280;
}

.detail-value {
  font-weight: 600;
  color: #1f2937;
}

.instructions {
  text-align: left;
  margin-bottom: 24px;
}

.instructions h4 {
  margin: 0 0 12px 0;
  color: #1f2937;
}

.instructions ul {
  margin: 0;
  padding-left: 20px;
  color: #6b7280;
}

.instructions li {
  margin-bottom: 4px;
}

.btn-start {
  width: 100%;
  padding: 16px;
  background: #10b981;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 1.1rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.3s ease;
}

.btn-start:hover:not(:disabled) {
  background: #059669;
}

.btn-start:disabled {
  background: #d1d5db;
  cursor: not-allowed;
}

.question-card {
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: 24px;
  margin-bottom: 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.question-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.question-number {
  font-size: 1.1rem;
  font-weight: 600;
  margin: 0;
  color: #1f2937;
}

.question-marks {
  background: #dbeafe;
  color: #1e40af;
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 0.8rem;
  font-weight: 600;
}

.question-text {
  font-size: 1.1rem;
  line-height: 1.6;
  color: #374151;
  margin: 0 0 20px 0;
}

.options-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.option-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  border: 2px solid #e5e7eb;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.option-item:hover {
  border-color: #3b82f6;
  background: #f0f9ff;
}

.option-text {
  color: #374151;
  display: flex;
  align-items: center;
  gap: 12px;
}

.option-letter {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  background: #3b82f6;
  color: white;
  border-radius: 4px;
  font-size: 0.8rem;
  font-weight: 600;
}

.option-input {
  margin: 0;
  width: 18px;
  height: 18px;
}

.option-item:has(.option-input:checked) {
  border-color: #3b82f6;
  background: #f0f9ff;
}

.option-item:has(.option-input:checked) .option-text {
  font-weight: 600;
  color: #1e40af;
}

.navigation-controls {
  display: flex;
  justify-content: space-between;
  gap: 12px;
}

.btn-nav {
  padding: 12px 24px;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn-nav.prev, .btn-nav.next {
  background: #3b82f6;
  color: white;
}

.btn-nav.prev:hover:not(:disabled), .btn-nav.next:hover:not(:disabled) {
  background: #2563eb;
}

.btn-nav.prev:disabled {
  background: #d1d5db;
  cursor: not-allowed;
}

.btn-nav.submit {
  background: #10b981;
  color: white;
}

.btn-nav.submit:hover {
  background: #059669;
}

.exam-result-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 70vh;
  padding: 24px;
}

.result-card {
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 16px;
  padding: 32px;
  text-align: center;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.1);
  max-width: 500px;
  width: 100%;
}

.result-icon {
  font-size: 4rem;
  margin-bottom: 16px;
}

.result-card h2 {
  margin: 0 0 24px 0;
  color: #1f2937;
}

.result-stats {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
  margin-bottom: 24px;
}

.stat-item {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.stat-label {
  color: #6b7280;
  font-size: 0.9rem;
}

.stat-value {
  font-size: 1.5rem;
  font-weight: 700;
  color: #1f2937;
}

.status-badge {
  padding: 8px 16px;
  border-radius: 20px;
  font-weight: 600;
  font-size: 0.9rem;
}

.status-badge.passed {
  background: #dcfce7;
  color: #166534;
}

.status-badge.failed {
  background: #fef2f2;
  color: #dc2626;
}

.feedback-section {
  background: #f0f9ff;
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 24px;
  text-align: left;
}

.feedback-section h3 {
  margin: 0 0 8px 0;
  color: #0369a1;
}

.feedback-section p {
  margin: 0;
  color: #4b5563;
  line-height: 1.5;
}

.result-actions {
  display: flex;
  gap: 12px;
}

.btn-primary, .btn-outline {
  flex: 1;
  padding: 12px 24px;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  text-decoration: none;
  display: inline-block;
  text-align: center;
}

.btn-primary {
  background: #3b82f6;
  color: white;
}

.btn-primary:hover {
  background: #2563eb;
}

.btn-outline {
  background: transparent;
  border: 2px solid #3b82f6;
  color: #3b82f6;
  
}

.btn-outline:hover {
  background: #3b82f6;
  color: white;
}

.no-questions {
  text-align: center;
  padding: 60px 24px;
  color: #6b7280;
}

.empty-icon {
  font-size: 4rem;
  margin-bottom: 16px;
  opacity: 0.5;
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
  .take-exam-container {
    padding: 16px;
  }

  .exam-header {
    flex-direction: column;
    text-align: center;
  }

  .exam-controls {
    align-items: center;
    width: 100%;
  }

  .start-card {
    padding: 24px;
  }

  .result-actions {
    flex-direction: column;
  }

  .navigation-controls {
    flex-direction: column;
  }

  .result-stats {
    grid-template-columns: 1fr;
  }
}
`;

// Add styles to document head
if (typeof document !== 'undefined') {
  const styleElement = document.createElement('style');
  styleElement.innerHTML = takeExamStyles;
  document.head.appendChild(styleElement);
}