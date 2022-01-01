// Files and modules

import ThemeContext from "../state/ThemeContext.js"
import WindowSizeContext from "../state/WindowSizeContext.js"
import EthereumContext from "../state/EthereumContext.js"
import { useContext, useRef } from "react"

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

                    .gas-switch {
                        margin-right: 6px;
                    }

                    .gas-label {
                        margin-right: auto;
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

// Exports

export default SwapSettings