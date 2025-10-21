import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useState } from "react";
import { toast } from "sonner";
import type { Id } from "../../convex/_generated/dataModel";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Textarea,
  Avatar,
  Card,
  CardBody,
} from "@heroui/react";
import { Trash2, Reply, MessageCircle } from "lucide-react";

interface CommentModalProps {
  memeId: Id<"memes">;
  isOpen: boolean;
  onClose: () => void;
  memeTitle: string;
}

export function CommentModal({ memeId, isOpen, onClose, memeTitle }: CommentModalProps) {
  const [newComment, setNewComment] = useState("");
  const [replyTo, setReplyTo] = useState<Id<"comments"> | null>(null);
  const [replyContent, setReplyContent] = useState("");

  const comments = useQuery(api.comments.getComments, { memeId });
  const addComment = useMutation(api.comments.addComment);
  const deleteComment = useMutation(api.comments.deleteComment);
  const loggedInUser = useQuery(api.auth.loggedInUser);

  const handleAddComment = async () => {
    if (!newComment.trim()) return;
    
    try {
      await addComment({
        memeId,
        content: newComment.trim(),
      });
      setNewComment("");
      toast.success("Comment added!");
    } catch {
      toast.error("Failed to add comment");
    }
  };

  const handleAddReply = async () => {
    if (!replyContent.trim() || !replyTo) return;
    
    try {
      await addComment({
        memeId,
        content: replyContent.trim(),
        parentId: replyTo,
      });
      setReplyContent("");
      setReplyTo(null);
      toast.success("Reply added!");
    } catch {
      toast.error("Failed to add reply");
    }
  };

  const handleDeleteComment = async (commentId: Id<"comments">) => {
    try {
      await deleteComment({ commentId });
      toast.success("Comment deleted");
    } catch {
      toast.error("Failed to delete comment");
    }
  };

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
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
        base: "max-w-[600px] mx-auto !h-[50vh] rounded-t-3xl mb-0 sm:mb-0",
        backdrop: "backdrop-blur-sm bg-black/50"
      }}
      scrollBehavior="inside"
    >
      <ModalContent className="bg-white dark:bg-black !h-[50vh]">
        {/* Header with drag indicator */}
        <div className="flex flex-col items-center pt-2 pb-3 border-b border-gray-200 dark:border-gray-800">
          <div className="w-10 h-1 bg-gray-300 dark:bg-gray-700 rounded-full mb-3" />
          <h3 className="text-base font-bold text-gray-900 dark:text-gray-100">
            Comments
          </h3>
        </div>

        <ModalBody className="px-0 py-0">
          {comments && comments.length > 0 ? (
            <div className="divide-y divide-gray-200 dark:divide-gray-800">
              {comments.map((comment) => (
                <div key={comment._id} className="px-4 py-4">
                  {/* Main Comment */}
                  <div className="flex gap-3">
                    <Avatar
                      size="sm"
                      name={comment.author?.name?.[0] || comment.author?.email?.[0] || "?"}
                      className="shrink-0 bg-gradient-to-br from-purple-500 to-pink-500"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <div>
                          <span className="text-sm font-bold text-gray-900 dark:text-gray-100">
                            {comment.author?.name || comment.author?.email || "Anonymous"}
                          </span>
                          <span className="text-xs text-gray-500 ml-2">
                            {new Date(comment._creationTime).toLocaleDateString()}
                          </span>
                        </div>
                        {loggedInUser?._id === comment.authorId && (
                          <Button
                            isIconOnly
                            size="sm"
                            variant="light"
                            onPress={() => handleDeleteComment(comment._id)}
                            className="shrink-0"
                          >
                            <Trash2 className="w-4 h-4 text-red-500" />
                          </Button>
                        )}
                      </div>
                      <p className="text-sm text-gray-900 dark:text-gray-100 leading-relaxed mb-2">
                        {comment.content}
                      </p>
                      <button
                        onClick={() => setReplyTo(comment._id)}
                        className="text-xs font-semibold text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                      >
                        Reply
                      </button>
                    </div>
                  </div>

                  {/* Replies */}
                  {comment.replies && comment.replies.length > 0 && (
                    <div className="ml-11 mt-3 space-y-3">
                      {comment.replies.map((reply) => (
                        <div key={reply._id} className="flex gap-3">
                          <Avatar
                            size="sm"
                            name={reply.author?.name?.[0] || reply.author?.email?.[0] || "?"}
                            className="shrink-0 bg-gradient-to-br from-blue-500 to-cyan-500"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2 mb-1">
                              <div>
                                <span className="text-sm font-bold text-gray-900 dark:text-gray-100">
                                  {reply.author?.name || reply.author?.email || "Anonymous"}
                                </span>
                                <span className="text-xs text-gray-500 ml-2">
                                  {new Date(reply._creationTime).toLocaleDateString()}
                                </span>
                              </div>
                              {loggedInUser?._id === reply.authorId && (
                                <Button
                                  isIconOnly
                                  size="sm"
                                  variant="light"
                                  onPress={() => handleDeleteComment(reply._id)}
                                  className="shrink-0"
                                >
                                  <Trash2 className="w-3 h-3 text-red-500" />
                                </Button>
                              )}
                            </div>
                            <p className="text-sm text-gray-900 dark:text-gray-100 leading-relaxed">
                              {reply.content}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Reply Input */}
                  {replyTo === comment._id && (
                    <div className="ml-11 mt-3 space-y-2">
                      <Textarea
                        value={replyContent}
                        onValueChange={setReplyContent}
                        placeholder="Write a reply..."
                        minRows={2}
                        autoFocus
                        classNames={{
                          inputWrapper: "bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-800"
                        }}
                      />
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          className="bg-black dark:bg-white text-white dark:text-black font-bold"
                          onPress={handleAddReply}
                          isDisabled={!replyContent.trim()}
                          radius="full"
                        >
                          Reply
                        </Button>
                        <Button
                          size="sm"
                          variant="flat"
                          onPress={() => {
                            setReplyTo(null);
                            setReplyContent("");
                          }}
                          radius="full"
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-16 px-4">
              <div className="flex justify-center mb-3">
                <MessageCircle className="w-16 h-16 text-gray-400" strokeWidth={1.5} />
              </div>
              <p className="text-gray-900 dark:text-gray-100 font-bold mb-1">No comments yet</p>
              <p className="text-sm text-gray-500">Be the first to comment!</p>
            </div>
          )}
        </ModalBody>

        {/* Fixed Comment Input at Bottom */}
        <div className="border-t border-gray-200 dark:border-gray-800 p-4 bg-white dark:bg-black">
          <div className="flex gap-3 items-end">
            <Textarea
              value={newComment}
              onValueChange={setNewComment}
              placeholder="Add a comment..."
              minRows={1}
              maxRows={4}
              classNames={{
                inputWrapper: "bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-800",
                input: "text-sm"
              }}
              className="flex-1"
            />
            <Button
              isIconOnly
              className={`shrink-0 ${
                newComment.trim() 
                  ? "bg-black dark:bg-white text-white dark:text-black" 
                  : "bg-gray-200 dark:bg-gray-800 text-gray-400"
              }`}
              onPress={handleAddComment}
              isDisabled={!newComment.trim()}
              radius="full"
              size="lg"
            >
              <Reply className="w-5 h-5 rotate-180" />
            </Button>
          </div>
        </div>
      </ModalContent>
    </Modal>
  );
}
