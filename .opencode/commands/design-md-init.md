---
description: Create or import DESIGN.md (no arguments — interactive survey, 'code' — extract from codebase, path to JSON — import Figma tokens)
agent: design-md-wizard
---
 
Execute the creation or update of DESIGN.md based on the argument `$ARGUMENTS`.
 
## Route detection (MUST follow strictly)
 
- If `$ARGUMENTS` is empty or exactly `""` → **interactive survey mode**.
- If `$ARGUMENTS` equals `code` → **codebase analysis mode**.
- If `$ARGUMENTS` is a non-empty path that does **not** equal `code` and the file **exists** → **Figma token import mode**.
- Otherwise → remind the user of valid options: no argument, `code`, or a path to an existing Figma JSON file.
 
## CRITICAL: No survey questions in code or import modes
 
- In **interactive survey mode** only, use the `question` tool to ask the five questions one by one.
- In **codebase analysis mode** and **Figma import mode**, do **NOT** ask any of those five questions. Proceed directly with the analysis or import workflow.
 
## Interactive survey mode (no arguments)
 
Ask five questions about aesthetic, color palette, typography, spacing, shapes/components.
 
## Codebase analysis mode (`code`)
 
Immediately scan the repository for existing design tokens, colors, typography, spacing, radii, and component patterns (stylesheets, Tailwind config, theme files, component code).
 
Produce a DESIGN.md that captures the existing design language.
 
## Figma import mode (path to JSON)
 
Read the given Figma token JSON file and convert it to the DESIGN.md schema.
 
## Post-creation steps (all modes)
 
1. Validate the generated DESIGN.md: `npx @google/design.md lint DESIGN.md`
2. Fix any lint errors and re-validate until `errors` reach 0.
3. Update **AGENTS.md** with a design system block.
