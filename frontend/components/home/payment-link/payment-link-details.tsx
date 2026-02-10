"use client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import {
    Edit,
    Clock,
    Copy,
    Share2,
    Eye,
    QrCode as QrCodeIcon,
    Pause,
    Trash2,
    Play,
    User,
    ExternalLink,
} from "lucide-react";

import { PaymentLink, PaymentHistory } from "./payment-link-utils";

interface PaymentLinkDetailsProps {
    selectedLink: PaymentLink;
    handleOpenEdit: () => void;
    handleShowQR: (url: string, title: string) => void;
    handleToggleStatus: (action: "pause" | "resume" | "deactivate") => void;
    paymentHistory: PaymentHistory[] | undefined;
    formatExpiry: (timestamp: number) => string;
    formatAddress: (address: string) => string;
    formatFullDate: (timestamp: number) => string;
}

export function PaymentLinkDetails({
    selectedLink,
    handleOpenEdit,
    handleShowQR,
    handleToggleStatus,
    paymentHistory,
    formatExpiry,
    formatAddress,
    formatFullDate,
}: PaymentLinkDetailsProps) {
    if (!selectedLink) return null;

    const linkUrl = `${window.location.origin}/pay/${selectedLink.shortId}`;

    return (
        <div className="space-y-6 px-6 pb-10 pt-0">
            {/* Link Overview */}
            <div className="text-center">
                {/* Edit Button */}
                <div className="flex justify-end">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={handleOpenEdit}
                        className="rounded-[15px] corner-squircle"
                    >
                        <Edit className="mr-2 h-4 w-4" />
                        Edit
                    </Button>
                </div>
                <div className="mb-4 flex justify-center">
                    {selectedLink.imageType === "emoji" ? (
                        <span className="text-6xl">{selectedLink.imageUrl}</span>
                    ) : (
                        <img
                            src={selectedLink.imageUrl}
                            alt={selectedLink.title}
                            className="h-24 w-24 rounded-lg object-cover"
                        />
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
                    <Badge variant="outline" className="text-sm">
                        {selectedLink.amount} HBAR
                    </Badge>
                    <Badge variant="outline" className="text-sm">
                        {selectedLink.linkType === "single-use" ? "One-time" : "Reusable"}
                    </Badge>
                    {selectedLink.status === "active" && (
                        <Badge variant="outline" className="bg-green-100 text-green-800 border-0 text-sm">
                            Active
                        </Badge>
                    )}
                    {selectedLink.status === "paused" && (
                        <Badge variant="outline" className="bg-amber-100 text-amber-800 border-0 text-sm">
                            Paused
                        </Badge>
                    )}
                    {selectedLink.status === "completed" && (
                        <Badge variant="outline" className="bg-blue-100 text-blue-800 border-0 text-sm">
                            Completed
                        </Badge>
                    )}
                    {selectedLink.status === "expired" && (
                        <Badge variant="outline" className="bg-zinc-200 text-zinc-700 border-0 text-sm">
                            Expired
                        </Badge>
                    )}
                </div>

                {selectedLink.expiresAt && selectedLink.status === "active" && (
                    <div className="flex items-center justify-center gap-2 text-sm text-zinc-500 mb-4">
                        <Clock className="h-4 w-4" />
                        <span>Expires: {formatExpiry(selectedLink.expiresAt)}</span>
                    </div>
                )}
            </div>

            {/* Link URL */}
            <div className="space-y-2">
                <Label>Payment Link</Label>
                <div className="flex items-center gap-2">
                    <div className="flex-1 rounded-lg bg-zinc-100 p-3">
                        <p className="break-all text-xs font-mono text-zinc-900">
                            {linkUrl}
                        </p>
                    </div>
                    <Button
                        variant="outline"
                        size="icon"
                        onClick={() => {
                            navigator.clipboard.writeText(linkUrl);
                            toast.success("Link copied!");
                        }}
                    >
                        <Copy className="h-4 w-4" />
                    </Button>
                </div>
            </div>

            {/* Quick Actions */}
            <div className="flex gap-2">
                <Button
                    variant="outline"
                    onClick={() => {
                        if (navigator.share) {
                            navigator.share({ url: linkUrl }).catch(() => { });
                        } else {
                            navigator.clipboard.writeText(linkUrl);
                            toast.success("Link copied!");
                        }
                    }}
                    className="flex-1 rounded-[15px] corner-squircle"
                >
                    <Share2 className="mr-2 h-4 w-4" />
                    Share
                </Button>
                <Button
                    variant="outline"
                    onClick={() => window.open(`/pay/${selectedLink.shortId}`, "_blank")}
                    className="flex-1 rounded-[15px] corner-squircle"
                >
                    <Eye className="mr-2 h-4 w-4" />
                    View Page
                </Button>
                <Button
                    variant="outline"
                    onClick={() => handleShowQR(linkUrl, selectedLink.title)}
                    className="flex-1 rounded-[15px] corner-squircle"
                >
                    <QrCodeIcon className="mr-2 h-4 w-4" />
                    QR
                </Button>
            </div>

            {/* Stats (for reusable links) */}
            {selectedLink.linkType === "reusable" && (
                <div className="rounded-lg border border-zinc-200 p-4">
                    <h3 className="mb-3 font-semibold text-zinc-900">
                        Statistics
                    </h3>
                    <div className="grid grid-cols-3 gap-4 text-center">
                        <div>
                            <div className="text-2xl font-bold text-zinc-900">
                                {selectedLink.totalCollected}
                            </div>
                            <div className="text-xs text-zinc-500">
                                HBAR Collected
                            </div>
                        </div>
                        <div>
                            <div className="text-2xl font-bold text-zinc-900">
                                {selectedLink.paymentCount}
                            </div>
                            <div className="text-xs text-zinc-500">Payments</div>
                        </div>
                        <div>
                            <div className="text-2xl font-bold text-zinc-900">
                                {selectedLink.viewCount}
                            </div>
                            <div className="text-xs text-zinc-500">Views</div>
                        </div>
                    </div>
                </div>
            )}

            {/* Actions */}
            {selectedLink.status === "active" && (
                <div className="flex gap-2">
                    <Button
                        variant="outline"
                        onClick={() => handleToggleStatus("pause")}
                        className="flex-1 rounded-[15px] corner-squircle"
                    >
                        <Pause className="mr-2 h-4 w-4" />
                        Pause
                    </Button>
                    <Button
                        variant="outline"
                        onClick={() => {
                            if (
                                confirm(
                                    "Are you sure you want to deactivate this link? This cannot be undone."
                                )
                            ) {
                                handleToggleStatus("deactivate");
                            }
                        }}
                        className="flex-1 rounded-[15px] corner-squircle text-red-600 hover:text-red-700"
                    >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Deactivate
                    </Button>
                </div>
            )}

            {selectedLink.status === "paused" && (
                <Button
                    variant="outline"
                    onClick={() => handleToggleStatus("resume")}
                    className="w-full rounded-[15px] corner-squircle"
                >
                    <Play className="mr-2 h-4 w-4" />
                    Resume Link
                </Button>
            )}

            {/* Payment History */}
            <div className="space-y-3">
                <h3 className="font-semibold text-zinc-900">
                    Payment History
                </h3>
                {paymentHistory === undefined ? (
                    <div className="space-y-2">
                        {[1, 2, 3].map((i) => (
                            <Skeleton key={i} className="h-16 rounded-lg" />
                        ))}
                    </div>
                ) : paymentHistory.length === 0 ? (
                    <div className="rounded-lg border border-zinc-200 p-6 text-center text-sm text-zinc-500">
                        No payments yet
                    </div>
                ) : (
                    <div className="space-y-2">
                        {paymentHistory.map((payment) => (
                            <div
                                key={payment._id}
                                className="flex items-center gap-3 rounded-lg border border-zinc-200 p-3"
                            >
                                {payment.payer ? (
                                    <>
                                        <Avatar className="h-8 w-8">
                                            <AvatarImage src={payment.payer.profileImageUrl} />
                                            <AvatarFallback>
                                                <User className="h-4 w-4" />
                                            </AvatarFallback>
                                        </Avatar>
                                        <div className="min-w-0 flex-1">
                                            <div className="text-sm font-medium text-zinc-900">
                                                {payment.payer.name}
                                            </div>
                                            <div className="text-xs text-zinc-500">
                                                @{payment.payer.username}
                                            </div>
                                        </div>
                                    </>
                                ) : (
                                    <div className="flex-1">
                                        <div className="text-sm font-medium text-zinc-900">
                                            {formatAddress(payment.transactionHash)}
                                        </div>
                                        <div className="text-xs text-zinc-500">
                                            External wallet
                                        </div>
                                    </div>
                                )}
                                <div className="text-right">
                                    <div className="text-sm font-semibold text-zinc-900">
                                        {payment.amount} HBAR
                                    </div>
                                    <div className="text-xs text-zinc-500">
                                        {formatFullDate(payment._creationTime)}
                                    </div>
                                </div>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() =>
                                        window.open(
                                            `https://hashscan.io/testnet/transaction/${payment.transactionHash}`,
                                            "_blank"
                                        )
                                    }
                                >
                                    <ExternalLink className="h-4 w-4" />
                                </Button>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
