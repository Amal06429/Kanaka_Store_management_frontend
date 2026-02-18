import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { usersAPI, filesAPI } from '../../api/api';
import Uploaded_files from '../../components/Uploaded_files';
import './AdminDashboard.scss';

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState(() => {
    // Get saved tab from localStorage or default to 'dailyReport'
    return localStorage.getItem('adminActiveTab') || 'dailyReport';
  });
  const [users, setUsers] = useState([]);
  const [showCreateUser, setShowCreateUser] = useState(false);
  const [refreshFiles, setRefreshFiles] = useState(0);
  const [loading, setLoading] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showUserModal, setShowUserModal] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [showEditUserModal, setShowEditUserModal] = useState(false);
  const [userSearchQuery, setUserSearchQuery] = useState('');
  
  // Daily report states
  const [dailyReportFiles, setDailyReportFiles] = useState([]);
  const [loadingDailyReport, setLoadingDailyReport] = useState(false);
  const [expandedUser, setExpandedUser] = useState(null);
  const [reportDate, setReportDate] = useState(new Date().toISOString().split('T')[0]); // Default to today
  
  // Upload states
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [heading, setHeading] = useState('');
  const [description, setDescription] = useState('');
  const [uploadDate, setUploadDate] = useState(new Date().toISOString().split('T')[0]);
  const [isUploadFormOpen, setIsUploadFormOpen] = useState(false);
  const [documentType, setDocumentType] = useState('');
  const [amount, setAmount] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    console.log('AdminDashboard: User changed:', user);
    if (user && user.role === 'admin') {
      console.log('AdminDashboard: Loading users...');
      loadUsers();
    }
  }, [user]);

  useEffect(() => {
    // Trigger file refresh when switching to files tab or upload tab
    if (activeTab === 'files' || activeTab === 'upload') {
      console.log('AdminDashboard: Files tab activated, triggering refresh');
      setRefreshFiles(prev => prev + 1);
    }
    // Load daily report when switching to daily report tab
    if (activeTab === 'dailyReport') {
      console.log('AdminDashboard: Daily Report tab activated, loading daily report');
      loadDailyReport();
    }
    // Save active tab to localStorage
    localStorage.setItem('adminActiveTab', activeTab);
  }, [activeTab]);

  useEffect(() => {
    // Close dropdown when clicking outside
    const handleClickOutside = (event) => {
      if (showProfileDropdown && !event.target.closest('.profile-section')) {
        setShowProfileDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showProfileDropdown]);

  useEffect(() => {
    // Reload daily report when date changes
    if (activeTab === 'dailyReport') {
      loadDailyReport();
    }
  }, [reportDate]);

  const loadUsers = async () => {
    setLoading(true);
    try {
      console.log('AdminDashboard: Fetching users from API...');
      const data = await usersAPI.getRegularUsers();
      console.log('AdminDashboard: Users loaded:', data);
      setUsers(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('AdminDashboard: Failed to load users:', error);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const loadDailyReport = async () => {
    setLoadingDailyReport(true);
    try {
      // Use backend date filtering for better performance
      const data = await filesAPI.getAll({ date: reportDate });
      
      // Filter out admin uploads (backend already filters by date)
      const filteredFiles = Array.isArray(data) 
        ? data.filter(file => file.user_role !== 'admin')
        : [];
      
      setDailyReportFiles(filteredFiles);
    } catch (error) {
      console.error('Failed to load daily report:', error);
      setDailyReportFiles([]);
    } finally {
      setLoadingDailyReport(false);
    }
  };

  const handleLogout = () => {
    setShowProfileDropdown(false);
    setTimeout(() => {
      logout();
      navigate('/login');
    }, 300);
  };

  const toggleProfileDropdown = () => {
    setShowProfileDropdown(!showProfileDropdown);
  };

  const handleFileUpload = (e) => {
    const files = Array.from(e.target.files);
    
    if (files.length === 0) return;

    setSelectedFiles(files);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      setSelectedFiles(files);
    }
  };

  const handleUploadSubmit = async (e) => {
    e.preventDefault();
    
    if (selectedFiles.length === 0) {
      alert('Please select files to upload');
      return;
    }
    if (documentType === 'cheque' && !amount) {
      alert('Please enter the amount for cheque');
      return;
    }

    setUploading(true);

    try {
      console.log('AdminDashboard: Starting file upload...');
      // Upload each file
      for (const file of selectedFiles) {
        console.log('AdminDashboard: Uploading file:', file.name);
        const formData = new FormData();
        formData.append('file', file);
        formData.append('heading', heading);
        formData.append('description', description);
        formData.append('uploaded_at', uploadDate);
        formData.append('document_type', documentType);
        if (documentType === 'cheque' && amount) {
          formData.append('amount', amount);
        }

        const result = await filesAPI.upload(formData);
        console.log('AdminDashboard: File uploaded successfully:', result);
      }

      console.log('AdminDashboard: All files uploaded, reloading file list...');
      
      // Clear form
      setSelectedFiles([]);
      setHeading('');
      setDescription('');
      setUploadDate(new Date().toISOString().split('T')[0]);
      setDocumentType('');
      setAmount('');
      
      // Reset file input
      const fileInput = document.getElementById('admin-file-upload');
      if (fileInput) fileInput.value = '';
      
      // Refresh files list
      setRefreshFiles(prev => prev + 1);
      
      alert('Files uploaded successfully!');
    } catch (error) {
      console.error('Upload failed:', error);
      alert('Failed to upload files: ' + error.message);
    } finally {
      setUploading(false);
    }
  };

  const clearUploadForm = () => {
    setSelectedFiles([]);
    setHeading('');
    setDescription('');
    setUploadDate(new Date().toISOString().split('T')[0]);
    setDocumentType('');
    setAmount('');
    const fileInput = document.getElementById('admin-file-upload');
    if (fileInput) fileInput.value = '';
  };

  const deleteUser = async (userId) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      try {
        await usersAPI.delete(userId);
        loadUsers();
        setRefreshFiles(prev => prev + 1); // Trigger refresh of files component
      } catch (error) {
        console.error('Failed to delete user:', error);
        alert('Failed to delete user');
      }
    }
  };

  const handleViewUser = (userData) => {
    setSelectedUser(userData);
    setShowUserModal(true);
    setShowPassword(false);
  };

  const handleCloseUserModal = () => {
    setShowUserModal(false);
    setSelectedUser(null);
    setShowPassword(false);
  };

  const handleEditUser = (userData) => {
    setEditingUser(userData);
    setShowEditUserModal(true);
  };

  const handleCloseEditUserModal = () => {
    setShowEditUserModal(false);
    setEditingUser(null);
  };

  const handleUpdateUser = async () => {
    await loadUsers();
    handleCloseEditUserModal();
  };

  return (
    <div className="admin-dashboard">
      <div className="dashboard-header">
        <div className="header-left">
          <div className="header-avatar">{user?.username?.charAt(0).toUpperCase() || 'A'}</div>
          <div>
            <h1>Admin Dashboard</h1>
            <p>Welcome back, {user?.email || user?.username}</p>
          </div>
        </div>
        <div className="header-right">
          <div className="profile-section">
            <div className="profile-icon" onClick={toggleProfileDropdown}>
              {user?.username?.charAt(0).toUpperCase() || 'A'}
            </div>
            {showProfileDropdown && (
              <div className="profile-dropdown">
                <div className="profile-dropdown-content">
                  <div className="profile-info">
                    <p className="profile-name">{user?.username}</p>
                    <p className="profile-role">{user?.role}</p>
                  </div>
                  <div className="dropdown-divider"></div>
                  <button onClick={handleLogout} className="logout-dropdown-btn">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.58L17 17l5-5zM4 5h8V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h8v-2H4V5z"/>
                    </svg>
                    Logout
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="dashboard-tabs">
        <button 
          className={activeTab === 'dailyReport' ? 'tab active' : 'tab'}
          onClick={() => setActiveTab('dailyReport')}
        >
          Daily Report
        </button>
        <button 
          className={activeTab === 'users' ? 'tab active' : 'tab'}
          onClick={() => setActiveTab('users')}
        >
          User Management
        </button>
        <button 
          className={activeTab === 'upload' ? 'tab active' : 'tab'}
          onClick={() => setActiveTab('upload')}
        >
          Upload Files
        </button>
        <button 
          className={activeTab === 'files' ? 'tab active' : 'tab'}
          onClick={() => setActiveTab('files')}
        >
          Users' Files
        </button>
      </div>

      <div className="dashboard-content">
        {activeTab === 'dailyReport' && (
          <div className="daily-report-section">
            <div className="section-header">
              <h2>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" style={{verticalAlign: 'middle', marginRight: '8px'}}>
                  <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM9 17H7v-7h2v7zm4 0h-2V7h2v10zm4 0h-2v-4h2v4z"/>
                </svg>
                Daily Upload Report - {new Date(reportDate).toLocaleDateString('en-GB')}
              </h2>
            </div>
            
            {/* Date Filter Controls */}
            <div className="report-date-filter">
              <div className="date-filter-group">
                <label htmlFor="report-date">Select Date:</label>
                <input
                  type="date"
                  id="report-date"
                  value={reportDate}
                  onChange={(e) => {
                    setReportDate(e.target.value);
                    setExpandedUser(null); // Collapse any expanded user when changing date
                  }}
                  max={new Date().toISOString().split('T')[0]} // Prevent selecting future dates
                  className="date-input"
                />
              </div>
              <div className="date-quick-buttons">
                <button 
                  onClick={() => {
                    setReportDate(new Date().toISOString().split('T')[0]);
                    setExpandedUser(null);
                  }}
                  className={reportDate === new Date().toISOString().split('T')[0] ? 'quick-btn active' : 'quick-btn'}
                >
                  Today
                </button>
                <button 
                  onClick={() => {
                    const yesterday = new Date();
                    yesterday.setDate(yesterday.getDate() - 1);
                    setReportDate(yesterday.toISOString().split('T')[0]);
                    setExpandedUser(null);
                  }}
                  className={(() => {
                    const yesterday = new Date();
                    yesterday.setDate(yesterday.getDate() - 1);
                    return reportDate === yesterday.toISOString().split('T')[0] ? 'quick-btn active' : 'quick-btn';
                  })()}
                >
                  Yesterday
                </button>
                <button 
                  onClick={() => {
                    const lastWeek = new Date();
                    lastWeek.setDate(lastWeek.getDate() - 7);
                    setReportDate(lastWeek.toISOString().split('T')[0]);
                    setExpandedUser(null);
                  }}
                  className="quick-btn"
                >
                  Last 7 Days Ago
                </button>
              </div>
            </div>
            
            {loadingDailyReport ? (
              <p className="loading">Loading daily report...</p>
            ) : dailyReportFiles.length === 0 ? (
              <div className="no-data-card">
                <p>No uploads recorded on {new Date(reportDate).toLocaleDateString('en-GB')}.</p>
              </div>
            ) : (
              <div className="daily-report-content">
                <div className="daily-uploads-table">
                  <h3>Uploads by User</h3>
                  <table className="report-table">
                    <thead>
                      <tr>
                        <th>User</th>
                        <th>Files Uploaded</th>
                        <th>Latest Upload</th>
                        <th>Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Object.entries(
                        dailyReportFiles.reduce((acc, file) => {
                          const username = file.user_username || 'Unknown';
                          if (!acc[username]) {
                            acc[username] = {
                              count: 0,
                              files: [],
                              latestUpload: file.uploaded_at,
                              statuses: { pending: 0, verified: 0, rejected: 0 }
                            };
                          }
                          acc[username].count++;
                          acc[username].files.push(file);
                          acc[username].statuses[file.status || 'pending']++;
                          if (new Date(file.uploaded_at) > new Date(acc[username].latestUpload)) {
                            acc[username].latestUpload = file.uploaded_at;
                          }
                          return acc;
                        }, {})
                      ).map(([username, data]) => (
                        <>
                          <tr key={username} className={expandedUser === username ? 'expanded-row' : ''}>
                            <td data-label="User"><strong>{username}</strong></td>
                            <td data-label="Files Uploaded">{data.count} file{data.count > 1 ? 's' : ''}</td>
                            <td data-label="Latest Upload">{new Date(data.latestUpload).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</td>
                            <td data-label="Status">
                              <div className="status-summary">
                                {data.statuses.verified > 0 && (
                                  <span className="status-badge-small status-verified">
                                    ✓ {data.statuses.verified}
                                  </span>
                                )}
                                {data.statuses.pending > 0 && (
                                  <span className="status-badge-small status-pending">
                                    ⏳ {data.statuses.pending}
                                  </span>
                                )}
                                {data.statuses.rejected > 0 && (
                                  <span className="status-badge-small status-rejected">
                                    ✕ {data.statuses.rejected}
                                  </span>
                                )}
                              </div>
                            </td>
                            <td data-label="Actions">
                              <button 
                                onClick={() => setExpandedUser(expandedUser === username ? null : username)}
                                className="view-files-btn"
                                title={expandedUser === username ? "Hide files" : "View files"}
                              >
                                {expandedUser === username ? '▲ Hide' : '▼ View Files'}
                              </button>
                            </td>
                          </tr>
                          {expandedUser === username && (
                            <tr key={`${username}-files`} className="expanded-files-row">
                              <td colSpan="5">
                                <div className="files-detail-section">
                                  <h4>Files uploaded by {username} on {new Date(reportDate).toLocaleDateString('en-GB')}:</h4>
                                  <div className="files-list-grid">
                                    {data.files.map((file) => (
                                      <div key={file.id} className="file-card">
                                        <div className="file-card-header">
                                          <div className="file-icon-name">
                                            <span className="file-emoji">
                                              {file.file_type?.startsWith('image/') ? (
                                                <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                                                  <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/>
                                                </svg>
                                              ) : file.name.endsWith('.pdf') ? (
                                                <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                                                  <path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z"/>
                                                </svg>
                                              ) : file.name.endsWith('.doc') || file.name.endsWith('.docx') ? (
                                                <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                                                  <path d="M14 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V8l-6-6zM6 20V4h7v5h5v11H6z"/>
                                                </svg>
                                              ) : file.name.endsWith('.xls') || file.name.endsWith('.xlsx') ? (
                                                <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                                                  <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM9 17H7v-7h2v7zm4 0h-2V7h2v10zm4 0h-2v-4h2v4z"/>
                                                </svg>
                                              ) : (
                                                <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                                                  <path d="M16.5 6v11.5c0 2.21-1.79 4-4 4s-4-1.79-4-4V5c0-1.38 1.12-2.5 2.5-2.5s2.5 1.12 2.5 2.5v10.5c0 .55-.45 1-1 1s-1-.45-1-1V6H10v9.5c0 1.38 1.12 2.5 2.5 2.5s2.5-1.12 2.5-2.5V5c0-2.21-1.79-4-4-4S7 2.79 7 5v12.5c0 3.04 2.46 5.5 5.5 5.5s5.5-2.46 5.5-5.5V6h-1.5z"/>
                                                </svg>
                                              )}
                                            </span>
                                            <div className="file-info">
                                              <strong>{file.heading || file.name}</strong>
                                              <small>{file.name}</small>
                                            </div>
                                          </div>
                                          <span className={`status-badge status-${file.status || 'pending'}`}>
                                            {(file.status || 'pending').charAt(0).toUpperCase() + (file.status || 'pending').slice(1)}
                                          </span>
                                        </div>
                                        <div className="file-card-body">
                                          {file.description && <p className="file-description">{file.description}</p>}
                                          {file.document_type && (
                                            <p className="file-doc-type">
                                              <strong>Type:</strong> {file.document_type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                                            </p>
                                          )}
                                          {file.amount && (
                                            <p className="file-amount">
                                              <strong>Amount:</strong> ₹{parseFloat(file.amount).toLocaleString('en-IN', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                                            </p>
                                          )}
                                          <p className="file-time">
                                            <strong>Uploaded:</strong> {new Date(file.uploaded_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                                          </p>
                                        </div>
                                        <div className="file-card-actions">
                                          {file.file_url && (
                                            <a 
                                              href={file.file_url} 
                                              target="_blank" 
                                              rel="noopener noreferrer"
                                              className="download-btn-small"
                                              title="Download file"
                                            >
                                              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                                                <path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"/>
                                              </svg>
                                              {' '}Download
                                            </a>
                                          )}
                                          {file.file_type?.startsWith('image/') && file.file_url && (
                                            <a 
                                              href={file.file_url} 
                                              target="_blank" 
                                              rel="noopener noreferrer"
                                              className="preview-btn-small"
                                              title="Preview image"
                                            >
                                              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                                                <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/>
                                              </svg>
                                              {' '}Preview
                                            </a>
                                          )}
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              </td>
                            </tr>
                          )}
                        </>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'users' && (
          <div className="users-section">
            <div className="section-header">
              <h2>Manage Users</h2>
              <div className="header-actions">
                <div className="search-box">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="#999">
                    <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
                  </svg>
                  <input 
                    type="text" 
                    placeholder="Search users..." 
                    className="search-input"
                    value={userSearchQuery}
                    onChange={(e) => setUserSearchQuery(e.target.value)}
                  />
                </div>
                <button 
                  onClick={() => setShowCreateUser(!showCreateUser)}
                  className="create-user-btn"
                >
                  + Create New User
                </button>
              </div>
            </div>

            {showCreateUser && <CreateUserForm onUserCreated={() => { loadUsers(); setShowCreateUser(false); }} />}

            <div className="users-list">
              {loading ? (
                <p className="loading">Loading users...</p>
              ) : users.length === 0 ? (
                <p className="no-data">No users created yet. Create your first user!</p>
              ) : (() => {
                const filteredUsers = users.filter(u => {
                  if (!userSearchQuery) return true;
                  const query = userSearchQuery.toLowerCase();
                  return (
                    u.username?.toLowerCase().includes(query) ||
                    u.staff_name?.toLowerCase().includes(query) ||
                    u.shop_name?.toLowerCase().includes(query) ||
                    u.mobile_number?.includes(query) ||
                    u.email?.toLowerCase().includes(query)
                  );
                });

                return filteredUsers.length === 0 ? (
                  <p className="no-data">No users found matching "{userSearchQuery}"</p>
                ) : (
                  <table className="users-table">
                    <thead>
                      <tr>
                        <th>#</th>
                        <th>USER INFO</th>
                        <th>SHOP</th>
                        <th>CONTACT</th>
                        <th>CREATED</th>
                        <th>ACTIONS</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredUsers.map((u, index) => (
                      <tr key={u.id}>
                        <td data-label="#">{index + 1}</td>
                        <td data-label="User Info">
                          <div className="user-info-cell">
                            <div className="user-avatar">{u.username.charAt(0).toUpperCase()}</div>
                            <div>
                              <div className="user-name">{u.username}</div>
                              <div className="user-staff-name">{u.staff_name || 'N/A'}</div>
                            </div>
                          </div>
                        </td>
                        <td data-label="Shop">
                          {u.shop_name ? <span className="shop-badge">{u.shop_name}</span> : '-'}
                        </td>
                        <td data-label="Contact">
                          <div>{u.mobile_number || '-'}</div>
                          {u.email && <div className="user-email-small">{u.email}</div>}
                        </td>
                        <td data-label="Created">{new Date(u.created_at).toLocaleDateString('en-GB')}</td>
                        <td data-label="Actions">
                          <div className="action-icons">
                            <button 
                              onClick={() => handleViewUser(u)}
                              className="view-user-btn"
                              title="View details"
                            >
                              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/>
                              </svg>
                            </button>
                            <button 
                              onClick={() => handleEditUser(u)}
                              className="edit-btn"
                              title="Edit user"
                            >
                              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
                              </svg>
                            </button>
                            <button 
                              onClick={() => deleteUser(u.id)}
                              className="delete-btn"
                              title="Delete user"
                            >
                              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
                              </svg>
                            </button>
                          </div>
                        </td>
                      </tr>
                      ))}
                    </tbody>
                  </table>
                );
              })()}
            </div>
          </div>
        )}

        {activeTab === 'upload' && (
          <div className="upload-section">
            <div 
              className="upload-section-header" 
              onClick={() => setIsUploadFormOpen(!isUploadFormOpen)}
            >
              <h2>Upload Files</h2>
              <button className="dropdown-toggle-btn">
                {isUploadFormOpen ? '▲' : '▼'}
              </button>
            </div>

            {isUploadFormOpen && (
              <div className="upload-form-wrapper">
                <form onSubmit={handleUploadSubmit} className="upload-form">
                  <div 
                    className={`form-group file-dropzone ${isDragging ? 'dragging' : ''}`}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                  >
                    <label htmlFor="admin-file-upload" className="file-upload-label">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" style={{verticalAlign: 'middle', marginRight: '8px'}}>
                        <path d="M16.5 6v11.5c0 2.21-1.79 4-4 4s-4-1.79-4-4V5c0-1.38 1.12-2.5 2.5-2.5s2.5 1.12 2.5 2.5v10.5c0 .55-.45 1-1 1s-1-.45-1-1V6H10v9.5c0 1.38 1.12 2.5 2.5 2.5s2.5-1.12 2.5-2.5V5c0-2.21-1.79-4-4-4S7 2.79 7 5v12.5c0 3.04 2.46 5.5 5.5 5.5s5.5-2.46 5.5-5.5V6h-1.5z"/>
                      </svg>
                      {isDragging ? 'Drop files here' : 'Select Files or Drag & Drop'}
                    </label>
                    <input
                      type="file"
                      id="admin-file-upload"
                      onChange={handleFileUpload}
                      multiple
                      className="file-input"
                    />
                    {selectedFiles.length > 0 && (
                      <div className="selected-files">
                        <p><strong>Selected Files ({selectedFiles.length}):</strong></p>
                        <ul className="files-list">
                          {selectedFiles.map((file, index) => (
                            <li key={index}>
                              <span className="file-icon">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                                  <path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z"/>
                                </svg>
                              </span>
                              <span className="file-name">{file.name}</span>
                              <span className="file-size">
                                ({(file.size / 1024).toFixed(2)} KB)
                              </span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>

                  <div className="form-group">
                    <label htmlFor="heading">
                      Heading
                    </label>
                    <input
                      type="text"
                      id="heading"
                      value={heading}
                      onChange={(e) => setHeading(e.target.value)}
                      placeholder="Enter file heading"
                      className="form-input"
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="admin-document-type">
                      Document Type
                    </label>
                    <select
                      id="admin-document-type"
                      value={documentType}
                      onChange={(e) => {
                        setDocumentType(e.target.value);
                        if (e.target.value !== 'cheque') {
                          setAmount('');
                        }
                      }}
                      className="form-input"
                    >
                      <option value="">Select Document Type</option>
                      <option value="expense_bill">Expense Bill</option>
                      <option value="cheque">Cheque</option>
                      <option value="purchase_bill">Purchase Bill</option>
                      <option value="legal_document">Legal Document</option>
                      <option value="other_bill">Other Bill</option>
                    </select>
                  </div>

                  {documentType === 'cheque' && (
                    <div className="form-group">
                      <label htmlFor="admin-amount">
                        Amount <span className="required">*</span>
                      </label>
                      <input
                        type="number"
                        id="admin-amount"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        placeholder="Enter amount"
                        step="0.01"
                        min="0"
                        required
                        className="form-input"
                      />
                    </div>
                  )}

                  <div className="form-group">
                    <label htmlFor="description">Description</label>
                    <textarea
                      id="description"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Enter file description (optional)"
                      rows="4"
                      className="form-textarea"
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="uploadDate">Upload Date</label>
                    <input
                      type="date"
                      id="uploadDate"
                      value={uploadDate}
                      onChange={(e) => setUploadDate(e.target.value)}
                      className="form-input date-input"
                    />
                  </div>

                  <div className="form-actions">
                    <button
                      type="submit"
                      disabled={uploading || selectedFiles.length === 0}
                      className="upload-btn"
                    >
                      {uploading ? '⏳ Uploading...' : '📤 Upload Files'}
                    </button>
                    <button
                      type="button"
                      onClick={clearUploadForm}
                      className="clear-btn"
                      disabled={uploading}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" style={{verticalAlign: 'middle', marginRight: '4px'}}>
                        <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
                      </svg>
                      Clear Form
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Admin's Uploaded Files List */}
            <div className="admin-files-section">
              <div className="section-header">
                <h2>My Uploaded Files</h2>
              </div>
              <AdminOwnFiles refreshTrigger={refreshFiles} />
            </div>
          </div>
        )}

        {activeTab === 'files' && (
          <div className="users-files-section">
            <div className="section-header">
              <h2>Users' Uploaded Files</h2>
            </div>
            <Uploaded_files refreshTrigger={refreshFiles} />
          </div>
        )}
      </div>

      {showUserModal && selectedUser && (
        <div className="user-modal-overlay" onClick={handleCloseUserModal}>
          <div className="user-modal" onClick={(e) => e.stopPropagation()}>
            <div className="user-modal-header">
              <h2>User Details</h2>
              <button className="close-modal-btn" onClick={handleCloseUserModal}>✕</button>
            </div>
            
            <div className="user-modal-content">
              <div className="user-details-grid">
                <div className="detail-item">
                  <label>Username:</label>
                  <span>{selectedUser.username}</span>
                </div>

                <div className="detail-item">
                  <label>Password:</label>
                  <div className="password-field">
                    <span className="password-value">
                      {showPassword ? (selectedUser.plain_password || 'Not available') : '••••••••'}
                    </span>
                    <button 
                      className="toggle-password-btn"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/>
                          <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5z"/>
                          <line x1="4" y1="4" x2="20" y2="20" stroke="currentColor" strokeWidth="2"/>
                        </svg>
                      ) : (
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/>
                        </svg>
                      )}
                    </button>
                  </div>
                </div>

                <div className="detail-item">
                  <label>Shop Name:</label>
                  <span>{selectedUser.shop_name || '-'}</span>
                </div>

                <div className="detail-item">
                  <label>Staff Name:</label>
                  <span>{selectedUser.staff_name || '-'}</span>
                </div>

                <div className="detail-item">
                  <label>Mobile Number:</label>
                  <span>{selectedUser.mobile_number || '-'}</span>
                </div>

                <div className="detail-item">
                  <label>Email:</label>
                  <span>{selectedUser.email || '-'}</span>
                </div>

                <div className="detail-item">
                  <label>Created At:</label>
                  <span>{new Date(selectedUser.created_at).toLocaleString()}</span>
                </div>

                <div className="detail-item">
                  <label>Status:</label>
                  <span className={selectedUser.is_active ? 'status-active' : 'status-inactive'}>
                    {selectedUser.is_active ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>

              <div className="user-modal-actions">
                <button onClick={handleCloseUserModal} className="close-btn">
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showEditUserModal && editingUser && (
        <EditUserModal 
          user={editingUser}
          onClose={handleCloseEditUserModal}
          onUpdate={handleUpdateUser}
        />
      )}
    </div>
  );
};

const AdminOwnFiles = ({ refreshTrigger }) => {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [viewingFile, setViewingFile] = useState(null);
  const [editingFile, setEditingFile] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterDate, setFilterDate] = useState('');

  useEffect(() => {
    loadFiles();
  }, [refreshTrigger]);

  const loadFiles = async () => {
    setLoading(true);
    try {
      const data = await filesAPI.getMyFiles();
      setFiles(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Failed to load admin files:', error);
      setFiles([]);
    } finally {
      setLoading(false);
    }
  };

  const deleteFile = async (fileId) => {
    if (window.confirm('Are you sure you want to delete this file?')) {
      try {
        await filesAPI.delete(fileId);
        loadFiles();
      } catch (error) {
        console.error('Failed to delete file:', error);
        alert('Failed to delete file');
      }
    }
  };

  const getFileTypeIcon = (fileName) => {
    const extension = fileName.split('.').pop().toLowerCase();
    
    // Image files - Blue
    if (['jpg', 'jpeg', 'png', 'gif', 'svg', 'webp', 'bmp', 'ico'].includes(extension)) {
      return (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#2196F3" strokeWidth="2">
          <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
          <circle cx="8.5" cy="8.5" r="1.5"/>
          <polyline points="21 15 16 10 5 21"/>
        </svg>
      );
    }
    
    // PDF files - Red
    if (extension === 'pdf') {
      return (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#F44336" strokeWidth="2">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
          <polyline points="14 2 14 8 20 8"/>
          <line x1="16" y1="13" x2="8" y2="13"/>
          <line x1="16" y1="17" x2="8" y2="17"/>
          <line x1="10" y1="9" x2="8" y2="9"/>
        </svg>
      );
    }
    
    // Document files - Blue
    if (['doc', 'docx', 'txt'].includes(extension)) {
      return (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#2196F3" strokeWidth="2">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
          <polyline points="14 2 14 8 20 8"/>
          <line x1="16" y1="13" x2="8" y2="13"/>
          <line x1="16" y1="17" x2="8" y2="17"/>
          <line x1="10" y1="9" x2="8" y2="9"/>
        </svg>
      );
    }
    
    // Spreadsheet files - Green
    if (['xls', 'xlsx', 'csv'].includes(extension)) {
      return (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#4CAF50" strokeWidth="2">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
          <polyline points="14 2 14 8 20 8"/>
          <line x1="8" y1="13" x2="16" y2="13"/>
          <line x1="8" y1="17" x2="16" y2="17"/>
          <line x1="12" y1="11" x2="12" y2="19"/>
        </svg>
      );
    }
    
    // Archive files - Orange
    if (['zip', 'rar', '7z', 'tar', 'gz'].includes(extension)) {
      return (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#FF9800" strokeWidth="2">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
          <polyline points="14 2 14 8 20 8"/>
        </svg>
      );
    }
    
    // Video files - Purple
    if (['mp4', 'avi', 'mov', 'wmv', 'flv'].includes(extension)) {
      return (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#9C27B0" strokeWidth="2">
          <polygon points="5 3 19 12 5 21 5 3"/>
        </svg>
      );
    }
    
    // Default file icon - Gray
    return (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#757575" strokeWidth="2">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
        <polyline points="14 2 14 8 20 8"/>
      </svg>
    );
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
  };

  const handleDownload = (file) => {
    if (file.file_url) {
      const link = document.createElement('a');
      link.href = file.file_url;
      link.download = file.name;
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const handleViewFile = (file) => {
    setViewingFile(file);
  };

  const handleCloseModal = () => {
    setViewingFile(null);
  };

  const handleEditFile = (file) => {
    setEditingFile(file);
    setShowEditModal(true);
  };

  const handleCloseEditModal = () => {
    setShowEditModal(false);
    setEditingFile(null);
  };

  const handleUpdateFile = async () => {
    await loadFiles();
    handleCloseEditModal();
  };

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  };

  const getFilteredFiles = () => {
    let filtered = files;
    
    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(file => 
        file.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        file.heading?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    // Filter by date
    if (filterDate) {
      filtered = filtered.filter(file => {
        const fileDate = new Date(file.uploaded_at).toISOString().split('T')[0];
        return fileDate === filterDate;
      });
    }
    
    return filtered;
  };

  const filteredFiles = getFilteredFiles();

  // Pagination
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentFiles = filteredFiles.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredFiles.length / itemsPerPage);

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (loading) {
    return <div className="loading-message">Loading your files...</div>;
  }

  if (files.length === 0) {
    return <div className="no-files-message">You haven't uploaded any files yet.</div>;
  }

  return (
    <div className="admin-own-files">
      {/* Filter Controls */}
      <div className="files-section-header">
        <div className="filter-controls">
          <div className="search-filter">
            <label htmlFor="admin-search-query">Search:</label>
            <input
              type="text"
              id="admin-search-query"
              placeholder="Search by file name or heading..."
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
            />
          </div>
          <div className="date-filter">
            <label htmlFor="admin-filter-date">Filter by Date:</label>
            <input
              type="date"
              id="admin-filter-date"
              value={filterDate}
              onChange={(e) => { setFilterDate(e.target.value); setCurrentPage(1); }}
            />
            <button onClick={() => { setFilterDate(''); setSearchQuery(''); setCurrentPage(1); }} className="clear-filter-btn">
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      {/* Files Table */}
      {filteredFiles.length === 0 ? (
        <div className="no-files">
          <p>No files found for the selected filters.</p>
        </div>
      ) : (
        <div className="files-table-container">
          <table className="files-table">
            <thead>
              <tr>
                <th>SI No</th>
                <th>File Name</th>
                <th>Upload Date</th>
                <th>File Type</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {currentFiles.map((file, index) => (
                <tr key={file.id}>
                  <td className="si-number-cell" data-label="SI No">{indexOfFirstItem + index + 1}</td>
                  <td className="file-name-cell" data-label="File Name">
                    <span className="file-name-text">{file.heading || file.name}</span>
                  </td>
                  <td data-label="Upload Date">{formatDate(file.uploaded_at)}</td>
                  <td className="file-type-icon-cell" data-label="File Type">
                    {getFileTypeIcon(file.name)}
                  </td>
                  <td className="actions-cell" data-label="Actions">
                    <div className="action-icons">
                      <button onClick={() => handleViewFile(file)} className="view-btn" title="View details">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/>
                        </svg>
                      </button>
                      <button onClick={() => handleEditFile(file)} className="edit-btn" title="Edit file">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
                        </svg>
                      </button>
                      <button onClick={() => handleDownload(file)} className="download-btn-table" title="Download file">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"/>
                        </svg>
                      </button>
                      <button onClick={() => deleteFile(file.id)} className="delete-btn-table" title="Delete file">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {filteredFiles.length > 0 && totalPages > 1 && (
        <div className="pagination">
          <button 
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="pagination-btn"
          >
            ← Previous
          </button>
          
          <div className="pagination-numbers">
            {[...Array(totalPages)].map((_, index) => {
              const pageNumber = index + 1;
              if (
                pageNumber === 1 ||
                pageNumber === totalPages ||
                (pageNumber >= currentPage - 1 && pageNumber <= currentPage + 1)
              ) {
                return (
                  <button
                    key={pageNumber}
                    onClick={() => handlePageChange(pageNumber)}
                    className={currentPage === pageNumber ? 'pagination-btn active' : 'pagination-btn'}
                  >
                    {pageNumber}
                  </button>
                );
              } else if (pageNumber === currentPage - 2 || pageNumber === currentPage + 2) {
                return <span key={pageNumber} className="pagination-ellipsis">...</span>;
              }
              return null;
            })}
          </div>

          <button 
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="pagination-btn"
          >
            Next →
          </button>
        </div>
      )}

      {/* File View Modal */}
      {viewingFile && (
        <div className="file-modal-overlay" onClick={handleCloseModal}>
          <div className="file-modal" onClick={(e) => e.stopPropagation()}>
            <div className="file-modal-header">
              <h2>{viewingFile.heading || viewingFile.name}</h2>
              <button onClick={handleCloseModal} className="close-modal-btn">✕</button>
            </div>
            <div className="file-modal-content">
              {viewingFile.file_type?.startsWith('image/') ? (
                <div className="file-preview-section">
                  <img 
                    src={viewingFile.file_url} 
                    alt={viewingFile.name} 
                    className="modal-file-preview"
                  />
                </div>
              ) : (
                <div className="file-icon-preview">
                  <span className="large-file-icon">{getFileTypeIcon(viewingFile.name)}</span>
                  <p className="file-type-label">{viewingFile.file_type || 'Unknown'}</p>
                </div>
              )}
              
              <div className="file-details">
                <div className="detail-row">
                  <strong>File Name:</strong>
                  <span>{viewingFile.name}</span>
                </div>
                {viewingFile.description && (
                  <div className="detail-row">
                    <strong>Description:</strong>
                    <span>{viewingFile.description}</span>
                  </div>
                )}
                {viewingFile.document_type && (
                  <div className="detail-row">
                    <strong>Document Type:</strong>
                    <span>{viewingFile.document_type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}</span>
                  </div>
                )}
                {viewingFile.document_type === 'cheque' && viewingFile.amount && (
                  <div className="detail-row">
                    <strong>Amount:</strong>
                    <span>₹{parseFloat(viewingFile.amount).toLocaleString('en-IN', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
                  </div>
                )}
                <div className="detail-row">
                  <strong>Upload Date:</strong>
                  <span>{formatDate(viewingFile.uploaded_at)}</span>
                </div>
                <div className="detail-row">
                  <strong>File Size:</strong>
                  <span>{viewingFile.file_size_display || formatFileSize(viewingFile.file_size)}</span>
                </div>
              </div>

              <div className="file-modal-actions">
                {viewingFile.file_url && (
                  <a 
                    href={viewingFile.file_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="open-file-btn"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M3.9 12c0-1.71 1.39-3.1 3.1-3.1h4V7H7c-2.76 0-5 2.24-5 5s2.24 5 5 5h4v-1.9H7c-1.71 0-3.1-1.39-3.1-3.1zM8 13h8v-2H8v2zm9-6h-4v1.9h4c1.71 0 3.1 1.39 3.1 3.1s-1.39 3.1-3.1 3.1h-4V17h4c2.76 0 5-2.24 5-5s-2.24-5-5-5z"/>
                    </svg>
                    {' '}Open File
                  </a>
                )}
                <button onClick={() => handleDownload(viewingFile)} className="download-btn">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"/>
                  </svg>
                  {' '}Download
                </button>
                <button onClick={handleCloseModal} className="close-btn">
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showEditModal && editingFile && (
        <AdminEditFileModal 
          file={editingFile}
          onClose={handleCloseEditModal}
          onUpdate={handleUpdateFile}
        />
      )}
    </div>
  );
};

const AdminEditFileModal = ({ file, onClose, onUpdate }) => {
  const [formData, setFormData] = useState({
    heading: file.heading || '',
    description: file.description || '',
    uploaded_at: file.uploaded_at ? new Date(file.uploaded_at).toISOString().split('T')[0] : '',
    document_type: file.document_type || '',
    amount: file.amount || '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (formData.document_type === 'cheque' && !formData.amount) {
      setError('Amount is required for cheque documents');
      return;
    }

    setLoading(true);

    try {
      const updateData = {
        heading: formData.heading,
        description: formData.description,
        uploaded_at: formData.uploaded_at,
        document_type: formData.document_type,
      };

      if (formData.document_type === 'cheque' && formData.amount) {
        updateData.amount = formData.amount;
      }

      await filesAPI.update(file.id, updateData);
      onUpdate();
    } catch (error) {
      setError(error.message || 'Failed to update file');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="file-modal-overlay" onClick={onClose}>
      <div className="file-modal edit-file-modal" onClick={(e) => e.stopPropagation()}>
        <div className="file-modal-header">
          <h2>Edit File Details</h2>
          <button className="close-modal-btn" onClick={onClose}>✕</button>
        </div>
        
        <div className="file-modal-content">
          {error && <div className="error-message">{error}</div>}
          
          <div className="file-info-section">
            <p><strong>File Name:</strong> {file.name}</p>
          </div>
          
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Heading</label>
              <input
                type="text"
                name="heading"
                value={formData.heading}
                onChange={handleChange}
                placeholder="Enter file heading"
              />
            </div>

            <div className="form-group">
              <label>Document Type</label>
              <select
                name="document_type"
                value={formData.document_type}
                onChange={(e) => {
                  handleChange(e);
                  if (e.target.value !== 'cheque') {
                    setFormData(prev => ({ ...prev, amount: '' }));
                  }
                }}
              >
                <option value="">Select Document Type</option>
                <option value="expense_bill">Expense Bill</option>
                <option value="cheque">Cheque</option>
                <option value="purchase_bill">Purchase Bill</option>
                <option value="legal_document">Legal Document</option>
                <option value="other_bill">Other Bill</option>
              </select>
            </div>

            {formData.document_type === 'cheque' && (
              <div className="form-group">
                <label>Amount <span className="required">*</span></label>
                <input
                  type="number"
                  name="amount"
                  value={formData.amount}
                  onChange={handleChange}
                  placeholder="Enter amount"
                  step="0.01"
                  min="0"
                  required
                />
              </div>
            )}

            <div className="form-group">
              <label>Upload Date</label>
              <input
                type="date"
                name="uploaded_at"
                value={formData.uploaded_at}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label>Description</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Enter file description"
                rows="4"
              ></textarea>
            </div>

            <div className="file-modal-actions">
              <button type="submit" className="submit-btn upload-btn" disabled={loading}>
                {loading ? 'Updating...' : 'Update File'}
              </button>
              <button type="button" onClick={onClose} className="close-btn cancel-btn" disabled={loading}>
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

const CreateUserForm = ({ onUserCreated }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [shopName, setShopName] = useState('');
  const [staffName, setStaffName] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!username || !password) {
      setError('Username and password are required');
      return;
    }

    if (password.length < 4) {
      setError('Password must be at least 4 characters');
      return;
    }

    setLoading(true);

    try {
      await usersAPI.create({
        username,
        password,
        email,
        shop_name: shopName,
        staff_name: staffName,
        mobile_number: mobileNumber,
        role: 'user',
      });

      setSuccess('User created successfully!');
      setUsername('');
      setPassword('');
      setShopName('');
      setStaffName('');
      setMobileNumber('');
      setEmail('');

      setTimeout(() => {
        onUserCreated();
      }, 1000);
    } catch (error) {
      setError(error.message || 'Failed to create user');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="create-user-form">
      <h3>Create New User</h3>
      
      {error && <div className="error-message">{error}</div>}
      {success && <div className="success-message">{success}</div>}
      
      <form onSubmit={handleSubmit}>
        <div className="form-row">
          <div className="form-group">
            <label>Username <span className="required">*</span></label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter username"
              required
            />
          </div>

          <div className="form-group">
            <label>Password <span className="required">*</span></label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password"
              required
            />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Shop Name</label>
            <input
              type="text"
              value={shopName}
              onChange={(e) => setShopName(e.target.value)}
              placeholder="Enter shop name"
            />
          </div>

          <div className="form-group">
            <label>Staff Name</label>
            <input
              type="text"
              value={staffName}
              onChange={(e) => setStaffName(e.target.value)}
              placeholder="Enter staff name "
            />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Mobile Number</label>
            <input
              type="tel"
              value={mobileNumber}
              onChange={(e) => setMobileNumber(e.target.value)}
              placeholder="Enter mobile number "
            />
          </div>

          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter email "
            />
          </div>
        </div>

        <button type="submit" className="submit-btn" disabled={loading}>
          {loading ? 'Creating...' : 'Create User'}
        </button>
      </form>
    </div>
  );
};

const EditUserModal = ({ user, onClose, onUpdate }) => {
  const [formData, setFormData] = useState({
    username: user.username || '',
    password: '',
    shop_name: user.shop_name || '',
    staff_name: user.staff_name || '',
    mobile_number: user.mobile_number || '',
    email: user.email || '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.username) {
      setError('Username is required');
      return;
    }

    if (formData.password && formData.password.length < 4) {
      setError('Password must be at least 4 characters');
      return;
    }

    setLoading(true);

    try {
      const updateData = {
        username: formData.username,
        shop_name: formData.shop_name,
        staff_name: formData.staff_name,
        mobile_number: formData.mobile_number,
        email: formData.email,
      };

      // Only include password if it was changed
      if (formData.password) {
        updateData.password = formData.password;
      }

      await usersAPI.update(user.id, updateData);
      onUpdate();
    } catch (error) {
      setError(error.message || 'Failed to update user');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="user-modal-overlay" onClick={onClose}>
      <div className="user-modal edit-user-modal" onClick={(e) => e.stopPropagation()}>
        <div className="user-modal-header">
          <h2>Edit User</h2>
          <button className="close-modal-btn" onClick={onClose}>✕</button>
        </div>
        
        <div className="user-modal-content">
          {error && <div className="error-message">{error}</div>}
          
          <form onSubmit={handleSubmit}>
            <div className="form-row">
              <div className="form-group">
                <label>Username <span className="required">*</span></label>
                <input
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  placeholder="Enter username"
                  required
                />
              </div>

              <div className="form-group">
                <label>Password <span className="optional">(leave blank to keep current)</span></label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Enter new password"
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Shop Name</label>
                <input
                  type="text"
                  name="shop_name"
                  value={formData.shop_name}
                  onChange={handleChange}
                  placeholder="Enter shop name"
                />
              </div>

              <div className="form-group">
                <label>Staff Name</label>
                <input
                  type="text"
                  name="staff_name"
                  value={formData.staff_name}
                  onChange={handleChange}
                  placeholder="Enter staff name"
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Mobile Number</label>
                <input
                  type="tel"
                  name="mobile_number"
                  value={formData.mobile_number}
                  onChange={handleChange}
                  placeholder="Enter mobile number"
                />
              </div>

              <div className="form-group">
                <label>Email</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="Enter email"
                />
              </div>
            </div>

            <div className="user-modal-actions">
              <button type="submit" className="submit-btn" disabled={loading}>
                {loading ? 'Updating...' : 'Update User'}
              </button>
              <button type="button" onClick={onClose} className="close-btn" disabled={loading}>
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
