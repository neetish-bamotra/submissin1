import { query } from '@anthropic-ai/claude-agent-sdk';
import { ReviewReport, ReviewReportSchema, ReviewReportJSONSchema } from './types/report-types.js';
import { buildOrchestratorPrompt } from './prompts/index.js';
import { codeQualityAnalyzer, testCoverageAnalyzer, refactoringSuggester } from './agents/index.js';
import { mcpServersConfig } from './config/mcp.config.js';
import { logger } from './utils/logger.js';

/**
 * Orchestrator configuration options
 */
export interface OrchestratorOptions {
  model?: string;
  maxTurns?: number;
  timeoutMs?: number;
}

/**
 * Main Code Review Orchestrator
 * Coordinates subagents to analyze pull requests and generate comprehensive reports
 */
export class CodeReviewOrchestrator {
  private model: string;
  private maxTurns: number;
  private timeoutMs: number;

  constructor(options: OrchestratorOptions = {}) {
    this.model = options.model || process.env.ANTHROPIC_MODEL || 'claude-opus-4-5-20251101';
    this.maxTurns = options.maxTurns || 10;
    this.timeoutMs = options.timeoutMs || 300000; // 5 minutes
  }

  /**
   * Review a pull request using parallel subagent analysis
   * @param owner - Repository owner
   * @param repo - Repository name
   * @param prNumber - Pull request number
   * @returns Complete review report
   */
  async reviewPullRequest(
    owner: string,
    repo: string,
    prNumber: number
  ): Promise<ReviewReport> {
    const startTime = Date.now();

    try {
      logger.info('Starting PR review', { owner, repo, prNumber });

      // Build the orchestrator prompt for this specific PR
      const prompt = buildOrchestratorPrompt(owner, repo, prNumber);

      // Create a promise that races against timeout
      const reviewPromise = this.executeReview(prompt);
      const result = await Promise.race([
        reviewPromise,
        this.createTimeoutPromise()
      ]);

      const duration = Date.now() - startTime;
      logger.info('PR review completed successfully', { owner, repo, prNumber, duration });

      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      logger.error('PR review failed', {
        owner,
        repo,
        prNumber,
        duration,
        error: error instanceof Error ? error.message : String(error)
      });
      throw error;
    }
  }

  /**
   * Execute the review using the query function
   * @param prompt - The orchestrator prompt
   * @returns Review report
   */
  private async executeReview(prompt: string): Promise<ReviewReport> {
    let finalOutput: unknown = null;
    let lastTextContent = '';

    try {
      // Call the query function with subagent definitions and configuration
      // query() returns an async iterable (Conversation) that we need to iterate over
      const conversation = query({
        prompt,
        options: {
          model: this.model,
          agents: [
            codeQualityAnalyzer,
            testCoverageAnalyzer,
            refactoringSuggester
          ] as any,
          tools: ['task'] as any,
          mcpServers: mcpServersConfig as any,
          outputFormat: {
            type: 'json_schema',
            schema: ReviewReportJSONSchema as any
          },
          maxTurns: this.maxTurns,
          permissionMode: 'acceptEdits' as any
        }
      });

      // Iterate over the conversation to get messages
      for await (const message of conversation) {
        logger.debug('Received message from conversation', {
          type: (message as any).type,
          keys: message && typeof message === 'object' ? Object.keys(message) : []
        });

        // Check for different message types that might contain our result
        if (message && typeof message === 'object') {
          const msg = message as any;

          // Check for structured_output in the message
          if (msg.structured_output) {
            finalOutput = msg.structured_output;
            logger.info('Found structured_output in message');
          }

          // Check for result type message
          if (msg.type === 'result' && msg.structured_output) {
            finalOutput = msg.structured_output;
            logger.info('Found result message with structured_output');
          }

          // Check for assistant message with content
          if (msg.type === 'assistant' && msg.content) {
            for (const block of msg.content) {
              if (block.type === 'text' && block.text) {
                lastTextContent = block.text;
              }
            }
          }

          // Check for content blocks directly
          if (msg.content && Array.isArray(msg.content)) {
            for (const block of msg.content) {
              if (block.type === 'text' && block.text) {
                lastTextContent = block.text;
              }
            }
          }
        }
      }

      // If no structured output found, try to parse from last text content
      if (!finalOutput && lastTextContent) {
        logger.info('No structured_output found, attempting to parse from text content');
        try {
          // Try to extract JSON from the text
          const jsonMatch = lastTextContent.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            finalOutput = JSON.parse(jsonMatch[0]);
          }
        } catch (e) {
          logger.error('Failed to parse JSON from text content', { error: String(e) });
        }
      }

      // Validate the output with Zod schema
      if (!finalOutput) {
        throw new Error('No output received from orchestrator');
      }

      logger.info('Validating final output', {
        outputType: typeof finalOutput,
        outputKeys: finalOutput && typeof finalOutput === 'object' ? Object.keys(finalOutput as any) : []
      });

      const validationResult = ReviewReportSchema.safeParse(finalOutput);
      if (!validationResult.success) {
        logger.error('Output validation failed', {
          errors: validationResult.error.errors
        });
        throw new Error(`Invalid output structure: ${JSON.stringify(validationResult.error.errors)}`);
      }

      return validationResult.data;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Create a timeout promise that rejects after the configured timeout
   */
  private createTimeoutPromise(): Promise<ReviewReport> {
    return new Promise((_, reject) => {
      setTimeout(() => {
        reject(new Error(`Review operation timed out after ${this.timeoutMs}ms`));
      }, this.timeoutMs);
    });
  }
}
