// src/services/iranjibScraper.js

/**
 * Helper function to parse a specific row from the IranJib HTML.
 * @param {string} html The full HTML content of the page.
 * @param {string} rowIdentifier The unique text that identifies the target row (e.g., 'هر گرم طلای ۱۸ عیار').
 * @param {number} valueIndex The column index for the main value (0-based).
 * @param {number} changeIndex The column index for the change value (0-based).
 * @returns {{value: string, change: string} | null} The parsed data or null if not found.
 */
function parseRow(html, rowIdentifier, valueIndex, changeIndex) {
  const rowStartIndex = html.indexOf(rowIdentifier);
  if (rowStartIndex === -1) {
    return null;
  }

  const tableRowHtml = html.substring(rowStartIndex);
  const cells = tableRowHtml.match(/<td[^>]*>([\s\S]*?)<\/td>/g);

  if (!cells || cells.length < Math.max(valueIndex, changeIndex)) {
    return null;
  }

  const clean = (str) => str.replace(/<[^>]+>/g, '').trim();
  const value = clean(cells[valueIndex]);
  const change = clean(cells[changeIndex]);

  return { value, change };
}


/**
 * Fetches data for Gold and Tether from IranJib.
 * @returns {Promise<{gold: object, tether: object}>} A promise that resolves to the combined market data.
 */
export async function fetchMarketData() {
  const url = 'https://www.iranjib.ir/';
  const response = await fetch(url);
  
  if (!response.ok) {
    throw new Error(`Failed to fetch data from IranJib. Status: ${response.status}`);
  }
  
  const html = await response.text();

  const goldData = parseRow(html, 'هر گرم طلای ۱۸ عیار', 0, 1);
  
  // +++ THIS IS THE ONLY LINE THAT CHANGES IN THIS FILE +++
  const tetherData = parseRow(html, 'تتر', 1, 2);

  if (!goldData || !tetherData) {
    throw new Error('Could not parse all required data from the website. The layout may have changed.');
  }

  return {
    gold: {
      price: goldData.value,
      change: goldData.change,
    },
    tether: {
      price: tetherData.value,
      change: tetherData.change,
    },
  };
}