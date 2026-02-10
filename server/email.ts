import sgMail from '@sendgrid/mail';

// Only set API key if it exists
if (process.env.SENDGRID_API_KEY) {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
  console.log('[Email] SendGrid API configured successfully');
} else {
  console.warn("[Email] SENDGRID_API_KEY not set. Email sending will be simulated.");
}

export interface EmailOptions {
  to: string;
  subject: string;
  text: string;
  html?: string;
}

export async function sendEmail({ to, subject, text, html }: EmailOptions): Promise<boolean> {
  const fromEmail = process.env.SENDGRID_FROM_EMAIL || 'no-reply@yourdomain.com';
  
  console.log(`[Email] Attempting to send email...`);
  console.log(`[Email] To: ${to}`);
  console.log(`[Email] From: ${fromEmail}`);
  console.log(`[Email] Subject: ${subject}`);
  
  if (!process.env.SENDGRID_API_KEY) {
    console.log(`[Email] DEV MODE - No API key, simulating send`);
    console.log(`[Email] Text content: ${text.substring(0, 200)}...`);
    return true;
  }

  const msg = {
    to,
    from: {
      email: fromEmail,
      name: 'CreatorConnect'
    },
    subject,
    text,
    html: html || text,
  };

  try {
    const response = await sgMail.send(msg);
    console.log(`[Email] SUCCESS - Email sent to ${to}`);
    console.log(`[Email] SendGrid Response Status: ${response[0].statusCode}`);
    return true;
  } catch (error: any) {
    console.error('[Email] ERROR - Failed to send email');
    console.error('[Email] Error message:', error.message);
    if (error.response) {
      console.error('[Email] SendGrid Response Body:', JSON.stringify(error.response.body, null, 2));
      console.error('[Email] SendGrid Status Code:', error.response.statusCode);
    }
    if (error.code) {
      console.error('[Email] Error code:', error.code);
    }
    return false;
  }
}

export function getBaseUrl(): string {
  if (process.env.PRODUCTION_DOMAIN) {
    return `https://${process.env.PRODUCTION_DOMAIN}`;
  } else if (process.env.REPLIT_DEV_DOMAIN) {
    return `https://${process.env.REPLIT_DEV_DOMAIN}`;
  } else if (process.env.REPL_SLUG && process.env.REPL_OWNER) {
    return `https://${process.env.REPL_SLUG}.${process.env.REPL_OWNER}.replit.app`;
  }
  return 'http://0.0.0.0:5000';
}

