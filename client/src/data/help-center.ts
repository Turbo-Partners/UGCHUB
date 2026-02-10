import { Users, Building2, Scale, Rocket, Megaphone, Wallet, Star, GraduationCap, UsersRound, Wrench, BookOpen, ShieldCheck, FileText, Handshake, BarChart3, Plug, MessageSquare, Package, Trophy } from "lucide-react";

export interface HelpArticle {
  slug: string;
  title: string;
  summary: string;
  content: string;
  tags: string[];
}

export interface HelpSection {
  slug: string;
  title: string;
  icon: any;
  description: string;
  articles: HelpArticle[];
}

export interface HelpCategory {
  slug: string;
  title: string;
  description: string;
  icon: any;
  color: string;
  sections: HelpSection[];
}

export const helpCategories: HelpCategory[] = [
  {
    slug: "criadores",
    title: "Sou Criador",
    description: "Campanhas, entregas, pagamentos e reputação",
    icon: Users,
    color: "violet",
    sections: [
      {
        slug: "primeiros-passos",
        title: "Primeiros Passos",
        icon: Rocket,
        description: "Comece sua jornada como creator na plataforma",
        articles: [
          {
            slug: "como-criar-conta",
            title: "Como criar minha conta de creator",
            summary: "Passo a passo para se cadastrar na plataforma como criador de conteúdo.",
            tags: ["cadastro", "conta", "registro", "login"],
            content: `
<h2>Criando sua conta</h2>
<p>Para começar na CreatorConnect:</p>
<ol>
<li><strong>Acesse a página inicial</strong> — Clique em "Começar Agora" ou vá direto para a tela de login.</li>
<li><strong>Selecione "Sou Criador"</strong> — Escolha o tipo de conta creator.</li>
<li><strong>Preencha seus dados</strong> — Nome, e-mail e senha.</li>
<li><strong>Complete o onboarding</strong> — Você será direcionado para o cadastro em 3 etapas (veja o próximo artigo).</li>
</ol>
<h2>Login com Google</h2>
<p>Você também pode criar sua conta usando o Google para agilizar o processo. Basta clicar em "Continuar com Google" na tela de login.</p>
            `,
          },
          {
            slug: "onboarding-creator",
            title: "Onboarding: as 3 etapas do cadastro",
            summary: "Entenda cada etapa do cadastro: redes sociais, dados bancários e informações pessoais.",
            tags: ["onboarding", "cadastro", "perfil", "nicho"],
            content: `
<h2>Etapa 1: Nicho & Redes</h2>
<p>Nesta primeira etapa, você vai:</p>
<ul>
<li><strong>Selecionar seus nichos</strong> — Escolha entre: Tecnologia & Games, Estilo de Vida & Vlogs, Beleza & Moda, Educação, Finanças & Investimentos, Saúde & Fitness, Viagens, Gastronomia, Entretenimento & Humor.</li>
<li><strong>Conectar suas redes</strong> — Informe seu @ do Instagram, TikTok e/ou YouTube. Esses dados permitem que marcas avaliem seu alcance.</li>
<li><strong>Escrever sua bio</strong> — Uma descrição curta sobre você e seu conteúdo.</li>
</ul>
<h2>Etapa 2: Dados Bancários</h2>
<ul>
<li><strong>Chave Pix</strong> — Cadastre sua chave Pix para receber pagamentos.</li>
</ul>
<h2>Etapa 3: Cadastro Pessoal</h2>
<ul>
<li><strong>CPF</strong> — Necessário para faturamento e pagamentos.</li>
<li><strong>Telefone</strong> — Para contato e notificações.</li>
<li><strong>Endereço completo</strong> — CEP (com preenchimento automático), rua, número, bairro, cidade e estado. Essencial para campanhas com envio de produtos (seeding).</li>
</ul>
<p>Ao finalizar as 3 etapas, seu perfil estará pronto e você será redirecionado para o painel principal.</p>
            `,
          },
          {
            slug: "como-funciona-plataforma",
            title: "Como a plataforma funciona para creators",
            summary: "Visão geral da navegação e fluxo completo: do cadastro ao primeiro pagamento.",
            tags: ["plataforma", "fluxo", "como funciona", "navegação"],
            content: `
<h2>Seu painel de navegação</h2>
<p>Após o login, você terá acesso ao menu lateral com as seguintes seções:</p>
<ul>
<li><strong>Início</strong> — Seu dashboard com resumo de convites, campanhas ativas, comunidades, saldo da carteira e analytics das redes.</li>
<li><strong>Descobrir</strong> — Feed de campanhas disponíveis para candidatura, com filtros por nicho, plataforma, prazo e orçamento.</li>
<li><strong>Marcas</strong> — Lista de marcas que você faz parte ou recebeu convites, com detalhes de cada comunidade.</li>
<li><strong>Campanhas</strong> — Suas campanhas ativas, candidaturas pendentes e convites de campanhas.</li>
<li><strong>Mensagens</strong> — Chat direto com as marcas sobre campanhas e comunidades.</li>
<li><strong>Carteira</strong> — Saldo disponível, pendente, histórico de transações e configuração de Pix.</li>
<li><strong>Academy</strong> — Cursos e aulas para aprimorar suas habilidades como creator.</li>
<li><strong>Ranking</strong> — Seu nível, pontos, badges conquistados e leaderboard geral.</li>
<li><strong>Configurações</strong> — Edição do perfil, redes sociais e dados pessoais.</li>
</ul>
<h2>Fluxo resumido</h2>
<ol>
<li>Complete seu perfil no onboarding.</li>
<li>Receba convites de marcas ou candidate-se pelo "Descobrir".</li>
<li>Siga o fluxo da campanha (aceite → contrato → produto → produção → revisão → entrega).</li>
<li>Receba pagamento na sua Carteira e solicite saque via Pix.</li>
</ol>
            `,
          },
        ],
      },
      {
        slug: "dashboard",
        title: "Início (Dashboard)",
        icon: BarChart3,
        description: "Seu painel principal com resumo de tudo",
        articles: [
          {
            slug: "visao-geral-dashboard",
            title: "O que tem no meu painel Início",
            summary: "Entenda cada seção do seu dashboard: convites, campanhas, comunidades, carteira e analytics.",
            tags: ["dashboard", "início", "painel", "visão geral"],
            content: `
<h2>Convites Pendentes</h2>
<p>No topo do painel, você vê seus convites pendentes — tanto para comunidades de marcas quanto para campanhas específicas. Cada convite mostra a marca, o tipo (comunidade ou campanha) e a data. Você pode aceitar ou recusar diretamente.</p>

<h2>Campanhas Ativas</h2>
<p>Cards com suas campanhas em andamento, mostrando o título, a marca, seu status atual no workflow e qual é a próxima ação que você precisa tomar.</p>

<h2>Comunidades</h2>
<p>Lista das marcas onde você é membro da comunidade, com seu tier atual (ex: Bronze, Prata, Ouro), pontos acumulados e cupom de desconto se houver.</p>

<h2>Carteira</h2>
<p>Resumo rápido com saldo disponível e saldo pendente em reais (R$).</p>

<h2>Analytics das Redes</h2>
<p>Métricas do seu Instagram e TikTok (quando conectados): seguidores, taxa de engajamento, posts recentes com likes, comentários e views. Inclui gráficos de evolução e indicadores de crescimento.</p>

<h2>Ações Sugeridas</h2>
<p>O sistema sugere próximas ações prioritárias, como "Completar perfil", "Ver convite pendente", "Enviar entregável", etc.</p>
            `,
          },
        ],
      },
      {
        slug: "descobrir",
        title: "Descobrir",
        icon: Megaphone,
        description: "Encontre campanhas disponíveis e candidate-se",
        articles: [
          {
            slug: "como-usar-descobrir",
            title: "Como encontrar e se candidatar a campanhas",
            summary: "Use a página Descobrir para encontrar oportunidades filtradas por nicho, plataforma e orçamento.",
            tags: ["descobrir", "feed", "campanhas", "candidatura", "explorar"],
            content: `
<h2>A página Descobrir</h2>
<p>No menu lateral, clique em <strong>"Descobrir"</strong>. Essa página mostra todas as campanhas abertas para candidatura.</p>

<h2>Filtros disponíveis</h2>
<ul>
<li><strong>Busca por texto</strong> — Pesquise por nome da campanha ou marca.</li>
<li><strong>Nicho</strong> — Filtre por categorias como Beleza, Tech, Fitness, etc.</li>
<li><strong>Plataforma</strong> — Instagram, TikTok, YouTube.</li>
<li><strong>Ordenação</strong> — Por prazo, orçamento ou relevância.</li>
</ul>

<h2>Visualização</h2>
<p>Você pode alternar entre visualização em <strong>cards</strong> (grade) ou <strong>tabela</strong> (lista), conforme sua preferência.</p>

<h2>Candidatando-se</h2>
<ol>
<li>Clique no card da campanha para ver os detalhes completos (briefing, entregáveis, requisitos, orçamento, prazo).</li>
<li>Se atender aos requisitos, clique em <strong>"Candidatar-se"</strong>.</li>
<li>Opcionalmente, adicione uma mensagem de apresentação.</li>
<li>Sua candidatura ficará como "Pendente" até a marca aceitar ou recusar.</li>
</ol>

<h2>Favoritar marcas</h2>
<p>Você pode favoritar marcas para acompanhar suas campanhas futuras. Marcas favoritadas aparecem em destaque no seu feed.</p>
            `,
          },
        ],
      },
      {
        slug: "marcas-comunidades",
        title: "Marcas e Comunidades",
        icon: UsersRound,
        description: "Gerencie suas relações com marcas e participe de comunidades",
        articles: [
          {
            slug: "como-funciona-marcas",
            title: "Como funciona a página Marcas",
            summary: "Veja suas marcas, comunidades ativas e convites pendentes.",
            tags: ["marcas", "comunidades", "convites", "membership"],
            content: `
<h2>Página Marcas</h2>
<p>No menu lateral, clique em <strong>"Marcas"</strong>. Esta página tem duas abas:</p>

<h3>Aba "Minhas Marcas"</h3>
<p>Lista todas as marcas onde você é membro da comunidade. Para cada marca, você vê:</p>
<ul>
<li>Nome e logo da marca</li>
<li>Seu status de membership (membro, pendente)</li>
<li>Seu tier atual (ex: Bronze, Prata, Ouro, Diamante)</li>
<li>Pontos acumulados</li>
<li>Cupom de desconto (se disponível)</li>
<li>Quantidade de campanhas abertas, ativas e completadas</li>
</ul>
<p>Clique em uma marca para acessar o <strong>Brand Hub do Creator</strong> (detalhes no próximo artigo).</p>

<h3>Aba "Convites"</h3>
<p>Mostra todos os convites pendentes — tanto para entrar em comunidades de marcas quanto para participar de campanhas específicas. Cada convite mostra:</p>
<ul>
<li>Nome e logo da marca</li>
<li>Tipo: comunidade ou campanha</li>
<li>Data do convite e prazo de expiração</li>
<li>Mensagem personalizada da marca (quando houver)</li>
</ul>
<p>Você pode <strong>aceitar</strong> ou <strong>recusar</strong> cada convite diretamente.</p>
            `,
          },
          {
            slug: "brand-hub-creator",
            title: "Brand Hub: sua página dentro da marca",
            summary: "Entenda o Brand Hub do creator — campanhas, pontos, tier, cupons e ações disponíveis.",
            tags: ["brand hub", "marca", "tier", "pontos", "cupom"],
            content: `
<h2>O que é o Brand Hub do Creator</h2>
<p>Ao clicar em uma marca na página "Marcas", você entra no Brand Hub — uma página dedicada à sua relação com aquela marca. Aqui você encontra:</p>

<h3>Cabeçalho</h3>
<ul>
<li>Nome e descrição da marca</li>
<li>Seu tier atual com cor e ícone</li>
<li>Seus pontos acumulados nessa marca</li>
<li>Barra de progresso até o próximo tier</li>
</ul>

<h3>Cupom de desconto</h3>
<p>Se a marca oferecer um cupom exclusivo para membros, ele aparece aqui com botão para copiar o código.</p>

<h3>Campanhas disponíveis</h3>
<p>Lista de campanhas da marca abertas para membros da comunidade. Campanhas com requisito de tier mínimo mostram se você é elegível ou não.</p>

<h3>Suas campanhas ativas</h3>
<p>Campanhas dessa marca em que você está participando, com status do workflow (Aceito, Contrato, Aguardando Produto, Produção, Revisão, Entregue).</p>

<h3>Convites pendentes</h3>
<p>Convites de campanha dessa marca que você ainda não respondeu.</p>

<h3>Próximas ações</h3>
<p>O sistema mostra ações sugeridas, como "Enviar entregável", "Aceitar convite", "Conferir endereço para envio de produto".</p>

<h3>Tiers da marca</h3>
<p>Visualização de todos os tiers disponíveis na marca, com pontos necessários e benefícios de cada nível (campanhas prioritárias, pagamento mais rápido, conteúdo exclusivo, badge visível, benefícios personalizados).</p>
            `,
          },
        ],
      },
      {
        slug: "campanhas",
        title: "Campanhas",
        icon: Megaphone,
        description: "Gerencie suas participações em campanhas",
        articles: [
          {
            slug: "pagina-campanhas",
            title: "Como usar a página Campanhas",
            summary: "Gerencie suas campanhas ativas, candidaturas e convites em um só lugar.",
            tags: ["campanhas", "ativas", "candidatura", "convites"],
            content: `
<h2>Página Campanhas</h2>
<p>No menu lateral, clique em <strong>"Campanhas"</strong>. Essa página organiza tudo em 3 abas:</p>

<h3>Aba "Ativas"</h3>
<p>Campanhas em que você está participando ativamente. Cada campanha mostra:</p>
<ul>
<li>Título e marca</li>
<li>Status atual no workflow (Aceito, Contrato, Aguardando Produto, Produção, Revisão, Entregue)</li>
<li>Barra de progresso visual</li>
<li>Próxima ação que você precisa tomar</li>
</ul>
<p>Clique em uma campanha para abrir a página detalhada com briefing, entregáveis e chat.</p>

<h3>Aba "Candidaturas"</h3>
<p>Campanhas para as quais você se candidatou e ainda aguarda resposta da marca. Status possíveis: Pendente, Aceita, Recusada.</p>

<h3>Aba "Convites"</h3>
<p>Convites de campanha recebidos de marcas. Você pode aceitar ou recusar cada convite.</p>
            `,
          },
          {
            slug: "workflow-campanha",
            title: "Fluxo de uma campanha: do aceite à entrega",
            summary: "Entenda cada etapa do workflow: aceito, contrato, produto, produção, revisão e entrega.",
            tags: ["workflow", "etapas", "status", "fluxo", "campanha"],
            content: `
<h2>As 6 etapas do workflow</h2>
<p>Toda campanha segue um fluxo de 6 etapas. Conforme você avança, a barra de progresso é atualizada:</p>

<ol>
<li><strong>Aceito</strong> — Sua candidatura foi aceita pela marca. Leia o briefing completo e prepare-se.</li>
<li><strong>Contrato</strong> — Termos e condições da campanha. Leia, aceite e prossiga.</li>
<li><strong>Aguardando Produto</strong> — Se a campanha envolve envio de produto (seeding), aguarde o recebimento. A marca enviará o produto para o endereço do seu cadastro.</li>
<li><strong>Produção</strong> — Hora de criar! Produza o conteúdo seguindo o briefing da campanha.</li>
<li><strong>Revisão</strong> — Envie seu conteúdo para a marca revisar. A marca pode aprovar, pedir ajustes ou recusar.</li>
<li><strong>Entregue</strong> — Conteúdo aprovado! O pagamento será processado e adicionado à sua carteira.</li>
</ol>

<h2>Detalhes da campanha</h2>
<p>Na página de cada campanha, você encontra:</p>
<ul>
<li><strong>Briefing completo</strong> — Objetivos, referências e instruções detalhadas.</li>
<li><strong>Entregáveis</strong> — Lista do que você precisa produzir (Reels, Stories, Fotos, UGC, etc.) com status individual de cada entregável.</li>
<li><strong>Informações da marca</strong> — Site, Instagram, descrição da empresa.</li>
<li><strong>Orçamento e prazo</strong> — Quanto você recebe e até quando deve entregar.</li>
<li><strong>Mensagens</strong> — Chat direto com a marca sobre essa campanha.</li>
</ul>
            `,
          },
          {
            slug: "entregaveis-campanha",
            title: "Entregáveis: como enviar seu conteúdo",
            summary: "Tipos de entregáveis, envio de conteúdo e processo de aprovação.",
            tags: ["entregáveis", "envio", "conteúdo", "upload"],
            content: `
<h2>Tipos de entregáveis</h2>
<p>Cada campanha define quais entregáveis são necessários. Os tipos mais comuns incluem:</p>
<ul>
<li><strong>Reels / TikTok</strong> — Vídeos curtos para redes sociais.</li>
<li><strong>Stories</strong> — Sequência de stories com menção à marca.</li>
<li><strong>Post no Feed</strong> — Publicação no perfil com marcação da marca.</li>
<li><strong>Vídeo UGC</strong> — Conteúdo gerado pelo usuário para uso em anúncios.</li>
<li><strong>Foto</strong> — Imagens para uso da marca.</li>
<li><strong>Review/Depoimento</strong> — Avaliação em vídeo ou texto do produto.</li>
</ul>

<h2>Enviando entregáveis</h2>
<p>Na página da campanha, cada entregável tem seu card com status. Para enviar:</p>
<ol>
<li>Clique no entregável correspondente.</li>
<li>Adicione o link do conteúdo publicado ou faça upload do arquivo.</li>
<li>Opcionalmente, adicione observações para a marca.</li>
<li>Confirme o envio.</li>
</ol>

<h2>Status dos entregáveis</h2>
<ul>
<li><strong>Pendente</strong> — Aguardando seu envio.</li>
<li><strong>Enviado</strong> — Você enviou e aguarda revisão da marca.</li>
<li><strong>Aprovado</strong> — A marca aprovou seu conteúdo.</li>
<li><strong>Revisão solicitada</strong> — A marca pediu ajustes.</li>
</ul>
            `,
          },
        ],
      },
      {
        slug: "pagamentos",
        title: "Carteira e Pagamentos",
        icon: Wallet,
        description: "Ganhos, saques via Pix e histórico financeiro",
        articles: [
          {
            slug: "como-funciona-carteira",
            title: "Como funciona a Carteira",
            summary: "Entenda saldos, transações e como solicitar saques.",
            tags: ["carteira", "saldo", "ganhos", "pagamento"],
            content: `
<h2>Acessando a Carteira</h2>
<p>No menu lateral, clique em <strong>"Carteira"</strong>. Essa página mostra:</p>

<h3>Saldo</h3>
<ul>
<li><strong>Saldo disponível</strong> — Valor que já pode ser sacado.</li>
<li><strong>Saldo pendente</strong> — Pagamentos de campanhas em processamento.</li>
</ul>

<h3>Histórico de transações</h3>
<p>Lista completa de todas as movimentações da sua carteira, incluindo:</p>
<ul>
<li><strong>Pagamento fixo</strong> — Valor fixo de campanha.</li>
<li><strong>Pagamento variável</strong> — Valor por performance.</li>
<li><strong>Comissão</strong> — Ganhos por vendas com cupom.</li>
<li><strong>Bônus</strong> — Bônus de marca ou plataforma.</li>
<li><strong>Saque</strong> — Transferência para sua conta.</li>
</ul>
<p>Cada transação mostra valor, data, status (Pendente, Disponível, Processando, Pago, Falhou) e a campanha ou marca relacionada.</p>

<h3>Configurar Pix</h3>
<p>Para receber seus pagamentos, configure sua chave Pix na Carteira. Você pode usar CPF, e-mail, telefone ou chave aleatória.</p>
            `,
          },
          {
            slug: "solicitar-saque",
            title: "Como solicitar um saque",
            summary: "Passo a passo para transferir seu saldo para sua conta via Pix.",
            tags: ["saque", "pix", "transferência", "receber"],
            content: `
<h2>Solicitando saque</h2>
<ol>
<li>Acesse <strong>"Carteira"</strong> no menu lateral.</li>
<li>Verifique se você tem saldo disponível.</li>
<li>Certifique-se de que sua chave Pix está configurada (botão de configuração no topo da página).</li>
<li>Clique em <strong>"Solicitar Saque"</strong>.</li>
<li>Informe o valor desejado.</li>
<li>Confirme a solicitação.</li>
</ol>

<h2>Prazos</h2>
<p>Após solicitar o saque, o processamento leva até 7 dias úteis. O status mudará de "Processando" para "Pago" quando concluído.</p>

<h2>Observações</h2>
<ul>
<li>Certifique-se de que a chave Pix está correta e ativa.</li>
<li>Saques são enviados para a chave Pix cadastrada na Carteira.</li>
</ul>
            `,
          },
        ],
      },
      {
        slug: "gamificacao",
        title: "Ranking e Gamificação",
        icon: Trophy,
        description: "Pontos, níveis, badges e leaderboard",
        articles: [
          {
            slug: "sistema-pontos-niveis",
            title: "Como funciona o sistema de pontos e níveis",
            summary: "Ganhe pontos, suba de nível e desbloqueie benefícios exclusivos.",
            tags: ["pontos", "gamificação", "nível", "ranking", "level"],
            content: `
<h2>Acessando o Ranking</h2>
<p>No menu lateral, clique em <strong>"Ranking"</strong>. Esta página mostra seu progresso completo na plataforma.</p>

<h2>Seu progresso</h2>
<ul>
<li><strong>Pontos totais</strong> — Acumulados em todas as suas atividades.</li>
<li><strong>Nível atual</strong> — Seu nível na plataforma com ícone e cor.</li>
<li><strong>Próximo nível</strong> — Quanto falta para avançar (barra de progresso visual).</li>
<li><strong>Posição no ranking</strong> — Sua colocação entre todos os creators.</li>
</ul>

<h2>Como ganhar pontos</h2>
<p>Cada marca pode configurar regras de pontuação próprias, mas de modo geral você ganha pontos por:</p>
<ul>
<li>Completar campanhas com sucesso</li>
<li>Entregar conteúdo no prazo</li>
<li>Gerar engajamento (views, likes, comentários)</li>
<li>Gerar vendas com cupom</li>
<li>Completar cursos na Academy</li>
<li>Manter sequência de entregas (streak)</li>
</ul>

<h2>Suas estatísticas</h2>
<p>A página de Ranking também exibe suas métricas consolidadas:</p>
<ul>
<li>Total de views, vendas, posts, stories e reels</li>
<li>Total de engajamento</li>
<li>Campanhas completadas</li>
<li>Entregas no prazo</li>
<li>Sequência atual e maior sequência</li>
</ul>
            `,
          },
          {
            slug: "badges-conquistas",
            title: "Badges e conquistas",
            summary: "Conheça os badges disponíveis e como desbloqueá-los.",
            tags: ["badges", "conquistas", "medalhas"],
            content: `
<h2>O que são badges?</h2>
<p>Badges são conquistas visuais que aparecem no seu perfil e no Ranking. Eles demonstram suas habilidades e experiência. Alguns exemplos:</p>
<ul>
<li><strong>Primeiro conteúdo</strong> — Seu primeiro entregável aprovado.</li>
<li><strong>Creator consistente</strong> — Múltiplas campanhas completadas.</li>
<li><strong>Gerador de vendas</strong> — Vendas realizadas com seus cupons.</li>
<li><strong>Estudante dedicado</strong> — Completar cursos na Academy.</li>
<li><strong>Membro ativo</strong> — Participação ativa em comunidades.</li>
</ul>
<p>Badges desbloqueados aparecem na sua seção de conquistas com a data em que foram conquistados.</p>

<h2>Leaderboard</h2>
<p>O leaderboard mensal mostra os creators com mais pontos no mês. Sua posição é atualizada automaticamente conforme você ganha pontos. Os 3 primeiros colocados ganham destaque especial com troféu, medalha e ícone de prêmio.</p>
            `,
          },
        ],
      },
      {
        slug: "academy",
        title: "Academy",
        icon: GraduationCap,
        description: "Cursos, módulos e progresso de aprendizado",
        articles: [
          {
            slug: "como-acessar-academy",
            title: "Como usar a Academy",
            summary: "Navegue pelos cursos, acompanhe seu progresso e complete aulas.",
            tags: ["academy", "cursos", "aprendizado", "aulas"],
            content: `
<h2>Acessando a Academy</h2>
<p>No menu lateral, clique em <strong>"Academy"</strong>. Você encontra:</p>

<h3>Lista de cursos</h3>
<p>Cursos organizados com título, descrição, nível (Básico, Intermediário, Avançado), tempo estimado e capa. Cada curso mostra sua barra de progresso.</p>

<h3>Filtros</h3>
<ul>
<li><strong>Busca por texto</strong> — Encontre cursos por nome.</li>
<li><strong>Nível</strong> — Filtre por Básico, Intermediário ou Avançado.</li>
</ul>

<h2>Estrutura dos cursos</h2>
<p>Cada curso é dividido em <strong>módulos</strong>, e cada módulo contém <strong>aulas</strong>. Os tipos de aula incluem:</p>
<ul>
<li><strong>Texto</strong> — Conteúdo em formato de artigo.</li>
<li><strong>Vídeo</strong> — Aulas em vídeo incorporado.</li>
<li><strong>Link</strong> — Referência a conteúdo externo.</li>
<li><strong>Checklist</strong> — Lista de tarefas para praticar o aprendido.</li>
</ul>

<h2>Acompanhando progresso</h2>
<p>Ao concluir cada aula, ela é marcada como completa. A barra de progresso do curso avança conforme você finaliza as aulas. Ao completar todos os módulos, o curso é marcado como concluído e você ganha pontos de gamificação.</p>

<h3>Marcar como favorito</h3>
<p>Você pode favoritar cursos para acessá-los rapidamente depois.</p>
            `,
          },
        ],
      },
      {
        slug: "configuracoes",
        title: "Configurações",
        icon: Wrench,
        description: "Perfil, redes sociais e dados pessoais",
        articles: [
          {
            slug: "editar-perfil",
            title: "Como editar meu perfil e configurações",
            summary: "Atualize seus dados pessoais, redes sociais, endereço e chave Pix.",
            tags: ["perfil", "configurações", "editar", "redes sociais"],
            content: `
<h2>Acessando Configurações</h2>
<p>No menu lateral, clique em <strong>"Configurações"</strong> (ícone de engrenagem na parte inferior).</p>

<h2>O que você pode editar</h2>
<ul>
<li><strong>Foto de perfil</strong> — Atualize sua foto ou avatar.</li>
<li><strong>Nome e bio</strong> — Altere como você aparece para as marcas.</li>
<li><strong>Nichos</strong> — Atualize suas categorias de conteúdo.</li>
<li><strong>Redes sociais</strong> — Altere seu @Instagram, TikTok e YouTube.</li>
<li><strong>Dados pessoais</strong> — CPF, telefone, data de nascimento.</li>
<li><strong>Endereço</strong> — CEP, rua, número, bairro, cidade e estado (importante para campanhas com envio de produto).</li>
<li><strong>Chave Pix</strong> — Atualize sua chave para recebimento.</li>
<li><strong>Portfólio</strong> — Link para seu site ou portfólio online.</li>
</ul>

<h2>Importante</h2>
<p>Manter seus dados atualizados é essencial para:</p>
<ul>
<li>Receber produtos de campanhas (endereço correto)</li>
<li>Receber pagamentos (chave Pix válida)</li>
<li>Aparecer nas buscas das marcas (redes sociais conectadas)</li>
</ul>
            `,
          },
        ],
      },
      {
        slug: "mensagens",
        title: "Mensagens",
        icon: MessageSquare,
        description: "Comunicação com marcas",
        articles: [
          {
            slug: "como-usar-mensagens",
            title: "Como usar o sistema de Mensagens",
            summary: "Comunique-se diretamente com as marcas sobre campanhas e comunidades.",
            tags: ["mensagens", "chat", "comunicação", "marca"],
            content: `
<h2>Acessando Mensagens</h2>
<p>No menu lateral, clique em <strong>"Mensagens"</strong>. Você verá suas conversas com marcas.</p>

<h2>Como funciona</h2>
<ul>
<li>As conversas são organizadas por marca/campanha.</li>
<li>Mensagens não lidas aparecem com indicador numérico no menu.</li>
<li>Você pode enviar e receber mensagens de texto.</li>
</ul>

<h2>Quando usar</h2>
<ul>
<li>Dúvidas sobre briefing de campanha</li>
<li>Atualizações sobre envio de produto</li>
<li>Negociação de prazos ou ajustes</li>
<li>Feedback sobre conteúdo</li>
</ul>
            `,
          },
        ],
      },
      {
        slug: "problemas-tecnicos",
        title: "Problemas Técnicos",
        icon: Wrench,
        description: "Soluções para problemas comuns",
        articles: [
          {
            slug: "problema-login",
            title: "Não consigo fazer login",
            summary: "Soluções para problemas de acesso à sua conta.",
            tags: ["login", "acesso", "senha", "problema"],
            content: `
<h2>Problemas comuns de login</h2>
<ul>
<li><strong>Senha incorreta</strong> — Use a opção "Esqueci minha senha" para redefinir.</li>
<li><strong>E-mail não encontrado</strong> — Verifique se está usando o e-mail correto do cadastro.</li>
<li><strong>Login com Google</strong> — Se criou a conta com Google, use o botão "Continuar com Google" ao invés de digitar e-mail e senha.</li>
</ul>
<h2>Ainda com problemas?</h2>
<p>Entre em contato com nosso suporte pelo WhatsApp ou pela página de contato.</p>
            `,
          },
          {
            slug: "problema-redes-sociais",
            title: "Minhas métricas do Instagram/TikTok não atualizam",
            summary: "Entenda como funciona a atualização de dados das redes sociais.",
            tags: ["instagram", "tiktok", "métricas", "atualização"],
            content: `
<h2>Como funciona a atualização</h2>
<p>As métricas das suas redes sociais (seguidores, engajamento, posts) são atualizadas periodicamente pela plataforma. Os dados são armazenados em cache por até 7 dias para otimizar custos.</p>

<h2>Dicas</h2>
<ul>
<li>Verifique se seu perfil está público (perfis privados não podem ser analisados)</li>
<li>Confirme que seu @ está correto nas Configurações</li>
<li>Aguarde até 7 dias para a próxima atualização automática</li>
</ul>
            `,
          },
        ],
      },
    ],
  },
  {
    slug: "marcas",
    title: "Sou Marca",
    description: "Brand Hub, campanhas, gestão de creators e integrações",
    icon: Building2,
    color: "blue",
    sections: [
      {
        slug: "primeiros-passos",
        title: "Primeiros Passos",
        icon: Rocket,
        description: "Configure sua conta empresarial",
        articles: [
          {
            slug: "como-criar-conta-marca",
            title: "Como criar minha conta de marca",
            summary: "Passo a passo para cadastrar sua empresa na plataforma.",
            tags: ["cadastro", "empresa", "marca", "conta"],
            content: `
<h2>Cadastrando sua marca</h2>
<ol>
<li><strong>Acesse a página de cadastro</strong> — Clique em "Começar Agora" e selecione "Sou Marca".</li>
<li><strong>Crie sua conta</strong> — Preencha nome, e-mail e senha (ou use Login com Google).</li>
<li><strong>Complete o onboarding</strong> — Após o primeiro login, você será direcionado ao cadastro em 3 etapas.</li>
</ol>
            `,
          },
          {
            slug: "onboarding-marca",
            title: "Onboarding: as 3 etapas do cadastro da marca",
            summary: "Configure sua empresa em 3 passos: dados, integrações e equipe.",
            tags: ["onboarding", "cadastro", "empresa", "marca"],
            content: `
<h2>Etapa 1: Dados da Empresa</h2>
<ul>
<li><strong>Razão social e nome fantasia</strong></li>
<li><strong>CNPJ</strong></li>
<li><strong>Categoria</strong> — Saúde, Beleza, Moda, Tecnologia, Alimentos, Bebidas, Fitness, Casa & Decoração, Pets, Infantil, Serviços, etc.</li>
<li><strong>Descrição</strong> — Sobre a marca e o que ela busca em creators.</li>
<li><strong>Tagline</strong> — Frase de impacto da marca.</li>
<li><strong>Contato</strong> — Telefone, e-mail, website.</li>
<li><strong>Endereço</strong> — CEP (com preenchimento automático), rua, número, bairro, cidade, estado.</li>
<li><strong>Visibilidade</strong> — Escolha se a marca será descoberta por creators na plataforma.</li>
</ul>

<h2>Etapa 2: Integrações</h2>
<p>Conecte suas ferramentas para potencializar o uso da plataforma:</p>
<ul>
<li><strong>Instagram / Meta</strong> — Conecte via OAuth para acessar DMs, métricas e anúncios.</li>
<li><strong>E-commerce</strong> — Integre com Shopify, Nuvemshop, Yampi, Bling, Olist ou Omie para rastrear vendas de creators.</li>
</ul>

<h2>Etapa 3: Equipe</h2>
<ul>
<li><strong>Convide membros</strong> — Adicione pessoas da sua equipe por e-mail para colaborar na gestão de campanhas.</li>
</ul>
<p>Ao finalizar, você terá acesso completo ao painel da marca.</p>
            `,
          },
        ],
      },
      {
        slug: "painel-marca",
        title: "Painel e Navegação",
        icon: BarChart3,
        description: "Visão geral do painel e como navegar",
        articles: [
          {
            slug: "navegacao-marca",
            title: "Como navegar pelo painel da marca",
            summary: "Entenda a estrutura de navegação: lista de marcas, Brand Hub e ferramentas.",
            tags: ["painel", "navegação", "dashboard", "marca"],
            content: `
<h2>Estrutura do painel</h2>
<p>O painel da marca é organizado em duas camadas:</p>

<h3>Menu principal (sempre visível)</h3>
<ul>
<li><strong>Painel</strong> — Analytics gerais da empresa com métricas consolidadas.</li>
<li><strong>Criar Campanha</strong> — Atalho rápido para criar uma nova campanha.</li>
<li><strong>Financeiro</strong> — Carteira da empresa, transações e pagamentos.</li>
<li><strong>Meta Ads Suite</strong> — Gestão de parceiros e campanhas de anúncios no Instagram/Meta.</li>
<li><strong>Instagram Inbox</strong> — DMs do Instagram centralizadas na plataforma.</li>
<li><strong>DM Templates</strong> — Modelos de mensagem para comunicação com creators.</li>
<li><strong>Integrações</strong> — Conexões com e-commerce e redes sociais.</li>
<li><strong>Programa</strong> — Configuração de tiers, recompensas, gamificação e cursos.</li>
</ul>

<h3>Brand Hub (por marca/brand)</h3>
<p>Cada marca que você gerencia tem seu próprio Brand Hub com sub-páginas:</p>
<ul>
<li><strong>Dashboard</strong> — Métricas específicas da marca.</li>
<li><strong>Comunidade</strong> — Membros, convites e gerenciamento de tiers.</li>
<li><strong>Discovery</strong> — Busca e descoberta de novos creators.</li>
<li><strong>Campanhas</strong> — Lista de campanhas dessa marca.</li>
<li><strong>Operação</strong> — Pipeline operacional com abas de outreach, convites, seeding e revisão.</li>
<li><strong>Tracking</strong> — Cupons de desconto e rastreamento de vendas.</li>
<li><strong>Conteúdo</strong> — Biblioteca de UGC com todos os conteúdos entregues.</li>
<li><strong>Mensagens</strong> — Chat com creators dessa marca.</li>
</ul>
            `,
          },
        ],
      },
      {
        slug: "campanhas",
        title: "Campanhas",
        icon: Megaphone,
        description: "Criação, gestão e acompanhamento de campanhas",
        articles: [
          {
            slug: "criar-campanha",
            title: "Como criar uma campanha",
            summary: "Guia completo para criar e publicar campanhas com briefing, entregáveis e requisitos.",
            tags: ["campanha", "criação", "briefing", "nova campanha"],
            content: `
<h2>Criando uma campanha</h2>
<p>Clique em <strong>"Criar Campanha"</strong> no menu lateral ou no botão "Nova Campanha" do painel.</p>

<h3>Informações básicas</h3>
<ul>
<li><strong>Título</strong> — Nome da campanha (mínimo 5 caracteres).</li>
<li><strong>Descrição</strong> — Briefing detalhado (mínimo 20 caracteres).</li>
<li><strong>Orçamento</strong> — Valor total da campanha.</li>
<li><strong>Prazo</strong> — Data limite para entregas.</li>
<li><strong>Quantidade de creators</strong> — Quantos creators você precisa.</li>
</ul>

<h3>Entregáveis estruturados</h3>
<p>Use o construtor de entregáveis para definir exatamente o que precisa:</p>
<ul>
<li>Tipo (Reels, Stories, Post, UGC, Foto, Review)</li>
<li>Plataforma alvo (Instagram, TikTok, YouTube)</li>
<li>Quantidade</li>
<li>Descrição detalhada</li>
</ul>

<h3>Requisitos e filtros</h3>
<ul>
<li><strong>Nichos preferidos</strong> — Selecione as categorias de creators desejados.</li>
<li><strong>Faixa etária</strong> — Público-alvo do creator.</li>
<li><strong>Regiões</strong> — Estados ou cidades específicas.</li>
<li><strong>Gênero</strong> — Filtro opcional.</li>
</ul>

<h3>Visibilidade</h3>
<ul>
<li><strong>Pública</strong> — Visível para todos os creators na plataforma.</li>
<li><strong>Privada</strong> — Somente creators convidados podem ver.</li>
<li><strong>Comunidade</strong> — Apenas membros da sua comunidade com tier mínimo e/ou pontos mínimos.</li>
</ul>

<h3>Sistema de recompensas</h3>
<p>Opcionalmente, configure prêmios por ranking ou meta para incentivar creators (dinheiro, produtos, pontos ou cupons).</p>
            `,
          },
          {
            slug: "gerenciar-campanhas",
            title: "Gerenciando campanhas ativas",
            summary: "Acompanhe candidaturas, participantes, status e resultados.",
            tags: ["campanhas", "gestão", "status", "participantes"],
            content: `
<h2>Lista de campanhas</h2>
<p>No Brand Hub da sua marca, clique em <strong>"Campanhas"</strong>. Você verá todas as campanhas com:</p>
<ul>
<li>Título e status (Rascunho, Ativa, Encerrada)</li>
<li>Orçamento e prazo</li>
<li>Quantidade de candidaturas, aceitos e pendentes</li>
</ul>
<p>Use a busca e alterne entre visualização em cards ou tabela.</p>

<h2>Detalhes da campanha</h2>
<p>Ao clicar em uma campanha, você acessa:</p>
<ul>
<li>Lista de participantes com status do workflow</li>
<li>Entregáveis enviados para revisão</li>
<li>Link compartilhável da campanha</li>
<li>Opção de excluir campanha</li>
</ul>
            `,
          },
        ],
      },
      {
        slug: "comunidade-brand-hub",
        title: "Comunidade",
        icon: UsersRound,
        description: "Gestão de membros, convites e tiers",
        articles: [
          {
            slug: "gerenciar-comunidade",
            title: "Como gerenciar sua comunidade de creators",
            summary: "Convide creators, gerencie membros, configure tiers e acompanhe estatísticas.",
            tags: ["comunidade", "membros", "convites", "tiers"],
            content: `
<h2>Acessando a Comunidade</h2>
<p>No Brand Hub da sua marca, clique em <strong>"Comunidade"</strong>. Você encontra 3 abas:</p>

<h3>Aba "Membros"</h3>
<p>Lista de todos os creators da sua comunidade com:</p>
<ul>
<li>Nome, avatar e @Instagram</li>
<li>Tier atual (ex: Bronze, Prata, Ouro, Diamante)</li>
<li>Pontos acumulados</li>
<li>Tags e notas</li>
<li>Data de entrada</li>
</ul>
<p>Use a busca para encontrar membros. Clique em um membro para ver o perfil detalhado.</p>

<h3>Aba "Convites"</h3>
<p>Gerencie seus convites de comunidade:</p>
<ul>
<li><strong>Convidar por e-mail</strong> — Envie convites com mensagem personalizada.</li>
<li><strong>Convidar por @</strong> — Convide pelo handle do Instagram.</li>
<li><strong>Link de convite</strong> — Gere um link único para compartilhar.</li>
<li>Acompanhe o status de cada convite: enviado, aberto, aceito, expirado ou cancelado.</li>
</ul>

<h3>Aba "Tiers"</h3>
<p>Configure os níveis de membership da sua comunidade usando o gerenciador de tiers (veja artigo sobre Programa).</p>

<h3>Estatísticas</h3>
<p>No topo da página, veja: total de membros, membros ativos e convites pendentes.</p>
            `,
          },
        ],
      },
      {
        slug: "discovery",
        title: "Discovery (Busca de Creators)",
        icon: Users,
        description: "Encontre e descubra novos creators para suas campanhas",
        articles: [
          {
            slug: "como-descobrir-creators",
            title: "Como encontrar creators para suas campanhas",
            summary: "Busque creators na plataforma ou descubra novos pelo Instagram.",
            tags: ["discovery", "busca", "creators", "encontrar"],
            content: `
<h2>Discovery</h2>
<p>No Brand Hub da sua marca, clique em <strong>"Discovery"</strong>. Você tem duas abas:</p>

<h3>Aba "Plataforma"</h3>
<p>Busque entre creators cadastrados na CreatorConnect:</p>
<ul>
<li><strong>Busca por nome</strong> — Encontre creators específicos.</li>
<li><strong>Filtro por nicho</strong> — Selecione a categoria desejada.</li>
<li><strong>Filtro por seguidores</strong> — Defina faixa mínima e máxima.</li>
</ul>
<p>Para cada creator, você vê: nome, @Instagram, seguidores, taxa de engajamento, nicho e se já faz parte da sua comunidade. Você pode favoritar creators ou convidá-los para sua comunidade.</p>

<h3>Aba "Descoberta"</h3>
<p>Busque perfis do Instagram que não estão na plataforma:</p>
<ul>
<li>Digite o @username do Instagram.</li>
<li>A plataforma busca os dados públicos do perfil (seguidores, engajamento, bio, se é verificado, se é privado).</li>
<li>Se o perfil for relevante, você pode salvar na sua lista de descobertas para convite futuro.</li>
</ul>
            `,
          },
        ],
      },
      {
        slug: "operacao",
        title: "Operação",
        icon: Package,
        description: "Pipeline operacional: outreach, seeding e revisões",
        articles: [
          {
            slug: "como-usar-operacao",
            title: "Como usar o painel de Operação",
            summary: "Gerencie o pipeline completo: outreach, convites, envio de produtos e revisão de conteúdo.",
            tags: ["operação", "pipeline", "seeding", "revisão", "outreach"],
            content: `
<h2>Operação</h2>
<p>No Brand Hub da sua marca, clique em <strong>"Operação"</strong>. Este painel centraliza todas as atividades operacionais em abas:</p>

<h3>Aba "Outreach"</h3>
<p>Creators descobertos que você pode abordar. Veja a fila de descoberta com perfis salvos para convite.</p>

<h3>Aba "Convites"</h3>
<p>Convites de campanha enviados, com status de cada um (enviado, aceito, recusado, expirado).</p>

<h3>Aba "Seeding" (Envio de Produtos)</h3>
<p>Gerencie o envio de produtos para creators:</p>
<ul>
<li>Veja quais creators precisam receber produtos</li>
<li>Registre o envio com código de rastreamento e transportadora</li>
<li>Acompanhe o status: pendente, endereço necessário, enviado</li>
</ul>

<h3>Aba "Revisão"</h3>
<p>Fila de conteúdos enviados por creators aguardando sua revisão. Para cada entregável, você pode:</p>
<ul>
<li>Visualizar o conteúdo</li>
<li>Aprovar</li>
<li>Solicitar revisão com feedback</li>
<li>Recusar</li>
</ul>

<h3>Aba "Pendências"</h3>
<p>Alertas sobre situações que precisam de atenção: creators que não responderam e entregáveis atrasados.</p>

<h3>Resumo no topo</h3>
<p>Contadores rápidos: descobertas, convites pendentes, seeding pendente, endereço necessário, revisão pendente, atrasados.</p>
            `,
          },
        ],
      },
      {
        slug: "tracking",
        title: "Tracking",
        icon: BarChart3,
        description: "Cupons de desconto e rastreamento de vendas",
        articles: [
          {
            slug: "como-usar-tracking",
            title: "Como rastrear vendas e cupons de creators",
            summary: "Crie cupons, atribua a creators e acompanhe vendas geradas.",
            tags: ["tracking", "cupons", "vendas", "rastreamento", "performance"],
            content: `
<h2>Tracking</h2>
<p>No Brand Hub da sua marca, clique em <strong>"Tracking"</strong>. Este painel tem duas abas principais:</p>

<h3>Aba "Cupons"</h3>
<p>Crie e gerencie cupons de desconto atribuídos a creators:</p>
<ul>
<li><strong>Criar cupom</strong> — Defina código, tipo de desconto (percentual ou fixo), valor, número máximo de usos e data de expiração.</li>
<li><strong>Atribuir a creator</strong> — Vincule o cupom a um creator e campanha específica.</li>
<li>Acompanhe: usos, status (ativo/inativo), creator vinculado.</li>
</ul>

<h3>Aba "Vendas"</h3>
<p>Acompanhe vendas geradas pelos creators:</p>
<ul>
<li>Valor de cada venda</li>
<li>Cupom utilizado</li>
<li>Creator responsável</li>
<li>Plataforma de origem</li>
<li>Data da venda</li>
</ul>

<h3>Gráficos e métricas</h3>
<p>Visualize gráficos de vendas ao longo do tempo, distribuição por creator e performance de cupons.</p>

<h3>Registro manual</h3>
<p>Você pode registrar vendas manualmente para acompanhamento, caso não tenha integração automática com e-commerce.</p>
            `,
          },
        ],
      },
      {
        slug: "conteudo",
        title: "Biblioteca de Conteúdo",
        icon: BookOpen,
        description: "Biblioteca de UGC com todos os conteúdos entregues",
        articles: [
          {
            slug: "como-usar-biblioteca",
            title: "Como usar a Biblioteca de Conteúdo (UGC)",
            summary: "Visualize, organize e gerencie todos os conteúdos entregues pelos creators.",
            tags: ["conteúdo", "ugc", "biblioteca", "assets"],
            content: `
<h2>Biblioteca de Conteúdo</h2>
<p>No Brand Hub da sua marca, clique em <strong>"Conteúdo"</strong>. Aqui ficam todos os conteúdos (assets) entregues por creators nas suas campanhas.</p>

<h3>Visualização</h3>
<p>Alterne entre <strong>grade</strong> (grid com thumbnails) ou <strong>lista</strong> (tabela detalhada).</p>

<h3>Filtros</h3>
<ul>
<li><strong>Status</strong> — Pendente, aprovado, rejeitado.</li>
<li><strong>Campanha</strong> — Filtre por campanha específica.</li>
<li><strong>Creator</strong> — Filtre por creator específico.</li>
<li><strong>Busca</strong> — Pesquise por texto.</li>
</ul>

<h3>Detalhes do asset</h3>
<p>Ao clicar em um conteúdo, veja:</p>
<ul>
<li>Preview do conteúdo (imagem ou vídeo)</li>
<li>Creator e campanha vinculados</li>
<li>Status de aprovação</li>
<li>Direitos de uso (licença)</li>
<li>Comentários da equipe</li>
</ul>

<h3>Ações</h3>
<ul>
<li>Aprovar ou rejeitar conteúdo</li>
<li>Adicionar comentários internos</li>
<li>Gerenciar direitos de uso</li>
</ul>
            `,
          },
        ],
      },
      {
        slug: "financeiro",
        title: "Financeiro",
        icon: Wallet,
        description: "Carteira da empresa, pagamentos e transações",
        articles: [
          {
            slug: "como-funciona-financeiro",
            title: "Como funciona o Financeiro da marca",
            summary: "Gerencie saldo, caixinhas de campanha, pagamentos a creators e transações.",
            tags: ["financeiro", "carteira", "pagamento", "saldo"],
            content: `
<h2>Financeiro</h2>
<p>No menu lateral principal, clique em <strong>"Financeiro"</strong>.</p>

<h3>Saldo geral</h3>
<ul>
<li><strong>Saldo disponível</strong> — Valor livre para uso.</li>
<li><strong>Saldo reservado</strong> — Alocado em campanhas ativas.</li>
<li><strong>Total de gastos</strong> — Histórico acumulado de pagamentos.</li>
</ul>

<h3>Caixinhas (Budget Boxes)</h3>
<p>Cada campanha tem sua própria "caixinha" de orçamento:</p>
<ul>
<li>Valor total alocado para a campanha</li>
<li>Valor já utilizado em pagamentos</li>
<li>Saldo restante da caixinha</li>
</ul>
<p>Você pode adicionar verba ou transferir entre caixinhas.</p>

<h3>Transações</h3>
<p>Histórico completo de todas as movimentações:</p>
<ul>
<li>Depósitos, pagamentos a creators, reembolsos, transferências</li>
<li>Filtro por tipo, status, período e valor</li>
<li>Status: Pendente, Disponível, Processando, Pago, Falhou, Cancelado</li>
</ul>

<h3>Pagar creators</h3>
<p>Envie pagamentos individuais ou em lote para creators, vinculados a campanhas específicas.</p>
            `,
          },
        ],
      },
      {
        slug: "integrações",
        title: "Integrações",
        icon: Plug,
        description: "Conecte e-commerce, redes sociais e ferramentas",
        articles: [
          {
            slug: "integracoes-disponiveis",
            title: "Integrações disponíveis",
            summary: "Conecte suas ferramentas: Instagram/Meta, Shopify, Nuvemshop, Yampi, Bling, Olist, Omie.",
            tags: ["integrações", "e-commerce", "instagram", "meta", "shopify"],
            content: `
<h2>Integrações</h2>
<p>No menu lateral, clique em <strong>"Integrações"</strong>. Aqui você conecta suas ferramentas externas.</p>

<h3>Redes Sociais e Ads</h3>
<ul>
<li><strong>Instagram / Meta</strong> — Conecte via OAuth para acessar DMs, métricas de posts, dados de seguidores e gerenciar anúncios pagos.</li>
<li><strong>Social Listening</strong> — Monitore menções e hashtags relevantes.</li>
</ul>

<h3>E-commerce e Faturamento</h3>
<p>Integre com sua plataforma de vendas para rastrear automaticamente vendas geradas por creators:</p>
<ul>
<li><strong>Shopify</strong></li>
<li><strong>Nuvemshop</strong></li>
<li><strong>Yampi</strong></li>
<li><strong>Bling</strong></li>
<li><strong>Olist</strong></li>
<li><strong>Omie</strong></li>
</ul>
<p>Para cada integração, configure a URL da API e chave de autenticação. A plataforma receberá webhooks de vendas automaticamente.</p>

<h3>Como conectar</h3>
<ol>
<li>Escolha a plataforma desejada.</li>
<li>Siga as instruções específicas de cada integração.</li>
<li>Após conectar, o status mudará para "Conectado".</li>
</ol>
            `,
          },
          {
            slug: "meta-ads-suite",
            title: "Meta Ads Suite: anúncios com creators",
            summary: "Gerencie parceiros de conteúdo e campanhas de anúncios no Instagram/Meta.",
            tags: ["meta ads", "anúncios", "instagram", "parceiros"],
            content: `
<h2>Meta Ads Suite</h2>
<p>No menu lateral, clique em <strong>"Meta Ads Suite"</strong>. Esta ferramenta permite gerenciar anúncios pagos usando conteúdo de creators.</p>

<h3>Dashboard</h3>
<p>Veja resumo de parceiros conectados (total, ativos, pendentes) e campanhas de anúncios (total, ativas, rascunhos).</p>

<h3>Parceiros</h3>
<p>Gerencie creators autorizados como parceiros de conteúdo:</p>
<ul>
<li>Envie solicitação de parceria via Instagram</li>
<li>Acompanhe o status: pendente, solicitação enviada, ativo, expirado, revogado</li>
<li>Veja perfil do Instagram do parceiro</li>
</ul>

<h3>Campanhas de anúncios</h3>
<p>Crie e gerencie campanhas de anúncios usando UGC de creators:</p>
<ul>
<li>Defina objetivo (alcance, tráfego, conversão, engajamento)</li>
<li>Configure orçamento (diário ou vitalício)</li>
<li>Acompanhe métricas: impressões, alcance, cliques, CTR, custo por resultado</li>
</ul>
            `,
          },
          {
            slug: "instagram-inbox",
            title: "Instagram Inbox: DMs centralizadas",
            summary: "Gerencie as DMs do Instagram diretamente na plataforma.",
            tags: ["instagram", "inbox", "dm", "mensagens", "direto"],
            content: `
<h2>Instagram Inbox</h2>
<p>No menu lateral, clique em <strong>"Instagram Inbox"</strong>. Aqui você gerencia as DMs do Instagram da marca sem sair da plataforma.</p>

<h3>Conversas</h3>
<ul>
<li>Lista de conversas com contagem de não lidas</li>
<li>Busca por username</li>
<li>Última mensagem e horário</li>
</ul>

<h3>Chat</h3>
<p>Selecione uma conversa para ver o histórico completo e enviar novas mensagens. As mensagens são sincronizadas em tempo real via WebSocket.</p>

<h3>Pré-requisito</h3>
<p>Para usar o Instagram Inbox, é necessário que a integração com Instagram/Meta esteja ativa (conectada via OAuth na página de Integrações).</p>
            `,
          },
          {
            slug: "dm-templates",
            title: "DM Templates: modelos de mensagem",
            summary: "Crie modelos de mensagem para agilizar a comunicação com creators.",
            tags: ["dm", "templates", "modelos", "mensagem"],
            content: `
<h2>DM Templates</h2>
<p>No menu lateral, clique em <strong>"DM Templates"</strong>. Crie modelos de mensagem reutilizáveis para comunicação com creators.</p>

<h3>Como usar</h3>
<ul>
<li>Crie templates com título e corpo de texto.</li>
<li>Use variáveis dinâmicas como nome do creator, nome da marca, nome da campanha.</li>
<li>Aplique templates ao enviar convites ou mensagens.</li>
</ul>

<h3>Exemplos de uso</h3>
<ul>
<li>Convite para comunidade</li>
<li>Convite para campanha</li>
<li>Briefing de campanha</li>
<li>Feedback sobre conteúdo</li>
<li>Agradecimento pós-entrega</li>
</ul>
            `,
          },
        ],
      },
      {
        slug: "programa",
        title: "Programa de Creators",
        icon: Trophy,
        description: "Configure tiers, recompensas, gamificação e cursos",
        articles: [
          {
            slug: "visao-geral-programa",
            title: "Visão geral do Programa de Creators",
            summary: "Entenda as 4 áreas do programa: tiers, recompensas, gamificação e cursos.",
            tags: ["programa", "tiers", "recompensas", "gamificação", "cursos"],
            content: `
<h2>Programa de Creators</h2>
<p>No menu lateral, clique em <strong>"Programa"</strong>. Aqui você configura o sistema de gamificação e recompensas para seus creators. O programa tem 4 áreas:</p>

<h3>1. Tiers de Creators</h3>
<p>Configure níveis como Bronze, Prata, Ouro e Diamante com benefícios exclusivos para cada tier.</p>

<h3>2. Regras de Pontuação</h3>
<p>Defina como creators ganham pontos: por entregáveis, views, engajamento, vendas, entregas no prazo, etc.</p>

<h3>3. Catálogo de Prêmios</h3>
<p>Gerencie prêmios disponíveis para creators resgatarem: produtos, dinheiro, benefícios e experiências.</p>

<h3>4. Cursos (Academy)</h3>
<p>Crie cursos educacionais para sua comunidade de creators (veja artigo sobre Academy para marcas).</p>
            `,
          },
          {
            slug: "configurar-tiers",
            title: "Como configurar Tiers de Creators",
            summary: "Crie níveis de membership com benefícios exclusivos.",
            tags: ["tiers", "níveis", "bronze", "prata", "ouro", "diamante"],
            content: `
<h2>Configurando Tiers</h2>
<p>No Programa, clique em <strong>"Tiers de Creators"</strong>.</p>

<h3>Criando um tier</h3>
<ul>
<li><strong>Nome</strong> — Ex: Bronze, Prata, Ouro, Diamante.</li>
<li><strong>Nível</strong> — Ordem hierárquica (1 = mais baixo).</li>
<li><strong>Pontos mínimos</strong> — Quantos pontos o creator precisa para atingir esse tier.</li>
<li><strong>Cor e ícone</strong> — Personalização visual.</li>
</ul>

<h3>Benefícios por tier</h3>
<p>Configure quais benefícios cada tier oferece:</p>
<ul>
<li>Campanhas prioritárias</li>
<li>Pagamento mais rápido</li>
<li>Conteúdo exclusivo</li>
<li>Badge visível no perfil</li>
<li>Benefícios personalizados (texto livre)</li>
</ul>

<p>Creators são automaticamente promovidos ao atingir a pontuação necessária para o próximo tier.</p>
            `,
          },
          {
            slug: "gamificacao-pontuacao",
            title: "Regras de pontuação e gamificação",
            summary: "Configure como creators ganham pontos por diferentes atividades.",
            tags: ["gamificação", "pontuação", "regras", "pontos"],
            content: `
<h2>Regras de Pontuação</h2>
<p>No Programa, clique em <strong>"Regras de Pontuação"</strong>. Defina quantos pontos cada atividade vale:</p>

<h3>Categorias de pontuação</h3>
<ul>
<li><strong>Entregáveis</strong> — Pontos por cada conteúdo entregue e aprovado.</li>
<li><strong>Views</strong> — Pontos por visualizações geradas.</li>
<li><strong>Engajamento</strong> — Pontos por likes, comentários e compartilhamentos.</li>
<li><strong>Vendas</strong> — Pontos por vendas realizadas com cupom do creator.</li>
<li><strong>Pontualidade</strong> — Bônus por entregas no prazo.</li>
<li><strong>Streak</strong> — Bônus por sequência contínua de entregas.</li>
</ul>

<p>Essas configurações afetam como os creators sobem de tier e aparecem no leaderboard.</p>
            `,
          },
        ],
      },
      {
        slug: "problemas-tecnicos",
        title: "Problemas Técnicos",
        icon: Wrench,
        description: "Soluções para problemas comuns",
        articles: [
          {
            slug: "campanha-nao-aparece",
            title: "Minha campanha não aparece para os creators",
            summary: "Verifique os requisitos e configurações da sua campanha.",
            tags: ["campanha", "visibilidade", "problema"],
            content: `
<h2>Possíveis causas</h2>
<ul>
<li><strong>Status da campanha</strong> — Verifique se a campanha está com status "Ativa" (não rascunho). Campanhas em rascunho não aparecem para creators.</li>
<li><strong>Visibilidade</strong> — Se está configurada como "Privada", apenas creators convidados verão. Se é "Comunidade", apenas membros com tier mínimo verão.</li>
<li><strong>Prazo expirado</strong> — Campanhas com prazo expirado são automaticamente encerradas.</li>
<li><strong>Requisitos restritivos</strong> — Critérios como seguidores mínimos muito altos limitam o alcance.</li>
</ul>
<h2>Ainda com problemas?</h2>
<p>Entre em contato com nosso suporte para análise detalhada.</p>
            `,
          },
          {
            slug: "integracao-ecommerce-erro",
            title: "Minha integração de e-commerce não funciona",
            summary: "Dicas para resolver problemas com integrações de vendas.",
            tags: ["integração", "e-commerce", "webhook", "erro"],
            content: `
<h2>Verificações</h2>
<ul>
<li><strong>Credenciais</strong> — Verifique se a API key está correta e atualizada.</li>
<li><strong>Webhook URL</strong> — Confirme que a URL do webhook está configurada na sua plataforma de e-commerce.</li>
<li><strong>Status</strong> — Verifique se a integração mostra "Conectado" na página de Integrações.</li>
<li><strong>Teste</strong> — Faça uma venda de teste usando um cupom de creator para verificar se aparece no Tracking.</li>
</ul>
<p>Se o problema persistir, entre em contato com nosso suporte com o nome da plataforma e a mensagem de erro.</p>
            `,
          },
        ],
      },
    ],
  },
  {
    slug: "regras",
    title: "Central de Regras",
    description: "Entenda como a CreatorConnect resolve disputas e garante transparência",
    icon: Scale,
    color: "amber",
    sections: [
      {
        slug: "como-funciona",
        title: "Como Funciona",
        icon: BookOpen,
        description: "Regras gerais da plataforma",
        articles: [
          {
            slug: "regras-gerais",
            title: "Regras gerais da plataforma",
            summary: "Conheça as regras que garantem uma experiência justa para todos.",
            tags: ["regras", "plataforma", "diretrizes"],
            content: `
<h2>Princípios da CreatorConnect</h2>
<ul>
<li><strong>Transparência</strong> — Todas as condições de campanha (orçamento, prazo, entregáveis) são visíveis antes do creator se candidatar ou aceitar.</li>
<li><strong>Respeito</strong> — Comunicação profissional entre marcas e creators via sistema de mensagens.</li>
<li><strong>Qualidade</strong> — Conteúdo deve seguir o briefing e os padrões definidos na campanha.</li>
<li><strong>Pontualidade</strong> — Prazos devem ser respeitados por ambas as partes (entrega de conteúdo e revisão).</li>
<li><strong>Pagamento justo</strong> — Valores acordados na campanha são garantidos após aprovação do conteúdo.</li>
</ul>

<h2>Workflow de campanha</h2>
<p>Toda campanha segue o fluxo: Aceito → Contrato → Aguardando Produto → Produção → Revisão → Entregue. Cada etapa tem responsabilidades claras para ambas as partes.</p>
            `,
          },
          {
            slug: "regras-creators",
            title: "Regras para Creators",
            summary: "Responsabilidades e boas práticas para creators na plataforma.",
            tags: ["regras", "creators", "responsabilidades"],
            content: `
<h2>Responsabilidades do Creator</h2>
<ul>
<li>Manter perfil e dados cadastrais atualizados (endereço para seeding, chave Pix)</li>
<li>Ler o briefing completo antes de aceitar uma campanha</li>
<li>Produzir conteúdo original seguindo as diretrizes da campanha</li>
<li>Entregar dentro do prazo definido</li>
<li>Aplicar feedback da marca quando solicitado</li>
<li>Não negociar pagamentos fora da plataforma</li>
<li>Não compartilhar informações confidenciais das marcas</li>
</ul>
            `,
          },
          {
            slug: "regras-marcas",
            title: "Regras para Marcas",
            summary: "Responsabilidades e boas práticas para marcas na plataforma.",
            tags: ["regras", "marcas", "responsabilidades"],
            content: `
<h2>Responsabilidades da Marca</h2>
<ul>
<li>Criar briefings claros e detalhados</li>
<li>Definir orçamento justo e condizente com os entregáveis</li>
<li>Revisar conteúdo dentro de prazo razoável (48h recomendado)</li>
<li>Fornecer feedback construtivo e específico ao solicitar revisões</li>
<li>Processar pagamentos conforme acordado após aprovação</li>
<li>Enviar produtos para seeding no prazo quando aplicável</li>
<li>Respeitar os direitos de uso definidos na campanha</li>
</ul>
            `,
          },
        ],
      },
      {
        slug: "disputas",
        title: "Disputas",
        icon: Handshake,
        description: "Como resolver conflitos entre marcas e creators",
        articles: [
          {
            slug: "abrir-disputa",
            title: "Como abrir uma disputa",
            summary: "Processo para resolver conflitos sobre entregas, pagamentos ou qualidade.",
            tags: ["disputa", "conflito", "mediação"],
            content: `
<h2>Quando abrir uma disputa</h2>
<p>Disputas podem ser abertas quando:</p>
<ul>
<li>O conteúdo foi recusado sem justificativa adequada</li>
<li>O pagamento não foi processado após aprovação</li>
<li>A marca alterou os termos após aceite</li>
<li>O creator não entregou o conteúdo acordado</li>
<li>Produto de seeding não foi enviado ou está danificado</li>
</ul>
<h2>Processo</h2>
<ol>
<li>Entre em contato com nosso suporte descrevendo a situação.</li>
<li>Forneça evidências: screenshots, links, mensagens trocadas na plataforma.</li>
<li>Nossa equipe analisará o caso em até 5 dias úteis.</li>
<li>Ambas as partes serão notificadas da resolução.</li>
</ol>
            `,
          },
        ],
      },
      {
        slug: "fraude-seguranca",
        title: "Fraude e Segurança",
        icon: ShieldCheck,
        description: "Proteção contra fraudes e condutas proibidas",
        articles: [
          {
            slug: "condutas-proibidas",
            title: "Condutas proibidas na plataforma",
            summary: "Ações que podem resultar em suspensão ou banimento da conta.",
            tags: ["fraude", "proibido", "segurança", "ban"],
            content: `
<h2>Condutas proibidas</h2>
<ul>
<li>Compra de seguidores ou engajamento falso</li>
<li>Plágio ou uso de conteúdo de terceiros sem autorização</li>
<li>Criar múltiplas contas</li>
<li>Negociar pagamentos fora da plataforma</li>
<li>Assédio ou comunicação abusiva</li>
<li>Fornecer dados falsos no cadastro (CPF, CNPJ, endereço)</li>
<li>Manipular métricas de vendas ou engajamento</li>
<li>Compartilhar informações confidenciais de campanhas</li>
</ul>
<h2>Consequências</h2>
<p>Dependendo da gravidade, as consequências incluem: advertência, suspensão temporária ou banimento permanente da plataforma. Em caso de banimento, saldos pendentes poderão ser retidos para análise.</p>
            `,
          },
        ],
      },
      {
        slug: "politicas",
        title: "Políticas",
        icon: FileText,
        description: "Termos de uso e políticas da plataforma",
        articles: [
          {
            slug: "termos-uso-resumo",
            title: "Resumo dos Termos de Uso",
            summary: "Versão simplificada dos termos de uso da plataforma.",
            tags: ["termos", "política", "uso"],
            content: `
<h2>Principais pontos</h2>
<ul>
<li><strong>Elegibilidade</strong> — Creators: maiores de 18 anos com CPF válido. Marcas: empresas com CNPJ válido.</li>
<li><strong>Propriedade do conteúdo</strong> — O creator mantém os direitos autorais, mas concede licença de uso à marca conforme definido nos entregáveis da campanha. Direitos de uso específicos são configurados pela marca na Biblioteca de Conteúdo.</li>
<li><strong>Pagamentos</strong> — Processados via plataforma. Creators recebem via Pix. Marcas adicionam verba via sistema financeiro.</li>
<li><strong>Cancelamento</strong> — Creators podem sair de campanhas seguindo o fluxo de workflow. Marcas podem encerrar campanhas, respeitando pagamentos já devidos.</li>
<li><strong>Dados e privacidade</strong> — Dados pessoais protegidos conforme a LGPD. Métricas de redes sociais são usadas exclusivamente para avaliação de campanhas.</li>
<li><strong>Integrações</strong> — Conexões via OAuth (Instagram/Meta) seguem as políticas das plataformas de origem.</li>
</ul>
            `,
          },
        ],
      },
    ],
  },
];

