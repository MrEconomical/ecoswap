// Files and modules

import chainData from "../data/chains"
import useTokens from "./useTokens"
import useSwap from "./useSwap"
import useSwapSettings from "./useSwapSettings"
import useGasPrice from "./useGasPrice"
import ERC20ABI from "../abis/ERC20"
import { createContext, useEffect, useState } from "react"
import Web3 from "web3"

// Load Ethereum data

const web3 = new Web3()
const BN = n => new web3.utils.BN(n)
const chains = {}
for (const id in chainData) {
    chains[id] = {
        id,
        ...chainData[id],
        web3: new Web3(chainData[id].rpc)
    }
}

// Ethereum context

const EthereumContext = createContext({
    web3,
    chains,
    BN
})

// Ethereum context provider

const EthereumContextProvider = ({ children }) => {
    // Default Ethereum application state

    const swapSettings = useSwapSettings(chains)
    for (const id in chains) {
        // Initialize token list

        const [ tokens, setTokens ] = useTokens(id)
        chains[id].tokens = tokens
        chains[id].setTokens = setTokens

        // Initialize token balances to 0

        const balances = {}
        for (const token of chains[id].tokens) {
            balances[token.address] = BN(0)
        }
        const [ tokenBalances, setTokenBalances ] = useState(balances)
        chains[id].tokenBalances = tokenBalances
        chains[id].setTokenBalances = setTokenBalances

        // Initialize swap state

        chains[id].swap = useSwap(chains[id])
        chains[id].swapSettings = swapSettings
        chains[id].gasPrice = useGasPrice(id)
    }

    const [ enabled, setEnabled ] = useState(false) // non-responsive
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

    // Update token balances

    async function updateBalances() {
        // Token balance data

        if (!account) return
        const balances = {}
        const tokens = Object.keys(chain.tokenBalances)
        let index = 0

        // Run concurrent tasks

        await Promise.all(Array.from({ length: 5 }).map(() => {
            return new Promise(resolve => {
                let busy = false
                const interval = setInterval(async () => {
                    if (busy) return
                    busy = true
                    if (index >= tokens.length) {
                        clearInterval(interval)
                        return resolve()
                    }
                    const token = tokens[index ++]
                    balances[token] = await getTokenBalance(token, account)
                    busy = false
                }, 50)
            })
        }))

        // Update state

        chain.setTokenBalances(balances)
    }

    // Fetch token balance

    async function getTokenBalance(token, account, retry = 0) {
        try {
            if (token === "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE") {
                return BN(await chain.web3.eth.getBalance(account))
            } else {
                const Token = new chain.web3.eth.Contract(ERC20ABI, token)
                return BN(await Token.methods.balanceOf(account).call())
            }
        } catch(error) {
            console.error(error)
            if (retry === 1) return BN(0)
            return await getTokenBalance(token, account, retry + 1)
        }
    }

    // Run initial client side update

    useEffect(() => {
        setEnabled(typeof ethereum !== "undefined")
        updateAccount()
        updateChain()
    }, [])

    // Set MetaMask listeners

    useEffect(() => {
        if (typeof ethereum !== "undefined") {
            ethereum.on("accountsChanged", updateAccount)
            ethereum.on("chainChanged", updateChain)
        }
        return () => {
            if (typeof ethereum !== "undefined") {
                ethereum.removeListener("accountsChanged", updateAccount)
                ethereum.removeListener("chainChanged", updateChain)
            }
        }
    }, [])

    // Update token balances on loop

    useEffect(() => {
        const chainId = chain.id
        updateBalances()
        const interval = setInterval(updateBalances, 3000)
        return () => {
            clearInterval(interval)
            const balances = {}
            for (const token in chains[chainId].tokenBalances) {
                balances[token] = BN(0)
            }
            chains[chainId].setTokenBalances(balances)
        }
    }, [chain, account])

    // Component

    return (
        <EthereumContext.Provider value={{
            enabled,
            web3,
            chain,
            account,
            chains,
            BN
        }}>
            {children}
        </EthereumContext.Provider>
    )
}

// Exports

export { EthereumContextProvider, chains }
export default EthereumContext