function getEmailTemplate(content: {
  preheader?: string;
  title: string;
  subtitle: string;
  bodyParagraphs: string[];
  ctaText: string;
  ctaLink: string;
  alertBox?: { icon: string; title: string; message: string; color: string };
  showStats?: boolean;
  footerNote: string;
  customContent?: string;
}): string {
  const baseUrl = getBaseUrl();
  const logoUrl = `${baseUrl}/attached_assets/freepik__adjust__40499_1767050491683.png`;
  const year = new Date().getFullYear();
  
  const statsSection = content.showStats ? `
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin-bottom: 32px;">
      <tr>
        <td width="33%" style="text-align: center; padding: 20px 16px; background: linear-gradient(135deg, #1f1f23 0%, #27272a 100%); border-radius: 12px 0 0 12px;">
          <p style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 700;">500+</p>
          <p style="margin: 6px 0 0; color: #a1a1aa; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px;">Marcas</p>
        </td>
        <td width="33%" style="text-align: center; padding: 20px 16px; background: linear-gradient(135deg, #1f1f23 0%, #27272a 100%); border-left: 1px solid #3f3f46; border-right: 1px solid #3f3f46;">
          <p style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 700;">2K+</p>
          <p style="margin: 6px 0 0; color: #a1a1aa; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px;">Criadores</p>
        </td>
        <td width="33%" style="text-align: center; padding: 20px 16px; background: linear-gradient(135deg, #1f1f23 0%, #27272a 100%); border-radius: 0 12px 12px 0;">
          <p style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 700;">R$15M+</p>
          <p style="margin: 6px 0 0; color: #a1a1aa; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px;">Em parcerias</p>
        </td>
      </tr>
    </table>
  ` : '';

  const alertSection = content.alertBox ? `
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin-bottom: 32px;">
      <tr>
        <td style="padding: 20px 24px; background: linear-gradient(135deg, #1f1f23 0%, #27272a 100%); border-radius: 12px; border-left: 4px solid ${content.alertBox.color};">
          <p style="margin: 0 0 8px; color: #ffffff; font-size: 15px; font-weight: 600;">
            ${content.alertBox.icon} ${content.alertBox.title}
          </p>
          <p style="margin: 0; color: #a1a1aa; font-size: 14px; line-height: 1.6;">
            ${content.alertBox.message}
          </p>
        </td>
      </tr>
    </table>
  ` : '';

  return `
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <meta http-equiv="X-UA-Compatible" content="IE=edge">
      <title>${content.title}</title>
      ${content.preheader ? `<span style="display:none;font-size:1px;color:#09090b;line-height:1px;max-height:0px;max-width:0px;opacity:0;overflow:hidden;">${content.preheader}</span>` : ''}
    </head>
    <body style="margin: 0; padding: 0; background-color: #09090b; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; -webkit-font-smoothing: antialiased;">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #09090b;">
        <tr>
          <td align="center" style="padding: 48px 20px;">
            <table role="presentation" width="600" cellspacing="0" cellpadding="0" border="0" style="background-color: #18181b; border-radius: 20px; border: 1px solid #27272a; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);">
              
              <!-- Header with Logo -->
              <tr>
                <td style="padding: 48px 48px 24px; text-align: center; background: linear-gradient(180deg, #1f1f23 0%, #18181b 100%); border-radius: 20px 20px 0 0;">
                  <img src="${logoUrl}" alt="CreatorConnect" style="height: 52px; width: auto; display: inline-block;" />
                </td>
              </tr>
              
              <!-- Decorative Gradient Line -->
              <tr>
                <td style="padding: 0 48px;">
                  <div style="height: 2px; background: linear-gradient(90deg, transparent 0%, #6366f1 30%, #8b5cf6 50%, #6366f1 70%, transparent 100%); border-radius: 2px;"></div>
                </td>
              </tr>
              
              <!-- Main Content -->
              <tr>
                <td style="padding: 48px;">
                  <!-- Title Section -->
                  <h1 style="margin: 0 0 12px; color: #ffffff; font-size: 32px; font-weight: 700; line-height: 1.2; letter-spacing: -0.5px;">
                    ${content.title}
                  </h1>
                  <p style="margin: 0 0 32px; color: #6366f1; font-size: 13px; font-weight: 600; text-transform: uppercase; letter-spacing: 2px;">
                    ${content.subtitle}
                  </p>
                  
                  <!-- Body Paragraphs -->
                  ${content.bodyParagraphs.map(p => `
                    <p style="margin: 0 0 20px; color: #d4d4d8; font-size: 16px; line-height: 1.75;">
                      ${p}
                    </p>
                  `).join('')}
                  
                  <!-- CTA Button -->
                  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                    <tr>
                      <td align="center" style="padding: 16px 0 40px;">
                        <a href="${content.ctaLink}" style="display: inline-block; padding: 18px 56px; background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #a855f7 100%); color: #ffffff; text-decoration: none; border-radius: 50px; font-size: 16px; font-weight: 600; letter-spacing: 0.3px; box-shadow: 0 10px 30px rgba(99, 102, 241, 0.4), 0 4px 12px rgba(139, 92, 246, 0.3); transition: all 0.3s ease;">
                          ${content.ctaText}
                        </a>
                      </td>
                    </tr>
                  </table>
                  
                  ${content.customContent || ''}
                  
                  ${statsSection}
                  ${alertSection}
                  
                  <!-- Link Copy Section -->
                  <p style="margin: 0 0 12px; color: #71717a; font-size: 14px; line-height: 1.6;">
                    Ou copie e cole este link no seu navegador:
                  </p>
                  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                    <tr>
                      <td style="padding: 16px 20px; background: linear-gradient(135deg, #1f1f23 0%, #27272a 100%); border-radius: 12px; border: 1px solid #3f3f46;">
                        <p style="margin: 0; color: #a1a1aa; font-size: 13px; word-break: break-all; font-family: 'SF Mono', Monaco, 'Courier New', monospace;">
                          ${content.ctaLink}
                        </p>
                      </td>
                    </tr>
                  </table>
                  
                  <!-- Divider -->
                  <div style="height: 1px; background: linear-gradient(90deg, transparent, #3f3f46, transparent); margin: 36px 0 24px;"></div>
                  
                  <!-- Footer Note -->
                  <p style="margin: 0; color: #52525b; font-size: 13px; line-height: 1.7;">
                    ${content.footerNote}
                  </p>
                </td>
              </tr>
              
              <!-- Footer -->
              <tr>
                <td style="padding: 28px 48px; background: linear-gradient(180deg, #0f0f12 0%, #0a0a0c 100%); border-radius: 0 0 20px 20px; text-align: center; border-top: 1px solid #1f1f23;">
                  <p style="margin: 0 0 8px; color: #52525b; font-size: 13px; font-weight: 500;">
                    © ${year} CreatorConnect. Todos os direitos reservados.
                  </p>
                  <p style="margin: 0; color: #3f3f46; font-size: 12px;">
                    Conectando marcas e criadores de conteúdo
                  </p>
                </td>
              </tr>
              
            </table>
            
            <!-- Unsubscribe -->
            <table role="presentation" width="600" cellspacing="0" cellpadding="0" border="0">
              <tr>
                <td style="padding: 24px 48px 0; text-align: center;">
                  <p style="margin: 0; color: #3f3f46; font-size: 11px;">
                    Este email foi enviado por CreatorConnect • 
                    <a href="${baseUrl}" style="color: #52525b; text-decoration: underline;">Visitar site</a>
                  </p>
                </td>
              </tr>
            </table>
            
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;
}

export async function sendVerificationEmail(to: string, token: string): Promise<boolean> {
  const baseUrl = getBaseUrl();
  const verificationLink = `${baseUrl}/api/verify-email/${token}`;
  
  console.log(`[Email] Preparing verification email for: ${to}`);
  console.log(`[Email] Verification Link: ${verificationLink}`);
  
  const subject = '🎉 Bem-vindo ao CreatorConnect - Ative sua conta';
  const text = `Olá! Bem-vindo ao CreatorConnect.\n\nPara começar a usar a plataforma, acesse o link abaixo:\n\n${verificationLink}\n\nSe você não se cadastrou no CreatorConnect, ignore este email.\n\nEquipe CreatorConnect`;
  
  const html = getEmailTemplate({
    preheader: 'Ative sua conta e comece a explorar oportunidades incríveis!',
    title: 'Bem-vindo ao CreatorConnect!',
    subtitle: 'Sua jornada começa agora',
    bodyParagraphs: [
      `Obrigado por se cadastrar no <span style="color: #ffffff; font-weight: 600;">CreatorConnect</span>, a plataforma que conecta marcas e criadores de conteúdo.`,
      `Para ativar sua conta e começar a explorar oportunidades incríveis, clique no botão abaixo:`
    ],
    ctaText: '✨ Ativar Minha Conta',
    ctaLink: verificationLink,
    showStats: true,
    footerNote: 'Se você não se cadastrou no CreatorConnect, pode ignorar este email com segurança.'
  });

  return sendEmail({ to, subject, text, html });
}

export async function sendTeamInviteEmail(to: string, token: string, companyName: string, inviterName: string, role: string): Promise<boolean> {
  const baseUrl = getBaseUrl();
  const inviteLink = `${baseUrl}/invite/${token}`;
  const roleLabel = role === 'admin' ? 'Administrador' : 'Membro';
  
  console.log(`[Email] Preparing team invite email for: ${to}`);
  console.log(`[Email] Invite Link: ${inviteLink}`);
  console.log(`[Email] Company: ${companyName}, Inviter: ${inviterName}, Role: ${roleLabel}`);
  
  const subject = `🤝 ${inviterName} convidou você para a equipe ${companyName}`;
  const text = `Olá!\n\n${inviterName} convidou você para fazer parte da equipe "${companyName}" no CreatorConnect como ${roleLabel}.\n\nPara aceitar o convite, acesse o link abaixo:\n\n${inviteLink}\n\nEste convite expira em 7 dias.\n\nSe você não esperava este convite, pode ignorar este email.\n\nEquipe CreatorConnect`;
  
  const html = getEmailTemplate({
    preheader: `${inviterName} quer que você faça parte da equipe ${companyName}`,
    title: 'Você foi convidado!',
    subtitle: `Junte-se à equipe ${companyName}`,
    bodyParagraphs: [
      `<span style="color: #ffffff; font-weight: 600;">${inviterName}</span> convidou você para fazer parte da equipe <span style="color: #ffffff; font-weight: 600;">"${companyName}"</span> no CreatorConnect.`,
      `Você será adicionado como <span style="color: #a855f7; font-weight: 600;">${roleLabel}</span> da equipe.`
    ],
    ctaText: '🚀 Aceitar Convite',
    ctaLink: inviteLink,
    alertBox: {
      icon: '⏰',
      title: 'Atenção',
      message: `Este convite expira em <span style="color: #f59e0b; font-weight: 600;">7 dias</span>. Aceite o quanto antes para não perder!`,
      color: '#f59e0b'
    },
    footerNote: 'Se você não esperava este convite, pode ignorar este email com segurança.'
  });

  return sendEmail({ to, subject, text, html });
}

export async function sendPasswordResetEmail(to: string, token: string): Promise<boolean> {
  const baseUrl = getBaseUrl();
  const resetLink = `${baseUrl}/reset-password?token=${token}`;
  
  console.log(`[Email] Preparing password reset email for: ${to}`);
  console.log(`[Email] Reset Link: ${resetLink}`);
  
  const subject = '🔐 CreatorConnect - Recuperação de Senha';
  const text = `Olá!\n\nRecebemos uma solicitação para redefinir sua senha no CreatorConnect.\n\nPara criar uma nova senha, acesse o link abaixo:\n\n${resetLink}\n\nEste link expira em 1 hora.\n\nSe você não solicitou a recuperação de senha, ignore este email.\n\nEquipe CreatorConnect`;
  
  const html = getEmailTemplate({
    preheader: 'Redefina sua senha de forma rápida e segura',
    title: 'Recuperação de Senha',
    subtitle: 'Redefina sua senha com segurança',
    bodyParagraphs: [
      `Recebemos uma solicitação para redefinir a senha da sua conta no <span style="color: #ffffff; font-weight: 600;">CreatorConnect</span>.`,
      `Para criar uma nova senha, clique no botão abaixo:`
    ],
    ctaText: '🔑 Redefinir Senha',
    ctaLink: resetLink,
    alertBox: {
      icon: '⚠️',
      title: 'Importante',
      message: `Este link expira em <span style="color: #ef4444; font-weight: 600;">1 hora</span> por segurança. Se você não solicitou esta redefinição, ignore este email.`,
      color: '#ef4444'
    },
    footerNote: 'Se você não solicitou a recuperação de senha, pode ignorar este email com segurança. Sua senha permanecerá inalterada.'
  });

  return sendEmail({ to, subject, text, html });
}

// =============================================================================
// PREMIUM EMAIL COMPONENTS - Visual Building Blocks
// =============================================================================

interface CreatorCardData {
  name: string;
  username?: string;
  avatar?: string;
  followers?: number;
  engagementRate?: string;
  bio?: string;
}

interface CampaignCardData {
  title: string;
  brand: string;
  brandLogo?: string;
  value?: string;
  deadline?: string;
  type?: string;
  image?: string;
}

interface TestimonialData {
  name: string;
  role: string;
  avatar?: string;
  quote: string;
  rating?: number;
}

interface MetricData {
  label: string;
  value: string;
  icon?: string;
  color?: string;
}

function formatFollowers(count: number): string {
  if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
  if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
  return count.toString();
}

function getDefaultAvatar(name: string): string {
  return `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name)}&backgroundColor=6366f1&textColor=ffffff`;
}

// Creator Card Component - Visual card with avatar and metrics
function getCreatorCardHtml(creator: CreatorCardData): string {
  const avatar = creator.avatar || getDefaultAvatar(creator.name);
  return `
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin: 24px 0;">
      <tr>
        <td style="padding: 24px; background: linear-gradient(135deg, #1f1f23 0%, #27272a 100%); border-radius: 16px; border: 1px solid #3f3f46;">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
            <tr>
              <td width="80" valign="top">
                <div style="width: 72px; height: 72px; border-radius: 50%; background: linear-gradient(135deg, #6366f1, #a855f7); padding: 3px;">
                  <img src="${avatar}" alt="${creator.name}" style="width: 66px; height: 66px; border-radius: 50%; object-fit: cover; display: block;" />
                </div>
              </td>
              <td style="padding-left: 16px;" valign="top">
                <h3 style="margin: 0 0 4px; color: #ffffff; font-size: 18px; font-weight: 700;">${creator.name}</h3>
                ${creator.username ? `<p style="margin: 0 0 12px; color: #a1a1aa; font-size: 14px;">@${creator.username}</p>` : ''}
                ${creator.bio ? `<p style="margin: 0 0 12px; color: #d4d4d8; font-size: 14px; line-height: 1.5;">${creator.bio.substring(0, 100)}${creator.bio.length > 100 ? '...' : ''}</p>` : ''}
                <table role="presentation" cellspacing="0" cellpadding="0" border="0">
                  <tr>
                    ${creator.followers ? `
                      <td style="padding-right: 20px;">
                        <p style="margin: 0; color: #ffffff; font-size: 16px; font-weight: 700;">${formatFollowers(creator.followers)}</p>
                        <p style="margin: 2px 0 0; color: #71717a; font-size: 11px; text-transform: uppercase;">Seguidores</p>
                      </td>
                    ` : ''}
                    ${creator.engagementRate ? `
                      <td>
                        <p style="margin: 0; color: #22c55e; font-size: 16px; font-weight: 700;">${creator.engagementRate}</p>
                        <p style="margin: 2px 0 0; color: #71717a; font-size: 11px; text-transform: uppercase;">Engajamento</p>
                      </td>
                    ` : ''}
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  `;
}

// Campaign Card Component - Visual campaign preview
function getCampaignCardHtml(campaign: CampaignCardData): string {
  const brandLogo = campaign.brandLogo || getDefaultAvatar(campaign.brand);
  return `
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin: 24px 0;">
      <tr>
        <td style="padding: 0; background: linear-gradient(135deg, #1f1f23 0%, #27272a 100%); border-radius: 16px; border: 1px solid #3f3f46; overflow: hidden;">
          ${campaign.image ? `
            <div style="width: 100%; height: 160px; background: linear-gradient(135deg, #6366f1 0%, #a855f7 100%); position: relative;">
              <img src="${campaign.image}" alt="${campaign.title}" style="width: 100%; height: 160px; object-fit: cover; opacity: 0.9;" />
            </div>
          ` : `
            <div style="width: 100%; height: 80px; background: linear-gradient(135deg, #6366f1 0%, #a855f7 50%, #ec4899 100%);"></div>
          `}
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="padding: 20px;">
            <tr>
              <td>
                <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin-bottom: 12px;">
                  <tr>
                    <td>
                      <img src="${brandLogo}" alt="${campaign.brand}" style="width: 36px; height: 36px; border-radius: 8px; object-fit: cover;" />
                    </td>
                    <td style="padding-left: 10px;">
                      <p style="margin: 0; color: #a1a1aa; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px;">${campaign.brand}</p>
                    </td>
                  </tr>
                </table>
                <h3 style="margin: 0 0 16px; color: #ffffff; font-size: 20px; font-weight: 700; line-height: 1.3;">${campaign.title}</h3>
                <table role="presentation" cellspacing="0" cellpadding="0" border="0">
                  <tr>
                    ${campaign.value ? `
                      <td style="padding-right: 24px;">
                        <p style="margin: 0; color: #22c55e; font-size: 18px; font-weight: 700;">${campaign.value}</p>
                        <p style="margin: 2px 0 0; color: #71717a; font-size: 11px;">Valor</p>
                      </td>
                    ` : ''}
                    ${campaign.deadline ? `
                      <td style="padding-right: 24px;">
                        <p style="margin: 0; color: #ffffff; font-size: 14px; font-weight: 600;">${campaign.deadline}</p>
                        <p style="margin: 2px 0 0; color: #71717a; font-size: 11px;">Prazo</p>
                      </td>
                    ` : ''}
                    ${campaign.type ? `
                      <td>
                        <span style="display: inline-block; padding: 4px 12px; background: #6366f1; color: #ffffff; font-size: 11px; font-weight: 600; border-radius: 20px; text-transform: uppercase;">${campaign.type}</span>
                      </td>
                    ` : ''}
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  `;
}

// Testimonial Card Component
function getTestimonialCardHtml(testimonial: TestimonialData): string {
  const avatar = testimonial.avatar || getDefaultAvatar(testimonial.name);
  const stars = testimonial.rating ? '⭐'.repeat(testimonial.rating) : '';
  return `
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin: 24px 0;">
      <tr>
        <td style="padding: 24px; background: linear-gradient(135deg, #1f1f23 0%, #27272a 100%); border-radius: 16px; border: 1px solid #3f3f46; border-left: 4px solid #6366f1;">
          ${stars ? `<p style="margin: 0 0 12px; font-size: 16px;">${stars}</p>` : ''}
          <p style="margin: 0 0 16px; color: #d4d4d8; font-size: 15px; line-height: 1.7; font-style: italic;">"${testimonial.quote}"</p>
          <table role="presentation" cellspacing="0" cellpadding="0" border="0">
            <tr>
              <td>
                <img src="${avatar}" alt="${testimonial.name}" style="width: 44px; height: 44px; border-radius: 50%; object-fit: cover;" />
              </td>
              <td style="padding-left: 12px;">
                <p style="margin: 0; color: #ffffff; font-size: 14px; font-weight: 600;">${testimonial.name}</p>
                <p style="margin: 2px 0 0; color: #a1a1aa; font-size: 12px;">${testimonial.role}</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  `;
}

// Metrics Grid Component - Dashboard style metrics
function getMetricsGridHtml(metrics: MetricData[]): string {
  const cols = Math.min(metrics.length, 4);
  const width = Math.floor(100 / cols);
  
  return `
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin: 24px 0;">
      <tr>
        ${metrics.map((metric, i) => `
          <td width="${width}%" style="text-align: center; padding: 20px 12px; background: linear-gradient(135deg, #1f1f23 0%, #27272a 100%); ${i === 0 ? 'border-radius: 12px 0 0 12px;' : ''} ${i === metrics.length - 1 ? 'border-radius: 0 12px 12px 0;' : ''} ${i > 0 ? 'border-left: 1px solid #3f3f46;' : ''}">
            ${metric.icon ? `<p style="margin: 0 0 8px; font-size: 24px;">${metric.icon}</p>` : ''}
            <p style="margin: 0; color: ${metric.color || '#ffffff'}; font-size: 24px; font-weight: 700;">${metric.value}</p>
            <p style="margin: 6px 0 0; color: #a1a1aa; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px;">${metric.label}</p>
          </td>
        `).join('')}
      </tr>
    </table>
  `;
}

// Status Badge Component
function getStatusBadgeHtml(status: 'approved' | 'pending' | 'rejected' | 'delivered' | 'paid'): string {
  const configs = {
    approved: { bg: '#22c55e', text: 'Aprovado', icon: '✓' },
    pending: { bg: '#f59e0b', text: 'Pendente', icon: '⏳' },
    rejected: { bg: '#ef4444', text: 'Não Aprovado', icon: '✗' },
    delivered: { bg: '#6366f1', text: 'Entregue', icon: '📦' },
    paid: { bg: '#22c55e', text: 'Pago', icon: '💰' },
  };
  const config = configs[status];
  return `<span style="display: inline-block; padding: 6px 16px; background: ${config.bg}; color: #ffffff; font-size: 13px; font-weight: 600; border-radius: 20px;">${config.icon} ${config.text}</span>`;
}

// Progress Bar Component (Email-client compatible)
function getProgressBarHtml(percentage: number, label?: string): string {
  const width = Math.min(percentage, 100);
  return `
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin: 16px 0;">
      <tr>
        <td>
          ${label ? `<p style="margin: 0 0 10px; color: #a1a1aa; font-size: 13px; font-weight: 500;">${label}</p>` : ''}
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background: #27272a; border-radius: 6px; overflow: hidden;">
            <tr>
              <td style="height: 10px; width: ${width}%; background: linear-gradient(90deg, #6366f1, #a855f7); border-radius: 6px;"></td>
              <td style="height: 10px; width: ${100 - width}%;"></td>
            </tr>
          </table>
          <p style="margin: 6px 0 0; color: #ffffff; font-size: 13px; font-weight: 600; text-align: right;">${percentage}%</p>
        </td>
      </tr>
    </table>
  `;
}

// Timeline Component - For showing steps/progress (Email-client compatible, no flexbox)
function getTimelineHtml(steps: { title: string; description?: string; completed?: boolean }[]): string {
  return `
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin: 24px 0;">
      ${steps.map((step, i) => `
        <tr>
          <td width="48" valign="top" style="padding-bottom: ${i < steps.length - 1 ? '16px' : '0'};">
            <table role="presentation" cellspacing="0" cellpadding="0" border="0">
              <tr>
                <td align="center" style="width: 36px; height: 36px; border-radius: 50%; background: ${step.completed ? 'linear-gradient(135deg, #6366f1, #a855f7)' : '#27272a'}; border: 2px solid ${step.completed ? '#6366f1' : '#3f3f46'}; text-align: center; vertical-align: middle;">
                  <span style="color: #ffffff; font-size: 14px; font-weight: 700; line-height: 36px;">${step.completed ? '✓' : i + 1}</span>
                </td>
              </tr>
              ${i < steps.length - 1 ? `
              <tr>
                <td align="center" style="padding-top: 4px;">
                  <div style="width: 3px; height: 24px; background: ${step.completed ? 'linear-gradient(180deg, #6366f1, #3f3f46)' : '#3f3f46'}; border-radius: 2px; margin: 0 auto;"></div>
                </td>
              </tr>
              ` : ''}
            </table>
          </td>
          <td style="padding-left: 12px; padding-bottom: ${i < steps.length - 1 ? '16px' : '0'};" valign="top">
            <p style="margin: 0; color: ${step.completed ? '#ffffff' : '#d4d4d8'}; font-size: 15px; font-weight: 600; line-height: 1.4;">${step.title}</p>
            ${step.description ? `<p style="margin: 6px 0 0; color: #71717a; font-size: 13px; line-height: 1.5;">${step.description}</p>` : ''}
          </td>
        </tr>
      `).join('')}
    </table>
  `;
}

// Campaign Grid for Digest Emails
function getCampaignGridHtml(campaigns: CampaignCardData[]): string {
  return campaigns.map(campaign => getCampaignCardHtml(campaign)).join('');
}

// =============================================================================
// NEW APPLICATION EMAILS
// =============================================================================

export async function sendNewApplicationEmail(
  to: string,
  creator: CreatorCardData,
  campaign: { title: string; id: number }
): Promise<boolean> {
  const baseUrl = getBaseUrl();
  const reviewLink = `${baseUrl}/company/campaigns/${campaign.id}/applications`;
  
  const subject = `🎯 Nova candidatura para "${campaign.title}"`;
  const text = `Olá!\n\n${creator.name} se candidatou à sua campanha "${campaign.title}".\n\nAcesse a plataforma para revisar: ${reviewLink}\n\nEquipe CreatorConnect`;
  
  const html = getEmailTemplate({
    preheader: `${creator.name} quer participar da sua campanha!`,
    title: 'Nova Candidatura!',
    subtitle: campaign.title,
    bodyParagraphs: [
      `Um novo criador de conteúdo quer fazer parte da sua campanha! Confira o perfil abaixo:`
    ],
    ctaText: '👀 Ver Candidatura',
    ctaLink: reviewLink,
    customContent: getCreatorCardHtml(creator),
    footerNote: 'Você recebeu este email porque tem candidaturas pendentes. Revise o quanto antes para não perder talentos!'
  });

  return sendEmail({ to, subject, text, html });
}

export async function sendApplicationApprovedEmail(
  to: string,
  creatorName: string,
  campaign: CampaignCardData
): Promise<boolean> {
  const baseUrl = getBaseUrl();
  const campaignLink = `${baseUrl}/campaigns`;
  
  // More celebratory and engaging subject line
  const subject = `🎉 ${creatorName}, você foi APROVADO(A)! Hora de brilhar com ${campaign.brand || 'a marca'}`;
  const text = `${creatorName}, parabéns pela conquista!\n\nA ${campaign.brand || 'marca'} escolheu VOCÊ para a campanha "${campaign.title}"!\n\nIsso significa que seu perfil se destacou entre vários candidatos. Agora é hora de mostrar seu talento!\n\nAcesse agora: ${campaignLink}\n\n— Equipe CreatorConnect`;
  
  // Build brand header with logo if available
  const brandHeader = campaign.brandLogo ? `
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin-bottom: 24px;">
      <tr>
        <td align="center">
          <img src="${campaign.brandLogo}" alt="${campaign.brand}" style="width: 80px; height: 80px; border-radius: 50%; object-fit: cover; border: 3px solid #22c55e;" />
        </td>
      </tr>
      <tr>
        <td align="center" style="padding-top: 12px;">
          <p style="margin: 0; color: #22c55e; font-size: 12px; text-transform: uppercase; letter-spacing: 2px; font-weight: 600;">✓ SELECIONADO POR</p>
          <p style="margin: 4px 0 0; color: #ffffff; font-size: 20px; font-weight: 700;">${campaign.brand}</p>
        </td>
      </tr>
    </table>
  ` : '';
  
  // Celebration banner
  const celebrationBanner = `
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin-bottom: 24px; background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%); border-radius: 12px; overflow: hidden;">
      <tr>
        <td style="padding: 24px; text-align: center;">
          <p style="margin: 0; font-size: 32px;">🎊</p>
          <p style="margin: 8px 0 0; color: #ffffff; font-size: 18px; font-weight: 700;">Você foi selecionado!</p>
          <p style="margin: 4px 0 0; color: rgba(255,255,255,0.9); font-size: 14px;">Seu perfil se destacou entre os candidatos</p>
        </td>
      </tr>
    </table>
  `;
  
  const html = getEmailTemplate({
    preheader: `🎉 ${campaign.brand || 'A marca'} escolheu você! Veja os próximos passos.`,
    title: 'Parabéns! 🎉',
    subtitle: 'Você foi aprovado(a)!',
    bodyParagraphs: [
      `Olá <span style="color: #22c55e; font-weight: 700;">${creatorName}</span>!`,
      `<span style="font-size: 18px;">A <span style="color: #ffffff; font-weight: 700;">${campaign.brand || 'marca'}</span> revisou sua candidatura e... <span style="color: #22c55e; font-weight: 700;">VOCÊ FOI ESCOLHIDO(A)!</span></span>`,
      `Isso é incrível! Seu perfil, conteúdo e estilo foram exatamente o que a marca estava procurando. Agora é hora de criar algo <span style="color: #ffffff; font-weight: 600;">extraordinário</span> juntos.`
    ],
    ctaText: '🚀 COMEÇAR AGORA',
    ctaLink: campaignLink,
    customContent: celebrationBanner + brandHeader + getCampaignCardHtml(campaign) + `
      <p style="color: #a1a1aa; font-size: 14px; margin: 24px 0 12px; text-transform: uppercase; letter-spacing: 1px; font-weight: 600;">📋 SEUS PRÓXIMOS PASSOS</p>
    ` + getTimelineHtml([
      { title: '✓ Candidatura Enviada', description: 'Feito!', completed: true },
      { title: '✓ Aprovado pela Marca', description: 'Você está aqui! 🎯', completed: true },
      { title: 'Leia o Briefing', description: 'Entenda exatamente o que a marca espera' },
      { title: 'Crie o Conteúdo', description: 'Mostre seu talento único!' },
      { title: 'Receba seu Pagamento', description: campaign.value ? `Até ${campaign.value} após aprovação` : 'Após aprovação final' },
    ]) + `
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin-top: 24px; background: #27272a; border-radius: 12px; border-left: 4px solid #8b5cf6;">
        <tr>
          <td style="padding: 16px;">
            <p style="margin: 0; color: #8b5cf6; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; font-weight: 600;">💡 DICA DE OURO</p>
            <p style="margin: 8px 0 0; color: #e4e4e7; font-size: 14px; line-height: 1.5;">Leia o briefing com atenção e envie uma mensagem para a marca se apresentando. Marcas adoram creators que se comunicam bem!</p>
          </td>
        </tr>
      </table>
    `,
    footerNote: 'Boa sorte! Estamos torcendo pelo seu sucesso nessa campanha. 🌟'
  });

  return sendEmail({ to, subject, text, html });
}

export async function sendApplicationRejectedEmail(
  to: string,
  creatorName: string,
  campaignTitle: string,
  alternativeCampaigns?: CampaignCardData[]
): Promise<boolean> {
  const baseUrl = getBaseUrl();
  const exploreLink = `${baseUrl}/explore`;
  
  const subject = `Atualização sobre sua candidatura - "${campaignTitle}"`;
  const text = `Olá ${creatorName}!\n\nInfelizmente, sua candidatura para a campanha "${campaignTitle}" não foi selecionada desta vez.\n\nMas não desanime! Explore outras oportunidades: ${exploreLink}\n\nEquipe CreatorConnect`;
  
  const alternativesHtml = alternativeCampaigns && alternativeCampaigns.length > 0 
    ? `<p style="color: #a1a1aa; font-size: 14px; margin: 24px 0 16px; text-transform: uppercase; letter-spacing: 1px; font-weight: 600;">Campanhas que podem interessar você:</p>` + getCampaignGridHtml(alternativeCampaigns.slice(0, 3))
    : '';
  
  const html = getEmailTemplate({
    preheader: 'Continue buscando oportunidades incríveis!',
    title: 'Sobre sua candidatura',
    subtitle: campaignTitle,
    bodyParagraphs: [
      `Olá <span style="color: #ffffff; font-weight: 600;">${creatorName}</span>!`,
      `Agradecemos seu interesse na campanha <span style="color: #ffffff; font-weight: 600;">"${campaignTitle}"</span>. Infelizmente, a marca optou por seguir com outros perfis desta vez.`,
      `<span style="color: #a1a1aa;">Não desanime!</span> Cada marca tem critérios específicos, e isso não reflete a qualidade do seu trabalho. Continue se candidatando às campanhas que combinam com seu perfil!`
    ],
    ctaText: '🔍 Explorar Campanhas',
    ctaLink: exploreLink,
    customContent: alternativesHtml,
    footerNote: 'Dica: Complete seu perfil e adicione mais exemplos do seu trabalho para aumentar suas chances!'
  });

  return sendEmail({ to, subject, text, html });
}

// =============================================================================
// MESSAGE NOTIFICATION
// =============================================================================

export async function sendNewMessageEmail(
  to: string,
  recipientName: string,
  sender: { name: string; avatar?: string },
  messagePreview: string,
  conversationLink: string
): Promise<boolean> {
  const avatar = sender.avatar || getDefaultAvatar(sender.name);
  
  const subject = `💬 Nova mensagem de ${sender.name}`;
  const text = `Olá ${recipientName}!\n\n${sender.name} enviou uma mensagem:\n\n"${messagePreview}"\n\nResponda em: ${conversationLink}\n\nEquipe CreatorConnect`;
  
  const messageCardHtml = `
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin: 24px 0;">
      <tr>
        <td style="padding: 20px; background: linear-gradient(135deg, #1f1f23 0%, #27272a 100%); border-radius: 16px; border: 1px solid #3f3f46;">
          <table role="presentation" cellspacing="0" cellpadding="0" border="0">
            <tr>
              <td width="50" valign="top">
                <img src="${avatar}" alt="${sender.name}" style="width: 44px; height: 44px; border-radius: 50%; object-fit: cover;" />
              </td>
              <td style="padding-left: 12px;" valign="top">
                <p style="margin: 0 0 4px; color: #ffffff; font-size: 14px; font-weight: 600;">${sender.name}</p>
                <p style="margin: 0; color: #d4d4d8; font-size: 14px; line-height: 1.6; background: #09090b; padding: 12px 16px; border-radius: 12px; border-top-left-radius: 4px;">${messagePreview.substring(0, 200)}${messagePreview.length > 200 ? '...' : ''}</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  `;
  
  const html = getEmailTemplate({
    preheader: `${sender.name}: "${messagePreview.substring(0, 50)}..."`,
    title: 'Nova Mensagem',
    subtitle: `De ${sender.name}`,
    bodyParagraphs: [
      `Olá <span style="color: #ffffff; font-weight: 600;">${recipientName}</span>!`,
      `Você recebeu uma nova mensagem:`
    ],
    ctaText: '💬 Responder',
    ctaLink: conversationLink,
    customContent: messageCardHtml,
    footerNote: 'Responda rapidamente para manter uma boa comunicação!'
  });

  return sendEmail({ to, subject, text, html });
}

// =============================================================================
// DELIVERABLE EMAILS
// =============================================================================

export async function sendDeliverableSubmittedEmail(
  to: string,
  companyName: string,
  creator: CreatorCardData,
  campaign: { title: string; id: number },
  deliverableType: string
): Promise<boolean> {
  const baseUrl = getBaseUrl();
  const reviewLink = `${baseUrl}/company/campaigns/${campaign.id}/deliverables`;
  
  const subject = `📦 ${creator.name} enviou uma entrega - "${campaign.title}"`;
  const text = `Olá ${companyName}!\n\n${creator.name} enviou um(a) ${deliverableType} para a campanha "${campaign.title}".\n\nRevise em: ${reviewLink}\n\nEquipe CreatorConnect`;
  
  const html = getEmailTemplate({
    preheader: 'Nova entrega aguardando sua revisão!',
    title: 'Nova Entrega Recebida!',
    subtitle: campaign.title,
    bodyParagraphs: [
      `Olá <span style="color: #ffffff; font-weight: 600;">${companyName}</span>!`,
      `O creator abaixo enviou uma entrega do tipo <span style="color: #a855f7; font-weight: 600;">${deliverableType}</span> para sua campanha.`
    ],
    ctaText: '👀 Revisar Entrega',
    ctaLink: reviewLink,
    customContent: getCreatorCardHtml(creator) + getStatusBadgeHtml('pending'),
    alertBox: {
      icon: '⏰',
      title: 'Prazo de Revisão',
      message: 'Revise a entrega em até <span style="color: #f59e0b; font-weight: 600;">48 horas</span> para manter o engajamento do creator.',
      color: '#f59e0b'
    },
    footerNote: 'Uma revisão rápida mantém os creators motivados e fortalece a parceria!'
  });

  return sendEmail({ to, subject, text, html });
}

export async function sendDeliverableApprovedEmail(
  to: string,
  creatorName: string,
  campaign: { title: string; brand: string },
  value: string
): Promise<boolean> {
  const baseUrl = getBaseUrl();
  const walletLink = `${baseUrl}/wallet`;
  
  const subject = `✅ Entrega aprovada - ${campaign.title}`;
  const text = `Olá ${creatorName}!\n\nSua entrega para "${campaign.title}" foi aprovada!\n\nValor: ${value}\n\nVeja seu saldo em: ${walletLink}\n\nEquipe CreatorConnect`;
  
  const html = getEmailTemplate({
    preheader: `Parabéns! Você ganhou ${value}!`,
    title: 'Entrega Aprovada! ✅',
    subtitle: campaign.title,
    bodyParagraphs: [
      `Olá <span style="color: #ffffff; font-weight: 600;">${creatorName}</span>!`,
      `Ótimas notícias! A <span style="color: #ffffff; font-weight: 600;">${campaign.brand}</span> aprovou sua entrega!`
    ],
    ctaText: '💰 Ver Meu Saldo',
    ctaLink: walletLink,
    customContent: getMetricsGridHtml([
      { label: 'Valor Ganho', value: value, icon: '💰', color: '#22c55e' },
      { label: 'Status', value: 'Aprovado', icon: '✅', color: '#22c55e' },
    ]) + getStatusBadgeHtml('approved'),
    footerNote: 'Continue fazendo um ótimo trabalho! Cada entrega aprovada fortalece seu perfil na plataforma.'
  });

  return sendEmail({ to, subject, text, html });
}

// =============================================================================
// PAYMENT EMAILS
// =============================================================================

export async function sendPaymentAvailableEmail(
  to: string,
  creatorName: string,
  amount: string,
  totalBalance: string
): Promise<boolean> {
  const baseUrl = getBaseUrl();
  const walletLink = `${baseUrl}/wallet`;
  
  const subject = `💰 Pagamento disponível: ${amount}`;
  const text = `Olá ${creatorName}!\n\nVocê tem um novo pagamento disponível de ${amount}.\n\nSaldo total: ${totalBalance}\n\nSaque em: ${walletLink}\n\nEquipe CreatorConnect`;
  
  const html = getEmailTemplate({
    preheader: `Você tem ${amount} disponíveis para saque!`,
    title: 'Pagamento Disponível! 💰',
    subtitle: 'Seu trabalho foi recompensado',
    bodyParagraphs: [
      `Olá <span style="color: #ffffff; font-weight: 600;">${creatorName}</span>!`,
      `Você tem um novo pagamento disponível para saque!`
    ],
    ctaText: '💳 Sacar Agora',
    ctaLink: walletLink,
    customContent: getMetricsGridHtml([
      { label: 'Novo Pagamento', value: amount, icon: '💵', color: '#22c55e' },
      { label: 'Saldo Total', value: totalBalance, icon: '💰', color: '#ffffff' },
    ]),
    footerNote: 'Você pode sacar via PIX a qualquer momento. O valor estará na sua conta em instantes!'
  });

  return sendEmail({ to, subject, text, html });
}

// =============================================================================
// CAMPAIGN INVITE
// =============================================================================

export async function sendCampaignInviteEmail(
  to: string,
  creatorName: string,
  campaign: CampaignCardData,
  inviteMessage?: string
): Promise<boolean> {
  const baseUrl = getBaseUrl();
  const campaignLink = `${baseUrl}/explore`;
  
  const subject = `🎯 ${campaign.brand} te convidou para uma campanha!`;
  const text = `Olá ${creatorName}!\n\n${campaign.brand} convidou você para participar da campanha "${campaign.title}".\n\n${inviteMessage || ''}\n\nVeja detalhes em: ${campaignLink}\n\nEquipe CreatorConnect`;
  
  const html = getEmailTemplate({
    preheader: `Você foi selecionado para uma oportunidade exclusiva!`,
    title: 'Você foi Convidado! 🎯',
    subtitle: `Por ${campaign.brand}`,
    bodyParagraphs: [
      `Olá <span style="color: #ffffff; font-weight: 600;">${creatorName}</span>!`,
      `A marca <span style="color: #a855f7; font-weight: 600;">${campaign.brand}</span> gostou do seu perfil e te convidou para participar de uma campanha exclusiva!`,
      inviteMessage ? `<em style="color: #a1a1aa;">"${inviteMessage}"</em>` : ''
    ].filter(Boolean),
    ctaText: '🚀 Ver Campanha',
    ctaLink: campaignLink,
    customContent: getCampaignCardHtml(campaign),
    alertBox: {
      icon: '⚡',
      title: 'Convite Exclusivo',
      message: 'Você foi selecionado especialmente para esta campanha. Responda o quanto antes!',
      color: '#6366f1'
    },
    footerNote: 'Convites exclusivos são uma ótima oportunidade de trabalhar com marcas incríveis!'
  });

  return sendEmail({ to, subject, text, html });
}

// =============================================================================
// WEEKLY DIGEST
// =============================================================================

export async function sendWeeklyDigestEmail(
  to: string,
  creatorName: string,
  campaigns: CampaignCardData[],
  stats: { applications: number; earnings: string; pendingDeliverables: number }
): Promise<boolean> {
  const baseUrl = getBaseUrl();
  const exploreLink = `${baseUrl}/explore`;
  
  const subject = `📊 Seu resumo semanal + ${campaigns.length} novas campanhas`;
  const text = `Olá ${creatorName}!\n\nConfira seu resumo semanal e ${campaigns.length} novas oportunidades.\n\nAcesse: ${exploreLink}\n\nEquipe CreatorConnect`;
  
  const html = getEmailTemplate({
    preheader: `${campaigns.length} novas campanhas para você explorar!`,
    title: 'Seu Resumo Semanal 📊',
    subtitle: 'Oportunidades e resultados',
    bodyParagraphs: [
      `Olá <span style="color: #ffffff; font-weight: 600;">${creatorName}</span>!`,
      `Confira seu resumo da semana e as novas oportunidades disponíveis:`
    ],
    ctaText: '🔍 Explorar Campanhas',
    ctaLink: exploreLink,
    customContent: getMetricsGridHtml([
      { label: 'Candidaturas', value: stats.applications.toString(), icon: '📝' },
      { label: 'Ganhos', value: stats.earnings, icon: '💰', color: '#22c55e' },
      { label: 'Entregas Pendentes', value: stats.pendingDeliverables.toString(), icon: '📦', color: stats.pendingDeliverables > 0 ? '#f59e0b' : '#22c55e' },
    ]) + `<p style="color: #a1a1aa; font-size: 14px; margin: 24px 0 16px; text-transform: uppercase; letter-spacing: 1px; font-weight: 600;">Novas Campanhas:</p>` + getCampaignGridHtml(campaigns.slice(0, 4)),
    footerNote: 'Continue ativo na plataforma para receber mais convites exclusivos!'
  });

  return sendEmail({ to, subject, text, html });
}

// =============================================================================
// COMPANY WEEKLY REPORT
// =============================================================================

export async function sendWeeklyReportEmail(
  to: string,
  companyName: string,
  stats: { 
    totalApplications: number; 
    approvedCreators: number; 
    pendingDeliverables: number;
    completedCampaigns: number;
    totalSpent: string;
    pendingApplications?: number;
  },
  pendingItems?: {
    applications?: { creatorName: string; campaignTitle: string; daysAgo: number }[];
    deliverables?: { creatorName: string; campaignTitle: string; type: string }[];
  }
): Promise<boolean> {
  const baseUrl = getBaseUrl();
  const dashboardLink = `${baseUrl}/company/home`;
  
  // Dynamic subject based on activity level
  const hasUrgent = (stats.pendingApplications || 0) > 5 || stats.pendingDeliverables > 3;
  const subject = hasUrgent 
    ? `⚡ ${companyName}: ${stats.pendingApplications || 0} candidaturas + ${stats.pendingDeliverables} entregas aguardam você`
    : `📊 Sua semana no CreatorConnect, ${companyName} — ${stats.totalApplications} novas candidaturas`;
  
  const text = `Olá ${companyName}!\n\nSua semana em números:\n• ${stats.totalApplications} novas candidaturas\n• ${stats.approvedCreators} creators aprovados\n• ${stats.pendingDeliverables} entregas para revisar\n\nAcesse seu dashboard: ${dashboardLink}\n\n— Equipe CreatorConnect`;
  
  // Build pending applications list if any
  let pendingApplicationsHtml = '';
  if (pendingItems?.applications && pendingItems.applications.length > 0) {
    const appRows = pendingItems.applications.slice(0, 5).map(app => `
      <tr>
        <td style="padding: 12px; background: #27272a; border-radius: 8px; margin-bottom: 8px;">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
            <tr>
              <td>
                <p style="margin: 0; color: #ffffff; font-size: 14px; font-weight: 600;">${app.creatorName}</p>
                <p style="margin: 4px 0 0; color: #a1a1aa; font-size: 12px;">${app.campaignTitle}</p>
              </td>
              <td style="text-align: right;">
                <span style="background: ${app.daysAgo > 3 ? '#ef4444' : '#f59e0b'}; color: #ffffff; padding: 4px 8px; border-radius: 4px; font-size: 11px; font-weight: 600;">${app.daysAgo}d</span>
              </td>
            </tr>
          </table>
        </td>
      </tr>
      <tr><td style="height: 8px;"></td></tr>
    `).join('');
    
    pendingApplicationsHtml = `
      <p style="color: #a1a1aa; font-size: 14px; margin: 24px 0 12px; text-transform: uppercase; letter-spacing: 1px; font-weight: 600;">📋 Candidaturas Pendentes</p>
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">${appRows}</table>
    `;
  }
  
  // Build pending deliverables list if any
  let pendingDeliverablesHtml = '';
  if (pendingItems?.deliverables && pendingItems.deliverables.length > 0) {
    const delRows = pendingItems.deliverables.slice(0, 5).map(del => `
      <tr>
        <td style="padding: 12px; background: #27272a; border-radius: 8px; margin-bottom: 8px;">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
            <tr>
              <td>
                <p style="margin: 0; color: #ffffff; font-size: 14px; font-weight: 600;">${del.creatorName}</p>
                <p style="margin: 4px 0 0; color: #a1a1aa; font-size: 12px;">${del.campaignTitle}</p>
              </td>
              <td style="text-align: right;">
                <span style="background: #8b5cf6; color: #ffffff; padding: 4px 8px; border-radius: 4px; font-size: 11px; font-weight: 600;">${del.type}</span>
              </td>
            </tr>
          </table>
        </td>
      </tr>
      <tr><td style="height: 8px;"></td></tr>
    `).join('');
    
    pendingDeliverablesHtml = `
      <p style="color: #a1a1aa; font-size: 14px; margin: 24px 0 12px; text-transform: uppercase; letter-spacing: 1px; font-weight: 600;">📦 Entregas para Revisar</p>
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">${delRows}</table>
    `;
  }
  
  // Week summary header
  const weekSummaryHeader = `
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin-bottom: 24px; background: linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%); border-radius: 12px; overflow: hidden;">
      <tr>
        <td style="padding: 20px; text-align: center;">
          <p style="margin: 0; color: rgba(255,255,255,0.9); font-size: 12px; text-transform: uppercase; letter-spacing: 2px;">RESUMO DA SEMANA</p>
          <p style="margin: 8px 0 0; color: #ffffff; font-size: 28px; font-weight: 700;">${stats.totalApplications} candidaturas</p>
          <p style="margin: 4px 0 0; color: rgba(255,255,255,0.8); font-size: 14px;">${stats.approvedCreators} creators aprovados esta semana</p>
        </td>
      </tr>
    </table>
  `;

  // Performance insights
  const performanceInsights = stats.totalApplications > 0 ? `
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin: 24px 0; background: #27272a; border-radius: 12px; border-left: 4px solid #22c55e;">
      <tr>
        <td style="padding: 16px;">
          <p style="margin: 0; color: #22c55e; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; font-weight: 600;">📈 DESTAQUE DA SEMANA</p>
          <p style="margin: 8px 0 0; color: #e4e4e7; font-size: 14px; line-height: 1.5;">
            ${stats.approvedCreators > 0 
              ? `Você aprovou <span style="color: #22c55e; font-weight: 600;">${stats.approvedCreators} creators</span> — ótimo ritmo!` 
              : `Você recebeu <span style="color: #8b5cf6; font-weight: 600;">${stats.totalApplications} candidaturas</span> — hora de revisar!`
            }
            ${stats.completedCampaigns > 0 ? ` E concluiu <span style="color: #ffffff; font-weight: 600;">${stats.completedCampaigns} campanha(s)</span>.` : ''}
          </p>
        </td>
      </tr>
    </table>
  ` : '';

  const html = getEmailTemplate({
    preheader: hasUrgent ? 'Você tem ações pendentes importantes!' : 'Confira os números da sua semana!',
    title: 'Olá! 👋',
    subtitle: `Aqui está seu resumo semanal`,
    bodyParagraphs: [
      `<span style="color: #ffffff; font-weight: 600;">${companyName}</span>, confira o que aconteceu na sua conta esta semana:`,
    ],
    ctaText: '🎯 REVISAR PENDÊNCIAS',
    ctaLink: dashboardLink,
    customContent: weekSummaryHeader + getMetricsGridHtml([
      { label: 'Novas Candidaturas', value: stats.totalApplications.toString(), icon: '📨' },
      { label: 'Aguardando Revisão', value: (stats.pendingApplications || 0).toString(), icon: '⏳', color: (stats.pendingApplications || 0) > 0 ? '#f59e0b' : '#22c55e' },
      { label: 'Creators Aprovados', value: stats.approvedCreators.toString(), icon: '✅', color: '#22c55e' },
      { label: 'Entregas Recebidas', value: stats.pendingDeliverables.toString(), icon: '📦', color: stats.pendingDeliverables > 0 ? '#8b5cf6' : '#22c55e' },
    ]) + performanceInsights + pendingApplicationsHtml + pendingDeliverablesHtml,
    alertBox: (stats.pendingApplications || 0) > 3 || stats.pendingDeliverables > 2 ? {
      icon: '⚡',
      title: 'Atenção!',
      message: `Creators aguardam sua resposta! ${(stats.pendingApplications || 0) > 0 ? `<span style="color: #f59e0b; font-weight: 600;">${stats.pendingApplications} candidatura(s)</span>` : ''}${(stats.pendingApplications || 0) > 0 && stats.pendingDeliverables > 0 ? ' e ' : ''}${stats.pendingDeliverables > 0 ? `<span style="color: #8b5cf6; font-weight: 600;">${stats.pendingDeliverables} entrega(s)</span>` : ''} precisam de ação.`,
      color: '#f59e0b'
    } : undefined,
    footerNote: 'Dica: Responder candidaturas rapidamente melhora sua reputação e atrai melhores talentos! ⭐'
  });

  return sendEmail({ to, subject, text, html });
}

// =============================================================================
// REMINDER EMAILS
// =============================================================================

export async function sendPendingApplicationsReminderEmail(
  to: string,
  companyName: string,
  pendingCount: number,
  oldestDays: number
): Promise<boolean> {
  const baseUrl = getBaseUrl();
  const applicationsLink = `${baseUrl}/company/campaigns`;
  
  const subject = `⏰ ${pendingCount} candidatura(s) aguardando sua revisão`;
  const text = `Olá ${companyName}!\n\nVocê tem ${pendingCount} candidatura(s) pendente(s), algumas há ${oldestDays} dias.\n\nRevise em: ${applicationsLink}\n\nEquipe CreatorConnect`;
  
  const html = getEmailTemplate({
    preheader: 'Não deixe os creators esperando!',
    title: 'Candidaturas Pendentes',
    subtitle: `${pendingCount} aguardando revisão`,
    bodyParagraphs: [
      `Olá <span style="color: #ffffff; font-weight: 600;">${companyName}</span>!`,
      `Você tem <span style="color: #f59e0b; font-weight: 600;">${pendingCount} candidatura(s)</span> aguardando sua revisão.`,
      oldestDays > 3 ? `A mais antiga está esperando há <span style="color: #ef4444; font-weight: 600;">${oldestDays} dias</span>. Responda o quanto antes para não perder bons talentos!` : ''
    ].filter(Boolean),
    ctaText: '👀 Revisar Candidaturas',
    ctaLink: applicationsLink,
    customContent: getMetricsGridHtml([
      { label: 'Pendentes', value: pendingCount.toString(), icon: '📋', color: '#f59e0b' },
      { label: 'Mais Antiga', value: `${oldestDays} dias`, icon: '⏰', color: oldestDays > 3 ? '#ef4444' : '#f59e0b' },
    ]),
    footerNote: 'Creators preferem marcas que respondem rapidamente. Uma resposta ágil aumenta o engajamento!'
  });

  return sendEmail({ to, subject, text, html });
}

export async function sendPendingDeliverablesReminderEmail(
  to: string,
  creatorName: string,
  pendingCount: number,
  campaigns: { title: string; deadline: string }[]
): Promise<boolean> {
  const baseUrl = getBaseUrl();
  const campaignsLink = `${baseUrl}/campaigns`;
  
  const subject = `📦 Lembrete: ${pendingCount} entrega(s) pendente(s)`;
  const text = `Olá ${creatorName}!\n\nVocê tem ${pendingCount} entrega(s) pendente(s).\n\nEnvie em: ${campaignsLink}\n\nEquipe CreatorConnect`;
  
  const campaignsList = campaigns.slice(0, 3).map(c => 
    `<tr><td style="padding: 12px; background: #27272a; border-radius: 8px; margin-bottom: 8px;"><p style="margin: 0; color: #ffffff; font-size: 14px; font-weight: 600;">${c.title}</p><p style="margin: 4px 0 0; color: #f59e0b; font-size: 12px;">Prazo: ${c.deadline}</p></td></tr>`
  ).join('<tr><td style="height: 8px;"></td></tr>');
  
  const html = getEmailTemplate({
    preheader: 'Não perca o prazo das suas entregas!',
    title: 'Entregas Pendentes 📦',
    subtitle: `${pendingCount} aguardando envio`,
    bodyParagraphs: [
      `Olá <span style="color: #ffffff; font-weight: 600;">${creatorName}</span>!`,
      `Você tem <span style="color: #f59e0b; font-weight: 600;">${pendingCount} entrega(s)</span> pendente(s). Não perca os prazos!`
    ],
    ctaText: '📤 Enviar Entregas',
    ctaLink: campaignsLink,
    customContent: `<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin: 24px 0;">${campaignsList}</table>`,
    alertBox: {
      icon: '⏰',
      title: 'Importante',
      message: 'Entregas atrasadas podem afetar sua reputação na plataforma e futuras oportunidades.',
      color: '#f59e0b'
    },
    footerNote: 'Mantenha seu histórico de entregas em dia para receber mais convites!'
  });

  return sendEmail({ to, subject, text, html });
}

