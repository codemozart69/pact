"use client";

import { useState, useEffect } from "react";
import { useAppKitAccount } from "@reown/appkit/react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id, Doc } from "@/convex/_generated/dataModel";
import { useSendTransaction, useWaitForTransactionReceipt } from "wagmi";
import { parseEther } from "viem";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
  SheetTrigger,
  SheetClose,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { RecipientUser } from "./user-recipient-input";
import { SplitBillCreate } from "./split-bill/split-bill-create";
import { SplitBillList } from "./split-bill/split-bill-list";
import { SplitBillDetails } from "./split-bill/split-bill-details";
import {
  Split,
  X,
  Calendar as CalendarIcon,
  Info,
  Check,
  Plus,
  ArrowLeft,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { formatFullDate, formatExpiry } from "@/lib/date-utils";
import { formatEtherToHbar, formatHbarValue, formatWeiToHbar } from "@/lib/format-utils";
import { getActionGradient } from "@/lib/action-colors";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";

import {
  ViewMode,
  SplitMode,
  StatusFilter,
  SortOption,
  ListTab
} from "./split-bill/split-bill-utils";

export default function SplitBillSheet({
  hideTrigger = false,
}: {
  hideTrigger?: boolean;
} = {}) {
  const [open, setOpen] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [isCreating, setIsCreating] = useState(false);
  const { address } = useAppKitAccount();

  const user = useQuery(
    api.users.getUser,
    address ? { userAddress: address } : "skip",
  );

  // Wagmi hooks for payment
  const { sendTransaction } = useSendTransaction();
  const [paymentTxHash, setPaymentTxHash] = useState<
    `0x${string}` | undefined
  >();
  const { isSuccess: isPaymentConfirmed } = useWaitForTransactionReceipt({
    hash: paymentTxHash,
  });

  // Form state
  const [visualTab, setVisualTab] = useState<"emoji" | "none">("none");
  const [selectedEmoji, setSelectedEmoji] = useState("💰");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [splitMode, setSplitMode] = useState<SplitMode>("equal");
  const [expirationDate, setExpirationDate] = useState<Date | undefined>(
    undefined,
  );
  const [participants, setParticipants] = useState<RecipientUser[]>([]);
  const [customAmounts, setCustomAmounts] = useState<{ [key: string]: string }>(
    {},
  );

  // List/Details state
  const [listTab, setListTab] = useState<ListTab>("created");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [sortOption, setSortOption] = useState<SortOption>("recent");
  const [selectedSplitId, setSelectedSplitId] =
    useState<Id<"splitBills"> | null>(null);

  // Modal states
  const [showMarkPaidModal, setShowMarkPaidModal] = useState(false);
  const [showReminderModal, setShowReminderModal] = useState(false);
  const [showExtendModal, setShowExtendModal] = useState(false);
  const [markPaidNote, setMarkPaidNote] = useState("");

  interface Participant {
    userId?: Id<"users">;
    user?: {
      _id: Id<"users">;
      name: string;
      username: string;
    } | null;
    amount: string;
    [key: string]: unknown;
  }

  const [selectedParticipantForMark, setSelectedParticipantForMark] = useState<Participant | null>(null);
  const [newExpirationDate, setNewExpirationDate] = useState<
    Date | undefined
  >();

  // Convex mutations
  const createSplitBill = useMutation(api.splitBills.createSplitBill);
  const payShare = useMutation(api.splitBills.payShare);
  const declineShare = useMutation(api.splitBills.declineShare);
  const markAsPaidOutsideApp = useMutation(api.splitBills.markAsPaidOutsideApp);
  const sendReminder = useMutation(api.splitBills.sendReminder);
  const closeSplit = useMutation(api.splitBills.closeSplit);
  const cancelSplit = useMutation(api.splitBills.cancelSplit);
  const extendExpiration = useMutation(api.splitBills.extendExpiration);

  // Get split bills
  const mySplits = useQuery(
    api.splitBills.listMySplits,
    user
      ? {
        userId: user._id,
        status: statusFilter === "all" ? undefined : statusFilter,
      }
      : "skip",
  );

  const splitsImIn = useQuery(
    api.splitBills.listSplitsImIn,
    user
      ? {
        userId: user._id,
      }
      : "skip",
  );

  const selectedSplit = useQuery(
    api.splitBills.getSplitDetails,
    selectedSplitId ? { splitBillId: selectedSplitId } : "skip",
  );

  const myParticipation = useQuery(
    api.splitBills.getMyParticipation,
    user && selectedSplitId
      ? { userId: user._id, splitBillId: selectedSplitId }
      : "skip",
  );

  // Handle payment confirmation
  useEffect(() => {
    if (isPaymentConfirmed && paymentTxHash) {
      toast.success("Payment confirmed!");
      setPaymentTxHash(undefined);
    }
  }, [isPaymentConfirmed, paymentTxHash]);

  // Handle open-split-bill-details event
  useEffect(() => {
    if (!hideTrigger) return; // Only global instance listens for events

    const handleOpenDetails = (event: Event) => {
      const customEvent = event as CustomEvent<{ splitBillId: string }>;
      const { splitBillId } = customEvent.detail;
      if (splitBillId) {
        setSelectedSplitId(splitBillId as Id<"splitBills">);
        setViewMode("details");
        setOpen(true);
      }
    };

    window.addEventListener("open-split-bill-details", handleOpenDetails);
    return () => {
      window.removeEventListener("open-split-bill-details", handleOpenDetails);
    };
  }, [hideTrigger]);

  // Smart default: show list if user has splits, otherwise show create
  useEffect(() => {
    if (open && mySplits !== undefined && splitsImIn !== undefined) {
      const hasCreated = mySplits.length > 0;
      const hasParticipating = splitsImIn.length > 0;
      const hasAny = hasCreated || hasParticipating;

      if (!hasAny && statusFilter === "all" && viewMode === "list") {
        setViewMode("create");
      } else if (hasAny && viewMode === "create") {
        setViewMode("list");
      }

      // If they have no created splits but have participating ones, 
      // and are currently on the "created" tab, switch to "participating"
      if (!hasCreated && hasParticipating && listTab === "created") {
        setListTab("participating");
      }
    }
  }, [open, mySplits, splitsImIn, statusFilter, viewMode, listTab]);

  const resetForm = () => {
    setVisualTab("none");
    setSelectedEmoji("💰");
    setTitle("");
    setDescription("");
    setAmount("");
    setSplitMode("equal");
    setExpirationDate(undefined);
    setParticipants([]);
    setCustomAmounts({});
  };

  const handleAddParticipant = (participant: RecipientUser | string | null) => {
    if (!participant || typeof participant === "string") return;

    if (participants.some((p) => p._id === participant._id)) {
      toast.error("Participant already added");
      return;
    }

    if (participants.length >= 50) {
      toast.error("Maximum 50 participants allowed");
      return;
    }

    setParticipants([...participants, participant]);
  };

  const handleRemoveParticipant = (userId: string) => {
    setParticipants(participants.filter((p) => p._id !== userId));

    if (splitMode === "custom") {
      setSplitMode("equal");
      setCustomAmounts({});
      toast.info("Switched to equal split after removing participant");
    }
  };

  const handleCustomAmountChange = (userId: string, value: string) => {
    setCustomAmounts({
      ...customAmounts,
      [userId]: value,
    });
  };

  const calculateEqualAmount = () => {
    if (!amount || participants.length === 0) return "0";
    const amountNum = parseFloat(amount);
    return formatHbarValue((amountNum / participants.length).toString());
  };

  const calculateCustomSum = () => {
    return Object.values(customAmounts).reduce(
      (sum, amt) => sum + (parseFloat(amt) || 0),
      0,
    );
  };

  const validateForm = (): boolean => {
    if (!title.trim()) {
      toast.error("Please enter a title");
      return false;
    }

    if (!amount || parseFloat(amount) <= 0) {
      toast.error("Please enter a valid amount");
      return false;
    }

    if (participants.length < 2) {
      toast.error("At least 2 participants required");
      return false;
    }

    if (participants.length > 50) {
      toast.error("Maximum 50 participants allowed");
      return false;
    }

    if (splitMode === "custom") {
      const sum = calculateCustomSum();
      const totalAmt = parseFloat(amount);
      if (Math.abs(sum - totalAmt) > 0.000001) {
        toast.error(
          `Custom amounts (${formatEtherToHbar(sum.toString())}) must equal total amount (${formatEtherToHbar(totalAmt.toString())})`,
        );
        return false;
      }
    }

    return true;
  };

  const handleCreateSplit = async () => {
    if (!address || !user) {
      toast.error("Please connect your wallet");
      return;
    }

    if (!validateForm()) return;

    setIsCreating(true);

    try {
      const amountAtomic = BigInt(
        Math.floor(parseFloat(amount) * 1e18),
      ).toString();

      let participantsData;
      if (splitMode === "equal") {
        participantsData = participants.map((p) => ({
          userId: p._id as Id<"users">,
        }));
      } else {
        participantsData = participants.map((p) => ({
          userId: p._id as Id<"users">,
          amount: BigInt(
            Math.floor(parseFloat(customAmounts[p._id] || "0") * 1e18),
          ).toString(),
        }));
      }

      const splitBillId = await createSplitBill({
        userAddress: address,
        title: title.trim(),
        description: description.trim() || undefined,
        imageOrEmoji: visualTab === "emoji" ? selectedEmoji : undefined,
        imageType: visualTab === "emoji" ? "emoji" : undefined,
        totalAmount: amountAtomic,
        splitMode,
        participants: participantsData,
        expiresAt: expirationDate ? expirationDate.getTime() : undefined,
      });

      toast.success("Split bill created!");
      resetForm();
      setViewMode("details");
      setSelectedSplitId(splitBillId);
    } catch (error: unknown) {
      console.error("Create split error:", error);
      const message =
        error instanceof Error ? error.message : "Failed to create split bill";
      toast.error(message);
    } finally {
      setIsCreating(false);
    }
  };

  const handlePayShare = async () => {
    if (!address || !user || !selectedSplit || !myParticipation) return;

    try {
      const creator = selectedSplit.creator;
      if (!creator) {
        toast.error("Creator not found");
        return;
      }

      const value = parseEther(
        (parseFloat(myParticipation.amount) / 1e18).toString(),
      );

      toast.info("Opening wallet to confirm payment...");

      sendTransaction(
        {
          to: creator.userAddress as `0x${string}`,
          value: value,
        },
        {
          onSuccess: async (hash) => {
            setPaymentTxHash(hash);
            toast.loading("Confirming payment...", { id: "pay-share" });

            // Wait a moment for tx to be mined, then call payShare
            setTimeout(async () => {
              try {
                await payShare({
                  userAddress: address,
                  splitBillId: selectedSplit._id,
                });
                toast.success("Payment recorded!", { id: "pay-share" });
              } catch (error: unknown) {
                const message =
                  error instanceof Error
                    ? error.message
                    : "Failed to record payment";
                toast.error(message, {
                  id: "pay-share",
                });
              }
            }, 3000);
          },
          onError: (error) => {
            console.error("Payment failed:", error);
            toast.error("Payment failed");
          },
        },
      );
    } catch (error: unknown) {
      console.error("Pay share error:", error);
      const message =
        error instanceof Error ? error.message : "Failed to pay share";
      toast.error(message);
    }
  };

  const handleDeclineShare = async () => {
    if (!address || !selectedSplitId) return;

    try {
      await declineShare({
        userAddress: address,
        splitBillId: selectedSplitId,
      });
      toast.success("Share declined");
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "Failed to decline share";
      toast.error(message);
    }
  };

  const handleMarkAsPaid = async () => {
    if (!address || !selectedSplitId || !selectedParticipantForMark) return;

    const participantUserId = selectedParticipantForMark.userId ?? selectedParticipantForMark.user?._id;
    if (!participantUserId) {
      toast.error("Cannot identify participant user");
      return;
    }

    try {
      await markAsPaidOutsideApp({
        userAddress: address,
        splitBillId: selectedSplitId,
        participantUserId: participantUserId,
        note: markPaidNote || undefined,
      });
      toast.success("Marked as paid");
      setShowMarkPaidModal(false);
      setMarkPaidNote("");
      setSelectedParticipantForMark(null);
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "Failed to mark as paid";
      toast.error(message);
    }
  };

  const handleSendReminder = async (participantIds?: string[]) => {
    if (!address || !selectedSplitId) return;

    try {
      const result = await sendReminder({
        userAddress: address,
        splitBillId: selectedSplitId,
        participantUserIds: participantIds as Id<"users">[] | undefined,
      });

      if (result.failedReminders.length > 0) {
        toast.warning(
          `Sent ${result.successCount} reminder(s). Failed: ${result.failedReminders.join(", ")}`,
        );
      } else {
        toast.success(`Sent ${result.successCount} reminder(s)`);
      }

      setShowReminderModal(false);
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "Failed to send reminders";
      toast.error(message);
    }
  };

  const handleCloseSplit = async () => {
    if (!address || !selectedSplitId) return;

    if (!confirm("Close this split? Pending participants will be notified.")) {
      return;
    }

    try {
      await closeSplit({
        userAddress: address,
        splitBillId: selectedSplitId,
      });
      toast.success("Split closed");
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "Failed to close split";
      toast.error(message);
    }
  };

  const handleCancelSplit = async () => {
    if (!address || !selectedSplitId) return;

    if (
      !confirm(
        "Cancel this split? All participants will be notified. This cannot be undone.",
      )
    ) {
      return;
    }

    try {
      await cancelSplit({
        userAddress: address,
        splitBillId: selectedSplitId,
      });
      toast.success("Split cancelled");
      setViewMode("list");
      setSelectedSplitId(null);
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "Failed to cancel split";
      toast.error(message);
    }
  };

  const handleExtendExpiration = async () => {
    if (!address || !selectedSplitId || !newExpirationDate) return;

    try {
      await extendExpiration({
        userAddress: address,
        splitBillId: selectedSplitId,
        newExpiresAt: newExpirationDate.getTime(),
      });
      toast.success("Expiration extended");
      setShowExtendModal(false);
      setNewExpirationDate(undefined);
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "Failed to extend expiration";
      toast.error(message);
    }
  };

  // Sort splits based on selected option
  interface SplitWithParticipants extends Doc<"splitBills"> {
    activeParticipantCount: number;
    paidCount: number;
    // Explicitly extended to include all Doc properties
  }

  const sortSplits = (splits: SplitWithParticipants[]) => {
    switch (sortOption) {
      case "amount":
        return [...splits].sort(
          (a, b) => parseFloat(b.totalAmount) - parseFloat(a.totalAmount),
        );
      case "pending":
        return [...splits].sort(
          (a, b) =>
            b.activeParticipantCount -
            b.paidCount -
            (a.activeParticipantCount - a.paidCount),
        );
      case "recent":
      default:
        return splits;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return (
          <Badge
            variant="outline"
            className="border-0 bg-green-100 text-green-800"
          >
            Active
          </Badge>
        );
      case "completed":
        return (
          <Badge
            variant="outline"
            className="border-0 bg-blue-100 text-blue-800"
          >
            Completed
          </Badge>
        );
      case "closed":
        return (
          <Badge
            variant="outline"
            className="border-0 bg-amber-100 text-amber-800"
          >
            Closed
          </Badge>
        );
      case "expired":
        return (
          <Badge
            variant="outline"
            className="border-0 bg-zinc-200 text-zinc-700"
          >
            Expired
          </Badge>
        );
      case "cancelled":
        return (
          <Badge variant="outline" className="border-0 bg-red-100 text-red-800">
            Cancelled
          </Badge>
        );
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const getParticipantStatusBadge = (status: string) => {
    switch (status) {
      case "paid":
        return (
          <Badge
            variant="outline"
            className="border-0 bg-green-100 text-green-800"
          >
            Paid
          </Badge>
        );
      case "pending":
        return (
          <Badge
            variant="outline"
            className="border-0 bg-amber-100 text-amber-800"
          >
            Pending
          </Badge>
        );
      case "declined":
        return (
          <Badge variant="outline" className="border-0 bg-red-100 text-red-800">
            Declined
          </Badge>
        );
      case "marked_paid":
        return (
          <Badge
            variant="outline"
            className="border-0 bg-blue-100 text-blue-800"
          >
            Marked Paid
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const isValid = !!(
    title.trim() &&
    amount &&
    parseFloat(amount) > 0 &&
    participants.length >= 2
  );

  const isCreator = !!(
    user && selectedSplit && selectedSplit.creatorId === user._id
  );

  return (
    <>
      <Sheet
        open={open}
        onOpenChange={(isOpen) => {
          setOpen(isOpen);
          if (!isOpen) {
            setTimeout(() => {
              resetForm();
              setViewMode("list");
              setSelectedSplitId(null);
            }, 300);
          }
        }}
      >
        {!hideTrigger && (
          <SheetTrigger asChild>
            <button className={`corner-squircle flex h-24 w-full flex-col items-center justify-center gap-2 rounded-[40px] bg-linear-to-br ${getActionGradient('splitBill')} text-white shadow-lg transition-all hover:shadow-xl`}>
              <Split className="h-6 w-6" />
              <span className="text-sm font-medium">Split Bill</span>
            </button>
          </SheetTrigger>
        )}

        <SheetContent
          side="bottom"
          className="corner-squircle h-[90vh] rounded-t-[50px] p-0"
          showCloseButton={false}
        >
          <div className="mx-auto flex h-full w-full max-w-2xl flex-col">
            {/* Header */}
            <div className="relative flex items-center justify-between px-6 py-4">
              <div className="flex items-center">
                {viewMode === "details" && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setViewMode("list")}
                  >
                    <ArrowLeft className="h-5 w-5" />
                  </Button>
                )}
                {viewMode === "create" && mySplits && mySplits.length > 0 && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setViewMode("list")}
                  >
                    <ArrowLeft className="h-5 w-5" />
                  </Button>
                )}
              </div>

              <SheetTitle className="absolute left-1/2 -translate-x-1/2 text-xl font-semibold">
                {viewMode === "create"
                  ? "Create Split Bill"
                  : viewMode === "details"
                    ? "Split Details"
                    : "Split Bills"}
              </SheetTitle>

              <div className="flex items-center gap-2">
                <SheetClose asChild>
                  <Button variant="ghost" size="icon">
                    <X className="h-5 w-5" />
                    <span className="sr-only">Close</span>
                  </Button>
                </SheetClose>
              </div>
            </div>

            <SheetDescription className="sr-only">
              Manage your split bills
            </SheetDescription>

            <ScrollArea className="flex-1 overflow-auto">
              {/* CREATE VIEW */}
              {viewMode === "create" && (
                <SplitBillCreate
                  visualTab={visualTab}
                  setVisualTab={setVisualTab}
                  selectedEmoji={selectedEmoji}
                  setSelectedEmoji={setSelectedEmoji}
                  title={title}
                  setTitle={setTitle}
                  description={description}
                  setDescription={setDescription}
                  amount={amount}
                  setAmount={setAmount}
                  splitMode={splitMode}
                  setSplitMode={setSplitMode}
                  expirationDate={expirationDate}
                  setExpirationDate={setExpirationDate}
                  participants={participants}
                  handleAddParticipant={handleAddParticipant}
                  handleRemoveParticipant={handleRemoveParticipant}
                  customAmounts={customAmounts}
                  handleCustomAmountChange={handleCustomAmountChange}
                  calculateEqualAmount={calculateEqualAmount}
                  calculateCustomSum={calculateCustomSum}
                  handleCreateSplit={handleCreateSplit}
                  isCreating={isCreating}
                  isValid={isValid}
                />
              )}

              {/* LIST VIEW */}
              {viewMode === "list" && (
                <SplitBillList
                  listTab={listTab}
                  setListTab={setListTab}
                  statusFilter={statusFilter}
                  setStatusFilter={setStatusFilter}
                  sortOption={sortOption}
                  setSortOption={setSortOption}
                  mySplits={mySplits as any[]}
                  splitsImIn={splitsImIn}
                  sortSplits={sortSplits as any}
                  getStatusBadge={getStatusBadge}
                  getParticipantStatusBadge={getParticipantStatusBadge}
                  setSelectedSplitId={setSelectedSplitId}
                  setViewMode={setViewMode}
                  getActionGradient={getActionGradient}
                />
              )}

              {/* DETAILS VIEW */}
              {viewMode === "details" && selectedSplit && (
                <SplitBillDetails
                  selectedSplit={selectedSplit}
                  myParticipation={myParticipation}
                  isCreator={isCreator}
                  getStatusBadge={getStatusBadge}
                  getParticipantStatusBadge={getParticipantStatusBadge}
                  handlePayShare={handlePayShare}
                  handleDeclineShare={handleDeclineShare}
                  setShowMarkPaidModal={setShowMarkPaidModal}
                  setSelectedParticipantForMark={setSelectedParticipantForMark}
                  setShowReminderModal={setShowReminderModal}
                  setShowExtendModal={setShowExtendModal}
                  handleCloseSplit={handleCloseSplit}
                  handleCancelSplit={handleCancelSplit}
                />
              )}
            </ScrollArea>
          </div>
        </SheetContent>
      </Sheet>

      {/* Mark Paid Modal */}
      <Dialog open={showMarkPaidModal} onOpenChange={setShowMarkPaidModal}>
        <DialogContent className="corner-squircle rounded-[40px] sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Mark as Paid Outside App</DialogTitle>
            <DialogDescription>
              Mark this participant as having paid outside the app
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {selectedParticipantForMark && (
              <div className="rounded-lg bg-zinc-50 p-4">
                <div className="font-medium text-zinc-900">
                  {selectedParticipantForMark.user?.name}
                </div>
                <div className="text-sm text-zinc-600">
                  Amount: {formatWeiToHbar(selectedParticipantForMark.amount)}
                </div>
              </div>
            )}
            <div className="space-y-2">
              <Label>Note (Optional)</Label>
              <Textarea
                placeholder="E.g., Paid via cash, bank transfer, etc."
                value={markPaidNote}
                onChange={(e) => setMarkPaidNote(e.target.value)}
                rows={3}
              />
            </div>
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  setShowMarkPaidModal(false);
                  setMarkPaidNote("");
                  setSelectedParticipantForMark(null);
                }}
                className="corner-squircle flex-1 rounded-[15px]"
              >
                Cancel
              </Button>
              <Button
                onClick={handleMarkAsPaid}
                className="corner-squircle flex-1 rounded-[15px]"
              >
                Mark as Paid
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Send Reminder Modal */}
      <Dialog open={showReminderModal} onOpenChange={setShowReminderModal}>
        <DialogContent className="corner-squircle rounded-[40px] sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Send Reminders</DialogTitle>
            <DialogDescription>
              Send reminders to pending participants
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
              <div className="flex gap-2">
                <Info className="h-5 w-5 shrink-0 text-amber-600" />
                <div className="text-sm text-amber-800">
                  <p className="mb-1 font-medium">Rate Limits</p>
                  <p>
                    Maximum 1 reminder per participant per 24 hours, and 5 total
                    reminders per participant.
                  </p>
                </div>
              </div>
            </div>
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => setShowReminderModal(false)}
                className="corner-squircle flex-1 rounded-[15px]"
              >
                Cancel
              </Button>
              <Button
                onClick={() => handleSendReminder()}
                className="corner-squircle flex-1 rounded-[15px]"
              >
                Send to All Pending
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Extend Expiration Modal */}
      <Dialog open={showExtendModal} onOpenChange={setShowExtendModal}>
        <DialogContent className="corner-squircle rounded-[40px] sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Extend Expiration</DialogTitle>
            <DialogDescription>
              Choose a new expiration date for this split
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {selectedSplit?.expiresAt && (
              <div className="rounded-lg bg-zinc-50 p-4 text-sm">
                <div className="text-zinc-600">Current expiration:</div>
                <div className="font-medium text-zinc-900">
                  {formatExpiry(selectedSplit.expiresAt)}
                </div>
              </div>
            )}
            <div className="space-y-2">
              <Label>New Expiration Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !newExpirationDate && "text-muted-foreground",
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {newExpirationDate ? (
                      format(newExpirationDate, "PPP")
                    ) : (
                      <span>Pick a date</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={newExpirationDate}
                    onSelect={setNewExpirationDate}
                    disabled={(date) =>
                      date < new Date() ||
                      (selectedSplit?.expiresAt
                        ? date.getTime() <= selectedSplit.expiresAt
                        : false)
                    }
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  setShowExtendModal(false);
                  setNewExpirationDate(undefined);
                }}
                className="corner-squircle flex-1 rounded-[15px]"
              >
                Cancel
              </Button>
              <Button
                onClick={handleExtendExpiration}
                disabled={!newExpirationDate}
                className="corner-squircle flex-1 rounded-[15px]"
              >
                Extend
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
