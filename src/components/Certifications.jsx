// Certifications.jsx (Employee Certifications Dashboard)
import React, { useState, useEffect } from 'react';
import { certificateAPI, getUserById, getCourseById } from '../services/api';
import './Certifications.css';

export default function Certifications({ user }) {
  const [certificates, setCertificates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all');
  const [downloading, setDownloading] = useState(null);
  const [selectedCertificate, setSelectedCertificate] = useState(null);
  const [showPreview, setShowPreview] = useState(false);
  const [debugInfo, setDebugInfo] = useState('');
  const [certificateImageUrl, setCertificateImageUrl] = useState(null);

  // Company logo path
  const companyLogo = '/images/logo.png';

  useEffect(() => {
    fetchCertificates();
  }, [user]);

  // Cleanup URL object when component unmounts or certificate image changes
  useEffect(() => {
    return () => {
      if (certificateImageUrl) {
        URL.revokeObjectURL(certificateImageUrl);
      }
    };
  }, [certificateImageUrl]);

  // Function to fetch employee details with enhanced debugging
  const fetchEmployeeDetails = async (employeeId) => {
    try {
      console.log('🔍 Fetching employee details for:', employeeId);
      const response = await getUserById(employeeId);
      console.log('📡 Employee API Response:', response);

      if (response && response.success && response.data) {
        console.log('✅ Employee data received:', response.data);
        return response.data;
      } else {
        console.log('❌ No employee data in response');
        return null;
      }
    } catch (error) {
      console.error('❌ Error fetching employee details:', error);
      return null;
    }
  };

  // Function to fetch course details with enhanced debugging
  const fetchCourseDetails = async (courseId) => {
    try {
      console.log('🔍 Fetching course details for:', courseId);
      const response = await getCourseById(courseId);
      console.log('📡 Course API Response:', response);

      if (response && response.success && response.data) {
        console.log('✅ Course data received:', response.data);
        return response.data;
      } else {
        console.log('❌ No course data in response');
        return null;
      }
    } catch (error) {
      console.error('❌ Error fetching course details:', error);
      return null;
    }
  };

  // Enhanced function to enrich certificate data with names
  const enrichCertificateData = async (certificates) => {
    const enrichedCertificates = [];
    const debugLog = [];

    for (const cert of certificates) {
      try {
        console.log(`🔄 Enriching certificate ${cert.id} for employee: ${cert.employeeId}, course: ${cert.courseId}`);

        const [employeeData, courseData] = await Promise.all([
          fetchEmployeeDetails(cert.employeeId),
          fetchCourseDetails(cert.courseId)
        ]);

        const debugEntry = {
          certificateId: cert.id,
          employeeId: cert.employeeId,
          courseId: cert.courseId,
          employeeData: employeeData ? '✅ Received' : '❌ Missing',
          courseData: courseData ? '✅ Received' : '❌ Missing',
          employeeFields: employeeData ? Object.keys(employeeData) : [],
          courseFields: courseData ? Object.keys(courseData) : []
        };

        debugLog.push(debugEntry);
        console.log('📊 Data enrichment debug:', debugEntry);

        let employeeName = `Employee ${cert.employeeId}`;

        if (employeeData) {
          const nameFields = ['fullName', 'name', 'employeeName', 'username', 'firstName', 'lastName'];
          for (const field of nameFields) {
            if (employeeData[field] && employeeData[field] !== 'null' && employeeData[field].trim() !== '') {
              if (field === 'fullName') {
                employeeName = `${employeeData.fullName}`;
              } else if (field === 'firstName' && !employeeData.lastName) {
                employeeName = employeeData.firstName;
              } else {
                employeeName = employeeData[field];
              }
              console.log(`✅ Using employee name from field '${field}': ${employeeName}`);
              break;
            }
          }
        }

        let courseName = `Course ${cert.courseId}`;
        if (courseData) {
          const courseFields = ['title', 'courseName', 'name', 'courseTitle'];
          for (const field of courseFields) {
            if (courseData[field] && courseData[field] !== 'null' && courseData[field].trim() !== '') {
              courseName = courseData[field];
              console.log(`✅ Using course name from field '${field}': ${courseName}`);
              break;
            }
          }
        }

        const enrichedCert = {
          ...cert,
          employeeName: employeeName,
          courseName: courseName,
          courseDescription: courseData?.description || '',
          _debug: {
            employeeDataReceived: !!employeeData,
            courseDataReceived: !!courseData,
            finalEmployeeName: employeeName,
            finalCourseName: courseName
          }
        };

        console.log('✅ Final enriched certificate:', enrichedCert);
        enrichedCertificates.push(enrichedCert);
      } catch (error) {
        console.error('❌ Error enriching certificate:', cert.id, error);
        enrichedCertificates.push({
          ...cert,
          employeeName: `Employee ${cert.employeeId}`,
          courseName: `Course ${cert.courseId}`,
          courseDescription: '',
          _error: error.message
        });
      }
    }

    setDebugInfo(JSON.stringify(debugLog, null, 2));
    return enrichedCertificates;
  };

  const fetchCertificates = async () => {
    try {
      setLoading(true);
      setError(null);
      setDebugInfo('');

      if (!user || !user.id) {
        setError('User information not available');
        setLoading(false);
        return;
      }

      console.log('🔍 Fetching certificates for employee:', user.id);
      console.log('👤 Current user object:', user);

      const response = await certificateAPI.getEmployeeCertificates(user.id);

      console.log('📦 Certificate API Response:', response);

      if (response?.success && Array.isArray(response.data)) {
        console.log('✅ Certificates received:', response.data);

        const basicCertificates = response.data.map(cert => ({
          id: cert.id,
          employeeId: cert.employeeId,
          courseId: cert.courseId,
          issueDate: cert.issueDate,
          expiryDate: cert.expiryDate,
          status: cert.status?.toLowerCase() || 'active',
          verificationCode: cert.verificationCode,
          certificatePath: cert.certificatePath,
          createdAt: cert.createdAt,
          updatedAt: cert.updatedAt,
          employeeName: `Employee ${cert.employeeId}`,
          courseName: `Course ${cert.courseId}`,
          courseDescription: 'loading...'
        }));

        console.log('📋 Basic certificates before enrichment:', basicCertificates);

        const enrichedCertificates = await enrichCertificateData(basicCertificates);

        console.log('🎉 Final enriched certificates:', enrichedCertificates);
        setCertificates(enrichedCertificates);

        const hasPlaceholderNames = enrichedCertificates.some(cert =>
          cert.employeeName.includes('Employee ') || cert.courseName.includes('Course ')
        );

        if (hasPlaceholderNames) {
          console.warn('⚠️ Some certificates still have placeholder names');
          setError('Some certificate data could not be loaded completely. Showing available information.');
        }
      } else {
        console.log('❌ No certificates found or invalid response');
        setCertificates([]);
        setError('No certificates found for your account.');
      }
    } catch (err) {
      console.error('❌ Error fetching certificates:', err);

      if (err.response?.status === 404) {
        setError('No certificates found for your account.');
      } else if (err.message?.includes('Failed to fetch')) {
        setError('Unable to connect to certificate service. Please check if the service is running.');
      } else if (err.response?.status === 500) {
        setError('Certificate service error. Please try again later.');
      } else if (err.response?.data?.message) {
        setError(err.response.data.message);
      } else {
        setError('Failed to load certificates. Please try again later.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Function to fetch certificate image/PDF for preview
  const fetchCertificateImage = async (certificateId) => {
    try {
      const response = await certificateAPI.downloadEmployeeCertificate(
        user.id,
        certificateId
      );
      if (response.ok && response.data instanceof Blob) {
        const url = URL.createObjectURL(response.data);
        setCertificateImageUrl(url);
      }
    } catch (err) {
      console.error('Error fetching certificate image:', err);
      setCertificateImageUrl(null);
    }
  };

  const handleDownload = async (certificate) => {
    try {
      setDownloading(certificate.id);

      console.log('📥 Downloading certificate:', certificate.id, 'for employee:', user.id);

      await new Promise(resolve => setTimeout(resolve, 500));

      const response = await certificateAPI.downloadEmployeeCertificate(
        user.id,
        certificate.id
      );

      if (response.ok && response.data instanceof Blob) {
        const blob = response.data;
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;

        const courseNameSlug = certificate.courseName
          ? certificate.courseName.replace(/[^a-zA-Z0-9]/g, '_')
          : 'certificate';

        link.download = `CSLLP-Certificate-${courseNameSlug}-${certificate.verificationCode}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);

        console.log('✅ Certificate downloaded successfully');

        alert(`✅ Certificate downloaded successfully!\n\nFile: ${link.download}`);
      } else {
        throw new Error(`Download failed with status: ${response.status}`);
      }

    } catch (err) {
      console.error('❌ Download error:', err);

      if (err.response?.status === 404) {
        alert('❌ Certificate file not found. The PDF may not have been generated yet. Please contact support.');
      } else if (err.response?.status === 403) {
        alert('🚫 You are not authorized to download this certificate.');
      } else if (err.response?.status === 500) {
        alert('⚙️ Certificate generation failed. Please try again or contact support.');
      } else if (err.response?.data?.message) {
        alert(`❌ Download failed: ${err.response.data.message}`);
      } else {
        alert('❌ Failed to download certificate. Please try again later.');
      }
    } finally {
      setDownloading(null);
    }
  };

  const handlePreview = (certificate) => {
    setSelectedCertificate(certificate);
    setShowPreview(true);
    // Fetch certificate image/PDF when viewing
    fetchCertificateImage(certificate.id);
  };

  const handleShare = (certificate) => {
    const shareText = `I earned a certificate from Config Server LLP!\n\n` +
      `Certificate of Completion\n` +
      `Awarded to: ${certificate.employeeName}\n` +
      `Course: ${certificate.courseName}\n` +
      `Issued: ${formatDate(certificate.issueDate)}\n` +
      `Verification Code: ${certificate.verificationCode}\n\n` +
      `Issued by Config Server LLP - Premier Technology Solutions & Training`;

    if (navigator.share) {
      navigator.share({
        title: `Config Server LLP Certificate - ${certificate.courseName}`,
        text: shareText,
        url: window.location.origin
      }).catch(() => {
        copyToClipboard(shareText);
      });
    } else {
      copyToClipboard(shareText);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text).then(() => {
      alert('Certificate details copied to clipboard! You can now share them.');
    }).catch(() => {
      alert(`Certificate Details:\n\n${text}`);
    });
  };

  const handleRefresh = () => {
    fetchCertificates();
  };

  const getStatusBadgeClass = (status) => {
    switch (status?.toLowerCase()) {
      case 'active': return 'bg-success';
      case 'expired': return 'bg-warning text-dark';
      case 'revoked': return 'bg-danger';
      default: return 'bg-secondary';
    }
  };

  const getStatusDisplayText = (status) => {
    switch (status?.toLowerCase()) {
      case 'active': return 'ACTIVE';
      case 'expired': return 'EXPIRED';
      case 'revoked': return 'REVOKED';
      default: return status?.toUpperCase() || 'UNKNOWN';
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch (error) {
      return 'Invalid Date';
    }
  };

  const formatMonthYear = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long'
      });
    } catch (error) {
      return 'Invalid Date';
    }
  };

  const filteredCertificates = certificates.filter(cert =>
    filter === 'all' || cert.status?.toLowerCase() === filter
  );

  const activeCertificates = certificates.filter(cert => cert.status?.toLowerCase() === 'active');
  const expiredCertificates = certificates.filter(cert => cert.status?.toLowerCase() === 'expired');
  const revokedCertificates = certificates.filter(cert => cert.status?.toLowerCase() === 'revoked');

  if (loading) {
    return (
      <div className="container-fluid">
        <div className="text-center p-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-3">Loading your certificates...</p>
        </div>
      </div>
    );
  }

  if (error && certificates.length === 0) {
    return (
      <div className="container-fluid">
        <div className="alert alert-danger">
          <h5>⚠️ Unable to Load Certificates</h5>
          <p>{error}</p>
          <div className="mt-3">
            <button className="btn btn-outline-danger me-2" onClick={handleRefresh}>
              Try Again
            </button>
            <button className="btn btn-secondary" onClick={() => setError(null)}>
              Dismiss
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container-fluid page-padding employee-certifications">
      {/* Header - Same style as Study Materials */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="mb-1 fw-bold">My Certifications</h2>
          <small className="text-muted fs-4 fw-bold">
            View and download your course completion certificates
          </small>
        </div>
        <div className="d-flex gap-2 align-items-center">
          <select
            className="form-select filter-select-modern"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            style={{ width: 'auto' }}
          >
            <option value="all">📋 All ({certificates.length})</option>
            <option value="active">✅ Active ({activeCertificates.length})</option>
            <option value="expired">⏰ Expired ({expiredCertificates.length})</option>
            <option value="revoked">🚫 Revoked ({revokedCertificates.length})</option>
          </select>
          <button
            className="btn-refresh-clean"
            onClick={handleRefresh}
            disabled={loading}
          >
            <span className="refresh-icon">🔄</span> Refresh
          </button>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="alert alert-warning alert-dismissible fade show">
          <strong>Note:</strong> {error}
          <button type="button" className="btn-close" onClick={() => setError(null)}></button>
        </div>
      )}

      {/* Statistics Cards */}
      <div className="stats-row mb-4">
        <div className="stats-container">
          <div className="stat-card-wrapper">
            <div className="stat-card stat-total">
              <div className="stat-icon-wrapper">
                <span className="stat-icon">📊</span>
              </div>
              <div className="stat-info">
                <span className="stat-label">Total Certificates</span>
                <span className="stat-value">{certificates.length}</span>
              </div>
            </div>
          </div>

          <div className="stat-card-wrapper">
            <div className="stat-card stat-active">
              <div className="stat-icon-wrapper">
                <span className="stat-icon">✅</span>
              </div>
              <div className="stat-info">
                <span className="stat-label">Active</span>
                <span className="stat-value">{activeCertificates.length}</span>
              </div>
            </div>
          </div>

          <div className="stat-card-wrapper">
            <div className="stat-card stat-expired">
              <div className="stat-icon-wrapper">
                <span className="stat-icon">⏰</span>
              </div>
              <div className="stat-info">
                <span className="stat-label">Expired</span>
                <span className="stat-value">{expiredCertificates.length}</span>
              </div>
            </div>
          </div>

          <div className="stat-card-wrapper">
            <div className="stat-card stat-revoked">
              <div className="stat-icon-wrapper">
                <span className="stat-icon">🚫</span>
              </div>
              <div className="stat-info">
                <span className="stat-label">Revoked</span>
                <span className="stat-value">{revokedCertificates.length}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Certificates Grid */}
      {certificates.length === 0 ? (
        <div className="text-center py-5">
          <div className="text-muted mb-3" style={{ fontSize: '4rem' }}>🎓</div>
          <h4>No Certificates Yet</h4>
          <p className="text-muted mb-4">
            Complete courses and pass exams to earn certificates.
            Your certificates will appear here once you've successfully completed courses.
          </p>
          <div className="d-flex justify-content-center gap-3">
            <a href="/my-courses" className="btn btn-primary">
              Continue Learning
            </a>
            <a href="/course-enrollment" className="btn btn-outline-primary">
              Browse Courses
            </a>
          </div>
        </div>
      ) : (
        <div className="row">
          {filteredCertificates.map(certificate => (
            <div key={certificate.id} className="col-md-6 col-lg-4 mb-4">
              <div className={`card h-100 shadow-sm certificate-card ${certificate.status === 'active' ? 'border-success' :
                  certificate.status === 'expired' ? 'border-warning' :
                    'border-danger'
                }`}>
                <div className={`card-header text-white d-flex justify-content-between align-items-center ${certificate.status === 'active' ? 'bg-success' :
                    certificate.status === 'expired' ? 'bg-warning' :
                      'bg-danger'
                  }`}>
                  <div>
                    <h6 className="card-title mb-0">Config Server LLP</h6>
                    <small>Official Certificate</small>
                  </div>
                  <span className={`badge ${certificate.status === 'active' ? 'bg-light text-success' :
                      certificate.status === 'expired' ? 'bg-dark text-warning' :
                        'bg-light text-danger'
                    }`}>
                    {getStatusDisplayText(certificate.status)}
                  </span>
                </div>

                <div className="card-body">
                  <div className="certificate-preview border p-4 bg-white rounded">
                    {/* Header with Logo */}
                    <div className="d-flex justify-content-end align-items-start mb-3">
                      <div className="company-logo-placeholder bg-light border rounded d-flex align-items-center justify-content-center"
                        style={{ width: '80px', height: '80px', fontSize: '10px', textAlign: 'center' }}>
                        {companyLogo ? (
                          <img
                            src={companyLogo}
                            alt="CSLLP Logo"
                            style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                            onError={(e) => {
                              e.target.style.display = 'none';
                              e.target.nextSibling.style.display = 'block';
                            }}
                          />
                        ) : null}
                        <span style={{ display: companyLogo ? 'none' : 'block', padding: '5px' }}>
                          CSLLP Logo
                        </span>
                      </div>
                    </div>

                    {/* Certificate Title */}
                    <div className="text-center mb-3">
                      <h4 className="fw-bold text-dark mb-1">CERTIFICATE</h4>
                      <h5 className="fw-bold text-secondary">OF COMPLETION</h5>
                    </div>

                    {/* Presentation Text */}
                    <div className="text-center mb-3">
                      <p className="small text-dark mb-2">
                        THIS CERTIFICATE IS PROUDLY PRESENTED TO
                      </p>
                    </div>

                    {/* Employee Name */}
                    <div className="text-center mb-3">
                      <h3 className="fw-bold text-dark text-uppercase" style={{
                        fontSize: '1.4rem',
                        lineHeight: '1.2',
                        minHeight: '60px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        wordBreak: 'break-word'
                      }}>
                        {certificate.employeeName}
                      </h3>
                    </div>

                    {/* Course Completion Text */}
                    <div className="text-center mb-4">
                      <p className="small text-dark">
                        In acknowledgment of the successful completion of the{' '}
                        <strong className="text-success">{certificate.courseName}</strong> through the
                        company's professional learning and development platform,{' '}
                        <strong>{formatMonthYear(certificate.issueDate)}</strong>.
                      </p>
                    </div>

                    {/* Separator */}
                    <hr className="my-3" />

                    {/* Certificate Details */}
                    <div className="row small text-dark">
                      <div className="col-6">
                        <strong>Certificate No.</strong><br />
                        <span className="text-success">{certificate.verificationCode}</span>
                      </div>
                      <div className="col-6">
                        <strong>Issued On:</strong><br />
                        {formatDate(certificate.issueDate)}
                      </div>
                    </div>

                    {/* Verification Section */}
                    <div className="row small text-dark mt-2">
                      <div className="col-12 text-end">
                        <strong>Certificate Verification</strong><br />
                        Authorized Signatory<br />
                        <strong>Mr. Dinesh Raywade</strong><br />
                        Config Server LLP
                      </div>
                    </div>

                    {/* Footer */}
                    <div className="text-center mt-3 pt-2 border-top">
                      <small className="text-muted">
                        Verify at: CSLLP Learning Platform Portal
                      </small>
                    </div>
                  </div>

                  {/* Additional Info */}
                  <div className="mt-3">
                    <div className="row small text-muted">
                      <div className="col-12 text-center">
                        <strong>Employee:</strong> {certificate.employeeName} |
                        <strong> Course:</strong> {certificate.courseName}
                      </div>
                    </div>
                  </div>
                </div>

                {/* ===== FIXED ACTION BUTTONS ===== */}
                <div className="card-footer bg-transparent">
                  <div className="action-buttons-grid">
                    <button
                      className={`btn-action-cert ${certificate.status === 'active' ? 'btn-download-pdf' : 'btn-disabled'}`}
                      onClick={() => handleDownload(certificate)}
                      disabled={downloading === certificate.id || certificate.status === 'revoked'}
                      title={certificate.status === 'revoked' ? 'This certificate has been revoked' : ''}
                    >
                      {downloading === certificate.id ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-1" role="status"></span>
                          Downloading...
                        </>
                      ) : (
                        '📥 Download PDF'
                      )}
                    </button>

                    <button
                      className="btn-action-cert btn-preview"
                      onClick={() => handlePreview(certificate)}
                    >
                      👁️ Preview
                    </button>

                    <button
                      className="btn-action-cert btn-share"
                      onClick={() => handleShare(certificate)}
                      disabled={certificate.status === 'revoked'}
                    >
                      📧 Share
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Preview Modal */}
      {showPreview && selectedCertificate && (
        <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }} tabIndex="-1">
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">📄 Certificate Details</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => {
                    setShowPreview(false);
                    if (certificateImageUrl) {
                      URL.revokeObjectURL(certificateImageUrl);
                      setCertificateImageUrl(null);
                    }
                  }}
                ></button>
              </div>
              <div className="modal-body">
                {/* Certificate Preview */}
                {certificateImageUrl && (
                  <div className="certificate-preview-modal mb-4">
                    <iframe
                      src={certificateImageUrl}
                      title="Certificate Preview"
                    />
                    <div className="text-center p-2 bg-light">
                      <small className="text-muted">📄 Certificate Preview</small>
                    </div>
                  </div>
                )}

                {/* Fallback Certificate View */}
                {!certificateImageUrl && (
                  <div className="certificate-full border p-5 bg-white rounded">
                    {/* Header with Logo */}
                    <div className="d-flex justify-content-end align-items-start mb-4">
                      <div className="company-logo-placeholder bg-light border rounded d-flex align-items-center justify-content-center"
                        style={{ width: '120px', height: '120px', fontSize: '12px', textAlign: 'center' }}>
                        {companyLogo ? (
                          <img
                            src={companyLogo}
                            alt="CSLLP Logo"
                            style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                            onError={(e) => {
                              e.target.style.display = 'none';
                              e.target.nextSibling.style.display = 'block';
                            }}
                          />
                        ) : null}
                        <span style={{ display: companyLogo ? 'none' : 'block', padding: '8px' }}>
                          CSLLP Logo
                        </span>
                      </div>
                    </div>

                    {/* Certificate Title */}
                    <div className="text-center mb-4">
                      <h2 className="fw-bold text-dark mb-1">CERTIFICATE</h2>
                      <h3 className="fw-bold text-secondary">OF COMPLETION</h3>
                    </div>

                    {/* Presentation Text */}
                    <div className="text-center mb-4">
                      <p className="text-dark mb-3">
                        THIS CERTIFICATE IS PROUDLY PRESENTED TO
                      </p>
                    </div>

                    {/* Employee Name */}
                    <div className="text-center mb-4">
                      <h1 className="fw-bold text-dark text-uppercase" style={{
                        fontSize: '2.5rem',
                        lineHeight: '1.1',
                        minHeight: '100px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        wordBreak: 'break-word'
                      }}>
                        {selectedCertificate.employeeName}
                      </h1>
                    </div>

                    {/* Course Completion Text */}
                    <div className="text-center mb-5">
                      <p className="text-dark" style={{ fontSize: '1.1rem' }}>
                        In acknowledgment of the successful completion of the{' '}
                        <strong style={{ color: '#198754', fontSize: '1.2rem' }}>{selectedCertificate.courseName}</strong> through the
                        company's professional learning and development platform,{' '}
                        <strong>{formatMonthYear(selectedCertificate.issueDate)}</strong>.
                      </p>
                    </div>

                    {/* Separator */}
                    <hr className="my-4" />

                    {/* Certificate Details */}
                    <div className="row text-dark">
                      <div className="col-6">
                        <strong>Certificate No.</strong><br />
                        <span className="text-success">{selectedCertificate.verificationCode}</span>
                      </div>
                      <div className="col-6 text-end">
                        <strong>Issued On:</strong><br />
                        {formatDate(selectedCertificate.issueDate)}
                      </div>
                    </div>

                    {/* Verification Section */}
                    <div className="row text-dark mt-4">
                      <div className="col-12 text-end">
                        <strong>Certificate Verification</strong><br />
                        Authorized Signatory<br />
                        <strong>Mr. Dinesh Raywade</strong><br />
                        Config Server LLP
                      </div>
                    </div>

                    {/* Footer */}
                    <div className="text-center mt-4 pt-3 border-top">
                      <small className="text-muted">
                        Verify at: CSLLP Learning Platform Portal
                      </small>
                    </div>
                  </div>
                )}

                {/* Certificate Details Card */}
                <div className="card mt-3">
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
                            <span className={`badge ${getStatusBadgeClass(selectedCertificate.status)}`} style={{ padding: '6px 12px' }}>
                              {getStatusDisplayText(selectedCertificate.status)}
                            </span>
                          </div>
                        </div>
                        <div className="mb-2">
                          <label className="fw-bold">Employee Name:</label>
                          <div>{selectedCertificate.employeeName}</div>
                        </div>
                      </div>
                      <div className="col-md-6">
                        <div className="mb-2">
                          <label className="fw-bold">Course Name:</label>
                          <div>{selectedCertificate.courseName}</div>
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
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn-close-modal"
                  onClick={() => {
                    setShowPreview(false);
                    if (certificateImageUrl) {
                      URL.revokeObjectURL(certificateImageUrl);
                      setCertificateImageUrl(null);
                    }
                  }}
                >
                  Close
                </button>
                <button
                  type="button"
                  className="btn-download-pdf"
                  onClick={() => handleDownload(selectedCertificate)}
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
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Debug Information */}
      {process.env.NODE_ENV === 'development' && (
        <div className="mt-3 p-3 bg-light border rounded">
          <details>
            <summary className="fw-bold">🔧 Debug Information (Development Only)</summary>
            <div className="mt-2">
              <h6>User Info:</h6>
              <pre className="small">{JSON.stringify(user, null, 2)}</pre>

              <h6>Data Enrichment Debug:</h6>
              <pre className="small">{debugInfo}</pre>

              <h6>Certificates:</h6>
              <pre className="small">
                {JSON.stringify(certificates.map(cert => ({
                  id: cert.id,
                  employeeId: cert.employeeId,
                  employeeName: cert.employeeName,
                  courseId: cert.courseId,
                  courseName: cert.courseName,
                  verificationCode: cert.verificationCode,
                  status: cert.status,
                  _debug: cert._debug,
                  _error: cert._error
                })), null, 2)}
              </pre>
            </div>
          </details>
        </div>
      )}
    </div>
  );
}