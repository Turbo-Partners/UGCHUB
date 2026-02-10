import PDFDocument from "pdfkit";
import type { User, Campaign, Application, Company } from "@shared/schema";

interface ContractData {
  company: Company;
  companyOwner: User;
  creator: User;
  campaign: Campaign;
  application: Application;
  contractValue: string;
  includesProductShipping?: boolean;
  serviceDescription: string;
  deliverables: string[];
  paymentTerms?: string;
  additionalClauses?: string;
  contractNumber?: string;
}

const COLORS = {
  headerBg: "#2d3748",
  headerText: "#ffffff",
  headerSubtext: "#bfc5cc",
  primary: "#1978D5",
  primaryDark: "#05122B",
  sectionBorder: "#1978D5",
  sectionBg: "#f8fafc",
  textDark: "#1a202c",
  textMuted: "#718096",
  accent: "#667eea",
};

export function generateContractPDF(data: ContractData): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: "A4",
      margins: { top: 120, bottom: 80, left: 50, right: 50 },
      autoFirstPage: true,
    });

    const chunks: Buffer[] = [];
    doc.on("data", (chunk) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    const pageWidth = doc.page.width;
    const pageHeight = doc.page.height;
    const contentWidth = pageWidth - 100;
    const marginBottom = 80;
    const headerHeight = 100;
    const contractNumber = data.contractNumber || String(data.application.id).padStart(6, "0");

    const today = new Date();
    const formattedDate = today.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
    const shortDate = today.toLocaleDateString("pt-BR");

    let pageCount = 1;
    let footerDrawn = false;

    const drawHeader = () => {
      const headerBoxHeight = 80;
      const headerY = 20;
      const cornerRadius = 8;

      doc.save();
      doc.roundedRect(50, headerY, contentWidth, headerBoxHeight, cornerRadius)
         .fill(COLORS.headerBg);

      doc.fontSize(12)
         .font("Helvetica-Bold")
         .fillColor(COLORS.headerText)
         .text("INSTRUMENTO PARTICULAR DE CONTRATO DE PRESTAÇÃO DE SERVIÇOS", 50, headerY + 15, {
           width: contentWidth,
           align: "center",
           lineBreak: true,
         });

      doc.fontSize(9)
         .font("Helvetica")
         .fillColor(COLORS.headerSubtext)
         .text("de Produção de Conteúdo Digital com Cessão de Direitos de Imagem", 50, headerY + 35, {
           width: contentWidth,
           align: "center",
           lineBreak: false,
         });

      doc.fontSize(8)
         .fillColor(COLORS.headerText)
         .text(`Contrato Nº ${contractNumber}`, 50, headerY + 52, {
           width: contentWidth,
           align: "center",
           lineBreak: false,
         });

      doc.fontSize(7)
         .fillColor(COLORS.headerSubtext)
         .text(shortDate, 60, headerY + 65, { width: 100, align: "left", lineBreak: false });

      doc.restore();
    };

    const drawFooter = () => {
      if (footerDrawn) return;
      footerDrawn = true;
      
      const footerY = pageHeight - 50;
      
      const originalBottomMargin = doc.page.margins.bottom;
      doc.page.margins.bottom = 0;

      doc.save();

      doc.moveTo(50, footerY)
         .lineTo(pageWidth - 50, footerY)
         .strokeColor("#e2e8f0")
         .lineWidth(1)
         .stroke();

      doc.fontSize(7)
         .font("Helvetica")
         .fillColor(COLORS.textMuted)
         .text(`Página ${pageCount}`, 50, footerY + 8, {
           width: contentWidth,
           align: "center",
           lineBreak: false,
         });

      doc.fontSize(6)
         .fillColor(COLORS.textMuted)
         .text("Documento gerado eletronicamente pela plataforma CreatorConnect", 50, footerY + 20, {
           width: contentWidth,
           align: "center",
           lineBreak: false,
         });

      doc.restore();
      
      doc.page.margins.bottom = originalBottomMargin;
    };

    const ensureSpace = (neededHeight: number): void => {
      const availableSpace = pageHeight - marginBottom - doc.y;
      if (availableSpace < neededHeight) {
        drawFooter();
        doc.addPage();
        pageCount++;
        footerDrawn = false;
        drawHeader();
        doc.y = headerHeight + 8;
      }
    };

    const drawSectionHeader = (title: string, number: string): void => {
      const sectionHeight = 24;
      ensureSpace(sectionHeight + 8);
      const y = doc.y;
      
      doc.save();
      
      doc.rect(50, y, contentWidth, sectionHeight)
         .fill(COLORS.sectionBg);
      
      doc.rect(50, y, 4, sectionHeight)
         .fill(COLORS.sectionBorder);

      doc.fontSize(10)
         .font("Helvetica-Bold")
         .fillColor(COLORS.primaryDark)
         .text(`CLÁUSULA ${number} – ${title}`, 62, y + 6, { width: contentWidth - 20 });

      doc.restore();
      
      doc.y = y + sectionHeight + 6;
    };

    const drawInfoBox = (label: string, content: string[], accentColor: string): void => {
      const boxPadding = 10;
      const lineHeight = 13;
      const contentHeight = content.length * lineHeight + boxPadding * 2 + 18;
      
      ensureSpace(contentHeight + 8);
      const y = doc.y;

      doc.save();

      doc.rect(50, y, contentWidth, contentHeight)
         .fill("#ffffff")
         .stroke("#e2e8f0");

      doc.rect(50, y, 4, contentHeight)
         .fill(accentColor);

      doc.fontSize(9)
         .font("Helvetica-Bold")
         .fillColor(accentColor)
         .text(label, 62, y + boxPadding, { lineBreak: false });

      let textY = y + boxPadding + 15;
      doc.font("Helvetica")
         .fontSize(8)
         .fillColor(COLORS.textDark);

      content.forEach((line) => {
        doc.text(line, 62, textY, { width: contentWidth - 30 });
        textY += lineHeight;
      });

      doc.restore();

      doc.y = y + contentHeight + 8;
    };

    const drawValueHighlight = (label: string, value: string): void => {
      const boxHeight = 45;
      ensureSpace(boxHeight + 8);
      const y = doc.y;

      doc.save();

      const gradient = doc.linearGradient(50, y, 50 + contentWidth, y);
      gradient.stop(0, COLORS.primaryDark).stop(1, COLORS.primary);

      doc.roundedRect(50, y, contentWidth, boxHeight, 6)
         .fill(gradient);

      doc.fontSize(8)
         .font("Helvetica")
         .fillColor("rgba(255,255,255,0.8)")
         .text(label, 62, y + 10, { lineBreak: false });

      doc.fontSize(16)
         .font("Helvetica-Bold")
         .fillColor("#ffffff")
         .text(value, 62, y + 22, { lineBreak: false });

      doc.restore();

      doc.y = y + boxHeight + 8;
    };

    const drawText = (text: string, options: { align?: string; indent?: boolean } = {}): void => {
      doc.fontSize(9).font("Helvetica");
      const textHeight = doc.heightOfString(text, { width: contentWidth - (options.indent ? 20 : 0) });
      ensureSpace(textHeight + 4);
      const y = doc.y;
      
      doc.fillColor(COLORS.textDark)
         .text(text, options.indent ? 70 : 50, y, { 
           width: contentWidth - (options.indent ? 20 : 0), 
           align: options.align as any || "justify",
         });
      
      doc.y = y + textHeight + 6;
    };

    const drawSubItem = (text: string, letter: string): void => {
      doc.fontSize(9).font("Helvetica");
      const textHeight = doc.heightOfString(`${letter}) ${text}`, { width: contentWidth - 20 });
      ensureSpace(textHeight + 4);
      const y = doc.y;
      
      doc.fillColor(COLORS.textDark)
         .text(`${letter}) ${text}`, 62, y, { width: contentWidth - 20, align: "justify" });
      
      doc.y = y + textHeight + 4;
    };

    const drawNumberedItem = (text: string, number: string): void => {
      doc.fontSize(9).font("Helvetica");
      const textHeight = doc.heightOfString(`${number} ${text}`, { width: contentWidth });
      ensureSpace(textHeight + 4);
      const y = doc.y;
      
      doc.fillColor(COLORS.textDark)
         .text(`${number} ${text}`, 50, y, { width: contentWidth, align: "justify" });
      
      doc.y = y + textHeight + 6;
    };

    drawHeader();
    doc.y = headerHeight + 8;

    const companyAddress = [
      data.company.street,
      data.company.number && `nº ${data.company.number}`,
      data.company.neighborhood,
      data.company.city && data.company.state && `${data.company.city} - ${data.company.state}`,
      data.company.cep && `CEP ${data.company.cep}`,
    ].filter(Boolean).join(", ");

    const creatorAddress = [
      data.creator.street,
      data.creator.number && `nº ${data.creator.number}`,
      data.creator.neighborhood,
      data.creator.city && data.creator.state && `${data.creator.city} - ${data.creator.state}`,
      data.creator.cep && `CEP ${data.creator.cep}`,
    ].filter(Boolean).join(", ");

    const companyInfo = [
      `Razão Social: ${data.company.name}`,
      data.company.tradeName ? `Nome Fantasia: ${data.company.tradeName}` : null,
      data.company.cnpj ? `CNPJ: ${data.company.cnpj}` : null,
      companyAddress ? `Endereço: ${companyAddress}` : null,
      data.company.email ? `E-mail: ${data.company.email}` : (data.companyOwner?.email ? `E-mail: ${data.companyOwner.email}` : null),
      data.company.phone ? `Telefone: ${data.company.phone}` : null,
    ].filter(Boolean) as string[];

    drawInfoBox("CONTRATANTE", companyInfo, COLORS.primary);

    const creatorInfo = [
      `Nome: ${data.creator.name}`,
      data.creator.cpf ? `CPF: ${data.creator.cpf}` : null,
      creatorAddress ? `Endereço: ${creatorAddress}` : null,
      `E-mail: ${data.creator.email}`,
      data.creator.phone ? `Telefone: ${data.creator.phone}` : null,
      data.creator.instagram ? `Instagram: @${data.creator.instagram}` : null,
    ].filter(Boolean) as string[];

    drawInfoBox("CONTRATADO(A)", creatorInfo, COLORS.accent);

    doc.y += 5;
    drawText("As partes acima identificadas, de forma livre e espontânea, ajustam o presente Contrato de Prestação de Serviços com Cessão de Direitos de Imagem, de acordo com as disposições a seguir:");

    drawSectionHeader("DO OBJETO", "PRIMEIRA");

    drawNumberedItem(
      `O presente instrumento tem por objeto a prestação, pelo CONTRATADO à CONTRATANTE, de serviços profissionais de criação, desenvolvimento, produção, captação, edição e entrega de conteúdos audiovisuais e digitais para a campanha "${data.campaign.title}", bem como a cessão de direitos de uso de imagem, voz, nome, estilo e marcas pessoais do CONTRATADO nos termos deste contrato.`,
      "1.1."
    );

    drawNumberedItem(
      "Integram o objeto contratual, sem prejuízo de outros elementos técnicos definidos em briefing detalhado aceito pelas partes, as seguintes obrigações específicas:",
      "1.2."
    );

    drawSubItem(
      "Criação de conteúdo audiovisual para fins de marketing e publicidade digital, compreendendo: conceitos criativos, roteirização, definição de ganchos (hooks), captação de imagens (incluindo fotos e vídeos), tratamento, edição final e entrega em formatos compatíveis com as plataformas indicadas pela CONTRATANTE;",
      "a"
    );

    drawSubItem(
      "Cessão de direitos de utilização de imagem, voz, nome e demais elementos pessoais do CONTRATADO para uso promocional em redes sociais, plataformas de anúncios, canais de comunicação digital, sites, materiais institucionais e quaisquer outros meios digitais, pelo período, extensão e limitações previstos neste contrato.",
      "b"
    );

    if (data.serviceDescription) {
      drawNumberedItem(data.serviceDescription, "1.3.");
    }

    drawNumberedItem(
      "O CONTRATADO declara reconhecer e aceitar que os conteúdos produzidos serão vinculados diretamente às campanhas de marketing da CONTRATANTE e de seus clientes, especialmente para fins de publicidade, promoção, captação de leads e reconhecimento de marca.",
      "1.4."
    );

    drawSectionHeader("DOS DIREITOS DE IMAGEM E PROPRIEDADE INTELECTUAL", "SEGUNDA");

    drawNumberedItem(
      "O CONTRATADO, livremente e de forma irrevogável, cede e transfere à CONTRATANTE, pelo prazo de 12 (doze) meses, contados da data de entrega aprovada do conteúdo, todos os direitos de uso, reprodução, publicação, adaptação, edição, distribuição e exploração da sua imagem, voz e nome, em caráter não exclusivo, mundial e livre de ônus, observadas as finalidades previstas neste contrato.",
      "2.1."
    );

    drawNumberedItem(
      "Fica expressamente autorizado o uso dos materiais audiovisuais e fotográficos produzidos pelo CONTRATADO para fins comerciais, promocionais e institucionais, em todas as plataformas e mídias digitais, aplicações móveis, redes sociais, veículos de comunicação e quaisquer outras formas de mídia digital ou tecnológica.",
      "2.2."
    );

    drawNumberedItem(
      "A propriedade intelectual sobre os roteiros, edições, artes, conteúdos e quaisquer criações derivadas, inclusive eventuais direitos autorais conexos, pertencerão à CONTRATANTE após a aprovação final do material, ficando o CONTRATADO com direito de menção enquanto criador original, sem qualquer direito a remuneração adicional, salvo acordo expresso em contrário.",
      "2.3."
    );

    drawSectionHeader("DAS OBRIGAÇÕES DO CONTRATADO", "TERCEIRA");

    drawText("O CONTRATADO obriga-se, além das demais disposições deste contrato:");

    drawNumberedItem(
      "Entregar os conteúdos em conformidade com o briefing aprovado, observando rigorosamente os parâmetros, diretrizes de estilo, linguagem, roteiros, cronogramas, formatos técnicos e padrões de qualidade estipulados pela CONTRATANTE.",
      "3.1."
    );

    const deadlineDate = new Date(data.campaign.deadline);
    const formattedDeadline = deadlineDate.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });

    drawNumberedItem(
      `Entregar integralmente os materiais até ${formattedDeadline}${data.includesProductShipping ? ", ou no prazo máximo de 03 (três) dias corridos contados do recebimento dos produtos, briefings e insumos necessários à produção do conteúdo" : ""}, sob pena de aplicação das penalidades previstas neste instrumento.`,
      "3.2."
    );

    if (data.deliverables && data.deliverables.length > 0) {
      drawText("Entregas acordadas:");
      data.deliverables.forEach((deliverable, index) => {
        drawSubItem(deliverable, String.fromCharCode(97 + index));
      });
    }

    drawNumberedItem(
      "Em razão do caráter personalíssimo da presente contratação, o CONTRATADO obriga-se a executar pessoalmente os serviços ora ajustados, sendo-lhe vedado, salvo autorização prévia e expressa da CONTRATANTE, transferir, delegar, subcontratar ou permitir que terceiros, a qualquer título, assumam total ou parcialmente as obrigações assumidas neste instrumento.",
      "3.3."
    );

    drawNumberedItem(
      "Zelar pela confidencialidade de todas as informações, estratégias, materiais, roteiros, dados, métricas e quaisquer informações fornecidas pela CONTRATANTE ou seus clientes, nos termos da cláusula de confidencialidade.",
      "3.4."
    );

    drawSectionHeader("DAS OBRIGAÇÕES DO CONTRATANTE", "QUARTA");

    drawNumberedItem(
      "Fornecer ao CONTRATADO, tempestivamente, todos os insumos, produtos, informações técnicas, especificações de campanha, guias de conteúdo, produtos físicos para divulgação e demais materiais necessários à produção de conteúdo.",
      "4.1."
    );

    drawNumberedItem(
      "Aprovar ou solicitar ajustes nos conteúdos entregues em até 02 (dois) dias úteis contados da data de entrega, sob pena de considerar-se tacitamente aprovado.",
      "4.2."
    );

    drawNumberedItem(
      "Efetuar o pagamento da remuneração pactuada nos termos e prazos avençados, após a aprovação final dos conteúdos.",
      "4.3."
    );

    drawSectionHeader("DA REMUNERAÇÃO E CONDIÇÕES DE PAGAMENTO", "QUINTA");

    drawValueHighlight("VALOR TOTAL DO CONTRATO", `R$ ${data.contractValue}`);

    if (data.includesProductShipping) {
      drawText("✓ Este contrato inclui o envio de produto(s) para o(a) CONTRATADO(A).");
    }

    drawNumberedItem(
      `Pela integral execução dos serviços objeto deste contrato, o CONTRATADO receberá da CONTRATANTE a importância total de R$ ${data.contractValue} (${valorPorExtenso(data.contractValue)}).`,
      "5.1."
    );

    if (data.paymentTerms) {
      drawNumberedItem(data.paymentTerms, "5.2.");
    } else {
      drawNumberedItem(
        "O pagamento será efetuado no prazo máximo de 30 (trinta) dias após a aprovação final do material pela CONTRATANTE.",
        "5.2."
      );
    }

    drawSectionHeader("AVALIAÇÃO, REGRAVAÇÃO E GARANTIA DE QUALIDADE", "SEXTA");

    drawNumberedItem(
      "Os conteúdos serão avaliados pela CONTRATANTE quanto ao atendimento aos parâmetros de qualidade estabelecidos no briefing.",
      "6.1."
    );

    drawNumberedItem(
      "Caso o material não esteja em conformidade com os requisitos acordados, o CONTRATADO terá o prazo máximo de 03 (três) dias corridos para providenciar a devida regravação ou revisão, sem ônus adicional para a CONTRATANTE.",
      "6.2."
    );

    drawSectionHeader("DA MULTA, PENALIDADES E RESCISÃO", "SÉTIMA");

    drawNumberedItem(
      "O atraso injustificado na entrega dos conteúdos sujeitará o CONTRATADO ao pagamento de multa diária equivalente a 5% do valor do contrato por dia de atraso, sem prejuízo de indenização por perdas e danos.",
      "7.1."
    );

    drawNumberedItem(
      "O contrato poderá ser rescindido, com aviso prévio de 10 (dez) dias corridos, na hipótese de descumprimento de qualquer cláusula contratual não sanado no prazo de 05 (cinco) dias úteis após notificação formal da parte contrária.",
      "7.2."
    );

    drawNumberedItem(
      "A rescisão motivada por inadimplemento facultará à parte inocente a cobrança de multa compensatória de 20% (vinte por cento) sobre o valor total contratado, além de perdas e danos.",
      "7.3."
    );

    drawSectionHeader("DA CONFIDENCIALIDADE E PROTEÇÃO DE DADOS", "OITAVA");

    drawNumberedItem(
      "As partes obrigam-se, reciprocamente, a manter o mais absoluto sigilo sobre todas as informações técnicas, estratégicas, comerciais e quaisquer dados confidenciais obtidos em razão deste contrato, sob pena de responder por perdas e danos.",
      "8.1."
    );

    drawNumberedItem(
      "Sem prejuízo de obrigações legais, a divulgação de informações confidenciais só poderá ocorrer mediante consentimento escrito da parte titular.",
      "8.2."
    );

    drawSectionHeader("DA INEXISTÊNCIA DE VÍNCULO EMPREGATÍCIO", "NONA");

    drawNumberedItem(
      "As partes reconhecem que este contrato é de natureza civil e autônoma, inexistindo qualquer vínculo empregatício, societário ou de subordinação entre CONTRATANTE e CONTRATADO, sendo este último responsável por seus encargos fiscais, previdenciários e tributários.",
      "9.1."
    );

    drawSectionHeader("DO FORO", "DÉCIMA");

    const companyCity = data.company.city || "domicílio do CONTRATANTE";
    const companyState = data.company.state || "";

    drawNumberedItem(
      `Para dirimir quaisquer controvérsias oriundas deste contrato, inclusive quanto à sua validade, interpretação, execução ou rescisão, fica eleito o foro da Comarca de ${companyCity}${companyState ? `, Estado de ${companyState}` : ""}, com renúncia a qualquer outro, por mais privilegiado que seja.`,
      "10.1."
    );

    if (data.additionalClauses) {
      doc.y += 5;
      drawText("Disposições adicionais acordadas entre as partes:", { align: "left" });
      drawNumberedItem(data.additionalClauses, "10.2.");
    }

    doc.y += 10;
    drawText("E por estarem assim justas e contratadas, firmam as partes o presente instrumento em 02 (duas) vias de igual teor e forma.");

    const signatureBlockHeight = 160;
    ensureSpace(signatureBlockHeight);

    doc.y += 15;
    doc.fontSize(9)
       .font("Helvetica")
       .fillColor(COLORS.textDark)
       .text(`${data.company.city || "Brasil"}, ${formattedDate}`, 50, doc.y, {
         width: contentWidth,
         align: "center",
       });
    doc.y += 25;

    const signatureBoxWidth = (contentWidth - 30) / 2;
    const signatureBoxHeight = 70;
    const sigY = doc.y;

    doc.save();
    doc.roundedRect(50, sigY, signatureBoxWidth, signatureBoxHeight, 4)
       .fill("#f7fafc")
       .stroke("#e2e8f0");
    
    doc.moveTo(70, sigY + 40)
       .lineTo(50 + signatureBoxWidth - 20, sigY + 40)
       .strokeColor(COLORS.textMuted)
       .lineWidth(1)
       .stroke();

    doc.fontSize(8)
       .font("Helvetica-Bold")
       .fillColor(COLORS.primaryDark)
       .text("CONTRATANTE", 50, sigY + 48, { width: signatureBoxWidth, align: "center", lineBreak: false });

    doc.fontSize(7)
       .font("Helvetica")
       .fillColor(COLORS.textMuted)
       .text(data.company.name || "", 50, sigY + 58, { width: signatureBoxWidth, align: "center", lineBreak: false });
    doc.restore();

    doc.save();
    doc.roundedRect(50 + signatureBoxWidth + 30, sigY, signatureBoxWidth, signatureBoxHeight, 4)
       .fill("#f7fafc")
       .stroke("#e2e8f0");
    
    doc.moveTo(70 + signatureBoxWidth + 30, sigY + 40)
       .lineTo(50 + signatureBoxWidth * 2 + 10, sigY + 40)
       .strokeColor(COLORS.textMuted)
       .lineWidth(1)
       .stroke();

    doc.fontSize(8)
       .font("Helvetica-Bold")
       .fillColor(COLORS.primaryDark)
       .text("CONTRATADO(A)", 50 + signatureBoxWidth + 30, sigY + 48, {
         width: signatureBoxWidth,
         align: "center",
         lineBreak: false,
       });

    doc.fontSize(7)
       .font("Helvetica")
       .fillColor(COLORS.textMuted)
       .text(data.creator.name, 50 + signatureBoxWidth + 30, sigY + 58, {
         width: signatureBoxWidth,
         align: "center",
         lineBreak: false,
       });
    doc.restore();

    doc.y = sigY + signatureBoxHeight + 15;

    doc.save();
    doc.roundedRect(50, doc.y, contentWidth, 35, 4)
       .fill("#edf2f7");

    doc.fontSize(7)
       .font("Helvetica")
       .fillColor(COLORS.textMuted)
       .text(
         "Este documento será assinado eletronicamente através da plataforma CreatorConnect com validade jurídica conforme a Lei nº 14.063/2020.",
         60,
         doc.y + 8,
         { width: contentWidth - 20, align: "center" }
       );

    doc.fontSize(6)
       .fillColor(COLORS.textMuted)
       .text(`Contrato Nº ${contractNumber} • Gerado em ${shortDate}`, 60, doc.y + 22, {
         width: contentWidth - 20,
         align: "center",
       });
    doc.restore();

    drawFooter();

    doc.end();
  });
}

