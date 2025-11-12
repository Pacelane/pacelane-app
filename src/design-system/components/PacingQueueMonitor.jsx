import React, { useState, useEffect } from 'react';
import { useTheme } from '@/services/theme-context';
import { spacing } from '@/design-system/tokens/spacing';
import { cornerRadius } from '@/design-system/tokens/corner-radius';
import { getShadow } from '@/design-system/tokens/shadows';
import { textStyles } from '@/design-system/styles/typography/typography-styles';
import Button from '@/design-system/components/Button';
import { ArrowsClockwise as RefreshCw, Play, Pause, WarningCircle as AlertCircle, CheckCircle, Clock, FileText, ChatSquare as MessageSquare } from '@phosphor-icons/react';

const PacingQueueMonitor = () => {
  const { colors } = useTheme();
  const [queueStatus, setQueueStatus] = useState(null);
  const [contextAnalyses, setContextAnalyses] = useState([]);
  const [contentGenerations, setContentGenerations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [lastRefresh, setLastRefresh] = useState(null);

  const containerStyles = {
    display: 'flex',
    flexDirection: 'column',
    gap: spacing.spacing[24],
    padding: spacing.spacing[24],
    backgroundColor: colors.bg.card.default,
    borderRadius: cornerRadius.borderRadius.lg,
    boxShadow: getShadow('regular.card', colors, { withBorder: true }),
    border: `1px solid ${colors.border.default}`,
  };

  const headerStyles = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.spacing[16],
  };

  const titleStyles = {
    ...textStyles.xl.semibold,
    color: colors.text.default,
    margin: 0,
  };

  const statusCardStyles = {
    display: 'flex',
    flexDirection: 'column',
    gap: spacing.spacing[16],
    padding: spacing.spacing[20],
    backgroundColor: colors.bg.subtle,
    borderRadius: cornerRadius.borderRadius.md,
    border: `1px solid ${colors.border.default}`,
  };

  const queueGridStyles = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
    gap: spacing.spacing[20],
    marginTop: spacing.spacing[16],
  };

  const queueCardStyles = {
    padding: spacing.spacing[20],
    backgroundColor: colors.bg.card.subtle,
    borderRadius: cornerRadius.borderRadius.md,
    border: `1px solid ${colors.border.default}`,
  };

  const metricStyles = {
    display: 'flex',
    alignItems: 'center',
    gap: spacing.spacing[12],
    marginBottom: spacing.spacing[8],
  };

  const metricValueStyles = {
    ...textStyles['2xl'].bold,
    color: colors.text.default,
  };

  const metricLabelStyles = {
    ...textStyles.sm.medium,
    color: colors.text.subtle,
  };

  const statusIndicatorStyles = (status) => ({
    display: 'flex',
    alignItems: 'center',
    gap: spacing.spacing[8],
    padding: spacing.spacing[8],
    borderRadius: cornerRadius.borderRadius.sm,
    backgroundColor: status === 'completed' ? colors.bg.state.success : 
                   status === 'processing' ? colors.bg.state.primary :
                   status === 'failed' ? colors.bg.state.destructive :
                   colors.bg.state.soft,
    color: status === 'completed' ? colors.text.white.default :
           status === 'processing' ? colors.text.white.default :
           status === 'failed' ? colors.text.white.default :
           colors.text.default,
    ...textStyles.sm.medium,
  });

  const fetchQueueStatus = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/pacing-queue-status');
      const data = await response.json();
      setQueueStatus(data);
    } catch (error) {
      console.error('Failed to fetch queue status:', error);
    } finally {
      setLoading(false);
      setLastRefresh(new Date());
    }
  };

  const fetchContextAnalyses = async () => {
    try {
      const response = await fetch('/api/context-analyses');
      const data = await response.json();
      setContextAnalyses(data);
    } catch (error) {
      console.error('Failed to fetch context analyses:', error);
    }
  };

  const fetchContentGenerations = async () => {
    try {
      const response = await fetch('/api/content-generations');
      const data = await response.json();
      setContentGenerations(data);
    } catch (error) {
      console.error('Failed to fetch content generations:', error);
    }
  };

  const triggerContextAnalysis = async () => {
    try {
      await fetch('/api/context-analysis-agent', { method: 'GET' });
      await fetchQueueStatus();
      await fetchContextAnalyses();
    } catch (error) {
      console.error('Failed to trigger context analysis:', error);
    }
  };

  const triggerContentGeneration = async () => {
    try {
      // Since we're using the unified RAG writer agent directly,
      // we'll just refresh the content generations to see current status
      await fetchContentGenerations();
    } catch (error) {
      console.error('Failed to refresh content generations:', error);
    }
  };

  useEffect(() => {
    fetchQueueStatus();
    fetchContextAnalyses();
    fetchContentGenerations();
  }, []);

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed':
        return <CheckCircle size={16} />;
      case 'processing':
        return <Clock size={16} />;
      case 'failed':
        return <AlertCircle size={16} />;
      default:
        return <Clock size={16} />;
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  return (
    <div style={containerStyles}>
      {/* Header */}
      <div style={headerStyles}>
        <h2 style={titleStyles}>Pacing Queue Monitor</h2>
        <div style={{ display: 'flex', gap: spacing.spacing[12] }}>
          <Button
            label="Refresh"
            style="secondary"
            size="sm"
            leadIcon={<RefreshCw size={16} />}
            onClick={() => {
              fetchQueueStatus();
              fetchContextAnalyses();
              fetchContentGenerations();
            }}
            loading={loading}
          />
          <Button
            label="Trigger Analysis"
            style="primary"
            size="sm"
            leadIcon={<Play size={16} />}
            onClick={triggerContextAnalysis}
          />
          <Button
            label="Trigger Generation"
            style="primary"
            size="sm"
            leadIcon={<FileText size={16} />}
            onClick={triggerContentGeneration}
          />
        </div>
      </div>

      {/* Last Refresh */}
      {lastRefresh && (
        <div style={{ ...textStyles.sm.medium, color: colors.text.muted }}>
          Last refreshed: {formatDate(lastRefresh)}
        </div>
      )}

      {/* Queue Status Overview */}
      <div style={statusCardStyles}>
        <h3 style={{ ...textStyles.lg.semibold, color: colors.text.default, margin: 0 }}>
          Queue Status Overview
        </h3>
        
        <div style={queueGridStyles}>
          {/* Pacing Content Queue */}
          <div style={queueCardStyles}>
            <div style={{ display: 'flex', alignItems: 'center', gap: spacing.spacing[8], marginBottom: spacing.spacing[16] }}>
              <MessageSquare size={20} color={colors.icon.default} />
              <h4 style={{ ...textStyles.md.semibold, color: colors.text.default, margin: 0 }}>
                Pacing Content Queue
              </h4>
            </div>
            
            <div style={metricStyles}>
              <span style={metricValueStyles}>
                {queueStatus?.pacing_content_queue?.pending_messages || 0}
              </span>
              <span style={metricLabelStyles}>Pending Messages</span>
            </div>
            
            <div style={{ ...textStyles.sm.medium, color: colors.text.subtle }}>
              Context analysis queue for pacing scheduler
            </div>
          </div>

          {/* Unified RAG Writer Agent Status */}
          <div style={queueCardStyles}>
            <div style={{ display: 'flex', alignItems: 'center', gap: spacing.spacing[8], marginBottom: spacing.spacing[16] }}>
              <FileText size={20} color={colors.icon.default} />
              <h4 style={{ ...textStyles.md.semibold, color: colors.text.default, margin: 0 }}>
                Unified RAG Writer Agent
              </h4>
            </div>
            
            <div style={metricStyles}>
              <span style={metricValueStyles}>
                {contentGenerations.filter(gen => gen.generation_status === 'generating').length}
              </span>
              <span style={metricLabelStyles}>Currently Generating</span>
            </div>
            
            <div style={{ ...textStyles.sm.medium, color: colors.text.subtle }}>
              Direct integration with existing RAG writer agent
            </div>
          </div>
        </div>
      </div>

      {/* Context Analysis Status */}
      <div style={statusCardStyles}>
        <h3 style={{ ...textStyles.lg.semibold, color: colors.text.default, margin: 0 }}>
          Context Analysis Status
        </h3>
        
        <div style={{ display: 'flex', gap: spacing.spacing[16], marginTop: spacing.spacing[16] }}>
          {['pending', 'processing', 'completed', 'failed'].map(status => {
            const count = contextAnalyses.filter(analysis => analysis.analysis_status === status).length;
            return (
              <div key={status} style={statusIndicatorStyles(status)}>
                {getStatusIcon(status)}
                {count} {status}
              </div>
            );
          })}
        </div>

        {contextAnalyses.length > 0 && (
          <div style={{ marginTop: spacing.spacing[20] }}>
            <h4 style={{ ...textStyles.md.medium, color: colors.text.default, marginBottom: spacing.spacing[12] }}>
              Recent Analyses
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.spacing[8] }}>
              {contextAnalyses.slice(0, 5).map(analysis => (
                <div key={analysis.id} style={{
                  padding: spacing.spacing[12],
                  backgroundColor: colors.bg.card.default,
                  borderRadius: cornerRadius.borderRadius.sm,
                  border: `1px solid ${colors.border.default}`,
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ ...textStyles.sm.medium, color: colors.text.default }}>
                      User: {analysis.user_id.substring(0, 8)}... | Date: {analysis.analysis_date}
                    </span>
                    <div style={statusIndicatorStyles(analysis.analysis_status)}>
                      {getStatusIcon(analysis.analysis_status)}
                      {analysis.analysis_status}
                    </div>
                  </div>
                  {analysis.content_suggestions && (
                    <div style={{ marginTop: spacing.spacing[8] }}>
                      <span style={{ ...textStyles.sm.medium, color: colors.text.subtle }}>
                        {analysis.content_suggestions.length} content suggestions generated
                      </span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Content Generation Status */}
      <div style={statusCardStyles}>
        <h3 style={{ ...textStyles.lg.semibold, color: colors.text.default, margin: 0 }}>
          Content Generation Status
        </h3>
        
        <div style={{ display: 'flex', gap: spacing.spacing[16], marginTop: spacing.spacing[16] }}>
          {['pending', 'generating', 'completed', 'failed'].map(status => {
            const count = contentGenerations.filter(gen => gen.generation_status === status).length;
            return (
              <div key={status} style={statusIndicatorStyles(status)}>
                {getStatusIcon(status)}
                {count} {status}
              </div>
            );
          })}
        </div>

        {contentGenerations.length > 0 && (
          <div style={{ marginTop: spacing.spacing[20] }}>
            <h4 style={{ ...textStyles.md.medium, color: colors.text.default, marginBottom: spacing.spacing[12] }}>
              Recent Generations
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.spacing[8] }}>
              {contentGenerations.slice(0, 5).map(generation => (
                <div key={generation.id} style={{
                  padding: spacing.spacing[12],
                  backgroundColor: colors.bg.card.default,
                  borderRadius: cornerRadius.borderRadius.sm,
                  border: `1px solid ${colors.border.default}`,
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ ...textStyles.sm.medium, color: colors.text.default }}>
                      {generation.content_type} | {generation.content_title || 'Untitled'}
                    </span>
                    <div style={statusIndicatorStyles(generation.generation_status)}>
                      {getStatusIcon(generation.generation_status)}
                      {generation.generation_status}
                    </div>
                  </div>
                  {generation.content_body && (
                    <div style={{ marginTop: spacing.spacing[8] }}>
                      <span style={{ ...textStyles.sm.medium, color: colors.text.subtle }}>
                        {generation.content_body.substring(0, 100)}...
                      </span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PacingQueueMonitor;
