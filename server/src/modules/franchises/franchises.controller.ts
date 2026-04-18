import { Request, Response, NextFunction } from 'express';
import * as franchisesService from './franchises.service';
import {
  createFranchiseSchema,
  updateFranchiseSchema,
  franchisesQuerySchema,
} from './franchises.schemas';

export async function listFranchises(req: Request, res: Response, next: NextFunction) {
  try {
    const query = franchisesQuerySchema.parse(req.query);
    const result = await franchisesService.getFranchises(query, req.user);
    res.json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
}

export async function getFranchise(req: Request, res: Response, next: NextFunction) {
  try {
    const franchise = await franchisesService.getFranchiseById(req.params.id, req.user);
    res.json({ success: true, data: franchise });
  } catch (err) {
    next(err);
  }
}

export async function createFranchise(req: Request, res: Response, next: NextFunction) {
  try {
    const dto = createFranchiseSchema.parse(req.body);
    const franchise = await franchisesService.createFranchise(dto, req.user);
    res.status(201).json({ success: true, data: franchise });
  } catch (err) {
    next(err);
  }
}

export async function updateFranchise(req: Request, res: Response, next: NextFunction) {
  try {
    const dto = updateFranchiseSchema.parse(req.body);
    const franchise = await franchisesService.updateFranchise(req.params.id, dto, req.user);
    res.json({ success: true, data: franchise });
  } catch (err) {
    next(err);
  }
}

export async function deleteFranchise(req: Request, res: Response, next: NextFunction) {
  try {
    await franchisesService.deleteFranchise(req.params.id, req.user);
    res.json({ success: true, message: 'Franchise deleted successfully' });
  } catch (err) {
    next(err);
  }
}
