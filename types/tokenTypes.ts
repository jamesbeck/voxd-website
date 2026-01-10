export interface IdTokenPayload {
  email: string;
  otpExpiry?: Date;
  failedAttempts?: number;
}

export interface AccessTokenPayload {
  adminUserId: string;
  email: string;
  name: string;
  superAdmin: boolean;
  partner: boolean;
  partnerId?: string;
  organisationId?: string;
}
