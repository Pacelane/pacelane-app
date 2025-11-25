import React, { useEffect, useRef, useState } from 'react';
import ForceGraph2D from 'react-force-graph-2d';
import { useTheme } from '@/services/theme-context';
import { spacing } from '@/design-system/tokens/spacing';
import { cornerRadius } from '@/design-system/tokens/corner-radius';
import { getShadow } from '@/design-system/tokens/shadows';

interface GraphNode {
  id: string;
  name: string;
  val: number; // size
  color?: string;
  type?: string;
}

interface GraphLink {
  source: string;
  target: string;
  type?: string;
  color?: string;
}

interface KnowledgeGraphViewProps {
  data: {
    nodes: GraphNode[];
    links: GraphLink[];
  };
  onNodeClick?: (node: GraphNode) => void;
  width?: number;
  height?: number;
}

export default function KnowledgeGraphView({
  data,
  onNodeClick,
  width = 800,
  height = 600,
}: KnowledgeGraphViewProps) {
  const { colors, isDark } = useTheme();
  const graphRef = useRef<any>();
  const [containerDimensions, setContainerDimensions] = useState({ width, height });
  const containerRef = useRef<HTMLDivElement>(null);

  // Update dimensions on resize
  useEffect(() => {
    if (containerRef.current) {
      const { clientWidth, clientHeight } = containerRef.current;
      setContainerDimensions({ 
        width: clientWidth || width, 
        height: clientHeight || height 
      });
    }
  }, [containerRef.current, width, height]);

  // Node styling
  const getNodeColor = (node: GraphNode) => {
    if (node.color) return node.color;
    return colors.bg.accent.primary; // Default node color
  };

  const getLinkColor = (link: GraphLink) => {
    if (link.color) return link.color;
    if (link.type === 'suggested') return colors.border.warning; // Suggested links
    return colors.border.default; // Default link color
  };

  return (
    <div 
      ref={containerRef}
      style={{
        width: '100%',
        height: '100%',
        minHeight: '500px',
        backgroundColor: colors.bg.card.default,
        borderRadius: cornerRadius.borderRadius.md,
        border: `1px solid ${colors.border.default}`,
        boxShadow: getShadow('regular.sm', colors),
        overflow: 'hidden',
        position: 'relative'
      }}
    >
      <ForceGraph2D
        ref={graphRef}
        width={containerDimensions.width}
        height={containerDimensions.height}
        graphData={data}
        nodeLabel="name"
        nodeColor={getNodeColor}
        linkColor={getLinkColor}
        nodeRelSize={6}
        linkDirectionalParticles={2}
        linkDirectionalParticleSpeed={d => d.value * 0.001}
        onNodeClick={(node) => onNodeClick && onNodeClick(node as GraphNode)}
        backgroundColor={colors.bg.card.default}
        d3VelocityDecay={0.1}
        cooldownTicks={100}
        onEngineStop={() => graphRef.current.zoomToFit(400)}
      />
      
      {/* Legend or Controls could go here */}
      <div style={{
        position: 'absolute',
        bottom: spacing.spacing[16],
        right: spacing.spacing[16],
        backgroundColor: colors.bg.overlay,
        padding: spacing.spacing[8],
        borderRadius: cornerRadius.borderRadius.sm,
        fontSize: '12px',
        color: colors.text.subtle,
        pointerEvents: 'none'
      }}>
        {data.nodes.length} Pages • {data.links.length} Links
      </div>
    </div>
  );
}
