import React, { useState } from 'react';
import { UserCheck, Upload, Search, CheckCircle, AlertCircle, Clock } from 'lucide-react';

const KYCManagement = () => {
  const [kycRecords, setKycRecords] = useState([
    {
      id: 1,
      representativeName: 'Dr. Amit Sharma',
      designation: 'Health Worker',
      organization: 'Community Health Center',
      phoneNumber: '+91-9876543210',
      email: 'amit.sharma@health.gov.in',
      aadharNumber: '1234-5678-9012',
      status: 'verified',
      uploadedAt: '2024-01-15',
      verifiedAt: '2024-01-16'
    },
    {
      id: 2,
      representativeName: 'Ms. Priya Patel',
      designation: 'ASHA Worker',
      organization: 'Rural Health Mission',
      phoneNumber: '+91-9876543211',
      email: 'priya.patel@rhm.gov.in',
      aadharNumber: '2345-6789-0123',
      status: 'pending',
      uploadedAt: '2024-01-18',
      verifiedAt: null
    },
    {
      id: 3,
      representativeName: 'Mr. Raj Kumar',
      designation: 'ANM',
      organization: 'District Hospital',
      phoneNumber: '+91-9876543212',
      email: 'raj.kumar@district.gov.in',
      aadharNumber: '3456-7890-1234',
      status: 'rejected',
      uploadedAt: '2024-01-10',
      verifiedAt: '2024-01-12'
    }
  ]);

  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  const filteredRecords = kycRecords.filter(record => {
    const matchesSearch = record.representativeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         record.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         record.organization.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (filterStatus === 'all') return matchesSearch;
    return matchesSearch && record.status === filterStatus;
  });

  const getStatusIcon = (status) => {
    switch (status) {
      case 'verified':
        return <CheckCircle size={20} className="status-icon verified" />;
      case 'pending':
        return <Clock size={20} className="status-icon pending" />;
      case 'rejected':
        return <AlertCircle size={20} className="status-icon rejected" />;
      default:
        return null;
    }
  };

  const getStatusClass = (status) => {
    return `status-badge ${status}`;
  };

  return (
    <div className="kyc-management">
      <div className="page-header">
        <div className="header-content">
          <div className="header-text">
            <h1>
              <UserCheck size={32} />
              Representative KYC Management
            </h1>
            <p>Manage and verify representative identification documents</p>
          </div>
          <div className="header-actions">
            <button className="add-btn">
              <Upload size={16} />
              Add New Representative
            </button>
          </div>
        </div>
      </div>

      <div className="filters-section">
        <div className="search-filter">
          <Search size={20} />
          <input
            type="text"
            placeholder="Search by name, email, or organization..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>
        <div className="status-filter">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="filter-select"
          >
            <option value="all">All Status</option>
            <option value="verified">Verified</option>
            <option value="pending">Pending</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
      </div>

      <div className="stats-summary">
        <div className="stat-card verified">
          <div className="stat-number">{kycRecords.filter(r => r.status === 'verified').length}</div>
          <div className="stat-label">Verified</div>
        </div>
        <div className="stat-card pending">
          <div className="stat-number">{kycRecords.filter(r => r.status === 'pending').length}</div>
          <div className="stat-label">Pending</div>
        </div>
        <div className="stat-card rejected">
          <div className="stat-number">{kycRecords.filter(r => r.status === 'rejected').length}</div>
          <div className="stat-label">Rejected</div>
        </div>
      </div>

      <div className="results-summary">
        <p>Showing {filteredRecords.length} of {kycRecords.length} representatives</p>
      </div>

      <div className="kyc-table">
        <table>
          <thead>
            <tr>
              <th>Representative</th>
              <th>Contact</th>
              <th>Organization</th>
              <th>Aadhar Number</th>
              <th>Status</th>
              <th>Upload Date</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredRecords.map((record) => (
              <tr key={record.id}>
                <td>
                  <div className="representative-info">
                    <div className="name">{record.representativeName}</div>
                    <div className="designation">{record.designation}</div>
                  </div>
                </td>
                <td>
                  <div className="contact-info">
                    <div>{record.phoneNumber}</div>
                    <div className="email">{record.email}</div>
                  </div>
                </td>
                <td>{record.organization}</td>
                <td className="aadhar">{record.aadharNumber}</td>
                <td>
                  <div className={getStatusClass(record.status)}>
                    {getStatusIcon(record.status)}
                    <span>{record.status.charAt(0).toUpperCase() + record.status.slice(1)}</span>
                  </div>
                </td>
                <td>{record.uploadedAt}</td>
                <td>
                  <div className="action-buttons">
                    <button className="view-btn">View</button>
                    {record.status === 'pending' && (
                      <>
                        <button className="approve-btn">Approve</button>
                        <button className="reject-btn">Reject</button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {filteredRecords.length === 0 && (
        <div className="no-results">
          <UserCheck size={48} />
          <h3>No representatives found</h3>
          <p>Try adjusting your search or filter criteria</p>
        </div>
      )}
    </div>
  );
};

export default KYCManagement;
