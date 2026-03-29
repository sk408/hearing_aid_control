# Rexton Hearing Aid UUID Dossier 02: Runtime Capture Matrix

Date: 2026-03-28  
Scope: expected runtime TX/RX mapping for core Rexton operations based on static decode.

## 1) Matrix legend

- `TX`: outgoing write frame.
- `RX`: expected response/notify frame.
- `status`: `confirmed`, `expected`, `unknown`.

## 2) Action-to-frame matrix

| Action | TX UUID | TX bytes | RX UUID | RX expectation | status |
|---|---|---|---|---|---|
| Set volume | `8b8276e8...` | `[0x04, volume]` | `8b8225e0...` or control state path | active volume/program state update | confirmed/expected |
| Set program | `8b8276e8...` | `[0x05, programId]` | `8b8225e0...` | active program reflects target | confirmed/expected |
| Set sound balance | `8b8276e8...` | `[0x06, balance]` | state notify path | value update | confirmed/expected |
| Set tinnitus volume | `8b8276e8...` | `[0x07, tinnitus]` | state notify path | value update | confirmed/expected |
| Set CROS volume | `8b8276e8...` | `[0x08, cros]` | state notify path | value update | confirmed/expected |
| Set TV stream volume | `8b8276e8...` | `[0x09, 15-slider]` | state notify path | mapped value update | confirmed/expected |
| Legacy OBLE stream volume | `50632720...` | nonzero `[(slider-1),0x01]`, zero `[0x00,0x00]` | same char/state callback | reflects slider state | confirmed/expected |

## 3) Programming session matrix

| Stage | TX UUID | TX bytes | RX UUID | Expected result | status |
|---|---|---|---|---|---|
| VersionInfo | `c8f75466...` | `[0x0C]` | `c8f70447...` | response byte0 echo+success, byte1 version nibble data | confirmed |
| StartProgramming | `c8f75466...` | `[0x00, randomId[6]]` | `c8f70447...` | command accepted/session open | confirmed |
| StartHighPerformance | `c8f75466...` | `[0x04]` | `c8f70447...` | high-performance enabled or error code | confirmed |
| ConnPriority High | `c8f75466...` | `[0x0A, 0x00]` | `c8f70447...` | accepted/rejected with code | confirmed |
| ConnParam update | `c8f75466...` | `[0x08, ...]` | `c8f70447...` | accepted/rejected with code | confirmed |
| Data request | `c8f72804...` | chunked raw bytes | `c8f72fef...` | chunk accumulation to expected response length | confirmed |
| StopHighPerformance | `c8f75466...` | `[0x06]` | `c8f70447...` | disabled/ack | confirmed |
| StopProgramming | `c8f75466...` | `[0x02]` | `c8f70447...` | programming session closed | confirmed |

## 4) FAPI runtime matrix

| Action | TX UUID | RX UUID | Expectation | status |
|---|---|---|---|---|
| Start FAPI updates | subscribe `c8f7690c...` | `c8f7690c...` | async response stream enabled | confirmed |
| Send FAPI request | `c8f723da...` raw serializer bytes | `c8f7690c...` | decoded by FAPI core callback | confirmed transport |
| Stop FAPI updates | unsubscribe `c8f7690c...` | n/a | response stream stopped | confirmed |

## 5) Runtime unknowns to resolve in capture

- Concrete payload schemas for many FAPI feature calls.
- Which alias UUIDs (`c8f79c9a...`, `c8f73dc3...`, `c8f7a8e4...`, `c8f7a68a...`) are active per model.
- Full state-notification payload layouts for `8b8225e0...` and other terminal info channels.

## 6) Capture reminders

- Capture with one user action at a time to avoid interleaving ambiguity.
- Log connection phase separately from control phase.
- Store device model, firmware, and app version with each capture trace for later alias reconciliation.
