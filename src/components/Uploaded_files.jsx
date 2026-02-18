import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { filesAPI } from '../api/api';
import { getAuthToken } from '../api/api';
import { useAuth } from '../context/AuthContext';
import './Uploaded_files.scss';

const Uploaded_files = ({ refreshTrigger }) => {
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [filterUser, setFilterUser] = useState('');
  const [filterDate, setFilterDate] = useState(new Date().toISOString().split('T')[0]); // Default to today
  const [filterStatus, setFilterStatus] = useState(''); // New status filter
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('date-desc');
  const [loading, setLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editingFile, setEditingFile] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const { user } = useAuth();

  useEffect(() => {
    console.log('Uploaded_files: refreshTrigger changed:', refreshTrigger);
    // Only load files if user is authenticated
    const token = getAuthToken();
    console.log('Uploaded_files: Token exists:', !!token);
    if (token) {
      loadFiles();
    } else {
      setUploadedFiles([]);
      setLoading(false);
    }
  }, [refreshTrigger]);

  const loadFiles = async () => {
    setLoading(true);
    try {
      console.log('Uploaded_files: Fetching all files...');
      const data = await filesAPI.getAll();
      console.log('Uploaded_files: Files received:', data);
      setUploadedFiles(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Uploaded_files: Failed to load files:', error);
      setUploadedFiles([]);
    } finally {
      setLoading(false);
    }
  };

  const getFileIcon = (fileName) => {
    const extension = fileName.split('.').pop().toLowerCase();
    if (['jpg', 'jpeg', 'png', 'gif', 'svg', 'webp'].includes(extension)) {
      return (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
          <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/>
        </svg>
      );
    } else if (extension === 'pdf') {
      return (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
          <path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z"/>
        </svg>
      );
    } else if (['doc', 'docx'].includes(extension)) {
      return (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
          <path d="M14 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V8l-6-6zM6 20V4h7v5h5v11H6z"/>
        </svg>
      );
    } else if (['xls', 'xlsx'].includes(extension)) {
      return (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
          <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM9 17H7v-7h2v7zm4 0h-2V7h2v10zm4 0h-2v-4h2v4z"/>
        </svg>
      );
    } else if (['zip', 'rar', '7z'].includes(extension)) {
      return (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
          <path d="M20.54 5.23l-1.39-1.68C18.88 3.21 18.47 3 18 3H6c-.47 0-.88.21-1.16.55L3.46 5.23C3.17 5.57 3 6.02 3 6.5V19c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V6.5c0-.48-.17-.93-.46-1.27zM12 17.5L6.5 12H10v-2h4v2h3.5L12 17.5zM5.12 5l.81-1h12l.94 1H5.12z"/>
        </svg>
      );
    } else if (['mp4', 'avi', 'mov'].includes(extension)) {
      return (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
          <path d="M18 3v2h-2V3H8v2H6V3H4v18h2v-2h2v2h8v-2h2v2h2V3h-2zM8 17H6v-2h2v2zm0-4H6v-2h2v2zm0-4H6V7h2v2zm10 8h-2v-2h2v2zm0-4h-2v-2h2v2zm0-4h-2V7h2v2z"/>
        </svg>
      );
    } else if (['mp3', 'wav', 'flac'].includes(extension)) {
      return (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 3v9.28c-.47-.17-.97-.28-1.5-.28C8.01 12 6 14.01 6 16.5S8.01 21 10.5 21c2.31 0 4.2-1.75 4.45-4H15V6h4V3h-7z"/>
        </svg>
      );
    } else {
      return (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
          <path d="M16.5 6v11.5c0 2.21-1.79 4-4 4s-4-1.79-4-4V5c0-1.38 1.12-2.5 2.5-2.5s2.5 1.12 2.5 2.5v10.5c0 .55-.45 1-1 1s-1-.45-1-1V6H10v9.5c0 1.38 1.12 2.5 2.5 2.5s2.5-1.12 2.5-2.5V5c0-2.21-1.79-4-4-4S7 2.79 7 5v12.5c0 3.04 2.46 5.5 5.5 5.5s5.5-2.46 5.5-5.5V6h-1.5z"/>
        </svg>
      );
    }
  };

  const getFileType = (fileName) => {
    const extension = fileName.split('.').pop().toLowerCase();
    if (['jpg', 'jpeg', 'png', 'gif', 'svg', 'webp'].includes(extension)) {
      return 'Image';
    } else if (extension === 'pdf') {
      return 'PDF';
    } else if (['doc', 'docx'].includes(extension)) {
      return 'Document';
    } else if (['xls', 'xlsx'].includes(extension)) {
      return 'Spreadsheet';
    } else if (['zip', 'rar', '7z'].includes(extension)) {
      return 'Archive';
    } else if (['mp4', 'avi', 'mov'].includes(extension)) {
      return 'Video';
    } else if (['mp3', 'wav', 'flac'].includes(extension)) {
      return 'Audio';
    } else {
      return 'File';
    }
  };

  const getFileTypeIcon = (fileName) => {
    const extension = fileName.split('.').pop().toLowerCase();
    if (['jpg', 'jpeg', 'png', 'gif', 'svg', 'webp'].includes(extension)) {
      return (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z" fill="#4CAF50"/>
        </svg>
      );
    } else if (extension === 'pdf') {
      return (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M20 2H8c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-8.5 7.5c0 .83-.67 1.5-1.5 1.5H9v2H7.5V7H10c.83 0 1.5.67 1.5 1.5v1zm5 2c0 .83-.67 1.5-1.5 1.5h-2.5V7H15c.83 0 1.5.67 1.5 1.5v3zm4-3H19v1h1.5V11H19v2h-1.5V7h3v1.5zM9 9.5h1v-1H9v1zM4 6H2v14c0 1.1.9 2 2 2h14v-2H4V6zm10 5.5h1v-3h-1v3z" fill="#F44336"/>
        </svg>
      );
    } else if (['doc', 'docx'].includes(extension)) {
      return (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M14 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V8l-6-6zM6 20V4h7v5h5v11H6z" fill="#2196F3"/>
        </svg>
      );
    } else if (['xls', 'xlsx'].includes(extension)) {
      return (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM9 17H7v-7h2v7zm4 0h-2V7h2v10zm4 0h-2v-4h2v4z" fill="#4CAF50"/>
        </svg>
      );
    } else if (['zip', 'rar', '7z'].includes(extension)) {
      return (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M14 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V8l-6-6zM6 20V4h7v4h5v12H6z" fill="#FF9800"/>
        </svg>
      );
    } else if (['mp4', 'avi', 'mov'].includes(extension)) {
      return (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M18 4l2 4h-3l-2-4h-2l2 4h-3l-2-4H8l2 4H7L5 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V4h-4z" fill="#9C27B0"/>
        </svg>
      );
    } else {
      return (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M14 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V8l-6-6zM6 20V4h7v5h5v11H6z" fill="#757575"/>
        </svg>
      );
    }
  };

  const getFirstName = (username) => {
    if (!username) return 'Unknown';
    return username.split(' ')[0];
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
  };

  const isImageFile = (fileName) => {
    const extension = fileName.split('.').pop().toLowerCase();
    return ['jpg', 'jpeg', 'png', 'gif', 'svg', 'webp'].includes(extension);
  };

  const isPdfFile = (fileName) => {
    const extension = fileName.split('.').pop().toLowerCase();
    return extension === 'pdf';
  };

  const handleViewFile = (file) => {
    setSelectedFile(file);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedFile(null);
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

  const handleStatusChange = async (fileId, newStatus) => {
    try {
      await filesAPI.updateStatus(fileId, newStatus);
      loadFiles(); // Refresh the file list
    } catch (error) {
      console.error('Failed to update status:', error);
      alert('Failed to update file status');
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
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

  const getFilteredAndSortedFiles = () => {
    if (!Array.isArray(uploadedFiles)) {
      return [];
    }
    
    let filtered = [...uploadedFiles];

    // Filter out admin files - only show regular user files
    filtered = filtered.filter(file => file.user_role !== 'admin');

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(file => 
        file.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        file.heading?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        file.user_username?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Filter by username
    if (filterUser) {
      filtered = filtered.filter(file => 
        file.user_username?.toLowerCase().includes(filterUser.toLowerCase())
      );
    }

    // Filter by date
    if (filterDate) {
      filtered = filtered.filter(file => {
        const fileDate = new Date(file.uploaded_at).toISOString().split('T')[0];
        return fileDate === filterDate;
      });
    }

    // Filter by status
    if (filterStatus) {
      filtered = filtered.filter(file => 
        (file.status || 'pending') === filterStatus
      );
    }

    // Sort
    switch (sortBy) {
      case 'date-desc':
        filtered.sort((a, b) => new Date(b.uploaded_at) - new Date(a.uploaded_at));
        break;
      case 'date-asc':
        filtered.sort((a, b) => new Date(a.uploaded_at) - new Date(b.uploaded_at));
        break;
      case 'name-asc':
        filtered.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'name-desc':
        filtered.sort((a, b) => b.name.localeCompare(a.name));
        break;
      case 'user-asc':
        filtered.sort((a, b) => (a.user_username || '').localeCompare(b.user_username || ''));
        break;
      case 'user-desc':
        filtered.sort((a, b) => (b.user_username || '').localeCompare(a.user_username || ''));
        break;
      default:
        break;
    }

    return filtered;
  };

  const clearFilters = () => {
    setFilterUser('');
    setFilterDate(new Date().toISOString().split('T')[0]); // Reset to today
    setFilterStatus('');
    setSearchQuery('');
    setSortBy('date-desc');
    setCurrentPage(1);
  };

  const filteredFiles = getFilteredAndSortedFiles();

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
    <div className="uploaded-files-container">
      <div className="files-header">
        <p className="files-count">
          Showing {filteredFiles.length} of {uploadedFiles.filter(f => f.user_role !== 'admin').length} files
        </p>
      </div>

      <div className="filters-section">
        <div className="filter-group">
          <label htmlFor="search-query">Search:</label>
          <input
            type="text"
            id="search-query"
            placeholder="Search by file name, heading, or user..."
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
          />
        </div>

        <div className="filter-group">
          <label htmlFor="filter-user">Filter by User:</label>
          <input
            type="text"
            id="filter-user"
            placeholder="Enter username..."
            value={filterUser}
            onChange={(e) => { setFilterUser(e.target.value); setCurrentPage(1); }}
          />
        </div>

        <div className="filter-group">
          <label htmlFor="filter-date">Filter by Date:</label>
          <input
            type="date"
            id="filter-date"
            value={filterDate}
            onChange={(e) => { setFilterDate(e.target.value); setCurrentPage(1); }}
          />
        </div>

        <div className="filter-group">
          <label htmlFor="filter-status">Filter by Status:</label>
          <select
            id="filter-status"
            value={filterStatus}
            onChange={(e) => { setFilterStatus(e.target.value); setCurrentPage(1); }}
          >
            <option value="">All Status</option>
            <option value="pending">Pending</option>
            <option value="verified">Verified</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>

        <div className="filter-group">
          <label htmlFor="sort-by">Sort by:</label>
          <select
            id="sort-by"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
          >
            <option value="date-desc">Date (Newest First)</option>
            <option value="date-asc">Date (Oldest First)</option>
            <option value="name-asc">Name (A-Z)</option>
            <option value="name-desc">Name (Z-A)</option>
            <option value="user-asc">User (A-Z)</option>
            <option value="user-desc">User (Z-A)</option>
          </select>
        </div>

        <button className="clear-filters-btn" onClick={clearFilters}>
          Clear Filters
        </button>
      </div>

      {loading ? (
        <div className="loading-message">
          <p>Loading files...</p>
        </div>
      ) : filteredFiles.length === 0 ? (
        <div className="no-files-message">
          {uploadedFiles.length === 0 ? (
            <p>No files have been uploaded yet.</p>
          ) : (
            <p>No files match your filter criteria.</p>
          )}
        </div>
      ) : (
        <div className="files-table-container">
          <table className="files-table">
            <thead>
              <tr>
                <th>SI No.</th>
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
                  <td className="si-number-cell" data-label="SI No.">{indexOfFirstItem + index + 1}</td>
                  <td className="file-name-cell" data-label="File Name">
                    <span className="file-name-text">{file.heading || file.name}</span>
                  </td>
                  <td data-label="Uploaded By"><strong>{getFirstName(file.user_username)}</strong></td>
                  <td data-label="Upload Date">{formatDate(file.uploaded_at)}</td>
                  <td className="file-type-icon-cell" data-label="File Type">{getFileTypeIcon(file.name)}</td>
                  <td className="status-cell" data-label="Status">
                    {user?.role === 'admin' ? (
                      <select 
                        value={file.status || 'pending'}
                        onChange={(e) => handleStatusChange(file.id, e.target.value)}
                        className={`status-dropdown status-${file.status || 'pending'}`}
                      >
                        <option value="pending">Pending</option>
                        <option value="verified">Verified</option>
                        <option value="rejected">Rejected</option>
                      </select>
                    ) : (
                      <span className={`status-badge status-${file.status || 'pending'}`}>
                        {file.status ? file.status.charAt(0).toUpperCase() + file.status.slice(1) : 'Pending'}
                      </span>
                    )}
                  </td>
                  <td className="actions-cell" data-label="Actions">
                    <div className="action-icons">
                      <button 
                        onClick={() => handleViewFile(file)}
                        className="view-btn"
                        title="View details"
                      >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/>
                        </svg>
                      </button>
                      <button 
                        onClick={() => handleEditFile(file)}
                        className="edit-btn"
                        title="Edit file"
                      >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
                        </svg>
                      </button>
                      <button 
                        onClick={() => deleteFile(file.id)}
                        className="delete-btn-table"
                        title="Delete file"
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
              // Show first page, last page, current page, and pages around current
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

      {showModal && selectedFile && (
        <div className="file-modal-overlay" onClick={handleCloseModal}>
          <div className="file-modal" onClick={(e) => e.stopPropagation()}>
            <div className="file-modal-header">
              <h2>File Details</h2>
              <button className="close-modal-btn" onClick={handleCloseModal}>✕</button>
            </div>
            
            <div className="file-modal-content">
              {isImageFile(selectedFile.name) && selectedFile.file_url ? (
                <div className="file-preview-section">
                  <img 
                    src={selectedFile.file_url} 
                    alt={selectedFile.name} 
                    className="modal-file-preview"
                  />
                </div>
              ) : isPdfFile(selectedFile.name) && selectedFile.file_url ? (
                <div className="file-icon-preview">
                  <span className="large-file-icon">{getFileIcon(selectedFile.name)}</span>
                  <p className="file-type-label">{getFileType(selectedFile.name)}</p>
                  <div className="pdf-actions">
                    <a 
                      href={selectedFile.file_url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="open-pdf-btn"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z"/>
                      </svg>
                      {' '}Open PDF
                    </a>
                  </div>
                </div>
              ) : (
                <div className="file-icon-preview">
                  <span className="large-file-icon">{getFileIcon(selectedFile.name)}</span>
                  <p className="file-type-label">{getFileType(selectedFile.name)}</p>
                </div>
              )}

              <div className="file-details">
                {selectedFile.heading && (
                  <div className="detail-row">
                    <strong>Heading:</strong>
                    <span>{selectedFile.heading}</span>
                  </div>
                )}
                
                {selectedFile.description && (
                  <div className="detail-row">
                    <strong>Description:</strong>
                    <span>{selectedFile.description}</span>
                  </div>
                )}

                {selectedFile.document_type && (
                  <div className="detail-row">
                    <strong>Document Type:</strong>
                    <span>{selectedFile.document_type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}</span>
                  </div>
                )}

                {selectedFile.document_type === 'cheque' && selectedFile.amount && (
                  <div className="detail-row">
                    <strong>Amount:</strong>
                    <span>₹{parseFloat(selectedFile.amount).toLocaleString('en-IN', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
                  </div>
                )}

                <div className="detail-row">
                  <strong>File Name:</strong>
                  <span>{selectedFile.name}</span>
                </div>

                <div className="detail-row">
                  <strong>Uploaded By:</strong>
                  <span>{selectedFile.user_username || 'Unknown'}</span>
                </div>

                <div className="detail-row">
                  <strong>Upload Date:</strong>
                  <span>{new Date(selectedFile.uploaded_at).toLocaleString()}</span>
                </div>

                <div className="detail-row">
                  <strong>File Type:</strong>
                  <span>{selectedFile.file_type || 'Unknown'}</span>
                </div>

                <div className="detail-row">
                  <strong>File Size:</strong>
                  <span>{selectedFile.file_size_display || formatFileSize(selectedFile.file_size)}</span>
                </div>

                <div className="detail-row">
                  <strong>Status:</strong>
                  <span className={`status-badge status-${selectedFile.status || 'pending'}`}>
                    {selectedFile.status ? selectedFile.status.charAt(0).toUpperCase() + selectedFile.status.slice(1) : 'Pending'}
                  </span>
                </div>
              </div>

              <div className="file-modal-actions">
                {selectedFile.file_url && (
                  <a 
                    href={selectedFile.file_url}
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
                <button 
                  onClick={() => handleDownload(selectedFile)}
                  className="download-btn"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"/>
                  </svg>
                  {' '}Download
                </button>
                <button 
                  onClick={handleCloseModal}
                  className="close-btn"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showEditModal && editingFile && (
        <EditFileModal 
          file={editingFile}
          onClose={handleCloseEditModal}
          onUpdate={handleUpdateFile}
        />
      )}
    </div>
  );
};

const EditFileModal = ({ file, onClose, onUpdate }) => {
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
            <p><strong>Uploaded By:</strong> {file.user_username}</p>
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
              <button type="submit" className="submit-btn" disabled={loading}>
                {loading ? 'Updating...' : 'Update File'}
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

Uploaded_files.propTypes = {
  refreshTrigger: PropTypes.number
};

export default Uploaded_files;
