// Convert BN to string

function parse(num, decimals = 18) {
    const padded = num.toString().padStart(decimals + 1, "0")
    const parsed = `${padded.slice(0, -18)}.${padded.slice(-18)}`
    return parsed
}

// Format number

function format(num, maxDecimals = 18) {
    return (+num).toLocaleString(undefined, {
        maximumFractionDigits: maxDecimals
    })
}

// Exports

export { parse, format }