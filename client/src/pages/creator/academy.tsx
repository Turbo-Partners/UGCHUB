import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { 
  BookOpen, 
  Clock, 
  GraduationCap, 
  Play, 
  CheckCircle2, 
  Circle,
  Trophy,
  Target,
  Loader2,
  ChevronRight,
  ChevronLeft,
  FileText,
  Video,
  Link as LinkIcon,
  ListChecks,
  Award,
  Bookmark,
  BookmarkCheck,
  Instagram,
  Youtube,
  Filter,
  Search,
  Plus,
  FolderOpen,
  ExternalLink,
  X,
  Music,
  Trash2,
  Sparkles,
  Star,
  Flame,
  Zap,
} from "lucide-react";

interface CourseLesson {
  id: number;
  moduleId: number;
  title: string;
  order: number;
  contentType: "text" | "video" | "link" | "checklist";
  content: { body?: string; url?: string; items?: string[] } | null;
  durationMinutes: number | null;
}

interface CourseModule {
  id: number;
  courseId: number;
  title: string;
  order: number;
  lessons: CourseLesson[];
}

interface Course {
  id: number;
  slug: string;
  title: string;
  description: string | null;
  level: "basic" | "intermediate" | "advanced";
  estimatedMinutes: number;
  coverUrl: string | null;
}

interface CourseProgress {
  id: number;
  creatorId: number;
  courseId: number;
  startedAt: string;
  completedAt: string | null;
  progressPct: number;
  currentLessonId: number | null;
}

interface CourseWithProgress {
  course: Course;
  progress: CourseProgress | null;
  totalLessons: number;
  completedLessons: number;
}

interface CourseDetails {
  course: Course;
  modules: CourseModule[];
  completedLessonIds: number[];
  progress: CourseProgress | null;
}

interface Inspiration {
  id: number;
  title: string;
  description: string | null;
  platform: "instagram" | "tiktok" | "youtube";
  format: "reels" | "story" | "post" | "ad" | "shorts";
  url: string;
  thumbnailUrl: string | null;
  tags: string[];
  nicheTags: string[];
  isSaved?: boolean;
}

interface InspirationCollection {
  id: number;
  title: string;
  itemCount: number;
}

const levelLabels = {
  basic: "Básico",
  intermediate: "Intermediário",
  advanced: "Avançado",
};

const levelColors = {
  basic: "bg-green-500/20 text-green-400 border-green-500/30",
  intermediate: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  advanced: "bg-red-500/20 text-red-400 border-red-500/30",
};

const contentTypeIcons = {
  text: FileText,
  video: Video,
  link: LinkIcon,
  checklist: ListChecks,
};

const platformColors = {
  instagram: "bg-pink-100 text-pink-800",
  tiktok: "bg-gray-900 text-white",
  youtube: "bg-red-100 text-red-800",
};

const formatLabels = {
  reels: "Reels",
  story: "Story",
  post: "Post",
  ad: "Ad",
  shorts: "Shorts",
};

function PlatformIcon({ platform, className }: { platform: string; className?: string }) {
  if (platform === "instagram") {
    return <Instagram className={className} />;
  }
  if (platform === "youtube") {
    return <Youtube className={className} />;
  }
  if (platform === "tiktok") {
    return <Music className={className} />;
  }
  return null;
}

function AnimatedProgressRing({ 
  progress, 
  size = 120, 
  strokeWidth = 8,
  className = ""
}: { 
  progress: number; 
  size?: number; 
  strokeWidth?: number;
  className?: string;
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (progress / 100) * circumference;
  
  return (
    <div className={`relative ${className}`} style={{ width: size, height: size }}>
      <svg className="transform -rotate-90" width={size} height={size}>
        <circle
          className="text-muted/20"
          strokeWidth={strokeWidth}
          stroke="currentColor"
          fill="transparent"
          r={radius}
          cx={size / 2}
          cy={size / 2}
        />
        <motion.circle
          className="text-primary"
          strokeWidth={strokeWidth}
          stroke="currentColor"
          fill="transparent"
          r={radius}
          cx={size / 2}
          cy={size / 2}
          strokeLinecap="round"
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1, ease: "easeOut" }}
          style={{
            strokeDasharray: circumference,
          }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <motion.span 
          className="text-2xl font-bold"
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5 }}
        >
          {progress}%
        </motion.span>
      </div>
    </div>
  );
}

function StatCard({ 
  icon: Icon, 
  value, 
  label, 
  color,
  delay = 0
}: { 
  icon: React.ComponentType<{ className?: string }>;
  value: number | string;
  label: string;
  color: string;
  delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4 }}
    >
      <Card className="overflow-hidden border-0 bg-gradient-to-br from-card to-card/50 shadow-lg hover:shadow-xl transition-shadow">
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <div className={`p-3 rounded-xl ${color} shadow-lg`}>
              <Icon className="h-6 w-6 text-white" />
            </div>
            <div>
              <motion.p 
                className="text-3xl font-bold"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: delay + 0.2 }}
              >
                {value}
              </motion.p>
              <p className="text-sm text-muted-foreground">{label}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

