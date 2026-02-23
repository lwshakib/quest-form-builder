"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { getPublicQuest, submitResponse } from "@/lib/actions";
import Image from "next/image";
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
import { Loader2, CheckCircle2, Send, Check } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Logo } from "@/components/logo";
import { ModeToggle } from "@/components/mode-toggle";
import { authClient } from "@/lib/auth-client";

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
  limitToOneResponse: boolean;
  showProgressBar: boolean;
  showLinkToSubmitAnother: boolean;
  viewResultsSummary: boolean;
  confirmationMessage: string | null;
  shuffleQuestionOrder: boolean;
  questions: Question[];
}

export default function ShareQuestPage() {
  const { id } = useParams();
  const router = useRouter();

  const searchParams = useSearchParams();

  const [quest, setQuest] = useState<Quest | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted] = useState(searchParams.get("submitted") === "true");
  const [isNotFound, setIsNotFound] = useState(false);
  const [answers, setAnswers] = useState<Record<string, unknown>>({});
  const [progress, setProgress] = useState(0);
  const [isFormValid, setIsFormValid] = useState(false);
  const [activeQuestionId, setActiveQuestionId] = useState<string | null>(null);

  const { data: session, isPending: isSessionLoading } = authClient.useSession();

  useEffect(() => {
    if (!quest) return;
    const relevantQuestions = quest.questions.filter(
      (q: Question) => q.type !== "VIDEO" && q.type !== "IMAGE",
    );
    const requiredQuestions = relevantQuestions.filter((q: Question) => q.required);

    const isQuestionFilled = (qId: string) => {
      const val = answers[qId];
      if (val === undefined || val === null) return false;
      if (typeof val === "string") return val.trim() !== "";
      if (Array.isArray(val)) return val.length > 0;
      return true;
    };

    if (requiredQuestions.length === 0) {
      const filledCount = relevantQuestions.filter((q: Question) => isQuestionFilled(q.id)).length;
      setProgress(
        relevantQuestions.length > 0 ? (filledCount / relevantQuestions.length) * 100 : 0,
      );
      setIsFormValid(true); // Always valid if nothing is required
      return;
    }

    const filledRequiredCount = requiredQuestions.filter((q: Question) =>
      isQuestionFilled(q.id),
    ).length;
    setProgress((filledRequiredCount / requiredQuestions.length) * 100);
    setIsFormValid(filledRequiredCount === requiredQuestions.length);
  }, [answers, quest]);

  const startTime = useRef<number>(Date.now());

  useEffect(() => {
    async function loadQuest() {
      try {
        const data = await getPublicQuest(id as string);
        if (!data) {
          setIsNotFound(true);
          return;
        }
        // Shuffle questions if setting is enabled
        let questionsToUse = [...data.questions];
        if (data.shuffleQuestionOrder) {
          questionsToUse = questionsToUse.sort(() => Math.random() - 0.5);
        }

        setQuest({ ...data, questions: questionsToUse as unknown as Question[] } as Quest);
        startTime.current = Date.now();

        const initialAnswers: Record<string, unknown> = {};
        (questionsToUse as Question[]).forEach((q) => {
          if (q.type === "VIDEO" || q.type === "IMAGE") return;
          if (q.type === "CHECKBOXES") {
            initialAnswers[q.id] = [];
          } else {
            initialAnswers[q.id] = "";
          }
        });
        setAnswers(initialAnswers);
      } catch {
        toast.error("Failed to load quest");
      } finally {
        setIsLoading(false);
      }
    }
    loadQuest();
  }, [id, router]);

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
          [questionId]: currentAnswers.filter((a: string) => a !== option),
        };
      }
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const duration = Math.floor((Date.now() - startTime.current) / 1000);
      await submitResponse(id as string, answers, duration);
      // Redirect to the same page with a query param to show success state
      // This pattern prevents form resubmission on refresh
      window.location.replace(`${window.location.pathname}?submitted=true`);
    } catch {
      toast.error("Failed to submit response. The form might be closed.");
      setIsSubmitting(false);
    }
  };

  const handleClear = () => {
    const initialAnswers: Record<string, unknown> = {};
    if (quest) {
      quest.questions.forEach((q: Question) => {
        if (q.type === "VIDEO" || q.type === "IMAGE") return;
        if (q.type === "CHECKBOXES") {
          initialAnswers[q.id] = [];
        } else {
          initialAnswers[q.id] = "";
        }
      });
    }
    setAnswers(initialAnswers);
    toast.success("Quest cleared");
  };

  useEffect(() => {
    if (quest?.title) {
      document.title = `${quest.title} | Quest`;
    }
  }, [quest]);

  if (isLoading || (quest?.limitToOneResponse && isSessionLoading)) {
    return (
      <div className="bg-background relative min-h-screen overflow-x-hidden px-6 py-16">
        <div className="mx-auto max-w-2xl space-y-12">
          <div className="space-y-6">
            <div className="bg-accent/30 border-border/50 h-40 w-full animate-pulse rounded-lg border" />
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="bg-accent/30 border-border/50 h-64 w-full animate-pulse rounded-lg border"
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (quest?.limitToOneResponse && !session) {
    return (
      <div className="bg-background flex min-h-screen flex-col items-center justify-center p-6 text-center">
        <div className="pointer-events-none fixed inset-0 bg-[linear-gradient(to_right,#80808008_1px,transparent_1px),linear-gradient(to_bottom,#80808008_1px,transparent_1px)] bg-[size:40px_40px]" />
        <div className="animate-in fade-in zoom-in relative max-w-md space-y-8 duration-500">
          <div className="bg-primary/10 mx-auto mb-8 flex h-20 w-20 items-center justify-center rounded-3xl">
            <Send className="text-primary h-10 w-10" />
          </div>
          <h1 className="text-4xl font-black tracking-tight">Sign in to continue</h1>
          <p className="text-muted-foreground text-lg leading-relaxed font-medium">
            This quest requires you to be signed in to submit a response. This helps prevent
            multiple entries from the same person.
          </p>
          <div className="pt-8">
            <Button
              size="lg"
              className="shadow-primary/20 h-14 rounded-full px-10 font-black shadow-xl transition-all hover:scale-105"
              onClick={() => authClient.signIn.social({ provider: "google" })}
            >
              Sign in to the Quest
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (isNotFound) {
    return (
      <div className="bg-background flex min-h-screen flex-col items-center justify-center p-6 text-center">
        <div className="pointer-events-none fixed inset-0 bg-[linear-gradient(to_right,#80808008_1px,transparent_1px),linear-gradient(to_bottom,#80808008_1px,transparent_1px)] bg-[size:40px_40px]" />
        <div className="animate-in fade-in zoom-in relative max-w-md space-y-6 duration-500">
          <div className="bg-muted/50 mx-auto mb-8 flex h-20 w-20 items-center justify-center rounded-3xl">
            <div className="border-muted-foreground/20 border-t-muted-foreground/40 h-10 w-10 rounded-full border-4" />
          </div>
          <h1 className="text-4xl font-bold tracking-tight">Quest Not Available</h1>
          <p className="text-muted-foreground text-lg leading-relaxed font-medium">
            This quest doesn&apos;t exist, is no longer accepting responses, or has been unpublished
            by Creator.
          </p>
          <div className="pt-8">
            <Button
              variant="outline"
              className="hover:bg-muted h-12 rounded-full px-8 font-bold transition-all"
              onClick={() => router.push("/")}
            >
              Go home
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (isSubmitted) {
    return (
      <div className="bg-background flex min-h-screen flex-col items-center justify-center overflow-hidden p-6 text-center select-none">
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className="bg-primary/20 absolute h-2 w-2 animate-pulse rounded-full"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 5}s`,
                transform: `scale(${Math.random() * 2})`,
              }}
            />
          ))}
        </div>

        <div className="pointer-events-none fixed inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] bg-[size:40px_40px]" />

        <div className="animate-in fade-in zoom-in relative max-w-xl space-y-12 duration-1000">
          <div className="relative mx-auto">
            <div className="absolute inset-0 animate-pulse rounded-full bg-green-500/30 blur-3xl" />
            <div className="bg-background relative mx-auto flex h-24 w-24 items-center justify-center rounded-full border border-green-500/20 shadow-[0_0_40px_-12px_rgba(34,197,94,0.2)]">
              <CheckCircle2 className="animate-in zoom-in spin-in h-12 w-12 text-green-500 delay-300 duration-700" />
            </div>
          </div>

          <div className="space-y-4">
            <h1 className="text-foreground text-5xl font-bold tracking-tight sm:text-6xl">
              Response submitted
            </h1>
            <p className="text-muted-foreground/80 mx-auto max-w-sm text-lg leading-relaxed font-medium">
              {quest?.confirmationMessage ||
                "Your transmission was successful. Thank you for your time."}
            </p>
          </div>

          <div className="flex flex-col items-center gap-4">
            {quest?.showLinkToSubmitAnother && (
              <Button
                size="lg"
                className="shadow-primary/10 h-12 rounded-full px-8 font-bold shadow-lg transition-all hover:shadow-xl"
                onClick={() => (window.location.href = window.location.pathname)}
              >
                Submit another response
              </Button>
            )}

            {quest?.viewResultsSummary && (
              <Button
                variant="link"
                className="text-primary font-bold"
                onClick={() => toast.info("Results summary feature coming soon!")}
              >
                View previous responses
              </Button>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (!quest) return null;

  return (
    <div className="bg-background selection:bg-primary selection:text-primary-foreground relative min-h-screen overflow-x-hidden px-6 py-16">
      {/* Theme Toggle */}
      <div className="absolute top-6 right-6 z-[100]">
        <ModeToggle />
      </div>

      {/* Refined Progress Bar */}
      {quest?.showProgressBar && (
        <div className="bg-accent/20 fixed top-0 right-0 left-0 z-[100] h-1">
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
            {/* Catchy Title & Description Card (Matches Editor's Welcome Card) */}
            <div className="border-border/50 bg-background relative overflow-hidden rounded-lg border shadow-sm transition-all duration-300">
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
                onFocus={() => setActiveQuestionId(q.id)}
                className={cn(
                  "border-border/50 bg-background group/card relative overflow-hidden rounded-lg border shadow-sm transition-all duration-300",
                  activeQuestionId === q.id
                    ? "border-primary/10 ring-primary/5 shadow-xs ring-2"
                    : "hover:border-border/60 hover:shadow-sm",
                )}
              >
                {/* Subtle top highlight */}
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
                      <div className="relative">
                        <Input
                          required={q.required}
                          placeholder="Your answer..."
                          className="border-border/60 focus-visible:border-primary placeholder:text-muted-foreground/20 h-12 rounded-none border-0 border-b bg-transparent px-0 text-lg font-medium transition-all focus-visible:ring-0"
                          value={(answers[q.id] as string) || ""}
                          onChange={(e) => handleInputChange(q.id, e.target.value)}
                        />
                      </div>
                    )}

                    {q.type === "PARAGRAPH" && (
                      <Textarea
                        required={q.required}
                        placeholder="Long form response..."
                        className="bg-accent/5 focus:border-primary/20 placeholder:text-muted-foreground/20 min-h-[140px] resize-none rounded-xl border-2 border-transparent p-4 text-base leading-relaxed font-medium transition-all focus:ring-0"
                        value={(answers[q.id] as string) || ""}
                        onChange={(e) => handleInputChange(q.id, e.target.value)}
                      />
                    )}

                    {q.type === "MULTIPLE_CHOICE" && (
                      <RadioGroup
                        required={q.required}
                        className="grid grid-cols-1 gap-3"
                        onValueChange={(val) => handleInputChange(q.id, val)}
                        value={(answers[q.id] as string) || ""}
                      >
                        {((q.options as (string | { value: string; image?: string })[]) || []).map(
                          (option) => {
                            const isComplex = typeof option === "object" && option !== null;
                            const label = isComplex ? option.value : (option as string);
                            const image = isComplex ? option.image : null;

                            return (
                              <Label
                                key={label}
                                htmlFor={`${q.id}-${label}`}
                                className={cn(
                                  "border-border/60 hover:bg-accent/5 group/opt flex w-full cursor-pointer flex-col items-start overflow-hidden rounded-xl border transition-all duration-200",
                                  answers[q.id] === label && "border-primary/40 bg-primary/5",
                                )}
                              >
                                {image && (
                                  <div className="bg-accent/5 border-border/40 relative aspect-video w-full overflow-hidden border-b">
                                    <Image
                                      src={image}
                                      alt={label}
                                      fill
                                      className="object-contain transition-transform duration-500 hover:scale-105"
                                    />
                                  </div>
                                )}
                                <div className="flex w-full items-start gap-4 p-4">
                                  <RadioGroupItem
                                    value={label}
                                    id={`${q.id}-${label}`}
                                    className="absolute h-0 w-0 opacity-0"
                                  />
                                  <div
                                    className={cn(
                                      "border-primary/20 mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-all",
                                      answers[q.id] === label && "border-primary",
                                    )}
                                  >
                                    {answers[q.id] === label && (
                                      <div className="bg-primary animate-in zoom-in h-2.5 w-2.5 rounded-full duration-200" />
                                    )}
                                  </div>
                                  <span className="text-foreground/80 text-left text-sm leading-relaxed font-medium">
                                    {label}
                                  </span>
                                </div>
                              </Label>
                            );
                          },
                        )}
                      </RadioGroup>
                    )}

                    {q.type === "CHECKBOXES" && (
                      <div className="grid grid-cols-1 gap-3">
                        {((q.options as (string | { value: string; image?: string })[]) || []).map(
                          (option) => {
                            const isComplex = typeof option === "object" && option !== null;
                            const label = isComplex ? option.value : (option as string);
                            const image = isComplex ? option.image : null;
                            const isChecked = ((answers[q.id] as string[]) || []).includes(label);

                            return (
                              <Label
                                key={label}
                                htmlFor={`${q.id}-${label}`}
                                className={cn(
                                  "border-border/60 hover:bg-accent/5 group/opt flex w-full cursor-pointer flex-col items-start overflow-hidden rounded-xl border transition-all duration-200",
                                  isChecked && "border-primary/40 bg-primary/5",
                                )}
                              >
                                {image && (
                                  <div className="border-border/40 bg-accent/5 relative aspect-video w-full overflow-hidden border-b">
                                    <Image src={image} alt={label} fill className="object-cover" />
                                  </div>
                                )}
                                <div className="flex w-full items-start gap-4 p-4">
                                  <Checkbox
                                    id={`${q.id}-${label}`}
                                    className="absolute h-0 w-0 opacity-0"
                                    checked={isChecked}
                                    onCheckedChange={(checked) =>
                                      handleCheckboxChange(q.id, label, checked as boolean)
                                    }
                                  />
                                  <div
                                    className={cn(
                                      "border-primary/20 mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border-2 transition-all",
                                      isChecked && "bg-primary border-primary",
                                    )}
                                  >
                                    {isChecked && (
                                      <Check className="text-primary-foreground animate-in zoom-in h-3.5 w-3.5 duration-200" />
                                    )}
                                  </div>
                                  <span className="text-foreground/80 text-left text-sm leading-relaxed font-medium">
                                    {label}
                                  </span>
                                </div>
                              </Label>
                            );
                          },
                        )}
                      </div>
                    )}

                    {q.type === "DROPDOWN" && (
                      <Select
                        onValueChange={(val) => handleInputChange(q.id, val)}
                        required={q.required}
                        value={(answers[q.id] as string) || undefined}
                      >
                        <SelectTrigger className="bg-background border-border/60 focus:ring-primary h-12 w-full rounded-xl border px-4 text-base font-medium transition-all focus:ring-1">
                          <SelectValue placeholder="Select an option" />
                        </SelectTrigger>
                        <SelectContent className="border-border/60 bg-background rounded-xl border shadow-xl">
                          {(
                            (q.options as (string | { value: string; image?: string })[]) || []
                          ).map((option) => {
                            const label =
                              typeof option === "object" && option !== null
                                ? option.value
                                : (option as string);
                            return (
                              <SelectItem
                                key={label}
                                value={label}
                                className="cursor-pointer py-3 text-base font-medium transition-all"
                              >
                                {label}
                              </SelectItem>
                            );
                          })}
                        </SelectContent>
                      </Select>
                    )}

                    {q.type === "DATE" && (
                      <Input
                        type="date"
                        required={q.required}
                        className="bg-accent/5 border-border/60 focus-visible:ring-primary h-12 rounded-xl border px-4 text-base font-medium transition-all focus-visible:ring-1"
                        onChange={(e) => handleInputChange(q.id, e.target.value)}
                        value={(answers[q.id] as string) || ""}
                      />
                    )}

                    {q.type === "TIME" && (
                      <Input
                        type="time"
                        required={q.required}
                        className="bg-accent/5 border-border/60 focus-visible:ring-primary h-12 rounded-xl border px-4 text-base font-medium transition-all focus-visible:ring-1"
                        onChange={(e) => handleInputChange(q.id, e.target.value)}
                        value={(answers[q.id] as string) || ""}
                      />
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

          <footer className="space-y-16 pt-12">
            <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
              <Button
                type="submit"
                size="lg"
                disabled={isSubmitting || !isFormValid}
                className="shadow-primary/20 order-2 h-12 w-full rounded-full px-10 text-[11px] font-black tracking-[0.15em] uppercase shadow-lg transition-all hover:scale-[1.02] hover:shadow-xl active:scale-95 disabled:cursor-not-allowed disabled:opacity-70 disabled:hover:scale-100 sm:order-1 sm:w-auto"
              >
                {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Submit response"}
              </Button>

              <Button
                type="button"
                variant="ghost"
                onClick={handleClear}
                className="text-muted-foreground hover:bg-destructive/5 hover:text-destructive order-1 h-12 w-full rounded-full px-8 font-semibold transition-all sm:order-2 sm:w-auto"
              >
                Clear form
              </Button>
            </div>

            <div className="border-border/40 space-y-8 border-t pt-8">
              <div className="flex flex-col items-center gap-6 text-center">
                <p className="text-muted-foreground/40 text-xs font-medium">
                  Never submit passwords through Quest
                </p>

                <div className="flex items-center gap-2 opacity-30 transition-opacity hover:opacity-100">
                  <Logo />
                </div>
              </div>
            </div>
          </footer>
        </form>
      </div>
    </div>
  );
}
