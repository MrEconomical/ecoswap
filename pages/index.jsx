// Files and modules

import EthereumContext from "../state/EthereumContext"
import PriceContext from "../state/PriceContext"
import { useContext, useEffect, useState } from "react"

// Swap input component

const SwapInput = () => {
    // Component

    return (
        <>
            <input className="input"></input>
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

const TokenSelect = ({ label, type, chain }) => {
    // Token selection menu data

    const token = chain.swap[type === "input" ? "tokenIn" : "tokenOut"]
    const setToken = chain.swap[type === "input" ? "setTokenIn" : "setTokenOut"]
    const [ menuActive, setMenuActive ] = useState(false)
    const [ tokenList, setTokenList ] = useState(chain.tokens)

    // Update token search

    function updateTokenList(event) {
        const query = event.target.value
        console.log(query)
    }

    // Switch to selected token

    function switchToken(token) {
        setToken(token)
        setMenuActive(false)
    }

    // Update token list on chain changes

    useEffect(() => {
        setTokenList(chain.tokens)
    }, [chain])

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
                        {tokenList.map((token, i) => (
                            <button className="token" key={i} onClick={() => switchToken(token)}>
                                <img className="icon" src={`/tokens/${token.symbol}.svg`}></img>
                                <div className="info">
                                    <div className="name">{token.name} - {token.symbol}</div>
                                    <div className="balance">0</div>
                                </div>
                            </button>
                        ))}
                    </div>
                </div>
             ) : <></>}
            <style jsx>{`
                .select {
                    width: 50%;
                    display: flex;
                    flex-direction: row;
                    justify-content: flex-end;
                    align-items: center;
                    font-size: 1.2rem;
                    overflow: hidden;
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
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
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

    const { chain } = useContext(EthereumContext)
    const prices = useContext(PriceContext)

    // Calculate swap info

    function getSwapInfo() {
        return `1 ... = ...`
    }

    // Component

    return (
        <>
            <div className="interface">
                <div className="label" style={{ marginBottom: "12px" }}>Input Token</div>
                <div className="token-section">
                    <SwapInput></SwapInput>
                    <TokenSelect label="Input Token" type="input" chain={chain}></TokenSelect>
                </div>
                <div className="middle">
                    <button className="switch">
                        <img className="arrows" src="/icons/switch.svg"></img>
                    </button>
                    <div className="label" style={{ top: "12px" }}>Output Token</div>
                </div>
                <div className="token-section">
                    <div className="output">3</div>
                    <TokenSelect label="Output Token" type="output" chain={chain}></TokenSelect>
                </div>
                <button className="swap">Swap Tokens</button>
                <div className="swap-info">{getSwapInfo()}</div>
                <div className="swap-info" style={{ marginBottom: "0" }}>{getSwapInfo()}</div>
            </div>
            <style jsx>{`
                .interface {
                    position: relative;
                    width: 300px;
                    display: flex;
                    flex-direction: column;
                    justify-content: flex-start;
                    align-items: flex-start;
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
    // Component

    return (
        <>
            <div className="settings">
                this is the settings
            </div>
            <style jsx>{`
            `}</style>
        </>
    )
}

// Swap page

const Swap = () => (
    <>
        <div className="content">
            <SwapInterface></SwapInterface>
        </div>
        <style jsx>{`
            .content {
                width: 100%;
                height: calc(100vh - 80px);
                display: flex;
                flex-direction: row;
                justify-content: center;
                align-items: flex-start;
                padding: 40px 0;
            }
        `}</style>
    </>
)

// Exports

export default Swap