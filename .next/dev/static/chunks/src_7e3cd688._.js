(globalThis.TURBOPACK || (globalThis.TURBOPACK = [])).push([typeof document === "object" ? document.currentScript : undefined,
"[project]/src/services/tracking.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "tracking",
    ()=>tracking
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$polyfills$2f$process$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = /*#__PURE__*/ __turbopack_context__.i("[project]/node_modules/next/dist/build/polyfills/process.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$posthog$2d$js$2f$dist$2f$module$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/posthog-js/dist/module.js [app-client] (ecmascript)");
;
class ClientTrackingService {
    initialized = false;
    enabled = false;
    constructor(){
        if ("TURBOPACK compile-time falsy", 0) //TURBOPACK unreachable
        ;
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
            __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$posthog$2d$js$2f$dist$2f$module$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"].init(config.apiKey, {
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
            __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$posthog$2d$js$2f$dist$2f$module$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"].identify(userId, properties);
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
            __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$posthog$2d$js$2f$dist$2f$module$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"].capture(event, properties);
        } catch (error) {
            console.error('Failed to track event:', error);
        }
    }
    page(name, properties) {
        if (!this.isEnabled()) return;
        try {
            __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$posthog$2d$js$2f$dist$2f$module$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"].capture('$pageview', {
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
            __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$posthog$2d$js$2f$dist$2f$module$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"].reset();
        } catch (error) {
            console.error('Failed to reset tracking:', error);
        }
    }
    isEnabled() {
        return this.initialized && this.enabled;
    }
}
const tracking = new ClientTrackingService();
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/src/components/TrackingProvider.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "TrackingProvider",
    ()=>TrackingProvider,
    "useTracking",
    ()=>useTracking
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$polyfills$2f$process$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = /*#__PURE__*/ __turbopack_context__.i("[project]/node_modules/next/dist/build/polyfills/process.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$tracking$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/services/tracking.ts [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature(), _s1 = __turbopack_context__.k.signature();
'use client';
;
;
const TrackingContext = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createContext"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$tracking$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["tracking"]);
const useTracking = ()=>{
    _s();
    return (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useContext"])(TrackingContext);
};
_s(useTracking, "gDsCjeeItUuvgOWf1v4qoK9RF6k=");
function TrackingProvider({ children, apiKey, host, enabled = true }) {
    _s1();
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "TrackingProvider.useEffect": ()=>{
            const key = apiKey || __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$polyfills$2f$process$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"].env.NEXT_PUBLIC_POSTHOG_KEY;
            const hostUrl = host || __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$polyfills$2f$process$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"].env.NEXT_PUBLIC_POSTHOG_HOST;
            if (key) {
                __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$tracking$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["tracking"].initialize({
                    apiKey: key,
                    host: hostUrl,
                    enabled
                });
            }
        }
    }["TrackingProvider.useEffect"], [
        apiKey,
        host,
        enabled
    ]);
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(TrackingContext.Provider, {
        value: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$tracking$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["tracking"],
        children: children
    }, void 0, false, {
        fileName: "[project]/src/components/TrackingProvider.tsx",
        lineNumber: 40,
        columnNumber: 5
    }, this);
}
_s1(TrackingProvider, "OD7bBpZva5O2jO+Puf00hKivP7c=");
_c = TrackingProvider;
var _c;
__turbopack_context__.k.register(_c, "TrackingProvider");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
]);

//# sourceMappingURL=src_7e3cd688._.js.map