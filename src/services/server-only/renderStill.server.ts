'use server';

/**
 * Server-only version of renderStill - prevents bundling into client
 * This file must have the .server.ts extension and use 'use server'
 */

export { renderStill, renderAdTemplate, batchRenderStills, getAvailableCompositions, getCompositionInfo, type RenderStillOptions, type RenderStillResult, type ImageFormat, type BatchRenderOptions } from '../renderStill';
