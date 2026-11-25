# Multi-Agent Code Review Orchestrator

A production-ready multi-agent system that automates comprehensive code review using the Claude Agent SDK. The system coordinates multiple specialized AI agents to analyze GitHub pull requests and generate detailed reports.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Main Orchestrator                        │
│         Coordinates agents and aggregates results           │
└─────────────────────────┬───────────────────────────────────┘
                          │
        ┌─────────────────┼─────────────────┐
        │                 │                 │
        ▼                 ▼                 ▼
┌───────────────┐ ┌───────────────┐ ┌───────────────┐
│ Code Quality  │ │ Test Coverage │ │ Refactoring   │
│   Analyzer    │ │   Analyzer    │ │  Suggester    │
└───────────────┘ └───────────────┘ └───────────────┘
```

### Agents

| Agent | Purpose |
|-------|---------|
| **Code Quality Analyzer** | Identifies code smells, anti-patterns, and best practice violations |
| **Test Coverage Analyzer** | Evaluates test completeness and suggests missing test cases |
| **Refactoring Suggester** | Recommends architectural improvements and refactoring opportunities |

## Prerequisites

- **Node.js** 18.x or higher
- **npm** 9.x or higher
- **Anthropic API Key** or AWS Bedrock credentials
- **GitHub Token** (recommended for higher rate limits)

## Quick Start

### 1. Install Dependencies

```bash
# Navigate to the project directory
cd /voc/work/cd14715-claude-code-classroom/project/starter

# Install from repository root (uses npm workspaces)
cd ../..
npm install

# Return to project
cd project/starter
```

### 2. Configure Environment

```bash
# Copy the example environment file
cp .env.example .env
```

Edit `.env` with your configuration:

```bash
# Model Configuration (REQUIRED)
ANTHROPIC_MODEL=claude-sonnet-4-5-20250929

# Project Root (REQUIRED)
PROJECT_ROOT=/voc/work/cd14715-claude-code-classroom/project/starter

# GitHub Token (RECOMMENDED - for higher rate limits)
# GITHUB_TOKEN=ghp_your-token-here

# Logging Level (optional)
LOG_LEVEL=info
```

**Note:** In Vocareum workspaces, `ANTHROPIC_API_KEY` is pre-configured in the environment. Do not add it to `.env`.

### 3. Run a Code Review

```bash
# Development mode (with hot reload)
npm run dev -- <owner> <repo> <pr-number>

# Example: Review a React PR
npm run dev -- facebook react 12345
```

### 4. View Reports

Reports are generated in three formats and saved to the `reports/` directory:

```
reports/
├── facebook_react_12345.md    # Markdown report
├── facebook_react_12345.html  # HTML report (viewable in browser)
└── facebook_react_12345.json  # JSON report (for programmatic use)
```

## Usage

### Command Line Interface

```bash
npm run dev -- <owner> <repo> <pr-number>
```

| Argument | Description | Example |
|----------|-------------|---------|
| `owner` | GitHub repository owner | `facebook` |
| `repo` | Repository name | `react` |
| `pr-number` | Pull request number | `12345` |

### Production Build

```bash
# Build TypeScript
npm run build

# Run compiled version
npm start -- <owner> <repo> <pr-number>
```

### Running Tests

```bash
# Run all tests
npm test

# Run specific test file
npm test -- orchestrator.test.ts

