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
 */

import React, { CSSProperties } from 'react';
import { Img } from 'remotion';
import {
  DeviceFrameProps,
  DeviceModel,
  DeviceFrameConfig,
  Orientation,
  FrameStyle,
  ContentPosition,
} from '../types/deviceFrame';
import { deviceFramePresets, getDeviceFrame } from '../config/deviceFrames';

/**
 * Default frame style
 */
const defaultFrameStyle: FrameStyle = {
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
  showNotch: true,
};

/**
 * Default content position
 */
const defaultContentPosition: ContentPosition = {
  x: 0.5,
  y: 0.5,
  scale: 1,
  crop: true,
};

/**
 * Get device configuration
 */
function getDeviceConfig(device: DeviceFrameConfig | DeviceModel): DeviceFrameConfig {
  if (typeof device === 'string') {
    const config = getDeviceFrame(device);
    if (!config) {
      throw new Error(`Unknown device model: ${device}`);
    }
    return config;
  }
  return device;
}

/**
 * Calculate frame dimensions
 */
function calculateDimensions(
  config: DeviceFrameConfig,
  orientation: Orientation,
  targetWidth?: number,
  targetHeight?: number
): { width: number; height: number; screenWidth: number; screenHeight: number } {
  const dims = orientation === 'portrait' ? config.portrait : config.landscape;
  const aspectRatio = dims.width / dims.height;

  // Add frame thickness (bezel) to dimensions
  const frameThickness = defaultFrameStyle.frameThickness || 12;
  const totalWidth = dims.width + frameThickness * 2;
  const totalHeight = dims.height + frameThickness * 2;

  let width: number;
  let height: number;

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
    screenWidth: (dims.width / totalWidth) * width,
    screenHeight: (dims.height / totalHeight) * height,
  };
}

/**
 * DeviceFrame Component
 */
export const DeviceFrame: React.FC<DeviceFrameProps> = ({
  device,
  orientation = 'portrait',
  style,
  content,
  contentPosition,
  width: targetWidth,
  height: targetHeight,
  className,
}) => {
  const config = getDeviceConfig(device);
  const frameStyle = { ...defaultFrameStyle, ...style };
  const contentPos = { ...defaultContentPosition, ...contentPosition };

  const { width, height, screenWidth, screenHeight } = calculateDimensions(
    config,
    orientation,
    targetWidth,
    targetHeight
  );

  // Calculate frame thickness as percentage of total size
  const frameThicknessPx = frameStyle.frameThickness || 12;
  const frameThicknessPercent = (frameThicknessPx / Math.min(width, height)) * 100;

  // Device color
  const deviceColor = frameStyle.frameColor || config.defaultColor || '#1d1d1f';

  // Border radius
  const borderRadiusPercent = (config.borderRadius || 0.05) * 100;

  // Container style with shadow
  const containerStyle: CSSProperties = {
    position: 'relative',
    width: width,
    height: height,
    ...(frameStyle.shadow && {
      filter: `drop-shadow(${frameStyle.shadowX}px ${frameStyle.shadowY}px ${frameStyle.shadowBlur}px ${frameStyle.shadowColor})`,
    }),
  };

  // Frame (device bezel) style
  const frameContainerStyle: CSSProperties = {
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
    overflow: 'hidden',
  };

  // Screen area style
  const screenStyle: CSSProperties = {
    position: 'relative',
    width: screenWidth,
    height: screenHeight,
    backgroundColor: frameStyle.backgroundColor,
    borderRadius: `${borderRadiusPercent * 0.8}%`,
    overflow: 'hidden',
  };

  // Content style
  const contentStyle: CSSProperties = {
    position: 'absolute',
    top: `${(contentPos.y || 0.5) * 100}%`,
    left: `${(contentPos.x || 0.5) * 100}%`,
    transform: `translate(-50%, -50%) scale(${contentPos.scale || 1})`,
    width: contentPos.crop ? '100%' : 'auto',
    height: contentPos.crop ? '100%' : 'auto',
    objectFit: contentPos.crop ? 'cover' : 'contain',
  };

  // Notch/Dynamic Island style
  const hasNotch = frameStyle.showNotch && (config.notch || config.dynamicIsland);
  const notchConfig = config.dynamicIsland || config.notch;
  const notchStyle: CSSProperties | undefined = hasNotch && notchConfig
    ? {
        position: 'absolute',
        top: 0,
        left: '50%',
        transform: 'translateX(-50%)',
        width: (notchConfig.width / screenWidth) * 100 + '%',
        height: (notchConfig.height / screenHeight) * 100 + '%',
        backgroundColor: deviceColor,
        borderRadius: config.dynamicIsland ? '50%' : '0 0 20px 20px',
        zIndex: 10,
      }
    : undefined;

  // Home button style (for older iPhones)
  const showHomeButton =
    frameStyle.showHomeButton &&
    config.type === 'iphone' &&
    !config.notch &&
    !config.dynamicIsland;
  const homeButtonStyle: CSSProperties | undefined = showHomeButton
    ? {
        position: 'absolute',
        bottom: orientation === 'portrait' ? -frameThicknessPx + 'px' : '50%',
        right: orientation === 'portrait' ? '50%' : -frameThicknessPx + 'px',
        transform:
          orientation === 'portrait' ? 'translateX(50%)' : 'translateY(50%)',
        width: orientation === 'portrait' ? '60px' : '20px',
        height: orientation === 'portrait' ? '60px' : '60px',
        backgroundColor: '#000',
        border: '2px solid ' + deviceColor,
        borderRadius: '50%',
      }
    : undefined;

  return (
    <div style={containerStyle} className={className} data-device={config.model}>
      {/* Device Frame (Bezel) */}
      <div style={frameContainerStyle}>
        {/* Screen Area */}
        <div style={screenStyle}>
          {/* Notch or Dynamic Island */}
          {notchStyle && <div style={notchStyle} />}

          {/* Content */}
          {content && (
            <>
              {typeof content === 'string' ? (
                <Img src={content} style={contentStyle} />
              ) : (
                <div style={contentStyle}>{content}</div>
              )}
            </>
          )}
        </div>

        {/* Home Button (for older devices) */}
        {homeButtonStyle && <div style={homeButtonStyle} />}
      </div>

      {/* Buttons (optional) */}
      {frameStyle.showButtons && renderButtons(config, width, height, orientation, deviceColor)}
    </div>
  );
};

