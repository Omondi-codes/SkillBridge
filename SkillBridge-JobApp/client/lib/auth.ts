import api from './api';

export interface User {
  id: string;
  email: string;
  role: 'candidate' | 'employer';
  first_name: string;
  last_name: string;
  phone?: string;
  location?: string;
  company?: string;
  company_name?: string;
  company_website?: string;
  company_description?: string;
  company_logo?: string;
  company_size?: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  role: 'candidate' | 'employer';
  first_name: string;
  last_name: string;
  phone?: string;
  location?: string;
  company?: string;
  company_website?: string;
  company_size?: string;
}

export interface AuthResponse {
  user: User;
}

// Login user
export const login = async (credentials: LoginCredentials): Promise<AuthResponse> => {
  const response = await api.post('/auth/login', credentials);
  const { user, tokens } = response.data.data;

  // Store token and user in localStorage
  localStorage.setItem('token', tokens.access_token);
  localStorage.setItem('user', JSON.stringify(user));

  return { user };
};

// Register user
export const register = async (data: RegisterData): Promise<AuthResponse> => {
  const response = await api.post('/auth/register', data);
  const { user, tokens } = response.data.data;

  // Store token and user in localStorage
  localStorage.setItem('token', tokens.access_token);
  localStorage.setItem('user', JSON.stringify(user));

  return { user };
};

// Logout user
export const logout = (): void => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
};

// Get current user from localStorage
export const getUser = (): User | null => {
  const userStr = localStorage.getItem('user');
  if (!userStr) return null;

  try {
    return JSON.parse(userStr) as User;
  } catch (error) {
    console.error('Error parsing user from localStorage:', error);
    return null;
  }
};

// Get token from localStorage
export const getToken = (): string | null => {
  return localStorage.getItem('token');
};

// Check if user is authenticated
export const isAuthenticated = (): boolean => {
  return !!getToken();
};

// Verify token with backend
export const verifyToken = async (): Promise<User | null> => {
  try {
    const response = await api.get('/auth/me');
    const user = response.data.data;
    localStorage.setItem('user', JSON.stringify(user));
    return user;
  } catch (error) {
    logout();
    return null;
  }
};
