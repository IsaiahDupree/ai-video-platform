# PRD: Apple App Store Product Page Builder

## 1. One-liner

A workflow tool that creates and manages App Store product pages, including Custom Product Pages (CPP) and Product Page Optimization (PPO) tests, with automation via App Store Connect API.

## 2. Problem

Creating and managing App Store product pages is:
- Tedious manual work in App Store Connect
- Hard to A/B test effectively
- Difficult to maintain consistency across locales
- No version control or approval workflows
- Screenshots require precise sizing and localization

## 3. Goals

- Generate App Store assets (screenshots, previews) programmatically
- Create and manage Custom Product Pages (CPP)
- Run Product Page Optimization (PPO) tests
- Automate deployment via App Store Connect API
- Support multi-locale asset generation

## 4. Non-goals

- App submission/review process management
- In-app purchase configuration
- App analytics dashboard (use App Store Connect)

## 5. Target Users

- iOS/macOS app developers
- App marketing teams
- ASO (App Store Optimization) specialists
- Indie developers managing multiple apps

## 6. Background: Apple Product Pages

### Default Product Page
- One page per app (main listing)
- Screenshots, app preview videos, description, keywords
- Localized per supported language

### Custom Product Pages (CPP)
- Up to 35 custom pages per app
- Unique URL for each page
- Different screenshots, promotional text, app previews
- Use case: targeted campaigns, different audiences

### Product Page Optimization (PPO)
- A/B test up to 3 treatments against original
- Test: icon, screenshots, app preview
- Apple provides statistical significance results

## 7. Core User Journeys

### J1: Generate Screenshot Set
1. Upload app screenshots or provide Figma frames
2. Select device frames (iPhone 15, iPad, etc.)
3. Add localized captions/overlays
4. Generate all required sizes
5. Export ZIP organized by locale/device

### J2: Create Custom Product Page
1. Select app from connected App Store Connect
2. Choose base page or start fresh
3. Customize: screenshots, promotional text, previews
4. Preview in device mockups
5. Submit to App Store Connect via API

### J3: Run PPO Test
1. Select app and default page
2. Create 1-3 treatment variants
3. Configure test (traffic split, duration)
4. Submit test via API
5. Monitor results, apply winner

## 8. Requirements

### P0 (MVP)

#### Screenshot Generator
- Device frame templates (iPhone, iPad, Apple Watch, Mac)
- Caption overlay system (text + position + style)
- Batch resize to all required dimensions
- Export organized by locale

#### Asset Management
- Asset library per app
- Version history
- Locale management (copy assets across locales)

#### App Store Connect Integration
- OAuth with App Store Connect API
- Fetch app list and metadata
- Create/update Custom Product Pages
- Upload screenshots and previews

#### Preview System
- Device mockup previews
- Side-by-side locale comparison
- Before/after comparison

### P1 (Next)

#### Product Page Optimization
- Create PPO test configurations
- Submit tests via API
- Fetch and display results
- Apply winning treatment

#### Figma Integration
- Import frames from Figma
- Auto-detect device sizes
- Sync updates

#### Localization Workflow
- Translation memory
- AI translation suggestions
- Locale-specific preview

#### Approval Workflow
- Multi-user collaboration
- Review and approve states
- Comment system

### P2 (Later)

#### Analytics Integration
- Conversion rate tracking
- CPP performance comparison
- Historical performance trends

#### Template Library
- Pre-built screenshot templates
- Industry-specific designs
- Caption style presets

#### Video Preview Generator
- App preview video creation
- Screen recording processing
- Caption/overlay for videos

## 9. Data Model

