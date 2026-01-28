(globalThis.TURBOPACK || (globalThis.TURBOPACK = [])).push([typeof document === "object" ? document.currentScript : undefined,
"[project]/src/config/adSizes.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

/**
 * ADS-008: Size Presets
 * Standard ad sizes for various platforms and use cases
 */ /**
 * Ad dimensions interface
 */ __turbopack_context__.s([
    "AD_SIZES_LEGACY",
    ()=>AD_SIZES_LEGACY,
    "AD_SIZES_MAP",
    ()=>AD_SIZES_MAP,
    "AD_SIZE_PRESETS",
    ()=>AD_SIZE_PRESETS,
    "findClosestSize",
    ()=>findClosestSize,
    "getAllCategories",
    ()=>getAllCategories,
    "getAllPlatforms",
    ()=>getAllPlatforms,
    "getAllSizes",
    ()=>getAllSizes,
    "getRecommendedSizes",
    ()=>getRecommendedSizes,
    "getSizeById",
    ()=>getSizeById,
    "getSizesByAspectRatio",
    ()=>getSizesByAspectRatio,
    "getSizesByCategory",
    ()=>getSizesByCategory,
    "getSizesByPlatform",
    ()=>getSizesByPlatform,
    "getSizesByTag",
    ()=>getSizesByTag,
    "toAdDimensions",
    ()=>toAdDimensions
]);
const AD_SIZE_PRESETS = [
    // ========== INSTAGRAM ==========
    {
        id: 'instagram-square',
        name: 'Instagram Square',
        width: 1080,
        height: 1080,
        aspectRatio: '1:1',
        platform: 'Instagram',
        category: 'social',
        description: 'Perfect for Instagram feed posts',
        tags: [
            'instagram',
            'feed',
            'square'
        ],
        recommended: true
    },
    {
        id: 'instagram-story',
        name: 'Instagram Story',
        width: 1080,
        height: 1920,
        aspectRatio: '9:16',
        platform: 'Instagram',
        category: 'social',
        description: 'Vertical format for Instagram Stories',
        tags: [
            'instagram',
            'story',
            'vertical'
        ],
        recommended: true
    },
    {
        id: 'instagram-portrait',
        name: 'Instagram Portrait',
        width: 1080,
        height: 1350,
        aspectRatio: '4:5',
        platform: 'Instagram',
        category: 'social',
        description: 'Vertical format for Instagram feed',
        tags: [
            'instagram',
            'feed',
            'portrait'
        ]
    },
    {
        id: 'instagram-landscape',
        name: 'Instagram Landscape',
        width: 1080,
        height: 608,
        aspectRatio: '1.91:1',
        platform: 'Instagram',
        category: 'social',
        description: 'Horizontal format for Instagram feed',
        tags: [
            'instagram',
            'feed',
            'landscape'
        ]
    },
    // ========== FACEBOOK ==========
    {
        id: 'facebook-feed',
        name: 'Facebook Feed',
        width: 1200,
        height: 628,
        aspectRatio: '1.91:1',
        platform: 'Facebook',
        category: 'social',
        description: 'Standard Facebook feed post',
        tags: [
            'facebook',
            'feed',
            'link'
        ],
        recommended: true
    },
    {
        id: 'facebook-square',
        name: 'Facebook Square',
        width: 1080,
        height: 1080,
        aspectRatio: '1:1',
        platform: 'Facebook',
        category: 'social',
        description: 'Square format for Facebook feed',
        tags: [
            'facebook',
            'feed',
            'square'
        ],
        recommended: true
    },
    {
        id: 'facebook-story',
        name: 'Facebook Story',
        width: 1080,
        height: 1920,
        aspectRatio: '9:16',
        platform: 'Facebook',
        category: 'social',
        description: 'Vertical format for Facebook Stories',
        tags: [
            'facebook',
            'story',
            'vertical'
        ]
    },
    {
        id: 'facebook-cover',
        name: 'Facebook Cover Photo',
        width: 820,
        height: 312,
        aspectRatio: '2.63:1',
        platform: 'Facebook',
        category: 'social',
        description: 'Facebook page cover image',
        tags: [
            'facebook',
            'cover',
            'banner'
        ]
    },
    // ========== TWITTER/X ==========
    {
        id: 'twitter-post',
        name: 'Twitter Post',
        width: 1200,
        height: 675,
        aspectRatio: '16:9',
        platform: 'Twitter',
        category: 'social',
        description: 'Standard Twitter post image',
        tags: [
            'twitter',
            'x',
            'post'
        ],
        recommended: true
    },
    {
        id: 'twitter-header',
        name: 'Twitter Header',
        width: 1500,
        height: 500,
        aspectRatio: '3:1',
        platform: 'Twitter',
        category: 'social',
        description: 'Twitter profile header image',
        tags: [
            'twitter',
            'x',
            'header',
            'banner'
        ]
    },
    // ========== LINKEDIN ==========
    {
        id: 'linkedin-square',
        name: 'LinkedIn Square',
        width: 1200,
        height: 1200,
        aspectRatio: '1:1',
        platform: 'LinkedIn',
        category: 'social',
        description: 'Square format for LinkedIn feed',
        tags: [
            'linkedin',
            'feed',
            'square'
        ],
        recommended: true
    },
    {
        id: 'linkedin-horizontal',
        name: 'LinkedIn Horizontal',
        width: 1200,
        height: 627,
        aspectRatio: '1.91:1',
        platform: 'LinkedIn',
        category: 'social',
        description: 'Horizontal format for LinkedIn posts',
        tags: [
            'linkedin',
            'feed',
            'horizontal'
        ],
        recommended: true
    },
    {
        id: 'linkedin-banner',
        name: 'LinkedIn Banner',
        width: 1584,
        height: 396,
        aspectRatio: '4:1',
        platform: 'LinkedIn',
        category: 'social',
        description: 'LinkedIn profile background image',
        tags: [
            'linkedin',
            'banner',
            'cover'
        ]
    },
    // ========== PINTEREST ==========
    {
        id: 'pinterest-standard',
        name: 'Pinterest Standard Pin',
        width: 1000,
        height: 1500,
        aspectRatio: '2:3',
        platform: 'Pinterest',
        category: 'social',
        description: 'Standard Pinterest pin format',
        tags: [
            'pinterest',
            'pin',
            'vertical'
        ],
        recommended: true
    },
    {
        id: 'pinterest-square',
        name: 'Pinterest Square',
        width: 1000,
        height: 1000,
        aspectRatio: '1:1',
        platform: 'Pinterest',
        category: 'social',
        description: 'Square format for Pinterest',
        tags: [
            'pinterest',
            'pin',
            'square'
        ]
    },
    {
        id: 'pinterest-long',
        name: 'Pinterest Long Pin',
        width: 1000,
        height: 2100,
        aspectRatio: '10:21',
        platform: 'Pinterest',
        category: 'social',
        description: 'Tall format for Pinterest (max)',
        tags: [
            'pinterest',
            'pin',
            'vertical',
            'tall'
        ]
    },
    // ========== TIKTOK ==========
    {
        id: 'tiktok-video',
        name: 'TikTok Video',
        width: 1080,
        height: 1920,
        aspectRatio: '9:16',
        platform: 'TikTok',
        category: 'video',
        description: 'Vertical format for TikTok videos',
        tags: [
            'tiktok',
            'video',
            'vertical'
        ],
        recommended: true
    },
    // ========== YOUTUBE ==========
    {
        id: 'youtube-thumbnail',
        name: 'YouTube Thumbnail',
        width: 1280,
        height: 720,
        aspectRatio: '16:9',
        platform: 'YouTube',
        category: 'video',
        description: 'Standard YouTube video thumbnail',
        tags: [
            'youtube',
            'thumbnail',
            'video'
        ],
        recommended: true
    },
    {
        id: 'youtube-banner',
        name: 'YouTube Channel Banner',
        width: 2560,
        height: 1440,
        aspectRatio: '16:9',
        platform: 'YouTube',
        category: 'social',
        description: 'YouTube channel art banner',
        tags: [
            'youtube',
            'banner',
            'cover'
        ]
    },
    // ========== GOOGLE DISPLAY ADS ==========
    {
        id: 'google-leaderboard',
        name: 'Leaderboard',
        width: 728,
        height: 90,
        aspectRatio: '8.09:1',
        platform: 'Google Display',
        category: 'display',
        description: 'Top of page banner ad',
        tags: [
            'google',
            'display',
            'banner',
            'horizontal'
        ],
        recommended: true
    },
    {
        id: 'google-medium-rectangle',
        name: 'Medium Rectangle',
        width: 300,
        height: 250,
        aspectRatio: '6:5',
        platform: 'Google Display',
        category: 'display',
        description: 'Most common display ad size',
        tags: [
            'google',
            'display',
            'rectangle'
        ],
        recommended: true
    },
    {
        id: 'google-large-rectangle',
        name: 'Large Rectangle',
        width: 336,
        height: 280,
        aspectRatio: '6:5',
        platform: 'Google Display',
        category: 'display',
        description: 'Larger version of medium rectangle',
        tags: [
            'google',
            'display',
            'rectangle'
        ]
    },
    {
        id: 'google-wide-skyscraper',
        name: 'Wide Skyscraper',
        width: 160,
        height: 600,
        aspectRatio: '4:15',
        platform: 'Google Display',
        category: 'display',
        description: 'Vertical sidebar ad',
        tags: [
            'google',
            'display',
            'vertical',
            'sidebar'
        ]
    },
    {
        id: 'google-half-page',
        name: 'Half Page',
        width: 300,
        height: 600,
        aspectRatio: '1:2',
        platform: 'Google Display',
        category: 'display',
        description: 'Large vertical ad unit',
        tags: [
            'google',
            'display',
            'vertical'
        ]
    },
    {
        id: 'google-large-leaderboard',
        name: 'Large Leaderboard',
        width: 970,
        height: 90,
        aspectRatio: '10.78:1',
        platform: 'Google Display',
        category: 'display',
        description: 'Wider leaderboard format',
        tags: [
            'google',
            'display',
            'banner',
            'horizontal'
        ]
    },
    {
        id: 'google-mobile-banner',
        name: 'Mobile Banner',
        width: 320,
        height: 50,
        aspectRatio: '32:5',
        platform: 'Google Display',
        category: 'display',
        description: 'Mobile optimized banner',
        tags: [
            'google',
            'display',
            'mobile',
            'banner'
        ]
    },
    {
        id: 'google-large-mobile-banner',
        name: 'Large Mobile Banner',
        width: 320,
        height: 100,
        aspectRatio: '16:5',
        platform: 'Google Display',
        category: 'display',
        description: 'Larger mobile banner',
        tags: [
            'google',
            'display',
            'mobile',
            'banner'
        ]
    },
    // ========== IAB STANDARD DISPLAY ==========
    {
        id: 'iab-billboard',
        name: 'Billboard',
        width: 970,
        height: 250,
        aspectRatio: '97:25',
        platform: 'IAB Standard',
        category: 'display',
        description: 'Large billboard ad unit',
        tags: [
            'iab',
            'display',
            'billboard'
        ]
    },
    {
        id: 'iab-portrait',
        name: 'Portrait',
        width: 300,
        height: 1050,
        aspectRatio: '2:7',
        platform: 'IAB Standard',
        category: 'display',
        description: 'Tall portrait ad unit',
        tags: [
            'iab',
            'display',
            'vertical',
            'portrait'
        ]
    },
    // ========== COMMON ASPECT RATIOS ==========
    {
        id: 'aspect-1-1-1080',
        name: 'Square 1:1 (1080x1080)',
        width: 1080,
        height: 1080,
        aspectRatio: '1:1',
        platform: 'Custom',
        category: 'custom',
        description: 'Common square format',
        tags: [
            'square',
            'aspect-ratio'
        ],
        recommended: true
    },
    {
        id: 'aspect-16-9-1920',
        name: 'Landscape 16:9 (1920x1080)',
        width: 1920,
        height: 1080,
        aspectRatio: '16:9',
        platform: 'Custom',
        category: 'custom',
        description: 'HD landscape format',
        tags: [
            'landscape',
            'aspect-ratio',
            'hd'
        ],
        recommended: true
    },
    {
        id: 'aspect-9-16-1080',
        name: 'Vertical 9:16 (1080x1920)',
        width: 1080,
        height: 1920,
        aspectRatio: '9:16',
        platform: 'Custom',
        category: 'custom',
        description: 'Vertical story format',
        tags: [
            'vertical',
            'aspect-ratio',
            'story'
        ],
        recommended: true
    },
    {
        id: 'aspect-4-5-1080',
        name: 'Portrait 4:5 (1080x1350)',
        width: 1080,
        height: 1350,
        aspectRatio: '4:5',
        platform: 'Custom',
        category: 'custom',
        description: 'Portrait format',
        tags: [
            'portrait',
            'aspect-ratio'
        ]
    }
];
function getAllSizes() {
    return AD_SIZE_PRESETS;
}
function getRecommendedSizes() {
    return AD_SIZE_PRESETS.filter((size)=>size.recommended);
}
function getSizesByPlatform(platform) {
    return AD_SIZE_PRESETS.filter((size)=>size.platform === platform);
}
function getSizesByCategory(category) {
    return AD_SIZE_PRESETS.filter((size)=>size.category === category);
}
function getSizeById(id) {
    return AD_SIZE_PRESETS.find((size)=>size.id === id);
}
function getSizesByTag(tag) {
    return AD_SIZE_PRESETS.filter((size)=>size.tags?.includes(tag));
}
function getSizesByAspectRatio(aspectRatio) {
    return AD_SIZE_PRESETS.filter((size)=>size.aspectRatio === aspectRatio);
}
function findClosestSize(width, height) {
    if (AD_SIZE_PRESETS.length === 0) return null;
    let closest = AD_SIZE_PRESETS[0];
    let minDistance = Math.sqrt(Math.pow(width - closest.width, 2) + Math.pow(height - closest.height, 2));
    for (const size of AD_SIZE_PRESETS){
        const distance = Math.sqrt(Math.pow(width - size.width, 2) + Math.pow(height - size.height, 2));
        if (distance < minDistance) {
            minDistance = distance;
            closest = size;
        }
    }
    return closest;
}
function getAllPlatforms() {
    const platforms = new Set(AD_SIZE_PRESETS.map((size)=>size.platform));
    return Array.from(platforms).sort();
}
function getAllCategories() {
    const categories = new Set(AD_SIZE_PRESETS.map((size)=>size.category));
    return Array.from(categories).sort();
}
function toAdDimensions(size) {
    return {
        width: size.width,
        height: size.height,
        name: size.name,
        platform: size.platform
    };
}
const AD_SIZES_MAP = AD_SIZE_PRESETS.reduce(_c = (acc, size)=>{
    acc[size.id] = size;
    return acc;
}, {});
_c1 = AD_SIZES_MAP;
const AD_SIZES_LEGACY = AD_SIZE_PRESETS.reduce(_c2 = (acc, size)=>{
    // Convert ID to uppercase with underscores (e.g., 'instagram-square' -> 'INSTAGRAM_SQUARE')
    const key = size.id.toUpperCase().replace(/-/g, '_');
    acc[key] = toAdDimensions(size);
    return acc;
}, {});
_c3 = AD_SIZES_LEGACY;
var _c, _c1, _c2, _c3;
__turbopack_context__.k.register(_c, "AD_SIZES_MAP$AD_SIZE_PRESETS.reduce");
__turbopack_context__.k.register(_c1, "AD_SIZES_MAP");
__turbopack_context__.k.register(_c2, "AD_SIZES_LEGACY$AD_SIZE_PRESETS.reduce");
__turbopack_context__.k.register(_c3, "AD_SIZES_LEGACY");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/src/types/adTemplate.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "AD_SIZES",
    ()=>AD_SIZES,
    "defaultAdStyle",
    ()=>defaultAdStyle,
    "isAdTemplate",
    ()=>isAdTemplate,
    "mergeAdStyle",
    ()=>mergeAdStyle
]);
/**
 * Ad Template Types - ADS-001
 * Type definitions for static ad templates using Remotion Still API
 */ // Import size presets from ADS-008
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$config$2f$adSizes$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/config/adSizes.ts [app-client] (ecmascript)");
;
const AD_SIZES = __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$config$2f$adSizes$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["AD_SIZES_LEGACY"];
function isAdTemplate(obj) {
    if (typeof obj !== 'object' || obj === null) return false;
    const template = obj;
    return typeof template.id === 'string' && typeof template.name === 'string' && typeof template.layout === 'string' && typeof template.dimensions === 'object' && typeof template.content === 'object' && typeof template.style === 'object';
}
const defaultAdStyle = {
    primaryColor: '#3b82f6',
    secondaryColor: '#8b5cf6',
    textColor: '#ffffff',
    ctaBackgroundColor: '#3b82f6',
    ctaTextColor: '#ffffff',
    headlineFont: 'Inter, system-ui, -apple-system, sans-serif',
    bodyFont: 'Inter, system-ui, -apple-system, sans-serif',
    headlineSize: 48,
    bodySize: 20,
    headlineFontWeight: 700,
    bodyFontWeight: 400,
    padding: 40,
    gap: 20,
    borderRadius: 8,
    shadow: true,
    shadowColor: 'rgba(0, 0, 0, 0.2)',
    shadowBlur: 20
};
function mergeAdStyle(customStyle = {}) {
    return {
        ...defaultAdStyle,
        ...customStyle
    };
}
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/src/app/ads/editor/editor.module.css [app-client] (css module)", ((__turbopack_context__) => {

