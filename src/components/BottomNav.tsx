import { useQuery } from "convex/react";
import { Crown, Folder, Home, Settings, Shield } from "lucide-react";
import { api } from "../../convex/_generated/api";

interface BottomNavProps {
	activeTab: "feed" | "settings" | "moderation" | "categories" | "admin";
	onTabChange: (
		tab: "feed" | "settings" | "moderation" | "categories" | "admin",
	) => void;
}

export function BottomNav({ activeTab, onTabChange }: BottomNavProps) {
	const isModerator = useQuery(api.roles.checkIsModerator);
	const isAdmin = useQuery(api.roles.checkIsAdmin);

	type TabId = "feed" | "settings" | "moderation" | "categories" | "admin";
	type TabConfig = { id: TabId; label: string; icon: typeof Home };

	// Build tabs array based on user role
	const buildTabs = (): TabConfig[] => {
		const allTabs: TabConfig[] = [{ id: "feed", label: "Feed", icon: Home }];

		if (isModerator) {
			allTabs.push({ id: "moderation", label: "Moderate", icon: Shield });
		}

		if (isAdmin) {
			allTabs.push({ id: "categories", label: "Categories", icon: Folder });
			allTabs.push({ id: "admin", label: "Admin", icon: Crown });
		}

		allTabs.push({ id: "settings", label: "Settings", icon: Settings });

		return allTabs;
	};

	const tabs = buildTabs();

	return (
		<nav className="safe-area-inset-bottom fixed right-0 bottom-0 left-0 z-50 border-gray-200/50 border-t bg-gray-50/95 backdrop-blur-2xl dark:border-gray-800/50 dark:bg-gray-950/95">
			<div className="mx-auto flex max-w-[600px] items-center justify-around px-2 py-1">
				{tabs.map((tab) => {
					const Icon = tab.icon;
					const isActive = activeTab === tab.id;
					return (
						<button
							key={tab.id}
							type="button"
							onClick={() => onTabChange(tab.id)}
							className="flex flex-col items-center px-4 py-2 transition-all"
						>
							<Icon
								className={`mb-1 h-6 w-6 transition-all ${
									isActive
										? "scale-110 text-black dark:text-white"
										: "text-gray-400 dark:text-gray-600"
								}`}
							/>
							<span
								className={`font-medium text-xs transition-all ${
									isActive
										? "text-black dark:text-white"
										: "text-gray-400 dark:text-gray-600"
								}`}
							>
								{tab.label}
							</span>
						</button>
					);
				})}
			</div>
		</nav>
	);
}
