import { Authenticated, Unauthenticated, useQuery } from "convex/react";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { Toaster } from "sonner";
import { api } from "../convex/_generated/api";
import type { Id } from "../convex/_generated/dataModel";
import { AdminDashboard } from "./components/AdminDashboard";
import { BottomNav } from "./components/BottomNav";
import { CategoryManagement } from "./components/CategoryManagement";
import { Feed } from "./components/Feed";
import { ModerationDashboard } from "./components/ModerationDashboard";
import { Settings } from "./components/Settings";
import { SinglePost } from "./components/SinglePost";
import { SignInForm } from "./SignInForm";

export default function App() {
	const [showNav, setShowNav] = useState(false);

	useEffect(() => {
		// Delay nav animation slightly after splash
		const timer = setTimeout(() => {
			setShowNav(true);
		}, 100);
		return () => clearTimeout(timer);
	}, []);

	return (
		<div className="flex min-h-screen flex-col bg-gray-100 dark:bg-gray-950">
			<motion.header
				initial={{ y: -100, opacity: 0 }}
				animate={showNav ? { y: 0, opacity: 1 } : { y: -100, opacity: 0 }}
				transition={{
					type: "spring",
					stiffness: 100,
					damping: 20,
					delay: 0.2,
				}}
				className="fixed top-0 right-0 left-0 z-50 border-gray-200/50 border-b bg-gray-50/95 backdrop-blur-2xl dark:border-gray-800/50 dark:bg-gray-950/95"
			>
				<div className="mx-auto flex h-14 max-w-[600px] items-center justify-center px-4">
					<motion.div
						initial={{ opacity: 0, scale: 0.8 }}
						animate={
							showNav ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.8 }
						}
						transition={{
							delay: 0.4,
							duration: 0.5,
							type: "spring",
							stiffness: 200,
						}}
						className="flex items-center gap-3"
					>
						<img
							src="/logo.png"
							alt="MLEM"
							className="h-8 w-8 object-contain dark:hidden"
						/>
						<img
							src="/logo-negative.png"
							alt="MLEM"
							className="hidden h-8 w-8 object-contain dark:block"
						/>
						<h2 className="font-black text-gray-900 text-xl dark:text-white">
							MLEM
						</h2>
					</motion.div>
				</div>
			</motion.header>
			<main className="flex-1 pt-14 pb-16">
				<Content />
			</main>
			<Toaster position="top-center" richColors />
		</div>
	);
}

