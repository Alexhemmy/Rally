import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { buildApp } from '../src/app';
import { prisma } from '../src/utils/prisma';
import {
  createUser,
  createFavorite,
  follow,
  auth,
  cleanup,
} from './helpers';

const app = buildApp();

beforeAll(async () => {
  await cleanup();
});
afterAll(async () => {
  await cleanup();
  await prisma.$disconnect();
});

describe('FFG — Fan-to-Fan Gifting', () => {
  it('escrows tokens: sender debited at send, credited on accept', async () => {
    const sender = await createUser({ verified: true });
    const recipient = await createUser({});
    await prisma.tokenWallet.update({ where: { userId: sender.id }, data: { balance: 100 } });

    const send = await request(app)
      .post('/api/fangifts/tokens')
      .set(auth(sender.token))
      .send({ recipientHandle: recipient.handle, amount: 40 });
    expect(send.status).toBe(201);

    const senderWallet = await prisma.tokenWallet.findUnique({ where: { userId: sender.id } });
    expect(senderWallet!.balance).toBe(60);
    const recWallet = await prisma.tokenWallet.findUnique({ where: { userId: recipient.id } });
    expect(recWallet!.giftedBalance).toBe(0); // escrowed, not credited yet

    const accept = await request(app)
      .post(`/api/fangifts/${send.body.gift.id}/accept`)
      .set(auth(recipient.token));
    expect(accept.status).toBe(200);

    const recAfter = await prisma.tokenWallet.findUnique({ where: { userId: recipient.id } });
    expect(recAfter!.giftedBalance).toBe(40); // FFG-2: restricted balance
  });

  it('decline refunds the sender', async () => {
    const sender = await createUser({ verified: true });
    const recipient = await createUser({});
    await prisma.tokenWallet.update({ where: { userId: sender.id }, data: { balance: 50 } });

    const send = await request(app)
      .post('/api/fangifts/tokens')
      .set(auth(sender.token))
      .send({ recipientHandle: recipient.handle, amount: 25 });
    expect(send.status).toBe(201);

    const decline = await request(app)
      .post(`/api/fangifts/${send.body.gift.id}/decline`)
      .set(auth(recipient.token));
    expect(decline.status).toBe(200);

    const w = await prisma.tokenWallet.findUnique({ where: { userId: sender.id } });
    expect(w!.balance).toBe(50);
  });

  it('blocks minors (FFG-5)', async () => {
    const minor = await createUser({ isMinor: true });
    const other = await createUser({});
    const res = await request(app)
      .post('/api/fangifts/tokens')
      .set(auth(minor.token))
      .send({ recipientHandle: other.handle, amount: 5 });
    expect(res.status).toBe(403);
  });

  it('requires verified phone for token gifts (FFG-6)', async () => {
    const sender = await createUser({ verified: false });
    const other = await createUser({});
    const res = await request(app)
      .post('/api/fangifts/tokens')
      .set(auth(sender.token))
      .send({ recipientHandle: other.handle, amount: 5 });
    expect(res.status).toBe(403);
  });
});

