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
				className="h-9 w-9"
			>
				<div className="h-5 w-5" />
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
			className="h-9 w-9"
		>
			{theme === "dark" ? (
				<Sun className="h-5 w-5" />
			) : (
				<Moon className="h-5 w-5" />
			)}
		</Button>
	);
}
