export const up = async (knex) => {
  await knex.schema.createTable('company_profiles', (table) => {
    table.increments('id').primary();
    table
      .integer('user_id')
      .unsigned()
      .notNullable()
      .references('id')
      .inTable('users')
      .onDelete('CASCADE');

    table.string('company_name', 150).notNullable();
    table.string('industry', 100).nullable();
    table.string('company_size', 50).nullable();
    table.string('city', 100).nullable();
    table.string('phone_number', 30).nullable();
    table.text('address').nullable();
    table.string('website', 150).nullable();

    table.boolean('is_completed').notNullable().defaultTo(false);

    table.timestamps(true, true);
    table.unique(['user_id']);
  });
};

export const down = async (knex) => {
  await knex.schema.dropTableIfExists('company_profiles');
};