// =============================================================================
// ONBOARDING SEQUENCE
// =============================================================================

export async function sendOnboardingWelcomeEmail(
  to: string,
  userName: string,
  userType: 'creator' | 'company'
): Promise<boolean> {
  const baseUrl = getBaseUrl();
  const profileLink = userType === 'creator' ? `${baseUrl}/settings` : `${baseUrl}/company/settings`;
  const exploreLink = userType === 'creator' ? `${baseUrl}/explore` : `${baseUrl}/company/discovery`;
  
  // Personalized subject lines
  const subject = userType === 'creator'
    ? `🎬 ${userName}, sua jornada como creator começa agora!`
    : `🚀 ${userName}, bem-vindo ao CreatorConnect — vamos encontrar seus creators!`;
  
  const creatorSteps = [
    { title: '1. Complete seu perfil', description: 'Foto, bio e links aumentam suas chances em 80%', completed: false },
    { title: '2. Explore campanhas', description: 'Descubra marcas que combinam com você', completed: false },
    { title: '3. Candidate-se', description: 'Mostre seu talento e conquiste parcerias', completed: false },
    { title: '4. Ganhe dinheiro', description: 'Crie conteúdo e receba via PIX em até 7 dias', completed: false },
  ];
  
  const companySteps = [
    { title: '1. Configure sua marca', description: 'Logo e descrição que atraem creators', completed: false },
    { title: '2. Crie sua primeira campanha', description: 'Defina briefing, prazos e valores', completed: false },
    { title: '3. Receba candidaturas', description: 'Analise perfis e escolha os melhores', completed: false },
    { title: '4. Gerencie entregas', description: 'Aprove conteúdos e veja os resultados', completed: false },
  ];
  
  // Welcome banner
  const welcomeBanner = `
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin-bottom: 24px; background: linear-gradient(135deg, #8b5cf6 0%, #6d28d9 50%, #4c1d95 100%); border-radius: 12px; overflow: hidden;">
      <tr>
        <td style="padding: 32px; text-align: center;">
          <p style="margin: 0; font-size: 48px;">🎉</p>
          <p style="margin: 12px 0 0; color: #ffffff; font-size: 24px; font-weight: 700;">Bem-vindo(a), ${userName}!</p>
          <p style="margin: 8px 0 0; color: rgba(255,255,255,0.9); font-size: 16px;">
            ${userType === 'creator' 
              ? 'Sua próxima parceria está a poucos cliques de distância' 
              : 'Conecte-se com os melhores creators do Brasil'
            }
          </p>
        </td>
      </tr>
    </table>
  `;
  
  // Social proof
  const socialProof = `
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin: 24px 0;">
      <tr>
        <td style="text-align: center; padding: 16px; background: #27272a; border-radius: 12px;">
          <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin: 0 auto;">
            <tr>
              <td style="padding: 0 16px; text-align: center;">
                <p style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 700;">500+</p>
                <p style="margin: 4px 0 0; color: #a1a1aa; font-size: 12px;">Marcas Ativas</p>
              </td>
              <td style="padding: 0 16px; border-left: 1px solid #3f3f46; text-align: center;">
                <p style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 700;">2K+</p>
                <p style="margin: 4px 0 0; color: #a1a1aa; font-size: 12px;">Creators</p>
              </td>
              <td style="padding: 0 16px; border-left: 1px solid #3f3f46; text-align: center;">
                <p style="margin: 0; color: #22c55e; font-size: 24px; font-weight: 700;">R$ 2M+</p>
                <p style="margin: 4px 0 0; color: #a1a1aa; font-size: 12px;">Pagos</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  `;
  
  // Quick tip based on user type
  const quickTip = userType === 'creator' ? `
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin: 24px 0; background: #27272a; border-radius: 12px; border-left: 4px solid #22c55e;">
      <tr>
        <td style="padding: 16px;">
          <p style="margin: 0; color: #22c55e; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; font-weight: 600;">💡 DICA PARA COMEÇAR BEM</p>
          <p style="margin: 8px 0 0; color: #e4e4e7; font-size: 14px; line-height: 1.5;">
            Creators com <span style="color: #ffffff; font-weight: 600;">perfil completo</span> (foto, bio, e exemplos de trabalho) 
            recebem <span style="color: #22c55e; font-weight: 600;">3x mais convites</span> para campanhas!
          </p>
        </td>
      </tr>
    </table>
  ` : `
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin: 24px 0; background: #27272a; border-radius: 12px; border-left: 4px solid #8b5cf6;">
      <tr>
        <td style="padding: 16px;">
          <p style="margin: 0; color: #8b5cf6; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; font-weight: 600;">💡 DICA PARA ATRAIR TALENTOS</p>
          <p style="margin: 8px 0 0; color: #e4e4e7; font-size: 14px; line-height: 1.5;">
            Campanhas com <span style="color: #ffffff; font-weight: 600;">briefing detalhado</span> e 
            <span style="color: #ffffff; font-weight: 600;">valores claros</span> recebem 
            <span style="color: #8b5cf6; font-weight: 600;">5x mais candidaturas</span> qualificadas!
          </p>
        </td>
      </tr>
    </table>
  `;
  
  const html = getEmailTemplate({
    preheader: userType === 'creator' 
      ? 'Comece agora e receba seu primeiro pagamento!' 
      : 'Sua primeira campanha está a poucos passos!',
    title: '🎉',
    subtitle: 'Você está dentro!',
    bodyParagraphs: [
      `Olá <span style="color: #8b5cf6; font-weight: 700;">${userName}</span>!`,
      userType === 'creator'
        ? `Você agora faz parte da maior comunidade de creators do Brasil! Milhares de marcas estão aqui procurando talentos como você.`
        : `Sua conta foi criada com sucesso! Agora você tem acesso a milhares de creators talentosos prontos para dar vida às suas campanhas.`,
      `<span style="color: #ffffff; font-weight: 600;">Siga os passos abaixo</span> para aproveitar tudo que a plataforma oferece:`
    ],
    ctaText: userType === 'creator' ? '🔥 EXPLORAR CAMPANHAS' : '🚀 CRIAR PRIMEIRA CAMPANHA',
    ctaLink: exploreLink,
    customContent: welcomeBanner + socialProof + getTimelineHtml(userType === 'creator' ? creatorSteps : companySteps) + quickTip,
    footerNote: 'Qualquer dúvida, responda este email — estamos aqui para ajudar! 💜'
  });

  return sendEmail({ to, subject, text: `Bem-vindo ao CreatorConnect, ${userName}! Sua jornada começa agora.`, html });
}

