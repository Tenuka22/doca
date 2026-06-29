---
name: frontend-design-v2
description: Guidance for distinctive, intentional, production-ready frontend design. Use when building new UI, reshaping existing UI, replicating reference images, improving visual systems, polishing motion, or making a product feel less generic while preserving code quality, responsiveness, accessibility, and maintainability.
license: Complete terms in LICENSE.txt
---

# Frontend Design v2

Approach the work like the design lead and frontend engineer at a small studio known for building interfaces with taste, restraint, and a recognizable point of view.

The goal is not to make something simply modern. The goal is to make something that feels inevitable for this exact product, audience, and brief.

Make deliberate choices about palette, typography, layout, motion, interaction quality, component systems, and art direction. Avoid anything that feels like a generic AI-generated landing page unless the brief explicitly asks for that style.

Take one real aesthetic risk that can be justified by the subject. Spend boldness in one place, then keep everything around it disciplined.

## Priority order

When tradeoffs appear, follow this priority order:

1. Correctness and functionality.
2. Maintainability and clean architecture.
3. Design quality and visual identity.
4. Accessibility and responsive behavior.
5. Performance.
6. Motion polish.

Do not sacrifice working product behavior for decorative visuals. A beautiful broken interface is still broken.

## First principles

Before designing or coding, answer these internally:

1. What is the product, subject, or page actually about?
2. Who is the audience?
3. What is the single job of this page or screen?
4. What should the user feel in the first three seconds?
5. What world, material, ritual, or emotional temperature does the product belong to?
6. What is the one visual idea people should remember?
7. What should be avoided because it would make the work look generic?

If the brief does not define the subject clearly, choose a concrete subject, audience, and page job before designing. State the choice briefly in the plan.

Use any available memory or project context as a hint, but let the current brief win.

Use real content whenever possible. Avoid filler like “boost productivity,” “unlock insights,” “seamless workflow,” “next-generation platform,” or “AI-powered solution” unless the product genuinely needs that language.

## Avoid generated UI defaults

Do not default to these unless the brief explicitly asks for them:

1. Centered hero with gradient blobs.
2. Random glowing orbs.
3. Equal feature cards with Lucide icons.
4. Purple-blue SaaS backgrounds.
5. Glassmorphism everywhere.
6. Fake dashboard charts with meaningless numbers.
7. Overused startup copy.
8. Every section using the same card grid.
9. Decorative shapes unrelated to the subject.
10. Animations applied uniformly to everything.

The interface should feel designed, not decorated.

## Art direction

Before building, define a compact art direction:

1. Visual metaphor.
2. Emotional temperature.
3. Familiar element.
4. Surprising element.
5. Signature design move.
6. Things the design should never do.
7. One human-made detail.

Human-made details can include asymmetry, unusual but justified typography, subject-specific textures, varied layout rhythm, precise copy, tactile controls, or one memorable visual motif.

Do not make the page weird for the sake of being weird. Make it distinctive because the subject calls for it.

## Existing UI rule

When improving an existing UI, do not redesign everything by default.

Preserve the existing visual language unless the user explicitly asks for a full redesign. Improve what exists first:

1. Tighten spacing.
2. Improve hierarchy.
3. Clean color usage.
4. Standardize components.
5. Refine typography.
6. Improve motion.
7. Fix responsiveness.
8. Improve accessibility.

Only introduce a new visual language when the brief asks for a new direction or when the current design has no coherent system.

If changing a design system, update reusable primitives instead of patching individual pages.

## Reference image replication

When the user attaches an image, screenshot, mockup, moodboard, or example UI, treat it as a primary design source.

Do not loosely imitate it unless the user asks only for inspiration. Replicate the visual system as accurately as possible.

Inspect and preserve:

1. Layout structure.
2. Spacing rhythm.
3. Typography scale and personality.
4. Color palette.
5. Border radius.
6. Shadows and depth.
7. Button, input, and card styles.
8. Icon treatment.
9. Background treatment.
10. Grid alignment.
11. Visual density.
12. Motion feeling, if implied.
13. Overall mood.

Before coding from a reference image, internally create a visual inventory:

1. Canvas shape.
2. Dominant layout.
3. Focal point.
4. Approximate spacing scale.
5. Main colors and surface colors.
6. Text hierarchy.
7. Corner style.
8. Shadow style.
9. Border visibility.
10. Component personality.
11. Density.
12. Memorable detail.
13. What would ruin the resemblance.

Match the big shapes first: composition, grid, spacing, scale, color, typography, and component structure. Only then refine small details.

