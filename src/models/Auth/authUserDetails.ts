export interface Resource {
  resource: string;
}

export interface AuthUserDetails {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  hashedPassword?: string;
  salt?: string;
  confirmed: boolean;
  role: string;
  resources?: Resource[];
  createdAt: string;
  // Legacy fields (for backward compatibility)
  hashPassword?: string;
  deactivated?: boolean;
  confirmation?: string;
  expiresAt?: string;
  code?: string;
  displayName?: string;
  coins?: number;
  grade?: number;
  dateOfBirth?: string;
  schoolId?: number;
  countryId?: number;
}