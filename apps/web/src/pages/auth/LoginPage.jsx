import { useState, useRef, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../../app/providers/AuthProvider";
import { homePathForRole } from "../../app/roles";
import AuthLoginLayout from "./AuthLoginLayout";

const RESEND_COOLDOWN_SEC = 60;

export default function LoginPage() {
  const { requestOtp, login } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const emailParam = searchParams.get("email") || "";
  const purchased = searchParams.get("purchased") === "1";

  const [step, setStep] = useState(1);
  const [email, setEmail] = useState(emailParam);
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [resendSeconds, setResendSeconds] = useState(0);
  const [emailFocused, setEmailFocused] = useState(false);
  const otpInputRefs = useRef([]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [theme, setTheme] = useState("dark");
  const isLight = theme === "light";

  useEffect(() => {
    if (emailParam) setEmail(emailParam);
  }, [emailParam]);

  useEffect(() => {
    setTheme("dark");
  }, []);

  const startResendCooldown = () => {
    setResendSeconds(RESEND_COOLDOWN_SEC);
  };

  useEffect(() => {
    if (resendSeconds <= 0) return;
    const t = setInterval(() => setResendSeconds((s) => s - 1), 1000);
    return () => clearInterval(t);
  }, [resendSeconds]);

  const handleRequestOtp = async (e) => {
    e?.preventDefault();
    setError("");
    setSuccessMsg("");
    setLoading(true);

    try {
      await requestOtp(email);
      setSuccessMsg("Check your inbox! We've sent you a 6-digit code.");
      setStep(2);
      startResendCooldown();
      setOtp(["", "", "", "", "", ""]);
      otpInputRefs.current[0]?.focus();
    } catch (err) {
      setError(err?.message || "Failed to send OTP. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e, codeOverride) => {
    e?.preventDefault?.();
    const code = codeOverride ?? otp.join("");
    if (code.length !== 6) {
      setError("Please enter all 6 digits.");
      return;
    }
    setError("");
    setLoading(true);

    try {
      const data = await login({ email, otp: code });
      navigate(homePathForRole(data.role), { replace: true });
    } catch (err) {
      setError(err?.message || "Invalid code. Please try again or request a new one.");
    } finally {
      setLoading(false);
    }
  };

  const handleOtpChange = (idx, val) => {
    if (!/^\d*$/.test(val)) return;
    const next = [...otp];
    next[idx] = val.slice(-1);
    setOtp(next);
    setError("");

    if (val && idx < 5) otpInputRefs.current[idx + 1]?.focus();
    if (next.every((d) => d)) {
      const fullCode = next.join("");
      setTimeout(() => handleVerifyOtp(null, fullCode), 0);
    }
  };

  const handleOtpPaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (!pasted) return;
    const digits = pasted.split("");
    const next = [...otp];
    digits.forEach((d, i) => { next[i] = d; });
    setOtp(next);
    setError("");
    const focusIdx = Math.min(digits.length, 5);
    otpInputRefs.current[focusIdx]?.focus();
    if (digits.length === 6) {
      setTimeout(() => handleVerifyOtp(null, pasted), 0);
    }
  };

  const handleOtpKeyDown = (idx, e) => {
    if (e.key === "Backspace" && !otp[idx] && idx > 0) {
      otpInputRefs.current[idx - 1]?.focus();
    }
  };

  const handleBackToEmail = () => {
    setStep(1);
    setOtp(["", "", "", "", "", ""]);
    setError("");
    setSuccessMsg("");
  };

  return (
    <AuthLoginLayout
      theme={theme}
      onToggleTheme={() => setTheme((t) => (t === "dark" ? "light" : "dark"))}
    >
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`mb-6 p-4 rounded-xl text-sm ${isLight ? "bg-red-50 border border-red-200 text-red-700" : "bg-red-500/10 border border-red-500/20 text-red-400"}`}
        >
          {error}
        </motion.div>
      )}

      {purchased && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`mb-6 p-4 rounded-xl text-sm flex items-center gap-2 ${isLight ? "bg-emerald-50 border border-emerald-200 text-emerald-700" : "bg-emerald-500/10 border border-emerald-500/20 text-emerald-400"}`}
        >
          <svg className="w-5 h-5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
          Payment successful. Log in with this email to access your courses.
        </motion.div>
      )}

      {successMsg && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`mb-6 p-4 rounded-xl text-sm flex items-center gap-2 ${isLight ? "bg-emerald-50 border border-emerald-200 text-emerald-700" : "bg-emerald-500/10 border border-emerald-500/20 text-emerald-400"}`}
        >
          <svg className="w-5 h-5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
          {successMsg}
        </motion.div>
      )}

      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className={`mb-6 rounded-xl px-4 py-4 ${isLight ? "border border-violet-200 bg-violet-50" : "border border-violet-400/25 bg-violet-500/[0.08]"}`}
      >
        <p className={`text-sm leading-relaxed ${isLight ? "text-violet-900" : "text-violet-100"}`}>
          New here? Purchase any course (starting from <span className={`font-semibold ${isLight ? "text-violet-950" : "text-white"}`}>₹99</span>) to
          unlock student access, then log in with your registered email.
        </p>
        <Link
          to="/courses"
          className={`mt-3 inline-flex items-center gap-2 text-sm font-semibold transition-colors underline underline-offset-4 ${isLight ? "text-violet-700 hover:text-violet-900" : "text-violet-200 hover:text-white"}`}
        >
          Explore courses
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
          </svg>
        </Link>
      </motion.div>

      <AnimatePresence mode="wait">
        {step === 1 && (
          <motion.form
            key="student-step1"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.3 }}
            onSubmit={handleRequestOtp}
            className="space-y-6"
          >
            <p className={`text-sm text-center -mt-2 mb-2 ${isLight ? "text-slate-500" : "text-white/40"}`}>
              Sign in with a one-time code sent to your email
            </p>

            <div className="flex justify-center gap-2">
              <div className="h-1.5 w-8 rounded-full bg-violet-500 transition-all duration-300" />
              <div className="h-1.5 w-2 rounded-full bg-white/10 transition-all duration-300" />
            </div>

            <div>
              <label className={`block text-sm font-medium mb-2 ${isLight ? "text-slate-600" : "text-white/60"}`}>
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <svg
                    className={`w-5 h-5 transition-colors ${emailFocused ? "text-violet-400" : isLight ? "text-slate-400" : "text-white/25"}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                  </svg>
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onFocus={() => setEmailFocused(true)}
                  onBlur={() => setEmailFocused(false)}
                  required
                  autoComplete="email"
                  className={`w-full pl-12 pr-4 py-3.5 rounded-xl focus:border-violet-500/50 focus:ring-2 focus:ring-violet-500/20 transition-all outline-none ${
                    isLight
                      ? "bg-white border border-slate-200 focus:bg-white text-slate-900 placeholder-slate-400"
                      : "bg-white/[0.04] border border-white/[0.08] focus:bg-white/[0.06] text-white placeholder-white/25"
                  }`}
                  placeholder="you@example.com"
                />
              </div>
            </div>

            <motion.button
              type="submit"
              disabled={loading}
              whileHover={{ scale: loading ? 1 : 1.02 }}
              whileTap={{ scale: loading ? 1 : 0.98 }}
              className="w-full py-4 bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white font-semibold rounded-xl shadow-lg shadow-violet-500/20 hover:shadow-violet-500/30 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed relative overflow-hidden group"
            >
              <span className="relative z-10 flex items-center justify-center gap-2">
                {loading ? (
                  <>
                    <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Sending code...
                  </>
                ) : (
                  <>
                    Send verification code
                    <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </>
                )}
              </span>
              <div className="absolute inset-0 bg-gradient-to-r from-fuchsia-600 to-purple-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </motion.button>

            <div className="flex items-center justify-center gap-2 pt-1">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-400/15">
                    <span className="text-emerald-400 text-xs font-semibold">Courses from ₹99</span>
                    <span className={`${isLight ? "text-slate-400" : "text-white/30"} text-[10px]`}>| Packs from ₹199</span>
              </span>
            </div>
          </motion.form>
        )}

        {step === 2 && (
          <motion.form
            key="student-step2"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            onSubmit={handleVerifyOtp}
            className="space-y-6"
          >
            <div className="flex justify-center gap-2 -mt-2">
              <div className="h-1.5 w-8 rounded-full bg-violet-500 transition-all duration-300" />
              <div className="h-1.5 w-8 rounded-full bg-violet-500 transition-all duration-300" />
            </div>

            <div>
              <p className={`text-sm mb-4 ${isLight ? "text-slate-600" : "text-white/50"}`}>
                Enter the 6-digit code sent to{" "}
                <span className={`font-semibold ${isLight ? "text-slate-900" : "text-white/90"}`}>{email}</span>
              </p>
              <div className="flex justify-center gap-2 sm:gap-3">
                {[0, 1, 2, 3, 4, 5].map((idx) => (
                  <input
                    key={idx}
                    ref={(el) => (otpInputRefs.current[idx] = el)}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={otp[idx]}
                    onChange={(e) => handleOtpChange(idx, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                    onPaste={handleOtpPaste}
                    className={`w-12 h-14 sm:w-14 sm:h-16 text-center text-xl font-bold rounded-xl focus:border-violet-500/50 focus:ring-2 focus:ring-violet-500/20 outline-none transition-all ${
                      isLight
                        ? "border border-slate-200 bg-white focus:bg-white text-slate-900"
                        : "border border-white/[0.08] bg-white/[0.04] focus:bg-white/[0.06] text-white"
                    }`}
                  />
                ))}
              </div>

              <div
                role="alert"
                aria-live="polite"
                className="mt-4 rounded-xl border-2 border-amber-400/90 bg-gradient-to-br from-amber-500/25 via-amber-600/15 to-amber-950/40 px-3.5 py-3.5 shadow-[0_0_24px_-4px_rgba(245,158,11,0.45)] ring-1 ring-amber-400/30"
              >
                <div className="flex items-start gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-amber-500 text-amber-950 shadow-md">
                    <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20" aria-hidden>
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                  </span>
                  <div className="min-w-0 pt-0.5">
                    <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-amber-200">Important-read this</p>
                    <p className="mt-1.5 text-sm font-semibold leading-snug text-amber-50">
                      Can&apos;t find the email? Check your{" "}
                      <span className="text-white underline decoration-2 decoration-amber-300/90 underline-offset-2">spam</span>,{" "}
                      <span className="text-white underline decoration-2 decoration-amber-300/90 underline-offset-2">junk</span>, or{" "}
                      <span className="text-white underline decoration-2 decoration-amber-300/90 underline-offset-2">Promotions</span>{" "}
                      folder before requesting a new code.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <motion.button
              type="submit"
              disabled={loading || otp.join("").length !== 6}
              whileHover={{ scale: loading ? 1 : 1.02 }}
              whileTap={{ scale: loading ? 1 : 0.98 }}
              className="w-full py-4 bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white font-semibold rounded-xl shadow-lg shadow-violet-500/20 hover:shadow-violet-500/30 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed relative overflow-hidden group"
            >
              <span className="relative z-10 flex items-center justify-center gap-2">
                {loading ? (
                  <>
                    <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Verifying...
                  </>
                ) : (
                  <>
                    Sign in
                    <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </>
                )}
              </span>
              <div className="absolute inset-0 bg-gradient-to-r from-fuchsia-600 to-purple-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </motion.button>

            <div className="text-center">
              <button
                type="button"
                onClick={handleRequestOtp}
                disabled={resendSeconds > 0 || loading}
                className={`text-sm font-medium transition-colors disabled:cursor-not-allowed ${isLight ? "text-violet-600 hover:text-violet-700 disabled:text-slate-400" : "text-violet-400 hover:text-violet-300 disabled:text-white/20"}`}
              >
                {resendSeconds > 0 ? `Resend code in ${resendSeconds}s` : "Resend code"}
              </button>
            </div>

            <button
              type="button"
              onClick={handleBackToEmail}
              className={`w-full text-sm transition-colors flex items-center justify-center gap-2 ${isLight ? "text-slate-500 hover:text-slate-700" : "text-white/40 hover:text-white/70"}`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Use a different email
            </button>
          </motion.form>
        )}
      </AnimatePresence>
    </AuthLoginLayout>
  );
}
