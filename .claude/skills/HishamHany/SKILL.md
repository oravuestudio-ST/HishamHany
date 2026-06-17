```markdown
# HishamHany Development Patterns

> Auto-generated skill from repository analysis

## Overview
This skill teaches the core development conventions and workflows used in the HishamHany repository, a TypeScript codebase built with Next.js. You'll learn how to structure files, write and organize code, follow commit message standards, and implement effective testing practices using vitest.

## Coding Conventions

### File Naming
- **Style:** camelCase
- **Example:**  
  ```
  userProfile.ts
  apiRoutes.ts
  ```

### Import Style
- **Style:** Alias imports are used for modules.
- **Example:**  
  ```typescript
  import { getUser } from '@/services/userService'
  ```

### Export Style
- **Style:** Mixed (both named and default exports are used)
- **Example:**  
  ```typescript
  // Named export
  export function getUser() { ... }

  // Default export
  export default function handler(req, res) { ... }
  ```

### Commit Messages
- **Pattern:** Conventional commits
- **Prefix:** `fix`
- **Average Length:** 45 characters
- **Example:**  
  ```
  fix: correct user profile image rendering
  ```

## Workflows

_No automated workflows detected in this repository._

## Testing Patterns

- **Framework:** vitest
- **Test File Pattern:** `*.test.ts`
- **Example:**  
  ```typescript
  // userService.test.ts
  import { describe, it, expect } from 'vitest'
  import { getUser } from '@/services/userService'

  describe('getUser', () => {
    it('returns user data', () => {
      const user = getUser(1)
      expect(user).toBeDefined()
    })
  })
  ```

## Commands
| Command | Purpose |
|---------|---------|
| /test   | Run all vitest tests in the project |
| /fix    | Commit a fix using conventional commit pattern |
```