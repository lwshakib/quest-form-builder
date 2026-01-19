'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { 
  FileText, 
  MessageSquare, 
  Settings, 
  Plus,
  Loader2,
  Trash2,
  Calendar,
  Clock,
  List,
  CheckSquare,
  ChevronDown,
  AlignLeft,
  Type,
  ChevronRight,
  Download,
  AlertTriangle,
  ChevronLeft,
  ChevronsLeft,
  ChevronsRight,
  PieChart as PieChartIcon,
  BarChart3
} from 'lucide-react';
import { Pie, PieChart, Cell, LabelList } from "recharts";
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  type ChartConfig,
  ChartTooltip,
  ChartTooltipContent
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

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { 
  getQuestById, 
  createQuestion, 
  updateQuestion, 
  deleteQuestion, 
  updateQuestionsOrder,
  updateQuest,
  getQuestResponses,
  duplicateQuestion
} from '@/lib/actions';
import { toast } from 'sonner';
import { QuestionCard } from '@/components/question-card';
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
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { cn } from '@/lib/utils';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Switch } from "@/components/ui/switch";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

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

export default function QuestDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeTab = searchParams.get('tab') || 'questions';

  const [quest, setQuest] = useState<any>(null);
  const [questions, setQuestions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [responses, setResponses] = useState<any[]>([]);
  const [isLoadingResponses, setIsLoadingResponses] = useState(false);
  const [responseSubTab, setResponseSubTab] = useState<'summary' | 'question' | 'individual'>('summary');
  const [selectedQuestionId, setSelectedQuestionId] = useState<string>('all');
  const [individualIndex, setIndividualIndex] = useState(0);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    async function loadQuest() {
      try {
        const data = await getQuestById(id as string);
        if (!data) {
          toast.error("Quest not found");
          router.push('/quests');
          return;
        }
        setQuest(data);
        setQuestions(data.questions || []);
      } catch (error) {
        toast.error("Failed to load quest");
        router.push('/quests');
      } finally {
        setIsLoading(false);
      }
    }
    loadQuest();
  }, [id, router]);

  useEffect(() => {
    async function loadResponses() {
      if (activeTab !== 'responses') return;
      
      setIsLoadingResponses(true);
      try {
        const data = await getQuestResponses(id as string);
        setResponses(data);
      } catch (error) {
        toast.error("Failed to load responses");
      } finally {
        setIsLoadingResponses(false);
      }
    }
    loadResponses();
  }, [id, activeTab]);

  const handleAddQuestion = async (type: string, atIndex?: number) => {
    const insertIndex = atIndex !== undefined ? atIndex : questions.length;
    const optimisticId = `temp-${Date.now()}`;
    const newQuestion = {
      id: optimisticId,
      type,
      title: `Untitled ${type.toLowerCase().replace('_', ' ')}`,
      description: '',
      order: insertIndex,
      options: type === 'MULTIPLE_CHOICE' || type === 'CHECKBOXES' || type === 'DROPDOWN' ? ["Option 1"] : undefined,
    };

    const newQuestions = [...questions];
    newQuestions.splice(insertIndex, 0, newQuestion);
    setQuestions(newQuestions.map((q, i) => ({ ...q, order: i })));

    try {
      const created = await createQuestion(id as string, type, insertIndex);
      setQuestions(prev => prev.map(q => q.id === optimisticId ? created : q));
    } catch (error) {
      toast.error("Failed to add question");
      await loadQuestData(); // Rollback
    }
  };

  const loadQuestData = async () => {
    const data = await getQuestById(id as string);
    if (data) {
      setQuest(data);
      setQuestions(data.questions || []);
    }
  };

  const handleUpdateQuestion = async (questionId: string, data: any) => {
    setQuestions(prev => prev.map(q => q.id === questionId ? { ...q, ...data } : q));
    try {
      await updateQuestion(questionId, id as string, data);
    } catch (error) {
      toast.error("Failed to update question");
    }
  };

  const handleDeleteQuestion = async (questionId: string) => {
    const original = [...questions];
    setQuestions(prev => prev.filter(q => q.id !== questionId));
    try {
      await deleteQuestion(questionId, id as string);
      toast.success("Question deleted");
    } catch (error) {
      setQuestions(original);
      toast.error("Failed to delete question");
    }
  };

  const handleDuplicateQuestion = async (questionId: string) => {
    try {
      const duplicated = await duplicateQuestion(questionId, id as string);
      toast.success("Question duplicated");
      await loadQuestData();
    } catch (error) {
      toast.error("Failed to duplicate question");
    }
  };

  const onDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const onDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    // Toolbar drop logic
    if (active.data.current?.isToolbarItem) {
      if (over) {
        const overIndex = questions.findIndex(q => q.id === over.id);
        handleAddQuestion(active.data.current.type, overIndex === -1 ? questions.length : overIndex);
      }
      return;
    }

    // Sorting logic
    if (over && active.id !== over.id) {
      const oldIndex = questions.findIndex((q) => q.id === active.id);
      const newIndex = questions.findIndex((q) => q.id === over.id);

      const newQuestions = arrayMove(questions, oldIndex, newIndex);
      setQuestions(newQuestions);

      try {
        await updateQuestionsOrder(id as string, newQuestions.map(q => q.id));
      } catch (error) {
        toast.error("Failed to update order");
        await loadQuestData();
      }
    }
  };

  const [newQuestionType, setNewQuestionType] = useState('SHORT_TEXT');

  if (isLoading) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!quest) return null;

  return (
    <div className="flex flex-col relative min-h-screen bg-background">
      
      <div className="container mx-auto py-4 px-6 lg:px-8 max-w-4xl">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={onDragStart}
          onDragEnd={onDragEnd}
        >
          {activeTab === 'questions' && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 space-y-4 pb-40">
              {/* Welcome Card */}
              <div className="relative border border-border/50 bg-background rounded-lg overflow-hidden transition-all duration-300 shadow-sm group/welcome">
                {/* Subtle top highlight */}
                <div className="absolute top-0 left-6 right-6 h-px bg-gradient-to-r from-transparent via-primary/10 to-transparent" />
                
                <div className="pt-6 px-8 relative z-10">
                  <div className="space-y-1">
                    <h2 className="text-2xl font-black tracking-tight">{quest.title || "Welcome Screen"}</h2>
                    <p className="text-sm text-muted-foreground/60 font-medium">
                      The first thing your respondents will see.
                    </p>
                  </div>
                </div>
                <div className="space-y-2 px-6 pb-6 mt-2 relative z-10">
                  <div className="group">
                    <Input 
                      placeholder="Enter a catchy title..." 
                      defaultValue={quest.title} 
                      onBlur={(e) => updateQuest(id as string, { title: e.target.value })}
                      onPointerDown={(e) => e.stopPropagation()}
                      className="text-xl font-black h-10 bg-transparent border-none focus-visible:border-none focus-visible:ring-0 px-2 rounded-none transition-all placeholder:text-muted-foreground/20 leading-none shadow-none" 
                    />
                  </div>
                  <div className="group">
                    <textarea 
                      placeholder="Add a friendly description..." 
                      className="w-full min-h-[80px] rounded-none bg-transparent border-none p-2 text-base font-medium resize-none focus:ring-0 focus:outline-none focus:border-none focus-visible:ring-0 focus-visible:border-none transition-all placeholder:text-muted-foreground/15 leading-relaxed text-muted-foreground/70"
                      defaultValue={quest.description || ''}
                      onBlur={(e) => updateQuest(id as string, { description: e.target.value })}
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
              <div className="relative border-2 border-dashed border-border/30 bg-background rounded-lg p-8 transition-all hover:border-border/60 group/add">
                <div className="flex flex-col items-center justify-center space-y-6">
                  <div className="flex items-center gap-3">
                    <Select value={newQuestionType} onValueChange={setNewQuestionType}>
                      <SelectTrigger className="w-[200px] h-10 bg-background border border-border/50 shadow-none focus:ring-0 gap-3 rounded-none outline-none cursor-pointer">
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent className="rounded-none border-border/50 bg-background shadow-2xl p-2" position="popper" sideOffset={8}>
                        {TYPE_OPTIONS.map((opt) => (
                          <SelectItem key={opt.id} value={opt.id} className="rounded-none py-3 transition-colors cursor-pointer focus:bg-primary/10 focus:text-primary px-4">
                            <span className="font-bold text-[10px] uppercase tracking-widest">{opt.label}</span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <Button 
                    variant="ghost" 
                    className="flex items-center gap-3 h-12 px-8 rounded-none border-none hover:bg-primary/5 text-primary/60 hover:text-primary transition-all group/btn"
                    onClick={() => handleAddQuestion(newQuestionType)}
                  >
                    <div className="p-2 bg-primary/5 rounded-full group-hover/btn:bg-primary/10 transition-colors">
                      <Plus className="h-5 w-5" />
                    </div>
                    <span className="font-black text-[12px] uppercase tracking-[0.2em]">Add New Question</span>
                  </Button>
                </div>
              </div>
            </div>
          )}

          <DragOverlay
             dropAnimation={{
               sideEffects: defaultDropAnimationSideEffects({
                 styles: {
                   active: {
                     opacity: '0.4',
                   },
                 },
               }),
             }}
          >
            {activeId ? (
              <div className="opacity-90 pointer-events-none scale-[1.02] shadow-2xl rounded-xl overflow-hidden">
                {/* Toolbar preview also needs to match the rounded style ideally, but keeping it simple for now or matching if logic permits */}
                {activeId.startsWith('toolbar-') ? (
                  <div className="w-[600px] h-48 bg-primary/5 border-2 border-dashed border-primary/20 rounded-xl flex flex-col items-center justify-center backdrop-blur-2xl">
                    <div className="p-4 bg-primary/10 rounded-full mb-3">
                      <Plus className="h-6 w-6 text-primary" />
                    </div>
                    <p className="font-black text-primary text-xl tracking-tight uppercase">New Question</p>
                  </div>
                ) : (
                  <div className="w-full max-w-4xl bg-card border border-primary/20 rounded-xl overflow-hidden">
                     <QuestionCard 
                      question={questions.find(q => q.id === activeId)} 
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

        {activeTab === 'responses' && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 space-y-8 max-w-6xl mx-auto pb-40">
            {/* Stats Overview */}
            <div className="flex flex-col sm:flex-row gap-4">
               {[
                { label: 'Total Responses', value: responses.length.toString() },
                { 
                  label: 'Avg. Time', 
                  value: responses.length > 0 
                    ? (() => {
                        const avgSeconds = responses.reduce((acc, r) => acc + (r.duration || 0), 0) / responses.length;
                        if (avgSeconds < 60) return `${Math.round(avgSeconds)}s`;
                        const mins = Math.floor(avgSeconds / 60);
                        const secs = Math.round(avgSeconds % 60);
                        return `${mins}m ${secs}s`;
                      })()
                    : '0s' 
                },
                { label: 'Completion Rate', value: '100%' } // Placeholder
              ].map((stat) => (
                <Card key={stat.label} className="bg-card/40 border border-border/50 shadow-sm rounded-2xl backdrop-blur-md flex-1 overflow-hidden">
                  <div className="h-1 w-full bg-primary/10" />
                  <div className="p-6 text-center">
                    <p className="text-muted-foreground/60 font-black uppercase tracking-[0.2em] text-[10px]">{stat.label}</p>
                    <h3 className="text-4xl text-primary font-black mt-2 tracking-tighter">{stat.value}</h3>
                  </div>
                </Card>
              ))}
            </div>

            {/* Actions / Tabs Toolbar */}
            <div className="flex flex-col md:flex-row items-center justify-between gap-4 p-2 bg-card/60 backdrop-blur-sm border border-border/40 rounded-2xl">
              <div className="flex items-center gap-1 p-1 bg-muted/50 rounded-xl">
                 {(['summary', 'question', 'individual'] as const).map((tab) => (
                   <button
                    key={tab}
                    onClick={() => setResponseSubTab(tab)}
                    className={cn(
                      "px-6 py-2 rounded-lg text-sm font-bold transition-all capitalize",
                      responseSubTab === tab ? "bg-background shadow-sm text-primary" : "text-muted-foreground hover:bg-background/50"
                    )}
                   >
                     {tab}
                   </button>
                 ))}
              </div>

              <div className="flex items-center gap-2 w-full md:w-auto">
                 <Button variant="outline" size="sm" className="h-9 gap-2 rounded-xl text-muted-foreground font-semibold">
                    <Download className="h-4 w-4" />
                    <span className="hidden sm:inline">Download</span>
                 </Button>
                 
                 <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-9 gap-2 rounded-xl text-destructive hover:bg-destructive/10 hover:text-destructive font-semibold">
                          <Trash2 className="h-4 w-4" />
                          <span className="hidden sm:inline">Delete all</span>
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This will permanently delete all {responses.length} responses. This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete All</AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                 </AlertDialog>
              </div>
            </div>

            {isLoadingResponses ? (
               <div className="flex items-center justify-center p-24">
                 <Loader2 className="h-8 w-8 animate-spin text-primary" />
               </div>
            ) : responses.length === 0 ? (
               <div className="text-center py-24 text-muted-foreground">No responses yet.</div>
            ) : (
              <>
                {/* SUMMARY VIEW */}
                {responseSubTab === 'summary' && (
                  <div className="space-y-8 animate-in fade-in zoom-in-95 duration-300">
                    {questions.map((q, i) => {
                      const answers = responses.map(r => r.answers.find((a: any) => a.questionId === q.id)?.value).flat().filter(Boolean);
                      
                      // Prepare Chart Data & Config
                      const dataMap: Record<string, number> = {};
                      answers.forEach((a: string) => { dataMap[a] = (dataMap[a] || 0) + 1; });
                      
                      const chartData = Object.entries(dataMap).map(([name, value], idx) => ({ 
                        option: name, 
                        count: value, 
                        fill: `var(--chart-${(idx % 5) + 1})` 
                      }));

                      const chartConfig = Object.entries(dataMap).reduce((acc, [name, _], idx) => ({
                        ...acc,
                        [name]: {
                          label: name,
                          color: `var(--chart-${(idx % 5) + 1})`,
                        }
                      }), { 
                        count: { label: "Responses" } 
                      } as ChartConfig);

                      return (
                        <Card key={q.id} className="overflow-hidden border-border/50 bg-card/40 backdrop-blur-sm">
                           <CardHeader className="bg-accent/5 border-b border-border/20 py-4">
                             <CardTitle className="text-base font-bold flex items-center gap-3">
                               <span className="flex h-6 w-6 items-center justify-center rounded-md bg-primary/10 text-xs text-primary">
                                 {i + 1}
                               </span>
                               {q.title}
                             </CardTitle>
                           </CardHeader>
                           <CardContent className="p-6">
                             <div className="text-sm font-medium text-muted-foreground mb-4">{answers.length} responses</div>
                             
                             {['SHORT_TEXT', 'PARAGRAPH', 'DATE', 'TIME'].includes(q.type) ? (
                               <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                                 {answers.slice(0, 50).map((ans: string, idx: number) => (
                                   <div key={idx} className="p-3 bg-background border border-border/50 rounded-lg text-sm text-foreground/80">
                                     {ans}
                                   </div>
                                 ))}
                               </div>
                             ) : (
                               <div className="flex flex-col sm:flex-row items-start gap-8">
                                  <div className="flex-1 w-full min-h-[300px]">
                                    <ChartContainer config={chartConfig} className="mx-auto aspect-square max-h-[300px]">
                                      <PieChart>
                                        <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
                                        <Pie data={chartData} dataKey="count" nameKey="option" innerRadius={60} strokeWidth={5}>
                                          <LabelList
                                            dataKey="option"
                                            className="fill-foreground font-bold"
                                            stroke="none"
                                            fontSize={12}
                                            formatter={(value: any) => {
                                              if (typeof value !== "string") return value;
                                              const label = chartConfig[value]?.label;
                                              return typeof label === "string" ? label : value;
                                            }}
                                          />
                                        </Pie>
                                        <ChartLegend content={<ChartLegendContent nameKey="option" payload={[]} verticalAlign="bottom" />} className="-translate-y-2 flex-wrap gap-2" />
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
                {responseSubTab === 'question' && (
                  <div className="space-y-6 animate-in fade-in zoom-in-95 duration-300">
                    <div className="flex items-center gap-4 bg-card p-4 rounded-xl border border-border/50">
                      <div className="flex items-center gap-2">
                         <Button 
                           variant="outline" 
                           size="icon" 
                           disabled={questions.findIndex(q => q.id === selectedQuestionId) <= 0}
                           onClick={() => {
                             const idx = questions.findIndex(q => q.id === selectedQuestionId);
                             if (idx > 0) setSelectedQuestionId(questions[idx - 1].id);
                           }}
                         >
                           <ChevronLeft className="h-4 w-4" />
                         </Button>
                         <Select value={selectedQuestionId === 'all' ? questions[0]?.id : selectedQuestionId} onValueChange={setSelectedQuestionId}>
                           <SelectTrigger className="w-[300px] font-medium">
                             <SelectValue />
                           </SelectTrigger>
                           <SelectContent>
                             {questions.map((q, i) => (
                               <SelectItem key={q.id} value={q.id}>
                                 <span className="mr-2 text-muted-foreground">#{i+1}</span> {q.title}
                               </SelectItem>
                             ))}
                           </SelectContent>
                         </Select>
                         <Button 
                           variant="outline" 
                           size="icon"
                           disabled={questions.findIndex(q => q.id === selectedQuestionId) >= questions.length - 1}
                           onClick={() => {
                             const idx = questions.findIndex(q => q.id === selectedQuestionId) === -1 ? 0 : questions.findIndex(q => q.id === selectedQuestionId);
                             if (idx < questions.length - 1) setSelectedQuestionId(questions[idx + 1].id);
                           }}
                         >
                           <ChevronRight className="h-4 w-4" />
                         </Button>
                      </div>
                      <div className="ml-auto text-sm text-muted-foreground font-medium">
                        Question {questions.findIndex(q => q.id === (selectedQuestionId === 'all' ? questions[0]?.id : selectedQuestionId)) + 1} of {questions.length}
                      </div>
                    </div>

                    <div className="space-y-3">
                      {responses.map((r, idx) => {
                         const qId = selectedQuestionId === 'all' ? questions[0]?.id : selectedQuestionId;
                         const answer = r.answers.find((a: any) => a.questionId === qId);
                         return (
                           <div key={r.id} className="p-4 bg-card border border-border/50 rounded-xl flex items-start gap-4">
                             <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
                               {responses.length - idx}
                             </div>
                             <div>
                               <div className="text-sm font-medium text-foreground">
                                 {Array.isArray(answer?.value) ? answer.value.join(', ') : answer?.value || <span className="text-muted-foreground italic">No answer</span>}
                               </div>
                               <div className="text-xs text-muted-foreground mt-1">
                                 {new Date(r.createdAt).toLocaleString()}
                               </div>
                             </div>
                           </div>
                         )
                      })}
                    </div>
                  </div>
                )}

                {/* INDIVIDUAL VIEW */}
                {responseSubTab === 'individual' && (
                  <div className="grid grid-cols-1 md:grid-cols-[300px_1fr] gap-6 animate-in fade-in zoom-in-95 duration-300 items-start">
                     {/* Sidebar List (Desktop) / Navigation */}
                     <div className="bg-card border border-border/50 rounded-xl overflow-hidden shadow-sm md:sticky md:top-6">
                        <div className="p-3 border-b border-border/50 bg-muted/20 flex items-center justify-between">
                           <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Responses</span>
                           <span className="text-xs font-medium text-muted-foreground">{responses.length} total</span>
                        </div>
                        <div className="max-h-[500px] overflow-y-auto custom-scrollbar p-2 space-y-1">
                           {responses.map((r, i) => (
                             <button
                               key={r.id}
                               onClick={() => setIndividualIndex(i)}
                               className={cn(
                                 "w-full flex items-center gap-3 p-3 rounded-lg text-left transition-all text-sm",
                                 individualIndex === i ? "bg-primary/10 text-primary font-bold" : "hover:bg-accent/50 text-muted-foreground hover:text-foreground"
                               )}
                             >
                                <div className="flex-shrink-0 w-6 h-6 rounded-md bg-background border border-border/50 flex items-center justify-center text-[10px] font-medium shadow-sm">
                                  {responses.length - i}
                                </div>
                                <div className="truncate flex-1">
                                  {/* Try to find a name or email field, otherwise generic */}
                                  {(() => {
                                     // Quick heuristic to find a 'name' or 'email' answer
                                     const nameQ = r.answers.find((a: any) => a.question.title.toLowerCase().includes('name'));
                                     if (nameQ) return nameQ.value;
                                     const emailQ = r.answers.find((a: any) => a.question.title.toLowerCase().includes('email'));
                                     if (emailQ) return emailQ.value;
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
                        <div className="flex items-center justify-between bg-card p-2 rounded-xl border border-border/50 shadow-sm">
                           <Button 
                             variant="ghost" 
                             size="sm"
                             disabled={individualIndex <= 0} 
                             onClick={() => setIndividualIndex(prev => prev - 1)}
                           >
                             <ChevronLeft className="h-4 w-4 mr-2" /> Previous
                           </Button>
                           <span className="text-sm font-bold text-muted-foreground">
                             {individualIndex + 1} of {responses.length}
                           </span>
                           <Button 
                             variant="ghost" 
                             size="sm"
                             disabled={individualIndex >= responses.length - 1} 
                             onClick={() => setIndividualIndex(prev => prev + 1)}
                           >
                             Next <ChevronRight className="h-4 w-4 ml-2" />
                           </Button>
                        </div>

                        {/* Content */}
                        <Card className="border border-border/50 shadow-md">
                           <CardHeader className="border-b border-border/20 bg-muted/5 py-6">
                             <div className="flex items-center justify-between">
                               <div>
                                 <CardTitle className="text-xl font-bold">Response Details</CardTitle>
                                 <CardDescription className="mt-1 flex items-center gap-2">
                                   <Clock className="h-3 w-3" />
                                   Submitted on {new Date(responses[individualIndex].createdAt).toLocaleString()}
                                 </CardDescription>
                               </div>
                               <div className="text-right">
                                  {responses[individualIndex].duration && (
                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                                      {Math.floor(responses[individualIndex].duration / 60)}m {responses[individualIndex].duration % 60}s time
                                    </span>
                                  )}
                               </div>
                             </div>
                           </CardHeader>
                           <CardContent className="p-8 space-y-8">
                              {responses[individualIndex].answers.map((answer: any) => (
                                <div key={answer.id} className="space-y-2">
                                  <h4 className="text-sm font-bold uppercase tracking-wider text-muted-foreground/70">{answer.question.title}</h4>
                                  <div className="p-4 bg-accent/5 rounded-xl border border-border/30 text-foreground font-medium leading-relaxed">
                                    {Array.isArray(answer.value) ? (
                                      <div className="flex flex-wrap gap-2">
                                        {answer.value.map((v: string, i: number) => (
                                          <span key={i} className="px-2 py-1 bg-background border border-border rounded-md text-sm">{v}</span>
                                        ))}
                                      </div>
                                    ) : (
                                      answer.value || <span className="text-muted-foreground/50 italic">No answer provided</span>
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

        {activeTab === 'settings' && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 max-w-2xl mx-auto space-y-8 pb-40">
            <Card className="border border-border/50 shadow-xl bg-card/60 backdrop-blur-md rounded-[2.5rem] overflow-hidden">
              <CardHeader className="pt-10 px-10 sm:px-12 border-b border-border/30 bg-accent/5">
                <div className="space-y-1">
                  <CardTitle className="text-3xl font-black tracking-tight">Quest Settings</CardTitle>
                  <CardDescription className="text-lg font-medium text-muted-foreground/80">Control how your quest behaves and looks.</CardDescription>
                </div>
              </CardHeader>
              <CardContent className="px-10 sm:px-12 py-10 space-y-8">
                
                {/* Quiz Section */}
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Label htmlFor="isQuiz" className="text-xl font-black tracking-tight cursor-pointer">Make this a quiz</Label>
                      <p className="text-sm text-muted-foreground/70 font-medium">Assign point values, set answers, and automatically provide feedback.</p>
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
                    <AccordionTrigger className="hover:no-underline py-4">
                      <div className="flex flex-col items-start text-left">
                        <span className="text-xl font-black tracking-tight">Responses</span>
                        <span className="text-sm text-muted-foreground/70 font-medium">Manage how responses are collected.</span>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="pt-4 pb-6 space-y-8">
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label className="text-base font-bold">Limit to 1 response</Label>
                          <p className="text-sm text-muted-foreground/60">Requires respondents to sign in to the Quest.</p>
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
                          <Label className="text-base font-bold">Show link to submit another response</Label>
                          <p className="text-sm text-muted-foreground/60">Allow respondents to fill out the form multiple times.</p>
                        </div>
                        <Switch 
                          checked={quest.showLinkToSubmitAnother}
                          onCheckedChange={(val) => {
                            setQuest({ ...quest, showLinkToSubmitAnother: val });
                            updateQuest(id as string, { showLinkToSubmitAnother: val });
                          }}
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label className="text-base font-bold">View results summary</Label>
                          <p className="text-sm text-muted-foreground/60">Show summary charts to respondents after submission.</p>
                        </div>
                        <Switch 
                          checked={quest.viewResultsSummary}
                          onCheckedChange={(val) => {
                            setQuest({ ...quest, viewResultsSummary: val });
                            updateQuest(id as string, { viewResultsSummary: val });
                          }}
                        />
                      </div>

                      <div className="space-y-3">
                        <Label className="text-base font-bold">Confirmation Message</Label>
                        <Textarea 
                          className="bg-accent/5 border-border/50 rounded-xl resize-none min-h-[100px]"
                          defaultValue={quest.confirmationMessage || ""}
                          onBlur={(e) => updateQuest(id as string, { confirmationMessage: e.target.value })}
                        />
                      </div>
                    </AccordionContent>
                  </AccordionItem>

                  <Separator className="opacity-30 my-2" />

                  {/* Presentation Section */}
                  <AccordionItem value="presentation" className="border-none">
                    <AccordionTrigger className="hover:no-underline py-4">
                      <div className="flex flex-col items-start text-left">
                        <span className="text-xl font-black tracking-tight">Presentation</span>
                        <span className="text-sm text-muted-foreground/70 font-medium">Control how the quest is presented to users.</span>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="pt-4 pb-6 space-y-8">
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label className="text-base font-bold">Show progress bar</Label>
                          <p className="text-sm text-muted-foreground/60">Helps respondents track their position in the quest.</p>
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
                          <p className="text-sm text-muted-foreground/60">Randomize the order of questions for each respondent.</p>
                        </div>
                        <Switch 
                          checked={quest.shuffleQuestionOrder}
                          onCheckedChange={(val) => {
                            setQuest({ ...quest, shuffleQuestionOrder: val });
                            updateQuest(id as string, { shuffleQuestionOrder: val });
                          }}
                        />
                      </div>

                      <Separator className="opacity-30" />

                      <div className="space-y-6">
                        <div className="flex items-center justify-between">
                          <div className="space-y-0.5">
                            <Label className="text-base font-bold">Enable Webhook</Label>
                            <p className="text-sm text-muted-foreground/60">Send response data to a custom URL when submitted.</p>
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
                          <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-300">
                            <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60">Webhook Endpoint URL</Label>
                            <Input 
                              placeholder="https://your-api.com/webhook"
                              value={quest.webhookUrl || ''}
                              onChange={(e) => setQuest({ ...quest, webhookUrl: e.target.value })}
                              onBlur={() => updateQuest(id as string, { webhookUrl: quest.webhookUrl })}
                              className="h-12 bg-muted/30 border-none rounded-none font-medium focus-visible:ring-1 focus-visible:ring-primary/20"
                            />
                            <p className="text-[10px] text-muted-foreground/40 italic">We'll send a POST request with the response data.</p>
                          </div>
                        )}
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
                      <p className="text-sm text-muted-foreground/70 font-medium">Set default behavior for new questions.</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between group">
                    <div className="space-y-0.5">
                      <p className="font-bold text-base">Make questions required by default</p>
                      <p className="text-sm text-muted-foreground/60">New questions will have the 'Required' flag on.</p>
                    </div>
                    <Switch 
                      checked={quest.questionsRequiredByDefault}
                      onCheckedChange={(val) => {
                        setQuest({ ...quest, questionsRequiredByDefault: val });
                        updateQuest(id as string, { questionsRequiredByDefault: val });
                      }}
                    />
                  </div>
                </div>

              </CardContent>
            </Card>

            {/* Danger Zone */}
            <Card className="border border-destructive/20 shadow-xl bg-destructive/5 backdrop-blur-md rounded-[2.5rem] overflow-hidden">
               <CardContent className="p-10 sm:p-12 space-y-6">
                  <div className="space-y-2">
                    <p className="font-black text-xs uppercase tracking-[0.3em] text-destructive">Danger Zone</p>
                    <CardTitle className="text-2xl font-black text-destructive/80">Permanent Actions</CardTitle>
                    <p className="text-base text-muted-foreground/80 leading-relaxed font-medium">
                      Deleting this quest is irreversible. All collected responses, data, and analytics will be permanently wiped from our servers.
                    </p>
                  </div>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="outline" className="w-full h-16 justify-center text-destructive hover:bg-destructive hover:text-white gap-4 rounded-2xl border-destructive/30 transition-all font-black text-lg group">
                        <Trash2 className="h-6 w-6 group-hover:animate-bounce" /> Delete this Quest
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This action cannot be undone. This will permanently delete the quest
                          <strong> "{quest.title}"</strong> and all of its associated responses.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction 
                          onClick={async () => {
                            await updateQuest(id as string, { status: 'Deleted' }); // Example logic or call delete action
                            toast.success("Quest deleted");
                            router.push('/quests');
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
    </div>
  );
}
