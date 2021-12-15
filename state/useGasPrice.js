// Files and modules

import axios from "axios"
import { useEffect, useState, useRef } from "react"

// Chain gas price hook

function useGasPrice(chainId, chain) {
    // Gas state data

    const [ base, setBase ] = useState(0)
    const [ slow, setSlow ] = useState(0)
    const [ normal, setNormal ] = useState(0)
    const [ fast, setFast ] = useState(0)
    const initialized = useRef(false)

    // Update gas prices

    function updateGas() {
        console.log("update gas called", chainId)
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
        base,
        slow,
        default: normal,
        fast
    }
}

// Exports

export default useGasPrice