import React from 'react';
import { useTheme } from '@/services/theme-context';
import { spacing } from '@/design-system/tokens/spacing';
import { cornerRadius } from '@/design-system/tokens/corner-radius';
import { typography } from '@/design-system/tokens/typography';
import { textStyles } from '@/design-system/styles/typography/typography-styles';
import { getShadow } from '@/design-system/tokens/shadows';

const TermsOfService: React.FC = () => {
  const { colors } = useTheme();

  const pageStyles: React.CSSProperties = {
    minHeight: '100vh',
    backgroundColor: colors.bg.default,
  };

  const contentWrapperStyles: React.CSSProperties = {
    width: '100%',
    maxWidth: '840px',
    margin: '0 auto',
    paddingTop: spacing.spacing[40],
    paddingBottom: spacing.spacing[80],
    paddingLeft: spacing.spacing[24],
    paddingRight: spacing.spacing[24],
    boxSizing: 'border-box',
  };

  const cardStyles: React.CSSProperties = {
    backgroundColor: colors.bg.card.default,
    border: `1px solid ${colors.border.default}`,
    borderRadius: cornerRadius.borderRadius.lg,
    boxShadow: getShadow('regular.card', colors, { withBorder: true }),
    padding: spacing.spacing[24],
  };

  const titleStyle: React.CSSProperties = {
    fontFamily: typography.fontFamily['awesome-serif'],
    fontSize: typography.desktop.size['4xl'],
    fontWeight: typography.desktop.weight.semibold,
    lineHeight: typography.desktop.lineHeight.leading7,
    letterSpacing: typography.desktop.letterSpacing.normal,
    color: colors.text.default,
    margin: 0,
  };

  const subStyle: React.CSSProperties = {
    ...textStyles.sm.medium,
    color: colors.text.subtle,
    margin: 0,
    marginTop: spacing.spacing[8],
  } as React.CSSProperties;

  const paragraph: React.CSSProperties = {
    ...textStyles.md.normal,
    color: colors.text.default,
    margin: 0,
  } as React.CSSProperties;

  const sectionTitle: React.CSSProperties = {
    ...textStyles.lg.semibold,
    color: colors.text.default,
    margin: 0,
    marginTop: spacing.spacing[24],
  } as React.CSSProperties;

  const listItem: React.CSSProperties = {
    ...textStyles.md.normal,
    color: colors.text.default,
    margin: 0,
  } as React.CSSProperties;

  return (
    <div style={pageStyles}>
      <div style={contentWrapperStyles}>
        <div style={cardStyles}>
          <h1 style={titleStyle}>Termos de Serviço – Pacelane</h1>
          <p style={subStyle}>Última atualização: 14/08/2025</p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.spacing[16], marginTop: spacing.spacing[16] }}>
            <h3 style={sectionTitle}>Informações da Empresa</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.spacing[8] }}>
              <p style={paragraph}>
                <strong>Razão Social:</strong> NOFLOP TECNOLOGIA LTDA
              </p>
              <p style={paragraph}>
                <strong>Nome de Fantasia:</strong> NOFLOP
              </p>
              <p style={paragraph}>
                <strong>CNPJ:</strong> 61.747.808/0001-21
              </p>
              <p style={paragraph}>
                <strong>Endereço:</strong> Emiliano Perneta, 822, Sala 803 Cond Workspace Brigadeiro, CEP 80420-080, Centro, Curitiba - PR
              </p>
              <p style={paragraph}>
                <strong>Telefone:</strong> (41) 98130-414
              </p>
            </div>

            <p style={paragraph}>
              Estes Termos de Serviço ("Termos") regulam o uso da plataforma Pacelane – CNPJ 61.747.808/0001-21. Ao criar uma conta ou utilizar o Pacelane, você concorda com estes Termos.
            </p>

            <h3 style={sectionTitle}>ÍNDICE</h3>
            <ul style={{ margin: 0, paddingLeft: spacing.spacing[24] }}>
              {[
                '1. Aceite dos Termos',
                '2. Regras para Utilização da Plataforma',
                '3. Cadastro',
                '4. Uso Permitido e Restrições',
                '5. Planos, Pagamentos e Cancelamento',
                '6. Propriedade Intelectual',
                '7. Privacidade',
                '8. Direitos do Usuário em Relação ao Tratamento de Dados Pessoais',
                '9. Links de Terceiros',
                '10. Isenções de Responsabilidade',
                '11. Duração ou Finalização do Acesso',
                '12. Disposições Gerais',
                '13. Legislação e Foro',
                '14. Canais de Atendimento',
              ].map((item) => (
                <li key={item} style={listItem}>{item}</li>
              ))}
            </ul>

            <h3 style={sectionTitle}>1. Aceite dos Termos</h3>
            <p style={paragraph}>1.1. Ao acessar a plataforma web ou o aplicativo web do Pacelane, você declara que leu e concorda com estes Termos. O aceite é registrado por meio de botão/checkbox na interface ou por mensagem eletrônica equivalente.</p>
            <p style={paragraph}>1.2. Você poderá revogar consentimentos específicos relacionados ao tratamento de dados pessoais conforme a Política de Privacidade. A revogação poderá limitar, suspender ou impedir o uso de funcionalidades que dependem desse tratamento.</p>

            <h3 style={sectionTitle}>2. Regras para Utilização da Plataforma</h3>
            <p style={paragraph}>2.1. Ao aceitar estes Termos, você declara:</p>
            <ul style={{ margin: 0, paddingLeft: spacing.spacing[24] }}>
              {[
                '2.1.1. Ser responsável por quaisquer consequências relacionadas ao uso da Plataforma, respondendo inclusive perante terceiros por quaisquer reivindicações decorrentes do seu uso.',
                '2.1.2. Não utilizar a Plataforma para fins ilícitos ou contrários à legislação aplicável.',
                '2.1.3. Não inserir conteúdo ou executar ações que comprometam a segurança, disponibilidade ou integridade técnica da Plataforma.',
                '2.1.4. Estar ciente de que informações, funcionalidades e ofertas disponíveis na Plataforma podem ser atualizadas a qualquer tempo.',
                '2.1.5. Que o acesso poderá ser suspenso ou bloqueado em caso de suspeita de fraude, violação dos Termos ou riscos à segurança.',
                '2.1.6. Notificar imediatamente o Pacelane sobre uso não autorizado da conta, perda de credenciais ou suspeita de acesso por terceiros.',
                '2.1.7. Compreender os riscos de acessar a Plataforma via redes públicas e desprotegidas, sendo sua a responsabilidade por danos decorrentes desse uso.',
              ].map((item) => (
                <li key={item} style={listItem}>{item}</li>
              ))}
            </ul>

            <h3 style={sectionTitle}>3. Cadastro</h3>
            <ul style={{ margin: 0, paddingLeft: spacing.spacing[24] }}>
              {[
                '3.1. O registro pode ser realizado fornecendo nome, e-mail, telefone e senha, ou via OAuth (Google).',
                '3.2. Você é responsável pela veracidade e atualização dos dados informados. O Pacelane poderá solicitar dados adicionais para verificação de segurança e proteção contra fraude.',
                '3.3. Você é responsável por manter a confidencialidade das credenciais. O uso da conta é pessoal e intransferível.',
                '3.4. Contas podem ser suspensas ou encerradas em caso de exploração de brechas de segurança, propagação de discurso de ódio ou conteúdo nocivo, ou violação destes Termos.',
                '3.5. A exclusão da conta gratuita pode ser solicitada a qualquer momento via interface da Plataforma.',
              ].map((item) => (
                <li key={item} style={listItem}>{item}</li>
              ))}
            </ul>

            <h3 style={sectionTitle}>4. Uso Permitido e Restrições</h3>
            <ul style={{ margin: 0, paddingLeft: spacing.spacing[24] }}>
              {[
                '4.1. Atividades proibidas incluem, sem limitação: 4.1.1. Upload de conteúdo ilegal, ofensivo, difamatório, discriminatório, violento ou que viole direitos de terceiros; 4.1.2. Engenharia reversa, descompilação, tentativa de obtenção do código-fonte ou exploração de vulnerabilidades; 4.1.3. Spam, phishing, scraping automatizado agressivo ou sobrecarga intencional de infraestrutura; 4.1.4. Uso que viole leis aplicáveis ou estes Termos.',
                '4.2. Responsabilidades do Usuário: garantir que possui direitos sobre o conteúdo enviado; não violar direitos de terceiros; manter dados atualizados; usar a Plataforma dentro das funcionalidades disponibilizadas; cumprir normas de propriedade intelectual e privacidade.',
                '4.3. Responsabilidades do Pacelane: prover a Plataforma em regime de melhor esforço; proteger informações nos termos da Política de Privacidade; oferecer suporte pelos canais oficiais; suspender/limitar acesso em caso de violação destes Termos ou riscos à segurança.',
              ].map((item) => (
                <li key={item} style={listItem}>{item}</li>
              ))}
            </ul>

            <h3 style={sectionTitle}>5. Planos, Pagamentos e Cancelamento</h3>
            <ul style={{ margin: 0, paddingLeft: spacing.spacing[24] }}>
              {[
                '5.1. O Pacelane oferece período de teste gratuito de 14 (quatorze) dias e plano pago mensal de R$149,00.',
                '5.2. Cobranças são recorrentes e processadas via Stripe. Ao contratar o plano pago, você autoriza a cobrança automática no cartão cadastrado até cancelamento.',
                '5.3. O cancelamento pode ser solicitado a qualquer momento e produzirá efeitos no ciclo de cobrança subsequente. Salvo previsão legal, não há reembolso proporcional de períodos já pagos.',
              ].map((item) => (
                <li key={item} style={listItem}>{item}</li>
              ))}
            </ul>

            <h3 style={sectionTitle}>6. Propriedade Intelectual</h3>
            <ul style={{ margin: 0, paddingLeft: spacing.spacing[24] }}>
              {[
                '6.1. O Pacelane, seus logotipos, marcas, interfaces, layout, funcionalidades e código-fonte são de titularidade do Pacelane ou de seus licenciantes.',
                '6.2. O conteúdo enviado pelo usuário permanece de sua titularidade. Você concede ao Pacelane licença não exclusiva, mundial e isenta de royalties para armazenar, processar e exibir esse conteúdo apenas para execução e melhoria do serviço.',
              ].map((item) => (
                <li key={item} style={listItem}>{item}</li>
              ))}
            </ul>

            <h3 style={sectionTitle}>7. Privacidade</h3>
            <ul style={{ margin: 0, paddingLeft: spacing.spacing[24] }}>
              {[
                '7.1. O tratamento de dados pessoais segue a Política de Privacidade disponível em https://www.pacelane.com e pelo e-mail privacidade@pacelane.com.',
                '7.2. Os dados coletados são utilizados exclusivamente para execução e aprimoramento do serviço e não são compartilhados com outros usuários.',
              ].map((item) => (
                <li key={item} style={listItem}>{item}</li>
              ))}
            </ul>

            <h3 style={sectionTitle}>8. Direitos do Usuário em Relação ao Tratamento de Dados Pessoais</h3>
            <p style={paragraph}>8.1. Você pode solicitar confirmação de tratamento, acesso, correção, portabilidade, anonimização, bloqueio ou eliminação de dados, bem como a revogação de consentimento, nos termos da legislação aplicável. Consulte a Política de Privacidade para instruções.</p>

            <h3 style={sectionTitle}>9. Links de Terceiros</h3>
            <p style={paragraph}>9.1. A Plataforma pode conter links para sites de terceiros (ex.: Google, Meta, Stripe). O Pacelane não endossa nem se responsabiliza por conteúdos, políticas ou práticas de terceiros. Leia os termos e políticas desses serviços.</p>

            <h3 style={sectionTitle}>10. Isenções de Responsabilidade</h3>
            <ul style={{ margin: 0, paddingLeft: spacing.spacing[24] }}>
              {[
                '10.1. O Pacelane não será responsável por: 10.1.1. Indisponibilidades, erros ou falhas decorrentes de serviços de terceiros; 10.1.2. Erros na transmissão de dados e problemas de conexão à internet; 10.1.3. Informações imprecisas, desatualizadas ou inverídicas fornecidas pelo usuário; 10.1.4. Danos decorrentes de uso em desacordo com estes Termos; 10.1.5. Consequências de conteúdos que o usuário publica em redes sociais e plataformas externas; 10.1.6. Presença de vírus ou elementos nocivos alheios ao controle razoável do Pacelane.',
              ].map((item) => (
                <li key={item} style={listItem}>{item}</li>
              ))}
            </ul>

            <h3 style={sectionTitle}>11. Duração ou Finalização do Acesso</h3>
            <ul style={{ margin: 0, paddingLeft: spacing.spacing[24] }}>
              {[
                '11.1. Estes Termos vigoram por prazo indeterminado enquanto houver uso da Plataforma.',
                '11.2. O Pacelane pode suspender ou encerrar o acesso em caso de violação destes Termos, riscos à segurança, ordem judicial ou por descontinuação do serviço, com comunicação prévia quando cabível.',
              ].map((item) => (
                <li key={item} style={listItem}>{item}</li>
              ))}
            </ul>

            <h3 style={sectionTitle}>12. Disposições Gerais</h3>
            <ul style={{ margin: 0, paddingLeft: spacing.spacing[24] }}>
              {[
                '12.1. Comunicações serão consideradas válidas quando enviadas aos contatos informados pelo usuário ou aos canais oficiais do Pacelane.',
                '12.2. Nulidade parcial: a invalidade de alguma cláusula não prejudica as demais.',
                '12.3. Tolerância: a ausência de exercício de qualquer direito não implica renúncia.',
              ].map((item) => (
                <li key={item} style={listItem}>{item}</li>
              ))}
            </ul>

            <h3 style={sectionTitle}>13. Legislação e Foro</h3>
            <ul style={{ margin: 0, paddingLeft: spacing.spacing[24] }}>
              {[
                '13.1. A legislação aplicável observará a localidade do usuário, incluindo LGPD (Brasil), CCPA/CPRA (EUA) e demais normas locais, quando pertinentes.',
                '13.2. Fica eleito o foro da Comarca de Curitiba, Paraná, Brasil, para dirimir controvérsias, sem prejuízo de normas de proteção ao consumidor que determinem competência diversa.',
              ].map((item) => (
                <li key={item} style={listItem}>{item}</li>
              ))}
            </ul>

            <h3 style={sectionTitle}>14. Canais de Atendimento</h3>
            <ul style={{ margin: 0, paddingLeft: spacing.spacing[24] }}>
              {[
                '14.1. Suporte geral: suporte@pacelane.ai',
                '14.2. Privacidade e LGPD/GDPR: privacidade@pacelane.ai',
                '14.3. Site: https://www.pacelane.ai',
              ].map((item) => (
                <li key={item} style={listItem}>{item}</li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TermsOfService;


