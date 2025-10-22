import { Button, Modal, ModalBody, ModalContent } from "@heroui/react";
import { useMutation } from "convex/react";
import { AlertTriangle } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";

interface DeleteMemeModalProps {
	memeId: Id<"memes">;
	memeTitle: string;
	isOpen: boolean;
	onClose: () => void;
}

export function DeleteMemeModal({
	memeId,
	memeTitle,
	isOpen,
	onClose,
}: DeleteMemeModalProps) {
	const [isDeleting, setIsDeleting] = useState(false);
	const deleteMeme = useMutation(api.memes.deleteMeme);

	const handleDelete = async () => {
		setIsDeleting(true);
		try {
			await deleteMeme({ memeId });
			toast.success("Meme deleted successfully");
			onClose();
		} catch (error) {
			toast.error(
				error instanceof Error ? error.message : "Failed to delete meme",
			);
			setIsDeleting(false);
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
				base: "max-w-[600px] mx-auto !h-auto rounded-t-3xl mb-0 sm:mb-0",
				backdrop: "backdrop-blur-sm bg-black/50",
			}}
		>
			<ModalContent className="bg-gray-50 dark:bg-gray-950">
				<div className="flex flex-col items-center border-gray-200 border-b pt-2 pb-3 dark:border-gray-800">
					<div className="mb-3 h-1 w-10 rounded-full bg-gray-300 dark:bg-gray-700" />
					<h3 className="font-bold text-base text-gray-900 dark:text-gray-100">
						Delete Meme
					</h3>
				</div>
				<ModalBody className="gap-6 px-4 py-6">
					<div className="flex flex-col items-center gap-4 text-center">
						<div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-100 dark:bg-red-950">
							<AlertTriangle className="h-8 w-8 text-red-600 dark:text-red-400" />
						</div>
						<div>
							<p className="mb-2 font-semibold text-gray-900 text-lg dark:text-gray-100">
								Are you sure?
							</p>
							<p className="mb-1 text-gray-600 text-sm dark:text-gray-400">
								You're about to delete:{" "}
								<span className="font-semibold text-gray-900 dark:text-gray-100">
									"{memeTitle}"
								</span>
							</p>
							<p className="text-gray-500 text-xs">
								This action cannot be undone. All comments, likes, and shares
								will be permanently removed.
							</p>
						</div>
					</div>
				</ModalBody>
				<div className="space-y-2 border-gray-200 border-t bg-gray-50 p-4 dark:border-gray-800 dark:bg-gray-950">
					<Button
						color="danger"
						onPress={handleDelete}
						isLoading={isDeleting}
						size="lg"
						className="w-full font-bold"
						radius="full"
					>
						{isDeleting ? "Deleting..." : "Delete Meme"}
					</Button>
					<Button
						variant="flat"
						onPress={onClose}
						size="lg"
						className="w-full"
						radius="full"
						isDisabled={isDeleting}
					>
						Cancel
					</Button>
				</div>
			</ModalContent>
		</Modal>
	);
}
