import { Avatar, Button, Image } from "@heroui/react";
import { useMutation, useQuery } from "convex/react";
import {
	Flag,
	Heart,
	ImageOff,
	MessageCircle,
	Share2,
	Trash2,
} from "lucide-react";
import { memo, useMemo, useState } from "react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import { CommentModal } from "./CommentModal";
import { DeleteMemeModal } from "./DeleteMemeModal";
import { ReportModal } from "./ReportModal";
import { ShareModal } from "./ShareModal";
import { SignInPromptModal } from "./SignInPromptModal";
import { UserProfileModal } from "./UserProfileModal";

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
		authorId?: Id<"users">;
		author: {
			name?: string;
			email?: string;
		} | null;
	};
	hideCommentModal?: boolean;
}

function MemeCardComponent({ meme, hideCommentModal = false }: MemeCardProps) {
	const [showComments, setShowComments] = useState(false);
	const [showReportModal, setShowReportModal] = useState(false);
	const [showDeleteModal, setShowDeleteModal] = useState(false);
	const [showShareModal, setShowShareModal] = useState(false);
	const [showUserProfile, setShowUserProfile] = useState(false);
	const [showSignInPrompt, setShowSignInPrompt] = useState(false);
	const [signInAction, setSignInAction] = useState("");
	const [imageError, setImageError] = useState(false);
	const toggleLike = useMutation(api.memes.toggleLike);
	const shareMeme = useMutation(api.memes.shareMeme);
	const viewer = useQuery(api.auth.loggedInUser);

	// Memoize the image URL to prevent unnecessary re-renders of the Image component
	const imageUrl = useMemo(() => meme.imageUrl, [meme.imageUrl]);

	// Memoize handlers to prevent re-creating them on every render
	const handleLike = useMemo(
		() => async () => {
			if (!viewer) {
				setSignInAction("like this meme");
				setShowSignInPrompt(true);
				return;
			}
			try {
				await toggleLike({ memeId: meme._id });
			} catch {
				// Silent fail for seamless experience
			}
		},
		[toggleLike, meme._id, viewer],
	);

	const handleShare = useMemo(
		() => async () => {
			if (!viewer) {
				setSignInAction("share this meme");
				setShowSignInPrompt(true);
				return;
			}
			try {
				await shareMeme({ memeId: meme._id });
				setShowShareModal(true);
			} catch {
				// Silent fail for seamless experience
			}
		},
		[shareMeme, meme._id, viewer],
	);

	const handleComment = () => {
		if (hideCommentModal) {
			// In single post view, just show the count - comments are already visible below
			return;
		}
		if (!viewer) {
			setSignInAction("comment on this meme");
			setShowSignInPrompt(true);
			return;
		}
		setShowComments(true);
	};

	const handleReport = () => {
		if (!viewer) {
			setSignInAction("report this meme");
			setShowSignInPrompt(true);
			return;
		}
		setShowReportModal(true);
	};

	const isOwnMeme = viewer && meme.authorId === viewer._id;

	const authorName = meme.author?.name || meme.author?.email || "Anonymous";
	const authorInitial =
		meme.author?.name?.[0] || meme.author?.email?.[0] || "?";

	return (
		<>
			<article className="border-gray-200 border-b bg-gray-50 dark:border-gray-800 dark:bg-gray-950">
				{/* Header with Author Info and Category */}
				<div className="flex items-start justify-between px-4 py-3">
					<button
						type="button"
						onClick={() => meme.authorId && setShowUserProfile(true)}
						className="flex min-w-0 items-center gap-3 hover:opacity-80"
						disabled={!meme.authorId}
					>
						<Avatar
							size="sm"
							name={authorInitial}
							className="shrink-0 bg-gray-900 text-white dark:bg-gray-100 dark:text-gray-900"
						/>
						<div className="flex min-w-0 flex-col">
							<span className="truncate font-semibold text-gray-900 text-sm dark:text-gray-100">
								{authorName}
							</span>
							<span className="text-gray-500 text-xs">
								{new Date(meme._creationTime).toLocaleDateString()}
							</span>
						</div>
					</button>
					{meme.category && (
						<span className="rounded-full bg-gray-200 px-3 py-1 font-medium text-gray-700 text-xs dark:bg-gray-800 dark:text-gray-300">
							{meme.category.name}
						</span>
					)}
				</div>

				{/* Title */}
				<div className="px-4 pb-3">
					<h3 className="font-bold text-gray-900 text-lg leading-tight dark:text-gray-100">
						{meme.title}
					</h3>
				</div>

				{imageUrl && !imageError ? (
					<div className="flex w-full items-center justify-center">
						<Image
							src={imageUrl}
							alt={meme.title}
							classNames={{
								wrapper: "!max-w-full",
								img: "max-h-[600px] object-contain",
							}}
							onError={() => setImageError(true)}
						/>
					</div>
				) : (
					<div className="flex h-[300px] flex-col items-center justify-center bg-gray-100 text-gray-400 dark:bg-gray-900">
						<ImageOff className="mb-3 h-16 w-16" strokeWidth={1.5} />
						<p className="font-medium text-sm">Image not available</p>
					</div>
				)}

				{/* Actions and Tags */}
				<div className="px-4 py-3">
					<div className="mb-3 flex items-center justify-between">
						<div className="flex items-center gap-4">
							<button
								type="button"
								onClick={handleLike}
								className="group flex items-center gap-2"
							>
								<Heart
									className={`h-6 w-6 transition-all ${meme.userLiked
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
								onClick={handleComment}
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

						{/* Report and Delete buttons */}
						<div className="flex items-center gap-1">
							{isOwnMeme && (
								<Button
									isIconOnly
									size="sm"
									variant="light"
									onPress={() => setShowDeleteModal(true)}
									aria-label="Delete this meme"
									className="text-red-600 hover:text-red-700"
								>
									<Trash2 className="h-4 w-4" />
								</Button>
							)}
							<Button
								isIconOnly
								size="sm"
								variant="light"
								onPress={handleReport}
								aria-label="Report this content"
							>
								<Flag className="h-4 w-4" />
							</Button>
						</div>
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

			<DeleteMemeModal
				memeId={meme._id}
				memeTitle={meme.title}
				isOpen={showDeleteModal}
				onClose={() => setShowDeleteModal(false)}
			/>

			<ReportModal
				memeId={meme._id}
				memeTitle={meme.title}
				isOpen={showReportModal}
				onClose={() => setShowReportModal(false)}
			/>

			<ShareModal
				memeId={meme._id}
				memeTitle={meme.title}
				isOpen={showShareModal}
				onClose={() => setShowShareModal(false)}
			/>

			{meme.authorId && (
				<UserProfileModal
					userId={meme.authorId}
					isOpen={showUserProfile}
					onClose={() => setShowUserProfile(false)}
				/>
			)}

			<SignInPromptModal
				isOpen={showSignInPrompt}
				onClose={() => setShowSignInPrompt(false)}
				action={signInAction}
			/>
		</>
	);
}

// Memoize the component to prevent re-renders when meme data hasn't actually changed
// Note: We DON'T compare imageUrl because storage URLs change on every query
// The image component will handle URL changes internally without reloading
export const MemeCard = memo(MemeCardComponent, (prevProps, nextProps) => {
	// Only re-render if these specific fields change (excluding imageUrl)
	return (
		prevProps.meme._id === nextProps.meme._id &&
		prevProps.meme.likes === nextProps.meme.likes &&
		prevProps.meme.shares === nextProps.meme.shares &&
		prevProps.meme.comments === nextProps.meme.comments &&
		prevProps.meme.userLiked === nextProps.meme.userLiked &&
		prevProps.meme.userShared === nextProps.meme.userShared &&
		prevProps.meme.authorId === nextProps.meme.authorId &&
		prevProps.meme.author?.name === nextProps.meme.author?.name
	);
});
