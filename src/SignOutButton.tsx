"use client";
import { useAuthActions } from "@convex-dev/auth/react";
import { useConvexAuth } from "convex/react";
import { Button } from "@heroui/react";
import { LogOut } from "lucide-react";

export function SignOutButton() {
  const { isAuthenticated } = useConvexAuth();
  const { signOut } = useAuthActions();

  if (!isAuthenticated) {
    return null;
  }

  return (
    <Button
      variant="bordered"
      onPress={() => void signOut()}
      startContent={<LogOut className="w-4 h-4" />}
    >
      Sign out
    </Button>
  );
}
