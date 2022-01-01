// Files and modules

import { createContext, useState, useEffect } from "react"

// Theme context

const ThemeContext = createContext({
    theme: "light",
    setTheme: () => {}
})

// Theme context provider

const ThemeContextProvider = ({ children }) => {
    // Theme state data

    const [ theme, setTheme ] = useState("light")

    // Load theme from local storage

    useEffect(() => {
        if (!localStorage.theme) {
            localStorage.theme = theme
        } else {
            setTheme(localStorage.theme)
        }
    }, [])

    // Update local storage on theme changes

    useEffect(() => {
        localStorage.theme = theme
    }, [theme])

    // Component

    return (
        <ThemeContext.Provider value={{
            theme,
            setTheme
        }}>
            {children}
        </ThemeContext.Provider>
    )
}

// Exports

export { ThemeContextProvider }
export default ThemeContext