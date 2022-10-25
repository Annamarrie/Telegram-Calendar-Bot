import { OAuth2Client } from "google-auth-library";
import { calendar_v3, google } from "googleapis";
import config from "../config";

const authClientCache = new Map<string, OAuth2Client>();

export const createAuthClient = (refreshToken?: string): OAuth2Client => {
  if (refreshToken) {
    if (authClientCache.has(refreshToken)) {
      return authClientCache.get(refreshToken)!;
    }
  }

  const authClient = new google.auth.OAuth2(
    config.googleApi.oAuth.clientId,
    config.googleApi.oAuth.clientSecret,
    config.googleApi.oAuth.redirectUrl
  );

  if (refreshToken) {
    authClient.setCredentials({ refresh_token: refreshToken });
    authClientCache.set(refreshToken, authClient);
  }

  return authClient;
};

export const createCalendarApiClient = (
  refreshToken: string
): calendar_v3.Calendar => {
  const authClient = createAuthClient(refreshToken);
  return google.calendar({ version: "v3", auth: authClient });
};
