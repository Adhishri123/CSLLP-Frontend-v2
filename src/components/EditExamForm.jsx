// src/components/EditExamForm.jsx
import React, { useState, useEffect } from "react";

export default function EditExamForm({ exam, onUpdate, onCancel }) {
  const [examData, setExamData] = useState({
    title: exam.title,
    description: exam.description,
    durationMinutes: exam.durationMinutes,
    courseId: exam.courseId.toString(),
    createdBy: exam.createdBy || 1,
    examType: exam.examType || "MCQ"
    // REMOVED: startTime and endTime
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [showMessage, setShowMessage] = useState(false);

  // Auto-hide message after 5 seconds
  useEffect(() => {
    if (showMessage) {
      const timer = setTimeout(() => {
        setShowMessage(false);
        setMessage('');
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, [showMessage]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setExamData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setShowMessage(false);

    // UPDATED: Removed startTime and endTime from validation
    if (!examData.title || !examData.description || !examData.durationMinutes || !examData.courseId) {
      setMessage('Please fill all required fields');
      setShowMessage(true);
      setLoading(false);
      return;
    }

    // REMOVED: Time validation
    // if (new Date(examData.startTime) >= new Date(examData.endTime)) {
    //   setMessage('End time must be after start time');
    //   setShowMessage(true);
    //   setLoading(false);
    //   return;
    // }

    try {
      const payload = {
        ...examData,
        durationMinutes: parseInt(examData.durationMinutes),
        // REMOVED: startTime and endTime from payload
        courseId: parseInt(examData.courseId),
        createdBy: parseInt(examData.createdBy),
        examType: examData.examType
      };
      
      await onUpdate(payload);
      // Success message will be handled by parent component if needed
    } catch (err) {
      setMessage('Error: ' + (err.response?.data?.message || err.message));
      setShowMessage(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="edit-exam-container">
      <div className="edit-exam-card">
        <div className="edit-exam-header">
          <div className="header-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M11 4H4C3.46957 4 2.96086 4.21071 2.58579 4.58579C2.21071 4.96086 2 5.46957 2 6V20C2 20.5304 2.21071 21.0391 2.58579 21.4142C2.96086 21.7893 3.46957 22 4 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M18.5 2.5C18.8978 2.10217 19.4374 1.87868 20 1.87868C20.5626 1.87868 21.1022 2.10217 21.5 2.5C21.8978 2.89782 22.1213 3.43739 22.1213 4C22.1213 4.56261 21.8978 5.10217 21.5 5.5L12 15L8 16L9 12L18.5 2.5Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <div className="header-content">
            <h2>Edit Exam</h2>
            <p>Update the details for "{exam.title}"</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="edit-exam-form">
          <div className="form-grid">
            {/* UPDATED: Made title full-width since we have fewer fields */}
            <div className="form-group full-width">
              <label className="form-label">
                Exam Title <span className="required">*</span>
              </label>
              <input
                type="text"
                name="title"
                value={examData.title}
                onChange={handleChange}
                className="form-input"
                placeholder="Enter exam title"
                required
              />
            </div>

            {/* UPDATED: Made description full-width for better layout */}
            <div className="form-group full-width">
              <label className="form-label">
                Description <span className="required">*</span>
              </label>
              <textarea
                name="description"
                value={examData.description}
                onChange={handleChange}
                className="form-textarea"
                rows="4"
                placeholder="Enter exam description and instructions..."
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">
                Duration (minutes) <span className="required">*</span>
              </label>
              <input
                type="number"
                name="durationMinutes"
                value={examData.durationMinutes}
                onChange={handleChange}
                className="form-input"
                min="1"
                placeholder="e.g., 60"
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">
                Course ID <span className="required">*</span>
              </label>
              <input
                type="number"
                name="courseId"
                value={examData.courseId}
                onChange={handleChange}
                className="form-input"
                placeholder="Course ID"
                required
              />
            </div>

            {/* REMOVED: Start Time and End Time fields */}
          </div>

          {/* Auto-disappearing Message Popup */}
          {showMessage && (
            <div className={`message-popup ${message.includes('Error') ? 'error' : 'info'} ${showMessage ? 'show' : ''}`}>
              <div className="message-content">
                <span className="message-icon">
                  {message.includes('Error') ? '⚠️' : 'ℹ️'}
                </span>
                <span className="message-text">{message}</span>
                <button 
                  className="close-message"
                  onClick={() => setShowMessage(false)}
                >
                  ×
                </button>
              </div>
              <div className="message-progress"></div>
            </div>
          )}

          <div className="form-actions">
            <button 
              type="button" 
              onClick={onCancel}
              className="cancel-button"
              disabled={loading}
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="submit-button"
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="loading-spinner"></span>
                  Updating...
                </>
              ) : (
                <>
                  <span className="button-icon">✓</span>
                  Update Exam
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      <style jsx>{`
        .edit-exam-container {
          max-width: 800px;
          margin: 0 auto;
          padding: 20px;
        }

        .edit-exam-card {
          background: white;
          border-radius: 16px;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.08);
          border: 1px solid #e8eef3;
          overflow: hidden;
        }

        .edit-exam-header {
          display: flex;
          align-items: center;
          gap: 16px;
          padding: 24px 32px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
        }

        .header-icon {
          width: 48px;
          height: 48px;
          background: rgba(255, 255, 255, 0.2);
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .header-content h2 {
          margin: 0 0 4px 0;
          font-size: 1.5rem;
          font-weight: 700;
        }

        .header-content p {
          margin: 0;
          opacity: 0.9;
          font-size: 0.9rem;
        }

        .edit-exam-form {
          padding: 32px;
          position: relative;
        }

        .form-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
          margin-bottom: 24px;
        }

        .form-group {
          display: flex;
          flex-direction: column;
        }

        .full-width {
          grid-column: 1 / -1;
        }

        .form-label {
          font-weight: 600;
          margin-bottom: 8px;
          color: #374151;
          font-size: 0.9rem;
          display: flex;
          align-items: center;
          gap: 4px;
        }

        .required {
          color: #ef4444;
        }

        .form-input, .form-textarea {
          padding: 12px 16px;
          border: 2px solid #e5e7eb;
          border-radius: 10px;
          font-size: 0.95rem;
          transition: all 0.2s ease;
          background: white;
        }

        .form-input:focus, .form-textarea:focus {
          outline: none;
          border-color: #667eea;
          box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
          transform: translateY(-1px);
        }

        .form-textarea {
          resize: vertical;
          min-height: 100px;
          font-family: inherit;
          line-height: 1.5;
        }

        /* Message Popup Styles */
        .message-popup {
          position: fixed;
          top: 20px;
          right: 20px;
          background: white;
          border-radius: 12px;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.15);
          border-left: 4px solid;
          min-width: 300px;
          max-width: 400px;
          z-index: 1000;
          animation: slideIn 0.3s ease-out;
        }

        .message-popup.error {
          border-left-color: #ef4444;
        }

        .message-popup.info {
          border-left-color: #3b82f6;
        }

        .message-content {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 16px;
        }

        .message-icon {
          font-size: 1.2rem;
        }

        .message-text {
          flex: 1;
          font-weight: 500;
          font-size: 0.9rem;
        }

        .close-message {
          background: none;
          border: none;
          font-size: 1.5rem;
          cursor: pointer;
          color: #6b7280;
          padding: 0;
          width: 24px;
          height: 24px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 4px;
        }

        .close-message:hover {
          background: #f3f4f6;
          color: #374151;
        }

        .message-progress {
          height: 3px;
          background: currentColor;
          opacity: 0.6;
          animation: progress 5s linear forwards;
        }

        .form-actions {
          display: flex;
          gap: 12px;
          justify-content: flex-end;
          padding-top: 16px;
          border-top: 1px solid #f3f4f6;
        }

        .cancel-button {
          padding: 12px 24px;
          border: 2px solid #d1d5db;
          background: white;
          border-radius: 10px;
          cursor: pointer;
          font-weight: 600;
          color: #374151;
          transition: all 0.2s ease;
        }

        .cancel-button:hover:not(:disabled) {
          background: #f9fafb;
          border-color: #9ca3af;
          transform: translateY(-1px);
        }

        .submit-button {
          padding: 12px 24px;
          border: none;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          border-radius: 10px;
          cursor: pointer;
          font-weight: 600;
          display: flex;
          align-items: center;
          gap: 8px;
          transition: all 0.2s ease;
        }

        .submit-button:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
        }

        .submit-button:disabled {
          opacity: 0.7;
          cursor: not-allowed;
          transform: none;
        }

        .loading-spinner {
          width: 16px;
          height: 16px;
          border: 2px solid transparent;
          border-top: 2px solid white;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        .button-icon {
          font-weight: bold;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        @keyframes slideIn {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }

        @keyframes progress {
          from {
            width: 100%;
          }
          to {
            width: 0%;
          }
        }

        @media (max-width: 768px) {
          .edit-exam-container {
            padding: 16px;
          }
          
          .edit-exam-form {
            padding: 24px;
          }
          
          .form-grid {
            grid-template-columns: 1fr;
            gap: 16px;
          }
          
          .form-actions {
            flex-direction: column-reverse;
          }

          .message-popup {
            left: 20px;
            right: 20px;
            min-width: auto;
          }
        }
      `}</style>
    </div>
  );
}