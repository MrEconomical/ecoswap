// Files and modules

import { useState, useEffect, useRef } from "react"

// Chain tokens hook

function useTokens(chainId) {
    // Tokens state data

    const tokenList = require(`../data/tokens/${chainId}.json`)
    for (const token of tokenList) {
        token.default = true
    }
    const [ tokens, setTokens ] = useState(tokenList)

    // Get external tokens from local storage

    useEffect(() => {
        // Initialize external token store

        if (!localStorage.externalTokens) {
            localStorage.externalTokens = JSON.stringify({ [chainId]: [] })
        } else {
            try {
                const savedTokens = JSON.parse(localStorage.externalTokens)
                if (!savedTokens[chainId]) {
                    savedTokens[chainId] = []
                    localStorage.externalTokens = JSON.stringify(savedTokens)
                }
            } catch {
                localStorage.externalTokens = JSON.stringify([])
            }
        }

        // Load external tokens

        const externalTokens = JSON.parse(localStorage.externalTokens)
        externalTokens[chainId] = externalTokens[chainId].filter(external => !tokens.find(token => token.address === external.address))
        setTokens([...tokens, ...externalTokens[chainId]])
        localStorage.externalTokens = JSON.stringify(externalTokens)
    }, [])

    // Update local storage on token changes excluding initial render

    const render = useRef(true)
    useEffect(() => {
        if (render.current) {
            render.current = false
            return
        }
        const externalTokens = tokens.filter(token => token.external && token.added)
        if (!localStorage.externalTokens) {
            localStorage.externalTokens = JSON.stringify({ [chainId]: externalTokens })
        } else {
            try {
                const savedTokens = JSON.parse(localStorage.externalTokens)
                savedTokens[chainId] = externalTokens
                localStorage.externalTokens = JSON.stringify(savedTokens)
            } catch {
                localStorage.externalTokens = JSON.stringify({ [chainId]: externalTokens })
            }
        }
    }, [tokens])

    // Token data

    return [ tokens, setTokens ]
}

// Exports

export default useTokens