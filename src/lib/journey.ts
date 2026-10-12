// SPARK Journey: the gamified 4-year path.
//
// Everything here is derived from records SPARK already stores (verified event
// check-ins and approved activity submissions), so no extra tables are needed.
// This module is pure and runs on both the server (/api/journey) and the client
// (the public /demo page).

export type LevelIcon =
  | "flag" | "users" | "trophy" | "music" | "heart" | "wrench" | "leaf"
  | "code" | "award" | "megaphone" | "swords" | "home" | "handshake" | "landmark"
  | "crown" | "file" | "zap" | "factory" | "book" | "lightbulb" | "sparkles"
  | "briefcase" | "rocket" | "graduation" | "presentation" | "star" | "gift" | "mountain";

export interface ActivityItem {
  id: string;
  title: string;
  category: string;
  points: number;
  date: string;
  source: "event" | "activity";
  // The student created (conducted) this event themselves.
  conducted?: boolean;
}

type Matcher =
  | { kind: "keywords"; keywords: string[]; categories?: string[]; count?: number }
  | { kind: "category"; categories: string[]; count?: number }
  | { kind: "conducted"; count?: number }
  | { kind: "any" }
  | { kind: "points"; target: number }
  | { kind: "distinctCategories"; target: number };

export interface LevelDef {
  id: string;
  year: 1 | 2 | 3 | 4;
  title: string;
  quest: string;
  description: string;
  icon: LevelIcon;
  // Category used to suggest matching events / activities.
  suggestCategory?: string;
  // Rough AICTE points a student can expect; final points are set by coordinators.
  rewardHint: string;
  tip: string;
  checkpoint?: boolean;
  matcher: Matcher;
}

export interface YearDef {
  year: 1 | 2 | 3 | 4;
  name: string;
  theme: string;
  tagline: string;
  color: string;
  shade: string;
  // Banner background: dark enough for white text (>= 4.5:1).
  deep: string;
  soft: string;
}

export const YEARS: YearDef[] = [
  { year: 1, name: "Snowfield", theme: "Find your footing", tagline: "Explore campus life and try a bit of everything.", color: "#2B9FE6", shade: "#1A7BC0", deep: "#1668B0", soft: "#E3F3FD" },
  { year: 2, name: "Ice Caves", theme: "Build your skills", tagline: "Hackathons, certifications and your first hosted activity.", color: "#14B8A6", shade: "#0E8C7F", deep: "#0B7268", soft: "#DDF7F3" },
  { year: 3, name: "Aurora Ridge", theme: "Lead and create", tagline: "Organise, publish, mentor and build things that matter.", color: "#8B5CF6", shade: "#6D3FD6", deep: "#6236C9", soft: "#EFE8FE" },
  { year: 4, name: "The Summit", theme: "Leave your mark", tagline: "Internships, startups and the 100-point finish line.", color: "#FF8A00", shade: "#D16F00", deep: "#B35500", soft: "#FFF1DE" },
];

export const POINTS_GOAL = 100;

const kw = (...keywords: string[]) => keywords;

