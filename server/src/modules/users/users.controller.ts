import { Request, Response, NextFunction } from 'express';
import * as usersService from './users.service';
import { createUserSchema, updateUserSchema, usersQuerySchema } from './users.schemas';

export async function listUsers(req: Request, res: Response, next: NextFunction) {
  try {
    const query = usersQuerySchema.parse(req.query);
    const result = await usersService.getUsers(query);
    res.json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
}

export async function getUser(req: Request, res: Response, next: NextFunction) {
  try {
    const user = await usersService.getUserById(req.params.id);
    res.json({ success: true, data: user });
  } catch (err) {
    next(err);
  }
}

export async function createUser(req: Request, res: Response, next: NextFunction) {
  try {
    const dto = createUserSchema.parse(req.body);
    const user = await usersService.createUser(dto, req.user);
    res.status(201).json({ success: true, data: user });
  } catch (err) {
    next(err);
  }
}

export async function updateUser(req: Request, res: Response, next: NextFunction) {
  try {
    const dto = updateUserSchema.parse(req.body);
    const user = await usersService.updateUser(req.params.id, dto, req.user);
    res.json({ success: true, data: user });
  } catch (err) {
    next(err);
  }
}

export async function deleteUser(req: Request, res: Response, next: NextFunction) {
  try {
    await usersService.deleteUser(req.params.id, req.user);
    res.json({ success: true, message: 'User deleted successfully' });
  } catch (err) {
    next(err);
  }
}

export async function getMe(req: Request, res: Response, next: NextFunction) {
  try {
    const user = await usersService.getUserById(req.user.id);
    res.json({ success: true, data: user });
  } catch (err) {
    next(err);
  }
}
