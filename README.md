# UDISE School Data Scraper

A Node.js script to scrape school data from the UDISE+ (Unified District Information System for Education Plus) portal. This tool is designed to help researchers, educators, and policymakers access and analyze school data efficiently.

## Features

- Scrapes comprehensive school data including:
  - Basic school information (name, location, UDISE code)
  - Enrollment data (boys, girls, total students)
  - School details (email, address, management type, category)
  - Report card data
- Handles API pagination and rate limiting to ensure complete data retrieval
- Implements robust retry logic with exponential backoff to manage API request failures
- Saves data to CSV format for easy analysis and sharing
- Processes schools in batches for better performance and reduced memory usage
- Provides detailed logging for monitoring the scraping process and troubleshooting

## Prerequisites

- Node.js installed (version 14 or higher recommended)
- Required npm packages:
  - `objects-to-csv` (for CSV file generation)


## Setup

1. Clone the repository
   ```bash
   git clone https://github.com/sahilahluwalia/udise-scaper.git
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Ensure you have the necessary API `TOKEN` ,`STATE_ID` and `YEAR_ID` in config.js file

4. Run the script to get Districts and Blocks data:
   ```bash
   npm run json-creator
   ```
5. Run the script to get school data:
   ```bash
   npm run main-fetcher
   ```