__turbopack_context__.v({
  "actions": "editor-module__I1eW_q__actions",
  "aiButton": "editor-module__I1eW_q__aiButton",
  "button": "editor-module__I1eW_q__button",
  "buttonSmall": "editor-module__I1eW_q__buttonSmall",
  "colorInput": "editor-module__I1eW_q__colorInput",
  "container": "editor-module__I1eW_q__container",
  "currentSize": "editor-module__I1eW_q__currentSize",
  "currentSizeLabel": "editor-module__I1eW_q__currentSizeLabel",
  "currentSizeValue": "editor-module__I1eW_q__currentSizeValue",
  "editor": "editor-module__I1eW_q__editor",
  "formGroup": "editor-module__I1eW_q__formGroup",
  "header": "editor-module__I1eW_q__header",
  "headerContent": "editor-module__I1eW_q__headerContent",
  "input": "editor-module__I1eW_q__input",
  "inputWithButton": "editor-module__I1eW_q__inputWithButton",
  "label": "editor-module__I1eW_q__label",
  "loading": "editor-module__I1eW_q__loading",
  "numberInput": "editor-module__I1eW_q__numberInput",
  "preview": "editor-module__I1eW_q__preview",
  "radioGroup": "editor-module__I1eW_q__radioGroup",
  "radioLabel": "editor-module__I1eW_q__radioLabel",
  "section": "editor-module__I1eW_q__section",
  "sectionTitle": "editor-module__I1eW_q__sectionTitle",
  "select": "editor-module__I1eW_q__select",
  "sidebar": "editor-module__I1eW_q__sidebar",
  "sidebarContent": "editor-module__I1eW_q__sidebarContent",
  "sizeCard": "editor-module__I1eW_q__sizeCard",
  "sizeCardAspect": "editor-module__I1eW_q__sizeCardAspect",
  "sizeCardBox": "editor-module__I1eW_q__sizeCardBox",
  "sizeCardDimensions": "editor-module__I1eW_q__sizeCardDimensions",
  "sizeCardInfo": "editor-module__I1eW_q__sizeCardInfo",
  "sizeCardName": "editor-module__I1eW_q__sizeCardName",
  "sizeCardRatio": "editor-module__I1eW_q__sizeCardRatio",
  "sizeCardSelected": "editor-module__I1eW_q__sizeCardSelected",
  "sizeGrid": "editor-module__I1eW_q__sizeGrid",
  "sizeSelector": "editor-module__I1eW_q__sizeSelector",
  "textarea": "editor-module__I1eW_q__textarea",
  "title": "editor-module__I1eW_q__title",
});
}),
"[project]/src/app/ads/editor/components/SizeSelector.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>SizeSelector
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$config$2f$adSizes$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/config/adSizes.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ads$2f$editor$2f$editor$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__ = __turbopack_context__.i("[project]/src/app/ads/editor/editor.module.css [app-client] (css module)");
;
var _s = __turbopack_context__.k.signature();
'use client';
;
;
;
function SizeSelector({ currentWidth, currentHeight, onSizeChange }) {
    _s();
    const [filterMode, setFilterMode] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])('recommended');
    const [selectedPlatform, setSelectedPlatform] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])('Instagram');
    const platforms = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$config$2f$adSizes$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getAllPlatforms"])();
    // Get sizes based on filter mode
    const sizes = filterMode === 'recommended' ? (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$config$2f$adSizes$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getRecommendedSizes"])() : (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$config$2f$adSizes$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getSizesByPlatform"])(selectedPlatform);
    // Find if current size matches any preset
    const currentSizeId = sizes.find((size)=>size.width === currentWidth && size.height === currentHeight)?.id;
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ads$2f$editor$2f$editor$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].sizeSelector,
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ads$2f$editor$2f$editor$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].formGroup,
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                        className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ads$2f$editor$2f$editor$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].label,
                        children: "Filter"
                    }, void 0, false, {
                        fileName: "[project]/src/app/ads/editor/components/SizeSelector.tsx",
                        lineNumber: 41,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ads$2f$editor$2f$editor$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].radioGroup,
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ads$2f$editor$2f$editor$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].radioLabel,
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                        type: "radio",
                                        value: "recommended",
                                        checked: filterMode === 'recommended',
                                        onChange: (e)=>setFilterMode(e.target.value)
                                    }, void 0, false, {
                                        fileName: "[project]/src/app/ads/editor/components/SizeSelector.tsx",
                                        lineNumber: 44,
                                        columnNumber: 13
                                    }, this),
                                    "Recommended"
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/app/ads/editor/components/SizeSelector.tsx",
                                lineNumber: 43,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ads$2f$editor$2f$editor$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].radioLabel,
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                        type: "radio",
                                        value: "platform",
                                        checked: filterMode === 'platform',
                                        onChange: (e)=>setFilterMode(e.target.value)
                                    }, void 0, false, {
                                        fileName: "[project]/src/app/ads/editor/components/SizeSelector.tsx",
                                        lineNumber: 53,
                                        columnNumber: 13
                                    }, this),
                                    "By Platform"
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/app/ads/editor/components/SizeSelector.tsx",
                                lineNumber: 52,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/app/ads/editor/components/SizeSelector.tsx",
                        lineNumber: 42,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/src/app/ads/editor/components/SizeSelector.tsx",
                lineNumber: 40,
                columnNumber: 7
            }, this),
            filterMode === 'platform' && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ads$2f$editor$2f$editor$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].formGroup,
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                        className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ads$2f$editor$2f$editor$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].label,
                        children: "Platform"
                    }, void 0, false, {
                        fileName: "[project]/src/app/ads/editor/components/SizeSelector.tsx",
                        lineNumber: 66,
                        columnNumber: 11
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("select", {
                        value: selectedPlatform,
                        onChange: (e)=>setSelectedPlatform(e.target.value),
                        className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ads$2f$editor$2f$editor$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].select,
                        children: platforms.map((platform)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                value: platform,
                                children: platform
                            }, platform, false, {
                                fileName: "[project]/src/app/ads/editor/components/SizeSelector.tsx",
                                lineNumber: 73,
                                columnNumber: 15
                            }, this))
                    }, void 0, false, {
                        fileName: "[project]/src/app/ads/editor/components/SizeSelector.tsx",
                        lineNumber: 67,
                        columnNumber: 11
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/src/app/ads/editor/components/SizeSelector.tsx",
                lineNumber: 65,
                columnNumber: 9
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ads$2f$editor$2f$editor$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].formGroup,
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                        className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ads$2f$editor$2f$editor$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].label,
                        children: "Size Preset"
                    }, void 0, false, {
                        fileName: "[project]/src/app/ads/editor/components/SizeSelector.tsx",
                        lineNumber: 82,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("select", {
                        value: currentSizeId || '',
                        onChange: (e)=>{
                            const size = sizes.find((s)=>s.id === e.target.value);
                            if (size) {
                                onSizeChange(size.width, size.height, size.name);
                            }
                        },
                        className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ads$2f$editor$2f$editor$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].select,
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                value: "",
                                children: "Select a size..."
                            }, void 0, false, {
                                fileName: "[project]/src/app/ads/editor/components/SizeSelector.tsx",
                                lineNumber: 93,
                                columnNumber: 11
                            }, this),
                            sizes.map((size)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                    value: size.id,
                                    children: [
                                        size.name,
                                        " - ",
                                        size.width,
                                        "x",
                                        size.height,
                                        " (",
                                        size.aspectRatio,
                                        ")"
                                    ]
                                }, size.id, true, {
                                    fileName: "[project]/src/app/ads/editor/components/SizeSelector.tsx",
                                    lineNumber: 95,
                                    columnNumber: 13
                                }, this))
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/app/ads/editor/components/SizeSelector.tsx",
                        lineNumber: 83,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/src/app/ads/editor/components/SizeSelector.tsx",
                lineNumber: 81,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ads$2f$editor$2f$editor$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].sizeGrid,
                children: sizes.slice(0, 6).map((size)=>{
                    const isSelected = size.width === currentWidth && size.height === currentHeight;
                    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                        className: `${__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ads$2f$editor$2f$editor$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].sizeCard} ${isSelected ? __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ads$2f$editor$2f$editor$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].sizeCardSelected : ''}`,
                        onClick: ()=>onSizeChange(size.width, size.height, size.name),
                        title: size.description,
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ads$2f$editor$2f$editor$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].sizeCardAspect,
                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ads$2f$editor$2f$editor$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].sizeCardBox,
                                    style: {
                                        width: `${Math.min(100, size.width / Math.max(size.width, size.height) * 100)}%`,
                                        height: `${Math.min(100, size.height / Math.max(size.width, size.height) * 100)}%`
                                    }
                                }, void 0, false, {
                                    fileName: "[project]/src/app/ads/editor/components/SizeSelector.tsx",
                                    lineNumber: 114,
                                    columnNumber: 17
                                }, this)
                            }, void 0, false, {
                                fileName: "[project]/src/app/ads/editor/components/SizeSelector.tsx",
                                lineNumber: 113,
                                columnNumber: 15
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ads$2f$editor$2f$editor$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].sizeCardInfo,
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ads$2f$editor$2f$editor$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].sizeCardName,
                                        children: size.name
                                    }, void 0, false, {
                                        fileName: "[project]/src/app/ads/editor/components/SizeSelector.tsx",
                                        lineNumber: 123,
                                        columnNumber: 17
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ads$2f$editor$2f$editor$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].sizeCardDimensions,
                                        children: [
                                            size.width,
                                            "×",
                                            size.height
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/src/app/ads/editor/components/SizeSelector.tsx",
                                        lineNumber: 124,
                                        columnNumber: 17
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ads$2f$editor$2f$editor$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].sizeCardRatio,
                                        children: size.aspectRatio
                                    }, void 0, false, {
                                        fileName: "[project]/src/app/ads/editor/components/SizeSelector.tsx",
                                        lineNumber: 127,
                                        columnNumber: 17
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/app/ads/editor/components/SizeSelector.tsx",
                                lineNumber: 122,
                                columnNumber: 15
                            }, this)
                        ]
                    }, size.id, true, {
                        fileName: "[project]/src/app/ads/editor/components/SizeSelector.tsx",
                        lineNumber: 107,
                        columnNumber: 13
                    }, this);
                })
            }, void 0, false, {
                fileName: "[project]/src/app/ads/editor/components/SizeSelector.tsx",
                lineNumber: 103,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ads$2f$editor$2f$editor$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].currentSize,
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ads$2f$editor$2f$editor$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].currentSizeLabel,
                        children: "Current Size:"
                    }, void 0, false, {
                        fileName: "[project]/src/app/ads/editor/components/SizeSelector.tsx",
                        lineNumber: 136,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ads$2f$editor$2f$editor$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].currentSizeValue,
                        children: [
                            currentWidth,
                            " × ",
                            currentHeight
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/app/ads/editor/components/SizeSelector.tsx",
                        lineNumber: 137,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/src/app/ads/editor/components/SizeSelector.tsx",
                lineNumber: 135,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/src/app/ads/editor/components/SizeSelector.tsx",
        lineNumber: 39,
        columnNumber: 5
    }, this);
}
_s(SizeSelector, "D+RJElYjZx6tYmKqVjywIgVMJIE=");
_c = SizeSelector;
var _c;
__turbopack_context__.k.register(_c, "SizeSelector");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/src/app/ads/editor/components/VariantGenerator.module.css [app-client] (css module)", ((__turbopack_context__) => {

