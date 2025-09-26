import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitEntities implements MigrationInterface {
  name = 'InitEntities';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "user" (
        "id" SERIAL NOT NULL,
        "login" character varying(255) NOT NULL,
        "password" character varying(255) NOT NULL,
        "fio" character varying(255) NOT NULL,
        "is_active" boolean NOT NULL DEFAULT true,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_user_id" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_user_login" UNIQUE ("login")
      )
    `);
    await queryRunner.query(`
      CREATE TABLE "login_log" (
        "id" SERIAL NOT NULL,
        "ip" character varying(45),
        "user_agent" character varying(512),
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "success" boolean NOT NULL DEFAULT true,
        "user_id" integer,
        CONSTRAINT "PK_login_log_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_login_log_user" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(`
      CREATE TABLE "posts" (
        "id" SERIAL NOT NULL,
        "title" character varying(255) NOT NULL,
        "content" text NOT NULL,
        "image_url" character varying,
        "hidden" boolean NOT NULL DEFAULT false,
        "post_date" TIMESTAMP NOT NULL DEFAULT now(),
        "user_id" integer NOT NULL,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_posts_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_posts_user" FOREIGN KEY ("user_id") REFERENCES "user"("id")
      )
    `);
    await queryRunner.query(`
      CREATE INDEX "idx_user_id" ON "user" ("id");
    `);
    await queryRunner.query(`
      CREATE INDEX "idx_posts_id" ON "posts" ("id");
    `);
    await queryRunner.query(`
      CREATE INDEX "idx_posts_created_at" ON "posts" ("created_at");
    `);
    await queryRunner.query(`
      CREATE INDEX "idx_posts_user_id" ON "posts" ("user_id");
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "posts"`);
    await queryRunner.query(`DROP TABLE "login_log"`);
    await queryRunner.query(`DROP TABLE "user"`);
  }
}
