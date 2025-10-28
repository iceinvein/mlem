import { Button, Chip, Modal, ModalBody, ModalContent } from "@heroui/react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { useMutation, usePaginatedQuery, useQuery } from "convex/react";
import {
	Clock,
	Drama,
	Loader2,
	Plus,
	SlidersHorizontal,
	TrendingUp,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import { CreateMemeModal } from "./CreateMemeModal";
import { MemeCard } from "./MemeCard";
import { MemeCardSkeleton } from "./MemeCardSkeleton";
import { SignInPromptModal } from "./SignInPromptModal";

export function Feed() {
	const [sortBy, setSortBy] = useState<"newest" | "popular">("newest");
	const [selectedCategory, setSelectedCategory] =
		useState<Id<"categories"> | null>(null);
	const [showCreateModal, setShowCreateModal] = useState(false);
	const [showSortModal, setShowSortModal] = useState(false);
	const [showSignInPrompt, setShowSignInPrompt] = useState(false);
	const parentRef = useRef<HTMLDivElement>(null);

	const categories = useQuery(api.memes.getCategories);
	const userPreferences = useQuery(api.memes.getUserPreferences);
	const viewer = useQuery(api.auth.loggedInUser);
	const moderationStatus = useQuery(api.moderation.checkSuspensionStatus);
	const seedCategories = useMutation(api.memes.seedCategories);

	const { results, status, loadMore } = usePaginatedQuery(
		api.memes.getFeed,
		{
			categoryId: selectedCategory || undefined,
			sortBy,
		},
		{ initialNumItems: 10 },
	);

	useEffect(() => {
		if (categories && categories.length === 0) {
			seedCategories().catch(console.error);
		}
	}, [categories, seedCategories]);

	useEffect(() => {
		if (userPreferences?.feedSettings) {
			setSortBy(userPreferences.feedSettings.sortBy);
		}
	}, [userPreferences]);

	const filteredMemes = results?.filter((meme) => {
		if (!userPreferences?.feedSettings?.showOnlyFavorites) return true;
		return userPreferences.favoriteCategories.includes(meme.categoryId);
	});

	const isLoading = status === "LoadingFirstPage" || !categories;

	// Virtualization setup
	const rowVirtualizer = useVirtualizer({
		count: filteredMemes?.length || 0,
		getScrollElement: () => parentRef.current,
		estimateSize: () => 600, // Estimated height of a MemeCard
		overscan: 2,
		onChange: (instance) => {
			const virtualItems = instance.getVirtualItems();
			const [lastItem] = [...virtualItems].reverse();

			if (
				lastItem &&
				lastItem.index >= (filteredMemes?.length || 0) - 1 &&
				status === "CanLoadMore"
			) {
				loadMore(10);
			}
		},
	});

	return (
		<div className="mx-auto max-w-[600px]">
			{/* Sticky Header Controls */}
			<div className="sticky top-14 z-40 border-gray-200/50 border-b bg-gray-50/95 px-4 py-3 backdrop-blur-2xl dark:border-gray-800/50 dark:bg-gray-950/95">
				<div className="mb-3 flex items-center justify-between">
					<h2 className="font-black text-2xl text-gray-900 dark:text-white">
						Feed
					</h2>
					<div className="flex items-center gap-2">
						<Button
							isIconOnly
							onPress={() => setShowSortModal(true)}
							variant="flat"
							size="sm"
							radius="full"
							className="bg-gray-100 dark:bg-gray-900"
						>
							<SlidersHorizontal className="h-4 w-4" />
						</Button>
						<Button
							onPress={() => {
								if (!viewer) {
									setShowSignInPrompt(true);
									return;
								}
								// Check if user is muted or suspended
								if (
									moderationStatus?.isSuspended ||
									moderationStatus?.isMuted
								) {
									toast.error("Cannot Create Post", {
										description:
											moderationStatus.reason || "You cannot post at this time",
									});
									return;
								}
								setShowCreateModal(true);
							}}
							className="bg-gray-900 font-bold text-white dark:bg-gray-100 dark:text-gray-900"
							size="sm"
							radius="full"
							startContent={<Plus className="h-4 w-4" />}
						>
							Create
						</Button>
					</div>
				</div>

				{/* Category Pills */}
				<div className="scrollbar-hide -mx-4 flex gap-2 overflow-x-auto px-4 pb-1">
					<Chip
						onClick={() => setSelectedCategory(null)}
						className={`shrink-0 cursor-pointer transition-all ${
							!selectedCategory
								? "bg-black font-bold text-white dark:bg-white dark:text-black"
								: "bg-gray-100 text-gray-700 dark:bg-gray-900 dark:text-gray-300"
						}`}
						radius="full"
						size="sm"
					>
						All
					</Chip>
					{categories?.map((category) => (
						<Chip
							key={category._id}
							onClick={() => setSelectedCategory(category._id)}
							className={`shrink-0 cursor-pointer transition-all ${
								selectedCategory === category._id
									? "bg-gray-900 font-bold text-white dark:bg-gray-100 dark:text-gray-900"
									: "bg-gray-100 text-gray-700 dark:bg-gray-900 dark:text-gray-300"
							}`}
							radius="full"
							size="sm"
						>
							{category.name}
						</Chip>
					))}
				</div>
			</div>

			{/* Feed Content */}
			<div ref={parentRef} className="h-[calc(100vh-180px)] overflow-auto">
				{isLoading ? (
					// Show skeleton loaders while loading
					<div className="space-y-0">
						<MemeCardSkeleton />
						<MemeCardSkeleton />
						<MemeCardSkeleton />
					</div>
				) : filteredMemes && filteredMemes.length > 0 ? (
					<div
						style={{
							height: `${rowVirtualizer.getTotalSize()}px`,
							width: "100%",
							position: "relative",
						}}
					>
						{rowVirtualizer.getVirtualItems().map((virtualItem) => {
							const meme = filteredMemes[virtualItem.index];
							return (
								<div
									key={virtualItem.key}
									data-index={virtualItem.index}
									ref={rowVirtualizer.measureElement}
									style={{
										position: "absolute",
										top: 0,
										left: 0,
										width: "100%",
										transform: `translateY(${virtualItem.start}px)`,
									}}
								>
									<MemeCard meme={meme} />
								</div>
							);
						})}
						{/* Load more indicator */}
						{status === "CanLoadMore" && (
							<div
								style={{
									position: "absolute",
									top: `${rowVirtualizer.getTotalSize()}px`,
									width: "100%",
								}}
								className="py-8"
							>
								<div className="flex justify-center">
									<Loader2 className="h-6 w-6 animate-spin text-gray-400" />
								</div>
							</div>
						)}
					</div>
				) : (
					<div className="px-4 py-20 text-center">
						<div className="mb-4 flex justify-center">
							<Drama className="h-20 w-20 text-gray-400" strokeWidth={1.5} />
						</div>
						<p className="mb-2 font-bold text-gray-900 text-xl dark:text-gray-100">
							No memes found
						</p>
						<p className="text-gray-500 text-sm">
							Try adjusting your filters or create one!
						</p>
					</div>
				)}
			</div>

			<CreateMemeModal
				isOpen={showCreateModal}
				onClose={() => setShowCreateModal(false)}
			/>

			<SignInPromptModal
				isOpen={showSignInPrompt}
				onClose={() => setShowSignInPrompt(false)}
				action="create a meme"
			/>

			{/* Sort Modal */}
			<Modal
				isOpen={showSortModal}
				onClose={() => setShowSortModal(false)}
				placement="bottom"
				motionProps={{
					variants: {
						enter: {
							y: 0,
							transition: {
								duration: 0.3,
								ease: "easeOut",
							},
						},
						exit: {
							y: "100%",
							transition: {
								duration: 0.2,
								ease: "easeIn",
							},
						},
					},
				}}
				classNames={{
					wrapper: "items-end",
					base: "max-w-[600px] mx-auto !h-auto rounded-t-3xl mb-0 sm:mb-0",
					backdrop: "backdrop-blur-sm bg-black/50",
				}}
			>
				<ModalContent className="bg-gray-50 dark:bg-gray-950">
					<div className="flex flex-col items-center border-gray-200 border-b pt-2 pb-3 dark:border-gray-800">
						<div className="mb-3 h-1 w-10 rounded-full bg-gray-300 dark:bg-gray-700" />
						<h3 className="font-bold text-base text-gray-900 dark:text-gray-100">
							Sort By
						</h3>
					</div>
					<ModalBody className="p-4">
						<div className="space-y-2">
							<Button
								fullWidth
								size="lg"
								variant="flat"
								className={
									sortBy === "newest"
										? "bg-gray-900 font-bold text-white dark:bg-gray-100 dark:text-gray-900"
										: "bg-gray-100 dark:bg-gray-900"
								}
								onPress={() => {
									setSortBy("newest");
									setShowSortModal(false);
								}}
								startContent={<Clock className="h-5 w-5" />}
								radius="full"
							>
								Newest First
							</Button>
							<Button
								fullWidth
								size="lg"
								variant="flat"
								className={
									sortBy === "popular"
										? "bg-gray-900 font-bold text-white dark:bg-gray-100 dark:text-gray-900"
										: "bg-gray-100 dark:bg-gray-900"
								}
								onPress={() => {
									setSortBy("popular");
									setShowSortModal(false);
								}}
								startContent={<TrendingUp className="h-5 w-5" />}
								radius="full"
							>
								Most Popular
							</Button>
						</div>
					</ModalBody>
				</ModalContent>
			</Modal>
		</div>
	);
}
