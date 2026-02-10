import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, Lock, Eye, UserCheck, Mail, Database, Clock, FileText } from "lucide-react";
import { PublicHeader } from "@/components/public-header";
import { Footer } from "@/components/footer";

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-background">
      <PublicHeader />
      <div className="pt-8 pb-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <Card className="border-0 shadow-lg">
          <CardHeader className="text-center pb-8 border-b">
            <div className="flex justify-center mb-4">
              <div className="p-3 rounded-full bg-primary/10">
                <Shield className="h-8 w-8 text-primary" />
              </div>
            </div>
            <CardTitle className="text-3xl font-bold">Política de Privacidade</CardTitle>
            <p className="text-muted-foreground mt-2">CreatorConnect - Plataforma de Marketing de Influência</p>
          </CardHeader>
          <CardContent className="prose prose-slate dark:prose-invert max-w-none pt-8 space-y-8">
            
            <section>
              <div className="flex items-center gap-3 mb-4">
                <Database className="h-5 w-5 text-primary" />
                <h2 className="text-xl font-semibold m-0">1. Informações que Coletamos</h2>
              </div>
              <p>
                A CreatorConnect coleta as seguintes categorias de dados pessoais para fornecer nossos serviços:
              </p>
              <h4 className="font-medium mt-4">1.1 Dados de Cadastro</h4>
              <ul className="list-disc pl-6 space-y-1">
                <li>Nome completo e nome de usuário</li>
                <li>Endereço de e-mail</li>
                <li>Número de telefone (opcional)</li>
                <li>Foto de perfil</li>
                <li>Tipo de conta (criador ou empresa)</li>
              </ul>
              
              <h4 className="font-medium mt-4">1.2 Dados de Criadores de Conteúdo</h4>
              <ul className="list-disc pl-6 space-y-1">
                <li>Links de redes sociais (Instagram, TikTok, YouTube)</li>
                <li>Métricas públicas de redes sociais (seguidores, engajamento)</li>
                <li>Nicho de atuação e categorias de interesse</li>
                <li>Portfólio de trabalhos anteriores</li>
                <li>Dados bancários para recebimento de pagamentos</li>
              </ul>
              
              <h4 className="font-medium mt-4">1.3 Dados de Empresas</h4>
              <ul className="list-disc pl-6 space-y-1">
                <li>Nome da empresa e CNPJ</li>
                <li>Endereço comercial</li>
                <li>Informações de contato comercial</li>
                <li>Dados de campanhas e orçamentos</li>
              </ul>
              
              <h4 className="font-medium mt-4">1.4 Dados de Uso</h4>
              <ul className="list-disc pl-6 space-y-1">
                <li>Logs de acesso e atividades na plataforma</li>
                <li>Endereço IP e informações do dispositivo</li>
                <li>Cookies e tecnologias similares</li>
              </ul>
            </section>

            <section>
              <div className="flex items-center gap-3 mb-4">
                <Eye className="h-5 w-5 text-primary" />
                <h2 className="text-xl font-semibold m-0">2. Como Utilizamos seus Dados</h2>
              </div>
              <p>Utilizamos seus dados pessoais para as seguintes finalidades:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>Prestação de Serviços:</strong> Conectar marcas e criadores, gerenciar campanhas e facilitar pagamentos</li>
                <li><strong>Comunicação:</strong> Enviar notificações sobre campanhas, atualizações da plataforma e suporte</li>
                <li><strong>Melhoria da Plataforma:</strong> Analisar uso para aprimorar funcionalidades e experiência do usuário</li>
                <li><strong>Segurança:</strong> Prevenir fraudes, abusos e garantir a integridade da plataforma</li>
                <li><strong>Obrigações Legais:</strong> Cumprir requisitos legais, fiscais e regulatórios</li>
                <li><strong>Marketing:</strong> Com seu consentimento, enviar comunicações promocionais</li>
              </ul>
            </section>

            <section>
              <div className="flex items-center gap-3 mb-4">
                <Lock className="h-5 w-5 text-primary" />
                <h2 className="text-xl font-semibold m-0">3. Compartilhamento de Dados</h2>
              </div>
              <p>Seus dados podem ser compartilhados com:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>Outros Usuários:</strong> Informações de perfil público são visíveis para marcas (no caso de criadores) ou criadores (no caso de empresas)</li>
                <li><strong>Prestadores de Serviços:</strong> Empresas que nos auxiliam em processamento de pagamentos, hospedagem e análise de dados</li>
                <li><strong>Parceiros de Integração:</strong> APIs de redes sociais para validação de métricas</li>
                <li><strong>Autoridades:</strong> Quando exigido por lei ou ordem judicial</li>
              </ul>
              <p className="mt-4 p-4 bg-muted rounded-lg">
                <strong>Importante:</strong> Nunca vendemos seus dados pessoais a terceiros.
              </p>
            </section>

            <section>
              <div className="flex items-center gap-3 mb-4">
                <UserCheck className="h-5 w-5 text-primary" />
                <h2 className="text-xl font-semibold m-0">4. Seus Direitos (LGPD)</h2>
              </div>
              <p>
                De acordo com a Lei Geral de Proteção de Dados (Lei nº 13.709/2018), você tem os seguintes direitos:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>Confirmação e Acesso:</strong> Confirmar se tratamos seus dados e acessar uma cópia</li>
                <li><strong>Correção:</strong> Solicitar correção de dados incompletos, inexatos ou desatualizados</li>
                <li><strong>Anonimização ou Eliminação:</strong> Solicitar anonimização ou exclusão de dados desnecessários</li>
                <li><strong>Portabilidade:</strong> Receber seus dados em formato estruturado para transferência</li>
                <li><strong>Revogação do Consentimento:</strong> Retirar seu consentimento a qualquer momento</li>
                <li><strong>Oposição:</strong> Opor-se ao tratamento de dados quando aplicável</li>
                <li><strong>Informação sobre Compartilhamento:</strong> Saber com quais entidades seus dados foram compartilhados</li>
              </ul>
              <p className="mt-4">
                Para exercer seus direitos, entre em contato através do e-mail: <strong>privacidade@creatorconnect.com.br</strong>
              </p>
            </section>

            <section>
              <div className="flex items-center gap-3 mb-4">
                <FileText className="h-5 w-5 text-primary" />
                <h2 className="text-xl font-semibold m-0">5. Cookies e Tecnologias Similares</h2>
              </div>
              <p>Utilizamos cookies para:</p>
              <ul className="list-disc pl-6 space-y-1">
                <li><strong>Cookies Essenciais:</strong> Necessários para funcionamento básico da plataforma</li>
                <li><strong>Cookies de Desempenho:</strong> Análise de uso e melhoria de performance</li>
                <li><strong>Cookies de Funcionalidade:</strong> Lembrar preferências e personalizar experiência</li>
              </ul>
              <p className="mt-4">
                Você pode gerenciar suas preferências de cookies através do banner de consentimento ou configurações do navegador.
              </p>
            </section>

            <section>
              <div className="flex items-center gap-3 mb-4">
                <Clock className="h-5 w-5 text-primary" />
                <h2 className="text-xl font-semibold m-0">6. Retenção de Dados</h2>
              </div>
              <p>
                Mantemos seus dados pessoais pelo tempo necessário para cumprir as finalidades descritas nesta política, 
                ou conforme exigido por lei. Após o término da relação, os dados podem ser mantidos por até 5 anos para 
                fins fiscais e legais, ou anonimizados para análises estatísticas.
              </p>
            </section>

            <section>
              <div className="flex items-center gap-3 mb-4">
                <Shield className="h-5 w-5 text-primary" />
                <h2 className="text-xl font-semibold m-0">7. Segurança dos Dados</h2>
              </div>
              <p>
                Implementamos medidas técnicas e organizacionais apropriadas para proteger seus dados, incluindo:
              </p>
              <ul className="list-disc pl-6 space-y-1">
                <li>Criptografia de dados em trânsito e em repouso</li>
                <li>Controle de acesso baseado em funções</li>
                <li>Monitoramento contínuo de segurança</li>
                <li>Backups regulares e planos de recuperação</li>
              </ul>
            </section>

            <section>
              <div className="flex items-center gap-3 mb-4">
                <Mail className="h-5 w-5 text-primary" />
                <h2 className="text-xl font-semibold m-0">8. Contato</h2>
              </div>
              <p>
                Para dúvidas sobre esta política ou exercício de direitos, entre em contato:
              </p>
              <div className="p-4 bg-muted rounded-lg mt-4">
                <p className="m-0"><strong>Encarregado de Proteção de Dados (DPO)</strong></p>
                <p className="m-0">E-mail: privacidade@creatorconnect.com.br</p>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold">9. Alterações nesta Política</h2>
              <p>
                Esta política pode ser atualizada periodicamente. Notificaremos sobre mudanças significativas 
                através da plataforma ou por e-mail. Recomendamos revisar esta página regularmente.
              </p>
            </section>

            <div className="text-sm text-muted-foreground mt-8 pt-4 border-t flex items-center justify-between">
              <span>Última atualização: Dezembro de 2024</span>
              <span>Versão 1.0</span>
            </div>
          </CardContent>
        </Card>
      </div>
      </div>
      <Footer />
    </div>
  );
}
