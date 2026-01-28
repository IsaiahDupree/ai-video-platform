(globalThis.TURBOPACK || (globalThis.TURBOPACK = [])).push([typeof document === "object" ? document.currentScript : undefined,
"[project]/src/app/ads/batch/batch.module.css [app-client] (css module)", ((__turbopack_context__) => {

__turbopack_context__.v({
  "actions": "batch-module__XCvZ4W__actions",
  "buttonOutline": "batch-module__XCvZ4W__buttonOutline",
  "buttonPrimary": "batch-module__XCvZ4W__buttonPrimary",
  "buttonSecondary": "batch-module__XCvZ4W__buttonSecondary",
  "container": "batch-module__XCvZ4W__container",
  "error": "batch-module__XCvZ4W__error",
  "fileInput": "batch-module__XCvZ4W__fileInput",
  "fileName": "batch-module__XCvZ4W__fileName",
  "fileSize": "batch-module__XCvZ4W__fileSize",
  "header": "batch-module__XCvZ4W__header",
  "section": "batch-module__XCvZ4W__section",
  "sectionHeader": "batch-module__XCvZ4W__sectionHeader",
  "sectionTitle": "batch-module__XCvZ4W__sectionTitle",
  "select": "batch-module__XCvZ4W__select",
  "stepNumber": "batch-module__XCvZ4W__stepNumber",
  "subtitle": "batch-module__XCvZ4W__subtitle",
  "title": "batch-module__XCvZ4W__title",
  "uploadArea": "batch-module__XCvZ4W__uploadArea",
  "uploadIcon": "batch-module__XCvZ4W__uploadIcon",
  "uploadLabel": "batch-module__XCvZ4W__uploadLabel",
});
}),
"[project]/src/app/ads/batch/components/ColumnMappingForm.module.css [app-client] (css module)", ((__turbopack_context__) => {

__turbopack_context__.v({
  "actions": "ColumnMappingForm-module__Mt7egW__actions",
  "buttonSmall": "ColumnMappingForm-module__Mt7egW__buttonSmall",
  "clearButton": "ColumnMappingForm-module__Mt7egW__clearButton",
  "compact": "ColumnMappingForm-module__Mt7egW__compact",
  "container": "ColumnMappingForm-module__Mt7egW__container",
  "defaultValue": "ColumnMappingForm-module__Mt7egW__defaultValue",
  "fieldDescription": "ColumnMappingForm-module__Mt7egW__fieldDescription",
  "fieldName": "ColumnMappingForm-module__Mt7egW__fieldName",
  "helpText": "ColumnMappingForm-module__Mt7egW__helpText",
  "sampleValue": "ColumnMappingForm-module__Mt7egW__sampleValue",
  "select": "ColumnMappingForm-module__Mt7egW__select",
  "summary": "ColumnMappingForm-module__Mt7egW__summary",
  "summaryItem": "ColumnMappingForm-module__Mt7egW__summaryItem",
  "table": "ColumnMappingForm-module__Mt7egW__table",
  "tableBody": "ColumnMappingForm-module__Mt7egW__tableBody",
  "tableCell": "ColumnMappingForm-module__Mt7egW__tableCell",
  "tableHeader": "ColumnMappingForm-module__Mt7egW__tableHeader",
  "tableHeaderCell": "ColumnMappingForm-module__Mt7egW__tableHeaderCell",
  "tableRow": "ColumnMappingForm-module__Mt7egW__tableRow",
  "tableRowMapped": "ColumnMappingForm-module__Mt7egW__tableRowMapped",
});
}),
"[project]/src/app/ads/batch/components/ColumnMappingForm.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>ColumnMappingForm
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
/**
 * Column Mapping Form Component
 * Maps CSV columns to template fields
 */ var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ads$2f$batch$2f$components$2f$ColumnMappingForm$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__ = __turbopack_context__.i("[project]/src/app/ads/batch/components/ColumnMappingForm.module.css [app-client] (css module)");
;
var _s = __turbopack_context__.k.signature();
'use client';
;
;
// Template field definitions with descriptions
const TEMPLATE_FIELDS = [
    {
        key: 'headline',
        label: 'Headline',
        description: 'Main headline text',
        required: false
    },
    {
        key: 'subheadline',
        label: 'Subheadline',
        description: 'Secondary headline text',
        required: false
    },
    {
        key: 'body',
        label: 'Body Text',
        description: 'Main body content',
        required: false
    },
    {
        key: 'cta',
        label: 'Call-to-Action',
        description: 'CTA button text',
        required: false
    },
    {
        key: 'backgroundImage',
        label: 'Background Image',
        description: 'URL or path to background image',
        required: false
    },
    {
        key: 'productImage',
        label: 'Product Image',
        description: 'URL or path to product/feature image',
        required: false
    },
    {
        key: 'logo',
        label: 'Logo',
        description: 'URL or path to logo image',
        required: false
    },
    {
        key: 'backgroundColor',
        label: 'Background Color',
        description: 'Hex color code (e.g., #3b82f6)',
        required: false
    },
    {
        key: 'primaryColor',
        label: 'Primary Color',
        description: 'Hex color code for primary brand color',
        required: false
    },
    {
        key: 'uniqueId',
        label: 'Unique ID',
        description: 'Unique identifier (SKU, product ID, etc.)',
        required: false
    }
];
function ColumnMappingForm({ headers, sampleRows, template, columnMapping, onMappingUpdate, disabled = false }) {
    _s();
    const [localMapping, setLocalMapping] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(columnMapping);
    const [showSamples, setShowSamples] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(true);
    // Update parent when local mapping changes
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "ColumnMappingForm.useEffect": ()=>{
            onMappingUpdate(localMapping);
        }
    }["ColumnMappingForm.useEffect"], [
        localMapping,
        onMappingUpdate
    ]);
    // Auto-detect mappings based on column names
    const autoDetectMappings = ()=>{
        const newMapping = {};
        TEMPLATE_FIELDS.forEach((field)=>{
            // Look for exact match or similar column name
            const matchingHeader = headers.find((header)=>{
                const normalizedHeader = header.toLowerCase().replace(/[_\s-]/g, '');
                const normalizedField = field.key.toLowerCase().replace(/[_\s-]/g, '');
                return normalizedHeader === normalizedField || normalizedHeader.includes(normalizedField) || normalizedField.includes(normalizedHeader);
            });
            if (matchingHeader) {
                newMapping[field.key] = matchingHeader;
            }
        });
        setLocalMapping(newMapping);
    };
    // Handle mapping change
    const handleMappingChange = (fieldKey, columnName)=>{
        setLocalMapping((prev)=>({
                ...prev,
                [fieldKey]: columnName || undefined
            }));
    };
    // Clear mapping for a field
    const handleClearMapping = (fieldKey)=>{
        setLocalMapping((prev)=>{
            const updated = {
                ...prev
            };
            delete updated[fieldKey];
            return updated;
        });
    };
    // Clear all mappings
    const clearAllMappings = ()=>{
        setLocalMapping({});
    };
    // Get sample value for a mapping
    const getSampleValue = (columnName)=>{
        if (!columnName || sampleRows.length === 0) return '—';
        return sampleRows[0][columnName] || '—';
    };
    // Get current template value for a field
    const getTemplateValue = (fieldKey)=>{
        if (fieldKey === 'primaryColor') {
            return template.style.primaryColor || '—';
        }
        return template.content[fieldKey] || '—';
    };
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ads$2f$batch$2f$components$2f$ColumnMappingForm$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].container,
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ads$2f$batch$2f$components$2f$ColumnMappingForm$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].actions,
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                        onClick: autoDetectMappings,
                        className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ads$2f$batch$2f$components$2f$ColumnMappingForm$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].buttonSmall,
                        disabled: disabled,
                        children: "Auto-detect"
                    }, void 0, false, {
                        fileName: "[project]/src/app/ads/batch/components/ColumnMappingForm.tsx",
                        lineNumber: 164,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                        onClick: clearAllMappings,
                        className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ads$2f$batch$2f$components$2f$ColumnMappingForm$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].buttonSmall,
                        disabled: disabled,
                        children: "Clear All"
                    }, void 0, false, {
                        fileName: "[project]/src/app/ads/batch/components/ColumnMappingForm.tsx",
                        lineNumber: 171,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                        onClick: ()=>setShowSamples(!showSamples),
                        className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ads$2f$batch$2f$components$2f$ColumnMappingForm$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].buttonSmall,
                        children: [
                            showSamples ? 'Hide' : 'Show',
                            " Samples"
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/app/ads/batch/components/ColumnMappingForm.tsx",
                        lineNumber: 178,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/src/app/ads/batch/components/ColumnMappingForm.tsx",
                lineNumber: 163,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ads$2f$batch$2f$components$2f$ColumnMappingForm$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].table,
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ads$2f$batch$2f$components$2f$ColumnMappingForm$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].tableHeader,
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ads$2f$batch$2f$components$2f$ColumnMappingForm$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].tableHeaderCell,
                                children: "Template Field"
                            }, void 0, false, {
                                fileName: "[project]/src/app/ads/batch/components/ColumnMappingForm.tsx",
                                lineNumber: 189,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ads$2f$batch$2f$components$2f$ColumnMappingForm$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].tableHeaderCell,
                                children: "CSV Column"
                            }, void 0, false, {
                                fileName: "[project]/src/app/ads/batch/components/ColumnMappingForm.tsx",
                                lineNumber: 190,
                                columnNumber: 11
                            }, this),
                            showSamples && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Fragment"], {
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ads$2f$batch$2f$components$2f$ColumnMappingForm$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].tableHeaderCell,
                                        children: "Sample Value"
                                    }, void 0, false, {
                                        fileName: "[project]/src/app/ads/batch/components/ColumnMappingForm.tsx",
                                        lineNumber: 193,
                                        columnNumber: 15
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ads$2f$batch$2f$components$2f$ColumnMappingForm$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].tableHeaderCell,
                                        children: "Current Default"
                                    }, void 0, false, {
                                        fileName: "[project]/src/app/ads/batch/components/ColumnMappingForm.tsx",
                                        lineNumber: 194,
                                        columnNumber: 15
                                    }, this)
                                ]
                            }, void 0, true),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ads$2f$batch$2f$components$2f$ColumnMappingForm$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].tableHeaderCell,
                                children: "Actions"
                            }, void 0, false, {
                                fileName: "[project]/src/app/ads/batch/components/ColumnMappingForm.tsx",
                                lineNumber: 197,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/app/ads/batch/components/ColumnMappingForm.tsx",
                        lineNumber: 188,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ads$2f$batch$2f$components$2f$ColumnMappingForm$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].tableBody,
                        children: TEMPLATE_FIELDS.map((field)=>{
                            const currentMapping = localMapping[field.key];
                            const isMapped = !!currentMapping;
                            return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: `${__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ads$2f$batch$2f$components$2f$ColumnMappingForm$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].tableRow} ${isMapped ? __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ads$2f$batch$2f$components$2f$ColumnMappingForm$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].tableRowMapped : ''}`,
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ads$2f$batch$2f$components$2f$ColumnMappingForm$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].tableCell,
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ads$2f$batch$2f$components$2f$ColumnMappingForm$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].fieldName,
                                                children: field.label
                                            }, void 0, false, {
                                                fileName: "[project]/src/app/ads/batch/components/ColumnMappingForm.tsx",
                                                lineNumber: 212,
                                                columnNumber: 19
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ads$2f$batch$2f$components$2f$ColumnMappingForm$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].fieldDescription,
                                                children: field.description
                                            }, void 0, false, {
                                                fileName: "[project]/src/app/ads/batch/components/ColumnMappingForm.tsx",
                                                lineNumber: 213,
                                                columnNumber: 19
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/src/app/ads/batch/components/ColumnMappingForm.tsx",
                                        lineNumber: 211,
                                        columnNumber: 17
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ads$2f$batch$2f$components$2f$ColumnMappingForm$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].tableCell,
                                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("select", {
                                            value: currentMapping || '',
                                            onChange: (e)=>handleMappingChange(field.key, e.target.value),
                                            className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ads$2f$batch$2f$components$2f$ColumnMappingForm$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].select,
                                            disabled: disabled,
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                                    value: "",
                                                    children: "— Not mapped —"
                                                }, void 0, false, {
                                                    fileName: "[project]/src/app/ads/batch/components/ColumnMappingForm.tsx",
                                                    lineNumber: 224,
                                                    columnNumber: 21
                                                }, this),
                                                headers.map((header)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                                        value: header,
                                                        children: header
                                                    }, header, false, {
                                                        fileName: "[project]/src/app/ads/batch/components/ColumnMappingForm.tsx",
                                                        lineNumber: 226,
                                                        columnNumber: 23
                                                    }, this))
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/src/app/ads/batch/components/ColumnMappingForm.tsx",
                                            lineNumber: 218,
                                            columnNumber: 19
                                        }, this)
                                    }, void 0, false, {
                                        fileName: "[project]/src/app/ads/batch/components/ColumnMappingForm.tsx",
                                        lineNumber: 217,
                                        columnNumber: 17
                                    }, this),
                                    showSamples && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Fragment"], {
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ads$2f$batch$2f$components$2f$ColumnMappingForm$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].tableCell,
                                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                    className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ads$2f$batch$2f$components$2f$ColumnMappingForm$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].sampleValue,
                                                    children: getSampleValue(currentMapping)
                                                }, void 0, false, {
                                                    fileName: "[project]/src/app/ads/batch/components/ColumnMappingForm.tsx",
                                                    lineNumber: 237,
                                                    columnNumber: 23
                                                }, this)
                                            }, void 0, false, {
                                                fileName: "[project]/src/app/ads/batch/components/ColumnMappingForm.tsx",
                                                lineNumber: 236,
                                                columnNumber: 21
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ads$2f$batch$2f$components$2f$ColumnMappingForm$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].tableCell,
                                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                    className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ads$2f$batch$2f$components$2f$ColumnMappingForm$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].defaultValue,
                                                    children: getTemplateValue(field.key)
                                                }, void 0, false, {
                                                    fileName: "[project]/src/app/ads/batch/components/ColumnMappingForm.tsx",
                                                    lineNumber: 244,
                                                    columnNumber: 23
                                                }, this)
                                            }, void 0, false, {
                                                fileName: "[project]/src/app/ads/batch/components/ColumnMappingForm.tsx",
                                                lineNumber: 243,
                                                columnNumber: 21
                                            }, this)
                                        ]
                                    }, void 0, true),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ads$2f$batch$2f$components$2f$ColumnMappingForm$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].tableCell,
                                        children: isMapped && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                            onClick: ()=>handleClearMapping(field.key),
                                            className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ads$2f$batch$2f$components$2f$ColumnMappingForm$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].clearButton,
                                            disabled: disabled,
                                            title: "Clear mapping",
                                            children: "✕"
                                        }, void 0, false, {
                                            fileName: "[project]/src/app/ads/batch/components/ColumnMappingForm.tsx",
                                            lineNumber: 254,
                                            columnNumber: 21
                                        }, this)
                                    }, void 0, false, {
                                        fileName: "[project]/src/app/ads/batch/components/ColumnMappingForm.tsx",
                                        lineNumber: 252,
                                        columnNumber: 17
                                    }, this)
                                ]
                            }, field.key, true, {
                                fileName: "[project]/src/app/ads/batch/components/ColumnMappingForm.tsx",
                                lineNumber: 206,
                                columnNumber: 15
                            }, this);
                        })
                    }, void 0, false, {
                        fileName: "[project]/src/app/ads/batch/components/ColumnMappingForm.tsx",
                        lineNumber: 200,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/src/app/ads/batch/components/ColumnMappingForm.tsx",
                lineNumber: 187,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ads$2f$batch$2f$components$2f$ColumnMappingForm$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].summary,
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ads$2f$batch$2f$components$2f$ColumnMappingForm$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].summaryItem,
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("strong", {
                                children: "CSV Columns:"
                            }, void 0, false, {
                                fileName: "[project]/src/app/ads/batch/components/ColumnMappingForm.tsx",
                                lineNumber: 273,
                                columnNumber: 11
                            }, this),
                            " ",
                            headers.length
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/app/ads/batch/components/ColumnMappingForm.tsx",
                        lineNumber: 272,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ads$2f$batch$2f$components$2f$ColumnMappingForm$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].summaryItem,
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("strong", {
                                children: "Mapped Fields:"
                            }, void 0, false, {
                                fileName: "[project]/src/app/ads/batch/components/ColumnMappingForm.tsx",
                                lineNumber: 276,
                                columnNumber: 11
                            }, this),
                            " ",
                            Object.keys(localMapping).length
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/app/ads/batch/components/ColumnMappingForm.tsx",
                        lineNumber: 275,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ads$2f$batch$2f$components$2f$ColumnMappingForm$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].summaryItem,
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("strong", {
                                children: "Sample Rows:"
                            }, void 0, false, {
                                fileName: "[project]/src/app/ads/batch/components/ColumnMappingForm.tsx",
                                lineNumber: 279,
                                columnNumber: 11
                            }, this),
                            " ",
                            sampleRows.length
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/app/ads/batch/components/ColumnMappingForm.tsx",
                        lineNumber: 278,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/src/app/ads/batch/components/ColumnMappingForm.tsx",
                lineNumber: 271,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ads$2f$batch$2f$components$2f$ColumnMappingForm$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].helpText,
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                    children: [
                        "💡 ",
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("strong", {
                            children: "Tip:"
                        }, void 0, false, {
                            fileName: "[project]/src/app/ads/batch/components/ColumnMappingForm.tsx",
                            lineNumber: 286,
                            columnNumber: 14
                        }, this),
                        ' Click "Auto-detect" to automatically match column names to template fields. Unmapped fields will use the template\'s default values.'
                    ]
                }, void 0, true, {
                    fileName: "[project]/src/app/ads/batch/components/ColumnMappingForm.tsx",
                    lineNumber: 285,
                    columnNumber: 9
                }, this)
            }, void 0, false, {
                fileName: "[project]/src/app/ads/batch/components/ColumnMappingForm.tsx",
                lineNumber: 284,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/src/app/ads/batch/components/ColumnMappingForm.tsx",
        lineNumber: 161,
        columnNumber: 5
    }, this);
}
_s(ColumnMappingForm, "tjKaGzjedfzZDvkhGYzhjU23ads=");
_c = ColumnMappingForm;
var _c;
__turbopack_context__.k.register(_c, "ColumnMappingForm");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/src/app/ads/batch/components/PreviewGrid.module.css [app-client] (css module)", ((__turbopack_context__) => {

