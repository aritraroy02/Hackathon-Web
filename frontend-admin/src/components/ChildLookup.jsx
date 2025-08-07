import React, { useState } from 'react';
import { Search, User, MapPin, Phone, Calendar, Eye, X, AlertCircle, Download } from 'lucide-react';
import { apiService } from '../services/api';

const ChildLookup = () => {
  const [healthId, setHealthId] = useState('');
  const [childData, setChildData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  const handleSearch = async (e) => {
    e.preventDefault();
    
    if (!healthId.trim()) {
      setError('Please enter a Health ID');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      // Fetch all children and find by health ID
      const response = await apiService.getChildren({ limit: 1000 });
      if (response && response.data) {
        const child = response.data.find(c => 
          c.healthId?.toLowerCase() === healthId.toLowerCase().trim()
        );
        
        if (child) {
          setChildData(child);
        } else {
          setError('No child found with this Health ID');
          setChildData(null);
        }
      }
    } catch (err) {
      setError('Failed to search for child data');
      console.error('Error searching child:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = () => {
    setShowDetailModal(true);
  };

  const handleCloseModal = () => {
    setShowDetailModal(false);
  };

  const handleDownloadPDF = () => {
    if (!childData) return;

    // Create a new window for printing
    const printWindow = window.open('', '_blank');
    
    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Child Health Record - ${childData.childName || 'Unknown'}</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              line-height: 1.6;
              color: #333;
              max-width: 800px;
              margin: 0 auto;
              padding: 20px;
            }
            .header {
              text-align: center;
              border-bottom: 3px solid #3b82f6;
              padding-bottom: 20px;
              margin-bottom: 30px;
            }
            .header h1 {
              color: #3b82f6;
              margin: 0;
              font-size: 28px;
            }
            .header p {
              color: #666;
              margin: 5px 0 0 0;
            }
            .photo-section {
              text-align: center;
              margin-bottom: 30px;
            }
            .child-photo {
              width: 150px;
              height: 150px;
              border-radius: 8px;
              border: 3px solid #e5e7eb;
              object-fit: cover;
            }
            .section {
              margin-bottom: 25px;
              border: 1px solid #e5e7eb;
              border-radius: 8px;
              padding: 20px;
              background-color: #f9fafb;
            }
            .section-title {
              color: #3b82f6;
              font-size: 18px;
              font-weight: bold;
              margin-bottom: 15px;
              border-bottom: 2px solid #3b82f6;
              padding-bottom: 5px;
            }
            .info-row {
              display: flex;
              justify-content: space-between;
              margin-bottom: 10px;
              padding: 8px 0;
              border-bottom: 1px solid #e5e7eb;
            }
            .info-row:last-child {
              border-bottom: none;
              margin-bottom: 0;
            }
            .label {
              font-weight: bold;
              color: #374151;
              flex: 1;
            }
            .value {
              color: #1f2937;
              flex: 2;
              text-align: right;
            }
            .footer {
              text-align: center;
              margin-top: 40px;
              padding-top: 20px;
              border-top: 1px solid #e5e7eb;
              color: #6b7280;
              font-size: 12px;
            }
            @media print {
              body { margin: 0; padding: 15px; }
              .section { break-inside: avoid; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Child Health Record</h1>
            <p>Health ID: ${childData.healthId || 'N/A'}</p>
            <p>Generated on: ${new Date().toLocaleDateString()}</p>
          </div>

          ${childData.facePhoto ? `
            <div class="photo-section">
              <img src="${childData.facePhoto}" alt="Child Photo" class="child-photo" />
            </div>
          ` : ''}

          <div class="section">
            <div class="section-title">📋 Basic Information</div>
            <div class="info-row">
              <span class="label">Child Name:</span>
              <span class="value">${childData.childName || 'N/A'}</span>
            </div>
            <div class="info-row">
              <span class="label">Age:</span>
              <span class="value">${childData.age || 'N/A'} years</span>
            </div>
            <div class="info-row">
              <span class="label">Gender:</span>
              <span class="value">${childData.gender || 'N/A'}</span>
            </div>
            <div class="info-row">
              <span class="label">Weight:</span>
              <span class="value">${childData.weight ? `${childData.weight} kg` : 'N/A'}</span>
            </div>
            <div class="info-row">
              <span class="label">Height:</span>
              <span class="value">${childData.height ? `${childData.height} cm` : 'N/A'}</span>
            </div>
          </div>

          <div class="section">
            <div class="section-title">👨‍👩‍👧‍👦 Guardian Information</div>
            <div class="info-row">
              <span class="label">Guardian Name:</span>
              <span class="value">${childData.guardianName || 'N/A'}</span>
            </div>
            <div class="info-row">
              <span class="label">Relation:</span>
              <span class="value">${childData.relation || 'N/A'}</span>
            </div>
            <div class="info-row">
              <span class="label">Phone:</span>
              <span class="value">${childData.phone || 'N/A'}</span>
            </div>
          </div>

          <div class="section">
            <div class="section-title">🆔 Identification</div>
            <div class="info-row">
              <span class="label">Health ID:</span>
              <span class="value">${childData.healthId || 'N/A'}</span>
            </div>
            <div class="info-row">
              <span class="label">Local ID:</span>
              <span class="value">${childData.localId || 'N/A'}</span>
            </div>
          </div>

          <div class="section">
            <div class="section-title">📍 Location & Upload Information</div>
            <div class="info-row">
              <span class="label">Address:</span>
              <span class="value">${childData.location?.address || 'N/A'}</span>
            </div>
            <div class="info-row">
              <span class="label">City:</span>
              <span class="value">${childData.location?.city || 'N/A'}</span>
            </div>
            <div class="info-row">
              <span class="label">State:</span>
              <span class="value">${childData.location?.state || 'N/A'}</span>
            </div>
            <div class="info-row">
              <span class="label">Uploaded By:</span>
              <span class="value">${childData.uploadedBy || 'N/A'}</span>
            </div>
            <div class="info-row">
              <span class="label">Date Collected:</span>
              <span class="value">${childData.dateCollected ? new Date(childData.dateCollected).toLocaleDateString() : 'N/A'}</span>
            </div>
          </div>

          <div class="section">
            <div class="section-title">🏥 Health Information</div>
            <div class="info-row">
              <span class="label">Malnutrition Signs:</span>
              <span class="value">${(() => {
                let signs = childData.malnutritionSigns;
                if (typeof signs === 'string') {
                  signs = signs.trim() ? signs.split(',').map(s => s.trim()) : [];
                }
                return Array.isArray(signs) && signs.length > 0 && signs[0] !== ''
                  ? signs.join(', ')
                  : 'N/A';
              })()}</span>
            </div>
            <div class="info-row">
              <span class="label">Recent Illnesses:</span>
              <span class="value">${childData.recentIllnesses && Array.isArray(childData.recentIllnesses) && childData.recentIllnesses.length > 0
                ? childData.recentIllnesses.join(', ')
                : 'N/A'
              }</span>
            </div>
          </div>

          <div class="footer">
            <p>This document was generated from the Child Health Management System</p>
            <p>© ${new Date().getFullYear()} Child Health Dashboard - All rights reserved</p>
          </div>
        </body>
      </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();

    // Wait for content to load, then print
    setTimeout(() => {
      printWindow.print();
      // Note: We don't close the window immediately as user might want to save as PDF
    }, 500);
  };

  const clearSearch = () => {
    setHealthId('');
    setChildData(null);
    setError(null);
  };

  return (
    <div className="child-lookup-container">
      <div className="lookup-header">
        <h1 className="lookup-title">
          <Search size={28} />
          Find Child by Health ID
        </h1>
        <p className="lookup-subtitle">Enter a Health ID to retrieve child health records</p>
      </div>

      {/* Search Form */}
      <div className="search-section">
        <form onSubmit={handleSearch} className="search-form">
          <div className="search-input-group">
            <Search className="search-icon" size={20} />
            <input
              type="text"
              value={healthId}
              onChange={(e) => setHealthId(e.target.value)}
              placeholder="Enter Health ID (e.g., HID-12345)"
              className="search-input"
              disabled={loading}
            />
            {healthId && (
              <button 
                type="button" 
                onClick={clearSearch} 
                className="clear-btn"
                disabled={loading}
              >
                <X size={16} />
              </button>
            )}
          </div>
          <button 
            type="submit" 
            className="search-btn"
            disabled={loading || !healthId.trim()}
          >
            {loading ? 'Searching...' : 'Search'}
          </button>
        </form>
      </div>

      {/* Error Message */}
      {error && (
        <div className="error-message">
          <AlertCircle size={20} />
          <span>{error}</span>
        </div>
      )}

      {/* Search Results */}
      {childData && (
        <div className="result-section">
          <h2 className="result-title">Search Result</h2>
          <div className="child-result-card">
            {/* Child Photo */}
            {childData.facePhoto && (
              <div className="result-photo-container">
                <img 
                  src={childData.facePhoto} 
                  alt={`Photo of ${childData.childName || 'child'}`}
                  className="result-photo"
                  onError={(e) => {
                    e.target.style.display = 'none';
                  }}
                />
              </div>
            )}
            
            <div className="result-content">
              <div className="result-header">
                <h3 className="child-name">{childData.childName || 'Unknown'}</h3>
                <div className="health-id-badge">{childData.healthId}</div>
              </div>
              
              <div className="result-details">
                <div className="detail-row">
                  <User size={16} />
                  <span className="detail-label">Age:</span>
                  <span className="detail-value">{childData.age || 'N/A'} years</span>
                </div>
                
                <div className="detail-row">
                  <User size={16} />
                  <span className="detail-label">Gender:</span>
                  <span className="detail-value">{childData.gender || 'N/A'}</span>
                </div>
                
                <div className="detail-row">
                  <User size={16} />
                  <span className="detail-label">Guardian:</span>
                  <span className="detail-value">{childData.guardianName || 'N/A'}</span>
                </div>
                
                <div className="detail-row">
                  <Phone size={16} />
                  <span className="detail-label">Phone:</span>
                  <span className="detail-value">{childData.phone || 'N/A'}</span>
                </div>
                
                <div className="detail-row">
                  <MapPin size={16} />
                  <span className="detail-label">Location:</span>
                  <span className="detail-value">
                    {childData.location?.city || 'N/A'}, {childData.location?.state || 'N/A'}
                  </span>
                </div>
                
                <div className="detail-row">
                  <Calendar size={16} />
                  <span className="detail-label">Date Collected:</span>
                  <span className="detail-value">
                    {childData.dateCollected ? new Date(childData.dateCollected).toLocaleDateString() : 'N/A'}
                  </span>
                </div>
              </div>
              
              <div className="result-actions">
                <button className="view-details-btn" onClick={handleViewDetails}>
                  <Eye size={16} />
                  View Full Details
                </button>
                <button className="download-pdf-btn" onClick={handleDownloadPDF}>
                  <Download size={16} />
                  Download PDF
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Detailed View Modal */}
      {showDetailModal && childData && (
        <div className="modal-overlay" onClick={handleCloseModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Complete Health Record</h2>
              <button className="close-modal-btn" onClick={handleCloseModal}>
                <X size={24} />
              </button>
            </div>
            <div className="modal-body">
              {/* Child Photo */}
              {childData.facePhoto && (
                <div className="child-photo-container">
                  <img 
                    src={childData.facePhoto} 
                    alt={`Photo of ${childData.childName || 'child'}`}
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
                    <span className="detail-value">{childData.childName || 'N/A'}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Age:</span>
                    <span className="detail-value">{childData.age || 'N/A'}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Gender:</span>
                    <span className="detail-value">{childData.gender || 'N/A'}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Weight:</span>
                    <span className="detail-value">{childData.weight ? `${childData.weight} kg` : 'N/A'}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Height:</span>
                    <span className="detail-value">{childData.height ? `${childData.height} cm` : 'N/A'}</span>
                  </div>
                </div>

                {/* Guardian Information */}
                <div className="detail-section">
                  <h3><User size={20} /> Guardian Information</h3>
                  <div className="detail-row">
                    <span className="detail-label">Guardian Name:</span>
                    <span className="detail-value">{childData.guardianName || 'N/A'}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Relation:</span>
                    <span className="detail-value">{childData.relation || 'N/A'}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Phone:</span>
                    <span className="detail-value">{childData.phone || 'N/A'}</span>
                  </div>
                </div>

                {/* Identification */}
                <div className="detail-section">
                  <h3><User size={20} /> Identification</h3>
                  <div className="detail-row">
                    <span className="detail-label">Health ID:</span>
                    <span className="detail-value">{childData.healthId || 'N/A'}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Local ID:</span>
                    <span className="detail-value">{childData.localId || 'N/A'}</span>
                  </div>
                </div>

                {/* Location & Upload Information */}
                <div className="detail-section">
                  <h3><MapPin size={20} /> Location & Upload Information</h3>
                  <div className="detail-row">
                    <span className="detail-label">Address:</span>
                    <span className="detail-value">{childData.location?.address || 'N/A'}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">City:</span>
                    <span className="detail-value">{childData.location?.city || 'N/A'}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">State:</span>
                    <span className="detail-value">{childData.location?.state || 'N/A'}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Uploaded By:</span>
                    <span className="detail-value">{childData.uploadedBy || 'N/A'}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Date Collected:</span>
                    <span className="detail-value">
                      {childData.dateCollected ? new Date(childData.dateCollected).toLocaleDateString() : 'N/A'}
                    </span>
                  </div>
                </div>

                {/* Health Information */}
                <div className="detail-section">
                  <h3><User size={20} /> Health Information</h3>
                  <div className="detail-row">
                    <span className="detail-label">Malnutrition Signs:</span>
                    <span className="detail-value">
                      {(() => {
                        let signs = childData.malnutritionSigns;
                        if (typeof signs === 'string') {
                          signs = signs.trim() ? signs.split(',').map(s => s.trim()) : [];
                        }
                        return Array.isArray(signs) && signs.length > 0 && signs[0] !== ''
                          ? signs.join(', ')
                          : 'N/A';
                      })()}
                    </span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Recent Illnesses:</span>
                    <span className="detail-value">
                      {childData.recentIllnesses && Array.isArray(childData.recentIllnesses) && childData.recentIllnesses.length > 0
                        ? childData.recentIllnesses.join(', ')
                        : 'N/A'
                      }
                    </span>
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

export default ChildLookup;
