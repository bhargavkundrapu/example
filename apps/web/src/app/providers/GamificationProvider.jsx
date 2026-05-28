import { createContext, useContext, useState, useCallback, useEffect, useMemo } from "react";
import { useAuth } from "./AuthProvider";
import { apiFetch } from "../../services/api";

const STORAGE_KEY = "expograph-gamification";
const GamificationContext = createContext(null);

const LEVELS = [
  { level: 1, title: "Beginner", minXP: 0 },
  { level: 2, title: "Learner", minXP: 200 },
  { level: 3, title: "Explorer", minXP: 500 },
  { level: 4, title: "Achiever", minXP: 1000 },
  { level: 5, title: "Specialist", minXP: 2000 },
  { level: 6, title: "Advanced", minXP: 3500 },
  { level: 7, title: "Pro", minXP: 5500 },
  { level: 8, title: "Master", minXP: 8000 },
  { level: 9, title: "Guru", minXP: 12000 },
  { level: 10, title: "Expert", minXP: 18000 },
];

const XP_REWARDS = {
  lessonComplete: 50,
  quizComplete: 100,
  perfectQuiz: 200,
  dailyLogin: 10,
  streakBonus7: 50,
  streakBonus30: 200,
  streakBonus100: 500,
  dailyChallenge: 30,
  courseComplete: 500,
};

// Icons as Unicode escapes so literals stay correct regardless of editor/file encoding.
const ACHIEVEMENT_DEFS = [
  { id: "first_lesson", title: "First Steps", desc: "Complete your first lesson", icon: "\u{1F3AF}", rarity: "common", check: (s) => s.lessonsCompleted >= 1 }, // direct hit
  { id: "five_lessons", title: "Getting Started", desc: "Complete 5 lessons", icon: "\u{1F4DA}", rarity: "common", check: (s) => s.lessonsCompleted >= 5 }, // books
  { id: "ten_lessons", title: "Dedicated Learner", desc: "Complete 10 lessons", icon: "\u{1F393}", rarity: "rare", check: (s) => s.lessonsCompleted >= 10 }, // graduation cap
  { id: "twenty_five_lessons", title: "Knowledge Seeker", desc: "Complete 25 lessons", icon: "\u{1F9E0}", rarity: "rare", check: (s) => s.lessonsCompleted >= 25 }, // brain
  { id: "fifty_lessons", title: "Lesson Master", desc: "Complete 50 lessons", icon: "\u{1F451}", rarity: "epic", check: (s) => s.lessonsCompleted >= 50 }, // crown
  { id: "streak_7", title: "Week Warrior", desc: "7-day learning streak", icon: "\u{1F525}", rarity: "common", check: (s) => s.bestStreak >= 7 }, // fire
  { id: "streak_30", title: "Monthly Champion", desc: "30-day learning streak", icon: "\u{1F48E}", rarity: "epic", check: (s) => s.bestStreak >= 30 }, // gem
  { id: "streak_100", title: "Unstoppable", desc: "100-day learning streak", icon: "\u{26A1}", rarity: "legendary", check: (s) => s.bestStreak >= 100 }, // lightning
  { id: "first_course", title: "Course Conqueror", desc: "Complete your first course", icon: "\u{1F3C6}", rarity: "rare", check: (s) => s.coursesCompleted >= 1 }, // trophy
  { id: "perfect_quiz", title: "Perfectionist", desc: "Score 100% on a quiz", icon: "\u{2B50}", rarity: "rare", check: (s) => s.perfectQuizzes >= 1 }, // star
  { id: "xp_1000", title: "XP Hunter", desc: "Earn 1,000 XP", icon: "\u{1F4B0}", rarity: "common", check: (s) => s.totalXP >= 1000 }, // money bag
  { id: "xp_5000", title: "XP Master", desc: "Earn 5,000 XP", icon: "\u{1F31F}", rarity: "epic", check: (s) => s.totalXP >= 5000 }, // glowing star (distinct from streak gem)
  { id: "early_bird", title: "Early Bird", desc: "Login before 8 AM", icon: "\u{1F305}", rarity: "common", check: (s) => s.earlyBirdLogins >= 1 }, // sunrise
  { id: "night_owl", title: "Night Owl", desc: "Study after 10 PM", icon: "\u{1F989}", rarity: "common", check: (s) => s.nightOwlSessions >= 1 }, // owl
  { id: "weekend_warrior", title: "Weekend Warrior", desc: "Study on a weekend", icon: "\u{1F4C5}", rarity: "common", check: (s) => s.weekendSessions >= 1 }, // calendar
  { id: "bookworm", title: "Bookworm", desc: "Bookmark 5 lessons", icon: "\u{1F4D6}", rarity: "common", check: (s) => s.bookmarksCount >= 5 }, // open book
  { id: "daily_challenger", title: "Challenge Accepted", desc: "Answer 5 daily challenges", icon: "\u{1F3B2}", rarity: "rare", check: (s) => s.dailyChallengesCompleted >= 5 }, // game die
  { id: "note_taker", title: "Note Taker", desc: "Write 10 notes", icon: "\u{1F4DD}", rarity: "common", check: (s) => s.notesCount >= 10 }, // memo
];

