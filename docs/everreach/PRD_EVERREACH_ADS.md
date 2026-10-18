# EverReach Ad System PRD

## Overview

A systematic static ad generation system for EverReach targeting Meta platforms (Facebook, Instagram, Threads) with ads organized by awareness level, belief cluster, and pain point.

---

## 1. Product Summary

**EverReach** is AI-powered relationship intelligence that tells you exactly who to reach out to, what to say, and when—so your network never goes cold.

### Core Value Proposition
- Prevents relationship decay
- 60-second follow-up workflow
- Daily "who matters today" system
- AI-generated message drafts you control

### ICP Segments
- Founders / Operators
- Sales / Biz Dev
- Consultants / Agencies
- Recruiters
- Creators with brand partnerships

---

## 2. Ad System Architecture

### 2.1 Awareness Pyramid Levels

| Level | Goal | Hook Style |
|-------|------|------------|
| **Unaware** | Make problem obvious | Life insight → habit → soft reveal |
| **Problem Aware** | Make pain personal + urgent | Pain → cost → fix |
| **Solution Aware** | Position as simplest way | Compare alternatives → mechanism |
| **Product Aware** | Handle objections + close | Demo + objections + CTA |
| **Most Aware** | Direct CTA + proof | Proof + risk reversal + urgency |

### 2.2 Belief Clusters

| Belief | Pain Point | Promise | Objection |
|--------|------------|---------|-----------|
| **Too Busy** | Forgetting check-ins | Never let relationship go cold | Setup takes forever |
| **Hate CRMs** | System fragmentation | Daily "who matters" list | Already have tools |
| **Feels Cringe** | Fear of sounding salesy | Sound like you, not a template | AI makes it robotic |
| **Revenue Loss** | Missed opportunities | Relationships = pipeline | Not sure ROI |
| **Privacy First** | Data trust | You control everything | Don't trust syncing |
| **Already Organized** | Notes everywhere | One place, one action | Don't need another tool |

### 2.3 Ad Formats

| Format | Best For | Dimensions |
|--------|----------|------------|
| Instagram Post | Feed engagement | 1080×1080 |
| Instagram Story | Full-screen impact | 1080×1920 |
| Facebook Post | Link clicks | 1200×630 |
| Facebook Story | Immersive | 1080×1920 |
| Threads Post | Text-forward | 1080×1080 |

---

## 3. Static Ad Templates

### Template Types

1. **HeadlineAd** - Bold headline + subtext + CTA
2. **PainPointAd** - Problem statement + solution hint
3. **ListicleAd** - Numbered benefits or objections
4. **TestimonialAd** - Quote + author + rating
5. **ComparisonAd** - Before/After or Us vs Them
6. **StatAd** - Big number + context
7. **QuestionAd** - Hook question + answer hint

### Visual Components

- **Logo placement**: Top-left, top-center, bottom-center
- **Background options**: Gradient, solid, image overlay
- **CTA button styles**: Pill, rectangle, text-only
- **Typography**: Inter font family, high contrast

---

## 4. Messaging Pillars

### Pillar A - "Never let a relationship go cold"
- Staying top-of-mind is competitive advantage
- Your network is an asset that needs maintenance

### Pillar B - "60-second follow-up"
- Real blocker is friction + thinking time
- EverReach gives immediate next action

### Pillar C - "Stop relying on memory"
- Memory is not a system
- Best relationships deserve structure

### Pillar D - "Relationships compound"
- Consistent outreach creates exponential opportunity

---

## 5. Copy Bank

### Headlines by Awareness Level

**Unaware**
- "Your network is quietly getting weaker"
- "Most people lose opportunities for one reason: timing"
- "The people who matter most don't show up as urgent"

**Problem Aware**
- "If you have 200+ contacts, you're forgetting people"
- "The worst follow-up system is 'I'll remember'"
- "Relationships don't disappear. They decay."

**Solution Aware**
- "Reminders aren't enough. You also need the words."
- "CRMs are for logging, not keeping relationships warm"
- "The best system is the one you'll actually use daily"

**Product Aware**
- "Pick one person. Get a message. Send in 60 seconds."
- "No data entry. No pipelines. Just momentum."
- "Relationship intelligence, not contact storage."

**Most Aware**
- "Start with 1 person today"
- "Stop losing deals to silence"
- "Turn your network into a weekly opportunity engine"

