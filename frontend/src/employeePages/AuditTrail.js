import React, { useEffect, useState } from 'react';
import './AuditTrail.css'; 

const AuditTrail = () => {
    const [auditData, setAuditData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [tableFilter, setTableFilter] = useState("All");

    // Pagination state
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(50);
    const [totalItems, setTotalItems] = useState(0);

    const totalPages = Math.ceil(totalItems / pageSize);

    // Fetch audit trail data with pagination on component mount or page change
    useEffect(() => {
        const fetchAuditData = async () => {
            setLoading(true);
            try {
                // Construct the URL with pagination, search, and filter parameters
                // For simplicity, we'll just handle pagination on the server and filter client-side
                const response = await fetch(`${process.env.REACT_APP_API_URL}/audit-trail?page=${currentPage}&pageSize=${pageSize}`);
                if (response.ok) {
                    const result = await response.json();
                    setAuditData(result.data);
                    setTotalItems(result.totalCount);
                } else {
                    console.error('Failed to fetch audit data');
                }
            } catch (error) {
                console.error('Error fetching audit data:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchAuditData();
    }, [currentPage, pageSize]);

    // Client-side filtering logic
    const filteredData = auditData.filter(audit => {
        const lower = search.toLowerCase();
        return (
            (audit.Username?.toLowerCase().includes(lower) ||
            audit.Action?.toLowerCase().includes(lower) ||
            new Date(audit.ActionTime).toLocaleString().toLowerCase().includes(lower)) &&
            (tableFilter === "All" || audit.TableName === tableFilter)
        );
    });

    // Get unique table names for dropdown
    // Note: this will only show table names for the current page's data. 
    // To show all, you'd need to fetch a list of all table names separately.
    const tableNames = ["All", ...new Set(auditData.map(audit => audit.TableName))];

    // Handle pagination button clicks
    const handlePrevious = () => {
        setCurrentPage(prev => Math.max(prev - 1, 1));
    };

    const handleNext = () => {
        setCurrentPage(prev => Math.min(prev + 1, totalPages));
    };

    return (
        <div className='audit-trail-container'>
            <h1>Audit Trail</h1>

            <div style={{ marginBottom: "10px", display: "flex", gap: "10px", alignItems: "center" }}>
                <input
                    type="text"
                    placeholder="Search by username, action, or date..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    style={{ padding: "5px", width: "300px" }}
                />

                <select
                    value={tableFilter}
                    onChange={(e) => setTableFilter(e.target.value)}
                    style={{ padding: "5px" }}
                >
                    {tableNames.map(name => (
                        <option key={name} value={name}>{name}</option>
                    ))}
                </select>
            </div>

            {loading ? (
                <p>Loading...</p>
            ) : (
                <>
                    <table border="1" cellPadding="5" cellSpacing="0">
                        <thead>
                            <tr>
                                <th>Audit ID</th>
                                <th>Username</th>
                                <th>Action</th>
                                <th>Record Group</th>
                                <th>Details</th>
                                <th>Action Time</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredData.map((audit) => (
                                <tr key={audit.AuditID}>
                                    <td>{audit.AuditID}</td>
                                    <td>{audit.Username}</td>
                                    <td>{audit.Action}</td>
                                    <td>{audit.TableName}</td>
                                    <td>{audit.Details}</td>
                                    <td>{new Date(audit.ActionTime).toLocaleString()}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    
                    {/* Pagination Controls */}
                    <div className="pagination-controls" style={{ marginTop: "20px", display: "flex", justifyContent: "center", alignItems: "center", gap: "10px" }}>
                        <button onClick={handlePrevious} disabled={currentPage === 1}>Previous</button>
                        <span>Page {currentPage} of {totalPages}</span>
                        <button onClick={handleNext} disabled={currentPage >= totalPages}>Next</button>
                    </div>
                </>
            )}
        </div>
    );
};

export default AuditTrail;