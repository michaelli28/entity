# Product Requirements Document: ZStar

**Version:** 1.0
**Date:** 2026-04-06
**Author:** Founder + Claude
**Status:** Draft

---

## 1. Executive Summary

ZStar is an AI-powered founder profiling and deal flow platform that combines an intelligent mentorship agent with a signal-based startup scoring engine and a privacy-first investor marketplace.

**Phase 1** delivers a browser-based AI mentor that guides founders through building their startup profile via natural conversation, extracts structured signals, scores their investor-readiness, and enriches profiles with verified data from LinkedIn and GitHub.

**Phase 2** opens an investor discovery dashboard where angels and SMEs can filter, rank, and engage with pre-qualified startups.

**Core insight:** No existing platform combines AI mentorship + structured scoring + privacy-first marketplace. AngelList has the marketplace but no intelligence. PitchBook has the data but no founder tools. YC has the mentorship but no scale.

---

## 2. Problem Statement

### For Founders

- Writing a compelling pitch is hard — most founders have never done it before
- No structured guidance on what investors actually look for
- No way to know if their pitch is "good enough" before sending it
- Limited access to investors outside their existing network
- Fear of idea theft prevents sharing with potential advisors

### For Investors (Angels, SMEs, VCs)

- Deal flow is inconsistent and network-dependent
- Evaluating raw pitches is time-consuming — no standardized format
- No way to discover founders outside their bubble
- Signal extraction from unstructured pitch decks is manual
- Due diligence is repetitive across similar startups

### Market Gap

| Platform            | What It Does                            | What It Lacks                                |
| ------------------- | --------------------------------------- | -------------------------------------------- |
| AngelList/Wellfound | Job board + basic fundraising           | No AI coaching, no scoring, passive profiles |
| Gust                | Application management for accelerators | Investor-centric, clunky UX                  |
| DocSend             | Pitch deck hosting + analytics          | No scoring, no coaching, just file sharing   |
| PitchBook           | Data platform for investors ($20K+/yr)  | No founder tools, pure research              |
| Carta               | Cap table management                    | Post-funding tool, no discovery              |

---

## 3. Target Users

### Primary (Phase 1): Startup Founders

- Pre-seed and seed stage (pre-revenue to early revenue)
- First-time and repeat founders
- Technical and non-technical backgrounds
- Actively preparing to fundraise or exploring the idea
- Age range: 22-45, global, English-speaking initially

### Secondary (Phase 2): Investors

- Angel investors writing $10K-$250K checks
- Subject matter experts (SMEs) considering advisory/mentorship roles
- Micro-fund managers and solo GPs
- Scout programs at larger VC firms
- Accelerator program managers evaluating applicants

---

## 4. Product Architecture

### 4.1 Form Factor

**Browser Extension + Web App**

- Chrome/Firefox extension built with Plasmo framework (React + TypeScript)
- Extension overlays on LinkedIn and GitHub for contextual data capture with user consent
- Web app serves as the primary dashboard for profile management, scoring, and messaging
- Progressive Web App (PWA) for mobile access
- Desktop app considered for Phase 3 if power-user demand warrants it

### 4.2 Interaction Mode

**Hybrid: On-Demand Sessions + Opt-In Passive Signals**

- **Core experience:** Guided mentorship sessions the founder initiates
- **Passive enrichment (opt-in):** Connected account polling — GitHub commit activity, LinkedIn updates
- **Progressive trust model:** Start with sessions only, prompt for integrations after 2-3 sessions as founder builds comfort
- No always-on background monitoring, no screen capture, no keylogging

### 4.3 Privacy Model

**Tiered: Local Draft → Cloud Published**

