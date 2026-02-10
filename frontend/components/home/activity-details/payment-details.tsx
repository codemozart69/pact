"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { User, ExternalLink } from "lucide-react";
import { formatFullDate } from "@/lib/date-utils";
import { formatAddress, formatSmartHbar } from "@/lib/format-utils";

interface PaymentDetailsProps {
    payment: any; // Using any for now to match current codebase, should be typed properly
    modalType: string;
    paymentLink?: any;
    onClose: () => void;
}

export function PaymentDetails({
    payment,
    modalType,
    paymentLink,
    onClose,
}: PaymentDetailsProps) {
    const otherUser =
        modalType === "payment_sent" ? payment.recipient : payment.sender;
    const isReceived = modalType !== "payment_sent";

    return (
        <div className="space-y-6">
            {/* User Info */}
            <div className="flex items-center gap-3">
                <Avatar className="h-12 w-12">
                    <AvatarImage src={otherUser?.profileImageUrl} />
                    <AvatarFallback>
                        <User className="h-6 w-6" />
                    </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                    <div className="font-semibold text-zinc-900">
                        {otherUser?.name || "Unknown User"}
                    </div>
                    {otherUser?.username && (
                        <div className="text-sm text-zinc-500">
                            @{otherUser.username}
                        </div>
                    )}
                </div>
            </div>

            {/* Amount */}
            <div
                className={`rounded-lg p-6 text-center ${isReceived
                        ? "bg-linear-to-br from-green-50 to-emerald-50"
                        : "bg-linear-to-br from-blue-50 to-indigo-50"
                    }`}
            >
                <div className="mb-1 text-sm font-medium text-zinc-600">
                    {isReceived ? "Amount Received" : "Amount Sent"}
                </div>
                <div
                    className={`text-4xl font-bold ${isReceived ? "text-green-600" : "text-blue-600"
                        }`}
                >
                    {formatSmartHbar(payment.amount)}
                </div>
            </div>

            {/* Note */}
            {payment.note && (
                <div className="space-y-2">
                    <div className="text-sm font-medium text-zinc-700">
                        {modalType === "payment_link_received" ? "Payment For" : "Note"}
                    </div>
                    <div className="rounded-lg bg-zinc-50 p-4">
                        <div className="text-sm text-zinc-600">{payment.note}</div>
                        {modalType === "payment_link_received" && paymentLink?.shortId && (
                            <a
                                href={`/pay/${paymentLink.shortId}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="mt-2 inline-flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-700 hover:underline"
                            >
                                View Payment Link
                                <ExternalLink className="h-3 w-3" />
                            </a>
                        )}
                    </div>
                </div>
            )}

            {/* Transaction Details */}
            <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                    <span className="text-zinc-500">Date</span>
                    <span className="font-medium text-zinc-900">
                        {formatFullDate(payment.timestamp)}
                    </span>
                </div>
                {payment.transactionHash && (
                    <div className="flex items-center justify-between">
                        <span className="text-zinc-500">Transaction</span>
                        <a
                            href={`https://hashscan.io/testnet/transaction/${payment.transactionHash}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 font-medium text-blue-600 hover:text-blue-700"
                        >
                            {formatAddress(payment.transactionHash)}
                            <ExternalLink className="h-3 w-3" />
                        </a>
                    </div>
                )}
            </div>

            <Button variant="outline" className="w-full" onClick={onClose}>
                Close
            </Button>
        </div>
    );
}
