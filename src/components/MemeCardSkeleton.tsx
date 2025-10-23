export function MemeCardSkeleton() {
	return (
		<article className="animate-pulse border-gray-200 border-b bg-gray-50 dark:border-gray-800 dark:bg-gray-950">
			{/* Header with Author */}
			<div className="flex items-center justify-between px-4 py-3">
				<div className="flex items-center gap-3">
					{/* Avatar */}
					<div className="h-8 w-8 shrink-0 rounded-full bg-gray-200 dark:bg-gray-800" />
					<div className="flex flex-col gap-1.5">
						{/* Author name */}
						<div className="h-4 w-24 rounded-lg bg-gray-200 dark:bg-gray-800" />
						{/* Category and date */}
						<div className="h-3 w-32 rounded-lg bg-gray-200 dark:bg-gray-800" />
					</div>
				</div>
				<div className="h-8 w-8 rounded-full bg-gray-200 dark:bg-gray-800" />
			</div>

			{/* Title */}
			<div className="space-y-2 px-4 pb-3">
				<div className="h-6 w-3/4 rounded-lg bg-gray-200 dark:bg-gray-800" />
				<div className="h-6 w-1/2 rounded-lg bg-gray-200 dark:bg-gray-800" />
			</div>

			{/* Image */}
			<div
				className="mx-4 h-[400px] w-full rounded-2xl bg-gray-200 dark:bg-gray-800"
				style={{ width: "calc(100% - 2rem)" }}
			/>

			{/* Actions */}
			<div className="px-4 py-3">
				<div className="mb-3 flex items-center gap-4">
					<div className="h-6 w-16 rounded-lg bg-gray-200 dark:bg-gray-800" />
					<div className="h-6 w-16 rounded-lg bg-gray-200 dark:bg-gray-800" />
					<div className="h-6 w-16 rounded-lg bg-gray-200 dark:bg-gray-800" />
				</div>

				{/* Tags */}
				<div className="flex flex-wrap gap-2">
					<div className="h-5 w-16 rounded-full bg-gray-200 dark:bg-gray-800" />
					<div className="h-5 w-20 rounded-full bg-gray-200 dark:bg-gray-800" />
					<div className="h-5 w-24 rounded-full bg-gray-200 dark:bg-gray-800" />
				</div>
			</div>
		</article>
	);
}
