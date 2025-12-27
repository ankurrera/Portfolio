export interface Service {
  id: string;
  title: string;
  description: string;
}

export interface Education {
  id: string;
  logo_url: string;
  institution_name: string;
  degree: string;
  start_year: string;
  end_year: string;
  display_order: number;
}

export interface Experience {
  id: string;
  logo_url: string;
  company_name: string;
  role: string;
  start_date: string; // format: "YYYY-MM"
  end_date: string | null; // format: "YYYY-MM" or null for current
  display_order: number;
}

export interface AboutPage {
  id: string;
  profile_image_url: string | null;
  bio_text: string | null;
  services: Service[] | any; // JSONB from database can be any JSON
  created_at: string;
  updated_at: string;
}

export interface AboutPageInsert {
  profile_image_url?: string | null;
  bio_text?: string | null;
  services?: Service[] | any;
}

export interface AboutPageUpdate {
  id: string;
  profile_image_url?: string | null;
  bio_text?: string | null;
  services?: Service[] | any;
}
