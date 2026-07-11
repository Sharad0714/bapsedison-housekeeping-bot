# BAPS Edison Housekeeping Bot – Architecture Decisions

## Overview

This document records the major architectural decisions made during the development of the BAPS Edison Housekeeping Bot.

The purpose of this document is to capture the reasoning behind important technical choices so future contributors understand not only **what** the system does, but **why** it was designed this way.

Each decision should include the context, the chosen solution, alternatives that were considered, and the reasoning behind the final choice.

---

# ADR-001 — Telegram as the Only User Interface

## Decision

Use Telegram as the sole user interface.

## Alternatives Considered

* Web application
* Mobile application
* Telegram + Web dashboard

## Rationale

The intended users already use Telegram daily.

Providing a dedicated web application would introduce unnecessary development effort and maintenance while offering little additional value for a small internal team.

Telegram provides:

* Authentication
* Notifications
* Mobile accessibility
* Familiar user experience

This makes it an ideal platform for the project's requirements.

---

# ADR-002 — Cloudflare Workers

## Decision

Host the application using Cloudflare Workers.

## Alternatives Considered

* Node.js server
* Express
* VPS hosting
* AWS Lambda

## Rationale

Cloudflare Workers provide:

* Fully serverless deployment
* Automatic scaling
* Low operational cost
* Native webhook support
* Cron Triggers
* Tight integration with D1

The application's workload is small and event-driven, making Workers an excellent fit.

---

# ADR-003 — Cloudflare D1

## Decision

Use Cloudflare D1 as the only persistent datastore.

## Alternatives Considered

* SQLite
* PostgreSQL
* MySQL
* Redis
* Cloudflare KV
* Durable Objects

## Rationale

The application stores a small amount of relational data.

D1 provides:

* Native SQL
* Transactions
* Simple deployment
* Tight integration with Workers

Additional infrastructure would add complexity without meaningful benefit.

---

# ADR-004 — TypeScript

## Decision

Develop the project using TypeScript.

## Alternatives Considered

* JavaScript

## Rationale

As the project evolved, the number of workflows, database models, and Telegram interactions increased.

TypeScript provides:

* Compile-time validation
* Better tooling
* Strong typing
* Improved refactoring support
* Better long-term maintainability

The small increase in complexity is outweighed by improved reliability.

---

# ADR-005 — One Active Editing Session

## Decision

Allow only one editing workflow at a time.

## Alternatives Considered

* Multiple concurrent editing sessions
* Optimistic locking
* Item-level locking

## Rationale

The bot is used by approximately seven trusted users.

Preventing concurrent edits greatly simplifies the implementation and eliminates conflicting inventory updates.

The reduced complexity outweighs the small inconvenience of occasionally waiting for another user to finish.

---

# ADR-006 — Inventory Items Identified by Name

## Decision

Use the inventory item's name as the primary key.

## Alternatives Considered

* Numeric IDs
* UUIDs

## Rationale

Inventory items are few in number and have stable, descriptive names.

Using the name as the identifier:

* Simplifies queries.
* Makes debugging easier.
* Removes unnecessary identifiers.

The application assumes item names are unique.

---

# ADR-007 — Atomic Inventory Updates

## Decision

Do not modify inventory until the user explicitly selects **Save**.

## Alternatives Considered

* Update each item immediately after entry

## Rationale

Atomic updates provide a better user experience and prevent partially completed inventory updates.

Users may:

* Review changes
* Navigate backward
* Cancel without affecting stored data

This guarantees that inventory is always internally consistent.

---

# ADR-008 — Active Session Stores Workflow State

## Decision

Use the `active_session` table for both session locking and temporary workflow state.

## Alternatives Considered

* In-memory state
* Durable Objects
* Cloudflare KV
* Separate workflow tables

## Rationale

The active session already represents the user's current workflow.

Combining the editing lock and temporary state into one table:

* Simplifies the schema
* Reduces duplicated state
* Fits the stateless execution model of Cloudflare Workers

---

# ADR-009 — Three-Table Database Design

## Decision

Use only three database tables.

## Tables

* inventory
* metadata
* active_session

## Alternatives Considered

* Audit tables
* History tables
* Category tables
* Supplier tables

## Rationale

The application has a narrow scope.

Additional tables would increase complexity without supporting current requirements.

The schema can be expanded later if future requirements justify it.

---

# ADR-010 — Telegram-First User Experience

## Decision

Design the interface to feel like a lightweight mobile application.

## Rationale

Rather than exposing traditional chatbot commands, users are guided through structured workflows using:

* Reply keyboards
* Inline keyboards
* Message editing
* Confirmation screens

This approach reduces typing, minimizes errors, and creates a more intuitive experience.

---

# ADR-011 — Modular Architecture

## Decision

Organize the project into small, focused modules.

## Rationale

Each module has a single responsibility.

Examples include:

* Telegram
* Database
* Services
* Workflows

This organization improves readability, testing, and long-term maintenance while avoiding unnecessary abstraction.

---

# Future Decisions

This document should continue to grow as new architectural decisions are made.

Each new decision should include:

* Context
* Decision
* Alternatives considered
* Rationale
* Consequences (when applicable)

Recording decisions at the time they are made helps preserve the reasoning behind the architecture and prevents future contributors from unintentionally reversing important design choices.