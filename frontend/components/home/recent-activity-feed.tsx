"use client";

import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Spinner } from "@/components/ui/spinner";
import ActivityItem from "./activity-item";
import {
  ArrowUpRight,
  ArrowDownLeft,
  HandCoins,
  CheckCircle,
  XCircle,
  Link2,
  Gift,
  UserPlus,
  Clock,
  Split,
} from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ACTION_COLORS } from "@/lib/action-colors";
import { formatSmartHbar } from "@/lib/format-utils";

// Activity Detail sub-components
import { PaymentDetails } from "./activity-details/payment-details";
import { RequestDetails } from "./activity-details/request-details";
import { FriendAcceptedDetails } from "./activity-details/friend-accepted-details";
import { ClaimLinkDetails } from "./activity-details/claim-link-details";

interface RecentActivityFeedProps {
  userId: Id<"users">;
}

type ActivityType =
  | "payment_sent"
  | "payment_received"
  | "request_sent"
  | "request_received"
  | "request_completed"
  | "request_declined"
  | "payment_link_received"
  | "claim_link_claimed"
  | "friend_accepted"
  | "split_bill_created"
  | "split_bill_paid"
  | "split_bill_participant";

interface ModalState {
  type: ActivityType | null;
  paymentId?: Id<"payments">;
  paymentRequestId?: Id<"paymentRequests">;
  friendshipId?: Id<"friendships">;
  paymentLinkId?: Id<"paymentLinks">;
  claimLinkId?: Id<"claimLinks">;
  splitBillId?: Id<"splitBills">;
}

