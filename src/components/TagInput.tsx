import { Chip, Input } from "@heroui/react";
import { X } from "lucide-react";
import { useState, type KeyboardEvent } from "react";

interface TagInputProps {
  tags: string[];
  onTagsChange: (tags: string[]) => void;
  placeholder?: string;
  maxTags?: number;
  label?: string;
  description?: string;
}

export function TagInput({
  tags,
  onTagsChange,
  placeholder = "Add a tag...",
  maxTags = 10,
  label,
  description,
}: TagInputProps) {
  const [inputValue, setInputValue] = useState("");

  const addTag = (tag: string) => {
    const trimmedTag = tag.trim().toLowerCase();
    
    // Validate tag
    if (!trimmedTag) return;
    if (tags.includes(trimmedTag)) return;
    if (tags.length >= maxTags) return;
    if (trimmedTag.length > 20) return;
    
    onTagsChange([...tags, trimmedTag]);
    setInputValue("");
  };

  const removeTag = (tagToRemove: string) => {
    onTagsChange(tags.filter(tag => tag !== tagToRemove));
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addTag(inputValue);
    } else if (e.key === "Backspace" && !inputValue && tags.length > 0) {
      // Remove last tag on backspace if input is empty
      removeTag(tags[tags.length - 1]);
    } else if (e.key === "," || e.key === " ") {
      e.preventDefault();
      addTag(inputValue);
    }
  };

  return (
    <div className="space-y-2">
      {label && (
        <label className="text-sm font-semibold text-gray-900 dark:text-gray-100">
          {label}
        </label>
      )}
      
      <div className="min-h-[44px] p-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl flex flex-wrap gap-2 items-center">
        {tags.map((tag) => (
          <Chip
            key={tag}
            onClose={() => removeTag(tag)}
            className="bg-black dark:bg-white text-white dark:text-black font-medium"
            size="sm"
            radius="full"
            closeButton={
              <button
                type="button"
                className="ml-1 hover:bg-white/20 dark:hover:bg-black/20 rounded-full p-0.5"
              >
                <X className="w-3 h-3" />
              </button>
            }
          >
            #{tag}
          </Chip>
        ))}
        
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={tags.length === 0 ? placeholder : ""}
          disabled={tags.length >= maxTags}
          className="flex-1 min-w-[120px] bg-transparent outline-none text-sm text-gray-900 dark:text-gray-100 placeholder:text-gray-400"
        />
      </div>
      
      {description && (
        <p className="text-xs text-gray-500">
          {description}
        </p>
      )}
      
      <p className="text-xs text-gray-400">
        {tags.length}/{maxTags} tags • Press Enter, Space, or Comma to add
      </p>
    </div>
  );
}
