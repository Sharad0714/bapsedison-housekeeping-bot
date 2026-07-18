CREATE INDEX IF NOT EXISTS idx_inventory_name_nocase ON inventory (name COLLATE NOCASE);
