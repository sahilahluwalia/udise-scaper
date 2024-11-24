import {TOKEN} from "./config.js";

export const fetchData = async (url) => {
    const response = await fetch(url, {
        headers: {
            'Token': `${TOKEN}`
        }
    })
    return await response.json()
}
