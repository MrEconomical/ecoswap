// Files and modules

import axios from "axios"

// Chain gas price hook

function useGasPrice(chainId) {
    return {
        base: 40,
        slow: 50,
        default: 100,
        fast: 150
    }
}

// Exports

export default useGasPrice