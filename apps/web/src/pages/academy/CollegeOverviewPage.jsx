import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Header } from "../../Components/ui/header-2";
import { FiDownload, FiCheck, FiArrowRight, FiSend } from "react-icons/fi";
import { apiFetch, ApiError } from "../../services/api";
import "../../styles/academy-tokens.css";

const PDF_HREF = "/downloads/ExpoGraph-College-Overview.pdf";

const WHY = [
  {
    t: "The gap",
    d: "Consumption without building: weak portfolios, vague résumés, low interview confidence.",
    c: "border-cyan-400/30 bg-cyan-400/5",
    dot: "bg-gradient-to-br from-cyan-400 to-blue-500",
  },
  {
    t: "The need",
    d: "Structured practice, prompts, artefacts, and signals leadership can inspect.",
    c: "border-violet-400/30 bg-violet-400/5",
    dot: "bg-gradient-to-br from-violet-400 to-indigo-500",
  },
  {
    t: "The solution",
    d: "ExpoGraph unifies learning, labs, résumés, discovery, and campus tooling in one coherent stack.",
    c: "border-emerald-400/30 bg-emerald-400/5",
    dot: "bg-gradient-to-br from-emerald-400 to-teal-500",
  },
  {
    t: "The result",
    d: "Learners produce proof; mentors review; administrators see cohort momentum.",
    c: "border-slate-400/25 bg-white/[0.03]",
    dot: "bg-gradient-to-br from-slate-400 to-slate-600",
  },
];

const BRINGS = [
  { title: "Structured courses", body: "Goal-led paths with checkpoints—not loose playlists.", accent: "from-cyan-400 to-blue-500" },
  { title: "Student LMS", body: "One hub for lessons, submissions, streaks, and momentum.", accent: "from-violet-400 to-fuchsia-500" },
  { title: "Real Client Lab", body: "Mentored work that earns portfolio artefacts.", accent: "from-emerald-400 to-cyan-500" },
  { title: "Résumé builder + Jobs hub", body: "Calibrated profiles and disciplined job discovery.", accent: "from-amber-400 to-orange-500" },
  { title: "Startup LaunchPad", body: "Founder journey beside formal coursework.", accent: "from-sky-400 to-blue-600" },
  { title: "College dashboard", body: "Pilot-friendly visibility—uptake, artefacts, next actions.", accent: "from-indigo-400 to-violet-600" },
];

const DTE_LAYERS = [
  ["Student tools", "Learning, prompts, labs, résumés, discovery—focused for cohort scale."],
  ["Faculty support", "Review loops and artefacts that respect faculty time."],
  ["Reports", "Readable signals for HOD / TPO."],
  ["Branding", "College-forward presentation for pilots & trust."],
];

const TALENT_STEPS = [
  { n: "1", t: "Student builds proof", d: "Submissions, labs—visible artefacts." },
  { n: "2", t: "Partner visibility", d: "Startups/companies browse when sourcing talent—they choose fits." },
  { n: "3", t: "Task-based shortlisting", d: "Practical filters that reduce résumé noise." },
  { n: "4", t: "Industry trust signal", d: "Strengthens the college’s posture—no gimmick funnel." },
];

const PILOT = [
  ["Week 1", "Orientation + onboarding", "Align faculty; issue access; set build-first etiquette."],
  ["Week 2", "Course start + dashboard", "Early momentum visible to HOD / TPO / leadership."],
  ["Week 3", "Mini-project submission", "First tangible artefacts with mentor review."],
  ["Week 4", "Résumé + Jobs hub", "Profiles + structured discovery hygiene."],
  ["Final", "Impact report to principal", "Participation, artefacts, scale recommendation."],
];

const ASK_CARDS = [
  { title: "Pilot batch", body: "One cohort or department first—not campus-wide pressure." },
  { title: "Orientation session", body: "30 minutes so intent, pacing & guardrails are clear." },
  { title: "Review report", body: "Evidence before any heavy capex rollout." },
];

function SectionHeading({ eyebrow, title, subtitle }) {
  return (
    <div className="max-w-3xl mb-8 sm:mb-10 md:mb-12">
      {eyebrow ? (
        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-violet-400 mb-3">{eyebrow}</p>
      ) : null}
      <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight text-white leading-tight">{title}</h2>
      {subtitle ? (
        <p className="mt-4 text-sm sm:text-base text-white/50 leading-relaxed">{subtitle}</p>
      ) : null}
    </div>
  );
}