```
┌─────────────────────────────────────────────┐
│                FOUNDER DEVICE               │
│                                             │
│  ┌─────────────────────────────────────┐    │
│  │  Local Draft State                  │    │
│  │  - Conversation transcripts         │    │
│  │  - Work-in-progress pitch sections  │    │
│  │  - Raw profile data                 │    │
│  │  - Personal notes                   │    │
│  └──────────────┬──────────────────────┘    │
│                 │                            │
│          Founder clicks                     │
│          "Publish Section"                  │
│                 │                            │
└─────────────────┼───────────────────────────┘
                  ▼
┌─────────────────────────────────────────────┐
│              PITCHFLOW CLOUD                │
│                                             │
│  ┌─────────────────────────────────────┐    │
│  │  Published Profile (Discoverable)   │    │
│  │  - Scored signals (aggregated)      │    │
│  │  - Market category + team size      │    │
│  │  - Published pitch sections         │    │
│  │  - Verified credentials (OAuth)     │    │
│  └─────────────────────────────────────┘    │
│                                             │
│  ┌─────────────────────────────────────┐    │
│  │  Access-Controlled (Per SME)        │    │
│  │  - Detailed pitch content           │    │
│  │  - Financial projections            │    │
│  │  - Data room documents              │    │
│  └─────────────────────────────────────┘    │
└─────────────────────────────────────────────┘
```

**Key principle:** Founders have ultimate control. Nothing leaves their device without explicit action. Aggregated/anonymized signals (score, category) go to cloud for discovery. Detailed content only when founder publishes or grants per-SME access.

### 4.4 Data Collection Strategy

**Self-Report Primary + OAuth Enrichment**

| Source            | Data Collected                                                                                                         | Method                                                                  |
| ----------------- | ---------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| Conversational AI | Vision, problem statement, market understanding, competitive landscape, pricing model, traction claims, team narrative | Extracted from natural conversation                                     |
| LinkedIn OAuth    | Work history, education, connections count, endorsements, profile completeness                                         | OAuth sign-in + LinkedIn Marketing API (or People Data Labs enrichment) |
| GitHub OAuth      | Repositories, languages, commit frequency, stars, org memberships, contribution patterns                               | GitHub REST/GraphQL API (5,000 req/hr)                                  |
| Crunchbase API    | Market data, competitor funding, TAM estimates                                                                         | Licensed API                                                            |
| Founder Uploads   | Pitch deck (PDF), financial model, incorporation docs                                                                  | Direct upload to local storage                                          |
| Behavioral        | Session frequency, iteration speed, responsiveness, profile completion rate                                            | Platform analytics                                                      |

**Never scraped:** Personal LinkedIn profiles, private repositories, social media without consent.

---

## 5. Core Features — Phase 1

### 5.1 AI Mentor Agent

The centerpiece of Phase 1. An AI-guided conversational experience that feels like meeting with a smart mentor.

**Conversation Flow:**

```
Session 1: "The Big Picture"
├── Who are you? (founder background, motivation)
├── What are you building? (product description)
├── Who is it for? (ICP, personas)
└── Why now? (market timing, catalyst)

Session 2: "The Problem & Market"
├── What problem are you solving? (pain points, urgency)
├── How big is this? (TAM/SAM/SOM, market research)
├── Who else is solving this? (competition, differentiation)
└── What's your unfair advantage? (moat, defensibility)

Session 3: "The Business"
├── How do you make money? (pricing model, unit economics)
├── What traction do you have? (metrics, milestones)
├── What's the plan? (go-to-market, roadmap)
└── Who's on the team? (skills, gaps, advisors)

Session 4: "The Ask"
├── How much are you raising? (round size, use of funds)
├── What terms? (valuation expectations, SAFE vs priced)
├── Who have you talked to? (investor pipeline)
└── What help do you need? (beyond capital)

Ongoing: Deep Dives
├── AI identifies weakest signal areas
├── Probes with follow-up questions
├── Suggests improvements with examples
└── Tracks iteration and improvement over time
```

**Behind the scenes:**

- Claude API extracts structured signals from each conversation turn
- Maps responses to the scoring rubric categories
- Identifies gaps and weak areas for follow-up
- Stores structured data locally, updates profile in real-time

**UX elements:**

- Profile completeness meter (gamification)
- Signal strength radar chart (visual feedback)
- "Investor Readiness Score" (composite number)
- Suggested next session topic based on weakest areas

### 5.2 Signal Scoring Engine

A rules-based scoring engine (V1) that evaluates founders across structured signal categories. Each signal category produces a subscore; the weighted composite produces an overall Investor Readiness Score.

#### Signal Categories & Weights

