import { useNavigate, useLocation, Link } from "react-router-dom";
import { createElement, lazy, Suspense, useState, useCallback, useEffect, useRef, memo } from "react";
import { useAuth } from "../../app/providers/AuthProvider";
import { homePathForRole } from "../../app/roles";
import { Header } from "../../Components/ui/header-2";
import HeroSection from "../../Components/ui/hero-section-9";
import CallToAction1 from "../../Components/ui/call-to-action-1";
import { FiUsers as Users, FiBriefcase as Briefcase, FiChevronDown, FiZap } from "react-icons/fi";
import { AcademyFeaturesGrid } from "../../Components/ui/academy-features-grid";
import { AcademyFeaturesGridLite } from "../../Components/ui/academy-features-grid-lite";
import { AcademyCourseCardsSection } from "../../Components/ui/AcademyCourseCardsSection";
import { TubesBackground } from "../../Components/ui/neon-flow";
import FlowTubesFooterInner from "../../Components/ui/FlowTubesFooterInner";
import { LazyMount } from "../../Components/LazyMount";
import { GlowingEffect } from "../../Components/ui/glowing-effect";
import { MCA_LOGO_URL, MSME_LOGO_URL } from "../../constants/trustLogos";

const isMobile = typeof window !== "undefined" && window.innerWidth < 768;

const InteractiveRobotSpline = isMobile
  ? null
  : lazy(() => import("../../Components/ui/interactive-3d-robot").then((m) => ({ default: m.InteractiveRobotSpline })));

function HeroSkeleton() {
  return (
    <div className="w-full h-screen bg-black flex items-center justify-center animate-pulse">
      <div className="w-full max-w-xl px-8 space-y-6">
        {/* Tailwind classes with / - use template literals so the JSX lexer stays unambiguous */}
        <div className={`h-4 bg-white/[0.06] rounded-full w-2/3`} />
        <div className={`h-12 bg-white/[0.06] rounded-xl w-full`} />
        <div className={`h-12 bg-white/[0.06] rounded-xl w-3/4`} />
        <div className={`h-4 bg-white/[0.06] rounded-full w-full mt-6`} />
        <div className={`h-4 bg-white/[0.06] rounded-full w-4/5`} />
        <div className="flex gap-4 mt-8">
          <div className={`h-12 bg-white/[0.06] rounded-full w-36`} />
          <div className={`h-12 bg-white/[0.06] rounded-full w-28`} />
        </div>
      </div>
    </div>
  );
}

const heroStatIconClass = "h-5 w-5 text-muted-foreground";
const HERO_SECTION_STATS = [
  { value: "2K", label: "Active users", icon: createElement(Users, { className: heroStatIconClass }) },
  { value: "100+", label: "Tutors", icon: createElement(Briefcase, { className: heroStatIconClass }) },
];

const reviewsRow1 = [
  { name: "Arjun S.", role: "Vibe Coding Student", text: "The Vibe Coding course taught me to build full apps using smart prompts. I shipped my first SaaS in 2 weeks-at ₹99, this is unreal.", rating: 5, highlight: "Vibe Coding" },
  { name: "Priya M.", role: "AI Automations Student", text: "The AI Automations course is next level. I automated my entire workflow and landed a freelance gig through Real Client Lab in 3 weeks.", rating: 5, highlight: "AI Automations" },
  { name: "Rahul K.", role: "CS Student, 3rd Year", text: "Paid ₹15,000 elsewhere for worse content. Vibe Coding + Prompt Engineering at ₹99 each? ExpoGraph is honestly criminal-in a good way.", rating: 5, highlight: "Unbeatable Value" },
  { name: "Sneha D.", role: "Prompt Engineering Student", text: "Prompt Engineering taught me how to think like a 10x developer. The resume builder + MCA & MSME-recognised certificate helped me crack 3 interviews.", rating: 5, highlight: "Prompt Engineering" },
  { name: "Karthik V.", role: "Startup Founder", text: "I built my entire MVP using Vibe Coding techniques from ExpoGraph. Saved me lakhs in hiring costs-all from a ₹99 course.", rating: 5, highlight: "Vibe Coding" },
  { name: "Meera J.", role: "B.Tech Student", text: "Took all 3 courses-Vibe Coding, Prompt Engineering, and AI Automations. Other platforms make you watch. ExpoGraph makes you BUILD.", rating: 5, highlight: "All 3 Courses" },
];

const reviewsRow2 = [
  { name: "Vikram T.", role: "Freelancer", text: "AI Automations + Real Client Lab = real portfolio pieces. Clients don't care about tutorials-they care about real work you've shipped.", rating: 5, highlight: "Real Client Lab" },
  { name: "Ananya R.", role: "BCA Student", text: "Started with Prompt Engineering, then Vibe Coding-went from zero to building full apps in 8 weeks. The structured lessons are brilliant.", rating: 5, highlight: "Zero to Builder" },
  { name: "Deepak P.", role: "Working Professional", text: "The Vibe Coding course respects your time. No fluff-just pure, actionable skills I use at my job daily. Worth every paisa.", rating: 5, highlight: "No Filler" },
  { name: "Riya G.", role: "MCA Student", text: "The MCA & MSME-recognised certificate with a unique ID got me 2 interview calls in a week. Employers were genuinely impressed.", rating: 5, highlight: "Verified Certificate" },
  { name: "Aditya N.", role: "All-Access Pack User", text: "₹199 for all 3 courses-Vibe Coding, Prompt Engineering, AI Automations + Real Client Lab + Resume Builder. Best investment of my life.", rating: 5, highlight: "All-Access Pack" },
  { name: "Pooja S.", role: "Prompt Engineering Student", text: "Prompt Engineering changed everything. I'm 3x faster, building AI-powered tools, and charging premium freelance rates now.", rating: 5, highlight: "Prompt Engineering" },
];