export const LEVELS: LevelDef[] = [
  // ── Year 1 · Snowfield ────────────────────────────────────────────────
  {
    id: "y1-waddle-in", year: 1, title: "Waddle In", quest: "Check in at your first campus event",
    description: "Any verified event or activity counts. This is where the journey starts.",
    icon: "flag", rewardHint: "Any points", matcher: { kind: "any" },
    tip: "Open Events, pick something happening now and snap a geo-tagged photo. That's it!",
  },
  {
    id: "y1-club-crawl", year: 1, title: "Club Crawl", quest: "Join a club or student chapter",
    description: "Sign up with a technical club, IEEE/ACM/CSI chapter, or any student society.",
    icon: "users", rewardHint: "2–5 pts", suggestCategory: "professional",
    matcher: { kind: "keywords", keywords: kw("club", "chapter", "society", "ieee", "acm", "csi", "iste", "membership") },
    tip: "Clubs are the easiest way to hear about hackathons before everyone else.",
  },
  {
    id: "y1-game-on", year: 1, title: "Game On", quest: "Take part in a sports event",
    description: "Play, run, or represent your class in any sports event or tournament.",
    icon: "trophy", rewardHint: "5–10 pts", suggestCategory: "sports",
    matcher: { kind: "category", categories: ["sports"] },
    tip: "Even penguins need cardio. Intra-college meets count too.",
  },
  {
    id: "y1-culture-fest", year: 1, title: "Culture Fest", quest: "Join a cultural event",
    description: "Perform, volunteer or compete at a cultural fest, music, dance or drama event.",
    icon: "music", rewardHint: "5–10 pts", suggestCategory: "cultural",
    matcher: { kind: "category", categories: ["cultural"] },
    tip: "Volunteering backstage counts. You don't have to be on stage to earn it.",
  },
  {
    id: "y1-lend-a-flipper", year: 1, title: "Lend a Flipper", quest: "Volunteer for a community drive",
    description: "NSS camps, blood donation drives, cleanliness drives or any community service.",
    icon: "heart", rewardHint: "5–20 pts", suggestCategory: "community service",
    matcher: { kind: "category", categories: ["community service"] },
    tip: "Community service is the heart of AICTE points. Keep your certificates safe!",
  },
  {
    id: "y1-workshop", year: 1, title: "Workshop Explorer", quest: "Attend a technical workshop",
    description: "A workshop, seminar, bootcamp or tech talk on anything that excites you.",
    icon: "wrench", rewardHint: "3–5 pts", suggestCategory: "technical",
    matcher: { kind: "keywords", keywords: kw("workshop", "seminar", "bootcamp", "webinar", "talk", "session", "training"), categories: ["technical"] },
    tip: "Pick a topic you know nothing about. Future-you will thank you.",
  },
  {
    id: "y1-green-steps", year: 1, title: "Green Steps", quest: "Join an environmental drive",
    description: "Tree plantation, Swachh Bharat, waste segregation, water or energy awareness.",
    icon: "leaf", rewardHint: "5–20 pts", suggestCategory: "community service",
    matcher: { kind: "keywords", keywords: kw("tree", "plantation", "swachh", "clean", "environment", "garbage", "waste", "water", "energy", "green", "climate", "rainwater") },
    tip: "Glaciers are melting. Pingu takes this level very personally.",
  },
  {
    id: "y1-checkpoint", year: 1, title: "Snowfield Checkpoint", quest: "Reach 25 activity points",
    description: "A quarter of the way to your 100-point AICTE requirement.",
    icon: "gift", checkpoint: true, rewardHint: "Badge", matcher: { kind: "points", target: 25 },
    tip: "25 points in year one keeps final year stress-free.",
  },

  // ── Year 2 · Ice Caves ────────────────────────────────────────────────
  {
    id: "y2-code-sprint", year: 2, title: "Code Sprint", quest: "Join a hackathon",
    description: "Build something in 24–48 hours with a team. Ideathons and codathons count too.",
    icon: "code", rewardHint: "10–20 pts", suggestCategory: "technical",
    matcher: { kind: "keywords", keywords: kw("hackathon", "hack", "codathon", "ideathon", "buildathon", "datathon") },
    tip: "You don't need to win. Showing up and shipping is the whole point.",
  },
  {
    id: "y2-certified", year: 2, title: "Certified", quest: "Finish an online course or certification",
    description: "NPTEL, Coursera, SWAYAM, or any recognised MOOC with a certificate.",
    icon: "award", rewardHint: "5–10 pts", suggestCategory: "professional",
    matcher: { kind: "keywords", keywords: kw("nptel", "mooc", "coursera", "swayam", "udemy", "edx", "certification", "certificate", "course") },
    tip: "Check with your coordinator which platforms your college accepts.",
  },
  {
    id: "y2-host-mode", year: 2, title: "Host Mode", quest: "Conduct an activity yourself",
    description: "Start an event in SPARK and run it: a study circle, a drive, a session, anything.",
    icon: "megaphone", rewardHint: "5–20 pts",
    matcher: { kind: "conducted" },
    tip: "Tap Start Event on the Events tab. Pingu will save you a front-row seat.",
  },
  {
    id: "y2-competitor", year: 2, title: "Competitor", quest: "Compete in a contest",
    description: "Coding contests, quizzes, olympiads, debates, case-study or design competitions.",
    icon: "swords", rewardHint: "5–10 pts", suggestCategory: "technical",
    matcher: { kind: "keywords", keywords: kw("competition", "contest", "quiz", "olympiad", "debate", "challenge", "championship") },
    tip: "Competing is how you find out what you're actually good at.",
  },
  {
    id: "y2-village-visit", year: 2, title: "Village Visit", quest: "Do a rural outreach programme",
    description: "Awareness campaigns, digital literacy drives, or surveys in a village.",
    icon: "home", rewardHint: "Up to 20 pts", suggestCategory: "community service",
    matcher: { kind: "keywords", keywords: kw("rural", "village", "outreach", "awareness", "literacy", "survey", "panchayat") },
    tip: "AICTE's own activity list is full of rural projects. They're worth the most.",
  },
  {
    id: "y2-team-player", year: 2, title: "Team Player", quest: "Represent your college",
    description: "An inter-college fest, tournament or meet where you play for your college.",
    icon: "handshake", rewardHint: "5–10 pts", suggestCategory: "sports",
    matcher: { kind: "keywords", keywords: kw("inter-college", "inter college", "intercollegiate", "inter-collegiate", "tournament", "zonal", "league", "inter-university") },
    tip: "Wear the college colours with pride. Pingu's scarf is already on.",
  },
  {
    id: "y2-national-call", year: 2, title: "National Call", quest: "Contribute to a national initiative",
    description: "Digital India, Skill India, Swachh Bharat, NSS or NCC programmes.",
    icon: "landmark", rewardHint: "Up to 20 pts", suggestCategory: "national initiative",
    matcher: { kind: "keywords", keywords: kw("digital india", "skill india", "swachh bharat", "nss", "ncc", "unnat", "yoga day", "fit india", "har ghar"), categories: ["national initiative"] },
    tip: "Government initiatives often come with certificates. Perfect proof!",
  },
  {
    id: "y2-checkpoint", year: 2, title: "Ice Caves Checkpoint", quest: "Reach 50 activity points",
    description: "Halfway there. Two more years, fifty more points.",
    icon: "gift", checkpoint: true, rewardHint: "Badge", matcher: { kind: "points", target: 50 },
    tip: "Halfway! Pingu is doing a little happy dance right now.",
  },

  // ── Year 3 · Aurora Ridge ─────────────────────────────────────────────
  {
    id: "y3-lead-the-pack", year: 3, title: "Lead the Pack", quest: "Organise or coordinate an event",
    description: "Be the coordinator, organiser or volunteer lead for a college event.",
    icon: "crown", rewardHint: "10–20 pts",
    matcher: { kind: "keywords", keywords: kw("organis", "organiz", "coordinat", "lead", "convenor", "head", "committee", "core team") },
    tip: "Leading a team teaches what no classroom can. And it looks great on a resume.",
  },
  {
    id: "y3-paper-trail", year: 3, title: "Paper Trail", quest: "Present a paper, poster or project",
    description: "Present at a conference, symposium or project expo, or publish your work.",
    icon: "file", rewardHint: "10–20 pts", suggestCategory: "technical",
    matcher: { kind: "keywords", keywords: kw("paper", "poster", "publication", "publish", "journal", "conference", "symposium", "research") },
    tip: "Start with your mini project. Many conferences welcome student papers.",
  },
  {
    id: "y3-hack-again", year: 3, title: "Hack Again", quest: "Join a second hackathon",
    description: "Level up from your first one: bigger stage, better idea, stronger team.",
    icon: "zap", rewardHint: "10–20 pts", suggestCategory: "technical",
    matcher: { kind: "keywords", keywords: kw("hackathon", "hack", "codathon", "ideathon", "buildathon", "datathon") },
    tip: "Smart India Hackathon is a great one to aim for this year.",
  },
  {
    id: "y3-industry-peek", year: 3, title: "Industry Peek", quest: "Go on an industrial visit",
    description: "An industrial visit, plant tour or professional workshop with industry experts.",
    icon: "factory", rewardHint: "3–5 pts", suggestCategory: "professional",
    matcher: { kind: "keywords", keywords: kw("industrial", "industry", "factory", "plant tour", "company"), categories: ["professional"] },
    tip: "Ask the engineers what they wish they'd learned in college.",
  },
  {
    id: "y3-teach-forward", year: 3, title: "Teach It Forward", quest: "Teach or tutor at a local school",
    description: "Help local schools with classes, enrolment, or STEM sessions.",
    icon: "book", rewardHint: "Up to 20 pts", suggestCategory: "community service",
    matcher: { kind: "keywords", keywords: kw("school", "teach", "tutor", "education", "stem", "classes") },
    tip: "Explaining things to kids is the best way to really understand them.",
  },
  {
    id: "y3-innovate", year: 3, title: "Innovate", quest: "Build tech that helps society",
    description: "A project that improves quality of life: an app, a device, or automation for local needs.",
    icon: "lightbulb", rewardHint: "Up to 20 pts", suggestCategory: "technical",
    matcher: { kind: "keywords", keywords: kw("technology", "solution", "mobile app", "web app", "innovation", "prototype", "automation", "device", "iot", "product") },
    tip: "Look around campus. What annoys people? Fix that.",
  },
  {
    id: "y3-double-drive", year: 3, title: "Double Drive", quest: "Complete 2 more community drives",
    description: "Keep showing up for your community. Two more service activities this year.",
    icon: "sparkles", rewardHint: "10–40 pts", suggestCategory: "community service",
    matcher: { kind: "category", categories: ["community service"], count: 2 },
    tip: "Consistency beats intensity. Pingu waddles slowly but never stops.",
  },
  {
    id: "y3-checkpoint", year: 3, title: "Aurora Checkpoint", quest: "Reach 75 activity points",
    description: "Three quarters done. The summit is in sight.",
    icon: "gift", checkpoint: true, rewardHint: "Badge", matcher: { kind: "points", target: 75 },
    tip: "You can see the aurora from here. Keep going!",
  },

  // ── Year 4 · The Summit ───────────────────────────────────────────────
  {
    id: "y4-internship", year: 4, title: "Internship Quest", quest: "Complete an internship",
    description: "An industry, research or social internship with a completion certificate.",
    icon: "briefcase", rewardHint: "Varies", suggestCategory: "professional",
    matcher: { kind: "keywords", keywords: kw("internship", "intern", "apprentice") },
    tip: "Check if your internship also counts towards the AICTE internship requirement.",
  },
  {
    id: "y4-founder-mode", year: 4, title: "Founder Mode", quest: "Pitch a startup or business idea",
    description: "E-Cell events, business plan competitions, pitch days or incubator programmes.",
    icon: "rocket", rewardHint: "10–20 pts", suggestCategory: "professional",
    matcher: { kind: "keywords", keywords: kw("startup", "entrepreneur", "e-cell", "ecell", "business", "pitch", "incubat", "venture") },
    tip: "Every big company started as a slightly embarrassing pitch deck.",
  },
  {
    id: "y4-mentor", year: 4, title: "Mentor a Fresher", quest: "Mentor juniors",
    description: "Run an orientation, a buddy programme, or mentor first-years through their journey.",
    icon: "graduation", rewardHint: "5–10 pts",
    matcher: { kind: "keywords", keywords: kw("mentor", "buddy programme", "buddy program", "peer tutor") },
    tip: "Remember Waddle In? Help someone else take their first step.",
  },
  {
    id: "y4-showcase", year: 4, title: "Showcase", quest: "Show off your final project",
    description: "A project expo, exhibition, demo day or open house.",
    icon: "presentation", rewardHint: "5–10 pts", suggestCategory: "technical",
    matcher: { kind: "keywords", keywords: kw("expo", "showcase", "exhibition", "demo day", "open house") },
    tip: "Four years of work in one booth. Make it shine.",
  },
  {
    id: "y4-all-rounder", year: 4, title: "All-Rounder", quest: "Earn points in 4 different categories",
    description: "Technical, cultural, sports, community, professional, national: collect four.",
    icon: "star", rewardHint: "Badge", matcher: { kind: "distinctCategories", target: 4 },
    tip: "Breadth is a superpower. Recruiters love well-rounded penguins.",
  },
  {
    id: "y4-give-back", year: 4, title: "Give Back", quest: "Volunteer for one more community drive",
    description: "One last NSS camp, donation drive or outreach before you graduate.",
    icon: "heart", rewardHint: "5–20 pts", suggestCategory: "community service",
    matcher: { kind: "category", categories: ["community service"] },
    tip: "Final year is busy. An afternoon of service still matters.",
  },
  {
    id: "y4-legacy", year: 4, title: "Legacy", quest: "Conduct one more activity",
    description: "Host another event before you graduate and leave something behind for your juniors.",
    icon: "megaphone", rewardHint: "5–20 pts",
    matcher: { kind: "conducted" },
    tip: "The best seniors leave the campus better than they found it.",
  },
  {
    id: "y4-summit", year: 4, title: "The Summit", quest: "Reach 100 activity points",
    description: "You've met the AICTE activity points requirement for your degree.",
    icon: "mountain", checkpoint: true, rewardHint: "Graduation badge", matcher: { kind: "points", target: POINTS_GOAL },
    tip: "100 points. Pingu brought a flag for the top. You earned it.",
  },
];

