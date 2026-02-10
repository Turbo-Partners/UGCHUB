import { useState, useMemo, useEffect } from "react";
import { Link, useRoute, useLocation } from "wouter";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Search, ChevronRight, ArrowLeft, Home, MessageCircle, Mail, Menu, X,
} from "lucide-react";
import {
  helpCategories, searchArticles, findCategory, findSection, findArticle,
  type HelpCategory, type HelpSection, type HelpArticle,
} from "@/data/help-center";

const categoryColors: Record<string, string> = {
  violet: "from-violet-500/20 to-violet-600/5 border-violet-500/30 hover:border-violet-500/60",
  blue: "from-blue-500/20 to-blue-600/5 border-blue-500/30 hover:border-blue-500/60",
  amber: "from-amber-500/20 to-amber-600/5 border-amber-500/30 hover:border-amber-500/60",
};

const categoryIconBg: Record<string, string> = {
  violet: "bg-violet-500/20 text-violet-400",
  blue: "bg-blue-500/20 text-blue-400",
  amber: "bg-amber-500/20 text-amber-400",
};

const categoryTextColor: Record<string, string> = {
  violet: "text-violet-400",
  blue: "text-blue-400",
  amber: "text-amber-400",
};

function GlobalSidebar({ activePath, mobileOpen, setMobileOpen }: {
  activePath: string;
  mobileOpen: boolean;
  setMobileOpen: (v: boolean) => void;
}) {
  const [searchQuery, setSearchQuery] = useState("");
  const [location] = useLocation();

  useEffect(() => {
    setMobileOpen(false);
  }, [location]);

  const searchResults = useMemo(() => searchArticles(searchQuery), [searchQuery]);

  const sidebarContent = (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-border dark:border-zinc-800">
        <Link href="/" className="flex items-center gap-2 mb-4" data-testid="sidebar-logo">
          <img
            src="/attached_assets/freepik__adjust__40499_1767050491683.png"
            alt="CreatorConnect"
            className="h-8 w-auto object-contain hidden dark:block"
          />
          <img
            src="/attached_assets/Logo_CC_Preta_1769604458305.png"
            alt="CreatorConnect"
            className="h-8 w-auto object-contain dark:hidden"
          />
        </Link>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Buscar..."
            className="pl-9 pr-3 h-9 bg-muted/50 dark:bg-zinc-800 border-border dark:border-zinc-700 rounded-lg text-sm"
            data-testid="input-sidebar-search"
          />
        </div>
      </div>

      {searchQuery.trim() ? (
        <div className="flex-1 overflow-y-auto p-3 space-y-1">
          {searchResults.length === 0 ? (
            <p className="text-xs text-muted-foreground p-2">Nenhum resultado</p>
          ) : (
            searchResults.slice(0, 10).map(({ category, section, article }) => (
              <Link
                key={`${category.slug}-${section.slug}-${article.slug}`}
                href={`/central-ajuda/${category.slug}/${section.slug}/${article.slug}`}
                className="block px-3 py-2 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-muted/50 dark:hover:bg-zinc-800 transition-colors"
                data-testid={`search-result-${article.slug}`}
              >
                <span className="text-xs opacity-60">{category.title} &rsaquo; {section.title}</span>
                <p className="text-foreground text-sm">{article.title}</p>
              </Link>
            ))
          )}
        </div>
      ) : (
        <nav className="flex-1 overflow-y-auto p-3 space-y-1" data-testid="sidebar-nav">
          <Link
            href="/"
            className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-muted/50 dark:hover:bg-zinc-800 transition-colors"
            data-testid="sidebar-home"
          >
            <Home className="w-4 h-4" />
            Início
          </Link>
          <Link
            href="/central-ajuda"
            className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              activePath.startsWith("/central-ajuda")
                ? "bg-violet-600 text-white"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/50 dark:hover:bg-zinc-800"
            }`}
            data-testid="sidebar-help-home"
          >
            <Search className="w-4 h-4" />
            Central de ajuda
          </Link>

          {helpCategories.map(cat => {
            const CatIcon = cat.icon;
            return (
              <div key={cat.slug} className="pt-4" data-testid={`sidebar-category-${cat.slug}`}>
                <Link
                  href={`/central-ajuda/${cat.slug}`}
                  className={`flex items-center gap-2.5 px-3 py-1.5 text-sm font-semibold transition-colors ${
                    activePath === `/central-ajuda/${cat.slug}`
                      ? "text-foreground"
                      : "text-foreground/80 hover:text-foreground"
                  }`}
                >
                  <CatIcon className="w-4 h-4" />
                  {cat.title === "Sou Criador" ? "Criadores" : cat.title === "Sou Marca" ? "Marcas" : cat.title}
                </Link>
                <div className="mt-1 space-y-0.5">
                  <Link
                    href={`/central-ajuda/${cat.slug}`}
                    className={`block pl-10 pr-3 py-1.5 text-sm rounded-lg transition-colors ${
                      activePath === `/central-ajuda/${cat.slug}`
                        ? "text-violet-400 font-medium"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted/50 dark:hover:bg-zinc-800"
                    }`}
                  >
                    Início
                  </Link>
                  {cat.sections.map(section => {
                    const sectionPath = `/central-ajuda/${cat.slug}/${section.slug}`;
                    const isActive = activePath.startsWith(sectionPath);
                    return (
                      <div key={section.slug}>
                        <Link
                          href={sectionPath}
                          className={`block pl-10 pr-3 py-1.5 text-sm rounded-lg transition-colors ${
                            isActive
                              ? "text-violet-400 font-medium"
                              : "text-muted-foreground hover:text-foreground hover:bg-muted/50 dark:hover:bg-zinc-800"
                          }`}
                          data-testid={`sidebar-section-${cat.slug}-${section.slug}`}
                        >
                          {section.title}
                        </Link>
                        {isActive && section.articles.length > 0 && (
                          <div className="ml-10 border-l-2 border-zinc-700 pl-3 py-0.5 space-y-0.5">
                            {section.articles.map(article => {
                              const articlePath = `${sectionPath}/${article.slug}`;
                              return (
                                <Link
                                  key={article.slug}
                                  href={articlePath}
                                  className={`block px-2 py-1 text-[13px] rounded transition-colors ${
                                    activePath === articlePath
                                      ? "text-violet-400 font-medium"
                                      : "text-muted-foreground hover:text-foreground"
                                  }`}
                                  data-testid={`sidebar-article-${article.slug}`}
                                >
                                  {article.title}
                                </Link>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </nav>
      )}
    </div>
  );

  return (
    <>
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 bg-black/50" onClick={() => setMobileOpen(false)}>
          <div
            className="absolute left-0 top-0 bottom-0 w-72 bg-background dark:bg-zinc-950 border-r border-border dark:border-zinc-800 overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-end p-3 border-b border-border dark:border-zinc-800">
              <button onClick={() => setMobileOpen(false)} className="p-1 text-muted-foreground hover:text-foreground">
                <X className="w-5 h-5" />
              </button>
            </div>
            {sidebarContent}
          </div>
        </div>
      )}
      <aside className="hidden lg:flex flex-col w-64 flex-shrink-0 fixed left-0 top-0 bottom-0 bg-background dark:bg-zinc-950 border-r border-border dark:border-zinc-800 z-30 overflow-hidden">
        {sidebarContent}
      </aside>
    </>
  );
}

function HelpLayout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background dark:bg-zinc-950">
      <GlobalSidebar activePath={location} mobileOpen={mobileOpen} setMobileOpen={setMobileOpen} />
      <button
        onClick={() => setMobileOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-40 w-10 h-10 bg-card dark:bg-zinc-900 border border-border dark:border-zinc-800 rounded-lg flex items-center justify-center hover:bg-muted/50 dark:hover:bg-zinc-800 transition-colors shadow-sm"
        data-testid="button-sidebar-toggle"
      >
        <Menu className="w-5 h-5 text-foreground" />
      </button>
      <div className="lg:ml-64">
        <main className="min-h-screen">
          {children}
        </main>
      </div>
    </div>
  );
}

function Breadcrumbs({ items }: { items: { label: string; href?: string }[] }) {
  return (
    <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-6 flex-wrap" data-testid="breadcrumbs">
      <Link href="/central-ajuda" className="hover:text-foreground transition-colors">Central de Ajuda</Link>
      {items.map((item, i) => (
        <span key={i} className="flex items-center gap-2">
          <ChevronRight className="w-3 h-3" />
          {item.href ? (
            <Link href={item.href} className="hover:text-foreground transition-colors">{item.label}</Link>
          ) : (
            <span className="text-foreground">{item.label}</span>
          )}
        </span>
      ))}
    </nav>
  );
}

function SearchResults({ query }: { query: string }) {
  const results = useMemo(() => searchArticles(query), [query]);
  if (!results.length) {
    return (
      <div className="text-center py-12" data-testid="text-no-results">
        <p className="text-muted-foreground text-lg">Nenhum resultado para "{query}"</p>
        <p className="text-muted-foreground text-sm mt-2">Tente buscar com outras palavras-chave.</p>
      </div>
    );
  }
  return (
    <div className="space-y-3" data-testid="search-results">
      <p className="text-sm text-muted-foreground">{results.length} resultado{results.length !== 1 ? "s" : ""}</p>
      {results.map(({ category, section, article }) => (
        <Link
          key={`${category.slug}-${section.slug}-${article.slug}`}
          href={`/central-ajuda/${category.slug}/${section.slug}/${article.slug}`}
          className="block p-4 rounded-xl bg-card dark:bg-zinc-900 border border-border dark:border-zinc-800 hover:border-violet-500/40 transition-all group"
          data-testid={`result-${article.slug}`}
        >
          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
            <span className={categoryTextColor[category.color] || "text-violet-400"}>{category.title}</span>
            <ChevronRight className="w-3 h-3" />
            <span>{section.title}</span>
          </div>
          <h3 className="font-medium text-foreground group-hover:text-violet-400 transition-colors">{article.title}</h3>
          <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{article.summary}</p>
        </Link>
      ))}
    </div>
  );
}

function HelpHome() {
  const [query, setQuery] = useState("");
  return (
    <div className="px-6 lg:px-12 py-10 max-w-5xl">
      <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-3" data-testid="text-help-title">
        Central de Ajuda
      </h1>
      <p className="text-lg text-muted-foreground mb-8 max-w-2xl">
        Encontre respostas, tutoriais e tudo que você precisa para aproveitar ao máximo a CreatorConnect.
      </p>
      <div className="relative w-full max-w-xl mb-8">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
        <Input
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Buscar artigos, dúvidas, tutoriais..."
          className="pl-12 pr-4 h-12 bg-card dark:bg-zinc-900 border-border dark:border-zinc-700 rounded-xl text-base"
          data-testid="input-help-search"
        />
      </div>
      {query.trim() ? (
        <SearchResults query={query} />
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-10">
            {helpCategories.map(cat => (
              <Link
                key={cat.slug}
                href={`/central-ajuda/${cat.slug}`}
                className={`group block p-5 rounded-2xl border bg-gradient-to-br transition-all ${categoryColors[cat.color]}`}
                data-testid={`card-category-${cat.slug}`}
              >
                <div className={`w-11 h-11 rounded-xl flex items-center justify-center mb-3 ${categoryIconBg[cat.color]}`}>
                  <cat.icon className="w-5 h-5" />
                </div>
                <h2 className="text-lg font-bold text-foreground mb-1">{cat.title}</h2>
                <p className="text-sm text-muted-foreground">{cat.description}</p>
                <div className="flex items-center gap-1 mt-3 text-sm font-medium text-muted-foreground group-hover:text-foreground transition-colors">
                  <span>Ver artigos</span>
                  <ChevronRight className="w-4 h-4" />
                </div>
              </Link>
            ))}
          </div>
          <div className="p-5 rounded-2xl bg-card dark:bg-zinc-900 border border-border dark:border-zinc-800">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <div className="w-11 h-11 rounded-xl bg-green-500/20 text-green-400 flex items-center justify-center flex-shrink-0">
                <MessageCircle className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-foreground mb-1">Não encontrou o que procurava?</h3>
                <p className="text-sm text-muted-foreground">Fale com nosso time de suporte via WhatsApp ou e-mail.</p>
              </div>
              <div className="flex gap-3">
                <a
                  href="https://wa.me/5527997969628"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium transition-colors"
                  data-testid="link-whatsapp-support"
                >
                  <MessageCircle className="w-4 h-4" />
                  WhatsApp
                </a>
                <a
                  href="mailto:contato@turbopartners.com.br"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-card dark:bg-zinc-800 border border-border dark:border-zinc-700 hover:bg-muted/50 dark:hover:bg-zinc-700 text-foreground rounded-lg text-sm font-medium transition-colors"
                  data-testid="link-email-support"
                >
                  <Mail className="w-4 h-4" />
                  E-mail
                </a>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function CategoryPage({ slug }: { slug: string }) {
  const category = findCategory(slug);
  if (!category) return <NotFoundView />;
  return (
    <div className="px-6 lg:px-12 py-10 max-w-5xl">
      <Breadcrumbs items={[{ label: category.title }]} />
      <div className="flex items-center gap-4 mb-8">
        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${categoryIconBg[category.color]}`}>
          <category.icon className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground" data-testid="text-category-title">{category.title}</h1>
          <p className="text-muted-foreground text-sm">{category.description}</p>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {category.sections.map(section => (
          <Link
            key={section.slug}
            href={`/central-ajuda/${category.slug}/${section.slug}`}
            className="group block p-5 rounded-xl bg-card dark:bg-zinc-900 border border-border dark:border-zinc-800 hover:border-violet-500/40 transition-all"
            data-testid={`card-section-${section.slug}`}
          >
            <div className="flex items-center gap-3 mb-2">
              <section.icon className="w-5 h-5 text-muted-foreground group-hover:text-violet-400 transition-colors" />
              <h3 className="font-semibold text-foreground group-hover:text-violet-400 transition-colors">{section.title}</h3>
            </div>
            <p className="text-sm text-muted-foreground mb-2">{section.description}</p>
            <span className="text-xs text-muted-foreground">{section.articles.length} artigo{section.articles.length !== 1 ? "s" : ""}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}

function SectionPage({ categorySlug, sectionSlug }: { categorySlug: string; sectionSlug: string }) {
  const data = findSection(categorySlug, sectionSlug);
  if (!data) return <NotFoundView />;
  const { category, section } = data;
  return (
    <div className="px-6 lg:px-12 py-10 max-w-4xl">
      <Breadcrumbs items={[
        { label: category.title, href: `/central-ajuda/${category.slug}` },
        { label: section.title },
      ]} />
      <div className="flex items-center gap-3 mb-2">
        <section.icon className="w-6 h-6 text-violet-400" />
        <h1 className="text-2xl font-bold text-foreground" data-testid="text-section-title">{section.title}</h1>
      </div>
      <p className="text-muted-foreground mb-8">{section.description}</p>
      <div className="space-y-3">
        {section.articles.map(article => (
          <Link
            key={article.slug}
            href={`/central-ajuda/${category.slug}/${section.slug}/${article.slug}`}
            className="group flex items-start gap-4 p-4 rounded-xl bg-card dark:bg-zinc-900 border border-border dark:border-zinc-800 hover:border-violet-500/40 transition-all"
            data-testid={`card-article-${article.slug}`}
          >
            <div className="flex-1">
              <h3 className="font-medium text-foreground group-hover:text-violet-400 transition-colors">{article.title}</h3>
              <p className="text-sm text-muted-foreground mt-1">{article.summary}</p>
            </div>
            <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-violet-400 transition-colors mt-0.5" />
          </Link>
        ))}
      </div>
    </div>
  );
}

function ArticlePage({ categorySlug, sectionSlug, articleSlug }: { categorySlug: string; sectionSlug: string; articleSlug: string }) {
  const data = findArticle(categorySlug, sectionSlug, articleSlug);
  if (!data) return <NotFoundView />;
  const { category, section, article } = data;
  const currentIndex = section.articles.findIndex(a => a.slug === articleSlug);
  const prevArticle = currentIndex > 0 ? section.articles[currentIndex - 1] : null;
  const nextArticle = currentIndex < section.articles.length - 1 ? section.articles[currentIndex + 1] : null;

  return (
    <div className="px-6 lg:px-12 py-10 max-w-4xl">
      <Breadcrumbs items={[
        { label: category.title, href: `/central-ajuda/${category.slug}` },
        { label: section.title, href: `/central-ajuda/${category.slug}/${section.slug}` },
        { label: article.title },
      ]} />
      <article>
        <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2" data-testid="text-article-title">{article.title}</h1>
        <p className="text-muted-foreground mb-8">{article.summary}</p>
        <div
          className="prose prose-zinc dark:prose-invert max-w-none
            prose-headings:font-semibold prose-headings:text-foreground
            prose-h2:text-xl prose-h2:mt-8 prose-h2:mb-4
            prose-p:text-muted-foreground prose-p:leading-relaxed
            prose-li:text-muted-foreground
            prose-strong:text-foreground
            prose-a:text-violet-400 prose-a:no-underline hover:prose-a:underline
            prose-ol:space-y-2 prose-ul:space-y-2"
          dangerouslySetInnerHTML={{ __html: article.content }}
          data-testid="article-content"
        />
        <div className="flex flex-col sm:flex-row gap-3 mt-12 pt-8 border-t border-border dark:border-zinc-800">
          {prevArticle && (
            <Link
              href={`/central-ajuda/${category.slug}/${section.slug}/${prevArticle.slug}`}
              className="flex-1 p-4 rounded-xl bg-card dark:bg-zinc-900 border border-border dark:border-zinc-800 hover:border-violet-500/40 transition-all group"
              data-testid="link-prev-article"
            >
              <span className="text-xs text-muted-foreground">← Anterior</span>
              <p className="text-sm font-medium text-foreground group-hover:text-violet-400 transition-colors mt-1">{prevArticle.title}</p>
            </Link>
          )}
          {nextArticle && (
            <Link
              href={`/central-ajuda/${category.slug}/${section.slug}/${nextArticle.slug}`}
              className="flex-1 p-4 rounded-xl bg-card dark:bg-zinc-900 border border-border dark:border-zinc-800 hover:border-violet-500/40 transition-all group text-right"
              data-testid="link-next-article"
            >
              <span className="text-xs text-muted-foreground">Próximo →</span>
              <p className="text-sm font-medium text-foreground group-hover:text-violet-400 transition-colors mt-1">{nextArticle.title}</p>
            </Link>
          )}
        </div>
      </article>
    </div>
  );
}

function NotFoundView() {
  return (
    <div className="px-6 lg:px-12 py-10 text-center">
      <h1 className="text-3xl font-bold text-foreground mb-4">Página não encontrada</h1>
      <p className="text-muted-foreground mb-6">O artigo ou seção que você procura não existe.</p>
      <Link href="/central-ajuda">
        <Button variant="outline" className="gap-2" data-testid="button-back-help">
          <ArrowLeft className="w-4 h-4" />
          Voltar à Central de Ajuda
        </Button>
      </Link>
    </div>
  );
}

export default function HelpCenterRouter() {
  const [, params1] = useRoute("/central-ajuda/:category/:section/:article");
  const [, params2] = useRoute("/central-ajuda/:category/:section");
  const [, params3] = useRoute("/central-ajuda/:category");

  let content: React.ReactNode;

  if (params1?.category && params1?.section && params1?.article) {
    content = <ArticlePage categorySlug={params1.category} sectionSlug={params1.section} articleSlug={params1.article} />;
  } else if (params2?.category && params2?.section) {
    content = <SectionPage categorySlug={params2.category} sectionSlug={params2.section} />;
  } else if (params3?.category) {
    content = <CategoryPage slug={params3.category} />;
  } else {
    content = <HelpHome />;
  }

  return (
    <HelpLayout>
      {content}
    </HelpLayout>
  );
}