__turbopack_context__.v({
  "card": "PreviewGrid-module__L5-mUa__card",
  "cardFooter": "PreviewGrid-module__L5-mUa__cardFooter",
  "empty": "PreviewGrid-module__L5-mUa__empty",
  "error": "PreviewGrid-module__L5-mUa__error",
  "errorDetails": "PreviewGrid-module__L5-mUa__errorDetails",
  "errorIcon": "PreviewGrid-module__L5-mUa__errorIcon",
  "errorText": "PreviewGrid-module__L5-mUa__errorText",
  "grid": "PreviewGrid-module__L5-mUa__grid",
  "image": "PreviewGrid-module__L5-mUa__image",
  "imageContainer": "PreviewGrid-module__L5-mUa__imageContainer",
  "loading": "PreviewGrid-module__L5-mUa__loading",
  "rowLabel": "PreviewGrid-module__L5-mUa__rowLabel",
});
}),
"[project]/src/app/ads/batch/components/PreviewGrid.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>PreviewGrid
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
/**
 * Preview Grid Component
 * Display preview images from batch render
 */ var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ads$2f$batch$2f$components$2f$PreviewGrid$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__ = __turbopack_context__.i("[project]/src/app/ads/batch/components/PreviewGrid.module.css [app-client] (css module)");
