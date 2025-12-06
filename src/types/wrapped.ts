// Wrapped data types for LinkedIn Wrapped feature
// Extracted from LinkedInWrapped.tsx for reuse

export interface ReactionsData {
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

export interface PostsWrappedData {
  totalPosts: number;
  totalEngagement: number;
  averageEngagementPerPost: number;
  topPosts: Array<{
    id: string;
    content: string;
    publishedAt: string;
    engagement: {
      likes: number;
      comments: number;
      shares: number;
    };
    url: string;
  }>;
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

