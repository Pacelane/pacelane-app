// Template Data - 10 Viral LinkedIn Post Templates
// Based on goals, guides, and pillars from onboardingData.js

import { goalOptions, goalToGuides, goalToPillars } from './onboardingData.js';

// Template categories for organization
export const templateCategories = {
  AUTHORITY: 'authority',
  NETWORKING: 'networking', 
  CLIENT_ATTRACTION: 'client_attraction',
  THOUGHT_LEADERSHIP: 'thought_leadership',
  CAREER: 'career',
  STORYTELLING: 'storytelling'
};

// 10 Viral LinkedIn Post Templates
export const templateData = [
  {
    id: 'template-authority-expertise',
    title: 'The Expertise Showcase',
    description: 'Share your knowledge and establish authority in your field with data-backed insights',
    category: templateCategories.AUTHORITY,
    relatedGoals: ['Build Authority', 'Become a Thought Leader'],
    relatedPillars: ['Industry Insights', 'Thought Leadership', 'Expert Interviews'],
    relatedGuides: ['Share your expertise consistently', 'Back claims with evidence and experience'],
    content: `I've analyzed [SPECIFIC NUMBER] [INDUSTRY/TOPIC] projects over the past [TIME PERIOD], and here's what I discovered:

🔍 **The Problem Everyone Misses:**
[Describe a common misconception or overlooked issue in your industry]

📊 **The Data That Surprised Me:**
• [Statistic 1] - [Brief explanation]
• [Statistic 2] - [Brief explanation] 
• [Statistic 3] - [Brief explanation]

💡 **What This Means For You:**
[Practical implication or actionable insight]

🎯 **My Recommendation:**
[Specific advice or next steps]

The biggest mistake I see is [COMMON MISTAKE]. Instead, try [BETTER APPROACH].

What's your experience with this? Have you noticed similar patterns?

#[YourIndustry] #[RelevantHashtag] #[ProfessionalTopic]`
  },
  
  {
    id: 'template-networking-connection',
    title: 'The Connection Builder',
    description: 'Build meaningful professional relationships by sharing valuable insights and asking engaging questions',
    category: templateCategories.NETWORKING,
    relatedGoals: ['Grow Network', 'Stay Visible'],
    relatedPillars: ['Networking Tips', 'Personal Stories', 'Industry Events'],
    relatedGuides: ['Engage authentically with others', 'Share valuable insights regularly'],
    content: `Just had an incredible conversation with [PERSON/ROLE] about [TOPIC], and it completely shifted my perspective.

🤔 **The Question That Started Everything:**
"[Thought-provoking question they asked]"

💭 **My Initial Reaction:**
[Your honest first thought or assumption]

🔄 **The Perspective Shift:**
[How the conversation changed your thinking]

✨ **The Key Insight:**
[Main takeaway that others can benefit from]

This reminded me why I love connecting with people in [INDUSTRY/FIELD]. Every conversation is a chance to learn something new.

**Question for you:** What's the most perspective-changing conversation you've had recently? 

I'd love to hear about it in the comments! 👇

#Networking #[YourIndustry] #ProfessionalGrowth #Learning`
  },

  {
    id: 'template-client-success-story',
    title: 'The Client Success Story', 
    description: 'Attract potential clients by showcasing your results and problem-solving approach',
    category: templateCategories.CLIENT_ATTRACTION,
    relatedGoals: ['Attract Clients', 'Showcase Work'],
    relatedPillars: ['Case Studies', 'Customer Stories', 'Success Stories'],
    relatedGuides: ['Showcase your work and results', 'Address common client pain points'],
    content: `Client came to me with a problem that's all too common in [INDUSTRY]:

❌ **The Challenge:**
[Specific problem the client was facing - be relatable and common]

⏰ **The Timeline Pressure:**
[Time constraint or urgency that made it more challenging]

🔧 **My Approach:**
1. [First step you took]
2. [Second step - focus on your unique process]
3. [Third step - show your expertise]

📈 **The Results:**
• [Quantifiable result 1]
• [Quantifiable result 2] 
• [Qualitative improvement]

💡 **The Key Insight:**
[What made the difference - your unique value]

**The lesson?** [MAIN TAKEAWAY THAT HELPS OTHERS]

If you're facing similar challenges, here's what I'd recommend: [BRIEF ADVICE]

What's the biggest [RELEVANT CHALLENGE] you're dealing with right now?

#[YourService] #[ClientIndustry] #Results #[ProfessionalTopic]`
  },

  {
    id: 'template-thought-leadership-prediction',
    title: 'The Industry Prediction',
    description: 'Position yourself as a thought leader by sharing informed predictions about industry trends',
    category: templateCategories.THOUGHT_LEADERSHIP,
    relatedGoals: ['Become a Thought Leader', 'Stay Relevant'],
    relatedPillars: ['Future Predictions', 'Market Analysis', 'Innovation & Trends'],
    relatedGuides: ['Share unique perspectives and opinions', 'Keep up with industry trends'],
    content: `Unpopular opinion: [BOLD PREDICTION ABOUT YOUR INDUSTRY] by [TIMEFRAME].

Here's why I believe this is inevitable:

🌊 **The Current Wave:**
[Describe current trends you're observing]

📊 **The Data Points:**
• [Supporting evidence 1]
• [Supporting evidence 2]
• [Supporting evidence 3]

🔮 **What I'm Seeing That Others Aren't:**
[Your unique insight or observation]

⚡ **The Catalyst:**
[What will accelerate this change]

🎯 **What This Means for Professionals:**
[Practical implications for your audience]

**My advice?** Start preparing now by:
1. [Actionable step 1]
2. [Actionable step 2]
3. [Actionable step 3]

I could be wrong (and I hope the discussion proves me right or wrong!), but the signs are all there.

What do you think? Are you seeing similar signals?

#FutureOf[Industry] #[IndustryTrends] #ThoughtLeadership #Innovation`
  },

  {
    id: 'template-career-lesson-learned',
    title: 'The Career Lesson',
    description: 'Share career insights and attract opportunities by discussing professional growth moments',
    category: templateCategories.CAREER,
    relatedGoals: ['Attract Opportunities', 'Professional Growth'],
    relatedPillars: ['Career Development', 'Leadership Lessons', 'Professional Growth'],
    relatedGuides: ['Share your vision and aspirations', 'Highlight your skills and achievements'],
    content: `[X] years ago, I made a career decision that everyone told me was risky.

Today, I can say it was the best decision I ever made. Here's the story:

🚪 **The Opportunity:**
[Describe the situation or opportunity]

😰 **The Fear:**
[What made it scary or risky]

💭 **What Everyone Said:**
"[Common advice/warnings you received]"

🤔 **Why I Did It Anyway:**
[Your reasoning and what convinced you]

📈 **The Unexpected Outcomes:**
• [Positive result 1]
• [Positive result 2]
• [Personal growth aspect]

🎯 **The Real Lesson:**
[Key insight about career decisions/risk-taking]

**What I wish I'd known then:** [WISDOM YOU'D SHARE]

Looking back, the biggest risk would have been staying comfortable.

**For anyone considering a similar leap:** [ENCOURAGEMENT AND ADVICE]

What's the best "risky" career decision you've made? I'd love to hear your story!

#CareerGrowth #ProfessionalDevelopment #RiskTaking #[YourField]`
  },

  {
    id: 'template-behind-scenes-process',
    title: 'The Behind-the-Scenes Process',
    description: 'Stay visible and build trust by sharing your work process and authentic moments',
    category: templateCategories.STORYTELLING,
    relatedGoals: ['Stay Visible', 'Share Ideas'],
    relatedPillars: ['Behind the Scenes', 'Process Insights', 'Best Practices'],
    relatedGuides: ['Share behind-the-scenes content', 'Make complex topics accessible'],
    content: `Ever wonder what goes into [YOUR WORK/PROJECT TYPE]? Here's what my typical [DAY/PROJECT/PROCESS] actually looks like:

⏰ **6:00 AM - The Foundation:**
[Early morning routine or preparation]

☕ **8:00 AM - The Deep Work:**
[Main work activity with specific details]

🧠 **10:30 AM - The Challenge:**
[Common obstacle you face and how you handle it]

💡 **12:00 PM - The Breakthrough:**
[Moment when things click or progress is made]

🤝 **2:00 PM - The Collaboration:**
[How you work with others or get input]

✅ **4:00 PM - The Polish:**
[Final refinement or quality check process]

**The Part Nobody Sees:** [HONEST MOMENT ABOUT STRUGGLES OR FAILURES]

**What I've Learned:** [KEY INSIGHT FROM YOUR PROCESS]

The glamorous version you see on LinkedIn is real, but so are the 47 revisions, the moments of doubt, and the small wins that add up.

**What does your typical [RELEVANT PROCESS] look like?** Any tips to share?

#BehindTheScenes #[YourProfession] #ProcessImprovement #RealTalk`
  },

  {
    id: 'template-controversial-take',
    title: 'The Contrarian View',
    description: 'Start meaningful conversations by respectfully challenging conventional thinking',
    category: templateCategories.THOUGHT_LEADERSHIP,
    relatedGoals: ['Become a Thought Leader', 'Share Ideas'],
    relatedPillars: ['Thought Leadership', 'Challenges & Solutions', 'Strategic Thinking'],
    relatedGuides: ['Challenge conventional thinking respectfully', 'Start conversations on important topics'],
    content: `Hot take: [CONTROVERSIAL BUT THOUGHTFUL OPINION ABOUT YOUR INDUSTRY]

I know this goes against conventional wisdom, but hear me out:

🤔 **The Common Belief:**
[What most people think/do in your industry]

❌ **Why I Think It's Wrong:**
[Your reasoning with specific examples]

📊 **What I've Observed Instead:**
[Evidence or experience that supports your view]

💡 **A Better Approach:**
[Your alternative solution or perspective]

🎯 **Why This Matters:**
[Broader implications for the industry/professionals]

**Real Example:** [SPECIFIC CASE THAT ILLUSTRATES YOUR POINT]

Look, I'm not saying I'm right about everything. But I've seen too many [PROFESSIONALS/COMPANIES] struggle because they follow [CONVENTIONAL APPROACH] without questioning it.

**Maybe it's time we rethink this?**

What's your take? Am I completely off base, or have you noticed this too?

Let's have a real conversation about this 👇

#[IndustryDebate] #ThoughtLeadership #[RelevantTopic] #Innovation`
  },

  {
    id: 'template-failure-lesson',
    title: 'The Failure That Taught Me',
    description: 'Build authentic connections by sharing failures and the valuable lessons learned',
    category: templateCategories.STORYTELLING,
    relatedGoals: ['Build Authority', 'Share Ideas'],
    relatedPillars: ['Lessons Learned', 'Personal Stories', 'Challenges & Solutions'],
    relatedGuides: ['Be authentic and original', 'Share your experience'],
    content: `I failed spectacularly at [SPECIFIC PROJECT/GOAL] last year.

And it was the best thing that could have happened to my career.

💥 **The Failure:**
[Describe what went wrong - be specific and honest]

😅 **How Bad Was It?**
[Quantify the impact or embarrassment]

🤦‍♂️ **What I Did Wrong:**
• [Mistake 1]
• [Mistake 2] 
• [Mistake 3]

💡 **The Lightbulb Moment:**
[When you realized what you learned]

🔄 **How I Applied The Lesson:**
[Specific changes you made based on the failure]

📈 **The Unexpected Result:**
[How the lesson improved your work/approach]

**The Truth:** Failure isn't the opposite of success—it's a prerequisite.

**What I wish someone had told me:** [ADVICE YOU'D GIVE YOUR PAST SELF]

Now when I see others facing similar challenges, I share this story. Because sometimes knowing you're not alone in failing makes all the difference.

**What's the best lesson a failure taught you?** 

Share it below—someone might need to hear it today.

#FailureToSuccess #LessonsLearned #Growth #[YourIndustry] #Authenticity`
  },

  {
    id: 'template-trend-analysis',
    title: 'The Trend Breakdown',
    description: 'Stay relevant by analyzing current trends and providing actionable insights',
    category: templateCategories.THOUGHT_LEADERSHIP,
    relatedGoals: ['Stay Relevant', 'Build Authority'],
    relatedPillars: ['Market Analysis', 'Industry Insights', 'Innovation & Trends'],
    relatedGuides: ['Keep up with industry trends', 'Share timely insights and commentary'],
    content: `Everyone's talking about [CURRENT TREND], but most are missing the real story.

After diving deep into this trend, here's what's actually happening:

📈 **The Surface Level:** 
[What everyone sees/talks about]

🔍 **The Deeper Reality:**
[What's really driving this trend]

📊 **The Numbers That Matter:**
• [Relevant statistic 1]
• [Relevant statistic 2]
• [Relevant statistic 3]

⚠️ **The Hidden Risk:**
[Potential downside most people aren't considering]

🎯 **The Real Opportunity:**
[How smart professionals can capitalize]

💡 **My Prediction:**
[Where you think this trend is heading]

**For [YOUR AUDIENCE]:** Here's how to navigate this:

✅ **Do This:**
• [Actionable advice 1]
• [Actionable advice 2]

❌ **Avoid This:**
• [Common mistake to avoid]

**The Bottom Line:** [YOUR KEY TAKEAWAY]

This trend will separate the adapters from the laggers. Which camp will you be in?

What's your take on [TREND]? Are you seeing what I'm seeing?

#[TrendHashtag] #MarketAnalysis #[YourIndustry] #FutureOfWork`
  },

  {
    id: 'template-tool-recommendation',
    title: 'The Game-Changing Tool',
    description: 'Provide value by sharing tools and recommendations that solve common problems',
    category: templateCategories.CLIENT_ATTRACTION,
    relatedGoals: ['Share Ideas', 'Build Authority'],
    relatedPillars: ['Tool Recommendations', 'Best Practices', 'Process Insights'],
    relatedGuides: ['Make complex topics accessible', 'Share valuable insights regularly'],
    content: `I just discovered a [TOOL/METHOD/APPROACH] that's completely changed how I [SPECIFIC TASK/PROCESS].

And I think it could help you too.

❌ **The Problem I Was Facing:**
[Specific challenge you had]

⏰ **How Much Time It Was Costing:**
[Quantify the pain point]

🔧 **The Solution I Found:**
[Name and brief description of the tool/method]

⚡ **How It Works:**
1. [Step 1 - keep it simple]
2. [Step 2]
3. [Step 3]

📊 **The Results:**
• [Specific improvement 1]
• [Specific improvement 2]
• [Time/money saved]

💡 **The Best Part:**
[Unexpected benefit or favorite feature]

⚠️ **The Catch:**
[Any limitations or downsides to be aware of]

**For [YOUR AUDIENCE]:** This is especially useful if you [SPECIFIC USE CASE].

**Pro Tip:** [ADVANCED USAGE OR OPTIMIZATION SUGGESTION]

I'm not affiliated with them—just genuinely excited about tools that make our work better.

**What tools have been game-changers for you lately?** Always looking for new recommendations!

#ProductivityTools #[YourIndustry] #Efficiency #WorkSmarter #[RelevantTech]`
  }
];

// Helper functions for template management
export const getTemplateById = (templateId) => {
  return templateData.find(template => template.id === templateId);
};

export const getTemplatesByCategory = (category) => {
  return templateData.filter(template => template.category === category);
};

export const getTemplatesByGoal = (goal) => {
  return templateData.filter(template => 
    template.relatedGoals.includes(goal)
  );
};

export const getTemplatesByPillar = (pillar) => {
  return templateData.filter(template => 
    template.relatedPillars.includes(pillar)
  );
};

// Template metadata for database seeding
export const getTemplateForDatabase = (template) => {
  return {
    id: template.id,
    user_id: null, // System template
    title: template.title,
    description: template.description,
    content: template.content,
    category: template.category,
    is_system: true,
    is_active: true
  };
};

// Get all templates formatted for database insertion
export const getAllTemplatesForDatabase = () => {
  return templateData.map(getTemplateForDatabase);
};

export default templateData;
