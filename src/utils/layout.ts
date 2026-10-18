// Layout and positioning helpers

export interface Position {
  x: number;
  y: number;
}

export interface Size {
  width: number;
  height: number;
}

export interface Bounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

// Center positioning
export function center(containerSize: Size): Position {
  return {
    x: containerSize.width / 2,
    y: containerSize.height / 2,
  };
}

// Safe area calculations (for mobile/TV)
export function getSafeArea(
  width: number,
  height: number,
  marginPercent: number = 5
): Bounds {
  const marginX = (width * marginPercent) / 100;
  const marginY = (height * marginPercent) / 100;
  
  return {
    x: marginX,
    y: marginY,
    width: width - marginX * 2,
    height: height - marginY * 2,
  };
}

// Grid layout helpers
export function gridPosition(
  index: number,
  columns: number,
  cellWidth: number,
  cellHeight: number,
  gap: number = 0,
  startX: number = 0,
  startY: number = 0
): Position {
  const col = index % columns;
  const row = Math.floor(index / columns);
  
  return {
    x: startX + col * (cellWidth + gap),
    y: startY + row * (cellHeight + gap),
  };
}

export function gridLayout(
  itemCount: number,
  containerWidth: number,
  containerHeight: number,
  columns: number,
  gap: number = 0
): { positions: Position[]; cellSize: Size } {
  const rows = Math.ceil(itemCount / columns);
  const cellWidth = (containerWidth - gap * (columns - 1)) / columns;
  const cellHeight = (containerHeight - gap * (rows - 1)) / rows;
  
  const positions: Position[] = [];
  for (let i = 0; i < itemCount; i++) {
    positions.push(gridPosition(i, columns, cellWidth, cellHeight, gap));
  }
  
  return {
    positions,
    cellSize: { width: cellWidth, height: cellHeight },
  };
}

// Flex-like layout
export function distributeHorizontally(
  itemCount: number,
  containerWidth: number,
  itemWidth: number,
  startX: number = 0
): number[] {
  if (itemCount === 1) {
    return [startX + containerWidth / 2 - itemWidth / 2];
  }
  
  const totalItemsWidth = itemCount * itemWidth;
  const totalGap = containerWidth - totalItemsWidth;
  const gap = totalGap / (itemCount - 1);
  
  const positions: number[] = [];
  for (let i = 0; i < itemCount; i++) {
    positions.push(startX + i * (itemWidth + gap));
  }
  
  return positions;
}

export function distributeVertically(
  itemCount: number,
  containerHeight: number,
  itemHeight: number,
  startY: number = 0
): number[] {
  if (itemCount === 1) {
    return [startY + containerHeight / 2 - itemHeight / 2];
  }
  
  const totalItemsHeight = itemCount * itemHeight;
  const totalGap = containerHeight - totalItemsHeight;
  const gap = totalGap / (itemCount - 1);
  
  const positions: number[] = [];
  for (let i = 0; i < itemCount; i++) {
    positions.push(startY + i * (itemHeight + gap));
  }
  
  return positions;
}

// Responsive scaling
export function scaleToFit(
  sourceSize: Size,
  targetSize: Size,
  mode: 'contain' | 'cover' = 'contain'
): { scale: number; offset: Position } {
  const scaleX = targetSize.width / sourceSize.width;
  const scaleY = targetSize.height / sourceSize.height;
  
  const scale = mode === 'contain'
    ? Math.min(scaleX, scaleY)
    : Math.max(scaleX, scaleY);
  
  const scaledWidth = sourceSize.width * scale;
  const scaledHeight = sourceSize.height * scale;
  
  return {
    scale,
    offset: {
      x: (targetSize.width - scaledWidth) / 2,
      y: (targetSize.height - scaledHeight) / 2,
    },
  };
}

// Aspect ratio calculations
export function aspectRatioToSize(
  aspectRatio: string,
  width: number
): Size {
  const [w, h] = aspectRatio.split(':').map(Number);
  const height = (width * h) / w;
  return { width, height };
}

export function getAspectRatio(width: number, height: number): string {
  const gcd = (a: number, b: number): number => (b === 0 ? a : gcd(b, a % b));
  const divisor = gcd(width, height);
  return `${width / divisor}:${height / divisor}`;
}

// Text positioning
export function centerText(
  containerWidth: number,
  textWidth: number
): number {
  return (containerWidth - textWidth) / 2;
}

export function alignText(
  containerWidth: number,
  textWidth: number,
  align: 'left' | 'center' | 'right',
  padding: number = 0
): number {
  switch (align) {
    case 'left':
      return padding;
    case 'center':
      return (containerWidth - textWidth) / 2;
    case 'right':
      return containerWidth - textWidth - padding;
  }
}
