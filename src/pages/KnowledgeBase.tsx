import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/api/useAuth';
import { useContent } from '@/hooks/api/useContent';
import { useTheme } from '@/services/theme-context';
import { useTranslation } from '@/services/i18n-context';
import { useIsMobile } from '@/hooks/use-mobile';
import { useToast } from '@/design-system/components/Toast';
import TranscriptService from '@/services/transcriptService';
import { supabase } from '@/integrations/supabase/client';

// Design System Components
// Sidebar is provided by MainAppChrome layout
import FileUpload from '@/design-system/components/FileUpload';
import FileCard from '@/design-system/components/FileCard';
// COMMENTED OUT: Tabs temporarily disabled
// import Tabs from '@/design-system/components/Tabs';
import DropdownButton from '@/design-system/components/DropdownButton';
import Input from '@/design-system/components/Input';
import EmptyState from '@/design-system/components/EmptyState';
import SubtleLoadingSpinner from '@/design-system/components/SubtleLoadingSpinner';
import Button from '@/design-system/components/Button';
import Pagination from '@/design-system/components/Pagination';
import TranscriptPasteModal from '@/design-system/components/TranscriptPasteModal';
import FilePreviewModal from '@/design-system/components/FilePreviewModal';

// Design System Tokens
import { spacing } from '@/design-system/tokens/spacing';
import { textStyles } from '@/design-system/styles/typography/typography-styles';
import { typography } from '@/design-system/tokens/typography';
import { cornerRadius } from '@/design-system/tokens/corner-radius';
import { getShadow } from '@/design-system/tokens/shadows';

// Icons
import { MagnifyingGlass as Search, FileText, Calendar, DotsThree as MoreHorizontal } from '@phosphor-icons/react';

// Avatar utilities
import { getUserAvatarUrl } from '@/utils/avatarUtils';

