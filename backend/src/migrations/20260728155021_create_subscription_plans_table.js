export async function up(knex) {
  await knex.schema.createTable('subscription_plans', (table) => {
    table.increments('id').primary();
    table.string('name', 50).notNullable();
    table.decimal('price', 12, 2).notNullable();
    table.integer('duration_days').notNullable().defaultTo(30);
    table.text('description').nullable();
    table.boolean('is_active').notNullable().defaultTo(true);
    table.timestamps(true, true);
  });

  await knex('subscription_plans').insert([
    { name: 'Basic', price: 50000, duration_days: 30, description: 'Fitur dasar Jadwalin' },
    { name: 'Pro', price: 150000, duration_days: 30, description: 'Fitur lengkap + laporan' },
    { name: 'Premium', price: 300000, duration_days: 30, description: 'Semua fitur + prioritas support' },
  ]);
}

export async function down(knex) {
  return knex.schema.dropTableIfExists('subscription_plans');
}