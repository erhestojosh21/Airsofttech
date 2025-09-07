import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { jwtDecode } from 'jwt-decode';
import { useNavigate } from 'react-router-dom';
import { CiCircleAlert } from 'react-icons/ci';
import { GoQuestion } from 'react-icons/go';
import { IoSearch } from 'react-icons/io5';
import { FaPencilAlt } from 'react-icons/fa';
import { FaAngleDoubleUp, FaAngleDoubleDown } from 'react-icons/fa';
import { TbUserCancel } from 'react-icons/tb';
import { FaChevronRight } from 'react-icons/fa';
import './EmployeeList.css';
import { formatOrderDateTime } from '../utils/dateFormatter';

const roleMap = {
    1: 'Admin',
    2: 'Manager',
    3: 'Employee',
};

const allPermissions = [
    { id: 2, name: 'Product Management', label: 'Product Management' },
    { id: 3, name: 'Requested Variants Management', label: 'Requested Variants Management' },
    { id: 4, name: 'Order Management', label: 'Order Management' },
    { id: 5, name: '3d model Management', label: '3D Models Management' },
    { id: 6, name: 'Hiring Employee', label: 'Add Employee' },
    { id: 7, name: 'Employee List Management', label: 'Employee List Management' },
    { id: 8, name: 'Audit trail View', label: 'Audit Trail View' },
    { id: 9, name: 'Customer Management', label: 'Customer Management' },
    { id: 12, name: 'Chat Support', label: 'Chat Support' }
];