export async function sendCompleteProfileReminderEmail(
  to: string,
  userName: string,
  completionPercentage: number,
  missingFields: string[]
): Promise<boolean> {
  const baseUrl = getBaseUrl();
  const profileLink = `${baseUrl}/settings`;
  
  const subject = `📝 Complete seu perfil (${completionPercentage}% pronto)`;
  
  const html = getEmailTemplate({
    preheader: 'Perfis completos recebem 3x mais convites!',
    title: 'Complete Seu Perfil',
    subtitle: `${completionPercentage}% preenchido`,
    bodyParagraphs: [
      `Olá <span style="color: #ffffff; font-weight: 600;">${userName}</span>!`,
      `Seu perfil está quase pronto! Perfis completos recebem <span style="color: #22c55e; font-weight: 600;">3x mais convites</span> de marcas.`,
      `Faltam apenas alguns campos:`
    ],
    ctaText: '✏️ Completar Perfil',
    ctaLink: profileLink,
    customContent: getProgressBarHtml(completionPercentage, 'Progresso do Perfil') + 
      `<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin: 16px 0;">
        ${missingFields.slice(0, 5).map(field => `
          <tr><td style="padding: 8px 12px; color: #d4d4d8; font-size: 14px;">❌ ${field}</td></tr>
        `).join('')}
      </table>`,
    footerNote: 'Um perfil completo transmite profissionalismo e aumenta suas chances de sucesso!'
  });

  return sendEmail({ to, subject, text: `Complete seu perfil!`, html });
}

