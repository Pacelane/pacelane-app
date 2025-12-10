import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface LinkedInPost {
  id: string;
  content: string;
  publishedAt: string;
  engagement: {
    likes: number;
    comments: number;
    shares: number;
  };
  url: string;
  author?: {
    name: string;
    profileUrl: string;
    imageUrl: string;
  };
}

interface LinkedInReaction {
  id: string;
  action: string;
  postId: string;
  postContent: string;
  postUrl: string;
  postAuthor: {
    name: string;
    linkedinUrl: string;
    info?: string;
  };
  reactionType: string;
  timestamp: number;
  date: string;
}

interface ReactionsData {
  totalReactions: number;
  topAuthors: Array<{
    name: string;
    linkedinUrl: string;
    info?: string;
    reactionCount: number;
  }>;
  reactionTypes: {
    like: number;
    love: number;
    support: number;
    celebrate: number;
    insight: number;
    funny: number;
  };
  monthlyReactions: Array<{
    month: string;
    reactions: number;
  }>;
  topReactedPosts: Array<{
    postContent: string;
    postAuthor: string;
    postUrl: string;
    reactionCount: number;
  }>;
}

interface WrappedData {
  totalPosts: number;
  totalEngagement: number;
  totalWords: number;
  averageEngagementPerPost: number;
  topPosts: LinkedInPost[];
  postingFrequency: {
    postsPerMonth: number;
    mostActiveMonth?: string;
    leastActiveMonth?: string;
  };
  engagementStats: {
    totalLikes: number;
    totalComments: number;
    totalShares: number;
    avgLikesPerPost: number;
    avgCommentsPerPost: number;
    avgSharesPerPost: number;
  };
  contentInsights: {
    averagePostLength: number;
    mostUsedHashtags: string[];
    topTopics: string[];
  };
  yearInReview: {
    year: number;
    monthlyBreakdown: Array<{
      month: string;
      posts: number;
      totalEngagement: number;
    }>;
  };
  reactionsData?: ReactionsData;
  profileImage?: string;
}

/**
 * Process reactions data to create insights
 */
function processReactionsData(reactions: LinkedInReaction[]): ReactionsData {
  const currentYear = new Date().getFullYear();
  
  console.log(`[processReactionsData] Processing ${reactions.length} reactions...`);
  
  // Filter reactions from current year
  const yearReactions = reactions.filter(reaction => {
    if (reaction.timestamp) {
      const reactionYear = new Date(reaction.timestamp).getFullYear();
      return reactionYear >= currentYear - 1; // Include last year too
    }
    return true;
  });

  console.log(`[processReactionsData] Reactions after year filter: ${yearReactions.length}`);

  // Count reactions by author
  const authorCounts: Record<string, {
    name: string;
    linkedinUrl: string;
    info?: string;
    count: number;
  }> = {};

  // Count reaction types
  const reactionTypeCounts = {
    like: 0,
    love: 0,
    support: 0,
    celebrate: 0,
    insight: 0,
    funny: 0
  };

  // Monthly breakdown
  const monthlyData: Record<string, number> = {};

  // Posts that received reactions (to find most reacted posts)
  const postReactionCounts: Record<string, {
    content: string;
    author: string;
    url: string;
    count: number;
  }> = {};

  yearReactions.forEach(reaction => {
    // Count by author
    const authorKey = reaction.postAuthor.linkedinUrl || reaction.postAuthor.name;
    if (!authorCounts[authorKey]) {
      authorCounts[authorKey] = {
        name: reaction.postAuthor.name,
        linkedinUrl: reaction.postAuthor.linkedinUrl,
        info: reaction.postAuthor.info,
        count: 0
      };
    }
    authorCounts[authorKey].count++;

    // Count reaction types from action string
    const actionLower = reaction.action?.toLowerCase() || '';
    if (actionLower.includes('like')) reactionTypeCounts.like++;
    else if (actionLower.includes('love')) reactionTypeCounts.love++;
    else if (actionLower.includes('support')) reactionTypeCounts.support++;
    else if (actionLower.includes('celebrate') || actionLower.includes('praise')) reactionTypeCounts.celebrate++;
    else if (actionLower.includes('insight') || actionLower.includes('insightful')) reactionTypeCounts.insight++;
    else if (actionLower.includes('funny')) reactionTypeCounts.funny++;
    else reactionTypeCounts.like++; // Default to like

    // Monthly breakdown
    if (reaction.timestamp) {
      const month = new Date(reaction.timestamp).toLocaleString('en-US', { month: 'long' });
      monthlyData[month] = (monthlyData[month] || 0) + 1;
    }

    // Count reactions per post
    const postKey = reaction.postId || reaction.postUrl;
    if (!postReactionCounts[postKey]) {
      postReactionCounts[postKey] = {
        content: reaction.postContent || '',
        author: reaction.postAuthor.name,
        url: reaction.postUrl,
        count: 0
      };
    }
    postReactionCounts[postKey].count++;
  });

  // Get top authors
  const topAuthors = Object.values(authorCounts)
    .sort((a, b) => b.count - a.count)
    .slice(0, 10)
    .map(author => ({
      name: author.name,
      linkedinUrl: author.linkedinUrl,
      info: author.info,
      reactionCount: author.count
    }));

  // Get top reacted posts
  const topReactedPosts = Object.values(postReactionCounts)
    .sort((a, b) => b.count - a.count)
    .slice(0, 5)
    .map(post => ({
      postContent: post.content.substring(0, 200) + (post.content.length > 200 ? '...' : ''),
      postAuthor: post.author,
      postUrl: post.url,
      reactionCount: post.count
    }));

  // Monthly breakdown
  const monthlyReactions = Object.entries(monthlyData)
    .map(([month, count]) => ({
      month,
      reactions: count
    }))
    .sort((a, b) => {
      const months = ['January', 'February', 'March', 'April', 'May', 'June', 
                     'July', 'August', 'September', 'October', 'November', 'December'];
      return months.indexOf(a.month) - months.indexOf(b.month);
    });

  const result: ReactionsData = {
    totalReactions: yearReactions.length,
    topAuthors,
    reactionTypes: reactionTypeCounts,
    monthlyReactions,
    topReactedPosts
  };

  console.log(`[processReactionsData] Processed:`, {
    totalReactions: result.totalReactions,
    topAuthorsCount: result.topAuthors.length,
    topReactedPostsCount: result.topReactedPosts.length
  });

  return result;
}

