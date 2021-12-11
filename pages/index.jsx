// Files and modules

import { useState } from "react"

// Swap component

const Swap = () => {
    // Component

    return (<></>)
}

// Swap settings component

const SwapSettings = () => {
    // Component

    return (<></>)
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
                        style={{ color: `var(--${section === "swap" ? "text-black" : "text-light"})` }}
                        onClick={() => setSection("swap")}
                    >Swap</button>
                    <button
                        className="nav-button"
                        style={{ color: `var(--${section === "settings" ? "text-black" : "text-light"})` }}
                        onClick={() => setSection("settings")}
                    >Settings</button>
                </div>
                {section === "swap" ? <Swap></Swap> : section === "settings" ? <SwapSettings></SwapSettings> : <></>}
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