(globalThis.TURBOPACK || (globalThis.TURBOPACK = [])).push([typeof document === "object" ? document.currentScript : undefined,
"[project]/src/config/deviceFrames.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

/**
 * Device Frame Presets
 *
 * Pre-configured device frame specifications based on App Store Connect
 * screenshot requirements (January 2026).
 */ __turbopack_context__.s([
    "deviceFramePresets",
    ()=>deviceFramePresets,
    "getDeviceFrame",
    ()=>getDeviceFrame,
    "getDevicesByType",
    ()=>getDevicesByType,
    "getRecommendedSizes",
    ()=>getRecommendedSizes,
    "iPadPresets",
    ()=>iPadPresets,
    "iPhonePresets",
    ()=>iPhonePresets,
    "macPresets",
    ()=>macPresets,
    "tvPresets",
    ()=>tvPresets,
    "visionPresets",
    ()=>visionPresets,
    "watchPresets",
    ()=>watchPresets
]);
const iPhonePresets = {
    // 6.9" Display
    'iphone-17-pro-max': {
        type: 'iphone',
        model: 'iphone-17-pro-max',
        displayName: 'iPhone 17 Pro Max',
        displaySize: '6.9"',
        portrait: {
            width: 1260,
            height: 2736
        },
        landscape: {
            width: 2736,
            height: 1260
        },
        borderRadius: 0.055,
        dynamicIsland: {
            width: 126,
            height: 37
        },
        colors: [
            '#1d1d1f',
            '#f5f5f7',
            '#4c4c4c',
            '#fae7d4'
        ],
        defaultColor: '#1d1d1f'
    },
    'iphone-16-pro-max': {
        type: 'iphone',
        model: 'iphone-16-pro-max',
        displayName: 'iPhone 16 Pro Max',
        displaySize: '6.9"',
        portrait: {
            width: 1260,
            height: 2736
        },
        landscape: {
            width: 2736,
            height: 1260
        },
        borderRadius: 0.055,
        dynamicIsland: {
            width: 126,
            height: 37
        },
        colors: [
            '#1d1d1f',
            '#f5f5f7',
            '#4c4c4c',
            '#fae7d4'
        ],
        defaultColor: '#1d1d1f'
    },
    'iphone-16-plus': {
        type: 'iphone',
        model: 'iphone-16-plus',
        displayName: 'iPhone 16 Plus',
        displaySize: '6.9"',
        portrait: {
            width: 1260,
            height: 2736
        },
        landscape: {
            width: 2736,
            height: 1260
        },
        borderRadius: 0.055,
        notch: {
            width: 210,
            height: 30
        },
        colors: [
            '#1d1d1f',
            '#f5f5f7',
            '#4c4c4c',
            '#fae7d4'
        ],
        defaultColor: '#1d1d1f'
    },
    // 6.5" Display
    'iphone-14-plus': {
        type: 'iphone',
        model: 'iphone-14-plus',
        displayName: 'iPhone 14 Plus',
        displaySize: '6.5"',
        portrait: {
            width: 1284,
            height: 2778
        },
        landscape: {
            width: 2778,
            height: 1284
        },
        borderRadius: 0.055,
        notch: {
            width: 210,
            height: 30
        },
        colors: [
            '#1d1d1f',
            '#f5f5f7',
            '#4c4c4c',
            '#fae7d4'
        ],
        defaultColor: '#1d1d1f'
    },
    'iphone-13-pro-max': {
        type: 'iphone',
        model: 'iphone-13-pro-max',
        displayName: 'iPhone 13 Pro Max',
        displaySize: '6.5"',
        portrait: {
            width: 1284,
            height: 2778
        },
        landscape: {
            width: 2778,
            height: 1284
        },
        borderRadius: 0.055,
        notch: {
            width: 210,
            height: 30
        },
        colors: [
            '#1d1d1f',
            '#f5f5f7',
            '#4c4c4c',
            '#fae7d4'
        ],
        defaultColor: '#1d1d1f'
    },
    // 6.1" Display
    'iphone-16': {
        type: 'iphone',
        model: 'iphone-16',
        displayName: 'iPhone 16',
        displaySize: '6.1"',
        portrait: {
            width: 1170,
            height: 2532
        },
        landscape: {
            width: 2532,
            height: 1170
        },
        borderRadius: 0.055,
        notch: {
            width: 210,
            height: 30
        },
        colors: [
            '#1d1d1f',
            '#f5f5f7',
            '#4c4c4c',
            '#fae7d4'
        ],
        defaultColor: '#1d1d1f'
    },
    'iphone-15': {
        type: 'iphone',
        model: 'iphone-15',
        displayName: 'iPhone 15',
        displaySize: '6.1"',
        portrait: {
            width: 1170,
            height: 2532
        },
        landscape: {
            width: 2532,
            height: 1170
        },
        borderRadius: 0.055,
        notch: {
            width: 210,
            height: 30
        },
        colors: [
            '#1d1d1f',
            '#f5f5f7',
            '#4c4c4c',
            '#fae7d4'
        ],
        defaultColor: '#1d1d1f'
    },
    'iphone-14': {
        type: 'iphone',
        model: 'iphone-14',
        displayName: 'iPhone 14',
        displaySize: '6.1"',
        portrait: {
            width: 1170,
            height: 2532
        },
        landscape: {
            width: 2532,
            height: 1170
        },
        borderRadius: 0.055,
        notch: {
            width: 210,
            height: 30
        },
        colors: [
            '#1d1d1f',
            '#f5f5f7',
            '#4c4c4c',
            '#fae7d4'
        ],
        defaultColor: '#1d1d1f'
    },
    // 5.5" Display
    'iphone-8-plus': {
        type: 'iphone',
        model: 'iphone-8-plus',
        displayName: 'iPhone 8 Plus',
        displaySize: '5.5"',
        portrait: {
            width: 1242,
            height: 2208
        },
        landscape: {
            width: 2208,
            height: 1242
        },
        borderRadius: 0.025,
        colors: [
            '#1d1d1f',
            '#f5f5f7',
            '#d4af37'
        ],
        defaultColor: '#1d1d1f'
    },
    // 4.7" Display
    'iphone-se-3': {
        type: 'iphone',
        model: 'iphone-se-3',
        displayName: 'iPhone SE (3rd gen)',
        displaySize: '4.7"',
        portrait: {
            width: 750,
            height: 1334
        },
        landscape: {
            width: 1334,
            height: 750
        },
        borderRadius: 0.025,
        colors: [
            '#1d1d1f',
            '#f5f5f7',
            '#ff3b30'
        ],
        defaultColor: '#1d1d1f'
    },
    'iphone-8': {
        type: 'iphone',
        model: 'iphone-8',
        displayName: 'iPhone 8',
        displaySize: '4.7"',
        portrait: {
            width: 750,
            height: 1334
        },
        landscape: {
            width: 1334,
            height: 750
        },
        borderRadius: 0.025,
        colors: [
            '#1d1d1f',
            '#f5f5f7',
            '#d4af37'
        ],
        defaultColor: '#1d1d1f'
    }
};
const iPadPresets = {
    // 13" Display
    'ipad-pro-13-m5': {
        type: 'ipad',
        model: 'ipad-pro-13-m5',
        displayName: 'iPad Pro 13" (M5)',
        displaySize: '13"',
        portrait: {
            width: 2064,
            height: 2752
        },
        landscape: {
            width: 2752,
            height: 2064
        },
        borderRadius: 0.03,
        colors: [
            '#1d1d1f',
            '#f5f5f7'
        ],
        defaultColor: '#f5f5f7'
    },
    'ipad-pro-13-m4': {
        type: 'ipad',
        model: 'ipad-pro-13-m4',
        displayName: 'iPad Pro 13" (M4)',
        displaySize: '13"',
        portrait: {
            width: 2064,
            height: 2752
        },
        landscape: {
            width: 2752,
            height: 2064
        },
        borderRadius: 0.03,
        colors: [
            '#1d1d1f',
            '#f5f5f7'
        ],
        defaultColor: '#f5f5f7'
    },
    // 12.9" Display
    'ipad-pro-12-9': {
        type: 'ipad',
        model: 'ipad-pro-12-9',
        displayName: 'iPad Pro 12.9"',
        displaySize: '12.9"',
        portrait: {
            width: 2048,
            height: 2732
        },
        landscape: {
            width: 2732,
            height: 2048
        },
        borderRadius: 0.03,
        colors: [
            '#1d1d1f',
            '#f5f5f7'
        ],
        defaultColor: '#f5f5f7'
    },
    // 11" Display
    'ipad-pro-11-m5': {
        type: 'ipad',
        model: 'ipad-pro-11-m5',
        displayName: 'iPad Pro 11" (M5)',
        displaySize: '11"',
        portrait: {
            width: 1668,
            height: 2388
        },
        landscape: {
            width: 2388,
            height: 1668
        },
        borderRadius: 0.03,
        colors: [
            '#1d1d1f',
            '#f5f5f7'
        ],
        defaultColor: '#f5f5f7'
    },
    'ipad-air-11-m3': {
        type: 'ipad',
        model: 'ipad-air-11-m3',
        displayName: 'iPad Air 11" (M3)',
        displaySize: '11"',
        portrait: {
            width: 1668,
            height: 2388
        },
        landscape: {
            width: 2388,
            height: 1668
        },
        borderRadius: 0.03,
        colors: [
            '#1d1d1f',
            '#f5f5f7',
            '#4c6ef5',
            '#fa5252'
        ],
        defaultColor: '#f5f5f7'
    },
    'ipad-11': {
        type: 'ipad',
        model: 'ipad-11',
        displayName: 'iPad (11th gen)',
        displaySize: '11"',
        portrait: {
            width: 1640,
            height: 2360
        },
        landscape: {
            width: 2360,
            height: 1640
        },
        borderRadius: 0.03,
        colors: [
            '#1d1d1f',
            '#f5f5f7',
            '#4c6ef5',
            '#fa5252'
        ],
        defaultColor: '#f5f5f7'
    },
    // 10.5" Display
    'ipad-pro-10-5': {
        type: 'ipad',
        model: 'ipad-pro-10-5',
        displayName: 'iPad Pro 10.5"',
        displaySize: '10.5"',
        portrait: {
            width: 1668,
            height: 2224
        },
        landscape: {
            width: 2224,
            height: 1668
        },
        borderRadius: 0.025,
        colors: [
            '#1d1d1f',
            '#f5f5f7',
            '#d4af37'
        ],
        defaultColor: '#f5f5f7'
    }
};
const macPresets = {
    'macbook-air-13': {
        type: 'mac',
        model: 'macbook-air-13',
        displayName: 'MacBook Air 13"',
        displaySize: '13.6"',
        portrait: {
            width: 2560,
            height: 1600
        },
        landscape: {
            width: 2560,
            height: 1600
        },
        borderRadius: 0.02,
        colors: [
            '#1d1d1f',
            '#f5f5f7',
            '#e8e3d5',
            '#1e3a5f'
        ],
        defaultColor: '#f5f5f7'
    },
    'macbook-air-15': {
        type: 'mac',
        model: 'macbook-air-15',
        displayName: 'MacBook Air 15"',
        displaySize: '15.3"',
        portrait: {
            width: 2880,
            height: 1800
        },
        landscape: {
            width: 2880,
            height: 1800
        },
        borderRadius: 0.02,
        colors: [
            '#1d1d1f',
            '#f5f5f7',
            '#e8e3d5',
            '#1e3a5f'
        ],
        defaultColor: '#f5f5f7'
    },
    'macbook-pro-14': {
        type: 'mac',
        model: 'macbook-pro-14',
        displayName: 'MacBook Pro 14"',
        displaySize: '14.2"',
        portrait: {
            width: 3024,
            height: 1964
        },
        landscape: {
            width: 3024,
            height: 1964
        },
        borderRadius: 0.02,
        notch: {
            width: 200,
            height: 32
        },
        colors: [
            '#1d1d1f',
            '#f5f5f7'
        ],
        defaultColor: '#1d1d1f'
    },
    'macbook-pro-16': {
        type: 'mac',
        model: 'macbook-pro-16',
        displayName: 'MacBook Pro 16"',
        displaySize: '16.2"',
        portrait: {
            width: 3456,
            height: 2234
        },
        landscape: {
            width: 3456,
            height: 2234
        },
        borderRadius: 0.02,
        notch: {
            width: 200,
            height: 32
        },
        colors: [
            '#1d1d1f',
            '#f5f5f7'
        ],
        defaultColor: '#1d1d1f'
    },
    'imac-24': {
        type: 'mac',
        model: 'imac-24',
        displayName: 'iMac 24"',
        displaySize: '24"',
        portrait: {
            width: 4480,
            height: 2520
        },
        landscape: {
            width: 4480,
            height: 2520
        },
        borderRadius: 0.015,
        colors: [
            '#4c6ef5',
            '#fa5252',
            '#fcc419',
            '#51cf66',
            '#f783ac',
            '#868e96',
            '#f5f5f7'
        ],
        defaultColor: '#4c6ef5'
    }
};
const watchPresets = {
    'watch-ultra-3': {
        type: 'watch',
        model: 'watch-ultra-3',
        displayName: 'Apple Watch Ultra 3',
        displaySize: '49mm',
        portrait: {
            width: 422,
            height: 514
        },
        landscape: {
            width: 514,
            height: 422
        },
        borderRadius: 0.1,
        colors: [
            '#1d1d1f',
            '#f5f5f7'
        ],
        defaultColor: '#1d1d1f'
    },
    'watch-ultra-2': {
        type: 'watch',
        model: 'watch-ultra-2',
        displayName: 'Apple Watch Ultra 2',
        displaySize: '49mm',
        portrait: {
            width: 410,
            height: 502
        },
        landscape: {
            width: 502,
            height: 410
        },
        borderRadius: 0.1,
        colors: [
            '#1d1d1f',
            '#f5f5f7'
        ],
        defaultColor: '#1d1d1f'
    },
    'watch-series-11': {
        type: 'watch',
        model: 'watch-series-11',
        displayName: 'Apple Watch Series 11',
        displaySize: '46mm',
        portrait: {
            width: 416,
            height: 496
        },
        landscape: {
            width: 496,
            height: 416
        },
        borderRadius: 0.15,
        colors: [
            '#1d1d1f',
            '#f5f5f7',
            '#fa5252',
            '#4c6ef5'
        ],
        defaultColor: '#1d1d1f'
    },
    'watch-series-10': {
        type: 'watch',
        model: 'watch-series-10',
        displayName: 'Apple Watch Series 10',
        displaySize: '46mm',
        portrait: {
            width: 416,
            height: 496
        },
        landscape: {
            width: 496,
            height: 416
        },
        borderRadius: 0.15,
        colors: [
            '#1d1d1f',
            '#f5f5f7',
            '#fa5252',
            '#4c6ef5'
        ],
        defaultColor: '#1d1d1f'
    },
    'watch-series-9': {
        type: 'watch',
        model: 'watch-series-9',
        displayName: 'Apple Watch Series 9',
        displaySize: '45mm',
        portrait: {
            width: 396,
            height: 484
        },
        landscape: {
            width: 484,
            height: 396
        },
        borderRadius: 0.15,
        colors: [
            '#1d1d1f',
            '#f5f5f7',
            '#fa5252',
            '#4c6ef5'
        ],
        defaultColor: '#1d1d1f'
    },
    'watch-se': {
        type: 'watch',
        model: 'watch-se',
        displayName: 'Apple Watch SE',
        displaySize: '44mm',
        portrait: {
            width: 368,
            height: 448
        },
        landscape: {
            width: 448,
            height: 368
        },
        borderRadius: 0.15,
        colors: [
            '#1d1d1f',
            '#f5f5f7',
            '#fa5252'
        ],
        defaultColor: '#1d1d1f'
    },
    'watch-series-3': {
        type: 'watch',
        model: 'watch-series-3',
        displayName: 'Apple Watch Series 3',
        displaySize: '42mm',
        portrait: {
            width: 312,
            height: 390
        },
        landscape: {
            width: 390,
            height: 312
        },
        borderRadius: 0.12,
        colors: [
            '#1d1d1f',
            '#f5f5f7'
        ],
        defaultColor: '#1d1d1f'
    }
};
const tvPresets = {
    'apple-tv-4k': {
        type: 'tv',
        model: 'apple-tv-4k',
        displayName: 'Apple TV 4K',
        displaySize: 'Variable',
        portrait: {
            width: 2160,
            height: 3840
        },
        landscape: {
            width: 3840,
            height: 2160
        },
        borderRadius: 0.005,
        colors: [
            '#1d1d1f'
        ],
        defaultColor: '#1d1d1f'
    },
    'apple-tv-hd': {
        type: 'tv',
        model: 'apple-tv-hd',
        displayName: 'Apple TV HD',
        displaySize: 'Variable',
        portrait: {
            width: 1080,
            height: 1920
        },
        landscape: {
            width: 1920,
            height: 1080
        },
        borderRadius: 0.005,
        colors: [
            '#1d1d1f'
        ],
        defaultColor: '#1d1d1f'
    }
};
const visionPresets = {
    'vision-pro': {
        type: 'vision',
        model: 'vision-pro',
        displayName: 'Apple Vision Pro',
        displaySize: 'Immersive',
        portrait: {
            width: 2160,
            height: 3840
        },
        landscape: {
            width: 3840,
            height: 2160
        },
        borderRadius: 0.02,
        colors: [
            '#1d1d1f',
            '#f5f5f7'
        ],
        defaultColor: '#f5f5f7'
    }
};
const deviceFramePresets = {
    ...iPhonePresets,
    ...iPadPresets,
    ...macPresets,
    ...watchPresets,
    ...tvPresets,
    ...visionPresets
};
function getDeviceFrame(model) {
    return deviceFramePresets[model];
}
function getDevicesByType(type) {
    return Object.values(deviceFramePresets).filter((device)=>device?.type === type);
}
function getRecommendedSizes(model, orientation = 'portrait') {
    const device = getDeviceFrame(model);
    if (!device) return undefined;
    return orientation === 'portrait' ? device.portrait : device.landscape;
}
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/src/types/deviceFrame.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

/**
 * Device Frame Types
 *
 * Type definitions for App Store screenshot device frames.
 * Supports iPhone, iPad, Mac, Apple Watch, Apple TV, and Apple Vision Pro.
 */ __turbopack_context__.s([]);
;
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/src/components/DeviceFrame.tsx [app-client] (ecmascript) <locals>", ((__turbopack_context__) => {
"use strict";

/**
 * DeviceFrame Component
 *
 * Renders device frames for App Store screenshots (iPhone, iPad, Mac, Watch).
 * Compatible with Remotion for static rendering and React for UI.
 *
 * @example
 * ```tsx
 * <DeviceFrame
 *   device="iphone-16-pro-max"
 *   orientation="portrait"
 *   content="/path/to/screenshot.png"
 * />
 * ```
 */ __turbopack_context__.s([
    "DeviceFrame",
    ()=>DeviceFrame
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$remotion$2f$dist$2f$esm$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/remotion/dist/esm/index.mjs [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$config$2f$deviceFrames$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/config/deviceFrames.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$types$2f$deviceFrame$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/types/deviceFrame.ts [app-client] (ecmascript)");
;
;
;
/**
 * Default frame style
 */ const defaultFrameStyle = {
    frameColor: '#1d1d1f',
    backgroundColor: '#000000',
    shadow: true,
    shadowBlur: 40,
    shadowColor: 'rgba(0, 0, 0, 0.3)',
    shadowX: 0,
    shadowY: 20,
    reflection: false,
    frameThickness: 12,
    showHomeButton: true,
    showButtons: true,
    showNotch: true
};
/**
 * Default content position
 */ const defaultContentPosition = {
    x: 0.5,
    y: 0.5,
    scale: 1,
    crop: true
};
/**
 * Get device configuration
 */ function getDeviceConfig(device) {
    if (typeof device === 'string') {
        const config = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$config$2f$deviceFrames$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getDeviceFrame"])(device);
        if (!config) {
            throw new Error(`Unknown device model: ${device}`);
        }
        return config;
    }
    return device;
}
/**
 * Calculate frame dimensions
 */ function calculateDimensions(config, orientation, targetWidth, targetHeight) {
    const dims = orientation === 'portrait' ? config.portrait : config.landscape;
    const aspectRatio = dims.width / dims.height;
    // Add frame thickness (bezel) to dimensions
    const frameThickness = defaultFrameStyle.frameThickness || 12;
    const totalWidth = dims.width + frameThickness * 2;
    const totalHeight = dims.height + frameThickness * 2;
    let width;
    let height;
    if (targetWidth && !targetHeight) {
        width = targetWidth;
        height = width / aspectRatio;
    } else if (targetHeight && !targetWidth) {
        height = targetHeight;
        width = height * aspectRatio;
    } else if (targetWidth && targetHeight) {
        width = targetWidth;
        height = targetHeight;
    } else {
        // Use actual dimensions scaled down to fit reasonable size
        const scale = Math.min(1, 800 / totalWidth);
        width = totalWidth * scale;
        height = totalHeight * scale;
    }
    return {
        width,
        height,
        screenWidth: dims.width / totalWidth * width,
        screenHeight: dims.height / totalHeight * height
    };
}
const DeviceFrame = ({ device, orientation = 'portrait', style, content, contentPosition, width: targetWidth, height: targetHeight, className })=>{
    const config = getDeviceConfig(device);
    const frameStyle = {
        ...defaultFrameStyle,
        ...style
    };
    const contentPos = {
        ...defaultContentPosition,
        ...contentPosition
    };
    const { width, height, screenWidth, screenHeight } = calculateDimensions(config, orientation, targetWidth, targetHeight);
    // Calculate frame thickness as percentage of total size
    const frameThicknessPx = frameStyle.frameThickness || 12;
    const frameThicknessPercent = frameThicknessPx / Math.min(width, height) * 100;
    // Device color
    const deviceColor = frameStyle.frameColor || config.defaultColor || '#1d1d1f';
    // Border radius
    const borderRadiusPercent = (config.borderRadius || 0.05) * 100;
    // Container style with shadow
    const containerStyle = {
        position: 'relative',
        width: width,
        height: height,
        ...frameStyle.shadow && {
            filter: `drop-shadow(${frameStyle.shadowX}px ${frameStyle.shadowY}px ${frameStyle.shadowBlur}px ${frameStyle.shadowColor})`
        }
    };
    // Frame (device bezel) style
    const frameContainerStyle = {
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        backgroundColor: deviceColor,
        borderRadius: `${borderRadiusPercent}%`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden'
    };
    // Screen area style
    const screenStyle = {
        position: 'relative',
        width: screenWidth,
        height: screenHeight,
        backgroundColor: frameStyle.backgroundColor,
        borderRadius: `${borderRadiusPercent * 0.8}%`,
        overflow: 'hidden'
    };
    // Content style
    const contentStyle = {
        position: 'absolute',
        top: `${(contentPos.y || 0.5) * 100}%`,
        left: `${(contentPos.x || 0.5) * 100}%`,
        transform: `translate(-50%, -50%) scale(${contentPos.scale || 1})`,
        width: contentPos.crop ? '100%' : 'auto',
        height: contentPos.crop ? '100%' : 'auto',
        objectFit: contentPos.crop ? 'cover' : 'contain'
    };
    // Notch/Dynamic Island style
    const hasNotch = frameStyle.showNotch && (config.notch || config.dynamicIsland);
    const notchConfig = config.dynamicIsland || config.notch;
    const notchStyle = hasNotch && notchConfig ? {
        position: 'absolute',
        top: 0,
        left: '50%',
        transform: 'translateX(-50%)',
        width: notchConfig.width / screenWidth * 100 + '%',
        height: notchConfig.height / screenHeight * 100 + '%',
        backgroundColor: deviceColor,
        borderRadius: config.dynamicIsland ? '50%' : '0 0 20px 20px',
        zIndex: 10
    } : undefined;
    // Home button style (for older iPhones)
    const showHomeButton = frameStyle.showHomeButton && config.type === 'iphone' && !config.notch && !config.dynamicIsland;
    const homeButtonStyle = showHomeButton ? {
        position: 'absolute',
        bottom: orientation === 'portrait' ? -frameThicknessPx + 'px' : '50%',
        right: orientation === 'portrait' ? '50%' : -frameThicknessPx + 'px',
        transform: orientation === 'portrait' ? 'translateX(50%)' : 'translateY(50%)',
        width: orientation === 'portrait' ? '60px' : '20px',
        height: orientation === 'portrait' ? '60px' : '60px',
        backgroundColor: '#000',
        border: '2px solid ' + deviceColor,
        borderRadius: '50%'
    } : undefined;
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        style: containerStyle,
        className: className,
        "data-device": config.model,
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                style: frameContainerStyle,
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        style: screenStyle,
                        children: [
                            notchStyle && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                style: notchStyle
                            }, void 0, false, {
                                fileName: "[project]/src/components/DeviceFrame.tsx",
                                lineNumber: 240,
                                columnNumber: 26
                            }, ("TURBOPACK compile-time value", void 0)),
                            content && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Fragment"], {
                                children: typeof content === 'string' ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$remotion$2f$dist$2f$esm$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Img"], {
                                    src: content,
                                    style: contentStyle
                                }, void 0, false, {
                                    fileName: "[project]/src/components/DeviceFrame.tsx",
                                    lineNumber: 246,
                                    columnNumber: 17
                                }, ("TURBOPACK compile-time value", void 0)) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    style: contentStyle,
                                    children: content
                                }, void 0, false, {
                                    fileName: "[project]/src/components/DeviceFrame.tsx",
                                    lineNumber: 248,
                                    columnNumber: 17
                                }, ("TURBOPACK compile-time value", void 0))
                            }, void 0, false)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/components/DeviceFrame.tsx",
                        lineNumber: 238,
                        columnNumber: 9
                    }, ("TURBOPACK compile-time value", void 0)),
                    homeButtonStyle && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        style: homeButtonStyle
                    }, void 0, false, {
                        fileName: "[project]/src/components/DeviceFrame.tsx",
                        lineNumber: 255,
                        columnNumber: 29
                    }, ("TURBOPACK compile-time value", void 0))
                ]
            }, void 0, true, {
                fileName: "[project]/src/components/DeviceFrame.tsx",
                lineNumber: 236,
                columnNumber: 7
            }, ("TURBOPACK compile-time value", void 0)),
            frameStyle.showButtons && renderButtons(config, width, height, orientation, deviceColor)
        ]
    }, void 0, true, {
        fileName: "[project]/src/components/DeviceFrame.tsx",
        lineNumber: 234,
        columnNumber: 5
    }, ("TURBOPACK compile-time value", void 0));
};
_c = DeviceFrame;
/**
 * Render device buttons (volume, power)
 */ function renderButtons(config, width, height, orientation, color) {
    if (config.type !== 'iphone' && config.type !== 'ipad') {
        return null;
    }
    const buttonStyle = {
        position: 'absolute',
        backgroundColor: color,
        borderRadius: '2px'
    };
    const isPortrait = orientation === 'portrait';
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Fragment"], {
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                style: {
                    ...buttonStyle,
                    [isPortrait ? 'left' : 'top']: '-3px',
                    [isPortrait ? 'top' : 'left']: isPortrait ? '20%' : '30%',
                    [isPortrait ? 'width' : 'height']: '3px',
                    [isPortrait ? 'height' : 'width']: isPortrait ? '50px' : '40px'
                }
            }, void 0, false, {
                fileName: "[project]/src/components/DeviceFrame.tsx",
                lineNumber: 289,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                style: {
                    ...buttonStyle,
                    [isPortrait ? 'left' : 'top']: '-3px',
                    [isPortrait ? 'top' : 'left']: isPortrait ? '30%' : '38%',
                    [isPortrait ? 'width' : 'height']: '3px',
                    [isPortrait ? 'height' : 'width']: isPortrait ? '50px' : '40px'
                }
            }, void 0, false, {
                fileName: "[project]/src/components/DeviceFrame.tsx",
                lineNumber: 300,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                style: {
                    ...buttonStyle,
                    [isPortrait ? 'right' : 'top']: '-3px',
                    [isPortrait ? 'top' : 'right']: isPortrait ? '25%' : '20%',
                    [isPortrait ? 'width' : 'height']: '3px',
                    [isPortrait ? 'height' : 'width']: isPortrait ? '80px' : '60px'
                }
            }, void 0, false, {
                fileName: "[project]/src/components/DeviceFrame.tsx",
                lineNumber: 311,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true);
}
;
;
var _c;
__turbopack_context__.k.register(_c, "DeviceFrame");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/src/app/screenshots/screenshots.module.css [app-client] (css module)", ((__turbopack_context__) => {