If the reference is quiet, do not make it loud. If it is sharp and rectangular, do not make everything pill-shaped. If it is compact, do not inflate spacing into a generic Apple-like layout.

When exact fonts are unknown, choose close visual equivalents based on personality: geometric sans, humanist sans, grotesk, editorial serif, rounded sans, mono, condensed display, or high-contrast display.

When exact colors are unknown, approximate visually and create named tokens.

## Image assets

If image generation or asset creation tools are available and the design would benefit from custom visuals, use them only to support the design system.

Good uses:

1. Abstract backgrounds.
2. Textures.
3. Atmospheric hero visuals.
4. Product-style illustrations.
5. Decorative objects.
6. Pattern overlays.
7. Cinematic mock visuals.
8. Empty-state illustrations.

Avoid generating UI screenshots with lots of text. Text should usually be built in code, not baked into images.

Generated assets must match the palette, lighting, density, texture level, and emotional world of the design.

Do not use image generation as a substitute for layout.

## Design planning pass

Work in two passes: plan, then build.

Before coding, create a short plan with:

1. Subject, audience, and page job.
2. Visual metaphor.
3. Color tokens.
4. Type roles.
5. Spacing approach.
6. Layout concept.
7. Motion thesis.
8. Component language.
9. Signature element.
10. Risks or constraints.

Keep the plan compact. It should guide implementation, not become a separate essay.

### Color tokens

Define 4 to 7 named colors:

1. Background.
2. Surface.
3. Primary text.
4. Muted text.
5. Accent.
6. Border or hairline.
7. Optional secondary accent.

Avoid pure black and pure white unless there is a deliberate reason.

Example:

```css
:root {
  --background: #080807;
  --surface: #11100d;
  --text: #f4f1e8;
  --muted: #a9a392;
  --accent: #d8a24a;
  --border: rgba(244, 241, 232, 0.1);
}
```

Use accent colors sparingly. A premium design often has one accent color and several quiet support tones.

### Typography

Typography carries personality. Choose typefaces deliberately.

Define roles:

1. Display face for identity.
2. Body face for readability.
3. Utility face for labels, navigation, captions, or metadata.
4. Mono face only when data, code, coordinates, or technical detail benefits from it.

Set type intentionally:

1. Display headings may use tighter letter spacing.
2. Body copy needs comfortable line height.
3. Labels can use uppercase only when it fits the brand.
4. Avoid too many font weights.
5. Do not choose a font just because it is trendy.

### Spacing

Use spacing as hierarchy.

Use an 8px-based scale:

```ts
export const space = {
  1: "4px",
  2: "8px",
  3: "12px",
  4: "16px",
  6: "24px",
  8: "32px",
  12: "48px",
  16: "64px",
  24: "96px",
  32: "128px",
  40: "160px",
  48: "192px"
}
```

Avoid random spacing values unless there is a deliberate optical reason.

Recommended defaults:

1. Eyebrow to headline: 10px to 14px.
2. Headline to paragraph: 18px to 28px.
3. Paragraph to CTA group: 32px to 44px.
4. Card heading to copy: 8px to 14px.
5. Feature group gap: 16px to 28px.
6. Major content block gap: 48px to 80px.
7. Section to section: 96px to 192px.

Text should not stretch too wide. Use measures like:

```css
:root {
  --measure-tight: 42ch;
  --measure-normal: 58ch;
  --measure-wide: 72ch;
  --container: 1200px;
  --container-wide: 1440px;
}
```

## Responsive design

Design mobile first. The interface must work well from small phones to large desktops.

Check at least:

1. 320px.
2. 375px.
3. 768px.
4. 1024px.
5. 1440px.

Rules:

1. Avoid horizontal scrolling.
2. Avoid fixed widths that break on mobile.
3. Prefer fluid grids and flexible containers.
4. Ensure touch targets are comfortable.
5. Reorder layout intentionally on mobile.
6. Do not hide critical content on small screens.
7. Reduce visual density on narrow screens.
8. Keep forms usable with mobile keyboards.
9. Make sticky elements safe around notches and browser chrome.
10. Use responsive type scales instead of shrinking everything equally.

Mobile should not feel like a collapsed desktop page. It should feel intentionally composed.

## Layout strategy

Pick an alignment strategy and commit:

1. Centered editorial for emotional, cinematic, or luxury pages.
2. Left-aligned product for SaaS, developer tools, and clarity-first pages.
3. Split composition when copy and visual object both matter.
4. Asymmetric grid for distinctive brand pages.
5. Magazine layout for editorial or cultural projects.
6. Dense technical paneling for developer, finance, analytics, or control surfaces.

Centering is a mood, not a reset button.

A hero should answer four questions fast:

