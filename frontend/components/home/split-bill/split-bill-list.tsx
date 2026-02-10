"use client";

import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Split, Plus } from "lucide-react";
import { formatFullDate } from "@/lib/date-utils";
import { formatWeiToHbar } from "@/lib/format-utils";
import { getActionGradient } from "@/lib/action-colors";

import { ActionType } from "@/lib/action-colors";
import { Id } from "@/convex/_generated/dataModel";
import {
    ViewMode,
    StatusFilter,
    SortOption,
    ListTab,
    SplitBill
} from "./split-bill-utils";

interface SplitBillListProps {
    listTab: ListTab;
    setListTab: (v: ListTab) => void;
    statusFilter: StatusFilter;
    setStatusFilter: (v: StatusFilter) => void;
    sortOption: SortOption;
    setSortOption: (v: SortOption) => void;
    mySplits: SplitBill[] | undefined;
    splitsImIn: any[] | undefined;
    sortSplits: (splits: SplitBill[]) => SplitBill[];
    getStatusBadge: (status: string) => React.ReactNode;
    getParticipantStatusBadge: (status: string) => React.ReactNode;
    setSelectedSplitId: (id: Id<"splitBills"> | null) => void;
    setViewMode: (v: ViewMode) => void;
    getActionGradient: (action: ActionType) => string;
}

export function SplitBillList({
    listTab,
    setListTab,
    statusFilter,
    setStatusFilter,
    sortOption,
    setSortOption,
    mySplits,
    splitsImIn,
    sortSplits,
    getStatusBadge,
    getParticipantStatusBadge,
    setSelectedSplitId,
    setViewMode,
}: SplitBillListProps) {
    return (
        <div className="space-y-4 px-6 pt-0 pb-10">
            <div className="flex justify-center">
                <Button
                    className={`corner-squircle w-fit rounded-[15px] bg-linear-to-r ${getActionGradient('splitBill')} text-white shadow-md hover:shadow-lg`}
                    size="lg"
                    onClick={() => setViewMode("create")}
                >
                    <Plus className="mr-2 h-5 w-5" />
                    Create Split
                </Button>
            </div>

            <Tabs value={listTab} onValueChange={(v) => setListTab(v as ListTab)} className="w-full">
                <div className="flex justify-center">
                    <TabsList className="grid w-fit grid-cols-2">
                        <TabsTrigger value="created">My Splits</TabsTrigger>
                        <TabsTrigger value="participating">Splits I&apos;m In</TabsTrigger>
                    </TabsList>
                </div>

                <TabsContent value="created" className="mt-6 space-y-4">
                    <div className="flex items-center gap-3">
                        <Tabs value={statusFilter} onValueChange={(v) => setStatusFilter(v as StatusFilter)} className="flex-1">
                            <TabsList className="grid w-fit grid-cols-3">
                                <TabsTrigger value="all">All</TabsTrigger>
                                <TabsTrigger value="active">Active</TabsTrigger>
                                <TabsTrigger value="completed">Completed</TabsTrigger>
                            </TabsList>
                        </Tabs>
                        <Select value={sortOption} onValueChange={(v) => setSortOption(v as SortOption)}>
                            <SelectTrigger className="w-fit"><SelectValue /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="recent">Recent</SelectItem>
                                <SelectItem value="amount">Highest Amount</SelectItem>
                                <SelectItem value="pending">Most Pending</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {!mySplits ? (
                        <div className="space-y-3">
                            {[1, 2, 3].map((i) => <div key={i} className="h-32 animate-pulse rounded-[25px] bg-zinc-100" />)}
                        </div>
                    ) : mySplits.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 text-center">
                            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-teal-100">
                                <Split className="h-8 w-8 text-teal-600" />
                            </div>
                            <h3 className="mb-2 text-lg font-semibold text-zinc-900">No split bills yet</h3>
                            <Button onClick={() => setViewMode("create")} className="corner-squircle rounded-[15px]">
                                <Plus className="mr-2 h-4 w-4" />Create Split Bill
                            </Button>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {sortSplits(mySplits).map((split) => (
                                <div
                                    key={split._id}
                                    onClick={() => { setSelectedSplitId(split._id); setViewMode("details"); }}
                                    className="corner-squircle cursor-pointer rounded-[25px] border border-zinc-200 bg-white p-4 transition-colors hover:bg-zinc-50"
                                >
                                    <div className="flex items-start gap-3">
                                        {split.imageOrEmoji && <div className="flex h-12 w-12 shrink-0 items-center justify-center text-3xl">{split.imageOrEmoji}</div>}
                                        <div className="min-w-0 flex-1">
                                            <div className="mb-1 flex items-start justify-between gap-2">
                                                <h3 className="line-clamp-1 font-semibold text-zinc-900">{split.title}</h3>
                                                {getStatusBadge(split.status)}
                                            </div>
                                            <div className="mb-2 text-sm text-zinc-600">{formatWeiToHbar(split.totalAmount)} total</div>
                                            <div className="mb-3 text-sm text-zinc-500">{split.paidCount}/{split.activeParticipantCount} paid</div>
                                            <div className="text-xs text-zinc-400">Created {formatFullDate(split.createdAt)}</div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </TabsContent>

                <TabsContent value="participating" className="mt-6 space-y-4">
                    {!splitsImIn ? (
                        <div className="space-y-3">
                            {[1, 2, 3].map((i) => <div key={i} className="h-32 animate-pulse rounded-[25px] bg-zinc-100" />)}
                        </div>
                    ) : splitsImIn.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 text-center">
                            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-teal-100">
                                <Split className="h-8 w-8 text-teal-600" />
                            </div>
                            <h3 className="mb-2 text-lg font-semibold text-zinc-900">No split bills</h3>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {splitsImIn.map((item) => {
                                const { split, myParticipation: participation } = item;
                                return (
                                    <div
                                        key={split._id}
                                        onClick={() => { setSelectedSplitId(split._id); setViewMode("details"); }}
                                        className="corner-squircle cursor-pointer rounded-[25px] border border-zinc-200 bg-white p-4 transition-colors hover:bg-zinc-50"
                                    >
                                        <div className="flex items-start gap-3">
                                            {split.imageOrEmoji && <div className="flex h-12 w-12 shrink-0 items-center justify-center text-3xl">{split.imageOrEmoji}</div>}
                                            <div className="min-w-0 flex-1">
                                                <div className="mb-1 flex items-start justify-between gap-2">
                                                    <h3 className="line-clamp-1 font-semibold text-zinc-900">{split.title}</h3>
                                                    {getParticipantStatusBadge(participation.status)}
                                                </div>
                                                <div className="mb-2 text-sm text-zinc-600">From {split.creator?.name || "Unknown"}</div>
                                                <div className="mb-3 text-sm text-zinc-500">Your share: {formatWeiToHbar(participation.amount)}</div>
                                                <div className="text-xs text-zinc-400">Created {formatFullDate(split.createdAt)}</div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </TabsContent>
            </Tabs>
        </div>
    );
}