describe('GVW — Giveaways (API flow)', () => {
  it('full lifecycle: create → fund → announce → enter → draw', async () => {
    const favOwner = await createUser({ roles: ['USER', 'FAVORITE'] });
    const fav = await createFavorite(favOwner.id, { giftPoints: 1000 });

    const create = await request(app)
      .post('/api/giveaways')
      .set(auth(favOwner.token))
      .send({
        favoriteId: fav.id,
        poolAmount: 100,
        currency: 'USD',
        winnerCount: 1,
        entryOpensAt: new Date(Date.now() - 86400000).toISOString(),
        entryClosesAt: new Date(Date.now() - 1000).toISOString(),
      });
    expect(create.status).toBe(201);
    expect(create.body.giveaway.fee).toBeCloseTo(3); // 3% fee

    const id = create.body.giveaway.id;

    const fund = await request(app).post(`/api/giveaways/${id}/fund`).set(auth(favOwner.token));
    expect(fund.status).toBe(200);
    const favAfter = await prisma.favoriteProfile.findUnique({ where: { id: fav.id } });
    expect(favAfter!.giftPointsBalance).toBeCloseTo(1000 - 103); // pool + 3%

    const announce = await request(app).post(`/api/giveaways/${id}/announce`).set(auth(favOwner.token));
    expect(announce.status).toBe(200);
    expect(announce.body.giveaway.seedHash).toBeTruthy(); // committed hash

    const fan = await createUser({ verified: true, createdAtDaysAgo: 20 });
    await follow(fan.id, favOwner.id, 10);
    const enter = await request(app).post(`/api/giveaways/${id}/enter`).set(auth(fan.token));
    expect(enter.status).toBe(201);

    // results are hidden before draw
    const early = await request(app).get(`/api/giveaways/${id}/results`).set(auth(fan.token));
    expect(early.body.results).toBeNull();

    const draw = await request(app).post(`/api/giveaways/${id}/draw`).set(auth(favOwner.token));
    expect(draw.status).toBe(200);
    expect(draw.body.drawn).toBe(true);
    expect(draw.body.seedRevealed).toBeTruthy(); // fairness: seed revealed

    const results = await request(app).get(`/api/giveaways/${id}/results`).set(auth(fan.token));
    expect(results.body.winners).toHaveLength(1);
    expect(results.body.own.entered).toBe(true);
    // GVW-4: only a band, never an exact score
    expect(['low', 'medium', 'high']).toContain(results.body.own.scoreBand);
  });

  it('blocks ineligible entrants (14d account / 7d follow)', async () => {
    const favOwner = await createUser({ roles: ['USER', 'FAVORITE'] });
    const fav = await createFavorite(favOwner.id, { giftPoints: 500 });
    const create = await request(app)
      .post('/api/giveaways')
      .set(auth(favOwner.token))
      .send({
        favoriteId: fav.id,
        poolAmount: 50,
        currency: 'USD',
        winnerCount: 1,
        entryOpensAt: new Date(Date.now() - 86400000).toISOString(),
        entryClosesAt: new Date(Date.now() + 86400000).toISOString(),
      });
    await request(app).post(`/api/giveaways/${create.body.giveaway.id}/fund`).set(auth(favOwner.token));
    await request(app).post(`/api/giveaways/${create.body.giveaway.id}/announce`).set(auth(favOwner.token));

    const youngFan = await createUser({ verified: true, createdAtDaysAgo: 2 });
    const res = await request(app)
      .post(`/api/giveaways/${create.body.giveaway.id}/enter`)
      .set(auth(youngFan.token));
    expect(res.status).toBe(403);

    const noFollow = await createUser({ verified: true, createdAtDaysAgo: 20 });
    const res2 = await request(app)
      .post(`/api/giveaways/${create.body.giveaway.id}/enter`)
      .set(auth(noFollow.token));
    expect(res2.status).toBe(403);
  });
});

describe('UPG — Fan upgrade path', () => {
  it('progress reports 6 non-monetary signals', async () => {
    const user = await createUser({});
    const res = await request(app).get('/api/upgrades/progress').set(auth(user.token));
    expect(res.status).toBe(200);
    expect(res.body.total).toBe(6);
    expect(Object.keys(res.body.signals)).toHaveLength(6);
  });

  it('blocks application until all signals pass (no shortcuts)', async () => {
    const user = await createUser({});
    const res = await request(app)
      .post('/api/upgrades/request')
      .set(auth(user.token))
      .send({ pitch: 'x'.repeat(60), samples: ['https://example.com'] });
    expect(res.status).toBe(403);
  });
});

