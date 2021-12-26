// Files and modules

import routerList from "../data/routers"

// Load router handlers

const routers = []
for (const router of routerList) {
    routers.push(require(`./routers/${router.id}.js`))
}

// Get best swap from routers

async function getSwap(chain, account, BN) {
    // Wrap or unwrap ETH swap

    if (
        chain.swap.tokenIn.address === "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE" &&
        chain.swap.tokenOut.address === chain.WETH._address
    ) {
        chain.swap.setTokenOutAmount(chain.swap.tokenInAmount)
        chain.swap.setRouters(routerList.map(router => ({
            ...router,
            out: chain.swap.tokenInAmount
        })))
        return {
            in: chain.swap.tokenInAmount,
            out: chain.swap.tokenInAmount,
            tx: {
                from: account,
                to: chain.WETH._address,
                data: chain.WETH.methods.deposit().encodeABI()
            }
        }
    } else if (
        chain.swap.tokenIn.address === chain.WETH._address &&
        chain.swap.tokenOut.address === "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE"
    ) {
        chain.swap.setTokenOutAmount(chain.swap.tokenInAmount)
        chain.swap.setRouters(routerList.map(router => ({
            ...router,
            out: chain.swap.tokenInAmount
        })))
        return {
            in: chain.swap.tokenInAmount,
            out: chain.swap.tokenInAmount,
            tx: {
                from: account,
                to: chain.WETH._address,
                data: chain.WETH.methods.withdraw(chain.swap.tokenInAmount).encodeABI()
            }
        }
    }

    // Get best router swap

    const swaps = await Promise.all(routers.map(router => router.getSwap(chain, account, BN)))
    let best = 0
    for (let s = 1; s < swaps.length; s ++) {
        if (!swaps[s]) continue
        if (swaps[s].out.gt(swaps[best].out)) {
            best = s
        }
    }

    // Update state

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