const ReviewCard = memo(function ReviewCard({ r }) {
  const colors = {
    "Vibe Coding": "text-fuchsia-400 bg-fuchsia-500/10 border-fuchsia-500/20",
    "AI Automations": "text-violet-400 bg-violet-500/10 border-violet-500/20",
    "Prompt Engineering": "text-indigo-400 bg-indigo-500/10 border-indigo-500/20",
    "Unbeatable Value": "text-amber-400 bg-amber-500/10 border-amber-500/20",
    "Real Client Lab": "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
    "All 3 Courses": "text-cyan-400 bg-cyan-500/10 border-cyan-500/20",
    "Zero to Builder": "text-blue-400 bg-blue-500/10 border-blue-500/20",
    "No Filler": "text-orange-400 bg-orange-500/10 border-orange-500/20",
    "Verified Certificate": "text-amber-400 bg-amber-500/10 border-amber-500/20",
    "All-Access Pack": "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
  };

  const c = colors[r.highlight] || "text-white/60 bg-white/5 border-white/10";

  return (
    <div className="w-[280px] sm:w-[320px] md:w-[360px] shrink-0 rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5 sm:p-6 flex flex-col">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-1">
          {[...Array(r.rating)].map((_, s) => (
            <svg key={s} className="w-3.5 h-3.5 text-amber-400" viewBox="0 0 20 20" fill="currentColor">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
          ))}
        </div>
        <span className={`text-[10px] sm:text-[11px] font-semibold px-2 py-0.5 rounded-full border ${c}`}>
          {r.highlight}
        </span>
      </div>
      <p className="text-sm text-white/60 leading-relaxed flex-1 mb-4">"{r.text}"</p>
      <div className="flex items-center gap-2.5 pt-3 border-t border-white/[0.06]">
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center text-xs font-bold text-white shrink-0">
          {r.name[0]}
        </div>
        <div>
          <div className="text-sm font-medium text-white/90">{r.name}</div>
          <div className="text-[11px] text-white/40">{r.role}</div>
        </div>
      </div>
    </div>
  );
});

const faqData = [
  { q: "What is ExpoGraph Academy?", a: "ExpoGraph Academy teaches Vibe Coding, Prompt Engineering & AI Automations through structured lessons, smart prompts, and hands-on projects. You don't just watch-you build." },
  { q: "What courses do you offer?", a: "We offer three focused courses: Vibe Coding (build apps using AI), Prompt Engineering (master the art of prompting), and AI Automations (automate workflows with intelligent automations). Together, they cover everything from building to deploying real-world AI-powered projects." },
  { q: "What are Smart Prompts?", a: "Smart Prompts are structured prompt boxes you can copy and use directly. They help you learn vibe coding-how to think, prompt, and build like a professional developer." },
  { q: "What is the Real Client Lab?", a: "The Real Client Lab connects you with actual clients and real-world projects. You build, deliver, and grow your portfolio with work that matters-not just tutorials." },
  { q: "Do I get a Resume Builder?", a: "Yes! Our built-in Resume Builder helps you create a professional resume using your completed courses, projects, and Real Client Lab work-ready for employers." },
  { q: "How much does it cost?", a: "Each course (Vibe Coding, Prompt Engineering, AI Automations) starts at just ₹99 and our all-access course pack is only ₹199-that's all 3 courses + Real Client Lab + Resume Builder for less than a coffee." },
  { q: "Do I get certificates?", a: "Absolutely. Every course you complete earns you a verifiable certificate with a unique ID-issued by ExpoGraph, a company recognised by MCA and MSME, Government of India." },
  { q: "Is there community support?", a: "Yes! Join our community on Instagram, YouTube, and LinkedIn. Connect with fellow users, get tips, and stay updated on new courses and opportunities." },
  { q: "How is ExpoGraph different from other platforms?", a: "Unlike generic platforms, ExpoGraph focuses on 3 cutting-edge courses-Vibe Coding, Prompt Engineering & AI Automations-with real client projects, smart AI prompts, and a resume builder. Everything you need to actually get hired, not just learn theory." },
];

const SimpleFAQ = memo(function SimpleFAQ() {
  const [openIndex, setOpenIndex] = useState(null);
  const toggle = useCallback((i) => setOpenIndex((prev) => (prev === i ? null : i)), []);

  return (
    <div className="space-y-0">
      {faqData.map((item, i) => (
        <div key={i} className="border-b border-white/10">
          <button
            onClick={() => toggle(i)}
            className="w-full flex items-center gap-4 py-5 text-left text-white transition-all duration-200 hover:text-white/80 hover:pl-1"
          >
            <span className="text-lg md:text-xl text-white/60 tabular-nums">{String(i + 1).padStart(2, "0")}</span>
            <span className="flex-1 text-lg md:text-xl font-medium">{item.q}</span>
            <FiChevronDown className={`w-5 h-5 text-white/40 shrink-0 transition-transform duration-200 ${openIndex === i ? "rotate-180" : ""}`} />
          </button>
          {openIndex === i && (
            <div className="pb-5 pl-12 pr-4 text-base md:text-lg text-white/70 leading-relaxed">
              {item.a}
            </div>
          )}
        </div>
      ))}
    </div>
  );
});

