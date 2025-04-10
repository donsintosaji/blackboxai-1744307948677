import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const api = axios.create({
  baseURL: 'http://localhost:3000/api', // Update this with your backend URL
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for API calls
api.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem('@AgriMarket:token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for API calls
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Handle 401 Unauthorized errors
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        // Clear stored auth data
        await AsyncStorage.multiRemove(['@AgriMarket:token', '@AgriMarket:user']);
        
        // Redirect to login (this should be handled by your navigation)
        // You might want to emit an event or use a navigation ref here
        return Promise.reject(error);
      } catch (refreshError) {
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

// API endpoints
export const endpoints = {
  auth: {
    login: '/auth/login',
    register: '/auth/register',
    verifyOtp: '/auth/verify-otp',
  },
  user: {
    profile: '/users/profile',
    updateProfile: '/users/profile',
  },
  crops: {
    list: '/crops',
    create: '/crops',
    details: (id: string) => `/crops/${id}`,
    update: (id: string) => `/crops/${id}`,
    delete: (id: string) => `/crops/${id}`,
    search: '/crops/search',
  },
  orders: {
    list: '/orders',
    create: '/orders',
    details: (id: string) => `/orders/${id}`,
    update: (id: string) => `/orders/${id}`,
    cancel: (id: string) => `/orders/${id}/cancel`,
  },
  payments: {
    create: '/payments',
    verify: (id: string) => `/payments/${id}/verify`,
  },
};

// Type definitions for API responses
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export interface ErrorResponse {
  success: false;
  error: string;
  message: string;
}

// API methods
export const apiMethods = {
  // Auth
  login: (email: string, password: string) => 
    api.post(endpoints.auth.login, { email, password }),
  
  register: (userData: {
    name: string;
    email: string;
    password: string;
    role: 'farmer' | 'buyer';
    phone?: string;
  }) => api.post(endpoints.auth.register, userData),

  verifyOtp: (email: string, otp: string) =>
    api.post(endpoints.auth.verifyOtp, { email, otp }),

  // User
  getProfile: () => api.get(endpoints.user.profile),
  updateProfile: (data: any) => api.put(endpoints.user.updateProfile, data),

  // Crops
  getCrops: (params?: { 
    page?: number; 
    limit?: number;
    search?: string;
    category?: string;
    location?: string;
  }) => api.get(endpoints.crops.list, { params }),

  getCropDetails: (id: string) => api.get(endpoints.crops.details(id)),

  createCrop: (data: {
    name: string;
    description: string;
    price: number;
    quantity: number;
    unit: string;
    category: string;
    images: string[];
    location?: {
      latitude: number;
      longitude: number;
    };
  }) => api.post(endpoints.crops.create, data),

  updateCrop: (id: string, data: any) => 
    api.put(endpoints.crops.update(id), data),

  deleteCrop: (id: string) => api.delete(endpoints.crops.delete(id)),

  searchCrops: (query: string) => 
    api.get(endpoints.crops.search, { params: { q: query } }),

  // Orders
  getOrders: (params?: { 
    page?: number; 
    limit?: number;
    status?: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  }) => api.get(endpoints.orders.list, { params }),

  getOrderDetails: (id: string) => api.get(endpoints.orders.details(id)),

  createOrder: (data: {
    cropId: string;
    quantity: number;
    deliveryAddress?: string;
    paymentMethod: 'cash' | 'online';
  }) => api.post(endpoints.orders.create, data),

  updateOrder: (id: string, data: any) => 
    api.put(endpoints.orders.update(id), data),

  cancelOrder: (id: string) => api.post(endpoints.orders.cancel(id)),

  // Payments
  createPayment: (data: {
    orderId: string;
    amount: number;
    method: 'cash' | 'online';
  }) => api.post(endpoints.payments.create, data),

  verifyPayment: (id: string, data: any) =>
    api.post(endpoints.payments.verify(id), data),
};

export default api;
