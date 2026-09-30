# VTSC PaintPro — Multi-Agent Engineering Protocol

This document governs agentic workflows, roles, and automated code review rules for the VTSC PaintPro repository.

## Roles & Responsibilities

1. **System Analyst & Backend Agent**:
   - Maintains MongoDB collections, connection pools, and query performance.
   - Monitors response latency, index coverage, and caching strategies.
   - Audits REST API security, dual-token JWT auth, and role-based permissions (Admin, Staff, B2B, B2C).

2. **UI/UX & Frontend Agent**:
   - Maintains Next.js App Router architecture and UI components.
   - Enforces design tokens, micro-interactions, responsive drawers, and accessible color contrast.
   - Guarantees zero TypeScript compilation errors and optimized asset bundles.

3. **Web3 & Lab Logic Agent**:
   - Manages smart contract bindings, Sepolia Testnet events, and IPFS document immutability.
   - Audits R&D lab testing workflows (DeltaE color variances, viscosity, adherence ratings).

## Quality Gates & Verification Checklist
Before submitting changes:
- [ ] Run `npm run build` on `frontend` — must compile with zero errors.
- [ ] Verify that all navigation links have matching Lucide icons.
- [ ] Ensure any newly added endpoints employ `.lean()` and indexed fields.
- [ ] Validate response compression and error handling.
