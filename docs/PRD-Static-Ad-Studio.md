# PRD: Remotion Static Ad Studio

## 1. One-liner

A web app + render service that lets teams generate on-brand static ad creatives (multi-size, multi-variant) using Remotion still rendering.

## 2. Problem

Designing static ad creatives at scale is slow:
- Too many sizes (IG post/story, FB feed, display, etc.)
- Copy changes constantly
- Brand consistency drifts
- Exporting and organizing variants is painful

## 3. Goals

- Generate high-quality static ads from templates in minutes
- Produce size packs + copy variants (A/B-ready)
- Enforce brand consistency with guardrails (fonts, colors, spacing)
- Support batch generation from CSV/product feeds

## 4. Non-goals

- Full video ad generation (future expansion)
- Media buying/launching campaigns inside ad platforms (export + API hooks only in MVP)
- Being a design tool replacement (Figma/PS) — this is a "template + automation" system

## 5. Target Users

- Solopreneurs & marketers
- Agencies creating many variations
- SaaS/ecom teams producing ads weekly

## 6. Core User Journeys

### J1: Create One Creative
1. Choose template
2. Select Brand Kit
3. Fill fields (headline, image, CTA)
4. Preview
5. Render/export

### J2: Generate a Full Campaign Pack
1. Choose "Campaign Pack"
2. Pick sizes
3. Add 5–20 copy variants
4. Batch render
5. Download ZIP + manifest

### J3: Batch from CSV/Feed
1. Upload CSV (SKU, name, price, URL, image)
2. Map columns to template fields
3. Generate 50–500 creatives
4. Export

## 7. Requirements

### P0 (MVP)

#### Template System
- Template library (10–20 starter templates)
- Templates are React components built as Remotion stills (`<Still />` compositions)
- Editable fields: text, colors (from Brand Kit), images, logos, price badges, QR code

#### Brand Kits
- Upload logo(s), choose fonts, define color palette, spacing scale
- Lock "non-editable" brand properties per workspace (admin control)

#### Editor
- Form-driven editor + live preview (no timeline needed)
- Auto-fit text (shrink-to-fit, line clamp, safe-area overlays)
- Image positioning: cover/contain, focal point, rounded corners

#### Rendering
- Render service (Node) uses `@remotion/renderer` → `renderStill()` to output PNG/JPG/WebP (optionally PDF)
- Size presets: 1080×1080, 1080×1920, 1200×628, 1080×1350, etc.
- Job queue + concurrency control (avoid browser thrash)

#### Exports
- Download ZIP:
  - `/creative/<variant>/<size>.png`
  - `manifest.json` (template, fields, timestamps, sizes)
- Naming rules: `campaign_template_variant_size_timestamp.ext`

#### Auth + Permissions
- Roles: Owner/Admin/Editor/Viewer
- Workspace separation, per-workspace Brand Kits

### P1 (Next)

- Multi-language localization (per creative)
- "Variant generator": automatically produce 10 headline rewrites (AI hook) + render them
- Approval workflow (comments, status: Draft → In Review → Approved)
- Integrations:
  - Webhook on "render complete"
  - Push to Google Drive/S3/R2
- Creative QA checks:
  - Contrast warnings
  - Text overflow detection
  - Logo minimum size enforcement

### P2 (Later)

- Feed-driven "always-on" creatives (auto-regenerate when price changes)
- Platform-specific export bundles (Meta/Google fields + upload helper)
- Video ads (upgrade to `renderMedia()`)

## 8. Data Model

```typescript
interface Workspace {
  id: string;
  name: string;
}

interface User {
  id: string;
  role: 'owner' | 'admin' | 'editor' | 'viewer';
  workspace_id: string;
}

interface BrandKit {
  id: string;
  workspace_id: string;
  colors: { primary: string; secondary: string; accent: string };
  fonts: { heading: string; body: string };
  logos: string[];
}

interface Template {
  id: string;
  name: string;
  version: number;
  schema_json: object;
}

interface Creative {
  id: string;
  workspace_id: string;
  template_id: string;
  brandkit_id: string;
  fields_json: object;
  status: 'draft' | 'in_review' | 'approved';
}

interface RenderJob {
  id: string;
  creative_id: string;
  sizes: string[];
  formats: string[];
  status: 'queued' | 'processing' | 'completed' | 'failed';
  output_urls: string[];
  logs: string;
}
```

## 9. System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    Static Ad Studio                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐       │
│  │   Web App    │    │  Render API  │    │   Workers    │       │
│  │   (Next.js)  │───▶│    (Node)    │───▶│  (Remotion)  │       │
│  │   Editor     │    │    Queue     │    │  renderStill │       │
│  └──────────────┘    └──────────────┘    └──────────────┘       │
│         │                   │                   │                │
│         ▼                   ▼                   ▼                │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                      Storage                              │   │
│  │  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────────┐  │   │
│  │  │ Postgres│  │  Redis  │  │  S3/R2  │  │   Assets    │  │   │
│  │  │ (Data)  │  │ (Queue) │  │(Outputs)│  │  (Uploads)  │  │   │
│  │  └─────────┘  └─────────┘  └─────────┘  └─────────────┘  │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

## 10. Size Presets

| Name | Dimensions | Use Case |
|------|------------|----------|
| IG Square | 1080×1080 | Instagram Feed |
| IG Story | 1080×1920 | Instagram/FB Stories |
| FB Feed | 1200×628 | Facebook Feed |
| IG Portrait | 1080×1350 | Instagram Feed |
| Twitter | 1200×675 | Twitter/X |
| LinkedIn | 1200×627 | LinkedIn Feed |
| Pinterest | 1000×1500 | Pinterest Pin |
| Display | 300×250 | Google Display |
| Leaderboard | 728×90 | Google Display |

## 11. Success Metrics

- Time-to-first-export < 3 minutes
- 95% render success rate
- Avg render time per still < 10–20s
- Weekly active creators / exports per workspace

## 12. Risks

- Font licensing / embedding
- Headless chrome instability at high concurrency
- Template bloat (need strict schema + versioning)

## 13. Milestones

| Milestone | Deliverables |
|-----------|--------------|
| M1 | 5 templates + renderStill pipeline working |
| M2 | Brand kits + editor + exports |
| M3 | Batch generation + queue hardening |
| M4 | Approvals + integrations |
