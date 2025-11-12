import React, { useRef, useEffect, useState } from 'react';
import ForceGraph2D from 'react-force-graph-2d';
import { useTheme } from '@/services/theme-context';
import { spacing } from '@/design-system/tokens/spacing';
import { textStyles } from '@/design-system/styles/typography/typography-styles';
import Button from '@/design-system/components/Button';
import { X, ArrowsOut as Maximize2, ArrowsIn as Minimize2 } from '@phosphor-icons/react';
import type { GraphNode, GraphEdge } from '@/types/knowledgeGraph';

interface GraphVisualizationProps {
  nodes: GraphNode[];
  edges: GraphEdge[];
  onNodeClick?: (node: GraphNode) => void;
  onClose?: () => void;
}

export default function GraphVisualization({
  nodes,
  edges,
  onNodeClick,
  onClose,
}: GraphVisualizationProps) {
  const { colors } = useTheme();
  const graphRef = useRef<any>();
  const containerRef = useRef<HTMLDivElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
  const [highlightNodes, setHighlightNodes] = useState(new Set());
  const [highlightLinks, setHighlightLinks] = useState(new Set());
  const [hoverNode, setHoverNode] = useState<any>(null);

  // Convert edges to format expected by ForceGraph
  const graphData = {
    nodes: nodes.map(node => ({
      ...node,
      val: node.size || 5,
    })),
    links: edges.map(edge => ({
      source: edge.source,
      target: edge.target,
      label: edge.label,
    })),
  };

  const containerStyles: React.CSSProperties = {
    position: isFullscreen ? 'fixed' : 'relative',
    top: isFullscreen ? 0 : undefined,
    left: isFullscreen ? 0 : undefined,
    right: isFullscreen ? 0 : undefined,
    bottom: isFullscreen ? 0 : undefined,
    width: isFullscreen ? '100vw' : '100%',
    height: isFullscreen ? '100vh' : '100%',
    backgroundColor: colors.bg.subtle,
    borderRadius: isFullscreen ? 0 : 0,
    overflow: 'hidden',
    zIndex: isFullscreen ? 9999 : undefined,
  };

  const headerStyles: React.CSSProperties = {
    position: 'absolute',
    top: spacing.spacing[16],
    right: spacing.spacing[16],
    display: 'flex',
    gap: spacing.spacing[8],
    zIndex: 10,
  };

  const statsStyles: React.CSSProperties = {
    position: 'absolute',
    top: spacing.spacing[16],
    left: spacing.spacing[16],
    padding: spacing.spacing[12],
    backgroundColor: colors.bg.card.default,
    borderRadius: '8px',
    border: `1px solid ${colors.border.default}`,
    zIndex: 10,
  };

  const statTextStyles: React.CSSProperties = {
    ...textStyles.xs.normal,
    color: colors.text.subtle,
  };

  // Measure container dimensions
  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        const width = isFullscreen ? window.innerWidth : containerRef.current.clientWidth;
        const height = isFullscreen ? window.innerHeight : containerRef.current.clientHeight;
        console.log('GraphVisualization dimensions:', { width, height, isFullscreen });
        setDimensions({ width, height });
      }
    };

    // Initial update with slight delay to ensure container is mounted
    const timer = setTimeout(updateDimensions, 50);
    
    window.addEventListener('resize', updateDimensions);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', updateDimensions);
    };
  }, [isFullscreen]);

  // Center graph when dimensions or data changes
  useEffect(() => {
    if (graphRef.current && dimensions.width > 0) {
      setTimeout(() => {
        graphRef.current.zoomToFit(400);
      }, 100);
    }
  }, [dimensions, nodes.length]);

  const handleNodeHover = (node: any) => {
    setHoverNode(node);
    
    if (node) {
      const neighbors = new Set();
      const links = new Set();
      
      graphData.links.forEach(link => {
        if (link.source.id === node.id || link.target.id === node.id) {
          neighbors.add(link.source.id);
          neighbors.add(link.target.id);
          links.add(link);
        }
      });
      
      setHighlightNodes(neighbors);
      setHighlightLinks(links);
    } else {
      setHighlightNodes(new Set());
      setHighlightLinks(new Set());
    }
  };

  const getNodeColor = (node: any) => {
    // Highlight connected nodes on hover
    if (hoverNode && !highlightNodes.has(node.id)) {
      return colors.icon.muted;
    }
    
    // Color based on source
    switch (node.source) {
      case 'whatsapp':
        return colors.bg.state.brand; // Teal for WhatsApp
      case 'manual':
        return colors.bg.state.primary; // Blue for manual
      case 'upload':
        return colors.icon.subtle; // Gray for uploads
      default:
        return colors.bg.state.primary;
    }
  };

  const getLinkColor = (link: any) => {
    if (hoverNode && !highlightLinks.has(link)) {
      return colors.border.default + '40'; // Semi-transparent
    }
    return colors.border.default;
  };

  return (
    <div ref={containerRef} style={containerStyles}>
      {/* Header Controls */}
      <div style={headerStyles}>
        <Button
          variant="iconOnly"
          style="secondary"
          size="sm"
          leadIcon={isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
          onClick={() => setIsFullscreen(!isFullscreen)}
        />
        
        {onClose && (
          <Button
            variant="iconOnly"
            style="secondary"
            size="sm"
            leadIcon={<X size={16} />}
            onClick={onClose}
          />
        )}
      </div>

      {/* Stats */}
      <div style={statsStyles}>
        <div style={statTextStyles}>
          <strong>{nodes.length}</strong> pages • <strong>{edges.length}</strong> links
        </div>
      </div>

      {/* Graph */}
      <ForceGraph2D
        ref={graphRef}
        width={dimensions.width}
        height={dimensions.height}
        graphData={graphData}
        nodeLabel={(node: any) => node.label}
        nodeColor={getNodeColor}
        nodeVal={(node: any) => node.val}
        linkColor={getLinkColor}
        linkWidth={(link: any) => highlightLinks.has(link) ? 2 : 1}
        linkDirectionalParticles={2}
        linkDirectionalParticleWidth={(link: any) => highlightLinks.has(link) ? 2 : 0}
        onNodeClick={(node: any) => {
          if (onNodeClick) {
            onNodeClick(node as GraphNode);
          }
        }}
        onNodeHover={handleNodeHover}
        nodeCanvasObject={(node: any, ctx, globalScale) => {
          // Draw node circle
          const label = node.label;
          const fontSize = 12 / globalScale;
          const nodeRadius = Math.sqrt(node.val) * 2;
          
          ctx.beginPath();
          ctx.arc(node.x, node.y, nodeRadius, 0, 2 * Math.PI);
          ctx.fillStyle = getNodeColor(node);
          ctx.fill();
          
          // Draw icon/emoji if exists
          if (node.icon && globalScale > 0.8) {
            ctx.font = `${fontSize * 1.5}px Sans-Serif`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(node.icon, node.x, node.y);
          }
          
          // Draw label if zoomed in enough
          if (globalScale > 1.2) {
            ctx.font = `${fontSize}px Sans-Serif`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'top';
            ctx.fillStyle = colors.text.default;
            ctx.fillText(label, node.x, node.y + nodeRadius + 2);
          }
        }}
        backgroundColor={colors.bg.subtle}
        cooldownTime={3000}
      />
    </div>
  );
}

