import { Password } from "@convex-dev/auth/providers/Password";
import { convexAuth, getAuthUserId } from "@convex-dev/auth/server";
import { query } from "./_generated/server";
import { generateUsername } from "./usernameGenerator";

export const { auth, signIn, signOut, store, isAuthenticated } = convexAuth({
	providers: [Password],
	callbacks: {
		async afterUserCreatedOrUpdated(ctx, { existingUserId, userId }) {
			// Only generate username for new users
			if (existingUserId === undefined) {
				const user = await ctx.db.get(userId);
				if (user && !user.name) {
					// Generate a unique username with collision detection
					let username = generateUsername();
					let attempts = 0;
					const maxAttempts = 10;

					// Check for collisions and retry if needed
					while (attempts < maxAttempts) {
						const existingUser = await ctx.db
							.query("users")
							.filter((q) => q.eq(q.field("name"), username))
							.first();

						if (!existingUser) {
							// Username is unique, use it
							break;
						}

						// Collision detected, generate a new one
						username = generateUsername();
						attempts++;
					}

					await ctx.db.patch(userId, { name: username });

					// Create metadata entry for tracking username changes
					await ctx.db.insert("userMetadata", {
						userId,
						hasChangedUsername: false,
					});
				}
			}
		},
	},
});

export const loggedInUser = query({
	handler: async (ctx) => {
		const userId = await getAuthUserId(ctx);
		if (!userId) {
			return null;
		}
		const user = await ctx.db.get(userId);
		if (!user) {
			return null;
		}
		return user;
	},
});