describe('SUB — Subscriptions & Store', () => {
  it('enforces max 5 tiers per Favorite', async () => {
    const favOwner = await createUser({ roles: ['USER', 'FAVORITE'] });
    const fav = await createFavorite(favOwner.id);
    for (let i = 0; i < 5; i++) {
      const res = await request(app)
        .post('/api/subscriptions/tiers')
        .set(auth(favOwner.token))
        .send({ favoriteId: fav.id, name: `T${i}`, priceCents: 500, currency: 'USD', perks: [] });
      expect(res.status).toBe(201);
    }
    const sixth = await request(app)
      .post('/api/subscriptions/tiers')
      .set(auth(favOwner.token))
      .send({ favoriteId: fav.id, name: 'T6', priceCents: 500, currency: 'USD', perks: [] });
    expect(sixth.status).toBe(409);
  });

  it('subscribe creates pending Earning with ~10% fee; cancel stops renewal', async () => {
    const favOwner = await createUser({ roles: ['USER', 'FAVORITE'] });
    const fav = await createFavorite(favOwner.id);
    const tier = await request(app)
      .post('/api/subscriptions/tiers')
      .set(auth(favOwner.token))
      .send({ favoriteId: fav.id, name: 'Gold', priceCents: 1000, currency: 'USD', perks: ['badge'] });
    const fan = await createUser({});

    const sub = await request(app)
      .post('/api/subscriptions/subscribe')
      .set(auth(fan.token))
      .send({ tierId: tier.body.tier.id });
    expect(sub.status).toBe(201);

    const earning = await prisma.earning.findFirst({ where: { sourceType: 'subscription', sourceId: sub.body.subscription.id } });
    expect(earning!.status).toBe('pending');
    expect(Number(earning!.amount)).toBeCloseTo(900); // 10% fee

    const cancel = await request(app)
      .post(`/api/subscriptions/${sub.body.subscription.id}/cancel`)
      .set(auth(fan.token));
    expect(cancel.body.subscription.status).toBe('cancelled');
    expect(cancel.body.subscription.autoRenew).toBe(false);
  });

  it('store: order → deliver with proof → earning available', async () => {
    const favOwner = await createUser({ roles: ['USER', 'FAVORITE'] });
    const fav = await createFavorite(favOwner.id);
    const item = await request(app)
      .post('/api/store/items')
      .set(auth(favOwner.token))
      .send({
        favoriteId: fav.id,
        title: 'Beat pack',
        priceCents: 2000,
        currency: 'USD',
        deliveryType: 'download',
        deliveryWindowDays: 3,
      });
    const buyer = await createUser({});

    const order = await request(app)
      .post('/api/store/orders')
      .set(auth(buyer.token))
      .send({ itemId: item.body.item.id });
    expect(order.status).toBe(201);
    const dueAt = new Date(order.body.order.dueAt).getTime();
    expect(dueAt).toBeGreaterThan(Date.now());

    const deliver = await request(app)
      .post(`/api/store/orders/${order.body.order.id}/deliver`)
      .set(auth(favOwner.token))
      .send({ deliveryProof: 'https://cdn.example/proof' });
    expect(deliver.status).toBe(200);

    const earning = await prisma.earning.findFirst({ where: { sourceType: 'store', sourceId: order.body.order.id } });
    expect(earning!.status).toBe('available');
    expect(Number(earning!.amount)).toBeCloseTo(1800); // 10% fee
  });

  it('store: overdue order auto-refunds (SUB-4)', async () => {
    const favOwner = await createUser({ roles: ['USER', 'FAVORITE'] });
    const fav = await createFavorite(favOwner.id);
    const item = await request(app)
      .post('/api/store/items')
      .set(auth(favOwner.token))
      .send({ favoriteId: fav.id, title: 'Sketch', priceCents: 1500, currency: 'USD', deliveryType: 'link', deliveryWindowDays: 1 });
    const buyer = await createUser({});
    const order = await request(app)
      .post('/api/store/orders')
      .set(auth(buyer.token))
      .send({ itemId: item.body.item.id });

    // force overdue
    await prisma.storeOrder.update({
      where: { id: order.body.order.id },
      data: { dueAt: new Date(Date.now() - 1000) },
    });
    const refund = await request(app)
      .post(`/api/store/orders/${order.body.order.id}/refund`)
      .set(auth(buyer.token));
    expect(refund.status).toBe(200);
    expect(refund.body.auto).toBe(true);
    expect(refund.body.refunded).toBe(true);
  });
});

describe('MOM-4/5 — Fan Moments & Collections', () => {
  it('fan moment requires approval before it is public', async () => {
    const favOwner = await createUser({ roles: ['USER', 'FAVORITE'] });
    const fav = await createFavorite(favOwner.id);
    const fan = await createUser({});

    const submit = await request(app)
      .post('/api/fanmoments/create')
      .set(auth(fan.token))
      .send({ favoriteId: fav.id, title: 'Met them backstage!' });
    expect(submit.status).toBe(201);

    const pub = await request(app).get(`/api/fanmoments/favorite/${fav.id}`);
    expect(pub.body.moments).toHaveLength(0); // hidden until approved

    const approve = await request(app)
      .post(`/api/fanmoments/${submit.body.moment.id}/approve`)
      .set(auth(favOwner.token));
    expect(approve.status).toBe(200);

    const pub2 = await request(app).get(`/api/fanmoments/favorite/${fav.id}`);
    expect(pub2.body.moments).toHaveLength(1);
  });

  it('collections: create, add moment, share, private hidden from others', async () => {
    const fan = await createUser({});
    const other = await createUser({});
    const favOwner = await createUser({ roles: ['USER', 'FAVORITE'] });
    const fav = await createFavorite(favOwner.id);

    const c = await request(app)
      .post('/api/collections')
      .set(auth(fan.token))
      .send({ title: 'Best of', isPublic: false });
    expect(c.status).toBe(201);

    const m = await prisma.moment.create({
      data: { favoriteId: fav.id, authorId: favOwner.id, type: 'FAVORITE', title: 'Studio', isApproved: true, visibility: 'PUBLIC' },
    });
    const add = await request(app)
      .post(`/api/collections/${c.body.collection.id}/moments`)
      .set(auth(fan.token))
      .send({ momentId: m.id });
    expect(add.status).toBe(200);
    expect(add.body.collection.momentIds).toContain(m.id);

    // private: other users get 403
    const blocked = await request(app).get(`/api/collections/${c.body.collection.id}`).set(auth(other.token));
    expect(blocked.status).toBe(403);

    await request(app)
      .patch(`/api/collections/${c.body.collection.id}`)
      .set(auth(fan.token))
      .send({ isPublic: true });
    const shared = await request(app).get(`/api/collections/${c.body.collection.id}`).set(auth(other.token));
    expect(shared.status).toBe(200);
    expect(shared.body.collection.moments).toHaveLength(1);
  });
});

