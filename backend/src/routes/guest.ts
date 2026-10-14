import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../utils/prisma';
import { AppError } from '../middleware/errorHandler';

export const guestRouter = Router();

/** Limited guest tip where product/legal allows — creates ephemeral gift without full account */
guestRouter.post('/tip', async (req, res, next) => {
  try {
    const schema = z.object({
      favoriteHandle: z.string(),
      catalogItemId: z.string().uuid(),
      email: z.string().email(),
      message: z.string().max(140).optional(),
    });
    const data = schema.parse(req.body);
    const favoriteUser = await prisma.user.findUnique({
      where: { handle: data.favoriteHandle.toLowerCase() },
      include: { favoriteProfile: true },
    });
    if (!favoriteUser?.favoriteProfile?.isPublished) throw new AppError('Favorite not found', 404);

    const item = await prisma.giftCatalogItem.findUnique({ where: { id: data.catalogItemId } });
    if (!item || item.tokenCost > 50) throw new AppError('Guest tips limited to small gifts', 400);

    // Guest must still pay — return checkout intent; gift completes on webhook in full system
    res.status(201).json({
      guest: true,
      requiresPayment: true,
      maxTokenCost: 50,
      item: { id: item.id, tokenCost: item.tokenCost, name: item.name },
      favoriteHandle: favoriteUser.handle,
      note: 'Complete payment via /api/providers/payments/checkout after registering or with guest session',
    });
  } catch (e) {
    next(e);
  }
});
