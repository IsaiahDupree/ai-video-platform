(globalThis.TURBOPACK || (globalThis.TURBOPACK = [])).push([typeof document === "object" ? document.currentScript : undefined,
"[project]/src/app/ppo/results/results.module.css [app-client] (css module)", ((__turbopack_context__) => {

__turbopack_context__.v({
  "confidenceBar": "results-module__XtEL_a__confidenceBar",
  "confidenceBarFill": "results-module__XtEL_a__confidenceBarFill",
  "confidenceBarLabel": "results-module__XtEL_a__confidenceBarLabel",
  "confidenceBarTrack": "results-module__XtEL_a__confidenceBarTrack",
  "container": "results-module__XtEL_a__container",
  "detail": "results-module__XtEL_a__detail",
  "detailLabel": "results-module__XtEL_a__detailLabel",
  "detailValue": "results-module__XtEL_a__detailValue",
  "detailedView": "results-module__XtEL_a__detailedView",
  "detailsGrid": "results-module__XtEL_a__detailsGrid",
  "header": "results-module__XtEL_a__header",
  "headerActions": "results-module__XtEL_a__headerActions",
  "highConfidence": "results-module__XtEL_a__highConfidence",
  "improvementBadge": "results-module__XtEL_a__improvementBadge",
  "improvementLabel": "results-module__XtEL_a__improvementLabel",
  "improvementNegative": "results-module__XtEL_a__improvementNegative",
  "improvementPositive": "results-module__XtEL_a__improvementPositive",
  "mainMetric": "results-module__XtEL_a__mainMetric",
  "mainMetricLabel": "results-module__XtEL_a__mainMetricLabel",
  "mainMetricValue": "results-module__XtEL_a__mainMetricValue",
  "metadata": "results-module__XtEL_a__metadata",
  "metric": "results-module__XtEL_a__metric",
  "metricLabel": "results-module__XtEL_a__metricLabel",
  "metricValue": "results-module__XtEL_a__metricValue",
  "negative": "results-module__XtEL_a__negative",
  "noWinnerBanner": "results-module__XtEL_a__noWinnerBanner",
  "noWinnerContent": "results-module__XtEL_a__noWinnerContent",
  "noWinnerIcon": "results-module__XtEL_a__noWinnerIcon",
  "positive": "results-module__XtEL_a__positive",
  "primaryButton": "results-module__XtEL_a__primaryButton",
  "recommendations": "results-module__XtEL_a__recommendations",
  "resultCard": "results-module__XtEL_a__resultCard",
  "resultCardTitle": "results-module__XtEL_a__resultCardTitle",
  "resultCardWinner": "results-module__XtEL_a__resultCardWinner",
  "resultsGrid": "results-module__XtEL_a__resultsGrid",
  "resultsTable": "results-module__XtEL_a__resultsTable",
  "secondaryButton": "results-module__XtEL_a__secondaryButton",
  "secondaryMetrics": "results-module__XtEL_a__secondaryMetrics",
  "statCard": "results-module__XtEL_a__statCard",
  "statLabel": "results-module__XtEL_a__statLabel",
  "statValue": "results-module__XtEL_a__statValue",
  "stateBadge": "results-module__XtEL_a__stateBadge",
  "statusBadge": "results-module__XtEL_a__statusBadge",
  "statusInfo": "results-module__XtEL_a__statusInfo",
  "statusSuccess": "results-module__XtEL_a__statusSuccess",
  "statusWarning": "results-module__XtEL_a__statusWarning",
  "subtitle": "results-module__XtEL_a__subtitle",
  "successButton": "results-module__XtEL_a__successButton",
  "summaryStats": "results-module__XtEL_a__summaryStats",
  "tableContainer": "results-module__XtEL_a__tableContainer",
  "testDetails": "results-module__XtEL_a__testDetails",
  "timeline": "results-module__XtEL_a__timeline",
  "timelineCard": "results-module__XtEL_a__timelineCard",
  "timelineContent": "results-module__XtEL_a__timelineContent",
  "timelineDate": "results-module__XtEL_a__timelineDate",
  "timelineIcon": "results-module__XtEL_a__timelineIcon",
  "timelineItem": "results-module__XtEL_a__timelineItem",
  "timelineView": "results-module__XtEL_a__timelineView",
  "title": "results-module__XtEL_a__title",
  "viewTab": "results-module__XtEL_a__viewTab",
  "viewTabActive": "results-module__XtEL_a__viewTabActive",
  "viewTabs": "results-module__XtEL_a__viewTabs",
  "winnerBadge": "results-module__XtEL_a__winnerBadge",
  "winnerBanner": "results-module__XtEL_a__winnerBanner",
  "winnerContent": "results-module__XtEL_a__winnerContent",
  "winnerIcon": "results-module__XtEL_a__winnerIcon",
  "winnerRow": "results-module__XtEL_a__winnerRow",
  "winnerStat": "results-module__XtEL_a__winnerStat",
  "winnerStatLabel": "results-module__XtEL_a__winnerStatLabel",
  "winnerStatValue": "results-module__XtEL_a__winnerStatValue",
  "winnerStats": "results-module__XtEL_a__winnerStats",
});
}),
"[project]/src/app/ppo/results/page.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>PPOResultsPage
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
/**
 * APP-016: PPO Results Dashboard
 * APP-017: Apply Winning Treatment
 *
 * Product Page Optimization test results interface with winner detection and apply functionality
 */ var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/navigation.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ppo$2f$results$2f$results$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__ = __turbopack_context__.i("[project]/src/app/ppo/results/results.module.css [app-client] (css module)");
;
var _s = __turbopack_context__.k.signature();
'use client';
;
;
;
// Mock data for demonstration
const MOCK_TEST = {
    id: 'test-1',
    appId: 'app-1',
    appStoreVersionId: 'ver-1',
    name: 'Holiday Campaign Screenshot Test',
    state: 'COMPLETED',
    trafficProportion: 0.4,
    platform: 'IOS',
    startDate: '2025-12-01',
    endDate: '2026-01-15',
    treatments: [
        {
            id: 'treatment-1',
            experimentId: 'test-1',
            name: 'Control',
            state: 'APPROVED',
            trafficProportion: 0.4,
            localizations: []
        },
        {
            id: 'treatment-2',
            experimentId: 'test-1',
            name: 'Hero Screenshot A',
            state: 'APPROVED',
            trafficProportion: 0.3,
            localizations: []
        },
        {
            id: 'treatment-3',
            experimentId: 'test-1',
            name: 'Hero Screenshot B',
            state: 'APPROVED',
            trafficProportion: 0.3,
            localizations: []
        }
    ]
};
const MOCK_RESULTS = [
    {
        treatmentId: 'treatment-1',
        treatmentName: 'Control',
        impressions: 12500,
        conversions: 1875,
        conversionRate: 15.0,
        improvement: 0,
        confidence: 99.5,
        isWinner: false
    },
    {
        treatmentId: 'treatment-2',
        treatmentName: 'Hero Screenshot A',
        impressions: 9400,
        conversions: 1598,
        conversionRate: 17.0,
        improvement: 13.3,
        confidence: 97.8,
        isWinner: true
    },
    {
        treatmentId: 'treatment-3',
        treatmentName: 'Hero Screenshot B',
        impressions: 9300,
        conversions: 1488,
        conversionRate: 16.0,
        improvement: 6.7,
        confidence: 92.1,
        isWinner: false
    }
];
function PPOResultsPage() {
    _s();
    const searchParams = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useSearchParams"])();
    const testId = searchParams.get('testId') || 'test-1';
    const [test, setTest] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(MOCK_TEST);
    const [results, setResults] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(MOCK_RESULTS);
    const [loading, setLoading] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    const [selectedView, setSelectedView] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])('overview');
    const [applying, setApplying] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    const [applySuccess, setApplySuccess] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "PPOResultsPage.useEffect": ()=>{
            loadResults();
        }
    }["PPOResultsPage.useEffect"], [
        testId
    ]);
    const loadResults = async ()=>{
        setLoading(true);
        // In a real implementation, this would fetch from the API:
        // const response = await getPPOTestResultsWithWinner(testId);
        // if (response.success) {
        //   setResults(response.data.results);
        //   setWinner(response.data.winner);
        // }
        // Simulate API call
        await new Promise((resolve)=>setTimeout(resolve, 500));
        setLoading(false);
    };
    const handleApplyWinner = async ()=>{
        if (!winner) return;
        const confirmed = window.confirm(`Apply "${winner.treatmentName}" to the default product page?\n\n` + `This will copy screenshots and previews from the winning treatment to your default app store version. ` + `This action cannot be undone.`);
        if (!confirmed) return;
        setApplying(true);
        try {
            // In a real implementation:
            // const result = await applyWinningTreatment({
            //   experimentId: test.id,
            //   treatmentId: winner.treatmentId
            // });
            //
            // if (result.success) {
            //   setApplySuccess(true);
            //   alert(`Success! Applied "${winner.treatmentName}" to default product page.\n\n` +
            //     `Locales updated: ${result.data.localesUpdated.join(', ')}\n` +
            //     `Screenshot sets copied: ${result.data.screenshotSetsCopied}\n` +
            //     `Preview sets copied: ${result.data.previewSetsCopied}`
            //   );
            // } else {
            //   alert(`Error: ${result.error}`);
            // }
            // For demo, simulate the apply operation
            await new Promise((resolve)=>setTimeout(resolve, 1500));
            setApplySuccess(true);
            alert(`✅ Success! Applied "${winner.treatmentName}" to default product page.\n\n` + `This is a demo - in production, this would:\n` + `• Copy screenshots from winning treatment\n` + `• Update all localized product pages\n` + `• Preserve version history\n\n` + `Locales updated: en-US, es-ES, fr-FR\n` + `Screenshot sets copied: 6\n` + `Preview sets copied: 3`);
        } catch (error) {
            alert(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
        } finally{
            setApplying(false);
        }
    };
    const winner = results.find((r)=>r.isWinner);
    const totalImpressions = results.reduce((sum, r)=>sum + r.impressions, 0);
    const avgConversionRate = results.reduce((sum, r)=>sum + r.conversionRate, 0) / results.length;
    // Calculate max improvement for winner badge
    const maxImprovement = Math.max(...results.map((r)=>r.improvement));
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ppo$2f$results$2f$results$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].container,
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ppo$2f$results$2f$results$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].header,
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h1", {
                                className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ppo$2f$results$2f$results$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].title,
                                children: [
                                    "PPO Test Results",
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ppo$2f$results$2f$results$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].stateBadge,
                                        "data-state": test.state.toLowerCase(),
                                        children: test.state
                                    }, void 0, false, {
                                        fileName: "[project]/src/app/ppo/results/page.tsx",
                                        lineNumber: 185,
                                        columnNumber: 13
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/app/ppo/results/page.tsx",
                                lineNumber: 183,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ppo$2f$results$2f$results$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].subtitle,
                                children: test.name
                            }, void 0, false, {
                                fileName: "[project]/src/app/ppo/results/page.tsx",
                                lineNumber: 189,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ppo$2f$results$2f$results$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].metadata,
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        children: [
                                            "Platform: ",
                                            test.platform
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/src/app/ppo/results/page.tsx",
                                        lineNumber: 191,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        children: "•"
                                    }, void 0, false, {
                                        fileName: "[project]/src/app/ppo/results/page.tsx",
                                        lineNumber: 192,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        children: [
                                            "Started: ",
                                            test.startDate
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/src/app/ppo/results/page.tsx",
                                        lineNumber: 193,
                                        columnNumber: 13
                                    }, this),
                                    test.endDate && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Fragment"], {
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                children: "•"
                                            }, void 0, false, {
                                                fileName: "[project]/src/app/ppo/results/page.tsx",
                                                lineNumber: 196,
                                                columnNumber: 17
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                children: [
                                                    "Ended: ",
                                                    test.endDate
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/src/app/ppo/results/page.tsx",
                                                lineNumber: 197,
                                                columnNumber: 17
                                            }, this)
                                        ]
                                    }, void 0, true)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/app/ppo/results/page.tsx",
                                lineNumber: 190,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/app/ppo/results/page.tsx",
                        lineNumber: 182,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ppo$2f$results$2f$results$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].headerActions,
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ppo$2f$results$2f$results$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].secondaryButton,
                                onClick: ()=>window.history.back(),
                                children: "← Back to Tests"
                            }, void 0, false, {
                                fileName: "[project]/src/app/ppo/results/page.tsx",
                                lineNumber: 203,
                                columnNumber: 11
                            }, this),
                            winner && !applySuccess && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ppo$2f$results$2f$results$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].primaryButton,
                                onClick: handleApplyWinner,
                                disabled: applying,
                                children: applying ? 'Applying...' : 'Apply Winner'
                            }, void 0, false, {
                                fileName: "[project]/src/app/ppo/results/page.tsx",
                                lineNumber: 210,
                                columnNumber: 13
                            }, this),
                            applySuccess && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ppo$2f$results$2f$results$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].successButton,
                                disabled: true,
                                children: "✓ Applied"
                            }, void 0, false, {
                                fileName: "[project]/src/app/ppo/results/page.tsx",
                                lineNumber: 219,
                                columnNumber: 13
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/app/ppo/results/page.tsx",
                        lineNumber: 202,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/src/app/ppo/results/page.tsx",
                lineNumber: 181,
                columnNumber: 7
            }, this),
            winner && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ppo$2f$results$2f$results$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].winnerBanner,
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ppo$2f$results$2f$results$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].winnerIcon,
                        children: "🏆"
                    }, void 0, false, {
                        fileName: "[project]/src/app/ppo/results/page.tsx",
                        lineNumber: 229,
                        columnNumber: 11
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ppo$2f$results$2f$results$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].winnerContent,
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
                                children: "Clear Winner Detected!"
                            }, void 0, false, {
                                fileName: "[project]/src/app/ppo/results/page.tsx",
                                lineNumber: 231,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("strong", {
                                        children: winner.treatmentName
                                    }, void 0, false, {
                                        fileName: "[project]/src/app/ppo/results/page.tsx",
                                        lineNumber: 233,
                                        columnNumber: 15
                                    }, this),
                                    " showed a",
                                    ' ',
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("strong", {
                                        children: [
                                            winner.improvement.toFixed(1),
                                            "%"
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/src/app/ppo/results/page.tsx",
                                        lineNumber: 234,
                                        columnNumber: 15
                                    }, this),
                                    " improvement in conversion rate with ",
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("strong", {
                                        children: [
                                            winner.confidence,
                                            "%"
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/src/app/ppo/results/page.tsx",
                                        lineNumber: 235,
                                        columnNumber: 39
                                    }, this),
                                    " confidence."
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/app/ppo/results/page.tsx",
                                lineNumber: 232,
                                columnNumber: 13
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/app/ppo/results/page.tsx",
                        lineNumber: 230,
                        columnNumber: 11
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ppo$2f$results$2f$results$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].winnerStats,
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ppo$2f$results$2f$results$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].winnerStat,
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ppo$2f$results$2f$results$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].winnerStatValue,
                                        children: [
                                            winner.conversionRate.toFixed(1),
                                            "%"
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/src/app/ppo/results/page.tsx",
                                        lineNumber: 240,
                                        columnNumber: 15
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ppo$2f$results$2f$results$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].winnerStatLabel,
                                        children: "Conversion Rate"
                                    }, void 0, false, {
                                        fileName: "[project]/src/app/ppo/results/page.tsx",
                                        lineNumber: 243,
                                        columnNumber: 15
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/app/ppo/results/page.tsx",
                                lineNumber: 239,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ppo$2f$results$2f$results$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].winnerStat,
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ppo$2f$results$2f$results$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].winnerStatValue,
                                        children: [
                                            "+",
                                            winner.improvement.toFixed(1),
                                            "%"
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/src/app/ppo/results/page.tsx",
                                        lineNumber: 246,
                                        columnNumber: 15
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ppo$2f$results$2f$results$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].winnerStatLabel,
                                        children: "Improvement"
                                    }, void 0, false, {
                                        fileName: "[project]/src/app/ppo/results/page.tsx",
                                        lineNumber: 249,
                                        columnNumber: 15
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/app/ppo/results/page.tsx",
                                lineNumber: 245,
                                columnNumber: 13
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/app/ppo/results/page.tsx",
                        lineNumber: 238,
                        columnNumber: 11
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/src/app/ppo/results/page.tsx",
                lineNumber: 228,
                columnNumber: 9
            }, this),
            !winner && test.state === 'COMPLETED' && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ppo$2f$results$2f$results$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].noWinnerBanner,
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ppo$2f$results$2f$results$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].noWinnerIcon,
                        children: "📊"
                    }, void 0, false, {
                        fileName: "[project]/src/app/ppo/results/page.tsx",
                        lineNumber: 258,
                        columnNumber: 11
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ppo$2f$results$2f$results$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].noWinnerContent,
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
                                children: "No Clear Winner"
                            }, void 0, false, {
                                fileName: "[project]/src/app/ppo/results/page.tsx",
                                lineNumber: 260,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                children: "None of the treatments met the criteria for a statistically significant winner. Consider running a new test with different variations or extending the test duration."
                            }, void 0, false, {
                                fileName: "[project]/src/app/ppo/results/page.tsx",
                                lineNumber: 261,
                                columnNumber: 13
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/app/ppo/results/page.tsx",
                        lineNumber: 259,
                        columnNumber: 11
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/src/app/ppo/results/page.tsx",
                lineNumber: 257,
                columnNumber: 9
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ppo$2f$results$2f$results$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].summaryStats,
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ppo$2f$results$2f$results$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].statCard,
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ppo$2f$results$2f$results$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].statValue,
                                children: totalImpressions.toLocaleString()
                            }, void 0, false, {
                                fileName: "[project]/src/app/ppo/results/page.tsx",
                                lineNumber: 272,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ppo$2f$results$2f$results$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].statLabel,
                                children: "Total Impressions"
                            }, void 0, false, {
                                fileName: "[project]/src/app/ppo/results/page.tsx",
                                lineNumber: 275,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/app/ppo/results/page.tsx",
                        lineNumber: 271,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ppo$2f$results$2f$results$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].statCard,
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ppo$2f$results$2f$results$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].statValue,
                                children: results.length
                            }, void 0, false, {
                                fileName: "[project]/src/app/ppo/results/page.tsx",
                                lineNumber: 278,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ppo$2f$results$2f$results$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].statLabel,
                                children: "Treatments Tested"
                            }, void 0, false, {
                                fileName: "[project]/src/app/ppo/results/page.tsx",
                                lineNumber: 281,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/app/ppo/results/page.tsx",
                        lineNumber: 277,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ppo$2f$results$2f$results$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].statCard,
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ppo$2f$results$2f$results$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].statValue,
                                children: [
                                    avgConversionRate.toFixed(1),
                                    "%"
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/app/ppo/results/page.tsx",
                                lineNumber: 284,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ppo$2f$results$2f$results$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].statLabel,
                                children: "Avg Conversion Rate"
                            }, void 0, false, {
                                fileName: "[project]/src/app/ppo/results/page.tsx",
                                lineNumber: 287,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/app/ppo/results/page.tsx",
                        lineNumber: 283,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ppo$2f$results$2f$results$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].statCard,
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ppo$2f$results$2f$results$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].statValue,
                                children: [
                                    maxImprovement > 0 ? '+' : '',
                                    maxImprovement.toFixed(1),
                                    "%"
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/app/ppo/results/page.tsx",
                                lineNumber: 290,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ppo$2f$results$2f$results$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].statLabel,
                                children: "Max Improvement"
                            }, void 0, false, {
                                fileName: "[project]/src/app/ppo/results/page.tsx",
                                lineNumber: 293,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/app/ppo/results/page.tsx",
                        lineNumber: 289,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/src/app/ppo/results/page.tsx",
                lineNumber: 270,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ppo$2f$results$2f$results$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].viewTabs,
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                        className: selectedView === 'overview' ? __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ppo$2f$results$2f$results$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].viewTabActive : __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ppo$2f$results$2f$results$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].viewTab,
                        onClick: ()=>setSelectedView('overview'),
                        children: "Overview"
                    }, void 0, false, {
                        fileName: "[project]/src/app/ppo/results/page.tsx",
                        lineNumber: 299,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                        className: selectedView === 'detailed' ? __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ppo$2f$results$2f$results$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].viewTabActive : __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ppo$2f$results$2f$results$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].viewTab,
                        onClick: ()=>setSelectedView('detailed'),
                        children: "Detailed Metrics"
                    }, void 0, false, {
                        fileName: "[project]/src/app/ppo/results/page.tsx",
                        lineNumber: 305,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                        className: selectedView === 'timeline' ? __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ppo$2f$results$2f$results$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].viewTabActive : __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ppo$2f$results$2f$results$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].viewTab,
                        onClick: ()=>setSelectedView('timeline'),
                        children: "Timeline"
                    }, void 0, false, {
                        fileName: "[project]/src/app/ppo/results/page.tsx",
                        lineNumber: 311,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/src/app/ppo/results/page.tsx",
                lineNumber: 298,
                columnNumber: 7
            }, this),
            selectedView === 'overview' && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ppo$2f$results$2f$results$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].resultsGrid,
                children: results.map((result)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: `${__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ppo$2f$results$2f$results$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].resultCard} ${result.isWinner ? __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ppo$2f$results$2f$results$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].resultCardWinner : ''}`,
                        children: [
                            result.isWinner && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ppo$2f$results$2f$results$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].winnerBadge,
                                children: "🏆 Winner"
                            }, void 0, false, {
                                fileName: "[project]/src/app/ppo/results/page.tsx",
                                lineNumber: 328,
                                columnNumber: 17
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
                                className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ppo$2f$results$2f$results$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].resultCardTitle,
                                children: result.treatmentName
                            }, void 0, false, {
                                fileName: "[project]/src/app/ppo/results/page.tsx",
                                lineNumber: 330,
                                columnNumber: 15
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ppo$2f$results$2f$results$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].mainMetric,
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ppo$2f$results$2f$results$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].mainMetricValue,
                                        children: [
                                            result.conversionRate.toFixed(1),
                                            "%"
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/src/app/ppo/results/page.tsx",
                                        lineNumber: 334,
                                        columnNumber: 17
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ppo$2f$results$2f$results$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].mainMetricLabel,
                                        children: "Conversion Rate"
                                    }, void 0, false, {
                                        fileName: "[project]/src/app/ppo/results/page.tsx",
                                        lineNumber: 337,
                                        columnNumber: 17
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/app/ppo/results/page.tsx",
                                lineNumber: 333,
                                columnNumber: 15
                            }, this),
                            result.improvement !== 0 && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: `${__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ppo$2f$results$2f$results$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].improvementBadge} ${result.improvement > 0 ? __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ppo$2f$results$2f$results$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].improvementPositive : __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ppo$2f$results$2f$results$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].improvementNegative}`,
                                children: [
                                    result.improvement > 0 ? '+' : '',
                                    result.improvement.toFixed(1),
                                    "%",
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ppo$2f$results$2f$results$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].improvementLabel,
                                        children: "vs Control"
                                    }, void 0, false, {
                                        fileName: "[project]/src/app/ppo/results/page.tsx",
                                        lineNumber: 346,
                                        columnNumber: 19
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/app/ppo/results/page.tsx",
                                lineNumber: 342,
                                columnNumber: 17
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ppo$2f$results$2f$results$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].secondaryMetrics,
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ppo$2f$results$2f$results$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].metric,
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ppo$2f$results$2f$results$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].metricLabel,
                                                children: "Impressions"
                                            }, void 0, false, {
                                                fileName: "[project]/src/app/ppo/results/page.tsx",
                                                lineNumber: 353,
                                                columnNumber: 19
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ppo$2f$results$2f$results$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].metricValue,
                                                children: result.impressions.toLocaleString()
                                            }, void 0, false, {
                                                fileName: "[project]/src/app/ppo/results/page.tsx",
                                                lineNumber: 354,
                                                columnNumber: 19
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/src/app/ppo/results/page.tsx",
                                        lineNumber: 352,
                                        columnNumber: 17
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ppo$2f$results$2f$results$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].metric,
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ppo$2f$results$2f$results$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].metricLabel,
                                                children: "Conversions"
                                            }, void 0, false, {
                                                fileName: "[project]/src/app/ppo/results/page.tsx",
                                                lineNumber: 359,
                                                columnNumber: 19
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ppo$2f$results$2f$results$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].metricValue,
                                                children: result.conversions.toLocaleString()
                                            }, void 0, false, {
                                                fileName: "[project]/src/app/ppo/results/page.tsx",
                                                lineNumber: 360,
                                                columnNumber: 19
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/src/app/ppo/results/page.tsx",
                                        lineNumber: 358,
                                        columnNumber: 17
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ppo$2f$results$2f$results$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].metric,
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ppo$2f$results$2f$results$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].metricLabel,
                                                children: "Confidence"
                                            }, void 0, false, {
                                                fileName: "[project]/src/app/ppo/results/page.tsx",
                                                lineNumber: 365,
                                                columnNumber: 19
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ppo$2f$results$2f$results$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].metricValue,
                                                children: [
                                                    result.confidence.toFixed(1),
                                                    "%"
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/src/app/ppo/results/page.tsx",
                                                lineNumber: 366,
                                                columnNumber: 19
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/src/app/ppo/results/page.tsx",
                                        lineNumber: 364,
                                        columnNumber: 17
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/app/ppo/results/page.tsx",
                                lineNumber: 351,
                                columnNumber: 15
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ppo$2f$results$2f$results$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].confidenceBar,
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ppo$2f$results$2f$results$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].confidenceBarLabel,
                                        children: "Statistical Confidence"
                                    }, void 0, false, {
                                        fileName: "[project]/src/app/ppo/results/page.tsx",
                                        lineNumber: 374,
                                        columnNumber: 17
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ppo$2f$results$2f$results$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].confidenceBarTrack,
                                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ppo$2f$results$2f$results$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].confidenceBarFill,
                                            style: {
                                                width: `${result.confidence}%`
                                            },
                                            "data-high": result.confidence >= 95
                                        }, void 0, false, {
                                            fileName: "[project]/src/app/ppo/results/page.tsx",
                                            lineNumber: 378,
                                            columnNumber: 19
                                        }, this)
                                    }, void 0, false, {
                                        fileName: "[project]/src/app/ppo/results/page.tsx",
                                        lineNumber: 377,
                                        columnNumber: 17
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/app/ppo/results/page.tsx",
                                lineNumber: 373,
                                columnNumber: 15
                            }, this)
                        ]
                    }, result.treatmentId, true, {
                        fileName: "[project]/src/app/ppo/results/page.tsx",
                        lineNumber: 323,
                        columnNumber: 13
                    }, this))
            }, void 0, false, {
                fileName: "[project]/src/app/ppo/results/page.tsx",
                lineNumber: 321,
                columnNumber: 9
            }, this),
            selectedView === 'detailed' && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ppo$2f$results$2f$results$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].detailedView,
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ppo$2f$results$2f$results$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].tableContainer,
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("table", {
                            className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ppo$2f$results$2f$results$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].resultsTable,
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("thead", {
                                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("tr", {
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("th", {
                                                children: "Treatment"
                                            }, void 0, false, {
                                                fileName: "[project]/src/app/ppo/results/page.tsx",
                                                lineNumber: 397,
                                                columnNumber: 19
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("th", {
                                                children: "Impressions"
                                            }, void 0, false, {
                                                fileName: "[project]/src/app/ppo/results/page.tsx",
                                                lineNumber: 398,
                                                columnNumber: 19
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("th", {
                                                children: "Conversions"
                                            }, void 0, false, {
                                                fileName: "[project]/src/app/ppo/results/page.tsx",
                                                lineNumber: 399,
                                                columnNumber: 19
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("th", {
                                                children: "Conversion Rate"
                                            }, void 0, false, {
                                                fileName: "[project]/src/app/ppo/results/page.tsx",
                                                lineNumber: 400,
                                                columnNumber: 19
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("th", {
                                                children: "Improvement"
                                            }, void 0, false, {
                                                fileName: "[project]/src/app/ppo/results/page.tsx",
                                                lineNumber: 401,
                                                columnNumber: 19
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("th", {
                                                children: "Confidence"
                                            }, void 0, false, {
                                                fileName: "[project]/src/app/ppo/results/page.tsx",
                                                lineNumber: 402,
                                                columnNumber: 19
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("th", {
                                                children: "Status"
                                            }, void 0, false, {
                                                fileName: "[project]/src/app/ppo/results/page.tsx",
                                                lineNumber: 403,
                                                columnNumber: 19
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/src/app/ppo/results/page.tsx",
                                        lineNumber: 396,
                                        columnNumber: 17
                                    }, this)
                                }, void 0, false, {
                                    fileName: "[project]/src/app/ppo/results/page.tsx",
                                    lineNumber: 395,
                                    columnNumber: 15
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("tbody", {
                                    children: results.map((result)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("tr", {
                                            className: result.isWinner ? __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ppo$2f$results$2f$results$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].winnerRow : '',
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                                    children: [
                                                        result.isWinner && '🏆 ',
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("strong", {
                                                            children: result.treatmentName
                                                        }, void 0, false, {
                                                            fileName: "[project]/src/app/ppo/results/page.tsx",
                                                            lineNumber: 411,
                                                            columnNumber: 23
                                                        }, this)
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "[project]/src/app/ppo/results/page.tsx",
                                                    lineNumber: 409,
                                                    columnNumber: 21
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                                    children: result.impressions.toLocaleString()
                                                }, void 0, false, {
                                                    fileName: "[project]/src/app/ppo/results/page.tsx",
                                                    lineNumber: 413,
                                                    columnNumber: 21
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                                    children: result.conversions.toLocaleString()
                                                }, void 0, false, {
                                                    fileName: "[project]/src/app/ppo/results/page.tsx",
                                                    lineNumber: 414,
                                                    columnNumber: 21
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("strong", {
                                                        children: [
                                                            result.conversionRate.toFixed(2),
                                                            "%"
                                                        ]
                                                    }, void 0, true, {
                                                        fileName: "[project]/src/app/ppo/results/page.tsx",
                                                        lineNumber: 415,
                                                        columnNumber: 25
                                                    }, this)
                                                }, void 0, false, {
                                                    fileName: "[project]/src/app/ppo/results/page.tsx",
                                                    lineNumber: 415,
                                                    columnNumber: 21
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                        className: result.improvement > 0 ? __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ppo$2f$results$2f$results$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].positive : __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ppo$2f$results$2f$results$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].negative,
                                                        children: [
                                                            result.improvement > 0 ? '+' : '',
                                                            result.improvement.toFixed(2),
                                                            "%"
                                                        ]
                                                    }, void 0, true, {
                                                        fileName: "[project]/src/app/ppo/results/page.tsx",
                                                        lineNumber: 417,
                                                        columnNumber: 23
                                                    }, this)
                                                }, void 0, false, {
                                                    fileName: "[project]/src/app/ppo/results/page.tsx",
                                                    lineNumber: 416,
                                                    columnNumber: 21
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                        className: result.confidence >= 95 ? __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ppo$2f$results$2f$results$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].highConfidence : '',
                                                        children: [
                                                            result.confidence.toFixed(1),
                                                            "%"
                                                        ]
                                                    }, void 0, true, {
                                                        fileName: "[project]/src/app/ppo/results/page.tsx",
                                                        lineNumber: 422,
                                                        columnNumber: 23
                                                    }, this)
                                                }, void 0, false, {
                                                    fileName: "[project]/src/app/ppo/results/page.tsx",
                                                    lineNumber: 421,
                                                    columnNumber: 21
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                        className: `${__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ppo$2f$results$2f$results$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].statusBadge} ${result.confidence >= 95 ? __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ppo$2f$results$2f$results$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].statusSuccess : result.confidence >= 90 ? __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ppo$2f$results$2f$results$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].statusWarning : __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ppo$2f$results$2f$results$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].statusInfo}`,
                                                        children: result.confidence >= 95 ? 'Significant' : result.confidence >= 90 ? 'Likely' : 'Inconclusive'
                                                    }, void 0, false, {
                                                        fileName: "[project]/src/app/ppo/results/page.tsx",
                                                        lineNumber: 427,
                                                        columnNumber: 23
                                                    }, this)
                                                }, void 0, false, {
                                                    fileName: "[project]/src/app/ppo/results/page.tsx",
                                                    lineNumber: 426,
                                                    columnNumber: 21
                                                }, this)
                                            ]
                                        }, result.treatmentId, true, {
                                            fileName: "[project]/src/app/ppo/results/page.tsx",
                                            lineNumber: 408,
                                            columnNumber: 19
                                        }, this))
                                }, void 0, false, {
                                    fileName: "[project]/src/app/ppo/results/page.tsx",
                                    lineNumber: 406,
                                    columnNumber: 15
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/src/app/ppo/results/page.tsx",
                            lineNumber: 394,
                            columnNumber: 13
                        }, this)
                    }, void 0, false, {
                        fileName: "[project]/src/app/ppo/results/page.tsx",
                        lineNumber: 393,
                        columnNumber: 11
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ppo$2f$results$2f$results$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].recommendations,
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
                                children: "Recommendations"
                            }, void 0, false, {
                                fileName: "[project]/src/app/ppo/results/page.tsx",
                                lineNumber: 445,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("ul", {
                                children: winner ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Fragment"], {
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("li", {
                                            children: [
                                                "✅ ",
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("strong", {
                                                    children: winner.treatmentName
                                                }, void 0, false, {
                                                    fileName: "[project]/src/app/ppo/results/page.tsx",
                                                    lineNumber: 450,
                                                    columnNumber: 23
                                                }, this),
                                                " is the clear winner with",
                                                ' ',
                                                winner.confidence,
                                                "% confidence."
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/src/app/ppo/results/page.tsx",
                                            lineNumber: 449,
                                            columnNumber: 19
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("li", {
                                            children: [
                                                "Consider applying this treatment to your default product page to improve conversion rates by approximately ",
                                                winner.improvement.toFixed(1),
                                                "%."
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/src/app/ppo/results/page.tsx",
                                            lineNumber: 453,
                                            columnNumber: 19
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("li", {
                                            children: "Monitor performance after applying to ensure results hold in production."
                                        }, void 0, false, {
                                            fileName: "[project]/src/app/ppo/results/page.tsx",
                                            lineNumber: 457,
                                            columnNumber: 19
                                        }, this)
                                    ]
                                }, void 0, true) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Fragment"], {
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("li", {
                                            children: "No treatment showed statistically significant improvement over the control."
                                        }, void 0, false, {
                                            fileName: "[project]/src/app/ppo/results/page.tsx",
                                            lineNumber: 463,
                                            columnNumber: 19
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("li", {
                                            children: "Consider running a longer test or testing more dramatic variations."
                                        }, void 0, false, {
                                            fileName: "[project]/src/app/ppo/results/page.tsx",
                                            lineNumber: 466,
                                            columnNumber: 19
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("li", {
                                            children: "Review treatment designs to ensure they're meaningfully different from control."
                                        }, void 0, false, {
                                            fileName: "[project]/src/app/ppo/results/page.tsx",
                                            lineNumber: 469,
                                            columnNumber: 19
                                        }, this)
                                    ]
                                }, void 0, true)
                            }, void 0, false, {
                                fileName: "[project]/src/app/ppo/results/page.tsx",
                                lineNumber: 446,
                                columnNumber: 13
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/app/ppo/results/page.tsx",
                        lineNumber: 444,
                        columnNumber: 11
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/src/app/ppo/results/page.tsx",
                lineNumber: 392,
                columnNumber: 9
            }, this),
            selectedView === 'timeline' && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ppo$2f$results$2f$results$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].timelineView,
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ppo$2f$results$2f$results$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].timelineCard,
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
                                children: "Test Timeline"
                            }, void 0, false, {
                                fileName: "[project]/src/app/ppo/results/page.tsx",
                                lineNumber: 483,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ppo$2f$results$2f$results$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].timeline,
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ppo$2f$results$2f$results$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].timelineItem,
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ppo$2f$results$2f$results$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].timelineIcon,
                                                children: "📝"
                                            }, void 0, false, {
                                                fileName: "[project]/src/app/ppo/results/page.tsx",
                                                lineNumber: 486,
                                                columnNumber: 17
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ppo$2f$results$2f$results$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].timelineContent,
                                                children: [
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h4", {
                                                        children: "Test Created"
                                                    }, void 0, false, {
                                                        fileName: "[project]/src/app/ppo/results/page.tsx",
                                                        lineNumber: 488,
                                                        columnNumber: 19
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                        children: [
                                                            "Test configured with ",
                                                            results.length,
                                                            " treatments"
                                                        ]
                                                    }, void 0, true, {
                                                        fileName: "[project]/src/app/ppo/results/page.tsx",
                                                        lineNumber: 489,
                                                        columnNumber: 19
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                        className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ppo$2f$results$2f$results$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].timelineDate,
                                                        children: test.startDate
                                                    }, void 0, false, {
                                                        fileName: "[project]/src/app/ppo/results/page.tsx",
                                                        lineNumber: 490,
                                                        columnNumber: 19
                                                    }, this)
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/src/app/ppo/results/page.tsx",
                                                lineNumber: 487,
                                                columnNumber: 17
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/src/app/ppo/results/page.tsx",
                                        lineNumber: 485,
                                        columnNumber: 15
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ppo$2f$results$2f$results$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].timelineItem,
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ppo$2f$results$2f$results$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].timelineIcon,
                                                children: "✅"
                                            }, void 0, false, {
                                                fileName: "[project]/src/app/ppo/results/page.tsx",
                                                lineNumber: 494,
                                                columnNumber: 17
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ppo$2f$results$2f$results$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].timelineContent,
                                                children: [
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h4", {
                                                        children: "Test Approved"
                                                    }, void 0, false, {
                                                        fileName: "[project]/src/app/ppo/results/page.tsx",
                                                        lineNumber: 496,
                                                        columnNumber: 19
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                        children: "Passed Apple review and started collecting data"
                                                    }, void 0, false, {
                                                        fileName: "[project]/src/app/ppo/results/page.tsx",
                                                        lineNumber: 497,
                                                        columnNumber: 19
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                        className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ppo$2f$results$2f$results$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].timelineDate,
                                                        children: test.startDate
                                                    }, void 0, false, {
                                                        fileName: "[project]/src/app/ppo/results/page.tsx",
                                                        lineNumber: 498,
                                                        columnNumber: 19
                                                    }, this)
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/src/app/ppo/results/page.tsx",
                                                lineNumber: 495,
                                                columnNumber: 17
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/src/app/ppo/results/page.tsx",
                                        lineNumber: 493,
                                        columnNumber: 15
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ppo$2f$results$2f$results$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].timelineItem,
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ppo$2f$results$2f$results$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].timelineIcon,
                                                children: "📊"
                                            }, void 0, false, {
                                                fileName: "[project]/src/app/ppo/results/page.tsx",
                                                lineNumber: 502,
                                                columnNumber: 17
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ppo$2f$results$2f$results$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].timelineContent,
                                                children: [
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h4", {
                                                        children: "Data Collection"
                                                    }, void 0, false, {
                                                        fileName: "[project]/src/app/ppo/results/page.tsx",
                                                        lineNumber: 504,
                                                        columnNumber: 19
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                        children: [
                                                            "Collected ",
                                                            totalImpressions.toLocaleString(),
                                                            " impressions across all treatments"
                                                        ]
                                                    }, void 0, true, {
                                                        fileName: "[project]/src/app/ppo/results/page.tsx",
                                                        lineNumber: 505,
                                                        columnNumber: 19
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                        className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ppo$2f$results$2f$results$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].timelineDate,
                                                        children: "45 days"
                                                    }, void 0, false, {
                                                        fileName: "[project]/src/app/ppo/results/page.tsx",
                                                        lineNumber: 506,
                                                        columnNumber: 19
                                                    }, this)
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/src/app/ppo/results/page.tsx",
                                                lineNumber: 503,
                                                columnNumber: 17
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/src/app/ppo/results/page.tsx",
                                        lineNumber: 501,
                                        columnNumber: 15
                                    }, this),
                                    test.endDate && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ppo$2f$results$2f$results$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].timelineItem,
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ppo$2f$results$2f$results$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].timelineIcon,
                                                children: "🏁"
                                            }, void 0, false, {
                                                fileName: "[project]/src/app/ppo/results/page.tsx",
                                                lineNumber: 511,
                                                columnNumber: 19
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ppo$2f$results$2f$results$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].timelineContent,
                                                children: [
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h4", {
                                                        children: "Test Completed"
                                                    }, void 0, false, {
                                                        fileName: "[project]/src/app/ppo/results/page.tsx",
                                                        lineNumber: 513,
                                                        columnNumber: 21
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                        children: winner ? `Winner detected: ${winner.treatmentName}` : 'No clear winner detected'
                                                    }, void 0, false, {
                                                        fileName: "[project]/src/app/ppo/results/page.tsx",
                                                        lineNumber: 514,
                                                        columnNumber: 21
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                        className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ppo$2f$results$2f$results$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].timelineDate,
                                                        children: test.endDate
                                                    }, void 0, false, {
                                                        fileName: "[project]/src/app/ppo/results/page.tsx",
                                                        lineNumber: 519,
                                                        columnNumber: 21
                                                    }, this)
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/src/app/ppo/results/page.tsx",
                                                lineNumber: 512,
                                                columnNumber: 19
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/src/app/ppo/results/page.tsx",
                                        lineNumber: 510,
                                        columnNumber: 17
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/app/ppo/results/page.tsx",
                                lineNumber: 484,
                                columnNumber: 13
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/app/ppo/results/page.tsx",
                        lineNumber: 482,
                        columnNumber: 11
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ppo$2f$results$2f$results$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].testDetails,
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
                                children: "Test Configuration"
                            }, void 0, false, {
                                fileName: "[project]/src/app/ppo/results/page.tsx",
                                lineNumber: 528,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ppo$2f$results$2f$results$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].detailsGrid,
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ppo$2f$results$2f$results$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].detail,
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ppo$2f$results$2f$results$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].detailLabel,
                                                children: "App ID"
                                            }, void 0, false, {
                                                fileName: "[project]/src/app/ppo/results/page.tsx",
                                                lineNumber: 531,
                                                columnNumber: 17
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ppo$2f$results$2f$results$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].detailValue,
                                                children: test.appId
                                            }, void 0, false, {
                                                fileName: "[project]/src/app/ppo/results/page.tsx",
                                                lineNumber: 532,
                                                columnNumber: 17
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/src/app/ppo/results/page.tsx",
                                        lineNumber: 530,
                                        columnNumber: 15
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ppo$2f$results$2f$results$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].detail,
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ppo$2f$results$2f$results$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].detailLabel,
                                                children: "Version ID"
                                            }, void 0, false, {
                                                fileName: "[project]/src/app/ppo/results/page.tsx",
                                                lineNumber: 535,
                                                columnNumber: 17
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ppo$2f$results$2f$results$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].detailValue,
                                                children: test.appStoreVersionId
                                            }, void 0, false, {
                                                fileName: "[project]/src/app/ppo/results/page.tsx",
                                                lineNumber: 536,
                                                columnNumber: 17
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/src/app/ppo/results/page.tsx",
                                        lineNumber: 534,
                                        columnNumber: 15
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ppo$2f$results$2f$results$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].detail,
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ppo$2f$results$2f$results$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].detailLabel,
                                                children: "Platform"
                                            }, void 0, false, {
                                                fileName: "[project]/src/app/ppo/results/page.tsx",
                                                lineNumber: 539,
                                                columnNumber: 17
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ppo$2f$results$2f$results$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].detailValue,
                                                children: test.platform
                                            }, void 0, false, {
                                                fileName: "[project]/src/app/ppo/results/page.tsx",
                                                lineNumber: 540,
                                                columnNumber: 17
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/src/app/ppo/results/page.tsx",
                                        lineNumber: 538,
                                        columnNumber: 15
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ppo$2f$results$2f$results$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].detail,
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ppo$2f$results$2f$results$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].detailLabel,
                                                children: "Control Traffic"
                                            }, void 0, false, {
                                                fileName: "[project]/src/app/ppo/results/page.tsx",
                                                lineNumber: 543,
                                                columnNumber: 17
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ppo$2f$results$2f$results$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].detailValue,
                                                children: [
                                                    (test.trafficProportion * 100).toFixed(0),
                                                    "%"
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/src/app/ppo/results/page.tsx",
                                                lineNumber: 544,
                                                columnNumber: 17
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/src/app/ppo/results/page.tsx",
                                        lineNumber: 542,
                                        columnNumber: 15
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/app/ppo/results/page.tsx",
                                lineNumber: 529,
                                columnNumber: 13
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/app/ppo/results/page.tsx",
                        lineNumber: 527,
                        columnNumber: 11
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/src/app/ppo/results/page.tsx",
                lineNumber: 481,
                columnNumber: 9
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/src/app/ppo/results/page.tsx",
        lineNumber: 179,
        columnNumber: 5
    }, this);
}
_s(PPOResultsPage, "EFjdZPL8nIVdxwY9nHfWDska+CI=", false, function() {
    return [
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useSearchParams"]
    ];
});
_c = PPOResultsPage;
var _c;
__turbopack_context__.k.register(_c, "PPOResultsPage");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
]);

//# sourceMappingURL=src_app_ppo_results_df5d8f5d._.js.map