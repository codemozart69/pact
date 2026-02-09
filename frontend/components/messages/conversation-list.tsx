"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useAppKitAccount } from "@reown/appkit/react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Plus, MessageCircle, Loader2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import NewMessageDialog from "./new-message-dialog";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { Id } from "@/convex/_generated/dataModel";
import { cn } from "@/lib/utils";

interface ConversationListProps {
    autoStartUser?: any;
    onAutoStartComplete?: () => void;
}

export default function ConversationList({
    autoStartUser,
    onAutoStartComplete,
}: ConversationListProps) {
    const { address } = useAppKitAccount();
    const router = useRouter();
    const searchParams = useSearchParams();
    const currentConversationId = searchParams.get("conversation");
    const [newMessageOpen, setNewMessageOpen] = useState(false);

    const getOrCreateConversation = useMutation(api.conversations.createOrGet);
    const conversations = useQuery(api.conversations.list, { userAddress: address });
    const markAsRead = useMutation(api.conversations.markAsRead);

    // Effect 1: Auto-start conversation if user provided
    useEffect(() => {
        if (!autoStartUser || !address) return;

        const startConversation = async () => {
            try {
                // Get or create conversation metadata in Convex
                const conversation = await getOrCreateConversation({
                    userAddress: address,
                    peerUserId: autoStartUser.userId as Id<"users">,
                });

                // Navigate to conversation
                if (conversation) {
                    router.push(`/messages?conversation=${conversation._id}`);
                }

                if (onAutoStartComplete) onAutoStartComplete();
            } catch (error) {
                console.error("Failed to start conversation:", error);
                toast.error("Failed to start conversation");
                if (onAutoStartComplete) onAutoStartComplete();
            }
        };

        startConversation();
    }, [autoStartUser, address, router, getOrCreateConversation, onAutoStartComplete]);

    // Effect 2: Mark as read when entering a conversation
    useEffect(() => {
        if (currentConversationId && conversations && address) {
            const conversation = conversations.find(c => c._id === currentConversationId);
            if (conversation && conversation.unreadCount > 0) {
                markAsRead({ conversationId: conversation._id, userAddress: address })
                    .catch(err => console.error("Failed to mark as read", err));
            }
        }
    }, [currentConversationId, conversations, markAsRead, address]);

    const handleNewMessage = () => {
        setNewMessageOpen(true);
    };

    if (conversations === undefined) {
        return (
            <div className="p-4 space-y-4">
                {[...Array(5)].map((_, i) => (
                    <div key={i} className="flex items-center gap-3 animate-pulse">
                        <div className="w-10 h-10 rounded-full bg-zinc-200" />
                        <div className="flex-1 space-y-2">
                            <div className="h-4 w-1/3 bg-zinc-200 rounded" />
                            <div className="h-3 w-1/2 bg-zinc-200 rounded" />
                        </div>
                    </div>
                ))}
            </div>
        );
    }

    // Wrap the content in the same container structure as before
    return (
        <div className="flex h-full flex-col rounded-xl border border-zinc-200 bg-white">
            {/* Header */}
            <div className="flex items-center justify-between border-b p-4">
                <h2 className="text-lg font-semibold">Messages</h2>
                <Button
                    size="sm"
                    variant="ghost"
                    onClick={handleNewMessage}
                    className="h-8 w-8 p-0"
                >
                    <Plus className="h-4 w-4" />
                </Button>
            </div>

            {/* Conversation List */}
            <div className="flex-1 overflow-y-auto">
                {conversations.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-center px-6">
                        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-zinc-100">
                            <MessageCircle className="h-8 w-8 text-zinc-400" />
                        </div>
                        <h3 className="mb-2 font-semibold text-zinc-900">No messages yet</h3>
                        <p className="mb-4 text-sm text-zinc-500">
                            Start a conversation with your friends
                        </p>
                        <Button onClick={handleNewMessage}>
                            <Plus className="mr-2 h-4 w-4" />
                            New Message
                        </Button>
                    </div>
                ) : (
                    conversations.map((conversation) => {
                        const isActive = currentConversationId === conversation._id;
                        const peer = conversation.peerUser;

                        if (!peer) return null;

                        return (
                            <button
                                key={conversation._id}
                                onClick={() => {
                                    if (conversation) {
                                        router.push(`/messages?conversation=${conversation._id}`);
                                    }
                                }}
                                className={cn(
                                    "flex w-full items-start gap-3 border-b px-4 py-3 text-left transition-colors",
                                    isActive
                                        ? "bg-blue-50"
                                        : "hover:bg-zinc-50"
                                )}
                            >
                                <div className="relative">
                                    <Avatar className="h-12 w-12 shrink-0">
                                        <AvatarImage src={peer.profileImageUrl} />
                                        <AvatarFallback className="bg-linear-to-br from-blue-400 to-purple-500 text-white">
                                            {peer.name?.[0] || "?"}
                                        </AvatarFallback>
                                    </Avatar>
                                    {conversation.unreadCount > 0 && (
                                        <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-blue-600 text-[10px] font-medium text-white">
                                            {conversation.unreadCount}
                                        </span>
                                    )}
                                </div>

                                <div className="min-w-0 flex-1">
                                    <div className="flex items-center justify-between gap-2">
                                        <span className={cn(
                                            "truncate font-medium",
                                            conversation.unreadCount > 0 ? "text-zinc-900" : "text-zinc-900"
                                        )}>
                                            {peer.name || "Unknown User"}
                                        </span>
                                        {conversation.lastMessageAt && (
                                            <span className="shrink-0 text-xs text-zinc-500">
                                                {formatDistanceToNow(conversation.lastMessageAt, { addSuffix: true })}
                                            </span>
                                        )}
                                    </div>
                                    <p className={cn(
                                        "truncate text-sm",
                                        conversation.unreadCount > 0 ? "font-medium text-zinc-900" : "text-zinc-600"
                                    )}>
                                        {conversation.lastMessagePreview || "No messages yet"}
                                    </p>
                                </div>
                            </button>
                        );
                    })
                )}
            </div>

            <NewMessageDialog
                open={newMessageOpen}
                onOpenChange={setNewMessageOpen}
            />
        </div>
    );
}