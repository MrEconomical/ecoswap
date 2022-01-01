// Files and modules

import ERC20ABI from "../abis/ERC20"
import { parse, unparse, format, formatNumber } from "../helpers/number"
import ThemeContext from "../state/ThemeContext"
import WindowSizeContext from "../state/WindowSizeContext"
import EthereumContext from "../state/EthereumContext"
import PriceContext from "../state/PriceContext"
import quoteSwap from "../swap/quote"
import getSwap from "../swap/swap"
import { useContext, useEffect, useState, useRef } from "react"

// Swap input component

const SwapInput = () => {
    // Swap data

    const { chain, BN } = useContext(EthereumContext)
    const inputBefore = useRef("")

    // Format swap input on change

    function handleChange(event) {
        // Update token input state

        const value = !event.target.value || /^[0-9,.]+$/g.test(event.target.value) ? event.target.value : inputBefore.current
        if (chain.swap.tokenIn && value) {
            const amount = BN(unparse(value, chain.swap.tokenIn.decimals))
            chain.swap.setTokenInAmount(amount.eq(BN(0)) ? null : amount)
        } else {
            chain.swap.setTokenInAmount(null)
        }

        // Dynamic input

        if (event.target.value === "") return
        if (!/^[0-9,.]+$/g.test(event.target.value)) {
            event.target.value = inputBefore.current
            return
        }
        let insert = 0
        while (event.target.value[insert] === inputBefore.current[insert]) {
            insert ++
            if (!event.target.value[insert] && !inputBefore.current[insert]) break
        }
        if (!event.target.value.endsWith(".")) {
            if (event.target.value.includes(".")) {
                event.target.value = format(event.target.value, event.target.value.length - event.target.value.indexOf(".") - 1)
            } else {
                event.target.value = format(event.target.value, 0)
            }
        }
        if (event.target.value.length === 1) {
            event.target.selectionEnd = 1
        } else {
            let count = 0
            for (let c = 0; c < insert; c ++) {
                if (inputBefore.current[c] === ",") {
                    count ++
                }
            }
            for (let c = 0; c < event.target.value.length; c ++) {
                if (count === insert) {
                    if ((!event.target.value.endsWith(".") && event.target.value[c] === ".") || event.target.value.length < inputBefore.current.length) {
                        event.target.selectionEnd = c
                    } else {
                        event.target.selectionEnd = c + 1
                    }
                    break
                }
                if (event.target.value[c] !== "," && event.target.value[c] !== ".") {
                    count ++
                }
            }
        }
        inputBefore.current = event.target.value
    }

    // Update token amount on token change

    useEffect(() => {
        const value = document.getElementById("swap-input").value
        if (chain.swap.tokenIn && value) {
            const amount = BN(unparse(value, chain.swap.tokenIn.decimals))
            chain.swap.setTokenInAmount(amount.eq(BN(0)) ? null : amount)
        } else {
            chain.swap.setTokenInAmount(null)
        }
    }, [chain.swap.tokenIn])

    // Reset input on chain change

    useEffect(() => {
        chain.swap.setTokenInAmount(null)
        document.getElementById("swap-input").value = ""
    }, [chain])

    // Component

    return (
        <>
            <input id="swap-input" className="input" onChange={handleChange}></input>
            <style jsx>{`
                .input {
                    width: 45%;
                    font-size: 1.2rem;
                    outline: none;
                    background-color: var(--input-background);
                    border: 1px solid var(--light-gray);
                    border-radius: 8px;
                    padding: 8px 12px;
                    margin-right: 5%;
                }

                .input:focus {
                    border: 1px solid var(--gray);
                }
            `}</style>
        </>
    )
}

// Token selection component

