# QR Check-in

Promax Event Platform · QR + door ops foundation

---

## Live

1. When a committee user assigns a seat, a unique `qr_token` is generated (DB default).
2. QR content prepared as a URL: `{origin}/seat?t={qr_token}`.
3. `/seat` resolves the token server-side and shows table, seat, zone, and floor plan URL if set.
4. `/dashboard/check-in` supports search by name / reference / token, Mark Arrived, Undo, and steward CSV export.

## Not yet live

- Native camera QR scanner in-browser (placeholder documented in UI)
- Automatic seating/QR confirmation email send (draft template only)

## Payload rules

| Include in QR | Do not put in QR |
|---------------|------------------|
| Opaque secure token | Email, phone, full guest list |
| Link to seat lookup | Internal notes |

Resolved presentation may show guest name, ticket preference, table, seat, check-in status after server lookup.

## Feature flag

`QR_CHECKIN_ENABLED` — default true. When false, check-in page shows a disabled banner.
