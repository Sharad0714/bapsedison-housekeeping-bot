# BAPS Edison Housekeeping Bot – Workflows

## Overview

This document defines the application's interactive workflows.

Each workflow represents a guided user interaction that may span multiple Telegram messages or callback actions.

Workflows are implemented as state machines and store temporary state in the `active_workflow` table until they complete or are cancelled.

Only one editing workflow may be active at any time.

---

# Common Workflow Lifecycle

All editing workflows follow the same lifecycle.

```text id="0s5sy0"
User Starts Workflow
        │
        ▼
Acquire Active Session
        │
        ▼
Initialize Workflow State
        │
        ▼
User Interaction
        │
        ▼
Review (if applicable)
        │
        ▼
Commit Changes
        │
        ▼
Release Session
```

At any point the user may cancel, which immediately releases the active session without modifying persistent data.

---

# Inventory Update Workflow

## Purpose

Update the quantities of every inventory item.

## Flow

```text id="m5h4ly"
User selects Update Inventory
        │
        ▼
Acquire Active Session
        │
        ▼
Load Inventory
        │
        ▼
Display Item 1
        │
        ▼
User Enters Quantity
        │
        ▼
Store Draft Value
        │
        ▼
More Items?
     ┌───┴────┐
     │        │
    Yes      No
     │        │
     ▼        ▼
Next Item   Review
                │
                ▼
          Save / Cancel
          ┌────┴────┐
          │         │
       Save      Cancel
          │         │
          ▼         ▼
 Update Inventory  Release Session
 Update Metadata
 Run Low Stock Detection
 Release Session
```

## Temporary State

The workflow stores:

* Current item index
* Draft quantities
* Original quantities
* Telegram chat ID
* Telegram message ID

No inventory changes are written until Save.

---

# Add Item Workflow

## Purpose

Create a new inventory item.

## Flow

```text id="7sjmj0"
User selects Add Item
        │
        ▼
Acquire Active Session
        │
        ▼
Enter Item Name
        │
        ▼
Validate Name
        │
        ▼
Duplicate?
    ┌────┴────┐
    │         │
   Yes       No
    │         │
Show Error    ▼
         Enter Quantity
                │
                ▼
        Validate Quantity
                │
                ▼
             Review
                │
                ▼
          Save / Cancel
          ┌────┴────┐
          │         │
       Save      Cancel
          │         │
          ▼         ▼
 Insert Inventory  Release Session
 Release Session
```

## Validation

Validate:

* Item name is not empty.
* Item name does not already exist.
* Quantity is a non-negative integer.

---

# Remove Items Workflow

## Purpose

Remove one or more inventory items.

## Flow

```text id="0oq4wk"
User selects Remove Items
        │
        ▼
Acquire Active Session
        │
        ▼
Display Item List
        │
        ▼
Toggle Selection
        │
        ▼
Selection Complete?
        │
        ▼
Confirmation
        │
        ▼
Remove / Cancel
      ┌──┴───┐
      │      │
   Remove  Cancel
      │      │
      ▼      ▼
Delete Items Release Session
Release Session
```

## Temporary State

Store:

* Selected items
* Chat ID
* Message ID

Nothing is removed until confirmation.

---

# Orders Workflow

## Purpose

Allow the administrator to manage pending orders.

## Flow

```text id="t09r4u"
Administrator Opens Orders
          │
          ▼
Acquire Active Session
          │
          ▼
Load Pending Items
          │
          ▼
Display Checklist
          │
          ▼
Toggle Selection
          │
          ▼
Selection Complete?
          │
          ▼
Mark Selected Ordered
          │
          ▼
Update Inventory Status
          │
          ▼
Release Session
```

## Temporary State

Store:

* Selected inventory items
* Chat ID
* Message ID

Only status values are updated.

Inventory quantities are not modified.

---

# Inventory Viewing

## Purpose

Display inventory.

## Flow

```text id="fy3nbh"
User selects Inventory
        │
        ▼
Read Inventory
        │
        ▼
Display Inventory
```

No editing session is required.

No workflow state is stored.

This action is always available.

---

# Daily Reminder

## Purpose

Notify the administrator of pending orders.

## Flow

```text id="sghm4m"
Cron Trigger
      │
      ▼
Load Pending Orders
      │
      ▼
Pending Items?
   ┌────┴────┐
   │         │
  No        Yes
   │         │
Finish   Send Reminder
             │
             ▼
          Complete
```

No workflow state is required.

---

# Low Inventory Detection

## Purpose

Automatically identify inventory items that require ordering.

## Flow

```text id="ylskls"
Inventory Saved
       │
       ▼
Evaluate Each Item
       │
       ▼
Quantity <= Threshold?
      ┌────┴─────┐
      │          │
     No         Yes
      │          │
      ▼          ▼
 Continue   Status == NONE?
                 │
            ┌────┴────┐
            │         │
           No        Yes
            │         │
            ▼         ▼
        Continue   Set PENDING
                     │
                     ▼
             Queue Notification
```

Only newly pending items generate notifications.

---

# Session Timeout

## Purpose

Prevent abandoned workflows from blocking other users.

## Flow

```text id="o6mhvn"
User Starts Workflow
        │
        ▼
Existing Session?
     ┌────┴─────┐
     │          │
    No         Yes
     │          │
     ▼          ▼
Create      Expired?
Session    ┌────┴────┐
            │         │
           No        Yes
            │         │
            ▼         ▼
 Reject     Delete Session
 Request         │
                 ▼
            Create Session
```

Every interaction refreshes the session timestamp.

---

# Cancellation

Every editing workflow supports cancellation.

Cancelling a workflow:

1. Deletes the active session.
2. Discards all temporary state.
3. Leaves persistent data unchanged.
4. Returns the user to the main menu.

No partial changes are ever committed.

---

# Design Principles

All workflows follow these rules:

* Only one active editing workflow at a time.
* Commit changes only after explicit confirmation.
* Preserve temporary state while navigating.
* Refresh the session timeout after every interaction.
* Release the active session immediately after Save or Cancel.
* Never leave partially updated persistent data.
* Keep user interactions short, predictable, and guided.

These principles ensure consistent behavior across the entire application while keeping the implementation simple and maintainable.
