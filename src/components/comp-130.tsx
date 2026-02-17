"use client"

import { MoonIcon, SunIcon } from "lucide-react"
import { useTheme } from "next-themes"

import { Toggle } from "@/components/ui/toggle"

export default function ModeToggle() {
  const { resolvedTheme, setTheme } = useTheme()

  return (
    <div>
      <Toggle
        variant="outline"
        className="group data-[state=on]:hover:bg-muted size-9 data-[state=on]:bg-transparent"
        // pressed={resolvedTheme === "dark"}
        onPressedChange={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
        // aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
      >
        <MoonIcon
          size={16}
          className="absolute shrink-0 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100"
          aria-hidden="true"
        />
        <SunIcon
          size={16}
          className="shrink-0 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0"
          aria-hidden="true"
        />
      </Toggle>
    </div>
  )
}
