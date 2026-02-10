import { db } from "./db";
import { courses, courseModules, courseLessons } from "@shared/schema";
import { eq } from "drizzle-orm";

const academyCourses = [
  {
    slug: "ugc-que-vende",
    title: "UGC que vende: do briefing ao post",
    description: "Aprenda a criar conteúdo gerado pelo usuário que realmente converte. Do entendimento do briefing até a entrega final do post perfeito.",
    level: "basic" as const,
    estimatedMinutes: 45,
    coverUrl: null,
    modules: [
      {
        title: "Entendendo o Briefing",
        order: 0,
        lessons: [
          {
            title: "O que é um briefing e por que ele importa",
            order: 0,
            contentType: "text" as const,
            content: { body: "O briefing é o documento que contém todas as informações necessárias para criar seu conteúdo. Ele define o tom, os objetivos, o público-alvo e os requisitos específicos da marca. Entender o briefing é o primeiro passo para uma entrega de sucesso.\n\n**Elementos principais de um briefing:**\n- Objetivo da campanha\n- Tom de voz desejado\n- Público-alvo\n- Mensagens-chave\n- Do's and Don'ts\n- Prazo de entrega" },
            durationMinutes: 5,
          },
          {
            title: "Como interpretar requisitos da marca",
            order: 1,
            contentType: "text" as const,
            content: { body: "Marcas têm identidades únicas. Interpretar corretamente os requisitos significa:\n\n1. **Estudar a marca**: Visite o perfil, veja outros conteúdos\n2. **Identificar o tom**: Formal, casual, divertido?\n3. **Entender restrições**: O que NÃO pode ser feito\n4. **Analisar referências**: Use exemplos fornecidos como guia\n\n**Dica de ouro**: Quando em dúvida, pergunte! Melhor esclarecer antes do que refazer depois." },
            durationMinutes: 7,
          },
          {
            title: "Checklist pré-produção",
            order: 2,
            contentType: "checklist" as const,
            content: { items: ["Li o briefing completo pelo menos 2 vezes", "Anotei todas as mensagens-chave obrigatórias", "Identifiquei o tom de voz correto", "Verifiquei prazo de entrega", "Tenho todas as hashtags/menções necessárias", "Entendi os produtos/serviços a destacar"] },
            durationMinutes: 3,
          },
        ],
      },
      {
        title: "Criando Conteúdo que Converte",
        order: 1,
        lessons: [
          {
            title: "Estrutura de um UGC eficiente",
            order: 0,
            contentType: "text" as const,
            content: { body: "Um UGC que converte segue uma estrutura comprovada:\n\n**1. Hook (0-3 segundos)**\nCapture atenção imediatamente. Use perguntas, afirmações impactantes ou visual interessante.\n\n**2. Problema/Contexto (3-10 segundos)**\nApresente uma situação que o público se identifica.\n\n**3. Solução/Produto (10-25 segundos)**\nMostre como o produto resolve o problema de forma natural.\n\n**4. Benefício/Resultado (25-45 segundos)**\nDestaque os resultados e faça o CTA.\n\n**5. CTA Final**\nDirecione a ação desejada." },
            durationMinutes: 10,
          },
          {
            title: "Iluminação e enquadramento básico",
            order: 1,
            contentType: "text" as const,
            content: { body: "Você não precisa de equipamento profissional para fazer bom conteúdo!\n\n**Iluminação:**\n- Use luz natural sempre que possível\n- Fique de frente para a janela\n- Evite luz direta no rosto (cria sombras)\n- Luz difusa é sua amiga\n\n**Enquadramento:**\n- Regra dos terços: posicione-se em 1/3 da tela\n- Deixe espaço acima da cabeça\n- Fundo limpo e organizado\n- Vertical para Stories/Reels, horizontal para YouTube\n\n**Dica**: Teste antes de gravar a versão final!" },
            durationMinutes: 8,
          },
          {
            title: "Edição rápida para iniciantes",
            order: 2,
            contentType: "text" as const,
            content: { body: "Edição não precisa ser complicada. Apps gratuitos que funcionam bem:\n\n- **CapCut**: Completo e gratuito\n- **InShot**: Simples e intuitivo\n- **VN**: Ótimo para Reels\n\n**O básico que você precisa saber:**\n1. Cortar silêncios e erros\n2. Adicionar legendas (obrigatório!)\n3. Música de fundo no volume certo\n4. Transições simples\n5. Texto na tela para CTAs\n\n**Tempo médio de edição**: 15-30 min por vídeo de 30 segundos" },
            durationMinutes: 12,
          },
        ],
      },
    ],
  },
  {
    slug: "ctr-hook-5-minutos",
    title: "Como aumentar CTR/Hook em 5 minutos",
    description: "Técnicas práticas e rápidas para criar hooks irresistíveis e aumentar a taxa de cliques do seu conteúdo.",
    level: "intermediate" as const,
    estimatedMinutes: 25,
    coverUrl: null,
    modules: [
      {
        title: "A Ciência do Hook",
        order: 0,
        lessons: [
          {
            title: "Por que os primeiros 3 segundos decidem tudo",
            order: 0,
            contentType: "text" as const,
            content: { body: "O algoritmo analisa a retenção dos primeiros segundos para decidir se seu conteúdo merece ser distribuído.\n\n**Dados importantes:**\n- 65% dos usuários abandonam vídeos nos primeiros 3 segundos\n- Retenção acima de 50% no primeiro quarto = maior distribuição\n- Hook forte = mais views, mais engajamento, mais conversão\n\n**O que NÃO fazer:**\n- Começar com \"oi gente, tudo bem?\"\n- Explicar o que vai acontecer\n- Usar intros longas\n\n**O que FAZER:**\n- Começar com o melhor momento\n- Provocar curiosidade imediata\n- Usar movimento visual" },
            durationMinutes: 5,
          },
          {
            title: "5 tipos de hooks que funcionam",
            order: 1,
            contentType: "text" as const,
            content: { body: "**1. Pergunta Provocadora**\n\"Você sabia que 90% das pessoas fazem isso errado?\"\n\n**2. Afirmação Contraintuitiva**\n\"Parei de usar shampoo e meu cabelo nunca esteve melhor\"\n\n**3. Resultado Primeiro**\n\"Isso aqui mudou minha pele em 7 dias\" (mostrando o resultado)\n\n**4. Movimento + Curiosidade**\nAção visual interessante + texto chamativo na tela\n\n**5. Storytelling Rápido**\n\"Eu não acreditava até testar...\" (início da história)\n\n**Exercício**: Escreva 3 hooks diferentes para seu próximo conteúdo e teste!" },
            durationMinutes: 8,
          },
          {
            title: "Testando e otimizando seu hook",
            order: 2,
            contentType: "text" as const,
            content: { body: "**Como saber se seu hook funcionou:**\n\n1. **Taxa de retenção**: Veja o gráfico de retenção do Instagram/TikTok\n2. **Proporção visualizações/curtidas**: Mais de 5% = bom hook\n3. **Comentários**: Pessoas engajando = hook eficiente\n\n**Método de teste A/B:**\n- Grave o mesmo conteúdo com 2 hooks diferentes\n- Poste em horários similares\n- Compare métricas após 24h\n\n**Iteração constante:**\nMantenha um arquivo com seus melhores hooks. Analise padrões do que funciona para você." },
            durationMinutes: 7,
          },
        ],
      },
      {
        title: "CTR em Diferentes Formatos",
        order: 1,
        lessons: [
          {
            title: "Hooks para Reels vs Stories vs Feed",
            order: 0,
            contentType: "text" as const,
            content: { body: "Cada formato tem suas particularidades:\n\n**Reels/TikTok:**\n- Movimento imediato\n- Texto grande na tela\n- Música trending\n- Hook visual + textual\n\n**Stories:**\n- Enquetes e perguntas funcionam\n- \"Arrasta pra cima\" com urgência\n- Preview do conteúdo\n\n**Feed/Carrossel:**\n- Primeira imagem é o hook\n- Título chamativo\n- Promessa clara do que vem a seguir\n\n**Dica universal**: Adapte o mesmo conteúdo para cada formato, não copie igual!" },
            durationMinutes: 5,
          },
        ],
      },
    ],
  },
  {
    slug: "checklist-entrega",
    title: "Checklist de entrega: como evitar reprovação",
    description: "Guia completo para garantir que seu conteúdo seja aprovado de primeira. Evite os erros mais comuns e aumente sua taxa de aprovação.",
    level: "basic" as const,
    estimatedMinutes: 30,
    coverUrl: null,
    modules: [
      {
        title: "Antes de Enviar",
        order: 0,
        lessons: [
          {
            title: "Os 10 erros mais comuns de reprovação",
            order: 0,
            contentType: "text" as const,
            content: { body: "**Erros técnicos:**\n1. Qualidade baixa de vídeo/áudio\n2. Vídeo em formato errado (horizontal quando deveria ser vertical)\n3. Duração fora do especificado\n\n**Erros de conteúdo:**\n4. Não mencionar produto/marca corretamente\n5. Tom de voz inadequado\n6. Falta de legendas\n7. CTA ausente ou fraco\n\n**Erros de processo:**\n8. Entrega após prazo\n9. Não seguir o briefing\n10. Esquecer hashtags/menções obrigatórias\n\n**Regra de ouro**: Releia o briefing ANTES de enviar!" },
            durationMinutes: 8,
          },
          {
            title: "Checklist técnico completo",
            order: 1,
            contentType: "checklist" as const,
            content: { items: ["Resolução mínima 1080p", "Áudio limpo sem ruídos", "Formato correto (9:16 ou 16:9)", "Duração dentro do especificado", "Legendas adicionadas e revisadas", "Marca d'água removida (se não autorizada)", "Arquivo no formato solicitado (MP4, MOV)", "Tamanho do arquivo dentro do limite"] },
            durationMinutes: 5,
          },
          {
            title: "Checklist de conteúdo",
            order: 2,
            contentType: "checklist" as const,
            content: { items: ["Produto/serviço aparece claramente", "Mensagens-chave do briefing incluídas", "Tom de voz alinhado com a marca", "CTA presente e claro", "Hashtags obrigatórias incluídas", "Menções corretas (@marca)", "Sem erros de português", "Informações corretas sobre o produto"] },
            durationMinutes: 5,
          },
        ],
      },
      {
        title: "Processo de Entrega",
        order: 1,
        lessons: [
          {
            title: "Como organizar seus arquivos",
            order: 0,
            contentType: "text" as const,
            content: { body: "Organização poupa tempo e evita erros:\n\n**Estrutura de pastas sugerida:**\n```\n📁 Campanhas\n  📁 [Nome da Marca] - [Data]\n    📁 Briefing\n    📁 Referências\n    📁 Rascunhos\n    📁 Final\n    📁 Aprovados\n```\n\n**Nomenclatura de arquivos:**\n`[Marca]_[Tipo]_[Data]_v[Versão].mp4`\n\nExemplo: `Bready_Reels_20240115_v2.mp4`\n\n**Backup**: Sempre mantenha os arquivos originais até aprovação final!" },
            durationMinutes: 5,
          },
          {
            title: "Comunicação com a marca",
            order: 1,
            contentType: "text" as const,
            content: { body: "**Boas práticas de comunicação:**\n\n1. **Seja proativo**: Informe sobre seu progresso\n2. **Pergunte cedo**: Dúvidas são melhores no início\n3. **Seja profissional**: Responda em até 24h\n4. **Documente tudo**: Mantenha registro das conversas\n\n**Ao enviar o conteúdo:**\n- Inclua breve descrição do que está enviando\n- Mencione se seguiu alguma sugestão específica\n- Pergunte se precisa de ajustes\n\n**Se precisar de mais prazo:**\nAvise com antecedência! Nunca no dia da entrega." },
            durationMinutes: 4,
          },
          {
            title: "Lidando com pedidos de revisão",
            order: 2,
            contentType: "text" as const,
            content: { body: "Revisões fazem parte do processo. Lide com profissionalismo:\n\n**Ao receber feedback:**\n1. Leia com atenção (não responda de imediato)\n2. Anote todos os pontos solicitados\n3. Esclareça dúvidas se necessário\n4. Confirme prazo para nova versão\n\n**Ao refazer:**\n- Enderece TODOS os pontos\n- Indique o que foi alterado\n- Mantenha a qualidade\n\n**Limite de revisões:**\nConheça seu contrato. Se exceder, comunique profissionalmente.\n\n**Dica**: A maioria das revisões vem de não seguir o briefing. Revise antes de entregar!" },
            durationMinutes: 5,
          },
        ],
      },
    ],
  },
];