function CourseCard({ 
  course, 
  progress, 
  totalLessons, 
  completedLessons, 
  onStart, 
  onContinue,
  isStarting,
}: { 
  course: Course;
  progress: CourseProgress | null;
  totalLessons: number;
  completedLessons: number;
  onStart: () => void;
  onContinue: () => void;
  isStarting: boolean;
}) {
  const isCompleted = progress?.completedAt;
  const isInProgress = progress && !progress.completedAt;
  
  const handleClick = () => {
    if (isCompleted || isInProgress) {
      onContinue();
    } else {
      onStart();
    }
  };

  const levelGradients = {
    basic: "from-emerald-600 via-green-500 to-teal-400",
    intermediate: "from-amber-600 via-orange-500 to-yellow-400",
    advanced: "from-rose-600 via-red-500 to-pink-400",
  };
  
  return (
    <motion.div 
      className="group relative flex-shrink-0 w-[300px] cursor-pointer"
      onClick={handleClick}
      data-testid={`card-course-${course.id}`}
      whileHover={{ scale: 1.03, zIndex: 20 }}
      whileTap={{ scale: 0.98 }}
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
    >
      <div className="relative rounded-2xl overflow-hidden bg-gradient-to-br from-gray-900 to-gray-950 shadow-2xl group-hover:shadow-[0_20px_60px_-10px_rgba(0,0,0,0.5)] transition-all duration-500">
        <div className="relative aspect-[16/10] overflow-hidden">
          {course.coverUrl ? (
            <motion.img 
              src={course.coverUrl} 
              alt={course.title}
              className="w-full h-full object-cover"
              whileHover={{ scale: 1.08 }}
              transition={{ duration: 0.6 }}
            />
          ) : (
            <div className={`w-full h-full bg-gradient-to-br ${levelGradients[course.level]} flex items-center justify-center`}>
              <div className="absolute inset-0 bg-black/20" />
              <Video className="h-16 w-16 text-white/60 relative z-10" />
            </div>
          )}
          
          <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/60 to-transparent" />
          
          <div className="absolute top-3 left-3 flex items-center gap-2">
            <Badge className={`bg-gradient-to-r ${levelGradients[course.level]} text-white border-0 shadow-lg text-xs font-semibold px-3`}>
              {levelLabels[course.level]}
            </Badge>
            {isCompleted && (
              <Badge className="bg-green-500 text-white border-0 shadow-lg">
                <CheckCircle2 className="h-3 w-3 mr-1" />
                Concluído
              </Badge>
            )}
          </div>
          
          <div className="absolute top-3 right-3">
            <div className="bg-black/60 backdrop-blur-sm rounded-full p-2">
              <Video className="h-4 w-4 text-white" />
            </div>
          </div>
          
          {isInProgress && (
            <div className="absolute bottom-0 left-0 right-0">
              <div className="h-1.5 bg-white/20">
                <motion.div 
                  className={`h-full bg-gradient-to-r ${levelGradients[course.level]}`}
                  initial={{ width: 0 }}
                  animate={{ width: `${progress.progressPct}%` }}
                  transition={{ duration: 0.8, ease: "easeOut" }}
                />
              </div>
            </div>
          )}
          
          <motion.div 
            className="absolute inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300"
          >
            <Button 
              size="lg" 
              className="bg-white text-black hover:bg-white/90 shadow-2xl font-bold px-8"
              disabled={isStarting}
              data-testid={isInProgress ? `button-continue-${course.id}` : `button-start-${course.id}`}
            >
              {isStarting ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <>
                  <Play className="h-5 w-5 mr-2 fill-current" />
                  {isCompleted ? "Revisar" : isInProgress ? "Continuar" : "Assistir"}
                </>
              )}
            </Button>
          </motion.div>
        </div>
        
        <div className="p-5">
          <h3 className="text-white font-bold text-lg leading-snug line-clamp-2 mb-2 group-hover:text-primary transition-colors">
            {course.title}
          </h3>
          
          {course.description && (
            <p className="text-gray-400 text-sm line-clamp-2 mb-4">
              {course.description}
            </p>
          )}
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4 text-gray-400 text-sm">
              <div className="flex items-center gap-1.5">
                <Video className="h-4 w-4" />
                <span>{totalLessons} aulas</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Clock className="h-4 w-4" />
                <span>{course.estimatedMinutes} min</span>
              </div>
            </div>
            
            {isInProgress && (
              <div className="flex items-center gap-2">
                <div className="w-16 h-1.5 bg-gray-700 rounded-full overflow-hidden">
                  <div 
                    className={`h-full bg-gradient-to-r ${levelGradients[course.level]}`}
                    style={{ width: `${progress.progressPct}%` }}
                  />
                </div>
                <span className="text-xs font-medium text-gray-300">{progress.progressPct}%</span>
              </div>
            )}
          </div>
        </div>
        
        <div className="absolute inset-0 rounded-2xl ring-2 ring-transparent group-hover:ring-primary/40 transition-all duration-300 pointer-events-none" />
      </div>
    </motion.div>
  );
}

function CourseRow({ 
  title, 
  icon: Icon,
  courses, 
  onStart, 
  onContinue,
  isStarting,
  startingCourseId,
}: { 
  title: string;
  icon?: React.ComponentType<{ className?: string }>;
  courses: CourseWithProgress[];
  onStart: (courseId: number) => void;
  onContinue: (courseId: number) => void;
  isStarting: boolean;
  startingCourseId: number | null;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  
  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = 320;
      scrollRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth',
      });
    }
  };
  
  if (courses.length === 0) return null;
  
  return (
    <div className="relative group/row">
      <div className="flex items-center gap-2 mb-3">
        {Icon && <Icon className="h-5 w-5 text-primary" />}
        <h2 className="text-lg font-semibold text-foreground">{title}</h2>
        <Badge variant="secondary" className="ml-2">{courses.length}</Badge>
      </div>
      
      <div className="relative">
        <Button
          variant="ghost"
          size="icon"
          className="absolute left-0 top-1/2 -translate-y-1/2 z-20 bg-black/60 hover:bg-black/80 text-white opacity-0 group-hover/row:opacity-100 transition-opacity -ml-4 h-20 w-10 rounded-r-lg"
          onClick={() => scroll('left')}
        >
          <ChevronLeft className="h-6 w-6" />
        </Button>
        
        <div 
          ref={scrollRef}
          className="flex gap-5 overflow-x-auto scrollbar-hide pb-6 px-2"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {courses.map(({ course, progress, totalLessons, completedLessons }) => (
            <CourseCard
              key={course.id}
              course={course}
              progress={progress}
              totalLessons={totalLessons}
              completedLessons={completedLessons}
              onStart={() => onStart(course.id)}
              onContinue={() => onContinue(course.id)}
              isStarting={isStarting && startingCourseId === course.id}
            />
          ))}
        </div>
        
        <Button
          variant="ghost"
          size="icon"
          className="absolute right-0 top-1/2 -translate-y-1/2 z-20 bg-black/60 hover:bg-black/80 text-white opacity-0 group-hover/row:opacity-100 transition-opacity -mr-4 h-20 w-10 rounded-l-lg"
          onClick={() => scroll('right')}
        >
          <ChevronRight className="h-6 w-6" />
        </Button>
      </div>
    </div>
  );
}

