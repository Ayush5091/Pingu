// Sample data for the public /demo page: a second-year student partway up the path.
import { computeJourney, type ActivityItem } from "./journey";

const daysAgo = (n: number, now: Date) => new Date(now.getTime() - n * 86400000).toISOString();
const hoursFromNow = (n: number, now: Date) => new Date(now.getTime() + n * 3600000).toISOString();

export function buildDemo(now = new Date()) {
  const items: ActivityItem[] = [
    { id: "d1", title: "Freshers Cultural Night", category: "cultural", points: 4, date: daysAgo(400, now), source: "event" },
    { id: "d2", title: "IEEE Student Branch Membership", category: "professional", points: 3, date: daysAgo(380, now), source: "activity" },
    { id: "d3", title: "Annual Athletics Day", category: "sports", points: 5, date: daysAgo(330, now), source: "event" },
    { id: "d4", title: "NSS Blood Donation Camp", category: "community service", points: 6, date: daysAgo(300, now), source: "event" },
    { id: "d5", title: "Campus Tree Plantation Drive", category: "community service", points: 6, date: daysAgo(260, now), source: "event" },
    { id: "d6", title: "Weekend Volunteering at Seva Ashram", category: "community service", points: 5, date: daysAgo(200, now), source: "activity" },
    { id: "d7", title: "Intro to Git Workshop", category: "technical", points: 3, date: daysAgo(150, now), source: "event" },
    { id: "d8", title: "Smart India Hackathon (Internal Round)", category: "technical", points: 10, date: daysAgo(20, now), source: "event" },
    { id: "d9", title: "NPTEL: Programming in Python", category: "professional", points: 4, date: daysAgo(9, now), source: "activity" },
  ];

  const journey = computeJourney({
    totalPoints: items.reduce((s, i) => s + i.points, 0),
    semester: 3,
    items,
    activityDates: [daysAgo(1, now), daysAgo(9, now), daysAgo(15, now), daysAgo(20, now)],
    now,
  });

  const events = [
    { id: 901, name: "Open Source Sprint", category: "technical", points: 5, location_name: "CS Block Lab 3", start_time: hoursFromNow(-1, now), end_time: hoursFromNow(2, now), is_ongoing: true, is_upcoming: false },
    { id: 902, name: "Lake Clean-up Drive", category: "community service", points: 8, location_name: "Hebbal Lake", start_time: hoursFromNow(26, now), end_time: hoursFromNow(30, now), is_ongoing: false, is_upcoming: true },
    { id: 903, name: "Inter-college Football Trials", category: "sports", points: 5, location_name: "Main Ground", start_time: hoursFromNow(50, now), end_time: hoursFromNow(53, now), is_ongoing: false, is_upcoming: true },
  ];

  return {
    student: { name: "Aditi Rao", usn: "DEMO", semester: 3 },
    journey,
    pending: 1,
    events,
  };
}
