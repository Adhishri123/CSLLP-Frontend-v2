// AdminCertifications.jsx
import React, { useState, useEffect } from 'react';
import { certificateAPI, getUserById, getCourseById } from '../services/api';
import './AdminCertifications.css';

export default function AdminCertifications({ user }) {
  const [certificates, setCertificates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    employeeName: '',
    courseName: '',
    status: 'all'
  });
  const [selectedCertificate, setSelectedCertificate] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState('view');
  const [generating, setGenerating] = useState(false);
  const [revoking, setRevoking] = useState(false);
  const [downloading, setDownloading] = useState(null);
  const [activeTab, setActiveTab] = useState('manual');
  const [certificateImageUrl, setCertificateImageUrl] = useState(null); // Added state for certificate image
  const [autoGenerateForm, setAutoGenerateForm] = useState({
    employeeId: '',
    courseId: ''
  });
  const [manualGenerateForm, setManualGenerateForm] = useState({
    employeeId: '',
    courseId: '',
    issueDate: '',
    expiryDate: ''
  });

  const userRole = localStorage.getItem('userRole') || 'ADMIN';

  useEffect(() => {
    fetchCertificates();
  }, [filters.status]);

  // Reset active tab when modal opens
  useEffect(() => {
    if (showModal && modalMode === 'generate') {
      setActiveTab('manual');
    }
  }, [showModal, modalMode]);

  // Cleanup URL object when component unmounts or certificate image changes
  useEffect(() => {
    return () => {
      if (certificateImageUrl) {
        URL.revokeObjectURL(certificateImageUrl);
      }
    };
  }, [certificateImageUrl]);

  const fetchCertificates = async () => {
  try {
    setLoading(true);
    setError(null);

    // Fetch everything from backend
    const response = await certificateAPI.adminGetAllCertificates({
      status: filters.status !== "all" ? filters.status : undefined
    });

    if (response?.success && Array.isArray(response.data)) {

      // Add employee & course names
      const enriched = await enrichCertificatesWithDetails(response.data);

      // Filter on frontend
      const filteredCertificates = enriched.filter((cert) => {

        const employeeMatch =
          !filters.employeeName ||
          cert.employeeName
            ?.toLowerCase()
            .includes(filters.employeeName.toLowerCase());

        const courseMatch =
          !filters.courseName ||
          cert.courseName
            ?.toLowerCase()
            .includes(filters.courseName.toLowerCase());

        return employeeMatch && courseMatch;
      });

      setCertificates(filteredCertificates);

    } else {
      setCertificates([]);
      setError("No certificates found");
    }

  } catch (err) {
    console.error("Error fetching certificates:", err);
    setError("Failed to load certificates");
  } finally {
    setLoading(false);
  }
};

  const enrichCertificatesWithDetails = async (certificates) => {
    const enriched = [];
    for (const cert of certificates) {
      try {
        const [employeeData, courseData] = await Promise.all([
          getUserById(cert.employeeId),
          getCourseById(cert.courseId)
        ]);
        
        enriched.push({
          ...cert,
          employeeName: employeeData?.data?.fullName || 
                       employeeData?.data?.name || 
                       employeeData?.data?.firstName || 
                       `Employee ${cert.employeeId}`,
          courseName: courseData?.data?.title || 
                     courseData?.data?.name || 
                     `Course ${cert.courseId}`,
          employeeEmail: employeeData?.data?.email || 'N/A'
        });
      } catch (error) {
        enriched.push({
          ...cert,
          employeeName: `Employee ${cert.employeeId}`,
          courseName: `Course ${cert.courseId}`,
          employeeEmail: 'N/A'
        });
      }
    }
    return enriched;
  };

  // Function to fetch certificate image/PDF
  const fetchCertificateImage = async (certificateId) => {
    try {
      const response = await certificateAPI.adminDownloadCertificate(certificateId);
      if (response.ok && response.data instanceof Blob) {
        const url = URL.createObjectURL(response.data);
        setCertificateImageUrl(url);
      }
    } catch (err) {
      console.error('Error fetching certificate image:', err);
      setCertificateImageUrl(null);
    }
  };

  const handleGenerateCertificate = async () => {
    try {
      setGenerating(true);
      setError(null);
      
      const requestData = {
        employeeId: parseInt(manualGenerateForm.employeeId),
        courseId: parseInt(manualGenerateForm.courseId),
        issueDate: manualGenerateForm.issueDate || undefined,
        expiryDate: manualGenerateForm.expiryDate || undefined
      };
      
      const response = await certificateAPI.adminGenerateCertificate(requestData);
      
      if (response?.success) {
        alert('✅ Certificate generated successfully!');
        setShowModal(false);
        fetchCertificates();
        resetForms();
      } else {
        setError(response?.message || 'Failed to generate certificate');
      }
    } catch (err) {
      console.error('Error generating certificate:', err);
      setError(err.response?.data?.message || 'Failed to generate certificate');
    } finally {
      setGenerating(false);
    }
  };

  const handleAutoGenerate = async () => {
    try {
      setGenerating(true);
      setError(null);
      
      const employeeId = parseInt(autoGenerateForm.employeeId);
      const courseId = parseInt(autoGenerateForm.courseId);
      
      const response = await certificateAPI.adminAutoGenerateCertificate(employeeId, courseId);
      
      if (response?.success) {
        alert('✅ Certificate auto-generated successfully!');
        setShowModal(false);
        fetchCertificates();
        resetForms();
      } else {
        setError(response?.message || 'Failed to auto-generate certificate');
      }
    } catch (err) {
      console.error('Error auto-generating certificate:', err);
      setError(err.response?.data?.message || 'Failed to auto-generate certificate');
    } finally {
      setGenerating(false);
    }
  };

  const handleRevokeCertificate = async (certificateId) => {
    if (!window.confirm('⚠️ Are you sure you want to revoke this certificate?\n\nThis action cannot be undone.')) {
      return;
    }
    
    try {
      setRevoking(true);
      setError(null);
      
      const response = await certificateAPI.adminRevokeCertificate(certificateId);
      
      if (response?.success) {
        alert('✅ Certificate revoked successfully!');
        fetchCertificates();
      } else {
        setError(response?.message || 'Failed to revoke certificate');
      }
    } catch (err) {
      console.error('Error revoking certificate:', err);
      setError(err.response?.data?.message || 'Failed to revoke certificate');
    } finally {
      setRevoking(false);
    }
  };

  const handleDownloadCertificate = async (certificateId) => {
    try {
      setDownloading(certificateId);
      
      const response = await certificateAPI.adminDownloadCertificate(certificateId);
      
      if (response.ok && response.data instanceof Blob) {
        const blob = response.data;
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `certificate_${certificateId}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
        
        alert('✅ Certificate downloaded successfully!');
      } else {
        throw new Error('Download failed');
      }
    } catch (err) {
      console.error('Error downloading certificate:', err);
      alert('❌ Failed to download certificate');
    } finally {
      setDownloading(null);
    }
  };

  const resetForms = () => {
    setManualGenerateForm({
      employeeId: '',
      courseId: '',
      issueDate: '',
      expiryDate: ''
    });
    setAutoGenerateForm({
      employeeId: '',
      courseId: ''
    });
  };

  const openGenerateModal = () => {
    setModalMode('generate');
    setShowModal(true);
    setActiveTab('manual');
    resetForms();
    // Clear certificate image when opening generate modal
    if (certificateImageUrl) {
      URL.revokeObjectURL(certificateImageUrl);
      setCertificateImageUrl(null);
    }
  };

  const openViewModal = (certificate) => {
    setSelectedCertificate(certificate);
    setModalMode('view');
    setShowModal(true);
    // Fetch certificate image/PDF when viewing
    fetchCertificateImage(certificate.id);
  };

  const getStatusBadge = (status) => {
    const styles = {
      ACTIVE: 'bg-success',
      REVOKED: 'bg-danger',
      EXPIRED: 'bg-warning text-dark'
    };
    return styles[status] || 'bg-secondary';
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch {
      return 'Invalid Date';
    }
  };

  if (loading) {
    return (
      <div className="container-fluid">
        <div className="text-center p-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-3">Loading certificates...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container-fluid admin-certifications">
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="mb-1 fw-bold">📜 Certificate Management</h2>
          <small className="text-muted">
            Generate, manage, and revoke certificates for employees
          </small>
        </div>
        <div className="d-flex gap-2">
          <button 
            className="btn btn-primary"
            onClick={openGenerateModal}
          >
            ➕ Generate Certificate
          </button>
          <button 
            className="btn btn-outline-secondary"
            onClick={fetchCertificates}
          >
            🔄 Refresh
          </button>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="alert alert-danger alert-dismissible fade show">
          <strong>Error:</strong> {error}
          <button type="button" className="btn-close" onClick={() => setError(null)}></button>
        </div>
      )}

      {/* Filters */}
      <div className="card mb-4">
        <div className="card-body">
          <div className="row g-3">
            <div className="col-md-4">
              <label className="form-label fw-bold">Employee Name</label>
              <input
                type="text"
                className="form-control"
                placeholder="Search by employee name..."
                value={filters.employeeName}
                onChange={(e) => setFilters({...filters, employeeName: e.target.value})}
              />
            </div>
            <div className="col-md-4">
              <label className="form-label fw-bold">Course Name</label>
              <input
                type="text"
                className="form-control"
                placeholder="Search by course name..."
                value={filters.courseName}
                onChange={(e) => setFilters({...filters, courseName: e.target.value})}
              />
            </div>
            <div className="col-md-3">
              <label className="form-label fw-bold">Status</label>
              <select
                className="form-select"
                value={filters.status}
                onChange={(e) => setFilters({...filters, status: e.target.value})}
              >
                <option value="all">All Status</option>
                <option value="ACTIVE">Active</option>
                <option value="REVOKED">Revoked</option>
                <option value="EXPIRED">Expired</option>
              </select>
            </div>
            <div className="col-md-1 d-flex align-items-end">
              <button 
                className="btn btn-primary w-100"
                onClick={fetchCertificates}
              >
                🔍
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="row mb-4">
        <div className="col-md-3">
          <div className="card bg-primary text-white">
            <div className="card-body">
              <h5 className="card-title">Total</h5>
              <h3>{certificates.length}</h3>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card bg-success text-white">
            <div className="card-body">
              <h5 className="card-title">Active</h5>
              <h3>{certificates.filter(c => c.status === 'ACTIVE').length}</h3>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card bg-danger text-white">
            <div className="card-body">
              <h5 className="card-title">Revoked</h5>
              <h3>{certificates.filter(c => c.status === 'REVOKED').length}</h3>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card bg-warning text-dark">
            <div className="card-body">
              <h5 className="card-title">Expired</h5>
              <h3>{certificates.filter(c => c.status === 'EXPIRED').length}</h3>
            </div>
          </div>
        </div>
      </div>

      {/* Certificates Table */}
      <div className="card">
        <div className="card-body">
          <div className="table-responsive">
            <table className="table table-hover">
              <thead className="table-light">
                <tr>
                  <th>ID</th>
                  <th>Employee</th>
                  <th>Employee ID</th>
                  <th>Course</th>
                  <th>Issue Date</th>
                  <th>Expiry Date</th>
                  <th>Status</th>
                  <th style={{ minWidth: '200px' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {certificates.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="text-center py-4">
                      <div className="text-muted">
                        <div style={{ fontSize: '3rem' }}>📋</div>
                        <p className="mt-2">No certificates found</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  certificates.map((cert) => (
                    <tr key={cert.id}>
                      <td>
                        <span className="font-monospace">#{cert.id}</span>
                      </td>
                      <td>
                        <div>
                          <div className="fw-bold">{cert.employeeName}</div>
                          <small className="text-muted">{cert.employeeEmail}</small>
                        </div>
                      </td>
                      <td>
                        <span className="badge bg-secondary">ID: {cert.employeeId}</span>
                      </td>
                      <td>
                        <div>
                          <div>{cert.courseName}</div>
                          <small className="text-muted">Course ID: {cert.courseId}</small>
                        </div>
                      </td>
                      <td>{formatDate(cert.issueDate)}</td>
                      <td>{cert.expiryDate ? formatDate(cert.expiryDate) : 'N/A'}</td>
                      <td>
                        <span className={`badge ${getStatusBadge(cert.status)}`} style={{ padding: '6px 12px' }}>
                          {cert.status}
                        </span>
                      </td>
                      <td>
                        <div className="action-buttons">
                          {/* View Button */}
                          <button
                            className="btn btn-sm btn-outline-primary"
                            onClick={() => openViewModal(cert)}
                          >
                            View
                          </button>
                          
                          {/* Download Button */}
                          <button
                            className="btn btn-sm btn-outline-success"
                            onClick={() => handleDownloadCertificate(cert.id)}
                            disabled={downloading === cert.id}
                          >
                            {downloading === cert.id ? (
                              <span className="spinner-border spinner-border-sm"></span>
                            ) : (
                              'Download'
                            )}
                          </button>
                          
                          {/* Revoke Button - Only for Admin and Active certificates */}
                          {userRole === 'ADMIN' && cert.status === 'ACTIVE' && (
                            <button
                              className="btn btn-sm btn-outline-danger"
                              onClick={() => handleRevokeCertificate(cert.id)}
                              disabled={revoking}
                            >
                              {revoking ? (
                                <span className="spinner-border spinner-border-sm"></span>
                              ) : (
                                'Revoke'
                              )}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Generate/View Modal */}
      {showModal && (
        <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }} tabIndex="-1">
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  {modalMode === 'generate' ? '🎯 Generate Certificate' : '📄 Certificate Details'}
                </h5>
                <button 
                  type="button" 
                  className="btn-close" 
                  onClick={() => {
                    setShowModal(false);
                    // Cleanup certificate image when closing modal
                    if (certificateImageUrl) {
                      URL.revokeObjectURL(certificateImageUrl);
                      setCertificateImageUrl(null);
                    }
                  }}
                ></button>
              </div>
              <div className="modal-body">
                {modalMode === 'generate' && (
                  <div>
                    {/* Tab Navigation */}
                    <ul className="nav nav-tabs mb-3">
                      <li className="nav-item">
                        <button 
                          className={`nav-link ${activeTab === 'manual' ? 'active' : ''}`}
                          onClick={() => setActiveTab('manual')}
                          type="button"
                        >
                          Manual Generate
                        </button>
                      </li>
                      <li className="nav-item">
                        <button 
                          className={`nav-link ${activeTab === 'auto' ? 'active' : ''}`}
                          onClick={() => setActiveTab('auto')}
                          type="button"
                        >
                          Auto Generate
                        </button>
                      </li>
                    </ul>

                    {/* Tab Content */}
                    <div className="tab-content">
                      {/* Manual Generate Tab */}
                      <div className={`tab-pane fade ${activeTab === 'manual' ? 'show active' : ''}`}>
                        <div className="alert alert-info">
                          <strong>ℹ️ Manual Generation:</strong> Generate a certificate manually for any employee.
                        </div>
                        <div className="mb-3">
                          <label className="form-label fw-bold">Employee ID *</label>
                          <input
                            type="number"
                            className="form-control"
                            placeholder="Enter employee ID"
                            value={manualGenerateForm.employeeId}
                            onChange={(e) => setManualGenerateForm({
                              ...manualGenerateForm,
                              employeeId: e.target.value
                            })}
                          />
                        </div>
                        <div className="mb-3">
                          <label className="form-label fw-bold">Course ID *</label>
                          <input
                            type="number"
                            className="form-control"
                            placeholder="Enter course ID"
                            value={manualGenerateForm.courseId}
                            onChange={(e) => setManualGenerateForm({
                              ...manualGenerateForm,
                              courseId: e.target.value
                            })}
                          />
                        </div>
                        <div className="mb-3">
                          <label className="form-label fw-bold">Issue Date (Optional)</label>
                          <input
                            type="date"
                            className="form-control"
                            value={manualGenerateForm.issueDate}
                            onChange={(e) => setManualGenerateForm({
                              ...manualGenerateForm,
                              issueDate: e.target.value
                            })}
                          />
                        </div>
                        <div className="mb-3">
                          <label className="form-label fw-bold">Expiry Date (Optional)</label>
                          <input
                            type="date"
                            className="form-control"
                            value={manualGenerateForm.expiryDate}
                            onChange={(e) => setManualGenerateForm({
                              ...manualGenerateForm,
                              expiryDate: e.target.value
                            })}
                          />
                        </div>
                        <button
                          className="btn btn-primary w-100"
                          onClick={handleGenerateCertificate}
                          disabled={generating || !manualGenerateForm.employeeId || !manualGenerateForm.courseId}
                        >
                          {generating ? (
                            <>
                              <span className="spinner-border spinner-border-sm me-2"></span>
                              Generating...
                            </>
                          ) : (
                            '🚀 Generate Certificate'
                          )}
                        </button>
                      </div>

                      {/* Auto Generate Tab */}
                      <div className={`tab-pane fade ${activeTab === 'auto' ? 'show active' : ''}`}>
                        <div className="alert alert-success">
                          <strong>🤖 Auto Generate:</strong> System checks eligibility and generates certificate.
                        </div>
                        <div className="mb-3">
                          <label className="form-label fw-bold">Employee ID *</label>
                          <input
                            type="number"
                            className="form-control"
                            placeholder="Enter employee ID"
                            value={autoGenerateForm.employeeId}
                            onChange={(e) => setAutoGenerateForm({
                              ...autoGenerateForm,
                              employeeId: e.target.value
                            })}
                          />
                        </div>
                        <div className="mb-3">
                          <label className="form-label fw-bold">Course ID *</label>
                          <input
                            type="number"
                            className="form-control"
                            placeholder="Enter course ID"
                            value={autoGenerateForm.courseId}
                            onChange={(e) => setAutoGenerateForm({
                              ...autoGenerateForm,
                              courseId: e.target.value
                            })}
                          />
                        </div>
                        <button
                          className="btn btn-success w-100"
                          onClick={handleAutoGenerate}
                          disabled={generating || !autoGenerateForm.employeeId || !autoGenerateForm.courseId}
                        >
                          {generating ? (
                            <>
                              <span className="spinner-border spinner-border-sm me-2"></span>
                              Auto-Generating...
                            </>
                          ) : (
                            '⚡ Auto Generate Certificate'
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {modalMode === 'view' && selectedCertificate && (
                  <div>
                    {/* Certificate Preview - Shows the actual certificate */}
                    {certificateImageUrl && (
                      <div className="certificate-preview mb-4" style={{ 
                        border: '2px solid #ddd', 
                        borderRadius: '10px', 
                        overflow: 'hidden',
                        background: 'white',
                        boxShadow: '0 4px 8px rgba(0,0,0,0.1)'
                      }}>
                        <iframe 
                          src={certificateImageUrl} 
                          style={{ width: '100%', height: '500px', border: 'none' }}
                          title="Certificate Preview"
                        />
                        <div className="text-center p-2 bg-light">
                          <small className="text-muted">📄 Certificate Preview</small>
                        </div>
                      </div>
                    )}

                    {/* Fallback: If certificate image fails to load, show styled certificate */}
                    {!certificateImageUrl && (
                      <div className="certificate-preview mb-4" style={{ 
                        border: '2px solid #ddd', 
                        borderRadius: '10px', 
                        padding: '20px',
                        background: 'white',
                        boxShadow: '0 4px 8px rgba(0,0,0,0.1)'
                      }}>
                        <div className="text-center mb-3">
                          <h3 className="text-primary">📜 Certificate of Completion</h3>
                          <hr />
                        </div>
                        
                        <div className="row">
                          <div className="col-12 text-center">
                            <h5>This certificate is awarded to</h5>
                            <h2 className="fw-bold text-success">{selectedCertificate.employeeName}</h2>
                            <p className="text-muted">Employee ID: {selectedCertificate.employeeId}</p>
                            <hr />
                            <h5>For successfully completing</h5>
                            <h4 className="fw-bold">{selectedCertificate.courseName}</h4>
                            <p className="text-muted">Course ID: {selectedCertificate.courseId}</p>
                            <hr />
                            <div className="row mt-3">
                              <div className="col-md-6">
                                <p><strong>Issue Date:</strong> {formatDate(selectedCertificate.issueDate)}</p>
                              </div>
                              <div className="col-md-6">
                                <p><strong>Expiry Date:</strong> {selectedCertificate.expiryDate ? formatDate(selectedCertificate.expiryDate) : 'N/A'}</p>
                              </div>
                            </div>
                            <div className="mt-3">
                              <p><strong>Verification Code:</strong></p>
                              <code className="bg-light p-2 d-inline-block rounded" style={{ fontSize: '16px' }}>
                                {selectedCertificate.verificationCode || 'N/A'}
                              </code>
                            </div>
                            <div className="mt-3">
                              <span className={`badge ${getStatusBadge(selectedCertificate.status)}`} style={{ padding: '8px 15px', fontSize: '14px' }}>
                                {selectedCertificate.status}
                              </span>
                            </div>
                            <div className="mt-3">
                              <small className="text-muted">Certificate ID: #{selectedCertificate.id}</small>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Certificate Details in a card */}
                    <div className="card">
                      <div className="card-header bg-light">
                        <h6 className="mb-0">📋 Certificate Details</h6>
                      </div>
                      <div className="card-body">
                        <div className="row">
                          <div className="col-md-6">
                            <div className="mb-2">
                              <label className="fw-bold">Certificate ID:</label>
                              <div className="font-monospace">{selectedCertificate.id}</div>
                            </div>
                            <div className="mb-2">
                              <label className="fw-bold">Status:</label>
                              <div>
                                <span className={`badge ${getStatusBadge(selectedCertificate.status)}`} style={{ padding: '6px 12px' }}>
                                  {selectedCertificate.status}
                                </span>
                              </div>
                            </div>
                            <div className="mb-2">
                              <label className="fw-bold">Employee Name:</label>
                              <div>{selectedCertificate.employeeName}</div>
                            </div>
                            <div className="mb-2">
                              <label className="fw-bold">Employee ID:</label>
                              <div>{selectedCertificate.employeeId}</div>
                            </div>
                          </div>
                          <div className="col-md-6">
                            <div className="mb-2">
                              <label className="fw-bold">Course Name:</label>
                              <div>{selectedCertificate.courseName}</div>
                            </div>
                            <div className="mb-2">
                              <label className="fw-bold">Course ID:</label>
                              <div>{selectedCertificate.courseId}</div>
                            </div>
                            <div className="mb-2">
                              <label className="fw-bold">Issue Date:</label>
                              <div>{formatDate(selectedCertificate.issueDate)}</div>
                            </div>
                            <div className="mb-2">
                              <label className="fw-bold">Expiry Date:</label>
                              <div>{selectedCertificate.expiryDate ? formatDate(selectedCertificate.expiryDate) : 'N/A'}</div>
                            </div>
                          </div>
                        </div>
                        <div className="row mt-2">
                          <div className="col-12">
                            <label className="fw-bold">Verification Code:</label>
                            <div>
                              <code className="bg-light p-2 d-inline-block rounded">
                                {selectedCertificate.verificationCode || 'N/A'}
                              </code>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              <div className="modal-footer">
                <button 
                  type="button" 
                  className="btn btn-secondary" 
                  onClick={() => {
                    setShowModal(false);
                    // Cleanup certificate image when closing modal
                    if (certificateImageUrl) {
                      URL.revokeObjectURL(certificateImageUrl);
                      setCertificateImageUrl(null);
                    }
                  }}
                >
                  Close
                </button>
                {modalMode === 'view' && selectedCertificate && (
                  <>
                    <button
                      className="btn btn-success"
                      onClick={() => handleDownloadCertificate(selectedCertificate.id)}
                      disabled={downloading === selectedCertificate.id}
                    >
                      {downloading === selectedCertificate.id ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-2"></span>
                          Downloading...
                        </>
                      ) : (
                        '📥 Download PDF'
                      )}
                    </button>
                    {userRole === 'ADMIN' && selectedCertificate.status === 'ACTIVE' && (
                      <button
                        className="btn btn-danger"
                        onClick={() => handleRevokeCertificate(selectedCertificate.id)}
                        disabled={revoking}
                      >
                        {revoking ? (
                          <>
                            <span className="spinner-border spinner-border-sm me-2"></span>
                            Revoking...
                          </>
                        ) : (
                          '🔒 Revoke Certificate'
                        )}
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}