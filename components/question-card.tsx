/**
 * The QuestionCard component is the primary unit of the Quest Builder.
 * It allows users to define the title, type, and specific settings for each question.
 * It handles its own internal state for UX (focus, uploading) and communicates 
 * changes back to the parent quest via the 'onUpdate' callback.
 */

"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Trash2, Plus, Award, MessageCircle, CheckCircle2, Copy } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Image as ImageIcon, Upload, Loader2 } from "lucide-react";
import { uploadFileToCloudinary } from "@/lib/cloudinary-client";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import NextImage from "next/image";

// Predefined set of question types supported by the builder.
const TYPE_OPTIONS = [
  { id: "SHORT_TEXT", label: "Short Text" },
  { id: "PARAGRAPH", label: "Paragraph" },
  { id: "MULTIPLE_CHOICE", label: "Multiple Choice" },
  { id: "CHECKBOXES", label: "Checkboxes" },
  { id: "DROPDOWN", label: "Dropdown" },
  { id: "DATE", label: "Date" },
  { id: "TIME", label: "Time" },
  { id: "VIDEO", label: "Video" },
  { id: "IMAGE", label: "Image" },
];

/**
 * Interface and Component Definition for QuestionCard.
 * 
 * @param {Object} question - The database entity for the question.
 * @param {Function} onDelete - Triggered when the user deletes the card.
 * @param {Function} onUpdate - Triggered when any field (title, type, etc.) is changed.
 * @param {Function} onDuplicate - Triggered when the card is copied.
 * @param {boolean} [isQuiz] - If true, enables points and correct answer settings.
 */
