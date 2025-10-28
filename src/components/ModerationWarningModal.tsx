import {
	Button,
	Chip,
	Modal,
	ModalBody,
	ModalContent,
	ModalFooter,
} from "@heroui/react";
import { useMutation, useQuery } from "convex/react";
import { AlertTriangle } from "lucide-react";
import { useEffect, useState } from "react";
import { api } from "../../convex/_generated/api";

export function ModerationWarningModal() {
	const activeWarnings = useQuery(api.moderation.getMyActiveWarnings);
	const markWarningsAsSeen = useMutation(api.moderation.markWarningsAsSeen);
	const [isOpen, setIsOpen] = useState(false);

	useEffect(() => {
		if (!activeWarnings) return;

		// Check if there are any unseen warnings
		const unseenWarnings = activeWarnings.filter(
			(warning) => !warning.seenByUser,
		);

		if (unseenWarnings.length > 0) {
			setIsOpen(true);
		}
	}, [activeWarnings]);

	const handleClose = async () => {
		if (!activeWarnings) return;

		const unseenWarningIds = activeWarnings
			.filter((warning) => !warning.seenByUser)
			.map((warning) => warning._id);

		if (unseenWarningIds.length > 0) {
			await markWarningsAsSeen({ warningIds: unseenWarningIds });
		}

		setIsOpen(false);
	};

	if (!activeWarnings) return null;

	const unseenWarnings = activeWarnings.filter(
		(warning) => !warning.seenByUser,
	);

	if (unseenWarnings.length === 0) return null;

	return (
		<Modal
			isOpen={isOpen}
			onClose={handleClose}
			placement="center"
			backdrop="blur"
			classNames={{
				base: "max-w-[500px]",
				backdrop: "backdrop-blur-sm bg-black/50",
			}}
		>
			<ModalContent className="bg-gray-50 dark:bg-gray-950">
				<div className="flex flex-col items-center border-gray-200 border-b pt-6 pb-4 dark:border-gray-800">
					<div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-red-100 dark:bg-red-950">
						<AlertTriangle className="h-6 w-6 text-red-600 dark:text-red-500" />
					</div>
					<h3 className="font-bold text-gray-900 text-xl dark:text-gray-100">
						Moderation Notice
					</h3>
					<p className="mt-1 text-center text-gray-600 text-sm dark:text-gray-400">
						You have received {unseenWarnings.length} moderation{" "}
						{unseenWarnings.length === 1 ? "action" : "actions"}
					</p>
				</div>

				<ModalBody className="px-6 py-6">
					<div className="space-y-4">
						{unseenWarnings.map((warning) => (
							<div
								key={warning._id}
								className={`rounded-lg border p-4 ${
									warning.actionType === "warning"
										? "border-yellow-200 bg-yellow-50 dark:border-yellow-900/50 dark:bg-yellow-950/30"
										: warning.actionType === "strike"
											? "border-orange-200 bg-orange-50 dark:border-orange-900/50 dark:bg-orange-950/30"
											: warning.actionType === "mute"
												? "border-red-200 bg-red-50 dark:border-red-900/50 dark:bg-red-950/30"
												: "border-red-300 bg-red-100 dark:border-red-900/50 dark:bg-red-950/40"
								}`}
							>
								<div className="mb-2 flex items-center gap-2">
									<Chip
										size="sm"
										color={
											warning.actionType === "warning"
												? "warning"
												: warning.actionType === "strike"
													? "danger"
													: "danger"
										}
										variant="flat"
									>
										{warning.actionType === "warning"
											? "Warning"
											: warning.actionType === "strike"
												? "Strike"
												: warning.actionType === "mute"
													? "Muted"
													: "Suspended"}
									</Chip>
									<span
										className={`text-xs ${
											warning.actionType === "warning"
												? "text-yellow-700 dark:text-yellow-400"
												: warning.actionType === "strike"
													? "text-orange-700 dark:text-orange-400"
													: "text-red-700 dark:text-red-400"
										}`}
									>
										{new Date(warning._creationTime).toLocaleDateString()}
									</span>
								</div>
								<p
									className={`font-semibold text-sm ${
										warning.actionType === "warning"
											? "text-yellow-900 dark:text-yellow-200"
											: warning.actionType === "strike"
												? "text-orange-900 dark:text-orange-200"
												: "text-red-900 dark:text-red-200"
									}`}
								>
									{warning.reason}
								</p>
								{warning.notes && (
									<p
										className={`mt-2 text-xs ${
											warning.actionType === "warning"
												? "text-yellow-700 dark:text-yellow-400"
												: warning.actionType === "strike"
													? "text-orange-700 dark:text-orange-400"
													: "text-red-700 dark:text-red-400"
										}`}
									>
										{warning.notes}
									</p>
								)}
								{warning.actionType === "suspend" && warning.expiresAt && (
									<p className="mt-2 font-medium text-red-700 text-xs dark:text-red-400">
										Expires: {new Date(warning.expiresAt).toLocaleDateString()}
									</p>
								)}
								{warning.actionType === "suspend" && !warning.expiresAt && (
									<p className="mt-2 font-medium text-red-700 text-xs dark:text-red-400">
										Suspended indefinitely
									</p>
								)}
								{warning.actionType === "mute" && (
									<p className="mt-2 font-medium text-red-700 text-xs dark:text-red-400">
										You cannot post or comment while muted
									</p>
								)}
							</div>
						))}
					</div>

					<div className="mt-4 rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
						<p className="text-gray-700 text-sm dark:text-gray-300">
							Please review our community guidelines to avoid future moderation
							actions. Repeated violations may result in more severe
							consequences.
						</p>
					</div>
				</ModalBody>

				<ModalFooter className="border-gray-200 border-t bg-gray-50 p-4 dark:border-gray-800 dark:bg-gray-950">
					<Button
						color="primary"
						onPress={handleClose}
						size="lg"
						className="w-full"
						radius="full"
					>
						I Understand
					</Button>
				</ModalFooter>
			</ModalContent>
		</Modal>
	);
}
