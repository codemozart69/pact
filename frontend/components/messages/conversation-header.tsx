"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useAppKitAccount } from "@reown/appkit/react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ArrowLeft, MoreVertical, User, BellOff, Bell, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useIsMobile } from "@/hooks/use-mobile";
import { toast } from "sonner";
import { Id } from "@/convex/_generated/dataModel";

interface ConversationHeaderProps {
    conversationId?: Id<"conversations">;
    groupId?: Id<"groups">;
    onBack?: () => void;
    // Optional override for title/image if we don't want to fetch here (e.g. for Groups where we might have it)
    name?: string;
    image?: string;
}

export default function ConversationHeader({
    conversationId,
    groupId,
    onBack,
    name,
    image,
}: ConversationHeaderProps) {
    const { address } = useAppKitAccount();
    const router = useRouter();
    const isMobile = useIsMobile();

    const toggleMute = useMutation(api.conversations.toggleMute);
    const deleteConversation = useMutation(api.conversations.deleteConversation);

    // Fetch conversation data if ID is present
    const conversation = useQuery(
        api.conversations.list,
        { userAddress: address }
    )?.find(c => c._id === conversationId);

    // If we have a conversation object, we can get peer info
    const peerUser = conversation?.peerUser;
    const isMuted = conversation?.isMuted || false;

    // Fetch current user for group membership check
    const user = useQuery(api.users.getUser, address ? { userAddress: address } : "skip");

    // Group fetch logic if groupId is present
    const group = useQuery(api.groups.getGroup, groupId && user ? { groupId, userId: user._id } : "skip");

    const handleBack = () => {
        if (onBack) {
            onBack();
        } else if (isMobile) {
            router.push("/messages");
        }
    };

    const handleProfileClick = () => {
        if (peerUser?.username) {
            router.push(`/${peerUser.username}`);
        } else if (groupId) {
            router.push(`/groups/${groupId}`);
        }
    };

    const handleToggleMute = async () => {
        if (!conversationId || !address) return;

        try {
            const newMuteState = await toggleMute({
                conversationId,
                userAddress: address
            });
            toast.success(newMuteState ? "Conversation muted" : "Conversation unmuted");
        } catch {
            toast.error("Failed to update mute setting");
        }
    };

    const handleDelete = async () => {
        if (!conversationId || !address) return;

        if (!confirm("Delete this conversation?")) {
            return;
        }

        try {
            await deleteConversation({
                conversationId,
                userAddress: address
            });
            toast.success("Conversation deleted");
            router.push("/messages");
        } catch {
            toast.error("Failed to delete conversation");
        }
    };

    // Display Logic
    const displayName = name || group?.name || peerUser?.name || "Unknown";
    const displayImage = image || group?.imageOrEmoji || peerUser?.profileImageUrl;
    const isEmoji = group?.imageType === "emoji";
    const displayInitials = (displayName.charAt(0) || "?").toUpperCase();

    return (
        <div className="flex items-center gap-3 border-b border-zinc-200 bg-white px-4 py-3">
            {/* Back Button (Mobile) */}
            {isMobile && (
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleBack}
                    className="shrink-0"
                >
                    <ArrowLeft className="h-5 w-5" />
                </Button>
            )}

            {/* User/Group Info */}
            <button
                onClick={handleProfileClick}
                disabled={!peerUser && !groupId} // Disable if no profile/group to go to
                className="flex min-w-0 flex-1 items-center gap-3 text-left transition-opacity hover:opacity-80 disabled:cursor-default disabled:opacity-100"
            >
                <Avatar className="h-10 w-10 shrink-0">
                    {displayImage && !isEmoji ? (
                        <AvatarImage src={displayImage} />
                    ) : null}
                    <AvatarFallback
                        className="text-white"
                        style={isEmoji && group?.accentColor ? { backgroundColor: group.accentColor } : { backgroundColor: "var(--blue-500)" }}
                    >
                        {isEmoji ? group?.imageOrEmoji : displayInitials}
                    </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                    <div className="truncate font-semibold text-zinc-900">
                        {displayName}
                    </div>
                    {peerUser?.username ? (
                        <div className="truncate text-sm text-zinc-500">
                            @{peerUser.username}
                        </div>
                    ) : groupId && group ? (
                        <div className="truncate text-sm text-zinc-500">
                            {group.memberCount} members
                        </div>
                    ) : null}
                </div>
            </button>

            {/* Options Menu - Only for DMs for now */}
            {conversationId && (
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="shrink-0">
                            <MoreVertical className="h-5 w-5" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        {peerUser && (
                            <>
                                <DropdownMenuItem onClick={handleProfileClick}>
                                    <User className="mr-2 h-4 w-4" />
                                    View Profile
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                            </>
                        )}
                        <DropdownMenuItem onClick={handleToggleMute}>
                            {isMuted ? (
                                <>
                                    <Bell className="mr-2 h-4 w-4" />
                                    Unmute
                                </>
                            ) : (
                                <>
                                    <BellOff className="mr-2 h-4 w-4" />
                                    Mute
                                </>
                            )}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={handleDelete} className="text-red-600">
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete Conversation
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            )}
        </div>
    );
}