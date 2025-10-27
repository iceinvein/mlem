import { useAuthActions } from "@convex-dev/auth/react";
import {
	Button,
	Card,
	CardBody,
	CardHeader,
	Chip,
	Input,
	Select,
	SelectItem,
	Switch,
} from "@heroui/react";
import { useMutation, useQuery } from "convex/react";
import { Check, Edit3, LogOut, Monitor, Moon, Shield, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";

export function Settings() {
	const categories = useQuery(api.memes.getCategories);
	const userPreferences = useQuery(api.memes.getUserPreferences);
	const updatePreferences = useMutation(api.memes.updateUserPreferences);
	const loggedInUser = useQuery(api.auth.loggedInUser);
	const currentUser = useQuery(api.users.getCurrentUser);
	const isAdmin = useQuery(api.roles.checkIsAdmin);
	const hasAnyAdmin = useQuery(api.roles.hasAnyAdmin);
	const initializeFirstAdmin = useMutation(api.roles.initializeFirstAdmin);
	const updateUsername = useMutation(api.users.updateUsername);
	const { signOut } = useAuthActions();
	const { theme, setTheme } = useTheme();

	const [favoriteCategories, setFavoriteCategories] = useState<
		Id<"categories">[]
	>([]);
	const [sortBy, setSortBy] = useState<"newest" | "popular">("newest");
	const [showOnlyFavorites, setShowOnlyFavorites] = useState(false);
	const [isEditingUsername, setIsEditingUsername] = useState(false);
	const [newUsername, setNewUsername] = useState("");
	const [mounted, setMounted] = useState(false);

	useEffect(() => {
		if (userPreferences) {
			setFavoriteCategories(userPreferences.favoriteCategories);
			setSortBy(userPreferences.feedSettings.sortBy);
			setShowOnlyFavorites(userPreferences.feedSettings.showOnlyFavorites);
		}
	}, [userPreferences]);

	useEffect(() => {
		setMounted(true);
	}, []);

	const handleSavePreferences = async () => {
		try {
			await updatePreferences({
				favoriteCategories,
				feedSettings: {
					sortBy,
					showOnlyFavorites,
				},
			});
			toast.success("Preferences saved!");
		} catch {
			toast.error("Failed to save preferences");
		}
	};

	const toggleCategory = (categoryId: Id<"categories">) => {
		setFavoriteCategories((prev) =>
			prev.includes(categoryId)
				? prev.filter((id) => id !== categoryId)
				: [...prev, categoryId],
		);
	};

	const handleInitializeAdmin = async () => {
		try {
			await initializeFirstAdmin();
			toast.success("You are now the first admin!");
		} catch (error: unknown) {
			const errorMessage =
				error instanceof Error ? error.message : "Failed to initialize admin";
			toast.error(errorMessage);
		}
	};

	const isLoadingData = !categories || !loggedInUser;

	return (
		<div className="mx-auto max-w-[600px] animate-fade-in px-4 pt-6 pb-24">
			<h2 className="mb-6 font-black text-3xl text-gray-900 dark:text-white">
				Settings
			</h2>

			{isLoadingData ? (
				<div className="mb-6 animate-pulse rounded-2xl border border-gray-200 bg-gray-50 p-5 dark:border-gray-800 dark:bg-gray-900">
					<div className="mb-3 h-6 w-24 rounded bg-gray-200 dark:bg-gray-800" />
					<div className="h-4 w-48 rounded bg-gray-200 dark:bg-gray-800" />
				</div>
			) : (
				<div className="mb-6 rounded-2xl border border-gray-200 bg-gray-50 p-5 dark:border-gray-800 dark:bg-gray-900">
					<h3 className="mb-3 font-bold text-base text-gray-900 dark:text-gray-100">
						Account
					</h3>

					{/* Username Section */}
					<div className="mb-3">
						{isEditingUsername ? (
							<div className="space-y-2">
								<Input
									value={newUsername}
									onValueChange={setNewUsername}
									placeholder="Enter new username"
									size="lg"
									classNames={{
										inputWrapper: "bg-white dark:bg-gray-950",
									}}
								/>
								<div className="flex gap-2">
									<Button
										size="sm"
										className="bg-gray-900 font-bold text-white dark:bg-white dark:text-gray-900"
										onPress={async () => {
											try {
												await updateUsername({ newUsername });
												toast.success("Username updated successfully!");
												setIsEditingUsername(false);
												setNewUsername("");
											} catch (error) {
												const errorMessage =
													error instanceof Error
														? error.message
														: "Failed to update username";
												toast.error(errorMessage);
											}
										}}
										isDisabled={!newUsername.trim()}
										radius="full"
									>
										Save
									</Button>
									<Button
										size="sm"
										variant="flat"
										onPress={() => {
											setIsEditingUsername(false);
											setNewUsername("");
										}}
										radius="full"
										className="bg-gray-100 dark:bg-gray-800"
									>
										Cancel
									</Button>
								</div>
							</div>
						) : (
							<div className="flex items-center justify-between">
								<div>
									<p className="font-semibold text-gray-900 text-sm dark:text-gray-100">
										{currentUser?.name || "Anonymous"}
									</p>
									{currentUser?.canChangeUsername && (
										<p className="text-gray-500 text-xs">
											You can change your username once
										</p>
									)}
								</div>
								{currentUser?.canChangeUsername && (
									<Button
										isIconOnly
										size="sm"
										variant="flat"
										onPress={() => setIsEditingUsername(true)}
										className="bg-gray-100 dark:bg-gray-800"
									>
										<Edit3 className="h-4 w-4" />
									</Button>
								)}
							</div>
						)}
					</div>

					<p className="text-gray-600 text-sm dark:text-gray-400">
						{loggedInUser.email}
					</p>
					{isAdmin && (
						<Chip
							className="mt-2 bg-gray-900 font-bold text-white dark:bg-gray-100 dark:text-gray-900"
							size="sm"
							radius="full"
						>
							Administrator
						</Chip>
					)}
				</div>
			)}

			{!isLoadingData && isAdmin === false && hasAnyAdmin === false && (
				<Card className="mb-6 border-warning bg-warning-50 dark:bg-warning-50/10">
					<CardHeader>
						<h3 className="font-semibold text-warning-700 dark:text-warning-500">
							First Time Setup
						</h3>
					</CardHeader>
					<CardBody className="gap-3">
						<p className="text-sm text-warning-700 dark:text-warning-400">
							No admin exists yet. Click below to become the first
							administrator.
						</p>
						<Button
							className="bg-gray-900 font-bold text-white dark:bg-gray-100 dark:text-gray-900"
							onPress={handleInitializeAdmin}
							startContent={<Shield className="h-4 w-4" />}
							size="lg"
							radius="full"
						>
							Become Admin
						</Button>
					</CardBody>
				</Card>
			)}

			{isLoadingData ? (
				<>
					<div className="mb-6 animate-pulse rounded-2xl border border-gray-200 bg-gray-50 p-5 dark:border-gray-800 dark:bg-gray-900">
						<div className="mb-4 h-6 w-40 rounded bg-gray-200 dark:bg-gray-800" />
						<div className="mb-4 h-10 w-full rounded-lg bg-gray-200 dark:bg-gray-800" />
						<div className="h-16 w-full rounded-xl bg-gray-200 dark:bg-gray-800" />
					</div>

					<div className="mb-6 animate-pulse rounded-2xl border border-gray-200 bg-gray-50 p-5 dark:border-gray-800 dark:bg-gray-900">
						<div className="mb-4 h-6 w-36 rounded bg-gray-200 dark:bg-gray-800" />
						<div className="space-y-2">
							<div className="h-14 w-full rounded-xl bg-gray-200 dark:bg-gray-800" />
							<div className="h-14 w-full rounded-xl bg-gray-200 dark:bg-gray-800" />
							<div className="h-14 w-full rounded-xl bg-gray-200 dark:bg-gray-800" />
						</div>
					</div>

					<div className="h-12 w-full animate-pulse rounded-full bg-gray-200 dark:bg-gray-800" />
				</>
			) : (
				<>
					<div className="mb-6 rounded-2xl border border-gray-200 bg-gray-50 p-5 dark:border-gray-800 dark:bg-gray-900">
						<h3 className="mb-4 font-bold text-base text-gray-900 dark:text-gray-100">
							Feed Preferences
						</h3>

						<Select
							label="Default Sort Order"
							selectionMode="single"
							selectedKeys={new Set([sortBy])}
							onSelectionChange={(keys) => {
								const selected = Array.from(keys)[0] as "newest" | "popular";
								if (selected) setSortBy(selected);
							}}
							size="lg"
							className="mb-4"
						>
							<SelectItem key="newest" textValue="Newest First">
								Newest First
							</SelectItem>
							<SelectItem key="popular" textValue="Most Popular">
								Most Popular
							</SelectItem>
						</Select>

						<div className="flex items-center justify-between rounded-xl border border-gray-200 bg-gray-50 p-4 dark:border-gray-800 dark:bg-gray-950">
							<div>
								<p className="font-semibold text-gray-900 text-sm dark:text-gray-100">
									Show Only Favorites
								</p>
								<p className="text-gray-500 text-xs">
									Only show memes from your favorite categories
								</p>
							</div>
							<Switch
								isSelected={showOnlyFavorites}
								onValueChange={setShowOnlyFavorites}
							/>
						</div>
					</div>

					<div className="mb-6 rounded-2xl border border-gray-200 bg-gray-50 p-5 dark:border-gray-800 dark:bg-gray-900">
						<h3 className="mb-2 font-bold text-base text-gray-900 dark:text-gray-100">
							Favorite Categories
						</h3>
						<p className="mb-4 text-gray-500 text-sm">
							Select your favorite categories to personalize your feed
						</p>

						<div className="space-y-2">
							{categories.map((category) => {
								const isFavorite = favoriteCategories.includes(category._id);
								return (
									<button
										key={category._id}
										type="button"
										onClick={() => toggleCategory(category._id)}
										className={`flex w-full items-center justify-between rounded-xl p-4 transition-all ${
											isFavorite
												? "bg-gray-900 dark:bg-gray-100"
												: "border border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-gray-900"
										}`}
									>
										<div
											className={`font-semibold ${isFavorite ? "text-white dark:text-gray-900" : "text-gray-900 dark:text-gray-100"}`}
										>
											{category.name}
										</div>
										<div
											className={`flex h-6 w-6 items-center justify-center rounded-full border-2 transition-all ${
												isFavorite
													? "border-gray-50 bg-gray-50 dark:border-gray-900 dark:bg-gray-900"
													: "border-gray-300 dark:border-gray-700"
											}`}
										>
											{isFavorite && (
												<Check className="h-4 w-4 text-gray-900 dark:text-gray-100" />
											)}
										</div>
									</button>
								);
							})}
						</div>
					</div>

					<Button
						className="w-full bg-gray-900 font-bold text-white dark:bg-gray-100 dark:text-gray-900"
						onPress={handleSavePreferences}
						size="lg"
						radius="full"
					>
						Save Preferences
					</Button>
				</>
			)}

			<div className="my-6 rounded-2xl border border-gray-200 bg-gray-50 p-5 dark:border-gray-800 dark:bg-gray-900">
				<h3 className="mb-4 font-bold text-base text-gray-900 dark:text-gray-100">
					Appearance
				</h3>

				<div className="space-y-2">
					<p className="font-semibold text-gray-900 text-sm dark:text-gray-100">
						Theme
					</p>
					<div className="grid grid-cols-3 gap-2">
						<button
							type="button"
							onClick={() => setTheme("light")}
							disabled={!mounted}
							className={`flex flex-col items-center gap-2 rounded-xl border-2 p-4 transition-all ${
								mounted && theme === "light"
									? "border-gray-900 bg-gray-900 dark:border-gray-100 dark:bg-gray-100"
									: "border-gray-200 bg-gray-50 hover:border-gray-300 dark:border-gray-800 dark:bg-gray-950 dark:hover:border-gray-700"
							}`}
						>
							<Sun
								className={`h-5 w-5 ${
									mounted && theme === "light"
										? "text-white dark:text-gray-900"
										: "text-gray-600 dark:text-gray-400"
								}`}
							/>
							<span
								className={`font-semibold text-xs ${
									mounted && theme === "light"
										? "text-white dark:text-gray-900"
										: "text-gray-600 dark:text-gray-400"
								}`}
							>
								Light
							</span>
						</button>

						<button
							type="button"
							onClick={() => setTheme("dark")}
							disabled={!mounted}
							className={`flex flex-col items-center gap-2 rounded-xl border-2 p-4 transition-all ${
								mounted && theme === "dark"
									? "border-gray-900 bg-gray-900 dark:border-gray-100 dark:bg-gray-100"
									: "border-gray-200 bg-gray-50 hover:border-gray-300 dark:border-gray-800 dark:bg-gray-950 dark:hover:border-gray-700"
							}`}
						>
							<Moon
								className={`h-5 w-5 ${
									mounted && theme === "dark"
										? "text-white dark:text-gray-900"
										: "text-gray-600 dark:text-gray-400"
								}`}
							/>
							<span
								className={`font-semibold text-xs ${
									mounted && theme === "dark"
										? "text-white dark:text-gray-900"
										: "text-gray-600 dark:text-gray-400"
								}`}
							>
								Dark
							</span>
						</button>

						<button
							type="button"
							onClick={() => setTheme("system")}
							disabled={!mounted}
							className={`flex flex-col items-center gap-2 rounded-xl border-2 p-4 transition-all ${
								mounted && theme === "system"
									? "border-gray-900 bg-gray-900 dark:border-gray-100 dark:bg-gray-100"
									: "border-gray-200 bg-gray-50 hover:border-gray-300 dark:border-gray-800 dark:bg-gray-950 dark:hover:border-gray-700"
							}`}
						>
							<Monitor
								className={`h-5 w-5 ${
									mounted && theme === "system"
										? "text-white dark:text-gray-900"
										: "text-gray-600 dark:text-gray-400"
								}`}
							/>
							<span
								className={`font-semibold text-xs ${
									mounted && theme === "system"
										? "text-white dark:text-gray-900"
										: "text-gray-600 dark:text-gray-400"
								}`}
							>
								System
							</span>
						</button>
					</div>
				</div>
			</div>

			<Button
				className="mb-6 w-full border-gray-200 bg-gray-50 font-bold text-gray-900 dark:border-gray-800 dark:bg-gray-900 dark:text-white"
				onPress={() => void signOut()}
				startContent={<LogOut className="h-4 w-4" />}
				size="lg"
				radius="full"
				variant="bordered"
			>
				Sign Out
			</Button>

			<div className="rounded-2xl border border-gray-200 bg-gray-100 p-5 dark:border-gray-800 dark:bg-gray-900">
				<h3 className="mb-2 font-bold text-base text-gray-900 dark:text-gray-100">
					About MLEM
				</h3>
				<p className="text-gray-600 text-sm leading-relaxed dark:text-gray-400">
					Discover and share the funniest memes with our community. Customize
					your experience and never miss the content you love.
				</p>
			</div>
		</div>
	);
}
