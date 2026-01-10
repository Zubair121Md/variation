import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  IconButton,
  Badge,
  Popover,
  Box,
  Typography,
  List,
  ListItem,
  ListItemText,
  ListItemButton,
  Button,
  Divider,
  Chip,
  CircularProgress,
} from '@mui/material';
import {
  Notifications as NotificationsIcon,
  CheckCircle,
  Info,
  Warning,
  Error as ErrorIcon,
  Delete,
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

function NotificationBell() {
  const navigate = useNavigate();
  const [anchorEl, setAnchorEl] = useState(null);
  const {
    notifications,
    unreadCount,
    loading,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
  } = useNotifications();

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
    fetchNotifications(false, null);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleNotificationClick = async (notification) => {
    if (!notification.is_read) {
      await markAsRead(notification.id);
    }
    if (notification.action_url) {
      navigate(notification.action_url);
      handleClose();
    }
  };

  const open = Boolean(anchorEl);
  const id = open ? 'notification-popover' : undefined;

  const unreadNotifications = notifications.filter(n => !n.is_read).slice(0, 10);
  const recentNotifications = notifications.slice(0, 10);

  return (
    <>
      <IconButton
        color="inherit"
        onClick={handleClick}
        aria-describedby={id}
      >
        <Badge badgeContent={unreadCount} color="error">
          <NotificationsIcon />
        </Badge>
      </IconButton>
      <Popover
        id={id}
        open={open}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
        PaperProps={{
          sx: { width: 400, maxHeight: 600 }
        }}
      >
        <Box sx={{ p: 2 }}>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Typography variant="h6">Notifications</Typography>
            {unreadCount > 0 && (
              <Button size="small" onClick={markAllAsRead}>
                Mark all read
              </Button>
            )}
          </Box>
          <Divider />
          {loading ? (
            <Box display="flex" justifyContent="center" p={3}>
              <CircularProgress size={24} />
            </Box>
          ) : unreadNotifications.length === 0 && recentNotifications.length === 0 ? (
            <Box p={3} textAlign="center">
              <Typography variant="body2" color="text.secondary">
                No notifications
              </Typography>
            </Box>
          ) : (
            <List sx={{ maxHeight: 400, overflow: 'auto' }}>
              {unreadNotifications.length > 0 && (
                <>
                  {unreadNotifications.map((notification) => (
                    <ListItem
                      key={notification.id}
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
                        <Box sx={{ mr: 1 }}>
                          {getNotificationIcon(notification.type)}
                        </Box>
                        <ListItemText
                          primary={
                            <Box display="flex" alignItems="center" gap={1}>
                              <Typography variant="subtitle2">
                                {notification.title}
                              </Typography>
                              {notification.category && (
                                <Chip
                                  label={notification.category}
                                  size="small"
                                  variant="outlined"
                                />
                              )}
                            </Box>
                          }
                          secondary={
                            <>
                              <Typography variant="body2" color="text.secondary">
                                {notification.message}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {notification.created_at
                                  ? formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })
                                  : ''}
                              </Typography>
                            </>
                          }
                        />
                        <IconButton
                          size="small"
                          edge="end"
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteNotification(notification.id);
                          }}
                        >
                          <Delete fontSize="small" />
                        </IconButton>
                      </ListItemButton>
                    </ListItem>
                  ))}
                  {unreadNotifications.length > 0 && recentNotifications.length > unreadNotifications.length && (
                    <Divider />
                  )}
                </>
              )}
              {recentNotifications
                .filter(n => n.is_read)
                .slice(0, 5)
                .map((notification) => (
                  <ListItem
                    key={notification.id}
                    disablePadding
                  >
                    <ListItemButton
                      onClick={() => handleNotificationClick(notification)}
                    >
                      <Box sx={{ mr: 1 }}>
                        {getNotificationIcon(notification.type)}
                      </Box>
                      <ListItemText
                        primary={notification.title}
                        secondary={
                          <>
                            <Typography variant="body2" color="text.secondary">
                              {notification.message}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {notification.created_at
                                ? formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })
                                : ''}
                            </Typography>
                          </>
                        }
                      />
                      <IconButton
                        size="small"
                        edge="end"
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteNotification(notification.id);
                        }}
                      >
                        <Delete fontSize="small" />
                      </IconButton>
                    </ListItemButton>
                  </ListItem>
                ))}
            </List>
          )}
          <Divider sx={{ mt: 1 }} />
          <Box display="flex" justifyContent="center" p={1}>
            <Button
              size="small"
              onClick={() => {
                navigate('/notifications');
                handleClose();
              }}
            >
              View All
            </Button>
          </Box>
        </Box>
      </Popover>
    </>
  );
}

export default NotificationBell;

