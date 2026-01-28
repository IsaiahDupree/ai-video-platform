/**
 * Device Frame Types
 *
 * Type definitions for App Store screenshot device frames.
 * Supports iPhone, iPad, Mac, Apple Watch, Apple TV, and Apple Vision Pro.
 */

export type DeviceType = 'iphone' | 'ipad' | 'mac' | 'watch' | 'tv' | 'vision';

export type Orientation = 'portrait' | 'landscape';

/**
 * iPhone Models
 * Based on App Store Connect screenshot specifications (January 2026)
 */
export type iPhoneModel =
  // 6.9" Display
  | 'iphone-17-pro-max'
  | 'iphone-16-pro-max'
  | 'iphone-16-plus'
  | 'iphone-15-pro-max'
  | 'iphone-15-plus'
  | 'iphone-14-pro-max'
  // 6.5" Display
  | 'iphone-14-plus'
  | 'iphone-13-pro-max'
  | 'iphone-12-pro-max'
  | 'iphone-11-pro-max'
  | 'iphone-11'
  | 'iphone-xs-max'
  | 'iphone-xr'
  // 6.3" Display
  | 'iphone-17-pro'
  | 'iphone-17'
  | 'iphone-16-pro'
  | 'iphone-16'
  | 'iphone-15-pro'
  | 'iphone-15'
  | 'iphone-14-pro'
  // 6.1" Display
  | 'iphone-16e'
  | 'iphone-14'
  | 'iphone-13-pro'
  | 'iphone-13'
  | 'iphone-12-pro'
  | 'iphone-12'
  | 'iphone-11-pro'
  | 'iphone-xs'
  | 'iphone-x'
  // 5.5" Display
  | 'iphone-8-plus'
  | 'iphone-7-plus'
  | 'iphone-6s-plus'
  | 'iphone-6-plus'
  // 4.7" Display
  | 'iphone-se-3'
  | 'iphone-se-2'
  | 'iphone-8'
  | 'iphone-7'
  | 'iphone-6s'
  | 'iphone-6'
  // 4" Display
  | 'iphone-se'
  | 'iphone-5s'
  | 'iphone-5c'
  | 'iphone-5';

/**
 * iPad Models
 */
export type iPadModel =
  // 13" Display
  | 'ipad-pro-13-m5'
  | 'ipad-pro-13-m4'
  | 'ipad-air-13-m3'
  | 'ipad-air-13-m2'
  // 12.9" Display
  | 'ipad-pro-12-9'
  // 11" Display
  | 'ipad-pro-11-m5'
  | 'ipad-pro-11-m4'
  | 'ipad-air-11-m3'
  | 'ipad-air-11-m2'
  | 'ipad-11'
  | 'ipad-10'
  | 'ipad-mini-a17'
  | 'ipad-mini-6'
  // 10.5" Display
  | 'ipad-pro-10-5'
  | 'ipad-air-3'
  | 'ipad-9'
  | 'ipad-7'
  // 9.7" Display
  | 'ipad-pro-9-7'
  | 'ipad-air-2'
  | 'ipad-air'
  | 'ipad-mini-5'
  | 'ipad-mini-4';

/**
 * Mac Models (aspect ratio based)
 */
export type MacModel =
  | 'macbook-air-13'
  | 'macbook-air-15'
  | 'macbook-pro-14'
  | 'macbook-pro-16'
  | 'imac-24'
  | 'mac-mini'
  | 'mac-studio';

/**
 * Apple Watch Models
 */
export type WatchModel =
  | 'watch-ultra-3'
  | 'watch-ultra-2'
  | 'watch-ultra'
  | 'watch-series-11'
  | 'watch-series-10'
  | 'watch-series-9'
  | 'watch-series-8'
  | 'watch-series-7'
  | 'watch-series-6'
  | 'watch-series-5'
  | 'watch-series-4'
  | 'watch-se-3'
  | 'watch-se'
  | 'watch-series-3';

/**
 * Apple TV Models
 */
export type TVModel = 'apple-tv-4k' | 'apple-tv-hd';

/**
 * Apple Vision Pro Models
 */
export type VisionModel = 'vision-pro';

export type DeviceModel =
  | iPhoneModel
  | iPadModel
  | MacModel
  | WatchModel
  | TVModel
  | VisionModel;

/**
 * Screenshot dimensions as per App Store Connect specifications
 */
export interface ScreenshotDimensions {
  width: number;
  height: number;
  /** Whether to include status bar in screenshot */
  includeStatusBar?: boolean;
}

/**
 * Device frame configuration
 */
export interface DeviceFrameConfig {
  /** Device type */
  type: DeviceType;
  /** Device model */
  model: DeviceModel;
  /** Display name (e.g., "iPhone 16 Pro Max") */
  displayName: string;
  /** Display size in inches */
  displaySize: string;
  /** Screenshot dimensions for portrait orientation */
  portrait: ScreenshotDimensions;
  /** Screenshot dimensions for landscape orientation */
  landscape: ScreenshotDimensions;
  /** Device frame border radius (percentage of width) */
  borderRadius?: number;
  /** Notch configuration (for devices with notch) */
  notch?: {
    width: number;
    height: number;
  };
  /** Dynamic Island configuration (for newer iPhones) */
  dynamicIsland?: {
    width: number;
    height: number;
  };
  /** Device color options */
  colors?: string[];
  /** Default device color */
  defaultColor?: string;
}

/**
 * Frame style options
 */
export interface FrameStyle {
  /** Frame color (device bezel) */
  frameColor?: string;
  /** Screen background color */
  backgroundColor?: string;
  /** Whether to show device shadow */
  shadow?: boolean;
  /** Shadow blur radius */
  shadowBlur?: number;
  /** Shadow color */
  shadowColor?: string;
  /** Shadow offset X */
  shadowX?: number;
  /** Shadow offset Y */
  shadowY?: number;
  /** Whether to show reflection */
  reflection?: boolean;
  /** Frame thickness in pixels */
  frameThickness?: number;
  /** Whether to show home button (for older devices) */
  showHomeButton?: boolean;
  /** Whether to show buttons (volume, power) */
  showButtons?: boolean;
  /** Whether to show notch/dynamic island */
  showNotch?: boolean;
}

/**
 * Content positioning within the device frame
 */
export interface ContentPosition {
  /** X position (0-1, relative to screen area) */
  x?: number;
  /** Y position (0-1, relative to screen area) */
  y?: number;
  /** Scale (1 = fill screen) */
  scale?: number;
  /** Whether to crop content to screen bounds */
  crop?: boolean;
}

/**
 * Device Frame Props
 */
export interface DeviceFrameProps {
  /** Device configuration or model name */
  device: DeviceFrameConfig | DeviceModel;
  /** Orientation */
  orientation?: Orientation;
  /** Frame style options */
  style?: FrameStyle;
  /** Content to display in the frame (screenshot URL or component) */
  content?: string | React.ReactNode;
  /** Content position */
  contentPosition?: ContentPosition;
  /** Width of the rendered frame (height calculated from aspect ratio) */
  width?: number;
  /** Height of the rendered frame (width calculated from aspect ratio) */
  height?: number;
  /** CSS class name */
  className?: string;
}

/**
 * Device frame preset configurations
 */
export type DeviceFramePresets = {
  [key in DeviceModel]: DeviceFrameConfig;
};
