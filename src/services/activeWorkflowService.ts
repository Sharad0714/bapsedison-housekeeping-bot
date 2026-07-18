import type {Env} from "../index";
import type {ActiveWorkflow} from "../models/activeWorkflow";
import * as repository from "../db/activeWorkflowRepository";

const WORKFLOW_TIMEOUT_MS = 30 * 60 * 1000;

function isExpired (workflow: ActiveWorkflow): boolean {
    return Date.now() - workflow.updatedAt > WORKFLOW_TIMEOUT_MS;
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

    await repository.createActiveWorkflow(env, workflow);
    return true;
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