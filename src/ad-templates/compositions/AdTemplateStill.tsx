/**
 * AdTemplateStill Composition
 * 
 * Remotion Still composition for rendering static ads from TemplateDSL.
 * Supports dynamic canvas sizes and template-driven rendering.
 */

import React from 'react';
import { AbsoluteFill } from 'remotion';
import { z } from 'zod';
import { TemplateRenderer } from '../renderer/TemplateRenderer';
import { TemplateDSLSchema, type TemplateDSL, type Bindings } from '../schema/template-dsl';

// =============================================================================
// Props Schema for Remotion Studio
// =============================================================================

export const AdTemplateStillSchema = z.object({
  template: TemplateDSLSchema,
  overrideBindings: z.object({
    text: z.record(z.string()).optional(),
    assets: z.record(z.string()).optional(),
  }).optional(),
});

export type AdTemplateStillProps = z.infer<typeof AdTemplateStillSchema>;

// =============================================================================
// Main Component
// =============================================================================

export const AdTemplateStill: React.FC<AdTemplateStillProps> = ({
  template,
  overrideBindings,
}) => {
  return (
    <AbsoluteFill>
      <TemplateRenderer
        template={template}
        overrideBindings={overrideBindings}
      />
    </AbsoluteFill>
  );
};

// =============================================================================
// Default Props for Testing
// =============================================================================

export const defaultAdTemplateStillProps: AdTemplateStillProps = {
  template: {
    templateId: 'demo_1080_square',
    name: 'Demo Template',
    version: '1.0.0',
    canvas: { width: 1080, height: 1080, bgColor: '#0b0f1a' },
    layers: [
      {
        id: 'bg_shape',
        type: 'shape',
        z: 0,
        rect: { x: 0, y: 0, w: 1080, h: 1080 },
        shape: { kind: 'rect', fill: '#0b0f1a', radius: 0, opacity: 1, strokeWidth: 0 },
        visible: true,
      },
      {
        id: 'accent_bar',
        type: 'shape',
        z: 1,
        rect: { x: 0, y: 0, w: 1080, h: 8 },
        shape: {
          kind: 'rect',
          radius: 0,
          opacity: 1,
          strokeWidth: 0,
          gradient: {
            type: 'linear',
            angle: 90,
            stops: [
              { offset: 0, color: '#6366f1' },
              { offset: 1, color: '#8b5cf6' },
            ],
          },
        },
        visible: true,
      },
      {
        id: 'headline',
        type: 'text',
        z: 20,
        rect: { x: 80, y: 160, w: 920, h: 300 },
        text: {
          fontFamily: 'Inter',
          fontWeight: 800,
          fontSize: 72,
          lineHeight: 1.1,
          letterSpacing: -2,
          color: '#ffffff',
          align: 'left',
          valign: 'top',
        },
        bind: { textKey: 'headline' },
        constraints: {
          mode: 'fitTextOnNLines',
          maxLines: 3,
          minFontSize: 48,
          overflow: 'hidden',
        },
        visible: true,
      },
      {
        id: 'subheadline',
        type: 'text',
        z: 21,
        rect: { x: 80, y: 500, w: 920, h: 120 },
        text: {
          fontFamily: 'Inter',
          fontWeight: 400,
          fontSize: 28,
          lineHeight: 1.4,
          letterSpacing: 0,
          color: '#a0a0a0',
          align: 'left',
          valign: 'top',
        },
        bind: { textKey: 'subheadline' },
        visible: true,
      },
      {
        id: 'cta_button',
        type: 'shape',
        z: 30,
        rect: { x: 80, y: 700, w: 280, h: 70 },
        shape: {
          kind: 'rect',
          fill: '#6366f1',
          radius: 12,
          opacity: 1,
          strokeWidth: 0,
        },
        visible: true,
      },
      {
        id: 'cta_text',
        type: 'text',
        z: 31,
        rect: { x: 80, y: 700, w: 280, h: 70 },
        text: {
          fontFamily: 'Inter',
          fontWeight: 600,
          fontSize: 20,
          lineHeight: 1,
          letterSpacing: 0.5,
          color: '#ffffff',
          align: 'center',
          valign: 'middle',
          textTransform: 'uppercase',
        },
        bind: { textKey: 'cta' },
        visible: true,
      },
    ],
    bindings: {
      text: {
        headline: 'Transform Your Workflow with AI-Powered Tools',
        subheadline: 'Automate repetitive tasks and focus on what matters most.',
        cta: 'Get Started',
      },
      assets: {},
    },
    meta: {
      source: { type: 'manual' },
      tags: ['demo', 'tech', 'saas'],
    },
  },
};

export default AdTemplateStill;
