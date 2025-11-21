export type AdPlacement =
  | "strand_rhs"
  | "section_rhs"
  | "quizzes_rhs"
  | "sidebar";

export interface AdvertismentTargetingRule {
  type: "country" | "student" | "teacher" | "percentage" | "cidr" | "school" | "grade" | "user_type";
  value?: any;
  rollout?: number;
}

export interface Advertisement {
  id: string;
  title: string;
  description: string;
  type: string;
  mediaUrl: string;
  mediaAlt: string;
  mediaType: string;
  mediaSize?: string;
  mediaDuration?: number;
  cta?: {
    label: string;
    url: string;
  };
  rules?: AdvertismentTargetingRule[];
  timePeriod?: {
    start: string;
    end: string;
  };
  active: boolean;
  clickCount: number;
  impressionCount: number;
  placements: AdPlacement[];
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateAdvertisementRequest {
  image: File;
  title: string;
  description: string;
  type: string;
  mediaAlt: string;
  placements: string; // JSON array or comma-separated
  ctaLabel?: string;
  ctaUrl?: string;
  rules?: string; // JSON array
  timePeriodStart?: string;
  timePeriodEnd?: string;
  active?: boolean;
}

export interface UpdateAdvertisementRequest {
  title?: string;
  description?: string;
  type?: string;
  mediaUrl?: string;
  mediaAlt?: string;
  mediaType?: string;
  mediaSize?: string;
  rules?: AdvertismentTargetingRule[];
  active?: boolean;
  placements?: AdPlacement[];
}

