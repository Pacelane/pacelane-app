import React, { useState, useEffect } from 'react';
import { useTheme } from '@/services/theme-context';
import { spacing } from '@/design-system/tokens/spacing';
import { typography } from '@/design-system/tokens/typography';
import { textStyles } from '@/design-system/styles/typography/typography-styles';
import { useToast } from '@/design-system/components/Toast';
import { knowledgeGraphApi } from '@/api/knowledgeGraphApi';
import PageListSidebar from '@/design-system/components/PageListSidebar';
import PageEditor from '@/design-system/components/PageEditor';
import BacklinksPanel from '@/design-system/components/BacklinksPanel';
import GraphVisualization from '@/design-system/components/GraphVisualization';
import type { KnowledgePage, LinkWithPage, GraphNode, GraphEdge } from '@/types/knowledgeGraph';

export default function KnowledgeGraph() {
  const { colors } = useTheme();
  const { toast } = useToast();
  
  // State
  const [pages, setPages] = useState<KnowledgePage[]>([]);
  const [selectedPage, setSelectedPage] = useState<KnowledgePage | null>(null);
  const [backlinks, setBacklinks] = useState<LinkWithPage[]>([]);
  const [graphData, setGraphData] = useState<{ nodes: GraphNode[]; edges: GraphEdge[] }>({ nodes: [], edges: [] });
  const [showGraph, setShowGraph] = useState(false);
  
  // Loading states
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Load pages on mount
  useEffect(() => {
    loadPages();
  }, []);

  // Load backlinks when page changes
  useEffect(() => {
    if (selectedPage) {
      loadBacklinks(selectedPage.id);
    }
  }, [selectedPage?.id]);

  // Load graph data when showing graph
  useEffect(() => {
    if (showGraph) {
      loadGraphData();
    }
  }, [showGraph]);

  const loadPages = async () => {
    try {
      setLoading(true);
      const response = await knowledgeGraphApi.listPages(1, 100);
      setPages(response.pages);
      
      // Select first page if available
      if (response.pages.length > 0 && !selectedPage) {
        setSelectedPage(response.pages[0]);
      }
    } catch (error: any) {
      console.error('Error loading pages:', error);
      toast.error(error.message || 'Failed to load pages');
    } finally {
      setLoading(false);
    }
  };

  const loadBacklinks = async (pageId: string) => {
    try {
      const response = await knowledgeGraphApi.getBacklinks(pageId);
      setBacklinks(response.backlinks || []);
    } catch (error: any) {
      console.error('Error loading backlinks:', error);
      // Don't show error toast for backlinks - not critical
    }
  };

  const loadGraphData = async () => {
    try {
      const response = await knowledgeGraphApi.getGraphData();
      setGraphData({
        nodes: response.nodes,
        edges: response.edges,
      });
    } catch (error: any) {
      console.error('Error loading graph data:', error);
      toast.error(error.message || 'Failed to load graph');
    }
  };

  const handlePageSelect = (page: KnowledgePage) => {
    setSelectedPage(page);
  };

  const handleNewPage = async () => {
    try {
      const newPage = await knowledgeGraphApi.createPage({
        title: 'New Page',
        content: '',
        source: 'manual',
      });
      
      setPages([newPage.data, ...pages]);
      setSelectedPage(newPage.data);
      toast.success('Page created!');
    } catch (error: any) {
      console.error('Error creating page:', error);
      toast.error(error.message || 'Failed to create page');
    }
  };

  const handleSavePage = async (title: string, content: string) => {
    if (!selectedPage) return;
    
    try {
      setSaving(true);
      
      // Update page
      const updated = await knowledgeGraphApi.updatePage(selectedPage.id, {
        title,
        content,
      });
      
      // Parse links in content
      await knowledgeGraphApi.parseLinks(selectedPage.id, content);
      
      // Update local state
      setPages(pages.map(p => p.id === selectedPage.id ? updated.data : p));
      setSelectedPage(updated.data);
      
      // Reload pages to get any auto-created pages from links
      await loadPages();
      
      toast.success('Page saved!');
    } catch (error: any) {
      console.error('Error saving page:', error);
      toast.error(error.message || 'Failed to save page');
    } finally {
      setSaving(false);
    }
  };

  const handleBacklinkClick = (pageId: string) => {
    const page = pages.find(p => p.id === pageId);
    if (page) {
      setSelectedPage(page);
    }
  };

  const handleGraphNodeClick = (node: GraphNode) => {
    const page = pages.find(p => p.id === node.id);
    if (page) {
      setSelectedPage(page);
      setShowGraph(false);
    }
  };

  // Styles
  const containerStyles: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    height: '100vh',
    backgroundColor: 'transparent',
    overflow: 'hidden',
  };

  const headerStyles: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: spacing.spacing[8],
    padding: spacing.spacing[24],
    paddingBottom: spacing.spacing[16],
    borderBottom: `1px solid ${colors.border.default}`,
  };

  const titleStyle: React.CSSProperties = {
    fontFamily: typography.fontFamily['awesome-serif'],
    fontSize: typography.desktop.size['3xl'],
    fontWeight: typography.desktop.weight.semibold,
    lineHeight: typography.desktop.lineHeight.leading6,
    letterSpacing: typography.desktop.letterSpacing.normal,
    color: colors.text.default,
    margin: 0,
  };

  const subtitleStyle: React.CSSProperties = {
    ...textStyles.xs.medium,
    color: colors.text.subtle,
    margin: 0,
  };

  const layoutStyles: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: '280px 1fr 280px',
    gap: 0,
    flex: 1,
    overflow: 'hidden',
  };

  return (
    <div style={containerStyles}>
      {/* Header */}
      <div style={headerStyles}>
        <h1 style={titleStyle}>Knowledge Graph</h1>
        <p style={subtitleStyle}>
          Your interconnected knowledge base with pages, links, and visual graph exploration
        </p>
      </div>

      {/* Main Layout */}
      <div style={layoutStyles}>
        {/* Left: Page List */}
        <PageListSidebar
          pages={pages}
          selectedPageId={selectedPage?.id}
          onPageSelect={handlePageSelect}
          onNewPage={handleNewPage}
          loading={loading}
        />

        {/* Center: Editor or Graph */}
        {showGraph ? (
          <GraphVisualization
            nodes={graphData.nodes}
            edges={graphData.edges}
            onNodeClick={handleGraphNodeClick}
            onClose={() => setShowGraph(false)}
          />
        ) : (
          <PageEditor
            page={selectedPage}
            onSave={handleSavePage}
            onToggleGraph={() => setShowGraph(true)}
            allPages={pages}
            saving={saving}
          />
        )}

        {/* Right: Backlinks */}
        <BacklinksPanel
          backlinks={backlinks}
          onBacklinkClick={handleBacklinkClick}
          loading={false}
        />
      </div>
    </div>
  );
}

