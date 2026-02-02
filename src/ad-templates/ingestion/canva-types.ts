/**
 * Canva Apps SDK Type Definitions
 *
 * Types for interacting with Canva's Design Editing API
 * Reference: https://www.canva.dev/docs/apps/design-editing-api/
 */

/**
 * Canva Element Types
 */
export type CanvaElementType =
  | 'TEXT'
  | 'IMAGE'
  | 'SHAPE'
  | 'GROUP'
  | 'PAGE'
  | 'VIDEO'
  | 'EMBED';

/**
 * Text Alignment
 */
export type TextAlign = 'start' | 'center' | 'end';
export type TextVerticalAlign = 'top' | 'center' | 'bottom';

/**
 * Canva Element Base
 */
export interface CanvaElement {
  type: CanvaElementType;
  id: string;
  top: number;
  left: number;
  width: number;
  height: number;
  rotation?: number;
}

/**
 * Canva Text Element
 */
export interface CanvaTextElement extends CanvaElement {
  type: 'TEXT';
  text: string;
  fontFamily?: string;
  fontWeight?: 'normal' | 'bold' | 'lighter' | 'bolder' | number;
  fontSize?: number;
  fontStyle?: 'normal' | 'italic';
  textAlign?: TextAlign;
  verticalAlign?: TextVerticalAlign;
  color?: string;
  lineHeight?: number;
  letterSpacing?: number;
  textDecoration?: 'none' | 'underline' | 'line-through';
}

/**
 * Canva Image Element
 */
export interface CanvaImageElement extends CanvaElement {
  type: 'IMAGE';
  dataUrl?: string;
  altText?: {
    text: string;
  };
}

/**
 * Canva Shape Element
 */
export interface CanvaShapeElement extends CanvaElement {
  type: 'SHAPE';
  fill?: {
    color?: string;
  };
  stroke?: {
    color?: string;
    weight?: number;
  };
  cornerRadius?: number;
}

/**
 * Canva Group Element
 */
export interface CanvaGroupElement extends CanvaElement {
  type: 'GROUP';
  children: CanvaElement[];
}

/**
 * Canva Page
 */
export interface CanvaPage {
  id: string;
  width: number;
  height: number;
  background?: {
    color?: string;
    asset?: {
      dataUrl: string;
    };
  };
  elements: CanvaElement[];
}

/**
 * Canva Design
 */
export interface CanvaDesign {
  id: string;
  title: string;
  pages: CanvaPage[];
}

/**
 * Canva Export Format
 */
export type CanvaExportFormat = 'PNG' | 'JPG' | 'PDF' | 'MP4' | 'GIF';

/**
 * Canva Export Quality
 */
export type CanvaExportQuality = 'low' | 'medium' | 'high';

/**
 * Canva Export Job Request
 */
export interface CanvaExportJobRequest {
  design_id: string;
  format: CanvaExportFormat;
  quality?: CanvaExportQuality;
  pages?: number[]; // Page indices to export (default: all pages)
}

/**
 * Canva Export Job Status
 */
export type CanvaExportJobStatus = 'in_progress' | 'success' | 'failed';

/**
 * Canva Export Job
 */
export interface CanvaExportJob {
  id: string;
  status: CanvaExportJobStatus;
  urls?: string[]; // Download URLs when status is 'success'
  error?: {
    message: string;
    code: string;
  };
}

/**
 * Canva API Configuration
 */
export interface CanvaConfig {
  clientId?: string;
  clientSecret?: string;
  accessToken?: string;
  apiBaseUrl?: string;
}

/**
 * Canva Design Session
 */
export interface CanvaDesignSession {
  designId: string;
  page: CanvaPage;
  getElements(): Promise<CanvaElement[]>;
  updateElement(elementId: string, updates: Partial<CanvaElement>): Promise<void>;
  addElement(element: Partial<CanvaElement>): Promise<string>;
  removeElement(elementId: string): Promise<void>;
}
