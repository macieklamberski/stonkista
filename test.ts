import { coingecko } from './sources/coingecko.ts'
import { yahoo } from './sources/yahoo.ts'

const btc = await coingecko.fetchLatest('BTC')
const msft = await yahoo.fetchLatest('MSFT')

console.log({ btc, msft })