# Watch mode (re-run on changes)
npm run test:watch
```

### Type Checking

```bash
# Check types without emitting files
npm run lint
```

## Project Structure

```
project/starter/
├── .claude/
│   └── skills/                    # Claude skills definitions
│       └── javascript-best-practices/
├── src/
│   ├── agents/                    # Subagent definitions
│   │   ├── code-quality-analyzer.ts
│   │   ├── test-coverage-analyzer.ts
│   │   └── refactoring-suggester.ts
│   ├── config/
│   │   └── mcp.config.ts          # MCP server configuration
│   ├── prompts/                   # Agent prompts
│   │   ├── orchestrator.prompt.ts
│   │   ├── code-quality-analyzer.prompt.ts
│   │   ├── test-coverage-analyzer.prompt.ts
│   │   └── refactoring-suggester.prompt.ts
│   ├── types/                     # TypeScript types & Zod schemas
│   │   ├── analysis-results.ts
│   │   ├── report-types.ts
│   │   └── index.ts
│   ├── utils/                     # Utility functions
│   │   ├── logger.ts              # Winston structured logging
│   │   ├── report-generator.ts    # Report generation
│   │   ├── error-handler.ts       # Error handling with retry
│   │   └── rate-limiter.ts        # Token bucket rate limiting
│   ├── main.ts                    # Entry point
│   └── orchestrator.ts            # Main orchestrator logic
├── tests/                         # Test files
│   ├── orchestrator.test.ts
│   └── schemas.test.ts
├── reports/                       # Generated reports (created on run)
├── logs/                          # Application logs (created on run)
├── .env.example                   # Environment template
├── package.json
├── tsconfig.json
└── README_project.md              # This file
```

## Configuration Options

### Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `ANTHROPIC_API_KEY` | Yes* | - | Anthropic API key |
| `ANTHROPIC_MODEL` | Yes | `claude-sonnet-4-5-20250929` | Model to use |
| `PROJECT_ROOT` | Yes | - | Absolute path to project directory |
| `GITHUB_TOKEN` | No | - | GitHub personal access token |
| `LOG_LEVEL` | No | `info` | Logging level (error, warn, info, debug) |

*Pre-configured in Vocareum workspaces

### AWS Bedrock Alternative

For AWS Bedrock authentication, set these variables instead:

```bash
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
AWS_REGION=us-east-1
ANTHROPIC_MODEL=us.anthropic.claude-sonnet-4-5-20250929-v1:0
```

## Output Format

### Report Summary

Each review generates a summary including:

- **Files Reviewed**: Total number of files analyzed
- **Overall Score**: Quality score from 0-100
- **Critical Issues**: Count of high-severity problems
- **Tests Needed**: Number of suggested test cases
- **Refactoring Opportunities**: Count of improvement suggestions

### Report Contents

1. **Code Quality Analysis**
   - Code smells and anti-patterns
   - Best practice violations
   - Security concerns
   - Performance issues

2. **Test Coverage Analysis**
   - Missing test scenarios
   - Edge cases to consider
   - Integration test suggestions

3. **Refactoring Suggestions**
   - Architectural improvements
   - Code organization recommendations
   - Design pattern opportunities

## Technologies

| Technology | Purpose |
|------------|---------|
| [Claude Agent SDK](https://github.com/anthropics/claude-agent-sdk) | Multi-agent orchestration |
| [Model Context Protocol](https://modelcontextprotocol.io/) | External tool integration |
| [Zod](https://zod.dev/) | Schema validation & type safety |
| [TypeScript](https://www.typescriptlang.org/) | Type-safe development |
| [Vitest](https://vitest.dev/) | Testing framework |
| [Winston](https://github.com/winstonjs/winston) | Structured logging |

## Troubleshooting

### Common Issues

**1. "No authentication method configured"**
- Ensure `ANTHROPIC_API_KEY` is set (or AWS credentials for Bedrock)
- In Vocareum, this should be pre-configured

**2. "ANTHROPIC_MODEL environment variable is not set"**
- Add `ANTHROPIC_MODEL=claude-sonnet-4-5-20250929` to your `.env` file

**3. "Review operation timed out"**
- Large PRs may take longer to analyze
- The default timeout is 5 minutes (300000ms)

**4. Rate limiting errors**
- Add a GitHub token to increase rate limits
- The system includes built-in rate limiting protection

### Logs

Application logs are written to the `logs/` directory:

```bash
# View recent logs
cat logs/combined.log | tail -50

# View errors only
cat logs/error.log
```

## Development

### Adding a New Agent

1. Create agent file in `src/agents/`
2. Define the agent prompt in `src/prompts/`
3. Export from `src/agents/index.ts`
4. Add to orchestrator's agent list in `src/orchestrator.ts`

### Modifying Report Format

Edit `src/utils/report-generator.ts` to customize:
- Markdown formatting
- HTML styling
- JSON structure

### Updating Schemas

Edit `src/types/` files and regenerate JSON schemas:
- Use Zod for runtime validation
- JSON schemas are auto-generated for structured output

## License

ISC License - See package.json for details.
