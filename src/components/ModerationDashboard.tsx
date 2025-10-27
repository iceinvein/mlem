import { useQuery } from "convex/react";
import { ShieldOff } from "lucide-react";
import { api } from "../../convex/_generated/api";
import { ModerationPanel } from "./ModerationPanel";

export function ModerationDashboard() {
	const isModerator = useQuery(api.roles.checkIsModerator);
	const isLoadingAuth = isModerator === undefined;

	if (!isLoadingAuth && isModerator === false) {
		return (
			<div className="mx-auto max-w-[600px] animate-fade-in px-4 py-6">
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
			</div>
		);
	}

	return <ModerationPanel />;
}
