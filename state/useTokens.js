// Files and modules

import { useState } from "react"

// Chain tokens hook

function useTokens(chainId) {
    const tokens = require(`../data/tokens/${chainId}.json`).map(token => {
        token.default = true
        return token
    })
    return useState(tokens)
}

// Exports

export default useTokens