/**
 * Render device buttons (volume, power)
 */
function renderButtons(
  config: DeviceFrameConfig,
  width: number,
  height: number,
  orientation: Orientation,
  color: string
): React.ReactNode {
  if (config.type !== 'iphone' && config.type !== 'ipad') {
    return null;
  }

  const buttonStyle: CSSProperties = {
    position: 'absolute',
    backgroundColor: color,
    borderRadius: '2px',
  };

  const isPortrait = orientation === 'portrait';

  return (
    <>
      {/* Volume Up Button */}
      <div
        style={{
          ...buttonStyle,
          [isPortrait ? 'left' : 'top']: '-3px',
          [isPortrait ? 'top' : 'left']: isPortrait ? '20%' : '30%',
          [isPortrait ? 'width' : 'height']: '3px',
          [isPortrait ? 'height' : 'width']: isPortrait ? '50px' : '40px',
        }}
      />

      {/* Volume Down Button */}
      <div
        style={{
          ...buttonStyle,
          [isPortrait ? 'left' : 'top']: '-3px',
          [isPortrait ? 'top' : 'left']: isPortrait ? '30%' : '38%',
          [isPortrait ? 'width' : 'height']: '3px',
          [isPortrait ? 'height' : 'width']: isPortrait ? '50px' : '40px',
        }}
      />

      {/* Power Button */}
      <div
        style={{
          ...buttonStyle,
          [isPortrait ? 'right' : 'top']: '-3px',
          [isPortrait ? 'top' : 'right']: isPortrait ? '25%' : '20%',
          [isPortrait ? 'width' : 'height']: '3px',
          [isPortrait ? 'height' : 'width']: isPortrait ? '80px' : '60px',
        }}
      />
    </>
  );
}

/**
 * Export device frame presets for convenience
 */
export { deviceFramePresets, getDeviceFrame, getDevicesByType } from '../config/deviceFrames';
export * from '../types/deviceFrame';
