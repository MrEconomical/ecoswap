// Files and modules

import routerList from "../data/routers.json"
import { BN } from "../state/EthereumContext.js"

// Load router handlers

const routers = []
for (const router of routerList) {
    routers.push(require(`./routers/${router.id}.js`))
}

// Quote swap on routers

async function quoteSwap(chain) {
    // Wrap or unwrap ETH quote

    if (
        (chain.swap.tokenIn.address === "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE" &&
        chain.swap.tokenOut.address === chain.WETH) ||
        (chain.swap.tokenIn.address === chain.WETH &&
        chain.swap.tokenOut.address === "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE")
    ) {
        return {
            tokenOutAmount: chain.swap.tokenInAmount,
            routers: routerList.map(router => ({
                ...router,
                out: chain.swap.tokenInAmount
            }))
        }
    }

    // Get best router quote

    const quotes = await Promise.all(routers.map(router => router.quote(chain)))
    quotes.sort((a, b) => {
        if (a.out && !b.out) {
            return -1
        } else if (b.out && !a.out) {
            return 1
        } else if (!a.out && !b.out) {
            return 0
        } else {
            if (a.out.mul(BN(10).pow(BN(6))).div(b.out).sub(BN(10).pow(BN(6))).abs().lt(BN(7))) {
                return a.priority > b.priority ? -1 : a.priority < b.priority ? 1 : 0
            } else {
                return a.out.gt(b.out) ? -1 : a.out.lt(b.out) ? 1 : 0
            }
        }
    })
    
    return {
        tokenOutAmount: quotes[0].out && quotes[0].out.gt(BN(0)) ? quotes[0].out : "No quote",
        routers: quotes
    }
}

// Exports

export default quoteSwap