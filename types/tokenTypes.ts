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
  // Transitional field: now represents the partner organisation id.
  partnerId?: string;
  organisationId?: string;
  organisationName?: string;
  organisationIsPartner?: boolean;
  organisationPartnerId?: string;
}