describe('REC-3 / ACC-7 / RIV — Leaderboards, Team, Rivalries', () => {
  it('leaderboard hides anonymous fans (rank only)', async () => {
    const favOwner = await createUser({ roles: ['USER', 'FAVORITE'] });
    const fav = await createFavorite(favOwner.id);
    const anon = await createUser({});
    await prisma.user.update({ where: { id: anon.id }, data: { anonymityDefault: true } });
    await prisma.supporterLevel.create({
      data: { favoriteId: fav.id, userId: anon.id, level: 'gold', cumulative: 500 },
    });

    const board = await request(app)
      .get(`/api/leaderboards/${fav.id}?period=alltime`);
    expect(board.status).toBe(200);
    expect(board.body.board).toHaveLength(1);
    expect(board.body.board[0].displayName).toBe('Anonymous Fan');
    expect(board.body.board[0].handle).toBeNull();
    expect(board.body.board[0].rank).toBe(1);
  });

  it('team: invite with scoped permissions, only owner manages', async () => {
    const favOwner = await createUser({ roles: ['USER', 'FAVORITE'] });
    const fav = await createFavorite(favOwner.id);
    const mod = await createUser({});
    const stranger = await createUser({});

    const invite = await request(app)
      .post('/api/team/invite')
      .set(auth(favOwner.token))
      .send({ favoriteId: fav.id, handle: mod.handle, role: 'moderator', permissions: ['review_moments'] });
    expect(invite.status).toBe(201);

    const strangerTry = await request(app)
      .post('/api/team/invite')
      .set(auth(stranger.token))
      .send({ favoriteId: fav.id, handle: stranger.handle, role: 'manager', permissions: [] });
    expect(strangerTry.status).toBe(403);
  });

  it('rivalry: face-offs blocked until both opt in (RIV-1); vote once per user', async () => {
    const admin = await createUser({ roles: ['USER', 'ADMIN'] });
    const ownerA = await createUser({ roles: ['USER', 'FAVORITE'] });
    const ownerB = await createUser({ roles: ['USER', 'FAVORITE'] });
    const favA = await createFavorite(ownerA.id);
    const favB = await createFavorite(ownerB.id);

    const doc = await request(app)
      .post('/api/rivalries/document')
      .set(auth(admin.token))
      .send({
        favoriteAId: favA.id,
        favoriteBId: favB.id,
        summary: 'Long-running chart rivalry (documented).',
        sources: ['https://example.com/article'],
      });
    expect(doc.status).toBe(201);
    const rivalryId = doc.body.rivalry.id;

    // A opts in, B has not: no face-offs yet
    await request(app).post(`/api/rivalries/${rivalryId}/opt-in`).set(auth(ownerA.token));
    const blocked = await request(app)
      .post(`/api/rivalries/${rivalryId}/faceoffs`)
      .set(auth(ownerA.token))
      .send({ question: 'Who runs the summer?', closesInHours: 24 });
    expect(blocked.status).toBe(403);

    // B opts in: face-off allowed
    await request(app).post(`/api/rivalries/${rivalryId}/opt-in`).set(auth(ownerB.token));
    const fo = await request(app)
      .post(`/api/rivalries/${rivalryId}/faceoffs`)
      .set(auth(ownerA.token))
      .send({ question: 'Who runs the summer?', closesInHours: 24 });
    expect(fo.status).toBe(201);

    const voter = await createUser({});
    const v1 = await request(app)
      .post(`/api/rivalries/faceoffs/${fo.body.faceOff.id}/vote`)
      .set(auth(voter.token))
      .send({ side: 'A' });
    expect(v1.status).toBe(200);
    expect(v1.body.faceOff.votesA).toBe(1);

    const v2 = await request(app)
      .post(`/api/rivalries/faceoffs/${fo.body.faceOff.id}/vote`)
      .set(auth(voter.token))
      .send({ side: 'B' });
    expect(v2.status).toBe(409); // one vote per user
  });
});
