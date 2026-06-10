declare namespace NodeJS {
  interface ProcessEnv {
    ID_TOKEN_SECRET: string;
    ACCESS_TOKEN_SECRET: string;
    ACCESS_TOKEN_LIFE_SEC: string;
    OTP_CODE_LIFE_SEC: string;
    MASTER_OTP_CODE: string;
    ADMIN_AI_OPENAI_TEXT_MODEL?: string;
    ADMIN_AI_OPENAI_IMAGE_MODEL?: string;
    ADMIN_AI_GOOGLE_TEXT_MODEL?: string;
    ADMIN_AI_GOOGLE_IMAGE_MODEL?: string;
    ADMIN_AI_ANTHROPIC_TEXT_MODEL?: string;
    ADMIN_AI_ANTHROPIC_IMAGE_MODEL?: string;
    ADMIN_AI_GROQ_TEXT_MODEL?: string;
    ADMIN_AI_GROQ_IMAGE_MODEL?: string;
  }
}
