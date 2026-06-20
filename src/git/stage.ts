import { simpleGit } from 'simple-git'
import { logWarning } from '../utils/logger.js'

export async function stageFiles(rootDir: string, filePaths: string[]): Promise<void> {
  if (filePaths.length === 0) return

  try {
    const git = simpleGit(rootDir)
    await git.add(filePaths)
  } catch (error) {
    // Not a git repository or other git error — skip staging
    logWarning(`Failed to stage files: ${error instanceof Error ? error.message : String(error)}`)
  }
}