__turbopack_context__.v({
  "active": "screenshots-module__x7aQdG__active",
  "buttonGroup": "screenshots-module__x7aQdG__buttonGroup",
  "container": "screenshots-module__x7aQdG__container",
  "control": "screenshots-module__x7aQdG__control",
  "controls": "screenshots-module__x7aQdG__controls",
  "deviceButton": "screenshots-module__x7aQdG__deviceButton",
  "deviceGroup": "screenshots-module__x7aQdG__deviceGroup",
  "deviceSize": "screenshots-module__x7aQdG__deviceSize",
  "exportButton": "screenshots-module__x7aQdG__exportButton",
  "header": "screenshots-module__x7aQdG__header",
  "layout": "screenshots-module__x7aQdG__layout",
  "preview": "screenshots-module__x7aQdG__preview",
  "previewContainer": "screenshots-module__x7aQdG__previewContainer",
  "previewInfo": "screenshots-module__x7aQdG__previewInfo",
  "section": "screenshots-module__x7aQdG__section",
});
}),
"[project]/src/app/screenshots/page.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>ScreenshotsPage
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
/**
 * Screenshot Device Frames Demo
 *
 * Demonstrates device frame rendering for App Store screenshots.
 */ var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$DeviceFrame$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/src/components/DeviceFrame.tsx [app-client] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$config$2f$deviceFrames$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/config/deviceFrames.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$screenshots$2f$screenshots$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__ = __turbopack_context__.i("[project]/src/app/screenshots/screenshots.module.css [app-client] (css module)");
