// TypeScript types for achievement data structure

/**
 * Achievement categories matching the database enum
 */
export type AchievementCategory = 
  | 'School'
  | 'College'
  | 'National'
  | 'Online Courses'
  | 'Extracurricular'
  | 'Internships';

/**
 * Complete achievement data structure matching the Supabase achievements table schema.
 */
export interface AchievementData {
  // Primary key
  id: string;
  
  // Core achievement information
  title: string;
  description: string | null;
  year: number | null;
  category: AchievementCategory;
  
  // Image information
  image_url: string;
  image_original_url: string | null;
  image_width: number | null;
  image_height: number | null;
  
  // Display settings
  display_order: number;
  is_published: boolean;
  external_link: string | null;
  
  // Timestamps
  created_at: string;
  updated_at: string;
}

/**
 * Form data for achievement creation/editing
 */
export interface AchievementFormData {
  title: string;
  year?: number;
  category: AchievementCategory;
  image_url: string;
  image_original_url?: string;
  image_width?: number;
  image_height?: number;
  display_order?: number;
  is_published?: boolean;
  external_link?: string;
}

/**
 * Project format used by AnimatedFolder component
 */
export interface AchievementProject {
  id: string;
  image: string;
  title: string;
  year?: number;
  externalLink?: string;
}

/**
 * Achievement folder structure
 */
export interface AchievementFolder {
  title: AchievementCategory;
  projects: AchievementProject[];
}

/**
 * Transform AchievementData to AchievementProject format
 */
export function transformToProject(achievement: AchievementData): AchievementProject {
  return {
    id: achievement.id,
    image: achievement.image_url,
    title: achievement.title,
    year: achievement.year || undefined,
    externalLink: achievement.external_link || undefined,
  };
}

/**
 * Group achievements by category and sort by display_order
 */
export function groupAchievementsByCategory(
  achievements: AchievementData[]
): AchievementFolder[] {
  const categories: AchievementCategory[] = [
    'School',
    'College',
    'National',
    'Online Courses',
    'Extracurricular',
    'Internships',
  ];

  return categories.map(category => {
    const categoryAchievements = achievements
      .filter(a => a.category === category)
      .sort((a, b) => a.display_order - b.display_order);

    return {
      title: category,
      projects: categoryAchievements.map(transformToProject),
    };
  });
}
