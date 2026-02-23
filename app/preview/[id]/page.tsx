"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { getQuestById } from "@/lib/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Eye, Check } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { authClient } from "@/lib/auth-client";
import { ModeToggle } from "@/components/mode-toggle";
import Image from "next/image";

interface Question {
  id: string;
  type: string;
  title: string;
  description: string | null;
  required: boolean;
  options?: string[] | { value: string; image?: string }[];
}

interface Quest {
  id: string;
  title: string;
  description: string | null;
  backgroundImageUrl: string | null;
  showProgressBar: boolean;
  questions: Question[];
}

export default function PreviewQuestPage() {
  const { id } = useParams();
  const router = useRouter();

  const [quest, setQuest] = useState<Quest | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isNotFound, setIsNotFound] = useState(false);
  const [answers, setAnswers] = useState<Record<string, unknown>>({});
  const [progress, setProgress] = useState(0);
  const [activeQuestionId, setActiveQuestionId] = useState<string | null>(null);

  const { data: session, isPending: isSessionLoading } = authClient.useSession();

  useEffect(() => {
    if (!quest) return;
    const relevantQuestions = quest.questions.filter(
      (q: Question) => q.type !== "VIDEO" && q.type !== "IMAGE",
    );
    const requiredQuestions = relevantQuestions.filter((q: Question) => q.required);

    if (requiredQuestions.length === 0) {
      const filledCount = relevantQuestions.filter((q: Question) => {
        const val = answers[q.id];
        if (val === undefined || val === null) return false;
        if (typeof val === "string") return val.trim() !== "";
        if (Array.isArray(val)) return val.length > 0;
        return true;
      }).length;
      setProgress(
        relevantQuestions.length > 0 ? (filledCount / relevantQuestions.length) * 100 : 0,
      );
      return;
    }

    const filledRequiredCount = requiredQuestions.filter((q: Question) => {
      const val = answers[q.id];
      if (val === undefined || val === null) return false;
      if (typeof val === "string") return val.trim() !== "";
      if (Array.isArray(val)) return val.length > 0;
      return true;
    }).length;
    setProgress((filledRequiredCount / requiredQuestions.length) * 100);
  }, [answers, quest]);

  useEffect(() => {
    async function loadQuest() {
      try {
        const data = await getQuestById(id as string);
        if (!data) {
          setIsNotFound(true);
          return;
        }

        setQuest(data as unknown as Quest);

        const initialAnswers: Record<string, unknown> = {};
        (data.questions as Question[]).forEach((q) => {
          if (q.type === "VIDEO" || q.type === "IMAGE") return;
          if (q.type === "CHECKBOXES") {
            initialAnswers[q.id] = [];
          } else {
            initialAnswers[q.id] = "";
          }
        });
        setAnswers(initialAnswers);
      } catch {
        setIsNotFound(true);
      } finally {
        setIsLoading(false);
      }
    }

    if (!isSessionLoading) {
      if (!session) {
        router.push(`/login?redirectTo=/preview/${id}`);
      } else {
        loadQuest();
      }
    }
  }, [id, session, isSessionLoading, router]);

  const handleInputChange = (questionId: string, value: unknown) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: value,
    }));
  };

  const handleCheckboxChange = (questionId: string, option: string, checked: boolean) => {
    setAnswers((prev) => {
      const currentAnswers = (prev[questionId] as string[]) || [];
      if (checked) {
        return { ...prev, [questionId]: [...currentAnswers, option] };
      } else {
        return {
          ...prev,
          [questionId]: currentAnswers.filter((a) => a !== option),
        };
      }
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success("This is a preview. Responses are not saved.");
  };

  if (isLoading || isSessionLoading) {
    return (
      <div className="bg-background flex min-h-screen items-center justify-center px-6 py-16">
        <Loader2 className="text-primary h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (isNotFound) {
    return (
      <div className="bg-background flex min-h-screen flex-col items-center justify-center p-6 text-center">
        <h1 className="text-2xl font-bold">Quest not found or access denied</h1>
        <p className="text-muted-foreground mt-2">
          You must be the owner of this quest to preview it.
        </p>
        <Button onClick={() => router.push("/quests")} className="mt-8">
          Go back to Dashboard
        </Button>
      </div>
    );
  }

  if (!quest) return null;

  return (
    <div className="bg-background selection:bg-primary selection:text-primary-foreground relative min-h-screen overflow-x-hidden px-6 py-16">
      {/* Preview Badge */}
      <div className="bg-primary/10 border-primary/20 fixed top-0 right-0 left-0 z-[110] flex h-10 items-center justify-center border-b backdrop-blur-sm">
        <div className="text-primary flex items-center gap-2 text-[10px] font-black tracking-[0.2em] uppercase">
          <Eye className="h-3 w-3" />
          Preview Mode
        </div>
      </div>

      <div className="absolute top-14 right-6 z-[100]">
        <ModeToggle />
      </div>

      {quest?.showProgressBar && (
        <div className="bg-accent/20 fixed top-10 right-0 left-0 z-[100] h-1">
          <div
            className="bg-primary h-full transition-all duration-1000 ease-in-out"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}

      {/* Decorative Background */}
      <div className="pointer-events-none fixed inset-0 bg-[linear-gradient(to_right,#80808008_1px,transparent_1px),linear-gradient(to_bottom,#80808008_1px,transparent_1px)] bg-[size:40px_40px]" />

      <div className="pointer-events-none fixed top-0 left-1/2 h-full w-full -translate-x-1/2 bg-[radial-gradient(circle_at_50%_0%,rgba(var(--primary),0.02),transparent_50%)]" />

      <div className="animate-in fade-in slide-in-from-bottom-8 relative mx-auto max-w-2xl space-y-8 duration-1000">
        <form onSubmit={handleSubmit} className="space-y-6 pb-20">
          <div className="space-y-6">
            {quest?.backgroundImageUrl && (
              <div className="border-border/50 bg-background relative h-40 overflow-hidden rounded-lg border shadow-sm sm:h-56">
                <Image
                  src={quest.backgroundImageUrl}
                  alt="Quest header image"
                  fill
                  className="object-cover"
                />
              </div>
            )}
            <div className="border-border/50 bg-background relative overflow-hidden rounded-lg border shadow-sm">
              <div className="via-primary/5 absolute top-0 right-4 left-4 h-px bg-gradient-to-r from-transparent to-transparent" />
              <div className="relative z-10 space-y-4 p-8 sm:p-10">
                <div className="space-y-2">
                  <h1 className="text-2xl leading-tight font-black tracking-tight sm:text-3xl">
                    {quest.title}
                  </h1>
                  {quest.description && (
                    <p className="text-muted-foreground/70 max-w-xl text-base leading-relaxed font-medium">
                      {quest.description}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {quest.questions.map((q: Question) => (
              <div
                key={q.id}
                className={cn(
                  "border-border/50 bg-background group/card relative overflow-hidden rounded-lg border shadow-sm transition-all duration-300",
                  activeQuestionId === q.id
                    ? "border-primary/10 ring-primary/5 shadow-xs ring-2"
                    : "hover:border-border/60 hover:shadow-sm",
                )}
                onFocus={() => setActiveQuestionId(q.id)}
              >
                <div className="via-primary/5 absolute top-0 right-4 left-4 h-px bg-gradient-to-r from-transparent to-transparent" />
                <div className="relative z-10 space-y-6 p-6 sm:p-8">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label className="block text-lg font-bold tracking-tight sm:text-xl">
                        {q.title}
                        {q.required && <span className="text-primary ml-2 inline-block">*</span>}
                      </Label>
                      {q.description && (
                        <p className="text-muted-foreground/60 max-w-lg text-xs leading-relaxed font-medium">
                          {q.description}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="space-y-6">
                    {q.type === "SHORT_TEXT" && (
                      <Input
                        placeholder="Your answer..."
                        className="border-border/60 focus-visible:border-primary placeholder:text-muted-foreground/20 h-12 rounded-none border-0 border-b bg-transparent px-0 text-lg font-medium transition-all focus-visible:ring-0"
                        value={(answers[q.id] as string) || ""}
                        onChange={(e) => handleInputChange(q.id, e.target.value)}
                      />
                    )}

                    {q.type === "PARAGRAPH" && (
                      <Textarea
                        placeholder="Long form response..."
                        className="bg-accent/5 focus:border-primary/20 placeholder:text-muted-foreground/20 min-h-[140px] resize-none rounded-xl border-2 border-transparent p-4 text-base leading-relaxed font-medium transition-all focus:ring-0"
                        value={(answers[q.id] as string) || ""}
                        onChange={(e) => handleInputChange(q.id, e.target.value)}
                      />
                    )}

                    {q.type === "MULTIPLE_CHOICE" && (
                      <RadioGroup
                        className="grid grid-cols-1 gap-3"
                        onValueChange={(val) => handleInputChange(q.id, val)}
                        value={(answers[q.id] as string) || ""}
                      >
                        {((q.options as string[]) || []).map((option) => (
                          <Label
                            key={option}
                            className={cn(
                              "border-border/60 hover:bg-accent/5 group/opt flex cursor-pointer items-center gap-4 rounded-xl border p-4 transition-all duration-200",
                              answers[q.id] === option && "border-primary/40 bg-primary/5",
                            )}
                          >
                            <RadioGroupItem value={option} className="absolute h-0 w-0 opacity-0" />
                            <div
                              className={cn(
                                "border-primary/20 flex h-5 w-5 items-center justify-center rounded-full border-2 transition-all",
                                (answers[q.id] as string) === option && "border-primary",
                              )}
                            >
                              {(answers[q.id] as string) === option && (
                                <div className="bg-primary animate-in zoom-in h-2.5 w-2.5 rounded-full duration-200" />
                              )}
                            </div>
                            <span className="text-foreground/80 text-sm font-medium">{option}</span>
                          </Label>
                        ))}
                      </RadioGroup>
                    )}

                    {q.type === "CHECKBOXES" && (
                      <div className="grid grid-cols-1 gap-3">
                        {((q.options as string[]) || []).map((option) => (
                          <Label
                            key={option}
                            className={cn(
                              "border-border/60 hover:bg-accent/5 group/opt flex cursor-pointer items-center gap-4 rounded-xl border p-4 transition-all duration-200",
                              ((answers[q.id] as string[]) || []).includes(option) &&
                                "border-primary/40 bg-primary/5",
                            )}
                          >
                            <Checkbox
                              className="absolute h-0 w-0 opacity-0"
                              checked={((answers[q.id] as string[]) || []).includes(option)}
                              onCheckedChange={(checked) =>
                                handleCheckboxChange(q.id, option, checked as boolean)
                              }
                            />
                            <div
                              className={cn(
                                "border-primary/20 flex h-5 w-5 items-center justify-center rounded-md border-2 transition-all",
                                ((answers[q.id] as string[]) || []).includes(option) &&
                                  "bg-primary border-primary",
                              )}
                            >
                              {((answers[q.id] as string[]) || []).includes(option) && (
                                <Check className="text-primary-foreground animate-in zoom-in h-3.5 w-3.5 duration-200" />
                              )}
                            </div>
                            <span className="text-foreground/80 text-sm font-medium">{option}</span>
                          </Label>
                        ))}
                      </div>
                    )}

                    {q.type === "DROPDOWN" && (
                      <Select
                        onValueChange={(val) => handleInputChange(q.id, val)}
                        value={(answers[q.id] as string) || undefined}
                      >
                        <SelectTrigger className="bg-background border-border/60 focus:ring-primary h-12 w-full rounded-xl border px-4 text-sm font-medium transition-all focus:ring-1">
                          <SelectValue placeholder="Select an option" />
                        </SelectTrigger>
                        <SelectContent className="border-border/60 bg-background rounded-xl border shadow-xl">
                          {((q.options as string[]) || []).map((option) => (
                            <SelectItem
                              key={option}
                              value={option}
                              className="cursor-pointer py-3 text-sm font-medium transition-all"
                            >
                              {option}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}

                    {q.type === "VIDEO" && (
                      <div className="space-y-4">
                        {q.options?.[0] && (
                          <div className="border-border/50 bg-accent/5 flex aspect-video items-center justify-center overflow-hidden rounded-xl border">
                            {(() => {
                              const option = q.options?.[0];
                              const url = typeof option === "string" ? option : "";
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
                                    type="button"
                                    variant="outline"
                                    className="h-12 gap-2 rounded-xl"
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

                    {q.type === "IMAGE" && (
                      <div className="space-y-4">
                        {q.options?.[0] && (
                          <div className="border-border/50 bg-accent/5 relative aspect-video w-full overflow-hidden rounded-xl border">
                            {(() => {
                              const option = q.options?.[0];
                              const url = typeof option === "string" ? option : "";
                              if (!url) return null;

                              return (
                                <Image src={url} alt={q.title} fill className="object-contain" />
                              );
                            })()}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <footer className="pt-12 text-center">
            <Button
              type="submit"
              size="lg"
              className="shadow-primary/20 h-12 rounded-full px-10 text-[11px] font-black tracking-[0.15em] uppercase shadow-lg transition-all hover:scale-[1.02] hover:shadow-xl active:scale-95"
            >
              Test Submission
            </Button>
            <p className="text-muted-foreground mt-4 text-xs">
              Responses entered in preview mode are not recorded.
            </p>
          </footer>
        </form>
      </div>
    </div>
  );
}