```
FOUNDER SIGNALS (35% of total score)
├── Experience (15%)
│   ├── +2  Big tech / growth company (FAANG, Stripe, Snowflake, etc.)
│   ├── +2  Startup experience (employee #1-20)
│   ├── +3  Previously founder or founding team
│   ├── +2  Product-driven role (PM, Eng Lead, or higher)
│   ├── +1  Domain expertise relevant to startup's market
│   ├──  0  Non-tech company experience
│   ├── -1  No work experience listed
│   └── -2  Still employed full-time (side-hustle founder)
│
├── Education (5%) [OPTIONAL FILTER — not in default score]
│   ├── +1  Top 500 universities globally
│   ├── +1  Technical degree (Eng, Science, Math)
│   ├── +1  PhD candidate or degree
│   ├──  0  Non-accredited university, AA degree
│   └── -1  No education listed
│
├── Demonstrated Capability (10%) [DEFAULT — replaces pedigree]
│   ├── +3  Shipped product with real users
│   ├── +2  Open source contributions (GitHub signal)
│   ├── +2  Published thought leadership (blog, talks, papers)
│   ├── +1  Technical skills verified via GitHub activity
│   └──  0  No demonstrable output
│
└── Network Signal (5%)
    ├── +2  100+ mutual connections with investors on platform
    ├── +1  25-100 mutual connections
    ├──  0  <25 mutual connections
    └── -1  No connections

STARTUP SIGNALS (65% of total score)
├── Market (15%)
│   ├── +3  $10B+ TAM with credible bottoms-up analysis
│   ├── +2  $1B-10B TAM
│   ├── +1  $500M-1B TAM
│   ├──  0  TAM not quantified
│   └── -1  <$500M TAM
│
├── Problem (10%)
│   ├── +3  Clear ICP with validated pain (interviews, data)
│   ├── +2  Specific use cases and user stories
│   ├── +1  Critical pain described with evidence
│   ├──  0  Generic problem listing
│   └── -1  No pain points articulated
│
├── Competition (5%)
│   ├── +2  Clear differentiation articulated (why better/unique)
│   ├── +1  Competitors named with honest comparison
│   ├──  0  Competitor names listed without analysis
│   └── -1  "No competitors" (red flag) or no mention
│
├── Product (10%)
│   ├── +2  AI/ML core to product (if genuine, not buzzword)
│   ├── +2  Network effects or platform dynamics
│   ├── +2  Unique technical approach articulated
│   ├── +1  Data analytics / predictive capabilities
│   └──  0  Commodity product, no technical moat
│
├── Traction (15%)
│   ├── +3  MRR/ARR/Revenue with growth rate
│   ├── +2  Quantified users/customers/design partners
│   ├── +2  Unit economics (LTV, CAC, LTV/CAC, ARPU)
│   ├── +2  Before/after quantified impact (ROI for customers)
│   ├── +1  Pipeline or forecast with methodology
│   └──  0  No quantified traction
│
├── Pricing (5%)
│   ├── +2  Subscription or consumption model with numbers
│   ├── +1  Pricing model described without specifics
│   └── -1  No pricing model
│
└── Team (5%)
    ├── +2  Complementary skills (builder + seller)
    ├── +1  Relevant advisors with real engagement
    ├── +1  Previous founding experience on team
    └──  0  Solo founder, no advisors
```

**Scoring output:**

- Overall Investor Readiness Score: 0-100
- Category subscores with strength/weakness indicators
- Specific recommendations for improvement per category
- Percentile ranking vs. other founders on platform (once N > 50)

#### Engagement Quality Score (Behavioral + LLM)

Separate from the pitch score, measures founder engagement quality:

| Signal                                             | Source             | Weight |
| -------------------------------------------------- | ------------------ | ------ |
| Session completion rate                            | Platform analytics | 15%    |
| Iteration speed (time between sessions)            | Platform analytics | 15%    |
| Depth of responses (word count, specificity)       | LLM analysis       | 20%    |
| Clarity of thinking (coherence, logical structure) | LLM analysis       | 20%    |
| Responsiveness to feedback (did they iterate?)     | Platform analytics | 15%    |
| Profile completeness progression                   | Platform analytics | 15%    |

Labeled as "Engagement Quality" — never exposed as a personality or character judgment.

### 5.3 Founder Dashboard

