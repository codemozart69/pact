"use client";

import { Id } from "@/convex/_generated/dataModel";
import ConversationView from "@/components/messages/conversation-view";

interface GroupMember {
    userId?: Id<"users">;
    userAddress?: string;
    role: "admin" | "member";
    name?: string;
    profileImageUrl?: string;
}

interface GroupChatTabProps {
    groupId: Id<"groups">;
    groupName: string;
    members: GroupMember[];
    currentUserAddress?: string;
    isCreatorOrAdmin: boolean;
}

export default function GroupChatTab(props: GroupChatTabProps) {
    // We no longer need useGroupChat for XMTP sync or loading
    // We just render the ConversationView with the groupId

    return (
        <div className="h-[600px] overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm">
            <ConversationView
                groupId={props.groupId}
                isGroup={true}
                members={props.members.map(m => ({
                    userId: m.userId,
                    userAddress: m.userAddress,
                    name: m.name,
                    profileImageUrl: m.profileImageUrl
                }))}
            />
        </div>
    );
}
