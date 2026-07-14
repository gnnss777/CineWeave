---  
name: design-md-apply  
description: >-  
  Apply design tokens from DESIGN.md to UI components: replace hardcoded colors,  
  fonts, spacing, rounded corners, and enforce Do's and Don'ts. Use this skill  
  whenever you need to style UI components, implement visual designs, or ensure  
  consistency with an existing DESIGN.md file in the project.  
metadata:  
  spec-url: https://github.com/google-labs-code/design.md  
  version: "1.0"  
---  
   
# design-md-apply  
   
## Purpose  
   
This skill enables you to consume a project's `DESIGN.md` file and apply its design system to UI components. You will replace hardcoded visual values with token references and ensure compliance with the project's Do's and Don'ts.  
   
## When to use this skill  
   
Use this skill when:  
- The user asks you to "apply the design system" to a component, page, or whole project.  
- You see a `DESIGN.md` file in the project root.  
- You are generating new UI code that should follow an existing `DESIGN.md`.  
   
## How to apply DESIGN.md  
   
### 0. Validate DESIGN.md first  
   
```bash  
npx @google/design.md lint <design_file_path>  
```  
   
If errors exist, stop and inform the user.  
   
### 1. Locate and parse DESIGN.md  
   
Extract YAML front matter (tokens) and markdown body (guidelines, especially Do's and Don'ts).  
   
### 2. Token resolution  
   
- Resolve token references recursively (`{colors.primary}`).  
- Detect and break circular references.  
   
### 3. Replace hardcoded values  
   
- **Colors**: Replace with CSS custom properties (`var(--color-primary)`) or token values.  
- **Typography**: Apply `fontFamily`, `fontSize`, `fontWeight`, `lineHeight`, `letterSpacing` from typography tokens.  
- **Spacing**: Use `spacing` scale for margins, paddings, gaps.  
- **Rounded corners**: Use `rounded` scale.  
   
### 4. Enforce Do's and Don'ts  
   
Apply every statement as a hard rule.  
   
### 5. Verify contrast (WCAG AA 4.5:1)  
   
For every component with both `backgroundColor` and `textColor`, compute contrast ratio.  
   
### 6. Quality checklist  
   
- [ ] DESIGN.md passed validation (0 errors)  
- [ ] All hardcoded values replaced by tokens  
- [ ] Token references resolve correctly  
- [ ] Do's followed, Don'ts avoided  
- [ ] Contrast >= 4.5:1 for all text  