;
var _s = __turbopack_context__.k.signature();
'use client';
;
;
function PreviewGrid({ jobId }) {
    _s();
    const [assets, setAssets] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])([]);
    const [loading, setLoading] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(true);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "PreviewGrid.useEffect": ()=>{
            if (!jobId) {
                setLoading(false);
                return;
            }
            // Fetch preview assets
            fetch(`/api/ads/batch/preview-assets/${jobId}`).then({
                "PreviewGrid.useEffect": (res)=>res.json()
            }["PreviewGrid.useEffect"]).then({
                "PreviewGrid.useEffect": (data)=>{
                    setAssets(data.assets || []);
                    setLoading(false);
                }
            }["PreviewGrid.useEffect"]).catch({
                "PreviewGrid.useEffect": (err)=>{
                    console.error('Error loading preview assets:', err);
                    setLoading(false);
                }
            }["PreviewGrid.useEffect"]);
        }
    }["PreviewGrid.useEffect"], [
        jobId
    ]);
    if (loading) {
        return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ads$2f$batch$2f$components$2f$PreviewGrid$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].loading,
            children: "Loading previews..."
        }, void 0, false, {
            fileName: "[project]/src/app/ads/batch/components/PreviewGrid.tsx",
            lineNumber: 47,
            columnNumber: 12
        }, this);
    }
    if (assets.length === 0) {
        return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ads$2f$batch$2f$components$2f$PreviewGrid$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].empty,
            children: "No preview assets available. Generate a preview to see results."
        }, void 0, false, {
            fileName: "[project]/src/app/ads/batch/components/PreviewGrid.tsx",
            lineNumber: 52,
            columnNumber: 7
        }, this);
    }
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ads$2f$batch$2f$components$2f$PreviewGrid$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].grid,
        children: assets.map((asset)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ads$2f$batch$2f$components$2f$PreviewGrid$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].card,
                children: asset.status === 'completed' ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Fragment"], {
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ads$2f$batch$2f$components$2f$PreviewGrid$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].imageContainer,
                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("img", {
                                src: `/api/ads/batch/asset/${jobId}/${asset.filePath}`,
                                alt: `Preview ${asset.rowIndex}`,
                                className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ads$2f$batch$2f$components$2f$PreviewGrid$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].image
                            }, void 0, false, {
                                fileName: "[project]/src/app/ads/batch/components/PreviewGrid.tsx",
                                lineNumber: 65,
                                columnNumber: 17
                            }, this)
                        }, void 0, false, {
                            fileName: "[project]/src/app/ads/batch/components/PreviewGrid.tsx",
                            lineNumber: 64,
                            columnNumber: 15
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ads$2f$batch$2f$components$2f$PreviewGrid$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].cardFooter,
                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ads$2f$batch$2f$components$2f$PreviewGrid$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].rowLabel,
                                children: [
                                    "Row ",
                                    asset.rowIndex
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/app/ads/batch/components/PreviewGrid.tsx",
                                lineNumber: 72,
                                columnNumber: 17
                            }, this)
                        }, void 0, false, {
                            fileName: "[project]/src/app/ads/batch/components/PreviewGrid.tsx",
                            lineNumber: 71,
                            columnNumber: 15
                        }, this)
                    ]
                }, void 0, true) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ads$2f$batch$2f$components$2f$PreviewGrid$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].error,
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ads$2f$batch$2f$components$2f$PreviewGrid$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].errorIcon,
                            children: "✕"
                        }, void 0, false, {
                            fileName: "[project]/src/app/ads/batch/components/PreviewGrid.tsx",
                            lineNumber: 77,
                            columnNumber: 15
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ads$2f$batch$2f$components$2f$PreviewGrid$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].errorText,
                            children: [
                                "Failed to render row ",
                                asset.rowIndex
                            ]
                        }, void 0, true, {
                            fileName: "[project]/src/app/ads/batch/components/PreviewGrid.tsx",
                            lineNumber: 78,
                            columnNumber: 15
                        }, this),
                        asset.error && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ads$2f$batch$2f$components$2f$PreviewGrid$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].errorDetails,
                            children: asset.error
                        }, void 0, false, {
                            fileName: "[project]/src/app/ads/batch/components/PreviewGrid.tsx",
                            lineNumber: 82,
                            columnNumber: 17
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/src/app/ads/batch/components/PreviewGrid.tsx",
                    lineNumber: 76,
                    columnNumber: 13
                }, this)
            }, asset.id, false, {
                fileName: "[project]/src/app/ads/batch/components/PreviewGrid.tsx",
                lineNumber: 61,
                columnNumber: 9
            }, this))
    }, void 0, false, {
        fileName: "[project]/src/app/ads/batch/components/PreviewGrid.tsx",
        lineNumber: 59,
        columnNumber: 5
    }, this);
}
_s(PreviewGrid, "1xSI1Sa/J/AuAcHtQhrBpTz/vtw=");
_c = PreviewGrid;
var _c;
__turbopack_context__.k.register(_c, "PreviewGrid");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/src/app/ads/batch/components/BatchJobStatus.module.css [app-client] (css module)", ((__turbopack_context__) => {

