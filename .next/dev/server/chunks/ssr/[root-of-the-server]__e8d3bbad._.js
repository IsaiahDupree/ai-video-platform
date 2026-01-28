module.exports = [
"[externals]/next/dist/compiled/next-server/app-page-turbo.runtime.dev.js [external] (next/dist/compiled/next-server/app-page-turbo.runtime.dev.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/compiled/next-server/app-page-turbo.runtime.dev.js", () => require("next/dist/compiled/next-server/app-page-turbo.runtime.dev.js"));

module.exports = mod;
}),
"[project]/src/app/ppo/ppo.module.css [app-ssr] (css module)", ((__turbopack_context__) => {

__turbopack_context__.v({
  "checkboxLabel": "ppo-module__uASIbW__checkboxLabel",
  "container": "ppo-module__uASIbW__container",
  "content": "ppo-module__uASIbW__content",
  "createView": "ppo-module__uASIbW__createView",
  "dangerButton": "ppo-module__uASIbW__dangerButton",
  "description": "ppo-module__uASIbW__description",
  "emptyIcon": "ppo-module__uASIbW__emptyIcon",
  "emptyState": "ppo-module__uASIbW__emptyState",
  "form": "ppo-module__uASIbW__form",
  "formActions": "ppo-module__uASIbW__formActions",
  "formGroup": "ppo-module__uASIbW__formGroup",
  "formSection": "ppo-module__uASIbW__formSection",
  "header": "ppo-module__uASIbW__header",
  "headerContent": "ppo-module__uASIbW__headerContent",
  "input": "ppo-module__uASIbW__input",
  "invalid": "ppo-module__uASIbW__invalid",
  "label": "ppo-module__uASIbW__label",
  "listHeader": "ppo-module__uASIbW__listHeader",
  "listView": "ppo-module__uASIbW__listView",
  "localeGrid": "ppo-module__uASIbW__localeGrid",
  "primaryButton": "ppo-module__uASIbW__primaryButton",
  "range": "ppo-module__uASIbW__range",
  "rangeGroup": "ppo-module__uASIbW__rangeGroup",
  "rangeValue": "ppo-module__uASIbW__rangeValue",
  "removeButton": "ppo-module__uASIbW__removeButton",
  "secondaryButton": "ppo-module__uASIbW__secondaryButton",
  "sectionHeader": "ppo-module__uASIbW__sectionHeader",
  "select": "ppo-module__uASIbW__select",
  "stateACCEPTED": "ppo-module__uASIbW__stateACCEPTED",
  "stateAPPROVED": "ppo-module__uASIbW__stateAPPROVED",
  "stateBadge": "ppo-module__uASIbW__stateBadge",
  "stateCOMPLETED": "ppo-module__uASIbW__stateCOMPLETED",
  "stateIN_REVIEW": "ppo-module__uASIbW__stateIN_REVIEW",
  "statePREPARE_FOR_SUBMISSION": "ppo-module__uASIbW__statePREPARE_FOR_SUBMISSION",
  "stateREADY_FOR_SUBMISSION": "ppo-module__uASIbW__stateREADY_FOR_SUBMISSION",
  "stateREJECTED": "ppo-module__uASIbW__stateREJECTED",
  "stateRUNNING": "ppo-module__uASIbW__stateRUNNING",
  "stateSTOPPED": "ppo-module__uASIbW__stateSTOPPED",
  "stateWAITING_FOR_REVIEW": "ppo-module__uASIbW__stateWAITING_FOR_REVIEW",
  "subtitle": "ppo-module__uASIbW__subtitle",
  "tab": "ppo-module__uASIbW__tab",
  "tabActive": "ppo-module__uASIbW__tabActive",
  "tabs": "ppo-module__uASIbW__tabs",
  "testCard": "ppo-module__uASIbW__testCard",
  "testCardBody": "ppo-module__uASIbW__testCardBody",
  "testCardFooter": "ppo-module__uASIbW__testCardFooter",
  "testCardHeader": "ppo-module__uASIbW__testCardHeader",
  "testGrid": "ppo-module__uASIbW__testGrid",
  "testInfo": "ppo-module__uASIbW__testInfo",
  "title": "ppo-module__uASIbW__title",
  "trafficControl": "ppo-module__uASIbW__trafficControl",
  "trafficTotal": "ppo-module__uASIbW__trafficTotal",
  "treatmentCard": "ppo-module__uASIbW__treatmentCard",
  "treatmentHeader": "ppo-module__uASIbW__treatmentHeader",
  "treatmentNameInput": "ppo-module__uASIbW__treatmentNameInput",
  "valid": "ppo-module__uASIbW__valid",
  "warning": "ppo-module__uASIbW__warning",
  "winner": "ppo-module__uASIbW__winner",
});
}),
"[project]/src/app/ppo/page.tsx [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>PPOPage
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
/**
 * APP-014: PPO Test Configuration
 *
 * Product Page Optimization test configuration interface
 */ var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ppo$2f$ppo$2e$module$2e$css__$5b$app$2d$ssr$5d$__$28$css__module$29$__ = __turbopack_context__.i("[project]/src/app/ppo/ppo.module.css [app-ssr] (css module)");
