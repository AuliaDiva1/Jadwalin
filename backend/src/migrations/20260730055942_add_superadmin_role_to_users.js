export const up = async (knex) => {
  await knex.raw(`
    ALTER TABLE users
    MODIFY COLUMN role ENUM('SUPERADMIN', 'ADMIN', 'MANAJER_PRODUKSI', 'STAFF_GUDANG', 'PELANGGAN')
    NOT NULL DEFAULT 'PELANGGAN'
  `);
};

export const down = async (knex) => {
  await knex.raw(`
    ALTER TABLE users
    MODIFY COLUMN role ENUM('ADMIN', 'MANAJER_PRODUKSI', 'STAFF_GUDANG', 'PELANGGAN')
    NOT NULL DEFAULT 'PELANGGAN'
  `);
};