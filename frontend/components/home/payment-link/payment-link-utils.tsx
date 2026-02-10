"use client";

import { Id } from "@/convex/_generated/dataModel";

export type ViewMode = "create" | "list" | "details" | "edit" | "success";
export type StatusFilter = "all" | "active" | "completed" | "expired";
export type SortOption = "recent" | "collected" | "payments";

// Type for payment link from Convex
export interface PaymentLink {
    _id: Id<"paymentLinks">;
    _creationTime: number;
    creatorId: Id<"users">;
    title: string;
    description?: string;
    imageType: "emoji" | "image";
    imageUrl: string;
    amount: string;
    linkType: "single-use" | "reusable";
    status: "active" | "paused" | "completed" | "expired" | "inactive";
    shortId: string;
    expiresAt?: number;
    totalCollected: string;
    paymentCount: number;
    viewCount?: number;
    lastPaymentAt?: number;
}

export interface PaymentHistory {
    _id: Id<"paymentLinkPayments"> | string;
    payer?: {
        name: string;
        username: string;
        profileImageUrl?: string;
    } | null;
    transactionHash: string;
    amount: string;
    _creationTime: number;
}
