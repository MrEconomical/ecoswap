// Files and modules

import ERC20ABI from "../abis/ERC20"
import { parse, unparse, format, formatNumber } from "../helpers/number"
import EthereumContext from "../state/EthereumContext"
import PriceContext from "../state/PriceContext"
import quoteSwap from "../swap/quote"
import getSwap from "../swap/swap"
import { useContext, useEffect, useState } from "react"

// Swap input component

const SwapInput = () => {
    // Swap data

    const { chain, BN } = useContext(EthereumContext)
    const [ inputBefore, setInputBefore ] = useState("")

    // Format swap input on change

    function handleChange(event) {
        // Update token input state

        const value = !event.target.value || /^[0-9,.]+$/g.test(event.target.value) ? event.target.value : inputBefore
        if (chain.swap.tokenIn && value) {
            const amount = BN(unparse(value, chain.swap.tokenIn.decimals))
            chain.swap.setTokenInAmount(amount.eq(BN(0)) ? null : amount)
        } else {
            chain.swap.setTokenInAmount(null)
        }

        // Dynamic input

        if (event.target.value === "") return
        if (!/^[0-9,.]+$/g.test(event.target.value)) {
            event.target.value = inputBefore
            return
        }
        let insert = 0
        while (event.target.value[insert] === inputBefore[insert]) {
            insert ++
            if (!event.target.value[insert] && !inputBefore[insert]) break
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
                if (inputBefore[c] === ",") {
                    count ++
                }
            }
            for (let c = 0; c < event.target.value.length; c ++) {
                if (count === insert) {
                    if ((!event.target.value.endsWith(".") && event.target.value[c] === ".") || event.target.value.length < inputBefore.length) {
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
        setInputBefore(event.target.value)
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

    const { web3, chain, account, BN } = useContext(EthereumContext)
    const token = chain.swap[type === "input" ? "tokenIn" : "tokenOut"]
    const setToken = chain.swap[type === "input" ? "setTokenIn" : "setTokenOut"]
    const opposite = chain.swap[type === "input" ? "tokenOut" : "tokenIn"]

    const [ menuActive, setMenuActive ] = useState(false)
    const [ tokenList, setTokenList ] = useState(chain.tokens)

    // Update token search with query

    function updateTokenList(event) {
        const query = event.target.value.toLowerCase()
        if (!query) return setTokenList(chain.tokens)
        const tokens = chain.tokens.filter(token => token.name.toLowerCase().includes(query) || token.symbol.toLowerCase().includes(query) || token.address.toLowerCase() === query)
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
        if (!account) return
        const Token = new chain.web3.eth.Contract(ERC20ABI, address)
        let name, symbol, decimals, balance
        try {
            [ name, symbol, decimals, balance ] = await Promise.all([
                Token.methods.name().call(),
                Token.methods.symbol().call(),
                Token.methods.decimals().call(),
                Token.methods.balanceOf(account).call()
            ])
        } catch {
            return
        }
        const balances = { ...chain.tokenBalances }
        balances[Token._address] = BN(balance)
        chain.setTokenBalances(balances)
        const tokens = [ ...tokenList ]
        tokens.push({
            external: true,
            name,
            symbol,
            address: Token._address,
            decimals: +decimals
        })
        setTokenList(tokens)
    }

    // Switch to selected token

    function switchToken(token) {
        if (!token.external) {
            setToken(token)
        } else {
            console.log("is external token")
        }
        setMenuActive(false)
    }

    // Update token list on data changes

    useEffect(() => {
        if (opposite) {
            const index = chain.tokens.findIndex(token => opposite.address === token.address)
            if (index !== -1) {
                setTokenList(chain.tokens.slice(0, index).concat(chain.tokens.slice(index + 1)))
                return
            }
        }
        setTokenList(chain.tokens)
    }, [chain, opposite])

    // Hide menu on chain or account changes

    useEffect(() => {
        setMenuActive(false)
    }, [chain, account])

    // Remove unselected external tokens from token balances on menu changes

    useEffect(() => {
        if (menuActive) return
        const balances = { ...chain.tokenBalances }
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
                {token ? token.symbol.length > 9 ? `${token.symbol.slice(0, 8)}...` : token.symbol : "Choose"}
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
                            <button className="token" key={`${chain.id}-${type}-${token.address}`} onClick={() => switchToken(token)}>
                                <img className="icon" src={`/tokens/${token.default ? token.symbol : "unknown"}.svg`}></img>
                                <div className="info">
                                    <div className="name">{token.name} - {token.symbol}</div>
                                    <div className="balance">{chain.tokenBalances[token.address] ? format(parse(chain.tokenBalances[token.address], token.decimals)) : "0"}</div>
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
                    margin-left: 0.5rem;
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
                    margin-right: 1rem;
                }

                .search {
                    width: 100%;
                    outline: none;
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
                    margin-right: 8px;
                }

                .token:hover {
                    border: 1px solid var(--light-dark);
                }

                .icon {
                    width: 2.5rem;
                    height: 2.5rem;
                    object-fit: contain;
                    margin-right: 1rem;
                }

                .info {
                    display: flex;
                    flex-direction: column;
                    justify-content: flex-start;
                    align-items: flex-start;
                }

                .name {
                    text-align: left;
                    margin-bottom: 3px;
                }

                .balance {
                    color: var(--gray);
                }
            `}</style>
        </>
    )
}

// Swap interface component

const SwapInterface = () => {
    // Swap data

    const { web3, chain, account, BN } = useContext(EthereumContext)
    const swap = chain.swap
    const [ updateTimeout, setUpdateTimeout ] = useState()
    const [ swapButtonText, setSwapButtonText ] = useState("Swap Tokens")

    // Set max token amount

    function setMax() {
        if (!swap.tokenIn) return
        const balance = chain.tokenBalances[swap.tokenIn.address]
        if (balance.gt(BN(0))) {
            document.getElementById("swap-input").value = format(parse(balance, swap.tokenIn.decimals))
            swap.setTokenInAmount(balance)
        }
    }

    // Switch input and output tokens

    function switchTokens() {
        const newInput = swap.tokenOut
        swap.setTokenOut(swap.tokenIn)
        swap.setTokenIn(newInput)
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
                const ratio = swap.tokenInAmount.mul(BN(10).pow(BN(swap.tokenOut.decimals))).mul(BN(10000)).div(swap.tokenOutAmount).div(BN(10).pow(BN(swap.tokenIn.decimals)))
                return `1 ${swap.tokenOut.symbol} = ${format(parse(ratio, 4))} ${swap.tokenIn.symbol}`
            }
        } else {
            if (!swap.tokenIn) {
                return `1 ... = ...`
            } else if (!swap.tokenOut) {
                return `1 ${swap.tokenIn.symbol} = ...`
            } else if (!swap.tokenInAmount || !web3.utils.isBN(swap.tokenOutAmount)) {
                return `1 ${swap.tokenIn.symbol} = ... ${swap.tokenOut.symbol}`
            } else {
                const ratio = swap.tokenOutAmount.mul(BN(10).pow(BN(swap.tokenIn.decimals))).mul(BN(10000)).div(swap.tokenInAmount).div(BN(10).pow(BN(swap.tokenOut.decimals)))
                return `1 ${swap.tokenIn.symbol} = ${format(parse(ratio, 4))} ${swap.tokenOut.symbol}`
            }
        }
    }

    // Update swap quote

    async function updateQuote() {
        try {
            await quoteSwap(chain, BN)
        } catch(error) {
            console.error(error)
        }
    }

    // Reset router quotes

    function resetRouterQuotes() {
        const routers = [ ...swap.routers ]
        for (const router of routers) {
            router.out = null
        }
        swap.setRouters(routers)
    }

    // Swap tokens

    async function swapTokens() {
        // Get swap transaction data

        if (!account || !swap.tokenIn || !swap.tokenOut || !swap.tokenInAmount) return
        let swapData
        try {
            swapData = await getSwap(chain, BN)
        } catch(error) {
            console.error(error)
            return
        }

        // Check approval

        const Token = new chain.web3.Contract(ERC20ABI, swap.tokenIn.address)
    }

    // Update swap quote on token amount changes

    useEffect(() => {
        clearTimeout(updateTimeout)
        if (!swap.tokenInAmount || !swap.tokenOut) {
            swap.setTokenOutAmount(null)
            resetRouterQuotes()
            return
        }
        swap.setTokenOutAmount("...")
        resetRouterQuotes()
        setUpdateTimeout(setTimeout(updateQuote, 500))
    }, [swap.tokenInAmount])

    // Update swap quote on token changes

    useEffect(() => {
        if (!swap.tokenInAmount) return
        if (!swap.tokenOut) {
            swap.setTokenOutAmount(null)
            resetRouterQuotes()
            return
        }
        swap.setTokenOutAmount("...")
        resetRouterQuotes()
        updateQuote()
    }, [swap.tokenOut])

    // Component

    return (
        <>
            <div className="interface">
                <div className="header">
                    <button className="max-token" onClick={setMax}>Max {swap.tokenIn ? format(parse(chain.tokenBalances[swap.tokenIn.address], swap.tokenIn.decimals)) : "..."} {swap.tokenIn ? swap.tokenIn.symbol : ""}</button>
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
                    <div className="label" style={{ top: "12px" }}>Output Token</div>
                </div>
                <div className="token-section">
                    <div className="output">{swap.tokenOutAmount ? typeof swap.tokenOutAmount === "string" ? swap.tokenOutAmount : format(parse(swap.tokenOutAmount, swap.tokenOut.decimals)) : null}</div>
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
                }

                .output {
                    width: 45%;
                    min-height: calc(1.44rem + 18px);
                    font-size: 1.2rem;
                    border: 1px solid var(--light-gray);
                    border-radius: 8px;
                    padding: 8px 12px;
                    margin-right: 5%;
                }

                .swap {
                    width: 100%;
                    font-size: 1.2rem;
                    text-align: center;
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
            `}</style>
        </>
    )
}

// Swap settings component

const SwapSettings = () => {
    // Swap settings data
    
    const { web3, chain } = useContext(EthereumContext)
    const settings = chain.swapSettings

    // Update slippage with slider value

    function updateSlippage(event) {
        settings.setSlippage(+event.target.value / 100)
    }

    // Set slippage with text input value

    function setSlippage(event) {
        if (isNaN(+event.target.value) || +event.target.value <= 0 || event.target.value >= 50) return
        if (event.target.value.endsWith(".")) return
        settings.setSlippage(+event.target.value)
    }

    // Set gas value for chain

    function updateGas(value) {
        if (settings.gas[chain.id] === value) return
        const gas = { ...settings.gas }
        gas[chain.id] = value
        settings.setGas(gas)
        document.getElementById("gas-input").value = ""
    }

    // Set gas with text input value

    function setGas(event) {
        if (isNaN(+event.target.value) || +event.target.value <= 0) return
        if (event.target.value.endsWith(".")) return
        const gas = { ...settings.gas }
        gas[chain.id] = +event.target.value
        settings.setGas(gas)
    }

    // Toggle router enabled

    function toggleRouter(router) {
        const routers = { ...settings.routers }
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

    // Component

    return (
        <>
            <div className="settings">
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
                            <div className="gas-switch" data-checked={settings.gas[chain.id] === "normal"} onClick={() => updateGas("normal")}></div>
                            <div className="gas-label">Normal</div>
                            <div className="gas-switch" data-checked={settings.gas[chain.id] === "fast"} onClick={() => updateGas("fast")}></div>
                            <div className="gas-label">Fast</div>
                            <input id="gas-input" className="gas-input" onChange={setGas}></input>
                        </div>
                    </div>
                </div>
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
                        <div className="title-value referral-value"> - {settings.referral || "None"}</div>
                    </div>
                    <div className="referral-label">Referral address will not work if it is the same as the account swapping tokens</div>
                    <div className="referral">
                        <input id="referral-input" className="referral-input"></input>
                        <button className="set-referral" onClick={setReferral}>Set</button>
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
                    padding-top: 32px;
                }

                .top {
                    width: 100%;
                    display: flex;
                    flex-direction: row;
                    justify-content: flex-start;
                    align-items: flex-start;
                    margin-bottom: 2rem;
                }

                .section {
                    width: 100%;
                    height: 100%;
                    display: flex;
                    flex-direction: column;
                    justify-content: flex-start;
                    align-items: flex-start;
                    margin-bottom: 2rem;
                }

                .slippage-section {
                    width: 40%;
                    margin-right: 32px;
                }

                .gas-section {
                    width: calc(60% - 32px);
                }

                .section-title {
                    display: flex;
                    flex-direction: row;
                    justify-content: flex-start;
                    align-items: center;
                    font-size: 1.2rem;
                    margin-bottom: 1.2rem;
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
                    margin-right: 1.5rem;
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
                    width: 60px;
                    outline: none;
                    border: 1px solid var(--light-gray);
                    border-radius: 8px;
                    padding: 6px 8px;
                }

                .slippage-input:focus {
                    border: 1px solid var(--gray);
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
                    background-color: var(--light-gray);
                    border-radius: 4px;
                    margin-right: 0.5rem;
                }

                .gas-switch[data-checked="true"] {
                    background-color: var(--light-dark);
                }

                .gas-label {
                    margin-right: 1.5rem;
                }

                .gas-input {
                    width: 60px;
                    outline: none;
                    border: 1px solid var(--light-gray);
                    border-radius: 8px;
                    padding: 6px 8px;
                }

                .gas-input:focus {
                    border: 1px solid var(--gray);
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
                    margin-bottom: 0.6rem;
                }

                .router-icon {
                    width: 1.2rem;
                    height: 1.2rem;
                    object-fit: contain;
                    margin-right: 0.75rem;
                }

                .router-status {
                    min-width: 70px;
                    color: var(--dark-gray);
                    margin-right: 1rem;
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
                    background-color: white;
                }

                input:checked + .slider {
                    background-color: var(--light-dark);
                }

                input:checked + .slider:before {
                    transform: translateX(calc(1.8rem - 2px));
                }

                .referral-title {
                    margin-bottom: 0.2rem;
                }

                .referral-value {
                    font-size: 1rem;
                }

                .referral-label {
                    font-size: 0.8rem;
                    color: var(--dark-gray);
                    margin-bottom: 1.2rem;
                }

                .referral {
                    width: 100%;
                    display: flex;
                    flex-direction: row;
                    justify-content: flex-start;
                    align-items: center;
                }

                .referral-input {
                    width: 60%;
                    outline: none;
                    border: 1px solid var(--light-gray);
                    border-radius: 8px;
                    padding: 6px 8px;
                    margin-right: 1rem;
                }

                .referral-input:focus {
                    border: 1px solid var(--gray);
                }

                .set-referral {
                    border: 1px solid var(--light-dark);
                    border-radius: 8px;
                    padding: 6px 16px;
                }

                .set-referral:hover {
                    background-color: var(--light);
                }
            `}</style>
        </>
    )
}

// Router outputs component

const RouterOutputs = () => {
    // Swap data

    const { chain } = useContext(EthereumContext)
    const prices = useContext(PriceContext)
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
                            {router.name}
                        </div>
                        <div className="section">
                            {swap.tokenIn ? (
                                <img className="icon" src={swap.tokenIn.default ? `/tokens/${swap.tokenIn.symbol}.svg` : "/tokens/unknown.svg"}></img>
                            ) : <></>}
                            {`${swap.tokenIn && swap.tokenInAmount ? format(parse(swap.tokenInAmount, swap.tokenIn.decimals)) : "..."} `}
                            {swap.tokenIn ? swap.tokenIn.symbol : ""}
                            <div className="arrow">➔</div>
                            {swap.tokenOut ? (
                                <img className="icon" src={swap.tokenOut.default ? `/tokens/${swap.tokenOut.symbol}.svg` : "/tokens/unknown.svg"}></img>
                            ) : <></>}
                            {`${swap.tokenOut && router.out ? format(parse(router.out, swap.tokenOut.decimals)) : "..."} `}
                            {swap.tokenOut ? swap.tokenOut.symbol : ""}
                        </div>
                        <div className="section">
                            {router.out ? swap.tokenIn.default ? `≈ $${formatNumber(getTokenValue(swap.tokenOut, router.out))}` : "≈ $0.00" : "..."}
                        </div>
                    </div>
                ))}
            </div>
            <style jsx>{`
                .routers {
                    width: 100%;
                    height: 100%;
                    display: flex;
                    flex-direction: column;
                    justify-content: flex-start;
                    align-items: flex-start;
                    border-top: 0.5px solid var(--gray);
                    padding: 32px 0;
                }

                .title {
                    font-size: 1.5rem;
                    margin-bottom: 1.5rem;
                }

                .router {
                    width: 100%;
                    display: grid;
                    grid-template-columns: 2fr 5fr 3fr;
                    grid-gap: 16px;
                    margin: 1.5rem 0;
                }

                .section {
                    display: flex;
                    flex-direction: row;
                    justify-content: flex-start;
                    align-items: center;
                    font-size: 1.2rem;
                }

                .icon {
                    width: 1.2rem;
                    height: 1.2rem;
                    object-fit: contain;
                    margin-right: 1rem;
                }

                .arrow {
                    margin: 0 1rem;
                }
            `}</style>
        </>
    )
}

// Swap page

const Swap = () => (
    <>
        <div className="content">
            <div className="top">
                <SwapInterface></SwapInterface>
                <SwapSettings></SwapSettings>
            </div>
            <RouterOutputs></RouterOutputs>
        </div>
        <style jsx>{`
            .content {
                width: 100%;
                height: calc(100vh - 120px);
                display: flex;
                flex-direction: column;
                justify-content: flex-start;
                align-items: flex-start;
                padding: 40px 0;
            }

            .top {
                width: 100%;
                display: flex;
                flex-direction: row;
                justify-content: flex-start;
                align-items: flex-start;
                margin-bottom: 16px;
            }
        `}</style>
    </>
)

// Exports

export default Swap