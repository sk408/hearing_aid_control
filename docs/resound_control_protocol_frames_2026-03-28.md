# ReSound Control Protocol Frames - 2026-03-28

This document isolates the command/notify wire model used by ReSound GN control paths in the current static decode.

## Source References

- `docs/deep_extraction/resound_phase2_static.md`
- `artifacts/decompiled/resound_1.43.1/ReSound.App.HI/ReSound.App.HI.decompiled.cs`

## 1) Transport Characteristics

- Command characteristic: `1959A468-3234-4C18-9E78-8DAF8D9DBF61`
- Notify characteristic: `8B51A2CA-5BED-418B-B54B-22FE666AADD2`
- Version: `97C1C193-EA53-4312-9BD9-E52207D5E03D`
- Security capability: `12257119-DDCB-4A12-9A08-1CD4DF7921BB`
- Trusted-app challenge: `ADD69BFC-EDC7-40A4-BA5E-5F0107C3B3AC`

## 2) Command Opcodes (Confirmed)

| Opcode | Meaning |
|---:|---|
| `0x01` | set notify vector |
| `0x02` | get notify vector |
| `0x03` | write handle |
| `0x04` | read handles |
| `0x05` | read blob |
| `0x06` | discover |

## 3) Notify Event IDs (Confirmed)

| Event ID | Meaning |
|---:|---|
| `0x01` | response accepted |
| `0x02` | notification bitfield |
| `0x03` | handle readout |
| `0x04` | handle notification |
| `0x05` | handle blob readout |
| `0x06` | discover response |
| `0x07` | discover final response |
| `0x08` | error code |
| `0x09` | mic error code |

## 4) Confirmed Frame Shapes

### Set notify vector

- Request:
  - `[0x01, <16-byte-notification-bitvector>]`
  - Length = 17

### Discover

- Request:
  - `[0x06]`

### Handle write

- Request:
  - `[0x03, handleLowByte, payload...]`

### Handle read (single)

- Request:
  - `[0x04, handleLowByte]`

### Handle read (batch)

- Request:
  - `[0x04, handle1, handle2, ...]`

### Blob read

- Initial request:
  - `[0x05, handleLowByte, 0x00, 0x00]`
- Continuation request:
  - `[0x05, handleLowByte, offsetLow, offsetHigh]`

## 5) Notify Payload Decoding

## 5.1 Wrapper

- First notify byte = event ID.
- Remaining bytes are generally decrypted before parsing.

## 5.2 Event `0x03` / `0x04` payload tuples

- Repeating tuple format:
  - `[handle, length, valueBytes...]`
- Parsing walks until payload end.

## 5.3 Event `0x05` blob payload

- Blob chunk bytes carried in event payload.
- App accumulates until expected characteristic size.

## 5.4 Event `0x08` error payload

- Repeating triples:
  - `[commandOpcode, handle, errorCode]`

## 6) Discover Response Record Layout

For events `0x06` and final `0x07`:

- Repeating records:
  - `[handle(1), size(1), ops(1), uuid(16)]`

`ops` bit decode:

- bit 0: read
- bit 1: write
- bit 2: notify

## 7) Trust/Security Bootstrap Write

Static evidence indicates trust setup includes:

- Write to security capability:
  - `[4, 0, 0, 0, 0]`

## 8) Operation Mapping Examples (Handle-Level)

From static handle map examples in Dooku3 profile notes:

- Program select (`handle 0x08`):
  - frame: `[0x03, 0x08, programIndex]`
- Mic attenuation (`handle 0x05`):
  - frame: `[0x03, 0x05, currentProgram, attenuation]` (2-byte mode)
- Stream attenuation (`handle 0x06`):
  - frame: `[0x03, 0x06, currentProgram, attenuation]` (2-byte mode)
- Stream status read (`handle 0x15`):
  - request `[0x04, 0x15]`, expect event `0x03` tuple

## 9) Unresolved Items to Close with Dynamic Capture

- Full encryption envelope details (IV/nonces/session lifecycle).
- Exact notify vector bit assignments to characteristic domains.
- Per-handle payload schema for all TBD characteristics.
- Event timing/ordering under packet loss and reconnect.

