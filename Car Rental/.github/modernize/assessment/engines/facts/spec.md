# Enterprise Car Rental Feature Specification

## Scope Baseline

The system supports public vehicle discovery, customer booking and history, owner fleet and bidding, agency booking/fleet operations, administrator governance, profile management, JWT authentication, and concurrent operations. This scope also includes multiple authenticated accounts in one browser session with explicit active-account switching.

## User Scenarios & Testing

### P1: Multi-account browser session

**Given** one browser session has an active account, **when** a second account signs in through Add account, **then** both JWT sessions remain isolated and the second account becomes active.

**Given** multiple accounts are stored, **when** the user selects another account, **then** the UI, route authorization, API token, and profile context switch together without logging out the other account.

### P1: Safe booking

**Given** two customers request the same vehicle and overlapping dates concurrently, **when** both requests reach the API, **then** at most one booking is accepted and the other receives a clear conflict response.

### P1: Role governance

**Given** a customer, owner, agency, or administrator account, **when** it accesses a protected resource outside its role, **then** the API denies the request and the client preserves the valid session.

### P2: Profile and fleet management

**Given** valid profile or vehicle data, **when** the user saves it, **then** the data persists and the current account identity remains unchanged.

## Functional Requirements

- **REQ-001:** The system shall store each authenticated browser account under an isolated account key and shall never use one account's token for another account's API request.
- **REQ-002:** The system shall allow an authenticated user to add another account without first signing out.
- **REQ-003:** The system shall provide an account switch operation that updates active identity, dashboard route, authorization token, and visible profile atomically from the user's perspective.
- **REQ-004:** Signing out shall remove only the active account session and shall not delete other stored account sessions.
- **REQ-005:** Expired or unauthorized active sessions shall be removed without corrupting other stored sessions.
- **REQ-006:** The system shall validate booking dates, ownership, availability, overlap, and concurrent state transitions.
- **REQ-007:** The system shall return actionable errors for validation, authorization, conflict, and unavailable-service conditions.
- **REQ-008:** Role-specific dashboards shall expose only permitted operations and shall reject unauthorized API calls server-side.
- **REQ-009:** Profile updates shall preserve the authenticated user id, email, role, and active account key.
- **REQ-010:** Vehicle, bid, booking, and profile mutations shall refresh or update visible state without stale responses overwriting newer state.
- **REQ-011:** The API shall maintain consistent request and response DTO contracts for authentication, profiles, vehicles, bids, bookings, and administration.
- **REQ-012:** The system shall expose enough health, logging, and conflict information for operators to diagnose failed user operations.

## Non-Functional Requirements

- **REQ-013:** The system shall support at least four stored accounts in one browser session without token cross-contamination.
- **REQ-014:** Concurrent booking decisions shall be serialized per vehicle and conflicting writes shall be rejected deterministically.
- **REQ-015:** Protected requests shall fail closed when a token is missing, invalid, expired, or associated with insufficient authority.
- **REQ-016:** User-visible failures shall be rendered inline or as an accessible alert and shall not silently redirect to login when the session is still valid.
- **REQ-017:** API operations shall use bounded client timeouts and production deployments shall terminate TLS at the ingress or application boundary.

## Key Entities

User, Customer, Owner, Agency, Car, CarImage, Booking, Bid, Address, JWT account session, and active browser account.

## Assumptions

- One browser profile represents one trusted operator; stored account sessions are not a substitute for device-level security.
- The backend remains stateless and JWT-based; refresh tokens and server-side session revocation are future enterprise hardening items.
- Production hosting will provide HTTPS, centralized logs, rate limiting, and secret management.
