import { Button } from "@heroui/react";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

export function ThemeToggle() {
  const [mounted, setMounted] = useState(false);
  const { theme, setTheme } = useTheme();

  // useEffect only runs on the client, so now we can safely show the UI
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <Button
        isIconOnly
        variant="light"
        size="sm"
        radius="full"
        className="w-9 h-9"
      >
        <div className="w-5 h-5" />
      </Button>
    );
  }

  return (
    <Button
      isIconOnly
      variant="light"
      size="sm"
      radius="full"
      onPress={() => setTheme(theme === "dark" ? "light" : "dark")}
      className="w-9 h-9"
    >
      {theme === "dark" ? (
        <Sun className="w-5 h-5" />
      ) : (
        <Moon className="w-5 h-5" />
      )}
    </Button>
  );
}
