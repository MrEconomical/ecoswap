// Files and modules

import routerList from "../../data/routers.json"

const routerData = routerList.find(router => router.id === "direct")

// Resolve Uniswap compatible routers on chain

function getRouters(chain) {
    return []
}

// Quote swap

async function quote(chain, BN) {
    // No quote

    const none = {
        ...routerData,
        out: false
    }

    // Check swap parameters

    if (!chain.swapSettings.routers[routerData.id].enabled) return none
    const routers = getRouters(chain)
    if (!routers.length) return none
    const swap = chain.swap

    try {
    } catch(error) {
        console.error(error)
        return none
    }
}

// Get swap

async function getSwap(chain, account, BN) {
    return
}

// Exports

export { quote, getSwap }