// =============================================================================
// REENGAGEMENT EMAIL
// =============================================================================

export async function sendReengagementEmail(
  to: string,
  userName: string,
  daysSinceLastLogin: number,
  newCampaignsCount: number,
  testimonials?: TestimonialData[]
): Promise<boolean> {
  const baseUrl = getBaseUrl();
  const exploreLink = `${baseUrl}/explore`;
  
  const subject = `🎯 Sentimos sua falta, ${userName}! ${newCampaignsCount} novas oportunidades`;
  
  const testimonialsHtml = testimonials && testimonials.length > 0
    ? testimonials.slice(0, 2).map(t => getTestimonialCardHtml(t)).join('')
    : '';
  
  const html = getEmailTemplate({
    preheader: `${newCampaignsCount} novas campanhas esperando por você!`,
    title: `Sentimos sua falta! 🎯`,
    subtitle: 'Muita coisa aconteceu',
    bodyParagraphs: [
      `Olá <span style="color: #ffffff; font-weight: 600;">${userName}</span>!`,
      `Faz <span style="color: #a855f7; font-weight: 600;">${daysSinceLastLogin} dias</span> que você não nos visita. Enquanto isso, <span style="color: #22c55e; font-weight: 600;">${newCampaignsCount} novas campanhas</span> foram publicadas!`,
      testimonials && testimonials.length > 0 ? `Veja o que outros creators estão conquistando:` : ''
    ].filter(Boolean),
    ctaText: '🔍 Ver Campanhas',
    ctaLink: exploreLink,
    customContent: testimonialsHtml + getMetricsGridHtml([
      { label: 'Novas Campanhas', value: newCampaignsCount.toString(), icon: '🎯', color: '#22c55e' },
      { label: 'Dias Fora', value: daysSinceLastLogin.toString(), icon: '📅' },
    ]),
    footerNote: 'Quanto mais ativo você estiver, mais oportunidades aparecerão!'
  });

  return sendEmail({ to, subject, text: `Sentimos sua falta! ${newCampaignsCount} novas campanhas.`, html });
}