;
var _s = __turbopack_context__.k.signature();
'use client';
;
;
;
;
function ScreenshotsPage() {
    _s();
    const [selectedDevice, setSelectedDevice] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])('iphone-16-pro-max');
    const [orientation, setOrientation] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])('portrait');
    const [frameColor, setFrameColor] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])('#1d1d1f');
    const [showButtons, setShowButtons] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(true);
    const [showNotch, setShowNotch] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(true);
    const [shadow, setShadow] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(true);
    // Sample screenshot content
    const sampleContent = 'https://via.placeholder.com/1260x2736/667eea/ffffff?text=Your+App+Screenshot';
    // Get all device types
    const iPhones = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$config$2f$deviceFrames$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getDevicesByType"])('iphone');
    const iPads = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$config$2f$deviceFrames$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getDevicesByType"])('ipad');
    const macs = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$config$2f$deviceFrames$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getDevicesByType"])('mac');
    const watches = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$config$2f$deviceFrames$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getDevicesByType"])('watch');
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$screenshots$2f$screenshots$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].container,
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("header", {
                className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$screenshots$2f$screenshots$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].header,
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h1", {
                        children: "📱 Screenshot Device Frames"
                    }, void 0, false, {
                        fileName: "[project]/src/app/screenshots/page.tsx",
                        lineNumber: 34,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                        children: "Create professional App Store screenshots with device frames for iPhone, iPad, Mac, and Apple Watch."
                    }, void 0, false, {
                        fileName: "[project]/src/app/screenshots/page.tsx",
                        lineNumber: 35,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/src/app/screenshots/page.tsx",
                lineNumber: 33,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$screenshots$2f$screenshots$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].layout,
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("aside", {
                        className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$screenshots$2f$screenshots$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].controls,
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("section", {
                                className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$screenshots$2f$screenshots$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].section,
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
                                        children: "Device Selection"
                                    }, void 0, false, {
                                        fileName: "[project]/src/app/screenshots/page.tsx",
                                        lineNumber: 45,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$screenshots$2f$screenshots$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].deviceGroup,
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h4", {
                                                children: "iPhone"
                                            }, void 0, false, {
                                                fileName: "[project]/src/app/screenshots/page.tsx",
                                                lineNumber: 48,
                                                columnNumber: 15
                                            }, this),
                                            iPhones.map((device)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                    className: `${__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$screenshots$2f$screenshots$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].deviceButton} ${selectedDevice === device.model ? __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$screenshots$2f$screenshots$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].active : ''}`,
                                                    onClick: ()=>setSelectedDevice(device.model),
                                                    children: [
                                                        device.displayName,
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                            className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$screenshots$2f$screenshots$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].deviceSize,
                                                            children: device.displaySize
                                                        }, void 0, false, {
                                                            fileName: "[project]/src/app/screenshots/page.tsx",
                                                            lineNumber: 58,
                                                            columnNumber: 19
                                                        }, this)
                                                    ]
                                                }, device.model, true, {
                                                    fileName: "[project]/src/app/screenshots/page.tsx",
                                                    lineNumber: 50,
                                                    columnNumber: 17
                                                }, this))
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/src/app/screenshots/page.tsx",
                                        lineNumber: 47,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$screenshots$2f$screenshots$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].deviceGroup,
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h4", {
                                                children: "iPad"
                                            }, void 0, false, {
                                                fileName: "[project]/src/app/screenshots/page.tsx",
                                                lineNumber: 64,
                                                columnNumber: 15
                                            }, this),
                                            iPads.slice(0, 5).map((device)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                    className: `${__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$screenshots$2f$screenshots$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].deviceButton} ${selectedDevice === device.model ? __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$screenshots$2f$screenshots$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].active : ''}`,
                                                    onClick: ()=>setSelectedDevice(device.model),
                                                    children: [
                                                        device.displayName,
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                            className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$screenshots$2f$screenshots$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].deviceSize,
                                                            children: device.displaySize
                                                        }, void 0, false, {
                                                            fileName: "[project]/src/app/screenshots/page.tsx",
                                                            lineNumber: 74,
                                                            columnNumber: 19
                                                        }, this)
                                                    ]
                                                }, device.model, true, {
                                                    fileName: "[project]/src/app/screenshots/page.tsx",
                                                    lineNumber: 66,
                                                    columnNumber: 17
                                                }, this))
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/src/app/screenshots/page.tsx",
                                        lineNumber: 63,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$screenshots$2f$screenshots$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].deviceGroup,
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h4", {
                                                children: "Mac"
                                            }, void 0, false, {
                                                fileName: "[project]/src/app/screenshots/page.tsx",
                                                lineNumber: 80,
                                                columnNumber: 15
                                            }, this),
                                            macs.map((device)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                    className: `${__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$screenshots$2f$screenshots$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].deviceButton} ${selectedDevice === device.model ? __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$screenshots$2f$screenshots$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].active : ''}`,
                                                    onClick: ()=>setSelectedDevice(device.model),
                                                    children: [
                                                        device.displayName,
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                            className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$screenshots$2f$screenshots$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].deviceSize,
                                                            children: device.displaySize
                                                        }, void 0, false, {
                                                            fileName: "[project]/src/app/screenshots/page.tsx",
                                                            lineNumber: 90,
                                                            columnNumber: 19
                                                        }, this)
                                                    ]
                                                }, device.model, true, {
                                                    fileName: "[project]/src/app/screenshots/page.tsx",
                                                    lineNumber: 82,
                                                    columnNumber: 17
                                                }, this))
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/src/app/screenshots/page.tsx",
                                        lineNumber: 79,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$screenshots$2f$screenshots$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].deviceGroup,
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h4", {
                                                children: "Apple Watch"
                                            }, void 0, false, {
                                                fileName: "[project]/src/app/screenshots/page.tsx",
                                                lineNumber: 96,
                                                columnNumber: 15
                                            }, this),
                                            watches.slice(0, 4).map((device)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                    className: `${__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$screenshots$2f$screenshots$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].deviceButton} ${selectedDevice === device.model ? __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$screenshots$2f$screenshots$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].active : ''}`,
                                                    onClick: ()=>setSelectedDevice(device.model),
                                                    children: [
                                                        device.displayName,
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                            className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$screenshots$2f$screenshots$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].deviceSize,
                                                            children: device.displaySize
                                                        }, void 0, false, {
                                                            fileName: "[project]/src/app/screenshots/page.tsx",
                                                            lineNumber: 106,
                                                            columnNumber: 19
                                                        }, this)
                                                    ]
                                                }, device.model, true, {
                                                    fileName: "[project]/src/app/screenshots/page.tsx",
                                                    lineNumber: 98,
                                                    columnNumber: 17
                                                }, this))
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/src/app/screenshots/page.tsx",
                                        lineNumber: 95,
                                        columnNumber: 13
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/app/screenshots/page.tsx",
                                lineNumber: 44,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("section", {
                                className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$screenshots$2f$screenshots$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].section,
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
                                        children: "Frame Options"
                                    }, void 0, false, {
                                        fileName: "[project]/src/app/screenshots/page.tsx",
                                        lineNumber: 113,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$screenshots$2f$screenshots$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].control,
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                                children: "Orientation"
                                            }, void 0, false, {
                                                fileName: "[project]/src/app/screenshots/page.tsx",
                                                lineNumber: 116,
                                                columnNumber: 15
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$screenshots$2f$screenshots$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].buttonGroup,
                                                children: [
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                        className: orientation === 'portrait' ? __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$screenshots$2f$screenshots$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].active : '',
                                                        onClick: ()=>setOrientation('portrait'),
                                                        children: "Portrait"
                                                    }, void 0, false, {
                                                        fileName: "[project]/src/app/screenshots/page.tsx",
                                                        lineNumber: 118,
                                                        columnNumber: 17
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                        className: orientation === 'landscape' ? __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$screenshots$2f$screenshots$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].active : '',
                                                        onClick: ()=>setOrientation('landscape'),
                                                        children: "Landscape"
                                                    }, void 0, false, {
                                                        fileName: "[project]/src/app/screenshots/page.tsx",
                                                        lineNumber: 124,
                                                        columnNumber: 17
                                                    }, this)
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/src/app/screenshots/page.tsx",
                                                lineNumber: 117,
                                                columnNumber: 15
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/src/app/screenshots/page.tsx",
                                        lineNumber: 115,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$screenshots$2f$screenshots$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].control,
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                                children: "Frame Color"
                                            }, void 0, false, {
                                                fileName: "[project]/src/app/screenshots/page.tsx",
                                                lineNumber: 134,
                                                columnNumber: 15
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                                type: "color",
                                                value: frameColor,
                                                onChange: (e)=>setFrameColor(e.target.value)
                                            }, void 0, false, {
                                                fileName: "[project]/src/app/screenshots/page.tsx",
                                                lineNumber: 135,
                                                columnNumber: 15
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/src/app/screenshots/page.tsx",
                                        lineNumber: 133,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$screenshots$2f$screenshots$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].control,
                                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                                    type: "checkbox",
                                                    checked: showButtons,
                                                    onChange: (e)=>setShowButtons(e.target.checked)
                                                }, void 0, false, {
                                                    fileName: "[project]/src/app/screenshots/page.tsx",
                                                    lineNumber: 144,
                                                    columnNumber: 17
                                                }, this),
                                                "Show Buttons"
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/src/app/screenshots/page.tsx",
                                            lineNumber: 143,
                                            columnNumber: 15
                                        }, this)
                                    }, void 0, false, {
                                        fileName: "[project]/src/app/screenshots/page.tsx",
                                        lineNumber: 142,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$screenshots$2f$screenshots$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].control,
                                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                                    type: "checkbox",
                                                    checked: showNotch,
                                                    onChange: (e)=>setShowNotch(e.target.checked)
                                                }, void 0, false, {
                                                    fileName: "[project]/src/app/screenshots/page.tsx",
                                                    lineNumber: 155,
                                                    columnNumber: 17
                                                }, this),
                                                "Show Notch/Island"
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/src/app/screenshots/page.tsx",
                                            lineNumber: 154,
                                            columnNumber: 15
                                        }, this)
                                    }, void 0, false, {
                                        fileName: "[project]/src/app/screenshots/page.tsx",
                                        lineNumber: 153,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$screenshots$2f$screenshots$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].control,
                                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                                    type: "checkbox",
                                                    checked: shadow,
                                                    onChange: (e)=>setShadow(e.target.checked)
                                                }, void 0, false, {
                                                    fileName: "[project]/src/app/screenshots/page.tsx",
                                                    lineNumber: 166,
                                                    columnNumber: 17
                                                }, this),
                                                "Shadow"
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/src/app/screenshots/page.tsx",
                                            lineNumber: 165,
                                            columnNumber: 15
                                        }, this)
                                    }, void 0, false, {
                                        fileName: "[project]/src/app/screenshots/page.tsx",
                                        lineNumber: 164,
                                        columnNumber: 13
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/app/screenshots/page.tsx",
                                lineNumber: 112,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("section", {
                                className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$screenshots$2f$screenshots$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].section,
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
                                        children: "Export"
                                    }, void 0, false, {
                                        fileName: "[project]/src/app/screenshots/page.tsx",
                                        lineNumber: 177,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                        className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$screenshots$2f$screenshots$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].exportButton,
                                        children: "Download Frame"
                                    }, void 0, false, {
                                        fileName: "[project]/src/app/screenshots/page.tsx",
                                        lineNumber: 178,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                        className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$screenshots$2f$screenshots$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].exportButton,
                                        children: "Generate All Sizes"
                                    }, void 0, false, {
                                        fileName: "[project]/src/app/screenshots/page.tsx",
                                        lineNumber: 179,
                                        columnNumber: 13
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/app/screenshots/page.tsx",
                                lineNumber: 176,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/app/screenshots/page.tsx",
                        lineNumber: 43,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("main", {
                        className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$screenshots$2f$screenshots$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].preview,
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$screenshots$2f$screenshots$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].previewContainer,
                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$DeviceFrame$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["DeviceFrame"], {
                                    device: selectedDevice,
                                    orientation: orientation,
                                    content: sampleContent,
                                    style: {
                                        frameColor,
                                        showButtons,
                                        showNotch,
                                        shadow
                                    },
                                    width: orientation === 'portrait' ? 400 : 600
                                }, void 0, false, {
                                    fileName: "[project]/src/app/screenshots/page.tsx",
                                    lineNumber: 186,
                                    columnNumber: 13
                                }, this)
                            }, void 0, false, {
                                fileName: "[project]/src/app/screenshots/page.tsx",
                                lineNumber: 185,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$screenshots$2f$screenshots$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].previewInfo,
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
                                        children: "Preview"
                                    }, void 0, false, {
                                        fileName: "[project]/src/app/screenshots/page.tsx",
                                        lineNumber: 201,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("strong", {
                                                children: "Device:"
                                            }, void 0, false, {
                                                fileName: "[project]/src/app/screenshots/page.tsx",
                                                lineNumber: 203,
                                                columnNumber: 15
                                            }, this),
                                            " ",
                                            selectedDevice
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/src/app/screenshots/page.tsx",
                                        lineNumber: 202,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("strong", {
                                                children: "Orientation:"
                                            }, void 0, false, {
                                                fileName: "[project]/src/app/screenshots/page.tsx",
                                                lineNumber: 206,
                                                columnNumber: 15
                                            }, this),
                                            " ",
                                            orientation
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/src/app/screenshots/page.tsx",
                                        lineNumber: 205,
                                        columnNumber: 13
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/app/screenshots/page.tsx",
                                lineNumber: 200,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/app/screenshots/page.tsx",
                        lineNumber: 184,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/src/app/screenshots/page.tsx",
                lineNumber: 41,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/src/app/screenshots/page.tsx",
        lineNumber: 32,
        columnNumber: 5
    }, this);
}
_s(ScreenshotsPage, "NDrsXxqlDxcWxFnPg02Z+2SDCdE=");
_c = ScreenshotsPage;
var _c;
__turbopack_context__.k.register(_c, "ScreenshotsPage");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
]);

//# sourceMappingURL=src_302315c4._.js.map