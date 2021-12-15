// Files and modules

import routerList from "../data/routers"

// Load router handlers

const routers = []
for (const router of routerList) {
    routers.push(require(`./routers/${router.id}.js`))
}

// Quote swap on routers

async function quoteSwap(chain, BN) {
    // Get best router quote

    const swap = chain.swap
    const start = {
        in: swap.tokenIn.address,
        inAmount: swap.tokenInAmount,
        out: swap.tokenOut.address
    }
    const quotes = await Promise.all(routers.map(router => router.quote(chain, BN)))
    let best = 0
    for (let q = 1; q < quotes.length; q ++) {
        if (quotes[q].gt(quotes[best])) {
            best = q
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
    chain.swap.setTokenOutAmount(quotes[best].gt(BN(0)) ? quotes[best] : "No quote")
    const routerQuotes = []
    for (let q = 0; q < quotes.length; q ++) {
        routerQuotes.push({
            ...routerList[q],
            out: quotes[q].gt(BN(0)) ? quotes[q] : false
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
}

// Exports

export default quoteSwap