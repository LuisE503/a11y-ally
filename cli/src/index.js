#!/usr/bin/env node

/**
 * A11y Ally — CLI Entry Point
 * Web Accessibility Scanner with LLM-powered explanations
 *
 * Usage:
 *   a11y-ally scan <url> [options]
 *   a11y-ally batch <file> [options]
 *   a11y-ally demo
 */

const { Command } = require('commander');
const chalk = require('chalk');
const ora = require('ora');
const path = require('path');
const fs = require('fs');
const { scanUrl, batchScan } = require('./scanner');
const { explainViolations } = require('./llm-explainer');
const { generateReport } = require('./reporter');

const pkg = require('../package.json');

const program = new Command();

// ASCII art banner
const BANNER = chalk.hex('#6c5ce7')(`
  ╔═══════════════════════════════════════╗
  ║     ♿  A11y Ally  v${pkg.version}             ║
  ║   Web Accessibility Assistant         ║
  ╚═══════════════════════════════════════╝
`);

program
  .name('a11y-ally')
  .description('Web Accessibility Scanner — Powered by axe-core + LLM explanations')
  .version(pkg.version)
  .addHelpText('before', BANNER);

/**
 * SCAN command — Scan a single URL
 */
program
  .command('scan <url>')
  .description('Scan a URL for accessibility violations')
  .option('-f, --format <format>', 'Report format: html, json, md', 'html')
  .option('-o, --output <path>', 'Output file path')
  .option('-l, --lang <lang>', 'Report language', 'en')
  .option('-k, --llm-key <key>', 'OpenAI API key for AI explanations')
  .option('--no-screenshots', 'Disable screenshots in report')
  .option('--wcag-level <level>', 'WCAG level filter: a, aa, aaa', 'aa')
  .action(async (url, options) => {
    console.log(BANNER);

    // Validate URL
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      url = 'https://' + url;
    }

    const spinner = ora({
      text: chalk.dim('Initializing scanner...'),
      color: 'magenta'
    }).start();

    try {
      // Step 1: Scan
      spinner.text = chalk.dim(`Scanning ${chalk.white(url)}...`);
      const scanResult = await scanUrl(url);

      if (scanResult.error) {
        spinner.fail(chalk.red(`Scan failed: ${scanResult.errorMessage}`));
        process.exit(1);
      }

      spinner.text = chalk.dim('Analyzing violations...');

      // Step 2: Explain violations
      const explainMode = options.llmKey ? 'llm' : 'offline';
      const explained = await explainViolations(scanResult, {
        apiKey: options.llmKey,
        mode: explainMode
      });

      // Step 3: Generate report
      spinner.text = chalk.dim('Generating report...');

      const defaultOutput = `a11y-report-${new Date().toISOString().slice(0, 10)}.${options.format === 'md' ? 'md' : options.format === 'json' ? 'json' : 'html'}`;
      const outputPath = options.output || defaultOutput;

      generateReport(explained, options.format, outputPath, { lang: options.lang });

      spinner.succeed(chalk.green('Scan complete!'));

      // Print summary
      console.log('');
      console.log(chalk.white.bold('  ── Results ──────────────────────'));
      console.log('');

      const scoreColor = explained.score >= 90 ? chalk.green : explained.score >= 70 ? chalk.yellow : explained.score >= 50 ? chalk.hex('#f09040') : chalk.red;
      console.log(`  ${chalk.dim('URL:')}       ${chalk.white(url)}`);
      console.log(`  ${chalk.dim('Score:')}     ${scoreColor.bold(explained.score + '/100')}`);
      console.log(`  ${chalk.dim('Violations:')} ${chalk.red.bold(explained.summary.violations)}`);
      console.log(`  ${chalk.dim('Passes:')}    ${chalk.green.bold(explained.summary.passes)}`);
      console.log(`  ${chalk.dim('Report:')}    ${chalk.cyan(path.resolve(outputPath))}`);

      if (explained.violations.length > 0) {
        console.log('');
        console.log(chalk.white.bold('  ── Top Issues ───────────────────'));
        console.log('');
        explained.violations.slice(0, 5).forEach((v, i) => {
          const impactColor = v.impact === 'critical' ? chalk.red
            : v.impact === 'serious' ? chalk.hex('#f09040')
            : v.impact === 'moderate' ? chalk.yellow
            : chalk.blue;
          console.log(`  ${chalk.dim(`${i + 1}.`)} ${impactColor(`[${v.impact.toUpperCase()}]`)} ${v.fixTitle || v.description}`);
          console.log(`     ${chalk.dim(v.wcagRef || v.wcagLevel)} · ${chalk.dim(`${v.nodes.length} element(s)`)}`);
        });
      }

      console.log('');
      console.log(chalk.dim(`  Mode: ${explainMode === 'llm' ? '🤖 AI-Powered' : '📚 Offline Knowledge Base'}`));
      console.log('');

    } catch (error) {
      spinner.fail(chalk.red(`Error: ${error.message}`));
      process.exit(1);
    }
  });

