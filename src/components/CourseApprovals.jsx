import React, { useEffect, useState } from "react";
import { getAllEnrollments, approveEnrollment, rejectEnrollment } from "../services/api";

// ============================================
// POPUP MODAL COMPONENT
// ============================================
function PopupModal({ show, type, title, message, onClose, onConfirm }) {
  if (!show) return null;

  const getModalConfig = () => {
    const config = {
      SUCCESS: {
        icon: "✅",
        bgColor: "bg-success",
        btnColor: "btn-success",
        title: "Success"
      },
      WARNING: {
        icon: "⏳",
        bgColor: "bg-warning",
        btnColor: "btn-warning",
        title: "Warning"
      },
      ERROR: {
        icon: "❌",
        bgColor: "bg-danger",
        btnColor: "btn-danger",
        title: "Error"
      },
      INFO: {
        icon: "ℹ️",
        bgColor: "bg-info",
        btnColor: "btn-info",
        title: "Information"
      },
      CONFIRM: {
        icon: "❓",
        bgColor: "bg-primary",
        btnColor: "btn-primary",
        title: "Please Confirm"
      }
    };
    return config[type] || config.INFO;
  };

  const config = getModalConfig();

  return (
    <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1060 }} tabIndex="-1">
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content">
          <div className={`modal-header text-white ${config.bgColor}`}>
            <h5 className="modal-title">
              <span className="me-2">{config.icon}</span>
              {title || config.title}
            </h5>
            <button
              type="button"
              className="btn-close btn-close-white"
              onClick={onClose}
            ></button>
          </div>
          <div className="modal-body">
            <div className="text-center mb-3">
              <div style={{ fontSize: '3rem' }}>{config.icon}</div>
            </div>
            <div className="text-center">
              {typeof message === 'string' ? (
                <p className="mb-0">{message}</p>
              ) : (
                <div>{message}</div>
              )}
            </div>
          </div>
          <div className="modal-footer">
            {type === "CONFIRM" ? (
              <>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={onClose}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className={`btn ${config.btnColor}`}
                  onClick={onConfirm}
                >
                  Confirm
                </button>
              </>
            ) : (
              <button
                type="button"
                className={`btn ${config.btnColor} w-100`}
                onClick={onConfirm || onClose}
              >
                OK
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================
// MAIN COMPONENT
// ============================================
export default function CourseApprovals({ user }) {
  const [enrollments, setEnrollments] = useState([]);
  const [filter, setFilter] = useState("ALL");
  const [loading, setLoading] = useState(true);
  const [popup, setPopup] = useState({
    show: false,
    type: "INFO",
    title: "",
    message: "",
    onConfirm: null
  });
  const [actionLoading, setActionLoading] = useState(null);
  const [currentAction, setCurrentAction] = useState(null);

  const showPopup = (type, title, message, onConfirm = null) => {
    setPopup({
      show: true,
      type,
      title,
      message,
      onConfirm
    });
  };

  const hidePopup = () => {
    setPopup({
      show: false,
      type: "INFO",
      title: "",
      message: "",
      onConfirm: null
    });
  };

  const showSuccess = (title, message) => {
    showPopup("SUCCESS", title, message);
  };

  const showError = (title, message) => {
    showPopup("ERROR", title, message);
  };

  const showConfirm = (title, message, onConfirm) => {
    showPopup("CONFIRM", title, message, onConfirm);
  };

  useEffect(() => {
    loadEnrollments();
  }, [filter]);

  const loadEnrollments = async () => {
    setLoading(true);
    try {
      const res = await getAllEnrollments();
      console.log("All enrollments load:", res);
      if (res.success) {
        let filteredData = res.data || [];

        if (filter !== "ALL") {
          filteredData = filteredData.filter(e => e.status === filter);
        }

        setEnrollments(filteredData);
      } else {
        setEnrollments([]);
        showError("Load Error", "Failed to load enrollments. Please try again.");
      }
    } catch (error) {
      console.error("Failed to load enrollments:", error);
      setEnrollments([]);
      showError("Load Error", "Failed to load enrollments. Please check your connection.");
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (enrollment) => {
    if (actionLoading === enrollment.id && currentAction === 'approve') return;

    setActionLoading(enrollment.id);
    setCurrentAction('approve');

    try {
      console.log(`Approving enrollment ${enrollment.id}`);
      const res = await approveEnrollment(enrollment.id);

      if (res.success) {
        setEnrollments(prev =>
          prev.map(e =>
            e.id === enrollment.id
              ? { ...e, status: 'APPROVED' }
              : e
          )
        );

        showSuccess(
          "Enrollment Approved!",
          <div className="text-start">
            <p><strong>Enrollment ID:</strong> #{enrollment.id}</p>
            <p><strong>Employee:</strong> #{enrollment.employeeId}</p>
            <p><strong>Course:</strong> #{enrollment.courseId}</p>
            <p className="mb-0 text-success">✅ Employee can now access the course!</p>
          </div>
        );
      } else {
        showError(
          "Approval Failed",
          <div className="text-start">
            <p><strong>Enrollment ID:</strong> #{enrollment.id}</p>
            <p><strong>Error:</strong> {res.body?.message || 'Unknown error'}</p>
            <p className="mb-0">Please try again.</p>
          </div>
        );
      }
    } catch (error) {
      console.error("Approve error:", error);
      showError(
        "Network Error",
        <div className="text-start">
          <p><strong>Enrollment ID:</strong> #{enrollment.id}</p>
          <p><strong>Error:</strong> {error.message}</p>
          <p className="mb-0">Please check your connection and try again.</p>
        </div>
      );
    } finally {
      setActionLoading(null);
      setCurrentAction(null);
    }
  };

  const handleReject = async (enrollment) => {
    if (actionLoading === enrollment.id && currentAction === 'reject') return;

    showConfirm(
      "Confirm Rejection",
      <div className="text-start">
        <p><strong>Enrollment ID:</strong> #{enrollment.id}</p>
        <p><strong>Employee:</strong> #{enrollment.employeeId}</p>
        <p><strong>Course:</strong> #{enrollment.courseId}</p>
        <div className="alert alert-warning mt-2">
          <strong>⚠️ Note:</strong> The employee will be notified about this rejection.
        </div>
      </div>,
      async () => {
        setActionLoading(enrollment.id);
        setCurrentAction('reject');

        try {
          console.log(`Rejecting enrollment ${enrollment.id}`);
          const res = await rejectEnrollment(enrollment.id);

          if (res.ok && res.body && res.body.success) {
            setEnrollments(prev =>
              prev.map(e =>
                e.id === enrollment.id
                  ? { ...e, status: 'REJECTED' }
                  : e
              )
            );

            showSuccess(
              "Enrollment Rejected",
              <div className="text-start">
                <p><strong>Enrollment ID:</strong> #{enrollment.id}</p>
                <p><strong>Employee:</strong> #{enrollment.employeeId}</p>
                <p><strong>Course:</strong> #{enrollment.courseId}</p>
                <p className="mb-0 text-danger">❌ Enrollment request has been rejected.</p>
              </div>
            );
          } else {
            showError(
              "Rejection Failed",
              <div className="text-start">
                <p><strong>Enrollment ID:</strong> #{enrollment.id}</p>
                <p><strong>Error:</strong> {res.body?.message || 'Unknown error'}</p>
                <p className="mb-0">Please try again.</p>
              </div>
            );
          }
        } catch (error) {
          console.error("Reject error:", error);
          showError(
            "Network Error",
            <div className="text-start">
              <p><strong>Enrollment ID:</strong> #{enrollment.id}</p>
              <p><strong>Error:</strong> {error.message}</p>
              <p className="mb-0">Please check your connection and try again.</p>
            </div>
          );
        } finally {
          setActionLoading(null);
          setCurrentAction(null);
        }
      }
    );
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      'PENDING_APPROVAL': { class: 'status-pending', text: '⏳ Pending' },
      'APPROVED': { class: 'status-approved', text: '✅ Approved' },
      'REJECTED': { class: 'status-rejected', text: '❌ Rejected' },
      'IN_PROGRESS': { class: 'status-progress', text: '📚 In Progress' },
      'COMPLETED': { class: 'status-completed', text: '🎓 Completed' }
    };
    const config = statusConfig[status] || { class: 'status-default', text: status };
    return <span className={`status-badge ${config.class}`}>{config.text}</span>;
  };

  if (loading) {
    return (
      <div className="text-center py-5">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
        <p className="mt-2 text-muted">Loading enrollments...</p>
      </div>
    );
  }

  return (
    <div className="container-fluid page-padding">
      <PopupModal
        show={popup.show}
        type={popup.type}
        title={popup.title}
        message={popup.message}
        onClose={hidePopup}
        onConfirm={popup.onConfirm}
      />

      {/* Header - Same style as Study Materials */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="mb-1 fw-bold">Course Enrollment Approvals</h2>
          <small className="text-muted fs-4 fw-bold">
            Review and manage course enrollment requests
          </small>
        </div>
        <div className="ms-3">
          <button className="btn-refresh-clean" onClick={loadEnrollments}>
            <span className="refresh-icon">🔄</span> Refresh
          </button>
        </div>
      </div>

      {/* Filter Section */}
      <div className="d-flex justify-content-between align-items-center flex-wrap gap-3 mb-4">
        <div className="d-flex align-items-center gap-2">
          <label className="fw-bold me-2" style={{ fontSize: "0.85rem", color: "#2d3748" }}>
            Filter by Status:
          </label>
          <select
            className="form-select filter-select-modern"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            style={{ width: "220px" }}
          >
            <option value="ALL">📋 All Enrollments</option>
            <option value="PENDING_APPROVAL">⏳ Pending Approval</option>
            <option value="APPROVED">✅ Approved</option>
            <option value="REJECTED">❌ Rejected</option>
            <option value="IN_PROGRESS">📚 In Progress</option>
            <option value="COMPLETED">🎓 Completed</option>
          </select>
        </div>
        <div>
          <small className="text-muted fs-6">
            📊 Showing {enrollments.length} enrollment(s)
          </small>
        </div>
      </div>

      {/* Table */}
      <div className="table-responsive">
        <table className="table table-bordered table-hover">
          <thead className="table-dark">
            <tr>
              <th>Enrollment ID</th>
              <th>Employee</th>
              <th>Course</th>
              <th>Progress</th>
              <th>Status</th>
              <th>Enrolled Date</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {enrollments.length === 0 ? (
              <tr>
                <td colSpan="7" className="text-center py-4">
                  <div className="text-muted">
                    <div style={{ fontSize: "3rem" }}>📭</div>
                    <h5 className="mt-2">No enrollments found</h5>
                    <p>Try adjusting your filter or refresh the page</p>
                  </div>
                </td>
              </tr>
            ) : (
              enrollments.map((enrollment) => (
                <tr key={enrollment.id}>
                  <td>
                    <span className="badge bg-secondary">#{enrollment.id}</span>
                  </td>
                  <td>
                    <div className="d-flex align-items-center gap-2">
                      <span className="badge bg-primary rounded-circle" style={{ width: "30px", height: "30px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        {enrollment.employeeId}
                      </span>
                      <span>#{enrollment.employeeId}</span>
                    </div>
                  </td>
                  <td>
                    <div className="d-flex align-items-center gap-2">
                      <span>📘</span>
                      <span>#{enrollment.courseId}</span>
                    </div>
                  </td>
                  <td>
                    <div className="d-flex align-items-center gap-2">
                      <div className="progress flex-grow-1" style={{ height: "6px" }}>
                        <div
                          className="progress-bar"
                          style={{ width: `${enrollment.progress}%`, background: "linear-gradient(90deg, #667eea, #764ba2)" }}
                        ></div>
                      </div>
                      <small className="fw-bold">{enrollment.progress}%</small>
                    </div>
                  </td>
                  <td>{getStatusBadge(enrollment.status)}</td>
                  <td>
                    {new Date(enrollment.enrolledAt).toLocaleDateString('en-GB', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric'
                    })}
                  </td>
                  <td>
                    {enrollment.status === 'PENDING_APPROVAL' ? (
                      <div className="d-flex gap-1">
                        <button
                          className="btn btn-success btn-sm"
                          onClick={() => handleApprove(enrollment)}
                          disabled={actionLoading === enrollment.id}
                          title="Approve Enrollment"
                        >
                          {actionLoading === enrollment.id && currentAction === 'approve' ? (
                            <span className="spinner-border spinner-border-sm" role="status"></span>
                          ) : (
                            '✅ Approve'
                          )}
                        </button>
                        <button
                          className="btn btn-danger btn-sm"
                          onClick={() => handleReject(enrollment)}
                          disabled={actionLoading === enrollment.id}
                          title="Reject Enrollment"
                        >
                          {actionLoading === enrollment.id && currentAction === 'reject' ? (
                            <span className="spinner-border spinner-border-sm" role="status"></span>
                          ) : (
                            '❌ Reject'
                          )}
                        </button>
                      </div>
                    ) : (
                      <span className="text-muted fst-italic">No actions available</span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Footer */}
      <div className="mt-3">
        <small className="text-muted">
          📊 Total: {enrollments.length} enrollment(s)
        </small>
      </div>

      {/* ============================================
          STYLES - Embedded in Component
          ============================================ */}
      <style>{`
        /* ========== PAGE PADDING ========== */
        .page-padding {
          padding: 2rem;
        }

        /* ========== REFRESH BUTTON ========== */
        .btn-refresh-clean {
          background: transparent;
          border: 1.5px solid #e2e8f0;
          color: #4a5568;
          padding: 0.5rem 1.2rem;
          border-radius: 50px;
          font-size: 0.85rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.3s ease;
          display: flex;
          align-items: center;
          gap: 0.4rem;
        }

        .btn-refresh-clean:hover {
          background: #f7fafc;
          border-color: #667eea;
          color: #667eea;
          transform: translateY(-2px);
          box-shadow: 0 4px 15px rgba(102, 126, 234, 0.15);
        }

        .refresh-icon {
          font-size: 1rem;
        }

        /* ========== FILTER SELECT ========== */
        .filter-select-modern {
          padding: 0.4rem 1.6rem 0.4rem 1rem;
          border: 2px solid #e2e8f0;
          border-radius: 50px;
          background: white;
          font-size: 0.85rem;
          cursor: pointer;
          transition: all 0.3s ease;
          color: #2d3748;
          font-weight: 500;
          appearance: none;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='10' viewBox='0 0 12 12'%3E%3Cpath fill='%234a5568' d='M6 8L1 3h10z'/%3E%3C/svg%3E");
          background-repeat: no-repeat;
          background-position: right 0.7rem center;
          height: 38px;
        }

        .filter-select-modern:focus {
          border-color: #667eea;
          box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
          outline: none;
        }

        .filter-select-modern:hover {
          border-color: #667eea;
        }

        /* ========== STATUS BADGES ========== */
        .status-badge {
          display: inline-flex;
          align-items: center;
          gap: 0.3rem;
          padding: 0.3rem 0.8rem;
          border-radius: 50px;
          font-size: 0.75rem;
          font-weight: 600;
          white-space: nowrap;
        }

        .status-pending {
          background: #fef3c7;
          color: #92400e;
        }

        .status-approved {
          background: #d1fae5;
          color: #065f46;
        }

        .status-rejected {
          background: #fee2e2;
          color: #991b1b;
        }

        .status-progress {
          background: #dbeafe;
          color: #1e40af;
        }

        .status-completed {
          background: #e0e7ff;
          color: #3730a3;
        }

        .status-default {
          background: #f3f4f6;
          color: #4b5563;
        }

        /* ========== TABLE STYLES ========== */
        .table {
          background: white;
          border-radius: 12px;
          overflow: hidden;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
        }

        .table thead th {
          padding: 1rem 1.25rem;
          font-weight: 700;
          font-size: 0.8rem;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          white-space: nowrap;
        }

        .table tbody td {
          padding: 0.9rem 1.25rem;
          vertical-align: middle;
        }

        .table tbody tr:hover {
          background: #f7fafc;
        }

        /* ========== RESPONSIVE ========== */
        @media (max-width: 768px) {
          .page-padding {
            padding: 1rem;
          }

          .filter-select-modern {
            width: 100% !important;
          }

          .table {
            font-size: 0.85rem;
          }

          .table thead th,
          .table tbody td {
            padding: 0.6rem 0.8rem;
          }
        }

        @media (max-width: 576px) {
          .page-padding {
            padding: 0.6rem;
          }

          .btn-refresh-clean {
            padding: 0.3rem 0.8rem;
            font-size: 0.75rem;
          }

          .table {
            font-size: 0.75rem;
          }

          .table thead th,
          .table tbody td {
            padding: 0.4rem 0.6rem;
          }

          .status-badge {
            font-size: 0.65rem;
            padding: 0.2rem 0.5rem;
          }
        }
      `}</style>
    </div>
  );
}