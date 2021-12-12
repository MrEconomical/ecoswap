// Files and modules

import axios from "axios"
import querystring from "querystring"

// Resolve 1inch API endpoint

function getEndpoint(chainId) {
    if (chainId === "0x1") {
        return "https://api.1inch.exchange/v3.0/1"
    } else if (chainId === "0x89") {
        return "https://api.1inch.exchange/v3.0/137"
    } else if (chainId === "0x38") {
        return "https://api.1inch.exchange/v3.0/56"
    }
}

// Quote swap

async function quote(chain, amountIn, BN) {
    const endpoint = getEndpoint(chain.id)
    if (!endpoint) return BN(0)
    const swap = chain.swap
    const result = await axios(`${endpoint}/quote?${querystring.encode({
        fromTokenAddress: swap.tokenIn.address,
        toTokenAddress: swap.tokenOut.address,
        amount: amountIn.toString()
    })}`)
    return BN(result.data.toTokenAmount)
}

// Exports

export { quote }