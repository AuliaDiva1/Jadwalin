export async function up(knex) {
  await knex.schema.alterTable('users', (table) => {
    table.boolean('has_used_trial').notNullable().defaultTo(false);
  });
}

export async function down(knex) {
  await knex.schema.alterTable('users', (table) => {
    table.dropColumn('has_used_trial');
  });
}