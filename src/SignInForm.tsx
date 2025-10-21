"use client";
import { useAuthActions } from "@convex-dev/auth/react";
import { useState } from "react";
import { toast } from "sonner";
import { Button, Input, Link, Divider } from "@heroui/react";

export function SignInForm() {
  const { signIn } = useAuthActions();
  const [flow, setFlow] = useState<"signIn" | "signUp">("signIn");
  const [submitting, setSubmitting] = useState(false);

  return (
    <div className="w-full">
      <form
        className="flex flex-col gap-4"
        onSubmit={(e) => {
          e.preventDefault();
          setSubmitting(true);
          const formData = new FormData(e.target as HTMLFormElement);
          formData.set("flow", flow);
          void signIn("password", formData).catch((error) => {
            let toastTitle = "";
            if (error.message.includes("Invalid password")) {
              toastTitle = "Invalid password. Please try again.";
            } else {
              toastTitle =
                flow === "signIn"
                  ? "Could not sign in, did you mean to sign up?"
                  : "Could not sign up, did you mean to sign in?";
            }
            toast.error(toastTitle);
            setSubmitting(false);
          });
        }}
      >
        <Input
          type="email"
          name="email"
          label="Email"
          placeholder="Enter your email"
          isRequired
        />
        <Input
          type="password"
          name="password"
          label="Password"
          placeholder="Enter your password"
          isRequired
        />
        <Button color="primary" type="submit" isLoading={submitting}>
          {flow === "signIn" ? "Sign in" : "Sign up"}
        </Button>
        <div className="text-center text-sm">
          <span className="text-default-600">
            {flow === "signIn"
              ? "Don't have an account? "
              : "Already have an account? "}
          </span>
          <Link
            as="button"
            type="button"
            size="sm"
            onPress={() => setFlow(flow === "signIn" ? "signUp" : "signIn")}
          >
            {flow === "signIn" ? "Sign up instead" : "Sign in instead"}
          </Link>
        </div>
      </form>
      <Divider className="my-4" />
      <Button
        variant="bordered"
        className="w-full"
        onPress={() => void signIn("anonymous")}
      >
        Sign in anonymously
      </Button>
    </div>
  );
}
