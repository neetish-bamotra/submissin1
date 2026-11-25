import { ReviewReport } from './types/report-types.js';
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
export declare class CodeReviewOrchestrator {
    private model;
    private maxTurns;
    private timeoutMs;
    constructor(options?: OrchestratorOptions);
    /**
     * Review a pull request using parallel subagent analysis
     * @param owner - Repository owner
     * @param repo - Repository name
     * @param prNumber - Pull request number
     * @returns Complete review report
     */
    reviewPullRequest(owner: string, repo: string, prNumber: number): Promise<ReviewReport>;
    /**
     * Execute the review using the query function
     * @param prompt - The orchestrator prompt
     * @returns Review report
     */
    private executeReview;
    /**
     * Create a timeout promise that rejects after the configured timeout
     */
    private createTimeoutPromise;
}
//# sourceMappingURL=orchestrator.d.ts.map