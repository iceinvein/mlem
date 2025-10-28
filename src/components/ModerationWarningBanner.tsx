import { Button, Chip } from "@heroui/react";
import { useMutation, useQuery } from "convex/react";
import { AlertTriangle, X } from "lucide-react";
import { useState } from "react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";

export function ModerationWarningBanner() {
	const activeWarnings = useQuery(api.moderation.getMyActiveWarnings);
	const dismissWarning = useMutation(api.moderation.dismissWarning);
	const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());

	if (!activeWarnings || activeWarnings.length === 0) {
		return null;
	}

	// Filter out dismissed warnings
	const visibleWarnings = activeWarnings.filter(
		(warning) => !dismissedIds.has(warning._id),
	);

	if (visibleWarnings.length === 0) {
		return null;
	}

	const handleDismiss = async (warningId: Id<"moderationActions">) => {
		try {
			// Optimistically hide the warning
			setDismissedIds((prev) => new Set(prev).add(warningId));
			await dismissWarning({ warningId });
		} catch (error) {
			// If it fails, show it again
			setDismissedIds((prev) => {
				const newSet = new Set(prev);
				newSet.delete(warningId);
				return newSet;
			});
			console.error("Failed to dismiss warning:", error);
		}
	};

	return (
		<div className="fixed top-14 right-0 left-0 z-40 animate-fade-in">
			<div className="mx-auto max-w-[600px]">
				{visibleWarnings.map((warning) => (
					<div
						key={warning._id}
						className={`border-b px-4 py-3 ${
							warning.actionType === "warning"
								? "border-yellow-200 bg-yellow-50 dark:border-yellow-900/50 dark:bg-yellow-950/30"
								: warning.actionType === "strike"
									? "border-orange-200 bg-orange-50 dark:border-orange-900/50 dark:bg-orange-950/30"
									: warning.actionType === "mute"
										? "border-red-200 bg-red-50 dark:border-red-900/50 dark:bg-red-950/30"
										: "border-red-300 bg-red-100 dark:border-red-900/50 dark:bg-red-950/40"
						}`}
					>
						<div className="flex items-start gap-3">
							<AlertTriangle
								className={`mt-0.5 h-5 w-5 shrink-0 ${
									warning.actionType === "warning"
										? "text-yellow-600 dark:text-yellow-500"
										: warning.actionType === "strike"
											? "text-orange-600 dark:text-orange-500"
											: "text-red-600 dark:text-red-500"
								}`}
							/>
							<div className="flex-1">
								<div className="mb-1 flex items-center gap-2">
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
									className={`font-medium text-sm ${
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
										className={`mt-1 text-xs ${
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
									<p className="mt-1 text-red-700 text-xs dark:text-red-400">
										Expires: {new Date(warning.expiresAt).toLocaleDateString()}
									</p>
								)}
								{warning.actionType === "mute" && (
									<p className="mt-1 text-red-700 text-xs dark:text-red-400">
										You cannot post or comment while muted
									</p>
								)}
							</div>
							{warning.actionType === "warning" && (
								<Button
									isIconOnly
									size="sm"
									variant="light"
									onPress={() => handleDismiss(warning._id)}
									className={
										warning.actionType === "warning"
											? "text-yellow-600 dark:text-yellow-500"
											: warning.actionType === "strike"
												? "text-orange-600 dark:text-orange-500"
												: "text-red-600 dark:text-red-500"
									}
								>
									<X className="h-4 w-4" />
								</Button>
							)}
						</div>
					</div>
				))}
			</div>
		</div>
	);
}