function Content() {
	const loggedInUser = useQuery(api.auth.loggedInUser);
	const isModerator = useQuery(api.roles.checkIsModerator);
	const isAdmin = useQuery(api.roles.checkIsAdmin);
	const [activeTab, setActiveTab] = useState<
		"feed" | "settings" | "moderation" | "categories" | "admin"
	>("feed");
	const [showSplash, setShowSplash] = useState(true);
	const [minLoadingComplete, setMinLoadingComplete] = useState(false);
	const [currentMemeId, setCurrentMemeId] = useState<string | null>(null);

	// Handle URL hash changes for routing
	useEffect(() => {
		const handleHashChange = () => {
			const hash = window.location.hash;
			if (hash.startsWith("#/post/")) {
				const memeId = hash.replace("#/post/", "");
				setCurrentMemeId(memeId);
			} else {
				setCurrentMemeId(null);
			}
		};

		handleHashChange();
		window.addEventListener("hashchange", handleHashChange);
		return () => window.removeEventListener("hashchange", handleHashChange);
	}, []);

	// Reset to feed if user loses moderation access
	if (activeTab === "moderation" && isModerator === false) {
		setActiveTab("feed");
	}

	// Reset to feed if user loses admin access
	if (
		(activeTab === "categories" || activeTab === "admin") &&
		isAdmin === false
	) {
		setActiveTab("feed");
	}

	// Minimum 2.5 second splash screen
	useEffect(() => {
		const timer = setTimeout(() => {
			setMinLoadingComplete(true);
		}, 2500);
		return () => clearTimeout(timer);
	}, []);

	// Hide splash when both conditions are met
	useEffect(() => {
		if (minLoadingComplete && loggedInUser !== undefined) {
			const timer = setTimeout(() => {
				setShowSplash(false);
			}, 300);
			return () => clearTimeout(timer);
		}
	}, [minLoadingComplete, loggedInUser]);

	if (showSplash) {
		return (
			<motion.div
				initial={{ opacity: 0 }}
				animate={{ opacity: 1 }}
				exit={{ opacity: 0, scale: 0.95 }}
				transition={{ duration: 0.5 }}
				className="flex min-h-[70vh] flex-col items-center justify-center px-4"
			>
				{/* Animated Logo */}
				<motion.div
					initial={{ scale: 0, rotate: -180 }}
					animate={{ scale: 1, rotate: 0 }}
					transition={{
						type: "spring",
						stiffness: 200,
						damping: 15,
						delay: 0.2,
					}}
					className="relative mb-8"
				>
					<motion.div
						animate={{
							y: [0, -10, 0],
						}}
						transition={{
							duration: 1.5,
							repeat: Number.POSITIVE_INFINITY,
							ease: "easeInOut",
						}}
						className="relative rounded-3xl bg-pink-500 p-6 shadow-2xl"
					>
						<img
							src="/logo.png"
							alt="MLEM"
							className="h-16 w-16 object-contain dark:hidden"
						/>
						<img
							src="/logo-negative.png"
							alt="MLEM"
							className="hidden h-16 w-16 object-contain dark:block"
						/>
					</motion.div>
				</motion.div>

				{/* Loading Text */}
				<motion.div
					initial={{ opacity: 0, y: 20 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ delay: 0.5, duration: 0.5 }}
					className="space-y-3 text-center"
				>
					<motion.h2
						animate={{
							backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"],
						}}
						transition={{
							duration: 3,
							repeat: Number.POSITIVE_INFINITY,
							ease: "linear",
						}}
						className="bg-linear-to-r bg-size-[200%_auto] from-purple-600 via-pink-600 to-orange-600 bg-clip-text font-black text-3xl text-transparent"
					>
						MLEM
					</motion.h2>
					<div className="flex items-center justify-center gap-2">
						{[0, 1, 2].map((i) => (
							<motion.div
								key={i}
								animate={{
									y: [0, -10, 0],
									scale: [1, 1.2, 1],
								}}
								transition={{
									duration: 0.6,
									repeat: Number.POSITIVE_INFINITY,
									delay: i * 0.15,
									ease: "easeInOut",
								}}
								className={`h-2 w-2 rounded-full ${
									i === 0
										? "bg-purple-500"
										: i === 1
											? "bg-pink-500"
											: "bg-orange-500"
								}`}
							/>
						))}
					</div>
				</motion.div>
			</motion.div>
		);
	}

	return (
		<>
			<Unauthenticated>
				<div className="flex min-h-[calc(100vh-14rem)] animate-fade-in flex-col items-center justify-center px-4">
					<div className="mb-8 space-y-4 text-center">
						<div className="mb-4 flex animate-bounce-slow justify-center">
							<img
								src="/logo.png"
								alt="MLEM"
								className="h-20 w-20 object-contain dark:hidden"
							/>
							<img
								src="/logo-negative.png"
								alt="MLEM"
								className="hidden h-20 w-20 object-contain dark:block"
							/>
						</div>
						<h1 className="font-black text-5xl text-gray-900 dark:text-white">
							MLEM
						</h1>
						<p className="max-w-md text-gray-600 text-lg dark:text-gray-400">
							Discover and share the funniest memes
						</p>
					</div>
					<div className="w-full max-w-md">
						<SignInForm />
					</div>
				</div>
			</Unauthenticated>

			<Authenticated>
				<div className="relative h-[calc(100vh-14rem)]">
					{currentMemeId ? (
						<SinglePost
							memeId={currentMemeId as Id<"memes">}
							onBack={() => {
								window.location.hash = "";
								setCurrentMemeId(null);
							}}
						/>
					) : (
						<>
							{activeTab === "feed" && <Feed />}
							{activeTab === "moderation" && <ModerationDashboard />}
							{activeTab === "categories" && <CategoryManagement />}
							{activeTab === "admin" && <AdminDashboard />}
							{activeTab === "settings" && <Settings />}

							<BottomNav activeTab={activeTab} onTabChange={setActiveTab} />
						</>
					)}
				</div>
			</Authenticated>
		</>
	);
}
