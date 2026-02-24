# Stonkista

Minimalist API to get current and historical price data for stocks, cryptocurrencies, and currencies from Yahoo Finance, CryptoCompare, and Frankfurter.

**[stonkista.com ↗](https://stonkista.com)**
&nbsp;&nbsp;·&nbsp;&nbsp;
[Usage](#usage)
&nbsp;&nbsp;·&nbsp;&nbsp;
[Data Sources](#data-sources)

---

## Usage

### Stocks, ETFs, Commodities

```bash
# Current price of Apple stock
https://stonkista.com/AAPL

# Converted to EUR
https://stonkista.com/AAPL/EUR

# Price on a specific date
https://stonkista.com/AAPL/2024-01-15

# Price on a specific date converted to EUR
https://stonkista.com/AAPL/EUR/2024-01-15

# Price range (one price per day, newline-separated)
https://stonkista.com/AAPL/2024-01-01..2024-01-31

# Price range converted to EUR
https://stonkista.com/AAPL/EUR/2024-01-01..2024-01-31
```

> [!NOTE]
> Use [Yahoo Finance](https://finance.yahoo.com) ticker symbols (e.g., `AAPL`, `MSFT`, `GC=F` for gold futures).
> Date ranges return one value per calendar day. On days without trading (weekends, holidays), the last known price is carried forward.

### Cryptocurrencies

```bash
# Current price of Bitcoin
https://stonkista.com/crypto/BTC

# Converted to PLN
https://stonkista.com/crypto/BTC/PLN

# Price on a specific date
https://stonkista.com/crypto/BTC/2024-01-15

# Price on a specific date converted to PLN
https://stonkista.com/crypto/BTC/PLN/2024-01-15

# Price range (one price per day, newline-separated)
https://stonkista.com/crypto/BTC/2024-01-01..2024-01-31

# Price range converted to PLN
https://stonkista.com/crypto/BTC/PLN/2024-01-01..2024-01-31
```

### Forex (Currency Exchange Rates)

```bash
# Current USD to PLN rate
https://stonkista.com/forex/USD/PLN

# Rate on a specific date
https://stonkista.com/forex/USD/PLN/2024-01-15

# Rate range (one rate per day, newline-separated)
https://stonkista.com/forex/USD/PLN/2024-01-01..2024-01-31
```

> [!NOTE]
> Exchange rates are sourced from ECB which only provides EUR-based rates. Conversions between non-EUR currencies (e.g., USD to PLN) are calculated using EUR as an intermediate.

### Google Sheets

Use `IMPORTDATA` function to fetch prices into your spreadsheet:

```bash
# Current stock price
=IMPORTDATA("https://stonkista.com/AAPL")

# Stock converted to EUR
=IMPORTDATA("https://stonkista.com/AAPL/EUR")

# Current crypto price
=IMPORTDATA("https://stonkista.com/crypto/BTC/PLN")

# Forex rate
=IMPORTDATA("https://stonkista.com/forex/USD/PLN")

# Historical with date from cell
=IMPORTDATA("https://stonkista.com/crypto/BTC/PLN/" & TEXT(A1, "YYYY-MM-DD"))

# Date range (populates one price per row)
=IMPORTDATA("https://stonkista.com/AAPL/2024-01-01..2024-01-31")
```

### Microsoft Excel

Use `WEBSERVICE` function wrapped in `NUMBERVALUE` to fetch prices into your spreadsheet:

```bash
# Current stock price
=NUMBERVALUE(WEBSERVICE("https://stonkista.com/AAPL"))

# Stock converted to EUR
=NUMBERVALUE(WEBSERVICE("https://stonkista.com/AAPL/EUR"))

# Current crypto price
=NUMBERVALUE(WEBSERVICE("https://stonkista.com/crypto/BTC/PLN"))

# Forex rate
=NUMBERVALUE(WEBSERVICE("https://stonkista.com/forex/USD/PLN"))

# Historical with date from cell
=NUMBERVALUE(WEBSERVICE("https://stonkista.com/crypto/BTC/PLN/" & TEXT(A1, "YYYY-MM-DD")))

# Date range (returns newline-separated values)
=WEBSERVICE("https://stonkista.com/AAPL/2024-01-01..2024-01-31")
```

## Data Sources

- **[Yahoo Finance](https://finance.yahoo.com)** — Stocks, ETFs, and commodities. Uses unofficial API endpoints. See [AlgoTrading101 guide](https://algotrading101.com/learn/yahoo-finance-api-guide/) for more details.
- **[CryptoCompare](https://www.cryptocompare.com)** — Cryptocurrency prices and full daily history for top 1000 coins by market cap.
- **[Frankfurter](https://frankfurter.dev)** — Currency exchange rates sourced from European Central Bank (ECB), with historical data going back to January 1999.

With thousands of stocks, ETFs, commodities, and cryptocurrencies available, not all tickers are pre-loaded. New stock, ETF, commodity, and cryptocurrency tickers are added on demand on first request.

## Disclaimer

Price data is aggregated from third-party sources and may not be accurate or real-time. Intended for personal portfolio tracking and statistical purposes only. Not suitable for trading decisions.
