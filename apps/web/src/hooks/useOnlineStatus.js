import { useState, useEffect, useRef } from "react";

/**
 * Tracks browser connectivity via navigator.onLine and online/offline events.
 */
export function useOnlineStatus() {
  const getOnline = () =>
    typeof navigator === "undefined" ? true : navigator.onLine;

  const [isOnline, setIsOnline] = useState(getOnline);
  const [showReconnected, setShowReconnected] = useState(false);
  const wasOfflineRef = useRef(false);

  useEffect(() => {
    const onOnline = () => {
      setIsOnline(true);
      if (wasOfflineRef.current) {
        setShowReconnected(true);
        wasOfflineRef.current = false;
      }
    };
    const onOffline = () => {
      setIsOnline(false);
      wasOfflineRef.current = true;
      setShowReconnected(false);
    };

    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);
    return () => {
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
    };
  }, []);

  useEffect(() => {
    if (!showReconnected) return undefined;
    const timer = setTimeout(() => setShowReconnected(false), 3000);
    return () => clearTimeout(timer);
  }, [showReconnected]);

  return { isOnline, showReconnected };
}
