// Files and modules

import routerList from "../data/routers.json"
import WETHABI from "../abis/WETH.json"
import { web3, BN } from "../state/EthereumContext.js"

// Load swap data

const WETH = new web3.eth.Contract(WETHABI)
const routers = []
for (const router of routerList) {
    routers.push(require(`./routers/${router.id}.js`))
}

// Get best swap from routers

async function getSwap(chain, account) {
    // Wrap or unwrap ETH swap

    if (chain.swap.tokenIn.address === "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE" && chain.swap.tokenOut.address === chain.WETH) {
        // Update display state

        chain.swap.setTokenOutAmount(chain.swap.tokenInAmount)
        chain.swap.setRouters(routerList.map(router => ({
            ...router,
            out: chain.swap.tokenInAmount
        })))

        // Wrap transaction data

        return {
            in: chain.swap.tokenInAmount,
            out: chain.swap.tokenInAmount,
            tx: {
                from: account,
                to: chain.WETH,
                data: WETH.methods.deposit().encodeABI()
            }
        }
    } else if (chain.swap.tokenIn.address === chain.WETH && chain.swap.tokenOut.address === "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE") {
        // Update display state

        chain.swap.setTokenOutAmount(chain.swap.tokenInAmount)
        chain.swap.setRouters(routerList.map(router => ({
            ...router,
            out: chain.swap.tokenInAmount
        })))

        // Unwrap transaction data

        return {
            in: chain.swap.tokenInAmount,
            out: chain.swap.tokenInAmount,
            tx: {
                from: account,
                to: chain.WETH,
                data: WETH.methods.withdraw(chain.swap.tokenInAmount).encodeABI()
            }
        }
    }

    // Get best router swap

    const swaps = await Promise.all(routers.map(router => router.getSwap(chain, account)))
    console.log(swaps)
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