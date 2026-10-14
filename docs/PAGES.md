# Web page inventory (hard cap: 30)

| # | Path | Purpose |
|---|------|---------|
| 1 | `/` | Home |
| 2 | `/login` | Log in (7-day inactivity session) |
| 3 | `/register` | Register |
| 4 | `/forgot-password` | Password reset request |
| 5 | `/explore` | Discovery |
| 6 | `/feed` | Home feed |
| 7 | `/f/[handle]` | Favorite + gifts + wall |
| 8 | `/moments/[id]` | Moment detail |
| 9 | `/wallet` | Tokens |
| 10 | `/search` | Search |
| 11 | `/rankings` | Rally Score rankings |
| 12 | `/campaigns` | Charity list |
| 13 | `/campaigns/[id]` | Campaign detail |
| 14 | `/u/[handle]` | Fan profile |
| 15 | `/dashboard` | Favorite hub |
| 16 | `/dashboard/earnings` | Earnings |
| 17 | `/dashboard/payouts` | Payouts |
| 18 | `/dashboard/verify` | KYC |
| 19 | `/onboarding` | Go-live checklist |
| 20 | `/settings` | Settings |
| 21 | `/how-to-use` | Guide |
| 22 | `/faq` | FAQ |
| 23 | `/support` | Support / reports |
| 24 | `/privacy` | Privacy |
| 25 | `/terms` | Terms |
| 26 | `/about` | About |
| 27 | `/notifications` | Alerts |
| 28 | `/rivalries` | Rivalries |
| 29 | `/giveaways` | Giveaways |
| 30 | `/live` | Live sessions |

**Total: 30 pages (at cap).**

## Session policy

- Authenticated activity updates `lastActiveAt` on the server.
- After **7 days without activity**, API returns 401 and clients clear the token.
- JWT max lifetime defaults to 30d; **inactivity is the binding rule**.
