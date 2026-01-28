(globalThis.TURBOPACK || (globalThis.TURBOPACK = [])).push([typeof document === "object" ? document.currentScript : undefined,
"[project]/src/types/adTemplate.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

/**
 * Ad Template Types - ADS-001
 * Type definitions for static ad templates using Remotion Still API
 */ /**
 * Ad dimensions (standard sizes)
 */ __turbopack_context__.s([
    "AD_SIZES",
    ()=>AD_SIZES,
    "defaultAdStyle",
    ()=>defaultAdStyle,
    "isAdTemplate",
    ()=>isAdTemplate,
    "mergeAdStyle",
    ()=>mergeAdStyle
]);
const AD_SIZES = {
    // Social Media
    INSTAGRAM_SQUARE: {
        width: 1080,
        height: 1080,
        name: 'Instagram Square',
        platform: 'Instagram'
    },
    INSTAGRAM_STORY: {
        width: 1080,
        height: 1920,
        name: 'Instagram Story',
        platform: 'Instagram'
    },
    FACEBOOK_FEED: {
        width: 1200,
        height: 628,
        name: 'Facebook Feed',
        platform: 'Facebook'
    },
    FACEBOOK_SQUARE: {
        width: 1080,
        height: 1080,
        name: 'Facebook Square',
        platform: 'Facebook'
    },
    TWITTER_POST: {
        width: 1200,
        height: 675,
        name: 'Twitter Post',
        platform: 'Twitter'
    },
    // Display Ads
    LEADERBOARD: {
        width: 728,
        height: 90,
        name: 'Leaderboard',
        platform: 'Display'
    },
    MEDIUM_RECTANGLE: {
        width: 300,
        height: 250,
        name: 'Medium Rectangle',
        platform: 'Display'
    },
    LARGE_RECTANGLE: {
        width: 336,
        height: 280,
        name: 'Large Rectangle',
        platform: 'Display'
    },
    WIDE_SKYSCRAPER: {
        width: 160,
        height: 600,
        name: 'Wide Skyscraper',
        platform: 'Display'
    },
    HALF_PAGE: {
        width: 300,
        height: 600,
        name: 'Half Page',
        platform: 'Display'
    },
    // LinkedIn
    LINKEDIN_SQUARE: {
        width: 1200,
        height: 1200,
        name: 'LinkedIn Square',
        platform: 'LinkedIn'
    },
    LINKEDIN_HORIZONTAL: {
        width: 1200,
        height: 627,
        name: 'LinkedIn Horizontal',
        platform: 'LinkedIn'
    },
    // Pinterest
    PINTEREST_STANDARD: {
        width: 1000,
        height: 1500,
        name: 'Pinterest Standard',
        platform: 'Pinterest'
    },
    PINTEREST_SQUARE: {
        width: 1000,
        height: 1000,
        name: 'Pinterest Square',
        platform: 'Pinterest'
    }
};
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
  "button": "editor-module__I1eW_q__button",
  "buttonSmall": "editor-module__I1eW_q__buttonSmall",
  "colorInput": "editor-module__I1eW_q__colorInput",
  "container": "editor-module__I1eW_q__container",
  "editor": "editor-module__I1eW_q__editor",
  "formGroup": "editor-module__I1eW_q__formGroup",
  "header": "editor-module__I1eW_q__header",
  "headerContent": "editor-module__I1eW_q__headerContent",
  "input": "editor-module__I1eW_q__input",
  "label": "editor-module__I1eW_q__label",
  "loading": "editor-module__I1eW_q__loading",
  "numberInput": "editor-module__I1eW_q__numberInput",
  "preview": "editor-module__I1eW_q__preview",
  "section": "editor-module__I1eW_q__section",
  "sectionTitle": "editor-module__I1eW_q__sectionTitle",
  "select": "editor-module__I1eW_q__select",
  "sidebar": "editor-module__I1eW_q__sidebar",
  "sidebarContent": "editor-module__I1eW_q__sidebarContent",
  "textarea": "editor-module__I1eW_q__textarea",
  "title": "editor-module__I1eW_q__title",
});
}),
"[project]/src/app/ads/editor/components/AdEditorForm.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>AdEditorForm
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$types$2f$adTemplate$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/types/adTemplate.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ads$2f$editor$2f$editor$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__ = __turbopack_context__.i("[project]/src/app/ads/editor/editor.module.css [app-client] (css module)");
'use client';
;
;
;
function AdEditorForm({ template, onUpdate }) {
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
                        lineNumber: 16,
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
                                lineNumber: 18,
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
                                        lineNumber: 24,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                        value: "split-horizontal",
                                        children: "Split Horizontal"
                                    }, void 0, false, {
                                        fileName: "[project]/src/app/ads/editor/components/AdEditorForm.tsx",
                                        lineNumber: 25,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                        value: "split-vertical",
                                        children: "Split Vertical"
                                    }, void 0, false, {
                                        fileName: "[project]/src/app/ads/editor/components/AdEditorForm.tsx",
                                        lineNumber: 26,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                        value: "text-only",
                                        children: "Text Only"
                                    }, void 0, false, {
                                        fileName: "[project]/src/app/ads/editor/components/AdEditorForm.tsx",
                                        lineNumber: 27,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                        value: "product-showcase",
                                        children: "Product Showcase"
                                    }, void 0, false, {
                                        fileName: "[project]/src/app/ads/editor/components/AdEditorForm.tsx",
                                        lineNumber: 28,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                        value: "quote",
                                        children: "Quote"
                                    }, void 0, false, {
                                        fileName: "[project]/src/app/ads/editor/components/AdEditorForm.tsx",
                                        lineNumber: 29,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                        value: "minimal",
                                        children: "Minimal"
                                    }, void 0, false, {
                                        fileName: "[project]/src/app/ads/editor/components/AdEditorForm.tsx",
                                        lineNumber: 30,
                                        columnNumber: 13
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/app/ads/editor/components/AdEditorForm.tsx",
                                lineNumber: 19,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/app/ads/editor/components/AdEditorForm.tsx",
                        lineNumber: 17,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ads$2f$editor$2f$editor$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].formGroup,
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ads$2f$editor$2f$editor$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].label,
                                children: "Size Preset"
                            }, void 0, false, {
                                fileName: "[project]/src/app/ads/editor/components/AdEditorForm.tsx",
                                lineNumber: 35,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("select", {
                                onChange: (e)=>{
                                    const size = __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$types$2f$adTemplate$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["AD_SIZES"][e.target.value];
                                    if (size) {
                                        onUpdate([
                                            'dimensions'
                                        ], size);
                                    }
                                },
                                className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ads$2f$editor$2f$editor$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].select,
                                value: Object.keys(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$types$2f$adTemplate$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["AD_SIZES"]).find((key)=>__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$types$2f$adTemplate$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["AD_SIZES"][key].width === template.dimensions.width && __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$types$2f$adTemplate$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["AD_SIZES"][key].height === template.dimensions.height),
                                children: Object.entries(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$types$2f$adTemplate$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["AD_SIZES"]).map(([key, size])=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                        value: key,
                                        children: [
                                            size.name,
                                            " (",
                                            size.width,
                                            "x",
                                            size.height,
                                            ")"
                                        ]
                                    }, key, true, {
                                        fileName: "[project]/src/app/ads/editor/components/AdEditorForm.tsx",
                                        lineNumber: 51,
                                        columnNumber: 15
                                    }, this))
                            }, void 0, false, {
                                fileName: "[project]/src/app/ads/editor/components/AdEditorForm.tsx",
                                lineNumber: 36,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/app/ads/editor/components/AdEditorForm.tsx",
                        lineNumber: 34,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/src/app/ads/editor/components/AdEditorForm.tsx",
                lineNumber: 15,
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
                        lineNumber: 61,
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
                                lineNumber: 63,
                                columnNumber: 11
                            }, this),
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
                                lineNumber: 64,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/app/ads/editor/components/AdEditorForm.tsx",
                        lineNumber: 62,
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
                                lineNumber: 74,
                                columnNumber: 11
                            }, this),
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
                                lineNumber: 75,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/app/ads/editor/components/AdEditorForm.tsx",
                        lineNumber: 73,
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
                                lineNumber: 85,
                                columnNumber: 13
                            }, this),
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
                                lineNumber: 86,
                                columnNumber: 13
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/app/ads/editor/components/AdEditorForm.tsx",
                        lineNumber: 84,
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
                                        lineNumber: 99,
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
                                        lineNumber: 100,
                                        columnNumber: 15
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/app/ads/editor/components/AdEditorForm.tsx",
                                lineNumber: 98,
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
                                        lineNumber: 109,
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
                                        lineNumber: 110,
                                        columnNumber: 15
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/app/ads/editor/components/AdEditorForm.tsx",
                                lineNumber: 108,
                                columnNumber: 13
                            }, this)
                        ]
                    }, void 0, true)
                ]
            }, void 0, true, {
                fileName: "[project]/src/app/ads/editor/components/AdEditorForm.tsx",
                lineNumber: 60,
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
                        lineNumber: 124,
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
                                lineNumber: 126,
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
                                lineNumber: 127,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/app/ads/editor/components/AdEditorForm.tsx",
                        lineNumber: 125,
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
                                lineNumber: 136,
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
                                lineNumber: 137,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/app/ads/editor/components/AdEditorForm.tsx",
                        lineNumber: 135,
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
                                lineNumber: 146,
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
                                lineNumber: 147,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/app/ads/editor/components/AdEditorForm.tsx",
                        lineNumber: 145,
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
                                        lineNumber: 158,
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
                                        lineNumber: 159,
                                        columnNumber: 15
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/app/ads/editor/components/AdEditorForm.tsx",
                                lineNumber: 157,
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
                                        lineNumber: 168,
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
                                        lineNumber: 169,
                                        columnNumber: 15
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/app/ads/editor/components/AdEditorForm.tsx",
                                lineNumber: 167,
                                columnNumber: 13
                            }, this)
                        ]
                    }, void 0, true)
                ]
            }, void 0, true, {
                fileName: "[project]/src/app/ads/editor/components/AdEditorForm.tsx",
                lineNumber: 123,
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
                        lineNumber: 182,
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
                                lineNumber: 184,
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
                                        lineNumber: 190,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                        value: "'Helvetica Neue', Helvetica, Arial, sans-serif",
                                        children: "Helvetica"
                                    }, void 0, false, {
                                        fileName: "[project]/src/app/ads/editor/components/AdEditorForm.tsx",
                                        lineNumber: 191,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                        value: "Georgia, serif",
                                        children: "Georgia"
                                    }, void 0, false, {
                                        fileName: "[project]/src/app/ads/editor/components/AdEditorForm.tsx",
                                        lineNumber: 192,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                        value: "'Courier New', monospace",
                                        children: "Courier New"
                                    }, void 0, false, {
                                        fileName: "[project]/src/app/ads/editor/components/AdEditorForm.tsx",
                                        lineNumber: 193,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                        value: "'Times New Roman', serif",
                                        children: "Times New Roman"
                                    }, void 0, false, {
                                        fileName: "[project]/src/app/ads/editor/components/AdEditorForm.tsx",
                                        lineNumber: 194,
                                        columnNumber: 13
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/app/ads/editor/components/AdEditorForm.tsx",
                                lineNumber: 185,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/app/ads/editor/components/AdEditorForm.tsx",
                        lineNumber: 183,
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
                                lineNumber: 199,
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
                                lineNumber: 200,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/app/ads/editor/components/AdEditorForm.tsx",
                        lineNumber: 198,
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
                                lineNumber: 211,
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
                                        lineNumber: 217,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                        value: "400",
                                        children: "Regular (400)"
                                    }, void 0, false, {
                                        fileName: "[project]/src/app/ads/editor/components/AdEditorForm.tsx",
                                        lineNumber: 218,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                        value: "500",
                                        children: "Medium (500)"
                                    }, void 0, false, {
                                        fileName: "[project]/src/app/ads/editor/components/AdEditorForm.tsx",
                                        lineNumber: 219,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                        value: "600",
                                        children: "Semibold (600)"
                                    }, void 0, false, {
                                        fileName: "[project]/src/app/ads/editor/components/AdEditorForm.tsx",
                                        lineNumber: 220,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                        value: "700",
                                        children: "Bold (700)"
                                    }, void 0, false, {
                                        fileName: "[project]/src/app/ads/editor/components/AdEditorForm.tsx",
                                        lineNumber: 221,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                        value: "800",
                                        children: "Extra Bold (800)"
                                    }, void 0, false, {
                                        fileName: "[project]/src/app/ads/editor/components/AdEditorForm.tsx",
                                        lineNumber: 222,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                        value: "900",
                                        children: "Black (900)"
                                    }, void 0, false, {
                                        fileName: "[project]/src/app/ads/editor/components/AdEditorForm.tsx",
                                        lineNumber: 223,
                                        columnNumber: 13
                                    }, this)
                                ]
                            }, void 0, true, {
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
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ads$2f$editor$2f$editor$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].formGroup,
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ads$2f$editor$2f$editor$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].label,
                                children: "Body Size"
                            }, void 0, false, {
                                fileName: "[project]/src/app/ads/editor/components/AdEditorForm.tsx",
                                lineNumber: 228,
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
                                lineNumber: 229,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/app/ads/editor/components/AdEditorForm.tsx",
                        lineNumber: 227,
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
                                lineNumber: 240,
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
                                        lineNumber: 246,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                        value: "400",
                                        children: "Regular (400)"
                                    }, void 0, false, {
                                        fileName: "[project]/src/app/ads/editor/components/AdEditorForm.tsx",
                                        lineNumber: 247,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                        value: "500",
                                        children: "Medium (500)"
                                    }, void 0, false, {
                                        fileName: "[project]/src/app/ads/editor/components/AdEditorForm.tsx",
                                        lineNumber: 248,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                        value: "600",
                                        children: "Semibold (600)"
                                    }, void 0, false, {
                                        fileName: "[project]/src/app/ads/editor/components/AdEditorForm.tsx",
                                        lineNumber: 249,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                        value: "700",
                                        children: "Bold (700)"
                                    }, void 0, false, {
                                        fileName: "[project]/src/app/ads/editor/components/AdEditorForm.tsx",
                                        lineNumber: 250,
                                        columnNumber: 13
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/app/ads/editor/components/AdEditorForm.tsx",
                                lineNumber: 241,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/app/ads/editor/components/AdEditorForm.tsx",
                        lineNumber: 239,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/src/app/ads/editor/components/AdEditorForm.tsx",
                lineNumber: 181,
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
                        lineNumber: 257,
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
                                lineNumber: 259,
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
                                lineNumber: 260,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/app/ads/editor/components/AdEditorForm.tsx",
                        lineNumber: 258,
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
                                lineNumber: 272,
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
                                lineNumber: 273,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/app/ads/editor/components/AdEditorForm.tsx",
                        lineNumber: 271,
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
                                lineNumber: 285,
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
                                lineNumber: 286,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/app/ads/editor/components/AdEditorForm.tsx",
                        lineNumber: 284,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/src/app/ads/editor/components/AdEditorForm.tsx",
                lineNumber: 256,
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
                        lineNumber: 299,
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
                                    lineNumber: 302,
                                    columnNumber: 13
                                }, this),
                                "Enable Shadow"
                            ]
                        }, void 0, true, {
                            fileName: "[project]/src/app/ads/editor/components/AdEditorForm.tsx",
                            lineNumber: 301,
                            columnNumber: 11
                        }, this)
                    }, void 0, false, {
                        fileName: "[project]/src/app/ads/editor/components/AdEditorForm.tsx",
                        lineNumber: 300,
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
                                lineNumber: 314,
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
                                lineNumber: 315,
                                columnNumber: 13
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/app/ads/editor/components/AdEditorForm.tsx",
                        lineNumber: 313,
                        columnNumber: 11
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/src/app/ads/editor/components/AdEditorForm.tsx",
                lineNumber: 298,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/src/app/ads/editor/components/AdEditorForm.tsx",
        lineNumber: 13,
        columnNumber: 5
    }, this);
}
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

//# sourceMappingURL=src_35255a65._.js.map