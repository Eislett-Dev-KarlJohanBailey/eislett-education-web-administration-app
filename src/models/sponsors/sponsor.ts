export interface SponsorTargetingRule {
  type: "country" | "student" | "teacher" | "cidr" | "school" | "grade" | "user_type";
  value?: any;
  rollout?: number;
}

export interface Sponsor {
  id: string;
  title: string;
  description: string;
  logoUrl: string;
  logoAlt: string;
  websiteUrl: string;
  rules?: SponsorTargetingRule[];
  timePeriod?: {
    start: string;
    end: string;
  };
  active: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateSponsorRequest {
  logo: File;
  title: string;
  description: string;
  logoAlt: string;
  websiteUrl: string;
  rules?: string; // JSON array
  timePeriodStart?: string;
  timePeriodEnd?: string;
  active?: boolean;
}

export interface UpdateSponsorRequest {
  title?: string;
  description?: string;
  logoUrl?: string;
  logoAlt?: string;
  websiteUrl?: string;
  rules?: SponsorTargetingRule[];
  timePeriod?: {
    start: string;
    end: string;
  };
  active?: boolean;
}