export type LevelState = "completed" | "current" | "open" | "locked";

export interface LevelProgress extends LevelDef {
  state: LevelState;
  progress: number;
  target: number;
  completedBy: ActivityItem[];
}

export interface YearProgress extends YearDef {
  levels: LevelProgress[];
  completed: number;
  total: number;
  unlocked: boolean;
}

export interface WeeklyQuest {
  id: string;
  title: string;
  progress: number;
  target: number;
  icon: "zap" | "flag" | "star";
}

export type LeagueTier = { name: string; min: number; color: string };

export const LEAGUES: LeagueTier[] = [
  { name: "Pebble", min: 0, color: "#94A3B8" },
  { name: "Snowflake", min: 10, color: "#38BDF8" },
  { name: "Icicle", min: 25, color: "#14B8A6" },
  { name: "Iceberg", min: 50, color: "#6366F1" },
  { name: "Glacier", min: 75, color: "#8B5CF6" },
  { name: "Aurora", min: 100, color: "#F59E0B" },
];

export function leagueFor(points: number) {
  let tier = LEAGUES[0];
  let next: LeagueTier | null = null;
  for (let i = 0; i < LEAGUES.length; i++) {
    if (points >= LEAGUES[i].min) {
      tier = LEAGUES[i];
      next = LEAGUES[i + 1] ?? null;
    }
  }
  return { tier, next };
}

