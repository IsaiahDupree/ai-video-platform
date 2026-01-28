# ADS-005: Auto-fit Text

**Status**: ✅ Complete
**Priority**: P1
**Effort**: 8pts
**Category**: static-ads
**Dependencies**: ADS-001

## Overview

AutoFitText is a React component that automatically sizes text to fit within a container, with support for shrink-to-fit, line clamping, safe-area handling, and overflow detection. This component is essential for creating professional static ads where text must fit perfectly within design constraints.

## Features

### 1. Shrink-to-fit
- Automatically reduces font size to fit text within container
- Binary search algorithm for optimal font size selection
- Configurable min/max font size range
- Preserves readability by respecting minimum size

### 2. Line Wrapping
- Intelligent word-based text wrapping
- Respects container width and padding
- Maintains word integrity (no mid-word breaks)
- Adjusts based on font size and metrics

### 3. Line Clamping
- Optional maximum line limit
- Automatic ellipsis (...) when text exceeds max lines
- Smart truncation that fits ellipsis within bounds
- Customizable ellipsis string

### 4. Safe-area Handling
- Configurable padding on all sides
- Text stays within safe boundaries
- Proper handling of container dimensions
- Prevents text overflow or cutoff

### 5. Alignment Options
- **Horizontal**: left, center, right
- **Vertical**: top, middle, bottom
- Independent control of both axes
- Proper positioning based on actual text dimensions

### 6. Overflow Detection
- Callback when text is truncated
- Real-time overflow status tracking
- Useful for validation and warnings
- Helps ensure text quality

## Component API

### Props

```typescript
interface AutoFitTextProps {
  // Required
  text: string;                    // Text content to display
  containerWidth: number;          // Container width in pixels
  containerHeight: number;         // Container height in pixels

  // Font sizing
  maxFontSize?: number;            // Max font size (default: 64)
  minFontSize?: number;            // Min font size (default: 12)
  fontWeight?: number;             // Font weight (default: 700)
  fontFamily?: string;             // Font family (default: 'Inter, sans-serif')

  // Styling
  color?: string;                  // Text color (default: '#000000')
  lineHeight?: number;             // Line height multiplier (default: 1.2)

  // Layout
  padding?: number;                // Container padding (default: 0)
  align?: 'left' | 'center' | 'right';           // Horizontal align (default: 'center')
  verticalAlign?: 'top' | 'middle' | 'bottom';   // Vertical align (default: 'middle')

  // Truncation
  maxLines?: number;               // Max lines before truncating (optional)
  ellipsis?: string;               // Truncation string (default: '...')
  allowOverflow?: boolean;         // Allow overflow (default: false)

  // Callbacks
  onOverflow?: (isTruncated: boolean) => void;   // Overflow callback
  className?: string;              // Custom CSS class
}
```

## Usage Examples

### Basic Usage

```tsx
import AutoFitText from '@/components/AutoFitText';

export default function MyAd() {
  return (
    <AutoFitText
      text="Transform Your Workflow"
      containerWidth={800}
      containerHeight={400}
      padding={40}
    />
  );
}
```

### With Line Clamping

```tsx
<AutoFitText
  text="This is a long headline that might need to be truncated if it's too long"
  containerWidth={600}
  containerHeight={200}
  maxLines={2}
  ellipsis="..."
  onOverflow={(isTruncated) => {
    if (isTruncated) {
      console.warn('Text was truncated!');
    }
  }}
/>
```

### Custom Styling

```tsx
<AutoFitText
  text="Bold Statement"
  containerWidth={1080}
  containerHeight={1080}
  maxFontSize={120}
  minFontSize={24}
  fontWeight={900}
  fontFamily="'Montserrat', sans-serif"
  color="#ffffff"
  lineHeight={1.1}
  padding={60}
  align="left"
  verticalAlign="top"
/>
```

### Instagram Story Ad

```tsx
<AutoFitText
  text="Limited Time Offer - 50% Off All Products"
  containerWidth={1080}
  containerHeight={1920}
  maxFontSize={80}
  minFontSize={32}
  fontWeight={800}
  padding={80}
  align="center"
  verticalAlign="middle"
  maxLines={3}
  onOverflow={(truncated) => {
    if (truncated) {
      // Show warning in editor UI
    }
  }}
/>
```

### Facebook Feed Ad

```tsx
<AutoFitText
  text="Discover the Future of AI Video Generation"
  containerWidth={1200}
  containerHeight={628}
  maxFontSize={72}
  minFontSize={28}
  padding={50}
  align="center"
  verticalAlign="middle"
/>
```

## Utility Functions

### useTextMetrics Hook

Measure text dimensions before rendering:

