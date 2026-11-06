export interface LoginCredentials {
  emailOrUsername: string;
  password: string;
}

export interface LoginResponse {
  token?: string;
  requires2FA?: boolean;
  tempToken?: string;
  requiresVerification?: boolean;
  user?: {
    id?: string;
    email?: string;
    username?: string;
    emailVerified?: boolean;
  };
  error?: string;
  message?: string;
}

export interface RegisterFormData {
  email: string;
  username: string;
  firstName: string;
  lastName: string;
  password: string;
}

export interface RegisterResponse {
  token?: string;
  requiresVerification?: boolean;
  user?: {
    id?: string;
    email?: string;
    username?: string;
    emailVerified?: boolean;
  };
  error?: string;
  message?: string;
  details?: {
    fieldErrors?: Record<string, string[]>;
  };
}