export interface Badge {
  id: string;
  title: string;
  description: string;
  icon: LevelIcon;
  earned: boolean;
}

export interface JourneyResult {
  currentYear: 1 | 2 | 3 | 4;
  totalPoints: number;
  goal: number;
  years: YearProgress[];
  currentLevelId: string | null;
  completedLevels: number;
  totalLevels: number;
  streakWeeks: number;
  weeklyQuests: WeeklyQuest[];
  league: ReturnType<typeof leagueFor>;
  badges: Badge[];
  categories: { name: string; points: number; count: number }[];
}

const norm = (s: string) => (s || "").toLowerCase();

function matchesItem(m: Matcher, item: ActivityItem): boolean {
  const text = norm(`${item.title} ${item.category}`);
  const cat = norm(item.category);
  switch (m.kind) {
    case "keywords":
      return m.keywords.some((k) => text.includes(k)) || !!m.categories?.includes(cat);
    case "category":
      return m.categories.includes(cat);
    case "conducted":
      return !!item.conducted;
    default:
      return false;
  }
}

// Specific matchers claim items first so a hackathon fills "Code Sprint"
// before a broad "any technical event" level can swallow it.
const tierOf = (m: Matcher) =>
  m.kind === "conducted" ? 0 : m.kind === "keywords" ? (m.categories ? 2 : 1) : m.kind === "category" ? 3 : 9;

