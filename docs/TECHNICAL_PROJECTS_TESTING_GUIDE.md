# Technical Projects System - Visual Testing Guide

## Testing the Implementation

This guide provides step-by-step instructions for testing all the changes made to the Technical Projects system.

## Prerequisites

1. Ensure you have a Supabase project set up
2. Run the database migration: `20251228142200_add_progress_to_technical_projects.sql`
3. Have admin access to the dashboard

## Test Scenarios

### Scenario 1: Create New Project with Live Status

**Steps:**
1. Navigate to Admin Dashboard → Technical Projects
2. Click "New Project" button
3. Fill in project details:
   - Title: "AI Analytics Platform"
   - Description: "Real-time data visualization with ML insights"
   - Dev Year: "2024"
   - Status: Select "Live" from dropdown
   - Notice: Progress automatically set to 100% (disabled)
4. Add some languages: React, TypeScript, Python
5. Click "Create Project"
6. Verify project appears in list with "Live" status and "Progress: 100%"
7. Navigate to public page (/technical/projects)
8. Verify:
   - Rank number "01" is separate from title
   - Project card is perfectly aligned
   - Progress bar shows 100% in green
   - Percentage "100%" is displayed

### Scenario 2: Create Project In Development

**Steps:**
1. Create new project with status "In Development"
2. Set progress to 65%
3. Save project
4. Check admin list shows "Progress: 65%"
5. Check public page shows:
   - Progress bar at 65% width
   - Percentage "65%" displayed
   - Green progress bar (not red)

### Scenario 3: Create Paused Project

**Steps:**
1. Create new project with status "Paused"
2. Set progress to 40%
3. Save project
4. Check public page shows:
   - Progress bar at 40% width
   - Red/destructive colored progress bar
   - Percentage "40%" displayed

### Scenario 4: Edit Existing Project Status

**Steps:**
1. Edit a project currently "In Development"
2. Change status to "Live"
3. Notice progress automatically changes to 100% and input is disabled
4. Save changes
5. Verify on public page: progress shows 100%

### Scenario 5: Alignment Test - Multiple Projects

**Steps:**
1. Create 3-4 projects with varying description lengths:
   - Short description (1 line)
   - Medium description (2 lines)
   - Long description (clipped at 2 lines)
2. Navigate to public page
3. Verify:
   - All rank numbers align vertically
   - All progress bars align vertically
   - All action icons (GitHub/Live) align vertically
   - No overlap between rank numbers and titles
   - Equal spacing between columns

### Scenario 6: Backward Compatibility

**Steps:**
1. Identify projects created before this update (progress = NULL)
2. View them on public page
3. Verify they show "0%" progress without errors
4. Edit one of these projects
5. Set progress to 50%
6. Save and verify it displays correctly

### Scenario 7: Edge Cases

**Test invalid progress values:**
1. Create/edit project
2. Try entering progress values:
   - Negative (-10): Should be clamped to 0
   - Over 100 (150): Should be clamped to 100
   - Decimal (50.5): Should be rounded/handled
3. Verify all values are properly constrained

### Scenario 8: Responsive Layout

**Steps:**
1. View public page on different screen sizes:
   - Desktop (1920px): 3-column grid layout
   - Tablet (768px): Verify layout adapts
   - Mobile (375px): Verify mobile layout
2. Check alignment at each breakpoint
3. Verify no horizontal scrolling
4. Verify progress bars are visible and properly sized

### Scenario 9: Status Dropdown

**Steps:**
1. Create new project
2. Click status dropdown
3. Verify all 4 options are present:
   - Live
   - In Development
   - Testing
   - Paused
4. Select each option and verify helper text changes appropriately
5. Verify form submission works with each status

### Scenario 10: Multiple Projects Hover Effect

**Steps:**
1. Have 5+ projects on public page
2. Hover over each project
3. Verify:
   - Background changes smoothly
   - Title color transitions
   - Left indicator bar appears
   - No layout shift occurs
   - Progress bars remain aligned

