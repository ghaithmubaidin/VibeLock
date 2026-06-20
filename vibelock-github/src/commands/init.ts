import { intro, multiselect, outro, cancel } from '@clack/prompts'
import { installHook } from '../git/hook.js'
import { exists } from '../utils/fs.js'
import { join } from 'node:path'
import { logSuccess } from '../utils/logger.js'

export interface InitOptions {
  cwd?: string
}

export async function initCommand(options: InitOptions = {}): Promise<void> {
  const cwd = options.cwd ?? process.cwd()

  intro('vibelock init')

  // Detect which AI tools are present
  const availableTargets: { value: string; label: string; hint?: string }[] = []

  if (await exists(join(cwd, 'AGENTS.md'))) {
    availableTargets.push({ value: 'AGENTS.md', label: 'AGENTS.md', hint: 'found' })
  } else {
    availableTargets.push({ value: 'AGENTS.md', label: 'AGENTS.md', hint: 'will create' })
  }

  if (await exists(join(cwd, 'CLAUDE.md'))) {
    availableTargets.push({ value: 'CLAUDE.md', label: 'CLAUDE.md', hint: 'found' })
  } else {
    availableTargets.push({ value: 'CLAUDE.md', label: 'CLAUDE.md', hint: 'will create' })
  }

  const cursorDir = join(cwd, '.cursor', 'rules')
  const hasCursorRules = await exists(cursorDir)
  if (hasCursorRules) {
    availableTargets.push({
      value: '.cursor/rules',
      label: '.cursor/rules/',
      hint: 'found',
    })
  } else {
    availableTargets.push({
      value: '.cursor/rules',
      label: '.cursor/rules/',
      hint: 'will create',
    })
  }

  const copilotDir = join(cwd, '.github')
  const hasCopilot = await exists(join(copilotDir, 'copilot-instructions.md'))
  if (hasCopilot) {
    availableTargets.push({
      value: 'copilot-instructions.md',
      label: 'copilot-instructions.md',
      hint: 'found',
    })
  } else {
    availableTargets.push({
      value: 'copilot-instructions.md',
      label: 'copilot-instructions.md',
      hint: 'will create',
    })
  }

  const selected = await multiselect({
    message: 'Which files should vibelock manage?',
    options: availableTargets,
    required: true,
  })

  if (typeof selected !== 'object' || !Array.isArray(selected) || selected.length === 0) {
    cancel('No files selected. Setup cancelled.')
    process.exitCode = 0
    return
  }

  // Install the pre-commit hook
  await installHook(cwd)
  logSuccess('Pre-commit hook installed')

  // Run initial scan
  const { scanCommand } = await import('./scan.js')
  await scanCommand({ cwd, targets: selected as string[] })

  outro('vibelock is now watching your stack.')
}
