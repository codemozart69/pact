"use client";

import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar } from "@/components/ui/calendar";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import {
    X,
    Image as ImageIcon,
    Calendar as CalendarIcon,
    Info,
    Plus,
    Trash2,
    Loader2,
} from "lucide-react";
import { format } from "date-fns";
import EmojiPicker from "emoji-picker-react";
import { cn } from "@/lib/utils";

interface ClaimLinkCreateProps {
    visualTab: "emoji" | "image";
    setVisualTab: (tab: "emoji" | "image") => void;
    selectedEmoji: string;
    setSelectedEmoji: (emoji: string) => void;
    handleImageChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    imagePreview: string;
    setImageFile: (file: File | null) => void;
    setImagePreview: (preview: string) => void;
    title: string;
    setTitle: (title: string) => void;
    description: string;
    setDescription: (desc: string) => void;
    amount: string;
    setAmount: (amount: string) => void;
    accessMode: "anyone" | "allowlist";
    setAccessMode: (mode: "anyone" | "allowlist") => void;
    splitMode: "equal" | "custom";
    setSplitMode: (mode: "equal" | "custom") => void;
    expirationDate: Date | undefined;
    setExpirationDate: (date: Date | undefined) => void;
    maxClaimers: string;
    setMaxClaimers: (count: string) => void;
    allowlist: string[];
    handleAddAllowlistAddress: () => void;
    handleRemoveAllowlistAddress: (index: number) => void;
    handleAllowlistChange: (index: number, value: string) => void;
    customAmounts: string[];
    handleCustomAmountChange: (index: number, value: string) => void;
    handleCreateLink: () => void;
    isCreating: boolean;
    isValid: boolean;
}

