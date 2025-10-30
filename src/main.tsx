import { ConvexAuthProvider } from "@convex-dev/auth/react";
import { ConvexReactClient } from "convex/react";
import { createRoot } from "react-dom/client";
import App from "./App";
import { ThemeProvider } from "./providers/ThemeProvider";
import "./style.css";

const convex = new ConvexReactClient(import.meta.env.VITE_CONVEX_URL as string);

// Register service worker for Convex storage CORS proxy
if ("serviceWorker" in navigator) {
	window.addEventListener("load", () => {
		navigator.serviceWorker
			.register("/sw.js")
			.then((registration) => {
				console.log("[App] Service Worker registered:", registration.scope);

				// Check for updates
				registration.addEventListener("updatefound", () => {
					const newWorker = registration.installing;
					if (newWorker) {
						newWorker.addEventListener("statechange", () => {
							if (
								newWorker.state === "installed" &&
								navigator.serviceWorker.controller
							) {
								console.log(
									"[App] New Service Worker available, will activate on next page load",
								);
							}
						});
					}
				});
			})
			.catch((error) => {
				console.error("[App] Service Worker registration failed:", error);
			});
	});
}

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
