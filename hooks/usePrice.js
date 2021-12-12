// Files and modules

import axios from "axios"
import { useState } from "react"

// Update token prices

const tokens = []
setInterval(async () => {
    try {
        const prices = (await axios("https://api.binance.com/api/v3/ticker/price")).data
        for (const market of prices) {
            for (const token of tokens) {
                if (market.symbol === `${token[0]}USDT`) {
                    token[1](+market.price)
                }
            }
        }
    } catch(error) {
        console.error(error)
    }
}, 3000)

// Token price data hook

function usePrice(token) {
    const [ price, setPrice ] = useState()
    tokens.push([token, setPrice])
    return price
}

// Exports

export default usePrice