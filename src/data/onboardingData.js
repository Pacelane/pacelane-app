// Onboarding Data - Content pillars for editorial topics
// This file contains the available content pillars for users to choose from

// Expanded pillar options (more comprehensive list)
export const allPillarOptions = [
  'Industry Insights',
  'Personal Stories',
  'Tips & Advice',
  'Behind the Scenes',
  'Team & Culture',
  'Product Updates',
  'Thought Leadership',
  'Educational Content',
  'Company News',
  'Customer Stories',
  'Market Analysis',
  'Case Studies',
  'Best Practices',
  'Innovation & Trends',
  'Leadership Lessons',
  'Career Development',
  'Networking Tips',
  'Success Stories',
  'Challenges & Solutions',
  'Future Predictions',
  'Expert Interviews',
  'Process Insights',
  'Tool Recommendations',
  'Industry Events',
  'Professional Growth',
  'Skill Development',
  'Strategic Thinking',
  'Client Success',
  'Project Highlights',
  'Lessons Learned'
];

// Helper function to get default pillars (kept for backward compatibility)
export const getPillarsForGoals = (selectedGoals) => {
  // Return default pillars since we're not using goal-based suggestions anymore
  return [
    'Industry Insights',
    'Personal Stories',
    'Tips & Advice'
  ];
};
