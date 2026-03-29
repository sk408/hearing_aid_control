# ReSound Operation Corpus (Static) - 2026-03-28

Scope: implementation-oriented static corpus for core user operations on GN handle protocol.

## Evidence anchors

- `docs/resound_control_protocol_frames_2026-03-28.md`
- `docs/uuid_resound_dossier_2026-03-28.md`
- `docs/deep_extraction/resound_phase2_static.md`

## Transport baseline (all operations)

- command characteristic: `1959a468-3234-4c18-9e78-8daf8d9dbf61`
- notify characteristic: `8b51a2ca-5bed-418b-b54b-22fe666aadd2`
- write-handle request form: `[0x03, handleLow, payload...]`
- read-handle request form: `[0x04, handleLow]`
- notify readout events: `0x03` and `0x04` with repeated tuples `[handle, len, valueBytes...]`

## Operation sheets

### 1) Program select

- operation: set active program
- representative handle: `0x08` (`GNCurrentActiveProgram`)
- request template: `[0x03, 0x08, programIndex]`
- expected notify sequence:
  - `0x01` response accepted (common),
  - then `0x03`/`0x04` tuple including handle `0x08` and new value.
- parsed state:
  - active program index byte.
- confidence: `partial` (handle example confirmed in static profile resources, final cross-family mapping needs runtime validation).

### 2) Volume (microphone attenuation)

- operation: set hearing-aid mic attenuation/volume
- representative handle: `0x05` (`GNMicAttenuation`)
- request template: `[0x03, 0x05, currentProgram, attenuation]`
- expected notify sequence:
  - `0x01` accepted,
  - `0x03`/`0x04` tuple for handle `0x05`.
- parsed state:
  - attenuation byte in handle payload, typically paired with program context.
- confidence: `partial`.

### 3) Mute / unmute

- operation: mute/unmute on mic attenuation path
- representative handle: `0x05` (`GNMicAttenuation`)
- request template:
  - mute candidate: `[0x03, 0x05, currentProgram, 0x00]`
  - unmute candidate: `[0x03, 0x05, currentProgram, attenuationNonZero]`
- expected notify sequence:
  - `0x01` accepted,
  - `0x03`/`0x04` tuple for handle `0x05`.
- parsed state:
  - attenuation at mute threshold and subsequent restored attenuation.
- confidence: `partial` (static evidence indicates attenuation-based mute semantics; final behavior must be runtime-confirmed per family).

### 4) Stream control/state

- operation: stream-related state read and stream attenuation writes
- representative handles:
  - stream attenuation `0x06` (`GNStreamAttenuation`) write path,
  - stream status `0x15` (`GNStreamStatus`) read path.
- request templates:
  - set stream attenuation: `[0x03, 0x06, currentProgram, attenuation]`
  - read stream status: `[0x04, 0x15]`
- expected notify sequence:
  - writes: `0x01` accepted then `0x03`/`0x04` tuple update,
  - reads: `0x03` tuple carrying status bytes for `0x15`.
- parsed state:
  - stream attenuation byte(s),
  - stream status tuple payload bytes.
- confidence: `partial`.

## Runtime-only residuals (explicit blockers)

- definitive handle mapping for all device profile families (Dooku/Palpatine/etc.).
- exact byte-domain semantics for status/type fields across firmware generations.
- encrypted session edge behavior (retry/order/error handling in live traffic).

## Implementation guidance (static-safe)

- model ReSound operations as `handle-based commands`, not UUID-per-operation writes.
- keep each operation capability tagged as `partial` unless runtime trace confirms family-specific behavior.
- expose blocked/unknown fields explicitly in adapter responses instead of silent fallback.