```typescript
interface App {
  id: string;
  app_store_id: string;
  name: string;
  bundle_id: string;
  platforms: ('ios' | 'macos' | 'tvos' | 'watchos')[];
}

interface ProductPage {
  id: string;
  app_id: string;
  type: 'default' | 'custom';
  name: string;
  url_slug?: string; // for CPP
  status: 'draft' | 'submitted' | 'approved' | 'live';
}

interface Screenshot {
  id: string;
  product_page_id: string;
  locale: string;
  device_type: string;
  display_order: number;
  image_url: string;
  caption?: string;
}

interface AppPreview {
  id: string;
  product_page_id: string;
  locale: string;
  device_type: string;
  video_url: string;
  poster_url: string;
}

interface PPOTest {
  id: string;
  app_id: string;
  status: 'draft' | 'running' | 'completed' | 'cancelled';
  treatments: Treatment[];
  start_date?: Date;
  end_date?: Date;
  results?: PPOResults;
}

interface Treatment {
  id: string;
  name: string;
  screenshots: Screenshot[];
  icon_variant?: string;
}

interface PPOResults {
  winner: string;
  confidence: number;
  impressions: Record<string, number>;
  conversions: Record<string, number>;
}
```

## 10. System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                 Apple Product Page Builder                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐       │
│  │   Web App    │    │   API        │    │   Workers    │       │
│  │   (Next.js)  │───▶│   Server     │───▶│  (Image Gen) │       │
│  │   Editor     │    │   (Node)     │    │  (Remotion)  │       │
│  └──────────────┘    └──────────────┘    └──────────────┘       │
│         │                   │                   │                │
│         ▼                   ▼                   ▼                │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                    Integrations                           │   │
│  │  ┌─────────┐  ┌─────────────┐  ┌─────────┐  ┌─────────┐  │   │
│  │  │  ASC    │  │   Figma     │  │  S3/R2  │  │ Postgres│  │   │
│  │  │  API    │  │   API       │  │ Storage │  │   DB    │  │   │
│  │  └─────────┘  └─────────────┘  └─────────┘  └─────────┘  │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

## 11. Screenshot Size Requirements

### iPhone Screenshots
| Device | Portrait | Landscape |
|--------|----------|-----------|
| 6.7" (iPhone 15 Pro Max) | 1290×2796 | 2796×1290 |
| 6.5" (iPhone 11 Pro Max) | 1242×2688 | 2688×1242 |
| 5.5" (iPhone 8 Plus) | 1242×2208 | 2208×1242 |

### iPad Screenshots
| Device | Portrait | Landscape |
|--------|----------|-----------|
| 12.9" (iPad Pro) | 2048×2732 | 2732×2048 |
| 11" (iPad Pro) | 1668×2388 | 2388×1668 |

### Apple Watch Screenshots
| Device | Size |
|--------|------|
| Series 9 (45mm) | 396×484 |
| Series 9 (41mm) | 352×430 |
| Ultra 2 | 410×502 |

## 12. App Store Connect API Endpoints

| Endpoint | Purpose |
|----------|---------|
| `GET /v1/apps` | List apps |
| `GET /v1/apps/{id}/appStoreVersions` | Get versions |
| `POST /v1/appScreenshots` | Upload screenshot |
| `POST /v1/appPreviews` | Upload preview |
| `GET /v1/appCustomProductPages` | List CPPs |
| `POST /v1/appCustomProductPages` | Create CPP |
| `GET /v1/appStoreVersionExperiments` | List PPO tests |
| `POST /v1/appStoreVersionExperiments` | Create PPO test |

## 13. Success Metrics

- Time to create CPP < 15 minutes
- Screenshot generation < 30 seconds per set
- 95% API submission success rate
- Support 10+ locales per app

## 14. Risks

- App Store Connect API rate limits
- Apple policy changes on CPP/PPO
- Screenshot validation rules changes
- OAuth token management complexity

## 15. Milestones

| Milestone | Deliverables |
|-----------|--------------|
| M1 | Screenshot generator + device frames |
| M2 | ASC integration + CPP creation |
| M3 | PPO test management |
| M4 | Figma integration + localization workflow |
