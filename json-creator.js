import fs from "fs";
import { fetchData } from "./utils.js";
import { STATE_ID, YEAR_ID } from "./config.js";
const districtURL = `https://kys.udiseplus.gov.in/api/districts?stateId=${STATE_ID}&yearId=${YEAR_ID}`
const blockURL = (districtId) => `https://kys.udiseplus.gov.in/api/blocks?districtId=${districtId}&yearId=${YEAR_ID}`


const getDistricts = async () => {
    const data = await fetchData(districtURL);
    const { data: districts } = data
    // console.log(districts)
    return districts
}
const getBlocks = async (districtId) => {
    const data = await fetchData(blockURL(districtId))
    const { data: blocks } = data
    // console.log(blocks)
    return blocks
}
// save the districts and blocks data to json files
const getBaseJsonFiles = async () => {
    const districtsData = await getDistricts()
    fs.writeFileSync('districts.json', JSON.stringify(districtsData, null, 2))
    const blocks = await Promise.all(districtsData.map(async (district) => {
        return await getBlocks(district.districtId)
    }))
    const blocksData = blocks.flat()
    fs.writeFileSync('blocks.json', JSON.stringify(blocksData, null, 2))
    // console.log(blocksData)
}


/**
 * The main function of the program.
 * Calls getBaseJsonFiles to fetch and save the districts and blocks data to json files.
 * Logs a success message if the operation is successful.
 * Logs an error message if the operation fails.
 */
async function main() {
    try {
        await getBaseJsonFiles()
        console.log("Districts and Blocks data saved to json files")
    }
    catch (error) {
        console.error('Error', error)
    }
}
async function run() {
    await main()
}
run()