export default function RecentActivityFeed({
  userId,
}: RecentActivityFeedProps) {
  const [modalState, setModalState] = useState<ModalState>({ type: null });

  const activities = useQuery(api.activityFeed.getRecentActivityFeed, {
    userId,
    limit: 10,
  });

  const getActivityConfig = (type: ActivityType) => {
    switch (type) {
      case "payment_sent":
        return {
          icon: <ArrowUpRight className="h-5 w-5 text-white" />,
          iconBgClass: ACTION_COLORS.send.iconBg,
          titlePrefix: "Sent to",
          amountPrefix: "-",
          amountClass: ACTION_COLORS.send.text.primary,
        };
      case "payment_received":
        return {
          icon: <ArrowDownLeft className="h-5 w-5 text-white" />,
          iconBgClass: ACTION_COLORS.receive.iconBg,
          titlePrefix: "Received from",
          amountPrefix: "+",
          amountClass: ACTION_COLORS.receive.text.primary,
        };
      case "request_sent":
        return {
          icon: <HandCoins className="h-5 w-5 text-white" />,
          iconBgClass: ACTION_COLORS.request.iconBg,
          titlePrefix: "Requested from",
          amountPrefix: "",
          amountClass: ACTION_COLORS.request.text.primary,
        };
      case "request_received":
        return {
          icon: <HandCoins className="h-5 w-5 text-white" />,
          iconBgClass: "bg-purple-500",
          titlePrefix: "Request from",
          amountPrefix: "",
          amountClass: "text-purple-600",
        };
      case "request_completed":
        return {
          icon: <CheckCircle className="h-5 w-5 text-white" />,
          iconBgClass: ACTION_COLORS.receive.iconBg,
          titlePrefix: "Request paid by",
          amountPrefix: "+",
          amountClass: ACTION_COLORS.receive.text.primary,
        };
      case "request_declined":
        return {
          icon: <XCircle className="h-5 w-5 text-white" />,
          iconBgClass: "bg-red-500",
          titlePrefix: "Declined by",
          amountPrefix: "",
          amountClass: "text-red-600",
        };
      case "payment_link_received":
        return {
          icon: <Link2 className="h-5 w-5 text-white" />,
          iconBgClass: ACTION_COLORS.paymentLink.iconBg,
          titlePrefix: "Link payment from",
          amountPrefix: "+",
          amountClass: ACTION_COLORS.receive.text.primary,
        };
      case "claim_link_claimed":
        return {
          icon: <Gift className="h-5 w-5 text-white" />,
          iconBgClass: ACTION_COLORS.claimLink.iconBg,
          titlePrefix: "Claimed by",
          amountPrefix: "-",
          amountClass: ACTION_COLORS.claimLink.text.primary,
        };
      case "friend_accepted":
        return {
          icon: <UserPlus className="h-5 w-5 text-white" />,
          iconBgClass: "bg-teal-500",
          titlePrefix: "Now friends with",
          amountPrefix: "",
          amountClass: "",
        };
      case "split_bill_created":
        return {
          icon: <Split className="h-5 w-5 text-white" />,
          iconBgClass: "bg-cyan-500",
          titlePrefix: "Created split bill",
          amountPrefix: "",
          amountClass: "text-cyan-600",
        };
      case "split_bill_paid":
        return {
          icon: <CheckCircle className="h-5 w-5 text-white" />,
          iconBgClass: "bg-teal-500",
          titlePrefix: "Split paid by",
          amountPrefix: "+",
          amountClass: "text-green-600",
        };
      case "split_bill_participant":
        return {
          icon: <Split className="h-5 w-5 text-white" />,
          iconBgClass: ACTION_COLORS.splitBill.iconBg,
          titlePrefix: "Added to split by",
          amountPrefix: "",
          amountClass: ACTION_COLORS.splitBill.text.primary,
        };
      default:
        return {
          icon: <Clock className="h-5 w-5 text-white" />,
          iconBgClass: "bg-zinc-500",
          titlePrefix: "",
          amountPrefix: "",
          amountClass: "text-zinc-600",
        };
    }
  };

  if (activities === undefined) {
    return (
      <div className="flex items-center justify-center py-8">
        <Spinner className="size-6 text-zinc-400" />
      </div>
    );
  }

  if (activities.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center">
        <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-zinc-100">
          <Clock className="h-6 w-6 text-zinc-400" />
        </div>
        <p className="text-sm text-zinc-500">
          Your recent transactions will appear here
        </p>
      </div>
    );
  }

  const handleActivityClick = (activity: (typeof activities)[0]) => {
    setModalState({
      type: activity.type,
      paymentId: activity.paymentId,
      paymentRequestId: activity.paymentRequestId,
      friendshipId: activity.friendshipId,
      paymentLinkId: activity.paymentLinkId,
      claimLinkId: activity.claimLinkId,
      splitBillId: activity.splitBillId,
    });
  };

  const getDescription = (activity: (typeof activities)[0]) => {
    // Payment with split bill context takes priority
    if (activity.type === "payment_sent" && activity.splitBillTitle) {
      return `for split: "${activity.splitBillTitle}"`;
    }

    if (
      activity.type === "payment_link_received" &&
      activity.paymentLinkTitle
    ) {
      return `via "${activity.paymentLinkTitle}"`;
    }
    if (activity.type === "claim_link_claimed" && activity.claimLinkTitle) {
      return `from "${activity.claimLinkTitle}"`;
    }
    // Split bill descriptions
    if (activity.type === "split_bill_created" && activity.splitBillTitle) {
      return `"${activity.splitBillTitle}"`;
    }
    if (activity.type === "split_bill_paid" && activity.splitBillTitle) {
      return `for "${activity.splitBillTitle}"`;
    }
    if (activity.type === "split_bill_participant" && activity.splitBillTitle) {
      return `"${activity.splitBillTitle}"`;
    }
    if (activity.note) {
      return activity.note.length > 40
        ? `${activity.note.substring(0, 40)}...`
        : activity.note;
    }
    return "";
  };

  return (
    <>
      <div className="divide-y divide-zinc-100">
        {activities.map((activity) => {
          const config = getActivityConfig(activity.type);
          const userName =
            activity.otherUser?.name ||
            (activity.type === "split_bill_created" ? "" : "Someone");
          const description = getDescription(activity);

          return (
            <ActivityItem
              key={activity.id}
              icon={config.icon}
              iconBgClass={config.iconBgClass}
              title={`${config.titlePrefix}${userName ? ` ${userName}` : ""}`}
              description={description}
              amount={
                activity.amount ? formatSmartHbar(activity.amount) : undefined
              }
              amountPrefix={config.amountPrefix}
              amountClass={config.amountClass}
              timestamp={activity.timestamp}
              avatar={activity.otherUser?.profileImageUrl}
              onClick={() => handleActivityClick(activity)}
            />
          );
        })}
      </div>

      {/* Activity Detail Modal */}
      <ActivityDetailModal
        modalState={modalState}
        onClose={() => setModalState({ type: null })}
      />
    </>
  );
}

