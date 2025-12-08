# WYSIWYG Portfolio Editor

## Overview

The WYSIWYG (What You See Is What You Get) Portfolio Editor is a comprehensive in-context editing system that allows administrators to manage their photography portfolio with precision and ease. Instead of a separate upload interface, admins now edit photos directly on a faithful replica of the public view.

## Key Features

### 1. Exact Replica of Public View
- The editor renders the same header, photographer bio, and footer as the public pages
- What admins see is exactly what visitors will see
- Toggle between Preview (read-only) and Edit modes
- Device preview modes: Desktop, Tablet, and Mobile

### 2. Drag & Drop Positioning
- **Click and Drag**: Click on any photo and drag it to reposition
- **Touch Support**: Full touch support for tablets and touch-screen devices
- **Snap to Grid**: Optional 20px grid snapping for precise alignment
- **Visual Grid**: Grid overlay shown in edit mode when snap is enabled
- **Real-time Feedback**: Position coordinates displayed while dragging

### 3. Photo Manipulation

#### Resizing
- **Aspect Ratio Lock**: Resize handle automatically maintains the original aspect ratio
- **Minimum Size**: Photos cannot be smaller than 100px to ensure quality
- **Visual Feedback**: Size dimensions displayed during resize

#### Scaling
- **Hold-and-Pull**: Click and hold on the scale handle (top-right), then drag to scale
- **Pinch-to-Zoom**: Two-finger pinch gesture on touch devices
- **Scale Range**: 0.5x to 3x scale factor
- **Scale Indicator**: Current scale factor shown during scaling operation

#### Z-Order Management
- **Bring Forward**: Moves photo to front of all others
- **Send Backward**: Moves photo behind all others
- **Layering**: Visual stacking controlled by z-index

### 4. History & Undo/Redo
- **Multi-level Undo/Redo**: Up to 50 history entries
- **History Dialog**: View and restore any previous version
- **Autosave**: Changes are debounced and saved to history automatically
- **Save Draft**: Explicitly save current layout as draft
- **Publish**: Push changes live to public view

### 5. Toolbar Controls

#### Mode Toggle
- **Preview**: Read-only mode showing exact public view
- **Edit**: Full editing mode with draggable photos and controls

#### Device Preview
- **Desktop**: Full-width view (up to 1600px)
- **Tablet**: 768px width simulation
- **Mobile**: 375px width simulation

#### Tools
- **Grid Toggle**: Enable/disable snap-to-grid
- **Undo/Redo**: Navigate through change history
- **History**: View and restore previous versions
- **Add Photo**: Upload new photos to the category

#### Actions
- **Save Draft**: Save layout without publishing (is_draft = true)
- **Publish**: Push layout live to public view (is_draft = false)

## Database Schema

The editor adds the following fields to the `photos` table:

```sql
position_x FLOAT        -- X coordinate of photo top-left corner
position_y FLOAT        -- Y coordinate of photo top-left corner
width FLOAT             -- Photo width in pixels
height FLOAT            -- Photo height in pixels
scale FLOAT             -- Scale factor (1.0 = 100%)
rotation FLOAT          -- Rotation in degrees (currently unused)
z_index INTEGER         -- Stacking order (higher = front)
is_draft BOOLEAN        -- Whether layout is published or draft
layout_config JSONB     -- Additional layout metadata
```

A separate `photo_layout_revisions` table stores named layout revisions for future restoration.

## New Photo Defaults

When a new photo is uploaded:
- **Position**: Auto-calculated in 3-column grid (300px + 20px gap)
- **Size**: 300px × 400px
- **Scale**: 1.0 (100%)
- **Rotation**: 0 degrees
- **Z-index**: Next available index (highest + 1)

## Usage Guide

### For Administrators

1. **Navigate to Admin Dashboard**: Go to `/admin`
2. **Select Category**: Choose from Selected, Commissioned, Editorial, or Personal
3. **Toggle Edit Mode**: Click "Edit" in the toolbar (default)
4. **Position Photos**:
   - Click and drag photos to move them
   - Use snap-to-grid for precise alignment
   - Position coordinates shown during drag
