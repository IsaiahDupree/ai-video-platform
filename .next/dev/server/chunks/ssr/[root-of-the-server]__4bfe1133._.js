module.exports = [
"[externals]/next/dist/compiled/next-server/app-page-turbo.runtime.dev.js [external] (next/dist/compiled/next-server/app-page-turbo.runtime.dev.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/compiled/next-server/app-page-turbo.runtime.dev.js", () => require("next/dist/compiled/next-server/app-page-turbo.runtime.dev.js"));

module.exports = mod;
}),
"[project]/src/config/adSizes.ts [app-ssr] (ecmascript)", ((__turbopack_context__) => {
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
const AD_SIZES_MAP = AD_SIZE_PRESETS.reduce((acc, size)=>{
    acc[size.id] = size;
    return acc;
}, {});
const AD_SIZES_LEGACY = AD_SIZE_PRESETS.reduce((acc, size)=>{
    // Convert ID to uppercase with underscores (e.g., 'instagram-square' -> 'INSTAGRAM_SQUARE')
    const key = size.id.toUpperCase().replace(/-/g, '_');
    acc[key] = toAdDimensions(size);
    return acc;
}, {});
}),
"[project]/src/types/adTemplate.ts [app-ssr] (ecmascript)", ((__turbopack_context__) => {
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
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$config$2f$adSizes$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/config/adSizes.ts [app-ssr] (ecmascript)");
;
const AD_SIZES = __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$config$2f$adSizes$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["AD_SIZES_LEGACY"];
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
}),
"[project]/src/app/ads/editor/editor.module.css [app-ssr] (css module)", ((__turbopack_context__) => {

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
"[project]/src/app/ads/editor/components/SizeSelector.tsx [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>SizeSelector
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$config$2f$adSizes$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/config/adSizes.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ads$2f$editor$2f$editor$2e$module$2e$css__$5b$app$2d$ssr$5d$__$28$css__module$29$__ = __turbopack_context__.i("[project]/src/app/ads/editor/editor.module.css [app-ssr] (css module)");
'use client';
;
;
;
;
function SizeSelector({ currentWidth, currentHeight, onSizeChange }) {
    const [filterMode, setFilterMode] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])('recommended');
    const [selectedPlatform, setSelectedPlatform] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])('Instagram');
    const platforms = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$config$2f$adSizes$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["getAllPlatforms"])();
    // Get sizes based on filter mode
    const sizes = filterMode === 'recommended' ? (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$config$2f$adSizes$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["getRecommendedSizes"])() : (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$config$2f$adSizes$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["getSizesByPlatform"])(selectedPlatform);
    // Find if current size matches any preset
    const currentSizeId = sizes.find((size)=>size.width === currentWidth && size.height === currentHeight)?.id;
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ads$2f$editor$2f$editor$2e$module$2e$css__$5b$app$2d$ssr$5d$__$28$css__module$29$__["default"].sizeSelector,
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ads$2f$editor$2f$editor$2e$module$2e$css__$5b$app$2d$ssr$5d$__$28$css__module$29$__["default"].formGroup,
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                        className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ads$2f$editor$2f$editor$2e$module$2e$css__$5b$app$2d$ssr$5d$__$28$css__module$29$__["default"].label,
                        children: "Filter"
                    }, void 0, false, {
                        fileName: "[project]/src/app/ads/editor/components/SizeSelector.tsx",
                        lineNumber: 41,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ads$2f$editor$2f$editor$2e$module$2e$css__$5b$app$2d$ssr$5d$__$28$css__module$29$__["default"].radioGroup,
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ads$2f$editor$2f$editor$2e$module$2e$css__$5b$app$2d$ssr$5d$__$28$css__module$29$__["default"].radioLabel,
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
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
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ads$2f$editor$2f$editor$2e$module$2e$css__$5b$app$2d$ssr$5d$__$28$css__module$29$__["default"].radioLabel,
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
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
            filterMode === 'platform' && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ads$2f$editor$2f$editor$2e$module$2e$css__$5b$app$2d$ssr$5d$__$28$css__module$29$__["default"].formGroup,
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                        className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ads$2f$editor$2f$editor$2e$module$2e$css__$5b$app$2d$ssr$5d$__$28$css__module$29$__["default"].label,
                        children: "Platform"
                    }, void 0, false, {
                        fileName: "[project]/src/app/ads/editor/components/SizeSelector.tsx",
                        lineNumber: 66,
                        columnNumber: 11
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("select", {
                        value: selectedPlatform,
                        onChange: (e)=>setSelectedPlatform(e.target.value),
                        className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ads$2f$editor$2f$editor$2e$module$2e$css__$5b$app$2d$ssr$5d$__$28$css__module$29$__["default"].select,
                        children: platforms.map((platform)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
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
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ads$2f$editor$2f$editor$2e$module$2e$css__$5b$app$2d$ssr$5d$__$28$css__module$29$__["default"].formGroup,
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                        className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ads$2f$editor$2f$editor$2e$module$2e$css__$5b$app$2d$ssr$5d$__$28$css__module$29$__["default"].label,
                        children: "Size Preset"
                    }, void 0, false, {
                        fileName: "[project]/src/app/ads/editor/components/SizeSelector.tsx",
                        lineNumber: 82,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("select", {
                        value: currentSizeId || '',
                        onChange: (e)=>{
                            const size = sizes.find((s)=>s.id === e.target.value);
                            if (size) {
                                onSizeChange(size.width, size.height, size.name);
                            }
                        },
                        className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ads$2f$editor$2f$editor$2e$module$2e$css__$5b$app$2d$ssr$5d$__$28$css__module$29$__["default"].select,
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                value: "",
                                children: "Select a size..."
                            }, void 0, false, {
                                fileName: "[project]/src/app/ads/editor/components/SizeSelector.tsx",
                                lineNumber: 93,
                                columnNumber: 11
                            }, this),
                            sizes.map((size)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
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
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ads$2f$editor$2f$editor$2e$module$2e$css__$5b$app$2d$ssr$5d$__$28$css__module$29$__["default"].sizeGrid,
                children: sizes.slice(0, 6).map((size)=>{
                    const isSelected = size.width === currentWidth && size.height === currentHeight;
                    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                        className: `${__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ads$2f$editor$2f$editor$2e$module$2e$css__$5b$app$2d$ssr$5d$__$28$css__module$29$__["default"].sizeCard} ${isSelected ? __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ads$2f$editor$2f$editor$2e$module$2e$css__$5b$app$2d$ssr$5d$__$28$css__module$29$__["default"].sizeCardSelected : ''}`,
                        onClick: ()=>onSizeChange(size.width, size.height, size.name),
                        title: size.description,
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ads$2f$editor$2f$editor$2e$module$2e$css__$5b$app$2d$ssr$5d$__$28$css__module$29$__["default"].sizeCardAspect,
                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ads$2f$editor$2f$editor$2e$module$2e$css__$5b$app$2d$ssr$5d$__$28$css__module$29$__["default"].sizeCardBox,
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
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ads$2f$editor$2f$editor$2e$module$2e$css__$5b$app$2d$ssr$5d$__$28$css__module$29$__["default"].sizeCardInfo,
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ads$2f$editor$2f$editor$2e$module$2e$css__$5b$app$2d$ssr$5d$__$28$css__module$29$__["default"].sizeCardName,
                                        children: size.name
                                    }, void 0, false, {
                                        fileName: "[project]/src/app/ads/editor/components/SizeSelector.tsx",
                                        lineNumber: 123,
                                        columnNumber: 17
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ads$2f$editor$2f$editor$2e$module$2e$css__$5b$app$2d$ssr$5d$__$28$css__module$29$__["default"].sizeCardDimensions,
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
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ads$2f$editor$2f$editor$2e$module$2e$css__$5b$app$2d$ssr$5d$__$28$css__module$29$__["default"].sizeCardRatio,
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
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ads$2f$editor$2f$editor$2e$module$2e$css__$5b$app$2d$ssr$5d$__$28$css__module$29$__["default"].currentSize,
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ads$2f$editor$2f$editor$2e$module$2e$css__$5b$app$2d$ssr$5d$__$28$css__module$29$__["default"].currentSizeLabel,
                        children: "Current Size:"
                    }, void 0, false, {
                        fileName: "[project]/src/app/ads/editor/components/SizeSelector.tsx",
                        lineNumber: 136,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ads$2f$editor$2f$editor$2e$module$2e$css__$5b$app$2d$ssr$5d$__$28$css__module$29$__["default"].currentSizeValue,
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
}),
"[project]/src/app/ads/editor/components/VariantGenerator.module.css [app-ssr] (css module)", ((__turbopack_context__) => {

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
"[project]/src/app/ads/editor/components/VariantGenerator.tsx [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>VariantGenerator
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ads$2f$editor$2f$components$2f$VariantGenerator$2e$module$2e$css__$5b$app$2d$ssr$5d$__$28$css__module$29$__ = __turbopack_context__.i("[project]/src/app/ads/editor/components/VariantGenerator.module.css [app-ssr] (css module)");
'use client';
;
;
;
function VariantGenerator({ originalText, type, onSelectVariant, onClose }) {
    const [variants, setVariants] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])([]);
    const [loading, setLoading] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(false);
    const [error, setError] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(null);
    const [selectedVariant, setSelectedVariant] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(null);
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
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ads$2f$editor$2f$components$2f$VariantGenerator$2e$module$2e$css__$5b$app$2d$ssr$5d$__$28$css__module$29$__["default"].overlay,
        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ads$2f$editor$2f$components$2f$VariantGenerator$2e$module$2e$css__$5b$app$2d$ssr$5d$__$28$css__module$29$__["default"].modal,
            children: [
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ads$2f$editor$2f$components$2f$VariantGenerator$2e$module$2e$css__$5b$app$2d$ssr$5d$__$28$css__module$29$__["default"].header,
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                            className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ads$2f$editor$2f$components$2f$VariantGenerator$2e$module$2e$css__$5b$app$2d$ssr$5d$__$28$css__module$29$__["default"].title,
                            children: "AI Variant Generator"
                        }, void 0, false, {
                            fileName: "[project]/src/app/ads/editor/components/VariantGenerator.tsx",
                            lineNumber: 79,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                            onClick: onClose,
                            className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ads$2f$editor$2f$components$2f$VariantGenerator$2e$module$2e$css__$5b$app$2d$ssr$5d$__$28$css__module$29$__["default"].closeButton,
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
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ads$2f$editor$2f$components$2f$VariantGenerator$2e$module$2e$css__$5b$app$2d$ssr$5d$__$28$css__module$29$__["default"].content,
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ads$2f$editor$2f$components$2f$VariantGenerator$2e$module$2e$css__$5b$app$2d$ssr$5d$__$28$css__module$29$__["default"].section,
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                    className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ads$2f$editor$2f$components$2f$VariantGenerator$2e$module$2e$css__$5b$app$2d$ssr$5d$__$28$css__module$29$__["default"].label,
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
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ads$2f$editor$2f$components$2f$VariantGenerator$2e$module$2e$css__$5b$app$2d$ssr$5d$__$28$css__module$29$__["default"].originalText,
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
                        variants.length === 0 && !loading && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ads$2f$editor$2f$components$2f$VariantGenerator$2e$module$2e$css__$5b$app$2d$ssr$5d$__$28$css__module$29$__["default"].section,
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                    onClick: generateVariants,
                                    className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ads$2f$editor$2f$components$2f$VariantGenerator$2e$module$2e$css__$5b$app$2d$ssr$5d$__$28$css__module$29$__["default"].generateButton,
                                    disabled: loading,
                                    children: "Generate 10 AI Variants"
                                }, void 0, false, {
                                    fileName: "[project]/src/app/ads/editor/components/VariantGenerator.tsx",
                                    lineNumber: 98,
                                    columnNumber: 15
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                    className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ads$2f$editor$2f$components$2f$VariantGenerator$2e$module$2e$css__$5b$app$2d$ssr$5d$__$28$css__module$29$__["default"].hint,
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
                        loading && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ads$2f$editor$2f$components$2f$VariantGenerator$2e$module$2e$css__$5b$app$2d$ssr$5d$__$28$css__module$29$__["default"].loading,
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ads$2f$editor$2f$components$2f$VariantGenerator$2e$module$2e$css__$5b$app$2d$ssr$5d$__$28$css__module$29$__["default"].spinner
                                }, void 0, false, {
                                    fileName: "[project]/src/app/ads/editor/components/VariantGenerator.tsx",
                                    lineNumber: 115,
                                    columnNumber: 15
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
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
                        error && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ads$2f$editor$2f$components$2f$VariantGenerator$2e$module$2e$css__$5b$app$2d$ssr$5d$__$28$css__module$29$__["default"].error,
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                    children: error
                                }, void 0, false, {
                                    fileName: "[project]/src/app/ads/editor/components/VariantGenerator.tsx",
                                    lineNumber: 123,
                                    columnNumber: 15
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                    onClick: generateVariants,
                                    className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ads$2f$editor$2f$components$2f$VariantGenerator$2e$module$2e$css__$5b$app$2d$ssr$5d$__$28$css__module$29$__["default"].retryButton,
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
                        variants.length > 0 && !loading && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ads$2f$editor$2f$components$2f$VariantGenerator$2e$module$2e$css__$5b$app$2d$ssr$5d$__$28$css__module$29$__["default"].section,
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                    className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ads$2f$editor$2f$components$2f$VariantGenerator$2e$module$2e$css__$5b$app$2d$ssr$5d$__$28$css__module$29$__["default"].label,
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
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ads$2f$editor$2f$components$2f$VariantGenerator$2e$module$2e$css__$5b$app$2d$ssr$5d$__$28$css__module$29$__["default"].variantsList,
                                    children: variants.map((variant, index)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            className: `${__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ads$2f$editor$2f$components$2f$VariantGenerator$2e$module$2e$css__$5b$app$2d$ssr$5d$__$28$css__module$29$__["default"].variantItem} ${selectedVariant === variant ? __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ads$2f$editor$2f$components$2f$VariantGenerator$2e$module$2e$css__$5b$app$2d$ssr$5d$__$28$css__module$29$__["default"].selected : ''}`,
                                            onClick: ()=>setSelectedVariant(variant),
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                    className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ads$2f$editor$2f$components$2f$VariantGenerator$2e$module$2e$css__$5b$app$2d$ssr$5d$__$28$css__module$29$__["default"].variantNumber,
                                                    children: index + 1
                                                }, void 0, false, {
                                                    fileName: "[project]/src/app/ads/editor/components/VariantGenerator.tsx",
                                                    lineNumber: 145,
                                                    columnNumber: 21
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                    className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ads$2f$editor$2f$components$2f$VariantGenerator$2e$module$2e$css__$5b$app$2d$ssr$5d$__$28$css__module$29$__["default"].variantText,
                                                    children: variant
                                                }, void 0, false, {
                                                    fileName: "[project]/src/app/ads/editor/components/VariantGenerator.tsx",
                                                    lineNumber: 146,
                                                    columnNumber: 21
                                                }, this),
                                                selectedVariant === variant && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                    className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ads$2f$editor$2f$components$2f$VariantGenerator$2e$module$2e$css__$5b$app$2d$ssr$5d$__$28$css__module$29$__["default"].checkmark,
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
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                    onClick: generateVariants,
                                    className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ads$2f$editor$2f$components$2f$VariantGenerator$2e$module$2e$css__$5b$app$2d$ssr$5d$__$28$css__module$29$__["default"].regenerateButton,
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
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ads$2f$editor$2f$components$2f$VariantGenerator$2e$module$2e$css__$5b$app$2d$ssr$5d$__$28$css__module$29$__["default"].footer,
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                            onClick: onClose,
                            className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ads$2f$editor$2f$components$2f$VariantGenerator$2e$module$2e$css__$5b$app$2d$ssr$5d$__$28$css__module$29$__["default"].cancelButton,
                            children: "Cancel"
                        }, void 0, false, {
                            fileName: "[project]/src/app/ads/editor/components/VariantGenerator.tsx",
                            lineNumber: 168,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                            onClick: applyVariant,
                            className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ads$2f$editor$2f$components$2f$VariantGenerator$2e$module$2e$css__$5b$app$2d$ssr$5d$__$28$css__module$29$__["default"].applyButton,
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
}),
"[project]/src/app/ads/editor/components/AdEditorForm.tsx [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>AdEditorForm
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ads$2f$editor$2f$components$2f$SizeSelector$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/app/ads/editor/components/SizeSelector.tsx [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ads$2f$editor$2f$components$2f$VariantGenerator$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/app/ads/editor/components/VariantGenerator.tsx [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ads$2f$editor$2f$editor$2e$module$2e$css__$5b$app$2d$ssr$5d$__$28$css__module$29$__ = __turbopack_context__.i("[project]/src/app/ads/editor/editor.module.css [app-ssr] (css module)");
'use client';
;
;
;
;
;
function AdEditorForm({ template, onUpdate }) {
    const [showVariantGenerator, setShowVariantGenerator] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(false);
    const [variantField, setVariantField] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(null);
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
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("section", {
                className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ads$2f$editor$2f$editor$2e$module$2e$css__$5b$app$2d$ssr$5d$__$28$css__module$29$__["default"].section,
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                        className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ads$2f$editor$2f$editor$2e$module$2e$css__$5b$app$2d$ssr$5d$__$28$css__module$29$__["default"].sectionTitle,
                        children: "Layout"
                    }, void 0, false, {
                        fileName: "[project]/src/app/ads/editor/components/AdEditorForm.tsx",
                        lineNumber: 49,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ads$2f$editor$2f$editor$2e$module$2e$css__$5b$app$2d$ssr$5d$__$28$css__module$29$__["default"].formGroup,
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ads$2f$editor$2f$editor$2e$module$2e$css__$5b$app$2d$ssr$5d$__$28$css__module$29$__["default"].label,
                                children: "Layout Type"
                            }, void 0, false, {
                                fileName: "[project]/src/app/ads/editor/components/AdEditorForm.tsx",
                                lineNumber: 51,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("select", {
                                value: template.layout,
                                onChange: (e)=>onUpdate([
                                        'layout'
                                    ], e.target.value),
                                className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ads$2f$editor$2f$editor$2e$module$2e$css__$5b$app$2d$ssr$5d$__$28$css__module$29$__["default"].select,
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                        value: "hero-text",
                                        children: "Hero Text"
                                    }, void 0, false, {
                                        fileName: "[project]/src/app/ads/editor/components/AdEditorForm.tsx",
                                        lineNumber: 57,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                        value: "split-horizontal",
                                        children: "Split Horizontal"
                                    }, void 0, false, {
                                        fileName: "[project]/src/app/ads/editor/components/AdEditorForm.tsx",
                                        lineNumber: 58,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                        value: "split-vertical",
                                        children: "Split Vertical"
                                    }, void 0, false, {
                                        fileName: "[project]/src/app/ads/editor/components/AdEditorForm.tsx",
                                        lineNumber: 59,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                        value: "text-only",
                                        children: "Text Only"
                                    }, void 0, false, {
                                        fileName: "[project]/src/app/ads/editor/components/AdEditorForm.tsx",
                                        lineNumber: 60,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                        value: "product-showcase",
                                        children: "Product Showcase"
                                    }, void 0, false, {
                                        fileName: "[project]/src/app/ads/editor/components/AdEditorForm.tsx",
                                        lineNumber: 61,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                        value: "quote",
                                        children: "Quote"
                                    }, void 0, false, {
                                        fileName: "[project]/src/app/ads/editor/components/AdEditorForm.tsx",
                                        lineNumber: 62,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
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
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ads$2f$editor$2f$components$2f$SizeSelector$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"], {
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
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("section", {
                className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ads$2f$editor$2f$editor$2e$module$2e$css__$5b$app$2d$ssr$5d$__$28$css__module$29$__["default"].section,
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                        className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ads$2f$editor$2f$editor$2e$module$2e$css__$5b$app$2d$ssr$5d$__$28$css__module$29$__["default"].sectionTitle,
                        children: "Content"
                    }, void 0, false, {
                        fileName: "[project]/src/app/ads/editor/components/AdEditorForm.tsx",
                        lineNumber: 78,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ads$2f$editor$2f$editor$2e$module$2e$css__$5b$app$2d$ssr$5d$__$28$css__module$29$__["default"].formGroup,
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ads$2f$editor$2f$editor$2e$module$2e$css__$5b$app$2d$ssr$5d$__$28$css__module$29$__["default"].label,
                                children: "Headline"
                            }, void 0, false, {
                                fileName: "[project]/src/app/ads/editor/components/AdEditorForm.tsx",
                                lineNumber: 80,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ads$2f$editor$2f$editor$2e$module$2e$css__$5b$app$2d$ssr$5d$__$28$css__module$29$__["default"].inputWithButton,
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                        type: "text",
                                        value: template.content.headline || '',
                                        onChange: (e)=>onUpdate([
                                                'content',
                                                'headline'
                                            ], e.target.value),
                                        className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ads$2f$editor$2f$editor$2e$module$2e$css__$5b$app$2d$ssr$5d$__$28$css__module$29$__["default"].input,
                                        placeholder: "Your headline"
                                    }, void 0, false, {
                                        fileName: "[project]/src/app/ads/editor/components/AdEditorForm.tsx",
                                        lineNumber: 82,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                        type: "button",
                                        className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ads$2f$editor$2f$editor$2e$module$2e$css__$5b$app$2d$ssr$5d$__$28$css__module$29$__["default"].aiButton,
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
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ads$2f$editor$2f$editor$2e$module$2e$css__$5b$app$2d$ssr$5d$__$28$css__module$29$__["default"].formGroup,
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ads$2f$editor$2f$editor$2e$module$2e$css__$5b$app$2d$ssr$5d$__$28$css__module$29$__["default"].label,
                                children: "Subheadline"
                            }, void 0, false, {
                                fileName: "[project]/src/app/ads/editor/components/AdEditorForm.tsx",
                                lineNumber: 107,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ads$2f$editor$2f$editor$2e$module$2e$css__$5b$app$2d$ssr$5d$__$28$css__module$29$__["default"].inputWithButton,
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("textarea", {
                                        value: template.content.subheadline || '',
                                        onChange: (e)=>onUpdate([
                                                'content',
                                                'subheadline'
                                            ], e.target.value),
                                        className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ads$2f$editor$2f$editor$2e$module$2e$css__$5b$app$2d$ssr$5d$__$28$css__module$29$__["default"].textarea,
                                        placeholder: "Supporting text"
                                    }, void 0, false, {
                                        fileName: "[project]/src/app/ads/editor/components/AdEditorForm.tsx",
                                        lineNumber: 109,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                        type: "button",
                                        className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ads$2f$editor$2f$editor$2e$module$2e$css__$5b$app$2d$ssr$5d$__$28$css__module$29$__["default"].aiButton,
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
                    template.layout !== 'quote' && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ads$2f$editor$2f$editor$2e$module$2e$css__$5b$app$2d$ssr$5d$__$28$css__module$29$__["default"].formGroup,
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ads$2f$editor$2f$editor$2e$module$2e$css__$5b$app$2d$ssr$5d$__$28$css__module$29$__["default"].label,
                                children: "Call to Action"
                            }, void 0, false, {
                                fileName: "[project]/src/app/ads/editor/components/AdEditorForm.tsx",
                                lineNumber: 134,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ads$2f$editor$2f$editor$2e$module$2e$css__$5b$app$2d$ssr$5d$__$28$css__module$29$__["default"].inputWithButton,
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                        type: "text",
                                        value: template.content.cta || '',
                                        onChange: (e)=>onUpdate([
                                                'content',
                                                'cta'
                                            ], e.target.value),
                                        className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ads$2f$editor$2f$editor$2e$module$2e$css__$5b$app$2d$ssr$5d$__$28$css__module$29$__["default"].input,
                                        placeholder: "Learn More"
                                    }, void 0, false, {
                                        fileName: "[project]/src/app/ads/editor/components/AdEditorForm.tsx",
                                        lineNumber: 136,
                                        columnNumber: 15
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                        type: "button",
                                        className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ads$2f$editor$2f$editor$2e$module$2e$css__$5b$app$2d$ssr$5d$__$28$css__module$29$__["default"].aiButton,
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
                    template.layout === 'quote' && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Fragment"], {
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ads$2f$editor$2f$editor$2e$module$2e$css__$5b$app$2d$ssr$5d$__$28$css__module$29$__["default"].formGroup,
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                        className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ads$2f$editor$2f$editor$2e$module$2e$css__$5b$app$2d$ssr$5d$__$28$css__module$29$__["default"].label,
                                        children: "Author Name"
                                    }, void 0, false, {
                                        fileName: "[project]/src/app/ads/editor/components/AdEditorForm.tsx",
                                        lineNumber: 164,
                                        columnNumber: 15
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                        type: "text",
                                        value: template.content.authorName || '',
                                        onChange: (e)=>onUpdate([
                                                'content',
                                                'authorName'
                                            ], e.target.value),
                                        className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ads$2f$editor$2f$editor$2e$module$2e$css__$5b$app$2d$ssr$5d$__$28$css__module$29$__["default"].input,
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
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ads$2f$editor$2f$editor$2e$module$2e$css__$5b$app$2d$ssr$5d$__$28$css__module$29$__["default"].formGroup,
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                        className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ads$2f$editor$2f$editor$2e$module$2e$css__$5b$app$2d$ssr$5d$__$28$css__module$29$__["default"].label,
                                        children: "Author Title"
                                    }, void 0, false, {
                                        fileName: "[project]/src/app/ads/editor/components/AdEditorForm.tsx",
                                        lineNumber: 174,
                                        columnNumber: 15
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                        type: "text",
                                        value: template.content.authorTitle || '',
                                        onChange: (e)=>onUpdate([
                                                'content',
                                                'authorTitle'
                                            ], e.target.value),
                                        className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ads$2f$editor$2f$editor$2e$module$2e$css__$5b$app$2d$ssr$5d$__$28$css__module$29$__["default"].input,
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
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("section", {
                className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ads$2f$editor$2f$editor$2e$module$2e$css__$5b$app$2d$ssr$5d$__$28$css__module$29$__["default"].section,
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                        className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ads$2f$editor$2f$editor$2e$module$2e$css__$5b$app$2d$ssr$5d$__$28$css__module$29$__["default"].sectionTitle,
                        children: "Colors"
                    }, void 0, false, {
                        fileName: "[project]/src/app/ads/editor/components/AdEditorForm.tsx",
                        lineNumber: 189,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ads$2f$editor$2f$editor$2e$module$2e$css__$5b$app$2d$ssr$5d$__$28$css__module$29$__["default"].formGroup,
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ads$2f$editor$2f$editor$2e$module$2e$css__$5b$app$2d$ssr$5d$__$28$css__module$29$__["default"].label,
                                children: "Primary Color"
                            }, void 0, false, {
                                fileName: "[project]/src/app/ads/editor/components/AdEditorForm.tsx",
                                lineNumber: 191,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                type: "color",
                                value: template.style?.primaryColor || '#3b82f6',
                                onChange: (e)=>onUpdate([
                                        'style',
                                        'primaryColor'
                                    ], e.target.value),
                                className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ads$2f$editor$2f$editor$2e$module$2e$css__$5b$app$2d$ssr$5d$__$28$css__module$29$__["default"].colorInput
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
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ads$2f$editor$2f$editor$2e$module$2e$css__$5b$app$2d$ssr$5d$__$28$css__module$29$__["default"].formGroup,
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ads$2f$editor$2f$editor$2e$module$2e$css__$5b$app$2d$ssr$5d$__$28$css__module$29$__["default"].label,
                                children: "Secondary Color"
                            }, void 0, false, {
                                fileName: "[project]/src/app/ads/editor/components/AdEditorForm.tsx",
                                lineNumber: 201,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                type: "color",
                                value: template.style?.secondaryColor || '#8b5cf6',
                                onChange: (e)=>onUpdate([
                                        'style',
                                        'secondaryColor'
                                    ], e.target.value),
                                className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ads$2f$editor$2f$editor$2e$module$2e$css__$5b$app$2d$ssr$5d$__$28$css__module$29$__["default"].colorInput
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
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ads$2f$editor$2f$editor$2e$module$2e$css__$5b$app$2d$ssr$5d$__$28$css__module$29$__["default"].formGroup,
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ads$2f$editor$2f$editor$2e$module$2e$css__$5b$app$2d$ssr$5d$__$28$css__module$29$__["default"].label,
                                children: "Text Color"
                            }, void 0, false, {
                                fileName: "[project]/src/app/ads/editor/components/AdEditorForm.tsx",
                                lineNumber: 211,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                type: "color",
                                value: template.style?.textColor || '#ffffff',
                                onChange: (e)=>onUpdate([
                                        'style',
                                        'textColor'
                                    ], e.target.value),
                                className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ads$2f$editor$2f$editor$2e$module$2e$css__$5b$app$2d$ssr$5d$__$28$css__module$29$__["default"].colorInput
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
                    template.content.cta && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Fragment"], {
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ads$2f$editor$2f$editor$2e$module$2e$css__$5b$app$2d$ssr$5d$__$28$css__module$29$__["default"].formGroup,
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                        className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ads$2f$editor$2f$editor$2e$module$2e$css__$5b$app$2d$ssr$5d$__$28$css__module$29$__["default"].label,
                                        children: "CTA Background"
                                    }, void 0, false, {
                                        fileName: "[project]/src/app/ads/editor/components/AdEditorForm.tsx",
                                        lineNumber: 223,
                                        columnNumber: 15
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                        type: "color",
                                        value: template.style?.ctaBackgroundColor || '#ffffff',
                                        onChange: (e)=>onUpdate([
                                                'style',
                                                'ctaBackgroundColor'
                                            ], e.target.value),
                                        className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ads$2f$editor$2f$editor$2e$module$2e$css__$5b$app$2d$ssr$5d$__$28$css__module$29$__["default"].colorInput
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
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ads$2f$editor$2f$editor$2e$module$2e$css__$5b$app$2d$ssr$5d$__$28$css__module$29$__["default"].formGroup,
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                        className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ads$2f$editor$2f$editor$2e$module$2e$css__$5b$app$2d$ssr$5d$__$28$css__module$29$__["default"].label,
                                        children: "CTA Text Color"
                                    }, void 0, false, {
                                        fileName: "[project]/src/app/ads/editor/components/AdEditorForm.tsx",
                                        lineNumber: 233,
                                        columnNumber: 15
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                        type: "color",
                                        value: template.style?.ctaTextColor || '#3b82f6',
                                        onChange: (e)=>onUpdate([
                                                'style',
                                                'ctaTextColor'
                                            ], e.target.value),
                                        className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ads$2f$editor$2f$editor$2e$module$2e$css__$5b$app$2d$ssr$5d$__$28$css__module$29$__["default"].colorInput
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
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("section", {
                className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ads$2f$editor$2f$editor$2e$module$2e$css__$5b$app$2d$ssr$5d$__$28$css__module$29$__["default"].section,
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                        className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ads$2f$editor$2f$editor$2e$module$2e$css__$5b$app$2d$ssr$5d$__$28$css__module$29$__["default"].sectionTitle,
                        children: "Typography"
                    }, void 0, false, {
                        fileName: "[project]/src/app/ads/editor/components/AdEditorForm.tsx",
                        lineNumber: 247,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ads$2f$editor$2f$editor$2e$module$2e$css__$5b$app$2d$ssr$5d$__$28$css__module$29$__["default"].formGroup,
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ads$2f$editor$2f$editor$2e$module$2e$css__$5b$app$2d$ssr$5d$__$28$css__module$29$__["default"].label,
                                children: "Headline Font"
                            }, void 0, false, {
                                fileName: "[project]/src/app/ads/editor/components/AdEditorForm.tsx",
                                lineNumber: 249,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("select", {
                                value: template.style?.headlineFont || 'Inter, system-ui, sans-serif',
                                onChange: (e)=>onUpdate([
                                        'style',
                                        'headlineFont'
                                    ], e.target.value),
                                className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ads$2f$editor$2f$editor$2e$module$2e$css__$5b$app$2d$ssr$5d$__$28$css__module$29$__["default"].select,
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                        value: "Inter, system-ui, sans-serif",
                                        children: "Inter"
                                    }, void 0, false, {
                                        fileName: "[project]/src/app/ads/editor/components/AdEditorForm.tsx",
                                        lineNumber: 255,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                        value: "'Helvetica Neue', Helvetica, Arial, sans-serif",
                                        children: "Helvetica"
                                    }, void 0, false, {
                                        fileName: "[project]/src/app/ads/editor/components/AdEditorForm.tsx",
                                        lineNumber: 256,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                        value: "Georgia, serif",
                                        children: "Georgia"
                                    }, void 0, false, {
                                        fileName: "[project]/src/app/ads/editor/components/AdEditorForm.tsx",
                                        lineNumber: 257,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                        value: "'Courier New', monospace",
                                        children: "Courier New"
                                    }, void 0, false, {
                                        fileName: "[project]/src/app/ads/editor/components/AdEditorForm.tsx",
                                        lineNumber: 258,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
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
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ads$2f$editor$2f$editor$2e$module$2e$css__$5b$app$2d$ssr$5d$__$28$css__module$29$__["default"].formGroup,
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ads$2f$editor$2f$editor$2e$module$2e$css__$5b$app$2d$ssr$5d$__$28$css__module$29$__["default"].label,
                                children: "Headline Size"
                            }, void 0, false, {
                                fileName: "[project]/src/app/ads/editor/components/AdEditorForm.tsx",
                                lineNumber: 264,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                type: "number",
                                value: template.style?.headlineSize || 48,
                                onChange: (e)=>onUpdate([
                                        'style',
                                        'headlineSize'
                                    ], Number(e.target.value)),
                                className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ads$2f$editor$2f$editor$2e$module$2e$css__$5b$app$2d$ssr$5d$__$28$css__module$29$__["default"].numberInput,
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
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ads$2f$editor$2f$editor$2e$module$2e$css__$5b$app$2d$ssr$5d$__$28$css__module$29$__["default"].formGroup,
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ads$2f$editor$2f$editor$2e$module$2e$css__$5b$app$2d$ssr$5d$__$28$css__module$29$__["default"].label,
                                children: "Headline Weight"
                            }, void 0, false, {
                                fileName: "[project]/src/app/ads/editor/components/AdEditorForm.tsx",
                                lineNumber: 276,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("select", {
                                value: template.style?.headlineFontWeight || 700,
                                onChange: (e)=>onUpdate([
                                        'style',
                                        'headlineFontWeight'
                                    ], Number(e.target.value)),
                                className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ads$2f$editor$2f$editor$2e$module$2e$css__$5b$app$2d$ssr$5d$__$28$css__module$29$__["default"].select,
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                        value: "300",
                                        children: "Light (300)"
                                    }, void 0, false, {
                                        fileName: "[project]/src/app/ads/editor/components/AdEditorForm.tsx",
                                        lineNumber: 282,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                        value: "400",
                                        children: "Regular (400)"
                                    }, void 0, false, {
                                        fileName: "[project]/src/app/ads/editor/components/AdEditorForm.tsx",
                                        lineNumber: 283,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                        value: "500",
                                        children: "Medium (500)"
                                    }, void 0, false, {
                                        fileName: "[project]/src/app/ads/editor/components/AdEditorForm.tsx",
                                        lineNumber: 284,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                        value: "600",
                                        children: "Semibold (600)"
                                    }, void 0, false, {
                                        fileName: "[project]/src/app/ads/editor/components/AdEditorForm.tsx",
                                        lineNumber: 285,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                        value: "700",
                                        children: "Bold (700)"
                                    }, void 0, false, {
                                        fileName: "[project]/src/app/ads/editor/components/AdEditorForm.tsx",
                                        lineNumber: 286,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                        value: "800",
                                        children: "Extra Bold (800)"
                                    }, void 0, false, {
                                        fileName: "[project]/src/app/ads/editor/components/AdEditorForm.tsx",
                                        lineNumber: 287,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
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
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ads$2f$editor$2f$editor$2e$module$2e$css__$5b$app$2d$ssr$5d$__$28$css__module$29$__["default"].formGroup,
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ads$2f$editor$2f$editor$2e$module$2e$css__$5b$app$2d$ssr$5d$__$28$css__module$29$__["default"].label,
                                children: "Body Size"
                            }, void 0, false, {
                                fileName: "[project]/src/app/ads/editor/components/AdEditorForm.tsx",
                                lineNumber: 293,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                type: "number",
                                value: template.style?.bodySize || 20,
                                onChange: (e)=>onUpdate([
                                        'style',
                                        'bodySize'
                                    ], Number(e.target.value)),
                                className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ads$2f$editor$2f$editor$2e$module$2e$css__$5b$app$2d$ssr$5d$__$28$css__module$29$__["default"].numberInput,
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
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ads$2f$editor$2f$editor$2e$module$2e$css__$5b$app$2d$ssr$5d$__$28$css__module$29$__["default"].formGroup,
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ads$2f$editor$2f$editor$2e$module$2e$css__$5b$app$2d$ssr$5d$__$28$css__module$29$__["default"].label,
                                children: "Body Weight"
                            }, void 0, false, {
                                fileName: "[project]/src/app/ads/editor/components/AdEditorForm.tsx",
                                lineNumber: 305,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("select", {
                                value: template.style?.bodyFontWeight || 400,
                                onChange: (e)=>onUpdate([
                                        'style',
                                        'bodyFontWeight'
                                    ], Number(e.target.value)),
                                className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ads$2f$editor$2f$editor$2e$module$2e$css__$5b$app$2d$ssr$5d$__$28$css__module$29$__["default"].select,
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                        value: "300",
                                        children: "Light (300)"
                                    }, void 0, false, {
                                        fileName: "[project]/src/app/ads/editor/components/AdEditorForm.tsx",
                                        lineNumber: 311,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                        value: "400",
                                        children: "Regular (400)"
                                    }, void 0, false, {
                                        fileName: "[project]/src/app/ads/editor/components/AdEditorForm.tsx",
                                        lineNumber: 312,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                        value: "500",
                                        children: "Medium (500)"
                                    }, void 0, false, {
                                        fileName: "[project]/src/app/ads/editor/components/AdEditorForm.tsx",
                                        lineNumber: 313,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                        value: "600",
                                        children: "Semibold (600)"
                                    }, void 0, false, {
                                        fileName: "[project]/src/app/ads/editor/components/AdEditorForm.tsx",
                                        lineNumber: 314,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
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
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("section", {
                className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ads$2f$editor$2f$editor$2e$module$2e$css__$5b$app$2d$ssr$5d$__$28$css__module$29$__["default"].section,
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                        className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ads$2f$editor$2f$editor$2e$module$2e$css__$5b$app$2d$ssr$5d$__$28$css__module$29$__["default"].sectionTitle,
                        children: "Spacing"
                    }, void 0, false, {
                        fileName: "[project]/src/app/ads/editor/components/AdEditorForm.tsx",
                        lineNumber: 322,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ads$2f$editor$2f$editor$2e$module$2e$css__$5b$app$2d$ssr$5d$__$28$css__module$29$__["default"].formGroup,
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ads$2f$editor$2f$editor$2e$module$2e$css__$5b$app$2d$ssr$5d$__$28$css__module$29$__["default"].label,
                                children: "Padding"
                            }, void 0, false, {
                                fileName: "[project]/src/app/ads/editor/components/AdEditorForm.tsx",
                                lineNumber: 324,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                type: "number",
                                value: template.style?.padding || 40,
                                onChange: (e)=>onUpdate([
                                        'style',
                                        'padding'
                                    ], Number(e.target.value)),
                                className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ads$2f$editor$2f$editor$2e$module$2e$css__$5b$app$2d$ssr$5d$__$28$css__module$29$__["default"].numberInput,
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
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ads$2f$editor$2f$editor$2e$module$2e$css__$5b$app$2d$ssr$5d$__$28$css__module$29$__["default"].formGroup,
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ads$2f$editor$2f$editor$2e$module$2e$css__$5b$app$2d$ssr$5d$__$28$css__module$29$__["default"].label,
                                children: "Gap"
                            }, void 0, false, {
                                fileName: "[project]/src/app/ads/editor/components/AdEditorForm.tsx",
                                lineNumber: 337,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                type: "number",
                                value: template.style?.gap || 16,
                                onChange: (e)=>onUpdate([
                                        'style',
                                        'gap'
                                    ], Number(e.target.value)),
                                className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ads$2f$editor$2f$editor$2e$module$2e$css__$5b$app$2d$ssr$5d$__$28$css__module$29$__["default"].numberInput,
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
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ads$2f$editor$2f$editor$2e$module$2e$css__$5b$app$2d$ssr$5d$__$28$css__module$29$__["default"].formGroup,
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ads$2f$editor$2f$editor$2e$module$2e$css__$5b$app$2d$ssr$5d$__$28$css__module$29$__["default"].label,
                                children: "Border Radius"
                            }, void 0, false, {
                                fileName: "[project]/src/app/ads/editor/components/AdEditorForm.tsx",
                                lineNumber: 350,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                type: "number",
                                value: template.style?.borderRadius || 8,
                                onChange: (e)=>onUpdate([
                                        'style',
                                        'borderRadius'
                                    ], Number(e.target.value)),
                                className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ads$2f$editor$2f$editor$2e$module$2e$css__$5b$app$2d$ssr$5d$__$28$css__module$29$__["default"].numberInput,
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
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("section", {
                className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ads$2f$editor$2f$editor$2e$module$2e$css__$5b$app$2d$ssr$5d$__$28$css__module$29$__["default"].section,
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                        className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ads$2f$editor$2f$editor$2e$module$2e$css__$5b$app$2d$ssr$5d$__$28$css__module$29$__["default"].sectionTitle,
                        children: "Effects"
                    }, void 0, false, {
                        fileName: "[project]/src/app/ads/editor/components/AdEditorForm.tsx",
                        lineNumber: 364,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ads$2f$editor$2f$editor$2e$module$2e$css__$5b$app$2d$ssr$5d$__$28$css__module$29$__["default"].formGroup,
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                            className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ads$2f$editor$2f$editor$2e$module$2e$css__$5b$app$2d$ssr$5d$__$28$css__module$29$__["default"].label,
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
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
                    template.style?.shadow && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ads$2f$editor$2f$editor$2e$module$2e$css__$5b$app$2d$ssr$5d$__$28$css__module$29$__["default"].formGroup,
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ads$2f$editor$2f$editor$2e$module$2e$css__$5b$app$2d$ssr$5d$__$28$css__module$29$__["default"].label,
                                children: "Shadow Blur"
                            }, void 0, false, {
                                fileName: "[project]/src/app/ads/editor/components/AdEditorForm.tsx",
                                lineNumber: 379,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                type: "number",
                                value: template.style?.shadowBlur || 20,
                                onChange: (e)=>onUpdate([
                                        'style',
                                        'shadowBlur'
                                    ], Number(e.target.value)),
                                className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ads$2f$editor$2f$editor$2e$module$2e$css__$5b$app$2d$ssr$5d$__$28$css__module$29$__["default"].numberInput,
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
            showVariantGenerator && variantField && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ads$2f$editor$2f$components$2f$VariantGenerator$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"], {
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
}),
"[project]/src/app/ads/editor/components/AdPreview.tsx [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>AdPreview
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react.js [app-ssr] (ecmascript)");
'use client';
;
;
function AdPreview({ template }) {
    const canvasRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useRef"])(null);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEffect"])(()=>{
        renderPreview();
    }, [
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
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        style: {
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '1rem'
        },
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                style: {
                    background: 'white',
                    padding: '2rem',
                    borderRadius: '12px',
                    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
                },
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("canvas", {
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
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
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
}),
"[project]/src/services/creativeQA.ts [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

/**
 * Creative QA Service - ADS-019
 * Quality assurance checks for ad creatives
 *
 * Features:
 * - Contrast ratio checking (WCAG AA/AAA compliance)
 * - Text overflow detection
 * - Logo size validation
 * - Image quality checks
 * - Safe zone validation
 * - Aspect ratio warnings
 */ __turbopack_context__.s([
    "DEFAULT_QA_CONFIG",
    ()=>DEFAULT_QA_CONFIG,
    "calculateContrastRatio",
    ()=>calculateContrastRatio,
    "checkAspectRatio",
    ()=>checkAspectRatio,
    "checkContrast",
    ()=>checkContrast,
    "checkLogoSize",
    ()=>checkLogoSize,
    "checkSafeZones",
    ()=>checkSafeZones,
    "checkTextOverflow",
    ()=>checkTextOverflow,
    "checkTextReadability",
    ()=>checkTextReadability,
    "formatIssueMessage",
    ()=>formatIssueMessage,
    "getQASummary",
    ()=>getQASummary,
    "getRelativeLuminance",
    ()=>getRelativeLuminance,
    "getSeverityColor",
    ()=>getSeverityColor,
    "getSeverityIcon",
    ()=>getSeverityIcon,
    "hexToRgb",
    ()=>hexToRgb,
    "runQAChecks",
    ()=>runQAChecks
]);
const DEFAULT_QA_CONFIG = {
    // WCAG AA compliance
    minContrastRatio: 4.5,
    checkTextContrast: true,
    checkCtaContrast: true,
    // Reasonable text limits
    maxTextLength: {
        headline: 80,
        subheadline: 120,
        body: 300,
        cta: 25
    },
    checkTextFit: true,
    // Logo should be visible but not dominate
    minLogoSize: 40,
    maxLogoSize: 200,
    recommendedLogoSize: 80,
    // Image quality standards
    minImageResolution: 1080,
    maxFileSizeMB: 5,
    // Safe zones for text and important elements
    safeZoneMargin: 40,
    checkSafeZones: true
};
function getRelativeLuminance(rgb) {
    const rsRGB = rgb.r / 255;
    const gsRGB = rgb.g / 255;
    const bsRGB = rgb.b / 255;
    const r = rsRGB <= 0.03928 ? rsRGB / 12.92 : Math.pow((rsRGB + 0.055) / 1.055, 2.4);
    const g = gsRGB <= 0.03928 ? gsRGB / 12.92 : Math.pow((gsRGB + 0.055) / 1.055, 2.4);
    const b = bsRGB <= 0.03928 ? bsRGB / 12.92 : Math.pow((bsRGB + 0.055) / 1.055, 2.4);
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
function hexToRgb(hex) {
    // Remove # if present
    hex = hex.replace(/^#/, '');
    // Handle shorthand hex (e.g., #fff)
    if (hex.length === 3) {
        hex = hex.split('').map((char)=>char + char).join('');
    }
    if (hex.length !== 6) {
        return null;
    }
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    if (isNaN(r) || isNaN(g) || isNaN(b)) {
        return null;
    }
    return {
        r,
        g,
        b
    };
}
function calculateContrastRatio(color1, color2) {
    const rgb1 = hexToRgb(color1);
    const rgb2 = hexToRgb(color2);
    if (!rgb1 || !rgb2) {
        return null;
    }
    const l1 = getRelativeLuminance(rgb1);
    const l2 = getRelativeLuminance(rgb2);
    const lighter = Math.max(l1, l2);
    const darker = Math.min(l1, l2);
    return (lighter + 0.05) / (darker + 0.05);
}
function checkContrast(template, config = DEFAULT_QA_CONFIG) {
    const issues = [];
    const minRatio = config.minContrastRatio || 4.5;
    // Check headline contrast
    if (config.checkTextContrast && template.content.headline && template.style.textColor) {
        const backgroundColor = template.content.backgroundColor || template.content.gradient?.from || template.style.primaryColor || '#ffffff';
        const ratio = calculateContrastRatio(template.style.textColor, backgroundColor);
        if (ratio !== null && ratio < minRatio) {
            const severity = ratio < 3 ? 'error' : 'warning';
            issues.push({
                id: `contrast-headline-${Date.now()}`,
                type: 'contrast',
                severity,
                message: `Headline contrast ratio is ${ratio.toFixed(2)}:1`,
                details: `WCAG ${minRatio >= 7 ? 'AAA' : 'AA'} requires ${minRatio}:1 minimum`,
                field: 'headline',
                suggestion: 'Use a lighter or darker text color for better readability',
                value: ratio.toFixed(2),
                threshold: minRatio
            });
        }
    }
    // Check CTA button contrast
    if (config.checkCtaContrast && template.content.cta && template.style.ctaTextColor && template.style.ctaBackgroundColor) {
        const ratio = calculateContrastRatio(template.style.ctaTextColor, template.style.ctaBackgroundColor);
        if (ratio !== null && ratio < minRatio) {
            const severity = ratio < 3 ? 'error' : 'warning';
            issues.push({
                id: `contrast-cta-${Date.now()}`,
                type: 'contrast',
                severity,
                message: `CTA button contrast ratio is ${ratio.toFixed(2)}:1`,
                details: `WCAG ${minRatio >= 7 ? 'AAA' : 'AA'} requires ${minRatio}:1 minimum`,
                field: 'cta',
                suggestion: 'Adjust CTA text or background color for better visibility',
                value: ratio.toFixed(2),
                threshold: minRatio
            });
        }
    }
    return issues;
}
function checkTextOverflow(template, config = DEFAULT_QA_CONFIG) {
    const issues = [];
    const maxLengths = config.maxTextLength || {};
    // Check headline length
    if (template.content.headline && maxLengths.headline) {
        const length = template.content.headline.length;
        if (length > maxLengths.headline) {
            issues.push({
                id: `overflow-headline-${Date.now()}`,
                type: 'text_overflow',
                severity: 'warning',
                message: `Headline is ${length} characters (${length - maxLengths.headline} over limit)`,
                details: `Recommended maximum is ${maxLengths.headline} characters`,
                field: 'headline',
                suggestion: 'Shorten headline or decrease font size',
                value: length,
                threshold: maxLengths.headline
            });
        }
    }
    // Check subheadline length
    if (template.content.subheadline && maxLengths.subheadline) {
        const length = template.content.subheadline.length;
        if (length > maxLengths.subheadline) {
            issues.push({
                id: `overflow-subheadline-${Date.now()}`,
                type: 'text_overflow',
                severity: 'warning',
                message: `Subheadline is ${length} characters (${length - maxLengths.subheadline} over limit)`,
                details: `Recommended maximum is ${maxLengths.subheadline} characters`,
                field: 'subheadline',
                suggestion: 'Shorten subheadline or decrease font size',
                value: length,
                threshold: maxLengths.subheadline
            });
        }
    }
    // Check body length
    if (template.content.body && maxLengths.body) {
        const length = template.content.body.length;
        if (length > maxLengths.body) {
            issues.push({
                id: `overflow-body-${Date.now()}`,
                type: 'text_overflow',
                severity: 'info',
                message: `Body text is ${length} characters (${length - maxLengths.body} over limit)`,
                details: `Recommended maximum is ${maxLengths.body} characters`,
                field: 'body',
                suggestion: 'Consider using shorter copy or increasing ad size',
                value: length,
                threshold: maxLengths.body
            });
        }
    }
    // Check CTA length
    if (template.content.cta && maxLengths.cta) {
        const length = template.content.cta.length;
        if (length > maxLengths.cta) {
            issues.push({
                id: `overflow-cta-${Date.now()}`,
                type: 'text_overflow',
                severity: 'warning',
                message: `CTA text is ${length} characters (${length - maxLengths.cta} over limit)`,
                details: `Recommended maximum is ${maxLengths.cta} characters`,
                field: 'cta',
                suggestion: 'Use a shorter, punchier call-to-action',
                value: length,
                threshold: maxLengths.cta
            });
        }
    }
    return issues;
}
function checkLogoSize(template, config = DEFAULT_QA_CONFIG) {
    const issues = [];
    if (!template.content.logoSize) {
        return issues;
    }
    const logoSize = template.content.logoSize;
    const minSize = config.minLogoSize || 40;
    const maxSize = config.maxLogoSize || 200;
    const recommended = config.recommendedLogoSize || 80;
    // Too small
    if (logoSize < minSize) {
        issues.push({
            id: `logo-size-small-${Date.now()}`,
            type: 'logo_size',
            severity: 'error',
            message: `Logo is too small at ${logoSize}px`,
            details: `Minimum recommended size is ${minSize}px`,
            field: 'logoSize',
            suggestion: `Increase logo size to at least ${minSize}px for better visibility`,
            value: logoSize,
            threshold: minSize
        });
    }
    // Too large
    if (logoSize > maxSize) {
        issues.push({
            id: `logo-size-large-${Date.now()}`,
            type: 'logo_size',
            severity: 'warning',
            message: `Logo is too large at ${logoSize}px`,
            details: `Maximum recommended size is ${maxSize}px`,
            field: 'logoSize',
            suggestion: `Reduce logo size to ${maxSize}px or less to avoid dominating the ad`,
            value: logoSize,
            threshold: maxSize
        });
    }
    // Not at recommended size
    if (logoSize >= minSize && logoSize <= maxSize && logoSize !== recommended) {
        const difference = Math.abs(logoSize - recommended);
        if (difference > 20) {
            issues.push({
                id: `logo-size-recommended-${Date.now()}`,
                type: 'logo_size',
                severity: 'info',
                message: `Logo size is ${logoSize}px (recommended: ${recommended}px)`,
                details: `For optimal balance, consider using ${recommended}px`,
                field: 'logoSize',
                suggestion: `Adjust logo size to ${recommended}px for optimal appearance`,
                value: logoSize,
                threshold: recommended
            });
        }
    }
    return issues;
}
function checkSafeZones(template, config = DEFAULT_QA_CONFIG) {
    const issues = [];
    if (!config.checkSafeZones) {
        return issues;
    }
    const minMargin = config.safeZoneMargin || 40;
    const currentPadding = template.style.padding || 0;
    if (currentPadding < minMargin) {
        issues.push({
            id: `safe-zone-${Date.now()}`,
            type: 'safe_zone',
            severity: 'warning',
            message: `Padding is ${currentPadding}px (recommended: ${minMargin}px)`,
            details: 'Text and important elements may be cut off on some platforms',
            field: 'padding',
            suggestion: `Increase padding to at least ${minMargin}px for safe zones`,
            value: currentPadding,
            threshold: minMargin
        });
    }
    return issues;
}
function checkAspectRatio(template, config = DEFAULT_QA_CONFIG) {
    const issues = [];
    if (!config.allowedAspectRatios || config.allowedAspectRatios.length === 0) {
        return issues;
    }
    const width = template.dimensions.width;
    const height = template.dimensions.height;
    const currentRatio = width / height;
    // Check if current ratio matches any allowed ratio
    const tolerance = 0.05; // 5% tolerance
    const matches = config.allowedAspectRatios.some((allowed)=>{
        const allowedRatio = allowed.width / allowed.height;
        const diff = Math.abs(currentRatio - allowedRatio);
        const allowedTolerance = allowed.tolerance !== undefined ? allowed.tolerance : tolerance;
        return diff <= allowedTolerance;
    });
    if (!matches) {
        const recommendedRatios = config.allowedAspectRatios.map((r)=>`${r.width}:${r.height}`).join(', ');
        issues.push({
            id: `aspect-ratio-${Date.now()}`,
            type: 'aspect_ratio',
            severity: 'info',
            message: `Aspect ratio ${width}:${height} is not standard`,
            details: `Recommended ratios: ${recommendedRatios}`,
            suggestion: 'Consider using a standard aspect ratio for better platform compatibility',
            value: `${width}:${height}`,
            threshold: recommendedRatios
        });
    }
    return issues;
}
function checkTextReadability(template, config = DEFAULT_QA_CONFIG) {
    const issues = [];
    // Minimum font sizes for readability
    const minHeadlineSize = 24;
    const minBodySize = 14;
    // Check headline size
    if (template.style.headlineSize && template.style.headlineSize < minHeadlineSize) {
        issues.push({
            id: `readability-headline-${Date.now()}`,
            type: 'text_readability',
            severity: 'warning',
            message: `Headline font size is ${template.style.headlineSize}px`,
            details: `Minimum recommended size is ${minHeadlineSize}px`,
            field: 'headlineSize',
            suggestion: `Increase headline size to at least ${minHeadlineSize}px`,
            value: template.style.headlineSize,
            threshold: minHeadlineSize
        });
    }
    // Check body size
    if (template.style.bodySize && template.style.bodySize < minBodySize) {
        issues.push({
            id: `readability-body-${Date.now()}`,
            type: 'text_readability',
            severity: 'warning',
            message: `Body font size is ${template.style.bodySize}px`,
            details: `Minimum recommended size is ${minBodySize}px`,
            field: 'bodySize',
            suggestion: `Increase body text size to at least ${minBodySize}px`,
            value: template.style.bodySize,
            threshold: minBodySize
        });
    }
    return issues;
}
function runQAChecks(template, config = DEFAULT_QA_CONFIG) {
    const startTime = Date.now();
    const issues = [];
    const checks = [];
    // Run contrast checks
    const contrastStart = Date.now();
    const contrastIssues = checkContrast(template, config);
    issues.push(...contrastIssues);
    checks.push({
        name: 'Contrast Ratio',
        passed: contrastIssues.length === 0,
        duration: Date.now() - contrastStart
    });
    // Run text overflow checks
    const overflowStart = Date.now();
    const overflowIssues = checkTextOverflow(template, config);
    issues.push(...overflowIssues);
    checks.push({
        name: 'Text Overflow',
        passed: overflowIssues.length === 0,
        duration: Date.now() - overflowStart
    });
    // Run logo size checks
    const logoStart = Date.now();
    const logoIssues = checkLogoSize(template, config);
    issues.push(...logoIssues);
    checks.push({
        name: 'Logo Size',
        passed: logoIssues.length === 0,
        duration: Date.now() - logoStart
    });
    // Run safe zone checks
    const safeZoneStart = Date.now();
    const safeZoneIssues = checkSafeZones(template, config);
    issues.push(...safeZoneIssues);
    checks.push({
        name: 'Safe Zones',
        passed: safeZoneIssues.length === 0,
        duration: Date.now() - safeZoneStart
    });
    // Run aspect ratio checks
    const aspectStart = Date.now();
    const aspectIssues = checkAspectRatio(template, config);
    issues.push(...aspectIssues);
    checks.push({
        name: 'Aspect Ratio',
        passed: aspectIssues.length === 0,
        duration: Date.now() - aspectStart
    });
    // Run text readability checks
    const readabilityStart = Date.now();
    const readabilityIssues = checkTextReadability(template, config);
    issues.push(...readabilityIssues);
    checks.push({
        name: 'Text Readability',
        passed: readabilityIssues.length === 0,
        duration: Date.now() - readabilityStart
    });
    // Calculate score (100 - weighted deductions)
    let score = 100;
    issues.forEach((issue)=>{
        if (issue.severity === 'error') {
            score -= 15;
        } else if (issue.severity === 'warning') {
            score -= 8;
        } else if (issue.severity === 'info') {
            score -= 3;
        }
    });
    score = Math.max(0, Math.min(100, score));
    // Overall pass/fail
    const errorCount = issues.filter((i)=>i.severity === 'error').length;
    const passed = errorCount === 0 && score >= 70;
    return {
        passed,
        score,
        issues,
        checks,
        timestamp: new Date().toISOString()
    };
}
function getQASummary(result) {
    return {
        totalIssues: result.issues.length,
        errorCount: result.issues.filter((i)=>i.severity === 'error').length,
        warningCount: result.issues.filter((i)=>i.severity === 'warning').length,
        infoCount: result.issues.filter((i)=>i.severity === 'info').length,
        passedChecks: result.checks.filter((c)=>c.passed).length,
        totalChecks: result.checks.length
    };
}
function formatIssueMessage(issue) {
    let message = issue.message;
    if (issue.details) {
        message += `\n${issue.details}`;
    }
    if (issue.suggestion) {
        message += `\n💡 ${issue.suggestion}`;
    }
    return message;
}
function getSeverityIcon(severity) {
    switch(severity){
        case 'error':
            return '❌';
        case 'warning':
            return '⚠️';
        case 'info':
            return 'ℹ️';
        default:
            return '•';
    }
}
function getSeverityColor(severity) {
    switch(severity){
        case 'error':
            return '#ef4444';
        case 'warning':
            return '#f59e0b';
        case 'info':
            return '#3b82f6';
        default:
            return '#6b7280';
    }
}
}),
"[project]/src/app/ads/editor/components/QAPanel.module.css [app-ssr] (css module)", ((__turbopack_context__) => {

__turbopack_context__.v({
  "checkDuration": "QAPanel-module__npQQzG__checkDuration",
  "checkIcon": "QAPanel-module__npQQzG__checkIcon",
  "checkItem": "QAPanel-module__npQQzG__checkItem",
  "checkName": "QAPanel-module__npQQzG__checkName",
  "checks": "QAPanel-module__npQQzG__checks",
  "checksList": "QAPanel-module__npQQzG__checksList",
  "checksTitle": "QAPanel-module__npQQzG__checksTitle",
  "container": "QAPanel-module__npQQzG__container",
  "content": "QAPanel-module__npQQzG__content",
  "emptyState": "QAPanel-module__npQQzG__emptyState",
  "expandIcon": "QAPanel-module__npQQzG__expandIcon",
  "header": "QAPanel-module__npQQzG__header",
  "headerError": "QAPanel-module__npQQzG__headerError",
  "headerInfo": "QAPanel-module__npQQzG__headerInfo",
  "headerLeft": "QAPanel-module__npQQzG__headerLeft",
  "headerRight": "QAPanel-module__npQQzG__headerRight",
  "headerSubtitle": "QAPanel-module__npQQzG__headerSubtitle",
  "headerSuccess": "QAPanel-module__npQQzG__headerSuccess",
  "headerTitle": "QAPanel-module__npQQzG__headerTitle",
  "headerWarning": "QAPanel-module__npQQzG__headerWarning",
  "issueCard": "QAPanel-module__npQQzG__issueCard",
  "issueDetail": "QAPanel-module__npQQzG__issueDetail",
  "issueDetails": "QAPanel-module__npQQzG__issueDetails",
  "issueExpandIcon": "QAPanel-module__npQQzG__issueExpandIcon",
  "issueField": "QAPanel-module__npQQzG__issueField",
  "issueHeader": "QAPanel-module__npQQzG__issueHeader",
  "issueHeaderLeft": "QAPanel-module__npQQzG__issueHeaderLeft",
  "issueIcon": "QAPanel-module__npQQzG__issueIcon",
  "issueInfo": "QAPanel-module__npQQzG__issueInfo",
  "issueMessage": "QAPanel-module__npQQzG__issueMessage",
  "issueSuggestion": "QAPanel-module__npQQzG__issueSuggestion",
  "issues": "QAPanel-module__npQQzG__issues",
  "issuesTitle": "QAPanel-module__npQQzG__issuesTitle",
  "loading": "QAPanel-module__npQQzG__loading",
  "noIssues": "QAPanel-module__npQQzG__noIssues",
  "refreshButton": "QAPanel-module__npQQzG__refreshButton",
  "runButton": "QAPanel-module__npQQzG__runButton",
  "scoreCircle": "QAPanel-module__npQQzG__scoreCircle",
  "scoreNumber": "QAPanel-module__npQQzG__scoreNumber",
  "stat": "QAPanel-module__npQQzG__stat",
  "statError": "QAPanel-module__npQQzG__statError",
  "statInfo": "QAPanel-module__npQQzG__statInfo",
  "statLabel": "QAPanel-module__npQQzG__statLabel",
  "statValue": "QAPanel-module__npQQzG__statValue",
  "statWarning": "QAPanel-module__npQQzG__statWarning",
  "stats": "QAPanel-module__npQQzG__stats",
  "successIcon": "QAPanel-module__npQQzG__successIcon",
  "suggestionIcon": "QAPanel-module__npQQzG__suggestionIcon",
});
}),
"[project]/src/app/ads/editor/components/QAPanel.tsx [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>QAPanel
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$creativeQA$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/services/creativeQA.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ads$2f$editor$2f$components$2f$QAPanel$2e$module$2e$css__$5b$app$2d$ssr$5d$__$28$css__module$29$__ = __turbopack_context__.i("[project]/src/app/ads/editor/components/QAPanel.module.css [app-ssr] (css module)");
'use client';
;
;
;
;
function QAPanel({ template, autoCheck = true, config }) {
    const [result, setResult] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(null);
    const [isExpanded, setIsExpanded] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(false);
    const [isRunning, setIsRunning] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(false);
    // Run QA checks when template changes (if autoCheck is enabled)
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEffect"])(()=>{
        if (autoCheck) {
            runChecks();
        }
    }, [
        template,
        autoCheck
    ]);
    const runChecks = ()=>{
        setIsRunning(true);
        try {
            const qaConfig = config || __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$creativeQA$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["DEFAULT_QA_CONFIG"];
            const qaResult = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$creativeQA$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["runQAChecks"])(template, qaConfig);
            setResult(qaResult);
            // Auto-expand if there are errors or warnings
            if (qaResult.issues.some((i)=>i.severity === 'error' || i.severity === 'warning')) {
                setIsExpanded(true);
            }
        } finally{
            setIsRunning(false);
        }
    };
    if (!result && !autoCheck) {
        return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ads$2f$editor$2f$components$2f$QAPanel$2e$module$2e$css__$5b$app$2d$ssr$5d$__$28$css__module$29$__["default"].container,
            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ads$2f$editor$2f$components$2f$QAPanel$2e$module$2e$css__$5b$app$2d$ssr$5d$__$28$css__module$29$__["default"].emptyState,
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                        children: 'Click "Run QA Checks" to analyze this creative'
                    }, void 0, false, {
                        fileName: "[project]/src/app/ads/editor/components/QAPanel.tsx",
                        lineNumber: 56,
                        columnNumber: 11
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                        onClick: runChecks,
                        className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ads$2f$editor$2f$components$2f$QAPanel$2e$module$2e$css__$5b$app$2d$ssr$5d$__$28$css__module$29$__["default"].runButton,
                        disabled: isRunning,
                        children: isRunning ? 'Running...' : 'Run QA Checks'
                    }, void 0, false, {
                        fileName: "[project]/src/app/ads/editor/components/QAPanel.tsx",
                        lineNumber: 57,
                        columnNumber: 11
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/src/app/ads/editor/components/QAPanel.tsx",
                lineNumber: 55,
                columnNumber: 9
            }, this)
        }, void 0, false, {
            fileName: "[project]/src/app/ads/editor/components/QAPanel.tsx",
            lineNumber: 54,
            columnNumber: 7
        }, this);
    }
    if (!result) {
        return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ads$2f$editor$2f$components$2f$QAPanel$2e$module$2e$css__$5b$app$2d$ssr$5d$__$28$css__module$29$__["default"].container,
            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ads$2f$editor$2f$components$2f$QAPanel$2e$module$2e$css__$5b$app$2d$ssr$5d$__$28$css__module$29$__["default"].loading,
                children: "Running QA checks..."
            }, void 0, false, {
                fileName: "[project]/src/app/ads/editor/components/QAPanel.tsx",
                lineNumber: 68,
                columnNumber: 9
            }, this)
        }, void 0, false, {
            fileName: "[project]/src/app/ads/editor/components/QAPanel.tsx",
            lineNumber: 67,
            columnNumber: 7
        }, this);
    }
    const summary = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$creativeQA$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["getQASummary"])(result);
    const hasErrors = summary.errorCount > 0;
    const hasWarnings = summary.warningCount > 0;
    const hasIssues = summary.totalIssues > 0;
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ads$2f$editor$2f$components$2f$QAPanel$2e$module$2e$css__$5b$app$2d$ssr$5d$__$28$css__module$29$__["default"].container,
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: `${__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ads$2f$editor$2f$components$2f$QAPanel$2e$module$2e$css__$5b$app$2d$ssr$5d$__$28$css__module$29$__["default"].header} ${hasErrors ? __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ads$2f$editor$2f$components$2f$QAPanel$2e$module$2e$css__$5b$app$2d$ssr$5d$__$28$css__module$29$__["default"].headerError : hasWarnings ? __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ads$2f$editor$2f$components$2f$QAPanel$2e$module$2e$css__$5b$app$2d$ssr$5d$__$28$css__module$29$__["default"].headerWarning : __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ads$2f$editor$2f$components$2f$QAPanel$2e$module$2e$css__$5b$app$2d$ssr$5d$__$28$css__module$29$__["default"].headerSuccess}`,
                onClick: ()=>setIsExpanded(!isExpanded),
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ads$2f$editor$2f$components$2f$QAPanel$2e$module$2e$css__$5b$app$2d$ssr$5d$__$28$css__module$29$__["default"].headerLeft,
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ads$2f$editor$2f$components$2f$QAPanel$2e$module$2e$css__$5b$app$2d$ssr$5d$__$28$css__module$29$__["default"].scoreCircle,
                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                    className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ads$2f$editor$2f$components$2f$QAPanel$2e$module$2e$css__$5b$app$2d$ssr$5d$__$28$css__module$29$__["default"].scoreNumber,
                                    children: result.score
                                }, void 0, false, {
                                    fileName: "[project]/src/app/ads/editor/components/QAPanel.tsx",
                                    lineNumber: 87,
                                    columnNumber: 13
                                }, this)
                            }, void 0, false, {
                                fileName: "[project]/src/app/ads/editor/components/QAPanel.tsx",
                                lineNumber: 86,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ads$2f$editor$2f$components$2f$QAPanel$2e$module$2e$css__$5b$app$2d$ssr$5d$__$28$css__module$29$__["default"].headerInfo,
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
                                        className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ads$2f$editor$2f$components$2f$QAPanel$2e$module$2e$css__$5b$app$2d$ssr$5d$__$28$css__module$29$__["default"].headerTitle,
                                        children: hasErrors ? 'Issues Found' : hasWarnings ? 'Warnings' : 'Looks Good!'
                                    }, void 0, false, {
                                        fileName: "[project]/src/app/ads/editor/components/QAPanel.tsx",
                                        lineNumber: 90,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                        className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ads$2f$editor$2f$components$2f$QAPanel$2e$module$2e$css__$5b$app$2d$ssr$5d$__$28$css__module$29$__["default"].headerSubtitle,
                                        children: [
                                            summary.passedChecks,
                                            "/",
                                            summary.totalChecks,
                                            " checks passed",
                                            hasIssues && ` • ${summary.totalIssues} issue${summary.totalIssues > 1 ? 's' : ''}`
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/src/app/ads/editor/components/QAPanel.tsx",
                                        lineNumber: 93,
                                        columnNumber: 13
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/app/ads/editor/components/QAPanel.tsx",
                                lineNumber: 89,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/app/ads/editor/components/QAPanel.tsx",
                        lineNumber: 85,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ads$2f$editor$2f$components$2f$QAPanel$2e$module$2e$css__$5b$app$2d$ssr$5d$__$28$css__module$29$__["default"].headerRight,
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ads$2f$editor$2f$components$2f$QAPanel$2e$module$2e$css__$5b$app$2d$ssr$5d$__$28$css__module$29$__["default"].refreshButton,
                                onClick: runChecks,
                                disabled: isRunning,
                                children: isRunning ? '⏳' : '🔄'
                            }, void 0, false, {
                                fileName: "[project]/src/app/ads/editor/components/QAPanel.tsx",
                                lineNumber: 100,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ads$2f$editor$2f$components$2f$QAPanel$2e$module$2e$css__$5b$app$2d$ssr$5d$__$28$css__module$29$__["default"].expandIcon,
                                children: isExpanded ? '▼' : '▶'
                            }, void 0, false, {
                                fileName: "[project]/src/app/ads/editor/components/QAPanel.tsx",
                                lineNumber: 103,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/app/ads/editor/components/QAPanel.tsx",
                        lineNumber: 99,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/src/app/ads/editor/components/QAPanel.tsx",
                lineNumber: 81,
                columnNumber: 7
            }, this),
            isExpanded && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ads$2f$editor$2f$components$2f$QAPanel$2e$module$2e$css__$5b$app$2d$ssr$5d$__$28$css__module$29$__["default"].content,
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ads$2f$editor$2f$components$2f$QAPanel$2e$module$2e$css__$5b$app$2d$ssr$5d$__$28$css__module$29$__["default"].stats,
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ads$2f$editor$2f$components$2f$QAPanel$2e$module$2e$css__$5b$app$2d$ssr$5d$__$28$css__module$29$__["default"].stat,
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ads$2f$editor$2f$components$2f$QAPanel$2e$module$2e$css__$5b$app$2d$ssr$5d$__$28$css__module$29$__["default"].statLabel,
                                        children: "Errors"
                                    }, void 0, false, {
                                        fileName: "[project]/src/app/ads/editor/components/QAPanel.tsx",
                                        lineNumber: 113,
                                        columnNumber: 15
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        className: `${__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ads$2f$editor$2f$components$2f$QAPanel$2e$module$2e$css__$5b$app$2d$ssr$5d$__$28$css__module$29$__["default"].statValue} ${__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ads$2f$editor$2f$components$2f$QAPanel$2e$module$2e$css__$5b$app$2d$ssr$5d$__$28$css__module$29$__["default"].statError}`,
                                        children: summary.errorCount
                                    }, void 0, false, {
                                        fileName: "[project]/src/app/ads/editor/components/QAPanel.tsx",
                                        lineNumber: 114,
                                        columnNumber: 15
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/app/ads/editor/components/QAPanel.tsx",
                                lineNumber: 112,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ads$2f$editor$2f$components$2f$QAPanel$2e$module$2e$css__$5b$app$2d$ssr$5d$__$28$css__module$29$__["default"].stat,
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ads$2f$editor$2f$components$2f$QAPanel$2e$module$2e$css__$5b$app$2d$ssr$5d$__$28$css__module$29$__["default"].statLabel,
                                        children: "Warnings"
                                    }, void 0, false, {
                                        fileName: "[project]/src/app/ads/editor/components/QAPanel.tsx",
                                        lineNumber: 119,
                                        columnNumber: 15
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        className: `${__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ads$2f$editor$2f$components$2f$QAPanel$2e$module$2e$css__$5b$app$2d$ssr$5d$__$28$css__module$29$__["default"].statValue} ${__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ads$2f$editor$2f$components$2f$QAPanel$2e$module$2e$css__$5b$app$2d$ssr$5d$__$28$css__module$29$__["default"].statWarning}`,
                                        children: summary.warningCount
                                    }, void 0, false, {
                                        fileName: "[project]/src/app/ads/editor/components/QAPanel.tsx",
                                        lineNumber: 120,
                                        columnNumber: 15
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/app/ads/editor/components/QAPanel.tsx",
                                lineNumber: 118,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ads$2f$editor$2f$components$2f$QAPanel$2e$module$2e$css__$5b$app$2d$ssr$5d$__$28$css__module$29$__["default"].stat,
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ads$2f$editor$2f$components$2f$QAPanel$2e$module$2e$css__$5b$app$2d$ssr$5d$__$28$css__module$29$__["default"].statLabel,
                                        children: "Info"
                                    }, void 0, false, {
                                        fileName: "[project]/src/app/ads/editor/components/QAPanel.tsx",
                                        lineNumber: 125,
                                        columnNumber: 15
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        className: `${__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ads$2f$editor$2f$components$2f$QAPanel$2e$module$2e$css__$5b$app$2d$ssr$5d$__$28$css__module$29$__["default"].statValue} ${__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ads$2f$editor$2f$components$2f$QAPanel$2e$module$2e$css__$5b$app$2d$ssr$5d$__$28$css__module$29$__["default"].statInfo}`,
                                        children: summary.infoCount
                                    }, void 0, false, {
                                        fileName: "[project]/src/app/ads/editor/components/QAPanel.tsx",
                                        lineNumber: 126,
                                        columnNumber: 15
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/app/ads/editor/components/QAPanel.tsx",
                                lineNumber: 124,
                                columnNumber: 13
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/app/ads/editor/components/QAPanel.tsx",
                        lineNumber: 111,
                        columnNumber: 11
                    }, this),
                    result.issues.length > 0 ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ads$2f$editor$2f$components$2f$QAPanel$2e$module$2e$css__$5b$app$2d$ssr$5d$__$28$css__module$29$__["default"].issues,
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("h4", {
                                className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ads$2f$editor$2f$components$2f$QAPanel$2e$module$2e$css__$5b$app$2d$ssr$5d$__$28$css__module$29$__["default"].issuesTitle,
                                children: "Issues"
                            }, void 0, false, {
                                fileName: "[project]/src/app/ads/editor/components/QAPanel.tsx",
                                lineNumber: 135,
                                columnNumber: 15
                            }, this),
                            result.issues.map((issue)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(IssueCard, {
                                    issue: issue
                                }, issue.id, false, {
                                    fileName: "[project]/src/app/ads/editor/components/QAPanel.tsx",
                                    lineNumber: 137,
                                    columnNumber: 17
                                }, this))
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/app/ads/editor/components/QAPanel.tsx",
                        lineNumber: 134,
                        columnNumber: 13
                    }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ads$2f$editor$2f$components$2f$QAPanel$2e$module$2e$css__$5b$app$2d$ssr$5d$__$28$css__module$29$__["default"].noIssues,
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ads$2f$editor$2f$components$2f$QAPanel$2e$module$2e$css__$5b$app$2d$ssr$5d$__$28$css__module$29$__["default"].successIcon,
                                children: "✅"
                            }, void 0, false, {
                                fileName: "[project]/src/app/ads/editor/components/QAPanel.tsx",
                                lineNumber: 142,
                                columnNumber: 15
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                children: "No issues found! This creative meets all quality standards."
                            }, void 0, false, {
                                fileName: "[project]/src/app/ads/editor/components/QAPanel.tsx",
                                lineNumber: 143,
                                columnNumber: 15
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/app/ads/editor/components/QAPanel.tsx",
                        lineNumber: 141,
                        columnNumber: 13
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ads$2f$editor$2f$components$2f$QAPanel$2e$module$2e$css__$5b$app$2d$ssr$5d$__$28$css__module$29$__["default"].checks,
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("h4", {
                                className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ads$2f$editor$2f$components$2f$QAPanel$2e$module$2e$css__$5b$app$2d$ssr$5d$__$28$css__module$29$__["default"].checksTitle,
                                children: "Checks Performed"
                            }, void 0, false, {
                                fileName: "[project]/src/app/ads/editor/components/QAPanel.tsx",
                                lineNumber: 149,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ads$2f$editor$2f$components$2f$QAPanel$2e$module$2e$css__$5b$app$2d$ssr$5d$__$28$css__module$29$__["default"].checksList,
                                children: result.checks.map((check, index)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ads$2f$editor$2f$components$2f$QAPanel$2e$module$2e$css__$5b$app$2d$ssr$5d$__$28$css__module$29$__["default"].checkItem,
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ads$2f$editor$2f$components$2f$QAPanel$2e$module$2e$css__$5b$app$2d$ssr$5d$__$28$css__module$29$__["default"].checkIcon,
                                                children: check.passed ? '✅' : '⚠️'
                                            }, void 0, false, {
                                                fileName: "[project]/src/app/ads/editor/components/QAPanel.tsx",
                                                lineNumber: 153,
                                                columnNumber: 19
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ads$2f$editor$2f$components$2f$QAPanel$2e$module$2e$css__$5b$app$2d$ssr$5d$__$28$css__module$29$__["default"].checkName,
                                                children: check.name
                                            }, void 0, false, {
                                                fileName: "[project]/src/app/ads/editor/components/QAPanel.tsx",
                                                lineNumber: 154,
                                                columnNumber: 19
                                            }, this),
                                            check.duration !== undefined && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ads$2f$editor$2f$components$2f$QAPanel$2e$module$2e$css__$5b$app$2d$ssr$5d$__$28$css__module$29$__["default"].checkDuration,
                                                children: [
                                                    check.duration,
                                                    "ms"
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/src/app/ads/editor/components/QAPanel.tsx",
                                                lineNumber: 156,
                                                columnNumber: 21
                                            }, this)
                                        ]
                                    }, index, true, {
                                        fileName: "[project]/src/app/ads/editor/components/QAPanel.tsx",
                                        lineNumber: 152,
                                        columnNumber: 17
                                    }, this))
                            }, void 0, false, {
                                fileName: "[project]/src/app/ads/editor/components/QAPanel.tsx",
                                lineNumber: 150,
                                columnNumber: 13
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/app/ads/editor/components/QAPanel.tsx",
                        lineNumber: 148,
                        columnNumber: 11
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/src/app/ads/editor/components/QAPanel.tsx",
                lineNumber: 109,
                columnNumber: 9
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/src/app/ads/editor/components/QAPanel.tsx",
        lineNumber: 79,
        columnNumber: 5
    }, this);
}
/**
 * Issue Card Component
 */ function IssueCard({ issue }) {
    const [isExpanded, setIsExpanded] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(false);
    const severityColor = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$creativeQA$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["getSeverityColor"])(issue.severity);
    const severityIcon = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$creativeQA$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["getSeverityIcon"])(issue.severity);
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ads$2f$editor$2f$components$2f$QAPanel$2e$module$2e$css__$5b$app$2d$ssr$5d$__$28$css__module$29$__["default"].issueCard,
        style: {
            borderLeftColor: severityColor
        },
        onClick: ()=>setIsExpanded(!isExpanded),
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ads$2f$editor$2f$components$2f$QAPanel$2e$module$2e$css__$5b$app$2d$ssr$5d$__$28$css__module$29$__["default"].issueHeader,
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ads$2f$editor$2f$components$2f$QAPanel$2e$module$2e$css__$5b$app$2d$ssr$5d$__$28$css__module$29$__["default"].issueHeaderLeft,
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ads$2f$editor$2f$components$2f$QAPanel$2e$module$2e$css__$5b$app$2d$ssr$5d$__$28$css__module$29$__["default"].issueIcon,
                                children: severityIcon
                            }, void 0, false, {
                                fileName: "[project]/src/app/ads/editor/components/QAPanel.tsx",
                                lineNumber: 184,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ads$2f$editor$2f$components$2f$QAPanel$2e$module$2e$css__$5b$app$2d$ssr$5d$__$28$css__module$29$__["default"].issueInfo,
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                        className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ads$2f$editor$2f$components$2f$QAPanel$2e$module$2e$css__$5b$app$2d$ssr$5d$__$28$css__module$29$__["default"].issueMessage,
                                        children: issue.message
                                    }, void 0, false, {
                                        fileName: "[project]/src/app/ads/editor/components/QAPanel.tsx",
                                        lineNumber: 186,
                                        columnNumber: 13
                                    }, this),
                                    issue.field && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ads$2f$editor$2f$components$2f$QAPanel$2e$module$2e$css__$5b$app$2d$ssr$5d$__$28$css__module$29$__["default"].issueField,
                                        children: [
                                            "Field: ",
                                            issue.field
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/src/app/ads/editor/components/QAPanel.tsx",
                                        lineNumber: 187,
                                        columnNumber: 29
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/app/ads/editor/components/QAPanel.tsx",
                                lineNumber: 185,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/app/ads/editor/components/QAPanel.tsx",
                        lineNumber: 183,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                        className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ads$2f$editor$2f$components$2f$QAPanel$2e$module$2e$css__$5b$app$2d$ssr$5d$__$28$css__module$29$__["default"].issueExpandIcon,
                        children: isExpanded ? '▼' : '▶'
                    }, void 0, false, {
                        fileName: "[project]/src/app/ads/editor/components/QAPanel.tsx",
                        lineNumber: 190,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/src/app/ads/editor/components/QAPanel.tsx",
                lineNumber: 182,
                columnNumber: 7
            }, this),
            isExpanded && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ads$2f$editor$2f$components$2f$QAPanel$2e$module$2e$css__$5b$app$2d$ssr$5d$__$28$css__module$29$__["default"].issueDetails,
                children: [
                    issue.details && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ads$2f$editor$2f$components$2f$QAPanel$2e$module$2e$css__$5b$app$2d$ssr$5d$__$28$css__module$29$__["default"].issueDetail,
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("strong", {
                                children: "Details:"
                            }, void 0, false, {
                                fileName: "[project]/src/app/ads/editor/components/QAPanel.tsx",
                                lineNumber: 197,
                                columnNumber: 15
                            }, this),
                            " ",
                            issue.details
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/app/ads/editor/components/QAPanel.tsx",
                        lineNumber: 196,
                        columnNumber: 13
                    }, this),
                    issue.value !== undefined && issue.threshold !== undefined && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ads$2f$editor$2f$components$2f$QAPanel$2e$module$2e$css__$5b$app$2d$ssr$5d$__$28$css__module$29$__["default"].issueDetail,
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("strong", {
                                children: "Current Value:"
                            }, void 0, false, {
                                fileName: "[project]/src/app/ads/editor/components/QAPanel.tsx",
                                lineNumber: 203,
                                columnNumber: 15
                            }, this),
                            " ",
                            issue.value,
                            " ",
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("br", {}, void 0, false, {
                                fileName: "[project]/src/app/ads/editor/components/QAPanel.tsx",
                                lineNumber: 203,
                                columnNumber: 61
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("strong", {
                                children: "Required:"
                            }, void 0, false, {
                                fileName: "[project]/src/app/ads/editor/components/QAPanel.tsx",
                                lineNumber: 204,
                                columnNumber: 15
                            }, this),
                            " ",
                            issue.threshold
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/app/ads/editor/components/QAPanel.tsx",
                        lineNumber: 202,
                        columnNumber: 13
                    }, this),
                    issue.suggestion && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ads$2f$editor$2f$components$2f$QAPanel$2e$module$2e$css__$5b$app$2d$ssr$5d$__$28$css__module$29$__["default"].issueSuggestion,
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ads$2f$editor$2f$components$2f$QAPanel$2e$module$2e$css__$5b$app$2d$ssr$5d$__$28$css__module$29$__["default"].suggestionIcon,
                                children: "💡"
                            }, void 0, false, {
                                fileName: "[project]/src/app/ads/editor/components/QAPanel.tsx",
                                lineNumber: 210,
                                columnNumber: 15
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                children: issue.suggestion
                            }, void 0, false, {
                                fileName: "[project]/src/app/ads/editor/components/QAPanel.tsx",
                                lineNumber: 211,
                                columnNumber: 15
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/app/ads/editor/components/QAPanel.tsx",
                        lineNumber: 209,
                        columnNumber: 13
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/src/app/ads/editor/components/QAPanel.tsx",
                lineNumber: 194,
                columnNumber: 9
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/src/app/ads/editor/components/QAPanel.tsx",
        lineNumber: 177,
        columnNumber: 5
    }, this);
}
}),
"[project]/src/app/ads/editor/page.tsx [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>AdEditorPage
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$types$2f$adTemplate$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/types/adTemplate.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ads$2f$editor$2f$components$2f$AdEditorForm$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/app/ads/editor/components/AdEditorForm.tsx [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ads$2f$editor$2f$components$2f$AdPreview$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/app/ads/editor/components/AdPreview.tsx [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ads$2f$editor$2f$components$2f$QAPanel$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/app/ads/editor/components/QAPanel.tsx [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ads$2f$editor$2f$editor$2e$module$2e$css__$5b$app$2d$ssr$5d$__$28$css__module$29$__ = __turbopack_context__.i("[project]/src/app/ads/editor/editor.module.css [app-ssr] (css module)");
'use client';
;
;
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
    const [template, setTemplate] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(null);
    const [brandKit, setBrandKit] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(null);
    const [loading, setLoading] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(true);
    const [selectedTemplate, setSelectedTemplate] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])('example-hero-ad');
    const [selectedBrandKit, setSelectedBrandKit] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])('tech-startup-001');
    // Load initial template
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEffect"])(()=>{
        loadTemplate(selectedTemplate);
    }, [
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
            dimensions: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$types$2f$adTemplate$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["AD_SIZES"].INSTAGRAM_SQUARE,
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
        return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ads$2f$editor$2f$editor$2e$module$2e$css__$5b$app$2d$ssr$5d$__$28$css__module$29$__["default"].container,
            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ads$2f$editor$2f$editor$2e$module$2e$css__$5b$app$2d$ssr$5d$__$28$css__module$29$__["default"].loading,
                children: "Loading..."
            }, void 0, false, {
                fileName: "[project]/src/app/ads/editor/page.tsx",
                lineNumber: 150,
                columnNumber: 9
            }, this)
        }, void 0, false, {
            fileName: "[project]/src/app/ads/editor/page.tsx",
            lineNumber: 149,
            columnNumber: 7
        }, this);
    }
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ads$2f$editor$2f$editor$2e$module$2e$css__$5b$app$2d$ssr$5d$__$28$css__module$29$__["default"].container,
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("header", {
                className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ads$2f$editor$2f$editor$2e$module$2e$css__$5b$app$2d$ssr$5d$__$28$css__module$29$__["default"].header,
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ads$2f$editor$2f$editor$2e$module$2e$css__$5b$app$2d$ssr$5d$__$28$css__module$29$__["default"].headerContent,
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("h1", {
                            className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ads$2f$editor$2f$editor$2e$module$2e$css__$5b$app$2d$ssr$5d$__$28$css__module$29$__["default"].title,
                            children: "Ad Editor"
                        }, void 0, false, {
                            fileName: "[project]/src/app/ads/editor/page.tsx",
                            lineNumber: 160,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ads$2f$editor$2f$editor$2e$module$2e$css__$5b$app$2d$ssr$5d$__$28$css__module$29$__["default"].actions,
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                    onClick: createNewTemplate,
                                    className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ads$2f$editor$2f$editor$2e$module$2e$css__$5b$app$2d$ssr$5d$__$28$css__module$29$__["default"].button,
                                    children: "New Template"
                                }, void 0, false, {
                                    fileName: "[project]/src/app/ads/editor/page.tsx",
                                    lineNumber: 162,
                                    columnNumber: 13
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                    onClick: exportTemplate,
                                    className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ads$2f$editor$2f$editor$2e$module$2e$css__$5b$app$2d$ssr$5d$__$28$css__module$29$__["default"].button,
                                    children: "Export JSON"
                                }, void 0, false, {
                                    fileName: "[project]/src/app/ads/editor/page.tsx",
                                    lineNumber: 165,
                                    columnNumber: 13
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/src/app/ads/editor/page.tsx",
                            lineNumber: 161,
                            columnNumber: 11
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/src/app/ads/editor/page.tsx",
                    lineNumber: 159,
                    columnNumber: 9
                }, this)
            }, void 0, false, {
                fileName: "[project]/src/app/ads/editor/page.tsx",
                lineNumber: 158,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ads$2f$editor$2f$editor$2e$module$2e$css__$5b$app$2d$ssr$5d$__$28$css__module$29$__["default"].editor,
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("aside", {
                        className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ads$2f$editor$2f$editor$2e$module$2e$css__$5b$app$2d$ssr$5d$__$28$css__module$29$__["default"].sidebar,
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ads$2f$editor$2f$editor$2e$module$2e$css__$5b$app$2d$ssr$5d$__$28$css__module$29$__["default"].sidebarContent,
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("section", {
                                    className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ads$2f$editor$2f$editor$2e$module$2e$css__$5b$app$2d$ssr$5d$__$28$css__module$29$__["default"].section,
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                                            className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ads$2f$editor$2f$editor$2e$module$2e$css__$5b$app$2d$ssr$5d$__$28$css__module$29$__["default"].sectionTitle,
                                            children: "Template"
                                        }, void 0, false, {
                                            fileName: "[project]/src/app/ads/editor/page.tsx",
                                            lineNumber: 179,
                                            columnNumber: 15
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("select", {
                                            value: selectedTemplate,
                                            onChange: (e)=>setSelectedTemplate(e.target.value),
                                            className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ads$2f$editor$2f$editor$2e$module$2e$css__$5b$app$2d$ssr$5d$__$28$css__module$29$__["default"].select,
                                            children: STARTER_TEMPLATES.map((t)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                                    value: t,
                                                    children: t.replace('example-', '').replace(/-/g, ' ')
                                                }, t, false, {
                                                    fileName: "[project]/src/app/ads/editor/page.tsx",
                                                    lineNumber: 186,
                                                    columnNumber: 19
                                                }, this))
                                        }, void 0, false, {
                                            fileName: "[project]/src/app/ads/editor/page.tsx",
                                            lineNumber: 180,
                                            columnNumber: 15
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/src/app/ads/editor/page.tsx",
                                    lineNumber: 178,
                                    columnNumber: 13
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("section", {
                                    className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ads$2f$editor$2f$editor$2e$module$2e$css__$5b$app$2d$ssr$5d$__$28$css__module$29$__["default"].section,
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                                            className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ads$2f$editor$2f$editor$2e$module$2e$css__$5b$app$2d$ssr$5d$__$28$css__module$29$__["default"].sectionTitle,
                                            children: "Brand Kit"
                                        }, void 0, false, {
                                            fileName: "[project]/src/app/ads/editor/page.tsx",
                                            lineNumber: 195,
                                            columnNumber: 15
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("select", {
                                            value: selectedBrandKit,
                                            onChange: (e)=>{
                                                setSelectedBrandKit(e.target.value);
                                                loadBrandKit(e.target.value);
                                            },
                                            className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ads$2f$editor$2f$editor$2e$module$2e$css__$5b$app$2d$ssr$5d$__$28$css__module$29$__["default"].select,
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                                    value: "",
                                                    children: "None"
                                                }, void 0, false, {
                                                    fileName: "[project]/src/app/ads/editor/page.tsx",
                                                    lineNumber: 204,
                                                    columnNumber: 17
                                                }, this),
                                                BRAND_KITS.map((b)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                                        value: b,
                                                        children: b.replace(/-\d+$/, '').replace(/-/g, ' ')
                                                    }, b, false, {
                                                        fileName: "[project]/src/app/ads/editor/page.tsx",
                                                        lineNumber: 206,
                                                        columnNumber: 19
                                                    }, this))
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/src/app/ads/editor/page.tsx",
                                            lineNumber: 196,
                                            columnNumber: 15
                                        }, this),
                                        brandKit && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                            onClick: applyBrandKit,
                                            className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ads$2f$editor$2f$editor$2e$module$2e$css__$5b$app$2d$ssr$5d$__$28$css__module$29$__["default"].buttonSmall,
                                            children: "Apply Brand"
                                        }, void 0, false, {
                                            fileName: "[project]/src/app/ads/editor/page.tsx",
                                            lineNumber: 212,
                                            columnNumber: 17
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/src/app/ads/editor/page.tsx",
                                    lineNumber: 194,
                                    columnNumber: 13
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ads$2f$editor$2f$components$2f$AdEditorForm$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"], {
                                    template: template,
                                    onUpdate: updateTemplate
                                }, void 0, false, {
                                    fileName: "[project]/src/app/ads/editor/page.tsx",
                                    lineNumber: 219,
                                    columnNumber: 13
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("section", {
                                    className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ads$2f$editor$2f$editor$2e$module$2e$css__$5b$app$2d$ssr$5d$__$28$css__module$29$__["default"].section,
                                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ads$2f$editor$2f$components$2f$QAPanel$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"], {
                                        template: template,
                                        autoCheck: true
                                    }, void 0, false, {
                                        fileName: "[project]/src/app/ads/editor/page.tsx",
                                        lineNumber: 223,
                                        columnNumber: 15
                                    }, this)
                                }, void 0, false, {
                                    fileName: "[project]/src/app/ads/editor/page.tsx",
                                    lineNumber: 222,
                                    columnNumber: 13
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/src/app/ads/editor/page.tsx",
                            lineNumber: 176,
                            columnNumber: 11
                        }, this)
                    }, void 0, false, {
                        fileName: "[project]/src/app/ads/editor/page.tsx",
                        lineNumber: 175,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("main", {
                        className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ads$2f$editor$2f$editor$2e$module$2e$css__$5b$app$2d$ssr$5d$__$28$css__module$29$__["default"].preview,
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ads$2f$editor$2f$components$2f$AdPreview$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"], {
                            template: template
                        }, void 0, false, {
                            fileName: "[project]/src/app/ads/editor/page.tsx",
                            lineNumber: 230,
                            columnNumber: 11
                        }, this)
                    }, void 0, false, {
                        fileName: "[project]/src/app/ads/editor/page.tsx",
                        lineNumber: 229,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/src/app/ads/editor/page.tsx",
                lineNumber: 173,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/src/app/ads/editor/page.tsx",
        lineNumber: 156,
        columnNumber: 5
    }, this);
}
}),
];

//# sourceMappingURL=%5Broot-of-the-server%5D__4bfe1133._.js.map