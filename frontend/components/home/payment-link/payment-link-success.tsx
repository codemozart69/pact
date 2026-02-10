"use client";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Check, Copy, Share2, QrCode as QrCodeIcon } from "lucide-react";

import { ViewMode } from "./payment-link-utils";

interface PaymentLinkSuccessProps {
    createdLinkUrl: string;
    createdShortId: string;
    title: string;
    handleCopyCreatedLink: () => void;
    handleShareCreatedLink: () => void;
    handleShowQR: (url: string, title: string) => void;
    resetForm: () => void;
    setViewMode: (mode: ViewMode) => void;
}

export function PaymentLinkSuccess({
    createdLinkUrl,
    createdShortId,
    title,
    handleCopyCreatedLink,
    handleShareCreatedLink,
    handleShowQR,
    resetForm,
    setViewMode,
}: PaymentLinkSuccessProps) {
    return (
        <div className="space-y-6 p-6 pb-10">
            <div className="flex justify-center">
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-green-100">
                    <Check className="h-10 w-10 text-green-600" />
                </div>
            </div>

            <div className="space-y-2">
                <Label>Your Payment Link</Label>
                <div className="rounded-lg bg-zinc-100 p-4">
                    <p className="break-all text-sm font-mono text-zinc-900">
                        {createdLinkUrl}
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
                <Button
                    onClick={handleCopyCreatedLink}
                    variant="outline"
                    className="rounded-[15px] corner-squircle"
                >
                    <Copy className="mr-2 h-4 w-4" />
                    Copy Link
                </Button>
                <Button
                    onClick={handleShareCreatedLink}
                    variant="outline"
                    className="rounded-[15px] corner-squircle"
                >
                    <Share2 className="mr-2 h-4 w-4" />
                    Share
                </Button>
                <Button
                    onClick={() =>
                        window.open(`/pay/${createdShortId}`, "_blank")
                    }
                    variant="outline"
                    className="rounded-[15px] corner-squircle"
                >
                    View Link
                </Button>
                <Button
                    onClick={() => handleShowQR(createdLinkUrl, title)}
                    variant="outline"
                    className="rounded-[15px] corner-squircle"
                >
                    <QrCodeIcon className="mr-2 h-4 w-4" />
                    QR Code
                </Button>
            </div>

            <div className="flex justify-center pt-4">
                <Button
                    onClick={() => {
                        resetForm();
                        setViewMode("list");
                    }}
                    className="w-fit rounded-[15px] corner-squircle"
                >
                    Done
                </Button>
            </div>
        </div>
    );
}
