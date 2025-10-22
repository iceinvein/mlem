import {
	Avatar,
	Button,
	Card,
	CardBody,
	CardHeader,
	Chip,
	Input,
	Modal,
	ModalBody,
	ModalContent,
	Select,
	SelectItem,
} from "@heroui/react";
import { useMutation, useQuery } from "convex/react";
import {
	Crown,
	Search,
	Shield,
	ShieldOff,
	Trash2,
	User,
	Users,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";

export function AdminDashboard() {
	const isAdmin = useQuery(api.roles.checkIsAdmin);
	const allUsers = useQuery(
		api.roles.getAllUsers,
		isAdmin ? undefined : "skip",
	);
	const assignRole = useMutation(api.roles.assignRole);
	const loggedInUser = useQuery(api.auth.loggedInUser);
	const initializeFirstAdmin = useMutation(api.roles.initializeFirstAdmin);
	const deleteUser = useMutation(api.roles.deleteUser);

	const [searchQuery, setSearchQuery] = useState("");
	const [filterRole, setFilterRole] = useState<
		"all" | "user" | "moderator" | "admin"
	>("all");
	const [deletingUserId, setDeletingUserId] = useState<Id<"users"> | null>(
		null,
	);

	const isLoadingAuth = isAdmin === undefined;
	const isLoadingUsers = !allUsers;

	const handleAssignRole = async (
		userId: Id<"users">,
		role: "user" | "moderator" | "admin",
	) => {
		try {
			await assignRole({ targetUserId: userId, role });
			toast.success("Role updated successfully");
		} catch (error: unknown) {
			const errorMessage =
				error instanceof Error ? error.message : "Failed to update role";
			toast.error(errorMessage);
		}
	};

	const handleInitializeAdmin = async () => {
		try {
			await initializeFirstAdmin();
			toast.success("You are now the first admin!");
		} catch (error: unknown) {
			const errorMessage =
				error instanceof Error ? error.message : "Failed to initialize admin";
			toast.error(errorMessage);
		}
	};

	const handleDeleteUser = async () => {
		if (!deletingUserId) return;

		try {
			await deleteUser({ targetUserId: deletingUserId });
			toast.success("User deleted successfully");
			setDeletingUserId(null);
		} catch (error: unknown) {
			const errorMessage =
				error instanceof Error ? error.message : "Failed to delete user";
			toast.error(errorMessage);
		}
	};

	const getRoleIcon = (role: string) => {
		switch (role) {
			case "admin":
				return <Crown className="h-4 w-4" />;
			case "moderator":
				return <Shield className="h-4 w-4" />;
			default:
				return <User className="h-4 w-4" />;
		}
	};

	const getRoleColor = (role: string) => {
		switch (role) {
			case "admin":
				return "warning";
			case "moderator":
				return "primary";
			default:
				return "default";
		}
	};

	const filteredUsers = allUsers?.filter((user) => {
		const matchesSearch =
			user.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
			user.name?.toLowerCase().includes(searchQuery.toLowerCase());
		const matchesRole = filterRole === "all" || user.role === filterRole;
		return matchesSearch && matchesRole;
	});

	const roleStats = allUsers?.reduce(
		(acc, user) => {
			acc[user.role] = (acc[user.role] || 0) + 1;
			return acc;
		},
		{} as Record<string, number>,
	);

	return (
		<div className="mx-auto max-w-[600px] animate-fade-in px-4 py-6">
			<div className="mb-6 flex items-center gap-3">
				<Crown className="h-8 w-8 text-gray-900 dark:text-white" />
				<h2 className="font-black text-3xl text-gray-900 dark:text-white">
					Admin Panel
				</h2>
			</div>

			{!isLoadingAuth && isAdmin === false ? (
				<div className="space-y-6">
					<div className="rounded-3xl border border-gray-200 bg-gray-50 py-16 text-center dark:border-gray-800 dark:bg-gray-900">
						<ShieldOff className="mx-auto mb-4 h-20 w-20 text-gray-400 dark:text-gray-600" />
						<h2 className="mb-3 font-bold text-2xl text-gray-900 dark:text-gray-100">
							Admin Access Required
						</h2>
						<p className="mb-4 px-6 text-gray-600 dark:text-gray-400">
							You don't have permission to access the admin panel.
						</p>
						<p className="mb-6 px-6 text-gray-500 text-sm">
							Only administrators can manage user roles and system settings.
						</p>
					</div>

					<Card className="border-warning bg-warning-50 dark:bg-warning-50/10">
						<CardHeader>
							<h3 className="font-semibold text-warning-700 dark:text-warning-500">
								First Time Setup
							</h3>
						</CardHeader>
						<CardBody className="gap-3">
							<p className="text-sm text-warning-700 dark:text-warning-400">
								No admin exists yet. Click below to become the first
								administrator and manage the system.
							</p>
							<Button
								className="bg-gray-900 font-bold text-white dark:bg-gray-100 dark:text-gray-900"
								onPress={handleInitializeAdmin}
								startContent={<Crown className="h-4 w-4" />}
								size="lg"
								radius="full"
							>
								Become Admin
							</Button>
						</CardBody>
					</Card>
				</div>
			) : isLoadingAuth || isLoadingUsers ? (
				<div className="animate-pulse space-y-4">
					<div className="grid grid-cols-3 gap-3">
						<div className="h-20 rounded-2xl bg-gray-200 dark:bg-gray-800" />
						<div className="h-20 rounded-2xl bg-gray-200 dark:bg-gray-800" />
						<div className="h-20 rounded-2xl bg-gray-200 dark:bg-gray-800" />
					</div>
					<div className="h-12 rounded-full bg-gray-200 dark:bg-gray-800" />
					<div className="space-y-3">
						<div className="h-24 rounded-2xl bg-gray-200 dark:bg-gray-800" />
						<div className="h-24 rounded-2xl bg-gray-200 dark:bg-gray-800" />
						<div className="h-24 rounded-2xl bg-gray-200 dark:bg-gray-800" />
					</div>
				</div>
			) : (
				<>
					{/* Stats Cards */}
					<div className="mb-6 grid grid-cols-3 gap-3">
						<Card className="border border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-gray-900">
							<CardBody className="items-center justify-center py-4">
								<Users className="mb-2 h-6 w-6 text-gray-600 dark:text-gray-400" />
								<p className="font-black text-2xl text-gray-900 dark:text-gray-100">
									{allUsers?.length || 0}
								</p>
								<p className="font-medium text-gray-600 text-xs dark:text-gray-400">
									Total Users
								</p>
							</CardBody>
						</Card>

						<Card className="border border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-gray-900">
							<CardBody className="items-center justify-center py-4">
								<Shield className="mb-2 h-6 w-6 text-gray-600 dark:text-gray-400" />
								<p className="font-black text-2xl text-gray-900 dark:text-gray-100">
									{roleStats?.moderator || 0}
								</p>
								<p className="font-medium text-gray-600 text-xs dark:text-gray-400">
									Moderators
								</p>
							</CardBody>
						</Card>

						<Card className="border border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-gray-900">
							<CardBody className="items-center justify-center py-4">
								<Crown className="mb-2 h-6 w-6 text-gray-600 dark:text-gray-400" />
								<p className="font-black text-2xl text-gray-900 dark:text-gray-100">
									{roleStats?.admin || 0}
								</p>
								<p className="font-medium text-gray-600 text-xs dark:text-gray-400">
									Admins
								</p>
							</CardBody>
						</Card>
					</div>

					{/* Search and Filter */}
					<div className="mb-6 space-y-3">
						<Input
							placeholder="Search users by email or name..."
							value={searchQuery}
							onValueChange={setSearchQuery}
							startContent={<Search className="h-4 w-4 text-gray-400" />}
							size="lg"
							radius="full"
							classNames={{
								input: "text-gray-900 dark:text-gray-100",
								inputWrapper:
									"bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800",
							}}
						/>

						<div className="scrollbar-hide flex gap-2 overflow-x-auto pb-2">
							{[
								{ value: "all", label: "All Users" },
								{ value: "user", label: "Users" },
								{ value: "moderator", label: "Moderators" },
								{ value: "admin", label: "Admins" },
							].map((filter) => (
								<Chip
									key={filter.value}
									onClick={() =>
										setFilterRole(filter.value as typeof filterRole)
									}
									className={`cursor-pointer transition-all ${
										filterRole === filter.value
											? "bg-gray-900 font-bold text-white dark:bg-gray-100 dark:text-gray-900"
											: "bg-gray-100 text-gray-700 dark:bg-gray-900 dark:text-gray-300"
									}`}
									radius="full"
								>
									{filter.label}
								</Chip>
							))}
						</div>
					</div>

					{/* User List */}
					<div className="space-y-3">
						{filteredUsers && filteredUsers.length > 0 ? (
							filteredUsers.map((user, index) => (
								<Card
									key={user._id}
									className="animate-slide-up border border-gray-200 bg-gray-50 shadow-lg dark:border-gray-800 dark:bg-gray-900"
									style={{ animationDelay: `${index * 50}ms` }}
								>
									<CardBody className="gap-3">
										<div className="flex items-start gap-3">
											<Avatar
												name={user.name || user.email}
												className="flex-shrink-0 bg-gray-900 text-white dark:bg-gray-100 dark:text-gray-900"
												size="md"
											/>
											<div className="min-w-0 flex-1">
												<div className="mb-1 flex items-center gap-2">
													<p className="truncate font-semibold text-gray-900 dark:text-gray-100">
														{user.name || "Anonymous"}
													</p>
													<Chip
														size="sm"
														color={getRoleColor(user.role)}
														variant="flat"
														startContent={getRoleIcon(user.role)}
													>
														{user.role}
													</Chip>
													{user._id === loggedInUser?._id && (
														<Chip size="sm" variant="flat" color="success">
															You
														</Chip>
													)}
												</div>
												<p className="truncate text-gray-600 text-sm dark:text-gray-400">
													{user.email}
												</p>
												{user.assignedAt && (
													<p className="mt-1 text-gray-500 text-xs">
														Role assigned:{" "}
														{new Date(user.assignedAt).toLocaleDateString()}
													</p>
												)}
											</div>
										</div>

										{user._id !== loggedInUser?._id && (
											<>
												<Select
													label="Change Role"
													selectionMode="single"
													selectedKeys={new Set([user.role])}
													onSelectionChange={(keys) => {
														const selected = Array.from(keys)[0] as
															| "user"
															| "moderator"
															| "admin";
														if (selected && selected !== user.role) {
															handleAssignRole(user._id, selected);
														}
													}}
													size="sm"
													radius="full"
													classNames={{
														trigger:
															"bg-gray-100 dark:bg-gray-950 border border-gray-200 dark:border-gray-800",
													}}
												>
													<SelectItem
														key="user"
														textValue="User"
														startContent={<User className="h-4 w-4" />}
													>
														User
													</SelectItem>
													<SelectItem
														key="moderator"
														textValue="Moderator"
														startContent={<Shield className="h-4 w-4" />}
													>
														Moderator
													</SelectItem>
													<SelectItem
														key="admin"
														textValue="Admin"
														startContent={<Crown className="h-4 w-4" />}
													>
														Admin
													</SelectItem>
												</Select>
												<Button
													className="bg-gray-100 font-semibold text-gray-900 dark:bg-gray-900 dark:text-gray-100"
													variant="flat"
													size="sm"
													startContent={<Trash2 className="h-4 w-4" />}
													onPress={() => setDeletingUserId(user._id)}
													radius="full"
												>
													Delete User
												</Button>
											</>
										)}
									</CardBody>
								</Card>
							))
						) : (
							<div className="py-12 text-center">
								<Users className="mx-auto mb-4 h-16 w-16 text-gray-300 dark:text-gray-700" />
								<p className="mb-2 text-gray-500 dark:text-gray-400">
									No users found
								</p>
								<p className="text-gray-400 text-sm dark:text-gray-600">
									Try adjusting your search or filter
								</p>
							</div>
						)}
					</div>

					<div className="mt-8 rounded-2xl border border-gray-200 bg-gray-100 p-5 dark:border-gray-800 dark:bg-gray-900">
						<h3 className="mb-2 font-bold text-base text-gray-900 dark:text-gray-100">
							About Role Management
						</h3>
						<p className="mb-3 text-gray-600 text-sm leading-relaxed dark:text-gray-400">
							Manage user permissions and access levels across the platform.
						</p>
						<div className="space-y-2 text-gray-600 text-sm dark:text-gray-400">
							<div className="flex items-start gap-2">
								<User className="mt-0.5 h-4 w-4 flex-shrink-0" />
								<p>
									<span className="font-semibold">Users:</span> Can view and
									interact with memes
								</p>
							</div>
							<div className="flex items-start gap-2">
								<Shield className="mt-0.5 h-4 w-4 flex-shrink-0" />
								<p>
									<span className="font-semibold">Moderators:</span> Can review
									reports and moderate content
								</p>
							</div>
							<div className="flex items-start gap-2">
								<Crown className="mt-0.5 h-4 w-4 flex-shrink-0" />
								<p>
									<span className="font-semibold">Admins:</span> Full access to
									manage users and categories
								</p>
							</div>
						</div>
					</div>
				</>
			)}

			{/* Delete User Confirmation Modal */}
			<Modal
				isOpen={!!deletingUserId}
				onClose={() => setDeletingUserId(null)}
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
							Delete User
						</h3>
					</div>
					<ModalBody className="p-4">
						<div className="space-y-3 text-center">
							<div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-900">
								<Trash2 className="h-8 w-8 text-gray-900 dark:text-gray-100" />
							</div>
							<p className="text-center font-semibold text-gray-900 dark:text-gray-100">
								Are you sure you want to delete{" "}
								<span className="font-bold">
									{allUsers?.find((u) => u._id === deletingUserId)?.email ||
										"this user"}
								</span>
								?
							</p>
							<p className="text-center text-gray-600 text-sm dark:text-gray-400">
								This will permanently delete:
							</p>
							<ul className="space-y-1 rounded-lg bg-gray-100 p-3 text-left text-gray-600 text-sm dark:bg-gray-900 dark:text-gray-400">
								<li>• User account and profile</li>
								<li>• All memes created by this user</li>
								<li>• All comments and interactions</li>
								<li>• All reports filed by this user</li>
								<li>• User preferences and settings</li>
							</ul>
							<p className="text-center font-semibold text-gray-900 text-sm dark:text-gray-100">
								This action cannot be undone!
							</p>
						</div>
					</ModalBody>
					<div className="space-y-2 border-gray-200 border-t bg-gray-50 p-4 dark:border-gray-800 dark:bg-gray-950">
						<Button
							className="w-full bg-gray-900 font-bold text-white dark:bg-gray-100 dark:text-gray-900"
							onPress={handleDeleteUser}
							size="lg"
							radius="full"
						>
							Delete Permanently
						</Button>
						<Button
							variant="flat"
							onPress={() => setDeletingUserId(null)}
							size="lg"
							className="w-full"
							radius="full"
						>
							Cancel
						</Button>
					</div>
				</ModalContent>
			</Modal>
		</div>
	);
}
