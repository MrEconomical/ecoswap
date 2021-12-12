// Files and modules

import routerList from "../data/routers"
import axios from "axios"
import { useEffect, useState } from "react"

// Swap settings hook

function useSwapSettings(chains) {
    // Swap settings state data

    const [ slippage, setSlippage ] = useState(0.5)
    const initialGas = {}
    for (const chainId in chains) {
        initialGas[chainId] = "normal"
    }
    const [ gas, setGas ] = useState(initialGas)
    const initialRouters = {}
    for (const router of routerList) {
        initialRouters[router.id] = true
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

    // Run initial client side update

    useEffect(() => {
        if (!localStorage.swapSettings) {
            localStorage.swapSettings = JSON.stringify(getDefault())
        } else {
            try {
                const settings = JSON.parse(localStorage.swapSettings)
                if (!isNaN(+settings.slippage) && +settings.slippage < 50) {
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
        gas,
        routers,
        referral
    }
}

// Exports

export default useSwapSettings