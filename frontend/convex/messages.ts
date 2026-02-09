import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { ConvexError } from "convex/values";
import { paginationOptsValidator } from "convex/server";

// Helper to verify user (duplicated from users.ts to avoid circular deps if any, or just strictly typed here)
async function verifyUser(ctx: any, userAddress: string) {
    const user = await ctx.db
        .query("users")
        .withIndex("by_userAddress", (q: any) =>
            q.eq("userAddress", userAddress.toLowerCase())
        )
        .first();
    if (!user) throw new ConvexError("User not found: " + userAddress);
    return user;
}

// Send a message
export const send = mutation({
    args: {
        userAddress: v.string(),
        conversationId: v.optional(v.id("conversations")),
        groupId: v.optional(v.id("groups")),
        content: v.string(),
        type: v.union(v.literal("text"), v.literal("image"), v.literal("system")),
    },
    handler: async (ctx, args) => {
        // 1. Auth check
        const user = await verifyUser(ctx, args.userAddress);

        // 2. Validate destination
        if (!args.conversationId && !args.groupId) {
            throw new ConvexError("Must specify conversationId or groupId");
        }

        if (args.conversationId && args.groupId) {
            throw new ConvexError("Cannot specify both conversationId and groupId");
        }

        // 3. Permission check & Message creation
        let messageId;

        if (args.conversationId) {
            // DM Logic
            const conversation = await ctx.db.get(args.conversationId);
            if (!conversation) throw new ConvexError("Conversation not found");

            // Verify ownership
            if (conversation.userId !== user._id) {
                throw new ConvexError("Not your conversation");
            }

            if (!conversation.dmChannelId) {
                throw new ConvexError("DM Channel not found");
            }

            // Create message linked to the DM Channel
            messageId = await ctx.db.insert("messages", {
                dmChannelId: conversation.dmChannelId,
                senderId: user._id,
                content: args.content,
                type: args.type,
                createdAt: Date.now(),
            });

            // Update DM Channel metadata (Shared)
            await ctx.db.patch(conversation.dmChannelId, {
                lastMessageId: messageId,
                lastMessageAt: Date.now(),
            });

            // Update MY conversation doc
            await ctx.db.patch(args.conversationId, {
                lastMessageId: messageId,
                lastMessageAt: Date.now(),
            });

            // Update PEER'S conversation doc
            const peerConversation = await ctx.db
                .query("conversations")
                .withIndex("by_user_peer", (q) => q.eq("userId", conversation.peerUserId!).eq("peerUserId", user._id))
                .first();

            if (peerConversation) {
                await ctx.db.patch(peerConversation._id, {
                    lastMessageId: messageId,
                    lastMessageAt: Date.now(),
                    unreadCount: peerConversation.unreadCount + 1,
                    dmChannelId: conversation.dmChannelId,
                });
            } else {
                // Edge case: Create if missing
                await ctx.db.insert("conversations", {
                    userId: conversation.peerUserId!,
                    peerUserId: user._id,
                    dmChannelId: conversation.dmChannelId,
                    channelType: "dm",
                    lastMessageId: messageId,
                    lastMessageAt: Date.now(),
                    unreadCount: 1,
                    isMuted: false,
                });
            }
        }

        if (args.groupId) {
            // Group Logic
            const member = await ctx.db
                .query("groupMembers")
                .withIndex("by_group_user", (q) => q.eq("groupId", args.groupId!).eq("userId", user._id))
                .first();

            if (!member) throw new ConvexError("Not a member of this group");

            messageId = await ctx.db.insert("messages", {
                groupId: args.groupId,
                senderId: user._id,
                content: args.content,
                type: args.type,
                createdAt: Date.now(),
            });
        }

        return messageId;
    },
});

export const list = query({
    args: {
        userAddress: v.optional(v.string()), // Optional to allow skipping if not loaded yet, but enforced in handler
        conversationId: v.optional(v.id("conversations")),
        groupId: v.optional(v.id("groups")),
        paginationOpts: paginationOptsValidator,
    },
    handler: async (ctx, args) => {
        if (!args.userAddress) return { page: [], isDone: true, continueCursor: "" };

        await verifyUser(ctx, args.userAddress);
        // Note: strict member check for group list could be added here similar to send, 
        // but for now we trust groupId existence + simple query. 
        // ideally we check group membership again.

        if (args.conversationId) {
            const conversation = await ctx.db.get(args.conversationId);
            if (!conversation) throw new ConvexError("Conversation not found");

            if (conversation.channelType === "dm" && conversation.dmChannelId) {
                return await ctx.db
                    .query("messages")
                    .withIndex("by_dmChannel", (q) => q.eq("dmChannelId", conversation.dmChannelId!))
                    .order("desc")
                    .paginate(args.paginationOpts);
            }
            return { page: [], isDone: true, continueCursor: "" };
        }

        if (args.groupId) {
            return await ctx.db
                .query("messages")
                .withIndex("by_group", (q) => q.eq("groupId", args.groupId!))
                .order("desc")
                .paginate(args.paginationOpts);
        }

        return { page: [], isDone: true, continueCursor: "" };
    },
});
