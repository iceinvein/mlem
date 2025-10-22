import {
	Button,
	Modal,
	ModalBody,
	ModalContent,
	Radio,
	RadioGroup,
	Textarea,
} from "@heroui/react";
import { useMutation } from "convex/react";
import { useState } from "react";
import { toast } from "sonner";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";

interface ReportModalProps {
	memeId: Id<"memes">;
	memeTitle: string;
	isOpen: boolean;
	onClose: () => void;
}

const reportReasons = [
	{
		value: "spam",
		label: "Spam",
		description: "Repetitive or unwanted content",
	},
	{
		value: "inappropriate",
		label: "Inappropriate Content",
		description: "Offensive or unsuitable material",
	},
	{
		value: "harassment",
		label: "Harassment",
		description: "Bullying or targeting individuals",
	},
	{
		value: "copyright",
		label: "Copyright Violation",
		description: "Unauthorized use of copyrighted material",
	},
	{
		value: "misinformation",
		label: "Misinformation",
		description: "False or misleading information",
	},
	{ value: "other", label: "Other", description: "Other policy violations" },
] as const;

export function ReportModal({
	memeId,
	memeTitle,
	isOpen,
	onClose,
}: ReportModalProps) {
	const [selectedReason, setSelectedReason] = useState<string>("");
	const [description, setDescription] = useState("");
	const [isSubmitting, setIsSubmitting] = useState(false);

	const reportMeme = useMutation(api.reports.reportMeme);

	const handleSubmit = async () => {
		if (!selectedReason) {
			toast.error("Please select a reason for reporting");
			return;
		}

		setIsSubmitting(true);

		try {
			await reportMeme({
				memeId,
				reason: selectedReason as
					| "spam"
					| "inappropriate"
					| "harassment"
					| "copyright"
					| "misinformation"
					| "other",
				description: description.trim() || undefined,
			});

			setSelectedReason("");
			setDescription("");
			onClose();
		} catch (error: unknown) {
			const errorMessage =
				error instanceof Error ? error.message : String(error);
			if (errorMessage.includes("already reported")) {
				toast.error("You have already reported this content");
			} else {
				toast.error("Failed to submit report. Please try again.");
			}
		} finally {
			setIsSubmitting(false);
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
				base: "max-w-[600px] mx-auto !h-[70vh] rounded-t-3xl mb-0 sm:mb-0",
				backdrop: "backdrop-blur-sm bg-black/50",
			}}
			scrollBehavior="inside"
		>
			<ModalContent className="!h-[70vh] bg-gray-50 dark:bg-gray-950">
				<div className="flex flex-col items-center border-gray-200 border-b pt-2 pb-3 dark:border-gray-800">
					<div className="mb-3 h-1 w-10 rounded-full bg-gray-300 dark:bg-gray-700" />
					<h3 className="font-bold text-base text-gray-900 dark:text-gray-100">
						Report Content
					</h3>
				</div>
				<ModalBody className="gap-6 overflow-y-auto px-4 py-6">
					<div>
						<p className="mb-2 text-gray-600 text-sm dark:text-gray-400">
							You're reporting:{" "}
							<span className="font-semibold text-gray-900 dark:text-gray-100">
								"{memeTitle}"
							</span>
						</p>
						<p className="text-gray-500 text-xs">
							Reports help us maintain a safe and respectful community. All
							reports are reviewed by our moderation team.
						</p>
					</div>

					<RadioGroup
						label="Why are you reporting this content?"
						value={selectedReason}
						onValueChange={setSelectedReason}
						isRequired
						classNames={{
							label: "text-gray-900 dark:text-gray-100 font-semibold",
						}}
					>
						{reportReasons.map((reason) => (
							<Radio
								key={reason.value}
								value={reason.value}
								description={reason.description}
							>
								{reason.label}
							</Radio>
						))}
					</RadioGroup>

					<Textarea
						label="Additional details (optional)"
						placeholder="Provide any additional context..."
						value={description}
						onValueChange={setDescription}
						maxLength={500}
						description={`${description.length}/500 characters`}
						classNames={{
							label: "text-gray-900 dark:text-gray-100 font-semibold",
							inputWrapper:
								"bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-800",
						}}
					/>
				</ModalBody>
				<div className="space-y-2 border-gray-200 border-t bg-gray-50 p-4 dark:border-gray-800 dark:bg-gray-950">
					<Button
						color="danger"
						onPress={handleSubmit}
						isLoading={isSubmitting}
						isDisabled={!selectedReason}
						size="lg"
						className="w-full font-bold"
						radius="full"
					>
						{isSubmitting ? "Submitting..." : "Submit Report"}
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
			</ModalContent>
		</Modal>
	);
}
