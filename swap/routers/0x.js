// Files and modules

import routerList from "../../data/routers.json"
import { web3, BN } from "../../state/EthereumContext.js"
import axios from "axios"
import querystring from "querystring"

const routerData = routerList.find(router => router.id === "0x")

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
    } else if (chainId === "0xa4b1") {
        return "https://arbitrum.api.0x.org"
    }
}

// Quote swap

async function quote(chain) {
    // No quote

    const none = {
        ...routerData,
        out: false,
        priority: 0
    }

    // Check swap parameters

    if (!chain.swapSettings.routers[routerData.id].enabled) return none
    const endpoint = getEndpoint(chain.id)
    if (!endpoint) return none
    const swap = chain.swap

    try {
        // Request swap quote

        const result = await axios(`${endpoint}/swap/v1/price?${querystring.encode({
            sellToken: swap.tokenIn.address,
            buyToken: swap.tokenOut.address,
            sellAmount: swap.tokenInAmount.toString()
        })}`)

        return {
            ...routerData,
            out: BN(result.data.buyAmount),
            priority: chain.id === "0x38" ? 2 : 0
        }
    } catch(error) {
        console.error(error)
    }

    return none
}

// Get swap

async function getSwap(chain, account) {
    // No swap

    const none = {
        router: routerData,
        out: false,
        priority: 0
    }

    // Check swap parameters
    
    if (!chain.swapSettings.routers[routerData.id].enabled) return none
    const endpoint = getEndpoint(chain.id)
    if (!endpoint) return none
    const swap = chain.swap

    try {
        // Request swap data
        
        const result = await axios(`${endpoint}/swap/v1/quote?${querystring.encode({
            sellToken: swap.tokenIn.address,
            buyToken: swap.tokenOut.address,
            sellAmount: swap.tokenInAmount.toString(),
            slippagePercentage: chain.swapSettings.slippage / 100
        })}`)
        const gas = await chain.web3.eth.estimateGas({
            from: account,
            to: result.data.to,
            value: swap.tokenIn.address === "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE" ? swap.tokenInAmount : 0,
            data: result.data.data
        }).catch(() => {})
        
        return {
            router: routerData,
            in: BN(result.data.sellAmount),
            out: BN(result.data.buyAmount),
            tx: {
                from: account,
                to: web3.utils.toChecksumAddress(result.data.to),
                data: result.data.data,
                ...(gas) && { gas: web3.utils.numberToHex(Math.floor(gas * 1.25)) }
            },
            priority: chain.id === "0x38" ? 2 : 0
        }
    } catch(error) {
        console.error(error)
    }

    return none
}

// Exports

export { quote, getSwap }