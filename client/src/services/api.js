const BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

/**
 * Handles API fetch with structured JSON error response
 */
async function request(endpoint, options = {}) {
  const url = `${BASE_URL}${endpoint}`;
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  try {
    const response = await fetch(url, { ...options, headers });
    const data = await response.json().catch(() => null);

    if (!response.ok) {
      const errorMessage = data?.error || (data?.details?.[0]?.message) || `Request failed with status ${response.status}`;
      const error = new Error(errorMessage);
      error.status = response.status;
      error.details = data;
      throw error;
    }

    return data;
  } catch (err) {
    if (err.status) throw err;
    throw new Error('Unable to connect to the server. Please ensure the backend is running.');
  }
}

export const api = {
  // Slots
  getSlots: (date, timezone) => {
    const params = new URLSearchParams({ date, timezone });
    return request(`/slots?${params.toString()}`);
  },

  // Bookings
  createBooking: (payload) => {
    return request('/bookings', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  getBooking: (id) => {
    return request(`/bookings/${id}`);
  },

  resetDemo: () => {
    return request('/bookings/reset', {
      method: 'POST',
    });
  },

  // Mentors & Admin
  getMentors: () => {
    return request('/mentors');
  },

  getNotifications: (limit = 20) => {
    return request(`/mentors/notifications?limit=${limit}`);
  },
};

export default api;
