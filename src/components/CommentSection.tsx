import { Avatar, Button, Textarea } from "@heroui/react";
import { useMutation, useQuery } from "convex/react";
import { MessageCircle, Send, Trash2 } from "lucide-react";
import { useState } from "react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import { SignInPromptModal } from "./SignInPromptModal";

interface CommentSectionProps {
	memeId: Id<"memes">;
}

export function CommentSection({ memeId }: CommentSectionProps) {
	const [newComment, setNewComment] = useState("");
	const [replyTo, setReplyTo] = useState<Id<"comments"> | null>(null);
	const [replyContent, setReplyContent] = useState("");
	const [showSignInPrompt, setShowSignInPrompt] = useState(false);

	const comments = useQuery(api.comments.getComments, { memeId });
	const addComment = useMutation(api.comments.addComment);
	const deleteComment = useMutation(api.comments.deleteComment);
	const loggedInUser = useQuery(api.auth.loggedInUser);

	const handleAddComment = async () => {
		if (!loggedInUser) {
			setShowSignInPrompt(true);
			return;
		}
		if (!newComment.trim()) return;

		try {
			await addComment({
				memeId,
				content: newComment.trim(),
			});
			setNewComment("");
		} catch {
			// Silent fail for seamless experience
		}
	};

	const handleAddReply = async () => {
		if (!replyContent.trim() || !replyTo) return;

		try {
			await addComment({
				memeId,
				content: replyContent.trim(),
				parentId: replyTo,
			});
			setReplyContent("");
			setReplyTo(null);
		} catch {
			// Silent fail for seamless experience
		}
	};

	const handleDeleteComment = async (commentId: Id<"comments">) => {
		try {
			await deleteComment({ commentId });
		} catch {
			// Silent fail for seamless experience
		}
	};

	return (
		<div className="bg-gray-50 dark:bg-gray-950">
			{/* Comments Header */}
			<div className="border-gray-200 border-b px-4 py-3 dark:border-gray-800">
				<h3 className="font-bold text-gray-900 dark:text-gray-100">Comments</h3>
			</div>

			{/* Comment Input */}
			<div className="border-gray-200 border-b bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
				<div className="flex items-end gap-2">
					<div className="relative flex-1">
						<Textarea
							value={newComment}
							onValueChange={setNewComment}
							placeholder="Add a comment..."
							minRows={1}
							maxRows={4}
							classNames={{
								inputWrapper:
									"bg-gray-100 dark:bg-gray-800 border-0 shadow-none",
								input: "text-sm",
							}}
							onKeyDown={(e) => {
								if (e.key === "Enter" && !e.shiftKey) {
									e.preventDefault();
									if (newComment.trim()) {
										handleAddComment();
									}
								}
							}}
						/>
					</div>
					<Button
						isIconOnly
						className={`shrink-0 transition-all ${
							newComment.trim()
								? "scale-100 bg-gray-900 text-white dark:bg-white dark:text-gray-900"
								: "scale-95 bg-gray-200 text-gray-400 dark:bg-gray-800 dark:text-gray-600"
						}`}
						onPress={handleAddComment}
						isDisabled={!newComment.trim()}
						radius="full"
						size="md"
					>
						<Send className="h-5 w-5" />
					</Button>
				</div>
			</div>

			{/* Comments List */}
			{comments && comments.length > 0 ? (
				<div className="divide-y divide-gray-200 dark:divide-gray-800">
					{comments.map((comment) => (
						<div key={comment._id} className="px-4 py-4">
							{/* Main Comment */}
							<div className="flex gap-3">
								<Avatar
									size="sm"
									name={
										comment.author?.name?.[0] ||
										comment.author?.email?.[0] ||
										"?"
									}
									className="shrink-0 bg-gray-900 dark:bg-gray-100"
								/>
								<div className="min-w-0 flex-1">
									<div className="mb-1 flex items-start justify-between gap-2">
										<div>
											<span className="font-bold text-gray-900 text-sm dark:text-gray-100">
												{comment.author?.name ||
													comment.author?.email ||
													"Anonymous"}
											</span>
											<span className="ml-2 text-gray-500 text-xs">
												{new Date(comment._creationTime).toLocaleDateString()}
											</span>
										</div>
										{loggedInUser?._id === comment.authorId && (
											<Button
												isIconOnly
												size="sm"
												variant="light"
												onPress={() => handleDeleteComment(comment._id)}
												className="shrink-0"
											>
												<Trash2 className="h-4 w-4 text-red-500" />
											</Button>
										)}
									</div>
									<p className="mb-2 text-gray-900 text-sm leading-relaxed dark:text-gray-100">
										{comment.content}
									</p>
									<button
										type="button"
										onClick={() => {
											if (!loggedInUser) {
												setShowSignInPrompt(true);
												return;
											}
											setReplyTo(comment._id);
										}}
										className="font-semibold text-gray-500 text-xs hover:text-gray-700 dark:hover:text-gray-300"
									>
										Reply
									</button>
								</div>
							</div>

							{/* Replies */}
							{comment.replies && comment.replies.length > 0 && (
								<div className="mt-3 ml-11 space-y-3">
									{comment.replies.map((reply) => (
										<div key={reply._id} className="flex gap-3">
											<Avatar
												size="sm"
												name={
													reply.author?.name?.[0] ||
													reply.author?.email?.[0] ||
													"?"
												}
												className="shrink-0 bg-gray-700 dark:bg-gray-300"
											/>
											<div className="min-w-0 flex-1">
												<div className="mb-1 flex items-start justify-between gap-2">
													<div>
														<span className="font-bold text-gray-900 text-sm dark:text-gray-100">
															{reply.author?.name ||
																reply.author?.email ||
																"Anonymous"}
														</span>
														<span className="ml-2 text-gray-500 text-xs">
															{new Date(
																reply._creationTime,
															).toLocaleDateString()}
														</span>
													</div>
													{loggedInUser?._id === reply.authorId && (
														<Button
															isIconOnly
															size="sm"
															variant="light"
															onPress={() => handleDeleteComment(reply._id)}
															className="shrink-0"
														>
															<Trash2 className="h-3 w-3 text-red-500" />
														</Button>
													)}
												</div>
												<p className="text-gray-900 text-sm leading-relaxed dark:text-gray-100">
													{reply.content}
												</p>
											</div>
										</div>
									))}
								</div>
							)}

							{/* Reply Input */}
							{replyTo === comment._id && (
								<div className="mt-3 ml-11 space-y-2">
									<div className="rounded-2xl bg-gray-100 p-3 dark:bg-gray-800">
										<Textarea
											value={replyContent}
											onValueChange={setReplyContent}
											placeholder="Write a reply..."
											minRows={2}
											autoFocus
											classNames={{
												inputWrapper: "bg-transparent border-0 shadow-none p-0",
												input: "text-sm",
											}}
											onKeyDown={(e) => {
												if (e.key === "Enter" && !e.shiftKey) {
													e.preventDefault();
													if (replyContent.trim()) {
														handleAddReply();
													}
												}
											}}
										/>
									</div>
									<div className="flex gap-2">
										<Button
											size="sm"
											className="bg-gray-900 font-bold text-white dark:bg-white dark:text-gray-900"
											onPress={handleAddReply}
											isDisabled={!replyContent.trim()}
											radius="full"
											startContent={<Send className="h-3.5 w-3.5" />}
										>
											Send
										</Button>
										<Button
											size="sm"
											variant="flat"
											onPress={() => {
												setReplyTo(null);
												setReplyContent("");
											}}
											radius="full"
											className="bg-gray-100 dark:bg-gray-800"
										>
											Cancel
										</Button>
									</div>
								</div>
							)}
						</div>
					))}
				</div>
			) : (
				<div className="px-4 py-16 text-center">
					<div className="mb-3 flex justify-center">
						<MessageCircle
							className="h-16 w-16 text-gray-400"
							strokeWidth={1.5}
						/>
					</div>
					<p className="mb-1 font-bold text-gray-900 dark:text-gray-100">
						No comments yet
					</p>
					<p className="text-gray-500 text-sm">Be the first to comment!</p>
				</div>
			)}

			<SignInPromptModal
				isOpen={showSignInPrompt}
				onClose={() => setShowSignInPrompt(false)}
				action="comment on this post"
			/>
		</div>
	);
}
