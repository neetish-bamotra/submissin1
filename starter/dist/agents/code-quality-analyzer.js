import { CODE_QUALITY_ANALYZER_PROMPT } from '../prompts/code-quality-analyzer.prompt.js';
/**
 * Code Quality Analyzer Agent
 * Analyzes code for security vulnerabilities, performance issues, and maintainability concerns.
 */
export const codeQualityAnalyzer = {
    name: 'code-quality-analyzer',
    description: 'Analyzes code for security vulnerabilities, performance issues, maintainability concerns, and best practice violations',
    instructions: CODE_QUALITY_ANALYZER_PROMPT,
    tools: ['Read', 'Grep', 'Glob', 'Skill']
};
//# sourceMappingURL=code-quality-analyzer.js.map