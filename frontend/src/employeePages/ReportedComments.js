import React, { useState, useEffect } from "react";
import axios from "axios";
import { FaStar, FaArrowLeft } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import "./ReportedComments.css";

const ReportedComments = () => {
  const navigate = useNavigate();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [causeFilter, setCauseFilter] = useState("all");

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${process.env.REACT_APP_API_URL}/api/reported-comments`);
      setReports(response.data);
    } catch (err) {
      console.error("Error fetching reports:", err);
      setError("Failed to fetch reported comments.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoBack = () => {
    navigate(-1);
  };

  const filteredReports = reports.filter((r) => {
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch =
      r.username.toLowerCase().includes(searchLower) ||
      r.RatingID.toString().includes(searchLower);
    const matchesCause = causeFilter === "all" || r.ReportType === causeFilter;
    return matchesSearch && matchesCause;
  });

  // Unique report types for filter dropdown
  const uniqueCauses = [...new Set(reports.map((r) => r.ReportType))];

  if (loading) return <div className="reported-comments-loading">Loading...</div>;
  if (error) return <div className="reported-comments-error">{error}</div>;

  return (
    <div className="reported-comments-wrapper">
      {/* Header */}
      <div className="reported-header">
        <button onClick={handleGoBack} className="reported-back-btn">
          <FaArrowLeft />
        </button>
        <h3>Reported Comments</h3>
      </div>

      {/* Controls */}
      <div className="reported-controls">
        {/* Search */}
        <div className="reported-search">
          <input
            type="text"
            placeholder="Search by Rating ID or Username..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Filter by ReportType */}
        <div className="reported-filter">
          <select value={causeFilter} onChange={(e) => setCauseFilter(e.target.value)}>
            <option value="all">All Types</option>
            {uniqueCauses.map((type, i) => (
              <option key={i} value={type}>
                {type}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Report List */}
      <div className="reported-list">
        {filteredReports.length > 0 ? (
          filteredReports.map((report) => (
            <div key={report.ReportID} className="reported-item">
              {/* Reporter Info */}
              <div className="reported-header-info">
                <div className="reported-user-meta">
                  <p
                    className="reported-reporter clickable-link"
                    onClick={() => navigate(`/admin/user-management/${report.ReporterUserTag}`)}
                  >
                    Reported by: <span className="admin-review-user clickable-username">{report.ReporterUsername}</span>
                  </p>
                  <p className="reported-date">
                    {new Date(report.CreatedAt).toLocaleDateString()}
                  </p>
                </div>
                <div className="reported-cause">
                  <div>
                    <p>
                      <strong>Type:</strong> {report.ReportType}
                    </p>
                    {report.ReportReason && (
                      <p>
                        <strong>Reason:</strong> {report.ReportReason}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Original Review */}
              <div
                className="reported-review"
                onClick={() =>
                  navigate(`/admin/product-reviews/${report.ProductID}?highlight=${report.RatingID}`)
                }
              >
                <p className="reported-author">Comment by: {report.username}</p>
                <p className="reported-date">RATING ID: {report.RatingID}</p>
                <span className="reported-stars">
                  {[...Array(5)].map((_, i) => (
                    <FaStar
                      key={i}
                      color={i < report.Rating ? "#facc15" : "#d1d5db"}
                    />
                  ))}
                </span>
                <p className="reported-text">{report.Review}</p>

                <p className="reported-view-link">
                  click to view in original review context
                </p>
              </div>
            </div>
          ))
        ) : (
          <p className="reported-empty">No reported comments found.</p>
        )}
      </div>
    </div>
  );
};

export default ReportedComments;
