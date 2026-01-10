import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Card,
  CardContent,
  Typography,
  List,
  ListItem,
  ListItemText,
  ListItemButton,
  IconButton,
  Chip,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Divider,
  CircularProgress,
  Alert,
} from '@mui/material';
import {
  CheckCircle,
  Info,
  Warning,
  Error as ErrorIcon,
  Delete,
  MarkEmailRead,
  FilterList,
} from '@mui/icons-material';
import { useNotifications } from '../../contexts/NotificationContext';
import { formatDistanceToNow } from 'date-fns';

const getNotificationIcon = (type) => {
  switch (type) {
    case 'success':
      return <CheckCircle color="success" fontSize="small" />;
    case 'warning':
      return <Warning color="warning" fontSize="small" />;
    case 'error':
      return <ErrorIcon color="error" fontSize="small" />;
    default:
      return <Info color="info" fontSize="small" />;
  }
};

function NotificationCenter() {
  const navigate = useNavigate();
  const [filter, setFilter] = useState('all'); // 'all', 'unread', 'read'
  const [categoryFilter, setCategoryFilter] = useState('all');
  const {
    notifications,
    unreadCount,
    loading,
    error,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
  } = useNotifications();

  useEffect(() => {
    fetchNotifications(false, categoryFilter === 'all' ? null : categoryFilter);
  }, [categoryFilter, fetchNotifications]);

  const handleNotificationClick = async (notification) => {
    if (!notification.is_read) {
      await markAsRead(notification.id);
    }
    if (notification.action_url) {
      navigate(notification.action_url);
    }
  };

  const filteredNotifications = notifications.filter(n => {
    if (filter === 'unread' && n.is_read) return false;
    if (filter === 'read' && !n.is_read) return false;
    if (categoryFilter !== 'all' && n.category !== categoryFilter) return false;
    return true;
  });

  const categories = [...new Set(notifications.map(n => n.category).filter(Boolean))];

  if (loading && notifications.length === 0) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" gutterBottom>
          Notifications
          {unreadCount > 0 && (
            <Chip
              label={`${unreadCount} unread`}
              color="error"
              size="small"
              sx={{ ml: 2 }}
            />
          )}
        </Typography>
        {unreadCount > 0 && (
          <Button
            variant="outlined"
            startIcon={<MarkEmailRead />}
            onClick={markAllAsRead}
          >
            Mark All as Read
          </Button>
        )}
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Card>
        <CardContent>
          <Box display="flex" gap={2} mb={3} flexWrap="wrap">
            <FormControl size="small" sx={{ minWidth: 150 }}>
              <InputLabel>Status</InputLabel>
              <Select
                value={filter}
                label="Status"
                onChange={(e) => setFilter(e.target.value)}
              >
                <MenuItem value="all">All</MenuItem>
                <MenuItem value="unread">Unread</MenuItem>
                <MenuItem value="read">Read</MenuItem>
              </Select>
            </FormControl>
            <FormControl size="small" sx={{ minWidth: 150 }}>
              <InputLabel>Category</InputLabel>
              <Select
                value={categoryFilter}
                label="Category"
                onChange={(e) => setCategoryFilter(e.target.value)}
              >
                <MenuItem value="all">All Categories</MenuItem>
                {categories.map(cat => (
                  <MenuItem key={cat} value={cat}>{cat}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>

          {filteredNotifications.length === 0 ? (
            <Box p={4} textAlign="center">
              <Typography variant="body1" color="text.secondary">
                No notifications found
              </Typography>
            </Box>
          ) : (
            <List>
              {filteredNotifications.map((notification, index) => (
                <React.Fragment key={notification.id}>
                  <ListItem
                    disablePadding
                    sx={{
                      bgcolor: notification.is_read ? 'inherit' : 'action.hover',
                      borderLeft: notification.is_read ? 'none' : '3px solid',
                      borderColor: notification.is_read ? 'transparent' : 'primary.main',
                    }}
                  >
                    <ListItemButton
                      onClick={() => handleNotificationClick(notification)}
                    >
                      <Box sx={{ mr: 2 }}>
                        {getNotificationIcon(notification.type)}
                      </Box>
                      <ListItemText
                        primary={
                          <Box display="flex" alignItems="center" gap={1} flexWrap="wrap">
                            <Typography variant="subtitle1">
                              {notification.title}
                            </Typography>
                            {notification.category && (
                              <Chip
                                label={notification.category}
                                size="small"
                                variant="outlined"
                              />
                            )}
                            {!notification.is_read && (
                              <Chip
                                label="New"
                                size="small"
                                color="error"
                              />
                            )}
                          </Box>
                        }
                        secondary={
                          <>
                            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                              {notification.message}
                            </Typography>
                            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                              {notification.created_at
                                ? formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })
                                : ''}
                            </Typography>
                            {notification.action_label && (
                              <Button
                                size="small"
                                variant="outlined"
                                sx={{ mt: 1 }}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleNotificationClick(notification);
                                }}
                              >
                                {notification.action_label}
                              </Button>
                            )}
                          </>
                        }
                      />
                      <Box>
                        {!notification.is_read && (
                          <IconButton
                            size="small"
                            onClick={async (e) => {
                              e.stopPropagation();
                              await markAsRead(notification.id);
                            }}
                            title="Mark as read"
                          >
                            <MarkEmailRead fontSize="small" />
                          </IconButton>
                        )}
                        <IconButton
                          size="small"
                          edge="end"
                          onClick={async (e) => {
                            e.stopPropagation();
                            await deleteNotification(notification.id);
                          }}
                          title="Delete"
                        >
                          <Delete fontSize="small" />
                        </IconButton>
                      </Box>
                    </ListItemButton>
                  </ListItem>
                  {index < filteredNotifications.length - 1 && <Divider />}
                </React.Fragment>
              ))}
            </List>
          )}
        </CardContent>
      </Card>
    </Box>
  );
}

export default NotificationCenter;

