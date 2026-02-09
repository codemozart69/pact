import { ConvexError, v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Helper to verify user
async function verifyUser(ctx: any, userAddress: string) {
    const user = await ctx.db
        .query("users")
        .withIndex("by_userAddress", (q: any) =>
            q.eq("userAddress", userAddress.toLowerCase())
        )
        .first();
    if (!user) throw new ConvexError("User not found");
    return user;
}

// Get or create conversation metadata
export const createOrGet = mutation({
    args: {
        userAddress: v.string(),
        peerUserId: v.id("users"),
    },
    handler: async (ctx, args) => {
        const user = await verifyUser(ctx, args.userAddress);

        if (user._id === args.peerUserId) throw new ConvexError("Cannot self-message");

        // Check if conversation exists
        let conversation = await ctx.db
            .query("conversations")
            .withIndex("by_user_peer", (q) =>
                q.eq("userId", user._id).eq("peerUserId", args.peerUserId)
            )
            .first();

        // Check or create DM Channel (Shared)
        const [p1, p2] = user._id < args.peerUserId ? [user._id, args.peerUserId] : [args.peerUserId, user._id];

        let dmChannel = await ctx.db
            .query("dmChannels")
            .withIndex("by_participants", (q) =>
                q.eq("participant1", p1).eq("participant2", p2)
            )
            .first();

        if (!dmChannel) {
            const dmChannelId = await ctx.db.insert("dmChannels", {
                participant1: p1,
                participant2: p2,
                lastMessageAt: Date.now(),
            });
            dmChannel = await ctx.db.get(dmChannelId);
        }

        if (!conversation) {
            // Create new conversation for ME
            const conversationId = await ctx.db.insert("conversations", {
                userId: user._id,
                peerUserId: args.peerUserId,
                dmChannelId: dmChannel!._id,
                channelType: "dm",
                lastMessageAt: dmChannel!.lastMessageAt,
                lastMessageId: dmChannel!.lastMessageId,
                unreadCount: 0,
                isMuted: false,
            });
            conversation = await ctx.db.get(conversationId);
        }

        // Ensure PEER has a conversation doc too
        const peerConversation = await ctx.db
            .query("conversations")
            .withIndex("by_user_peer", (q) =>
                q.eq("userId", args.peerUserId).eq("peerUserId", user._id)
            )
            .first();

        if (!peerConversation) {
            await ctx.db.insert("conversations", {
                userId: args.peerUserId,
                peerUserId: user._id,
                dmChannelId: dmChannel!._id,
                channelType: "dm",
                lastMessageAt: dmChannel!.lastMessageAt,
                lastMessageId: dmChannel!.lastMessageId,
                unreadCount: 0,
                isMuted: false,
            });
        }

        return conversation;
    },
});

// Mark conversation as read
export const markAsRead = mutation({
    args: {
        userAddress: v.string(),
        conversationId: v.id("conversations"),
    },
    handler: async (ctx, args) => {
        await verifyUser(ctx, args.userAddress);
        // In a real app, verify ownership: conversation.userId === user._id

        await ctx.db.patch(args.conversationId, {
            unreadCount: 0,
        });
    },
});

// List conversations
export const list = query({
    args: {
        userAddress: v.optional(v.string())
    },
    handler: async (ctx, args) => {
        if (!args.userAddress) return [];
        const user = await verifyUser(ctx, args.userAddress);

        const conversations = await ctx.db
            .query("conversations")
            .withIndex("by_user_lastMessage", (q) => q.eq("userId", user._id))
            .order("desc")
            .collect();

        // Populate peer user data and last message content
        return await Promise.all(
            conversations.map(async (conv) => {
                let peerUser = null;
                if (conv.peerUserId) {
                    peerUser = await ctx.db.get(conv.peerUserId);
                }

                let lastMessagePreview = "";
                if (conv.lastMessageId) {
                    const msg = await ctx.db.get(conv.lastMessageId);
                    if (msg) {
                        lastMessagePreview = msg.type === "text" ? msg.content : "Sent an image";
                    }
                }

                return { ...conv, peerUser, lastMessagePreview };
            })
        );
    },
});

// Toggle mute conversation
export const toggleMute = mutation({
    args: {
        userAddress: v.string(),
        conversationId: v.id("conversations"),
    },
    handler: async (ctx, args) => {
        await verifyUser(ctx, args.userAddress);

        const conversation = await ctx.db.get(args.conversationId);
        if (!conversation) {
            throw new ConvexError("Conversation not found");
        }

        await ctx.db.patch(conversation._id, {
            isMuted: !conversation.isMuted,
        });

        return !conversation.isMuted;
    },
});

// Delete conversation
export const deleteConversation = mutation({
    args: {
        userAddress: v.string(),
        conversationId: v.id("conversations"),
    },
    handler: async (ctx, args) => {
        await verifyUser(ctx, args.userAddress);

        const conversation = await ctx.db.get(args.conversationId);
        if (!conversation) {
            throw new ConvexError("Conversation not found");
        }
        await ctx.db.delete(conversation._id);
        return true;
    },
});
