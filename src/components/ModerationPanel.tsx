import {
	Avatar,
	Button,
	Card,
	CardBody,
	Chip,
	Modal,
	ModalBody,
	ModalContent,
	Select,
	SelectItem,
	Spinner,
	Textarea,
} from "@heroui/react";
import { useMutation, useQuery } from "convex/react";
import { AlertTriangle, Eye, Shield, User } from "lucide-react";
import { useState } from "react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";

export function ModerationPanel() {
	const [selectedTab, setSelectedTab] = useState<
		"user-reports" | "meme-reports"
	>("user-reports");
	const [selectedUserId, setSelectedUserId] = useState<Id<"users"> | null>(
		null,
	);
	const [selectedReportId, setSelectedReportId] =
		useState<Id<"userReports"> | null>(null);
	const [showUserDetails, setShowUserDetails] = useState(false);
	const [moderatorNotes, setModeratorNotes] = useState("");
	const [actionTaken, setActionTaken] = useState<
		"none" | "warning" | "user_muted" | "user_suspended"
	>("none");
	const [showModerationModal, setShowModerationModal] = useState(false);
	const [selectedUserForModeration, setSelectedUserForModeration] =
		useState<Id<"users"> | null>(null);
	const [moderationAction, setModerationAction] = useState<
		"warning" | "strike" | "mute" | "suspend"
	>("warning");
	const [suspensionDuration, setSuspensionDuration] = useState<
		"7_days" | "30_days" | "90_days" | "indefinite"
	>("7_days");
	const [moderationReason, setModerationReason] = useState("");

	const reportedUsers = useQuery(api.userReports.getReportedUsers);
	const userReports = useQuery(api.userReports.getUserReports, {});
	const memeReports = useQuery(api.reports.getReports, {});
	const usersModerationStatus = useQuery(
		api.moderation.getUsersModerationStatus,
		reportedUsers ? { userIds: reportedUsers.map((u) => u.userId) } : "skip",
	);
	const userMemes = useQuery(
		api.users.getUserMemes,
		selectedUserId ? { userId: selectedUserId } : "skip",
	);
	const userProfile = useQuery(
		api.users.getUserProfile,
		selectedUserId ? { userId: selectedUserId } : "skip",
	);

	const updateUserReport = useMutation(api.userReports.updateUserReportStatus);
	const updateMemeReport = useMutation(api.reports.updateReportStatus);
	const issueWarning = useMutation(api.moderation.issueWarning);
	const issueStrike = useMutation(api.moderation.issueStrike);
	const muteUserMutation = useMutation(api.moderation.muteUser);
	const suspendUserMutation = useMutation(api.moderation.suspendUser);
	const unmuteUserMutation = useMutation(api.moderation.unmuteUser);
	const unsuspendUserMutation = useMutation(api.moderation.unsuspendUser);
	const userModerationStatus = useQuery(
		api.moderation.getUserModerationStatus,
		selectedUserForModeration ? { userId: selectedUserForModeration } : "skip",
	);
	const userModerationHistory = useQuery(
		api.moderation.getUserModerationHistory,
		selectedUserForModeration ? { userId: selectedUserForModeration } : "skip",
	);

	const handleUpdateUserReport = async (
		reportId: Id<"userReports">,
		status: "pending" | "reviewed" | "resolved" | "dismissed",
	) => {
		try {
			await updateUserReport({
				reportId,
				status,
				moderatorNotes: moderatorNotes || undefined,
				actionTaken: actionTaken !== "none" ? actionTaken : undefined,
			});
			setSelectedReportId(null);
			setModeratorNotes("");
			setActionTaken("none");
		} catch (error) {
			console.error("Failed to update report:", error);
		}
	};

	const handleUpdateMemeReport = async (
		reportId: Id<"reports">,
		status: "pending" | "reviewed" | "resolved" | "dismissed",
		action?:
			| "none"
			| "warning"
			| "content_removed"
			| "user_suspended"
			| undefined,
	) => {
		try {
			await updateMemeReport({
				reportId,
				status,
				moderatorNotes: moderatorNotes || undefined,
				actionTaken: action,
			});
			setSelectedReportId(null);
			setModeratorNotes("");
		} catch (error) {
			console.error("Failed to update report:", error);
		}
	};

	return (
		<div className="mx-auto max-w-[600px] animate-fade-in px-4 py-6">
			<div className="mb-6 flex items-center gap-3">
				<Shield className="h-8 w-8 text-blue-600 dark:text-blue-400" />
				<h1 className="font-black text-3xl text-gray-900 dark:text-white">
					Moderation
				</h1>
			</div>

			{/* Tab Navigation */}
			<div className="mb-6">
				<div className="scrollbar-hide flex gap-2 overflow-x-auto pb-2">
					<Chip
						onClick={() => setSelectedTab("user-reports")}
						className={`shrink-0 cursor-pointer transition-all ${
							selectedTab === "user-reports"
								? "bg-gray-900 font-bold text-white dark:bg-gray-100 dark:text-gray-900"
								: "bg-gray-100 text-gray-700 dark:bg-gray-900 dark:text-gray-300"
						}`}
						radius="full"
					>
						User Reports
					</Chip>
					<Chip
						onClick={() => setSelectedTab("meme-reports")}
						className={`shrink-0 cursor-pointer transition-all ${
							selectedTab === "meme-reports"
								? "bg-gray-900 font-bold text-white dark:bg-gray-100 dark:text-gray-900"
								: "bg-gray-100 text-gray-700 dark:bg-gray-900 dark:text-gray-300"
						}`}
						radius="full"
					>
						Meme Reports
					</Chip>
				</div>
			</div>

			{/* Tab Content */}

			{selectedTab === "user-reports" && (
				<div>
					<Card className="border border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-gray-900">
						<CardBody>
							{!reportedUsers || !userReports ? (
								<div className="flex justify-center py-8">
									<Spinner />
								</div>
							) : reportedUsers.length === 0 ? (
								<div className="py-8 text-center text-gray-500 dark:text-gray-400">
									No user reports
								</div>
							) : (
								<div className="space-y-4">
									{reportedUsers.map((item) => {
										// Get reports for this user
										const userReportsForUser = userReports.filter(
											(r) => r.reportedUserId === item.userId,
										);
										const latestReport = userReportsForUser[0];

										return (
											<Card
												key={item.userId}
												className="border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800"
											>
												<CardBody>
													<div className="space-y-3">
														{/* User Header */}
														<div className="flex items-start justify-between">
															<div className="flex items-center gap-3">
																<Avatar
																	name={
																		item.user?.name?.[0] ||
																		item.user?.email?.[0] ||
																		"?"
																	}
																	size="md"
																	className="bg-gray-900 dark:bg-gray-100"
																/>
																<div>
																	<div className="flex items-center gap-2">
																		<p className="font-bold text-gray-900 dark:text-gray-100">
																			{item.user?.name ||
																				item.user?.email ||
																				"Unknown User"}
																		</p>
																		<Chip
																			size="sm"
																			color="danger"
																			variant="flat"
																		>
																			{item.reportCount} reports
																		</Chip>
																		{item.pendingReports > 0 && (
																			<Chip
																				size="sm"
																				color="warning"
																				variant="flat"
																			>
																				{item.pendingReports} pending
																			</Chip>
																		)}
																	</div>
																	<p className="text-gray-500 text-sm dark:text-gray-400">
																		Member since{" "}
																		{item.user
																			? new Date(
																					item.user._creationTime,
																				).toLocaleDateString()
																			: "Unknown"}
																	</p>
																	{/* Moderation Status Indicators */}
																	{usersModerationStatus && (
																		<div className="mt-2 flex flex-wrap gap-1">
																			{(() => {
																				const status =
																					usersModerationStatus.find(
																						(s) => s.userId === item.userId,
																					)?.status;
																				if (!status) return null;

																				return (
																					<>
																						{status.warningCount > 0 && (
																							<Chip
																								size="sm"
																								color="warning"
																								variant="bordered"
																								startContent={
																									<AlertTriangle className="h-3 w-3" />
																								}
																							>
																								{status.warningCount} warning
																								{status.warningCount > 1
																									? "s"
																									: ""}
																							</Chip>
																						)}
																						{status.strikeCount > 0 && (
																							<Chip
																								size="sm"
																								color="danger"
																								variant="bordered"
																								startContent={
																									<Shield className="h-3 w-3" />
																								}
																							>
																								{status.strikeCount}/2 strikes
																							</Chip>
																						)}
																						{status.isMuted && (
																							<Chip
																								size="sm"
																								color="danger"
																								variant="flat"
																							>
																								MUTED
																							</Chip>
																						)}
																						{status.isSuspended && (
																							<Chip
																								size="sm"
																								color="danger"
																								variant="solid"
																							>
																								SUSPENDED
																								{status.suspendedUntil &&
																									` until ${new Date(status.suspendedUntil).toLocaleDateString()}`}
																							</Chip>
																						)}
																					</>
																				);
																			})()}
																		</div>
																	)}
																</div>
															</div>
														</div>

														{/* Latest Report Preview */}
														{latestReport && (
															<div className="rounded-lg border border-gray-200 bg-gray-50 p-3 dark:border-gray-700 dark:bg-gray-900">
																<div className="mb-2 flex items-center gap-2">
																	<AlertTriangle className="h-4 w-4 text-orange-500" />
																	<p className="font-semibold text-gray-900 text-sm dark:text-gray-100">
																		Latest Report
																	</p>
																	<Chip
																		size="sm"
																		color={
																			latestReport.status === "pending"
																				? "warning"
																				: latestReport.status === "resolved"
																					? "success"
																					: "default"
																		}
																	>
																		{latestReport.status
																			.charAt(0)
																			.toUpperCase() +
																			latestReport.status.slice(1)}
																	</Chip>
																</div>
																<p className="text-gray-600 text-sm dark:text-gray-400">
																	<span className="font-medium">Reason:</span>{" "}
																	{latestReport.reason.replace(/_/g, " ")}
																</p>
																{latestReport.description && (
																	<p className="mt-1 text-gray-600 text-sm dark:text-gray-400">
																		"{latestReport.description}"
																	</p>
																)}
																<p className="mt-1 text-gray-500 text-xs dark:text-gray-500">
																	Reported by{" "}
																	{latestReport.reporter?.name ||
																		latestReport.reporter?.email ||
																		"Unknown"}{" "}
																	on{" "}
																	{new Date(
																		latestReport._creationTime,
																	).toLocaleDateString()}
																</p>
															</div>
														)}

														{/* Action Buttons */}
														<div className="flex gap-2">
															<Button
																size="sm"
																variant="flat"
																startContent={<Eye className="h-4 w-4" />}
																onPress={() => {
																	setSelectedUserId(item.userId);
																	setShowUserDetails(true);
																}}
																className="bg-gray-100 dark:bg-gray-800"
															>
																View Details
															</Button>
															<Button
																size="sm"
																color="warning"
																variant="flat"
																startContent={<Shield className="h-4 w-4" />}
																onPress={() => {
																	setSelectedUserForModeration(item.userId);
																	setShowModerationModal(true);
																	setModerationReason("");
																	setModeratorNotes("");
																}}
															>
																Moderate
															</Button>
															{item.pendingReports > 0 && (
																<Button
																	size="sm"
																	color="primary"
																	variant="flat"
																	onPress={() => {
																		const pendingReport =
																			userReportsForUser.find(
																				(r) => r.status === "pending",
																			);
																		if (pendingReport) {
																			setSelectedReportId(pendingReport._id);
																			setModeratorNotes("");
																			setActionTaken("none");
																		}
																	}}
																>
																	Review Reports
																</Button>
															)}
														</div>
													</div>
												</CardBody>
											</Card>
										);
									})}
								</div>
							)}
						</CardBody>
					</Card>
				</div>
			)}

			{selectedTab === "meme-reports" && (
				<div>
					<Card className="border border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-gray-900">
						<CardBody>
							{!memeReports ? (
								<div className="flex justify-center py-8">
									<Spinner />
								</div>
							) : memeReports.length === 0 ? (
								<div className="py-8 text-center text-gray-500 dark:text-gray-400">
									No meme reports
								</div>
							) : (
								<div className="space-y-4">
									{memeReports.map((report) => (
										<Card
											key={report._id}
											className="border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800"
										>
											<CardBody>
												<div className="space-y-3">
													<div className="flex items-start justify-between">
														<div>
															<p className="font-semibold">
																Report for meme:{" "}
																{report.meme?.title || "Unknown"}
															</p>
															<p className="text-gray-500 text-sm">
																Reason: {report.reason}
															</p>
															{report.description && (
																<p className="mt-1 text-gray-600 text-sm">
																	"{report.description}"
																</p>
															)}
														</div>
														<Chip
															size="sm"
															color={
																report.status === "pending"
																	? "warning"
																	: report.status === "resolved"
																		? "success"
																		: "default"
															}
														>
															{report.status.charAt(0).toUpperCase() +
																report.status.slice(1)}
														</Chip>
													</div>

													{report.status === "pending" && (
														<div className="flex gap-2">
															<Button
																size="sm"
																color="success"
																variant="flat"
																onPress={() =>
																	handleUpdateMemeReport(
																		report._id,
																		"resolved",
																		"none",
																	)
																}
															>
																Resolve
															</Button>
															<Button
																size="sm"
																color="danger"
																variant="flat"
																onPress={() =>
																	handleUpdateMemeReport(
																		report._id,
																		"resolved",
																		"content_removed",
																	)
																}
															>
																Remove Content
															</Button>
														</div>
													)}
												</div>
											</CardBody>
										</Card>
									))}
								</div>
							)}
						</CardBody>
					</Card>
				</div>
			)}

			{/* User Details Modal */}
			<Modal
				isOpen={showUserDetails && selectedUserId !== null}
				onClose={() => {
					setShowUserDetails(false);
					setSelectedUserId(null);
				}}
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
					<div className="flex flex-col items-center border-gray-200 border-b pt-2 pb-3 dark:border-gray-800">
						<div className="mb-3 h-1 w-10 rounded-full bg-gray-300 dark:bg-gray-700" />
						<div className="flex items-center gap-2">
							<User className="h-5 w-5 text-gray-600 dark:text-gray-400" />
							<h3 className="font-bold text-base text-gray-900 dark:text-gray-100">
								User Details
							</h3>
						</div>
						<p className="mt-1 text-gray-500 text-sm dark:text-gray-400">
							{userProfile?.name || userProfile?.email || "Unknown User"}
						</p>
					</div>

					<ModalBody className="px-4 py-6">
						{/* Moderation Status Summary */}
						{selectedUserId && usersModerationStatus && (
							<div className="mb-6">
								{(() => {
									const status = usersModerationStatus.find(
										(s) => s.userId === selectedUserId,
									)?.status;
									if (!status) return null;

									const hasAnyStatus =
										status.warningCount > 0 ||
										status.strikeCount > 0 ||
										status.isMuted ||
										status.isSuspended;

									if (!hasAnyStatus) return null;

									return (
										<Card className="border border-orange-200 bg-orange-50 dark:border-orange-900/50 dark:bg-orange-950/30">
											<CardBody className="p-4">
												<div className="mb-2 flex items-center gap-2">
													<Shield className="h-5 w-5 text-orange-600 dark:text-orange-500" />
													<h4 className="font-bold text-gray-900 dark:text-gray-100">
														Moderation Status
													</h4>
												</div>
												<div className="flex flex-wrap gap-2">
													{status.warningCount > 0 && (
														<Chip
															size="sm"
															color="warning"
															variant="flat"
															startContent={
																<AlertTriangle className="h-3 w-3" />
															}
														>
															{status.warningCount} warning
															{status.warningCount > 1 ? "s" : ""}
														</Chip>
													)}
													{status.strikeCount > 0 && (
														<Chip
															size="sm"
															color="danger"
															variant="flat"
															startContent={<Shield className="h-3 w-3" />}
														>
															{status.strikeCount}/2 strikes
														</Chip>
													)}
													{status.isMuted && (
														<Chip size="sm" color="danger" variant="solid">
															MUTED
														</Chip>
													)}
													{status.isSuspended && (
														<Chip size="sm" color="danger" variant="solid">
															SUSPENDED
															{status.suspendedUntil &&
																` until ${new Date(status.suspendedUntil).toLocaleDateString()}`}
														</Chip>
													)}
												</div>
												{(status.lastWarningAt || status.lastStrikeAt) && (
													<p className="mt-2 text-gray-600 text-xs dark:text-gray-400">
														Last action:{" "}
														{new Date(
															Math.max(
																status.lastWarningAt || 0,
																status.lastStrikeAt || 0,
															),
														).toLocaleDateString()}
													</p>
												)}
											</CardBody>
										</Card>
									);
								})()}
							</div>
						)}

						{/* All Reports for this User */}
						<div className="mb-6">
							<h4 className="mb-3 font-bold text-gray-900 dark:text-gray-100">
								Reports (
								{userReports?.filter((r) => r.reportedUserId === selectedUserId)
									.length || 0}
								)
							</h4>
							{userReports &&
							userReports.filter((r) => r.reportedUserId === selectedUserId)
								.length > 0 ? (
								<div className="space-y-3">
									{userReports
										.filter((r) => r.reportedUserId === selectedUserId)
										.map((report) => (
											<Card
												key={report._id}
												className="border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800"
											>
												<CardBody className="p-3">
													<div className="flex items-start justify-between">
														<div className="flex-1">
															<div className="mb-1 flex items-center gap-2">
																<Chip
																	size="sm"
																	color={
																		report.status === "pending"
																			? "warning"
																			: report.status === "resolved"
																				? "success"
																				: "default"
																	}
																>
																	{report.status.charAt(0).toUpperCase() +
																		report.status.slice(1)}
																</Chip>
																<span className="text-gray-500 text-xs dark:text-gray-400">
																	{new Date(
																		report._creationTime,
																	).toLocaleDateString()}
																</span>
															</div>
															<p className="text-gray-900 text-sm dark:text-gray-100">
																<span className="font-medium">Reason:</span>{" "}
																{report.reason.replace(/_/g, " ")}
															</p>
															{report.description && (
																<p className="mt-1 text-gray-600 text-sm dark:text-gray-400">
																	"{report.description}"
																</p>
															)}
															<p className="mt-1 text-gray-500 text-xs dark:text-gray-500">
																By{" "}
																{report.reporter?.name ||
																	report.reporter?.email ||
																	"Unknown"}
															</p>
														</div>
													</div>
												</CardBody>
											</Card>
										))}
								</div>
							) : (
								<p className="text-gray-500 text-sm dark:text-gray-400">
									No reports found
								</p>
							)}
						</div>

						{/* User Posts */}
						<div>
							<h4 className="mb-3 font-bold text-gray-900 dark:text-gray-100">
								Posts ({userMemes?.length || 0})
							</h4>
							{!userMemes ? (
								<div className="flex justify-center py-8">
									<Spinner />
								</div>
							) : userMemes.length === 0 ? (
								<div className="py-8 text-center text-gray-500 dark:text-gray-400">
									No posts found
								</div>
							) : (
								<div className="grid grid-cols-2 gap-4">
									{userMemes.map((meme) => (
										<Card
											key={meme._id}
											className="border border-gray-200 dark:border-gray-800"
										>
											<CardBody className="p-0">
												<img
													src={meme.imageUrl}
													alt={meme.title}
													className="h-48 w-full object-cover"
												/>
												<div className="p-3">
													<p className="font-semibold text-gray-900 text-sm dark:text-gray-100">
														{meme.title}
													</p>
													<div className="mt-2 flex gap-4 text-gray-500 text-xs dark:text-gray-400">
														<span>❤️ {meme.likes}</span>
														<span>💬 {meme.comments}</span>
														<span>🔗 {meme.shares}</span>
													</div>
												</div>
											</CardBody>
										</Card>
									))}
								</div>
							)}
						</div>
					</ModalBody>

					{/* Footer */}
					<div className="border-gray-200 border-t bg-gray-50 p-4 dark:border-gray-800 dark:bg-gray-950">
						<Button
							variant="flat"
							onPress={() => {
								setShowUserDetails(false);
								setSelectedUserId(null);
							}}
							size="lg"
							className="w-full bg-gray-100 dark:bg-gray-800"
							radius="full"
						>
							Close
						</Button>
					</div>
				</ModalContent>
			</Modal>

			{/* Review Report Modal */}
			<Modal
				isOpen={selectedReportId !== null}
				onClose={() => {
					setSelectedReportId(null);
					setModeratorNotes("");
					setActionTaken("none");
				}}
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
					base: "max-w-[600px] mx-auto h-[70vh]! rounded-t-3xl mb-0 sm:mb-0",
					backdrop: "backdrop-blur-sm bg-black/50",
				}}
				scrollBehavior="inside"
			>
				<ModalContent className="h-[70vh]! bg-gray-50 dark:bg-gray-950">
					{/* Header with drag indicator */}
					<div className="flex flex-col items-center border-gray-200 border-b pt-2 pb-3 dark:border-gray-800">
						<div className="mb-3 h-1 w-10 rounded-full bg-gray-300 dark:bg-gray-700" />
						<h3 className="font-bold text-base text-gray-900 dark:text-gray-100">
							Review Report
						</h3>
					</div>

					<ModalBody className="px-4 py-6">
						<div className="space-y-4">
							<Textarea
								label="Moderator Notes"
								description="Required when dismissing a report"
								placeholder="Add notes about your decision..."
								value={moderatorNotes}
								onValueChange={setModeratorNotes}
								minRows={4}
								classNames={{
									inputWrapper: "bg-white dark:bg-gray-900",
								}}
							/>
							<Select
								label="Action Taken"
								selectedKeys={[actionTaken]}
								onSelectionChange={(keys) =>
									setActionTaken(
										Array.from(keys)[0] as
											| "none"
											| "warning"
											| "user_muted"
											| "user_suspended",
									)
								}
								classNames={{
									trigger: "bg-white dark:bg-gray-900",
								}}
							>
								<SelectItem key="none">No Action</SelectItem>
								<SelectItem key="warning">Warning</SelectItem>
								<SelectItem key="user_muted">Mute User</SelectItem>
								<SelectItem key="user_suspended">Suspend User</SelectItem>
							</Select>
						</div>
					</ModalBody>

					{/* Footer */}
					<div className="border-gray-200 border-t bg-gray-50 p-4 dark:border-gray-800 dark:bg-gray-950">
						<div className="flex gap-2">
							<Button
								variant="flat"
								onPress={() => {
									setSelectedReportId(null);
									setModeratorNotes("");
									setActionTaken("none");
								}}
								size="lg"
								className="flex-1 bg-gray-100 dark:bg-gray-800"
								radius="full"
							>
								Cancel
							</Button>
							<Button
								variant="flat"
								onPress={() => {
									if (selectedReportId && moderatorNotes.trim()) {
										handleUpdateUserReport(selectedReportId, "dismissed");
									}
								}}
								isDisabled={!moderatorNotes.trim()}
								size="lg"
								className="flex-1 bg-gray-100 dark:bg-gray-800"
								radius="full"
							>
								Dismiss
							</Button>
							<Button
								color="success"
								onPress={() => {
									if (selectedReportId) {
										handleUpdateUserReport(selectedReportId, "resolved");
									}
								}}
								size="lg"
								className="flex-1"
								radius="full"
							>
								Resolve
							</Button>
						</div>
					</div>
				</ModalContent>
			</Modal>

			{/* Moderation Action Modal */}
			<Modal
				isOpen={showModerationModal && selectedUserForModeration !== null}
				onClose={() => {
					setShowModerationModal(false);
					setSelectedUserForModeration(null);
					setModerationReason("");
					setModeratorNotes("");
				}}
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
					<div className="flex flex-col items-center border-gray-200 border-b pt-2 pb-3 dark:border-gray-800">
						<div className="mb-3 h-1 w-10 rounded-full bg-gray-300 dark:bg-gray-700" />
						<div className="flex items-center gap-2">
							<Shield className="h-5 w-5 text-orange-600 dark:text-orange-400" />
							<h3 className="font-bold text-base text-gray-900 dark:text-gray-100">
								Moderation Actions
							</h3>
						</div>
					</div>

					<ModalBody className="px-4 py-6">
						<div className="space-y-6">
							{/* Current Status */}
							{userModerationStatus && (
								<Card className="border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
									<CardBody className="p-4">
										<h4 className="mb-3 font-bold text-gray-900 dark:text-gray-100">
											Current Status
										</h4>
										<div className="space-y-2 text-sm">
											<div className="flex justify-between">
												<span className="text-gray-600 dark:text-gray-400">
													Warnings:
												</span>
												<span className="font-semibold text-gray-900 dark:text-gray-100">
													{userModerationStatus.warningCount}
												</span>
											</div>
											<div className="flex justify-between">
												<span className="text-gray-600 dark:text-gray-400">
													Strikes:
												</span>
												<span className="font-semibold text-gray-900 dark:text-gray-100">
													{userModerationStatus.strikeCount} / 2
												</span>
											</div>
											<div className="flex justify-between">
												<span className="text-gray-600 dark:text-gray-400">
													Muted:
												</span>
												<Chip
													size="sm"
													color={
														userModerationStatus.isMuted ? "danger" : "success"
													}
												>
													{userModerationStatus.isMuted ? "Yes" : "No"}
												</Chip>
											</div>
											<div className="flex justify-between">
												<span className="text-gray-600 dark:text-gray-400">
													Suspended:
												</span>
												<Chip
													size="sm"
													color={
														userModerationStatus.isSuspended
															? "danger"
															: "success"
													}
												>
													{userModerationStatus.isSuspended ? "Yes" : "No"}
												</Chip>
											</div>
											{userModerationStatus.suspendedUntil && (
												<div className="flex justify-between">
													<span className="text-gray-600 dark:text-gray-400">
														Suspended Until:
													</span>
													<span className="font-semibold text-gray-900 dark:text-gray-100">
														{new Date(
															userModerationStatus.suspendedUntil,
														).toLocaleDateString()}
													</span>
												</div>
											)}
										</div>

										{/* Quick Actions */}
										<div className="mt-4 flex gap-2">
											{userModerationStatus.isMuted && (
												<Button
													size="sm"
													color="success"
													variant="flat"
													onPress={async () => {
														if (selectedUserForModeration) {
															await unmuteUserMutation({
																userId: selectedUserForModeration,
															});
														}
													}}
												>
													Unmute
												</Button>
											)}
											{userModerationStatus.isSuspended && (
												<Button
													size="sm"
													color="success"
													variant="flat"
													onPress={async () => {
														if (selectedUserForModeration) {
															await unsuspendUserMutation({
																userId: selectedUserForModeration,
															});
														}
													}}
												>
													Unsuspend
												</Button>
											)}
										</div>
									</CardBody>
								</Card>
							)}

							{/* Action Selection */}
							<div className="space-y-4">
								<Select
									label="Moderation Action"
									selectedKeys={[moderationAction]}
									onSelectionChange={(keys) =>
										setModerationAction(
											Array.from(keys)[0] as
												| "warning"
												| "strike"
												| "mute"
												| "suspend",
										)
									}
									classNames={{
										trigger: "bg-white dark:bg-gray-900",
									}}
								>
									<SelectItem key="warning">
										Warning (Notification only)
									</SelectItem>
									<SelectItem key="strike">
										Strike (2 strikes system)
									</SelectItem>
									<SelectItem key="mute">
										Mute (Can't post or comment)
									</SelectItem>
									<SelectItem key="suspend">
										Suspend (Full account suspension)
									</SelectItem>
								</Select>

								{moderationAction === "suspend" && (
									<Select
										label="Suspension Duration"
										selectedKeys={[suspensionDuration]}
										onSelectionChange={(keys) =>
											setSuspensionDuration(
												Array.from(keys)[0] as
													| "7_days"
													| "30_days"
													| "90_days"
													| "indefinite",
											)
										}
										classNames={{
											trigger: "bg-white dark:bg-gray-900",
										}}
									>
										<SelectItem key="7_days">7 Days</SelectItem>
										<SelectItem key="30_days">30 Days</SelectItem>
										<SelectItem key="90_days">90 Days</SelectItem>
										<SelectItem key="indefinite">Indefinite</SelectItem>
									</Select>
								)}

								<Textarea
									label="Reason"
									placeholder="Explain the reason for this action..."
									value={moderationReason}
									onValueChange={setModerationReason}
									minRows={3}
									isRequired
									classNames={{
										inputWrapper: "bg-white dark:bg-gray-900",
									}}
								/>

								<Textarea
									label="Additional Notes (Optional)"
									placeholder="Add any additional context..."
									value={moderatorNotes}
									onValueChange={setModeratorNotes}
									minRows={2}
									classNames={{
										inputWrapper: "bg-white dark:bg-gray-900",
									}}
								/>
							</div>

							{/* History */}
							{userModerationHistory && userModerationHistory.length > 0 && (
								<div>
									<h4 className="mb-3 font-bold text-gray-900 dark:text-gray-100">
										Moderation History
									</h4>
									<div className="space-y-2">
										{userModerationHistory.slice(0, 5).map((action) => (
											<Card
												key={action._id}
												className="border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800"
											>
												<CardBody className="p-3">
													<div className="flex items-start justify-between">
														<div className="flex-1">
															<div className="mb-1 flex items-center gap-2">
																<Chip
																	size="sm"
																	color={
																		action.actionType === "warning"
																			? "warning"
																			: action.actionType === "strike"
																				? "danger"
																				: "default"
																	}
																>
																	{action.actionType.toUpperCase()}
																</Chip>
																<span className="text-gray-500 text-xs dark:text-gray-400">
																	{new Date(
																		action._creationTime,
																	).toLocaleDateString()}
																</span>
															</div>
															<p className="text-gray-900 text-sm dark:text-gray-100">
																{action.reason}
															</p>
															<p className="mt-1 text-gray-500 text-xs dark:text-gray-500">
																By{" "}
																{action.moderator?.name ||
																	action.moderator?.email ||
																	"Unknown"}
															</p>
														</div>
													</div>
												</CardBody>
											</Card>
										))}
									</div>
								</div>
							)}
						</div>
					</ModalBody>

					<div className="border-gray-200 border-t bg-gray-50 p-4 dark:border-gray-800 dark:bg-gray-950">
						<div className="flex gap-2">
							<Button
								variant="flat"
								onPress={() => {
									setShowModerationModal(false);
									setSelectedUserForModeration(null);
									setModerationReason("");
									setModeratorNotes("");
								}}
								size="lg"
								className="flex-1 bg-gray-100 dark:bg-gray-800"
								radius="full"
							>
								Cancel
							</Button>
							<Button
								color="danger"
								onPress={async () => {
									if (!selectedUserForModeration || !moderationReason.trim()) {
										return;
									}

									try {
										switch (moderationAction) {
											case "warning":
												await issueWarning({
													userId: selectedUserForModeration,
													reason: moderationReason,
													notes: moderatorNotes || undefined,
												});
												break;
											case "strike":
												await issueStrike({
													userId: selectedUserForModeration,
													reason: moderationReason,
													notes: moderatorNotes || undefined,
												});
												break;
											case "mute":
												await muteUserMutation({
													userId: selectedUserForModeration,
													reason: moderationReason,
													notes: moderatorNotes || undefined,
												});
												break;
											case "suspend":
												await suspendUserMutation({
													userId: selectedUserForModeration,
													reason: moderationReason,
													duration: suspensionDuration,
													notes: moderatorNotes || undefined,
												});
												break;
										}

										setShowModerationModal(false);
										setSelectedUserForModeration(null);
										setModerationReason("");
										setModeratorNotes("");
									} catch (error) {
										console.error("Failed to apply moderation action:", error);
									}
								}}
								isDisabled={!moderationReason.trim()}
								size="lg"
								className="flex-1"
								radius="full"
							>
								Apply Action
							</Button>
						</div>
					</div>
				</ModalContent>
			</Modal>
		</div>
	);
}
