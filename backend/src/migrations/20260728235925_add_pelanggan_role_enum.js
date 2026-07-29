export async function up(knex) {
  await knex.raw(`
    ALTER TABLE users
    MODIFY COLUMN role ENUM('ADMIN','MANAJER_PRODUKSI','STAFF_GUDANG','PELANGGAN') NOT NULL
  `);
}

export async function down(knex) {
  await knex.raw(`
    ALTER TABLE users
    MODIFY COLUMN role ENUM('ADMIN','MANAJER_PRODUKSI','STAFF_GUDANG') NOT NULL
  `);
}