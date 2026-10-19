# Product Requirements Document: Rally – Fan Support Platform (v2.0)

**Status:** Draft v2.0 (full rewrite) | **Owner:** Product | **Last updated:** October 14, 2026

*Rally is a working name. This version folds every decision made so far into one consistent document. Section 17 lists every open question with a recommended answer, and those answers are already reflected in the requirements below.*

## 1. Overview

Rally is a platform where fans show visible, meaningful support for the creators, artists, athletes, and public figures they love ("Favorites"). Fans buy Tokens and send Gifts, join fan clubs, share and react to Moments, take part in friendly rivalries, donate to causes their Favorites champion, and earn recognition for how devoted they are. Favorites get a branded home, an income from the Gifts they receive, a direct line to their community, and tools to give back. Anyone can also grow from fan into Favorite, and Favorites are fans of other Favorites too.

**Vision:** Make supporting someone you love as easy, rewarding, and meaningful as following them.

**Mission:** Turn passive fandom into active, recognized, and sustainable support, for every kind of Favorite, in every language.

### 1.1 Product Pillars

1. **Gifts, not cash.** Fans express support with Tokens and Gifts, never direct money transfers between people.
2. **Every Favorite, every field.** A gospel choir, an Afrobeats star, a beat producer, a comedian, a novelist, and a village tailor all get a first-class page, ranking lane, and tools.
3. **Moments and feeds.** Highlights from a Favorite's life become shared events fans can react to, support, and revisit.
4. **Recognition by devotion, not wealth.** Standing, giveaways, and community roles reward showing up and caring, never spending alone.
5. **Energy without harm.** Rivalries, comparisons, and rankings make fandom lively, with safeguards that keep them fair and safe.
6. **Giving back.** Favorites can raise money for orphanages, schools, health, and public development, paid straight to verified organizations and never to themselves.
7. **Global by default.** Multiple languages, local payment methods, and country rankings are core features.
8. **A two-way community.** Fans can become Favorites, and Favorites remain fans of other Favorites.

## 2. Problem Statement and Opportunity

For fans:
- Support is scattered across likes, merch stores, ticket sites, and payment links, with no single place to show devotion.
- A day-one supporter looks the same as a new follower, and the biggest spender often gets the most recognition.
- Direct access is rare, and fan communities are split across platforms and languages.

For Favorites:
- Income depends on algorithms and ad revenue they do not control.
- They lack tools to identify, reward, and talk to their most loyal fans.
- Existing creator tools suit one type of creator, and rarely fit musicians, producers, athletes, writers, or artisans equally well.

**Opportunity:** One platform that combines gifts, community, recognition, rankings, and giving, and treats fandom itself as a measurable, positive relationship.

## 3. Goals, Non-Goals, and Principles

### 3.1 Goals
1. A fan can send a Gift in under 30 seconds once Tokens are in the wallet, and donate to a charity campaign in under 60 seconds.
2. A Favorite can launch a branded page, Moments, and an earnings dashboard in under 10 minutes.
3. Recognition and giveaways reward activeness, dedication, and passion, never spending alone.
4. Every launch industry feels fully served, not forced into a generic creator mold.
5. The platform is safe, with low toxicity, fast moderation, and strong fraud controls.
6. Take rates are sustainable while Favorites keep a competitive share.

### 3.2 Non-Goals (v1)
- A general-purpose social network or an algorithmic feed that competes with existing social platforms.
- Long-form video hosting at scale, ticketing logistics, or crypto and NFT assets.
- Direct cash transfers between people, or any way to withdraw Tokens.

### 3.3 Design Principles
- **Money buys expression, not standing.** Spending never decides giveaway odds, upgrade eligibility, or rank.
- **Transparent by default.** Rates, fees, ranking methods, and giveaway rules are explained in plain language.
- **Opt-in for anything spicy.** Rivalries, banter, and giveaways are opt-in for all who appear in them.
- **Safe energy.** Heat is monitored, and the platform steps in before banter becomes abuse.
- **Local first.** Local languages, currencies, and payment methods are built in.
- **Fans own their story.** History, badges, and collections survive role changes.

## 4. Users and Personas

| Persona | Who they are | What they need |
| --- | --- | --- |
| **Ada the Devoted** (fan) | 18 to 34, follows several Favorites, spends small recurring amounts | Her loyalty seen, a chance to be noticed, Gifts that feel personal |
| **Tunde the Casual** (fan) | Follows many Favorites, rarely spends | One-tap Gifts on moments he loves, and fair chances in giveaways |
| **Mia the Emerging Artist** (Favorite) | A gospel and Afro-fusion singer with 20,000 followers | Steady income, a direct line to core fans, minimal admin |
| **Coach K the Established Name** (Favorite) | A well-known public figure with a team | Verification, brand safety, moderation controls, detailed analytics |
| **Bisi the Rising Creator** (fan upgrading) | A fan who built an audience on Rally with fan art and skits | A clear path to Favorite status and fair review |
| **Mia as a fan** (Favorite who is also a fan) | Mia follows, gifts, and learns from other Favorites | To support peers and be a normal fan without confusion or conflicts |
| **Managers and moderators** | Staff and trusted fans who run a page or community | Delegated permissions and moderation tools |
| **Verified beneficiaries** | Registered orphanages, schools, clinics, and community projects | Reliable, transparent funding and impact reporting |
| **Trust and safety, finance, and admin staff** | Rally employees and vendors | Review queues, audit trails, and risk dashboards |

## 5. Product Model

### 5.1 Core Concepts

| Concept | Meaning |
| --- | --- |
| **Favorite** | Any creator, artist, athlete, group, brand, or public figure receiving fan support |
| **Fan** | Any user who follows or supports Favorites; every Favorite is also a fan, with one identity |
| **Token** | A closed-loop currency bought by fans and spent on Gifts; it cannot be withdrawn or sold |
| **Gift** | A visible, animated item sent with Tokens to a Favorite (or a cosmetic keepsake sent to a fan) |
| **Gift Points** | What a Favorite earns from Gifts, converted to cash at a published rate |
| **Moment** | A time-stamped highlight card tied to a Favorite that fans can react to and support |
| **Specialty** | The most detailed level of the Industry, Category, Specialty taxonomy |
| **Giveaway** | A Favorite-funded cash pool awarded to opted-in fans by weighted random draw |
| **Charity campaign** | A fundraiser for a verified beneficiary, never for a Favorite |
| **Rally Score** | The within-category ranking score built from reach, growth, loyalty, engagement, and fan polls |

### 5.2 Money Flows

| Flow | Who pays | Where the money sits | Who receives | Cash-out |
| --- | --- | --- | --- | --- |
| Token purchase and Gifts | Fan, with a local payment method | Token wallet, then recorded as Gift Points | Favorite, as Gift Points | Payout to a verified bank or mobile money account |
| Subscriptions and store | Fan, in currency or Tokens | Held until settled | Favorite, net of fees | Same payout path |
| Charity donations | Donor, in currency (Tokens later via Charity Gifts) | Segregated escrow, separate from all other funds | Verified beneficiary, directly | None for Favorites; paid to the organization |
| Giveaway pool | Favorite, in currency or from available earnings | Escrow, funded in full before the announcement | Winners, in cash after identity checks | Payout to the winner's verified account |
| Fan-to-fan Token Gifts | Fan, in Tokens | Recipient's gifted balance | Recipient, spendable only as Gifts to Favorites or charity gifts | None |

There are no direct person-to-person cash transfers anywhere in the product.

### 5.3 One Identity for Everyone

Every user has one account that can act as a Fan, as a Favorite, or both. There is no separate fan identity and no mode to switch: a Favorite keeps the same profile, follow list, and history, and the Favorites a fan follows remain their Favorites after they become one. Details are in Section 7.1.

## 6. Scope and Priorities

| Area | MVP (P0) | Phase 2 (P1) | Phase 3 (P2) |
| --- | --- | --- | --- |
| Accounts and roles | Sign-up, one identity for fans and Favorites, Favorite verification | Team roles, Favorite's Picks | Junior Favorite program |
| Categories | Three-level taxonomy and profile templates for all launch industries | Credits graph, fan-suggested categories | City and region lanes |
| Gifts and payouts | Token wallet, standard and category Gifts, Gift Points, payouts | Signature, limited-edition, group, and live Gifts | Prizes in Tokens |
| Fan upgrade and fan-to-fan | None | Fan upgrade path, Fan Gifts, Token Gifts | Junior program |
| Recognition | Supporter wall, automated badges | Leaderboards, supporter levels, Translator badge | None |
| Moments and feeds | Favorite Moments, Home and Favorite feeds, chronological toggle | Fan Moments, Collections, Moments rail, category and country feeds, For You | Platform-wide trend tools |
| Community and clubs | Reactions and comments | Community spaces, fan club subscriptions, gated posts, polls | Live audio and video sessions |
| Commerce | None | Digital store, commissions, custom orders | Merch fulfillment, brand sponsorships |
| Charity | Verified beneficiary directory and currency donations (small set) | Charity Gifts, Impact badges, Giving board | More beneficiary categories |
| Giveaways | None | Cash giveaways with weighted draw (market by market) | Sponsor-funded giveaways |
| Rivalries and rankings | None | Rivalry Hub, Face-Offs, Fandom Battles, Banter Channels, Beef Radar, compare tool, rankings | Region rankings, predictions with prizes where legal |
| Multi-language | Launch languages, translation toggle, RTL, per-language moderation | Community translation | More languages |
| Safety and admin | Reporting, block, mute, admin queue, fraud basics | Advanced brigading detection, audits | Public API for trust data |
| Discovery and notifications | Search, Category pages, push and email | Recommendations, Rising, Newcomers | Embeds and public API |

