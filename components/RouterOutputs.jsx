// Files and modules

import ThemeContext from "../state/ThemeContext.js"
import WindowSizeContext from "../state/WindowSizeContext.js"
import EthereumContext from "../state/EthereumContext.js"
import PriceContext from "../state/PriceContext.js"
import { parse, format, formatNumber } from "../helpers/number.js"
import { useContext } from "react"

// Router outputs component

const RouterOutputs = () => {
    // Swap data

    const { theme } = useContext(ThemeContext)
    const { chain } = useContext(EthereumContext)
    const prices = useContext(PriceContext)
    const { width } = useContext(WindowSizeContext)
    const swap = chain.swap

    // Get token value

    function getTokenValue(token, amount) {
        if (!prices[token.symbol]) return 0
        return +parse(amount, token.decimals) * prices[token.symbol]
    }

    // Replace token image with default unknown

    function defaultImage(event) {
        if (event.currentTarget.src.endsWith("unknown.svg") || event.currentTarget.src.endsWith("unknown-white.svg")) return
        event.currentTarget.src = theme === "dark" ? "/tokens/unknown-white.svg" : "/tokens/unknown.svg"
    }

    // Component

    return (
        <>
            <div className="routers">
                <div className="title">Router Quotes</div>
                {swap.routers.map(router => (
                    <div className="router" key={router.id}>
                        <div className="section">
                            <img className="icon" src={`/routers/${router.routerId || router.id}.svg`}></img>
                            <div className="router-name">{router.name}</div>
                        </div>
                        <div className="section">
                            {swap.tokenIn ? (
                                <img className="icon" src={`/tokens/${chain.id}/${swap.tokenIn.symbol}-${swap.tokenIn.address}.svg`} onError={defaultImage}></img>
                            ) : <></>}
                            {`${swap.tokenIn && swap.tokenInAmount ? format(parse(swap.tokenInAmount, swap.tokenIn.decimals)) : "..."} `}
                            {swap.tokenIn && width > 550 ? swap.tokenIn.symbol : ""}
                            <div className="arrow">➔</div>
                            {swap.tokenOut ? (
                                <img className="icon" src={`/tokens/${chain.id}/${swap.tokenOut.symbol}-${swap.tokenOut.address}.svg`} onError={defaultImage}></img>
                            ) : <></>}
                            {`${router.out === false || !chain.swapSettings.routers[router.id].enabled ? "—" : swap.tokenOut && router.out ? format(parse(router.out, swap.tokenOut.decimals)) : "..."} `}
                            {swap.tokenOut && width > 550 ? swap.tokenOut.symbol : ""}
                        </div>
                        <div className="section">
                            {router.out === false || !chain.swapSettings.routers[router.id].enabled ? "—" : swap.tokenOut && router.out ? swap.tokenOut.default ? `≈ $${formatNumber(getTokenValue(swap.tokenOut, router.out))}` : width > 550 ? "Price Unknown" : "Unknown" : "..."}
                        </div>
                    </div>
                ))}
            </div>
            <style jsx>{`
                .routers {
                    width: 100%;
                    display: flex;
                    flex-direction: column;
                    justify-content: flex-start;
                    align-items: flex-start;
                    border-top: 0.5px solid var(--gray);
                    padding-top: 32px;
                }

                .title {
                    font-size: 1.2rem;
                    margin-bottom: 16px;
                }

                .router {
                    width: 100%;
                    display: grid;
                    grid-template-columns: 4fr 11fr 5fr;
                    gap: 8px 16px;
                    padding: 22px 0;
                }

                .section {
                    display: flex;
                    flex-direction: row;
                    justify-content: flex-start;
                    align-items: center;
                    gap: 14px;
                    font-size: 1.1rem;
                }

                .icon {
                    width: 1.1rem;
                    height: 1.1rem;
                    object-fit: contain;
                }

                .icon[src="/routers/0x.svg"] {
                    filter: ${theme === "dark" ? "invert(1)" : "none"};
                }

                .arrow {
                    margin: 0 16px;
                }

                @media only screen and (max-width: 1000px), (max-height: 900px) {
                    .routers {
                        padding-top: 24px;
                    }

                    .title {
                        margin-bottom: 12px;
                    }

                    .router {
                        padding: 16px 0;
                    }
                }

                @media only screen and (max-width: 800px), (max-height: 800px) {
                    .routers {
                        padding-top: 20px;
                    }

                    .title {
                        margin-bottom: 10px;
                    }

                    .router {
                        padding: 12px 0;
                    }
                }

                @media only screen and (max-width: 700px) {
                    .routers {
                        padding-top: 0;
                        border-top: none;
                    }

                    .section {
                        gap: 10px;
                    }

                    .arrow {
                        margin: 0 12px;
                    }
                }

                @media only screen and (max-width: 550px) {
                    .router {
                        grid-template-columns: calc(1.2rem + 4px) 5fr 2fr;
                        gap: 12px;
                    }

                    .section {
                        gap: 8px;
                        font-size: 1rem;
                    }

                    .arrow {
                        margin: 0;
                    }

                    .router-name {
                        display: none;
                    }
                }
            `}</style>
        </>
    )
}

// Exports

export default RouterOutputs