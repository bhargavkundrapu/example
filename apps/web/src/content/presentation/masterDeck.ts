/**
 * ExpoGraph product presentation (web app route: /presentation).
 * Copy is aligned with the live product; no invented metrics or outcomes.
 */

import type { ScreenshotMap } from './screenshotMap';
import type { TrackDeckIllustrationId } from './presentationIllustrations';

export type ActId = 1 | 2 | 3 | 4 | 5 | 6;

export type SectionId =
  | 'cover'
  | 'problem'
  | 'why-now'
  | 'what-is'
  | 'promise'
  | 'tracks'
  | 'lms'
  | 'smart-prompts'
  | 'client-lab'
  | 'career-tools'
  | 'launchpad'
  | 'trust'
  | 'pricing'
  | 'principal-outcomes'
  | 'pilot-plan'
  | 'kpi-framework'
  | 'governance'
  | 'implementation-model'
  | 'standout'
  | 'closing';

export type SectionVariant =
  | 'cover'
  | 'statement'
  | 'split'
  | 'grid-4'
  | 'screenshot'
  | 'triple'
  | 'pricing'
  | 'trust'
  | 'closing'
  | 'timeline';

export interface DeckSection {
  id: SectionId;
  act: ActId;
  actLabel: string;
  variant: SectionVariant;
  eyebrow?: string;
  title: string;
  subtitle?: string;
  lines?: string[];
  /** Short label for nav / chapter rail */
  navLabel: string;
  screenshotKey?: keyof ScreenshotMap;
  galleryKeys?: (keyof ScreenshotMap)[];
}

export const ACT_LABELS: Record<ActId, string> = {
  1: 'Attention',
  2: 'Why now',
  3: 'The product',
  4: 'Depth',
  5: 'Trust & value',
  6: 'Conviction',
};