// =============================================================================
// EMAIL PREVIEW FUNCTIONS (Return HTML without sending)
// =============================================================================

export function previewApplicationApprovedEmail(
  creatorName: string,
  campaign: CampaignCardData
): string {
  const baseUrl = getBaseUrl();
  const campaignLink = `${baseUrl}/campaigns`;
  
  // Build brand header with logo if available
  const brandHeader = campaign.brandLogo ? `
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin-bottom: 24px;">
      <tr>
        <td align="center">
          <img src="${campaign.brandLogo}" alt="${campaign.brand}" style="width: 80px; height: 80px; border-radius: 50%; object-fit: cover; border: 3px solid #22c55e;" />
        </td>
      </tr>
      <tr>
        <td align="center" style="padding-top: 12px;">
          <p style="margin: 0; color: #22c55e; font-size: 12px; text-transform: uppercase; letter-spacing: 2px; font-weight: 600;">✓ SELECIONADO POR</p>
          <p style="margin: 4px 0 0; color: #ffffff; font-size: 20px; font-weight: 700;">${campaign.brand}</p>
        </td>
      </tr>
    </table>
  ` : '';
  
  // Celebration banner
  const celebrationBanner = `
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin-bottom: 24px; background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%); border-radius: 12px; overflow: hidden;">
      <tr>
        <td style="padding: 24px; text-align: center;">
          <p style="margin: 0; font-size: 32px;">🎊</p>
          <p style="margin: 8px 0 0; color: #ffffff; font-size: 18px; font-weight: 700;">Você foi selecionado!</p>
          <p style="margin: 4px 0 0; color: rgba(255,255,255,0.9); font-size: 14px;">Seu perfil se destacou entre os candidatos</p>
        </td>
      </tr>
    </table>
  `;
  
  return getEmailTemplate({
    preheader: `🎉 ${campaign.brand || 'A marca'} escolheu você! Veja os próximos passos.`,
    title: 'Parabéns! 🎉',
    subtitle: 'Você foi aprovado(a)!',
    bodyParagraphs: [
      `Olá <span style="color: #22c55e; font-weight: 700;">${creatorName}</span>!`,
      `<span style="font-size: 18px;">A <span style="color: #ffffff; font-weight: 700;">${campaign.brand || 'marca'}</span> revisou sua candidatura e... <span style="color: #22c55e; font-weight: 700;">VOCÊ FOI ESCOLHIDO(A)!</span></span>`,
      `Isso é incrível! Seu perfil, conteúdo e estilo foram exatamente o que a marca estava procurando. Agora é hora de criar algo <span style="color: #ffffff; font-weight: 600;">extraordinário</span> juntos.`
    ],
    ctaText: '🚀 COMEÇAR AGORA',
    ctaLink: campaignLink,
    customContent: celebrationBanner + brandHeader + getCampaignCardHtml(campaign) + `
      <p style="color: #a1a1aa; font-size: 14px; margin: 24px 0 12px; text-transform: uppercase; letter-spacing: 1px; font-weight: 600;">📋 SEUS PRÓXIMOS PASSOS</p>
    ` + getTimelineHtml([
      { title: '✓ Candidatura Enviada', description: 'Feito!', completed: true },
      { title: '✓ Aprovado pela Marca', description: 'Você está aqui! 🎯', completed: true },
      { title: 'Leia o Briefing', description: 'Entenda exatamente o que a marca espera' },
      { title: 'Crie o Conteúdo', description: 'Mostre seu talento único!' },
      { title: 'Receba seu Pagamento', description: campaign.value ? `Até ${campaign.value} após aprovação` : 'Após aprovação final' },
    ]) + `
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin-top: 24px; background: #27272a; border-radius: 12px; border-left: 4px solid #8b5cf6;">
        <tr>
          <td style="padding: 16px;">
            <p style="margin: 0; color: #8b5cf6; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; font-weight: 600;">💡 DICA DE OURO</p>
            <p style="margin: 8px 0 0; color: #e4e4e7; font-size: 14px; line-height: 1.5;">Leia o briefing com atenção e envie uma mensagem para a marca se apresentando. Marcas adoram creators que se comunicam bem!</p>
          </td>
        </tr>
      </table>
    `,
    footerNote: 'Boa sorte! Estamos torcendo pelo seu sucesso nessa campanha. 🌟'
  });
}

