"use client";

import { cn } from "@/lib/utils";
import MessageReactions from "./message-reactions";
import {
    ContextMenu,
    ContextMenuContent,
    ContextMenuItem,
    ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { Copy, Check } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface MessageBubbleProps {
    message: {
        id: string;
        content: string;
        senderId: string;
        createdAt: number;
        isFromSelf: boolean;
        reactions?: Record<string, number> | Record<string, { count: number; reactors: string[]; mine: boolean }>;
    };
    reactions?: Record<string, number>;

    showTimestamp?: boolean;
    senderName?: string;
    senderAvatar?: string;
    onReact?: (messageId: string, emoji: string) => void;
    peerUser?: unknown;
}


export default function MessageBubble({
    message,
    senderName,
    senderAvatar,
    onReact,
    peerUser,
}: MessageBubbleProps) {

    const [copied, setCopied] = useState(false);

    const handleReact = (emoji: string) => {
        if (onReact) {
            onReact(message.id, emoji);
        }
    };

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(message.content);
            setCopied(true);
            toast.success("Message copied to clipboard");
            setTimeout(() => setCopied(false), 2000);
        } catch (error) {
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            console.error("Failed to copy:", error);
            toast.error("Failed to copy message");
        }
    };

    return (
        <ContextMenu>
            <ContextMenuTrigger asChild>
                <div
                    className={cn(
                        "group mb-4 flex flex-col",
                        message.isFromSelf ? "items-end" : "items-start"
                    )}
                >
                    <div className="flex max-w-[85%] flex-col gap-1">
                        {!message.isFromSelf && (senderName || senderAvatar) && (
                            <div className="mb-1 flex items-center gap-2 px-1">
                                <Avatar className="h-5 w-5 border border-zinc-100 shadow-sm">
                                    <AvatarImage src={senderAvatar} />
                                    <AvatarFallback className="bg-zinc-200 text-[8px]">
                                        {senderName?.[0] || "?"}
                                    </AvatarFallback>
                                </Avatar>
                                <span className="text-xs font-medium text-zinc-500">
                                    {senderName}
                                </span>
                            </div>
                        )}

                        <div
                            className={cn(
                                "rounded-2xl px-4 py-2",
                                message.isFromSelf
                                    ? "corner-squircle bg-linear-to-br from-blue-500 to-blue-600 text-white"
                                    : "bg-zinc-100 text-zinc-900",
                                !message.isFromSelf && !senderName && "ml-7" // Align with bubble when avatar is missing in sequence
                            )}
                        >
                            <p className="whitespace-pre-wrap wrap-break-word text-sm">
                                {message.content}
                            </p>
                        </div>
                        <div className={cn(
                            "mt-1 flex items-center gap-2 px-1",
                            message.isFromSelf ? "flex-row-reverse" : "flex-row",
                            !message.isFromSelf && !senderName && "ml-7" // Align time with bubble
                        )}>
                            <span className="text-[10px] opacity-70">
                                {new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })}
                            </span>

                            {/* Reactions */}
                            {onReact && (
                                <MessageReactions
                                    messageId={message.id}
                                    reactions={message.reactions as any}
                                    onReact={handleReact}
                                    peerUser={peerUser}
                                />
                            )}
                        </div>

                    </div>
                </div>
            </ContextMenuTrigger>
            <ContextMenuContent>
                <ContextMenuItem onClick={handleCopy}>
                    {copied ? (
                        <>
                            <Check className="mr-2 h-4 w-4 text-green-600" />
                            Copied!
                        </>
                    ) : (
                        <>
                            <Copy className="mr-2 h-4 w-4" />
                            Copy Text
                        </>
                    )}
                </ContextMenuItem>
            </ContextMenuContent>
        </ContextMenu>
    );
}