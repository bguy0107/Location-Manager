import { Request } from 'express';

export enum Role {
  ADMIN = 'ADMIN',
  FRANCHISE_MANAGER = 'FRANCHISE_MANAGER',
  MANAGER = 'MANAGER',
  USER = 'USER',
  TECHNICIAN = 'TECHNICIAN',
}

export interface JwtPayload {
  sub: string;
  email: string;
  role: Role;
  franchiseId?: string;
  iat?: number;
  exp?: number;
}

export interface AuthenticatedUser {
  id: string;
  email: string;
  role: Role;
  franchiseId?: string;
}

// Augment Express Request to include the authenticated user
declare global {
  namespace Express {
    interface Request {
      user: AuthenticatedUser;
    }
  }
}

export interface PaginationParams {
  page: number;
  limit: number;
  skip: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export type { Request };
