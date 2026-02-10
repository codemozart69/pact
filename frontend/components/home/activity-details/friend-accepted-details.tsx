"use client";

import { Button } from "@/components/ui/button";
import { UserPlus } from "lucide-react";

interface FriendAcceptedDetailsProps {
    onClose: () => void;
}

export function FriendAcceptedDetails({
    onClose,
}: FriendAcceptedDetailsProps) {
    return (
        <div className="space-y-6 text-center">
            <div className="flex justify-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-teal-100">
                    <UserPlus className="h-8 w-8 text-teal-600" />
                </div>
            </div>
            <p className="text-zinc-600">
                You&apos;re now connected! You can send payments and requests to each
                other.
            </p>
            <Button variant="outline" className="w-full" onClick={onClose}>
                Close
            </Button>
        </div>
    );
}
