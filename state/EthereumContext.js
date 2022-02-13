// Files and modules

import chainData from "../data/chains.json"
import ERC20ABI from "../abis/ERC20.json"
import useTokens from "./useTokens.js"
import useSwap from "./useSwap.js"
import useSwapSettings from "./useSwapSettings.js"
import useGasPrice from "./useGasPrice.js"
import { createContext, useState, useEffect } from "react"
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
    }

    const [ enabled, setEnabled ] = useState(false) // non-responsive
    const [ chain, setChain ] = useState(chains["0x1"])
    const [ account, setAccount ] = useState(null)
    for (const id in chains) {
        chains[id].gasPrice = useGasPrice(id, chain)
    }

    // Update active account

    async function updateAccount() {
        if (typeof ethereum === "undefined") return
        const account = (await ethereum.request({ method: "eth_accounts" }))[0]
        setAccount(web3.utils.toChecksumAddress(account))
    }

    // Update active chain

    async function updateChain() {
        if (typeof ethereum !== "undefined") {
            const chainId = await ethereum.request({ method: "eth_chainId" })
            if (chains[chainId]) {
                setChain(chains[chainId])
            }
        }
    }

    // Update all client side data

    function updateEthereumState() {
        setEnabled(typeof ethereum !== "undefined")
        updateAccount()
        updateChain()
    }

    // Update token balances

    async function updateBalances() {
        // Token balance data

        if (!account) return
        const balances = {}
        const tokens = Object.keys(chain.tokenBalances)

        // Run batch request

        const batch = new chain.web3.BatchRequest()
        const requests = []
        const Token = new chain.web3.eth.Contract(ERC20ABI, token)
        const calldata = Token.methods.balanceOf(account).encodeABI()

        for (const token of tokens) {
            requests.push(new Promise(resolve => {
                // Request callback

                const tokenAddress = token
                const callback = (error, result) => {
                    if (error) {
                        console.error(error)
                        balances[tokenAddress] = BN(0)
                    } else {
                        balances[tokenAddress] = web3.utils.toBN(result)
                    }
                    resolve()
                }

                // Add request to batch

                if (tokenAddress === "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE") {
                    batch.add(web3.eth.getBalance.request(account, callback))
                } else {
                    batch.add(web3.eth.call.request({
                        to: tokenAddress,
                        data: calldata
                    }, callback))
                }
            }))
        }

        batch.execute()
        await Promise.all(requests)

        // Update state

        if (
            Object.keys(chain.tokenBalances).every(token => balances[token]) &&
            Object.keys(balances).every(token => chain.tokenBalances[token])
        ) {
            chain.setTokenBalances(balances)
        } else {
            updateBalances()
        }
    }

    // Update client side data on loop

    useEffect(() => {
        updateEthereumState()
        setTimeout(updateEthereumState, 500)
        setTimeout(updateEthereumState, 1000)
        const interval = setInterval(updateEthereumState, 3000)
        return () => clearInterval(interval)
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

    // Update token balances on token changes

    useEffect(() => {
        // Reset token balances

        const balances = {...chain.tokenBalances}
        for (const token of chain.tokens) {
            if (!balances[token.address]) {
                balances[token.address] = BN(0)
            }
        }

        // Delete removed tokens

        for (const address in balances) {
            if (!chain.tokens.find(token => address === token.address)) {
                delete balances[address]
            }
        }
        chain.setTokenBalances(balances)
    }, [chain.tokens])

    // Update token balances on loop

    useEffect(() => {
        // Update balances on loop

        const chainId = chain.id
        updateBalances()
        const interval = setInterval(updateBalances, 2000)

        // Reset token balances for chain

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
            setEnabled,
            setChain,
            setAccount,
            BN
        }}>
            {children}
        </EthereumContext.Provider>
    )
}

// Exports

export { EthereumContextProvider, web3, chains, BN }
export default EthereumContext