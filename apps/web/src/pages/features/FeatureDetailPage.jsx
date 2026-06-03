import { useEffect, useState } from "react";
import { useParams, Link, useNavigate, useLocation } from "react-router-dom";
import { Header } from "../../Components/ui/header-2";
import { useAuth } from "../../app/providers/AuthProvider";
import { apiFetch } from "../../services/api";
import { hasLaunchPadAccess } from "../../utils/launchPadAccess";
import { homePathForRole } from "../../app/roles";
import { featureData } from "../../Components/ui/academy-features-grid";
import { getFeatureCardCover } from "../../data/courseCardMedia";
import { TubesBackground } from "../../Components/ui/neon-flow";
import FlowTubesFooterInner from "../../Components/ui/FlowTubesFooterInner";
import {
  Copy, FileText, FlaskConical, LayoutDashboard, Layers,
  ArrowRight, ArrowLeft, CheckCircle2, Sparkles, Target,
  Video, BookOpen, Code2, Presentation, Eye, Zap, Users,
  Star, Award, TrendingUp, Shield, Clock, Heart, Globe, ExternalLink,
  Rocket, Map, ClipboardList,
} from "lucide-react";

const featureDetails = {
  "smart-prompts": {
    hero: {
      badge: "Learn 10x Faster",
      title: "Smart Prompt Library",
      subtitle: "Stop wasting hours searching for the right commands. Every prompt, error-fix, and code snippet you need-organized, structured, and ready to copy in one click.",
      gradient: "from-violet-600 to-purple-600",
      accentColor: "violet",
    },
    sections: [
      {
        title: "What You Get",
        items: [
          { icon: <Copy className="h-5 w-5" />, title: "Copy-Ready Prompts", desc: "Pre-built prompts for every lesson-HTML, CSS, JavaScript, React, Node.js, and more. Just click, copy, and paste into your editor." },
          { icon: <Code2 className="h-5 w-5" />, title: "Command Reference Boxes", desc: "Terminal commands, Git workflows, npm scripts-all organized by topic with clear explanations so you never feel lost." },
          { icon: <Shield className="h-5 w-5" />, title: "Error-Handling Snippets", desc: "Common errors and their exact fixes. When something breaks, find the solution instantly instead of scrolling through Stack Overflow." },
          { icon: <Zap className="h-5 w-5" />, title: "Structured by Lesson", desc: "Every lesson comes with its own prompt tab-Prompts, Commands, and Error Handling-so you always have the right tool at the right time." },
        ],
      },
      {
        title: "How It Works",
        steps: [
          { num: "01", title: "Open Any Lesson", desc: "Navigate to any lesson in your course. The prompt library loads automatically alongside your video and setup content." },
          { num: "02", title: "Browse by Tab", desc: "Switch between Prompts, Commands, and Error Handling tabs to find exactly what you need for the current task." },
          { num: "03", title: "One-Click Copy", desc: "Hit the copy button on any snippet. It's instantly on your clipboard-paste it into your code editor, terminal, or browser." },
          { num: "04", title: "Learn While Doing", desc: "Each prompt includes context about what it does and why, so you're not just copying-you're understanding." },
        ],
      },
    ],
    stats: [
      { value: "500+", label: "Ready-to-use prompts" },
      { value: "100+", label: "Error-fix snippets" },
      { value: "1-click", label: "Copy & paste" },
    ],
    testimonial: {
      quote: "I used to spend 30 minutes Googling every error. Now I just open the prompt tab and the fix is right there.",
      role: "Web Development Student",
    },
  },
  "resume-builder": {
    hero: {
      badge: "Get Hired",
      title: "Resume Builder",
      subtitle: "Craft a professional, ATS-friendly resume in minutes-not hours. Our guided wizard walks you through every step, from summary to skills, and exports a polished PDF instantly.",
      gradient: "from-blue-600 to-cyan-600",
      accentColor: "blue",
    },
    sections: [
      {
        title: "Build Your Resume in 4 Simple Steps",
        items: [
          { icon: <FileText className="h-5 w-5" />, title: "Step 1-Fill Your Details", desc: "Enter your name, contact, summary, skills (up to 15), education, experience with bullet points, projects, and certifications-all guided with character limits and tips." },
          { icon: <Presentation className="h-5 w-5" />, title: "Step 2-Pick a Template", desc: "Choose between Modern and Classic professional templates designed to pass ATS scanners and impress recruiters." },
          { icon: <Eye className="h-5 w-5" />, title: "Step 3-Review & Perfect", desc: "Preview your resume exactly as it will look when printed. Make final tweaks and ensure everything reads perfectly." },
          { icon: <ArrowRight className="h-5 w-5" />, title: "Step 4-Download PDF", desc: "One-click PDF export. Your resume is ready to send to recruiters, upload to job portals, or share on LinkedIn." },
        ],
      },
      {
        title: "Why Our Resume Builder Stands Out",
        steps: [
          { num: "01", title: "Auto-Filled from Your Profile", desc: "Your name and email are pre-filled from your account. No retyping the basics every time." },
          { num: "02", title: "Smart Validation", desc: "Built-in checks ensure you don't forget critical fields. Character limits keep your content concise and impactful." },
          { num: "03", title: "Auto-Saved Drafts", desc: "Your progress is saved automatically. Come back anytime and pick up right where you left off." },
          { num: "04", title: "Industry-Ready Templates", desc: "Templates designed by professionals who know what hiring managers look for. Clean, scannable, and modern." },
        ],
      },
    ],
    stats: [
      { value: "4 Steps", label: "From blank to done" },
      { value: "2 Templates", label: "Modern & Classic" },
      { value: "Instant", label: "PDF download" },
    ],
    testimonial: {
      quote: "I built my resume in 15 minutes and got a callback the same week. The templates are clean and professional.",
      role: "Full-Stack Student",
    },
  },
  "real-client-lab": {
    hero: {
      badge: "Real Experience",
      title: "Real Client Lab",
      subtitle: "Don't just learn-build. Work on actual projects from real clients, get mentor feedback on every submission, and walk away with portfolio-ready work that proves you can deliver.",
      gradient: "from-purple-600 to-pink-600",
      accentColor: "purple",
    },
    sections: [
      {
        title: "How the Real Client Lab Works",
        items: [
          { icon: <Target className="h-5 w-5" />, title: "Real Client Projects", desc: "Companies submit actual project briefs-landing pages, dashboards, APIs, mobile designs. You pick up tasks just like in a real job." },
          { icon: <Users className="h-5 w-5" />, title: "Mentor-Reviewed Work", desc: "Every submission is reviewed by an experienced mentor. You get real feedback-what's great, what needs improvement, and how to fix it." },
          { icon: <Award className="h-5 w-5" />, title: "Portfolio-Ready Output", desc: "Every completed project becomes a portfolio piece. Show employers you've built real things for real people, not just tutorials." },
          { icon: <TrendingUp className="h-5 w-5" />, title: "Unlock with Core Trilogy", desc: "Real Client Lab unlocks when Vibe Coding, Prompt Engineering, and Prompt to Profit are each completed at 100%. AI Automations is bonus and not required." },
        ],
      },
      {
        title: "Your Journey in the Real Client Lab",
        steps: [
          { num: "01", title: "Get the All Pack", desc: "Real Client Lab is included with the All Pack. Buy all three main courses (Vibe Coding, Prompt Engineering, Prompt to Profit) to unlock access. AI Automations unlocks as a bonus with the All Pack." },
          { num: "02", title: "Pick a Project", desc: "Browse available client projects. Each one has a clear scope, deadline, and list of tasks. Choose what excites you." },
          { num: "03", title: "Submit Your Work", desc: "Complete tasks, submit your PR/work link with notes, and wait for mentor review. Just like a real development workflow." },
          { num: "04", title: "Iterate & Ship", desc: "Get feedback, make changes, and resubmit until approved. This cycle is exactly how professional teams work." },
        ],
      },
    ],
    stats: [
      { value: "100%", label: "Each core course required" },
      { value: "Real", label: "Client briefs" },
      { value: "1-on-1", label: "Mentor feedback" },
    ],
    testimonial: {
      quote: "The client lab project I completed became the centerpiece of my portfolio. It's what got me my first freelance gig.",
      role: "Frontend Developer Student",
    },
  },
  "learning-portal": {
    hero: {
      badge: "Your Dashboard",
      title: "Learning Portal",
      subtitle: "A clean, intuitive LMS designed around how you actually learn. Track your progress, jump into lessons, catch upcoming events-all from one beautiful dashboard.",
      gradient: "from-fuchsia-600 to-rose-600",
      accentColor: "fuchsia",
    },
    sections: [
      {
        title: "Everything in One Place",
        items: [
          { icon: <LayoutDashboard className="h-5 w-5" />, title: "Personalized Dashboard", desc: "See your name, current course, upcoming schedule, and progress-all at a glance the moment you log in." },
          { icon: <Clock className="h-5 w-5" />, title: "Smart Schedule", desc: "Your remaining lessons are laid out as a timeline. See what's next, what's in progress, and what's done. Click to jump directly into any lesson." },
          { icon: <Star className="h-5 w-5" />, title: "Progress Tracking", desc: "A visual progress ring shows your overall completion percentage. Know exactly where you stand and how much is left." },
          { icon: <Sparkles className="h-5 w-5" />, title: "Events & Workshops", desc: "Live sessions, challenges, and workshops appear right in your sidebar. Never miss an opportunity to learn something new." },
        ],
      },
      {
        title: "Designed for Learners",
        steps: [
          { num: "01", title: "No Clutter", desc: "We stripped away everything unnecessary. You see your courses, your progress, and your next step. That's it." },
          { num: "02", title: "Course Tree Navigation", desc: "Expand any course to see all modules and lessons. Click any lesson to jump directly to it-no hunting through menus." },
          { num: "03", title: "Buy & Unlock Instantly", desc: "See a course you want? Buy it directly from your dashboard. Payment processes in seconds and you're learning immediately." },
          { num: "04", title: "Mobile-Friendly", desc: "Learn from your phone, tablet, or laptop. The portal adapts seamlessly to any screen size." },
        ],
      },
    ],
    stats: [
      { value: "2K+", label: "Active users" },
      { value: "100%", label: "Mobile responsive" },
      { value: "Real-time", label: "Progress sync" },
    ],
    testimonial: {
      quote: "This is the cleanest LMS I've ever used. I always know exactly where I am and what to do next.",
      role: "UI/UX Design Student",
    },
  },
  "structured-lessons": {
    hero: {
      badge: "Step by Step",
      title: "Structured Lessons",
      subtitle: "Every lesson follows a proven structure-Goal, Video, Setup, Prompts, Presentation, and Success Checkpoint. You always know what to learn, how to learn it, and when you've nailed it.",
      gradient: "from-indigo-600 to-blue-600",
      accentColor: "indigo",
    },
    sections: [
      {
        title: "Inside Every Lesson",
        items: [
          { icon: <Target className="h-5 w-5" />, title: "Learning Goal", desc: "Each lesson starts with a clear goal-what you'll be able to do by the end. No ambiguity, no guessing what's important." },
          { icon: <Video className="h-5 w-5" />, title: "Video Tutorials", desc: "High-quality video tutorials on every topic. Supports Cloudflare Stream, YouTube, and Vimeo-all with a clean, distraction-free player." },
          { icon: <BookOpen className="h-5 w-5" />, title: "Learn & Setup Steps", desc: "Step-by-step written instructions that walk you through the setup. Follow along at your own pace with numbered, navigable steps." },
          { icon: <Eye className="h-5 w-5" />, title: "Success Looks Like", desc: "See exactly what the final output should look like with reference images. Compare your work and know you're on the right track." },
        ],
      },
      {
        title: "The Full Lesson Flow",
        steps: [
          { num: "01", title: "Read the Goal", desc: "Understand what this lesson will teach you. The goal appears prominently at the top so you start with clarity." },
          { num: "02", title: "Watch the Video", desc: "Follow along with the video tutorial. Pause, rewind, replay-learn at your own pace." },
          { num: "03", title: "Use Prompts & Setup", desc: "Copy code snippets from the Prompts tab. Follow the Learn & Setup steps to build the project hands-on." },
          { num: "04", title: "Check Your Work", desc: "Compare your output against the Success images. If it matches, mark the lesson complete and move to the next one." },
        ],
      },
    ],
    stats: [
      { value: "6 Parts", label: "Per lesson structure" },
      { value: "100%", label: "Hands-on learning" },
      { value: "Clear", label: "Success criteria" },
    ],
    testimonial: {
      quote: "I love that every lesson has a goal and a 'success looks like' section. I never feel lost or unsure if I did it right.",
      role: "Backend Development Student",
    },
  },
  "jobs-search-hub": {
    hero: {
      badge: "Career Command Center",
      title: "Jobs Search Hub",
      subtitle:
        "Your India-first career command center inside ExpoGraph: pick Software, ECE, Mechanical, Civil or Business tracks, tune keyword chips, and open perfect searches on LinkedIn, Naukri, Indeed, Internshala & more - no scraping, no server cost, all on your device.",
      gradient: "from-emerald-600 to-teal-600",
      accentColor: "emerald",
    },
    sections: [
      {
        title: "Built for Daily Job Search",
        items: [
          { icon: <TrendingUp className="h-5 w-5" />, title: "Role taxonomy", desc: "Category → sub-role presets with default & optional keywords for B.Tech paths beyond only software." },
          { icon: <Globe className="h-5 w-5" />, title: "Platform-aware URLs", desc: "We build safe search links per portal. Unsupported filters fold into keywords so nothing breaks." },
          { icon: <ExternalLink className="h-5 w-5" />, title: "You apply on the real site", desc: "ExpoGraph never stores job listings. Every apply happens on LinkedIn, Naukri, or the portal you choose." },
          { icon: <Shield className="h-5 w-5" />, title: "Privacy-first", desc: "Saved searches and apply status live in your browser (localStorage). Nothing extra hits our servers." },
        ],
      },
      {
        title: "How to Use It",
        steps: [
          { num: "01", title: "Pick a preset or chips", desc: "Choose a track or type keywords - up to 12 chips to keep URLs sane." },
          { num: "02", title: "Set location & filters", desc: "City, remote/hybrid, experience band, date posted - mapped where each site supports it." },
          { num: "03", title: "Select platforms", desc: "Multi-select portals or hit Search all to open every partner in a new tab." },
          { num: "04", title: "Track & iterate", desc: "Save named searches, copy keyword strings, and mark Applied / Interview / Rejected per search template." },
        ],
      },
    ],
    stats: [
      { value: "11+", label: "Job portals" },
      { value: "0", label: "Server jobs stored" },
      { value: "100%", label: "Redirect-only" },
    ],
    testimonial: {
      quote: "I open the hub every morning - same keywords across Naukri and LinkedIn without typing them five times.",
      role: "Final Year B.Tech Student",
    },
  },
  "startup-launchpad": {
    hero: {
      badge: "Founder Operating System",
      title: "Startup LaunchPad",
      subtitle:
        "Your startup path, in the right order. Unlocks with the All Pack or all three main courses (Vibe Coding, Prompt Engineering, Prompt to Profit). A guided founder journey from idea to MVP, launch, legal setup, and growth-inside the student LMS, not a course flow.",
      gradient: "from-orange-600 to-amber-600",
      accentColor: "orange",
    },
    sections: [
      {
        title: "What you get",
        items: [
          { icon: <Map className="h-5 w-5" />, title: "12-stage founder path", desc: "Idea → problem → customer → validation → business model → MVP → branding → launch → first users → revenue → legal setup → growth. Locked until you complete the previous step." },
          { icon: <ClipboardList className="h-5 w-5" />, title: "Startup Readiness Check", desc: "A short diagnostic-not a test-that estimates your stage, readiness score, and three next actions." },
          { icon: <LayoutDashboard className="h-5 w-5" />, title: "Founder dashboard", desc: "A control center: current stage, progress, next step, profile snapshot, tools, and Founder Guide prompts." },
          { icon: <Shield className="h-5 w-5" />, title: "Legal timing", desc: "Registration and structure guidance appears when it makes sense-after clarity, not before." },
        ],
      },
      {
        title: "How to use it",
        steps: [
          { num: "01", title: "Open LaunchPad", desc: "Unlock with All Pack or all three main courses, then open Startup LaunchPad from the LMS sidebar. Start with Readiness or jump into your path." },
          { num: "02", title: "Run Readiness (optional)", desc: "Answer quick questions to see your stage and suggested focus." },
          { num: "03", title: "Work each stage", desc: "Use action cards, warnings, and expected outputs-then mark the step complete to unlock the next." },
          { num: "04", title: "Use tools & guide", desc: "Open Founder Tools for templates, and Ask Founder Guide for decision prompts (AI can plug in later)." },
        ],
      },
    ],
    stats: [
      { value: "12", label: "Stages in order" },
      { value: "1", label: "Founder dashboard" },
      { value: "0", label: "Course-style flows" },
    ],
    testimonial: {
      quote: "It feels like a startup control center-not another list of videos to watch.",
      role: "Student Founder",
    },
  },
};