'use client';
;
;
;
// Mock data for demonstration
const MOCK_APPS = [
    {
        id: 'app-1',
        name: 'My Awesome App',
        bundleId: 'com.example.awesome'
    },
    {
        id: 'app-2',
        name: 'Super Game Pro',
        bundleId: 'com.example.game'
    },
    {
        id: 'app-3',
        name: 'Productivity Master',
        bundleId: 'com.example.productivity'
    }
];
const MOCK_VERSIONS = [
    {
        id: 'ver-1',
        versionString: '2.0.0',
        state: 'READY_FOR_DISTRIBUTION'
    },
    {
        id: 'ver-2',
        versionString: '1.9.5',
        state: 'READY_FOR_DISTRIBUTION'
    }
];
const LOCALES = [
    {
        code: 'en-US',
        name: 'English (US)'
    },
    {
        code: 'es-ES',
        name: 'Spanish (Spain)'
    },
    {
        code: 'fr-FR',
        name: 'French (France)'
    },
    {
        code: 'de-DE',
        name: 'German (Germany)'
    },
    {
        code: 'ja-JP',
        name: 'Japanese (Japan)'
    },
    {
        code: 'zh-CN',
        name: 'Chinese (Simplified)'
    }
];
function PPOPage() {
    const [activeTab, setActiveTab] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])('list');
    const [selectedApp, setSelectedApp] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])('');
    const [selectedVersion, setSelectedVersion] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])('');
    const [testName, setTestName] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])('');
    const [controlTraffic, setControlTraffic] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(50);
    const [treatments, setTreatments] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])([
        {
            name: 'Treatment A',
            trafficProportion: 25,
            locales: [
                'en-US'
            ]
        },
        {
            name: 'Treatment B',
            trafficProportion: 25,
            locales: [
                'en-US'
            ]
        }
    ]);
    const [mockTests, setMockTests] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])([
        {
            id: 'test-1',
            name: 'Holiday Campaign Test',
            app: 'My Awesome App',
            state: 'APPROVED',
            startDate: '2026-01-15',
            treatments: 3
        },
        {
            id: 'test-2',
            name: 'Screenshot Variant Test',
            app: 'Super Game Pro',
            state: 'COMPLETED',
            startDate: '2025-12-01',
            endDate: '2026-01-10',
            treatments: 2,
            winner: 'Treatment A'
        },
        {
            id: 'test-3',
            name: 'Icon Test A/B',
            app: 'My Awesome App',
            state: 'PREPARE_FOR_SUBMISSION',
            treatments: 2
        },
        {
            id: 'test-4',
            name: 'Feature Highlight Test',
            app: 'Productivity Master',
            state: 'WAITING_FOR_REVIEW',
            treatments: 3
        }
    ]);
    const handleSubmitTest = async (testId)=>{
        if (!confirm('Submit this test for review? Once submitted, you cannot modify the test configuration.')) {
            return;
        }
        // In a real implementation, this would call the API
        // const result = await startPPOTest(testId);
        // if (result.success) { ... }
        // For now, just update the mock state
        setMockTests((tests)=>tests.map((t)=>t.id === testId ? {
                    ...t,
                    state: 'WAITING_FOR_REVIEW'
                } : t));
        alert('Test submitted for review! You will be notified when the review is complete.');
    };
    const handleStopTest = async (testId)=>{
        if (!confirm('Stop this test? This action cannot be undone. The test will be terminated and all data will be finalized.')) {
            return;
        }
        // In a real implementation, this would call the API
        // const result = await stopPPOTest(testId);
        // if (result.success) { ... }
        // For now, just update the mock state
        setMockTests((tests)=>tests.map((t)=>t.id === testId ? {
                    ...t,
                    state: 'STOPPED',
                    endDate: new Date().toISOString().split('T')[0]
                } : t));
        alert('Test stopped successfully.');
    };
    const addTreatment = ()=>{
        if (treatments.length < 3) {
            const newTreatment = {
                name: `Treatment ${String.fromCharCode(65 + treatments.length)}`,
                trafficProportion: 0,
                locales: [
                    'en-US'
                ]
            };
            setTreatments([
                ...treatments,
                newTreatment
            ]);
            // Redistribute traffic evenly
            const newCount = treatments.length + 1;
            const trafficPerTreatment = Math.floor((100 - controlTraffic) / newCount);
            const updatedTreatments = [
                ...treatments,
                newTreatment
            ].map((t)=>({
                    ...t,
                    trafficProportion: trafficPerTreatment
                }));
            setTreatments(updatedTreatments);
        }
    };
    const removeTreatment = (index)=>{
        const newTreatments = treatments.filter((_, i)=>i !== index);
        setTreatments(newTreatments);
        // Redistribute traffic
        if (newTreatments.length > 0) {
            const trafficPerTreatment = Math.floor((100 - controlTraffic) / newTreatments.length);
            const updatedTreatments = newTreatments.map((t)=>({
                    ...t,
                    trafficProportion: trafficPerTreatment
                }));
            setTreatments(updatedTreatments);
        }
    };
    const updateTreatment = (index, updates)=>{
        const newTreatments = [
            ...treatments
        ];
        newTreatments[index] = {
            ...newTreatments[index],
            ...updates
        };
        setTreatments(newTreatments);
    };
    const toggleLocale = (treatmentIndex, locale)=>{
        const treatment = treatments[treatmentIndex];
        const newLocales = treatment.locales.includes(locale) ? treatment.locales.filter((l)=>l !== locale) : [
            ...treatment.locales,
            locale
        ];
        updateTreatment(treatmentIndex, {
            locales: newLocales
        });
    };
    const totalTraffic = controlTraffic + treatments.reduce((sum, t)=>sum + t.trafficProportion, 0);
    const trafficValid = Math.abs(totalTraffic - 100) < 0.01;
    const handleCreate = ()=>{
        if (!selectedApp || !selectedVersion || !testName || !trafficValid) {
            alert('Please fill in all required fields and ensure traffic adds up to 100%');
            return;
        }
        const newTest = {
            id: `test-${Date.now()}`,
            name: testName,
            app: MOCK_APPS.find((a)=>a.id === selectedApp)?.name || '',
            state: 'PREPARE_FOR_SUBMISSION',
            startDate: new Date().toISOString().split('T')[0],
            treatments: treatments.length
        };
        setMockTests([
            newTest,
            ...mockTests
        ]);
        alert('PPO test created successfully!');
        setActiveTab('list');
        // Reset form
        setSelectedApp('');
        setSelectedVersion('');
        setTestName('');
        setControlTraffic(50);
        setTreatments([
            {
                name: 'Treatment A',
                trafficProportion: 25,
                locales: [
                    'en-US'
                ]
            },
            {
                name: 'Treatment B',
                trafficProportion: 25,
                locales: [
                    'en-US'
                ]
            }
        ]);
    };
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ppo$2f$ppo$2e$module$2e$css__$5b$app$2d$ssr$5d$__$28$css__module$29$__["default"].container,
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("header", {
                className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ppo$2f$ppo$2e$module$2e$css__$5b$app$2d$ssr$5d$__$28$css__module$29$__["default"].header,
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ppo$2f$ppo$2e$module$2e$css__$5b$app$2d$ssr$5d$__$28$css__module$29$__["default"].headerContent,
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("h1", {
                            className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ppo$2f$ppo$2e$module$2e$css__$5b$app$2d$ssr$5d$__$28$css__module$29$__["default"].title,
                            children: "Product Page Optimization"
                        }, void 0, false, {
                            fileName: "[project]/src/app/ppo/page.tsx",
                            lineNumber: 210,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                            className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ppo$2f$ppo$2e$module$2e$css__$5b$app$2d$ssr$5d$__$28$css__module$29$__["default"].subtitle,
                            children: "A/B test your App Store product page with up to 3 treatments"
                        }, void 0, false, {
                            fileName: "[project]/src/app/ppo/page.tsx",
                            lineNumber: 211,
                            columnNumber: 11
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/src/app/ppo/page.tsx",
                    lineNumber: 209,
                    columnNumber: 9
                }, this)
            }, void 0, false, {
                fileName: "[project]/src/app/ppo/page.tsx",
                lineNumber: 208,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ppo$2f$ppo$2e$module$2e$css__$5b$app$2d$ssr$5d$__$28$css__module$29$__["default"].tabs,
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                        className: `${__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ppo$2f$ppo$2e$module$2e$css__$5b$app$2d$ssr$5d$__$28$css__module$29$__["default"].tab} ${activeTab === 'list' ? __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ppo$2f$ppo$2e$module$2e$css__$5b$app$2d$ssr$5d$__$28$css__module$29$__["default"].tabActive : ''}`,
                        onClick: ()=>setActiveTab('list'),
                        children: "PPO Tests"
                    }, void 0, false, {
                        fileName: "[project]/src/app/ppo/page.tsx",
                        lineNumber: 218,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                        className: `${__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ppo$2f$ppo$2e$module$2e$css__$5b$app$2d$ssr$5d$__$28$css__module$29$__["default"].tab} ${activeTab === 'create' ? __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ppo$2f$ppo$2e$module$2e$css__$5b$app$2d$ssr$5d$__$28$css__module$29$__["default"].tabActive : ''}`,
                        onClick: ()=>setActiveTab('create'),
                        children: "Create Test"
                    }, void 0, false, {
                        fileName: "[project]/src/app/ppo/page.tsx",
                        lineNumber: 224,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/src/app/ppo/page.tsx",
                lineNumber: 217,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ppo$2f$ppo$2e$module$2e$css__$5b$app$2d$ssr$5d$__$28$css__module$29$__["default"].content,
                children: [
                    activeTab === 'list' && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ppo$2f$ppo$2e$module$2e$css__$5b$app$2d$ssr$5d$__$28$css__module$29$__["default"].listView,
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ppo$2f$ppo$2e$module$2e$css__$5b$app$2d$ssr$5d$__$28$css__module$29$__["default"].listHeader,
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                                        children: "Your PPO Tests"
                                    }, void 0, false, {
                                        fileName: "[project]/src/app/ppo/page.tsx",
                                        lineNumber: 236,
                                        columnNumber: 15
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                        className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ppo$2f$ppo$2e$module$2e$css__$5b$app$2d$ssr$5d$__$28$css__module$29$__["default"].primaryButton,
                                        onClick: ()=>setActiveTab('create'),
                                        children: "+ New Test"
                                    }, void 0, false, {
                                        fileName: "[project]/src/app/ppo/page.tsx",
                                        lineNumber: 237,
                                        columnNumber: 15
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/app/ppo/page.tsx",
                                lineNumber: 235,
                                columnNumber: 13
                            }, this),
                            mockTests.length === 0 ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ppo$2f$ppo$2e$module$2e$css__$5b$app$2d$ssr$5d$__$28$css__module$29$__["default"].emptyState,
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ppo$2f$ppo$2e$module$2e$css__$5b$app$2d$ssr$5d$__$28$css__module$29$__["default"].emptyIcon,
                                        children: "🧪"
                                    }, void 0, false, {
                                        fileName: "[project]/src/app/ppo/page.tsx",
                                        lineNumber: 247,
                                        columnNumber: 17
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
                                        children: "No PPO tests yet"
                                    }, void 0, false, {
                                        fileName: "[project]/src/app/ppo/page.tsx",
                                        lineNumber: 248,
                                        columnNumber: 17
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                        children: "Create your first Product Page Optimization test to start A/B testing"
                                    }, void 0, false, {
                                        fileName: "[project]/src/app/ppo/page.tsx",
                                        lineNumber: 249,
                                        columnNumber: 17
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                        className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ppo$2f$ppo$2e$module$2e$css__$5b$app$2d$ssr$5d$__$28$css__module$29$__["default"].primaryButton,
                                        onClick: ()=>setActiveTab('create'),
                                        children: "Create Your First Test"
                                    }, void 0, false, {
                                        fileName: "[project]/src/app/ppo/page.tsx",
                                        lineNumber: 250,
                                        columnNumber: 17
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/app/ppo/page.tsx",
                                lineNumber: 246,
                                columnNumber: 15
                            }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ppo$2f$ppo$2e$module$2e$css__$5b$app$2d$ssr$5d$__$28$css__module$29$__["default"].testGrid,
                                children: mockTests.map((test)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ppo$2f$ppo$2e$module$2e$css__$5b$app$2d$ssr$5d$__$28$css__module$29$__["default"].testCard,
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ppo$2f$ppo$2e$module$2e$css__$5b$app$2d$ssr$5d$__$28$css__module$29$__["default"].testCardHeader,
                                                children: [
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
                                                        children: test.name
                                                    }, void 0, false, {
                                                        fileName: "[project]/src/app/ppo/page.tsx",
                                                        lineNumber: 262,
                                                        columnNumber: 23
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                        className: `${__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ppo$2f$ppo$2e$module$2e$css__$5b$app$2d$ssr$5d$__$28$css__module$29$__["default"].stateBadge} ${__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ppo$2f$ppo$2e$module$2e$css__$5b$app$2d$ssr$5d$__$28$css__module$29$__["default"][`state${test.state}`]}`,
                                                        children: test.state
                                                    }, void 0, false, {
                                                        fileName: "[project]/src/app/ppo/page.tsx",
                                                        lineNumber: 263,
                                                        columnNumber: 23
                                                    }, this)
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/src/app/ppo/page.tsx",
                                                lineNumber: 261,
                                                columnNumber: 21
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ppo$2f$ppo$2e$module$2e$css__$5b$app$2d$ssr$5d$__$28$css__module$29$__["default"].testCardBody,
                                                children: [
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                        className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ppo$2f$ppo$2e$module$2e$css__$5b$app$2d$ssr$5d$__$28$css__module$29$__["default"].testInfo,
                                                        children: [
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                                className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ppo$2f$ppo$2e$module$2e$css__$5b$app$2d$ssr$5d$__$28$css__module$29$__["default"].label,
                                                                children: "App:"
                                                            }, void 0, false, {
                                                                fileName: "[project]/src/app/ppo/page.tsx",
                                                                lineNumber: 269,
                                                                columnNumber: 25
                                                            }, this),
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                                children: test.app
                                                            }, void 0, false, {
                                                                fileName: "[project]/src/app/ppo/page.tsx",
                                                                lineNumber: 270,
                                                                columnNumber: 25
                                                            }, this)
                                                        ]
                                                    }, void 0, true, {
                                                        fileName: "[project]/src/app/ppo/page.tsx",
                                                        lineNumber: 268,
                                                        columnNumber: 23
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                        className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ppo$2f$ppo$2e$module$2e$css__$5b$app$2d$ssr$5d$__$28$css__module$29$__["default"].testInfo,
                                                        children: [
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                                className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ppo$2f$ppo$2e$module$2e$css__$5b$app$2d$ssr$5d$__$28$css__module$29$__["default"].label,
                                                                children: "Treatments:"
                                                            }, void 0, false, {
                                                                fileName: "[project]/src/app/ppo/page.tsx",
                                                                lineNumber: 273,
                                                                columnNumber: 25
                                                            }, this),
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                                children: test.treatments
                                                            }, void 0, false, {
                                                                fileName: "[project]/src/app/ppo/page.tsx",
                                                                lineNumber: 274,
                                                                columnNumber: 25
                                                            }, this)
                                                        ]
                                                    }, void 0, true, {
                                                        fileName: "[project]/src/app/ppo/page.tsx",
                                                        lineNumber: 272,
                                                        columnNumber: 23
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                        className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ppo$2f$ppo$2e$module$2e$css__$5b$app$2d$ssr$5d$__$28$css__module$29$__["default"].testInfo,
                                                        children: [
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                                className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ppo$2f$ppo$2e$module$2e$css__$5b$app$2d$ssr$5d$__$28$css__module$29$__["default"].label,
                                                                children: "Start Date:"
                                                            }, void 0, false, {
                                                                fileName: "[project]/src/app/ppo/page.tsx",
                                                                lineNumber: 277,
                                                                columnNumber: 25
                                                            }, this),
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                                children: test.startDate
                                                            }, void 0, false, {
                                                                fileName: "[project]/src/app/ppo/page.tsx",
                                                                lineNumber: 278,
                                                                columnNumber: 25
                                                            }, this)
                                                        ]
                                                    }, void 0, true, {
                                                        fileName: "[project]/src/app/ppo/page.tsx",
                                                        lineNumber: 276,
                                                        columnNumber: 23
                                                    }, this),
                                                    test.endDate && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                        className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ppo$2f$ppo$2e$module$2e$css__$5b$app$2d$ssr$5d$__$28$css__module$29$__["default"].testInfo,
                                                        children: [
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                                className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ppo$2f$ppo$2e$module$2e$css__$5b$app$2d$ssr$5d$__$28$css__module$29$__["default"].label,
                                                                children: "End Date:"
                                                            }, void 0, false, {
                                                                fileName: "[project]/src/app/ppo/page.tsx",
                                                                lineNumber: 282,
                                                                columnNumber: 27
                                                            }, this),
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                                children: test.endDate
                                                            }, void 0, false, {
                                                                fileName: "[project]/src/app/ppo/page.tsx",
                                                                lineNumber: 283,
                                                                columnNumber: 27
                                                            }, this)
                                                        ]
                                                    }, void 0, true, {
                                                        fileName: "[project]/src/app/ppo/page.tsx",
                                                        lineNumber: 281,
                                                        columnNumber: 25
                                                    }, this),
                                                    test.winner && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                        className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ppo$2f$ppo$2e$module$2e$css__$5b$app$2d$ssr$5d$__$28$css__module$29$__["default"].testInfo,
                                                        children: [
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                                className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ppo$2f$ppo$2e$module$2e$css__$5b$app$2d$ssr$5d$__$28$css__module$29$__["default"].label,
                                                                children: "Winner:"
                                                            }, void 0, false, {
                                                                fileName: "[project]/src/app/ppo/page.tsx",
                                                                lineNumber: 288,
                                                                columnNumber: 27
                                                            }, this),
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                                className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ppo$2f$ppo$2e$module$2e$css__$5b$app$2d$ssr$5d$__$28$css__module$29$__["default"].winner,
                                                                children: [
                                                                    "🏆 ",
                                                                    test.winner
                                                                ]
                                                            }, void 0, true, {
                                                                fileName: "[project]/src/app/ppo/page.tsx",
                                                                lineNumber: 289,
                                                                columnNumber: 27
                                                            }, this)
                                                        ]
                                                    }, void 0, true, {
                                                        fileName: "[project]/src/app/ppo/page.tsx",
                                                        lineNumber: 287,
                                                        columnNumber: 25
                                                    }, this)
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/src/app/ppo/page.tsx",
                                                lineNumber: 267,
                                                columnNumber: 21
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ppo$2f$ppo$2e$module$2e$css__$5b$app$2d$ssr$5d$__$28$css__module$29$__["default"].testCardFooter,
                                                children: [
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                        className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ppo$2f$ppo$2e$module$2e$css__$5b$app$2d$ssr$5d$__$28$css__module$29$__["default"].secondaryButton,
                                                        children: "View Details"
                                                    }, void 0, false, {
                                                        fileName: "[project]/src/app/ppo/page.tsx",
                                                        lineNumber: 294,
                                                        columnNumber: 23
                                                    }, this),
                                                    (test.state === 'PREPARE_FOR_SUBMISSION' || test.state === 'READY_FOR_SUBMISSION') && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                        className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ppo$2f$ppo$2e$module$2e$css__$5b$app$2d$ssr$5d$__$28$css__module$29$__["default"].primaryButton,
                                                        onClick: ()=>handleSubmitTest(test.id),
                                                        children: "Submit for Review"
                                                    }, void 0, false, {
                                                        fileName: "[project]/src/app/ppo/page.tsx",
                                                        lineNumber: 296,
                                                        columnNumber: 25
                                                    }, this),
                                                    (test.state === 'APPROVED' || test.state === 'ACCEPTED' || test.state === 'WAITING_FOR_REVIEW' || test.state === 'IN_REVIEW') && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                        className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ppo$2f$ppo$2e$module$2e$css__$5b$app$2d$ssr$5d$__$28$css__module$29$__["default"].dangerButton,
                                                        onClick: ()=>handleStopTest(test.id),
                                                        children: "Stop Test"
                                                    }, void 0, false, {
                                                        fileName: "[project]/src/app/ppo/page.tsx",
                                                        lineNumber: 304,
                                                        columnNumber: 25
                                                    }, this),
                                                    (test.state === 'COMPLETED' || test.state === 'STOPPED') && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                        className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ppo$2f$ppo$2e$module$2e$css__$5b$app$2d$ssr$5d$__$28$css__module$29$__["default"].secondaryButton,
                                                        children: "View Results"
                                                    }, void 0, false, {
                                                        fileName: "[project]/src/app/ppo/page.tsx",
                                                        lineNumber: 312,
                                                        columnNumber: 25
                                                    }, this)
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/src/app/ppo/page.tsx",
                                                lineNumber: 293,
                                                columnNumber: 21
                                            }, this)
                                        ]
                                    }, test.id, true, {
                                        fileName: "[project]/src/app/ppo/page.tsx",
                                        lineNumber: 260,
                                        columnNumber: 19
                                    }, this))
                            }, void 0, false, {
                                fileName: "[project]/src/app/ppo/page.tsx",
                                lineNumber: 258,
                                columnNumber: 15
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/app/ppo/page.tsx",
                        lineNumber: 234,
                        columnNumber: 11
                    }, this),
                    activeTab === 'create' && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ppo$2f$ppo$2e$module$2e$css__$5b$app$2d$ssr$5d$__$28$css__module$29$__["default"].createView,
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                                children: "Create PPO Test"
                            }, void 0, false, {
                                fileName: "[project]/src/app/ppo/page.tsx",
                                lineNumber: 324,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ppo$2f$ppo$2e$module$2e$css__$5b$app$2d$ssr$5d$__$28$css__module$29$__["default"].description,
                                children: "Configure your Product Page Optimization test to compare different versions of your product page"
                            }, void 0, false, {
                                fileName: "[project]/src/app/ppo/page.tsx",
                                lineNumber: 325,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ppo$2f$ppo$2e$module$2e$css__$5b$app$2d$ssr$5d$__$28$css__module$29$__["default"].form,
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ppo$2f$ppo$2e$module$2e$css__$5b$app$2d$ssr$5d$__$28$css__module$29$__["default"].formSection,
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
                                                children: "Basic Information"
                                            }, void 0, false, {
                                                fileName: "[project]/src/app/ppo/page.tsx",
                                                lineNumber: 331,
                                                columnNumber: 17
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ppo$2f$ppo$2e$module$2e$css__$5b$app$2d$ssr$5d$__$28$css__module$29$__["default"].formGroup,
                                                children: [
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                                        htmlFor: "app",
                                                        children: "Select App *"
                                                    }, void 0, false, {
                                                        fileName: "[project]/src/app/ppo/page.tsx",
                                                        lineNumber: 334,
                                                        columnNumber: 19
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("select", {
                                                        id: "app",
                                                        value: selectedApp,
                                                        onChange: (e)=>setSelectedApp(e.target.value),
                                                        className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ppo$2f$ppo$2e$module$2e$css__$5b$app$2d$ssr$5d$__$28$css__module$29$__["default"].select,
                                                        children: [
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                                                value: "",
                                                                children: "Choose an app..."
                                                            }, void 0, false, {
                                                                fileName: "[project]/src/app/ppo/page.tsx",
                                                                lineNumber: 341,
                                                                columnNumber: 21
                                                            }, this),
                                                            MOCK_APPS.map((app)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                                                    value: app.id,
                                                                    children: [
                                                                        app.name,
                                                                        " (",
                                                                        app.bundleId,
                                                                        ")"
                                                                    ]
                                                                }, app.id, true, {
                                                                    fileName: "[project]/src/app/ppo/page.tsx",
                                                                    lineNumber: 343,
                                                                    columnNumber: 23
                                                                }, this))
                                                        ]
                                                    }, void 0, true, {
                                                        fileName: "[project]/src/app/ppo/page.tsx",
                                                        lineNumber: 335,
                                                        columnNumber: 19
                                                    }, this)
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/src/app/ppo/page.tsx",
                                                lineNumber: 333,
                                                columnNumber: 17
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ppo$2f$ppo$2e$module$2e$css__$5b$app$2d$ssr$5d$__$28$css__module$29$__["default"].formGroup,
                                                children: [
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                                        htmlFor: "version",
                                                        children: "Control Version *"
                                                    }, void 0, false, {
                                                        fileName: "[project]/src/app/ppo/page.tsx",
                                                        lineNumber: 351,
                                                        columnNumber: 19
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("select", {
                                                        id: "version",
                                                        value: selectedVersion,
                                                        onChange: (e)=>setSelectedVersion(e.target.value),
                                                        className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ppo$2f$ppo$2e$module$2e$css__$5b$app$2d$ssr$5d$__$28$css__module$29$__["default"].select,
                                                        disabled: !selectedApp,
                                                        children: [
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                                                value: "",
                                                                children: "Choose a version..."
                                                            }, void 0, false, {
                                                                fileName: "[project]/src/app/ppo/page.tsx",
                                                                lineNumber: 359,
                                                                columnNumber: 21
                                                            }, this),
                                                            MOCK_VERSIONS.map((ver)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                                                    value: ver.id,
                                                                    children: [
                                                                        ver.versionString,
                                                                        " (",
                                                                        ver.state,
                                                                        ")"
                                                                    ]
                                                                }, ver.id, true, {
                                                                    fileName: "[project]/src/app/ppo/page.tsx",
                                                                    lineNumber: 361,
                                                                    columnNumber: 23
                                                                }, this))
                                                        ]
                                                    }, void 0, true, {
                                                        fileName: "[project]/src/app/ppo/page.tsx",
                                                        lineNumber: 352,
                                                        columnNumber: 19
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("small", {
                                                        children: "This is your current product page (control group)"
                                                    }, void 0, false, {
                                                        fileName: "[project]/src/app/ppo/page.tsx",
                                                        lineNumber: 366,
                                                        columnNumber: 19
                                                    }, this)
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/src/app/ppo/page.tsx",
                                                lineNumber: 350,
                                                columnNumber: 17
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ppo$2f$ppo$2e$module$2e$css__$5b$app$2d$ssr$5d$__$28$css__module$29$__["default"].formGroup,
                                                children: [
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                                        htmlFor: "testName",
                                                        children: "Test Name *"
                                                    }, void 0, false, {
                                                        fileName: "[project]/src/app/ppo/page.tsx",
                                                        lineNumber: 370,
                                                        columnNumber: 19
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                                        id: "testName",
                                                        type: "text",
                                                        value: testName,
                                                        onChange: (e)=>setTestName(e.target.value),
                                                        placeholder: "e.g., Holiday Campaign Screenshot Test",
                                                        className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ppo$2f$ppo$2e$module$2e$css__$5b$app$2d$ssr$5d$__$28$css__module$29$__["default"].input
                                                    }, void 0, false, {
                                                        fileName: "[project]/src/app/ppo/page.tsx",
                                                        lineNumber: 371,
                                                        columnNumber: 19
                                                    }, this)
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/src/app/ppo/page.tsx",
                                                lineNumber: 369,
                                                columnNumber: 17
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/src/app/ppo/page.tsx",
                                        lineNumber: 330,
                                        columnNumber: 15
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ppo$2f$ppo$2e$module$2e$css__$5b$app$2d$ssr$5d$__$28$css__module$29$__["default"].formSection,
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ppo$2f$ppo$2e$module$2e$css__$5b$app$2d$ssr$5d$__$28$css__module$29$__["default"].sectionHeader,
                                                children: [
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
                                                        children: "Traffic Distribution"
                                                    }, void 0, false, {
                                                        fileName: "[project]/src/app/ppo/page.tsx",
                                                        lineNumber: 384,
                                                        columnNumber: 19
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                        className: `${__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ppo$2f$ppo$2e$module$2e$css__$5b$app$2d$ssr$5d$__$28$css__module$29$__["default"].trafficTotal} ${trafficValid ? __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ppo$2f$ppo$2e$module$2e$css__$5b$app$2d$ssr$5d$__$28$css__module$29$__["default"].valid : __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ppo$2f$ppo$2e$module$2e$css__$5b$app$2d$ssr$5d$__$28$css__module$29$__["default"].invalid}`,
                                                        children: [
                                                            "Total: ",
                                                            totalTraffic.toFixed(0),
                                                            "%"
                                                        ]
                                                    }, void 0, true, {
                                                        fileName: "[project]/src/app/ppo/page.tsx",
                                                        lineNumber: 385,
                                                        columnNumber: 19
                                                    }, this)
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/src/app/ppo/page.tsx",
                                                lineNumber: 383,
                                                columnNumber: 17
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ppo$2f$ppo$2e$module$2e$css__$5b$app$2d$ssr$5d$__$28$css__module$29$__["default"].trafficControl,
                                                children: [
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                                        htmlFor: "controlTraffic",
                                                        children: "Control (Original)"
                                                    }, void 0, false, {
                                                        fileName: "[project]/src/app/ppo/page.tsx",
                                                        lineNumber: 391,
                                                        columnNumber: 19
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                        className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ppo$2f$ppo$2e$module$2e$css__$5b$app$2d$ssr$5d$__$28$css__module$29$__["default"].rangeGroup,
                                                        children: [
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                                                id: "controlTraffic",
                                                                type: "range",
                                                                min: "10",
                                                                max: "90",
                                                                value: controlTraffic,
                                                                onChange: (e)=>setControlTraffic(Number(e.target.value)),
                                                                className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ppo$2f$ppo$2e$module$2e$css__$5b$app$2d$ssr$5d$__$28$css__module$29$__["default"].range
                                                            }, void 0, false, {
                                                                fileName: "[project]/src/app/ppo/page.tsx",
                                                                lineNumber: 393,
                                                                columnNumber: 21
                                                            }, this),
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                                className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ppo$2f$ppo$2e$module$2e$css__$5b$app$2d$ssr$5d$__$28$css__module$29$__["default"].rangeValue,
                                                                children: [
                                                                    controlTraffic,
                                                                    "%"
                                                                ]
                                                            }, void 0, true, {
                                                                fileName: "[project]/src/app/ppo/page.tsx",
                                                                lineNumber: 402,
                                                                columnNumber: 21
                                                            }, this)
                                                        ]
                                                    }, void 0, true, {
                                                        fileName: "[project]/src/app/ppo/page.tsx",
                                                        lineNumber: 392,
                                                        columnNumber: 19
                                                    }, this)
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/src/app/ppo/page.tsx",
                                                lineNumber: 390,
                                                columnNumber: 17
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/src/app/ppo/page.tsx",
                                        lineNumber: 382,
                                        columnNumber: 15
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ppo$2f$ppo$2e$module$2e$css__$5b$app$2d$ssr$5d$__$28$css__module$29$__["default"].formSection,
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ppo$2f$ppo$2e$module$2e$css__$5b$app$2d$ssr$5d$__$28$css__module$29$__["default"].sectionHeader,
                                                children: [
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
                                                        children: "Treatments"
                                                    }, void 0, false, {
                                                        fileName: "[project]/src/app/ppo/page.tsx",
                                                        lineNumber: 409,
                                                        columnNumber: 19
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                        onClick: addTreatment,
                                                        className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ppo$2f$ppo$2e$module$2e$css__$5b$app$2d$ssr$5d$__$28$css__module$29$__["default"].secondaryButton,
                                                        disabled: treatments.length >= 3,
                                                        children: "+ Add Treatment"
                                                    }, void 0, false, {
                                                        fileName: "[project]/src/app/ppo/page.tsx",
                                                        lineNumber: 410,
                                                        columnNumber: 19
                                                    }, this)
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/src/app/ppo/page.tsx",
                                                lineNumber: 408,
                                                columnNumber: 17
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ppo$2f$ppo$2e$module$2e$css__$5b$app$2d$ssr$5d$__$28$css__module$29$__["default"].description,
                                                children: "Create 1-3 treatments to test against your control version"
                                            }, void 0, false, {
                                                fileName: "[project]/src/app/ppo/page.tsx",
                                                lineNumber: 418,
                                                columnNumber: 17
                                            }, this),
                                            treatments.map((treatment, index)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                    className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ppo$2f$ppo$2e$module$2e$css__$5b$app$2d$ssr$5d$__$28$css__module$29$__["default"].treatmentCard,
                                                    children: [
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                            className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ppo$2f$ppo$2e$module$2e$css__$5b$app$2d$ssr$5d$__$28$css__module$29$__["default"].treatmentHeader,
                                                            children: [
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                                                    type: "text",
                                                                    value: treatment.name,
                                                                    onChange: (e)=>updateTreatment(index, {
                                                                            name: e.target.value
                                                                        }),
                                                                    className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ppo$2f$ppo$2e$module$2e$css__$5b$app$2d$ssr$5d$__$28$css__module$29$__["default"].treatmentNameInput
                                                                }, void 0, false, {
                                                                    fileName: "[project]/src/app/ppo/page.tsx",
                                                                    lineNumber: 425,
                                                                    columnNumber: 23
                                                                }, this),
                                                                treatments.length > 1 && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                                    onClick: ()=>removeTreatment(index),
                                                                    className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ppo$2f$ppo$2e$module$2e$css__$5b$app$2d$ssr$5d$__$28$css__module$29$__["default"].removeButton,
                                                                    title: "Remove treatment",
                                                                    children: "×"
                                                                }, void 0, false, {
                                                                    fileName: "[project]/src/app/ppo/page.tsx",
                                                                    lineNumber: 432,
                                                                    columnNumber: 25
                                                                }, this)
                                                            ]
                                                        }, void 0, true, {
                                                            fileName: "[project]/src/app/ppo/page.tsx",
                                                            lineNumber: 424,
                                                            columnNumber: 21
                                                        }, this),
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                            className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ppo$2f$ppo$2e$module$2e$css__$5b$app$2d$ssr$5d$__$28$css__module$29$__["default"].formGroup,
                                                            children: [
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                                                    children: "Traffic Share"
                                                                }, void 0, false, {
                                                                    fileName: "[project]/src/app/ppo/page.tsx",
                                                                    lineNumber: 443,
                                                                    columnNumber: 23
                                                                }, this),
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                    className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ppo$2f$ppo$2e$module$2e$css__$5b$app$2d$ssr$5d$__$28$css__module$29$__["default"].rangeGroup,
                                                                    children: [
                                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                                                            type: "range",
                                                                            min: "0",
                                                                            max: 100 - controlTraffic,
                                                                            value: treatment.trafficProportion,
                                                                            onChange: (e)=>updateTreatment(index, {
                                                                                    trafficProportion: Number(e.target.value)
                                                                                }),
                                                                            className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ppo$2f$ppo$2e$module$2e$css__$5b$app$2d$ssr$5d$__$28$css__module$29$__["default"].range
                                                                        }, void 0, false, {
                                                                            fileName: "[project]/src/app/ppo/page.tsx",
                                                                            lineNumber: 445,
                                                                            columnNumber: 25
                                                                        }, this),
                                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                                            className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ppo$2f$ppo$2e$module$2e$css__$5b$app$2d$ssr$5d$__$28$css__module$29$__["default"].rangeValue,
                                                                            children: [
                                                                                treatment.trafficProportion,
                                                                                "%"
                                                                            ]
                                                                        }, void 0, true, {
                                                                            fileName: "[project]/src/app/ppo/page.tsx",
                                                                            lineNumber: 453,
                                                                            columnNumber: 25
                                                                        }, this)
                                                                    ]
                                                                }, void 0, true, {
                                                                    fileName: "[project]/src/app/ppo/page.tsx",
                                                                    lineNumber: 444,
                                                                    columnNumber: 23
                                                                }, this)
                                                            ]
                                                        }, void 0, true, {
                                                            fileName: "[project]/src/app/ppo/page.tsx",
                                                            lineNumber: 442,
                                                            columnNumber: 21
                                                        }, this),
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                            className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ppo$2f$ppo$2e$module$2e$css__$5b$app$2d$ssr$5d$__$28$css__module$29$__["default"].formGroup,
                                                            children: [
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                                                    children: "Locales"
                                                                }, void 0, false, {
                                                                    fileName: "[project]/src/app/ppo/page.tsx",
                                                                    lineNumber: 458,
                                                                    columnNumber: 23
                                                                }, this),
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                    className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ppo$2f$ppo$2e$module$2e$css__$5b$app$2d$ssr$5d$__$28$css__module$29$__["default"].localeGrid,
                                                                    children: LOCALES.map((locale)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                                                            className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ppo$2f$ppo$2e$module$2e$css__$5b$app$2d$ssr$5d$__$28$css__module$29$__["default"].checkboxLabel,
                                                                            children: [
                                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                                                                    type: "checkbox",
                                                                                    checked: treatment.locales.includes(locale.code),
                                                                                    onChange: ()=>toggleLocale(index, locale.code)
                                                                                }, void 0, false, {
                                                                                    fileName: "[project]/src/app/ppo/page.tsx",
                                                                                    lineNumber: 462,
                                                                                    columnNumber: 29
                                                                                }, this),
                                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                                                    children: locale.name
                                                                                }, void 0, false, {
                                                                                    fileName: "[project]/src/app/ppo/page.tsx",
                                                                                    lineNumber: 467,
                                                                                    columnNumber: 29
                                                                                }, this)
                                                                            ]
                                                                        }, locale.code, true, {
                                                                            fileName: "[project]/src/app/ppo/page.tsx",
                                                                            lineNumber: 461,
                                                                            columnNumber: 27
                                                                        }, this))
                                                                }, void 0, false, {
                                                                    fileName: "[project]/src/app/ppo/page.tsx",
                                                                    lineNumber: 459,
                                                                    columnNumber: 23
                                                                }, this),
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("small", {
                                                                    children: [
                                                                        treatment.locales.length,
                                                                        " locale(s) selected"
                                                                    ]
                                                                }, void 0, true, {
                                                                    fileName: "[project]/src/app/ppo/page.tsx",
                                                                    lineNumber: 471,
                                                                    columnNumber: 23
                                                                }, this)
                                                            ]
                                                        }, void 0, true, {
                                                            fileName: "[project]/src/app/ppo/page.tsx",
                                                            lineNumber: 457,
                                                            columnNumber: 21
                                                        }, this)
                                                    ]
                                                }, index, true, {
                                                    fileName: "[project]/src/app/ppo/page.tsx",
                                                    lineNumber: 423,
                                                    columnNumber: 19
                                                }, this)),
                                            !trafficValid && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ppo$2f$ppo$2e$module$2e$css__$5b$app$2d$ssr$5d$__$28$css__module$29$__["default"].warning,
                                                children: [
                                                    "⚠️ Traffic must add up to 100%. Current total: ",
                                                    totalTraffic.toFixed(0),
                                                    "%"
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/src/app/ppo/page.tsx",
                                                lineNumber: 477,
                                                columnNumber: 19
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/src/app/ppo/page.tsx",
                                        lineNumber: 407,
                                        columnNumber: 15
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ppo$2f$ppo$2e$module$2e$css__$5b$app$2d$ssr$5d$__$28$css__module$29$__["default"].formActions,
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                onClick: ()=>setActiveTab('list'),
                                                className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ppo$2f$ppo$2e$module$2e$css__$5b$app$2d$ssr$5d$__$28$css__module$29$__["default"].secondaryButton,
                                                children: "Cancel"
                                            }, void 0, false, {
                                                fileName: "[project]/src/app/ppo/page.tsx",
                                                lineNumber: 484,
                                                columnNumber: 17
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                onClick: handleCreate,
                                                className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ppo$2f$ppo$2e$module$2e$css__$5b$app$2d$ssr$5d$__$28$css__module$29$__["default"].primaryButton,
                                                disabled: !selectedApp || !selectedVersion || !testName || !trafficValid,
                                                children: "Create PPO Test"
                                            }, void 0, false, {
                                                fileName: "[project]/src/app/ppo/page.tsx",
                                                lineNumber: 490,
                                                columnNumber: 17
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/src/app/ppo/page.tsx",
                                        lineNumber: 483,
                                        columnNumber: 15
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/app/ppo/page.tsx",
                                lineNumber: 329,
                                columnNumber: 13
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/app/ppo/page.tsx",
                        lineNumber: 323,
                        columnNumber: 11
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/src/app/ppo/page.tsx",
                lineNumber: 232,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/src/app/ppo/page.tsx",
        lineNumber: 207,
        columnNumber: 5
    }, this);
}
}),
];

//# sourceMappingURL=%5Broot-of-the-server%5D__e8d3bbad._.js.map