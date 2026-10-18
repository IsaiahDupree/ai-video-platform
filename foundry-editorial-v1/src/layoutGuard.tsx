import {useLayoutEffect, type RefObject} from 'react';
import {cancelRender, continueRender, delayRender} from 'remotion';
import {EDITORIAL_ZONES, validateLayout, type LayoutMeasurement, type Rect} from './geometry';

type GuardProps = {
  rootRef: RefObject<HTMLElement | null>;
  frame: number;
  width?: number;
  height?: number;
  zones?: Record<string, Rect>;
};

function isVisible(element: HTMLElement, root: HTMLElement): boolean {
  let current: HTMLElement | null = element;
  while (current) {
    const style = getComputedStyle(current);
    if (style.display === 'none' || style.visibility === 'hidden' || Number(style.opacity) === 0) return false;
    if (current === root) break;
    current = current.parentElement;
  }
  return true;
}

export function measureLayout(root: HTMLElement, width: number, height: number): LayoutMeasurement[] {
  const canvas = root.getBoundingClientRect();
  if (canvas.width <= 0 || canvas.height <= 0) throw new Error('The layout root has no measurable canvas.');
  const scaleX = width / canvas.width;
  const scaleY = height / canvas.height;
  const normalize = (r: DOMRect | DOMRectReadOnly): Rect => ({
    x: (r.left - canvas.left) * scaleX, y: (r.top - canvas.top) * scaleY,
    width: r.width * scaleX, height: r.height * scaleY,
  });
  const nodes = Array.from(root.querySelectorAll<HTMLElement>('[data-layout-box]'));
  const measurements: LayoutMeasurement[] = [];
  for (const element of nodes) {
    if (!isVisible(element, root)) continue;
    const ancestorIds: string[] = [];
    let parent = element.parentElement;
    while (parent && parent !== root) {
      if (parent.dataset.layoutBox) ancestorIds.push(parent.dataset.layoutBox);
      parent = parent.parentElement;
    }
    const measurement: LayoutMeasurement = {
      id: element.dataset.layoutBox ?? '', zone: element.dataset.layoutZone ?? '',
      rect: normalize(element.getBoundingClientRect()), ancestorIds,
      overflowX: Math.max(0, element.scrollWidth - element.clientWidth) * scaleX,
      overflowY: Math.max(0, element.scrollHeight - element.clientHeight) * scaleY,
    };
    if (element.dataset.layoutText === 'true') {
      const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
      const textRects: Rect[] = [];
      const fontSizes: number[] = [];
      let text: Node | null;
      while ((text = walker.nextNode())) {
        if (!text.textContent?.trim() || !text.parentElement || !isVisible(text.parentElement, root)) continue;
        const range = document.createRange();
        range.selectNodeContents(text);
        for (const rect of Array.from(range.getClientRects())) {
          if (rect.width > 0 && rect.height > 0) textRects.push(normalize(rect));
        }
        fontSizes.push(Number.parseFloat(getComputedStyle(text.parentElement).fontSize));
      }
      measurement.textRects = textRects;
      measurement.fontSize = fontSizes.length ? Math.min(...fontSizes) : 0;
      measurement.minimumFontSize = Number(element.dataset.layoutMinFont ?? 28);
    }
    measurements.push(measurement);
  }
  return measurements;
}

/**
 * Real Chromium layout is measured before Remotion captures each frame.
 * Mark semantic blocks; leave decorative backgrounds/art unannotated.
 * A successful full render proves the guard ran for every captured frame,
 * including transitions. It does not certify unannotated artwork or taste.
 */
export function LayoutGuard({rootRef, frame, width = 1920, height = 1080, zones = EDITORIAL_ZONES}: GuardProps) {
  useLayoutEffect(() => {
    const handle = delayRender(`Editorial layout audit: frame ${frame}`, {timeoutInMilliseconds: 30000});
    let disposed = false;
    let released = false;
    const release = () => {if (!released) {released = true; continueRender(handle);}};
    const check = async () => {
      // Child layout effects can run before the enclosing host element's ref
      // attaches. Keep the capture delayed, then resume after React commits.
      await document.fonts.ready;
      if (disposed) return;
      const root = rootRef.current;
      if (!root) throw new Error('LayoutGuard requires a mounted canvas root.');
      const images = Array.from(root.querySelectorAll<HTMLImageElement>('img'));
      await Promise.all(images.map(async (image) => {
        await image.decode();
        if (!image.naturalWidth || !image.naturalHeight) throw new Error(`Image has no decoded pixels: ${image.getAttribute('src')}`);
      }));
      if (disposed) return;
      const measurements = measureLayout(root, width, height);
      const findings = validateLayout(measurements, {width, height, zones});
      if (findings.length) {
        throw new Error(`Layout audit failed at frame ${frame}: ${JSON.stringify(findings)}`);
      }
      // One structured line per rendered frame permits reconciliation of
      // capture coverage from Orion's bounded worker log, without a new API.
      console.log(`EDITORIAL_LAYOUT_QC ${JSON.stringify({frame, passed: true, elements: measurements.length})}`);
      release();
    };
    void check().catch((error: unknown) => {
      if (!disposed) cancelRender(error instanceof Error ? error : new Error(String(error)));
      release();
    });
    return () => {disposed = true; release();};
  }, [frame, rootRef, width, height, zones]);
  return null;
}
