import React, { useState } from 'react';
import { useAuth } from '@/hooks/api/useAuth';
import { VertexContentService, ContentBrief } from '@/services/vertexContentService';
import Button from '@/design-system/components/Button';
import Input from '@/design-system/components/Input';
import TextArea from '@/design-system/components/TextArea';
import { useTheme } from '@/services/theme-context';
import { spacing } from '@/design-system/tokens/spacing';
import { textStyles } from '@/design-system/styles/typography/typography-styles';
import { cornerRadius } from '@/design-system/tokens/corner-radius';
import { getShadow } from '@/design-system/tokens/shadows';

const VertexAITestComponent: React.FC = () => {
  const { user } = useAuth();
  const { colors } = useTheme();
  const [isLoading, setIsLoading] = useState(false);
  const [testResults, setTestResults] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  // Test form state
  const [testTopic, setTestTopic] = useState('AI in business strategy');
  const [testTone, setTestTone] = useState<'personal' | 'professional' | 'casual' | 'authoritative'>('personal');
  const [testLength, setTestLength] = useState<'short' | 'medium' | 'long'>('medium');
  const [testAngle, setTestAngle] = useState('practical implementation');

  const containerStyles = {
    padding: spacing.spacing[24],
    backgroundColor: colors.bg.card.default,
    borderRadius: cornerRadius.borderRadius.lg,
    boxShadow: getShadow('regular.card', colors, { withBorder: true }),
    border: `1px solid ${colors.border.default}`,
  };

  const sectionStyles = {
    marginBottom: spacing.spacing[24],
  };

  const runRAGRetrievalTest = async () => {
    if (!user) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      console.log('🧪 Testing RAG retrieval...');
      const result = await VertexContentService.testRAGRetrieval(testTopic);
      
      setTestResults({
        type: 'rag_retrieval',
        data: result,
        timestamp: new Date().toISOString()
      });
      
      console.log('✅ RAG retrieval test completed:', result);
    } catch (err: any) {
      setError(err.message);
      console.error('❌ RAG retrieval test failed:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const runCompleteFlowTest = async () => {
    if (!user) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const brief: ContentBrief = {
        topic: testTopic,
        tone: testTone,
        length: testLength,
        angle: testAngle,
        cta: {
          enabled: false,
          keyword: 'TEST'
        }
      };
      
      console.log('🧪 Testing complete Vertex AI + RAG flow...');
      const result = await VertexContentService.testCompleteFlow(brief);
      
      setTestResults({
        type: 'complete_flow',
        data: result,
        timestamp: new Date().toISOString()
      });
      
      console.log('✅ Complete flow test completed:', result);
    } catch (err: any) {
      setError(err.message);
      console.error('❌ Complete flow test failed:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const runFlowComparison = async () => {
    if (!user) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const brief: ContentBrief = {
        topic: testTopic,
        tone: testTone,
        length: testLength,
        angle: testAngle,
        cta: {
          enabled: false,
          keyword: 'TEST'
        }
      };
      
      console.log('⚖️ Comparing OpenAI vs Vertex AI flows...');
      const result = await VertexContentService.compareFlows(brief, 'linkedin');
      
      setTestResults({
        type: 'flow_comparison',
        data: result,
        timestamp: new Date().toISOString()
      });
      
      console.log('✅ Flow comparison completed:', result);
    } catch (err: any) {
      setError(err.message);
      console.error('❌ Flow comparison failed:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const clearResults = () => {
    setTestResults(null);
    setError(null);
  };

  if (!user) {
    return (
      <div style={containerStyles}>
        <h2 style={{ ...textStyles.lg.semibold, color: colors.text.default, marginBottom: spacing.spacing[16] }}>
          Vertex AI Test Component
        </h2>
        <p style={{ ...textStyles.sm.medium, color: colors.text.subtle }}>
          Please sign in to test the Vertex AI + RAG flow.
        </p>
      </div>
    );
  }

  return (
    <div style={containerStyles}>
      <h2 style={{ ...textStyles.lg.semibold, color: colors.text.default, marginBottom: spacing.spacing[16] }}>
        🧪 Vertex AI + RAG Test Component
      </h2>
      
      <p style={{ ...textStyles.sm.medium, color: colors.text.subtle, marginBottom: spacing.spacing[24] }}>
        Test the new Vertex AI + RAG flow alongside your existing OpenAI system. This component allows you to compare performance and quality.
      </p>

      {/* Test Configuration */}
      <div style={sectionStyles}>
        <h3 style={{ ...textStyles.md.semibold, color: colors.text.default, marginBottom: spacing.spacing[16] }}>
          Test Configuration
        </h3>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.spacing[16] }}>
          <div>
            <label style={{ ...textStyles.sm.medium, color: colors.text.default, marginBottom: spacing.spacing[4], display: 'block' }}>
              Topic
            </label>
            <Input
              value={testTopic}
              onChange={(e) => setTestTopic(e.target.value)}
              placeholder="Enter a topic to test"
            />
          </div>
          
          <div style={{ display: 'flex', gap: spacing.spacing[16] }}>
            <div style={{ flex: 1 }}>
              <label style={{ ...textStyles.sm.medium, color: colors.text.default, marginBottom: spacing.spacing[4], display: 'block' }}>
                Tone
              </label>
              <select
                value={testTone}
                onChange={(e) => setTestTone(e.target.value as any)}
                style={{
                  width: '100%',
                  padding: spacing.spacing[8],
                  borderRadius: cornerRadius.borderRadius.sm,
                  border: `1px solid ${colors.border.default}`,
                  backgroundColor: colors.bg.input.default,
                  color: colors.text.default,
                }}
              >
                <option value="personal">Personal</option>
                <option value="professional">Professional</option>
                <option value="casual">Casual</option>
                <option value="authoritative">Authoritative</option>
              </select>
            </div>
            
            <div style={{ flex: 1 }}>
              <label style={{ ...textStyles.sm.medium, color: colors.text.default, marginBottom: spacing.spacing[4], display: 'block' }}>
                Length
              </label>
              <select
                value={testLength}
                onChange={(e) => setTestLength(e.target.value as any)}
                style={{
                  width: '100%',
                  padding: spacing.spacing[8],
                  borderRadius: cornerRadius.borderRadius.sm,
                  border: `1px solid ${colors.border.default}`,
                  backgroundColor: colors.bg.input.default,
                  color: colors.text.default,
                }}
              >
                <option value="short">Short</option>
                <option value="medium">Medium</option>
                <option value="long">Long</option>
              </select>
            </div>
          </div>
          
          <div>
            <label style={{ ...textStyles.sm.medium, color: colors.text.default, marginBottom: spacing.spacing[4], display: 'block' }}>
              Angle
            </label>
            <Input
              value={testAngle}
              onChange={(e) => setTestAngle(e.target.value)}
              placeholder="Enter content angle"
            />
          </div>
        </div>
      </div>

      {/* Test Actions */}
      <div style={sectionStyles}>
        <h3 style={{ ...textStyles.md.semibold, color: colors.text.default, marginBottom: spacing.spacing[16] }}>
          Test Actions
        </h3>
        
        <div style={{ display: 'flex', gap: spacing.spacing[12], flexWrap: 'wrap' }}>
          <Button
            label="Test RAG Retrieval"
            style="primary"
            size="md"
            onClick={runRAGRetrievalTest}
            loading={isLoading}
            disabled={isLoading}
          />
          
          <Button
            label="Test Complete Flow"
            style="secondary"
            size="md"
            onClick={runCompleteFlowTest}
            loading={isLoading}
            disabled={isLoading}
          />
          
          <Button
            label="Compare Flows"
            style="soft"
            size="md"
            onClick={runFlowComparison}
            loading={isLoading}
            disabled={isLoading}
          />
          
          <Button
            label="Clear Results"
            style="ghost"
            size="md"
            onClick={clearResults}
            disabled={isLoading}
          />
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div style={{
          ...sectionStyles,
          padding: spacing.spacing[16],
          backgroundColor: colors.bg.state.destructive,
          color: colors.text.white.default,
          borderRadius: cornerRadius.borderRadius.md,
          border: `1px solid ${colors.border.destructive}`,
        }}>
          <h4 style={{ ...textStyles.sm.semibold, marginBottom: spacing.spacing[8] }}>❌ Error</h4>
          <p style={{ ...textStyles.sm.medium, margin: 0 }}>{error}</p>
        </div>
      )}

      {/* Test Results */}
      {testResults && (
        <div style={sectionStyles}>
          <h3 style={{ ...textStyles.md.semibold, color: colors.text.default, marginBottom: spacing.spacing[16] }}>
            Test Results
          </h3>
          
          <div style={{
            padding: spacing.spacing[16],
            backgroundColor: colors.bg.subtle,
            borderRadius: cornerRadius.borderRadius.md,
            border: `1px solid ${colors.border.default}`,
          }}>
            <div style={{ marginBottom: spacing.spacing[12] }}>
              <strong style={{ color: colors.text.default }}>Test Type:</strong> {testResults.type}
            </div>
            
            <div style={{ marginBottom: spacing.spacing[12] }}>
              <strong style={{ color: colors.text.default }}>Timestamp:</strong> {new Date(testResults.timestamp).toLocaleString()}
            </div>
            
            {testResults.type === 'rag_retrieval' && (
              <div>
                <strong style={{ color: colors.text.default }}>Context Chunks Found:</strong> {testResults.data.context_chunks.length}
                <div style={{ marginTop: spacing.spacing[8] }}>
                  {testResults.data.context_chunks.map((chunk: any, index: number) => (
                    <div key={index} style={{
                      padding: spacing.spacing[8],
                      marginBottom: spacing.spacing[8],
                      backgroundColor: colors.bg.card.default,
                      borderRadius: cornerRadius.borderRadius.sm,
                      border: `1px solid ${colors.border.default}`,
                    }}>
                      <div style={{ ...textStyles.sm.medium, color: colors.text.default, marginBottom: spacing.spacing[4] }}>
                        <strong>{chunk.type}</strong> - {chunk.source} (Score: {chunk.relevance_score.toFixed(2)})
                      </div>
                      <div style={{ ...textStyles.sm.medium, color: colors.text.subtle }}>
                        {chunk.content.slice(0, 150)}...
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {testResults.type === 'complete_flow' && (
              <div>
                <strong style={{ color: colors.text.default }}>Generated Content:</strong>
                <div style={{
                  marginTop: spacing.spacing[8],
                  padding: spacing.spacing[12],
                  backgroundColor: colors.bg.card.default,
                  borderRadius: cornerRadius.borderRadius.sm,
                  border: `1px solid ${colors.border.default}`,
                  whiteSpace: 'pre-wrap',
                  fontFamily: 'monospace',
                  fontSize: '14px',
                  lineHeight: '1.5',
                }}>
                  {testResults.data.content.content}
                </div>
                <div style={{ marginTop: spacing.spacing[8] }}>
                  <strong>Word Count:</strong> {testResults.data.content.metadata.word_count}<br />
                  <strong>Context Chunks Used:</strong> {testResults.data.generation_metadata.context_chunks_used}
                </div>
              </div>
            )}
            
            {testResults.type === 'flow_comparison' && (
              <div>
                <strong style={{ color: colors.text.default }}>Performance Comparison:</strong>
                <div style={{ marginTop: spacing.spacing[8] }}>
                  <div><strong>OpenAI Time:</strong> {testResults.data.comparison.openai_time.toFixed(0)}ms</div>
                  <div><strong>Vertex AI Time:</strong> {testResults.data.comparison.vertex_time.toFixed(0)}ms</div>
                  <div><strong>Context Chunks:</strong> {testResults.data.comparison.context_chunks}</div>
                  <div><strong>Word Count:</strong> {testResults.data.comparison.word_count}</div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default VertexAITestComponent;
