module.exports = [
"[externals]/next/dist/compiled/next-server/app-page-turbo.runtime.dev.js [external] (next/dist/compiled/next-server/app-page-turbo.runtime.dev.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/compiled/next-server/app-page-turbo.runtime.dev.js", () => require("next/dist/compiled/next-server/app-page-turbo.runtime.dev.js"));

module.exports = mod;
}),
"[project]/src/config/deviceFrames.ts [app-ssr] (ecmascript)", ((__turbopack_context__) => {
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
}),
"[project]/src/types/deviceFrame.ts [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

/**
 * Device Frame Types
 *
 * Type definitions for App Store screenshot device frames.
 * Supports iPhone, iPad, Mac, Apple Watch, Apple TV, and Apple Vision Pro.
 */ __turbopack_context__.s([]);
;
}),
"[project]/src/components/DeviceFrame.tsx [app-ssr] (ecmascript) <locals>", ((__turbopack_context__) => {
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
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$remotion$2f$dist$2f$esm$2f$index$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/remotion/dist/esm/index.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$config$2f$deviceFrames$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/config/deviceFrames.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$types$2f$deviceFrame$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/types/deviceFrame.ts [app-ssr] (ecmascript)");
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
        const config = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$config$2f$deviceFrames$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["getDeviceFrame"])(device);
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
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        style: containerStyle,
        className: className,
        "data-device": config.model,
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                style: frameContainerStyle,
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        style: screenStyle,
                        children: [
                            notchStyle && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                style: notchStyle
                            }, void 0, false, {
                                fileName: "[project]/src/components/DeviceFrame.tsx",
                                lineNumber: 240,
                                columnNumber: 26
                            }, ("TURBOPACK compile-time value", void 0)),
                            content && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Fragment"], {
                                children: typeof content === 'string' ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$remotion$2f$dist$2f$esm$2f$index$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Img"], {
                                    src: content,
                                    style: contentStyle
                                }, void 0, false, {
                                    fileName: "[project]/src/components/DeviceFrame.tsx",
                                    lineNumber: 246,
                                    columnNumber: 17
                                }, ("TURBOPACK compile-time value", void 0)) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
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
                    homeButtonStyle && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
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
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Fragment"], {
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
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
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
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
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
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
}),
"[project]/src/types/captionOverlay.ts [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

