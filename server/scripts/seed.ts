import { db } from "../db";
import { featureFlags, creatorLevels, badges, courses, courseModules, courseLessons } from "@shared/schema";
import { eq } from "drizzle-orm";

async function seed() {
  console.log("[Seed] Starting seed data insertion...");

  await db.transaction(async (tx) => {
    const flagsData = [
      { name: "gamification_enabled", description: "Habilita sistema de pontos, níveis e badges para criadores", enabled: true, module: "gamification" as const },
      { name: "leaderboard_enabled", description: "Habilita ranking de criadores por pontos", enabled: true, module: "gamification" as const },
      { name: "advanced_analytics_enabled", description: "Habilita métricas avançadas e relatórios detalhados", enabled: false, module: "advanced_analytics" as const },
      { name: "ecommerce_tracking", description: "Habilita rastreamento de vendas e comissões de criadores", enabled: false, module: "ecommerce" as const },
      { name: "social_listening_enabled", description: "Habilita monitoramento de menções e tendências", enabled: false, module: "social_listening" as const },
    ];

    for (const flag of flagsData) {
      await tx.insert(featureFlags).values(flag).onConflictDoNothing();
    }
    console.log(`[Seed] ${flagsData.length} feature flags inseridas`);

    const levelsData = [
      { name: "Bronze", minPoints: 0, maxPoints: 499, icon: "🥉", color: "#CD7F32", benefits: ["Acesso à plataforma", "Participar de campanhas públicas"] },
      { name: "Prata", minPoints: 500, maxPoints: 1999, icon: "🥈", color: "#C0C0C0", benefits: ["Campanhas exclusivas", "Suporte prioritário", "Badge de nível"] },
      { name: "Ouro", minPoints: 2000, maxPoints: 4999, icon: "🥇", color: "#FFD700", benefits: ["Convites VIP", "Cashback aumentado", "Destaque no perfil", "Acesso antecipado"] },
      { name: "Diamante", minPoints: 5000, maxPoints: null, icon: "💎", color: "#B9F2FF", benefits: ["Prioridade máxima", "Taxa reduzida", "Mentoria exclusiva", "Eventos presenciais", "Suporte dedicado"] },
    ];

    for (const level of levelsData) {
      await tx.insert(creatorLevels).values(level).onConflictDoNothing();
    }
    console.log(`[Seed] ${levelsData.length} níveis de criador inseridos`);

    const badgesData = [
      { name: "Primeira Campanha", description: "Completou sua primeira campanha com sucesso", icon: "🎯", color: "#4CAF50", requirement: "complete_campaigns", requiredValue: 1 },
      { name: "Veterano", description: "Completou 10 campanhas", icon: "⭐", color: "#FF9800", requirement: "complete_campaigns", requiredValue: 10 },
      { name: "Super Criador", description: "Completou 50 campanhas", icon: "🏆", color: "#FFD700", requirement: "complete_campaigns", requiredValue: 50 },
      { name: "Engajamento Top", description: "Atingiu taxa de engajamento acima de 5%", icon: "🔥", color: "#F44336", requirement: "engagement_rate", requiredValue: 5 },
      { name: "Influenciador", description: "Alcançou 10.000 seguidores", icon: "📢", color: "#2196F3", requirement: "followers_count", requiredValue: 10000 },
      { name: "Mega Influenciador", description: "Alcançou 100.000 seguidores", icon: "🌟", color: "#9C27B0", requirement: "followers_count", requiredValue: 100000 },
      { name: "Pontualidade", description: "Entregou 5 campanhas antes do prazo", icon: "⏰", color: "#00BCD4", requirement: "early_deliveries", requiredValue: 5 },
      { name: "Comunidade Ativa", description: "Faz parte de 5 comunidades de marcas", icon: "🤝", color: "#795548", requirement: "brand_memberships", requiredValue: 5 },
      { name: "Aluno Dedicado", description: "Completou 3 cursos da Academy", icon: "📚", color: "#3F51B5", requirement: "complete_courses", requiredValue: 3 },
      { name: "Conteúdo Viral", description: "Teve um post com mais de 100k visualizações", icon: "🚀", color: "#E91E63", requirement: "viral_post", requiredValue: 100000, isSecret: true },
    ];

    for (const badge of badgesData) {
      await tx.insert(badges).values(badge).onConflictDoNothing();
    }
    console.log(`[Seed] ${badgesData.length} badges inseridas`);

    const coursesData = [
      {
        slug: "ugc-fundamentals",
        title: "Fundamentos de UGC",
        description: "Aprenda os conceitos básicos de User-Generated Content, como criar conteúdo autêntico e atrair marcas.",
        level: "basic" as const,
        estimatedMinutes: 60,
        modules: [
          {
            title: "O que é UGC?", order: 1,
            lessons: [
              { title: "Introdução ao UGC", order: 1, contentType: "text" as const, content: { body: "UGC (User-Generated Content) é conteúdo criado por consumidores reais, não pela marca. É autêntico, acessível e converte muito mais que publicidade tradicional." }, durationMinutes: 10 },
              { title: "Por que marcas pagam por UGC?", order: 2, contentType: "text" as const, content: { body: "Marcas investem em UGC porque consumidores confiam 2.4x mais em conteúdo feito por pessoas reais. Isso aumenta conversão, engajamento e reduz custo de aquisição." }, durationMinutes: 8 },
              { title: "Tipos de conteúdo UGC", order: 3, contentType: "text" as const, content: { body: "Os principais formatos são: unboxing, review/depoimento, tutorial/how-to, antes e depois, e lifestyle/uso diário. Cada formato atende um objetivo diferente da marca." }, durationMinutes: 10 },
            ],
          },
          {
            title: "Criando seu primeiro conteúdo", order: 2,
            lessons: [
              { title: "Equipamentos essenciais", order: 1, contentType: "checklist" as const, content: { items: ["Smartphone com boa câmera", "Ring light ou luz natural", "Tripé para celular", "Microfone de lapela (opcional)", "App de edição (CapCut, InShot)"] }, durationMinutes: 5 },
              { title: "Roteiro e storytelling", order: 2, contentType: "text" as const, content: { body: "Todo bom UGC segue uma estrutura: gancho (3s), problema/contexto, solução/produto, resultado/CTA. Mantenha natural e conversacional." }, durationMinutes: 12 },
            ],
          },
          {
            title: "Trabalhando com marcas", order: 3,
            lessons: [
              { title: "Como se candidatar a campanhas", order: 1, contentType: "text" as const, content: { body: "Use a plataforma para explorar campanhas abertas. Leia o briefing com atenção, entenda os entregáveis e prazos. Sua candidatura deve mostrar por que você é a pessoa certa." }, durationMinutes: 8 },
              { title: "Entregando conteúdo de qualidade", order: 2, contentType: "text" as const, content: { body: "Siga o briefing, respeite os prazos, e sempre entregue acima do esperado. Inclua variações quando possível. Marcas amam criadores confiáveis." }, durationMinutes: 7 },
            ],
          },
        ],
      },
      {
        slug: "instagram-growth",
        title: "Crescimento no Instagram",
        description: "Estratégias práticas para crescer seu perfil, aumentar engajamento e atrair oportunidades de marcas.",
        level: "intermediate" as const,
        estimatedMinutes: 45,
        modules: [
          {
            title: "Otimizando seu perfil", order: 1,
            lessons: [
              { title: "Bio que converte", order: 1, contentType: "text" as const, content: { body: "Sua bio deve responder: quem é você, o que faz, e por que seguir. Use emojis com moderação, inclua CTA e link da plataforma." }, durationMinutes: 8 },
              { title: "Destaques estratégicos", order: 2, contentType: "text" as const, content: { body: "Organize seus destaques por: Portfolio, Depoimentos, Bastidores, e Sobre mim. Isso funciona como um currículo visual para marcas." }, durationMinutes: 7 },
            ],
          },
          {
            title: "Estratégia de conteúdo", order: 2,
            lessons: [
              { title: "Pilares de conteúdo", order: 1, contentType: "text" as const, content: { body: "Defina 3-4 pilares de conteúdo que representam sua marca pessoal. Ex: lifestyle, dicas de beleza, reviews, bastidores. Mantenha consistência." }, durationMinutes: 10 },
              { title: "Melhores horários e frequência", order: 2, contentType: "text" as const, content: { body: "Poste de 3-5x por semana. Use os insights do Instagram para descobrir quando seus seguidores estão online. Reels têm maior alcance." }, durationMinutes: 8 },
              { title: "Hashtags e alcance", order: 3, contentType: "text" as const, content: { body: "Use 5-10 hashtags relevantes (mix de populares e nichadas). Evite hashtags banidas. Mude as hashtags entre posts para evitar shadowban." }, durationMinutes: 7 },
            ],
          },
        ],
      },
      {
        slug: "monetization-strategies",
        title: "Estratégias de Monetização",
        description: "Como transformar sua audiência em renda: parcerias, programas de afiliados, e diversificação de receita.",
        level: "advanced" as const,
        estimatedMinutes: 50,
        modules: [
          {
            title: "Precificação", order: 1,
            lessons: [
              { title: "Quanto cobrar por conteúdo", order: 1, contentType: "text" as const, content: { body: "Base: R$100-300 por Reel para micro-influenciadores (1k-10k seguidores). Ajuste conforme engajamento, nicho e complexidade do conteúdo." }, durationMinutes: 12 },
              { title: "Negociação com marcas", order: 2, contentType: "text" as const, content: { body: "Nunca aceite a primeira oferta. Apresente seu mídia kit, mostre resultados anteriores, e negocie pacotes ao invés de peças isoladas." }, durationMinutes: 10 },
            ],
          },
          {
            title: "Diversificando receita", order: 2,
            lessons: [
              { title: "Programas de afiliados", order: 1, contentType: "text" as const, content: { body: "Afiliados geram renda passiva. Escolha produtos que você usa, crie conteúdo genuíno e use links rastreáveis. Comissões variam de 5% a 30%." }, durationMinutes: 10 },
              { title: "Construindo renda recorrente", order: 2, contentType: "text" as const, content: { body: "Contratos mensais com marcas, comunidades pagas, e conteúdo exclusivo são formas de criar previsibilidade financeira como criador." }, durationMinutes: 8 },
            ],
          },
        ],
      },
    ];

    for (const courseData of coursesData) {
      const existing = await tx.select({ id: courses.id }).from(courses).where(eq(courses.slug, courseData.slug));
      if (existing.length > 0) {
        console.log(`[Seed] Curso "${courseData.title}" já existe, pulando...`);
        continue;
      }

      const { modules, ...courseFields } = courseData;
      const [course] = await tx.insert(courses).values({ ...courseFields, isPublished: true }).returning();

      for (const modData of modules) {
        const { lessons, ...modFields } = modData;
        const [mod] = await tx.insert(courseModules).values({ ...modFields, courseId: course.id }).returning();

        await tx.insert(courseLessons).values(
          lessons.map(l => ({ ...l, moduleId: mod.id }))
        );
      }
    }

    console.log(`[Seed] ${coursesData.length} cursos com módulos e lições processados`);
  });

  console.log("[Seed] Seed completo!");
}

seed()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("[Seed] Error:", err);
    process.exit(1);
  });
