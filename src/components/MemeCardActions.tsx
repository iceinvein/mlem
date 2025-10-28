import {
	Button,
	Dropdown,
	DropdownItem,
	DropdownMenu,
	DropdownTrigger,
	Modal,
	ModalBody,
	ModalContent,
	ModalFooter,
	ModalHeader,
	Select,
	SelectItem,
	Textarea,
} from "@heroui/react";
import { useMutation } from "convex/react";
import { Flag, MoreVertical, VolumeX } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";

interface MemeCardActionsProps {
	memeId: Id<"memes">;
	authorId?: Id<"users">;
	isOwnMeme: boolean;
	onDelete?: () => void;
}

export function MemeCardActions({
	memeId,
	authorId,
	isOwnMeme,
	onDelete,
}: MemeCardActionsProps) {
	const [showReportMeme, setShowReportMeme] = useState(false);
	const [showReportUser, setShowReportUser] = useState(false);
	const [memeReportReason, setMemeReportReason] = useState<
		| "spam"
		| "inappropriate"
		| "harassment"
		| "copyright"
		| "misinformation"
		| "other"
	>("spam");
	const [userReportReason, setUserReportReason] = useState<
		"spam" | "harassment" | "inappropriate_content" | "impersonation" | "other"
	>("spam");
	const [reportDescription, setReportDescription] = useState("");

	const reportMeme = useMutation(api.reports.reportMeme);
	const reportUser = useMutation(api.userReports.reportUser);
	const muteUser = useMutation(api.userReports.muteUser);

	const handleReportMeme = async () => {
		try {
			await reportMeme({
				memeId,
				reason: memeReportReason,
				description: reportDescription || undefined,
			});
			toast.success("Meme reported successfully");
			setShowReportMeme(false);
			setReportDescription("");
		} catch (error) {
			toast.error(
				error instanceof Error ? error.message : "Failed to report meme",
			);
		}
	};

	const handleReportUser = async () => {
		if (!authorId) return;
		try {
			await reportUser({
				reportedUserId: authorId,
				reason: userReportReason,
				description: reportDescription || undefined,
			});
			toast.success("User reported successfully");
			setShowReportUser(false);
			setReportDescription("");
		} catch (error) {
			toast.error(
				error instanceof Error ? error.message : "Failed to report user",
			);
		}
	};

	const handleMuteUser = async () => {
		if (!authorId) return;
		try {
			await muteUser({ mutedUserId: authorId });
			toast.success("User muted successfully");
		} catch (error) {
			toast.error(
				error instanceof Error ? error.message : "Failed to mute user",
			);
		}
	};

	return (
		<>
			<Dropdown>
				<DropdownTrigger>
					<Button isIconOnly size="sm" variant="light">
						<MoreVertical className="h-4 w-4" />
					</Button>
				</DropdownTrigger>
				<DropdownMenu>
					{!isOwnMeme ? (
						<>
							<DropdownItem
								key="report-meme"
								startContent={<Flag className="h-4 w-4" />}
								onPress={() => setShowReportMeme(true)}
							>
								Report Meme
							</DropdownItem>
							{authorId ? (
								<>
									<DropdownItem
										key="report-user"
										startContent={<Flag className="h-4 w-4" />}
										onPress={() => setShowReportUser(true)}
									>
										Report User
									</DropdownItem>
									<DropdownItem
										key="mute-user"
										startContent={<VolumeX className="h-4 w-4" />}
										onPress={handleMuteUser}
									>
										Mute User
									</DropdownItem>
								</>
							) : null}
						</>
					) : null}
					{isOwnMeme && onDelete ? (
						<DropdownItem
							key="delete"
							className="text-danger"
							color="danger"
							onPress={onDelete}
						>
							Delete Meme
						</DropdownItem>
					) : null}
				</DropdownMenu>
			</Dropdown>

			{/* Report Meme Modal */}
			<Modal
				isOpen={showReportMeme}
				onClose={() => {
					setShowReportMeme(false);
					setReportDescription("");
				}}
			>
				<ModalContent>
					<ModalHeader>Report Meme</ModalHeader>
					<ModalBody>
						<Select
							label="Reason"
							selectedKeys={[memeReportReason]}
							onSelectionChange={(keys) =>
								setMemeReportReason(
									Array.from(keys)[0] as
										| "spam"
										| "inappropriate"
										| "harassment"
										| "copyright"
										| "misinformation"
										| "other",
								)
							}
						>
							<SelectItem key="spam">Spam</SelectItem>
							<SelectItem key="inappropriate">Inappropriate</SelectItem>
							<SelectItem key="harassment">Harassment</SelectItem>
							<SelectItem key="copyright">Copyright Violation</SelectItem>
							<SelectItem key="misinformation">Misinformation</SelectItem>
							<SelectItem key="other">Other</SelectItem>
						</Select>
						<Textarea
							label="Description (optional)"
							placeholder="Provide additional details..."
							value={reportDescription}
							onValueChange={setReportDescription}
							minRows={3}
						/>
					</ModalBody>
					<ModalFooter>
						<Button
							variant="light"
							onPress={() => {
								setShowReportMeme(false);
								setReportDescription("");
							}}
						>
							Cancel
						</Button>
						<Button color="danger" onPress={handleReportMeme}>
							Submit Report
						</Button>
					</ModalFooter>
				</ModalContent>
			</Modal>

			{/* Report User Modal */}
			<Modal
				isOpen={showReportUser}
				onClose={() => {
					setShowReportUser(false);
					setReportDescription("");
				}}
			>
				<ModalContent>
					<ModalHeader>Report User</ModalHeader>
					<ModalBody>
						<Select
							label="Reason"
							selectedKeys={[userReportReason]}
							onSelectionChange={(keys) =>
								setUserReportReason(
									Array.from(keys)[0] as
										| "spam"
										| "harassment"
										| "inappropriate_content"
										| "impersonation"
										| "other",
								)
							}
						>
							<SelectItem key="spam">Spam</SelectItem>
							<SelectItem key="harassment">Harassment</SelectItem>
							<SelectItem key="inappropriate_content">
								Inappropriate Content
							</SelectItem>
							<SelectItem key="impersonation">Impersonation</SelectItem>
							<SelectItem key="other">Other</SelectItem>
						</Select>
						<Textarea
							label="Description (optional)"
							placeholder="Provide additional details..."
							value={reportDescription}
							onValueChange={setReportDescription}
							minRows={3}
						/>
					</ModalBody>
					<ModalFooter>
						<Button
							variant="light"
							onPress={() => {
								setShowReportUser(false);
								setReportDescription("");
							}}
						>
							Cancel
						</Button>
						<Button color="danger" onPress={handleReportUser}>
							Submit Report
						</Button>
					</ModalFooter>
				</ModalContent>
			</Modal>
		</>
	);
}
