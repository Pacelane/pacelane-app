import React from 'react';
import { useTheme } from '@/services/theme-context';
import { spacing } from '@/design-system/tokens/spacing';
import { cornerRadius } from '@/design-system/tokens/corner-radius';
import { typography } from '@/design-system/tokens/typography';
import { textStyles } from '@/design-system/styles/typography/typography-styles';
import { getShadow } from '@/design-system/tokens/shadows';

const PrivacyPolicy: React.FC = () => {
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
          <h1 style={titleStyle}>Política de Privacidade de www.pacelane.ai</h1>
          <p style={subStyle}>14/08/2025</p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.spacing[16], marginTop: spacing.spacing[16] }}>
            <p style={paragraph}>Pacelane</p>
            <p style={paragraph}>privacidade@pacelane.ai</p>

            <h3 style={sectionTitle}>Índice</h3>
            <ul style={{ margin: 0, paddingLeft: spacing.spacing[24] }}>
              {[
                'Introdução',
                'Informações de contato',
                'Tipos de dados coletados',
                'Modo e local de processamento dos dados pessoais',
                'Compartilhamento, Transferência e Divulgação de Dados Pessoais',
                'Informações detalhadas sobre o processamento de dados pessoais',
                'Informações adicionais',
                'Seus direitos com base no Regulamento Geral de Proteção de Dados (GDPR)',
                'Informações adicionais caso você resida na Suíça',
                'Informações adicionais caso você resida no Brasil',
                'Informações adicionais caso você resida na Califórnia',
                'Informações adicionais caso você resida na Virgínia',
                'Informações adicionais caso você resida no Colorado',
                'Informações adicionais caso você resida em Connecticut',
                'Informações adicionais caso você resida em Utah',
                'Informações adicionais sobre coleta e processamento de dados',
                'Definições e referências jurídicas',
              ].map((item) => (
                <li key={item} style={listItem}>{item}</li>
              ))}
            </ul>

            <h3 style={sectionTitle}>Introdução</h3>
            <p style={paragraph}>O Pacelane é uma plataforma SaaS disponível via site e aplicativo web.</p>
            <p style={paragraph}>Sobre o que é essa política?</p>
            <p style={paragraph}>Este documento explica como o site coleta, usa e protege seus dados pessoais para alcançar os objetivos descritos neste documento.</p>
            <p style={paragraph}>O que são dados pessoais?</p>
            <p style={paragraph}>Dados pessoais referem-se a informações que podem ser usadas para identificar você de forma direta ou indireta. Isso inclui informações como nome, sobrenome, endereço de e-mail, tecnologias de rastreamento (como cookies ou pixels de rastreamento), atividade do usuário e informações do dispositivo. Você pode encontrar informações detalhadas sobre cada tipo de dado pessoal coletado em seções específicas desta política de privacidade ou por textos explicativos específicos exibidos antes da coleta de dados.</p>
            <p style={paragraph}>Este documento foi gerado com o uso do modelo de política de privacidade.</p>

            <h3 style={sectionTitle}>Informações de contato</h3>
            <p style={paragraph}>Emiliano Perneta, 822 - Centro - Curitiba - PR</p>
            <p style={paragraph}>Sala 803 & 804</p>
            <p style={paragraph}>privacidade@pacelane.com</p>
            <p style={paragraph}>(11) 5236-0591</p>

            <h3 style={sectionTitle}>Tipos de dados coletados</h3>
            <p style={paragraph}>Os tipos de dados pessoais que este site coleta, por si mesmo ou através de terceiros, podem incluir:</p>
            <ul style={{ margin: 0, paddingLeft: spacing.spacing[24] }}>
              {[
                'nome;',
                'sobrenome;',
                'endereço de e-mail;',
                'rastreadores;',
                'dados de uso',
                'dados de navegação',
                'Arquivos enviados proativamente pelo usuário',
              ].map((item) => (
                <li key={item} style={listItem}>{item}</li>
              ))}
            </ul>

            <p style={paragraph}>Detalhes completos sobre cada tipo de dados pessoais coletados são fornecidos nas seções dedicadas desta política de privacidade ou por textos explicativos específicos exibidos antes da coleta de dados. Os dados pessoais poderão ser fornecidos livremente por você ou, no caso de dados de Uso, coletados automaticamente ao se utilizar este site. A menos que especificado diferentemente, todos os dados solicitados por este site são obrigatórios e a falta de fornecimento destes dados poderá impossibilitar este site de fornecer os seus serviços.</p>
            <p style={paragraph}>Nos casos em que este site afirmar especificamente que alguns dados não são obrigatórios, você tem a liberdade de deixar de comunicar estes dados sem nenhuma consequência para a disponibilidade ou o funcionamento do serviço.</p>
            <p style={paragraph}>Quaisquer usos de cookies - ou de outras ferramentas de rastreamento - por este site, ou pelos proprietários de serviços de terceiros usados por este site, tem a finalidade de fornecer o serviço solicitado por você, além das demais finalidades descritas no presente documento.</p>
            <p style={paragraph}>Você é responsável por quaisquer dados pessoais de terceiros que forem obtidos, publicados ou compartilhados através deste site.</p>

            <h3 style={sectionTitle}>Modo e local de processamento dos dados pessoais</h3>
            <p style={paragraph}><strong>Método de processamento</strong></p>
            <p style={paragraph}>Tomamos medidas de segurança adequadas para impedir o acesso não autorizado, a divulgação, a modificação ou a destruição não autorizada dos dados. O processamento dos dados é realizado utilizando computadores e/ou ferramentas de TI habilitadas, seguindo procedimentos organizacionais e meios estritamente relacionados com os fins indicados.</p>
            <p style={paragraph}>Além de nós, em alguns casos, os dados podem estar acessíveis a determinados tipos de pessoas responsáveis, envolvidas com a operação deste site (por exemplo, equipe administrativa, equipe de vendas, equipe de marketing, equipe jurídica).</p>
            <p style={paragraph}>Se necessário, os dados também poderão ser acessados por partes externas designadas por nós como processadores de dados. A lista atualizada dessas partes pode ser solicitada a qualquer momento, bastando entrar em contato conosco por meio das informações de contato fornecidas neste documento.</p>

            <p style={paragraph}><strong>Lugar</strong></p>
            <p style={paragraph}>Os dados são processados em nossas sedes de operação e em quaisquer outros lugares onde as partes envolvidas no processamento estejam localizadas. Dependendo da sua localização, as transferências de dados poderão envolver o envio de suas informações para outro país que não seja o seu. Para saber mais sobre o local de processamento de tais dados transferidos, consulte a seção que contém detalhes sobre o processamento de dados pessoais.</p>

            <p style={paragraph}><strong>Período de conservação</strong></p>
            <p style={paragraph}>Salvo especificação em contrário neste documento, os dados pessoais serão tratados e armazenados pelo tempo necessário para as finalidades para as quais foram coletados, e poderão ser retidos por mais tempo em razão de qualquer obrigação legal aplicável ou com base no seu consentimento.</p>

            <h3 style={sectionTitle}>Compartilhamento, Transferência e Divulgação de Dados Pessoais</h3>
            <p style={paragraph}>O Pacelane pode compartilhar ou transferir dados pessoais de usuários com terceiros apenas quando necessário para prestar os serviços oferecidos, cumprir obrigações legais ou melhorar a experiência do usuário. Esses terceiros atuam como processadores ou controladores de dados independentes, conforme o caso.</p>
            <p style={paragraph}>Em particular, o Pacelane compartilha dados com as seguintes categorias de destinatários:</p>
            <ul style={{ margin: 0, paddingLeft: spacing.spacing[24] }}>
              {[
                'Google LLC (incluindo Google Ads, Google Tag Manager e Google Analytics): para medição de desempenho, personalização de anúncios e gerenciamento de tags. Para mais informações sobre como o Google utiliza dados de parceiros, consulte: https://policies.google.com/technologies/partner-sites.',
                'Meta Platforms, Inc. (Facebook e Instagram): para mensuração e otimização de campanhas de marketing digital.',
                'PostHog Inc.: para análise de uso e comportamento dentro da aplicação.',
                'Stripe, Inc.: para processamento de pagamentos e prevenção de fraudes.',
                'Outros prestadores de serviços técnicos e operacionais, como provedores de hospedagem, armazenamento de dados e suporte técnico, sempre sob obrigações contratuais de confidencialidade e segurança.',
              ].map((item) => (
                <li key={item} style={listItem}>{item}</li>
              ))}
            </ul>
            <p style={paragraph}>Em todos os casos, o compartilhamento de dados pessoais é realizado em conformidade com as legislações aplicáveis de proteção de dados (incluindo GDPR e LGPD), garantindo que apenas as informações estritamente necessárias sejam transmitidas, de forma segura e com base em uma das bases legais previstas.</p>

            <h3 style={sectionTitle}>Informações detalhadas sobre o processamento de dados pessoais</h3>
            <p style={paragraph}>Seus dados pessoais são coletados para permitir que prestemos nosso serviço, cumpramos nossas obrigações legais, respondamos a solicitações de execução, protejamos os nossos direitos e interesses (ou os seus ou os de terceiros), detectemos qualquer atividade maliciosa ou fraudulenta, bem como as finalidades estabelecidas abaixo:</p>

            <p style={paragraph}><strong>Estatísticas</strong></p>
            <p style={paragraph}>Os serviços contidos nesta seção nos permitem monitorar e analisar o tráfego da web e podem ser usados para rastrear o seu comportamento.</p>

            <p style={paragraph}><strong>Google Analytics (Universal Analytics) (Google LLC)</strong></p>
            <p style={paragraph}>O Google Analytics (Universal Analytics) é um serviço de análise da Internet fornecido pelo Google LLC ("Google"). O Google utiliza os dados coletados para acompanhar e examinar o uso deste site, para preparar relatórios sobre suas atividades e compartilhá-los com outros serviços do Google. O Google pode usar os dados coletados para contextualizar e personalizar os anúncios de sua própria rede de publicidade.</p>
            <p style={paragraph}>Para entender como o Google usa os dados, consulte a partner policy e a Business data page.</p>
            <p style={paragraph}>Dados pessoais processados: Rastreadores; Dados de uso</p>
            <p style={paragraph}>Lugar de processamento: EUA</p>
            <p style={paragraph}>Política de privacidade: https://business.safety.google/privacy/</p>
            <p style={paragraph}>Link para desativação: https://tools.google.com/dlpage/gaoptout</p>
            <p style={paragraph}>Categoria de informações pessoais coletadas de acordo com a CCPA: informações sobre atividades na Internet ou em outras redes eletrônicas. Esse processamento constitui uma venda de acordo com a CCPA, a VCDPA, a CPA, a CTDPA e a UCPA</p>

            <p style={paragraph}><strong>PostHog (PostHog Inc.)</strong></p>
            <p style={paragraph}>PostHog é uma plataforma de análise de produto que coleta e processa dados de navegação e interação do usuário para fins de métricas, otimização de funcionalidades e melhorias de experiência na aplicação.</p>
            <p style={paragraph}>Dados pessoais processados: Rastreadores; Dados de uso; Eventos de interação</p>
            <p style={paragraph}>Lugar de tratamento: EUA</p>
            <p style={paragraph}>Política de privacidade: https://posthog.com/privacy</p>
            <p style={paragraph}>Categoria de Informações Pessoais coletadas de acordo com a CCPA: informações sobre atividades na Internet ou em outras redes eletrônicas.</p>

            <p style={paragraph}><strong>Meta Pixel (Meta Platforms, Inc.)</strong></p>
            <p style={paragraph}>Meta Pixel é um serviço de análise e rastreamento fornecido pela Meta Platforms, Inc., que conecta a atividade do Pacelane com a rede de publicidade da Meta (Facebook, Instagram), permitindo mensuração de campanhas e criação de públicos.</p>
            <p style={paragraph}>Dados pessoais processados: Rastreadores; Dados de uso; Dados comportamentais</p>
            <p style={paragraph}>Lugar de tratamento: EUA</p>
            <p style={paragraph}>Política de privacidade: https://www.facebook.com/privacy/policy</p>
            <p style={paragraph}>Categoria de Informações Pessoais coletadas de acordo com a CCPA: informações sobre atividades na Internet ou em outras redes eletrônicas.</p>

            <p style={paragraph}><strong>Google Tag Manager (Google LLC)</strong></p>
            <p style={paragraph}>Google Tag Manager é um serviço de gerenciamento de tags fornecido pelo Google LLC, que permite a integração e execução de scripts de rastreamento e monitoramento no Pacelane.</p>
            <p style={paragraph}>Para entender como o Google usa os dados, consulte a partner policy e a Business data page.</p>
            <p style={paragraph}>Dados pessoais processados: Rastreadores; Dados de uso</p>
            <p style={paragraph}>Lugar de tratamento: EUA</p>
            <p style={paragraph}>Política de privacidade: https://business.safety.google/privacy/</p>
            <p style={paragraph}>Categoria de Informações Pessoais coletadas de acordo com a CCPA: informações sobre atividades na Internet ou em outras redes eletrônicas.</p>

            <p style={paragraph}><strong>Google Ads (Google LLC)</strong></p>
            <p style={paragraph}>Google Ads é um serviço de publicidade fornecido pelo Google LLC que permite exibir anúncios personalizados para usuários com base em seu comportamento e dados de navegação.</p>
            <p style={paragraph}>Para entender como o Google usa os dados, consulte a partner policy e a Business data page.</p>
            <p style={paragraph}>Dados pessoais processados: Rastreadores; Dados de uso; Dados comportamentais</p>
            <p style={paragraph}>Lugar de tratamento: EUA</p>
            <p style={paragraph}>Política de privacidade: https://business.safety.google/privacy/</p>
            <p style={paragraph}>Categoria de Informações Pessoais coletadas de acordo com a CCPA: informações sobre atividades na Internet ou em outras redes eletrônicas.</p>

            <p style={paragraph}><strong>Stripe (Stripe, Inc.)</strong></p>
            <p style={paragraph}>Stripe é um serviço de processamento de pagamentos fornecido pela Stripe, Inc., que coleta e processa dados de pagamento necessários para realizar transações na plataforma.</p>
            <p style={paragraph}>Dados pessoais processados: Dados de pagamento; Identificadores; Dados de uso</p>
            <p style={paragraph}>Lugar de tratamento: EUA</p>
            <p style={paragraph}>Política de privacidade: https://stripe.com/privacy</p>
            <p style={paragraph}>Categoria de Informações Pessoais coletadas de acordo com a CCPA: identificadores; informações comerciais relacionadas a transações.</p>

            <p style={paragraph}><strong>Visualizar conteúdo de plataformas externas</strong></p>
            <p style={paragraph}>Estes tipos de serviços permitem que você visualize o conteúdo hospedado em plataformas externas diretamente a partir das páginas deste site e interaja com eles. Esses serviços costumam ser chamados de widgets, que são pequenos elementos inseridos em um site ou aplicativo. Eles fornecem informações específicas ou executam uma determinada função e, muitas vezes, permitem a interação do usuário. Esse tipo de serviço poderá ainda coletar dados de tráfego da web para as páginas onde o serviço estiver instalado, mesmo quando você não os estiver utilizando.</p>

            <h3 style={sectionTitle}>Como entrar em contato com você</h3>
            <p style={paragraph}><strong>Formulário de contato (este site)</strong></p>
            <p style={paragraph}>Ao preencher o formulário de contato com seus dados, você autoriza este site a usar tais informações para responder aos pedidos de informações, cotação ou qualquer outro tipo de pedido como indicado pelo título do formulário.</p>
            <p style={paragraph}>Dados pessoais processados: endereço de e-mail; nome; sobrenome</p>
            <p style={paragraph}>Categoria de informações pessoais coletadas de acordo com a CCPA: identificadores. Esse processamento constitui: uma venda de acordo com a CCPA, a VCDPA, a CPA, a CTDPA e a UCPA</p>

            <h3 style={sectionTitle}>Informações adicionais</h3>
            <p style={paragraph}><strong>Base jurídica para o processamento</strong></p>
            <p style={paragraph}>Podemos processar dados pessoais relacionados a você se você tiver dado seu consentimento ou para uma ou mais finalidades específicas:</p>
            <ul style={{ margin: 0, paddingLeft: spacing.spacing[24] }}>
              {[
                'o fornecimento de dados é necessário para o cumprimento de um contrato firmado com você e/ou para quaisquer obrigações pré-contratuais;',
                'o processamento é necessário para o cumprimento de uma obrigação jurídica à qual estamos sujeitos;',
                'o processamento está relacionado a uma tarefa que é executada no interesse público ou no exercício de autoridade oficial na qual estamos investidos;',
                'o processamento é necessário para a finalidade de interesses legítimos perseguidos por nós ou por terceiros.',
              ].map((item) => (
                <li key={item} style={listItem}>{item}</li>
              ))}
            </ul>
            <p style={paragraph}>Em qualquer caso, teremos prazer em ajudar a esclarecer a base jurídica específica que se aplica ao processamento e se o fornecimento de dados pessoais é um requisito legal ou contratual, ou um requisito necessário para celebrar um contrato.</p>

            <p style={paragraph}><strong>Entenda por quanto tempo retemos suas informações</strong></p>
            <p style={paragraph}>Quando coletamos suas informações pessoais, as mantemos pelo tempo necessário para as finalidades para as quais foram coletadas. Por vezes, talvez seja necessário reter suas informações pessoais por mais tempo em virtude de uma obrigação legal ou conforme seu consentimento.</p>
            <p style={paragraph}>Veja mais detalhadamente o que isso significa. Reteremos suas informações pessoais com base nas finalidades e nos motivos definidos abaixo:</p>
            <ul style={{ margin: 0, paddingLeft: spacing.spacing[24] }}>
              {[
                'para fins contratuais: se tivermos celebrado um contrato com você, reteremos suas informações até que o contrato seja totalmente cumprido.',
                'para nossos interesses legítimos: se estivermos usando suas informações pessoais para finalidades que sejam necessárias e relevantes para nossas operações comerciais, nós as reteremos enquanto precisarmos delas para tais finalidades. Saiba mais sobre essas finalidades nas seções relevantes deste documento ou entre em contato conosco.',
                'com o seu consentimento: podemos ter permissão para reter os dados pessoais por um período maior, sempre que você tiver dado consentimento para tal processamento, a menos que você retire seu consentimento.',
                'obrigações legais: podemos ser obrigados a reter os dados pessoais por um período maior, sempre que necessário para o cumprimento de uma obrigação jurídica ou do mandado de uma autoridade.',
              ].map((item) => (
                <li key={item} style={listItem}>{item}</li>
              ))}
            </ul>
            <p style={paragraph}>Assim que o prazo de conservação vencer, os dados pessoais serão apagados. Desta forma, o direito de acessar, o direito de apagar, o direito de corrigir e o direito à portabilidade dos dados não poderão ter o seu cumprimento exigido após o vencimento do prazo de conservação.</p>

            <h3 style={sectionTitle}>Informações sobre este documento</h3>
            <p style={paragraph}>Este documento foi gerado com o uso do modelo de política de privacidade.</p>

            <h3 style={sectionTitle}>Seus direitos com base no Regulamento Geral de Proteção de Dados (GDPR)</h3>
            <p style={paragraph}>Você pode exercer determinados direitos em relação aos seus dados processados por nós. Em especial, você tem o direito de fazer o seguinte, dentro dos limites permitidos por lei:</p>
            <ul style={{ margin: 0, paddingLeft: spacing.spacing[24] }}>
              {[
                'Retirar seu consentimento a qualquer momento. Você tem o direito de retirar seu consentimento caso já o tenha dado anteriormente para o processamento dos seus dados pessoais.',
                'Objetar o processamento dos seus dados. Você tem o direito de objetar o processamento dos seus dados se o processamento for executado sobre outra base jurídica que não o consentimento.',
                'Se os seus dados pessoais forem processados por interesse público, por uma autoridade oficial ou por nossos interesses comerciais legítimos, você poderá se opor a esse processamento fornecendo um motivo relacionado à sua situação específica.',
                'No entanto, se seus dados pessoais estiverem sendo processados para finalidades de marketing direto, você poderá se opor a qualquer momento, gratuitamente e sem qualquer justificativa. Se você fizer isso, deixaremos de usar seus dados pessoais para marketing. Para saber se estamos usando seus dados para marketing direto, consulte as seções relevantes deste documento.',
                'Acessar os seus dados. Você tem o direito de saber se os dados estão sendo tratados por nós, de obter informações sobre determinados aspectos do tratamento e de obter uma cópia dos dados que estão sendo tratados.',
                'Verificar e pedir retificação. Você tem o direito de verificar a exatidão dos seus dados e pedir que eles sejam atualizados ou corrigidos.',
                'Restringir o processamento de seus dados. Você tem o direito de restringir o processamento de seus dados. Nesse caso, não processaremos seus dados para nenhuma outra finalidade que não seja o de armazená-los.',
                'Ter os seus dados pessoais apagados ou retirados de outra maneira. Você tem o direito de obter de nós o apagamento de seus dados.',
                'Receber os seus dados e ter os mesmos transferidos para outro controlador. Os Usuários têm o direito de receber seus dados em um formato estruturado, utilizado comumente e apto a ser lido por máquinas e, se for viável tecnicamente, fazer com que estes sejam transmitidos para outro controlador sem nenhum empecilho.',
                'Registrar uma reclamação. Os usuários têm o direito de apresentar reclamação perante a sua autoridade de proteção de dados competente.',
                'Saiba mais sobre o motivo das transferências de dados. Você também tem o direito de ser informado sobre a base jurídica das transferências de dados para o exterior, incluindo quaisquer organizações internacionais regidas pelo direito internacional público ou formadas por dois ou mais países, como a ONU.',
                'Conhecer as medidas de segurança. Você tem o direito de saber sobre as medidas de segurança que tomamos para proteger seus dados.',
              ].map((item) => (
                <li key={item} style={listItem}>{item}</li>
              ))}
            </ul>

            <p style={paragraph}><strong>Como exercer esses direitos</strong></p>
            <p style={paragraph}>Quaisquer solicitações para exercer seus direitos podem ser encaminhadas a nós. Nossas informações de contato completos podem ser encontradas no início deste documento.</p>
            <p style={paragraph}>Tais pedidos são gratuitos e serão atendidos por nós com a maior brevidade possível, fornecendo a você as informações exigidas por lei.</p>
            <p style={paragraph}>Qualquer retificação ou exclusão de dados pessoais ou restrição de processamento será comunicada por nós a cada destinatário, se houver, a quem os dados pessoais tenham sido divulgados, a menos que isso seja impossível ou implique um trabalho desproporcional. A seu pedido, informaremos você sobre tais destinatários.</p>

            <h3 style={sectionTitle}>Informações adicionais caso você resida na Suíça</h3>
            <p style={paragraph}>Esta seção se aplica caso resida na Suíça, e substitui qualquer outra informação possivelmente divergente ou conflitante contida na política de privacidade.</p>
            <p style={paragraph}>Mais detalhes sobre as categorias de dados processados, as finalidades do processamento, as categorias de destinatários dos dados pessoais, se houver, o período de retenção e outras informações sobre dados pessoais podem ser encontrados na seção intitulada "Informações detalhadas sobre o processamento de dados pessoais" deste documento.</p>

            <h3 style={sectionTitle}>Seus direitos de acordo com a Lei Federal Suíça sobre Proteção de Dados</h3>
            <p style={paragraph}>Você pode exercer certos direitos em relação aos seus dados dentro dos limites da lei, incluindo os seguintes:</p>
            <ul style={{ margin: 0, paddingLeft: spacing.spacing[24] }}>
              {[
                'direito de acesso aos dados pessoais;',
                'direito de se opor ao processamento de seus dados pessoais (o que também permite que você exija que o processamento de dados pessoais seja restrito, que os dados pessoais sejam excluídos ou destruídos e que divulgações específicas de dados pessoais a terceiros sejam proibidas);',
                'direito de receber seus dados pessoais e transferi-los para outro controlador (portabilidade de dados);',
                'direito de solicitar a correção de dados pessoais incorretos.',
              ].map((item) => (
                <li key={item} style={listItem}>{item}</li>
              ))}
            </ul>

            <p style={paragraph}><strong>Como exercer esses direitos</strong></p>
            <p style={paragraph}>Quaisquer solicitações para exercer seus direitos podem ser encaminhadas a nós por meio dos detalhes de contato fornecidos no início deste documento. Tais solicitações são gratuitas e serão respondidas por nós com a maior brevidade possível, fornecendo a você as informações exigidas por lei.</p>

            <h3 style={sectionTitle}>Informações adicionais caso você resida no Brasil</h3>
            <p style={paragraph}>Esta seção do documento se integra e complementa as informações contidas no resto desta política de privacidade e é fornecida pela entidade que opera este site e, conforme for o caso, suas controladoras, subsidiárias e afiliadas (para fins desta seção, doravante coletivamente denominadas "nós", "nos", "nosso" e "conosco").</p>
            <p style={paragraph}>Esta seção se aplica a todos os Usuários do Brasil (os Usuários são denominados abaixo simplesmente como "você", "seu", "seu"), de acordo com a "Lei Geral de Proteção de Dados" (a "LGPD"), e, para esses Usuários, substitui qualquer outra informação possivelmente divergente ou conflitante contida na política de privacidade. Esta parte do documento usa o termo "informações pessoais", conforme definido na LGPD.</p>

            <p style={paragraph}><strong>Em que nos embasamos para processar suas informações pessoais</strong></p>
            <p style={paragraph}>Podemos processar suas informações pessoais somente se tivermos uma base legal para tal processamento. As bases legais são as seguintes:</p>
            <ul style={{ margin: 0, paddingLeft: spacing.spacing[24] }}>
              {[
                'sua anuência com as respectivas atividades de processamento;',
                'conformidade com uma obrigação legal ou regulamentar imposta a nós;',
                'o cumprimento de políticas públicas dispostas em leis ou regulamentações ou com base em contratos, acordos e instrumentos legais semelhantes;',
                'estudos conduzidos por entidades de pesquisa, preferivelmente realizados sobre informações pessoais anônimas;',
                'a execução de um contrato e seus procedimentos preliminares, nos casos em que você for parte do contrato;',
                'o exercício de nossos direitos em processos judiciais, administrativos ou de arbitragem;',
                'proteção ou segurança física de você ou de um terceiro;',
                'a proteção da saúde – em procedimentos realizados por entidades ou profissionais da saúde;',
                'nossos interesses legítimos, desde que seus direitos e liberdades fundamentais não prevaleçam sobre tais interesses; e',
                'proteção ao crédito.',
              ].map((item) => (
                <li key={item} style={listItem}>{item}</li>
              ))}
            </ul>

            <p style={paragraph}><strong>Seus direitos de privacidade como brasileiro</strong></p>
            <p style={paragraph}>Você tem o direito de:</p>
            <ul style={{ margin: 0, paddingLeft: spacing.spacing[24] }}>
              {[
                'obter confirmação sobre a existência de atividades de tratamento de suas informações pessoais;',
                'acesso a suas informações pessoais;',
                'fazer com que suas informações pessoais incompletas, inexatas ou desatualizadas sejam corrigidas;',
                'obter o anonimato, bloqueio ou eliminação de suas informações pessoais desnecessárias ou em excesso, ou de informações que não estejam sendo processadas de acordo com a LGPD;',
                'obter informações sobre a possibilidade de fornecer ou recusar sua anuência e as respectivas consequências;',
                'obter informações sobre os terceiros com quem compartilhamos suas informações pessoais;',
                'obter, mediante sua solicitação expressa, a portabilidade de suas informações pessoais (exceto informações anônimas) para outro fornecedor de produtos ou serviços, desde que nossos segredos comerciais e industriais continuem protegidos;',
                'obter a exclusão de suas informações pessoais tratadas, se o tratamento teve base em sua anuência, a menos que se apliquem uma ou mais exceções daquelas dispostas no art. 16 da LGPD;',
                'retirar sua anuência a qualquer momento;',
                'registrar uma reclamação com relação a suas informações pessoais à ANPD (Autoridade Nacional de Proteção de Dados) ou aos órgãos de proteção ao consumidor;',
                'opor-se a uma atividade de tratamento nos casos em que o tratamento não for realizado em conformidade com as disposições da lei;',
                'solicitar informações claras e adequadas a respeito dos critérios e procedimentos usados para uma decisão automatizada; e',
                'solicitar a revisão de decisões tomadas exclusivamente com base no tratamento automatizado de suas informações pessoais, que afetem seus interesses. Nisto estão incluídas decisões para definir seu perfil pessoal, profissional, de consumidor e de crédito ou aspectos de sua personalidade.',
              ].map((item) => (
                <li key={item} style={listItem}>{item}</li>
              ))}
            </ul>
            <p style={paragraph}>Você nunca será discriminado ou sofrerá qualquer tipo de prejuízo se exercer seus direitos.</p>

            <p style={paragraph}><strong>Como registrar sua solicitação</strong></p>
            <p style={paragraph}>Você poderá registrar sua solicitação expressa de exercer seus direitos gratuitamente, em qualquer momento, usando os dados de contato fornecidos neste documento ou através de seu representante legal.</p>

            <p style={paragraph}><strong>Como e quando nós responderemos a sua solicitação</strong></p>
            <p style={paragraph}><strong>Respostas rápidas</strong></p>
            <p style={paragraph}>Faremos o possível para responder prontamente às suas solicitações. Em qualquer caso, caso seja impossível para nós, garantiremos que você seja informado sobre as razões factuais ou legais que nos impedem de atender ao seu pedido imediatamente ou em qualquer outro momento no futuro. Nos casos em que não estivermos processando suas informações pessoais, indicaremos a pessoa física ou jurídica a quem você deve direcionar suas solicitações, caso isso seja possível.</p>

            <p style={paragraph}><strong>Solicitações de acesso ou confirmação de processamento</strong></p>
            <p style={paragraph}>Caso você registre uma solicitação de acesso ou de confirmação do processamento de informações pessoais, certifique-se de especificar se deseja que suas informações pessoais sejam entregues em formato eletrônico ou impresso. Você também precisará nos informar se deseja que respondamos ao seu pedido imediatamente, sendo que, neste caso, responderemos de forma simplificada, ou se você precisar de uma divulgação completa. Neste último caso, responderemos dentro de 15 dias a partir da sua solicitação, fornecendo todas as informações sobre a origem de suas informações pessoais, confirmação sobre a existência ou não de registros, quaisquer critérios utilizados para o processamento e as finalidades do processamento, mantendo protegidos nossos segredos comerciais e industriais.</p>

            <p style={paragraph}><strong>Solicitações de retificação, exclusão, anonimato ou bloqueio de informações pessoais</strong></p>
            <p style={paragraph}>Caso você solicite uma retificação, exclusão, anonimato ou bloqueio de informações pessoais, garantiremos que sua solicitação seja imediatamente comunicada a outras partes com quem compartilhamos suas informações pessoais, para permitir que esses terceiros também cumpram com sua solicitação – exceto nos casos em que tal comunicação se prove impossível ou envolva um esforço desproporcional de nossa parte.</p>

            <h3 style={sectionTitle}>Transferência de informações pessoais para fora do Brasil permitida por lei</h3>
            <p style={paragraph}>Temos permissão para transferir suas informações pessoais para fora do território brasileiro nos seguintes casos:</p>
            <ul style={{ margin: 0, paddingLeft: spacing.spacing[24] }}>
              {[
                'quando a transferência for necessária para fins de cooperação jurídica internacional entre órgãos públicos de inteligência, investigação e Ministério Público, de acordo com os meios legais dispostos no direito internacional;',
                'quando a transferência for necessária para proteger sua vida ou segurança física ou de terceiros;',
                'quando a transferência for autorizada pela ANPD;',
                'quando a transferência resultar de um compromisso assumido em um acordo de cooperação internacional;',
                'quando a transferência for necessária para a execução de uma política pública ou atribuição legal de serviço público;',
                'quando a transferência for necessária para o cumprimento de uma obrigação legal ou regulamentar, a execução de um contrato ou procedimentos preliminares relacionados a um contrato ou o exercício regular de direitos em processos judiciais, administrativos ou de arbitragem.',
              ].map((item) => (
                <li key={item} style={listItem}>{item}</li>
              ))}
            </ul>

            <p style={paragraph}>Para informações completas sobre seus direitos na Califórnia, Virgínia, Colorado, Connecticut e Utah, consulte as seções específicas desta política de privacidade.</p>

            <h3 style={sectionTitle}>Informações adicionais caso você resida na Califórnia</h3>
            <p style={paragraph}>Esta seção do documento se integra e complementa as informações contidas no resto da política de privacidade e é fornecida pela empresa que opera este site e, se for o caso, suas controladoras, subsidiárias e afiliadas (para fins desta seção, doravante coletivamente denominadas "nós", "nos", "nosso" e "conosco").</p>
            <p style={paragraph}>Esta seção se aplica a todos os usuários (usuários são referidos abaixo, simplesmente como "você", "seu", "seu"), que são consumidores residentes no estado da Califórnia, Estados Unidos da América, de acordo com a "California Consumer Privacy Act of 2018" (a "CCPA"), atualizada pela "California Privacy Rights Act" (a "CPRA") e regulamentos subsequentes. Para esses consumidores, esta seção substitui qualquer outra informação possivelmente divergente ou conflitante contida na política de privacidade.</p>
            <p style={paragraph}>Para informações completas sobre seus direitos na Califórnia, consulte as seções específicas desta política de privacidade.</p>

            <h3 style={sectionTitle}>Informações adicionais caso você resida na Virgínia</h3>
            <p style={paragraph}>Esta seção do documento se integra e complementa as informações contidas no resto da política de privacidade e é fornecida pelo controlador que opera esta Aplicação e, se for o caso, suas controladoras, subsidiárias e afiliadas (para fins desta seção, doravante coletivamente denominadas "nós", "nos", "nosso" e "conosco").</p>
            <p style={paragraph}>Esta seção se aplica a você se você residir na Commonwealth da Virgínia, de acordo com a "Virginia Consumer data Protection Act" (a "VCDPA"), e substitui qualquer outra informação possivelmente divergente ou conflitante contida na política de privacidade.</p>

            <h3 style={sectionTitle}>Informações adicionais caso você resida no Colorado</h3>
            <p style={paragraph}>Esta seção do documento se integra e complementa as informações contidas no resto da política de privacidade e é fornecida pelo controlador que opera este site e, se for o caso, suas controladoras, subsidiárias e afiliadas (para fins desta seção, doravante coletivamente denominadas "nós", "nos", "nosso" e "conosco").</p>
            <p style={paragraph}>Esta seção se aplica a você se você residir no Estado do Colorado, de acordo com a "Colorado Privacy Act" (a "CPA"), e substitui qualquer outra informação possivelmente divergente ou conflitante contida na política de privacidade.</p>

            <h3 style={sectionTitle}>Informações adicionais caso você resida em Connecticut</h3>
            <p style={paragraph}>Esta seção do documento se integra e complementa as informações contidas no resto da política de privacidade e é fornecida pelo controlador que opera este site e, se for o caso, suas controladoras, subsidiárias e afiliadas (para fins desta seção, doravante coletivamente denominadas "nós", "nos", "nosso" e "conosco").</p>
            <p style={paragraph}>Esta seção se aplica a você se você residir no Estado de Connecticut, de acordo com "An Act Concerning personal data Privacy and Online Monitoring" (também conhecido como "The Connecticut data Privacy Act" ou a "CTDPA"), e, para esses consumidores, substitui qualquer outra informação possivelmente divergente ou conflitante contida na política de privacidade.</p>

            <h3 style={sectionTitle}>Informações adicionais caso você resida em Utah</h3>
            <p style={paragraph}>Esta seção do documento se integra e complementa as informações contidas no resto da política de privacidade e é fornecida pelo controlador que opera este site e, se for o caso, suas controladoras, subsidiárias e afiliadas (para fins desta seção, doravante coletivamente denominadas "nós", "nos", "nosso" e "conosco").</p>
            <p style={paragraph}>Esta seção se aplica a você se você residir no Estado de Utah, de acordo com a "Consumer Privacy Act" (a "UCPA"), e substitui qualquer outra informação possivelmente divergente ou conflitante contida na política de privacidade.</p>

            <h3 style={sectionTitle}>Informações adicionais sobre coleta e processamento de dados</h3>
            <p style={paragraph}><strong>Ação jurídica</strong></p>
            <p style={paragraph}>Podemos usar seus dados pessoais para fins jurídicos em juízo ou nas etapas conducentes à possível ação jurídica decorrente de uso indevido deste serviço ou dos serviços relacionados. Você declara estar ciente de que podemos ser obrigados a revelar dados pessoais mediante solicitação de autoridades governamentais.</p>

            <p style={paragraph}><strong>Informações adicionais sobre seus dados pessoais</strong></p>
            <p style={paragraph}>Além das informações contidas nesta política de privacidade, este site poderá fornecer a você informações adicionais e contextuais sobre serviços específicos ou sobre a coleta e o processamento de dados pessoais, mediante solicitação.</p>

            <p style={paragraph}><strong>Logs do sistema e manutenção</strong></p>
            <p style={paragraph}>Para fins de operação e manutenção, este site e quaisquer serviços de terceiros poderão coletar arquivos que gravam a interação com este site (logs do sistema) ou usar outros dados pessoais (tais como endereço IP) para esta finalidade.</p>

            <p style={paragraph}><strong>As informações não contidas nesta política</strong></p>
            <p style={paragraph}>Mais detalhes sobre a coleta ou o processamento de dados pessoais podem ser solicitados a qualquer momento. Consulte as informações de contato no início deste documento.</p>

            <p style={paragraph}><strong>Mudanças nesta política de privacidade</strong></p>
            <p style={paragraph}>Reservamo-nos o direito de fazer alterações nesta política de privacidade a qualquer momento, notificando você por meio desta página e possivelmente dentro deste site e/ou - na medida em que for técnica e juridicamente viável - enviando um aviso a você por meio de qualquer informação de contato disponível para nós. É altamente recomendável que você verifique esta página regularmente, consultando a data da última modificação informada na parte inferior. Caso as mudanças afetem as atividades de processamento realizadas com base no seu consentimento, coletaremos novo consentimento de você, onde for exigida.</p>

            <h3 style={sectionTitle}>Definições e referências jurídicas</h3>
            <p style={paragraph}><strong>Dados pessoais (ou dados)</strong></p>
            <p style={paragraph}>Quaisquer informações que diretamente, indiretamente ou em relação com outras informações – incluindo um número de identificação pessoal – permitam a identificação ou identificabilidade de uma pessoa física (em outras palavras, você).</p>

            <p style={paragraph}><strong>Dados de uso</strong></p>
            <p style={paragraph}>Dados de uso são informações coletadas automaticamente por meio deste site ou de serviços de terceiros, incluindo seu endereço IP, tipo de navegador, sistema operacional, hora e método das solicitações, status da resposta, duração da visita, sequência de páginas e detalhes específicos do dispositivo.</p>

            <p style={paragraph}><strong>Este site</strong></p>
            <p style={paragraph}>Os meios pelos quais seus dados pessoais são coletados e processados.</p>

            <p style={paragraph}><strong>Serviço</strong></p>
            <p style={paragraph}>O serviço fornecido por este site, conforme descrito nos Termos de Serviço e neste site.</p>

            <p style={paragraph}><strong>União Europeia (ou UE)</strong></p>
            <p style={paragraph}>A menos que especificado diferentemente, todas as referências feitas neste documento à União Europeia incluem todos os atuais estados membros da União Europeia e do Espaço Econômico Europeu.</p>

            <p style={paragraph}><strong>Cookie</strong></p>
            <p style={paragraph}>Cookies são rastreadores compostos por pequenos conjuntos de dados armazenados em seu navegador.</p>

            <p style={paragraph}><strong>Rastreador</strong></p>
            <p style={paragraph}>Rastreador indica qualquer tecnologia - por exemplo, cookies, identificadores únicos, web beacons, scripts embutidos, e-tags e impressões digitais - que permita o rastreamento de informações sobre você, por exemplo, acessando ou armazenando informações no seu dispositivo.</p>

            <p style={paragraph}><strong>Informação jurídica</strong></p>
            <p style={paragraph}>Esta declaração de privacidade foi preparada com base nas disposições de diversas legislações. Esta política de privacidade se refere exclusivamente a este site, se não houver declaração em contrário neste documento.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicy;


