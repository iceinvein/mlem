/**
 * Service Worker utilities for checking registration status
 */

export async function isServiceWorkerReady(): Promise<boolean> {
	if (!("serviceWorker" in navigator)) {
		return false;
	}

	try {
		const registration = await navigator.serviceWorker.ready;
		return registration.active !== null;
	} catch {
		return false;
	}
}

export async function waitForServiceWorker(timeoutMs = 5000): Promise<boolean> {
	if (!("serviceWorker" in navigator)) {
		console.warn("[ServiceWorker] Not supported in this browser");
		return false;
	}

	const startTime = Date.now();

	while (Date.now() - startTime < timeoutMs) {
		const ready = await isServiceWorkerReady();
		if (ready) {
			console.log("[ServiceWorker] Ready!");
			return true;
		}
		// Wait 100ms before checking again
		await new Promise((resolve) => setTimeout(resolve, 100));
	}

	console.warn("[ServiceWorker] Timeout waiting for service worker");
	return false;
}

export function getServiceWorkerStatus(): {
	supported: boolean;
	registered: boolean;
	active: boolean;
} {
	if (!("serviceWorker" in navigator)) {
		return { supported: false, registered: false, active: false };
	}

	const controller = navigator.serviceWorker.controller;

	return {
		supported: true,
		registered: controller !== null,
		active: controller?.state === "activated",
	};
}
