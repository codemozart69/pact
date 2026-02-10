"use client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Clock, Send, XCircle, User, Check, Pause, Ban } from "lucide-react";
import { formatFullDate, formatExpiry } from "@/lib/date-utils";
import { formatWeiToHbar } from "@/lib/format-utils";

interface SplitBillDetailsProps {
    selectedSplit: any;
    myParticipation: any;
    isCreator: boolean;
    getStatusBadge: (status: string) => React.ReactNode;
    getParticipantStatusBadge: (status: string) => React.ReactNode;
    handlePayShare: () => Promise<void>;
    handleDeclineShare: () => Promise<void>;
    setShowMarkPaidModal: (v: boolean) => void;
    setSelectedParticipantForMark: (p: any) => void;
    setShowReminderModal: (v: boolean) => void;
    setShowExtendModal: (v: boolean) => void;
    handleCloseSplit: () => Promise<void>;
    handleCancelSplit: () => Promise<void>;
}

export function SplitBillDetails({
    selectedSplit,
    myParticipation,
    isCreator,
    getStatusBadge,
    getParticipantStatusBadge,
    handlePayShare,
    handleDeclineShare,
    setShowMarkPaidModal,
    setSelectedParticipantForMark,
    setShowReminderModal,
    setShowExtendModal,
    handleCloseSplit,
    handleCancelSplit,
}: SplitBillDetailsProps) {
    return (
        <div className="space-y-6 px-6 pt-0 pb-10">
            <div className="text-center">
                {selectedSplit.imageOrEmoji && (
                    <div className="mb-4 flex justify-center text-6xl">{selectedSplit.imageOrEmoji}</div>
                )}
                <h2 className="mb-2 text-2xl font-bold text-zinc-900">{selectedSplit.title}</h2>
                {selectedSplit.description && <p className="mb-4 text-zinc-600">{selectedSplit.description}</p>}
                <div className="mb-4 flex items-center justify-center gap-2">{getStatusBadge(selectedSplit.status)}</div>
                {selectedSplit.creator && (
                    <div className="mb-4 flex items-center justify-center gap-2 text-sm text-zinc-600">
                        <span>Created by {selectedSplit.creator.name}</span>
                    </div>
                )}
            </div>

            <div className="corner-squircle rounded-[25px] border-2 border-teal-200 bg-teal-50 p-6 text-center">
                <div className="mb-1 text-sm font-medium text-teal-700">Collected</div>
                <div className="text-4xl font-bold text-teal-600">
                    {formatWeiToHbar(selectedSplit.totalCollected)} / {formatWeiToHbar(selectedSplit.totalAmount)}
                </div>
                <div className="mt-2 text-sm text-teal-600">
                    {selectedSplit.paidCount}/{selectedSplit.activeParticipantCount} participants paid
                </div>
            </div>

            {selectedSplit.expiresAt && (
                <div className="flex items-center justify-center gap-2 text-sm text-zinc-600">
                    <Clock className="h-4 w-4" />
                    <span>Expires: {formatExpiry(selectedSplit.expiresAt)}</span>
                </div>
            )}

            {myParticipation && !isCreator && (
                <div className="space-y-3 rounded-lg border border-zinc-200 bg-zinc-50 p-4">
                    <h3 className="font-semibold text-zinc-900">Your Share</h3>
                    <div className="text-2xl font-bold text-zinc-900">{formatWeiToHbar(myParticipation.amount)}</div>
                    <div className="flex items-center gap-2">
                        <span className="text-sm text-zinc-600">Status:</span>
                        {getParticipantStatusBadge(myParticipation.status)}
                    </div>
                    {myParticipation.status === "pending" && selectedSplit.status === "active" && (
                        <div className="flex gap-2">
                            <Button onClick={handlePayShare} className="corner-squircle flex-1 rounded-[15px]">
                                <Send className="mr-2 h-4 w-4" />Pay Now
                            </Button>
                            <Button onClick={handleDeclineShare} variant="outline" className="corner-squircle flex-1 rounded-[15px]">
                                <XCircle className="mr-2 h-4 w-4" />Decline
                            </Button>
                        </div>
                    )}
                </div>
            )}

            <div className="space-y-3">
                <h3 className="font-semibold text-zinc-900">Participants</h3>
                {selectedSplit.participants.map((p: any) => (
                    <div key={p._id} className="flex items-center gap-3 rounded-lg border border-zinc-200 p-3">
                        <Avatar className="h-10 w-10">
                            <AvatarImage src={p.user?.profileImageUrl} />
                            <AvatarFallback><User className="h-5 w-5" /></AvatarFallback>
                        </Avatar>
                        <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                                <div className="font-medium text-zinc-900">{p.user?.name || "Unknown"}</div>
                                {p.status === "paid" && <Check className="h-4 w-4 text-green-600" />}
                            </div>
                            <div className="text-sm text-zinc-500">@{p.user?.username || "unknown"}</div>
                            {p.paidAt && <div className="text-xs text-zinc-400">Paid {formatFullDate(p.paidAt)}</div>}
                        </div>
                        <div className="text-right">
                            <div className="text-sm font-semibold text-zinc-900">{formatWeiToHbar(p.amount)}</div>
                            {getParticipantStatusBadge(p.status)}
                            {isCreator && p.status === "pending" && selectedSplit.status === "active" && (
                                <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setSelectedParticipantForMark(p);
                                        setShowMarkPaidModal(true);
                                    }}
                                    className="mt-1 text-xs"
                                >
                                    Mark Paid
                                </Button>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {isCreator && selectedSplit.status === "active" && (
                <div className="space-y-3 rounded-lg border border-zinc-200 bg-zinc-50 p-4">
                    <h3 className="font-semibold text-zinc-900">Creator Actions</h3>
                    <div className="grid grid-cols-2 gap-2">
                        <Button onClick={() => setShowReminderModal(true)} variant="outline" size="sm" className="corner-squircle rounded-[15px]">
                            <Send className="mr-2 h-4 w-4" />Send Reminders
                        </Button>
                        <Button
                            onClick={handleCloseSplit}
                            variant="outline"
                            size="sm"
                            className="corner-squircle rounded-[15px]"
                            disabled={selectedSplit.paidCount === 0}
                        >
                            <Pause className="mr-2 h-4 w-4" />Close Split
                        </Button>
                        {selectedSplit.expiresAt && (
                            <Button onClick={() => setShowExtendModal(true)} variant="outline" size="sm" className="corner-squircle rounded-[15px]">
                                <Clock className="mr-2 h-4 w-4" />Extend Expiry
                            </Button>
                        )}
                        <Button
                            onClick={handleCancelSplit}
                            variant="outline"
                            size="sm"
                            className="corner-squircle rounded-[15px] text-red-600"
                            disabled={selectedSplit.paidCount > 0}
                        >
                            <Ban className="mr-2 h-4 w-4" />Cancel
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
}
