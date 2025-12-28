export type SocialLinkType = 'resume' | 'github' | 'linkedin' | 'twitter' | 'telegram';

export interface SocialLink {
  id: string;
  link_type: SocialLinkType;
  url: string;
  is_visible: boolean;
  display_order: number;
  created_at?: string;
  updated_at?: string;
}

export interface SocialLinkInsert {
  link_type: SocialLinkType;
  url: string;
  is_visible?: boolean;
  display_order?: number;
}

export interface SocialLinkUpdate {
  id: string;
  url?: string;
  is_visible?: boolean;
  display_order?: number;
}

export interface ResumeDownloadLog {
  id?: string;
  user_agent?: string;
  referrer?: string;
  downloaded_at?: string;
}

export interface ResumeAnalytics {
  total_downloads: number;
  downloads_today: number;
  downloads_this_week: number;
  downloads_this_month: number;
  recent_logs: ResumeDownloadLog[];
}
