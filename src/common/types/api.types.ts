export type APIResponse = {
  statusCode?: number;
  size?: number;
  message?: string;
  data?: object;
  timestamp?: string;
  accessToken?: string;
  refreshToken?: string;
  passwordResetToken?: string;
  setupToken?: string;
  nextCursor?: string | null;
};

export type RefreshTokenPayload = {
  id: number;
  sessionId: string;
};

export type QueryString = {
  page?: string;
  sort?: string;
  limit?: string;
  fields?: string;
} & Record<string, any>;
