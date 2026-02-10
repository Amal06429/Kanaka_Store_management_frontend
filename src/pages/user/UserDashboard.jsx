import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { filesAPI } from '../../api/api';
import './UserDashboard.css';

const UserDashboard = () => {
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [heading, setHeading] = useState('');
  const [description, setDescription] = useState('');
  const [uploadDate, setUploadDate] = useState(new Date().toISOString().split('T')[0]);
  const [filterDate, setFilterDate] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [viewingFile, setViewingFile] = useState(null);
  const [isUploadFormOpen, setIsUploadFormOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [documentType, setDocumentType] = useState('');
  const [amount, setAmount] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    console.log('UserDashboard: User changed:', user);
    if (user) {
      console.log('UserDashboard: Loading files...');
      loadUserFiles();
    }
  }, [user]);

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

  const loadUserFiles = async () => {
    setLoading(true);
    try {
      console.log('UserDashboard: Fetching files from API...');
      const data = await filesAPI.getMyFiles();
      console.log('UserDashboard: Files loaded:', data);
      setFiles(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('UserDashboard: Failed to load files:', error);
      setFiles([]);
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
      console.log('UserDashboard: Starting file upload...');
      // Upload each file
      for (const file of selectedFiles) {
        console.log('UserDashboard: Uploading file:', file.name);
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
        console.log('UserDashboard: File uploaded successfully:', result);
      }

      console.log('UserDashboard: All files uploaded, reloading file list...');
      // Reload files
      await loadUserFiles();
      
      // Clear form
      setSelectedFiles([]);
      setHeading('');
      setDescription('');
      setUploadDate(new Date().toISOString().split('T')[0]);
      setDocumentType('');
      setAmount('');
      
      // Reset file input
      const fileInput = document.getElementById('file-upload');
      if (fileInput) fileInput.value = '';
      
      alert('Files uploaded successfully!');
    } catch (error) {
      console.error('Upload failed:', error);
      alert('Failed to upload files: ' + error.message);
    } finally {
      setUploading(false);
    }
  };

  const clearForm = () => {
    setSelectedFiles([]);
    setHeading('');
    setDescription('');
    setUploadDate(new Date().toISOString().split('T')[0]);
    setDocumentType('');
    setAmount('');
    const fileInput = document.getElementById('file-upload');
    if (fileInput) fileInput.value = '';
  };

  const deleteFile = async (fileId) => {
    if (window.confirm('Are you sure you want to delete this file?')) {
      try {
        await filesAPI.delete(fileId);
        loadUserFiles();
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
          <polyline points="10 9 9 9 8 9"/>
        </svg>
      );
    }
    
    // Document files - Blue
    if (['doc', 'docx', 'txt', 'rtf'].includes(extension)) {
      return (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#1976D2" strokeWidth="2">
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
          <rect x="8" y="12" width="8" height="6" rx="1"/>
          <circle cx="12" cy="15" r="1"/>
        </svg>
      );
    }
    
    // Video files - Purple
    if (['mp4', 'avi', 'mov', 'wmv', 'flv', 'mkv'].includes(extension)) {
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

  const getFirstName = (username) => {
    if (!username) return '';
    return username.split(' ')[0];
  };

  const handleViewFile = (file) => {
    setViewingFile(file);
  };

  const handleCloseModal = () => {
    setViewingFile(null);
  };

  const handleDownload = (fileUrl, fileName) => {
    const link = document.createElement('a');
    link.href = fileUrl;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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

  return (
    <div className="user-dashboard">
      <div className="dashboard-header">
        <div>
          <h1>User Dashboard</h1>
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

      <div className="dashboard-content">
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
            <div className="upload-form-container">
              <form onSubmit={handleUploadSubmit}>
                <div className="form-group">
                  <label htmlFor="heading">Heading</label>
                  <input
                    type="text"
                    id="heading"
                    value={heading}
                    onChange={(e) => setHeading(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="document-type">Document Type</label>
                  <select
                    id="document-type"
                    value={documentType}
                    onChange={(e) => {
                      setDocumentType(e.target.value);
                      if (e.target.value !== 'cheque') {
                        setAmount('');
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

                {documentType === 'cheque' && (
                  <div className="form-group">
                    <label htmlFor="amount">Amount <span className="required">*</span></label>
                    <input
                      type="number"
                      id="amount"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      placeholder="Enter amount"
                      step="0.01"
                      min="0"
                      required
                    />
                  </div>
                )}

                <div className="form-group">
                  <label htmlFor="upload-date">Date <span className="required">*</span></label>
                  <input
                    type="date"
                    id="upload-date"
                    value={uploadDate}
                    onChange={(e) => setUploadDate(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="description">Description</label>
                  <textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows="3"
                  ></textarea>
                </div>

                <div 
                  className={`upload-area-compact ${isDragging ? 'dragging' : ''}`}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                >
                  <label htmlFor="file-upload" className="upload-label-compact">
                    <span className="upload-icon-small">📎</span>
                    <span className="upload-text-small">
                      {selectedFiles.length > 0 
                        ? `${selectedFiles.length} file(s) selected: ${selectedFiles.map(f => f.name).join(', ')}`
                        : 'Choose files or drag and drop here'}
                    </span>
                  </label>
                  <input
                    id="file-upload"
                    type="file"
                    multiple
                    onChange={handleFileUpload}
                    className="file-input"
                    accept="*/*"
                  />
                </div>

                <div className="form-actions">
                  <button type="submit" className="upload-btn" disabled={uploading || selectedFiles.length === 0}>
                    {uploading ? 'Uploading...' : 'Upload Files'}
                  </button>
                  <button type="button" onClick={clearForm} className="cancel-btn" disabled={uploading}>
                    Clear
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>

        <div className="files-section">
          <div className="files-section-header">
            <h2>My Uploaded Files ({filteredFiles.length})</h2>
            <div className="filter-controls">
              <div className="search-filter">
                <label htmlFor="search-query">Search:</label>
                <input
                  type="text"
                  id="search-query"
                  placeholder="Search by file name or heading..."
                  value={searchQuery}
                  onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                />
              </div>
              <div className="date-filter">
                <label htmlFor="filter-date">Filter by Date:</label>
                <input
                  type="date"
                  id="filter-date"
                  value={filterDate}
                  onChange={(e) => { setFilterDate(e.target.value); setCurrentPage(1); }}
                />
                <button onClick={() => { setFilterDate(''); setSearchQuery(''); setCurrentPage(1); }} className="clear-filter-btn">
                  Clear Filters
                </button>
              </div>
            </div>
          </div>
          
          {filteredFiles.length === 0 ? (
            <div className="no-files">
              <p>{loading ? 'Loading files...' : files.length === 0 ? 'No files uploaded yet. Start by uploading your first file!' : 'No files found for the selected date.'}</p>
            </div>
          ) : (
            <div className="files-table-container">
              <table className="files-table">
                <thead>
                  <tr>
                    <th>SI No</th>
                    <th>File Name</th>
                    <th>Uploaded By</th>
                    <th>Upload Date</th>
                    <th>File Type</th>
                    <th>Status</th>
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
                      <td>{getFirstName(file.uploaded_by_name || user?.username)}</td>
                      <td>{formatDate(file.uploaded_at)}</td>
                      <td className="file-type-icon-cell">
                        {getFileTypeIcon(file.name)}
                      </td>
                      <td className="status-cell">
                        <span className={`status-badge status-${file.status || 'pending'}`}>
                          {file.status || 'pending'}
                        </span>
                      </td>
                      <td className="actions-cell">
                        <button onClick={() => handleViewFile(file)} className="view-btn">
                          👁️ View
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
        </div>
      </div>

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
                  <strong>Uploaded By:</strong>
                  <span>{viewingFile.uploaded_by_name || user?.username}</span>
                </div>
                <div className="detail-row">
                  <strong>Upload Date:</strong>
                  <span>{formatDate(viewingFile.uploaded_at)}</span>
                </div>
                <div className="detail-row">
                  <strong>File Size:</strong>
                  <span>{viewingFile.file_size_display || formatFileSize(viewingFile.file_size)}</span>
                </div>
                <div className="detail-row">
                  <strong>Status:</strong>
                  <span className={`status-badge status-${viewingFile.status || 'pending'}`}>
                    {viewingFile.status || 'pending'}
                  </span>
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
                <button onClick={() => handleDownload(viewingFile.file_url, viewingFile.name)} className="download-btn">
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
    </div>
  );
};

export default UserDashboard;