// Daily Challenge questions aligned with ExpoGraph courses: Vibe Coding, Prompt Engineering, Prompt to Profit, AI Automations
const DAILY_QUESTIONS = [
  { id: "dq1", q: "In prompt engineering, what is 'few-shot' prompting?", options: ["Using very short prompts", "Giving the model 1-5 example inputs and outputs before the real task", "Asking the model to prompt the user", "A type of error message"], answer: 1, topic: "Prompt Engineering" },
  { id: "dq2", q: "Which of these helps make AI outputs more consistent?", options: ["Using different models each time", "Being vague in your instructions", "Using clear instructions and examples", "Avoiding any context"], answer: 2, topic: "Prompt Engineering" },
  { id: "dq3", q: "What is 'vibe coding' in our course context?", options: ["Coding without a keyboard", "Building apps using natural language and AI-assisted tools", "Only writing comments", "Debugging by intuition"], answer: 1, topic: "Vibe Coding" },
  { id: "dq4", q: "Which practice is key in Prompt to Profit?", options: ["Ignoring user feedback", "Treating prompts as products: test, iterate, and improve", "Using the longest possible prompts", "Avoiding any automation"], answer: 1, topic: "Prompt to Profit" },
  { id: "dq5", q: "What does a well-structured prompt usually include?", options: ["Only a question", "Role, task, context, and format when needed", "Random keywords", "No instructions"], answer: 1, topic: "Prompt Engineering" },
  { id: "dq6", q: "In AI automation, what is an 'workflow'?", options: ["A single click", "A sequence of steps that run automatically", "A type of database", "A programming language"], answer: 1, topic: "AI Automations" },
  { id: "dq7", q: "Why is 'role' often set at the start of a prompt?", options: ["To confuse the model", "To set the tone and expertise the model should use", "To reduce response length only", "It has no effect"], answer: 1, topic: "Prompt Engineering" },
  { id: "dq8", q: "What can you build with no-code / low-code in Vibe Coding?", options: ["Only static pages", "Full apps, automations, and workflows with AI help", "Only spreadsheets", "Only emails"], answer: 1, topic: "Vibe Coding" },
  { id: "dq9", q: "Which is a good habit when iterating on prompts?", options: ["Changing everything at once", "Changing one thing at a time and comparing results", "Never testing", "Copying prompts from others only"], answer: 1, topic: "Prompt to Profit" },
  { id: "dq10", q: "What does 'automation' mean in AI Automations?", options: ["Doing everything manually", "Using AI and tools to run tasks without manual steps each time", "Writing more code", "Deleting data"], answer: 1, topic: "AI Automations" },
  { id: "dq11", q: "What is 'context' in a prompt?", options: ["The font size of the text", "Background information that helps the model understand the task", "The model's name", "A programming language"], answer: 1, topic: "Prompt Engineering" },
  { id: "dq12", q: "Which skill is central to Prompt to Profit?", options: ["Memorizing code", "Turning good prompts into repeatable value (products, services, workflows)", "Avoiding AI", "Only writing documentation"], answer: 1, topic: "Prompt to Profit" },
  { id: "dq13", q: "In our courses, what is the Real Client Lab?", options: ["A theory-only module", "A place to work on real-world tasks and build portfolio pieces", "A game", "A chat room"], answer: 1, topic: "Real Client Lab" },
  { id: "dq14", q: "Why is specifying 'format' in a prompt useful?", options: ["It makes the prompt longer", "It helps get outputs in the shape you need (list, JSON, steps, etc.)", "It slows down the model", "It has no effect"], answer: 1, topic: "Prompt Engineering" },
  { id: "dq15", q: "What kind of tasks can AI automation handle?", options: ["Only math", "Repetitive tasks, data handling, and workflows you define", "Only creative writing", "Nothing useful"], answer: 1, topic: "AI Automations" },
];

