import { Button, Chip, Image } from "@heroui/react";
import { useMutation } from "convex/react";
import { Flag, Heart, ImageOff, MessageCircle, Share2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import { CommentModal } from "./CommentModal";
import { ReportModal } from "./ReportModal";

interface MemeCardProps {
	meme: {
		_id: Id<"memes">;
		title: string;
		imageUrl: string;
		likes: number;
		shares: number;
		comments?: number;
		userLiked: boolean;
		userShared: boolean;
		category: {
			name: string;
		} | null;
		tags: string[];
		_creationTime: number;
	};
}

export function MemeCard({ meme }: MemeCardProps) {
	const [showComments, setShowComments] = useState(false);
	const [showReportModal, setShowReportModal] = useState(false);
	const [imageError, setImageError] = useState(false);
	const toggleLike = useMutation(api.memes.toggleLike);
	const shareMeme = useMutation(api.memes.shareMeme);

	const handleLike = async () => {
		try {
			await toggleLike({ memeId: meme._id });
			toast.success(meme.userLiked ? "Unliked!" : "Liked!");
		} catch {
			toast.error("Failed to update like");
		}
	};

	const handleShare = async () => {
		try {
			await shareMeme({ memeId: meme._id });

			if (navigator.share) {
				await navigator.share({
					title: meme.title,
					text: `Check out this meme: ${meme.title}`,
					url: window.location.href,
				});
			} else {
				await navigator.clipboard.writeText(window.location.href);
				toast.success("Link copied to clipboard!");
			}
		} catch {
			toast.error("Failed to share");
		}
	};

	return (
		<>
			<article className="border-gray-200 border-b bg-gray-50 dark:border-gray-800 dark:bg-gray-950">
				{/* Header */}
				<div className="flex items-center justify-between px-4 py-3">
					<div className="flex items-center gap-3">
						{meme.category && (
							<Chip
								size="sm"
								className="bg-gray-100 font-semibold text-gray-900 dark:bg-gray-900 dark:text-gray-100"
								radius="full"
							>
								{meme.category.name}
							</Chip>
						)}
						<span className="text-gray-500 text-xs">
							{new Date(meme._creationTime).toLocaleDateString()}
						</span>
					</div>
					<Button
						isIconOnly
						size="sm"
						variant="light"
						onPress={() => setShowReportModal(true)}
						aria-label="Report this content"
					>
						<Flag className="h-4 w-4" />
					</Button>
				</div>

				{/* Title */}
				<div className="px-4 pb-3">
					<h3 className="font-bold text-gray-900 text-lg leading-tight dark:text-gray-100">
						{meme.title}
					</h3>
				</div>

				{/* <div className="w-full bg-gray-100 dark:bg-gray-900 min-h-[300px] flex items-center justify-center relative">
          
        </div> */}
				{meme.imageUrl && !imageError ? (
					<Image
						src={meme.imageUrl}
						alt={meme.title}
						classNames={{
							wrapper: "w-full !max-w-full",
							img: "w-full object-contain",
						}}
						onError={() => setImageError(true)}
					/>
				) : (
					<div className="flex h-[300px] flex-col items-center justify-center text-gray-400">
						<ImageOff className="mb-3 h-16 w-16" strokeWidth={1.5} />
						<p className="font-medium text-sm">Image not available</p>
					</div>
				)}

				{/* Actions */}
				<div className="px-4 py-3">
					<div className="mb-3 flex items-center gap-4">
						<button
							type="button"
							onClick={handleLike}
							className="group flex items-center gap-2"
						>
							<Heart
								className={`h-6 w-6 transition-all ${
									meme.userLiked
										? "scale-110 fill-red-500 text-red-500"
										: "text-gray-900 group-hover:text-gray-500 dark:text-gray-100"
								}`}
							/>
							<span className="font-semibold text-gray-900 text-sm dark:text-gray-100">
								{meme.likes}
							</span>
						</button>

						<button
							type="button"
							onClick={() => setShowComments(true)}
							className="group flex items-center gap-2"
						>
							<MessageCircle className="h-6 w-6 text-gray-900 group-hover:text-gray-500 dark:text-gray-100" />
							<span className="font-semibold text-gray-900 text-sm dark:text-gray-100">
								{meme.comments || 0}
							</span>
						</button>

						<button
							type="button"
							onClick={handleShare}
							className="group flex items-center gap-2"
						>
							<Share2 className="h-6 w-6 text-gray-900 group-hover:text-gray-500 dark:text-gray-100" />
							<span className="font-semibold text-gray-900 text-sm dark:text-gray-100">
								{meme.shares}
							</span>
						</button>
					</div>

					{/* Tags */}
					{meme.tags.length > 0 && (
						<div className="flex flex-wrap gap-2">
							{meme.tags.map((tag) => (
								<span
									key={tag}
									className="font-medium text-blue-600 text-sm dark:text-blue-400"
								>
									#{tag}
								</span>
							))}
						</div>
					)}
				</div>
			</article>

			<CommentModal
				memeId={meme._id}
				isOpen={showComments}
				onClose={() => setShowComments(false)}
				memeTitle={meme.title}
			/>

			<ReportModal
				memeId={meme._id}
				memeTitle={meme.title}
				isOpen={showReportModal}
				onClose={() => setShowReportModal(false)}
			/>
		</>
	);
}
