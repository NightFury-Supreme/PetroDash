export interface LoginCredentials {
  emailOrUsername: string;
  password: string;
}

export interface LoginResponse {
  token?: string;
  requires2FA?: boolean;
  tempToken?: string;
  error?: string;
}

export interface RegisterFormData {
  email: string;
  username: string;
  firstName: string;
  lastName: string;
  password: string;
}

export interface VerifyStatusData {
  email: string;
  loginMethod: string;
  tfaEnabled: boolean;
  emailVerified: boolean;
}
