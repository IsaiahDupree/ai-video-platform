/**
 * Preview Generator
 *
 * Generates thumbnail previews and an HTML gallery for browsing
 * ad variants before uploading to Meta. Uses Remotion's renderStill
 * for quick static previews of each variant × size combination.
 */

import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';
import type { AdVariant, AdSize, BrandConfig, AdBatch } from './types';

// =============================================================================
// Thumbnail Generation
// =============================================================================

const TEMPLATE_COMPOSITION_PREFIX: Record<string, string> = {
  before_after: 'UGC-BeforeAfter',
  testimonial: 'UGC-Testimonial',
  product_demo: 'UGC-ProductDemo',
  problem_solution: 'UGC-ProblemSolution',
};

const SIZE_SUFFIX: Record<string, string> = {
  feed_square: 'Post',
  feed_portrait: 'Portrait',
  story: 'Story',
  reels: 'Story',
  fb_feed: 'Landscape',
  fb_square: 'Post',
};

function getStillCompositionId(template: string, sizeName: string): string {
  const prefix = TEMPLATE_COMPOSITION_PREFIX[template] || 'UGC-BeforeAfter';
  const suffix = SIZE_SUFFIX[sizeName] || 'Post';
  return `${prefix}-${suffix}-Still`;
}

export interface PreviewResult {
  variantId: string;
  template: string;
  size: string;
  thumbnailPath: string;
  width: number;
  height: number;
}

/**
 * Render a single thumbnail preview
 */
function renderThumbnail(
  compositionId: string,
  props: Record<string, unknown>,
  outputPath: string,
  width: number,
  height: number,
): boolean {
  const projectRoot = path.resolve(__dirname, '../..');
  const propsFile = path.join(path.dirname(outputPath), `_thumb_props_${Date.now()}.json`);
  fs.writeFileSync(propsFile, JSON.stringify(props));

  try {
    // Render at half resolution for faster thumbnails
    const thumbWidth = Math.round(width / 2);
    const thumbHeight = Math.round(height / 2);

    execSync(
      `npx remotion still "${compositionId}" "${outputPath}" --props="${propsFile}" --width=${thumbWidth} --height=${thumbHeight} --quality=60`,
      { cwd: projectRoot, stdio: 'pipe', timeout: 30000 }
    );
    return true;
  } catch {
    return false;
  } finally {
    if (fs.existsSync(propsFile)) fs.unlinkSync(propsFile);
  }
}

/**
 * Build props for a variant preview (lightweight version)
 */
function buildPreviewProps(
  variant: AdVariant,
  brand: BrandConfig,
): Record<string, unknown> {
  const p = variant.parameters;
  const shared = {
    brandName: brand.name,
    primaryColor: brand.primaryColor,
    accentColor: brand.accentColor,
    fontFamily: brand.fontFamily || 'Inter, system-ui, sans-serif',
    colorScheme: p.visual.colorScheme === 'light' ? 'light' : 'dark',
  };

  const template = p.visual.template;

  if (template === 'before_after') {
    return {
      ...shared,
      headline: p.copy.headline,
      subheadline: p.copy.subheadline,
      ctaText: p.copy.ctaText,
      beforeLabel: p.copy.beforeLabel,
      afterLabel: p.copy.afterLabel,
      badge: p.structure.hasBadge ? 'AD-FREE' : undefined,
      trustLine: p.structure.hasTrustLine ? 'Quality preserved • No popups' : undefined,
      labelStyle: p.structure.labelStyle,
    };
  }

  if (template === 'testimonial') {
    return {
      ...shared,
      headline: p.copy.headline,
      testimonialQuote: p.copy.subheadline,
      authorName: 'Happy User',
      authorTitle: 'Creator',
      ctaText: p.copy.ctaText,
      badge: p.structure.hasBadge ? '4.9★ RATED' : undefined,
      rating: 5,
    };
  }

  if (template === 'product_demo') {
    return {
      ...shared,
      headline: p.copy.headline,
      subheadline: p.copy.subheadline,
      ctaText: p.copy.ctaText,
      badge: p.structure.hasBadge ? 'SIMPLE' : undefined,
      steps: [
        { icon: '📤', title: 'Upload', description: 'Drop your file' },
        { icon: '✨', title: 'Process', description: 'AI does the work' },
        { icon: '📥', title: 'Download', description: 'Get clean output' },
      ],
    };
  }

  if (template === 'problem_solution') {
    return {
      ...shared,
      headline: p.copy.headline,
      problemText: p.copy.subheadline,
      solutionText: 'Get clean results instantly.',
      ctaText: p.copy.ctaText,
      badge: p.structure.hasBadge ? 'SOLVED' : undefined,
      trustLine: p.structure.hasTrustLine ? 'No ads · No installs · Works instantly' : undefined,
    };
  }

  return { ...shared, headline: p.copy.headline, ctaText: p.copy.ctaText };
}

