import { useQuery } from "@tanstack/react-query";
import { useRoute, Link } from "wouter";
import { motion } from "framer-motion";
import { PublicHeader } from "@/components/public-header";
import { Footer } from "@/components/footer";
import { SEO } from "@/components/seo";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { apiRequest } from "@/lib/queryClient";
import { Calendar, Clock, ArrowLeft, User, Share2, ArrowRight, Zap, Mail, Users } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface BlogPost {
  id: number;
  slug: string;
  type: string;
  category: string;
  title: string;
  excerpt: string;
  content: string;
  image: string | null;
  author: string;
  authorAvatar: string | null;
  readTime: string | null;
  featured: boolean;
  published: boolean;
  metaTitle: string | null;
  metaDescription: string | null;
  ogImage: string | null;
  company: string | null;
  metricValue: string | null;
  metricLabel: string | null;
  createdAt: string;
}

function DetailSkeleton() {
  return (
    <div className="min-h-screen bg-zinc-950">
      <PublicHeader />
      <div className="pt-32 pb-12">
        <div className="container mx-auto px-4 max-w-4xl animate-pulse">
          <div className="h-4 w-48 bg-zinc-800 rounded mb-8" />
          <div className="h-6 w-24 bg-zinc-800 rounded-full mb-4" />
          <div className="h-12 w-3/4 bg-zinc-800 rounded mb-4" />
          <div className="h-8 w-1/2 bg-zinc-800 rounded mb-8" />
          <div className="aspect-[16/9] bg-zinc-800 rounded-2xl mb-10" />
          <div className="space-y-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-4 bg-zinc-800 rounded" style={{ width: `${70 + Math.random() * 30}%` }} />
            ))}
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}

function NotFoundState() {
  return (
    <div className="min-h-screen bg-zinc-950">
      <PublicHeader />
      <div className="pt-32 pb-24">
        <div className="container mx-auto px-4 text-center max-w-2xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="w-20 h-20 rounded-2xl bg-zinc-800 flex items-center justify-center mx-auto mb-6">
              <User className="h-10 w-10 text-zinc-600" />
            </div>
            <h1 className="text-3xl font-bold text-white mb-4" data-testid="text-not-found">Artigo não encontrado</h1>
            <p className="text-zinc-400 mb-8">
              O artigo que você está procurando não existe ou foi removido.
            </p>
            <Link href="/blog">
              <Button className="bg-violet-600 hover:bg-violet-700 text-white rounded-full" data-testid="button-back-blog">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar ao Blog
              </Button>
            </Link>
          </motion.div>
        </div>
      </div>
      <Footer />
    </div>
  );
}

