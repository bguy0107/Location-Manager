import { Request, Response, NextFunction } from 'express';
import * as locationsService from './locations.service';
import { createLocationSchema, updateLocationSchema, locationsQuerySchema } from './locations.schemas';

export async function listLocations(req: Request, res: Response, next: NextFunction) {
  try {
    const query = locationsQuerySchema.parse(req.query);
    const result = await locationsService.getLocations(query, req.user);
    res.json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
}

export async function getLocation(req: Request, res: Response, next: NextFunction) {
  try {
    const location = await locationsService.getLocationById(req.params.id, req.user);
    res.json({ success: true, data: location });
  } catch (err) {
    next(err);
  }
}

export async function createLocation(req: Request, res: Response, next: NextFunction) {
  try {
    const dto = createLocationSchema.parse(req.body);
    const location = await locationsService.createLocation(dto);
    res.status(201).json({ success: true, data: location });
  } catch (err) {
    next(err);
  }
}

export async function updateLocation(req: Request, res: Response, next: NextFunction) {
  try {
    const dto = updateLocationSchema.parse(req.body);
    const location = await locationsService.updateLocation(req.params.id, dto);
    res.json({ success: true, data: location });
  } catch (err) {
    next(err);
  }
}

export async function deleteLocation(req: Request, res: Response, next: NextFunction) {
  try {
    await locationsService.deleteLocation(req.params.id);
    res.json({ success: true, message: 'Location deleted successfully' });
  } catch (err) {
    next(err);
  }
}
