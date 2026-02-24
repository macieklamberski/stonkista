ALTER TABLE "tickers" ALTER COLUMN "source" SET DATA TYPE text;--> statement-breakpoint
DROP TYPE "source_types";--> statement-breakpoint
CREATE TYPE "source_types" AS ENUM('yahoo', 'cryptocompare');--> statement-breakpoint
ALTER TABLE "tickers" ALTER COLUMN "source" SET DATA TYPE "source_types" USING "source"::"source_types";