export type APIResponse = {
  statusCode?: number;
  size?: number;
  message?: string;
  data?: object;
  timestamp?: string;
  accessToken?: string;
  refreshToken?: string;
  passwordResetToken?: string;
};

export type RefreshTokenPayload = {
  id: number;
  sessionId: string;
};
