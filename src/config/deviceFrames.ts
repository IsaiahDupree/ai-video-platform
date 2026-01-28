/**
 * Device Frame Presets
 *
 * Pre-configured device frame specifications based on App Store Connect
 * screenshot requirements (January 2026).
 */

import { DeviceFramePresets, DeviceFrameConfig } from '../types/deviceFrame';

/**
 * iPhone Frame Presets
 */
export const iPhonePresets: Partial<DeviceFramePresets> = {
  // 6.9" Display
  'iphone-17-pro-max': {
    type: 'iphone',
    model: 'iphone-17-pro-max',
    displayName: 'iPhone 17 Pro Max',
    displaySize: '6.9"',
    portrait: { width: 1260, height: 2736 },
    landscape: { width: 2736, height: 1260 },
    borderRadius: 0.055,
    dynamicIsland: { width: 126, height: 37 },
    colors: ['#1d1d1f', '#f5f5f7', '#4c4c4c', '#fae7d4'],
    defaultColor: '#1d1d1f',
  },
  'iphone-16-pro-max': {
    type: 'iphone',
    model: 'iphone-16-pro-max',
    displayName: 'iPhone 16 Pro Max',
    displaySize: '6.9"',
    portrait: { width: 1260, height: 2736 },
    landscape: { width: 2736, height: 1260 },
    borderRadius: 0.055,
    dynamicIsland: { width: 126, height: 37 },
    colors: ['#1d1d1f', '#f5f5f7', '#4c4c4c', '#fae7d4'],
    defaultColor: '#1d1d1f',
  },
  'iphone-16-plus': {
    type: 'iphone',
    model: 'iphone-16-plus',
    displayName: 'iPhone 16 Plus',
    displaySize: '6.9"',
    portrait: { width: 1260, height: 2736 },
    landscape: { width: 2736, height: 1260 },
    borderRadius: 0.055,
    notch: { width: 210, height: 30 },
    colors: ['#1d1d1f', '#f5f5f7', '#4c4c4c', '#fae7d4'],
    defaultColor: '#1d1d1f',
  },

  // 6.5" Display
  'iphone-14-plus': {
    type: 'iphone',
    model: 'iphone-14-plus',
    displayName: 'iPhone 14 Plus',
    displaySize: '6.5"',
    portrait: { width: 1284, height: 2778 },
    landscape: { width: 2778, height: 1284 },
    borderRadius: 0.055,
    notch: { width: 210, height: 30 },
    colors: ['#1d1d1f', '#f5f5f7', '#4c4c4c', '#fae7d4'],
    defaultColor: '#1d1d1f',
  },
  'iphone-13-pro-max': {
    type: 'iphone',
    model: 'iphone-13-pro-max',
    displayName: 'iPhone 13 Pro Max',
    displaySize: '6.5"',
    portrait: { width: 1284, height: 2778 },
    landscape: { width: 2778, height: 1284 },
    borderRadius: 0.055,
    notch: { width: 210, height: 30 },
    colors: ['#1d1d1f', '#f5f5f7', '#4c4c4c', '#fae7d4'],
    defaultColor: '#1d1d1f',
  },

  // 6.1" Display
  'iphone-16': {
    type: 'iphone',
    model: 'iphone-16',
    displayName: 'iPhone 16',
    displaySize: '6.1"',
    portrait: { width: 1170, height: 2532 },
    landscape: { width: 2532, height: 1170 },
    borderRadius: 0.055,
    notch: { width: 210, height: 30 },
    colors: ['#1d1d1f', '#f5f5f7', '#4c4c4c', '#fae7d4'],
    defaultColor: '#1d1d1f',
  },
  'iphone-15': {
    type: 'iphone',
    model: 'iphone-15',
    displayName: 'iPhone 15',
    displaySize: '6.1"',
    portrait: { width: 1170, height: 2532 },
    landscape: { width: 2532, height: 1170 },
    borderRadius: 0.055,
    notch: { width: 210, height: 30 },
    colors: ['#1d1d1f', '#f5f5f7', '#4c4c4c', '#fae7d4'],
    defaultColor: '#1d1d1f',
  },
  'iphone-14': {
    type: 'iphone',
    model: 'iphone-14',
    displayName: 'iPhone 14',
    displaySize: '6.1"',
    portrait: { width: 1170, height: 2532 },
    landscape: { width: 2532, height: 1170 },
    borderRadius: 0.055,
    notch: { width: 210, height: 30 },
    colors: ['#1d1d1f', '#f5f5f7', '#4c4c4c', '#fae7d4'],
    defaultColor: '#1d1d1f',
  },

  // 5.5" Display
  'iphone-8-plus': {
    type: 'iphone',
    model: 'iphone-8-plus',
    displayName: 'iPhone 8 Plus',
    displaySize: '5.5"',
    portrait: { width: 1242, height: 2208 },
    landscape: { width: 2208, height: 1242 },
    borderRadius: 0.025,
    colors: ['#1d1d1f', '#f5f5f7', '#d4af37'],
    defaultColor: '#1d1d1f',
  },

  // 4.7" Display
  'iphone-se-3': {
    type: 'iphone',
    model: 'iphone-se-3',
    displayName: 'iPhone SE (3rd gen)',
    displaySize: '4.7"',
    portrait: { width: 750, height: 1334 },
    landscape: { width: 1334, height: 750 },
    borderRadius: 0.025,
    colors: ['#1d1d1f', '#f5f5f7', '#ff3b30'],
    defaultColor: '#1d1d1f',
  },
  'iphone-8': {
    type: 'iphone',
    model: 'iphone-8',
    displayName: 'iPhone 8',
    displaySize: '4.7"',
    portrait: { width: 750, height: 1334 },
    landscape: { width: 1334, height: 750 },
    borderRadius: 0.025,
    colors: ['#1d1d1f', '#f5f5f7', '#d4af37'],
    defaultColor: '#1d1d1f',
  },
};

