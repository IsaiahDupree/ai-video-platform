/**
 * Screenshot Size Presets Configuration
 * APP-003: Screenshot Size Generator
 *
 * All screenshot dimensions are based on App Store Connect requirements
 * as of January 2026.
 *
 * Reference: https://developer.apple.com/help/app-store-connect/reference/screenshot-specifications
 */

import { ScreenshotSize, ScreenshotSizePresets, GetSizesOptions } from '@/types/screenshotResize';
import { DeviceType, DeviceModel, Orientation } from '@/types/deviceFrame';

/**
 * iPhone screenshot sizes
 */
export const iPhoneSizes: ScreenshotSize[] = [
  // iPhone 17 Pro Max / 16 Pro Max (6.9-inch)
  {
    id: 'iphone-17-pro-max-portrait',
    deviceType: 'iphone',
    model: 'iphone-17-pro-max',
    width: 1260,
    height: 2736,
    orientation: 'portrait',
    displaySize: '6.9"',
    name: 'iPhone 17 Pro Max (Portrait)',
  },
  {
    id: 'iphone-17-pro-max-landscape',
    deviceType: 'iphone',
    model: 'iphone-17-pro-max',
    width: 2736,
    height: 1260,
    orientation: 'landscape',
    displaySize: '6.9"',
    name: 'iPhone 17 Pro Max (Landscape)',
  },

  // iPhone 16 / 15 Pro / 15 / 14 Pro (6.1-inch)
  {
    id: 'iphone-16-portrait',
    deviceType: 'iphone',
    model: 'iphone-16',
    width: 1170,
    height: 2532,
    orientation: 'portrait',
    displaySize: '6.1"',
    name: 'iPhone 16 (Portrait)',
  },
  {
    id: 'iphone-16-landscape',
    deviceType: 'iphone',
    model: 'iphone-16',
    width: 2532,
    height: 1170,
    orientation: 'landscape',
    displaySize: '6.1"',
    name: 'iPhone 16 (Landscape)',
  },

  // iPhone 14 Plus / 13 Pro Max / 12 Pro Max (6.5-inch)
  {
    id: 'iphone-14-plus-portrait',
    deviceType: 'iphone',
    model: 'iphone-14-plus',
    width: 1284,
    height: 2778,
    orientation: 'portrait',
    displaySize: '6.5"',
    name: 'iPhone 14 Plus (Portrait)',
  },
  {
    id: 'iphone-14-plus-landscape',
    deviceType: 'iphone',
    model: 'iphone-14-plus',
    width: 2778,
    height: 1284,
    orientation: 'landscape',
    displaySize: '6.5"',
    name: 'iPhone 14 Plus (Landscape)',
  },

  // iPhone 8 Plus (5.5-inch)
  {
    id: 'iphone-8-plus-portrait',
    deviceType: 'iphone',
    model: 'iphone-8-plus',
    width: 1242,
    height: 2208,
    orientation: 'portrait',
    displaySize: '5.5"',
    name: 'iPhone 8 Plus (Portrait)',
  },
  {
    id: 'iphone-8-plus-landscape',
    deviceType: 'iphone',
    model: 'iphone-8-plus',
    width: 2208,
    height: 1242,
    orientation: 'landscape',
    displaySize: '5.5"',
    name: 'iPhone 8 Plus (Landscape)',
  },

  // iPhone SE (4.7-inch)
  {
    id: 'iphone-se-portrait',
    deviceType: 'iphone',
    model: 'iphone-se-3',
    width: 750,
    height: 1334,
    orientation: 'portrait',
    displaySize: '4.7"',
    name: 'iPhone SE (Portrait)',
  },
  {
    id: 'iphone-se-landscape',
    deviceType: 'iphone',
    model: 'iphone-se-3rd',
    width: 1334,
    height: 750,
    orientation: 'landscape',
    displaySize: '4.7"',
    name: 'iPhone SE (Landscape)',
  },
];

