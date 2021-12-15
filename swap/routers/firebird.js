// Files and modules

import axios from "axios"
import querystring from "querystring"

// Resolve Firebird API endpoint

function getEndpoint(chainId) {
    if (chainId === "0x89") {
        return "https://router.firebird.finance/polygon"
    } else if (chainId === "0xfa") {
        return "https://router.firebird.finance/fantom"
    } else if (chainId === "0xa86a") {
        return "https://router.firebird.finance/avalanche"
    } else if (chainId === "0x38") {
        return "https://router.firebird.finance/bsc"
    }
}

// Quote swap

async function quote(chain, BN) {
    // firebird disabled
    return BN(0)
    if (!chain.swapSettings.routers["firebird"].enabled) return BN(0)
    const endpoint = getEndpoint(chain.id)
    if (!endpoint) return BN(0)
    const swap = chain.swap
    // todo: fix wrapping eth to weth and unwrapping weth to eth
    if (swap.tokenIn.address === "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE" && swap.tokenOut.address === "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE") return BN(0)
    try {
        // Request swap quote
        
        const result = await axios(`${endpoint}/route?${querystring.encode({
            from: swap.tokenIn.address === "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE" ? chain.WETH : swap.tokenIn.address,
            to: swap.tokenOut.address === "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE" ? chain.WETH : swap.tokenOut.address,
            amount: swap.tokenInAmount.toString(),
            saveGas: 0,
            gasInclude: 1
        })}`)
        return BN(result.data.maxReturn.totalTo)
    } catch(error) {
        console.error(error)
        return BN(0)
    }
}

// Get swap

async function getSwap(chain, account, BN) {
    return
    if (!chain.swapSettings.routers["firebird"].enabled) return
}

// Exports

export { quote, getSwap }