"use client";

import { Check, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

interface ClaimLinkSuccessProps {
    createdLinkUrl: string;
    accessMode: "anyone" | "allowlist";
    handleCopyCreatedLink: (url: string) => void;
    resetForm: () => void;
    setOpen: (open: boolean) => void;
}

export function ClaimLinkSuccess({
    createdLinkUrl,
    accessMode,
    handleCopyCreatedLink,
    resetForm,
    setOpen,
}: ClaimLinkSuccessProps) {
    return (
        <div className="space-y-6 p-6 pb-10">
            <div className="flex justify-center">
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-green-100">
                    <Check className="h-10 w-10 text-green-600" />
                </div>
            </div>

            {accessMode === "anyone" && (
                <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
                    <div className="flex gap-2">
                        <Info className="h-5 w-5 shrink-0 text-amber-600" />
                        <div className="text-sm text-amber-800">
                            <p className="mb-1 font-medium">
                                Important: Secret Link
                            </p>
                            <p>
                                This link contains a secret key. Anyone with this link
                                can claim funds. Share it carefully and only with
                                intended recipients.
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {createdLinkUrl ? (
                <div className="space-y-2">
                    <Label>Your Claim Link</Label>
                    <div className="rounded-lg bg-zinc-100 p-4">
                        <p className="font-mono text-sm break-all text-zinc-900">
                            {createdLinkUrl}
                        </p>
                    </div>
                </div>
            ) : (
                <div className="text-center text-sm text-zinc-500">
                    Your claim link has been created successfully.
                </div>
            )}

            <div className="grid grid-cols-2 gap-3">
                <Button
                    onClick={() => handleCopyCreatedLink(createdLinkUrl)}
                    variant="outline"
                    className="corner-squircle rounded-[15px]"
                    disabled={!createdLinkUrl}
                >
                    Copy Link
                </Button>
                <Button
                    onClick={() => {
                        if (navigator.share && createdLinkUrl) {
                            navigator
                                .share({ url: createdLinkUrl })
                                .catch(() => { });
                        } else {
                            handleCopyCreatedLink(createdLinkUrl);
                        }
                    }}
                    variant="outline"
                    className="corner-squircle rounded-[15px]"
                    disabled={!createdLinkUrl}
                >
                    Share
                </Button>
            </div>

            <div className="flex justify-center pt-4">
                <Button
                    onClick={() => {
                        resetForm();
                        setOpen(false);
                    }}
                    className="corner-squircle w-fit rounded-[15px]"
                >
                    Done
                </Button>
            </div>
        </div>
    );
}
