// prisma/seed.js
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const planteles = [
  {
    code: 'PREET',
    name: 'Preescolar Casita del Saber – IEDIS Campus Toluca',
    address:
      'Calle España 8, Col. Las Verdolagas, San Mateo Oxtotitlán, 50100 Toluca, Estado de México',
    lat: 19.293653,
    lng: -99.69226,
  },
  {
    code: 'PT',
    name: 'Primaria Casita del Saber – IEDIS Campus Toluca',
    address:
      'Calle España 8, Col. Las Verdolagas, San Mateo Oxtotitlán, 50100 Toluca, Estado de México',
    lat: 19.293653,
    lng: -99.69226,
  },
  {
    code: 'ST',
    name: 'Secundaria Casita del Saber – IEDIS Campus Toluca',
    address:
      'Calle España 8, Col. Las Verdolagas, San Mateo Oxtotitlán, 50100 Toluca, Estado de México',
    lat: 19.293653,
    lng: -99.69226,
  },
  {
    code: 'CT',
    name: 'Casita del Saber – IEDIS Campus Toluca',
    address:
      'Calle España 8, Col. Las Verdolagas, San Mateo Oxtotitlán, 50100 Toluca, Estado de México',
    lat: 19.293653,
    lng: -99.69226,
  },
  {
    code: 'PREEM',
    name: 'Preescolar Casita del Saber – IEDIS Campus Metepec',
    address:
      'Av. 5 532, Col. San José La Pilita, 52149 Metepec, Estado de México',
    lat: 19.25877,
    lng: -99.58566,
  },
  {
    code: 'PM',
    name: 'Primaria Casita del Saber – IEDIS Campus Metepec',
    address:
      'Av. 5 532, Col. San José La Pilita, 52149 Metepec, Estado de México',
    lat: 19.25877,
    lng: -99.58566,
  },
  {
    code: 'SM',
    name: 'Secundaria Casita del Saber – IEDIS Campus Metepec',
    address:
      'Av. 5 532, Col. San José La Pilita, 52149 Metepec, Estado de México',
    lat: 19.25877,
    lng: -99.58566,
  },
  {
    code: 'CM',
    name: 'Casita del Saber – IEDIS Campus Metepec',
    address:
      'Av. 5 532, Col. San José La Pilita, 52149 Metepec, Estado de México',
    lat: 19.25877,
    lng: -99.58566,
  },
  {
    code: 'DM',
    name: 'IEDIS Guardería y Desarrollo Infantil – Campus Metepec',
    address:
      'Av. 5 532-3, Col. San José La Pilita, 52149 Metepec, Estado de México',
    lat: 19.25877,
    lng: -99.58566,
  },
  {
    code: 'CO',
    name: 'Casita del Saber – IEDIS Campus Ocoyoacac',
    address:
      'Av. Martín Chimaltecalt 122, Barrio de Santa María, 52740 Ocoyoacac, Estado de México',
    lat: 19.2705874,
    lng: -99.4751669,
  },
  {
    code: 'DC',
    name: 'IEDIS Centro de Desarrollo Infantil – Campus Calimaya',
    address:
      'Calle La Gardenia 45, San Andrés Ocotlán, 52220 Calimaya, Estado de México',
    lat: 19.1925777,
    lng: -99.5857616,
  },
];

async function main() {
  console.log('DATABASE_URL:', process.env.DATABASE_URL);
  console.log('🌱 Seeding Planteles...');

  console.log('Existing Plantel count BEFORE:', await prisma.plantel.count());

  for (const p of planteles) {
    console.log('Upserting plantel', p.code, '-', p.name);
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

  console.log('Existing Plantel count AFTER:', await prisma.plantel.count());
  console.log('✅ Planteles seeded successfully.');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed with error:');
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
