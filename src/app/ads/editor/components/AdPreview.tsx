'use client';

import { useEffect, useRef } from 'react';
import { AdTemplate } from '../../../../types/adTemplate';

interface AdPreviewProps {
  template: AdTemplate;
}

export default function AdPreview({ template }: AdPreviewProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    renderPreview();
  }, [template]);

  const renderPreview = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { width, height } = template.dimensions;
    const scale = Math.min(800 / width, 600 / height);

    canvas.width = width;
    canvas.height = height;

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    // Draw background
    if (template.content.gradient) {
      const gradient = ctx.createLinearGradient(0, 0, width, height);
      gradient.addColorStop(0, template.content.gradient.from);
      gradient.addColorStop(1, template.content.gradient.to);
      ctx.fillStyle = gradient;
    } else if (template.content.backgroundColor) {
      ctx.fillStyle = template.content.backgroundColor;
    } else {
      ctx.fillStyle = template.style?.primaryColor || '#3b82f6';
    }
    ctx.fillRect(0, 0, width, height);

    // Setup text rendering
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    const padding = template.style?.padding || 40;
    const gap = template.style?.gap || 16;

    // Render based on layout
    switch (template.layout) {
      case 'hero-text':
      case 'text-only':
        renderHeroText(ctx, template, padding, gap);
        break;
      case 'quote':
        renderQuote(ctx, template, padding, gap);
        break;
      case 'minimal':
        renderMinimal(ctx, template, padding);
        break;
      default:
        renderHeroText(ctx, template, padding, gap);
    }
  };

  const renderHeroText = (
    ctx: CanvasRenderingContext2D,
    template: AdTemplate,
    padding: number,
    gap: number
  ) => {
    const { width, height } = template.dimensions;
    const centerY = height / 2;

    // Headline
    ctx.fillStyle = template.style?.textColor || '#ffffff';
    ctx.font = `${template.style?.headlineFontWeight || 700} ${
      template.style?.headlineSize || 48
    }px ${template.style?.headlineFont || 'Inter, sans-serif'}`;

    const headlineLines = wrapText(
      ctx,
      template.content.headline || '',
      width - padding * 2
    );
    let currentY = centerY - ((headlineLines.length * (template.style?.headlineSize || 48) + gap) / 2);

    headlineLines.forEach((line) => {
      ctx.fillText(line, width / 2, currentY);
      currentY += (template.style?.headlineSize || 48) * 1.2;
    });

    // Subheadline
    if (template.content.subheadline) {
      currentY += gap;
      ctx.font = `${template.style?.bodyFontWeight || 400} ${
        template.style?.bodySize || 20
      }px ${template.style?.bodyFont || template.style?.headlineFont || 'Inter, sans-serif'}`;

      const subheadlineLines = wrapText(
        ctx,
        template.content.subheadline,
        width - padding * 2
      );

      subheadlineLines.forEach((line) => {
        ctx.fillText(line, width / 2, currentY);
        currentY += (template.style?.bodySize || 20) * 1.4;
      });
    }

    // CTA Button
    if (template.content.cta) {
      currentY += gap * 2;
      const buttonWidth = 200;
      const buttonHeight = 50;
      const buttonX = width / 2 - buttonWidth / 2;
      const buttonY = currentY - buttonHeight / 2;

      // Button background
      ctx.fillStyle = template.style?.ctaBackgroundColor || '#ffffff';
      const radius = template.style?.borderRadius || 8;
      roundRect(ctx, buttonX, buttonY, buttonWidth, buttonHeight, radius);
      ctx.fill();

      // Button text
      ctx.fillStyle = template.style?.ctaTextColor || template.style?.primaryColor || '#3b82f6';
      ctx.font = `600 16px ${
        template.style?.bodyFont || template.style?.headlineFont || 'Inter, sans-serif'
      }`;
      ctx.fillText(template.content.cta, width / 2, currentY);
    }
  };

  const renderQuote = (
    ctx: CanvasRenderingContext2D,
    template: AdTemplate,
    padding: number,
    gap: number
  ) => {
    const { width, height } = template.dimensions;
    const centerY = height / 2;

    // Quote marks
    ctx.fillStyle = template.style?.textColor || '#ffffff';
    ctx.font = `${template.style?.headlineFontWeight || 700} ${
      (template.style?.headlineSize || 48) * 1.5
    }px Georgia, serif`;
    ctx.fillText('"', width / 2 - width / 3, centerY - height / 6);

    // Quote text
    ctx.font = `${template.style?.headlineFontWeight || 500} ${
      template.style?.headlineSize || 32
    }px ${template.style?.headlineFont || 'Inter, sans-serif'}`;

    const quoteLines = wrapText(
      ctx,
      template.content.headline || '',
      width - padding * 2
    );

    let currentY = centerY - (quoteLines.length * (template.style?.headlineSize || 32)) / 2;

    quoteLines.forEach((line) => {
      ctx.fillText(line, width / 2, currentY);
      currentY += (template.style?.headlineSize || 32) * 1.3;
    });

    // Author
    if (template.content.authorName) {
      currentY += gap * 2;
      ctx.font = `${template.style?.bodyFontWeight || 600} ${
        template.style?.bodySize || 18
      }px ${template.style?.bodyFont || 'Inter, sans-serif'}`;
      ctx.fillText(template.content.authorName, width / 2, currentY);

      if (template.content.authorTitle) {
        currentY += (template.style?.bodySize || 18) * 1.3;
        ctx.font = `${template.style?.bodyFontWeight || 400} ${
          (template.style?.bodySize || 18) * 0.9
        }px ${template.style?.bodyFont || 'Inter, sans-serif'}`;
        ctx.fillText(template.content.authorTitle, width / 2, currentY);
      }
    }
  };

  const renderMinimal = (
    ctx: CanvasRenderingContext2D,
    template: AdTemplate,
    padding: number
  ) => {
    const { width, height } = template.dimensions;
    const centerY = height / 2;

    // Simple centered text
    ctx.fillStyle = template.style?.textColor || '#ffffff';
    ctx.font = `${template.style?.headlineFontWeight || 600} ${
      template.style?.headlineSize || 40
    }px ${template.style?.headlineFont || 'Inter, sans-serif'}`;

    const lines = wrapText(ctx, template.content.headline || '', width - padding * 2);
    let currentY = centerY - (lines.length * (template.style?.headlineSize || 40)) / 2;

    lines.forEach((line) => {
      ctx.fillText(line, width / 2, currentY);
      currentY += (template.style?.headlineSize || 40) * 1.2;
    });
  };

  // Helper function to wrap text
  const wrapText = (ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] => {
    const words = text.split(' ');
    const lines: string[] = [];
    let currentLine = '';

    words.forEach((word) => {
      const testLine = currentLine + (currentLine ? ' ' : '') + word;
      const metrics = ctx.measureText(testLine);

      if (metrics.width > maxWidth && currentLine) {
        lines.push(currentLine);
        currentLine = word;
      } else {
        currentLine = testLine;
      }
    });

    if (currentLine) {
      lines.push(currentLine);
    }

    return lines;
  };

  // Helper function to draw rounded rectangle
  const roundRect = (
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    width: number,
    height: number,
    radius: number
  ) => {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '1rem',
      }}
    >
      <div
        style={{
          background: 'white',
          padding: '2rem',
          borderRadius: '12px',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
        }}
      >
        <canvas
          ref={canvasRef}
          style={{
            maxWidth: '800px',
            maxHeight: '600px',
            width: '100%',
            height: 'auto',
            display: 'block',
            border: '1px solid #e5e7eb',
            borderRadius: '8px',
          }}
        />
      </div>

      <div style={{ textAlign: 'center', color: '#6b7280', fontSize: '0.875rem' }}>
        {template.dimensions.name} - {template.dimensions.width} × {template.dimensions.height}
      </div>
    </div>
  );
}