```tsx
import { useTextMetrics } from '@/components/AutoFitText';

function MyComponent() {
  const { width, height } = useTextMetrics(
    'My text',
    48,  // fontSize
    700, // fontWeight
    'Inter, sans-serif'
  );

  console.log(`Text dimensions: ${width}px × ${height}px`);
}
```

### checkTextFits Function

Check if text fits without rendering:

```tsx
import { checkTextFits } from '@/components/AutoFitText';

const { fits, lines } = checkTextFits(
  'Sample text',
  48,              // fontSize
  700,             // fontWeight
  'Inter',         // fontFamily
  800,             // maxWidth
  400,             // maxHeight
  1.2              // lineHeight
);

if (!fits) {
  console.warn(`Text doesn't fit! It would take ${lines} lines`);
}
```

## Algorithm Details

### Font Size Optimization

The component uses binary search to find the optimal font size:

1. **Initialize**: Set low = minFontSize, high = maxFontSize
2. **Binary Search**:
   - Calculate mid = (low + high) / 2
   - Try rendering text at mid font size
   - If text fits: save as best fit, try larger (low = mid + 1)
   - If text doesn't fit: try smaller (high = mid - 1)
3. **Return**: Best fitting font size

**Time Complexity**: O(log(maxFontSize - minFontSize))
**Space Complexity**: O(number of words) for line wrapping

### Text Wrapping

Word-based wrapping algorithm:

1. Split text into words
2. For each word:
   - Try adding to current line
   - Measure width using Canvas 2D context
   - If exceeds maxWidth: start new line
   - Otherwise: add to current line
3. Return array of lines

### Truncation with Ellipsis

When maxLines is set:

1. Wrap text normally
2. If lines > maxLines:
   - Take first maxLines lines
   - Trim last line to fit ellipsis
   - Measure "lastLine + ellipsis"
   - Remove characters until it fits
   - Append ellipsis

## Integration with Ad Editor

### In Ad Preview Canvas

```tsx
// In AdPreview.tsx
import AutoFitText from '@/components/AutoFitText';

function renderHeadline(template: AdTemplate) {
  return (
    <AutoFitText
      text={template.content.headline}
      containerWidth={template.dimensions.width - padding * 2}
      containerHeight={200}
      maxFontSize={template.style?.headlineSize || 64}
      minFontSize={24}
      fontWeight={template.style?.headlineFontWeight || 700}
      fontFamily={template.style?.headlineFont || 'Inter'}
      color={template.style?.textColor || '#ffffff'}
      align="center"
      verticalAlign="middle"
    />
  );
}
```

### In Ad Editor Form

```tsx
// Add auto-fit toggle
const [useAutoFit, setUseAutoFit] = useState(true);

<label>
  <input
    type="checkbox"
    checked={useAutoFit}
    onChange={(e) => setUseAutoFit(e.target.checked)}
  />
  Auto-fit headline
</label>

{useAutoFit && (
  <div>
    <label>Max Lines</label>
    <input
      type="number"
      min="1"
      max="10"
      value={maxHeadlineLines}
      onChange={(e) => setMaxHeadlineLines(Number(e.target.value))}
    />
  </div>
)}
```

## Performance

### Rendering Performance

- **Initial calculation**: ~5-15ms (depends on text length)
- **Binary search iterations**: Typically 5-8 iterations
- **Canvas measurements**: ~1ms per iteration
- **Re-renders**: Only on prop changes (React memo-ized)

### Optimization Tips

1. **Limit font size range**: Narrow range = faster search
2. **Cache measurements**: For repeated text, cache results
3. **Debounce input**: When user types, debounce updates
4. **Use production build**: Development mode is slower

### Memory Usage

- **Canvas element**: ~100KB (reused across instances)
- **Text metrics**: ~1KB per instance
- **No memory leaks**: Proper cleanup in useEffect

## Testing

### Manual Testing

1. Navigate to `/ads/autofit-demo`
2. Test various text lengths:
   - Short text (1-3 words)
   - Medium text (10-20 words)
   - Long text (50+ words)
3. Adjust container size and observe auto-sizing
4. Test line clamping with different max lines
5. Verify overflow detection callback
6. Test all alignment combinations
7. Check different font weights and families

### Automated Tests

```tsx
import { render } from '@testing-library/react';
import AutoFitText from '@/components/AutoFitText';

