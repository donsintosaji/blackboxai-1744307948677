import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../services/api';

interface User {
  id: string;
  name: string;
  email: string;
  role: 'farmer' | 'buyer';
  phone?: string;
  location?: {
    latitude: number;
    longitude: number;
  };
}

interface AuthContextData {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (userData: SignUpData) => Promise<void>;
  signOut: () => Promise<void>;
  updateProfile: (data: Partial<User>) => Promise<void>;
}

interface SignUpData {
  name: string;
  email: string;
  password: string;
  role: 'farmer' | 'buyer';
  phone?: string;
}

const AuthContext = createContext<AuthContextData>({} as AuthContextData);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStoredData();
  }, []);

  async function loadStoredData() {
    try {
      const [storedUser, storedToken] = await Promise.all([
        AsyncStorage.getItem('@AgriMarket:user'),
        AsyncStorage.getItem('@AgriMarket:token')
      ]);

      if (storedUser && storedToken) {
        api.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`;
        setUser(JSON.parse(storedUser));
      }
    } catch (error) {
      console.error('Error loading stored auth data:', error);
    } finally {
      setLoading(false);
    }
  }

  async function signIn(email: string, password: string) {
    try {
      const response = await api.post('/auth/login', { email, password });
      const { user: userData, token } = response.data;

      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
      await Promise.all([
        AsyncStorage.setItem('@AgriMarket:user', JSON.stringify(userData)),
        AsyncStorage.setItem('@AgriMarket:token', token)
      ]);

      setUser(userData);
    } catch (error) {
      console.error('Sign in error:', error);
      throw error;
    }
  }

  async function signUp(userData: SignUpData) {
    try {
      const response = await api.post('/auth/register', userData);
      const { user: newUser, token } = response.data;

      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
      await Promise.all([
        AsyncStorage.setItem('@AgriMarket:user', JSON.stringify(newUser)),
        AsyncStorage.setItem('@AgriMarket:token', token)
      ]);

      setUser(newUser);
    } catch (error) {
      console.error('Sign up error:', error);
      throw error;
    }
  }

  async function signOut() {
    try {
      await Promise.all([
        AsyncStorage.removeItem('@AgriMarket:user'),
        AsyncStorage.removeItem('@AgriMarket:token')
      ]);

      api.defaults.headers.common['Authorization'] = '';
      setUser(null);
    } catch (error) {
      console.error('Sign out error:', error);
      throw error;
    }
  }

  async function updateProfile(data: Partial<User>) {
    try {
      const response = await api.put('/users/profile', data);
      const updatedUser = response.data;

      await AsyncStorage.setItem('@AgriMarket:user', JSON.stringify(updatedUser));
      setUser(updatedUser);
    } catch (error) {
      console.error('Update profile error:', error);
      throw error;
    }
  }

  return (
    <AuthContext.Provider value={{ 
      user, 
      loading,
      signIn,
      signUp,
      signOut,
      updateProfile
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth(): AuthContextData {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }

  return context;
}
