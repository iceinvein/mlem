import { Authenticated, Unauthenticated, useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import { SignInForm } from "./SignInForm";
import { SignOutButton } from "./SignOutButton";
import { Toaster } from "sonner";
import { useState } from "react";
import { Categories } from "./components/Categories";
import { Feed } from "./components/Feed";
import { Settings } from "./components/Settings";
import { ModerationDashboard } from "./components/ModerationDashboard";
import { BottomNav } from "./components/BottomNav";
import { ThemeToggle } from "./components/ThemeToggle";
import { Spinner } from "@heroui/react";
import { Drama } from "lucide-react";

export default function App() {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-black">
      <header className="fixed top-0 left-0 right-0 z-50 backdrop-blur-2xl bg-white/80 dark:bg-black/80 border-b border-gray-200/50 dark:border-gray-800/50">
        <div className="h-14 flex justify-between items-center px-4 max-w-[600px] mx-auto">
          <h2 className="text-xl font-black bg-gradient-to-r from-purple-600 via-pink-600 to-orange-500 bg-clip-text text-transparent">
            Share my meme
          </h2>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Authenticated>
              <SignOutButton />
            </Authenticated>
          </div>
        </div>
      </header>
      <main className="flex-1 pt-14 pb-16">
        <Content />
      </main>
      <Toaster position="top-center" richColors />
    </div>
  );
}

function Content() {
  const loggedInUser = useQuery(api.auth.loggedInUser);
  const isModerator = useQuery(api.roles.checkIsModerator);
  const [activeTab, setActiveTab] = useState<"feed" | "categories" | "settings" | "moderation">("feed");

  // Reset to feed if user loses moderation access
  if (activeTab === "moderation" && isModerator === false) {
    setActiveTab("feed");
  }

  if (loggedInUser === undefined) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <Spinner size="lg" color="secondary" />
      </div>
    );
  }

  return (
    <>
      <Unauthenticated>
        <div className="flex flex-col items-center justify-center min-h-[calc(100vh-14rem)] px-4 animate-fade-in">
          <div className="text-center mb-8 space-y-4">
            <div className="mb-4 animate-bounce-slow flex justify-center">
              <Drama className="w-20 h-20 text-purple-600" strokeWidth={1.5} />
            </div>
            <h1 className="text-5xl font-black bg-gradient-to-r from-purple-600 via-pink-600 to-orange-500 bg-clip-text text-transparent">
              Share my meme
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-400 max-w-md">
              Discover and share the funniest memes
            </p>
          </div>
          <div className="w-full max-w-md">
            <SignInForm />
          </div>
        </div>
      </Unauthenticated>

      <Authenticated>
        <div className="relative">
          {activeTab === "feed" && <Feed />}
          {activeTab === "categories" && <Categories />}
          {activeTab === "moderation" && <ModerationDashboard />}
          {activeTab === "settings" && <Settings />}
          
          <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />
        </div>
      </Authenticated>
    </>
  );
}
