import { FFmpeg } from "@ffmpeg/ffmpeg";
import { fetchFile, toBlobURL } from "@ffmpeg/util";

let ffmpegInstance: FFmpeg | null = null;
let isLoading = false;
let loadPromise: Promise<FFmpeg> | null = null;

// CDN URLs for FFmpeg WASM files
const FFMPEG_CDN_URLS = [
	"https://unpkg.com/@ffmpeg/core@0.12.6/dist/esm",
	"https://cdn.jsdelivr.net/npm/@ffmpeg/core@0.12.6/dist/esm",
];

// Track download progress
let downloadProgressCallback: ((progress: number) => void) | null = null;

export function setDownloadProgressCallback(
	callback: ((progress: number) => void) | null,
) {
	downloadProgressCallback = callback;
}

async function loadFFmpeg(): Promise<FFmpeg> {
	if (ffmpegInstance) return ffmpegInstance;
	if (loadPromise) return loadPromise;

	isLoading = true;
	loadPromise = (async () => {
		const ffmpeg = new FFmpeg();

		// Try loading from multiple CDNs for reliability
		let lastError: Error | null = null;

		for (const baseURL of FFMPEG_CDN_URLS) {
			try {
				// Download core JS (smaller, ~1MB)
				if (downloadProgressCallback) downloadProgressCallback(10);
				const coreURL = await toBlobURL(
					`${baseURL}/ffmpeg-core.js`,
					"text/javascript",
				);

				// Download WASM (larger, ~31MB)
				if (downloadProgressCallback) downloadProgressCallback(30);
				const wasmURL = await toBlobURL(
					`${baseURL}/ffmpeg-core.wasm`,
					"application/wasm",
				);

				if (downloadProgressCallback) downloadProgressCallback(80);

				// Load FFmpeg
				await ffmpeg.load({
					coreURL,
					wasmURL,
				});

				if (downloadProgressCallback) downloadProgressCallback(100);

				ffmpegInstance = ffmpeg;
				isLoading = false;
				downloadProgressCallback = null;
				return ffmpeg;
			} catch (error) {
				console.warn(`Failed to load FFmpeg from ${baseURL}:`, error);
				lastError = error as Error;
				// Continue to next CDN
			}
		}

		// If all CDNs failed
		isLoading = false;
		downloadProgressCallback = null;
		throw new Error(
			`Failed to load FFmpeg from all CDNs. Last error: ${lastError?.message}`,
		);
	})();

	return loadPromise;
}

/**
 * Preload FFmpeg WASM files in the background.
 * Call this when the app loads to avoid delay on first video upload.
 */
export async function preloadFFmpeg(): Promise<void> {
	try {
		// Check if SharedArrayBuffer is available
		if (typeof SharedArrayBuffer === "undefined") {
			console.warn(
				"SharedArrayBuffer not available. Video optimization may not work.",
			);
			console.warn(
				"This is normal in development. In production, configure COOP/COEP headers.",
			);
			return;
		}

		await loadFFmpeg();
	} catch (error) {
		console.error("Failed to preload FFmpeg:", error);
		// Don't throw - this is just a preload optimization
	}
}

/**
 * Check if FFmpeg is already loaded
 */
export function isFFmpegLoaded(): boolean {
	return ffmpegInstance !== null;
}

/**
 * Check if FFmpeg is currently loading
 */
export function isFFmpegLoading(): boolean {
	return isLoading;
}

export interface VideoOptimizationOptions {
	maxWidth?: number;
	maxHeight?: number;
	targetBitrate?: string;
	maxFileSizeMB?: number;
	maxFps?: number;
	onProgress?: (progress: number) => void;
}

const DEFAULT_OPTIONS: Required<VideoOptimizationOptions> = {
	maxWidth: 1280,
	maxHeight: 720,
	targetBitrate: "1M",
	maxFileSizeMB: 10,
	maxFps: 30, // Limit to 30fps for smaller file size and faster processing
	onProgress: () => {},
};

