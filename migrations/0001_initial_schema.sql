CREATE TABLE IF NOT EXISTS inventory (
    name TEXT PRIMARY KEY,
    quantity INTEGER NOT NULL CHECK (quantity >= 0),
    status TEXT NOT NULL DEFAULT 'NONE'
        CHECK (status IN ('NONE', 'PENDING', 'ORDERED'))
);

CREATE TABLE IF NOT EXISTS metadata (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    last_updated TEXT,
    updated_by TEXT
);

CREATE TABLE IF NOT EXISTS active_workflow (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    workflow TEXT NOT NULL,
    user_id INTEGER NOT NULL,
    state TEXT NOT NULL,
    data TEXT NOT NULL,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL
);
