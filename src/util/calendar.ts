import { calendar_v3 } from "googleapis";
import formatRFC3339 from "date-fns/formatRFC3339";
import parse from "date-fns/parse";
import parseISO from "date-fns/parseISO";
import startOfDay from "date-fns/startOfDay";
import endOfDay from "date-fns/endOfDay";

const convertToDate = (
  calendarTime: calendar_v3.Schema$EventDateTime
): Date => {
  if (calendarTime.date) {
    return parse(calendarTime.date, "yyyy-mm-dd", new Date());
  } else {
    return parseISO(calendarTime.dateTime!);
  }
};
export const queryEventsList = async (
  calendar: calendar_v3.Calendar,
  calendarId: string
): Promise<calendar_v3.Schema$Event[]> => {
  const now = new Date();
  const timeMin = formatRFC3339(startOfDay(now));

  const queryResults = await calendar.events.list({
    calendarId: calendarId,
    singleEvents: true,
    timeMin: timeMin,
    maxResults: 10,
    orderBy: "startTime",
  });

  const eventsInRoundedRange = queryResults.data.items ?? [];
  return eventsInRoundedRange;
};
function getMonthName(monthNumber: number) {
  const date = new Date();
  date.setMonth(monthNumber - 1);

  return date.toLocaleString("en-US", { month: "short" });
}
export const formatCalendarEvent = (event: calendar_v3.Schema$Event) => {
  const start = event.start!.dateTime || event.start!.date || " ";
  const eventdescription = event.description;
  const eventlocation = event.location;
  const eventtimezone = event.start?.timeZone;
  const dateemoji = "📅";
  const timeemoji = "🕧";
  const locationemoji = "📍";
  const descriptionemoji = "📃";
  const eventemoji = "🧧";
  const timecut = start.substring(start.indexOf("T") + 1);
  const time = timecut.substring(0, timecut.indexOf("+"));
  const data = start.substring(0, start.indexOf("T"));
  const eventyear = data.substring(0, data.indexOf("-"));
  const eventmonthfirst = data.substring(data.indexOf("-") + 1);
  const eventday = eventmonthfirst.substring(eventmonthfirst.indexOf("-") + 1);
  const eventmonth = eventmonthfirst.substring(0, eventmonthfirst.indexOf("-"));
  return `${dateemoji} Date: ${eventyear}/${getMonthName(
    parseInt(eventmonth)
  )}/${eventday} \n\n${timeemoji} Time: ${time} ${eventtimezone} \n\n${eventemoji} Event: ${
    event.summary
  } \n\n${descriptionemoji} Description: ${eventdescription} \n\n${locationemoji} Location: ${eventlocation}`;
};

export const queryCalendarEvents = async (
  calendar: calendar_v3.Calendar,
  calendarId: string,
  from: Date,
  to: Date
): Promise<calendar_v3.Schema$Event[]> => {
  const timeMin = formatRFC3339(startOfDay(from));
  const timeMax = formatRFC3339(endOfDay(to));

  const queryResults = await calendar.events.list({
    calendarId: calendarId,
    timeMin: timeMin,
    timeMax: timeMax,
    singleEvents: true,
    orderBy: "startTime",
  });

  const eventsInRoundedRange = queryResults.data.items ?? [];

  const eventsInRange = eventsInRoundedRange.filter(
    (event) =>
      convertToDate(event.start!) >= from && convertToDate(event.start!) <= to
  );

  return eventsInRange;
};
