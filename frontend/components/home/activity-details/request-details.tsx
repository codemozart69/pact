"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { User } from "lucide-react";
import { formatFullDate } from "@/lib/date-utils";
import { formatSmartHbar } from "@/lib/format-utils";

interface RequestDetailsProps {
    paymentRequest: any;
    otherUser: any;
    onClose: () => void;
}

export function RequestDetails({
    paymentRequest,
    otherUser,
    onClose,
}: RequestDetailsProps) {
    const getStatusBadge = () => {
        switch (paymentRequest.status) {
            case "pending":
                return (
                    <Badge variant="secondary" className="bg-amber-100 text-amber-700">
                        Pending
                    </Badge>
                );
            case "completed":
                return (
                    <Badge variant="secondary" className="bg-green-100 text-green-700">
                        Completed
                    </Badge>
                );
            case "declined":
                return (
                    <Badge variant="secondary" className="bg-red-100 text-red-700">
                        Declined
                    </Badge>
                );
            case "expired":
                return (
                    <Badge variant="secondary" className="bg-zinc-200 text-zinc-700">
                        Expired
                    </Badge>
                );
            default:
                return null;
        }
    };

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
            <div className="rounded-lg bg-linear-to-br from-amber-50 to-yellow-50 p-6 text-center">
                <div className="mb-1 text-sm font-medium text-zinc-600">
                    Requested Amount
                </div>
                <div className="text-4xl font-bold text-amber-600">
                    {formatSmartHbar(paymentRequest.amount)}
                </div>
            </div>

            {/* Note */}
            {paymentRequest.note && (
                <div className="space-y-2">
                    <div className="text-sm font-medium text-zinc-700">Note</div>
                    <div className="rounded-lg bg-zinc-50 p-4 text-sm text-zinc-600">
                        {paymentRequest.note}
                    </div>
                </div>
            )}

            {/* Details */}
            <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                    <span className="text-zinc-500">Date</span>
                    <span className="font-medium text-zinc-900">
                        {formatFullDate(paymentRequest._creationTime)}
                    </span>
                </div>
                <div className="flex justify-between">
                    <span className="text-zinc-500">Status</span>
                    {getStatusBadge()}
                </div>
            </div>

            <Button variant="outline" className="w-full" onClick={onClose}>
                Close
            </Button>
        </div>
    );
}
