// Files and modules

import routerList from "../../data/routers.json"
import swapRouters from "../../data/swap-routers.json"

const routerData = routerList.find(router => router.id === "direct")

// Quote swap

async function quote(chain, BN) {
    // No quote

    const none = {
        ...routerData,
        out: false
    }

    // Check swap parameters

    if (!chain.swapSettings.routers[routerData.id].enabled) return none
    const routers = swapRouters[chain.id]
    if (!Object.keys(routers).length) return none
    const swap = chain.swap

    try {
        // Get router quotes

        const quotes = await Promise.all(Object.keys(routers).map(async router => {
            return {
                router,
                out: BN(await getAmountOut(chain, routers[router], swap.tokenIn.address, swap.tokenOut.address, swap.tokenInAmount))
            }
        }))

        // Find best router quote

        let best = 0
        for (let q = 1; q < quotes.length; q ++) {
            if (quotes[q].out.gt(quotes[best].out)) {
                best = q
            }
        }
        return {
            id: routerData.id,
            routerId: quotes[best].router,
            name: routers[quotes[best].router].name,
            out: quotes[best].out
        }
    } catch(error) {
        console.error(error)
        return none
    }
}

// Get swap

async function getSwap(chain, account, BN) {
    return
}

// Query router for amount out

async function getAmountOut(chain, router, tokenIn, tokenOut, amount) {
    try {
        // Encode calldata

        const signature = chain.web3.eth.abi.encodeFunctionSignature("getAmountsOut(uint256,address[])")
        const calldata = chain.web3.eth.abi.encodeParameters(["uint256", "address[]"], [amount,
            [
                tokenIn === "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE" ? chain.WETH._address : tokenIn,
                tokenOut === "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE" ? chain.WETH._address : tokenOut
            ]
        ])

        // Call estimate

        const result = await chain.web3.eth.call({
            to: router.address,
            data: `${signature}${calldata.slice(2)}`
        })
        return chain.web3.eth.abi.decodeParameter("uint256[]", result)[1]
    } catch {
        return 0
    }
}

// Exports

export { quote, getSwap }