Web application where founders manage their profile and track progress.

**Dashboard components:**

- **Readiness Score** — prominent composite score with trend line
- **Signal Radar** — visual chart of all signal categories (strengths and gaps)
- **Profile Sections** — each pitch section with publish/private toggle
- **Session History** — past mentor sessions with key takeaways
- **Connected Accounts** — LinkedIn, GitHub integration status
- **Suggested Actions** — AI-generated next steps to improve score
- **Notifications** — investor interest signals (Phase 2)

### 5.4 Browser Extension

Chrome/Firefox extension for contextual data enrichment.

**Capabilities:**

- **LinkedIn overlay:** When founder visits their LinkedIn profile, offers one-click import of work history, education, connections data (via OAuth, not scraping)
- **GitHub overlay:** When founder visits their GitHub profile, offers import of repositories, contribution data, language stats
- **Quick mentor access:** Floating button to start a mentor session from any page
- **Pitch context:** When browsing competitor websites, founder can tag "This is a competitor" and the extension captures the URL + summary for the competitive analysis section

### 5.5 OAuth Integrations

| Platform | Data Pulled                                            | Auth Method                                                         | Enrichment                                    |
| -------- | ------------------------------------------------------ | ------------------------------------------------------------------- | --------------------------------------------- |
| LinkedIn | Work history, education, connections, headline         | OAuth 2.0 (Sign In with LinkedIn) + People Data Labs for enrichment | Auto-populates experience + education signals |
| GitHub   | Public repos, languages, stars, commit frequency, orgs | OAuth 2.0 (GitHub Apps)                                             | Auto-populates technical capability signals   |
| Google   | Email (for account)                                    | OAuth 2.0                                                           | Account creation only                         |

---

## 6. Core Features — Phase 2 (Post 100+ Founder Profiles)

### 6.1 Investor Discovery Dashboard

Web application where investors browse, filter, and engage with scored founder profiles.

**Search & Filter:**

- Market category (SaaS, FinTech, HealthTech, etc.)
- Readiness Score range (minimum threshold)
- Traction stage (pre-revenue, early revenue, growth)
- Team size
- Location / timezone
- Specific signal filters (has AI/ML, has revenue, has prior founding experience)
- Optional pedigree filters (education, employer — not in default view)

**Profile Cards (Investor View):**

```
┌─────────────────────────────────────────┐
│  [Company Name]           Score: 78/100 │
│  One-line description                   │
│                                         │
│  Market: B2B SaaS / FinTech             │
│  Stage: Pre-seed | $500K raise          │
│  Traction: 12 design partners           │
│  Team: 2 founders (builder + seller)    │
│                                         │
│  Signal Strengths: ████ Problem         │
│                    ███░ Traction         │
│                    ██░░ Market           │
│                                         │
│  [View Profile]  [Message Founder]      │
└─────────────────────────────────────────┘
```

**Detail View (Requires Founder Approval):**

- Full published pitch sections
- Founder background detail
- GitHub/LinkedIn verified data
- Session engagement quality indicator

### 6.2 Messaging System

- Investors can send interest signals (lightweight, no message required)
- Founders see which investors viewed their profile and signaled interest
- If founder approves, opens direct messaging channel
- Built-in text messaging (real-time)
- Video call scheduling integration (Calendly or built-in)
- Message templates for common investor questions

### 6.3 Collaboration Engine (Phase 2.5)

- Founders can grant per-section edit access to specific SMEs/investors
- Google Docs-style suggesting/commenting mode
- Track changes with accept/reject
- Version history per section
- Similar to GitHub PR review workflow but for pitch content

### 6.4 Personalized Investor Scorecards (Phase 2 Future)

Investors can customize signal weights to match their thesis:

- "I only care about technical founders in AI" → weight technical signals 3x
- "I invest in non-obvious markets" → reduce TAM weight, increase problem weight
- Save as named scorecard templates
- Share scorecards with fund partners

---

## 7. Features — Phase 3 (Future)

### 7.1 Data Room Auto-Generation

- Auto-populate from founder profile and uploads
- Standard folder structure (incorporation, cap table, financials, references)
- Secure access controls per investor
- Audit trail of who viewed what

### 7.2 SAFE Note Generation