const MOTIVATIONAL_QUOTES = [
  { text: "The only way to do great work is to love what you do.", author: "Steve Jobs" },
  { text: "Code is like humor. When you have to explain it, it's bad.", author: "Cory House" },
  { text: "First, solve the problem. Then, write the code.", author: "John Johnson" },
  { text: "The best error message is the one that never shows up.", author: "Thomas Fuchs" },
  { text: "Talk is cheap. Show me the code.", author: "Linus Torvalds" },
  { text: "Any fool can write code that a computer can understand.", author: "Martin Fowler" },
  { text: "Programming isn't about what you know; it's about what you can figure out.", author: "Chris Pine" },
  { text: "The expert in anything was once a beginner.", author: "Helen Hayes" },
  { text: "Don't worry if it doesn't work right. If everything did, you'd be out of a job.", author: "Mosher's Law" },
  { text: "Learning never exhausts the mind.", author: "Leonardo da Vinci" },
  { text: "Success is not final, failure is not fatal: It is the courage to continue that counts.", author: "Winston Churchill" },
  { text: "Every great developer you know got there by solving problems they were unqualified to solve.", author: "Patrick McKenzie" },
];

function today() {
  return new Date().toISOString().slice(0, 10);
}

function toDayNumber(isoDateStr) {
  // isoDateStr is expected to be YYYY-MM-DD
  return Math.floor(new Date(`${isoDateStr}T00:00:00Z`).getTime() / 86400000);
}

function computeStreaksFromActiveDays(activeDays, todayStr) {
  const unique = Array.from(new Set((activeDays || []).filter(Boolean)));
  const dayNumbers = unique.map(toDayNumber).filter((n) => Number.isFinite(n)).sort((a, b) => a - b);
  const activeSet = new Set(unique);

  // Best streak (longest consecutive run)
  let bestStreak = 0;
  let run = 0;
  let prevN = null;
  for (const n of dayNumbers) {
    if (prevN === null || n === prevN + 1) {
      run = prevN === null ? 1 : run + 1;
    } else {
      bestStreak = Math.max(bestStreak, run);
      run = 1;
    }
    prevN = n;
  }
  bestStreak = Math.max(bestStreak, run);

  // Current streak (consecutive active days ending today)
  let currentStreak = 0;
  if (activeSet.has(todayStr)) {
    let n = toDayNumber(todayStr);
    while (activeSet.has(new Date(n * 86400000).toISOString().slice(0, 10))) {
      currentStreak++;
      n--;
    }
  }

  return { currentStreak, bestStreak };
}

