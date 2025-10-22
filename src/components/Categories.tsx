import { Button, Spinner } from "@heroui/react";
import { useQuery } from "convex/react";
import { ArrowLeft } from "lucide-react";
import { useState } from "react";
import { api } from "../../convex/_generated/api";
import { Feed } from "./Feed";

export function Categories() {
	const categories = useQuery(api.memes.getCategories);
	const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

	if (selectedCategory) {
		return (
			<div>
				<div className="sticky top-16 z-10 border-gray-200/50 border-b bg-gray-50/95 px-4 py-3 backdrop-blur-xl dark:border-gray-800/50 dark:bg-gray-900/95">
					<Button
						onPress={() => setSelectedCategory(null)}
						variant="flat"
						color="secondary"
						startContent={<ArrowLeft className="h-4 w-4" />}
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
			<div className="flex min-h-[50vh] items-center justify-center">
				<Spinner size="lg" color="secondary" />
			</div>
		);
	}

	return (
		<div className="mx-auto max-w-[600px] animate-fade-in px-4 py-6">
			<h2 className="mb-6 font-black text-3xl text-gray-900 dark:text-white">
				Categories
			</h2>

			<div className="grid grid-cols-2 gap-3">
				{categories.map((category) => (
					<button
						key={category._id}
						type="button"
						onClick={() => setSelectedCategory(category._id)}
						className="rounded-2xl border border-gray-200 bg-gray-50 p-6 text-center shadow-sm transition-all hover:scale-105 hover:shadow-md active:scale-95 dark:border-gray-800 dark:bg-gray-900"
					>
						<h3 className="font-bold text-gray-900 text-lg dark:text-gray-100">
							{category.name}
						</h3>
					</button>
				))}
			</div>

			<div className="mt-8 rounded-2xl border border-gray-200 bg-gray-100 p-5 dark:border-gray-800 dark:bg-gray-900">
				<h3 className="mb-2 font-bold text-base text-gray-900 dark:text-gray-100">
					Discover More
				</h3>
				<p className="text-gray-600 text-sm leading-relaxed dark:text-gray-400">
					Tap any category to explore memes and customize your feed preferences
					in Settings.
				</p>
			</div>
		</div>
	);
}
