"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useAppKitAccount } from "@reown/appkit/react";
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetTitle,
    SheetTrigger,
    SheetClose,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
    Link2,
    X,
    ArrowLeft,
} from "lucide-react";
import { toast } from "sonner";
import { getActionGradient } from "@/lib/action-colors";
import { PaymentLinkQRModal } from "@/components/home/payment-link-qr-modal";
import { formatFullDate, formatExpiry } from "@/lib/date-utils";
import { formatAddress } from "@/lib/format-utils";

// Payment Link sub-components
import { PaymentLinkCreate } from "./payment-link/payment-link-create";
import { PaymentLinkList } from "./payment-link/payment-link-list";
import { PaymentLinkSuccess } from "./payment-link/payment-link-success";
import { PaymentLinkDetails } from "./payment-link/payment-link-details";
import { PaymentLinkEdit } from "./payment-link/payment-link-edit";
import {
    StatusFilter,
    SortOption,
    ViewMode
} from "./payment-link/payment-link-utils";

export default function PaymentLinkSheet() {
    const [open, setOpen] = useState(false);
    const [viewMode, setViewMode] = useState<ViewMode>("list");
    const { address } = useAppKitAccount();

    // Form state
    const [visualTab, setVisualTab] = useState<"emoji" | "image">("emoji");
    const [selectedEmoji, setSelectedEmoji] = useState("💰");
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string>("");
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [amount, setAmount] = useState("");
    const [linkType, setLinkType] = useState<"single-use" | "reusable">(
        "single-use"
    );
    const [expiryDate, setExpiryDate] = useState<Date | undefined>(undefined);

    // List state
    const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
    const [sortOption, setSortOption] = useState<SortOption>("recent");
    const [selectedLinkId, setSelectedLinkId] = useState<Id<"paymentLinks"> | null>(
        null
    );

    // Success state
    const [createdLinkUrl, setCreatedLinkUrl] = useState("");
    const [createdShortId, setCreatedShortId] = useState("");

    // QR modal state
    const [showQRModal, setShowQRModal] = useState(false);
    const [qrLinkUrl, setQrLinkUrl] = useState("");
    const [qrLinkTitle, setQrLinkTitle] = useState("");

    // Edit state
    const [editTitle, setEditTitle] = useState("");
    const [editDescription, setEditDescription] = useState("");
    const [editExpiryDate, setEditExpiryDate] = useState<Date | undefined>(undefined);

    // Get current user
    const currentUser = useQuery(
        api.users.getUser,
        address ? { userAddress: address } : "skip"
    );

    // Get payment links
    const paymentLinks = useQuery(
        api.paymentLinks.listPaymentLinks,
        currentUser
            ? {
                userId: currentUser._id,
                status: statusFilter === "all" ? undefined : statusFilter,
            }
            : "skip"
    );

    // Get selected link details
    const selectedLink = useQuery(
        api.paymentLinks.getPaymentLinkDetails,
        selectedLinkId ? { paymentLinkId: selectedLinkId } : "skip"
    );

    // Get payment history for selected link
    const paymentHistory = useQuery(
        api.paymentLinks.getPaymentLinkHistory,
        selectedLinkId ? { paymentLinkId: selectedLinkId } : "skip"
    );

    // Mutations
    const createPaymentLink = useMutation(api.paymentLinks.createPaymentLink);
    const generateUploadUrl = useMutation(api.storage.generateUploadUrl);
    const updateSettings = useMutation(api.paymentLinks.updatePaymentLinkSettings);
    const toggleStatus = useMutation(api.paymentLinks.togglePaymentLinkStatus);

    // Smart default: show list if user has links, otherwise show create
    useEffect(() => {
        if (open && paymentLinks !== undefined) {
            // Only redirect to create if we're on the "all" tab and there are no links at all
            if (paymentLinks.length === 0 && statusFilter === "all") {
                if (viewMode !== "create") {
                    // Use a small timeout or a microtask to avoid synchronous setState in effect
                    setTimeout(() => setViewMode("create"), 0);
                }
            } else if (paymentLinks.length > 0 && viewMode === "create" && statusFilter === "all") {
                setTimeout(() => setViewMode("list"), 0);
            }
        }
    }, [open, paymentLinks, statusFilter, viewMode]);

    const resetForm = () => {
        setVisualTab("emoji");
        setSelectedEmoji("💰");
        setImageFile(null);
        setImagePreview("");
        setTitle("");
        setDescription("");
        setAmount("");
        setLinkType("single-use");
        setExpiryDate(undefined);
    };

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (file.size > 5 * 1024 * 1024) {
            toast.error("Image must be under 5MB");
            return;
        }

        setImageFile(file);
        setImagePreview(URL.createObjectURL(file));
    };

    const handleCreateLink = async () => {
        if (!address) {
            toast.error("Please connect your wallet");
            return;
        }

        if (!title.trim()) {
            toast.error("Please enter a title");
            return;
        }

        if (!amount || parseFloat(amount) <= 0) {
            toast.error("Please enter a valid amount");
            return;
        }

        try {
            let imageOrEmoji = selectedEmoji;
            let imageType: "emoji" | "image" = "emoji";

            if (visualTab === "image" && imageFile) {
                const uploadUrl = await generateUploadUrl();
                const result = await fetch(uploadUrl, {
                    method: "POST",
                    headers: { "Content-Type": imageFile.type },
                    body: imageFile,
                });
                const { storageId } = await result.json();
                imageOrEmoji = storageId;
                imageType = "image";
            }

            const result = await createPaymentLink({
                userAddress: address,
                title: title.trim(),
                description: description.trim() || undefined,
                imageOrEmoji,
                imageType,
                amount,
                linkType,
                expiresAt: expiryDate ? expiryDate.getTime() : undefined,
            });

            const linkUrl = `${window.location.origin}/pay/${result.shortId}`;
            setCreatedLinkUrl(linkUrl);
            setCreatedShortId(result.shortId);
            setViewMode("success");
            toast.success("Payment link created!");
        } catch (error) {
            const err = error as Error;
            toast.error(err.message || "Failed to create payment link");
        }
    };

    const handleCopyCreatedLink = () => {
        navigator.clipboard.writeText(createdLinkUrl);
        toast.success("Link copied to clipboard!");
    };

    const handleShareCreatedLink = async () => {
        if (navigator.share) {
            try {
                await navigator.share({
                    title: "Payment Link",
                    text: `Pay me via this link: ${createdLinkUrl}`,
                    url: createdLinkUrl,
                });
            } catch {
                // User cancelled or share failed - no action needed
            }
        } else {
            handleCopyCreatedLink();
        }
    };

    const handleViewDetails = (linkId: Id<"paymentLinks">) => {
        setSelectedLinkId(linkId);
        setViewMode("details");
    };

    const handleBackToList = () => {
        setViewMode("list");
        setSelectedLinkId(null);
    };

    const handleBackToDetails = () => {
        setViewMode("details");
    };

    const handleOpenEdit = () => {
        if (!selectedLink) return;
        setEditTitle(selectedLink.title);
        setEditDescription(selectedLink.description || "");
        setEditExpiryDate(selectedLink.expiresAt ? new Date(selectedLink.expiresAt) : undefined);
        setViewMode("edit");
    };

    const handleSaveEdit = async () => {
        if (!address || !selectedLinkId) return;

        if (!editTitle.trim()) {
            toast.error("Title cannot be empty");
            return;
        }

        try {
            await updateSettings({
                userAddress: address,
                paymentLinkId: selectedLinkId,
                title: editTitle.trim(),
                description: editDescription.trim() || undefined,
                expiresAt: editExpiryDate ? editExpiryDate.getTime() : undefined,
            });
            toast.success("Settings updated!");
            setViewMode("details");
        } catch (error) {
            const err = error as Error;
            toast.error(err.message || "Failed to update settings");
        }
    };

    const handleShowQR = (url: string, title: string) => {
        setQrLinkUrl(url);
        setQrLinkTitle(title);
        setShowQRModal(true);
    };

    const handleToggleStatus = async (action: "pause" | "resume" | "deactivate") => {
        if (!address || !selectedLinkId) return;

        try {
            await toggleStatus({
                userAddress: address,
                paymentLinkId: selectedLinkId,
                action,
            });
            toast.success(
                action === "pause"
                    ? "Link paused"
                    : action === "resume"
                        ? "Link resumed"
                        : "Link deactivated"
            );
        } catch (error) {
            const err = error as Error;
            toast.error(err.message || "Failed to update link");
        }
    };

    const sortLinks = (links: any[]) => {
        switch (sortOption) {
            case "collected":
                return [...links].sort(
                    (a, b) => parseFloat(b.totalCollected) - parseFloat(a.totalCollected)
                );
            case "payments":
                return [...links].sort((a, b) => b.paymentCount - a.paymentCount);
            case "recent":
            default:
                return links; // Already sorted by creation time desc
        }
    };

    const isValid = !!(title.trim() && amount && parseFloat(amount) > 0);

    return (
        <Sheet
            open={open}
            onOpenChange={(isOpen) => {
                setOpen(isOpen);
                if (!isOpen) {
                    setTimeout(() => {
                        resetForm();
                        setViewMode("list");
                        setSelectedLinkId(null);
                    }, 300);
                }
            }}
        >
            <SheetTrigger asChild>
                <button className={`flex h-24 w-full flex-col items-center justify-center gap-2 rounded-[40px] corner-squircle bg-linear-to-br ${getActionGradient('paymentLink')} text-white shadow-lg transition-all hover:shadow-xl`}>
                    <Link2 className="h-6 w-6" />
                    <span className="text-sm font-medium">Payment Link</span>
                </button>
            </SheetTrigger>

            <SheetContent
                side="bottom"
                className="h-[90vh] rounded-t-[50px] corner-squircle p-0"
                showCloseButton={false}
            >
                <div className="mx-auto flex h-full w-full max-w-2xl flex-col">
                    {/* Header */}
                    <div className="relative flex items-center justify-between px-6 py-4">
                        {/* Left side - Back button or empty */}
                        <div className="flex items-center">
                            {viewMode === "edit" && (
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={handleBackToDetails}
                                >
                                    <ArrowLeft className="h-5 w-5" />
                                </Button>
                            )}
                            {viewMode === "details" && (
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={handleBackToList}
                                >
                                    <ArrowLeft className="h-5 w-5" />
                                </Button>
                            )}
                            {viewMode === "create" && paymentLinks && paymentLinks.length > 0 && (
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => setViewMode("list")}
                                >
                                    <ArrowLeft className="h-5 w-5" />
                                </Button>
                            )}
                        </div>

                        {/* Centered title */}
                        <SheetTitle className="absolute left-1/2 -translate-x-1/2 text-xl font-semibold">
                            {viewMode === "create"
                                ? "Create Payment Link"
                                : viewMode === "success"
                                    ? "Link Created!"
                                    : viewMode === "details"
                                        ? "Link Details"
                                        : viewMode === "edit"
                                            ? "Edit Link"
                                            : "Payment Links"}
                        </SheetTitle>

                        {/* Right side - Action buttons */}
                        <div className="flex items-center gap-2">
                            {/* viewMode === "list" button removed */}
                            <SheetClose asChild>
                                <Button variant="ghost" size="icon">
                                    <X className="h-5 w-5" />
                                    <span className="sr-only">Close</span>
                                </Button>
                            </SheetClose>
                        </div>
                    </div>

                    <SheetDescription className="sr-only">
                        Manage your payment links
                    </SheetDescription>

                    <ScrollArea className="flex-1 overflow-auto">
                        {/* CREATE VIEW */}
                        {viewMode === "create" && (
                            <PaymentLinkCreate
                                visualTab={visualTab}
                                setVisualTab={setVisualTab}
                                selectedEmoji={selectedEmoji}
                                setSelectedEmoji={setSelectedEmoji}
                                handleImageChange={handleImageChange}
                                imagePreview={imagePreview}
                                setImageFile={setImageFile}
                                setImagePreview={setImagePreview}
                                title={title}
                                setTitle={setTitle}
                                description={description}
                                setDescription={setDescription}
                                amount={amount}
                                setAmount={setAmount}
                                linkType={linkType}
                                setLinkType={setLinkType}
                                expiryDate={expiryDate}
                                setExpiryDate={setExpiryDate}
                                handleCreateLink={handleCreateLink}
                                isValid={isValid}
                            />
                        )}

                        {/* SUCCESS VIEW */}
                        {viewMode === "success" && (
                            <PaymentLinkSuccess
                                createdLinkUrl={createdLinkUrl}
                                createdShortId={createdShortId}
                                title={title}
                                handleCopyCreatedLink={handleCopyCreatedLink}
                                handleShareCreatedLink={handleShareCreatedLink}
                                handleShowQR={handleShowQR}
                                resetForm={resetForm}
                                setViewMode={setViewMode}
                            />
                        )}

                        {/* LIST VIEW */}
                        {viewMode === "list" && (
                            <PaymentLinkList
                                statusFilter={statusFilter}
                                setStatusFilter={setStatusFilter}
                                sortOption={sortOption}
                                setSortOption={setSortOption}
                                paymentLinks={paymentLinks}
                                sortLinks={sortLinks}
                                setViewMode={setViewMode}
                                handleViewDetails={handleViewDetails}
                                getActionGradient={getActionGradient}
                            />
                        )}

                        {/* DETAILS VIEW */}
                        {viewMode === "details" && selectedLink && (
                            <PaymentLinkDetails
                                selectedLink={selectedLink}
                                handleOpenEdit={handleOpenEdit}
                                handleShowQR={handleShowQR}
                                handleToggleStatus={handleToggleStatus}
                                paymentHistory={paymentHistory}
                                formatExpiry={formatExpiry}
                                formatAddress={formatAddress}
                                formatFullDate={formatFullDate}
                            />
                        )}

                        {/* EDIT VIEW */}
                        {viewMode === "edit" && selectedLink && (
                            <PaymentLinkEdit
                                selectedLink={selectedLink}
                                editTitle={editTitle}
                                setEditTitle={setEditTitle}
                                editDescription={editDescription}
                                setEditDescription={setEditDescription}
                                editExpiryDate={editExpiryDate}
                                setEditExpiryDate={setEditExpiryDate}
                                handleBackToDetails={handleBackToDetails}
                                handleSaveEdit={handleSaveEdit}
                            />
                        )}
                    </ScrollArea>
                </div>
            </SheetContent>

            {/* QR Code Modal */}
            <PaymentLinkQRModal
                open={showQRModal}
                onOpenChange={setShowQRModal}
                linkUrl={qrLinkUrl}
                linkTitle={qrLinkTitle}
            />
        </Sheet>
    );
}