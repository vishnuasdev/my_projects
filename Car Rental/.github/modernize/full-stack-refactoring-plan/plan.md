# Full-Stack Refactoring Plan: Multi-Tenant Car Rental and Fleet Management

**Date**: 2026-09-12  
**Spec**: `.github/modernize/assessment/engines/facts/spec.md` plus the requested security, dashboard, search, fleet-authorization, and filter improvements.

## Summary

Refactor the Spring Boot and React application into a secure, role-aware, multi-tenant car-rental platform. The work is organized around four independently testable outcomes:

1. A consistent responsive design system and dashboard navigation for Owner, Agency, Admin, Public, and Customer experiences.
2. A server-enforced tenant and ownership authorization model for user, agency, fleet, booking, bid, and audit operations.
3. A command-palette global search and fully searchable/filterable/paginated administrative data experience.
4. Correct reactive vehicle discovery filters with safe validation, indexed queries, and predictable empty/loading/error states.

The backend remains stateless JWT-based for this increment. Tenant ownership and permission grants are enforced server-side; frontend permission indicators are only UX affordances and never security controls.

## Technical Context

**Language/Version**: Java 21 / Spring Boot 4.1 / Spring Security 7.1; React 19 / React Router 6 / Axios / Create React App.  
**Primary Dependencies**: Spring Web, Spring Security, Spring Data JPA/Hibernate, MySQL, JJWT, React Testing Library.  
**Storage**: MySQL entities including `User`, `Customer`, `Owner`, `Agency`, `Car`, `Booking`, `Bid`, `Address`; new ownership grants, audit events, and search indexes.  
**Testing**: Maven package/test, React production build, Jest/React Testing Library, controller/service integration tests, and browser-level smoke tests.  
**Target Platform**: HTTPS production deployment with centralized logging, rate limiting, secret management, and an ingress/TLS boundary.  
**Performance Goals**: Paginated admin queries; indexed tenant/ownership/status/date fields; bounded search result sizes; no unbounded entity serialization.  
**Constraints**: Public registration cannot create administrators; all authorization must be enforced by the API; passwords and tokens must never be returned; existing account switching must remain isolated.

## Constitution Check

No repository constitution artifact was found. Until one is added, the following mandatory engineering gates apply:

- **Fail closed**: protected endpoints deny missing, invalid, expired, or insufficient JWT authority.
- **Tenant isolation**: every tenant-scoped query derives scope from the authenticated principal or an explicitly verified admin grant.
- **DTO boundary**: controllers do not return mutable JPA entities containing secrets, lazy relationships, or binary images.
- **Defense in depth**: frontend controls improve UX but do not replace backend authorization.
- **Observable failures**: validation, authorization, conflict, and infrastructure errors are returned as actionable structured responses.
- **No destructive ambiguity**: profile/fleet deletion requires explicit confirmation and an audit event.
- **Backward compatibility**: existing login, account switching, profile updates, booking conflict handling, and role routes remain covered.

## Applied Guidelines

- Spring Security: use method-level authorization for business ownership checks in addition to URL matchers.
- Spring Data JPA: use DTO projections/entity graphs for bounded reads; use database indexes and specifications for filter/search queries.
- JWT: validate signature, issuer/audience if configured, expiration, and authority claims; never trust client-provided tenant/user identifiers.
- REST API: use typed request/response DTOs, consistent error envelopes, pagination metadata, and HTTP 401/403/409/422 semantics.
- React: keep server state and filter state deterministic, abort stale requests, expose loading/error/empty states, and use accessible keyboard interactions.
- Security: normalize and validate email, phone, search terms, sort fields, enum filters, date ranges, pagination, and uploaded files.

## Implementation Steps

### Phase 1: Setup and Contract Baseline

#### Plan 1.1: Establish refactoring contracts and baseline evidence
- **Requirements**: REQ-007, REQ-008, REQ-011, REQ-012, REQ-015
- **Design inputs**: Existing feature specification; current controllers, services, repositories, `SecurityConfig`, `AdminView`, `axiosInstance`.
- **Description**: Inventory every protected endpoint and dashboard route; document current request/response shapes, role/tenant rules, error statuses, and known synchronization failures. Freeze the baseline with build, existing tests, and representative API/browser smoke tests before changing behavior.