function HeroSection({ 
  course, 
  progress, 
  onContinue 
}: { 
  course: CourseWithProgress | null;
  progress: { coursesInProgress: number; coursesCompleted: number; totalMinutesLearned: number } | null;
  onContinue: () => void;
}) {
  if (!course) {
    return (
      <motion.div 
        className="relative rounded-3xl overflow-hidden mb-10"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-primary/30 via-purple-600/20 to-transparent" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,_var(--tw-gradient-stops))] from-pink-500/20 via-transparent to-transparent" />
        
        <div className="relative z-10 p-10 md:p-16">
          <motion.div 
            className="flex items-center gap-4 mb-6"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            <div className="p-4 rounded-2xl bg-gradient-to-br from-primary to-purple-600 shadow-lg shadow-primary/30">
              <Video className="h-10 w-10 text-white" />
            </div>
            <div>
              <h1 className="text-4xl md:text-5xl font-bold text-white">
                Creator Academy
              </h1>
              <p className="text-gray-400 text-lg mt-1">Domine a arte de criar conteúdo</p>
            </div>
          </motion.div>
          
          <motion.p 
            className="text-gray-300 max-w-2xl text-xl mb-10 leading-relaxed"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            Aprenda com os melhores. Cursos em vídeo criados por especialistas para transformar você em um creator de alta performance.
          </motion.p>
          
          {progress && (
            <motion.div 
              className="flex flex-wrap gap-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10 min-w-[140px]">
                <p className="text-5xl font-bold text-white">{progress.coursesCompleted}</p>
                <p className="text-gray-400 mt-1">Concluídos</p>
              </div>
              <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10 min-w-[140px]">
                <p className="text-5xl font-bold text-white">{progress.totalMinutesLearned}</p>
                <p className="text-gray-400 mt-1">Minutos</p>
              </div>
              <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10 min-w-[140px]">
                <p className="text-5xl font-bold text-white">{progress.coursesInProgress}</p>
                <p className="text-gray-400 mt-1">Em Andamento</p>
              </div>
            </motion.div>
          )}
        </div>
        
        <div className="absolute -right-32 -top-32 w-96 h-96 bg-primary/30 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute -left-32 -bottom-32 w-80 h-80 bg-purple-500/30 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute right-20 bottom-10 w-60 h-60 bg-pink-500/20 rounded-full blur-[80px] pointer-events-none" />
      </motion.div>
    );
  }
  
  const { course: currentCourse, progress: courseProgress, completedLessons, totalLessons } = course;
  
  const levelGradients = {
    basic: "from-emerald-600 to-teal-500",
    intermediate: "from-amber-600 to-orange-500",
    advanced: "from-rose-600 to-pink-500",
  };
  
  return (
    <motion.div 
      className="relative rounded-3xl overflow-hidden mb-10 min-h-[320px]"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
        {currentCourse.coverUrl ? (
          <motion.img 
            src={currentCourse.coverUrl} 
            alt={currentCourse.title}
            className="w-full h-full object-cover opacity-40"
            initial={{ scale: 1.1 }}
            animate={{ scale: 1 }}
            transition={{ duration: 1 }}
          />
        ) : (
          <div className={`absolute inset-0 bg-gradient-to-br ${levelGradients[currentCourse.level]} opacity-30`} />
        )}
        <div className="absolute inset-0 bg-gradient-to-r from-gray-900 via-gray-900/95 to-gray-900/70" />
        <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-transparent to-gray-900/50" />
      </div>
      
      <div className="relative z-10 p-10 md:p-12 flex flex-col lg:flex-row lg:items-center gap-10">
        <div className="flex-1">
          <motion.div 
            className="flex items-center gap-3 mb-4"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            <div className={`flex items-center gap-2 bg-gradient-to-r ${levelGradients[currentCourse.level]} rounded-full px-4 py-2 shadow-lg`}>
              <Play className="h-4 w-4 fill-current text-white" />
              <span className="font-semibold text-white text-sm">Continuar assistindo</span>
            </div>
          </motion.div>
          
          <motion.h1 
            className="text-3xl md:text-5xl font-bold text-white mb-4 max-w-2xl leading-tight"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            {currentCourse.title}
          </motion.h1>
          
          {currentCourse.description && (
            <motion.p 
              className="text-gray-300 max-w-xl line-clamp-2 mb-6 text-lg"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
            >
              {currentCourse.description}
            </motion.p>
          )}
          
          <motion.div 
            className="flex flex-wrap items-center gap-4 mb-8"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            <Badge className={`bg-gradient-to-r ${levelGradients[currentCourse.level]} text-white border-0 px-4 py-1 text-sm font-semibold`}>
              {levelLabels[currentCourse.level]}
            </Badge>
            <div className="flex items-center gap-2 text-gray-300 bg-white/10 backdrop-blur-sm rounded-full px-4 py-2">
              <Video className="h-4 w-4" />
              <span className="font-medium">{totalLessons} aulas</span>
            </div>
            <div className="flex items-center gap-2 text-gray-300 bg-white/10 backdrop-blur-sm rounded-full px-4 py-2">
              <Clock className="h-4 w-4" />
              <span className="font-medium">{currentCourse.estimatedMinutes} min</span>
            </div>
          </motion.div>
          
          <motion.div 
            className="flex items-center gap-4"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
          >
            <Button 
              onClick={onContinue} 
              size="lg" 
              className="bg-white text-black hover:bg-white/90 shadow-2xl font-bold px-8 h-14 text-lg"
              data-testid="button-hero-continue"
            >
              <Play className="h-6 w-6 mr-2 fill-current" />
              Continuar
            </Button>
            <Button 
              variant="outline" 
              size="lg"
              className="backdrop-blur-sm bg-white/10 border-white/20 text-white hover:bg-white/20 h-14 px-8"
              onClick={onContinue}
            >
              Ver módulos
            </Button>
          </motion.div>
        </div>
        
        <motion.div 
          className="hidden lg:flex flex-col items-center"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.4, type: "spring" }}
        >
          <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-8 border border-white/20 shadow-2xl">
            <AnimatedProgressRing 
              progress={courseProgress?.progressPct || 0} 
              size={160}
              strokeWidth={12}
              className="text-white"
            />
            <div className="text-center mt-4">
              <p className="text-gray-400 text-sm">Seu progresso</p>
              <p className="text-white font-semibold">{completedLessons} de {totalLessons} aulas</p>
            </div>
          </div>
        </motion.div>
      </div>
      
      <div className="absolute -right-32 -top-32 w-96 h-96 bg-primary/20 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute -left-20 -bottom-20 w-60 h-60 bg-purple-500/20 rounded-full blur-[80px] pointer-events-none" />
    </motion.div>
  );
}