/**
 * iPad screenshot sizes
 */
export const iPadSizes: ScreenshotSize[] = [
  // iPad Pro 13" (M5) (13-inch)
  {
    id: 'ipad-pro-13-m5-portrait',
    deviceType: 'ipad',
    model: 'ipad-pro-13-m5',
    width: 2064,
    height: 2752,
    orientation: 'portrait',
    displaySize: '13"',
    name: 'iPad Pro 13" M5 (Portrait)',
  },
  {
    id: 'ipad-pro-13-m5-landscape',
    deviceType: 'ipad',
    model: 'ipad-pro-13-m5',
    width: 2752,
    height: 2064,
    orientation: 'landscape',
    displaySize: '13"',
    name: 'iPad Pro 13" M5 (Landscape)',
  },

  // iPad Pro 12.9" (12.9-inch)
  {
    id: 'ipad-pro-12-9-portrait',
    deviceType: 'ipad',
    model: 'ipad-pro-12-9',
    width: 2048,
    height: 2732,
    orientation: 'portrait',
    displaySize: '12.9"',
    name: 'iPad Pro 12.9" (Portrait)',
  },
  {
    id: 'ipad-pro-12-9-landscape',
    deviceType: 'ipad',
    model: 'ipad-pro-12-9',
    width: 2732,
    height: 2048,
    orientation: 'landscape',
    displaySize: '12.9"',
    name: 'iPad Pro 12.9" (Landscape)',
  },

  // iPad Pro 11" (M5) (11-inch)
  {
    id: 'ipad-pro-11-m5-portrait',
    deviceType: 'ipad',
    model: 'ipad-pro-11-m5',
    width: 1668,
    height: 2388,
    orientation: 'portrait',
    displaySize: '11"',
    name: 'iPad Pro 11" M5 (Portrait)',
  },
  {
    id: 'ipad-pro-11-m5-landscape',
    deviceType: 'ipad',
    model: 'ipad-pro-11-m5',
    width: 2388,
    height: 1668,
    orientation: 'landscape',
    displaySize: '11"',
    name: 'iPad Pro 11" M5 (Landscape)',
  },

  // iPad (11th gen) (11-inch)
  {
    id: 'ipad-11-portrait',
    deviceType: 'ipad',
    model: 'ipad-11',
    width: 1640,
    height: 2360,
    orientation: 'portrait',
    displaySize: '11"',
    name: 'iPad 11th Gen (Portrait)',
  },
  {
    id: 'ipad-11-landscape',
    deviceType: 'ipad',
    model: 'ipad-11',
    width: 2360,
    height: 1640,
    orientation: 'landscape',
    displaySize: '11"',
    name: 'iPad 11th Gen (Landscape)',
  },
];

/**
 * Mac screenshot sizes (16:10 aspect ratio)
 */
export const macSizes: ScreenshotSize[] = [
  // iMac 24"
  {
    id: 'imac-24',
    deviceType: 'mac',
    model: 'imac-24',
    width: 4480,
    height: 2520,
    orientation: 'landscape',
    displaySize: '24"',
    name: 'iMac 24"',
  },

  // MacBook Pro 16"
  {
    id: 'macbook-pro-16',
    deviceType: 'mac',
    model: 'macbook-pro-16',
    width: 3456,
    height: 2234,
    orientation: 'landscape',
    displaySize: '16.2"',
    name: 'MacBook Pro 16"',
  },

  // MacBook Pro 14"
  {
    id: 'macbook-pro-14',
    deviceType: 'mac',
    model: 'macbook-pro-14',
    width: 3024,
    height: 1964,
    orientation: 'landscape',
    displaySize: '14.2"',
    name: 'MacBook Pro 14"',
  },

  // MacBook Air 15"
  {
    id: 'macbook-air-15',
    deviceType: 'mac',
    model: 'macbook-air-15',
    width: 2880,
    height: 1800,
    orientation: 'landscape',
    displaySize: '15.3"',
    name: 'MacBook Air 15"',
  },

  // MacBook Air 13"
  {
    id: 'macbook-air-13',
    deviceType: 'mac',
    model: 'macbook-air-13',
    width: 2560,
    height: 1600,
    orientation: 'landscape',
    displaySize: '13.6"',
    name: 'MacBook Air 13"',
  },
];