#### Plan 1.2: Add shared validation, error, and observability conventions
- **Requirements**: REQ-007, REQ-011, REQ-012, REQ-016
- **Design inputs**: Current authentication/error handlers and monitoring service.
- **Description**: Define a single error envelope containing code, message, field errors, correlation id, and timestamp. Add request correlation logging, bounded timeouts, structured security events, and a safe frontend error adapter.

### Phase 2: Foundational Security and Tenant Boundaries

#### Plan 2.1: Model tenant ownership and delegated fleet permissions
- **Requirements**: REQ-006, REQ-008, REQ-011, REQ-015
- **Design inputs**: `User`, `Owner`, `Agency`, `Car`, `Address`, `CarService`, and current admin/agency/owner controllers.
- **Description**: Add explicit car ownership and agency-assignment relationships plus a permission-grant record with owner, grantee agency/user, scope, status, issued/expiry timestamps, and revocation metadata. Add unique constraints and indexes preventing duplicate active grants and ambiguous fleet ownership.

#### Plan 2.2: Centralize principal, tenant, and permission authorization
- **Requirements**: REQ-006, REQ-008, REQ-015, REQ-017
- **Design inputs**: `SecurityConfig`, JWT filter, `CustomUserDetailsService`, vehicle/fleet controllers.
- **Description**: Introduce authorization services that resolve the authenticated principal, verify active status, derive tenant scope, and check owner-or-valid-grant rules. Apply them to every vehicle create/update/delete, fleet assignment, bid, booking, agency, profile, and admin route. Remove trust in request-body owner/user ids.

#### Plan 2.3: Replace entity exposure with secure DTO contracts
- **Requirements**: REQ-007, REQ-009, REQ-011, REQ-015
- **Design inputs**: Existing entity-returning admin/profile/vehicle controllers.
- **Description**: Create typed request/response DTOs that omit passwords, JWT data, binary images, hidden relationships, and sensitive audit details. Add explicit field allowlists for admin edits and role-specific profile responses.

### Phase 3: P1 Fleet Authorization and Onboarding

#### Plan 3.1: Enforce owner/grant checks on fleet mutations
- **Requirements**: REQ-006, REQ-007, REQ-008, REQ-014, REQ-015
- **Design inputs**: Car registration, agency assignment, owner and agency services/controllers.
- **Description**: Make unauthorized add/assign/update/delete requests return 403; return 409 for conflicting ownership or active assignment; validate grant status and expiry transactionally; audit successful and rejected attempts.

#### Plan 3.2: Add frontend ownership-verification onboarding
- **Requirements**: REQ-007, REQ-008, REQ-010, REQ-016
- **Design inputs**: Vehicle modal, owner dashboard, agency dashboard, fleet API clients.
- **Description**: Show owner, tenant, grant status, expiry, and verification state before submission. Disable unauthorized actions, handle 401/403/409 inline, refresh fleet state after mutations, and avoid stale request overwrites.

### Phase 4: P1 Dashboard Navigation and Design System

#### Plan 4.1: Create a shared responsive dashboard shell
- **Requirements**: REQ-008, REQ-010, REQ-016
- **Design inputs**: `Navbar`, dashboard CSS, Owner/Agency/Admin views, profile routes.
- **Description**: Standardize navigation, spacing, typography, cards, tables, buttons, focus states, responsive breakpoints, mobile navigation, loading skeletons, empty states, and error banners. Preserve role-specific links and hide unauthorized operations.

#### Plan 4.2: Professionalize Owner and Agency dashboards
- **Requirements**: REQ-008, REQ-010, REQ-016
- **Design inputs**: Owner and Agency dashboard components and fleet/booking/bid APIs.
- **Description**: Rework visual hierarchy and operational cards for fleet utilization, pending approvals, bookings, bids, earnings, and recent activity. Add responsive tables/cards and clear primary actions without changing authorization semantics.

