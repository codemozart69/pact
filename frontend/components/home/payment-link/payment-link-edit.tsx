"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { format } from "date-fns";
import { Calendar as CalendarIcon, Info, Check } from "lucide-react";
import { cn } from "@/lib/utils";

import { PaymentLink } from "./payment-link-utils";

interface PaymentLinkEditProps {
    selectedLink: PaymentLink;
    editTitle: string;
    setEditTitle: (title: string) => void;
    editDescription: string;
    setEditDescription: (desc: string) => void;
    editExpiryDate: Date | undefined;
    setEditExpiryDate: (date: Date | undefined) => void;
    handleBackToDetails: () => void;
    handleSaveEdit: () => void;
}

export function PaymentLinkEdit({
    selectedLink,
    editTitle,
    setEditTitle,
    editDescription,
    setEditDescription,
    editExpiryDate,
    setEditExpiryDate,
    handleBackToDetails,
    handleSaveEdit,
}: PaymentLinkEditProps) {
    if (!selectedLink) return null;

    return (
        <div className="space-y-6 p-6 pb-10">
            {/* Visual Preview (Read-only) */}
            <div className="text-center">
                <div className="mb-2 text-sm font-medium text-zinc-700">
                    Visual
                </div>
                <div className="flex justify-center">
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
                <p className="mt-2 text-xs text-zinc-500">
                    Visual cannot be changed after creation
                </p>
            </div>

            {/* Title */}
            <div className="space-y-2">
                <Label>Title *</Label>
                <Input
                    placeholder="e.g., Coffee Tips, Freelance Invoice"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    maxLength={100}
                />
                <p className="text-xs text-zinc-500">
                    {editTitle.length}/100 characters
                </p>
            </div>

            {/* Description */}
            <div className="space-y-2">
                <Label>Description (Optional)</Label>
                <Textarea
                    placeholder="What is this payment for?"
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)}
                    maxLength={500}
                    rows={3}
                />
                <p className="text-xs text-zinc-500">
                    {editDescription.length}/500 characters
                </p>
            </div>

            {/* Amount (Read-only) */}
            <div className="space-y-2">
                <Label>Amount (HBAR)</Label>
                <div className="rounded-lg bg-zinc-100 p-3">
                    <p className="text-sm font-medium text-zinc-900">
                        {selectedLink.amount} HBAR
                    </p>
                </div>
                <p className="text-xs text-zinc-500">
                    Amount cannot be changed after creation
                </p>
            </div>

            {/* Link Type (Read-only) */}
            <div className="space-y-2">
                <Label>Payment Type</Label>
                <div className="rounded-lg bg-zinc-100 p-3">
                    <p className="text-sm font-medium text-zinc-900">
                        {selectedLink.linkType === "single-use"
                            ? "One-time payment"
                            : "Reusable link"}
                    </p>
                </div>
                <p className="text-xs text-zinc-500">
                    Type cannot be changed after creation
                </p>
            </div>

            {/* Expiry Date */}
            <div className="space-y-2">
                <Label>Expiry Date (Optional)</Label>
                <Popover>
                    <PopoverTrigger asChild>
                        <Button
                            variant="outline"
                            className={cn(
                                "w-full justify-start text-left font-normal",
                                !editExpiryDate && "text-muted-foreground"
                            )}
                        >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {editExpiryDate ? (
                                format(editExpiryDate, "PPP")
                            ) : (
                                <span>Pick a date</span>
                            )}
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                            mode="single"
                            selected={editExpiryDate}
                            onSelect={setEditExpiryDate}
                            disabled={(date) => date < new Date()}
                            initialFocus
                        />
                        {editExpiryDate && (
                            <div className="border-t p-3">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="w-full"
                                    onClick={() => setEditExpiryDate(undefined)}
                                >
                                    Clear expiration
                                </Button>
                            </div>
                        )}
                    </PopoverContent>
                </Popover>
                <div className="flex items-start gap-2 text-xs text-zinc-500">
                    <Info className="mt-0.5 h-3 w-3 shrink-0" />
                    <span>
                        Link expires at midnight on the selected date
                    </span>
                </div>
            </div>

            {/* Save Button */}
            <div className="flex justify-center gap-3 pt-4">
                <Button
                    variant="outline"
                    onClick={handleBackToDetails}
                    className="w-fit rounded-[15px] corner-squircle"
                >
                    Cancel
                </Button>
                <Button
                    size="lg"
                    onClick={handleSaveEdit}
                    disabled={!editTitle.trim()}
                    className="w-fit rounded-[15px] corner-squircle"
                >
                    <Check className="mr-2 h-4 w-4" />
                    Save Changes
                </Button>
            </div>
        </div>
    );
}
