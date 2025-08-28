// Template Data - Single LinkedIn Post Template
// Simplified template system without database storage

// Template categories for organization
export const templateCategories = {
  PERSONAL: 'personal',
  EDUCATIONAL: 'educational',
  ORGANIZATIONAL: 'organizational',
  PROMOTIONAL: 'promotional'
};

// LinkedIn Post Templates
export const templateData = [
  {
    id: 'template-problem-solution-framework',
    title: 'Problem-Solution Framework',
    description: 'Opens with a strong stance, contrasts with reality, identifies the gap, provides arrow-bulleted solutions, adds philosophical perspective through parallel statements, and closes with a challenging question.',
    category: templateCategories.EDUCATIONAL,
    bichaurinhoVariant: 1,
    content: `[Bold opening statement].

But [contradicting reality].

[Current behavior description].

And then [consequence question].

What's usually missing?

→ [Solution/missing element 1]
→ [Solution/missing element 2]
→ [Solution/missing element 3]
→ [Solution/missing element 4]

[Parallel wisdom statement 1].

[Parallel wisdom statement 2].

[Reframe statement].

[Counter-argument].

[Final provocative question]?`
  },
  {
    id: 'template-instructional-framework',
    title: 'Instructional Framework',
    description: 'Opens with a topic statement followed by bulleted do\'s and don\'ts, includes key insight statements, uses an analogy for deeper understanding, acknowledges challenges, and closes with requirements for success.',
    category: templateCategories.EDUCATIONAL,
    bichaurinhoVariant: 2,
    content: `[Topic] is done like this:

[Do item 1]
[Do item 2]
[Do item 3]
[Do item 4]
[Do item 5]

What you shouldn't do:

[Don't item 1]
[Don't item 2]
[Don't item 3]
[Don't item 4]
[Don't item 5]

[Key mindset statement].
[Focus statement].
It's like [analogy subject] ([parenthetical comment about analogies]).
[Analogy explanation sentence 1]. [Analogy explanation sentence 2].
[Challenge acknowledgment statement].
[Success requirement statement].
[Final reinforcing statement].`
  },
  {
    id: 'template-opinion-leadership',
    title: 'Opinion Leadership',
    description: 'Opens with a bold command, presents a binary choice, includes short declarative statements separated by line breaks, uses historical comparisons, and ends with a defining statement.',
    category: templateCategories.PERSONAL,
    bichaurinhoVariant: 3,
    content: `[Bold opening command].

[Binary choice statement].

[Reality statement]. [Supporting behavioral statement].

[Action recommendation].

[Emphatic transition statement].

[Conditional logic statement].

[Historical comparison statement].

[Final defining statement].`
  },
  {
    id: 'template-thought-provocative',
    title: 'Thought Provocative',
    description: 'Opens with a bold controversial statement, acknowledges the harshness, explains the logic with concrete examples, introduces a provocative twist, asks moral questions, admits uncertainty, and ends with a reality check.',
    category: templateCategories.PERSONAL,
    bichaurinhoVariant: 4,
    content: `[Controversial opening statement].

[Acknowledgment of harshness], [but reinforcement].

[Supporting explanation of change].

[Concrete comparison with numbers/examples].

[Consequence statement]. [Value judgment].

[Cost statement].

[Most controversial twist statement]. [Elaboration with parenthetical note].

[Emotional impact statement], [deeper explanation].

[Moral question 1]?

[Moral question 2]?

[Admission of uncertainty].

[Perspective dependency statement].

[Final reality check statement].`
  },
  {
    id: 'template-personal-opinion-challenge',
    title: 'Personal Opinion with Challenge',
    description: 'Opens with a bold statement, challenges conventional metrics, shares personal experience as proof, defines the correct approach with arrows, asks challenging questions, reframes the problem, and ends with simple wisdom.',
    category: templateCategories.PERSONAL,
    bichaurinhoVariant: 5,
    content: `[Bold opening statement about outdated practice].

[Conventional metric challenge].

[Personal experience example with specific details].

[One-word descriptor].

[Correct approach definition]:

→ [New metric 1]
→ [New metric 2]
→ [New metric 3]

[Challenging personal question about old behavior]?

[Reframe statement]. [Strategic judgment].

[Logical statement about planning].

[Call to question toxic culture statement].

[Follow-up personal fear question]?

[Problem attribution statement]. [Management blame].

[Consequence description].

[Simple wisdom statement].

[Final simple truth].`
  },
  {
    id: 'template-concept-defense',
    title: 'Concept Defense',
    description: 'Opens with a corrective definition, provides the real definition with arrow-bulleted characteristics, explains the progression/evolution, shares a concrete example, addresses criticism, defends the position, and ends with proof of concept.',
    category: templateCategories.EDUCATIONAL,
    bichaurinhoVariant: 6,
    content: `[Subject] isn't [common misconception].

[Subject] is [correct definition].

[Elaboration of definition]:

→ [Characteristic 1]
→ [Characteristic 2]
→ [Characteristic 3]

[Evolution/progression explanation].

[Next stage explanation].

[Concrete personal example with specifics].

[Simple descriptor].

[Criticism introduction]:

"[Criticism quote 1]."
"[Criticism quote 2]."
"[Criticism quote 3]."

[Disagreement statement].

[Reinforcement statement].

[Restatement of definition].

[Validation statement].

[Outcome prediction].

[Differentiator question]?

[Key factor answer].

[Challenge statement]:

[Final assertion].

[Proof statement].`
  },
  {
    id: 'template-leadership-philosophy',
    title: 'Leadership Philosophy',
    description: 'Opens with a hook about the most important metric, eliminates common assumptions with "It\'s not" statements, builds suspense, reveals the real metric, explains the logic, provides supporting evidence with bullet points, and ends with philosophical wisdom.',
    category: templateCategories.EDUCATIONAL,
    bichaurinhoVariant: 7,
    content: `[Hook statement about single most important metric]:

[Elimination 1].

[Elimination 2].

[Elimination 3].

[Strong elimination 4].

[Build-up statement]:

[The real metric revealed].

[Explanation of the metric].

[Causation statement].

[Supporting evidence introduction]:

[Consequence 1]
[Consequence 2]
[Consequence 3]

[Success formula statement].

[Philosophical leadership statement]. [Counter-statement].

[Closing wisdom about cause and effect].`
  },
  {
    id: 'template-professional-mindset-challenge',
    title: 'Professional Mindset Challenge',
    description: 'Opens by identifying a bad professional habit, calls out the flawed thinking, provides logical counter-arguments, poses a challenging question with arrow-bulleted evidence, asks why people resist, offers a compelling alternative perspective, shares personal stance, and ends with a recommendation and proof.',
    category: templateCategories.PERSONAL,
    bichaurinhoVariant: 8,
    content: `[Bad professional habit identification]:

[The flawed behavior/thinking].

[Direct criticism of the mindset].

[Logical counter-argument 1].

[Logical counter-argument 2].

[Dismissive statement about resistance].

[Challenging question]: [question for whom]?

→ [Evidence point 1]
→ [Evidence point 2]
→ [Evidence point 3]
→ [Evidence point 4]

[Why question about the resistance]?

[Compelling logic question with benefits]?

[Personal stance statement].

[Contrarian value statement].

[Reasoning about freed-up time/resources].

[Personal recommendation with action].

[Quality improvement statement].`
  },
  {
    id: 'template-leadership-ethics',
    title: 'Leadership Ethics',
    description: 'Opens with a blunt statement about leadership misconceptions, identifies the core confusion, explains the wrong assumption, corrects it with arrow-bulleted principles, contrasts authority vs. character, provides conditional failure scenarios, and ends with the true definition of leadership.',
    category: templateCategories.EDUCATIONAL,
    bichaurinhoVariant: 9,
    content: `[Blunt opening statement about leadership misconception].

[Core confusion identification].

[Wrong assumption explanation].

[Correction statement].

→ [Leadership principle 1]
→ [Leadership principle 2]
→ [Leadership principle 3]

[Authority vs. character contrast].

[True follower statement].

[Conditional failure scenario 1].

[Conditional failure scenario 2].

[True leadership definition].

[Final contrasting wisdom about elevation vs. degradation].`
  },
  {
    id: 'template-business-strategy',
    title: 'Business Strategy',
    description: 'Opens with a direct warning against over-behavior, dismisses common excuses, contrasts theory vs. reality, provides arrow-bulleted scenarios showing market unpredictability, shares personal approach, clarifies the nuance, offers wisdom statements, contrasts hesitation vs. action, and ends with learning philosophy.',
    category: templateCategories.EDUCATIONAL,
    bichaurinhoVariant: 10,
    content: `[Warning against over-behavior].

[Dismissal of common excuse].

[Theory vs. reality contrast statement].

→ [Scenario expectation 1]
→ [Market reality 1]
→ [Scenario expectation 2]
→ [Market reality 2]

[Personal approach statement].

[Personal preference with reasoning].

[Clarifying transition word]...

[Clarification statement].

[The real problem identification].

[Wisdom statement 1].

[Wisdom statement 2].

[Contrast between hesitators and action-takers].

[Learning philosophy statement].

[Source of learning statement].`
  },
  {
    id: 'template-corporate-strategy',
    title: 'Corporate Strategy',
    description: 'Opens with a metaphor about harsh environment, corrects common assumptions about success factors, lists required navigation skills, uses arrow-bulleted reality check, acknowledges the uncomfortable truth, provides the success formula, and ends with a direct challenge question.',
    category: templateCategories.EDUCATIONAL,
    bichaurinhoVariant: 11,
    content: `[Environment metaphor].

[Correction of common survival assumption].

[Real survival requirement].

[Required skill 1].

[Required skill 2].

[Required skill 3].

→ [Competence acknowledgment]
→ [Navigation reality check]

[Uncomfortable truth acknowledgment].

[Daily reality statement].

[Success formula introduction], [talent component].

[Other component statement].

[Direct challenge question]?`
  },
  {
    id: 'template-professional-psychology',
    title: 'Professional Psychology',
    description: 'Opens with an observation about good vs. bad people, identifies a corporate paradox caused by two psychological effects, explains the problem this creates, describes the unfair advantage scenario, makes statements about talent vs. confidence, provides a solution, and ends with a call to action to support real talent.',
    category: templateCategories.EDUCATIONAL,
    bichaurinhoVariant: 12,
    content: `[Opening observation about talent perception].

[Cause identification].

[Paradox introduction], [caused by statement]:

[First psychological effect explanation], [definition].

[Second psychological effect explanation], [definition]. [Alternative name].

[Problem identification]:

[Competence-confidence correlation explanation].

[Impact on talented people].

[Meanwhile contrasting behavior of less competent].

[Talent tendency statement].

[Exploitation opportunity statement].

[Solution for talent development].

[Encouragement call to action].

[Opportunity statement about recognition].

[Value prediction].

[Final call to prevent talent displacement].`
  },
  {
    id: 'template-product-launch-sales',
    title: 'Product Launch/Sales',
    description: 'Opens with impressive metrics as proof, reveals the single source/system, describes it with a compelling metaphor, lists features with bullet points, shows dramatic results, includes a meta-reference, explains the process, provides early access offer with features, ends with clear call-to-action and engagement hook.',
    category: templateCategories.PROMOTIONAL,
    bichaurinhoVariant: 13,
    content: `[Time period 1] = [impressive metric 1]

[Time period 2] = [impressive metric 2]

[Time period 3] = [impressive metric 3] ([status qualifier])

[Attribution statement].

[Source revelation statement]...

[Product name].

[Compelling metaphor description].

[Feature introduction]:

[Feature 1]
[Feature 2]
[Feature 3]
[Feature 4]
[Feature 5]
[Feature 6]

[Results question]?

[Dramatic results statement] — [automation qualifier].

[What's eliminated - list format]:

[No item 1].
[No item 2].
[No item 3].
[No item 4].

[Meta-reference statement].

[Process simplicity]: [input] → [automated output].

[Product personality description]: [trait 1]. [trait 2]. [trait 3].

[Launch announcement] — [availability window].

[Offer introduction]:

[Included item 1]
[Included item 2]
[Included item 3]
[Included item 4]
[Included item 5]
[Included item 6]

[Contrast statement]. [Value proposition].

[Engagement question]?

[Call-to-action instruction].

[Qualifier requirement].

[PS engagement hook].`
  },
  {
    id: 'template-life-philosophy-system',
    title: 'Life Philosophy System',
    description: 'Opens with a famous quote, promises a transformation timeline, clarifies a key distinction, provides philosophical foundation, gives foundational tips, then breaks down a numbered system with detailed sub-explanations for each point.',
    category: templateCategories.PERSONAL,
    bichaurinhoVariant: 18,
    content: `[Famous person] once said:

"[Inspirational quote]."

Here's how to [achieve transformation] (in [timeline]):

[Concept A] vs [Concept B]

Most people confuse the two.

[Concept A definition]. [Concept B definition].

Your goal isn't to [misconception]. It's to [correct approach].

When you master this, [benefit] follows.

[Philosophical statement about successful people]:

[Example 1]

[Example 2]

[Example 3]

[Wisdom statement about mastery].

Here are [number] tips I've learned from studying [source]:

The [Principle Name]

[Application example 1].

[Application example 2].

[Application example 3].

[Action statement]. [Elimination statement].

[System Name]

It's not just about [surface level].

It's about:

[Deep factor 1]

[Deep factor 2]

[Deep factor 3]

[Environment principle].

[Technique Name]

Create a list of [type]:

[Rule 1]

[Rule 2]

[Rule 3]

[Wisdom about elimination vs addition].

Next, I want to break down [number] insanely simple systems that you can implement today to make you [desired outcome]:

[System 1]

[System 2]

[System 3]

[System 4]

[System 5]

[System 1 Title]

Here are a few I've set for myself to [achieve goal]:

[Personal rule 1]

[Personal rule 2]

[Personal rule 3]

[Personal rule 4]

[Formula: Component + Component = Result]

[System 2 Title]

[Requirement statement].

When defining them, make sure they follow the [Framework Name]:

[Criteria 1]

[Criteria 2]

[Criteria 3]

[Criteria 4]

[Criteria 5]

[Biblical/philosophical wisdom statement].

[System 3 Title]

[Simple daily action instruction].

[Sports/competitive metaphor]. [Planning principle].

[Formula: Evening action = Morning result].

[System 4 Title]

Your most important asset is [fundamental thing].

Here's my (simplified) [area] protocol:

[Time period]: [Activities list]

[Time period]: [Activities list]

[Time period]: [Activities list]

[Success principle connection].

[System 5 Title]

These [frequency] reminders become your [mental concept]. Some of mine include:

"[Personal affirmation 1]"

"[Personal affirmation 2]"

"[Personal affirmation 3]"

Your words become your reality. [Action instruction].`
  },
  {
    id: 'template-nuanced-opinion',
    title: 'Nuanced Opinion',
    description: 'Opens with a contrarian statement about not needing to follow common advice, acknowledges the challenges, clarifies what it doesn\'t guarantee, transitions to sharing personal perspective, explains the positive interpretation, describes the indirect benefits, advocates for the approach, and ends with a rhetorical question.',
    category: templateCategories.PERSONAL,
    bichaurinhoVariant: 19,
    content: `You don't need to be [common expectation], and keep [demanding activity], and do [overwhelming task]...

Definitely, this is very [challenging aspect], and requires [significant commitment]. [Honest admission about difficulty].

This also doesn't mean that [false guarantee about results].

But, I'll share my perspective.

Whenever I see a [professional type 1], [professional type 2], [professional type 3] or [professional category] sharing, I interpret that, beyond the desire to [surface motivation] – in the best sense – they probably have the intention to [deeper positive motivation].

Those who post [value type 1], [value type 2], [value type 3] – and even [lighter value type] – even if their intention is [commercial motive], end up [positive impact] several other colleagues, directly or indirectly.

Besides that, in my view, [key behavior] is one of the most powerful tactics to [achieve goal].

[key behavior] professionally – in the best sense – is [definition/explanation], and this can generate many results. You [benefit 1], [benefit 2], [benefit 3]...

In fact, if I or any other human met you, you probably [engaged in key behavior] at some point. And if you do it frequently, your [asset] grows. Isn't that why we create [related systems]?`
  }
];

// Helper functions for template management
export const getTemplateById = (templateId) => {
  return templateData.find(template => template.id === templateId);
};

export const getTemplatesByCategory = (category) => {
  return templateData.filter(template => template.category === category);
};

export default templateData;