export default function CollegeOverviewPage() {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const [form, setForm] = useState({
    name: "",
    designation: "",
    collegeName: "",
    phone: "",
    email: "",
    interestedInPilot: false,
    message: "",
  });
  const [status, setStatus] = useState({ submitting: false, ok: false, err: "" });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((p) => ({ ...p, [name]: type === "checkbox" ? checked : value }));
  };

  const canSubmit = form.name.trim() && form.email.trim() && form.collegeName.trim();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!canSubmit) return;
    setStatus({ submitting: true, ok: false, err: "" });
    try {
      await apiFetch("/api/v1/public/leads", {
        method: "POST",
        body: {
          name: form.name.trim(),
          email: form.email.trim(),
          phone: form.phone.trim() || undefined,
          source: "college_overview",
          meta: {
            designation: form.designation.trim(),
            college_name: form.collegeName.trim(),
            interested_in_pilot_session: form.interestedInPilot,
            message: form.message.trim(),
            page: "/academy/college-overview",
          },
        },
      });
      setStatus({ submitting: false, ok: true, err: "" });
      setForm((p) => ({ ...p, message: "" }));
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : "Something went wrong. Please try email or phone directly.";
      setStatus({ submitting: false, ok: false, err: msg });
    }
  };

  return (
    <div
      className="min-h-screen w-full"
      style={{ fontFamily: "var(--font-dm, 'DM Sans', sans-serif)", backgroundColor: "#030712", color: "rgba(255,255,255,0.75)" }}
    >
      <Header />

      {/* Hero */}
      <section className="relative pt-28 sm:pt-32 pb-14 sm:pb-20 px-4 sm:px-6 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-[#0a1628] via-[#071525] to-black pointer-events-none" aria-hidden />
        <div className="absolute top-20 right-0 w-[420px] h-[420px] bg-violet-600/15 rounded-full blur-[120px] pointer-events-none" aria-hidden />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-cyan-500/10 rounded-full blur-[100px] pointer-events-none" aria-hidden />
        <div className="relative max-w-5xl mx-auto">
          <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-cyan-400/80 mb-4">ExpoGraph Academy</p>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white tracking-tight leading-[1.12] max-w-4xl">
            Institution overview
          </h1>
          <p className="mt-2 text-lg sm:text-xl font-medium text-white/85 max-w-3xl leading-snug">
            A practical AI-era learning &amp; campus transformation platform
          </p>
          <p className="mt-6 text-sm sm:text-base text-white/55 max-w-2xl leading-relaxed">
            Helping colleges move students from passive learning to real building through structured courses, smart prompts, real project practice, resume tools, job discovery, and digital transformation support.
          </p>
          <div className="mt-8 flex flex-wrap gap-2">
            <span className="px-3 py-1.5 rounded-full text-xs font-semibold border border-white/15 bg-white/[0.04] text-white/80">For colleges &amp; higher faculty</span>
            <span className="px-3 py-1.5 rounded-full text-xs font-semibold border border-cyan-400/25 bg-cyan-400/10 text-cyan-200">MCA registered</span>
            <span className="px-3 py-1.5 rounded-full text-xs font-semibold border border-emerald-400/25 bg-emerald-400/10 text-emerald-200">MSME / Udyam registered</span>
            <span className="px-3 py-1.5 rounded-full text-xs font-semibold border border-blue-400/25 bg-blue-400/10 text-blue-200">AICTE approved internships</span>
            <span className="px-3 py-1.5 rounded-full text-xs font-semibold border border-violet-400/25 bg-violet-400/10 text-violet-200">Build-first learning</span>
          </div>
          <p className="mt-6 text-xs sm:text-sm text-white/45 max-w-2xl leading-relaxed">
            ExpoGraph is a formally registered business entity with MCA and MSME/Udyam registration offering AICTE-approved technical internships. This page describes programme design and tooling—not government approval or recognition of certificates unless separately verified.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row gap-3">
            <a
              href={PDF_HREF}
              download
              className="inline-flex items-center justify-center gap-2 min-h-[48px] rounded-full bg-gradient-to-r from-cyan-500 to-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-cyan-500/20 hover:opacity-95 transition"
            >
              <FiDownload className="w-4 h-4" />
              Download college overview PDF
            </a>
            <button
              type="button"
              onClick={() => document.getElementById("contact")?.scrollIntoView({ behavior: "smooth" })}
              className="inline-flex items-center justify-center gap-2 min-h-[48px] rounded-full border border-white/15 bg-white/[0.04] px-6 py-3 text-sm font-semibold text-white hover:bg-white/[0.08] transition"
            >
              Request orientation
              <FiArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </section>

      {/* Why */}
      <section id="why" className="relative py-16 sm:py-20 px-4 sm:px-6 scroll-mt-24" style={{ background: "linear-gradient(180deg, #000 0%, #070b14 100%)" }}>
        <div className="max-w-6xl mx-auto">
          <SectionHeading
            eyebrow="Context"
            title="Why colleges need this now"
            subtitle="Students have access to endless content—yet too many still cannot ship a real project or explain their skills. Colleges need practical, AI-ready systems with visible learner progress."
          />
          <div className="grid sm:grid-cols-2 gap-4">
            {WHY.map((w) => (
              <div
                key={w.t}
                className={`rounded-2xl border p-5 sm:p-6 ${w.c}`}
              >
                <div className={`w-2 h-2 rounded-full mb-4 ${w.dot}`} />
                <h3 className="text-lg font-bold text-white">{w.t}</h3>
                <p className="mt-2 text-sm text-white/55 leading-relaxed">{w.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* What */}
      <section id="what" className="relative py-16 sm:py-20 px-4 sm:px-6 scroll-mt-24 bg-black">
        <div className="max-w-6xl mx-auto">
          <SectionHeading
            eyebrow="Platform"
            title="What ExpoGraph brings to a college"
            subtitle="Six surfaces you can pilot together—or land in stages—for teaching, building, careers, founders, and leadership visibility."
          />
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {BRINGS.map((b) => (
              <div key={b.title} className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-5 sm:p-6 hover:border-white/[0.12] transition-colors">
                <div className={`h-1 w-10 rounded-full bg-gradient-to-r ${b.accent} mb-4`} />
                <h3 className="text-base font-bold text-white">{b.title}</h3>
                <p className="mt-2 text-sm text-white/50 leading-relaxed">{b.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* DTE */}
      <section id="dte" className="relative py-16 sm:py-20 px-4 sm:px-6 scroll-mt-24" style={{ background: "#050a12" }}>
        <div className="max-w-6xl mx-auto">
          <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-[#0f2744]/90 via-[#132a52]/80 to-violet-900/30 p-6 sm:p-10 mb-10 overflow-hidden relative">
            <div className="absolute top-0 right-0 w-72 h-72 bg-violet-500/10 rounded-full blur-[80px] pointer-events-none" aria-hidden />
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-cyan-300/80 mb-3 relative">ExpoGraph DTE · Digital Transformation Engine</p>
            <h2 className="relative text-2xl sm:text-3xl font-bold text-white max-w-xl leading-tight">AI operating system thinking for modern colleges</h2>
            <p className="relative mt-4 text-sm sm:text-base text-white/65 max-w-2xl leading-relaxed">
              DTE helps align student tools, faculty support, basic reporting, and light branding—so campuses become AI-enabled without heavy infrastructure investment on day one.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            {DTE_LAYERS.map(([title, body], i) => (
              <div key={title} className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-5 sm:p-6">
                <span className="text-xs font-bold text-white/35">Layer {i + 1}</span>
                <h3 className="mt-2 text-lg font-bold text-white">{title}</h3>
                <p className="mt-2 text-sm text-white/50 leading-relaxed">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Talent */}
      <section id="talent" className="relative py-16 sm:py-20 px-4 sm:px-6 scroll-mt-24 bg-black">
        <div className="max-w-6xl mx-auto">
          <SectionHeading
            eyebrow="Talent Network"
            title="Exposure—not placement guarantees"
            subtitle="We do not promise guaranteed placements. Students become visible to startup and company partners who are browsing for project-ready talent. Matching remains selective and contextual."
          />
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {TALENT_STEPS.map((s) => (
              <div key={s.n} className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-5 text-center sm:text-left">
                <span className="text-3xl font-extrabold text-white/[0.08] block leading-none">{s.n}</span>
                <h3 className="mt-2 text-base font-bold text-white">{s.t}</h3>
                <p className="mt-2 text-xs sm:text-sm text-white/45 leading-relaxed">{s.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pilot */}
      <section id="pilot" className="relative py-16 sm:py-20 px-4 sm:px-6 scroll-mt-24" style={{ background: "linear-gradient(180deg, #000 0%, #090d18 50%, #000 100%)" }}>
        <div className="max-w-6xl mx-auto">
          <SectionHeading eyebrow="Pilot" title="A simple four-week pilot" />
          <div className="space-y-3">
            {PILOT.map(([tag, title, desc]) => (
              <div
                key={tag + title}
                className={`grid sm:grid-cols-[100px_1fr] gap-4 rounded-2xl border p-4 sm:p-5 ${
                  tag === "Final" ? "border-violet-400/25 bg-violet-500/[0.06]" : "border-white/[0.08] bg-white/[0.02]"
                }`}
              >
                <div className="text-xs font-bold uppercase tracking-wider text-cyan-400/90 pt-1">{tag}</div>
                <div>
                  <p className="font-bold text-white">{title}</p>
                  <p className="mt-1 text-sm text-white/50">{desc}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-8 rounded-2xl border border-cyan-400/30 bg-cyan-500/[0.06] p-6 text-center">
            <p className="text-base sm:text-lg font-bold text-white max-w-xl mx-auto leading-snug">
              Approve a 30-minute ExpoGraph orientation session for one pilot batch.
            </p>
            <p className="mt-2 text-sm text-white/45">Small step · clear artefacts · reversible scope</p>
          </div>
        </div>
      </section>

      {/* Ask */}
      <section id="ask" className="relative py-16 sm:py-20 px-4 sm:px-6 scroll-mt-24 bg-black">
        <div className="max-w-6xl mx-auto">
          <SectionHeading
            eyebrow="Next step"
            title="What we are asking from the college"
            subtitle="Give ExpoGraph one opportunity to demonstrate student interest, practical learning, and campus digital transformation through a small pilot. If useful, scale batch-wise or department-wise."
          />
          <div className="grid sm:grid-cols-3 gap-4">
            {ASK_CARDS.map((c) => (
              <div key={c.title} className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-6">
                <FiCheck className="w-5 h-5 text-emerald-400 mb-4" aria-hidden />
                <h3 className="font-bold text-white">{c.title}</h3>
                <p className="mt-2 text-sm text-white/50 leading-relaxed">{c.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact */}
      <section id="contact" className="relative py-16 sm:py-24 pb-28 px-4 sm:px-6 scroll-mt-24 border-t border-white/[0.06]" style={{ background: "#050509" }}>
        <div className="max-w-xl mx-auto">
          <SectionHeading eyebrow="Contact" title="Start a conversation" subtitle="Tell us who you are and whether you’d like an orientation—we’ll reply with next steps." />
          <form onSubmit={handleSubmit} className="space-y-4 rounded-2xl border border-white/[0.1] bg-white/[0.02] p-5 sm:p-8">
            <div>
              <label className="block text-xs font-medium text-white/50 mb-1.5">Name *</label>
              <input name="name" value={form.name} onChange={handleChange} required className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-violet-500/50" />
            </div>
            <div>
              <label className="block text-xs font-medium text-white/50 mb-1.5">Designation</label>
              <input name="designation" value={form.designation} onChange={handleChange} placeholder="Principal, HOD, TPO..." className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-2.5 text-sm text-white placeholder:text-white/25 focus:outline-none focus:ring-2 focus:ring-violet-500/50" />
            </div>
            <div>
              <label className="block text-xs font-medium text-white/50 mb-1.5">College name *</label>
              <input name="collegeName" value={form.collegeName} onChange={handleChange} required className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-violet-500/50" />
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-white/50 mb-1.5">Phone</label>
                <input name="phone" value={form.phone} onChange={handleChange} type="tel" className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-violet-500/50" />
              </div>
              <div>
                <label className="block text-xs font-medium text-white/50 mb-1.5">Email *</label>
                <input name="email" value={form.email} onChange={handleChange} type="email" required className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-violet-500/50" />
              </div>
            </div>
            <label className="flex items-start gap-3 cursor-pointer">
              <input type="checkbox" name="interestedInPilot" checked={form.interestedInPilot} onChange={handleChange} className="mt-1 rounded border-white/20 bg-black/40 text-violet-500 focus:ring-violet-500/40" />
              <span className="text-sm text-white/60">Interested in a pilot orientation session</span>
            </label>
            <div>
              <label className="block text-xs font-medium text-white/50 mb-1.5">Message</label>
              <textarea name="message" value={form.message} onChange={handleChange} rows={4} className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-violet-500/50 resize-y" />
            </div>
            {status.err ? <p className="text-sm text-red-400">{status.err}</p> : null}
            {status.ok ? (
              <p className="text-sm text-emerald-400 flex items-center gap-2">
                <FiCheck className="w-4 h-4" />
                Thank you—we received your details.
              </p>
            ) : null}
            <button
              type="submit"
              disabled={!canSubmit || status.submitting}
              className="w-full inline-flex items-center justify-center gap-2 min-h-[48px] rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 text-sm font-semibold text-white disabled:opacity-40 disabled:cursor-not-allowed hover:opacity-95 transition"
            >
              <FiSend className="w-4 h-4" />
              {status.submitting ? "Sending…" : "Submit"}
            </button>
          </form>
          <p className="mt-8 text-center text-sm text-white/35">
            <Link to="/academy" className="text-violet-400 hover:underline">
              Back to ExpoGraph Academy
            </Link>
          </p>
        </div>
      </section>
    </div>
  );
}
