import fs from "fs";
import { fetchData } from "./utils.js";
import ObjectsToCsv from "objects-to-csv";
import { STATE_ID, YEAR_ID } from "./config.js";

const basicSchoolURL = (districtId, blockId) => `https://kys.udiseplus.gov.in/api/search-school/by-region?yearId=${YEAR_ID}&stateId=${STATE_ID}&districtId=${districtId}&blockId=${blockId}&villageId=&clusterId=`

const reportCardURL = (udiseCode) => `https://kys.udiseplus.gov.in/api/school/report-card?udiseCode=${udiseCode}`


const facilityURL = (udiseCode) => `https://kys.udiseplus.gov.in/api/school/facility?udiseCode=${udiseCode}`

const enrolmentURL = (udiseCode) => `https://kys.udiseplus.gov.in/api/school-statistics/enrolment-teacher?udiseCode=${udiseCode}`

const profileURL = (udiseCode) => `https://kys.udiseplus.gov.in/api/school/profile?udiseCode=${udiseCode}`

const yearURL = (udiseCode) => `https://kys.udiseplus.gov.in/api/school/by-year?udiseCode=${udiseCode}&action=1`

const getFacilityData = async (udiseCode) => {
    const data = await fetchData(facilityURL(udiseCode))
    const { data: facilityData } = data
    return facilityData
}

const getProfileData = async (udiseCode) => {
    const data = await fetchData(profileURL(udiseCode))
    const { data: profileData } = data
    return profileData
}


const getEnrolmentData = async (udiseCode) => {
    // console.log(udiseCode)
    const data = await fetchData(enrolmentURL(udiseCode))
    // console.log(data)
    const { data: enrolmentData } = data
    // console.log(enrolmentData)
    return enrolmentData
}

const getReportCardData = async (udiseCode) => {
    const data = await fetchData(reportCardURL(udiseCode))
    const { data: reportCardData } = data
    // console.log(reportCardData)
    return reportCardData
}

const getSchoolDetailsData = async (udiseCode) => {
    const data = await fetchData(yearURL(udiseCode))
    const { data: schoolDetailsData } = data
    return schoolDetailsData
}

/**
 * Retrieves data from the basic school API and combines it with data from
 * the enrolment, school details, and report card APIs
 * @param {number} districtId - district ID
 * @param {number} blockId - block ID
 * @return {Array<Object>} allSchoolData - array of objects with combined data from the four APIs
 */
const getSchoolBaseData = async (districtId, blockId) => {
    const data = await fetchData(basicSchoolURL(districtId, blockId))
    const { data: { content } } = data

    const batchSize = 50;
    let allSchoolData = [];

    for (let i = 0; i < content.length; i += batchSize) {
        const batch = content.slice(i, i + batchSize);

        /**
         * Retrieves and combines data from three APIs for a given school
         * @param {Object} school - school object with udiseschCode, schoolName, pincode, districtName, blockName
         * @return {Object} payload - combined data from the three APIs
         */
        const batchPayload = await Promise.all(batch.map(async (school) => {
            let retries = 0;
            while (retries < 10) {
                try {
                    const enrolmentData = await getEnrolmentData(school.udiseschCode)
                    const schoolDetailsData = await getSchoolDetailsData(school.udiseschCode)
                    const reportCardData = await getReportCardData(school.udiseschCode)
                    const facilityData = await getFacilityData(school.udiseschCode)
                    const profileData = await getProfileData(school.udiseschCode)
                    return { ...school, ...enrolmentData, ...schoolDetailsData, ...reportCardData, ...facilityData, ...profileData }
                } catch (error) {
                    retries++;
                    if (retries === 10) {
                        console.error(`Failed after 10 retries for school ${school.udiseschCode}:`, error)
                        process.exit(1) // Exit if we can't get data after 10 retries
                    }
                    console.log(`Retry ${retries}/10 for school ${school.udiseschCode}`)
                    await new Promise(resolve => setTimeout(resolve, 1000 * retries)) // Exponential backoff
                }
            }
        }));

        allSchoolData = [...allSchoolData, ...batchPayload];
    }

    return allSchoolData;
}


/**
 * Main function that orchestrates the entire data fetching process
 * @async
 * @description
 * Reads district and block data from JSON files, processes each district-block
 * combination by fetching school data from the four APIs (basic school, enrolment,
 * school details, report card), and saves all data to a single CSV file at the end
 * @example
 * node main-fetcher.js
 * @throws {Error} if any of the API calls or CSV saving fails
 */
async function main() {
    try {
        // Read district and block data
        const blocks = await fs.readFileSync('blocks.json', 'utf8')
        const blocksData = JSON.parse(blocks)
        const districts = await fs.readFileSync('districts.json', 'utf8')
        const districtsData = JSON.parse(districts)

        let allSchoolData = []

        // Process each district-block combination
        for (const district of districtsData) {
            const districtBlocks = blocksData.filter(block =>
                block.districtId === district.districtId && block.isActive === 1
            )

            console.log(`Processing district: ${district.districtName} (${districtBlocks.length} blocks)`)

            for (const block of districtBlocks) {
                console.log(`Processing block: ${block.blockName}`)
                let retries = 0;
                while (retries < 10) {
                    try {
                        const schoolData = await getSchoolBaseData(district.districtId, block.blockId)
                        allSchoolData = [...allSchoolData, ...schoolData]
                        console.log(`Processed ${schoolData.length} schools from ${block.blockName}`)
                        break; // Success, exit retry loop
                    } catch (error) {
                        retries++;
                        if (retries === 10) {
                            console.error(`Failed after 10 retries for block ${block.blockName}:`, error)
                            process.exit(1) // Exit if we can't get data after 10 retries
                        }
                        console.log(`Retry ${retries}/10 for block ${block.blockName}`)
                        await new Promise(resolve => setTimeout(resolve, 1000 * retries)) // Exponential backoff
                    }
                }
            }
        }

        // Save all data to a single CSV file at the end
        try {
            const csv = new ObjectsToCsv(allSchoolData)
            await csv.toDisk('./all_schools_data-2.csv')
            console.log(`Successfully saved ${allSchoolData.length} schools to all_schools_data.csv`)
        } catch (error) {
            console.error('Error saving CSV:', error)
            process.exit(1) // Exit if we can't save the data
        }
    } catch (error) {
        console.error('Fatal error:', error)
        process.exit(1)
    }
}
async function run() {
    await main()
}
run()
