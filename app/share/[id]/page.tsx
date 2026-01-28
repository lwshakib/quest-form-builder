'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { getPublicQuest, submitResponse } from '@/lib/actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { 
  Loader2, 
  CheckCircle2, 
  Send,
  Check,
  Calendar as CalendarIcon,
  Clock as ClockIcon
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { Logo } from '@/components/logo';
import { ModeToggle } from '@/components/mode-toggle';
import { authClient } from "@/lib/auth-client";

export default function ShareQuestPage() {
  const { id } = useParams();
  const router = useRouter();
  
  const searchParams = useSearchParams();
  
  const [quest, setQuest] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(searchParams.get('submitted') === 'true');
  const [isNotFound, setIsNotFound] = useState(false);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [progress, setProgress] = useState(0);
  const [activeQuestionId, setActiveQuestionId] = useState<string | null>(null);
  
  const { data: session, isPending: isSessionLoading } = authClient.useSession();

  useEffect(() => {
    if (!quest) return;
    const relevantQuestions = quest.questions.filter((q: any) => q.type !== 'VIDEO' && q.type !== 'IMAGE');
    const requiredQuestions = relevantQuestions.filter((q: any) => q.required);
    
    if (requiredQuestions.length === 0) {
      const filledCount = relevantQuestions.filter((q: any) => {
        const val = answers[q.id];
        return val !== undefined && val !== '' && (Array.isArray(val) ? val.length > 0 : true);
      }).length;
      setProgress(relevantQuestions.length > 0 ? (filledCount / relevantQuestions.length) * 100 : 0);
      return;
    }
    
    const filledRequiredCount = requiredQuestions.filter((q: any) => {
      const val = answers[q.id];
      return val !== undefined && val !== '' && (Array.isArray(val) ? val.length > 0 : true);
    }).length;
    setProgress((filledRequiredCount / requiredQuestions.length) * 100);
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
        
        setQuest({ ...data, questions: questionsToUse });
        startTime.current = Date.now();
        
        const initialAnswers: Record<string, any> = {};
        questionsToUse.forEach((q: any) => {
          if (q.type === 'VIDEO' || q.type === 'IMAGE') return;
          if (q.type === 'CHECKBOXES') {
            initialAnswers[q.id] = [];
          } else {
            initialAnswers[q.id] = '';
          }
        });
        setAnswers(initialAnswers);
      } catch (error) {
        toast.error("Failed to load quest");
      } finally {
        setIsLoading(false);
      }
    }
    loadQuest();
  }, [id, router]);

  const handleInputChange = (questionId: string, value: any) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: value
    }));
  };

  const handleCheckboxChange = (questionId: string, option: string, checked: boolean) => {
    setAnswers(prev => {
      const currentAnswers = prev[questionId] || [];
      if (checked) {
        return { ...prev, [questionId]: [...currentAnswers, option] };
      } else {
        return { ...prev, [questionId]: currentAnswers.filter((a: string) => a !== option) };
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
    } catch (error) {
      toast.error("Failed to submit response. The form might be closed.");
      setIsSubmitting(false);
    }
  };

  const handleClear = () => {
    const initialAnswers: Record<string, any> = {};
    quest.questions.forEach((q: any) => {
      if (q.type === 'VIDEO' || q.type === 'IMAGE') return;
      if (q.type === 'CHECKBOXES') {
        initialAnswers[q.id] = [];
      } else {
        initialAnswers[q.id] = '';
      }
    });
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
      <div className="min-h-screen bg-background py-16 px-6 relative overflow-x-hidden">
        <div className="max-w-2xl mx-auto space-y-12">
           <div className="space-y-6">
            <div className="h-40 bg-accent/30 rounded-lg animate-pulse w-full border border-border/50" />
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-64 bg-accent/30 rounded-lg animate-pulse w-full border border-border/50" />
            ))}
           </div>
        </div>
      </div>
    );
  }

  if (quest?.limitToOneResponse && !session) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-center">
        <div className="fixed inset-0 bg-[linear-gradient(to_right,#80808008_1px,transparent_1px),linear-gradient(to_bottom,#80808008_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none" />
        <div className="relative space-y-8 max-w-md animate-in fade-in zoom-in duration-500">
          <div className="h-20 w-20 mx-auto rounded-3xl bg-primary/10 flex items-center justify-center mb-8">
            <Send className="h-10 w-10 text-primary" />
          </div>
          <h1 className="text-4xl font-black tracking-tight">Sign in to continue</h1>
          <p className="text-muted-foreground font-medium text-lg leading-relaxed">
            This quest requires you to be signed in to submit a response. This helps prevent multiple entries from the same person.
          </p>
          <div className="pt-8">
            <Button 
              size="lg"
              className="px-10 h-14 rounded-full font-black shadow-xl shadow-primary/20 transition-all hover:scale-105"
              onClick={() => authClient.signIn.social({ provider: 'google' })}
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
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-center">
        <div className="fixed inset-0 bg-[linear-gradient(to_right,#80808008_1px,transparent_1px),linear-gradient(to_bottom,#80808008_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none" />
        <div className="relative space-y-6 max-w-md animate-in fade-in zoom-in duration-500">
          <div className="h-20 w-20 mx-auto rounded-3xl bg-muted/50 flex items-center justify-center mb-8">
            <div className="h-10 w-10 border-4 border-muted-foreground/20 border-t-muted-foreground/40 rounded-full" />
          </div>
          <h1 className="text-4xl font-bold tracking-tight">Quest Not Available</h1>
          <p className="text-muted-foreground font-medium text-lg leading-relaxed">
            This quest doesn't exist, is no longer accepting responses, or has been unpublished by the creator.
          </p>
          <div className="pt-8">
            <Button 
              variant="outline" 
              className="px-8 h-12 rounded-full font-bold transition-all hover:bg-muted"
              onClick={() => router.push('/')}
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
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-center select-none overflow-hidden">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {[...Array(20)].map((_, i) => (
            <div 
              key={i} 
              className="absolute h-2 w-2 bg-primary/20 rounded-full animate-pulse"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 5}s`,
                transform: `scale(${Math.random() * 2})`
              }}
            />
          ))}
        </div>

        <div className="fixed inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none" />
        
        <div className="relative space-y-12 max-w-xl animate-in fade-in zoom-in duration-1000">
          <div className="relative mx-auto">
            <div className="absolute inset-0 blur-3xl bg-green-500/30 rounded-full animate-pulse" />
            <div className="relative h-24 w-24 mx-auto rounded-full bg-background border border-green-500/20 flex items-center justify-center shadow-[0_0_40px_-12px_rgba(34,197,94,0.2)]">
              <CheckCircle2 className="h-12 w-12 text-green-500 animate-in zoom-in spin-in duration-700 delay-300" />
            </div>
          </div>
          
          <div className="space-y-4">
            <h1 className="text-5xl sm:text-6xl font-bold tracking-tight text-foreground">
              Response submitted
            </h1>
            <p className="text-muted-foreground/80 font-medium text-lg leading-relaxed max-w-sm mx-auto">
              {quest?.confirmationMessage || "Your transmission was successful. Thank you for your time."}
            </p>
          </div>

          <div className="flex flex-col items-center gap-4">
            {quest?.showLinkToSubmitAnother && (
              <Button 
                size="lg"
                className="h-12 px-8 rounded-full font-bold shadow-lg shadow-primary/10 hover:shadow-xl transition-all"
                onClick={() => window.location.href = window.location.pathname}
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

  return (
    <div className="min-h-screen bg-background py-16 px-6 relative overflow-x-hidden selection:bg-primary selection:text-primary-foreground">
      {/* Theme Toggle */}
      <div className="absolute top-6 right-6 z-[100]">
         <ModeToggle />
      </div>

      {/* Refined Progress Bar */}
      {quest?.showProgressBar && (
        <div className="fixed top-0 left-0 right-0 h-1 bg-accent/20 z-[100]">
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
            {/* Catchy Title & Description Card (Matches Editor's Welcome Card) */}
            <div className="relative border border-border/50 bg-background rounded-lg overflow-hidden transition-all duration-300 shadow-sm">
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
                onFocus={() => setActiveQuestionId(q.id)}
                className={cn(
                  "relative border border-border/50 bg-background rounded-lg overflow-hidden transition-all duration-300 shadow-sm group/card",
                  activeQuestionId === q.id ? "border-primary/10 ring-2 ring-primary/5 shadow-xs" : "hover:border-border/60 hover:shadow-sm"
                )}
              >
                {/* Subtle top highlight */}
                <div className="absolute top-0 left-4 right-4 h-px bg-gradient-to-r from-transparent via-primary/5 to-transparent" />
                
                <div className="p-6 sm:p-8 space-y-6 relative z-10">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label className="text-lg sm:text-xl font-bold tracking-tight block">
                        {q.title}
                        {q.required && (
                          <span className="text-primary ml-2 inline-block">*</span>
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
                    {q.type === 'SHORT_TEXT' && (
                      <div className="relative">
                        <Input 
                          required={q.required}
                          placeholder="Your answer..."
                          className="h-12 bg-transparent border-0 border-b border-border/60 rounded-none px-0 text-lg font-medium focus-visible:ring-0 focus-visible:border-primary transition-all placeholder:text-muted-foreground/20"
                          value={answers[q.id] || ''}
                          onChange={(e) => handleInputChange(q.id, e.target.value)}
                        />
                      </div>
                    )}

                    {q.type === 'PARAGRAPH' && (
                      <Textarea 
                        required={q.required}
                        placeholder="Long form response..."
                        className="min-h-[140px] bg-accent/5 border-2 border-transparent focus:border-primary/20 focus:ring-0 rounded-xl p-4 text-base font-medium transition-all placeholder:text-muted-foreground/20 resize-none leading-relaxed"
                        value={answers[q.id] || ''}
                        onChange={(e) => handleInputChange(q.id, e.target.value)}
                      />
                    )}

                    {q.type === 'MULTIPLE_CHOICE' && (
                      <RadioGroup 
                        required={q.required}
                        className="grid grid-cols-1 gap-3"
                        onValueChange={(val) => handleInputChange(q.id, val)}
                        value={answers[q.id] || ''}
                      >
                        {(q.options as any[] || []).map((option: any) => {
                          const isComplex = typeof option === 'object' && option !== null;
                          const label = isComplex ? option.value : option;
                          const image = isComplex ? option.image : null;
                          
                          return (
                          <Label 
                            key={label} 
                            htmlFor={`${q.id}-${label}`}
                            className={cn(
                              "flex flex-col border border-border/60 rounded-xl transition-all duration-200 cursor-pointer hover:bg-accent/5 group/opt overflow-hidden",
                              answers[q.id] === label && "border-primary/40 bg-primary/5"
                            )}
                          >
                             {image && (
                               <div className="w-full bg-accent/5 border-b border-border/40 relative flex justify-center overflow-hidden">
                                  <img src={image} alt={label} className="w-full max-h-[400px] object-contain transition-transform duration-500 hover:scale-105" />
                               </div>
                             )}
                             <div className="flex items-center gap-4 p-4">
                                <RadioGroupItem 
                                  value={label} 
                                  id={`${q.id}-${label}`} 
                                  className="opacity-0 absolute w-0 h-0" 
                                />
                                <div className={cn(
                                  "h-5 w-5 rounded-full border-2 border-primary/20 flex items-center justify-center transition-all shrink-0",
                                  answers[q.id] === label && "border-primary"
                                )}>
                                  {answers[q.id] === label && <div className="h-2.5 w-2.5 bg-primary rounded-full animate-in zoom-in duration-200" />}
                                </div>
                                <span className="text-sm font-medium text-foreground/80">{label}</span>
                             </div>
                          </Label>
                        )})}
                      </RadioGroup>
                    )}

                    {q.type === 'CHECKBOXES' && (
                      <div className="grid grid-cols-1 gap-3">
                        {(q.options as any[] || []).map((option: any) => {
                          const isComplex = typeof option === 'object' && option !== null;
                          const label = isComplex ? option.value : option;
                          const image = isComplex ? option.image : null;
                          const isChecked = (answers[q.id] || []).includes(label);

                          return (
                          <Label 
                            key={label} 
                            htmlFor={`${q.id}-${label}`}
                            className={cn(
                              "flex flex-col border border-border/60 rounded-xl transition-all duration-200 cursor-pointer hover:bg-accent/5 group/opt overflow-hidden",
                              isChecked && "border-primary/40 bg-primary/5"
                            )}
                          >
                            {image && (
                               <div className="w-full h-48 bg-accent/5 border-b border-border/40 relative">
                                  <img src={image} alt={label} className="w-full h-full object-cover" />
                               </div>
                             )}
                            <div className="flex items-center gap-4 p-4">
                                <Checkbox 
                                  id={`${q.id}-${label}`} 
                                  className="opacity-0 absolute w-0 h-0"
                                  checked={isChecked}
                                  onCheckedChange={(checked) => handleCheckboxChange(q.id, label, checked as boolean)}
                                />
                                 <div className={cn(
                                  "h-5 w-5 rounded-md border-2 border-primary/20 flex items-center justify-center transition-all shrink-0",
                                  isChecked && "bg-primary border-primary"
                                )}>
                                  {isChecked && <Check className="h-3.5 w-3.5 text-primary-foreground animate-in zoom-in duration-200" />}
                                </div>
                                <span className="text-sm font-medium text-foreground/80">{label}</span>
                            </div>
                          </Label>
                        )})}
                      </div>
                    )}

                    {q.type === 'DROPDOWN' && (
                      <Select 
                        onValueChange={(val) => handleInputChange(q.id, val)} 
                        required={q.required}
                        value={answers[q.id] || undefined}
                      >
                        <SelectTrigger className="w-full h-12 bg-background border border-border/60 rounded-xl px-4 text-base font-medium focus:ring-1 focus:ring-primary transition-all">
                          <SelectValue placeholder="Select an option" />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl border border-border/60 bg-background shadow-xl">
                          {(q.options as any[] || []).map((option: any) => {
                             const label = typeof option === 'object' && option !== null ? option.value : option;
                             return (
                            <SelectItem key={label} value={label} className="py-3 text-base font-medium transition-all cursor-pointer">
                              {label}
                            </SelectItem>
                          )})}
                        </SelectContent>
                      </Select>
                    )}

                    {q.type === 'DATE' && (
                      <Input 
                        type="date"
                        required={q.required}
                        className="h-12 bg-accent/5 border border-border/60 focus-visible:ring-1 focus-visible:ring-primary rounded-xl px-4 text-base font-medium transition-all"
                        onChange={(e) => handleInputChange(q.id, e.target.value)}
                        value={answers[q.id] || ''}
                      />
                    )}

                    {q.type === 'TIME' && (
                      <Input 
                        type="time"
                        required={q.required}
                        className="h-12 bg-accent/5 border border-border/60 focus-visible:ring-1 focus-visible:ring-primary rounded-xl px-4 text-base font-medium transition-all"
                        onChange={(e) => handleInputChange(q.id, e.target.value)}
                        value={answers[q.id] || ''}
                      />
                    )}

                    {q.type === 'VIDEO' && (
                      <div className="space-y-4">
                        {q.options?.[0] && (
                          <div className="rounded-xl overflow-hidden border border-border/50 bg-accent/5 aspect-video flex items-center justify-center">
                            {(() => {
                              const url = q.options[0];
                              if (url.includes('youtube.com/watch') || url.includes('youtu.be/')) {
                                let videoId = '';
                                if (url.includes('youtube.com/watch')) {
                                  videoId = new URL(url).searchParams.get('v') || '';
                                } else {
                                  videoId = url.split('/').pop() || '';
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
                              } else if (url.match(/\.(mp4|webm|ogg)$/i) || url.includes('video')) {
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
                                    onClick={() => window.open(url, '_blank')}
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

                    {q.type === 'IMAGE' && (
                      <div className="space-y-4">
                        {q.options?.[0] && (
                          <div className="rounded-xl overflow-hidden border border-border/50 bg-accent/5 flex items-center justify-center">
                            <img
                              src={q.options[0]}
                              alt={q.title}
                              className="max-w-full h-auto object-contain"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = "https://placehold.co/600x400?text=Image+Unavailable";
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

          <footer className="pt-12 space-y-16">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <Button 
                type="submit" 
                size="lg" 
                disabled={isSubmitting}
                className="h-12 px-10 rounded-full font-black uppercase tracking-[0.15em] text-[11px] shadow-lg shadow-primary/20 hover:shadow-xl hover:scale-[1.02] active:scale-95 transition-all order-2 sm:order-1 w-full sm:w-auto"
              >
                {isSubmitting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "Submit response"
                )}
              </Button>

              <Button 
                type="button"
                variant="ghost"
                onClick={handleClear}
                className="h-12 px-8 rounded-full font-semibold text-muted-foreground hover:bg-destructive/5 hover:text-destructive transition-all order-1 sm:order-2 w-full sm:w-auto"
              >
                Clear form
              </Button>
            </div>

            <div className="space-y-8 pt-8 border-t border-border/40">
              <div className="flex flex-col items-center gap-6 text-center">
                <p className="text-xs font-medium text-muted-foreground/40">
                  Never submit passwords through Quest
                </p>
                
                <div className="flex items-center gap-2 opacity-30 hover:opacity-100 transition-opacity">
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