export function searchArticles(query: string): Array<{ category: HelpCategory; section: HelpSection; article: HelpArticle }> {
  const q = query.toLowerCase().trim();
  if (!q) return [];
  const results: Array<{ category: HelpCategory; section: HelpSection; article: HelpArticle }> = [];
  for (const category of helpCategories) {
    for (const section of category.sections) {
      for (const article of section.articles) {
        const searchable = `${article.title} ${article.summary} ${article.tags.join(" ")}`.toLowerCase();
        if (searchable.includes(q)) {
          results.push({ category, section, article });
        }
      }
    }
  }
  return results;
}

export function findArticle(categorySlug: string, sectionSlug: string, articleSlug: string): { category: HelpCategory; section: HelpSection; article: HelpArticle } | null {
  const category = helpCategories.find(c => c.slug === categorySlug);
  if (!category) return null;
  const section = category.sections.find(s => s.slug === sectionSlug);
  if (!section) return null;
  const article = section.articles.find(a => a.slug === articleSlug);
  if (!article) return null;
  return { category, section, article };
}

export function findSection(categorySlug: string, sectionSlug: string): { category: HelpCategory; section: HelpSection } | null {
  const category = helpCategories.find(c => c.slug === categorySlug);
  if (!category) return null;
  const section = category.sections.find(s => s.slug === sectionSlug);
  if (!section) return null;
  return { category, section };
}

export function findCategory(categorySlug: string): HelpCategory | null {
  return helpCategories.find(c => c.slug === categorySlug) || null;
}
