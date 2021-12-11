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
    // Default Ethereum application state

    const [ enabled, setEnabled ] = useState(false)
    const [ chain, setChain ] = useState(chains["0x1"])
    const [ account, setAccount ] = useState(null)

    // Update active account

    function updateAccount() {
        if (typeof ethereum === "undefined") return
        setAccount(ethereum.selectedAddress)
    }

    // Update active chain

    function updateChain() {
        if (typeof ethereum !== "undefined" && chains[ethereum.chainId]) {
            setChain(chains[ethereum.chainId])
        }
    }

    // Run initial client side update

    useEffect(() => {
        setEnabled(typeof ethereum !== "undefined")
        updateAccount()
        updateChain()
    }, [])

    // Check window.ethereum enabled

    useEffect(() => {
        const interval = setInterval(() => {
            setEnabled(typeof ethereum !== "undefined")
        }, 200)
        return () => clearInterval(interval)
    }, [])

    // Set MetaMask listeners

    useEffect(() => {
        if (typeof ethereum !== "undefined" && !ethereum.initialized) {
            ethereum.initialized = true
            ethereum.on("accountsChanged", updateAccount)
            ethereum.on("chainChanged", updateChain)
        }
        return () => {
            if (typeof ethereum !== "undefined") {
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