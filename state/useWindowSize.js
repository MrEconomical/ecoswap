// Files and modules

import { useEffect, useState } from "react"

// Window size hook

function useWindowSize() {
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

    // Window size data

    return {
        width,
        height
    }
}

// Exports

export default useWindowSize