__turbopack_context__.v({
  "actions": "BatchJobStatus-module__UNPJba__actions",
  "container": "BatchJobStatus-module__UNPJba__container",
  "downloadButton": "BatchJobStatus-module__UNPJba__downloadButton",
  "error": "BatchJobStatus-module__UNPJba__error",
  "manifestButton": "BatchJobStatus-module__UNPJba__manifestButton",
  "progress": "BatchJobStatus-module__UNPJba__progress",
  "progressBar": "BatchJobStatus-module__UNPJba__progressBar",
  "progressFill": "BatchJobStatus-module__UNPJba__progressFill",
  "progressText": "BatchJobStatus-module__UNPJba__progressText",
  "spin": "BatchJobStatus-module__UNPJba__spin",
  "statError": "BatchJobStatus-module__UNPJba__statError",
  "statItem": "BatchJobStatus-module__UNPJba__statItem",
  "statLabel": "BatchJobStatus-module__UNPJba__statLabel",
  "statValue": "BatchJobStatus-module__UNPJba__statValue",
  "stats": "BatchJobStatus-module__UNPJba__stats",
  "statusBadge": "BatchJobStatus-module__UNPJba__statusBadge",
  "statusDefault": "BatchJobStatus-module__UNPJba__statusDefault",
  "statusError": "BatchJobStatus-module__UNPJba__statusError",
  "statusIcon": "BatchJobStatus-module__UNPJba__statusIcon",
  "statusProcessing": "BatchJobStatus-module__UNPJba__statusProcessing",
  "statusSuccess": "BatchJobStatus-module__UNPJba__statusSuccess",
  "statusText": "BatchJobStatus-module__UNPJba__statusText",
});
}),
"[project]/src/app/ads/batch/components/BatchJobStatus.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>BatchJobStatus
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
/**
 * Batch Job Status Component
 * Display batch rendering job status and progress
 */ var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ads$2f$batch$2f$components$2f$BatchJobStatus$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__ = __turbopack_context__.i("[project]/src/app/ads/batch/components/BatchJobStatus.module.css [app-client] (css module)");
