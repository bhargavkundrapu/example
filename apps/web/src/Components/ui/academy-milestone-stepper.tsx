"use client";

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Zap, Code2, Trophy, ArrowRight, CheckCircle2 } from "lucide-react";
import { MilestoneStepper, MilestoneData } from "./milestone-stepper";
import { useBreakpoint } from "../../hooks/useMediaQuery";
import React from "react";

const milestones: MilestoneData[] = [
  {
    id: 1,
    title: "Explore & pick your course",
    description: "See what fits you-no commitment yet",
    date: "Step 1",
    icon: <Search className="size-4" />,
  },
  {
    id: 2,
    title: "Enroll & start learning",
    description: "One click, instant access-you set the pace",
    date: "Step 2",
    icon: <Zap className="size-4" />,
  },
  {
    id: 3,
    title: "Learn, build & ship",
    description: "Structured lessons + real projects, with support",
    date: "Step 3",
    icon: <Code2 className="size-4" />,
  },
  {
    id: 4,
    title: "Show the world",
    description: "Portfolio, resume & certificates-you're ready",
    icon: <Trophy className="size-4" />,
  },
];

interface ContentBlock {
  title: string;
  body: React.ReactNode;
  scenario?: string;
  highlights: string[];
  cta: string;
  accent: {
    border: string;
    bg: string;
    text: string;
    glow: string;
    btnBg: string;
    btnHover: string;
  };
}

const contentBlocks: ContentBlock[] = [
  {
    title: "Explore & pick your course",
    body: (
      <>
        Browse <strong className="text-blue-300">Vibe Coding</strong>, <strong className="text-blue-300">Prompt Engineering</strong>, <strong className="text-blue-300">Prompt to Profit</strong>, and <strong className="text-blue-300">AI Automations</strong>. Each page shows what you'll learn, what you'll build, and the tools you'll use. Take your time-pick the one that fits where you are now.
      </>
    ),
    scenario: "Real-world: Like choosing a path that actually leads somewhere-you see the map before you start.",
    highlights: ["Vibe Coding", "Prompt Engineering", "Prompt to Profit", "AI Automations"],
    cta: "Browse courses",
    accent: {
      border: "border-blue-500/20",
      bg: "bg-blue-500/5",
      text: "text-blue-400",
      glow: "from-blue-600/10 via-transparent to-transparent",
      btnBg: "bg-blue-600",
      btnHover: "hover:bg-blue-700",
    },
  },
  {
    title: "Enroll & start learning",
    body: (
      <>
        One click and you're in. You get <strong className="text-violet-300">all lessons</strong>, <strong className="text-violet-300">smart prompts</strong>, and setup guides. No waiting, no complicated forms. You learn at your own pace-10 minutes or 2 hours, it's up to you.
      </>
    ),
    scenario: "Real-world: Like unlocking a library you can visit anytime. No pressure to finish by a date.",
    highlights: ["Instant access", "Your pace", "Smart prompts", "Setup guides"],
    cta: "Get started",
    accent: {
      border: "border-violet-500/20",
      bg: "bg-violet-500/5",
      text: "text-violet-400",
      glow: "from-violet-600/10 via-transparent to-transparent",
      btnBg: "bg-violet-600",
      btnHover: "hover:bg-violet-700",
    },
  },
  {
    title: "Learn, build & ship",
    body: (
      <>
        Every lesson has a clear <strong className="text-purple-300">goal → video → setup → prompts → check</strong>. You copy code in one click, build real projects, and can join <strong className="text-purple-300">Real Client Lab</strong> to work on real briefs and get mentor feedback. Small steps, real output.
      </>
    ),
    scenario: "Real-world: You're not just watching-you're building something you can show in an interview or to a client.",
    highlights: ["Structured lessons", "One-click code", "Real Client Lab", "Mentor support"],
    cta: "View courses",
    accent: {
      border: "border-purple-500/20",
      bg: "bg-purple-500/5",
      text: "text-purple-400",
      glow: "from-purple-600/10 via-transparent to-transparent",
      btnBg: "bg-purple-600",
      btnHover: "hover:bg-purple-700",
    },
  },
  {
    title: "Show the world",
    body: (
      <>
        You finish with a <strong className="text-fuchsia-300">portfolio of real work</strong>, a <strong className="text-fuchsia-300">resume</strong> built with our Resume Builder, and <strong className="text-fuchsia-300">AICTE-approved, MCA- & MSME-recognised certificates</strong>. You're not just 'someone who took a course'-you're someone with proof. Ready for the next step.
      </>
    ),
    scenario: "Real-world: When someone says 'show me what you've built', you have a link and a certificate-no awkward silence.",
    highlights: ["Portfolio", "Resume Builder", "Certificates", "Proof you're ready"],
    cta: "Start your journey",
    accent: {
      border: "border-fuchsia-500/20",
      bg: "bg-fuchsia-500/5",
      text: "text-fuchsia-400",
      glow: "from-fuchsia-600/10 via-transparent to-transparent",
      btnBg: "bg-fuchsia-600",
      btnHover: "hover:bg-fuchsia-700",
    },
  },
];

function ContentCard({
  block,
  onCta,
}: {
  block: ContentBlock;
  onCta: () => void;
}) {
  return (
    <div className={`relative overflow-hidden rounded-2xl border ${block.accent.border} ${block.accent.bg} p-6 sm:p-8 backdrop-blur-sm transition-all`}>
      <div className={`absolute inset-0 bg-gradient-to-br ${block.accent.glow} opacity-60 pointer-events-none`} />
      <div className="relative">
        <h3 className="text-xl sm:text-2xl font-bold text-white mb-3">{block.title}</h3>
        <p className="text-white/60 text-sm sm:text-base leading-relaxed mb-4">{block.body}</p>
        {block.scenario && (
          <p className="text-white/50 text-xs sm:text-sm italic border-l-2 border-white/20 pl-3 mb-5">
            {block.scenario}
          </p>
        )}
        <div className="flex flex-wrap gap-2 mb-6">
          {block.highlights.map((h) => (
            <span key={h} className={`inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full border ${block.accent.border} ${block.accent.bg} ${block.accent.text}`}>
              <CheckCircle2 className="h-3 w-3" />
              {h}
            </span>
          ))}
        </div>
        <button
          type="button"
          onClick={onCta}
          className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-white font-medium transition-all ${block.accent.btnBg} ${block.accent.btnHover}`}
        >
          {block.cta}
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

export function AcademyMilestoneStepper() {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const navigate = useNavigate();
  const isLg = useBreakpoint("lg");
  const block = contentBlocks[selectedIndex];

  const handleCta = () => {
    navigate("/courses");
  };

  return (
    <div className="w-full max-w-5xl mx-auto py-4 sm:py-8 px-2 sm:px-6">
      <p className="text-center text-white/40 text-xs sm:text-sm mb-6">
        Click any step to see what happens-o signup needed to explore.
      </p>
      <div className="flex flex-col lg:flex-row gap-6 lg:gap-10">
        <div className="lg:w-80 shrink-0">
          <MilestoneStepper
            milestones={milestones}
            currentMilestone={selectedIndex}
            variant="detailed"
            onMilestoneClick={setSelectedIndex}
            renderBelowSelectedStep={!isLg ? (i) => <ContentCard block={contentBlocks[i]} onCta={handleCta} /> : undefined}
          />
        </div>

        {isLg && (
          <div className="flex-1 min-w-0">
            <ContentCard block={block} onCta={handleCta} />
          </div>
        )}
      </div>
    </div>
  );
}
