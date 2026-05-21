import { AnimatePresence, motion } from "framer-motion";
import { FiWifi, FiWifiOff } from "react-icons/fi";
import { useOnlineStatus } from "../../hooks/useOnlineStatus";

/**
 * Global student LMS banner when the device loses network connectivity.
 * Additive only — does not block navigation or existing page behavior.
 */
export default function StudentOfflineBanner() {
  const { isOnline, showReconnected } = useOnlineStatus();

  const visible = !isOnline || showReconnected;
  if (!visible) return null;

  const reconnected = isOnline && showReconnected;

  return (
    <AnimatePresence>
      <motion.div
        key={reconnected ? "online" : "offline"}
        role="status"
        aria-live="polite"
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -12 }}
        transition={{ duration: 0.2 }}
        className={`fixed top-0 left-0 right-0 z-[100] px-4 py-2.5 text-sm shadow-lg safe-area-pt ${
          reconnected
            ? "bg-emerald-600/95 text-white backdrop-blur-md"
            : "bg-amber-600/95 text-white backdrop-blur-md"
        }`}
      >
        <div className="mx-auto flex max-w-4xl items-center justify-center gap-2 text-center">
          {reconnected ? (
            <>
              <FiWifi className="h-4 w-4 shrink-0" aria-hidden />
              <span>
                <span className="font-semibold">You&apos;re back online.</span>
                {" "}
                Your progress will sync as you continue.
              </span>
            </>
          ) : (
            <>
              <FiWifiOff className="h-4 w-4 shrink-0" aria-hidden />
              <span>
                <span className="font-semibold">You&apos;re offline.</span>
                {" "}
                You can keep browsing, but new data won&apos;t load until your connection returns.
              </span>
            </>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