export async function optimizeVideo(
	file: File,
	options: VideoOptimizationOptions = {},
): Promise<File> {
	const opts = { ...DEFAULT_OPTIONS, ...options };

	// Check if SharedArrayBuffer is available
	if (typeof SharedArrayBuffer === "undefined") {
		throw new Error(
			"Video optimization requires SharedArrayBuffer support. " +
				"Please use a modern browser (Chrome 92+, Edge 92+, Firefox 89+, Safari 15.2+).",
		);
	}

	// Wait for service worker to be ready (needed for CORS proxy)
	if ("serviceWorker" in navigator) {
		try {
			const registration = await navigator.serviceWorker.ready;
			if (!registration.active) {
				console.warn(
					"[VideoOptimizer] Service worker not active, CORS issues may occur",
				);
			}
		} catch (error) {
			console.warn("[VideoOptimizer] Service worker check failed:", error);
		}
	}

	try {
		const ffmpeg = await loadFFmpeg();

		// Reset progress callback after loading
		setDownloadProgressCallback(null);

		// Write input file
		await ffmpeg.writeFile("input.mp4", await fetchFile(file));

		// Build ffmpeg command with performance optimizations
		const args = [
			"-i",
			"input.mp4",
			"-vf",
			// Scale, limit fps, and ensure dimensions are divisible by 2
			`fps=${opts.maxFps},scale='min(${opts.maxWidth},iw)':'min(${opts.maxHeight},ih)':force_original_aspect_ratio=decrease,scale=trunc(iw/2)*2:trunc(ih/2)*2`,
			"-c:v",
			"libx264",
			// Use 'veryfast' preset for 3-5x faster encoding (slight quality trade-off)
			"-preset",
			"veryfast",
			// Use CRF (Constant Rate Factor) for better quality/size balance
			"-crf",
			"28", // 23 is default, 28 is slightly lower quality but much smaller
			"-b:v",
			opts.targetBitrate,
			"-maxrate",
			opts.targetBitrate,
			"-bufsize",
			"2M",
			// Optimize encoding settings for speed
			"-tune",
			"fastdecode", // Optimize for fast decoding
			"-profile:v",
			"baseline", // Better compatibility and faster encoding
			"-level",
			"3.0",
			// Audio optimization
			"-c:a",
			"aac",
			"-b:a",
			"96k", // Reduced from 128k, still good quality
			"-ac",
			"2", // Stereo
			"-ar",
			"44100", // Standard sample rate
			// Output optimization
			"-movflags",
			"+faststart",
			"-y",
			"output.mp4",
		];

		// Set up progress monitoring
		ffmpeg.on("progress", ({ progress }) => {
			const percent = Math.round(progress * 100);
			console.log(`[VideoOptimizer] Progress: ${percent}%`);
			opts.onProgress(percent);
		});

		await ffmpeg.exec(args);

		// Read output file
		const data = await ffmpeg.readFile("output.mp4");
		const blob = new Blob([data], { type: "video/mp4" });

		// Check if file size is acceptable
		const fileSizeMB = blob.size / 1024 / 1024;
		if (fileSizeMB > opts.maxFileSizeMB) {
			// Try again with lower bitrate
			const lowerBitrate = Math.max(
				500,
				Number.parseInt(opts.targetBitrate, 10) * 0.7,
			);
			return optimizeVideo(file, {
				...options,
				targetBitrate: `${lowerBitrate}k`,
			});
		}

		// Clean up
		await ffmpeg.deleteFile("input.mp4");
		await ffmpeg.deleteFile("output.mp4");

		return new File([blob], file.name.replace(/\.\w+$/, ".mp4"), {
			type: "video/mp4",
			lastModified: Date.now(),
		});
	} catch (error) {
		console.error("[VideoOptimizer] Optimization failed:", error);
		throw new Error(
			`Failed to optimize video: ${error instanceof Error ? error.message : "Unknown error"}`,
		);
	}
}

function getVideoDuration(file: File): Promise<number> {
	return new Promise((resolve, reject) => {
		const video = document.createElement("video");
		video.preload = "metadata";

		video.onloadedmetadata = () => {
			window.URL.revokeObjectURL(video.src);
			resolve(video.duration);
		};

		video.onerror = () => {
			reject(new Error("Failed to load video metadata"));
		};

		video.src = URL.createObjectURL(file);
	});
}

export async function validateVideo(
	file: File,
): Promise<{ valid: boolean; error?: string; duration?: number }> {
	try {
		const duration = await getVideoDuration(file);

		if (duration < 1) {
			return { valid: false, error: "Video too short (minimum 1 second)" };
		}

		// Check initial file size
		const fileSizeMB = file.size / 1024 / 1024;
		if (fileSizeMB > 100) {
			return {
				valid: false,
				error: "Video file too large (maximum 100MB before optimization)",
			};
		}

		return { valid: true, duration };
	} catch (_error) {
		return { valid: false, error: "Invalid video file" };
	}
}
