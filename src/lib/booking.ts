// Leo's own booking flow on top of the Google Calendar API, so the picker
// can match the site instead of embedding Google's white widget.
// Availability = working hours below minus whatever is busy on his calendar.

export const booking = {
  timeZone: "America/Sao_Paulo",
  // Mon–Fri, in Leo's local time. Overlaps the whole US business morning.
  days: [1, 2, 3, 4, 5],
  startHour: 9,
  endHour: 18,
  slotMinutes: 30,
  minNoticeHours: 12,
  horizonDays: 14,
} as const;

const calendarId = process.env.GOOGLE_CALENDAR_ID || "primary";

export const bookingConfigured = Boolean(
  process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET && process.env.GOOGLE_REFRESH_TOKEN,
);

async function accessToken() {
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      refresh_token: process.env.GOOGLE_REFRESH_TOKEN!,
      grant_type: "refresh_token",
    }),
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`google token ${res.status}`);
  return ((await res.json()) as { access_token: string }).access_token;
}

async function google<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = await accessToken();
  const res = await fetch(`https://www.googleapis.com/calendar/v3${path}`, {
    ...init,
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json", ...init.headers },
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`google calendar ${res.status}: ${await res.text()}`);
  return res.json() as Promise<T>;
}

// UTC offset of Leo's time zone at a given instant, in minutes (e.g. -180).
function zoneOffset(at: Date) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: booking.timeZone,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).formatToParts(at);
  const get = (type: string) => Number(parts.find((p) => p.type === type)!.value);
  const local = Date.UTC(get("year"), get("month") - 1, get("day"), get("hour"), get("minute"));
  return Math.round((local - at.getTime()) / 60000);
}

// Every candidate slot start in the booking window, as UTC instants.
function candidateSlots(now: Date) {
  const slots: Date[] = [];
  const earliest = now.getTime() + booking.minNoticeHours * 3600_000;
  const offset = zoneOffset(now);
  // Midnight today in Leo's zone.
  const localNow = new Date(now.getTime() + offset * 60000);
  const day0 = Date.UTC(localNow.getUTCFullYear(), localNow.getUTCMonth(), localNow.getUTCDate());

  for (let d = 0; d <= booking.horizonDays; d++) {
    const dayStart = new Date(day0 + d * 86400_000);
    if (!(booking.days as readonly number[]).includes(dayStart.getUTCDay())) continue;
    for (let m = booking.startHour * 60; m + booking.slotMinutes <= booking.endHour * 60; m += booking.slotMinutes) {
      const local = dayStart.getTime() + m * 60000;
      const utc = new Date(local - zoneOffset(new Date(local)) * 60000);
      if (utc.getTime() >= earliest) slots.push(utc);
    }
  }
  return slots;
}

type Busy = { start: string; end: string };

async function busyBetween(from: Date, to: Date) {
  const data = await google<{ calendars: Record<string, { busy: Busy[] }> }>("/freeBusy", {
    method: "POST",
    body: JSON.stringify({ timeMin: from.toISOString(), timeMax: to.toISOString(), items: [{ id: calendarId }] }),
  });
  return Object.values(data.calendars)[0]?.busy ?? [];
}

const overlaps = (start: Date, busy: Busy[]) => {
  const end = start.getTime() + booking.slotMinutes * 60000;
  return busy.some((b) => start.getTime() < Date.parse(b.end) && end > Date.parse(b.start));
};

export async function availableSlots() {
  const now = new Date();
  const slots = candidateSlots(now);
  if (slots.length === 0) return [];
  const busy = await busyBetween(slots[0], new Date(slots.at(-1)!.getTime() + booking.slotMinutes * 60000));
  return slots.filter((s) => !overlaps(s, busy)).map((s) => s.toISOString());
}

export type BookingRequest = { start: string; name: string; email: string; company?: string; note?: string };

export async function createBooking(req: BookingRequest) {
  const start = new Date(req.start);
  const valid = candidateSlots(new Date()).some((s) => s.getTime() === start.getTime());
  if (!valid) return { ok: false as const, reason: "invalid-slot" };

  const end = new Date(start.getTime() + booking.slotMinutes * 60000);
  if (overlaps(start, await busyBetween(start, end))) return { ok: false as const, reason: "taken" };

  const who = req.company ? `${req.name} (${req.company})` : req.name;
  const event = await google<{ hangoutLink?: string; htmlLink: string }>(
    `/calendars/${encodeURIComponent(calendarId)}/events?conferenceDataVersion=1&sendUpdates=all`,
    {
      method: "POST",
      body: JSON.stringify({
        summary: `Intro call: Leo Hemming <> ${who}`,
        description: [req.note, `Booked from the portfolio by ${req.name} <${req.email}>.`].filter(Boolean).join("\n\n"),
        start: { dateTime: start.toISOString() },
        end: { dateTime: end.toISOString() },
        attendees: [{ email: req.email, displayName: req.name }],
        conferenceData: {
          createRequest: { requestId: crypto.randomUUID(), conferenceSolutionKey: { type: "hangoutsMeet" } },
        },
        reminders: { useDefault: true },
      }),
    },
  );
  return { ok: true as const, meetUrl: event.hangoutLink ?? null };
}