function getDefaults() {
  return {
    totalXP: 0,
    weeklyXP: 0,
    weeklyXPGoal: 300,
    weekStartDate: today(),
    currentStreak: 0,
    bestStreak: 0,
    serverWeeklyStreakDays: [],
    streakFreezes: 1,
    lastActiveDate: null,
    activeDays: [],
    lessonsCompleted: 0,
    coursesCompleted: 0,
    perfectQuizzes: 0,
    earlyBirdLogins: 0,
    nightOwlSessions: 0,
    weekendSessions: 0,
    dailyChallengesCompleted: 0,
    unlockedAchievements: [],
    newAchievements: [],
    bookmarks: [],
    notes: {},
    dailyChallengeDate: null,
    dailyChallengeAnswered: false,
    dailyChallengeCorrect: false,
    lastVisit: null,
    lastContinue: null,
    milestoneCelebrated: {},
    xpHistory: [],
  };
}

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return { ...getDefaults(), ...parsed };
    }
  } catch {}
  return getDefaults();
}

export function GamificationProvider({ children }) {
  const [state, setState] = useState(loadState);
  const { token, role, permissionsLoading } = useAuth();

  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch {}
  }, [state]);

  // Sync lesson bookmarks + notes from backend for cross-device persistence.
  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await apiFetch("/api/v1/student/learning-state", {
          token,
          skipIfUnreachable: true,
        }).catch(() => null);
        if (!res?.ok || cancelled) return;
        const serverNotes = res.data?.notes && typeof res.data.notes === "object" ? res.data.notes : {};
        const serverBookmarks = Array.isArray(res.data?.bookmarks) ? res.data.bookmarks : [];
        setState((prev) => ({
          ...prev,
          notes: serverNotes,
          bookmarks: serverBookmarks,
        }));
      } catch {
        // Keep local data if backend is unavailable.
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [token]);

  // Sync streak/best streak from backend so profile shows real values (no localStorage mock).
  useEffect(() => {
    if (!token) return;
    if (permissionsLoading) return;
    if (role && role !== "Student") return;

    let cancelled = false;

    // Avoid showing localStorage-derived (fake) streak values while we fetch server truth.
    setState((prev) => ({
      ...prev,
      currentStreak: 0,
      bestStreak: 0,
      serverWeeklyStreakDays: [],
      activeDays: [],
      lastActiveDate: null,
    }));

    (async () => {
      try {
        // Use /student/progress as the primary streak source to avoid 404 noise
        // in environments where /student/streak is not deployed yet.
        const progressRes = await apiFetch("/api/v1/student/progress", {
          token,
          skipIfUnreachable: true,
        }).catch(() => null);
        if (cancelled) return;
        const streakFromProgress = parseInt(progressRes?.data?.streak, 10);
        const data = {
          currentStreak: Number.isFinite(streakFromProgress) ? streakFromProgress : 0,
          bestStreak: Number.isFinite(streakFromProgress) ? streakFromProgress : 0,
          activeDays: [],
          weeklyStreakDays: [],
          lastActiveDate: null,
        };

        const serverCurrent = parseInt(data.currentStreak, 10);
        const serverBest = parseInt(data.bestStreak, 10);
        const activeDays = Array.isArray(data.activeDays) ? data.activeDays : null;

        setState((prev) => ({
          ...prev,
          currentStreak: Number.isFinite(serverCurrent) ? serverCurrent : prev.currentStreak,
          bestStreak: Number.isFinite(serverBest) ? serverBest : prev.bestStreak,
          serverWeeklyStreakDays: Array.isArray(data.weeklyStreakDays)
            ? data.weeklyStreakDays
            : prev.serverWeeklyStreakDays,
          activeDays: activeDays ?? prev.activeDays,
          lastActiveDate: data.lastActiveDate ?? prev.lastActiveDate,
        }));
      } catch {
        // If endpoint fails (offline/dev), keep current gamification state.
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [token, role, permissionsLoading]);

  useEffect(() => {
    // When authenticated, streak values come from the server (and are updated locally
    // on lesson completion). This prevents "fake" streak increments from localStorage.
    if (token) return;

    const now = new Date();
    const hour = now.getHours();
    const day = now.getDay();
    setState(prev => {
      const updates = {};
      if (hour < 8) updates.earlyBirdLogins = (prev.earlyBirdLogins || 0) + (prev.lastActiveDate !== today() ? 1 : 0);
      if (hour >= 22) updates.nightOwlSessions = (prev.nightOwlSessions || 0) + (prev.lastActiveDate !== today() ? 1 : 0);
      if (day === 0 || day === 6) updates.weekendSessions = (prev.weekendSessions || 0) + (prev.lastActiveDate !== today() ? 1 : 0);

      if (prev.lastActiveDate !== today()) {
        const yesterday = new Date(now);
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toISOString().slice(0, 10);
        let streak = prev.currentStreak;
        if (prev.lastActiveDate === yesterdayStr) {
          streak += 1;
        } else if (prev.lastActiveDate && prev.lastActiveDate !== today()) {
          if (prev.streakFreezes > 0 && prev.lastActiveDate === new Date(now.getTime() - 2 * 86400000).toISOString().slice(0, 10)) {
            streak += 1;
            updates.streakFreezes = prev.streakFreezes - 1;
          } else {
            streak = 1;
          }
        } else if (!prev.lastActiveDate) {
          streak = 1;
        }
        updates.currentStreak = streak;
        updates.bestStreak = Math.max(streak, prev.bestStreak);
        updates.lastActiveDate = today();
        updates.totalXP = (prev.totalXP || 0) + XP_REWARDS.dailyLogin;
        updates.weeklyXP = (prev.weeklyXP || 0) + XP_REWARDS.dailyLogin;
        const days = [...(prev.activeDays || [])];
        if (!days.includes(today())) days.push(today());
        if (days.length > 90) days.splice(0, days.length - 90);
        updates.activeDays = days;
      }

      const weekStart = prev.weekStartDate || today();
      const daysSinceWeekStart = Math.floor((now.getTime() - new Date(weekStart).getTime()) / 86400000);
      if (daysSinceWeekStart >= 7) {
        updates.weeklyXP = 0;
        updates.weekStartDate = today();
      }

      if (Object.keys(updates).length === 0) return prev;
      return { ...prev, ...updates };
    });
  }, [token]);

  const addXP = useCallback((amount, reason) => {
    setState(prev => {
      const newTotal = (prev.totalXP || 0) + amount;
      const newWeekly = (prev.weeklyXP || 0) + amount;
      const history = [...(prev.xpHistory || []), { amount, reason, date: new Date().toISOString() }];
      if (history.length > 50) history.splice(0, history.length - 50);
      return { ...prev, totalXP: newTotal, weeklyXP: newWeekly, xpHistory: history };
    });
  }, []);

  const recordLessonComplete = useCallback(() => {
    setState(prev => {
      const count = (prev.lessonsCompleted || 0) + 1;

      // Keep streak live for the current session by treating lesson completion as "activity" for today.
      const t = today();
      const nextActiveDays = Array.from(new Set([...(prev.activeDays || []), t]))
        .sort()
        .slice(-180);
      const { currentStreak, bestStreak } = computeStreaksFromActiveDays(nextActiveDays, t);

      return {
        ...prev,
        lessonsCompleted: count,
        activeDays: nextActiveDays,
        lastActiveDate: t,
        currentStreak,
        bestStreak,
      };
    });
    addXP(XP_REWARDS.lessonComplete, "Lesson completed");
  }, [addXP]);

  const recordCourseComplete = useCallback(() => {
    setState(prev => ({ ...prev, coursesCompleted: (prev.coursesCompleted || 0) + 1 }));
    addXP(XP_REWARDS.courseComplete, "Course completed");
  }, [addXP]);

  const recordPerfectQuiz = useCallback(() => {
    setState(prev => ({ ...prev, perfectQuizzes: (prev.perfectQuizzes || 0) + 1 }));
    addXP(XP_REWARDS.perfectQuiz, "Perfect quiz score");
  }, [addXP]);

  const recordQuizComplete = useCallback(() => {
    addXP(XP_REWARDS.quizComplete, "Quiz completed");
  }, [addXP]);

  const answerDailyChallenge = useCallback((correct) => {
    setState(prev => ({
      ...prev,
      dailyChallengeAnswered: true,
      dailyChallengeCorrect: correct,
      dailyChallengesCompleted: correct ? (prev.dailyChallengesCompleted || 0) + 1 : prev.dailyChallengesCompleted,
    }));
    if (correct) addXP(XP_REWARDS.dailyChallenge, "Daily challenge");
  }, [addXP]);

  const toggleBookmark = useCallback((lessonPath, lessonTitle) => {
    let removed = false;
    setState(prev => {
      const bm = prev.bookmarks || [];
      const exists = bm.find(b => b.path === lessonPath);
      if (exists) {
        removed = true;
        return { ...prev, bookmarks: bm.filter(b => b.path !== lessonPath) };
      }
      return { ...prev, bookmarks: [...bm, { path: lessonPath, title: lessonTitle, date: new Date().toISOString() }] };
    });

    if (!token) return;
    if (removed) {
      apiFetch(`/api/v1/student/lesson-bookmarks?lessonPath=${encodeURIComponent(lessonPath)}`, {
        method: "DELETE",
        token,
      }).catch(() => {});
      return;
    }
    apiFetch("/api/v1/student/lesson-bookmarks", {
      method: "PUT",
      token,
      body: { lessonPath, title: lessonTitle || lessonPath },
    }).catch(() => {});
  }, [token]);

  const isBookmarked = useCallback((lessonPath) => {
    return (state.bookmarks || []).some(b => b.path === lessonPath);
  }, [state.bookmarks]);

  const saveNote = useCallback((lessonPath, text) => {
    setState(prev => {
      const notes = { ...(prev.notes || {}) };
      if (text.trim()) notes[lessonPath] = { text, updated: new Date().toISOString() };
      else delete notes[lessonPath];
      return { ...prev, notes };
    });
    if (!token) return;
    if (!String(text || "").trim()) {
      apiFetch(`/api/v1/student/lesson-notes?lessonPath=${encodeURIComponent(lessonPath)}`, {
        method: "DELETE",
        token,
      }).catch(() => {});
      return;
    }
    apiFetch("/api/v1/student/lesson-notes", {
      method: "PUT",
      token,
      body: { lessonPath, text },
    }).catch(() => {});
  }, [token]);

  const getNote = useCallback((lessonPath) => {
    return (state.notes || {})[lessonPath]?.text || "";
  }, [state.notes]);

  const setLastContinue = useCallback((data) => {
    setState(prev => ({ ...prev, lastContinue: data }));
  }, []);

  const celebrateMilestone = useCallback((key) => {
    setState(prev => ({ ...prev, milestoneCelebrated: { ...prev.milestoneCelebrated, [key]: true } }));
  }, []);

  const clearNewAchievements = useCallback(() => {
    setState(prev => ({ ...prev, newAchievements: [] }));
  }, []);

  useEffect(() => {
    setState(prev => {
      const stats = {
        totalXP: prev.totalXP,
        lessonsCompleted: prev.lessonsCompleted,
        coursesCompleted: prev.coursesCompleted,
        bestStreak: prev.bestStreak,
        currentStreak: prev.currentStreak,
        perfectQuizzes: prev.perfectQuizzes,
        earlyBirdLogins: prev.earlyBirdLogins,
        nightOwlSessions: prev.nightOwlSessions,
        weekendSessions: prev.weekendSessions,
        bookmarksCount: (prev.bookmarks || []).length,
        dailyChallengesCompleted: prev.dailyChallengesCompleted,
        notesCount: Object.keys(prev.notes || {}).length,
      };
      const newlyUnlocked = [];
      for (const a of ACHIEVEMENT_DEFS) {
        if (!prev.unlockedAchievements.includes(a.id) && a.check(stats)) {
          newlyUnlocked.push(a.id);
        }
      }
      if (newlyUnlocked.length === 0) return prev;
      return {
        ...prev,
        unlockedAchievements: [...prev.unlockedAchievements, ...newlyUnlocked],
        newAchievements: [...(prev.newAchievements || []), ...newlyUnlocked],
      };
    });
  }, [state.totalXP, state.lessonsCompleted, state.coursesCompleted, state.bestStreak, state.perfectQuizzes, state.earlyBirdLogins, state.nightOwlSessions, state.weekendSessions, state.bookmarks, state.dailyChallengesCompleted, state.notes]);

  const currentLevel = useMemo(() => {
    let lvl = LEVELS[0];
    for (const l of LEVELS) {
      if (state.totalXP >= l.minXP) lvl = l;
    }
    return lvl;
  }, [state.totalXP]);

  const nextLevel = useMemo(() => {
    const idx = LEVELS.findIndex(l => l.level === currentLevel.level);
    return idx < LEVELS.length - 1 ? LEVELS[idx + 1] : null;
  }, [currentLevel]);

  const levelProgress = useMemo(() => {
    if (!nextLevel) return 100;
    const range = nextLevel.minXP - currentLevel.minXP;
    const current = state.totalXP - currentLevel.minXP;
    return Math.min(100, Math.round((current / range) * 100));
  }, [state.totalXP, currentLevel, nextLevel]);

  const dailyChallenge = useMemo(() => {
    const dayIndex = Math.floor(Date.now() / 86400000) % DAILY_QUESTIONS.length;
    return DAILY_QUESTIONS[dayIndex];
  }, []);

  const isDailyChallengeReady = state.dailyChallengeDate !== today();

  useEffect(() => {
    if (state.dailyChallengeDate !== today()) {
      setState(prev => ({ ...prev, dailyChallengeDate: today(), dailyChallengeAnswered: false, dailyChallengeCorrect: false }));
    }
  }, []);

  const todayQuote = useMemo(() => {
    const dayIndex = Math.floor(Date.now() / 86400000) % MOTIVATIONAL_QUOTES.length;
    return MOTIVATIONAL_QUOTES[dayIndex];
  }, []);

  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 17) return "Good Afternoon";
    return "Good Evening";
  }, []);

  const daysSinceLastVisit = useMemo(() => {
    if (!state.lastVisit) return 0;
    return Math.floor((Date.now() - new Date(state.lastVisit).getTime()) / 86400000);
  }, [state.lastVisit]);

  useEffect(() => {
    setState(prev => ({ ...prev, lastVisit: new Date().toISOString() }));
  }, []);

  const weeklyStreakDays = useMemo(() => {
    if (Array.isArray(state.serverWeeklyStreakDays) && state.serverWeeklyStreakDays.length === 7) {
      return state.serverWeeklyStreakDays;
    }

    const days = [];
    const now = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const str = d.toISOString().slice(0, 10);
      days.push({ date: str, active: (state.activeDays || []).includes(str), label: d.toLocaleDateString("en", { weekday: "short" }).charAt(0) });
    }
    return days;
  }, [state.serverWeeklyStreakDays, state.activeDays]);

  const value = {
    ...state,
    currentLevel,
    nextLevel,
    levelProgress,
    dailyChallenge,
    isDailyChallengeReady,
    todayQuote,
    greeting,
    daysSinceLastVisit,
    weeklyStreakDays,
    xpRewards: XP_REWARDS,
    achievements: ACHIEVEMENT_DEFS,
    levels: LEVELS,
    addXP,
    recordLessonComplete,
    recordCourseComplete,
    recordPerfectQuiz,
    recordQuizComplete,
    answerDailyChallenge,
    toggleBookmark,
    isBookmarked,
    saveNote,
    getNote,
    setLastContinue,
    celebrateMilestone,
    clearNewAchievements,
  };

  return (
    <GamificationContext.Provider value={value}>
      {children}
    </GamificationContext.Provider>
  );
}

export function useGamification() {
  const ctx = useContext(GamificationContext);
  if (!ctx) throw new Error("useGamification must be used within GamificationProvider");
  return ctx;
}

export { ACHIEVEMENT_DEFS, XP_REWARDS, LEVELS, DAILY_QUESTIONS, MOTIVATIONAL_QUOTES };
