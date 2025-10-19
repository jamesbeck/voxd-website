declare namespace NodeJS {
  interface ProcessEnv {
    ID_TOKEN_SECRET: string;
    ACCESS_TOKEN_SECRET: string;
    ACCESS_TOKEN_LIFE_SEC: string;
    OTP_CODE_LIFE_SEC: string;
  }
}
