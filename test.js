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
    console.log(udiseCode)
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
    // console.log(content)
    const payload = await Promise.all(content.map(async (school) => {
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
    }))
    // console.log(payload)
    // const payload = content[0]
    // const content = schoolData
    // // payload = schoolData
    // // console.log(payload)
    // const payload = {
    //     schoolName: content.schoolName,
    //     pinCode: content.pincode,
    //     districtName: content.districtName,
    //     blockName: content.blockName,
    //     udiseschCode: content.udiseschCode,
    // }
    // const enrolmentData = await getEnrolmentData(payload.udiseschCode)
    // const schoolDetailsData = await getSchoolDetailsData(Number(payload.udiseschCode))
    // const lastPayload = { ...payload, ...enrolmentData, ...schoolDetailsData }
    // console.log(data)

    // const payload = content.map(async (school) => {
    //     const enrolmentData = await getEnrolmentData(school.udiseCode)
    //     const schoolDetailsData = await getSchoolDetailsData(school.udiseCode)
    //     return { ...school, ...enrolmentData, ...schoolDetailsData }
    // })
    // content is an array of school objects
    // const payload = {
    //     schoolName: content.schoolName,
    //     pinCode: content.pinCode,
    //     districtName: content.districtName,
    //     blockName: content.blockName,
    //     udiseCode: content.udiseCode,
    // }
    // const enrolmentData = await getEnrolmentData(content.udiseCode)
    // const schoolDetailsData = await getSchoolDetailsData(content.udiseCode)
    // payload = { ...payload, ...enrolmentData, ...schoolDetailsData }
    // console.log(payload)
    // return lastPayload
    return payload
}

const ObjectsToCsv = require('objects-to-csv')

async function main() {
    // to get districts and blocks data
    // await getBaseJsonFiles()
    const schoolData = await getSchoolBaseData(4331, 43396)
    // const object
    // write to csv file
    const csv = new ObjectsToCsv(schoolData)
    await csv.toDisk('./schoolData.csv')

    // console.log(schoolData)
}
async function run() {
    await main()
}
run()
