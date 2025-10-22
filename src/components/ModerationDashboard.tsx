import {
	Button,
	Card,
	CardBody,
	CardHeader,
	Chip,
	Image,
	Modal,
	ModalBody,
	ModalContent,
} from "@heroui/react";
import { useMutation, useQuery } from "convex/react";
import { Eye, ShieldOff } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";

export function ModerationDashboard() {
	const [selectedStatus, setSelectedStatus] = useState<
		"pending" | "reviewed" | "resolved" | "dismissed" | undefined
	>("pending");
	type ReportWithDetails = NonNullable<typeof reports>[number];
	const [selectedReport, setSelectedReport] =
		useState<ReportWithDetails | null>(null);

	const isModerator = useQuery(api.roles.checkIsModerator);
	const reports = useQuery(api.reports.getReports, {
		status: selectedStatus,
		limit: 100,
	});
	const updateReportStatus = useMutation(api.reports.updateReportStatus);

	const isLoadingAuth = isModerator === undefined;
	const isLoadingReports = !reports;

	const handleUpdateReport = async (
		reportId: Id<"reports">,
		status: "pending" | "reviewed" | "resolved" | "dismissed",
		actionTaken?: "none" | "warning" | "content_removed" | "user_suspended",
		moderatorNotes?: string,
	) => {
		try {
			await updateReportStatus({
				reportId,
				status,
				actionTaken,
				moderatorNotes,
			});
			toast.success("Report updated successfully");
			setSelectedReport(null);
		} catch (error: unknown) {
			const errorMessage =
				error instanceof Error ? error.message : "Failed to update report";
			toast.error(errorMessage);
		}
	};

	const getStatusColor = (status: string) => {
		switch (status) {
			case "pending":
				return "warning";
			case "reviewed":
				return "primary";
			case "resolved":
				return "success";
			case "dismissed":
				return "default";
			default:
				return "default";
		}
	};

	const getReasonColor = (reason: string) => {
		switch (reason) {
			case "spam":
				return "warning";
			case "inappropriate":
				return "danger";
			case "harassment":
				return "secondary";
			case "copyright":
				return "primary";
			case "misinformation":
				return "warning";
			default:
				return "default";
		}
	};

	return (
		<div className="mx-auto max-w-[600px] animate-fade-in px-4 py-6">
			<h2 className="mb-6 font-black text-3xl text-gray-900 dark:text-white">
				Moderation
			</h2>

			<div className="mb-6">
				<div className="scrollbar-hide flex gap-2 overflow-x-auto pb-2">
					{[
						{ value: undefined, label: "All" },
						{ value: "pending", label: "Pending" },
						{ value: "reviewed", label: "Reviewed" },
						{ value: "resolved", label: "Resolved" },
						{ value: "dismissed", label: "Dismissed" },
					].map((status) => (
						<Chip
							key={status.label}
							onClick={() =>
								setSelectedStatus(status.value as typeof selectedStatus)
							}
							className={`cursor-pointer transition-all ${
								selectedStatus === status.value
									? "bg-gray-900 font-bold text-white dark:bg-gray-100 dark:text-gray-900"
									: "bg-gray-100 text-gray-700 dark:bg-gray-900 dark:text-gray-300"
							}`}
							radius="full"
						>
							{status.label}
						</Chip>
					))}
				</div>
			</div>

			{!isLoadingAuth && isModerator === false ? (
				<div className="rounded-3xl border border-gray-200 bg-gray-50 py-16 text-center shadow-xl dark:border-gray-800 dark:bg-gray-900">
					<ShieldOff className="mx-auto mb-4 h-20 w-20 text-red-500" />
					<h2 className="mb-3 font-bold text-2xl text-red-600 dark:text-red-500">
						Access Denied
					</h2>
					<p className="mb-4 px-6 text-gray-600 dark:text-gray-400">
						You don't have permission to access the moderation dashboard.
					</p>
					<p className="px-6 text-gray-500 text-sm">
						Only moderators and administrators can view this section.
					</p>
				</div>
			) : isLoadingAuth || isLoadingReports ? (
				<div className="animate-pulse space-y-4">
					<div className="space-y-3 rounded-2xl bg-gray-100 p-4 dark:bg-gray-900">
						<div className="flex gap-2">
							<div className="h-6 w-20 rounded-full bg-gray-200 dark:bg-gray-800" />
							<div className="h-6 w-24 rounded-full bg-gray-200 dark:bg-gray-800" />
						</div>
						<div className="h-5 w-3/4 rounded bg-gray-200 dark:bg-gray-800" />
						<div className="h-4 w-full rounded bg-gray-200 dark:bg-gray-800" />
					</div>

					<div className="space-y-3 rounded-2xl bg-gray-100 p-4 dark:bg-gray-900">
						<div className="flex gap-2">
							<div className="h-6 w-20 rounded-full bg-gray-200 dark:bg-gray-800" />
							<div className="h-6 w-24 rounded-full bg-gray-200 dark:bg-gray-800" />
						</div>
						<div className="h-5 w-2/3 rounded bg-gray-200 dark:bg-gray-800" />
						<div className="h-4 w-full rounded bg-gray-200 dark:bg-gray-800" />
					</div>
				</div>
			) : (
				<div className="space-y-4">
					{reports.length > 0 ? (
						reports.map((report, index) => (
							<Card
								key={report._id}
								className="animate-slide-up border border-gray-200 bg-gray-50 shadow-lg dark:border-gray-800 dark:bg-gray-900"
								style={{ animationDelay: `${index * 50}ms` }}
							>
								<CardHeader className="flex-col items-start gap-2">
									<div className="flex w-full items-center gap-2">
										<Chip
											size="sm"
											color={getStatusColor(report.status)}
											variant="flat"
										>
											{report.status}
										</Chip>
										<Chip
											size="sm"
											color={getReasonColor(report.reason)}
											variant="flat"
										>
											{report.reason}
										</Chip>
										<span className="ml-auto text-default-500 text-xs">
											{new Date(report._creationTime).toLocaleDateString()}
										</span>
									</div>

									<h3 className="font-medium">
										Reported Meme: "{report.meme?.title || "Deleted"}"
									</h3>

									<p className="text-default-600 text-sm">
										Reporter: {report.reporter?.email || "Unknown"}
									</p>

									{report.description && (
										<p className="w-full rounded bg-default-100 p-2 text-sm">
											"{report.description}"
										</p>
									)}
								</CardHeader>
								<CardBody>
									<div className="flex items-center justify-between">
										{report.moderatorNotes && (
											<div className="flex-1 rounded bg-primary-50 p-2">
												<p className="font-medium text-primary-900 text-xs">
													Moderator Notes:
												</p>
												<p className="text-primary-800 text-sm">
													{report.moderatorNotes}
												</p>
												{report.moderator && (
													<p className="mt-1 text-primary-600 text-xs">
														By: {report.moderator.email}
													</p>
												)}
											</div>
										)}
										<Button
											color="primary"
											variant="flat"
											onPress={() => setSelectedReport(report)}
											startContent={<Eye className="h-4 w-4" />}
											className="ml-auto"
										>
											Review
										</Button>
									</div>
								</CardBody>
							</Card>
						))
					) : (
						<div className="py-12 text-center">
							<p className="mb-2 text-default-500">No reports found</p>
							<p className="text-default-400 text-sm">
								{selectedStatus
									? `No ${selectedStatus} reports`
									: "No reports to review"}
							</p>
						</div>
					)}
				</div>
			)}

			<Modal
				isOpen={!!selectedReport}
				onClose={() => setSelectedReport(null)}
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
						<h3 className="font-bold text-base text-gray-900 dark:text-gray-100">
							Review Report
						</h3>
					</div>

					<ModalBody className="gap-4 overflow-y-auto px-4 py-6">
						{selectedReport && (
							<>
								<Card className="bg-gray-100 dark:bg-gray-900">
									<CardBody className="gap-2">
										<h4 className="font-semibold text-gray-900 dark:text-gray-100">
											Report Details
										</h4>
										<div className="space-y-2 text-sm">
											<p className="text-gray-900 dark:text-gray-100">
												<span className="font-medium">Reason:</span>{" "}
												{selectedReport.reason}
											</p>
											<p className="text-gray-900 dark:text-gray-100">
												<span className="font-medium">Reporter:</span>{" "}
												{selectedReport.reporter?.email}
											</p>
											<p className="text-gray-900 dark:text-gray-100">
												<span className="font-medium">Date:</span>{" "}
												{new Date(
													selectedReport._creationTime,
												).toLocaleString()}
											</p>
											{selectedReport.description && (
												<p className="text-gray-900 dark:text-gray-100">
													<span className="font-medium">Description:</span>{" "}
													{selectedReport.description}
												</p>
											)}
										</div>
									</CardBody>
								</Card>

								{selectedReport.meme && (
									<Card className="bg-gray-100 dark:bg-gray-900">
										<CardBody className="gap-2">
											<h4 className="font-semibold text-gray-900 dark:text-gray-100">
												Reported Content
											</h4>
											<div className="flex gap-4">
												<Image
													src={selectedReport.meme.imageUrl}
													alt={selectedReport.meme.title}
													className="h-24 w-24 rounded object-cover"
												/>
												<div>
													<p className="font-medium text-gray-900 dark:text-gray-100">
														{selectedReport.meme.title}
													</p>
													<p className="text-gray-600 text-sm dark:text-gray-400">
														{selectedReport.meme.likes} likes •{" "}
														{selectedReport.meme.shares} shares
													</p>
												</div>
											</div>
										</CardBody>
									</Card>
								)}

								<div className="space-y-3">
									<h4 className="font-semibold text-gray-900 dark:text-gray-100">
										Take Action
									</h4>

									<div className="grid grid-cols-2 gap-2">
										<Button
											variant="flat"
											onPress={() =>
												handleUpdateReport(
													selectedReport._id,
													"dismissed",
													"none",
													"No violation found",
												)
											}
											radius="full"
										>
											Dismiss Report
										</Button>

										<Button
											color="warning"
											variant="flat"
											onPress={() =>
												handleUpdateReport(
													selectedReport._id,
													"resolved",
													"warning",
													"Warning issued to user",
												)
											}
											radius="full"
										>
											Issue Warning
										</Button>

										<Button
											color="danger"
											variant="flat"
											onPress={() =>
												handleUpdateReport(
													selectedReport._id,
													"resolved",
													"content_removed",
													"Content removed for policy violation",
												)
											}
											radius="full"
										>
											Remove Content
										</Button>

										<Button
											color="danger"
											onPress={() =>
												handleUpdateReport(
													selectedReport._id,
													"resolved",
													"user_suspended",
													"User suspended for repeated violations",
												)
											}
											radius="full"
										>
											Suspend User
										</Button>
									</div>
								</div>
							</>
						)}
					</ModalBody>

					{/* Footer */}
					<div className="border-gray-200 border-t bg-gray-50 p-4 dark:border-gray-800 dark:bg-gray-950">
						<Button
							variant="flat"
							onPress={() => setSelectedReport(null)}
							size="lg"
							className="w-full"
							radius="full"
						>
							Close
						</Button>
					</div>
				</ModalContent>
			</Modal>
		</div>
	);
}