describe('AutoFitText', () => {
  test('renders text within container', () => {
    const { container } = render(
      <AutoFitText
        text="Hello World"
        containerWidth={400}
        containerHeight={200}
      />
    );
    expect(container.textContent).toContain('Hello World');
  });

  test('calls onOverflow when truncated', () => {
    const onOverflow = jest.fn();
    render(
      <AutoFitText
        text="Very long text that will definitely be truncated"
        containerWidth={100}
        containerHeight={50}
        maxLines={1}
        onOverflow={onOverflow}
      />
    );
    expect(onOverflow).toHaveBeenCalledWith(true);
  });
});
```

## Browser Compatibility

- ✅ Chrome 90+ (tested on Chrome 131)
- ✅ Safari 14+ (tested on Safari 18)
- ✅ Firefox 88+
- ✅ Edge 90+

**Requirements**:
- Canvas 2D API support
- TextMetrics API
- ES2020+ JavaScript

## Accessibility

### Screen Readers

- Text is rendered as normal HTML `<div>` elements
- Proper semantic structure
- No ARIA labels needed (text is readable)

### Contrast

- Ensure sufficient color contrast
- Test with WCAG AA standards
- AutoFitText doesn't modify colors

### Keyboard Navigation

- Text is not interactive (no keyboard handling needed)
- Focusable only if wrapped in interactive element

## Common Issues

### Issue: Text appears blurry

**Cause**: Canvas rendering at low resolution
**Solution**: Use devicePixelRatio scaling or render as HTML

```tsx
const scale = window.devicePixelRatio || 1;
// Apply scaling in canvas rendering
```

### Issue: Font doesn't match design

**Cause**: Font not loaded when component renders
**Solution**: Use next/font or ensure font is preloaded

```tsx
import { Inter } from 'next/font/google';
const inter = Inter({ subsets: ['latin'] });
```

### Issue: Text overflows container

**Cause**: minFontSize is too large
**Solution**: Reduce minFontSize or increase container size

```tsx
<AutoFitText
  minFontSize={8}  // Allow smaller text
  allowOverflow={true}  // Or allow overflow
/>
```

### Issue: Performance lag on input

**Cause**: Re-calculating on every keystroke
**Solution**: Debounce text input

```tsx
import { useDebouncedValue } from '@/hooks/useDebounce';

const debouncedText = useDebouncedValue(text, 300);

<AutoFitText text={debouncedText} />
```

## Future Enhancements

### Planned Features

1. **Multi-column layout**: Support for column-based text flow
2. **Gradient text**: Support for gradient text fills
3. **Text effects**: Shadow, stroke, outline support
4. **Vertical text**: Support for vertical writing mode
5. **RTL support**: Right-to-left language support
6. **Font loading**: Auto-detect when fonts are loaded
7. **Animation**: Smooth font size transitions
8. **Advanced wrapping**: Hyphenation, orphan prevention

### Optimization Ideas

1. **Web Workers**: Move calculations to background thread
2. **WASM**: Compile core algorithm to WebAssembly
3. **GPU acceleration**: Use WebGL for measurements
4. **Caching**: Cache metrics per font/size/text combination

## Best Practices

### 1. Set Appropriate Ranges

```tsx
// Good: Reasonable range for readability
<AutoFitText maxFontSize={72} minFontSize={18} />

// Bad: Too wide range, may result in tiny text
<AutoFitText maxFontSize={120} minFontSize={6} />
```

### 2. Use Padding for Safe Areas

```tsx
// Good: Leaves breathing room
<AutoFitText padding={40} />

// Bad: Text touches edges
<AutoFitText padding={0} />
```

### 3. Handle Overflow Gracefully

```tsx
// Good: Show warning to user
<AutoFitText
  onOverflow={(truncated) => {
    if (truncated) {
      showWarning('Text is truncated. Consider shortening.');
    }
  }}
/>
```

### 4. Match Font Metrics

```tsx
// Good: Consistent font stack
<AutoFitText fontFamily="'Inter', -apple-system, sans-serif" />

// Bad: Font may not load
<AutoFitText fontFamily="CustomFont" />
```

### 5. Consider Line Height

```tsx
// Good: Tighter for headlines
<AutoFitText lineHeight={1.1} />

// Good: More readable for body text
<AutoFitText lineHeight={1.5} />
```

## Conclusion

AutoFitText provides a robust solution for automatic text sizing in static ad generation. It handles the complex challenge of fitting variable-length text into fixed containers while maintaining readability and design quality.

**Key Benefits**:
- ✅ Automatic sizing eliminates manual adjustments
- ✅ Prevents text overflow and cutoff
- ✅ Maintains professional appearance
- ✅ Saves time in ad creation workflow
- ✅ Works across all ad sizes and platforms

**Next Steps**:
- Integrate into ad preview canvas (replace manual text rendering)
- Add to template customization options
- Create presets for common use cases
- Add to batch rendering pipeline
