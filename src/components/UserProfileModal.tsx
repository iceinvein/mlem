import {
	Avatar,
	Button,
	Image,
	Modal,
	ModalBody,
	ModalContent,
} from "@heroui/react";
import { useQuery } from "convex/react";
import { Calendar, Heart, ImageIcon, ImageOff } from "lucide-react";
import { useState } from "react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";

interface UserProfileModalProps {
	userId: Id<"users">;
	isOpen: boolean;
	onClose: () => void;
}

export function UserProfileModal({
	userId,
	isOpen,
	onClose,
}: UserProfileModalProps) {
	const profile = useQuery(api.users.getUserProfile, { userId });
	const memes = useQuery(api.users.getUserMemes, { userId });
	const [imageErrors, setImageErrors] = useState<Set<string>>(new Set());

	if (!profile) {
		return null;
	}

	const username = profile.name || profile.email || "Anonymous";
	const userInitial = profile.name?.[0] || profile.email?.[0] || "?";
	const joinDate = new Date(profile._creationTime).toLocaleDateString("en-US", {
		month: "long",
		year: "numeric",
	});

	const handleImageError = (memeId: string) => {
		setImageErrors((prev) => new Set(prev).add(memeId));
	};

	return (
		<Modal
			isOpen={isOpen}
			onClose={onClose}
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
				base: "max-w-[600px] mx-auto h-[80vh]! rounded-t-3xl mb-0 sm:mb-0",
				backdrop: "backdrop-blur-sm bg-black/50",
			}}
			scrollBehavior="inside"
		>
			<ModalContent className="h-[80vh]! bg-gray-50 dark:bg-gray-950">
				{/* Header with drag indicator */}
				<div className="flex flex-col items-center border-gray-200 border-b pt-2 pb-4 dark:border-gray-800">
					<div className="mb-3 h-1 w-10 rounded-full bg-gray-300 dark:bg-gray-700" />

					{/* Profile Header */}
					<div className="flex w-full flex-col items-center px-6 text-center">
						<Avatar
							size="lg"
							name={userInitial}
							className="mb-3 h-20 w-20 bg-gray-900 text-2xl text-white dark:bg-gray-100 dark:text-gray-900"
						/>
						<h2 className="mb-1 font-bold text-gray-900 text-xl dark:text-gray-100">
							{username}
						</h2>
						<div className="mb-4 flex items-center gap-1 text-gray-500 text-sm">
							<Calendar className="h-4 w-4" />
							<span>Joined {joinDate}</span>
						</div>

						{/* Stats */}
						<div className="mb-4 flex w-full justify-center gap-8 px-4">
							<div className="flex flex-col items-center text-center">
								<span className="font-bold text-2xl text-gray-900 dark:text-gray-100">
									{profile.totalPosts}
								</span>
								<span className="text-gray-500 text-sm">Posts</span>
							</div>
							<div className="flex flex-col items-center text-center">
								<span className="font-bold text-2xl text-gray-900 dark:text-gray-100">
									{profile.totalLikes}
								</span>
								<span className="text-gray-500 text-sm">Likes</span>
							</div>
						</div>

						{/* Future action buttons placeholder */}
						<div className="flex w-full gap-2">
							<Button
								size="sm"
								variant="flat"
								className="flex-1 bg-gray-200 dark:bg-gray-800"
								isDisabled
							>
								Report
							</Button>
							<Button
								size="sm"
								variant="flat"
								className="flex-1 bg-gray-200 dark:bg-gray-800"
								isDisabled
							>
								Mute
							</Button>
						</div>
					</div>
				</div>

				<ModalBody className="px-0 py-0">
					{/* Posts Section */}
					<div className="px-4 py-4">
						<h3 className="mb-3 font-bold text-gray-900 dark:text-gray-100">
							Posts
						</h3>

						{memes && memes.length > 0 ? (
							<div className="grid grid-cols-3 gap-1">
								{memes.map(
									(meme: {
										_id: Id<"memes">;
										title: string;
										imageUrl: string;
										likes: number;
										comments: number;
									}) => (
										<div
											key={meme._id}
											className="relative aspect-square overflow-hidden rounded-lg bg-gray-200 dark:bg-gray-800"
										>
											{meme.imageUrl && !imageErrors.has(meme._id) ? (
												<Image
													src={meme.imageUrl}
													alt={meme.title}
													classNames={{
														wrapper: "!max-w-full h-full",
														img: "h-full w-full object-cover",
													}}
													onError={() => handleImageError(meme._id)}
												/>
											) : (
												<div className="flex h-full w-full items-center justify-center">
													<ImageOff
														className="h-8 w-8 text-gray-400"
														strokeWidth={1.5}
													/>
												</div>
											)}

											{/* Overlay with stats */}
											<div className="absolute inset-0 flex items-center justify-center bg-black/0 opacity-0 transition-all hover:bg-black/50 hover:opacity-100">
												<div className="flex items-center gap-3 text-white">
													<div className="flex items-center gap-1">
														<Heart className="h-4 w-4 fill-white" />
														<span className="font-semibold text-sm">
															{meme.likes}
														</span>
													</div>
													<div className="flex items-center gap-1">
														<ImageIcon className="h-4 w-4" />
														<span className="font-semibold text-sm">
															{meme.comments}
														</span>
													</div>
												</div>
											</div>
										</div>
									),
								)}
							</div>
						) : (
							<div className="py-12 text-center">
								<ImageIcon
									className="mx-auto mb-3 h-12 w-12 text-gray-400"
									strokeWidth={1.5}
								/>
								<p className="text-gray-500 text-sm">No posts yet</p>
							</div>
						)}
					</div>
				</ModalBody>
			</ModalContent>
		</Modal>
	);
}
