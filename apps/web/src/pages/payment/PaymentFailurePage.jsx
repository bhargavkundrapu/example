import { Link, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { Header } from "../../Components/ui/header-2";
import { TubesBackground } from "../../Components/ui/neon-flow";
import FlowTubesFooterInner from "../../Components/ui/FlowTubesFooterInner";
import { FiXCircle, FiRefreshCw, FiMessageCircle, FiArrowLeft } from "react-icons/fi";

const WHATSAPP_NUMBER = "9014110638";

export default function PaymentFailurePage() {
  const [searchParams] = useSearchParams();
  const itemTitle = searchParams.get("title") || "";

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
        <section className="relative min-h-[70vh] flex flex-col items-center justify-center px-4 sm:px-6 md:px-8 py-16">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(220,38,38,0.08),transparent)]" />
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="relative max-w-2xl mx-auto text-center space-y-8"
          >
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-red-500/20 border border-red-500/30 mb-4">
              <FiXCircle className="w-10 h-10 text-red-500" />
            </div>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white tracking-tight">
              Payment failed
            </h1>
            <p className="text-lg sm:text-xl text-slate-400 leading-relaxed">
              Your payment could not be completed.
              {itemTitle && (
                <span className="block mt-2 text-white/80">Failed for: {itemTitle}</span>
              )}
            </p>

            <div className="rounded-xl bg-slate-800/40 border border-slate-700/50 p-6 text-left max-w-md mx-auto">
              <p className="text-slate-300 text-sm mb-4">
                Common reasons: card declined, insufficient funds, or payment was cancelled. Try again with a different payment method.
              </p>
              <a
                href={`https://wa.me/91${WHATSAPP_NUMBER.replace(/\D/g, "")}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#25D366] hover:bg-[#20bd5a] text-white rounded-lg font-medium transition-colors"
              >
                <FiMessageCircle className="w-5 h-5" />
                Need help? WhatsApp us
              </a>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-4">
              <Link
                to="/courses"
                className="inline-flex items-center gap-2 px-8 py-4 bg-white text-black font-semibold rounded-full hover:bg-slate-100 transition-colors"
              >
                <FiRefreshCw className="w-5 h-5" />
                Try payment again
              </Link>
              <Link
                to="/academy"
                className="inline-flex items-center gap-2 px-8 py-4 border border-white/30 text-white font-medium rounded-full hover:bg-white/10 transition-colors"
              >
                <FiArrowLeft className="w-5 h-5" />
                Back to Academy
              </Link>
            </div>
          </motion.div>
        </section>

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
