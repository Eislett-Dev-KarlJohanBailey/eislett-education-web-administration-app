export interface FeatureFlagRule {
  type: "country" | "student" | "teacher" | "user_type" | "role" | "percentage" | "always_on" | "always_off" | "cidr" | "school" | "grade";
  value?: any;
  rollout?: number;
}

export interface FeatureFlag {
  id: string;
  key: string;
  enabled: boolean;
  rules?: FeatureFlagRule[];
  description?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateFeatureFlagRequest {
  key: string;
  enabled: boolean;
  rules?: FeatureFlagRule[];
  description?: string;
}

export interface UpdateFeatureFlagRequest {
  key?: string;
  enabled?: boolean;
  rules?: FeatureFlagRule[];
  description?: string;
}

