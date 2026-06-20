import { uninstallHook } from '../git/hook.js'
import { logSuccess, logInfo } from '../utils/logger.js'

export interface UninstallOptions {
  cwd?: string
}

export async function uninstallCommand(options: UninstallOptions = {}): Promise<void> {
  const cwd = options.cwd ?? process.cwd()

  await uninstallHook(cwd)
  logSuccess('pre-commit hook removed')

  logInfo('Generated files (AGENTS.md, etc.) were not deleted. Remove them manually if desired.')
}
