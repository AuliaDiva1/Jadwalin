export async function up(knex) {
  // Kolom price_yearly & trial_days sudah ada (ditambahkan di percobaan migration sebelumnya)
  // jadi di sini cuma update data-nya saja

  // Basic -> Starter
  await knex('subscription_plans').where({ name: 'Basic' }).update({
    name: 'Starter',
    price: 1500000,
    price_yearly: 18000000,
    duration_days: 30,
    trial_days: 30,
    description: 'Cocok untuk pabrik kecil dengan ≤5 mesin',
    is_active: true,
  });

  // Premium -> Growth
  await knex('subscription_plans').where({ name: 'Premium' }).update({
    name: 'Growth',
    price: 2000000,
    price_yearly: 24000000,
    duration_days: 30,
    trial_days: 0,
    description: 'Cocok untuk pabrik menengah dengan 6–15 mesin',
    is_active: true,
  });

  // Pro tetap namanya Pro, cuma update harga & deskripsi
  await knex('subscription_plans').where({ name: 'Pro' }).update({
    price: 3500000,
    price_yearly: null,
    duration_days: 30,
    trial_days: 0,
    description: 'Cocok untuk pabrik besar dengan lebih dari 15 mesin',
    is_active: true,
  });
}

export async function down(knex) {
  await knex('subscription_plans').where({ name: 'Starter' }).update({
    name: 'Basic',
    price: 50000,
    price_yearly: null,
    duration_days: 30,
    trial_days: 0,
    description: 'Fitur dasar Jadwalin',
  });

  await knex('subscription_plans').where({ name: 'Growth' }).update({
    name: 'Premium',
    price: 300000,
    price_yearly: null,
    duration_days: 30,
    trial_days: 0,
    description: 'Semua fitur + prioritas support',
  });

  await knex('subscription_plans').where({ name: 'Pro' }).update({
    price: 150000,
    price_yearly: null,
    duration_days: 30,
    trial_days: 0,
    description: 'Fitur lengkap + laporan',
  });

  await knex.schema.alterTable('subscription_plans', (table) => {
    table.dropColumn('price_yearly');
    table.dropColumn('trial_days');
  });
}