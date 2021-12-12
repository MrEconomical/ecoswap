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

    const quotes = await Promise.all(routers.map(router => router.quote(chain, BN)))
    let best = [BN(0), -1]
    for (let q = 0; q < quotes.length; q ++) {
        if (quotes[q].gt(best)) {
            best[0] = quotes[q]
            best[1] = q
        }
    }

    // Update state

    chain.swap.setTokenOutAmount(best[0])
    const routerQuotes = []
    for (let q = 0; q < quotes.length; q ++) {
        routerQuotes.push({
            ...routers[q],
            out: quotes[q].gt(0) ? null : quotes[q]
        })
    }
    chain.swap.setRouters(routerQuotes)
}

// Exports

export default quoteSwap