/**
 * Caption Overlay Types
 *
 * Type definitions for text overlays on App Store screenshots.
 * Supports positioning, styling, and localization.
 */ __turbopack_context__.s([
    "captionPresets",
    ()=>captionPresets,
    "createCaptionFromPreset",
    ()=>createCaptionFromPreset,
    "getCaptionPreset",
    ()=>getCaptionPreset,
    "getCaptionPresetsByCategory",
    ()=>getCaptionPresetsByCategory,
    "getCaptionStyle",
    ()=>getCaptionStyle,
    "getCaptionText",
    ()=>getCaptionText
]);
const captionPresets = [
    {
        id: 'hero-heading',
        name: 'Hero Heading',
        description: 'Large, bold heading at the top',
        category: 'heading',
        positioning: {
            position: 'top-center',
            offsetY: 80,
            horizontalAlign: 'center',
            verticalAlign: 'top'
        },
        style: {
            fontFamily: 'SF Pro Display, -apple-system, sans-serif',
            fontSize: 48,
            fontWeight: 700,
            color: '#ffffff',
            textAlign: 'center',
            textShadow: '0 2px 8px rgba(0, 0, 0, 0.3)',
            padding: '16px 32px',
            maxWidth: '80%'
        },
        exampleText: 'Welcome to Your App'
    },
    {
        id: 'subtitle',
        name: 'Subtitle',
        description: 'Medium-sized subtitle text',
        category: 'subheading',
        positioning: {
            position: 'top-center',
            offsetY: 160,
            horizontalAlign: 'center',
            verticalAlign: 'top'
        },
        style: {
            fontFamily: 'SF Pro Text, -apple-system, sans-serif',
            fontSize: 24,
            fontWeight: 500,
            color: '#ffffff',
            textAlign: 'center',
            textShadow: '0 1px 4px rgba(0, 0, 0, 0.2)',
            padding: '8px 24px',
            maxWidth: '70%',
            opacity: 0.9
        },
        exampleText: 'Experience the future of productivity'
    },
    {
        id: 'feature-badge',
        name: 'Feature Badge',
        description: 'Small badge highlighting a feature',
        category: 'badge',
        positioning: {
            position: 'top-left',
            offsetX: 24,
            offsetY: 24,
            horizontalAlign: 'left',
            verticalAlign: 'top'
        },
        style: {
            fontFamily: 'SF Pro Text, -apple-system, sans-serif',
            fontSize: 14,
            fontWeight: 600,
            color: '#ffffff',
            backgroundColor: '#007AFF',
            textAlign: 'center',
            padding: '8px 16px',
            borderRadius: 20,
            textTransform: 'uppercase',
            letterSpacing: '0.5px'
        },
        exampleText: 'NEW'
    },
    {
        id: 'bottom-caption',
        name: 'Bottom Caption',
        description: 'Text caption at the bottom',
        category: 'body',
        positioning: {
            position: 'bottom-center',
            offsetY: 60,
            horizontalAlign: 'center',
            verticalAlign: 'bottom'
        },
        style: {
            fontFamily: 'SF Pro Text, -apple-system, sans-serif',
            fontSize: 18,
            fontWeight: 400,
            color: '#ffffff',
            textAlign: 'center',
            padding: '12px 24px',
            backgroundColor: 'rgba(0, 0, 0, 0.6)',
            borderRadius: 12,
            backdropFilter: 'blur(10px)',
            maxWidth: '85%'
        },
        exampleText: 'Seamlessly sync across all your devices'
    },
    {
        id: 'center-callout',
        name: 'Center Callout',
        description: 'Large centered text overlay',
        category: 'feature',
        positioning: {
            position: 'center',
            horizontalAlign: 'center',
            verticalAlign: 'middle'
        },
        style: {
            fontFamily: 'SF Pro Display, -apple-system, sans-serif',
            fontSize: 36,
            fontWeight: 700,
            color: '#ffffff',
            textAlign: 'center',
            padding: '24px 40px',
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            borderRadius: 16,
            backdropFilter: 'blur(20px)',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
            maxWidth: '80%'
        },
        exampleText: 'Fast. Powerful. Private.'
    }
];
function getCaptionText(text, locale) {
    if (typeof text === 'string') {
        return text;
    }
    if (!locale) {
        return text[0]?.text || '';
    }
    // Try exact match
    const exactMatch = text.find((t)=>t.locale === locale);
    if (exactMatch) {
        return exactMatch.text;
    }
    // Try language-only match (e.g., 'en' for 'en-US')
    const languageCode = locale.split('-')[0];
    const languageMatch = text.find((t)=>t.locale.startsWith(languageCode));
    if (languageMatch) {
        return languageMatch.text;
    }
    // Fallback to first entry or empty string
    return text[0]?.text || '';
}
function getCaptionStyle(text, baseStyle, locale) {
    if (typeof text === 'string') {
        return baseStyle;
    }
    if (!locale) {
        return {
            ...baseStyle,
            ...text[0]?.style
        };
    }
    // Try exact match
    const exactMatch = text.find((t)=>t.locale === locale);
    if (exactMatch?.style) {
        return {
            ...baseStyle,
            ...exactMatch.style
        };
    }
    // Try language-only match
    const languageCode = locale.split('-')[0];
    const languageMatch = text.find((t)=>t.locale.startsWith(languageCode));
    if (languageMatch?.style) {
        return {
            ...baseStyle,
            ...languageMatch.style
        };
    }
    // Fallback to base style
    return {
        ...baseStyle,
        ...text[0]?.style
    };
}
function getCaptionPreset(id) {
    return captionPresets.find((preset)=>preset.id === id);
}
function getCaptionPresetsByCategory(category) {
    return captionPresets.filter((preset)=>preset.category === category);
}
function createCaptionFromPreset(presetId, text, overrides) {
    const preset = getCaptionPreset(presetId);
    if (!preset) {
        return null;
    }
    return {
        id: `caption-${Date.now()}`,
        text: text || preset.exampleText,
        positioning: {
            ...preset.positioning
        },
        style: {
            ...preset.style
        },
        visible: true,
        ...overrides
    };
}
}),
"[project]/src/components/CaptionOverlay.tsx [app-ssr] (ecmascript) <locals>", ((__turbopack_context__) => {
"use strict";

/**
 * CaptionOverlay Component
 *
 * Renders text captions/overlays on screenshots with positioning, styling, and localization support.
 * Compatible with Remotion for static rendering and React for UI.
 *
 * @example
 * ```tsx
 * <CaptionOverlay
 *   caption={{
 *     id: 'caption-1',
 *     text: 'Welcome to Your App',
 *     positioning: { position: 'top-center', offsetY: 80 },
 *     style: { fontSize: 48, fontWeight: 700, color: '#ffffff' }
 *   }}
 *   locale="en-US"
 * />
 * ```
 */ __turbopack_context__.s([
    "CaptionOverlay",
    ()=>CaptionOverlay,
    "default",
    ()=>__TURBOPACK__default__export__
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$types$2f$captionOverlay$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/types/captionOverlay.ts [app-ssr] (ecmascript)");
;
;
/**
 * Convert caption position to CSS positioning
 */ function getPositionStyles(position, offsetX = 0, offsetY = 0) {
    const styles = {
        position: 'absolute'
    };
    switch(position){
        case 'top-left':
            styles.top = offsetY;
            styles.left = offsetX;
            break;
        case 'top-center':
            styles.top = offsetY;
            styles.left = '50%';
            styles.transform = 'translateX(-50%)';
            break;
        case 'top-right':
            styles.top = offsetY;
            styles.right = offsetX;
            break;
        case 'center-left':
            styles.top = '50%';
            styles.left = offsetX;
            styles.transform = 'translateY(-50%)';
            break;
        case 'center':
            styles.top = '50%';
            styles.left = '50%';
            styles.transform = 'translate(-50%, -50%)';
            break;
        case 'center-right':
            styles.top = '50%';
            styles.right = offsetX;
            styles.transform = 'translateY(-50%)';
            break;
        case 'bottom-left':
            styles.bottom = offsetY;
            styles.left = offsetX;
            break;
        case 'bottom-center':
            styles.bottom = offsetY;
            styles.left = '50%';
            styles.transform = 'translateX(-50%)';
            break;
        case 'bottom-right':
            styles.bottom = offsetY;
            styles.right = offsetX;
            break;
        case 'custom':
            break;
    }
    return styles;
}
/**
 * Convert caption style to CSS properties
 */ function captionStyleToCSS(style) {
    const css = {};
    // Font
    if (style.fontFamily) css.fontFamily = style.fontFamily;
    if (style.fontSize) css.fontSize = typeof style.fontSize === 'number' ? `${style.fontSize}px` : style.fontSize;
    if (style.fontWeight) css.fontWeight = style.fontWeight;
    if (style.fontStyle) css.fontStyle = style.fontStyle;
    if (style.lineHeight) css.lineHeight = typeof style.lineHeight === 'number' ? `${style.lineHeight}` : style.lineHeight;
    if (style.letterSpacing) css.letterSpacing = typeof style.letterSpacing === 'number' ? `${style.letterSpacing}px` : style.letterSpacing;
    // Color
    if (style.color) css.color = style.color;
    if (style.backgroundColor) {
        if (style.backgroundOpacity !== undefined) {
            // Parse color and apply opacity
            const rgb = parseColor(style.backgroundColor);
            if (rgb) {
                css.backgroundColor = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${style.backgroundOpacity})`;
            } else {
                css.backgroundColor = style.backgroundColor;
            }
        } else {
            css.backgroundColor = style.backgroundColor;
        }
    }
    // Text styling
    if (style.textAlign) css.textAlign = style.textAlign;
    if (style.textTransform) css.textTransform = style.textTransform;
    if (style.textDecoration) css.textDecoration = style.textDecoration;
    // Spacing
    if (style.padding !== undefined) css.padding = typeof style.padding === 'number' ? `${style.padding}px` : style.padding;
    if (style.paddingTop !== undefined) css.paddingTop = typeof style.paddingTop === 'number' ? `${style.paddingTop}px` : style.paddingTop;
    if (style.paddingRight !== undefined) css.paddingRight = typeof style.paddingRight === 'number' ? `${style.paddingRight}px` : style.paddingRight;
    if (style.paddingBottom !== undefined) css.paddingBottom = typeof style.paddingBottom === 'number' ? `${style.paddingBottom}px` : style.paddingBottom;
    if (style.paddingLeft !== undefined) css.paddingLeft = typeof style.paddingLeft === 'number' ? `${style.paddingLeft}px` : style.paddingLeft;
    if (style.margin !== undefined) css.margin = typeof style.margin === 'number' ? `${style.margin}px` : style.margin;
    if (style.marginTop !== undefined) css.marginTop = typeof style.marginTop === 'number' ? `${style.marginTop}px` : style.marginTop;
    if (style.marginRight !== undefined) css.marginRight = typeof style.marginRight === 'number' ? `${style.marginRight}px` : style.marginRight;
    if (style.marginBottom !== undefined) css.marginBottom = typeof style.marginBottom === 'number' ? `${style.marginBottom}px` : style.marginBottom;
    if (style.marginLeft !== undefined) css.marginLeft = typeof style.marginLeft === 'number' ? `${style.marginLeft}px` : style.marginLeft;
    // Border & shadow
    if (style.borderRadius !== undefined) css.borderRadius = typeof style.borderRadius === 'number' ? `${style.borderRadius}px` : style.borderRadius;
    if (style.border) css.border = style.border;
    if (style.boxShadow) css.boxShadow = style.boxShadow;
    if (style.textShadow) css.textShadow = style.textShadow;
    // Size
    if (style.maxWidth !== undefined) css.maxWidth = typeof style.maxWidth === 'number' ? `${style.maxWidth}px` : style.maxWidth;
    if (style.minWidth !== undefined) css.minWidth = typeof style.minWidth === 'number' ? `${style.minWidth}px` : style.minWidth;
    if (style.width !== undefined) css.width = typeof style.width === 'number' ? `${style.width}px` : style.width;
    // Opacity
    if (style.opacity !== undefined) css.opacity = style.opacity;
    // Backdrop
    if (style.backdropFilter) css.backdropFilter = style.backdropFilter;
    return css;
}
/**
 * Parse color string to RGB values
 */ function parseColor(color) {
    // Handle hex colors
    if (color.startsWith('#')) {
        const hex = color.slice(1);
        if (hex.length === 3) {
            return {
                r: parseInt(hex[0] + hex[0], 16),
                g: parseInt(hex[1] + hex[1], 16),
                b: parseInt(hex[2] + hex[2], 16)
            };
        } else if (hex.length === 6) {
            return {
                r: parseInt(hex.slice(0, 2), 16),
                g: parseInt(hex.slice(2, 4), 16),
                b: parseInt(hex.slice(4, 6), 16)
            };
        }
    }
    // Handle rgb() format
    const rgbMatch = color.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
    if (rgbMatch) {
        return {
            r: parseInt(rgbMatch[1]),
            g: parseInt(rgbMatch[2]),
            b: parseInt(rgbMatch[3])
        };
    }
    return null;
}
function CaptionOverlay({ caption, locale, containerWidth, containerHeight, rtl = false, className, style: additionalStyles, onClick, onDoubleClick, onMouseEnter, onMouseLeave }) {
    // Don't render if not visible
    if (caption.visible === false) {
        return null;
    }
    // Get localized text and style
    const text = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$types$2f$captionOverlay$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["getCaptionText"])(caption.text, locale);
    const captionStyle = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$types$2f$captionOverlay$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["getCaptionStyle"])(caption.text, caption.style, locale);
    // Build positioning styles
    let positionStyles;
    if (caption.positioning.position === 'custom') {
        // Custom positioning using x, y coordinates
        positionStyles = {
            position: 'absolute',
            ...caption.positioning.x !== undefined && {
                left: typeof caption.positioning.x === 'number' ? `${caption.positioning.x}%` : caption.positioning.x
            },
            ...caption.positioning.y !== undefined && {
                top: typeof caption.positioning.y === 'number' ? `${caption.positioning.y}%` : caption.positioning.y
            }
        };
    } else {
        // Preset positioning
        positionStyles = getPositionStyles(caption.positioning.position, caption.positioning.offsetX, caption.positioning.offsetY);
    }
    // Apply z-index
    if (caption.positioning.zIndex !== undefined) {
        positionStyles.zIndex = caption.positioning.zIndex;
    }
    // Convert caption style to CSS
    const styleCSS = captionStyleToCSS(captionStyle);
    // Apply RTL if needed
    if (rtl) {
        styleCSS.direction = 'rtl';
    }
    // Merge all styles
    const finalStyles = {
        ...positionStyles,
        ...styleCSS,
        ...additionalStyles
    };
    // Apply animation if specified
    let animationClass = '';
    if (caption.animation && caption.animation.type !== 'none') {
        animationClass = `caption-animation-${caption.animation.type}`;
    }
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: `caption-overlay ${animationClass} ${className || ''}`.trim(),
        style: finalStyles,
        onClick: onClick,
        onDoubleClick: onDoubleClick,
        onMouseEnter: onMouseEnter,
        onMouseLeave: onMouseLeave,
        "data-caption-id": caption.id,
        children: text
    }, void 0, false, {
        fileName: "[project]/src/components/CaptionOverlay.tsx",
        lineNumber: 271,
        columnNumber: 5
    }, this);
}
const __TURBOPACK__default__export__ = CaptionOverlay;
;
}),
"[project]/src/app/screenshots/editor/editor.module.css [app-ssr] (css module)", ((__turbopack_context__) => {

__turbopack_context__.v({
  "active": "editor-module__UqKZAG__active",
  "activeTab": "editor-module__UqKZAG__activeTab",
  "addButton": "editor-module__UqKZAG__addButton",
  "captionEditor": "editor-module__UqKZAG__captionEditor",
  "captionItem": "editor-module__UqKZAG__captionItem",
  "captionItemHeader": "editor-module__UqKZAG__captionItemHeader",
  "captionItemText": "editor-module__UqKZAG__captionItemText",
  "captionList": "editor-module__UqKZAG__captionList",
  "colorInput": "editor-module__UqKZAG__colorInput",
  "container": "editor-module__UqKZAG__container",
  "control": "editor-module__UqKZAG__control",
  "controlRow": "editor-module__UqKZAG__controlRow",
  "deleteButton": "editor-module__UqKZAG__deleteButton",
  "editorLayout": "editor-module__UqKZAG__editorLayout",
  "emptyState": "editor-module__UqKZAG__emptyState",
  "exportButton": "editor-module__UqKZAG__exportButton",
  "fileInfo": "editor-module__UqKZAG__fileInfo",
  "fileName": "editor-module__UqKZAG__fileName",
  "header": "editor-module__UqKZAG__header",
  "headerActions": "editor-module__UqKZAG__headerActions",
  "headerContent": "editor-module__UqKZAG__headerContent",
  "hiddenBadge": "editor-module__UqKZAG__hiddenBadge",
  "input": "editor-module__UqKZAG__input",
  "layerIcon": "editor-module__UqKZAG__layerIcon",
  "layerItem": "editor-module__UqKZAG__layerItem",
  "layerName": "editor-module__UqKZAG__layerName",
  "layersList": "editor-module__UqKZAG__layersList",
  "orientationButton": "editor-module__UqKZAG__orientationButton",
  "orientationButtons": "editor-module__UqKZAG__orientationButtons",
  "placeholderContent": "editor-module__UqKZAG__placeholderContent",
  "placeholderIcon": "editor-module__UqKZAG__placeholderIcon",
  "preview": "editor-module__UqKZAG__preview",
  "previewCanvas": "editor-module__UqKZAG__previewCanvas",
  "previewContent": "editor-module__UqKZAG__previewContent",
  "previewHeader": "editor-module__UqKZAG__previewHeader",
  "previewPlaceholder": "editor-module__UqKZAG__previewPlaceholder",
  "primaryButton": "editor-module__UqKZAG__primaryButton",
  "rightSidebar": "editor-module__UqKZAG__rightSidebar",
  "section": "editor-module__UqKZAG__section",
  "sectionHeader": "editor-module__UqKZAG__sectionHeader",
  "select": "editor-module__UqKZAG__select",
  "selectedCaptionItem": "editor-module__UqKZAG__selectedCaptionItem",
  "selectedLayer": "editor-module__UqKZAG__selectedLayer",
  "sidebar": "editor-module__UqKZAG__sidebar",
  "slider": "editor-module__UqKZAG__slider",
  "tab": "editor-module__UqKZAG__tab",
  "tabContent": "editor-module__UqKZAG__tabContent",
  "tabs": "editor-module__UqKZAG__tabs",
  "textarea": "editor-module__UqKZAG__textarea",
  "uploadButton": "editor-module__UqKZAG__uploadButton",
  "uploadButtonLarge": "editor-module__UqKZAG__uploadButtonLarge",
  "uploadSection": "editor-module__UqKZAG__uploadSection",
  "zoomButton": "editor-module__UqKZAG__zoomButton",
  "zoomControls": "editor-module__UqKZAG__zoomControls",
  "zoomValue": "editor-module__UqKZAG__zoomValue",
});
}),
"[project]/src/app/screenshots/editor/page.tsx [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>ScreenshotEditorPage
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$DeviceFrame$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/src/components/DeviceFrame.tsx [app-ssr] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$CaptionOverlay$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/src/components/CaptionOverlay.tsx [app-ssr] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$types$2f$captionOverlay$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/types/captionOverlay.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$config$2f$deviceFrames$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/config/deviceFrames.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$screenshots$2f$editor$2f$editor$2e$module$2e$css__$5b$app$2d$ssr$5d$__$28$css__module$29$__ = __turbopack_context__.i("[project]/src/app/screenshots/editor/editor.module.css [app-ssr] (css module)");
/**
 * Screenshot Editor UI (APP-025)
 *
 * Visual editor for positioning screenshots and captions.
 * Combines device frames (APP-001) with caption overlays (APP-002).
 */ 'use client';
;
;
;
;
;
;
;
function ScreenshotEditorPage() {
    // Screenshot state
    const [screenshot, setScreenshot] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(null);
    const [screenshotFile, setScreenshotFile] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(null);
    // Device state
    const [selectedDevice, setSelectedDevice] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])('iphone-16-pro-max');
    const [orientation, setOrientation] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])('portrait');
    // Caption layers
    const [captions, setCaptions] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])([]);
    const [selectedCaptionId, setSelectedCaptionId] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(null);
    // Editor state
    const [zoom, setZoom] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(1);
    const [activeTab, setActiveTab] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])('device');
    const fileInputRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useRef"])(null);
    // Device lists
    const iPhones = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$config$2f$deviceFrames$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["getDevicesByType"])('iphone');
    const iPads = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$config$2f$deviceFrames$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["getDevicesByType"])('ipad');
    const macs = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$config$2f$deviceFrames$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["getDevicesByType"])('mac');
    // Handle screenshot upload
    const handleFileUpload = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useCallback"])((e)=>{
        const file = e.target.files?.[0];
        if (!file) return;
        setScreenshotFile(file);
        const reader = new FileReader();
        reader.onload = (event)=>{
            setScreenshot(event.target?.result);
        };
        reader.readAsDataURL(file);
    }, []);
    // Add new caption
    const handleAddCaption = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useCallback"])(()=>{
        const newId = `caption-${Date.now()}`;
        const newCaption = {
            id: newId,
            caption: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$types$2f$captionOverlay$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["createCaptionFromPreset"])('hero-heading', 'New Caption', {
                visible: true
            }),
            visible: true
        };
        setCaptions((prev)=>[
                ...prev,
                newCaption
            ]);
        setSelectedCaptionId(newId);
    }, []);
    // Update caption
    const handleUpdateCaption = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useCallback"])((id, updates)=>{
        setCaptions((prev)=>prev.map((layer)=>layer.id === id ? {
                    ...layer,
                    caption: {
                        ...layer.caption,
                        ...updates
                    }
                } : layer));
    }, []);
    // Delete caption
    const handleDeleteCaption = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useCallback"])((id)=>{
        setCaptions((prev)=>prev.filter((layer)=>layer.id !== id));
        if (selectedCaptionId === id) {
            setSelectedCaptionId(null);
        }
    }, [
        selectedCaptionId
    ]);
    // Toggle caption visibility
    const handleToggleCaptionVisibility = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useCallback"])((id)=>{
        setCaptions((prev)=>prev.map((layer)=>layer.id === id ? {
                    ...layer,
                    visible: !layer.visible
                } : layer));
    }, []);
    // Export screenshot
    const handleExport = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useCallback"])(()=>{
        // Get the preview canvas
        const previewElement = document.getElementById('screenshot-preview');
        if (!previewElement) {
            alert('Preview not found');
            return;
        }
        // Create a temporary canvas for export
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) {
            alert('Canvas context not available');
            return;
        }
        // Use html2canvas or similar library in production
        // For now, we'll just show an alert
        alert('Export functionality coming soon! In production, this would render the preview to an image.');
    }, []);
    // Get selected caption
    const selectedCaption = captions.find((c)=>c.id === selectedCaptionId);
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$screenshots$2f$editor$2f$editor$2e$module$2e$css__$5b$app$2d$ssr$5d$__$28$css__module$29$__["default"].container,
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("header", {
                className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$screenshots$2f$editor$2f$editor$2e$module$2e$css__$5b$app$2d$ssr$5d$__$28$css__module$29$__["default"].header,
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$screenshots$2f$editor$2f$editor$2e$module$2e$css__$5b$app$2d$ssr$5d$__$28$css__module$29$__["default"].headerContent,
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("h1", {
                                children: "📱 Screenshot Editor"
                            }, void 0, false, {
                                fileName: "[project]/src/app/screenshots/editor/page.tsx",
                                lineNumber: 139,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                children: "Create beautiful App Store screenshots with device frames and captions"
                            }, void 0, false, {
                                fileName: "[project]/src/app/screenshots/editor/page.tsx",
                                lineNumber: 140,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/app/screenshots/editor/page.tsx",
                        lineNumber: 138,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$screenshots$2f$editor$2f$editor$2e$module$2e$css__$5b$app$2d$ssr$5d$__$28$css__module$29$__["default"].headerActions,
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                            className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$screenshots$2f$editor$2f$editor$2e$module$2e$css__$5b$app$2d$ssr$5d$__$28$css__module$29$__["default"].exportButton,
                            onClick: handleExport,
                            children: "Export Screenshot"
                        }, void 0, false, {
                            fileName: "[project]/src/app/screenshots/editor/page.tsx",
                            lineNumber: 143,
                            columnNumber: 11
                        }, this)
                    }, void 0, false, {
                        fileName: "[project]/src/app/screenshots/editor/page.tsx",
                        lineNumber: 142,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/src/app/screenshots/editor/page.tsx",
                lineNumber: 137,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$screenshots$2f$editor$2f$editor$2e$module$2e$css__$5b$app$2d$ssr$5d$__$28$css__module$29$__["default"].editorLayout,
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("aside", {
                        className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$screenshots$2f$editor$2f$editor$2e$module$2e$css__$5b$app$2d$ssr$5d$__$28$css__module$29$__["default"].sidebar,
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$screenshots$2f$editor$2f$editor$2e$module$2e$css__$5b$app$2d$ssr$5d$__$28$css__module$29$__["default"].tabs,
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                        className: `${__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$screenshots$2f$editor$2f$editor$2e$module$2e$css__$5b$app$2d$ssr$5d$__$28$css__module$29$__["default"].tab} ${activeTab === 'device' ? __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$screenshots$2f$editor$2f$editor$2e$module$2e$css__$5b$app$2d$ssr$5d$__$28$css__module$29$__["default"].activeTab : ''}`,
                                        onClick: ()=>setActiveTab('device'),
                                        children: "📱 Device"
                                    }, void 0, false, {
                                        fileName: "[project]/src/app/screenshots/editor/page.tsx",
                                        lineNumber: 154,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                        className: `${__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$screenshots$2f$editor$2f$editor$2e$module$2e$css__$5b$app$2d$ssr$5d$__$28$css__module$29$__["default"].tab} ${activeTab === 'captions' ? __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$screenshots$2f$editor$2f$editor$2e$module$2e$css__$5b$app$2d$ssr$5d$__$28$css__module$29$__["default"].activeTab : ''}`,
                                        onClick: ()=>setActiveTab('captions'),
                                        children: "💬 Captions"
                                    }, void 0, false, {
                                        fileName: "[project]/src/app/screenshots/editor/page.tsx",
                                        lineNumber: 160,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                        className: `${__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$screenshots$2f$editor$2f$editor$2e$module$2e$css__$5b$app$2d$ssr$5d$__$28$css__module$29$__["default"].tab} ${activeTab === 'export' ? __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$screenshots$2f$editor$2f$editor$2e$module$2e$css__$5b$app$2d$ssr$5d$__$28$css__module$29$__["default"].activeTab : ''}`,
                                        onClick: ()=>setActiveTab('export'),
                                        children: "📤 Export"
                                    }, void 0, false, {
                                        fileName: "[project]/src/app/screenshots/editor/page.tsx",
                                        lineNumber: 166,
                                        columnNumber: 13
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/app/screenshots/editor/page.tsx",
                                lineNumber: 153,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$screenshots$2f$editor$2f$editor$2e$module$2e$css__$5b$app$2d$ssr$5d$__$28$css__module$29$__["default"].tabContent,
                                children: [
                                    activeTab === 'device' && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$screenshots$2f$editor$2f$editor$2e$module$2e$css__$5b$app$2d$ssr$5d$__$28$css__module$29$__["default"].section,
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
                                                children: "Screenshot"
                                            }, void 0, false, {
                                                fileName: "[project]/src/app/screenshots/editor/page.tsx",
                                                lineNumber: 179,
                                                columnNumber: 17
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$screenshots$2f$editor$2f$editor$2e$module$2e$css__$5b$app$2d$ssr$5d$__$28$css__module$29$__["default"].uploadSection,
                                                children: [
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                                        ref: fileInputRef,
                                                        type: "file",
                                                        accept: "image/*",
                                                        onChange: handleFileUpload,
                                                        style: {
                                                            display: 'none'
                                                        }
                                                    }, void 0, false, {
                                                        fileName: "[project]/src/app/screenshots/editor/page.tsx",
                                                        lineNumber: 181,
                                                        columnNumber: 19
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                        className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$screenshots$2f$editor$2f$editor$2e$module$2e$css__$5b$app$2d$ssr$5d$__$28$css__module$29$__["default"].uploadButton,
                                                        onClick: ()=>fileInputRef.current?.click(),
                                                        children: screenshot ? 'Change Screenshot' : 'Upload Screenshot'
                                                    }, void 0, false, {
                                                        fileName: "[project]/src/app/screenshots/editor/page.tsx",
                                                        lineNumber: 188,
                                                        columnNumber: 19
                                                    }, this),
                                                    screenshot && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                        className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$screenshots$2f$editor$2f$editor$2e$module$2e$css__$5b$app$2d$ssr$5d$__$28$css__module$29$__["default"].fileInfo,
                                                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                            className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$screenshots$2f$editor$2f$editor$2e$module$2e$css__$5b$app$2d$ssr$5d$__$28$css__module$29$__["default"].fileName,
                                                            children: screenshotFile?.name || 'Screenshot uploaded'
                                                        }, void 0, false, {
                                                            fileName: "[project]/src/app/screenshots/editor/page.tsx",
                                                            lineNumber: 196,
                                                            columnNumber: 23
                                                        }, this)
                                                    }, void 0, false, {
                                                        fileName: "[project]/src/app/screenshots/editor/page.tsx",
                                                        lineNumber: 195,
                                                        columnNumber: 21
                                                    }, this)
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/src/app/screenshots/editor/page.tsx",
                                                lineNumber: 180,
                                                columnNumber: 17
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
                                                children: "Device Selection"
                                            }, void 0, false, {
                                                fileName: "[project]/src/app/screenshots/editor/page.tsx",
                                                lineNumber: 203,
                                                columnNumber: 17
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$screenshots$2f$editor$2f$editor$2e$module$2e$css__$5b$app$2d$ssr$5d$__$28$css__module$29$__["default"].control,
                                                children: [
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                                        children: "iPhone"
                                                    }, void 0, false, {
                                                        fileName: "[project]/src/app/screenshots/editor/page.tsx",
                                                        lineNumber: 205,
                                                        columnNumber: 19
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("select", {
                                                        value: selectedDevice,
                                                        onChange: (e)=>setSelectedDevice(e.target.value),
                                                        className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$screenshots$2f$editor$2f$editor$2e$module$2e$css__$5b$app$2d$ssr$5d$__$28$css__module$29$__["default"].select,
                                                        children: iPhones.map((device)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                                                value: device.model,
                                                                children: device.name
                                                            }, device.model, false, {
                                                                fileName: "[project]/src/app/screenshots/editor/page.tsx",
                                                                lineNumber: 212,
                                                                columnNumber: 23
                                                            }, this))
                                                    }, void 0, false, {
                                                        fileName: "[project]/src/app/screenshots/editor/page.tsx",
                                                        lineNumber: 206,
                                                        columnNumber: 19
                                                    }, this)
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/src/app/screenshots/editor/page.tsx",
                                                lineNumber: 204,
                                                columnNumber: 17
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
                                                children: "Orientation"
                                            }, void 0, false, {
                                                fileName: "[project]/src/app/screenshots/editor/page.tsx",
                                                lineNumber: 219,
                                                columnNumber: 17
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$screenshots$2f$editor$2f$editor$2e$module$2e$css__$5b$app$2d$ssr$5d$__$28$css__module$29$__["default"].orientationButtons,
                                                children: [
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                        className: `${__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$screenshots$2f$editor$2f$editor$2e$module$2e$css__$5b$app$2d$ssr$5d$__$28$css__module$29$__["default"].orientationButton} ${orientation === 'portrait' ? __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$screenshots$2f$editor$2f$editor$2e$module$2e$css__$5b$app$2d$ssr$5d$__$28$css__module$29$__["default"].active : ''}`,
                                                        onClick: ()=>setOrientation('portrait'),
                                                        children: "📱 Portrait"
                                                    }, void 0, false, {
                                                        fileName: "[project]/src/app/screenshots/editor/page.tsx",
                                                        lineNumber: 221,
                                                        columnNumber: 19
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                        className: `${__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$screenshots$2f$editor$2f$editor$2e$module$2e$css__$5b$app$2d$ssr$5d$__$28$css__module$29$__["default"].orientationButton} ${orientation === 'landscape' ? __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$screenshots$2f$editor$2f$editor$2e$module$2e$css__$5b$app$2d$ssr$5d$__$28$css__module$29$__["default"].active : ''}`,
                                                        onClick: ()=>setOrientation('landscape'),
                                                        children: "📐 Landscape"
                                                    }, void 0, false, {
                                                        fileName: "[project]/src/app/screenshots/editor/page.tsx",
                                                        lineNumber: 229,
                                                        columnNumber: 19
                                                    }, this)
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/src/app/screenshots/editor/page.tsx",
                                                lineNumber: 220,
                                                columnNumber: 17
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/src/app/screenshots/editor/page.tsx",
                                        lineNumber: 178,
                                        columnNumber: 15
                                    }, this),
                                    activeTab === 'captions' && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$screenshots$2f$editor$2f$editor$2e$module$2e$css__$5b$app$2d$ssr$5d$__$28$css__module$29$__["default"].section,
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$screenshots$2f$editor$2f$editor$2e$module$2e$css__$5b$app$2d$ssr$5d$__$28$css__module$29$__["default"].sectionHeader,
                                                children: [
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
                                                        children: "Caption Layers"
                                                    }, void 0, false, {
                                                        fileName: "[project]/src/app/screenshots/editor/page.tsx",
                                                        lineNumber: 245,
                                                        columnNumber: 19
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                        className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$screenshots$2f$editor$2f$editor$2e$module$2e$css__$5b$app$2d$ssr$5d$__$28$css__module$29$__["default"].addButton,
                                                        onClick: handleAddCaption,
                                                        children: "+ Add Caption"
                                                    }, void 0, false, {
                                                        fileName: "[project]/src/app/screenshots/editor/page.tsx",
                                                        lineNumber: 246,
                                                        columnNumber: 19
                                                    }, this)
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/src/app/screenshots/editor/page.tsx",
                                                lineNumber: 244,
                                                columnNumber: 17
                                            }, this),
                                            captions.length === 0 ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$screenshots$2f$editor$2f$editor$2e$module$2e$css__$5b$app$2d$ssr$5d$__$28$css__module$29$__["default"].emptyState,
                                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                    children: 'No captions yet. Click "Add Caption" to get started.'
                                                }, void 0, false, {
                                                    fileName: "[project]/src/app/screenshots/editor/page.tsx",
                                                    lineNumber: 253,
                                                    columnNumber: 21
                                                }, this)
                                            }, void 0, false, {
                                                fileName: "[project]/src/app/screenshots/editor/page.tsx",
                                                lineNumber: 252,
                                                columnNumber: 19
                                            }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$screenshots$2f$editor$2f$editor$2e$module$2e$css__$5b$app$2d$ssr$5d$__$28$css__module$29$__["default"].captionList,
                                                children: captions.map((layer)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                        className: `${__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$screenshots$2f$editor$2f$editor$2e$module$2e$css__$5b$app$2d$ssr$5d$__$28$css__module$29$__["default"].captionItem} ${selectedCaptionId === layer.id ? __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$screenshots$2f$editor$2f$editor$2e$module$2e$css__$5b$app$2d$ssr$5d$__$28$css__module$29$__["default"].selectedCaptionItem : ''}`,
                                                        onClick: ()=>setSelectedCaptionId(layer.id),
                                                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                            className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$screenshots$2f$editor$2f$editor$2e$module$2e$css__$5b$app$2d$ssr$5d$__$28$css__module$29$__["default"].captionItemHeader,
                                                            children: [
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                                                    type: "checkbox",
                                                                    checked: layer.visible,
                                                                    onChange: ()=>handleToggleCaptionVisibility(layer.id),
                                                                    onClick: (e)=>e.stopPropagation()
                                                                }, void 0, false, {
                                                                    fileName: "[project]/src/app/screenshots/editor/page.tsx",
                                                                    lineNumber: 266,
                                                                    columnNumber: 27
                                                                }, this),
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                                    className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$screenshots$2f$editor$2f$editor$2e$module$2e$css__$5b$app$2d$ssr$5d$__$28$css__module$29$__["default"].captionItemText,
                                                                    children: layer.caption.localizedText?.['en-US'] || 'Untitled Caption'
                                                                }, void 0, false, {
                                                                    fileName: "[project]/src/app/screenshots/editor/page.tsx",
                                                                    lineNumber: 272,
                                                                    columnNumber: 27
                                                                }, this),
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                                    className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$screenshots$2f$editor$2f$editor$2e$module$2e$css__$5b$app$2d$ssr$5d$__$28$css__module$29$__["default"].deleteButton,
                                                                    onClick: (e)=>{
                                                                        e.stopPropagation();
                                                                        handleDeleteCaption(layer.id);
                                                                    },
                                                                    children: "×"
                                                                }, void 0, false, {
                                                                    fileName: "[project]/src/app/screenshots/editor/page.tsx",
                                                                    lineNumber: 275,
                                                                    columnNumber: 27
                                                                }, this)
                                                            ]
                                                        }, void 0, true, {
                                                            fileName: "[project]/src/app/screenshots/editor/page.tsx",
                                                            lineNumber: 265,
                                                            columnNumber: 25
                                                        }, this)
                                                    }, layer.id, false, {
                                                        fileName: "[project]/src/app/screenshots/editor/page.tsx",
                                                        lineNumber: 258,
                                                        columnNumber: 23
                                                    }, this))
                                            }, void 0, false, {
                                                fileName: "[project]/src/app/screenshots/editor/page.tsx",
                                                lineNumber: 256,
                                                columnNumber: 19
                                            }, this),
                                            selectedCaption && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$screenshots$2f$editor$2f$editor$2e$module$2e$css__$5b$app$2d$ssr$5d$__$28$css__module$29$__["default"].captionEditor,
                                                children: [
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("h4", {
                                                        children: "Edit Caption"
                                                    }, void 0, false, {
                                                        fileName: "[project]/src/app/screenshots/editor/page.tsx",
                                                        lineNumber: 293,
                                                        columnNumber: 21
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                        className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$screenshots$2f$editor$2f$editor$2e$module$2e$css__$5b$app$2d$ssr$5d$__$28$css__module$29$__["default"].control,
                                                        children: [
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                                                children: "Text"
                                                            }, void 0, false, {
                                                                fileName: "[project]/src/app/screenshots/editor/page.tsx",
                                                                lineNumber: 296,
                                                                columnNumber: 23
                                                            }, this),
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("textarea", {
                                                                value: selectedCaption.caption.localizedText?.['en-US'] || '',
                                                                onChange: (e)=>handleUpdateCaption(selectedCaption.id, {
                                                                        localizedText: {
                                                                            ...selectedCaption.caption.localizedText,
                                                                            'en-US': e.target.value
                                                                        }
                                                                    }),
                                                                rows: 3,
                                                                className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$screenshots$2f$editor$2f$editor$2e$module$2e$css__$5b$app$2d$ssr$5d$__$28$css__module$29$__["default"].textarea
                                                            }, void 0, false, {
                                                                fileName: "[project]/src/app/screenshots/editor/page.tsx",
                                                                lineNumber: 297,
                                                                columnNumber: 23
                                                            }, this)
                                                        ]
                                                    }, void 0, true, {
                                                        fileName: "[project]/src/app/screenshots/editor/page.tsx",
                                                        lineNumber: 295,
                                                        columnNumber: 21
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                        className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$screenshots$2f$editor$2f$editor$2e$module$2e$css__$5b$app$2d$ssr$5d$__$28$css__module$29$__["default"].control,
                                                        children: [
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                                                children: "Position"
                                                            }, void 0, false, {
                                                                fileName: "[project]/src/app/screenshots/editor/page.tsx",
                                                                lineNumber: 313,
                                                                columnNumber: 23
                                                            }, this),
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("select", {
                                                                value: selectedCaption.caption.positioning.position,
                                                                onChange: (e)=>handleUpdateCaption(selectedCaption.id, {
                                                                        positioning: {
                                                                            ...selectedCaption.caption.positioning,
                                                                            position: e.target.value
                                                                        }
                                                                    }),
                                                                className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$screenshots$2f$editor$2f$editor$2e$module$2e$css__$5b$app$2d$ssr$5d$__$28$css__module$29$__["default"].select,
                                                                children: [
                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                                                        value: "top-left",
                                                                        children: "Top Left"
                                                                    }, void 0, false, {
                                                                        fileName: "[project]/src/app/screenshots/editor/page.tsx",
                                                                        lineNumber: 326,
                                                                        columnNumber: 25
                                                                    }, this),
                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                                                        value: "top-center",
                                                                        children: "Top Center"
                                                                    }, void 0, false, {
                                                                        fileName: "[project]/src/app/screenshots/editor/page.tsx",
                                                                        lineNumber: 327,
                                                                        columnNumber: 25
                                                                    }, this),
                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                                                        value: "top-right",
                                                                        children: "Top Right"
                                                                    }, void 0, false, {
                                                                        fileName: "[project]/src/app/screenshots/editor/page.tsx",
                                                                        lineNumber: 328,
                                                                        columnNumber: 25
                                                                    }, this),
                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                                                        value: "center-left",
                                                                        children: "Center Left"
                                                                    }, void 0, false, {
                                                                        fileName: "[project]/src/app/screenshots/editor/page.tsx",
                                                                        lineNumber: 329,
                                                                        columnNumber: 25
                                                                    }, this),
                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                                                        value: "center",
                                                                        children: "Center"
                                                                    }, void 0, false, {
                                                                        fileName: "[project]/src/app/screenshots/editor/page.tsx",
                                                                        lineNumber: 330,
                                                                        columnNumber: 25
                                                                    }, this),
                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                                                        value: "center-right",
                                                                        children: "Center Right"
                                                                    }, void 0, false, {
                                                                        fileName: "[project]/src/app/screenshots/editor/page.tsx",
                                                                        lineNumber: 331,
                                                                        columnNumber: 25
                                                                    }, this),
                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                                                        value: "bottom-left",
                                                                        children: "Bottom Left"
                                                                    }, void 0, false, {
                                                                        fileName: "[project]/src/app/screenshots/editor/page.tsx",
                                                                        lineNumber: 332,
                                                                        columnNumber: 25
                                                                    }, this),
                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                                                        value: "bottom-center",
                                                                        children: "Bottom Center"
                                                                    }, void 0, false, {
                                                                        fileName: "[project]/src/app/screenshots/editor/page.tsx",
                                                                        lineNumber: 333,
                                                                        columnNumber: 25
                                                                    }, this),
                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                                                        value: "bottom-right",
                                                                        children: "Bottom Right"
                                                                    }, void 0, false, {
                                                                        fileName: "[project]/src/app/screenshots/editor/page.tsx",
                                                                        lineNumber: 334,
                                                                        columnNumber: 25
                                                                    }, this)
                                                                ]
                                                            }, void 0, true, {
                                                                fileName: "[project]/src/app/screenshots/editor/page.tsx",
                                                                lineNumber: 314,
                                                                columnNumber: 23
                                                            }, this)
                                                        ]
                                                    }, void 0, true, {
                                                        fileName: "[project]/src/app/screenshots/editor/page.tsx",
                                                        lineNumber: 312,
                                                        columnNumber: 21
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                        className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$screenshots$2f$editor$2f$editor$2e$module$2e$css__$5b$app$2d$ssr$5d$__$28$css__module$29$__["default"].controlRow,
                                                        children: [
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$screenshots$2f$editor$2f$editor$2e$module$2e$css__$5b$app$2d$ssr$5d$__$28$css__module$29$__["default"].control,
                                                                children: [
                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                                                        children: "Font Size"
                                                                    }, void 0, false, {
                                                                        fileName: "[project]/src/app/screenshots/editor/page.tsx",
                                                                        lineNumber: 340,
                                                                        columnNumber: 25
                                                                    }, this),
                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                                                        type: "number",
                                                                        value: selectedCaption.caption.style?.fontSize || 48,
                                                                        onChange: (e)=>handleUpdateCaption(selectedCaption.id, {
                                                                                style: {
                                                                                    ...selectedCaption.caption.style,
                                                                                    fontSize: parseInt(e.target.value)
                                                                                }
                                                                            }),
                                                                        className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$screenshots$2f$editor$2f$editor$2e$module$2e$css__$5b$app$2d$ssr$5d$__$28$css__module$29$__["default"].input
                                                                    }, void 0, false, {
                                                                        fileName: "[project]/src/app/screenshots/editor/page.tsx",
                                                                        lineNumber: 341,
                                                                        columnNumber: 25
                                                                    }, this)
                                                                ]
                                                            }, void 0, true, {
                                                                fileName: "[project]/src/app/screenshots/editor/page.tsx",
                                                                lineNumber: 339,
                                                                columnNumber: 23
                                                            }, this),
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$screenshots$2f$editor$2f$editor$2e$module$2e$css__$5b$app$2d$ssr$5d$__$28$css__module$29$__["default"].control,
                                                                children: [
                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                                                        children: "Font Weight"
                                                                    }, void 0, false, {
                                                                        fileName: "[project]/src/app/screenshots/editor/page.tsx",
                                                                        lineNumber: 356,
                                                                        columnNumber: 25
                                                                    }, this),
                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("select", {
                                                                        value: selectedCaption.caption.style?.fontWeight || 700,
                                                                        onChange: (e)=>handleUpdateCaption(selectedCaption.id, {
                                                                                style: {
                                                                                    ...selectedCaption.caption.style,
                                                                                    fontWeight: parseInt(e.target.value)
                                                                                }
                                                                            }),
                                                                        className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$screenshots$2f$editor$2f$editor$2e$module$2e$css__$5b$app$2d$ssr$5d$__$28$css__module$29$__["default"].select,
                                                                        children: [
                                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                                                                value: "400",
                                                                                children: "Normal"
                                                                            }, void 0, false, {
                                                                                fileName: "[project]/src/app/screenshots/editor/page.tsx",
                                                                                lineNumber: 369,
                                                                                columnNumber: 27
                                                                            }, this),
                                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                                                                value: "600",
                                                                                children: "Semibold"
                                                                            }, void 0, false, {
                                                                                fileName: "[project]/src/app/screenshots/editor/page.tsx",
                                                                                lineNumber: 370,
                                                                                columnNumber: 27
                                                                            }, this),
                                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                                                                value: "700",
                                                                                children: "Bold"
                                                                            }, void 0, false, {
                                                                                fileName: "[project]/src/app/screenshots/editor/page.tsx",
                                                                                lineNumber: 371,
                                                                                columnNumber: 27
                                                                            }, this),
                                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                                                                value: "900",
                                                                                children: "Black"
                                                                            }, void 0, false, {
                                                                                fileName: "[project]/src/app/screenshots/editor/page.tsx",
                                                                                lineNumber: 372,
                                                                                columnNumber: 27
                                                                            }, this)
                                                                        ]
                                                                    }, void 0, true, {
                                                                        fileName: "[project]/src/app/screenshots/editor/page.tsx",
                                                                        lineNumber: 357,
                                                                        columnNumber: 25
                                                                    }, this)
                                                                ]
                                                            }, void 0, true, {
                                                                fileName: "[project]/src/app/screenshots/editor/page.tsx",
                                                                lineNumber: 355,
                                                                columnNumber: 23
                                                            }, this)
                                                        ]
                                                    }, void 0, true, {
                                                        fileName: "[project]/src/app/screenshots/editor/page.tsx",
                                                        lineNumber: 338,
                                                        columnNumber: 21
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                        className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$screenshots$2f$editor$2f$editor$2e$module$2e$css__$5b$app$2d$ssr$5d$__$28$css__module$29$__["default"].control,
                                                        children: [
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                                                children: "Color"
                                                            }, void 0, false, {
                                                                fileName: "[project]/src/app/screenshots/editor/page.tsx",
                                                                lineNumber: 378,
                                                                columnNumber: 23
                                                            }, this),
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                                                type: "color",
                                                                value: selectedCaption.caption.style?.color || '#ffffff',
                                                                onChange: (e)=>handleUpdateCaption(selectedCaption.id, {
                                                                        style: {
                                                                            ...selectedCaption.caption.style,
                                                                            color: e.target.value
                                                                        }
                                                                    }),
                                                                className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$screenshots$2f$editor$2f$editor$2e$module$2e$css__$5b$app$2d$ssr$5d$__$28$css__module$29$__["default"].colorInput
                                                            }, void 0, false, {
                                                                fileName: "[project]/src/app/screenshots/editor/page.tsx",
                                                                lineNumber: 379,
                                                                columnNumber: 23
                                                            }, this)
                                                        ]
                                                    }, void 0, true, {
                                                        fileName: "[project]/src/app/screenshots/editor/page.tsx",
                                                        lineNumber: 377,
                                                        columnNumber: 21
                                                    }, this)
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/src/app/screenshots/editor/page.tsx",
                                                lineNumber: 292,
                                                columnNumber: 19
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/src/app/screenshots/editor/page.tsx",
                                        lineNumber: 243,
                                        columnNumber: 15
                                    }, this),
                                    activeTab === 'export' && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$screenshots$2f$editor$2f$editor$2e$module$2e$css__$5b$app$2d$ssr$5d$__$28$css__module$29$__["default"].section,
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
                                                children: "Export Settings"
                                            }, void 0, false, {
                                                fileName: "[project]/src/app/screenshots/editor/page.tsx",
                                                lineNumber: 401,
                                                columnNumber: 17
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$screenshots$2f$editor$2f$editor$2e$module$2e$css__$5b$app$2d$ssr$5d$__$28$css__module$29$__["default"].control,
                                                children: [
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                                        children: "Format"
                                                    }, void 0, false, {
                                                        fileName: "[project]/src/app/screenshots/editor/page.tsx",
                                                        lineNumber: 404,
                                                        columnNumber: 19
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("select", {
                                                        className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$screenshots$2f$editor$2f$editor$2e$module$2e$css__$5b$app$2d$ssr$5d$__$28$css__module$29$__["default"].select,
                                                        children: [
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                                                value: "png",
                                                                children: "PNG"
                                                            }, void 0, false, {
                                                                fileName: "[project]/src/app/screenshots/editor/page.tsx",
                                                                lineNumber: 406,
                                                                columnNumber: 21
                                                            }, this),
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                                                value: "jpg",
                                                                children: "JPG"
                                                            }, void 0, false, {
                                                                fileName: "[project]/src/app/screenshots/editor/page.tsx",
                                                                lineNumber: 407,
                                                                columnNumber: 21
                                                            }, this)
                                                        ]
                                                    }, void 0, true, {
                                                        fileName: "[project]/src/app/screenshots/editor/page.tsx",
                                                        lineNumber: 405,
                                                        columnNumber: 19
                                                    }, this)
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/src/app/screenshots/editor/page.tsx",
                                                lineNumber: 403,
                                                columnNumber: 17
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$screenshots$2f$editor$2f$editor$2e$module$2e$css__$5b$app$2d$ssr$5d$__$28$css__module$29$__["default"].control,
                                                children: [
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                                        children: "Quality"
                                                    }, void 0, false, {
                                                        fileName: "[project]/src/app/screenshots/editor/page.tsx",
                                                        lineNumber: 412,
                                                        columnNumber: 19
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                                        type: "range",
                                                        min: "1",
                                                        max: "100",
                                                        defaultValue: "100",
                                                        className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$screenshots$2f$editor$2f$editor$2e$module$2e$css__$5b$app$2d$ssr$5d$__$28$css__module$29$__["default"].slider
                                                    }, void 0, false, {
                                                        fileName: "[project]/src/app/screenshots/editor/page.tsx",
                                                        lineNumber: 413,
                                                        columnNumber: 19
                                                    }, this)
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/src/app/screenshots/editor/page.tsx",
                                                lineNumber: 411,
                                                columnNumber: 17
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$screenshots$2f$editor$2f$editor$2e$module$2e$css__$5b$app$2d$ssr$5d$__$28$css__module$29$__["default"].control,
                                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                                    children: [
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                                            type: "checkbox",
                                                            defaultChecked: true
                                                        }, void 0, false, {
                                                            fileName: "[project]/src/app/screenshots/editor/page.tsx",
                                                            lineNumber: 424,
                                                            columnNumber: 21
                                                        }, this),
                                                        "Include device frame"
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "[project]/src/app/screenshots/editor/page.tsx",
                                                    lineNumber: 423,
                                                    columnNumber: 19
                                                }, this)
                                            }, void 0, false, {
                                                fileName: "[project]/src/app/screenshots/editor/page.tsx",
                                                lineNumber: 422,
                                                columnNumber: 17
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$screenshots$2f$editor$2f$editor$2e$module$2e$css__$5b$app$2d$ssr$5d$__$28$css__module$29$__["default"].control,
                                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                                    children: [
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                                            type: "checkbox",
                                                            defaultChecked: true
                                                        }, void 0, false, {
                                                            fileName: "[project]/src/app/screenshots/editor/page.tsx",
                                                            lineNumber: 431,
                                                            columnNumber: 21
                                                        }, this),
                                                        "Include captions"
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "[project]/src/app/screenshots/editor/page.tsx",
                                                    lineNumber: 430,
                                                    columnNumber: 19
                                                }, this)
                                            }, void 0, false, {
                                                fileName: "[project]/src/app/screenshots/editor/page.tsx",
                                                lineNumber: 429,
                                                columnNumber: 17
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$screenshots$2f$editor$2f$editor$2e$module$2e$css__$5b$app$2d$ssr$5d$__$28$css__module$29$__["default"].primaryButton,
                                                onClick: handleExport,
                                                children: "Export Screenshot"
                                            }, void 0, false, {
                                                fileName: "[project]/src/app/screenshots/editor/page.tsx",
                                                lineNumber: 436,
                                                columnNumber: 17
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/src/app/screenshots/editor/page.tsx",
                                        lineNumber: 400,
                                        columnNumber: 15
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/app/screenshots/editor/page.tsx",
                                lineNumber: 175,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/app/screenshots/editor/page.tsx",
                        lineNumber: 151,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("main", {
                        className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$screenshots$2f$editor$2f$editor$2e$module$2e$css__$5b$app$2d$ssr$5d$__$28$css__module$29$__["default"].preview,
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$screenshots$2f$editor$2f$editor$2e$module$2e$css__$5b$app$2d$ssr$5d$__$28$css__module$29$__["default"].previewHeader,
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
                                        children: "Preview"
                                    }, void 0, false, {
                                        fileName: "[project]/src/app/screenshots/editor/page.tsx",
                                        lineNumber: 447,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$screenshots$2f$editor$2f$editor$2e$module$2e$css__$5b$app$2d$ssr$5d$__$28$css__module$29$__["default"].zoomControls,
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$screenshots$2f$editor$2f$editor$2e$module$2e$css__$5b$app$2d$ssr$5d$__$28$css__module$29$__["default"].zoomButton,
                                                onClick: ()=>setZoom((z)=>Math.max(0.1, z - 0.1)),
                                                children: "−"
                                            }, void 0, false, {
                                                fileName: "[project]/src/app/screenshots/editor/page.tsx",
                                                lineNumber: 449,
                                                columnNumber: 15
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$screenshots$2f$editor$2f$editor$2e$module$2e$css__$5b$app$2d$ssr$5d$__$28$css__module$29$__["default"].zoomValue,
                                                children: [
                                                    Math.round(zoom * 100),
                                                    "%"
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/src/app/screenshots/editor/page.tsx",
                                                lineNumber: 455,
                                                columnNumber: 15
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$screenshots$2f$editor$2f$editor$2e$module$2e$css__$5b$app$2d$ssr$5d$__$28$css__module$29$__["default"].zoomButton,
                                                onClick: ()=>setZoom((z)=>Math.min(3, z + 0.1)),
                                                children: "+"
                                            }, void 0, false, {
                                                fileName: "[project]/src/app/screenshots/editor/page.tsx",
                                                lineNumber: 456,
                                                columnNumber: 15
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$screenshots$2f$editor$2f$editor$2e$module$2e$css__$5b$app$2d$ssr$5d$__$28$css__module$29$__["default"].zoomButton,
                                                onClick: ()=>setZoom(1),
                                                children: "Reset"
                                            }, void 0, false, {
                                                fileName: "[project]/src/app/screenshots/editor/page.tsx",
                                                lineNumber: 462,
                                                columnNumber: 15
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/src/app/screenshots/editor/page.tsx",
                                        lineNumber: 448,
                                        columnNumber: 13
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/app/screenshots/editor/page.tsx",
                                lineNumber: 446,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$screenshots$2f$editor$2f$editor$2e$module$2e$css__$5b$app$2d$ssr$5d$__$28$css__module$29$__["default"].previewCanvas,
                                id: "screenshot-preview",
                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$screenshots$2f$editor$2f$editor$2e$module$2e$css__$5b$app$2d$ssr$5d$__$28$css__module$29$__["default"].previewContent,
                                    style: {
                                        transform: `scale(${zoom})`,
                                        transformOrigin: 'center center'
                                    },
                                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        style: {
                                            position: 'relative',
                                            display: 'inline-block'
                                        },
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$DeviceFrame$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$locals$3e$__["DeviceFrame"], {
                                                device: selectedDevice,
                                                orientation: orientation,
                                                content: screenshot || 'https://via.placeholder.com/1260x2736/667eea/ffffff?text=Upload+Screenshot',
                                                frameStyle: {
                                                    shadow: true,
                                                    shadowBlur: 40,
                                                    shadowColor: 'rgba(0, 0, 0, 0.3)'
                                                }
                                            }, void 0, false, {
                                                fileName: "[project]/src/app/screenshots/editor/page.tsx",
                                                lineNumber: 477,
                                                columnNumber: 17
                                            }, this),
                                            captions.filter((layer)=>layer.visible).map((layer)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$CaptionOverlay$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$locals$3e$__["CaptionOverlay"], {
                                                    caption: layer.caption,
                                                    locale: "en-US"
                                                }, layer.id, false, {
                                                    fileName: "[project]/src/app/screenshots/editor/page.tsx",
                                                    lineNumber: 495,
                                                    columnNumber: 21
                                                }, this))
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/src/app/screenshots/editor/page.tsx",
                                        lineNumber: 476,
                                        columnNumber: 15
                                    }, this)
                                }, void 0, false, {
                                    fileName: "[project]/src/app/screenshots/editor/page.tsx",
                                    lineNumber: 469,
                                    columnNumber: 13
                                }, this)
                            }, void 0, false, {
                                fileName: "[project]/src/app/screenshots/editor/page.tsx",
                                lineNumber: 468,
                                columnNumber: 11
                            }, this),
                            !screenshot && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$screenshots$2f$editor$2f$editor$2e$module$2e$css__$5b$app$2d$ssr$5d$__$28$css__module$29$__["default"].previewPlaceholder,
                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$screenshots$2f$editor$2f$editor$2e$module$2e$css__$5b$app$2d$ssr$5d$__$28$css__module$29$__["default"].placeholderContent,
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                            className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$screenshots$2f$editor$2f$editor$2e$module$2e$css__$5b$app$2d$ssr$5d$__$28$css__module$29$__["default"].placeholderIcon,
                                            children: "📱"
                                        }, void 0, false, {
                                            fileName: "[project]/src/app/screenshots/editor/page.tsx",
                                            lineNumber: 504,
                                            columnNumber: 17
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
                                            children: "No Screenshot Uploaded"
                                        }, void 0, false, {
                                            fileName: "[project]/src/app/screenshots/editor/page.tsx",
                                            lineNumber: 505,
                                            columnNumber: 17
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                            children: "Upload a screenshot to get started"
                                        }, void 0, false, {
                                            fileName: "[project]/src/app/screenshots/editor/page.tsx",
                                            lineNumber: 506,
                                            columnNumber: 17
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                            className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$screenshots$2f$editor$2f$editor$2e$module$2e$css__$5b$app$2d$ssr$5d$__$28$css__module$29$__["default"].uploadButtonLarge,
                                            onClick: ()=>fileInputRef.current?.click(),
                                            children: "Upload Screenshot"
                                        }, void 0, false, {
                                            fileName: "[project]/src/app/screenshots/editor/page.tsx",
                                            lineNumber: 507,
                                            columnNumber: 17
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/src/app/screenshots/editor/page.tsx",
                                    lineNumber: 503,
                                    columnNumber: 15
                                }, this)
                            }, void 0, false, {
                                fileName: "[project]/src/app/screenshots/editor/page.tsx",
                                lineNumber: 502,
                                columnNumber: 13
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/app/screenshots/editor/page.tsx",
                        lineNumber: 445,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("aside", {
                        className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$screenshots$2f$editor$2f$editor$2e$module$2e$css__$5b$app$2d$ssr$5d$__$28$css__module$29$__["default"].rightSidebar,
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
                                children: "Layers"
                            }, void 0, false, {
                                fileName: "[project]/src/app/screenshots/editor/page.tsx",
                                lineNumber: 520,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$screenshots$2f$editor$2f$editor$2e$module$2e$css__$5b$app$2d$ssr$5d$__$28$css__module$29$__["default"].layersList,
                                children: [
                                    screenshot && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$screenshots$2f$editor$2f$editor$2e$module$2e$css__$5b$app$2d$ssr$5d$__$28$css__module$29$__["default"].layerItem,
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$screenshots$2f$editor$2f$editor$2e$module$2e$css__$5b$app$2d$ssr$5d$__$28$css__module$29$__["default"].layerIcon,
                                                children: "🖼️"
                                            }, void 0, false, {
                                                fileName: "[project]/src/app/screenshots/editor/page.tsx",
                                                lineNumber: 524,
                                                columnNumber: 17
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$screenshots$2f$editor$2f$editor$2e$module$2e$css__$5b$app$2d$ssr$5d$__$28$css__module$29$__["default"].layerName,
                                                children: "Screenshot"
                                            }, void 0, false, {
                                                fileName: "[project]/src/app/screenshots/editor/page.tsx",
                                                lineNumber: 525,
                                                columnNumber: 17
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/src/app/screenshots/editor/page.tsx",
                                        lineNumber: 523,
                                        columnNumber: 15
                                    }, this),
                                    captions.map((layer)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            className: `${__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$screenshots$2f$editor$2f$editor$2e$module$2e$css__$5b$app$2d$ssr$5d$__$28$css__module$29$__["default"].layerItem} ${selectedCaptionId === layer.id ? __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$screenshots$2f$editor$2f$editor$2e$module$2e$css__$5b$app$2d$ssr$5d$__$28$css__module$29$__["default"].selectedLayer : ''}`,
                                            onClick: ()=>setSelectedCaptionId(layer.id),
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                    className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$screenshots$2f$editor$2f$editor$2e$module$2e$css__$5b$app$2d$ssr$5d$__$28$css__module$29$__["default"].layerIcon,
                                                    children: "💬"
                                                }, void 0, false, {
                                                    fileName: "[project]/src/app/screenshots/editor/page.tsx",
                                                    lineNumber: 536,
                                                    columnNumber: 17
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                    className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$screenshots$2f$editor$2f$editor$2e$module$2e$css__$5b$app$2d$ssr$5d$__$28$css__module$29$__["default"].layerName,
                                                    children: layer.caption.localizedText?.['en-US'] || 'Untitled'
                                                }, void 0, false, {
                                                    fileName: "[project]/src/app/screenshots/editor/page.tsx",
                                                    lineNumber: 537,
                                                    columnNumber: 17
                                                }, this),
                                                !layer.visible && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                    className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$screenshots$2f$editor$2f$editor$2e$module$2e$css__$5b$app$2d$ssr$5d$__$28$css__module$29$__["default"].hiddenBadge,
                                                    children: "Hidden"
                                                }, void 0, false, {
                                                    fileName: "[project]/src/app/screenshots/editor/page.tsx",
                                                    lineNumber: 540,
                                                    columnNumber: 36
                                                }, this)
                                            ]
                                        }, layer.id, true, {
                                            fileName: "[project]/src/app/screenshots/editor/page.tsx",
                                            lineNumber: 529,
                                            columnNumber: 15
                                        }, this))
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/app/screenshots/editor/page.tsx",
                                lineNumber: 521,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/app/screenshots/editor/page.tsx",
                        lineNumber: 519,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/src/app/screenshots/editor/page.tsx",
                lineNumber: 149,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/src/app/screenshots/editor/page.tsx",
        lineNumber: 135,
        columnNumber: 5
    }, this);
}
}),
];

//# sourceMappingURL=%5Broot-of-the-server%5D__be8e3a1c._.js.map