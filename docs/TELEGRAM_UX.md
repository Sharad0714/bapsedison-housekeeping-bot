# BAPS Edison Housekeeping Bot – Telegram User Experience

## Overview

Telegram is the application's only user interface.

The goal is to provide a simple, fast, and mobile-friendly experience that feels like a lightweight application rather than a traditional chat bot.

The interface should minimize typing, guide users through workflows, and keep conversations clean by editing existing messages whenever practical.

---

# Design Principles

The Telegram experience follows these principles:

* Minimize typing.
* Prefer buttons over free-form text.
* Use guided workflows.
* Keep conversations uncluttered.
* Present one decision at a time.
* Provide clear confirmation before destructive actions.
* Keep navigation consistent throughout the application.

---

# Navigation

Navigation is provided using a persistent Reply Keyboard.

Standard users see:

```text id="b8ctjj"
📦 Inventory

📝 Update Inventory

⚙️ Manage Items
```

Administrators additionally see:

```text id="qvnj0h"
🛒 Orders
```

Slash commands exist only as backup navigation.

---

# Reply Keyboards

Reply keyboards are used only for navigating between major sections.

Examples:

* Inventory
* Update Inventory
* Manage Items
* Orders

Reply keyboards should remain visible throughout normal application usage.

---

# Inline Keyboards

Inline keyboards are used for actions within a workflow.

Examples include:

* Back
* Save
* Cancel
* Confirm
* Remove
* Mark Ordered
* Multi-select

Workflow actions should never require users to type commands.

---

# Message Editing

Whenever practical, workflows should edit an existing Telegram message instead of sending new messages.

Benefits include:

* Cleaner conversations.
* Easier navigation.
* Reduced scrolling.
* More application-like experience.

Long-running workflows should generally use a single editable message.

---

# Inventory Screen

Purpose:

Provide a read-only overview of current inventory.

Display:

* Item name
* Quantity
* Last updated timestamp
* Updated by

This screen contains no action buttons.

Viewing inventory should never acquire an editing session.

---

# Inventory Update Workflow

The inventory update process uses a single editable message.

Flow:

```text id="l0tujj"
Start
   │
   ▼
Item 1
   │
   ▼
Item 2
   │
   ▼
...
   │
   ▼
Review
   │
   ▼
Save
```

Each screen displays:

* Progress
* Item name
* Current quantity
* Prompt for new quantity

Buttons:

* ⬅️ Back
* ❌ Cancel

After entering a valid quantity:

* Save the value temporarily.
* Automatically advance to the next item.

Users never press "Next."

---

# Review Screen

The review screen summarizes every inventory value.

Example:

```text id="u91wm7"
Bath Tissue

8 → 10

Bleach

6 → 4

Brown Roll

9 → 9
```

Buttons:

* ⬅️ Back
* ✅ Save
* ❌ Cancel

Nothing is written to the database until Save.

---

# Manage Items

Selecting Manage Items displays a submenu.

```text id="ldm2uw"
➕ Add Item

➖ Remove Item(s)
```

---

# Add Item

Flow:

```text id="2c62w4"
Item Name
      │
      ▼
Quantity
      │
      ▼
Review
      │
      ▼
Save
```

Typing is required only for:

* Item name
* Initial quantity

All confirmations use buttons.

---

# Remove Item(s)

The Remove Items workflow uses a multi-select interface.

Users:

* Select one or more items.
* Review their selection.
* Confirm deletion.

Example confirmation:

```text id="sj8ymu"
You are about to permanently remove

• Bleach

• Brown Roll
```

Buttons:

* Remove
* Cancel

Deletion is permanent.

---

# Orders

The Orders screen is available only to the administrator.

Pending items are displayed with selectable checkboxes.

Example:

```text id="wm61cx"
☐ Bleach (4)

☑ Brown Roll (3)

☐ Bath Tissue (5)
```

Buttons:

* ✅ Mark Selected as Ordered
* ❌ Cancel

Selections should update dynamically as the administrator taps items.

---

# Validation

Whenever user input is required, invalid values should be rejected immediately.

Examples include:

* Non-numeric quantities
* Negative values
* Duplicate item names

Validation errors should:

* Clearly explain the problem.
* Preserve previously entered data.
* Keep the user on the current step.

---

# Confirmation

Potentially destructive actions require explicit confirmation.

Examples include:

* Saving inventory changes
* Removing inventory items
* Marking orders as ordered

Confirmation screens help prevent accidental actions.

---

# Session Locking

Only one editing workflow may exist at any time.

If another user begins an editing workflow while one is already active, they receive a friendly message explaining that another user is currently editing.

Viewing inventory remains available.

---

# Notifications

Notifications are delivered only to the administrator.

Notification types include:

* Low inventory detected
* Daily pending order reminder

Notifications include an inline button that opens the Orders workflow.

Notifications should be informative without requiring additional navigation.

---

# Error Messages

User-facing error messages should:

* Be brief.
* Clearly explain the issue.
* Suggest the next action whenever possible.

Avoid exposing technical details.

---

# Consistency

Every workflow should follow the same interaction pattern:

1. Present information.
2. Ask for one action.
3. Validate input.
4. Advance automatically.
5. Review changes.
6. Confirm.
7. Complete.

Users should never need to remember commands or workflow steps.

The interface should always guide users toward the next action.

---

# User Experience Goals

The desired user experience can be summarized as follows:

* Fast to use.
* Easy to learn.
* Difficult to misuse.
* Minimal typing.
* Consistent navigation.
* Clean conversations.
* Mobile-first.
* Reliable.
* Predictable.

The application should feel like a purpose-built inventory application that happens to run inside Telegram.