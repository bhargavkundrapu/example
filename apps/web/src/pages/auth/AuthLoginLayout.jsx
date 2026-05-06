import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Header } from "../../Components/ui/header-2";
import { MCA_LOGO_URL, MSME_LOGO_URL } from "../../constants/trustLogos";

export const LOGO_URL = "https://res.cloudinary.com/da2wrgabu/image/upload/v1772253658/Graph_2_pbetc4.png";
export const ICON_URL = "https://res.cloudinary.com/da2wrgabu/image/upload/v1772280495/e_x_1_m5jb9s.png";

export const testimonials = [
  { name: "Arjun S.", role: "Vibe Coding Student", text: "Vibe Coding taught me to build full apps with smart prompts. I shipped my first SaaS in 2 weeks flat." },
  { name: "Priya M.", role: "AI Automations Student", text: "The AI Automations course is next level. I automated my workflow and landed a freelance gig through Real Client Lab." },
  { name: "Rahul K.", role: "CS Student, 3rd Year", text: "Vibe Coding + Prompt Engineering at ₹99 each? I've paid ₹10K+ elsewhere for worse content. Absolute steal." },
  { name: "Sneha D.", role: "Prompt Engineering Student", text: "Prompt Engineering taught me to think like a 10x developer. The resume builder + certificate helped me crack 3 interviews." },
  { name: "Vikram T.", role: "Freelancer", text: "AI Automations + Real Client Lab gave me actual portfolio pieces. No other platform does that at this price point." },
  { name: "Ananya R.", role: "BCA Student", text: "Started with Prompt Engineering, then Vibe Coding-went from zero to building full apps in 8 weeks. Brilliant." },
];

/**
 * Shared shell for /login and /adminlogin-same visual layout as the public login experience.
 */
