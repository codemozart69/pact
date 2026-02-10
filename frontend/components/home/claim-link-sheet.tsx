"use client";

import { useState, useEffect } from "react";
import { useAppKitAccount } from "@reown/appkit/react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useWriteContract, usePublicClient } from "wagmi";
import { parseEther, decodeEventLog } from "viem";
import { Id } from "@/convex/_generated/dataModel";
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
import {
  generateClaimKeyPair,
  createClaimLinkURL,
} from "@/lib/crypto/proof-utils";
import { dateToSeconds } from "@/lib/timestamp-utils";
import {
  CLAIM_LINK_FACTORY_ADDRESS,
  ClaimLinkFactoryABI,
  AssetType,
  AccessMode as ContractAccessMode,
  SplitMode as ContractSplitMode,
} from "@/lib/contracts/claim-link-abis";
import { getActionGradient } from "@/lib/action-colors";

// Claim Link sub-components
import { ClaimLinkCreate } from "./claim-link/claim-link-create";
import { ClaimLinkList } from "./claim-link/claim-link-list";
import { ClaimLinkDetails } from "./claim-link/claim-link-details";
import { ClaimLinkSuccess } from "./claim-link/claim-link-success";
import {
  ClaimLink,
  StatusFilter,
  SortOption
} from "./claim-link/claim-link-utils";

type ViewMode = "create" | "list" | "details" | "success";
type AccessMode = "anyone" | "allowlist";
type SplitMode = "equal" | "custom";

