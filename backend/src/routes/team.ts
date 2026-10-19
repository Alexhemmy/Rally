import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../utils/prisma';
import { authenticate } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';
import { notify } from '../services/notifications';

// ACC-7 — Team Roles: Favorites invite managers/moderators with
// scoped permissions; every action is audit-logged.
export const teamRouter = Router();

const VALID_PERMISSIONS = ['moderate_comments', 'review_moments', 'pin_posts', 'manage_store'];

async function requireFavoriteOwner(favoriteId: string, userId: string, roles: string[]) {
  const fav = await prisma.favoriteProfile.findUnique({ where: { id: favoriteId } });
  if (!fav) throw new AppError('Favorite not found', 404);
  if (fav.userId === userId || roles.includes('ADMIN')) return fav;
  throw new AppError('Only the Favorite can manage their team', 403);
}

// Invite a team member
teamRouter.post('/invite', authenticate, async (req, res, next) => {
  try {
    const data = z.object({
      favoriteId: z.string().uuid(),
      handle: z.string(),
      role: z.enum(['manager', 'moderator']),
      permissions: z.array(z.enum(['moderate_comments', 'review_moments', 'pin_posts', 'manage_store'])).default([]),
    }).parse(req.body);
    await requireFavoriteOwner(data.favoriteId, req.user!.userId, req.user!.roles);

    const invitee = await prisma.user.findUnique({ where: { handle: data.handle.toLowerCase() } });
    if (!invitee) throw new AppError('User not found', 404);
    const fav = await prisma.favoriteProfile.findUnique({ where: { id: data.favoriteId } });
    if (fav && invitee.id === fav.userId) throw new AppError('The Favorite is already the owner');

    const member = await prisma.teamMember.upsert({
      where: { favoriteId_userId: { favoriteId: data.favoriteId, userId: invitee.id } },
      create: {
        favoriteId: data.favoriteId,
        userId: invitee.id,
        role: data.role,
        permissions: data.permissions,
        invitedBy: req.user!.userId,
        auditLog: [{ action: 'invited', by: req.user!.userId, at: new Date().toISOString() }],
      },
      update: {
        role: data.role,
        permissions: data.permissions,
        auditLog: { push: { action: 'updated', by: req.user!.userId, at: new Date().toISOString() } },
      },
    });
    await notify({
      userId: invitee.id,
      type: 'team_invite',
      title: 'You were added to a Favorite team',
      body: 'Role: ' + data.role + (data.permissions.length ? ' (' + data.permissions.join(', ') + ')' : ''),
      data: { favoriteId: data.favoriteId },
    });
    res.status(201).json({ member: { id: member.id, role: member.role, permissions: member.permissions } });
  } catch (err) { next(err); }
});

teamRouter.get('/list/:favoriteId', authenticate, async (req, res, next) => {
  try {
    await requireFavoriteOwner(req.params.favoriteId, req.user!.userId, req.user!.roles);
    const members = await prisma.teamMember.findMany({
      where: { favoriteId: req.params.favoriteId },
    });
    const users = await prisma.user.findMany({
      where: { id: { in: members.map((m) => m.userId) } },
      select: { id: true, handle: true, displayName: true, avatarUrl: true },
    });
    res.json({
      members: members.map((m) => ({
        id: m.id,
        role: m.role,
        permissions: m.permissions,
        addedAt: m.addedAt,
        user: users.find((u) => u.id === m.userId) ?? null,
      })),
    });
  } catch (err) { next(err); }
});

// Update a member's role/permissions
teamRouter.patch('/:id', authenticate, async (req, res, next) => {
  try {
    const data = z.object({
      role: z.enum(['manager', 'moderator']).optional(),
      permissions: z.array(z.enum(VALID_PERMISSIONS as any)).optional(),
    }).parse(req.body);
    const member = await prisma.teamMember.findUnique({ where: { id: req.params.id } });
    if (!member) throw new AppError('Team member not found', 404);
    await requireFavoriteOwner(member.favoriteId, req.user!.userId, req.user!.roles);
    const updated = await prisma.teamMember.update({
      where: { id: member.id },
      data: {
        ...data,
        auditLog: { push: { action: 'updated', by: req.user!.userId, at: new Date().toISOString() } },
      },
    });
    res.json({ member: updated });
  } catch (err) { next(err); }
});

teamRouter.delete('/:id', authenticate, async (req, res, next) => {
  try {
    const member = await prisma.teamMember.findUnique({ where: { id: req.params.id } });
    if (!member) throw new AppError('Team member not found', 404);
    await requireFavoriteOwner(member.favoriteId, req.user!.userId, req.user!.roles);
    await prisma.teamMember.delete({ where: { id: member.id } });
    await notify({
      userId: member.userId,
      type: 'team_removed',
      title: 'You were removed from a Favorite team',
      data: { favoriteId: member.favoriteId },
    });
    res.json({ removed: true });
  } catch (err) { next(err); }
});