### CTAs
- "Start with 1 person"
- "Try it free"
- "See who's going cold"
- "Get your first message"

---

## 6. Angle Matrix

### Phase A Testing (Broad Audience)

| # | Awareness | Belief | Angle | Hook |
|---|-----------|--------|-------|------|
| 1 | Unaware | Timing | Invisible drift | "People don't fall out, they fade out" |
| 2 | Unaware | Busy | Mental load tax | "The hard part is deciding who" |
| 3 | Unaware | Habit | One minute workout | "One minute. One person. Done." |
| 4 | Unaware | Future | Regret rewind | "Future you will thank you" |
| 5 | Problem | System | Network vs system | "Your network isn't small. Your system is." |
| 6 | Problem | Decay | Relationship decay | "Relationships decay, not disappear" |
| 7 | Problem | Memory | Memory fails | "The worst system is 'I'll remember'" |
| 8 | Solution | Words | Reminders fail | "Reminders don't tell you what to say" |
| 9 | Solution | CRM | Action vs logging | "CRMs store info, not trigger action" |
| 10 | Product | Demo | Quick demo | "Pick one. Get message. Send." |

### Objection Handling (Product Aware)

| Objection | Counter | Visual Proof |
|-----------|---------|--------------|
| Setup time | Start with 1 person | Skip import button |
| Privacy | You control data | Permission toggles |
| AI sounds fake | You edit before send | Edit cursor on draft |
| Will spam | One message at a time | Daily limit badge |
| Auto-send fear | You approve every message | Approval toggle |
| Already have CRM | This is action layer | CRM → EverReach flow |
| Not in sales | Works for all relationships | Friend check-in example |
| Pricing | One saved relationship covers it | ROI calculation |
| Cancel | Cancel anytime | Settings screenshot |

---

## 7. Meta Platform Specs

### Instagram

| Placement | Size | Aspect | Safe Zone |
|-----------|------|--------|-----------|
| Feed Post | 1080×1080 | 1:1 | Full |
| Feed Landscape | 1080×566 | 1.91:1 | Full |
| Story/Reel | 1080×1920 | 9:16 | Top 14%, Bottom 20% |
| Carousel | 1080×1080 | 1:1 | Full |

### Facebook

| Placement | Size | Aspect | Safe Zone |
|-----------|------|--------|-----------|
| Feed | 1200×630 | 1.91:1 | Full |
| Story | 1080×1920 | 9:16 | Top 14%, Bottom 20% |
| Right Column | 1200×1200 | 1:1 | Full |
| Marketplace | 1200×1200 | 1:1 | Full |

### Threads
| Placement | Size | Aspect |
|-----------|------|--------|
| Post | 1080×1080 | 1:1 |

---

## 8. File Structure

```
src/compositions/everreach/
├── EverReachAds.tsx          # Main ad components
├── types.ts                   # TypeScript interfaces
├── config.ts                  # Colors, fonts, copy bank
└── angles.ts                  # Angle matrix data

public/assets/everreach/
├── logos/
│   └── everreach-logo.svg
├── backgrounds/
│   └── gradient-purple.png
└── products/
    └── app-screenshot.png

output/everreach-ads/
├── instagram-post/
├── instagram-story/
├── facebook-post/
└── facebook-story/

docs/everreach/
├── PRD_EVERREACH_ADS.md      # This document
└── RENDER_GUIDE.md           # How to generate ads
```

---

## 9. Rendering Workflow

1. **Select angle** from matrix (awareness × belief)
2. **Choose format** (Instagram Post, Story, etc.)
3. **Customize props** (headline, subheadline, CTA, colors)
4. **Render** via CLI or script
5. **Export** to Meta Ads Manager

### CLI Example
```bash
npx remotion still EverReach-Instagram-Post output/ad.png \
  --props='{"awareness":"problem","belief":"busy","headline":"Your network isn't small","ctaText":"Start with 1 person"}'
```

---

## 10. Success Metrics

### Gate 1: Creative Viability
- 3-sec view rate (thumbstop)
- CTR link
- CPC

### Gate 2: Conversion
- CPA to Activated Trial
- CPA to Purchase
- Activation rate

### Tracking
- UTM: `utm_content=P{prompt_id}_A{awareness}_B{belief}`
- Naming: `ER_{awareness}_{belief}_{format}_{version}`

---

*Last updated: January 2, 2026*
