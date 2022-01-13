// Files and modules

import routerList from "../data/routers.json"
import { useState, useEffect } from "react"

// Swap data hook

function useSwap(chain) {
    // Swap state data

    const [ tokenIn, setTokenIn ] = useState()
    const [ tokenInAmount, setTokenInAmount ] = useState()
    const [ tokenOut, setTokenOut ] = useState()
    const [ tokenOutAmount, setTokenOutAmount ] = useState()
    const [ routers, setRouters ] = useState(routerList)

    // Default swap store

    function getDefault() {
        return {
            tokenIn: chain.tokens.find(token => token.symbol === chain.token),
            tokenOut: null
        }
    }

    // Get swap tokens from local storage

    useEffect(() => {
        // Initialize swap store

        if (!localStorage.swapStore) {
            localStorage.swapStore = JSON.stringify({ [chain.id]: getDefault() })
        } else {
            try {
                const store = JSON.parse(localStorage.swapStore)
                if (!store[chain.id]) {
                    store[chain.id] = getDefault()
                    localStorage.swapStore = JSON.stringify(store)
                }
            } catch {
                localStorage.swapStore = JSON.stringify({ [chain.id]: getDefault() })
            }
        }

        // Initialize swap data

        const store = JSON.parse(localStorage.swapStore)[chain.id]
        setTokenIn(store.tokenIn)
        setTokenOut(store.tokenOut)
    }, [])

    // Update local storage on token changes

    useEffect(() => {
        const tokenInStore = !tokenIn || (tokenIn.external && !tokenIn.added) ? null : tokenIn
        const tokenOutStore = !tokenOut || (tokenOut.external && !tokenOut.added) ? null : tokenOut
        
        if (!localStorage.swapStore) {
            localStorage.swapStore = JSON.stringify({
                [chain.id]: {
                    tokenIn: tokenInStore,
                    tokenOut: tokenOutStore
                }
            })
        } else {
            try {
                const store = JSON.parse(localStorage.swapStore)
                store[chain.id] = {
                    tokenIn: tokenInStore,
                    tokenOut: tokenOutStore
                }
                localStorage.swapStore = JSON.stringify(store)
            } catch {
                localStorage.swapStore = JSON.stringify({
                    [chain.id]: {
                        tokenIn: tokenInStore,
                        tokenOut: tokenOutStore
                    }
                })
            }
        }
    }, [tokenIn, tokenOut])

    // Swap data

    return {
        tokenIn,
        setTokenIn,
        tokenInAmount,
        setTokenInAmount,
        tokenOut,
        setTokenOut,
        tokenOutAmount,
        setTokenOutAmount,
        routers,
        setRouters
    }
}

// Exports

export default useSwap