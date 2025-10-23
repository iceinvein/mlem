import { Button, Modal, ModalBody, ModalContent } from "@heroui/react";
import { Check, Copy, Mail, MessageCircle } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import type { Id } from "../../convex/_generated/dataModel";

// Custom icons for social platforms
const FacebookIcon = () => (
	<svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
		<path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
	</svg>
);

const TwitterIcon = () => (
	<svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
		<path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
	</svg>
);

const LinkedInIcon = () => (
	<svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
		<path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
	</svg>
);

const SlackIcon = () => (
	<svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
		<path d="M5.042 15.165a2.528 2.528 0 0 1-2.52 2.523A2.528 2.528 0 0 1 0 15.165a2.527 2.527 0 0 1 2.522-2.52h2.52v2.52zM6.313 15.165a2.527 2.527 0 0 1 2.521-2.52 2.527 2.527 0 0 1 2.521 2.52v6.313A2.528 2.528 0 0 1 8.834 24a2.528 2.528 0 0 1-2.521-2.522v-6.313zM8.834 5.042a2.528 2.528 0 0 1-2.521-2.52A2.528 2.528 0 0 1 8.834 0a2.528 2.528 0 0 1 2.521 2.522v2.52H8.834zM8.834 6.313a2.528 2.528 0 0 1 2.521 2.521 2.528 2.528 0 0 1-2.521 2.521H2.522A2.528 2.528 0 0 1 0 8.834a2.528 2.528 0 0 1 2.522-2.521h6.312zM18.956 8.834a2.528 2.528 0 0 1 2.522-2.521A2.528 2.528 0 0 1 24 8.834a2.528 2.528 0 0 1-2.522 2.521h-2.522V8.834zM17.688 8.834a2.528 2.528 0 0 1-2.523 2.521 2.527 2.527 0 0 1-2.52-2.521V2.522A2.527 2.527 0 0 1 15.165 0a2.528 2.528 0 0 1 2.523 2.522v6.312zM15.165 18.956a2.528 2.528 0 0 1 2.523 2.522A2.528 2.528 0 0 1 15.165 24a2.527 2.527 0 0 1-2.52-2.522v-2.522h2.52zM15.165 17.688a2.527 2.527 0 0 1-2.52-2.523 2.526 2.526 0 0 1 2.52-2.52h6.313A2.527 2.527 0 0 1 24 15.165a2.528 2.528 0 0 1-2.522 2.523h-6.313z" />
	</svg>
);

const TeamsIcon = () => (
	<svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
		<path d="M20.625 8.25h-4.5v12h4.5c.621 0 1.125-.504 1.125-1.125v-9.75c0-.621-.504-1.125-1.125-1.125z" />
		<path d="M13.875 3.75h-9c-.621 0-1.125.504-1.125 1.125v14.25c0 .621.504 1.125 1.125 1.125h9c.621 0 1.125-.504 1.125-1.125V4.875c0-.621-.504-1.125-1.125-1.125z" />
		<circle cx="9.375" cy="9" r="2.25" />
		<path d="M6.375 15.75v-1.5c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125v1.5" />
	</svg>
);

interface ShareModalProps {
	memeId: Id<"memes">;
	memeTitle: string;
	isOpen: boolean;
	onClose: () => void;
}