export const MASTER_DECK: DeckSection[] = [
  {
    id: 'cover',
    act: 1,
    actLabel: ACT_LABELS[1],
    variant: 'cover',
    eyebrow: 'ExpoGraph Academy',
    title: 'Stop learning to code. Start building with AI.',
    subtitle:
      'ExpoGraph is built for students who want real skills, real projects, real proof, and real momentum - not passive watching.',
    navLabel: 'Cover',
    screenshotKey: 'academyHero',
    galleryKeys: ['coursesCatalog', 'studentDashboard', 'pricingBlock'],
  },
  {
    id: 'problem',
    act: 1,
    actLabel: ACT_LABELS[1],
    variant: 'split',
    eyebrow: 'The gap',
    title: 'Students are learning more. But building less.',
    lines: [
      'Tutorials are everywhere.',
      'Certificates are easy to list.',
      'What still cuts through is proof - what you shipped, and can show.',
      'Many students still struggle to demonstrate real output.',
    ],
    navLabel: 'Problem',
  },
  {
    id: 'why-now',
    act: 2,
    actLabel: ACT_LABELS[2],
    variant: 'statement',
    eyebrow: 'Why now',
    title: 'The AI era changed the rules.',
    lines: [
      'AI-native workflows are the default for many teams.',
      'Speed and iteration beat memorization.',
      'Practical output beats theory-only study.',
      'Your portfolio and visible capability matter more than ever.',
    ],
    navLabel: 'Why now',
  },
  {
    id: 'what-is',
    act: 3,
    actLabel: ACT_LABELS[3],
    variant: 'timeline',
    eyebrow: 'What ExpoGraph is',
    title: 'A student-first AI build platform',
    lines: [
      'Structured AI skill tracks - not random playlists.',
      'A real student LMS with progress and momentum.',
      'Smart prompts that reduce blank-page friction.',
      'Pathways into real work, career tools, and founder support.',
    ],
    navLabel: 'Platform',
  },
  {
    id: 'promise',
    act: 3,
    actLabel: ACT_LABELS[3],
    variant: 'split',
    eyebrow: 'Core promise',
    title: 'From learning to real-world doing',
    subtitle: 'Where learning meets real-world doing.',
    lines: [
      'Watch less. Build more.',
      'Move from concepts to output you can show.',
      'Pair completion with proof - projects, portfolio, and certificates.',
    ],
    navLabel: 'Promise',
  },
  {
    id: 'tracks',
    act: 4,
    actLabel: ACT_LABELS[4],
    variant: 'grid-4',
    eyebrow: 'Learning tracks',
    title: 'AI-native skill tracks for today’s students',
    lines: [],
    navLabel: 'Tracks',
  },
  {
    id: 'lms',
    act: 4,
    actLabel: ACT_LABELS[4],
    variant: 'screenshot',
    eyebrow: 'Product depth',
    title: 'A real LMS - not just a content list',
    lines: [
      'Dashboard with your next steps front and center.',
      'Progress, streaks, XP, and levels to sustain momentum.',
      'Structured lesson flow designed around building.',
    ],
    navLabel: 'LMS',
    screenshotKey: 'lmsHome',
    galleryKeys: ['studentDashboard', 'lessonView'],
  },
  {
    id: 'smart-prompts',
    act: 4,
    actLabel: ACT_LABELS[4],
    variant: 'screenshot',
    eyebrow: 'Differentiation',
    title: 'Build faster with Smart Prompts',
    lines: [
      'Less blank-page fear - prompts live next to lessons.',
      'Faster practical output with copy-ready snippets.',
      'Support for real AI-assisted workflows as you learn.',
    ],
    navLabel: 'Smart Prompts',
    screenshotKey: 'smartPrompts',
    galleryKeys: ['lessonView', 'lessonErrorsTab'],
  },
  {
    id: 'client-lab',
    act: 4,
    actLabel: ACT_LABELS[4],
    variant: 'screenshot',
    eyebrow: 'Proof',
    title: 'Where learning becomes real work',
    lines: [
      'Real tasks and project-style work - not toy exercises alone.',
      'Mentor review for quality feedback.',
      'Portfolio-grade output you can stand behind.',
    ],
    navLabel: 'Client Lab',
    screenshotKey: 'clientLab',
    galleryKeys: ['projectSubmission', 'studentDashboard'],
  },
  {
    id: 'career-tools',
    act: 4,
    actLabel: ACT_LABELS[4],
    variant: 'triple',
    eyebrow: 'Opportunity',
    title: 'Learning connected to opportunity',
    subtitle: 'India-first career command center - job search helpers that open the portals you already use.',
    lines: [
      'Resume Builder - structured, export-ready.',
      'Certificates - completion and verification flow in the product.',
      'Jobs Search Hub - presets, keyword control, and redirects (you apply on the original site).',
    ],
    navLabel: 'Career',
    screenshotKey: 'careerTools',
    galleryKeys: ['resumeBuilder', 'jobsHub', 'certificateView'],
  },
  {
    id: 'launchpad',
    act: 4,
    actLabel: ACT_LABELS[4],
    variant: 'screenshot',
    eyebrow: 'Founders',
    title: 'For students who want to build beyond jobs',
    subtitle: 'Your startup path, in the right order.',
    lines: [
      'Startup LaunchPad - readiness, staged path, and founder-oriented tools.',
      'Legal timing guidance appears when it makes sense in the journey.',
      'Access is tied to your course pack rules in the LMS.',
    ],
    navLabel: 'LaunchPad',
    screenshotKey: 'launchpad',
    galleryKeys: ['studentDashboard', 'projectSubmission'],
  },
  {
    id: 'trust',
    act: 5,
    actLabel: ACT_LABELS[5],
    variant: 'trust',
    eyebrow: 'Trust',
    title: 'Built with visible trust signals',
    lines: [
      'AICTE, MCA, and MSME recognition narrative as presented on ExpoGraph Academy.',
      'Certificate flow: complete lessons, then request and verify.',
      'Curriculum positioning: designed with strong industry practitioners.',
    ],
    navLabel: 'Trust',
    screenshotKey: 'careerTools',
    galleryKeys: ['certificateView', 'testimonialCard', 'studentDashboard'],
  },
  {
    id: 'pricing',
    act: 5,
    actLabel: ACT_LABELS[5],
    variant: 'pricing',
    eyebrow: 'Accessibility',
    title: 'Premium learning. Unbeatable price.',
    lines: [
      'Individual courses at an entry price designed for students.',
      'All-access pack for breadth and bundled value.',
      'AI Automations positioned as a bonus with the pack in the product.',
    ],
    navLabel: 'Pricing',
    screenshotKey: 'careerTools',
    galleryKeys: ['pricingBlock', 'coursesCatalog'],
  },
  {
    id: 'principal-outcomes',
    act: 5,
    actLabel: ACT_LABELS[5],
    variant: 'statement',
    eyebrow: 'For college leadership',
    title: 'What a principal can expect to see clearly',
    lines: [
      'More students shipping practical outputs, not only watching lessons.',
      'A visible trail of submissions, reviews, and project progression.',
      'Career-readiness artifacts: portfolio items, resumes, and certification flow.',
      'A structured system the institution can monitor, not a one-time workshop.',
    ],
    navLabel: 'Principal view',
    galleryKeys: ['studentDashboard', 'projectSubmission', 'bookmarksNotes'],
  },
  {
    id: 'pilot-plan',
    act: 5,
    actLabel: ACT_LABELS[5],
    variant: 'timeline',
    eyebrow: 'Pilot model',
    title: 'Simple 8-12 week pilot blueprint',
    lines: [
      'Weeks 1-2: onboarding, baseline mapping, and platform readiness.',
      'Weeks 3-6: guided build cycles with mentor checkpoints.',
      'Weeks 7-10: portfolio-ready submissions and review loops.',
      'Final phase: outcome review with institution stakeholders and next-batch plan.',
    ],
    navLabel: 'Pilot plan',
    galleryKeys: ['coursesCatalog', 'studentDashboard'],
  },
  {
    id: 'kpi-framework',
    act: 5,
    actLabel: ACT_LABELS[5],
    variant: 'triple',
    eyebrow: 'Measurement',
    title: 'KPI framework institutions can track',
    subtitle: 'Focus on visible execution metrics and student output quality.',
    lines: [
      'Engagement KPIs: active learners, lesson progression, and submission regularity.',
      'Output KPIs: completed projects, mentor-reviewed tasks, and portfolio artifacts.',
      'Readiness KPIs: resume quality, certification completion, and job-application preparedness.',
    ],
    navLabel: 'KPI model',
    screenshotKey: 'studentDashboard',
    galleryKeys: ['studentDashboard', 'certificateView', 'jobsHub'],
  },
  {
    id: 'governance',
    act: 5,
    actLabel: ACT_LABELS[5],
    variant: 'trust',
    eyebrow: 'Governance',
    title: 'Academic control, safety, and accountability',
    lines: [
      'Role-based access and progress visibility for institutional oversight.',
      'Structured review flow so student work is evaluated, not auto-approved.',
      'Clear operational ownership model: institution coordinators + ExpoGraph support.',
    ],
    navLabel: 'Governance',
    galleryKeys: ['certificateView', 'studentDashboard', 'testimonialCard'],
  },
  {
    id: 'implementation-model',
    act: 6,
    actLabel: ACT_LABELS[6],
    variant: 'pricing',
    eyebrow: 'Execution',
    title: 'How to start without operational confusion',
    lines: [
      'Start with one department or focused batch before broad rollout.',
      'Align timetables with existing academic rhythm instead of adding chaos.',
      'Review pilot outcomes first, then expand in controlled phases.',
    ],
    navLabel: 'Execution model',
    galleryKeys: ['pricingBlock', 'coursesCatalog'],
  },
  {
    id: 'standout',
    act: 6,
    actLabel: ACT_LABELS[6],
    variant: 'statement',
    eyebrow: 'Summary',
    title: 'Why ExpoGraph stands out',
    lines: [
      'Build-first AI learning with a real LMS layer.',
      'Smart Prompts, Real Client Lab, Resume Builder, Jobs Hub, Startup LaunchPad.',
      'Affordable entry - strength, not compromise.',
    ],
    navLabel: 'Stand out',
  },
  {
    id: 'closing',
    act: 6,
    actLabel: ACT_LABELS[6],
    variant: 'closing',
    eyebrow: 'Next step',
    title: 'Build, prove, and move forward.',
    subtitle: 'Affordable AI learning. Real projects. Real tools. Real momentum.',
    lines: ['Start building with ExpoGraph.'],
    navLabel: 'Close',
    screenshotKey: 'academyHero',
    galleryKeys: ['jobsHub', 'resumeBuilder', 'bookmarksNotes'],
  },
];

export const TRACK_CARDS: ReadonlyArray<{
  title: string;
  description: string;
  accent: string;
  illustrationId: TrackDeckIllustrationId;
}> = [
  {
    title: 'Vibe Coding',
    description: 'Build with AI-assisted workflows - ship, don’t only study.',
    accent: 'from-violet-500/30 to-fuchsia-500/20',
    illustrationId: 'trackVibeCoding',
  },
  {
    title: 'Prompt Engineering',
    description: 'Think in prompts - clarity, structure, and iteration.',
    accent: 'from-indigo-500/30 to-blue-500/20',
    illustrationId: 'trackPromptEngineering',
  },
  {
    title: 'Prompt to Profit',
    description: 'Connect prompting to practical value and outcomes.',
    accent: 'from-amber-500/25 to-orange-500/15',
    illustrationId: 'trackPromptToProfit',
  },
  {
    title: 'AI Automations',
    description: 'Automate workflows with intelligence - bonus depth with the pack.',
    accent: 'from-emerald-500/25 to-teal-500/15',
    illustrationId: 'trackAiAutomations',
  },
];

