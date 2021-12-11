// Files and modules

import { useState } from "react"

// Wallet manager component

const WalletManager = () => {
    // Component

    return (
        <>
            <button className="connect">{content}</button>
            <style jsx>{`
                .connect {
                    font-size: 1.1rem;
                    background-color: var(--light);
                    border: 1px solid var(--background);
                    border-radius: 8px;
                    padding: 8px 36px;
                    margin-left: auto;
                }

                .connect:hover {
                    border: 1px solid var(--light-dark);
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

const Layout = () => (
    <NavBar></NavBar>
)

// Exports

export default Layout