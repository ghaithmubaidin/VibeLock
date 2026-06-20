import { Command } from 'commander'
import { initCommand } from './commands/init.js'
import { scanCommand, scanInteractive } from './commands/scan.js'
import { uninstallCommand } from './commands/uninstall.js'
import { readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

// Read version from package.json
const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const pkgPath = join(__dirname, '..', 'package.json')

let version = '0.1.0'
try {
  const pkg = JSON.parse(await readFile(pkgPath, 'utf-8')) as { version?: string }
  if (pkg.version) version = pkg.version
} catch {
  // Use default version
}

const program = new Command()

program
  .name('vibelock')
  .description('Keep AI coding agent rules consistent with your project stack')
  .version(version)

program
  .command('init')
  .description('Set up vibelock in the current project')
  .action(async () => {
    await initCommand()
  })

program
  .command('scan')
  .description('Scan the project and update rule files')
  .option('--hook', 'Called from git hook — suppress prompts, exit 0 always')
  .option('--dry-run', 'Show what would change without writing anything')
  .action(async (options: { hook?: boolean; dryRun?: boolean }) => {
    if (options.dryRun) {
      await scanCommand({ dryRun: true })
    } else if (options.hook) {
      await scanCommand({ hook: true })
    } else {
      await scanInteractive()
    }
  })

program
  .command('uninstall')
  .description('Remove vibelock pre-commit hook')
  .action(async () => {
    await uninstallCommand()
  })

program.parse(process.argv)