1. What is this?
2. Why should I care?
3. What can I do next?
4. What visual world am I entering?

The hero needs one dominant focal point. It can be the headline, product visual, image, animation, object, or interactive demo.

Avoid heroes with six badges, two competing primary CTAs, generic dashboard screenshots, random floating icons, or a headline that could fit any startup.

## Component quality

A polished UI is mostly restraint, hierarchy, and consistency.

### Cards

Cards are not always the answer. Use cards when content is modular, comparable, repeatable, or needs containment.

Avoid default three-card or six-card grids unless the content genuinely calls for them.

When using cards, vary scale and emphasis based on importance.

### Buttons

Every page needs clear action hierarchy.

Use one primary CTA. Use one secondary CTA only if it has a distinct job.

Button text should be specific:

Good:

1. Save changes.
2. View pricing.
3. Book a demo.
4. Generate campaign.
5. Publish draft.

Bad:

1. Submit.
2. Click here.
3. Learn more repeated everywhere.
4. Unlock your potential.

### Icons

Icons should support recognition, not decorate weak ideas.

Use icons when they represent a real object, action, or scanning aid. Avoid using icons as filler for generic feature cards.

### Borders, shadows, and depth

Use borders to separate layers or add tactile precision.

For dark themes:

```css
border: 1px solid rgba(255, 255, 255, 0.08);
```

For light themes:

```css
border: 1px solid rgba(15, 23, 42, 0.08);
```

Prefer depth from lighting, contrast, layering, inner highlights, and subtle edge light. Avoid huge blur blobs, heavy shadows on every card, and high-opacity neon glows.

### Radius

Corner radius should match the brand.

Suggested system:

```css
:root {
  --radius-sm: 8px;
  --radius-md: 14px;
  --radius-lg: 22px;
  --radius-xl: 32px;
  --radius-full: 999px;
}
```

Use smaller radii for serious, technical, editorial, or enterprise interfaces. Use larger radii for warm, friendly, consumer, or playful products.

## Component system consistency

When a project has reusable UI primitives, update root-level component files instead of adding one-off class overrides inside pages.

Examples of root primitives:

1. `components/ui/button.tsx`
2. `components/ui/input.tsx`
3. `components/ui/textarea.tsx`
4. `components/ui/select.tsx`
5. `components/ui/radio-group.tsx`
6. `components/ui/checkbox.tsx`
7. `components/ui/switch.tsx`
8. `components/ui/dialog.tsx`
9. `components/ui/dropdown-menu.tsx`
10. `components/ui/tabs.tsx`
11. `components/ui/card.tsx`
12. `components/ui/badge.tsx`
13. `components/ui/popover.tsx`
14. `components/ui/sheet.tsx`
15. `components/ui/tooltip.tsx`

Do not solve consistency by doing this repeatedly:

```tsx
<Button className="rounded-[22px] bg-black px-7 shadow-xl hover:scale-[1.02]">
  Start now
</Button>
```

Prefer this:

```tsx
<Button variant="premium" size="lg">
  Start now
</Button>
```

with the variant defined in the root button component.

Before editing page-level code, ask whether the change belongs to:

1. A design token.
2. A reusable component variant.
3. A shared layout primitive.
4. A page-specific composition.

Use page-level classes for composition and local layout. Do not redefine the identity of reusable components inside pages.

Whenever a new component is needed, first check whether an existing component can be extended.

## Engineering quality

Design quality should not create technical debt.

Rules:

1. Never duplicate logic unnecessarily.
2. Refactor repeated code into components, hooks, utilities, or tokens.
3. Prefer composition over inheritance-style complexity.
4. Keep components focused and readable.
5. Avoid giant files. Split components when a file becomes hard to scan.
6. Avoid prop drilling when context, composition, or local state is cleaner.
7. Avoid global state for local UI behavior.
8. Keep state close to where it is used.
9. Memoize expensive calculations only when there is a reason.
10. Avoid premature optimization that makes code harder to understand.
11. Clean up effects, listeners, observers, timers, and subscriptions.
12. Avoid conflicting CSS specificity.
13. Do not mix too many layout systems in one component unless the composition requires it.
14. Use semantic HTML.
15. Prefer readable implementation over clever implementation.

When modifying an existing codebase, follow its conventions unless they are clearly harmful.

Do not introduce a new dependency for a small problem that can be solved cleanly with existing tools.

## Tailwind guidance

When using Tailwind:

