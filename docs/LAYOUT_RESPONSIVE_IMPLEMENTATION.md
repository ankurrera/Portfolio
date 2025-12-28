# Responsive Layout Gallery Implementation

## Overview

The `LayoutGallery` component implements a fully responsive gallery with three distinct layout modes that preserve the admin's original design intent while adapting to different screen sizes.

## Layout Modes

### 1. Desktop (≥1200px) - Admin Layout Preservation

**Behavior:**
- Exact replication of admin-designed layout
- Uses absolute positioning with admin-defined values
- No auto-resizing or auto-scaling

**Implementation:**
```tsx
<div className="relative w-full" style={{ height: `${calculateContainerHeight()}px` }}>
  <button
    className="absolute"
    style={{
      left: `${posX}px`,
      top: `${posY}px`,
      width: `${width}px`,
      height: `${height}px`,
      transform: `scale(${scale}) rotate(${rotation}deg)`,
      zIndex: zIndex,
    }}
  >
```

**Key Properties:**
- `position_x`, `position_y` - Exact admin-defined positions
- `width`, `height` - Original card dimensions
- `scale` - Admin-defined scale factor
- `rotation` - Admin-defined rotation angle
- `z_index` - Layering order

### 2. Tablet (600-1199px) - 4-Column Responsive Grid

**Behavior:**
- Reflows images into 4-column grid
- Maintains original aspect ratios
- Equal column width distribution
- No horizontal scrolling

**Implementation:**
```css
.gallery-tablet-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  grid-auto-rows: auto;
  gap: 24px;
  place-items: start;
  max-width: 100%;
}
```

```tsx
<button className="w-full">
  <div style={{ paddingBottom: `${aspectRatio * 100}%` }}>
```

**Key Features:**
- `minmax(0, 1fr)` - Equal column widths with overflow prevention
- `gap: 24px` - Consistent spacing between items
- `place-items: start` - Align items to grid cell start
- Padding-bottom technique maintains original aspect ratios
- Each image calculates its own aspect ratio: `height / width`

**Aspect Ratio Calculation:**
```tsx
const width = image.width || 300;
const height = image.height || 400;
const aspectRatio = width > 0 ? height / width : 400 / 300;
```

### 3. Mobile (<600px) - Single Column

**Behavior:**
- Displays images in single vertical column
- Maintains original aspect ratios
- Images scale down if wider than screen
- Centered horizontally
- No horizontal scrolling

**Implementation:**
```css
.gallery-mobile-column {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1.5rem;
  max-width: 100%;
}
```

```tsx
<button
  className="w-full"
  style={{ maxWidth: `${width}px` }}
>
  <div style={{ paddingBottom: `${aspectRatioPercent}%` }}>
```

**Key Features:**
- `w-full` - Images fill container width
- `maxWidth: ${width}px` - Limited to original width (never larger)
- `align-items: center` - Horizontal centering
- Padding-bottom technique maintains aspect ratios
- Container padding (`px-4`) provides safe boundaries

**Width Calculation:**
- If original width ≤ container width: uses original width
- If original width > container width: scales to fit container (100%)

## Horizontal Scrolling Prevention

### Container Constraints
```tsx
<div className="max-w-[1600px] mx-auto px-4 md:px-6 lg:px-8 pb-32">
```

- `max-w-[1600px]` - Maximum container width
- `px-4` (mobile) - 16px padding on each side
- `md:px-6` (tablet) - 24px padding on each side  
- `lg:px-8` (desktop) - 32px padding on each side

### Tablet Grid Math Example (768px viewport)
```
Viewport: 768px
Padding: 24px × 2 = 48px
Available: 768 - 48 = 720px
Gaps: 24px × 3 = 72px (between 4 columns)
Column space: 720 - 72 = 648px
Each column: 648 ÷ 4 = 162px
```

Using `minmax(0, 1fr)` ensures columns never exceed available space.

### Mobile Math Example (375px viewport)
```
Viewport: 375px
Padding: 16px × 2 = 32px
Available: 375 - 32 = 343px
Max image width: min(343px, original width)
```

The `w-full` + `maxWidth` combination ensures images fit within available space.

## Aspect Ratio Preservation

### Padding-Bottom Technique

Images use the "padding-bottom hack" to maintain aspect ratios:

```tsx
const aspectRatio = height / width;

<div style={{ paddingBottom: `${aspectRatio * 100}%` }}>
  <div className="absolute inset-0">
    <img className="w-full h-full object-cover" />
  </div>
</div>
```

