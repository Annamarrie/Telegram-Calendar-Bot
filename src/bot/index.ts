import TelegramBot, { Message } from "node-telegram-bot-api";
import { DataSource } from "typeorm";
import config from "../config";
import "../data";
import { dbOptions } from "../data";
import { Calendar, Reminder } from "../data/entities/Calendar";
import { createAuthClient, createCalendarApiClient } from "../util/oauth";
import addMinutes from "date-fns/addMinutes";
import addSeconds from "date-fns/addSeconds";
import {
  formatCalendarEvent,
  queryCalendarEvents,
  queryEventsList,
} from "../util/calendar";

const run = async () => {
  const dataSource = new DataSource(dbOptions);
  await dataSource.initialize();

  const tgBot = new TelegramBot(config.bot.token, { polling: true });
  tgBot.setMyCommands([
    { command: "/reminderlist", description: "reminders list" },
    { command: "/commandslist", description: "list of commands" },
    { command: "/eventslist", description: "List upcoming events" },
  ]);
  tgBot.onText(/\/start/, async (message: Message) => {
    const chatId = message.chat.id;
    tgBot.sendMessage(
      chatId,
      "Hello there, start by registering your calendar.To register your Google calendar with me, use /calendar google_calendar_id"
    );
  });
  tgBot.onText(/\/commandslist/, async (message: Message) => {
    const chatId = message.chat.id;
    tgBot.sendMessage(
      chatId,
      "/reminder time in mins \n /removereminder time in mins"
    );
  });

  tgBot.onText(/\/eventslist/, async (message: Message) => {
    const calendars = await dataSource.getRepository(Calendar).find();
    const chatId = message.chat.id;
    if (chatId) {
      for (const { chatId, googleCalendarId, refreshToken } of calendars) {
        const calendar = createCalendarApiClient(refreshToken);
        const events = await queryEventsList(calendar, googleCalendarId);
        events.map((event) => {
          tgBot.sendMessage(chatId, `${formatCalendarEvent(event)} `);
        });
      }
    } else {
      tgBot.sendMessage(chatId, "Calendar is not registered");
    }
  });

  tgBot.onText(/\/reminderlist/, async (message: Message) => {
    const reminders = await dataSource.getRepository(Reminder).find();
    console.log(reminders);
    const chatId = message.chat.id;
    if (reminders) {
      reminders.map((reminder) => {
        if (reminder.chatId == chatId) {
          tgBot.sendMessage(chatId, `⌛${reminder.reminder}`);
        }
      });
    } else {
      tgBot.sendMessage(chatId, "You don't have reminders");
    }
  });

  tgBot.onText(
    /\/removereminder\s+([^\s]+)/,
    async (message: Message, match: RegExpExecArray | null) => {
      const remindervalue = parseInt(match![1]);
      const repository = dataSource.getRepository(Reminder);
      const chatId = message.chat.id;
      if (isNaN(remindervalue)) {
        tgBot.sendMessage(chatId, "Please write right value");
      } else if (repository) {
        const reminder = new Reminder();
        reminder.reminder = remindervalue;
        reminder.chatId = chatId;
        repository.delete(reminder);
        tgBot.sendMessage(chatId, "Reminder has been removed");
      } else {
        tgBot.sendMessage(chatId, "You don't have that reminder");
      }
    }
  );
  tgBot.onText(
    /\/reminder\s+([^\s]+)/,
    async (message: Message, match: RegExpExecArray | null) => {
      let remindervalue: number;
      const chatId = message.chat.id;
      remindervalue = parseInt(match![1]);
      const repository = dataSource.getRepository(Reminder);
      const reminders = await dataSource.getRepository(Reminder).find();
      let isnew = true;
      if (isNaN(remindervalue)) {
        tgBot.sendMessage(chatId, "Please write right value");
      } else {
        reminders.map((reminder) => {
          if (
            reminders &&
            reminder.reminder == remindervalue &&
            chatId == reminder.chatId
          ) {
            tgBot.sendMessage(chatId, "Reminder already exists");
            isnew = false;
          }
        });
        if (isnew) {
          const reminder = new Reminder();
          reminder.reminder = remindervalue;
          reminder.chatId = chatId;
          repository.insert(reminder);
          tgBot.sendMessage(chatId, "Reminder has been added");
        }
      }
    }
  );

  tgBot.onText(
    /\/calendar\s+([^\s]+)/,
    async (message: Message, match: RegExpExecArray | null) => {
      const calendarId = match![1];
      const chatId = message.chat.id;

      const repository = dataSource.getRepository(Calendar);

      const chatCalendar = await repository.findOneBy({ chatId: chatId });

      if (chatCalendar && chatCalendar.googleCalendarId == calendarId) {
        tgBot.sendMessage(chatId, "Calendar already registered");
      } else {
        const authClient = createAuthClient();

        const url = authClient.generateAuthUrl({
          access_type: "offline",
          prompt: "consent",
          scope: ["https://www.googleapis.com/auth/calendar"],
          state: encodeURIComponent(JSON.stringify({ calendarId, chatId })),
        });

        tgBot.sendMessage(
          chatId,
          `<a href='${url}'>Click here</a> to allow this bot to access your calendar`,
          {
            parse_mode: "HTML",
          }
        );
      }
    }
  );

  setInterval(async () => {
    const calendars = await dataSource.getRepository(Calendar).find();
    const reminders = await dataSource.getRepository(Reminder).find();
    for (const { reminder, chatId } of reminders) {
      const chatIdofreminder = chatId;
      for (const { chatId, googleCalendarId, refreshToken } of calendars) {
        if (chatIdofreminder == chatId) {
          const calendar = createCalendarApiClient(refreshToken);
          const now = new Date();
          const from = addMinutes(now, reminder);
          const to = addSeconds(addMinutes(now, reminder), 1);
          const events = await queryCalendarEvents(
            calendar,
            googleCalendarId,
            from,
            to
          );
          let emails: any
          events.forEach((event) => {
           event.attendees!.map((email) => {
            emails = email.email
            })
            
            tgBot.sendMessage(
              chatId,
              `${formatCalendarEvent(
                event
              )} \n\n ⌛Time Remains: ${reminder} Min \n\n ${emails}`
            );
          });
        }
      }
    }
  }, 1000);
};

run();
