CREATE TYPE "source_types" AS ENUM('yahoo', 'coingecko', 'cryptocompare');--> statement-breakpoint
CREATE TYPE "ticker_types" AS ENUM('stock', 'etf', 'crypto', 'commodity');--> statement-breakpoint
CREATE TABLE "currencies" (
	"id" serial PRIMARY KEY,
	"code" varchar(10) NOT NULL UNIQUE,
	"name" varchar(255) NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "prices" (
	"id" serial PRIMARY KEY,
	"ticker_id" integer NOT NULL,
	"date" date NOT NULL,
	"price" numeric(32,16),
	"available" boolean DEFAULT true NOT NULL,
	"fetched_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "rates" (
	"id" serial PRIMARY KEY,
	"date" date NOT NULL,
	"from_currency" varchar(10) NOT NULL,
	"to_currency" varchar(10) NOT NULL,
	"rate" numeric(32,16) NOT NULL,
	"fetched_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tickers" (
	"id" serial PRIMARY KEY,
	"symbol" varchar(255) NOT NULL,
	"name" varchar(255),
	"type" "ticker_types" NOT NULL,
	"currency" varchar(10) NOT NULL,
	"source" "source_types" NOT NULL,
	"source_id" varchar(100) NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX "prices_ticker_date" ON "prices" ("ticker_id","date");--> statement-breakpoint
CREATE INDEX "prices_date" ON "prices" ("date");--> statement-breakpoint
CREATE UNIQUE INDEX "rates_unique" ON "rates" ("date","from_currency","to_currency");--> statement-breakpoint
CREATE INDEX "rates_date" ON "rates" ("date");--> statement-breakpoint
CREATE UNIQUE INDEX "tickers_source_id" ON "tickers" ("source","source_id");--> statement-breakpoint
CREATE INDEX "tickers_symbol" ON "tickers" ("symbol");--> statement-breakpoint
ALTER TABLE "prices" ADD CONSTRAINT "prices_ticker_id_tickers_id_fkey" FOREIGN KEY ("ticker_id") REFERENCES "tickers"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "rates" ADD CONSTRAINT "rates_from_currency_currencies_code_fkey" FOREIGN KEY ("from_currency") REFERENCES "currencies"("code");--> statement-breakpoint
ALTER TABLE "rates" ADD CONSTRAINT "rates_to_currency_currencies_code_fkey" FOREIGN KEY ("to_currency") REFERENCES "currencies"("code");