## 7. Functional Requirements

### 7.1 Accounts, Identity, and Roles

- **ACC-1:** Users register with email, phone number (OTP), Google, or Apple. A verified phone or social login is required before the first Token purchase. There is no anonymous guest checkout, because Tokens sit in a wallet; visitors can browse pages without an account.
- **ACC-2:** Every user has one identity. Everyone is a fan, and a Favorite is a fan who also has a Favorite page, with no separate fan account and no mode switch (7.1.1).
- **ACC-3:** Favorites verify through one of two routes: direct application (identity plus proof of an established presence) or the fan upgrade path (7.3). Reviewers decide within 3 business days.
- **ACC-4:** Handles are unique, and names of well-known figures are reserved for verified claimants.
- **ACC-5:** Users control profile visibility and whether they appear by name or anonymously on supporter walls and leaderboards.
- **ACC-6:** Minimum age is 13, or the local minimum. Ages 13 to 17 may join as fans with low spend caps, guardian consent where required, restricted feeds, and no rivalry content. Payouts, Token Gifts, cash prizes, and Favorite status are 18 and over in v1.
- **ACC-7:** Favorites can add team members (managers, moderators) with scoped permissions and an audit log (Phase 2).
- **ACC-8:** Users can export their data and delete their account, with the legal retention of financial records.

#### 7.1.1 Favorites as Fans of Other Favorites

Every Favorite is also a fan. Mia, a gospel singer, can follow a rapper, send Gifts to a producer, join a comedian's fan club, and enter a giveaway, all from the same login. These rules keep it clean and fair.

- **ROL-1:** A Favorite is always also a fan and can follow, react, comment, join clubs, send Gifts, and enter giveaways on other pages. Activity may carry an optional "Favorite" badge so fans know a peer is supporting.
- **ROL-2:** Tokens are bought with money, like any fan. **Gift Points can never be converted into Tokens;** they only leave as cash payouts. This blocks Gift-swapping loops. A Favorite can use cash from earnings to fund a giveaway.
- **ROL-3:** A person has one history. Everything they did as a fan stays on their profile, including the Favorites they follow and support, clubs, Collections, badges, and levels. A Favorite's own fan activity never counts toward their Rally Score, and self-gifting between accounts the same person controls is blocked.
- **ROL-4:** Gifts from Favorites count toward the receiving Favorite's unique supporters, with a cap per giver. Reciprocal gifting (A to B and B to A in a window) is detected and excluded from rankings. Pages can show a "Supported by Favorites" strip.
- **ROL-5:** A Favorite can enter another Favorite's giveaway under the same rules as any fan, and is excluded if linked to the sponsoring Favorite by team, family, collective, or shared devices or payout accounts.
- **ROL-6:** By default, a Favorite's follow list and fan activity are visible only within the communities they act in. They can hide any item, and choose what appears publicly in **Favorite's Picks** (ROL-9).
- **ROL-7:** Favorites acting as fans in rivalries and banter follow a stricter public-figure standard. Pile-ons, or using their Favorite page to direct followers at someone, can affect Favorite status.
- **ROL-8:** There is one inbox and one notification stream, with filters for fan and Favorite activity. The wallet shows Tokens and earnings as two balances side by side and never merges them.
- **ROL-9: Favorite's Picks** (Phase 2): a Favorite can list Favorites they are fans of, with a short note. These feed discovery ("Fans of X also support").
- **ROL-10:** Moderating another Favorite's community requires an explicit appointment by that Favorite.

### 7.2 Categories and Favorite Pages

Rally must serve every kind of Favorite with the same quality of page, Gifts, Moments, and rankings. Each Favorite is placed in a three-level taxonomy: **Industry, then Category, then Specialty**. Comparisons, rankings, and discovery work at the Category and Specialty level, so an Afrobeats singer is compared with other Afrobeats singers, and a producer with other producers.

| Industry | Categories and example specialties | Signature page modules |
| --- | --- | --- |
| Music | Afrobeats and Afrobeat, Afro-fusion, Amapiano, Highlife, Fuji and Juju; gospel and worship (choirs, worship leaders, gospel rap); hip hop and rap (trap, drill, conscious, street); R&B and soul; pop; reggae and dancehall; rock; electronic and DJs; traditional and folk | Releases, streaming links, tour dates, lyric and credit pages, collaborations |
| Music production and songwriting | Producers and beatmakers, mixing and mastering engineers, songwriters, instrumentalists, arrangers | Credits graph, beat catalog, service menu, collaboration requests |
| Film and TV | Actors, directors, producers, scriptwriters, cinematographers, editors, voice actors, across regional industries | Filmography, upcoming projects, behind-the-scenes Moments |
| Streaming and gaming | Live streamers, esports players and teams, game developers, reviewers | Stream schedule, live link, clips |
| Influencers and lifestyle | Fashion, beauty, fitness, travel, food, parenting, tech reviewers, motivational and faith speakers | Collaboration menu, brand-safety profile, link hub |
| Comedy | Stand-up, skit makers, sketch groups, MCs and hosts, impressionists | Show dates, clip library, bits and catchphrases |
| Content creators | Video creators, podcasters, educators, commentators, bloggers | Series pages, episode Moments, resources |
| Writers and publishing | Novelists, poets, journalists, screenwriters, serial writers, spoken-word artists | Book shelf, excerpts and serial chapters |
| Visual arts and design | Painters, illustrators, photographers, sculptors, graphic and fashion designers, animators | Portfolio, commissions, prints store |
| Artisans and crafts | Tailors, weavers, potters, woodworkers, jewelers, leatherworkers, hairstylists, makeup artists, bakers and caterers | Work-in-progress Moments, custom orders, local pickup details |
| Dance and performance | Dancers, choreographers, theatre actors, troupes | Performance calendar, choreography clips, classes |
| Sports | Athletes by sport, coaches, clubs and teams, trainers | Fixtures, results, match Moments |
| Food and culinary | Chefs, home cooks, food entrepreneurs | Recipes, menu drops, pop-ups |
| Public life and business | Entrepreneurs, advocates, thought leaders, community leaders | Updates, causes, speaking calendar |
| Groups and brands | Bands, crews, studios, labels, teams, collectives | Member pages, group credits, earnings splits |

The taxonomy sits in an admin-managed table, so categories can be added without a release.

- **CAT-1:** Every Favorite picks one primary specialty and up to three secondary ones. Multi-hyphenate Favorites (a rapper who is also a producer and an actor) appear in each lane with separate scores.
- **CAT-2:** A Favorite is an individual, a group, or a brand or studio. Groups have member profiles and a configurable split of Gift Points among members.
- **CAT-3:** Each specialty has a profile template with its own fields and page modules. Templates are editable.
- **CAT-4:** A **Credits graph** links Favorites who worked together (a producer on a song, a director on a film). Credits need confirmation from both sides. Collaborating Favorites can co-host Moments, with Gifts split by agreed percentages.
- **CAT-5:** Fans can suggest a missing specialty. Suggestions with enough demand go to review within 14 days.
- **CAT-6:** Each specialty can have its own Moment types, Gift catalog entries, ranking lane, and compare metrics. Comparing writers can use serial chapter readership, and comparing streamers can use live hours.
- **CAT-7:** Local and regional scenes are first-class. A specialty can be scoped to a language or region, such as Yoruba gospel or Francophone hip hop.
- **CAT-8:** A specialty with too few Favorites for meaningful rankings shows a **Spotlight** list until it reaches a minimum size.
- **CAT-9:** Rally does not host full copyrighted music or film. Music pages use licensed short clips and links to licensed platforms. Writers and artisans keep all rights to their uploads.
- **CAT-10:** Onboarding asks one question, "What do you do?", with a searchable, translated list of specialties.
- **CAT-11:** Verification fits the field: media coverage and platform links for artists, credits for producers and film professionals, portfolio and customer references for artisans, publication records for writers.
- **CAT-12:** A Favorite page shows name, avatar, cover, bio, categories, link hub, supporter count, a primary **Send a Gift** button, up to five featured Gifts, pinned posts, a timeline of Moments, and a share card with a short URL.

