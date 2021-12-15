// Files and modules

import routerList from "../data/routers"

// Load router handlers

const routers = []
for (const router of routerList) {
    routers.push(require(`./routers/${router.id}.js`))
}

// Get best swap from routers

async function getSwap(chain, account, BN) {
    // Get best router swap

    const swap = chain.swap
    const start = {
        in: swap.tokenIn.address,
        inAmount: swap.tokenInAmount,
        out: swap.tokenOut.address
    }
    const swaps = await Promise.all(routers.map(router => router.getSwap(chain, account, BN)))
    let best = 0
    for (let s = 1; s < swaps.length; s ++) {
        if (!swaps[s]) continue
        if (swaps[s].out.gt(swaps[best].out)) {
            best = s
        }
    }

    // Update state

    if (
        !swap.tokenIn ||
        swap.tokenIn.address !== start.in ||
        !swap.tokenInAmount ||
        !swap.tokenInAmount.eq(start.inAmount) ||
        !swap.tokenOut ||
        swap.tokenOut.address !== start.out
    ) return
    chain.swap.setTokenOutAmount(swaps[best] ? swaps[best].out : "No swap")
    const routerQuotes = []
    for (let s = 0; s < swaps.length; s ++) {
        routerQuotes.push({
            ...routerList[s],
            out: swaps[s] ? swaps[s].out : false
        })
    }
    routerQuotes.sort((a, b) => {
        if (a.out && !b.out) {
            return -1
        } else if (b.out && !a.out) {
            return 1
        } else if (!a.out && !b.out) {
            return 0
        } else {
            return a.out.gt(b.out) ? -1 : 1
        }
    })
    chain.swap.setRouters(routerQuotes)

    // Return best swap

    return {
        routerName: routerList[best].name,
        ...swaps[best]
    }
}

// Exports

export default getSwap