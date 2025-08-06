import React, { useState, useEffect } from 'react';
import { UserCheck, Upload, Search, CheckCircle, AlertCircle, Clock, Plus, X, Save, User, Eye, Edit, Trash2 } from 'lucide-react';
import { apiService } from '../services/api';
import './Dashboard.css';

const KYCManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [showAddForm, setShowAddForm] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [adminCode, setAdminCode] = useState('');

  // Form state for adding new representative
  const [formData, setFormData] = useState({
    uinNumber: '',
    name: '',
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
    dateOfBirth: '',
    gender: 'Male',
    employeeId: '',
    role: 'health_worker',
    department: '',
    designation: '',
    isActive: true,
    isVerified: false
  });

  // Fetch users from API
  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiService.getUsers({ limit: 1000 });
      if (response.success) {
        setUsers(response.data);
      } else {
        setError('Failed to fetch representatives data');
      }
    } catch (err) {
      console.error('Error fetching users:', err);
      setError('Failed to connect to server. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // Filter users based on search and filters
  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.department?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.uinNumber?.includes(searchTerm) ||
      user.employeeId?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesRole = filterRole === 'all' || user.role === filterRole;
    const matchesStatus = filterStatus === 'all' || 
      (filterStatus === 'verified' && user.isVerified) ||
      (filterStatus === 'pending' && !user.isVerified && user.isActive) ||
      (filterStatus === 'inactive' && !user.isActive);
    
    return matchesSearch && matchesRole && matchesStatus;
  });

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      setError(null);

      // Basic validation
      const requiredFields = ['uinNumber', 'name', 'firstName', 'lastName', 'email', 'phone', 'address', 'dateOfBirth', 'employeeId', 'department', 'designation'];
      const missingFields = requiredFields.filter(field => !formData[field]);
      
      if (missingFields.length > 0) {
        setError(`Please fill in all required fields: ${missingFields.join(', ')}`);
        return;
      }

      // Validate UIN number (should be 10 digits)
      if (!/^\d{10}$/.test(formData.uinNumber)) {
        setError('UIN Number must be exactly 10 digits');
        return;
      }

      // Validate email
      if (!/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/.test(formData.email)) {
        setError('Please enter a valid email address');
        return;
      }

      const response = await apiService.createUser(formData);
      
      if (response.success) {
        // Reset form and close modal
        setFormData({
          uinNumber: '',
          name: '',
          firstName: '',
          lastName: '',
          email: '',
          phone: '',
          address: '',
          city: '',
          state: '',
          pincode: '',
          dateOfBirth: '',
          gender: 'Male',
          employeeId: '',
          role: 'health_worker',
          department: '',
          designation: '',
          isActive: true,
          isVerified: false
        });
        setShowAddForm(false);
        
        // Refresh the users list
        await fetchUsers();
        
        alert('Representative added successfully!');
      } else {
        setError(response.message || 'Failed to create representative');
      }
    } catch (err) {
      console.error('Error creating user:', err);
      setError(err.response?.data?.message || 'Failed to create representative');
    } finally {
      setSubmitting(false);
    }
  };

  // Handle approve user
  const handleApprove = async (userId) => {
    try {
      setError(null);
      const response = await apiService.updateUserVerification(userId, true);
      if (response.success) {
        await fetchUsers();
        alert('Representative approved successfully!');
      } else {
        setError('Failed to approve representative');
      }
    } catch (err) {
      console.error('Error approving user:', err);
      setError('Failed to approve representative');
    }
  };

  // Handle reject user
  const handleReject = async (userId) => {
    try {
      setError(null);
      const response = await apiService.updateUserStatus(userId, false);
      if (response.success) {
        await fetchUsers();
        alert('Representative rejected successfully!');
      } else {
        setError('Failed to reject representative');
      }
    } catch (err) {
      console.error('Error rejecting user:', err);
      setError('Failed to reject representative');
    }
  };

  // Handle view user
  const handleView = async (user) => {
    try {
      setError(null);
      setSelectedUser(user);
      setShowViewModal(true);
    } catch (err) {
      console.error('Error viewing user:', err);
      setError('Failed to load user details');
    }
  };

  // Handle edit user
  const handleEdit = async (user) => {
    try {
      setError(null);
      setSelectedUser(user);
      setFormData({
        uinNumber: user.uinNumber || '',
        name: user.name || '',
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        email: user.email || '',
        phone: user.phone || '',
        address: user.address || '',
        city: user.city || '',
        state: user.state || '',
        pincode: user.pincode || '',
        dateOfBirth: user.dateOfBirth ? user.dateOfBirth.split('T')[0] : '',
        gender: user.gender || 'Male',
        employeeId: user.employeeId || '',
        role: user.role || 'health_worker',
        department: user.department || '',
        designation: user.designation || '',
        isActive: user.isActive !== undefined ? user.isActive : true,
        isVerified: user.isVerified !== undefined ? user.isVerified : false
      });
      setShowEditModal(true);
    } catch (err) {
      console.error('Error preparing edit:', err);
      setError('Failed to load user for editing');
    }
  };

  // Handle delete user - show confirmation dialog
  const handleDelete = (user) => {
    setSelectedUser(user);
    setShowDeleteConfirm(true);
    setAdminCode('');
  };

  // Confirm delete with admin code
  const confirmDelete = async () => {
    if (adminCode !== 'Admin@123') {
      setError('Invalid admin code. Please try again.');
      return;
    }

    try {
      setError(null);
      setSubmitting(true);
      const response = await apiService.deleteUser(selectedUser._id);
      
      if (response.success) {
        await fetchUsers();
        setShowDeleteConfirm(false);
        setSelectedUser(null);
        setAdminCode('');
        alert('Representative deleted successfully!');
      } else {
        setError('Failed to delete representative');
      }
    } catch (err) {
      console.error('Error deleting user:', err);
      setError('Failed to delete representative');
    } finally {
      setSubmitting(false);
    }
  };

  // Handle update user (edit form submission)
  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      setError(null);

      // Basic validation
      const requiredFields = ['uinNumber', 'name', 'firstName', 'lastName', 'email', 'phone', 'address', 'dateOfBirth', 'employeeId', 'department', 'designation'];
      const missingFields = requiredFields.filter(field => !formData[field]);
      
      if (missingFields.length > 0) {
        setError(`Please fill in all required fields: ${missingFields.join(', ')}`);
        return;
      }

      // Validate UIN number (should be 10 digits)
      if (!/^\d{10}$/.test(formData.uinNumber)) {
        setError('UIN Number must be exactly 10 digits');
        return;
      }

      // Validate email
      if (!/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/.test(formData.email)) {
        setError('Please enter a valid email address');
        return;
      }

      const response = await apiService.updateUser(selectedUser._id, formData);
      
      if (response.success) {
        setShowEditModal(false);
        setSelectedUser(null);
        
        // Reset form
        setFormData({
          uinNumber: '',
          name: '',
          firstName: '',
          lastName: '',
          email: '',
          phone: '',
          address: '',
          city: '',
          state: '',
          pincode: '',
          dateOfBirth: '',
          gender: 'Male',
          employeeId: '',
          role: 'health_worker',
          department: '',
          designation: '',
          isActive: true,
          isVerified: false
        });
        
        // Refresh the users list
        await fetchUsers();
        
        alert('Representative updated successfully!');
      } else {
        setError(response.message || 'Failed to update representative');
      }
    } catch (err) {
      console.error('Error updating user:', err);
      setError(err.response?.data?.message || 'Failed to update representative');
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadge = (user) => {
    if (!user.isActive) {
      return (
        <div className="status-badge inactive">
          <AlertCircle size={16} />
          <span>Inactive</span>
        </div>
      );
    } else if (user.isVerified) {
      return (
        <div className="status-badge verified">
          <CheckCircle size={16} />
          <span>Verified</span>
        </div>
      );
    } else {
      return (
        <div className="status-badge pending">
          <Clock size={16} />
          <span>Pending</span>
        </div>
      );
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-IN');
  };

  if (loading) {
    return (
      <div className="kyc-management">
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Loading representatives...</p>
        </div>
      </div>
    );
  }

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
            <button 
              className="add-btn"
              onClick={() => setShowAddForm(true)}
            >
              <Plus size={16} />
              Add New Representative
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="error-message">
          <AlertCircle size={20} />
          <span>{error}</span>
          <button onClick={() => setError(null)} className="close-btn">
            <X size={16} />
          </button>
        </div>
      )}

      <div className="filters-section">
        <div className="search-filter">
          <Search size={20} />
          <input
            type="text"
            placeholder="Search by name, email, UIN, employee ID, or department..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>
        <div className="role-filter">
          <select
            value={filterRole}
            onChange={(e) => setFilterRole(e.target.value)}
            className="filter-select"
          >
            <option value="all">All Roles</option>
            <option value="health_worker">Health Worker</option>
            <option value="supervisor">Supervisor</option>
            <option value="admin">Admin</option>
            <option value="data_entry">Data Entry</option>
          </select>
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
            <option value="inactive">Inactive</option>
          </select>
        </div>
      </div>

      <div className="stats-summary">
        <div className="stat-card verified">
          <div className="stat-number">{users.filter(u => u.isVerified && u.isActive).length}</div>
          <div className="stat-label">Verified</div>
        </div>
        <div className="stat-card pending">
          <div className="stat-number">{users.filter(u => !u.isVerified && u.isActive).length}</div>
          <div className="stat-label">Pending</div>
        </div>
        <div className="stat-card inactive">
          <div className="stat-number">{users.filter(u => !u.isActive).length}</div>
          <div className="stat-label">Inactive</div>
        </div>
        <div className="stat-card total">
          <div className="stat-number">{users.length}</div>
          <div className="stat-label">Total</div>
        </div>
      </div>

      <div className="results-summary">
        <p>Showing {filteredUsers.length} of {users.length} representatives</p>
      </div>

      <div className="kyc-table">
        <table>
          <thead>
            <tr>
              <th>Representative</th>
              <th>Contact</th>
              <th>Organization</th>
              <th>UIN Number</th>
              <th>Status</th>
              <th>Upload Date</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.map((user) => (
              <tr key={user._id}>
                <td>
                  <div className="representative-info">
                    <div className="name">{user.name}</div>
                    <div className="designation">{user.designation}</div>
                    <div className="employee-id">ID: {user.employeeId}</div>
                  </div>
                </td>
                <td>
                  <div className="contact-info">
                    <div>{user.phone}</div>
                    <div className="email">{user.email}</div>
                  </div>
                </td>
                <td>
                  <div className="organization-info">
                    <div className="department">{user.department}</div>
                    <div className="role">{user.role.replace('_', ' ').toUpperCase()}</div>
                  </div>
                </td>
                <td className="uin">{user.uinNumber}</td>
                <td>
                  {getStatusBadge(user)}
                </td>
                <td>{formatDate(user.createdAt)}</td>
                <td>
                  <div className="action-buttons">
                    <button 
                      className="view-btn"
                      onClick={() => handleView(user)}
                      title="View Details"
                    >
                      <Eye size={16} />
                      View
                    </button>
                    <button 
                      className="edit-btn"
                      onClick={() => handleEdit(user)}
                      title="Edit Representative"
                    >
                      <Edit size={16} />
                      Edit
                    </button>
                    <button 
                      className="delete-btn"
                      onClick={() => handleDelete(user)}
                      title="Delete Representative"
                    >
                      <Trash2 size={16} />
                      Delete
                    </button>
                    {!user.isVerified && user.isActive && (
                      <>
                        <button 
                          className="approve-btn"
                          onClick={() => handleApprove(user._id)}
                        >
                          Approve
                        </button>
                        <button 
                          className="reject-btn"
                          onClick={() => handleReject(user._id)}
                        >
                          Reject
                        </button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {filteredUsers.length === 0 && !loading && (
        <div className="no-results">
          <UserCheck size={48} />
          <h3>No representatives found</h3>
          <p>Try adjusting your search or filter criteria</p>
        </div>
      )}

      {/* Add Representative Modal */}
      {showAddForm && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2>
                <User size={24} />
                Add New Representative
              </h2>
              <button 
                className="close-btn"
                onClick={() => setShowAddForm(false)}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="representative-form">
              <div className="form-section">
                <h3>Personal Information</h3>
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="uinNumber">UIN Number *</label>
                    <input
                      type="text"
                      id="uinNumber"
                      name="uinNumber"
                      value={formData.uinNumber}
                      onChange={handleInputChange}
                      placeholder="10-digit UIN number"
                      maxLength="10"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="employeeId">Employee ID *</label>
                    <input
                      type="text"
                      id="employeeId"
                      name="employeeId"
                      value={formData.employeeId}
                      onChange={handleInputChange}
                      placeholder="e.g., HW-00001"
                      required
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="firstName">First Name *</label>
                    <input
                      type="text"
                      id="firstName"
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="lastName">Last Name *</label>
                    <input
                      type="text"
                      id="lastName"
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="name">Full Name *</label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="Complete full name"
                    required
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="email">Email *</label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="phone">Phone *</label>
                    <input
                      type="tel"
                      id="phone"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      placeholder="+91-9999999999"
                      required
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="dateOfBirth">Date of Birth *</label>
                    <input
                      type="date"
                      id="dateOfBirth"
                      name="dateOfBirth"
                      value={formData.dateOfBirth}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="gender">Gender *</label>
                    <select
                      id="gender"
                      name="gender"
                      value={formData.gender}
                      onChange={handleInputChange}
                      required
                    >
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="address">Address *</label>
                  <textarea
                    id="address"
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    rows="3"
                    placeholder="Complete address"
                    required
                  />
                </div>
              </div>

              <div className="form-section">
                <h3>Work Information</h3>
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="role">Role *</label>
                    <select
                      id="role"
                      name="role"
                      value={formData.role}
                      onChange={handleInputChange}
                      required
                    >
                      <option value="health_worker">Health Worker</option>
                      <option value="supervisor">Supervisor</option>
                      <option value="admin">Admin</option>
                      <option value="data_entry">Data Entry</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label htmlFor="designation">Designation *</label>
                    <input
                      type="text"
                      id="designation"
                      name="designation"
                      value={formData.designation}
                      onChange={handleInputChange}
                      placeholder="e.g., Senior Health Worker"
                      required
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="department">Department *</label>
                  <input
                    type="text"
                    id="department"
                    name="department"
                    value={formData.department}
                    onChange={handleInputChange}
                    placeholder="e.g., Child Health Services"
                    required
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>
                      <input
                        type="checkbox"
                        name="isActive"
                        checked={formData.isActive}
                        onChange={handleInputChange}
                      />
                      Active Status
                    </label>
                  </div>
                  <div className="form-group">
                    <label>
                      <input
                        type="checkbox"
                        name="isVerified"
                        checked={formData.isVerified}
                        onChange={handleInputChange}
                      />
                      Pre-verified
                    </label>
                  </div>
                </div>
              </div>

              <div className="form-actions">
                <button 
                  type="button" 
                  className="cancel-btn"
                  onClick={() => setShowAddForm(false)}
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="submit-btn"
                  disabled={submitting}
                >
                  <Save size={16} />
                  {submitting ? 'Creating...' : 'Create Representative'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Representative Modal */}
      {showViewModal && selectedUser && (
        <div className="modal-overlay">
          <div className="modal-content view-modal">
            <div className="modal-header">
              <h2>
                <Eye size={24} />
                Representative Details
              </h2>
              <button 
                className="close-btn"
                onClick={() => {
                  setShowViewModal(false);
                  setSelectedUser(null);
                }}
              >
                <X size={20} />
              </button>
            </div>

            <div className="view-content">
              <div className="view-section">
                <h3>Personal Information</h3>
                <div className="view-grid">
                  <div className="view-field">
                    <label>UIN Number:</label>
                    <span>{selectedUser.uinNumber || 'N/A'}</span>
                  </div>
                  <div className="view-field">
                    <label>Employee ID:</label>
                    <span>{selectedUser.employeeId || 'N/A'}</span>
                  </div>
                  <div className="view-field">
                    <label>Full Name:</label>
                    <span>{selectedUser.name || 'N/A'}</span>
                  </div>
                  <div className="view-field">
                    <label>First Name:</label>
                    <span>{selectedUser.firstName || 'N/A'}</span>
                  </div>
                  <div className="view-field">
                    <label>Last Name:</label>
                    <span>{selectedUser.lastName || 'N/A'}</span>
                  </div>
                  <div className="view-field">
                    <label>Email:</label>
                    <span>{selectedUser.email || 'N/A'}</span>
                  </div>
                  <div className="view-field">
                    <label>Phone:</label>
                    <span>{selectedUser.phone || 'N/A'}</span>
                  </div>
                  <div className="view-field">
                    <label>Date of Birth:</label>
                    <span>{formatDate(selectedUser.dateOfBirth)}</span>
                  </div>
                  <div className="view-field">
                    <label>Gender:</label>
                    <span>{selectedUser.gender || 'N/A'}</span>
                  </div>
                  <div className="view-field full-width">
                    <label>Address:</label>
                    <span>{selectedUser.address || 'N/A'}</span>
                  </div>
                  {selectedUser.city && (
                    <div className="view-field">
                      <label>City:</label>
                      <span>{selectedUser.city}</span>
                    </div>
                  )}
                  {selectedUser.state && (
                    <div className="view-field">
                      <label>State:</label>
                      <span>{selectedUser.state}</span>
                    </div>
                  )}
                  {selectedUser.pincode && (
                    <div className="view-field">
                      <label>Pincode:</label>
                      <span>{selectedUser.pincode}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="view-section">
                <h3>Work Information</h3>
                <div className="view-grid">
                  <div className="view-field">
                    <label>Role:</label>
                    <span>{selectedUser.role?.replace('_', ' ').toUpperCase() || 'N/A'}</span>
                  </div>
                  <div className="view-field">
                    <label>Designation:</label>
                    <span>{selectedUser.designation || 'N/A'}</span>
                  </div>
                  <div className="view-field full-width">
                    <label>Department:</label>
                    <span>{selectedUser.department || 'N/A'}</span>
                  </div>
                </div>
              </div>

              <div className="view-section">
                <h3>Status Information</h3>
                <div className="view-grid">
                  <div className="view-field">
                    <label>Status:</label>
                    <span>{getStatusBadge(selectedUser)}</span>
                  </div>
                  <div className="view-field">
                    <label>Created:</label>
                    <span>{formatDate(selectedUser.createdAt)}</span>
                  </div>
                  <div className="view-field">
                    <label>Last Updated:</label>
                    <span>{formatDate(selectedUser.updatedAt)}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="form-actions">
              <button 
                type="button" 
                className="edit-btn"
                onClick={() => {
                  setShowViewModal(false);
                  handleEdit(selectedUser);
                }}
              >
                <Edit size={16} />
                Edit Representative
              </button>
              <button 
                type="button" 
                className="cancel-btn"
                onClick={() => {
                  setShowViewModal(false);
                  setSelectedUser(null);
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Representative Modal */}
      {showEditModal && selectedUser && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2>
                <Edit size={24} />
                Edit Representative
              </h2>
              <button 
                className="close-btn"
                onClick={() => {
                  setShowEditModal(false);
                  setSelectedUser(null);
                }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleUpdate} className="representative-form">
              <div className="form-section">
                <h3>Personal Information</h3>
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="edit-uinNumber">UIN Number *</label>
                    <input
                      type="text"
                      id="edit-uinNumber"
                      name="uinNumber"
                      value={formData.uinNumber}
                      onChange={handleInputChange}
                      placeholder="10-digit UIN number"
                      maxLength="10"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="edit-employeeId">Employee ID *</label>
                    <input
                      type="text"
                      id="edit-employeeId"
                      name="employeeId"
                      value={formData.employeeId}
                      onChange={handleInputChange}
                      placeholder="e.g., HW-00001"
                      required
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="edit-firstName">First Name *</label>
                    <input
                      type="text"
                      id="edit-firstName"
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="edit-lastName">Last Name *</label>
                    <input
                      type="text"
                      id="edit-lastName"
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="edit-name">Full Name *</label>
                  <input
                    type="text"
                    id="edit-name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="Complete full name"
                    required
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="edit-email">Email *</label>
                    <input
                      type="email"
                      id="edit-email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="edit-phone">Phone *</label>
                    <input
                      type="tel"
                      id="edit-phone"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      placeholder="+91-9999999999"
                      required
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="edit-dateOfBirth">Date of Birth *</label>
                    <input
                      type="date"
                      id="edit-dateOfBirth"
                      name="dateOfBirth"
                      value={formData.dateOfBirth}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="edit-gender">Gender *</label>
                    <select
                      id="edit-gender"
                      name="gender"
                      value={formData.gender}
                      onChange={handleInputChange}
                      required
                    >
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="edit-address">Address *</label>
                  <textarea
                    id="edit-address"
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    rows="3"
                    placeholder="Complete address"
                    required
                  />
                </div>
              </div>

              <div className="form-section">
                <h3>Work Information</h3>
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="edit-role">Role *</label>
                    <select
                      id="edit-role"
                      name="role"
                      value={formData.role}
                      onChange={handleInputChange}
                      required
                    >
                      <option value="health_worker">Health Worker</option>
                      <option value="supervisor">Supervisor</option>
                      <option value="admin">Admin</option>
                      <option value="data_entry">Data Entry</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label htmlFor="edit-designation">Designation *</label>
                    <input
                      type="text"
                      id="edit-designation"
                      name="designation"
                      value={formData.designation}
                      onChange={handleInputChange}
                      placeholder="e.g., Senior Health Worker"
                      required
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="edit-department">Department *</label>
                  <input
                    type="text"
                    id="edit-department"
                    name="department"
                    value={formData.department}
                    onChange={handleInputChange}
                    placeholder="e.g., Child Health Services"
                    required
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>
                      <input
                        type="checkbox"
                        name="isActive"
                        checked={formData.isActive}
                        onChange={handleInputChange}
                      />
                      Active Status
                    </label>
                  </div>
                  <div className="form-group">
                    <label>
                      <input
                        type="checkbox"
                        name="isVerified"
                        checked={formData.isVerified}
                        onChange={handleInputChange}
                      />
                      Verified Status
                    </label>
                  </div>
                </div>
              </div>

              <div className="form-actions">
                <button 
                  type="button" 
                  className="cancel-btn"
                  onClick={() => {
                    setShowEditModal(false);
                    setSelectedUser(null);
                  }}
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="submit-btn"
                  disabled={submitting}
                >
                  <Save size={16} />
                  {submitting ? 'Updating...' : 'Update Representative'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && selectedUser && (
        <div className="modal-overlay">
          <div className="modal-content delete-modal">
            <div className="modal-header">
              <h2>
                <Trash2 size={24} />
                Delete Representative
              </h2>
              <button 
                className="close-btn"
                onClick={() => {
                  setShowDeleteConfirm(false);
                  setSelectedUser(null);
                  setAdminCode('');
                }}
              >
                <X size={20} />
              </button>
            </div>

            <div className="delete-content">
              <div className="warning-section">
                <AlertCircle size={48} color="#dc3545" />
                <h3>Are you sure you want to delete this representative?</h3>
                <p>This action cannot be undone. All data associated with this representative will be permanently deleted from the database.</p>
              </div>

              <div className="representative-summary">
                <h4>Representative Details:</h4>
                <p><strong>Name:</strong> {selectedUser.name}</p>
                <p><strong>UIN:</strong> {selectedUser.uinNumber}</p>
                <p><strong>Email:</strong> {selectedUser.email}</p>
                <p><strong>Employee ID:</strong> {selectedUser.employeeId}</p>
                <p><strong>Department:</strong> {selectedUser.department}</p>
              </div>

              <div className="admin-code-section">
                <label htmlFor="adminCode">Enter Admin Code to confirm deletion:</label>
                <input
                  type="password"
                  id="adminCode"
                  value={adminCode}
                  onChange={(e) => setAdminCode(e.target.value)}
                  placeholder="Enter admin code..."
                  className="admin-code-input"
                />
                <small>Please enter the admin code to authorize this deletion.</small>
              </div>
            </div>

            <div className="form-actions">
              <button 
                type="button" 
                className="cancel-btn"
                onClick={() => {
                  setShowDeleteConfirm(false);
                  setSelectedUser(null);
                  setAdminCode('');
                }}
                disabled={submitting}
              >
                Cancel
              </button>
              <button 
                type="button" 
                className="delete-confirm-btn"
                onClick={confirmDelete}
                disabled={submitting || !adminCode}
              >
                <Trash2 size={16} />
                {submitting ? 'Deleting...' : 'Delete Representative'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default KYCManagement;
