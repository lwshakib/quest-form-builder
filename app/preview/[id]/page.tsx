"use client";

import { useState, useEffect, useRef } from "react";
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
import {
  Loader2,
  Eye,
  Check,
  Calendar as CalendarIcon,
  Clock as ClockIcon,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { authClient } from "@/lib/auth-client";
import { ModeToggle } from "@/components/mode-toggle";

export default function PreviewQuestPage() {
  const { id } = useParams();
  const router = useRouter();

  const [quest, setQuest] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isNotFound, setIsNotFound] = useState(false);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [progress, setProgress] = useState(0);
  const [activeQuestionId, setActiveQuestionId] = useState<string | null>(null);

  const { data: session, isPending: isSessionLoading } =
    authClient.useSession();

  useEffect(() => {
    if (!quest) return;
    const relevantQuestions = quest.questions.filter(
      (q: any) => q.type !== "VIDEO" && q.type !== "IMAGE",
    );
    const requiredQuestions = relevantQuestions.filter((q: any) => q.required);

    if (requiredQuestions.length === 0) {
      const filledCount = relevantQuestions.filter((q: any) => {
        const val = answers[q.id];
        return (
          val !== undefined &&
          val !== "" &&
          (Array.isArray(val) ? val.length > 0 : true)
        );
      }).length;
      setProgress(
        relevantQuestions.length > 0
          ? (filledCount / relevantQuestions.length) * 100
          : 0,
      );
      return;
    }

    const filledRequiredCount = requiredQuestions.filter((q: any) => {
      const val = answers[q.id];
      return (
        val !== undefined &&
        val !== "" &&
        (Array.isArray(val) ? val.length > 0 : true)
      );
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

        setQuest(data);

        const initialAnswers: Record<string, any> = {};
        data.questions.forEach((q: any) => {
          if (q.type === "VIDEO" || q.type === "IMAGE") return;
          if (q.type === "CHECKBOXES") {
            initialAnswers[q.id] = [];
          } else {
            initialAnswers[q.id] = "";
          }
        });
        setAnswers(initialAnswers);
      } catch (error) {
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

  const handleInputChange = (questionId: string, value: any) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: value,
    }));
  };

  const handleCheckboxChange = (
    questionId: string,
    option: string,
    checked: boolean,
  ) => {
    setAnswers((prev) => {
      const currentAnswers = prev[questionId] || [];
      if (checked) {
        return { ...prev, [questionId]: [...currentAnswers, option] };
      } else {
        return {
          ...prev,
          [questionId]: currentAnswers.filter((a: string) => a !== option),
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
      <div className="min-h-screen bg-background py-16 px-6 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (isNotFound) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-center">
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

  return (
    <div className="min-h-screen bg-background py-16 px-6 relative overflow-x-hidden selection:bg-primary selection:text-primary-foreground">
      {/* Preview Badge */}
      <div className="fixed top-0 left-0 right-0 bg-primary/10 border-b border-primary/20 h-10 flex items-center justify-center z-[110] backdrop-blur-sm">
        <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-primary">
          <Eye className="h-3 w-3" />
          Preview Mode
        </div>
      </div>

      <div className="absolute top-14 right-6 z-[100]">
        <ModeToggle />
      </div>

      {quest?.showProgressBar && (
        <div className="fixed top-10 left-0 right-0 h-1 bg-accent/20 z-[100]">
          <div
            className="h-full bg-primary transition-all duration-1000 ease-in-out"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}

      {/* Decorative Background */}
      <div className="fixed inset-0 bg-[linear-gradient(to_right,#80808008_1px,transparent_1px),linear-gradient(to_bottom,#80808008_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none" />

      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-full h-full bg-[radial-gradient(circle_at_50%_0%,rgba(var(--primary),0.02),transparent_50%)] pointer-events-none" />

      <div className="max-w-2xl mx-auto relative space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-1000">
        <form onSubmit={handleSubmit} className="space-y-6 pb-20">
          <div className="space-y-6">
            {quest?.backgroundImageUrl && (
              <div className="relative border border-border/50 bg-background rounded-lg overflow-hidden shadow-sm h-40 sm:h-56">
                <img
                  src={quest.backgroundImageUrl}
                  alt="Quest header image"
                  className="w-full h-full object-cover"
                />
              </div>
            )}
            <div className="relative border border-border/50 bg-background rounded-lg overflow-hidden shadow-sm">
              <div className="absolute top-0 left-4 right-4 h-px bg-gradient-to-r from-transparent via-primary/5 to-transparent" />
              <div className="p-8 sm:p-10 space-y-4 relative z-10">
                <div className="space-y-2">
                  <h1 className="text-2xl sm:text-3xl font-black tracking-tight leading-tight">
                    {quest.title}
                  </h1>
                  {quest.description && (
                    <p className="text-base text-muted-foreground/70 font-medium leading-relaxed max-w-xl">
                      {quest.description}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {quest.questions.map((q: any) => (
              <div
                key={q.id}
                className={cn(
                  "relative border border-border/50 bg-background rounded-lg overflow-hidden transition-all duration-300 shadow-sm group/card",
                  activeQuestionId === q.id
                    ? "border-primary/10 ring-2 ring-primary/5 shadow-xs"
                    : "hover:border-border/60 hover:shadow-sm",
                )}
                onFocus={() => setActiveQuestionId(q.id)}
              >
                <div className="absolute top-0 left-4 right-4 h-px bg-gradient-to-r from-transparent via-primary/5 to-transparent" />
                <div className="p-6 sm:p-8 space-y-6 relative z-10">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label className="text-lg sm:text-xl font-bold tracking-tight block">
                        {q.title}
                        {q.required && (
                          <span className="text-primary ml-2 inline-block">
                            *
                          </span>
                        )}
                      </Label>
                      {q.description && (
                        <p className="text-xs text-muted-foreground/60 font-medium leading-relaxed max-w-lg">
                          {q.description}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="space-y-6">
                    {q.type === "SHORT_TEXT" && (
                      <Input
                        placeholder="Your answer..."
                        className="h-12 bg-transparent border-0 border-b border-border/60 rounded-none px-0 text-lg font-medium focus-visible:ring-0 focus-visible:border-primary transition-all placeholder:text-muted-foreground/20"
                        value={answers[q.id] || ""}
                        onChange={(e) =>
                          handleInputChange(q.id, e.target.value)
                        }
                      />
                    )}

                    {q.type === "PARAGRAPH" && (
                      <Textarea
                        placeholder="Long form response..."
                        className="min-h-[140px] bg-accent/5 border-2 border-transparent focus:border-primary/20 focus:ring-0 rounded-xl p-4 text-base font-medium transition-all placeholder:text-muted-foreground/20 resize-none leading-relaxed"
                        value={answers[q.id] || ""}
                        onChange={(e) =>
                          handleInputChange(q.id, e.target.value)
                        }
                      />
                    )}

                    {q.type === "MULTIPLE_CHOICE" && (
                      <RadioGroup
                        className="grid grid-cols-1 gap-3"
                        onValueChange={(val) => handleInputChange(q.id, val)}
                        value={answers[q.id] || ""}
                      >
                        {((q.options as string[]) || []).map((option) => (
                          <Label
                            key={option}
                            className={cn(
                              "flex items-center gap-4 p-4 border border-border/60 rounded-xl transition-all duration-200 cursor-pointer hover:bg-accent/5 group/opt",
                              answers[q.id] === option &&
                                "border-primary/40 bg-primary/5",
                            )}
                          >
                            <RadioGroupItem
                              value={option}
                              className="opacity-0 absolute w-0 h-0"
                            />
                            <div
                              className={cn(
                                "h-5 w-5 rounded-full border-2 border-primary/20 flex items-center justify-center transition-all",
                                answers[q.id] === option && "border-primary",
                              )}
                            >
                              {answers[q.id] === option && (
                                <div className="h-2.5 w-2.5 bg-primary rounded-full animate-in zoom-in duration-200" />
                              )}
                            </div>
                            <span className="text-sm font-medium text-foreground/80">
                              {option}
                            </span>
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
                              "flex items-center gap-4 p-4 border border-border/60 rounded-xl transition-all duration-200 cursor-pointer hover:bg-accent/5 group/opt",
                              (answers[q.id] || []).includes(option) &&
                                "border-primary/40 bg-primary/5",
                            )}
                          >
                            <Checkbox
                              className="opacity-0 absolute w-0 h-0"
                              checked={(answers[q.id] || []).includes(option)}
                              onCheckedChange={(checked) =>
                                handleCheckboxChange(
                                  q.id,
                                  option,
                                  checked as boolean,
                                )
                              }
                            />
                            <div
                              className={cn(
                                "h-5 w-5 rounded-md border-2 border-primary/20 flex items-center justify-center transition-all",
                                (answers[q.id] || []).includes(option) &&
                                  "bg-primary border-primary",
                              )}
                            >
                              {(answers[q.id] || []).includes(option) && (
                                <Check className="h-3.5 w-3.5 text-primary-foreground animate-in zoom-in duration-200" />
                              )}
                            </div>
                            <span className="text-sm font-medium text-foreground/80">
                              {option}
                            </span>
                          </Label>
                        ))}
                      </div>
                    )}

                    {q.type === "DROPDOWN" && (
                      <Select
                        onValueChange={(val) => handleInputChange(q.id, val)}
                        value={answers[q.id] || undefined}
                      >
                        <SelectTrigger className="w-full h-12 bg-background border border-border/60 rounded-xl px-4 text-sm font-medium focus:ring-1 focus:ring-primary transition-all">
                          <SelectValue placeholder="Select an option" />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl border border-border/60 bg-background shadow-xl">
                          {((q.options as string[]) || []).map((option) => (
                            <SelectItem
                              key={option}
                              value={option}
                              className="py-3 text-sm font-medium transition-all cursor-pointer"
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
                          <div className="rounded-xl overflow-hidden border border-border/50 bg-accent/5 aspect-video flex items-center justify-center">
                            {(() => {
                              const url = q.options[0];
                              if (
                                url.includes("youtube.com/watch") ||
                                url.includes("youtu.be/")
                              ) {
                                let videoId = "";
                                if (url.includes("youtube.com/watch")) {
                                  videoId =
                                    new URL(url).searchParams.get("v") || "";
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
                              } else if (
                                url.match(/\.(mp4|webm|ogg)$/i) ||
                                url.includes("video")
                              ) {
                                return (
                                  <video controls className="w-full h-full">
                                    <source src={url} type="video/mp4" />
                                    Your browser does not support the video tag.
                                  </video>
                                );
                              } else {
                                return (
                                  <Button
                                    type="button"
                                    variant="outline"
                                    className="gap-2 h-12 rounded-xl"
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
                          <div className="rounded-xl overflow-hidden border border-border/50 bg-accent/5 flex items-center justify-center">
                            <img
                              src={q.options[0]}
                              alt={q.title}
                              className="max-w-full h-auto object-contain"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src =
                                  "https://placehold.co/600x400?text=Image+Unavailable";
                              }}
                            />
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
              className="h-12 px-10 rounded-full font-black uppercase tracking-[0.15em] text-[11px] shadow-lg shadow-primary/20 hover:shadow-xl hover:scale-[1.02] active:scale-95 transition-all"
            >
              Test Submission
            </Button>
            <p className="mt-4 text-xs text-muted-foreground">
              Responses entered in preview mode are not recorded.
            </p>
          </footer>
        </form>
      </div>
    </div>
  );
}
