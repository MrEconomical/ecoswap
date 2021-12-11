// Files and modules

import { useState } from "react"

// Swap input component

const SwapInput = ({ backgroundColor }) => {
    // Component

    return (
        <>
            <input className="input"></input>
            <style jsx>{`
                .input {
                    width: 100%;
                    font-size: 1.2rem;
                    outline: none;
                    background-color: ${backgroundColor};
                    border: 1px solid ${backgroundColor};
                    border-radius: 8px;
                    padding: 12px;
                }

                .input:focus {
                    border: 1px solid var(--light-dark);
                }
            `}</style>
        </>
    )
}

// Swap interface component

const SwapInterface = () => {
    // Component

    return (
        <>
            <div className="interface">
                <div className="left">
                    <div className="swap">
                        <div className="section">
                            <div className="swap-label">Input</div>
                            <SwapInput backgroundColor="var(--light)"></SwapInput>
                        </div>
                        <div className="section output">
                            <div className="swap-icon">
                                <img className="arrow" src="/swap.svg"></img>
                            </div>
                            <div className="swap-label">Output</div>
                            <SwapInput backgroundColor="var(--background)"></SwapInput>
                            <button className="execute-swap">Swap Tokens</button>
                        </div>
                    </div>
                </div>
                <div className="right"></div>
            </div>
            <style jsx>{`
                .interface {
                    width: 100%;
                    height: 100%;
                    display: flex;
                    flex-direction: row;
                    justify-content: flex-start;
                    align-items: flex-start;
                    margin: 40px 0;
                }

                .left {
                    width: 30%;
                    height: 100%;
                    margin-right: 5%;
                }

                .right {
                    width: 65%;
                    height: 100%;
                }

                .swap {
                    width: 100%;
                    display: flex;
                    flex-direction: column;
                    justify-content: flex-start;
                    align-items: flex-start;
                    background-color: var(--background);
                    padding: 24px 8px 8px 8px;
                    border: 1px solid var(--light-gray);
                    border-radius: 8px;
                }

                .swap-label {
                    margin-bottom: 24px;
                }

                .section {
                    position: relative;
                    width: 100%;
                    padding: 0 20px;
                }

                .swap-icon {
                    position: absolute;
                    top: -24px;
                    left: 20px;
                    width: 48px;
                    height: 48px;
                    display: flex;
                    flex-direction: row;
                    justify-content: center;
                    align-items: center;
                    background-color: #FFFFFF;
                    border: 4px solid var(--light);
                    border-radius: 24px;
                }

                .arrow {
                    width: 16px;
                    height: 16px;
                    object-fit: contain;
                    margin: 12px 0;
                }

                .output {
                    background-color: var(--light);
                    border-radius: 8px;
                    padding: 36px 20px 24px 20px;
                    margin-top: 48px;
                }

                .execute-swap {
                    width: 100%;
                    font-size: 1.2rem;
                    background-color: var(--light-dark);
                    border: none;
                    border-radius: 8px;
                    padding: 12px 36px;
                    margin-top: 24px;
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
            <div className="settings"></div>
            <style jsx>{`
                .settings {
                    width: 100%;
                    height: 100%;
                    margin: 40px 0;
                }
            `}</style>
        </>
    )
}

// Swap page

const Swap = () => {
    // Section navigation

    const [ section, setSection ] = useState("swap")

    // Component

    return (
        <>
            <div className="content">
                <div className="section-nav">
                    <button
                        className="nav-button"
                        style={{ color: `var(--${section === "swap" ? "black" : "gray"})` }}
                        onClick={() => setSection("swap")}
                    >Swap</button>
                    <button
                        className="nav-button"
                        style={{ color: `var(--${section === "settings" ? "black" : "gray"})` }}
                        onClick={() => setSection("settings")}
                    >Settings</button>
                </div>
                {section === "swap" ? <SwapInterface></SwapInterface> : section === "settings" ? <SwapSettings></SwapSettings> : <></>}
            </div>
            <style jsx>{`
                .content {
                    width: 100%;
                    height: calc(100vh - 80px);
                    display: flex;
                    flex-direction: column;
                    justify-content: flex-start;
                    align-items: flex-start;
                    padding: 40px 0;
                }

                .section-nav {
                    display: flex;
                    flex-direction: row;
                    justify-content: flex-start;
                    align-items: center;
                }

                .nav-button {
                    font-size: 2.5rem;
                    font-weight: bold;
                    background-color: transparent;
                    border: none;
                }

                .nav-button:first-child {
                    margin-right: 64px;
                }
            `}</style>
        </>
    )
}

// Exports

export default Swap