#### Plan 4.3: Expand Admin operations workspace
- **Requirements**: REQ-008, REQ-010, REQ-012, REQ-016
- **Design inputs**: `AdminView`, admin API, monitoring endpoints.
- **Description**: Add quick actions, role-aware profile management, paginated table views, status filters, activity summaries, notification acknowledgement, audit-log filters, and resilient refresh behavior.

### Phase 5: P1 Global Search and Admin Data Operations

#### Plan 5.1: Implement secure backend global search
- **Requirements**: REQ-007, REQ-008, REQ-011, REQ-012, REQ-015
- **Design inputs**: User/agency/car/booking/bid/audit entities and admin authorization.
- **Description**: Add an admin-only `/api/admin/search` endpoint with normalized query, type filters, tenant scope, date/status filters, sort allowlist, cursor/page pagination, bounded limits, and DTO result groups. Use indexed queries or specifications; reject unsafe sort/field names.

#### Plan 5.2: Implement Ctrl/Cmd+K command palette
- **Requirements**: REQ-008, REQ-010, REQ-016
- **Design inputs**: Shared navbar/layout and admin routes.
- **Description**: Add keyboard-accessible global search from every admin page, debounced/abortable requests, grouped results, keyboard navigation, direct route actions, permission-aware result rendering, and accessible no-result/loading/error states.

#### Plan 5.3: Add searchable/filterable/paginated admin tables
- **Requirements**: REQ-008, REQ-010, REQ-011, REQ-016
- **Design inputs**: User, agency, car, booking, bid, notification, and log table sections.
- **Description**: Move filtering and pagination to server-backed query parameters, preserve URL/table state, add column filters and date/status ranges, and refresh only the affected dataset after mutations.

### Phase 6: P1 Public and Customer Vehicle Discovery

#### Plan 6.1: Define validated vehicle filter contract
- **Requirements**: REQ-006, REQ-007, REQ-011, REQ-015, REQ-017
- **Design inputs**: Public vehicle APIs, car entity fields, booking availability queries.
- **Description**: Define typed filters for price range, vehicle type, fuel, transmission, seating, date interval, location, availability, page, and sort. Validate ranges and dates, normalize enums/location, cap page size, and return pagination metadata.

#### Plan 6.2: Implement indexed reactive filter queries
- **Requirements**: REQ-006, REQ-010, REQ-014, REQ-017
- **Design inputs**: Car repository/service and booking overlap rules.
- **Description**: Implement specifications or query methods with database indexes for common predicates; exclude unavailable/unauthorized records; apply overlap-safe availability checks; return stable results for empty and partial filters.

#### Plan 6.3: Repair responsive public/customer filter UX
- **Requirements**: REQ-007, REQ-010, REQ-016
- **Design inputs**: Public listing/customer discovery components and Axios service.
- **Description**: Bind every filter to one source of truth, debounce/cancel requests, preserve filters across pagination/navigation, add desktop sticky sidebar and mobile drawer, and render skeleton/empty/error states without resetting valid selections.

### Phase 7: Audit, Performance, and Production Hardening

#### Plan 7.1: Persist security and operational audit events
- **Requirements**: REQ-007, REQ-012, REQ-015
- **Design inputs**: Current `AdminMonitoringService`, security events, mutation services.
- **Description**: Replace volatile-only monitoring with a bounded/paginated audit-event table or durable event sink. Record authentication, authorization failures, grants, fleet mutations, profile changes, booking conflicts, and admin actions with actor/tenant/resource/correlation metadata.

#### Plan 7.2: Add indexes, rate limits, and production configuration
- **Requirements**: REQ-012, REQ-014, REQ-015, REQ-017
- **Design inputs**: MySQL schema, application configuration, deployment assumptions.
- **Description**: Add migration-managed indexes/constraints, endpoint rate limits for auth/search, request size/upload limits, CORS/HTTPS/security headers, secret-manager configuration, health/readiness endpoints, and safe production logging.

