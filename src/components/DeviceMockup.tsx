/**
 * DeviceMockup Component
 *
 * Enhanced device mockup preview component with interactive controls.
 * Built on top of DeviceFrame (APP-001) to provide a rich preview experience.
 *
 * Features:
 * - Interactive zoom and pan controls
 * - Multiple device selection
 * - Device rotation (portrait/landscape)
 * - Screenshot upload and preview
 * - Device color selection
 * - Background options (transparent, gradient, solid)
 * - Export functionality
 *
 * @example
 * ```tsx
 * <DeviceMockup
 *   screenshot="/path/to/screenshot.png"
 *   defaultDevice="iphone-16-pro-max"
 *   enableControls={true}
 * />
 * ```
 */

import React, { useState, useRef, useEffect } from 'react';
import { DeviceFrame } from './DeviceFrame';
import {
  DeviceModel,
  Orientation,
  DeviceType,
  DeviceFrameConfig,
} from '../types/deviceFrame';
import { deviceFramePresets, getDevicesByType } from '../config/deviceFrames';

export interface DeviceMockupProps {
  /** Screenshot URL or file path */
  screenshot?: string;
  /** Default device to display */
  defaultDevice?: DeviceModel;
  /** Default orientation */
  defaultOrientation?: Orientation;
  /** Enable interactive controls */
  enableControls?: boolean;
  /** Initial zoom level (0.1 to 3) */
  initialZoom?: number;
  /** Background style */
  background?: 'transparent' | 'gradient' | 'solid' | 'custom';
  /** Custom background color (when background='solid' or 'custom') */
  backgroundColor?: string;
  /** Custom background gradient (when background='custom') */
  backgroundGradient?: string;
  /** Enable device switching */
  enableDeviceSwitch?: boolean;
  /** Enable color selection */
  enableColorSelection?: boolean;
  /** Width of the mockup container */
  width?: number;
  /** Height of the mockup container */
  height?: number;
  /** CSS class name */
  className?: string;
  /** Callback when screenshot changes */
  onScreenshotChange?: (screenshot: string) => void;
  /** Callback when device changes */
  onDeviceChange?: (device: DeviceModel) => void;
}

/**
 * DeviceMockup Component
 */
