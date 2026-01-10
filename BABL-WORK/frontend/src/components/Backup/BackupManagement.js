import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  CircularProgress,
  Chip,
  IconButton,
  Tooltip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import {
  Backup,
  Restore,
  Delete,
  Refresh,
  Download,
} from '@mui/icons-material';
import { backupAPI } from '../../services/api';

function BackupManagement() {
  const [backups, setBackups] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [restoreDialogOpen, setRestoreDialogOpen] = useState(false);
  const [selectedBackup, setSelectedBackup] = useState(null);
  const [backupName, setBackupName] = useState('');
  const [backupType, setBackupType] = useState('manual');

  useEffect(() => {
    fetchBackups();
  }, []);

  const fetchBackups = async () => {
    setLoading(true);
    try {
      const response = await backupAPI.listBackups(50);
      setBackups(response.data.backups || []);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to fetch backups');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateBackup = async () => {
    try {
      setError(null);
      await backupAPI.createBackup(backupName || null, backupType);
      setSuccess('Backup created successfully');
      setCreateDialogOpen(false);
      setBackupName('');
      fetchBackups();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to create backup');
    }
  };

  const handleRestoreBackup = async () => {
    if (!selectedBackup) return;
    
    if (!window.confirm(`Are you sure you want to restore from backup "${selectedBackup.backup_name}"? This will replace the current database. This action cannot be undone.`)) {
      return;
    }
    
    try {
      setError(null);
      await backupAPI.restoreBackup(selectedBackup.id);
      setSuccess('Database restored successfully. Please restart the application.');
      setRestoreDialogOpen(false);
      setSelectedBackup(null);
      setTimeout(() => setSuccess(null), 5000);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to restore backup');
    }
  };

  const handleDeleteBackup = async (backupId) => {
    if (!window.confirm('Are you sure you want to delete this backup?')) {
      return;
    }
    
    try {
      setError(null);
      await backupAPI.deleteBackup(backupId);
      setSuccess('Backup deleted successfully');
      fetchBackups();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to delete backup');
    }
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return 'N/A';
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(2)} MB`;
  };

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" gutterBottom>
          Backup & Restore
        </Typography>
        <Button
          variant="contained"
          startIcon={<Backup />}
          onClick={() => setCreateDialogOpen(true)}
        >
          Create Backup
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess(null)}>
          {success}
        </Alert>
      )}

      <Card>
        <CardContent>
          <Box display="flex" justifyContent="space-between" mb={2}>
            <Typography variant="h6">Backup History</Typography>
            <Button
              variant="outlined"
              size="small"
              startIcon={<Refresh />}
              onClick={fetchBackups}
            >
              Refresh
            </Button>
          </Box>

          {loading ? (
            <CircularProgress />
          ) : (
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Backup Name</TableCell>
                    <TableCell>Type</TableCell>
                    <TableCell>Size</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Created At</TableCell>
                    <TableCell>Restored At</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {backups.map((backup) => (
                    <TableRow key={backup.id}>
                      <TableCell>{backup.backup_name}</TableCell>
                      <TableCell>{backup.backup_type}</TableCell>
                      <TableCell>{formatFileSize(backup.file_size)}</TableCell>
                      <TableCell>
                        <Chip
                          label={backup.status}
                          color={backup.status === 'completed' ? 'success' : 'default'}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        {backup.created_at
                          ? new Date(backup.created_at).toLocaleString()
                          : '-'}
                      </TableCell>
                      <TableCell>
                        {backup.restored_at
                          ? new Date(backup.restored_at).toLocaleString()
                          : '-'}
                      </TableCell>
                      <TableCell>
                        <Tooltip title="Restore">
                          <IconButton
                            size="small"
                            color="primary"
                            onClick={() => {
                              setSelectedBackup(backup);
                              setRestoreDialogOpen(true);
                            }}
                          >
                            <Restore />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete">
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => handleDeleteBackup(backup.id)}
                          >
                            <Delete />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>

      {/* Create Backup Dialog */}
      <Dialog
        open={createDialogOpen}
        onClose={() => setCreateDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Create Backup</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <TextField
              fullWidth
              label="Backup Name (Optional)"
              value={backupName}
              onChange={(e) => setBackupName(e.target.value)}
              placeholder="Leave empty for auto-generated name"
              sx={{ mb: 2 }}
            />
            <FormControl fullWidth>
              <InputLabel>Backup Type</InputLabel>
              <Select
                value={backupType}
                label="Backup Type"
                onChange={(e) => setBackupType(e.target.value)}
              >
                <MenuItem value="manual">Manual</MenuItem>
                <MenuItem value="full">Full</MenuItem>
                <MenuItem value="incremental">Incremental</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleCreateBackup}>
            Create Backup
          </Button>
        </DialogActions>
      </Dialog>

      {/* Restore Backup Dialog */}
      <Dialog
        open={restoreDialogOpen}
        onClose={() => {
          setRestoreDialogOpen(false);
          setSelectedBackup(null);
        }}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Restore Backup</DialogTitle>
        <DialogContent>
          {selectedBackup && (
            <Box sx={{ mt: 2 }}>
              <Alert severity="warning" sx={{ mb: 2 }}>
                This will replace the current database with the backup. This action cannot be undone.
              </Alert>
              <Typography variant="body1">
                <strong>Backup:</strong> {selectedBackup.backup_name}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Created: {selectedBackup.created_at ? new Date(selectedBackup.created_at).toLocaleString() : '-'}
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => {
            setRestoreDialogOpen(false);
            setSelectedBackup(null);
          }}>
            Cancel
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={handleRestoreBackup}
          >
            Restore
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default BackupManagement;

