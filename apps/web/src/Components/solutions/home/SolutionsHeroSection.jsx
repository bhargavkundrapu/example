import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { SOLUTIONS_HERO } from "../../../content/solutions/overview";
import { SOLUTIONS_HOME_SHELL } from "./solutionsHomeConstants";
import { solutionsSectionFade as fade } from "./solutionsHomeMotion";

const steps = [
  { n: "1", t: "Short call", d: "We clarify goals and constraints." },
  { n: "2", t: "Clear plan", d: "You approve scope before we build." },
  { n: "3", t: "Ship & support", d: "Launch, handover, then iterate." },
];

export default function SolutionsHeroSection() {
  return (
    <section className="relative overflow-hidden border-b border-slate-200/80" aria-labelledby="solutions-hero-heading">
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-violet-100 via-white to-white" />
      <div className="pointer-events-none absolute inset-0 bg-grid-fade bg-[length:48px_48px] opacity-[0.22]" aria-hidden />
      <div className="pointer-events-none absolute -right-32 top-1/4 h-80 w-80 rounded-full bg-violet-200/50 blur-[100px]" aria-hidden />

      <div className={`relative ${SOLUTIONS_HOME_SHELL} py-16 sm:py-20 lg:py-24`}>
        <div className="grid gap-12 lg:grid-cols-[1fr_280px] lg:items-start lg:gap-16">
          <motion.div {...fade}>
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-violet-700">ExpoGraph Solutions</p>
            <h1 id="solutions-hero-heading" className="sol-display mt-4 max-w-4xl text-balance text-4xl leading-[1.1] text-slate-900 sm:text-5xl md:text-6xl">
              {SOLUTIONS_HERO.title}
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-relaxed text-slate-600 md:text-xl">{SOLUTIONS_HERO.lead}</p>
            <p className="mt-4 max-w-xl border-l-2 border-violet-300/80 pl-4 text-sm leading-relaxed text-slate-500">{SOLUTIONS_HERO.note}</p>
            <div className="mt-10 flex flex-col items-stretch gap-3 sm:flex-row sm:flex-wrap sm:items-center">
              <Link
                to="/solutions/book-a-meet"
                className="inline-flex min-h-[48px] items-center justify-center rounded-full bg-violet-600 px-8 py-3 text-sm font-semibold text-white shadow-xl transition hover:bg-violet-700"
              >
                Book a meet
              </Link>
              <a
                href="#services"
                className="inline-flex min-h-[48px] items-center justify-center rounded-full border border-slate-300 bg-white px-8 py-3 text-center text-sm font-medium text-slate-700 transition hover:bg-slate-50"
              >
                See all services
              </a>
              
            </div>
          </motion.div>

          <motion.aside {...fade} className="rounded-2xl border border-violet-200/80 bg-white/90 p-5 shadow-lg ring-1 ring-violet-100 backdrop-blur-sm lg:sticky lg:top-28">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-violet-700">How it works</p>
            <ol className="mt-4 space-y-4">
              {steps.map((s) => (
                <li key={s.n} className="flex gap-3">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-violet-600 text-xs font-bold text-white">{s.n}</span>
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{s.t}</p>
                    <p className="mt-0.5 text-xs leading-relaxed text-slate-600">{s.d}</p>
                  </div>
                </li>
              ))}
            </ol>
          </motion.aside>
        </div>
      </div>
    </section>
  );
}
