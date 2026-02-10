import { db } from "./db";
import { inspirations } from "@shared/schema";

const inspirationsData = [
  {
    title: "Hook de abertura: Você está fazendo isso errado",
    description: "Técnica de hook que gera curiosidade imediata ao desafiar uma crença comum do espectador.",
    platform: "instagram" as const,
    format: "reels" as const,
    url: "https://www.instagram.com/reel/example1",
    thumbnailUrl: null,
    tags: ["hook", "abertura", "curiosidade"],
    nicheTags: ["marketing", "educacional"]
  },
  {
    title: "Before/After: Transformação de skincare",
    description: "Mostra resultado real de produto com transição suave entre antes e depois.",
    platform: "tiktok" as const,
    format: "reels" as const,
    url: "https://www.tiktok.com/@example/video/1234",
    thumbnailUrl: null,
    tags: ["before-after", "transformacao", "resultado"],
    nicheTags: ["beleza", "skincare"]
  },
  {
    title: "Unboxing premium: criando expectativa",
    description: "Unboxing que usa ASMR e close-ups para criar experiência sensorial premium.",
    platform: "youtube" as const,
    format: "shorts" as const,
    url: "https://youtube.com/shorts/example",
    thumbnailUrl: null,
    tags: ["unboxing", "asmr", "premium"],
    nicheTags: ["lifestyle", "tech"]
  },
  {
    title: "Prova social: reviews reais de clientes",
    description: "Compilação de depoimentos de clientes reais mostrando resultados.",
    platform: "instagram" as const,
    format: "reels" as const,
    url: "https://www.instagram.com/reel/example2",
    thumbnailUrl: null,
    tags: ["prova-social", "depoimento", "reviews"],
    nicheTags: ["servicos", "consultoria"]
  },
  {
    title: "Demo de produto: 60 segundos",
    description: "Demonstração rápida e objetiva do produto em uso real.",
    platform: "tiktok" as const,
    format: "reels" as const,
    url: "https://www.tiktok.com/@example/video/5678",
    thumbnailUrl: null,
    tags: ["demo", "tutorial", "produto"],
    nicheTags: ["tech", "gadgets"]
  },
  {
    title: "Hook: 3 coisas que você não sabia",
    description: "Lista numerada que promete informações exclusivas.",
    platform: "instagram" as const,
    format: "reels" as const,
    url: "https://www.instagram.com/reel/example3",
    thumbnailUrl: null,
    tags: ["hook", "lista", "educacional"],
    nicheTags: ["educacional", "dicas"]
  },
  {
    title: "Story: dia a dia usando o produto",
    description: "Conteúdo autêntico mostrando produto integrado na rotina.",
    platform: "instagram" as const,
    format: "story" as const,
    url: "https://www.instagram.com/stories/example",
    thumbnailUrl: null,
    tags: ["rotina", "dia-a-dia", "autentico"],
    nicheTags: ["lifestyle", "bem-estar"]
  },
  {
    title: "Comparativo: produto A vs produto B",
    description: "Análise comparativa honesta entre duas opções.",
    platform: "youtube" as const,
    format: "shorts" as const,
    url: "https://youtube.com/shorts/example2",
    thumbnailUrl: null,
    tags: ["comparativo", "versus", "analise"],
    nicheTags: ["tech", "beleza"]
  },
  {
    title: "Tutorial passo a passo em 30s",
    description: "Tutorial rápido e objetivo com texto na tela.",
    platform: "tiktok" as const,
    format: "reels" as const,
    url: "https://www.tiktok.com/@example/video/9012",
    thumbnailUrl: null,
    tags: ["tutorial", "passo-a-passo", "rapido"],
    nicheTags: ["educacional", "diy"]
  },
  {
    title: "POV: quando você descobre [produto]",
    description: "Formato POV criando identificação com o espectador.",
    platform: "tiktok" as const,
    format: "reels" as const,
    url: "https://www.tiktok.com/@example/video/3456",
    thumbnailUrl: null,
    tags: ["pov", "humor", "identificacao"],
    nicheTags: ["entretenimento", "lifestyle"]
  },
  {
    title: "Trend: som viral + produto",
    description: "Uso de áudio trending para aumentar alcance.",
    platform: "instagram" as const,
    format: "reels" as const,
    url: "https://www.instagram.com/reel/example4",
    thumbnailUrl: null,
    tags: ["trend", "viral", "audio"],
    nicheTags: ["moda", "beleza"]
  },
  {
    title: "Resposta a comentário: dúvidas frequentes",
    description: "Responde comentário/pergunta de seguidor sobre o produto.",
    platform: "tiktok" as const,
    format: "reels" as const,
    url: "https://www.tiktok.com/@example/video/7890",
    thumbnailUrl: null,
    tags: ["faq", "resposta", "engajamento"],
    nicheTags: ["servicos", "atendimento"]
  },
  {
    title: "Get Ready With Me + produto",
    description: "Formato GRWM incorporando produto naturalmente.",
    platform: "instagram" as const,
    format: "reels" as const,
    url: "https://www.instagram.com/reel/example5",
    thumbnailUrl: null,
    tags: ["grwm", "rotina", "beleza"],
    nicheTags: ["beleza", "moda"]
  },
  {
    title: "Roteiro storytelling: problema → solução",
    description: "Estrutura narrativa clássica de problema e solução.",
    platform: "youtube" as const,
    format: "shorts" as const,
    url: "https://youtube.com/shorts/example3",
    thumbnailUrl: null,
    tags: ["storytelling", "roteiro", "narrativa"],
    nicheTags: ["marketing", "educacional"]
  },
  {
    title: "Behind the scenes: como faço meus conteúdos",
    description: "Bastidores mostrando processo criativo.",
    platform: "instagram" as const,
    format: "reels" as const,
    url: "https://www.instagram.com/reel/example6",
    thumbnailUrl: null,
    tags: ["bastidores", "bts", "processo"],
    nicheTags: ["criadores", "marketing"]
  },
  {
    title: "Reação genuína: primeira vez usando",
    description: "Captura reação autêntica ao experimentar produto pela primeira vez.",
    platform: "tiktok" as const,
    format: "reels" as const,
    url: "https://www.tiktok.com/@example/video/2468",
    thumbnailUrl: null,
    tags: ["reacao", "primeiro-uso", "autentico"],
    nicheTags: ["lifestyle", "tech"]
  },
  {
    title: "Duet/Stitch com review de marca",
    description: "Colaboração virtual respondendo ou complementando conteúdo.",
    platform: "tiktok" as const,
    format: "reels" as const,
    url: "https://www.tiktok.com/@example/video/1357",
    thumbnailUrl: null,
    tags: ["duet", "stitch", "colaboracao"],
    nicheTags: ["entretenimento", "reviews"]
  },
  {
    title: "Ad criativo: mini filme de 15s",
    description: "Anúncio cinematográfico com narrativa envolvente.",
    platform: "instagram" as const,
    format: "ad" as const,
    url: "https://www.instagram.com/reel/example7",
    thumbnailUrl: null,
    tags: ["ad", "criativo", "cinematico"],
    nicheTags: ["marketing", "publicidade"]
  },
  {
    title: "Lifestyle shot: produto no contexto",
    description: "Imagem/vídeo do produto integrado em ambiente lifestyle.",
    platform: "instagram" as const,
    format: "post" as const,
    url: "https://www.instagram.com/p/example",
    thumbnailUrl: null,
    tags: ["lifestyle", "contexto", "ambiente"],
    nicheTags: ["decoracao", "lifestyle"]
  },
  {
    title: "Challenge viral: desafio com produto",
    description: "Cria ou participa de challenge viral usando o produto.",
    platform: "tiktok" as const,
    format: "reels" as const,
    url: "https://www.tiktok.com/@example/video/9999",
    thumbnailUrl: null,
    tags: ["challenge", "viral", "desafio"],
    nicheTags: ["entretenimento", "fitness"]
  }
];

async function seedInspirations() {
  console.log("Checking existing inspirations...");
  
  const existing = await db.select().from(inspirations);
  if (existing.length > 0) {
    console.log(`Found ${existing.length} inspirations. Skipping seed.`);
    return;
  }

  console.log("Seeding 20 inspirations...");
  
  for (const insp of inspirationsData) {
    await db.insert(inspirations).values(insp);
  }
  
  console.log("Successfully seeded 20 inspirations!");
}

seedInspirations()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Error seeding inspirations:", err);
    process.exit(1);
  });
