"use client";

import { LazyMotion, MotionConfig, domMax } from "framer-motion";

/**
 * Wraps the app once in root layout so animation config lives in one place.
 *
 * `strict` makes `motion.*` throw — every animated component must use `m.*`.
 *
 * Features are loaded SYNCHRONOUSLY on purpose. The documented win here is to
 * pass a dynamic import so the feature bundle code-splits, but on this stack
 * (framer-motion 12.5 + React 19 + Next 15) that path leaves components frozen
 * in their `initial` state: the import resolves and reports all ten features,
 * yet elements with `initial={{ opacity: 0 }}` never animate and stay
 * invisible. Verified broken in both `next dev` and a production `next start`.
 * Do not "optimise" this back into a dynamic import without re-testing that an
 * `initial={{ opacity: 0 }}` element actually reaches opacity 1.
 *
 * `domMax` rather than `domAnimation` because the dashboard uses layout
 * animations, which only ship in domMax.
 *
 * `reducedMotion="user"` makes transform and layout animations respect the OS
 * "Reduce motion" setting. Opacity and colour still animate.
 */
export function MotionProvider({ children }: { children: React.ReactNode }) {
  return (
    <LazyMotion features={domMax} strict>
      <MotionConfig reducedMotion="user">{children}</MotionConfig>
    </LazyMotion>
  );
}