- Integrate with Clerky or Cooley GO templates
- Pre-populate from founder profile (company name, raise amount)
- E-signature integration (DocuSign or built-in)
- Cap table impact modeling

### 7.3 Founder-Led Roll-Up Vehicle

- Syndicate-style investment vehicle for multiple small checks
- SPV creation and management
- Compliance automation

### 7.4 Desktop App

- Electron-based for power users who want persistent mentor access
- Local LLM option for maximum privacy
- Deeper OS integration (calendar, email context)

---

## 8. Technical Architecture

### 8.1 System Overview

```
┌──────────────────────────────────────────────────────────────┐
│                      CLIENT LAYER                            │
│                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐   │
│  │ Browser Ext   │  │ Web App      │  │ PWA (Mobile)     │   │
│  │ (Plasmo/React)│  │ (Next.js)    │  │ (Next.js PWA)    │   │
│  └──────┬───────┘  └──────┬───────┘  └────────┬─────────┘   │
└─────────┼─────────────────┼────────────────────┼─────────────┘
          │                 │                    │
          ▼                 ▼                    ▼
┌──────────────────────────────────────────────────────────────┐
│                      API GATEWAY                             │
│              (Next.js API Routes / Vercel Edge)              │
└──────────────────────────┬───────────────────────────────────┘
                           │
          ┌────────────────┼────────────────┐
          ▼                ▼                ▼
┌──────────────┐  ┌──────────────┐  ┌──────────────────┐
│ Auth Service │  │ Core API     │  │ ML/Scoring       │
│ (Clerk)      │  │ (FastAPI)    │  │ (FastAPI/Python)  │
│              │  │              │  │                    │
│ - OAuth      │  │ - Profiles   │  │ - Signal Extract  │
│ - LinkedIn   │  │ - Sessions   │  │ - Rules Engine    │
│ - GitHub     │  │ - Messages   │  │ - Score Compute   │
│ - Google     │  │ - Search     │  │ - LLM Orchestr.   │
└──────────────┘  └──────┬───────┘  └────────┬─────────┘
                         │                    │
                         ▼                    ▼
               ┌──────────────────────────────────────┐
               │           DATA LAYER                  │
               │                                       │
               │  ┌────────────┐  ┌────────────────┐   │
               │  │ PostgreSQL │  │ pgvector       │   │
               │  │ (Profiles, │  │ (Embeddings,   │   │
               │  │  Sessions, │  │  Semantic      │   │
               │  │  Scores)   │  │  Search)       │   │
               │  └────────────┘  └────────────────┘   │
               │                                       │
               │  ┌────────────┐  ┌────────────────┐   │
               │  │ S3         │  │ Redis          │   │
               │  │ (Pitch     │  │ (Sessions,     │   │
               │  │  Decks,    │  │  Cache,        │   │
               │  │  Uploads)  │  │  Rate Limits)  │   │
               │  └────────────┘  └────────────────┘   │
               └──────────────────────────────────────┘
                           │
                           ▼
               ┌──────────────────────────────────────┐
               │        EXTERNAL SERVICES              │
               │                                       │
               │  ┌────────────┐  ┌────────────────┐   │
               │  │ Claude API │  │ People Data    │   │
               │  │ (Anthropic)│  │ Labs / Clearbit│   │
               │  └────────────┘  └────────────────┘   │
               │                                       │
               │  ┌────────────┐  ┌────────────────┐   │
               │  │ GitHub API │  │ Crunchbase API │   │
               │  └────────────┘  └────────────────┘   │
               └──────────────────────────────────────┘
```

### 8.2 Tech Stack Detail

