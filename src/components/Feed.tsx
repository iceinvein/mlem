import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useState, useEffect } from "react";
import { MemeCard } from "./MemeCard";
import { CreateMemeModal } from "./CreateMemeModal";
import type { Id } from "../../convex/_generated/dataModel";
import { Button, Chip, Spinner, Modal, ModalContent, ModalBody } from "@heroui/react";
import { Plus, SlidersHorizontal, TrendingUp, Clock, Drama } from "lucide-react";

export function Feed() {
  const [sortBy, setSortBy] = useState<"newest" | "popular">("newest");
  const [selectedCategory, setSelectedCategory] = useState<Id<"categories"> | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showSortModal, setShowSortModal] = useState(false);
  
  const categories = useQuery(api.memes.getCategories);
  const userPreferences = useQuery(api.memes.getUserPreferences);
  const seedData = useMutation(api.memes.seedData);
  
  const memes = useQuery(api.memes.getFeed, {
    categoryId: selectedCategory || undefined,
    sortBy,
    limit: 20,
  });

  useEffect(() => {
    if (categories && categories.length === 0) {
      seedData().catch(console.error);
    }
  }, [categories, seedData]);

  useEffect(() => {
    if (userPreferences?.feedSettings) {
      setSortBy(userPreferences.feedSettings.sortBy);
    }
  }, [userPreferences]);

  const filteredMemes = memes?.filter(meme => {
    if (!userPreferences?.feedSettings.showOnlyFavorites) return true;
    return userPreferences.favoriteCategories.includes(meme.categoryId);
  });

  if (!memes || !categories) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <Spinner size="lg" color="secondary" />
      </div>
    );
  }

  return (
    <div className="max-w-[600px] mx-auto">
      {/* Sticky Header Controls */}
      <div className="sticky top-14 z-40 backdrop-blur-2xl bg-white/90 dark:bg-black/90 border-b border-gray-200/50 dark:border-gray-800/50 px-4 py-3">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-2xl font-black bg-gradient-to-r from-purple-600 via-pink-600 to-orange-500 bg-clip-text text-transparent">
            Feed
          </h2>
          <div className="flex items-center gap-2">
            <Button
              isIconOnly
              onPress={() => setShowSortModal(true)}
              variant="flat"
              size="sm"
              radius="full"
              className="bg-gray-100 dark:bg-gray-900"
            >
              <SlidersHorizontal className="w-4 h-4" />
            </Button>
            <Button
              onPress={() => setShowCreateModal(true)}
              className="bg-gradient-to-r from-purple-600 via-pink-600 to-orange-500 text-white font-bold shadow-lg"
              size="sm"
              radius="full"
              startContent={<Plus className="w-4 h-4" />}
            >
              Create
            </Button>
          </div>
        </div>
        
        {/* Category Pills */}
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide -mx-4 px-4">
          <Chip
            onClick={() => setSelectedCategory(null)}
            className={`cursor-pointer transition-all shrink-0 ${
              !selectedCategory 
                ? "bg-black dark:bg-white text-white dark:text-black font-bold" 
                : "bg-gray-100 dark:bg-gray-900 text-gray-700 dark:text-gray-300"
            }`}
            radius="full"
            size="sm"
          >
            All
          </Chip>
          {categories.map((category) => (
            <Chip
              key={category._id}
              onClick={() => setSelectedCategory(category._id)}
              className={`cursor-pointer transition-all shrink-0 ${
                selectedCategory === category._id
                  ? "bg-black dark:bg-white text-white dark:text-black font-bold"
                  : "bg-gray-100 dark:bg-gray-900 text-gray-700 dark:text-gray-300"
              }`}
              radius="full"
              size="sm"
            >
              <span className="flex items-center gap-1">
                <span>{category.icon}</span>
                {category.name}
              </span>
            </Chip>
          ))}
        </div>
      </div>

      {/* Feed Content */}
      <div className="space-y-0">
        {filteredMemes && filteredMemes.length > 0 ? (
          filteredMemes.map((meme) => (
            <MemeCard key={meme._id} meme={meme} />
          ))
        ) : (
          <div className="text-center py-20 px-4">
            <div className="flex justify-center mb-4">
              <Drama className="w-20 h-20 text-gray-400" strokeWidth={1.5} />
            </div>
            <p className="text-gray-900 dark:text-gray-100 mb-2 font-bold text-xl">No memes found</p>
            <p className="text-sm text-gray-500">
              Try adjusting your filters or create one!
            </p>
          </div>
        )}
      </div>

      <CreateMemeModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
      />

      {/* Sort Modal */}
      <Modal 
        isOpen={showSortModal} 
        onClose={() => setShowSortModal(false)}
        placement="bottom"
        motionProps={{
          variants: {
            enter: {
              y: 0,
              transition: {
                duration: 0.3,
                ease: "easeOut"
              }
            },
            exit: {
              y: "100%",
              transition: {
                duration: 0.2,
                ease: "easeIn"
              }
            }
          }
        }}
        classNames={{
          wrapper: "items-end",
          base: "max-w-[600px] mx-auto !h-auto rounded-t-3xl mb-0 sm:mb-0",
          backdrop: "backdrop-blur-sm bg-black/50"
        }}
      >
        <ModalContent className="bg-white dark:bg-black">
          <div className="flex flex-col items-center pt-2 pb-3 border-b border-gray-200 dark:border-gray-800">
            <div className="w-10 h-1 bg-gray-300 dark:bg-gray-700 rounded-full mb-3" />
            <h3 className="text-base font-bold text-gray-900 dark:text-gray-100">
              Sort By
            </h3>
          </div>
          <ModalBody className="p-4">
            <div className="space-y-2">
              <Button
                fullWidth
                size="lg"
                variant="flat"
                className={sortBy === "newest" ? "bg-black dark:bg-white text-white dark:text-black font-bold" : "bg-gray-100 dark:bg-gray-900"}
                onPress={() => {
                  setSortBy("newest");
                  setShowSortModal(false);
                }}
                startContent={<Clock className="w-5 h-5" />}
                radius="full"
              >
                Newest First
              </Button>
              <Button
                fullWidth
                size="lg"
                variant="flat"
                className={sortBy === "popular" ? "bg-black dark:bg-white text-white dark:text-black font-bold" : "bg-gray-100 dark:bg-gray-900"}
                onPress={() => {
                  setSortBy("popular");
                  setShowSortModal(false);
                }}
                startContent={<TrendingUp className="w-5 h-5" />}
                radius="full"
              >
                Most Popular
              </Button>
            </div>
          </ModalBody>
        </ModalContent>
      </Modal>
    </div>
  );
}
