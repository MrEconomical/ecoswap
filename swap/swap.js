// Files and modules

import routerList from "../data/routers.json"

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
    swaps.sort((a, b) => {
        if (a.out && !b.out) {
            return -1
        } else if (b.out && !a.out) {
            return 1
        } else if (!a.out && !b.out) {
            return 0
        } else {
            if (a.out.mul(BN(10).pow(BN(6))).div(b.out).sub(BN(10).pow(BN(6))).abs().lt(BN(5))) {
                return b.priority ? 1 : -1
            } else {
                return a.out.gt(b.out) ? -1 : 1
            }
        }
    })

    // Return data

    const swapFound = swaps[0].out && swaps[0].out.gt(BN(0))
    chain.swap.setTokenOutAmount(swapFound ? swaps[0].out : "No swap")
    chain.swap.setRouters(swaps.map(swap => ({
        ...swap.router,
        out: swap.out
    })))
    return swapFound ? swaps[0] : null
}

// Exports

export default getSwap