| Layer                    | Technology                                                               | Rationale                                                            |
| ------------------------ | ------------------------------------------------------------------------ | -------------------------------------------------------------------- |
| **Frontend (Web)**       | Next.js 15+ (App Router), React, TypeScript, Tailwind CSS                | SSR for SEO, fast iteration, large ecosystem                         |
| **Frontend (Extension)** | Plasmo framework, React, TypeScript                                      | React-based Chrome/Firefox extension framework, handles manifest v3  |
| **Backend (Core API)**   | Python 3.12+, FastAPI, Pydantic                                          | Type-safe, async, excellent for data processing pipelines            |
| **Backend (Scoring)**    | Python, scikit-learn (V1 rules), PyTorch (V2 ML)                         | Rules engine first, ML when data supports it                         |
| **Database**             | PostgreSQL 16+ with pgvector extension                                   | Structured data + vector embeddings for semantic search              |
| **Cache / Sessions**     | Redis                                                                    | Conversation state, rate limiting, real-time features                |
| **Object Storage**       | AWS S3 + CloudFront CDN                                                  | Pitch decks, uploaded documents, profile images                      |
| **Auth**                 | Clerk                                                                    | OAuth with LinkedIn/GitHub/Google built-in, webhook support          |
| **LLM**                  | Claude API (claude-sonnet-4-6 for extraction, claude-haiku-4-5 for bulk) | Best structured extraction, strong reasoning, cost-efficient tiering |
| **Search**               | PostgreSQL full-text + pgvector (V1), Typesense (V2 if needed)           | Start simple, add dedicated search engine only if PG can't keep up   |
| **Hosting**              | Vercel (frontend), Railway or AWS ECS (backend)                          | Fast deploys, auto-scaling, managed infrastructure                   |
| **Monitoring**           | Sentry (errors), PostHog (analytics), Grafana (metrics)                  | Full observability stack                                             |
| **CI/CD**                | GitHub Actions                                                           | Standard, free for public repos, generous for private                |

### 8.3 Data Model (Core Entities)

```
Founder
├── id (UUID)
├── email
├── name
├── clerk_user_id
├── linkedin_data (JSONB) — enriched profile
├── github_data (JSONB) — enriched profile
├── created_at
└── updated_at

StartupProfile
├── id (UUID)
├── founder_id (FK)
├── company_name
├── one_liner
├── market_category
├── stage (pre_seed, seed, series_a)
├── raise_amount
├── pitch_sections (JSONB) — structured pitch content
├── published_sections (text[]) — which sections are public
├── created_at
└── updated_at

SignalScore
├── id (UUID)
├── startup_profile_id (FK)
├── overall_score (0-100)
├── category_scores (JSONB) — per-category breakdown
├── signal_details (JSONB) — individual signal values
├── engagement_quality_score (0-100)
├── scoring_version (string) — rubric version for reproducibility
├── computed_at
└── expires_at

MentorSession
├── id (UUID)
├── founder_id (FK)
├── session_type (big_picture, problem_market, business, ask, deep_dive)
├── conversation_history (JSONB) — stored locally, synced if founder opts in
├── extracted_signals (JSONB) — structured data pulled from conversation
├── session_summary (text)
├── started_at
└── completed_at

Investor (Phase 2)
├── id (UUID)
├── email
├── name
├── clerk_user_id
├── investor_type (angel, sme, micro_fund, scout)
├── thesis_keywords (text[])
├── check_size_range (int4range)
├── scorecard_config (JSONB) — custom signal weights
├── created_at
└── updated_at

Message (Phase 2)
├── id (UUID)
├── sender_id (UUID)
├── sender_type (founder, investor)
├── recipient_id (UUID)
├── recipient_type (founder, investor)
├── content (text, encrypted)
├── read_at
├── created_at
└── deleted_at

AccessGrant (Phase 2)
├── id (UUID)
├── founder_id (FK)
├── investor_id (FK)
├── granted_sections (text[])
├── permission_level (view, comment, suggest)
├── granted_at
└── revoked_at
```

### 8.4 AI/LLM Architecture

**Conversation Orchestration:**

```
Founder Message
      │
      ▼
┌─────────────────────────────────┐
│  Session Manager                │
│  - Tracks conversation state    │
│  - Determines current topic     │
│  - Selects next question        │
└──────────────┬──────────────────┘
               │
               ▼
┌─────────────────────────────────┐
│  Claude API (claude-sonnet-4-6) │
│                                 │
│  System Prompt:                 │
│  - Mentor persona               │
│  - Current session topic         │
│  - Signals to extract            │
│  - Founder's current profile     │
│  - Gap areas to probe            │
│                                 │
│  Output:                         │
│  - Mentor response (display)     │
│  - Extracted signals (structured)│
│  - Confidence scores per signal  │
│  - Suggested follow-up topic     │
└──────────────┬──────────────────┘
               │
               ▼
┌─────────────────────────────────┐
│  Signal Extractor               │
│  - Parses structured output     │
│  - Updates founder profile      │
│  - Recalculates scores          │
│  - Identifies remaining gaps    │
└─────────────────────────────────┘
```

