"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import { useChat } from "@ai-sdk/react";
import {
  MessageSquare,
  Plus,
  Loader2,
  Trash2,
  Clock,
  Upload,
  Link as LinkIcon,
  ChevronRight,
  Download,
  ChevronLeft,
  X,
  Send,
} from "lucide-react";
import { uploadFileToCloudinary } from "@/lib/cloudinary-client";
import { Shimmer as TextShimmer } from "@/components/ai-elements/shimmer";
import { Loader } from "@/components/ai-elements/loader";
import {
  Conversation,
  ConversationContent,
  ConversationEmptyState,
  ConversationScrollButton,
} from "@/components/ai-elements/conversation";
import {
  Message,
  MessageContent,
  MessageResponse,
  MessageActions,
  MessageAction,
} from "@/components/ai-elements/message";
import { Copy, CheckCircle2 } from "lucide-react";
import { Pie, PieChart, LabelList } from "recharts";
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  type ChartConfig,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  getQuestById,
  createQuestion,
  updateQuestion,
  deleteQuestion,
  updateQuestionsOrder,
  updateQuest,
  getQuestResponses,
  duplicateQuestion,
  markQuestResponsesAsRead,
} from "@/lib/actions";
import { toast } from "sonner";
import { QuestionCard } from "@/components/question-card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
  defaultDropAnimationSideEffects,
  DragEndEvent,
  DragStartEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { cn } from "@/lib/utils";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Textarea } from "@/components/ui/textarea";

/**
 * Interfaces for the Quest Builder data model.
 */

// Represents an individual question within a quest.
type Question = {
  id: string; // Database ID or optimistic temporary ID
  type: string; // The UI type (e.g., MULTIPLE_CHOICE, SHORT_TEXT)
  title: string; 
  description: string | null;
  order: number; // For manual sorting with dnd-kit
  required: boolean;
  options?: string[]; // Array of choice values (for choice types) or image/video URLs
  correctAnswer?: string | string[]; // Single string or array of strings for quiz validation
  points?: number; // Score value for this question (if quest is a quiz)
  feedback?: string; // Information shown to the user after answering
};

// Represents the top-level Quest metadata and configuration.
interface Quest {
  id: string;
  title: string;
  description: string | null;
  status: string; // e.g., 'Draft', 'Published'
  isQuiz: boolean; // Enforced logic and UI for scores
  showProgressBar: boolean;
  shuffleQuestionOrder: boolean;
  confirmationMessage: string | null; // Shown after submission
  showLinkToSubmitAnother: boolean;
  limitToOneResponse: boolean; // Based on cookie or user ID
  viewResultsSummary: boolean; // Allow respondents to see aggregate data
  questionsRequiredByDefault: boolean;
  webhookEnabled: boolean;
  webhookUrl: string | null;
  backgroundImageUrl: string | null; // The theme banner
  questions?: Question[];
}

// Represents a summary of a single submission (response) to the quest.
interface Response {
  id: string;
  questId: string;
  duration: number | null; // Time taken to complete in seconds
  createdAt: string | Date;
  answers: {
    questionId: string;
    value: unknown; // The user-provided answer value
    question: Question; // Snapshot of the question as it was when answered
  }[];
}

/**
 * Constants and Configuration
 */

