getActiveWorkflow(env) {
    const workflow = await repository.get(...);

    if (workflow && isExpired(workflow)) {
        await repository.delete(...);
        return null;
    }

    return workflow;
}

startWorkflow(env, ...) {
    const existing = await repository.get();

    if (existing) {
        throw ActiveWorkflowExistsError;
    }

    await repository.create(...);
}

updateWorkflow(env, ...) {
    const workflow = await repository.get();

    if (!workflow) {
        throw WorkflowNotFoundError;
    }

    await repository.update(...);
}

endWorkflow(env) {
    await repository.delete(env);
}