function InlineCta({ variant = "platform" }: { variant?: "platform" | "creators" | "newsletter" }) {
  if (variant === "creators") {
    return (
      <div className="rounded-2xl bg-gradient-to-br from-emerald-600 via-teal-600 to-cyan-600 p-8 my-10 relative overflow-hidden" data-testid="inline-cta-creators">
        <div className="absolute top-0 right-0 w-48 h-48 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="relative z-10 flex flex-col sm:flex-row items-center gap-5">
          <div className="flex-shrink-0 w-14 h-14 rounded-2xl bg-white/10 flex items-center justify-center">
            <Users className="w-7 h-7 text-white" />
          </div>
          <div className="flex-1 text-center sm:text-left">
            <h3 className="text-lg font-bold text-white mb-1">Quer ser um Creator de UGC?</h3>
            <p className="text-white/80 text-sm">Cadastre-se gratuitamente e comece a receber oportunidades.</p>
          </div>
          <Link href="/para-criadores">
            <Button className="bg-white text-emerald-700 hover:bg-white/90 font-semibold rounded-full px-6 whitespace-nowrap" data-testid="button-inline-creators-signup">
              Criar conta
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  if (variant === "newsletter") {
    return (
      <div className="rounded-2xl bg-gradient-to-br from-violet-600/20 to-indigo-600/20 border border-violet-500/20 p-8 my-10" data-testid="inline-cta-newsletter">
        <div className="flex flex-col sm:flex-row items-center gap-5">
          <div className="flex-shrink-0 w-14 h-14 rounded-2xl bg-violet-500/10 flex items-center justify-center">
            <Mail className="w-7 h-7 text-violet-400" />
          </div>
          <div className="flex-1 text-center sm:text-left">
            <h3 className="text-lg font-bold text-white mb-1">Gostando do conteúdo?</h3>
            <p className="text-zinc-400 text-sm">Receba artigos como este diretamente no seu email.</p>
          </div>
          <div className="flex gap-2 w-full sm:w-auto">
            <input
              type="email"
              placeholder="seu@email.com"
              className="flex-1 sm:w-48 px-4 py-2.5 rounded-full bg-white/5 border border-white/10 text-white placeholder-white/40 text-sm focus:outline-none focus:border-violet-500/40"
              data-testid="input-inline-newsletter-email"
            />
            <Button className="bg-violet-600 hover:bg-violet-700 text-white font-semibold rounded-full px-5 whitespace-nowrap" data-testid="button-inline-newsletter-subscribe">
              Assinar
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl bg-gradient-to-br from-violet-600 via-purple-600 to-indigo-600 p-8 my-10 relative overflow-hidden" data-testid="inline-cta-platform">
      <div className="absolute top-0 right-0 w-48 h-48 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
      <div className="relative z-10 flex flex-col sm:flex-row items-center gap-5">
        <div className="flex-shrink-0 w-14 h-14 rounded-2xl bg-white/10 flex items-center justify-center">
          <Zap className="w-7 h-7 text-white" />
        </div>
        <div className="flex-1 text-center sm:text-left">
          <h3 className="text-lg font-bold text-white mb-1">Escale suas campanhas com a CreatorConnect</h3>
          <p className="text-white/80 text-sm">Conecte-se com creators qualificados e meça resultados.</p>
        </div>
        <Link href="/para-empresas">
          <Button className="bg-white text-violet-700 hover:bg-white/90 font-semibold rounded-full px-6 whitespace-nowrap" data-testid="button-inline-platform-signup">
            Começar agora
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </Link>
      </div>
    </div>
  );
}

export default function BlogPostPage() {
  const [, params] = useRoute("/blog/:slug");
  const slug = params?.slug;

  const { data: post, isLoading, isError } = useQuery<BlogPost>({
    queryKey: ["/api/blog", slug],
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/blog/${slug}`);
      return res.json();
    },
    enabled: !!slug,
  });

  if (isLoading) return <DetailSkeleton />;
  if (isError || !post) return <NotFoundState />;

  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      alert("Link copiado para a área de transferência!");
    } catch {
      const textArea = document.createElement("textarea");
      textArea.value = window.location.href;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);
      alert("Link copiado!");
    }
  };

  const categoryStyles: Record<string, { bg: string; text: string; border: string; label: string }> = {
    dicas: { bg: "bg-violet-500/15", text: "text-violet-400", border: "border-violet-500/25", label: "Dicas & Estratégias" },
    cases: { bg: "bg-emerald-500/15", text: "text-emerald-400", border: "border-emerald-500/25", label: "Case de Sucesso" },
    novidades: { bg: "bg-amber-500/15", text: "text-amber-400", border: "border-amber-500/25", label: "Novidades" },
  };
  const catStyle = categoryStyles[post.category] || categoryStyles.dicas;

  const categoryGradients: Record<string, string> = {
    dicas: "from-violet-600 to-indigo-600",
    cases: "from-emerald-600 to-teal-600",
    novidades: "from-amber-600 to-orange-600",
  };
  const gradient = categoryGradients[post.category] || "from-violet-600 to-indigo-600";

  const contentParts = post.content ? splitContentForAds(post.content) : [];

  return (
    <div className="min-h-screen bg-zinc-950">
      <SEO
        title={post.metaTitle || post.title}
        description={post.metaDescription || post.excerpt}
        image={post.ogImage || post.image || undefined}
        url={`/blog/${post.slug}`}
        type="article"
        article={{
          author: "CreatorConnect",
          publishedTime: post.createdAt,
          section: post.category,
        }}
      />
      <PublicHeader />

      <article className="pt-32 pb-12" data-testid="article-blog-post">
        <div className="container mx-auto px-4 max-w-4xl">
          <nav className="flex items-center gap-2 text-sm text-zinc-500 mb-8" aria-label="Breadcrumb" data-testid="breadcrumb">
            <Link href="/" className="hover:text-white transition-colors" data-testid="breadcrumb-home">Home</Link>
            <span>/</span>
            <Link href="/blog" className="hover:text-white transition-colors" data-testid="breadcrumb-blog">Blog</Link>
            <span>/</span>
            <span className="text-zinc-300 truncate max-w-[200px]" data-testid="breadcrumb-current">{post.title}</span>
          </nav>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Badge
              className={`mb-4 ${catStyle.bg} ${catStyle.text} border ${catStyle.border} font-semibold`}
              data-testid="badge-post-category"
            >
              {catStyle.label}
            </Badge>

            <h1
              className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-4 leading-tight"
              data-testid="text-post-title"
            >
              {post.title}
            </h1>

            <p className="text-lg text-zinc-400 mb-6" data-testid="text-post-excerpt">
              {post.excerpt}
            </p>

            <div className="flex items-center justify-between flex-wrap gap-4 mb-8">
              <div className="flex items-center gap-4 text-sm text-zinc-500">
                <span className="flex items-center gap-1.5" data-testid="text-post-date">
                  <Calendar className="h-4 w-4" />
                  {format(new Date(post.createdAt), "dd 'de' MMMM, yyyy", { locale: ptBR })}
                </span>
                {post.readTime && (
                  <span className="flex items-center gap-1.5" data-testid="text-post-readtime">
                    <Clock className="h-4 w-4" />
                    {post.readTime}
                  </span>
                )}
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={handleShare}
                className="border-zinc-700 text-zinc-300 hover:bg-zinc-800 hover:text-white rounded-full"
                data-testid="button-share"
              >
                <Share2 className="h-4 w-4 mr-2" />
                Compartilhar
              </Button>
            </div>
          </motion.div>

          {post.type === "case" && post.company && (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.1 }}
              className="rounded-2xl bg-gradient-to-r from-emerald-600/10 to-teal-600/10 border border-emerald-500/20 p-6 mb-8"
              data-testid="section-case-metrics"
            >
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
                <div>
                  <p className="text-sm text-emerald-400 font-medium mb-1">Case de Sucesso</p>
                  <p className="text-xl font-bold text-white" data-testid="text-case-company">{post.company}</p>
                </div>
                {post.metricValue && (
                  <div className="sm:ml-auto text-center sm:text-right">
                    <p className="text-3xl font-bold text-emerald-400" data-testid="text-case-metric-value">{post.metricValue}</p>
                    {post.metricLabel && (
                      <p className="text-sm text-zinc-400" data-testid="text-case-metric-label">{post.metricLabel}</p>
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {post.image && (
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.15 }}
              className="rounded-2xl overflow-hidden mb-10"
            >
              <img
                src={post.image}
                alt={post.title}
                className="w-full aspect-[16/9] object-cover"
                data-testid="img-post-hero"
              />
            </motion.div>
          )}

          {!post.image && (
            <div className={`rounded-2xl bg-gradient-to-br ${gradient} h-48 flex items-center justify-center mb-10`}>
              <User className="h-16 w-16 text-white/20" />
            </div>
          )}

          {contentParts.length > 0 ? (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="prose prose-invert prose-lg max-w-none
                  prose-headings:text-white prose-headings:font-bold
                  prose-p:text-zinc-300 prose-p:leading-relaxed
                  prose-a:text-violet-400 prose-a:no-underline hover:prose-a:underline
                  prose-strong:text-white
                  prose-ul:text-zinc-300 prose-ol:text-zinc-300
                  prose-li:text-zinc-300
                  prose-blockquote:border-violet-500 prose-blockquote:text-zinc-400
                  prose-img:rounded-xl
                  prose-code:text-violet-300 prose-code:bg-zinc-800 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded"
                data-testid="content-blog-post-part-1"
                dangerouslySetInnerHTML={{ __html: contentParts[0] }}
              />
              
              <InlineCta variant="newsletter" />

              {contentParts[1] && (
                <div
                  className="prose prose-invert prose-lg max-w-none
                    prose-headings:text-white prose-headings:font-bold
                    prose-p:text-zinc-300 prose-p:leading-relaxed
                    prose-a:text-violet-400 prose-a:no-underline hover:prose-a:underline
                    prose-strong:text-white
                    prose-ul:text-zinc-300 prose-ol:text-zinc-300
                    prose-li:text-zinc-300
                    prose-blockquote:border-violet-500 prose-blockquote:text-zinc-400
                    prose-img:rounded-xl
                    prose-code:text-violet-300 prose-code:bg-zinc-800 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded"
                  data-testid="content-blog-post-part-2"
                  dangerouslySetInnerHTML={{ __html: contentParts[1] }}
                />
              )}

              <InlineCta variant="platform" />

              {contentParts[2] && (
                <div
                  className="prose prose-invert prose-lg max-w-none
                    prose-headings:text-white prose-headings:font-bold
                    prose-p:text-zinc-300 prose-p:leading-relaxed
                    prose-a:text-violet-400 prose-a:no-underline hover:prose-a:underline
                    prose-strong:text-white
                    prose-ul:text-zinc-300 prose-ol:text-zinc-300
                    prose-li:text-zinc-300
                    prose-blockquote:border-violet-500 prose-blockquote:text-zinc-400
                    prose-img:rounded-xl
                    prose-code:text-violet-300 prose-code:bg-zinc-800 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded
                    mb-16"
                  data-testid="content-blog-post-part-3"
                  dangerouslySetInnerHTML={{ __html: contentParts[2] }}
                />
              )}
            </>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="prose prose-invert prose-lg max-w-none
                prose-headings:text-white prose-headings:font-bold
                prose-p:text-zinc-300 prose-p:leading-relaxed
                prose-a:text-violet-400 prose-a:no-underline hover:prose-a:underline
                prose-strong:text-white
                prose-ul:text-zinc-300 prose-ol:text-zinc-300
                prose-li:text-zinc-300
                prose-blockquote:border-violet-500 prose-blockquote:text-zinc-400
                prose-img:rounded-xl
                prose-code:text-violet-300 prose-code:bg-zinc-800 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded
                mb-16"
              data-testid="content-blog-post"
              dangerouslySetInnerHTML={{ __html: post.content }}
            />
          )}

          <InlineCta variant="creators" />

          <div className="border-t border-zinc-800 pt-8 mt-8 flex items-center justify-between">
            <Link href="/blog">
              <Button
                variant="ghost"
                className="text-violet-400 hover:text-violet-300 hover:bg-violet-500/10 rounded-full"
                data-testid="button-back-to-blog"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar ao Blog
              </Button>
            </Link>

            <Button
              variant="outline"
              size="sm"
              onClick={handleShare}
              className="border-zinc-700 text-zinc-300 hover:bg-zinc-800 hover:text-white rounded-full"
              data-testid="button-share-bottom"
            >
              <Share2 className="h-4 w-4 mr-2" />
              Compartilhar
            </Button>
          </div>
        </div>
      </article>

      <Footer />
    </div>
  );
}

function splitContentForAds(html: string): string[] {
  const h2Regex = /<h2[^>]*>/gi;
  const matches = [...html.matchAll(h2Regex)];
  
  if (matches.length < 3) {
    return [html];
  }

  const splitIndex1 = matches[Math.floor(matches.length / 3)]?.index;
  const splitIndex2 = matches[Math.floor((matches.length * 2) / 3)]?.index;

  if (splitIndex1 === undefined || splitIndex2 === undefined) {
    return [html];
  }

  return [
    html.slice(0, splitIndex1),
    html.slice(splitIndex1, splitIndex2),
    html.slice(splitIndex2),
  ];
}