// Supported question types with human-readable labels for the UI.
export const TYPE_OPTIONS = [
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
 * QuestDetailPage Component
 * 
 * This is the nerve center of the quest creation experience.
 * It provides a multi-tabbed interface for:
 * 1. Build (Questions): A drag-and-drop editor for designing the quest structure.
 * 2. Settings: Global configuration for the quest (logic, appearance, integrations).
 * 3. Share: Public URLs and QR code generation.
 * 4. Results: Real-time analytics and individual response viewing.
 * 
 * It integrates with the AI Chat SDK to allow LLM-powered quest modifications.
 */

export default function QuestDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  // The activeTab determines which view to show (Build, Results, etc.)
  const activeTab = searchParams.get("tab") || "questions";

  // --- CORE DATA STATE ---
  const [quest, setQuest] = useState<Quest | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // --- UI & INTERACTION STATE ---
  const [activeId, setActiveId] = useState<string | null>(null); // Track the question being dragged
  const [responses, setResponses] = useState<Response[]>([]); // Submission data for the Results tab
  const [isLoadingResponses, setIsLoadingResponses] = useState(false);
  const [responseSubTab, setResponseSubTab] = useState<"summary" | "question" | "individual">(
    "summary",
  );
  const [selectedQuestionId, setSelectedQuestionId] = useState<string>("all");
  const [individualIndex, setIndividualIndex] = useState(0);

  // --- MEDIA & BANNER STATE ---
  const [isUploadingBanner, setIsUploadingBanner] = useState(false);
  const [showBannerUrlInput, setShowBannerUrlInput] = useState(false);
  const [bannerUrlInput, setBannerUrlInput] = useState("");

  // --- AI CHAT STATE/LOGIC ---
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [input, setInput] = useState("");
  // useChat links this page to the backend /api/chat route for conversational building.
  const { messages, sendMessage, status } = useChat({
    onFinish: async () => {
      // Refresh the editor view once the AI finishes its tool calls (e.g. added questions)
      await loadQuestData();
    },
    onError: () => {
      toast.error("Failed to generate quest. Try later.");
    },
  });

  const isChatLoading = status === "streaming" || status === "submitted";

  /**
   * Utility to copy text to the user's clipboard.
   */
  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard");
  };

  /**
   * Primary submission handler for the AI Chat Assistant.
   * Sends the user's prompt to the backend along with the current quest ID context.
   */
  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim()) return;

    // Pass the questId in the body so the backend can fetch the current state.
    await sendMessage({ text: input }, { body: { questId: id } });
    setInput("");
  };

  /**
   * Dnd-kit sensor configuration.
   * Defines how drag-and-drop behaves (e.g. 8px distance before drag starts 
   * to avoid accidental clicks on inputs).
   */
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  /**
   * Effect: Primary Data Initialization
   * Loads the quest metadata and its associated questions from the database.
   * If the quest doesn't exist, we redirect the user back to the dashboard.
   */
  useEffect(() => {
    async function loadQuest() {
      try {
        const data = await getQuestById(id as string);
        if (!data) {
          toast.error("Quest not found");
          router.push("/quests");
          return;
        }
        if (data) {
          setQuest(data as unknown as Quest);
          setQuestions((data.questions as unknown as Question[]) || []);
        }
      } catch {
        toast.error("Failed to load quest");
        router.push("/quests");
      } finally {
        setIsLoading(false); // Stop the global loading spinner
      }
    }
    loadQuest();
  }, [id, router]);

  useEffect(() => {
    async function loadResponses() {
      if (activeTab !== "responses") return;

      setIsLoadingResponses(true);
      try {
        const data = await getQuestResponses(id as string);
        setResponses(data as unknown as Response[]);
        // Clear notifications for this quest
        await markQuestResponsesAsRead(id as string);
      } catch {
        toast.error("Failed to load responses");
      } finally {
        setIsLoadingResponses(false);
      }
    }
    loadResponses();
  }, [id, activeTab]);

  /**
   * Adds a new question to the quest with optimistic UI updates.
   * 
   * @param {string} type - The question type to add.
   * @param {number} [atIndex] - Optional index for insertion (defaults to end).
   */
  const handleAddQuestion = async (type: string, atIndex?: number) => {
    const insertIndex = atIndex !== undefined ? atIndex : questions.length;
    
    // Create a temporary local object with a 'temp' ID to show the card immediately.
    const optimisticId = `temp-${Date.now()}`;
    const newQuestion = {
      id: optimisticId,
      type,
      title: `Untitled ${type.toLowerCase().replace("_", " ")}`,
      description: "",
      order: insertIndex,
      required: false,
      options:
        type === "MULTIPLE_CHOICE" || type === "CHECKBOXES" || type === "DROPDOWN"
          ? ["Option 1"]
          : undefined,
    };

    const newQuestions = [...questions];
    newQuestions.splice(insertIndex, 0, newQuestion);
    // Update local state and recalibrate orders
    setQuestions(newQuestions.map((q, i) => ({ ...q, order: i })));

    try {
      // Step 2: Persist in database
      const created = await createQuestion(id as string, type, insertIndex);
      // Replace the temp item with the real persistent item from the server
      setQuestions((prev) =>
        prev.map((q) => (q.id === optimisticId ? (created as unknown as Question) : q)),
      );
    } catch {
      toast.error("Failed to add question");
      await loadQuestData(); // Revert to server state on failure
    }
  };

  /**
   * Refreshes the entire quest dataset from the server.
   * Used as a fallback after errors or after external tools (like AI) modify the quest.
   */
  const loadQuestData = async () => {
    const data = await getQuestById(id as string);
    if (data) {
      setQuest(data as unknown as Quest);
      setQuestions((data.questions as unknown as Question[]) || []);
      // Sync other UI parts that depend on this quest (e.g., Header)
      window.dispatchEvent(new CustomEvent("quest-updated", { detail: data }));
    }
  };

  /**
   * Updates a single question's properties.
   * Performs an immediate local state update for responsiveness.
   */
  const handleUpdateQuestion = async (questionId: string, data: Partial<Question>) => {
    setQuestions((prev) => prev.map((q) => (q.id === questionId ? { ...q, ...data } : q)));
    try {
      await updateQuestion(questionId, id as string, data);
    } catch {
      toast.error("Failed to update question");
      // Note: We don't rollback every keystroke to avoid jitter, 
      // but substantial failures will show a toast.
    }
  };

  /**
   * Deletes a question and reflects it immediately in the UI.
   */
  const handleDeleteQuestion = async (questionId: string) => {
    const original = [...questions];
    setQuestions((prev) => prev.filter((q) => q.id !== questionId));
    try {
      await deleteQuestion(questionId, id as string);
      toast.success("Question deleted");
    } catch {
      // Rollback to original state if server-side deletion fails
      setQuestions(original);
      toast.error("Failed to delete question");
    }
  };

  /**
   * Creates an exact copy of a question.
   */
  const handleDuplicateQuestion = async (questionId: string) => {
    try {
      await duplicateQuestion(questionId, id as string);
      toast.success("Question duplicated");
      // Full reload to ensure all IDs and ordering are correctly synced
      await loadQuestData();
    } catch {
      toast.error("Failed to duplicate question");
    }
  };

  const onDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  /**
   * Called when a drag operation finishes.
   * Handles two scenarios:
   * 1. Sorting: Moving an existing question to a new position.
   * 2. Insertion: Dragging a new question type from the toolbar into the quest flow.
   */
  const onDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null); // Clear the active drag state

    // --- CASE 1: Toolbar Drop ---
    // User dragged a 'skeleton' card from the side toolbar onto the builder canvas.
    if (active.data.current?.isToolbarItem) {
      if (over) {
        const overIndex = questions.findIndex((q) => q.id === over.id);
        handleAddQuestion(
          active.data.current.type,
          overIndex === -1 ? questions.length : overIndex,
        );
      }
      return;
    }

    // --- CASE 2: Rearranging ---
    // User moved one existing question card above or below another.
    if (over && active.id !== over.id) {
      const oldIndex = questions.findIndex((q) => q.id === active.id);
      const newIndex = questions.findIndex((q) => q.id === over.id);

      // Reorder locally using dnd-kit utility
      const newQuestions = arrayMove(questions, oldIndex, newIndex);
      setQuestions(newQuestions);

      try {
        // Step 2: Push the new flat list of IDs to the database to persist order
        await updateQuestionsOrder(
          id as string,
          newQuestions.map((q) => q.id),
        );
      } catch {
        toast.error("Failed to update order");
        await loadQuestData(); // Rollback if server fails
      }
    }
  };

  const [newQuestionType, setNewQuestionType] = useState("SHORT_TEXT");

  /**
   * Handles individual banner image uploads for the quest theme.
   * Uploads to Cloudinary and persists the URL in the Quest record.
   */
  const handleBannerUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      toast.error("Image size too large. Max 2MB allowed.");
      return;
    }

    setIsUploadingBanner(true);
    try {
      const { secureUrl } = await uploadFileToCloudinary(file);
      const updated = await updateQuest(id as string, {
        backgroundImageUrl: secureUrl,
      });
      setQuest(updated);
      // Notify the layout/header that the quest metadata has changed (for logo/title sync)
      window.dispatchEvent(new CustomEvent("quest-updated", { detail: updated }));
      toast.success("Cover image updated");
    } catch (error) {
      toast.error("Failed to upload cover image");
      console.error(error);
    } finally {
      setIsUploadingBanner(false);
    }
  };

  /**
   * Updates the banner URL via a direct string input (e.g. Unsplash link).
   */
  const handleBannerUrlSubmit = async () => {
    if (!bannerUrlInput.trim()) return;
    try {
      const updated = await updateQuest(id as string, {
        backgroundImageUrl: bannerUrlInput,
      });
      setQuest(updated);
      window.dispatchEvent(new CustomEvent("quest-updated", { detail: updated }));
      toast.success("Cover image updated");
      setShowBannerUrlInput(false);
    } catch {
      toast.error("Failed to update cover image");
    }
  };

  // --- RENDERING LOGIC ---

  if (isLoading) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <Loader2 className="text-primary h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!quest) return null;

  return (
    <div className="bg-background relative flex min-h-screen flex-col">
      <div className="container mx-auto max-w-4xl px-6 py-4 lg:px-8">
        {/* dnd-kit context wrap for the entire builder canvas */}
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={onDragStart}
          onDragEnd={onDragEnd}
        >
          {activeTab === "questions" && (
            <div className="animate-in fade-in slide-in-from-bottom-4 space-y-4 pb-40 duration-700">
              {/* SECTION: Banner / Cover Image */}
              <div className="group/banner-control relative mb-6">
                {quest.backgroundImageUrl ? (
                  <div className="border-border/50 group/banner relative h-48 w-full overflow-hidden rounded-xl border shadow-sm sm:h-64">
                    <Image
                      src={quest.backgroundImageUrl}
                      alt="Quest Banner"
                      fill
                      className="object-cover transition-transform duration-700 group-hover/banner:scale-105"
                    />
                    <div className="from-background/80 absolute inset-0 bg-gradient-to-t to-transparent" />

                    {/* Controls: Visible only on hover */}
                    <div className="absolute top-4 right-4 flex gap-2 opacity-0 transition-opacity group-hover/banner:opacity-100">
                      <Button
                        variant="secondary"
                        size="sm"
                        className="bg-background/80 h-8 gap-2 text-xs font-bold backdrop-blur"
                        onClick={async () => {
                          const updated = await updateQuest(id as string, {
                            backgroundImageUrl: null,
                          });
                          setQuest(updated);
                          toast.success("Cover image removed");
                        }}
                      >
                        <Trash2 className="h-3.5 w-3.5" /> Remove
                      </Button>
                      <label htmlFor="banner-upload-edit">
                        <Button
                          variant="secondary"
                          size="sm"
                          className="bg-background/80 pointer-events-none h-8 cursor-pointer gap-2 text-xs font-bold backdrop-blur"
                          asChild
                        >
                          <span>
                            {isUploadingBanner ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <Upload className="h-3.5 w-3.5" />
                            )}{" "}
                            Change
                          </span>
                        </Button>
                      </label>
                      <input
                        type="file"
                        id="banner-upload-edit"
                        className="hidden"
                        accept="image/*"
                        onChange={handleBannerUpload}
                        disabled={isUploadingBanner}
                      />
                    </div>
                  </div>
                ) : (
                  /* Empty State for Banner */
                  <div className="border-border/60 hover:border-primary/40 bg-accent/5 hover:bg-accent/10 group/add-banner flex w-full flex-col items-center justify-center gap-4 rounded-xl border border-dashed p-8 transition-all">
                    {showBannerUrlInput ? (
                      <div className="animate-in fade-in zoom-in-95 flex w-full max-w-md items-center gap-2">
                        <Input
                          placeholder="Paste image URL..."
                          value={bannerUrlInput}
                          onChange={(e) => setBannerUrlInput(e.target.value)}
                          className="h-9"
                          autoFocus
                        />
                        <Button size="sm" onClick={handleBannerUrlSubmit}>
                          Save
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setShowBannerUrlInput(false)}
                        >
                          Cancel
                        </Button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-4">
                        <label htmlFor="banner-upload-new">
                          <Button
                            variant="outline"
                            className="pointer-events-none cursor-pointer gap-2"
                            asChild
                          >
                            <span>
                              {isUploadingBanner ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Upload className="h-4 w-4" />
                              )}
                              Upload Cover Image
                            </span>
                          </Button>
                        </label>
                        <input
                          type="file"
                          id="banner-upload-new"
                          className="hidden"
                          accept="image/*"
                          onChange={handleBannerUpload}
                          disabled={isUploadingBanner}
                        />
                        <span className="text-muted-foreground text-xs font-medium tracking-widest uppercase">
                          or
                        </span>
                        <Button
                          variant="ghost"
                          className="gap-2"
                          onClick={() => setShowBannerUrlInput(true)}
                        >
                          <LinkIcon className="h-4 w-4" /> Add via URL
                        </Button>
                      </div>
                    )}
                    {!showBannerUrlInput && (
                      <p className="text-muted-foreground/60 text-[10px] font-medium tracking-widest uppercase">
                        Recommended size: 1200x400px • Max 2MB
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* SECTION: Welcome Card (Quest Title and Description) */}
              <div className="border-border/50 bg-background group/welcome relative overflow-hidden rounded-lg border shadow-sm transition-all duration-300">
                {/* Visual Flair: Animated gradient line */}
                <div className="via-primary/10 absolute top-0 right-6 left-6 h-px bg-gradient-to-r from-transparent to-transparent" />

                <div className="relative z-10 px-8 pt-6">
                  <div className="space-y-3">
                    <p className="text-muted-foreground/60 text-sm font-medium">
                      The first thing your respondents will see.
                    </p>
                    <div className="group">
                      <Input
                        placeholder="Enter a catchy title for your quest..."
                        value={quest.title}
                        onChange={(e) => setQuest({ ...quest, title: e.target.value })}
                        onBlur={async (e) => {
                          const newTitle = e.target.value;
                          // Update DB
                          try {
                            const updated = await updateQuest(id as string, {
                              title: newTitle,
                            });
                            setQuest(updated);
                            // Sync global UI elements
                            window.dispatchEvent(
                              new CustomEvent("quest-updated", {
                                detail: updated,
                              }),
                            );
                            toast.success("Title updated");
                          } catch {
                            toast.error("Failed to update title");
                          }
                        }}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            (e.target as HTMLInputElement).blur();
                          }
                        }}
                        onPointerDown={(e) => e.stopPropagation()}
                        className="placeholder:text-muted-foreground/20 h-auto rounded-none border-none bg-transparent p-0 px-0 text-3xl leading-tight font-black shadow-none transition-all focus-visible:border-none focus-visible:ring-0"
                      />
                    </div>
                  </div>
                </div>
                <div className="relative z-10 mt-4 space-y-2 px-8 pb-6">
                  <div className="group">
                    <textarea
                      placeholder="Add a friendly description for your welcome screen..."
                      className="placeholder:text-muted-foreground/15 text-muted-foreground/70 min-h-[80px] w-full resize-none rounded-none border-none bg-transparent p-0 text-lg leading-relaxed font-medium transition-all focus:border-none focus:ring-0 focus:outline-none focus-visible:border-none focus-visible:ring-0"
                      value={quest.description || ""}
                      onChange={(e) => setQuest({ ...quest, description: e.target.value })}
                      onBlur={async (e) => {
                        const newDesc = e.target.value;
                        try {
                          const updated = await updateQuest(id as string, {
                            description: newDesc,
                          });
                          setQuest(updated);
                          // Sync with any listener that needs description
                          window.dispatchEvent(
                            new CustomEvent("quest-updated", {
                              detail: updated,
                            }),
                          );
                        } catch {
                          toast.error("Failed to update description");
                        }
                      }}
                      onPointerDown={(e) => e.stopPropagation()}
                    />
                  </div>
                </div>
              </div>

              <SortableContext
                items={questions.map((q) => q.id)}
                strategy={verticalListSortingStrategy}
              >
                <div className="space-y-6">
                  {questions.map((question) => (
                    <QuestionCard
                      key={question.id}
                      question={question}
                      isQuiz={quest.isQuiz}
                      onDelete={() => handleDeleteQuestion(question.id)}
                      onUpdate={(data) => handleUpdateQuestion(question.id, data)}
                      onDuplicate={() => handleDuplicateQuestion(question.id)}
                    />
                  ))}
                </div>
              </SortableContext>

              {/* Add New Question Section */}
              <div className="border-border/30 bg-background hover:border-border/60 group/add relative rounded-lg border-2 border-dashed p-8 transition-all">
                <div className="flex flex-col items-center justify-center space-y-6">
                  <div className="flex items-center gap-3">
                    <Select value={newQuestionType} onValueChange={setNewQuestionType}>
                      <SelectTrigger className="bg-background border-border/50 h-10 w-[200px] cursor-pointer gap-3 rounded-none border shadow-none outline-none focus:ring-0">
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent
                        className="border-border/50 bg-background rounded-none p-2 shadow-2xl"
                        position="popper"
                        sideOffset={8}
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

                  <Button
                    variant="ghost"
                    className="hover:bg-primary/5 text-primary/60 hover:text-primary group/btn flex h-12 items-center gap-3 rounded-none border-none px-8 transition-all"
                    onClick={() => handleAddQuestion(newQuestionType)}
                  >
                    <div className="bg-primary/5 group-hover/btn:bg-primary/10 rounded-full p-2 transition-colors">
                      <Plus className="h-5 w-5" />
                    </div>
                    <span className="text-[12px] font-black tracking-[0.2em] uppercase">
                      Add New Question
                    </span>
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* DRAG OVERLAY: Provides a visual ghost of the item being moved.
              Prevents the UI from 'jumping' by rendering a proxy element at the cursor position. */}
          <DragOverlay
            dropAnimation={{
              sideEffects: defaultDropAnimationSideEffects({
                styles: {
                  active: {
                    opacity: "0.4",
                  },
                },
              }),
            }}
          >
            {activeId ? (
              <div className="pointer-events-none scale-[1.02] overflow-hidden rounded-xl opacity-90 shadow-2xl">
                {/* Branching logic for the overlay appearance */}
                {activeId.startsWith("toolbar-") ? (
                  /* If dragging from the toolbar: Show a 'New Question' placeholder */
                  <div className="bg-primary/5 border-primary/20 flex h-48 w-[600px] flex-col items-center justify-center rounded-xl border-2 border-dashed backdrop-blur-2xl">
                    <div className="bg-primary/10 mb-3 rounded-full p-4">
                      <Plus className="text-primary h-6 w-6" />
                    </div>
                    <p className="text-primary text-xl font-black tracking-tight uppercase">
                      New Question
                    </p>
                  </div>
                ) : (
                  /* If dragging an existing question: Render the full QuestionCard */
                  <div className="bg-card border-primary/20 w-full max-w-4xl overflow-hidden rounded-xl border">
                    <QuestionCard
                      question={questions.find((q) => q.id === activeId)!}
                      onDelete={() => {}}
                      onUpdate={() => {}}
                      onDuplicate={() => {}}
                    />
                  </div>
                )}
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>

        {/* SECTION: RESULTS TAB
            Visible only when the user switches to the 'Responses' view.
            Provides analytics (summary) and individual submission audit. */}
        {activeTab === "responses" && (
          <div className="animate-in fade-in slide-in-from-bottom-4 mx-auto max-w-6xl space-y-8 pb-40 duration-700">
            {/* Stats Overview */}
            <div className="flex flex-col gap-4 sm:flex-row">
              {[
                {
                  label: "Total Responses",
                  value: responses.length.toString(),
                },
                {
                  label: "Avg. Time",
                  value:
                    responses.length > 0
                      ? (() => {
                          const avgSeconds =
                            responses.reduce((acc, r) => acc + (r.duration || 0), 0) /
                            responses.length;
                          if (avgSeconds < 60) return `${Math.round(avgSeconds)}s`;
                          const mins = Math.floor(avgSeconds / 60);
                          const secs = Math.round(avgSeconds % 60);
                          return `${mins}m ${secs}s`;
                        })()
                      : "0s",
                },
                { label: "Completion Rate", value: "100%" }, // Placeholder
              ].map((stat) => (
                <Card
                  key={stat.label}
                  className="bg-card/40 border-border/50 flex-1 overflow-hidden rounded-2xl border shadow-sm backdrop-blur-md"
                >
                  <div className="bg-primary/10 h-1 w-full" />
                  <div className="p-6 text-center">
                    <p className="text-muted-foreground/60 text-[10px] font-black tracking-[0.2em] uppercase">
                      {stat.label}
                    </p>
                    <h3 className="text-primary mt-2 text-4xl font-black tracking-tighter">
                      {stat.value}
                    </h3>
                  </div>
                </Card>
              ))}
            </div>

            {/* Actions / Tabs Toolbar */}
            <div className="bg-card/60 border-border/40 flex flex-col items-center justify-between gap-4 rounded-2xl border p-2 backdrop-blur-sm md:flex-row">
              <div className="bg-muted/50 flex items-center gap-1 rounded-xl p-1">
                {(["summary", "question", "individual"] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setResponseSubTab(tab)}
                    className={cn(
                      "rounded-lg px-6 py-2 text-sm font-bold capitalize transition-all",
                      responseSubTab === tab
                        ? "bg-background text-primary shadow-sm"
                        : "text-muted-foreground hover:bg-background/50",
                    )}
                  >
                    {tab}
                  </button>
                ))}
              </div>

              <div className="flex w-full items-center gap-2 md:w-auto">
                <Button
                  variant="outline"
                  size="sm"
                  className="text-muted-foreground h-9 gap-2 rounded-xl font-semibold"
                >
                  <Download className="h-4 w-4" />
                  <span className="hidden sm:inline">Download</span>
                </Button>

                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive hover:bg-destructive/10 hover:text-destructive h-9 gap-2 rounded-xl font-semibold"
                    >
                      <Trash2 className="h-4 w-4" />
                      <span className="hidden sm:inline">Delete all</span>
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This will permanently delete all {responses.length} responses. This action
                        cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                        Delete All
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>

            {isLoadingResponses ? (
              <div className="flex items-center justify-center p-24">
                <Loader2 className="text-primary h-8 w-8 animate-spin" />
              </div>
            ) : responses.length === 0 ? (
              <div className="text-muted-foreground py-24 text-center">No responses yet.</div>
            ) : (
              <>
                {/* SUMMARY VIEW */}
                {responseSubTab === "summary" && (
                  <div className="animate-in fade-in zoom-in-95 space-y-8 duration-300">
                    {questions.map((q, i) => {
                      const answers = responses
                        .map((r) => r.answers.find((a) => a.questionId === q.id)?.value)
                        .flat()
                        .filter(Boolean);

                      // Prepare Chart Data & Config
                      const dataMap: Record<string, number> = {};
                      (answers as string[]).forEach((a: string) => {
                        dataMap[a] = (dataMap[a] || 0) + 1;
                      });

                      const chartData = Object.entries(dataMap).map(([name, value], idx) => ({
                        option: name,
                        count: value,
                        fill: `var(--chart-${(idx % 5) + 1})`,
                      }));

                      const chartConfig = Object.entries(dataMap).reduce(
                        (acc, [name], idx) => ({
                          ...acc,
                          [name]: {
                            label: name,
                            color: `var(--chart-${(idx % 5) + 1})`,
                          },
                        }),
                        {
                          count: { label: "Responses" },
                        } as ChartConfig,
                      );

                      return (
                        <Card
                          key={q.id}
                          className="border-border/50 bg-card/40 overflow-hidden backdrop-blur-sm"
                        >
                          <CardHeader className="bg-accent/5 border-border/20 border-b py-4">
                            <CardTitle className="flex items-center gap-3 text-base font-bold">
                              <span className="bg-primary/10 text-primary flex h-6 w-6 items-center justify-center rounded-md text-xs">
                                {i + 1}
                              </span>
                              {q.title}
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="p-6">
                            <div className="text-muted-foreground mb-4 text-sm font-medium">
                              {answers.length} responses
                            </div>

                            {["SHORT_TEXT", "PARAGRAPH", "DATE", "TIME"].includes(q.type) ? (
                              <div className="custom-scrollbar max-h-[300px] space-y-4 overflow-y-auto pr-2">
                                {(answers as string[])
                                  .slice(0, 50)
                                  .map((ans: string, idx: number) => (
                                    <div
                                      key={idx}
                                      className="bg-background border-border/50 text-foreground/80 rounded-lg border p-3 text-sm"
                                    >
                                      {ans}
                                    </div>
                                  ))}
                              </div>
                            ) : (
                              <div className="flex flex-col items-start gap-8 sm:flex-row">
                                <div className="min-h-[300px] w-full flex-1">
                                  <ChartContainer
                                    config={chartConfig}
                                    className="mx-auto aspect-square max-h-[300px]"
                                  >
                                    <PieChart>
                                      <ChartTooltip
                                        cursor={false}
                                        content={<ChartTooltipContent hideLabel />}
                                      />
                                      <Pie
                                        data={chartData}
                                        dataKey="count"
                                        nameKey="option"
                                        innerRadius={60}
                                        strokeWidth={5}
                                      >
                                        <LabelList
                                          dataKey="option"
                                          className="fill-foreground font-bold"
                                          stroke="none"
                                          fontSize={12}
                                          formatter={(
                                            value: string | number | boolean | null | undefined,
                                          ) => {
                                            if (value == null) return "";
                                            if (typeof value !== "string") return value.toString();
                                            const label = chartConfig[value]?.label;
                                            return typeof label === "string" ? label : value;
                                          }}
                                        />
                                      </Pie>
                                      <ChartLegend
                                        content={
                                          <ChartLegendContent
                                            nameKey="option"
                                            payload={[]}
                                            verticalAlign="bottom"
                                          />
                                        }
                                        className="-translate-y-2 flex-wrap gap-2"
                                      />
                                    </PieChart>
                                  </ChartContainer>
                                </div>
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                )}

                {/* QUESTION VIEW */}
                {responseSubTab === "question" && (
                  <div className="animate-in fade-in zoom-in-95 space-y-6 duration-300">
                    <div className="bg-card border-border/50 flex items-center gap-4 rounded-xl border p-4">
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="icon"
                          disabled={questions.findIndex((q) => q.id === selectedQuestionId) <= 0}
                          onClick={() => {
                            const idx = questions.findIndex((q) => q.id === selectedQuestionId);
                            if (idx > 0) setSelectedQuestionId(questions[idx - 1].id);
                          }}
                        >
                          <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <Select
                          value={
                            selectedQuestionId === "all" ? questions[0]?.id : selectedQuestionId
                          }
                          onValueChange={setSelectedQuestionId}
                        >
                          <SelectTrigger className="w-[300px] font-medium">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {questions.map((q, i) => (
                              <SelectItem key={q.id} value={q.id}>
                                <span className="text-muted-foreground mr-2">#{i + 1}</span>{" "}
                                {q.title}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Button
                          variant="outline"
                          size="icon"
                          disabled={
                            questions.findIndex((q) => q.id === selectedQuestionId) >=
                            questions.length - 1
                          }
                          onClick={() => {
                            const idx =
                              questions.findIndex((q) => q.id === selectedQuestionId) === -1
                                ? 0
                                : questions.findIndex((q) => q.id === selectedQuestionId);
                            if (idx < questions.length - 1)
                              setSelectedQuestionId(questions[idx + 1].id);
                          }}
                        >
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="text-muted-foreground ml-auto text-sm font-medium">
                        Question{" "}
                        {questions.findIndex(
                          (q) =>
                            q.id ===
                            (selectedQuestionId === "all" ? questions[0]?.id : selectedQuestionId),
                        ) + 1}{" "}
                        of {questions.length}
                      </div>
                    </div>

                    <div className="space-y-3">
                      {responses.map((r, idx) => {
                        const qId =
                          selectedQuestionId === "all" ? questions[0]?.id : selectedQuestionId;
                        const answer = r.answers.find(
                          (a: { questionId: string }) => a.questionId === qId,
                        );
                        return (
                          <div
                            key={r.id}
                            className="bg-card border-border/50 flex items-start gap-4 rounded-xl border p-4"
                          >
                            <div className="bg-primary/10 text-primary flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-xs font-bold">
                              {responses.length - idx}
                            </div>
                            <div>
                              <div className="text-foreground text-sm font-medium">
                                {Array.isArray(answer?.value)
                                  ? answer.value.join(", ")
                                  : (answer?.value as string) || (
                                      <span className="text-muted-foreground italic">
                                        No answer
                                      </span>
                                    )}
                              </div>
                              <div className="text-muted-foreground mt-1 text-xs">
                                {new Date(r.createdAt).toLocaleString()}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* INDIVIDUAL VIEW */}
                {responseSubTab === "individual" && (
                  <div className="animate-in fade-in zoom-in-95 grid grid-cols-1 items-start gap-6 duration-300 md:grid-cols-[300px_1fr]">
                    {/* Sidebar List (Desktop) / Navigation */}
                    <div className="bg-card border-border/50 overflow-hidden rounded-xl border shadow-sm md:sticky md:top-6">
                      <div className="border-border/50 bg-muted/20 flex items-center justify-between border-b p-3">
                        <span className="text-muted-foreground text-xs font-bold tracking-wider uppercase">
                          Responses
                        </span>
                        <span className="text-muted-foreground text-xs font-medium">
                          {responses.length} total
                        </span>
                      </div>
                      <div className="custom-scrollbar max-h-[500px] space-y-1 overflow-y-auto p-2">
                        {responses.map((r, i) => (
                          <button
                            key={r.id}
                            onClick={() => setIndividualIndex(i)}
                            className={cn(
                              "flex w-full items-center gap-3 rounded-lg p-3 text-left text-sm transition-all",
                              individualIndex === i
                                ? "bg-primary/10 text-primary font-bold"
                                : "hover:bg-accent/50 text-muted-foreground hover:text-foreground",
                            )}
                          >
                            <div className="bg-background border-border/50 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-md border text-[10px] font-medium shadow-sm">
                              {responses.length - i}
                            </div>
                            <div className="flex-1 truncate">
                              {/* Try to find a name or email field, otherwise generic */}
                              {(() => {
                                // Quick heuristic to find a 'name' or 'email' answer
                                const nameQ = r.answers.find((a: { question: { title: string } }) =>
                                  a.question.title.toLowerCase().includes("name"),
                                );
                                if (nameQ) return nameQ.value as string;
                                const emailQ = r.answers.find(
                                  (a: { question: { title: string } }) =>
                                    a.question.title.toLowerCase().includes("email"),
                                );
                                if (emailQ) return emailQ.value as string;
                                return `Response #${responses.length - i}`;
                              })()}
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Detail Card */}
                    <div className="space-y-6">
                      {/* Pager */}
                      <div className="bg-card border-border/50 flex items-center justify-between rounded-xl border p-2 shadow-sm">
                        <Button
                          variant="ghost"
                          size="sm"
                          disabled={individualIndex <= 0}
                          onClick={() => setIndividualIndex((prev) => prev - 1)}
                        >
                          <ChevronLeft className="mr-2 h-4 w-4" /> Previous
                        </Button>
                        <span className="text-muted-foreground text-sm font-bold">
                          {individualIndex + 1} of {responses.length}
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          disabled={individualIndex >= responses.length - 1}
                          onClick={() => setIndividualIndex((prev) => prev + 1)}
                        >
                          Next <ChevronRight className="ml-2 h-4 w-4" />
                        </Button>
                      </div>

                      {/* Content */}
                      <Card className="border-border/50 border shadow-md">
                        <CardHeader className="border-border/20 bg-muted/5 border-b py-6">
                          <div className="flex items-center justify-between">
                            <div>
                              <CardTitle className="text-xl font-bold">Response Details</CardTitle>
                              <CardDescription className="mt-1 flex items-center gap-2">
                                <Clock className="h-3 w-3" />
                                Submitted on{" "}
                                {new Date(responses[individualIndex].createdAt).toLocaleString()}
                              </CardDescription>
                            </div>
                            <div className="text-right">
                              {responses[individualIndex].duration && (
                                <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800 dark:bg-green-900/30 dark:text-green-400">
                                  {Math.floor(responses[individualIndex].duration / 60)}m{" "}
                                  {responses[individualIndex].duration % 60}s time
                                </span>
                              )}
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-8 p-8">
                          {responses[individualIndex].answers.map((answer) => (
                            <div key={answer.questionId} className="space-y-2">
                              <h4 className="text-muted-foreground/70 text-sm font-bold tracking-wider uppercase">
                                {answer.question.title}
                              </h4>
                              <div className="bg-accent/5 border-border/30 text-foreground rounded-xl border p-4 leading-relaxed font-medium">
                                {Array.isArray(answer.value) ? (
                                  <div className="flex flex-wrap gap-2">
                                    {answer.value.map((v: string, i: number) => (
                                      <span
                                        key={i}
                                        className="bg-background border-border rounded-md border px-2 py-1 text-sm"
                                      >
                                        {v}
                                      </span>
                                    ))}
                                  </div>
                                ) : (
                                  (answer.value as string) || (
                                    <span className="text-muted-foreground/50 italic">
                                      No answer provided
                                    </span>
                                  )
                                )}
                              </div>
                            </div>
                          ))}
                        </CardContent>
                      </Card>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {activeTab === "settings" && (
          <div className="animate-in fade-in slide-in-from-bottom-4 mx-auto max-w-2xl space-y-8 pb-40 duration-700">
            <Card className="border-border/50 bg-card/60 overflow-hidden rounded-[2.5rem] border shadow-xl backdrop-blur-md">
              <CardHeader className="border-border/30 bg-accent/5 border-b px-10 pt-10 sm:px-12">
                <div className="space-y-1">
                  <CardTitle className="text-3xl font-black tracking-tight">
                    Quest Settings
                  </CardTitle>
                  <CardDescription className="text-muted-foreground/80 text-lg font-medium">
                    Control how your quest behaves and looks.
                  </CardDescription>
                </div>
              </CardHeader>
              <CardContent className="space-y-8 px-10 py-10 sm:px-12">
                {/* Quiz Section */}
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Label
                        htmlFor="isQuiz"
                        className="cursor-pointer text-xl font-black tracking-tight"
                      >
                        Make this a quiz
                      </Label>
                      <p className="text-muted-foreground/70 text-sm font-medium">
                        Assign point values, set answers, and automatically provide feedback.
                      </p>
                    </div>
                    <Switch
                      id="isQuiz"
                      checked={quest.isQuiz}
                      onCheckedChange={(val) => {
                        setQuest({ ...quest, isQuiz: val });
                        updateQuest(id as string, { isQuiz: val });
                      }}
                    />
                  </div>
                </div>

                <Separator className="opacity-30" />

                <Accordion type="multiple" className="w-full">
                  {/* Responses Section */}
                  <AccordionItem value="responses" className="border-none">
                    <AccordionTrigger className="py-4 hover:no-underline">
                      <div className="flex flex-col items-start text-left">
                        <span className="text-xl font-black tracking-tight">Responses</span>
                        <span className="text-muted-foreground/70 text-sm font-medium">
                          Manage how responses are collected.
                        </span>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="space-y-8 pt-4 pb-6">
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label className="text-base font-bold">Limit to 1 response</Label>
                          <p className="text-muted-foreground/60 text-sm">
                            Requires respondents to sign in to the Quest.
                          </p>
                        </div>
                        <Switch
                          checked={quest.limitToOneResponse}
                          onCheckedChange={(val) => {
                            setQuest({ ...quest, limitToOneResponse: val });
                            updateQuest(id as string, {
                              limitToOneResponse: val,
                            });
                          }}
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label className="text-base font-bold">
                            Show link to submit another response
                          </Label>
                          <p className="text-muted-foreground/60 text-sm">
                            Allow respondents to fill out the form multiple times.
                          </p>
                        </div>
                        <Switch
                          checked={quest.showLinkToSubmitAnother}
                          onCheckedChange={(val) => {
                            setQuest({
                              ...quest,
                              showLinkToSubmitAnother: val,
                            });
                            updateQuest(id as string, {
                              showLinkToSubmitAnother: val,
                            });
                          }}
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label className="text-base font-bold">View results summary</Label>
                          <p className="text-muted-foreground/60 text-sm">
                            Show summary charts to respondents after submission.
                          </p>
                        </div>
                        <Switch
                          checked={quest.viewResultsSummary}
                          onCheckedChange={(val) => {
                            setQuest({ ...quest, viewResultsSummary: val });
                            updateQuest(id as string, {
                              viewResultsSummary: val,
                            });
                          }}
                        />
                      </div>

                      <div className="space-y-3">
                        <Label className="text-base font-bold">Confirmation Message</Label>
                        <Textarea
                          className="bg-accent/5 border-border/50 min-h-[100px] resize-none rounded-xl"
                          defaultValue={quest.confirmationMessage || ""}
                          onBlur={(e) =>
                            updateQuest(id as string, {
                              confirmationMessage: e.target.value,
                            })
                          }
                        />
                      </div>
                    </AccordionContent>
                  </AccordionItem>

                  <Separator className="my-2 opacity-30" />

                  {/* Presentation Section */}
                  <AccordionItem value="presentation" className="border-none">
                    <AccordionTrigger className="py-4 hover:no-underline">
                      <div className="flex flex-col items-start text-left">
                        <span className="text-xl font-black tracking-tight">Presentation</span>
                        <span className="text-muted-foreground/70 text-sm font-medium">
                          Control how the quest is presented to users.
                        </span>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="space-y-8 pt-4 pb-6">
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label className="text-base font-bold">Show progress bar</Label>
                          <p className="text-muted-foreground/60 text-sm">
                            Helps respondents track their position in the quest.
                          </p>
                        </div>
                        <Switch
                          checked={quest.showProgressBar}
                          onCheckedChange={(val) => {
                            setQuest({ ...quest, showProgressBar: val });
                            updateQuest(id as string, { showProgressBar: val });
                          }}
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label className="text-base font-bold">Shuffle question order</Label>
                          <p className="text-muted-foreground/60 text-sm">
                            Randomize the order of questions for each respondent.
                          </p>
                        </div>
                        <Switch
                          checked={quest.shuffleQuestionOrder}
                          onCheckedChange={(val) => {
                            setQuest({ ...quest, shuffleQuestionOrder: val });
                            updateQuest(id as string, {
                              shuffleQuestionOrder: val,
                            });
                          }}
                        />
                      </div>

                      <Separator className="opacity-30" />

                      <div className="space-y-6">
                        <div className="flex items-center justify-between">
                          <div className="space-y-0.5">
                            <Label className="text-base font-bold">Enable Webhook</Label>
                            <p className="text-muted-foreground/60 text-sm">
                              Send response data to a custom URL when submitted.
                            </p>
                          </div>
                          <Switch
                            checked={quest.webhookEnabled}
                            onCheckedChange={(val) => {
                              setQuest({ ...quest, webhookEnabled: val });
                              updateQuest(id as string, {
                                webhookEnabled: val,
                              });
                            }}
                          />
                        </div>

                        {quest.webhookEnabled && (
                          <div className="animate-in fade-in slide-in-from-top-2 space-y-2 duration-300">
                            <Label className="text-muted-foreground/60 text-[10px] font-black tracking-[0.2em] uppercase">
                              Webhook Endpoint URL
                            </Label>
                            <Input
                              placeholder="https://your-api.com/webhook"
                              value={quest.webhookUrl || ""}
                              onChange={(e) =>
                                setQuest({
                                  ...quest,
                                  webhookUrl: e.target.value,
                                })
                              }
                              onBlur={() =>
                                updateQuest(id as string, {
                                  webhookUrl: quest.webhookUrl ?? undefined,
                                })
                              }
                              className="bg-muted/30 focus-visible:ring-primary/20 h-12 rounded-none border-none font-medium focus-visible:ring-1"
                            />
                            <p className="text-muted-foreground/40 text-[10px] italic">
                              We&apos;ll send a POST request with the response data.
                            </p>
                          </div>
                        )}
                      </div>

                      <Separator className="opacity-30" />

                      <div className="space-y-4">
                        <Label className="text-base font-bold">Background & Theme</Label>
                        <div className="space-y-2">
                          <Label className="text-muted-foreground/60 text-[10px] font-black tracking-[0.2em] uppercase">
                            Background Image URL
                          </Label>
                          <Input
                            placeholder="https://images.unsplash.com/..."
                            value={quest.backgroundImageUrl || ""}
                            onChange={(e) =>
                              setQuest({
                                ...quest,
                                backgroundImageUrl: e.target.value,
                              })
                            }
                            onBlur={() =>
                              updateQuest(id as string, {
                                backgroundImageUrl: quest.backgroundImageUrl,
                              })
                            }
                            className="bg-muted/30 focus-visible:ring-primary/20 h-12 rounded-none border-none font-medium focus-visible:ring-1"
                          />
                          <p className="text-muted-foreground/40 text-[10px] italic">
                            Provide a direct link to an image to use as the background.
                          </p>
                          {quest.backgroundImageUrl && (
                            <div className="border-border/50 relative mt-2 h-32 w-full overflow-hidden rounded-xl border">
                              <Image
                                src={quest.backgroundImageUrl}
                                alt="Background Preview"
                                fill
                                className="object-cover"
                              />
                            </div>
                          )}
                        </div>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>

                <Separator className="opacity-30" />

                {/* Default Section */}
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Label className="text-xl font-black tracking-tight">Defaults</Label>
                      <p className="text-muted-foreground/70 text-sm font-medium">
                        Set default behavior for new questions.
                      </p>
                    </div>
                  </div>
                  <div className="group flex items-center justify-between">
                    <div className="space-y-0.5">
                      <p className="text-base font-bold">Make questions required by default</p>
                      <p className="text-muted-foreground/60 text-sm">
                        New questions will have the &apos;Required&apos; flag on.
                      </p>
                    </div>
                    <Switch
                      checked={quest.questionsRequiredByDefault}
                      onCheckedChange={(val) => {
                        setQuest({ ...quest, questionsRequiredByDefault: val });
                        updateQuest(id as string, {
                          questionsRequiredByDefault: val,
                        });
                      }}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Danger Zone */}
            <Card className="border-destructive/20 bg-destructive/5 overflow-hidden rounded-[2.5rem] border shadow-xl backdrop-blur-md">
              <CardContent className="space-y-6 p-10 sm:p-12">
                <div className="space-y-2">
                  <p className="text-destructive text-xs font-black tracking-[0.3em] uppercase">
                    Danger Zone
                  </p>
                  <CardTitle className="text-destructive/80 text-2xl font-black">
                    Permanent Actions
                  </CardTitle>
                  <p className="text-muted-foreground/80 text-base leading-relaxed font-medium">
                    Deleting this quest is irreversible. All collected responses, data, and
                    analytics will be permanently wiped from our servers.
                  </p>
                </div>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="outline"
                      className="text-destructive hover:bg-destructive border-destructive/30 group h-16 w-full justify-center gap-4 rounded-2xl text-lg font-black transition-all hover:text-white"
                    >
                      <Trash2 className="h-6 w-6 group-hover:animate-bounce" /> Delete this Quest
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This action cannot be undone. This will permanently delete the quest
                        <strong> &quot;{quest.title}&quot;</strong> and all of its associated
                        responses.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={async () => {
                          await updateQuest(id as string, {
                            status: "Deleted",
                          }); // Example logic or call delete action
                          toast.success("Quest deleted");
                          router.push("/quests");
                        }}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      >
                        Delete Permanently
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
      {/* 
        AI CHAT ASSISTANT (FLOATING PANEL) 
        Provides a conversational interface for building and editing quests.
        Integrates with the /api/chat endpoint which has access to quest-specific tools.
      */}
      <div className="fixed right-8 bottom-8 z-50">
        {!isChatOpen && (
          /* Floating Trigger Button */
          <Button
            onClick={() => setIsChatOpen(true)}
            size="lg"
            className="bg-primary hover:bg-primary/90 text-primary-foreground h-16 w-16 rounded-full shadow-2xl transition-all duration-300 hover:scale-105"
          >
            <MessageSquare className="h-8 w-8" />
          </Button>
        )}

        {isChatOpen && (
          /* Expanded Chat Panel */
          <div className="bg-background/95 border-border animate-in fade-in slide-in-from-bottom-10 flex h-[660px] w-[440px] flex-col overflow-hidden rounded-3xl border shadow-2xl backdrop-blur-xl duration-300">
            {/* Panel Header */}
            <div className="bg-muted/20 flex flex-row items-center justify-between border-b p-5">
              <div className="flex items-center gap-3">
                <div className="bg-primary/10 rounded-xl p-2.5">
                  <MessageSquare className="text-primary h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold tracking-tight">Quest Assistant</h3>
                  <p className="text-muted-foreground text-[10px] font-medium tracking-wider uppercase">
                    AI Integration Hub
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="bg-muted/30 hover:bg-muted/50 h-9 w-9 rounded-full transition-colors"
                onClick={() => setIsChatOpen(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Main Chat Feed Area */}
            <div className="relative flex min-h-0 flex-1 flex-col">
              <Conversation className="h-full px-4">
                <ConversationContent className="pt-4 pb-20">
                  {messages.length === 0 ? (
                    /* Initial state */
                    <ConversationEmptyState
                      icon={<MessageSquare className="text-muted-foreground/40 size-10" />}
                      title="Ready to help"
                      description="Ask me to create questions, update titles, or generate images for your quest."
                    />
                  ) : (
                    <>
                      {messages.map((message) => {
                        // Extracting standard text and tool calls from the message parts array.
                        const parts = message.parts || [];
                        const toolParts = parts.filter(
                          (p): p is Extract<typeof p, { type: `tool-${string}` }> =>
                            typeof p.type === "string" && p.type.startsWith("tool-"),
                        );

                        return (
                          <Message from={message.role} key={message.id}>
                            <MessageContent>
                              {/* RENDER: Standard Text Parts */}
                              {parts.map((part, i) => {
                                if (part.type === "text") {
                                  return <MessageResponse key={i}>{part.text}</MessageResponse>;
                                }
                                return null;
                              })}

                              {/* RENDER: Tool Execution Indicators 
                                  Shows the user what the AI is actually doing 'under the hood' 
                                  (e.g., 'Creating 5 questions...'). */}
                              {toolParts.map((ti) => {
                                const toolName =
                                  (ti as unknown as { toolName?: string }).toolName ??
                                  ti.type.replace("tool-", "");
                                const toolCallId = ti.toolCallId;
                                const toolState = ti.state;
                                
                                // Map tool names to human-friendly status messages
                                let statusText = "";
                                switch (toolName) {
                                  case "createQuestions": {
                                    const qCount =
                                      (ti as unknown as { args?: { questions?: unknown[] } }).args
                                        ?.questions?.length || 0;
                                    statusText =
                                      qCount === 1
                                        ? "Creating question"
                                        : `Creating ${qCount} questions`;
                                    break;
                                  }
                                  case "updateQuestion":
                                    statusText = "Updating question";
                                    break;
                                  case "deleteQuestion":
                                    statusText = "Deleting question";
                                    break;
                                  case "updateQuest":
                                    statusText = "Updating quest details";
                                    break;
                                  case "generateImage":
                                    statusText = "Generating custom image";
                                    break;
                                  default:
                                    statusText = `Running ${toolName}`;
                                }

                                return (
                                  <div
                                    key={toolCallId}
                                    className="mt-3 flex items-center gap-2 text-[10px] font-bold tracking-widest uppercase opacity-70"
                                  >
                                    {!toolState.startsWith("output") ? (
                                      /* Tool is currently executing */
                                      <>
                                        <Loader className="h-3 w-3" />
                                        <span className="text-primary animate-pulse">
                                          {statusText}...
                                        </span>
                                      </>
                                    ) : (
                                      /* Tool execution finished */
                                      <>
                                        <CheckCircle2 className="h-3 w-3 text-green-500" />
                                        <span className="text-muted-foreground">
                                          {statusText} Done
                                        </span>
                                      </>
                                    )}
                                  </div>
                                );
                              })}
                            </MessageContent>

                            {/* Assistant Actions: Copy to clipboard */}
                            {message.role === "assistant" && status !== "streaming" && (
                              <MessageActions className="opacity-0 transition-opacity group-hover:opacity-100">
                                <MessageAction
                                  tooltip="Copy response"
                                  onClick={() => {
                                    const text = message.parts
                                      .filter((p) => p.type === "text")
                                      .map((p) => (p as { text: string }).text)
                                      .join("\n");
                                    handleCopy(text);
                                  }}
                                >
                                  <Copy className="h-3.5 w-3.5" />
                                </MessageAction>
                              </MessageActions>
                            )}
                          </Message>
                        );
                      })}
                    </>
                  )}

                  {/* LOADING STATE: Mapping the most recent active tool to a status message. */}
                  {isChatLoading && (
                    <div className="text-muted-foreground mt-4 flex items-center gap-2 px-2 text-xs">
                      <Loader className="h-3.5 w-3.5" />
                      <TextShimmer className="text-muted-foreground font-semibold">
                        {(() => {
                          const activeTool = messages
                            .slice(-3) // Check recent messages
                            .reverse()
                            .flatMap((m) => {
                              return (m.parts || [])
                                .filter(
                                  (p): p is Extract<typeof p, { type: `tool-${string}` }> =>
                                    typeof p.type === "string" && p.type.startsWith("tool-"),
                                )
                                .map((p) => ({
                                  toolName:
                                    (p as unknown as { toolName?: string }).toolName ??
                                    p.type.replace("tool-", ""),
                                  state: p.state,
                                  args: (p as unknown as { input?: unknown }).input,
                                }));
                            })
                            .find((ti) => !ti.state.startsWith("output"));

                          if (activeTool) {
                            const toolName = activeTool.toolName;
                            switch (toolName) {
                              case "createQuestions":
                                const count =
                                  (activeTool as { args?: { questions?: unknown[] } }).args
                                    ?.questions?.length || 0;
                                return count === 1
                                  ? "Creating question..."
                                  : `Creating ${count} questions...`;
                              case "updateQuestion":
                                return "Updating question...";
                              case "deleteQuestion":
                                return "Deleting question...";
                              case "updateQuest":
                                return "Updating quest details...";
                              case "generateImage":
                                return "Generating custom image...";
                              default:
                                return `Running ${toolName}...`;
                            }
                          }
                          return "Generating Answer...";
                        })()}
                      </TextShimmer>
                    </div>
                  )}
                </ConversationContent>
                <ConversationScrollButton />
              </Conversation>
            </div>

            {/* Chat Input Bar */}
            <div className="bg-muted/10 border-t p-5 backdrop-blur-md">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!input.trim() || isChatLoading) return;
                  handleSubmit(e);
                }}
                className="relative"
              >
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask the assistant..."
                  disabled={isChatLoading}
                  className="bg-muted/40 border-border/50 focus:ring-primary/20 placeholder:text-muted-foreground/50 w-full rounded-2xl border py-3.5 pr-12 pl-5 text-sm transition-all focus:ring-2 focus:outline-none disabled:opacity-50"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      (e.currentTarget.form as HTMLFormElement).requestSubmit();
                    }
                  }}
                />
                <Button
                  type="submit"
                  size="icon"
                  disabled={!input.trim() || isChatLoading}
                  className="absolute top-1.5 right-1.5 h-10 w-10 rounded-xl"
                >
                  {isChatLoading ? <Loader className="h-4 w-4" /> : <Send className="h-4 w-4" />}
                </Button>
              </form>
              <p className="text-muted-foreground/50 mt-3 text-center text-[10px] font-medium">
                Quest AI Assistant • Powered by Google Gemini
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
