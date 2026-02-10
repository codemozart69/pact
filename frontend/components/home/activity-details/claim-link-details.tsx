"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { User, ExternalLink } from "lucide-react";
import { formatFullDate } from "@/lib/date-utils";
import { formatAddress, formatSmartHbar } from "@/lib/format-utils";

interface ClaimLinkDetailsProps {
    claimLink: any;
    onClose: () => void;
}

export function ClaimLinkDetails({
    claimLink,
    onClose,
}: ClaimLinkDetailsProps) {
    // Find the most recent claim or current claim
    const recentClaim =
        claimLink.claims && claimLink.claims.length > 0
            ? claimLink.claims[0]
            : null;

    const claimer = recentClaim?.claimer;
    const claimerName = claimer?.name || "Someone";

    return (
        <div className="space-y-6">
            {/* Claimer Info */}
            <div className="flex items-center gap-3">
                <Avatar className="h-12 w-12">
                    <AvatarImage src={claimer?.profileImageUrl} />
                    <AvatarFallback>
                        <User className="h-6 w-6" />
                    </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                    <div className="font-semibold text-zinc-900">{claimerName}</div>
                    {claimer?.username && (
                        <div className="text-sm text-zinc-500">@{claimer.username}</div>
                    )}
                </div>
            </div>

            {/* Claim Link Title */}
            <div className="rounded-lg bg-pink-50 p-4 text-center">
                <div className="mb-1 text-sm font-medium text-zinc-600">
                    Claimed from
                </div>
                <div className="text-lg font-bold text-pink-600">
                    {claimLink.title}
                </div>
                {claimLink.description && (
                    <div className="mt-1 text-sm text-zinc-600">
                        {claimLink.description}
                    </div>
                )}
                {claimLink.shortId && (
                    <a
                        href={`/claim/${claimLink.shortId}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-2 inline-flex items-center gap-1 text-xs text-pink-600 hover:text-pink-700 hover:underline"
                    >
                        View Claim Link
                        <ExternalLink className="h-3 w-3" />
                    </a>
                )}
            </div>

            {/* Amount */}
            {recentClaim && (
                <div className="rounded-lg bg-linear-to-br from-pink-50 to-rose-50 p-6 text-center">
                    <div className="mb-1 text-sm font-medium text-zinc-600">
                        Amount Claimed
                    </div>
                    <div className="text-4xl font-bold text-pink-600">
                        {formatSmartHbar(recentClaim.amount)}
                    </div>
                </div>
            )}

            {/* Details */}
            <div className="space-y-3 text-sm">
                {recentClaim && (
                    <>
                        <div className="flex justify-between">
                            <span className="text-zinc-500">Date</span>
                            <span className="font-medium text-zinc-900">
                                {formatFullDate(recentClaim.timestamp * 1000)}
                            </span>
                        </div>
                        {recentClaim.transactionHash && (
                            <div className="flex items-center justify-between">
                                <span className="text-zinc-500">Transaction</span>
                                <a
                                    href={`https://hashscan.io/testnet/transaction/${recentClaim.transactionHash}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-1 font-medium text-blue-600 hover:text-blue-700"
                                >
                                    {formatAddress(recentClaim.transactionHash)}
                                    <ExternalLink className="h-3 w-3" />
                                </a>
                            </div>
                        )}
                    </>
                )}
                <div className="flex justify-between">
                    <span className="text-zinc-500">Total Claims</span>
                    <span className="font-medium text-zinc-900">
                        {claimLink.claims?.length || 0}
                    </span>
                </div>
                <div className="flex justify-between">
                    <span className="text-zinc-500">Status</span>
                    <Badge variant="secondary" className="bg-pink-100 text-pink-700">
                        {claimLink.status === "completed" ? "Completed" : "Active"}
                    </Badge>
                </div>
            </div>

            <Button variant="outline" className="w-full" onClick={onClose}>
                Close
            </Button>
        </div>
    );
}
