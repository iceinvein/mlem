import { useAuthActions } from "@convex-dev/auth/react";
import { useMutation, useQuery } from "convex/react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { api } from "../../convex/_generated/api";

export function SuspensionCheck() {
	const { signOut } = useAuthActions();
	const suspensionStatus = useQuery(api.moderation.checkSuspensionStatus);
	const clearExpiredSuspension = useMutation(
		api.moderation.clearExpiredSuspension,
	);
	const [hasChecked, setHasChecked] = useState(false);

	useEffect(() => {
		if (!suspensionStatus || hasChecked) return;

		const checkAndHandle = async () => {
			// First, try to clear expired suspensions
			try {
				await clearExpiredSuspension();
			} catch {
				// Ignore errors from clearing
			}

			// Check if still suspended after clearing
			if (suspensionStatus.isSuspended) {
				setHasChecked(true);

				// Show error toast
				toast.error("Account Suspended", {
					description:
						suspensionStatus.reason ||
						"Your account has been suspended. Please contact support.",
					duration: 10000,
				});

				// Sign out the user
				await signOut();
			}
		};

		checkAndHandle();
	}, [suspensionStatus, clearExpiredSuspension, signOut, hasChecked]);

	// This component doesn't render anything
	return null;
}
