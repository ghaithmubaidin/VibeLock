import { intro, multiselect, outro, cancel } from '@clack/prompts'
import { installHook } from '../git/hook.js'
import { exists } from '../utils/fs.js'
import { join } from 'node:path'
import { logSuccess, logInfo } from '../utils/logger.js'

export interface InitOptions {
  cwd?: string
  yes?: boolean
}

export async function initCommand(options: InitOptions = {}): Promise<void> {
  const cwd = options.cwd ?? process.cwd()
  const isInteractive = options.yes !== true && process.stdout.isTTY

  if (isInteractive) {
    intro('vibelock init')
  } else {
    logInfo('Initializing vibelock non-interactively...')
  }

  // Detect which AI tools/rule files are present or should be created
  const hasAgents = await exists(join(cwd, 'AGENTS.md'))
  const hasClaude = await exists(join(cwd, 'CLAUDE.md'))
  const hasCursor = await exists(join(cwd, '.cursor', 'rules'))
  const hasCopilot = await exists(join(cwd, '.github', 'copilot-instructions.md'))

  let selected: string[] = []

  if (isInteractive) {
    const availableTargets: { value: string; label: string; hint?: string }[] = []

    availableTargets.push({
      value: 'AGENTS.md',
      label: 'AGENTS.md',
      hint: hasAgents ? 'found' : 'will create',
    })

    availableTargets.push({
      value: 'CLAUDE.md',
      label: 'CLAUDE.md',
      hint: hasClaude ? 'found' : 'will create',
    })

    availableTargets.push({
      value: '.cursor/rules',
      label: '.cursor/rules/',
      hint: hasCursor ? 'found' : 'will create',
    })

    availableTargets.push({
      value: 'copilot-instructions.md',
      label: 'copilot-instructions.md',
      hint: hasCopilot ? 'found' : 'will create',
    })

    const result = await multiselect({
      message: 'Which files should vibelock manage?',
      options: availableTargets,
      required: true,
    })

    if (typeof result !== 'object' || !Array.isArray(result) || result.length === 0) {
      cancel('No files selected. Setup cancelled.')
      process.exitCode = 0
      return
    }

    selected = result as string[]
  } else {
    // Non-interactive auto-selection
    const noRuleFiles = !hasAgents && !hasClaude && !hasCursor && !hasCopilot
    
    if (hasAgents || noRuleFiles) selected.push('AGENTS.md')
    if (hasClaude || noRuleFiles) selected.push('CLAUDE.md')
    if (hasCursor) selected.push('.cursor/rules')
    if (hasCopilot) selected.push('copilot-instructions.md')

    logInfo(`Managing targets: ${selected.join(', ')}`)
  }

  // Install the pre-commit hook
  await installHook(cwd)
  logSuccess('Pre-commit hook installed')

  // Run initial scan
  const { scanCommand } = await import('./scan.js')
  await scanCommand({ cwd, targets: selected })

  if (isInteractive) {
    outro('vibelock is now watching your stack.')
  } else {
    logSuccess('vibelock initialization complete.')
  }
}
