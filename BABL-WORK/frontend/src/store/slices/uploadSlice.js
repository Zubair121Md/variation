import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { uploadAPI } from '../../services/api';

// Async thunks
export const uploadInvoice = createAsyncThunk(
  'upload/uploadInvoice',
  async (file, { rejectWithValue }) => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      const response = await uploadAPI.uploadInvoice(formData);
      return response.data;
    } catch (error) {
      // Handle FastAPI validation errors (422)
      let errorMessage = 'Failed to upload invoice';
      if (error.response?.data?.detail) {
        const detail = error.response.data.detail;
        if (Array.isArray(detail)) {
          errorMessage = detail.map(e => typeof e === 'string' ? e : `${e.loc?.join('.') || 'field'}: ${e.msg || 'validation error'}`).join(', ');
        } else if (typeof detail === 'string') {
          errorMessage = detail;
        } else if (typeof detail === 'object') {
          errorMessage = detail.msg || detail.message || JSON.stringify(detail);
        }
      } else if (error.message) {
        errorMessage = error.message;
      }
      console.error('Upload invoice error:', error.response?.data || error);
      return rejectWithValue(errorMessage);
    }
  }
);

export const uploadMaster = createAsyncThunk(
  'upload/uploadMaster',
  async (file, { rejectWithValue }) => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      const response = await uploadAPI.uploadMaster(formData);
      return response.data;
    } catch (error) {
      // Handle FastAPI validation errors (422)
      let errorMessage = 'Failed to upload master file';
      if (error.response?.data?.detail) {
        const detail = error.response.data.detail;
        if (Array.isArray(detail)) {
          errorMessage = detail.map(e => typeof e === 'string' ? e : `${e.loc?.join('.') || 'field'}: ${e.msg || 'validation error'}`).join(', ');
        } else if (typeof detail === 'string') {
          errorMessage = detail;
        } else if (typeof detail === 'object') {
          errorMessage = detail.msg || detail.message || JSON.stringify(detail);
        }
      } else if (error.message) {
        errorMessage = error.message;
      }
      console.error('Upload master error:', error.response?.data || error);
      return rejectWithValue(errorMessage);
    }
  }
);

export const uploadEnhanced = createAsyncThunk(
  'upload/uploadEnhanced',
  async (file, { rejectWithValue }) => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      const response = await uploadAPI.uploadEnhanced(formData);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.detail || 'Failed to upload enhanced file');
    }
  }
);

const uploadSlice = createSlice({
  name: 'upload',
  initialState: {
    invoiceUpload: null,
    masterUpload: null,
    enhancedUpload: null,
    currentUpload: null,
    uploads: [],
    progress: 0,
    loading: false,
    error: null,
  },
  reducers: {
    clearUploads: (state) => {
      state.invoiceUpload = null;
      state.masterUpload = null;
      state.enhancedUpload = null;
      state.currentUpload = null;
      state.uploads = [];
      state.progress = 0;
      state.error = null;
    },
    clearError: (state) => {
      state.error = null;
    },
    setProgress: (state, action) => {
      state.progress = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      // Invoice upload
      .addCase(uploadInvoice.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(uploadInvoice.fulfilled, (state, action) => {
        state.loading = false;
        state.invoiceUpload = action.payload;
        state.currentUpload = action.payload;
        state.uploads.push(action.payload);
      })
      .addCase(uploadInvoice.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Master upload
      .addCase(uploadMaster.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(uploadMaster.fulfilled, (state, action) => {
        state.loading = false;
        state.masterUpload = action.payload;
        state.currentUpload = action.payload;
        state.uploads.push(action.payload);
      })
      .addCase(uploadMaster.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Enhanced upload
      .addCase(uploadEnhanced.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(uploadEnhanced.fulfilled, (state, action) => {
        state.loading = false;
        state.enhancedUpload = action.payload;
        state.currentUpload = action.payload;
        state.uploads.push(action.payload);
      })
      .addCase(uploadEnhanced.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { clearUploads, clearError, setProgress } = uploadSlice.actions;
export default uploadSlice.reducer;