'use client';
;
;
function BatchJobStatus({ job }) {
    const getStatusColor = ()=>{
        switch(job.status){
            case 'completed':
                return __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ads$2f$batch$2f$components$2f$BatchJobStatus$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].statusSuccess;
            case 'error':
                return __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ads$2f$batch$2f$components$2f$BatchJobStatus$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].statusError;
            case 'rendering':
                return __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ads$2f$batch$2f$components$2f$BatchJobStatus$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].statusProcessing;
            default:
                return __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ads$2f$batch$2f$components$2f$BatchJobStatus$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].statusDefault;
        }
    };
    const getStatusIcon = ()=>{
        switch(job.status){
            case 'completed':
                return '✓';
            case 'error':
                return '✕';
            case 'rendering':
                return '⟳';
            case 'previewing':
                return '👁';
            case 'mapping':
                return '🗺';
            default:
                return '○';
        }
    };
    const getStatusText = ()=>{
        switch(job.status){
            case 'mapping':
                return 'Mapping columns...';
            case 'previewing':
                return 'Generating preview...';
            case 'rendering':
                return 'Rendering ads...';
            case 'completed':
                return 'Batch complete!';
            case 'error':
                return 'Error occurred';
            default:
                return 'Ready';
        }
    };
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ads$2f$batch$2f$components$2f$BatchJobStatus$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].container,
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: `${__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ads$2f$batch$2f$components$2f$BatchJobStatus$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].statusBadge} ${getStatusColor()}`,
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                        className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ads$2f$batch$2f$components$2f$BatchJobStatus$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].statusIcon,
                        children: getStatusIcon()
                    }, void 0, false, {
                        fileName: "[project]/src/app/ads/batch/components/BatchJobStatus.tsx",
                        lineNumber: 73,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                        className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ads$2f$batch$2f$components$2f$BatchJobStatus$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].statusText,
                        children: getStatusText()
                    }, void 0, false, {
                        fileName: "[project]/src/app/ads/batch/components/BatchJobStatus.tsx",
                        lineNumber: 74,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/src/app/ads/batch/components/BatchJobStatus.tsx",
                lineNumber: 72,
                columnNumber: 7
            }, this),
            job.status === 'rendering' && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ads$2f$batch$2f$components$2f$BatchJobStatus$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].progress,
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ads$2f$batch$2f$components$2f$BatchJobStatus$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].progressBar,
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ads$2f$batch$2f$components$2f$BatchJobStatus$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].progressFill,
                            style: {
                                width: `${job.progress}%`
                            }
                        }, void 0, false, {
                            fileName: "[project]/src/app/ads/batch/components/BatchJobStatus.tsx",
                            lineNumber: 80,
                            columnNumber: 13
                        }, this)
                    }, void 0, false, {
                        fileName: "[project]/src/app/ads/batch/components/BatchJobStatus.tsx",
                        lineNumber: 79,
                        columnNumber: 11
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ads$2f$batch$2f$components$2f$BatchJobStatus$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].progressText,
                        children: [
                            job.progress,
                            "% (",
                            job.completedAssets,
                            " / ",
                            job.totalAssets,
                            ")"
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/app/ads/batch/components/BatchJobStatus.tsx",
                        lineNumber: 85,
                        columnNumber: 11
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/src/app/ads/batch/components/BatchJobStatus.tsx",
                lineNumber: 78,
                columnNumber: 9
            }, this),
            (job.status === 'completed' || job.status === 'previewing') && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ads$2f$batch$2f$components$2f$BatchJobStatus$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].stats,
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ads$2f$batch$2f$components$2f$BatchJobStatus$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].statItem,
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ads$2f$batch$2f$components$2f$BatchJobStatus$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].statValue,
                                children: job.totalAssets
                            }, void 0, false, {
                                fileName: "[project]/src/app/ads/batch/components/BatchJobStatus.tsx",
                                lineNumber: 94,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ads$2f$batch$2f$components$2f$BatchJobStatus$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].statLabel,
                                children: "Total Assets"
                            }, void 0, false, {
                                fileName: "[project]/src/app/ads/batch/components/BatchJobStatus.tsx",
                                lineNumber: 95,
                                columnNumber: 13
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/app/ads/batch/components/BatchJobStatus.tsx",
                        lineNumber: 93,
                        columnNumber: 11
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ads$2f$batch$2f$components$2f$BatchJobStatus$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].statItem,
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ads$2f$batch$2f$components$2f$BatchJobStatus$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].statValue,
                                children: job.completedAssets
                            }, void 0, false, {
                                fileName: "[project]/src/app/ads/batch/components/BatchJobStatus.tsx",
                                lineNumber: 98,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ads$2f$batch$2f$components$2f$BatchJobStatus$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].statLabel,
                                children: "Completed"
                            }, void 0, false, {
                                fileName: "[project]/src/app/ads/batch/components/BatchJobStatus.tsx",
                                lineNumber: 99,
                                columnNumber: 13
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/app/ads/batch/components/BatchJobStatus.tsx",
                        lineNumber: 97,
                        columnNumber: 11
                    }, this),
                    job.failedAssets > 0 && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ads$2f$batch$2f$components$2f$BatchJobStatus$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].statItem,
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: `${__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ads$2f$batch$2f$components$2f$BatchJobStatus$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].statValue} ${__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ads$2f$batch$2f$components$2f$BatchJobStatus$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].statError}`,
                                children: job.failedAssets
                            }, void 0, false, {
                                fileName: "[project]/src/app/ads/batch/components/BatchJobStatus.tsx",
                                lineNumber: 103,
                                columnNumber: 15
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ads$2f$batch$2f$components$2f$BatchJobStatus$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].statLabel,
                                children: "Failed"
                            }, void 0, false, {
                                fileName: "[project]/src/app/ads/batch/components/BatchJobStatus.tsx",
                                lineNumber: 106,
                                columnNumber: 15
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/app/ads/batch/components/BatchJobStatus.tsx",
                        lineNumber: 102,
                        columnNumber: 13
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/src/app/ads/batch/components/BatchJobStatus.tsx",
                lineNumber: 92,
                columnNumber: 9
            }, this),
            job.error && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ads$2f$batch$2f$components$2f$BatchJobStatus$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].error,
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("strong", {
                        children: "Error:"
                    }, void 0, false, {
                        fileName: "[project]/src/app/ads/batch/components/BatchJobStatus.tsx",
                        lineNumber: 114,
                        columnNumber: 11
                    }, this),
                    " ",
                    job.error
                ]
            }, void 0, true, {
                fileName: "[project]/src/app/ads/batch/components/BatchJobStatus.tsx",
                lineNumber: 113,
                columnNumber: 9
            }, this),
            job.jobId && job.status === 'completed' && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ads$2f$batch$2f$components$2f$BatchJobStatus$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].actions,
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("a", {
                        href: `/api/ads/batch/download/${job.jobId}`,
                        className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ads$2f$batch$2f$components$2f$BatchJobStatus$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].downloadButton,
                        download: true,
                        children: "📦 Download ZIP"
                    }, void 0, false, {
                        fileName: "[project]/src/app/ads/batch/components/BatchJobStatus.tsx",
                        lineNumber: 120,
                        columnNumber: 11
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("a", {
                        href: `/api/ads/batch/manifest/${job.jobId}`,
                        className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ads$2f$batch$2f$components$2f$BatchJobStatus$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].manifestButton,
                        target: "_blank",
                        rel: "noopener noreferrer",
                        children: "📄 View Manifest"
                    }, void 0, false, {
                        fileName: "[project]/src/app/ads/batch/components/BatchJobStatus.tsx",
                        lineNumber: 127,
                        columnNumber: 11
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/src/app/ads/batch/components/BatchJobStatus.tsx",
                lineNumber: 119,
                columnNumber: 9
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/src/app/ads/batch/components/BatchJobStatus.tsx",
        lineNumber: 71,
        columnNumber: 5
    }, this);
}
_c = BatchJobStatus;
var _c;
__turbopack_context__.k.register(_c, "BatchJobStatus");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/src/app/ads/batch/page.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>BatchImportPage
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
/**
 * ADS-013: Column Mapping UI
 * Upload CSV and map columns to template fields
 */ var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ads$2f$batch$2f$batch$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__ = __turbopack_context__.i("[project]/src/app/ads/batch/batch.module.css [app-client] (css module)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ads$2f$batch$2f$components$2f$ColumnMappingForm$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/app/ads/batch/components/ColumnMappingForm.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ads$2f$batch$2f$components$2f$PreviewGrid$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/app/ads/batch/components/PreviewGrid.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ads$2f$batch$2f$components$2f$BatchJobStatus$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/app/ads/batch/components/BatchJobStatus.tsx [app-client] (ecmascript)");
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
function BatchImportPage() {
    _s();
    const [csvState, setCSVState] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])({
        file: null,
        headers: [],
        sampleRows: [],
        error: null
    });
    const [selectedTemplate, setSelectedTemplate] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])('example-hero-ad');
    const [template, setTemplate] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(null);
    const [columnMapping, setColumnMapping] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])({});
    const [batchJob, setBatchJob] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])({
        jobId: null,
        status: 'idle',
        progress: 0,
        totalAssets: 0,
        completedAssets: 0,
        failedAssets: 0,
        error: null
    });
    // Load template
    const loadTemplate = async (templateId)=>{
        try {
            const response = await fetch(`/data/ads/${templateId}.json`);
            const data = await response.json();
            setTemplate(data);
        } catch (error) {
            console.error('Error loading template:', error);
        }
    };
    // Handle CSV file upload
    const handleCSVUpload = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "BatchImportPage.useCallback[handleCSVUpload]": async (e)=>{
            const file = e.target.files?.[0];
            if (!file) return;
            try {
                const text = await file.text();
                const lines = text.split('\n').filter({
                    "BatchImportPage.useCallback[handleCSVUpload].lines": (line)=>line.trim()
                }["BatchImportPage.useCallback[handleCSVUpload].lines"]);
                if (lines.length === 0) {
                    throw new Error('CSV file is empty');
                }
                // Parse headers (first line)
                const headers = lines[0].split(',').map({
                    "BatchImportPage.useCallback[handleCSVUpload].headers": (h)=>h.trim().replace(/^"|"$/g, '')
                }["BatchImportPage.useCallback[handleCSVUpload].headers"]);
                // Parse sample rows (next 3 rows)
                const sampleRows = lines.slice(1, 4).map({
                    "BatchImportPage.useCallback[handleCSVUpload].sampleRows": (line)=>{
                        const values = line.split(',').map({
                            "BatchImportPage.useCallback[handleCSVUpload].sampleRows.values": (v)=>v.trim().replace(/^"|"$/g, '')
                        }["BatchImportPage.useCallback[handleCSVUpload].sampleRows.values"]);
                        const row = {};
                        headers.forEach({
                            "BatchImportPage.useCallback[handleCSVUpload].sampleRows": (header, i)=>{
                                row[header] = values[i] || '';
                            }
                        }["BatchImportPage.useCallback[handleCSVUpload].sampleRows"]);
                        return row;
                    }
                }["BatchImportPage.useCallback[handleCSVUpload].sampleRows"]);
                setCSVState({
                    file,
                    headers,
                    sampleRows,
                    error: null
                });
                setBatchJob({
                    "BatchImportPage.useCallback[handleCSVUpload]": (prev)=>({
                            ...prev,
                            status: 'mapping'
                        })
                }["BatchImportPage.useCallback[handleCSVUpload]"]);
            } catch (error) {
                setCSVState({
                    file: null,
                    headers: [],
                    sampleRows: [],
                    error: error instanceof Error ? error.message : 'Failed to parse CSV'
                });
            }
        }
    }["BatchImportPage.useCallback[handleCSVUpload]"], []);
    // Handle template selection
    const handleTemplateChange = (templateId)=>{
        setSelectedTemplate(templateId);
        loadTemplate(templateId);
    };
    // Handle column mapping update
    const handleMappingUpdate = (mapping)=>{
        setColumnMapping(mapping);
    };
    // Generate preview
    const handleGeneratePreview = async ()=>{
        if (!csvState.file || !template) return;
        setBatchJob((prev)=>({
                ...prev,
                status: 'previewing',
                progress: 0
            }));
        try {
            // Create FormData for API request
            const formData = new FormData();
            formData.append('csv', csvState.file);
            formData.append('template', JSON.stringify(template));
            formData.append('columnMapping', JSON.stringify(columnMapping));
            formData.append('previewCount', '3');
            const response = await fetch('/api/ads/batch/preview', {
                method: 'POST',
                body: formData
            });
            if (!response.ok) {
                throw new Error('Failed to generate preview');
            }
            const result = await response.json();
            setBatchJob((prev)=>({
                    ...prev,
                    status: 'previewing',
                    totalAssets: result.assets.length,
                    completedAssets: result.assets.filter((a)=>a.status === 'completed').length,
                    failedAssets: result.assets.filter((a)=>a.status === 'failed').length
                }));
        } catch (error) {
            setBatchJob((prev)=>({
                    ...prev,
                    status: 'error',
                    error: error instanceof Error ? error.message : 'Preview generation failed'
                }));
        }
    };
    // Start full batch render
    const handleStartBatchRender = async ()=>{
        if (!csvState.file || !template) return;
        setBatchJob((prev)=>({
                ...prev,
                status: 'rendering',
                progress: 0
            }));
        try {
            // Create FormData for API request
            const formData = new FormData();
            formData.append('csv', csvState.file);
            formData.append('template', JSON.stringify(template));
            formData.append('columnMapping', JSON.stringify(columnMapping));
            formData.append('format', 'png');
            formData.append('createZip', 'true');
            const response = await fetch('/api/ads/batch/render', {
                method: 'POST',
                body: formData
            });
            if (!response.ok) {
                throw new Error('Failed to start batch render');
            }
            const result = await response.json();
            setBatchJob((prev)=>({
                    ...prev,
                    jobId: result.jobId,
                    status: 'rendering',
                    totalAssets: result.totalAssets
                }));
            // Poll for job status
            pollJobStatus(result.jobId);
        } catch (error) {
            setBatchJob((prev)=>({
                    ...prev,
                    status: 'error',
                    error: error instanceof Error ? error.message : 'Batch render failed'
                }));
        }
    };
    // Poll job status
    const pollJobStatus = async (jobId)=>{
        const interval = setInterval(async ()=>{
            try {
                const response = await fetch(`/api/ads/batch/status/${jobId}`);
                if (!response.ok) {
                    throw new Error('Failed to fetch job status');
                }
                const job = await response.json();
                setBatchJob((prev)=>({
                        ...prev,
                        status: job.status === 'completed' ? 'completed' : 'rendering',
                        progress: job.progress,
                        completedAssets: job.completedCount,
                        failedAssets: job.failedCount
                    }));
                if (job.status === 'completed' || job.status === 'failed') {
                    clearInterval(interval);
                }
            } catch (error) {
                console.error('Error polling job status:', error);
                clearInterval(interval);
            }
        }, 2000);
    };
    // Reset everything
    const handleReset = ()=>{
        setCSVState({
            file: null,
            headers: [],
            sampleRows: [],
            error: null
        });
        setColumnMapping({});
        setBatchJob({
            jobId: null,
            status: 'idle',
            progress: 0,
            totalAssets: 0,
            completedAssets: 0,
            failedAssets: 0,
            error: null
        });
    };
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ads$2f$batch$2f$batch$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].container,
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("header", {
                className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ads$2f$batch$2f$batch$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].header,
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h1", {
                        className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ads$2f$batch$2f$batch$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].title,
                        children: "Batch Ad Generator"
                    }, void 0, false, {
                        fileName: "[project]/src/app/ads/batch/page.tsx",
                        lineNumber: 274,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                        className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ads$2f$batch$2f$batch$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].subtitle,
                        children: "Upload CSV and generate hundreds of ad creatives"
                    }, void 0, false, {
                        fileName: "[project]/src/app/ads/batch/page.tsx",
                        lineNumber: 275,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/src/app/ads/batch/page.tsx",
                lineNumber: 273,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("section", {
                className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ads$2f$batch$2f$batch$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].section,
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ads$2f$batch$2f$batch$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].sectionHeader,
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                            className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ads$2f$batch$2f$batch$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].sectionTitle,
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                    className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ads$2f$batch$2f$batch$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].stepNumber,
                                    children: "1"
                                }, void 0, false, {
                                    fileName: "[project]/src/app/ads/batch/page.tsx",
                                    lineNumber: 282,
                                    columnNumber: 13
                                }, this),
                                "Upload CSV File"
                            ]
                        }, void 0, true, {
                            fileName: "[project]/src/app/ads/batch/page.tsx",
                            lineNumber: 281,
                            columnNumber: 11
                        }, this)
                    }, void 0, false, {
                        fileName: "[project]/src/app/ads/batch/page.tsx",
                        lineNumber: 280,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ads$2f$batch$2f$batch$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].uploadArea,
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                type: "file",
                                accept: ".csv",
                                onChange: handleCSVUpload,
                                className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ads$2f$batch$2f$batch$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].fileInput,
                                id: "csv-upload",
                                disabled: batchJob.status === 'rendering'
                            }, void 0, false, {
                                fileName: "[project]/src/app/ads/batch/page.tsx",
                                lineNumber: 287,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                htmlFor: "csv-upload",
                                className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ads$2f$batch$2f$batch$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].uploadLabel,
                                children: csvState.file ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Fragment"], {
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                            className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ads$2f$batch$2f$batch$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].fileName,
                                            children: csvState.file.name
                                        }, void 0, false, {
                                            fileName: "[project]/src/app/ads/batch/page.tsx",
                                            lineNumber: 298,
                                            columnNumber: 17
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                            className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ads$2f$batch$2f$batch$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].fileSize,
                                            children: [
                                                "(",
                                                Math.round(csvState.file.size / 1024),
                                                " KB)"
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/src/app/ads/batch/page.tsx",
                                            lineNumber: 299,
                                            columnNumber: 17
                                        }, this)
                                    ]
                                }, void 0, true) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Fragment"], {
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                            className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ads$2f$batch$2f$batch$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].uploadIcon,
                                            children: "📁"
                                        }, void 0, false, {
                                            fileName: "[project]/src/app/ads/batch/page.tsx",
                                            lineNumber: 305,
                                            columnNumber: 17
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                            children: "Choose CSV file or drag and drop"
                                        }, void 0, false, {
                                            fileName: "[project]/src/app/ads/batch/page.tsx",
                                            lineNumber: 306,
                                            columnNumber: 17
                                        }, this)
                                    ]
                                }, void 0, true)
                            }, void 0, false, {
                                fileName: "[project]/src/app/ads/batch/page.tsx",
                                lineNumber: 295,
                                columnNumber: 11
                            }, this),
                            csvState.error && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ads$2f$batch$2f$batch$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].error,
                                children: csvState.error
                            }, void 0, false, {
                                fileName: "[project]/src/app/ads/batch/page.tsx",
                                lineNumber: 311,
                                columnNumber: 13
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/app/ads/batch/page.tsx",
                        lineNumber: 286,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/src/app/ads/batch/page.tsx",
                lineNumber: 279,
                columnNumber: 7
            }, this),
            csvState.file && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("section", {
                className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ads$2f$batch$2f$batch$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].section,
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ads$2f$batch$2f$batch$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].sectionHeader,
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                            className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ads$2f$batch$2f$batch$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].sectionTitle,
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                    className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ads$2f$batch$2f$batch$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].stepNumber,
                                    children: "2"
                                }, void 0, false, {
                                    fileName: "[project]/src/app/ads/batch/page.tsx",
                                    lineNumber: 321,
                                    columnNumber: 15
                                }, this),
                                "Select Template"
                            ]
                        }, void 0, true, {
                            fileName: "[project]/src/app/ads/batch/page.tsx",
                            lineNumber: 320,
                            columnNumber: 13
                        }, this)
                    }, void 0, false, {
                        fileName: "[project]/src/app/ads/batch/page.tsx",
                        lineNumber: 319,
                        columnNumber: 11
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("select", {
                        value: selectedTemplate,
                        onChange: (e)=>handleTemplateChange(e.target.value),
                        className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ads$2f$batch$2f$batch$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].select,
                        disabled: batchJob.status === 'rendering',
                        children: STARTER_TEMPLATES.map((t)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                value: t,
                                children: t.replace('example-', '').replace(/-/g, ' ')
                            }, t, false, {
                                fileName: "[project]/src/app/ads/batch/page.tsx",
                                lineNumber: 332,
                                columnNumber: 15
                            }, this))
                    }, void 0, false, {
                        fileName: "[project]/src/app/ads/batch/page.tsx",
                        lineNumber: 325,
                        columnNumber: 11
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/src/app/ads/batch/page.tsx",
                lineNumber: 318,
                columnNumber: 9
            }, this),
            csvState.file && template && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("section", {
                className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ads$2f$batch$2f$batch$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].section,
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ads$2f$batch$2f$batch$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].sectionHeader,
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                            className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ads$2f$batch$2f$batch$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].sectionTitle,
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                    className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ads$2f$batch$2f$batch$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].stepNumber,
                                    children: "3"
                                }, void 0, false, {
                                    fileName: "[project]/src/app/ads/batch/page.tsx",
                                    lineNumber: 345,
                                    columnNumber: 15
                                }, this),
                                "Map CSV Columns to Template Fields"
                            ]
                        }, void 0, true, {
                            fileName: "[project]/src/app/ads/batch/page.tsx",
                            lineNumber: 344,
                            columnNumber: 13
                        }, this)
                    }, void 0, false, {
                        fileName: "[project]/src/app/ads/batch/page.tsx",
                        lineNumber: 343,
                        columnNumber: 11
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ads$2f$batch$2f$components$2f$ColumnMappingForm$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {
                        headers: csvState.headers,
                        sampleRows: csvState.sampleRows,
                        template: template,
                        columnMapping: columnMapping,
                        onMappingUpdate: handleMappingUpdate,
                        disabled: batchJob.status === 'rendering'
                    }, void 0, false, {
                        fileName: "[project]/src/app/ads/batch/page.tsx",
                        lineNumber: 349,
                        columnNumber: 11
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/src/app/ads/batch/page.tsx",
                lineNumber: 342,
                columnNumber: 9
            }, this),
            csvState.file && template && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("section", {
                className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ads$2f$batch$2f$batch$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].actions,
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                        onClick: handleGeneratePreview,
                        className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ads$2f$batch$2f$batch$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].buttonSecondary,
                        disabled: batchJob.status === 'rendering',
                        children: "Generate Preview (3 rows)"
                    }, void 0, false, {
                        fileName: "[project]/src/app/ads/batch/page.tsx",
                        lineNumber: 363,
                        columnNumber: 11
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                        onClick: handleStartBatchRender,
                        className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ads$2f$batch$2f$batch$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].buttonPrimary,
                        disabled: batchJob.status === 'rendering',
                        children: batchJob.status === 'rendering' ? 'Rendering...' : 'Start Batch Render'
                    }, void 0, false, {
                        fileName: "[project]/src/app/ads/batch/page.tsx",
                        lineNumber: 370,
                        columnNumber: 11
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                        onClick: handleReset,
                        className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ads$2f$batch$2f$batch$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].buttonOutline,
                        disabled: batchJob.status === 'rendering',
                        children: "Reset"
                    }, void 0, false, {
                        fileName: "[project]/src/app/ads/batch/page.tsx",
                        lineNumber: 379,
                        columnNumber: 11
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/src/app/ads/batch/page.tsx",
                lineNumber: 362,
                columnNumber: 9
            }, this),
            batchJob.status !== 'idle' && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("section", {
                className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ads$2f$batch$2f$batch$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].section,
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ads$2f$batch$2f$components$2f$BatchJobStatus$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {
                    job: batchJob
                }, void 0, false, {
                    fileName: "[project]/src/app/ads/batch/page.tsx",
                    lineNumber: 392,
                    columnNumber: 11
                }, this)
            }, void 0, false, {
                fileName: "[project]/src/app/ads/batch/page.tsx",
                lineNumber: 391,
                columnNumber: 9
            }, this),
            batchJob.status === 'previewing' && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("section", {
                className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ads$2f$batch$2f$batch$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].section,
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                        className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ads$2f$batch$2f$batch$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].sectionTitle,
                        children: "Preview"
                    }, void 0, false, {
                        fileName: "[project]/src/app/ads/batch/page.tsx",
                        lineNumber: 399,
                        columnNumber: 11
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ads$2f$batch$2f$components$2f$PreviewGrid$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {
                        jobId: batchJob.jobId
                    }, void 0, false, {
                        fileName: "[project]/src/app/ads/batch/page.tsx",
                        lineNumber: 400,
                        columnNumber: 11
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/src/app/ads/batch/page.tsx",
                lineNumber: 398,
                columnNumber: 9
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/src/app/ads/batch/page.tsx",
        lineNumber: 271,
        columnNumber: 5
    }, this);
}
_s(BatchImportPage, "I5KRTBV0cxDKWhAeTGwJJCD3OKY=");
_c = BatchImportPage;
var _c;
__turbopack_context__.k.register(_c, "BatchImportPage");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/node_modules/next/dist/compiled/react/cjs/react-jsx-dev-runtime.development.js [app-client] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$polyfills$2f$process$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = /*#__PURE__*/ __turbopack_context__.i("[project]/node_modules/next/dist/build/polyfills/process.js [app-client] (ecmascript)");
/**
 * @license React
 * react-jsx-dev-runtime.development.js
 *
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */ "use strict";
"production" !== ("TURBOPACK compile-time value", "development") && function() {
    function getComponentNameFromType(type) {
        if (null == type) return null;
        if ("function" === typeof type) return type.$$typeof === REACT_CLIENT_REFERENCE ? null : type.displayName || type.name || null;
        if ("string" === typeof type) return type;
        switch(type){
            case REACT_FRAGMENT_TYPE:
                return "Fragment";
            case REACT_PROFILER_TYPE:
                return "Profiler";
            case REACT_STRICT_MODE_TYPE:
                return "StrictMode";
            case REACT_SUSPENSE_TYPE:
                return "Suspense";
            case REACT_SUSPENSE_LIST_TYPE:
                return "SuspenseList";
            case REACT_ACTIVITY_TYPE:
                return "Activity";
            case REACT_VIEW_TRANSITION_TYPE:
                return "ViewTransition";
        }
        if ("object" === typeof type) switch("number" === typeof type.tag && console.error("Received an unexpected object in getComponentNameFromType(). This is likely a bug in React. Please file an issue."), type.$$typeof){
            case REACT_PORTAL_TYPE:
                return "Portal";
            case REACT_CONTEXT_TYPE:
                return type.displayName || "Context";
            case REACT_CONSUMER_TYPE:
                return (type._context.displayName || "Context") + ".Consumer";
            case REACT_FORWARD_REF_TYPE:
                var innerType = type.render;
                type = type.displayName;
                type || (type = innerType.displayName || innerType.name || "", type = "" !== type ? "ForwardRef(" + type + ")" : "ForwardRef");
                return type;
            case REACT_MEMO_TYPE:
                return innerType = type.displayName || null, null !== innerType ? innerType : getComponentNameFromType(type.type) || "Memo";
            case REACT_LAZY_TYPE:
                innerType = type._payload;
                type = type._init;
                try {
                    return getComponentNameFromType(type(innerType));
                } catch (x) {}
        }
        return null;
    }
    function testStringCoercion(value) {
        return "" + value;
    }
    function checkKeyStringCoercion(value) {
        try {
            testStringCoercion(value);
            var JSCompiler_inline_result = !1;
        } catch (e) {
            JSCompiler_inline_result = !0;
        }
        if (JSCompiler_inline_result) {
            JSCompiler_inline_result = console;
            var JSCompiler_temp_const = JSCompiler_inline_result.error;
            var JSCompiler_inline_result$jscomp$0 = "function" === typeof Symbol && Symbol.toStringTag && value[Symbol.toStringTag] || value.constructor.name || "Object";
            JSCompiler_temp_const.call(JSCompiler_inline_result, "The provided key is an unsupported type %s. This value must be coerced to a string before using it here.", JSCompiler_inline_result$jscomp$0);
            return testStringCoercion(value);
        }
    }
    function getTaskName(type) {
        if (type === REACT_FRAGMENT_TYPE) return "<>";
        if ("object" === typeof type && null !== type && type.$$typeof === REACT_LAZY_TYPE) return "<...>";
        try {
            var name = getComponentNameFromType(type);
            return name ? "<" + name + ">" : "<...>";
        } catch (x) {
            return "<...>";
        }
    }
    function getOwner() {
        var dispatcher = ReactSharedInternals.A;
        return null === dispatcher ? null : dispatcher.getOwner();
    }
    function UnknownOwner() {
        return Error("react-stack-top-frame");
    }
    function hasValidKey(config) {
        if (hasOwnProperty.call(config, "key")) {
            var getter = Object.getOwnPropertyDescriptor(config, "key").get;
            if (getter && getter.isReactWarning) return !1;
        }
        return void 0 !== config.key;
    }
    function defineKeyPropWarningGetter(props, displayName) {
        function warnAboutAccessingKey() {
            specialPropKeyWarningShown || (specialPropKeyWarningShown = !0, console.error("%s: `key` is not a prop. Trying to access it will result in `undefined` being returned. If you need to access the same value within the child component, you should pass it as a different prop. (https://react.dev/link/special-props)", displayName));
        }
        warnAboutAccessingKey.isReactWarning = !0;
        Object.defineProperty(props, "key", {
            get: warnAboutAccessingKey,
            configurable: !0
        });
    }
    function elementRefGetterWithDeprecationWarning() {
        var componentName = getComponentNameFromType(this.type);
        didWarnAboutElementRef[componentName] || (didWarnAboutElementRef[componentName] = !0, console.error("Accessing element.ref was removed in React 19. ref is now a regular prop. It will be removed from the JSX Element type in a future release."));
        componentName = this.props.ref;
        return void 0 !== componentName ? componentName : null;
    }
    function ReactElement(type, key, props, owner, debugStack, debugTask) {
        var refProp = props.ref;
        type = {
            $$typeof: REACT_ELEMENT_TYPE,
            type: type,
            key: key,
            props: props,
            _owner: owner
        };
        null !== (void 0 !== refProp ? refProp : null) ? Object.defineProperty(type, "ref", {
            enumerable: !1,
            get: elementRefGetterWithDeprecationWarning
        }) : Object.defineProperty(type, "ref", {
            enumerable: !1,
            value: null
        });
        type._store = {};
        Object.defineProperty(type._store, "validated", {
            configurable: !1,
            enumerable: !1,
            writable: !0,
            value: 0
        });
        Object.defineProperty(type, "_debugInfo", {
            configurable: !1,
            enumerable: !1,
            writable: !0,
            value: null
        });
        Object.defineProperty(type, "_debugStack", {
            configurable: !1,
            enumerable: !1,
            writable: !0,
            value: debugStack
        });
        Object.defineProperty(type, "_debugTask", {
            configurable: !1,
            enumerable: !1,
            writable: !0,
            value: debugTask
        });
        Object.freeze && (Object.freeze(type.props), Object.freeze(type));
        return type;
    }
    function jsxDEVImpl(type, config, maybeKey, isStaticChildren, debugStack, debugTask) {
        var children = config.children;
        if (void 0 !== children) if (isStaticChildren) if (isArrayImpl(children)) {
            for(isStaticChildren = 0; isStaticChildren < children.length; isStaticChildren++)validateChildKeys(children[isStaticChildren]);
            Object.freeze && Object.freeze(children);
        } else console.error("React.jsx: Static children should always be an array. You are likely explicitly calling React.jsxs or React.jsxDEV. Use the Babel transform instead.");
        else validateChildKeys(children);
        if (hasOwnProperty.call(config, "key")) {
            children = getComponentNameFromType(type);
            var keys = Object.keys(config).filter(function(k) {
                return "key" !== k;
            });
            isStaticChildren = 0 < keys.length ? "{key: someKey, " + keys.join(": ..., ") + ": ...}" : "{key: someKey}";
            didWarnAboutKeySpread[children + isStaticChildren] || (keys = 0 < keys.length ? "{" + keys.join(": ..., ") + ": ...}" : "{}", console.error('A props object containing a "key" prop is being spread into JSX:\n  let props = %s;\n  <%s {...props} />\nReact keys must be passed directly to JSX without using spread:\n  let props = %s;\n  <%s key={someKey} {...props} />', isStaticChildren, children, keys, children), didWarnAboutKeySpread[children + isStaticChildren] = !0);
        }
        children = null;
        void 0 !== maybeKey && (checkKeyStringCoercion(maybeKey), children = "" + maybeKey);
        hasValidKey(config) && (checkKeyStringCoercion(config.key), children = "" + config.key);
        if ("key" in config) {
            maybeKey = {};
            for(var propName in config)"key" !== propName && (maybeKey[propName] = config[propName]);
        } else maybeKey = config;
        children && defineKeyPropWarningGetter(maybeKey, "function" === typeof type ? type.displayName || type.name || "Unknown" : type);
        return ReactElement(type, children, maybeKey, getOwner(), debugStack, debugTask);
    }
    function validateChildKeys(node) {
        isValidElement(node) ? node._store && (node._store.validated = 1) : "object" === typeof node && null !== node && node.$$typeof === REACT_LAZY_TYPE && ("fulfilled" === node._payload.status ? isValidElement(node._payload.value) && node._payload.value._store && (node._payload.value._store.validated = 1) : node._store && (node._store.validated = 1));
    }
    function isValidElement(object) {
        return "object" === typeof object && null !== object && object.$$typeof === REACT_ELEMENT_TYPE;
    }
    var React = __turbopack_context__.r("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)"), REACT_ELEMENT_TYPE = Symbol.for("react.transitional.element"), REACT_PORTAL_TYPE = Symbol.for("react.portal"), REACT_FRAGMENT_TYPE = Symbol.for("react.fragment"), REACT_STRICT_MODE_TYPE = Symbol.for("react.strict_mode"), REACT_PROFILER_TYPE = Symbol.for("react.profiler"), REACT_CONSUMER_TYPE = Symbol.for("react.consumer"), REACT_CONTEXT_TYPE = Symbol.for("react.context"), REACT_FORWARD_REF_TYPE = Symbol.for("react.forward_ref"), REACT_SUSPENSE_TYPE = Symbol.for("react.suspense"), REACT_SUSPENSE_LIST_TYPE = Symbol.for("react.suspense_list"), REACT_MEMO_TYPE = Symbol.for("react.memo"), REACT_LAZY_TYPE = Symbol.for("react.lazy"), REACT_ACTIVITY_TYPE = Symbol.for("react.activity"), REACT_VIEW_TRANSITION_TYPE = Symbol.for("react.view_transition"), REACT_CLIENT_REFERENCE = Symbol.for("react.client.reference"), ReactSharedInternals = React.__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE, hasOwnProperty = Object.prototype.hasOwnProperty, isArrayImpl = Array.isArray, createTask = console.createTask ? console.createTask : function() {
        return null;
    };
    React = {
        react_stack_bottom_frame: function(callStackForError) {
            return callStackForError();
        }
    };
    var specialPropKeyWarningShown;
    var didWarnAboutElementRef = {};
    var unknownOwnerDebugStack = React.react_stack_bottom_frame.bind(React, UnknownOwner)();
    var unknownOwnerDebugTask = createTask(getTaskName(UnknownOwner));
    var didWarnAboutKeySpread = {};
    exports.Fragment = REACT_FRAGMENT_TYPE;
    exports.jsxDEV = function(type, config, maybeKey, isStaticChildren) {
        var trackActualOwner = 1e4 > ReactSharedInternals.recentlyCreatedOwnerStacks++;
        if (trackActualOwner) {
            var previousStackTraceLimit = Error.stackTraceLimit;
            Error.stackTraceLimit = 10;
            var debugStackDEV = Error("react-stack-top-frame");
            Error.stackTraceLimit = previousStackTraceLimit;
        } else debugStackDEV = unknownOwnerDebugStack;
        return jsxDEVImpl(type, config, maybeKey, isStaticChildren, debugStackDEV, trackActualOwner ? createTask(getTaskName(type)) : unknownOwnerDebugTask);
    };
}();
}),
"[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$polyfills$2f$process$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = /*#__PURE__*/ __turbopack_context__.i("[project]/node_modules/next/dist/build/polyfills/process.js [app-client] (ecmascript)");
'use strict';
if ("TURBOPACK compile-time falsy", 0) //TURBOPACK unreachable
;
else {
    module.exports = __turbopack_context__.r("[project]/node_modules/next/dist/compiled/react/cjs/react-jsx-dev-runtime.development.js [app-client] (ecmascript)");
}
}),
]);

//# sourceMappingURL=_23570330._.js.map