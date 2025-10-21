import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { toast } from "sonner";
import type { Id } from "../../convex/_generated/dataModel";
import { useState } from "react";
import { CommentModal } from "./CommentModal";
import { ReportModal } from "./ReportModal";
import { Card, CardHeader, CardBody, CardFooter, Button, Chip, Image } from "@heroui/react";
import { Heart, MessageCircle, Share2, Flag } from "lucide-react";

interface MemeCardProps {
  meme: {
    _id: Id<"memes">;
    title: string;
    imageUrl: string;
    likes: number;
    shares: number;
    comments?: number;
    userLiked: boolean;
    userShared: boolean;
    category: {
      name: string;
      icon: string;
      color: string;
    } | null;
    tags: string[];
    _creationTime: number;
  };
}

export function MemeCard({ meme }: MemeCardProps) {
  const [showComments, setShowComments] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const toggleLike = useMutation(api.memes.toggleLike);
  const shareMeme = useMutation(api.memes.shareMeme);

  const handleLike = async () => {
    try {
      await toggleLike({ memeId: meme._id });
      toast.success(meme.userLiked ? "Unliked!" : "Liked!");
    } catch {
      toast.error("Failed to update like");
    }
  };

  const handleShare = async () => {
    try {
      await shareMeme({ memeId: meme._id });
      
      if (navigator.share) {
        await navigator.share({
          title: meme.title,
          text: `Check out this meme: ${meme.title}`,
          url: window.location.href,
        });
      } else {
        await navigator.clipboard.writeText(window.location.href);
        toast.success("Link copied to clipboard!");
      }
    } catch {
      toast.error("Failed to share");
    }
  };

  return (
    <>
      <article className="bg-white dark:bg-black border-b border-gray-200 dark:border-gray-800">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            {meme.category && (
              <Chip 
                size="sm" 
                className="bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100 font-semibold"
                radius="full"
              >
                <span className="flex items-center gap-1">
                  <span>{meme.category.icon}</span>
                  {meme.category.name}
                </span>
              </Chip>
            )}
            <span className="text-xs text-gray-500">
              {new Date(meme._creationTime).toLocaleDateString()}
            </span>
          </div>
          <Button
            isIconOnly
            size="sm"
            variant="light"
            onPress={() => setShowReportModal(true)}
            aria-label="Report this content"
          >
            <Flag className="w-4 h-4" />
          </Button>
        </div>

        {/* Title */}
        <div className="px-4 pb-3">
          <h3 className="font-bold text-lg leading-tight text-gray-900 dark:text-gray-100">
            {meme.title}
          </h3>
        </div>

        {/* Image - Full width, no padding */}
        <div className="w-full bg-gray-100 dark:bg-gray-900">
          <Image
            src={meme.imageUrl}
            alt={meme.title}
            className="w-full max-h-[600px] object-contain"
            loading="lazy"
            classNames={{
              wrapper: "w-full !max-w-full"
            }}
          />
        </div>

        {/* Actions */}
        <div className="px-4 py-3">
          <div className="flex items-center gap-4 mb-3">
            <button
              onClick={handleLike}
              className="flex items-center gap-2 group"
            >
              <Heart 
                className={`w-6 h-6 transition-all ${
                  meme.userLiked 
                    ? "fill-red-500 text-red-500 scale-110" 
                    : "text-gray-900 dark:text-gray-100 group-hover:text-gray-500"
                }`} 
              />
              <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                {meme.likes}
              </span>
            </button>
            
            <button
              onClick={() => setShowComments(true)}
              className="flex items-center gap-2 group"
            >
              <MessageCircle className="w-6 h-6 text-gray-900 dark:text-gray-100 group-hover:text-gray-500" />
              <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                {meme.comments || 0}
              </span>
            </button>
            
            <button
              onClick={handleShare}
              className="flex items-center gap-2 group"
            >
              <Share2 className="w-6 h-6 text-gray-900 dark:text-gray-100 group-hover:text-gray-500" />
              <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                {meme.shares}
              </span>
            </button>
          </div>

          {/* Tags */}
          {meme.tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {meme.tags.map((tag) => (
                <span 
                  key={tag} 
                  className="text-sm text-blue-600 dark:text-blue-400 font-medium"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </article>

      <CommentModal
        memeId={meme._id}
        isOpen={showComments}
        onClose={() => setShowComments(false)}
        memeTitle={meme.title}
      />

      <ReportModal
        memeId={meme._id}
        memeTitle={meme.title}
        isOpen={showReportModal}
        onClose={() => setShowReportModal(false)}
      />
    </>
  );
}
