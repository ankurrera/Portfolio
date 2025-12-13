import PortfolioHeader from "@/components/PortfolioHeader";
import PortfolioFooter from "@/components/PortfolioFooter";
import PageLayout from "@/components/PageLayout";
import SEO from "@/components/SEO";
import { AnimatedFolder } from "@/components/ui/3d-folder";

// Sample data for the 5 achievement categories
const achievementFolders = [
  {
    title: "School",
    projects: [
      { 
        id: "school-1", 
        image: "https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=400&h=600&fit=crop", 
        title: "Academic Excellence Award" 
      },
      { 
        id: "school-2", 
        image: "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=400&h=600&fit=crop", 
        title: "Science Fair Winner" 
      },
      { 
        id: "school-3", 
        image: "https://images.unsplash.com/photo-1546410531-bb4caa6b424d?w=400&h=600&fit=crop", 
        title: "Math Olympiad Medal" 
      },
    ]
  },
  {
    title: "College",
    projects: [
      { 
        id: "college-1", 
        image: "https://images.unsplash.com/photo-1541339907198-e08756dedf3f?w=400&h=600&fit=crop", 
        title: "Dean's List Honor" 
      },
      { 
        id: "college-2", 
        image: "https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=400&h=600&fit=crop", 
        title: "Research Publication" 
      },
      { 
        id: "college-3", 
        image: "https://images.unsplash.com/photo-1567168539593-59673ababaae?w=400&h=600&fit=crop", 
        title: "Leadership Award" 
      },
    ]
  },
  {
    title: "National",
    projects: [
      { 
        id: "national-1", 
        image: "https://images.unsplash.com/photo-1551818255-e6e10975bc17?w=400&h=600&fit=crop", 
        title: "National Competition Winner" 
      },
      { 
        id: "national-2", 
        image: "https://images.unsplash.com/photo-1604537466608-109fa2f16c3b?w=400&h=600&fit=crop", 
        title: "Innovation Challenge" 
      },
      { 
        id: "national-3", 
        image: "https://images.unsplash.com/photo-1557426272-fc759fdf7a8d?w=400&h=600&fit=crop", 
        title: "Outstanding Achievement" 
      },
    ]
  },
  {
    title: "Online Courses",
    projects: [
      { 
        id: "online-1", 
        image: "https://images.unsplash.com/photo-1501504905252-473c47e087f8?w=400&h=600&fit=crop", 
        title: "Full Stack Certification" 
      },
      { 
        id: "online-2", 
        image: "https://images.unsplash.com/photo-1488190211105-8b0e65b80b4e?w=400&h=600&fit=crop", 
        title: "Machine Learning Certificate" 
      },
      { 
        id: "online-3", 
        image: "https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=400&h=600&fit=crop", 
        title: "Cloud Architecture" 
      },
    ]
  },
  {
    title: "Extra Curricular",
    projects: [
      { 
        id: "extra-1", 
        image: "https://images.unsplash.com/photo-1517457373958-b7bdd4587205?w=400&h=600&fit=crop", 
        title: "Sports Championship" 
      },
      { 
        id: "extra-2", 
        image: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=400&h=600&fit=crop", 
        title: "Music Performance Award" 
      },
      { 
        id: "extra-3", 
        image: "https://images.unsplash.com/photo-1460661419201-fd4cecdf8a8b?w=400&h=600&fit=crop", 
        title: "Community Service" 
      },
    ]
  },
];

const Achievement = () => {
  return (
    <PageLayout>
      <SEO 
        title="Achievement | Raya"
        description="Awards, recognitions, and notable achievements across various categories including school, college, national competitions, online courses, and extra-curricular activities."
        canonicalUrl="/achievement"
      />
      <PortfolioHeader activeCategory="ACHIEVEMENT" />
      <main id="main-content" className="min-h-screen pt-24 px-4 md:px-8 pb-16">
        <div className="max-w-[1400px] mx-auto">
          <h1 className="text-3xl md:text-4xl font-light tracking-wide mb-4 text-center">
            Achievements
          </h1>
          <p className="text-muted-foreground text-center max-w-2xl mx-auto mb-12">
            Explore achievements across different categories. Hover over each folder to preview certificates.
          </p>
          
          {/* Folder Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6 items-start justify-items-center">
            {achievementFolders.map((folder) => (
              <AnimatedFolder 
                key={folder.title} 
                title={folder.title} 
                projects={folder.projects}
                className="w-full max-w-[320px]"
              />
            ))}
          </div>
        </div>
      </main>
      <PortfolioFooter />
    </PageLayout>
  );
};

export default Achievement;
