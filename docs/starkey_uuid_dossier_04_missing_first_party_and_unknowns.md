# Starkey Hearing Aid UUID Dossier 04: Missing First-Party Coverage and Unknowns

Date: 2026-03-28  
Scope: unresolved Starkey UUID semantics and likely missing first-party channels.

## 1) High-priority unknowns

| UUID/Area | Current state | Gap |
|---|---|---|
| `d0b6dc42-03c8-457a-a347-ade8d1c4e98d` | known assistant-related characteristic | semantic payload unresolved |
| `84f9e90a-884a-4bb3-85f2-e77399189874` | known assistant-related characteristic | semantic payload unresolved |
| Lower transport under `SendPacketResult` | app-layer command known | raw packet wrapper/checksum/framing unresolved |
| HA config service feature binding | service UUIDs known | mapping from feature bits to concrete operations incomplete |

## 2) Potentially missing first-party channels

- Device-generation-specific optional characteristics may be present only on some firmware families.
- Some accessory or assistant operations may be multiplexed through channels that are currently labeled unknown.
- Additional control-object IDs beyond documented set may exist in newer versions.

## 3) Closure plan

1. Perform runtime capture for each major feature:
   - volume/program/mute/stream start-stop,
   - tinnitus adjustments,
   - accessory and assistant feature toggles.
2. Decode wrapper bytes beneath app-layer Piccolo request frames.
3. Build object-id to UX-control map with response payload exemplars.

## 4) Risk notes

- Unknown channels can include non-user-safe operations; avoid exploratory writes without bounded test context.
- Assuming app-layer framing equals wire framing can break interoperability and error handling.

## 5) Completion criteria

- Unknown assistant UUIDs are semantically classified.
- Transport wrapper fields are documented with at least one request/response pair per core operation.
- Feature-support bitfields are mapped to actionable operation capability flags.
