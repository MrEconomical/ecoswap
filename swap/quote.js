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
        if (quotes[q].gt(best[0])) {
            best[0] = quotes[q]
            best[1] = q
        }
    }

    // Update state

    chain.swap.setTokenOutAmount(best[0])
    const routerQuotes = []
    for (let q = 0; q < quotes.length; q ++) {
        routerQuotes.push({
            ...routerList[q],
            out: quotes[q].gt(BN(0)) ? quotes[q] : null
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