**LLM Cost Optimization:**

| Task                 | Model                            | Est. Cost/Call | Volume             |
| -------------------- | -------------------------------- | -------------- | ------------------ |
| Mentor conversation  | claude-sonnet-4-6                | ~$0.02-0.05    | ~20 turns/session  |
| Signal extraction    | claude-sonnet-4-6                | ~$0.01-0.03    | Per turn           |
| Bulk re-scoring      | claude-haiku-4-5                 | ~$0.001-0.005  | Nightly batch      |
| Embedding generation | text-embedding (OpenAI or local) | ~$0.0001       | Per profile update |

**Estimated LLM cost per founder onboarding (4 sessions):** $3-8

---

## 9. Security & Compliance

### 9.1 Data Security

- All data encrypted at rest (AES-256) and in transit (TLS 1.3)
- Pitch content encrypted with per-founder keys
- OAuth tokens stored in encrypted vault (Clerk handles this)
- No raw LinkedIn/GitHub data stored — only extracted signals
- Database-level row security for multi-tenant isolation
- Regular penetration testing (quarterly)

### 9.2 Access Control

- Founders control all access to their detailed pitch content
- Investors can only see published sections + sections founder explicitly grants
- Access grants are revocable at any time
- Audit log of all data access events
- Rate limiting on all API endpoints
- CAPTCHA on account creation

### 9.3 Compliance

