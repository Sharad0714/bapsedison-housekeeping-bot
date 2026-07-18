import type {Env} from "../index";
import {SESSION_TIMEOUT} from "../config";
import type {ActiveWorkflow} from "../models/activeWorkflow";
import * as repository from "../db/activeWorkflowRepository";

function isExpired (workflow: ActiveWorkflow): boolean {
	return Date.now() - workflow.updatedAt > SESSION_TIMEOUT;
}

export async function getActiveWorkflow (
    env: Env,
): Promise<ActiveWorkflow | null> {
    const workflow = await repository.getActiveWorkflow(env);

    if (!workflow) {
        return null;
    }

    if (isExpired(workflow)) {
        await repository.deleteActiveWorkflow(env);
        return null;
    }

    return workflow;
}

export async function startWorkflow (
    env: Env,
    workflow: ActiveWorkflow,
): Promise<boolean> {
    const existing = await getActiveWorkflow(env);

    if (existing) {
        return false;
    }

	return repository.createActiveWorkflow(env, workflow);
}

export async function updateWorkflow (
    env: Env,
    workflow: ActiveWorkflow,
): Promise<boolean> {
    const existing = await getActiveWorkflow(env);

    if (!existing) {
        return false;
    }

    await repository.updateActiveWorkflow(env, workflow);
    return true;
}

export async function endWorkflow (
    env: Env,
): Promise<void> {
    await repository.deleteActiveWorkflow(env);
}

export async function touchWorkflow (
    env: Env,
): Promise<void> {
    await repository.touchActiveWorkflow(env, Date.now());
}
