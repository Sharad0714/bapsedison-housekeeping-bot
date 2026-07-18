# BAPS Edison Housekeeping Bot

A production-quality inventory management bot for the **BAPS Shri Swaminarayan Mandir, Edison Housekeeping Team**.

The bot enables authorized volunteers to manage janitorial inventory entirely through Telegram. The current implementation provides inventory viewing, guided inventory updates, low-inventory status detection, and a global editing lock through a simple, mobile-friendly interface. Order management, reminders, and item administration remain on the roadmap.

The project is designed for a small team of trusted users and emphasizes simplicity, reliability, and long-term maintainability.

---

## Features

* Telegram-only user interface
* Secure authentication using Telegram User IDs
* Inventory viewing
* Guided inventory update workflow
* Global editing lock with session timeout
* Atomic D1-backed inventory saves
* Automatic low-inventory status detection
* Fully serverless architecture

Planned workflows include item administration, administrator order management, and daily reminder notifications.

---

## Technology Stack

* TypeScript
* Cloudflare Workers
* Cloudflare D1
* Telegram Bot API (Webhook)
* Cloudflare Cron Triggers
* Wrangler CLI

---

## Project Structure

```text id="ljurq8"
src/            Application source code
docs/           Project documentation
migrations/     Database schema migrations
```

---

## Documentation

The documentation in the `docs/` directory is the primary source of truth for the project.

| Document          | Description              |
| ----------------- | ------------------------ |
| `PROJECT_SPEC.md` | Functional requirements  |
| `ARCHITECTURE.md` | System architecture      |
| `DATABASE.md`     | Database design          |
| `TELEGRAM_UX.md`  | Telegram user experience |
| `WORKFLOWS.md`    | Workflow state machines  |
| `DEVELOPMENT.md`  | Development standards    |
| `ROADMAP.md`      | Development roadmap      |
| `DECISIONS.md`    | Architecture decisions   |

---

## Development

### Install dependencies

```bash
npm install
```

### Start local development

```bash
npm run dev
```

### Deploy

```bash
npm run deploy
```

Deployment is performed using Wrangler.

---

## Design Principles

* Keep the architecture simple.
* Write production-quality TypeScript.
* Prefer readability over unnecessary abstraction.
* Keep Telegram as the only user interface.
* Build features incrementally.
* Maintain a clean and well-documented codebase.

---

## License

This project is intended for internal use by the **BAPS Shri Swaminarayan Mandir, Edison Housekeeping Team**.
