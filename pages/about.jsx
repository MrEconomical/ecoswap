// About page

const About = () => (
    <>
        <div className="content">
            <h1 className="title">About EcoSwap</h1>
            <p className="paragraph">EcoSwap is a simple, privacy-centered swap interface designed to streamline the token swapping experience into a single app. Fetching data from all the major aggregators, EcoSwap finds the best quote quickly without any of the extra bloat of a complicated swap interface.</p>
            <p className="paragraph">EcoSwap was also designed with privacy and analytics in mind. Many Dapps now track wallet addresses and other data, which can be a big violation of privacy. EcoSwap does not collect wallet addresses, browser fingerprints, or any other kind of tracking data and uses aggregator APIs directly, bypassing any interfaces that may contain tracking software.</p>
            <p className="paragraph">To become a part of the community, join the EcoSwap Discord server where you can report bugs, get all the latest announcements and updates are posted, and chat with other cool DeFi users.</p>
            <p className="paragraph">EcoSwap was created without any intention of ever being profitable or being monetized, so donations are much appreciated!</p>
            <div className="attribution first">Art and graphics by Junion</div>
            <div className="attribution">Icons by FontAwesome</div>
        </div>
        <style jsx>{`
            .content {
                width: 100%;
                height: calc(100vh - 140px);
                display: flex;
                flex-direction: column;
                justify-content: center;
                align-items: flex-start;
                padding: 0 calc(50% - 300px) 20px calc(50% - 300px);
            }

            .title {
                font-size: 2rem;
                margin-bottom: 32px;
            }

            .paragraph {
                font-size: 1.1rem;
                margin-bottom: 16px;
            }

            .attribution {
                color: var(--gray);
                font-size: 0.9rem;
                margin-bottom: 4px;
            }

            .first {
                margin-top: 16px;
            }

            @media only screen and (max-width: 1000px), (max-height: 900px) {
                .content {
                    height: calc(100vh - 100px);
                }
            }
        `}</style>
    </>
)

// Exports

export async function getStaticProps() {
    return {
        props: {
            page: "About"
        }
    }
}

export default About