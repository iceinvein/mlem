import {
	Button,
	Modal,
	ModalBody,
	ModalContent,
	ModalFooter,
	ModalHeader,
} from "@heroui/react";
import { SignInForm } from "../SignInForm";

interface SignInPromptModalProps {
	isOpen: boolean;
	onClose: () => void;
	action: string;
}

export function SignInPromptModal({
	isOpen,
	onClose,
	action,
}: SignInPromptModalProps) {
	return (
		<Modal isOpen={isOpen} onClose={onClose} size="md">
			<ModalContent>
				<ModalHeader className="flex flex-col gap-1">
					<h2 className="font-bold text-xl">Sign in required</h2>
					<p className="font-normal text-default-600 text-sm">
						You need to sign in to {action}
					</p>
				</ModalHeader>
				<ModalBody>
					<SignInForm />
				</ModalBody>
				<ModalFooter>
					<Button variant="light" onPress={onClose}>
						Cancel
					</Button>
				</ModalFooter>
			</ModalContent>
		</Modal>
	);
}
