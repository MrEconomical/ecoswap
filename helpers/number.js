// Convert BN to string

function parse(num, decimals = 18) {
    if (decimals === 0) return num.toString()
    const padded = num.toString().padStart(decimals + 1, "0")
    const parsed = `${padded.slice(0, -decimals)}.${padded.slice(-decimals)}`.replace(/0+$/g, "")
    return parsed.endsWith(".") ? parsed.slice(0, -1) : parsed
}

// Convert string to BN string

function unparse(num, decimals) {
    const trimmed = num.replace(/,/g, "")
    const float = trimmed.includes(".") ? trimmed.slice(trimmed.indexOf(".") + 1, trimmed.indexOf(".") + 1 + decimals).padEnd(decimals, "0") : "0".repeat(decimals)
    return `${trimmed.includes(".") ? trimmed.slice(0, trimmed.indexOf(".")) : trimmed}${float}`
}

// Format string number

function format(num, decimals = 6) {
    const value = (typeof num === "number" ? num.toString() : num).replace(/,/g, "") || "0"
    const split = decimals > 0 && !value.includes(".") ? [value, "0"] : value.split(".")
    return `${split[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",")}${split[1] ? `.${split[1].match(new RegExp(`^0*\\d{0,${decimals}}`, "g"))[0]}` : ""}`
}

// Format number

function formatNumber(num, decimals = 2) {
    return (+num).toLocaleString(undefined, {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals
    })
}

// Exports

export { parse, unparse, format, formatNumber }