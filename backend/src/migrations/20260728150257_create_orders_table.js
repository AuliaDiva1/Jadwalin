/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function up(knex) {
  return knex.schema.createTable('orders', (table) => {
    table.increments('id').primary();
    table.string('order_id').notNullable().unique();
    table.integer('user_id').unsigned().nullable();
    table.decimal('gross_amount', 12, 2).notNullable();
    table.string('status', 30).notNullable().defaultTo('pending');
    table.string('bank', 20).nullable();
    table.string('va_number', 50).nullable();
    table.timestamps(true, true);

    table.index('order_id');
    table.index('user_id');
  });
}

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function down(knex) {
  return knex.schema.dropTableIfExists('orders');
}