export function QuestionCard({
  question,
  onDelete,
  onUpdate,
  onDuplicate,
  isQuiz,
}: {
  question: Record<string, unknown> & {
    id: string;
    type: string;
    title: string;
    description?: string | null;
    required?: boolean;
    options?: (string | { value: string; image?: string })[];
    correctAnswer?: string | string[];
    points?: number;
    feedback?: string;
  };
  onDelete: () => void;
  onUpdate: (data: Record<string, unknown>) => void;
  onDuplicate: () => void;
  isQuiz?: boolean;
}) {
  // Local state for UI feedback (highlights and loading spinners)
  const [isFocused, setIsFocused] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  /**
   * Handles media file uploads (Images/Videos) for specific question types.
   * Uploads to Cloudinary and updates the question's primary content field (the first entry in 'options').
   */
  const handleFileUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    type: "IMAGE" | "VIDEO",
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Client-side size validation before starting the upload
    if (type === "IMAGE" && file.size > 2 * 1024 * 1024) {
      toast.error("Image size too large. Max 2MB allowed.");
      return;
    }
    if (type === "VIDEO" && file.size > 10 * 1024 * 1024) {
      toast.error("Video size too large. Max 10MB allowed.");
      return;
    }

    setIsUploading(true);
    try {
      // Direct client-side upload via our secure helper
      const { secureUrl } = await uploadFileToCloudinary(file);
      onUpdate({ options: [secureUrl] });
      toast.success(`${type === "IMAGE" ? "Image" : "Video"} uploaded successfully`);
    } catch (error: unknown) {
      toast.error("Upload failed");
      console.error(error);
    } finally {
      setIsUploading(false);
    }
  };

  // Drag-and-drop integration using @dnd-kit
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: question.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  /**
   * Updates the question type and initializes defaults if switching to a choice-based type.
   */
  const handleTypeChange = (newType: string) => {
    const data: Record<string, unknown> = { type: newType };
    const isChoiceType = ["MULTIPLE_CHOICE", "CHECKBOXES", "DROPDOWN"].includes(newType);
    
    // Automatically add a placeholder option if the new type requires them.
    if (isChoiceType && (!question.options || question.options.length === 0)) {
      data.options = ["Option 1"];
    }
    onUpdate(data);
  };

  // Utility helpers to handle polymorphic 'option' structure (can be string or object with image)
  const getOptionValue = (opt: string | { value: string; image?: string }) =>
    typeof opt === "object" && opt !== null ? opt.value || "" : opt;
  const getOptionImage = (opt: string | { value: string; image?: string }) =>
    typeof opt === "object" && opt !== null ? opt.image : null;

  /**
   * Handles uploading a smaller image thumbnail for an individual choice option.
   */
  const handleOptionUpload = async (file: File, index: number) => {
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      toast.error("Image too large (max 2MB)");
      return;
    }

    setIsUploading(true);
    try {
      const { secureUrl } = await uploadFileToCloudinary(file);
      const newOptions = [...(question.options || [])];
      const current = newOptions[index];
      const currentValue = getOptionValue(current);
      // Store the option as an object to include the image URL
      newOptions[index] = { value: currentValue, image: secureUrl };
      onUpdate({ options: newOptions });
      toast.success("Image added to option");
    } catch {
      toast.error("Failed to upload option image");
    } finally {
      setIsUploading(false);
    }
  };

  /**
   * Removes an image from a choice option and reverts the field to a simple string.
   */
  const removeOptionImage = (index: number) => {
    const newOptions = [...(question.options || [])];
    const current = newOptions[index];
    const currentValue = getOptionValue(current);
    newOptions[index] = currentValue;
    onUpdate({ options: newOptions });
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={cn(
        "group relative transition-all duration-300 outline-none",
        isDragging && "z-50 scale-102 opacity-50",
      )}
    >
      <div
        className={cn(
          "border-border/50 bg-background group/card relative cursor-move overflow-hidden rounded-lg border shadow-sm transition-all duration-300",
          isFocused
            ? "border-primary/10 ring-primary/5 bg-background shadow-xs ring-2"
            : "hover:border-border/60 hover:shadow-sm",
        )}
      >
        {/* Visual flair: Subtle top highlight line */}
        <div className="via-primary/5 absolute top-0 right-4 left-4 h-px bg-gradient-to-r from-transparent to-transparent" />

        {/* Card Header: Question Type Selector and Delete Action */}
        <div className="text-muted-foreground relative z-10 flex flex-row items-center justify-between px-4 pt-3">
          <div className="flex items-center gap-3">
            <Select value={question.type} onValueChange={handleTypeChange}>
              {/* Note: stopPropagation prevents the drag-and-drop listener from hijacking clicks on the dropdown */}
              <SelectTrigger
                onPointerDown={(e) => e.stopPropagation()}
                className="hover:bg-primary/5 group/trigger bg-background h-auto w-fit cursor-pointer gap-3 rounded-none border-none px-4 py-2 shadow-none transition-all outline-none focus:ring-0"
              >
                <SelectValue>
                  <span className="text-muted-foreground/60 group-hover/trigger:text-primary text-[10px] font-black tracking-[0.2em] uppercase transition-colors">
                    {question.type.replace("_", " ")}
                  </span>
                </SelectValue>
              </SelectTrigger>
              <SelectContent
                className="border-border/50 bg-popover/95 rounded-none p-2 shadow-2xl backdrop-blur-2xl"
                position="popper"
                sideOffset={12}
              >
                {TYPE_OPTIONS.map((opt) => (
                  <SelectItem
                    key={opt.id}
                    value={opt.id}
                    className="focus:bg-primary/10 focus:text-primary cursor-pointer rounded-none px-4 py-3 transition-colors"
                  >
                    <span className="text-[10px] font-bold tracking-widest uppercase">
                      {opt.label}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-1 opacity-0 transition-all duration-300 group-hover/card:opacity-100">
            <Button
              onPointerDown={(e) => e.stopPropagation()}
              variant="ghost"
              size="icon"
              className="hover:bg-destructive/10 hover:text-destructive text-muted-foreground/30 h-10 w-10 rounded-full transition-all"
              onClick={onDelete}
            >
              <Trash2 className="h-4.5 w-4.5" />
            </Button>
          </div>
        </div>

        {/* Main Content: Title and Description Inputs */}
        <div className="relative z-10 mt-1 space-y-2 px-4 pb-4">
          <Input
            value={question.title}
            onChange={(e) => onUpdate({ title: e.target.value })}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            onPointerDown={(e) => e.stopPropagation()}
            placeholder="Question title..."
            className="placeholder:text-muted-foreground/25 selection:bg-primary/10 h-10 rounded-none border-none bg-transparent px-2 text-lg font-black tracking-tight shadow-none transition-all focus-visible:border-none focus-visible:ring-0"
          />
          <Textarea
            value={question.description || ""}
            onChange={(e) => onUpdate({ description: e.target.value })}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            onPointerDown={(e) => e.stopPropagation()}
            placeholder="Add a description (optional)..."
            className="text-muted-foreground/70 placeholder:text-muted-foreground/15 min-h-[40px] resize-none rounded-none border-none bg-transparent p-2 text-sm leading-relaxed font-medium shadow-none transition-all focus:border-none focus:ring-0 focus:outline-none focus-visible:border-none focus-visible:ring-0"
          />

          {/* Settings Bar: Required toggle and Duplicate action */}
          <div className="border-border/10 flex items-center justify-end gap-6 border-t pt-2">
            <div className="flex items-center gap-3">
              <Label
                htmlFor={`required-${question.id}`}
                className="text-muted-foreground/60 cursor-pointer text-[10px] font-black tracking-widest uppercase"
              >
                Required
              </Label>
              <Switch
                id={`required-${question.id}`}
                checked={question.required}
                onCheckedChange={(checked) => onUpdate({ required: checked })}
                onPointerDown={(e) => e.stopPropagation()}
                className="data-[state=checked]:bg-primary scale-75"
              />
            </div>

            <Button
              variant="ghost"
              size="sm"
              onPointerDown={(e) => e.stopPropagation()}
              className="text-muted-foreground/40 hover:text-primary hover:bg-primary/5 h-8 gap-2 rounded-lg px-3 transition-all"
              onClick={onDuplicate}
            >
              <Copy className="h-3.5 w-3.5" />
              <span className="text-[10px] font-black tracking-widest uppercase">Duplicate</span>
            </Button>
          </div>

          {/* TYPE-SPECIFIC FIELDS: Rendered dynamically based on the selected question type */}
          
          {/* 1. Choice-based Fields (Multiple Choice, Checkboxes, Dropdown) */}
          {(question.type === "MULTIPLE_CHOICE" ||
            question.type === "CHECKBOXES" ||
            question.type === "DROPDOWN") && (
            <div className="space-y-3 pt-4">
              {question.options?.map(
                (option: string | { value: string; image?: string }, index: number) => {
                  const optionText = getOptionValue(option);
                  const optionImage = getOptionImage(option);

                  return (
                    <div
                      key={index}
                      className="animate-in fade-in slide-in-from-left-2 group/option flex flex-col gap-2 duration-300"
                    >
                      <div className="flex items-center gap-4">
                        {/* Visual indicator (Circle for radio, Square for checkbox) */}
                        <div
                          className={cn(
                            "border-muted-foreground/20 group-hover/option:border-primary/40 h-4 w-4 shrink-0 rounded-full border-2 shadow-sm transition-colors",
                            question.type === "CHECKBOXES" && "rounded-md",
                          )}
                        />
                        <Input
                          value={optionText}
                          onChange={(e) => {
                            const newOptions = [...(question.options || [])];
                            const current = newOptions[index];
                            if (typeof current === "object" && current !== null) {
                              newOptions[index] = {
                                ...current,
                                value: e.target.value,
                              };
                            } else {
                              newOptions[index] = e.target.value;
                            }
                            onUpdate({ options: newOptions });
                          }}
                          onFocus={() => setIsFocused(true)}
                          onBlur={() => setIsFocused(false)}
                          onPointerDown={(e) => e.stopPropagation()}
                          className="placeholder:text-muted-foreground/20 h-8 flex-1 rounded-none border-none bg-transparent px-2 text-sm font-bold shadow-none transition-all focus-visible:border-none focus-visible:ring-0"
                        />

                        {/* Option Image Controls (allows adding images to individual options) */}
                        {(question.type === "MULTIPLE_CHOICE" ||
                          question.type === "CHECKBOXES") && (
                          <div className="flex items-center gap-1">
                            <input
                              type="file"
                              id={`opt-img-${question.id}-${index}`}
                              className="hidden"
                              accept="image/*"
                              disabled={isUploading}
                              onChange={(e) =>
                                e.target.files?.[0] && handleOptionUpload(e.target.files[0], index)
                              }
                            />
                            <label htmlFor={`opt-img-${question.id}-${index}`}>
                              <Button
                                variant="ghost"
                                size="icon"
                                asChild
                                disabled={isUploading}
                                className={cn(
                                  "text-muted-foreground/20 hover:text-primary h-8 w-8 cursor-pointer rounded-full transition-all",
                                  optionImage && "text-primary",
                                )}
                              >
                                <span>
                                  <ImageIcon className="h-4 w-4" />
                                </span>
                              </Button>
                            </label>
                          </div>
                        )}

                        {/* Quiz Logic: Marking an option as the correct answer */}
                        {isQuiz && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onPointerDown={(e) => e.stopPropagation()}
                            className={cn(
                              "h-9 w-9 rounded-full transition-all",
                              (
                                Array.isArray(question.correctAnswer)
                                  ? question.correctAnswer.includes(optionText)
                                  : question.correctAnswer === optionText
                              )
                                ? "bg-green-500/10 text-green-500 hover:bg-green-500/20"
                                : "text-muted-foreground/20 hover:bg-green-500/5 hover:text-green-500/50",
                            )}
                            onClick={() => {
                              if (question.type === "CHECKBOXES") {
                                const current = Array.isArray(question.correctAnswer)
                                  ? question.correctAnswer
                                  : [];
                                const newCorrect = current.includes(optionText)
                                  ? current.filter((c: string) => c !== optionText)
                                  : [...current, optionText];
                                onUpdate({ correctAnswer: newCorrect });
                              } else {
                                onUpdate({ correctAnswer: optionText });
                              }
                            }}
                          >
                            <CheckCircle2 className="h-4.5 w-4.5" />
                          </Button>
                        )}

                        {/* Remove Option Button */}
                        <Button
                          variant="ghost"
                          size="icon"
                          onPointerDown={(e) => e.stopPropagation()}
                          className="hover:bg-destructive/10 hover:text-destructive text-muted-foreground/20 h-9 w-9 rounded-full opacity-0 transition-all group-hover/option:opacity-100"
                          onClick={() => {
                            const newOptions = (question.options || []).filter(
                              (_: string | { value: string; image?: string }, i: number) =>
                                i !== index,
                            );
                            onUpdate({ options: newOptions });
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>

                      {/* Render Option Image Preview if one exists */}
                      {optionImage && (
                        <div className="group/img relative ml-8 w-full max-w-sm">
                          <NextImage
                            src={optionImage}
                            alt="Option"
                            className="border-border max-h-72 w-full rounded-md border object-contain"
                            width={400}
                            height={300}
                            unoptimized
                          />
                          <button
                            onClick={() => removeOptionImage(index)}
                            className="bg-destructive absolute -top-2 -right-2 rounded-full p-1 text-white opacity-0 shadow-lg transition-opacity group-hover/img:opacity-100"
                            type="button"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      )}
                    </div>
                  );
                },
              )}
              {/* Add New Option Button */}
              <Button
                variant="ghost"
                size="sm"
                onPointerDown={(e) => e.stopPropagation()}
                className="text-primary/60 hover:text-primary hover:bg-primary/5 border-primary/5 ml-8 h-10 gap-3 rounded-lg border px-5 text-[10px] font-black tracking-[0.2em] uppercase shadow-sm transition-all"
                onClick={() =>
                  onUpdate({
                    options: [
                      ...(question.options || []),
                      `Option ${(question.options?.length || 0) + 1}`,
                    ],
                  })
                }
              >
                <Plus className="h-4 w-4" /> Add Option
              </Button>
            </div>
          )}

          {/* 2. Video Field: Supports URLs and direct uploads */}
          {question.type === "VIDEO" && (
            <div className="space-y-4 pt-4">
              <div className="animate-in fade-in slide-in-from-left-2 flex items-center gap-4 duration-300">
                <Input
                  value={
                    (typeof question.options?.[0] === "string" ? question.options[0] : "") || ""
                  }
                  onChange={(e) => onUpdate({ options: [e.target.value] })}
                  onFocus={() => setIsFocused(true)}
                  onBlur={() => setIsFocused(false)}
                  onPointerDown={(e) => e.stopPropagation()}
                  placeholder="Paste Video URL (YouTube or direct link)..."
                  className="bg-accent/5 border-border/50 focus-visible:ring-primary/20 placeholder:text-muted-foreground/30 h-10 flex-1 rounded-xl border px-4 text-sm font-bold shadow-none transition-all focus-visible:ring-1"
                />
                <div className="relative">
                  <input
                    type="file"
                    accept="video/*"
                    className="hidden"
                    id={`video-upload-${question.id}`}
                    onChange={(e) => handleFileUpload(e, "VIDEO")}
                    disabled={isUploading}
                  />
                  <label htmlFor={`video-upload-${question.id}`}>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-10 w-10 shrink-0"
                      disabled={isUploading}
                      asChild
                    >
                      <span className="cursor-pointer">
                        {isUploading ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Upload className="h-4 w-4" />
                        )}
                      </span>
                    </Button>
                  </label>
                </div>
              </div>

              {/* Video Preview: Correctly handles YouTube embeds vs direct HTML5 video tags */}
              {question.options?.[0] && (
                <div className="border-border/50 bg-accent/5 mt-4 flex aspect-video items-center justify-center overflow-hidden rounded-xl border">
                  {(() => {
                    const url =
                      typeof question.options![0] === "string" ? question.options![0] : "";
                    if (!url) return null;
                    if (url.includes("youtube.com/watch") || url.includes("youtu.be/")) {
                      let videoId = "";
                      if (url.includes("youtube.com/watch")) {
                        videoId = new URL(url).searchParams.get("v") || "";
                      } else {
                        videoId = url.split("/").pop() || "";
                      }
                      return (
                        <iframe
                          width="100%"
                          height="100%"
                          src={`https://www.youtube.com/embed/${videoId}`}
                          title="YouTube video player"
                          frameBorder="0"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                        ></iframe>
                      );
                    } else if (url.match(/\.(mp4|webm|ogg)$/i) || url.includes("video")) {
                      return (
                        <video controls className="h-full w-full">
                          <source src={url} type="video/mp4" />
                          Your browser does not support the video tag.
                        </video>
                      );
                    } else {
                      return (
                        <Button
                          variant="outline"
                          className="gap-2"
                          onClick={() => window.open(url, "_blank")}
                        >
                          Click here to see the video
                        </Button>
                      );
                    }
                  })()}
                </div>
              )}
            </div>
          )}

          {/* 3. Image Field: Supports URLs and direct uploads */}
          {question.type === "IMAGE" && (
            <div className="space-y-4 pt-4">
              <div className="animate-in fade-in slide-in-from-left-2 flex items-center gap-3 duration-300">
                <Input
                  value={
                    (typeof question.options?.[0] === "string" ? question.options[0] : "") || ""
                  }
                  onChange={(e) => onUpdate({ options: [e.target.value] })}
                  onFocus={() => setIsFocused(true)}
                  onBlur={() => setIsFocused(false)}
                  onPointerDown={(e) => e.stopPropagation()}
                  placeholder="Paste Image URL..."
                  className="bg-accent/5 border-border/50 focus-visible:ring-primary/20 placeholder:text-muted-foreground/30 h-10 flex-1 rounded-xl border px-4 text-sm font-bold shadow-none transition-all focus-visible:ring-1"
                />
                <div className="relative">
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    id={`image-upload-${question.id}`}
                    onChange={(e) => handleFileUpload(e, "IMAGE")}
                    disabled={isUploading}
                  />
                  <label htmlFor={`image-upload-${question.id}`}>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-10 w-10 shrink-0"
                      disabled={isUploading}
                      asChild
                    >
                      <span className="cursor-pointer">
                        {isUploading ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Upload className="h-4 w-4" />
                        )}
                      </span>
                    </Button>
                  </label>
                </div>
              </div>

              {/* Main Image Preview */}
              {question.options?.[0] && (
                <div className="border-border/50 bg-accent/5 group/preview relative mt-4 flex max-h-[400px] items-center justify-center overflow-hidden rounded-xl border">
                  <NextImage
                    src={typeof question.options![0] === "string" ? question.options![0] : ""}
                    alt="Preview"
                    className="max-h-[400px] max-w-full object-contain transition-transform duration-500"
                    width={800}
                    height={400}
                    unoptimized
                  />
                </div>
              )}
            </div>
          )}

          {isQuiz && (
            <div className="border-border/30 animate-in fade-in slide-in-from-top-2 mt-8 space-y-4 border-t pt-6 duration-500">
              <div className="flex flex-wrap items-center gap-6">
                <div className="bg-primary/5 border-primary/10 hover:bg-primary/10 flex items-center gap-3 rounded-xl border px-4 py-2 transition-all">
                  <Award className="text-primary h-4 w-4" />
                  <Input
                    type="number"
                    value={question.points || 0}
                    onChange={(e) => onUpdate({ points: parseInt(e.target.value) || 0 })}
                    onPointerDown={(e) => e.stopPropagation()}
                    className="text-primary h-8 w-16 [appearance:textfield] border-none bg-transparent p-0 text-center font-black shadow-none focus-visible:ring-0 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                  />
                  <span className="text-primary/60 text-[10px] font-black tracking-widest uppercase">
                    Points
                  </span>
                </div>

                {["SHORT_TEXT", "PARAGRAPH"].includes(question.type) && (
                  <div className="min-w-[200px] flex-1">
                    <Input
                      value={question.correctAnswer || ""}
                      onChange={(e) => onUpdate({ correctAnswer: e.target.value })}
                      onPointerDown={(e) => e.stopPropagation()}
                      placeholder="Set correct answer..."
                      className="bg-accent/5 border-border/50 focus-visible:ring-primary/20 h-10 rounded-xl border px-4 text-sm font-bold shadow-none transition-all focus-visible:ring-1"
                    />
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <div className="text-muted-foreground/60 flex items-center gap-2 px-2">
                  <MessageCircle className="h-3.5 w-3.5" />
                  <span className="text-[10px] font-black tracking-widest uppercase">
                    Feedback for respondents
                  </span>
                </div>
                <Textarea
                  value={question.feedback || ""}
                  onChange={(e) => onUpdate({ feedback: e.target.value })}
                  onPointerDown={(e) => e.stopPropagation()}
                  placeholder="Add feedback for correct/incorrect answers..."
                  className="bg-accent/5 border-border/50 focus:ring-primary/20 min-h-[80px] resize-none rounded-xl border p-4 text-sm font-medium transition-all focus:ring-1"
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
