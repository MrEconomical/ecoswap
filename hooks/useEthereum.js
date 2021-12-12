// Files and modules

import chainData from "../data/chains"
import useGlobalState from "./useGlobalState"
import useSwap from "./useSwap"
import { useEffect } from "react"
import Web3 from "web3"

// Load Ethereum data

const web3 = new Web3()
const BN = n => new web3.utils.BN(n)
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

    const [ enabled, setEnabled ] = useGlobalState("enabled", false) // non-responsive
    const [ chain, setChain ] = useGlobalState("chain", chains["0x1"])
    const [ account, setAccount ] = useGlobalState("account", null)

    for (const id in chains) {
        if (!chains[id].swap) {
            chains[id].swap = useSwap(chains[id])
        }
    }

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
        console.log("running my use effect")
        console.log(typeof window)
        if (typeof window !== "undefined" && !window.ethereumInitialized) {
            window.ethereumInitialized = true
            setEnabled(typeof ethereum !== "undefined")
            updateAccount()
            updateChain()
        }
        return () => {
            if (window.ethereumInitialized) {
                window.ethereumInitialized = false
            }
        }
    }, [])

    // Set MetaMask listeners

    useEffect(() => {
        if (typeof ethereum !== "undefined" && !ethereum.listenersAdded) {
            ethereum.listenersAdded = true
            ethereum.on("accountsChanged", updateAccount)
            ethereum.on("chainChanged", updateChain)
        }
        return () => {
            if (typeof ethereum !== "undefined" && ethereum.listenersAdded) {
                ethereum.listenersAdded = false
                ethereum.removeListener("accountsChanged", updateAccount)
                ethereum.removeListener("chainChanged", updateChain)
            }
        }
    }, [])

    // Ethereum data

    return {
        enabled,
        web3,
        BN,
        chain,
        account,
        chains
    }
}

// Exports

export { chains }
export default useEthereum