__turbopack_context__.v({
  "applyButton": "VariantGenerator-module__YdJC_q__applyButton",
  "cancelButton": "VariantGenerator-module__YdJC_q__cancelButton",
  "checkmark": "VariantGenerator-module__YdJC_q__checkmark",
  "closeButton": "VariantGenerator-module__YdJC_q__closeButton",
  "content": "VariantGenerator-module__YdJC_q__content",
  "error": "VariantGenerator-module__YdJC_q__error",
  "fadeIn": "VariantGenerator-module__YdJC_q__fadeIn",
  "footer": "VariantGenerator-module__YdJC_q__footer",
  "generateButton": "VariantGenerator-module__YdJC_q__generateButton",
  "header": "VariantGenerator-module__YdJC_q__header",
  "hint": "VariantGenerator-module__YdJC_q__hint",
  "label": "VariantGenerator-module__YdJC_q__label",
  "loading": "VariantGenerator-module__YdJC_q__loading",
  "modal": "VariantGenerator-module__YdJC_q__modal",
  "originalText": "VariantGenerator-module__YdJC_q__originalText",
  "overlay": "VariantGenerator-module__YdJC_q__overlay",
  "regenerateButton": "VariantGenerator-module__YdJC_q__regenerateButton",
  "retryButton": "VariantGenerator-module__YdJC_q__retryButton",
  "section": "VariantGenerator-module__YdJC_q__section",
  "selected": "VariantGenerator-module__YdJC_q__selected",
  "slideUp": "VariantGenerator-module__YdJC_q__slideUp",
  "spin": "VariantGenerator-module__YdJC_q__spin",
  "spinner": "VariantGenerator-module__YdJC_q__spinner",
  "title": "VariantGenerator-module__YdJC_q__title",
  "variantItem": "VariantGenerator-module__YdJC_q__variantItem",
  "variantNumber": "VariantGenerator-module__YdJC_q__variantNumber",
  "variantText": "VariantGenerator-module__YdJC_q__variantText",
  "variantsList": "VariantGenerator-module__YdJC_q__variantsList",
});
}),
"[project]/src/app/ads/editor/components/VariantGenerator.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>VariantGenerator
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ads$2f$editor$2f$components$2f$VariantGenerator$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__ = __turbopack_context__.i("[project]/src/app/ads/editor/components/VariantGenerator.module.css [app-client] (css module)");
;
var _s = __turbopack_context__.k.signature();
'use client';
;
;
function VariantGenerator({ originalText, type, onSelectVariant, onClose }) {
    _s();
    const [variants, setVariants] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])([]);
    const [loading, setLoading] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    const [error, setError] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(null);
    const [selectedVariant, setSelectedVariant] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(null);
    // Generate variants
    const generateVariants = async ()=>{
        setLoading(true);
        setError(null);
        setVariants([]);
        try {
            const response = await fetch('/api/ads/generate-variants', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    originalText,
                    type,
                    count: 10
                })
            });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to generate variants');
            }
            const data = await response.json();
            setVariants(data.variants || []);
        } catch (err) {
            console.error('Error generating variants:', err);
            setError(err instanceof Error ? err.message : 'Failed to generate variants');
        } finally{
            setLoading(false);
        }
    };
    // Apply selected variant
    const applyVariant = ()=>{
        if (selectedVariant) {
            onSelectVariant(selectedVariant);
            onClose();
        }
    };
    const typeLabels = {
        headline: 'Headline',
        subheadline: 'Subheadline',
        body: 'Body Copy',
        cta: 'Call-to-Action'
    };
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ads$2f$editor$2f$components$2f$VariantGenerator$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].overlay,
        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ads$2f$editor$2f$components$2f$VariantGenerator$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].modal,
            children: [
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ads$2f$editor$2f$components$2f$VariantGenerator$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].header,
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                            className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ads$2f$editor$2f$components$2f$VariantGenerator$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].title,
                            children: "AI Variant Generator"
                        }, void 0, false, {
                            fileName: "[project]/src/app/ads/editor/components/VariantGenerator.tsx",
                            lineNumber: 79,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                            onClick: onClose,
                            className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ads$2f$editor$2f$components$2f$VariantGenerator$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].closeButton,
                            children: "×"
                        }, void 0, false, {
                            fileName: "[project]/src/app/ads/editor/components/VariantGenerator.tsx",
                            lineNumber: 80,
                            columnNumber: 11
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/src/app/ads/editor/components/VariantGenerator.tsx",
                    lineNumber: 78,
                    columnNumber: 9
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ads$2f$editor$2f$components$2f$VariantGenerator$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].content,
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ads$2f$editor$2f$components$2f$VariantGenerator$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].section,
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                    className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ads$2f$editor$2f$components$2f$VariantGenerator$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].label,
                                    children: [
                                        "Original ",
                                        typeLabels[type],
                                        ":"
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/src/app/ads/editor/components/VariantGenerator.tsx",
                                    lineNumber: 89,
                                    columnNumber: 13
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ads$2f$editor$2f$components$2f$VariantGenerator$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].originalText,
                                    children: originalText
                                }, void 0, false, {
                                    fileName: "[project]/src/app/ads/editor/components/VariantGenerator.tsx",
                                    lineNumber: 92,
                                    columnNumber: 13
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/src/app/ads/editor/components/VariantGenerator.tsx",
                            lineNumber: 88,
                            columnNumber: 11
                        }, this),
                        variants.length === 0 && !loading && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ads$2f$editor$2f$components$2f$VariantGenerator$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].section,
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                    onClick: generateVariants,
                                    className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ads$2f$editor$2f$components$2f$VariantGenerator$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].generateButton,
                                    disabled: loading,
                                    children: "Generate 10 AI Variants"
                                }, void 0, false, {
                                    fileName: "[project]/src/app/ads/editor/components/VariantGenerator.tsx",
                                    lineNumber: 98,
                                    columnNumber: 15
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                    className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ads$2f$editor$2f$components$2f$VariantGenerator$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].hint,
                                    children: [
                                        "Our AI will create 10 creative variations of your ",
                                        type,
                                        " while maintaining the core message."
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/src/app/ads/editor/components/VariantGenerator.tsx",
                                    lineNumber: 105,
                                    columnNumber: 15
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/src/app/ads/editor/components/VariantGenerator.tsx",
                            lineNumber: 97,
                            columnNumber: 13
                        }, this),
                        loading && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ads$2f$editor$2f$components$2f$VariantGenerator$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].loading,
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ads$2f$editor$2f$components$2f$VariantGenerator$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].spinner
                                }, void 0, false, {
                                    fileName: "[project]/src/app/ads/editor/components/VariantGenerator.tsx",
                                    lineNumber: 115,
                                    columnNumber: 15
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                    children: "Generating variants with AI..."
                                }, void 0, false, {
                                    fileName: "[project]/src/app/ads/editor/components/VariantGenerator.tsx",
                                    lineNumber: 116,
                                    columnNumber: 15
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/src/app/ads/editor/components/VariantGenerator.tsx",
                            lineNumber: 114,
                            columnNumber: 13
                        }, this),
                        error && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ads$2f$editor$2f$components$2f$VariantGenerator$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].error,
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                    children: error
                                }, void 0, false, {
                                    fileName: "[project]/src/app/ads/editor/components/VariantGenerator.tsx",
                                    lineNumber: 123,
                                    columnNumber: 15
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                    onClick: generateVariants,
                                    className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ads$2f$editor$2f$components$2f$VariantGenerator$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].retryButton,
                                    children: "Try Again"
                                }, void 0, false, {
                                    fileName: "[project]/src/app/ads/editor/components/VariantGenerator.tsx",
                                    lineNumber: 124,
                                    columnNumber: 15
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/src/app/ads/editor/components/VariantGenerator.tsx",
                            lineNumber: 122,
                            columnNumber: 13
                        }, this),
                        variants.length > 0 && !loading && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ads$2f$editor$2f$components$2f$VariantGenerator$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].section,
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                    className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ads$2f$editor$2f$components$2f$VariantGenerator$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].label,
                                    children: [
                                        "Select a variant (",
                                        variants.length,
                                        " generated):"
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/src/app/ads/editor/components/VariantGenerator.tsx",
                                    lineNumber: 133,
                                    columnNumber: 15
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ads$2f$editor$2f$components$2f$VariantGenerator$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].variantsList,
                                    children: variants.map((variant, index)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            className: `${__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ads$2f$editor$2f$components$2f$VariantGenerator$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].variantItem} ${selectedVariant === variant ? __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ads$2f$editor$2f$components$2f$VariantGenerator$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].selected : ''}`,
                                            onClick: ()=>setSelectedVariant(variant),
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                    className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ads$2f$editor$2f$components$2f$VariantGenerator$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].variantNumber,
                                                    children: index + 1
                                                }, void 0, false, {
                                                    fileName: "[project]/src/app/ads/editor/components/VariantGenerator.tsx",
                                                    lineNumber: 145,
                                                    columnNumber: 21
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                    className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ads$2f$editor$2f$components$2f$VariantGenerator$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].variantText,
                                                    children: variant
                                                }, void 0, false, {
                                                    fileName: "[project]/src/app/ads/editor/components/VariantGenerator.tsx",
                                                    lineNumber: 146,
                                                    columnNumber: 21
                                                }, this),
                                                selectedVariant === variant && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                    className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ads$2f$editor$2f$components$2f$VariantGenerator$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].checkmark,
                                                    children: "✓"
                                                }, void 0, false, {
                                                    fileName: "[project]/src/app/ads/editor/components/VariantGenerator.tsx",
                                                    lineNumber: 148,
                                                    columnNumber: 23
                                                }, this)
                                            ]
                                        }, index, true, {
                                            fileName: "[project]/src/app/ads/editor/components/VariantGenerator.tsx",
                                            lineNumber: 138,
                                            columnNumber: 19
                                        }, this))
                                }, void 0, false, {
                                    fileName: "[project]/src/app/ads/editor/components/VariantGenerator.tsx",
                                    lineNumber: 136,
                                    columnNumber: 15
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                    onClick: generateVariants,
                                    className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ads$2f$editor$2f$components$2f$VariantGenerator$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].regenerateButton,
                                    disabled: loading,
                                    children: "Regenerate Variants"
                                }, void 0, false, {
                                    fileName: "[project]/src/app/ads/editor/components/VariantGenerator.tsx",
                                    lineNumber: 155,
                                    columnNumber: 15
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/src/app/ads/editor/components/VariantGenerator.tsx",
                            lineNumber: 132,
                            columnNumber: 13
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/src/app/ads/editor/components/VariantGenerator.tsx",
                    lineNumber: 86,
                    columnNumber: 9
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ads$2f$editor$2f$components$2f$VariantGenerator$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].footer,
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                            onClick: onClose,
                            className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ads$2f$editor$2f$components$2f$VariantGenerator$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].cancelButton,
                            children: "Cancel"
                        }, void 0, false, {
                            fileName: "[project]/src/app/ads/editor/components/VariantGenerator.tsx",
                            lineNumber: 168,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                            onClick: applyVariant,
                            className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ads$2f$editor$2f$components$2f$VariantGenerator$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].applyButton,
                            disabled: !selectedVariant,
                            children: "Apply Selected Variant"
                        }, void 0, false, {
                            fileName: "[project]/src/app/ads/editor/components/VariantGenerator.tsx",
                            lineNumber: 171,
                            columnNumber: 11
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/src/app/ads/editor/components/VariantGenerator.tsx",
                    lineNumber: 167,
                    columnNumber: 9
                }, this)
            ]
        }, void 0, true, {
            fileName: "[project]/src/app/ads/editor/components/VariantGenerator.tsx",
            lineNumber: 76,
            columnNumber: 7
        }, this)
    }, void 0, false, {
        fileName: "[project]/src/app/ads/editor/components/VariantGenerator.tsx",
        lineNumber: 75,
        columnNumber: 5
    }, this);
}
_s(VariantGenerator, "bN0hjeFIS6p8jvOFXDw+yk5g5eg=");
_c = VariantGenerator;
var _c;
__turbopack_context__.k.register(_c, "VariantGenerator");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/src/app/ads/editor/components/AdEditorForm.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>AdEditorForm
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ads$2f$editor$2f$components$2f$SizeSelector$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/app/ads/editor/components/SizeSelector.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ads$2f$editor$2f$components$2f$VariantGenerator$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/app/ads/editor/components/VariantGenerator.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ads$2f$editor$2f$editor$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__ = __turbopack_context__.i("[project]/src/app/ads/editor/editor.module.css [app-client] (css module)");
;
var _s = __turbopack_context__.k.signature();
'use client';
;
;
;
;
function AdEditorForm({ template, onUpdate }) {
    _s();
    const [showVariantGenerator, setShowVariantGenerator] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    const [variantField, setVariantField] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(null);
    // Open variant generator for a field
    const openVariantGenerator = (type, path, text)=>{
        if (!text || text.trim().length === 0) {
            alert(`Please enter a ${type} first before generating variants.`);
            return;
        }
        setVariantField({
            type,
            path,
            text
        });
        setShowVariantGenerator(true);
    };
    // Apply selected variant
    const applyVariant = (variant)=>{
        if (variantField) {
            onUpdate(variantField.path, variant);
        }
    };
    // Close modal
    const closeVariantGenerator = ()=>{
        setShowVariantGenerator(false);
        setVariantField(null);
    };
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("section", {
                className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ads$2f$editor$2f$editor$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].section,
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                        className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ads$2f$editor$2f$editor$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].sectionTitle,
                        children: "Layout"
                    }, void 0, false, {
                        fileName: "[project]/src/app/ads/editor/components/AdEditorForm.tsx",
                        lineNumber: 49,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ads$2f$editor$2f$editor$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].formGroup,
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ads$2f$editor$2f$editor$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].label,
                                children: "Layout Type"
                            }, void 0, false, {
                                fileName: "[project]/src/app/ads/editor/components/AdEditorForm.tsx",
                                lineNumber: 51,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("select", {
                                value: template.layout,
                                onChange: (e)=>onUpdate([
                                        'layout'
                                    ], e.target.value),
                                className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ads$2f$editor$2f$editor$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].select,
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                        value: "hero-text",
                                        children: "Hero Text"
                                    }, void 0, false, {
                                        fileName: "[project]/src/app/ads/editor/components/AdEditorForm.tsx",
                                        lineNumber: 57,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                        value: "split-horizontal",
                                        children: "Split Horizontal"
                                    }, void 0, false, {
                                        fileName: "[project]/src/app/ads/editor/components/AdEditorForm.tsx",
                                        lineNumber: 58,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                        value: "split-vertical",
                                        children: "Split Vertical"
                                    }, void 0, false, {
                                        fileName: "[project]/src/app/ads/editor/components/AdEditorForm.tsx",
                                        lineNumber: 59,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                        value: "text-only",
                                        children: "Text Only"
                                    }, void 0, false, {
                                        fileName: "[project]/src/app/ads/editor/components/AdEditorForm.tsx",
                                        lineNumber: 60,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                        value: "product-showcase",
                                        children: "Product Showcase"
                                    }, void 0, false, {
                                        fileName: "[project]/src/app/ads/editor/components/AdEditorForm.tsx",
                                        lineNumber: 61,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                        value: "quote",
                                        children: "Quote"
                                    }, void 0, false, {
                                        fileName: "[project]/src/app/ads/editor/components/AdEditorForm.tsx",
                                        lineNumber: 62,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                        value: "minimal",
                                        children: "Minimal"
                                    }, void 0, false, {
                                        fileName: "[project]/src/app/ads/editor/components/AdEditorForm.tsx",
                                        lineNumber: 63,
                                        columnNumber: 13
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/app/ads/editor/components/AdEditorForm.tsx",
                                lineNumber: 52,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/app/ads/editor/components/AdEditorForm.tsx",
                        lineNumber: 50,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ads$2f$editor$2f$components$2f$SizeSelector$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {
                        currentWidth: template.dimensions.width,
                        currentHeight: template.dimensions.height,
                        onSizeChange: (width, height, name)=>{
                            onUpdate([
                                'dimensions'
                            ], {
                                width,
                                height,
                                name
                            });
                        }
                    }, void 0, false, {
                        fileName: "[project]/src/app/ads/editor/components/AdEditorForm.tsx",
                        lineNumber: 67,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/src/app/ads/editor/components/AdEditorForm.tsx",
                lineNumber: 48,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("section", {
                className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ads$2f$editor$2f$editor$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].section,
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                        className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ads$2f$editor$2f$editor$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].sectionTitle,
                        children: "Content"
                    }, void 0, false, {
                        fileName: "[project]/src/app/ads/editor/components/AdEditorForm.tsx",
                        lineNumber: 78,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ads$2f$editor$2f$editor$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].formGroup,
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ads$2f$editor$2f$editor$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].label,
                                children: "Headline"
                            }, void 0, false, {
                                fileName: "[project]/src/app/ads/editor/components/AdEditorForm.tsx",
                                lineNumber: 80,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ads$2f$editor$2f$editor$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].inputWithButton,
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                        type: "text",
                                        value: template.content.headline || '',
                                        onChange: (e)=>onUpdate([
                                                'content',
                                                'headline'
                                            ], e.target.value),
                                        className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ads$2f$editor$2f$editor$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].input,
                                        placeholder: "Your headline"
                                    }, void 0, false, {
                                        fileName: "[project]/src/app/ads/editor/components/AdEditorForm.tsx",
                                        lineNumber: 82,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                        type: "button",
                                        className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ads$2f$editor$2f$editor$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].aiButton,
                                        onClick: ()=>openVariantGenerator('headline', [
                                                'content',
                                                'headline'
                                            ], template.content.headline || ''),
                                        title: "Generate AI variants",
                                        children: "✨ AI"
                                    }, void 0, false, {
                                        fileName: "[project]/src/app/ads/editor/components/AdEditorForm.tsx",
                                        lineNumber: 89,
                                        columnNumber: 13
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/app/ads/editor/components/AdEditorForm.tsx",
                                lineNumber: 81,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/app/ads/editor/components/AdEditorForm.tsx",
                        lineNumber: 79,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ads$2f$editor$2f$editor$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].formGroup,
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ads$2f$editor$2f$editor$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].label,
                                children: "Subheadline"
                            }, void 0, false, {
                                fileName: "[project]/src/app/ads/editor/components/AdEditorForm.tsx",
                                lineNumber: 107,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ads$2f$editor$2f$editor$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].inputWithButton,
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("textarea", {
                                        value: template.content.subheadline || '',
                                        onChange: (e)=>onUpdate([
                                                'content',
                                                'subheadline'
                                            ], e.target.value),
                                        className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ads$2f$editor$2f$editor$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].textarea,
                                        placeholder: "Supporting text"
                                    }, void 0, false, {
                                        fileName: "[project]/src/app/ads/editor/components/AdEditorForm.tsx",
                                        lineNumber: 109,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                        type: "button",
                                        className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ads$2f$editor$2f$editor$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].aiButton,
                                        onClick: ()=>openVariantGenerator('subheadline', [
                                                'content',
                                                'subheadline'
                                            ], template.content.subheadline || ''),
                                        title: "Generate AI variants",
                                        children: "✨ AI"
                                    }, void 0, false, {
                                        fileName: "[project]/src/app/ads/editor/components/AdEditorForm.tsx",
                                        lineNumber: 115,
                                        columnNumber: 13
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/app/ads/editor/components/AdEditorForm.tsx",
                                lineNumber: 108,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/app/ads/editor/components/AdEditorForm.tsx",
                        lineNumber: 106,
                        columnNumber: 9
                    }, this),
                    template.layout !== 'quote' && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ads$2f$editor$2f$editor$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].formGroup,
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ads$2f$editor$2f$editor$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].label,
                                children: "Call to Action"
                            }, void 0, false, {
                                fileName: "[project]/src/app/ads/editor/components/AdEditorForm.tsx",
                                lineNumber: 134,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ads$2f$editor$2f$editor$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].inputWithButton,
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                        type: "text",
                                        value: template.content.cta || '',
                                        onChange: (e)=>onUpdate([
                                                'content',
                                                'cta'
                                            ], e.target.value),
                                        className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ads$2f$editor$2f$editor$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].input,
                                        placeholder: "Learn More"
                                    }, void 0, false, {
                                        fileName: "[project]/src/app/ads/editor/components/AdEditorForm.tsx",
                                        lineNumber: 136,
                                        columnNumber: 15
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                        type: "button",
                                        className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ads$2f$editor$2f$editor$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].aiButton,
                                        onClick: ()=>openVariantGenerator('cta', [
                                                'content',
                                                'cta'
                                            ], template.content.cta || ''),
                                        title: "Generate AI variants",
                                        children: "✨ AI"
                                    }, void 0, false, {
                                        fileName: "[project]/src/app/ads/editor/components/AdEditorForm.tsx",
                                        lineNumber: 143,
                                        columnNumber: 15
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/app/ads/editor/components/AdEditorForm.tsx",
                                lineNumber: 135,
                                columnNumber: 13
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/app/ads/editor/components/AdEditorForm.tsx",
                        lineNumber: 133,
                        columnNumber: 11
                    }, this),
                    template.layout === 'quote' && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Fragment"], {
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ads$2f$editor$2f$editor$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].formGroup,
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                        className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ads$2f$editor$2f$editor$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].label,
                                        children: "Author Name"
                                    }, void 0, false, {
                                        fileName: "[project]/src/app/ads/editor/components/AdEditorForm.tsx",
                                        lineNumber: 164,
                                        columnNumber: 15
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                        type: "text",
                                        value: template.content.authorName || '',
                                        onChange: (e)=>onUpdate([
                                                'content',
                                                'authorName'
                                            ], e.target.value),
                                        className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ads$2f$editor$2f$editor$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].input,
                                        placeholder: "John Doe"
                                    }, void 0, false, {
                                        fileName: "[project]/src/app/ads/editor/components/AdEditorForm.tsx",
                                        lineNumber: 165,
                                        columnNumber: 15
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/app/ads/editor/components/AdEditorForm.tsx",
                                lineNumber: 163,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ads$2f$editor$2f$editor$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].formGroup,
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                        className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ads$2f$editor$2f$editor$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].label,
                                        children: "Author Title"
                                    }, void 0, false, {
                                        fileName: "[project]/src/app/ads/editor/components/AdEditorForm.tsx",
                                        lineNumber: 174,
                                        columnNumber: 15
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                        type: "text",
                                        value: template.content.authorTitle || '',
                                        onChange: (e)=>onUpdate([
                                                'content',
                                                'authorTitle'
                                            ], e.target.value),
                                        className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ads$2f$editor$2f$editor$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].input,
                                        placeholder: "CEO, Company"
                                    }, void 0, false, {
                                        fileName: "[project]/src/app/ads/editor/components/AdEditorForm.tsx",
                                        lineNumber: 175,
                                        columnNumber: 15
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/app/ads/editor/components/AdEditorForm.tsx",
                                lineNumber: 173,
                                columnNumber: 13
                            }, this)
                        ]
                    }, void 0, true)
                ]
            }, void 0, true, {
                fileName: "[project]/src/app/ads/editor/components/AdEditorForm.tsx",
                lineNumber: 77,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("section", {
                className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ads$2f$editor$2f$editor$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].section,
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                        className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ads$2f$editor$2f$editor$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].sectionTitle,
                        children: "Colors"
                    }, void 0, false, {
                        fileName: "[project]/src/app/ads/editor/components/AdEditorForm.tsx",
                        lineNumber: 189,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ads$2f$editor$2f$editor$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].formGroup,
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ads$2f$editor$2f$editor$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].label,
                                children: "Primary Color"
                            }, void 0, false, {
                                fileName: "[project]/src/app/ads/editor/components/AdEditorForm.tsx",
                                lineNumber: 191,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                type: "color",
                                value: template.style?.primaryColor || '#3b82f6',
                                onChange: (e)=>onUpdate([
                                        'style',
                                        'primaryColor'
                                    ], e.target.value),
                                className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ads$2f$editor$2f$editor$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].colorInput
                            }, void 0, false, {
                                fileName: "[project]/src/app/ads/editor/components/AdEditorForm.tsx",
                                lineNumber: 192,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/app/ads/editor/components/AdEditorForm.tsx",
                        lineNumber: 190,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ads$2f$editor$2f$editor$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].formGroup,
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ads$2f$editor$2f$editor$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].label,
                                children: "Secondary Color"
                            }, void 0, false, {
                                fileName: "[project]/src/app/ads/editor/components/AdEditorForm.tsx",
                                lineNumber: 201,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                type: "color",
                                value: template.style?.secondaryColor || '#8b5cf6',
                                onChange: (e)=>onUpdate([
                                        'style',
                                        'secondaryColor'
                                    ], e.target.value),
                                className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ads$2f$editor$2f$editor$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].colorInput
                            }, void 0, false, {
                                fileName: "[project]/src/app/ads/editor/components/AdEditorForm.tsx",
                                lineNumber: 202,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/app/ads/editor/components/AdEditorForm.tsx",
                        lineNumber: 200,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ads$2f$editor$2f$editor$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].formGroup,
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ads$2f$editor$2f$editor$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].label,
                                children: "Text Color"
                            }, void 0, false, {
                                fileName: "[project]/src/app/ads/editor/components/AdEditorForm.tsx",
                                lineNumber: 211,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                type: "color",
                                value: template.style?.textColor || '#ffffff',
                                onChange: (e)=>onUpdate([
                                        'style',
                                        'textColor'
                                    ], e.target.value),
                                className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ads$2f$editor$2f$editor$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].colorInput
                            }, void 0, false, {
                                fileName: "[project]/src/app/ads/editor/components/AdEditorForm.tsx",
                                lineNumber: 212,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/app/ads/editor/components/AdEditorForm.tsx",
                        lineNumber: 210,
                        columnNumber: 9
                    }, this),
                    template.content.cta && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Fragment"], {
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ads$2f$editor$2f$editor$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].formGroup,
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                        className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ads$2f$editor$2f$editor$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].label,
                                        children: "CTA Background"
                                    }, void 0, false, {
                                        fileName: "[project]/src/app/ads/editor/components/AdEditorForm.tsx",
                                        lineNumber: 223,
                                        columnNumber: 15
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                        type: "color",
                                        value: template.style?.ctaBackgroundColor || '#ffffff',
                                        onChange: (e)=>onUpdate([
                                                'style',
                                                'ctaBackgroundColor'
                                            ], e.target.value),
                                        className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ads$2f$editor$2f$editor$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].colorInput
                                    }, void 0, false, {
                                        fileName: "[project]/src/app/ads/editor/components/AdEditorForm.tsx",
                                        lineNumber: 224,
                                        columnNumber: 15
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/app/ads/editor/components/AdEditorForm.tsx",
                                lineNumber: 222,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ads$2f$editor$2f$editor$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].formGroup,
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                        className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ads$2f$editor$2f$editor$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].label,
                                        children: "CTA Text Color"
                                    }, void 0, false, {
                                        fileName: "[project]/src/app/ads/editor/components/AdEditorForm.tsx",
                                        lineNumber: 233,
                                        columnNumber: 15
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                        type: "color",
                                        value: template.style?.ctaTextColor || '#3b82f6',
                                        onChange: (e)=>onUpdate([
                                                'style',
                                                'ctaTextColor'
                                            ], e.target.value),
                                        className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ads$2f$editor$2f$editor$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].colorInput
                                    }, void 0, false, {
                                        fileName: "[project]/src/app/ads/editor/components/AdEditorForm.tsx",
                                        lineNumber: 234,
                                        columnNumber: 15
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/app/ads/editor/components/AdEditorForm.tsx",
                                lineNumber: 232,
                                columnNumber: 13
                            }, this)
                        ]
                    }, void 0, true)
                ]
            }, void 0, true, {
                fileName: "[project]/src/app/ads/editor/components/AdEditorForm.tsx",
                lineNumber: 188,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("section", {
                className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ads$2f$editor$2f$editor$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].section,
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                        className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ads$2f$editor$2f$editor$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].sectionTitle,
                        children: "Typography"
                    }, void 0, false, {
                        fileName: "[project]/src/app/ads/editor/components/AdEditorForm.tsx",
                        lineNumber: 247,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ads$2f$editor$2f$editor$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].formGroup,
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ads$2f$editor$2f$editor$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].label,
                                children: "Headline Font"
                            }, void 0, false, {
                                fileName: "[project]/src/app/ads/editor/components/AdEditorForm.tsx",
                                lineNumber: 249,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("select", {
                                value: template.style?.headlineFont || 'Inter, system-ui, sans-serif',
                                onChange: (e)=>onUpdate([
                                        'style',
                                        'headlineFont'
                                    ], e.target.value),
                                className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ads$2f$editor$2f$editor$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].select,
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                        value: "Inter, system-ui, sans-serif",
                                        children: "Inter"
                                    }, void 0, false, {
                                        fileName: "[project]/src/app/ads/editor/components/AdEditorForm.tsx",
                                        lineNumber: 255,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                        value: "'Helvetica Neue', Helvetica, Arial, sans-serif",
                                        children: "Helvetica"
                                    }, void 0, false, {
                                        fileName: "[project]/src/app/ads/editor/components/AdEditorForm.tsx",
                                        lineNumber: 256,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                        value: "Georgia, serif",
                                        children: "Georgia"
                                    }, void 0, false, {
                                        fileName: "[project]/src/app/ads/editor/components/AdEditorForm.tsx",
                                        lineNumber: 257,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                        value: "'Courier New', monospace",
                                        children: "Courier New"
                                    }, void 0, false, {
                                        fileName: "[project]/src/app/ads/editor/components/AdEditorForm.tsx",
                                        lineNumber: 258,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                        value: "'Times New Roman', serif",
                                        children: "Times New Roman"
                                    }, void 0, false, {
                                        fileName: "[project]/src/app/ads/editor/components/AdEditorForm.tsx",
                                        lineNumber: 259,
                                        columnNumber: 13
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/app/ads/editor/components/AdEditorForm.tsx",
                                lineNumber: 250,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/app/ads/editor/components/AdEditorForm.tsx",
                        lineNumber: 248,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ads$2f$editor$2f$editor$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].formGroup,
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ads$2f$editor$2f$editor$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].label,
                                children: "Headline Size"
                            }, void 0, false, {
                                fileName: "[project]/src/app/ads/editor/components/AdEditorForm.tsx",
                                lineNumber: 264,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                type: "number",
                                value: template.style?.headlineSize || 48,
                                onChange: (e)=>onUpdate([
                                        'style',
                                        'headlineSize'
                                    ], Number(e.target.value)),
                                className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ads$2f$editor$2f$editor$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].numberInput,
                                min: "12",
                                max: "120"
                            }, void 0, false, {
                                fileName: "[project]/src/app/ads/editor/components/AdEditorForm.tsx",
                                lineNumber: 265,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/app/ads/editor/components/AdEditorForm.tsx",
                        lineNumber: 263,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ads$2f$editor$2f$editor$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].formGroup,
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ads$2f$editor$2f$editor$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].label,
                                children: "Headline Weight"
                            }, void 0, false, {
                                fileName: "[project]/src/app/ads/editor/components/AdEditorForm.tsx",
                                lineNumber: 276,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("select", {
                                value: template.style?.headlineFontWeight || 700,
                                onChange: (e)=>onUpdate([
                                        'style',
                                        'headlineFontWeight'
                                    ], Number(e.target.value)),
                                className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ads$2f$editor$2f$editor$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].select,
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                        value: "300",
                                        children: "Light (300)"
                                    }, void 0, false, {
                                        fileName: "[project]/src/app/ads/editor/components/AdEditorForm.tsx",
                                        lineNumber: 282,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                        value: "400",
                                        children: "Regular (400)"
                                    }, void 0, false, {
                                        fileName: "[project]/src/app/ads/editor/components/AdEditorForm.tsx",
                                        lineNumber: 283,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                        value: "500",
                                        children: "Medium (500)"
                                    }, void 0, false, {
                                        fileName: "[project]/src/app/ads/editor/components/AdEditorForm.tsx",
                                        lineNumber: 284,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                        value: "600",
                                        children: "Semibold (600)"
                                    }, void 0, false, {
                                        fileName: "[project]/src/app/ads/editor/components/AdEditorForm.tsx",
                                        lineNumber: 285,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                        value: "700",
                                        children: "Bold (700)"
                                    }, void 0, false, {
                                        fileName: "[project]/src/app/ads/editor/components/AdEditorForm.tsx",
                                        lineNumber: 286,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                        value: "800",
                                        children: "Extra Bold (800)"
                                    }, void 0, false, {
                                        fileName: "[project]/src/app/ads/editor/components/AdEditorForm.tsx",
                                        lineNumber: 287,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                        value: "900",
                                        children: "Black (900)"
                                    }, void 0, false, {
                                        fileName: "[project]/src/app/ads/editor/components/AdEditorForm.tsx",
                                        lineNumber: 288,
                                        columnNumber: 13
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/app/ads/editor/components/AdEditorForm.tsx",
                                lineNumber: 277,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/app/ads/editor/components/AdEditorForm.tsx",
                        lineNumber: 275,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ads$2f$editor$2f$editor$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].formGroup,
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ads$2f$editor$2f$editor$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].label,
                                children: "Body Size"
                            }, void 0, false, {
                                fileName: "[project]/src/app/ads/editor/components/AdEditorForm.tsx",
                                lineNumber: 293,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                type: "number",
                                value: template.style?.bodySize || 20,
                                onChange: (e)=>onUpdate([
                                        'style',
                                        'bodySize'
                                    ], Number(e.target.value)),
                                className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ads$2f$editor$2f$editor$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].numberInput,
                                min: "12",
                                max: "48"
                            }, void 0, false, {
                                fileName: "[project]/src/app/ads/editor/components/AdEditorForm.tsx",
                                lineNumber: 294,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/app/ads/editor/components/AdEditorForm.tsx",
                        lineNumber: 292,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ads$2f$editor$2f$editor$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].formGroup,
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ads$2f$editor$2f$editor$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].label,
                                children: "Body Weight"
                            }, void 0, false, {
                                fileName: "[project]/src/app/ads/editor/components/AdEditorForm.tsx",
                                lineNumber: 305,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("select", {
                                value: template.style?.bodyFontWeight || 400,
                                onChange: (e)=>onUpdate([
                                        'style',
                                        'bodyFontWeight'
                                    ], Number(e.target.value)),
                                className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ads$2f$editor$2f$editor$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].select,
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                        value: "300",
                                        children: "Light (300)"
                                    }, void 0, false, {
                                        fileName: "[project]/src/app/ads/editor/components/AdEditorForm.tsx",
                                        lineNumber: 311,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                        value: "400",
                                        children: "Regular (400)"
                                    }, void 0, false, {
                                        fileName: "[project]/src/app/ads/editor/components/AdEditorForm.tsx",
                                        lineNumber: 312,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                        value: "500",
                                        children: "Medium (500)"
                                    }, void 0, false, {
                                        fileName: "[project]/src/app/ads/editor/components/AdEditorForm.tsx",
                                        lineNumber: 313,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                        value: "600",
                                        children: "Semibold (600)"
                                    }, void 0, false, {
                                        fileName: "[project]/src/app/ads/editor/components/AdEditorForm.tsx",
                                        lineNumber: 314,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                        value: "700",
                                        children: "Bold (700)"
                                    }, void 0, false, {
                                        fileName: "[project]/src/app/ads/editor/components/AdEditorForm.tsx",
                                        lineNumber: 315,
                                        columnNumber: 13
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/app/ads/editor/components/AdEditorForm.tsx",
                                lineNumber: 306,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/app/ads/editor/components/AdEditorForm.tsx",
                        lineNumber: 304,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/src/app/ads/editor/components/AdEditorForm.tsx",
                lineNumber: 246,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("section", {
                className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ads$2f$editor$2f$editor$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].section,
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                        className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ads$2f$editor$2f$editor$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].sectionTitle,
                        children: "Spacing"
                    }, void 0, false, {
                        fileName: "[project]/src/app/ads/editor/components/AdEditorForm.tsx",
                        lineNumber: 322,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ads$2f$editor$2f$editor$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].formGroup,
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ads$2f$editor$2f$editor$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].label,
                                children: "Padding"
                            }, void 0, false, {
                                fileName: "[project]/src/app/ads/editor/components/AdEditorForm.tsx",
                                lineNumber: 324,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                type: "number",
                                value: template.style?.padding || 40,
                                onChange: (e)=>onUpdate([
                                        'style',
                                        'padding'
                                    ], Number(e.target.value)),
                                className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ads$2f$editor$2f$editor$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].numberInput,
                                min: "0",
                                max: "200",
                                step: "4"
                            }, void 0, false, {
                                fileName: "[project]/src/app/ads/editor/components/AdEditorForm.tsx",
                                lineNumber: 325,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/app/ads/editor/components/AdEditorForm.tsx",
                        lineNumber: 323,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ads$2f$editor$2f$editor$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].formGroup,
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ads$2f$editor$2f$editor$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].label,
                                children: "Gap"
                            }, void 0, false, {
                                fileName: "[project]/src/app/ads/editor/components/AdEditorForm.tsx",
                                lineNumber: 337,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                type: "number",
                                value: template.style?.gap || 16,
                                onChange: (e)=>onUpdate([
                                        'style',
                                        'gap'
                                    ], Number(e.target.value)),
                                className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ads$2f$editor$2f$editor$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].numberInput,
                                min: "0",
                                max: "100",
                                step: "4"
                            }, void 0, false, {
                                fileName: "[project]/src/app/ads/editor/components/AdEditorForm.tsx",
                                lineNumber: 338,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/app/ads/editor/components/AdEditorForm.tsx",
                        lineNumber: 336,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ads$2f$editor$2f$editor$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].formGroup,
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ads$2f$editor$2f$editor$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].label,
                                children: "Border Radius"
                            }, void 0, false, {
                                fileName: "[project]/src/app/ads/editor/components/AdEditorForm.tsx",
                                lineNumber: 350,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                type: "number",
                                value: template.style?.borderRadius || 8,
                                onChange: (e)=>onUpdate([
                                        'style',
                                        'borderRadius'
                                    ], Number(e.target.value)),
                                className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ads$2f$editor$2f$editor$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].numberInput,
                                min: "0",
                                max: "100"
                            }, void 0, false, {
                                fileName: "[project]/src/app/ads/editor/components/AdEditorForm.tsx",
                                lineNumber: 351,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/app/ads/editor/components/AdEditorForm.tsx",
                        lineNumber: 349,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/src/app/ads/editor/components/AdEditorForm.tsx",
                lineNumber: 321,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("section", {
                className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ads$2f$editor$2f$editor$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].section,
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                        className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ads$2f$editor$2f$editor$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].sectionTitle,
                        children: "Effects"
                    }, void 0, false, {
                        fileName: "[project]/src/app/ads/editor/components/AdEditorForm.tsx",
                        lineNumber: 364,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ads$2f$editor$2f$editor$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].formGroup,
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                            className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ads$2f$editor$2f$editor$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].label,
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                    type: "checkbox",
                                    checked: template.style?.shadow || false,
                                    onChange: (e)=>onUpdate([
                                            'style',
                                            'shadow'
                                        ], e.target.checked),
                                    style: {
                                        marginRight: '0.5rem'
                                    }
                                }, void 0, false, {
                                    fileName: "[project]/src/app/ads/editor/components/AdEditorForm.tsx",
                                    lineNumber: 367,
                                    columnNumber: 13
                                }, this),
                                "Enable Shadow"
                            ]
                        }, void 0, true, {
                            fileName: "[project]/src/app/ads/editor/components/AdEditorForm.tsx",
                            lineNumber: 366,
                            columnNumber: 11
                        }, this)
                    }, void 0, false, {
                        fileName: "[project]/src/app/ads/editor/components/AdEditorForm.tsx",
                        lineNumber: 365,
                        columnNumber: 9
                    }, this),
                    template.style?.shadow && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ads$2f$editor$2f$editor$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].formGroup,
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ads$2f$editor$2f$editor$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].label,
                                children: "Shadow Blur"
                            }, void 0, false, {
                                fileName: "[project]/src/app/ads/editor/components/AdEditorForm.tsx",
                                lineNumber: 379,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                type: "number",
                                value: template.style?.shadowBlur || 20,
                                onChange: (e)=>onUpdate([
                                        'style',
                                        'shadowBlur'
                                    ], Number(e.target.value)),
                                className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ads$2f$editor$2f$editor$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].numberInput,
                                min: "0",
                                max: "100"
                            }, void 0, false, {
                                fileName: "[project]/src/app/ads/editor/components/AdEditorForm.tsx",
                                lineNumber: 380,
                                columnNumber: 13
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/app/ads/editor/components/AdEditorForm.tsx",
                        lineNumber: 378,
                        columnNumber: 11
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/src/app/ads/editor/components/AdEditorForm.tsx",
                lineNumber: 363,
                columnNumber: 7
            }, this),
            showVariantGenerator && variantField && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ads$2f$editor$2f$components$2f$VariantGenerator$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {
                originalText: variantField.text,
                type: variantField.type,
                onSelectVariant: applyVariant,
                onClose: closeVariantGenerator
            }, void 0, false, {
                fileName: "[project]/src/app/ads/editor/components/AdEditorForm.tsx",
                lineNumber: 394,
                columnNumber: 9
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/src/app/ads/editor/components/AdEditorForm.tsx",
        lineNumber: 46,
        columnNumber: 5
    }, this);
}
_s(AdEditorForm, "KZ+It6g4BtOi65XF1X7K570+n2o=");
_c = AdEditorForm;
var _c;
__turbopack_context__.k.register(_c, "AdEditorForm");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/src/app/ads/editor/components/AdPreview.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>AdPreview
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature();
'use client';
;
function AdPreview({ template }) {
    _s();
    const canvasRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])(null);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "AdPreview.useEffect": ()=>{
            renderPreview();
        }
    }["AdPreview.useEffect"], [
        template
    ]);
    const renderPreview = ()=>{
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        const { width, height } = template.dimensions;
        const scale = Math.min(800 / width, 600 / height);
        canvas.width = width;
        canvas.height = height;
        // Clear canvas
        ctx.clearRect(0, 0, width, height);
        // Draw background
        if (template.content.gradient) {
            const gradient = ctx.createLinearGradient(0, 0, width, height);
            gradient.addColorStop(0, template.content.gradient.from);
            gradient.addColorStop(1, template.content.gradient.to);
            ctx.fillStyle = gradient;
        } else if (template.content.backgroundColor) {
            ctx.fillStyle = template.content.backgroundColor;
        } else {
            ctx.fillStyle = template.style?.primaryColor || '#3b82f6';
        }
        ctx.fillRect(0, 0, width, height);
        // Setup text rendering
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        const padding = template.style?.padding || 40;
        const gap = template.style?.gap || 16;
        // Render based on layout
        switch(template.layout){
            case 'hero-text':
            case 'text-only':
                renderHeroText(ctx, template, padding, gap);
                break;
            case 'quote':
                renderQuote(ctx, template, padding, gap);
                break;
            case 'minimal':
                renderMinimal(ctx, template, padding);
                break;
            default:
                renderHeroText(ctx, template, padding, gap);
        }
    };
    const renderHeroText = (ctx, template, padding, gap)=>{
        const { width, height } = template.dimensions;
        const centerY = height / 2;
        // Headline
        ctx.fillStyle = template.style?.textColor || '#ffffff';
        ctx.font = `${template.style?.headlineFontWeight || 700} ${template.style?.headlineSize || 48}px ${template.style?.headlineFont || 'Inter, sans-serif'}`;
        const headlineLines = wrapText(ctx, template.content.headline || '', width - padding * 2);
        let currentY = centerY - (headlineLines.length * (template.style?.headlineSize || 48) + gap) / 2;
        headlineLines.forEach((line)=>{
            ctx.fillText(line, width / 2, currentY);
            currentY += (template.style?.headlineSize || 48) * 1.2;
        });
        // Subheadline
        if (template.content.subheadline) {
            currentY += gap;
            ctx.font = `${template.style?.bodyFontWeight || 400} ${template.style?.bodySize || 20}px ${template.style?.bodyFont || template.style?.headlineFont || 'Inter, sans-serif'}`;
            const subheadlineLines = wrapText(ctx, template.content.subheadline, width - padding * 2);
            subheadlineLines.forEach((line)=>{
                ctx.fillText(line, width / 2, currentY);
                currentY += (template.style?.bodySize || 20) * 1.4;
            });
        }
        // CTA Button
        if (template.content.cta) {
            currentY += gap * 2;
            const buttonWidth = 200;
            const buttonHeight = 50;
            const buttonX = width / 2 - buttonWidth / 2;
            const buttonY = currentY - buttonHeight / 2;
            // Button background
            ctx.fillStyle = template.style?.ctaBackgroundColor || '#ffffff';
            const radius = template.style?.borderRadius || 8;
            roundRect(ctx, buttonX, buttonY, buttonWidth, buttonHeight, radius);
            ctx.fill();
            // Button text
            ctx.fillStyle = template.style?.ctaTextColor || template.style?.primaryColor || '#3b82f6';
            ctx.font = `600 16px ${template.style?.bodyFont || template.style?.headlineFont || 'Inter, sans-serif'}`;
            ctx.fillText(template.content.cta, width / 2, currentY);
        }
    };
    const renderQuote = (ctx, template, padding, gap)=>{
        const { width, height } = template.dimensions;
        const centerY = height / 2;
        // Quote marks
        ctx.fillStyle = template.style?.textColor || '#ffffff';
        ctx.font = `${template.style?.headlineFontWeight || 700} ${(template.style?.headlineSize || 48) * 1.5}px Georgia, serif`;
        ctx.fillText('"', width / 2 - width / 3, centerY - height / 6);
        // Quote text
        ctx.font = `${template.style?.headlineFontWeight || 500} ${template.style?.headlineSize || 32}px ${template.style?.headlineFont || 'Inter, sans-serif'}`;
        const quoteLines = wrapText(ctx, template.content.headline || '', width - padding * 2);
        let currentY = centerY - quoteLines.length * (template.style?.headlineSize || 32) / 2;
        quoteLines.forEach((line)=>{
            ctx.fillText(line, width / 2, currentY);
            currentY += (template.style?.headlineSize || 32) * 1.3;
        });
        // Author
        if (template.content.authorName) {
            currentY += gap * 2;
            ctx.font = `${template.style?.bodyFontWeight || 600} ${template.style?.bodySize || 18}px ${template.style?.bodyFont || 'Inter, sans-serif'}`;
            ctx.fillText(template.content.authorName, width / 2, currentY);
            if (template.content.authorTitle) {
                currentY += (template.style?.bodySize || 18) * 1.3;
                ctx.font = `${template.style?.bodyFontWeight || 400} ${(template.style?.bodySize || 18) * 0.9}px ${template.style?.bodyFont || 'Inter, sans-serif'}`;
                ctx.fillText(template.content.authorTitle, width / 2, currentY);
            }
        }
    };
    const renderMinimal = (ctx, template, padding)=>{
        const { width, height } = template.dimensions;
        const centerY = height / 2;
        // Simple centered text
        ctx.fillStyle = template.style?.textColor || '#ffffff';
        ctx.font = `${template.style?.headlineFontWeight || 600} ${template.style?.headlineSize || 40}px ${template.style?.headlineFont || 'Inter, sans-serif'}`;
        const lines = wrapText(ctx, template.content.headline || '', width - padding * 2);
        let currentY = centerY - lines.length * (template.style?.headlineSize || 40) / 2;
        lines.forEach((line)=>{
            ctx.fillText(line, width / 2, currentY);
            currentY += (template.style?.headlineSize || 40) * 1.2;
        });
    };
    // Helper function to wrap text
    const wrapText = (ctx, text, maxWidth)=>{
        const words = text.split(' ');
        const lines = [];
        let currentLine = '';
        words.forEach((word)=>{
            const testLine = currentLine + (currentLine ? ' ' : '') + word;
            const metrics = ctx.measureText(testLine);
            if (metrics.width > maxWidth && currentLine) {
                lines.push(currentLine);
                currentLine = word;
            } else {
                currentLine = testLine;
            }
        });
        if (currentLine) {
            lines.push(currentLine);
        }
        return lines;
    };
    // Helper function to draw rounded rectangle
    const roundRect = (ctx, x, y, width, height, radius)=>{
        ctx.beginPath();
        ctx.moveTo(x + radius, y);
        ctx.lineTo(x + width - radius, y);
        ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
        ctx.lineTo(x + width, y + height - radius);
        ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
        ctx.lineTo(x + radius, y + height);
        ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
        ctx.lineTo(x, y + radius);
        ctx.quadraticCurveTo(x, y, x + radius, y);
        ctx.closePath();
    };
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        style: {
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '1rem'
        },
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                style: {
                    background: 'white',
                    padding: '2rem',
                    borderRadius: '12px',
                    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
                },
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("canvas", {
                    ref: canvasRef,
                    style: {
                        maxWidth: '800px',
                        maxHeight: '600px',
                        width: '100%',
                        height: 'auto',
                        display: 'block',
                        border: '1px solid #e5e7eb',
                        borderRadius: '8px'
                    }
                }, void 0, false, {
                    fileName: "[project]/src/app/ads/editor/components/AdPreview.tsx",
                    lineNumber: 278,
                    columnNumber: 9
                }, this)
            }, void 0, false, {
                fileName: "[project]/src/app/ads/editor/components/AdPreview.tsx",
                lineNumber: 270,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                style: {
                    textAlign: 'center',
                    color: '#6b7280',
                    fontSize: '0.875rem'
                },
                children: [
                    template.dimensions.name,
                    " - ",
                    template.dimensions.width,
                    " × ",
                    template.dimensions.height
                ]
            }, void 0, true, {
                fileName: "[project]/src/app/ads/editor/components/AdPreview.tsx",
                lineNumber: 292,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/src/app/ads/editor/components/AdPreview.tsx",
        lineNumber: 262,
        columnNumber: 5
    }, this);
}
_s(AdPreview, "UJgi7ynoup7eqypjnwyX/s32POg=");
_c = AdPreview;
var _c;
__turbopack_context__.k.register(_c, "AdPreview");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/src/app/ads/editor/page.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>AdEditorPage
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$types$2f$adTemplate$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/types/adTemplate.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ads$2f$editor$2f$components$2f$AdEditorForm$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/app/ads/editor/components/AdEditorForm.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ads$2f$editor$2f$components$2f$AdPreview$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/app/ads/editor/components/AdPreview.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ads$2f$editor$2f$editor$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__ = __turbopack_context__.i("[project]/src/app/ads/editor/editor.module.css [app-client] (css module)");
;
var _s = __turbopack_context__.k.signature();
'use client';
;
;
;
;
;
// Sample templates for selection
const STARTER_TEMPLATES = [
    'example-hero-ad',
    'example-quote-ad',
    'example-minimal-ad',
    'example-text-only-ad'
];
// Brand kits for selection
const BRAND_KITS = [
    'tech-startup-001',
    'eco-brand-002'
];
function AdEditorPage() {
    _s();
    const [template, setTemplate] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(null);
    const [brandKit, setBrandKit] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(null);
    const [loading, setLoading] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(true);
    const [selectedTemplate, setSelectedTemplate] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])('example-hero-ad');
    const [selectedBrandKit, setSelectedBrandKit] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])('tech-startup-001');
    // Load initial template
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "AdEditorPage.useEffect": ()=>{
            loadTemplate(selectedTemplate);
        }
    }["AdEditorPage.useEffect"], [
        selectedTemplate
    ]);
    // Load template from JSON
    const loadTemplate = async (templateId)=>{
        try {
            setLoading(true);
            const response = await fetch(`/data/ads/${templateId}.json`);
            const data = await response.json();
            setTemplate(data);
        } catch (error) {
            console.error('Error loading template:', error);
        } finally{
            setLoading(false);
        }
    };
    // Load brand kit
    const loadBrandKit = async (brandKitId)=>{
        try {
            const response = await fetch(`/data/brand-kits/${brandKitId}.json`);
            const data = await response.json();
            setBrandKit(data);
        } catch (error) {
            console.error('Error loading brand kit:', error);
        }
    };
    // Apply brand kit to template
    const applyBrandKit = ()=>{
        if (!template || !brandKit) return;
        const updatedTemplate = {
            ...template,
            style: {
                ...template.style,
                primaryColor: brandKit.colors.primary,
                secondaryColor: brandKit.colors.secondary || brandKit.colors.primary,
                textColor: brandKit.colors.text,
                headlineFont: brandKit.typography.headlineFont,
                bodyFont: brandKit.typography.bodyFont || brandKit.typography.headlineFont
            }
        };
        setTemplate(updatedTemplate);
    };
    // Update template field
    const updateTemplate = (path, value)=>{
        if (!template) return;
        const newTemplate = {
            ...template
        };
        let current = newTemplate;
        // Navigate to the target field
        for(let i = 0; i < path.length - 1; i++){
            if (!current[path[i]]) {
                current[path[i]] = {};
            }
            current = current[path[i]];
        }
        // Set the value
        current[path[path.length - 1]] = value;
        setTemplate(newTemplate);
    };
    // Create new template
    const createNewTemplate = ()=>{
        const newTemplate = {
            id: `custom-ad-${Date.now()}`,
            name: 'Custom Ad',
            description: 'Custom ad template',
            layout: 'hero-text',
            dimensions: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$types$2f$adTemplate$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["AD_SIZES"].INSTAGRAM_SQUARE,
            content: {
                headline: 'Your Headline Here',
                subheadline: 'Your subheadline text',
                cta: 'Learn More'
            },
            style: {
                primaryColor: '#3b82f6',
                secondaryColor: '#8b5cf6',
                textColor: '#ffffff',
                ctaBackgroundColor: '#ffffff',
                ctaTextColor: '#3b82f6',
                headlineFont: 'Inter, system-ui, sans-serif',
                bodyFont: 'Inter, system-ui, sans-serif',
                headlineSize: 48,
                bodySize: 20,
                padding: 40
            },
            metadata: {
                category: 'custom',
                tags: [
                    'custom'
                ],
                version: '1.0'
            }
        };
        setTemplate(newTemplate);
    };
    // Export template as JSON
    const exportTemplate = ()=>{
        if (!template) return;
        const dataStr = JSON.stringify(template, null, 2);
        const dataBlob = new Blob([
            dataStr
        ], {
            type: 'application/json'
        });
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${template.id}.json`;
        link.click();
        URL.revokeObjectURL(url);
    };
    if (loading || !template) {
        return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ads$2f$editor$2f$editor$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].container,
            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ads$2f$editor$2f$editor$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].loading,
                children: "Loading..."
            }, void 0, false, {
                fileName: "[project]/src/app/ads/editor/page.tsx",
                lineNumber: 149,
                columnNumber: 9
            }, this)
        }, void 0, false, {
            fileName: "[project]/src/app/ads/editor/page.tsx",
            lineNumber: 148,
            columnNumber: 7
        }, this);
    }
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ads$2f$editor$2f$editor$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].container,
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("header", {
                className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ads$2f$editor$2f$editor$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].header,
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ads$2f$editor$2f$editor$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].headerContent,
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h1", {
                            className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ads$2f$editor$2f$editor$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].title,
                            children: "Ad Editor"
                        }, void 0, false, {
                            fileName: "[project]/src/app/ads/editor/page.tsx",
                            lineNumber: 159,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ads$2f$editor$2f$editor$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].actions,
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                    onClick: createNewTemplate,
                                    className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ads$2f$editor$2f$editor$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].button,
                                    children: "New Template"
                                }, void 0, false, {
                                    fileName: "[project]/src/app/ads/editor/page.tsx",
                                    lineNumber: 161,
                                    columnNumber: 13
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                    onClick: exportTemplate,
                                    className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ads$2f$editor$2f$editor$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].button,
                                    children: "Export JSON"
                                }, void 0, false, {
                                    fileName: "[project]/src/app/ads/editor/page.tsx",
                                    lineNumber: 164,
                                    columnNumber: 13
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/src/app/ads/editor/page.tsx",
                            lineNumber: 160,
                            columnNumber: 11
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/src/app/ads/editor/page.tsx",
                    lineNumber: 158,
                    columnNumber: 9
                }, this)
            }, void 0, false, {
                fileName: "[project]/src/app/ads/editor/page.tsx",
                lineNumber: 157,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ads$2f$editor$2f$editor$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].editor,
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("aside", {
                        className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ads$2f$editor$2f$editor$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].sidebar,
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ads$2f$editor$2f$editor$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].sidebarContent,
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("section", {
                                    className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ads$2f$editor$2f$editor$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].section,
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                                            className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ads$2f$editor$2f$editor$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].sectionTitle,
                                            children: "Template"
                                        }, void 0, false, {
                                            fileName: "[project]/src/app/ads/editor/page.tsx",
                                            lineNumber: 178,
                                            columnNumber: 15
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("select", {
                                            value: selectedTemplate,
                                            onChange: (e)=>setSelectedTemplate(e.target.value),
                                            className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ads$2f$editor$2f$editor$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].select,
                                            children: STARTER_TEMPLATES.map((t)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                                    value: t,
                                                    children: t.replace('example-', '').replace(/-/g, ' ')
                                                }, t, false, {
                                                    fileName: "[project]/src/app/ads/editor/page.tsx",
                                                    lineNumber: 185,
                                                    columnNumber: 19
                                                }, this))
                                        }, void 0, false, {
                                            fileName: "[project]/src/app/ads/editor/page.tsx",
                                            lineNumber: 179,
                                            columnNumber: 15
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/src/app/ads/editor/page.tsx",
                                    lineNumber: 177,
                                    columnNumber: 13
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("section", {
                                    className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ads$2f$editor$2f$editor$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].section,
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                                            className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ads$2f$editor$2f$editor$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].sectionTitle,
                                            children: "Brand Kit"
                                        }, void 0, false, {
                                            fileName: "[project]/src/app/ads/editor/page.tsx",
                                            lineNumber: 194,
                                            columnNumber: 15
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("select", {
                                            value: selectedBrandKit,
                                            onChange: (e)=>{
                                                setSelectedBrandKit(e.target.value);
                                                loadBrandKit(e.target.value);
                                            },
                                            className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ads$2f$editor$2f$editor$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].select,
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                                    value: "",
                                                    children: "None"
                                                }, void 0, false, {
                                                    fileName: "[project]/src/app/ads/editor/page.tsx",
                                                    lineNumber: 203,
                                                    columnNumber: 17
                                                }, this),
                                                BRAND_KITS.map((b)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                                        value: b,
                                                        children: b.replace(/-\d+$/, '').replace(/-/g, ' ')
                                                    }, b, false, {
                                                        fileName: "[project]/src/app/ads/editor/page.tsx",
                                                        lineNumber: 205,
                                                        columnNumber: 19
                                                    }, this))
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/src/app/ads/editor/page.tsx",
                                            lineNumber: 195,
                                            columnNumber: 15
                                        }, this),
                                        brandKit && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                            onClick: applyBrandKit,
                                            className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ads$2f$editor$2f$editor$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].buttonSmall,
                                            children: "Apply Brand"
                                        }, void 0, false, {
                                            fileName: "[project]/src/app/ads/editor/page.tsx",
                                            lineNumber: 211,
                                            columnNumber: 17
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/src/app/ads/editor/page.tsx",
                                    lineNumber: 193,
                                    columnNumber: 13
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ads$2f$editor$2f$components$2f$AdEditorForm$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {
                                    template: template,
                                    onUpdate: updateTemplate
                                }, void 0, false, {
                                    fileName: "[project]/src/app/ads/editor/page.tsx",
                                    lineNumber: 218,
                                    columnNumber: 13
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/src/app/ads/editor/page.tsx",
                            lineNumber: 175,
                            columnNumber: 11
                        }, this)
                    }, void 0, false, {
                        fileName: "[project]/src/app/ads/editor/page.tsx",
                        lineNumber: 174,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("main", {
                        className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ads$2f$editor$2f$editor$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].preview,
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ads$2f$editor$2f$components$2f$AdPreview$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {
                            template: template
                        }, void 0, false, {
                            fileName: "[project]/src/app/ads/editor/page.tsx",
                            lineNumber: 224,
                            columnNumber: 11
                        }, this)
                    }, void 0, false, {
                        fileName: "[project]/src/app/ads/editor/page.tsx",
                        lineNumber: 223,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/src/app/ads/editor/page.tsx",
                lineNumber: 172,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/src/app/ads/editor/page.tsx",
        lineNumber: 155,
        columnNumber: 5
    }, this);
}
_s(AdEditorPage, "xUhCYiSGZca/HatRyCTUfsYagVE=");
_c = AdEditorPage;
var _c;
__turbopack_context__.k.register(_c, "AdEditorPage");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
]);

//# sourceMappingURL=src_c841361b._.js.map