---
name: country-state-city subpath imports
description: Why importing country-state-city from its root crashes iOS Safari, and what to import instead.
---

The `country-state-city` npm package's root entry (`index.js`) re-exports `Country`, `State`, and `City`. The `City` module statically imports `./assets/city.json`, which is ~7.7 MB. On iOS Safari / iOS WebView this triggers a "Maximum call stack size exceeded" runtime error during module init (the JSON parse + the package's `convertArrayToObject` spread blow the JS stack before any UI renders).

**Rule:** never `import { Country, State, City } from 'country-state-city'`. Import from sub-paths instead:

```ts
import Country from 'country-state-city/lib/country';
import State from 'country-state-city/lib/state';
```

**Why:** sub-path imports only pull `country.json` (~94 KB) and `state.json` (~542 KB), which iOS handles fine. Pulling the root drags `city.json` (~7.7 MB) into the bundle even if `City` is never called, because the re-export is unconditional and the package is `sideEffects: false` (tree-shaking does NOT drop a statically-imported JSON asset on every bundler).

**How to apply:** if a feature needs city pickers, source them from a different mechanism (server endpoint, on-demand fetch of a smaller dataset, or free-text input with autocomplete) — do not re-introduce the root import. The marketplace address dialogs deliberately fall back to a plain text city input when the city options array is empty.
