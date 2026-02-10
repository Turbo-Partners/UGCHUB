import { useEffect, useRef } from "react";

interface SEOProps {
  title?: string;
  description?: string;
  keywords?: string;
  image?: string;
  url?: string;
  type?: "website" | "article" | "product";
  article?: {
    author?: string;
    publishedTime?: string;
    section?: string;
  };
  noindex?: boolean;
}

const SITE_NAME = "CreatorConnect";
const SITE_URL = "https://ugc.turbopartners.com.br";
const DEFAULT_IMAGE = "https://ugc.turbopartners.com.br/og-image.png";
const DEFAULT_DESCRIPTION = "Plataforma que conecta marcas com os melhores criadores de conteúdo UGC. Gerencie campanhas, encontre creators e escale seus resultados com marketing de influência.";

const MONTH_MAP: Record<string, string> = {
  "janeiro": "01", "fevereiro": "02", "março": "03", "marco": "03", "abril": "04",
  "maio": "05", "junho": "06", "julho": "07", "agosto": "08",
  "setembro": "09", "outubro": "10", "novembro": "11", "dezembro": "12"
};

function parseToISO(dateStr: string): string {
  if (/^\d{4}-\d{2}-\d{2}/.test(dateStr)) return dateStr.split('T')[0];
  const match = dateStr.toLowerCase().match(/(\d{1,2})\s+(\w+)\s+(\d{4})/);
  if (match) {
    const [, day, month, year] = match;
    const monthNum = MONTH_MAP[month] || "01";
    return `${year}-${monthNum}-${day.padStart(2, "0")}`;
  }
  return new Date().toISOString().split('T')[0];
}

export function SEO({
  title,
  description = DEFAULT_DESCRIPTION,
  keywords = "UGC, marketing de influência, creators, influenciadores, campanhas, conteúdo, marcas, Brasil",
  image = DEFAULT_IMAGE,
  url,
  type = "website",
  article,
  noindex = false,
}: SEOProps) {
  const fullTitle = title ? `${title} | ${SITE_NAME}` : `${SITE_NAME} - Plataforma de Marketing de Influência`;
  const fullUrl = url ? `${SITE_URL}${url}` : SITE_URL;
  const fullImage = image.startsWith("http") ? image : `${SITE_URL}${image}`;

  const createdElementsRef = useRef<Element[]>([]);

  useEffect(() => {
    document.title = fullTitle;
    const created: Element[] = [];

    const updateOrCreateMeta = (name: string, content: string, isProperty = false) => {
      const attr = isProperty ? "property" : "name";
      let meta = document.querySelector(`meta[${attr}="${name}"]`) as HTMLMetaElement;
      if (!meta) {
        meta = document.createElement("meta");
        meta.setAttribute(attr, name);
        document.head.appendChild(meta);
        created.push(meta);
      }
      meta.content = content;
    };

    const updateOrCreateLink = (rel: string, href: string, hreflang?: string) => {
      const selector = hreflang ? `link[rel="${rel}"][hreflang="${hreflang}"]` : `link[rel="${rel}"]:not([hreflang])`;
      let link = document.querySelector(selector) as HTMLLinkElement;
      if (!link) {
        link = document.createElement("link");
        link.rel = rel;
        if (hreflang) link.hreflang = hreflang;
        document.head.appendChild(link);
        created.push(link);
      }
      link.href = href;
    };

    updateOrCreateMeta("description", description);
    updateOrCreateMeta("keywords", keywords);
    updateOrCreateMeta("author", "CreatorConnect");
    updateOrCreateMeta("robots", noindex ? "noindex, nofollow" : "index, follow");

    updateOrCreateMeta("og:title", fullTitle, true);
    updateOrCreateMeta("og:description", description, true);
    updateOrCreateMeta("og:image", fullImage, true);
    updateOrCreateMeta("og:url", fullUrl, true);
    updateOrCreateMeta("og:type", type, true);
    updateOrCreateMeta("og:site_name", SITE_NAME, true);
    updateOrCreateMeta("og:locale", "pt_BR", true);

    updateOrCreateMeta("twitter:card", "summary_large_image");
    updateOrCreateMeta("twitter:title", fullTitle);
    updateOrCreateMeta("twitter:description", description);
    updateOrCreateMeta("twitter:image", fullImage);
    updateOrCreateMeta("twitter:site", "@creatorconnect");

    if (type === "article" && article) {
      if (article.author) updateOrCreateMeta("article:author", article.author, true);
      if (article.publishedTime) {
        const isoDate = parseToISO(article.publishedTime);
        updateOrCreateMeta("article:published_time", isoDate, true);
      }
      if (article.section) updateOrCreateMeta("article:section", article.section, true);
    }

    updateOrCreateLink("canonical", fullUrl);
    updateOrCreateLink("alternate", fullUrl, "pt-BR");
    updateOrCreateLink("alternate", fullUrl, "x-default");

    updateOrCreateMeta("geo.region", "BR");
    updateOrCreateMeta("geo.placename", "Brasil");
    updateOrCreateMeta("content-language", "pt-BR");

    createdElementsRef.current = created;

    return () => {
      createdElementsRef.current.forEach(el => el.remove());
      createdElementsRef.current = [];
    };
  }, [fullTitle, description, keywords, fullImage, fullUrl, type, article, noindex]);

  return null;
}