## Expected Visual Outcomes

### Admin Dashboard - Form

**Status Dropdown:**
```
┌─────────────────────────┐
│ Status *                │
│ ┌─────────────────────┐ │
│ │ Live             ▼ │ │
│ └─────────────────────┘ │
│                         │
│ Options:                │
│ - Live                  │
│ - In Development        │
│ - Testing               │
│ - Paused                │
└─────────────────────────┘
```

**Progress Field (Live):**
```
┌─────────────────────────┐
│ Project Progress (%)    │
│ ┌─────────────────────┐ │
│ │ 100           [disabled] │
│ └─────────────────────┘ │
│ Progress is automatically│
│ set to 100% for Live    │
│ projects                │
└─────────────────────────┘
```

**Progress Field (In Development):**
```
┌─────────────────────────┐
│ Project Progress (%)    │
│ ┌─────────────────────┐ │
│ │ 65                  │ │
│ └─────────────────────┘ │
└─────────────────────────┘
```

### Public Page - Project Card Layout

```
┌──────────────────────────────────────────────────────────────┐
│ [Bar] 01  PROJECT TITLE                [█████     ] 65%  ⚙ 🔗│
│            Short description text...                         │
│            [React] [TypeScript]                              │
│            ● In Development  2024                            │
└──────────────────────────────────────────────────────────────┘
│ Column:  Rank    Content               Progress     Icons    │
│ Width:   Auto    Flex(1fr)            200px        Auto      │
```

### Status Badge Colors

- **Live**: Green dot (bg-success)
- **In Development**: Yellow dot (bg-warning)  
- **Testing**: Blue dot (bg-blue-500)
- **Paused**: Red dot (bg-destructive)

### Progress Bar Colors

- **Normal (Live/In Development/Testing)**: Green gradient (from-accent/80 to-accent)
- **Paused**: Red gradient (from-destructive/80 to-destructive)

## Common Issues to Check

1. **Rank overlap**: Ensure rank numbers never overlap titles at any zoom level
2. **Column misalignment**: All progress bars must align vertically
3. **Progress not showing**: Check for null values, default to 0
4. **Status dropdown not saving**: Verify form submission includes status
5. **Progress not auto-updating**: Check useEffect for Live status
6. **Mobile layout broken**: Test responsive breakpoints
7. **Build errors**: Run `npm run build` and check for TypeScript errors

## Performance Checks

1. Page load time should not increase significantly
2. Hover effects should be smooth (60fps)
3. Progress bar animations should be fluid
4. No layout shifts when projects load

## Accessibility Checks

1. Status dropdown is keyboard navigable
2. Progress percentage is readable (adequate contrast)
3. Color is not the only indicator (also has text/percentage)
4. Focus states are visible on interactive elements

## Browser Testing Checklist

- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (latest)
- [ ] Mobile Safari (iOS)
- [ ] Mobile Chrome (Android)

## Sign-off Checklist

- [ ] All new features work as specified
- [ ] No regressions in existing functionality
- [ ] UI alignment is perfect on all screen sizes
- [ ] Progress system works correctly for all statuses
- [ ] Admin dashboard is intuitive to use
- [ ] Public page looks professional and polished
- [ ] Documentation is complete and accurate
- [ ] Code builds without errors or warnings (excluding chunk size)
- [ ] Migration runs successfully
- [ ] Backward compatibility confirmed

## Screenshots to Capture

1. Admin form with status dropdown open
2. Admin form showing Live status (progress disabled)
3. Admin form showing In Development (progress enabled)
4. Admin project list showing progress values
5. Public page showing aligned projects (desktop)
6. Public page showing progress bars at different values
7. Public page showing Paused project with red bar
8. Mobile view of public page
9. Hover state on public page project

## Notes

- The implementation prioritizes minimal changes and backward compatibility
- All changes are additive (no data loss)
- The progress field is nullable to support existing projects
- The UI maintains the existing design language
- Grid layout ensures perfect alignment regardless of content
