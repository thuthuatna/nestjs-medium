ALTER TABLE "comments" ALTER COLUMN "author_id" SET DATA TYPE integer;--> statement-breakpoint
ALTER TABLE "comments" ALTER COLUMN "article_id" SET DATA TYPE integer;--> statement-breakpoint
CREATE INDEX "idx_articles_slug" ON "articles" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "idx_articles_author_id" ON "articles" USING btree ("author_id");--> statement-breakpoint
CREATE INDEX "idx_comments_author_id" ON "comments" USING btree ("author_id");--> statement-breakpoint
CREATE INDEX "idx_comments_article_id" ON "comments" USING btree ("article_id");--> statement-breakpoint
CREATE INDEX "idx_follows_follower_id" ON "follows" USING btree ("follower_id");--> statement-breakpoint
CREATE INDEX "idx_follows_following_id" ON "follows" USING btree ("following_id");--> statement-breakpoint
CREATE INDEX "idx_user_favorite_articles_user_id" ON "user_favorite_articles" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_user_favorite_articles_article_id" ON "user_favorite_articles" USING btree ("article_id");