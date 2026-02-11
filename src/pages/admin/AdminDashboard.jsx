import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { usersAPI, filesAPI } from '../../api/api';
import Uploaded_files from '../../components/Uploaded_files';
import './AdminDashboard.css';

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState(() => {
    // Get saved tab from localStorage or default to 'users'
    return localStorage.getItem('adminActiveTab') || 'users';
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
        <div>
          <h1>Admin Dashboard</h1>
          <p>Welcome, {user?.username}!</p>
        </div>
        <div className="profile-section">
          <div className="profile-icon" onClick={toggleProfileDropdown}>
            <svg width="40" height="40" viewBox="0 0 24 24" fill="#D4AF37">
              <circle cx="12" cy="8" r="4"/>
              <path d="M12 14c-6 0-8 3-8 5v1h16v-1c0-2-2-5-8-5z"/>
            </svg>
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

      <div className="dashboard-tabs">
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
        {activeTab === 'users' && (
          <div className="users-section">
            <div className="section-header">
              <h2>Manage Users</h2>
              <button 
                onClick={() => setShowCreateUser(!showCreateUser)}
                className="create-user-btn"
              >
                {showCreateUser ? 'Cancel' : '+ Create New User'}
              </button>
            </div>

            {showCreateUser && <CreateUserForm onUserCreated={() => { loadUsers(); setShowCreateUser(false); }} />}

            <div className="users-list">
              {loading ? (
                <p className="loading">Loading users...</p>
              ) : users.length === 0 ? (
                <p className="no-data">No users created yet. Create your first user!</p>
              ) : (
                <table className="users-table">
                  <thead>
                    <tr>
                      <th>Username</th>
                      <th>Shop Name</th>
                      <th>Staff Name</th>
                      <th>Mobile</th>
                      <th>Email</th>
                      <th>Created At</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map(u => (
                      <tr key={u.id}>
                        <td><strong>{u.username}</strong></td>
                        <td>{u.shop_name || '-'}</td>
                        <td>{u.staff_name || '-'}</td>
                        <td>{u.mobile_number || '-'}</td>
                        <td>{u.email || '-'}</td>
                        <td>{new Date(u.created_at).toLocaleDateString('en-GB')}</td>
                        <td>
                          <button 
                            onClick={() => handleViewUser(u)}
                            className="view-user-btn"
                            title="View details"
                          >
                            👁️ View
                          </button>
                          <button 
                            onClick={() => handleEditUser(u)}
                            className="edit-btn"
                            title="Edit user"
                          >
                            ✏️ Edit
                          </button>
                          <button 
                            onClick={() => deleteUser(u.id)}
                            className="delete-btn"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
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
                      📎 {isDragging ? 'Drop files here' : 'Select Files or Drag & Drop'}
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
                              <span className="file-icon">📄</span>
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
                      🗑️ Clear Form
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
                      {showPassword ? '🔒' : '👁️'}
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
                  <td className="si-number-cell">{indexOfFirstItem + index + 1}</td>
                  <td className="file-name-cell">
                    <span className="file-name-text">{file.heading || file.name}</span>
                  </td>
                  <td>{formatDate(file.uploaded_at)}</td>
                  <td className="file-type-icon-cell">
                    {getFileTypeIcon(file.name)}
                  </td>
                  <td className="actions-cell">
                    <button onClick={() => handleViewFile(file)} className="view-btn">
                      👁️ View
                    </button>
                    <button onClick={() => handleEditFile(file)} className="edit-btn">
                      ✏️ Edit
                    </button>
                    <button onClick={() => handleDownload(file)} className="download-btn-table">
                      ⬇️ Download
                    </button>
                    <button onClick={() => deleteFile(file.id)} className="delete-btn-table">
                      🗑️ Delete
                    </button>
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
                    🔗 Open File
                  </a>
                )}
                <button onClick={() => handleDownload(viewingFile)} className="download-btn">
                  ⬇️ Download
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
