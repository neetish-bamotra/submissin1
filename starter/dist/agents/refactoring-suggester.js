import { REFACTORING_SUGGESTER_PROMPT } from '../prompts/refactoring-suggester.prompt.js';
/**
 * Refactoring Suggester Agent
 * Identifies opportunities to improve code structure, readability, and modernize patterns.
 */
export const refactoringSuggester = {
    name: 'refactoring-suggester',
    description: 'Identifies refactoring opportunities, code modernization, and design pattern improvements',
    instructions: REFACTORING_SUGGESTER_PROMPT,
    tools: ['Read', 'Grep', 'Glob', 'Skill']
};
//# sourceMappingURL=refactoring-suggester.js.map