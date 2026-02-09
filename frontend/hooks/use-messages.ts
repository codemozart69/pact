"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useState, useCallback } from "react";
import { toast } from "sonner";
import { useAppKitAccount } from "@reown/appkit/react";

export function useMessages(
    conversationId?: Id<"conversations">,
    groupId?: Id<"groups">
) {
    const { address } = useAppKitAccount();
    const sendMessageMutation = useMutation(api.messages.send);

    const messages = useQuery(api.messages.list, {
        userAddress: address,
        conversationId,
        groupId,
        paginationOpts: {
            numItems: 50,
            cursor: null,
        },
    });

    const [isSending, setIsSending] = useState(false);

    const sendMessage = useCallback(async (content: string, type: "text" | "image" = "text") => {
        if (!content.trim()) return;
        if (!address) {
            toast.error("Please connect your wallet");
            return;
        }

        setIsSending(true);
        try {
            await sendMessageMutation({
                userAddress: address,
                conversationId,
                groupId,
                content,
                type,
            });
        } catch (error) {
            console.error("Failed to send message:", error);
            toast.error("Failed to send message");
        } finally {
            setIsSending(false);
        }
    }, [conversationId, groupId, sendMessageMutation, address]);

    // No reactions for now in this iteration
    const sendReaction = async () => {
        toast.info("Reactions coming soon!");
    };

    const messagesList = messages?.page || [];
    // Convex returns descending (newest first), but we want to display ascending (oldest first)
    const sortedMessages = [...messagesList].reverse();

    return {
        messages: sortedMessages,
        isLoading: messages === undefined,
        isSending,
        sendMessage,
        sendReaction,
        peerUser: undefined, // Only relevant for DMs if we want to show peer info here, but usually passed in
        loadMore: () => { console.log("Load more not implemented yet"); }
    };
}
