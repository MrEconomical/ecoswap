// Files and modules

import axios from "axios"
import { useEffect, useState, useRef } from "react"

// Chain gas price hook

function useGasPrice(chainId, chain) {
    // Gas state data

    const [ slow, setSlow ] = useState(0)
    const [ normal, setNormal ] = useState(0)
    const [ fast, setFast ] = useState(0)
    const [ priorityFee, setPriorityFee ] = useState({
        slow: 0,
        default: 0,
        fast: 0
    })
    const initialized = useRef(false)

    // Update gas prices

    async function updateGas() {
        try {
            if (chainId === "0x1") {
                const data = (await axios("https://ethgas.watch/api/gas")).data
                setSlow(data.slow.gwei)
                setNormal(data.normal.gwei)
                setFast(data.instant.gwei)
                setPriorityFee({
                    slow: 1,
                    default: 2,
                    fast: data.instant.gwei > 200 ? 6 : 4
                })
            } else {
                const data = (await axios(`https://api.zapper.fi/v1/gas-price?network=${
                    chainId === "0x89" ? "polygon" :
                    chainId === "0xfa" ? "fantom" :
                    chainId === "0xa86a" ? "avalanche" :
                    chainId === "0x38" ? "binance-smart-chain" : null
                }&api_key=96e0cc51-a62e-42ca-acee-910ea7d2a241`)).data
                setSlow(data.standard)
                setNormal(data.fast)
                setFast(data.instant)
            }
        } catch(error) {
            console.error(error)
        }
    }

    // Update gas price fetch loop on chain changes

    useEffect(() => {
        if (chain.id === chainId) {
            updateGas()
        } else if (!initialized.current) {
            initialized.current = true
            updateGas()
        }
        const interval = setInterval(updateGas, chain.id === chainId ? 3000 : 10000)
        return () => clearInterval(interval)
    }, [chain])

    // Gas data

    return {
        slow,
        default: normal,
        fast,
        priorityFee
    }
}

// Exports

export default useGasPrice