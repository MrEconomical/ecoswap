// Files and modules

import Layout from "../components/Layout"
import Head from "next/head"

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
            {/*<meta property="og:url" content=""></meta>*/}
            <meta property="og:description" content="A privacy-centered DEX aggregator, bringing you a fast, lightweight swap experience with the best rates on Ethereum, Polygon, Fantom, Avalanche, and the Binance Smart Chain"></meta>
            <title>{title}</title>
            <link rel="icon" href="/ecoswap-square.png"></link>
        </Head>
    )
}

// Site content

const App = ({ Component, pageProps }) => (
    <>
        <Metadata page={pageProps.page}></Metadata>
        <Layout>
            <Component {...pageProps}></Component>
        </Layout>
        <style jsx global>{`
            @font-face {
                font-family: "Gilroy";
                src: url("/gilroy/Gilroy-Medium.woff2") format("woff2");
            }

            :root {
                --background: #F6F6F6;
                --accent: #48BF53;
                --light-dark: #C8EBCB;
                --light: #E3F5E5;
                --black: #111111;
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

            a {
                color: initial;
                text-decoration: initial;
                cursor: pointer;
            }

            button {
                cursor: pointer;
            }
        `}</style>
    </>
)

// Exports

export default App