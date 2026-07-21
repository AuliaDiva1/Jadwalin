export const up = (knex) =>
  knex.schema.createTable('user_google_tokens', (table) => {
    table.increments('id').primary();
    table.integer('user_id').unsigned().notNullable();
    table.text('refresh_token').notNullable();
    table.text('access_token');
    table.datetime('token_expiry');
    table.timestamp('connected_at').defaultTo(knex.fn.now());
    table.foreign('user_id').references('id').inTable('users').onDelete('CASCADE');
    table.unique('user_id');
  });

export const down = (knex) => knex.schema.dropTable('user_google_tokens');