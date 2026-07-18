import type {Env} from "../index";
import type {ActiveWorkflow} from "../models/activeWorkflow";

export async function getActiveWorkflow (
	env: Env,
): Promise<ActiveWorkflow | null> {
	const result = await env.DB
		.prepare(`
			SELECT
				workflow,
				user_id AS userId,
				state,
				data,
				created_at AS createdAt,
				updated_at AS updatedAt
			FROM active_workflow
			WHERE id = 1
		`)
		.first<ActiveWorkflow>();

	return result ?? null;
}

export async function createActiveWorkflow (
	env: Env,
	workflow: ActiveWorkflow,
): Promise<boolean> {
	const result = await env.DB
		.prepare(`
			INSERT OR IGNORE INTO active_workflow (
				id,
				workflow,
				user_id,
				state,
				data,
				created_at,
				updated_at
			)
			VALUES (?, ?, ?, ?, ?, ?, ?)
		`)
		.bind(
			1,
			workflow.workflow,
			workflow.userId,
			workflow.state,
			workflow.data,
			workflow.createdAt,
			workflow.updatedAt,
		)
		.run();

	return result.meta.changes === 1;
}

export async function updateActiveWorkflow (
	env: Env,
	workflow: ActiveWorkflow,
): Promise<void> {
	await env.DB
		.prepare(`
			UPDATE active_workflow
			SET
				state = ?,
				data = ?,
				updated_at = ?
			WHERE id = 1
		`)
		.bind(
			workflow.state,
			workflow.data,
			workflow.updatedAt,
		)
		.run();
}

export async function deleteActiveWorkflow (
	env: Env,
): Promise<void> {
	await env.DB
		.prepare(`
			DELETE FROM active_workflow
			WHERE id = 1
		`)
		.run();
}

export async function touchActiveWorkflow (
	env: Env,
	updatedAt: number,
): Promise<void> {
	await env.DB
		.prepare(`
            UPDATE active_workflow
            SET updated_at = ?
            WHERE id = 1
        `)
		.bind(updatedAt)
		.run();
}
