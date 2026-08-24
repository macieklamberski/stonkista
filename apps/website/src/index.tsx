import { render } from 'preact'

const App = () => {
  return (
    <main>
      <h1>Stonkista</h1>
      <p>
        Minimalist API to get current and historical price data for stocks, cryptocurrencies, and
        currencies from Yahoo Finance, CryptoCompare, and Frankfurter.
      </p>
      <a href="https://github.com/macieklamberski/stonkista/blob/main/README.md">Read the docs →</a>
    </main>
  )
}

const root = document.getElementById('app')

if (!root) {
  throw new Error('Missing #app mount point')
}

render(<App />, root)