export function previewWeeklyReportEmail(
  companyName: string,
  stats: { 
    totalApplications: number; 
    approvedCreators: number; 
    pendingDeliverables: number;
    completedCampaigns: number;
    totalSpent: string;
    pendingApplications?: number;
  },
  pendingItems?: {
    applications?: { creatorName: string; campaignTitle: string; daysAgo: number }[];
    deliverables?: { creatorName: string; campaignTitle: string; type: string }[];
  }
): string {
  const baseUrl = getBaseUrl();
  const dashboardLink = `${baseUrl}/company/home`;
  
  let pendingApplicationsHtml = '';
  if (pendingItems?.applications && pendingItems.applications.length > 0) {
    const appRows = pendingItems.applications.slice(0, 5).map(app => `
      <tr>
        <td style="padding: 12px; background: #27272a; border-radius: 8px; margin-bottom: 8px;">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
            <tr>
              <td>
                <p style="margin: 0; color: #ffffff; font-size: 14px; font-weight: 600;">${app.creatorName}</p>
                <p style="margin: 4px 0 0; color: #a1a1aa; font-size: 12px;">${app.campaignTitle}</p>
              </td>
              <td style="text-align: right;">
                <span style="background: ${app.daysAgo > 3 ? '#ef4444' : '#f59e0b'}; color: #ffffff; padding: 4px 8px; border-radius: 4px; font-size: 11px; font-weight: 600;">${app.daysAgo}d</span>
              </td>
            </tr>
          </table>
        </td>
      </tr>
      <tr><td style="height: 8px;"></td></tr>
    `).join('');
    
    pendingApplicationsHtml = `
      <p style="color: #a1a1aa; font-size: 14px; margin: 24px 0 12px; text-transform: uppercase; letter-spacing: 1px; font-weight: 600;">📋 Candidaturas Pendentes</p>
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">${appRows}</table>
    `;
  }
  
  let pendingDeliverablesHtml = '';
  if (pendingItems?.deliverables && pendingItems.deliverables.length > 0) {
    const delRows = pendingItems.deliverables.slice(0, 5).map(del => `
      <tr>
        <td style="padding: 12px; background: #27272a; border-radius: 8px; margin-bottom: 8px;">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
            <tr>
              <td>
                <p style="margin: 0; color: #ffffff; font-size: 14px; font-weight: 600;">${del.creatorName}</p>
                <p style="margin: 4px 0 0; color: #a1a1aa; font-size: 12px;">${del.campaignTitle}</p>
              </td>
              <td style="text-align: right;">
                <span style="background: #8b5cf6; color: #ffffff; padding: 4px 8px; border-radius: 4px; font-size: 11px; font-weight: 600;">${del.type}</span>
              </td>
            </tr>
          </table>
        </td>
      </tr>
      <tr><td style="height: 8px;"></td></tr>
    `).join('');
    
    pendingDeliverablesHtml = `
      <p style="color: #a1a1aa; font-size: 14px; margin: 24px 0 12px; text-transform: uppercase; letter-spacing: 1px; font-weight: 600;">📦 Entregas para Revisar</p>
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">${delRows}</table>
    `;
  }
  
  // Week summary header
  const weekSummaryHeader = `
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin-bottom: 24px; background: linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%); border-radius: 12px; overflow: hidden;">
      <tr>
        <td style="padding: 20px; text-align: center;">
          <p style="margin: 0; color: rgba(255,255,255,0.9); font-size: 12px; text-transform: uppercase; letter-spacing: 2px;">RESUMO DA SEMANA</p>
          <p style="margin: 8px 0 0; color: #ffffff; font-size: 28px; font-weight: 700;">${stats.totalApplications} candidaturas</p>
          <p style="margin: 4px 0 0; color: rgba(255,255,255,0.8); font-size: 14px;">${stats.approvedCreators} creators aprovados esta semana</p>
        </td>
      </tr>
    </table>
  `;

  // Performance insights
  const performanceInsights = stats.totalApplications > 0 ? `
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin: 24px 0; background: #27272a; border-radius: 12px; border-left: 4px solid #22c55e;">
      <tr>
        <td style="padding: 16px;">
          <p style="margin: 0; color: #22c55e; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; font-weight: 600;">📈 DESTAQUE DA SEMANA</p>
          <p style="margin: 8px 0 0; color: #e4e4e7; font-size: 14px; line-height: 1.5;">
            ${stats.approvedCreators > 0 
              ? `Você aprovou <span style="color: #22c55e; font-weight: 600;">${stats.approvedCreators} creators</span> — ótimo ritmo!` 
              : `Você recebeu <span style="color: #8b5cf6; font-weight: 600;">${stats.totalApplications} candidaturas</span> — hora de revisar!`
            }
            ${stats.completedCampaigns > 0 ? ` E concluiu <span style="color: #ffffff; font-weight: 600;">${stats.completedCampaigns} campanha(s)</span>.` : ''}
          </p>
        </td>
      </tr>
    </table>
  ` : '';

  const hasUrgent = (stats.pendingApplications || 0) > 5 || stats.pendingDeliverables > 3;
  
  return getEmailTemplate({
    preheader: hasUrgent ? 'Você tem ações pendentes importantes!' : 'Confira os números da sua semana!',
    title: 'Olá! 👋',
    subtitle: `Aqui está seu resumo semanal`,
    bodyParagraphs: [
      `<span style="color: #ffffff; font-weight: 600;">${companyName}</span>, confira o que aconteceu na sua conta esta semana:`,
    ],
    ctaText: '🎯 REVISAR PENDÊNCIAS',
    ctaLink: dashboardLink,
    customContent: weekSummaryHeader + getMetricsGridHtml([
      { label: 'Novas Candidaturas', value: stats.totalApplications.toString(), icon: '📨' },
      { label: 'Aguardando Revisão', value: (stats.pendingApplications || 0).toString(), icon: '⏳', color: (stats.pendingApplications || 0) > 0 ? '#f59e0b' : '#22c55e' },
      { label: 'Creators Aprovados', value: stats.approvedCreators.toString(), icon: '✅', color: '#22c55e' },
      { label: 'Entregas Recebidas', value: stats.pendingDeliverables.toString(), icon: '📦', color: stats.pendingDeliverables > 0 ? '#8b5cf6' : '#22c55e' },
    ]) + performanceInsights + pendingApplicationsHtml + pendingDeliverablesHtml,
    alertBox: (stats.pendingApplications || 0) > 3 || stats.pendingDeliverables > 2 ? {
      icon: '⚡',
      title: 'Atenção!',
      message: `Creators aguardam sua resposta! ${(stats.pendingApplications || 0) > 0 ? `<span style="color: #f59e0b; font-weight: 600;">${stats.pendingApplications} candidatura(s)</span>` : ''}${(stats.pendingApplications || 0) > 0 && stats.pendingDeliverables > 0 ? ' e ' : ''}${stats.pendingDeliverables > 0 ? `<span style="color: #8b5cf6; font-weight: 600;">${stats.pendingDeliverables} entrega(s)</span>` : ''} precisam de ação.`,
      color: '#f59e0b'
    } : undefined,
    footerNote: 'Dica: Responder candidaturas rapidamente melhora sua reputação e atrai melhores talentos! ⭐'
  });
}