/**
 * Apple Watch screenshot sizes
 */
export const watchSizes: ScreenshotSize[] = [
  // Apple Watch Ultra 3 (49mm)
  {
    id: 'watch-ultra-3',
    deviceType: 'watch',
    model: 'watch-ultra-3',
    width: 422,
    height: 514,
    orientation: 'portrait',
    displaySize: '49mm',
    name: 'Apple Watch Ultra 3',
  },

  // Apple Watch Series 11 (46mm)
  {
    id: 'watch-series-11',
    deviceType: 'watch',
    model: 'watch-series-11',
    width: 416,
    height: 496,
    orientation: 'portrait',
    displaySize: '46mm',
    name: 'Apple Watch Series 11',
  },

  // Apple Watch Series 9 (45mm)
  {
    id: 'watch-series-9',
    deviceType: 'watch',
    model: 'watch-series-9',
    width: 396,
    height: 484,
    orientation: 'portrait',
    displaySize: '45mm',
    name: 'Apple Watch Series 9',
  },

  // Apple Watch SE (44mm)
  {
    id: 'watch-se',
    deviceType: 'watch',
    model: 'watch-se',
    width: 368,
    height: 448,
    orientation: 'portrait',
    displaySize: '44mm',
    name: 'Apple Watch SE',
  },

  // Apple Watch Series 3 (42mm)
  {
    id: 'watch-series-3',
    deviceType: 'watch',
    model: 'watch-series-3',
    width: 312,
    height: 390,
    orientation: 'portrait',
    displaySize: '42mm',
    name: 'Apple Watch Series 3',
  },
];

/**
 * Apple TV screenshot sizes
 */
export const tvSizes: ScreenshotSize[] = [
  // Apple TV 4K
  {
    id: 'apple-tv-4k',
    deviceType: 'tv',
    model: 'apple-tv-4k',
    width: 3840,
    height: 2160,
    orientation: 'landscape',
    displaySize: '4K',
    name: 'Apple TV 4K',
  },

  // Apple TV HD
  {
    id: 'apple-tv-hd',
    deviceType: 'tv',
    model: 'apple-tv-hd',
    width: 1920,
    height: 1080,
    orientation: 'landscape',
    displaySize: 'HD',
    name: 'Apple TV HD',
  },
];

/**
 * Apple Vision Pro screenshot sizes
 */
export const visionSizes: ScreenshotSize[] = [
  // Vision Pro
  {
    id: 'vision-pro',
    deviceType: 'vision',
    model: 'vision-pro',
    width: 3840,
    height: 2160,
    orientation: 'landscape',
    displaySize: 'Vision Pro',
    name: 'Apple Vision Pro',
  },
];

/**
 * All screenshot size presets
 */
export const screenshotSizePresets: ScreenshotSizePresets = {
  iphone: iPhoneSizes,
  ipad: iPadSizes,
  mac: macSizes,
  watch: watchSizes,
  tv: tvSizes,
  vision: visionSizes,
};

/**
 * Get all screenshot sizes as a flat array
 */
export function getAllScreenshotSizes(): ScreenshotSize[] {
  return [
    ...iPhoneSizes,
    ...iPadSizes,
    ...macSizes,
    ...watchSizes,
    ...tvSizes,
    ...visionSizes,
  ];
}

/**
 * Get screenshot sizes by device type
 */
export function getScreenshotSizesByType(deviceType: DeviceType): ScreenshotSize[] {
  return screenshotSizePresets[deviceType] || [];
}

