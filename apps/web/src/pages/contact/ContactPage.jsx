import { useEffect, useState } from "react";
import { Header } from "../../Components/ui/header-2";
import { TubesBackground } from "../../Components/ui/neon-flow";
import FlowTubesFooterInner from "../../Components/ui/FlowTubesFooterInner";
import { FiMail, FiPhone, FiMapPin, FiSend, FiMessageCircle, FiClock, FiCheckCircle } from "react-icons/fi";
import "../../styles/academy-tokens.css";

const WA_NUMBER = "919014110638";

const CONTACT_INFO = [
  {
    icon: FiMail,
    label: "Email",
    value: "khadar.shaik@expograph.in",
    href: "mailto:khadar.shaik@expograph.in",
    color: "from-violet-400 to-fuchsia-400",
  },
  {
    icon: FiPhone,
    label: "Phone",
    value: "+91 90141 10638",
    href: "tel:+919014110638",
    color: "from-cyan-400 to-blue-400",
  },
  {
    icon: FiMapPin,
    label: "Location",
    value: "Vishakapatnam, India",
    href: null,
    color: "from-amber-400 to-orange-400",
  },
  {
    icon: FiClock,
    label: "Response Time",
    value: "Within 24 hours",
    href: null,
    color: "from-emerald-400 to-teal-400",
  },
];

const TOPICS = [
  "Course inquiry",
  "Payment issue",
  "Technical support",
  "Partnership",
  "Feedback",
  "Other",
];

function buildWhatsAppURL({ name, email, topic, message }) {
  const lines = [
    `*Name:* ${name}`,
    `*Email:* ${email}`,
    `*Topic:* ${topic}`,
    "",
    message,
  ];
  return `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(lines.join("\n"))}`;
}

