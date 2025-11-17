// Onboarding Data - Content pillars for editorial topics
// This file contains the available content pillars for users to choose from

// Expanded pillar options (more comprehensive list)
export const allPillarOptions = [
  'Insights da Indústria',
  'Histórias Pessoais',
  'Dicas e Conselhos',
  'Bastidores',
  'Equipe e Cultura',
  'Atualizações de Produto',
  'Liderança de Pensamento',
  'Conteúdo Educacional',
  'Notícias da Empresa',
  'Histórias de Clientes',
  'Análise de Mercado',
  'Estudos de Caso',
  'Melhores Práticas',
  'Inovação e Tendências',
  'Lições de Liderança',
  'Desenvolvimento de Carreira',
  'Dicas de Networking',
  'Histórias de Sucesso',
  'Desafios e Soluções',
  'Previsões Futuras',
  'Entrevistas com Especialistas',
  'Insights de Processo',
  'Recomendações de Ferramentas',
  'Eventos da Indústria',
  'Crescimento Profissional',
  'Desenvolvimento de Habilidades',
  'Pensamento Estratégico',
  'Sucesso do Cliente',
  'Destaques de Projetos',
  'Lições Aprendidas'
];

// Helper function to get default pillars (kept for backward compatibility)
export const getPillarsForGoals = (selectedGoals) => {
  // Return default pillars since we're not using goal-based suggestions anymore
  return [
    'Insights da Indústria',
    'Histórias Pessoais',
    'Dicas e Conselhos'
  ];
};