export default function AuthLoginLayout({
  cardTitle = "Welcome Back",
  cardSubtitle = "Prompt Smart. Vibe Code. Grow Your Career.",
  children,
  theme = "dark",
  onToggleTheme,
}) {
  const isLight = theme === "light";
  return (
    <div
      className="min-h-screen relative w-full"
      style={{
        fontFamily: "var(--font-dm)",
        backgroundColor: isLight ? "#f8fafc" : "#000000",
        color: "var(--text-secondary)",
      }}
    >
      <Header />
      <div className="overflow-x-hidden">
        <div className="fixed inset-0 -z-10">
          <div
            className={`absolute inset-0 ${
              isLight
                ? "bg-[radial-gradient(ellipse_80%_60%_at_50%_-10%,rgba(124,58,237,0.10),transparent_50%)]"
                : "bg-[radial-gradient(ellipse_80%_60%_at_50%_-10%,rgba(124,58,237,0.18),transparent_50%)]"
            }`}
          />
          <div
            className={`absolute inset-0 ${
              isLight
                ? "bg-[radial-gradient(ellipse_60%_50%_at_80%_80%,rgba(168,85,247,0.08),transparent_60%)]"
                : "bg-[radial-gradient(ellipse_60%_50%_at_80%_80%,rgba(168,85,247,0.1),transparent_60%)]"
            }`}
          />
          <div
            className={`absolute inset-0 ${
              isLight
                ? "bg-[radial-gradient(ellipse_40%_40%_at_10%_60%,rgba(88,28,135,0.08),transparent_50%)]"
                : "bg-[radial-gradient(ellipse_40%_40%_at_10%_60%,rgba(88,28,135,0.12),transparent_50%)]"
            }`}
          />
        </div>

        <div className="min-h-screen flex flex-col lg:flex-row pt-20 md:pt-24">
          <div className="absolute top-24 right-4 sm:right-6 z-20">
            <button
              type="button"
              onClick={onToggleTheme}
              className={`inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-xs sm:text-sm font-medium transition-colors ${
                isLight
                  ? "border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
                  : "border-white/15 bg-white/[0.06] text-white/80 hover:bg-white/[0.10]"
              }`}
            >
              {isLight ? "Switch to Dark" : "Switch to Light"}
            </button>
          </div>
          <div className="hidden lg:flex lg:w-[45%] xl:w-[50%] flex-col justify-center px-10 xl:px-16 py-12">
            <motion.div
              initial={{ opacity: 0, x: -40 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.7 }}
            >
              <Link to="/" className="inline-block mb-8">
                <img src={LOGO_URL} alt="ExpoGraph" className="h-16 w-auto" />
              </Link>

              <h2 className={`text-3xl xl:text-4xl font-bold leading-tight mb-3 ${isLight ? "text-slate-900" : "text-white"}`}>
                Where users become{" "}
                <span className="bg-gradient-to-r from-violet-400 via-purple-400 to-fuchsia-400 text-transparent bg-clip-text">
                  builders
                </span>
              </h2>
              <p className={`text-base leading-relaxed mb-8 max-w-md ${isLight ? "text-slate-600" : "text-white/50"}`}>
                Join 2,000+ users mastering Vibe Coding, Prompt Engineering & AI Automations-with smart prompts and real-world projects, all starting at just ₹99.
              </p>

              <div className="flex gap-6 mb-10">
                {[
                  { value: "2K+", label: "Active Users" },
                  { value: "₹99", label: "Courses From" },
                  { value: "100%", label: "Real Projects" },
                ].map((s) => (
                  <div key={s.label}>
                    <div className={`text-2xl font-bold ${isLight ? "text-slate-900" : "text-white"}`}>{s.value}</div>
                    <div className={`text-xs mt-0.5 ${isLight ? "text-slate-500" : "text-white/40"}`}>{s.label}</div>
                  </div>
                ))}
              </div>

              <div className="space-y-3 overflow-hidden max-h-[320px] relative">
                <div className={`absolute top-0 left-0 right-0 h-8 z-10 pointer-events-none ${isLight ? "bg-gradient-to-b from-slate-50 to-transparent" : "bg-gradient-to-b from-black to-transparent"}`} />
                <div className={`absolute bottom-0 left-0 right-0 h-8 z-10 pointer-events-none ${isLight ? "bg-gradient-to-t from-slate-50 to-transparent" : "bg-gradient-to-t from-black to-transparent"}`} />
                <motion.div
                  animate={{ y: [0, -(testimonials.length * 100)] }}
                  transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
                  className="space-y-3"
                >
                  {[...testimonials, ...testimonials].map((t, i) => (
                    <div
                      key={`${t.name}-${i}`}
                      className={`rounded-xl p-4 ${isLight ? "border border-slate-200 bg-white" : "border border-white/[0.06] bg-white/[0.02]"}`}
                    >
                      <div className="flex items-center gap-1 mb-2">
                        {[...Array(5)].map((_, s) => (
                          <svg key={s} className="w-3 h-3 text-amber-400" viewBox="0 0 20 20" fill="currentColor">
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                        ))}
                      </div>
                      <p className={`text-sm leading-relaxed mb-2 ${isLight ? "text-slate-600" : "text-white/60"}`}>"{t.text}"</p>
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center text-[10px] font-bold text-white">
                          {t.name[0]}
                        </div>
                        <div>
                          <span className={`text-xs font-medium ${isLight ? "text-slate-800" : "text-white/80"}`}>{t.name}</span>
                          <span className={`text-xs ml-1.5 ${isLight ? "text-slate-500" : "text-white/30"}`}>{t.role}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </motion.div>
              </div>

              <div className="mt-8 flex flex-col gap-3">
                <div className="flex items-center justify-center lg:justify-start gap-3 flex-wrap">
                  <div className="rounded-lg bg-white p-1.5 shadow-sm shadow-black/25">
                    <img
                      src={MCA_LOGO_URL}
                      alt="Ministry of Corporate Affairs"
                      className="h-8 sm:h-9 w-auto max-w-[120px] object-contain"
                      referrerPolicy="no-referrer"
                      loading="eager"
                      decoding="async"
                    />
                  </div>
                  <div className="rounded-lg bg-white p-1.5 shadow-sm shadow-black/25">
                    <img
                      src={MSME_LOGO_URL}
                      alt="Ministry of Micro, Small and Medium Enterprises"
                      className="h-8 sm:h-9 w-auto max-w-[130px] object-contain"
                      referrerPolicy="no-referrer"
                      loading="eager"
                      decoding="async"
                    />
                  </div>
                </div>
                <div className="flex items-center gap-2 justify-center lg:justify-start">
                  <svg className="w-4 h-4 shrink-0 text-amber-400/60" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 2L6 6v3c0 5.25 2.55 10.15 6 12 3.45-1.85 6-6.75 6-12V6l-6-4z" />
                    <path d="M9 12l2 2 4-4" />
                  </svg>
                  <span className={`text-xs text-center lg:text-left leading-snug ${isLight ? "text-slate-500" : "text-white/35"}`}>
                    Recognised by MCA &amp; MSME, Government of India
                  </span>
                </div>
              </div>
            </motion.div>
          </div>

          <div className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-10">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="w-full max-w-md"
            >
              <div className="lg:hidden text-center mb-6">
                <Link to="/" className="inline-block mb-4">
                  <img src={LOGO_URL} alt="ExpoGraph" className="h-14 w-auto mx-auto" />
                </Link>
                <div className="flex justify-center gap-5 mb-4">
                  {[
                    { value: "2K+", label: "Users" },
                    { value: "₹99", label: "From" },
                    { value: "4.9★", label: "Rating" },
                  ].map((s) => (
                    <div key={s.label} className="text-center">
                      <div className={`text-lg font-bold ${isLight ? "text-slate-900" : "text-white"}`}>{s.value}</div>
                      <div className={`text-[10px] ${isLight ? "text-slate-500" : "text-white/40"}`}>{s.label}</div>
                    </div>
                  ))}
                </div>
                <div className={`rounded-xl p-3 mx-auto max-w-xs mb-2 ${isLight ? "border border-slate-200 bg-white" : "border border-white/[0.06] bg-white/[0.02]"}`}>
                  <div className="flex items-center gap-1 mb-1.5 justify-center">
                    {[...Array(5)].map((_, s) => (
                      <svg key={s} className="w-2.5 h-2.5 text-amber-400" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    ))}
                  </div>
                  <p className={`text-xs leading-relaxed ${isLight ? "text-slate-600" : "text-white/50"}`}>"Vibe Coding taught me to build full apps with smart prompts. I shipped my first SaaS in 2 weeks flat."</p>
                  <span className={`text-[10px] mt-1 block ${isLight ? "text-slate-500" : "text-white/30"}`}>-Arjun S., Vibe Coding Student</span>
                </div>
              </div>

              <div className={`rounded-2xl backdrop-blur-xl p-7 sm:p-8 md:p-10 ${isLight ? "border border-slate-200 bg-white shadow-[0_0_40px_-16px_rgba(15,23,42,0.25)]" : "border border-white/[0.08] bg-white/[0.03] shadow-[0_0_60px_-12px_rgba(124,58,237,0.15)]"}`}>
                <div className="text-center mb-6">
                  <div className="flex items-center justify-center mb-4">
                    <img src={ICON_URL} alt="ExpoGraph" className="h-16 w-16 rounded-2xl object-contain" />
                  </div>
                  <h1 className={`text-2xl md:text-3xl font-bold mb-1 ${isLight ? "text-slate-900" : "text-white"}`}>
                    {cardTitle}
                  </h1>
                  <p className={`text-sm ${isLight ? "text-slate-500" : "text-white/40"}`}>
                    {cardSubtitle}
                  </p>
                </div>

                {children}

                <div className="mt-8 text-center">
                  <Link
                    to="/academy"
                    className={`inline-flex items-center gap-2 text-sm transition-colors ${isLight ? "text-slate-500 hover:text-slate-700" : "text-white/30 hover:text-white/60"}`}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                    </svg>
                    Back to Academy
                  </Link>
                </div>
              </div>

              <div className="lg:hidden mt-5 flex flex-col items-center gap-3">
                <div className="flex items-center justify-center gap-3">
                  <div className="rounded-md bg-white p-1">
                    <img
                      src={MCA_LOGO_URL}
                      alt=""
                      className="h-7 w-auto max-w-[100px] object-contain"
                      referrerPolicy="no-referrer"
                      loading="lazy"
                      decoding="async"
                    />
                  </div>
                  <div className="rounded-md bg-white p-1">
                    <img
                      src={MSME_LOGO_URL}
                      alt=""
                      className="h-7 w-auto max-w-[110px] object-contain"
                      referrerPolicy="no-referrer"
                      loading="lazy"
                      decoding="async"
                    />
                  </div>
                </div>
                <div className={`flex items-center gap-2 px-4 py-2 rounded-full max-w-sm ${isLight ? "border border-slate-200 bg-white" : "border border-white/[0.06] bg-white/[0.02]"}`}>
                  <svg className="w-3.5 h-3.5 shrink-0 text-amber-400/60" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 2L6 6v3c0 5.25 2.55 10.15 6 12 3.45-1.85 6-6.75 6-12V6l-6-4z" />
                    <path d="M9 12l2 2 4-4" />
                  </svg>
                  <span className={`text-[11px] text-center leading-snug ${isLight ? "text-slate-500" : "text-white/35"}`}>
                    Recognised by MCA &amp; MSME, Government of India
                  </span>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}