/**
 * iPad Frame Presets
 */
export const iPadPresets: Partial<DeviceFramePresets> = {
  // 13" Display
  'ipad-pro-13-m5': {
    type: 'ipad',
    model: 'ipad-pro-13-m5',
    displayName: 'iPad Pro 13" (M5)',
    displaySize: '13"',
    portrait: { width: 2064, height: 2752 },
    landscape: { width: 2752, height: 2064 },
    borderRadius: 0.03,
    colors: ['#1d1d1f', '#f5f5f7'],
    defaultColor: '#f5f5f7',
  },
  'ipad-pro-13-m4': {
    type: 'ipad',
    model: 'ipad-pro-13-m4',
    displayName: 'iPad Pro 13" (M4)',
    displaySize: '13"',
    portrait: { width: 2064, height: 2752 },
    landscape: { width: 2752, height: 2064 },
    borderRadius: 0.03,
    colors: ['#1d1d1f', '#f5f5f7'],
    defaultColor: '#f5f5f7',
  },

  // 12.9" Display
  'ipad-pro-12-9': {
    type: 'ipad',
    model: 'ipad-pro-12-9',
    displayName: 'iPad Pro 12.9"',
    displaySize: '12.9"',
    portrait: { width: 2048, height: 2732 },
    landscape: { width: 2732, height: 2048 },
    borderRadius: 0.03,
    colors: ['#1d1d1f', '#f5f5f7'],
    defaultColor: '#f5f5f7',
  },

  // 11" Display
  'ipad-pro-11-m5': {
    type: 'ipad',
    model: 'ipad-pro-11-m5',
    displayName: 'iPad Pro 11" (M5)',
    displaySize: '11"',
    portrait: { width: 1668, height: 2388 },
    landscape: { width: 2388, height: 1668 },
    borderRadius: 0.03,
    colors: ['#1d1d1f', '#f5f5f7'],
    defaultColor: '#f5f5f7',
  },
  'ipad-air-11-m3': {
    type: 'ipad',
    model: 'ipad-air-11-m3',
    displayName: 'iPad Air 11" (M3)',
    displaySize: '11"',
    portrait: { width: 1668, height: 2388 },
    landscape: { width: 2388, height: 1668 },
    borderRadius: 0.03,
    colors: ['#1d1d1f', '#f5f5f7', '#4c6ef5', '#fa5252'],
    defaultColor: '#f5f5f7',
  },
  'ipad-11': {
    type: 'ipad',
    model: 'ipad-11',
    displayName: 'iPad (11th gen)',
    displaySize: '11"',
    portrait: { width: 1640, height: 2360 },
    landscape: { width: 2360, height: 1640 },
    borderRadius: 0.03,
    colors: ['#1d1d1f', '#f5f5f7', '#4c6ef5', '#fa5252'],
    defaultColor: '#f5f5f7',
  },

  // 10.5" Display
  'ipad-pro-10-5': {
    type: 'ipad',
    model: 'ipad-pro-10-5',
    displayName: 'iPad Pro 10.5"',
    displaySize: '10.5"',
    portrait: { width: 1668, height: 2224 },
    landscape: { width: 2224, height: 1668 },
    borderRadius: 0.025,
    colors: ['#1d1d1f', '#f5f5f7', '#d4af37'],
    defaultColor: '#f5f5f7',
  },
};

