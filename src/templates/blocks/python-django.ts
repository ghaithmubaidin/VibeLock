import type { StackFingerprint } from '../../fingerprint/types.js'
import type { RuleBlock } from '../types.js'

export function pythonDjangoBlock(fp: StackFingerprint): RuleBlock {
  const version = fp.pythonFrameworkVersion ? ` ${fp.pythonFrameworkVersion}` : ''
  return {
    id: 'python-django',
    source: [],
    globs: ['**/*.py', '**/templates/**/*.html', 'manage.py', 'settings.py', '**/settings.py'],
    description: 'Django model, view, settings, and migration rules',
    content: `## Django${version}
- Keep business logic in models and services, not views
- Use class-based views for standard CRUD patterns
- Use Django REST Framework for API endpoints
- Keep settings modular with django-configurations or env-based settings
- Use Django's migration system for schema changes`,
  }
}