#### Plan 7.3: End-to-end verification and regression closure
- **Requirements**: REQ-001 through REQ-017
- **Design inputs**: All implementation steps and baseline evidence.
- **Description**: Run backend unit/integration/security tests, frontend tests/build, browser journeys for each role, concurrency tests for booking/fleet assignment, search/filter tests, and authorization matrix tests. Fix regressions before release.

## Project Structure

```text
Car Rental/
├── .github/modernize/full-stack-refactoring-plan/
│   ├── plan.md
│   └── checkpoints/
│       ├── spec-to-plan.yaml
│       └── plan-to-tasks.yaml
├── car_rental_service/src/main/java/com/example/car_rental_service/
│   ├── config/
│   ├── controller/
│   ├── model/dto/
│   ├── model/entity/
│   ├── repository/
│   ├── security/
│   └── service/
└── carrental_frontend/src/
    ├── components/
    ├── features/
    │   ├── admin/
    │   ├── auth/
    │   ├── dashboard/
    │   ├── fleet/
    │   └── vehicles/
    ├── layouts/
    ├── providers/
    ├── routes/
    └── services/
```

## Implementation Ticket Breakdown

### Phase 1 — Setup
- [ ] T001 [Plan:1.1] Capture backend Maven, frontend Jest/build, and role-based browser baselines; record current endpoint contracts in `.github/modernize/full-stack-refactoring-plan/baseline.md`.
- [ ] T002 [P] [Plan:1.1] Inventory protected routes and authorities in `car_rental_service/src/main/java/com/example/car_rental_service/config/SecurityConfig.java` and all controllers.
- [ ] T003 [P] [Plan:1.2] Define the shared API error envelope and correlation-id policy in `car_rental_service/src/main/java/com/example/car_rental_service/model/dto/`.
- [ ] T004 [P] [Plan:1.2] Add frontend error normalization and accessible alert mapping in `carrental_frontend/src/services/axiosInstance.js`.

### Phase 2 — Foundational
- [ ] T005 [Plan:2.1] Add ownership, agency assignment, and delegated permission entities/repositories under `car_rental_service/src/main/java/com/example/car_rental_service/model/entity/` and `repository/`, including unique constraints and indexes.
- [ ] T006 [Plan:2.1] Add database migration/schema verification for ownership and permission tables in the backend database migration location.
- [ ] T007 [P] [Plan:2.2] Implement principal/tenant resolution in `car_rental_service/src/main/java/com/example/car_rental_service/security/`.
- [ ] T008 [P] [Plan:2.2] Implement owner-or-active-grant authorization service in `car_rental_service/src/main/java/com/example/car_rental_service/service/`.
- [ ] T009 [Plan:2.2,2.3] Replace entity-returning admin/profile/vehicle endpoints with typed DTOs in `car_rental_service/src/main/java/com/example/car_rental_service/controller/` and `model/dto/`.
- [ ] T010 [Plan:1.2,2.3] Add centralized validation/error handling and safe DTO serialization in `car_rental_service/src/main/java/com/example/car_rental_service/config/` and `controller/`.

### Phase 3 — Fleet Authorization
- [ ] T011 [US1] [Plan:3.1] Enforce owner/grant checks in `car_rental_service/src/main/java/com/example/car_rental_service/controller/CarController.java` and fleet services before create/assignment/update/delete.
- [ ] T012 [US1] [Plan:3.1] Add transactional conflict handling and audit events for fleet authorization decisions in `car_rental_service/src/main/java/com/example/car_rental_service/service/`.
- [ ] T013 [US1] [P] [Plan:3.2] Add ownership/grant status DTOs and API methods in `carrental_frontend/src/features/fleet/api/` and onboarding components.
- [ ] T014 [US1] [Plan:3.2] Update `carrental_frontend/src/features/fleet/components/VehicleModal.js` to block unauthorized submissions and render inline 401/403/409 errors.

