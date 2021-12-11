// Files and modules

import useEthereum, { chains } from "../hooks/useEthereum"
import { useEffect, useState } from "react"

const chainIds = Object.keys(chains)

// Wallet manager component

const WalletManager = () => {
    // Wallet data

    const { chain, account } = useEthereum()
    const [ forceUpdate, setForceUpdate ] = useState(0)
    const [ chainSelectActive, setChainSelectActive ] = useState(false)

    useEffect(() => {
        setForceUpdate(forceUpdate ++)
    }, [])

    // Connect to MetaMask

    async function requestConnect() {
        if (typeof ethereum === "undefined") return
        await ethereum.request({ method: "eth_requestAccounts" })
    }

    // Switch wallet to chain ID

    async function requestSwitch(chainId) {
        if (typeof ethereum === "undefined") return
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
                        name: chains[chainId].token,
                        symbol: chains[chainId].token,
                        decimals: 18
                    },
                    rpcUrls: [chains[chainId].rpc],
                    blockExplorerUrls: [chains[chainId].explorer]
                }]
            })
        }
    }

    // Component

    return (
        <>
            <div className="wallet">
                <button className="chain" onClick={() => setChainSelectActive(!chainSelectActive)}>
                    <img className="chain-icon" src={`/chains/${chain.id}.svg`} prop={forceUpdate}></img>
                    {chain.name}
                </button>
                <button className="connect" onClick={requestConnect}>
                    <div className="connect-content">
                        <img className="connect-icon" src="/icons/wallet.svg"></img>
                        {typeof ethereum !== "undefined" ? account ? `${account.slice(0, 6)}...${account.slice(-4)}` : "Connect Wallet" : "Enable Ethereum"}
                    </div>
                </button>
                {chainSelectActive ? (
                    <div className="chain-select">
                        {chainIds.slice(0, chainIds.indexOf(chain.id)).concat(chainIds.slice(chainIds.indexOf(chain.id) + 1)).map(chainId => (
                            <button className="switch-chain" onClick={() => requestSwitch(chainId)} key={chainId}>
                                <img className="switch-icon" src={`/chains/${chainId}.svg`}></img>
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
                    margin-right: 0.65rem;
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