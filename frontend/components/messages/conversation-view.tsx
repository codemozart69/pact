"use client";

import { useEffect, useRef } from "react";
import { useMessages } from "@/hooks/use-messages";
import { Loader2 } from "lucide-react";
import MessageBubble from "./message-bubble";
import MessageInput from "./message-input";
import ConversationHeader from "./conversation-header";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Id } from "@/convex/_generated/dataModel";
import { useAppKitAccount } from "@reown/appkit/react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";

interface ConversationViewProps {
    conversationId?: Id<"conversations">;
    groupId?: Id<"groups">;
    isGroup?: boolean;
    members?: { userId?: Id<"users">; userAddress?: string; name?: string; profileImageUrl?: string }[];
    onBack?: () => void;
}

export default function ConversationView({
    conversationId,
    groupId,
    isGroup = false,
    members = [],
    onBack,
}: ConversationViewProps) {
    const { messages, isLoading, isSending, sendMessage, sendReaction } = useMessages(
        conversationId,
        groupId
    );

    const handleSendMessage = async (content: string) => {
        try {
            await sendMessage(content, "text");
            return true;
        } catch (error) {
            return false;
        }
    };

    const { address } = useAppKitAccount();

    // Fetch current user to get their ID for "isFromSelf" check
    const user = useQuery(api.users.getUser, address ? { userAddress: address } : "skip");

    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Scroll to bottom when messages change
    useEffect(() => {
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
        }
    }, [messages]);

    // Auto-scroll to bottom on mount
    useEffect(() => {
        if (!isLoading && messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: "auto" });
        }
    }, [isLoading]);

    return (
        <div className="flex h-full flex-col rounded-xl border border-zinc-200 bg-white">
            {/* Header */}
            {!isGroup && (
                <ConversationHeader conversationId={conversationId} groupId={groupId} onBack={onBack} />
            )}

            {/* Messages Area */}
            <div className="relative flex-1 overflow-hidden">
                {isLoading ? (
                    <div className="flex h-full items-center justify-center">
                        <Loader2 className="h-6 w-6 animate-spin text-zinc-400" />
                    </div>
                ) : messages.length === 0 ? (
                    <div className="flex h-full items-center justify-center text-center">
                        <div className="px-6">
                            <p className="text-lg text-zinc-600">Say hi 👋</p>
                            <p className="mt-2 text-sm text-zinc-500">
                                Start the conversation
                            </p>
                        </div>
                    </div>
                ) : (
                    <ScrollArea className="h-full">
                        <div className="p-4">
                            {messages.map((message, index) => {
                                // Logic to determine if from self
                                // message.senderId is Id<"users">
                                const isFromSelf = user && message.senderId === user._id;

                                // Group messages by sender and time gaps
                                const prevMessage = messages[index - 1];
                                const isSequence = prevMessage &&
                                    prevMessage.senderId === message.senderId &&
                                    (message.createdAt - prevMessage.createdAt < 5 * 60 * 1000); // 5 min gap

                                const showTimestamp = !isSequence && (
                                    index === 0 ||
                                    (message.createdAt - (prevMessage?.createdAt || 0) > 5 * 60 * 1000)
                                );

                                const showSenderName = isGroup && !isFromSelf && !isSequence;

                                // Find sender name and avatar from members list
                                const senderMember = members.find(m => m.userId === message.senderId);
                                const senderNameDisplay = senderMember?.name || (isFromSelf ? "You" : "Unknown User");
                                const senderAvatar = senderMember?.profileImageUrl;

                                const isNewDay = !prevMessage || new Date(message.createdAt).toDateString() !== new Date(prevMessage.createdAt).toDateString();

                                return (
                                    <div key={message._id}>
                                        {isNewDay && (
                                            <div className="my-4 flex justify-center">
                                                <span className="rounded-full bg-zinc-100 px-3 py-1 text-xs text-zinc-500 dark:bg-zinc-800">
                                                    {new Date(message.createdAt).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
                                                </span>
                                            </div>
                                        )}
                                        <MessageBubble
                                            message={{
                                                id: message._id,
                                                content: message.content,
                                                senderId: message.senderId,
                                                createdAt: message.createdAt,
                                                isFromSelf: !!isFromSelf,
                                                reactions: undefined // TODO: Add reaction support
                                            }}
                                            showTimestamp={showTimestamp}
                                            senderName={showSenderName ? senderNameDisplay : undefined}
                                            senderAvatar={isGroup && !isFromSelf && !isSequence ? senderAvatar : undefined}
                                            onReact={sendReaction}
                                        />
                                    </div>
                                );
                            })}
                            <div ref={messagesEndRef} />
                        </div>
                    </ScrollArea>
                )}
            </div>

            {/* Input */}
            <MessageInput onSend={handleSendMessage} isSending={isSending} />
        </div>
    );
}