// Files and modules

import routerList from "../data/routers.json"
import { useState, useEffect } from "react"

// Swap settings hook

function useSwapSettings(chains) {
    // Swap settings state data

    const [ slippage, setSlippage ] = useState(0.5)
    const initialGas = {}
    for (const chainId in chains) {
        initialGas[chainId] = "default"
    }
    const [ gas, setGas ] = useState(initialGas)
    const initialRouters = {}
    for (const router of routerList) {
        initialRouters[router.id] = {
            name: router.name,
            enabled: true
        }
    }
    const [ routers, setRouters ] = useState(initialRouters)
    const [ referral, setReferral ] = useState()

    // Default settings

    function getDefault() {
        return {
            slippage: 0.5,
            gas: initialGas,
            routers: initialRouters,
            referral: null
        }
    }

    // Get swap settings from local storage

    useEffect(() => {
        if (!localStorage.swapSettings) {
            localStorage.swapSettings = JSON.stringify(getDefault())
        } else {
            try {
                const settings = JSON.parse(localStorage.swapSettings)
                if (!isNaN(+settings.slippage) && +settings.slippage > 0 && +settings.slippage < 50) {
                    setSlippage(+settings.slippage)
                } else {
                    settings.slippage = 0.5
                }
                if (Object.keys(settings.gas).length === Object.keys(initialGas).length) {
                    setGas(settings.gas)
                } else {
                    settings.gas = initialGas
                }
                if (Object.keys(settings.routers).length === Object.keys(initialRouters).length) {
                    setRouters(settings.routers)
                } else {
                    settings.routers = initialRouters
                }
                setReferral(settings.referral)
                localStorage.swapSettings = JSON.stringify(settings)
            } catch {
                localStorage.swapSettings = JSON.stringify(getDefault())
            }
        }
    }, [])

    // Update local storage on settings change

    useEffect(() => {
        localStorage.swapSettings = JSON.stringify({
            slippage,
            gas,
            routers,
            referral
        })
    }, [slippage, gas, routers, referral])

    // Settings data

    return {
        slippage,
        setSlippage,
        gas,
        setGas,
        routers,
        setRouters,
        referral,
        setReferral
    }
}

// Exports

export default useSwapSettings