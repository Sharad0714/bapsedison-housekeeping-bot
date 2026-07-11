# BAPS Edison Housekeeping Bot – Database Design

## Overview

The BAPS Edison Housekeeping Bot uses **Cloudflare D1** as its only persistent datastore.

The database is intentionally simple and consists of only three tables.

The application stores:

* Inventory
* Inventory metadata
* Active workflow state

The design prioritizes simplicity, readability, and maintainability over normalization or abstraction.

---

# Design Principles

The database follows these principles:

* Keep the schema small.
* One table per responsibility.
* Store only persistent application state.
* Avoid unnecessary relationships.
* Prefer straightforward SQL over complex queries.

The application performs all business logic within the Cloudflare Worker.

The database is responsible only for storing state.

---

# Schema Overview

```text id="fp9yfb"
inventory
    │
    ├── Stores inventory items
    │
metadata
    │
    ├── Stores information about the last completed inventory update
    │
active_session
    │
    └── Stores the active editing workflow
```

The tables are intentionally independent.

No foreign keys are required.

---

# Inventory Table

The inventory table stores all inventory items.

Each item is uniquely identified by its name.

Schema:

```sql id="e5lmb2"
CREATE TABLE inventory (
    name TEXT PRIMARY KEY,
    quantity INTEGER NOT NULL,
    status TEXT NOT NULL
        CHECK(status IN ('NONE', 'PENDING', 'ORDERED'))
);
```

## Fields

### name

Unique inventory item name.

Examples:

* Bath Tissue
* Bleach
* Brown Roll

Item names cannot be duplicated.

---

### quantity

Current quantity available.

Values:

* Zero
* Positive integers

Negative values are not permitted.

---

### status

Represents the ordering status.

Allowed values:

| Status  | Description                                                      |
| ------- | ---------------------------------------------------------------- |
| NONE    | Item has sufficient inventory                                    |
| PENDING | Item requires ordering                                           |
| ORDERED | Item has been ordered but inventory has not yet been replenished |

---

# Inventory Status Lifecycle

```text id="h5qgwo"
NONE
   │
   │ quantity <= threshold
   ▼
PENDING
   │
   │ Administrator marks ordered
   ▼
ORDERED
   │
   │ quantity > threshold
   ▼
NONE
```

Status transitions occur automatically during inventory updates except when the administrator explicitly marks items as ordered.

---

# Metadata Table

The metadata table stores information about the most recent successful inventory update.

Schema:

```sql id="b5xtca"
CREATE TABLE metadata (
    id INTEGER PRIMARY KEY CHECK(id = 1),
    last_updated TEXT,
    updated_by TEXT
);
```

This table always contains at most one row.

It is updated only after a successful inventory save.

It is never modified during partially completed workflows.

---

# Active Session Table

The active session table stores the application's only editing session.

Schema:

```sql id="nclvsa"
CREATE TABLE active_session (
    id INTEGER PRIMARY KEY CHECK(id = 1),
    telegram_id INTEGER NOT NULL,
    workflow TEXT NOT NULL,
    state_json TEXT NOT NULL,
    updated_at TEXT NOT NULL
);
```

This table always contains either:

* Zero rows
* One row

It serves two independent purposes:

1. Global editing lock
2. Temporary workflow state

---

# Session Lifecycle

```text id="lqzj79"
No Session
      │
      ▼
Workflow Starts
      │
      ▼
Session Created
      │
      ▼
User Interaction
      │
      ▼
updated_at refreshed
      │
      ▼
Save or Cancel
      │
      ▼
Session Deleted
```

If a session remains inactive longer than the configured timeout, it is automatically removed before another workflow begins.

---

# Workflow State

The `state_json` column stores temporary workflow data.

Example:

```json id="7xkp5g"
{
  "currentIndex": 2,
  "draft": {
    "Bath Tissue": {
      "old": 8,
      "new": 10
    },
    "Bleach": {
      "old": 6,
      "new": 4
    }
  },
  "chatId": 123456789,
  "messageId": 182
}
```

The structure depends on the active workflow.

Inventory Update, Add Item, Remove Item, and Orders may each store different state objects.

No permanent data is written until the workflow completes successfully.

---

# Data Integrity

The application enforces the following rules:

* Item names are unique.
* Quantities cannot be negative.
* Status values are limited to valid states.
* Only one active editing session may exist.
* Metadata is updated only after successful inventory saves.
* Inventory changes are committed atomically.

Application validation is performed before writing data to the database.

---

# Transactions

Operations affecting multiple tables should execute within a database transaction whenever possible.

Examples include:

* Saving inventory updates
* Updating metadata
* Releasing the active session

This ensures the database cannot enter a partially updated state.

---

# Initial State

A newly deployed database contains:

* An empty inventory table.
* An empty metadata table.
* No active session.

The application ships with no predefined inventory items.

Users create inventory items through the Add Item workflow.

---

# Future Expansion

The current schema intentionally remains minimal.

Possible future additions include:

* Inventory history
* Audit logging
* Item categories
* Supplier information

These features are intentionally excluded from the current design to keep the application simple and maintainable.