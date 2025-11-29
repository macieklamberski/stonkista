CREATE TYPE "public"."source_types" AS ENUM('yahoo', 'coingecko');--> statement-breakpoint
CREATE TYPE "public"."ticker_types" AS ENUM('stock', 'etf', 'crypto', 'commodity');--> statement-breakpoint
CREATE TABLE "prices" (
	"id" serial PRIMARY KEY NOT NULL,
	"ticker_id" serial NOT NULL,
	"date" date NOT NULL,
	"price" numeric(20, 8),
	"available" boolean DEFAULT true NOT NULL,
	"fetched_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "rates" (
	"id" serial PRIMARY KEY NOT NULL,
	"date" date NOT NULL,
	"from_currency" varchar(10) NOT NULL,
	"to_currency" varchar(10) NOT NULL,
	"rate" numeric(20, 10) NOT NULL,
	"fetched_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tickers" (
	"id" serial PRIMARY KEY NOT NULL,
	"symbol" varchar(20) NOT NULL,
	"name" varchar(255),
	"type" "ticker_types" NOT NULL,
	"currency" varchar(10) NOT NULL,
	"source" "source_types" NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "prices" ADD CONSTRAINT "prices_ticker_id_tickers_id_fk" FOREIGN KEY ("ticker_id") REFERENCES "public"."tickers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "prices_ticker_date" ON "prices" USING btree ("ticker_id","date");--> statement-breakpoint
CREATE INDEX "prices_date" ON "prices" USING btree ("date");--> statement-breakpoint
CREATE UNIQUE INDEX "rates_unique" ON "rates" USING btree ("date","from_currency","to_currency");--> statement-breakpoint
CREATE INDEX "rates_date" ON "rates" USING btree ("date");--> statement-breakpoint
CREATE UNIQUE INDEX "tickers_symbol" ON "tickers" USING btree ("symbol");