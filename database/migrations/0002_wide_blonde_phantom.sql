ALTER TABLE "prices" ALTER COLUMN "price" SET DATA TYPE numeric(20, 16);--> statement-breakpoint
CREATE INDEX "tickers_symbol" ON "tickers" USING btree ("symbol");