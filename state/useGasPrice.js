// Files and modules

import { BN } from "./EthereumContext.js"
import axios from "axios"
import { useState, useEffect, useRef } from "react"

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

    const gasPrice = {
        slow,
        default: normal,
        fast,
        priorityFee,
        getPriorityFee,
        getGasParameters
    }

    // Update gas prices

    async function updateGas() {
        try {
            if (chainId === "0x1") {
                // Ethereum gas

                const keys = [
                    "8Z5ND5ZBTKG83WGQG4WI5PXR1S776726X8",
                    "MSUS7ZCDVKX5K3U3PY9H9I3EMKYT6MIABW",
                    "T1N65JHDCQY6KM366BXCH5JFR7RXXM7D3F"
                ]

                const data = (await axios(`https://api.etherscan.io/api?module=gastracker&action=gasoracle&apikey=${keys[Math.floor(Math.random() * keys.length)]}`)).data.result
                setSlow(+data.SafeGasPrice)
                setNormal(+data.ProposeGasPrice)
                setFast(+data.FastGasPrice)
                setPriorityFee({
                    slow: 1,
                    default: 2,
                    fast: +data.FastGasPrice > 200 ? 6 : 4
                })
            } else if (chainId === "0x89" || chainId === "0xa86a") {
                // Polygon and Avalanche gas

                const data = (await axios(`https://api.zapper.fi/v1/gas-prices?network=${
                    chainId === "0x89" ? "polygon" :
                    chainId === "0xa86a" ? "avalanche" : null
                }&api_key=96e0cc51-a62e-42ca-acee-910ea7d2a241`)).data
                setSlow(data.standard)
                setNormal(data.fast)
                setFast(data.instant)

                if (chainId === "0x89") {
                    setPriorityFee({
                        slow: Math.min(data.standard > 30 ? 10 : 2, data.standard),
                        default: Math.min(data.fast > 35 ? 20 : 4, data.fast),
                        fast: data.instant
                    })
                } else if (chainId === "0xa86a") {
                    setPriorityFee({
                        slow: Math.min(15, data.standard),
                        default: Math.min(25, data.fast),
                        fast: Math.min(data.instant > 100 ? 40 : 30, data.instant)
                    })
                }
            } else {
                // Default gas API

                const data = (await axios(`https://api.zapper.fi/v1/gas-prices?network=${
                    chainId === "0xfa" ? "fantom" :
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

    // Calculate priority fee

    function getPriorityFee(gas) {
        if (typeof gas !== "number") {
            return priorityFee[gas]
        }
        if (gas <= slow) {
            return priorityFee.slow
        } else if (gas <= normal) {
            return priorityFee.default
        } else {
            return priorityFee.fast
        }
    }

    // Calculate gas parameters

    function getGasParameters(gas) {
        if (gas === "default") return {}
        if (["0x1", "0x89", "0xa86a"].includes(chainId)) {
            return {
                type: "2",
                maxFeePerGas: BN((gasPrice[gas] || gas) * 100).mul(BN(10).pow(BN(7))).toString(16),
                maxPriorityFeePerGas: BN(getPriorityFee(gas) * 100).mul(BN(10).pow(BN(7))).toString(16)
            }
        } else {
            return {
                type: "1",
                gasPrice: BN((gasPrice[gas] || gas) * 100).mul(BN(10).pow(BN(7))).toString(16)
            }
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
        const interval = setInterval(updateGas, chain.id === chainId ? 5000 : 20000)
        return () => clearInterval(interval)
    }, [chain])

    // Gas data

    return gasPrice
}

// Exports

export default useGasPrice