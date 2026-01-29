module.exports = [
"[externals]/next/dist/compiled/next-server/app-page-turbo.runtime.dev.js [external] (next/dist/compiled/next-server/app-page-turbo.runtime.dev.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/compiled/next-server/app-page-turbo.runtime.dev.js", () => require("next/dist/compiled/next-server/app-page-turbo.runtime.dev.js"));

module.exports = mod;
}),
"[project]/src/services/tracking.ts [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "tracking",
    ()=>tracking
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$posthog$2d$js$2f$dist$2f$module$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/posthog-js/dist/module.js [app-ssr] (ecmascript)");
;
class ClientTrackingService {
    initialized = false;
    enabled = false;
    constructor(){
        if ("TURBOPACK compile-time truthy", 1) {
            return;
        }
    }
    initialize(config) {
        if (this.initialized) {
            console.warn('Tracking service already initialized');
            return;
        }
        if (!config.apiKey) {
            console.warn('PostHog API key not provided. Tracking disabled.');
            this.enabled = false;
            return;
        }
        this.enabled = config.enabled !== false;
        if (!this.enabled) {
            console.info('Tracking is disabled');
            return;
        }
        try {
            __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$posthog$2d$js$2f$dist$2f$module$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"].init(config.apiKey, {
                api_host: config.host || 'https://us.i.posthog.com',
                loaded: (posthog)=>{
                    if ("TURBOPACK compile-time truthy", 1) {
                        posthog.debug();
                    }
                },
                capture_pageview: false,
                capture_pageleave: true,
                autocapture: false,
                persistence: 'localStorage+cookie'
            });
            this.initialized = true;
            console.info('PostHog tracking initialized');
        } catch (error) {
            console.error('Failed to initialize PostHog:', error);
            this.enabled = false;
        }
    }
    identify(userId, properties) {
        if (!this.isEnabled()) return;
        try {
            __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$posthog$2d$js$2f$dist$2f$module$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"].identify(userId, properties);
        } catch (error) {
            console.error('Failed to identify user:', error);
        }
    }
    track(event, properties) {
        if (!this.isEnabled()) {
            console.debug('Tracking disabled, skipping event:', event);
            return;
        }
        try {
            __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$posthog$2d$js$2f$dist$2f$module$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"].capture(event, properties);
        } catch (error) {
            console.error('Failed to track event:', error);
        }
    }
    page(name, properties) {
        if (!this.isEnabled()) return;
        try {
            __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$posthog$2d$js$2f$dist$2f$module$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"].capture('$pageview', {
                $current_url: window.location.href,
                page_name: name,
                ...properties
            });
        } catch (error) {
            console.error('Failed to track page view:', error);
        }
    }
    reset() {
        if (!this.isEnabled()) return;
        try {
            __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$posthog$2d$js$2f$dist$2f$module$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"].reset();
        } catch (error) {
            console.error('Failed to reset tracking:', error);
        }
    }
    isEnabled() {
        return this.initialized && this.enabled;
    }
}
const tracking = new ClientTrackingService();
}),
"[project]/src/services/retentionTracking.ts [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "getRetentionStats",
    ()=>getRetentionStats,
    "hasDiscoveredFeature",
    ()=>hasDiscoveredFeature,
    "resetRetentionTracking",
    ()=>resetRetentionTracking,
    "trackFeatureDiscovery",
    ()=>trackFeatureDiscovery,
    "trackReturnVisit",
    ()=>trackReturnVisit
]);
/**
 * Retention Event Tracking
 *
 * Tracks user retention and feature discovery events:
 * - return_visit: When users return to the platform
 * - feature_discovery: When users discover/use features for the first time
 */ var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$tracking$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/services/tracking.ts [app-ssr] (ecmascript)");
