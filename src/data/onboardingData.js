// Onboarding Data - Goal-based content relationships
// This file contains the mappings between goals, guides, and pillars

export const goalOptions = [
  'Build Authority',
  'Grow Network', 
  'Attract Clients',
  'Share Ideas',
  'Attract Opportunities',
  'Stay Visible',
  'Stay Relevant',
  'Become a Thought Leader'
];

// Goal-to-Guides mapping (3 guides per goal)
export const goalToGuides = {
  'Build Authority': [
    'Share your expertise consistently',
    'Back claims with evidence and experience',
    'Position yourself as a reliable source'
  ],
  'Grow Network': [
    'Engage authentically with others',
    'Share valuable insights regularly',
    'Be generous with connections and introductions'
  ],
  'Attract Clients': [
    'Showcase your work and results',
    'Address common client pain points',
    'Demonstrate your unique value proposition'
  ],
  'Share Ideas': [
    'Be authentic and original',
    'Make complex topics accessible',
    'Encourage discussion and feedback'
  ],
  'Attract Opportunities': [
    'Highlight your skills and achievements',
    'Share your vision and aspirations',
    'Network strategically and purposefully'
  ],
  'Stay Visible': [
    'Post consistently and regularly',
    'Engage with trending topics in your field',
    'Share behind-the-scenes content'
  ],
  'Stay Relevant': [
    'Keep up with industry trends',
    'Share timely insights and commentary',
    'Adapt your content to current events'
  ],
  'Become a Thought Leader': [
    'Share unique perspectives and opinions',
    'Start conversations on important topics',
    'Challenge conventional thinking respectfully'
  ]
};

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

// Goal-to-Pillars mapping (3 pillars per goal)
export const goalToPillars = {
  'Build Authority': [
    'Thought Leadership',
    'Industry Insights', 
    'Expert Interviews'
  ],
  'Grow Network': [
    'Networking Tips',
    'Personal Stories',
    'Industry Events'
  ],
  'Attract Clients': [
    'Case Studies',
    'Customer Stories',
    'Success Stories'
  ],
  'Share Ideas': [
    'Innovation & Trends',
    'Best Practices',
    'Strategic Thinking'
  ],
  'Attract Opportunities': [
    'Career Development',
    'Professional Growth',
    'Skill Development'
  ],
  'Stay Visible': [
    'Behind the Scenes',
    'Company News',
    'Process Insights'
  ],
  'Stay Relevant': [
    'Market Analysis',
    'Future Predictions',
    'Industry Insights'
  ],
  'Become a Thought Leader': [
    'Thought Leadership',
    'Leadership Lessons',
    'Challenges & Solutions'
  ]
};

// Helper function to get guides for selected goals
export const getGuidesForGoals = (selectedGoals) => {
  if (!selectedGoals || selectedGoals.length === 0) {
    // Return default guides if no goals selected
    return [
      'Be authentic',
      'Share your experience', 
      'Avoid hype'
    ];
  }

  const guides = [];
  selectedGoals.forEach(goal => {
    if (goalToGuides[goal]) {
      guides.push(...goalToGuides[goal]);
    }
  });

  // Remove duplicates and return up to 9 guides (3 per goal max)
  return [...new Set(guides)];
};

// Helper function to get pillars for selected goals
export const getPillarsForGoals = (selectedGoals) => {
  if (!selectedGoals || selectedGoals.length === 0) {
    // Return default pillars if no goals selected
    return [
      'Industry Insights',
      'Personal Stories',
      'Tips & Advice'
    ];
  }

  const pillars = [];
  selectedGoals.forEach(goal => {
    if (goalToPillars[goal]) {
      pillars.push(...goalToPillars[goal]);
    }
  });

  // Remove duplicates and return unique pillars
  return [...new Set(pillars)];
};

// Helper function to get preview text for goals
export const getGoalPreviewText = (selectedGoals) => {
  if (!selectedGoals || selectedGoals.length === 0) {
    return "Select goals to see personalized guides and content pillars.";
  }

  const totalGuides = getGuidesForGoals(selectedGoals).length;
  const totalPillars = getPillarsForGoals(selectedGoals).length;
  
  return `${totalGuides} personalized guides and ${totalPillars} content pillars will be suggested based on your goals.`;
};
