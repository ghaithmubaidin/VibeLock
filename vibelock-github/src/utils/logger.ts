import chalk from 'chalk'

export function logWarning(message: string): void {
  console.error(chalk.yellow('vibelock'), message)
}

export function logError(message: string, code?: string): void {
  const codeStr = code ? ` [${code}]` : ''
  console.error(chalk.red('vibelock error:') + codeStr, message)
}

export function logInfo(message: string): void {
  console.log(chalk.cyan('vibelock'), message)
}

export function logSuccess(message: string): void {
  console.log(chalk.green('vibelock'), message)
}
