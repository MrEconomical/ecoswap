// Files and modules

import Layout from "../components/Layout"
import { WindowSizeContextProvider } from "../state/WindowSizeContext"
import { EthereumContextProvider } from "../state/EthereumContext"
import { PriceContextProvider } from "../state/PriceContext"
import Head from "next/head"
import Error from "next/error"

// Site metadata

const Metadata = ({ page }) => {
    const title = `EcoSwap${page ? ` - ${page}` : ""}`
    return (
        <Head>
            <meta charSet="UTF-8"></meta>
            <meta name="viewport" content="width=device-width"></meta>
            <meta name="description" content="A privacy-centered DEX aggregator, bringing you a fast, lightweight swap experience with the best rates on Ethereum, Polygon, Fantom, Avalanche, and the Binance Smart Chain"></meta>
            <meta property="og:title" content={title}></meta>
            <meta property="og:type" content="website"></meta>
            <meta property="og:image" content="/ecoswap.png"></meta>
            <meta property="og:description" content="A privacy-centered DEX aggregator, bringing you a fast, lightweight swap experience with the best rates on Ethereum, Polygon, Fantom, Avalanche, and the Binance Smart Chain"></meta>
            <title>{title}</title>
            <link rel="icon" href="/ecoswap-square.png"></link>
        </Head>
    )
}

// Site content

const App = ({ Component, pageProps }) => {
    // Error page

    if (pageProps.statusCode) {
        return <Error statusCode={pageProps.statusCode}></Error>
    }

    // Component

    return (
        <>
            <Metadata page={pageProps.page}></Metadata>
            <WindowSizeContextProvider>
            <EthereumContextProvider>
            <PriceContextProvider>
                <Layout>
                    <Component {...pageProps}></Component>
                </Layout>
            </PriceContextProvider>
            </EthereumContextProvider>
            </WindowSizeContextProvider>
            <style jsx global>{`
                @font-face {
                    font-family: "Gilroy";
                    src: url("/fonts/Gilroy-Medium.woff2") format("woff2");
                }

                :root {
                    --background: #FFFFFF;
                    --accent: #48BF53;
                    --light-dark: #C8EBCB;
                    --light: #ECF8Ed;
                    --black: #16191E;
                    --dark-gray: #56595E;
                    --gray: #96999E;
                    --light-gray: #C6C9CE;
                }

                * {
                    font-family: "Gilroy";
                    color: var(--black);
                    box-sizing: border-box;
                }

                body {
                    background-color: var(--background);
                    margin: 0;
                }

                h1 {
                    font-size: initial;
                    margin: 0;
                }

                h2 {
                    font-size: initial;
                    margin: 0;
                }

                p {
                    margin: 0;
                }

                a {
                    color: initial;
                    text-decoration: initial;
                    cursor: pointer;
                }

                button {
                    cursor: pointer;
                    background-color: transparent;
                    border: none;
                    padding: 0;
                }

                ::-webkit-scrollbar {
                    width: 10px;
                }

                ::-webkit-scrollbar-track {
                    background-color: #E6E9EE;
                }

                ::-webkit-scrollbar-thumb {
                    background-color: #96999E;
                }

                ::-webkit-scrollbar-thumb:hover {
                    background-color: #76797E;
                }

                @media only screen and (max-width: 1000px), (max-height: 900px) {
                    html {
                        font-size: 14px;
                    }
                }

                @media only screen and (max-width: 800px), (max-height: 800px) {
                    html {
                        font-size: 12px;
                    }
                }
            `}</style>
        </>
    )
}

// Exports

export default App