### Phase 4 — Dashboard UI
- [ ] T015 [US2] [P] [Plan:4.1] Create shared dashboard tokens, responsive shell, skeletons, empty states, and focus styles in `carrental_frontend/src/assets/` and `src/layouts/`.
- [ ] T016 [US2] [Plan:4.1,4.2] Refactor Owner dashboard navigation/cards/tables in `carrental_frontend/src/features/dashboard/OwnerView.js`.
- [ ] T017 [US2] [Plan:4.1,4.2] Refactor Agency dashboard metrics/fleet/earnings views in `carrental_frontend/src/features/dashboard/AgencyView.js`.
- [ ] T018 [US2] [Plan:4.1,4.3] Refactor Admin workspace sections, role-aware actions, and resilient refresh behavior in `carrental_frontend/src/features/dashboard/AdminView.js`.

### Phase 5 — Search and Admin Tables
- [ ] T019 [US3] [Plan:5.1] Add `AdminSearchController`, request/response DTOs, validated filters, and pagination in `car_rental_service/src/main/java/com/example/car_rental_service/controller/` and `model/dto/`.
- [ ] T020 [US3] [Plan:5.1] Implement indexed search specifications/projections for users, agencies, cars, bookings, bids, and audit events in `car_rental_service/src/main/java/com/example/car_rental_service/repository/`.
- [ ] T021 [US3] [Plan:5.2] Add command palette state, Ctrl/Cmd+K listener, debounced cancellation, grouped results, and keyboard navigation in `carrental_frontend/src/features/admin/`.
- [ ] T022 [US3] [Plan:5.3] Add server-backed query, filter, pagination, URL state, and mutation refresh behavior to `carrental_frontend/src/features/dashboard/AdminView.js`.

### Phase 6 — Discovery Filters
- [ ] T023 [US4] [Plan:6.1] Define validated vehicle filter request/response DTOs in `car_rental_service/src/main/java/com/example/car_rental_service/model/dto/`.
- [ ] T024 [US4] [Plan:6.2] Implement indexed, availability-aware car filtering in `car_rental_service/src/main/java/com/example/car_rental_service/repository/` and `service/`.
- [ ] T025 [US4] [Plan:6.3] Repair filter state, abort stale requests, and preserve pagination in public/customer vehicle listing components under `carrental_frontend/src/features/`.
- [ ] T026 [US4] [Plan:6.3] Add responsive sticky desktop filters and mobile filter drawer styling in `carrental_frontend/src/assets/`.

### Phase 7 — Hardening and Verification
- [ ] T027 [Plan:7.1] Add durable audit-event entity/repository/service and migrate monitoring reads in `car_rental_service/src/main/java/com/example/car_rental_service/service/AdminMonitoringService.java`.
- [ ] T028 [Plan:7.2] Add schema indexes, rate limits, request limits, security headers, HTTPS-aware configuration, and health/readiness checks in backend config/resources.
- [ ] T029 [P] [Plan:7.3] Add backend authorization matrix, fleet ownership, filter validation, search pagination, and booking conflict tests under `car_rental_service/src/test/`.
- [ ] T030 [P] [Plan:7.3] Add frontend tests for command palette, role dashboards, profile-linked editing, filter state, and unauthorized UI actions under `carrental_frontend/src/`.
- [ ] T031 [Plan:7.3] Execute browser journeys for admin search, owner onboarding, agency operations, customer filtering, and concurrent booking; fix all regressions before release.

## Testing Strategy

- **appType**: Mixed SPA and REST API.
- **Critical user journeys**:
  1. Admin searches users/agencies/cars/bookings with Ctrl/Cmd+K, opens a result, filters a table, and paginates.
  2. Owner adds an owned car successfully; an agency without an active grant receives 403 and cannot submit.
  3. Agency views authorized fleet and cannot access another tenant's fleet.
  4. Customer/public user applies combined vehicle filters on desktop and mobile without state reset.
  5. Two customers attempt an overlapping booking and exactly one succeeds.
- **primaryValidationStack**: Maven tests/integration tests, React Jest/RTL, browser automation with a real backend/database profile.
- **fallbackMatrix**:
  - `infra-tier`: MySQL/Testcontainers → configured local MySQL test database. Gap: reduced isolation if fallback is used.
  - `browser-tier`: Playwright/browser validation → React tests and API contract tests. Gap: reduced visual/navigation coverage.
