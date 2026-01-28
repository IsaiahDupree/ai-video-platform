'use client';

import { useState, useEffect } from 'react';
import {
  Campaign,
  CopyVariant,
  CampaignSize,
  createDefaultCampaign,
  getTotalAssetCount,
  validateCampaign,
  FILE_NAMING_TEMPLATES,
} from '../../../types/campaign';
import { AdTemplate } from '../../../types/adTemplate';
import {
  getAllSizes,
  getRecommendedSizes,
  getSizesByPlatform,
  AdSize,
  AdPlatform,
} from '../../../config/adSizes';
import { trackFeatureDiscovery } from '../../../services/retentionTracking';
import styles from './campaign.module.css';

// Sample templates
const STARTER_TEMPLATES = [
  'example-hero-ad',
  'example-quote-ad',
  'example-minimal-ad',
  'example-text-only-ad',
];

export default function CampaignPackGeneratorPage() {
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState('example-hero-ad');
  const [activeTab, setActiveTab] = useState<'settings' | 'variants' | 'sizes' | 'output'>(
    'settings'
  );

  // Load initial template and create default campaign
  useEffect(() => {
    loadTemplateAndCreateCampaign(selectedTemplate);
  }, [selectedTemplate]);

  // Track feature discovery
  useEffect(() => {
    trackFeatureDiscovery('campaign_generator');
  }, []);

  const loadTemplateAndCreateCampaign = async (templateId: string) => {
    try {
      setLoading(true);
      const response = await fetch(`/data/ads/${templateId}.json`);
      const template: AdTemplate = await response.json();

      // Create default campaign with this template
      const newCampaign = createDefaultCampaign(template);

      // Add recommended sizes by default
      const recommendedSizes = getRecommendedSizes();
      newCampaign.sizes = recommendedSizes.map((size) => ({
        sizeId: size.id,
        enabled: true,
      }));

      setCampaign(newCampaign);
    } catch (error) {
      console.error('Error loading template:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateCampaignField = (field: keyof Campaign, value: any) => {
    if (!campaign) return;
    setCampaign({ ...campaign, [field]: value });
  };

  const addVariant = () => {
    if (!campaign) return;

    const newVariant: CopyVariant = {
      id: `variant-${Date.now()}`,
      name: `Variant ${campaign.copyVariants.length + 1}`,
      headline: campaign.baseTemplate.content.headline,
      subheadline: campaign.baseTemplate.content.subheadline,
      body: campaign.baseTemplate.content.body,
      cta: campaign.baseTemplate.content.cta,
    };

    setCampaign({
      ...campaign,
      copyVariants: [...campaign.copyVariants, newVariant],
    });
  };

  const updateVariant = (index: number, field: keyof CopyVariant, value: any) => {
    if (!campaign) return;

    const updatedVariants = [...campaign.copyVariants];
    updatedVariants[index] = { ...updatedVariants[index], [field]: value };

    setCampaign({ ...campaign, copyVariants: updatedVariants });
  };

  const removeVariant = (index: number) => {
    if (!campaign || campaign.copyVariants.length <= 1) return;

    const updatedVariants = campaign.copyVariants.filter((_, i) => i !== index);
    setCampaign({ ...campaign, copyVariants: updatedVariants });
  };

  const toggleSize = (sizeId: string) => {
    if (!campaign) return;

    const existingIndex = campaign.sizes.findIndex((s) => s.sizeId === sizeId);
    if (existingIndex >= 0) {
      const updatedSizes = [...campaign.sizes];
      updatedSizes[existingIndex] = {
        ...updatedSizes[existingIndex],
        enabled: !updatedSizes[existingIndex].enabled,
      };
      setCampaign({ ...campaign, sizes: updatedSizes });
    } else {
      setCampaign({
        ...campaign,
        sizes: [...campaign.sizes, { sizeId, enabled: true }],
      });
    }
  };

  const handleGenerate = async () => {
    if (!campaign) return;

    const validation = validateCampaign(campaign);
    if (!validation.valid) {
      alert(`Campaign validation failed:\n${validation.errors.join('\n')}`);
      return;
    }

    setGenerating(true);
    try {
      const response = await fetch('/api/campaign/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(campaign),
      });

      const result = await response.json();

      if (result.success) {
        alert(
          `Campaign generated successfully!\nZIP file: ${result.zipPath}\nTotal assets: ${result.totalAssets}`
        );
      } else {
        alert(`Generation failed: ${result.error}`);
      }
    } catch (error) {
      console.error('Error generating campaign:', error);
      alert(`Error: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setGenerating(false);
    }
  };

  if (loading || !campaign) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>Loading campaign generator...</div>
      </div>
    );
  }

  const allSizes = getAllSizes();
  const totalAssets = getTotalAssetCount(campaign);
  // const estimate = estimateCampaignTime(campaign); // TODO: Implement this function

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1>Campaign Pack Generator</h1>
        <p>Generate all sizes for a campaign with copy variants</p>
      </header>

      <div className={styles.stats}>
        <div className={styles.statCard}>
          <div className={styles.statValue}>{campaign.copyVariants.length}</div>
          <div className={styles.statLabel}>Variants</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statValue}>
            {campaign.sizes.filter((s) => s.enabled).length}
          </div>
          <div className={styles.statLabel}>Sizes</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statValue}>{totalAssets}</div>
          <div className={styles.statLabel}>Total Assets</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statValue}>{Math.ceil(totalAssets * 2 / 60)}</div>
          <div className={styles.statLabel}>Est. Minutes</div>
        </div>
      </div>

      <div className={styles.tabs}>
        <button
          className={activeTab === 'settings' ? styles.tabActive : styles.tab}
          onClick={() => setActiveTab('settings')}
        >
          Campaign Settings
        </button>
        <button
          className={activeTab === 'variants' ? styles.tabActive : styles.tab}
          onClick={() => setActiveTab('variants')}
        >
          Copy Variants ({campaign.copyVariants.length})
        </button>
        <button
          className={activeTab === 'sizes' ? styles.tabActive : styles.tab}
          onClick={() => setActiveTab('sizes')}
        >
          Sizes ({campaign.sizes.filter((s) => s.enabled).length})
        </button>
        <button
          className={activeTab === 'output' ? styles.tabActive : styles.tab}
          onClick={() => setActiveTab('output')}
        >
          Output Settings
        </button>
      </div>

      <div className={styles.content}>
        {activeTab === 'settings' && (
          <div className={styles.section}>
            <h2>Campaign Settings</h2>

            <div className={styles.formGroup}>
              <label>Campaign Name</label>
              <input
                type="text"
                value={campaign.name}
                onChange={(e) => updateCampaignField('name', e.target.value)}
                placeholder="My Campaign"
              />
            </div>

            <div className={styles.formGroup}>
              <label>Description</label>
              <textarea
                value={campaign.description || ''}
                onChange={(e) => updateCampaignField('description', e.target.value)}
                placeholder="Optional campaign description"
                rows={3}
              />
            </div>

            <div className={styles.formGroup}>
              <label>Base Template</label>
              <select
                value={selectedTemplate}
                onChange={(e) => setSelectedTemplate(e.target.value)}
              >
                {STARTER_TEMPLATES.map((tpl) => (
                  <option key={tpl} value={tpl}>
                    {tpl}
                  </option>
                ))}
              </select>
            </div>

            <div className={styles.formGroup}>
              <label>Client/Brand (Optional)</label>
              <input
                type="text"
                value={campaign.metadata?.client || ''}
                onChange={(e) =>
                  updateCampaignField('metadata', {
                    ...campaign.metadata,
                    client: e.target.value,
                  })
                }
                placeholder="Client or brand name"
              />
            </div>
          </div>
        )}

        {activeTab === 'variants' && (
          <div className={styles.section}>
            <div className={styles.sectionHeader}>
              <h2>Copy Variants</h2>
              <button onClick={addVariant} className={styles.addButton}>
                + Add Variant
              </button>
            </div>

            {campaign.copyVariants.map((variant, index) => (
              <div key={variant.id} className={styles.variantCard}>
                <div className={styles.variantHeader}>
                  <input
                    type="text"
                    value={variant.name}
                    onChange={(e) => updateVariant(index, 'name', e.target.value)}
                    className={styles.variantName}
                    placeholder="Variant name"
                  />
                  {campaign.copyVariants.length > 1 && (
                    <button
                      onClick={() => removeVariant(index)}
                      className={styles.removeButton}
                    >
                      Remove
                    </button>
                  )}
                </div>

                <div className={styles.formGroup}>
                  <label>Headline</label>
                  <input
                    type="text"
                    value={variant.headline || ''}
                    onChange={(e) => updateVariant(index, 'headline', e.target.value)}
                    placeholder="Headline text"
                  />
                </div>

                <div className={styles.formGroup}>
                  <label>Subheadline</label>
                  <input
                    type="text"
                    value={variant.subheadline || ''}
                    onChange={(e) => updateVariant(index, 'subheadline', e.target.value)}
                    placeholder="Subheadline text"
                  />
                </div>

                <div className={styles.formGroup}>
                  <label>Body</label>
                  <textarea
                    value={variant.body || ''}
                    onChange={(e) => updateVariant(index, 'body', e.target.value)}
                    placeholder="Body copy"
                    rows={3}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label>Call to Action</label>
                  <input
                    type="text"
                    value={variant.cta || ''}
                    onChange={(e) => updateVariant(index, 'cta', e.target.value)}
                    placeholder="CTA text"
                  />
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'sizes' && (
          <div className={styles.section}>
            <h2>Select Ad Sizes</h2>

            <div className={styles.sizeGrid}>
              {allSizes.map((size) => {
                const isEnabled =
                  campaign.sizes.find((s) => s.sizeId === size.id)?.enabled || false;

                return (
                  <div
                    key={size.id}
                    className={isEnabled ? styles.sizeCardActive : styles.sizeCard}
                    onClick={() => toggleSize(size.id)}
                  >
                    <div className={styles.sizeCheckbox}>
                      <input type="checkbox" checked={isEnabled} readOnly />
                    </div>
                    <div className={styles.sizeName}>{size.name}</div>
                    <div className={styles.sizeDimensions}>
                      {size.width} × {size.height}
                    </div>
                    <div className={styles.sizePlatform}>{size.platform}</div>
                    <div className={styles.sizeRatio}>{size.aspectRatio}</div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {activeTab === 'output' && (
          <div className={styles.section}>
            <h2>Output Settings</h2>

            <div className={styles.formGroup}>
              <label>Image Format</label>
              <select
                value={campaign.output.format}
                onChange={(e) =>
                  updateCampaignField('output', {
                    ...campaign.output,
                    format: e.target.value,
                  })
                }
              >
                <option value="png">PNG</option>
                <option value="jpeg">JPEG</option>
                <option value="webp">WebP</option>
              </select>
            </div>

            {(campaign.output.format === 'jpeg' || campaign.output.format === 'webp') && (
              <div className={styles.formGroup}>
                <label>Quality (0-100)</label>
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={campaign.output.quality || 90}
                  onChange={(e) =>
                    updateCampaignField('output', {
                      ...campaign.output,
                      quality: parseInt(e.target.value),
                    })
                  }
                />
              </div>
            )}

            <div className={styles.formGroup}>
              <label>Organization Mode</label>
              <select
                value={campaign.output.organizationMode}
                onChange={(e) =>
                  updateCampaignField('output', {
                    ...campaign.output,
                    organizationMode: e.target.value,
                  })
                }
              >
                <option value="by-variant">By Variant (variant/size/file.png)</option>
                <option value="by-size">By Size (size/variant/file.png)</option>
                <option value="flat">Flat (all files in root)</option>
              </select>
            </div>

            <div className={styles.formGroup}>
              <label>File Naming Template</label>
              <select
                value={campaign.output.fileNamingTemplate}
                onChange={(e) =>
                  updateCampaignField('output', {
                    ...campaign.output,
                    fileNamingTemplate: e.target.value,
                  })
                }
              >
                <option value={FILE_NAMING_TEMPLATES.VARIANT_SIZE}>
                  Variant_Size (e.g., Variant1_InstagramSquare.png)
                </option>
                <option value={FILE_NAMING_TEMPLATES.SIZE_VARIANT}>
                  Size_Variant (e.g., InstagramSquare_Variant1.png)
                </option>
                <option value={FILE_NAMING_TEMPLATES.CAMPAIGN_VARIANT_DIMENSIONS}>
                  Campaign_Variant_Dimensions (e.g., Campaign_Variant1_1080x1080.png)
                </option>
                <option value={FILE_NAMING_TEMPLATES.VARIANT_PLATFORM_DIMENSIONS}>
                  Variant_Platform_Dimensions (e.g., Variant1_Instagram_1080x1080.png)
                </option>
              </select>
            </div>

            <div className={styles.formGroup}>
              <label>
                <input
                  type="checkbox"
                  checked={campaign.output.includeManifest}
                  onChange={(e) =>
                    updateCampaignField('output', {
                      ...campaign.output,
                      includeManifest: e.target.checked,
                    })
                  }
                />
                <span>Include manifest.json file</span>
              </label>
            </div>
          </div>
        )}
      </div>

      <div className={styles.footer}>
        <div className={styles.generateInfo}>
          <p>
            This will generate <strong>{totalAssets} assets</strong> (
            {campaign.copyVariants.length} variants × {campaign.sizes.filter((s) => s.enabled).length}{' '}
            sizes)
          </p>
          <p className={styles.estimate}>
            Estimated time: ~{Math.ceil(totalAssets * 2 / 60)} minutes
          </p>
        </div>
        <button
          onClick={handleGenerate}
          disabled={generating || totalAssets === 0}
          className={styles.generateButton}
        >
          {generating ? 'Generating...' : `Generate Campaign (${totalAssets} assets)`}
        </button>
      </div>
    </div>
  );
}
