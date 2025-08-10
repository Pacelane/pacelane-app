import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useContent } from '@/hooks/api/useContent';
import { useTheme } from '@/services/theme-context';
import { useToast } from '@/design-system/components/Toast';

// Design System Components
// Sidebar is provided by MainAppChrome layout
import FileUpload from '@/design-system/components/FileUpload';
import FileCard from '@/design-system/components/FileCard';
import Tabs from '@/design-system/components/Tabs';
import DropdownMenu from '@/design-system/components/DropdownMenu';
import Input from '@/design-system/components/Input';

// Design System Tokens
import { spacing } from '@/design-system/tokens/spacing';
import { textStyles } from '@/design-system/styles/typography/typography-styles';
import { typography } from '@/design-system/tokens/typography';
import { cornerRadius } from '@/design-system/tokens/corner-radius';
import { getShadow } from '@/design-system/tokens/shadows';

// Icons
import { Search, ChevronDown } from 'lucide-react';

const KnowledgeBase = () => {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const { colors } = useTheme();
  
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
  const [activeTab, setActiveTab] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('lastAdded');
  const [selectedAudioFile, setSelectedAudioFile] = useState(null);
  const [showAudioModal, setShowAudioModal] = useState(false);
  const [showSortDropdown, setShowSortDropdown] = useState(false);
  const [urlInput, setUrlInput] = useState('');

  // Content container wrapped by MainAppChrome 840px container

  // Content container styles
  const containerStyles = {
    width: '100%',
    maxWidth: '1200px',
    margin: '0 auto',
    display: 'flex',
    flexDirection: 'column',
    gap: spacing.spacing[24],
  };

  // Title style using awesome serif font, 4xl semi bold
  const titleStyle = {
    fontFamily: typography.fontFamily['awesome-serif'],
    fontSize: typography.desktop.size['4xl'],
    fontWeight: typography.desktop.weight.semibold,
    lineHeight: typography.desktop.lineHeight.leading7,
    letterSpacing: typography.desktop.letterSpacing.normal,
    color: colors.text.default,
    margin: 0,
  };

  // Subtitle style - sm medium, text subtle
  const subtitleStyle = {
    ...textStyles.sm.medium,
    color: colors.text.subtle,
    margin: 0,
    marginTop: spacing.spacing[8],
  };

  // Filter tabs configuration
  const filterTabs = [
    { id: 'all', label: 'All' },
    { id: 'files', label: 'Files' },
    { id: 'images', label: 'Images' },
    { id: 'audio', label: 'Audio' },
    { id: 'links', label: 'Links' },
  ];

  // Sort dropdown options
  const sortOptions = [
    { label: 'Last Added', onClick: () => setSortBy('lastAdded') },
    { label: 'Name A-Z', onClick: () => setSortBy('nameAsc') },
    { label: 'Name Z-A', onClick: () => setSortBy('nameDesc') },
    { label: 'Size (Largest)', onClick: () => setSortBy('sizeLarge') },
    { label: 'Size (Smallest)', onClick: () => setSortBy('sizeSmall') },
  ];

  // Transform knowledge files to FileCard format
  const getFileCards = () => {
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
      // Map file type to FileCard expected types
      let cardFileType = 'default';
      switch (item.type) {
        case 'image':
          cardFileType = 'image';
          break;
        case 'video':
          cardFileType = 'video';
          break;
        case 'audio':
          cardFileType = 'audio';
          break;
        case 'link':
          cardFileType = 'link';
          break;
        default:
          // Check file extension for more specific types
          if (item.name?.toLowerCase().endsWith('.pdf')) {
            cardFileType = 'pdf';
          } else if (item.name?.toLowerCase().endsWith('.zip')) {
            cardFileType = 'zip';
          } else {
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
          subtitle += ` • Transcribed`;
        } else if (transcriptionStatus === 'error') {
          subtitle += ` • Transcription failed`;
        } else if (transcriptionStatus === 'completed') {
          subtitle += ` • Transcription ready`;
        } else {
          subtitle += ` • Transcription pending`;
        }
        
        // Add source info if available
        if (item.metadata?.source === 'whatsapp') {
          subtitle += ` • WhatsApp`;
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
  };

  // Filter files based on active tab
  const getFilteredFiles = () => {
    const allFiles = getFileCards();
    
    if (activeTab === 'all') return allFiles;
    
    return allFiles.filter(file => {
      switch (activeTab) {
        case 'files':
          return ['default', 'pdf', 'zip'].includes(file.fileType);
        case 'images':
          return file.fileType === 'image';
        case 'audio':
          return file.fileType === 'audio';
        case 'links':
          return file.fileType === 'link';
        default:
          return true;
      }
    });
  };

  // Sort files based on sortBy
  const getSortedFiles = (files) => {
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
  };

  // File upload handlers
  const handleFileSelect = async (files) => {
    if (!files || files.length === 0) return;

    console.log('KnowledgeBase: Starting file upload for', files.length, 'files');

    try {
      const result = await uploadFiles(Array.from(files));
      
      if (result.error) {
        console.error('KnowledgeBase: Upload error:', result.error);
        toast.error(result.error);
        return;
      }
      
      console.log('KnowledgeBase: Files uploaded successfully:', result);
      toast.success('Files uploaded successfully');
      
      // Prevent any potential page reload
      return false;
    } catch (error: any) {
      console.error('KnowledgeBase: Upload exception:', error);
      toast.error(error.message || 'Failed to upload files');
    }
  };

  const handleUrlSubmit = async (url) => {
    if (!url.trim()) return;

    try {
      const result = await addLink({ url });
      
      if (result.error) {
        toast.error(result.error);
        return;
      }
      
      toast.success('Link added successfully');
      setUrlInput('');
    } catch (error: any) {
      toast.error(error.message || 'Failed to add link');
    }
  };

  const handleFileAction = async (action, fileId) => {
    if (action === 'delete') {
      try {
        const result = await deleteKnowledgeFile(fileId);
        
        if (result.error) {
          toast.error(result.error);
          return;
        }
        
        toast.success('File deleted successfully');
      } catch (error: any) {
        toast.error(error.message || 'Failed to delete file');
      }
    }
  };

  const handleFileClick = (file) => {
    if (file.fileType === 'audio' && file.metadata?.transcription) {
      setSelectedAudioFile(file);
      setShowAudioModal(true);
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

  // Get user display info
  const getUserName = () => {
    if (profile?.display_name) return profile.display_name;
    if (profile?.linkedin_name) return profile.linkedin_name;
    if (user?.email) return user.email.split('@')[0];
    return 'User';
  };

  const getUserAvatar = () => {
    return 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=48&h=48&fit=crop&crop=face';
  };

  // Grid styles for file cards - 2 columns
  const gridStyles = {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: spacing.spacing[20],
    width: '100%',
  };

  // Row styles for tabs and search
  const controlRowStyles = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.spacing[24],
    width: '100%',
  };

  // Right section styles for search and dropdown
  const rightSectionStyles = {
    display: 'flex',
    alignItems: 'center',
    gap: spacing.spacing[12],
  };

  return (
    <div style={containerStyles}>
          {/* Header Section */}
          <div>
            <h1 style={titleStyle}>Knowledge Base</h1>
            <p style={subtitleStyle}>
              Organize and access all your project files, documents, and resources in one place
            </p>
          </div>

          {/* File Upload Area */}
          <FileUpload
            onFileSelect={handleFileSelect}
            onUrlSubmit={handleUrlSubmit}
            urlValue={urlInput}
            onUrlChange={setUrlInput}
            urlPlaceholder="Paste a website URL or document link here"
            accept="*/*"
            multiple={true}
            maxFiles={20}
          />

          {/* Controls Row - Tabs and Search */}
          <div style={controlRowStyles}>
            {/* Left: Tab Bar */}
            <Tabs
              style="segmented"
              type="default"
              tabs={filterTabs}
              activeTab={activeTab}
              onTabChange={setActiveTab}
            />

            {/* Right: Search and Sort */}
            <div style={rightSectionStyles}>
              {/* Search Input */}
              <div style={{ width: '280px' }}>
                <Input
                  size="lg"
                  style="default"
                  placeholder="Search files..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  leadIcon={<Search size={16} />}
                />
              </div>

              {/* Sort Dropdown */}
              <div style={{ position: 'relative' }}>
                <button
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: spacing.spacing[8],
                    padding: `${spacing.spacing[8]} ${spacing.spacing[12]}`,
                    backgroundColor: colors.bg.card.default,
                    border: `1px solid ${colors.border.default}`,
                    borderRadius: cornerRadius.borderRadius.sm,
                    color: colors.text.default,
                    fontSize: textStyles.sm.normal.fontSize,
                    cursor: 'pointer',
                    transition: 'all 0.15s ease-in-out',
                  }}
                  onClick={() => setShowSortDropdown(!showSortDropdown)}
                >
                  {sortOptions.find(opt => 
                    (sortBy === 'lastAdded' && opt.label === 'Last Added') ||
                    (sortBy === 'nameAsc' && opt.label === 'Name A-Z') ||
                    (sortBy === 'nameDesc' && opt.label === 'Name Z-A') ||
                    (sortBy === 'sizeLarge' && opt.label === 'Size (Largest)') ||
                    (sortBy === 'sizeSmall' && opt.label === 'Size (Smallest)')
                  )?.label || 'Last Added'}
                  <ChevronDown size={12} />
                </button>
                
                <DropdownMenu
                  isOpen={showSortDropdown}
                  onClose={() => setShowSortDropdown(false)}
                  items={sortOptions}
                  position="bottom-right"
                  minWidth="160px"
                />
              </div>
            </div>
          </div>

          {/* Loading State */}
          {loading && (
            <div style={{
              textAlign: 'center',
              padding: spacing.spacing[48],
              color: colors.text.muted,
            }}>
              <div style={{
                width: '32px',
                height: '32px',
                border: `2px solid ${colors.border.default}`,
                borderTop: `2px solid ${colors.border.highlight}`,
                borderRadius: '50%',
                animation: 'spin 1s linear infinite',
                margin: '0 auto',
                marginBottom: spacing.spacing[16],
              }} />
              <p style={textStyles.sm.medium}>Loading your files...</p>
            </div>
          )}

          {/* File Grid - 2 columns */}
          {!loading && (
            <div style={gridStyles}>
              {getSortedFiles(getFilteredFiles())
                .filter(file => 
                  searchQuery === '' || 
                  file.title.toLowerCase().includes(searchQuery.toLowerCase())
                )
                .map((file) => (
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
                  />
                ))}
            </div>
          )}

          {/* Empty state when no files match */}
          {!loading && getSortedFiles(getFilteredFiles()).filter(file => 
            searchQuery === '' || 
            file.title.toLowerCase().includes(searchQuery.toLowerCase())
          ).length === 0 && (
            <div style={{
              textAlign: 'center',
              padding: spacing.spacing[48],
              color: colors.text.muted,
            }}>
              <p style={textStyles.lg.medium}>No files found</p>
              <p style={textStyles.sm.normal}>
                {searchQuery ? 'Try adjusting your search or filter' : 'Upload some files to get started'}
              </p>
            </div>
          )}

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
                    Audio Transcription
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
                    Transcription
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
                      {selectedAudioFile.metadata?.transcription || 'No transcription available'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
    </div>
  );
};

export default KnowledgeBase;