### 7.3 Becoming a Favorite: The Fan Upgrade Path (Phase 2)

A fan who builds a real audience and body of work on Rally can request Favorite status once a threshold is met, so talent is discovered on the platform and not only imported.

| Signal | Default threshold | Why it matters |
| --- | --- | --- |
| Account age | 30 days or more | Blocks throwaway accounts |
| Identity and age | Verified phone and identity check; 18 or over | Required for payouts and safety |
| Published work | At least 10 posts, Fan Moments, or work samples in a chosen specialty | Shows a real body of work |
| Audience | At least 100 followers who are verified, active human accounts (50 for artisans, writers, and other small specialties) | Shows real interest |
| Engagement reach | At least 50 different accounts reacted or commented in the last 60 days | Shows the audience is not passive or fake |
| Community standing | No active strikes in the last 90 days | Protects the community |
| Profile quality | Specialty, bio, avatar, and one link or sample of the work | Lets reviewers judge quickly |

**No money signal ever counts:** Tokens bought, Gifts sent, or donations made never help anyone qualify. Thresholds are configurable per specialty and country and reviewed quarterly.

- **UPG-1:** A **Favorite Progress** meter shows each signal's status in plain language, in the fan's language. A **Request Favorite status** button appears once all are met.
- **UPG-2:** The request captures specialty choice, a short pitch, work samples, references, and a declaration of any relationship with other Favorites.
- **UPG-3:** Automated screening (fake and duplicate accounts, follower authenticity, work originality, impersonation) runs before a human reviewer who knows the field decides within 3 business days. Declines include reasons and allow reapplying after 30 days. Conditional results ask for more proof.
- **UPG-4:** Approved fans keep one identity and everything in it: the Favorites they follow and support, clubs, followers, badges, and collections stay exactly as they were, nothing needs to be re-followed, and they enter the **Rising** cohort.
- **UPG-5:** A 30-day probation limits payouts and disables new giveaways while a second review checks the audience and work. Status can be revoked for fraud, impersonation, or serious violations.
- **UPG-6:** Follow-for-follow rings, purchased followers, and engagement pods are detected and removed from the signals; involved accounts can be barred from reapplying.
- **UPG-7:** Under-18 users cannot become Favorites in v1. A guardian-consent Junior Favorite program without payouts is a Phase 3 option.
- **UPG-8:** Decisions are audited monthly for consistency across countries, languages, and specialties.

### 7.4 Tokens, Gifts, and Payouts (MVP)

Fans buy **Tokens** and use them to send **Gifts**. Favorites earn **Gift Points** and cash out through verified payouts. Tokens are a closed loop: they can be bought and spent, never withdrawn or sold.

| Gift type | Description |
| --- | --- |
| Standard | Low-priced, always available (heart, clap, flame, drum) |
| Category | Fits a field (microphone, trophy, book, needle and thread) |
| Signature | Made by a Favorite with their art, sound, or catchphrase (Phase 2) |
| Cultural and regional | Local festivals, symbols, and slang per market and language |
| Limited-edition | Time-boxed and numbered for drops and anniversaries (Phase 2) |
| Combo and big | High-value animated gifts for live sessions and milestones (Phase 2) |
| Group | Several fans pool Tokens to unlock one big Gift (Phase 2) |

- **GFT-1:** Fans buy Token packs with cards, bank transfer, mobile money, or other local methods. Prices show in local currency with the Token rate disclosed.
- **GFT-2:** Tokens cannot be withdrawn or sold. They move between fans only as limited Token Gifts (7.5). Terms say so plainly in every supported language.
- **GFT-3:** A Gift can be sent from a Favorite's page, a Moment, a post, a rivalry page, or a live session. Each Gift records who, to whom, where, and when. Gifts show with animation and the fan's name or anonymously, and appear on the supporter wall.
- **GFT-4:** Favorites receive a stated share of each Gift's Token value as Gift Points (the target is at least 60% on web purchases, see 9.2). Rally publishes the rate in plain language. Gift Points convert to cash at a published rate shown before each payout request.
- **GFT-5:** Payouts go to a verified bank or mobile money account after identity and payout checks. The default schedule is weekly, with on-demand payouts above a minimum for a small fee. Earnings dashboards show pending and available balances and exportable statements.
- **GFT-6:** Purchased Tokens do not expire. Bonus and gifted Tokens expire after 12 months, subject to local law.
- **GFT-7:** Unspent Tokens are refundable within a stated window and where the law requires. Spent Tokens are refundable only for failed delivery, duplicate purchases, or unauthorized transactions.
- **GFT-8:** Minor accounts have strict daily and monthly Token caps and cannot send high-value Gifts. Every fan can set personal spending limits and receives soft reminders as they near them.
- **GFT-9:** Gift messages (280 characters) are moderated like comments. Messages that name or attack another person are blocked or held.
- **GFT-10:** Live sessions support real-time Gifts, on-screen animations, a live leaderboard, and a pause switch for the Favorite or host.
- **GFT-11:** Subscriptions and store items can be paid with Tokens or local currency. There are no direct cash tips.
- **GFT-12:** Fraud controls cover stolen cards, Token laundering, refund abuse, collusion between a Favorite and a fan, and gift-for-service schemes. Suspicious Gifts are held and the Gift Points stay pending until cleared.
- **GFT-13:** Before launch in each market, counsel confirms how Tokens are treated (e-money or stored value), what licensing, KYC, and reserve rules apply, and how tax treats Gift Points and payouts.

### 7.5 Fan-to-Fan Gifting (Phase 2)

| Kind | What the recipient gets | Cash-out | Where it can be spent |
| --- | --- | --- | --- |
| **Fan Gift** | A cosmetic keepsake in their profile collection | None, no Gift Points | Not spendable |
| **Token Gift** | Tokens in a separate **gifted balance** | None | Only on Gifts to Favorites, group Gifts, and Charity Gifts; never re-gifted |

Fan Gifts and Token Gifts work for Welcome Gifts to new members, Thank-you Gifts for helpful fans, birthdays, and Fandom Gifts where fans pool Tokens.

- **FFG-1:** Fan Gifts come from a cosmetic catalog priced in Tokens, and the recipient controls what shows on their profile.
- **FFG-2:** Token Gifts stay in a labeled gifted balance that cannot be withdrawn, refunded, sold, or sent on.
- **FFG-3:** Daily, monthly, and per-recipient limits scale with account age and verification. Both sides need a verified phone, and minors cannot send or receive Token Gifts.
- **FFG-4:** By default, a fan receives gifts only from people they follow or share a community with. Fans can switch to anyone or nobody, decline any gift, and block senders.
- **FFG-5:** Gift messages are moderated. A gift to someone who blocked the sender is impossible, and an abusive gift message counts as a violation.
- **FFG-6:** Link analysis (shared devices, payment instruments, addresses, sudden clusters) flags laundering and off-platform resale. Flagged transfers are held.
- **FFG-7:** When gifted Tokens are spent on a Favorite, the Gift is attributed to the spender, with an optional "gifted by" label. Fan-to-fan gifts and gifted balances never count toward rankings, supporter levels, upgrade thresholds, or giveaway selection.
- **FFG-8:** A sender can recover unspent Tokens from an unaccepted gift within 72 hours. Accepted gifts are final.
- **FFG-9:** Scam warnings appear in the composer, selling services or favors for gifts is prohibited, and repeat violators lose fan-to-fan gifting first.

### 7.6 Recognition and Supporter Standing

Recognition celebrates fans. Some of it reflects what fans gave and some reflects how they showed up, and **none of it feeds giveaways, upgrade thresholds, or rankings.**

- **REC-1:** Automated badges reward First Supporter, Day One, Top 10, tenure, participation streaks (never punishing breaks), Translator, and Impact.
- **REC-2:** Per-Favorite supporter levels (Bronze to Diamond) are based on cumulative Gifts, with thresholds each Favorite can configure.
- **REC-3:** The supporter wall shows recent and top supporters per Favorite. Leaderboards run weekly, monthly, and all-time and respect anonymity, showing "Anonymous Fan" with rank only.
- **REC-4:** Favorites can award custom badges, pin or highlight a fan's message, and welcome new fans.
- **REC-5:** A Favorite's own giveaway, upgrade, and ranking rules never use REC-2 levels or REC-3 positions as inputs.

### 7.7 Moments and Feeds

Moments turn the highs of a Favorite's career into shared events fans can react to, support, and revisit. Feeds decide how fans find them.

