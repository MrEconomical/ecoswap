// Files and modules

import ERC20ABI from "../abis/ERC20.json"
import approvalCache from "../data/approval-cache.json"
import { web3, BN } from "./EthereumContext.js"
import { useState, useEffect } from "react"

const Token = new web3.eth.Contract(ERC20ABI)

// Token approval hook

function useApproval(chain, account, token) {
    // Token approval state data

    const [ approved, setApproved ] = useState({})

    // Update approval cache loop on state changes

    useEffect(() => {
        // Reset approved contracts

        const newApproved = {}
        for (const address of approvalCache[chain.id]) {
            newApproved[address] = BN(0)
        }
        setApproved(newApproved)

        // Update approvals on loop

        if (!account || !token) return
        updateApproval()
        const interval = setInterval(updateApproval, 2000)
        return () => clearInterval(interval)
    }, [chain, account, token])

    // Update token approvals

    async function updateApproval() {
        // Run batch request

        if (token.address === "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE") return
        const newApproved = {}
        const batch = new chain.web3.BatchRequest()
        const requests = []

        for (const address of approvalCache[chain.id]) {
            requests.push(new Promise(resolve => {
                // Add approval query to batch

                const allowedAddress = address
                batch.add(web3.eth.call.request({
                    to: token.address,
                    data: Token.methods.allowance(account, allowedAddress).encodeABI()
                }, (error, result) => {
                    if (error) {
                        console.error(error)
                        newApproved[allowedAddress] = BN(0)
                    } else {
                        newApproved[allowedAddress] = web3.utils.toBN(result)
                    }
                    resolve()
                }))
            }))
        }

        batch.execute()
        await Promise.all(requests)
        setApproved(newApproved)
    }

    // Get approved amount

    async function getApproved(address) {
        if (approved[address]) return approved[address]
        try {
            const amount = await chain.web3.eth.call({
                to: token.address,
                data: Token.methods.allowance(account, address).encodeABI()
            })
            return web3.utils.toBN(amount)
        } catch(error) {
            console.error(error)
            return BN(0)
        }
    }

    // Approval data

    return getApproved
}

// Exports

export default useApproval