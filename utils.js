import {TOKEN} from "./config.js";

export const fetchData = async (url) => {
    // console.log(url)
    const response = await fetch(url, {
        headers: {
            'Token': `${TOKEN}`
        }
    })
    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
    }
    return await response.json()
}