const TokenSelect = ({ label, type }) => {
    // Token selection menu data

    const { theme } = useContext(ThemeContext)
    const { web3, chain, account, BN } = useContext(EthereumContext)
    const activeToken = chain.swap[type === "input" ? "tokenIn" : "tokenOut"]
    const setActiveToken = chain.swap[type === "input" ? "setTokenIn" : "setTokenOut"]
    const oppositeToken = chain.swap[type === "input" ? "tokenOut" : "tokenIn"]
    const setOppositeToken = chain.swap[type === "input" ? "setTokenOut" : "setTokenIn"]
    const [ menuActive, setMenuActive ] = useState(false)
    const [ tokenList, setTokenList ] = useState(chain.tokens)

    // Update token search with query

    function updateTokenList(event) {
        const query = event.target.value.toLowerCase()
        if (!query) return setTokenList(chain.tokens.filter(token => oppositeToken ? token.address !== oppositeToken.address : true))
        const tokens = chain.tokens.filter(token => (oppositeToken ? token.address !== oppositeToken.address : true) &&
                                                    (token.name.toLowerCase().includes(query) ||
                                                    token.symbol.toLowerCase().includes(query) ||
                                                    token.address.toLowerCase() === query))
        tokens.sort((a, b) => {
            // Sort tokens by address

            if (a.address.toLowerCase() === query) {
                return -1
            } else if (b.address.toLowerCase() === query) {
                return 1
            }

            // Sort tokens by index of match

            const nameA = a.name.toLowerCase()
            const symbolA = a.symbol.toLowerCase()
            const nameB = b.name.toLowerCase()
            const symbolB = b.symbol.toLowerCase()
            if ((symbolA.includes(query) && !symbolB.includes(query)) || (nameA.includes(query) && !nameB.includes(query))) return -1
            if ((symbolB.includes(query) && !symbolA.includes(query)) || (nameB.includes(query) && !nameA.includes(query))) return 1
            if (symbolA.includes(query) && symbolB.includes(query)) {
                return symbolA.indexOf(query) < symbolB.indexOf(query) ? -1 : 1
            } else {
                return nameA.indexOf(query) < nameB.indexOf(query) ? -1 : 1
            }
        })
        setTokenList(tokens)
        if (web3.utils.isAddress(query) && !chain.tokens.find(token => token.address.toLowerCase() === query)) {
            addExternalToken(query, tokens)
        }
    }

    // Add external token to token list

    async function addExternalToken(address, tokenList) {
        const Token = new chain.web3.eth.Contract(ERC20ABI, address)
        let name, symbol, decimals, balance
        try {
            [ name, symbol, decimals, balance ] = await Promise.all([
                Token.methods.name().call()
                    .catch(async () => {
                        return web3.utils.toAscii(await chain.web3.eth.call({
                            to: Token._address,
                            data: Token.methods.name().encodeABI()
                        })).replace(/\0/g, "")
                    }),
                Token.methods.symbol().call()
                    .catch(async () => {
                        return web3.utils.toAscii(await chain.web3.eth.call({
                            to: Token._address,
                            data: Token.methods.symbol().encodeABI()
                        })).replace(/\0/g, "")
                    }),
                Token.methods.decimals().call(),
                account ? Token.methods.balanceOf(account).call() : 0,
            ])
        } catch {
            return
        }
        chain.setTokenBalances({
            ...chain.tokenBalances,
            [Token._address]: BN(balance)
        })
        setTokenList([...tokenList, {
            external: true,
            added: false,
            name,
            symbol,
            address: Token._address,
            decimals: +decimals
        }])
    }

    // Switch to selected token

    function switchToken(event, newToken) {
        for (const element of event.nativeEvent.path || event.nativeEvent.composedPath()) {
            if (element.classList && element.classList.contains("token-control")) return
        }
        if (chain.tokens.find(token => token.address === newToken.address)) {
            setActiveToken({...newToken})
            setTokenList(chain.tokens.filter(token => oppositeToken ? token.address !== oppositeToken.address : true))
        } else {
            const tokens = [...chain.tokens, newToken]
            chain.setTokens(tokens)
            setActiveToken({...newToken})
            setTokenList(tokens.filter(token => oppositeToken ? token.address !== oppositeToken.address : true))
        }
        setMenuActive(false)
    }

    // Add external token to token list

    function addToken(newToken) {
        const tokens = [...chain.tokens]
        const existing = tokens.find(token => token.address === newToken.address)
        if (existing) {
            existing.added = true
            if (activeToken && activeToken.address === newToken.address) {
                setActiveToken({...newToken})
            } else if (oppositeToken && oppositeToken.address === newToken.address) {
                setOppositeToken({...newToken})
            }
        } else {
            newToken.added = true
            tokens.push(newToken)
        }
        chain.setTokens(tokens)
    }

    // Remove external token from token list

    function removeToken(oldToken) {
        if (activeToken.address === oldToken.address) {
            setActiveToken(null)
        } else if (oppositeToken.address == oldToken.address) {
            setOppositeToken(null)
        }
        const tokenListIndex = tokenList.findIndex(token => token.address === oldToken.address)
        setTokenList(tokenList.slice(0, tokenListIndex).concat(tokenList.slice(tokenListIndex + 1)))
        const chainTokensIndex = chain.tokens.findIndex(token => token.address === oldToken.address)
        chain.setTokens(chain.tokens.slice(0, chainTokensIndex).concat(chain.tokens.slice(chainTokensIndex + 1)))
    }

    // Update token list on data changes

    useEffect(() => {
        setTokenList(chain.tokens.filter(token => oppositeToken ? token.address !== oppositeToken.address : true))
    }, [chain, oppositeToken])

    // Hide menu on chain or account changes

    useEffect(() => {
        setMenuActive(false)
    }, [chain, account])

    // Remove unselected external tokens from token balances on menu changes

    useEffect(() => {
        if (menuActive) return
        const balances = {...chain.tokenBalances}
        for (const address in balances) {
            if (!chain.tokens.find(token => address === token.address)) {
                delete balances[address]
            }
        }
        chain.setTokenBalances(balances)
    }, [menuActive])

    // Component

    return (
        <>
            <button className="select" onClick={() => setMenuActive(true)}>
                {activeToken ? activeToken.symbol.length > 9 ? `${activeToken.symbol.slice(0, 8)}...` : activeToken.symbol : "Choose"}
                <img className="arrow" src="/icons/arrow-down.svg"></img>
            </button>
            {menuActive ? (
                <div className="menu">
                    <div className="header">
                        <div>Select {label}</div>
                        <button className="exit" onClick={() => setMenuActive(false)}>
                            <img className="exit-icon" src="/icons/exit.svg"></img>
                        </button>
                    </div>
                    <div className="token-search">
                        <img className="search-icon" src="/icons/search.svg"></img>
                        <input className="search" onChange={updateTokenList}></input>
                    </div>
                    <div className="tokens">
                        {tokenList.map(token => (
                            <button className="token" key={`${chain.id}-${type}-${token.address}`} onClick={event => switchToken(event, token)}>
                                <img className="icon" src={`/tokens/${token.default ? token.symbol : "unknown"}.svg`}></img>
                                <div className="info">
                                    <div className="name">{token.name} - {token.symbol}</div>
                                    <div className="token-menu">
                                        <div className="balance">
                                            {chain.tokenBalances[token.address] ? format(parse(chain.tokenBalances[token.address], token.decimals)) : "0"}
                                        </div>
                                        {token.external ? token.added ? (
                                            <div className="token-control" onClick={() => removeToken(token)}>- Remove</div>
                                        ) : (
                                            <div className="token-control" onClick={() => addToken(token)}>+ Add</div>
                                        ) : <></>}
                                    </div>
                                </div>
                            </button>
                        ))}
                    </div>
                </div>
             ) : <></>}
            <style jsx>{`
                .select {
                    display: flex;
                    flex-direction: row;
                    justify-content: flex-end;
                    align-items: center;
                    font-size: 1.2rem;
                    overflow: hidden;
                    margin-left: auto;
                    padding: 9px 0;
                }

                .arrow {
                    width: 0.9rem;
                    height: 0.9rem;
                    object-fit: contain;
                    filter: ${theme === "dark" ? "invert(1)" : "none"};
                    margin-left: 8px;
                }

                .menu {
                    position: absolute;
                    top: 32px;
                    left: 0;
                    width: calc(100% - 32px);
                    height: calc(100% - 64px);
                    z-index: 1;
                    background-color: var(--background);
                }

                .header {
                    display: flex;
                    flex-direction: row;
                    justify-content: flex-start;
                    align-items: center;
                    margin-bottom: 16px;
                }

                .exit {
                    width: 0.75rem;
                    height: 0.75rem;
                    margin-left: auto;
                }

                .exit-icon {
                    width: 100%;
                    height: 100%;
                    object-fit: contain;
                    filter: ${theme === "dark" ? "invert(1)" : "none"};
                }

                .token-search {
                    display: flex;
                    flex-direction: row;
                    justify-content: flex-start;
                    align-items: center;
                    margin-bottom: 16px;
                }

                .search-icon {
                    width: 0.75rem;
                    height: 0.75rem;
                    object-fit: contain;
                    filter: ${theme === "dark" ? "invert(1)" : "none"};
                    margin-right: 16px;
                }

                .search {
                    width: 100%;
                    outline: none;
                    background-color: var(--input-background);
                    border: 1px solid var(--light-gray);
                    border-radius: 8px;
                    padding: 6px 8px;
                }

                .search:focus {
                    border: 1px solid var(--gray);
                }

                .tokens {
                    width: 100%;
                    height: calc(100% - 1.2rem - 16px - 1rem - 14px - 16px - 1px);
                    display: flex;
                    flex-direction: column;
                    justify-content: flex-start;
                    align-items: flex-start;
                    overflow: auto;
                }

                .token {
                    width: calc(100% - 8px);
                    display: flex;
                    flex-direction: row;
                    justify-content: flex-start;
                    align-items: center;
                    border: 1px solid var(--background);
                    border-radius: 8px;
                    padding: 12px;
                    margin-left: 4px;
                    margin-right: 4px;
                }

                .token:hover {
                    border: 1px solid var(--light-dark);
                }

                .icon {
                    width: 2.5rem;
                    height: 2.5rem;
                    object-fit: contain;
                    margin-right: 16px;
                }

                .info {
                    display: flex;
                    flex-direction: column;
                    justify-content: flex-start;
                    align-items: flex-start;
                    flex: 1;
                }

                .name {
                    text-align: left;
                    margin-bottom: 3px;
                }

                .token-menu {
                    width: 100%;
                    display: flex;
                    flex-direction: row;
                    justify-content: flex-start;
                    align-items: center;
                }

                .balance {
                    color: var(--gray);
                }

                .token-control {
                    margin-left: auto;
                }

                .token-control:hover {
                    text-decoration: underline;
                }

                @media only screen and (max-width: 1000px), (max-height: 900px) {
                    .menu {
                        top: 24px;
                        width: calc(100% - 24px);
                        height: calc(100% - 50px);
                    }

                    .icon {
                        margin-right: 12px;
                    }
                }

                @media only screen and (max-width: 800px), (max-height: 800px) {
                    .menu {
                        top: 20px;
                        width: calc(100% - 20px);
                        height: calc(100% - 42px);
                    }
                }

                @media only screen and (max-width: 700px) {
                    .menu {
                        top: 0;
                        left: 0;
                        width: 100%;
                        height: calc(100% - 2px);
                    }
                }
            `}</style>
        </>
    )
}

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
        const routers = [...swap.routers]
        for (const router of routers) {
            router.out = null
        }
        swap.setRouters(routers)
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

                setSwapButtonText(`Approve ${swap.tokenIn.symbol} on ${swapData.routerName}`)
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
                    setSwapButtonText(`Approve ${swap.tokenIn.symbol} on ${swapData.routerName}...`)
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
                            }
                            if (transaction.status || transaction.status === false) {
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
                    <button className="max-token" onClick={setMax}>Max {swap.tokenIn && chain.tokenBalances[swap.tokenIn.address] ? format(parse(chain.tokenBalances[swap.tokenIn.address], swap.tokenIn.decimals)) : "..."} {swap.tokenIn ? swap.tokenIn.symbol : ""}</button>
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
                    font-size: 1.2rem;
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

// Swap settings component

const SwapSettings = () => {
    // Swap settings data
    
    const { theme } = useContext(ThemeContext)
    const { web3, chain } = useContext(EthereumContext)
    const { width } = useContext(WindowSizeContext)
    const settings = chain.swapSettings
    const slippageInput = useRef("")
    const gasInput = useRef("")

    // Update slippage with slider value

    function updateSlippage(event) {
        settings.setSlippage(+event.target.value / 100)
    }

    // Set slippage with text input value

    function setSlippage(event) {
        if (isNaN(+event.target.value) || event.target.value.includes(" ")) {
            event.target.value = slippageInput.current
        }
        slippageInput.current = event.target.value
        if (+event.target.value <= 0 || event.target.value >= 50) return
        if (event.target.value.endsWith(".")) return
        settings.setSlippage(+event.target.value)
    }

    // Set gas value for chain

    function updateGas(value) {
        if (settings.gas[chain.id] === value) return
        settings.setGas({
            ...settings.gas,
            [chain.id]: value
        })
        document.getElementById("gas-input").value = ""
    }

    // Set gas with text input value

    function setGas(event) {
        if (isNaN(+event.target.value) || event.target.value.includes(" ")) {
            event.target.value = gasInput.current
        }
        gasInput.current = event.target.value
        if (+event.target.value <= 0) return
        if (event.target.value.endsWith(".")) return
        settings.setGas({
            ...settings.gas,
            [chain.id]: +event.target.value
        })
    }

    // Toggle router enabled

    function toggleRouter(router) {
        const routers = {...settings.routers}
        routers[router].enabled = !routers[router].enabled
        settings.setRouters(routers)
    }

    // Set referral address

    function setReferral() {
        const address = document.getElementById("referral-input").value
        if (web3.utils.isAddress(address)) {
            settings.setReferral(web3.utils.toChecksumAddress(address))
        }
    }

    // Clear referral address

    function clearReferral() {
        settings.setReferral(null)
    }

    // Component

    return (
        <>
            <div className="settings">
                {width > 550 ? (
                    <div className="top">
                        <div className="slippage-section">
                            <div className="section-title">
                                Slippage
                                <div className="title-value"> - {settings.slippage}%</div>
                            </div>
                            <div className="slippage-content">
                                <input id="slippage-slider" className="slippage-slider" type="range" min="10" max="200" value={settings.slippage * 100} onChange={updateSlippage}></input>
                                <input className="slippage-input" maxLength="5" onChange={setSlippage}></input>
                            </div>
                        </div>
                        <div className="gas-section">
                            <div className="section-title">
                                Gas Price
                                <div className="title-value"> - {typeof settings.gas[chain.id] === "number" ? `custom ${settings.gas[chain.id]}` : chain.gasPrice[settings.gas[chain.id]]} gwei</div>
                            </div>
                            <div className="gas-controls">
                                <div className="gas-switch" data-checked={settings.gas[chain.id] === "slow"} onClick={() => updateGas("slow")}></div>
                                <div className="gas-label">Slow</div>
                                <div className="gas-switch" data-checked={settings.gas[chain.id] === "default"} onClick={() => updateGas("default")}></div>
                                <div className="gas-label">Default</div>
                                <div className="gas-switch" data-checked={settings.gas[chain.id] === "fast"} onClick={() => updateGas("fast")}></div>
                                <div className="gas-label">Fast</div>
                                <input id="gas-input" className="gas-input" onChange={setGas}></input>
                            </div>
                        </div>
                    </div>
                ) : (
                    <>
                        <div className="slippage-section">
                            <div className="section-title">
                                Slippage
                                <div className="title-value"> - {settings.slippage}%</div>
                            </div>
                            <div className="slippage-content">
                                <input id="slippage-slider" className="slippage-slider" type="range" min="10" max="200" value={settings.slippage * 100} onChange={updateSlippage}></input>
                                <input className="slippage-input" maxLength="5" onChange={setSlippage}></input>
                            </div>
                        </div>
                        <div className="gas-section">
                            <div className="section-title">
                                Gas Price
                                <div className="title-value"> - {typeof settings.gas[chain.id] === "number" ? `custom ${settings.gas[chain.id]}` : chain.gasPrice[settings.gas[chain.id]]} gwei</div>
                            </div>
                            <div className="gas-controls">
                                <div className="gas-switch" data-checked={settings.gas[chain.id] === "slow"} onClick={() => updateGas("slow")}></div>
                                <div className="gas-label">Slow</div>
                                <div className="gas-switch" data-checked={settings.gas[chain.id] === "default"} onClick={() => updateGas("default")}></div>
                                <div className="gas-label">Default</div>
                                <div className="gas-switch" data-checked={settings.gas[chain.id] === "fast"} onClick={() => updateGas("fast")}></div>
                                <div className="gas-label">Fast</div>
                                <input id="gas-input" className="gas-input" onChange={setGas}></input>
                            </div>
                        </div>
                    </>
                )}
                <div className="section">
                    <div className="section-title">Aggregators</div>
                    <div className="routers">
                        {Object.keys(settings.routers).map(router => (
                            <div className="router" key={router}>
                                <div className="router-section router-title">
                                    <img className="router-icon" src={`/routers/${router}.svg`}></img>
                                    {settings.routers[router].name}
                                </div>
                                <div className="router-section">
                                    <div className="router-status">{settings.routers[router].enabled ? "Enabled" : "Disabled"}</div>
                                    <label className="switch">
                                        <input type="checkbox" checked={settings.routers[router].enabled} onChange={() => toggleRouter(router)}></input>
                                        <span className="slider"></span>
                                    </label>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
                <div className="section">
                    <div className="section-title referral-title">
                        Referral Address
                        <div className="title-value referral-value"> - {settings.referral ? width > 550 ? settings.referral : `${settings.referral.slice(0, 6)}...${settings.referral.slice(-4)}` : "None"}</div>
                    </div>
                    <div className="referral-label">Input address to receive swap surplus or other referral rewards from aggregators. Referral address will not work if it is the same as the account swapping tokens.</div>
                    <div className="referral">
                        <input id="referral-input" className="referral-input"></input>
                        <button className="referral-button" onClick={setReferral}>Set</button>
                        <button className="referral-button" onClick={clearReferral}>Clear</button>
                    </div>
                </div>
            </div>
            <style jsx>{`
                .settings {
                    width: calc(100% - 348px);
                    height: 100%;
                    display: flex;
                    flex-direction: column;
                    justify-content: flex-start;
                    align-items: flex-start;
                    gap: 32px;
                    padding-top: 32px;
                }

                .top {
                    width: 100%;
                    display: flex;
                    flex-direction: row;
                    justify-content: flex-start;
                    align-items: flex-start;
                }

                .slippage-section {
                    width: 40%;
                }

                .section-title {
                    display: flex;
                    flex-direction: row;
                    justify-content: flex-start;
                    align-items: center;
                    font-size: 1.2rem;
                    margin-bottom: 20px;
                }

                .title-value {
                    white-space: pre-wrap;
                    font-size: 1.2rem;
                    color: var(--dark-gray);
                }

                .slippage-content {
                    width: 100%;
                    display: flex;
                    flex-direction: row;
                    justify-content: flex-start;
                    align-items: center;
                }

                .slippage-slider {
                    width: 100%;
                    height: 1px;
                    appearance: none;
                    background-color: var(--light-gray);
                    outline: none;
                    margin-right: 24px;
                }

                .slippage-slider::-webkit-slider-thumb {
                    appearance: none;
                    width: 10px;
                    height: 25px;
                    cursor: pointer;
                    background-color: var(--light-dark);
                    border: 1px solid var(--background);
                }

                .slippage-input {
                    width: 3.75rem;
                    outline: none;
                    background-color: var(--input-background);
                    border: 1px solid var(--light-gray);
                    border-radius: 8px;
                    padding: 6px 8px;
                }

                .slippage-input:focus {
                    border: 1px solid var(--gray);
                }

                .gas-section {
                    width: calc(60% - 32px);
                    margin-left: 32px;
                }

                .gas-controls {
                    display: flex;
                    flex-direction: row;
                    justify-content: flex-start;
                    align-items: center;
                }

                .gas-switch {
                    width: 1rem;
                    height: 1rem;
                    flex-shrink: 0;
                    background-color: var(--light-gray);
                    border-radius: 4px;
                    margin-right: 8px;
                }

                .gas-switch[data-checked="true"] {
                    background-color: var(--light-dark);
                }

                .gas-label {
                    margin-right: 24px;
                }

                .gas-input {
                    width: 3.75rem;
                    outline: none;
                    background-color: var(--input-background);
                    border: 1px solid var(--light-gray);
                    border-radius: 8px;
                    padding: 6px 8px;
                }

                .gas-input:focus {
                    border: 1px solid var(--gray);
                }

                .section {
                    width: 100%;
                    display: flex;
                    flex-direction: column;
                    justify-content: flex-start;
                    align-items: flex-start;
                }

                .routers {
                    width: 100%;
                    display: grid;
                    grid-template-columns: repeat(3, 1fr);
                    grid-gap: 16px;
                }

                .router {
                    display: flex;
                    flex-direction: column;
                    justify-content: flex-start;
                    align-items: flex-start;
                }

                .router-section {
                    display: flex;
                    flex-direction: row;
                    justify-content: flex-start;
                    align-items: center;
                }

                .router-title {
                    font-size: 1.2rem;
                    margin-bottom: 12px;
                }

                .router-icon {
                    width: 1.2rem;
                    height: 1.2rem;
                    object-fit: contain;
                    margin-right: 12px;
                }

                .router-icon[src="/routers/0x.svg"] {
                    filter: ${theme === "dark" ? "invert(1)" : "none"};
                }

                .router-status {
                    min-width: 4.3rem;
                    color: var(--dark-gray);
                    margin-right: 16px;
                }

                .switch {
                    position: relative;
                    display: inline-block;
                    width: 3rem;
                    height: 1.2rem;
                }

                .switch input {
                    opacity: 0;
                    width: 0;
                    height: 0;
                }

                .slider {
                    position: absolute;
                    cursor: pointer;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background-color: var(--light-gray);
                    border-radius: 4px;
                }

                .slider:before {
                    position: absolute;
                    width: calc(1.2rem - 8px);
                    height: calc(1.2rem - 8px);
                    left: 5px;
                    bottom: 4px;
                    content: "";
                    outline: none;
                    background-color: ${theme === "dark" ? "#E6E9EE" : "#FFFFFF"};
                }

                input:checked + .slider {
                    background-color: var(--light-dark);
                }

                input:checked + .slider:before {
                    transform: translateX(calc(1.8rem - 2px));
                }

                .referral-title {
                    margin-bottom: 4px;
                }

                .referral-value {
                    font-size: 1rem;
                }

                .referral-label {
                    font-size: 0.75rem;
                    color: var(--dark-gray);
                    margin-bottom: 20px;
                }

                .referral {
                    width: 100%;
                    display: flex;
                    flex-direction: row;
                    justify-content: flex-start;
                    align-items: center;
                    gap: 16px;
                }

                .referral-input {
                    width: 60%;
                    outline: none;
                    font-size: 1rem;
                    background-color: var(--input-background);
                    border: 1px solid var(--light-gray);
                    border-radius: 8px;
                    padding: 6px 8px;
                }

                .referral-input:focus {
                    border: 1px solid var(--gray);
                }

                .referral-button {
                    font-size: 1rem;
                    border: 1px solid var(--light-dark);
                    border-radius: 8px;
                    padding: 6px 16px;
                }

                .referral-button:hover {
                    background-color: var(--light);
                    color: ${theme === "dark" ? "var(--base-black)" : "default"};
                }

                @media only screen and (max-width: 1000px), (max-height: 900px) {
                    .settings {
                        width: calc(100% - 304px);
                        gap: 24px;
                        padding-top: 24px;
                    }

                    .section-title {
                        margin-bottom: 16px;
                    }

                    .slippage-section {
                        width: 35%;
                    }

                    .slippage-slider {
                        margin-right: 16px;
                    }

                    .slippage-input {
                        padding: 4px 6px;
                    }

                    .gas-section {
                        width: calc(60% - 24px);
                        margin-left: 24px;
                    }

                    .gas-switch {
                        margin-right: 6px;
                    }

                    .gas-label {
                        margin-right: 16px;
                    }

                    .gas-input {
                        padding: 4px 6px;
                    }

                    .router-title {
                        margin-bottom: 8px;
                    }

                    .router-status {
                        margin-right: 12px;
                    }

                    .referral-title {
                        margin-bottom: 4px;
                    }

                    .referral-label {
                        margin-bottom: 16px;
                    }

                    .referral-input {
                        padding: 4px 6px;
                    }

                    .referral-button {
                        padding: 4px 16px;
                    }
                }

                @media only screen and (max-width: 800px), (max-height: 800px) {
                    .settings {
                        padding-top: 20px;
                    }

                    .gas-section {
                        width: calc(60% - 16px);
                        margin-left: 16px;
                    }

                    .gas-switch {
                        margin-right: 5px;
                    }

                    .gas-label {
                        margin-right: 12px;
                    }

                    .referral-label {
                        margin-bottom: 12px;
                    }
                }

                @media only screen and (min-width: 1000px) and (max-height: 900px) {
                    .gas-section {
                        width: calc(60% - 48px);
                        margin-left: 48px;
                    }
                }

                @media only screen and (min-width: 1000px) and (max-height: 800px) {
                    .gas-section {
                        width: calc(60% - 64px);
                        margin-left: 64px;
                    }
                }

                @media only screen and (max-width: 700px) {
                    .settings {
                        width: 100%;
                        padding-top: 0;
                    }
                }

                @media only screen and (max-width: 700px) {
                    .gas-section {
                        width: calc(60% - 64px);
                        margin-left: 64px;
                    }
                }

                @media only screen and (max-width: 550px) {
                    .settings {
                        width: 100%;
                    }

                    .slippage-section {
                        width: 100%;
                    }

                    .gas-section {
                        width: 100%;
                        margin-left: 0;
                    }

                    .gas-label {
                        margin-right: 16px;
                    }

                    .routers {
                        grid-template-columns: repeat(2, 1fr);
                    }

                    .referral {
                        gap: 12px;
                    }

                    .referral-input {
                        font-size: 0.9rem;
                    }

                    .referral-button {
                        font-size: 0.9rem;
                        padding: 4px 8px;
                    }
                }
            `}</style>
        </>
    )
}

// Router outputs component

const RouterOutputs = () => {
    // Swap data

    const { theme } = useContext(ThemeContext)
    const { chain } = useContext(EthereumContext)
    const prices = useContext(PriceContext)
    const { width } = useContext(WindowSizeContext)
    const swap = chain.swap

    // Get token value

    function getTokenValue(token, amount) {
        if (!prices[token.symbol]) return 0
        return +parse(amount, token.decimals) * prices[token.symbol]
    }

    // Component

    return (
        <>
            <div className="routers">
                <div className="title">Aggregator Quotes</div>
                {swap.routers.map(router => (
                    <div className="router" key={router.id}>
                        <div className="section">
                            <img className="icon" src={`/routers/${router.id}.svg`}></img>
                            <div className="router-name">{router.name}</div>
                        </div>
                        <div className="section">
                            {swap.tokenIn ? (
                                <img className="icon" src={swap.tokenIn.default ? `/tokens/${swap.tokenIn.symbol}.svg` : "/tokens/unknown.svg"}></img>
                            ) : <></>}
                            {`${swap.tokenIn && swap.tokenInAmount ? format(parse(swap.tokenInAmount, swap.tokenIn.decimals)) : "..."} `}
                            {swap.tokenIn && width > 550 ? swap.tokenIn.symbol : ""}
                            <div className="arrow">➔</div>
                            {swap.tokenOut ? (
                                <img className="icon" src={swap.tokenOut.default ? `/tokens/${swap.tokenOut.symbol}.svg` : "/tokens/unknown.svg"}></img>
                            ) : <></>}
                            {`${router.out === false || !chain.swapSettings.routers[router.id].enabled ? "—" : swap.tokenOut && router.out ? format(parse(router.out, swap.tokenOut.decimals)) : "..."} `}
                            {swap.tokenOut && width > 550 ? swap.tokenOut.symbol : ""}
                        </div>
                        <div className="section">
                            {router.out === false || !chain.swapSettings.routers[router.id].enabled ? "—" : swap.tokenOut && router.out ? swap.tokenOut.default ? `≈ $${formatNumber(getTokenValue(swap.tokenOut, router.out))}` : width > 550 ? "Price Unknown" : "Unknown" : "..."}
                        </div>
                    </div>
                ))}
            </div>
            <style jsx>{`
                .routers {
                    width: 100%;
                    display: flex;
                    flex-direction: column;
                    justify-content: flex-start;
                    align-items: flex-start;
                    border-top: 0.5px solid var(--gray);
                    padding-top: 32px;
                }

                .title {
                    font-size: 1.2rem;
                    margin-bottom: 16px;
                }

                .router {
                    width: 100%;
                    display: grid;
                    grid-template-columns: 2fr 5fr 3fr;
                    gap: 8px 16px;
                    padding: 24px 0;
                }

                .section {
                    display: flex;
                    flex-direction: row;
                    justify-content: flex-start;
                    align-items: center;
                    gap: 16px;
                    font-size: 1.2rem;
                }

                .icon {
                    width: 1.2rem;
                    height: 1.2rem;
                    object-fit: contain;
                }

                .icon[src="/routers/0x.svg"] {
                    filter: ${theme === "dark" ? "invert(1)" : "none"};
                }

                .arrow {
                    margin: 0 16px;
                }

                @media only screen and (max-width: 1000px), (max-height: 900px) {
                    .routers {
                        padding-top: 24px;
                    }

                    .title {
                        margin-bottom: 12px;
                    }

                    .router {
                        padding: 16px 0;
                    }
                }

                @media only screen and (max-width: 800px), (max-height: 800px) {
                    .routers {
                        padding-top: 20px;
                    }

                    .title {
                        margin-bottom: 10px;
                    }

                    .router {
                        padding: 12px 0;
                    }
                }

                @media only screen and (max-width: 700px) {
                    .routers {
                        padding-top: 0;
                        border-top: none;
                    }
                }

                @media only screen and (max-width: 550px) {
                    .router {
                        grid-template-columns: calc(1.2rem + 4px) 5fr 2fr;
                        gap: 12px;
                    }

                    .section {
                        gap: 8px;
                        font-size: 1rem;
                    }

                    .arrow {
                        margin: 0;
                    }

                    .router-name {
                        display: none;
                    }
                }
            `}</style>
        </>
    )
}

// Swap page

const Swap = () => {
    // Responsive window size

    const { width } = useContext(WindowSizeContext)

    // Component

    return (
        <>
            <div className="content">
                {width > 700 ? (
                    <>
                        <div className="top">
                            <SwapInterface></SwapInterface>
                            <SwapSettings></SwapSettings>
                        </div>
                        <RouterOutputs></RouterOutputs>
                    </>
                ) : (
                    <>
                        <SwapInterface></SwapInterface>
                        <div className="divider"></div>
                        <RouterOutputs></RouterOutputs>
                        <div className="divider"></div>
                        <SwapSettings></SwapSettings>
                        <div className="divider"></div>
                    </>
                )}
                <div className="disclaimer">Trading is risky! EcoSwap is not responsible for any trading losses or financial losses while using the app. DYOR before buying any token or making any trade to avoid getting rekt. EcoSwap is beta software and may contain bugs. Bug reports in the EcoSwap Discord server are appreciated!</div>
            </div>
            <style jsx>{`
                .content {
                    width: 100%;
                    height: calc(100vh - 140px);
                    display: flex;
                    flex-direction: column;
                    justify-content: center;
                    align-items: flex-start;
                    padding-bottom: 20px;
                }

                .top {
                    width: 100%;
                    display: flex;
                    flex-direction: row;
                    justify-content: flex-start;
                    align-items: flex-start;
                }

                .disclaimer {
                    width: 100%;
                    font-size: 0.9rem;
                    color: var(--gray);
                    margin-top: 24px;
                }

                @media only screen and (max-width: 1000px), (max-height: 900px) {
                    .content {
                        height: calc(100vh - 100px);
                    }

                    .disclaimer {
                        margin-top: 18px;
                    }
                }

                @media only screen and (max-width: 800px), (max-height: 800px) {
                    .disclaimer {
                        margin-top: 12px;
                    }
                }

                @media only screen and (max-width: 700px) {
                    .content {
                        height: auto;
                        align-items: center;
                        padding: 32px 0;
                    }

                    .divider {
                        width: 100%;
                        height: 0.5px;
                        background-color: var(--gray);
                        margin: 32px 0;
                    }

                    .disclaimer {
                        margin-top: 0;
                    }
                }
            `}</style>
        </>
    )
}

// Exports

export default Swap