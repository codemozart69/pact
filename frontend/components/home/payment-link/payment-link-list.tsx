"use client";

import { Button } from "@/components/ui/button";
import { Id } from "@/convex/_generated/dataModel";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Link2, Plus } from "lucide-react";
import { PaymentLinkCard } from "@/components/home/payment-link-card";
import { ActionType } from "@/lib/action-colors";
import {
    PaymentLink,
    StatusFilter,
    SortOption,
    ViewMode
} from "./payment-link-utils";

interface PaymentLinkListProps {
    statusFilter: StatusFilter;
    setStatusFilter: (filter: StatusFilter) => void;
    sortOption: SortOption;
    setSortOption: (option: SortOption) => void;
    paymentLinks: PaymentLink[] | undefined;
    sortLinks: (links: PaymentLink[]) => PaymentLink[];
    setViewMode: (mode: ViewMode) => void;
    handleViewDetails: (linkId: Id<"paymentLinks">) => void;
    getActionGradient: (action: ActionType) => string;
}

export function PaymentLinkList({
    statusFilter,
    setStatusFilter,
    sortOption,
    setSortOption,
    paymentLinks,
    sortLinks,
    setViewMode,
    handleViewDetails,
    getActionGradient,
}: PaymentLinkListProps) {
    return (
        <div className="space-y-4 px-6 pb-10 pt-0">
            {/* Filters and Sort */}
            <div className="space-y-4">
                <div className="flex justify-center">
                    <Button
                        className={`w-fit justify-start rounded-[15px] corner-squircle bg-linear-to-r ${getActionGradient('paymentLink')} text-white shadow-md hover:shadow-lg`}
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

                    <Select value={sortOption} onValueChange={(v) => setSortOption(v as SortOption)}>
                        <SelectTrigger className="w-fit">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="recent">Recent</SelectItem>
                            <SelectItem value="collected">Most Collected</SelectItem>
                            <SelectItem value="payments">Most Payments</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {/* Payment Links List */}
            {paymentLinks === undefined ? (
                <div className="space-y-3">
                    {[1, 2, 3].map((i) => (
                        <Skeleton key={i} className="h-40 rounded-[25px]" />
                    ))}
                </div>
            ) : paymentLinks.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                    <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-purple-100">
                        <Link2 className="h-8 w-8 text-purple-600" />
                    </div>
                    <h3 className="mb-2 text-lg font-semibold text-zinc-900">
                        {statusFilter === "all"
                            ? "No payment links yet"
                            : statusFilter === "expired"
                                ? "No expired payment links yet"
                                : `No ${statusFilter} payment links`}
                    </h3>
                    <p className="mb-4 text-sm text-zinc-500">
                        {statusFilter === "all"
                            ? "Create shareable payment links to collect HBAR from anyone"
                            : "Create a new payment link to get started"}
                    </p>
                    <Button
                        onClick={() => setViewMode("create")}
                        className="rounded-[15px] corner-squircle"
                    >
                        <Plus className="mr-2 h-4 w-4" />
                        {statusFilter === "all"
                            ? "Create Your First Link"
                            : "Create a payment link"}
                    </Button>
                </div>
            ) : (
                <div className="space-y-3">
                    {sortLinks(paymentLinks).map((link) => (
                        <PaymentLinkCard
                            key={link._id}
                            link={link}
                            onClick={() => handleViewDetails(link._id)}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}
