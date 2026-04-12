export enum Role {
  ADMIN = 'ADMIN',
  MANAGER = 'MANAGER',
  USER = 'USER',
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  locations: Array<{
    location: {
      id: string;
      name: string;
      storeNumber: string;
    };
  }>;
}

export interface Location {
  id: string;
  name: string;
  storeNumber: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  users: Array<{
    user: {
      id: string;
      name: string;
      email: string;
      role: Role;
    };
  }>;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  success: boolean;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export interface ApiError {
  success: false;
  message: string;
  errors?: Record<string, string[]>;
}

export interface DashboardStats {
  users: { total: number; active: number };
  locations: { total: number };
}

// Form types
export interface LoginFormData {
  email: string;
  password: string;
}

export interface UserFormData {
  name: string;
  email: string;
  password?: string;
  role: Role;
  isActive: boolean;
  locationIds: string[];
}

export interface LocationFormData {
  name: string;
  storeNumber: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  notes?: string;
  userIds: string[];
}
