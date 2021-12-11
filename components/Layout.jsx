// Files and modules

import chains from "../data/chains"
import { useEffect, useState } from "react"

const chainIds = Object.keys(chains)

// Wallet manager component

const WalletManager = () => {
    // Wallet display

    const [ buttonText, setButtonText ] = useState("Enable Ethereum")
    const [ activeChain, setActiveChain ] = useState("0x1")
    const [ chainSelectActive, setChainSelectActive ] = useState(false)

    useEffect(() => {
        updateButtonText()
        updateActiveChain()
    }, [])

    useEffect(() => {
        // Set MetaMask listeners

        if (typeof ethereum !== "undefined" && !ethereum.walletInitialized) {
            ethereum.walletInitialized = true
            ethereum.on("accountsChanged", updateButtonText)
            ethereum.on("chainChanged", updateActiveChain)
        }

        // Remove MetaMask listeners

        return () => {
            if (typeof ethereum !== "undefined") {
                ethereum.walletInitialized = false
                ethereum.removeListener("accountsChanged", updateButtonText)
                ethereum.removeListener("chainChanged", updateActiveChain)
            }
        }
    })

    // Get button text

    function updateButtonText() {
        if (typeof ethereum === "undefined") {
            setButtonText("Enable Ethereum")
        } else if (!ethereum.selectedAddress) {
            setButtonText("Connect Wallet")
        } else {
            setButtonText(`${ethereum.selectedAddress.slice(0, 6)}...${ethereum.selectedAddress.slice(-4)}`)
        }
    }

    // Get active chain

    function updateActiveChain() {
        if (typeof ethereum === "undefined" || !ethereum.selectedAddress) {
            setActiveChain("0x1")
        } else if (chains[ethereum.chainId]) {
            setActiveChain(ethereum.chainId)
        }
    }

    // Connect to MetaMask

    async function requestConnect() {
        if (typeof ethereum !== "undefined") {
            await ethereum.request({ method: "eth_requestAccounts" })
        }
    }

    // Switch wallet to chain ID

    async function requestSwitch(chainId) {
        if (typeof ethereum !== "undefined") {
            setChainSelectActive(false)
            try {
                await ethereum.request({
                    method: "wallet_switchEthereumChain",
                    params: [{ chainId }]
                })
            } catch {
                await ethereum.request({
                    method: "wallet_addEthereumChain",
                    params: [{
                        chainId,
                        chainName: chains[chainId].fullName,
                        nativeCurrency: {
                            name: chains[chainId].token.toUpperCase(),
                            symbol: chains[chainId].token.toUpperCase(),
                            decimals: 18
                        },
                        rpcUrls: [chains[chainId].rpc],
                        blockExplorerUrls: [chains[chainId].explorer]
                    }]
                })
            }
        }
    }

    // Component

    return (
        <>
            <div className="wallet">
                <button className="chain" onClick={() => setChainSelectActive(!chainSelectActive)}>
                    <img className="chain-icon" src={`/tokens/${chains[activeChain].token}.svg`}></img>
                    {chains[activeChain].name}
                </button>
                <button className="connect" onClick={requestConnect}>
                    <div className="connect-content">
                        <img className="connect-icon" src="/wallet.svg"></img>
                        {buttonText}
                    </div>
                </button>
                {chainSelectActive ? (
                    <div className="chain-select">
                        {chainIds.slice(0, chainIds.indexOf(activeChain)).concat(chainIds.slice(chainIds.indexOf(activeChain) + 1)).map(chainId => (
                            <button className="switch-chain" onClick={() => requestSwitch(chainId)} key={chainId}>
                                <img className="switch-icon" src={`/tokens/${chains[chainId].token}.svg`}></img>
                                {chains[chainId].name}
                            </button>
                        ))}
                    </div>
                ) : (
                    <></>
                )}
            </div>
            <style jsx>{`
                .wallet {
                    position: relative;
                    display: flex;
                    flex-direction: row;
                    justify-content: center;
                    align-items: center;
                    margin-left: auto;
                }

                .chain {
                    display: flex;
                    flex-direction: row;
                    justify-content: center;
                    align-items: center;
                    font-size: 1.1rem;
                    border: 1px solid var(--light-dark);
                    border-radius: 8px;
                    padding: 8px 36px;
                    margin-right: 1rem;
                }

                .chain:hover {
                    background-color: var(--light);
                }

                .chain-icon {
                    width: 0.9rem;
                    height: 0.9rem;
                    object-fit: contain;
                    margin-right: 0.75rem;
                }

                .chain-select {
                    position: absolute;
                    top: calc(8px * 2 + 1.1rem + 1rem);
                    left: 0;
                    display: flex;
                    flex-direction: column;
                    justify-content: flex-start;
                    align-items: flex-start;
                    border: 1px solid var(--light-dark);
                    border-radius: 8px;
                }

                .switch-chain {
                    width: 100%;
                    display: flex;
                    flex-direction: row;
                    justify-content: flex-start;
                    align-items: center;
                    padding: 8px 16px;
                }

                .switch-chain:first-child {
                    border-radius: 8px 8px 0 0;
                }

                .switch-chain:last-child {
                    border-radius: 0 0 8px 8px;
                }

                .switch-chain:hover {
                    background-color: var(--light);
                }

                .switch-icon {
                    width: 0.7rem;
                    height: 0.7rem;
                    object-fit: contain;
                    margin-right: 0.68rem;
                }

                .connect {
                    font-size: 1.1rem;
                    background-color: var(--light);
                    border: 1px solid var(--background);
                    border-radius: 8px;
                    padding: 8px 36px;
                }

                .connect:hover {
                    border: 1px solid var(--light-dark);
                }

                .connect-content {
                    display: flex;
                    flex-direction: row;
                    justify-content: center;
                    align-items: center;
                }

                .connect-icon {
                    width: 0.8rem;
                    height: 0.8rem;
                    object-fit: contain;
                    margin-right: 0.75rem;
                }
            `}</style>
        </>
    )
}

// Navigation bar component

const NavBar = () => (
    <>
        <nav className="nav">
            <img className="icon" src="/ecoswap.png"></img>
            <div className="title">EcoSwap</div>
            <WalletManager></WalletManager>
        </nav>
        <style jsx>{`
            .nav {
                width: 100%;
                height: 80px;
                display: flex;
                flex-direction: row;
                justify-content: flex-start;
                align-items: center;
                padding: 0 max(calc(50vw - 550px), 20px);
            }

            .icon {
                width: 40px;
                height: 40px;
                object-fit: contain;
                margin-right: 12px;
            }

            .title {
                font-size: 1.1rem;
                font-weight: bold;
            }
        `}</style>
    </>
)

// Layout component

const Layout = ({ children }) => (
    <>
        <NavBar></NavBar>
        <div className="content">
            {children}
        </div>
        <style jsx>{`
            .content {
                width: 100%;
                padding: 0 max(calc(50vw - 550px), 20px);
            }
        `}</style>
    </>
)

// Exports

export default Layout