import { Request, Response, NextFunction } from 'express';
import { prisma } from '../utils/prisma';
import { AppError } from './errorHandler';

/**
 * Block high-spend and rivalry features for minors.
 * Mount AFTER authenticate so req.user is populated.
 */
export async function enforceMinorLimits(req: Request, _res: Response, next: NextFunction) {
  try {
    if (!req.user) return next();
    const user = await prisma.user.findUnique({ where: { id: req.user.userId } });
    if (!user?.isMinor) return next();

    const body = req.body || {};
    if (body.packId) {
      const pack = await prisma.tokenPack.findUnique({ where: { id: body.packId } });
      if (pack && pack.priceCents > 2000) {
        return next(new AppError('Spend limit for under-18 accounts', 403));
      }
    }
    if (body.catalogItemId) {
      const item = await prisma.giftCatalogItem.findUnique({ where: { id: body.catalogItemId } });
      if (item && item.tokenCost > 20) {
        return next(new AppError('Spend limit for under-18 accounts', 403));
      }
    }
    next();
  } catch (e) {
    next(e);
  }
}