export default function AcademyPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedCourseId, setSelectedCourseId] = useState<number | null>(null);
  const [selectedLesson, setSelectedLesson] = useState<CourseLesson | null>(null);
  const [startingCourseId, setStartingCourseId] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<"courses" | "progress" | "inspirations">("courses");
  
  const [inspirationsTab, setInspirationsTab] = useState<"all" | "saved" | "collections">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [platformFilter, setPlatformFilter] = useState<string | null>(null);
  const [formatFilter, setFormatFilter] = useState<string | null>(null);
  const [selectedCollectionId, setSelectedCollectionId] = useState<number | null>(null);
  const [newCollectionTitle, setNewCollectionTitle] = useState("");
  const [showNewCollectionDialog, setShowNewCollectionDialog] = useState(false);
  const [addToCollectionInspirationId, setAddToCollectionInspirationId] = useState<number | null>(null);
  
  const { data: coursesWithProgress = [], isLoading } = useQuery<CourseWithProgress[]>({
    queryKey: ["/api/creator/courses"],
  });
  
  const { data: courseDetails, isLoading: courseDetailsLoading } = useQuery<CourseDetails>({
    queryKey: ["/api/creator/courses", selectedCourseId],
    queryFn: async () => {
      const res = await fetch(`/api/creator/courses/${selectedCourseId}`);
      return res.json();
    },
    enabled: !!selectedCourseId,
  });
  
  const { data: summary } = useQuery<{
    coursesInProgress: number;
    coursesCompleted: number;
    totalMinutesLearned: number;
    nextCourse: { id: number; title: string; progressPct: number } | null;
  }>({
    queryKey: ["/api/creator/academy/summary"],
  });
  
  const buildInspirationsQueryParams = () => {
    const params = new URLSearchParams();
    if (searchQuery) params.set("query", searchQuery);
    if (platformFilter) params.set("platform", platformFilter);
    if (formatFilter) params.set("format", formatFilter);
    return params.toString();
  };
  
  const { data: inspirations = [], isLoading: inspirationsLoading } = useQuery<Inspiration[]>({
    queryKey: ["/api/creator/inspirations", searchQuery, platformFilter, formatFilter],
    queryFn: async () => {
      const queryParams = buildInspirationsQueryParams();
      const url = `/api/creator/inspirations${queryParams ? `?${queryParams}` : ""}`;
      const res = await fetch(url);
      return res.json();
    },
  });
  
  const { data: savedInspirations = [], isLoading: savedInspirationsLoading } = useQuery<Inspiration[]>({
    queryKey: ["/api/creator/saved-inspirations"],
  });
  
  const { data: collections = [], isLoading: collectionsLoading } = useQuery<InspirationCollection[]>({
    queryKey: ["/api/creator/collections"],
  });
  
  const { data: collectionItems = [], isLoading: collectionItemsLoading } = useQuery<Inspiration[]>({
    queryKey: ["/api/creator/collections", selectedCollectionId],
    queryFn: async () => {
      const res = await fetch(`/api/creator/collections/${selectedCollectionId}`);
      return res.json();
    },
    enabled: !!selectedCollectionId,
  });
  
  const startCourseMutation = useMutation({
    mutationFn: async (courseId: number) => {
      setStartingCourseId(courseId);
      const res = await apiRequest("POST", `/api/creator/courses/${courseId}/start`);
      return res.json();
    },
    onSuccess: (_, courseId) => {
      queryClient.invalidateQueries({ queryKey: ["/api/creator/courses"] });
      queryClient.invalidateQueries({ queryKey: ["/api/creator/academy/summary"] });
      setSelectedCourseId(courseId);
      setStartingCourseId(null);
    },
    onError: () => {
      setStartingCourseId(null);
    },
  });
  
  const completeLessonMutation = useMutation({
    mutationFn: async (lessonId: number) => {
      const res = await apiRequest("POST", `/api/creator/lessons/${lessonId}/complete`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/creator/courses", selectedCourseId] });
      queryClient.invalidateQueries({ queryKey: ["/api/creator/courses"] });
      queryClient.invalidateQueries({ queryKey: ["/api/creator/academy/summary"] });
      toast({ title: "Lição concluída!", description: "Parabéns pelo seu progresso!" });
    },
  });
  
  const saveInspirationMutation = useMutation({
    mutationFn: async (inspirationId: number) => {
      const res = await apiRequest("POST", `/api/creator/inspirations/${inspirationId}/save`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/creator/inspirations"] });
      queryClient.invalidateQueries({ queryKey: ["/api/creator/saved-inspirations"] });
      toast({ title: "Salvo!", description: "Inspiração adicionada aos seus salvos." });
    },
  });
  
  const unsaveInspirationMutation = useMutation({
    mutationFn: async (inspirationId: number) => {
      const res = await apiRequest("DELETE", `/api/creator/inspirations/${inspirationId}/save`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/creator/inspirations"] });
      queryClient.invalidateQueries({ queryKey: ["/api/creator/saved-inspirations"] });
      toast({ title: "Removido", description: "Inspiração removida dos seus salvos." });
    },
  });
  
  const createCollectionMutation = useMutation({
    mutationFn: async (title: string) => {
      const res = await apiRequest("POST", "/api/creator/collections", { title });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/creator/collections"] });
      setNewCollectionTitle("");
      setShowNewCollectionDialog(false);
      toast({ title: "Coleção criada!", description: "Sua nova coleção foi criada com sucesso." });
    },
  });
  
  const addToCollectionMutation = useMutation({
    mutationFn: async ({ collectionId, inspirationId }: { collectionId: number; inspirationId: number }) => {
      const res = await apiRequest("POST", `/api/creator/collections/${collectionId}/items`, { inspirationId });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/creator/collections"] });
      if (selectedCollectionId) {
        queryClient.invalidateQueries({ queryKey: ["/api/creator/collections", selectedCollectionId] });
      }
      setAddToCollectionInspirationId(null);
      toast({ title: "Adicionado!", description: "Inspiração adicionada à coleção." });
    },
  });
  
  const removeFromCollectionMutation = useMutation({
    mutationFn: async ({ collectionId, inspirationId }: { collectionId: number; inspirationId: number }) => {
      const res = await apiRequest("DELETE", `/api/creator/collections/${collectionId}/items/${inspirationId}`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/creator/collections"] });
      if (selectedCollectionId) {
        queryClient.invalidateQueries({ queryKey: ["/api/creator/collections", selectedCollectionId] });
      }
      toast({ title: "Removido", description: "Inspiração removida da coleção." });
    },
  });
  
  const deleteCollectionMutation = useMutation({
    mutationFn: async (collectionId: number) => {
      const res = await apiRequest("DELETE", `/api/creator/collections/${collectionId}`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/creator/collections"] });
      setSelectedCollectionId(null);
      toast({ title: "Coleção excluída", description: "A coleção foi removida." });
    },
  });
  
  const handleStartCourse = async (courseId: number) => {
    await startCourseMutation.mutateAsync(courseId);
  };
  
  const handleContinueCourse = (courseId: number) => {
    setSelectedCourseId(courseId);
  };
  
  const handleOpenLesson = (lesson: CourseLesson) => {
    setSelectedLesson(lesson);
  };
  
  const handleCompleteLesson = async () => {
    if (!selectedLesson) return;
    await completeLessonMutation.mutateAsync(selectedLesson.id);
    setSelectedLesson(null);
  };
  
  const isLessonCompleted = (lessonId: number) => {
    return courseDetails?.completedLessonIds.includes(lessonId) ?? false;
  };
  
  const handleToggleSave = (inspiration: Inspiration) => {
    if (inspiration.isSaved) {
      unsaveInspirationMutation.mutate(inspiration.id);
    } else {
      saveInspirationMutation.mutate(inspiration.id);
    }
  };
  
  const handleCreateCollection = () => {
    if (!newCollectionTitle.trim()) return;
    createCollectionMutation.mutate(newCollectionTitle.trim());
  };
  
  const handleAddToCollection = (collectionId: number) => {
    if (!addToCollectionInspirationId) return;
    addToCollectionMutation.mutate({ collectionId, inspirationId: addToCollectionInspirationId });
  };
  
  const clearFilters = () => {
    setSearchQuery("");
    setPlatformFilter(null);
    setFormatFilter(null);
  };
  
  const inProgressCourses = coursesWithProgress.filter(c => c.progress && !c.progress.completedAt);
  const completedCourses = coursesWithProgress.filter(c => c.progress?.completedAt);
  const notStartedCourses = coursesWithProgress.filter(c => !c.progress);
  const basicCourses = coursesWithProgress.filter(c => c.course.level === 'basic');
  const intermediateCourses = coursesWithProgress.filter(c => c.course.level === 'intermediate');
  const advancedCourses = coursesWithProgress.filter(c => c.course.level === 'advanced');
  
  const currentCourse = inProgressCourses.length > 0 ? inProgressCourses[0] : null;
  
  const displayedInspirations = inspirationsTab === "saved" 
    ? savedInspirations 
    : inspirationsTab === "collections" && selectedCollectionId 
      ? collectionItems 
      : inspirations;
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }
  
  return (
    <div className="min-h-screen" data-testid="academy-page">
      <div className="px-6 py-4">
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "courses" | "progress" | "inspirations")}>
          <div className="flex items-center justify-between mb-6">
            <TabsList>
              <TabsTrigger value="courses" data-testid="tab-courses">
                <GraduationCap className="h-4 w-4 mr-2" />
                Cursos
              </TabsTrigger>
              <TabsTrigger value="progress" data-testid="tab-progress">
                <Award className="h-4 w-4 mr-2" />
                Meu Progresso
              </TabsTrigger>
              <TabsTrigger value="inspirations" data-testid="tab-inspirations">
                <Sparkles className="h-4 w-4 mr-2" />
                Inspirações
              </TabsTrigger>
            </TabsList>
            
            {summary && (
              <div className="hidden md:flex items-center gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <Trophy className="h-4 w-4 text-green-500" />
                  <span><strong>{summary.coursesCompleted}</strong> concluídos</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-blue-500" />
                  <span><strong>{summary.totalMinutesLearned}</strong> min aprendidos</span>
                </div>
              </div>
            )}
          </div>
          
          <TabsContent value="courses" className="mt-0 space-y-8">
            <HeroSection 
              course={currentCourse}
              progress={summary ? { 
                coursesInProgress: summary.coursesInProgress,
                coursesCompleted: summary.coursesCompleted,
                totalMinutesLearned: summary.totalMinutesLearned,
              } : null}
              onContinue={() => currentCourse && handleContinueCourse(currentCourse.course.id)}
            />
            
            <CourseRow
              title="Continuar Assistindo"
              icon={Play}
              courses={inProgressCourses}
              onStart={handleStartCourse}
              onContinue={handleContinueCourse}
              isStarting={startCourseMutation.isPending}
              startingCourseId={startingCourseId}
            />
            
            <CourseRow
              title="Para Você Começar"
              icon={Star}
              courses={notStartedCourses.slice(0, 10)}
              onStart={handleStartCourse}
              onContinue={handleContinueCourse}
              isStarting={startCourseMutation.isPending}
              startingCourseId={startingCourseId}
            />
            
            <CourseRow
              title="Nível Básico"
              icon={Zap}
              courses={basicCourses}
              onStart={handleStartCourse}
              onContinue={handleContinueCourse}
              isStarting={startCourseMutation.isPending}
              startingCourseId={startingCourseId}
            />
            
            <CourseRow
              title="Nível Intermediário"
              icon={Flame}
              courses={intermediateCourses}
              onStart={handleStartCourse}
              onContinue={handleContinueCourse}
              isStarting={startCourseMutation.isPending}
              startingCourseId={startingCourseId}
            />
            
            <CourseRow
              title="Nível Avançado"
              icon={Trophy}
              courses={advancedCourses}
              onStart={handleStartCourse}
              onContinue={handleContinueCourse}
              isStarting={startCourseMutation.isPending}
              startingCourseId={startingCourseId}
            />
            
            {completedCourses.length > 0 && (
              <CourseRow
                title="Concluídos"
                icon={CheckCircle2}
                courses={completedCourses}
                onStart={handleStartCourse}
                onContinue={handleContinueCourse}
                isStarting={startCourseMutation.isPending}
                startingCourseId={startingCourseId}
              />
            )}
          </TabsContent>
          
          <TabsContent value="progress" className="mt-0 space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard 
                icon={BookOpen}
                value={summary?.coursesInProgress || 0}
                label="Em andamento"
                color="bg-gradient-to-br from-blue-500 to-blue-600"
                delay={0}
              />
              <StatCard 
                icon={Trophy}
                value={summary?.coursesCompleted || 0}
                label="Concluídos"
                color="bg-gradient-to-br from-green-500 to-emerald-600"
                delay={0.1}
              />
              <StatCard 
                icon={Clock}
                value={summary?.totalMinutesLearned || 0}
                label="Minutos aprendidos"
                color="bg-gradient-to-br from-purple-500 to-violet-600"
                delay={0.2}
              />
              <StatCard 
                icon={Target}
                value={coursesWithProgress.length}
                label="Cursos disponíveis"
                color="bg-gradient-to-br from-orange-500 to-amber-600"
                delay={0.3}
              />
            </div>
            
            {summary?.nextCourse && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                <Card className="border-0 bg-gradient-to-r from-primary/10 via-purple-500/10 to-pink-500/10 overflow-hidden">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="p-3 rounded-xl bg-primary/20">
                          <Zap className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground mb-1">Próximo passo sugerido</p>
                          <h3 className="text-lg font-bold">{summary.nextCourse.title}</h3>
                          <p className="text-sm text-muted-foreground">{summary.nextCourse.progressPct}% concluído</p>
                        </div>
                      </div>
                      <Button 
                        onClick={() => handleContinueCourse(summary.nextCourse!.id)}
                        className="bg-primary hover:bg-primary/90"
                      >
                        <Play className="h-4 w-4 mr-2" />
                        Continuar
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <motion.div
                className="lg:col-span-1"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 }}
              >
                <Card className="h-full border-0 shadow-lg">
                  <CardHeader className="pb-4">
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <div className="p-2 rounded-lg bg-gradient-to-br from-green-500 to-emerald-600">
                        <Trophy className="h-4 w-4 text-white" />
                      </div>
                      Cursos Concluídos
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {completedCourses.length === 0 ? (
                      <div className="text-center py-8">
                        <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center mx-auto mb-4">
                          <Trophy className="h-8 w-8 text-muted-foreground/50" />
                        </div>
                        <p className="text-muted-foreground mb-2">Nenhum curso concluído ainda</p>
                        <p className="text-sm text-muted-foreground/70">Continue aprendendo para ganhar sua primeira conquista!</p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {completedCourses.slice(0, 5).map(({ course }, index) => (
                          <motion.div 
                            key={course.id}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.6 + index * 0.1 }}
                            className="flex items-center gap-3 p-3 rounded-xl bg-gradient-to-r from-green-500/10 to-emerald-500/5 cursor-pointer hover:from-green-500/20 hover:to-emerald-500/10 transition-all group"
                            onClick={() => handleContinueCourse(course.id)}
                          >
                            <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0">
                              <CheckCircle2 className="h-4 w-4 text-white" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium truncate text-sm">{course.title}</p>
                              <p className="text-xs text-muted-foreground">{course.estimatedMinutes} min</p>
                            </div>
                            <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                          </motion.div>
                        ))}
                        {completedCourses.length > 5 && (
                          <p className="text-sm text-center text-muted-foreground pt-2">
                            +{completedCourses.length - 5} cursos concluídos
                          </p>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
              
              <motion.div
                className="lg:col-span-2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 }}
              >
                <Card className="h-full border-0 shadow-lg">
                  <CardHeader className="pb-4">
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600">
                        <BookOpen className="h-4 w-4 text-white" />
                      </div>
                      Em Andamento
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {inProgressCourses.length === 0 ? (
                      <div className="text-center py-8">
                        <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center mx-auto mb-4">
                          <BookOpen className="h-8 w-8 text-muted-foreground/50" />
                        </div>
                        <p className="text-muted-foreground mb-2">Nenhum curso em andamento</p>
                        <p className="text-sm text-muted-foreground/70 mb-4">Explore nossos cursos e comece sua jornada de aprendizado!</p>
                        <Button variant="outline" onClick={() => setActiveTab("courses")}>
                          <GraduationCap className="h-4 w-4 mr-2" />
                          Ver Cursos
                        </Button>
                      </div>
                    ) : (
                      <div className="grid gap-3">
                        {inProgressCourses.map(({ course, progress }, index) => (
                          <motion.div 
                            key={course.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.6 + index * 0.1 }}
                            className="p-4 rounded-xl border bg-card hover:shadow-md transition-all cursor-pointer group"
                            onClick={() => handleContinueCourse(course.id)}
                          >
                            <div className="flex items-start gap-4">
                              <AnimatedProgressRing 
                                progress={progress?.progressPct || 0}
                                size={60}
                                strokeWidth={5}
                                className="flex-shrink-0"
                              />
                              <div className="flex-1 min-w-0">
                                <div className="flex items-start justify-between gap-2 mb-1">
                                  <h4 className="font-semibold truncate">{course.title}</h4>
                                  <Badge variant="outline" className={`text-xs flex-shrink-0 ${levelColors[course.level]}`}>
                                    {levelLabels[course.level]}
                                  </Badge>
                                </div>
                                <p className="text-sm text-muted-foreground mb-2">{course.estimatedMinutes} min total</p>
                                <Button 
                                  size="sm" 
                                  className="opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                  <Play className="h-3 w-3 mr-1" />
                                  Continuar
                                </Button>
                              </div>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            </div>
          </TabsContent>
          
          <TabsContent value="inspirations" className="mt-0 space-y-6" data-testid="inspirations-content">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar inspirações..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                  data-testid="input-search-inspirations"
                />
              </div>
              <div className="flex gap-2">
                <Select
                  value={platformFilter || "all"}
                  onValueChange={(value) => setPlatformFilter(value === "all" ? null : value)}
                >
                  <SelectTrigger className="w-[140px]" data-testid="select-platform-filter">
                    <SelectValue placeholder="Plataforma" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas</SelectItem>
                    <SelectItem value="instagram">Instagram</SelectItem>
                    <SelectItem value="tiktok">TikTok</SelectItem>
                    <SelectItem value="youtube">YouTube</SelectItem>
                  </SelectContent>
                </Select>
                <Select
                  value={formatFilter || "all"}
                  onValueChange={(value) => setFormatFilter(value === "all" ? null : value)}
                >
                  <SelectTrigger className="w-[120px]" data-testid="select-format-filter">
                    <SelectValue placeholder="Formato" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="reels">Reels</SelectItem>
                    <SelectItem value="story">Story</SelectItem>
                    <SelectItem value="post">Post</SelectItem>
                    <SelectItem value="ad">Ad</SelectItem>
                    <SelectItem value="shorts">Shorts</SelectItem>
                  </SelectContent>
                </Select>
                {(searchQuery || platformFilter || formatFilter) && (
                  <Button variant="ghost" size="icon" onClick={clearFilters} data-testid="button-clear-filters">
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
            
            <div className="flex gap-2 border-b pb-2">
              <Button
                variant={inspirationsTab === "all" ? "default" : "ghost"}
                size="sm"
                onClick={() => { setInspirationsTab("all"); setSelectedCollectionId(null); }}
                data-testid="button-tab-all"
              >
                Todas
              </Button>
              <Button
                variant={inspirationsTab === "saved" ? "default" : "ghost"}
                size="sm"
                onClick={() => { setInspirationsTab("saved"); setSelectedCollectionId(null); }}
                data-testid="button-tab-saved"
              >
                <BookmarkCheck className="h-4 w-4 mr-1" />
                Salvas
              </Button>
              <Button
                variant={inspirationsTab === "collections" ? "default" : "ghost"}
                size="sm"
                onClick={() => { setInspirationsTab("collections"); setSelectedCollectionId(null); }}
                data-testid="button-tab-collections"
              >
                <FolderOpen className="h-4 w-4 mr-1" />
                Coleções
              </Button>
            </div>
            
            {inspirationsTab === "collections" && !selectedCollectionId ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">Suas Coleções</h3>
                  <Button onClick={() => setShowNewCollectionDialog(true)} size="sm" data-testid="button-new-collection">
                    <Plus className="h-4 w-4 mr-1" />
                    Nova Coleção
                  </Button>
                </div>
                
                {collectionsLoading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin" />
                  </div>
                ) : collections.length === 0 ? (
                  <Card className="p-8 text-center">
                    <FolderOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">Você ainda não tem coleções.</p>
                    <p className="text-sm text-muted-foreground">Crie uma coleção para organizar suas inspirações.</p>
                  </Card>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {collections.map((collection) => (
                      <Card
                        key={collection.id}
                        className="cursor-pointer hover:shadow-lg transition-shadow"
                        onClick={() => setSelectedCollectionId(collection.id)}
                        data-testid={`card-collection-${collection.id}`}
                      >
                        <CardHeader>
                          <div className="flex items-start justify-between">
                            <div>
                              <CardTitle className="text-lg">{collection.title}</CardTitle>
                              <CardDescription>{collection.itemCount} itens</CardDescription>
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteCollectionMutation.mutate(collection.id);
                              }}
                              data-testid={`button-delete-collection-${collection.id}`}
                            >
                              <Trash2 className="h-4 w-4 text-red-500" />
                            </Button>
                          </div>
                        </CardHeader>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <>
                {inspirationsTab === "collections" && selectedCollectionId && (
                  <div className="flex items-center gap-2 mb-4">
                    <Button variant="ghost" size="sm" onClick={() => setSelectedCollectionId(null)} data-testid="button-back-to-collections">
                      <ChevronRight className="h-4 w-4 rotate-180 mr-1" />
                      Voltar
                    </Button>
                    <span className="text-muted-foreground">|</span>
                    <span className="font-medium">
                      {collections.find(c => c.id === selectedCollectionId)?.title}
                    </span>
                  </div>
                )}
                
                {(inspirationsLoading || savedInspirationsLoading || collectionItemsLoading) ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin" />
                  </div>
                ) : displayedInspirations.length === 0 ? (
                  <Card className="p-8 text-center">
                    <Bookmark className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">
                      {inspirationsTab === "saved" 
                        ? "Você ainda não salvou nenhuma inspiração." 
                        : inspirationsTab === "collections" && selectedCollectionId
                          ? "Esta coleção está vazia."
                          : "Nenhuma inspiração encontrada."}
                    </p>
                  </Card>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {displayedInspirations.map((inspiration) => (
                      <Card key={inspiration.id} className="overflow-hidden group" data-testid={`card-inspiration-${inspiration.id}`}>
                        {inspiration.thumbnailUrl && (
                          <div className="aspect-video bg-muted relative overflow-hidden">
                            <img
                              src={inspiration.thumbnailUrl}
                              alt={inspiration.title}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                            <div className="absolute top-2 right-2">
                              <Badge className={platformColors[inspiration.platform]}>
                                <PlatformIcon platform={inspiration.platform} className="h-3 w-3" />
                              </Badge>
                            </div>
                          </div>
                        )}
                        <CardHeader className="pb-2">
                          <CardTitle className="text-base line-clamp-2">{inspiration.title}</CardTitle>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline">{formatLabels[inspiration.format]}</Badge>
                          </div>
                        </CardHeader>
                        <CardContent className="pb-3">
                          {inspiration.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1 mb-3">
                              {inspiration.tags.slice(0, 3).map((tag) => (
                                <Badge key={tag} variant="secondary" className="text-xs">
                                  {tag}
                                </Badge>
                              ))}
                            </div>
                          )}
                          <div className="flex gap-2">
                            <Button
                              variant={inspiration.isSaved ? "default" : "outline"}
                              size="sm"
                              className="flex-1"
                              onClick={() => handleToggleSave(inspiration)}
                              disabled={saveInspirationMutation.isPending || unsaveInspirationMutation.isPending}
                              data-testid={`button-save-${inspiration.id}`}
                            >
                              {inspiration.isSaved ? (
                                <BookmarkCheck className="h-4 w-4" />
                              ) : (
                                <Bookmark className="h-4 w-4" />
                              )}
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              asChild
                              data-testid={`button-open-${inspiration.id}`}
                            >
                              <a href={inspiration.url} target="_blank" rel="noopener noreferrer">
                                <ExternalLink className="h-4 w-4" />
                              </a>
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setAddToCollectionInspirationId(inspiration.id)}
                              data-testid={`button-add-to-collection-${inspiration.id}`}
                            >
                              <Plus className="h-4 w-4" />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </>
            )}
          </TabsContent>
        </Tabs>
      </div>
      
      {selectedCourseId && courseDetails && (
        <Dialog open={!!selectedCourseId} onOpenChange={(open) => !open && setSelectedCourseId(null)}>
          <DialogContent className="max-w-2xl max-h-[80vh]">
            <DialogHeader>
              <DialogTitle>{courseDetails.course.title}</DialogTitle>
            </DialogHeader>
            <ScrollArea className="max-h-[60vh] pr-4">
              {courseDetailsLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              ) : (
                <div className="space-y-4">
                  <p className="text-muted-foreground">{courseDetails.course.description}</p>
                  
                  <div className="flex gap-2">
                    <Badge className={levelColors[courseDetails.course.level]}>
                      {levelLabels[courseDetails.course.level]}
                    </Badge>
                    <Badge variant="outline">
                      <Clock className="h-3 w-3 mr-1" />
                      {courseDetails.course.estimatedMinutes} min
                    </Badge>
                  </div>
                  
                  <Accordion type="multiple" className="w-full">
                    {courseDetails.modules.map((module) => (
                      <AccordionItem key={module.id} value={`module-${module.id}`}>
                        <AccordionTrigger className="hover:no-underline">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{module.title}</span>
                            <Badge variant="secondary" className="text-xs">
                              {module.lessons.filter(l => isLessonCompleted(l.id)).length}/{module.lessons.length}
                            </Badge>
                          </div>
                        </AccordionTrigger>
                        <AccordionContent>
                          <div className="space-y-2 pl-2">
                            {module.lessons.map((lesson) => {
                              const completed = isLessonCompleted(lesson.id);
                              const Icon = contentTypeIcons[lesson.contentType];
                              return (
                                <button
                                  key={lesson.id}
                                  onClick={() => handleOpenLesson(lesson)}
                                  className={`w-full flex items-center gap-3 p-3 rounded-lg text-left transition-colors ${
                                    completed 
                                      ? "bg-green-50 hover:bg-green-100 dark:bg-green-900/20 dark:hover:bg-green-900/30" 
                                      : "bg-muted/50 hover:bg-muted"
                                  }`}
                                  data-testid={`lesson-${lesson.id}`}
                                >
                                  {completed ? (
                                    <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0" />
                                  ) : (
                                    <Circle className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                                  )}
                                  <Icon className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                                  <div className="flex-1 min-w-0">
                                    <p className={`text-sm ${completed ? "text-green-800 dark:text-green-400" : ""}`}>
                                      {lesson.title}
                                    </p>
                                    {lesson.durationMinutes && (
                                      <p className="text-xs text-muted-foreground">
                                        {lesson.durationMinutes} min
                                      </p>
                                    )}
                                  </div>
                                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                                </button>
                              );
                            })}
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                </div>
              )}
            </ScrollArea>
          </DialogContent>
        </Dialog>
      )}
      
      {selectedLesson && (
        <Dialog open={!!selectedLesson} onOpenChange={(open) => !open && setSelectedLesson(null)}>
          <DialogContent className="max-w-2xl max-h-[80vh]">
            <DialogHeader>
              <DialogTitle>{selectedLesson.title}</DialogTitle>
            </DialogHeader>
            <ScrollArea className="max-h-[50vh] pr-4">
              <div className="space-y-4">
                {selectedLesson.contentType === "text" && selectedLesson.content?.body && (
                  <div className="prose prose-sm max-w-none dark:prose-invert">
                    {selectedLesson.content.body.split("\n").map((paragraph, i) => (
                      <p key={i} className="whitespace-pre-wrap">{paragraph}</p>
                    ))}
                  </div>
                )}
                
                {selectedLesson.contentType === "video" && selectedLesson.content?.url && (
                  <div className="aspect-video">
                    <video 
                      src={selectedLesson.content.url} 
                      controls 
                      className="w-full h-full rounded-lg"
                    />
                  </div>
                )}
                
                {selectedLesson.contentType === "link" && selectedLesson.content?.url && (
                  <a 
                    href={selectedLesson.content.url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-primary hover:underline"
                  >
                    <LinkIcon className="h-4 w-4" />
                    Acessar conteúdo externo
                  </a>
                )}
                
                {selectedLesson.contentType === "checklist" && selectedLesson.content?.items && (
                  <div className="space-y-3">
                    <p className="text-sm text-muted-foreground">
                      Revise cada item antes de continuar:
                    </p>
                    {selectedLesson.content.items.map((item, i) => (
                      <div key={i} className="flex items-start gap-3">
                        <Checkbox id={`check-${i}`} />
                        <label htmlFor={`check-${i}`} className="text-sm leading-relaxed cursor-pointer">
                          {item}
                        </label>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </ScrollArea>
            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button variant="outline" onClick={() => setSelectedLesson(null)}>
                Voltar
              </Button>
              {!isLessonCompleted(selectedLesson.id) && (
                <Button 
                  onClick={handleCompleteLesson}
                  disabled={completeLessonMutation.isPending}
                  data-testid="button-complete-lesson"
                >
                  {completeLessonMutation.isPending ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                  )}
                  Marcar como concluída
                </Button>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}
      
      <Dialog open={showNewCollectionDialog} onOpenChange={setShowNewCollectionDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Nova Coleção</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              placeholder="Nome da coleção"
              value={newCollectionTitle}
              onChange={(e) => setNewCollectionTitle(e.target.value)}
              data-testid="input-collection-title"
            />
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowNewCollectionDialog(false)}>
                Cancelar
              </Button>
              <Button
                onClick={handleCreateCollection}
                disabled={!newCollectionTitle.trim() || createCollectionMutation.isPending}
                data-testid="button-create-collection"
              >
                {createCollectionMutation.isPending ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Plus className="h-4 w-4 mr-2" />
                )}
                Criar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      
      <Dialog open={!!addToCollectionInspirationId} onOpenChange={(open) => !open && setAddToCollectionInspirationId(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Adicionar à Coleção</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {collections.length === 0 ? (
              <div className="text-center py-4">
                <p className="text-muted-foreground mb-4">Você ainda não tem coleções.</p>
                <Button
                  onClick={() => {
                    setAddToCollectionInspirationId(null);
                    setShowNewCollectionDialog(true);
                  }}
                  data-testid="button-create-first-collection"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Criar primeira coleção
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                {collections.map((collection) => (
                  <Button
                    key={collection.id}
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() => handleAddToCollection(collection.id)}
                    disabled={addToCollectionMutation.isPending}
                    data-testid={`button-select-collection-${collection.id}`}
                  >
                    <FolderOpen className="h-4 w-4 mr-2" />
                    {collection.title}
                    <span className="ml-auto text-muted-foreground">{collection.itemCount} itens</span>
                  </Button>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
