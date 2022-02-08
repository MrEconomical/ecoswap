// Files and modules

import routerList from "../data/routers.json"
import ERC20ABI from "../abis/ERC20.json"
import ThemeContext from "../state/ThemeContext.js"
import EthereumContext from "../state/EthereumContext.js"
import SwapInput from "./SwapInput.jsx"
import TokenSelect from "./TokenSelect.jsx"
import quoteSwap from "../swap/quote.js"
import getSwap from "../swap/swap.js"
import { parse, format } from "../helpers/number.js"
import { useState, useEffect, useContext, useRef } from "react"

// Swap interface component

const SwapInterface = () => {
    // Swap data

    const { theme } = useContext(ThemeContext)
    const { enabled, web3, chain, account, BN } = useContext(EthereumContext)
    const swap = chain.swap
    const [ swapButtonText, setSwapButtonText ] = useState("Swap Tokens")

    const tokenIn = useRef(swap.tokenIn ? swap.tokenIn.address : null)
    const amountIn = useRef(swap.tokenInAmount)
    const tokenOut = useRef(swap.tokenOut ? swap.tokenOut.address : null)
    const updateTimeout = useRef()
    const quoteStart = useRef()
    const swapPending = useRef(false)
    const ethereumState = useRef({
        chainId: chain.id,
        account
    })

    // Set max token amount

    function setMax() {
        if (!swap.tokenIn) return
        const balance = chain.tokenBalances[swap.tokenIn.address]
        if (balance.gt(BN(0))) {
            document.getElementById("swap-input").value = format(parse(balance, swap.tokenIn.decimals), swap.tokenIn.decimals)
            swap.setTokenInAmount(balance)
        }
    }

    // Switch input and output tokens

    function switchTokens() {
        const newInput = swap.tokenOut
        swap.setTokenOut(swap.tokenIn ? {...swap.tokenIn} : null)
        if (newInput) {
            if (swap.tokenInAmount) {
                swap.setTokenInAmount(swap.tokenInAmount.mul(BN(10).pow(BN(newInput.decimals))).div(BN(10).pow(BN(swap.tokenIn.decimals))))
            }
            swap.setTokenIn({...newInput})
        } else {
            swap.setTokenInAmount(null)
            swap.setTokenIn(null)
        }
        swap.setTokenOutAmount("...")
    }

    // Calculate swap info

    function getSwapInfo(reverse) {
        if (reverse) {
            if (!swap.tokenOut) {
                return `1 ... = ...`
            } else if (!swap.tokenIn) {
                return `1 ${swap.tokenOut.symbol} = ...`
            } else if (!swap.tokenInAmount || !web3.utils.isBN(swap.tokenOutAmount)) {
                return `1 ${swap.tokenOut.symbol} = ... ${swap.tokenIn.symbol}`
            } else {
                const ratio = swap.tokenInAmount.mul(BN(10).pow(BN(swap.tokenOut.decimals))).mul(BN(10).pow(BN(18))).div(swap.tokenOutAmount).div(BN(10).pow(BN(swap.tokenIn.decimals)))
                return `1 ${swap.tokenOut.symbol} = ${format(parse(ratio, 18))} ${swap.tokenIn.symbol}`
            }
        } else {
            if (!swap.tokenIn) {
                return `1 ... = ...`
            } else if (!swap.tokenOut) {
                return `1 ${swap.tokenIn.symbol} = ...`
            } else if (!swap.tokenInAmount || !web3.utils.isBN(swap.tokenOutAmount)) {
                return `1 ${swap.tokenIn.symbol} = ... ${swap.tokenOut.symbol}`
            } else {
                const ratio = swap.tokenOutAmount.mul(BN(10).pow(BN(swap.tokenIn.decimals))).mul(BN(10).pow(BN(18))).div(swap.tokenInAmount).div(BN(10).pow(BN(swap.tokenOut.decimals)))
                return `1 ${swap.tokenIn.symbol} = ${format(parse(ratio, 18))} ${swap.tokenOut.symbol}`
            }
        }
    }

    // Update swap quote

    async function updateQuote() {
        try {
            quoteStart.current = {
                in: swap.tokenIn ? swap.tokenIn.address : null,
                inAmount: swap.tokenInAmount,
                out: swap.tokenOut ? swap.tokenOut.address : null
            }
            const updates = await quoteSwap(chain, BN)
            if (
                swap.tokenIn &&
                swap.tokenIn.address === quoteStart.current.in &&
                swap.tokenInAmount &&
                swap.tokenInAmount.eq(quoteStart.current.inAmount) &&
                swap.tokenOut &&
                swap.tokenOut.address === quoteStart.current.out
            ) {
                swap.setTokenOutAmount(updates.tokenOutAmount)
                swap.setRouters(updates.routers)
            }
        } catch(error) {
            console.error(error)
        }
    }

    // Reset router quotes

    function resetRouterQuotes() {
        swap.setRouters(routerList)
    }

    // Swap tokens

    async function swapTokens() {
        // Get swap transaction data

        if (!enabled || !account || !swap.tokenIn || !swap.tokenOut || !swap.tokenInAmount) return
        if (chain.tokenBalances[swap.tokenIn.address].lt(swap.tokenInAmount)) return
        swap.setTokenOutAmount("...")
        resetRouterQuotes()
        const swapData = await getSwap(chain, account, BN)
        if (!swapData) return

        // Check approval

        if (
            swap.tokenIn.address !== "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE" &&
            (swap.tokenIn.address !== chain.WETH._address || swap.tokenOut.address !== "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE")
        ) {
            const Token = new chain.web3.eth.Contract(ERC20ABI, swap.tokenIn.address)
            const approved = BN(await Token.methods.allowance(account, swapData.tx.to).call())

            if (approved.lt(swap.tokenInAmount)) {
                // Prompt token approve

                setSwapButtonText(`Approve ${swap.tokenIn.symbol} on ${swapData.router.name}`)
                try {
                    const approveTx = await ethereum.request({
                        method: "eth_sendTransaction",
                        params: [{
                            from: account,
                            to: Token._address,
                            data: Token.methods.approve(swapData.tx.to, BN(2).pow(BN(256)).sub(BN(1))).encodeABI(),
                            ...chain.gasPrice.getGasParameters(chain.swapSettings.gas[chain.id], BN)
                        }]
                    })

                    setSwapButtonText(`Approve ${swap.tokenIn.symbol} on ${swapData.router.name}...`)
                    const sent = Date.now()
                    const interval = setInterval(async () => {
                        try {
                            // Poll approve transaction

                            if (chain.id !== ethereumState.current.chainId || account !== ethereumState.current.account) {
                                clearInterval(interval)
                                return
                            }

                            const transaction = await chain.web3.eth.getTransactionReceipt(approveTx)
                            if (!transaction) {
                                if (Date.now() - sent < 60000) return
                                clearInterval(interval)
                                setSwapButtonText("Swap Tokens")
                            } else if (transaction.status || transaction.status === false) {
                                clearInterval(interval)
                                setSwapButtonText("Swap Tokens")
                            }
                        } catch(error) {
                            console.error(error)
                        }
                    }, 500)
                } catch(error) {
                    console.error(error)
                }
                setSwapButtonText("Swap Tokens")
                return
            }
        }

        // Set wrap and unwrap ETH button text

        if (
            swap.tokenIn.address === "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE" &&
            swap.tokenOut.address === chain.WETH._address
        ) {
            setSwapButtonText("Wrap")
        } else if (
            swap.tokenIn.address === chain.WETH._address &&
            swap.tokenOut.address === "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE"
        ) {
            setSwapButtonText("Unwrap")
        }

        // Send swap transaction

        swapPending.current = true
        try {
            await ethereum.request({
                method: "eth_sendTransaction",
                params: [{
                    ...swapData.tx,
                    value: swap.tokenIn.address === "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE" ? BN(swapData.in).toString(16) : 0,
                    ...chain.gasPrice.getGasParameters(chain.swapSettings.gas[chain.id], BN)
                }]
            })
        } catch(error) {
            console.error(error)
        }
        swapPending.current = false
        setSwapButtonText("Swap Tokens")
    }

    // Update swap data on token changes

    useEffect(() => {
        clearTimeout(updateTimeout.current)
        if (!swap.tokenIn || !swap.tokenInAmount || !swap.tokenOut) {
            swap.setTokenOutAmount(null)
            resetRouterQuotes()
            tokenIn.current = swap.tokenIn ? swap.tokenIn.address : null
            amountIn.current = swap.tokenInAmount
            tokenOut.current = swap.tokenOut ? swap.tokenOut.address : null
            return
        }

        if (swap.tokenIn.address === tokenIn.current && swap.tokenInAmount.eq(BN(amountIn.current)) && swap.tokenOut.address === tokenOut.current) return
        swap.setTokenOutAmount("...")
        resetRouterQuotes()

        if (swap.tokenIn.address !== tokenIn.current || swap.tokenOut.address !== tokenOut.current) {
            updateQuote()
        } else {
            updateTimeout.current = setTimeout(updateQuote, 300)
        }
        
        tokenIn.current = swap.tokenIn.address
        amountIn.current = swap.tokenInAmount
        tokenOut.current = swap.tokenOut.address
    }, [swap.tokenIn, swap.tokenInAmount, swap.tokenOut])

    // Refresh quotes on interval

    useEffect(() => {
        const interval = setInterval(() => {
            if (swap.tokenIn && swap.tokenInAmount && swap.tokenOut && !swapPending.current) {
                updateQuote()
            }
        }, 3000)
        return () => clearInterval(interval)
    }, [swap.tokenIn, swap.tokenInAmount, swap.tokenOut])

    // Update swap button text on Ethereum state changes

    useEffect(() => {
        ethereumState.current = {
            chainId: chain.id,
            account
        }
        setSwapButtonText("Swap Tokens")
    }, [chain, account])

    // Component

    return (
        <>
            <div className="interface">
                <div className="header">
                    <button className="max-token" onClick={setMax}>Max {swap.tokenIn && chain.tokenBalances[swap.tokenIn.address] ? format(parse(chain.tokenBalances[swap.tokenIn.address], swap.tokenIn.decimals)) : "..."}</button>
                    <div className="label">Input Token</div>
                </div>
                <div className="token-section">
                    <SwapInput></SwapInput>
                    <TokenSelect label="Input Token" type="input"></TokenSelect>
                </div>
                <div className="middle">
                    <button className="switch" onClick={switchTokens}>
                        <img className="arrows" src="/icons/switch.svg"></img>
                    </button>
                    <div className="label output-label">Output Token</div>
                </div>
                <div className="token-section">
                    <input className="output" value={swap.tokenOut && swap.tokenOutAmount ? typeof swap.tokenOutAmount === "string" ? swap.tokenOutAmount : format(parse(swap.tokenOutAmount, swap.tokenOut.decimals)) : ""} readOnly></input>
                    <TokenSelect label="Output Token" type="output"></TokenSelect>
                </div>
                <button className="swap" onClick={swapTokens}>{swapButtonText}</button>
                <div className="swap-info">{getSwapInfo()}</div>
                <div className="swap-info" style={{ marginBottom: "0" }}>{getSwapInfo(true)}</div>
            </div>
            <style jsx>{`
                .interface {
                    position: relative;
                    width: 332px;
                    display: flex;
                    flex-direction: column;
                    justify-content: flex-start;
                    align-items: flex-start;
                    border-right: 0.5px solid var(--gray);
                    padding: 32px 32px 32px 0;
                    margin-right: 32px;
                }

                .header {
                    width: 100%;
                    display: flex;
                    flex-direction: row;
                    justify-content: flex-start;
                    align-items: flex-end;
                    margin-bottom: 12px;
                }

                .max-token {
                    color: var(--dark-gray);
                }

                .max-token:hover {
                    text-decoration: underline;
                }

                .label {
                    position: relative;
                    color: var(--dark-gray);
                    margin-top: auto;
                    margin-left: auto;
                }

                .token-section {
                    width: 100%;
                    display: flex;
                    flex-direction: row;
                    justify-content: flex-start;
                    align-items: center;
                }

                .middle {
                    width: 100%;
                    display: flex;
                    flex-direction: row;
                    justify-content: flex-start;
                    align-items: center;
                    margin: 24px 0;
                }

                .switch {
                    width: 40px;
                    height: 40px;
                    display: flex;
                    flex-direction: row;
                    justify-content: center;
                    align-items: center;
                    border: 1px solid var(--light-dark);
                    border-radius: 20px;
                }

                .switch:hover {
                    background-color: var(--light);
                }

                .arrows {
                    width: 20px;
                    height: 20px;
                    object-fit: contain;
                    filter: ${theme === "dark" ? "invert(1)" : "none"};
                }

                .switch:hover .arrows {
                    filter: none;
                }

                .output-label {
                    top: 12px;
                }

                .output {
                    width: 45%;
                    min-height: calc(1.44rem + 18px);
                    font-size: 1.2rem;
                    background-color: var(--input-background);
                    border: 1px solid var(--light-gray);
                    border-radius: 8px;
                    padding: 8px 12px;
                    margin-right: 5%;
                }

                .swap {
                    width: 100%;
                    font-size: 1.1rem;
                    text-align: center;
                    color: var(--base-black);
                    background-color: var(--light);
                    border: 1px solid var(--background);
                    border-radius: 8px;
                    padding: 12px 0;
                    margin: 24px 0;
                }

                .swap:hover {
                    border: 1px solid var(--light-dark);
                }

                .swap-info {
                    margin-bottom: 6px;
                }

                @media only screen and (max-width: 1000px), (max-height: 900px) {
                    .interface {
                        width: 280px;
                        padding: 24px 24px 24px 0;
                        margin-right: 24px;
                    }

                    .header {
                        margin-bottom: 8px;
                    }

                    .middle {
                        margin: 16px 0;
                    }

                    .output-label {
                        top: 8px;
                    }

                    .swap {
                        margin: 16px 0;
                    }
                }

                @media only screen and (max-width: 800px), (max-height: 800px) {
                    .interface {
                        padding: 20px 20px 20px 0;
                        margin-right: 20px;
                    }
                }

                @media only screen and (max-width: 700px) {
                    .interface {
                        width: 290px;
                        padding: 0;
                        border-right: none;
                        margin-right: 0;
                    }
                }
            `}</style>
        </>
    )
}

// Exports

export default SwapInterface