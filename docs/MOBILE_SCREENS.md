# Mobile screen inventory (parity with web, mobile IA)

## Tabs (5)
| Route | Purpose |
|-------|---------|
| `(tabs)/index` | Home + Discover (rankings, campaigns, live, …) |
| `(tabs)/explore` | Category discovery |
| `(tabs)/feed` | Moments feed |
| `(tabs)/wallet` | Token packs |
| `(tabs)/you` | Account, settings, help, legal hub |

## Stack screens
| Route | Purpose |
|-------|---------|
| `login` | Auth |
| `register` | Create account |
| `forgot-password` | Reset request |
| `favorite/[handle]` | Favorite + gifts + wall |
| `moments/[id]` | Moment detail |
| `u/[handle]` | Fan profile |
| `search` | Search Favorites |
| `rankings` | Rally Score rankings |
| `campaigns` / `campaigns/[id]` | Charity |
| `live` | Live rooms |
| `dashboard` | Favorite hub |
| `dashboard/earnings` | Gift Points |
| `dashboard/payouts` | Payout requests |
| `dashboard/verify` | KYC |
| `onboarding` | Go-live checklist |
| `notifications` | Alerts |
| `support` | Reports |
| `how-to-use` | Guide |
| `faq` / `about` / `privacy` / `terms` | Help & legal |
| `rivalries` / `giveaways` | Community |
| `compose-moment` | New Moment |

## IA notes
- Rankings/Campaigns/Live live under **Home → Discover**, not the tab bar.
- Privacy/Terms/FAQ/About live under **You → Legal / Help**.
- Session: 7-day inactivity enforced by API + `lib/session.ts`.
