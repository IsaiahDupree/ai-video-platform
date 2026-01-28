(globalThis.TURBOPACK || (globalThis.TURBOPACK = [])).push([typeof document === "object" ? document.currentScript : undefined,
"[project]/src/app/pricing/pricing.module.css [app-client] (css module)", ((__turbopack_context__) => {

__turbopack_context__.v({
  "active": "pricing-module__kvPdYW__active",
  "annualNote": "pricing-module__kvPdYW__annualNote",
  "billingToggle": "pricing-module__kvPdYW__billingToggle",
  "checkIcon": "pricing-module__kvPdYW__checkIcon",
  "container": "pricing-module__kvPdYW__container",
  "ctaButton": "pricing-module__kvPdYW__ctaButton",
  "ctaButtonPrimary": "pricing-module__kvPdYW__ctaButtonPrimary",
  "ctaButtonSecondary": "pricing-module__kvPdYW__ctaButtonSecondary",
  "currency": "pricing-module__kvPdYW__currency",
  "feature": "pricing-module__kvPdYW__feature",
  "featureList": "pricing-module__kvPdYW__featureList",
  "footer": "pricing-module__kvPdYW__footer",
  "footerText": "pricing-module__kvPdYW__footerText",
  "header": "pricing-module__kvPdYW__header",
  "interval": "pricing-module__kvPdYW__interval",
  "link": "pricing-module__kvPdYW__link",
  "planCard": "pricing-module__kvPdYW__planCard",
  "planHeader": "pricing-module__kvPdYW__planHeader",
  "planName": "pricing-module__kvPdYW__planName",
  "plansGrid": "pricing-module__kvPdYW__plansGrid",
  "popular": "pricing-module__kvPdYW__popular",
  "popularBadge": "pricing-module__kvPdYW__popularBadge",
  "price": "pricing-module__kvPdYW__price",
  "priceContainer": "pricing-module__kvPdYW__priceContainer",
  "saveBadge": "pricing-module__kvPdYW__saveBadge",
  "spin": "pricing-module__kvPdYW__spin",
  "spinner": "pricing-module__kvPdYW__spinner",
  "subtitle": "pricing-module__kvPdYW__subtitle",
  "title": "pricing-module__kvPdYW__title",
  "toggleButton": "pricing-module__kvPdYW__toggleButton",
});
}),
"[project]/src/app/pricing/page.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>PricingPage
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$tracking$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/services/tracking.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$pricing$2f$pricing$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__ = __turbopack_context__.i("[project]/src/app/pricing/pricing.module.css [app-client] (css module)");
;
var _s = __turbopack_context__.k.signature();
'use client';
;
;
;
const plans = [
    {
        id: 'free',
        name: 'Free',
        price: 0,
        interval: 'month',
        features: [
            '10 renders per month',
            'Basic templates',
            'SD quality (720p)',
            'Community support'
        ]
    },
    {
        id: 'pro',
        name: 'Pro',
        price: 29,
        interval: 'month',
        features: [
            '100 renders per month',
            'All templates',
            'HD quality (1080p)',
            'Priority support',
            'Custom branding',
            'API access'
        ],
        popular: true
    },
    {
        id: 'business',
        name: 'Business',
        price: 99,
        interval: 'month',
        features: [
            'Unlimited renders',
            'All templates + custom',
            '4K quality',
            'Dedicated support',
            'Custom branding',
            'API access',
            'Team collaboration',
            'Advanced analytics'
        ]
    },
    {
        id: 'pro-annual',
        name: 'Pro Annual',
        price: 290,
        interval: 'year',
        features: [
            '100 renders per month',
            'All templates',
            'HD quality (1080p)',
            'Priority support',
            'Custom branding',
            'API access',
            '2 months free'
        ]
    },
    {
        id: 'business-annual',
        name: 'Business Annual',
        price: 990,
        interval: 'year',
        features: [
            'Unlimited renders',
            'All templates + custom',
            '4K quality',
            'Dedicated support',
            'Custom branding',
            'API access',
            'Team collaboration',
            'Advanced analytics',
            '2 months free'
        ]
    }
];
function PricingPage() {
    _s();
    const [billingInterval, setBillingInterval] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])('monthly');
    const [selectedPlan, setSelectedPlan] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(null);
    const handleCheckout = (plan)=>{
        // Track checkout started event
        __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$tracking$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["tracking"].track('checkout_started', {
            planId: plan.id,
            planName: plan.name,
            price: plan.price,
            interval: plan.interval,
            currency: 'USD',
            timestamp: new Date().toISOString()
        });
        setSelectedPlan(plan.id);
        // Redirect to checkout page after a brief delay
        setTimeout(()=>{
            window.location.href = `/checkout?plan=${plan.id}`;
        }, 500);
    };
    const filteredPlans = plans.filter((plan)=>{
        if (billingInterval === 'monthly') {
            return plan.interval === 'month';
        } else {
            return plan.interval === 'year';
        }
    });
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$pricing$2f$pricing$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].container,
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$pricing$2f$pricing$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].header,
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h1", {
                        className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$pricing$2f$pricing$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].title,
                        children: "Choose Your Plan"
                    }, void 0, false, {
                        fileName: "[project]/src/app/pricing/page.tsx",
                        lineNumber: 128,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                        className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$pricing$2f$pricing$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].subtitle,
                        children: "Start creating amazing videos today. Upgrade anytime."
                    }, void 0, false, {
                        fileName: "[project]/src/app/pricing/page.tsx",
                        lineNumber: 129,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$pricing$2f$pricing$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].billingToggle,
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                className: `${__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$pricing$2f$pricing$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].toggleButton} ${billingInterval === 'monthly' ? __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$pricing$2f$pricing$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].active : ''}`,
                                onClick: ()=>setBillingInterval('monthly'),
                                children: "Monthly"
                            }, void 0, false, {
                                fileName: "[project]/src/app/pricing/page.tsx",
                                lineNumber: 134,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                className: `${__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$pricing$2f$pricing$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].toggleButton} ${billingInterval === 'yearly' ? __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$pricing$2f$pricing$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].active : ''}`,
                                onClick: ()=>setBillingInterval('yearly'),
                                children: [
                                    "Yearly",
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$pricing$2f$pricing$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].saveBadge,
                                        children: "Save 17%"
                                    }, void 0, false, {
                                        fileName: "[project]/src/app/pricing/page.tsx",
                                        lineNumber: 149,
                                        columnNumber: 13
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/app/pricing/page.tsx",
                                lineNumber: 142,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/app/pricing/page.tsx",
                        lineNumber: 133,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/src/app/pricing/page.tsx",
                lineNumber: 127,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$pricing$2f$pricing$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].plansGrid,
                children: filteredPlans.map((plan)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: `${__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$pricing$2f$pricing$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].planCard} ${plan.popular ? __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$pricing$2f$pricing$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].popular : ''}`,
                        children: [
                            plan.popular && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$pricing$2f$pricing$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].popularBadge,
                                children: "Most Popular"
                            }, void 0, false, {
                                fileName: "[project]/src/app/pricing/page.tsx",
                                lineNumber: 163,
                                columnNumber: 15
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$pricing$2f$pricing$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].planHeader,
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                                        className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$pricing$2f$pricing$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].planName,
                                        children: plan.name
                                    }, void 0, false, {
                                        fileName: "[project]/src/app/pricing/page.tsx",
                                        lineNumber: 167,
                                        columnNumber: 15
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$pricing$2f$pricing$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].priceContainer,
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$pricing$2f$pricing$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].currency,
                                                children: "$"
                                            }, void 0, false, {
                                                fileName: "[project]/src/app/pricing/page.tsx",
                                                lineNumber: 169,
                                                columnNumber: 17
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$pricing$2f$pricing$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].price,
                                                children: plan.price
                                            }, void 0, false, {
                                                fileName: "[project]/src/app/pricing/page.tsx",
                                                lineNumber: 170,
                                                columnNumber: 17
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$pricing$2f$pricing$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].interval,
                                                children: [
                                                    "/",
                                                    plan.interval === 'month' ? 'mo' : 'yr'
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/src/app/pricing/page.tsx",
                                                lineNumber: 171,
                                                columnNumber: 17
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/src/app/pricing/page.tsx",
                                        lineNumber: 168,
                                        columnNumber: 15
                                    }, this),
                                    plan.price > 0 && plan.interval === 'year' && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                        className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$pricing$2f$pricing$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].annualNote,
                                        children: [
                                            "$",
                                            Math.round(plan.price / 12),
                                            "/mo billed annually"
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/src/app/pricing/page.tsx",
                                        lineNumber: 176,
                                        columnNumber: 17
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/app/pricing/page.tsx",
                                lineNumber: 166,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("ul", {
                                className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$pricing$2f$pricing$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].featureList,
                                children: plan.features.map((feature, index)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("li", {
                                        className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$pricing$2f$pricing$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].feature,
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("svg", {
                                                className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$pricing$2f$pricing$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].checkIcon,
                                                viewBox: "0 0 20 20",
                                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                                                    d: "M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                                }, void 0, false, {
                                                    fileName: "[project]/src/app/pricing/page.tsx",
                                                    lineNumber: 186,
                                                    columnNumber: 21
                                                }, this)
                                            }, void 0, false, {
                                                fileName: "[project]/src/app/pricing/page.tsx",
                                                lineNumber: 185,
                                                columnNumber: 19
                                            }, this),
                                            feature
                                        ]
                                    }, index, true, {
                                        fileName: "[project]/src/app/pricing/page.tsx",
                                        lineNumber: 184,
                                        columnNumber: 17
                                    }, this))
                            }, void 0, false, {
                                fileName: "[project]/src/app/pricing/page.tsx",
                                lineNumber: 182,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                className: `${__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$pricing$2f$pricing$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].ctaButton} ${plan.popular ? __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$pricing$2f$pricing$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].ctaButtonPrimary : __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$pricing$2f$pricing$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].ctaButtonSecondary} ${selectedPlan === plan.id ? __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$pricing$2f$pricing$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].loading : ''}`,
                                onClick: ()=>handleCheckout(plan),
                                disabled: selectedPlan === plan.id,
                                children: selectedPlan === plan.id ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Fragment"], {
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                            className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$pricing$2f$pricing$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].spinner
                                        }, void 0, false, {
                                            fileName: "[project]/src/app/pricing/page.tsx",
                                            lineNumber: 202,
                                            columnNumber: 19
                                        }, this),
                                        "Redirecting..."
                                    ]
                                }, void 0, true) : plan.price === 0 ? 'Get Started' : 'Start Free Trial'
                            }, void 0, false, {
                                fileName: "[project]/src/app/pricing/page.tsx",
                                lineNumber: 193,
                                columnNumber: 13
                            }, this)
                        ]
                    }, plan.id, true, {
                        fileName: "[project]/src/app/pricing/page.tsx",
                        lineNumber: 156,
                        columnNumber: 11
                    }, this))
            }, void 0, false, {
                fileName: "[project]/src/app/pricing/page.tsx",
                lineNumber: 154,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$pricing$2f$pricing$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].footer,
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                        className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$pricing$2f$pricing$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].footerText,
                        children: "All plans include a 14-day free trial. No credit card required."
                    }, void 0, false, {
                        fileName: "[project]/src/app/pricing/page.tsx",
                        lineNumber: 216,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                        className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$pricing$2f$pricing$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].footerText,
                        children: [
                            "Need a custom plan?",
                            ' ',
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("a", {
                                href: "/contact",
                                className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$pricing$2f$pricing$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].link,
                                children: "Contact sales"
                            }, void 0, false, {
                                fileName: "[project]/src/app/pricing/page.tsx",
                                lineNumber: 221,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/app/pricing/page.tsx",
                        lineNumber: 219,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/src/app/pricing/page.tsx",
                lineNumber: 215,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/src/app/pricing/page.tsx",
        lineNumber: 126,
        columnNumber: 5
    }, this);
}
_s(PricingPage, "s92c584fUWFyVJhT/B2Xl0xo164=");
_c = PricingPage;
var _c;
__turbopack_context__.k.register(_c, "PricingPage");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
]);

//# sourceMappingURL=src_app_pricing_e7f662da._.js.map