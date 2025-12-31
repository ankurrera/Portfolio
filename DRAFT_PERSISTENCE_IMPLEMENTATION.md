# Draft Persistence & Auto-Save Implementation

## Overview

This implementation adds automatic draft saving and restoration functionality to the Admin Dashboard, ensuring that no data is lost due to accidental tab switches, page refreshes, or browser navigation.

## Core Components

### 1. useFormPersistence Hook (`src/hooks/useFormPersistence.ts`)

A reusable custom React hook that provides:
- **Auto-save with debouncing** (500ms default)
- **Automatic draft restoration** on component mount
- **localStorage-based persistence** strategy
- **Unique draft keys** per form/module
- **Draft management** (save, clear, check unsaved changes)

**Usage:**
```typescript
const { draftRestored, isSaving, clearDraft, hasUnsavedChanges } = useFormPersistence({
  key: 'admin:my_form:draft',
  data: formData,
  onRestore: (restored) => setFormData(restored),
  debounceMs: 500,
  enabled: true,
});
```

### 2. useBeforeUnload Hook (`src/hooks/useBeforeUnload.ts`)

Warns users before leaving the page with unsaved changes.

**Usage:**
```typescript
useBeforeUnload(hasUnsavedChanges);
```

### 3. DraftIndicator Component (`src/components/admin/DraftIndicator.tsx`)

Provides visual feedback for draft operations:
- **"Draft restored"** notification (shown for 5 seconds)
- **"Saving draft..."** indicator during save
- **"Draft saved"** confirmation
- **"Discard"** button to clear drafts

## Integrated Forms

The following admin forms now have draft persistence:

1. **TechnicalProjectForm** - Technical projects creation/editing
2. **AdminAboutEdit** - About page editor
3. **AdminHeroEdit** - Hero sections editor
4. **SkillCategoryForm** - Skills categories management
5. **AchievementForm** - Achievements management
6. **ExperienceForm** - Work experience management

## Draft Storage Keys

All drafts are stored in localStorage with the following naming convention:

- `admin:technical_project:draft:new` - New technical project
- `admin:technical_project:draft:{projectId}` - Edit specific project
- `admin:about_page:draft` - About page editor
- `admin:hero_edit:draft:new` - New hero section
- `admin:hero_edit:draft:{pageSlug}` - Edit specific hero section
- `admin:skill_category:draft:new` - New skill category
- `admin:skill_category:draft:{skillId}` - Edit specific skill
- `admin:achievement:draft:new` - New achievement
- `admin:achievement:draft:{achievementId}` - Edit specific achievement
- `admin:experience:draft:new` - New experience
- `admin:experience:draft:{experienceId}` - Edit specific experience

## Features

### ✅ State Persistence
- Data is automatically saved to localStorage every 500ms after changes
- Drafts persist across:
  - Tab switches
  - Browser minimization
  - Page refreshes
  - Navigation between admin pages

### ✅ Automatic Restoration
- Drafts are automatically restored when returning to a form
- Visual indicator shows when a draft has been restored
- No manual action required from the admin

### ✅ Auto-Save with Debouncing
- Changes trigger auto-save after 500ms of inactivity
- Prevents excessive writes to localStorage
- Visual feedback during save operation

### ✅ Draft Management
- **Publish/Save**: Automatically clears draft on successful submission
- **Discard**: Manual option to reset form and clear draft
- **Clear on success**: Drafts removed after successful save/publish

### ✅ Navigation Protection
- Browser confirmation dialog when leaving with unsaved changes
- Standard browser "beforeunload" event integration
- Works with tab closing and navigation attempts

### ✅ User Experience
- Subtle, non-intrusive indicators
- Clear feedback for all operations
- Consistent behavior across all forms
- No performance impact on form interactions

## Technical Details

### Debouncing Strategy
- Uses setTimeout with cleanup for efficient debouncing
- Default delay: 500ms (configurable per form)
- Prevents race conditions with proper ref management

### Data Serialization
- Uses JSON.stringify/parse for localStorage
- Handles complex objects and arrays
- Image files are stored as URLs (not the file object)
- Graceful error handling for corrupted data

### Memory Management
- Automatic cleanup of timers on unmount
- Refs used to avoid stale closures
- Minimal re-renders through useMemo optimization

### Error Handling
- Try-catch blocks around all localStorage operations
- Console logging for debugging
- Automatic cleanup of corrupted draft data
- User-friendly error messages via toast notifications

## Future Enhancements

Potential improvements for future iterations:

1. **IndexedDB Support**: For large files and media-heavy forms
2. **Draft Versioning**: Keep multiple versions of drafts
3. **Auto-save Indicators**: More detailed progress/status
4. **Draft Expiration**: Auto-delete old drafts after X days
5. **Conflict Resolution**: Handle concurrent edits from multiple tabs
6. **Cloud Sync**: Sync drafts across devices (if needed)

## Testing

See `TESTING_GUIDE.md` for comprehensive manual testing instructions.

Key test scenarios:
- ✅ Tab switching preserves data
- ✅ Page refresh restores drafts
- ✅ Publish clears drafts
- ✅ Discard functionality works
- ✅ Navigation warnings appear
- ✅ Multiple forms can have separate drafts

## Browser Compatibility

Tested and working in:
- ✅ Chrome/Edge (Chromium-based)
- ✅ Firefox
- ✅ Safari
- ✅ Opera

Requires:
- localStorage support (all modern browsers)
- JavaScript enabled
- ES6+ features (handled by build process)
