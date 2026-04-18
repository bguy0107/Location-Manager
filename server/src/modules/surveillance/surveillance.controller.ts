import { Request, Response, NextFunction } from 'express';
import * as service from './surveillance.service';
import {
  createSurveillanceRequestSchema,
  updateSurveillanceRequestSchema,
  surveillanceQuerySchema,
} from './surveillance.schemas';

export async function listRequests(req: Request, res: Response, next: NextFunction) {
  try {
    const query = surveillanceQuerySchema.parse(req.query);
    const result = await service.getSurveillanceRequests(query, req.user);
    res.json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
}

export async function getRequest(req: Request, res: Response, next: NextFunction) {
  try {
    const request = await service.getSurveillanceRequestById(req.params.id, req.user);
    res.json({ success: true, data: request });
  } catch (err) {
    next(err);
  }
}

export async function createRequest(req: Request, res: Response, next: NextFunction) {
  try {
    const dto = createSurveillanceRequestSchema.parse(req.body);
    const request = await service.createSurveillanceRequest(dto, req.user);
    res.status(201).json({ success: true, data: request });
  } catch (err) {
    next(err);
  }
}

export async function updateStatus(req: Request, res: Response, next: NextFunction) {
  try {
    const dto = updateSurveillanceRequestSchema.parse(req.body);
    const request = await service.updateSurveillanceStatus(req.params.id, dto, req.user);
    res.json({ success: true, data: request });
  } catch (err) {
    next(err);
  }
}

export async function deleteRequest(req: Request, res: Response, next: NextFunction) {
  try {
    await service.deleteSurveillanceRequest(req.params.id, req.user);
    res.json({ success: true, message: 'Surveillance request deleted successfully' });
  } catch (err) {
    next(err);
  }
}
