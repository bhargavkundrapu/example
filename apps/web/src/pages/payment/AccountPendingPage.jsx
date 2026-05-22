import { useSearchParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Header } from "../../Components/ui/header-2";
import { TubesBackground } from "../../Components/ui/neon-flow";
import FlowTubesFooterInner from "../../Components/ui/FlowTubesFooterInner";
import { FiCheckCircle, FiClock, FiMessageCircle } from "react-icons/fi";

const WHATSAPP_NUMBER = "9014110638";

export default function AccountPendingPage() {
  const [searchParams] = useSearchParams();
  const email = searchParams.get("email") || "";

  return (
    <div
      className="min-h-screen relative w-full"
      style={{
        fontFamily: "var(--font-dm)",
        backgroundColor: "#000000",
        color: "var(--text-secondary)",
      }}
    >
      <Header />

      <div className="overflow-x-hidden pt-20 sm:pt-24">
        {/* Main content-centered, neat design inspired by Academy */}
        <section className="relative min-h-[70vh] flex flex-col items-center justify-center px-4 sm:px-6 md:px-8 py-16">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(120,80,255,0.15),transparent)]" />
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="relative max-w-2xl mx-auto text-center space-y-8"
          >
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-500/20 border border-green-500/30 mb-4">
              <FiCheckCircle className="w-10 h-10 text-green-500" />
            </div>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white tracking-tight">
              Payment successful
            </h1>
            <p className="text-lg sm:text-xl text-slate-400 leading-relaxed">
              Your account will be created in a moment. We're customising your LMS portal-it takes a few minutes.
            </p>

            <div className="flex items-center justify-center gap-2 text-slate-500 py-4">
              <FiClock className="w-5 h-5" />
              <span className="text-sm">Usually ready within 5–15 minutes</span>
            </div>

            <div className="rounded-xl bg-slate-800/40 border border-slate-700/50 p-6 text-left max-w-md mx-auto">
              <p className="text-slate-300 text-sm mb-4">
                If your account hasn't been created within an hour, reach out to us:
              </p>
              <a
                href={`https://wa.me/91${WHATSAPP_NUMBER.replace(/\D/g, "")}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#25D366] hover:bg-[#20bd5a] text-white rounded-lg font-medium transition-colors"
              >
                <FiMessageCircle className="w-5 h-5" />
                WhatsApp us at {WHATSAPP_NUMBER}
              </a>
            </div>

            <div className="pt-8">
              <Link
                to={email ? `/login?email=${encodeURIComponent(email)}` : "/login"}
                className="inline-flex items-center gap-2 px-8 py-4 bg-white text-black font-semibold rounded-full hover:bg-slate-100 transition-colors"
              >
                Go to Login
              </Link>
              <p className="mt-4 text-slate-500 text-sm">
                Use the email you provided and request an OTP to sign in.
              </p>
            </div>
          </motion.div>
        </section>

        {/* Footer-same as Academy */}
        <footer className="w-full min-h-[320px] sm:min-h-[40vh] ">
          <TubesBackground className="min-h-[320px] sm:min-h-[40vh] bg-[#0a0a0a]" enableClickInteraction={false}>
            <FlowTubesFooterInner
              shellClassName="min-h-[320px] sm:min-h-[40vh]"
              title="ExpoGraph"
              titleClassName="text-3xl font-bold tracking-tighter text-white sm:text-4xl md:text-5xl"
              showInteractionHint={false}
            />
          </TubesBackground>
        </footer>
      </div>
    </div>
  );
}
