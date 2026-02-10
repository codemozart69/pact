"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Calendar } from "@/components/ui/calendar";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { format } from "date-fns";
import {
    Link2,
    X,
    Image as ImageIcon,
    Calendar as CalendarIcon,
    Info,
} from "lucide-react";
import EmojiPicker from "emoji-picker-react";
import { cn } from "@/lib/utils";

interface PaymentLinkCreateProps {
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
    linkType: "single-use" | "reusable";
    setLinkType: (type: "single-use" | "reusable") => void;
    expiryDate: Date | undefined;
    setExpiryDate: (date: Date | undefined) => void;
    handleCreateLink: () => void;
    isValid: boolean;
}

export function PaymentLinkCreate({
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
    linkType,
    setLinkType,
    expiryDate,
    setExpiryDate,
    handleCreateLink,
    isValid,
}: PaymentLinkCreateProps) {
    return (
        <div className="space-y-6 p-6 pb-10">
            {/* Visual Selection */}
            <div className="space-y-2">
                <Label>Visual (Image or Emoji)</Label>
                <Tabs value={visualTab} onValueChange={(v) => setVisualTab(v as "emoji" | "image")}>
                    <TabsList className="grid w-fit grid-cols-2">
                        <TabsTrigger value="image">Image</TabsTrigger>
                        <TabsTrigger value="emoji">Emoji</TabsTrigger>
                    </TabsList>

                    <TabsContent value="image" className="mt-4">
                        <div className="flex flex-col items-center gap-4">
                            {imagePreview ? (
                                <div className="relative">
                                    <img
                                        src={imagePreview}
                                        alt="Preview"
                                        className="h-32 w-32 rounded-lg object-cover"
                                    />
                                    <button
                                        onClick={() => {
                                            setImageFile(null);
                                            setImagePreview("");
                                        }}
                                        className="absolute -right-2 -top-2 rounded-full bg-red-500 p-1 text-white"
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
                    placeholder="e.g., Coffee Tips, Freelance Invoice"
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
                    placeholder="What is this payment for?"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    maxLength={500}
                    rows={3}
                />
                <p className="text-xs text-zinc-500">
                    {description.length}/500 characters
                </p>
            </div>

            {/* Amount */}
            <div className="space-y-2">
                <Label>Amount (HBAR) *</Label>
                <Input
                    type="number"
                    step="0.000001"
                    placeholder="0.00"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                />
            </div>

            {/* Payment Type */}
            <div className="space-y-2">
                <Label>Payment Type</Label>
                <RadioGroup
                    value={linkType}
                    onValueChange={(v) => setLinkType(v as "single-use" | "reusable")}
                >
                    <div className="flex items-start space-x-2 rounded-lg border p-4">
                        <RadioGroupItem value="single-use" id="single" />
                        <div className="flex-1">
                            <Label htmlFor="single" className="font-medium">
                                One-time payment
                            </Label>
                            <p className="text-sm text-zinc-500">
                                Link deactivates after first payment
                            </p>
                        </div>
                    </div>
                    <div className="flex items-start space-x-2 rounded-lg border p-4">
                        <RadioGroupItem value="reusable" id="reusable" />
                        <div className="flex-1">
                            <Label htmlFor="reusable" className="font-medium">
                                Reusable link
                            </Label>
                            <p className="text-sm text-zinc-500">
                                Accept multiple payments until deactivated
                            </p>
                        </div>
                    </div>
                </RadioGroup>
            </div>

            {/* Expiry Date */}
            <div className="space-y-2">
                <Label>Expiry Date (Optional)</Label>
                <Popover>
                    <PopoverTrigger asChild>
                        <Button
                            variant="outline"
                            className={cn(
                                "w-full justify-start text-left font-normal",
                                !expiryDate && "text-muted-foreground"
                            )}
                        >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {expiryDate ? (
                                format(expiryDate, "PPP")
                            ) : (
                                <span>Pick a date</span>
                            )}
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                            mode="single"
                            selected={expiryDate}
                            onSelect={setExpiryDate}
                            disabled={(date) => date < new Date()}
                            initialFocus
                        />
                        {expiryDate && (
                            <div className="border-t p-3">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="w-full"
                                    onClick={() => setExpiryDate(undefined)}
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
                    disabled={!isValid}
                    className="w-fit rounded-[15px] corner-squircle"
                >
                    <Link2 className="mr-2 h-4 w-4" />
                    Create Link
                </Button>
            </div>
        </div>
    );
}