| Moment type | Created by | Example |
| --- | --- | --- |
| Favorite Moment | Favorite or team | A release, match win, award, milestone, announcement |
| Fan Moment (Phase 2) | A fan, approved by the Favorite or moderators | Concert photo, fan art, tribute, reaction clip |
| Platform Moment | Rally, with the Favorite's approval | "1,000th supporter", "Top-ranked this week", a goal reached |
| Live Moment | Favorite, during a live session or event | A performance, a goal, a surprise guest |

- **MOM-1:** A Favorite posts a Moment in under 30 seconds with a title, one media item, an optional category tag, and a visibility setting.
- **MOM-2:** Each Moment has its own page with a share card, reactions, comments, a **Send a Gift** button, and a live counter. Gifts on a Moment are attributed to both the Moment and the Favorite, and the Favorite sees which Moments drive the most support.
- **MOM-3:** Moments are either 24-hour flash Moments or permanent. Permanent Moments form a **Timeline** on the Favorite's page so fans can scroll a career in order.
- **MOM-4:** Fan Moments pass through an approval queue. Favorites and delegated moderators can feature, hide, or credit them. Fans keep credit and can remove their own.
- **MOM-5:** Fans save Moments to **Collections** and share a Collection as a link.
- **MOM-6:** Moment media carries provenance (original poster, timestamp, edit label), and re-posted clips link back to the source.

| Feed | Contents | Default ordering |
| --- | --- | --- |
| Home | Posts and Moments from Favorites the fan follows or supports | Recency and relevance, with a chronological toggle |
| Moments rail | Current and recent Moments from followed Favorites | Newest first, live Moments pinned |
| For You (Phase 2) | Favorites and Moments the fan has not followed yet | Relevance with diversity limits |
| Favorite feed | Everything from one Favorite, filterable | Pinned first, then newest |
| Category and country feeds (Phase 2) | Moments and rising Favorites in a category or country | Trending in the last 7 days |
| Rivalry feed (Phase 2) | Active face-offs and debates | Opt-in only |

- **FED-1:** Fans can mute a Favorite, topic, keyword, or content type (such as rivalry content) without unfollowing.
- **FED-2:** Every feed offers a plain chronological view, and the choice persists.
- **FED-3:** Recommended content is labeled, with a **Why am I seeing this?** explanation.
- **FED-4:** Diversity rules stop one Favorite or fandom from taking over a feed. A fan's spending never changes how visible a Favorite's Moments are to other fans, and boosted content is always labeled.
- **FED-5:** The first screen loads in under 2 seconds on a typical 4G connection, with cached content and queued reactions offline.
- **FED-6:** Content respects each viewer's language and translation settings (7.14).
- **FED-7:** No infinite autoplay by default, a gentle break prompt after long sessions, and no streak mechanics that punish missed days. Minor accounts get restricted feeds and no spending prompts tied to Moments.

### 7.8 Community and Content

- **COM-1:** Each Favorite has a feed with posts by the Favorite and, if enabled, fans in designated channels.
- **COM-2:** Posts support text, images, audio clips, links, and polls. Visibility can be Public, Followers, All Supporters, or specific Tiers.
- **COM-3:** Fans react, comment, and reply. Favorites and delegated moderators can pin, hide, or delete.
- **COM-4:** Comments pass automated toxicity filtering and a configurable keyword blocklist. Favorites can restrict who may comment.
- **COM-5:** Community spaces (Phase 2) give each Favorite channels for general chat, fan art, translations, and events.

### 7.9 Fan Clubs, Store, and Commissions (Phase 2)

- **SUB-1:** Favorites define up to five fan club tiers with price, name, description, and perks. Subscriptions auto-renew, and failed payments retry on a schedule with fan notifications.
- **SUB-2:** Fans upgrade, downgrade, pause, or cancel, with clear proration.
- **SUB-3:** Favorites list digital items (downloads, personalized messages, access links) with a title, preview, price, and delivery type. Fans keep a library with re-download.
- **SUB-4:** Personalized items and services (a shoutout, a custom beat, a commissioned portrait, a tailored outfit) use an order queue with a Favorite-set delivery window, delivery proof, and automatic refund if undelivered.
- **SUB-5:** Services are sold only through the store, never exchanged for Gifts. This keeps Gifts as expression and prevents gift-for-service schemes.
- **SUB-6:** Perks for subscribers (content, early access, badges) are separate from giveaways. A giveaway can never be restricted to paying members.

### 7.10 Charity Campaigns

Favorites can rally fans to raise money for orphanages, schools, health care, and public development. Donations go to the verified organization, never to the Favorite, and Favorites do not use fundraising for personal gain.

Principles: never personal; verified beneficiaries only; transparent from start to finish; safe for children.

How it works. A Favorite selects a beneficiary from the Verified Beneficiary Directory or nominates one. Rally verifies the organization and cause, then approves the campaign. Fans donate in local currency (Charity Gifts bought with Tokens arrive in Phase 2). Money sits in a segregated account and is paid directly to the organization, in full or in stages against receipts. The organization and Favorite post proof of impact, and Rally publishes an impact summary.

**Beneficiary verification:** proof of legal registration checked against official registries; a bank account in the organization's own name; identity and sanctions checks on officers; evidence of operations (vetted local partner visit, recent financials or audit, references); independent due-diligence review for campaigns above the threshold; re-verification every 12 months.

**Child safeguarding.** Some institutions that call themselves orphanages harm children or exploit donor goodwill, so extra rules apply: current child-protection policy, staff vetting records, and government registration; preference for programs that support family and community care; no identifiable photos or videos of children without verified guardian consent, and none showing distress; no visits or contact with children as a reward; and updates that avoid naming or locating children.

- **CHR-1:** Campaigns are either **Fixed goal** (funds released at the goal or deadline) or **Ongoing cause** (periodic payouts). The keep-what-you-raise model does not exist.
- **CHR-2:** The payee is always the verified organization. The system blocks payout destinations that match a Favorite, team, family, or linked accounts, and flags near matches (shared address, phone, bank).
- **CHR-3:** A Favorite's own foundation is **not** allowed as a beneficiary at launch. This is revisited after Rally has a clean audit record.
- **CHR-4:** Donations carry only processing costs. Rally waives its own fee, and donors see this before paying.
- **CHR-5:** A transparency page shows total raised, fees, payouts with dates, receipts or proof of use, and impact updates. An organization that fails to report within 60 days of a payout is paused from new campaigns.
- **CHR-6:** A Favorite may voluntarily pledge a share of their own earnings to a campaign, paid through the same verified path and shown on the page. Regular Gift Points never redirect automatically.
- **CHR-7:** If a campaign misses its goal, funds go to the organization on the stated terms, or are returned if all-or-nothing. If an organization is suspended, donors are told and funds are redirected to a similar verified cause or refunded.
- **CHR-8:** Donors get receipts, and tax-deductible receipts where law and the beneficiary allow.
- **CHR-9:** **Impact badges** recognize giving and completed campaigns. A separate **Giving board** shows charity activity, and donations never count toward the Rally Score.
- **CHR-10:** Claims are checked for misleading content, with fraud monitoring for duplicate campaigns, fake organizations, and sudden changes in payout details. Fans can report any campaign, and reports can pause it.
- **CHR-11:** Beneficiary categories at launch: orphanages and child welfare, education and scholarships, health and medical, emergency and disaster relief, clean water and sanitation, community infrastructure, food security, and environment.
- **CHR-12:** Governance includes dual approval on large disbursements, an annual independent audit with a public summary, a complaints and whistleblower channel, and a conflict-of-interest policy.
- **CHR-13:** Charity money can never fund a giveaway, and giveaway money can never be moved into a charity campaign.

### 7.11 Favorite Giveaways (Phase 2, market by market after legal review)

A Favorite funds a prize pool and lets the system pick winners from their fans. Selection is random but weighted by three non-monetary qualities: **activeness**, **dedication**, and **passion**. Money never enters the draw: not what fans spent, gifted, or subscribed to. A fan who has never bought a Token has the same chance as one who buys every week.

**Example.** A Favorite funds a pool of 5,000,000 (in their wallet currency) for 10 winners. Rally holds it in escrow, fans opt in during a window, and at the draw the system picks 10 winners at random with weights from the three fan scores. With the default equal split each winner gets 500,000, paid to their verified payout account.

#### How a giveaway runs
1. **Create.** Set the pool, winner count, split (equal by default or tiered), entry window, score window (14 to 90 days of activity), and optional eligibility filters.
2. **Fund.** Deposit the full pool plus any disclosed fee, from external payment or available earnings, into escrow. It cannot be announced until fully funded.
3. **Announce.** The page goes live with the rules, the selection method in plain language, and a published fingerprint of the draw seed.
4. **Enter.** Eligible fans opt in with one tap. Entry is always free.
5. **Draw.** At close, the system freezes a snapshot of each entrant's scores, draws winners with weighted randomness, and draws alternates in order.
6. **Verify and pay.** Winners confirm identity and a payout account within 14 days and are paid from escrow. Unclaimed prizes go to alternates, then back to the Favorite.
7. **Publish.** The results page shows consenting winners, the method, the revealed seed, and proof of payout.