/**
 * Get screenshot sizes by device model
 */
export function getScreenshotSizesByModel(model: DeviceModel): ScreenshotSize[] {
  return getAllScreenshotSizes().filter((size) => size.model === model);
}

/**
 * Get screenshot size by ID
 */
export function getScreenshotSizeById(id: string): ScreenshotSize | undefined {
  return getAllScreenshotSizes().find((size) => size.id === id);
}

/**
 * Get screenshot sizes with filters
 */
export function getScreenshotSizes(options: GetSizesOptions = {}): ScreenshotSize[] {
  let sizes = getAllScreenshotSizes();

  // Filter by device types
  if (options.deviceTypes && options.deviceTypes.length > 0) {
    sizes = sizes.filter((size) => options.deviceTypes!.includes(size.deviceType));
  }

  // Filter by orientations
  if (options.orientations && options.orientations.length > 0) {
    sizes = sizes.filter((size) => options.orientations!.includes(size.orientation));
  }

  // Filter by models
  if (options.models && options.models.length > 0) {
    sizes = sizes.filter((size) => options.models!.includes(size.model));
  }

  // Filter by dimensions
  if (options.minWidth !== undefined) {
    sizes = sizes.filter((size) => size.width >= options.minWidth!);
  }

  if (options.maxWidth !== undefined) {
    sizes = sizes.filter((size) => size.width <= options.maxWidth!);
  }

  if (options.minHeight !== undefined) {
    sizes = sizes.filter((size) => size.height >= options.minHeight!);
  }

  if (options.maxHeight !== undefined) {
    sizes = sizes.filter((size) => size.height <= options.maxHeight!);
  }

  return sizes;
}

/**
 * Get recommended screenshot sizes for App Store Connect submission
 * Returns the minimum required set of sizes to cover all device types
 */
export function getRecommendedSizes(): ScreenshotSize[] {
  return [
    // iPhone - 6.9" (covers 6.9", 6.7", 6.5", 6.1")
    getScreenshotSizeById('iphone-17-pro-max-portrait')!,

    // iPhone - 5.5" (covers 5.8", 5.5")
    getScreenshotSizeById('iphone-8-plus-portrait')!,

    // iPad Pro - 12.9" (covers all iPad Pro sizes)
    getScreenshotSizeById('ipad-pro-12-9-portrait')!,

    // iPad - 10.9" (covers standard iPads)
    getScreenshotSizeById('ipad-11-portrait')!,

    // Mac (one size fits all)
    getScreenshotSizeById('imac-24')!,

    // Apple Watch (largest size)
    getScreenshotSizeById('watch-ultra-3')!,

    // Apple TV 4K
    getScreenshotSizeById('apple-tv-4k')!,

    // Vision Pro
    getScreenshotSizeById('vision-pro')!,
  ];
}

/**
 * Get unique device models across all sizes
 */
export function getUniqueModels(): DeviceModel[] {
  const models = new Set<DeviceModel>();
  getAllScreenshotSizes().forEach((size) => models.add(size.model));
  return Array.from(models);
}

/**
 * Get unique device types
 */
export function getUniqueDeviceTypes(): DeviceType[] {
  return ['iphone', 'ipad', 'mac', 'watch', 'tv', 'vision'];
}

/**
 * Calculate aspect ratio for a size
 */
export function calculateAspectRatio(size: ScreenshotSize): number {
  return size.width / size.height;
}

/**
 * Find sizes with similar aspect ratio (within tolerance)
 */
export function findSimilarAspectRatios(
  targetSize: ScreenshotSize,
  tolerance: number = 0.01
): ScreenshotSize[] {
  const targetRatio = calculateAspectRatio(targetSize);
  return getAllScreenshotSizes().filter((size) => {
    const ratio = calculateAspectRatio(size);
    return Math.abs(ratio - targetRatio) <= tolerance;
  });
}