export default function ContactPage() {
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
  }, []);

  const [form, setForm] = useState({ name: "", email: "", topic: "", message: "" });
  const [submitted, setSubmitted] = useState(false);

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const canSubmit = form.name.trim() && form.email.trim() && form.topic && form.message.trim().length >= 10;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!canSubmit) return;
    window.open(buildWhatsAppURL(form), "_blank");
    setSubmitted(true);
  };

  return (
    <div className="min-h-screen relative w-full" style={{ fontFamily: "var(--font-dm, 'DM Sans', sans-serif)", backgroundColor: "black", color: "var(--text-secondary)" }}>
      <Header />

      {/* Hero */}
      <section className="relative pt-32 pb-16 sm:pt-40 sm:pb-20 px-4" style={{ backgroundColor: "#000000" }}>
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-1/4 w-72 h-72 bg-violet-500/10 rounded-full blur-[120px]" />
          <div className="absolute bottom-10 right-1/4 w-64 h-64 bg-fuchsia-500/10 rounded-full blur-[100px]" />
        </div>
        <div className="relative max-w-4xl mx-auto text-center">
          <span className="inline-block px-4 py-1.5 rounded-full text-xs font-medium tracking-wider uppercase bg-white/[0.06] text-white/60 border border-white/[0.08] mb-6">
            Get in touch
          </span>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight text-white leading-tight">
            Let&apos;s{" "}
            <span className="bg-gradient-to-r from-violet-400 to-fuchsia-400 bg-clip-text text-transparent">
              connect
            </span>
          </h1>
          <p className="mt-4 text-base sm:text-lg text-white/50 max-w-xl mx-auto">
            Have a question, feedback, or want to partner with us? We&apos;d love to hear from you.
          </p>
        </div>
      </section>

      {/* Contact cards */}
      <section className="px-4 pb-12 sm:pb-16" style={{ backgroundColor: "#000000" }}>
        <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
          {CONTACT_INFO.map((item) => (
            <a
              key={item.label}
              href={item.href || undefined}
              className={`group relative rounded-2xl border border-white/[0.06] bg-white/[0.03] p-4 sm:p-5 text-center transition-all duration-300 hover:bg-white/[0.06] hover:border-white/[0.12] ${item.href ? "cursor-pointer" : "cursor-default"}`}
            >
              <div className={`mx-auto mb-3 flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-xl bg-gradient-to-br ${item.color} shadow-lg`}>
                <item.icon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </div>
              <p className="text-[11px] sm:text-xs uppercase tracking-wider text-white/40 mb-1">{item.label}</p>
              <p className="text-xs sm:text-sm font-medium text-white/80 group-hover:text-white transition-colors break-all">
                {item.value}
              </p>
            </a>
          ))}
        </div>
      </section>

      {/* Form section */}
      <section className="px-4 pb-20 sm:pb-28" style={{ backgroundColor: "#000000" }}>
        <div className="max-w-5xl mx-auto grid md:grid-cols-5 gap-8 md:gap-12">
          {/* Left */}
          <div className="md:col-span-2 flex flex-col justify-center">
            <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4">
              We&apos;re here to{" "}
              <span className="bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">help</span>
            </h2>
            <p className="text-sm sm:text-base text-white/50 leading-relaxed mb-6">
              Whether you need guidance picking the right course, facing a payment issue, or want to collaborate-drop us a message and we&apos;ll get back to you quickly.
            </p>
            <div className="space-y-4">
              {[
                { icon: FiMessageCircle, text: "Friendly and fast support" },
                { icon: FiCheckCircle, text: "Replies within 24 hours" },
                { icon: FiSend, text: "Direct access to our team" },
              ].map((item) => (
                <div key={item.text} className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/[0.06]">
                    <item.icon className="w-4 h-4 text-violet-400" />
                  </div>
                  <span className="text-sm text-white/60">{item.text}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Right - form */}
          <div className="md:col-span-3">
            {submitted ? (
              <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/[0.06] p-8 sm:p-10 text-center">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/20">
                  <FiCheckCircle className="w-7 h-7 text-emerald-400" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">Message sent via WhatsApp!</h3>
                <p className="text-sm text-white/50 mb-6">
                  Thanks for reaching out. We&apos;ll get back to you within 24 hours.
                </p>
                <button
                  onClick={() => { setSubmitted(false); setForm({ name: "", email: "", topic: "", message: "" }); }}
                  className="px-5 py-2 text-sm font-medium rounded-lg bg-white/[0.06] text-white/70 hover:bg-white/[0.1] hover:text-white transition-all border border-white/[0.08]"
                >
                  Send another message
                </button>
              </div>
            ) : (
              <form
                onSubmit={handleSubmit}
                className="rounded-2xl border border-white/[0.06] bg-white/[0.03] p-6 sm:p-8 space-y-5"
              >
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-white/40 uppercase tracking-wider mb-1.5">Name</label>
                    <input
                      name="name"
                      value={form.name}
                      onChange={handleChange}
                      placeholder="Your name"
                      className="w-full rounded-lg border border-white/[0.08] bg-white/[0.04] px-4 py-2.5 text-sm text-white placeholder-white/30 outline-none focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/30 transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-white/40 uppercase tracking-wider mb-1.5">Email</label>
                    <input
                      name="email"
                      type="email"
                      value={form.email}
                      onChange={handleChange}
                      placeholder="you@example.com"
                      className="w-full rounded-lg border border-white/[0.08] bg-white/[0.04] px-4 py-2.5 text-sm text-white placeholder-white/30 outline-none focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/30 transition-all"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-white/40 uppercase tracking-wider mb-1.5">Topic</label>
                  <select
                    name="topic"
                    value={form.topic}
                    onChange={handleChange}
                    className="w-full rounded-lg border border-white/[0.08] bg-white/[0.04] px-4 py-2.5 text-sm text-white outline-none focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/30 transition-all appearance-none"
                  >
                    <option value="" className="bg-neutral-900 text-white/40">Select a topic</option>
                    {TOPICS.map((t) => (
                      <option key={t} value={t} className="bg-neutral-900 text-white">{t}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-white/40 uppercase tracking-wider mb-1.5">Message</label>
                  <textarea
                    name="message"
                    value={form.message}
                    onChange={handleChange}
                    rows={5}
                    placeholder="Tell us what's on your mind..."
                    className="w-full rounded-lg border border-white/[0.08] bg-white/[0.04] px-4 py-2.5 text-sm text-white placeholder-white/30 outline-none focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/30 transition-all resize-none"
                  />
                </div>
                <button
                  type="submit"
                  disabled={!canSubmit}
                  className="w-full flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-violet-500 to-fuchsia-500 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-violet-500/20 hover:shadow-violet-500/30 hover:brightness-110 transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                >
                  <FiSend className="w-4 h-4" />
                  Send via WhatsApp
                </button>
              </form>
            )}
          </div>
        </div>
      </section>

      {/* Social Connect */}
      <section className="px-4 pb-20 sm:pb-28" style={{ backgroundColor: "#000000" }}>
        <div className="max-w-5xl mx-auto text-center">
          <p className="text-xs font-medium uppercase tracking-widest text-white/30 mb-6">Follow us on</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
            {/* Instagram */}
            <a
              href="https://www.instagram.com/expograph_tech/"
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-center gap-4 rounded-2xl border border-white/[0.06] bg-white/[0.03] p-5 transition-all duration-300 hover:bg-fuchsia-500/[0.06] hover:border-fuchsia-500/20"
            >
              <div className="flex-shrink-0 w-11 h-11 rounded-xl bg-gradient-to-br from-amber-400 via-pink-500 to-purple-600 flex items-center justify-center shadow-lg">
                <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>
              </div>
              <div className="text-left min-w-0">
                <p className="text-sm font-semibold text-white group-hover:text-fuchsia-300 transition-colors">Instagram</p>
                <p className="text-xs text-white/40">@expograph_tech</p>
              </div>
            </a>

            {/* YouTube */}
            <a
              href="https://www.youtube.com/@Expograph-3"
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-center gap-4 rounded-2xl border border-white/[0.06] bg-white/[0.03] p-5 transition-all duration-300 hover:bg-red-500/[0.06] hover:border-red-500/20"
            >
              <div className="flex-shrink-0 w-11 h-11 rounded-xl bg-red-600 flex items-center justify-center shadow-lg">
                <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="currentColor"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>
              </div>
              <div className="text-left min-w-0">
                <p className="text-sm font-semibold text-white group-hover:text-red-300 transition-colors">YouTube</p>
                <p className="text-xs text-white/40">@Expograph-3</p>
              </div>
            </a>

            {/* LinkedIn */}
            <a
              href="https://www.linkedin.com/company/109629393/"
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-center gap-4 rounded-2xl border border-white/[0.06] bg-white/[0.03] p-5 transition-all duration-300 hover:bg-blue-500/[0.06] hover:border-blue-500/20"
            >
              <div className="flex-shrink-0 w-11 h-11 rounded-xl bg-blue-600 flex items-center justify-center shadow-lg">
                <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
              </div>
              <div className="text-left min-w-0">
                <p className="text-sm font-semibold text-white group-hover:text-blue-300 transition-colors">LinkedIn</p>
                <p className="text-xs text-white/40">ExpoGraph</p>
              </div>
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="w-full min-h-[560px] sm:min-h-[70vh] border-t border-black">
        <TubesBackground className="min-h-[560px] sm:min-h-[70vh] bg-[#0a0a0a]" enableClickInteraction={true}>
          <FlowTubesFooterInner shellClassName="min-h-[560px] sm:min-h-[70vh]" />
        </TubesBackground>
      </footer>
    </div>
  );
}
