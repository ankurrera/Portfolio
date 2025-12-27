export interface Experience {
  id: string;
  role_title: string;
  company_name: string;
  employment_type?: string | null; // Optional: Full-time / Freelance / Contract
  start_date: string; // Format: MM/YYYY or YYYY
  end_date?: string | null; // Format: MM/YYYY or YYYY, NULL for "Present"
  is_current: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
}