export default function ClaimLinkSheet() {
  const [open, setOpen] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [isCreating, setIsCreating] = useState(false);
  const { address } = useAppKitAccount();

  const user = useQuery(
    api.users.getUser,
    address ? { userAddress: address } : "skip",
  );

  // Wagmi hooks
  const publicClient = usePublicClient();
  const { writeContractAsync } = useWriteContract();

  // Convex mutations
  const createClaimLinkRecord = useMutation(api.claimLinks.createClaimLink);
  const updateClaimLinkStatus = useMutation(
    api.claimLinks.updateClaimLinkStatus,
  );
  const generateUploadUrl = useMutation(api.storage.generateUploadUrl);

  // Form state
  const [visualTab, setVisualTab] = useState<"emoji" | "image">("emoji");
  const [selectedEmoji, setSelectedEmoji] = useState("💰");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [accessMode, setAccessMode] = useState<AccessMode>("anyone");
  const [splitMode, setSplitMode] = useState<SplitMode>("equal");
  const [expirationDate, setExpirationDate] = useState<Date | undefined>(
    undefined,
  );
  const [maxClaimers, setMaxClaimers] = useState("5");
  const [allowlist, setAllowlist] = useState<string[]>([""]);
  const [customAmounts, setCustomAmounts] = useState<string[]>([""]);

  // Success state
  const [createdLinkUrl, setCreatedLinkUrl] = useState("");

  // List/Details state
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [sortOption, setSortOption] = useState<SortOption>("recent");
  const [selectedLinkId, setSelectedLinkId] = useState<Id<"claimLinks"> | null>(
    null,
  );

  // Get claim links
  const claimLinks = useQuery(
    api.claimLinks.listClaimLinks,
    user
      ? {
        userId: user._id,
        status: statusFilter === "all" ? undefined : statusFilter,
      }
      : "skip",
  );

  // Get selected claim link details
  const selectedLink = useQuery(
    api.claimLinks.getClaimLinkDetails,
    selectedLinkId ? { claimLinkId: selectedLinkId } : "skip",
  );

  // Smart default: show list if user has links, otherwise show create
  useEffect(() => {
    if (open && claimLinks !== undefined) {
      if (claimLinks.length === 0 && statusFilter === "all") {
        if (viewMode !== "create") setViewMode("create");
      } else if (
        claimLinks.length > 0 &&
        viewMode === "create" &&
        statusFilter === "all"
      ) {
        setViewMode("list");
      }
    }
  }, [open, claimLinks, statusFilter, viewMode]);

  const resetForm = () => {
    setVisualTab("emoji");
    setSelectedEmoji("💰");
    setImageFile(null);
    setImagePreview("");
    setTitle("");
    setDescription("");
    setAmount("");
    setAccessMode("anyone");
    setSplitMode("equal");
    setExpirationDate(undefined);
    setMaxClaimers("5");
    setAllowlist([""]);
    setCustomAmounts([""]);
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

  const handleAddAllowlistAddress = () => {
    if (allowlist.length >= 50) {
      toast.error("Maximum 50 addresses allowed");
      return;
    }
    setAllowlist([...allowlist, ""]);
    if (splitMode === "custom") {
      setCustomAmounts([...customAmounts, ""]);
    }
  };

  const handleRemoveAllowlistAddress = (index: number) => {
    if (allowlist.length <= 1) {
      toast.error("At least one address required");
      return;
    }
    setAllowlist(allowlist.filter((_, i) => i !== index));
    if (splitMode === "custom") {
      setCustomAmounts(customAmounts.filter((_, i) => i !== index));
    }
  };

  const handleAllowlistChange = (index: number, value: string) => {
    const updated = [...allowlist];
    updated[index] = value;
    setAllowlist(updated);
  };

  const handleCustomAmountChange = (index: number, value: string) => {
    const updated = [...customAmounts];
    updated[index] = value;
    setCustomAmounts(updated);
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

    if (accessMode === "anyone" && splitMode === "equal") {
      const maxClaimersNum = parseInt(maxClaimers);
      if (isNaN(maxClaimersNum) || maxClaimersNum < 1 || maxClaimersNum > 50) {
        toast.error("Max claimers must be between 1 and 50");
        return false;
      }
    }

    if (accessMode === "allowlist") {
      for (let i = 0; i < allowlist.length; i++) {
        const addr = allowlist[i].trim();
        if (!addr) {
          toast.error(`Please enter address #${i + 1}`);
          return false;
        }
        if (!addr.match(/^0x[a-fA-F0-9]{40}$/)) {
          toast.error(`Invalid address format #${i + 1}`);
          return false;
        }
      }

      if (splitMode === "custom") {
        let sum = 0;
        for (let i = 0; i < customAmounts.length; i++) {
          const amt = parseFloat(customAmounts[i]);
          if (isNaN(amt) || amt <= 0) {
            toast.error(`Invalid amount for address #${i + 1}`);
            return false;
          }
          sum += amt;
        }

        const totalAmt = parseFloat(amount);
        if (Math.abs(sum - totalAmt) > 0.000001) {
          toast.error(
            `Custom amounts (${sum}) must equal total amount (${totalAmt})`,
          );
          return false;
        }
      }
    }

    return true;
  };

  const handleCreateLink = async () => {
    if (!address || !publicClient || user === undefined) {
      toast.error("Please connect your wallet");
      return;
    }

    if (user === null) {
      toast.error("Please create a profile first");
      return;
    }

    if (!validateForm()) return;

    setIsCreating(true);

    try {
      // 1. Handle image upload
      let imageOrEmoji = selectedEmoji;
      let imageType: "emoji" | "image" = "emoji";

      if (visualTab === "image" && imageFile) {
        toast.loading("Uploading image...", { id: "upload" });

        const uploadUrl = await generateUploadUrl();
        const uploadResult = await fetch(uploadUrl, {
          method: "POST",
          headers: { "Content-Type": imageFile.type },
          body: imageFile,
        });

        if (!uploadResult.ok) {
          toast.error("Failed to upload image", { id: "upload" });
          throw new Error("Image upload failed");
        }

        const { storageId } = await uploadResult.json();
        imageOrEmoji = storageId;
        imageType = "image";
        toast.success("Image uploaded!", { id: "upload" });
      }

      // 2. Generate keypair for "anyone" mode
      let keypair:
        | { privateKey: `0x${string}`; address: `0x${string}` }
        | undefined;
      if (accessMode === "anyone") {
        keypair = generateClaimKeyPair();
      }

      // 3. Calculate contract parameters
      const assetType = "native";
      const assetTypeEnum = AssetType.NATIVE;
      const accessModeEnum =
        accessMode === "anyone"
          ? ContractAccessMode.ANYONE
          : ContractAccessMode.ALLOWLIST;
      const splitModeEnum =
        splitMode === "equal"
          ? ContractSplitMode.EQUAL
          : ContractSplitMode.CUSTOM;

      const expirationTimeInSeconds = expirationDate
        ? BigInt(dateToSeconds(expirationDate))
        : BigInt(0);

      const contractMaxClaimers =
        accessMode === "anyone" && splitMode === "equal"
          ? BigInt(parseInt(maxClaimers))
          : BigInt(0);

      const contractAllowlist =
        accessMode === "allowlist"
          ? allowlist.map((a) => a.trim() as `0x${string}`)
          : [];

      const contractCustomAmounts =
        accessMode === "allowlist" && splitMode === "custom"
          ? customAmounts.map((a) => parseEther(a))
          : [];

      const proofAddress =
        keypair?.address || "0x0000000000000000000000000000000000000000";

      toast.loading("Deploying claim link contract...", { id: "deploy" });

      // 4. Deploy contract via Factory
      const hash = await writeContractAsync({
        address: CLAIM_LINK_FACTORY_ADDRESS as `0x${string}`,
        abi: ClaimLinkFactoryABI,
        functionName: "createClaimLink",
        args: [
          assetTypeEnum,
          "0x0000000000000000000000000000000000000000" as `0x${string}`,
          parseEther(amount),
          accessModeEnum,
          splitModeEnum,
          expirationTimeInSeconds,
          contractMaxClaimers,
          contractAllowlist,
          contractCustomAmounts,
          proofAddress as `0x${string}`,
        ],
        value: parseEther(amount),
      });

      toast.loading("Waiting for confirmation...", { id: "deploy" });

      // 5. Wait for transaction receipt
      const receipt = await publicClient.waitForTransactionReceipt({ hash });

      // 6. Extract deployed contract address from ClaimLinkDeployed event
      let deployedContractAddress: string | null = null;
      for (const log of receipt.logs) {
        try {
          const decoded = decodeEventLog({
            abi: ClaimLinkFactoryABI,
            data: log.data,
            topics: log.topics,
          });
          if (
            decoded.eventName === "ClaimLinkDeployed" &&
            decoded.args &&
            typeof decoded.args === "object" &&
            "claimLink" in decoded.args
          ) {
            deployedContractAddress = decoded.args.claimLink as `0x${string}`;
            break;
          }
        } catch {
          // Not our event, skip
        }
      }

      if (!deployedContractAddress) {
        throw new Error("Failed to get deployed contract address");
      }

      toast.loading("Saving claim link...", { id: "deploy" });

      // 7. Save to Convex (with private key for creator to retrieve later)
      const { shortId } = await createClaimLinkRecord({
        userAddress: address,
        contractAddress: deployedContractAddress,
        title: title.trim(),
        description: description.trim() || undefined,
        imageOrEmoji,
        imageType,
        assetType,
        totalAmount: amount,
        accessMode,
        splitMode: splitMode === "equal" ? "equal" : "custom",
        maxClaimers:
          accessMode === "anyone" && splitMode === "equal"
            ? parseInt(maxClaimers)
            : undefined,
        allowlist:
          accessMode === "allowlist"
            ? allowlist.map((a) => a.trim())
            : undefined,
        customAmounts:
          accessMode === "allowlist" && splitMode === "custom"
            ? customAmounts
            : undefined,
        proofAddress: keypair?.address,
        privateKey: keypair?.privateKey, // Store private key for later retrieval
        expiresAt: expirationDate ? dateToSeconds(expirationDate) : undefined,
      });

      // 8. Create shareable URL
      const linkUrl = keypair
        ? createClaimLinkURL(shortId, keypair.privateKey)
        : `${window.location.origin}/claim/${shortId}`;

      setCreatedLinkUrl(linkUrl);
      setViewMode("success");
      toast.success("Claim link created!", { id: "deploy" });
    } catch (error: unknown) {
      console.error("Create claim link error:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Failed to create claim link";
      toast.error(errorMessage, {
        id: "deploy",
      });
    } finally {
      setIsCreating(false);
    }
  };

  const handleCopyCreatedLink = (url: string) => {
    navigator.clipboard.writeText(url);
    toast.success("Link copied to clipboard!");
  };

  const handleToggleStatus = async (action: "pause" | "resume" | "cancel") => {
    if (!address || !selectedLinkId) return;

    try {
      await updateClaimLinkStatus({
        userAddress: address,
        claimLinkId: selectedLinkId,
        action,
      });
      toast.success(
        action === "pause"
          ? "Link paused"
          : action === "resume"
            ? "Link resumed"
            : "Link cancelled",
      );
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to update link";
      toast.error(errorMessage);
    }
  };

  const sortLinks = (links: ClaimLink[]) => {
    switch (sortOption) {
      case "amount":
        return [...links].sort(
          (a, b) => parseFloat(b.totalAmount) - parseFloat(a.totalAmount),
        );
      case "claims":
        return [...links].sort((a, b) => b.claimCount - a.claimCount);
      case "recent":
      default:
        return links;
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
        <button className={`corner-squircle flex h-24 w-full flex-col items-center justify-center gap-2 rounded-[40px] bg-linear-to-br ${getActionGradient('claimLink')} text-white shadow-lg transition-all hover:shadow-xl`}>
          <Link2 className="h-6 w-6" />
          <span className="text-sm font-medium">Claim Link</span>
        </button>
      </SheetTrigger>

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
              {viewMode === "create" && claimLinks && claimLinks.length > 1 && (
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
                ? "Create Claim Link"
                : viewMode === "success"
                  ? "Link Created!"
                  : viewMode === "details"
                    ? "Link Details"
                    : "Claim Links"}
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
            Manage your claim links
          </SheetDescription>

          <ScrollArea className="flex-1 overflow-auto">
            {viewMode === "create" && (
              <ClaimLinkCreate
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
                accessMode={accessMode}
                setAccessMode={setAccessMode}
                splitMode={splitMode}
                setSplitMode={setSplitMode}
                expirationDate={expirationDate}
                setExpirationDate={setExpirationDate}
                maxClaimers={maxClaimers}
                setMaxClaimers={setMaxClaimers}
                allowlist={allowlist}
                handleAddAllowlistAddress={handleAddAllowlistAddress}
                handleRemoveAllowlistAddress={handleRemoveAllowlistAddress}
                handleAllowlistChange={handleAllowlistChange}
                customAmounts={customAmounts}
                handleCustomAmountChange={handleCustomAmountChange}
                handleCreateLink={handleCreateLink}
                isCreating={isCreating}
                isValid={isValid}
              />
            )}

            {viewMode === "list" && (
              <ClaimLinkList
                statusFilter={statusFilter}
                setStatusFilter={setStatusFilter}
                sortOption={sortOption}
                setSortOption={setSortOption}
                claimLinks={claimLinks}
                sortLinks={sortLinks}
                setViewMode={setViewMode}
                setSelectedLinkId={setSelectedLinkId}
                getActionGradient={getActionGradient}
              />
            )}

            {viewMode === "details" && selectedLink && (
              <ClaimLinkDetails
                selectedLink={selectedLink as ClaimLink}
                handleToggleStatus={handleToggleStatus}
                createClaimLinkURL={createClaimLinkURL}
                handleCopyCreatedLink={handleCopyCreatedLink}
              />
            )}

            {viewMode === "success" && (
              <ClaimLinkSuccess
                createdLinkUrl={createdLinkUrl}
                accessMode={accessMode}
                handleCopyCreatedLink={handleCopyCreatedLink}
                resetForm={resetForm}
                setOpen={setOpen}
              />
            )}
          </ScrollArea>
        </div>
      </SheetContent>
    </Sheet>
  );
}
