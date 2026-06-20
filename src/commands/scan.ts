import { runAllScanners } from '../scanner/coordinator.js'
import { mergeFingerprints } from '../fingerprint/engine.js'
import { getRuleBlocks } from '../templates/registry.js'
import type { RuleBlock } from '../templates/types.js'
import { renderAgentsMd } from '../templates/outputs/agents-md.js'
import { renderClaudeMd } from '../templates/outputs/claude-md.js'
import { renderCursorRulesMdc } from '../templates/outputs/cursor-rules.js'
import { renderCopilotInstructions } from '../templates/outputs/copilot.js'
import { diffBlocks } from '../patcher/differ.js'
import { applyPatch } from '../patcher/writer.js'
import { stageFiles } from '../git/stage.js'
import { safeRead } from '../utils/fs.js'
import { logWarning, logInfo, logSuccess } from '../utils/logger.js'
import { AppError } from '../utils/errors.js'
import { writeFile, mkdir } from 'node:fs/promises'
import { join, dirname, basename } from 'node:path'
import chalk from 'chalk'
import { confirm } from '@clack/prompts'

export interface ScanOptions {
  cwd?: string
  hook?: boolean
  dryRun?: boolean
  targets?: string[]
}

interface OutputTarget {
  filePath: string
  render: (blocks: RuleBlock[]) => string
  currentContent: string | null
}

export async function scanCommand(options: ScanOptions = {}): Promise<void> {
  const cwd = options.cwd ?? process.cwd()

  try {
    // Run scanners and build fingerprint
    const scannerResults = await runAllScanners(cwd)
    const fingerprint = mergeFingerprints(scannerResults)
    const blocks = await getRuleBlocks(fingerprint, cwd)

    // Determine output targets
    const targets = options.targets ?? ['AGENTS.md', 'CLAUDE.md', '.cursor/rules', 'copilot-instructions.md']
    const outputTargets: OutputTarget[] = []

    if (targets.includes('AGENTS.md')) {
      const filePath = join(cwd, 'AGENTS.md')
      outputTargets.push({
        filePath,
        render: () => renderAgentsMd(blocks),
        currentContent: await safeRead(filePath),
      })
    }

    if (targets.includes('CLAUDE.md')) {
      const filePath = join(cwd, 'CLAUDE.md')
      outputTargets.push({
        filePath,
        render: () => renderClaudeMd(blocks),
        currentContent: await safeRead(filePath),
      })
    }

    if (targets.includes('.cursor/rules')) {
      const filePath = join(cwd, '.cursor', 'rules', 'vibelock.mdc')
      outputTargets.push({
        filePath,
        render: () => renderCursorRulesMdc(blocks),
        currentContent: await safeRead(filePath),
      })
    }

    if (targets.includes('copilot-instructions.md')) {
      const filePath = join(cwd, '.github', 'copilot-instructions.md')
      outputTargets.push({
        filePath,
        render: () => renderCopilotInstructions(blocks),
        currentContent: await safeRead(filePath),
      })
    }

    // Compute diffs for each target
    let hasChanges = false
    const patchedFiles: string[] = []

    for (const target of outputTargets) {
      const diff = diffBlocks(target.currentContent, blocks)

      if (
        diff.changed.length === 0 &&
        diff.added.length === 0 &&
        diff.removed.length === 0
      ) {
        continue
      }

      hasChanges = true

      // Print summary
      if (!options.hook) {
        printDiffSummary(target.filePath, diff)
      }

      if (options.dryRun) continue

      // Apply patch
      const patched =
        target.currentContent !== null
          ? applyPatch(target.currentContent, diff)
          : target.render(blocks)

      // Ensure directory exists
      const dir = dirname(target.filePath)
      if (dir !== cwd) {
        await mkdir(dir, { recursive: true })
      }

      // Write atomically
      await writeFile(target.filePath + '.tmp', patched, 'utf-8')
      const { rename } = await import('node:fs/promises')
      await rename(target.filePath + '.tmp', target.filePath)

      patchedFiles.push(target.filePath)
    }

    // Stage patched files
    if (patchedFiles.length > 0 && !options.dryRun) {
      await stageFiles(cwd, patchedFiles)
    }

    // Show results
    if (options.hook && hasChanges) {
      console.error(
        chalk.yellow('vibelock') +
          '  ' +
          chalk.white('stack drift detected and patched'),
      )
      for (const file of patchedFiles) {
        const relPath = file.replace(cwd + '/', '').replace(cwd, '.')
        console.error('  ' + chalk.cyan(relPath) + ' ' + chalk.green('updated and staged'))
      }
    }

    if (options.dryRun && hasChanges) {
      logInfo('(dry run) no files written')
    }

    if (!hasChanges && !options.hook) {
      logSuccess('stack is in sync — no changes needed')
    }
  } catch (err: unknown) {
    if (options.hook) {
      // In hook mode: never block the commit
      logWarning(
        `scan failed: ${err instanceof Error ? err.message : String(err)} (commit will proceed)`,
      )
      return
    }

    if (err instanceof AppError) {
      console.error(chalk.red('error:'), chalk.white(err.message))
      if (err.isFatal) process.exit(1)
      return
    }

    throw err
  }
}

function printDiffSummary(filePath: string, diff: ReturnType<typeof diffBlocks>): void {
  const relPath = basename(filePath)
  console.error(chalk.yellow('\nvibelock') + '  ' + chalk.white(`changes for ${relPath}:`))

  for (const block of diff.changed) {
    console.error(
      '  ' + chalk.cyan(block.id) + ' ' + chalk.white('rule block updated'),
    )
  }

  for (const block of diff.added) {
    console.error(
      '  ' + chalk.cyan(block.id) + ' ' + chalk.green('rule block added'),
    )
  }

  for (const id of diff.removed) {
    console.error(
      '  ' + chalk.cyan(id) + ' ' + chalk.red('rule block removed'),
    )
  }
}

/**
 * Interactive scan — asks for confirmation before writing.
 */
export async function scanInteractive(options: ScanOptions = {}): Promise<void> {
  if (!process.stdout.isTTY) {
    throw new AppError(
      'Interactive prompts require a TTY. Use the --yes flag to run non-interactively.',
      'NO_TTY',
      true
    )
  }

  const cwd = options.cwd ?? process.cwd()

  const scannerResults = await runAllScanners(cwd)
  const fingerprint = mergeFingerprints(scannerResults)
  const blocks = await getRuleBlocks(fingerprint, cwd)

  // Show what was detected
  console.error(chalk.yellow('\nvibelock') + '  ' + chalk.white('detected stack:'))
  const entries = Object.entries(fingerprint).filter(([k]) => k !== 'detectedFiles')
  for (const [key, value] of entries) {
    if (value !== undefined) {
      console.error('  ' + chalk.cyan(key) + ': ' + String(value))
    }
  }

  // Generate and show diff for AGENTS.md
  const agentsPath = join(cwd, 'AGENTS.md')
  const currentContent = await safeRead(agentsPath)
  const diff = diffBlocks(currentContent, blocks)

  if (
    diff.changed.length === 0 &&
    diff.added.length === 0 &&
    diff.removed.length === 0
  ) {
    logSuccess('stack is in sync — no changes needed')
    return
  }

  printDiffSummary('AGENTS.md', diff)

  const proceed = await confirm({
    message: 'Apply these changes?',
  })

  if (proceed !== true) {
    logInfo('changes cancelled')
    return
  }

  await scanCommand({ ...options, targets: ['AGENTS.md'] })
}
