// Files and modules

import { useState } from "react"

// Swap interface component

const SwapInterface = () => {
    // Component

    return (
        <>
            <div className="interface">
                this is the interface
            </div>
            <style jsx>{`
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
            <SwapSettings></SwapSettings>
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
        `}</style>
    </>
)

// Exports

export default Swap