| Score | What it measures | Signals that count (capped per day or week so spam does not help) |
| --- | --- | --- |
| **Activeness** | How actively the fan has shown up lately | Distinct active days on the Favorite's page and feeds; reactions, comments, replies, polls answered, Moments watched to the end; live sessions attended |
| **Dedication** | How long and consistently the fan has stayed | Time since following; active weeks in the last six months (gaps allowed, no streak penalty); share of the Favorite's key moments attended; completed fan quests |
| **Passion** | How much care the fan puts into the community | Fan Moments approved or featured; replies other established fans mark helpful; accepted translations; welcoming new fans; predictions and polls entered; moderator service; clean conduct |

**What never counts.** The engine reads only an approved list of non-monetary signals. It cannot see, and the rules forbid using: Tokens bought or spent; Gifts sent or received (fan-to-Favorite or fan-to-fan); Gift Points and gifted balances; prize winnings; subscription status or tier; store purchases; donations; supporter wall rank, supporter levels, or spending-based badges; or any money-based Rally Score component.

**Draw mechanics.** Each entrant's scores are percentiles (0 to 1) among entrants:

`C_i = w_A A_i + w_D D_i + w_P P_i,  w_A + w_D + w_P = 1`

`W_i = 1 + 4 C_i`

The weights start at one third each. A Favorite can shift them, but each stays between 0.2 and 0.5. Draw weight W runs from 1 to 5, so the most active fan is at most five times as likely as the least active eligible fan, and **every eligible entrant has a real chance**. Winners are picked one at a time without replacement, with probability proportional to W. A winner from the same Favorite in the last 90 days has a reduced weight.

**Provable fairness.** Before entries open, Rally publishes a hash of a secret seed. At the draw, the seed is combined with a public random value from an open randomness service. Afterwards Rally reveals the seed and the entrant list fingerprint, so anyone can verify that the winners follow from the published rules. The score snapshot is taken at a time the system chooses in the last 48 hours of the window, so fans cannot time a burst of activity.

**Eligibility.** The account is at least 14 days old with a verified phone; the fan has followed the Favorite for 7 days; has at least three active days in the score window; has no active strikes; is in a supported country; and is 18 or over for cash prizes. People linked to the Favorite are excluded, based on declared relationships and detected links (shared devices, phone numbers, payout accounts). Favorites who are fans of the sponsor are eligible unless linked (ROL-5).

A Favorite **can** set pool size, winner count, split, windows, weights within bounds, and country or language filters. A Favorite **cannot** pick or remove winners, see a fan's score before the draw, change rules after funding, add any money-based criterion, or restrict entry by payment status.

- **GVW-1:** Giveaways are funded in full into escrow before announcement. Charity funds can never be used (CHR-13).
- **GVW-2:** Prizes are cash in v1. Prizes in Tokens are not offered, to prevent gift-back loops that inflate a Favorite's standing.
- **GVW-3:** Pool and winner limits scale with the Favorite's verification level, cohort, and country, with a minimum per-winner amount per market. Rally adds a disclosed fee of 3% on top of the pool, shown before funding. Favorites are never required to run giveaways.
- **GVW-4:** The giveaway engine's data access is limited to the signals above. A data-access review and an automated test suite confirm that changing a fan's spending history does not change their draw weight.
- **GVW-5:** Entry requires explicit opt-in and never costs money or requires a Gift. Fans can withdraw before the close.
- **GVW-6:** The seed commitment, reveal, and full draw record are stored for audit.
- **GVW-7:** Unclaimed money returns to the Favorite less disclosed fees after alternates are exhausted.
- **GVW-8:** After the draw, each entrant sees whether they won and a plain-language note on what kinds of activity count, with their own score bands (low, medium, high) but never exact scores.
- **GVW-9:** Fans can appeal an exclusion within 7 days and get a response in 5 business days.
- **GVW-10:** A giveaway can be canceled only before entries open. After that, only Rally can cancel it, for fraud or legal reasons, and entrants are told why.
- **GVW-11:** Giveaway participation and winnings do not count toward the Rally Score, supporter levels, rankings, or upgrade thresholds.
- **GVW-12:** Each month Rally audits spend neutrality: the paying-fan share among winners must stay within five percentage points of the share among entrants, and win rates are checked by country, language, specialty, and tenure. A public transparency note summarizes results.
- **GVW-13:** Compliance: free entry, odds disclosure, registration or approval where required, age limits, tax collection and reporting, and country-specific terms. Giveaways launch only in markets cleared by legal review. Source-of-funds checks, caps, winner screening, blocked payouts to linked accounts, and clawback for confirmed fraud guard against laundering and rigging. Winners choose whether their names show publicly.

### 7.12 Rivalries and Banter (Phase 2, opt-in, moderated)

Rivalry is part of fan culture. The goal is **energy without harm**: fans follow, debate, and play with rivalries while the platform watches heat levels and steps in before banter turns into abuse.

| Type | Description | Participation rule |
| --- | --- | --- |
| Favorite vs Favorite | A publicly documented rivalry between two Favorites in a field | A factual page from cited public sources; interactive banter only if both Favorites opt in |
| Fandom vs Fandom | Friendly contests between two fan communities | Communities join voluntarily, with a neutral scoreboard |
| Fan vs Favorite | A fan challenges or critiques a Favorite | Allowed as opinion or critique within the Favorite's community rules, never as harassment |
| Fan vs Fan | Personal disputes | Not a feature; handled by moderation, mute, and block |

**Features.** The **Rivalry Hub** (neutral summary, sourced timeline, side-by-side stats, current heat level); **Face-Offs** (time-boxed head-to-head votes on a clear question, with Gifts allowed); **Fandom Battles** (weekly contests ranked by unique active supporters, never by spending); **Banter Channels** (opt-in spaces with stricter filters and a code of conduct); **Call-Out Cards** (a structured challenge or question a fan sends to a Favorite, who can respond with a Moment, a poll, or text, or ignore it); and **Predictions** (badges for being right, no money wagering).

- **RIV-1:** Favorites opt in or out of banter. Opting out removes interactive features about them, but a sourced, neutral rivalry page can remain for documented public events, with no banter, Face-Off, or Gift hooks. Favorites get 48 hours' notice and a correction channel.
- **RIV-2:** Rivalry content labels **fact**, **opinion**, and **rumor**. Factual claims about real people need a source link, and unsourced allegations are not published.
- **RIV-3:** Fans enter Banter Channels only after accepting a short code of conduct, and can leave or mute anytime.
- **RIV-4:** Rivalry content is excluded from default feeds for new users and minors. It appears in the Rivalry feed or on opt-in.
- **RIV-5:** Gifts and gift messages cannot be used to harass or humiliate. Messages naming or attacking a person are blocked or held. Rewards go to participation and good conduct, never hostility.
- **RIV-6 (Beef Radar):** Each rivalry has a **heat level** from 1 (friendly) to 5 (hostile), computed from comment spikes, toxicity, reports, new-account surges, and cross-community posting. Favorites and moderators get a dashboard with heat over time, top threads, rising reports, and suggested actions.
- **RIV-7:** At level 4, de-escalation applies automatically (slower posting, review holds, a pinned conduct reminder, limits for new accounts). At level 5, trust and safety reviewers are alerted and can pause a channel, lock a Face-Off, or suspend participants.
- **RIV-8:** Coordinated behavior detection flags brigading, including accounts that move between rivalries to harass. Post-event reviews improve filters.
- **RIV-9:** Real-world conflicts (legal cases, personal tragedies, criminal allegations) are not eligible for Face-Offs or Banter Channels. Threats, doxxing, hate speech, sexual harassment, and targeting of family are zero tolerance, with escalating penalties for fans and Favorites who incite abuse.
- **RIV-10:** Rollout starts with a pilot of 5 to 10 consenting Favorites, and public launch requires round-the-clock trust and safety coverage.

### 7.13 Comparisons and Rankings (Phase 2)

Fans ask who is bigger, who is rising, and who is best in a country or field. Rally answers with transparent, hard-to-game comparisons and rankings by specialty and country. Money alone cannot buy a top spot.

- **RNK-1:** Fans compare two to four Favorites in the same category side by side: supporters, 30- and 90-day growth, repeat-supporter rate, retention, Moment engagement, fan poll scores, milestones, country spread, and the Rally Score. Cross-category comparison is blocked.
- **RNK-2:** Favorites choose which metrics are public. Financial totals are never public; support appears only as banded ranges or relative indexes.
- **RNK-3:** Comparisons have shareable cards with date range and data freshness.

