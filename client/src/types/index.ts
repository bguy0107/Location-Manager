export enum Role {
  ADMIN = 'ADMIN',
  FRANCHISE_MANAGER = 'FRANCHISE_MANAGER',
  MANAGER = 'MANAGER',
  USER = 'USER',
  TECHNICIAN = 'TECHNICIAN',
}

export enum FranchiseStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
}

export interface Franchise {
  id: string;
  name: string;
  status: FranchiseStatus;
  logoUrl: string | null;
  createdAt: string;
  updatedAt: string;
  owner: {
    id: string;
    name: string;
    email: string;
  };
  _count: {
    locations: number;
    managers: number;
  };
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  isActive: boolean;
  franchiseId: string | null;
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
  franchiseId: string | null;
  franchise: { id: string; name: string } | null;
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

export enum RequestingParty {
  LAW_ENFORCEMENT = 'LAW_ENFORCEMENT',
  INTERNAL = 'INTERNAL',
  INSURANCE = 'INSURANCE',
}

export enum RequestStatus {
  PENDING = 'PENDING',
  IN_PROGRESS = 'IN_PROGRESS',
  FULFILLED = 'FULFILLED',
  DENIED = 'DENIED',
}

export interface SurveillanceStatusHistory {
  id: string;
  fromStatus: RequestStatus;
  toStatus: RequestStatus;
  changedAt: string;
  changedBy: {
    id: string;
    name: string;
    email: string;
  };
}

export interface SurveillanceRequest {
  id: string;
  requestingParty: RequestingParty;
  status: RequestStatus;
  footageStartAt: string;
  footageEndAt: string;
  cameras: number[];
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  location: {
    id: string;
    name: string;
    storeNumber: string;
  };
  requestedBy: {
    id: string;
    name: string;
    email: string;
  };
  statusHistory?: SurveillanceStatusHistory[];
}

export interface SurveillanceFormData {
  locationId: string;
  requestingParty: RequestingParty;
  footageStartAt: string;
  footageEndAt: string;
  cameras: { value: string }[];
  notes?: string;
}

export interface CreateSurveillancePayload {
  locationId: string;
  requestingParty: string;
  footageStartAt: string;
  footageEndAt: string;
  cameras: number[];
  notes?: string;
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
  franchiseId?: string | null;
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
  franchiseId?: string | null;
}

export interface FranchiseFormData {
  name: string;
  status: FranchiseStatus;
  logoUrl?: string;
  ownerId: string;
}