export function ShareModal({
	memeId,
	memeTitle,
	isOpen,
	onClose,
}: ShareModalProps) {
	const [copied, setCopied] = useState(false);

	const postUrl = `${window.location.origin}${window.location.pathname}#/post/${memeId}`;
	const encodedUrl = encodeURIComponent(postUrl);
	const encodedTitle = encodeURIComponent(memeTitle);

	const handleCopyLink = async () => {
		try {
			await navigator.clipboard.writeText(postUrl);
			setCopied(true);
			toast.success("Link copied to clipboard!");
			setTimeout(() => setCopied(false), 2000);
		} catch {
			toast.error("Failed to copy link");
		}
	};

	const shareOptions = [
		{
			name: "Facebook",
			icon: FacebookIcon,
			url: `fb://facewebmodal/f?href=${encodedUrl}`,
			fallbackUrl: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
			color: "bg-blue-600 hover:bg-blue-700",
		},
		{
			name: "Twitter",
			icon: TwitterIcon,
			url: `twitter://post?message=${encodedTitle}%20${encodedUrl}`,
			fallbackUrl: `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`,
			color: "bg-black hover:bg-gray-800",
		},
		{
			name: "LinkedIn",
			icon: LinkedInIcon,
			url: `linkedin://shareArticle?url=${encodedUrl}`,
			fallbackUrl: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
			color: "bg-blue-700 hover:bg-blue-800",
		},
		{
			name: "WhatsApp",
			icon: MessageCircle,
			url: `whatsapp://send?text=${encodedTitle}%20${encodedUrl}`,
			fallbackUrl: `https://wa.me/?text=${encodedTitle}%20${encodedUrl}`,
			color: "bg-green-600 hover:bg-green-700",
		},
		{
			name: "Slack",
			icon: SlackIcon,
			url: `slack://share?text=${encodedTitle}%20${encodedUrl}`,
			fallbackUrl: `https://slack.com/intl/en-us/help/articles/201330256-Add-links-to-your-messages`,
			color: "bg-purple-600 hover:bg-purple-700",
		},
		{
			name: "Teams",
			icon: TeamsIcon,
			url: `msteams://share?href=${encodedUrl}&msgText=${encodedTitle}`,
			fallbackUrl: `https://teams.microsoft.com/share?href=${encodedUrl}&msgText=${encodedTitle}`,
			color: "bg-indigo-600 hover:bg-indigo-700",
		},
		{
			name: "Email",
			icon: Mail,
			url: `mailto:?subject=${encodedTitle}&body=Check%20out%20this%20meme:%20${encodedUrl}`,
			fallbackUrl: null,
			color: "bg-gray-600 hover:bg-gray-700",
		},
	];

	const handleShare = (url: string, fallbackUrl: string | null) => {
		// Try to open the app-specific URL scheme
		const iframe = document.createElement("iframe");
		iframe.style.display = "none";
		iframe.src = url;
		document.body.appendChild(iframe);

		// Set a timeout to check if the app opened
		const timeout = setTimeout(() => {
			// If we're still here after 1 second, the app didn't open
			// Fall back to web URL
			if (fallbackUrl) {
				window.open(
					fallbackUrl,
					"_blank",
					"noopener,noreferrer,width=600,height=600",
				);
			}
			document.body.removeChild(iframe);
		}, 1000);

		// Clean up if the app did open (page will blur)
		const handleBlur = () => {
			clearTimeout(timeout);
			setTimeout(() => {
				if (document.body.contains(iframe)) {
					document.body.removeChild(iframe);
				}
			}, 100);
			window.removeEventListener("blur", handleBlur);
		};

		window.addEventListener("blur", handleBlur);

		// For mailto, just open directly
		if (url.startsWith("mailto:")) {
			clearTimeout(timeout);
			document.body.removeChild(iframe);
			window.removeEventListener("blur", handleBlur);
			window.location.href = url;
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
				base: "max-w-[600px] mx-auto !h-auto rounded-t-3xl mb-0 sm:mb-0",
				backdrop: "backdrop-blur-sm bg-black/50",
			}}
		>
			<ModalContent className="bg-gray-50 dark:bg-gray-950">
				{/* Header with drag indicator */}
				<div className="flex flex-col items-center border-gray-200 border-b pt-2 pb-3 dark:border-gray-800">
					<div className="mb-3 h-1 w-10 rounded-full bg-gray-300 dark:bg-gray-700" />
					<h3 className="font-bold text-base text-gray-900 dark:text-gray-100">
						Share this meme
					</h3>
				</div>

				<ModalBody className="p-4">
					{/* Copy Link Section */}
					<div className="mb-4">
						<div className="mb-2 flex items-center justify-between rounded-xl bg-gray-100 p-3 dark:bg-gray-900">
							<span className="truncate text-gray-600 text-sm dark:text-gray-400">
								{postUrl}
							</span>
							<Button
								isIconOnly
								size="sm"
								onPress={handleCopyLink}
								className={`ml-2 shrink-0 transition-all ${
									copied
										? "bg-green-600 text-white"
										: "bg-gray-900 text-white dark:bg-gray-100 dark:text-gray-900"
								}`}
								radius="full"
							>
								{copied ? (
									<Check className="h-4 w-4" />
								) : (
									<Copy className="h-4 w-4" />
								)}
							</Button>
						</div>
					</div>

					{/* Social Media Options */}
					<div className="space-y-2">
						<p className="mb-3 font-semibold text-gray-600 text-sm dark:text-gray-400">
							Share on social media
						</p>
						{shareOptions.map((option) => (
							<Button
								key={option.name}
								fullWidth
								size="lg"
								onPress={() => handleShare(option.url, option.fallbackUrl)}
								className={`${option.color} font-semibold text-white transition-all`}
								radius="full"
								startContent={<option.icon className="h-5 w-5" />}
							>
								Share on {option.name}
							</Button>
						))}
					</div>
				</ModalBody>
			</ModalContent>
		</Modal>
	);
}
