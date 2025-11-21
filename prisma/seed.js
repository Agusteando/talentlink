// --- prisma/seed.js ---
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * Naming Convention:
 * "<Institution> Campus <City> – <Nivel>"
 *
 * Casita del Saber = Preescolar + General Campus labels
 * IEDIS = Primaria, Secundaria, Desarrollo Infantil
 */

const planteles = [
  //
  // TOLUCA — Casita (pre) + IEDIS (pri/sec)
  //
  {
    code: 'PREET',
    name: 'Casita del Saber Campus Toluca – Preescolar',
    address:
      'Calle España 8, Col. Las Verdolagas, San Mateo Oxtotitlán, 50100 Toluca, Estado de México',
    lat: 19.293653,
    lng: -99.69226,
  },
  {
    code: 'PT',
    name: 'IEDIS Campus Toluca – Primaria',
    address:
      'Calle España 8, Col. Las Verdolagas, San Mateo Oxtotitlán, 50100 Toluca, Estado de México',
    lat: 19.293653,
    lng: -99.69226,
  },
  {
    code: 'ST',
    name: 'IEDIS Campus Toluca – Secundaria',
    address:
      'Calle España 8, Col. Las Verdolagas, San Mateo Oxtotitlán, 50100 Toluca, Estado de México',
    lat: 19.293653,
    lng: -99.69226,
  },
  {
    code: 'CT',
    name: 'Casita del Saber Campus Toluca',
    address:
      'Calle España 8, Col. Las Verdolagas, San Mateo Oxtotitlán, 50100 Toluca, Estado de México',
    lat: 19.293653,
    lng: -99.69226,
  },

  //
  // METEPEC — Casita (pre) + IEDIS (pri/sec/desarrollo)
  //
  {
    code: 'PREEM',
    name: 'Casita del Saber Campus Metepec – Preescolar',
    address:
      'Av. 5 532, Col. San José La Pilita, 52149 Metepec, Estado de México',
    lat: 19.25877,
    lng: -99.58566,
  },
  {
    code: 'PM',
    name: 'IEDIS Campus Metepec – Primaria',
    address:
      'Av. 5 532, Col. San José La Pilita, 52149 Metepec, Estado de México',
    lat: 19.25877,
    lng: -99.58566,
  },
  {
    code: 'SM',
    name: 'IEDIS Campus Metepec – Secundaria',
    address:
      'Av. 5 532, Col. San José La Pilita, 52149 Metepec, Estado de México',
    lat: 19.25877,
    lng: -99.58566,
  },
  {
    code: 'CM',
    name: 'Casita del Saber Campus Metepec',
    address:
      'Av. 5 532, Col. San José La Pilita, 52149 Metepec, Estado de México',
    lat: 19.25877,
    lng: -99.58566,
  },
  {
    code: 'DM',
    name: 'IEDIS Campus Metepec – Desarrollo Infantil',
    address:
      'Av. 5 532-3, Col. San José La Pilita, 52149 Metepec, Estado de México',
    lat: 19.25877,
    lng: -99.58566,
  },

  //
  // OCOYOACAC — Casita
  //
  {
    code: 'CO',
    name: 'Casita del Saber Campus Ocoyoacac',
    address:
      'Av. Martín Chimaltecalt 122, Barrio de Santa María, 52740 Ocoyoacac, Estado de México',
    lat: 19.2705874,
    lng: -99.4751669,
  },

  //
  // CALIMAYA — IEDIS Desarrollo
  //
  {
    code: 'DC',
    name: 'IEDIS Campus Calimaya – Desarrollo Infantil',
    address:
      'Calle La Gardenia 45, San Andrés Ocotlán, 52220 Calimaya, Estado de México',
    lat: 19.1925777,
    lng: -99.5857616,
  },
];

async function main() {
  console.log('-----------------------------------------------------------');
  console.log('🌱 STARTING SEED PROCESS');
  console.log('DATABASE_URL:', process.env.DATABASE_URL);
  console.log('-----------------------------------------------------------');

  // Check DB connectivity
  try {
    await prisma.$queryRaw`SELECT 1`;
    console.log('✅ Database connection OK\n');
  } catch (e) {
    console.error('❌ Database connection failed:', e);
    process.exit(1);
  }

  const before = await prisma.plantel.count();
  console.log('Planteles BEFORE seeding:', before);
  console.log('-----------------------------------------------------------\n');

  // Insert/update all planteles
  for (const p of planteles) {
    console.log(`➡️  Upserting: [${p.code}] ${p.name}`);

    await prisma.plantel.upsert({
      where: { code: p.code },
      update: {
        name: p.name,
        address: p.address,
        lat: p.lat,
        lng: p.lng,
        isActive: true,
      },
      create: {
        name: p.name,
        code: p.code,
        address: p.address,
        lat: p.lat,
        lng: p.lng,
        isActive: true,
      },
    });
  }

  console.log('\n-----------------------------------------------------------');
  const after = await prisma.plantel.count();
  console.log('Planteles AFTER seeding:', after);
  console.log('🌱 Seed completed successfully!');
  console.log('-----------------------------------------------------------');
}

main()
  .catch((e) => {
    console.error('\n❌ SEED FAILED WITH ERROR:\n');
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
