import { Authenticated, Unauthenticated, useQuery } from "convex/react";
import { AnimatePresence, motion } from "framer-motion";
import { Drama } from "lucide-react";
import { useEffect, useState } from "react";
import { Toaster } from "sonner";
import { api } from "../convex/_generated/api";
import { AdminDashboard } from "./components/AdminDashboard";
import { BottomNav } from "./components/BottomNav";
import { CategoryManagement } from "./components/CategoryManagement";
import { Feed } from "./components/Feed";
import { ModerationDashboard } from "./components/ModerationDashboard";
import { Settings } from "./components/Settings";
import { ThemeToggle } from "./components/ThemeToggle";
import { SignInForm } from "./SignInForm";
import { SignOutButton } from "./SignOutButton";

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
				<div className="mx-auto flex h-14 max-w-[600px] items-center justify-between px-4">
					<motion.h2
						initial={{ opacity: 0, x: -20 }}
						animate={showNav ? { opacity: 1, x: 0 } : { opacity: 0, x: -20 }}
						transition={{ delay: 0.4, duration: 0.5 }}
						className="font-black text-gray-900 text-xl dark:text-white"
					>
						Share my meme
					</motion.h2>
					<motion.div
						initial={{ opacity: 0, x: 20 }}
						animate={showNav ? { opacity: 1, x: 0 } : { opacity: 0, x: 20 }}
						transition={{ delay: 0.5, duration: 0.5 }}
						className="flex items-center gap-2"
					>
						<ThemeToggle />
						<Authenticated>
							<SignOutButton />
						</Authenticated>
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
			<AnimatePresence>
				<motion.div
					initial={{ opacity: 0 }}
					animate={{ opacity: 1 }}
					exit={{ opacity: 0, scale: 0.95 }}
					transition={{ duration: 0.5 }}
					className="flex min-h-[70vh] flex-col items-center justify-center px-4"
				>
					{/* Animated Icon */}
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
							<Drama className="h-16 w-16 text-white" strokeWidth={2} />
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
							className="bg-[length:200%_auto] bg-gradient-to-r from-purple-600 via-pink-600 to-orange-600 bg-clip-text font-black text-3xl text-transparent"
						>
							Share my meme
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
			</AnimatePresence>
		);
	}

	return (
		<>
			<Unauthenticated>
				<div className="flex min-h-[calc(100vh-14rem)] animate-fade-in flex-col items-center justify-center px-4">
					<div className="mb-8 space-y-4 text-center">
						<div className="mb-4 flex animate-bounce-slow justify-center">
							<Drama
								className="h-20 w-20 text-gray-900 dark:text-white"
								strokeWidth={1.5}
							/>
						</div>
						<h1 className="font-black text-5xl text-gray-900 dark:text-white">
							Share my meme
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
				<div className="relative">
					{activeTab === "feed" && <Feed />}
					{activeTab === "moderation" && <ModerationDashboard />}
					{activeTab === "categories" && <CategoryManagement />}
					{activeTab === "admin" && <AdminDashboard />}
					{activeTab === "settings" && <Settings />}

					<BottomNav activeTab={activeTab} onTabChange={setActiveTab} />
				</div>
			</Authenticated>
		</>
	);
}