export default function AcademyPage() {
  const { token, role, status } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const heroSectionRef = useRef(null);
  const reviewsSectionRef = useRef(null);
  /** Unmount Spline when hero is off-screen - WebGL competes with scroll compositing. */
  const [heroWebglVisible, setHeroWebglVisible] = useState(true);
  /** Pause infinite marquees when reviews section is off-screen - constant animation = jank. */
  const [reviewsMarqueeActive, setReviewsMarqueeActive] = useState(false);

  useEffect(() => {
    const el = heroSectionRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => setHeroWebglVisible(e.isIntersecting),
      { root: null, rootMargin: "100px 0px 100px 0px", threshold: 0 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    const el = reviewsSectionRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => setReviewsMarqueeActive(e.isIntersecting),
      { root: null, rootMargin: "150px 0px 150px 0px", threshold: 0 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    if (location.hash === "#courses") {
      const el = document.getElementById("courses");
      if (el) {
        const t = setTimeout(() => {
          el.scrollIntoView({ behavior: "smooth", block: "start" });
        }, 100);
        return () => clearTimeout(t);
      }
    }
    window.scrollTo(0, 0);
  }, [location.pathname, location.hash]);

  return (
    <div
      className="academy-page min-h-screen relative w-full"
      style={{
        fontFamily: "var(--font-dm)",
        backgroundColor: "black",
        color: "var(--text-secondary)",
      }}
    >
      <Header />

      <div className="academy-scroll-content overflow-x-hidden">
        {/* Hero Section-Interactive 3D Robot (desktop) / Static bg (mobile) */}
      <section
        ref={heroSectionRef}
        className="relative w-full min-h-[100dvh] sm:min-h-screen h-screen overflow-hidden bg-black"
        style={{ backgroundColor: "#000000", maxWidth: "100vw" }}
      >
        {isMobile ? (
          <div
            className="absolute inset-0 z-0 bg-center bg-cover bg-no-repeat"
            style={{ backgroundImage: "url('/robot-hero-mobile.png')" }}
          />
        ) : heroWebglVisible ? (
          <LazyMount
            initialMount
            placeholderHeight="100vh"
            rootMargin="300px"
            placeholder={<HeroSkeleton />}
            className="absolute inset-0 z-0"
          >
            <Suspense fallback={<HeroSkeleton />}>
              <InteractiveRobotSpline
                scene="https://prod.spline.design/PyzDhpQ9E5f1E3MT/scene.splinecode"
                className="absolute inset-0 z-0 w-full h-full"
              />
            </Suspense>
          </LazyMount>
        ) : (
          <div className="absolute inset-0 z-0 bg-black" aria-hidden />
        )}
        <div
          className="absolute bottom-4 right-4 sm:bottom-5 sm:right-5 z-20 flex items-center justify-center gap-2 min-w-[180px] min-h-[48px] px-6 py-3 bg-black backdrop-blur-sm border border-white/10 rounded-full text-white/70 text-sm font-medium pointer-events-none"
          aria-label="Built with ExpoGraph"
        >
          <span>ExpoGraph Academy</span>
        </div>
        <div className="absolute inset-0 z-[5] bg-gradient-to-b from-black/70 via-black/40 to-black/70 md:from-transparent md:via-transparent md:to-transparent pointer-events-none" />

        <div className="absolute inset-0 z-10 flex flex-col items-center pt-28 sm:pt-32 md:items-start md:pt-28 lg:pt-32 xl:pt-40 px-4 sm:px-6 md:px-8 lg:px-12 xl:px-24 pointer-events-none">
          <div className="text-center md:text-left text-white drop-shadow-lg w-full max-w-full sm:max-w-xl md:max-w-xl lg:max-w-2xl mx-auto md:mx-0 pr-0 md:pr-4">
            <p
              className="text-xs sm:text-sm md:text-base text-white/90 md:text-white/70 font-medium tracking-wide mb-2 sm:mb-2 md:mb-3 animate-[fadeInUp_0.5s_ease-out_both]"
              style={{ fontFamily: "var(--font-dm)", textShadow: "0 2px 8px rgba(0,0,0,0.6)" }}
            >
              Prompt Smart. Vibe Code. Grow Your Career.
            </p>
            <h1
              className="text-[1.7rem] sm:text-3xl md:text-3xl lg:text-4xl xl:text-5xl 2xl:text-6xl font-bold leading-[1.15] mb-0 md:mb-3 animate-[fadeInLeft_0.6s_ease-out_both]"
              style={{ fontFamily: '"Google Sans Flex", "Google Sans", sans-serif', textShadow: "0 2px 12px rgba(0,0,0,0.7)" }}
            >
              Stop learning to code.
              <br />
              <span className="bg-gradient-to-r from-violet-400 to-fuchsia-400 text-transparent bg-clip-text md:from-white/80 md:to-white/80">Start building with AI.</span>
            </h1>
            <p
              className="text-sm sm:text-[15px] md:text-lg text-white md:text-white/60 max-w-xs sm:max-w-sm md:max-w-lg mt-12 sm:mt-14 md:mt-0 mb-0 md:mb-6 leading-relaxed mx-auto md:mx-0 animate-[fadeInUp_0.5s_0.1s_ease-out_both]"
              style={{ fontFamily: "var(--font-dm)", textShadow: "0 2px 10px rgba(0,0,0,0.8)" }}
            >
              Master vibe coding with smart prompts, structured lessons, and build for real clients in our Real Client Lab-the fastest way to grow your career.
            </p>
            <div
              className="flex justify-center md:justify-start gap-3 sm:gap-4 md:gap-4 flex-wrap pointer-events-auto mt-14 sm:mt-16 md:mt-0 animate-[fadeInUp_0.6s_0.15s_ease-out_both]"
            >
              <button
                onClick={() =>
                  status === "authed" ? navigate(homePathForRole(role)) : navigate("/login")
                }
                className="px-5 py-2.5 sm:px-6 sm:py-3 md:px-6 md:py-3 text-white rounded-full text-sm sm:text-sm md:text-base font-semibold cursor-pointer transition-all duration-300 hover:brightness-110 hover:scale-105 hover:shadow-lg hover:shadow-violet-500/25"
                style={{ fontFamily: "var(--font-dm)", background: "linear-gradient(135deg, #7c3aed, #6d28d9)" }}
              >
                {status === "authed" ? "LMS Portal" : "Login"}
              </button>
              <button
                onClick={() => navigate("/courses")}
                className="px-5 py-2.5 sm:px-6 sm:py-3 md:px-6 md:py-3 bg-white/10 text-white border border-white/20 rounded-full text-sm sm:text-sm md:text-base font-semibold cursor-pointer transition-all duration-300 hover:bg-white/20 hover:scale-105 hover:border-white/40"
                style={{ fontFamily: "var(--font-dm)" }}
              >
                Explore Courses
              </button>
            </div>
            {/* Pricing hook */}
            <div
              className="mt-5 sm:mt-6 md:mt-4 animate-[fadeInUp_0.5s_0.25s_ease-out_both] pointer-events-auto"
              style={{ textShadow: "0 2px 8px rgba(0,0,0,0.7)" }}
            >
              <button
                onClick={() => navigate("/courses")}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/15 border border-emerald-400/25 cursor-pointer transition-all duration-300 hover:bg-emerald-500/25 hover:border-emerald-400/50 hover:scale-105 hover:shadow-md hover:shadow-emerald-500/10"
              >
                <span className="text-emerald-400 text-xs sm:text-sm font-bold">Starting at just ₹99</span>
                <span className="text-white/50 text-[10px] sm:text-xs">• Courses from ₹99 | Packs from ₹199</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Learn & Get Knowledge Section (HeroSection) */}
      <section id="learn" className="academy-section-gpu heavy-section" style={{ backgroundColor: "#000000" }}>
        <HeroSection
          className="!bg-black"
          title={
            <>
              Where learning meets <br /> real-world doing
            </>
          }
          subtitle={
            <>
              Master <strong className="text-white/90">Vibe Coding</strong>, <strong className="text-white/90">Prompt Engineering</strong> & <strong className="text-white/90">AI Automations</strong>-with smart prompts, structured lessons, and a{" "}
              <strong className="text-white/90">Real Client Lab</strong> to build for actual clients-all starting at just{" "}
              <strong className="text-emerald-400">₹99</strong>. You don't just learn-you ship real work and grow your career.
            </>
          }
          actions={[
            {
              text: "Join the Family",
              onClick: () => navigate("/courses"),
              variant: "default",
              className: "hover:scale-105 hover:shadow-lg hover:shadow-blue-500/30",
            },
            {
              text: "Connect with us",
              onClick: () => document.getElementById("connect")?.scrollIntoView({ behavior: "smooth" }),
              variant: "outline",
              className: "hover:scale-105 hover:shadow-lg hover:shadow-white/10 hover:border-white/30",
            },
          ]}
          stats={HERO_SECTION_STATS}
          images={[
            "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?q=80&w=2071&auto=format&fit=crop",
            "https://images.unsplash.com/photo-1543269865-cbf427effbad?q=80&w=2070&auto=format&fit=crop",
            "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?q=80&w=2070&auto=format&fit=crop",
          ]}
        />
      </section>

      {/* Course cards (packs & courses) */}
      <section id="courses">
        <AcademyCourseCardsSection />
      </section>

      {/* Designed by top techies & IITians-trust, small impact */}
      <section
        className="py-6 sm:py-8 px-4 sm:px-6 md:px-8 lg:px-12 xl:px-24"
        style={{ backgroundColor: "#000000" }}
      >
        <div className="max-w-3xl mx-auto text-center">
          <p className="text-xs sm:text-sm font-medium tracking-widest uppercase text-amber-400/90 mb-2">
            Built for the real world
          </p>
          <p className="text-base sm:text-lg text-white/90 leading-relaxed">
            Our curriculum and courses are designed by <span className="text-amber-300 font-semibold">top techies and IITians</span>-so you learn what the industry actually uses, not just theory.
          </p>
        </div>
      </section>

      {/* Officially Recognised — MCA & MSME */}
      <section
        className="py-8 sm:py-10 md:py-12 px-4 sm:px-6 md:px-8 lg:px-12 xl:px-24"
        style={{ backgroundColor: "#000000" }}
      >
        <div className="max-w-4xl mx-auto flex flex-col items-center text-center gap-4 sm:gap-5">
          <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-white">Officially Recognised</h2>
          <p className="text-sm sm:text-base text-white/55 max-w-2xl leading-relaxed">
            ExpoGraph is recognised by{" "}
            <span className="text-white/90 font-medium">MCA</span> (Ministry of Corporate Affairs) and{" "}
            <span className="text-white/90 font-medium">MSME</span> (Ministry of Micro, Small &amp; Medium Enterprises), Government of India.
          </p>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-6 sm:gap-10 rounded-2xl border border-white/[0.06] bg-white/[0.02] px-8 sm:px-12 py-8 sm:py-10 w-full">
            <div className="flex flex-col items-center gap-3 flex-1 min-w-0">
              <div className="shrink-0 rounded-xl bg-white p-3 sm:p-4 shadow-sm shadow-black/20">
                <img
                  src={MCA_LOGO_URL}
                  alt="Ministry of Corporate Affairs — Government of India"
                  className="h-14 sm:h-16 md:h-20 w-auto max-w-[200px] object-contain"
                  referrerPolicy="no-referrer"
                  loading="eager"
                  decoding="async"
                />
              </div>
              <div>
                <p className="text-base sm:text-lg font-semibold text-amber-400">MCA</p>
                <p className="text-xs sm:text-sm text-white/55 mt-0.5">Ministry of Corporate Affairs</p>
              </div>
            </div>
            <div className="hidden sm:block w-px self-stretch min-h-[140px] bg-white/10 shrink-0" aria-hidden />
            <div className="sm:hidden h-px w-full max-w-[200px] mx-auto bg-white/10 shrink-0" aria-hidden />
            <div className="flex flex-col items-center gap-3 flex-1 min-w-0">
              <div className="shrink-0 rounded-xl bg-white p-3 sm:p-4 shadow-sm shadow-black/20">
                <img
                  src={MSME_LOGO_URL}
                  alt="Ministry of Micro, Small and Medium Enterprises — Government of India"
                  className="h-14 sm:h-16 md:h-20 w-auto max-w-[200px] object-contain"
                  referrerPolicy="no-referrer"
                  loading="eager"
                  decoding="async"
                />
              </div>
              <div>
                <p className="text-base sm:text-lg font-semibold text-emerald-400">MSME</p>
                <p className="text-xs sm:text-sm text-white/55 mt-0.5">Micro, Small &amp; Medium Enterprises</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action-Join Academy */}
      <section
        id="cta"
        className="py-12 md:py-16 px-4 sm:px-6 md:px-8 lg:px-12 xl:px-24"
        style={{ backgroundColor: "#000000" }}
      >
        <CallToAction1 />
      </section>

      {/* Startup LaunchPad - founder product inside LMS */}
      <section
        id="startup-launchpad"
        className="py-14 sm:py-16 md:py-20 px-4 sm:px-6 md:px-8 lg:px-12 xl:px-24 academy-section-gpu heavy-section"
        style={{ backgroundColor: "#000000" }}
      >
        <div className="max-w-5xl mx-auto rounded-3xl border border-orange-500/20 bg-gradient-to-br from-orange-950/40 via-black/80 to-amber-950/20 overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-10 p-6 sm:p-8 md:p-10 lg:p-12">
            <div>
              <p className="inline-flex items-center gap-2 text-xs sm:text-sm font-semibold tracking-widest uppercase text-orange-300/90 mb-3">
                <FiZap className="w-4 h-4 text-orange-400" aria-hidden />
                New
              </p>
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white leading-tight">
                Startup LaunchPad
              </h2>
              <p className="mt-2 text-lg text-orange-200/90 font-medium">Your startup path, in the right order</p>
              <p className="mt-3 inline-flex flex-wrap items-center gap-2 rounded-xl border border-amber-500/20 bg-amber-500/10 px-3 py-2 text-[11px] sm:text-xs font-semibold uppercase tracking-wide text-amber-200/95">
                All Pack or all three main courses
              </p>
              <p className="mt-4 text-sm sm:text-base text-white/65 leading-relaxed">
                A guided founder journey from idea to MVP, launch, legal setup, and growth-inside the student portal. Progress, readiness, actions, and tools. Not a course flow; a startup control center.
              </p>
              <p className="mt-3 text-xs sm:text-sm text-white/50 leading-relaxed">
                Unlocks with the <span className="text-amber-300/90 font-medium">All Pack</span> or when you own all three core courses (Vibe Coding, Prompt Engineering, Prompt to Profit)-same rule as Real Client Lab and the AI Automations bonus.
              </p>
              <ul className="mt-6 space-y-2 text-sm text-white/70">
                <li className="flex gap-2"><span className="text-orange-400">→</span> 12-stage path with unlocks</li>
                <li className="flex gap-2"><span className="text-orange-400">→</span> Startup Readiness Check + founder dashboard</li>
                <li className="flex gap-2"><span className="text-orange-400">→</span> Founder tools & legal timing guidance</li>
              </ul>
            </div>
            <div className="flex flex-col justify-center gap-3 sm:gap-4">
              <button
                type="button"
                onClick={() => navigate(token && role === "Student" ? "/lms/startup-launchpad" : "/login")}
                className="w-full min-h-[52px] rounded-2xl font-semibold text-white bg-gradient-to-r from-orange-600 to-amber-600 hover:brightness-110 transition shadow-lg shadow-orange-500/20"
              >
                {token && role === "Student" ? "Open Startup LaunchPad" : "Login to open LaunchPad"}
              </button>
              <button
                type="button"
                onClick={() => navigate("/features/startup-launchpad")}
                className="w-full min-h-[48px] rounded-2xl border border-white/15 text-white/90 hover:bg-white/5 transition text-sm font-medium"
              >
                See how it works
              </button>
              <button
                type="button"
                onClick={() => navigate("/courses#pricing")}
                className="w-full min-h-[44px] rounded-2xl border border-amber-500/30 text-amber-200/95 hover:bg-amber-500/10 transition text-sm font-medium"
              >
                View All Pack on Courses
              </button>
              <p className="text-xs text-white/45 text-center lg:text-left">Listed in the LMS sidebar; access follows your All Pack or three-course bundle.</p>
            </div>
          </div>
        </div>
      </section>

      {/* What Features Are There With Us-with glowing effect */}
      <section
        id="features"
        className="py-14 sm:py-16 md:py-20 lg:py-24 px-4 sm:px-6 md:px-8 lg:px-12 xl:px-24 academy-section-gpu heavy-section"
        style={{ backgroundColor: "#000000" }}
      >
        <div className="text-center mb-10 sm:mb-12 md:mb-14">
          <p className="inline-block text-xs sm:text-sm font-medium tracking-widest uppercase text-violet-400 mb-3 px-3 py-1 rounded-full border border-violet-500/20 bg-violet-500/5">
            Built For You
          </p>
          <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-white leading-tight">
            Everything you need to{" "}
            <span className="bg-gradient-to-r from-violet-400 via-purple-400 to-fuchsia-400 text-transparent bg-clip-text">
              succeed
            </span>
          </h2>
          <p className="mt-3 sm:mt-4 text-sm sm:text-base md:text-lg text-white/60 max-w-2xl mx-auto">
            Powerful tools and real-world experience, all in one place-starting at just <span className="text-emerald-400 font-semibold">₹99</span>
          </p>
        </div>
        <div className="relative rounded-2xl sm:rounded-3xl mx-auto max-w-6xl overflow-hidden academy-features-glow-host">
          <GlowingEffect glow disabled={false} syncScroll={false} />
          <div className="relative z-10">
            {isMobile ? (
              <AcademyFeaturesGridLite />
            ) : (
              <AcademyFeaturesGrid />
            )}
          </div>
        </div>
      </section>

      {/* Certification Section */}
      <section
        id="certification"
        className="py-14 sm:py-16 md:py-20 lg:py-24 px-4 sm:px-6 md:px-8 lg:px-12 xl:px-24 academy-section-gpu heavy-section"
        style={{ backgroundColor: "#000000" }}
      >
        <div className="text-center mb-10 sm:mb-12 md:mb-14">
          <p className="inline-block text-xs sm:text-sm font-medium tracking-widest uppercase text-amber-400 mb-3 px-3 py-1 rounded-full border border-amber-500/20 bg-amber-500/5">
            Certified Learning
          </p>
          <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-white leading-tight">
            Earn certificates that{" "}
            <span className="bg-gradient-to-r from-amber-400 via-yellow-400 to-orange-400 text-transparent bg-clip-text">
              matter
            </span>
          </h2>
          <p className="mt-3 sm:mt-4 text-sm sm:text-base md:text-lg text-white/60 max-w-2xl mx-auto">
            Every course you complete comes with a verifiable certificate recognised by MCA &amp; MSME-yours for just{" "}
            <span className="text-amber-400 font-semibold">₹99</span>
          </p>
        </div>

        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8 mb-8 sm:mb-10">
            {/* Certificate card */}
            <div className="relative rounded-2xl border border-amber-500/15 bg-gradient-to-br from-amber-500/5 via-transparent to-orange-500/5 p-6 sm:p-8 overflow-hidden">
              <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-bl from-amber-500/10 to-transparent rounded-bl-full pointer-events-none" />
              <div className="relative">
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
                    <svg className="w-6 h-6 text-amber-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="4" width="18" height="16" rx="2" />
                      <path d="M7 8h10M7 12h6" />
                      <circle cx="17" cy="17" r="4" fill="currentColor" opacity="0.2" />
                      <path d="M15.5 17l1 1 2-2" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-lg sm:text-xl font-bold text-white">Course Completion Certificate</h3>
                    <p className="text-xs text-white/60">Issued by ExpoGraph</p>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex items-start gap-2.5">
                    <svg className="w-4 h-4 text-amber-400 mt-0.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 6L9 17l-5-5" /></svg>
                    <p className="text-sm text-white/60">Unique certificate ID for each user-verifiable and shareable</p>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <svg className="w-4 h-4 text-amber-400 mt-0.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 6L9 17l-5-5" /></svg>
                    <p className="text-sm text-white/60">Add directly to your LinkedIn profile and resume</p>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <svg className="w-4 h-4 text-amber-400 mt-0.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 6L9 17l-5-5" /></svg>
                    <p className="text-sm text-white/60">Issued after completing 100% of course lessons</p>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <svg className="w-4 h-4 text-amber-400 mt-0.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 6L9 17l-5-5" /></svg>
                    <p className="text-sm text-white/60">Download as professional PDF-ready for employers</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Trust signals */}
            <div className="flex flex-col gap-4">
              <div className="flex-1 rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5 sm:p-6 flex flex-col gap-4">
                <div className="flex items-start gap-4">
                  <div className="flex shrink-0 items-center gap-2">
                    <div className="rounded-lg bg-white p-1 shadow-md ring-2 ring-black/40">
                      <img
                        src={MCA_LOGO_URL}
                        alt="Ministry of Corporate Affairs Logo"
                        width={72}
                        height={28}
                        className="h-7 w-auto max-w-[80px] object-contain"
                        referrerPolicy="no-referrer"
                        decoding="async"
                      />
                    </div>
                    <div className="rounded-lg bg-white p-1 shadow-md ring-2 ring-black/40">
                      <img
                        src={MSME_LOGO_URL}
                        alt="Ministry of Micro, Small and Medium Enterprises Logo"
                        width={72}
                        height={28}
                        className="h-7 w-auto max-w-[88px] object-contain"
                        referrerPolicy="no-referrer"
                        decoding="async"
                      />
                    </div>
                  </div>
                  
                </div>
                <div className="min-w-0">
                    <h4 className="text-sm sm:text-base font-semibold text-white mb-1">Recognised by MCA &amp; MSME</h4>
                    <p className="text-xs sm:text-sm text-white/60 leading-relaxed">
                      ExpoGraph is recognised by MCA (Corporate Affairs) and MSME (Micro, Small &amp; Medium Enterprises), Government of India-your certificates carry institutional trust.
                    </p>
                  </div>
              </div>

              <div className="flex-1 rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5 sm:p-6 flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0">
                  <svg className="w-5 h-5 text-emerald-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                  </svg>
                </div>
                <div>
                  <h4 className="text-sm sm:text-base font-semibold text-white mb-1">Backed by Real Projects</h4>
                  <p className="text-xs sm:text-sm text-white/60 leading-relaxed">Your certificate isn't just a paper-it's backed by hands-on projects and Real Client Lab work you actually built.</p>
                </div>
              </div>

              <div className="flex-1 rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5 sm:p-6 flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center shrink-0">
                  <svg className="w-5 h-5 text-violet-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="8" r="5" />
                    <path d="M12 13l-3 9 3-2 3 2-3-9z" />
                  </svg>
                </div>
                <div>
                  <h4 className="text-sm sm:text-base font-semibold text-white mb-1">Industry Recognized Skills</h4>
                  <p className="text-xs sm:text-sm text-white/60 leading-relaxed">Our Vibe Coding, Prompt Engineering & AI Automations courses teach production-level tools and workflows-employers trust the skills you demonstrate.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Advantage Banner */}
      <section
        className="py-10 sm:py-12 md:py-16 px-4 sm:px-6 md:px-8 lg:px-12 xl:px-24 academy-section-gpu heavy-section"
        style={{ backgroundColor: "#000000" }}
      >
        <div className="max-w-5xl mx-auto">
          <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl border border-emerald-500/15 bg-gradient-to-br from-emerald-500/5 via-black to-violet-500/5">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(16,185,129,0.08),transparent_60%)] pointer-events-none" />
            <div className="relative px-6 py-8 sm:px-10 sm:py-10 md:px-14 md:py-12 flex flex-col md:flex-row items-center gap-6 md:gap-10">
              <div className="flex-1 text-center md:text-left">
                <p className="inline-block text-xs sm:text-sm font-semibold tracking-widest uppercase text-emerald-400 mb-3 px-3 py-1 rounded-full border border-emerald-500/20 bg-emerald-500/5">
                  Why pay more?
                </p>
                <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white leading-tight">
                  Premium learning.{" "}
                  <span className="bg-gradient-to-r from-emerald-400 to-teal-400 text-transparent bg-clip-text">
                    Unbeatable price.
                  </span>
                </h2>
                <p className="mt-3 sm:mt-4 text-sm sm:text-base text-white/60 max-w-lg mx-auto md:mx-0 leading-relaxed">
                  Other platforms charge ₹5,000–₹50,000 for generic tutorials. At ExpoGraph, you get Vibe Coding, Prompt Engineering & AI Automations-structured courses with smart prompts, a resume builder, MCA- &amp; MSME-recognised certificates &amp; real client projects-all for a price anyone can afford.
                </p>
              </div>
              <div className="flex flex-row md:flex-col items-center gap-4 sm:gap-5 shrink-0">
                <button
                  onClick={() => navigate("/courses")}
                  className="flex flex-col items-center justify-center w-32 sm:w-36 h-28 sm:h-32 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 transition-all duration-300 cursor-pointer group hover:bg-emerald-500/20 hover:border-emerald-500/40 hover:scale-105 hover:shadow-lg hover:shadow-emerald-500/10"
                >
                  <span className="text-3xl sm:text-4xl font-extrabold text-emerald-400 group-hover:scale-110 transition-transform duration-300">₹99</span>
                  <span className="text-[11px] sm:text-xs text-white/50 mt-1 uppercase tracking-wider group-hover:text-white/70 transition-colors">per course</span>
                </button>
                <button
                  onClick={() => navigate("/courses")}
                  className="flex flex-col items-center justify-center w-32 sm:w-36 h-28 sm:h-32 rounded-2xl border border-amber-500/20 bg-amber-500/10 transition-all duration-300 cursor-pointer group hover:bg-amber-500/20 hover:border-amber-500/40 hover:scale-105 hover:shadow-lg hover:shadow-amber-500/10"
                >
                  <span className="text-3xl sm:text-4xl font-extrabold text-amber-400 group-hover:scale-110 transition-transform duration-300">₹199</span>
                  <span className="text-[11px] sm:text-xs text-white/50 mt-1 uppercase tracking-wider group-hover:text-white/70 transition-colors">all-access pack</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* User Reviews-Social Proof */}
      <section
        ref={reviewsSectionRef}
        id="reviews"
        className="py-14 sm:py-16 md:py-20 lg:py-24 overflow-hidden academy-section-gpu heavy-section"
        style={{ backgroundColor: "#000000" }}
      >
        <div className="px-4 sm:px-6 md:px-8 lg:px-12 xl:px-24">
          <div className="text-center mb-10 sm:mb-12 md:mb-14">
            <p className="inline-block text-xs sm:text-sm font-medium tracking-widest uppercase text-cyan-400 mb-3 px-3 py-1 rounded-full border border-cyan-500/20 bg-cyan-500/5">
              Voices from the ExpoGraph Community
            </p>
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-white leading-tight">
              2,000+ users are already{" "}
              <span className="bg-gradient-to-r from-cyan-400 via-teal-400 to-emerald-400 text-transparent bg-clip-text">
                building with us
              </span>
            </h2>
            <p className="mt-3 sm:mt-4 text-sm sm:text-base md:text-lg text-white/60 max-w-2xl mx-auto">
              From Vibe Coding to Prompt Engineering to AI Automations-our users are shipping real projects and landing real opportunities
            </p>
          </div>
        </div>

        {/* Row 1-scrolls left */}
        <div className="relative mb-3 sm:mb-4">
          <div className="absolute left-0 top-0 bottom-0 w-16 sm:w-24 bg-gradient-to-r from-black to-transparent z-10 pointer-events-none" />
          <div className="absolute right-0 top-0 bottom-0 w-16 sm:w-24 bg-gradient-to-l from-black to-transparent z-10 pointer-events-none" />
          <div
            className="flex gap-3 sm:gap-4 animate-[scrollLeft_60s_linear_infinite]"
            style={{
              width: "max-content",
              willChange: reviewsMarqueeActive ? "transform" : "auto",
              transform: "translateZ(0)",
              animationPlayState: reviewsMarqueeActive ? "running" : "paused",
            }}
          >
            {[...reviewsRow1, ...reviewsRow1].map((r, i) => (
              <ReviewCard key={`r1-${i}`} r={r} />
            ))}
          </div>
        </div>

        {/* Row 2-scrolls right */}
        <div className="relative">
          <div className="absolute left-0 top-0 bottom-0 w-16 sm:w-24 bg-gradient-to-r from-black to-transparent z-10 pointer-events-none" />
          <div className="absolute right-0 top-0 bottom-0 w-16 sm:w-24 bg-gradient-to-l from-black to-transparent z-10 pointer-events-none" />
          <div
            className="flex gap-3 sm:gap-4 animate-[scrollRight_65s_linear_infinite]"
            style={{
              width: "max-content",
              willChange: reviewsMarqueeActive ? "transform" : "auto",
              transform: "translateZ(0)",
              animationPlayState: reviewsMarqueeActive ? "running" : "paused",
            }}
          >
            {[...reviewsRow2, ...reviewsRow2].map((r, i) => (
              <ReviewCard key={`r2-${i}`} r={r} />
            ))}
          </div>
        </div>

        {/* CTA after reviews */}
        <div className="flex flex-col items-center gap-3 mt-10 sm:mt-12 px-4">
          <button
            onClick={() => navigate("/courses")}
            className="px-7 py-3 sm:px-8 sm:py-3.5 bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white font-semibold rounded-full text-sm sm:text-base shadow-lg shadow-violet-500/20 transition-all duration-300 cursor-pointer hover:shadow-violet-500/40 hover:brightness-110 hover:scale-105"
          >
            Start Learning for ₹99
          </button>
          <span className="text-xs text-white/30">Join 2,000+ users already vibing with us</span>
        </div>
      </section>

      {/* Jobs Search Hub - before Join the vibe; borders match other academy sections */}
      <section
        id="jobs-hub"
        className="py-10 sm:py-12 px-4 sm:px-6 md:px-8 lg:px-12 xl:px-24 academy-section-gpu heavy-section"
        style={{ backgroundColor: "#000000", borderTop: "1px solid rgba(255, 255, 255, 0.06)" }}
      >
        <div className="max-w-5xl mx-auto rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6 sm:p-8 md:p-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="space-y-3 min-w-0">
            <p className="text-xs font-semibold uppercase tracking-widest text-white/50">New in LMS</p>
            <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-white leading-tight">
              Jobs Search Hub - your India-first career command center
            </h2>
            <p className="text-sm sm:text-base text-white/60 max-w-xl">
              B.Tech role presets, editable keyword chips, and one-tap searches on LinkedIn, Naukri, Indeed, Internshala & more. Saved searches and apply tracking stay on your device - no scraping, no extra server cost.
            </p>
            <Link to="/features/jobs-search-hub" className="inline-flex text-sm text-violet-400/90 hover:text-violet-300 font-medium">
              Full feature tour →
            </Link>
          </div>
          <div className="flex flex-col sm:flex-row md:flex-col gap-3 shrink-0 w-full sm:w-auto">
            {token && role === "Student" ? (
              <Link
                to="/lms/jobs"
                className="min-h-[44px] inline-flex items-center justify-center px-6 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-sm text-center"
              >
                Open Jobs Hub
              </Link>
            ) : (
              <>
                <Link
                  to="/login"
                  className="min-h-[44px] inline-flex items-center justify-center px-6 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-sm text-center"
                >
                  Login to unlock
                </Link>
                <Link
                  to="/courses"
                  className="min-h-[44px] inline-flex items-center justify-center px-6 rounded-xl border border-white/[0.12] text-white/90 hover:bg-white/[0.06] text-sm font-medium text-center"
                >
                  Get a course
                </Link>
              </>
            )}
          </div>
        </div>
      </section>

      {/* Community / Connect Section-Join the vibe */}
      <section
        id="connect"
        className="connect-section-vibe py-16 sm:py-20 md:py-24 lg:py-28 px-4 sm:px-6 md:px-8 lg:px-12 xl:px-24 academy-section-gpu heavy-section"
      >
        <div className="max-w-5xl mx-auto">
          <div className="max-w-3xl mx-auto text-center mb-10 sm:mb-12">
            <p className="inline-block text-[11px] sm:text-xs font-medium tracking-[0.2em] uppercase text-emerald-400/90 mb-4 px-3 py-1 rounded-full border border-emerald-500/15 bg-emerald-500/5">
              Stay Connected
            </p>
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-white leading-tight tracking-tight">
              Join the{" "}
              <span className="bg-gradient-to-r from-emerald-400 via-green-400 to-teal-400 text-transparent bg-clip-text">
                vibe
              </span>
            </h2>
            <p className="mt-4 sm:mt-5 text-sm sm:text-base md:text-lg text-white/55 max-w-xl mx-auto leading-relaxed">
              You're part of a growing family of builders and creators. Follow for tips, wins and career growth-one tap to join.
            </p>
            {/* Lightweight stats strip-no heavy grid */}
            <div className="mt-6 sm:mt-8 flex flex-wrap items-center justify-center gap-x-3 sm:gap-x-4 gap-y-2 text-sm text-white/40">
              <span className="text-emerald-400/80 font-semibold">2K+ builders</span>
              <span className="text-white/30">·</span>
              <span>From ₹99 per course</span>
              <span className="text-white/30">·</span>
              <span>Real client projects</span>
              <span className="text-white/30">·</span>
              <span>24/7 community</span>
              <span className="text-white/30">·</span>
              <span>3 courses + pack</span>
              <span className="text-white/30">·</span>
              <span>MCA &amp; MSME certificates</span>
              <span className="text-white/30">·</span>
              <span>Resume builder</span>
            </div>
          </div>

          <div className="max-w-4xl mx-auto">
            <p className="text-center text-xs sm:text-sm text-white/40 mb-6 sm:mb-8">
              Where builders connect
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
            <a
              href="https://www.instagram.com/expograph_tech/"
              target="_blank"
              rel="noopener noreferrer"
              className="connect-social-card group relative rounded-2xl border border-white/[0.08] p-5 sm:p-6 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/50 focus-visible:ring-offset-2 focus-visible:ring-offset-black"
              style={{ background: "linear-gradient(135deg, rgba(253,29,29,0.05) 0%, rgba(252,176,69,0.05) 30%, rgba(131,58,180,0.05) 100%)" }}
            >
              <div className="absolute inset-0 rounded-2xl border border-fuchsia-500/10 opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100 transition-opacity duration-200 pointer-events-none" />
              <div className="relative">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3 border border-white/[0.06]" style={{ background: "linear-gradient(135deg, rgba(253,29,29,0.12) 0%, rgba(252,176,69,0.12) 30%, rgba(131,58,180,0.12) 100%)" }}>
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="url(#ig-grad)"><defs><linearGradient id="ig-grad" x1="0" y1="1" x2="1" y2="0"><stop offset="0%" stopColor="#FCAF45" /><stop offset="50%" stopColor="#E1306C" /><stop offset="100%" stopColor="#833AB4" /></linearGradient></defs><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>
                </div>
                <h3 className="text-base sm:text-lg font-semibold text-white mb-1">Instagram</h3>
                <p className="text-xs sm:text-sm text-white/50 leading-relaxed mb-3">Reels, tips & user wins.</p>
                <span className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-medium text-white/70 group-hover:text-[#E1306C] group-hover:gap-2 transition-all duration-200">
                  Follow
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
                </span>
              </div>
            </a>

            <a
              href="https://www.youtube.com/@Expograph-3"
              target="_blank"
              rel="noopener noreferrer"
              className="connect-social-card group relative rounded-2xl border border-white/[0.08] p-5 sm:p-6 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/50 focus-visible:ring-offset-2 focus-visible:ring-offset-black"
              style={{ borderColor: "rgba(255,0,0,0.12)", background: "rgba(255,0,0,0.03)" }}
            >
              <div className="absolute inset-0 rounded-2xl border border-red-500/15 opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100 transition-opacity duration-200 pointer-events-none" />
              <div className="relative">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3 border border-white/[0.06]" style={{ background: "rgba(255,0,0,0.08)", borderColor: "rgba(255,0,0,0.15)" }}>
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="#FF0000"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>
                </div>
                <h3 className="text-base sm:text-lg font-semibold text-white mb-1">YouTube</h3>
                <p className="text-xs sm:text-sm text-white/50 leading-relaxed mb-3">Tutorials & career talks.</p>
                <span className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-medium text-white/70 group-hover:text-red-400 group-hover:gap-2 transition-all duration-200">
                  Subscribe
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
                </span>
              </div>
            </a>

            <a
              href="https://www.linkedin.com/company/109629393/"
              target="_blank"
              rel="noopener noreferrer"
              className="connect-social-card group relative rounded-2xl border border-white/[0.08] bg-white/[0.02] p-5 sm:p-6 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/50 focus-visible:ring-offset-2 focus-visible:ring-offset-black hover:border-blue-500/25 hover:bg-blue-500/5"
            >
              <div className="absolute inset-0 rounded-2xl border border-blue-500/10 opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100 transition-opacity duration-200 pointer-events-none" />
              <div className="relative">
                <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/15 flex items-center justify-center mb-3">
                  <svg className="w-5 h-5 text-blue-400" viewBox="0 0 24 24" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
                </div>
                <h3 className="text-base sm:text-lg font-semibold text-white mb-1">LinkedIn</h3>
                <p className="text-xs sm:text-sm text-white/50 leading-relaxed mb-3">Updates & opportunities.</p>
                <span className="inline-flex items-center gap-1.5 text-xs sm:text-sm text-blue-400/90 font-medium group-hover:gap-2 transition-all duration-200">
                  Connect
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
                </span>
              </div>
            </a>
            </div>
          </div>
        </div>
      </section>

      {/* FAQs Section */}
      <section
        id="faqs"
        className="py-14 sm:py-16 md:py-20 lg:py-24 px-4 sm:px-6 md:px-8 lg:px-12 xl:px-24 academy-section-gpu heavy-section"
        style={{ backgroundColor: "#000000" }}
      >
        <div className="text-center mb-10 sm:mb-12 md:mb-14">
          <p className="inline-block text-xs sm:text-sm font-medium tracking-widest uppercase text-amber-400 mb-3 px-3 py-1 rounded-full border border-amber-500/20 bg-amber-500/5">
            Got Questions?
          </p>
          <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-white leading-tight">
            We've got{" "}
            <span className="bg-gradient-to-r from-amber-400 via-orange-400 to-yellow-400 text-transparent bg-clip-text">
              answers
            </span>
          </h2>
          <p className="mt-3 sm:mt-4 text-sm sm:text-base md:text-lg text-white/60 max-w-2xl mx-auto">
            Everything you need to know before you start vibing with us
          </p>
        </div>
        <div className="mx-auto max-w-3xl text-white/90">
          <SimpleFAQ />
        </div>
      </section>

      {/* Footer WebGL deferred until near viewport - avoids GPU contention while scrolling the long page */}
      <footer className="w-full min-h-[560px] sm:min-h-[70vh] border-t border-black">
        <LazyMount
          placeholderHeight="min(560px, 70vh)"
          rootMargin="480px"
          className="w-full min-h-[560px] sm:min-h-[70vh]"
          placeholder={
            <div
              className="w-full min-h-[560px] sm:min-h-[70vh] bg-[#0a0a0a] flex flex-col items-center justify-center gap-4 text-white/40 text-sm"
              aria-hidden
            >
              <div className="w-8 h-8 border-2 border-white/15 border-t-white/50 rounded-full animate-spin" />
            </div>
          }
        >
          <TubesBackground className="min-h-[560px] sm:min-h-[70vh] bg-[#0a0a0a]" enableClickInteraction={true}>
            <FlowTubesFooterInner shellClassName="min-h-[560px] sm:min-h-[70vh]" />
          </TubesBackground>
        </LazyMount>
      </footer>
      </div>
    </div>
  );
}
