// Files and modules

import EthereumContext, { chains } from "../state/EthereumContext"
import useWindowSize from "../state/useWindowSize"
import Link from "next/link"
import { useEffect, useContext, useState } from "react"

const chainIds = Object.keys(chains)

// Navigation link component

const NavLink = ({ name, href }) => (
    <>
        <Link href={href}>
            <a className="link">{name}</a>
        </Link>
        <style jsx>{`
            .link {
                font-size: 1.1rem;
                margin-left: 48px;
            }

            .link:hover {
                text-decoration: underline;
            }

            @media only screen and (max-width: 1000px), (max-height: 900px) {
                .link {
                    margin-left: 32px;
                }
            }

            @media only screen and (max-width: 550px) {
                .link {
                    margin-left: 20px;
                }
            }
        `}</style>
    </>
)

// Wallet manager component

const WalletManager = () => {
    // Wallet data

    const { enabled, chain, account } = useContext(EthereumContext)
    const { width } = useWindowSize()
    const [ chainSelectActive, setChainSelectActive ] = useState(false)

    // Connect to MetaMask

    async function requestConnect() {
        if (!enabled) return
        await ethereum.request({ method: "eth_requestAccounts" })
    }

    // Switch wallet to chain ID

    async function requestSwitch(chainId) {
        if (!enabled) return
        setChainSelectActive(false)
        try {
            // Switch to chain

            await ethereum.request({
                method: "wallet_switchEthereumChain",
                params: [{ chainId }]
            })
        } catch {
            // Add chain in wallet

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

    // Detect click off chain select

    useEffect(() => {
        function clickOff(event) {
            if (
                document.getElementById("chain-select") &&
                !event.path.includes(document.getElementById("select-chain")) &&
                !event.path.includes(document.getElementById("chain-select"))
            ) {
                setChainSelectActive(false)
            }
        }
        document.documentElement.addEventListener("click", clickOff)
        return () => document.documentElement.removeEventListener("click", clickOff)
    }, [])

    // Component

    return (
        <>
            <div className="wallet">
                <button id="select-chain" className="chain" onClick={() => setChainSelectActive(!chainSelectActive)}>
                    <img className="chain-icon" src={`/chains/${chain.id}.svg`}></img>
                    <div className="chain-name">{chain.name}</div>
                </button>
                <button className="connect" onClick={requestConnect}>
                    <div className="connect-content">
                        <img className="connect-icon" src="/icons/wallet.svg"></img>
                        {enabled ? account ? `${account.slice(0, width >= 550 ? 6 : 4)}...${account.slice(width >= 550 ? -4 : -2)}` : "Connect Wallet" : "Enable Ethereum"}
                    </div>
                </button>
                {chainSelectActive ? (
                    <div id="chain-select" className="chain-select">
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
                    gap: 12px;
                    font-size: 1.1rem;
                    border: 1px solid var(--light-dark);
                    border-radius: 8px;
                    padding: 8px 36px;
                    margin-right: 16px;
                }

                .chain:hover {
                    background-color: var(--light);
                }

                .chain-icon {
                    height: 0.9rem;
                }

                .chain-select {
                    position: absolute;
                    top: calc(16px + 1.1rem + 16px);
                    left: 0;
                    display: flex;
                    flex-direction: column;
                    justify-content: flex-start;
                    align-items: flex-start;
                    z-index: 2;
                    border: 1px solid var(--light-dark);
                    border-radius: 8px;
                }

                .switch-chain {
                    width: 100%;
                    display: flex;
                    flex-direction: row;
                    justify-content: flex-start;
                    align-items: center;
                    background-color: var(--background);
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
                    margin-right: 10px;
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
                    gap: 12px;
                }

                .connect-icon {
                    height: 0.8rem;
                }

                @media only screen and (max-width: 1000px), (max-height: 900px) {
                    .chain {
                        padding: 6px 24px;
                    }

                    .connect {
                        padding: 6px 24px;
                    }
                }

                @media only screen and (max-width: 800px), (max-height: 800px) {
                    .chain {
                        gap: 8px;
                    }

                    .connect-content {
                        gap: 8px;
                    }
                }

                @media only screen and (max-width: 550px) {
                    .chain {
                        padding: 8px;
                    }

                    .chain-name {
                        display: none;
                    }
                }
            `}</style>
        </>
    )
}

// Navigation bar component

const NavBar = () => (
    <>
        <nav className="nav">
            <Link href="/">
                <a className="header">
                    <img className="icon" src="/ecoswap.png"></img>
                    <div className="title">EcoSwap</div>
                </a>
            </Link>
            <NavLink name="About" href="/about"></NavLink>
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
                padding: 0 max(calc(50vw - 500px), 20px);
            }

            .header {
                display: flex;
                flex-direction: row;
                justify-content: flex-start;
                align-items: center;
                gap: 16px;
            }

            .icon {
                height: 2.5rem;
            }

            .title {
                font-size: 1.1rem;
                font-weight: bold;
                margin-bottom: 0.5px;
            }

            @media only screen and (max-width: 1000px), (max-height: 900px) {
                .nav {
                    height: 60px;
                }
            }

            @media only screen and (max-height: 900px) {
                .title {
                    margin-bottom: 0;
                }
            }

            @media only screen and (max-width: 550px) {
                .nav {
                    padding: 0 max(calc(50vw - 500px), 10px);
                }

                .title {
                    display: none;
                }
            }
        `}</style>
    </>
)

// Footer component

const Footer = () => (
    <>
        <div className="footer">
            Built by MrEconomical.eth
            <div className="links">
                <a href="https://discord.gg/HhQKXfRr" target="_blank">
                    <img className="link" src="/icons/discord.svg"></img>
                </a>
                <a href="https://github.com/MrEconomical/ecoswap" target="_blank">
                    <img className="link" src="/icons/github.svg"></img>
                </a>
            </div>
        </div>
        <style jsx>{`
            .footer {
                width: 100%;
                height: 60px;
                display: flex;
                flex-direction: row;
                justify-content: flex-start;
                align-items: center;
                font-size: 0.9rem;
                padding: 0 max(calc(50vw - 500px), 20px);
            }

            .links {
                display: flex;
                flex-direction: row;
                justify-content: flex-start;
                align-items: center;
                gap: 24px;
                margin-left: auto;
            }

            .link {
                height: 20px;
            }

            @media only screen and (max-width: 1000px), (max-height: 900px) {
                .footer {
                    height: 40px;
                }

                .links {
                    gap: 16px;
                }

                .link {
                    height: 15px;
                }
            }

            @media only screen and (max-witdth: 550px) {
                padding: 0 max(calc(50vw - 500px), 10px);
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
        <Footer></Footer>
        <style jsx>{`
            .content {
                width: 100%;
                padding: 0 max(calc(50vw - 500px), 20px);
            }

            @media only screen and (max-width: 550px) {
                padding: 0 max(calc(50vw - 500px), 10px);
            }
        `}</style>
    </>
)

// Exports

export default Layout