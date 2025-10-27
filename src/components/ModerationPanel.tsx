import {
	Avatar,
	Button,
	Card,
	CardBody,
	Chip,
	Modal,
	ModalBody,
	ModalContent,
	ModalFooter,
	ModalHeader,
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
	const [selectedTab, setSelectedTab] = useState<"user-reports" | "meme-reports">(
		"user-reports",
	);
	const [selectedUserId, setSelectedUserId] = useState<Id<"users"> | null>(
		null,
	);
	const [selectedReportId, setSelectedReportId] = useState<
		Id<"userReports"> | null
	>(null);
	const [showUserDetails, setShowUserDetails] = useState(false);
	const [moderatorNotes, setModeratorNotes] = useState("");
	const [actionTaken, setActionTaken] = useState<
		"none" | "warning" | "user_muted" | "user_suspended"
	>("none");

	const reportedUsers = useQuery(api.userReports.getReportedUsers);
	const userReports = useQuery(api.userReports.getUserReports, {});
	const memeReports = useQuery(api.reports.getReports, {});
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
																</div>
															</div>
														</div>

														{/* Latest Report Preview */}
														{latestReport && (
															<div className="rounded-lg border border-gray-200 bg-gray-50 p-3 dark:border-gray-700 dark:bg-gray-900">
																<div className="mb-2 flex items-center gap-2">
																	<AlertTriangle className="h-4 w-4 text-orange-500" />
																	<p className="font-semibold text-sm text-gray-900 dark:text-gray-100">
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
																		{latestReport.status.charAt(0).toUpperCase() +
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
															{item.pendingReports > 0 && (
																<Button
																	size="sm"
																	color="primary"
																	variant="flat"
																	onPress={() => {
																		const pendingReport = userReportsForUser.find(
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
																Report for meme: {report.meme?.title || "Unknown"}
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
						{/* All Reports for this User */}
						<div className="mb-6">
							<h4 className="mb-3 font-bold text-gray-900 dark:text-gray-100">
								Reports ({userReports?.filter((r) => r.reportedUserId === selectedUserId).length || 0})
							</h4>
							{userReports && userReports.filter((r) => r.reportedUserId === selectedUserId).length > 0 ? (
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
																	{new Date(report._creationTime).toLocaleDateString()}
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
																By {report.reporter?.name || report.reporter?.email || "Unknown"}
															</p>
														</div>
													</div>
												</CardBody>
											</Card>
										))}
								</div>
							) : (
								<p className="text-gray-500 text-sm dark:text-gray-400">No reports found</p>
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
		</div>
	);
}
