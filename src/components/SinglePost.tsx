import { Button } from "@heroui/react";
import { useQuery } from "convex/react";
import { ArrowLeft, Loader2 } from "lucide-react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import { CommentSection } from "./CommentSection";
import { MemeCard } from "./MemeCard";

interface SinglePostProps {
	memeId: Id<"memes">;
	onBack: () => void;
}

export function SinglePost({ memeId, onBack }: SinglePostProps) {
	const meme = useQuery(api.memes.getSingleMeme, { memeId });

	if (meme === undefined) {
		return (
			<div className="mx-auto max-w-[600px]">
				<div className="flex min-h-[50vh] items-center justify-center">
					<Loader2 className="h-8 w-8 animate-spin text-gray-400" />
				</div>
			</div>
		);
	}

	if (meme === null) {
		return (
			<div className="mx-auto max-w-[600px]">
				<div className="px-4 py-20 text-center">
					<p className="mb-4 font-bold text-gray-900 text-xl dark:text-gray-100">
						Post not found
					</p>
					<Button
						onPress={onBack}
						className="bg-gray-900 font-bold text-white dark:bg-gray-100 dark:text-gray-900"
						radius="full"
						startContent={<ArrowLeft className="h-4 w-4" />}
					>
						Back to Feed
					</Button>
				</div>
			</div>
		);
	}

	return (
		<div className="mx-auto max-w-[600px]">
			{/* Back Button */}
			<div className="sticky top-14 z-40 border-gray-200/50 border-b bg-gray-50/95 px-4 py-3 backdrop-blur-2xl dark:border-gray-800/50 dark:bg-gray-950/95">
				<Button
					onPress={onBack}
					variant="light"
					size="sm"
					startContent={<ArrowLeft className="h-4 w-4" />}
					className="font-semibold"
				>
					Back
				</Button>
			</div>

			{/* Post Card */}
			<div className="border-gray-200 border-b dark:border-gray-800">
				<MemeCard meme={meme} />
			</div>

			{/* Comments Section */}
			<CommentSection memeId={memeId} />
		</div>
	);
}
