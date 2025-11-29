# Stonkista

Simple API to get current and historical price data for stocks, cryptocurrencies, and currencies from Yahoo Finance, CoinGecko, and Frankfurter.

## Usage

Get current price of Apple stock:

```
https://stonkista.com/AAPL
```

Get current price of Bitcoin:

```
https://stonkista.com/BTC
```

Get current price of Apple stock converted to EUR:

```
https://stonkista.com/AAPL/EUR
```

Get price of Bitcoin on a specific date:

```
https://stonkista.com/BTC/2024-01-15
```

Get price of Apple stock on a specific date converted to EUR:

```
https://stonkista.com/AAPL/EUR/2024-01-15
```

## Google Sheets

Use `IMPORTDATA` function to fetch prices into your spreadsheet:

```
=IMPORTDATA("https://stonkista.com/AAPL")
```

Convert to different currency:

```
=IMPORTDATA("https://stonkista.com/AAPL/EUR")
```

Get historical price using a date from another cell:

```
=IMPORTDATA("https://stonkista.com/BTC/PLN/" & TEXT(A1, "YYYY-MM-DD"))
```

## Microsoft Excel

Use `WEBSERVICE` function to fetch prices into your spreadsheet:

```
=NUMBERVALUE(WEBSERVICE("https://stonkista.com/AAPL"))
```

Convert to different currency:

```
=NUMBERVALUE(WEBSERVICE("https://stonkista.com/AAPL/EUR"))
```

Get historical price using a date from another cell:

```
=NUMBERVALUE(WEBSERVICE("https://stonkista.com/BTC/PLN/" & TEXT(A1, "YYYY-MM-DD")))
```

## Data Sources

- **Yahoo Finance** — Stocks and ETFs
- **CoinGecko** — Cryptocurrencies
- **Frankfurter** — Currency exchange rates

## Disclaimer

Price data is aggregated from third-party sources and may not be accurate or real-time. Intended for personal portfolio tracking and statistical purposes only. Not suitable for trading decisions.
