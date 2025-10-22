import { ConvexAuthProvider } from "@convex-dev/auth/react";
import { ConvexReactClient } from "convex/react";
import { createRoot } from "react-dom/client";
import App from "./App";
import { ThemeProvider } from "./providers/ThemeProvider";
import "./style.css";

const convex = new ConvexReactClient(import.meta.env.VITE_CONVEX_URL as string);

const rootElement = document.getElementById("root");
if (rootElement) {
	createRoot(rootElement).render(
		<ConvexAuthProvider client={convex}>
			<ThemeProvider>
				<App />
			</ThemeProvider>
		</ConvexAuthProvider>,
	);
}
