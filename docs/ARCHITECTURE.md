# BAPS Edison Housekeeping Bot – Architecture

## Overview

The BAPS Edison Housekeeping Bot is built as a lightweight, fully serverless application running entirely on Cloudflare Workers.

Telegram serves as the only user interface. All application logic executes inside a single Cloudflare Worker, while Cloudflare D1 provides persistent storage.

The architecture intentionally favors simplicity over unnecessary abstraction. The project is designed for a small number of trusted users and prioritizes maintainability, readability, and reliability.

---

# High-Level Architecture

```text
Telegram
      │
      ▼
Telegram Webhook
      │
      ▼
Cloudflare Worker
      │
      ├─────────────┐
      ▼             ▼
Business Logic   Telegram API
      │
      ▼
Cloudflare D1
```

The Worker is responsible for:

* Authentication
* Routing updates
* Executing workflows
* Reading and writing data
* Sending Telegram messages
* Scheduled background tasks

---

# Core Principles

The architecture follows these principles:

* Keep the application small and easy to understand.
* Separate business logic from infrastructure.
* Prefer composition over abstraction.
* Keep SQL simple and readable.
* Keep modules focused on a single responsibility.
* Optimize for maintainability rather than flexibility.

---

# Project Structure

```text
src/
│
├── index.ts
│
├── config/
│
├── telegram/
│
├── auth/
│
├── db/
│
├── workflows/
│
├── services/
│
├── cron/
│
└── utils/
```

Each module has a clearly defined responsibility.

---

# Request Lifecycle

Every Telegram update follows the same lifecycle.

```text
Telegram Update
        │
        ▼
Authenticate User
        │
        ▼
Route Update
        │
        ▼
Execute Workflow
        │
        ▼
Read / Write Database
        │
        ▼
Send Telegram Response
```

The Worker always responds successfully to Telegram after processing the update to prevent unnecessary retries.

---

# Module Responsibilities

## config

Contains application configuration.

Examples:

* Authorized users
* Constants
* Reply keyboard definitions

Configuration should not contain business logic.

---

## telegram

Responsible for all communication with the Telegram Bot API.

Responsibilities include:

* Sending messages
* Editing messages
* Managing reply keyboards
* Managing inline keyboards
* Processing callback queries
* Routing Telegram updates

This module should not contain business logic.

---

## auth

Responsible for authenticating Telegram users.

Authentication is performed using Telegram User IDs.

Unauthorized users are rejected before any business logic is executed.

---

## db

Contains all database operations.

Each module represents a single table or closely related operations.

Database modules should:

* Execute SQL
* Return data
* Avoid business decisions

---

## workflows

Implements user workflows.

Examples:

* Inventory Update
* Add Item
* Remove Item
* Orders

Workflows coordinate user interactions but should delegate business rules to services.

---

## services

Contains application business logic.

Examples:

* Inventory updates
* Low stock detection
* Notifications
* Session management

Services coordinate multiple database operations while remaining independent of Telegram.

---

## cron

Contains scheduled tasks.

Currently:

* Daily reminder notifications

Cron jobs reuse existing services whenever possible.

---

## utils

Contains shared helper functions.

Examples:

* Validation
* Formatting
* Utility helpers

Utilities should remain stateless.

---

# Layer Responsibilities

```text
Telegram
     │
telegram/
     │
workflows/
     │
services/
     │
db/
     │
Cloudflare D1
```

Responsibilities only flow downward.

Database modules never call services.

Services never call Telegram directly.

Telegram handlers should not implement business logic.

---

# Database Layer

Cloudflare D1 is the application's only persistent storage.

The database intentionally remains small.

The application uses only three tables:

* inventory
* metadata
* active_workflow

Each table has a single, well-defined responsibility.

---

# Editing Sessions

The application allows only one active editing workflow at a time.

The `active_workflow` table serves two purposes:

* Global editing lock
* Temporary workflow state

All editing workflows acquire a session before allowing modifications.

Completed or cancelled workflows immediately release the session.

Expired sessions are automatically removed.

---

# Workflow Design

Long-running user interactions are implemented as workflows.

Each workflow stores temporary state inside the active session.

No permanent database changes occur until the user explicitly confirms the operation.

This guarantees atomic updates and prevents partially completed operations.

---

# Business Logic

Business rules belong exclusively in the service layer.

Examples include:

* Inventory updates
* Low stock detection
* Order management
* Session management

Business rules should remain independent of Telegram-specific concerns.

---

# Telegram Design

Telegram serves as the application's user interface.

The interface follows several principles:

* Persistent reply keyboards for navigation.
* Inline keyboards for actions.
* Edit existing messages whenever practical.
* Minimize required typing.
* Keep interactions short and guided.

---

# Error Handling

Errors should be handled as close to their source as practical.

Guidelines:

* Log unexpected errors.
* Return user-friendly messages.
* Avoid exposing internal implementation details.
* Continue processing whenever possible.

Webhook requests should always return a successful HTTP response to Telegram after processing.

---

# State Management

Persistent state belongs in Cloudflare D1.

Temporary workflow state is stored inside the active session.

No application state is stored in memory between requests.

This ensures the application remains fully compatible with the stateless Cloudflare Workers execution model.

---

# Scheduled Tasks

Cloudflare Cron Triggers execute scheduled background work.

Scheduled tasks should:

* Reuse existing services.
* Avoid duplicate business logic.
* Execute independently of Telegram updates.

---

# Scalability

The application is intentionally optimized for a small number of trusted users.

The architecture favors simplicity over horizontal scalability.

If future requirements change, additional services or infrastructure can be introduced incrementally without requiring a complete redesign.

Current requirements do not justify additional complexity.

---

# Design Decisions

The architecture intentionally avoids:

* Durable Objects
* Cloudflare KV
* Redis
* ORMs
* Dependency injection frameworks
* Repository patterns
* External APIs beyond Telegram

These technologies would add complexity without providing meaningful benefit for the current project.

The chosen architecture is sufficient for the project's size while remaining easy to understand, maintain, and extend.
