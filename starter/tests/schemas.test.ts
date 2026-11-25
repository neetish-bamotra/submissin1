import { describe, it, expect } from 'vitest';
import {
  CodeQualityResultSchema,
  TestCoverageResultSchema,
  RefactoringSuggestionSchema,
  ReviewReportSchema,
  CodeQualityResultJSONSchema,
  TestCoverageResultJSONSchema,
  RefactoringSuggestionJSONSchema,
  ReviewReportJSONSchema
} from '../src/types/index.js';
import { z } from 'zod';

describe('Schema Validation Tests', () => {
  describe('CodeQualityResultSchema', () => {
    it('should parse valid code quality data', () => {
      const validData = {
        file: 'src/example.ts',
        issues: [
          {
            line: 10,
            severity: 'high',
            category: 'security',
            description: 'Potential SQL injection vulnerability',
            suggestion: 'Use parameterized queries'
          }
        ],
        overallScore: 75,
        summary: 'Found 1 high severity issue'
      };

      const result = CodeQualityResultSchema.parse(validData);
      expect(result.file).toBe('src/example.ts');
      expect(result.overallScore).toBe(75);
      expect(result.issues).toHaveLength(1);
    });

    it('should reject data with missing required fields', () => {
      const invalidData = {
        file: 'src/example.ts',
        issues: [],
        // Missing overallScore and summary
      };

      expect(() => CodeQualityResultSchema.parse(invalidData)).toThrow();
    });

    it('should reject data with invalid score values', () => {
      const tooLow = {
        file: 'src/example.ts',
        issues: [],
        overallScore: -1,
        summary: 'Invalid score'
      };

      expect(() => CodeQualityResultSchema.parse(tooLow)).toThrow();

      const tooHigh = {
        file: 'src/example.ts',
        issues: [],
        overallScore: 101,
        summary: 'Invalid score'
      };

      expect(() => CodeQualityResultSchema.parse(tooHigh)).toThrow();
    });

    it('should accept boundary score values (0 and 100)', () => {
      const scoreZero = {
        file: 'src/example.ts',
        issues: [],
        overallScore: 0,
        summary: 'No quality'
      };

      const resultZero = CodeQualityResultSchema.parse(scoreZero);
      expect(resultZero.overallScore).toBe(0);

      const score100 = {
        file: 'src/example.ts',
        issues: [],
        overallScore: 100,
        summary: 'Perfect quality'
      };

      const result100 = CodeQualityResultSchema.parse(score100);
      expect(result100.overallScore).toBe(100);
    });

    it('should reject invalid severity levels', () => {
      const invalidData = {
        file: 'src/example.ts',
        issues: [
          {
            line: 10,
            severity: 'invalid-severity',
            category: 'security',
            description: 'Test',
            suggestion: 'Test'
          }
        ],
        overallScore: 50,
        summary: 'Test'
      };

      expect(() => CodeQualityResultSchema.parse(invalidData)).toThrow();
    });

    it('should reject invalid categories', () => {
      const invalidData = {
        file: 'src/example.ts',
        issues: [
          {
            line: 10,
            severity: 'high',
            category: 'invalid-category',
            description: 'Test',
            suggestion: 'Test'
          }
        ],
        overallScore: 50,
        summary: 'Test'
      };

      expect(() => CodeQualityResultSchema.parse(invalidData)).toThrow();
    });

    it('should handle empty arrays', () => {
      const data = {
        file: 'src/example.ts',
        issues: [],
        overallScore: 100,
        summary: 'No issues found'
      };

      const result = CodeQualityResultSchema.parse(data);
      expect(result.issues).toHaveLength(0);
    });
  });

  describe('TestCoverageResultSchema', () => {
    it('should parse valid test coverage data', () => {
      const validData = {
        file: 'src/util.ts',
        hasTests: true,
        testFiles: ['src/util.test.ts'],
        untestedPaths: [
          {
            type: 'function',
            location: 'parseInput',
            priority: 'high',
            reasoning: 'Core function not covered',
            suggestedTest: 'Test valid and invalid inputs'
          }
        ],
        coverageEstimate: 65,
        summary: 'Missing tests for edge cases'
      };

      const result = TestCoverageResultSchema.parse(validData);
      expect(result.file).toBe('src/util.ts');
      expect(result.hasTests).toBe(true);
      expect(result.coverageEstimate).toBe(65);
    });

    it('should reject data with missing required fields', () => {
      const invalidData = {
        file: 'src/util.ts',
        hasTests: true
        // Missing other required fields
      };

      expect(() => TestCoverageResultSchema.parse(invalidData)).toThrow();
    });

    it('should handle files with no tests', () => {
      const data = {
        file: 'src/untested.ts',
        hasTests: false,
        testFiles: [],
        untestedPaths: [],
        coverageEstimate: 0,
        summary: 'No tests found'
      };

      const result = TestCoverageResultSchema.parse(data);
      expect(result.hasTests).toBe(false);
      expect(result.testFiles).toHaveLength(0);
    });

    it('should validate untested path types', () => {
      const invalidData = {
        file: 'src/util.ts',
        hasTests: true,
        testFiles: ['src/util.test.ts'],
        untestedPaths: [
          {
            type: 'invalid-type',
            location: 'test',
            priority: 'high',
            reasoning: 'Test',
            suggestedTest: 'Test'
          }
        ],
        coverageEstimate: 50,
        summary: 'Test'
      };

      expect(() => TestCoverageResultSchema.parse(invalidData)).toThrow();
    });

    it('should validate priority levels', () => {
      const invalidData = {
        file: 'src/util.ts',
        hasTests: true,
        testFiles: [],
        untestedPaths: [
          {
            type: 'function',
            location: 'test',
            priority: 'invalid-priority',
            reasoning: 'Test',
            suggestedTest: 'Test'
          }
        ],
        coverageEstimate: 50,
        summary: 'Test'
      };

      expect(() => TestCoverageResultSchema.parse(invalidData)).toThrow();
    });

    it('should accept coverage estimate boundary values', () => {
      const noCoverage = {
        file: 'src/util.ts',
        hasTests: false,
        testFiles: [],
        untestedPaths: [],
        coverageEstimate: 0,
        summary: 'No coverage'
      };

      const resultZero = TestCoverageResultSchema.parse(noCoverage);
      expect(resultZero.coverageEstimate).toBe(0);

      const fullCoverage = {
        file: 'src/util.ts',
        hasTests: true,
        testFiles: ['src/util.test.ts'],
        untestedPaths: [],
        coverageEstimate: 100,
        summary: 'Full coverage'
      };

      const result100 = TestCoverageResultSchema.parse(fullCoverage);
      expect(result100.coverageEstimate).toBe(100);
    });
  });

  describe('RefactoringSuggestionSchema', () => {
    it('should parse valid refactoring suggestion data', () => {
      const validData = {
        file: 'src/component.ts',
        suggestions: [
          {
            type: 'extract-function',
            location: 'renderUser (line 50)',
            impact: 'high',
            description: 'Function is too long',
            before: 'function renderUser() { /* 100 lines */ }',
            after: 'function renderUser() { renderUserHeader(); ... }',
            benefits: 'Improves readability and testability'
          }
        ],
        summary: 'Extract large render function into smaller components'
      };

      const result = RefactoringSuggestionSchema.parse(validData);
      expect(result.file).toBe('src/component.ts');
      expect(result.suggestions).toHaveLength(1);
    });

    it('should reject data with missing required fields', () => {
      const invalidData = {
        file: 'src/component.ts'
        // Missing suggestions and summary
      };

      expect(() => RefactoringSuggestionSchema.parse(invalidData)).toThrow();
    });

    it('should validate suggestion types', () => {
      const invalidData = {
        file: 'src/component.ts',
        suggestions: [
          {
            type: 'invalid-type',
            location: 'test',
            impact: 'high',
            description: 'Test',
            before: 'Test',
            after: 'Test',
            benefits: 'Test'
          }
        ],
        summary: 'Test'
      };

      expect(() => RefactoringSuggestionSchema.parse(invalidData)).toThrow();
    });

    it('should validate impact levels', () => {
      const invalidData = {
        file: 'src/component.ts',
        suggestions: [
          {
            type: 'extract-function',
            location: 'test',
            impact: 'invalid-impact',
            description: 'Test',
            before: 'Test',
            after: 'Test',
            benefits: 'Test'
          }
        ],
        summary: 'Test'
      };

      expect(() => RefactoringSuggestionSchema.parse(invalidData)).toThrow();
    });

    it('should handle empty suggestions array', () => {
      const data = {
        file: 'src/component.ts',
        suggestions: [],
        summary: 'No refactoring suggestions'
      };

      const result = RefactoringSuggestionSchema.parse(data);
      expect(result.suggestions).toHaveLength(0);
    });

    it('should validate all suggestion types', () => {
      const types = ['extract-function', 'rename', 'modernize', 'simplify', 'pattern-improvement'];

      types.forEach(type => {
        const data = {
          file: 'src/component.ts',
          suggestions: [
            {
              type,
              location: 'test',
              impact: 'medium',
              description: 'Test',
              before: 'Test',
              after: 'Test',
              benefits: 'Test'
            }
          ],
          summary: 'Test'
        };

        const result = RefactoringSuggestionSchema.parse(data);
        expect(result.suggestions[0].type).toBe(type);
      });
    });
  });

  describe('ReviewReportSchema', () => {
    it('should parse valid complete review report', () => {
      const validReport = {
        pullRequest: {
          owner: 'facebook',
          repo: 'react',
          number: 123
        },
        fileReviews: [
          {
            file: 'src/index.ts',
            codeQuality: {
              file: 'src/index.ts',
              issues: [],
              overallScore: 85,
              summary: 'Good code quality'
            },
            testCoverage: {
              file: 'src/index.ts',
              hasTests: true,
              testFiles: ['src/index.test.ts'],
              untestedPaths: [],
              coverageEstimate: 90,
              summary: 'High test coverage'
            },
            refactorings: {
              file: 'src/index.ts',
              suggestions: [],
              summary: 'No refactoring needed'
            }
          }
        ],
        summary: {
          totalFiles: 1,
          overallScore: 85,
          criticalIssues: 0,
          highPriorityTests: 0,
          refactoringOpportunities: 0
        },
        recommendations: [
          {
            priority: 'low',
            category: 'documentation',
            description: 'Add JSDoc comments',
            files: ['src/index.ts']
          }
        ],
        metadata: {
          analyzedAt: new Date().toISOString(),
          duration: 5000,
          agentVersions: {
            'code-quality-analyzer': '1.0',
            'test-coverage-analyzer': '1.0',
            'refactoring-suggester': '1.0'
          }
        }
      };

      const result = ReviewReportSchema.parse(validReport);
      expect(result.pullRequest.owner).toBe('facebook');
      expect(result.summary.totalFiles).toBe(1);
      expect(result.fileReviews).toHaveLength(1);
    });

    it('should reject data with missing required fields', () => {
      const invalidData = {
        pullRequest: { owner: 'test', repo: 'test', number: 1 }
        // Missing other required fields
      };

      expect(() => ReviewReportSchema.parse(invalidData)).toThrow();
    });

    it('should validate recommendation priorities', () => {
      const priorities = ['critical', 'high', 'medium', 'low'];

      priorities.forEach(priority => {
        const data = {
          pullRequest: { owner: 'test', repo: 'test', number: 1 },
          fileReviews: [],
          summary: {
            totalFiles: 0,
            overallScore: 100,
            criticalIssues: 0,
            highPriorityTests: 0,
            refactoringOpportunities: 0
          },
          recommendations: [
            {
              priority,
              category: 'test',
              description: 'Test',
              files: []
            }
          ],
          metadata: {
            analyzedAt: new Date().toISOString(),
            duration: 100,
            agentVersions: {}
          }
        };

        const result = ReviewReportSchema.parse(data);
        expect(result.recommendations[0].priority).toBe(priority);
      });
    });

    it('should require valid metadata with agent versions', () => {
      const invalidData = {
        pullRequest: { owner: 'test', repo: 'test', number: 1 },
        fileReviews: [],
        summary: {
          totalFiles: 0,
          overallScore: 100,
          criticalIssues: 0,
          highPriorityTests: 0,
          refactoringOpportunities: 0
        },
        recommendations: [],
        metadata: {
          analyzedAt: new Date().toISOString(),
          duration: 100
          // Missing agentVersions
        }
      };

      expect(() => ReviewReportSchema.parse(invalidData)).toThrow();
    });
  });

  describe('JSON Schema Exports', () => {
    it('should export valid JSON schema for CodeQualityResult', () => {
      expect(CodeQualityResultJSONSchema).toBeDefined();
      expect(typeof CodeQualityResultJSONSchema).toBe('object');
      expect(CodeQualityResultJSONSchema).toHaveProperty('properties');
    });

    it('should export valid JSON schema for TestCoverageResult', () => {
      expect(TestCoverageResultJSONSchema).toBeDefined();
      expect(typeof TestCoverageResultJSONSchema).toBe('object');
      expect(TestCoverageResultJSONSchema).toHaveProperty('properties');
    });

    it('should export valid JSON schema for RefactoringSuggestion', () => {
      expect(RefactoringSuggestionJSONSchema).toBeDefined();
      expect(typeof RefactoringSuggestionJSONSchema).toBe('object');
      expect(RefactoringSuggestionJSONSchema).toHaveProperty('properties');
    });

    it('should export valid JSON schema for ReviewReport', () => {
      expect(ReviewReportJSONSchema).toBeDefined();
      expect(typeof ReviewReportJSONSchema).toBe('object');
      expect(ReviewReportJSONSchema).toHaveProperty('properties');
    });

    it('should mark required fields in JSON schemas', () => {
      // JSON schemas should have required arrays
      if ('required' in CodeQualityResultJSONSchema) {
        expect(Array.isArray(CodeQualityResultJSONSchema.required)).toBe(true);
      }
    });
  });

  describe('Type Safety', () => {
    it('should correctly infer types from schemas', () => {
      const data = {
        file: 'src/test.ts',
        issues: [],
        overallScore: 50,
        summary: 'Test'
      };

      const result = CodeQualityResultSchema.parse(data);
      // Type inference should work correctly
      expect(typeof result.file).toBe('string');
      expect(typeof result.overallScore).toBe('number');
      expect(Array.isArray(result.issues)).toBe(true);
    });

    it('should use safeParse for validation without throwing', () => {
      const validData = {
        file: 'src/test.ts',
        issues: [],
        overallScore: 50,
        summary: 'Test'
      };

      const result = CodeQualityResultSchema.safeParse(validData);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.file).toBe('src/test.ts');
      }
    });

    it('should return error details with safeParse on invalid data', () => {
      const invalidData = {
        file: 'src/test.ts',
        issues: [],
        overallScore: 150, // Invalid: > 100
        summary: 'Test'
      };

      const result = CodeQualityResultSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBeDefined();
        expect(result.error.errors.length).toBeGreaterThan(0);
      }
    });
  });
});