/**
 * Generate thumbnail previews for all variants in a batch
 */
export async function generatePreviews(
  batch: AdBatch,
  brand: BrandConfig,
  previewSize: AdSize,
  outputDir: string
): Promise<PreviewResult[]> {
  console.log(`\n🖼️  Generating previews for ${batch.variants.length} variants`);
  console.log(`   Size: ${previewSize.name} (${previewSize.width}×${previewSize.height})`);

  fs.mkdirSync(outputDir, { recursive: true });

  const results: PreviewResult[] = [];
  let successCount = 0;

  for (const variant of batch.variants) {
    const template = variant.parameters.visual.template;
    const compositionId = getStillCompositionId(template, previewSize.name);
    const thumbPath = path.join(outputDir, `${variant.id}_thumb.png`);

    const props = buildPreviewProps(variant, brand);
    const ok = renderThumbnail(compositionId, props, thumbPath, previewSize.width, previewSize.height);

    if (ok) {
      successCount++;
      results.push({
        variantId: variant.id,
        template,
        size: previewSize.name,
        thumbnailPath: thumbPath,
        width: Math.round(previewSize.width / 2),
        height: Math.round(previewSize.height / 2),
      });
    }

    process.stdout.write(`\r   ${successCount}/${batch.variants.length} thumbnails`);
  }

  console.log(`\n   ✅ ${successCount} thumbnails generated in ${outputDir}`);
  return results;
}

// =============================================================================
// HTML Gallery Generator
// =============================================================================

/**
 * Generate a static HTML gallery page for reviewing variants
 */
