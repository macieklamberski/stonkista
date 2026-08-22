ALTER TABLE "prices" ADD COLUMN "source" "source_types";--> statement-breakpoint
UPDATE "prices" SET "source" = "tickers"."source" FROM "tickers" WHERE "tickers"."id" = "prices"."ticker_id";--> statement-breakpoint
ALTER TABLE "prices" ALTER COLUMN "source" SET NOT NULL;