const KnowledgeBase = () => {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const { colors } = useTheme();
  const { t } = useTranslation();
  const isMobile = useIsMobile();
  const { toast, removeToast } = useToast();
  
  console.log('KnowledgeBase: Component rendered, user:', user?.id, 'profile:', profile?.id);
  
  // Track component lifecycle
  useEffect(() => {
    console.log('KnowledgeBase: Component mounted');
    return () => {
      console.log('KnowledgeBase: Component unmounting');
    };
  }, []);
  
  // ========== CLEAN CONTENT STATE MANAGEMENT ==========
  const {
    knowledgeFiles,
    loadingFiles: loading,
    uploading,
    totalFilesCount,
    loadingCount,
    currentPage: hookCurrentPage,
    itemsPerPage: hookItemsPerPage,
    loadKnowledgeFiles,
    loadKnowledgeFilesCount,
    uploadFiles,
    deleteKnowledgeFile,
    addLink,
    getFileTypeFromName,
    validateFileType,
    error,
    clearError
  } = useContent();

  // ========== LOCAL COMPONENT STATE ==========
  // Sidebar handled by layout
  // COMMENTED OUT: Filter tabs temporarily disabled
  // const [activeTab, setActiveTab] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('lastAdded');
  const [selectedAudioFile, setSelectedAudioFile] = useState(null);
  const [showAudioModal, setShowAudioModal] = useState(false);
  const [urlInput, setUrlInput] = useState('');
  const [showTranscriptModal, setShowTranscriptModal] = useState(false);
  const [processingTranscript, setProcessingTranscript] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [previewFile, setPreviewFile] = useState(null);
  
  // Ref for FileUpload component to trigger file selection
  const fileUploadRef = useRef(null);

  // Content container wrapped by MainAppChrome 840px container

  // Content container styles
  const containerStyles: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: spacing.spacing[24],
    backgroundColor: 'transparent',
  };

  // Title style using Instrument Serif font, 3xl normal
  const titleStyle = {
    fontFamily: typography.fontFamily['instrument-serif'],
    fontSize: typography.desktop.size['3xl'],
    fontWeight: typography.desktop.weight.normal,
    lineHeight: typography.desktop.lineHeight.leading7,
    letterSpacing: typography.desktop.letterSpacing.normal,
    color: colors.text.default,
    margin: 0,
  };


  // COMMENTED OUT: Filter tabs configuration (temporarily disabled)
  // const filterTabs = [
  //   { id: 'all', label: 'All' },
  //   { id: 'files', label: 'Files' },
  //   { id: 'images', label: 'Images' },
  //   { id: 'audio', label: 'Audio' },
  //   { id: 'links', label: 'Links' },
  // ];

  // Sort dropdown options
  const sortOptions = [
    { label: t('knowledge.sort.lastAdded'), onClick: () => setSortBy('lastAdded') },
    { label: t('knowledge.sort.nameAsc'), onClick: () => setSortBy('nameAsc') },
    { label: t('knowledge.sort.nameDesc'), onClick: () => setSortBy('nameDesc') },
    { label: t('knowledge.sort.sizeLarge'), onClick: () => setSortBy('sizeLarge') },
    { label: t('knowledge.sort.sizeSmall'), onClick: () => setSortBy('sizeSmall') },
  ];

  // Get current sort label
  const getCurrentSortLabel = () => {
    const option = sortOptions.find(opt => 
      (sortBy === 'lastAdded' && opt.label === t('knowledge.sort.lastAdded')) ||
      (sortBy === 'nameAsc' && opt.label === t('knowledge.sort.nameAsc')) ||
      (sortBy === 'nameDesc' && opt.label === t('knowledge.sort.nameDesc')) ||
      (sortBy === 'sizeLarge' && opt.label === t('knowledge.sort.sizeLarge')) ||
      (sortBy === 'sizeSmall' && opt.label === t('knowledge.sort.sizeSmall'))
    );
    return option?.label || t('knowledge.sort.lastAdded');
  };

  // Transform knowledge files to FileCard format - memoized to prevent unnecessary recalculations
  const getFileCards = useMemo(() => {
    if (!Array.isArray(knowledgeFiles)) {
      console.error('KnowledgeBase: knowledgeFiles is not an array:', knowledgeFiles);
      return [];
    }
    
    console.log('KnowledgeBase: Transforming', knowledgeFiles.length, 'files to cards');
    console.log('KnowledgeBase: Raw knowledge files data:', knowledgeFiles);
    return knowledgeFiles.filter(item => {
      console.log('KnowledgeBase: Processing item:', item);
      return item && item.type;
    }).map(item => {
      // Use the same file type detection logic as the service layer
      const detectedFileType = getFileTypeFromName(item.name || '');
      
      // Map detected file type to FileCard expected types
      let cardFileType = 'default';
      
      if (item.type === 'link') {
        cardFileType = 'link';
      } else {
        // Use filename-based detection for more accurate icons
        switch (detectedFileType) {
          case 'image':
            cardFileType = 'image';
            break;
          case 'video':
            cardFileType = 'video';
            break;
          case 'audio':
            cardFileType = 'audio';
            break;
          case 'document':
            // Check for specific document types for better icons
            if (item.name?.toLowerCase().endsWith('.pdf')) {
              cardFileType = 'pdf';
            } else if (item.name?.toLowerCase().endsWith('.zip')) {
              cardFileType = 'zip';
            } else if (['.txt', '.md', '.csv', '.json', '.docx', '.doc', '.pptx', '.ppt', '.xlsx', '.xls'].some(ext => 
              item.name?.toLowerCase().endsWith(ext))) {
              cardFileType = 'code'; // Use code icon for text-based files
            } else {
              cardFileType = 'default';
            }
            break;
          default:
            cardFileType = 'default';
        }
      }

      // Create enhanced subtitle with file-specific information
      let subtitle = '';
      
      if (item.type === 'audio') {
        const transcriptionStatus = item.extraction_metadata?.transcription_status || 'unknown';
        const hasTranscription = item.extracted_content && item.extracted_content.length > 0;
        
        subtitle = `${item.size ? `${(item.size / 1024).toFixed(1)} KB` : ''} • ${item.created_at ? new Date(item.created_at).toLocaleDateString() : 'Unknown Date'}`;
        
        if (hasTranscription) {
          subtitle += ` • ${t('knowledge.transcriptionStatus.transcribed')}`;
        } else if (transcriptionStatus === 'error') {
          subtitle += ` • ${t('knowledge.transcriptionStatus.failed')}`;
        } else if (transcriptionStatus === 'completed') {
          subtitle += ` • ${t('knowledge.transcriptionStatus.ready')}`;
        } else {
          subtitle += ` • ${t('knowledge.transcriptionStatus.pending')}`;
        }
        
        // Add source info if available
        if (item.metadata?.source === 'whatsapp') {
          subtitle += ` • ${t('knowledge.transcriptionStatus.whatsapp')}`;
        }
      } else {
        subtitle = `${item.size ? `${(item.size / 1024).toFixed(1)} KB` : ''} • ${item.created_at ? new Date(item.created_at).toLocaleDateString() : 'Unknown Date'}`;
      }

      return {
        id: item.id || 'unknown',
        title: item.name || 'Unknown File',
        subtitle: subtitle,
        fileType: cardFileType,
        status: 'ready',
        fileSize: item.size || 0,
        onClick: () => handleFileClick({
          id: item.id || 'unknown',
          name: item.name || 'Unknown File', // Add name property for preview modal
          title: item.name || 'Unknown File',
          subtitle: subtitle,
          fileType: cardFileType,
          status: 'ready',
          fileSize: item.size || 0,
          metadata: item.type === 'audio' ? {
            transcription: item.extracted_content,
            transcriptionStatus: item.extraction_metadata?.transcription_status,
            source: item.metadata?.source,
            contactId: item.metadata?.contact_identifier
          } : undefined
        }),
        // Add additional metadata for audio files
        metadata: item.type === 'audio' ? {
          transcription: item.extracted_content,
          transcriptionStatus: item.extraction_metadata?.transcription_status,
          source: item.metadata?.source,
          contactId: item.metadata?.contact_identifier
        } : undefined
      };
    });
  }, [knowledgeFiles, getFileTypeFromName]);

  // Server-side filtering is now handled by the backend
  // No need for client-side filtering anymore

  // Sort files based on sortBy - memoized
  const getSortedFiles = useCallback((files) => {
    switch (sortBy) {
      case 'nameAsc':
        return [...files].sort((a, b) => a.title.localeCompare(b.title));
      case 'nameDesc':
        return [...files].sort((a, b) => b.title.localeCompare(a.title));
      case 'sizeLarge':
        return [...files].sort((a, b) => (b.fileSize || 0) - (a.fileSize || 0));
      case 'sizeSmall':
        return [...files].sort((a, b) => (a.fileSize || 0) - (b.fileSize || 0));
      case 'lastAdded':
      default:
        return files; // Already sorted by creation date from backend
    }
  }, [sortBy]);

  // Get final sorted files - server handles filtering and search
  const getDisplayFiles = useMemo(() => {
    const allFiles = getFileCards;
    const sortedFiles = getSortedFiles(allFiles);
    
    // Server-side pagination - files are already filtered and searched
    return {
      files: sortedFiles, // These are already the files for the current page
      totalFiles: totalFilesCount, // Total count from server (with filters applied)
      totalPages: Math.ceil(totalFilesCount / hookItemsPerPage)
    };
  }, [getFileCards, getSortedFiles, totalFilesCount, hookItemsPerPage]);

  // Handle page changes
  const handlePageChange = useCallback((page: number) => {
    // TEMPORARY: Not using filter tabs, so we pass 'all' or undefined for filter
    loadKnowledgeFiles(page, undefined, searchQuery);
  }, [loadKnowledgeFiles, searchQuery]);

  // Reset to page 1 and reload when search query changes (filter temporarily disabled)
  React.useEffect(() => {
    // Load files with search only (no filter for now)
    loadKnowledgeFiles(1, undefined, searchQuery);
    // Load count with search only (no filter for now)
    loadKnowledgeFilesCount(undefined, searchQuery);
  }, [searchQuery, loadKnowledgeFiles, loadKnowledgeFilesCount]);
  
  // Keep activeTab in state for when we re-enable filters later
  // (commented out the effect that was watching activeTab changes)

  // File upload handlers - memoized to prevent unnecessary re-renders
  const handleFileSelect = useCallback(async (files) => {
    if (!files || files.length === 0) return;

    console.log('KnowledgeBase: Starting file upload for', files.length, 'files');

    // Validate files before upload
    const fileArray = Array.from(files);
    const validationErrors = [];
    const validFiles = [];

    for (const file of fileArray) {
      const validation = validateFileType(file);
      if (!validation.valid) {
        validationErrors.push(`${file.name}: ${validation.error}`);
      } else {
        validFiles.push(file);
      }
    }

    // Show validation errors if any
    if (validationErrors.length > 0) {
      const errorMessage = validationErrors.length === 1 
        ? validationErrors[0]
        : `${validationErrors.length} ${t('knowledge.messages.files')} have issues:\n${validationErrors.join('\n')}`;
      
      toast.error(errorMessage, {
        title: t('knowledge.messages.validationFailed'),
        duration: 8000 // Longer duration for validation errors
      });
      
      // If no valid files, stop here
      if (validFiles.length === 0) return;
      
      // Show info about proceeding with valid files
      if (validFiles.length < fileArray.length) {
        const fileText = validFiles.length === 1 
          ? t('knowledge.messages.validFile')
          : t('knowledge.messages.validFiles');
        toast.info(`${t('knowledge.messages.proceedingWithValid')} ${validFiles.length} ${fileText}`, {
          duration: 4000
        });
      }
    }

    // Show loading toast for upload
    const fileText = validFiles.length === 1 
      ? t('knowledge.messages.file')
      : t('knowledge.messages.files');
    const loadingToastId = toast.loading(
      `${t('knowledge.messages.uploading')} ${validFiles.length} ${fileText}...`,
      { title: t('knowledge.messages.uploadProgress') }
    );

    try {
      const result = await uploadFiles(validFiles);
      
      // Remove loading toast
      removeToast(loadingToastId);
      
      if (result.error) {
        console.error('KnowledgeBase: Upload error:', result.error);
        
        // Provide user-friendly error messages
        const userFriendlyError = getUserFriendlyUploadError(result.error);
        toast.error(userFriendlyError, {
          title: t('knowledge.messages.uploadFailed'),
          duration: 6000
        });
        return;
      }
      
      console.log('KnowledgeBase: Files uploaded successfully:', result);
      
      // Show success message with file count
      const successMessage = validFiles.length === 1 
        ? t('knowledge.messages.uploadSuccess')
        : `${validFiles.length} ${t('knowledge.messages.uploadSuccessMultiple')}`;
        
      toast.success(successMessage, {
        title: t('knowledge.messages.uploadComplete'),
        duration: 4000
      });
      
      // Prevent any potential page reload
      return false;
    } catch (error: any) {
      // Remove loading toast
      removeToast(loadingToastId);
      
      console.error('KnowledgeBase: Upload exception:', error);
      const userFriendlyError = getUserFriendlyUploadError(error.message || 'Upload failed');
      toast.error(userFriendlyError, {
        title: t('knowledge.messages.uploadError'),
        duration: 6000
      });
    }
  }, [uploadFiles, validateFileType, toast, removeToast, t]);

  const handleUrlSubmit = useCallback(async (url) => {
    if (!url.trim()) return;

    // Basic URL validation
    const urlPattern = /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/;
    if (!urlPattern.test(url.trim())) {
      toast.error(t('knowledge.errors.invalidUrl'), {
        title: t('knowledge.messages.linkFailed'),
        duration: 5000
      });
      return;
    }

    // Show loading toast
    const loadingToastId = toast.loading(t('knowledge.messages.processingLink'), {
      title: t('knowledge.messages.processingLinkTitle')
    });

    try {
      const result = await addLink({ url: url.trim() });
      
      // Remove loading toast
      removeToast(loadingToastId);
      
      if (result.error) {
        const userFriendlyError = getUserFriendlyLinkError(result.error);
        toast.error(userFriendlyError, {
          title: t('knowledge.messages.linkFailed'),
          duration: 6000
        });
        return;
      }
      
      toast.success(t('knowledge.messages.linkAdded'), {
        title: t('knowledge.messages.linkAddedTitle'),
        duration: 4000
      });
      setUrlInput('');
    } catch (error: any) {
      // Remove loading toast
      removeToast(loadingToastId);
      
      const userFriendlyError = getUserFriendlyLinkError(error.message || 'Failed to add link');
      toast.error(userFriendlyError, {
        title: t('knowledge.messages.linkError'),
        duration: 6000
      });
    }
  }, [addLink, toast, removeToast, setUrlInput, t]);

  const handleFileAction = useCallback(async (action, fileId) => {
    if (action === 'delete') {
      // Find the file name for better user feedback
      const file = knowledgeFiles.find(f => f.id === fileId);
      const fileName = file?.name || t('knowledge.messages.file');
      
      // Show loading toast
      const loadingToastId = toast.loading(`${t('knowledge.messages.deleting')} ${fileName}...`, {
        title: t('knowledge.messages.deleting')
      });
      
      try {
        const result = await deleteKnowledgeFile(fileId);
        
        // Remove loading toast
        toast.removeToast(loadingToastId);
        
        if (result.error) {
          const userFriendlyError = getUserFriendlyDeleteError(result.error);
          toast.error(userFriendlyError, {
            title: t('knowledge.messages.deleteFailed'),
            duration: 6000
          });
          return;
        }
        
        toast.success(`${fileName} ${t('knowledge.messages.deleteSuccess')}`, {
          title: t('knowledge.buttons.delete'),
          duration: 4000
        });
      } catch (error: any) {
        // Remove loading toast
        toast.removeToast(loadingToastId);
        
        const userFriendlyError = getUserFriendlyDeleteError(error.message || 'Failed to delete file');
        toast.error(userFriendlyError, {
          title: t('knowledge.messages.deleteError'),
          duration: 6000
        });
      }
    }
  }, [knowledgeFiles, deleteKnowledgeFile, toast, removeToast, t]);

  const handleFileClick = useCallback((file) => {
    // For audio files with transcription, show the existing audio modal
    if (file.fileType === 'audio' && file.metadata?.transcription) {
      setSelectedAudioFile(file);
      setShowAudioModal(true);
    } else {
      // For all other files, show the new preview modal
      setPreviewFile(file);
      setShowPreviewModal(true);
    }
  }, []);

  // Transcript handling functions
  const handleTranscriptPaste = useCallback(() => {
    setShowTranscriptModal(true);
  }, []);

  const handleTranscriptSubmit = async (transcriptData: { title: string; transcript: string; source: string }) => {
    try {
      setProcessingTranscript(true);

      // Validate the transcript
      const validation = TranscriptService.validateTranscript(transcriptData.transcript);
      if (!validation.isValid) {
        toast.error(validation.errors[0] || 'Invalid transcript format', {
          title: t('knowledge.messages.validationError'),
          duration: 6000
        });
        return;
      }

      // Parse the transcript to get additional metadata
      const parsedTranscript = TranscriptService.parseTranscript(transcriptData.transcript);

      // Show loading toast
      const loadingToastId = toast.loading(`${t('knowledge.messages.processingTranscript')} "${transcriptData.title}"...`, {
        title: t('knowledge.messages.processingTranscriptTitle')
      });

      // Get the user's session token
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        throw new Error('No valid session found. Please sign in again.');
      }

      // Call the manual transcript processor endpoint
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/manual-transcript-processor`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          title: transcriptData.title,
          transcript: transcriptData.transcript,
          source: transcriptData.source,
          participants: parsedTranscript.participants,
          duration_minutes: Math.floor(parsedTranscript.metadata.estimatedDuration / 60),
          meeting_date: new Date().toISOString()
        })
      });

      // Remove loading toast
      toast.removeToast(loadingToastId);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Server error: ${response.status}`);
      }

      const result = await response.json();

      if (result.success) {
        setShowTranscriptModal(false);
        toast.success(`${t('knowledge.messages.transcriptProcessed')} "${transcriptData.title}" ${t('knowledge.messages.transcriptSaved')}`, {
          title: t('knowledge.messages.transcriptSavedTitle'),
          description: `${t('knowledge.messages.transcriptAddedWith')} ${result.data.participants} ${t('knowledge.messages.participants')}`,
          duration: 6000
        });

        // Reload the knowledge files to show the new transcript
        // The useContent hook should handle this automatically
      } else {
        throw new Error(result.error || 'Failed to process transcript');
      }

    } catch (error: any) {
      console.error('Error processing transcript:', error);
      toast.error(error.message || t('knowledge.messages.transcriptFailed'), {
        title: t('knowledge.messages.transcriptFailedTitle'),
        duration: 6000
      });
    } finally {
      setProcessingTranscript(false);
    }
  };

  // Sidebar event handlers
  const handleMenuItemClick = (menuId: string) => {
    switch (menuId) {
      case 'home':
        navigate('/product-home');
        break;
      case 'profile':
        navigate('/profile');
        break;
      case 'knowledge':
        // Already on knowledge
        break;
      case 'history':
        navigate('/posts');
        break;
      default:
        console.log('Navigation for:', menuId);
    }
  };

  const handleCreateNewClick = () => {
    navigate('/content-editor');
  };

  const handleAvatarClick = () => {
    navigate('/profile');
  };

  const handleSignOut = async () => {
    // Handle sign out if needed
  };

  // Helper function to convert technical errors to user-friendly messages
  const getUserFriendlyUploadError = (error: string) => {
    if (error.includes('file too large') || error.includes('size limit')) {
      return t('knowledge.errors.fileTooLarge');
    }
    if (error.includes('unsupported file type') || error.includes('file type')) {
      return t('knowledge.errors.unsupportedFileType');
    }
    if (error.includes('authentication') || error.includes('unauthorized')) {
      return t('knowledge.errors.sessionExpired');
    }
    if (error.includes('network') || error.includes('connection')) {
      return t('knowledge.errors.networkError');
    }
    if (error.includes('storage') || error.includes('quota')) {
      return t('knowledge.errors.storageLimit');
    }
    if (error.includes('duplicate') || error.includes('already exists')) {
      return t('knowledge.errors.duplicateFile');
    }
    
    // Default fallback for unknown errors
    return t('knowledge.errors.uploadFailed');
  };

  const getUserFriendlyLinkError = (error: string) => {
    if (error.includes('invalid url') || error.includes('malformed')) {
      return t('knowledge.errors.invalidUrl');
    }
    if (error.includes('not accessible') || error.includes('unreachable')) {
      return t('knowledge.errors.urlNotAccessible');
    }
    if (error.includes('timeout')) {
      return t('knowledge.errors.urlTimeout');
    }
    if (error.includes('duplicate') || error.includes('already exists')) {
      return t('knowledge.errors.duplicateLink');
    }
    
    // Default fallback
    return t('knowledge.errors.linkFailed');
  };

  const getUserFriendlyDeleteError = (error: string) => {
    if (error.includes('not found') || error.includes('does not exist')) {
      return t('knowledge.errors.fileNotFound');
    }
    if (error.includes('permission') || error.includes('unauthorized')) {
      return t('knowledge.errors.noPermission');
    }
    if (error.includes('in use') || error.includes('locked')) {
      return t('knowledge.errors.fileInUse');
    }
    
    // Default fallback
    return t('knowledge.errors.deleteFailed');
  };

  // Get user display info
  const getUserName = () => {
    if (profile?.display_name) return profile.display_name;
    if (profile?.linkedin_name) return profile.linkedin_name;
    if (user?.email) return user.email.split('@')[0];
    return 'User';
  };

  const getUserAvatar = () => {
    return getUserAvatarUrl(profile, user);
  };

  // Grid styles for file cards - responsive
  const gridStyles = {
    display: 'grid',
    gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)',
    gap: spacing.spacing[20],
    width: '100%',
    // Ensure children don't affect grid sizing
    minHeight: 0,
    minWidth: 0,
  };

  // Row styles for tabs and search - responsive
  const controlRowStyles: React.CSSProperties = {
    display: 'flex',
    flexDirection: isMobile ? 'column' : 'row',
    alignItems: isMobile ? 'stretch' : 'center',
    justifyContent: isMobile ? 'flex-start' : 'space-between',
    gap: isMobile ? spacing.spacing[16] : spacing.spacing[24],
    width: '100%',
  };

  // Right section styles for search and dropdown - responsive
  const rightSectionStyles = {
    display: 'flex',
    alignItems: 'center',
    gap: spacing.spacing[12],
    width: isMobile ? '100%' : 'auto',
  };

  return (
    <div style={containerStyles}>
          {/* Header Section */}
          <div>
            <h1 style={titleStyle}>{t('knowledge.title')}</h1>
          </div>

          {/* File Upload Area */}
          <FileUpload
            ref={fileUploadRef}
            onFileSelect={handleFileSelect}
            onUrlSubmit={handleUrlSubmit}
            urlValue={urlInput}
            onUrlChange={setUrlInput}
            urlPlaceholder={t('knowledge.urlPlaceholder')}
            accept="*/*"
            multiple={true}
            maxFiles={20}
            uploading={uploading}
          />

          {/* Transcript Paste Section */}
          <div style={{
            display: 'flex',
            flexDirection: isMobile ? 'column' : 'row',
            alignItems: isMobile ? 'stretch' : 'center',
            justifyContent: isMobile ? 'flex-start' : 'space-between',
            padding: spacing.spacing[20],
            backgroundColor: colors.bg.card.subtle,
            borderRadius: cornerRadius.borderRadius.lg,
            border: `1px solid ${colors.border.default}`,
            gap: isMobile ? spacing.spacing[16] : 0,
          }}>
            <div style={{ flex: isMobile ? 'none' : 1 }}>
              <h3 style={{
                fontFamily: typography.fontFamily['instrument-serif'],
                fontSize: typography.desktop.size.lg,
                fontWeight: typography.desktop.weight.medium,
                lineHeight: typography.desktop.lineHeight.leading6,
                letterSpacing: typography.desktop.letterSpacing.normal,
                color: colors.text.default,
                margin: 0,
                marginBottom: spacing.spacing[4],
              }}>
                {t('knowledge.transcriptSection.title')}
              </h3>
              <p style={{
                ...textStyles.sm.normal,
                color: colors.text.subtle,
                margin: 0,
              }}>
                {t('knowledge.transcriptSection.description')}
              </p>
            </div>
            <div style={{ 
              flexShrink: 0,
              alignSelf: isMobile ? 'flex-start' : 'center',
            }}>
              <Button
                label={t('knowledge.buttons.pasteTranscript')}
                style="secondary"
                size="md"
                leadIcon={<FileText size={16} />}
                onClick={handleTranscriptPaste}
                disabled={processingTranscript}
                loading={processingTranscript}
              />
            </div>
          </div>

          {/* Controls Row - Search and Sort */}
          <div style={controlRowStyles}>
            {/* COMMENTED OUT: Filter Tabs - Can be re-enabled later */}
            {/* <Tabs
              style="segmented"
              type="default"
              tabs={filterTabs}
              activeTab={activeTab}
              onTabChange={setActiveTab}
            /> */}

            {/* Right: Search and Sort */}
            <div style={{ ...rightSectionStyles, width: '100%', justifyContent: 'flex-end' }}>
              {/* Search Input */}
              <div style={{ flex: isMobile ? 1 : 'none', width: isMobile ? 'auto' : '280px' }}>
                <Input
                  size="lg"
                  style="default"
                  placeholder={t('knowledge.search.placeholder')}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  leadIcon={<Search size={16} />}
                />
              </div>

              {/* Sort Dropdown */}
              <div style={{ flexShrink: 0 }}>
                <DropdownButton
                  label={getCurrentSortLabel()}
                  items={sortOptions}
                  size="lg"
                  position="bottom-right"
                  minWidth="160px"
                />
              </div>
            </div>
          </div>

          {/* Loading State */}
          {(loading || uploading || loadingCount) && (
            <div style={{
              display: 'flex',
              justifyContent: 'center',
              padding: spacing.spacing[48],
            }}>
              <SubtleLoadingSpinner 
                title={
                  loadingCount ? t('knowledge.loading.count') :
                  loading ? t('knowledge.loading.files') : 
                  t('knowledge.loading.uploading')
                }
                size={16}
              />
            </div>
          )}

          {/* File Listing */}
          {!loading && !uploading && !loadingCount && (() => {
            const { files, totalFiles, totalPages } = getDisplayFiles;
            
            if (totalFiles === 0) {
              return (
                <EmptyState
                  title={t('knowledge.empty.title')}
                  subtitle={searchQuery ? t('knowledge.empty.subtitleSearch') : t('knowledge.empty.subtitle')}
                  buttonLabel={!searchQuery ? t('knowledge.buttons.uploadFiles') : undefined}
                  onButtonClick={!searchQuery ? () => {
                    // Trigger file selection dialog
                    if (fileUploadRef.current?.triggerFileSelect) {
                      fileUploadRef.current.triggerFileSelect();
                    }
                  } : undefined}
                />
              );
            }

            return (
              <>
                {/* Files Display */}
                <div style={gridStyles}>
                  {files.map((file) => (
                    <FileCard
                      key={file.id}
                      variant="gradient"
                      title={file.title}
                      subtitle={file.subtitle}
                      fileType={file.fileType}
                      status={file.status}
                      fileSize={file.fileSize}
                      onMenuAction={(action) => handleFileAction(action, file.id)}
                      onClick={file.onClick}
                      style={{
                        width: '100%',
                        minWidth: 0, // Allow shrinking below content size
                        maxWidth: '100%', // Prevent growing beyond grid cell
                      }}
                    />
                  ))}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div style={{
                    display: 'flex',
                    justifyContent: 'center',
                    marginTop: spacing.spacing[32],
                  }}>
                    <Pagination
                      currentPage={hookCurrentPage}
                      totalPages={totalPages}
                      onPageChange={handlePageChange}
                      showLabels={!isMobile}
                      size={isMobile ? 'sm' : 'md'}
                    />
                  </div>
                )}

                {/* Results Summary */}
                <div style={{
                  display: 'flex',
                  justifyContent: 'center',
                  marginTop: spacing.spacing[16],
                }}>
                  <span style={{
                    ...textStyles.sm.normal,
                    color: colors.text.muted,
                  }}>
                    {t('knowledge.resultsCount.showing')} {((hookCurrentPage - 1) * hookItemsPerPage) + 1} {t('knowledge.resultsCount.to')} {Math.min(hookCurrentPage * hookItemsPerPage, totalFiles)} {t('knowledge.resultsCount.of')} {totalFiles} {t('knowledge.resultsCount.files')}
                  </span>
                </div>
              </>
            );
          })()}

          {/* Audio Transcription Modal */}
          {showAudioModal && selectedAudioFile && (
            <div style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.5)',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              zIndex: 1000,
            }}>
              <div style={{
                backgroundColor: colors.bg.card.default,
                borderRadius: cornerRadius.borderRadius.lg,
                padding: spacing.spacing[24],
                maxWidth: '600px',
                width: '90%',
                maxHeight: '80vh',
                overflow: 'auto',
                border: `1px solid ${colors.border.default}`,
                boxShadow: getShadow('regular.modalMd', colors, { withBorder: true }),
              }}>
                {/* Header */}
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: spacing.spacing[16],
                }}>
                  <h2 style={{
                    ...textStyles.xl.semibold,
                    color: colors.text.default,
                    margin: 0,
                  }}>
                    {t('knowledge.audioModal.title')}
                  </h2>
                  <button
                    onClick={() => setShowAudioModal(false)}
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      color: colors.text.muted,
                      fontSize: '20px',
                      padding: spacing.spacing[4],
                    }}
                  >
                    ×
                  </button>
                </div>

                {/* File Info */}
                <div style={{
                  marginBottom: spacing.spacing[16],
                  padding: spacing.spacing[12],
                  backgroundColor: colors.bg.subtle,
                  borderRadius: cornerRadius.borderRadius.md,
                }}>
                  <p style={{
                    ...textStyles.sm.medium,
                    color: colors.text.default,
                    margin: 0,
                    marginBottom: spacing.spacing[4],
                  }}>
                    {selectedAudioFile.title}
                  </p>
                  <p style={{
                    ...textStyles.xs.normal,
                    color: colors.text.muted,
                    margin: 0,
                  }}>
                    {selectedAudioFile.subtitle}
                  </p>
                </div>

                {/* Transcription */}
                <div>
                  <h3 style={{
                    ...textStyles.md.semibold,
                    color: colors.text.default,
                    margin: 0,
                    marginBottom: spacing.spacing[12],
                  }}>
                    {t('knowledge.audioModal.transcriptionTitle')}
                  </h3>
                  <div style={{
                    padding: spacing.spacing[16],
                    backgroundColor: colors.bg.default,
                    border: `1px solid ${colors.border.default}`,
                    borderRadius: cornerRadius.borderRadius.md,
                    maxHeight: '400px',
                    overflow: 'auto',
                  }}>
                    <p style={{
                      ...textStyles.sm.normal,
                      color: colors.text.default,
                      margin: 0,
                      lineHeight: '1.6',
                      whiteSpace: 'pre-wrap',
                    }}>
                      {selectedAudioFile.metadata?.transcription || t('knowledge.audioModal.noTranscription')}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Transcript Paste Modal */}
          <TranscriptPasteModal
            isOpen={showTranscriptModal}
            onClose={() => setShowTranscriptModal(false)}
            onTranscriptSubmit={handleTranscriptSubmit}
            loading={processingTranscript}
          />

          {/* File Preview Modal */}
          <FilePreviewModal
            isOpen={showPreviewModal}
            onClose={() => {
              setShowPreviewModal(false);
              setPreviewFile(null);
            }}
            file={previewFile}
            userId={user?.id}
          />
    </div>
  );
};

export default KnowledgeBase;