| Ranking | What it shows | Windows |
| --- | --- | --- |
| Global by specialty | Top Favorites worldwide in a lane | Weekly, monthly, all-time |
| Most loved here (default) | Favorites most supported by fans located in a country | Weekly, monthly, all-time |
| From here | Favorites from a country, ranked by worldwide performance | Monthly, all-time |
| Rising and Newcomers | Fastest-growing, and Favorites who joined in the last 90 days | Weekly, monthly |
| Fan-voted | Verified fan polls | Quarterly |
| City and region (Phase 3) | Local favorites | Monthly |

- **RNK-4:** Country comes from payment country, phone number, and verified residence, with a self-declared fallback. Frequent changes or VPN patterns reduce the weight of a fan's activity.
- **RNK-5:** Rankings refresh daily, weekly rankings are saved as snapshots, and each rank card shows movement and the biggest reason for the change.
- **RNK-6:** Favorites can opt out of public ranking or hide their rank. Rankings use size cohorts (Rising, Established, Legend) so small Favorites have a fair place.
- **RNK-7:** Rankings can be disabled per market where law restricts ranking of individuals, and launch only after legal review.

**Rally Score.** It ranks Favorites within a specialty and window and caps how much any single fan can contribute.

`S_f,c,w = 0.30 U + 0.25 G + 0.20 R + 0.15 E + 0.10 P`

U is unique verified supporters, G is net supporter growth scaled by cohort, R is repeat-supporter rate and subscription retention, E is engagement per Moment and post, and P is fan poll accuracy. Each term is scored within its specialty and cohort. Money is not a direct term: Gifts count only through unique supporters and retention, with per-fan caps and log scaling. Weights are starting values and will be tuned in the pilot.

- **RNK-8:** Only verified, aged, human accounts count toward U and E. Bot and farm detection removes suspicious activity retroactively. Support from new accounts is down-weighted. Gifts from accounts linked to a Favorite or their team are excluded. Gifts from other Favorites follow ROL-4. Suspicious spikes hold a rank change for review.
- **RNK-9:** Giveaways, fan-to-fan gifts, and donations never count toward ranks. The method is published in plain language, each Favorite sees their component breakdown, and audits check bias across countries, languages, and categories.

### 7.14 Multi-Language and Localization (MVP)

Rally launches multilingual. Fans support Favorites in the language they feel closest to.

- Tier 1 at launch: English, French, Portuguese, Spanish, and Arabic (with full right-to-left support), each with full UI, support content, moderation coverage, and store listings.
- Tier 2 at launch: Regional languages such as Nigerian Pidgin, Yoruba, Hausa, Igbo, and Swahili, with machine translation, community moderators, and moderation coverage added as volume grows. A language is promoted to Tier 1 only when its moderation accuracy reaches the English bar.

- **LNG-1:** All UI text, notifications, emails, receipts, and errors are externalized (ICU message format with plural and gender rules). Nothing is hard-coded.
- **LNG-2:** Users choose an interface language and, separately, the content languages they read. Defaults come from the device.
- **LNG-3:** Every post, comment, Gift message, and bio carries a detected source language. A one-tap **Translate** shows the translation inline, with **Show original**. Users can enable auto-translate per language.
- **LNG-4:** Favorites publish bios, tier descriptions, and store listings in several languages. Gift messages are translated for the Favorite, and replies translate back, with the original always visible.
- **LNG-5:** Search matches names across scripts and transliterations.
- **LNG-6:** Dates, numbers, currencies, addresses, and name order follow locale. Prices show in local currency with settlement disclosed.
- **LNG-7:** Legal terms, payment flows, and consent screens in Tier 1 languages are reviewed by qualified human translators.
- **LNG-8:** Moderation is evaluated per language, including slang, code-switching, and transliteration, with parity targets against English.
- **LNG-9:** Each Favorite has a glossary (names, catchphrases, song titles) so they are never mistranslated.
- **LNG-10:** Community translation (Phase 2): trusted fans propose better translations, earn a **Translator** badge, and Favorites can approve or auto-accept verified translators.

### 7.15 Discovery and Notifications

- **DSC-1:** Search by name, handle, specialty, and location, across languages and scripts.
- **DSC-2:** Browse by industry, category, and specialty, with trending lists and Spotlights for small specialties.
- **DSC-3 (Phase 2):** Recommendations use followed and supported Favorites, Favorite's Picks, and credits, with diversity rules.
- **NTF-1:** Fans get push, email, and in-app notifications for posts, Moments, replies, badge awards, subscription events, campaign progress, and giveaway results, with granular controls.
- **NTF-2:** Favorites get real-time alerts for Gifts, new subscribers, flagged content, and Beef Radar changes, with quiet hours.

### 7.16 Trust, Safety, and Administration

- **TNS-1:** Users report posts, comments, profiles, messages, campaigns, and giveaways with a reason and optional evidence, and can block and mute.
- **TNS-2:** An admin console provides review queues, action history, user lookup, escalation, and audit logs.
- **TNS-3:** Impersonation detection flags unverified pages that copy verified Favorites, with fast takedown.
- **TNS-4:** Penalties escalate: warning, mute, content removal, banter ban, loss of fan-to-fan gifting, suspension, ban.
- **TNS-5:** Fraud and AML controls cover KYC for Favorites and winners, sanctions screening, velocity limits, device and payment link analysis, and held payouts for suspicious activity.
- **TNS-6:** Minor protections include age gating, spend caps, restricted features, and guardian consent where required.
- **TNS-7:** Reviewers include people who know each field and language. Appeals get a response in 5 business days.
- **TNS-8:** Policy for controversial Favorites: accounts stay unless they break the law or platform rules. Accounts under active legal action involving violence or fraud against fans are suspended pending review by a trust board. Real-world legal conflicts are excluded from rivalry features.

## 8. Key User Flows

### 8.1 Fan Sends a Gift
1. The fan opens a Favorite's page from a shared link and taps **Send a Gift**.
2. If the wallet is empty, the fan verifies a phone number or social login and buys a Token pack with a local payment method, seeing the rate and total first.
3. The fan picks a Gift, optionally adds a message and chooses anonymity, and confirms.
4. A success screen shows the Gift animation and a share card, and invites the fan to follow or join the fan club.
5. The Favorite is notified, and the Gift appears on the supporter wall and the Moment.

### 8.2 Favorite Onboarding (Two Routes)
1. **Direct application:** sign up, choose a specialty, set name, handle, bio, and avatar, add a payout method, submit verification, and publish the page. A limited "unverified" badge and payout hold apply until approval.
2. **Fan upgrade:** watch the Favorite Progress meter, request status when the threshold is met, and pass screening and review (7.3).
3. Both routes finish with a share kit (link, QR code, graphics) and a 30-day probation for upgraded fans. Upgraded fans keep the same profile and all the Favorites they already follow.

Target: a page live in under 10 minutes.

### 8.3 Fan Joins a Fan Club
Browse tiers, compare perks, subscribe with currency or Tokens, unlock gated content immediately, and receive a welcome message.

### 8.4 Fan Donates to a Charity Campaign
Open the campaign page, read the beneficiary and transparency details, choose an amount, pay with a local method (donations carry processing costs only), and receive a receipt. The fan can follow impact updates and earn an Impact badge.

### 8.5 Fan Enters a Giveaway
Open the giveaway page, read the rules and method, tap **Enter** during the window, and see the result and a plain-language activity summary after the draw. Winners verify identity and a payout account within 14 days.

### 8.6 A Favorite Acts as a Fan
From the same profile, follow another Favorite, send a Gift with Tokens bought with money, enter that Favorite's giveaway, and optionally list them in Favorite's Picks. Everything lands in the same profile, inbox, and history, and the Favorite's earnings stay in their own balance.

## 9. Monetization Model

| Stream | Description | Indicative rate |
| --- | --- | --- |
| Token margin | The part of each Token purchase not paid to Favorites, covering payments, moderation, and platform costs | Favorite share of at least 60% of Token value on web purchases |
| Subscriptions | Platform fee on fan club revenue | About 10% |
| Store and commissions | Fee on digital sales and service orders | About 10% |
| Giveaway fee | Charged on top of the funded pool and disclosed before funding | 3% |
| Instant payout fee | Small fee for on-demand withdrawals | Flat or low percentage |
| Premium Favorite plan | Advanced analytics, team seats, custom domain, lower fees | Monthly fee |
| Charity | No Rally fee; processing costs only | 0% platform fee |
| Brand partnerships (Phase 3) | Sponsored campaigns, rewards, and sponsor-funded giveaways | Negotiated |

### 9.1 Principles
Show every rate and fee upfront, keep Favorite take-home competitive, never charge fans hidden fees, and publish how much of each Token purchase reaches Favorites.

