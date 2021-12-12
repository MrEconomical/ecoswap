// Files and modules

import axios from "axios"
import { useState } from "react"

// Update token prices

const priceSetters = []
setInterval(async () => {
    try {
        const prices = {}
        const markets = (await axios("https://api.binance.com/api/v3/ticker/price")).data
        for (const market of markets) {
            if (market.symbol.endsWith("USDT")) {
                prices[market.symbol.slice(0, -4)] = +market.price
            }
        }
        for (const setter of priceSetters) {
            setter(prices)
        }
    } catch(error) {
        console.error(error)
    }
}, 3000)

// Token price data hook

function usePrice() {
    const [ prices, setPrices ] = useState({})
    priceSetters.push(setPrices)
    return prices
}

// Exports

export default usePrice