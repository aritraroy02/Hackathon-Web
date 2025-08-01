import React, { useEffect, useState } from 'react';
import { useApp } from '../../contexts/AppContext';
import {
  Typography,
  Card,
  CardContent,
  CircularProgress,
  Box,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
} from '@mui/material';
import {
  CloudUpload as CloudUploadIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import { dbService } from '../../services/dbService';

/**
 * Records page component to list and manage child health records
 * @returns {JSX.Element} Records component
 */
function Records() {
  const { pendingRecords, syncedRecords, actions } = useApp();
  const [loading, setLoading] = useState(false);

  const handleDeleteRecord = async (id) => {
    if (window.confirm('Are you sure you want to delete this record?')) {
      try {
        setLoading(true);
        await dbService.deletePendingRecord(id);
        await actions.loadInitialData();
      } catch (error) {
        console.error('Failed to delete record:', error);
      } finally {
        setLoading(false);
      }
    }
  };

  const handleSync = async () => {
    try {
      setLoading(true);
      await actions.syncPendingRecords();
    } catch (error) {
      console.error('Sync failed:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container">
      <Typography variant="h4" gutterBottom>
        Manage Child Health Records
      </Typography>

      {/* Pending Records Table */}
      <Card sx={{ mb: 4 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Pending Records
          </Typography>
          {loading ? (
            <Box className="loading-spinner">
              <CircularProgress />
            </Box>
          ) : pendingRecords.length ? (
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>ID</TableCell>
                    <TableCell>Child Name</TableCell>
                    <TableCell>Age</TableCell>
                    <TableCell>Guardian Name</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {pendingRecords.map((record) => (
                    <TableRow key={record.id}>
                      <TableCell>{record.healthId}</TableCell>
                      <TableCell>{record.childName}</TableCell>
                      <TableCell>{record.age}</TableCell>
                      <TableCell>{record.guardianName}</TableCell>
                      <TableCell>
                        <IconButton
                          color="primary"
                          onClick={handleSync}
                          disabled={loading}
                        >
                          <CloudUploadIcon />
                        </IconButton>
                        <IconButton
                          color="secondary"
                          onClick={() => handleDeleteRecord(record.id)}
                          disabled={loading}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          ) : (
            <Typography>No pending records to show.</Typography>
          )}
        </CardContent>
      </Card>

      {/* Synced Records Table */}
      <Card sx={{ mb: 4 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Synced Records
          </Typography>
          {syncedRecords.length ? (
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>ID</TableCell>
                    <TableCell>Child Name</TableCell>
                    <TableCell>Age</TableCell>
                    <TableCell>Guardian Name</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {syncedRecords.map((record) => (
                    <TableRow key={record.id}>
                      <TableCell>{record.healthId}</TableCell>
                      <TableCell>{record.childName}</TableCell>
                      <TableCell>{record.age}</TableCell>
                      <TableCell>{record.guardianName}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          ) : (
            <Typography>No synced records to show.</Typography>
          )}
        </CardContent>
      </Card>

      {/* Bulk Sync Button */}
      <Box sx={{ textAlign: 'center' }}>
        <Button
          variant="contained"
          color="primary"
          startIcon={<CloudUploadIcon />}
          onClick={handleSync}
          disabled={loading || !pendingRecords.length}
          className="mobile-touch-target"
        >
          Sync All Records
        </Button>
      </Box>
    </div>
  );
}

export default Records;

