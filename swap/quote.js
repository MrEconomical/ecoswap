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
    let best = 0
    for (let q = 1; q < quotes.length; q ++) {
        if (quotes[q].gt(quotes[best])) {
            best = q
        }
    }

    // State updates

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
    return {
        tokenOutAmount: quotes[best].gt(BN(0)) ? quotes[best] : "No quote",
        routers: routerQuotes
    }
}

// Exports

export default quoteSwap