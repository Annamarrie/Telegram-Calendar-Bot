import "reflect-metadata";
import { DataSourceOptions } from "typeorm";
import { Calendar, Reminder } from "./entities/Calendar";

export const dbOptions: DataSourceOptions = {
  url: process.env.DATABASE_URL,
  type: "postgres",
  logging: true,
  synchronize: true,
  ssl: {
    rejectUnauthorized: false,
  },
  entities: [Calendar, Reminder],
};