5. **Resize Photos**:
   - Drag the resize handle (bottom-right) to change size
   - Aspect ratio is automatically maintained
6. **Scale Photos**:
   - Hold the scale button (top-right) and drag to scale
   - Or use pinch-to-zoom on touch devices
7. **Manage Layers**:
   - Click "Bring Forward" to move photo to front
   - Click "Send Backward" to move photo to back
8. **Save Your Work**:
   - Changes are auto-saved to history
   - Click "Save Draft" to save without publishing
   - Click "Publish" to push changes live

### Keyboard Shortcuts

- **Cmd/Ctrl + Z**: Undo
- **Cmd/Ctrl + Shift + Z**: Redo
- **Escape**: Close dialogs

## Technical Implementation

### Components

- **WYSIWYGEditor** (`src/components/admin/WYSIWYGEditor.tsx`)
  - Main editor wrapper
  - Handles state management, history, and API calls
  - Renders public view components (header, bio, footer)

- **DraggablePhoto** (`src/components/admin/DraggablePhoto.tsx`)
  - Individual photo with drag, resize, and scale capabilities
  - Touch event handling for mobile devices
  - Visual controls and feedback

- **EditorToolbar** (`src/components/admin/EditorToolbar.tsx`)
  - Top toolbar with all editing controls
  - Mode toggle, device preview, tools, and actions

- **PhotoUploader** (`src/components/admin/PhotoUploader.tsx`)
  - Enhanced to set default positions for new photos
  - Maintains existing upload and compression features

### State Management

- **Photos**: Array of PhotoLayoutData objects
- **History**: Stack of up to 50 previous states
- **History Index**: Current position in history stack
- **Debounced Updates**: Position/size changes debounced to 500ms before adding to history

### Performance Optimizations

- **useCallback**: All event handlers memoized to prevent re-renders
- **Debounced History**: Prevents history spam during continuous drag operations
- **Conditional Rendering**: Grid overlay and controls only shown when needed
- **Image Lazy Loading**: Photos loaded on-demand

## Browser Support

- **Desktop**: Chrome, Firefox, Safari, Edge (latest 2 versions)
- **Tablet**: iPad, Android tablets with touch support
- **Mobile**: iPhone, Android phones (limited editing, primarily for preview)

## Known Limitations

1. **Rotation**: Rotation field exists but UI controls not implemented
2. **Crop**: Non-destructive crop feature not yet implemented
3. **Alignment Guides**: Smart snapping to other images not yet implemented
4. **Revision Names**: History entries use auto-generated descriptions
5. **Mobile Editing**: Full editing better suited for desktop/tablet

## Future Enhancements

- [ ] Alignment guides showing snap points to other photos
- [ ] Rotation controls with visual feedback
- [ ] Non-destructive crop with preview
- [ ] Named revision saves with descriptions
- [ ] Keyboard shortcuts for bring forward/send back
- [ ] Multi-select for batch operations
- [ ] Copy/paste photo positioning
- [ ] Export/import layout configurations

## Security

- All photo operations require admin role
- Row-level security policies enforce admin-only access
- No security vulnerabilities found in CodeQL scan
- Draft mode prevents accidental publication

## Testing

To test the WYSIWYG editor:

1. Log in as admin user
2. Upload at least 3-4 photos to a category
3. Test drag-and-drop positioning
4. Test resize with aspect ratio lock
5. Test hold-and-pull scaling
6. Test pinch-to-zoom on touch device
7. Verify undo/redo works correctly
8. Save as draft and verify public view unchanged
9. Publish and verify public view updated
10. Test history dialog and restoration

## Troubleshooting

**Photos not moving**:
- Ensure you're in Edit mode (not Preview)
- Check that you're clicking the photo, not the background

**Changes not saving**:
- Check browser console for errors
- Verify admin role in database
- Check network tab for failed API calls

**History not working**:
- History is limited to 50 entries
- Ensure historyInitialized flag is set correctly

**Touch not working**:
- Verify touch events are not blocked by browser
- Check device supports multi-touch for pinch-to-zoom
