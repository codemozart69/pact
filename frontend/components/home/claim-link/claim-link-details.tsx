"use client";

import Image from "next/image";
import { formatEther } from "viem";
import {
    Copy,
    Eye,
    Pause,
    Play,
    Ban,
    User,
    Info
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { formatFullDate } from "@/lib/date-utils";
import { formatAddress, formatHbarValue } from "@/lib/format-utils";
import { secondsToMillis } from "@/lib/timestamp-utils";
import { ClaimLink, getStatusBadge } from "./claim-link-utils";

interface ClaimLinkDetailsProps {
    selectedLink: ClaimLink;
    handleToggleStatus: (action: "pause" | "resume" | "cancel") => void;
    createClaimLinkURL: (shortId: string, privateKey: `0x${string}`) => string;
    handleCopyCreatedLink: (url: string) => void;
}

export function ClaimLinkDetails({
    selectedLink,
    handleToggleStatus,
    createClaimLinkURL,
    handleCopyCreatedLink,
}: ClaimLinkDetailsProps) {
    return (
        <div className="space-y-6 px-6 pt-0 pb-10">
            <div className="text-center">
                <div className="mb-4 flex justify-center">
                    {selectedLink.imageType === "emoji" ? (
                        <span className="text-6xl">
                            {selectedLink.imageOrEmoji}
                        </span>
                    ) : (
                        <div className="relative h-24 w-24">
                            <Image
                                src={selectedLink.imageOrEmoji}
                                alt={selectedLink.title}
                                fill
                                className="rounded-lg object-cover"
                            />
                        </div>
                    )}
                </div>

                <h2 className="mb-2 text-2xl font-bold text-zinc-900">
                    {selectedLink.title}
                </h2>

                {selectedLink.description && (
                    <p className="mb-4 text-zinc-600">
                        {selectedLink.description}
                    </p>
                )}

                <div className="mb-4 flex items-center justify-center gap-2">
                    <Badge variant="outline">
                        {selectedLink.accessMode === "anyone"
                            ? "Anyone"
                            : "Allowlist"}
                    </Badge>
                    <Badge variant="outline">
                        {selectedLink.splitMode === "equal" ? "Equal" : "Custom"}{" "}
                        Split
                    </Badge>
                    {getStatusBadge(selectedLink.status)}
                </div>
            </div>

            {/* Amount Display */}
            <div className="corner-squircle rounded-[25px] border-2 border-pink-200 bg-pink-50 p-6 text-center">
                <div className="mb-1 text-sm font-medium text-pink-700">
                    Remaining
                </div>
                <div className="text-4xl font-bold text-pink-600">
                    {formatHbarValue(selectedLink.maxClaimers ? (parseFloat(selectedLink.totalAmount) / selectedLink.maxClaimers).toString() : selectedLink.totalAmount)}
                    <span className="text-2xl font-medium text-pink-400"> HBAR</span>
                </div>
                <div className="mt-2 text-sm text-pink-600">
                    {selectedLink.claimCount}/{selectedLink.maxClaimers || "∞"}{" "}
                    claimed
                </div>
            </div>

            {/* Security Warning for "anyone" mode */}
            {selectedLink.accessMode === "anyone" && (
                <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
                    <div className="flex gap-2">
                        <Info className="h-5 w-5 shrink-0 text-amber-600" />
                        <div className="text-sm text-amber-800">
                            <p className="mb-1 font-medium">Secret Link</p>
                            <p>
                                This link contains a secret key. Anyone with the
                                complete link can claim funds. Share carefully!
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* Quick Actions */}
            <div className="flex gap-2">
                <Button
                    variant="outline"
                    onClick={() => {
                        // Create full shareable URL with private key if in "anyone" mode
                        const url =
                            selectedLink.accessMode === "anyone" &&
                                selectedLink.privateKey
                                ? createClaimLinkURL(
                                    selectedLink.shortId,
                                    selectedLink.privateKey as `0x${string}`,
                                )
                                : `${window.location.origin}/claim/${selectedLink.shortId}`;
                        handleCopyCreatedLink(url);
                    }}
                    className="corner-squircle flex-1 rounded-[15px]"
                >
                    <Copy className="mr-2 h-4 w-4" />
                    Copy Link
                </Button>
                <Button
                    variant="outline"
                    onClick={() =>
                        window.open(`/claim/${selectedLink.shortId}`, "_blank")
                    }
                    className="corner-squircle flex-1 rounded-[15px]"
                >
                    <Eye className="mr-2 h-4 w-4" />
                    Preview
                </Button>
            </div>

            {/* Management Actions */}
            {selectedLink.status === "active" && (
                <div className="flex gap-2">
                    <Button
                        variant="outline"
                        onClick={() => handleToggleStatus("pause")}
                        className="corner-squircle flex-1 rounded-[15px]"
                    >
                        <Pause className="mr-2 h-4 w-4" />
                        Pause
                    </Button>
                    <Button
                        variant="outline"
                        onClick={() => {
                            if (
                                confirm("Cancel this link? This cannot be undone.")
                            ) {
                                handleToggleStatus("cancel");
                            }
                        }}
                        className="corner-squircle flex-1 rounded-[15px] text-red-600"
                    >
                        <Ban className="mr-2 h-4 w-4" />
                        Cancel
                    </Button>
                </div>
            )}

            {selectedLink.status === "paused" && (
                <Button
                    variant="outline"
                    onClick={() => handleToggleStatus("resume")}
                    className="corner-squircle w-full rounded-[15px]"
                >
                    <Play className="mr-2 h-4 w-4" />
                    Resume Link
                </Button>
            )}

            {/* Claim History */}
            <div className="space-y-3">
                <h3 className="font-semibold text-zinc-900">Claim History</h3>
                {selectedLink.claims && selectedLink.claims.length > 0 ? (
                    <div className="space-y-2">
                        {selectedLink.claims.map((claim) => (
                            <div
                                key={claim._id}
                                className="flex items-center gap-3 rounded-lg border border-zinc-200 p-3"
                            >
                                <Avatar className="h-8 w-8">
                                    <AvatarImage src={claim.claimer?.profileImageUrl} />
                                    <AvatarFallback>
                                        <User className="h-4 w-4" />
                                    </AvatarFallback>
                                </Avatar>
                                <div className="min-w-0 flex-1">
                                    <div className="text-sm font-medium text-zinc-900">
                                        {claim.claimer
                                            ? claim.claimer.name
                                            : formatAddress(claim.claimerAddress)}
                                    </div>
                                    <div className="text-xs text-zinc-500">
                                        {formatAddress(claim.claimerAddress)}
                                    </div>
                                    <div className="text-xs text-zinc-400">
                                        {formatFullDate(secondsToMillis(claim.timestamp))}
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="text-sm font-semibold text-zinc-900">
                                        {formatEther(BigInt(claim.amount))} HBAR
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="rounded-lg border border-zinc-200 p-6 text-center text-sm text-zinc-500">
                        No claims yet
                    </div>
                )}
            </div>
        </div>
    );
}
