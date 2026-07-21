export async function up(knex) {
  return knex.schema.alterTable('users', (table) => {
    table.string('google_id', 255).unique().nullable();
    table.string('password', 255).nullable().alter();
  });
}

export async function down(knex) {
  return knex.schema.alterTable('users', (table) => {
    table.dropColumn('google_id');
    table.string('password', 255).notNullable().alter();
  });
}