// --- prisma/seed.js ---
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const planteles = [
  { code: 'PM', name: 'Plantel Morelos', address: 'Av. Morelos #123, Ecatepec', lat: 19.609, lng: -99.060 },
  { code: 'PT', name: 'Plantel Tecnológico', address: 'Av. Central #45, Ecatepec', lat: 19.532, lng: -99.035 },
  { code: 'SM', name: 'Secundaria Morelos', address: 'Calle Benito Juárez #10, Coacalco', lat: 19.628, lng: -99.092 },
  { code: 'ST', name: 'Secundaria Tecnológico', address: 'Vía López Portillo #55, Coacalco', lat: 19.615, lng: -99.110 },
  { code: 'PREET', name: 'Preescolar Ecatepec', address: 'Calle Agricultura #8, Ecatepec', lat: 19.600, lng: -99.050 },
  { code: 'PREEM', name: 'Preescolar Morelos', address: 'Av. Revolución #22, Ecatepec', lat: 19.590, lng: -99.040 },
  { code: 'ISM', name: 'Instituto Superior Morelos', address: 'Av. Insurgentes #99, CDMX', lat: 19.432, lng: -99.133 },
  { code: 'IS', name: 'Instituto Superior', address: 'Campus Central, CDMX', lat: 19.420, lng: -99.150 },
  { code: 'CT', name: 'Campus Tulpetlac', address: 'Vía Morelos km 18, Tulpetlac', lat: 19.560, lng: -99.070 },
  { code: 'CM', name: 'Campus Monterrey', address: 'Calle Real #5, Monterrey', lat: 25.686, lng: -100.316 },
  { code: 'DM', name: 'Dirección General', address: 'Oficinas Centrales', lat: 19.400, lng: -99.100 },
  { code: 'CO', name: 'Campus Coacalco', address: 'Eje 8 #33, Coacalco', lat: 19.630, lng: -99.100 },
];

async function main() {
  console.log('🌱 Seeding Planteles...');
  
  for (const p of planteles) {
    await prisma.plantel.upsert({
      where: { code: p.code },
      update: {}, // If exists, do nothing
      create: {
        name: p.name,
        code: p.code,
        address: p.address,
        lat: p.lat,
        lng: p.lng,
        isActive: true
      }
    });
  }
  console.log('✅ Planteles seeded successfully.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });