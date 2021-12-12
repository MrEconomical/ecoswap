// Global hooks

const hooks = {}

// Wrap hook into global hook

function useGlobalHook(hook) {
    if (!hooks[hook]) {
        hooks[hook] = hook(...[...arguments].slice(1))
    }
    return hooks[hook]
}

// Exports

export default useGlobalHook