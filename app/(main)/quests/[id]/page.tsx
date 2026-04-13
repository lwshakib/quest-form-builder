"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { S3Image } from "@/components/s3-image";

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
import { uploadFileToS3 } from "@/lib/s3-client";
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
import { Reasoning, ReasoningTrigger, ReasoningContent } from "@/components/ai-elements/reasoning";
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
  getUserCredits,
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

  // --- AI CHAT STATE/LOGIC (Custom Implementation) ---
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<
    {
      role: "user" | "assistant" | "tool";
      id?: string;
      parts: {
        type: "text" | "reasoning" | "tool";
        content?: string;
        name?: string;
        status?: "running" | "success" | "error";
      }[];
    }[]
  >([]);

  type ChatMessage = (typeof messages)[number];

  const [isChatLoading, setIsChatLoading] = useState(false);
  const [userCredits, setUserCredits] = useState<number | null>(null);

  /**
   * Effect: Load User Credits for AI Chat
   * Fetches the user's available credits from the backend when the component initially mounts.
   */
  useEffect(() => {
    async function loadCredits() {
      try {
        const credits = await getUserCredits();
        setUserCredits(credits);
      } catch (e) {
        console.error("Failed to load user credits", e);
      }
    }
    loadCredits();
  }, []);

  /**
   * Custom stream handler for the /api/chat endpoint.
   * Manages user text input, local optimistic updates to the UI, sending the request to the
   * custom orchestration API route, and iterating over the incoming Server-Sent Events (SSE).
   */
  const handleSendMessage = async (text: string) => {
    // Basic guards: Prevent empty messages, concurrent requests, or sending if out of credits
    if (!text.trim() || isChatLoading || (userCredits !== null && userCredits <= 0)) return;

    const userMessage: ChatMessage = {
      role: "user",
      parts: [{ type: "text", content: text }],
    };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsChatLoading(true);

    // Optimistically update credits locally so the UI feels fast and responsive
    setUserCredits((prev) => (prev !== null ? Math.max(0, prev - 1) : null));

    try {
      // Transmit conversation history. We map our complex UI state back down to simple
      // text payloads expected by the server's AI abstraction.
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [...messages, userMessage].map((m) => ({
            role: m.role,
            content: m.parts
              .filter((p) => p.type === "text")
              .map((p) => p.content)
              .join(""),
            reasoning_content: m.parts
              .filter((p) => p.type === "reasoning")
              .map((p) => p.content)
              .join(""),
          })),
          questId: id,
        }),
      });

      if (!response.body) throw new Error("Stream body missing");

      // Set up the reader to parse the raw streaming bytes emitted from the backend loop
      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      // Initialize an empty assistant message template to progressively stream chunk content into
      const assistantId = `assistant-${Date.now()}`;
      setMessages((prev) => [...prev, { role: "assistant", id: assistantId, parts: [] }]);

      // We maintain a buffer to account for partial stream bytes arriving asynchronously
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          const cleanLine = line.trim();
          if (!cleanLine.startsWith("data: ")) continue;

          try {
            const data = JSON.parse(cleanLine.slice(6));

            if (data.content) {
              setMessages((prev) =>
                prev.map((m) => {
                  if (m.id !== assistantId) return m;
                  const parts = [...m.parts];
                  const lastPart = parts[parts.length - 1];
                  if (lastPart?.type === "text") {
                    parts[parts.length - 1] = {
                      ...lastPart,
                      content: (lastPart.content || "") + data.content,
                    };
                  } else {
                    parts.push({ type: "text", content: data.content });
                  }
                  return { ...m, parts };
                }),
              );
            }

            if (data.reasoning) {
              setMessages((prev) =>
                prev.map((m) => {
                  if (m.id !== assistantId) return m;
                  const parts = [...m.parts];
                  const lastPart = parts[parts.length - 1];
                  if (lastPart?.type === "reasoning") {
                    parts[parts.length - 1] = {
                      ...lastPart,
                      content: (lastPart.content || "") + data.reasoning,
                    };
                  } else {
                    parts.push({ type: "reasoning", content: data.reasoning });
                  }
                  return { ...m, parts };
                }),
              );
            }

            if (data.toolCall) {
              setMessages((prev) =>
                prev.map((m) => {
                  if (m.id !== assistantId) return m;
                  const parts = [...m.parts];
                  const existingIdx = parts.findIndex(
                    (p) => p.type === "tool" && p.name === data.toolCall && p.status === "running",
                  );

                  if (data.result || data.error) {
                    if (existingIdx !== -1) {
                      parts[existingIdx] = {
                        ...parts[existingIdx],
                        status: data.error ? "error" : "success",
                      };
                    }
                  } else {
                    if (existingIdx === -1) {
                      parts.push({ type: "tool", name: data.toolCall, status: "running" });
                    }
                  }
                  return { ...m, parts };
                }),
              );

              if (data.result) {
                await loadQuestData();
              }
            }

            if (data.error) {
              toast.error("Internal Server Error");
            }
          } catch (e) {
            console.error("Error parsing stream chunk", e);
          }
        }
      }
    } catch (err) {
      toast.error("Internal Server Error");
      console.error(err);
      // Restore credits if the request failed completely
      const credits = await getUserCredits();
      setUserCredits(credits);
    } finally {
      setIsChatLoading(false);
      await loadQuestData(); // Final sync
      // Refresh credits to ensure they are fully in sync
      const credits = await getUserCredits();
      setUserCredits(credits);
    }
  };

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
    await handleSendMessage(input);
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
      const { secureUrl } = await uploadFileToS3(file);
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

  /**
   * Generates and downloads a CSV file containing all responses.
   */
  const handleExportCsv = () => {
    if (!quest || !responses.length || !questions.length) {
      toast.error("No data to export");
      return;
    }

    // Build the header row
    const headers = [
      "Response ID",
      "Submitted At",
      "Duration (s)",
      ...questions.map((q) => q.title.replace(/"/g, '""')),
    ];

    const csvRows = [headers.map((h) => `"${h}"`).join(",")];

    // Build each data row
    responses.forEach((r) => {
      const row = [
        r.id,
        new Date(r.createdAt).toLocaleString(),
        r.duration?.toString() || "",
        ...questions.map((q) => {
          const answer = r.answers.find((a) => a.questionId === q.id);
          let val = "";
          if (answer) {
            val = Array.isArray(answer.value)
              ? answer.value.join(", ")
              : (answer.value as string) || "";
          }
          return val.replace(/"/g, '""');
        }),
      ];
      csvRows.push(row.map((cell) => `"${cell}"`).join(","));
    });

    // Create and trigger the download
    const csvContent = csvRows.join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute(
      "download",
      `quest-${quest.title.replace(/[^a-z0-9]/gi, "_").toLowerCase()}-responses.csv`,
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success("Responses exported as CSV");
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
                    <S3Image
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
            <div className="flex flex-col gap-6 sm:flex-row">
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
                <div
                  key={stat.label}
                  className="bg-background/20 border-border/30 hover:bg-background/40 flex-1 overflow-hidden rounded-2xl border px-8 py-10 transition-all"
                >
                  <p className="text-muted-foreground/50 text-[10px] font-black tracking-[0.2em]">
                    {stat.label}
                  </p>
                  <h3 className="text-primary mt-3 text-4xl font-black tracking-tighter">
                    {stat.value}
                  </h3>
                </div>
              ))}
            </div>

            {/* Actions / Tabs Toolbar */}
            <div className="flex flex-col items-center justify-between gap-6 md:flex-row">
              <div className="border-border/30 flex items-center gap-1 border-b pb-1">
                {(["summary", "question", "individual"] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setResponseSubTab(tab)}
                    className={cn(
                      "relative px-4 py-2 text-xs font-black tracking-widest capitalize transition-all",
                      responseSubTab === tab
                        ? "text-primary"
                        : "text-muted-foreground/50 hover:text-foreground",
                    )}
                  >
                    {tab}
                    {responseSubTab === tab && (
                      <div className="bg-primary animate-in fade-in slide-in-from-bottom-1 absolute right-0 bottom-0 left-0 h-0.5" />
                    )}
                  </button>
                ))}
              </div>

              <div className="flex w-full items-center gap-2 md:w-auto">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleExportCsv}
                  disabled={responses.length === 0}
                  className="bg-secondary/20 hover:bg-secondary/30 text-muted-foreground h-9 gap-2 rounded-2xl px-4 text-[10px] font-black tracking-widest transition-all"
                >
                  <Download className="h-4 w-4" />
                  <span className="hidden sm:inline">Export</span>
                </Button>

                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive/50 hover:bg-destructive/10 hover:text-destructive h-9 gap-2 rounded-2xl px-4 text-[10px] font-black tracking-widest transition-all"
                    >
                      <Trash2 className="h-4 w-4" />
                      <span className="hidden sm:inline">Clear all</span>
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
                        <div
                          key={q.id}
                          className="border-border/30 bg-background/30 hover:bg-background/50 overflow-hidden rounded-2xl border transition-all"
                        >
                          <div className="flex items-center gap-4 px-8 py-6">
                            <span className="bg-primary/5 text-primary flex h-8 w-8 items-center justify-center rounded-xl text-xs font-bold">
                              {i + 1}
                            </span>
                            <div>
                              <h4 className="text-sm font-black tracking-tight">{q.title}</h4>
                              <p className="text-muted-foreground/60 text-[10px] font-bold tracking-widest">
                                {answers.length} responses
                              </p>
                            </div>
                          </div>
                          <div className="px-8 pb-8">
                            {["SHORT_TEXT", "PARAGRAPH", "DATE", "TIME"].includes(q.type) ? (
                              <div className="space-y-3">
                                {(answers as string[])
                                  .slice(0, 10)
                                  .map((ans: string, idx: number) => (
                                    <div
                                      key={idx}
                                      className="border-border/20 bg-accent/5 text-foreground/80 hover:border-border/40 rounded-xl border px-4 py-3 text-sm font-medium transition-all"
                                    >
                                      {ans}
                                    </div>
                                  ))}
                                {answers.length > 10 && (
                                  <p className="text-muted-foreground/40 pt-2 text-center text-[10px] font-bold tracking-widest">
                                    + {answers.length - 10} more responses
                                  </p>
                                )}
                              </div>
                            ) : (
                              <div className="flex flex-col items-start gap-12 lg:flex-row">
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
                                <div className="grid w-full grid-cols-1 gap-3 sm:grid-cols-2 lg:w-64 lg:flex-shrink-0">
                                  {chartData.map((c) => (
                                    <div
                                      key={c.option}
                                      className="border-border/30 bg-background/50 hover:bg-background/80 flex flex-col items-center justify-center rounded-xl border p-4 text-center transition-all"
                                    >
                                      <div
                                        className="mb-3 h-2 w-full rounded-full"
                                        style={{
                                          backgroundColor: `var(--chart-${(chartData.indexOf(c) % 5) + 1})`,
                                        }}
                                      />
                                      <span className="w-full truncate px-1 text-[10px] font-black tracking-widest">
                                        {c.option}
                                      </span>
                                      <span className="mt-1 text-lg leading-none font-black">
                                        {c.count}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* QUESTION VIEW */}
                {responseSubTab === "question" && (
                  <div className="animate-in fade-in zoom-in-95 space-y-8 duration-300">
                    <div className="border-border/30 bg-background/50 flex flex-col items-center justify-between gap-6 overflow-hidden rounded-2xl border p-2 sm:flex-row">
                      <div className="flex w-full items-center gap-2 sm:w-auto">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-10 w-10 shrink-0 rounded-xl"
                          disabled={questions.findIndex((q) => q.id === selectedQuestionId) <= 0}
                          onClick={() => {
                            const idx = questions.findIndex((q) => q.id === selectedQuestionId);
                            if (idx > 0) setSelectedQuestionId(questions[idx - 1].id);
                          }}
                        >
                          <ChevronLeft className="h-5 w-5" />
                        </Button>
                        <Select
                          value={
                            selectedQuestionId === "all" ? questions[0]?.id : selectedQuestionId
                          }
                          onValueChange={setSelectedQuestionId}
                        >
                          <SelectTrigger className="bg-background/50 focus:ring-primary/20 h-11 rounded-xl border-none font-bold focus:ring-1">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {questions.map((q, i) => (
                              <SelectItem key={q.id} value={q.id}>
                                <span className="text-muted-foreground mr-2 font-mono">
                                  #{i + 1}
                                </span>{" "}
                                {q.title}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-10 w-10 shrink-0 rounded-xl"
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
                          <ChevronRight className="h-5 w-5" />
                        </Button>
                      </div>
                      <div className="text-muted-foreground/60 px-4 pb-4 text-[10px] font-black tracking-widest sm:pb-0">
                        {questions.findIndex(
                          (q) =>
                            q.id ===
                            (selectedQuestionId === "all" ? questions[0]?.id : selectedQuestionId),
                        ) + 1}{" "}
                        / {questions.length} Questions
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                      {responses.map((r, idx) => {
                        const qId =
                          selectedQuestionId === "all" ? questions[0]?.id : selectedQuestionId;
                        const answer = r.answers.find(
                          (a: { questionId: string }) => a.questionId === qId,
                        );
                        return (
                          <div
                            key={r.id}
                            className="border-border/30 bg-background/50 hover:bg-background/80 flex flex-col gap-4 overflow-hidden rounded-2xl border p-6 transition-all"
                          >
                            <div className="flex items-center justify-between">
                              <div className="bg-primary/10 text-primary flex h-7 w-7 items-center justify-center rounded-lg text-[10px] font-black">
                                #{responses.length - idx}
                              </div>
                              <span className="text-muted-foreground/40 text-[9px] font-bold tracking-widest">
                                {new Date(r.createdAt).toLocaleDateString()}
                              </span>
                            </div>
                            <div className="text-foreground min-h-[40px] text-sm leading-relaxed font-medium">
                              {Array.isArray(answer?.value)
                                ? answer.value.join(", ")
                                : (answer?.value as string) || (
                                    <span className="text-muted-foreground/30 italic">
                                      No answer provided
                                    </span>
                                  )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* INDIVIDUAL VIEW */}
                {responseSubTab === "individual" && (
                  <div className="animate-in fade-in zoom-in-95 grid grid-cols-1 items-start gap-8 duration-300 md:grid-cols-[280px_1fr]">
                    {/* Sidebar List (Desktop) / Navigation */}
                    <div className="border-border/30 bg-background/30 overflow-hidden rounded-2xl border md:sticky md:top-6">
                      <div className="border-border/10 bg-muted/10 flex items-center justify-between border-b px-5 py-4">
                        <span className="text-muted-foreground/70 text-[10px] font-black tracking-widest">
                          Entries
                        </span>
                        <span className="bg-primary/10 text-primary rounded-md px-2 py-0.5 text-[10px] font-black">
                          {responses.length}
                        </span>
                      </div>
                      <div className="custom-scrollbar max-h-[600px] overflow-y-auto p-2">
                        {responses.map((r, i) => (
                          <button
                            key={r.id}
                            onClick={() => setIndividualIndex(i)}
                            className={cn(
                              "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm transition-all",
                              individualIndex === i
                                ? "bg-secondary text-foreground font-medium"
                                : "text-muted-foreground hover:bg-secondary/50",
                            )}
                          >
                            <span
                              className={cn(
                                "w-4 text-right text-[10px] font-bold",
                                individualIndex === i
                                  ? "text-foreground"
                                  : "text-muted-foreground/40",
                              )}
                            >
                              {responses.length - i}
                            </span>
                            <div className="flex-1 truncate">
                              {(() => {
                                const nameQ = r.answers.find((a: { question: { title: string } }) =>
                                  a.question.title.toLowerCase().includes("name"),
                                );
                                if (nameQ) return nameQ.value as string;
                                const emailQ = r.answers.find(
                                  (a: { question: { title: string } }) =>
                                    a.question.title.toLowerCase().includes("email"),
                                );
                                if (emailQ) return emailQ.value as string;
                                return `Entry #${responses.length - i}`;
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
                      <div className="border-border/30 bg-background/50 overflow-hidden rounded-2xl border transition-all">
                        <div className="border-border/10 bg-muted/5 flex items-center justify-between border-b px-8 py-6">
                          <div>
                            <h3 className="text-xl font-black tracking-tight">Response Details</h3>
                            <p className="text-muted-foreground/60 mt-1 flex items-center gap-2 text-[10px] font-bold tracking-widest">
                              <Clock className="h-3 w-3" />
                              Submitted on{" "}
                              {new Date(responses[individualIndex].createdAt).toLocaleString()}
                            </p>
                          </div>
                          {responses[individualIndex].duration && (
                            <div className="text-right">
                              <span className="bg-primary/5 text-primary rounded-xl px-4 py-1.5 text-[10px] font-black tracking-widest">
                                {Math.floor(responses[individualIndex].duration / 60)}m{" "}
                                {responses[individualIndex].duration % 60}s duration
                              </span>
                            </div>
                          )}
                        </div>
                        <div className="space-y-10 p-8">
                          {responses[individualIndex].answers.map((answer) => (
                            <div key={answer.questionId} className="group/ans space-y-3">
                              <div className="flex items-center gap-3">
                                <div className="bg-primary/20 group-hover/ans:bg-primary h-1 w-6 rounded-full transition-all group-hover/ans:w-10" />
                                <h4 className="text-muted-foreground/50 text-[10px] font-black tracking-[0.2em]">
                                  {answer.question.title}
                                </h4>
                              </div>
                              <div className="bg-secondary/20 text-foreground border-border/10 hover:bg-secondary/30 rounded-2xl border p-6 text-sm leading-relaxed font-medium transition-all">
                                {Array.isArray(answer.value) ? (
                                  <div className="flex flex-wrap gap-2">
                                    {answer.value.map((v: string, i: number) => (
                                      <span
                                        key={i}
                                        className="bg-background/80 border-border/20 rounded-lg border px-3 py-1 text-xs font-bold"
                                      >
                                        {v}
                                      </span>
                                    ))}
                                  </div>
                                ) : (
                                  (answer.value as string) || (
                                    <span className="text-muted-foreground/30 italic">
                                      No answer provided
                                    </span>
                                  )
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {activeTab === "settings" && (
          <div className="animate-in fade-in slide-in-from-bottom-4 mx-auto max-w-2xl space-y-12 pb-40 duration-700">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
              <p className="text-muted-foreground text-sm">
                Manage your quest&apos;s behavior and defaults.
              </p>
            </div>

            <div className="space-y-10">
              {/* Builder Defaults */}
              <section className="space-y-6">
                <div className="flex flex-col gap-1">
                  <h3 className="text-primary/70 text-sm font-black tracking-widest uppercase">
                    Builder Defaults
                  </h3>
                  <Separator className="mt-1 opacity-20" />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-base font-bold">Require questions by default</Label>
                    <p className="text-muted-foreground text-xs">
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
              </section>

              {/* Submission Experience */}
              <section className="space-y-6">
                <div className="flex flex-col gap-1">
                  <h3 className="text-primary/70 text-sm font-black tracking-widest uppercase">
                    Submission Experience
                  </h3>
                  <Separator className="mt-1 opacity-20" />
                </div>

                <div className="space-y-8">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="text-base font-bold">Limit to 1 response</Label>
                      <p className="text-muted-foreground text-xs">
                        Requires respondents to sign in.
                      </p>
                    </div>
                    <Switch
                      checked={quest.limitToOneResponse}
                      onCheckedChange={(val) => {
                        setQuest({ ...quest, limitToOneResponse: val });
                        updateQuest(id as string, { limitToOneResponse: val });
                      }}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="text-base font-bold">
                        Show link to submit another response
                      </Label>
                      <p className="text-muted-foreground text-xs">
                        Allow respondents to fill out the form multiple times.
                      </p>
                    </div>
                    <Switch
                      checked={quest.showLinkToSubmitAnother}
                      onCheckedChange={(val) => {
                        setQuest({ ...quest, showLinkToSubmitAnother: val });
                        updateQuest(id as string, { showLinkToSubmitAnother: val });
                      }}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-base font-bold">Confirmation Message</Label>
                    <Textarea
                      className="bg-accent/5 border-border/50 min-h-[80px] resize-none rounded-xl"
                      defaultValue={quest.confirmationMessage || ""}
                      onBlur={(e) =>
                        updateQuest(id as string, { confirmationMessage: e.target.value })
                      }
                    />
                    <p className="text-muted-foreground text-[10px] italic">
                      Shown after the quest is completed.
                    </p>
                  </div>
                </div>
              </section>

              {/* Presentation Section */}
              <section className="space-y-6">
                <div className="flex flex-col gap-1">
                  <h3 className="text-primary/70 text-sm font-black tracking-widest uppercase">
                    Presentation
                  </h3>
                  <Separator className="mt-1 opacity-20" />
                </div>

                <div className="space-y-8">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="text-base font-bold">Show progress bar</Label>
                      <p className="text-muted-foreground text-xs">
                        Helps respondents track their position.
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
                      <p className="text-muted-foreground text-xs">
                        Randomize questions for each respondent.
                      </p>
                    </div>
                    <Switch
                      checked={quest.shuffleQuestionOrder}
                      onCheckedChange={(val) => {
                        setQuest({ ...quest, shuffleQuestionOrder: val });
                        updateQuest(id as string, { shuffleQuestionOrder: val });
                      }}
                    />
                  </div>
                </div>
              </section>

              {/* Integrations Section */}
              <section className="space-y-6">
                <div className="flex flex-col gap-1">
                  <h3 className="text-primary/70 text-sm font-black tracking-widest uppercase">
                    Integrations
                  </h3>
                  <Separator className="mt-1 opacity-20" />
                </div>

                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="text-base font-bold">Enable Webhook</Label>
                      <p className="text-muted-foreground text-xs">
                        Send response data to a custom URL.
                      </p>
                    </div>
                    <Switch
                      checked={quest.webhookEnabled}
                      onCheckedChange={(val) => {
                        setQuest({ ...quest, webhookEnabled: val });
                        updateQuest(id as string, { webhookEnabled: val });
                      }}
                    />
                  </div>

                  {quest.webhookEnabled && (
                    <div className="animate-in fade-in slide-in-from-top-2 space-y-2">
                      <Label className="text-muted-foreground/60 text-[10px] font-black tracking-widest uppercase">
                        Webhook Endpoint URL
                      </Label>
                      <Input
                        placeholder="https://your-api.com/webhook"
                        value={quest.webhookUrl || ""}
                        onChange={(e) => setQuest({ ...quest, webhookUrl: e.target.value })}
                        onBlur={() =>
                          updateQuest(id as string, { webhookUrl: quest.webhookUrl ?? undefined })
                        }
                        className="bg-accent/5 focus-visible:ring-primary/20 h-11 rounded-none border-none font-medium focus-visible:ring-1"
                      />
                    </div>
                  )}
                </div>
              </section>

              {/* Danger Zone */}
              <section className="space-y-6 pt-10">
                <div className="flex flex-col gap-1">
                  <h3 className="text-destructive/70 text-sm font-black tracking-widest uppercase">
                    Danger Zone
                  </h3>
                  <Separator className="bg-destructive/20 mt-1" />
                </div>

                <div className="border-destructive/20 bg-destructive/5 rounded-xl border p-6">
                  <div className="flex flex-col gap-4">
                    <div className="space-y-1">
                      <h4 className="text-destructive text-base font-bold">Delete this Quest</h4>
                      <p className="text-muted-foreground text-xs font-medium">
                        Irreversibly delete this quest and all its responses.
                      </p>
                    </div>

                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="outline"
                          className="text-destructive hover:bg-destructive border-destructive/30 w-fit gap-2 font-bold transition-all hover:text-white"
                        >
                          <Trash2 className="h-4 w-4" /> Delete Quest
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This will permanently delete &quot;{quest.title}&quot; and all its data.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={async () => {
                              await updateQuest(id as string, { status: "Deleted" });
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
                  </div>
                </div>
              </section>
            </div>
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
                    <div className="flex flex-col gap-6">
                      <ConversationEmptyState
                        icon={<MessageSquare className="text-muted-foreground/40 size-10" />}
                        title="Ready to help"
                        description="Ask me to create questions, update titles, or generate images for your quest."
                      />

                      {/* Suggested Prompts */}
                      <div className="flex flex-col gap-2 px-2">
                        <p className="text-muted-foreground mb-1 text-[10px] font-bold tracking-widest uppercase">
                          Suggested Actions
                        </p>
                        {[
                          "Create a 5-question survey about customer satisfaction",
                          "Generate a vibrant cyber-punk background image",
                          "Make this quest a quiz with progress bar enabled",
                        ].map((prompt, i) => (
                          <button
                            key={i}
                            onClick={() => setInput(prompt)}
                            className="bg-muted/30 hover:bg-muted/60 border-border/50 text-muted-foreground hover:text-foreground flex items-center justify-between rounded-xl border px-4 py-2.5 text-left text-xs transition-all active:scale-[0.98]"
                          >
                            <span className="line-clamp-1">{prompt}</span>
                            <Plus className="h-3 w-3 opacity-50" />
                          </button>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <>
                      {messages.map((message, idx) => (
                        <Message from={message.role} key={idx}>
                          <MessageContent>
                            {message.parts.map((part, pIdx) => {
                              if (part.type === "reasoning") {
                                return (
                                  <Reasoning
                                    key={pIdx}
                                    isStreaming={
                                      isChatLoading &&
                                      idx === messages.length - 1 &&
                                      pIdx === message.parts.length - 1
                                    }
                                  >
                                    <ReasoningTrigger />
                                    <ReasoningContent>{part.content || ""}</ReasoningContent>
                                  </Reasoning>
                                );
                              }

                              if (part.type === "tool") {
                                return (
                                  <div
                                    key={pIdx}
                                    className="animate-in fade-in slide-in-from-left-2 mb-2 flex items-center gap-2.5 text-[10px] font-bold tracking-widest uppercase"
                                  >
                                    {part.status === "running" ? (
                                      <>
                                        <Loader className="text-primary h-3 w-3 animate-spin" />
                                        <span className="text-primary">
                                          Running {part.name?.replace(/([A-Z])/g, " $1")}...
                                        </span>
                                      </>
                                    ) : part.status === "success" ? (
                                      <>
                                        <div className="rounded-full bg-green-500/10 p-0.5">
                                          <CheckCircle2 className="h-2.5 w-2.5 text-green-500" />
                                        </div>
                                        <span className="text-muted-foreground/80">
                                          {part.name?.replace(/([A-Z])/g, " $1")} Success
                                        </span>
                                      </>
                                    ) : (
                                      <>
                                        <X className="h-3 w-3 text-red-500" />
                                        <span className="text-red-500">
                                          {part.name?.replace(/([A-Z])/g, " $1")} Failed
                                        </span>
                                      </>
                                    )}
                                  </div>
                                );
                              }

                              return (
                                <MessageResponse key={pIdx}>{part.content || ""}</MessageResponse>
                              );
                            })}

                            {/* Initial Loading / Thinking State - Only if no parts yet */}
                            {message.role === "assistant" &&
                              isChatLoading &&
                              idx === messages.length - 1 &&
                              message.parts.length === 0 && (
                                <div className="flex items-center gap-2.5 py-1">
                                  <Loader className="text-muted-foreground h-3.5 w-3.5 animate-spin" />
                                  <span className="text-muted-foreground text-[10px] font-bold tracking-widest uppercase">
                                    Thinking...
                                  </span>
                                </div>
                              )}
                          </MessageContent>

                          {/* Assistant Actions: Copy all text parts */}
                          {message.role === "assistant" && !isChatLoading && (
                            <MessageActions className="opacity-0 transition-opacity group-hover:opacity-100">
                              <MessageAction
                                tooltip="Copy response"
                                onClick={() =>
                                  handleCopy(
                                    message.parts
                                      .filter((p) => p.type === "text")
                                      .map((p) => p.content)
                                      .join("\n"),
                                  )
                                }
                              >
                                <Copy className="h-3.5 w-3.5" />
                              </MessageAction>
                            </MessageActions>
                          )}
                        </Message>
                      ))}
                    </>
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
                  disabled={
                    !input.trim() || isChatLoading || (userCredits !== null && userCredits <= 0)
                  }
                  className="absolute top-1.5 right-1.5 h-10 w-10 rounded-xl"
                >
                  {isChatLoading ? <Loader className="h-4 w-4" /> : <Send className="h-4 w-4" />}
                </Button>
              </form>
              <div className="mt-3 flex items-center justify-between px-2">
                <p className="text-muted-foreground/50 text-[10px] font-medium">
                  {userCredits !== null && userCredits > 0 ? (
                    <span className="text-primary/70 font-bold">
                      {userCredits} credits remaining
                    </span>
                  ) : userCredits !== null && userCredits <= 0 ? (
                    <span className="text-destructive font-bold">
                      Credits exhausted, wait for daily reset
                    </span>
                  ) : (
                    <span className="text-primary/70 font-bold">... credits remaining</span>
                  )}
                </p>
                <p className="text-muted-foreground/50 text-[10px] font-medium">
                  Quest AI Assistant
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