1. Prefer custom theme tokens for repeated values.
2. Avoid filling JSX with random one-off arbitrary values.
3. Use arbitrary values only for deliberate optical decisions.
4. Extract repeated class patterns into components or utilities.
5. Keep responsive classes intentional.
6. Avoid overusing `backdrop-blur`, `shadow-2xl`, and giant blur backgrounds.
7. Use `focus-visible` states.
8. Use `motion-safe` and `motion-reduce` variants when possible.
9. Group classes logically: layout, spacing, color, typography, effects, states.
10. Remove unused classes and dead variants.

## Motion design

Motion is not decoration. Motion explains hierarchy, spatial relationships, cause and effect, physical quality, and emotional tone.

Do not animate everything. One choreographed sequence is more premium than twenty unrelated fade-ins.

### Motion choreography

For a hero section, prefer this sequence:

1. Ambient atmosphere appears first.
2. Main visual, product object, or signature element enters.
3. Headline resolves.
4. Supporting copy follows.
5. Primary CTA enters.
6. Secondary details settle last.

Avoid making all elements animate with the same delay, distance, and easing.

Good stagger ranges:

```ts
const staggerFast = 0.035
const staggerNormal = 0.055
const staggerSlow = 0.085
```

Use `staggerNormal` as the default. Use `staggerFast` for small UI clusters and `staggerSlow` for editorial or cinematic reveals.

### Motion tokens

Use springs for physical UI and tweens for optical changes.

Use springs for cards, buttons, floating panels, drawers, navigation, toggles, hover states, tap states, and gesture-driven objects.

Use tweens for opacity, color, blur, background gradients, text masks, ambient light, SVG strokes, and decorative atmosphere.

Use a small token system:

```ts
export const motionTokens = {
  easeSoft: [0.16, 1, 0.3, 1],
  easeOut: [0.22, 1, 0.36, 1],
  easeInOut: [0.65, 0, 0.35, 1],

  springSoft: {
    type: "spring",
    stiffness: 90,
    damping: 24,
    mass: 0.9
  },

  springSnappy: {
    type: "spring",
    stiffness: 260,
    damping: 28,
    mass: 0.8
  },

  springHeavy: {
    type: "spring",
    stiffness: 120,
    damping: 32,
    mass: 1.4
  },

  springPlayful: {
    type: "spring",
    stiffness: 180,
    damping: 16,
    mass: 0.9
  },

  springFrictionless: {
    type: "spring",
    stiffness: 70,
    damping: 20,
    mass: 1.25
  },

  springGlide: {
    type: "spring",
    stiffness: 55,
    damping: 18,
    mass: 1.6
  },

  durationFast: 0.18,
  durationNormal: 0.32,
  durationSlow: 0.56,
  durationCinematic: 0.9
}
```

Use `springSoft` for calm premium motion.

Use `springSnappy` for buttons, chips, command menus, tabs, and small responses.

Use `springHeavy` for large panels, modals, and product mockups.

Use `springPlayful` sparingly when the brand needs charm.

Use `springFrictionless` for premium gliding motion.

Use `springGlide` for larger objects that should move slowly and land gradually.

### Frictionless spring motion

Frictionless motion should feel like glass sliding across a polished surface and settling into place.

Use it for:

1. Premium product motion.
2. Apple-like physical polish.
3. iOS or visionOS-inspired transitions.
4. Floating panels.
5. Large hero objects.
6. Modal entrances.
7. Product mockups.
8. Calm luxury interactions.

It should have effortless acceleration, smooth travel, no rubber-band bounce, no sudden snap, and a graceful landing.

Example:

```tsx
<motion.div
  initial={{ opacity: 0, y: 28, scale: 0.98 }}
  animate={{ opacity: 1, y: 0, scale: 1 }}
  transition={motionTokens.springFrictionless}
/>
```

If it overshoots, increase damping or reduce stiffness. If it feels too slow, increase stiffness slightly before reducing mass.

Small controls should remain responsive. Large objects can glide. User-triggered actions should never feel delayed.

### Motion distance

Movement distance must match element size and importance.

Recommended ranges:

1. Text reveal: 8px to 18px.
2. Button reveal: 8px to 14px.
3. Card reveal: 16px to 32px.
4. Hero visual reveal: 24px to 60px.
5. Section reveal: 24px to 40px.
6. Hover lift: 2px to 6px.
7. Press scale: 0.97 to 0.99.
8. Background atmosphere movement: 10px to 30px over a long duration.

Never make every element slide from 50px or 80px away.

### Reduced motion

Always respect reduced motion.

When reduced motion is preferred:

1. Remove large translations.
2. Remove parallax.
3. Remove looping motion.
4. Keep opacity changes short and simple.
5. Preserve state changes without drama.

Reduced motion should still feel designed.

## Performance

Visual polish should not make the interface slow.

