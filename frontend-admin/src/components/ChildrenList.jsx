import React, { useState, useEffect } from 'react';
import { Users, Search, Filter, Download, Eye, X, MapPin, Phone, Calendar, User, ChevronLeft, ChevronRight } from 'lucide-react';
import { apiService } from '../services/api';

const ChildrenList = () => {
  const [children, setChildren] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedChild, setSelectedChild] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const recordsPerPage = 18;

  useEffect(() => {
    fetchChildren();
  }, []);

  const fetchChildren = async () => {
    try {
      setLoading(true);
      const response = await apiService.getChildren();
      if (response && response.data) {
        setChildren(response.data);
      }
    } catch (err) {
      setError('Failed to fetch children data');
      console.error('Error fetching children:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredChildren = children.filter(child => {
    const matchesSearch = child.childName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         child.guardianName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         child.healthId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         child.location?.city?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         child.location?.state?.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (filterStatus === 'all') return matchesSearch;
    if (filterStatus === 'recent') return matchesSearch && new Date(child.uploadedAt) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    if (filterStatus === 'offline') return matchesSearch && child.isOffline;
    return matchesSearch;
  });

  // Pagination logic
  const totalPages = Math.ceil(filteredChildren.length / recordsPerPage);
  const startIndex = (currentPage - 1) * recordsPerPage;
  const endIndex = startIndex + recordsPerPage;
  const currentRecords = filteredChildren.slice(startIndex, endIndex);

  // Reset to page 1 when search or filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterStatus]);

  const goToPage = (page) => {
    setCurrentPage(page);
  };

  const goToPrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const goToNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const getVisiblePages = () => {
    const delta = 2;
    const range = [];
    const rangeWithDots = [];

    for (let i = Math.max(2, currentPage - delta); i <= Math.min(totalPages - 1, currentPage + delta); i++) {
      range.push(i);
    }

    if (currentPage - delta > 2) {
      rangeWithDots.push(1, '...');
    } else {
      rangeWithDots.push(1);
    }

    rangeWithDots.push(...range);

    if (currentPage + delta < totalPages - 1) {
      rangeWithDots.push('...', totalPages);
    } else {
      rangeWithDots.push(totalPages);
    }

    return rangeWithDots;
  };

  const handleExport = () => {
    const csvContent = [
      ['Child Name', 'Age', 'Gender', 'Weight', 'Height', 'Guardian Name', 'Relation', 'Phone', 'Health ID', 'Local ID', 'City', 'State', 'Uploaded By', 'Date Collected'],
      ...filteredChildren.map(child => [
        child.childName || '',
        child.age || '',
        child.gender || '',
        child.weight || '',
        child.height || '',
        child.guardianName || '',
        child.relation || '',
        child.phone || '',
        child.healthId || '',
        child.localId || '',
        child.location?.city || '',
        child.location?.state || '',
        child.uploadedBy || '',
        child.dateCollected ? new Date(child.dateCollected).toLocaleDateString() : ''
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'children_data.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const handleViewDetails = (child) => {
    setSelectedChild(child);
    setShowDetailModal(true);
  };

  const handleCloseModal = () => {
    setSelectedChild(null);
    setShowDetailModal(false);
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading children data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-container">
        <p className="error-message">{error}</p>
        <button onClick={fetchChildren} className="retry-btn">
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="children-list">
      <div className="page-header">
        <div className="header-content">
          <div className="header-text">
            <h1>
              <Users size={32} />
              View All Child Data
            </h1>
            <p>Comprehensive list of all child health records</p>
          </div>
          <div className="header-actions">
            <button onClick={handleExport} className="export-btn">
              <Download size={16} />
              Export CSV
            </button>
          </div>
        </div>
      </div>

      <div className="filters-section">
        <div className="search-filter">
          <Search size={20} />
          <input
            type="text"
            placeholder="Search by child name, guardian, health ID, city, or state..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>
        <div className="status-filter">
          <Filter size={20} />
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="filter-select"
          >
            <option value="all">All Records</option>
            <option value="recent">Recent (7 days)</option>
            <option value="offline">Offline Records</option>
          </select>
        </div>
      </div>

      <div className="results-summary">
        <p>Showing {currentRecords.length} of {filteredChildren.length} records (Page {currentPage} of {totalPages})</p>
      </div>

      <div className="children-grid">
        {currentRecords.map((child) => (
          <div key={child._id || child.healthId} className="child-card">
            <div className="card-header">
              <h3>{child.childName || 'Unknown'}</h3>
              <div className="card-badges">
                <span className="health-id">{child.healthId}</span>
                {child.isOffline && <span className="offline-badge">Offline</span>}
              </div>
            </div>
            <div className="card-body">
              <div className="child-details">
                <div className="detail-row">
                  <span className="label">Age:</span>
                  <span className="value">{child.age || 'N/A'}</span>
                </div>
                <div className="detail-row">
                  <span className="label">Gender:</span>
                  <span className="value">{child.gender || 'N/A'}</span>
                </div>
                <div className="detail-row">
                  <span className="label">Weight:</span>
                  <span className="value">{child.weight ? `${child.weight} kg` : 'N/A'}</span>
                </div>
                <div className="detail-row">
                  <span className="label">Height:</span>
                  <span className="value">{child.height ? `${child.height} cm` : 'N/A'}</span>
                </div>
                <div className="detail-row">
                  <span className="label">Guardian:</span>
                  <span className="value">{child.guardianName || 'N/A'}</span>
                </div>
                <div className="detail-row">
                  <span className="label">Relation:</span>
                  <span className="value">{child.relation || 'N/A'}</span>
                </div>
                <div className="detail-row">
                  <span className="label">Phone:</span>
                  <span className="value">{child.phone || 'N/A'}</span>
                </div>
                <div className="detail-row">
                  <span className="label">Local ID:</span>
                  <span className="value">{child.localId || 'N/A'}</span>
                </div>
                <div className="detail-row">
                  <span className="label">Location:</span>
                  <span className="value">
                    {child.location?.city || 'N/A'}, {child.location?.state || 'N/A'}
                  </span>
                </div>
                <div className="detail-row">
                  <span className="label">Uploaded By:</span>
                  <span className="value">{child.uploadedBy || 'N/A'}</span>
                </div>
                <div className="detail-row">
                  <span className="label">Date Collected:</span>
                  <span className="value">
                    {child.dateCollected ? new Date(child.dateCollected).toLocaleDateString() : 'N/A'}
                  </span>
                </div>
              </div>
            </div>
            <div className="card-footer">
              <button className="view-btn" onClick={() => handleViewDetails(child)}>
                <Eye size={16} />
                View Details
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="pagination-container">
          <div className="pagination">
            <button 
              className="pagination-btn prev-btn" 
              onClick={goToPrevPage}
              disabled={currentPage === 1}
            >
              <ChevronLeft size={16} />
              Previous
            </button>
            
            <div className="page-numbers">
              {getVisiblePages().map((page, index) => (
                <button
                  key={index}
                  className={`page-number ${page === currentPage ? 'active' : ''} ${page === '...' ? 'dots' : ''}`}
                  onClick={() => typeof page === 'number' && goToPage(page)}
                  disabled={page === '...'}
                >
                  {page}
                </button>
              ))}
            </div>
            
            <button 
              className="pagination-btn next-btn" 
              onClick={goToNextPage}
              disabled={currentPage === totalPages}
            >
              Next
              <ChevronRight size={16} />
            </button>
          </div>
          
          <div className="pagination-info">
            <span>Page {currentPage} of {totalPages} | Total Records: {filteredChildren.length}</span>
          </div>
        </div>
      )}

      {filteredChildren.length === 0 && (
        <div className="no-results">
          <Users size={48} />
          <h3>No children found</h3>
          <p>Try adjusting your search or filter criteria</p>
        </div>
      )}

      {/* Detailed View Modal */}
      {showDetailModal && selectedChild && (
        <div className="modal-overlay" onClick={handleCloseModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Child Health Record Details</h2>
              <button className="close-modal-btn" onClick={handleCloseModal}>
                <X size={24} />
              </button>
            </div>
            <div className="modal-body">
              {/* Child Photo */}
              {selectedChild.facePhoto && (
                <div className="child-photo-container">
                  <img 
                    src={selectedChild.facePhoto} 
                    alt={`Photo of ${selectedChild.childName || 'child'}`}
                    className="child-photo"
                    onError={(e) => {
                      e.target.style.display = 'none';
                    }}
                  />
                </div>
              )}
              
              <div className="detail-sections">
                {/* Basic Information */}
                <div className="detail-section">
                  <h3><User size={20} /> Basic Information</h3>
                  <div className="detail-row">
                    <span className="detail-label">Child Name:</span>
                    <span className="detail-value">{selectedChild.childName || 'N/A'}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Age:</span>
                    <span className="detail-value">{selectedChild.age || 'N/A'}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Gender:</span>
                    <span className="detail-value">{selectedChild.gender || 'N/A'}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Weight:</span>
                    <span className="detail-value">{selectedChild.weight ? `${selectedChild.weight} kg` : 'N/A'}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Height:</span>
                    <span className="detail-value">{selectedChild.height ? `${selectedChild.height} cm` : 'N/A'}</span>
                  </div>
                </div>

                {/* Guardian Information */}
                <div className="detail-section">
                  <h3><Users size={20} /> Guardian Information</h3>
                  <div className="detail-row">
                    <span className="detail-label">Guardian Name:</span>
                    <span className="detail-value">{selectedChild.guardianName || 'N/A'}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Relation:</span>
                    <span className="detail-value">{selectedChild.relation || 'N/A'}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Phone:</span>
                    <span className="detail-value">{selectedChild.phone || 'N/A'}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Parents Consent:</span>
                    <span className="detail-value">{selectedChild.parentsConsent ? 'Yes' : 'No'}</span>
                  </div>
                </div>

                {/* Health & Identification */}
                <div className="detail-section">
                  <h3><Calendar size={20} /> Health & Identification</h3>
                  <div className="detail-row">
                    <span className="detail-label">Health ID:</span>
                    <span className="detail-value">{selectedChild.healthId || 'N/A'}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Local ID:</span>
                    <span className="detail-value">{selectedChild.localId || 'N/A'}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">ID Type:</span>
                    <span className="detail-value">{selectedChild.idType || 'N/A'}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Country Code:</span>
                    <span className="detail-value">{selectedChild.countryCode || 'N/A'}</span>
                  </div>
                </div>

                {/* Health Conditions */}
                <div className="detail-section">
                  <h3><Calendar size={20} /> Health Conditions</h3>
                  <div className="detail-row">
                    <span className="detail-label">Malnutrition Signs:</span>
                    <span className="detail-value">{selectedChild.malnutritionSigns || 'None reported'}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Recent Illnesses:</span>
                    <span className="detail-value">{selectedChild.recentIllnesses || 'None reported'}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Skip Malnutrition Check:</span>
                    <span className="detail-value">{selectedChild.skipMalnutrition ? 'Yes' : 'No'}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Skip Illnesses Check:</span>
                    <span className="detail-value">{selectedChild.skipIllnesses ? 'Yes' : 'No'}</span>
                  </div>
                </div>

                {/* Location Information */}
                <div className="detail-section">
                  <h3><MapPin size={20} /> Location Information</h3>
                  <div className="detail-row">
                    <span className="detail-label">City:</span>
                    <span className="detail-value">{selectedChild.location?.city || 'N/A'}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">State:</span>
                    <span className="detail-value">{selectedChild.location?.state || 'N/A'}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Address:</span>
                    <span className="detail-value">{selectedChild.location?.address || 'N/A'}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Coordinates:</span>
                    <span className="detail-value">
                      {selectedChild.location?.latitude && selectedChild.location?.longitude 
                        ? `${selectedChild.location.latitude}, ${selectedChild.location.longitude}`
                        : 'N/A'
                      }
                    </span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Location Accuracy:</span>
                    <span className="detail-value">
                      {selectedChild.location?.accuracy ? `${selectedChild.location.accuracy}m` : 'N/A'}
                    </span>
                  </div>
                </div>

                {/* Upload Information */}
                <div className="detail-section">
                  <h3><Phone size={20} /> Upload Information</h3>
                  <div className="detail-row">
                    <span className="detail-label">Uploaded By:</span>
                    <span className="detail-value">{selectedChild.uploadedBy || 'N/A'}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Uploader UIN:</span>
                    <span className="detail-value">{selectedChild.uploaderUIN || 'N/A'}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Employee ID:</span>
                    <span className="detail-value">{selectedChild.uploaderEmployeeId || 'N/A'}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Upload Date:</span>
                    <span className="detail-value">
                      {selectedChild.uploadedAt ? new Date(selectedChild.uploadedAt).toLocaleString() : 'N/A'}
                    </span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Collection Date:</span>
                    <span className="detail-value">
                      {selectedChild.dateCollected ? new Date(selectedChild.dateCollected).toLocaleString() : 'N/A'}
                    </span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Offline Status:</span>
                    <span className="detail-value">{selectedChild.isOffline ? 'Offline Upload' : 'Online Upload'}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChildrenList;