export const DeviceMockup: React.FC<DeviceMockupProps> = ({
  screenshot,
  defaultDevice = 'iphone-16-pro-max',
  defaultOrientation = 'portrait',
  enableControls = true,
  initialZoom = 1,
  background = 'gradient',
  backgroundColor = '#f5f5f7',
  backgroundGradient,
  enableDeviceSwitch = true,
  enableColorSelection = true,
  width = 800,
  height = 600,
  className = '',
  onScreenshotChange,
  onDeviceChange,
}) => {
  // State
  const [currentDevice, setCurrentDevice] = useState<DeviceModel>(defaultDevice);
  const [orientation, setOrientation] = useState<Orientation>(defaultOrientation);
  const [zoom, setZoom] = useState<number>(initialZoom);
  const [panX, setPanX] = useState<number>(0);
  const [panY, setPanY] = useState<number>(0);
  const [deviceColor, setDeviceColor] = useState<string | undefined>(undefined);
  const [currentScreenshot, setCurrentScreenshot] = useState<string | undefined>(screenshot);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  // Refs
  const containerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Get device configuration
  const deviceConfig = deviceFramePresets[currentDevice];

  // Get devices by type for device selector
  const getDeviceList = (): Record<DeviceType, DeviceFrameConfig[]> => {
    return {
      iphone: getDevicesByType('iphone'),
      ipad: getDevicesByType('ipad'),
      mac: getDevicesByType('mac'),
      watch: getDevicesByType('watch'),
      tv: getDevicesByType('tv'),
      vision: getDevicesByType('vision'),
    };
  };

  // Handle device change
  const handleDeviceChange = (device: DeviceModel) => {
    setCurrentDevice(device);
    if (onDeviceChange) {
      onDeviceChange(device);
    }
  };

  // Handle orientation toggle
  const handleOrientationToggle = () => {
    setOrientation((prev) => (prev === 'portrait' ? 'landscape' : 'portrait'));
  };

  // Handle zoom change
  const handleZoomChange = (newZoom: number) => {
    setZoom(Math.max(0.1, Math.min(3, newZoom)));
  };

  // Handle zoom in
  const handleZoomIn = () => {
    handleZoomChange(zoom + 0.1);
  };

  // Handle zoom out
  const handleZoomOut = () => {
    handleZoomChange(zoom - 0.1);
  };

  // Handle zoom reset
  const handleZoomReset = () => {
    setZoom(1);
    setPanX(0);
    setPanY(0);
  };

  // Handle mouse wheel zoom
  const handleWheel = (e: React.WheelEvent) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      const delta = e.deltaY > 0 ? -0.1 : 0.1;
      handleZoomChange(zoom + delta);
    }
  };

  // Handle pan start
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button === 0) {
      // Left click
      setIsDragging(true);
      setDragStart({ x: e.clientX - panX, y: e.clientY - panY });
    }
  };

  // Handle pan move
  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      setPanX(e.clientX - dragStart.x);
      setPanY(e.clientY - dragStart.y);
    }
  };

  // Handle pan end
  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Handle screenshot upload
  const handleScreenshotUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result as string;
        setCurrentScreenshot(result);
        if (onScreenshotChange) {
          onScreenshotChange(result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle screenshot paste
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (items) {
        for (let i = 0; i < items.length; i++) {
          if (items[i].type.indexOf('image') !== -1) {
            const blob = items[i].getAsFile();
            if (blob) {
              const reader = new FileReader();
              reader.onload = (event) => {
                const result = event.target?.result as string;
                setCurrentScreenshot(result);
                if (onScreenshotChange) {
                  onScreenshotChange(result);
                }
              };
              reader.readAsDataURL(blob);
            }
          }
        }
      }
    };

    document.addEventListener('paste', handlePaste);
    return () => {
      document.removeEventListener('paste', handlePaste);
    };
  }, [onScreenshotChange]);

  // Get background style
  const getBackgroundStyle = (): React.CSSProperties => {
    switch (background) {
      case 'transparent':
        return {
          background: 'transparent',
        };
      case 'gradient':
        return {
          background:
            backgroundGradient ||
            'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        };
      case 'solid':
        return {
          background: backgroundColor,
        };
      case 'custom':
        return {
          background: backgroundGradient || backgroundColor,
        };
      default:
        return {
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        };
    }
  };

  // Container style
  const containerStyle: React.CSSProperties = {
    position: 'relative',
    width: width,
    height: height,
    overflow: 'hidden',
    borderRadius: '12px',
    ...getBackgroundStyle(),
  };

  // Canvas style (with zoom and pan)
  const canvasStyle: React.CSSProperties = {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: `translate(calc(-50% + ${panX}px), calc(-50% + ${panY}px)) scale(${zoom})`,
    cursor: isDragging ? 'grabbing' : 'grab',
    transition: isDragging ? 'none' : 'transform 0.1s ease-out',
  };

  // Device list
  const deviceList = getDeviceList();

  return (
    <div className={`device-mockup ${className}`} style={{ width: '100%' }}>
      {/* Controls */}
      {enableControls && (
        <div className="mockup-controls" style={controlsStyle}>
          {/* Device Selector */}
          {enableDeviceSwitch && (
            <div className="control-group" style={controlGroupStyle}>
              <label style={labelStyle}>Device:</label>
              <select
                value={currentDevice}
                onChange={(e) => handleDeviceChange(e.target.value as DeviceModel)}
                style={selectStyle}
              >
                <optgroup label="iPhone">
                  {deviceList.iphone.map((device) => (
                    <option key={device.model} value={device.model}>
                      {device.displayName}
                    </option>
                  ))}
                </optgroup>
                <optgroup label="iPad">
                  {deviceList.ipad.map((device) => (
                    <option key={device.model} value={device.model}>
                      {device.displayName}
                    </option>
                  ))}
                </optgroup>
                <optgroup label="Mac">
                  {deviceList.mac.map((device) => (
                    <option key={device.model} value={device.model}>
                      {device.displayName}
                    </option>
                  ))}
                </optgroup>
                <optgroup label="Watch">
                  {deviceList.watch.map((device) => (
                    <option key={device.model} value={device.model}>
                      {device.displayName}
                    </option>
                  ))}
                </optgroup>
              </select>
            </div>
          )}

          {/* Orientation Toggle */}
          <div className="control-group" style={controlGroupStyle}>
            <label style={labelStyle}>Orientation:</label>
            <button onClick={handleOrientationToggle} style={buttonStyle}>
              {orientation === 'portrait' ? '📱 Portrait' : '📲 Landscape'}
            </button>
          </div>

          {/* Color Selection */}
          {enableColorSelection && deviceConfig && deviceConfig.colors && (
            <div className="control-group" style={controlGroupStyle}>
              <label style={labelStyle}>Color:</label>
              <div style={colorSwatchesStyle}>
                {deviceConfig.colors.map((color) => (
                  <button
                    key={color}
                    onClick={() => setDeviceColor(color)}
                    style={{
                      ...colorSwatchStyle,
                      backgroundColor: color,
                      border:
                        deviceColor === color || (!deviceColor && color === deviceConfig.defaultColor)
                          ? '2px solid #007aff'
                          : '2px solid #e0e0e0',
                    }}
                    title={color}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Zoom Controls */}
          <div className="control-group" style={controlGroupStyle}>
            <label style={labelStyle}>Zoom:</label>
            <div style={zoomControlsStyle}>
              <button onClick={handleZoomOut} style={zoomButtonStyle}>
                -
              </button>
              <span style={zoomLabelStyle}>{Math.round(zoom * 100)}%</span>
              <button onClick={handleZoomIn} style={zoomButtonStyle}>
                +
              </button>
              <button onClick={handleZoomReset} style={buttonStyle}>
                Reset
              </button>
            </div>
          </div>

          {/* Screenshot Upload */}
          <div className="control-group" style={controlGroupStyle}>
            <label style={labelStyle}>Screenshot:</label>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleScreenshotUpload}
              style={{ display: 'none' }}
            />
            <button onClick={() => fileInputRef.current?.click()} style={buttonStyle}>
              Upload Screenshot
            </button>
            {currentScreenshot && (
              <button onClick={() => setCurrentScreenshot(undefined)} style={buttonStyle}>
                Clear
              </button>
            )}
          </div>

          {/* Instructions */}
          <div className="control-group" style={controlGroupStyle}>
            <small style={instructionsStyle}>
              💡 Tip: Cmd/Ctrl + Scroll to zoom, Click and drag to pan, Cmd/Ctrl + V to paste
            </small>
          </div>
        </div>
      )}

      {/* Mockup Container */}
      <div
        ref={containerRef}
        style={containerStyle}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
      >
        {/* Device Frame */}
        <div style={canvasStyle}>
          <DeviceFrame
            device={currentDevice}
            orientation={orientation}
            content={currentScreenshot}
            style={{
              frameColor: deviceColor,
              shadow: true,
              shadowBlur: 60,
              shadowColor: 'rgba(0, 0, 0, 0.4)',
              shadowX: 0,
              shadowY: 30,
            }}
          />
        </div>

        {/* Empty State */}
        {!currentScreenshot && (
          <div style={emptyStateStyle}>
            <p style={{ fontSize: '24px', marginBottom: '16px' }}>📱</p>
            <p style={{ fontSize: '16px', fontWeight: '600', marginBottom: '8px' }}>
              No screenshot loaded
            </p>
            <p style={{ fontSize: '14px', color: '#666', marginBottom: '16px' }}>
              Upload an image or paste from clipboard
            </p>
            <button
              onClick={() => fileInputRef.current?.click()}
              style={{ ...buttonStyle, padding: '12px 24px', fontSize: '16px' }}
            >
              Upload Screenshot
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

/**
 * Styles
 */

const controlsStyle: React.CSSProperties = {
  marginBottom: '20px',
  padding: '20px',
  backgroundColor: '#ffffff',
  borderRadius: '12px',
  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
};

const controlGroupStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  marginBottom: '16px',
  gap: '12px',
};

const labelStyle: React.CSSProperties = {
  fontSize: '14px',
  fontWeight: '600',
  color: '#333',
  minWidth: '100px',
};

const selectStyle: React.CSSProperties = {
  padding: '8px 12px',
  borderRadius: '8px',
  border: '1px solid #e0e0e0',
  fontSize: '14px',
  backgroundColor: '#ffffff',
  cursor: 'pointer',
  outline: 'none',
};

const buttonStyle: React.CSSProperties = {
  padding: '8px 16px',
  borderRadius: '8px',
  border: '1px solid #e0e0e0',
  fontSize: '14px',
  backgroundColor: '#ffffff',
  cursor: 'pointer',
  outline: 'none',
  transition: 'all 0.2s',
};

const colorSwatchesStyle: React.CSSProperties = {
  display: 'flex',
  gap: '8px',
};

const colorSwatchStyle: React.CSSProperties = {
  width: '32px',
  height: '32px',
  borderRadius: '50%',
  cursor: 'pointer',
  transition: 'all 0.2s',
  outline: 'none',
};

const zoomControlsStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
};

const zoomButtonStyle: React.CSSProperties = {
  ...buttonStyle,
  width: '36px',
  height: '36px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontWeight: 'bold',
  fontSize: '18px',
};

const zoomLabelStyle: React.CSSProperties = {
  fontSize: '14px',
  fontWeight: '600',
  minWidth: '50px',
  textAlign: 'center',
};

const instructionsStyle: React.CSSProperties = {
  color: '#666',
  fontSize: '12px',
};

const emptyStateStyle: React.CSSProperties = {
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  textAlign: 'center',
  color: '#ffffff',
  pointerEvents: 'none',
};

/**
 * Export
 */
export default DeviceMockup;
