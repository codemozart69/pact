"use client";

import Image from "next/image";
import { Link2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Id } from "@/convex/_generated/dataModel";
import { Skeleton } from "@/components/ui/skeleton";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatFullDate } from "@/lib/date-utils";
import { formatEtherToHbar } from "@/lib/format-utils";
import { ActionType } from "@/lib/action-colors";
import {
    ClaimLink,
    getStatusBadge,
    StatusFilter,
    SortOption
} from "./claim-link-utils";

interface ClaimLinkListProps {
    statusFilter: StatusFilter;
    setStatusFilter: (filter: StatusFilter) => void;
    sortOption: SortOption;
    setSortOption: (option: SortOption) => void;
    claimLinks: ClaimLink[] | undefined;
    sortLinks: (links: ClaimLink[]) => ClaimLink[];
    setViewMode: (mode: "create" | "list" | "details" | "success") => void;
    setSelectedLinkId: (id: Id<"claimLinks"> | null) => void;
    getActionGradient: (type: ActionType) => string;
}

export function ClaimLinkList({
    statusFilter,
    setStatusFilter,
    sortOption,
    setSortOption,
    claimLinks,
    sortLinks,
    setViewMode,
    setSelectedLinkId,
    getActionGradient,
}: ClaimLinkListProps) {
    return (
        <div className="space-y-4 px-6 pt-0 pb-10">
            <div className="space-y-4">
                <div className="flex justify-center">
                    <Button
                        className={`corner-squircle w-fit rounded-[15px] bg-linear-to-r ${getActionGradient('claimLink')} text-white shadow-md hover:shadow-lg`}
                        size="lg"
                        onClick={() => setViewMode("create")}
                    >
                        <Plus className="mr-2 h-5 w-5" />
                        Create
                    </Button>
                </div>

                <div className="flex items-center gap-3">
                    <Tabs
                        value={statusFilter}
                        onValueChange={(v) => setStatusFilter(v as StatusFilter)}
                        className="flex-1"
                    >
                        <TabsList className="grid w-fit grid-cols-4">
                            <TabsTrigger value="all">All</TabsTrigger>
                            <TabsTrigger value="active">Active</TabsTrigger>
                            <TabsTrigger value="completed">Completed</TabsTrigger>
                            <TabsTrigger value="expired">Expired</TabsTrigger>
                        </TabsList>
                    </Tabs>

                    <Select
                        value={sortOption}
                        onValueChange={(v) => setSortOption(v as SortOption)}
                    >
                        <SelectTrigger className="w-fit">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="recent">Recent</SelectItem>
                            <SelectItem value="amount">Highest Amount</SelectItem>
                            <SelectItem value="claims">Most Claims</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {claimLinks === undefined ? (
                <div className="space-y-3">
                    {[1, 2, 3].map((i) => (
                        <Skeleton key={i} className="h-40 rounded-[25px]" />
                    ))}
                </div>
            ) : claimLinks.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                    <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-pink-100">
                        <Link2 className="h-8 w-8 text-pink-600" />
                    </div>
                    <h3 className="mb-2 text-lg font-semibold text-zinc-900">
                        {statusFilter === "all"
                            ? "No claim links yet"
                            : `No ${statusFilter} claim links`}
                    </h3>
                    <p className="mb-4 text-sm text-zinc-500">
                        Create shareable links to distribute HBAR to others
                    </p>
                    <Button
                        onClick={() => setViewMode("create")}
                        className="corner-squircle rounded-[15px]"
                    >
                        <Plus className="mr-2 h-4 w-4" />
                        Create Your First Link
                    </Button>
                </div>
            ) : (
                <div className="space-y-3">
                    {sortLinks(claimLinks).map((link) => (
                        <ClaimLinkCard
                            key={link._id}
                            link={link}
                            onClick={() => {
                                setSelectedLinkId(link._id);
                                setViewMode("details");
                            }}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}

// Helper component for claim link cards
function ClaimLinkCard({
    link,
    onClick,
}: {
    link: ClaimLink;
    onClick: () => void;
}) {
    return (
        <div
            onClick={onClick}
            className="corner-squircle cursor-pointer rounded-[25px] border border-zinc-200 bg-white p-4 transition-colors hover:bg-zinc-50"
        >
            <div className="flex items-start gap-3">
                {/* Visual */}
                <div className="flex h-12 w-12 shrink-0 items-center justify-center">
                    {link.imageType === "emoji" ? (
                        <span className="text-3xl">{link.imageOrEmoji}</span>
                    ) : (
                        <div className="relative h-12 w-12">
                            <Image
                                src={link.imageOrEmoji}
                                alt={link.title}
                                fill
                                className="rounded-lg object-cover"
                            />
                        </div>
                    )}
                </div>

                {/* Content */}
                <div className="min-w-0 flex-1">
                    <div className="mb-1 flex items-start justify-between gap-2">
                        <h3 className="line-clamp-1 font-semibold text-zinc-900">
                            {link.title}
                        </h3>
                        {getStatusBadge(link.status)}
                    </div>

                    <div className="mb-2 text-sm text-zinc-600">
                        {link.totalAmount} HBAR •{" "}
                        {link.accessMode === "anyone" ? "Anyone" : "Allowlist"}
                    </div>

                    <div className="mb-3 text-sm text-zinc-500">
                        {link.claimCount} claim{link.claimCount !== 1 ? "s" : ""} •{" "}
                        {formatEtherToHbar(Math.max(
                            0,
                            parseFloat(link.totalAmount) - parseFloat(link.totalClaimed),
                        ).toString())} remaining
                    </div>

                    <div className="text-xs text-zinc-400">
                        Created {formatFullDate(link._creationTime)}
                    </div>
                </div>
            </div>
        </div>
    );
}
