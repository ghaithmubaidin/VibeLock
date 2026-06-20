import type { StackFingerprint } from '../../fingerprint/types.js'
import type { RuleBlock } from '../types.js'

export function pythonFastapiBlock(fp: StackFingerprint): RuleBlock {
  const version = fp.pythonFrameworkVersion ? ` ${fp.pythonFrameworkVersion}` : ''
  return {
    id: 'python-fastapi',
    source: [],
    content: `## FastAPI${version}
- Use Pydantic v2 models for request/response validation
- Use dependency injection via Depends() for shared logic
- Group related endpoints into APIRouter instances
- Use async endpoints for I/O-bound operations
- Document with OpenAPI — FastAPI generates this automatically`,
  }
}