### 9.2 Favorite Share Economics (hypotheses to validate in the pilot)
- The Favorite share is at least 60% of Token value on web purchases. App store fees can be high, so in-app Token packs are priced higher or the share is reset near 50% in-app, with the choice disclosed. Web purchase paths are offered where store rules allow.
- Bonus Token packs must never reduce the Gift Points a Favorite earns per Token.
- Common Gifts are affordable for casual fans, and big Gifts are for special occasions.
- Gift Points convert to cash at a published, stable rate.

## 10. Non-Functional Requirements

**Performance.** Pages load in under 2 seconds on a typical 4G connection, and core flows work on low-end Android devices. Payment confirmation completes in about 5 seconds.

**Scalability.** The platform handles traffic spikes of at least 50 times baseline, such as a viral release or a live event.

**Availability.** 99.9% uptime for payments and page serving, with graceful degradation of community features. Payment operations are idempotent, with reconciliation jobs preventing double charges and lost Gifts.

**Security and compliance.** PCI DSS through tokenized providers (Rally never stores raw card data), encryption in transit and at rest, role-based admin access with audit logs, KYC and AML for Favorites and winners, sanctions screening, and compliance with applicable data protection law (for example GDPR and NDPR) including export and deletion.

**Accessibility and localization.** WCAG 2.1 AA, multiple languages and currencies, and right-to-left readiness.

**Platforms.** Mobile-first iOS and Android plus responsive web, with lightweight data use and offline tolerance where practical.

## 11. Technical Overview (High Level)

- **Clients:** Cross-platform mobile apps and a responsive web app that share one design system.
- **Services:** Identity and roles, profiles and taxonomy, ledger and payments, Gifts and Tokens, subscriptions and store, content and feeds, notifications, moderation, search, ranking and analytics, giveaway engine, charity operations, and translation.
- **Ledger:** A double-entry ledger is the source of truth, with separate pools for Token liabilities, gifted balances, Gift Points and earnings, charity escrow, and giveaway escrow. Funds in one pool can never move into another except through defined, audited flows.
- **Payments:** Multiple providers behind one abstraction for redundancy and regional coverage, plus payout rails for banks and mobile money.
- **Fan score feature store:** A restricted store that exposes only the non-monetary signals used by giveaways, with automated tests proving no monetary field is reachable.
- **Ranking pipeline:** Verified-human signals, fraud scoring, cohort scaling, and snapshotting, with published methodology.
- **Data:** Relational storage for accounts and transactions, search and document indexes for feeds and discovery, and object storage with a CDN for media.
- **Moderation:** Automated text and image screening in each supported language, plus human review queues and Beef Radar heat scoring.
- **Observability:** Centralized logging, metrics, tracing, and fraud dashboards.

## 12. Success Metrics

North Star: Total monthly supporter-to-Favorite value, weighted by repeat behavior. Targets are initial hypotheses for 12 months after launch, to be refined with pilot data.

| Category | Metric | Target |
| --- | --- | --- |
| Growth | Verified Favorites onboarded, with no launch industry above 40% of all Favorites | 5,000 |
| Growth | Monthly active fans | 250,000 |
| Conversion | Page visit to Gift conversion (to be re-baselined in the pilot) | 4 to 6% |
| Retention | Fans who send 2 or more Gifts in 90 days | 35% |
| Retention | Subscription monthly churn | Under 6% |
| Favorite value | Favorites earning above the payout minimum each month | 60% |
| Moments | Moments per active Favorite per month, and share of Gifts attributed to a Moment | Tracked, targets set in pilot |
| Languages | Share of sessions in a non-English language, and moderation parity versus English | Parity within agreed margin |
| Upgrade path | Fans who request Favorite status, approval rate, and revocation rate | Revocation under 2% |
| Giveaways | Winner claim rate, and paying-share gap between winners and entrants | 90% claimed, within 5 points |
| Charity | Campaigns with impact report filed on time, and confirmed misuse of funds | 95% on time, zero misuse |
| Rivalries | Rivalry sessions at heat level 3 or below, and time from heat 4 to first de-escalation | Majority below 3, fast response |
| Trust | Reports resolved within 24 hours, and payment failure rate | 90%, under 2% |
| Experience | App store rating | 4.5 or higher |

## 13. Go-to-Market Overview

1. **Closed pilot (8 to 10 weeks):** 50 to 100 hand-picked Favorites across every launch industry, with their core fans, heavy feedback loops, and dry-run giveaways with no real money.
2. **Public launch:** Favorite-led acquisition through share kits, QR codes, and social graphics. Each page is its own growth channel.
3. **Community seeding:** An ambassador program for superfans, translators, and moderators.
4. **Partnerships:** Labels, talent agencies, sports clubs, creator collectives, and verified charities for bulk onboarding.
5. **Referral loops:** Fans earn badges for bringing in new supporters, and Favorites get referral bonuses for onboarding peers.

## 14. Roadmap

| Phase | Timeline | Scope |
| --- | --- | --- |
| Phase 0 | Weeks 0 to 6 | Research with Favorites and fans in each industry, design prototypes, payment provider selection, legal opinions on Tokens and prize promotions, charity due-diligence partner, taxonomy and template design, language selection, rivalry and ranking policy drafts |
| Phase 1 (MVP) | Weeks 6 to 20 | Accounts and roles, Favorite pages, taxonomy, Tokens, Gifts, Gift Points and payouts, supporter wall and badges, Moments and feeds, multi-language launch set, basic charity, basic moderation. Fan score data collection starts on day one |
| Pilot | Weeks 20 to 30 | Closed pilot, dry-run giveaways, internal ranking tests, limited Banter Channel test with consenting Favorites, compliance sign-off |
| Phase 2 | Months 8 to 12 | Fan upgrade path, fan-to-fan gifting, fan clubs, store and commissions, Fan Moments, rankings and compare tool, rivalries with Beef Radar, giveaways in cleared markets, Charity Gifts, signature and live Gifts, Credits graph, Favorite's Picks, community translation |
| Phase 3 | Months 12 to 18 | Live sessions, brand sponsorships, merch partners, city rankings, public API, Junior Favorite program, additional languages, review of Token prizes |

## 15. Risks and Mitigations

| Risk | Impact | Mitigation |
| --- | --- | --- |
| Cold start: no Favorites means no fans | High | Pilot with established Favorites who bring audiences; supply-first strategy |
| Impersonation and fake pages | High | Verification, handle reservations, detection, fast takedown |
| Tokens classified as e-money or stored value | High | Early legal review, closed-loop design, licensed payment partners, market-by-market launch |
| Payment fraud, Token laundering, and resale | High | Multi-provider routing, fraud scoring, caps, link analysis, held payouts, gifted balances |
| Charity fraud or diversion of funds | High | Segregated escrow, direct payment to verified organizations, proof of use, audits, payee matching |
| Harm to children through orphanage fundraising | High | Safeguarding rules, partner vetting, no child imagery without consent, no visits as rewards |
| Rivalry escalates into harassment | High | Opt-in only, Beef Radar, heat limits, round-the-clock review, strict rules on threats and doxxing |
| Defamation over rivalry or ranking content | High | Sourced facts, opinion labels, correction process, legal review of high-profile pages |
| Giveaways rigged, or used to move money | High | Random draw with public seed, link analysis, KYC, caps, clawback |
| Rich fans win more through hidden correlations | High | Strict data allow-list, automated tests, monthly spend-neutrality audit, public report |
| Prize promotion and ranking laws differ by country | High | Market-by-market launch, free entry, local terms, legal sign-off, per-market switches |
| Rankings gamed by bots or fan farms | High | Verified-human signals, per-fan caps, log scaling, fraud holds, published method |
| Gift swapping between Favorites to inflate rank | Medium | No Gift Points to Tokens, reciprocal ring detection, per-giver caps, labeled support |
| Fake audiences used to reach the upgrade threshold | Medium | Verified-human signals, engagement reach rule, probation, revocation |
| Uneven moderation quality across languages | High | Per-language evaluation, native reviewers, parity gate before Tier 1 |
| Poor machine translation changes meaning | Medium | Show original, confidence labels, Favorite glossaries, community corrections |
| App store fees reduce Favorite earnings | Medium | Web purchase paths, higher in-app pricing, disclosed rates |
| Small specialties earn little from Gifts alone | Medium | Commissions, store, subscriptions, Spotlights, lower upgrade thresholds |
| Unhealthy engagement or over-spending by vulnerable fans | High | Spend limits, soft reminders, no manipulative mechanics, no infinite autoplay, minor protections |
| Regulatory change in payments and KYC | Medium | Compliance counsel, modular provider layer, regional rollout |

## 16. Ethical and Responsible Design Principles

