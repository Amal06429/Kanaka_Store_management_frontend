const API_URL = 'https://kanaka.imcbs.com/api';

// Get auth token from localStorage
const getAuthToken = () => {
  return localStorage.getItem('token');
};

// Set auth token to localStorage
const setAuthToken = (token) => {
  localStorage.setItem('token', token);
};

// Remove auth token from localStorage
const removeAuthToken = () => {
  localStorage.removeItem('token');
};

// API request helper
const apiRequest = async (endpoint, options = {}) => {
  const token = getAuthToken();
  
  console.log(`API Request: ${options.method || 'GET'} ${endpoint}`, { hasToken: !!token });
  
  const headers = {
    ...options.headers,
  };

  // Only add Content-Type for non-FormData request
  if (!(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const config = {
    ...options,
    headers,
  };

  try {
    const response = await fetch(`${API_URL}${endpoint}`, config);
    
    console.log(`API Response: ${endpoint}`, { status: response.status, ok: response.ok });
    
    // Handle 401 Unauthorized
    if (response.status === 401) {
      console.warn('API: Unauthorized, redirecting to login');
      removeAuthToken();
      window.location.href = '/login';
      throw new Error('Unauthorized');
    }

    // Handle empty response
    const contentType = response.headers.get('content-type');
    let data = null;
    
    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
    } else {
      data = {};
    }

    if (!response.ok) {
      console.error('API Error Response:', data);
      throw new Error(data.detail || data.message || `Request failed with status ${response.status}`);
    }

    console.log(`API Success: ${endpoint}`, data);
    return data;
  } catch (error) {
    console.error('API Error:', error);
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      throw new Error('Cannot connect to server. Please make sure the backend is running.');
    }
    throw error;
  }
};

// Auth API
export const authAPI = {
  login: async (username, password) => {
    const data = await apiRequest('/auth/login/', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });
    
    if (data.tokens && data.tokens.access) {
      setAuthToken(data.tokens.access);
    }
    
    return data;
  },

  register: async (userData) => {
    const data = await apiRequest('/auth/register/', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
    
    if (data.tokens && data.tokens.access) {
      setAuthToken(data.tokens.access);
    }
    
    return data;
  },

  getCurrentUser: async () => {
    return await apiRequest('/auth/me/');
  },

  logout: () => {
    removeAuthToken();
  },
};

// Users API
export const usersAPI = {
  getAll: async () => {
    return await apiRequest('/users/');
  },

  getRegularUsers: async () => {
    return await apiRequest('/users/regular_users/');
  },

  create: async (userData) => {
    return await apiRequest('/users/', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  },

  update: async (id, userData) => {
    return await apiRequest(`/users/${id}/`, {
      method: 'PATCH',
      body: JSON.stringify(userData),
    });
  },

  delete: async (id) => {
    return await apiRequest(`/users/${id}/`, {
      method: 'DELETE',
    });
  },
};

// Files API
export const filesAPI = {
  getAll: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    const endpoint = queryString ? `/files/?${queryString}` : '/files/';
    return await apiRequest(endpoint);
  },

  getMyFiles: async () => {
    return await apiRequest('/files/my_files/');
  },

  upload: async (formData) => {
    const token = getAuthToken();
    
    const response = await fetch(`${API_URL}/files/`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Upload failed');
    }

    return await response.json();
  },

  update: async (id, fileData) => {
    return await apiRequest(`/files/${id}/`, {
      method: 'PATCH',
      body: JSON.stringify(fileData),
    });
  },

  delete: async (id) => {
    return await apiRequest(`/files/${id}/`, {
      method: 'DELETE',
    });
  },

  updateStatus: async (id, status) => {
    return await apiRequest(`/files/${id}/update_status/`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  },

  getStats: async () => {
    return await apiRequest('/files/stats/');
  },
};

export { getAuthToken, setAuthToken, removeAuthToken };