const EmployeeManagement = () => {
    const [employees, setEmployees] = useState([]);
    const [terminatedEmployees, setTerminatedEmployees] = useState([]);
    const [filteredEmployees, setFilteredEmployees] = useState([]);
    const [selectedEmployee, setSelectedEmployee] = useState(null);
    const [refresh, setRefresh] = useState(false);
    const [editMode, setEditMode] = useState(false);
    const [editedData, setEditedData] = useState({});
    const [editedPermissions, setEditedPermissions] = useState({});
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedStatus, setSelectedStatus] = useState('Active');

    const [confirmSave, setConfirmSave] = useState(false);
    const [confirmCancel, setConfirmCancel] = useState(false);
    const [confirmAction, setConfirmAction] = useState(null);
    const [pendingAction, setPendingAction] = useState(null);

    const [errorMsg, setErrorMsg] = useState('');

    const navigate = useNavigate();
    const token = localStorage.getItem('token');

    let currentUserId = null;
    let currentUserRole = null;
    let currentUsername = null;
    let currentUserPermissions = [];

    if (token) {
        try {
            const decoded = jwtDecode(token);
            currentUserId = decoded.employeeId;
            currentUserRole = decoded.roleId;
            currentUsername = decoded.username;
            currentUserPermissions = decoded.permissions || [];
        } catch (err) {
            console.error('Invalid token:', err);
        }
    }

    useEffect(() => {
        const fetchEmployees = async () => {
            try {
                const activeRes = await axios.get(`${process.env.REACT_APP_API_URL}/employees`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                setEmployees(activeRes.data);

                const terminatedRes = await axios.get(`${process.env.REACT_APP_API_URL}/terminated-employees`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                setTerminatedEmployees(terminatedRes.data);
            } catch (err) {
                console.error('Error fetching employees:', err);
                setErrorMsg('Failed to load employee data.');
            }
        };
        if (token) fetchEmployees();
    }, [refresh, token]);

    useEffect(() => {
        const listToFilter = selectedStatus === "Terminated" ? terminatedEmployees : employees;

        const filtered = listToFilter.filter((emp) => {
            const search = searchTerm.toLowerCase();
            const matchesSearch =
                emp.username?.toLowerCase().includes(search) ||
                emp.firstName?.toLowerCase().includes(search) ||
                emp.lastName?.toLowerCase().includes(search) ||
                roleMap[emp.roleId]?.toLowerCase().includes(search) ||
                (emp.hireDate && new Date(emp.hireDate).toLocaleDateString().toLowerCase().includes(search)) ||
                (emp.terminatedDate && new Date(emp.terminatedDate).toLocaleDateString().toLowerCase().includes(search));

            if (selectedStatus === "All") {
                return matchesSearch;
            } else if (selectedStatus === "Active") {
                return matchesSearch && !emp.terminated;
            } else {
                return matchesSearch && emp.terminated;
            }
        });
        setFilteredEmployees(filtered);
    }, [searchTerm, employees, terminatedEmployees, selectedStatus]);

    useEffect(() => {
        const fetchEmployeePermissions = async () => {
            if (selectedEmployee) {
                if (selectedEmployee.roleId === 1) {
                    const initialEditedPermissions = {};
                    allPermissions.forEach((p) => {
                        initialEditedPermissions[p.name] = true;
                    });
                    setEditedPermissions(initialEditedPermissions);
                } else {
                    try {
                        const res = await axios.get(
                            `${process.env.REACT_APP_API_URL}/employees/${selectedEmployee.employeeId}/permissions`,
                            {
                                headers: { Authorization: `Bearer ${token}` },
                            }
                        );
                        const permissionsData = res.data;

                        const initialEditedPermissions = {};
                        allPermissions.forEach((p) => {
                            initialEditedPermissions[p.name] = false;
                        });
                        permissionsData.forEach((p) => {
                            if (p.HasPermission === 1) {
                                initialEditedPermissions[p.PermissionName] = true;
                            }
                        });
                        setEditedPermissions(initialEditedPermissions);
                    } catch (err) {
                        console.error('Error fetching employee permissions:', err);
                        setErrorMsg('Failed to load employee permissions.');
                    }
                }
            }
        };
        fetchEmployeePermissions();
    }, [selectedEmployee, token]);

    const handleRoleChange = async (empId, newRoleId) => {
        try {
            await axios.put(
                `${process.env.REACT_APP_API_URL}/employees/${empId}/role`,
                {
                    roleId: newRoleId,
                    employeeId: currentUserId,
                    username: currentUsername,
                },
                {
                    headers: { Authorization: `Bearer ${token}` },
                }
            );
            setRefresh((prev) => !prev);
            setSelectedEmployee(null);
            setErrorMsg('');
        } catch (err) {
            console.error('Error updating role:', err);
            setErrorMsg(err.response?.data?.message || 'Failed to update role.');
        }
    };

    const handleTerminate = async (empId) => {
        try {
            await axios.put(
                `${process.env.REACT_APP_API_URL}/employees/${empId}/terminate`,
                {
                    employeeId: currentUserId,
                    username: currentUsername,
                },
                {
                    headers: { Authorization: `Bearer ${token}` },
                }
            );
            setRefresh((prev) => !prev);
            setSelectedEmployee(null);
            setErrorMsg('');
        } catch (err) {
            console.error('Error terminating employee:', err);
            setErrorMsg(err.response?.data?.message || 'Failed to terminate employee.');
        }
    };

    const handleRehire = async (empId) => {
        try {
            await axios.put(`${process.env.REACT_APP_API_URL}/rehire/${empId}`, {
                employeeId: currentUserId,
                username: currentUsername,
            });
            setRefresh((prev) => !prev);
            setSelectedEmployee(null);
            setErrorMsg('');
        } catch (err) {
            console.error('Error rehiring employee:', err);
            setErrorMsg(err.response?.data?.message || 'Failed to rehire employee.');
        }
    };

    const startEditing = () => {
        setEditMode(true);
        setEditedData({ ...selectedEmployee });
    };

    const handleChange = (field, value) => {
        setEditedData((prev) => ({ ...prev, [field]: value }));
    };

    const handlePermissionChange = (permissionName, isChecked) => {
        setEditedPermissions((prev) => ({
            ...prev,
            [permissionName]: isChecked,
        }));
    };

    const saveEdit = async () => {
        try {
            const { username, email, phone, Address, firstName, lastName } = editedData;

            const updateInfoRes = await axios.put(
                `${process.env.REACT_APP_API_URL}/employees/${selectedEmployee.employeeId}/update-info`,
                {
                    username,
                    email,
                    phone,
                    address: Address,
                    firstName,
                    lastName,
                    editorId: currentUserId,
                    editorUsername: currentUsername,
                },
                {
                    headers: { Authorization: `Bearer ${token}` },
                }
            );

            if (!updateInfoRes.data.success) {
                setErrorMsg(updateInfoRes.data.message || 'Update failed');
                setConfirmSave(false);
                return;
            }

            if (selectedEmployee.roleId !== 1) {
                const permissionsToSave = allPermissions
                    .filter((p) => editedPermissions[p.name])
                    .map((p) => p.id);

                const updatePermissionsRes = await axios.put(
                    `${process.env.REACT_APP_API_URL}/employees/${selectedEmployee.employeeId}/permissions`,
                    {
                        permissions: permissionsToSave,
                        editorId: currentUserId,
                        editorUsername: currentUsername,
                    },
                    {
                        headers: { Authorization: `Bearer ${token}` },
                    }
                );

                if (!updatePermissionsRes.data.success) {
                    setErrorMsg(updatePermissionsRes.data.message || 'Permissions update failed');
                    setConfirmSave(false);
                    return;
                }
            }

            setRefresh((prev) => !prev);
            setEditMode(false);
            setSelectedEmployee(null);
            setConfirmSave(false);
            setErrorMsg('');
        } catch (err) {
            setErrorMsg(err.response?.data?.message || 'Server error during save');
            setConfirmSave(false);
        }
    };

    const cancelEdit = () => {
        setConfirmCancel(true);
    };

    const requestRoleChange = (empId, newRoleId) => {
        setPendingAction(() => () => handleRoleChange(empId, newRoleId));
        setConfirmAction(`You want to ${newRoleId === 2 ? 'promote' : 'demote'} this employee?`);
    };

    const requestTermination = (empId) => {
        setPendingAction(() => () => handleTerminate(empId));
        setConfirmAction('You want to terminate this employee?');
    };

    const requestRehire = (empId) => {
        setPendingAction(() => () => handleRehire(empId));
        setConfirmAction('You want to rehire this employee?');
    };

    const hasPermission = (permissionName) => {
        if (currentUserRole === 1) {
            return true;
        }
        return currentUserPermissions.includes(permissionName);
    };

    const arePermissionsDisabledForSelected = selectedEmployee?.roleId === 1 || (currentUserRole !== 1 && !hasPermission('Employee List Management'));

    return (
        <div className="employee-container">
            <h2 className="title-req">Employee List ({selectedStatus})</h2>

            <div className="inventory-controls">
                <div className="left-controls">
                    {['Active', 'Terminated'].map((status) => (
                        <button
                            key={status}
                            className={`filter-btn ${selectedStatus === status ? 'active' : ''}`}
                            onClick={() => {
                                setSelectedStatus(status);
                                setSearchTerm('');
                            }}
                        >
                            {status}
                        </button>
                    ))}
                </div>
                <div className="right-controls">
                    <div className="search-wrapper">
                        <IoSearch className="search-icon" />
                        <input
                            type="text"
                            placeholder="Search by Username, Name, Position, or Date"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="search-input"
                        />
                    </div>
                </div>
            </div>

            <table>
                <thead>
                    <tr>
                        <th >#</th>
                        <th>Employee Name</th>
                        <th>Position</th>
                        <th>{selectedStatus === "Terminated" ? "Terminated Date" : "Hire Date"}</th>
                        <th>Status</th>
                        <th className="employee-details-column">Details</th>
                    </tr>
                </thead>
                <tbody>
                    {filteredEmployees.map((emp, index) => (
                        <tr key={emp.employeeId}>
                            <td className="indexes">{index + 1}</td>
                            <td className="employee-name-column">
                                <span className="employee-name">{emp.firstName} {emp.lastName}</span>
                                <br />
                                <span className="employee-username-list">({emp.username})</span>
                            </td>
                            <td>{roleMap[emp.roleId]}</td>
                            <td>
                                {selectedStatus === "Terminated"
                                    ? emp.terminatedDate ? formatOrderDateTime(emp.terminatedDate) : 'N/A'
                                    : formatOrderDateTime(emp.hireDate)}
                            </td>
                            <td>
                                <p className={emp.terminated ? 'status-rejected' : 'status-approved'}>
                                    {emp.terminated ? 'Terminated' : 'Active'}
                                </p>
                            </td>
                            <td className="employee-details-column">
                                <button onClick={() => setSelectedEmployee(emp)} className="view-button">
                                    <FaChevronRight />
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>

            {selectedEmployee && (
                <div className="employee-modal-overlay" onClick={() => setSelectedEmployee(null)}>
                    <div className="employee-details-modal" onClick={(e) => e.stopPropagation()}>
                        <h3>Employee Details</h3>
                        {errorMsg && <p className="error">{errorMsg}</p>}
                        <div className="modal-fields">
                            <div className="modal-row">
                                <label>
                                    <strong>First Name:</strong>
                                    {editMode ? (
                                        <input
                                            value={editedData.firstName || ''}
                                            onChange={(e) => handleChange('firstName', e.target.value)}
                                        />
                                    ) : (
                                        <span>{selectedEmployee.firstName}</span>
                                    )}
                                </label>
                                <label>
                                    <strong>Last Name:</strong>
                                    {editMode ? (
                                        <input
                                            value={editedData.lastName || ''}
                                            onChange={(e) => handleChange('lastName', e.target.value)}
                                        />
                                    ) : (
                                        <span>{selectedEmployee.lastName}</span>
                                    )}
                                </label>
                            </div>

                            <div className="modal-row">
                                <label>
                                    <strong>Username:</strong>
                                    {editMode ? (
                                        <input
                                            value={editedData.username || ''}
                                            onChange={(e) => handleChange('username', e.target.value)}
                                        />
                                    ) : (
                                        <span>{selectedEmployee.username}</span>
                                    )}
                                </label>
                                <label>
                                    <strong>Email:</strong>
                                    {editMode ? (
                                        <input
                                            value={editedData.email || ''}
                                            onChange={(e) => handleChange('email', e.target.value)}
                                        />
                                    ) : (
                                        <span>{selectedEmployee.email}</span>
                                    )}
                                </label>
                            </div>

                            <div className="modal-row">
                                <label>
                                    <strong>Phone:</strong>
                                    {editMode ? (
                                        <input
                                            value={editedData.phone || ''}
                                            onChange={(e) => handleChange('phone', e.target.value)}
                                        />
                                    ) : (
                                        <span>{selectedEmployee.phone}</span>
                                    )}
                                </label>
                                <label>
                                    <strong>Address:</strong>
                                    {editMode ? (
                                        <textarea
                                            value={editedData.Address || ''}
                                            onChange={(e) => handleChange('Address', e.target.value)}
                                        />
                                    ) : (
                                        <span>{selectedEmployee.Address}</span>
                                    )}
                                </label>
                            </div>

                            <p>
                                <strong>Position:</strong> {roleMap[selectedEmployee.roleId]}
                            </p>
                            <p>
                                <strong>Status:</strong>{' '}
                                {selectedEmployee.terminated ? 'Terminated' : 'Active'}
                            </p>

                            <div className="permissions-section">
                                <h4>Access Permissions</h4>
                                {selectedEmployee.roleId === 1 ? (
                                    <p className="admin-access-message">Have access to all</p>
                                ) : editMode ? (
                                    <div className="permissions-grid">
                                        {allPermissions.map((perm) => (
                                            <label key={perm.id} className="permission-checkbox-label">
                                                <input
                                                    type="checkbox"
                                                    checked={editedPermissions[perm.name] || false}
                                                    onChange={(e) =>
                                                        handlePermissionChange(perm.name, e.target.checked)
                                                    }
                                                    disabled={arePermissionsDisabledForSelected}
                                                />
                                                {perm.label}
                                            </label>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="permissions-display">
                                        {selectedEmployee.permissions && selectedEmployee.permissions.length > 0 ? (
                                            <ul>
                                                {selectedEmployee.permissions.map((permName) => (
                                                    <li key={permName}>
                                                        {allPermissions.find((p) => p.name === permName)?.label ||
                                                            permName}
                                                    </li>
                                                ))}
                                            </ul>
                                        ) : (
                                            <p>No specific permissions assigned.</p>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>

                        {!editMode && (
                            <div className="employee-actions">
                                {!selectedEmployee.terminated && selectedEmployee.employeeId !== currentUserId && (
                                    <>
                                        {selectedEmployee.roleId !== 1 && (
                                            <>
                                                {selectedEmployee.roleId === 3 && (
                                                    <button
                                                        onClick={() =>
                                                            requestRoleChange(selectedEmployee.employeeId, 2)
                                                        }
                                                        className="promote-button"
                                                    >
                                                        <FaAngleDoubleUp /> Promote to Manager
                                                    </button>
                                                )}
                                                {selectedEmployee.roleId === 2 && (
                                                    <button
                                                        onClick={() =>
                                                            requestRoleChange(selectedEmployee.employeeId, 3)
                                                        }
                                                        className="demote-button"
                                                    >
                                                        <FaAngleDoubleDown /> Demote to Employee
                                                    </button>
                                                )}
                                            </>
                                        )}
                                        {(currentUserRole === 1 || hasPermission('Employee List Management')) && (
                                            <button
                                                onClick={() => requestTermination(selectedEmployee.employeeId)}
                                                disabled={selectedEmployee.roleId === 1 && currentUserRole !== 1}
                                                className="terminate-button"
                                            >
                                                <TbUserCancel /> Terminate
                                            </button>
                                        )}
                                    </>
                                )}

                                {selectedEmployee.terminated &&
                                    (currentUserRole === 1 || hasPermission('Employee List Management')) && (
                                        <button
                                            onClick={() => requestRehire(selectedEmployee.employeeId)}
                                            className="terminate-button"
                                        >
                                            Rehire
                                        </button>
                                )}

                                {!selectedEmployee.terminated && (currentUserRole === 1 || hasPermission('Employee List Management')) && (
                                    <button
                                        onClick={startEditing}
                                        disabled={selectedEmployee.roleId === 1 && currentUserRole !== 1}
                                        className="edit-button"
                                    >
                                        <FaPencilAlt /> Edit Details
                                    </button>
                                )}
                            </div>
                        )}

                        {editMode && (
                            <div className="employee-actions">
                                <button onClick={() => setConfirmSave(true)} className="confirm-button">
                                    Save
                                </button>
                                <button onClick={cancelEdit} className="cancel-button">
                                    Cancel
                                </button>
                            </div>
                        )}

                        <button onClick={() => {
                            setSelectedEmployee(null);
                            setEditMode(false);
                            setErrorMsg('');
                            setEditedData({});
                            setEditedPermissions({});
                        }} className="close-button">
                            X
                        </button>
                    </div>
                </div>
            )}

            {confirmSave && (
                <div className="modal-con">
                    <div className="modal-con-content">
                        <GoQuestion className="alert-icon" />
                        <h2>Do you want to save the changes?</h2>
                        <p>{selectedEmployee.username}'s changes will be saved.</p>
                        <button
                            onClick={() => {
                                setConfirmSave(false);
                                saveEdit();
                            }}
                            className="confirm-button"
                        >
                            Yes, Save
                        </button>
                        <button onClick={() => setConfirmSave(false)} className="cancel-button">
                            No
                        </button>
                    </div>
                </div>
            )}

            {confirmCancel && (
                <div className="modal-con">
                    <div className="modal-con-content">
                        <CiCircleAlert className="alert-icon" />
                        <h2>Do you want to discard the changes?</h2>
                        <p> {selectedEmployee.username}'s information unsaved changes will be lost.</p>
                        <button
                            onClick={() => {
                                setConfirmCancel(false);
                                setEditMode(false);
                                setErrorMsg('');
                                setEditedData({});
                                setEditedPermissions({});
                            }}
                            className="confirm-button"
                        >
                            Yes, Discard
                        </button>
                        <button onClick={() => setConfirmCancel(false)} className="cancel-button">
                            No
                        </button>
                    </div>
                </div>
            )}

            {confirmAction && (
                <div className="modal-con">
                    <div className="modal-con-content">
                        <GoQuestion className="alert-icon" />
                        <h2>{confirmAction}</h2>
                        <p>This action cannot be undone.</p>
                        <button
                            onClick={() => {
                                if (pendingAction) pendingAction();
                                setConfirmAction(null);
                                setPendingAction(null);
                            }}
                            className="confirm-button"
                        >
                            Yes
                        </button>
                        <button
                            onClick={() => {
                                setConfirmAction(null);
                                setPendingAction(null);
                            }}
                            className="cancel-button"
                        >
                            No
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default EmployeeManagement;