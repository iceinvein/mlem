import { Chip } from "@heroui/react";
import { X } from "lucide-react";
import { type KeyboardEvent, useState } from "react";

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
		onTagsChange(tags.filter((tag) => tag !== tagToRemove));
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
				<label className="font-semibold text-gray-900 text-sm dark:text-gray-100">
					{label}
				</label>
			)}

			<div className="flex min-h-[44px] flex-wrap items-center gap-2 rounded-xl border border-gray-200 bg-gray-50 p-2 dark:border-gray-800 dark:bg-gray-900">
				{tags.map((tag) => (
					<Chip
						key={tag}
						onClose={() => removeTag(tag)}
						className="bg-gray-900 font-medium text-white dark:bg-gray-100 dark:text-gray-900"
						size="sm"
						radius="full"
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
					className="min-w-[120px] flex-1 bg-transparent text-gray-900 text-sm outline-none placeholder:text-gray-400 dark:text-gray-100"
					autoFocus
				/>
			</div>

			{description && <p className="text-gray-500 text-xs">{description}</p>}

			<p className="text-gray-400 text-xs">
				{tags.length}/{maxTags} tags • Press Enter, Space, or Comma to add
			</p>
		</div>
	);
}
