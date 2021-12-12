// Files and modules

import { useState } from "react"

const state = {}

// Global state hook

function useGlobalState(id, initial) {
    if (!state[id]) {
        state[id] = useState(initial)
    }
    return state[id]
}

// Exports

export default useGlobalState