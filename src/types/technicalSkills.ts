// Type definitions for Technical Skills
export interface TechnicalSkill {
  id: string;
  category: string;
  skills: string[];
  order_index: number;
  is_visible: boolean;
  created_at: string;
}

export interface TechnicalSkillInsert {
  category: string;
  skills: string[];
  order_index?: number;
  is_visible?: boolean;
}

export interface TechnicalSkillUpdate {
  category?: string;
  skills?: string[];
  order_index?: number;
  is_visible?: boolean;
}