export function ClaimLinkCreate({
    visualTab,
    setVisualTab,
    selectedEmoji,
    setSelectedEmoji,
    handleImageChange,
    imagePreview,
    setImageFile,
    setImagePreview,
    title,
    setTitle,
    description,
    setDescription,
    amount,
    setAmount,
    accessMode,
    setAccessMode,
    splitMode,
    setSplitMode,
    expirationDate,
    setExpirationDate,
    maxClaimers,
    setMaxClaimers,
    allowlist,
    handleAddAllowlistAddress,
    handleRemoveAllowlistAddress,
    handleAllowlistChange,
    customAmounts,
    handleCustomAmountChange,
    handleCreateLink,
    isCreating,
    isValid,
}: ClaimLinkCreateProps) {
    return (
        <div className="space-y-6 p-6 pb-10">
            {/* Visual Selection */}
            <div className="space-y-2">
                <Label>Visual (Image or Emoji)</Label>
                <Tabs
                    value={visualTab}
                    onValueChange={(v) => setVisualTab(v as "emoji" | "image")}
                >
                    <TabsList className="grid w-fit grid-cols-2">
                        <TabsTrigger value="image">Image</TabsTrigger>
                        <TabsTrigger value="emoji">Emoji</TabsTrigger>
                    </TabsList>

                    <TabsContent value="image" className="mt-4">
                        <div className="flex flex-col items-center gap-4">
                            {imagePreview ? (
                                <div className="relative h-32 w-32">
                                    <Image
                                        src={imagePreview}
                                        alt="Preview"
                                        fill
                                        className="rounded-lg object-cover"
                                    />
                                    <button
                                        onClick={() => {
                                            setImageFile(null);
                                            setImagePreview("");
                                        }}
                                        className="absolute -right-2 -top-2 z-10 rounded-full bg-red-500 p-1 text-white"
                                    >
                                        <X className="h-4 w-4" />
                                    </button>
                                </div>
                            ) : (
                                <label className="flex h-32 w-32 cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-zinc-300 hover:border-zinc-400">
                                    <ImageIcon className="h-8 w-8 text-zinc-400" />
                                    <span className="mt-2 text-sm text-zinc-500">
                                        Upload Image
                                    </span>
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={handleImageChange}
                                        className="hidden"
                                    />
                                </label>
                            )}
                            <p className="text-xs text-zinc-500">Max 5MB</p>
                        </div>
                    </TabsContent>

                    <TabsContent value="emoji" className="mt-4">
                        <div className="flex flex-col items-center gap-4">
                            <div className="text-6xl">{selectedEmoji}</div>
                            <EmojiPicker
                                onEmojiClick={(emoji) => setSelectedEmoji(emoji.emoji)}
                                width="fit"
                                height="300px"
                            />
                        </div>
                    </TabsContent>
                </Tabs>
            </div>

            {/* Title */}
            <div className="space-y-2">
                <Label>Title *</Label>
                <Input
                    placeholder="e.g., Team Bonus, Event Reward"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    maxLength={100}
                />
                <p className="text-xs text-zinc-500">
                    {title.length}/100 characters
                </p>
            </div>

            {/* Description */}
            <div className="space-y-2">
                <Label>Description (Optional)</Label>
                <Textarea
                    placeholder="What is this claim link for?"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    maxLength={500}
                    rows={3}
                />
                <p className="text-xs text-zinc-500">
                    {description.length}/500 characters
                </p>
            </div>

            {/* Total Amount */}
            <div className="space-y-2">
                <Label>Total Amount (HBAR) *</Label>
                <Input
                    type="number"
                    step="0.000001"
                    placeholder="0.00"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                />
            </div>

            {/* Access Mode */}
            <div className="space-y-2">
                <Label>Who Can Claim?</Label>
                <RadioGroup
                    value={accessMode}
                    onValueChange={(v) => setAccessMode(v as "anyone" | "allowlist")}
                >
                    <div className="flex items-start space-x-2 rounded-lg border p-4">
                        <RadioGroupItem value="anyone" id="anyone" />
                        <div className="flex-1">
                            <Label htmlFor="anyone" className="font-medium">
                                Anyone with the link
                            </Label>
                            <p className="text-sm text-zinc-500">
                                Share the link privately - only those with it can claim
                            </p>
                        </div>
                    </div>
                    <div className="flex items-start space-x-2 rounded-lg border p-4">
                        <RadioGroupItem value="allowlist" id="allowlist" />
                        <div className="flex-1">
                            <Label htmlFor="allowlist" className="font-medium">
                                Specific addresses only
                            </Label>
                            <p className="text-sm text-zinc-500">
                                Only whitelisted addresses can claim
                            </p>
                        </div>
                    </div>
                </RadioGroup>
            </div>

            {/* Split Mode */}
            <div className="space-y-2">
                <Label>How to Split?</Label>
                <RadioGroup
                    value={splitMode}
                    onValueChange={(v) => setSplitMode(v as "equal" | "custom")}
                >
                    <div className="flex items-start space-x-2 rounded-lg border p-4">
                        <RadioGroupItem value="equal" id="equal" />
                        <div className="flex-1">
                            <Label htmlFor="equal" className="font-medium">
                                Equal Split
                            </Label>
                            <p className="text-sm text-zinc-500">
                                {accessMode === "anyone"
                                    ? "Everyone gets the same amount"
                                    : "All whitelisted addresses get the same amount"}
                            </p>
                        </div>
                    </div>
                    {accessMode === "allowlist" && (
                        <div className="flex items-start space-x-2 rounded-lg border p-4">
                            <RadioGroupItem value="custom" id="custom" />
                            <div className="flex-1">
                                <Label htmlFor="custom" className="font-medium">
                                    Custom Amounts
                                </Label>
                                <p className="text-sm text-zinc-500">
                                    Assign different amounts to each address
                                </p>
                            </div>
                        </div>
                    )}
                </RadioGroup>
            </div>

            {/* Max Claimers (for anyone + equal) */}
            {accessMode === "anyone" && splitMode === "equal" && (
                <div className="space-y-2">
                    <Label>Max Number of Claimers *</Label>
                    <Input
                        type="number"
                        min="1"
                        max="50"
                        value={maxClaimers}
                        onChange={(e) => setMaxClaimers(e.target.value)}
                    />
                    <p className="text-xs text-zinc-500">Between 1 and 50</p>
                </div>
            )}

            {/* Allowlist / Addresses */}
            {accessMode === "allowlist" && (
                <div className="space-y-4 rounded-lg border p-4">
                    <div className="flex items-center justify-between">
                        <Label>Whitelisted Addresses</Label>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handleAddAllowlistAddress}
                            className="h-7 rounded-[10px]"
                        >
                            <Plus className="mr-1 h-3 w-3" />
                            Add
                        </Button>
                    </div>

                    <div className="space-y-3">
                        {allowlist.map((addr, index) => (
                            <div key={index} className="space-y-2">
                                <div className="flex gap-2">
                                    <Input
                                        placeholder="0x..."
                                        value={addr}
                                        onChange={(e) =>
                                            handleAllowlistChange(index, e.target.value)
                                        }
                                        className="text-xs font-mono"
                                    />
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => handleRemoveAllowlistAddress(index)}
                                        className="shrink-0 text-red-500 hover:text-red-600"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                                {splitMode === "custom" && (
                                    <div className="flex items-center gap-2 px-1">
                                        <span className="text-xs text-zinc-500">Amount:</span>
                                        <Input
                                            type="number"
                                            placeholder="0.00"
                                            value={customAmounts[index]}
                                            onChange={(e) =>
                                                handleCustomAmountChange(index, e.target.value)
                                            }
                                            className="h-8 text-xs"
                                        />
                                        <span className="text-xs text-zinc-500">HBAR</span>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Expiry Date */}
            <div className="space-y-2">
                <Label>Expiry Date (Optional)</Label>
                <Popover>
                    <PopoverTrigger asChild>
                        <Button
                            variant="outline"
                            className={cn(
                                "w-full justify-start text-left font-normal",
                                !expirationDate && "text-muted-foreground"
                            )}
                        >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {expirationDate ? (
                                format(expirationDate, "PPP")
                            ) : (
                                <span>No Expiration</span>
                            )}
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                            mode="single"
                            selected={expirationDate}
                            onSelect={setExpirationDate}
                            disabled={(date) => date < new Date()}
                            initialFocus
                        />
                        {expirationDate && (
                            <div className="border-t p-3">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="w-full"
                                    onClick={() => setExpirationDate(undefined)}
                                >
                                    Clear expiration
                                </Button>
                            </div>
                        )}
                    </PopoverContent>
                </Popover>
                <div className="flex items-start gap-2 text-xs text-zinc-500">
                    <Info className="mt-0.5 h-3 w-3 shrink-0" />
                    <span>
                        Link expires at midnight on the selected date
                    </span>
                </div>
            </div>

            {/* Create Button */}
            <div className="flex justify-center pt-4">
                <Button
                    size="lg"
                    onClick={handleCreateLink}
                    disabled={isCreating || !isValid}
                    className="w-fit min-w-[200px] rounded-[15px] corner-squircle"
                >
                    {isCreating ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Creating...
                        </>
                    ) : (
                        "Create Claim Link"
                    )}
                </Button>
            </div>
        </div>
    );
}
