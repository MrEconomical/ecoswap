// Files and modules

import axios from "axios"
import { createContext, useState, useEffect } from "react"

// Token price context

const PriceContext = createContext({})

// Token price context provider

const PriceContextProvider = ({ children }) => {
    // Token price state

    const [ prices, setPrices ] = useState({})

    // Update token prices on interval

    useEffect(() => {
        updatePrices()
        const interval = setInterval(async () => {
            try {
                await updatePrices()
            } catch(error) {
                console.error(error)
            }
        }, 3000)
        return () => clearInterval(interval)
    }, [])

    // Update token prices

    async function updatePrices() {
        // Fetch quotes from Binance

        const prices = {}
        const markets = (await axios("https://api.binance.com/api/v3/ticker/price")).data

        for (const market of markets) {
            if (market.symbol.endsWith("USDT")) {
                const token = market.symbol.slice(0, -4)
                prices[token] = +market.price

                // Wrapped token price

                if (["ETH", "MATIC", "FTM", "AVAX", "BNB"].includes(token)) {
                    prices[`W${token}`] = +market.price
                }

                // Avalanche wrapped token price

                if (["ETH", "USDC", "DAI", "USDT", "BTC"].includes(token)) {
                    if (["ETH", "BTC"].includes(token)) {
                        prices[`W${token}.e`] = +market.price
                    } else {
                        prices[`${token}.e`] = +market.price
                    }
                }

                // BSC token price

                if (token === "BTC") {
                    prices["BTCB"] = +market.price
                }
            }
        }

        // Additional token prices

        prices["USDT"] = 1
        prices["fUSDT"] = 1
        prices["USDT.e"] = 1
        prices["MIM"] = 1

        setPrices(prices)
    }

    // Component

    return (
        <PriceContext.Provider value={prices}>
            {children}
        </PriceContext.Provider>
    )
}

// Exports

export { PriceContextProvider }
export default PriceContext