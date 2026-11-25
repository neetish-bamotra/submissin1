import { TEST_COVERAGE_ANALYZER_PROMPT } from '../prompts/test-coverage-analyzer.prompt.js';

/**
 * Test Coverage Analyzer Agent
 * Evaluates test completeness and suggests specific test cases needed.
 */
export const testCoverageAnalyzer = {
  name: 'test-coverage-analyzer',
  description: 'Evaluates test coverage, identifies testing gaps, and suggests specific test cases needed',
  instructions: TEST_COVERAGE_ANALYZER_PROMPT
};