- **Environment requirements**: Java 21, Maven, Node/npm, MySQL or Testcontainers/Docker, browser automation runtime, HTTPS-like proxy configuration for production checks.
- **knownGaps**: Durable audit-event retention and distributed rate limiting require deployment-specific validation; JWT refresh/revocation remains a future hardening phase unless added to scope.
- **Test data strategy**: Seed isolated tenants, owners, agencies, customers, grants, cars, bookings, and audit events per test; use unique emails/phones and clean up transactionally.
- **Acceptance criteria**: all listed journeys pass; unauthorized fleet assignment is denied server-side; filters produce correct non-empty and empty results; admin search is bounded/paginated; no password/token appears in responses or logs; all builds/tests pass.
- **Validation review expectations**: verify endpoint authorization with direct HTTP calls, inspect serialized DTOs, verify concurrent conflict behavior, test keyboard/mobile UI, and confirm stale refreshes cannot overwrite newer state.

## Requirement Mapping

| REQ ID | Description | Plan Items | Implementation Evidence |
|--------|-------------|------------|--------------------------|
| REQ-001 | Isolated stored browser accounts | Existing auth baseline; 1.1, 7.3 | AuthProvider, axiosInstance, account-switch tests |
| REQ-002 | Add account without sign-out | Existing auth baseline; 1.1, 7.3 | account management UI/API tests |
| REQ-003 | Atomic account switching | Existing auth baseline; 1.1, 7.3 | route/token/profile switch tests |
| REQ-004 | Sign out only active account | Existing auth baseline; 1.1, 7.3 | auth regression tests |
| REQ-005 | Remove only expired active session | 1.2, 7.3 | JWT/axios expiry tests |
| REQ-006 | Validate ownership, availability, overlap, transitions | 2.1, 2.2, 3.1, 6.1, 6.2, 7.3 | permission service, car filter, booking conflict tests |
| REQ-007 | Actionable validation/auth/conflict/service errors | 1.2, 2.3, 3.1, 5.1, 6.1 | error envelope and controller tests |
| REQ-008 | Role-specific operations and server RBAC | 2.2, 3.1, 4.1, 4.2, 4.3, 5.1 | SecurityConfig, authorization service, UI guards |
| REQ-009 | Preserve identity during profile updates | 2.3, 4.3, 7.3 | DTO allowlists and profile update tests |
| REQ-010 | Prevent stale state overwrites | 3.2, 4.1, 4.3, 5.3, 6.3 | abortable requests, sequence tests |
| REQ-011 | Consistent DTO contracts | 1.1, 1.2, 2.3, 5.1, 6.1 | typed DTOs and contract tests |
| REQ-012 | Health/log/conflict observability | 1.2, 3.1, 4.3, 5.1, 7.1, 7.2 | correlation logs, audit endpoints, health checks |
| REQ-013 | Four stored accounts minimum | Existing auth baseline; 7.3 | multi-account regression journey |
| REQ-014 | Serialized concurrent booking decisions | 6.2, 7.3 | transaction/locking and concurrency tests |
| REQ-015 | Fail-closed protected requests | 2.2, 2.3, 3.1, 5.1, 6.1 | authorization matrix and DTO tests |
| REQ-016 | Accessible inline failures, no false login redirects | 1.2, 3.2, 4.1, 5.2, 6.3 | frontend error-state and session tests |
| REQ-017 | Bounded timeouts and TLS boundary | 1.2, 2.2, 6.1, 7.2 | Axios timeout, backend config, deployment checks |

## Warnings and Open Decisions

- No repository constitution, topology, or completed architecture artifact was found; create/review those before implementation begins.
- The exact tenant model must be confirmed: agency-as-tenant versus owner-as-tenant with agency delegation.
- Permission grant semantics require product confirmation for approval workflow, expiry, revocation, and whether a grant can cover only assignment or also fleet mutation.
- Durable audit storage and distributed rate limiting should be selected for the deployment environment before Phase 7.
- Existing entity-returning endpoints should not be expanded further; DTO migration is a prerequisite for production release.