/**
 * Mac Frame Presets
 * Note: Mac screenshots are always landscape (16:10 aspect ratio)
 * The portrait field uses the same dimensions for consistency
 */
export const macPresets: Partial<DeviceFramePresets> = {
  'macbook-air-13': {
    type: 'mac',
    model: 'macbook-air-13',
    displayName: 'MacBook Air 13"',
    displaySize: '13.6"',
    portrait: { width: 2560, height: 1600 },
    landscape: { width: 2560, height: 1600 },
    borderRadius: 0.02,
    colors: ['#1d1d1f', '#f5f5f7', '#e8e3d5', '#1e3a5f'],
    defaultColor: '#f5f5f7',
  },
  'macbook-air-15': {
    type: 'mac',
    model: 'macbook-air-15',
    displayName: 'MacBook Air 15"',
    displaySize: '15.3"',
    portrait: { width: 2880, height: 1800 },
    landscape: { width: 2880, height: 1800 },
    borderRadius: 0.02,
    colors: ['#1d1d1f', '#f5f5f7', '#e8e3d5', '#1e3a5f'],
    defaultColor: '#f5f5f7',
  },
  'macbook-pro-14': {
    type: 'mac',
    model: 'macbook-pro-14',
    displayName: 'MacBook Pro 14"',
    displaySize: '14.2"',
    portrait: { width: 3024, height: 1964 },
    landscape: { width: 3024, height: 1964 },
    borderRadius: 0.02,
    notch: { width: 200, height: 32 },
    colors: ['#1d1d1f', '#f5f5f7'],
    defaultColor: '#1d1d1f',
  },
  'macbook-pro-16': {
    type: 'mac',
    model: 'macbook-pro-16',
    displayName: 'MacBook Pro 16"',
    displaySize: '16.2"',
    portrait: { width: 3456, height: 2234 },
    landscape: { width: 3456, height: 2234 },
    borderRadius: 0.02,
    notch: { width: 200, height: 32 },
    colors: ['#1d1d1f', '#f5f5f7'],
    defaultColor: '#1d1d1f',
  },
  'imac-24': {
    type: 'mac',
    model: 'imac-24',
    displayName: 'iMac 24"',
    displaySize: '24"',
    portrait: { width: 4480, height: 2520 },
    landscape: { width: 4480, height: 2520 },
    borderRadius: 0.015,
    colors: ['#4c6ef5', '#fa5252', '#fcc419', '#51cf66', '#f783ac', '#868e96', '#f5f5f7'],
    defaultColor: '#4c6ef5',
  },
};

/**
 * Apple Watch Frame Presets
 */
