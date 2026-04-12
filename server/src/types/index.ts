import { Request } from 'express';

export enum Role {
  ADMIN = 'ADMIN',
  MANAGER = 'MANAGER',
  USER = 'USER',
}

export interface JwtPayload {
  sub: string;   // user id
  email: string;
  role: Role;
  iat?: number;
  exp?: number;
}

export interface AuthenticatedUser {
  id: string;
  email: string;
  role: Role;
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
