import { Button, Input, Modal, ModalBody, ModalContent } from "@heroui/react";
import { useMutation, useQuery } from "convex/react";
import { Edit3, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";

export function CategoryManagement() {
	const categories = useQuery(api.memes.getCategories);
	const createCategory = useMutation(api.memes.createCategory);
	const updateCategory = useMutation(api.memes.updateCategory);
	const deleteCategory = useMutation(api.memes.deleteCategory);

	const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
	const [isEditModalOpen, setIsEditModalOpen] = useState(false);
	const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
	const [editingCategory, setEditingCategory] = useState<{
		id: Id<"categories">;
		name: string;
	} | null>(null);
	const [deletingCategoryId, setDeletingCategoryId] =
		useState<Id<"categories"> | null>(null);

	const [newCategory, setNewCategory] = useState({
		name: "",
	});

	const handleCreateCategory = async () => {
		if (!newCategory.name.trim()) {
			toast.error("Please enter a category name");
			return;
		}

		try {
			await createCategory(newCategory);
			toast.success("Category created successfully");
			setIsCreateModalOpen(false);
			setNewCategory({ name: "" });
		} catch (error: unknown) {
			const errorMessage =
				error instanceof Error ? error.message : "Failed to create category";
			toast.error(errorMessage);
		}
	};

	const handleUpdateCategory = async () => {
		if (!editingCategory || !editingCategory.name.trim()) {
			toast.error("Please enter a category name");
			return;
		}

		try {
			await updateCategory({
				categoryId: editingCategory.id,
				name: editingCategory.name,
			});
			toast.success("Category updated successfully");
			setIsEditModalOpen(false);
			setEditingCategory(null);
		} catch (error: unknown) {
			const errorMessage =
				error instanceof Error ? error.message : "Failed to update category";
			toast.error(errorMessage);
		}
	};

	const openDeleteModal = (categoryId: Id<"categories">) => {
		setDeletingCategoryId(categoryId);
		setIsDeleteModalOpen(true);
	};

	const handleDeleteCategory = async () => {
		if (!deletingCategoryId) return;

		try {
			await deleteCategory({ categoryId: deletingCategoryId });
			toast.success("Category deleted successfully");
			setIsDeleteModalOpen(false);
			setDeletingCategoryId(null);
		} catch (error: unknown) {
			const errorMessage =
				error instanceof Error ? error.message : "Failed to delete category";
			toast.error(errorMessage);
		}
	};

	const openEditModal = (category: { _id: Id<"categories">; name: string }) => {
		setEditingCategory({
			id: category._id,
			name: category.name,
		});
		setIsEditModalOpen(true);
	};

	if (!categories) {
		return (
			<div className="mx-auto max-w-[600px] animate-pulse px-4 py-6">
				<div className="mb-6 h-10 w-48 rounded-lg bg-gray-200 dark:bg-gray-800" />
				<div className="space-y-3">
					<div className="h-16 rounded-lg bg-gray-200 dark:bg-gray-800" />
					<div className="h-16 rounded-lg bg-gray-200 dark:bg-gray-800" />
					<div className="h-16 rounded-lg bg-gray-200 dark:bg-gray-800" />
				</div>
			</div>
		);
	}

	return (
		<>
			<div className="mx-auto max-w-[600px] animate-fade-in px-4 py-6">
				<div className="mb-6 flex items-center justify-between">
					<h2 className="font-black text-3xl text-gray-900 dark:text-white">
						Categories
					</h2>
					<Button
						color="primary"
						startContent={<Plus className="h-4 w-4" />}
						onPress={() => setIsCreateModalOpen(true)}
						radius="full"
					>
						Add Category
					</Button>
				</div>

				<div className="space-y-3">
					{categories.map((category) => (
						<div
							key={category._id}
							className="flex items-center justify-between rounded-2xl border border-gray-200 bg-gray-50 p-4 dark:border-gray-800 dark:bg-gray-900"
						>
							<p className="font-semibold text-gray-900 dark:text-gray-100">
								{category.name}
							</p>
							<div className="flex gap-2">
								<Button
									size="sm"
									variant="flat"
									isIconOnly
									onPress={() => openEditModal(category)}
									radius="full"
								>
									<Edit3 className="h-4 w-4" />
								</Button>
								<Button
									size="sm"
									variant="flat"
									color="danger"
									isIconOnly
									onPress={() => openDeleteModal(category._id)}
									radius="full"
								>
									<Trash2 className="h-4 w-4" />
								</Button>
							</div>
						</div>
					))}
				</div>

				<div className="mt-8 rounded-2xl border border-gray-200 bg-gray-100 p-5 dark:border-gray-800 dark:bg-gray-900">
					<h3 className="mb-2 font-bold text-base text-gray-900 dark:text-gray-100">
						About Categories
					</h3>
					<p className="text-gray-600 text-sm leading-relaxed dark:text-gray-400">
						Categories help organize memes and make it easier for users to find
						content they love. Categories with existing memes cannot be deleted.
					</p>
				</div>
			</div>

			{/* Create Category Modal */}
			<Modal
				isOpen={isCreateModalOpen}
				onClose={() => setIsCreateModalOpen(false)}
				placement="bottom"
				motionProps={{
					variants: {
						enter: {
							y: 0,
							transition: {
								duration: 0.3,
								ease: "easeOut",
							},
						},
						exit: {
							y: "100%",
							transition: {
								duration: 0.2,
								ease: "easeIn",
							},
						},
					},
				}}
				classNames={{
					wrapper: "items-end",
					base: "max-w-[600px] !h-auto mx-auto rounded-t-3xl mb-0 sm:mb-0",
					backdrop: "backdrop-blur-sm bg-black/50",
				}}
			>
				<ModalContent className="bg-gray-50 dark:bg-gray-950">
					<div className="flex flex-col items-center border-gray-200 border-b pt-2 pb-3 dark:border-gray-800">
						<div className="mb-3 h-1 w-10 rounded-full bg-gray-300 dark:bg-gray-700" />
						<h3 className="font-bold text-base text-gray-900 dark:text-gray-100">
							Create New Category
						</h3>
					</div>
					<ModalBody className="p-4">
						<Input
							label="Category Name"
							placeholder="e.g., Funny, Animals, Gaming"
							value={newCategory.name}
							onValueChange={(value) => setNewCategory({ name: value })}
							autoFocus
							size="lg"
						/>
					</ModalBody>
					<div className="space-y-2 border-gray-200 border-t bg-gray-50 p-4 dark:border-gray-800 dark:bg-gray-950">
						<Button
							className="w-full bg-gray-900 font-bold text-white dark:bg-gray-100 dark:text-gray-900"
							onPress={handleCreateCategory}
							size="lg"
							radius="full"
						>
							Create
						</Button>
						<Button
							variant="flat"
							onPress={() => setIsCreateModalOpen(false)}
							size="lg"
							className="w-full"
							radius="full"
						>
							Cancel
						</Button>
					</div>
				</ModalContent>
			</Modal>

			{/* Edit Category Modal */}
			<Modal
				isOpen={isEditModalOpen}
				onClose={() => setIsEditModalOpen(false)}
				placement="bottom"
				motionProps={{
					variants: {
						enter: {
							y: 0,
							transition: {
								duration: 0.3,
								ease: "easeOut",
							},
						},
						exit: {
							y: "100%",
							transition: {
								duration: 0.2,
								ease: "easeIn",
							},
						},
					},
				}}
				classNames={{
					wrapper: "items-end",
					base: "max-w-[600px] !h-auto mx-auto rounded-t-3xl mb-0 sm:mb-0",
					backdrop: "backdrop-blur-sm bg-black/50",
				}}
			>
				<ModalContent className="bg-gray-50 dark:bg-gray-950">
					<div className="flex flex-col items-center border-gray-200 border-b pt-2 pb-3 dark:border-gray-800">
						<div className="mb-3 h-1 w-10 rounded-full bg-gray-300 dark:bg-gray-700" />
						<h3 className="font-bold text-base text-gray-900 dark:text-gray-100">
							Edit Category
						</h3>
					</div>
					<ModalBody className="p-4">
						{editingCategory && (
							<Input
								label="Category Name"
								value={editingCategory.name}
								onValueChange={(value) =>
									setEditingCategory({ ...editingCategory, name: value })
								}
								autoFocus
								size="lg"
							/>
						)}
					</ModalBody>
					<div className="space-y-2 border-gray-200 border-t bg-gray-50 p-4 dark:border-gray-800 dark:bg-gray-950">
						<Button
							className="w-full bg-gray-900 font-bold text-white dark:bg-gray-100 dark:text-gray-900"
							onPress={handleUpdateCategory}
							size="lg"
							radius="full"
						>
							Update
						</Button>
						<Button
							variant="flat"
							onPress={() => setIsEditModalOpen(false)}
							size="lg"
							className="w-full"
							radius="full"
						>
							Cancel
						</Button>
					</div>
				</ModalContent>
			</Modal>

			{/* Delete Confirmation Modal */}
			<Modal
				isOpen={isDeleteModalOpen}
				onClose={() => setIsDeleteModalOpen(false)}
				placement="bottom"
				motionProps={{
					variants: {
						enter: {
							y: 0,
							transition: {
								duration: 0.3,
								ease: "easeOut",
							},
						},
						exit: {
							y: "100%",
							transition: {
								duration: 0.2,
								ease: "easeIn",
							},
						},
					},
				}}
				classNames={{
					wrapper: "items-end",
					base: "max-w-[600px] !h-auto mx-auto rounded-t-3xl mb-0 sm:mb-0",
					backdrop: "backdrop-blur-sm bg-black/50",
				}}
			>
				<ModalContent className="bg-gray-50 dark:bg-gray-950">
					<div className="flex flex-col items-center border-gray-200 border-b pt-2 pb-3 dark:border-gray-800">
						<div className="mb-3 h-1 w-10 rounded-full bg-gray-300 dark:bg-gray-700" />
						<h3 className="font-bold text-base text-gray-900 dark:text-gray-100">
							Delete Category
						</h3>
					</div>
					<ModalBody className="p-4">
						<p className="text-center text-gray-900 dark:text-gray-100">
							Are you sure you want to delete{" "}
							<span className="font-bold">
								{categories.find((c) => c._id === deletingCategoryId)?.name}
							</span>
							?
						</p>
						<p className="mt-2 text-center text-gray-500 text-sm">
							This action cannot be undone. Categories with existing memes
							cannot be deleted.
						</p>
					</ModalBody>
					<div className="space-y-2 border-gray-200 border-t bg-gray-50 p-4 dark:border-gray-800 dark:bg-gray-950">
						<Button
							className="w-full bg-red-600 font-bold text-white"
							onPress={handleDeleteCategory}
							size="lg"
							radius="full"
						>
							Delete
						</Button>
						<Button
							variant="flat"
							onPress={() => setIsDeleteModalOpen(false)}
							size="lg"
							className="w-full"
							radius="full"
						>
							Cancel
						</Button>
					</div>
				</ModalContent>
			</Modal>
		</>
	);
}
