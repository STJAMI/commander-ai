import { useState, useEffect } from "react";

/**
 * Custom React Hook that listens to the user's system preference (prefers-color-scheme)
 * and automatically suggests the 'cosmic' theme if the user is in dark mode, defaulting to 'slate' (Classic Slate) otherwise.
 */
export function useSystemThemeSuggestion(
  currentTheme: string,
  setTheme: (theme: string) => void
) {
  // 1. Detect initial system color scheme preference
  const [isSystemDark, setIsSystemDark] = useState<boolean>(() => {
    if (typeof window !== "undefined" && window.matchMedia) {
      return window.matchMedia("(prefers-color-scheme: dark)").matches;
    }
    return false;
  });

  // 2. Track whether the user has dismissed the notification for the current system state
  const [suggestionDismissed, setSuggestionDismissed] = useState<boolean>(() => {
    return localStorage.getItem("study_commander_theme_suggestion_dismissed") === "true";
  });

  // 3. Keep a preference listener alive
  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    
    const listener = (event: MediaQueryListEvent) => {
      setIsSystemDark(event.matches);
      // Reset dismissed state whenever system preference toggles
      setSuggestionDismissed(false);
      localStorage.setItem("study_commander_theme_suggestion_dismissed", "false");
    };

    // Support both newer and older environments
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener("change", listener);
    } else {
      mediaQuery.addListener(listener);
    }

    return () => {
      if (mediaQuery.removeEventListener) {
        mediaQuery.removeEventListener("change", listener);
      } else {
        mediaQuery.removeListener(listener);
      }
    };
  }, []);

  const suggestedTheme = isSystemDark ? "cosmic" : "slate";
  const suggestedThemeLabel = isSystemDark ? "Cosmic Dark" : "Classic Slate";

  // Check if current theme is different from system preference and hasn't been dismissed yet
  const showSuggestion = currentTheme !== suggestedTheme && !suggestionDismissed;

  const dismissSuggestion = () => {
    setSuggestionDismissed(true);
    localStorage.setItem("study_commander_theme_suggestion_dismissed", "true");
  };

  const applySuggestion = () => {
    setTheme(suggestedTheme);
    dismissSuggestion();
  };

  return {
    isSystemDark,
    suggestedTheme,
    suggestedThemeLabel,
    showSuggestion,
    dismissSuggestion,
    applySuggestion,
  };
}