| Regulation             | Approach                                                                  |
| ---------------------- | ------------------------------------------------------------------------- |
| GDPR (EU)              | Consent-based data collection, right to deletion, data portability export |
| CCPA/CPRA (California) | Opt-out of data sales (we don't sell data), deletion requests honored     |
| SOC 2 Type II          | Target for Phase 2 (required for serious investor adoption)               |
| Financial regulations  | SAFE generation handled by Clerky integration (their compliance)          |

### 9.4 Idea Protection

- Founders never forced to publish any pitch content
- Watermarking on exported pitch documents
- NDA generation for investors viewing detailed pitches (Phase 3)
- Anonymized profile mode: investors see signals without company name (Phase 2 option)

---

## 10. Metrics & Success Criteria

### Phase 1 Success (Month 1-4)

| Metric                                                      | Target |
| ----------------------------------------------------------- | ------ |
| Founders onboarded (invite-only)                            | 30     |
| Avg. sessions per founder                                   | 3+     |
| Profile completion rate                                     | 70%+   |
| Session completion rate                                     | 80%+   |
| Founder NPS                                                 | 40+    |
| Scoring engine accuracy (founder self-assessment alignment) | 70%+   |

### Phase 2 Success (Month 5-8)

| Metric                            | Target |
| --------------------------------- | ------ |
| Founders with published profiles  | 100+   |
| Investors onboarded               | 25+    |
| Investor → Founder messages sent  | 50+    |
| Founder → Investor response rate  | 60%+   |
| Matches leading to calls/meetings | 15+    |
| First paying investor subscriber  | 1+     |

### North Star Metrics (12 months)

| Metric                                             | Target |
| -------------------------------------------------- | ------ |
| Deals consummated through platform                 | 5+     |
| Total capital facilitated                          | $500K+ |
| Monthly active founders                            | 200+   |
| Monthly active investors                           | 50+    |
| Monthly recurring revenue (investor subscriptions) | $5K+   |

---

## 11. Phased Roadmap

### Phase 1: Founder Agent + Scoring (Months 1-4)

**Month 1: Foundation**

- [ ] Project setup (Next.js, FastAPI, PostgreSQL, Clerk)
- [ ] Database schema and migrations
- [ ] Auth flow (email + LinkedIn OAuth + GitHub OAuth)
- [ ] Basic founder dashboard (profile page, settings)

**Month 2: AI Mentor Core**

- [ ] Conversation engine with Claude API integration
- [ ] Session management (4 session types + deep dives)
- [ ] Signal extraction pipeline (structured output from conversations)
- [ ] Local conversation storage with optional cloud sync
- [ ] Profile completeness tracking

**Month 3: Scoring Engine + Extension**

- [ ] Rules-based scoring engine (all signal categories)
- [ ] Score visualization (radar chart, trend line)
- [ ] Browser extension MVP (LinkedIn + GitHub import overlays)
- [ ] OAuth enrichment pipeline (LinkedIn, GitHub data pull)
- [ ] Suggested actions engine ("improve your traction section")

**Month 4: Polish + Design Partner Launch**

- [ ] Invite system (founder referral codes)
- [ ] Onboarding flow optimization
- [ ] Recruit 20-30 founder design partners
- [ ] Recruit 5-10 angel investor design partners (for feedback, not yet using)
- [ ] Scoring calibration with design partner feedback
- [ ] Bug fixes, performance optimization

### Phase 2: Investor Marketplace (Months 5-8)

**Month 5: Investor Dashboard**

- [ ] Investor registration and profile
- [ ] Search and filter interface
- [ ] Founder profile cards (public view)
- [ ] Interest signaling (lightweight engagement)

**Month 6: Messaging + Access Control**

- [ ] Direct messaging system
- [ ] Founder approval flow for profile access
- [ ] Per-section publish/private controls
- [ ] Notification system

**Month 7: Collaboration**

- [ ] Section-level commenting (investor feedback on pitch)
- [ ] Suggest/edit mode for granted sections
- [ ] Version history
- [ ] Video call scheduling integration

**Month 8: Monetization + Scale**

- [ ] Investor subscription billing (Stripe)
- [ ] Premium founder tier (advanced coaching, priority visibility)
- [ ] Personalized investor scorecards (custom signal weights)
- [ ] Public launch (remove invite-only gate for founders)

### Phase 3: Full Platform (Months 9-12+)

- [ ] Data room auto-generation
- [ ] SAFE note generation (Clerky integration)
- [ ] ML scoring model (trained on platform data)
- [ ] Desktop app (if demand warrants)
- [ ] Mobile app
- [ ] API for third-party integrations
- [ ] Founder-led roll-up vehicle

---

## 12. Risks & Mitigations

| Risk                                             | Likelihood | Impact   | Mitigation                                                                                               |
| ------------------------------------------------ | ---------- | -------- | -------------------------------------------------------------------------------------------------------- |
| Founders don't trust platform with ideas         | High       | Critical | Tiered privacy model, local-first storage, anonymized mode, founder controls everything                  |
| LinkedIn restricts API access                    | Medium     | High     | Use People Data Labs as fallback enrichment, make LinkedIn optional not required                         |
| Scoring model doesn't predict investor interest  | Medium     | High     | Start with rules (transparent), calibrate with design partners, iterate based on real match data         |
| Cold start — not enough founders for investors   | High       | High     | Launch founder-side first, build inventory before opening investor side                                  |
| Solo founder burnout                             | High       | Critical | Scope ruthlessly, use AI tools aggressively, ship the narrowest slice, get design partner feedback early |
| Regulatory changes (AI regulation, data privacy) | Medium     | Medium   | Consent-based data collection, minimal data retention, modular architecture allows policy changes        |
| Competitor copies the approach                   | Medium     | Low      | Data network effects create moat — more founders = better scoring = more investors = more founders       |

---

## 13. Open Questions

1. **Brand name** — "ZStar" is a placeholder. Need trademark search.
2. **Geographic scope** — US-only launch or global from day one?
3. **Vertical focus** — All startups, or niche down (e.g., AI startups only, B2B SaaS only)?
4. **Advisor equity** — Should design partners get advisory equity or other compensation?
5. **Regulatory** — Do we need a broker-dealer license for facilitating investments? (Likely yes for SAFE facilitation — need legal counsel.)
6. **Insurance** — E&O insurance for scoring recommendations that influence investment decisions?

---

## 14. Appendix: Key Investor Signal Rubric (Original)

The complete signal rubric as provided by the founder is preserved in Section 5.2 with modifications for capability-default scoring. The original pedigree-heavy signals are available as optional investor filters per Decision #9.

---

_This document should be treated as a living artifact. Update as decisions are validated or invalidated through design partner feedback._
