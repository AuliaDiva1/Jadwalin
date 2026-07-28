export async function up(knex) {
  await knex.schema.alterTable('orders', (table) => {
    table.integer('plan_id').unsigned().nullable().references('id').inTable('subscription_plans');
  });

  await knex.schema.alterTable('users', (table) => {
    table.string('subscription_status', 20).notNullable().defaultTo('inactive');
    table.integer('subscription_plan_id').unsigned().nullable().references('id').inTable('subscription_plans');
    table.datetime('subscription_expires_at').nullable();
  });
}

export async function down(knex) {
  await knex.schema.alterTable('users', (table) => {
    table.dropColumn('subscription_status');
    table.dropColumn('subscription_plan_id');
    table.dropColumn('subscription_expires_at');
  });
  await knex.schema.alterTable('orders', (table) => {
    table.dropColumn('plan_id');
  });
}