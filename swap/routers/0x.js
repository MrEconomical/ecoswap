// Files and modules

import axios from "axios"
import querystring from "querystring"

// Resolve 0x API endpoint

function getEndpoint(chainId) {
    if (chainId === "0x1") {
        return "https://api.0x.org"
    } else if (chainId === "0x89") {
        return "https://polygon.api.0x.org"
    } else if (chainId === "0xfa") {
        return "https://fantom.api.0x.org"
    } else if (chainId === "0xa86a") {
        return "https://avalanche.api.0x.org"
    } else if (chainId === "0x38") {
        return "https://bsc.api.0x.org"
    }
}

// Quote swap

async function quote(chain, BN) {
    // Get quote

    const endpoint = getEndpoint(chain.id)
    if (!endpoint) return BN(0)
    const swap = chain.swap
    const result = (await axios(`${endpoint}/swap/v1/quote?${querystring.encode({
        sellToken: swap.tokenIn.address === "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE" ? "ETH" : swap.tokenIn.address,
        buyToken: swap.tokenOut.address === "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE" ? "ETH" : swap.tokenOut.address,
        sellAmount: swap.tokenInAmount.toString(),
        slippagePercentage: chain.swapSettings.slippage / 100
    })}`))
    console.log(result)
}

// Exports

export { quote }