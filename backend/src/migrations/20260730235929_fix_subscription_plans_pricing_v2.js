export async function up(knex) {
  await knex('subscription_plans').where({ name: 'Starter' }).update({
    price: 1500000,
    price_yearly: 18000000,
    trial_days: 30,
    description: 'Cocok untuk pabrik kecil dengan ≤5 mesin. Modul Penjadwalan Inti, 1 akun Admin, Laporan PDF Standar, Training Online, Dukungan Email (SLA 2x24 jam)',
  });

  await knex('subscription_plans').where({ name: 'Growth' }).update({
    price: 2000000,
    price_yearly: 24000000,
    trial_days: 0,
    description: 'Cocok untuk pabrik menengah dengan 6–15 mesin. 1 akun Admin, 1 akun Manajer Produksi, 1 akun Staff Gudang, Integrasi Google Calendar, Dukungan Prioritas WA/Telepon (SLA 1x24 jam)',
  });

  await knex('subscription_plans').where({ name: 'Pro' }).update({
    price: 3500000,
    price_yearly: null,
    trial_days: 0,
    description: 'Cocok untuk pabrik besar dengan lebih dari 15 mesin',
  });
}

export async function down(knex) {
  await knex('subscription_plans').where({ name: 'Starter' }).update({
    price: 249000,
    price_yearly: null,
    trial_days: 0,
    description: 'Ideal untuk IKM yang baru memulai digitalisasi. Modul Penjadwalan Inti, 1 akun Admin, Laporan PDF Standar, Training Online, Dukungan Email (SLA 2x24 jam)',
  });

  await knex('subscription_plans').where({ name: 'Growth' }).update({
    price: 399000,
    price_yearly: null,
    trial_days: 0,
    description: 'Untuk pabrik yang sedang berkembang pesat. 1 akun Admin, 1 akun Manajer Produksi, 1 akun Staff Gudang, Integrasi Google Calendar, Dukungan Prioritas WA/Telepon (SLA 1x24 jam)',
  });

  await knex('subscription_plans').where({ name: 'Pro' }).update({
    price: 3500000,
    price_yearly: null,
    trial_days: 0,
    description: 'Cocok untuk pabrik besar dengan lebih dari 15 mesin',
  });
}