import React, { useState, useMemo } from 'react';
import {
  Box,
  TextField,
  InputAdornment,
  IconButton,
  Chip,
  Popover,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Grid,
  Typography,
  Divider,
  Paper,
  Autocomplete,
} from '@mui/material';
import {
  Search,
  Clear,
  FilterList,
  FilterListOff,
  Save,
  Delete,
} from '@mui/icons-material';

/**
 * Enhanced Search & Filter Component
 * 
 * @param {Object} props
 * @param {Array} props.data - Data array to filter
 * @param {Function} props.onFilterChange - Callback when filters change, receives filtered data
 * @param {Array} props.searchFields - Array of field names to search in
 * @param {Array} props.filterFields - Array of filter field configs: [{name: 'field', label: 'Label', options: []}]
 * @param {String} props.placeholder - Search placeholder text
 * @param {Boolean} props.showSavedFilters - Show saved filter presets
 */
const EnhancedSearchFilter = ({
  data = [],
  onFilterChange,
  searchFields = [],
  filterFields = [],
  placeholder = 'Search...',
  showSavedFilters = true,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({});
  const [filterAnchorEl, setFilterAnchorEl] = useState(null);
  const [savedFilters, setSavedFilters] = useState(() => {
    const saved = localStorage.getItem('savedFilters');
    return saved ? JSON.parse(saved) : [];
  });
  const [filterName, setFilterName] = useState('');

  // Filter data based on search and filters
  const filteredData = useMemo(() => {
    let result = [...data];

    // Apply search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      result = result.filter((item) => {
        return searchFields.some((field) => {
          const value = item[field];
          return value && String(value).toLowerCase().includes(query);
        });
      });
    }

    // Apply field filters
    Object.entries(filters).forEach(([field, value]) => {
      if (value && value !== 'all') {
        result = result.filter((item) => {
          const itemValue = item[field];
          if (Array.isArray(value)) {
            return value.includes(itemValue);
          }
          return String(itemValue).toLowerCase() === String(value).toLowerCase();
        });
      }
    });

    return result;
  }, [data, searchQuery, filters, searchFields]);

  // Get unique values for filter options
  const getFilterOptions = (fieldName) => {
    const uniqueValues = new Set();
    data.forEach((item) => {
      const value = item[fieldName];
      if (value) {
        uniqueValues.add(value);
      }
    });
    return Array.from(uniqueValues).sort();
  };

  // Update filters and notify parent
  const handleFilterChange = (field, value) => {
    const newFilters = { ...filters, [field]: value };
    setFilters(newFilters);
    onFilterChange(filteredData);
  };

  // Clear all filters
  const handleClearFilters = () => {
    setFilters({});
    setSearchQuery('');
    onFilterChange(data);
  };

  // Save current filter as preset
  const handleSaveFilter = () => {
    if (!filterName.trim()) return;
    
    const newFilter = {
      id: Date.now(),
      name: filterName,
      searchQuery,
      filters: { ...filters },
    };
    
    const updated = [...savedFilters, newFilter];
    setSavedFilters(updated);
    localStorage.setItem('savedFilters', JSON.stringify(updated));
    setFilterName('');
  };

  // Load saved filter
  const handleLoadFilter = (savedFilter) => {
    setSearchQuery(savedFilter.searchQuery || '');
    setFilters(savedFilter.filters || {});
    setFilterAnchorEl(null);
  };

  // Delete saved filter
  const handleDeleteFilter = (filterId, e) => {
    e.stopPropagation();
    const updated = savedFilters.filter((f) => f.id !== filterId);
    setSavedFilters(updated);
    localStorage.setItem('savedFilters', JSON.stringify(updated));
  };

  // Notify parent when filtered data changes
  React.useEffect(() => {
    onFilterChange(filteredData);
  }, [filteredData, onFilterChange]);

  const hasActiveFilters = searchQuery || Object.values(filters).some((v) => v && v !== 'all');

  return (
    <Box>
      <Box display="flex" gap={2} alignItems="center" flexWrap="wrap" mb={2}>
        {/* Search Input */}
        <TextField
          fullWidth
          size="small"
          placeholder={placeholder}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search color="action" />
              </InputAdornment>
            ),
            endAdornment: searchQuery && (
              <InputAdornment position="end">
                <IconButton
                  size="small"
                  onClick={() => setSearchQuery('')}
                  edge="end"
                >
                  <Clear fontSize="small" />
                </IconButton>
              </InputAdornment>
            ),
          }}
          sx={{ flexGrow: 1, minWidth: 200 }}
        />

        {/* Filter Button */}
        {filterFields.length > 0 && (
          <>
            <Button
              variant={hasActiveFilters ? 'contained' : 'outlined'}
              startIcon={hasActiveFilters ? <FilterList /> : <FilterListOff />}
              onClick={(e) => setFilterAnchorEl(e.currentTarget)}
              size="small"
            >
              Filters {hasActiveFilters && `(${Object.keys(filters).filter(k => filters[k] && filters[k] !== 'all').length})`}
            </Button>

            <Popover
              open={Boolean(filterAnchorEl)}
              anchorEl={filterAnchorEl}
              onClose={() => setFilterAnchorEl(null)}
              anchorOrigin={{
                vertical: 'bottom',
                horizontal: 'left',
              }}
              transformOrigin={{
                vertical: 'top',
                horizontal: 'left',
              }}
            >
              <Paper sx={{ p: 2, minWidth: 300, maxWidth: 400 }}>
                <Typography variant="h6" gutterBottom>
                  Filters
                </Typography>
                <Divider sx={{ mb: 2 }} />

                {/* Filter Fields */}
                <Grid container spacing={2} sx={{ mb: 2 }}>
                  {filterFields.map((field) => (
                    <Grid item xs={12} key={field.name}>
                      <FormControl fullWidth size="small">
                        <InputLabel>{field.label || field.name}</InputLabel>
                        <Select
                          value={filters[field.name] || 'all'}
                          label={field.label || field.name}
                          onChange={(e) => handleFilterChange(field.name, e.target.value)}
                        >
                          <MenuItem value="all">All</MenuItem>
                          {(field.options || getFilterOptions(field.name)).map((option) => (
                            <MenuItem key={option} value={option}>
                              {option}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Grid>
                  ))}
                </Grid>

                {/* Save Filter Preset */}
                {showSavedFilters && (
                  <>
                    <Divider sx={{ my: 2 }} />
                    <Typography variant="subtitle2" gutterBottom>
                      Save Filter Preset
                    </Typography>
                    <Box display="flex" gap={1} mb={2}>
                      <TextField
                        size="small"
                        placeholder="Filter name"
                        value={filterName}
                        onChange={(e) => setFilterName(e.target.value)}
                        fullWidth
                      />
                      <Button
                        variant="outlined"
                        size="small"
                        startIcon={<Save />}
                        onClick={handleSaveFilter}
                        disabled={!filterName.trim()}
                      >
                        Save
                      </Button>
                    </Box>

                    {/* Saved Filters */}
                    {savedFilters.length > 0 && (
                      <>
                        <Typography variant="subtitle2" gutterBottom>
                          Saved Filters
                        </Typography>
                        <Box display="flex" flexDirection="column" gap={1}>
                          {savedFilters.map((saved) => (
                            <Chip
                              key={saved.id}
                              label={saved.name}
                              onClick={() => handleLoadFilter(saved)}
                              onDelete={(e) => handleDeleteFilter(saved.id, e)}
                              color="primary"
                              variant="outlined"
                              size="small"
                            />
                          ))}
                        </Box>
                      </>
                    )}
                  </>
                )}

                <Divider sx={{ my: 2 }} />
                <Button
                  fullWidth
                  variant="outlined"
                  onClick={handleClearFilters}
                  disabled={!hasActiveFilters}
                >
                  Clear All Filters
                </Button>
              </Paper>
            </Popover>
          </>
        )}

        {/* Active Filter Chips */}
        {hasActiveFilters && (
          <Box display="flex" gap={1} flexWrap="wrap" alignItems="center">
            {searchQuery && (
              <Chip
                label={`Search: "${searchQuery}"`}
                onDelete={() => setSearchQuery('')}
                size="small"
                color="primary"
              />
            )}
            {Object.entries(filters).map(([field, value]) => {
              if (!value || value === 'all') return null;
              const fieldConfig = filterFields.find((f) => f.name === field);
              return (
                <Chip
                  key={field}
                  label={`${fieldConfig?.label || field}: ${value}`}
                  onDelete={() => handleFilterChange(field, 'all')}
                  size="small"
                  color="secondary"
                />
              );
            })}
          </Box>
        )}
      </Box>

      {/* Results Count */}
      {filteredData.length !== data.length && (
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
          Showing {filteredData.length} of {data.length} results
        </Typography>
      )}
    </Box>
  );
};

export default EnhancedSearchFilter;