export async function seedAcademyCourses() {
  console.log("[Academy Seed] Iniciando seed dos cursos...");
  
  for (const courseData of academyCourses) {
    const existingCourse = await db.select().from(courses).where(eq(courses.slug, courseData.slug));
    
    if (existingCourse.length > 0) {
      console.log(`[Academy Seed] Curso "${courseData.title}" já existe, pulando...`);
      continue;
    }
    
    console.log(`[Academy Seed] Criando curso: ${courseData.title}`);
    
    const [course] = await db.insert(courses).values({
      slug: courseData.slug,
      title: courseData.title,
      description: courseData.description,
      level: courseData.level,
      estimatedMinutes: courseData.estimatedMinutes,
      coverUrl: courseData.coverUrl,
      isPublished: true,
    }).returning();
    
    for (const moduleData of courseData.modules) {
      const [module] = await db.insert(courseModules).values({
        courseId: course.id,
        title: moduleData.title,
        order: moduleData.order,
      }).returning();
      
      for (const lessonData of moduleData.lessons) {
        await db.insert(courseLessons).values({
          moduleId: module.id,
          title: lessonData.title,
          order: lessonData.order,
          contentType: lessonData.contentType,
          content: lessonData.content,
          durationMinutes: lessonData.durationMinutes,
        });
      }
    }
    
    console.log(`[Academy Seed] Curso "${courseData.title}" criado com sucesso!`);
  }
  
  console.log("[Academy Seed] Seed completo!");
}

import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const isMainModule = process.argv[1] && path.resolve(process.argv[1]) === path.resolve(__filename);

if (isMainModule) {
  seedAcademyCourses()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error("[Academy Seed] Erro:", err);
      process.exit(1);
    });
}
