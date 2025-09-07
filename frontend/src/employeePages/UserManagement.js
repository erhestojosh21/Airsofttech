import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './EmployeeList.css';
import { jwtDecode } from 'jwt-decode';
import { GoQuestion } from 'react-icons/go';
import { FaPencilAlt } from 'react-icons/fa';
import { IoSearch } from 'react-icons/io5';
import { FaChevronRight } from 'react-icons/fa';
import { formatOrderDateTime } from '../utils/dateFormatter';

const UserManagement = () => {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [refresh, setRefresh] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editedData, setEditedData] = useState({});
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('All');

  const [confirmAction, setConfirmAction] = useState(null);
  const [pendingAction, setPendingAction] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');

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

  const hasPermission = (permissionName) => {
    if (currentUserRole === 1) {
      return true;
    }
    return currentUserPermissions.includes(permissionName);
  };

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await axios.get(`${process.env.REACT_APP_API_URL}/users`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setUsers(res.data);
      } catch (err) {
        console.error('Error fetching users:', err);
        setErrorMsg('Failed to load user data.');
      }
    };

    if (token) fetchUsers();
  }, [token, refresh]);

  useEffect(() => {
    const listToFilter = users;

    const filtered = listToFilter.filter((user) => {
      const search = searchTerm.toLowerCase();
      const matchesSearch =
        user.username?.toLowerCase().includes(search) ||
        user.first_name?.toLowerCase().includes(search) ||
        user.last_name?.toLowerCase().includes(search) ||
        user.email?.toLowerCase().includes(search);

      if (selectedStatus === 'All') {
        return matchesSearch;
      } else if (selectedStatus === 'Active') {
        return matchesSearch && !user.banned;
      } else {
        return matchesSearch && user.banned;
      }
    });
    setFilteredUsers(filtered);
  }, [searchTerm, users, selectedStatus]);

  const handleBanToggle = async (userId, shouldBan) => {
    try {
      await axios.put(
        `${process.env.REACT_APP_API_URL}/users/${userId}/ban`,
        { banned: shouldBan, employeeId: currentUserId, username: currentUsername },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setRefresh(!refresh);
      setSelectedUser(null);
      setConfirmAction(null);
      setPendingAction(null);
      setErrorMsg('');
    } catch (err) {
      console.error('Error updating user status:', err);
      setErrorMsg(err.response?.data?.message || 'Failed to update user status.');
      setConfirmAction(null);
      setPendingAction(null);
    }
  };

  const handleEditSave = async () => {
    try {
      const { username, email, first_name, last_name } = editedData;

      const updateInfoRes = await axios.put(
        `${process.env.REACT_APP_API_URL}/users/${selectedUser.userId}/update-info`,
        {
          username,
          email,
          first_name,
          last_name,
          editorId: currentUserId,
          editorUsername: currentUsername,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (!updateInfoRes.data.success) {
        setErrorMsg(updateInfoRes.data.message || 'Update failed');
        setConfirmAction(null);
        return;
      }

      setRefresh((prev) => !prev);
      setEditMode(false);
      setSelectedUser(null);
      setConfirmAction(null);
      setErrorMsg('');
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Server error during save');
      setConfirmAction(null);
    }
  };

  const startEditing = () => {
    setEditMode(true);
    setEditedData({ ...selectedUser });
  };

  const handleChange = (field, value) => {
    setEditedData((prev) => ({ ...prev, [field]: value }));
  };

  const cancelEdit = () => {
    setEditMode(false);
    setEditedData({});
    setErrorMsg('');
  };

  const requestBanToggle = (userId, shouldBan) => {
    setPendingAction(() => () => handleBanToggle(userId, shouldBan));
    setConfirmAction(`Do you want to ${shouldBan ? 'restrict' : 'unrestrict'} this user?`);
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const options = { year: 'numeric', month: '2-digit', day: '2-digit' };
    return date.toLocaleDateString('en-US', options);
  };

  return (
    <div className="employee-container">
      <h2 className="title-req">User Management ({selectedStatus})</h2>

      <div className="inventory-controls">
        <div className="left-controls">
          {['All', 'Active', 'Banned'].map((status) => (
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
              placeholder="Search by Username, Name, or Email"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>
        </div>
      </div>

      <table className="employee-table">
        <thead>
          <tr>
            <th>#</th>
            <th>Customer Name</th>
            <th>Email</th>
            <th>Created At</th>
            <th>Status</th>
            <th className="employee-details-column">Details</th>
          </tr>
        </thead>
        <tbody>
          {filteredUsers.map((user, index) => (
            <tr key={user.userId}>
              <td className="indexes">{index + 1}</td>
              <td className="employee-name-column">
                <span className="employee-name">
                  {user.first_name} {user.last_name}
                </span>
                <br />
                <span className="employee-username-list">({user.username})</span>
              </td>
              <td>{user.email}</td>
              <td>{formatOrderDateTime(user.createdAt)}</td>
              <td>
                <p className={user.banned ? 'status-rejected' : 'status-approved'}>
                  {user.banned ? 'Banned' : 'Active'}
                </p>
              </td>
              <td className="employee-details-column">
                <button onClick={() => navigate(`/admin/user-management/${user.user_tag}`)} className="view-button">
                  <FaChevronRight />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {selectedUser && (
        <div
          className="employee-modal-overlay"
          onClick={() => {
            setSelectedUser(null);
            setEditMode(false);
            setErrorMsg('');
            setEditedData({});
          }}
        >
          <div className="employee-details-modal" onClick={(e) => e.stopPropagation()}>
            <h3>User Details</h3>
            {errorMsg && <p className="error">{errorMsg}</p>}
            <div className="modal-fields">
              <div className="modal-row">
                <label>
                  <strong>First Name:</strong>
                  {editMode ? (
                    <input
                      value={editedData.first_name || ''}
                      onChange={(e) => handleChange('first_name', e.target.value)}
                    />
                  ) : (
                    <span>{selectedUser.first_name}</span>
                  )}
                </label>
                <label>
                  <strong>Last Name:</strong>
                  {editMode ? (
                    <input
                      value={editedData.last_name || ''}
                      onChange={(e) => handleChange('last_name', e.target.value)}
                    />
                  ) : (
                    <span>{selectedUser.last_name}</span>
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
                    <span>{selectedUser.username}</span>
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
                    <span>{selectedUser.email}</span>
                  )}
                </label>
              </div>

              <p>
                <strong>Account Created:</strong> {formatDate(selectedUser.createdAt)}
              </p>
              <p>
                <strong>Status:</strong> {selectedUser.banned ? 'Banned' : 'Active'}
              </p>

              <div className="permissions-section">
                <h4>Access Status</h4>
                {selectedUser.banned ? (
                  <p className="admin-access-message">This user is currently restricted.</p>
                ) : (
                  <p>This user is currently active.</p>
                )}
              </div>
            </div>

            {!editMode && (
              <div className="employee-actions">
                {selectedUser.banned ? (
                  <button
                    onClick={() => requestBanToggle(selectedUser.userId, 0)}
                    className="promote-button"
                    disabled={!hasPermission('User Management')}
                  >
                    Unrestrict User
                  </button>
                ) : (
                  <button
                    onClick={() => requestBanToggle(selectedUser.userId, 1)}
                    className="terminate-button"
                    disabled={!hasPermission('User Management') || selectedUser.userId === currentUserId}
                  >
                    Restrict User
                  </button>
                )}
                {hasPermission('User Management') && (
                  <button onClick={startEditing} className="edit-button">
                    <FaPencilAlt /> Edit Details
                  </button>
                )}
              </div>
            )}

            {editMode && (
              <div className="employee-actions">
                <button onClick={() => setConfirmAction('save')} className="confirm-button">
                  Save
                </button>
                <button onClick={cancelEdit} className="cancel-button">
                  Cancel
                </button>
              </div>
            )}

            <button
              onClick={() => {
                setSelectedUser(null);
                setEditMode(false);
                setErrorMsg('');
                setEditedData({});
              }}
              className="close-button"
            >
              X
            </button>
          </div>
        </div>
      )}

      {confirmAction && (
        <div className="modal-con">
          <div className="modal-con-content">
            <GoQuestion className="alert-icon" />
            <h2>{confirmAction === 'save' ? 'Do you want to save the changes?' : confirmAction}</h2>
            {confirmAction === 'save' && <p>{selectedUser.username}'s changes will be saved.</p>}
            <div className="modal-buttons">
              <button
                onClick={() => {
                  if (confirmAction === 'save') {
                    handleEditSave();
                  } else if (pendingAction) {
                    pendingAction();
                  }
                  setConfirmAction(null);
                }}
                className="confirm-button"
              >
                Confirm
              </button>
              <button
                onClick={() => {
                  setConfirmAction(null);
                  setPendingAction(null);
                  setErrorMsg('');
                }}
                className="cancel-button"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;