const accentColors = {
  violet: {
    text: "text-violet-400",
    bg: "bg-violet-500/10",
    border: "border-violet-500/20",
    gradient: "from-violet-600 to-purple-600",
    ring: "ring-violet-500/30",
    hoverBg: "hover:bg-violet-500/20",
    solidBg: "bg-violet-600",
    solidHover: "hover:bg-violet-700",
  },
  blue: {
    text: "text-blue-400",
    bg: "bg-blue-500/10",
    border: "border-blue-500/20",
    gradient: "from-blue-600 to-cyan-600",
    ring: "ring-blue-500/30",
    hoverBg: "hover:bg-blue-500/20",
    solidBg: "bg-blue-600",
    solidHover: "hover:bg-blue-700",
  },
  purple: {
    text: "text-purple-400",
    bg: "bg-purple-500/10",
    border: "border-purple-500/20",
    gradient: "from-purple-600 to-pink-600",
    ring: "ring-purple-500/30",
    hoverBg: "hover:bg-purple-500/20",
    solidBg: "bg-purple-600",
    solidHover: "hover:bg-purple-700",
  },
  fuchsia: {
    text: "text-fuchsia-400",
    bg: "bg-fuchsia-500/10",
    border: "border-fuchsia-500/20",
    gradient: "from-fuchsia-600 to-rose-600",
    ring: "ring-fuchsia-500/30",
    hoverBg: "hover:bg-fuchsia-500/20",
    solidBg: "bg-fuchsia-600",
    solidHover: "hover:bg-fuchsia-700",
  },
  indigo: {
    text: "text-indigo-400",
    bg: "bg-indigo-500/10",
    border: "border-indigo-500/20",
    gradient: "from-indigo-600 to-blue-600",
    ring: "ring-indigo-500/30",
    hoverBg: "hover:bg-indigo-500/20",
    solidBg: "bg-indigo-600",
    solidHover: "hover:bg-indigo-700",
  },
  emerald: {
    text: "text-emerald-400",
    bg: "bg-emerald-500/10",
    border: "border-emerald-500/20",
    gradient: "from-emerald-600 to-teal-600",
    ring: "ring-emerald-500/30",
    hoverBg: "hover:bg-emerald-500/20",
    solidBg: "bg-emerald-600",
    solidHover: "hover:bg-emerald-700",
  },
  orange: {
    text: "text-orange-400",
    bg: "bg-orange-500/10",
    border: "border-orange-500/20",
    gradient: "from-orange-600 to-amber-600",
    ring: "ring-orange-500/30",
    hoverBg: "hover:bg-orange-500/20",
    solidBg: "bg-orange-600",
    solidHover: "hover:bg-orange-700",
  },
};

