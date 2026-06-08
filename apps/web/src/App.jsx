import { useEffect } from "react";
import { RouterProvider } from "react-router-dom";
import { router } from "./app/router";
import { AuthProvider } from "./app/providers/AuthProvider";
import { ThemeProvider } from "./app/providers/ThemeProvider";
import { DashboardPrefsProvider } from "./app/providers/DashboardPrefsProvider";
import { GamificationProvider } from "./app/providers/GamificationProvider";
import { InstallAppPrompt } from "./Components/InstallAppPrompt";

export default function App() {
  useEffect(() => {
    const loader = document.getElementById("global-loader");
    if (loader) {
      loader.style.opacity = "0";
      const t = setTimeout(() => loader.remove(), 250);
      return () => clearTimeout(t);
    }
  }, []);

  return (
    <AuthProvider>
      <ThemeProvider>
        <DashboardPrefsProvider>
          <GamificationProvider>
            <RouterProvider router={router} />
            {/* Install app prompt - below-medium devices only; dismissible with 7-day cooldown */}
            <InstallAppPrompt />
          </GamificationProvider>
        </DashboardPrefsProvider>
      </ThemeProvider>
    </AuthProvider>
  );
}
