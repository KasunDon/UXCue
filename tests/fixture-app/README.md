# @uxcue/fixture-app

Deterministic defect app used as the test target for selector generation,
screenshot cropping, route/page grouping, and the Playwright e2e/smoke suite.

Built first in **Phase 2** (before Epic B/C stories) so every later story has a
test target. Routes and deliberate defects are specified in docs/07
("Test App Fixture"): `/dashboard`, `/settings/billing`, `/settings/profile`,
`/responsive`, with a stable `data-testid` button, a spacing bug, responsive nav
overlap, low-contrast copy, a generated-looking id, and a duplicate class list.
