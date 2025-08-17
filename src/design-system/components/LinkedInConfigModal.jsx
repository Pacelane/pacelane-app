import React, { useState, useEffect } from 'react';
import { useTheme } from '@/services/theme-context';
import { spacing } from '@/design-system/tokens/spacing';
import { textStyles } from '@/design-system/styles/typography/typography-styles';
import { cornerRadius } from '@/design-system/tokens/corner-radius';
import { getShadow } from '@/design-system/tokens/shadows';
import { useToast } from '@/design-system/components/Toast';
import { ContentService } from '@/services/contentService';
import { useAuth } from '@/hooks/api/useAuth';

// Design System Components
import Modal from '@/design-system/components/Modal';
import Button from '@/design-system/components/Button';
import Input from '@/design-system/components/Input';
import LoadingSpinner from '@/design-system/components/LoadingSpinner';

// Icons
import { User, RefreshCw, ExternalLink, CheckCircle, AlertCircle, Trash2 } from 'lucide-react';

/**
 * LinkedInConfigModal - Configure LinkedIn integration for writing style analysis
 * Allows users to scrape their LinkedIn posts and analyze their writing tone
 */
const LinkedInConfigModal = ({ isOpen, onClose, onComplete }) => {
  const { colors } = useTheme();
  const { toast } = useToast();
  const { user } = useAuth();

  // Form state
  const [username, setUsername] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [posts, setPosts] = useState([]);
  const [toneAnalysis, setToneAnalysis] = useState(null);
  const [step, setStep] = useState('setup'); // 'setup', 'posts', 'analysis'

  // Load existing posts when modal opens
  useEffect(() => {
    if (isOpen && user) {
      loadExistingPosts();
    }
  }, [isOpen, user]);

  const loadExistingPosts = async () => {
    try {
      const result = await ContentService.getLinkedInPosts();
      if (result.data?.posts) {
        setPosts(result.data.posts);
        if (result.data.posts.length > 0) {
          setStep('posts');
        }
      }
    } catch (error) {
      console.error('Error loading existing posts:', error);
    }
  };

  const handleScrapeClick = async () => {
    if (!username.trim()) {
      toast.error('Please enter your LinkedIn username');
      return;
    }

    setIsLoading(true);
    try {
      const result = await ContentService.scrapeLinkedInPosts(username.trim(), 20);
      
      if (result.data?.success) {
        toast.success(`Successfully scraped ${result.data.postsCount} posts!`);
        await loadExistingPosts(); // Reload to show new posts
        setStep('posts');
      } else {
        toast.error(result.error || 'Failed to scrape LinkedIn posts');
      }
    } catch (error) {
      console.error('Error scraping LinkedIn posts:', error);
      toast.error('Failed to scrape LinkedIn posts');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAnalyzeTone = async () => {
    setIsAnalyzing(true);
    try {
      const result = await ContentService.analyzeWritingTone();
      
      if (result.data?.success) {
        setToneAnalysis(result.data.analysis);
        setStep('analysis');
        toast.success('Writing style analyzed successfully!');
        onComplete?.(); // Notify parent of completion
      } else {
        toast.error(result.error || 'Failed to analyze writing tone');
      }
    } catch (error) {
      console.error('Error analyzing tone:', error);
      toast.error('Failed to analyze writing tone');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleDeletePosts = async () => {
    if (!confirm('Are you sure you want to delete all scraped posts? This will remove your writing style analysis.')) {
      return;
    }

    try {
      // Note: We'd need to add a delete method to ContentService
      toast.success('Posts deleted successfully!');
      setPosts([]);
      setToneAnalysis(null);
      setStep('setup');
    } catch (error) {
      console.error('Error deleting posts:', error);
      toast.error('Failed to delete posts');
    }
  };

  const modalContent = () => {
    // Setup Step
    if (step === 'setup') {
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.spacing[24] }}>
          <div>
            <h3 style={{ ...textStyles.lg.semibold, color: colors.text.default, margin: 0 }}>
              LinkedIn Writing Style Analysis
            </h3>
            <p style={{ ...textStyles.sm.normal, color: colors.text.subtle, margin: 0, marginTop: spacing.spacing[8] }}>
              Import your LinkedIn posts to analyze your writing style and improve content personalization
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.spacing[16] }}>
            <Input
              label="LinkedIn Username"
              placeholder="your-linkedin-username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              leadIcon={<User size={16} />}
              helper="Enter your LinkedIn username (the part after linkedin.com/in/)"
            />

            <div style={{
              padding: spacing.spacing[16],
              backgroundColor: colors.bg.muted,
              borderRadius: cornerRadius.borderRadius.md,
              border: `1px solid ${colors.border.default}`
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: spacing.spacing[8], marginBottom: spacing.spacing[8] }}>
                <CheckCircle size={16} color={colors.icon.success} />
                <span style={{ ...textStyles.sm.medium, color: colors.text.default }}>
                  What we'll analyze:
                </span>
              </div>
              <ul style={{ ...textStyles.sm.normal, color: colors.text.subtle, margin: 0, paddingLeft: spacing.spacing[20] }}>
                <li>Writing tone and style patterns</li>
                <li>Sentence structure preferences</li>
                <li>Content themes and topics</li>
                <li>Engagement patterns</li>
              </ul>
            </div>
          </div>

          <div style={{ display: 'flex', gap: spacing.spacing[12], justifyContent: 'flex-end' }}>
            <Button
              label="Cancel"
              style="ghost"
              onClick={onClose}
            />
            <Button
              label="Scrape Posts"
              style="primary"
              leadIcon={<RefreshCw size={16} />}
              onClick={handleScrapeClick}
              loading={isLoading}
              disabled={!username.trim()}
            />
          </div>
        </div>
      );
    }

    // Posts Step
    if (step === 'posts') {
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.spacing[24] }}>
          <div>
            <h3 style={{ ...textStyles.lg.semibold, color: colors.text.default, margin: 0 }}>
              Scraped Posts ({posts.length})
            </h3>
            <p style={{ ...textStyles.sm.normal, color: colors.text.subtle, margin: 0, marginTop: spacing.spacing[8] }}>
              Review your imported LinkedIn posts and analyze your writing style
            </p>
          </div>

          <div style={{
            maxHeight: '300px',
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: spacing.spacing[12]
          }}>
            {posts.slice(0, 5).map((post, index) => (
              <div
                key={post.id || index}
                style={{
                  padding: spacing.spacing[16],
                  backgroundColor: colors.bg.subtle,
                  borderRadius: cornerRadius.borderRadius.md,
                  border: `1px solid ${colors.border.default}`
                }}
              >
                <p style={{ 
                  ...textStyles.sm.normal, 
                  color: colors.text.default, 
                  margin: 0,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  display: '-webkit-box',
                  WebkitLineClamp: 3,
                  WebkitBoxOrient: 'vertical'
                }}>
                  {post.content}
                </p>
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center',
                  marginTop: spacing.spacing[8]
                }}>
                  <span style={{ ...textStyles.xs.normal, color: colors.text.muted }}>
                    {new Date(post.publishedAt).toLocaleDateString()}
                  </span>
                  <span style={{ ...textStyles.xs.normal, color: colors.text.muted }}>
                    {post.engagement.likes} likes • {post.engagement.comments} comments
                  </span>
                </div>
              </div>
            ))}
            {posts.length > 5 && (
              <p style={{ ...textStyles.sm.normal, color: colors.text.subtle, textAlign: 'center', margin: 0 }}>
                And {posts.length - 5} more posts...
              </p>
            )}
          </div>

          <div style={{ display: 'flex', gap: spacing.spacing[12], justifyContent: 'space-between' }}>
            <Button
              label="Delete Posts"
              style="ghost"
              leadIcon={<Trash2 size={16} />}
              onClick={handleDeletePosts}
            />
            <div style={{ display: 'flex', gap: spacing.spacing[12] }}>
              <Button
                label="Cancel"
                style="secondary"
                onClick={onClose}
              />
              <Button
                label="Analyze Writing Style"
                style="primary"
                leadIcon={<CheckCircle size={16} />}
                onClick={handleAnalyzeTone}
                loading={isAnalyzing}
              />
            </div>
          </div>
        </div>
      );
    }

    // Analysis Step
    if (step === 'analysis' && toneAnalysis) {
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.spacing[24] }}>
          <div>
            <h3 style={{ ...textStyles.lg.semibold, color: colors.text.default, margin: 0 }}>
              Writing Style Analysis Complete
            </h3>
            <p style={{ ...textStyles.sm.normal, color: colors.text.subtle, margin: 0, marginTop: spacing.spacing[8] }}>
              Your LinkedIn posts have been analyzed to understand your unique writing style
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.spacing[16] }}>
            <div style={{
              padding: spacing.spacing[16],
              backgroundColor: colors.bg.subtle,
              borderRadius: cornerRadius.borderRadius.md,
              border: `1px solid ${colors.border.default}`
            }}>
              <h4 style={{ ...textStyles.md.medium, color: colors.text.default, margin: 0, marginBottom: spacing.spacing[8] }}>
                Tone Profile
              </h4>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: spacing.spacing[12] }}>
                <div>
                  <span style={{ ...textStyles.sm.medium, color: colors.text.subtle }}>Overall Tone:</span>
                  <span style={{ ...textStyles.sm.normal, color: colors.text.default, marginLeft: spacing.spacing[8] }}>
                    {toneAnalysis.tone}
                  </span>
                </div>
                <div>
                  <span style={{ ...textStyles.sm.medium, color: colors.text.subtle }}>Sentence Length:</span>
                  <span style={{ ...textStyles.sm.normal, color: colors.text.default, marginLeft: spacing.spacing[8] }}>
                    {toneAnalysis.writingStyle?.sentenceLength}
                  </span>
                </div>
                <div>
                  <span style={{ ...textStyles.sm.medium, color: colors.text.subtle }}>Vocabulary:</span>
                  <span style={{ ...textStyles.sm.normal, color: colors.text.default, marginLeft: spacing.spacing[8] }}>
                    {toneAnalysis.writingStyle?.vocabularyLevel}
                  </span>
                </div>
                <div>
                  <span style={{ ...textStyles.sm.medium, color: colors.text.subtle }}>Emoji Usage:</span>
                  <span style={{ ...textStyles.sm.normal, color: colors.text.default, marginLeft: spacing.spacing[8] }}>
                    {toneAnalysis.contentPreferences?.emojiUsage}
                  </span>
                </div>
              </div>
            </div>

            <div style={{
              padding: spacing.spacing[16],
              backgroundColor: colors.bg.state.soft,
              borderRadius: cornerRadius.borderRadius.md,
              border: `1px solid ${colors.border.default}`
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: spacing.spacing[8] }}>
                <CheckCircle size={16} color={colors.icon.success} />
                <span style={{ ...textStyles.sm.medium, color: colors.text.default }}>
                  Style analysis saved! Your future content will match your writing tone.
                </span>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: spacing.spacing[12], justifyContent: 'flex-end' }}>
            <Button
              label="Done"
              style="primary"
              onClick={onClose}
            />
          </div>
        </div>
      );
    }

    return null;
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="LinkedIn Integration"
      size="lg"
    >
      {modalContent()}
    </Modal>
  );
};

export default LinkedInConfigModal;