export const watchPresets: Partial<DeviceFramePresets> = {
  'watch-ultra-3': {
    type: 'watch',
    model: 'watch-ultra-3',
    displayName: 'Apple Watch Ultra 3',
    displaySize: '49mm',
    portrait: { width: 422, height: 514 },
    landscape: { width: 514, height: 422 },
    borderRadius: 0.1,
    colors: ['#1d1d1f', '#f5f5f7'],
    defaultColor: '#1d1d1f',
  },
  'watch-ultra-2': {
    type: 'watch',
    model: 'watch-ultra-2',
    displayName: 'Apple Watch Ultra 2',
    displaySize: '49mm',
    portrait: { width: 410, height: 502 },
    landscape: { width: 502, height: 410 },
    borderRadius: 0.1,
    colors: ['#1d1d1f', '#f5f5f7'],
    defaultColor: '#1d1d1f',
  },
  'watch-series-11': {
    type: 'watch',
    model: 'watch-series-11',
    displayName: 'Apple Watch Series 11',
    displaySize: '46mm',
    portrait: { width: 416, height: 496 },
    landscape: { width: 496, height: 416 },
    borderRadius: 0.15,
    colors: ['#1d1d1f', '#f5f5f7', '#fa5252', '#4c6ef5'],
    defaultColor: '#1d1d1f',
  },
  'watch-series-10': {
    type: 'watch',
    model: 'watch-series-10',
    displayName: 'Apple Watch Series 10',
    displaySize: '46mm',
    portrait: { width: 416, height: 496 },
    landscape: { width: 496, height: 416 },
    borderRadius: 0.15,
    colors: ['#1d1d1f', '#f5f5f7', '#fa5252', '#4c6ef5'],
    defaultColor: '#1d1d1f',
  },
  'watch-series-9': {
    type: 'watch',
    model: 'watch-series-9',
    displayName: 'Apple Watch Series 9',
    displaySize: '45mm',
    portrait: { width: 396, height: 484 },
    landscape: { width: 484, height: 396 },
    borderRadius: 0.15,
    colors: ['#1d1d1f', '#f5f5f7', '#fa5252', '#4c6ef5'],
    defaultColor: '#1d1d1f',
  },
  'watch-se': {
    type: 'watch',
    model: 'watch-se',
    displayName: 'Apple Watch SE',
    displaySize: '44mm',
    portrait: { width: 368, height: 448 },
    landscape: { width: 448, height: 368 },
    borderRadius: 0.15,
    colors: ['#1d1d1f', '#f5f5f7', '#fa5252'],
    defaultColor: '#1d1d1f',
  },
  'watch-series-3': {
    type: 'watch',
    model: 'watch-series-3',
    displayName: 'Apple Watch Series 3',
    displaySize: '42mm',
    portrait: { width: 312, height: 390 },
    landscape: { width: 390, height: 312 },
    borderRadius: 0.12,
    colors: ['#1d1d1f', '#f5f5f7'],
    defaultColor: '#1d1d1f',
  },
};

/**
 * Apple TV Frame Presets
 */
export const tvPresets: Partial<DeviceFramePresets> = {
  'apple-tv-4k': {
    type: 'tv',
    model: 'apple-tv-4k',
    displayName: 'Apple TV 4K',
    displaySize: 'Variable',
    portrait: { width: 2160, height: 3840 },
    landscape: { width: 3840, height: 2160 },
    borderRadius: 0.005,
    colors: ['#1d1d1f'],
    defaultColor: '#1d1d1f',
  },
  'apple-tv-hd': {
    type: 'tv',
    model: 'apple-tv-hd',
    displayName: 'Apple TV HD',
    displaySize: 'Variable',
    portrait: { width: 1080, height: 1920 },
    landscape: { width: 1920, height: 1080 },
    borderRadius: 0.005,
    colors: ['#1d1d1f'],
    defaultColor: '#1d1d1f',
  },
};

/**
 * Apple Vision Pro Frame Presets
 */
export const visionPresets: Partial<DeviceFramePresets> = {
  'vision-pro': {
    type: 'vision',
    model: 'vision-pro',
    displayName: 'Apple Vision Pro',
    displaySize: 'Immersive',
    portrait: { width: 2160, height: 3840 },
    landscape: { width: 3840, height: 2160 },
    borderRadius: 0.02,
    colors: ['#1d1d1f', '#f5f5f7'],
    defaultColor: '#f5f5f7',
  },
};

/**
 * All device frame presets combined
 */
export const deviceFramePresets: Partial<DeviceFramePresets> = {
  ...iPhonePresets,
  ...iPadPresets,
  ...macPresets,
  ...watchPresets,
  ...tvPresets,
  ...visionPresets,
};

/**
 * Get device frame configuration by model name
 */
export function getDeviceFrame(model: string): DeviceFrameConfig | undefined {
  return deviceFramePresets[model as keyof typeof deviceFramePresets];
}

/**
 * Get all devices of a specific type
 */
export function getDevicesByType(type: string): DeviceFrameConfig[] {
  return Object.values(deviceFramePresets).filter(
    (device) => device?.type === type
  ) as DeviceFrameConfig[];
}

/**
 * Get recommended screenshot sizes for a device
 */
export function getRecommendedSizes(
  model: string,
  orientation: 'portrait' | 'landscape' = 'portrait'
): { width: number; height: number } | undefined {
  const device = getDeviceFrame(model);
  if (!device) return undefined;
  return orientation === 'portrait' ? device.portrait : device.landscape;
}
