# Stonkista

Simple API to get current and historical price data for stocks, cryptocurrencies, and currencies from Yahoo Finance, CoinGecko, and Frankfurter.

**[stonkista.com ↗](https://stonkista.com)**
&nbsp;&nbsp;·&nbsp;&nbsp;
[Usage](#usage)
&nbsp;&nbsp;·&nbsp;&nbsp;
[Data Sources](#data-sources)

---

## Usage

Use the direct URLs to get the prices:

```bash
# Current price of Bitcoin
https://stonkista.com/BTC

# Current price of Bitcoin converted to EUR
https://stonkista.com/BTC/EUR

# Price of Bitcoin on a specific date
https://stonkista.com/BTC/2024-01-15

# Price of Bitcoin on a specific date converted to EUR
https://stonkista.com/BTC/EUR/2024-01-15
```

### Google Sheets

Use `IMPORTDATA` function to fetch prices into your spreadsheet:

```bash
# Current price
=IMPORTDATA("https://stonkista.com/AAPL")

# Converted to EUR
=IMPORTDATA("https://stonkista.com/AAPL/EUR")

# Historical with date from cell
=IMPORTDATA("https://stonkista.com/BTC/PLN/" & TEXT(A1, "YYYY-MM-DD"))
```

### Microsoft Excel

Use `WEBSERVICE` function wrapped in `NUMBERVALUE` to fetch prices into your spreadsheet:

```bash
# Current price
=NUMBERVALUE(WEBSERVICE("https://stonkista.com/AAPL"))

# Converted to EUR
=NUMBERVALUE(WEBSERVICE("https://stonkista.com/AAPL/EUR"))

# Historical with date from cell
=NUMBERVALUE(WEBSERVICE("https://stonkista.com/BTC/PLN/" & TEXT(A1, "YYYY-MM-DD")))
```

## Data Sources

- **[Yahoo Finance](https://finance.yahoo.com)** — Stocks, ETFs, and commodities. Uses unofficial API endpoints. See [AlgoTrading101 guide](https://algotrading101.com/learn/yahoo-finance-api-guide/) for more details.
- **[CoinGecko](https://www.coingecko.com)** — Cryptocurrency prices and market data for 5000+ coins, tracked by market cap rank.
- **[Frankfurter](https://frankfurter.dev)** — Currency exchange rates sourced from European Central Bank (ECB), with historical data going back to January 1999.

## Disclaimer

Price data is aggregated from third-party sources and may not be accurate or real-time. Intended for personal portfolio tracking and statistical purposes only. Not suitable for trading decisions.