**How it works:**
1. Outer div has `width: 100%` (fills container)
2. `padding-bottom` is set to aspect ratio percentage
3. Inner div with `position: absolute` fills the space
4. Image covers the area with `object-cover`

**Example:**
- Original: 300px × 400px
- Aspect ratio: 400/300 = 1.333
- Padding-bottom: 133.3%
- Result: Container height = 133.3% of its width

### Division by Zero Protection

```tsx
const aspectRatio = width > 0 ? height / width : 400 / 300;
```

Fallback to 4:5 aspect ratio if width is 0 or missing.

## Viewport Detection

```tsx
const [isDesktop, setIsDesktop] = useState(false);
const [isTablet, setIsTablet] = useState(false);

useEffect(() => {
  const checkViewport = () => {
    const width = window.innerWidth;
    setIsDesktop(width >= 1200);
    setIsTablet(width >= 600 && width < 1200);
  };
  
  const debouncedCheckViewport = () => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    debounceTimerRef.current = setTimeout(checkViewport, 150);
  };
  
  checkViewport();
  window.addEventListener('resize', debouncedCheckViewport);
}, []);
```

**Key Features:**
- Breakpoints: Desktop (≥1200px), Tablet (600-1199px), Mobile (<600px)
- Debounced resize handling (150ms delay)
- Initial check on mount
- Cleanup on unmount

## Image Order

Images are sorted by `z_index` to maintain admin-defined ordering:

```tsx
const sortedImages = [...images].sort((a, b) => (a.z_index || 0) - (b.z_index || 0));
```

This ensures consistent display order across all layout modes.

## Requirements Compliance

✅ **Requirement 1:** Desktop preserves exact admin layout  
✅ **Requirement 2:** Tablet uses 4-column grid with aspect ratio preservation  
✅ **Requirement 3:** Mobile uses single column with aspect ratio preservation  
✅ **Requirement 4:** Original aspect ratios maintained (not absolute sizes)  
✅ **Requirement 5:** Admin dashboard unchanged  
✅ **Requirement 6:** Order preserved via z_index sorting  
✅ **Requirement 7:** No layout overlap, distortion, or forced sizing  
✅ **Requirement 8:** No horizontal scrolling on tablet/mobile  

## Technical Notes

### Why `minmax(0, 1fr)` for tablet grid columns?

The implementation uses `repeat(4, minmax(0, 1fr))` rather than plain `repeat(4, 1fr)` or `repeat(4, auto)`:

- **`minmax(0, 1fr)` benefits:**
  - Distributes available space equally among 4 columns (from `1fr`)
  - Prevents column overflow with `minmax(0, ...)` constraint
  - Each column can shrink to 0 if needed, preventing grid from exceeding container
  - Works seamlessly with `w-full` on grid items
  - Maintains responsive 4-column layout without horizontal scrolling

- **Why not `repeat(4, auto)`?**
  - `auto` columns size to content, which could exceed viewport width
  - Combined with large images, this causes horizontal scrolling
  - Doesn't work well with `w-full` items (circular dependency)

- **Why not plain `repeat(4, 1fr)`?**
  - Without `minmax(0, ...)`, columns might not shrink properly in edge cases
  - `minmax(0, 1fr)` is more defensive against overflow

The approach maintains the intent (4-column layout respecting aspect ratios) while guaranteeing no horizontal scrolling.

### Padding-bottom technique for aspect ratios

The implementation uses the padding-bottom technique rather than the modern `aspect-ratio` CSS property:

```tsx
<div style={{ paddingBottom: `${aspectRatio * 100}%` }}>
  <div className="absolute inset-0">
    <img className="w-full h-full object-cover" />
  </div>
</div>
```

**Rationale:**
- **Consistency**: Existing codebase already uses padding-bottom throughout
- **Proven reliability**: Well-tested pattern with predictable behavior
- **Integration**: Works seamlessly with absolute positioning and loading states
- **Cross-browser**: Universal support including older browsers

**Note:** The modern `aspect-ratio` property could be considered in a future refactor, as it has excellent browser support as of 2024 and provides cleaner, more semantic code. However, this would require updating the entire gallery implementation for consistency.

## Future Improvements

Potential enhancements (not in current scope):
- Lazy loading for performance optimization
- Intersection Observer for progressive image loading
- CSS Grid `aspect-ratio` property when wider browser support is confirmed
- Virtual scrolling for large galleries
- Optimized image serving (responsive images with srcset)