function valorPorExtenso(valor: string): string {
  const numValue = parseFloat(valor.replace(/\./g, '').replace(',', '.'));
  if (isNaN(numValue)) return valor;
  
  const unidades = ['', 'um', 'dois', 'três', 'quatro', 'cinco', 'seis', 'sete', 'oito', 'nove'];
  const dezADezenove = ['dez', 'onze', 'doze', 'treze', 'quatorze', 'quinze', 'dezesseis', 'dezessete', 'dezoito', 'dezenove'];
  const dezenas = ['', '', 'vinte', 'trinta', 'quarenta', 'cinquenta', 'sessenta', 'setenta', 'oitenta', 'noventa'];
  const centenas = ['', 'cento', 'duzentos', 'trezentos', 'quatrocentos', 'quinhentos', 'seiscentos', 'setecentos', 'oitocentos', 'novecentos'];

  const inteiro = Math.floor(numValue);
  const centavos = Math.round((numValue - inteiro) * 100);

  if (inteiro === 0 && centavos === 0) return 'zero reais';

  const extensoNumero = (n: number): string => {
    if (n === 0) return '';
    if (n === 100) return 'cem';
    if (n < 10) return unidades[n];
    if (n < 20) return dezADezenove[n - 10];
    if (n < 100) {
      const dezena = Math.floor(n / 10);
      const unidade = n % 10;
      return dezenas[dezena] + (unidade > 0 ? ' e ' + unidades[unidade] : '');
    }
    if (n < 1000) {
      const centena = Math.floor(n / 100);
      const resto = n % 100;
      return centenas[centena] + (resto > 0 ? ' e ' + extensoNumero(resto) : '');
    }
    if (n < 1000000) {
      const milhares = Math.floor(n / 1000);
      const resto = n % 1000;
      const milStr = milhares === 1 ? 'mil' : extensoNumero(milhares) + ' mil';
      return milStr + (resto > 0 ? (resto < 100 ? ' e ' : ' ') + extensoNumero(resto) : '');
    }
    return String(n);
  };

  let resultado = '';
  
  if (inteiro > 0) {
    resultado = extensoNumero(inteiro) + (inteiro === 1 ? ' real' : ' reais');
  }

  if (centavos > 0) {
    if (inteiro > 0) resultado += ' e ';
    resultado += extensoNumero(centavos) + (centavos === 1 ? ' centavo' : ' centavos');
  }

  return resultado;
}
