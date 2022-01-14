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

    try {
        // Find best router quote

        const best = await getBestRouterQuote(chain, routers, BN)
        return {
            id: routerData.id,
            routerId: best.router,
            name: routers[best.router].name,
            out: best.out,
            priority: true
        }
    } catch(error) {
        console.error(error)
        return none
    }
}

// Get swap

async function getSwap(chain, account, BN) {
    // No swap

    const none = {
        router: routerData,
        out: false
    }

    // Check swap parameters

    if (!chain.swapSettings.routers[routerData.id].enabled) return none
    const routers = swapRouters[chain.id]
    if (!Object.keys(routers).length) return none
    const swap = chain.swap

    try {
        // Find best router quote

        const best = await getBestRouterQuote(chain, routers, BN)
        if (best.out.isZero()) return none

        // Calculate swap parameters

        return {
            router: {
                id: routerData.id,
                routerId: best.router,
                name: routers[best.router].name
            },
            in: swap.tokenInAmount,
            out: best.out,
            tx: {
                from: account,
                to: routers[best.router].address,
                data: encodeSwapData(chain, account, routers[best.router], swap.tokenIn.address, swap.tokenOut.address, swap.tokenInAmount, best.out, BN)
            }
        }
    } catch(error) {
        console.error(error)
        return none
    }
}

// Get best router quote

async function getBestRouterQuote(chain, routers, BN) {
    // Get router quotes

    const quotes = await Promise.all(Object.keys(routers).map(async router => {
        return {
            router,
            out: BN(await getAmountOut(chain, routers[router], chain.swap.tokenIn.address, chain.swap.tokenOut.address, chain.swap.tokenInAmount))
        }
    }))

    // Find best router quote

    let best = quotes[0]
    for (let q = 1; q < quotes.length; q ++) {
        if (quotes[q].out.gt(best.out)) {
            best = quotes[q]
        }
    }
    return best
}

// Query router for amount out

async function getAmountOut(chain, router, tokenIn, tokenOut, amount) {
    try {
        // Encode calldata

        const signature = chain.web3.eth.abi.encodeFunctionSignature("getAmountsOut(uint256,address[])")
        const calldata = chain.web3.eth.abi.encodeParameters(["uint256", "address[]"], [
            amount,
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

// Encode swap data on router

function encodeSwapData(chain, account, router, tokenIn, tokenOut, amountIn, amountOut, BN) {
    // Calculate swap data

    const amountOutMin = amountOut.mul(BN(10 ** 4 - chain.swapSettings.slippage * 100)).div(BN(10).pow(BN(4)))
    const path = [
        tokenIn === "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE" ? chain.WETH._address : tokenIn,
        tokenOut === "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE" ? chain.WETH._address : tokenOut
    ]
    const deadline = BN(2).pow(BN(256)).sub(BN(1))

    if (tokenIn === "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE") {
        // Swap exact ETH for tokens

        const signature = chain.web3.eth.abi.encodeFunctionSignature(`swapExact${router.ETH}ForTokens(uint256,address[],address,uint256)`)
        const calldata = chain.web3.eth.abi.encodeParameters(["uint256", "address[]", "address", "uint256"], [
            amountOutMin,
            path,
            account,
            deadline
        ])
        return `${signature}${calldata.slice(2)}`
    } else if (tokenOut === "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE") {
        // Swap exact tokens for ETH

        const signature = chain.web3.eth.abi.encodeFunctionSignature(`swapExactTokensFor${router.ETH}(uint256,uint256,address[],address,uint256)`)
        const calldata = chain.web3.eth.abi.encodeParameters(["uint256", "uint256", "address[]", "address", "uint256"], [
            amountIn,
            amountOutMin,
            path,
            account,
            deadline
        ])
        return `${signature}${calldata.slice(2)}`
    } else {
        // Swap exact tokens for tokens

        const signature = chain.web3.eth.abi.encodeFunctionSignature(`swapExactTokensForTokens(uint256,uint256,address[],address,uint256)`)
        const calldata = chain.web3.eth.abi.encodeParameters(["uint256", "uint256", "address[]", "address", "uint256"], [
            amountIn,
            amountOutMin,
            path,
            account,
            deadline
        ])
        return `${signature}${calldata.slice(2)}`
    }
}

// Exports

export { quote, getSwap }