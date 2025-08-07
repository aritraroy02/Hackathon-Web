import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Avatar,
  Chip,
  Button,
  TextField,
  InputAdornment,
  Grid,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Alert,
  Fab,
  Menu,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  CircularProgress
} from '@mui/material';
import {
  Search as SearchIcon,
  Person as PersonIcon,
  Visibility as ViewIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
  FilterList as FilterIcon,
  CloudOff as OfflineIcon,
  CloudDone as SyncedIcon,
  Schedule as PendingIcon,
  GetApp as ExportIcon,
  MoreVert as MoreIcon,
  CloudUpload as UploadIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../../contexts/AppContext';
import { useAuth } from '../../contexts/AuthContext';
import { getAllRecords, deleteRecord, cleanupDatabase } from '../../utils/database';
import { uploadRecordsBatch } from '../../utils/uploadService';
import { checkInternetConnectivity } from '../../utils/networkUtils';

const RecordsList = () => {
  const navigate = useNavigate();
  const { state, dispatch, showNotification, setUploading, setUploadProgress, markRecordUploaded, loadMongoRecords } = useAppContext();
  const { isAuthenticated, user } = useAuth();
  
  const [records, setRecords] = useState([]);
  const [filteredRecords, setFilteredRecords] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [recordToDelete, setRecordToDelete] = useState(null);
  const [filterAnchorEl, setFilterAnchorEl] = useState(null);
  const [moreAnchorEl, setMoreAnchorEl] = useState(null);
  const [filters, setFilters] = useState({
    syncStatus: 'all', // 'all', 'synced', 'pending', 'offline'
    dateRange: 'all', // 'all', 'today', 'week', 'month'
    ageGroup: 'all' // 'all', 'infant', 'toddler', 'child', 'teen'
  });

  const loadRecords = useCallback(async () => {
    try {
      // Run cleanup to fix any duplicate records or invalid timestamps
      await cleanupDatabase();
      
      const allRecords = await getAllRecords();
      setRecords(allRecords.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)));
    } catch (error) {
      console.error('Failed to load records:', error);
      showNotification('Failed to load records', 'error');
    }
  }, [showNotification]);

  const filterRecords = useCallback(() => {
    // Combine offline records and MongoDB records
    const allRecords = [
      ...records.map(r => ({ ...r, source: 'offline' })),
      ...state.mongoRecords.map(r => ({ ...r, source: 'mongodb', synced: true }))
    ];
    
    let filtered = allRecords;

    // Text search
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(record =>
        record.childName?.toLowerCase().includes(term) ||
        record.guardianName?.toLowerCase().includes(term) ||
        record.healthId?.toLowerCase().includes(term)
      );
    }

    // Sync status filter
    if (filters.syncStatus !== 'all') {
      filtered = filtered.filter(record => {
        switch (filters.syncStatus) {
          case 'synced':
            return record.synced === true;
          case 'pending':
            return record.synced === false && state.isOnline;
          case 'offline':
            return record.synced === false && !state.isOnline;
          default:
            return true;
        }
      });
    }

    // Date range filter
    if (filters.dateRange !== 'all') {
      const now = new Date();
      filtered = filtered.filter(record => {
        const recordDate = new Date(record.timestamp);
        switch (filters.dateRange) {
          case 'today':
            return recordDate.toDateString() === now.toDateString();
          case 'week':
            const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            return recordDate >= weekAgo;
          case 'month':
            const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
            return recordDate >= monthAgo;
          default:
            return true;
        }
      });
    }

    // Age group filter
    if (filters.ageGroup !== 'all') {
      filtered = filtered.filter(record => {
        const age = parseFloat(record.age);
        switch (filters.ageGroup) {
          case 'infant':
            return age < 2;
          case 'toddler':
            return age >= 2 && age < 5;
          case 'child':
            return age >= 5 && age < 13;
          case 'teen':
            return age >= 13;
          default:
            return true;
        }
      });
    }

    setFilteredRecords(filtered);
  }, [records, state.mongoRecords, searchTerm, filters, state.isOnline]);

  // Load records on component mount
  useEffect(() => {
    loadRecords();
  }, [loadRecords]);

  // Filter records when search term or filters change
  useEffect(() => {
    filterRecords();
  }, [filterRecords]);

  const handleViewRecord = (record) => {
    setSelectedRecord(record);
    setIsViewDialogOpen(true);
  };

  const handleDeleteClick = (record) => {
    setRecordToDelete(record);
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!recordToDelete) return;

    try {
      await deleteRecord(recordToDelete.id);
      dispatch({ type: 'DELETE_RECORD', payload: recordToDelete.id });
      
      // Remove from local state
      setRecords(prev => prev.filter(r => r.id !== recordToDelete.id));
      
      showNotification('Record deleted successfully', 'success');
      setIsDeleteDialogOpen(false);
      setRecordToDelete(null);
    } catch (error) {
      console.error('Failed to delete record:', error);
      showNotification('Failed to delete record', 'error');
    }
  };

  const getSyncStatusIcon = (record) => {
    if (record.synced) {
      return <SyncedIcon color="success" />;
    } else if (state.isOnline) {
      return <PendingIcon color="warning" />;
    } else {
      return <OfflineIcon color="error" />;
    }
  };

  // Upload functionality
  const handleUploadAll = async () => {
    // Check authentication
    if (!isAuthenticated || !user) {
      showNotification('Please login to upload records', 'warning');
      return;
    }

    // Check internet connectivity
    if (!state.isOnline) {
      showNotification('Internet connection required for upload', 'warning');
      return;
    }

    // Double-check connectivity
    const hasInternet = await checkInternetConnectivity();
    if (!hasInternet) {
      showNotification('No internet connection. Please check your network.', 'error');
      return;
    }

    // Get pending records (not uploaded)
    const pendingRecords = records.filter(record => 
      !record.synced && record.uploadStatus !== 'uploaded'
    );

    if (pendingRecords.length === 0) {
      showNotification('No pending records to upload', 'info');
      return;
    }

    try {
      setUploading(true);
      setUploadProgress({
        current: 0,
        total: pendingRecords.length,
        percentage: 0,
        currentRecord: null
      });

      const results = await uploadRecordsBatch(
        pendingRecords,
        user,
        (progress) => {
          setUploadProgress({
            current: progress.completed,
            total: progress.total,
            percentage: progress.percentage,
            currentRecord: progress.current
          });
        }
      );

      // Update records status
      results.successful.forEach(result => {
        markRecordUploaded({ localId: result.recordId });
      });

      // Update local records state
      setRecords(prev => prev.map(record => {
        const successful = results.successful.find(r => r.recordId === record.localId);
        if (successful) {
          return { ...record, synced: true, uploadStatus: 'uploaded' };
        }
        return record;
      }));

      // Refresh MongoDB records after successful upload
      if (results.successful.length > 0) {
        await loadMongoRecords(user, true);
      }

      // Show results
      const successCount = results.successful.length;
      const failCount = results.failed.length;

      if (successCount > 0 && failCount === 0) {
        showNotification(`Successfully uploaded ${successCount} records`, 'success');
      } else if (successCount > 0 && failCount > 0) {
        showNotification(`Uploaded ${successCount} records, ${failCount} failed`, 'warning');
      } else {
        showNotification(`Upload failed for all ${failCount} records`, 'error');
      }

    } catch (error) {
      console.error('Upload error:', error);
      showNotification(`Upload failed: ${error.message}`, 'error');
    } finally {
      setUploading(false);
      setUploadProgress({
        current: 0,
        total: 0,
        percentage: 0,
        currentRecord: null
      });
    }
  };

  const getPendingRecordsCount = () => {
    return records.filter(record => 
      !record.synced && record.uploadStatus !== 'uploaded'
    ).length;
  };

  const getSyncStatusText = (record) => {
    if (record.synced) {
      return 'Synced';
    } else if (state.isOnline) {
      return 'Pending Sync';
    } else {
      return 'Offline';
    }
  };

  const getSyncStatusColor = (record) => {
    if (record.synced) {
      return 'success';
    } else if (state.isOnline) {
      return 'warning';
    } else {
      return 'error';
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'No date';
    
    const date = new Date(dateString);
    
    // Check if date is valid
    if (isNaN(date.getTime())) {
      return 'Invalid date';
    }
    
    try {
      return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { 
        hour: '2-digit', 
        minute: '2-digit' 
      });
    } catch (error) {
      console.error('Date formatting error:', error);
      return 'Invalid date';
    }
  };

  const getAgeGroup = (age) => {
    const ageNum = parseFloat(age);
    if (ageNum < 2) return 'Infant';
    if (ageNum < 5) return 'Toddler';
    if (ageNum < 13) return 'Child';
    return 'Teen';
  };

  const handleExport = () => {
    try {
      const dataToExport = filteredRecords.map(record => ({
        healthId: record.healthId,
        childName: record.childName,
        age: record.age,
        weight: record.weight,
        height: record.height,
        guardianName: record.guardianName,
        malnutritionSigns: record.malnutritionSigns?.join(', ') || '',
        recentIllnesses: record.recentIllnesses || '',
        timestamp: record.timestamp,
        synced: record.synced
      }));

      const csvContent = convertToCSV(dataToExport);
      downloadCSV(csvContent, `child_health_records_${new Date().toISOString().split('T')[0]}.csv`);
      
      showNotification('Records exported successfully', 'success');
    } catch (error) {
      console.error('Export failed:', error);
      showNotification('Failed to export records', 'error');
    }
  };

  const convertToCSV = (data) => {
    if (data.length === 0) return '';
    
    const headers = Object.keys(data[0]);
    const csvHeaders = headers.join(',');
    
    const csvRows = data.map(row => 
      headers.map(header => {
        const value = row[header];
        // Escape commas and quotes in CSV
        return typeof value === 'string' && (value.includes(',') || value.includes('"'))
          ? `"${value.replace(/"/g, '""')}"`
          : value;
      }).join(',')
    );

    return [csvHeaders, ...csvRows].join('\n');
  };

  const downloadCSV = (content, filename) => {
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', filename);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  return (
    <Box sx={{ pb: 10 }}>
      {/* Header with Search and Filters */}
      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Box>
              <Typography variant="h6">
                Records ({filteredRecords.length})
              </Typography>
              {isAuthenticated && (
                <Box sx={{ display: 'flex', gap: 2, mt: 0.5 }}>
                  <Chip 
                    label={`Offline: ${records.length}`} 
                    size="small" 
                    color="default"
                    icon={<OfflineIcon />}
                  />
                  <Chip 
                    label={`MongoDB: ${state.mongoRecords.length}`} 
                    size="small" 
                    color="primary"
                    icon={<SyncedIcon />}
                  />
                </Box>
              )}
            </Box>
            
            <Box sx={{ display: 'flex', gap: 1 }}>
              {/* Upload All Button */}
              {getPendingRecordsCount() > 0 && (
                <Button
                  variant="contained"
                  startIcon={state.isUploading ? <CircularProgress size={16} color="inherit" /> : <UploadIcon />}
                  onClick={handleUploadAll}
                  disabled={state.isUploading || !state.isOnline || !isAuthenticated}
                  size="small"
                >
                  {state.isUploading 
                    ? `Uploading... (${state.uploadProgress.current}/${state.uploadProgress.total})`
                    : `Upload All (${getPendingRecordsCount()})`
                  }
                </Button>
              )}
              
              <IconButton
                onClick={(e) => setFilterAnchorEl(e.currentTarget)}
                title="Filter Records"
              >
                <FilterIcon />
              </IconButton>
              
              <IconButton
                onClick={(e) => setMoreAnchorEl(e.currentTarget)}
                title="More Options"
              >
                <MoreIcon />
              </IconButton>
            </Box>
          </Box>

          <TextField
            fullWidth
            placeholder="Search by child name, guardian, or Health ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
          />

          {/* Active Filters Display */}
          {(filters.syncStatus !== 'all' || filters.dateRange !== 'all' || filters.ageGroup !== 'all') && (
            <Box sx={{ display: 'flex', gap: 1, mt: 2, flexWrap: 'wrap' }}>
              {filters.syncStatus !== 'all' && (
                <Chip
                  label={`Sync: ${filters.syncStatus}`}
                  onDelete={() => setFilters(prev => ({ ...prev, syncStatus: 'all' }))}
                  size="small"
                />
              )}
              {filters.dateRange !== 'all' && (
                <Chip
                  label={`Date: ${filters.dateRange}`}
                  onDelete={() => setFilters(prev => ({ ...prev, dateRange: 'all' }))}
                  size="small"
                />
              )}
              {filters.ageGroup !== 'all' && (
                <Chip
                  label={`Age: ${filters.ageGroup}`}
                  onDelete={() => setFilters(prev => ({ ...prev, ageGroup: 'all' }))}
                  size="small"
                />
              )}
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Records List */}
      {filteredRecords.length === 0 ? (
        <Card>
          <CardContent sx={{ textAlign: 'center', py: 6 }}>
            <PersonIcon sx={{ fontSize: 64, color: 'grey.300', mb: 2 }} />
            <Typography variant="h6" color="text.secondary" gutterBottom>
              No Records Found
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              {searchTerm || Object.values(filters).some(f => f !== 'all')
                ? 'No records match your search criteria.'
                : 'Start by adding your first child health record.'
              }
            </Typography>
            <Button
              variant="contained"
              onClick={() => navigate('/form')}
              startIcon={<AddIcon />}
            >
              Add First Record
            </Button>
          </CardContent>
        </Card>
      ) : (
        <List sx={{ p: 0 }}>
          {filteredRecords.map((record) => (
            <Card key={record.id} sx={{ mb: 1 }}>
              <ListItem alignItems="flex-start">
                <ListItemAvatar>
                  {(record.photo || record.facePhoto) ? (
                    <Avatar
                      src={record.photo || record.facePhoto}
                      alt={record.childName}
                      sx={{ width: 56, height: 56 }}
                    />
                  ) : (
                    <Avatar sx={{ width: 56, height: 56, bgcolor: 'primary.main' }}>
                      <PersonIcon />
                    </Avatar>
                  )}
                </ListItemAvatar>
                
                <ListItemText
                  primary={
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <Typography variant="h6" component="div">
                        {record.childName}
                      </Typography>
                      <Chip
                        icon={getSyncStatusIcon(record)}
                        label={getSyncStatusText(record)}
                        size="small"
                        color={getSyncStatusColor(record)}
                        variant="outlined"
                      />
                    </Box>
                  }
                  secondary={
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        Health ID: {record.healthId} • Age: {record.age} years ({getAgeGroup(record.age)})
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Guardian: {record.guardianName}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Weight: {record.weight} kg • Height: {record.height} cm
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Recorded: {formatDate(record.timestamp)}
                      </Typography>
                    </Box>
                  }
                />
                
                <ListItemSecondaryAction>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                    <IconButton
                      edge="end"
                      onClick={() => handleViewRecord(record)}
                      title="View Details"
                      size="small"
                    >
                      <ViewIcon />
                    </IconButton>
                    <IconButton
                      edge="end"
                      onClick={() => handleDeleteClick(record)}
                      title="Delete Record"
                      size="small"
                      color="error"
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Box>
                </ListItemSecondaryAction>
              </ListItem>
            </Card>
          ))}
        </List>
      )}

      {/* Floating Action Button */}
      <Fab
        color="primary"
        aria-label="add record"
        sx={{ position: 'fixed', bottom: 80, right: 16 }}
        onClick={() => navigate('/form')}
      >
        <AddIcon />
      </Fab>

      {/* Filter Menu */}
      <Menu
        anchorEl={filterAnchorEl}
        open={Boolean(filterAnchorEl)}
        onClose={() => setFilterAnchorEl(null)}
        PaperProps={{ sx: { width: 250, p: 2 } }}
      >
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <FormControl fullWidth size="small">
              <InputLabel>Sync Status</InputLabel>
              <Select
                value={filters.syncStatus}
                onChange={(e) => setFilters(prev => ({ ...prev, syncStatus: e.target.value }))}
                label="Sync Status"
              >
                <MenuItem value="all">All Records</MenuItem>
                <MenuItem value="synced">Synced</MenuItem>
                <MenuItem value="pending">Pending Sync</MenuItem>
                <MenuItem value="offline">Offline Only</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12}>
            <FormControl fullWidth size="small">
              <InputLabel>Date Range</InputLabel>
              <Select
                value={filters.dateRange}
                onChange={(e) => setFilters(prev => ({ ...prev, dateRange: e.target.value }))}
                label="Date Range"
              >
                <MenuItem value="all">All Time</MenuItem>
                <MenuItem value="today">Today</MenuItem>
                <MenuItem value="week">This Week</MenuItem>
                <MenuItem value="month">This Month</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12}>
            <FormControl fullWidth size="small">
              <InputLabel>Age Group</InputLabel>
              <Select
                value={filters.ageGroup}
                onChange={(e) => setFilters(prev => ({ ...prev, ageGroup: e.target.value }))}
                label="Age Group"
              >
                <MenuItem value="all">All Ages</MenuItem>
                <MenuItem value="infant">Infant (0-2 years)</MenuItem>
                <MenuItem value="toddler">Toddler (2-5 years)</MenuItem>
                <MenuItem value="child">Child (5-13 years)</MenuItem>
                <MenuItem value="teen">Teen (13+ years)</MenuItem>
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </Menu>

      {/* More Options Menu */}
      <Menu
        anchorEl={moreAnchorEl}
        open={Boolean(moreAnchorEl)}
        onClose={() => setMoreAnchorEl(null)}
      >
        <MenuItem onClick={() => { handleExport(); setMoreAnchorEl(null); }}>
          <ExportIcon sx={{ mr: 1 }} />
          Export to CSV
        </MenuItem>
      </Menu>

      {/* View Record Dialog */}
      <Dialog
        open={isViewDialogOpen}
        onClose={() => setIsViewDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        {selectedRecord && (
          <>
            <DialogTitle>
              Record Details - {selectedRecord.childName}
            </DialogTitle>
            <DialogContent>
              <Grid container spacing={2}>
                {/* Photo Display */}
                {(selectedRecord.photo || selectedRecord.facePhoto) && (
                  <Grid item xs={12} sx={{ textAlign: 'center', mb: 2 }}>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Child Photo
                    </Typography>
                    <Avatar
                      src={selectedRecord.photo || selectedRecord.facePhoto}
                      alt={selectedRecord.childName}
                      sx={{ 
                        width: 120, 
                        height: 120, 
                        mx: 'auto',
                        border: '2px solid',
                        borderColor: 'primary.main'
                      }}
                    />
                  </Grid>
                )}
                
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">Health ID</Typography>
                  <Typography variant="body1">{selectedRecord.healthId}</Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">Age</Typography>
                  <Typography variant="body1">{selectedRecord.age} years</Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">Gender</Typography>
                  <Typography variant="body1">{selectedRecord.gender || 'Not specified'}</Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">Weight</Typography>
                  <Typography variant="body1">{selectedRecord.weight} kg</Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">Height</Typography>
                  <Typography variant="body1">{selectedRecord.height} cm</Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">Guardian</Typography>
                  <Typography variant="body1">{selectedRecord.guardianName}</Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">Phone</Typography>
                  <Typography variant="body1">{selectedRecord.phone || 'Not provided'}</Typography>
                </Grid>
                
                {selectedRecord.malnutritionSigns && (
                  <Grid item xs={12}>
                    <Typography variant="body2" color="text.secondary">Malnutrition Signs</Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 0.5 }}>
                      {(Array.isArray(selectedRecord.malnutritionSigns) 
                        ? selectedRecord.malnutritionSigns 
                        : selectedRecord.malnutritionSigns 
                          ? [selectedRecord.malnutritionSigns] 
                          : []
                      ).map((sign, index) => (
                        <Chip key={index} label={sign} size="small" variant="outlined" />
                      ))}
                      {(!selectedRecord.malnutritionSigns || 
                        (Array.isArray(selectedRecord.malnutritionSigns) && selectedRecord.malnutritionSigns.length === 0)) && (
                        <Typography variant="body2" color="textSecondary">
                          No malnutrition signs recorded
                        </Typography>
                      )}
                    </Box>
                  </Grid>
                )}
                
                {selectedRecord.recentIllnesses && (
                  <Grid item xs={12}>
                    <Typography variant="body2" color="text.secondary">Recent Illnesses</Typography>
                    <Typography variant="body1">{selectedRecord.recentIllnesses}</Typography>
                  </Grid>
                )}
                
                <Grid item xs={12}>
                  <Typography variant="body2" color="text.secondary">Recorded</Typography>
                  <Typography variant="body1">{formatDate(selectedRecord.timestamp)}</Typography>
                </Grid>
                
                <Grid item xs={12}>
                  <Typography variant="body2" color="text.secondary">Sync Status</Typography>
                  <Chip
                    icon={getSyncStatusIcon(selectedRecord)}
                    label={getSyncStatusText(selectedRecord)}
                    size="small"
                    color={getSyncStatusColor(selectedRecord)}
                  />
                </Grid>
              </Grid>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setIsViewDialogOpen(false)}>
                Close
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
      >
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <Alert severity="warning" sx={{ mb: 2 }}>
            This action cannot be undone.
          </Alert>
          <Typography>
            Are you sure you want to delete the record for{' '}
            <strong>{recordToDelete?.childName}</strong>?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsDeleteDialogOpen(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleDeleteConfirm}
            color="error"
            variant="contained"
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default RecordsList;
