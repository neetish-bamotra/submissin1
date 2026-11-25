import * as dotenv from 'dotenv';
import * as fs from 'fs';
import { CodeReviewOrchestrator } from './orchestrator.js';
import { ReportGenerator } from './utils/report-generator.js';
import { logger } from './utils/logger.js';

// Load environment variables
dotenv.config();

/**
 * Main entry point for the Claude Multi-Agent Code Review System
 * Usage: npm run dev <owner> <repo> <pr-number>
 */
async function main() {
  const [owner, repo, prStr] = process.argv.slice(2);

  // ===== VALIDATE COMMAND-LINE ARGUMENTS =====
  if (!owner || !repo || !prStr) {
    console.error('❌ Missing required arguments');
    console.error('Usage: npm run dev -- <owner> <repo> <pr-number>');
    console.error('Example: npm run dev -- facebook react 12345');
    process.exit(1);
  }

  const prNumber = parseInt(prStr, 10);
  if (isNaN(prNumber) || prNumber <= 0) {
    console.error('❌ PR number must be a valid positive integer');
    console.error(`Received: "${prStr}"`);
    process.exit(1);
  }

  // ===== VALIDATE AUTHENTICATION =====
  const hasAnthropicAPI = process.env.ANTHROPIC_API_KEY;
  const hasAWSAccessKey = process.env.AWS_ACCESS_KEY_ID;
  const hasAWSSecretKey = process.env.AWS_SECRET_ACCESS_KEY;
  const hasAWSRegion = process.env.AWS_REGION;

  let authMethod = '';

  if (hasAnthropicAPI) {
    authMethod = 'Anthropic API';
    logger.info('🔐 Using Anthropic API authentication');
    console.log('🔐 Using Anthropic API authentication');
  } else if (hasAWSAccessKey && hasAWSSecretKey) {
    if (!hasAWSRegion) {
      console.error('❌ AWS Bedrock authentication error');
      console.error('AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY are set,');
      console.error('but AWS_REGION is missing.');
      console.error('Please set AWS_REGION in your .env file (e.g., us-east-1)');
      process.exit(1);
    }
    authMethod = 'AWS Bedrock';
    logger.info('🔐 Using AWS Bedrock authentication');
    console.log('🔐 Using AWS Bedrock authentication');
  } else {
    console.error('❌ No authentication method configured');
    console.error('');
    console.error('Please configure ONE of the following:');
    console.error('');
    console.error('Option 1: Anthropic API');
    console.error('  Set ANTHROPIC_API_KEY in your .env file');
    console.error('  Get your key at: https://console.anthropic.com/account/keys');
    console.error('');
    console.error('Option 2: AWS Bedrock');
    console.error('  Set AWS_ACCESS_KEY_ID in your .env');
    console.error('  Set AWS_SECRET_ACCESS_KEY in your .env');
    console.error('  Set AWS_REGION in your .env (e.g., us-east-1)');
    console.error('');
    process.exit(1);
  }

  // ===== VALIDATE MODEL CONFIGURATION =====
  const model = process.env.ANTHROPIC_MODEL;
  if (!model) {
    console.error('❌ ANTHROPIC_MODEL environment variable is not set');
    console.error('');
    console.error('Please set ANTHROPIC_MODEL in your .env file:');
    console.error('');
    if (authMethod === 'AWS Bedrock') {
      console.error('For AWS Bedrock:');
      console.error('  ANTHROPIC_MODEL=us.anthropic.claude-sonnet-4-5-20250929-v1:0');
    } else {
      console.error('For Anthropic API:');
      console.error('  ANTHROPIC_MODEL=claude-sonnet-4-5-20250929');
    }
    console.error('');
    process.exit(1);
  }

  logger.info('Configuration validated', { owner, repo, prNumber, authMethod, model });

  try {
    // ===== CREATE ORCHESTRATOR AND RUN REVIEW =====
    console.log('');
    console.log(`📋 Starting code review for ${owner}/${repo}#${prNumber}`);
    console.log('');

    const orchestrator = new CodeReviewOrchestrator({ model });
    const report = await orchestrator.reviewPullRequest(owner, repo, prNumber);

    // ===== GENERATE REPORTS =====
    console.log('📝 Generating reports...');
    console.log('');

    // Create reports directory
    const reportsDir = 'reports';
    if (!fs.existsSync(reportsDir)) {
      fs.mkdirSync(reportsDir, { recursive: true });
    }

    const reportGenerator = new ReportGenerator();
    const filename = `${owner}_${repo}_${prNumber}`;

    // Generate Markdown report
    const markdown = reportGenerator.generateMarkdownReport(report);
    const mdPath = `${reportsDir}/${filename}.md`;
    fs.writeFileSync(mdPath, markdown, 'utf-8');
    logger.info('Markdown report generated', { path: mdPath });

    // Generate HTML report
    const html = reportGenerator.generateHTMLReport(report);
    const htmlPath = `${reportsDir}/${filename}.html`;
    fs.writeFileSync(htmlPath, html, 'utf-8');
    logger.info('HTML report generated', { path: htmlPath });

    // Generate JSON report
    const json = reportGenerator.generateJSONReport(report);
    const jsonPath = `${reportsDir}/${filename}.json`;
    fs.writeFileSync(jsonPath, json, 'utf-8');
    logger.info('JSON report generated', { path: jsonPath });

    // ===== SUCCESS MESSAGE =====
    console.log('✅ Code review completed successfully!');
    console.log('');
    console.log('📁 Reports saved to:');
    console.log(`   • ${mdPath} (Markdown)`);
    console.log(`   • ${htmlPath} (HTML)`);
    console.log(`   • ${jsonPath} (JSON)`);
    console.log('');
    console.log(`📊 Summary:`);
    console.log(`   • Files reviewed: ${report.summary.totalFiles}`);
    console.log(`   • Overall score: ${report.summary.overallScore}/100`);
    console.log(`   • Critical issues: ${report.summary.criticalIssues}`);
    console.log(`   • Tests needed: ${report.summary.highPriorityTests}`);
    console.log(`   • Refactoring opportunities: ${report.summary.refactoringOpportunities}`);
    console.log('');

    logger.info('Code review workflow completed', {
      owner,
      repo,
      prNumber,
      filesReviewed: report.summary.totalFiles,
      overallScore: report.summary.overallScore
    });
  } catch (error) {
    console.error('');
    console.error('❌ Code review failed');
    console.error('');

    if (error instanceof Error) {
      console.error(`Error: ${error.message}`);
      logger.error('Code review failed', {
        error: error.message,
        stack: error.stack
      });
    } else {
      console.error(`Error: ${String(error)}`);
      logger.error('Code review failed', {
        error: String(error)
      });
    }

    console.error('');
    console.error('💡 Troubleshooting:');
    console.error('   1. Check that your API key is valid');
    console.error('   2. Verify the PR number exists: https://github.com/' + owner + '/' + repo + '/pull/' + prNumber);
    console.error('   3. Check that you have network connectivity');
    console.error('   4. Review the logs directory for detailed error information');
    console.error('');

    process.exit(1);
  }
}

main();
