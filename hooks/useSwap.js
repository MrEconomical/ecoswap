// Files and modules

import { useEffect, useState } from "react"

// Swap data hook

function useSwap(chain) {
    // Swap state data

    const [ tokenIn, setTokenIn ] = useState() // todo: set default value
    const [ tokenInAmount, setTokenInAmount ] = useState()
    const [ tokenOut, setTokenOut ] = useState()
    const [ tokenOutAmount, setTokenOutAmount ] = useState()

    // Default swap store

    function getDefault() {
        return {
            tokenIn: chain.tokens.find(token => token.symbol === chain.token),
            tokenInAmount: null,
            tokenOut: chain.tokens.find(token => token.symbol === "USDC"),
            tokenOutAmount: null
        }
    }

    // Run initial client side update

    useEffect(() => {
        // Check swap store

        if (!localStorage.swapStore) {
            localStorage.swapStore = JSON.stringify({ [chain.id]: getDefault() })
        } else {
            try {
                const store = JSON.parse(localStorage.swapStore)
                if (!store[chain.id]) store[chain.id] = getDefault()
                localStorage.swapStore = JSON.stringify(store)
            } catch {
                localStorage.swapStore = JSON.stringify({ [chain.id]: getDefault() })
            }
        }

        // Initialize swap data

        const store = JSON.parse(localStorage.swapStore)
        console.log(store)
    }, [])

    // Swap data

    return {
        tokenIn,
        setTokenIn,
        tokenInAmount,
        setTokenInAmount,
        tokenOut,
        setTokenOut,
        tokenOutAmount,
        setTokenOutAmount
    }
}

// Exports

export default useSwap