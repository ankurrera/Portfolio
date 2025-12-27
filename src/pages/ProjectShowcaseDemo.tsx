import { ProjectShowcase } from "@/components/ui/project-showcase"
import { TechnicalProject } from "@/types/technical"

const sampleProjects: TechnicalProject[] = [
  {
    id: "1",
    title: "E-Commerce Platform",
    description: "A modern, responsive e-commerce solution with real-time inventory and payment integration.",
    dev_year: "2024",
    status: "Live",
    languages: ["React", "TypeScript", "Node.js", "PostgreSQL"],
    github_link: "https://github.com",
    live_link: "https://example.com",
    thumbnail_url: null,
    display_order: 1,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: "2",
    title: "AI Content Generator",
    description: "Intelligent content creation tool powered by machine learning and natural language processing.",
    dev_year: "2024",
    status: "In Development",
    languages: ["Python", "FastAPI", "TensorFlow", "React"],
    github_link: "https://github.com",
    live_link: null,
    thumbnail_url: null,
    display_order: 2,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: "3",
    title: "Portfolio CMS",
    description: "Customizable content management system built for creative professionals and agencies.",
    dev_year: "2023",
    status: "Live",
    languages: ["Next.js", "Supabase", "Tailwind", "Framer Motion"],
    github_link: "https://github.com",
    live_link: "https://example.com",
    thumbnail_url: null,
    display_order: 3,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
]

export default function ProjectShowcaseDemo() {
  return (
    <div className="min-h-screen bg-background">
      <div className="py-20">
        <div className="max-w-7xl mx-auto px-4 mb-12">
          <h1 className="text-4xl font-bold mb-4">Project Showcase Demo</h1>
          <p className="text-muted-foreground">
            Interactive animated showcase for technical projects using framer-motion
          </p>
        </div>
        
        <ProjectShowcase projects={sampleProjects} />
      </div>
    </div>
  )
}
