// Swap input component

const SwapInput = () => {
    // Component

    return (
        <>
            <input className="input"></input>
            <style jsx>{`
                .input {
                    width: 65%;
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

const TokenSelect = ({ token, setToken }) => (
    <>
        <button className="select">
            WETH
            <img className="arrow" src="/icons/arrow-down.svg"></img>
        </button>
        <style jsx>{`
            .select {
                width: 30%;
                display: flex;
                flex-direction: row;
                justify-content: center;
                align-items: center;
                font-size: 1.2rem;
                padding: 9px 0;
            }

            .arrow {
                width: 0.9rem;
                height: 0.9rem;
                object-fit: contain;
                margin-left: 0.5rem;
            }
        `}</style>
    </>
)

// Swap interface component

const SwapInterface = () => {
    // Component

    return (
        <>
            <div className="interface">
                <div className="token-section">
                    <SwapInput></SwapInput>
                    <TokenSelect></TokenSelect>
                </div>
                <button className="switch">
                    <img className="arrows" src="/icons/switch.svg"></img>
                </button>
                <div className="token-section">
                    <div className="output">3</div>
                    <TokenSelect></TokenSelect>
                </div>
                <button className="swap">Swap Tokens</button>
            </div>
            <style jsx>{`
                .interface {
                    width: 300px;
                    display: flex;
                    flex-direction: column;
                    justify-content: flex-start;
                    align-items: flex-start;
                }

                .token-section {
                    width: 100%;
                    display: flex;
                    flex-direction: row;
                    justify-content: flex-start;
                    align-items: center;
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
                    margin: 12px 0;
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
                    width: 65%;
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