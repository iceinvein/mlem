import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useState } from "react";
import { toast } from "sonner";
import type { Id } from "../../convex/_generated/dataModel";
import {
  Modal,
  ModalContent,
  ModalBody,
  Button,
  Input,
  Select,
  SelectItem,
  Image,
} from "@heroui/react";
import { Camera, X } from "lucide-react";
import { TagInput } from "./TagInput";

interface CreateMemeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CreateMemeModal({ isOpen, onClose }: CreateMemeModalProps) {
  const [title, setTitle] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [tags, setTags] = useState<string[]>([]);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isOptimizing, setIsOptimizing] = useState(false);

  const categories = useQuery(api.memes.getCategories);
  const createMeme = useMutation(api.memes.createMeme);
  const generateUploadUrl = useMutation(api.memes.generateUploadUrl);

  const optimizeImage = (file: File): Promise<File> => {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(file);
        return;
      }
      const img = new window.Image();

      img.onload = () => {
        const maxSize = 800;
        let { width, height } = img;

        if (width > height) {
          if (width > maxSize) {
            height = (height * maxSize) / width;
            width = maxSize;
          }
        } else {
          if (height > maxSize) {
            width = (width * maxSize) / height;
            height = maxSize;
          }
        }

        canvas.width = width;
        canvas.height = height;
        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (blob) {
              const optimizedFile = new File([blob], file.name, {
                type: 'image/jpeg',
                lastModified: Date.now(),
              });
              resolve(optimizedFile);
            } else {
              resolve(file);
            }
          },
          'image/jpeg',
          0.8
        );
      };

      img.src = URL.createObjectURL(file);
    });
  };

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        toast.error("Please select a valid image file");
        return;
      }

      if (file.size > 10 * 1024 * 1024) {
        toast.error("Image too large. Please select an image under 10MB");
        return;
      }

      setIsOptimizing(true);

      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);

      try {
        const optimizedFile = await optimizeImage(file);
        setSelectedImage(optimizedFile);

        const originalSize = (file.size / 1024 / 1024).toFixed(2);
        const optimizedSize = (optimizedFile.size / 1024 / 1024).toFixed(2);
        const savings = ((1 - optimizedFile.size / file.size) * 100).toFixed(0);

        if (optimizedFile.size < file.size) {
          toast.success(`Image optimized: ${originalSize}MB → ${optimizedSize}MB (${savings}% smaller)`);
        }
      } catch {
        setSelectedImage(file);
        toast.error("Image optimization failed, using original file");
      } finally {
        setIsOptimizing(false);
      }
    }
  };

  const handleSubmit = async () => {
    if (!title.trim() || !selectedCategory || !selectedImage) {
      toast.error("Please fill in all required fields");
      return;
    }

    setIsUploading(true);

    try {
      const postUrl = await generateUploadUrl();

      const result = await fetch(postUrl, {
        method: "POST",
        headers: { "Content-Type": selectedImage.type },
        body: selectedImage,
      });

      const json = await result.json();
      if (!result.ok) {
        throw new Error(`Upload failed: ${JSON.stringify(json)}`);
      }

      const { storageId } = json;

      await createMeme({
        title: title.trim(),
        imageUrl: storageId,
        categoryId: selectedCategory as Id<"categories">,
        tags: tags,
      });

      toast.success("Meme created successfully!");

      setTitle("");
      setSelectedCategory("");
      setTags([]);
      setSelectedImage(null);
      setImagePreview(null);
      onClose();

    } catch (error) {
      console.error("Error creating meme:", error);
      toast.error("Failed to create meme");
    } finally {
      setIsUploading(false);
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
        base: "max-w-[600px] mx-auto h-[75vh]! rounded-t-3xl mb-0 sm:mb-0",
        backdrop: "backdrop-blur-sm bg-black/50"
      }}
      scrollBehavior="inside"
    >
      <ModalContent className="bg-white dark:bg-black h-[75vh]!">
        <div className="flex flex-col items-center pt-2 pb-3 border-b border-gray-200 dark:border-gray-800">
          <div className="w-10 h-1 bg-gray-300 dark:bg-gray-700 rounded-full mb-3" />
          <h3 className="text-base font-bold text-gray-900 dark:text-gray-100">
            Create New Meme
          </h3>
        </div>
        <ModalBody className="gap-6 py-6 px-4 overflow-y-auto">
          <div>
            <p className="block text-sm font-semibold mb-3 text-gray-900 dark:text-gray-100">
              Image {isOptimizing && <span className="text-purple-600">(Optimizing...)</span>}
            </p>
            {imagePreview ? (
              <div className="relative animate-fade-in">
                <Image
                  src={imagePreview}
                  alt="Preview"
                  className="w-full h-48 object-cover rounded-2xl"
                />
                <div className="text-xs text-gray-500 mt-2">
                  {selectedImage && `${(selectedImage.size / 1024 / 1024).toFixed(2)}MB • Optimized`}
                </div>
                <Button
                  isIconOnly
                  size="sm"
                  className="absolute top-2 right-2 bg-black/70 text-white"
                  radius="full"
                  onPress={() => {
                    setSelectedImage(null);
                    setImagePreview(null);
                  }}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            ) : (
              <label htmlFor="image-upload" className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-2xl cursor-pointer hover:border-black dark:hover:border-white transition-all bg-gray-50 dark:bg-gray-900">
                <input
                  id="image-upload"
                  type="file"
                  accept="image/*"
                  onChange={handleImageSelect}
                  className="hidden"
                  disabled={isOptimizing}
                />
                <Camera className="w-12 h-12 mb-2 text-gray-400" />
                <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Upload image</span>
                <span className="text-xs text-gray-500 mt-1">Auto-optimized</span>
              </label>
            )}
          </div>

          <Input
            label="Title"
            placeholder="Enter a catchy title..."
            value={title}
            onValueChange={setTitle}
            isRequired
            size="lg"
            classNames={{
              label: "text-gray-900 dark:text-gray-100 font-semibold",
              input: "text-base",
              inputWrapper: "bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-800"
            }}
          />

          <Select
            label="Category"
            placeholder="Select a category"
            selectionMode="single"
            selectedKeys={selectedCategory ? new Set([selectedCategory]) : new Set()}
            onSelectionChange={(keys) => {
              const selected = Array.from(keys)[0];
              setSelectedCategory(selected ? String(selected) : "");
            }}
            isRequired
            size="lg"
            classNames={{
              label: "text-gray-900 dark:text-gray-100 font-semibold",
              trigger: "bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-800"
            }}
          >
            {categories?.map((category) => (
              <SelectItem key={category._id} textValue={`${category.icon} ${category.name}`}>
                {category.icon} {category.name}
              </SelectItem>
            )) || []}
          </Select>

          <TagInput
            label="Tags (optional)"
            tags={tags}
            onTagsChange={setTags}
            placeholder="Add tags..."
            maxTags={5}
            description="Add relevant tags to help people discover your meme"
          />
        </ModalBody>
        <div className="border-t border-gray-200 dark:border-gray-800 p-4 bg-white dark:bg-black space-y-2">
          <Button
            className="w-full bg-black dark:bg-white text-white dark:text-black font-bold"
            onPress={handleSubmit}
            isLoading={isUploading || isOptimizing}
            isDisabled={!title.trim() || !selectedCategory || !selectedImage}
            size="lg"
            radius="full"
          >
            {isUploading ? "Creating..." : isOptimizing ? "Optimizing..." : "Create"}
          </Button>
          <Button
            variant="flat"
            onPress={onClose}
            size="lg"
            className="w-full"
            radius="full"
          >
            Cancel
          </Button>
        </div>
      </ModalContent>
    </Modal>
  );
}
