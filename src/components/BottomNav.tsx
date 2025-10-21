import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Home, FolderOpen, Settings, Shield } from "lucide-react";
import { Button } from "@heroui/react";

interface BottomNavProps {
  activeTab: "feed" | "categories" | "settings" | "moderation";
  onTabChange: (tab: "feed" | "categories" | "settings" | "moderation") => void;
}

export function BottomNav({ activeTab, onTabChange }: BottomNavProps) {
  const isModerator = useQuery(api.roles.checkIsModerator);

  const baseTabs = [
    { id: "feed" as const, label: "Feed", icon: Home },
    { id: "categories" as const, label: "Categories", icon: FolderOpen },
    { id: "settings" as const, label: "Settings", icon: Settings },
  ];

  const tabs = isModerator
    ? [...baseTabs.slice(0, 2), { id: "moderation" as const, label: "Moderation", icon: Shield }, baseTabs[2]]
    : baseTabs;

  return (
    <nav className="fixed bottom-0 left-0 right-0 backdrop-blur-2xl bg-white/90 dark:bg-black/90 border-t border-gray-200/50 dark:border-gray-800/50 z-50 safe-area-inset-bottom">
      <div className="flex justify-around items-center max-w-[600px] mx-auto px-2 py-1">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className="flex flex-col items-center py-2 px-4 transition-all"
            >
              <Icon
                className={`w-6 h-6 mb-1 transition-all ${isActive
                    ? "text-black dark:text-white scale-110"
                    : "text-gray-400 dark:text-gray-600"
                  }`}
              />
              <span className={`text-xs font-medium transition-all ${isActive
                  ? "text-black dark:text-white"
                  : "text-gray-400 dark:text-gray-600"
                }`}>
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
