# Draft Persistence Testing Guide

## Overview
This document provides step-by-step testing instructions for verifying the draft persistence functionality across all affected admin pages.

## Affected Pages
1. **Photoshoots Page** (WYSIWYGEditor) - Draft key: `admin:draft:photoshoots`
2. **Artistic Work Page** (ArtworkWYSIWYGEditor) - Draft key: `admin:draft:artistic`
3. **Technical About Section** (TechnicalAboutForm) - Draft key: `admin:draft:technical_about`
4. **About Page Management** (AdminAboutEdit) - Draft key: `admin:about_page:draft`

---

## Test Case 1: Draft Saves Automatically

### Steps:
1. Navigate to any of the affected admin pages
2. Make changes to form fields (text, positions, uploads, etc.)
3. Wait 500ms (debounce delay)
4. Check browser DevTools → Application → Local Storage
5. Verify draft key exists with saved data

### Expected Result:
✅ Draft should appear in localStorage after 500ms
✅ "Saving draft..." indicator should appear briefly
✅ "Draft saved" indicator should appear after save completes

---

## Test Case 2: Draft Restores on Page Reload (Meaningful Data)

### Steps:
1. Navigate to any affected admin page
2. Make meaningful changes:
   - Add non-empty text to fields
   - Upload images
   - Change positions/layouts
   - Add array items
3. Wait for draft to save (see indicator)
4. Refresh the page (F5 or Ctrl+R)
5. Wait for page to load

### Expected Result:
✅ All changes should be restored
✅ "Draft restored from previous session" message should appear for 5 seconds
✅ "Discard" button should be available

---

## Test Case 3: Empty Draft Does NOT Restore

### Steps:
1. Navigate to any affected admin page
2. Clear any existing drafts via DevTools or Discard button
3. Load the page with empty/default data
4. Do NOT make any changes
5. Check localStorage - it will have a draft with empty/default values
6. Refresh the page

### Expected Result:
✅ "Draft restored" message should NOT appear
✅ Empty draft should be cleared from localStorage automatically
✅ Form should load with default/database values

---

## Test Case 4: Draft Validation Examples

### Test with these scenarios to verify validation:

#### ❌ Should NOT restore:
- `{ profileImageUrl: '', bioText: '', services: [] }`
- `{ photos: [] }`
- `{ sectionLabel: '', heading: '', contentBlocks: [''] }`
- `{ stats: [{ value: '', label: '' }] }`

#### ✅ Should restore:
- `{ bioText: 'Some text', profileImageUrl: '' }` (has one meaningful field)
- `{ photos: [{ id: '1', position_x: 100, ... }] }` (has array with data)
- `{ contentBlocks: ['Paragraph 1', ''] }` (has one non-empty string)
- `{ stats: [{ value: '10+', label: 'Projects' }] }` (has meaningful stat)

---

## Test Case 5: Tab Switch Preserves Data

### Steps:
1. Navigate to Photoshoots page
2. Make changes (move a photo)
3. Switch to another browser tab
4. Switch back to admin tab
5. Verify changes are still present

### Expected Result:
✅ Changes should still be visible
✅ Draft should remain in localStorage

---

## Test Case 6: Draft Clears on Publish

### Steps:
1. Navigate to Photoshoots or Artistic page
2. Make layout changes
3. Wait for draft to save
4. Click "Publish" button
5. Check localStorage

### Expected Result:
✅ Draft should be removed from localStorage
✅ "Draft restored" message should not appear on next reload

---

## Test Case 7: Draft Clears on Save

### Steps:
1. Navigate to any affected page
2. Make changes
3. Wait for draft to save
4. Click "Save" or "Save Changes" button
5. Wait for success message
6. Check localStorage

### Expected Result:
✅ Draft should be removed from localStorage
✅ "Draft restored" message should not appear on next reload

---

## Test Case 8: Discard Draft Works

### Steps:
1. Navigate to any affected page
2. Make changes
3. Wait for draft to save
4. Click "Discard" button on the DraftIndicator
5. Observe the form

### Expected Result:
✅ Form should reset to database/default values
✅ Draft should be removed from localStorage
✅ Success toast: "Draft discarded"

---

## Test Case 9: Navigation Warning (About Page only)

### Steps:
1. Navigate to About Page Management
2. Make changes
3. Wait for draft to save
4. Try to navigate away (close tab or go to another page)

### Expected Result:
✅ Browser should show "Leave site?" confirmation dialog
✅ Changes should be preserved if user cancels

---

## Test Case 10: Multiple Pages Have Separate Drafts

### Steps:
1. Navigate to Photoshoots page
2. Make changes (move photo to position X)
3. Navigate to Artistic page
4. Make different changes (move artwork to position Y)
5. Check localStorage - should have 2 different keys
6. Navigate back to Photoshoots page
7. Verify photo is still at position X

### Expected Result:
✅ Each page should have its own draft key
✅ Drafts should not interfere with each other
✅ Each page restores its own draft correctly

---

## Test Case 11: Dev Mode Console Warnings

### Steps:
1. Open browser DevTools → Console
2. Set NODE_ENV to development (if not already)
3. Load any affected page with an existing draft
4. Check console messages

### Expected Result:
✅ Valid draft: `[Draft] Restored valid draft for key: admin:draft:photoshoots`
✅ Invalid draft: `[Draft] Ignored empty/invalid draft for key: admin:draft:photoshoots`

---

## Visual Verification Checklist

For each page, verify:
- [ ] DraftIndicator appears in the correct position (fixed, top-right)
- [ ] DraftIndicator shows correct states:
  - [ ] "Saving draft..." (with spinner)
  - [ ] "Draft saved" (with checkmark, 2 seconds)
  - [ ] "Draft restored from previous session" (with checkmark and Discard button, 5 seconds)
- [ ] Discard button is styled correctly
- [ ] Component doesn't overlap with other UI elements
- [ ] Transitions are smooth

---

## localStorage Keys Reference

Check these keys in DevTools → Application → Local Storage:

```
admin:draft:photoshoots          → Photoshoots page layout
admin:draft:artistic             → Artistic work page layout
admin:draft:technical_about      → Technical About section form
admin:about_page:draft           → About page management form
```

---

## Debugging Tips

If draft is not restoring:
1. Check console for errors
2. Verify localStorage key exists and has data
3. Check if `enabled` prop is true in useFormPersistence
4. Verify `hasMeaningfulData()` returns true for the draft
5. Check if `onRestore` callback is properly wired

If draft is not saving:
1. Check if form data changes are triggering re-renders
2. Verify useMemo dependencies are correct
3. Check console for localStorage errors (quota exceeded?)
4. Ensure debounce timer is not being cleared too early

---

## Browser Compatibility

Test in:
- [ ] Chrome/Edge (Chromium)
- [ ] Firefox
- [ ] Safari (if available)

---

## Success Criteria

✅ All test cases pass
✅ No false "Draft restored" messages
✅ Empty drafts are automatically cleaned up
✅ Meaningful drafts are restored correctly
✅ Drafts clear on publish/save
✅ Multiple pages maintain separate drafts
✅ No console errors or warnings (except expected dev logs)
