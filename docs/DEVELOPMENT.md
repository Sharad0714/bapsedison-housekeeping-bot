# BAPS Edison Housekeeping Bot – Development Guide

## Overview

This document defines the development standards for the BAPS Edison Housekeeping Bot.

The project is intended for long-term maintenance and prioritizes simplicity, readability, and reliability over unnecessary complexity.

All code should be written as production-quality software.

---

# Development Philosophy

The project follows a few guiding principles:

* Keep the code simple.
* Prefer readability over cleverness.
* Write code that is easy to maintain.
* Solve today's requirements without overengineering.
* Build features incrementally.

If a simpler solution satisfies the requirements, prefer the simpler solution.

---

# Technology Stack

Use:

* TypeScript
* Cloudflare Workers
* Cloudflare D1
* Telegram Bot API
* Wrangler CLI

Do not introduce:

* Durable Objects
* Cloudflare KV
* Redis
* External databases
* ORMs
* Dependency Injection frameworks
* Polling
* Unnecessary third-party libraries

---

# Code Organization

Keep modules focused on a single responsibility.

Preferred structure:

```text id="vjlwm8"
config/
telegram/
auth/
db/
services/
workflows/
cron/
utils/
```

Every module should have a clear purpose.

Avoid creating "miscellaneous" files that collect unrelated logic.

---

# Separation of Responsibilities

Business logic should remain separate from infrastructure.

### Telegram

Responsible for:

* Sending messages
* Editing messages
* Routing updates
* Inline keyboards
* Reply keyboards

Should not contain business logic.

---

### Database

Responsible for:

* SQL
* Reading data
* Writing data

Should not contain business logic.

---

### Services

Responsible for:

* Business rules
* Inventory logic
* Notifications
* Session management

Services may coordinate multiple database operations.

---

### Workflows

Responsible for:

* User interaction
* Step-by-step workflows
* Navigation
* Temporary workflow state

Workflows should delegate business decisions to services.

---

# TypeScript

Use modern TypeScript throughout the project.

Prefer:

* Strong typing
* Interfaces
* Type aliases where appropriate
* Explicit return types for exported functions

Avoid:

* `any`
* Unnecessary type assertions
* Disabling compiler warnings

---

# Naming Conventions

Use descriptive names.

Examples:

```text id="a4pkpk"
inventoryService

notificationService

sessionService

startInventoryUpdate()

saveInventory()

releaseSession()
```

Avoid abbreviations unless they are widely understood.

---

# Functions

Functions should:

* Perform one responsibility.
* Have descriptive names.
* Remain reasonably short.
* Return early when possible.

Avoid deeply nested conditional logic.

---

# Error Handling

Errors should be handled close to their source.

Guidelines:

* Catch expected errors.
* Log unexpected errors.
* Return user-friendly messages.
* Never expose implementation details.

Webhook handlers should always return a successful HTTP response to Telegram after processing.

---

# Database

Keep SQL simple and readable.

Prefer multiple straightforward queries over overly complex SQL.

Each database module should represent a single table or closely related operations.

Database modules should not implement business logic.

---

# Telegram

Keep Telegram-specific code inside the Telegram module.

Avoid calling the Telegram API directly from services or database modules.

Use reusable helper functions for:

* Sending messages
* Editing messages
* Building keyboards

---

# Workflows

Long-running user interactions should be implemented as workflows.

Each workflow should:

* Acquire an editing session.
* Store temporary state.
* Guide the user step by step.
* Commit changes only after confirmation.
* Release the session when complete.

---

# Validation

Validate all user input before processing.

Examples:

* Quantity validation
* Duplicate item names
* Authorization
* Session ownership

Validation should be centralized whenever practical.

---

# Logging

Log meaningful events.

Examples:

* Unexpected errors
* Failed Telegram API requests
* Database failures

Avoid excessive logging during normal application usage.

Logs should assist debugging without creating unnecessary noise.

---

# Comments

Code should be self-explanatory whenever possible.

Use comments only when they provide context that cannot easily be expressed through code.

Avoid comments that simply restate the implementation.

---

# Dependencies

Before introducing a dependency, consider:

* Can the functionality be implemented using the standard library?
* Does the dependency significantly simplify the project?
* Will it increase long-term maintenance?

If the answer is no, do not introduce the dependency.

---

# Performance

Performance is important, but simplicity comes first.

The application serves a very small number of trusted users.

Avoid premature optimization.

Optimize only when a measurable problem exists.

---

# Testing

Whenever practical:

* Test workflows end-to-end.
* Test validation logic.
* Test edge cases.
* Verify session locking.
* Verify low inventory detection.

New features should not break existing functionality.

---

# Pull Requests

Each change should:

* Solve one problem.
* Remain focused.
* Avoid unrelated refactoring.
* Preserve existing behavior unless intentionally changed.

Small, incremental changes are preferred over large rewrites.

---

# Code Reviews

During review, prioritize:

1. Correctness
2. Readability
3. Maintainability
4. Simplicity
5. Performance

A simpler implementation is preferred if it produces the same result.

---

# Architecture

Preserve the documented architecture.

Avoid redesigning existing modules unless there is a clear benefit.

New features should integrate with the existing project structure rather than creating parallel implementations.

---

# Future Development

The project is expected to evolve gradually.

New functionality should:

* Reuse existing services.
* Follow established patterns.
* Maintain consistency with the existing codebase.

Favor incremental improvements over large architectural changes.

---

# Guiding Principle

Every contribution should leave the codebase easier to understand than before.

The best solution is one that another developer can quickly read, understand, and confidently modify months later.