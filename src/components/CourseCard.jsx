// components/CourseCard.js
import React from "react";

const CourseCard = ({ course, onEnroll, showEnrollButton = true }) => {
  const handleEnrollClick = () => {
    if (onEnroll) {
      onEnroll(course);
    }
  };

  return (
    <div className="card shadow-sm h-100">
      <div className="card-header bg-transparent">
        <h5 className="card-title mb-1 text-truncate">{course.title}</h5>
        <div className="d-flex justify-content-between align-items-center">
          <span className="badge bg-secondary">{course.category}</span>
          <span className={`badge ${course.isPaid ? 'bg-warning' : 'bg-success'}`}>
            {course.isPaid ? 'Paid' : 'Free'}
          </span>
        </div>
      </div>
      
      <div className="card-body">
        <p className="card-text">
          {course.description || "No description available."}
        </p>
        
        <div className="course-meta small text-muted">
          <div className="mb-1">
            <i className="bi bi-clock"></i> Duration: {course.durationHours} hours
          </div>
          {course.isPaid && (
            <div className="mb-1">
              <i className="bi bi-currency-dollar"></i> Price: ${course.price}
            </div>
          )}
          <div>
            <i className="bi bi-info-circle"></i> Status: 
            <span className={`badge ${course.status === 'ACTIVE' ? 'bg-success' : 'bg-secondary'} ms-1`}>
              {course.status}
            </span>
          </div>
        </div>
      </div>

      {showEnrollButton && (
        <div className="card-footer bg-transparent">
          <button 
            className={`btn w-100 ${course.isPaid ? 'btn-warning' : 'btn-success'}`}
            onClick={handleEnrollClick}
          >
            {course.isPaid ? 'Request Enrollment' : 'Enroll Now'}
          </button>
        </div>
      )}
    </div>
  );
};

export default CourseCard;