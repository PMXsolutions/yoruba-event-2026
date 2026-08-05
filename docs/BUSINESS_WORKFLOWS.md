# Business Workflows

Promax Event Platform · Yoruba Day Canberra 2026

These workflows align product behaviour with committee operations. Stages marked **future** are documented for planning and must not be invented as live pricing or payment rules.

---

## Attendee (Register Interest → event day)

| Stage | Status |
|-------|--------|
| Register Interest (public) | **Live** |
| New | **Live** (default CRM status) |
| Contacted | **Live** |
| Ticket Invited | Future (requires approved ticketing) |
| Paid | Future (no payment rules in this release) |
| Confirmed | **Live** (committee status — not a paid ticket) |
| Seat Assigned | **Live** (Seating MVP) |
| QR Generated | **Live** (opaque token on seat assignment) |
| Checked In | **Live** (check-in foundation) |
| Attended | Future label / reporting |
| Thank You Sent | Future template only |

**Public rule:** Register Interest is **not** a ticket purchase and does not require approval before the confirmation email.

Messaging: *“Register your interest to receive priority updates when ticketing, sponsorship packages and the full programme are announced.”*

---

## Sponsor

Prospect → Contacted → Interested → Proposal Sent → Negotiating → Confirmed → Benefits Delivered → Post Event Report

**Live now:** public sponsor enquiry (expression of interest) + Sponsor CRM statuses already in the app.  
**Not live:** promised packages, amounts, or benefits until committee approval.

---

## Volunteer

Interest → Screened → Assigned → Briefed → Confirmed → Checked In → Completed

**Live now:** public volunteer interest + Volunteer management.  
**Not live:** confirmed roles without committee screening.

---

## Committee task

Created → Assigned → In Progress → Blocked → Completed → Reviewed

Supported by the Tasks board.

---

## Programme

Draft → Owner Assigned → Performer Confirmed → Time Allocated → Approved → Published

Supported by Programme management. Do not invent confirmed performers or exact times on the public site.

---

## Communication

Draft → Review → Approved → Scheduled → Sent → Logged

Email confirmation for Register Interest / committee guests is live when SMTP/Resend is configured. Other templates exist as drafts only.