interface SchemaOrgProps {
  type: "Organization" | "WebSite" | "Article" | "BreadcrumbList" | "FAQPage";
  data: Record<string, unknown>;
}

export function SchemaOrg({ type, data }: SchemaOrgProps) {
  useEffect(() => {
    const scriptId = `schema-${type.toLowerCase()}`;
    let script = document.getElementById(scriptId) as HTMLScriptElement;
    
    if (!script) {
      script = document.createElement("script");
      script.id = scriptId;
      script.type = "application/ld+json";
      document.head.appendChild(script);
    }
    
    script.textContent = JSON.stringify({
      "@context": "https://schema.org",
      "@type": type,
      ...data,
    });

    return () => {
      const scriptToRemove = document.getElementById(scriptId);
      if (scriptToRemove) {
        scriptToRemove.remove();
      }
    };
  }, [type, data]);

  return null;
}

export function OrganizationSchema() {
  return (
    <SchemaOrg
      type="Organization"
      data={{
        "@id": "https://ugc.turbopartners.com.br/#organization",
        name: "CreatorConnect",
        alternateName: "CreatorConnect Brasil",
        url: "https://ugc.turbopartners.com.br",
        logo: "https://ugc.turbopartners.com.br/logo.png",
        description: "Plataforma brasileira que conecta marcas com criadores de conteúdo UGC para campanhas de marketing de influência.",
        foundingDate: "2024",
        address: {
          "@type": "PostalAddress",
          addressCountry: "BR",
          addressLocality: "São Paulo",
          addressRegion: "SP",
        },
        sameAs: [
          "https://instagram.com/creatorconnect",
          "https://linkedin.com/company/creatorconnect",
        ],
        contactPoint: {
          "@type": "ContactPoint",
          contactType: "customer service",
          availableLanguage: ["Portuguese"],
        },
      }}
    />
  );
}

export function WebSiteSchema() {
  return (
    <SchemaOrg
      type="WebSite"
      data={{
        "@id": "https://ugc.turbopartners.com.br/#website",
        url: "https://ugc.turbopartners.com.br",
        name: "CreatorConnect",
        description: "Plataforma de marketing de influência que conecta marcas com creators UGC.",
        publisher: {
          "@id": "https://ugc.turbopartners.com.br/#organization",
        },
        inLanguage: "pt-BR",
        potentialAction: {
          "@type": "SearchAction",
          target: "https://ugc.turbopartners.com.br/blog?q={search_term_string}",
          "query-input": "required name=search_term_string",
        },
      }}
    />
  );
}

interface ArticleSchemaProps {
  title: string;
  description: string;
  image: string;
  url: string;
  author: string;
  datePublished: string;
  dateModified?: string;
  section?: string;
}

export function ArticleSchema({
  title,
  description,
  image,
  url,
  author,
  datePublished,
  dateModified,
  section,
}: ArticleSchemaProps) {
  const isoPublished = parseToISO(datePublished);
  const isoModified = dateModified ? parseToISO(dateModified) : isoPublished;
  
  return (
    <SchemaOrg
      type="Article"
      data={{
        "@id": `https://ugc.turbopartners.com.br${url}#article`,
        headline: title,
        description,
        image: image.startsWith("http") ? image : `https://ugc.turbopartners.com.br${image}`,
        url: `https://ugc.turbopartners.com.br${url}`,
        datePublished: isoPublished,
        dateModified: isoModified,
        author: {
          "@type": "Person",
          name: author,
        },
        publisher: {
          "@id": "https://ugc.turbopartners.com.br/#organization",
        },
        mainEntityOfPage: {
          "@type": "WebPage",
          "@id": `https://ugc.turbopartners.com.br${url}`,
        },
        articleSection: section || "Marketing de Influência",
        inLanguage: "pt-BR",
      }}
    />
  );
}

interface BreadcrumbItem {
  name: string;
  url: string;
}

export function BreadcrumbSchema({ items }: { items: BreadcrumbItem[] }) {
  return (
    <SchemaOrg
      type="BreadcrumbList"
      data={{
        itemListElement: items.map((item, index) => ({
          "@type": "ListItem",
          position: index + 1,
          name: item.name,
          item: `https://ugc.turbopartners.com.br${item.url}`,
        })),
      }}
    />
  );
}

interface FAQItem {
  question: string;
  answer: string;
}

export function FAQPageSchema({ faqs }: { faqs: FAQItem[] }) {
  return (
    <SchemaOrg
      type="FAQPage"
      data={{
        mainEntity: faqs.map((faq) => ({
          "@type": "Question",
          name: faq.question,
          acceptedAnswer: {
            "@type": "Answer",
            text: faq.answer,
          },
        })),
      }}
    />
  );
}
