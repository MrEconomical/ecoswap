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
    console.log(quotes)
}

// Exports

export default quoteSwap