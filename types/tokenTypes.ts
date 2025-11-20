export interface IdTokenPayload {
  email: string;
  otpExpiry?: Date;
  failedAttempts?: number;
}

export interface AccessTokenPayload {
  adminUserId: string;
  email: string;
  name: string;
  admin: boolean;
  partner: boolean;
  partnerId?: string;
}
