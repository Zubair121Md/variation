import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Paper,
  TextField,
  List,
  ListItem,
  ListItemText,
  ListItemButton,
  Typography,
  Chip,
  CircularProgress,
  InputAdornment,
  IconButton,
  Divider,
} from '@mui/material';
import {
  Search,
  Clear,
  Store,
  Inventory,
  Assignment,
} from '@mui/icons-material';
import { searchAPI } from '../../services/api';

// Simple debounce implementation
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

function GlobalSearch() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const anchorRef = useRef(null);

  const debouncedSearch = useRef(
    debounce(async (query) => {
      if (!query || query.length < 2) {
        setSearchResults(null);
        setLoading(false);
        return;
      }
      
      setLoading(true);
      try {
        const response = await searchAPI.globalSearch(query, 'all', 10);
        setSearchResults(response.data);
      } catch (error) {
        console.error('Search error:', error);
        setSearchResults(null);
      } finally {
        setLoading(false);
      }
    }, 300)
  ).current;

  useEffect(() => {
    if (searchQuery) {
      debouncedSearch.current(searchQuery);
    } else {
      setSearchResults(null);
    }
  }, [searchQuery]);

  const handleResultClick = (result) => {
    if (result.type === 'invoice') {
      navigate('/analytics');
    } else if (result.type === 'master') {
      navigate('/master-data');
    } else if (result.type === 'unmatched') {
      navigate('/unmatched');
    }
    setOpen(false);
    setSearchQuery('');
  };

  const getIcon = (type) => {
    switch (type) {
      case 'invoice':
        return <Store fontSize="small" />;
      case 'master':
        return <Inventory fontSize="small" />;
      case 'unmatched':
        return <Assignment fontSize="small" />;
      default:
        return null;
    }
  };

  return (
    <Box sx={{ position: 'relative', width: '100%', maxWidth: 600 }}>
      <TextField
        fullWidth
        placeholder="Search invoices, master data, unmatched records..."
        value={searchQuery}
        onChange={(e) => {
          setSearchQuery(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <Search />
            </InputAdornment>
          ),
          endAdornment: searchQuery && (
            <InputAdornment position="end">
              <IconButton
                size="small"
                onClick={() => {
                  setSearchQuery('');
                  setSearchResults(null);
                }}
              >
                <Clear />
              </IconButton>
            </InputAdornment>
          ),
        }}
        inputRef={anchorRef}
      />
      
      {open && (searchQuery.length >= 2 || searchResults) && (
        <Paper
          sx={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            mt: 1,
            maxHeight: 400,
            overflow: 'auto',
            zIndex: 1000,
            boxShadow: 3,
          }}
        >
          {loading ? (
            <Box display="flex" justifyContent="center" p={3}>
              <CircularProgress size={24} />
            </Box>
          ) : searchResults && searchResults.total_results > 0 ? (
            <>
              <Box p={2}>
                <Typography variant="caption" color="text.secondary">
                  {searchResults.total_results} result(s) found
                </Typography>
              </Box>
              <Divider />
              
              {searchResults.results.invoices.length > 0 && (
                <>
                  <Box p={1} bgcolor="action.hover">
                    <Typography variant="subtitle2">Invoices</Typography>
                  </Box>
                  <List dense>
                    {searchResults.results.invoices.map((item) => (
                      <ListItem key={item.id} disablePadding>
                        <ListItemButton onClick={() => handleResultClick(item)}>
                          <Box sx={{ mr: 1 }}>{getIcon('invoice')}</Box>
                          <ListItemText
                            primary={item.pharmacy_name}
                            secondary={`${item.product} - $${item.amount?.toFixed(2) || 0}`}
                          />
                        </ListItemButton>
                      </ListItem>
                    ))}
                  </List>
                </>
              )}
              
              {searchResults.results.master_data.length > 0 && (
                <>
                  <Divider />
                  <Box p={1} bgcolor="action.hover">
                    <Typography variant="subtitle2">Master Data</Typography>
                  </Box>
                  <List dense>
                    {searchResults.results.master_data.map((item) => (
                      <ListItem key={item.id} disablePadding>
                        <ListItemButton onClick={() => handleResultClick(item)}>
                          <Box sx={{ mr: 1 }}>{getIcon('master')}</Box>
                          <ListItemText
                            primary={item.pharmacy_name}
                            secondary={`${item.product} - ${item.doctor || 'N/A'}`}
                          />
                        </ListItemButton>
                      </ListItem>
                    ))}
                  </List>
                </>
              )}
              
              {searchResults.results.unmatched.length > 0 && (
                <>
                  <Divider />
                  <Box p={1} bgcolor="action.hover">
                    <Typography variant="subtitle2">Unmatched Records</Typography>
                  </Box>
                  <List dense>
                    {searchResults.results.unmatched.map((item) => (
                      <ListItem key={item.id} disablePadding>
                        <ListItemButton onClick={() => handleResultClick(item)}>
                          <Box sx={{ mr: 1 }}>{getIcon('unmatched')}</Box>
                          <ListItemText
                            primary={item.pharmacy_name}
                            secondary={`${item.product || 'N/A'} - ${item.status}`}
                          />
                        </ListItemButton>
                      </ListItem>
                    ))}
                  </List>
                </>
              )}
            </>
          ) : searchQuery.length >= 2 ? (
            <Box p={3} textAlign="center">
              <Typography variant="body2" color="text.secondary">
                No results found
              </Typography>
            </Box>
          ) : null}
        </Paper>
      )}
    </Box>
  );
}

export default GlobalSearch;