function weekKey(d: Date) {
  // ISO-ish week index: days since epoch, shifted so weeks start on Monday.
  const day = Math.floor(d.getTime() / 86400000);
  return Math.floor((day + 3) / 7);
}

export function yearFromSemester(semester?: number | null): 1 | 2 | 3 | 4 {
  const s = Number(semester) || 1;
  return Math.min(4, Math.max(1, Math.ceil(s / 2))) as 1 | 2 | 3 | 4;
}

export interface JourneyInput {
  totalPoints: number;
  semester?: number | null;
  // Verified/approved items that earned points.
  items: ActivityItem[];
  // Dates of any submission (pending included), used for streaks and quests.
  activityDates: string[];
  now?: Date;
}

export function computeJourney(input: JourneyInput): JourneyResult {
  const now = input.now ?? new Date();
  const currentYear = yearFromSemester(input.semester);
  const items = [...input.items].sort((a, b) => +new Date(a.date) - +new Date(b.date));
  const totalPoints = Math.max(0, Math.round(Number(input.totalPoints) || 0));
  const distinctCats = new Set(items.map((i) => norm(i.category)).filter(Boolean));

  const claimed = new Map<string, ActivityItem[]>();
  const used = new Set<string>();

  const consuming = LEVELS
    .map((level, order) => ({ level, order }))
    .filter(({ level }) => ["keywords", "category", "conducted"].includes(level.matcher.kind))
    .sort((a, b) => tierOf(a.level.matcher) - tierOf(b.level.matcher) || a.order - b.order);

  for (const { level } of consuming) {
    const need = "count" in level.matcher && level.matcher.count ? level.matcher.count : 1;
    const got: ActivityItem[] = [];
    for (const item of items) {
      if (got.length >= need) break;
      if (used.has(item.id)) continue;
      if (matchesItem(level.matcher, item)) {
        got.push(item);
        used.add(item.id);
      }
    }
    // Release partial claims so they can satisfy other levels.
    if (got.length < need) got.forEach((i) => used.delete(i.id));
    claimed.set(level.id, got);
  }

  let currentLevelId: string | null = null;
  const years: YearProgress[] = YEARS.map((y) => {
    const unlocked = y.year <= currentYear;
    const levels: LevelProgress[] = LEVELS.filter((l) => l.year === y.year).map((level) => {
      const m = level.matcher;
      let progress = 0;
      let target = 1;
      let completedBy: ActivityItem[] = [];
      if (m.kind === "any") {
        progress = items.length > 0 ? 1 : 0;
        completedBy = items.slice(0, 1);
      } else if (m.kind === "points") {
        target = m.target;
        progress = Math.min(totalPoints, target);
      } else if (m.kind === "distinctCategories") {
        target = m.target;
        progress = Math.min(distinctCats.size, target);
      } else {
        target = ("count" in m && m.count) || 1;
        completedBy = claimed.get(level.id) ?? [];
        progress = completedBy.length;
      }
      const done = progress >= target;
      let state: LevelState = done ? "completed" : unlocked ? "open" : "locked";
      if (!done && unlocked && !currentLevelId) {
        state = "current";
        currentLevelId = level.id;
      }
      return { ...level, state, progress, target, completedBy: done ? completedBy : [] };
    });
    const completed = levels.filter((l) => l.state === "completed").length;
    return { ...y, levels, completed, total: levels.length, unlocked };
  });

  // Weekly streak: consecutive weeks with any logged activity, ending this week
  // (or last week, so the streak doesn't break on Monday morning).
  const weeks = new Set(input.activityDates.filter(Boolean).map((d) => weekKey(new Date(d))));
  const thisWeek = weekKey(now);
  let streakWeeks = 0;
  let w = weeks.has(thisWeek) ? thisWeek : thisWeek - 1;
  while (weeks.has(w)) {
    streakWeeks++;
    w--;
  }

  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const loggedThisWeek = input.activityDates.filter((d) => d && weekKey(new Date(d)) === thisWeek).length;
  const eventsThisMonth = items.filter((i) => i.source === "event" && new Date(i.date) >= startOfMonth).length;
  const pointsThisMonth = items.filter((i) => new Date(i.date) >= startOfMonth).reduce((s, i) => s + (Number(i.points) || 0), 0);

  const weeklyQuests: WeeklyQuest[] = [
    { id: "log-week", title: "Log an activity this week", progress: Math.min(loggedThisWeek, 1), target: 1, icon: "zap" },
    { id: "event-month", title: "Check in at 2 events this month", progress: Math.min(eventsThisMonth, 2), target: 2, icon: "flag" },
    { id: "points-month", title: "Earn 10 points this month", progress: Math.min(pointsThisMonth, 10), target: 10, icon: "star" },
  ];

  const allLevels = years.flatMap((y) => y.levels);
  const isDone = (id: string) => allLevels.find((l) => l.id === id)?.state === "completed";
  const catCount = (c: string) => items.filter((i) => norm(i.category) === c).length;

  const badges: Badge[] = [
    { id: "first-steps", title: "First Steps", description: "Earned your first activity points", icon: "flag", earned: items.length > 0 },
    { id: "hacker", title: "Hackathon Hero", description: "Joined a hackathon", icon: "code", earned: isDone("y2-code-sprint") },
    { id: "host", title: "Host with the Most", description: "Conducted your own activity", icon: "megaphone", earned: items.some((i) => i.conducted) },
    { id: "heart", title: "Big Heart", description: "3 community service activities", icon: "heart", earned: catCount("community service") >= 3 },
    { id: "streak", title: "On a Roll", description: "4-week activity streak", icon: "zap", earned: streakWeeks >= 4 },
    { id: "all-rounder", title: "All-Rounder", description: "Points in 4 categories", icon: "star", earned: distinctCats.size >= 4 },
    { id: "half", title: "Halfway Hero", description: "Reached 50 points", icon: "trophy", earned: totalPoints >= 50 },
    { id: "summit", title: "Summit Penguin", description: "Completed 100 AICTE points", icon: "mountain", earned: totalPoints >= POINTS_GOAL },
  ];

  const catMap = new Map<string, { points: number; count: number }>();
  for (const i of items) {
    const c = norm(i.category) || "other";
    const cur = catMap.get(c) ?? { points: 0, count: 0 };
    cur.points += Number(i.points) || 0;
    cur.count += 1;
    catMap.set(c, cur);
  }

  return {
    currentYear,
    totalPoints,
    goal: POINTS_GOAL,
    years,
    currentLevelId,
    completedLevels: allLevels.filter((l) => l.state === "completed").length,
    totalLevels: allLevels.length,
    streakWeeks,
    weeklyQuests,
    league: leagueFor(totalPoints),
    badges,
    categories: [...catMap.entries()].map(([name, v]) => ({ name, ...v })).sort((a, b) => b.points - a.points),
  };
}

// Does an activity from the catalogue help clear this level? Used to pre-select
// the right activity when a student logs something from the path.
export function activityFitsLevel(level: LevelDef, name: string, category: string) {
  return matchesItem(level.matcher, { id: "", title: name, category, points: 0, date: "", source: "activity" });
}
