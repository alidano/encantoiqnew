
"use client";

import * as React from "react";
import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";

type Theme = "light" | "dark";

export function ThemeToggle() {
  // effectiveTheme will be undefined on SSR and populated on client mount
  const [effectiveTheme, setEffectiveTheme] = React.useState<Theme | undefined>(undefined);

  React.useEffect(() => {
    // This effect runs only on the client, after the component has mounted.
    let currentTheme: Theme;
    const storedTheme = localStorage.getItem("theme") as Theme | null;

    if (storedTheme === "light" || storedTheme === "dark") {
      currentTheme = storedTheme;
    } else {
      // No valid theme in localStorage, use system preference for the initial theme.
      currentTheme = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
      // Save this initial determination to localStorage.
      localStorage.setItem("theme", currentTheme);
    }
    
    // Set the React state to reflect the determined theme.
    setEffectiveTheme(currentTheme);

    // Apply the class to the document element.
    if (currentTheme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, []); // Empty dependency array ensures this runs once on mount.

  const toggleTheme = () => {
    setEffectiveTheme(prevTheme => {
      // Determine the new theme based on the previous.
      // Fallback to checking system preference if prevTheme is somehow undefined (should not happen in this flow after mount).
      const newTheme = prevTheme === "dark" ? "light" : "dark";
      
      // Apply the new theme class to the document.
      if (newTheme === "dark") {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }
      // Save the new theme to localStorage.
      localStorage.setItem("theme", newTheme);
      
      return newTheme; // Update the React state.
    });
  };

  // Render a placeholder or disabled button until the theme is determined on the client.
  // This helps prevent hydration mismatches for the button's appearance/icon.
  if (effectiveTheme === undefined) {
    return (
      <Button variant="ghost" size="icon" aria-label="Loading theme..." disabled>
        {/* You can use a generic icon or a spinner here if you prefer */}
        <Sun className="h-[1.2rem] w-[1.2rem]" /> 
        <span className="sr-only">Loading theme...</span>
      </Button>
    );
  }

  // Once the theme is determined, render the interactive button.
  // The Sun/Moon icons use CSS (dark: variants) to toggle visibility based on the .dark class on <html>.
  return (
    <Button variant="ghost" size="icon" onClick={toggleTheme} aria-label="Toggle theme">
      <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
      <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
      <span className="sr-only">Toggle theme</span>
    </Button>
  );
}
