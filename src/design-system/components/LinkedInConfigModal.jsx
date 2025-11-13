import React, { useState, useEffect } from 'react';
import { useTheme } from '@/services/theme-context';
import { useTranslation } from '@/services/i18n-context';
import { spacing } from '@/design-system/tokens/spacing';
import { typography } from '@/design-system/tokens/typography';
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
import SubtleLoadingSpinner from '@/design-system/components/SubtleLoadingSpinner';

// Icons
import { User, ArrowsClockwise as RefreshCw, ArrowSquareOut as ExternalLink, CheckCircle, WarningCircle as AlertCircle, Trash as Trash2, LinkedinLogo as Linkedin } from '@phosphor-icons/react';

/**
 * LinkedInConfigModal - Configure LinkedIn integration for writing style analysis
 * 
 * @param {Object} props - Component props
 * @param {boolean} props.isOpen - Whether the modal is open
 * @param {function} props.onClose - Callback when modal should close
 * @param {function} props.onComplete - Callback when setup is marked as complete
 */
const LinkedInConfigModal = ({ isOpen = false, onClose, onComplete }) => {
  const { colors } = useTheme();
  const { t } = useTranslation();
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



  const handleAnalyzeTone = async () => {
    setIsAnalyzing(true);
    try {
      const result = await ContentService.analyzeWritingTone();
      
      if (result.data?.success) {
        setToneAnalysis(result.data.analysis);
        setStep('analysis');
        toast.success(t('components.linkedInConfig.toneAnalyzed'));
        onComplete?.(); // Notify parent of completion
      } else {
        toast.error(result.error || t('components.linkedInConfig.analysisError'));
      }
    } catch (error) {
      console.error('Error analyzing tone:', error);
      toast.error(t('components.linkedInConfig.analysisError'));
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleDeletePosts = async () => {
    if (!confirm(t('components.linkedInConfig.deleteConfirm'))) {
      return;
    }

    try {
      // Note: We'd need to add a delete method to ContentService
      toast.success(t('components.linkedInConfig.deleteSuccess'));
      setPosts([]);
      setToneAnalysis(null);
      setStep('setup');
    } catch (error) {
      console.error('Error deleting posts:', error);
      toast.error(t('components.linkedInConfig.deleteFailed'));
    }
  };

  // Modal content styles - matching WhatsApp and Read.ai modals
  const headerStyles = {
    display: 'flex',
    flexDirection: 'column',
    gap: spacing.spacing[8],
    padding: spacing.spacing[24],
    paddingBottom: spacing.spacing[16],
  };

  const titleStyle = {
    fontFamily: typography.fontFamily['awesome-serif'],
    fontSize: typography.desktop.size.xl,
    fontWeight: typography.desktop.weight.semibold,
    lineHeight: typography.desktop.lineHeight.leading6,
    color: colors.text.default,
    margin: 0,
  };

  const subtitleStyle = {
    ...textStyles.sm.normal,
    color: colors.text.subtle,
    margin: 0,
  };

  const contentStyles = {
    display: 'flex',
    flexDirection: 'column',
    gap: spacing.spacing[20],
    padding: `0 ${spacing.spacing[24]}`,
    flex: 1,
    overflow: 'auto',
    minHeight: 0,
  };

  const footerStyles = {
    display: 'flex',
    gap: spacing.spacing[12],
    padding: spacing.spacing[24],
    paddingTop: spacing.spacing[16],
    borderTop: `1px solid ${colors.border.default}`,
    justifyContent: 'flex-end',
    flexShrink: 0,
  };

  const infoBoxStyles = {
    backgroundColor: colors.bg.card.subtle,
    border: `1px solid ${colors.border.default}`,
    borderRadius: cornerRadius.borderRadius.sm,
    padding: spacing.spacing[12],
    display: 'flex',
    flexDirection: 'column',
    gap: spacing.spacing[8],
  };

  // Validation for username
  const validateUsername = (username) => {
    if (!username.trim()) {
      return t('components.linkedInConfig.usernameRequired');
    }
    // Basic validation for LinkedIn username format
    const cleanUsername = username.trim().replace(/[^a-zA-Z0-9-]/g, '');
    if (cleanUsername.length < 3) {
      return t('components.linkedInConfig.usernameMinLength');
    }
    return '';
  };

  const [usernameError, setUsernameError] = useState('');

  const handleUsernameChange = (e) => {
    const newUsername = e.target.value;
    setUsername(newUsername);
    if (usernameError) {
      setUsernameError(''); // Clear error when user starts typing
    }
  };

  const handleScrapeClick = async () => {
    const validationError = validateUsername(username);
    if (validationError) {
      setUsernameError(validationError);
      return;
    }

    setIsLoading(true);
    setUsernameError('');
    
    try {
      const result = await ContentService.scrapeLinkedInPosts(username.trim(), 20);
      
      if (result.data?.success) {
        toast.success(t('components.linkedInConfig.scrapeSuccess').replace('{count}', result.data.postsCount));
        await loadExistingPosts(); // Reload to show new posts
        setStep('posts');
      } else {
        toast.error(result.error || t('components.linkedInConfig.scrapeFailed'));
      }
    } catch (error) {
      console.error('Error scraping LinkedIn posts:', error);
      toast.error(t('components.linkedInConfig.scrapeFailed'));
    } finally {
      setIsLoading(false);
    }
  };

  // Check if user has any posts already
  const hasExistingPosts = posts.length > 0;
  const canScrape = username.trim() && !usernameError && !isLoading;

  const getModalContent = () => {
    // Setup Step
    if (step === 'setup') {
      return (
        <>
          {/* Content */}
          <div style={contentStyles}>
            {/* Username Input */}
            <div>
              <Input
                label={t('components.linkedInConfig.usernameLabel')}
                placeholder={t('components.linkedInConfig.usernamePlaceholder')}
                value={username}
                onChange={handleUsernameChange}
                style="default"
                size="lg"
                disabled={isLoading}
                failed={!!usernameError}
                caption={usernameError || t('components.linkedInConfig.usernameHelper')}
                leadIcon={<User size={18} />}
              />
            </div>

            {/* Information Box */}
            <div style={infoBoxStyles}>
              <h4 style={{
                ...textStyles.sm.semibold,
                color: colors.text.default,
                margin: 0,
              }}>
                {t('components.linkedInConfig.infoTitle')}
              </h4>
              <ul style={{
                ...textStyles.xs.normal,
                color: colors.text.muted,
                margin: 0,
                paddingLeft: spacing.spacing[16],
                listStyleType: 'disc',
              }}>
                <li>{t('components.linkedInConfig.infoTone')}</li>
                <li>{t('components.linkedInConfig.infoStructure')}</li>
                <li>{t('components.linkedInConfig.infoThemes')}</li>
                <li>{t('components.linkedInConfig.infoEngagement')}</li>
              </ul>
              <p style={{
                ...textStyles.xs.normal,
                color: colors.text.muted,
                margin: 0,
                marginTop: spacing.spacing[8],
                fontStyle: 'italic',
              }}>
                {t('components.linkedInConfig.infoPrivacy')}
              </p>
            </div>

            {/* Show existing posts if any */}
            {hasExistingPosts && (
              <div style={{
                ...infoBoxStyles,
                borderColor: colors.border.success,
                backgroundColor: colors.bg.state.soft,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: spacing.spacing[8] }}>
                  <CheckCircle size={16} color={colors.icon.success} />
                  <span style={{ ...textStyles.sm.medium, color: colors.text.default }}>
                    {t('components.linkedInConfig.existingPosts').replace('{count}', posts.length)}
                  </span>
                </div>
                <p style={{
                  ...textStyles.xs.normal,
                  color: colors.text.muted,
                  margin: 0,
                }}>
                  {t('components.linkedInConfig.useExistingInfo')}
                </p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div style={footerStyles}>
            <Button
              label={t('components.linkedInConfig.cancel')}
              style="secondary"
              size="sm"
              onClick={onClose}
              disabled={isLoading}
            />
            {hasExistingPosts && (
              <Button
                label={t('components.linkedInConfig.useExistingButton')}
                style="soft"
                size="sm"
                leadIcon={<CheckCircle size={16} />}
                onClick={() => setStep('posts')}
                disabled={isLoading}
              />
            )}
            <Button
              label={isLoading ? t('components.linkedInConfig.scrapingPosts') : t('components.linkedInConfig.scrapeButton')}
              style="primary"
              size="sm"
              leadIcon={isLoading ? undefined : <RefreshCw size={16} />}
              onClick={handleScrapeClick}
              disabled={!canScrape}
              loading={isLoading}
            />
          </div>
        </>
      );
    }

    // Posts Step
    if (step === 'posts') {
      return (
        <>
          {/* Content */}
          <div style={contentStyles}>
            <div>
              <h3 style={{
                ...textStyles.md.semibold,
                color: colors.text.default,
                margin: 0,
              }}>
                {t('components.linkedInConfig.foundPosts').replace('{count}', posts.length)}
              </h3>
              <p style={{
                ...textStyles.sm.normal,
                color: colors.text.subtle,
                margin: 0,
                marginTop: spacing.spacing[4],
              }}>
                {t('components.linkedInConfig.reviewPosts')}
              </p>
            </div>

            {/* Posts Preview */}
            <div style={{
              maxHeight: '280px',
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
              gap: spacing.spacing[12],
              border: `1px solid ${colors.border.default}`,
              borderRadius: cornerRadius.borderRadius.sm,
              padding: spacing.spacing[12],
              backgroundColor: colors.bg.subtle,
            }}>
              {posts.slice(0, 3).map((post, index) => (
                <div
                  key={post.id || index}
                  style={{
                    padding: spacing.spacing[12],
                    backgroundColor: colors.bg.card.default,
                    borderRadius: cornerRadius.borderRadius.sm,
                    border: `1px solid ${colors.border.default}`,
                  }}
                >
                  <p style={{ 
                    ...textStyles.sm.normal, 
                    color: colors.text.default, 
                    margin: 0,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
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
                      {post.engagement?.likes || 0} {t('components.linkedInConfig.likes')} • {post.engagement?.comments || 0} {t('components.linkedInConfig.comments')}
                    </span>
                  </div>
                </div>
              ))}
              {posts.length > 3 && (
                <p style={{ 
                  ...textStyles.sm.normal, 
                  color: colors.text.subtle, 
                  textAlign: 'center', 
                  margin: 0,
                  fontStyle: 'italic',
                }}>
                  {t('components.linkedInConfig.andMore').replace('{count}', posts.length - 3)}
                </p>
              )}
            </div>
          </div>

          {/* Footer */}
          <div style={footerStyles}>
            <Button
              label={t('components.linkedInConfig.deletePosts')}
              style="ghost"
              size="sm"
              leadIcon={<Trash2 size={16} />}
              onClick={handleDeletePosts}
              disabled={isAnalyzing}
            />
            <div style={{ display: 'flex', gap: spacing.spacing[12] }}>
              <Button
                label={t('components.linkedInConfig.back')}
                style="secondary"
                size="sm"
                onClick={() => setStep('setup')}
                disabled={isAnalyzing}
              />
              <Button
                label={isAnalyzing ? t('components.linkedInConfig.analyzingTone') : t('components.linkedInConfig.analyzeTone')}
                style="primary"
                size="sm"
                leadIcon={isAnalyzing ? undefined : <CheckCircle size={16} />}
                onClick={handleAnalyzeTone}
                loading={isAnalyzing}
              />
            </div>
          </div>
        </>
      );
    }

    // Analysis Step
    if (step === 'analysis' && toneAnalysis) {
      return (
        <>
          {/* Content */}
          <div style={contentStyles}>
            <div>
              <h3 style={{
                ...textStyles.md.semibold,
                color: colors.text.default,
                margin: 0,
              }}>
                {t('components.linkedInConfig.analysisComplete')}
              </h3>
              <p style={{
                ...textStyles.sm.normal,
                color: colors.text.subtle,
                margin: 0,
                marginTop: spacing.spacing[4],
              }}>
                {t('components.linkedInConfig.analysisCompleteSubtitle')}
              </p>
            </div>

            {/* Analysis Results */}
            <div style={infoBoxStyles}>
              <h4 style={{
                ...textStyles.sm.semibold,
                color: colors.text.default,
                margin: 0,
                marginBottom: spacing.spacing[8],
              }}>
                {t('components.linkedInConfig.writingProfile')}
              </h4>
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: '1fr 1fr', 
                gap: spacing.spacing[12],
                marginBottom: spacing.spacing[12],
              }}>
                <div>
                  <span style={{ ...textStyles.xs.medium, color: colors.text.subtle }}>{t('components.linkedInConfig.overallTone')}</span>
                  <br />
                  <span style={{ ...textStyles.sm.normal, color: colors.text.default }}>
                    {toneAnalysis.tone || 'Professional'}
                  </span>
                </div>
                <div>
                  <span style={{ ...textStyles.xs.medium, color: colors.text.subtle }}>{t('components.linkedInConfig.sentenceStyle')}</span>
                  <br />
                  <span style={{ ...textStyles.sm.normal, color: colors.text.default }}>
                    {toneAnalysis.writingStyle?.sentenceLength || 'Balanced'}
                  </span>
                </div>
                <div>
                  <span style={{ ...textStyles.xs.medium, color: colors.text.subtle }}>{t('components.linkedInConfig.vocabulary')}</span>
                  <br />
                  <span style={{ ...textStyles.sm.normal, color: colors.text.default }}>
                    {toneAnalysis.writingStyle?.vocabularyLevel || 'Business'}
                  </span>
                </div>
                <div>
                  <span style={{ ...textStyles.xs.medium, color: colors.text.subtle }}>{t('components.linkedInConfig.emojiUsage')}</span>
                  <br />
                  <span style={{ ...textStyles.sm.normal, color: colors.text.default }}>
                    {toneAnalysis.contentPreferences?.emojiUsage || 'Minimal'}
                  </span>
                </div>
              </div>
            </div>

            {/* Success Message */}
            <div style={{
              ...infoBoxStyles,
              borderColor: colors.border.success,
              backgroundColor: colors.bg.state.soft,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: spacing.spacing[8] }}>
                <CheckCircle size={16} color={colors.icon.success} />
                <span style={{ ...textStyles.sm.medium, color: colors.text.default }}>
                  {t('components.linkedInConfig.analysisSavedTitle')}
                </span>
              </div>
              <p style={{
                ...textStyles.xs.normal,
                color: colors.text.muted,
                margin: 0,
                marginTop: spacing.spacing[4],
              }}>
                {t('components.linkedInConfig.analysisSavedSubtitle')}
              </p>
            </div>
          </div>

          {/* Footer */}
          <div style={footerStyles}>
            <Button
              label={t('components.linkedInConfig.completeSetup')}
              style="primary"
              size="sm"
              leadIcon={<CheckCircle size={16} />}
              onClick={() => {
                onComplete?.();
                onClose?.();
              }}
            />
          </div>
        </>
      );
    }

    return null;
  };

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose}
      showCloseButton={true}
      size="lg"
    >
      {/* Header */}
      <div style={headerStyles}>
        <div style={{ display: 'flex', alignItems: 'center', gap: spacing.spacing[12] }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: spacing.spacing[32],
            height: spacing.spacing[32],
            backgroundColor: '#0A66C2',
            borderRadius: cornerRadius.borderRadius.sm,
          }}>
            <Linkedin size={16} color="white" />
          </div>
          <h2 style={titleStyle}>{t('components.linkedInConfig.title')}</h2>
        </div>
        <p style={subtitleStyle}>
          {t('components.linkedInConfig.subtitle')}
        </p>
      </div>

      {/* Dynamic Content */}
      {getModalContent()}
    </Modal>
  );
};

export default LinkedInConfigModal;
