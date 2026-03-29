# Rexton Hearing Aid UUID Dossier 04: Missing First-Party Coverage and Unknowns

Date: 2026-03-28  
Scope: unresolved Rexton UUID semantics and likely missing first-party coverage.

## 1) High-priority unknowns

| Area | UUID(s) | Gap |
|---|---|---|
| Terminal state payloads | `8b8225e0...`, `8b823656...`, additional `8b82` aliases | exact field layout and state transitions not fully decoded |
| Protocol choice/readiness semantics | `8b82cd2d...`, `8b82a76f...`, `8b82f3b9...` | enum/flag definitions incomplete |
| FAPI payload schema | `c8f723da...` / `c8f7690c...` | transport is known, inner binary schema unresolved |
| Alias routing | multiple `c8f7` alternates | model/version-specific selection map not complete |

## 2) Potential missing first-party channels

- Additional generation-specific UUID aliases likely exist beyond those currently extracted.
- Feature-specific channels may be dynamically enabled only on certain devices and therefore absent from baseline static traces.
- Some advanced-control operations may be encapsulated in FAPI request payloads with no explicit per-feature characteristic IDs.

## 3) Required closure experiments

1. Capture per-model runtime characteristic discovery list and compare against static registry.
2. Run action-triggered captures for:
   - volume/program/balance/tinnitus/CROS/TV stream controls,
   - programming open/close cycle,
   - selected FAPI feature requests.
3. Build alias resolution map:
   - active UUID set by model + firmware + app version.

## 4) Risk notes

- Programming/FAPI write paths are safety-sensitive and should not be treated as generic user controls.
- Unknown aliases can cause false negatives in compatibility checks if UUID matching is too strict.
- Apparent feature parity with Philips via shared POLARIS UUIDs does not remove need for Rexton-specific validation on `8b82/c8f7` channels.

## 5) Completion criteria

Mark unknowns closed when:
- each major user control has a validated TX/RX trace on at least one current-generation Rexton device,
- alias selection is mapped for at least two distinct device families,
- FAPI transport is documented with at least a minimal decoded request/response exemplar set.