- Support is voluntary, with no dark patterns or guilt-based prompts.
- Fans can set spending caps and receive gentle reminders.
- Minors face age gating, restricted spending, and no access to cash prizes, Token Gifts, or rivalry content.
- Every transaction shows fees and rates upfront.
- Favorites own their fan relationships and can export their supporter list, with fan consent for contact details.
- Money buys expression, never standing: spending is excluded from giveaway odds, upgrade eligibility, and rankings.
- Fundraising never benefits a Favorite personally.

## 17. Open Questions with Recommended Answers

Every question raised so far is listed with a recommended answer. The requirements above already apply these answers, so changing one means updating the matching requirement.

| # | Question | Recommended answer |
| --- | --- | --- |
| 1 | Which regions and currencies launch first? | Lead with one West African market where Afrobeats, gospel, and Nollywood fan bases are concentrated, plus diaspora buyers in the UK, US, and Canada paying in GBP, USD, CAD, and EUR. Add markets in waves once licensing and payments are proven. |
| 2 | Which payout currencies and methods at launch? | Local bank transfer and mobile money in the lead market, plus USD and GBP bank payouts through a payout partner for diaspora Favorites. Weekly default, on-demand for a small fee. |
| 3 | Should Gifts allow guest checkout? | No anonymous guests. Require a verified phone or social login before the first Token purchase (about 30 seconds). Browsing stays open to everyone. |
| 4 | What share of Token value should reach Favorites, web versus app? | At least 60% on web. In-app, price packs higher or reset the share near 50%, with disclosure. Revisit after the pilot. |
| 5 | Should Tokens expire? | Purchased Tokens never expire. Bonus and gifted Tokens expire after 12 months, subject to local law. |
| 6 | What fee structure keeps Rally competitive? | Token margin as in Q4, about 10% on subscriptions and store, 3% giveaway fee on top, no fee on charity, and a Premium plan for lower fees and tools. |
| 7 | Which categories should the pilot prioritize? | At least one from each launch industry: Afrobeats and Afro-fusion, gospel, hip hop and rap, producers, comedy and skits, streamers and creators, plus writers and artisans in small cohorts. |
| 8 | Should fan-to-fan interaction be in v1? | No. The MVP supports fan-to-Favorite only. Fan-to-fan Gifts arrive in Phase 2, after the Token system has run for a few months. |
| 9 | What age policy applies? | Fans from 13 (or the local minimum) with spend caps, guardian consent where required, and restricted features. Payouts, Token Gifts, cash prizes, and Favorite status are 18 and over in v1. |
| 10 | Can 16 and 17-year-olds become Favorites? | Not in v1. Consider a guardian-consent Junior Favorite program without payouts in Phase 3. |
| 11 | Which languages launch, and when does a language reach full support? | Tier 1: English, French, Portuguese, Spanish, Arabic. Tier 2: Nigerian Pidgin, Yoruba, Hausa, Igbo, Swahili. Promote a language to Tier 1 when its moderation accuracy meets the English bar. |
| 12 | Should a Favorite who is also a fan use one account or two? | One identity and no modes. A Favorite is also a fan, and a fan who becomes a Favorite keeps the same profile, history, and the Favorites they already follow. Tokens and earnings show as two balances that never merge. |
| 13 | Can Favorites gift other Favorites with Gift Points? | No. Gift Points only leave as cash payouts, and Favorites buy Tokens with money like any fan. This prevents Gift-swapping loops. |
| 14 | Do Gifts from Favorites count toward rankings? | Yes, through unique supporters with a per-giver cap. Reciprocal rings are excluded, and pages show a 'Supported by Favorites' strip. |
| 15 | Can Favorites enter other Favorites' giveaways? | Yes under the same rules as fans, unless linked to the sponsor by team, family, collective, shared devices, or payout accounts. |
| 16 | Is a Favorite's fan activity public? | Visible only in the communities where they act, with hide controls. Favorite's Picks is public by choice. |
| 17 | Is country ranking by fan location or Favorite origin? | Both, with a toggle. Default to 'Most loved here' and offer 'From here' as a second view. |
| 18 | Should money count in the Rally Score? | Not directly. Count unique verified supporters and retention. Subscriptions count only as a capped retention signal, and Gift amounts are capped and log-scaled. |
| 19 | Should a rivalry page exist if a Favorite opts out of banter? | Only as a neutral, sourced page with no banter, Face-Off, or Gift hooks, plus a correction channel. Interactive features need both Favorites to opt in. |
| 20 | Do Favorites get review rights over Moments and rivalry pages about them? | Platform Moments need their approval. Rivalry pages get 48 hours' notice and a correction channel, with no veto over sourced facts. |
| 21 | How much of the rivalry layer launches first, and who staffs safety? | A pilot with 5 to 10 consenting Favorites. Public launch only with round-the-clock coverage (in-house plus a vendor) and live heat dashboards. |
| 22 | What about markets that restrict ranking of individuals? | Rankings and comparisons can be switched off per market, and launch only after legal review. |
| 23 | How do we handle controversial Favorites? | They stay unless they break the law or platform rules. Accounts under active legal action involving violence or fraud against fans are suspended pending a trust board review. Real-world legal conflicts are excluded from rivalry features. |
| 24 | Which charity due-diligence partner, and what threshold triggers independent review? | An established due-diligence provider plus a local verification partner. Independent review applies to every child-welfare campaign and any campaign above roughly USD 5,000 equivalent. |
| 25 | Can a Favorite's own foundation receive campaign funds? | No at launch. Revisit after a clean audit record. |
| 26 | Can Favorites sell paid services next to Gifts? | Yes through the store and commissions, with escrow and delivery proof. Never in exchange for Gifts. |
| 27 | What upgrade threshold values apply? | The defaults in 7.3, with a lower audience bar (50 followers) for small specialties, adjusted by country and reviewed quarterly. |
| 28 | Should fans see their giveaway score bands? | Only after the draw, as bands (low, medium, high) and never as exact scores. General guidance on what counts is always public. |
| 29 | What are giveaway pool and winner limits, and who pays the fee? | Limits by verification tier and market after legal review. The Favorite pays a disclosed 3% on top of the pool. |
| 30 | Should giveaways require a minimum prize per winner? | A market-specific floor per winner, but Favorites are never required to run giveaways. |
| 31 | Can brands fund giveaways? | Not in v1. Consider brand campaigns in Phase 3 with brand KYC and clear labeling. |
| 32 | How do Favorites reward paying supporters if giveaways ignore money? | Through separate perks: subscriber content, early access, badges, and supporter levels. Keep perks (can reward spending) and prizes (cannot) clearly apart. |
| 33 | Should giveaway prizes be paid in Tokens? | Not in v1, to avoid gift-back loops. Review in Phase 3 with strong controls. |

## 18. Appendix: Glossary

- **Favorite:** Any creator, artist, athlete, group, brand, or public figure receiving fan support.
- **Fan:** Any user who follows or supports Favorites. Every Favorite is also a fan, with one identity.
- **One identity:** Each person has a single profile. A Favorite is also a fan, and a fan who becomes a Favorite keeps everything, including the Favorites they follow.
- **Token:** A closed-loop in-app currency fans buy and spend on Gifts. It cannot be withdrawn or sold.
- **Gift:** A visible, animated item sent with Tokens.
- **Gift Points:** What a Favorite earns from received Gifts, converted to cash at the published rate. Never convertible to Tokens.
- **Fan Gift and Token Gift:** A cosmetic keepsake and a gifted Token balance that one fan sends another, with no cash-out.
- **Moment:** A time-stamped, shareable highlight card tied to a Favorite.
- **Specialty:** The most detailed level of the Industry, Category, Specialty taxonomy.
- **Credits graph:** Confirmed links between Favorites who worked together.
- **Favorite's Picks:** A list of Favorites that a Favorite chooses to recommend as a fan.
- **Favorite Progress:** The meter showing a fan how close they are to the upgrade threshold.
- **Rising cohort:** The size band for new and fast-growing Favorites, ranked among their peers.
- **Rally Score:** The within-specialty ranking score built from reach, growth, loyalty, engagement, and fan polls.
- **Rivalry Hub, Face-Off, Beef Radar, Heat level:** The rivalry page, the head-to-head contest, the monitoring layer, and its 1 to 5 hostility score.
- **Giveaway:** A Favorite-funded cash pool awarded to opted-in fans by weighted random draw.
- **Activeness, Dedication, Passion:** The three non-monetary fan scores that weight a giveaway draw.
- **Draw weight:** A fan's relative chance in a giveaway, from 1 to 5, based only on the three fan scores.
- **Escrow:** A segregated account holding giveaway or charity funds until paid out or returned.
- **Verified Beneficiary:** A registered organization checked by Rally to receive charity campaign funds.
- **Impact badge:** Recognition for verified charitable giving or completed campaigns.
