# BAPS Edison Housekeeping Bot – Development Roadmap

## Overview

This roadmap outlines the planned implementation phases for the BAPS Edison Housekeeping Bot.

The project is developed incrementally, with each phase building upon the previous one. Every completed phase should leave the application in a stable, deployable, and functional state.

The roadmap emphasizes delivering complete features rather than partially implemented functionality.

---

# Project Status

| Phase                  | Status      |
| ---------------------- | ----------- |
| Foundation             | ✅ Completed |
| Core Inventory         | ⬜ Planned   |
| Inventory Workflow     | ⬜ Planned   |
| Inventory Processing   | ⬜ Planned   |
| Orders & Notifications | ⬜ Planned   |
| Inventory Management   | ⬜ Planned   |
| Final Polish           | ⬜ Planned   |

---

# Phase 1 — Foundation ✅

## Goal

Establish the project foundation and verify communication with Telegram.

## Deliverables

* Cloudflare Worker project
* Telegram bot configuration
* Webhook setup
* Telegram API wrapper
* Update routing
* Callback routing
* Reply keyboard navigation
* Basic project structure
* Authentication

## Result

The bot can receive updates, authenticate users, and respond to basic commands.

---

# Phase 2 — Core Inventory

## Goal

Introduce persistent storage and inventory viewing.

## Deliverables

* Configure Cloudflare D1
* Create database schema
* Database access layer
* Inventory persistence
* Metadata persistence
* Display inventory
* Basic formatting utilities

## Result

Inventory data is stored in D1 and users can view current inventory.

---

# Phase 3 — Inventory Update Workflow

## Goal

Implement the guided inventory update experience.

## Deliverables

* Active session management
* Global editing lock
* Session timeout handling
* Inventory update workflow
* Quantity validation
* Back navigation
* Cancel workflow
* Review screen

## Result

Users can complete a full inventory update without modifying the database until confirmation.

---

# Phase 4 — Inventory Processing

## Goal

Persist inventory changes and implement inventory business rules.

## Deliverables

* Save inventory
* Transaction handling
* Metadata updates
* Low inventory detection
* Inventory status transitions
* Session cleanup

## Result

Inventory updates are committed safely and low inventory is automatically detected.

---

# Phase 5 — Orders & Notifications

## Goal

Implement ordering and administrator notifications.

## Deliverables

* Orders workflow
* Multi-select orders
* Mark items as ordered
* Low inventory notifications
* Daily reminder notifications
* Cloudflare Cron integration

## Result

The administrator can manage pending orders and receives automatic reminders.

---

# Phase 6 — Inventory Management

## Goal

Allow users to maintain the inventory list.

## Deliverables

* Add Item workflow
* Duplicate name validation
* Remove Item workflow
* Multi-select removal
* Confirmation screens

## Result

Users can fully manage inventory items without database access.

---

# Phase 7 — Final Polish

## Goal

Prepare the application for long-term production use.

## Deliverables

* Improve error handling
* Improve logging
* UX refinements
* Performance review
* Code cleanup
* Documentation review
* Final testing

## Result

The project is production-ready and fully documented.

---

# Development Principles

Throughout all phases:

* Keep the application deployable.
* Avoid partially completed features.
* Preserve the documented architecture.
* Keep changes focused and incremental.
* Prefer small pull requests.
* Update documentation alongside code changes.

---

# Future Enhancements

The following features are intentionally outside the scope of the current roadmap but may be considered in future releases:

* Inventory history
* Audit log
* Item categories
* Supplier management
* Export reports
* Barcode support
* Multi-location inventory
* Role-based administration
* Advanced analytics

These enhancements should be evaluated only after the current project is complete and stable.