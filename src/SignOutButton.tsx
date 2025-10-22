"use client";
import { useAuthActions } from "@convex-dev/auth/react";
import { Button } from "@heroui/react";
import { useConvexAuth } from "convex/react";
import { AnimatePresence, motion } from "framer-motion";
import { LogOut } from "lucide-react";

export function SignOutButton() {
	const { isAuthenticated } = useConvexAuth();
	const { signOut } = useAuthActions();

	return (
		<AnimatePresence>
			{isAuthenticated && (
				<motion.div
					initial={{ opacity: 0, scale: 0.8 }}
					animate={{ opacity: 1, scale: 1 }}
					exit={{ opacity: 0, scale: 0.8 }}
					transition={{
						type: "spring",
						stiffness: 200,
						damping: 20,
					}}
				>
					<Button
						variant="bordered"
						onPress={() => void signOut()}
						startContent={<LogOut className="h-4 w-4" />}
					>
						Sign out
					</Button>
				</motion.div>
			)}
		</AnimatePresence>
	);
}
