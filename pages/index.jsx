// Files and modules

import useEthereum from "../hooks/useEthereum"
import usePrice from "../hooks/usePrice"
import { useState } from "react"

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

const TokenSelect = ({ tokens, token, setToken }) => {
    // Selection menu state

    const [ menuActive, setMenuActive ] = useState(false)
    const eth = usePrice("ETH")
    const btc = usePrice("BTC")
    const bnb = usePrice("BNB")

    // Component

    return (
        <>
            <button className="select" onClick={() => setMenuActive(true)}>
                {token ? token.symbol.length > 9 ? `${token.symbol.slice(0, 8)}...` : token.symbol : "Choose"}
                {eth} {btc} {bnb}
                <img className="arrow" src="/icons/arrow-down.svg"></img>
            </button>
            {menuActive ? <div className="menu"></div> : <></>}
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
                    background-color: black;
                }
            `}</style>
        </>
    )
}

// Swap interface component

const SwapInterface = () => {
    // Swap data

    const { chain } = useEthereum()

    // Component

    return (
        <>
            <div className="interface">
                <div className="label">Input Token</div>
                <div className="token-section">
                    <SwapInput></SwapInput>
                    <TokenSelect tokens={chain.tokens} token={chain.swap.tokenIn} setToken={chain.swap.setTokenIn}></TokenSelect>
                </div>
                <div className="middle">
                    <button className="switch">
                        <img className="arrows" src="/icons/switch.svg"></img>
                    </button>
                    <div className="label">Output Token</div>
                </div>
                <div className="token-section">
                    <div className="output">3</div>
                    <TokenSelect tokens={chain.tokens} token={chain.swap.tokenOut} setToken={chain.swap.setTokenOut}></TokenSelect>
                </div>
                <button className="swap">Swap Tokens</button>
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
                    color: var(--dark-gray);
                    margin-top: auto;
                    margin-left: auto;
                }

                .label:first-child {
                    margin-bottom: 16px;
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
                    margin: 16px 0;
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
                    margin-top: 18px;
                }

                .swap:hover {
                    border: 1px solid var(--light-dark);
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