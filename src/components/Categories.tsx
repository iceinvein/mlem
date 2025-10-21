import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useState } from "react";
import { Feed } from "./Feed";
import { Button, Card, CardBody, Spinner } from "@heroui/react";
import { ArrowLeft } from "lucide-react";

export function Categories() {
  const categories = useQuery(api.memes.getCategories);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  if (selectedCategory) {
    return (
      <div>
        <div className="sticky top-16 backdrop-blur-xl bg-white/70 dark:bg-gray-900/70 border-b border-white/20 px-4 py-3 z-10">
          <Button
            onPress={() => setSelectedCategory(null)}
            variant="flat"
            color="secondary"
            startContent={<ArrowLeft className="w-4 h-4" />}
            radius="full"
          >
            Back to Categories
          </Button>
        </div>
        <Feed />
      </div>
    );
  }

  if (!categories) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <Spinner size="lg" color="secondary" />
      </div>
    );
  }

  return (
    <div className="max-w-[600px] mx-auto px-4 py-6 animate-fade-in">
      <h2 className="text-3xl font-black mb-6 bg-gradient-to-r from-purple-600 via-pink-600 to-orange-500 bg-clip-text text-transparent">
        Categories
      </h2>
      
      <div className="grid grid-cols-2 gap-3">
        {categories.map((category) => (
          <button
            key={category._id}
            onClick={() => setSelectedCategory(category._id)}
            className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-6 text-center hover:scale-105 active:scale-95 transition-all shadow-sm hover:shadow-md"
          >
            <div className="text-5xl mb-3">{category.icon}</div>
            <h3 className="font-bold mb-1 text-base text-gray-900 dark:text-gray-100">{category.name}</h3>
            <p className="text-xs text-gray-500 leading-tight">
              {category.description}
            </p>
          </button>
        ))}
      </div>
      
      <div className="mt-8 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20 border border-purple-200 dark:border-purple-900 rounded-2xl p-5">
        <h3 className="font-bold mb-2 text-base text-gray-900 dark:text-gray-100">Discover More</h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
          Tap any category to explore memes and customize your feed preferences in Settings.
        </p>
      </div>
    </div>
  );
}