export default function FeatureDetailPage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { token, role } = useAuth();
  const [studentMe, setStudentMe] = useState(null);
  const [studentMeLoading, setStudentMeLoading] = useState(false);

  useEffect(() => {
    if (slug !== "startup-launchpad" || role !== "Student" || !token) {
      setStudentMe(null);
      setStudentMeLoading(false);
      return;
    }
    let cancelled = false;
    setStudentMeLoading(true);
    (async () => {
      try {
        const res = await apiFetch("/api/v1/me", { token });
        if (!cancelled && res?.ok) setStudentMe(res.data || null);
      } catch {
        if (!cancelled) setStudentMe(null);
      } finally {
        if (!cancelled) setStudentMeLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [slug, role, token]);
  const portalPath = token && role ? homePathForRole(role) : "/login";
  const portalLabel = token && role ? "LMS Portal" : "Login";
  const { pathname } = useLocation();
  const detail = featureDetails[slug];
  const feature = featureData.find((f) => f.slug === slug);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
  }, [pathname]);

  if (!detail || !feature) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-4">Feature not found</h1>
          <Link to="/academy" className="text-violet-400 hover:underline">Back to Academy</Link>
        </div>
      </div>
    );
  }

  const colors = accentColors[detail.hero.accentColor];
  const currentIndex = featureData.findIndex((f) => f.slug === slug);
  const prevFeature = currentIndex > 0 ? featureData[currentIndex - 1] : null;
  const nextFeature = currentIndex < featureData.length - 1 ? featureData[currentIndex + 1] : null;

  return (
    <div
      className="min-h-screen relative w-full"
      style={{ fontFamily: "var(--font-dm)", backgroundColor: "black", color: "white" }}
    >
      <Header />

      <div className="overflow-x-hidden">
        {/* Hero */}
        <section className="relative pt-28 sm:pt-32 pb-16 sm:pb-20 px-4 sm:px-6 md:px-8 lg:px-12 xl:px-24">
          <div className={`absolute inset-0 bg-gradient-to-b ${detail.hero.gradient} opacity-[0.06]`} />
          <div className="relative max-w-4xl mx-auto">
            <div className="flex justify-start mb-8">
              <button
                onClick={() => navigate("/academy#features")}
                className="inline-flex items-center gap-1.5 text-sm text-white/50 hover:text-white/80 transition-colors"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Features
              </button>
            </div>
            <div className="text-center">
            <span className={`inline-block text-xs sm:text-sm font-semibold tracking-widest uppercase px-3 py-1 rounded-full border mb-5 ${colors.bg} ${colors.text} ${colors.border}`}>
              {detail.hero.badge}
            </span>
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold leading-tight mb-5">
              {detail.hero.title}
            </h1>
            <p className="text-base sm:text-lg md:text-xl text-white/55 max-w-2xl mx-auto leading-relaxed">
              {detail.hero.subtitle}
            </p>

            <div className="relative mx-auto mt-10 max-w-3xl overflow-hidden rounded-2xl border border-white/10 aspect-[2/1] sm:aspect-[21/9]">
              <img
                src={getFeatureCardCover(slug)}
                alt={detail.hero.title}
                className="h-full w-full object-cover"
                loading="lazy"
                decoding="async"
              />
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/40" aria-hidden />
            </div>

            {/* Stats row */}
            <div className="flex flex-wrap items-center justify-center gap-6 sm:gap-10 mt-10">
              {detail.stats.map((s) => (
                <div key={s.label} className="text-center">
                  <div className={`text-2xl sm:text-3xl font-bold ${colors.text}`}>{s.value}</div>
                  <div className="text-xs sm:text-sm text-white/40 mt-1">{s.label}</div>
                </div>
              ))}
            </div>
            </div>
          </div>
        </section>

        {/* Locked callout for Real Client Lab */}
        {slug === "real-client-lab" && (
          <section className="px-4 sm:px-6 md:px-8 lg:px-12 xl:px-24 -mt-4 mb-4">
            <div className="max-w-2xl mx-auto">
              <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-5 text-center">
                <p className="text-amber-200/90 font-medium mb-2">Locked for you?</p>
                <p className="text-sm text-white/70 mb-4">
                  Real Client Lab is available only with the All Pack. Buy all three main courses (Vibe Coding, Prompt Engineering, Prompt to Profit) to unlock. AI Automations is a bonus course included with the All Pack.
                </p>
                <Link
                  to="/courses"
                  className="inline-flex items-center gap-2 px-6 py-2.5 bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 rounded-xl text-amber-200 font-semibold transition-colors"
                >
                  Get All Pack
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </section>
        )}

        {slug === "jobs-search-hub" && (
          <section className="px-4 sm:px-6 md:px-8 lg:px-12 xl:px-24 -mt-4 mb-4">
            <div className="max-w-2xl mx-auto">
              <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-5 text-center">
                <p className="text-emerald-200/90 font-medium mb-2">Included with your LMS access</p>
                <p className="text-sm text-white/70 mb-4">
                  Jobs Search Hub lives in the student portal - role presets, keyword chips, multi-portal search, saved searches & apply tracking. No extra fee.
                </p>
                <Link
                  to={token && role === "Student" ? "/lms/jobs" : "/login"}
                  className="inline-flex items-center gap-2 px-6 py-2.5 bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 rounded-xl text-emerald-200 font-semibold transition-colors"
                >
                  {token && role === "Student" ? "Open Jobs Hub" : "Login to open Jobs Hub"}
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </section>
        )}

        {slug === "startup-launchpad" && (
          <section className="px-4 sm:px-6 md:px-8 lg:px-12 xl:px-24 -mt-4 mb-4">
            <div className="max-w-2xl mx-auto">
              <div className="rounded-2xl border border-orange-500/30 bg-orange-500/10 p-5 text-center">
                <p className="text-orange-200/90 font-medium mb-2">
                  {role === "Student" && token && studentMeLoading
                    ? "Checking your access…"
                    : token && role === "Student" && hasLaunchPadAccess(studentMe)
                      ? "Included with your bundle"
                      : "All Pack or all three main courses"}
                </p>
                <p className="text-sm text-white/70 mb-4">
                  Startup LaunchPad lives in the student portal-a founder path, readiness check, dashboard, tools, and legal timing guidance. Same unlock rule as Real Client Lab and the AI Automations bonus: All Pack, or all three core courses (Vibe Coding, Prompt Engineering, Prompt to Profit).
                </p>
                <div className="flex flex-col sm:flex-row gap-2 justify-center items-stretch">
                  <Link
                    to={token && role === "Student" ? "/lms/startup-launchpad" : "/login"}
                    className="inline-flex items-center justify-center gap-2 px-6 py-2.5 bg-orange-500/20 hover:bg-orange-500/30 border border-orange-500/40 rounded-xl text-orange-200 font-semibold transition-colors"
                  >
                    {token && role === "Student" ? "Open Startup LaunchPad" : "Login to open LaunchPad"}
                    <Rocket className="h-4 w-4" />
                  </Link>
                  <Link
                    to="/courses#pricing"
                    className="inline-flex items-center justify-center gap-2 px-6 py-2.5 border border-amber-500/35 rounded-xl text-amber-200/95 font-semibold hover:bg-amber-500/10 transition-colors text-sm"
                  >
                    View All Pack pricing
                  </Link>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Section 1-Feature grid */}
        <section
          className="py-14 sm:py-16 md:py-20 px-4 sm:px-6 md:px-8 lg:px-12 xl:px-24"
          style={{ borderTop: "1px solid rgba(255, 255, 255, 0.06)" }}
        >
          <div className="max-w-5xl mx-auto">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-center mb-10 sm:mb-14">
              {detail.sections[0].title}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
              {detail.sections[0].items.map((item) => (
                <div
                  key={item.title}
                  className={`group relative rounded-2xl border p-5 sm:p-6 transition-all duration-300 hover:scale-[1.02] ${colors.border} bg-white/[0.02] hover:bg-white/[0.04]`}
                >
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-4 ${colors.bg} ${colors.text}`}>
                    {item.icon}
                  </div>
                  <h3 className="text-lg sm:text-xl font-semibold text-white mb-2">{item.title}</h3>
                  <p className="text-sm sm:text-[15px] text-white/50 leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Section 2-Steps */}
        <section
          className="py-14 sm:py-16 md:py-20 px-4 sm:px-6 md:px-8 lg:px-12 xl:px-24"
          style={{ borderTop: "1px solid rgba(255, 255, 255, 0.06)" }}
        >
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-center mb-10 sm:mb-14">
              {detail.sections[1].title}
            </h2>
            <div className="space-y-4 sm:space-y-5">
              {detail.sections[1].steps.map((step) => (
                <div
                  key={step.num}
                  className={`flex gap-4 sm:gap-6 items-start rounded-2xl border p-5 sm:p-6 transition-all duration-300 hover:bg-white/[0.03] ${colors.border}`}
                >
                  <span className={`shrink-0 text-2xl sm:text-3xl font-bold ${colors.text} opacity-60`}>
                    {step.num}
                  </span>
                  <div>
                    <h3 className="text-lg sm:text-xl font-semibold text-white mb-1.5">{step.title}</h3>
                    <p className="text-sm sm:text-[15px] text-white/50 leading-relaxed">{step.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Testimonial */}
        <section
          className="py-14 sm:py-16 md:py-20 px-4 sm:px-6 md:px-8 lg:px-12 xl:px-24"
          style={{ borderTop: "1px solid rgba(255, 255, 255, 0.06)" }}
        >
          <div className="max-w-3xl mx-auto text-center">
            <Heart className={`h-8 w-8 mx-auto mb-6 ${colors.text} opacity-50`} />
            <blockquote className="text-xl sm:text-2xl md:text-3xl font-medium text-white/80 leading-snug italic">
              "{detail.testimonial.quote}"
            </blockquote>
            <p className="mt-4 text-sm sm:text-base text-white/40">-{detail.testimonial.role}</p>
          </div>
        </section>

        {/* Explore other features */}
        <section
          className="py-14 sm:py-16 md:py-20 px-4 sm:px-6 md:px-8 lg:px-12 xl:px-24"
          style={{ borderTop: "1px solid rgba(255, 255, 255, 0.06)" }}
        >
          <div className="max-w-4xl mx-auto">
            <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-center mb-8 sm:mb-10">
              Explore Other Features
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              {featureData
                .filter((f) => f.slug !== slug)
                .map((f) => {
                  const fd = featureDetails[f.slug];
                  const fc = accentColors[fd.hero.accentColor];
                  return (
                    <Link
                      key={f.slug}
                      to={`/features/${f.slug}`}
                      className={`group flex items-center gap-4 rounded-xl border p-4 sm:p-5 transition-all duration-300 hover:bg-white/[0.04] ${fc.border}`}
                    >
                      <div className={`shrink-0 w-10 h-10 rounded-lg flex items-center justify-center ${fc.bg} ${fc.text}`}>
                        {f.icon}
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="text-base sm:text-lg font-semibold text-white truncate">{f.title}</h3>
                        <p className="text-xs sm:text-sm text-white/40 truncate">{fd.hero.badge}</p>
                      </div>
                      <ArrowRight className="h-4 w-4 text-white/30 group-hover:text-white/60 transition-colors shrink-0" />
                    </Link>
                  );
                })}
            </div>
          </div>
        </section>

        {/* CTA section */}
        <section
          className="relative py-16 sm:py-20 md:py-24 px-4 sm:px-6 md:px-8 lg:px-12 xl:px-24"
          style={{ borderTop: "1px solid rgba(255, 255, 255, 0.06)" }}
        >
          <div className="max-w-4xl mx-auto text-center">
            <span className={`inline-block text-xs font-semibold tracking-widest uppercase px-3 py-1 rounded-full border mb-4 ${colors.bg} ${colors.text} ${colors.border}`}>
              Ready to Start?
            </span>
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-4 leading-tight">
              Start learning with{" "}
              <span className={`bg-gradient-to-r ${colors.gradient} text-transparent bg-clip-text`}>
                ExpoGraph
              </span>
            </h2>
            <p className="text-sm sm:text-base md:text-lg text-white/45 max-w-xl mx-auto mb-8">
              Join 2K+ users who are building real skills, real projects, and real careers with Vibe Coding, Prompt Engineering & AI Automations. Your journey starts now.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4">
              <Link
                to="/courses"
                className={`inline-flex items-center gap-2 px-6 py-3 sm:px-8 sm:py-3.5 rounded-full text-white font-medium transition-all ${colors.solidBg} ${colors.solidHover}`}
              >
                Browse Courses
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                to={portalPath}
                className="inline-flex items-center gap-2 px-6 py-3 sm:px-8 sm:py-3.5 rounded-full text-white/70 font-medium border border-white/10 hover:border-white/20 hover:text-white transition-all"
              >
                {portalLabel}
              </Link>
            </div>
          </div>
        </section>

        {/* Prev/Next navigation */}
        {(prevFeature || nextFeature) && (
          <div className="px-4 sm:px-6 md:px-8 lg:px-12 xl:px-24 py-6 bg-black border-t border-white/[0.04]">
            <div className="max-w-4xl mx-auto flex items-center justify-between">
              {prevFeature ? (
                <Link
                  to={`/features/${prevFeature.slug}`}
                  className="flex items-center gap-2 text-sm text-white/40 hover:text-white/70 transition-colors"
                >
                  <ArrowLeft className="h-4 w-4" />
                  <span className="hidden sm:inline">{prevFeature.title}</span>
                  <span className="sm:hidden">Previous</span>
                </Link>
              ) : <div />}
              {nextFeature ? (
                <Link
                  to={`/features/${nextFeature.slug}`}
                  className="flex items-center gap-2 text-sm text-white/40 hover:text-white/70 transition-colors"
                >
                  <span className="hidden sm:inline">{nextFeature.title}</span>
                  <span className="sm:hidden">Next</span>
                  <ArrowRight className="h-4 w-4" />
                </Link>
              ) : <div />}
            </div>
          </div>
        )}

        {/* Footer-ExpoGraph flow (TubesBackground) */}
        <footer className="w-full min-h-[560px] sm:min-h-[70vh] border-t border-black">
          <TubesBackground className="min-h-[560px] sm:min-h-[70vh] bg-[#0a0a0a]" enableClickInteraction={true}>
            <FlowTubesFooterInner shellClassName="min-h-[560px] sm:min-h-[70vh]" />
          </TubesBackground>
        </footer>
      </div>
    </div>
  );
}