;
const STORAGE_KEY_PREFIX = 'retention_tracking_';
const LAST_VISIT_KEY = `${STORAGE_KEY_PREFIX}last_visit`;
const DISCOVERED_FEATURES_KEY = `${STORAGE_KEY_PREFIX}discovered_features`;
const VISIT_COUNT_KEY = `${STORAGE_KEY_PREFIX}visit_count`;
const FIRST_VISIT_KEY = `${STORAGE_KEY_PREFIX}first_visit`;
// Return visit threshold: 30 minutes (if they come back after 30 min, it's a new visit)
const RETURN_VISIT_THRESHOLD_MS = 30 * 60 * 1000; // 30 minutes
/**
 * Check if browser environment (not SSR)
 */ function isBrowser() {
    return ("TURBOPACK compile-time value", "undefined") !== 'undefined' && typeof localStorage !== 'undefined';
}
/**
 * Get data from localStorage
 */ function getLocalStorageItem(key) {
    if (!isBrowser()) return null;
    //TURBOPACK unreachable
    ;
}
/**
 * Set data in localStorage
 */ function setLocalStorageItem(key, value) {
    if (!isBrowser()) return;
    //TURBOPACK unreachable
    ;
}
/**
 * Get all retention data
 */ function getRetentionData() {
    const visitCount = parseInt(getLocalStorageItem(VISIT_COUNT_KEY) || '0', 10);
    const firstVisit = getLocalStorageItem(FIRST_VISIT_KEY) || new Date().toISOString();
    const lastVisit = getLocalStorageItem(LAST_VISIT_KEY) || '';
    const discoveredFeaturesRaw = getLocalStorageItem(DISCOVERED_FEATURES_KEY) || '[]';
    let discoveredFeatures = [];
    try {
        discoveredFeatures = JSON.parse(discoveredFeaturesRaw);
    } catch (error) {
        console.error('Failed to parse discovered features:', error);
        discoveredFeatures = [];
    }
    return {
        visitCount,
        firstVisit,
        lastVisit,
        discoveredFeatures
    };
}
/**
 * Calculate days since first visit
 */ function getDaysSinceFirstVisit(firstVisit) {
    if (!firstVisit) return 0;
    const firstVisitDate = new Date(firstVisit);
    const now = new Date();
    const diffMs = now.getTime() - firstVisitDate.getTime();
    return Math.floor(diffMs / (1000 * 60 * 60 * 24));
}
/**
 * Calculate hours since last visit
 */ function getHoursSinceLastVisit(lastVisit) {
    if (!lastVisit) return null;
    const lastVisitDate = new Date(lastVisit);
    const now = new Date();
    const diffMs = now.getTime() - lastVisitDate.getTime();
    return Math.floor(diffMs / (1000 * 60 * 60));
}
function trackReturnVisit() {
    if (!isBrowser()) return;
    //TURBOPACK unreachable
    ;
    const now = undefined;
    const nowISO = undefined;
    const data = undefined;
    const lastVisitDate = undefined;
    // Calculate if this is a new visit (based on threshold)
    const isNewVisit = undefined;
}
function trackFeatureDiscovery(feature) {
    if (!isBrowser()) return;
    //TURBOPACK unreachable
    ;
    const data = undefined;
    // Add to discovered features
    const updatedFeatures = undefined;
    const daysSinceFirstVisit = undefined;
    const totalDiscoveredCount = undefined;
}
function hasDiscoveredFeature(feature) {
    if (!isBrowser()) return false;
    //TURBOPACK unreachable
    ;
    const data = undefined;
}
function getRetentionStats() {
    const data = getRetentionData();
    return {
        ...data,
        daysSinceFirstVisit: getDaysSinceFirstVisit(data.firstVisit),
        hoursSinceLastVisit: getHoursSinceLastVisit(data.lastVisit)
    };
}
function resetRetentionTracking() {
    if (!isBrowser()) return;
    //TURBOPACK unreachable
    ;
}
}),
"[project]/src/components/TrackingProvider.tsx [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "TrackingProvider",
    ()=>TrackingProvider,
    "useTracking",
    ()=>useTracking
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$tracking$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/services/tracking.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$retentionTracking$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/services/retentionTracking.ts [app-ssr] (ecmascript)");
'use client';
;
;
;
;
const TrackingContext = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["createContext"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$tracking$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["tracking"]);
const useTracking = ()=>{
    return (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useContext"])(TrackingContext);
};
function TrackingProvider({ children, apiKey, host, enabled = true }) {
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEffect"])(()=>{
        const key = apiKey || process.env.NEXT_PUBLIC_POSTHOG_KEY;
        const hostUrl = host || process.env.NEXT_PUBLIC_POSTHOG_HOST;
        if (key) {
            __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$tracking$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["tracking"].initialize({
                apiKey: key,
                host: hostUrl,
                enabled
            });
        }
        // Track return visit after a short delay (to ensure tracking is initialized)
        const timer = setTimeout(()=>{
            (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$retentionTracking$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["trackReturnVisit"])();
        }, 500);
        return ()=>clearTimeout(timer);
    }, [
        apiKey,
        host,
        enabled
    ]);
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(TrackingContext.Provider, {
        value: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$tracking$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["tracking"],
        children: children
    }, void 0, false, {
        fileName: "[project]/src/components/TrackingProvider.tsx",
        lineNumber: 48,
        columnNumber: 5
    }, this);
}
}),
"[externals]/next/dist/server/app-render/action-async-storage.external.js [external] (next/dist/server/app-render/action-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/action-async-storage.external.js", () => require("next/dist/server/app-render/action-async-storage.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/work-unit-async-storage.external.js [external] (next/dist/server/app-render/work-unit-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/work-unit-async-storage.external.js", () => require("next/dist/server/app-render/work-unit-async-storage.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/work-async-storage.external.js [external] (next/dist/server/app-render/work-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/work-async-storage.external.js", () => require("next/dist/server/app-render/work-async-storage.external.js"));

module.exports = mod;
}),
"[project]/src/components/MetaPixel.tsx [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "MetaPixel",
    ()=>MetaPixel,
    "grantMetaConsent",
    ()=>grantMetaConsent,
    "revokeMetaConsent",
    ()=>revokeMetaConsent,
    "trackMetaCustomEvent",
    ()=>trackMetaCustomEvent,
    "trackMetaEvent",
    ()=>trackMetaEvent
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/navigation.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$script$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/script.js [app-ssr] (ecmascript)");
'use client';
;
;
;
;
function MetaPixel({ pixelId }) {
    const pathname = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["usePathname"])();
    const searchParams = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useSearchParams"])();
    // Initialize Meta Pixel on mount
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEffect"])(()=>{
        // Initialize fbq function if not already present
        if ("TURBOPACK compile-time falsy", 0) //TURBOPACK unreachable
        ;
        // Initialize pixel with ID
        if (window.fbq) {
            window.fbq('init', pixelId);
        }
    }, [
        pixelId
    ]);
    // Track PageView on pathname or search params change
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEffect"])(()=>{
        if (window.fbq && pixelId && pixelId !== 'your_meta_pixel_id_here') {
            // Build full URL for tracking
            const url = pathname + (searchParams?.toString() ? `?${searchParams.toString()}` : '');
            // Track PageView with current URL
            window.fbq('track', 'PageView');
            if ("TURBOPACK compile-time truthy", 1) {
                console.log('Meta Pixel PageView tracked:', url);
            }
        }
    }, [
        pathname,
        searchParams,
        pixelId
    ]);
    if (!pixelId || pixelId === 'your_meta_pixel_id_here') {
        // Don't load pixel if not configured
        console.warn('Meta Pixel ID not configured');
        return null;
    }
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Fragment"], {
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$script$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"], {
                id: "meta-pixel",
                strategy: "afterInteractive",
                dangerouslySetInnerHTML: {
                    __html: `
            !function(f,b,e,v,n,t,s)
            {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
            n.callMethod.apply(n,arguments):n.queue.push(arguments)};
            if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
            n.queue=[];t=b.createElement(e);t.async=!0;
            t.src=v;s=b.getElementsByTagName(e)[0];
            s.parentNode.insertBefore(t,s)}(window, document,'script',
            'https://connect.facebook.net/en_US/fbevents.js');
            fbq('init', '${pixelId}');
          `
                }
            }, void 0, false, {
                fileName: "[project]/src/components/MetaPixel.tsx",
                lineNumber: 89,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("noscript", {
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("img", {
                    height: "1",
                    width: "1",
                    style: {
                        display: 'none'
                    },
                    src: `https://www.facebook.com/tr?id=${pixelId}&ev=PageView&noscript=1`,
                    alt: ""
                }, void 0, false, {
                    fileName: "[project]/src/components/MetaPixel.tsx",
                    lineNumber: 108,
                    columnNumber: 9
                }, this)
            }, void 0, false, {
                fileName: "[project]/src/components/MetaPixel.tsx",
                lineNumber: 107,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true);
}
function trackMetaEvent(eventName, parameters) {
    if ("TURBOPACK compile-time falsy", 0) //TURBOPACK unreachable
    ;
    else {
        console.warn('Meta Pixel not loaded, cannot track event:', eventName);
    }
}
function trackMetaCustomEvent(eventName, parameters) {
    if ("TURBOPACK compile-time falsy", 0) //TURBOPACK unreachable
    ;
    else {
        console.warn('Meta Pixel not loaded, cannot track custom event:', eventName);
    }
}
function grantMetaConsent() {
    if ("TURBOPACK compile-time falsy", 0) //TURBOPACK unreachable
    ;
}
function revokeMetaConsent() {
    if ("TURBOPACK compile-time falsy", 0) //TURBOPACK unreachable
    ;
}
}),
];

//# sourceMappingURL=%5Broot-of-the-server%5D__9e045fbe._.js.map