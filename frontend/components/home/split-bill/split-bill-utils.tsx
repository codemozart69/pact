"use client";

import { Id } from "@/convex/_generated/dataModel";

export type ViewMode = "create" | "list" | "details";
export type SplitMode = "equal" | "custom";
export type StatusFilter = "all" | "active" | "completed" | "closed" | "expired";
export type SortOption = "recent" | "amount" | "pending";
export type ListTab = "created" | "participating";

export interface SplitBill {
    _id: Id<"splitBills">;
    _creationTime: number;
    creatorId: Id<"users">;
    title: string;
    description?: string;
    imageOrEmoji?: string;
    totalAmount: string;
    status: "active" | "completed" | "closed" | "expired";
    splitMode: SplitMode;
    expiresAt?: number;
    createdAt: number;
    paidCount: number;
    activeParticipantCount: number;
    creator?: {
        name: string;
        username: string;
        profileImageUrl?: string;
    };
}
