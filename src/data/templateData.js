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
  },
  {
    id: 'template-personal-transformation-journey',
    title: 'Personal Transformation Journey',
    description: 'Opens with a specific time reference and situation, describes the mixed emotions, details the old routine with bullet points, provides vivid location descriptions, expresses the nagging doubt, acknowledges the fun but recognizes unsustainability, contrasts with current situation, shares key metrics of success, gives advice to past self, asks reflective question, and ends with a humorous footnote.',
    category: templateCategories.PERSONAL,
    bichaurinhoVariant: 22,
    content: `[Time period] ago, I'd JUST [major life transition]. I was [positive emotion] about [new situation] with [companion/context]. But still [negative emotion] [specific recurring challenge] at a [previous situation details].

My world was mostly:

[routine element 1]

[routine element 2]

[routine element 3] ([reason/context])

[routine element 4] ([balancing reason])

[Location] was amazing for this. [Location characteristics]. But [mixed feelings description about the area].

But I always had a creeping feeling:

[Existential doubt question]?

Don't get me wrong, [acknowledgment of positives]. But [reality check]. [Sustainability concern question]?

Fast forward to now:

[Major change 1] [time period] ago.

[Major change 2]. [Major change 3] that [passionate description]. [Success metric comparison].

[Lifestyle improvement details] all for [cost comparison].

If I could just go back and tell myself one thing, it'd be this:

[Key wisdom message]. [Timeline expectation]. [Conditional success statement]. [Gratitude prediction].

What version of your older self would you say this to?

p.s. [humorous/random footnote about the past].`
  },
  {
    id: 'template-service-success-story',
    title: 'Service Success Story',
    description: 'Opens with timeframe and client introduction, describes the service relationship, details the original content quality, identifies the improvement opportunity, explains the testing approach, shows dramatic results with specific metrics, and ends with a powerful lesson about the details that matter.',
    category: templateCategories.PROMOTIONAL,
    bichaurinhoVariant: 23,
    content: `[Time period] ago started working with this [client type].

They're in my [service/program name].

Every [frequency] I [service activity 1].

Every [frequency] we [service activity 2].

One [deliverable] they sent me was fantastic:

[Quality 1]

[Quality 2]

[Quality 3]

But we knew it could be [improvement area].

[Specific improvement description].

So we re-wrote a 2nd version.

The [client type] tested [testing method], [timeline apart].

Version one [performance description] - [ranking/comparison].

But version two [better performance description]:

Their [superlative performance description].

[Metric 1]

[Metric 2]

[Metric 3]

[Metric 4]

[Metric 5]

Proof:

[Key lesson about what matters].

Like, REALLY [emphasis of importance].`
  },
  {
    id: 'template-personal-achievement-story-2',
    title: 'Personal Achievement Story',
    description: 'Opens with milestone announcement and reason, describes the pre-event anxiety, contrasts with the actual calm experience, shares a specific challenging moment, celebrates the success, connects to personal growth story, reveals the key technique that enabled the transformation, explains how the technique works, and ends with gratitude and accomplishment check-off.',
    category: templateCategories.PERSONAL,
    bichaurinhoVariant: 25,
    content: `Last [time period], I [milestone achievement] 🥵

It was to [specific reason/context].

The pressure was [intensity description] before [preparation phase].

But once I [arrived/started], everything [emotional shift].

The [environment details], [expectation vs reality], and it felt just like [familiar comparison].

The [authority figure] started [opening challenge/question].

I was [preparation state], and it went [outcome].

This success meant a lot to me because when I was younger, I would [past struggle/limitation].

Then I discovered one tip that changed everything:

[Key technique/strategy].

You [technique explanation].

This helps your [body/mind] understand [benefit].

It stops [negative response].

Your [mental state] stays [positive qualities].

Now I can check "[achievement]" ✅

Thank you [organization/person] for the [opportunity type]!`
  },
  {
    id: 'template-contrarian-success-story',
    title: 'Contrarian Success Story',
    description: 'Opens with quoted conventional wisdom, immediately contradicts it with personal experience, lists specific "rule-breaking" examples, contrasts expectation with dramatic results, shows concrete success metrics, calls out the conventional mindset, invites others to join the unconventional approach, and transitions to a solution for those who want similar results.',
    category: templateCategories.PERSONAL,
    bichaurinhoVariant: 24,
    content: `"[Conventional wisdom/rule]."

Erm, [contradiction]. I've been [doing the opposite] for over [time period].

Literally, in the last [time period] I [action]:

[Rule-breaking example 1]

[Rule-breaking example 2]

[Rule-breaking example 3]

[Rule-breaking example 4]

[Rule-breaking example 5]

[Rule-breaking example 6]

It's funny. Because these things I shouldn't be [doing]?

Changed my life.

[Success metric 1]

[Success metric 2]

[Success metric 3]

ALL because of my [unconventional approach].

So please. Keep [conventional behavior/mindset].

We'll be out here [alternative approach].

[Doing what we want description].

I've experienced [type of growth] on [platform].

([qualifier about expectations])

If you want the same, but you're struggling with:

[Common struggle 1]

[Common struggle 2]

[Common struggle 3]

You'll need a [solution type].`
  },
  {
    id: 'template-problem-solution-product-pitch',
    title: 'Problem-Solution-Product Pitch Framework',
    description: 'Opens with personal struggle narrative, establishes time as the core problem, introduces product as solution, details features with structured benefits, shows transformation results, and closes with binary choice CTA.',
    category: templateCategories.PROMOTIONAL,
    bichaurinhoVariant: 26,
    content: `In my [time period] on [platform], I [wasted/struggled with] [specific challenge].

[Core problem] was my biggest enemy.

[Elaboration of the problem] - [consequence/limitation].

That's why I launched [Product Name], [product description].

Here's what makes it different:

[Feature category 1]:

[Benefit 1]

[Benefit 2]

[Benefit 3]

[Feature category 2]:

[Technical capability 1]

[Technical capability 2]

[Technical capability 3]

[Feature category 3]:

[Implementation step 1]

[Implementation step 2]

[Implementation step 3]

I've transformed my [process] from a [long timeframe] into a [short timeframe].

The results speak for themselves:

[Result 1]

[Result 2]

[Result 3]

Stop letting [obstacle] hold back your [goal].

The choice is simple:

❌ Keep [current painful behavior]...

✅ Or [join others who've achieved desired outcome]: [CTA link]`
  },
  {
    id: 'template-educational-debunking-framework',
    title: 'Educational Debunking Framework',
    description: 'Opens by addressing common misconceptions, establishes credibility through direct contradiction, provides educational breakdown of the truth, includes proof/testing evidence, and closes with authoritative guidance.',
    category: templateCategories.EDUCATIONAL,
    bichaurinhoVariant: 27,
    content: `Let me clear up [number] HUGE myths about [topic].

Because I keep hearing these wild claims everywhere:

"[Myth 1]"

"[Myth 2]"

I even hear "[additional false claim]." [dismissive emoji/expression]

But here's the real truth about [topic]:

You can [do the thing] in [number] ways:

[Method 1]

[Method 2]

Let me break this down:

[Method 1] [works/doesn't work] because:

[Reason 1]

[Reason 2]

[Reason 3]

But [Method 2]? That's different:

[Contrasting point 1]

[Contrasting point 2]

[Contrasting point 3]

Now about that "[myth reference]" myth:

[Authority figure] tested this [himself/herself]:

[Test parameter 1]

[Test parameter 2]

[Result]

The hard truth is:

[Reality statement 1]

[Reality statement 2]

Don't let these myths hold you back.

[Final advice/recommendation] - just make sure [important caveat].`
  },
  {
    id: 'template-educational-secret-sharing-framework',
    title: 'Educational Secret-Sharing Framework',
    description: 'Opens with intriguing secret premise, contradicts common belief, establishes credibility through analysis, reveals the true formula with arrow-pointed elements, adds overlooked insight, provides supporting evidence, shows transformation benefits, and closes with simple directive.',
    category: templateCategories.EDUCATIONAL,
    bichaurinhoVariant: 28,
    content: `The secret behind [high-performing thing]?

It's not about [common belief].

It's about [real factor].

I've analyzed [large quantity], and the ones that [achieve results] follow a simple pattern:

→ [Key element 1]

→ [Key element 2]

→ [Key element 3]

But here's what most people miss:

[Overlooked crucial factor].

Look at any successful [example]:

→ [Supporting detail 1]

→ [Supporting detail 2]

→ [Supporting detail 3]

→ [Supporting detail 4]

The best part?

Once you grasp this [system/structure], [process] becomes [improvement metric].

No more [frustration 1].

No more [frustration 2].

No more [frustration 3].

I've seen [target audience] transform their entire [area] just by following this simple [system].

And the results speak for themselves:

→ [Benefit 1]

→ [Benefit 2]

→ [Benefit 3]

Stop [current ineffective behavior].

Start with [solution].`
  },
  {
    id: 'template-urgency-action-list',
    title: 'Urgency Action List Template',
    description: 'Opens with urgent timeframe hook, provides specific numbered action count, establishes seasonal context and competitive advantage, acknowledges common failure pattern, delivers categorized actionable steps, warns against common mistakes, and closes with encouraging guidance plus engagement question.',
    category: templateCategories.EDUCATIONAL,
    bichaurinhoVariant: 30,
    content: `You have [timeframe] left to [achieve goal].

[Number] concrete actions to take now [directional indicator]

It's [current date/context].

[Seasonal/contextual observation], and while others [common behavior], you're [contrasting action].

We all know the pattern:

[Common failure sequence].

Here are [number] actions to [achieve outcome] [directional indicator]

[𝗖𝗮𝘁𝗲𝗴𝗼𝗿𝘆 𝟭]:

↳ [Action 1]

↳ [Action 2]

↳ [Action 3]

↳ [Action 4]

↳ [Action 5]

[𝗖𝗮𝘁𝗲𝗴𝗼𝗿𝘆 𝟮]:

↳ [Action 1]

↳ [Action 2]

↳ [Action 3]

↳ [Action 4]

↳ [Action 5]

[𝗖𝗮𝘁𝗲𝗴𝗼𝗿𝘆 𝟯]:

↳ [Action 1]

↳ [Action 2]

↳ [Action 3]

↳ [Action 4]

[𝗖𝗮𝘁𝗲𝗴𝗼𝗿𝘆 𝟰]:

↳ [Action 1]

↳ [Action 2]

↳ [Action 3]

I've seen too many [target audience] [common mistake]...

[Elaboration of the mistake pattern].

You don't need to [perfectionist trap] [reassuring emoji]

Start with what [resonates/works] with you the most.

P.S. Which of these [number] actions would you recommend implementing first?

Drop it below [directional indicator]`
  },
  {
    id: 'template-research-based-educational-framework',
    title: 'Research-Based Educational Framework',
    description: 'Opens with contrarian hook, promises data revelation, establishes research credibility, presents structured findings with numbered sections and arrow-point details, emphasizes key principle, adds engagement philosophy, and closes with actionable guidance.',
    category: templateCategories.EDUCATIONAL,
    bichaurinhoVariant: 29,
    content: `The [common assumption] isn't what you think.

Here's what the data reveals about [topic] [directional indicator]

After studying [research scope], I've uncovered some fascinating insights.

The data shows clear patterns across [variables]:

[𝟭. 𝗦𝗲𝗰𝘁𝗶𝗼𝗻 𝟭 𝗛𝗲𝗮𝗱𝗶𝗻𝗴]

↳ [Finding 1]

↳ [Finding 2]

↳ [Finding 3]

[𝟮. 𝗦𝗲𝗰𝘁𝗶𝗼𝗻 𝟮 𝗛𝗲𝗮𝗱𝗶𝗻𝗴]

↳ [Specific insight 1]

↳ [Specific insight 2]

↳ [Specific insight 3]

[𝟯. 𝗦𝗲𝗰𝘁𝗶𝗼𝗻 𝟯 𝗛𝗲𝗮𝗱𝗶𝗻𝗴]

↳ [Strategy 1]

↳ [Strategy 2]

↳ [Strategy 3]

The data is clear: [key principle].

But it's not just about [surface-level factor].

You need to [deeper requirement 1].

You need to [deeper requirement 2].

Because successful [area] isn't just about [obvious factor].

It's about [philosophical principle].

Start with these insights.

Then adapt based on your results.`
  },
  {
    id: 'template-myth-busting-strategy-framework',
    title: 'Myth-Busting Strategy Framework',
    description: 'Opens with uncomfortable truth statement, establishes testing credibility, reveals limited number of proven strategies, provides numbered list with bold headings and explanatory details, and closes with validation of authenticity.',
    category: templateCategories.EDUCATIONAL,
    bichaurinhoVariant: 31,
    content: `Nobody wants to hear this, but most [topic] "[trendy term]" are garbage.

I've tested them all.

And here's what I discovered:

Only [small number] strategies consistently deliver results.

I've personally [validation method 1], [validation method 2], and [validation method 3].

They actually work:

[𝟏. 𝐁𝐨𝐥𝐝 𝐒𝐭𝐫𝐚𝐭𝐞𝐠𝐲 𝐓𝐢𝐭𝐥𝐞]

[Explanation with supporting reasoning]

[𝟐. 𝐁𝐨𝐥𝐝 𝐒𝐭𝐫𝐚𝐭𝐞𝐠𝐲 𝐓𝐢𝐭𝐥𝐞]

[Explanation with supporting reasoning]

[𝟑. 𝐁𝐨𝐥𝐝 𝐒𝐭𝐫𝐚𝐭𝐞𝐠𝐲 𝐓𝐢𝐭𝐥𝐞]

[Explanation with supporting reasoning]

[𝟒. 𝐁𝐨𝐥𝐝 𝐒𝐭𝐫𝐚𝐭𝐞𝐠𝐲 𝐓𝐢𝐭𝐥𝐞]

[Specific tactical guidance]

[𝟓. 𝐁𝐨𝐥𝐝 𝐒𝐭𝐫𝐚𝐭𝐞𝐠𝐲 𝐓𝐢𝐭𝐥𝐞]

[Explanation with supporting reasoning]

[𝟔. 𝐁𝐨𝐥𝐝 𝐒𝐭𝐫𝐚𝐭𝐞𝐠𝐲 𝐓𝐢𝐭𝐥𝐞]

[Explanation with supporting reasoning]

[𝟕. 𝐁𝐨𝐥𝐝 𝐒𝐭𝐫𝐚𝐭𝐞𝐠𝐲 𝐓𝐢𝐭𝐥𝐞]

[Explanation with supporting reasoning]

These aren't [dismissive description] or [dismissive description].

They're [credibility statement] that continue to work.`
  },
  {
    id: 'template-mindset-evolution-comparison',
    title: 'Mindset Evolution Comparison',
    description: 'Opens with timeframe reference and old mindset label, lists the old approach with bullet points, presents binary outcomes with arrow indicators, introduces new mindset with emphasis, provides numbered step-by-step new approach, validates effectiveness with concrete proof, identifies the key factor, and closes with motivational statement about potential impact.',
    category: templateCategories.EDUCATIONAL,
    bichaurinhoVariant: 32,
    content: `[Time period] ago, the mindset was "[old philosophy/approach]".

[Old approach item 1]
[Old approach item 2]  
[Old approach item 3]
[Old approach item 4]
[Old approach item 5]
[Old approach item 6]
[Old approach item 7]
[Old approach item 8]
[Old approach item 9]
[Old approach item 10]

And in the end, [number] things happened:

→ [Outcome option 1 with detailed consequences]

or

→ [Outcome option 2 with detailed consequences]

[Emphasis symbol] The current mindset is about [new core philosophy].

1. [New step 1]
2. [New step 2]
3. [New step 3]
4. [New step 4]
5. [New step 5]
6. [New step 6]
7. [New step 7]
8. [New step 8]
9. [New step 9]
10. [New step 10]

Does it work? [Emphatic affirmation].

[Concrete proof with specific metrics and context].

The secret is in the [key factor]. [Supporting statement about available resources].

[Final motivational statement about transformation potential].`
  },
  {
    id: 'template-priority-misalignment-revelation',
    title: 'Priority Misalignment Revelation',
    description: 'Opens with a contrarian statement about business failure causes, introduces a compelling character example with credentials, describes the contradiction between knowledge and action through a dialogue sequence, uses a visual element for emphasis, provides universal wisdom about self-awareness, poses a reflective challenge question, and closes with an uncomfortable truth acknowledgment.',
    category: templateCategories.EDUCATIONAL,
    bichaurinhoVariant: 33,
    content: `[Contrarian statement about failure cause].

[Real reason for failure].

[Time reference], [interaction description] with [character type].

[Credential/background detail 1],
[credential/background detail 2].

[Character description with positive traits].

But [contradiction/problem description].

I asked:
"[Hypothetical urgent scenario question]?"

[Character] responded without hesitation:
"[Correct priority answer]."

Then I asked:
"[Reality check question about actual behavior]?"

[Character reaction] and said:
"[Wrong priority answer]."

[Visual emphasis symbol]

[Universal truth about knowledge vs action].
[Truth about courage and difficulty].

[Challenge instruction]:
[Self-reflection question]?

Because [uncomfortable truth about self-awareness].`
  },
  {
    id: 'template-experience-based-wisdom-list',
    title: 'Experience-Based Wisdom List',
    description: 'Opens with credibility statement about experience duration, promises a specific number of valuable insights, delivers arrow-bulleted lessons learned, provides philosophical wisdom about time and shortcuts, connects lessons to journey improvement, and closes with engagement question inviting additions.',
    category: templateCategories.PERSONAL,
    bichaurinhoVariant: 34,
    content: `[Activity/profession] for more than [time period] ..

Here are the [number] things that made my [area/journey] [improvement adjective] [directional indicator]

→ [Lesson/insight 1]
→ [Lesson/insight 2]
→ [Lesson/insight 3]
→ [Lesson/insight 4]
→ [Lesson/insight 5]
→ [Lesson/insight 6]
→ [Lesson/insight 7]
→ [Lesson/insight 8]
→ [Lesson/insight 9]
→ [Lesson/insight 10]
→ [Lesson/insight 11]
→ [Lesson/insight 12]
→ [Lesson/insight 13]
→ [Lesson/insight 14]
→ [Lesson/insight 15]
→ [Lesson/insight 16]
→ [Lesson/insight 17]
→ [Lesson/insight 18]
→ [Lesson/insight 19]
→ [Lesson/insight 20]

[Truth about shortcuts/time].

But each lesson, [positive impact statement].

What would you add to this list? [engagement symbol]`
  },
  {
    id: 'template-small-vs-big-advantage-framework',
    title: 'Small vs. Big Advantage Framework',
    description: 'Opens with empowering statement about small business advantages, contrasts big vs. small company dynamics, connects to current trend/technology, provides arrow-bulleted transformation examples, identifies market gap, gives leadership advice, includes paradoxical wisdom, acknowledges early stage timing, reframes the challenge, and closes with universal courage call-to-action.',
    category: templateCategories.EDUCATIONAL,
    bichaurinhoVariant: 35,
    content: `Having a [small entity] is having superpowers.

And the best part is [key advantage behavior].

[Large entities] have more [resources], but [limitation].
Each [process] becomes [obstacle description].

But the small ones? [Advantage 1]. [Advantage 2].

And in the era of [current trend/technology], this is worth gold.
→ [Transformation example 1]
→ [Transformation example 2]  
→ [Transformation example 3]

The reality is that [broad market observation].

But almost nobody knows how to [actually implement/use].

Those who are in [leadership position] need to [provide support action].
[Allow failure behavior].

Because it's in the "[dismissive phrase]"
that often [positive outcome] is born.

We're just at the beginning.

It's not about [fear-based framing].

It's about having courage to [action]
regardless of your [size/status].`
  },
  {
    id: 'template-balance-paradox-framework',
    title: 'Balance Paradox Framework',
    description: 'Opens with role comparison title, introduces the central challenge metaphor, explains the cyclical nature of focus, establishes the impossibility of perfect balance, provides either/or choice examples with varied arrow symbols, offers acceptance statement, shares key discoveries, delivers bullet-pointed insights, and closes with philosophical acceptance of imperfection.',
    category: templateCategories.PERSONAL,
    bichaurinhoVariant: 36,
    content: `[Role A] vs [Role B]

The challenge of [balancing metaphor].

[Activity/profession] is [balancing concept]. 
Sometimes the focus goes to the [aspect A] side. 
Sometimes the energy goes to the [aspect B] side.

And guess what? It will never be possible to deliver 100% on all fronts at the same time.

↳ Either you [option A], or you [option B]
→ Either you [option A], or you [option B]
⤷ Either you [option A], or you [option B]

And that's okay.

What I discovered in these [time period] was simple:

- [Discovery/insight 1].
- [Discovery/insight 2].
- [Discovery/insight 3].

Being [role/profession] is accepting that [metaphor elements] will fall.`
  },
  {
    id: 'template-trend-analysis-with-data-framework',
    title: 'Trend Analysis with Data Framework',
    description: 'Opens with trend observation and provocative question, presents comparative data points with arrow bullets, adds deeper data analysis with contrasting segments, poses interpretive question, provides arrow-bulleted explanations for the trend, makes definitive trend statement, supports with personal research data, lists characteristic behaviors with arrows, concludes with bold prediction and reframes the question from "if" to "when".',
    category: templateCategories.EDUCATIONAL,
    bichaurinhoVariant: 37,
    content: `[Trend/behavior] is becoming fashionable.

Will it be the new normal for [industry/sector]? 

→ [Year 1]: [percentage/metric] of [entities] had [characteristic]
→ [Year 2]: this number jumped to [higher percentage]

But when we look at the [specific segment] breakdown, things become even clearer:

→ Among [segment A], the percentage of [characteristic] remains stuck between [low range]
→ Among [segment B], this number skyrocketed and hit [high percentage] in [year]

What does this show?

↳ [Explanation factor 1]
↳ [Explanation factor 2]
↳ [Explanation factor 3]

The era of [trend protagonists] is gaining traction.

Within [personal research context], I have mapped [large number] [entities]. [percentage]% were created by [trend protagonists] [symbol]

These [protagonists] tend to:
→ [Characteristic behavior 1]
→ [Characteristic behavior 2]
→ [Characteristic behavior 3]
→ [Characteristic behavior 4]

The era of [trend description] has already begun.

The question isn't "[if statement]."
It's "[when statement]."`
  },
  {
    id: 'template-success-case-study-framework',
    title: 'Success Case Study Framework',
    description: 'Opens with intriguing concept question, introduces case study with impressive metrics, provides context setup with initial struggles, details the journey with arrow-bulleted milestones including failures, offers philosophical wisdom about learning, explains the breakthrough moment and model discovery, defines the concept with memorable phrase, breaks down practical components with arrows, emphasizes key success factor, shows dramatic improvement comparison, establishes authority, describes strategic expansion, delivers powerful contrast statement, closes with broader meaning and empowerment message.',
    category: templateCategories.PROMOTIONAL,
    bichaurinhoVariant: 38,
    content: `Have you heard of [concept/business model]?

Meet the case of [person name] with [impressive metric].

Quick context: 
[he/she] started in [year]. No [resource 1], no [resource 2], no [resource 3].
Spent [time period] without [earning/achieving] [basic goal].
And still didn't stop.

→ First [milestone]: [modest result] ([thought reaction])
→ Right after, [setback description]
→ [Mistake description], [consequence], [had to correct]

It hurts. But it teaches.

From [year] to [year] [he/she] focused on learning to [skill 1], [skill 2] and [skill 3].

In [breakthrough year] [he/she] discovered [he/she] had a model in hand: [Model Name].

"[Memorable description/nickname]" 

What does this mean in practice?
→ You are [role 1], [role 2] and [role 3] at the same time
→ Learn to [skill 1], [skill 2], [skill 3], [skill 4]
→ Use [tools/resources] to gain scale
→ Build a [asset type]
→ Monetize directly from your [source]

And most importantly: [key success factor].

[Name] spent years [consistent behavior], [improvement behavior] and [mastery behavior]. [Platform] became [his/her] main vehicle [posting frequency/strategy].

Result?
In [recent year], what took [long timeframe] to [achieve], [he/she] repeated in just [short timeframe].

Today [he/she] is a reference in [country/region] as a case of [Model Name].

Only after validating the method, [he/she] [expansion strategy], supported by [technology], to serve [his/her] own audience.

[He/She] didn't hire [large team metaphor].
[He/She] became the [large team metaphor].

And now, teaches thousands of people to follow the same path.

[Model Name] isn't just about [surface benefit].

It's about freedom to choose how to grow, using [tools] as your team.`
  },
  {
    id: 'template-founder-mistakes-confession-framework',
    title: 'Founder Mistakes Confession Framework',
    description: 'Opens with naive initial belief, reveals universal founder delusion with humor, confesses to making all common mistakes, provides numbered list of detailed mistakes with arrow-bulleted explanations for each, acknowledges the harsh reality of entrepreneurship, includes inspirational quote with formatting, identifies the key differentiator for success, and closes with reframe about persistence over starting.',
    category: templateCategories.PERSONAL,
    bichaurinhoVariant: 39,
    content: `When I [started major endeavor], I thought I would [unrealistic expectation] in [timeframe].

Later I discovered that almost every [person in similar situation] thinks like this :P

And almost everyone makes these mistakes below. I made them all👇🏽

1️⃣ [Mistake category 1]
→ [Specific example with details]
→ [Insight about appearance vs reality]
→ [Consequence warning]

2️⃣ [Mistake category 2]
→ [Specific guidance with numbers/metrics]
→ [Role division explanation]
→ [Core purpose statement]

3️⃣ [Mistake category 3]
→ [Philosophical correction about focus]
→ [What actually matters statement]
→ [Reality check about execution]

4️⃣ [Mistake category 4]
→ [Early stage reality description]
→ [Manual work acceptance]
→ [Logical sequence warning]

5️⃣ [Mistake category 5]
→ [Misconception correction]
→ [Skill vs business distinction]
→ [Negative consequence of easy path]

6️⃣ [Mistake category 6]
↳ [Timing advice with regret framing]
↳ [Expectation setting about initial response]
↳ [Long-term benefit progression]

7️⃣ [Mistake category 7]
→ [Personal experience repetition]
→ [Universal pattern revelation]
→ [Time horizon wisdom]

[Harsh reality statement about the endeavor].

[Metaphor about opposition]. [Amazement about the process].

[Hypothetical about universal knowledge reducing participation]

As [Authority Figure] [adverb] puts it:

"[Inspirational quote line 1]:
[Metric 1]
[Metric 2]  
[Metric 3]"

But those who [achieve success] have one thing in common: [success behavior].

[Endeavor] isn't just about [starting]. It's about [persisting]`
  },
  {
    id: 'template-milestone-achievement-journey',
    title: 'Milestone Achievement Journey',
    description: 'Opens with impressive milestone announcement, provides backstory context with timeline, describes humble beginnings without traditional advantages, explains the origin story and motivation, shares initial simple strategy with specific metrics, reveals organic evolution and market need discovery, describes product creation without typical marketing tactics, shows growth metrics and timeline, clarifies original intention vs. actual outcome, acknowledges dual role development, celebrates the milestone achievement, emphasizes impact over numbers with specific success metrics, adds bonus achievement/recognition, reflects on the journey\'s unexpected nature, and closes with celebratory offer tied to the milestone.',
    category: templateCategories.PROMOTIONAL,
    bichaurinhoVariant: 40,
    content: `This month we will reach [impressive financial milestone] with my [product/service type].

[Time period] ago, I [entered new field/situation] by accident.

No [traditional advantage 1]. No [traditional advantage 2].

Everything started with [initial simple project] to [purpose/goal].
I had just [major life transition] ([reference to proof/link]).

Without [backup plan], I decided to [simple initial strategy] for [price] and [additional simple monetization].

The goal was simple: [basic survival need].

Over time, I realized that [market need observation].

I [created product] called [product name], without [typical marketing element 1], without [typical marketing element 2].
From zero, we reached [growth metric] in [timeframe].

My intention was never to [become stereotype].
My objective was always to [original goal].

But along the way, I also became [unexpected role].

And this month, I hit [milestone] in revenue with this product.

More than the number, what makes me proud is [impact description]. [Specific success percentage] of [audience] [achieved outcome].

And to complete this special month, we were [recognition/achievement], [description of significance] =)

Who would have thought, that [niche concept] would end up on [prestigious platform].

[Celebration emoji] In celebration of this milestone, I will [special offer] with [exclusive benefit].`
  },
  {
    id: 'template-extreme-success-case-analysis',
    title: 'Extreme Success Case Analysis',
    description: 'Opens with impressive quantified achievement, adds shocking constraint detail, introduces personal discovery moment with emotional impact, provides context with specific metrics and business model, establishes that success is systematic not lucky, contrasts typical approach with the successful method, delivers arrow-bulleted process steps with specific platforms and actions, emphasizes timing and efficiency principles, highlights the most interesting aspect, explains the systematic cycle with arrows, shows predictable results with multiple metrics, closes with philosophical wisdom about market value and problem-solving.',
    category: templateCategories.EDUCATIONAL,
    bichaurinhoVariant: 41,
    content: `[He/She] built [impressive number] [achievements] from scratch.

And did this with only [shocking constraint].

When I learned about [Person Name]'s story my mind exploded.
[Impressive metric] per year… without [expected resource]. Almost a "[business model description]".

And it's not luck. It's method.

[Name] doesn't start with "[typical approach]".

[He/She] starts with "[problem-focused approach]".

⤷ [Specific activity 1 with platforms]
⤷ [Specific activity 2 with sources]
⤷ [Specific activity 3 with audience]
⤷ [Specific activity 4 with frequency]
⤷ [Specific activity 5 with simple tool description]

And only after that [builds solution] with [constraint/focus].

No [wasteful behavior description].

The most curious thing?

[He/She] keeps the cycle running non-stop: [step 1] → [step 2] → [step 3] → [step 4] → [step 5] → [step 6].

The result is predictable:
→ [Achievement metric 1]
→ [Achievement metric 2]
→ [Achievement metric 3]

Stories like this remind me of one thing:
[Market truth statement].
[Value proposition statement].`
  },
  {
    id: 'template-contrarian-business-advice-framework',
    title: 'Contrarian Business Advice Framework',
    description: 'Opens with numbered contrarian statement and promise of reasoning, establishes credibility through experience and role, delivers arrow-bulleted detailed explanations for each point with specific challenges, consequences, and real-world context including personal examples where relevant.',
    category: templateCategories.EDUCATIONAL,
    bichaurinhoVariant: 42,
    content: `The [number] worst [category] to [action] in my opinion.

And the reason for each one of them.

Based on what I learned as [role/experience] and [additional credibility] in the last [time period]:

↳ [Bad option 1] → [core problem explanation]. [Consequence 1], [consequence 2] and [consequence 3].

↳ [Bad option 2] → [deceptive appeal explanation], but [reality check]. Without [required resource] or [alternative requirement], [negative outcome].

↳ [Bad option 3] → [fundamental challenge description]. This takes [timeframe], [resource drain] and [risk description] ([personal example with specific details]).

↳ [Bad option 4] → [cost/challenge description] and [loyalty/retention issue]. [Customer behavior], [margin impact] and [timing issue]. This model only works for [exception case].

↳ [Bad option 5] → [structural problem description]: [chicken-and-egg explanation]. It's [negative trait 1], [negative trait 2] and [resource requirement].

↳ [Bad option 6] → [market reality description] exige [heavy requirement] to compete. Without this, [competitive threat description].`
  },
  {
    id: 'template-speed-first-success-story',
    title: 'Speed-First Success Story',
    description: 'Opens with impressive achievement hook combining person, method, and results, establishes the broader trend significance, provides proof statement, details the rapid execution timeline with context, shows concrete results, emphasizes authenticity over hype, breaks down product features with arrows, explains success factors with arrow bullets, shares the simple playbook with dashed bullet points, connects to leadership philosophy with arrows showing cultural impact, and closes with organizational transformation details using arrows for structural changes.',
    category: templateCategories.PROMOTIONAL,
    bichaurinhoVariant: 43,
    content: `This CEO made [product/achievement] in [method/approach] alone and earned [impressive result] in [timeframe].

[Superlative description] case of [concept/trend] in the world.

[Key insight] became the new advantage.

And [proof statement].

In [short timeframe], [Person Name] [took action/risk].
Even with [constraint/context]. 
[He/She] [personally did the work] in [tool/platform].

Result: [specific financial result] in [timeframe].
Without [typical approach]. Just [value description].
[Trend/method] is no longer [dismissive term].

What was in the product:
→ [Feature 1 with details]
→ [Feature 2 with details]
→ [Feature 3 with details]
→ [Feature 4 with details]
→ [Feature 5 with details]
→ [Feature 6 with details]

Why it worked:
⤷ [Success factor 1]
⤷ [Success factor 2]
⤷ [Success factor 3]
⤷ [Success factor 4]

[Name]'s playbook is simple:
- [Step 1 with approach]
- [Step 2 with specifics]
- [Step 3 with timing]
- [Step 4 with attitude]
- [Step 5 with technical details]
- [Step 6 with philosophy]
- [Step 7 with learning approach]

This entrepreneur is one of the biggest cases of [leadership principle].

↳ [Leadership action 1]
↳ [Cultural insight about example vs words]

And [organizational change description]
→ [Old structure] became [new structure]
→ [New process description]`
  },
  {
    id: 'template-honest-reality-check-framework',
    title: 'Honest Reality Check Framework',
    description: 'Opens with specific personal situation and decision, shares internal concerns through questioning format, expresses desire to give idealistic answer, admits to honest reality instead, acknowledges the trade-offs while maintaining overall belief, provides nuanced context with variations, gives concrete counter-example, identifies content gap in the market, calls for more balanced discussion, and closes with engagement request for deeper exploration.',
    category: templateCategories.PERSONAL,
    bichaurinhoVariant: 44,
    content: `I was in [meeting/situation] and my [role/person] asked if [specific question/request].

I said [initial response].

But I kept thinking about the impacts:

- [Concern question 1]?
- [Concern question 2]?
- [Concern question 3]?

I would love to come here and say that [idealistic outcome] and that our [system/approach] [perfect result].

But the truth is that we know the price of [following approach/philosophy]. 

And we continue believing that the balance is positive.

Yes, it varies by [context factor 1]. Varies by [context factor 2]. Varies by [context factor 3].

Our [department/area], for example, [percentage/approach] [specific requirement].

[Constraint description 1], [constraint description 2].

But I miss seeing content that [opens up honestly] around here.

That goes beyond [oversimplification] and discusses how to navigate the pros and cons.

React here on the post if you want me to write a specific post about the real [advantages and disadvantages] we've felt in these years of [experience/company].`
  },
  {
    id: 'template-leadership-philosophy-reversal',
    title: 'Leadership Philosophy Reversal',
    description: 'Opens with contrarian statement about undervalued leadership quality, anticipates and addresses skeptical question, provides surprising answer, shares formative learning experience with key concept definition, describes personal transformation and impact, connects to current organizational growth, acknowledges team expertise superiority, offers multiple forms of support through rhetorical questions, states leadership purpose, and closes with accountability expectation for other leaders.',
    category: templateCategories.PERSONAL,
    bichaurinhoVariant: 45,
    content: `The most underestimated quality of a leader is [contrarian leadership trait].

"But who [does this thing] to you, for example, [Name]?".

[Surprising answer].

When I started in my career they taught me what it means to be "[key concept]".

In other words: [definition/explanation of the concept].

This changed my life.

Made me [positive transformation/pride statement].

And with the growth of [company/organization] I've been noticing that this attitude becomes increasingly important.

The team members have more context and more depth than me in many topics.

And the best I can do is [learn/adapt], and [make myself available].

Need me to be your [tool/resource]?

For me to [specific support action 1]?

For me to [specific support action 2]?

That's what I'm here for.

And it's also the posture I demand from [other leadership level] at [company].`
  },
  {
    id: 'template-startup-journey-reality-framework',
    title: 'Startup Journey Reality Framework',
    description: 'Opens with founding year and journey timeline, details multiple failures and restarts with specific years and contexts, shows growth metrics and apparent success, reveals another near-failure, poses reflective question, delivers arrow-bulleted hard-learned lessons covering emotional, financial, and market realities, provides reassuring perspective about scaling pressure, lists what\'s not required for success, acknowledges that not all startups scale, encourages vulnerability and honesty, and closes with solidarity and reality-check statements.',
    category: templateCategories.PERSONAL,
    bichaurinhoVariant: 46,
    content: `In [year] I founded my first [venture/company]

In [year] I [failed/broke] it for the first time. [Reason/context].

In [year] we started again, [new circumstances]

In [year] [doing specific hard work] we took our "[product/service]" to [metric] in revenue.

At the end of the year, we decided to [kill/restart] our company and start from zero.
Again.

In [year] we hit [higher metric] in revenue with [new approach]. 
Everything seemed to be going well. [Positive description].

In [year] we hit [even higher metric] in revenue with [team description].

In [year] we almost [failed again]. [External cause].

You know what I took from this?

→ [Hard truth about the journey]
→ [Reality about common experience]
→ [Truth about investor behavior]
→ [Emotional difficulty of failure]
→ [Painful consequence of failure]
→ [Universal founder struggle]
→ [Market indifference reality]
→ [Business model learning/flexibility]

Your [venture] doesn't need to [scale expectation]. You don't need to [media recognition].

Your team doesn't need to be from [prestigious institution], and your [key role] doesn't need to come from [prestigious company].

Not every [venture] will [scale] and that's okay. Don't be afraid to tell people about your mistakes. People are too busy to care or judge you.

You're not alone in this. The grass isn't greener on the other side.`
  },
  {
    id: 'template-fast-process-success-story',
    title: 'Fast Process Success Story',
    description: 'Opens with contrarian statement about process efficiency, introduces specific example with impressive timeline, provides concrete proof of speed, establishes the strategic decision moment with date and priority, shows immediate leadership action with role assumption, details systematic acceleration approach, delivers day-by-day timeline breakdown with specific actions and outcomes, acknowledges the successful result with current status, offers future content expansion, and closes with reinforcing principle about speed vs quality misconception.',
    category: templateCategories.ORGANIZATIONAL,
    bichaurinhoVariant: 47,
    content: `[Slow process type] is bad for [affected party] and doesn't improve [quality outcome].

We're doing [process type] in [short timeframe], and [Person Name] was a crazy example.

On the [ordinal] day [he/she] was already at [location/company] working.

On [specific date] of this month, we had a [meeting type] and concluded that [activity] would be the company's biggest priority.

On [date] ([day of week]) my [partner/colleague] had already assumed the role of [new responsibility] (combined with [existing role]).

On [date], we started to accelerate our processes significantly. And without losing quality. It's basically [systematic approach description].

On [date], we interviewed [Name] for the 1st time and it was already [number] interviews.

On [date], [additional action] and [outcome/decision].

On [date], since [contextual event] was happening at [location], we already did [process completion] in [atmosphere description].

And, yes, [he/she] already started working that day ([time reference]).

I can explain in a future post [additional scope/expansion] and how it's been to build this insane [system type] machine.

But today the post was just to show that [process type] don't need to be slow to have quality.`
  },
  {
    id: 'template-david-vs-goliath-validation-story',
    title: 'David vs. Goliath Validation Story',
    description: 'Opens with dramatic scene setting and provocative quote from audience member, provides context about the academic setting and discussion topic, delivers the contrarian Brazilian perspective with cultural insight, transitions to educational analysis with direct address to audience, breaks down systematic reasons why big companies struggle against focused startups using bullet points, provides concrete example of the principle in action, shows long-term validation with impressive metrics, connects to broader success narrative, transitions to content promotion with personal endorsement, and closes with engagement request acknowledging effort invested.',
    category: templateCategories.EDUCATIONAL,
    bichaurinhoVariant: 48,
    content: `[Person] was talking about [Company] at [Prestigious Institution] and a [nationality/demographic] in the audience says: "[Provocative prediction quote]".

[Company] was the case study for the class.
And they were reflecting on the future of the business.

And in the middle of the discussion this [demographic descriptor] (probably the only one in the class) says:

"[Cultural insight quote with prediction]".

People, 

Even large [industry] companies like [Big Company] have difficulty facing the best startups. The reasons?

- [Advantage 1 with specific role comparison].

- [Advantage 2 with specific example and competitor beating bigger player].

- [Advantage 3 with specific constraints like quarterly results and cannibalization concerns].

Some years after that day at [Institution], [Small Company] already surpassed [impressive metric] and is one of the biggest cases of recent years.

And this post doesn't teach even 1% of what [Person] taught me in this [content type] that just came out on our [platform].

It's my favorite [content type] so far, so worth checking out in the comments.

And like this post, please, because it took work to make this [content creation] happen =)`
  },
  {
    id: 'template-behind-the-scenes-explanation',
    title: 'Behind-the-Scenes Explanation',
    description: 'Opens with quoted question about unique business decision, introduces external content creation acknowledging the source, provides simplified answer with bullet-pointed benefits, confirms positive results, shares cost-efficiency insight with specific numbers and location context, explains strategic integration beyond just workspace, promotes full content with platform reference, and closes with engagement request tied to broader industry impact.',
    category: templateCategories.ORGANIZATIONAL,
    bichaurinhoVariant: 49,
    content: `"[Question about unique business decision/approach]?" 

The [external team/creator] made a [content type] about this, answering that question.

But I'll summarize the answer:

- [Benefit 1 for internal stakeholders].
- [Benefit 2 for external stakeholders].  
- [Benefit 3 for specific activities/events].

And, yes, the return is [positive descriptor].

We didn't even invest [amount] per month in [alternative description] in [location].

And this [asset/space] has already become an integral part of our [strategic area] strategy.

I'll leave the link to [platform] with the complete content in the 1st comment.

Leave your like to encourage and have more content like this in [industry/market].`
  },
  {
    id: 'template-scale-realization-moment',
    title: 'Scale Realization Moment',
    description: 'Opens with impressive speaking engagement achievement, reveals lesser-known product strength with authority positioning, provides concrete business impact example with financial metrics, redirects focus from product promotion to personal reflection, lists multiple impact metrics with bullet points showing reach across different channels, connects to deeper business impact with daily user interaction, acknowledges the surreal nature of the achievement, reflects on original vision versus accelerated timeline, and closes with amazement at the speed of realization.',
    category: templateCategories.PERSONAL,
    bichaurinhoVariant: 50,
    content: `Yesterday I spoke at the biggest [industry/topic] event in [country/region] - to [large number] people on the main stage.

Many people don't know, but [company]'s product is a reference in terms of [technology/approach] in practice.

We do and generate real money integrating [specific technology] throughout the platform.

We have, for example, clients who recovered [impressive amount] in [specific use case/metric].

But this post isn't to talk about our product.

And, yes, why it still hasn't sunk in how many people we've impacted:

- [Number] people yesterday on stage
- [Number] following me here  
- [Number] on our [content platform]
- [Number] being reached in my most popular posts
- [Number] [using/buying through] our [service/platform] ([customer relationship description]).

And all these [number] [interact with/use] our [specific feature/service] daily.

Yes I'm writing this post because it's crazy to see this happening.

I always knew we could [create/achieve original vision], but I didn't think it would be so fast.`
  },
  {
    id: 'template-tool-limitation-discovery',
    title: 'Tool Limitation Discovery',
    description: 'Opens with context about frequent activity and tool usage pattern, describes the productivity paradox experienced, details the typical workflow that leads to problems, explains the initial optimistic expectation, reveals the disappointing reality with specific negative outcomes, identifies the core value that gets lost in the process, and closes with decisive action based on the learning.',
    category: templateCategories.PERSONAL,
    bichaurinhoVariant: 51,
    content: `We [do activity] a lot at [company/context]. And the more I've used [tool/technology] for this, the more unproductive I've become.

It starts like this: I need to [think about/work on] [large task/project].

I start the [work], [initial action].

Then I think: "[rationale for using tool]."

I go there, explain what I want to build and start [doing the work] together with it.

At first, I feel like I'm going to save [time amount] of my day using it.

In the end, what comes out is [negative outcome 1], [negative outcome 2] and, mainly, with [core problem] on my side.

That [output] is useless to me. So in the end, I waste time.

The most important part of [activity] is [core value/process]. And with [tool], this gets very limited.

So, I'm abandoning [tool] as a [specific role/function].`
  },
  {
    id: 'template-organizational-change-announcement',
    title: 'Organizational Change Announcement',
    description: 'Opens with change announcement, provides context for the decision, explains the reasoning with bullet points, acknowledges challenges or concerns, outlines implementation timeline, shares expected benefits, addresses team/stakeholder impact, and closes with commitment to transparency.',
    category: templateCategories.ORGANIZATIONAL,
    bichaurinhoVariant: 52,
    content: `[Change announcement statement].

[Context for why this change is happening].

The reasons behind this decision:

• [Primary reason]
• [Secondary reason]
• [Supporting reason]

We know this [acknowledgment of challenges/concerns].

Timeline:
[Phase 1]: [Action/milestone]
[Phase 2]: [Action/milestone]
[Phase 3]: [Action/milestone]

What this means:
→ [Benefit/outcome 1]
→ [Benefit/outcome 2]
→ [Benefit/outcome 3]

For [stakeholder group], this means [specific impact].

We'll keep you updated every step of the way.`
  },
  {
    id: 'template-team-culture-insight',
    title: 'Team Culture Insight',
    description: 'Opens with observation about team behavior or culture, provides specific example or scenario, explains why this matters for the organization, connects to broader business impact, shares how the culture developed, describes what others can learn, and closes with actionable takeaway.',
    category: templateCategories.ORGANIZATIONAL,
    bichaurinhoVariant: 53,
    content: `[Observation about team behavior/culture].

[Specific example or recent scenario].

Why this matters:

[Impact on productivity/quality/satisfaction].

This directly affects [business outcome] because [connection].

How we built this:
1. [Cultural building block 1]
2. [Cultural building block 2]  
3. [Cultural building block 3]

What other [teams/companies] can take from this:

[Actionable insight 1].
[Actionable insight 2].
[Actionable insight 3].

[Key principle or takeaway].`
  },
  {
    id: 'template-operational-efficiency-discovery',
    title: 'Operational Efficiency Discovery',
    description: 'Opens with problem identification, describes previous inefficient state, explains what triggered the search for solution, details the solution or new approach, provides before/after metrics, explains implementation process, shares unexpected benefits, and closes with broader application potential.',
    category: templateCategories.ORGANIZATIONAL,
    bichaurinhoVariant: 54,
    content: `We had a [operational problem/inefficiency].

[Description of previous state/process].

[Trigger event] made us realize we needed to [change/improve].

Our approach:
→ [Solution element 1]
→ [Solution element 2]
→ [Solution element 3]

Results:
Before: [Metric/outcome]
After: [Improved metric/outcome]

Implementation took [timeframe] and involved:
• [Step 1]
• [Step 2]
• [Step 3]

Unexpected bonus: [Additional benefit discovered].

This same approach could work for [broader application/other areas].`
  },
  {
    id: 'template-decision-making-framework-reveal',
    title: 'Decision-Making Framework Reveal',
    description: 'Opens with decision-making challenge, introduces the framework used, breaks down each step of the process, provides real example of framework in action, explains why each step matters, shares common pitfalls to avoid, describes team adoption process, and closes with framework accessibility or sharing.',
    category: templateCategories.ORGANIZATIONAL,
    bichaurinhoVariant: 55,
    content: `[Decision-making challenge we faced].

We developed a [framework name/type] to handle this.

The process:

Step 1: [Action/analysis]
Step 2: [Action/analysis]
Step 3: [Action/analysis]
Step 4: [Action/analysis]

Real example:
[Scenario] → [Applied step 1] → [Applied step 2] → [Applied step 3] → [Applied step 4] → [Outcome]

Why each step matters:
• [Step importance 1]
• [Step importance 2]
• [Step importance 3]
• [Step importance 4]

Common mistakes we avoid:
× [Pitfall 1]
× [Pitfall 2]
× [Pitfall 3]

Getting the team to adopt this took [approach/timeframe].

[Framework availability/sharing statement].`
  },
  {
    id: 'template-resource-allocation-philosophy',
    title: 'Resource Allocation Philosophy',
    description: 'Opens with resource allocation challenge or principle, explains the philosophy or approach taken, provides specific allocation criteria, gives examples of difficult decisions made, explains the trade-offs involved, describes how priorities are evaluated, shares results or outcomes, and closes with broader principle application.',
    category: templateCategories.ORGANIZATIONAL,
    bichaurinhoVariant: 56,
    content: `[Resource allocation challenge/principle statement].

Our philosophy: [Core approach/principle].

How we decide:
1. [Criteria 1] - [Weight/importance]
2. [Criteria 2] - [Weight/importance]
3. [Criteria 3] - [Weight/importance]

Tough decisions we've made:
• [Decision 1]: [Reasoning]
• [Decision 2]: [Reasoning]
• [Decision 3]: [Reasoning]

The trade-offs:
[What we gain] vs [What we sacrifice]

Priority evaluation happens [frequency/process].

Results so far:
→ [Outcome 1]
→ [Outcome 2]
→ [Outcome 3]

This same thinking applies to [broader applications].

[Principle/philosophy summary].`
  },
  {
    id: 'template-event-success-celebration',
    title: 'Event Success Celebration',
    description: 'Opens with enthusiastic event announcement and attendance metrics, introduces what made the event special, provides numbered list of key highlights with specific acknowledgments and gratitude expressions, includes partnership recognitions, describes valuable outcomes achieved, teases future announcements, and closes with gratitude and forward-looking enthusiasm.',
    category: templateCategories.ORGANIZATIONAL,
    bichaurinhoVariant: 57,
    content: `What a [superlative] event we had [timeframe]! We brought together [impressive number] [target audience/companies] [working on/building] [topic/platform].

It was special for several reasons:

1. [Venue/location highlight] - [additional context/reference] - thank you [names] for [specific contribution].

2. [Key speaker/guest presence] - [credentials/title]. [Why they were perfect for this]. Thank you for [participation], [name]!

3. [Panel/session description] with [number] [participant type] [building/doing] [relevant work] ([relationship to organizer]). [Names and companies]. Thank you [group reference], for [contribution]!

4. [Partnership highlight] with [partner organization], led by [partner representative]. Thank you so much for [support type] here.

5. [Valuable outcome 1] between [participant groups] with [shared challenges/interests].

6. [Future tease] that we're going to [launch/announce] [timeframe].

What a day! Thank you to everyone who was there! Bring on more!`
  },
  {
    id: 'template-product-feature-announcement',
    title: 'Product Feature Announcement',
    description: 'Opens with feature announcement and excitement indicator, establishes learning context from related concept, explains the underlying principle and benefits, connects the principle to current product domain, announces the automatic implementation, contrasts past manual process with new automatic approach, lists multiple benefits with icons, provides concrete real-world example with visual proof, addresses opt-out scenario with simple instructions, and maintains technical precision throughout.',
    category: templateCategories.PROMOTIONAL,
    bichaurinhoVariant: 58,
    content: `Today, we're making [product/service] more [improvement adjective] [emoji]

The [related concept/format] taught us an important lesson:

[Core principle explanation with technical context and benefits].

The same happens with [current domain/product area].

That's why, every [product action] will have [new feature/capability] by default starting today.

[Past state icon] In the past, you had to [manual process description].

[New state icon] Now, [product name] will automatically [new automatic process].

There are many benefits to this...

[Benefit icon] [Benefit 1]
[Benefit icon] [Benefit 2]  
[Benefit icon] [Benefit 3]

Let's take a real-life [example type] from [company/source]. This will now automatically [demonstrate new capability], without any [complexity/effort] (see [proof type] below).

[Stop hand emoji] What if you want to opt out?

[Simple opt-out instructions].`
  },
  {
    id: 'template-team-addition-announcement',
    title: 'Team Addition Announcement',
    description: 'Opens with exciting team expansion announcement, introduces new team members with bullet-pointed names, provides context about their previous company and relevant expertise, explains why their background makes them valuable, presents detailed individual profiles with numbered sections, includes specific achievements and experience highlights, provides links to their profiles or work, and maintains professional tone throughout while emphasizing the value they bring to the organization.',
    category: templateCategories.ORGANIZATIONAL,
    bichaurinhoVariant: 59,
    content: `This [timeframe], we have [number] [new team members] officially joining the team!

• [Name 1]
• [Name 2]

At [Previous Company] ([notable credential/achievement]) they mastered [relevant skill/challenge], and we're thrilled to welcome them to the team.

1. [Name 1]

[He/She] was the [previous role] of [company], and before that, [he/she] [previous experience/achievement].

[He/She] [specific accomplishment or expertise demonstration].

[Profile link or additional reference]

2. [Name 2]

Before [current company], [he/she] was the [previous role] of [company], and before that, [he/she] was [earlier role] at [company].

[He/She]'s also [additional credential/achievement/publication].

[Profile link or additional reference]`
  },
  {
    id: 'template-industry-observation-insight',
    title: 'Industry Observation Insight',
    description: 'Opens with industry observation, provides supporting evidence or examples, explains why this matters now, connects to broader implications, offers practical advice, shares personal perspective, and closes with thought-provoking question.',
    category: templateCategories.EDUCATIONAL,
    bichaurinhoVariant: 60,
    content: `I've been noticing [industry trend/pattern] lately.

[Supporting evidence or specific examples].

This matters because [current context/timing].

What this really means:
→ [Implication 1]
→ [Implication 2]
→ [Implication 3]

My advice? [Practical recommendation].

From what I've seen, [personal perspective/experience].

What are you seeing in your [industry/field]?`
  },
  {
    id: 'template-learning-journey-share',
    title: 'Learning Journey Share',
    description: 'Opens with learning challenge or goal, describes the journey with obstacles, shares key discoveries, explains how thinking changed, provides actionable takeaways, acknowledges ongoing learning, and invites others to share their experiences.',
    category: templateCategories.PERSONAL,
    bichaurinhoVariant: 61,
    content: `I set out to learn [skill/topic] [timeframe] ago.

Thought it would be [initial expectation].

Boy, was I wrong.

The real challenge wasn't [expected difficulty].
It was [actual challenge discovered].

Three things that changed my perspective:

1. [Learning/realization 1]
2. [Learning/realization 2]
3. [Learning/realization 3]

Now I approach [related situations] completely differently.

Still learning, but these insights have been game-changers.

What's something you learned recently that surprised you?`
  },
  {
    id: 'template-client-success-highlight',
    title: 'Client Success Highlight',
    description: 'Opens with client achievement, provides context about their situation, explains the challenge they faced, describes the solution or approach, shares specific results, explains what made the difference, gives credit to the client, and connects to broader lesson.',
    category: templateCategories.PROMOTIONAL,
    bichaurinhoVariant: 62,
    content: `[Client name/type] just [achieved impressive result].

When we started working together, they were [initial situation/challenge].

The main obstacle? [Specific problem they faced].

Here's what we focused on:
• [Solution element 1]
• [Solution element 2]
• [Solution element 3]

Results after [timeframe]:
→ [Specific metric/improvement 1]
→ [Specific metric/improvement 2]
→ [Specific metric/improvement 3]

What made the difference? [Key success factor].

All credit goes to [client] for [their contribution/commitment].

This reinforced something important: [Broader lesson/principle].`
  },
  {
    id: 'template-workflow-optimization-story',
    title: 'Workflow Optimization Story',
    description: 'Opens with workflow problem, describes the pain points, explains the solution discovery process, details the new approach, provides before/after comparison, shares team adoption experience, and offers the solution to others.',
    category: templateCategories.ORGANIZATIONAL,
    bichaurinhoVariant: 63,
    content: `Our [process/workflow] was driving everyone crazy.

The problems:
• [Pain point 1]
• [Pain point 2]
• [Pain point 3]

We tried [previous attempted solutions] but nothing stuck.

Then [team member/source] suggested [new approach].

The new workflow:
1. [Step 1]
2. [Step 2]
3. [Step 3]
4. [Step 4]

Before vs After:
[Metric 1]: [Old state] → [New state]
[Metric 2]: [Old state] → [New state]

Team adoption was [description of how it went].

If you're dealing with similar [workflow issues], happy to share more details.`
  },
  {
    id: 'template-market-shift-analysis',
    title: 'Market Shift Analysis',
    description: 'Opens with market change observation, provides evidence of the shift, explains driving forces, analyzes implications for different stakeholders, offers strategic recommendations, shares personal positioning, and invites discussion.',
    category: templateCategories.EDUCATIONAL,
    bichaurinhoVariant: 64,
    content: `The [market/industry] is shifting faster than most people realize.

Evidence:
→ [Data point/example 1]
→ [Data point/example 2]
→ [Data point/example 3]

What's driving this?
[Primary force 1]: [Explanation]
[Primary force 2]: [Explanation]

This means different things for different players:

For [stakeholder group 1]: [Impact/opportunity]
For [stakeholder group 2]: [Impact/opportunity]
For [stakeholder group 3]: [Impact/opportunity]

Strategic moves to consider:
• [Recommendation 1]
• [Recommendation 2]
• [Recommendation 3]

We're positioning ourselves by [personal/company strategy].

How are you adapting to these changes?`
  },
  {
    id: 'template-personal-milestone-reflection',
    title: 'Personal Milestone Reflection',
    description: 'Opens with milestone achievement, reflects on the journey, shares what was learned along the way, acknowledges people who helped, explains what this milestone means, discusses next goals, and expresses gratitude.',
    category: templateCategories.PERSONAL,
    bichaurinhoVariant: 65,
    content: `Just hit [milestone/achievement].

[Timeframe] ago, this felt [impossible/distant/challenging].

The journey taught me:

[Lesson 1]: [Brief explanation]
[Lesson 2]: [Brief explanation]
[Lesson 3]: [Brief explanation]

Couldn't have done this without:
• [Person/group 1] - [Their contribution]
• [Person/group 2] - [Their contribution]
• [Person/group 3] - [Their contribution]

This milestone means [personal significance].

Next up: [Future goal/direction].

Grateful for everyone who's been part of this journey.

What milestone are you working toward?`
  },
  {
    id: 'template-product-behind-scenes',
    title: 'Product Behind-the-Scenes',
    description: 'Opens with product feature or decision, explains the hidden complexity, describes the decision-making process, shares what users don\'t see, explains trade-offs made, reveals interesting technical details, and connects to user benefits.',
    category: templateCategories.PROMOTIONAL,
    bichaurinhoVariant: 66,
    content: `That [simple feature/interaction] in [product]?

It's way more complex than it looks.

Behind the scenes:
[Hidden complexity 1]
[Hidden complexity 2]
[Hidden complexity 3]

The decision process involved:
• [Consideration 1]
• [Consideration 2]
• [Consideration 3]

What users don't see:
→ [Technical detail 1]
→ [Technical detail 2]
→ [Technical detail 3]

We chose [approach] over [alternative] because [reasoning].

The trade-off? [What we sacrificed for what benefit].

All this complexity exists for one reason: [User benefit].

Sometimes the best user experiences require the most work behind the scenes.`
  },
  {
    id: 'template-team-challenge-solution',
    title: 'Team Challenge Solution',
    description: 'Opens with team challenge, describes impact on work, explains solution discovery, details implementation approach, shares results and team feedback, explains what made it work, and offers to help others facing similar issues.',
    category: templateCategories.ORGANIZATIONAL,
    bichaurinhoVariant: 67,
    content: `Our team was struggling with [specific challenge].

It was affecting [work impact/team morale].

We knew something had to change.

After trying [previous attempts], we discovered [solution approach].

Implementation:
Week 1: [Action taken]
Week 2: [Action taken]
Week 3: [Action taken]

Results:
✅ [Positive outcome 1]
✅ [Positive outcome 2]
✅ [Positive outcome 3]

Team feedback: "[Quote or paraphrase of team response]"

What made this work:
• [Success factor 1]
• [Success factor 2]
• [Success factor 3]

If your team is facing [similar challenges], I'm happy to share more about our approach.`
  },
  {
    id: 'template-skill-development-guide',
    title: 'Skill Development Guide',
    description: 'Opens with skill importance, explains why it matters now, breaks down the learning path, shares practical exercises, provides resource recommendations, addresses common obstacles, and encourages action.',
    category: templateCategories.EDUCATIONAL,
    bichaurinhoVariant: 68,
    content: `[Skill] is becoming essential for [target audience].

Here's why it matters more than ever:
[Reason 1]: [Brief explanation]
[Reason 2]: [Brief explanation]

The learning path I recommend:

Phase 1: [Foundation level]
• [Learning activity 1]
• [Learning activity 2]

Phase 2: [Intermediate level]
• [Learning activity 1]
• [Learning activity 2]

Phase 3: [Advanced level]
• [Learning activity 1]
• [Learning activity 2]

Practical exercises:
→ [Exercise 1]
→ [Exercise 2]
→ [Exercise 3]

Best resources:
• [Resource 1]
• [Resource 2]
• [Resource 3]

Common obstacles and how to overcome them:
[Obstacle 1]: [Solution]
[Obstacle 2]: [Solution]

Start with [specific first step]. You'll be surprised how quickly you progress.`
  },
  {
    id: 'template-personal-philosophy-share',
    title: 'Personal Philosophy Share',
    description: 'Opens with philosophy statement, explains how it developed, provides examples of application, shares benefits experienced, acknowledges when it\'s challenging, explains evolution over time, and invites others to share their principles.',
    category: templateCategories.PERSONAL,
    bichaurinhoVariant: 69,
    content: `I live by this principle: [Core philosophy/belief].

This came from [origin story/experience that shaped it].

How I apply it:

In [context 1]: [Specific application]
In [context 2]: [Specific application]
In [context 3]: [Specific application]

The benefits I've experienced:
• [Benefit 1]
• [Benefit 2]
• [Benefit 3]

Not gonna lie - it's challenging when [difficult situation].

But even then, [how principle helps or applies].

This philosophy has evolved over [timeframe]. Started as [original form], now it's [current form].

The core remains: [Essential element].

What principle guides your decisions?`
  },
  {
    id: 'template-system-sharing-framework',
    title: 'System Sharing Framework',
    description: 'Opens with engaging offer to share system for free, introduces the system structure with numbered phases, breaks down each phase with bullet points and focus explanation, connects phases with feedback loops, provides system flow summary, adds personal philosophy disclaimer, acknowledges different approaches, and encourages experimentation.',
    category: templateCategories.EDUCATIONAL,
    bichaurinhoVariant: 70,
    content: `Want to [achieve goal/skill]?

Copy my system! For free!!!

The system has [number] phases:

- [Phase 1]
- [Phase 2]  
- [Phase 3]

1) Things start with [Phase 1]:

- [Activity 1]
- [Activity 2]
- [Activity 3]

The focus of [Phase 1] is [core objective and scope].

2) [Phase 2] is the [description/difficulty level]:

- [Step 1] ([additional detail])
- [Step 2]
- [Step 3] ([conditional note])
- [Step 4] ([conditional note])
- [Step 5] ([requirement level])

The focus in [Phase 2] is [key principle].

[Key insight 1].
[Key insight 2].
[Key insight 3].

3) [Phase 3] for [target/audience]:

- [Validation point]
- [Iteration instruction]
- [Success action]
- [Distribution strategy]
- [Feedback collection and loop back]

Only in [Phase 3] do you [validate/achieve core goal].
The more you [action], the higher the chance of [success].

So, the system becomes:

[Phase 1] -> [Phase 2] -> [Phase 3] -> [Phase 1] ...

Let me open a parenthesis here at the end.

I'm in favor of [personal philosophy/approach].
I'm on the team: [philosophy summary].

Nothing against those who think differently.

Test and discover what works best for you!`
  },
  {
    id: 'template-complete-business-case-study',
    title: 'Complete Business Case Study',
    description: 'Opens with impressive achievement and methodology teaser, references visual proof, provides context and background story, breaks down chronological milestones with arrows, details investment breakdown, explains practical implementation process, contrasts what they don\'t have vs what they do have, shares lessons learned, outlines future plans, connects to broader mission, provides key learnings with arrows, reduces to core requirements, emphasizes content strategy importance, expresses gratitude, and closes with soft call-to-action.',
    category: templateCategories.PROMOTIONAL,
    bichaurinhoVariant: 71,
    content: `From 0 to [impressive number] [target customers] via [platform] in [timeframe].

Without [resource 1] and without [resource 2]. How I did it 👇 

In the [visual reference] below you can see [proof elements] and [timeline references].

Just to summarize the beginning and give context:

In [month] my [partner/connection] ([relationship]) called me to [opportunity description].

I knew the [market/industry] from my experience at [previous company].
And I had a [strategy/thesis] about [acquisition channel].
We decided to start and test for [timeframe].

→ Now let's go to what happened:

1) [Milestone 1] on [date].
2) [Milestone 2] on [date].
3) [Milestone 3] on [date].
4) [Milestone 4] on [date].
5) [Milestone 5] on [date].

→ How much did we spend on [category]?

1) [Expense 1]: [Amount] ([result note])
2) [Expense 2]: [Amount]
3) [Expense 3]: [Amount]
4) [Expense 4]: [Amount]
5) Total: [Total amount]

→ What did we do in practice?

1) [Process step 1].
2) [Process step 2].
3) [Process step 3].
4) [Process step 4].
5) [Process step 5].
6) [Process step 6].
7) [Process step 7].
8) [Process step 8].
9) [Process step 9].
10) [Process step 10].

→ What we don't have?

1) [Missing element 1].
2) [Missing element 2].
3) [Missing element 3].
4) [Missing element 4].
5) [Missing element 5].
6) [Missing element 6].
7) [Anything that takes away focus].

→ What we do have?

1) [Essential element 1].
2) [Essential element 2].
3) [Essential element 3].
4) [Essential element 4].
5) [Essential element 5].
6) [Essential element 6].
7) [Essential element 7].

→ What would I do differently?

1) [Main regret/learning].

[Elaboration on the learning and its importance].

[Impact statement about the work/mission].

→ What are the next steps?

1) [Future strategy explanation].

[Specific channels/tactics mentioned].

Anyway...

[Mission statement about the work].

[Business description - benefits].
But, above all, [impact on people].

→ To leave as learning:

You can sell almost anything to anyone through [platform]. Whether [target type 1], [target type 2], [target type 3].

But you think you need to plan every detail.
You think you need to have [complex requirement 1].
You think you need to have [complex requirement 2].

→ But you only need two things:

1) [Simple requirement 1].
2) [Simple requirement 2].

[Percentage]% of our strategy base is [core element].
Take this into consideration for your business.

[Core element] [benefit 1].
[Core element] [benefit 2].

Thank you to those who follow and support.
Thank you to those who trusted and are already our clients.

PS: [soft call-to-action]? [contact invitation] 👋`
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
