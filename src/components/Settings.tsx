import {
	Button,
	Card,
	CardBody,
	CardHeader,
	Chip,
	Select,
	SelectItem,
	Switch,
} from "@heroui/react";
import { useMutation, useQuery } from "convex/react";
import { Check, Shield } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";

export function Settings() {
	const categories = useQuery(api.memes.getCategories);
	const userPreferences = useQuery(api.memes.getUserPreferences);
	const updatePreferences = useMutation(api.memes.updateUserPreferences);
	const loggedInUser = useQuery(api.auth.loggedInUser);
	const isAdmin = useQuery(api.roles.checkIsAdmin);
	const initializeFirstAdmin = useMutation(api.roles.initializeFirstAdmin);

	const [favoriteCategories, setFavoriteCategories] = useState<
		Id<"categories">[]
	>([]);
	const [sortBy, setSortBy] = useState<"newest" | "popular">("newest");
	const [showOnlyFavorites, setShowOnlyFavorites] = useState(false);

	useEffect(() => {
		if (userPreferences) {
			setFavoriteCategories(userPreferences.favoriteCategories);
			setSortBy(userPreferences.feedSettings.sortBy);
			setShowOnlyFavorites(userPreferences.feedSettings.showOnlyFavorites);
		}
	}, [userPreferences]);

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
		<div className="mx-auto max-w-[600px] animate-fade-in px-4 py-6">
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

			{!isLoadingData && isAdmin === false && (
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
							color="warning"
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

			<div className="mt-6 rounded-2xl border border-gray-200 bg-gray-100 p-5 dark:border-gray-800 dark:bg-gray-900">
				<h3 className="mb-2 font-bold text-base text-gray-900 dark:text-gray-100">
					About Share my meme
				</h3>
				<p className="text-gray-600 text-sm leading-relaxed dark:text-gray-400">
					Discover and share the funniest memes with our community. Customize
					your experience and never miss the content you love.
				</p>
			</div>
		</div>
	);
}
