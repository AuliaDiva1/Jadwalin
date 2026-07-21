export const up = (knex) => {
  return knex.schema.alterTable('jobs', (table) => {
    table.string('google_event_id', 255).nullable();
  });
};

export const down = (knex) => {
  return knex.schema.alterTable('jobs', (table) => {
    table.dropColumn('google_event_id');
  });
};