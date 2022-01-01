// Files and modules

import { createContext, useState, useEffect } from "react"

// Window size context

const WindowSizeContext = createContext({
    width: 1600,
    height: 900
})

// Window size context provider

const WindowSizeContextProvider = ({ children }) => {
    // Window size state data

    const [ width, setWidth ] = useState(1600)
    const [ height, setHeight ] = useState(1000)

    // Update window size

    function updateWindowSize() {
        setWidth(window.innerWidth)
        setHeight(window.innerHeight)
    }

    // Update window size on resize

    useEffect(() => {
        updateWindowSize()
        window.addEventListener("resize", updateWindowSize)
        return () => window.removeEventListener("resize", updateWindowSize)
    }, [])

    // Component

    return (
        <WindowSizeContext.Provider value={{
            width,
            height
        }}>
            {children}
        </WindowSizeContext.Provider>
    )
}

// Exports

export { WindowSizeContextProvider }
export default WindowSizeContext