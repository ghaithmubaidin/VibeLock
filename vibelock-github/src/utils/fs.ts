import { readFile, access } from 'node:fs/promises'
import { AppError } from './errors.js'

/**
 * Read a file and return its contents, or null if it does not exist.
 * Never throws for ENOENT. Throws AppError for other errors.
 */
export async function safeRead(filePath: string): Promise<string | null> {
  try {
    return await readFile(filePath, 'utf-8')
  } catch (err: unknown) {
    if (err instanceof Error && 'code' in err && (err as NodeJS.ErrnoException).code === 'ENOENT') {
      return null
    }
    throw new AppError(`Failed to read ${filePath}`, 'FS_READ_ERROR')
  }
}

/**
 * Check if a path exists without reading it.
 */
export async function exists(filePath: string): Promise<boolean> {
  try {
    await access(filePath)
    return true
  } catch {
    return false
  }
}

/**
 * Safely parse a JSON file and return the parsed value, or null if missing.
 */
export async function safeReadJson<T = Record<string, unknown>>(
  filePath: string,
): Promise<T | null> {
  const content = await safeRead(filePath)
  if (content === null) return null
  try {
    return JSON.parse(content) as T
  } catch {
    return null
  }
}