Rules:

1. Lazy load heavy components where appropriate.
2. Optimize images and use correct sizes.
3. Prefer modern image formats when supported.
4. Avoid unnecessary blur filters and huge shadows.
5. Prefer `transform` and `opacity` for animation.
6. Avoid animating `width`, `height`, `top`, `left`, and layout-heavy properties when transform can work.
7. Avoid infinite animations unless subtle and meaningful.
8. Do not animate huge DOM trees.
9. Avoid unnecessary rerenders.
10. Use virtualization for very long lists.
11. Defer non-critical work.
12. Keep initial bundle size in mind.
13. Avoid adding large libraries for small effects.
14. Test on lower-end devices mentally, not only a high-end machine.

Smooth design is not just about easing. It is also about keeping the browser comfortable.

## Accessibility floor

Do not announce accessibility as a feature. Build it as a baseline.

Minimum requirements:

1. Responsive down to mobile.
2. Visible keyboard focus.
3. Sufficient color contrast.
4. Semantic landmarks.
5. Buttons are buttons.
6. Links are links.
7. Form labels are real labels.
8. Inputs have accessible names.
9. Dialogs trap focus correctly.
10. Menus are keyboard usable.
11. Reduced motion is respected.
12. Decorative images are hidden from assistive tech.
13. Meaningful images have useful alt text.
14. Touch targets are comfortable.
15. No critical information exists only in color, animation, or hover.
16. Error messages say what happened and how to fix it.
17. Loading states and empty states are understandable.

Accessibility should not flatten the design. It should make the design more deliberate.

## Writing in the interface

Words are design material.

Write from the user's side of the screen. Name things by what people control and recognize, not by how the system is built.

Use active voice. A control should say exactly what happens when used: “Save changes,” not “Submit.”

An action should keep the same name through the whole flow. A button that says “Publish” should produce feedback that says “Published.”

Errors should be specific and useful. Empty states should guide the next action.

Avoid vague product language. Prefer concrete, subject-specific copy.

## Implementation standards

Make the design system visible in the code.

Prefer:

1. CSS variables for color, radius, spacing, and shadows.
2. Reusable motion tokens.
3. Component-level variants.
4. Responsive layout from the beginning.
5. Semantic HTML.
6. Keyboard-visible focus states.
7. Reduced-motion handling.
8. Real content.
9. Clean class organization.
10. No conflicting specificity.

Be careful with broad CSS selectors like `.section`, `.card`, `.cta`, `button`, or `a`. They can silently override component styles.

Avoid combining absolute positioning, grid, flex, transforms, and negative margins in one component unless the composition genuinely requires it.

## Self-critique before coding

Before writing code, review the plan:

1. Does this belong to this exact subject?
2. Could the same plan be used for five other startups?
3. Is the hero a thesis or just a layout?
4. Is typography doing identity work?
5. Is motion choreographed or scattered?
6. Are components chosen because the content needs them?
7. Is the signature element memorable and justified?
8. Is there one bold idea, or too many effects?
9. Does the page still work with reduced motion?
10. Is the implementation likely to remain maintainable?
11. Is mobile considered from the start?
12. Are performance risks controlled?

If any part reads as generic, revise it before coding. Say briefly what changed and why.

## Final quality checklist

Before finishing, verify:

1. Subject, audience, and page job are clear.
2. Hero has one dominant focal point.
3. Visual direction is specific to the brief.
4. Palette has named tokens and emotional logic.
5. Typography has deliberate roles.
6. Spacing follows a system.
7. Layout works on mobile and desktop.
8. Motion has choreography.
9. Springs and easings are chosen by purpose.
10. Reduced motion is respected.
11. Components are not generic by default.
12. Reusable primitives are edited at the root level when appropriate.
13. Existing UI language is preserved unless a redesign was requested.
14. Cards are used only when appropriate.
15. Buttons have clear hierarchy.
16. Icons are not filler.
17. Copy is specific and useful.
18. The design has one memorable signature element.
19. Reference images are replicated accurately when provided.
20. Generated assets support the layout instead of replacing it.
21. Focus states exist.
22. Contrast is readable.
23. Code avoids unnecessary duplication.
24. Components are maintainable.
25. Heavy visuals are optimized.
26. One unnecessary decorative accessory has been removed.
27. The final result feels like a brand system, not a template.

## Restraint rule

Before shipping, remove one decorative effect, reduce one oversized shadow, tighten one spacing inconsistency, and make one piece of copy more specific.

Not taking a risk can be a risk, but taking five risks at once usually creates noise.

The strongest UI has a clear idea, disciplined execution, and no desperate decorations.
