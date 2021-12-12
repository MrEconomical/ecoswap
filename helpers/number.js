// Convert BN to string

function parse(num, decimals = 18) {
    return num.toString()
}

// Format number

function format(num, maxDecimals = 18) {
    return (+num).toLocaleString(undefined, {
        maximumFractionDigits: maxDecimals
    })
}

// Exports

export { parse, format }