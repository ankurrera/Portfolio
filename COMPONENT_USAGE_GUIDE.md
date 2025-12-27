# Component Usage Guide

Quick reference for using the animated Testimonial and Project Showcase components.

## Project Showcase Component

### Basic Usage

```tsx
import { ProjectShowcase } from "@/components/ui/project-showcase"
import { TechnicalProject } from "@/types/technical"

// Define your projects
const projects: TechnicalProject[] = [
  {
    id: "1",
    title: "E-Commerce Platform",
    description: "A modern, responsive e-commerce solution with real-time inventory.",
    dev_year: "2024",
    status: "Live",
    languages: ["React", "TypeScript", "Node.js", "PostgreSQL"],
    github_link: "https://github.com/username/project",
    live_link: "https://myproject.com",
    thumbnail_url: null,
    display_order: 1,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  // Add more projects...
]

// Use in your component
export default function ProjectsPage() {
  return (
    <div className="min-h-screen bg-background">
      <ProjectShowcase projects={projects} />
    </div>
  )
}
```

### Loading from Supabase

```tsx
import { useState, useEffect } from 'react'
import { ProjectShowcase } from "@/components/ui/project-showcase"
import { TechnicalProject } from "@/types/technical"
import { supabase } from '@/integrations/supabase/client'
import { Loader2 } from 'lucide-react'

export default function ProjectsPage() {
  const [projects, setProjects] = useState<TechnicalProject[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadProjects()
  }, [])

  const loadProjects = async () => {
    try {
      const { data, error } = await supabase
        .from('technical_projects')
        .select('*')
        .order('display_order', { ascending: true })

      if (error) throw error

      // Parse languages from JSONB
      const parsedProjects = data.map(project => ({
        ...project,
        languages: Array.isArray(project.languages) 
          ? project.languages 
          : JSON.parse(project.languages as string)
      })) as TechnicalProject[]

      setProjects(parsedProjects)
    } catch (error) {
      console.error('Error loading projects:', error)
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (projects.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-muted-foreground">No projects available yet.</p>
      </div>
    )
  }

  return <ProjectShowcase projects={projects} />
}
```

### Project Data Structure

```typescript
interface TechnicalProject {
  id: string                    // Unique identifier
  title: string                 // Project name
  description: string           // Short description
  dev_year: string             // Year developed (e.g., "2024")
  status: string | null        // "Live", "In Development", etc.
  languages: string[]          // Array of technologies
  github_link: string | null   // GitHub repository URL
  live_link: string | null     // Live demo URL
  thumbnail_url: string | null // Project image (optional)
  display_order: number        // Order in showcase
  created_at: string          // ISO timestamp
  updated_at: string          // ISO timestamp
}
```

## Testimonial Component

### Basic Usage

```tsx
import { Testimonial } from "@/components/ui/design-testimonial"

// Uses default testimonials
export default function TestimonialsPage() {
  return (
    <div className="min-h-screen bg-background">
      <Testimonial />
    </div>
  )
}
```

### Custom Testimonials

```tsx
import { Testimonial } from "@/components/ui/design-testimonial"

const customTestimonials = [
  {
    quote: "This changed how we work forever.",
    author: "John Doe",
    role: "CEO",
    company: "TechCorp"
  },
  {
    quote: "Incredible attention to detail.",
    author: "Jane Smith",
    role: "Designer",
    company: "DesignStudio"
  }
]

export default function TestimonialsPage() {
  return <Testimonial testimonials={customTestimonials} />
}
```

### Testimonial Data Structure

```typescript
interface TestimonialItem {
  quote: string      // The testimonial text
  author: string     // Person's name
  role: string       // Job title
  company: string    // Company name
}
```

## Animation Features

Both components share these animation features:

### 1. Parallax Background Number
- Large index number (01, 02, 03...) in background
- Follows mouse movement for magnetic effect
- Creates depth and engagement

### 2. Text Reveal Animation
- Words animate in one by one
- 3D rotation effect (rotateX)
- Staggered timing for smooth reveal

### 3. Auto-Rotation
- Automatically cycles through items every 6 seconds
- Smooth transitions between items
- Resets on manual navigation

### 4. Interactive Navigation
- Previous/Next buttons
- Touch-friendly on mobile
- Smooth state transitions

### 5. Progress Indicator
- Vertical line showing current position
- Fills based on index in array
- Updates smoothly with transitions

## Styling & Customization

### Theme Integration
Components use Tailwind CSS theme tokens:

```css
bg-background      /* Background color */
text-foreground    /* Primary text color */
text-muted-foreground  /* Secondary text */
border-border      /* Border color */
bg-accent         /* Accent color for dots */
bg-success        /* Success state (Live status) */
bg-warning        /* Warning state (In Development) */
```

### Responsive Behavior

**Mobile (< 768px):**
- Simplified vertical layout
- Smaller text sizes
- Touch-optimized controls
- Hidden decorative elements

**Desktop (≥ 768px):**
- Full asymmetric layout
- Vertical text labels
- Large parallax numbers
- Enhanced hover effects

## Common Patterns

### Section with Header

```tsx
<section className="py-20 bg-background">
  <div className="max-w-7xl mx-auto px-4">
    <div className="mb-12">
      <h2 className="text-4xl font-bold mb-4">Featured Projects</h2>
      <p className="text-muted-foreground">
        A showcase of recent work and achievements
      </p>
    </div>
    
    <ProjectShowcase projects={projects} />
  </div>
</section>
```

### Multiple Sections

```tsx
<main>
  {/* Testimonials Section */}
  <section id="testimonials" className="py-20">
    <Testimonial testimonials={testimonials} />
  </section>
  
  {/* Projects Section */}
  <section id="projects" className="py-20">
    <ProjectShowcase projects={projects} />
  </section>
</main>
```

## Demo Pages

Test the components at these routes:

- **Project Showcase:** `/demo/project-showcase`
- **Live Integration:** See `MinimalProjects.tsx` on main portfolio page

## Performance Tips

1. **Lazy Load Images:** Use thumbnail_url only when needed
2. **Limit Items:** Keep arrays to 5-8 items for best performance
3. **Preload Data:** Load from Supabase before rendering
4. **Error Boundaries:** Wrap in error boundaries for graceful failures

## Troubleshooting

### Component Not Rendering
- Check that projects/testimonials array has items
- Verify framer-motion is installed: `npm list framer-motion`
- Check console for errors

### Animations Not Working
- Ensure framer-motion version is 12.23.26 or higher
- Verify CSS variables are defined in theme
- Check browser console for animation errors

### Supabase Connection Issues
- Verify .env file has correct VITE_SUPABASE_* variables
- Check Supabase project is active
- Verify table schema matches TechnicalProject type

## Need Help?

See `COMPONENT_INTEGRATION_SUMMARY.md` for complete technical documentation.