/**
 * Process posts to create wrapped data
 */
function processWrappedData(posts: LinkedInPost[], reactionsData?: ReactionsData): WrappedData {
  const currentYear = new Date().getFullYear();
  const countWords = (text: string | undefined) =>
    text ? text.trim().split(/\s+/).filter(Boolean).length : 0;
  
  console.log(`[processWrappedData] Total posts received: ${posts.length}`);
  
  // Log sample post structure for debugging
  if (posts.length > 0) {
    console.log(`[processWrappedData] Sample post:`, JSON.stringify(posts[0], null, 2));
  }
  
  // Filter posts from current year
  const yearPosts = posts.filter(post => {
    if (post.publishedAt) {
      const postYear = new Date(post.publishedAt).getFullYear();
      return postYear === currentYear; // Only current year
    }
    return false; // Exclude if no date to be safe
  });

  console.log(`[processWrappedData] Posts after year filter: ${yearPosts.length}`);

  // Calculate engagement stats
  let totalLikes = 0;
  let totalComments = 0;
  let totalShares = 0;
  let totalLength = 0;
  let totalWords = 0;
  const hashtagCounts: Record<string, number> = {};
  const monthlyData: Record<string, { posts: number; engagement: number }> = {};

  yearPosts.forEach(post => {
    totalLikes += post.engagement?.likes || 0;
    totalComments += post.engagement?.comments || 0;
    totalShares += post.engagement?.shares || 0;
    totalLength += post.content?.length || 0;
    totalWords += countWords(post.content);

    // Extract hashtags
    const hashtags = post.content?.match(/#\w+/g) || [];
    hashtags.forEach(tag => {
      hashtagCounts[tag] = (hashtagCounts[tag] || 0) + 1;
    });

    // Monthly breakdown
    if (post.publishedAt) {
      const month = new Date(post.publishedAt).toLocaleString('en-US', { month: 'long' });
      if (!monthlyData[month]) {
        monthlyData[month] = { posts: 0, engagement: 0 };
      }
      monthlyData[month].posts++;
      monthlyData[month].engagement += (post.engagement?.likes || 0) + 
                                        (post.engagement?.comments || 0) + 
                                        (post.engagement?.shares || 0);
    }
  });

  const totalPosts = yearPosts.length;
  const totalEngagement = totalLikes + totalComments + totalShares;

  console.log(`[processWrappedData] Engagement totals: likes=${totalLikes}, comments=${totalComments}, shares=${totalShares}`);

  // Sort posts by likes for top posts
  const sortedByEngagement = [...yearPosts].sort((a, b) =>{
    const likesA = a.engagement?.likes || 0;
    const likesB = b.engagement?.likes || 0;
    // If likes are equal, sort by date (newest first)
    if (likesA === likesB) {
      const dateA = a.publishedAt ? new Date(a.publishedAt).getTime() : 0;
      const dateB = b.publishedAt ? new Date(b.publishedAt).getTime() : 0;
      return dateB - dateA;
    }
    return likesB - likesA; // Sort by likes descending
  });

  // Get top 5 posts (already sorted by likes descending)
  const topPosts = sortedByEngagement.slice(0, 5);

  // Log top posts for debugging
  console.log(`[processWrappedData] Top 5 posts:`, topPosts.map((p, i) => ({
    index: i + 1,
    date: p.publishedAt,
    likes: p.engagement?.likes,
    comments: p.engagement?.comments,
    shares: p.engagement?.shares,
    totalEngagement: (p.engagement?.likes || 0) + (p.engagement?.comments || 0) + (p.engagement?.shares || 0)
  })));

  // Sort hashtags by frequency
  const sortedHashtags = Object.entries(hashtagCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10)
    .map(([tag]) => tag);

  // Monthly breakdown
  const monthlyBreakdown = Object.entries(monthlyData)
    .map(([month, data]) => ({
      month,
      posts: data.posts,
      totalEngagement: data.engagement
    }))
    .sort((a, b) => {
      const months = ['January', 'February', 'March', 'April', 'May', 'June', 
                     'July', 'August', 'September', 'October', 'November', 'December'];
      return months.indexOf(a.month) - months.indexOf(b.month);
    });

  // Find most and least active months
  const sortedMonths = [...monthlyBreakdown].sort((a, b) => b.posts - a.posts);
  const mostActiveMonth = sortedMonths[0]?.month;
  const leastActiveMonth = sortedMonths[sortedMonths.length - 1]?.month;

  // Calculate posts per month
  const monthsWithPosts = monthlyBreakdown.filter(m => m.posts > 0).length;
  const postsPerMonth = monthsWithPosts > 0 ? totalPosts / monthsWithPosts : 0;

  // Extract profile image from the first post if available
  const profileImage = posts.length > 0 && posts[0].author ? posts[0].author.imageUrl : undefined;

  const result: WrappedData = {
    totalPosts,
    totalEngagement,
    totalWords,
    averageEngagementPerPost: totalPosts > 0 ? Math.round(totalEngagement / totalPosts) : 0,
    topPosts,
    postingFrequency: {
      postsPerMonth: Math.round(totalPosts / 12 * 10) / 10,
      mostActiveMonth: Object.entries(monthlyData).sort((a, b) => b[1].posts - a[1].posts)[0]?.[0],
      leastActiveMonth: Object.entries(monthlyData).sort((a, b) => a[1].posts - b[1].posts)[0]?.[0]
    },
    engagementStats: {
      totalLikes,
      totalComments,
      totalShares,
      avgLikesPerPost: totalPosts > 0 ? Math.round(totalLikes / totalPosts) : 0,
      avgCommentsPerPost: totalPosts > 0 ? Math.round(totalComments / totalPosts) : 0,
      avgSharesPerPost: totalPosts > 0 ? Math.round(totalShares / totalPosts) : 0
    },
    contentInsights: {
      averagePostLength: totalPosts > 0 ? Math.round(totalLength / totalPosts) : 0,
      mostUsedHashtags: Object.entries(hashtagCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([tag]) => tag),
      topTopics: [] // Placeholder for now
    },
    yearInReview: {
      year: currentYear,
      monthlyBreakdown
    },
    reactionsData: reactionsData,
    profileImage
  };
  
  console.log(`[processWrappedData] Final result:`, {
    totalPosts: result.totalPosts,
    totalEngagement: result.totalEngagement,
    topPostsCount: result.topPosts.length,
    engagementStats: result.engagementStats
  });

  return result;
}

serve(async (req) => {
  console.log(`[${new Date().toISOString()}] Lead LinkedIn Wrapped: Request received - Method: ${req.method}`);
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    console.log(`[${new Date().toISOString()}] Lead LinkedIn Wrapped: Handling CORS preflight`);
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Parse request body
    console.log(`[${new Date().toISOString()}] Lead LinkedIn Wrapped: Parsing request body`);
    const { name, email, linkedinUrl } = await req.json();
    console.log(`[${new Date().toISOString()}] Lead LinkedIn Wrapped: Received request`, { name, email, linkedinUrl });

    // Validate required fields
    if (!name || !email || !linkedinUrl) {
      console.log(`[${new Date().toISOString()}] Lead LinkedIn Wrapped: ERROR - Missing required fields`);
      return new Response(
        JSON.stringify({ error: 'Required fields: name, email, linkedinUrl' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Get API keys
    const apifyApiKey = Deno.env.get('APIFY_API_KEY');
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    console.log(`[${new Date().toISOString()}] Lead LinkedIn Wrapped: Checking API keys`, {
      apifyApiKey: !!apifyApiKey,
      supabaseUrl: !!supabaseUrl,
      supabaseServiceKey: !!supabaseServiceKey
    });
    
    if (!apifyApiKey) {
      console.log(`[${new Date().toISOString()}] Lead LinkedIn Wrapped: ERROR - Apify API key not configured`);
      return new Response(
        JSON.stringify({ error: 'Apify API key not configured' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Initialize Supabase client with service role
    const supabase = createClient(supabaseUrl ?? '', supabaseServiceKey ?? '');

    // Create lead record with pending status
    console.log(`[${new Date().toISOString()}] Lead LinkedIn Wrapped: Creating lead record...`);
    const { data: leadRecord, error: insertError } = await supabase
      .from('leads')
      .insert({
        name,
        email,
        linkedin_url: linkedinUrl,
        lead_source: 'linkedin_wrapped',
        status: 'processing',
        metadata: {}
      })
      .select()
      .single();

    if (insertError) {
      console.error(`[${new Date().toISOString()}] Lead LinkedIn Wrapped: ERROR creating lead record:`, insertError);
      return new Response(
        JSON.stringify({ error: 'Failed to create lead record' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const leadId = leadRecord.id;
    console.log(`[${new Date().toISOString()}] Lead LinkedIn Wrapped: Lead record created with ID: ${leadId}`);

    // STEP 1: Scrape LinkedIn posts with Apify (apimaestro scraper)
    console.log(`[${new Date().toISOString()}] Lead LinkedIn Wrapped: Starting LinkedIn posts scraping for: ${linkedinUrl}`);

    // Prepare Actor input for LinkedIn Posts scraper (Actor ID: LQQIXN9Othf8f7R5n)
    const input = {
      username: linkedinUrl
    };

    console.log(`[${new Date().toISOString()}] Lead LinkedIn Wrapped: Actor input:`, JSON.stringify(input, null, 2));

    // Pagination loop: fetch pages until we find posts from 2024 or earlier
    const currentYear = new Date().getFullYear();
    let allPostsData: any[] = [];
    let paginationToken: string | null = null;
    let pageNumber = 1;
    const maxPages = 10; // Safety limit: 1000 posts max
    
    console.log(`[${new Date().toISOString()}] Lead LinkedIn Wrapped: Starting pagination loop (max ${maxPages} pages)`);
    
    while (pageNumber <= maxPages) {
      console.log(`[${new Date().toISOString()}] Lead LinkedIn Wrapped: Fetching page ${pageNumber}...`);
      
      // Prepare input for this page
      const pageInput: any = { ...input };
      if (paginationToken) {
        pageInput.pagination_token = paginationToken;
        pageInput.page_number = pageNumber;
      } else {
        pageInput.page_number = pageNumber;
      }
      
      // Run the Actor (LinkedIn Posts scraper - apimaestro)
      const runResponse = await fetch(`https://api.apify.com/v2/acts/LQQIXN9Othf8f7R5n/runs`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apifyApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(pageInput),
      });

      console.log(`[${new Date().toISOString()}] Lead LinkedIn Wrapped: Apify actor response status: ${runResponse.status}`);

    if (!runResponse.ok) {
      const errorText = await runResponse.text();
      console.error(`[${new Date().toISOString()}] Lead LinkedIn Wrapped: ERROR starting Apify actor:`, errorText);
      
      await supabase.from('leads').update({ 
        status: 'failed', 
        error_message: 'Failed to start LinkedIn posts scraping' 
      }).eq('id', leadId);
      
      return new Response(
        JSON.stringify({ error: 'Failed to start LinkedIn posts scraping', leadId }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

      const runData = await runResponse.json();
      console.log(`[${new Date().toISOString()}] Lead LinkedIn Wrapped: Full runData response:`, JSON.stringify(runData, null, 2));
      
      if (!runData.data || !runData.data.id) {
        console.error(`[${new Date().toISOString()}] Lead LinkedIn Wrapped: ERROR - Invalid response from Apify API:`, runData);
        
        await supabase.from('leads').update({ 
          status: 'failed', 
          error_message: 'Invalid API response from scraper' 
        }).eq('id', leadId);
        
        return new Response(
          JSON.stringify({ error: 'Failed to start LinkedIn posts scraping - invalid API response', leadId }),
          { 
            status: 500, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }
      
      const runId = runData.data.id;
      console.log(`[${new Date().toISOString()}] Lead LinkedIn Wrapped: Actor run started with ID: ${runId}`);

      // Wait for the run to complete
      let attempts = 0;
      const maxAttempts = 24; // 2 minutes max
      console.log(`[${new Date().toISOString()}] Lead LinkedIn Wrapped: Starting polling loop with max ${maxAttempts} attempts`);
      
      let pagePostsData: any[] = [];
      let pagePaginationToken: string | null = null;
      
      while (attempts < maxAttempts) {
        console.log(`[${new Date().toISOString()}] Lead LinkedIn Wrapped: Polling attempt ${attempts + 1}/${maxAttempts}`);
        
        const statusResponse = await fetch(`https://api.apify.com/v2/actor-runs/${runId}`, {
          headers: {
            'Authorization': `Bearer ${apifyApiKey}`,
          },
        });

        if (!statusResponse.ok) {
          console.error(`[${new Date().toISOString()}] Lead LinkedIn Wrapped: ERROR checking run status:`, statusResponse.status);
          
          await supabase.from('leads').update({ 
            status: 'failed', 
            error_message: 'Failed to check scraping status' 
          }).eq('id', leadId);
          
          return new Response(
            JSON.stringify({ error: 'Failed to check scraping status', leadId }),
            { 
              status: 500, 
              headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
            }
          );
        }

        const statusData = await statusResponse.json();
        const runStatus = statusData.data?.status;
        console.log(`[${new Date().toISOString()}] Lead LinkedIn Wrapped: Run status (attempt ${attempts + 1}): ${runStatus}`);

        if (runStatus === 'SUCCEEDED') {
          console.log(`[${new Date().toISOString()}] Lead LinkedIn Wrapped: SUCCESS - Actor run completed successfully`);
          
          // Fetch results from the dataset
          console.log(`[${new Date().toISOString()}] Lead LinkedIn Wrapped: Fetching results from dataset...`);
          const datasetResponse = await fetch(`https://api.apify.com/v2/actor-runs/${runId}/dataset/items`, {
            headers: {
              'Authorization': `Bearer ${apifyApiKey}`,
            },
          });

          console.log(`[${new Date().toISOString()}] Lead LinkedIn Wrapped: Dataset response status: ${datasetResponse.status}`);

          if (!datasetResponse.ok) {
            console.error(`[${new Date().toISOString()}] Lead LinkedIn Wrapped: ERROR fetching dataset results:`, datasetResponse.status);
            
            await supabase.from('leads').update({ 
              status: 'failed', 
              error_message: 'Failed to fetch scraping results' 
            }).eq('id', leadId);
            
            return new Response(
              JSON.stringify({ error: 'Failed to fetch scraping results', leadId }),
              { 
                status: 500, 
                headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
              }
            );
          }

          const results = await datasetResponse.json();
          console.log(`[${new Date().toISOString()}] Lead LinkedIn Wrapped: Page ${pageNumber} completed`);
          
          /**
           * Normalize pagination + posts output.
           * The actor may return:
           *  - { success, data: { posts, pagination_token } }
           *  - Array of those objects
           *  - Array of post items directly
           */
          const collectedPosts: any[] = [];
          let collectedPaginationToken: string | null = null;

          const maybeSetToken = (token?: string | null) => {
            if (token && !collectedPaginationToken) {
              collectedPaginationToken = token;
            }
          };

          const collectFromItem = (item: any) => {
            if (!item) return;
            // Item with data wrapper
            if (item.data && Array.isArray(item.data.posts)) {
              collectedPosts.push(...item.data.posts);
              maybeSetToken(item.data.pagination_token);
              return;
            }
            // Item with top-level posts/pagination_token
            if (Array.isArray(item.posts)) {
              collectedPosts.push(...item.posts);
              maybeSetToken(item.pagination_token);
              return;
            }
            // If the item itself looks like a post (has posted_at or stats), treat as single post entry
            if (item.posted_at || item.stats) {
              collectedPosts.push(item);
              maybeSetToken(item.pagination_token);
            }
          };

          if (results?.data && results.data.posts) {
            collectFromItem(results);
          } else if (Array.isArray(results)) {
            results.forEach((entry: any) => collectFromItem(entry));
          } else {
            collectFromItem(results);
          }

          // As a fallback, try to read pagination_token from the first collected post if still not set
          if (!collectedPaginationToken && collectedPosts.length > 0) {
            const firstWithToken = collectedPosts.find((p: any) => p?.pagination_token);
            if (firstWithToken?.pagination_token) {
              collectedPaginationToken = firstWithToken.pagination_token;
            }
          }

          pagePostsData = collectedPosts;
          pagePaginationToken = collectedPaginationToken;
          console.log(`[${new Date().toISOString()}] Lead LinkedIn Wrapped: Normalized page posts=${pagePostsData.length}, pagination_token=${pagePaginationToken ? 'yes' : 'no'}`);
          
          // Log first item structure for debugging
          if (pagePostsData.length > 0) {
            console.log(`[${new Date().toISOString()}] Lead LinkedIn Wrapped: First item structure:`, JSON.stringify(pagePostsData[0], null, 2));
          }
          
          break;
          
        } else if (runStatus === 'FAILED') {
          console.error(`[${new Date().toISOString()}] Lead LinkedIn Wrapped: ERROR - Actor run failed`);
          
          await supabase.from('leads').update({ 
            status: 'failed', 
            error_message: 'LinkedIn posts scraping failed' 
          }).eq('id', leadId);
          
          return new Response(
            JSON.stringify({ error: 'LinkedIn posts scraping failed', leadId }),
            { 
              status: 500, 
              headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
            }
          );
        } else if (runStatus === 'RUNNING') {
          console.log(`[${new Date().toISOString()}] Lead LinkedIn Wrapped: Still running, waiting 5 seconds...`);
          await new Promise(resolve => setTimeout(resolve, 5000));
          attempts++;
        } else {
          console.log(`[${new Date().toISOString()}] Lead LinkedIn Wrapped: Waiting for status: ${runStatus}, waiting 3 seconds...`);
          await new Promise(resolve => setTimeout(resolve, 3000));
          attempts++;
        }
      }

      if (pagePostsData.length === 0) {
        console.log(`[${new Date().toISOString()}] Lead LinkedIn Wrapped: No posts found on page ${pageNumber}, stopping pagination`);
        break;
      }

      // Filter posts from current year and add to collection
      const yearPosts = pagePostsData.filter((post: any) => {
        if (post.posted_at && post.posted_at.date) {
          const postDate = new Date(post.posted_at.date);
          const postYear = postDate.getFullYear();
          return postYear === currentYear;
        } else if (post.posted_at && post.posted_at.timestamp) {
          const postDate = new Date(post.posted_at.timestamp);
          const postYear = postDate.getFullYear();
          return postYear === currentYear;
        }
        return false;
      });
      
      allPostsData = [...allPostsData, ...yearPosts];
      console.log(`[${new Date().toISOString()}] Lead LinkedIn Wrapped: Page ${pageNumber}: ${yearPosts.length} posts from ${currentYear} (${pagePostsData.length} total on page)`);
      
      // Check if we should continue pagination
      // Find the oldest post in this page
      let oldestPostYear = currentYear;
      for (const post of pagePostsData) {
        if (post.posted_at && post.posted_at.date) {
          const postDate = new Date(post.posted_at.date);
          const postYear = postDate.getFullYear();
          if (postYear < oldestPostYear) {
            oldestPostYear = postYear;
          }
        } else if (post.posted_at && post.posted_at.timestamp) {
          const postDate = new Date(post.posted_at.timestamp);
          const postYear = postDate.getFullYear();
          if (postYear < oldestPostYear) {
            oldestPostYear = postYear;
          }
        }
      }
      
      // If oldest post is from 2024 or earlier, stop pagination
      if (oldestPostYear < currentYear) {
        console.log(`[${new Date().toISOString()}] Lead LinkedIn Wrapped: Found posts from ${oldestPostYear}, stopping pagination`);
        break;
      }
      
      // If no pagination token, stop
      if (!pagePaginationToken) {
        console.log(`[${new Date().toISOString()}] Lead LinkedIn Wrapped: No pagination token, stopping pagination`);
        break;
      }
      
      // Continue to next page
      paginationToken = pagePaginationToken;
      pageNumber++;
      
      // Small delay between pages to respect rate limits
      await new Promise(resolve => setTimeout(resolve, 2000));
    }

    const postsData = allPostsData;
    
    if (postsData.length === 0) {
      console.error(`[${new Date().toISOString()}] Lead LinkedIn Wrapped: ERROR - No posts from ${currentYear} found`);
      
      await supabase.from('leads').update({ 
        status: 'failed', 
        error_message: `No LinkedIn posts from ${currentYear} found` 
      }).eq('id', leadId);
      
      return new Response(
        JSON.stringify({ error: `No LinkedIn posts from ${currentYear} found. Make sure your profile has public posts from this year.`, leadId }),
        { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }
    
    console.log(`[${new Date().toISOString()}] Lead LinkedIn Wrapped: Total posts from ${currentYear} collected: ${postsData.length}`);

    // STEP 2: Transform Apify results to our format
    console.log(`[${new Date().toISOString()}] Lead LinkedIn Wrapped: Processing ${postsData.length} posts...`);

    // Log complete structure of first item for debugging
    if (postsData.length > 0) {
      console.log(`[${new Date().toISOString()}] Lead LinkedIn Wrapped: COMPLETE first item keys:`, Object.keys(postsData[0]));
      console.log(`[${new Date().toISOString()}] Lead LinkedIn Wrapped: COMPLETE first item:`, JSON.stringify(postsData[0], null, 2));
    }

    // Aggregate reaction breakdown from all posts
    const aggregatedReactions = {
      like: 0,
      support: 0,
      love: 0,
      insight: 0,
      celebrate: 0,
      funny: 0
    };

    const posts: LinkedInPost[] = postsData.map((item: any, index: number) => {
      // Extract engagement from stats object (apimaestro format)
      const stats = item.stats || {};
      const likes = stats.like || 0;
      const comments = stats.comments || 0;
      const shares = stats.reposts || 0; // reposts = shares in apimaestro

      // Aggregate reaction breakdown
      aggregatedReactions.like += stats.like || 0;
      aggregatedReactions.support += stats.support || 0;
      aggregatedReactions.love += stats.love || 0;
      aggregatedReactions.insight += stats.insight || 0;
      aggregatedReactions.celebrate += stats.celebrate || 0;
      aggregatedReactions.funny += stats.funny || 0;

      // Extract date from posted_at object (apimaestro format)
      let publishedDate = '';
      if (item.posted_at && item.posted_at.date) {
        publishedDate = new Date(item.posted_at.date).toISOString();
      } else if (item.posted_at && item.posted_at.timestamp) {
        publishedDate = new Date(item.posted_at.timestamp).toISOString();
      } else {
        publishedDate = new Date().toISOString(); // Default to now if no date
      }

      // Extract content
      let content = item.text || '';

      // Extract ID
      const postId = item.urn || item.full_urn || item.id || `post_${Date.now()}_${index}`;

      // Extract URL
      const postUrl = item.url || `https://linkedin.com/feed/update/${postId}`;

      // Extract Author (apimaestro format)
      const author = item.author || {};
      const authorName = author.first_name && author.last_name 
        ? `${author.first_name} ${author.last_name}`.trim() 
        : '';
      const authorUrl = author.profile_url || '';

      // Log first 3 items for debugging
      if (index < 3) {
        console.log(`[${new Date().toISOString()}] Lead LinkedIn Wrapped: Item ${index} mapped:`, {
          text: content.substring(0, 50) + '...',
          likes,
          comments,
          shares,
          date: publishedDate,
          reactions: {
            like: stats.like || 0,
            support: stats.support || 0,
            love: stats.love || 0,
            insight: stats.insight || 0,
            celebrate: stats.celebrate || 0,
            funny: stats.funny || 0
          }
        });
      }
      
      return {
        id: postId,
        content: content,
        publishedAt: publishedDate,
        engagement: {
          likes,
          comments,
          shares
        },
        url: postUrl,
        author: {
          name: authorName,
          profileUrl: authorUrl,
          imageUrl: author.profile_picture || ''
        }
      };
    }).filter((post: LinkedInPost) => {
      // Filter out posts without content (but allow reposts that have reshared content)
      return post.content && post.content.trim().length > 0;
    });

    // Sort posts by date (newest first)
    posts.sort((a, b) => {
      const dateA = a.publishedAt ? new Date(a.publishedAt).getTime() : 0;
      const dateB = b.publishedAt ? new Date(b.publishedAt).getTime() : 0;
      return dateB - dateA;
    });

    console.log(`[${new Date().toISOString()}] Lead LinkedIn Wrapped: Filtered and sorted to ${posts.length} valid posts`);
    
    // Log engagement totals for verification
    const totalLikes = posts.reduce((sum, p) => sum + p.engagement.likes, 0);
    const totalComments = posts.reduce((sum, p) => sum + p.engagement.comments, 0);
    const totalShares = posts.reduce((sum, p) => sum + p.engagement.shares, 0);
    console.log(`[${new Date().toISOString()}] Lead LinkedIn Wrapped: Total engagement - Likes: ${totalLikes}, Comments: ${totalComments}, Shares: ${totalShares}`);
    
    // Log aggregated reactions breakdown
    console.log(`[${new Date().toISOString()}] Lead LinkedIn Wrapped: Aggregated reactions breakdown:`, aggregatedReactions);

    // STEP 2.5: Create ReactionsData from aggregated reactions
    const totalReactions = aggregatedReactions.like + aggregatedReactions.support + 
                          aggregatedReactions.love + aggregatedReactions.insight + 
                          aggregatedReactions.celebrate + aggregatedReactions.funny;
    
    const reactionsData: ReactionsData = {
      totalReactions,
      topAuthors: [], // Not available from posts data
      reactionTypes: {
        like: aggregatedReactions.like,
        support: aggregatedReactions.support,
        love: aggregatedReactions.love,
        insight: aggregatedReactions.insight,
        celebrate: aggregatedReactions.celebrate,
        funny: aggregatedReactions.funny
      },
      monthlyReactions: [], // Can be calculated from posts if needed
      topReactedPosts: [] // Can be calculated from posts if needed
    };
    
    const reactions: LinkedInReaction[] = [];

    // STEP 3: Generate wrapped data
    console.log(`[${new Date().toISOString()}] Lead LinkedIn Wrapped: Generating wrapped data...`);
    const wrappedData = processWrappedData(posts, reactionsData);
    console.log(`[${new Date().toISOString()}] Lead LinkedIn Wrapped: Wrapped data generated:`, {
      totalPosts: wrappedData.totalPosts,
      totalEngagement: wrappedData.totalEngagement,
      topPostsCount: wrappedData.topPosts.length
    });

    // STEP 4: Update lead record with results
    console.log(`[${new Date().toISOString()}] Lead LinkedIn Wrapped: Updating lead record with results...`);
    
    const { error: updateError } = await supabase
      .from('leads')
      .update({
        status: 'completed',
        reactions_data: reactions.length > 0 ? reactions : null,
        scraped_data: {
          posts,
          reactions: reactions.length > 0 ? reactions : undefined,
          wrappedData,
          processedAt: new Date().toISOString()
        }
      })
      .eq('id', leadId);

    if (updateError) {
      console.error(`[${new Date().toISOString()}] Lead LinkedIn Wrapped: ERROR updating lead record:`, updateError);
      // Don't fail the request - still return the data to the user
    } else {
      console.log(`[${new Date().toISOString()}] Lead LinkedIn Wrapped: Lead record updated successfully`);
    }

    // Return success response
    console.log(`[${new Date().toISOString()}] Lead LinkedIn Wrapped: Request completed successfully`);
    return new Response(
      JSON.stringify({ 
        success: true,
        leadId,
        data: wrappedData,
        message: 'LinkedIn Wrapped generated successfully'
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error(`[${new Date().toISOString()}] Lead LinkedIn Wrapped: FATAL ERROR:`, error);
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
