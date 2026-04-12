import { Request, Response, NextFunction } from 'express';
import { getDashboardStats as getUserStats } from '../users/users.service';
import { getDashboardStats as getLocationStats } from '../locations/locations.service';

export async function getDashboardStats(_req: Request, res: Response, next: NextFunction) {
  try {
    const [userStats, locationStats] = await Promise.all([
      getUserStats(),
      getLocationStats(),
    ]);

    res.json({
      success: true,
      data: {
        users: userStats,
        locations: locationStats,
      },
    });
  } catch (err) {
    next(err);
  }
}
