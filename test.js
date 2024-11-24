const fs = require('fs')
const token = 'FeGQJeZUdb/3UwD9pa/HO01jgEyP7xeUZi0jvXuCc77KWl1lKg5UuMMIbcogxdhG'

// Tamil Nadu
const STATE_ID = 133

// 2023-24
const YEAR_ID = 10

const districtURL = `https://kys.udiseplus.gov.in/api/districts?stateId=${STATE_ID}&yearId=${YEAR_ID}`
const blockURL = (districtId) => `https://kys.udiseplus.gov.in/api/blocks?districtId=${districtId}&yearId=${YEAR_ID}`


const basicSchoolURL = (districtId, blockId) => `https://kys.udiseplus.gov.in/api/search-school/by-region?yearId=${YEAR_ID}&stateId=${STATE_ID}&districtId=${districtId}&blockId=${blockId}&villageId=&clusterId=`

const enrolmentURL = (udiseCode) => `https://kys.udiseplus.gov.in/api/school-statistics/enrolment-teacher?udiseCode=${udiseCode}`

const schoolDetailsURL = (udiseCode) => `https://kys.udiseplus.gov.in/api/school/by-year?udiseCode=${udiseCode}&action=1`

const getEnrolmentData = async (udiseCode) => {
    // console.log(udiseCode)
    const data = await fetchData(enrolmentURL(udiseCode))
    // console.log(data)
    const { data: enrolmentData } = data
    // console.log(enrolmentData)
    const payload = {
        totalBoy: enrolmentData?.totalBoy,
        totalGirl: enrolmentData?.totalGirl,
        totalCount: enrolmentData?.totalCount,
    }
    return payload
}

const getSchoolDetailsData = async (udiseCode) => {
    const data = await fetchData(schoolDetailsURL(udiseCode))
    const schoolDetailsData = data?.data
    const payload = {
        email: schoolDetailsData?.email,
        address: schoolDetailsData?.address,
    }
    return payload
}


const fetchData = async (url) => {
    const response = await fetch(url, {
        headers: {
            'Token': `${token}`
        }
    })
    const data = await response.json()
    return data
}


const getDistricts = async () => {
    const data = await fetchData(districtURL)
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
const getBaseJsonFiles = async () => {
    const districtsData = await getDistricts()
    fs.writeFileSync('districts.json', JSON.stringify(districtsData, null, 2))
    const blocks = await Promise.all(districtsData.map(async (district) => {
        return await getBlocks(district.districtId)
    }))
    const blocksData = blocks.flat()
    fs.writeFileSync('blocks.json', JSON.stringify(blocksData, null, 2))
    console.log(blocksData)
}
const testContene = [{
    udiseschCode: '33320801906',
    schoolName: 'PUES THAVASUKUZHI',
    stateId: 133,
    districtId: 4331,
    blockId: 43396,
    villageId: 4211161,
    clusterId: 4203943,
    pincode: 621801,
    schCategoryId: 1,
    schType: 3,
    schMgmtId: 1,
    schMgmtDesc: 'Department of Education',
    classFrm: 1,
    classTo: 5,
    schoolStatus: 0,
    schoolStatusName: '0-Operational',
    stateName: 'TAMILNADU',
    districtName: 'ARIYALUR',
    blockName: 'ANDIMADAM',
    clusterName: 'PERIYATHATHUR',
    villageName: 'VILANTHAI',
    email: null,
    address: null,
    schCatDesc: 'Primary',
    schLocRuralUrban: 1,
    schLocDesc: 'Rural',
    schTypeDesc: '3-Co-educational',
    schMgmtParentId: 1,
    schMgmNationalDesc: null,
    schCategoryType: null,
    schMgmtType: null,
    schBroadMgmtId: null,
    yearId: 10,
    sessionYear: '2023-24'
}, {
        udiseschCode: '33320804201',
        schoolName: 'PUMS Z.MELUR',
        stateId: 133,
        districtId: 4331,
        blockId: 43396,
        villageId: 4211184,
        clusterId: 4203950,
        pincode: 621803,
        schCategoryId: 2,
        schType: 3,
        schMgmtId: 1,
        schMgmtDesc: 'Department of Education',
        classFrm: 1,
        classTo: 8,
        schoolStatus: 0,
        schoolStatusName: '0-Operational',
        stateName: 'TAMILNADU',
        districtName: 'ARIYALUR',
        blockName: 'ANDIMADAM',
        clusterName: 'KOOVATHUR',
        villageName: 'Z.MELUR',
        email: null,
        address: null,
        schCatDesc: 'Primary with Upper Primary',
        schLocRuralUrban: 1,
        schLocDesc: 'Rural',
        schTypeDesc: '3-Co-educational',
        schMgmtParentId: 1,
        schMgmNationalDesc: null,
        schCategoryType: null,
        schMgmtType: null,
        schBroadMgmtId: null,
        yearId: 10,
        sessionYear: '2023-24'
    }]
const getSchoolBaseData = async (districtId, blockId) => {
    const data = await fetchData(basicSchoolURL(districtId, blockId))
    const { data: { content } } = data

    const batchSize = 50;
    let allSchoolData = [];

    for (let i = 0; i < content.length; i += batchSize) {
        const batch = content.slice(i, i + batchSize);

        const batchPayload = await Promise.all(batch.map(async (school) => {
            let retries = 0;
            while (retries < 10) {
                try {
                    const payload = {
                        schoolName: school.schoolName,
                        pinCode: school.pincode,
                        districtName: school.districtName,
                        blockName: school.blockName,
                        udiseschCode: school.udiseschCode,
                    }
                    const enrolmentData = await getEnrolmentData(school.udiseschCode)
                    const schoolDetailsData = await getSchoolDetailsData(school.udiseschCode)
                    return { ...payload, ...enrolmentData, ...schoolDetailsData }
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

const ObjectsToCsv = require('objects-to-csv')

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
            await csv.toDisk('./all_schools_data.csv')
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
