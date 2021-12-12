// Files and modules

import axios from "axios"

// Chain gas price hook

function useGasPrice(chainId) {
    return {
        slow: 50,
        normal: 100,
        fast: 150
    }
}

// Exports

export default useGasPrice