export function previewOnboardingWelcomeEmail(
  userName: string,
  userType: 'creator' | 'company'
): string {
  const baseUrl = getBaseUrl();
  const exploreLink = userType === 'creator' ? `${baseUrl}/explore` : `${baseUrl}/company/discovery`;
  
  const creatorSteps = [
    { title: '1. Complete seu perfil', description: 'Foto, bio e links aumentam suas chances em 80%', completed: false },
    { title: '2. Explore campanhas', description: 'Descubra marcas que combinam com você', completed: false },
    { title: '3. Candidate-se', description: 'Mostre seu talento e conquiste parcerias', completed: false },
    { title: '4. Ganhe dinheiro', description: 'Crie conteúdo e receba via PIX em até 7 dias', completed: false },
  ];
  
  const companySteps = [
    { title: '1. Configure sua marca', description: 'Logo e descrição que atraem creators', completed: false },
    { title: '2. Crie sua primeira campanha', description: 'Defina briefing, prazos e valores', completed: false },
    { title: '3. Receba candidaturas', description: 'Analise perfis e escolha os melhores', completed: false },
    { title: '4. Gerencie entregas', description: 'Aprove conteúdos e veja os resultados', completed: false },
  ];
  
  // Welcome banner
  const welcomeBanner = `
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin-bottom: 24px; background: linear-gradient(135deg, #8b5cf6 0%, #6d28d9 50%, #4c1d95 100%); border-radius: 12px; overflow: hidden;">
      <tr>
        <td style="padding: 32px; text-align: center;">
          <p style="margin: 0; font-size: 48px;">🎉</p>
          <p style="margin: 12px 0 0; color: #ffffff; font-size: 24px; font-weight: 700;">Bem-vindo(a), ${userName}!</p>
          <p style="margin: 8px 0 0; color: rgba(255,255,255,0.9); font-size: 16px;">
            ${userType === 'creator' 
              ? 'Sua próxima parceria está a poucos cliques de distância' 
              : 'Conecte-se com os melhores creators do Brasil'
            }
          </p>
        </td>
      </tr>
    </table>
  `;
  
  // Social proof
  const socialProof = `
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin: 24px 0;">
      <tr>
        <td style="text-align: center; padding: 16px; background: #27272a; border-radius: 12px;">
          <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin: 0 auto;">
            <tr>
              <td style="padding: 0 16px; text-align: center;">
                <p style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 700;">500+</p>
                <p style="margin: 4px 0 0; color: #a1a1aa; font-size: 12px;">Marcas Ativas</p>
              </td>
              <td style="padding: 0 16px; border-left: 1px solid #3f3f46; text-align: center;">
                <p style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 700;">2K+</p>
                <p style="margin: 4px 0 0; color: #a1a1aa; font-size: 12px;">Creators</p>
              </td>
              <td style="padding: 0 16px; border-left: 1px solid #3f3f46; text-align: center;">
                <p style="margin: 0; color: #22c55e; font-size: 24px; font-weight: 700;">R$ 2M+</p>
                <p style="margin: 4px 0 0; color: #a1a1aa; font-size: 12px;">Pagos</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  `;
  
  // Quick tip based on user type
  const quickTip = userType === 'creator' ? `
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin: 24px 0; background: #27272a; border-radius: 12px; border-left: 4px solid #22c55e;">
      <tr>
        <td style="padding: 16px;">
          <p style="margin: 0; color: #22c55e; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; font-weight: 600;">💡 DICA PARA COMEÇAR BEM</p>
          <p style="margin: 8px 0 0; color: #e4e4e7; font-size: 14px; line-height: 1.5;">
            Creators com <span style="color: #ffffff; font-weight: 600;">perfil completo</span> (foto, bio, e exemplos de trabalho) 
            recebem <span style="color: #22c55e; font-weight: 600;">3x mais convites</span> para campanhas!
          </p>
        </td>
      </tr>
    </table>
  ` : `
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin: 24px 0; background: #27272a; border-radius: 12px; border-left: 4px solid #8b5cf6;">
      <tr>
        <td style="padding: 16px;">
          <p style="margin: 0; color: #8b5cf6; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; font-weight: 600;">💡 DICA PARA ATRAIR TALENTOS</p>
          <p style="margin: 8px 0 0; color: #e4e4e7; font-size: 14px; line-height: 1.5;">
            Campanhas com <span style="color: #ffffff; font-weight: 600;">briefing detalhado</span> e 
            <span style="color: #ffffff; font-weight: 600;">valores claros</span> recebem 
            <span style="color: #8b5cf6; font-weight: 600;">5x mais candidaturas</span> qualificadas!
          </p>
        </td>
      </tr>
    </table>
  `;
  
  return getEmailTemplate({
    preheader: userType === 'creator' 
      ? 'Comece agora e receba seu primeiro pagamento!' 
      : 'Sua primeira campanha está a poucos passos!',
    title: '🎉',
    subtitle: 'Você está dentro!',
    bodyParagraphs: [
      `Olá <span style="color: #8b5cf6; font-weight: 700;">${userName}</span>!`,
      userType === 'creator'
        ? `Você agora faz parte da maior comunidade de creators do Brasil! Milhares de marcas estão aqui procurando talentos como você.`
        : `Sua conta foi criada com sucesso! Agora você tem acesso a milhares de creators talentosos prontos para dar vida às suas campanhas.`,
      `<span style="color: #ffffff; font-weight: 600;">Siga os passos abaixo</span> para aproveitar tudo que a plataforma oferece:`
    ],
    ctaText: userType === 'creator' ? '🔥 EXPLORAR CAMPANHAS' : '🚀 CRIAR PRIMEIRA CAMPANHA',
    ctaLink: exploreLink,
    customContent: welcomeBanner + socialProof + getTimelineHtml(userType === 'creator' ? creatorSteps : companySteps) + quickTip,
    footerNote: 'Qualquer dúvida, responda este email — estamos aqui para ajudar! 💜'
  });
}
