# BAPS Edison Housekeeping Bot – Project Specification

## Overview

The BAPS Edison Housekeeping Bot is an internal inventory management system built for the **BAPS Shri Swaminarayan Mandir, Edison Housekeeping Team**.

The bot enables authorized volunteers to manage janitorial inventory entirely through Telegram. The primary goal is to provide a simple, reliable, and mobile-friendly experience without requiring a separate web application.

The system is intended for approximately seven authorized users and is designed to prioritize simplicity, maintainability, and ease of use.

---

# Objectives

The application should:

* Provide a fast and intuitive Telegram experience.
* Minimize user typing through reply and inline keyboards.
* Maintain accurate inventory records.
* Prevent conflicting edits by allowing only one active editing workflow at a time.
* Automatically detect low inventory.
* Notify the administrator when items require ordering.
* Keep the implementation simple and maintainable.

---

# User Roles

## Standard User

Standard users can:

* View inventory
* Update inventory
* Add inventory items
* Remove inventory items

## Administrator

The administrator has all standard user permissions and can additionally:

* View pending orders
* Mark items as ordered
* Receive low inventory notifications
* Receive daily reminder notifications

---

# Authentication

Users are authenticated using their Telegram User ID.

Only users listed in the application configuration may access the bot.

Unauthorized users receive an authorization failure message and cannot access any functionality.

---

# Main Navigation

The primary navigation uses a persistent Telegram Reply Keyboard.

Available sections:

* Inventory
* Update Inventory
* Manage Items

Administrators additionally have access to:

* Orders

Slash commands exist only as backup navigation.

---

# Inventory

The Inventory screen provides a read-only view of all inventory items.

Each item displays:

* Item name
* Current quantity

The screen also displays:

* Last updated timestamp
* User who performed the last completed inventory update

Viewing inventory is always permitted, even while another user is editing.

---

# Inventory Update

Inventory updates are performed through a guided workflow.

Users update one inventory item at a time.

For each item the user is shown:

* Current item number
* Total number of items
* Item name
* Current quantity

The user enters a new quantity before proceeding.

Users may navigate backward without losing previously entered values.

No inventory changes are committed until the final Save action.

After saving:

* Inventory quantities are updated.
* Metadata is updated.
* Low inventory detection is performed.
* Notifications are sent when appropriate.
* The editing session ends.

---

# Quantity Validation

Accepted values:

* Zero
* Positive integers

Rejected values:

* Negative numbers
* Decimal numbers
* Non-numeric input

Users remain on the current step until valid input is provided.

---

# Manage Items

Manage Items contains two operations:

* Add Item
* Remove Item(s)

---

## Add Item

Users provide:

1. Item name
2. Initial quantity

The user reviews the information before saving.

Duplicate item names are not permitted.

The new item becomes immediately available within the inventory after saving.

---

## Remove Item(s)

Users may select one or more items for removal.

A confirmation step is required before deletion.

Removing an item permanently deletes it from the inventory.

There is no archive or recovery feature.

---

# Orders

The Orders section is available only to the administrator.

The screen lists all items requiring ordering.

The administrator may select one or more items and mark them as ordered.

When no pending items exist, the application displays an appropriate confirmation message.

---

# Low Inventory

Each inventory item has an associated inventory status.

Low inventory detection occurs immediately after a successful inventory update.

Items requiring ordering are automatically identified using the configured low-stock threshold.

Newly detected low-stock items become pending orders.

Previously pending items are not repeatedly reported.

Items that have been ordered automatically return to a normal state once their quantity exceeds the configured threshold.

---

# Notifications

The administrator receives notifications when:

* New low-stock items are detected.
* Daily reminders are generated for pending orders.

Notifications are sent only to the administrator.

---

# Daily Reminder

A scheduled task runs every morning.

If pending orders exist, the administrator receives a reminder listing all outstanding items.

If no pending orders exist, no reminder is sent.

---

# Editing Sessions

Only one editing workflow may be active at any given time.

Editing workflows include:

* Update Inventory
* Add Item
* Remove Item(s)
* Orders

If another user is currently editing, additional editing requests are temporarily blocked.

Expired editing sessions are automatically cleared after the configured timeout.

Viewing inventory remains available at all times.

---

# User Experience

The application should feel like a lightweight mobile application within Telegram.

Design principles include:

* Persistent reply keyboards for navigation.
* Inline keyboards for actions.
* Minimal typing.
* Guided workflows.
* Clear confirmation before destructive actions.
* Editing existing messages whenever practical to reduce chat clutter.

---

# Non-Functional Requirements

The application should:

* Be reliable for daily use.
* Be easy to maintain.
* Be responsive on mobile devices.
* Keep workflows short and intuitive.
* Avoid unnecessary complexity.
* Favor consistency over feature richness.

---

# Out of Scope

The following features are intentionally excluded:

* Web application
* Administrative dashboard
* Multiple simultaneous editing sessions
* Inventory history
* Item categories
* User management through the bot
* External databases
* Third-party integrations
* Offline support

These features may be considered in future versions but are not part of the current project scope.