import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { jwtDecode } from "jwt-decode";
import './EmployeeList.css';

const roleMap = {
  1: 'Admin',
  2: 'Manager',
  3: 'Employee',
};

const TerminatedEmployees = () => {
  const [terminatedEmployees, setTerminatedEmployees] = useState([]);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [refresh, setRefresh] = useState(false);

  const token = localStorage.getItem("token");
    let currentUserId = null;
    let currentUserRole = null;
    let currentUsername = null;
  
    if (token) {
      try {
        const decoded = jwtDecode(token);
        currentUserId = decoded.employeeId;
        currentUserRole = decoded.roleId;
        currentUsername = decoded.username;
      } catch (err) {
        console.error("Invalid token:", err);
      }
    }

  useEffect(() => {
    const fetchTerminatedEmployees = async () => {
      try {
        const res = await axios.get(`${process.env.REACT_APP_API_URL}/terminated-employees`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        setTerminatedEmployees(res.data);
      } catch (err) {
        console.error('Error fetching terminated employees:', err);
      }
    };
    if (token) fetchTerminatedEmployees();
  }, [refresh, token]);

  const handleRehire = async (empId) => {
    try {
        await axios.put(`${process.env.REACT_APP_API_URL}/rehire/${empId}`, {
            employeeId: currentUserId,     // admin's ID
            username: currentUsername,     // admin's username
        });
        setRefresh(!refresh);
        setSelectedEmployee(null);
    } catch (err) {
        console.error('Error rehiring employee:', err);
    }
};


  return (
    <div className="employee-container">
      <h2 className="title">Terminated Employees</h2>
      <table className="employee-table">
        <thead>
          <tr>
            <th>Username</th>
            <th>Full Name</th>
            <th>Position</th>
            <th>Terminated Date</th>
            <th>View</th>
          </tr>
        </thead>
        <tbody>
          {terminatedEmployees.map((emp) => (
            <tr key={emp.employeeId}>
              <td>{emp.username}</td>
              <td>{emp.firstName} {emp.lastName}</td>
              <td>{roleMap[emp.roleId]}</td>
              <td>{new Date(emp.terminatedDate).toLocaleDateString()}</td>
              <td>
                <button onClick={() => setSelectedEmployee(emp)} className="view-button">
                  View
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {selectedEmployee && (
        <div className="modal-overlay" onClick={() => setSelectedEmployee(null)}>
          <div className="employee-details-modal" onClick={(e) => e.stopPropagation()}>
            <h3>Employee Details</h3>
            <p><strong>Username:</strong> {selectedEmployee.username}</p>
            <p><strong>Full Name:</strong> {selectedEmployee.firstName} {selectedEmployee.lastName}</p>
            <p><strong>Email:</strong> {selectedEmployee.email}</p>
            <p><strong>Phone:</strong> {selectedEmployee.phone}</p>
            <p><strong>Address:</strong> {selectedEmployee.Address}</p>
            <p><strong>Position:</strong> {roleMap[selectedEmployee.roleId]}</p>
            <p><strong>Status:</strong> Terminated</p>

            <div className="modal-actions">
              <button onClick={() => handleRehire(selectedEmployee.employeeId)}>
                Rehire
              </button>
            </div>

            <button onClick={() => setSelectedEmployee(null)} className="close-button">
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default TerminatedEmployees;
