// Files and modules

import chainData from "../data/chains"
import { useEffect, useState } from "react"
import Web3 from "web3"

// Load Ethereum data

const web3 = new Web3()
const chains = {}
for (const id in chainData) {
    chains[id] = {
        id,
        ...chainData[id],
        web3: new Web3(chainData[id].rpc),
        tokens: require(`../data/tokens/${id}.json`)
    }
}

// Ethereum hook

function useEthereum() {
    // Ethereum application state

    const [ enabled, setEnabled ] = useState(typeof ethereum !== "undefined")
    const [ chain, setChain ] = useState(chains["0x1"])
    const [ account, setAccount ] = useState(enabled ? ethereum.selectedAddress : null)

    // Update active account

    function updateAccount() {
        if (!enabled) return
        setAccount(ethereum.selectedAddress)
    }

    // Update active chain

    function updateChain() {
        if (enabled && chains[ethereum.chainId]) {
            setChain(chains[ethereum.chainId])
        }
    }
    
    // Set initial client side data values

    useEffect(() => {
        setEnabled(typeof ethereum !== "undefined")
        const interval = setInterval(() => {
            setEnabled(typeof ethereum !== "undefined")
        }, 200)
        return () => clearInterval(interval)
    }, [])

    // Set MetaMask listeners

    useEffect(() => {
        if (enabled && !ethereum.initialized) {
            ethereum.initialized = true
            ethereum.on("accountsChanged", updateAccount)
            ethereum.on("chainChanged", updateChain)
        }
        return () => {
            if (enabled) {
                ethereum.initialized = false
                ethereum.removeListener("accountsChanged", updateAccount)
                ethereum.removeListener("chainChanged", updateChain)
            }
        }
    }, [])

    // Ethereum data

    return {
        enabled,
        web3,
        chain,
        account,
        chains
    }
}

// Exports

export { chains }
export default useEthereum