// Activity Detail Modal Component
function ActivityDetailModal({
  modalState,
  onClose,
}: {
  modalState: ModalState;
  onClose: () => void;
}) {
  const isOpen = modalState.type !== null;

  // Fetch payment details when needed
  const payment = useQuery(
    api.payments.getPaymentById,
    modalState.paymentId ? { paymentId: modalState.paymentId } : "skip",
  );

  // Fetch payment request details when needed
  const paymentRequest = useQuery(
    api.paymentRequests.getRequestById,
    modalState.paymentRequestId
      ? { requestId: modalState.paymentRequestId }
      : "skip",
  );

  // Fetch claim link details when needed
  const claimLink = useQuery(
    api.claimLinks.getClaimLinkDetails,
    modalState.claimLinkId ? { claimLinkId: modalState.claimLinkId } : "skip",
  );

  // Fetch payment link details when needed
  const paymentLink = useQuery(
    api.paymentLinks.getPaymentLinkDetails,
    modalState.paymentLinkId
      ? { paymentLinkId: modalState.paymentLinkId }
      : "skip",
  );

  if (!isOpen) return null;

  const getModalTitle = () => {
    switch (modalState.type) {
      case "payment_sent":
        return "Payment Sent";
      case "payment_received":
        return "Payment Received";
      case "request_sent":
        return "Request Sent";
      case "request_received":
        return "Request Received";
      case "request_completed":
        return "Request Completed";
      case "request_declined":
        return "Request Declined";
      case "payment_link_received":
        return "Payment Link Payment";
      case "claim_link_claimed":
        return "Claim Link Claimed";
      case "friend_accepted":
        return "New Friend";
      case "split_bill_created":
        return "Split Bill Created";
      case "split_bill_paid":
        return "Split Bill Payment";
      case "split_bill_participant":
        return "Split Bill Request";
      default:
        return "Activity Details";
    }
  };

  const renderContent = () => {
    // Dispatch based on modal type
    if (
      (modalState.type === "payment_sent" ||
        modalState.type === "payment_received" ||
        modalState.type === "payment_link_received") &&
      payment
    ) {
      return (
        <PaymentDetails
          payment={payment}
          modalType={modalState.type}
          paymentLink={paymentLink}
          onClose={onClose}
        />
      );
    }

    if (
      (modalState.type === "request_sent" ||
        modalState.type === "request_received" ||
        modalState.type === "request_completed" ||
        modalState.type === "request_declined") &&
      paymentRequest
    ) {
      const otherUser =
        modalState.type === "request_sent"
          ? paymentRequest.recipient
          : paymentRequest.requester;
      return (
        <RequestDetails
          paymentRequest={paymentRequest}
          otherUser={otherUser}
          onClose={onClose}
        />
      );
    }

    if (modalState.type === "friend_accepted") {
      return <FriendAcceptedDetails onClose={onClose} />;
    }

    if (modalState.type === "claim_link_claimed" && claimLink) {
      return (
        <ClaimLinkDetails claimLink={claimLink} onClose={onClose} />
      );
    }

    // Split bill activities - dispatch event to open split bill sheet
    if (
      (modalState.type === "split_bill_created" ||
        modalState.type === "split_bill_paid" ||
        modalState.type === "split_bill_participant") &&
      modalState.splitBillId
    ) {
      // Immediately dispatch event to open split bill details
      // and close this modal
      window.dispatchEvent(
        new CustomEvent("open-split-bill-details", {
          detail: { splitBillId: modalState.splitBillId },
        })
      );
      onClose();
      return null;
    }

    // Loading state
    return (
      <div className="flex items-center justify-center py-8">
        <Spinner className="size-6 text-zinc-400" />
      </div>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{getModalTitle()}</DialogTitle>
          <DialogDescription className="sr-only">
            Activity details
          </DialogDescription>
        </DialogHeader>
        {renderContent()}
      </DialogContent>
    </Dialog>
  );
}
