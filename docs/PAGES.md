# Web page inventory (hard cap: 30)

| # | Path | Purpose |
|---|------|---------|
| 1 | `/` | Home / marketing |
| 2 | `/login` | Auth |
| 3 | `/register` | Auth + role |
| 4 | `/explore` | Discovery by category |
| 5 | `/feed` | Home Moments feed |
| 6 | `/f/[handle]` | Favorite page + gifts + wall |
| 7 | `/moments/[id]` | Moment detail |
| 8 | `/wallet` | Token packs & balance |
| 9 | `/search` | Search Favorites |
| 10 | `/rankings` | Category/country rankings |
| 11 | `/campaigns` | Charity campaign list |
| 12 | `/campaigns/[id]` | Campaign detail + transparency |
| 13 | `/u/[handle]` | Fan profile + upgrade progress |
| 14 | `/dashboard` | Favorite hub |
| 15 | `/dashboard/earnings` | Gift Points & payouts |
| 16 | `/settings` | Locale, spend cap, safety, logout |
| 17 | `/how-to-use` | Product guide |
| 18 | `/faq` | FAQs |
| 19 | `/support` | Help & reports |
| 20 | `/privacy` | Privacy policy |
| 21 | `/terms` | Terms of use |
| 22 | `/about` | Vision / mission |
| 23 | `/notifications` | In-app alerts |
| 24 | `/rivalries` | Rivalry / banter (P1 surface) |
| 25 | `/giveaways` | Spend-neutral giveaways (P1 surface) |

**Total: 25 pages** (under 30).

Dynamic segments (`[handle]`, `[id]`) count as one page template each, not unlimited routes.

## PRD surface coverage (UI + API)

- Accounts, Favorite pages, Tokens/Gifts, Moments, Feed, Wallet
- Charity campaigns, Rankings narrative, Rivalries, Giveaways
- Settings, legal, FAQ, how-to, support
- Backend: auth, users, favorites, tokens, gifts, moments, feed, campaigns, notifications
- Schema: taxonomy, badges, earnings, payouts, reports, beneficiaries

Full live payment, KYC, live video, and multi-language packs ship via providers/config — models and pages are in place.
