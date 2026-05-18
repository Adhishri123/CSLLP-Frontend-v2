import React, { useState, useEffect } from 'react';

export default function Leaderboards({ user }) {
  const [leaderboard, setLeaderboard] = useState([]);
  const [filter, setFilter] = useState('overall');
  const [timeRange, setTimeRange] = useState('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate loading leaderboard data
    setTimeout(() => {
      const mockLeaderboard = [
        {
          id: 1,
          name: 'John Doe',
          role: 'Software Engineer',
          points: 950,
          coursesCompleted: 8,
          certifications: 6,
          avgScore: 92,
          department: 'Engineering'
        },
        {
          id: 2,
          name: 'Jane Smith',
          role: 'UX Designer',
          points: 880,
          coursesCompleted: 7,
          certifications: 5,
          avgScore: 88,
          department: 'Design'
        },
        {
          id: 3,
          name: 'Mike Johnson',
          role: 'Product Manager',
          points: 820,
          coursesCompleted: 6,
          certifications: 4,
          avgScore: 85,
          department: 'Product'
        },
        {
          id: 4,
          name: 'Sarah Wilson',
          role: 'Data Analyst',
          points: 780,
          coursesCompleted: 5,
          certifications: 4,
          avgScore: 82,
          department: 'Analytics'
        },
        {
          id: 5,
          name: 'David Brown',
          role: 'Marketing Specialist',
          points: 720,
          coursesCompleted: 4,
          certifications: 3,
          avgScore: 79,
          department: 'Marketing'
        }
      ];
      setLeaderboard(mockLeaderboard);
      setLoading(false);
    }, 1500);
  }, []);

  const getRankBadge = (index) => {
    if (index === 0) return '🥇';
    if (index === 1) return '🥈';
    if (index === 2) return '🥉';
    return `#${index + 1}`;
  };

  const getPointsColor = (points) => {
    if (points >= 900) return 'text-success fw-bold';
    if (points >= 800) return 'text-primary';
    if (points >= 700) return 'text-info';
    return 'text-muted';
  };

  if (loading) return <div className="text-center p-4">Loading leaderboard...</div>;

  return (
    <div className="container-fluid">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="mb-1 fw-bold">🏆 Leaderboards</h2>
          <small className="text-muted">
            Track employee performance and learning achievements
          </small>
        </div>
        <div className="d-flex gap-2">
          <select 
            className="form-select form-select-sm"
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
          >
            <option value="all">All Time</option>
            <option value="month">This Month</option>
            <option value="quarter">This Quarter</option>
            <option value="year">This Year</option>
          </select>
          <select 
            className="form-select form-select-sm"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          >
            <option value="overall">Overall</option>
            <option value="engineering">Engineering</option>
            <option value="design">Design</option>
            <option value="product">Product</option>
            <option value="marketing">Marketing</option>
          </select>
        </div>
      </div>

      {/* Top 3 Performers */}
      <div className="row mb-4">
        {leaderboard.slice(0, 3).map((employee, index) => (
          <div key={employee.id} className="col-md-4 mb-3">
            <div className={`card h-100 border-${index === 0 ? 'warning' : index === 1 ? 'secondary' : 'info'} ${index === 0 ? 'bg-warning bg-opacity-10' : ''}`}>
              <div className="card-body text-center">
                <div style={{ fontSize: '3rem' }}>{getRankBadge(index)}</div>
                <h4 className="card-title">{employee.name}</h4>
                <p className="card-text text-muted">{employee.role}</p>
                
                <div className="row text-center mt-3">
                  <div className="col-4">
                    <div className="border rounded p-2">
                      <h5 className={`mb-0 ${getPointsColor(employee.points)}`}>{employee.points}</h5>
                      <small className="text-muted">Points</small>
                    </div>
                  </div>
                  <div className="col-4">
                    <div className="border rounded p-2">
                      <h5 className="mb-0 text-primary">{employee.coursesCompleted}</h5>
                      <small className="text-muted">Courses</small>
                    </div>
                  </div>
                  <div className="col-4">
                    <div className="border rounded p-2">
                      <h5 className="mb-0 text-success">{employee.avgScore}%</h5>
                      <small className="text-muted">Avg Score</small>
                    </div>
                  </div>
                </div>

                <div className="mt-3">
                  {Array.from({ length: 5 }, (_, i) => (
                    <span key={i} style={{ fontSize: '1.2rem', color: i < Math.floor(employee.avgScore / 20) ? '#ffc107' : '#e4e5e9' }}>
                      ⭐
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Full Leaderboard Table */}
      <div className="card">
        <div className="card-header bg-light">
          <h5 className="card-title mb-0">📊 Full Leaderboard</h5>
        </div>
        <div className="card-body p-0">
          <div className="table-responsive">
            <table className="table table-striped table-hover mb-0">
              <thead className="table-dark">
                <tr>
                  <th width="80">Rank</th>
                  <th>Employee</th>
                  <th>Department</th>
                  <th>Points</th>
                  <th>Courses Completed</th>
                  <th>Certifications</th>
                  <th>Avg Score</th>
                  <th>Performance</th>
                </tr>
              </thead>
              <tbody>
                {leaderboard.map((employee, index) => (
                  <tr key={employee.id}>
                    <td>
                      <strong>{getRankBadge(index)}</strong>
                    </td>
                    <td>
                      <div className="d-flex align-items-center">
                        <div className="bg-primary text-white rounded-circle d-flex align-items-center justify-content-center me-3" 
                             style={{ width: '40px', height: '40px', fontSize: '14px' }}>
                          {employee.name.split(' ').map(n => n[0]).join('')}
                        </div>
                        <div>
                          <div className="fw-bold">{employee.name}</div>
                          <small className="text-muted">{employee.role}</small>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className="badge bg-secondary">{employee.department}</span>
                    </td>
                    <td>
                      <span className={getPointsColor(employee.points)}>
                        {employee.points}
                      </span>
                    </td>
                    <td>
                      <div className="d-flex align-items-center">
                        <div className="progress flex-grow-1 me-2" style={{ height: '6px' }}>
                          <div 
                            className="progress-bar bg-success" 
                            style={{ width: `${(employee.coursesCompleted / 10) * 100}%` }}
                          ></div>
                        </div>
                        <span>{employee.coursesCompleted}</span>
                      </div>
                    </td>
                    <td>
                      <span className="badge bg-info">{employee.certifications}</span>
                    </td>
                    <td>
                      <span className={`badge ${
                        employee.avgScore >= 90 ? 'bg-success' :
                        employee.avgScore >= 80 ? 'bg-primary' :
                        employee.avgScore >= 70 ? 'bg-warning' : 'bg-secondary'
                      }`}>
                        {employee.avgScore}%
                      </span>
                    </td>
                    <td>
                      <div className="d-flex align-items-center">
                        {Array.from({ length: 5 }, (_, i) => (
                          <span key={i} style={{ fontSize: '1rem', color: i < Math.floor(employee.avgScore / 20) ? '#ffc107' : '#e4e5e9' }}>
                            ⭐
                          </span>
                        ))}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Metrics Explanation */}
      <div className="row mt-4">
        <div className="col-12">
          <div className="card">
            <div className="card-header bg-light">
              <h5 className="card-title mb-0">📈 How Points are Calculated</h5>
            </div>
            <div className="card-body">
              <div className="row text-center">
                <div className="col-md-3 mb-3">
                  <div className="border rounded p-3">
                    <div style={{ fontSize: '2rem' }}>🎯</div>
                    <h6>Course Completion</h6>
                    <p className="small text-muted mb-0">100 points per completed course</p>
                  </div>
                </div>
                <div className="col-md-3 mb-3">
                  <div className="border rounded p-3">
                    <div style={{ fontSize: '2rem' }}>📝</div>
                    <h6>Exam Scores</h6>
                    <p className="small text-muted mb-0">Bonus points based on exam performance</p>
                  </div>
                </div>
                <div className="col-md-3 mb-3">
                  <div className="border rounded p-3">
                    <div style={{ fontSize: '2rem' }}>🏆</div>
                    <h6>Certifications</h6>
                    <p className="small text-muted mb-0">50 points per certification earned</p>
                  </div>
                </div>
                <div className="col-md-3 mb-3">
                  <div className="border rounded p-3">
                    <div style={{ fontSize: '2rem' }}>⚡</div>
                    <h6>Learning Speed</h6>
                    <p className="small text-muted mb-0">Bonus for timely course completion</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}