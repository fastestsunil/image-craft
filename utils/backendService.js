// Backend API service for ImageCraft extension
class BackendService {
  constructor() {
    this.baseURL = 'http://localhost:5001/api';
    this.token = null;
  }

  // Set authentication token
  setToken(token) {
    this.token = token;
  }

  // Get headers for API requests
  getHeaders() {
    const headers = {
      'Content-Type': 'application/json',
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    return headers;
  }

  // Make API request
  async makeRequest(endpoint, options = {}) {
    try {
      const url = `${this.baseURL}${endpoint}`;
      const config = {
        method: 'GET',
        headers: this.getHeaders(),
        ...options,
      };

      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'API request failed');
      }

      return data;
    } catch (error) {
      console.error('Backend API error:', error);
      throw error;
    }
  }

  // Authentication methods
  async register(userData) {
    return this.makeRequest('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  }

  async login(credentials) {
    return this.makeRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
  }

  async getCurrentUser() {
    return this.makeRequest('/auth/me');
  }

  async updateSettings(settings) {
    return this.makeRequest('/auth/settings', {
      method: 'PUT',
      body: JSON.stringify(settings),
    });
  }

  async logout() {
    return this.makeRequest('/auth/logout', {
      method: 'POST',
    });
  }

  // Image processing methods
  async convertImage(imageUrl, format, quality = 80) {
    return this.makeRequest('/images/convert', {
      method: 'POST',
      body: JSON.stringify({
        imageUrl,
        format,
        quality,
      }),
    });
  }

  async removeBackground(imageUrl, quality = 80) {
    return this.makeRequest('/images/remove-background', {
      method: 'POST',
      body: JSON.stringify({
        imageUrl,
        quality,
      }),
    });
  }

  // Image management methods
  async getUserImages(page = 1, limit = 20, filters = {}) {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      ...filters,
    });

    return this.makeRequest(`/images?${params}`);
  }

  async getImage(imageId) {
    return this.makeRequest(`/images/${imageId}`);
  }

  async deleteImage(imageId) {
    return this.makeRequest(`/images/${imageId}`, {
      method: 'DELETE',
    });
  }

  async downloadImage(imageId) {
    return this.makeRequest(`/images/${imageId}/download`, {
      method: 'POST',
    });
  }

  // Statistics methods
  async getUserStats() {
    return this.makeRequest('/users/stats');
  }

  async getImageStats() {
    return this.makeRequest('/stats/images');
  }

  async getRecentImages(limit = 10) {
    return this.makeRequest(`/stats/recent?limit=${limit}`);
  }

  // Check if backend is available
  async checkHealth() {
    try {
      const response = await fetch('http://localhost:5001/health');
      return response.ok;
    } catch (error) {
      return false;
    }
  }

  // Get user usage limits
  async getUserLimits() {
    try {
      const userData = await this.getCurrentUser();
      const user = userData.data.user;

      return {
        isPremium: user.isPremium,
        imagesProcessed: user.usage.imagesProcessed,
        backgroundsRemoved: user.usage.backgroundsRemoved,
        dailyLimit: user.isPremium ? Infinity : 10,
        backgroundRemovalLimit: user.isPremium ? 50 : 0,
      };
    } catch (error) {
      console.error('Failed to get user limits:', error);
      return {
        isPremium: false,
        imagesProcessed: 0,
        backgroundsRemoved: 0,
        dailyLimit: 10,
        backgroundRemovalLimit: 0,
      };
    }
  }
}

// Create singleton instance
const backendService = new BackendService();

export default backendService;
