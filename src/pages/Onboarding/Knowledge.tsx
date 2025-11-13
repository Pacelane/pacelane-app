import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/api/useAuth';
import { useTheme } from '@/services/theme-context';
import { useToast } from '@/design-system/components/Toast';
import { useContent } from '@/hooks/api/useContent';
import { supabase } from '@/integrations/supabase/client';
import { ProfileService } from '@/services/profileService';
import { spacing } from '@/design-system/tokens/spacing';
import { cornerRadius } from '@/design-system/tokens/corner-radius';
import { typography } from '@/design-system/tokens/typography';
import { textStyles } from '@/design-system/styles/typography/typography-styles';
import { getShadow } from '@/design-system/tokens/shadows';
import { stroke } from '@/design-system/tokens/stroke';
import { colors as primitiveColors } from '@/design-system/tokens/primitive-colors';
import TopNav from '@/design-system/components/TopNav';
import Button from '@/design-system/components/Button';
import Badge from '@/design-system/components/Badge';
import FileUpload from '@/design-system/components/FileUpload';
import Input from '@/design-system/components/Input';
import { ArrowRight, Loader2, X, FileText, CheckCircle2, AlertCircle, Loader } from 'lucide-react';

const Knowledge = () => {
  const { colors } = useTheme();
  const navigate = useNavigate();
  const { user, refreshProfile } = useAuth();
  const { toast } = useToast();
  const { uploadFiles, addLink, knowledgeFiles, uploading, loadKnowledgeFiles } = useContent();
  const [urlInput, setUrlInput] = useState('');
  const [saving, setSaving] = useState(false);
  const fileUploadRef = useRef(null);

  // Handle file selection
  const handleFileSelect = async (files: File[]) => {
    if (!user) {
      toast.error('Please sign in to continue');
      return;
    }

    try {
      const result = await uploadFiles(files);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success(`Successfully uploaded ${files.length} file${files.length > 1 ? 's' : ''}`);
      }
    } catch (error: any) {
      console.error('Error uploading files:', error);
      toast.error('Failed to upload files. Please try again.');
    }
  };

  // Handle URL submit - Save directly to Supabase
  const handleUrlSubmit = async () => {
    if (!user) {
      toast.error('Please sign in to continue');
      return;
    }

    const urlToSave = urlInput.trim();
    if (!urlToSave) {
      toast.error('Please enter a valid URL');
      return;
    }

    // Basic URL validation
    let validUrl = urlToSave;
    if (!urlToSave.startsWith('http://') && !urlToSave.startsWith('https://')) {
      validUrl = `https://${urlToSave}`;
    }

    try {
      // Validate URL format
      try {
        new URL(validUrl);
      } catch {
        toast.error('Please enter a valid URL');
        return;
      }

      // Save link directly to knowledge_files table
      const { data, error } = await supabase
        .from('knowledge_files')
        .insert({
          user_id: user.id,
          name: validUrl, // Use URL as name
          type: 'link',
          url: validUrl,
          size: null,
          storage_path: null,
        } as any)
        .select()
        .single();

      if (error) {
        console.error('Error saving link:', error);
        toast.error('Failed to save link. Please try again.');
        return;
      }

      // Reload knowledge files to show the new link
      await loadKnowledgeFiles();
      
      // Clear input (will be handled by FileUpload component)
      setUrlInput('');
      toast.success('Link added successfully');
    } catch (error: any) {
      console.error('Error saving link:', error);
      toast.error('Failed to save link. Please try again.');
    }
  };

  // Handle file deletion
  const handleFileDelete = async (fileId: string) => {
    if (!user) {
      toast.error('Please sign in to continue');
      return;
    }

    try {
      const result = await deleteKnowledgeFile(fileId);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success('File removed successfully');
      }
    } catch (error: any) {
      console.error('Error deleting file:', error);
      toast.error('Failed to delete file. Please try again.');
    }
  };

  // Handle button clicks
  const handleGoBack = () => {
    navigate('/onboarding/format');
  };

  const handleContinue = async () => {
    if (!user) {
      toast.error('Please sign in to continue');
      return;
    }

    setSaving(true);

    try {
      // Mark onboarding as complete using ProfileService
      const result = await ProfileService.completeOnboarding(user.id);

      if (result.error) {
        console.error('Error completing onboarding:', result.error);
        toast.error(result.error || 'Failed to complete onboarding. Please try again.');
        return;
      }

      console.log('Onboarding completed successfully:', result.data);
      
      // Refresh profile to get updated is_onboarded status
      if (refreshProfile) {
        await refreshProfile();
      }
      
      toast.success('Onboarding completed!');
      
      // Navigate to product home
      navigate('/product-home');
    } catch (error: any) {
      console.error('Error completing onboarding:', error);
      toast.error('Failed to complete onboarding. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  // Page container styles
  const pageContainerStyles = {
    minHeight: '100vh',
    backgroundColor: colors.bg.muted,
    display: 'flex',
    flexDirection: 'column' as const,
  };

  // Main content container styles (below TopNav)
  const mainContentStyles = {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.spacing[24],
  };

  // Main card container styles
  const mainCardStyles = {
    width: '720px', // Same width as Format page
    height: '700px',
    backgroundColor: 'transparent',
    borderRadius: cornerRadius.borderRadius.lg,
    border: `${stroke.DEFAULT} solid ${colors.border.default}`,
    boxShadow: getShadow('regular.card', colors, { withBorder: false }),
    display: 'flex',
    flexDirection: 'row' as const,
    overflow: 'hidden',
  };

  // Main container (left side) styles
  const mainContainerStyles = {
    flex: 1,
    backgroundColor: colors.bg.card.default,
    borderRight: `${stroke.DEFAULT} solid ${colors.border.default}`,
    display: 'flex',
    flexDirection: 'column' as const,
    justifyContent: 'space-between',
  };

  // Content container styles (top part of main container)
  const contentContainerStyles = {
    flex: 1,
    borderBottom: `${stroke.DEFAULT} solid ${colors.border.default}`,
    paddingTop: spacing.spacing[36],
    paddingBottom: spacing.spacing[24],
    paddingLeft: spacing.spacing[36],
    paddingRight: spacing.spacing[36],
    display: 'flex',
    flexDirection: 'column' as const,
    gap: spacing.spacing[16],
    overflowY: 'auto' as const,
    scrollbarWidth: 'thin' as const,
    scrollbarColor: `${colors.border.default} transparent`,
  };

  // Text container styles
  const textContainerStyles = {
    width: '100%',
    flexShrink: 0,
    display: 'flex',
    flexDirection: 'column' as const,
    gap: spacing.spacing[8],
  };

  // Title styles using Awesome Serif
  const titleStyles = {
    fontFamily: typography.fontFamily['awesome-serif'],
    fontSize: typography.desktop.size['4xl'],
    fontWeight: typography.desktop.weight.semibold,
    lineHeight: typography.desktop.lineHeight.leading7,
    letterSpacing: typography.desktop.letterSpacing.normal,
    color: colors.text.default,
    margin: 0,
  };

  // Subtitle styles
  const subtitleStyles = {
    ...textStyles.sm.normal,
    color: colors.text.muted,
    margin: 0,
  };

  // Files list container styles
  const filesListStyles = {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: spacing.spacing[2],
    marginTop: spacing.spacing[16],
    maxHeight: '200px', // Limit height to show multiple files
    overflowY: 'auto' as const,
    scrollbarWidth: 'thin' as const,
    scrollbarColor: `${colors.border.default} transparent`,
  };

  // File list item styles
  const fileItemStyles = {
    display: 'flex',
    flexDirection: 'row' as const,
    alignItems: 'center',
    gap: spacing.spacing[12],
    padding: spacing.spacing[12],
    backgroundColor: colors.bg.card.subtle,
    borderRadius: cornerRadius.borderRadius.md,
    border: `${stroke.DEFAULT} solid ${colors.border.default}`,
    maxWidth: '100%',
    minWidth: 0, // Allow shrinking
  };

  // File icon container styles
  const fileIconContainerStyles = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '32px',
    height: '32px',
    flexShrink: 0,
  };

  // File info container styles
  const fileInfoContainerStyles = {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: spacing.spacing[2],
    flex: 1,
    minWidth: 0,
  };

  // File name styles
  const fileNameStyles = {
    ...textStyles.sm.medium,
    color: colors.text.default,
    margin: 0,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap' as const,
    maxWidth: '300px', // Limit width to prevent card expansion
  };

  // File meta styles
  const fileMetaStyles = {
    display: 'flex',
    flexDirection: 'row' as const,
    alignItems: 'center',
    gap: spacing.spacing[8],
  };

  // File type badge styles
  const fileTypeBadgeStyles = {
    ...textStyles.xs.medium,
    color: colors.text.muted,
    margin: 0,
  };

  // File size styles
  const fileSizeStyles = {
    ...textStyles.xs.normal,
    color: colors.text.subtle,
    margin: 0,
  };

  // Delete button styles
  const deleteButtonStyles = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '24px',
    height: '24px',
    borderRadius: cornerRadius.borderRadius.sm,
    backgroundColor: 'transparent',
    border: 'none',
    cursor: 'pointer',
    color: colors.icon.muted,
    flexShrink: 0,
    transition: 'all 0.15s ease-in-out',
  };

  // Button container styles (bottom part of main container)
  const buttonContainerStyles = {
    paddingTop: spacing.spacing[20],
    paddingBottom: spacing.spacing[20],
    paddingLeft: spacing.spacing[36],
    paddingRight: spacing.spacing[36],
    display: 'flex',
    flexDirection: 'row' as const,
    gap: spacing.spacing[4],
  };

  // Accuracy bar (right side) styles
  const accuracyBarStyles = {
    width: '200px',
    backgroundColor: colors.bg.subtle,
    paddingTop: spacing.spacing[16],
    paddingBottom: spacing.spacing[16],
    paddingLeft: spacing.spacing[16],
    paddingRight: spacing.spacing[16],
    display: 'flex',
    flexDirection: 'column' as const,
    justifyContent: 'space-between',
  };

  // Bar container styles
  const barContainerStyles = {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'stretch',
    width: '100%',
  };

  // Lines bar container styles
  const linesBarContainerStyles = {
    width: '100%',
    display: 'flex',
    flexDirection: 'row' as const,
    gap: '2px',
  };

  // Individual line bar styles (with red accent for first 4 lines, orange for next 15, green for next 8)
  // 70% complete = 19 out of 27 bars filled (4 red + 15 orange + 0 green would be ~70%, but let's show some green)
  const getLineBarStyles = (index: number) => {
    // 70% of 27 = ~19 bars filled
    // Show: 4 red, 12 orange, 3 green = 19 bars total
    if (index < 4) {
      return {
        flex: '1 1 0',
        minWidth: '2px',
        height: '18px',
        backgroundColor: primitiveColors.red[500],
        borderRadius: cornerRadius.borderRadius['2xs'],
      };
    } else if (index < 16) {
      return {
        flex: '1 1 0',
        minWidth: '2px',
        height: '18px',
        backgroundColor: primitiveColors.orange[500],
        borderRadius: cornerRadius.borderRadius['2xs'],
      };
    } else if (index < 19) {
      return {
        flex: '1 1 0',
        minWidth: '2px',
        height: '18px',
        backgroundColor: primitiveColors.teal[600],
        borderRadius: cornerRadius.borderRadius['2xs'],
      };
    } else {
      return {
        flex: '1 1 0',
        minWidth: '2px',
        height: '18px',
        backgroundColor: primitiveColors.transparentDark[10],
        borderRadius: cornerRadius.borderRadius['2xs'],
      };
    }
  };

  // Divider styles
  const dividerStyles = {
    width: '100%',
    height: '1px',
    backgroundColor: colors.border.default,
  };

  // Steps container styles
  const stepsContainerStyles = {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: spacing.spacing[6],
  };

  // Step item styles
  const stepItemStyles = {
    display: 'flex',
    flexDirection: 'row' as const,
    alignItems: 'center',
    gap: spacing.spacing[8],
  };

  // Step text styles
  const stepTextStyles = {
    ...textStyles.xs.normal,
    color: colors.text.muted,
    margin: 0,
    flex: 1,
  };

  // Label text styles
  const labelTextStyles = {
    ...textStyles.xs.semibold,
    color: colors.text.muted,
    margin: 0,
  };

  // Info text styles
  const infoTextStyles = {
    ...textStyles.xs.normal,
    color: colors.text.muted,
    margin: 0,
  };

  // Steps list
  const steps = [
    { label: 'LinkedIn URL', active: true },
    { label: 'WhatsApp Number', active: true },
    { label: 'Frequency', active: true },
    { label: 'Goals', active: true },
    { label: 'Pillars', active: true },
    { label: 'Format', active: true },
    { label: 'Knowledge', active: false },
  ];

  // Get file type from file name
  const getFileType = (fileName: string, fileType?: string): string => {
    const extension = fileName.split('.').pop()?.toLowerCase();
    if (fileType?.startsWith('image/')) return 'image';
    if (fileType?.startsWith('video/')) return 'video';
    if (fileType?.startsWith('audio/')) return 'audio';
    if (extension === 'pdf') return 'pdf';
    if (['js', 'ts', 'jsx', 'tsx', 'json', 'html', 'css'].includes(extension || '')) return 'code';
    if (['zip', 'rar', '7z'].includes(extension || '')) return 'zip';
    return 'default';
  };

  // Format file size
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  return (
    <div style={pageContainerStyles}>
      {/* Custom scrollbar styles */}
      <style>{`
        .knowledge-content-container::-webkit-scrollbar {
          width: 8px;
        }
        .knowledge-content-container::-webkit-scrollbar-track {
          background: transparent;
        }
        .knowledge-content-container::-webkit-scrollbar-thumb {
          background-color: ${colors.border.default};
          border-radius: 4px;
        }
        .knowledge-content-container::-webkit-scrollbar-thumb:hover {
          background-color: ${colors.border.darker};
        }
        .knowledge-files-list::-webkit-scrollbar {
          width: 6px;
        }
        .knowledge-files-list::-webkit-scrollbar-track {
          background: transparent;
        }
        .knowledge-files-list::-webkit-scrollbar-thumb {
          background-color: ${colors.border.default};
          border-radius: 3px;
        }
        .knowledge-files-list::-webkit-scrollbar-thumb:hover {
          background-color: ${colors.border.darker};
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        /* Hide URL section and divider from FileUpload component */
        [data-upload-section="url"] {
          display: none !important;
        }
        /* Hide divider that appears before URL section */
        div:has(+ [data-upload-section="url"]) {
          display: none !important;
        }
      `}</style>

      {/* TopNav Bar - Stuck to the top */}
      <div style={{ position: 'sticky', top: 0, zIndex: 100 }}>
        <TopNav />
      </div>

      {/* Main content container */}
      <div style={mainContentStyles}>
        {/* Main card container */}
        <div style={mainCardStyles}>
          {/* Main container (left side) */}
          <div style={mainContainerStyles}>
            {/* Content container */}
            <div className="knowledge-content-container" style={contentContainerStyles}>
              {/* Text container */}
              <div style={textContainerStyles}>
                <h1 style={titleStyles}>Your Knowledge</h1>
                <p style={subtitleStyles}>
                  Add books, meeting or video transcripts, URL's or any material that could create a deeper knowledge about your work and the things you want to say.
                </p>
              </div>

              {/* File Upload Component */}
              <FileUpload
                ref={fileUploadRef}
                onFileSelect={handleFileSelect}
                onUrlSubmit={undefined} // Disable auto-submit
                urlValue=""
                onUrlChange={() => {}} // Disable URL input in FileUpload
                urlPlaceholder=""
                maxFiles={10}
                maxTotalSize={100 * 1024 * 1024} // 100MB
                uploading={uploading}
                disabled={saving}
              />

              {/* Custom URL Input Section */}
              <div style={{
                display: 'flex',
                flexDirection: 'column' as const,
                gap: spacing.spacing[8],
                marginTop: spacing.spacing[16],
              }}>
                <p style={{
                  ...textStyles.sm.medium,
                  color: colors.text.default,
                  margin: 0,
                }}>
                  Drop a link to a website
                </p>
                <div style={{
                  display: 'flex',
                  flexDirection: 'row' as const,
                  gap: spacing.spacing[8],
                  alignItems: 'stretch', // Stretch to match heights
                }}>
                  <div style={{ flex: 1 }}>
                    <Input
                      size="lg"
                      style="default"
                      value={urlInput}
                      onChange={(e) => setUrlInput(e.target.value)}
                      placeholder="example.com"
                      disabled={saving}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleUrlSubmit();
                        }
                      }}
                    />
                  </div>
                  <div style={{ display: 'flex', alignItems: 'stretch' }}>
                    <Button
                      style="primary"
                      size="md"
                      label="Add"
                      onClick={handleUrlSubmit}
                      disabled={!urlInput.trim() || saving}
                    />
                  </div>
                </div>
              </div>

              {/* Files list */}
              {knowledgeFiles && knowledgeFiles.length > 0 && (
                <div className="knowledge-files-list" style={filesListStyles}>
                  {knowledgeFiles.map((file) => {
                    const fileType = getFileType(file.name, file.type);
                    const fileStatus = file.status || 'ready';
                    
                    return (
                      <div key={file.id} style={fileItemStyles}>
                        {/* File icon */}
                        <div style={fileIconContainerStyles}>
                          <FileText 
                            size={20} 
                            color={colors.icon.default}
                          />
                        </div>

                        {/* File info */}
                        <div style={fileInfoContainerStyles}>
                          <p style={fileNameStyles}>{file.name}</p>
                          <div style={fileMetaStyles}>
                            <span style={fileTypeBadgeStyles}>
                              {fileType.toUpperCase()}
                            </span>
                            {file.size && (
                              <>
                                <span style={{
                                  ...textStyles.xs.normal,
                                  color: colors.text.subtle,
                                  margin: 0,
                                }}>•</span>
                                <span style={fileSizeStyles}>
                                  {formatFileSize(file.size)}
                                </span>
                              </>
                            )}
                          </div>
                        </div>

                        {/* Status icon */}
                        <div style={{ flexShrink: 0 }}>
                          {fileStatus === 'ready' && (
                            <CheckCircle2 size={16} color={colors.icon.success} />
                          )}
                          {fileStatus === 'uploading' && (
                            <Loader size={16} color={colors.icon.warning} style={{ animation: 'spin 1s linear infinite' }} />
                          )}
                          {fileStatus === 'error' && (
                            <AlertCircle size={16} color={colors.icon.destructive} />
                          )}
                        </div>

                        {/* Delete button */}
                        <button
                          style={deleteButtonStyles}
                          onClick={() => handleFileDelete(file.id)}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = colors.bg.state.soft;
                            e.currentTarget.style.color = colors.icon.destructive;
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = 'transparent';
                            e.currentTarget.style.color = colors.icon.muted;
                          }}
                          disabled={saving}
                        >
                          <X size={16} />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Button container */}
            <div style={buttonContainerStyles}>
              <div style={{ flex: 1 }}>
                <Button
                  style="secondary"
                  size="sm"
                  label="Back"
                  onClick={handleGoBack}
                  fullWidth
                  disabled={saving}
                />
              </div>
              <div style={{ flex: 1 }}>
                <Button
                  style="primary"
                  size="sm"
                  label={saving ? "Saving..." : "Continue"}
                  leadIcon={saving ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : undefined}
                  tailIcon={!saving ? <ArrowRight size={16} /> : undefined}
                  onClick={handleContinue}
                  fullWidth
                  disabled={saving}
                />
              </div>
            </div>
          </div>

          {/* Accuracy bar (right side) */}
          <div style={accuracyBarStyles}>
            {/* Bar container */}
            <div style={barContainerStyles}>
              <p style={labelTextStyles}>Result Accuracy</p>
              <div style={{ marginTop: spacing.spacing[8] }}>
                <div style={linesBarContainerStyles}>
                  {[...Array(27)].map((_, index) => (
                    <div key={index} style={getLineBarStyles(index)} />
                  ))}
                </div>
              </div>
              <p style={{ ...infoTextStyles, marginTop: spacing.spacing[4] }}>70% Complete</p>
              <div style={{ ...dividerStyles, marginTop: spacing.spacing[8] }} />
              <p style={{ ...infoTextStyles, marginTop: spacing.spacing[8] }}>
                The more information you provide about yourself, the better the results will be.
              </p>
            </div>

            {/* Steps container */}
            <div style={stepsContainerStyles}>
              <div style={dividerStyles} />
              {steps.map((step) => (
                <React.Fragment key={step.label}>
                  <div style={stepItemStyles}>
                    <Badge variant="dot" size="sm" color={step.active ? "green" : "neutral"} />
                    <p style={stepTextStyles}>{step.label}</p>
                  </div>
                  <div style={dividerStyles} />
                </React.Fragment>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Knowledge;

