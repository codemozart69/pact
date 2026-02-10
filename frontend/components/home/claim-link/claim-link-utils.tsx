"use client";

import { Badge } from "@/components/ui/badge";
import { Id } from "@/convex/_generated/dataModel";

export type StatusFilter =
    | "all"
    | "active"
    | "paused"
    | "completed"
    | "expired"
    | "cancelled";

export type SortOption = "recent" | "amount" | "claims";

export interface ClaimLink {
    _id: Id<"claimLinks">;
    _creationTime: number;
    creatorId: Id<"users">;
    contractAddress: string;
    title: string;
    description?: string;
    imageOrEmoji: string;
    imageType: "emoji" | "image";
    assetType: "native" | "erc20";
    assetAddress?: string;
    assetSymbol?: string;
    assetDecimals?: number;
    totalAmount: string;
    accessMode: "anyone" | "allowlist";
    splitMode: "none" | "equal" | "custom";
    allowlist?: string[];
    customAmounts?: string[];
    maxClaimers?: number;
    proofAddress?: string;
    privateKey?: string;
    status: "active" | "paused" | "completed" | "cancelled" | "expired";
    shortId: string;
    expiresAt?: number;
    viewCount: number;
    claimCount: number;
    totalClaimed: string;
    lastClaimAt?: number;
    isExpired?: boolean;
    claims?: Array<{
        _id: Id<"claimLinkClaims">;
        _creationTime: number;
        claimLinkId: Id<"claimLinks">;
        claimerUserId?: Id<"users">;
        claimerAddress: string;
        amount: string;
        transactionHash: string;
        status: "completed" | "failed";
        timestamp: number;
        claimer: {
            _id: Id<"users">;
            name: string;
            username: string;
            profileImageUrl?: string;
        } | null;
    }>;
}

export function getStatusBadge(status: string) {
    switch (status) {
        case "active":
            return (
                <Badge
                    variant="outline"
                    className="border-0 bg-green-100 text-green-800"
                >
                    Active
                </Badge>
            );
        case "paused":
            return (
                <Badge
                    variant="outline"
                    className="border-0 bg-amber-100 text-amber-800"
                >
                    Paused
                </Badge>
            );
        case "completed":
            return (
                <Badge variant="outline" className="border-0 bg-blue-100 text-blue-800">
                    Completed
                </Badge>
            );
        case "expired":
            return (
                <Badge variant="outline" className="border-0 bg-zinc-200 text-zinc-700">
                    Expired
                </Badge>
            );
        case "cancelled":
            return (
                <Badge variant="outline" className="border-0 bg-red-100 text-red-800">
                    Cancelled
                </Badge>
            );
        default:
            return <Badge variant="outline">Unknown</Badge>;
    }
}
