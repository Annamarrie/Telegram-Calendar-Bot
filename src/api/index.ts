import express, { Express, Request, Response } from "express";
import { google } from "googleapis";
import { DataSource } from "typeorm";
import config from "../config";
import { dbOptions } from "../data";
import { Calendar } from "../data/entities/Calendar";

const run = async () => {
  const dataSource = new DataSource(dbOptions);

  await dataSource.initialize();

  const port = process.env.PORT || 8000;

  const app: Express = express();

  app.get("/api/oauthCallback", async (req: Request, res: Response) => {
    const authCode = req.query.code;
    const state = req.query.state;

    if (authCode && state) {
      const authClient = new google.auth.OAuth2(
        config.googleApi.oAuth.clientId,
        config.googleApi.oAuth.clientSecret,
        config.googleApi.oAuth.redirectUrl
      );

      const tokenResponse = await authClient.getToken(authCode as string);
      const refreshToken = tokenResponse.tokens.refresh_token!;
      const chatCalendar = JSON.parse(decodeURIComponent(state as string));

      const repository = dataSource.getRepository(Calendar);
      const calendar = new Calendar();
      calendar.chatId = chatCalendar.chatId;
      calendar.googleCalendarId = chatCalendar.calendarId;
      calendar.refreshToken = refreshToken;

      await repository.save(calendar);
      res.send("success");
    } else {
      res.send("Auth code and state missing");
    }
  });

  app.listen(port, () => {
    console.log(`Example app listening on port ${port}`);
  });
};

run();
