export interface IdTokenPayload {
  email: string;
  otpExpiry?: Date;
  failedAttempts?: number;
}

export interface AccessTokenPayload {
  userId: string;
  email: string;
  name: string;
  admin: boolean;
  partner: boolean;
  partnerId?: string;
}