/**
 * BATCH command — Scan multiple URLs from file
 */
program
  .command('batch <file>')
  .description('Scan multiple URLs from a file (one URL per line)')
  .option('-f, --format <format>', 'Report format: html, json, md', 'html')
  .option('-o, --output-dir <dir>', 'Output directory', './reports')
  .option('-k, --llm-key <key>', 'OpenAI API key for AI explanations')
  .action(async (file, options) => {
    console.log(BANNER);

    if (!fs.existsSync(file)) {
      console.error(chalk.red(`File not found: ${file}`));
      process.exit(1);
    }

    const urls = fs.readFileSync(file, 'utf8')
      .split('\n')
      .map(line => line.trim())
      .filter(line => line && !line.startsWith('#'));

    console.log(chalk.dim(`  Found ${urls.length} URLs to scan\n`));

    const spinner = ora({ color: 'magenta' }).start();
    const results = [];

    for (let i = 0; i < urls.length; i++) {
      let url = urls[i];
      if (!url.startsWith('http://') && !url.startsWith('https://')) {
        url = 'https://' + url;
      }

      spinner.text = chalk.dim(`[${i + 1}/${urls.length}] Scanning ${chalk.white(url)}...`);

      const scanResult = await scanUrl(url);
      const explainMode = options.llmKey ? 'llm' : 'offline';
      const explained = await explainViolations(scanResult, {
        apiKey: options.llmKey,
        mode: explainMode
      });

      const filename = url.replace(/https?:\/\//, '').replace(/[^a-z0-9]/gi, '_');
      const ext = options.format === 'md' ? 'md' : options.format === 'json' ? 'json' : 'html';
      const outputPath = path.join(options.outputDir, `${filename}.${ext}`);

      generateReport(explained, options.format, outputPath);
      results.push(explained);
    }

    spinner.succeed(chalk.green(`Scanned ${urls.length} URLs`));

    // Print summary table
    console.log('');
    console.log(chalk.white.bold('  ── Batch Results ────────────────'));
    console.log('');
    results.forEach((r, i) => {
      const scoreColor = r.score >= 90 ? chalk.green : r.score >= 70 ? chalk.yellow : chalk.red;
      const status = r.error ? chalk.red('✗ Error') : scoreColor.bold(`${r.score}/100`);
      console.log(`  ${chalk.dim(`${i + 1}.`)} ${status} ${chalk.white(r.url)} ${chalk.dim(`(${r.summary?.violations || 0} violations)`)}`);
    });
    console.log('');
    console.log(chalk.dim(`  Reports saved to: ${path.resolve(options.outputDir)}`));
    console.log('');
  });

/**
 * DEMO command — Run demo scan with pre-built test pages
 */
program
  .command('demo')
  .description('Run a demo scan on sample accessible/inaccessible pages')
  .action(async () => {
    console.log(BANNER);
    console.log(chalk.dim('  Running demo with sample pages...\n'));

    const spinner = ora({ color: 'magenta' }).start();

    // Demo URLs
    const demoUrls = [
      'https://www.w3.org/WAI/demos/bad/before/home.html',
      'https://example.com',
      'https://www.wikipedia.org'
    ];

    const demoResults = [];

    for (let i = 0; i < demoUrls.length; i++) {
      spinner.text = chalk.dim(`[${i + 1}/${demoUrls.length}] Scanning ${chalk.white(demoUrls[i])}...`);

      try {
        const result = await scanUrl(demoUrls[i]);
        const explained = await explainViolations(result, { mode: 'offline' });

        const filename = `demo-${i + 1}`;
        const outputPath = path.join(process.cwd(), `${filename}.html`);
        generateReport(explained, 'html', outputPath);

        demoResults.push(explained);
      } catch (err) {
        demoResults.push({
          url: demoUrls[i],
          error: true,
          errorMessage: err.message,
          score: null,
          violations: []
        });
      }
    }

    spinner.succeed(chalk.green('Demo scan complete!'));

    console.log('');
    console.log(chalk.white.bold('  ── Demo Results ─────────────────'));
    console.log('');
    demoResults.forEach((r, i) => {
      if (r.error) {
        console.log(`  ${chalk.dim(`${i + 1}.`)} ${chalk.red('✗ Error')} ${chalk.white(r.url)}`);
        console.log(`     ${chalk.dim(r.errorMessage)}`);
      } else {
        const scoreColor = r.score >= 90 ? chalk.green : r.score >= 70 ? chalk.yellow : chalk.red;
        console.log(`  ${chalk.dim(`${i + 1}.`)} ${scoreColor.bold(`${r.score}/100`)} ${chalk.white(r.url)}`);
        console.log(`     ${chalk.dim(`${r.summary.violations} violations · ${r.summary.passes} passes · Report saved`)}`);
      }
    });
    console.log('');
  });

program.parse(process.argv);

// Show help if no command provided
if (!process.argv.slice(2).length) {
  program.outputHelp();
}
