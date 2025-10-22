import { Button, Chip, Modal, ModalBody, ModalContent } from "@heroui/react";
import { useMutation, useQuery } from "convex/react";
import { AlertCircle, Camera, Check, Edit3, X } from "lucide-react";
import { useId, useState } from "react";
import { toast } from "sonner";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import { TagInput } from "./TagInput";

interface CreateMemeModalProps {
	isOpen: boolean;
	onClose: () => void;
}

export function CreateMemeModal({ isOpen, onClose }: CreateMemeModalProps) {
	const [title, setTitle] = useState("");
	const [selectedCategory, setSelectedCategory] = useState<string>("");
	const [tags, setTags] = useState<string[]>([]);
	const [selectedImage, setSelectedImage] = useState<File | null>(null);
	const [imagePreview, setImagePreview] = useState<string | null>(null);
	const [isUploading, setIsUploading] = useState(false);
	const [isOptimizing, setIsOptimizing] = useState(false);
	const [editingTitle, setEditingTitle] = useState(false);
	const [editingCategory, setEditingCategory] = useState(false);
	const [editingTags, setEditingTags] = useState(false);
	const [validationError, setValidationError] = useState<string | null>(null);

	const fileInputId = useId();
	const categories = useQuery(api.memes.getCategories);
	const createMeme = useMutation(api.memes.createMeme);
	const generateUploadUrl = useMutation(api.memes.generateUploadUrl);
	const rateLimitStatus = useQuery(api.memes.getRateLimitStatus);

	const optimizeImage = (file: File): Promise<File> => {
		return new Promise((resolve) => {
			const canvas = document.createElement("canvas");
			const ctx = canvas.getContext("2d");
			if (!ctx) {
				resolve(file);
				return;
			}
			const img = new window.Image();

			img.onload = () => {
				const maxSize = 800;
				let { width, height } = img;

				if (width > height) {
					if (width > maxSize) {
						height = (height * maxSize) / width;
						width = maxSize;
					}
				} else {
					if (height > maxSize) {
						width = (width * maxSize) / height;
						height = maxSize;
					}
				}

				canvas.width = width;
				canvas.height = height;
				ctx.drawImage(img, 0, 0, width, height);

				canvas.toBlob(
					(blob) => {
						if (blob) {
							const optimizedFile = new File([blob], file.name, {
								type: "image/jpeg",
								lastModified: Date.now(),
							});
							resolve(optimizedFile);
						} else {
							resolve(file);
						}
					},
					"image/jpeg",
					0.8,
				);
			};

			img.src = URL.createObjectURL(file);
		});
	};

	const validateImageDimensions = (file: File): Promise<string | null> => {
		return new Promise((resolve) => {
			const img = new window.Image();
			img.onload = () => {
				// Different minimum dimensions for GIFs vs regular images
				// Different minimum dimensions for GIFs vs regular images
				const MIN_WIDTH = file.type === "image/gif" ? 300 : 400;
				const MIN_HEIGHT = file.type === "image/gif" ? 200 : 300;

				if (img.width < MIN_WIDTH || img.height < MIN_HEIGHT) {
					resolve(
						`${file.type === "image/gif" ? "GIF" : "Image"} too small. Minimum dimensions: ${MIN_WIDTH}x${MIN_HEIGHT}px`,
					);
				} else {
					resolve(null);
				}
			};
			img.onerror = () => {
				resolve("Failed to load image");
			};
			img.src = URL.createObjectURL(file);
		});
	};

	const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (file) {
			// Clear any previous validation errors
			setValidationError(null);

			if (!file.type.startsWith("image/")) {
				setValidationError("Please select a valid image file");
				return;
			}

			// Only enforce file size limit for GIFs (images will be optimized)
			if (file.type === "image/gif") {
				const maxSize = 5 * 1024 * 1024; // 5MB for GIFs
				if (file.size > maxSize) {
					setValidationError("GIF too large. Please select a GIF under 5MB");
					return;
				}
			}

			// Validate minimum dimensions
			const dimensionError = await validateImageDimensions(file);
			if (dimensionError) {
				setValidationError(dimensionError);
				return;
			}

			setIsOptimizing(true);

			const reader = new FileReader();
			reader.onload = (e) => {
				setImagePreview(e.target?.result as string);
			};
			reader.readAsDataURL(file);

			try {
				// Skip optimization for GIFs to preserve animation
				if (file.type === "image/gif") {
					setSelectedImage(file);
				} else {
					const optimizedFile = await optimizeImage(file);
					setSelectedImage(optimizedFile);
				}
			} catch {
				setSelectedImage(file);
			} finally {
				setIsOptimizing(false);
			}
		}
	};

	const handleSubmit = async () => {
		if (!title.trim() || !selectedCategory || !selectedImage) {
			toast.error("Please fill in all required fields");
			return;
		}

		setIsUploading(true);

		try {
			const postUrl = await generateUploadUrl();

			const result = await fetch(postUrl, {
				method: "POST",
				headers: { "Content-Type": selectedImage.type },
				body: selectedImage,
			});

			const json = await result.json();
			if (!result.ok) {
				throw new Error(`Upload failed: ${JSON.stringify(json)}`);
			}

			const { storageId } = json;

			await createMeme({
				title: title.trim(),
				imageUrl: storageId,
				categoryId: selectedCategory as Id<"categories">,
				tags: tags,
			});

			setTitle("");
			setSelectedCategory("");
			setTags([]);
			setSelectedImage(null);
			setImagePreview(null);
			onClose();
		} catch (error) {
			console.error("Error creating meme:", error);
			const errorMessage =
				error instanceof Error ? error.message : "Failed to create meme";
			toast.error(errorMessage);
		} finally {
			setIsUploading(false);
		}
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
				base: "max-w-[600px] h-[75dvh]! mx-auto rounded-t-3xl mb-0",
				backdrop: "backdrop-blur-sm bg-black/50",
				body: "p-0",
			}}
			scrollBehavior="inside"
		>
			<ModalContent className="bg-gray-50 dark:bg-gray-950">
				{() => (
					<>
						<div className="flex flex-col items-center border-gray-200 border-b pt-2 pb-3 dark:border-gray-800">
							<div className="mb-3 h-1 w-10 rounded-full bg-gray-300 dark:bg-gray-700" />
							<h3 className="font-bold text-base text-gray-900 dark:text-gray-100">
								Create New Meme
							</h3>
							{rateLimitStatus && rateLimitStatus.limit < 999 && (
								<div className="mt-2 flex items-center gap-2">
									<Chip
										size="sm"
										color={
											rateLimitStatus.remaining === 0
												? "danger"
												: rateLimitStatus.remaining <= 2
													? "warning"
													: "success"
										}
										variant="flat"
									>
										{rateLimitStatus.remaining} / {rateLimitStatus.limit} posts
										remaining
									</Chip>
									{rateLimitStatus.isLimited && rateLimitStatus.resetTime && (
										<span className="text-gray-500 text-xs">
											Resets in{" "}
											{Math.ceil(
												(rateLimitStatus.resetTime - Date.now()) / 1000 / 60,
											)}{" "}
											min
										</span>
									)}
								</div>
							)}
						</div>
						<ModalBody className="px-4 py-6">
							{/* Validation Error Alert */}
							{validationError && (
								<div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-4 dark:border-red-900 dark:bg-red-950">
									<div className="flex items-start gap-3">
										<AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-600 dark:text-red-400" />
										<div className="flex-1">
											<p className="font-medium text-red-900 text-sm dark:text-red-100">
												{validationError}
											</p>
										</div>
										<button
											type="button"
											onClick={() => setValidationError(null)}
											className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
											title="Dismiss"
										>
											<X className="h-4 w-4" />
										</button>
									</div>
								</div>
							)}

							{/* Preview Card with Inline Editing */}
							<div className="rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">
								{/* Header with Category */}
								<div className="flex items-center justify-between border-gray-100 border-b px-4 py-3 dark:border-gray-800">
									<div className="flex flex-1 items-center gap-3">
										{selectedCategory &&
											categories?.find((c) => c._id === selectedCategory) ? (
											<Chip
												size="sm"
												className="cursor-pointer bg-gray-100 font-semibold text-gray-900 dark:bg-gray-800 dark:text-gray-100"
												radius="full"
												onClick={() => setEditingCategory(true)}
												endContent={<Edit3 className="ml-1 h-3 w-3" />}
											>
												{
													categories.find((c) => c._id === selectedCategory)
														?.name
												}
											</Chip>
										) : (
											<Button
												size="sm"
												variant="flat"
												onPress={() => setEditingCategory(true)}
												startContent={<Edit3 className="h-3 w-3" />}
												className="text-gray-600 dark:text-gray-400"
											>
												Select category
											</Button>
										)}
										<span className="text-gray-500 text-xs">Just now</span>
									</div>
								</div>

								{/* Title */}
								<div className="border-gray-100 border-b px-4 py-3 dark:border-gray-800">
									{editingTitle ? (
										<textarea
											autoFocus
											value={title}
											onChange={(e) => setTitle(e.target.value)}
											onBlur={() => setEditingTitle(false)}
											placeholder="Enter a catchy title..."
											rows={1}
											className="w-full resize-none border-none bg-transparent font-bold text-gray-900 text-lg leading-tight outline-none placeholder:text-gray-400 dark:text-gray-100 dark:placeholder:text-gray-600"
											style={{
												minHeight: "28px",
												maxHeight: "120px",
											}}
											onInput={(e) => {
												const target = e.target as HTMLTextAreaElement;
												target.style.height = "auto";
												target.style.height = `${target.scrollHeight}px`;
											}}
										/>
									) : title ? (
										<h3
											className="cursor-pointer font-bold text-gray-900 text-lg leading-tight transition-colors hover:text-gray-600 dark:text-gray-100 dark:hover:text-gray-400"
											onClick={() => setEditingTitle(true)}
										>
											{title}
										</h3>
									) : (
										<button
											type="button"
											onClick={() => setEditingTitle(true)}
											className="flex items-center gap-2 text-gray-500 transition-colors hover:text-gray-700 dark:hover:text-gray-300"
										>
											<Edit3 className="h-4 w-4" />
											<span className="text-base">Add a title...</span>
										</button>
									)}
								</div>

								{/* Image */}
								<div className="relative flex w-full items-center justify-center">
									{imagePreview ? (
										<>
											<img
												src={imagePreview}
												alt="Preview"
												className="max-h-[600px] object-contain"
											/>
											<Button
												isIconOnly
												size="sm"
												className="absolute top-3 right-3 bg-gray-900/70 text-white"
												radius="full"
												onPress={() => {
													setSelectedImage(null);
													setImagePreview(null);
												}}
											>
												<X className="h-4 w-4" />
											</Button>
											{selectedImage && (
												<div className="absolute bottom-3 left-3 rounded-full bg-gray-900/70 px-2 py-1 text-white text-xs">
													{(selectedImage.size / 1024 / 1024).toFixed(2)}MB
												</div>
											)}
										</>
									) : (
										<label
											htmlFor={fileInputId}
											className="flex h-full w-full cursor-pointer flex-col items-center justify-center py-12 transition-colors hover:bg-gray-200 dark:hover:bg-gray-700"
										>
											<input
												id={fileInputId}
												type="file"
												accept="image/*,image/gif"
												onChange={handleImageSelect}
												className="hidden"
												disabled={isOptimizing}
											/>
											<Camera className="mb-3 h-16 w-16 text-gray-400" />
											<span className="font-medium text-base text-gray-600 dark:text-gray-400">
												{isOptimizing ? "Optimizing..." : "Upload image or GIF"}
											</span>
											<span className="mt-1 text-gray-500 text-xs">
												Images: Min 400x400px • GIFs: Min 300x300px, Max 5MB
											</span>
										</label>
									)}
								</div>

								{/* Tags */}
								<div className="px-4 py-3">
									{editingTags ? (
										<div className="space-y-2">
											<TagInput
												tags={tags}
												onTagsChange={setTags}
												placeholder="Add tags..."
												maxTags={5}
											/>
											<Button
												size="sm"
												variant="flat"
												onPress={() => setEditingTags(false)}
												className="w-full"
											>
												Done
											</Button>
										</div>
									) : tags.length > 0 ? (
										<div
											className="flex cursor-pointer flex-wrap gap-2"
											onClick={() => setEditingTags(true)}
										>
											{tags.map((tag) => (
												<span
													key={tag}
													className="font-medium text-blue-600 text-sm dark:text-blue-400"
												>
													#{tag}
												</span>
											))}
											<span className="text-gray-400 text-sm hover:text-gray-600">
												<Edit3 className="inline h-3 w-3" />
											</span>
										</div>
									) : (
										<button
											type="button"
											onClick={() => setEditingTags(true)}
											className="flex items-center gap-2 text-gray-500 text-sm transition-colors hover:text-gray-700 dark:hover:text-gray-300"
										>
											<Edit3 className="h-3 w-3" />
											<span>Add tags (optional)</span>
										</button>
									)}
								</div>
							</div>

							{/* Category Selector Modal */}
							{editingCategory && (
								<div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 backdrop-blur-sm">
									<div className="w-full max-w-[600px] animate-slide-up rounded-t-3xl bg-gray-50 dark:bg-gray-950">
										{/* Drag indicator */}
										<div className="flex flex-col items-center border-gray-200 border-b pt-2 pb-3 dark:border-gray-800">
											<div className="mb-3 h-1 w-10 rounded-full bg-gray-300 dark:bg-gray-700" />
											<h4 className="font-bold text-base text-gray-900 dark:text-gray-100">
												Select Category
											</h4>
										</div>

										{/* Category list */}
										<div className="max-h-[60vh] overflow-y-auto p-4">
											<div className="space-y-2">
												{categories?.map((category) => {
													const isSelected = selectedCategory === category._id;

													return (
														<button
															key={category._id}
															type="button"
															onClick={() => {
																setSelectedCategory(category._id);
																setEditingCategory(false);
															}}
															className={`flex w-full items-center gap-4 rounded-2xl p-4 transition-all ${isSelected
																	? "bg-gray-900 dark:bg-gray-100"
																	: "bg-white hover:bg-gray-100 dark:bg-gray-900 dark:hover:bg-gray-800"
																}`}
														>
															<span
																className={`flex-1 text-left font-semibold ${isSelected
																		? "text-white dark:text-gray-900"
																		: "text-gray-900 dark:text-gray-100"
																	}`}
															>
																{category.name}
															</span>
															{isSelected && (
																<div className="flex h-6 w-6 items-center justify-center rounded-full bg-white/20 dark:bg-gray-900/20">
																	<Check
																		className="h-4 w-4 text-white dark:text-gray-900"
																		strokeWidth={3}
																	/>
																</div>
															)}
														</button>
													);
												})}
											</div>
										</div>

										{/* Footer */}
										<div className="border-gray-200 border-t p-4 dark:border-gray-800">
											<Button
												variant="flat"
												onPress={() => setEditingCategory(false)}
												size="lg"
												className="w-full"
												radius="full"
											>
												Cancel
											</Button>
										</div>
									</div>
								</div>
							)}
						</ModalBody>
						<div className="space-y-2 border-gray-200 border-t bg-gray-50 p-4 dark:border-gray-800 dark:bg-gray-950">
							<Button
								className="w-full bg-gray-900 font-bold text-white dark:bg-gray-100 dark:text-gray-900"
								onPress={handleSubmit}
								isLoading={isUploading || isOptimizing}
								isDisabled={
									!title.trim() ||
									!selectedCategory ||
									!selectedImage ||
									(rateLimitStatus?.isLimited ?? false)
								}
								size="lg"
								radius="full"
							>
								{rateLimitStatus?.isLimited
									? "Rate Limit Reached"
									: isUploading
										? "Creating..."
										: isOptimizing
											? "Optimizing..."
											: "Create"}
							</Button>
							<Button
								variant="flat"
								onPress={onClose}
								size="lg"
								className="w-full"
								radius="full"
							>
								Cancel
							</Button>
						</div>
					</>
				)}
			</ModalContent>
		</Modal>
	);
}
