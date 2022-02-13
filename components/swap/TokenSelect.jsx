// Files and modules

import ERC20ABI from "../../abis/ERC20.json"
import ThemeContext from "../../state/ThemeContext.js"
import EthereumContext, { web3, BN } from "../../state/EthereumContext.js"
import { parse, format } from "../../helpers/number.js"
import { useState, useEffect, useContext } from "react"

// Token selection component

const TokenSelect = ({ label, type }) => {
    // Token selection menu data

    const { theme } = useContext(ThemeContext)
    const { chain, account } = useContext(EthereumContext)
    const activeToken = chain.swap[type === "input" ? "tokenIn" : "tokenOut"]
    const setActiveToken = chain.swap[type === "input" ? "setTokenIn" : "setTokenOut"]
    const oppositeToken = chain.swap[type === "input" ? "tokenOut" : "tokenIn"]
    const setOppositeToken = chain.swap[type === "input" ? "setTokenOut" : "setTokenIn"]
    const [ menuActive, setMenuActive ] = useState(false)
    const [ tokenList, setTokenList ] = useState(chain.tokens)

    // Update token search with query

    function updateTokenList(event) {
        // Get query and searchable tokens

        const query = event.target.value.toLowerCase()
        if (!query) return setTokenList(chain.tokens.filter(token => oppositeToken ? token.address !== oppositeToken.address : true))
        const tokens = chain.tokens.filter(token => (oppositeToken ? token.address !== oppositeToken.address : true) &&
                                                    (token.name.toLowerCase().includes(query) ||
                                                    token.symbol.toLowerCase().includes(query) ||
                                                    token.address.toLowerCase() === query))

        tokens.sort((a, b) => {
            // Sort tokens by address

            if (a.address.toLowerCase() === query) {
                return -1
            } else if (b.address.toLowerCase() === query) {
                return 1
            }

            // Sort tokens by index of match

            const nameA = a.name.toLowerCase()
            const symbolA = a.symbol.toLowerCase()
            const nameB = b.name.toLowerCase()
            const symbolB = b.symbol.toLowerCase()

            if ((symbolA.includes(query) && !symbolB.includes(query)) || (nameA.includes(query) && !nameB.includes(query))) return -1
            if ((symbolB.includes(query) && !symbolA.includes(query)) || (nameB.includes(query) && !nameA.includes(query))) return 1

            if (symbolA.includes(query) && symbolB.includes(query)) {
                return symbolA.indexOf(query) < symbolB.indexOf(query) ? -1 : 1
            } else {
                return nameA.indexOf(query) < nameB.indexOf(query) ? -1 : 1
            }
        })

        // Update token list

        setTokenList(tokens)
        if (web3.utils.isAddress(query) && !chain.tokens.find(token => token.address.toLowerCase() === query)) {
            addExternalToken(query, tokens)
        }
    }

    // Add external token to token list

    async function addExternalToken(address, tokenList) {
        // Fetch token data

        const Token = new chain.web3.eth.Contract(ERC20ABI, address)
        let name, symbol, decimals, balance
        try {
            [ name, symbol, decimals, balance ] = await Promise.all([
                Token.methods.name().call()
                    .catch(async () => {
                        return web3.utils.toAscii(await chain.web3.eth.call({
                            to: Token._address,
                            data: Token.methods.name().encodeABI()
                        })).replace(/\0/g, "")
                    }),
                Token.methods.symbol().call()
                    .catch(async () => {
                        return web3.utils.toAscii(await chain.web3.eth.call({
                            to: Token._address,
                            data: Token.methods.symbol().encodeABI()
                        })).replace(/\0/g, "")
                    }),
                Token.methods.decimals().call(),
                account ? Token.methods.balanceOf(account).call() : 0,
            ])
        } catch {
            return
        }

        // Set token balances and token list

        chain.setTokenBalances({
            ...chain.tokenBalances,
            [Token._address]: BN(balance)
        })
        setTokenList([...tokenList, {
            external: true,
            added: false,
            name,
            symbol,
            address: Token._address,
            decimals: +decimals
        }])
    }

    // Switch to selected token

    function switchToken(event, newToken) {
        for (const element of event.nativeEvent.path || event.nativeEvent.composedPath()) {
            if (element.classList && element.classList.contains("token-control")) return
        }
        if (chain.tokens.find(token => token.address === newToken.address)) {
            // Switch to existing token

            setActiveToken({...newToken})
            setTokenList(chain.tokens.filter(token => oppositeToken ? token.address !== oppositeToken.address : true))
        } else {
            // Add new token to token list

            const tokens = [...chain.tokens, newToken]
            chain.setTokens(tokens)
            setActiveToken({...newToken})
            setTokenList(tokens.filter(token => oppositeToken ? token.address !== oppositeToken.address : true))
        }
        setMenuActive(false)
    }

    // Add external token to token list

    function addToken(newToken) {
        const tokens = [...chain.tokens]
        const existing = tokens.find(token => token.address === newToken.address)
        if (existing) {
            // Update existing external token to added token

            existing.added = true
            if (activeToken && activeToken.address === newToken.address) {
                setActiveToken({...newToken})
            } else if (oppositeToken && oppositeToken.address === newToken.address) {
                setOppositeToken({...newToken})
            }
        } else {
            // Add new external token

            newToken.added = true
            tokens.push(newToken)
        }
        chain.setTokens(tokens)
    }

    // Remove external token from token list

    function removeToken(oldToken) {
        // Clear selected tokens

        if (activeToken?.address === oldToken.address) {
            setActiveToken(null)
        } else if (oppositeToken?.address == oldToken.address) {
            setOppositeToken(null)
        }

        // Remove token from token list

        const tokenListIndex = tokenList.findIndex(token => token.address === oldToken.address)
        setTokenList(tokenList.slice(0, tokenListIndex).concat(tokenList.slice(tokenListIndex + 1)))
        const chainTokensIndex = chain.tokens.findIndex(token => token.address === oldToken.address)
        chain.setTokens(chain.tokens.slice(0, chainTokensIndex).concat(chain.tokens.slice(chainTokensIndex + 1)))
    }

    // Replace token image with default unknown

    function defaultImage(event) {
        if (event.currentTarget.src.endsWith("unknown.svg") || event.currentTarget.src.endsWith("unknown-white.svg")) return
        event.currentTarget.src = theme === "dark" ? "/tokens/unknown-white.svg" : "/tokens/unknown.svg"
    }

    // Hide menu on chain or account changes

    useEffect(() => {
        setMenuActive(false)
    }, [chain, account])

    // Update token list on data changes

    useEffect(() => {
        setTokenList(chain.tokens.filter(token => oppositeToken ? token.address !== oppositeToken.address : true))
    }, [chain, oppositeToken])

    // Remove unselected external tokens from token balances on menu changes

    useEffect(() => {
        if (menuActive) return
        const balances = {...chain.tokenBalances}
        for (const address in balances) {
            if (!chain.tokens.find(token => address === token.address)) {
                delete balances[address]
            }
        }
        chain.setTokenBalances(balances)
    }, [menuActive])

    // Component

    return (
        <>
            <button className="select" onClick={() => setMenuActive(true)}>
                {activeToken ? activeToken.symbol.length > 9 ? `${activeToken.symbol.slice(0, 8)}...` : activeToken.symbol : "Choose"}
                <img className="arrow" src="/icons/arrow-down.svg"></img>
            </button>
            {menuActive ? (
                <div className="menu">
                    <div className="header">
                        <div>Select {label}</div>
                        <button className="exit" onClick={() => setMenuActive(false)}>
                            <img className="exit-icon" src="/icons/exit.svg"></img>
                        </button>
                    </div>
                    <div className="token-search">
                        <img className="search-icon" src="/icons/search.svg"></img>
                        <input className="search" onChange={updateTokenList}></input>
                    </div>
                    <div className="tokens">
                        {tokenList.map(token => (
                            <button className="token" key={`${chain.id}-${type}-${token.address}`} onClick={event => switchToken(event, token)}>
                                <img className="icon" src={`/tokens/${chain.id}/${token.symbol}-${token.address}.svg`} onError={defaultImage}></img>
                                <div className="info">
                                    <div className="name">{token.name} - {token.symbol}</div>
                                    <div className="token-menu">
                                        <div className="balance">
                                            {chain.tokenBalances[token.address] ? format(parse(chain.tokenBalances[token.address], token.decimals)) : "0"}
                                        </div>
                                        {token.external ? token.added ? (
                                            <div className="token-control" onClick={() => removeToken(token)}>- Remove</div>
                                        ) : (
                                            <div className="token-control" onClick={() => addToken(token)}>+ Add</div>
                                        ) : <></>}
                                    </div>
                                </div>
                            </button>
                        ))}
                    </div>
                </div>
             ) : <></>}
            <style jsx>{`
                .select {
                    display: flex;
                    flex-direction: row;
                    justify-content: flex-end;
                    align-items: center;
                    font-size: 1.2rem;
                    overflow: hidden;
                    margin-left: auto;
                    padding: 9px 0;
                }

                .arrow {
                    width: 0.9rem;
                    height: 0.9rem;
                    object-fit: contain;
                    margin-left: 8px;
                }

                .menu {
                    position: absolute;
                    top: 32px;
                    left: 0;
                    width: calc(100% - 32px);
                    height: calc(100% - 64px);
                    z-index: 1;
                    background-color: var(--background);
                }

                .header {
                    display: flex;
                    flex-direction: row;
                    justify-content: flex-start;
                    align-items: center;
                    margin-bottom: 16px;
                }

                .exit {
                    width: 0.75rem;
                    height: 0.75rem;
                    margin-left: auto;
                }

                .exit-icon {
                    width: 100%;
                    height: 100%;
                    object-fit: contain;
                }

                .token-search {
                    display: flex;
                    flex-direction: row;
                    justify-content: flex-start;
                    align-items: center;
                    margin-bottom: 16px;
                }

                .search-icon {
                    width: 0.75rem;
                    height: 0.75rem;
                    object-fit: contain;
                    margin-right: 16px;
                }

                .search {
                    width: 100%;
                    outline: none;
                    background-color: var(--input-background);
                    border: 1px solid var(--light-gray);
                    border-radius: 8px;
                    padding: 6px 8px;
                }

                .search:focus {
                    border: 1px solid var(--gray);
                }

                .tokens {
                    width: 100%;
                    height: calc(100% - 1.2rem - 16px - 1rem - 14px - 16px - 1px);
                    display: flex;
                    flex-direction: column;
                    justify-content: flex-start;
                    align-items: flex-start;
                    overflow: auto;
                }

                .token {
                    width: calc(100% - 8px);
                    display: flex;
                    flex-direction: row;
                    justify-content: flex-start;
                    align-items: center;
                    border: 1px solid var(--background);
                    border-radius: 8px;
                    padding: 12px;
                    margin-left: 4px;
                    margin-right: 4px;
                }

                .token:hover {
                    border: 1px solid var(--light-dark);
                }

                .icon {
                    width: 2.5rem;
                    height: 2.5rem;
                    object-fit: contain;
                    margin-right: 16px;
                }

                .info {
                    display: flex;
                    flex-direction: column;
                    justify-content: flex-start;
                    align-items: flex-start;
                    flex: 1;
                }

                .name {
                    text-align: left;
                    margin-bottom: 3px;
                }

                .token-menu {
                    width: 100%;
                    display: flex;
                    flex-direction: row;
                    justify-content: flex-start;
                    align-items: center;
                }

                .balance {
                    color: var(--gray);
                }

                .token-control {
                    margin-left: auto;
                }

                .token-control:hover {
                    text-decoration: underline;
                }

                @media only screen and (max-width: 1000px), (max-height: 900px) {
                    .menu {
                        top: 24px;
                        width: calc(100% - 24px);
                        height: calc(100% - 50px);
                    }

                    .icon {
                        margin-right: 12px;
                    }
                }

                @media only screen and (max-width: 800px), (max-height: 800px) {
                    .menu {
                        top: 20px;
                        width: calc(100% - 20px);
                        height: calc(100% - 42px);
                    }
                }

                @media only screen and (max-width: 700px) {
                    .menu {
                        top: 0;
                        left: 0;
                        width: 100%;
                        height: calc(100% - 2px);
                    }
                }
            `}</style>
            <style jsx>{`
                .arrow {
                    filter: ${theme === "dark" ? "invert(1)" : "none"};
                }

                .exit-icon {
                    filter: ${theme === "dark" ? "invert(1)" : "none"};
                }

                .search-icon {
                    filter: ${theme === "dark" ? "invert(1)" : "none"};
                }
            `}</style>
        </>
    )
}

// Exports

export default TokenSelect