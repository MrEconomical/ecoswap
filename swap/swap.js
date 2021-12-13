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

    const swaps = await Promise.all(routers.map(router => router.getSwap(chain, account, BN)))
    console.log(swaps)
    /*
    let best = [BN(0), -1]
    for (let q = 0; q < quotes.length; q ++) {
        if (quotes[q].gt(best[0])) {
            best[0] = quotes[q]
            best[1] = q
        }
    }*/
}

// Exports

export default getSwap