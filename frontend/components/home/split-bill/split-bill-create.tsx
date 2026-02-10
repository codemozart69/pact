"use client";

import { useState } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { format } from "date-fns";
import { Calendar as CalendarIcon, Info, Trash2, Loader2, Split, User } from "lucide-react";
import EmojiPicker from "emoji-picker-react";
import UserRecipientInput, { RecipientUser } from "@/components/home/user-recipient-input";
import { cn } from "@/lib/utils";
import { formatHbarValue } from "@/lib/format-utils";

interface SplitBillCreateProps {
    visualTab: "emoji" | "none";
    setVisualTab: (v: "emoji" | "none") => void;
    selectedEmoji: string;
    setSelectedEmoji: (v: string) => void;
    title: string;
    setTitle: (v: string) => void;
    description: string;
    setDescription: (v: string) => void;
    amount: string;
    setAmount: (v: string) => void;
    splitMode: "equal" | "custom";
    setSplitMode: (v: "equal" | "custom") => void;
    expirationDate: Date | undefined;
    setExpirationDate: (v: Date | undefined) => void;
    participants: RecipientUser[];
    handleAddParticipant: (p: RecipientUser | string | null) => void;
    handleRemoveParticipant: (id: string) => void;
    customAmounts: Record<string, string>;
    handleCustomAmountChange: (id: string, val: string) => void;
    calculateEqualAmount: () => string;
    calculateCustomSum: () => number;
    handleCreateSplit: () => Promise<void>;
    isCreating: boolean;
    isValid: boolean;
}

export function SplitBillCreate({
    visualTab,
    setVisualTab,
    selectedEmoji,
    setSelectedEmoji,
    title,
    setTitle,
    description,
    setDescription,
    amount,
    setAmount,
    splitMode,
    setSplitMode,
    expirationDate,
    setExpirationDate,
    participants,
    handleAddParticipant,
    handleRemoveParticipant,
    customAmounts,
    handleCustomAmountChange,
    calculateEqualAmount,
    calculateCustomSum,
    handleCreateSplit,
    isCreating,
    isValid,
}: SplitBillCreateProps) {
    return (
        <div className="space-y-6 p-6 pb-10">
            {/* Visual Selection */}
            <div className="space-y-2">
                <Label>Visual (Optional)</Label>
                <Tabs
                    value={visualTab}
                    onValueChange={(v) => setVisualTab(v as "emoji" | "none")}
                >
                    <TabsList className="grid w-fit grid-cols-2">
                        <TabsTrigger value="none">None</TabsTrigger>
                        <TabsTrigger value="emoji">Emoji</TabsTrigger>
                    </TabsList>

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
                    placeholder="e.g., Team Dinner, Trip Expenses"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    maxLength={100}
                />
                <p className="text-xs text-zinc-500">{title.length}/100 characters</p>
            </div>

            {/* Description */}
            <div className="space-y-2">
                <Label>Description (Optional)</Label>
                <Textarea
                    placeholder="What is this split for?"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    maxLength={500}
                    rows={3}
                />
                <p className="text-xs text-zinc-500">{description.length}/500 characters</p>
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

            {/* Participants */}
            <div className="space-y-2">
                <Label>Participants ({participants.length}/50) *</Label>
                <UserRecipientInput
                    value={null}
                    onChange={handleAddParticipant}
                    placeholder="Search and add participants"
                    mode="request"
                />
                {participants.length > 0 && (
                    <div className="mt-3 space-y-2">
                        {participants.map((participant) => (
                            <div
                                key={participant._id}
                                className="flex items-center gap-3 rounded-lg border border-zinc-200 bg-zinc-50 p-3"
                            >
                                <Avatar className="h-8 w-8">
                                    <AvatarImage src={participant.profileImageUrl} />
                                    <AvatarFallback><User className="h-4 w-4" /></AvatarFallback>
                                </Avatar>
                                <div className="min-w-0 flex-1">
                                    <div className="font-medium text-zinc-900">{participant.name}</div>
                                    <div className="text-sm text-zinc-500">@{participant.username}</div>
                                </div>
                                {splitMode === "custom" && (
                                    <Input
                                        type="number"
                                        step="0.000001"
                                        placeholder="Amount"
                                        value={customAmounts[participant._id] || ""}
                                        onChange={(e) => handleCustomAmountChange(participant._id, e.target.value)}
                                        className="w-32"
                                    />
                                )}
                                <Button variant="ghost" size="icon" onClick={() => handleRemoveParticipant(participant._id)}>
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Split Mode */}
            <div className="space-y-2">
                <Label>How to Split?</Label>
                <RadioGroup value={splitMode} onValueChange={(v) => setSplitMode(v as any)}>
                    <div className="flex items-start space-x-2 rounded-lg border p-4">
                        <RadioGroupItem value="equal" id="equal" />
                        <div className="flex-1">
                            <Label htmlFor="equal" className="font-medium">Equal splits</Label>
                            <p className="text-sm text-zinc-500">Each person pays {calculateEqualAmount()} HBAR</p>
                        </div>
                    </div>
                    <div className="flex items-start space-x-2 rounded-lg border p-4">
                        <RadioGroupItem value="custom" id="custom" />
                        <div className="flex-1">
                            <Label htmlFor="custom" className="font-medium">Custom amounts</Label>
                            <p className="text-sm text-zinc-500">Specify different amounts for each person</p>
                            {splitMode === "custom" && (
                                <div className="mt-2 text-sm text-zinc-600">
                                    Total: {formatHbarValue(calculateCustomSum().toString())} / {amount || "0"} HBAR
                                </div>
                            )}
                        </div>
                    </div>
                </RadioGroup>
            </div>

            {/* Expiration */}
            <div className="space-y-2">
                <Label>Expiration (Optional)</Label>
                <Popover>
                    <PopoverTrigger asChild>
                        <Button
                            variant="outline"
                            className={cn("w-full justify-start text-left font-normal", !expirationDate && "text-muted-foreground")}
                        >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {expirationDate ? format(expirationDate, "PPP") : <span>Pick a date</span>}
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
                    </PopoverContent>
                </Popover>
            </div>

            {/* Create Button */}
            <div className="flex justify-center pt-4">
                <Button
                    size="lg"
                    onClick={handleCreateSplit}
                    disabled={!isValid || isCreating}
                    className="corner-squircle w-fit rounded-[15px]"
                >
                    {isCreating ? (
                        <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Creating...</>
                    ) : (
                        <><Split className="mr-2 h-4 w-4" />Create Split Bill</>
                    )}
                </Button>
            </div>
        </div>
    );
}