export function generateGalleryHTML(
  batch: AdBatch,
  previews: PreviewResult[],
  outputPath: string
): void {
  const previewMap = new Map(previews.map(p => [p.variantId, p]));

  const variantCards = batch.variants.map(v => {
    const p = v.parameters;
    const preview = previewMap.get(v.id);
    const thumbSrc = preview ? path.relative(path.dirname(outputPath), preview.thumbnailPath) : '';

    return `
      <div class="card" data-template="${p.visual.template}" data-hook="${p.copy.hookType}" data-awareness="${p.targeting.awarenessLevel}" data-cta="${p.copy.ctaType}">
        <div class="thumb">
          ${thumbSrc ? `<img src="${thumbSrc}" alt="${v.id}" loading="lazy" />` : `<div class="placeholder">${p.visual.template}</div>`}
        </div>
        <div class="meta">
          <div class="variant-id">${v.id}</div>
          <div class="headline">${escapeHtml(p.copy.headline)}</div>
          <div class="tags">
            <span class="tag template">${p.visual.template}</span>
            <span class="tag hook">${p.copy.hookType}</span>
            <span class="tag awareness">${p.targeting.awarenessLevel}</span>
            <span class="tag cta">${p.copy.ctaType}</span>
          </div>
          <div class="details">
            <div><strong>CTA:</strong> ${escapeHtml(p.copy.ctaText)}</div>
            <div><strong>Label:</strong> ${p.structure.labelStyle} | <strong>Scheme:</strong> ${p.visual.colorScheme}</div>
            ${v.performance ? `
              <div class="perf">
                <span>CTR: ${v.performance.ctr.toFixed(1)}%</span>
                <span>ROAS: ${v.performance.roas.toFixed(1)}x</span>
                <span>$${v.performance.spend.toFixed(0)} spend</span>
              </div>
            ` : ''}
          </div>
        </div>
      </div>`;
  }).join('\n');

  // Collect unique values for filters
  const templates = [...new Set(batch.variants.map(v => v.parameters.visual.template))];
  const hooks = [...new Set(batch.variants.map(v => v.parameters.copy.hookType))];
  const awareness = [...new Set(batch.variants.map(v => v.parameters.targeting.awarenessLevel))];

  const filterButtons = (label: string, values: string[], attr: string) =>
    `<div class="filter-group">
      <span class="filter-label">${label}:</span>
      <button class="filter-btn active" data-filter="${attr}" data-value="all">All</button>
      ${values.map(v => `<button class="filter-btn" data-filter="${attr}" data-value="${v}">${v}</button>`).join('')}
    </div>`;

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>UGC Ad Gallery — ${batch.id}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: Inter, system-ui, sans-serif; background: #0a0a0f; color: #e5e5e5; padding: 24px; }
    h1 { font-size: 24px; font-weight: 700; margin-bottom: 4px; }
    .subtitle { color: #a1a1aa; font-size: 14px; margin-bottom: 24px; }
    .stats { display: flex; gap: 24px; margin-bottom: 24px; flex-wrap: wrap; }
    .stat { background: #18181b; border: 1px solid #27272a; border-radius: 12px; padding: 16px 20px; min-width: 140px; }
    .stat-value { font-size: 28px; font-weight: 700; color: #fff; }
    .stat-label { font-size: 12px; color: #71717a; margin-top: 4px; text-transform: uppercase; letter-spacing: 0.05em; }
    .filters { background: #18181b; border: 1px solid #27272a; border-radius: 12px; padding: 16px; margin-bottom: 24px; display: flex; flex-direction: column; gap: 8px; }
    .filter-group { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
    .filter-label { font-size: 12px; font-weight: 600; color: #71717a; min-width: 80px; text-transform: uppercase; }
    .filter-btn { background: #27272a; border: 1px solid #3f3f46; color: #a1a1aa; padding: 4px 12px; border-radius: 16px; font-size: 12px; cursor: pointer; transition: all 0.15s; }
    .filter-btn:hover { background: #3f3f46; color: #fff; }
    .filter-btn.active { background: #6366f1; border-color: #6366f1; color: #fff; }
    .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 16px; }
    .card { background: #18181b; border: 1px solid #27272a; border-radius: 16px; overflow: hidden; transition: transform 0.15s, border-color 0.15s; }
    .card:hover { transform: translateY(-2px); border-color: #6366f1; }
    .card.hidden { display: none; }
    .thumb { background: #0f0f14; aspect-ratio: 1; display: flex; align-items: center; justify-content: center; }
    .thumb img { width: 100%; height: 100%; object-fit: contain; }
    .placeholder { color: #3f3f46; font-size: 14px; font-weight: 600; text-transform: uppercase; }
    .meta { padding: 16px; }
    .variant-id { font-size: 11px; font-family: monospace; color: #6366f1; margin-bottom: 6px; }
    .headline { font-size: 16px; font-weight: 600; color: #fff; margin-bottom: 8px; line-height: 1.3; }
    .tags { display: flex; gap: 6px; flex-wrap: wrap; margin-bottom: 10px; }
    .tag { font-size: 11px; padding: 2px 8px; border-radius: 10px; font-weight: 500; }
    .tag.template { background: #6366f120; color: #818cf8; border: 1px solid #6366f140; }
    .tag.hook { background: #f59e0b20; color: #fbbf24; border: 1px solid #f59e0b40; }
    .tag.awareness { background: #22c55e20; color: #4ade80; border: 1px solid #22c55e40; }
    .tag.cta { background: #ef444420; color: #f87171; border: 1px solid #ef444440; }
    .details { font-size: 12px; color: #71717a; line-height: 1.6; }
    .perf { display: flex; gap: 12px; margin-top: 8px; padding-top: 8px; border-top: 1px solid #27272a; color: #22c55e; font-weight: 500; }
  </style>
</head>
<body>
  <h1>UGC Ad Gallery</h1>
  <div class="subtitle">Batch: ${batch.id} · ${batch.variants.length} variants · ${new Date().toLocaleDateString()}</div>

  <div class="stats">
    <div class="stat"><div class="stat-value">${batch.variants.length}</div><div class="stat-label">Variants</div></div>
    <div class="stat"><div class="stat-value">${templates.length}</div><div class="stat-label">Templates</div></div>
    <div class="stat"><div class="stat-value">${hooks.length}</div><div class="stat-label">Hook Types</div></div>
    <div class="stat"><div class="stat-value">${previews.length}</div><div class="stat-label">Previews</div></div>
    ${batch.performance ? `
    <div class="stat"><div class="stat-value">${batch.performance.overallCtr.toFixed(1)}%</div><div class="stat-label">Avg CTR</div></div>
    <div class="stat"><div class="stat-value">${batch.performance.overallRoas.toFixed(1)}x</div><div class="stat-label">ROAS</div></div>
    ` : ''}
  </div>

  <div class="filters">
    ${filterButtons('Template', templates, 'template')}
    ${filterButtons('Hook', hooks, 'hook')}
    ${filterButtons('Awareness', awareness, 'awareness')}
  </div>

  <div class="grid" id="grid">
    ${variantCards}
  </div>

  <script>
    const filters = { template: 'all', hook: 'all', awareness: 'all' };

    document.querySelectorAll('.filter-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const attr = btn.dataset.filter;
        const val = btn.dataset.value;
        filters[attr] = val;

        // Update active state
        document.querySelectorAll(\`.filter-btn[data-filter="\${attr}"]\`).forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        // Filter cards
        document.querySelectorAll('.card').forEach(card => {
          const match = Object.entries(filters).every(([key, filterVal]) =>
            filterVal === 'all' || card.dataset[key] === filterVal
          );
          card.classList.toggle('hidden', !match);
        });
      });
    });
  </script>
</body>
</html>`;

  fs.writeFileSync(outputPath, html);
  console.log(`   📄 Gallery saved: ${outputPath}`);
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/**
 * Generate gallery HTML from batch.json without rendering thumbnails
 * (uses placeholder cards instead — useful for dry-run batches)
 */
export function generateGalleryFromBatch(batchDir: string): string {
  const batchJsonPath = path.join(batchDir, 'batch.json');
  if (!fs.existsSync(batchJsonPath)) {
    throw new Error(`batch.json not found in ${batchDir}`);
  }

  const batch: AdBatch = JSON.parse(fs.readFileSync(batchJsonPath, 'utf-8'));
  const galleryPath = path.join(batchDir, 'gallery.html');

  // Check for existing thumbnail previews
  const thumbDir = path.join(batchDir, 'thumbnails');
  let previews: PreviewResult[] = [];
  if (fs.existsSync(thumbDir)) {
    for (const v of batch.variants) {
      const thumbPath = path.join(thumbDir, `${v.id}_thumb.png`);
      if (fs.existsSync(thumbPath)) {
        previews.push({
          variantId: v.id,
          template: v.parameters.visual.template as string,
          size: 'feed_square',
          thumbnailPath: thumbPath,
          width: 540,
          height: 540,
        });
      }
    }
  }

  generateGalleryHTML(batch, previews, galleryPath);
  return galleryPath;
}
