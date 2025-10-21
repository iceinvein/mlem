import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import type { Id } from "../../convex/_generated/dataModel";
import {
  Card,
  CardBody,
  CardHeader,
  Button,
  Select,
  SelectItem,
  Switch,
  Spinner,
  Chip,
} from "@heroui/react";
import { Shield, Check } from "lucide-react";

export function Settings() {
  const categories = useQuery(api.memes.getCategories);
  const userPreferences = useQuery(api.memes.getUserPreferences);
  const updatePreferences = useMutation(api.memes.updateUserPreferences);
  const loggedInUser = useQuery(api.auth.loggedInUser);
  const isAdmin = useQuery(api.roles.checkIsAdmin);
  // Only fetch all users if user is an admin
  const allUsers = useQuery(api.roles.getAllUsers, isAdmin ? undefined : "skip");
  const assignRole = useMutation(api.roles.assignRole);
  const initializeFirstAdmin = useMutation(api.roles.initializeFirstAdmin);

  const [favoriteCategories, setFavoriteCategories] = useState<Id<"categories">[]>([]);
  const [sortBy, setSortBy] = useState<"newest" | "popular">("newest");
  const [showOnlyFavorites, setShowOnlyFavorites] = useState(false);
  const [showRoleManagement, setShowRoleManagement] = useState(false);

  useEffect(() => {
    if (userPreferences) {
      setFavoriteCategories(userPreferences.favoriteCategories);
      setSortBy(userPreferences.feedSettings.sortBy);
      setShowOnlyFavorites(userPreferences.feedSettings.showOnlyFavorites);
    }
  }, [userPreferences]);

  const handleSavePreferences = async () => {
    try {
      await updatePreferences({
        favoriteCategories,
        feedSettings: {
          sortBy,
          showOnlyFavorites,
        },
      });
      toast.success("Preferences saved!");
    } catch {
      toast.error("Failed to save preferences");
    }
  };

  const toggleCategory = (categoryId: Id<"categories">) => {
    setFavoriteCategories(prev => 
      prev.includes(categoryId)
        ? prev.filter(id => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  const handleAssignRole = async (userId: Id<"users">, role: "user" | "moderator" | "admin") => {
    try {
      await assignRole({ targetUserId: userId, role });
      toast.success("Role updated successfully");
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Failed to update role";
      toast.error(errorMessage);
    }
  };

  const handleInitializeAdmin = async () => {
    try {
      await initializeFirstAdmin();
      toast.success("You are now the first admin!");
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Failed to initialize admin";
      toast.error(errorMessage);
    }
  };

  if (!categories || !loggedInUser) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <Spinner size="lg" color="secondary" />
      </div>
    );
  }

  return (
    <div className="max-w-[600px] mx-auto px-4 py-6 animate-fade-in">
      <h2 className="text-3xl font-black mb-6 bg-gradient-to-r from-purple-600 via-pink-600 to-orange-500 bg-clip-text text-transparent">
        Settings
      </h2>

      <div className="mb-6 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-5">
        <h3 className="font-bold text-base mb-3 text-gray-900 dark:text-gray-100">Account</h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">{loggedInUser.email}</p>
        {isAdmin && (
          <Chip 
            className="mt-2 bg-black dark:bg-white text-white dark:text-black font-bold"
            size="sm"
            radius="full"
          >
            Administrator
          </Chip>
        )}
      </div>

      {isAdmin === false && (
        <Card className="mb-6 border-warning">
          <CardHeader>
            <h3 className="font-semibold text-warning">First Time Setup</h3>
          </CardHeader>
          <CardBody className="gap-3">
            <p className="text-sm text-default-600">
              No admin exists yet. Click below to become the first administrator.
            </p>
            <Button
              color="warning"
              onPress={handleInitializeAdmin}
              startContent={<Shield className="w-4 h-4" />}
            >
              Become Admin
            </Button>
          </CardBody>
        </Card>
      )}

      {isAdmin && (
        <Card className="mb-6">
          <CardHeader className="flex justify-between items-center">
            <h3 className="font-semibold">Admin Controls</h3>
            <Button
              size="sm"
              color="primary"
              variant="flat"
              onPress={() => setShowRoleManagement(!showRoleManagement)}
            >
              {showRoleManagement ? "Hide" : "Manage Roles"}
            </Button>
          </CardHeader>
          {showRoleManagement && (
            <CardBody className="gap-3">
              <p className="text-sm text-default-600">Assign roles to users:</p>
              <div className="max-h-48 overflow-y-auto space-y-2">
                {allUsers?.map((user) => (
                  <div key={user._id} className="flex items-center justify-between p-2 bg-default-100 rounded">
                    <div className="flex-1">
                      <p className="text-sm font-medium">{user.email}</p>
                      <p className="text-xs text-default-500">Current: {user.role}</p>
                    </div>
                    <Select
                      size="sm"
                      selectionMode="single"
                      selectedKeys={new Set([user.role])}
                      onSelectionChange={(keys) => {
                        const selected = Array.from(keys)[0] as "user" | "moderator" | "admin";
                        if (selected) handleAssignRole(user._id, selected);
                      }}
                      className="w-32"
                      isDisabled={user._id === loggedInUser._id}
                      aria-label="User role"
                    >
                      <SelectItem key="user" textValue="User">User</SelectItem>
                      <SelectItem key="moderator" textValue="Moderator">Moderator</SelectItem>
                      <SelectItem key="admin" textValue="Admin">Admin</SelectItem>
                    </Select>
                  </div>
                ))}
              </div>
            </CardBody>
          )}
        </Card>
      )}

      <div className="mb-6 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-5">
        <h3 className="font-bold text-base mb-4 text-gray-900 dark:text-gray-100">Feed Preferences</h3>
        
        <Select
          label="Default Sort Order"
          selectionMode="single"
          selectedKeys={new Set([sortBy])}
          onSelectionChange={(keys) => {
            const selected = Array.from(keys)[0] as "newest" | "popular";
            if (selected) setSortBy(selected);
          }}
          size="lg"
          className="mb-4"
        >
          <SelectItem key="newest" textValue="Newest First">Newest First</SelectItem>
          <SelectItem key="popular" textValue="Most Popular">Most Popular</SelectItem>
        </Select>

        <div className="flex items-center justify-between p-4 rounded-xl bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800">
          <div>
            <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">Show Only Favorites</p>
            <p className="text-xs text-gray-500">
              Only show memes from your favorite categories
            </p>
          </div>
          <Switch
            isSelected={showOnlyFavorites}
            onValueChange={setShowOnlyFavorites}
          />
        </div>
      </div>

      <div className="mb-6 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-5">
        <h3 className="font-bold text-base mb-2 text-gray-900 dark:text-gray-100">Favorite Categories</h3>
        <p className="text-sm text-gray-500 mb-4">
          Select your favorite categories to personalize your feed
        </p>
        
        <div className="space-y-2">
          {categories.map((category) => {
            const isFavorite = favoriteCategories.includes(category._id);
            return (
              <button
                key={category._id}
                onClick={() => toggleCategory(category._id)}
                className={`w-full flex items-center justify-between p-4 rounded-xl transition-all ${
                  isFavorite 
                    ? "bg-black dark:bg-white" 
                    : "bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800"
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{category.icon}</span>
                  <div className="text-left">
                    <div className={`font-semibold ${isFavorite ? "text-white dark:text-black" : "text-gray-900 dark:text-gray-100"}`}>
                      {category.name}
                    </div>
                    <div className={`text-xs ${isFavorite ? "text-gray-300 dark:text-gray-700" : "text-gray-500"}`}>
                      {category.description}
                    </div>
                  </div>
                </div>
                <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                  isFavorite 
                    ? "border-white dark:border-black bg-white dark:bg-black" 
                    : "border-gray-300 dark:border-gray-700"
                }`}>
                  {isFavorite && <Check className="w-4 h-4 text-black dark:text-white" />}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <Button
        className="w-full bg-black dark:bg-white text-white dark:text-black font-bold"
        onPress={handleSavePreferences}
        size="lg"
        radius="full"
      >
        Save Preferences
      </Button>

      <div className="mt-6 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20 border border-purple-200 dark:border-purple-900 rounded-2xl p-5">
        <h3 className="font-bold mb-2 text-base text-gray-900 dark:text-gray-100">About Share my meme</h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
          Discover and share the funniest memes with our community. 
          Customize your experience and never miss the content you love.
        </p>
      </div>
    </div>
  );
}
