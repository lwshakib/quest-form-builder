"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Trash2, Type, List, CheckSquare, ChevronDown, Calendar, Clock, AlignLeft, Plus, Video, Award, MessageCircle, CheckCircle2, Copy } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import {
  Image as ImageIcon,
  Video as VideoIcon,
  Upload,
  Loader2,
} from "lucide-react";
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

const TYPE_ICONS: any = {
  SHORT_TEXT: Type,
  PARAGRAPH: AlignLeft,
  MULTIPLE_CHOICE: List,
  CHECKBOXES: CheckSquare,
  DROPDOWN: ChevronDown,
  DATE: Calendar,
  TIME: Clock,
  VIDEO: Video,
  IMAGE: ImageIcon,
};
export function QuestionCard({ 
  question,
  onDelete, 
  onUpdate,
  onDuplicate,
  isQuiz 
}: { 
  question: any, 
  onDelete: () => void, 
  onUpdate: (data: any) => void,
  onDuplicate: () => void,
  isQuiz?: boolean 
}) {
  const [isFocused, setIsFocused] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const Icon = TYPE_ICONS[question.type] || Type;
  
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'IMAGE' | 'VIDEO') => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (type === 'IMAGE' && file.size > 2 * 1024 * 1024) {
        toast.error("Image size too large. Max 2MB allowed.");
        return;
    }
    if (type === 'VIDEO' && file.size > 10 * 1024 * 1024) {
        toast.error("Video size too large. Max 10MB allowed.");
        return;
    }

    setIsUploading(true);
    try {
        const { secureUrl } = await uploadFileToCloudinary(file);
        onUpdate({ options: [secureUrl] });
        toast.success(`${type === 'IMAGE' ? 'Image' : 'Video'} uploaded successfully`);
    } catch (error) {
        toast.error("Upload failed");
        console.error(error);
    } finally {
        setIsUploading(false);
    }
  };

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: question.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const handleTypeChange = (newType: string) => {
    const data: any = { type: newType };
    const isChoiceType = ['MULTIPLE_CHOICE', 'CHECKBOXES', 'DROPDOWN'].includes(newType);
    if (isChoiceType && (!question.options || question.options.length === 0)) {
      data.options = ["Option 1"];
    }
    onUpdate(data);
  };

  const getOptionValue = (opt: any) => typeof opt === 'object' && opt !== null ? (opt.value || "") : opt;
  const getOptionImage = (opt: any) => typeof opt === 'object' && opt !== null ? opt.image : null;

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
        newOptions[index] = { value: currentValue, image: secureUrl };
        onUpdate({ options: newOptions });
        toast.success("Image added to option");
    } catch (e) {
        toast.error("Failed to upload option image");
    } finally {
        setIsUploading(false);
    }
  };

  const removeOptionImage = (index: number) => {
      const newOptions = [...(question.options || [])];
      const current = newOptions[index];
      const currentValue = getOptionValue(current);
      // We can revert to string if we want, or keep object with null image
      // Reverting to string is cleaner for data if no image
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
        isDragging && "z-50 opacity-50 scale-102"
      )}
    >
      <div className={cn(
        "relative border border-border/50 bg-background rounded-lg overflow-hidden transition-all duration-300 shadow-sm group/card cursor-move",
        isFocused ? "border-primary/10 ring-2 ring-primary/5 bg-background shadow-xs" : "hover:border-border/60 hover:shadow-sm"
      )}>
        {/* Subtle top highlight */}
        <div className="absolute top-0 left-4 right-4 h-px bg-gradient-to-r from-transparent via-primary/5 to-transparent" />
        
        <div className="pt-3 px-4 flex flex-row items-center justify-between text-muted-foreground relative z-10">
          <div className="flex items-center gap-3">
            <Select value={question.type} onValueChange={handleTypeChange}>
              <SelectTrigger 
                onPointerDown={(e) => e.stopPropagation()}
                className="w-fit h-auto px-4 py-2 hover:bg-primary/5 border-none shadow-none focus:ring-0 gap-3 group/trigger transition-all rounded-none outline-none cursor-pointer bg-background"
              >
                <SelectValue>
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 transition-colors group-hover/trigger:text-primary">
                    {question.type.replace('_', ' ')}
                  </span>
                </SelectValue>
              </SelectTrigger>
              <SelectContent className="rounded-none border-border/50 bg-popover/95 backdrop-blur-2xl shadow-2xl p-2" position="popper" sideOffset={12}>
                {TYPE_OPTIONS.map((opt) => (
                  <SelectItem key={opt.id} value={opt.id} className="rounded-none py-3 transition-colors cursor-pointer focus:bg-primary/10 focus:text-primary px-4">
                    <span className="font-bold text-[10px] uppercase tracking-widest">{opt.label}</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-1 opacity-0 group-hover/card:opacity-100 transition-all duration-300">
            <Button 
              onPointerDown={(e) => e.stopPropagation()}
              variant="ghost" 
              size="icon" 
              className="rounded-full h-10 w-10 hover:bg-destructive/10 hover:text-destructive text-muted-foreground/30 transition-all" 
              onClick={onDelete}
            >
              <Trash2 className="h-4.5 w-4.5" />
            </Button>
          </div>
        </div>

        <div className="px-4 pb-4 space-y-2 mt-1 relative z-10">
          <Input
            value={question.title}
            onChange={(e) => onUpdate({ title: e.target.value })}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            onPointerDown={(e) => e.stopPropagation()}
            placeholder="Question title..."
            className="text-lg font-black tracking-tight bg-transparent border-none focus-visible:border-none focus-visible:ring-0 px-2 h-10 rounded-none placeholder:text-muted-foreground/25 selection:bg-primary/10 transition-all shadow-none"
          />
          <Textarea
             value={question.description || ''}
             onChange={(e) => onUpdate({ description: e.target.value })}
             onFocus={() => setIsFocused(true)}
             onBlur={() => setIsFocused(false)}
             onPointerDown={(e) => e.stopPropagation()}
             placeholder="Add a description (optional)..."
             className="bg-transparent border-none p-2 focus:ring-0 focus:outline-none focus:border-none focus-visible:ring-0 focus-visible:border-none shadow-none resize-none min-h-[40px] text-muted-foreground/70 placeholder:text-muted-foreground/15 leading-relaxed text-sm font-medium rounded-none transition-all"
          />

          <div className="flex items-center justify-end gap-6 pt-2 border-t border-border/10">
            <div className="flex items-center gap-3">
              <Label htmlFor={`required-${question.id}`} className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 cursor-pointer">
                Required
              </Label>
              <Switch
                id={`required-${question.id}`}
                checked={question.required}
                onCheckedChange={(checked) => onUpdate({ required: checked })}
                onPointerDown={(e) => e.stopPropagation()}
                className="scale-75 data-[state=checked]:bg-primary"
              />
            </div>

            <Button
              variant="ghost"
              size="sm"
              onPointerDown={(e) => e.stopPropagation()}
              className="h-8 px-3 rounded-lg text-muted-foreground/40 hover:text-primary hover:bg-primary/5 transition-all gap-2"
              onClick={onDuplicate}
            >
              <Copy className="h-3.5 w-3.5" />
              <span className="text-[10px] font-black uppercase tracking-widest">Duplicate</span>
            </Button>
          </div>

          {/* Type Specific Fields */}
          {(question.type === 'MULTIPLE_CHOICE' || question.type === 'CHECKBOXES' || question.type === 'DROPDOWN') && (
            <div className="pt-4 space-y-3">
              {question.options?.map((option: any, index: number) => {
                const optionText = getOptionValue(option);
                const optionImage = getOptionImage(option);
                
                return (
                <div key={index} className="flex flex-col gap-2 animate-in fade-in slide-in-from-left-2 duration-300 group/option">
                  <div className="flex items-center gap-4">
                    <div className={cn(
                      "h-4 w-4 border-2 border-muted-foreground/20 rounded-full shrink-0 group-hover/option:border-primary/40 transition-colors shadow-sm",
                      question.type === 'CHECKBOXES' && "rounded-md"
                    )} />
                    <Input
                      value={optionText}
                      onChange={(e) => {
                        const newOptions = [...question.options];
                        const current = newOptions[index];
                        if (typeof current === 'object' && current !== null) {
                            newOptions[index] = { ...current, value: e.target.value };
                        } else {
                            newOptions[index] = e.target.value;
                        }
                        onUpdate({ options: newOptions });
                      }}
                      onFocus={() => setIsFocused(true)}
                      onBlur={() => setIsFocused(false)}
                      onPointerDown={(e) => e.stopPropagation()}
                      className="h-8 bg-transparent border-none focus-visible:border-none focus-visible:ring-0 rounded-none text-sm font-bold transition-all shadow-none px-2 placeholder:text-muted-foreground/20 flex-1"
                    />
                    
                    {/* Option Image Controls */}
                    {(question.type === 'MULTIPLE_CHOICE' || question.type === 'CHECKBOXES') && (
                       <div className="flex items-center gap-1">
                          <input
                            type="file"
                            id={`opt-img-${question.id}-${index}`}
                            className="hidden"
                            accept="image/*"
                            disabled={isUploading}
                            onChange={(e) => e.target.files?.[0] && handleOptionUpload(e.target.files[0], index)}
                          />
                          <label htmlFor={`opt-img-${question.id}-${index}`}>
                             <Button
                               variant="ghost" 
                               size="icon"
                               asChild
                               disabled={isUploading}
                               className={cn("h-8 w-8 text-muted-foreground/20 hover:text-primary transition-all rounded-full cursor-pointer", optionImage && "text-primary")}
                             >
                                <span>
                                  <ImageIcon className="h-4 w-4" />
                                </span>
                             </Button>
                          </label>
                       </div>
                    )}

                    {isQuiz && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onPointerDown={(e) => e.stopPropagation()}
                        className={cn(
                          "h-9 w-9 rounded-full transition-all",
                          (Array.isArray(question.correctAnswer) ? question.correctAnswer.includes(optionText) : question.correctAnswer === optionText)
                            ? "text-green-500 bg-green-500/10 hover:bg-green-500/20"
                            : "text-muted-foreground/20 hover:text-green-500/50 hover:bg-green-500/5"
                        )}
                        onClick={() => {
                          if (question.type === 'CHECKBOXES') {
                            const current = Array.isArray(question.correctAnswer) ? question.correctAnswer : [];
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

                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onPointerDown={(e) => e.stopPropagation()}
                      className="h-9 w-9 rounded-full opacity-0 group-hover/option:opacity-100 hover:bg-destructive/10 hover:text-destructive text-muted-foreground/20 transition-all"
                      onClick={() => {
                        const newOptions = question.options.filter((_: any, i: number) => i !== index);
                        onUpdate({ options: newOptions });
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>

                  {/* Render Option Image Preview */}
                  {optionImage && (
                      <div className="ml-8 relative group/img w-fit">
                          <img src={optionImage} alt="Option" className="h-20 w-auto rounded-md border border-border" />
                          <button 
                             onClick={() => removeOptionImage(index)}
                             className="absolute -top-2 -right-2 bg-destructive text-white rounded-full p-0.5 opacity-0 group-hover/img:opacity-100 transition-opacity"
                          >
                             <Trash2 className="h-3 w-3" />
                          </button>
                      </div>
                  )}
                </div>
              )})}
              <Button 
                variant="ghost" 
                size="sm" 
                onPointerDown={(e) => e.stopPropagation()}
                className="gap-3 text-primary/60 hover:text-primary hover:bg-primary/5 rounded-lg ml-8 px-5 h-10 font-black text-[10px] uppercase tracking-[0.2em] transition-all shadow-sm border border-primary/5"
                onClick={() => onUpdate({ options: [...(question.options || []), `Option ${(question.options?.length || 0) + 1}`] })}
              >
                <Plus className="h-4 w-4" /> Add Option
              </Button>
            </div>
          )}

          {question.type === 'VIDEO' && (
            <div className="pt-4 space-y-4">
              <div className="flex items-center gap-4 animate-in fade-in slide-in-from-left-2 duration-300">
                <Input
                  value={question.options?.[0] || ''}
                  onChange={(e) => onUpdate({ options: [e.target.value] })}
                  onFocus={() => setIsFocused(true)}
                  onBlur={() => setIsFocused(false)}
                  onPointerDown={(e) => e.stopPropagation()}
                  placeholder="Paste Video URL (YouTube or direct link)..."
                  className="h-10 bg-accent/5 border border-border/50 focus-visible:ring-1 focus-visible:ring-primary/20 rounded-xl text-sm font-bold transition-all shadow-none px-4 placeholder:text-muted-foreground/30 flex-1"
                />
                <div className="relative">
                    <input
                        type="file"
                        accept="video/*"
                        className="hidden"
                        id={`video-upload-${question.id}`}
                        onChange={(e) => handleFileUpload(e, 'VIDEO')}
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
                                {isUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                            </span>
                        </Button>
                    </label>
                </div>
              </div>
              
              {/* Draft Preview of the video in the editor */}
              {question.options?.[0] && (
                <div className="mt-4 rounded-xl overflow-hidden border border-border/50 bg-accent/5 aspect-video flex items-center justify-center">
                  {(() => {
                    const url = question.options[0];
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
                        <Button variant="outline" className="gap-2" onClick={() => window.open(url, '_blank')}>
                           Click here to see the video
                        </Button>
                      );
                    }
                  })()}
                </div>
              )}
            </div>
          )}

          {question.type === 'IMAGE' && (
            <div className="pt-4 space-y-4">
              <div className="flex items-center gap-3 animate-in fade-in slide-in-from-left-2 duration-300">
                <Input
                  value={question.options?.[0] || ''}
                  onChange={(e) => onUpdate({ options: [e.target.value] })}
                  onFocus={() => setIsFocused(true)}
                  onBlur={() => setIsFocused(false)}
                  onPointerDown={(e) => e.stopPropagation()}
                  placeholder="Paste Image URL..."
                  className="h-10 bg-accent/5 border border-border/50 focus-visible:ring-1 focus-visible:ring-primary/20 rounded-xl text-sm font-bold transition-all shadow-none px-4 placeholder:text-muted-foreground/30 flex-1"
                />
                <div className="relative">
                    <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        id={`image-upload-${question.id}`}
                        onChange={(e) => handleFileUpload(e, 'IMAGE')}
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
                                {isUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                            </span>
                        </Button>
                    </label>
                </div>
              </div>
              
              {/* Image Preview */}
              {question.options?.[0] && (
                <div className="mt-4 rounded-xl overflow-hidden border border-border/50 bg-accent/5 max-h-[400px] flex items-center justify-center relative group/preview">
                  <img
                    src={question.options[0]}
                    alt="Preview"
                    className="max-w-full max-h-[400px] object-contain transition-transform duration-500"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = "https://placehold.co/600x400?text=Invalid+Image+URL";
                    }}
                  />
                </div>
              )}
            </div>
          )}

          {isQuiz && (
            <div className="mt-8 pt-6 border-t border-border/30 space-y-4 animate-in fade-in slide-in-from-top-2 duration-500">
               <div className="flex flex-wrap items-center gap-6">
                  <div className="flex items-center gap-3 bg-primary/5 px-4 py-2 rounded-xl border border-primary/10 transition-all hover:bg-primary/10">
                    <Award className="h-4 w-4 text-primary" />
                    <Input
                      type="number"
                      value={question.points || 0}
                      onChange={(e) => onUpdate({ points: parseInt(e.target.value) || 0 })}
                      onPointerDown={(e) => e.stopPropagation()}
                      className="w-16 h-8 bg-transparent border-none focus-visible:ring-0 font-black text-primary p-0 shadow-none text-center [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    />
                    <span className="text-[10px] font-black uppercase tracking-widest text-primary/60">Points</span>
                  </div>

                  {['SHORT_TEXT', 'PARAGRAPH'].includes(question.type) && (
                    <div className="flex-1 min-w-[200px]">
                       <Input
                        value={question.correctAnswer || ''}
                        onChange={(e) => onUpdate({ correctAnswer: e.target.value })}
                        onPointerDown={(e) => e.stopPropagation()}
                        placeholder="Set correct answer..."
                        className="h-10 bg-accent/5 border border-border/50 focus-visible:ring-1 focus-visible:ring-primary/20 rounded-xl text-sm font-bold transition-all shadow-none px-4"
                      />
                    </div>
                  )}
               </div>

               <div className="space-y-2">
                  <div className="flex items-center gap-2 text-muted-foreground/60 px-2">
                    <MessageCircle className="h-3.5 w-3.5" />
                    <span className="text-[10px] font-black uppercase tracking-widest">Feedback for respondents</span>
                  </div>
                  <Textarea
                    value={question.feedback || ''}
                    onChange={(e) => onUpdate({ feedback: e.target.value })}
                    onPointerDown={(e) => e.stopPropagation()}
                    placeholder="Add feedback for correct/incorrect answers..."
                    className="bg-accent/5 border border-border/50 focus:ring-1 focus:ring-primary/20 rounded-xl p-4 text-sm font-medium transition-all resize-none min-h-[80px]"
                  />
               </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
