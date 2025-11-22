// prisma/seed.js
const { PrismaClient } = require('@prisma/client');
const { randomUUID } = require('crypto');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

/**
 * PLANTELES
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

/**
 * CHECKLIST ITEMS
 * Table: checklisttemplate
 */
const checklistItems = [
  { id: 'chk-entrevista-1', name: 'Entrevista 1', type: 'DATE', sortOrder: 1 },
  { id: 'chk-entrevista-2', name: 'Entrevista 2', type: 'DATE', sortOrder: 2 },
  {
    id: 'chk-documentos-signia',
    name: 'Documentos Signia',
    type: 'CHECKBOX',
    sortOrder: 3,
  },
  { id: 'chk-evaluatest', name: 'Evaluatest', type: 'CHECKBOX', sortOrder: 4 },
  { id: 'chk-path', name: 'PATH', type: 'CHECKBOX', sortOrder: 5 },
];

/**
 * Load puestos from prisma/puestos.csv
 * CSV format:
 *   name
 *   ADMON ESCOLAR
 *   ...
 */
function loadPuestosFromCsv() {
  const csvPath = path.join(__dirname, 'puestos.csv'); // <— place file here
  const raw = fs.readFileSync(csvPath, 'utf8');

  const lines = raw
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  if (lines.length === 0) return [];

  const header = lines[0].split(',').map((h) => h.trim());
  const nameIdx = header.indexOf('name');
  const categoryIdx = header.indexOf('category'); // optional

  if (nameIdx === -1) {
    throw new Error('puestos.csv must have a "name" column');
  }

  const puestos = lines.slice(1).map((line) => {
    const cols = line.split(',');
    const name = (cols[nameIdx] || '').trim();
    const category =
      categoryIdx >= 0 && cols[categoryIdx]
        ? cols[categoryIdx].trim()
        : null;

    if (!name) return null;

    return { name, category };
  });

  return puestos.filter(Boolean);
}

/**
 * SEED HELPERS
 */

async function seedPlanteles() {
  console.log('→ Seeding planteles…');

  for (const p of planteles) {
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

  const count = await prisma.plantel.count();
  console.log(`   ✅ planteles count: ${count}`);
}

async function seedJobTitles() {
  console.log('→ Seeding job titles (puestos)…');

  const puestos = loadPuestosFromCsv();
  console.log(`   Found ${puestos.length} puestos in CSV`);

  for (const p of puestos) {
    await prisma.jobtitle.upsert({
      // name is UNIQUE in your table, so we use it as the identity
      where: { name: p.name },
      update: {
        category: p.category || null,
        isActive: true,
      },
      create: {
        id: randomUUID(),
        name: p.name,
        category: p.category || null,
        isActive: true,
      },
    });
  }

  const count = await prisma.jobtitle.count();
  console.log(`   ✅ jobtitle count: ${count}`);
}

async function seedChecklistTemplates() {
  console.log('→ Seeding checklist templates…');

  for (const c of checklistItems) {
    await prisma.checklisttemplate.upsert({
      where: { id: c.id }, // primary key
      update: {
        name: c.name,
        type: c.type,
        isActive: true,
        sortOrder: c.sortOrder,
      },
      create: {
        id: c.id,
        name: c.name,
        type: c.type,
        isActive: true,
        sortOrder: c.sortOrder,
      },
    });
  }

  const count = await prisma.checklisttemplate.count();
  console.log(`   ✅ checklisttemplate count: ${count}`);
}

/**
 * MAIN
 */

async function main() {
  console.log('-----------------------------------------------------------');
  console.log('🌱 STARTING SEED PROCESS');
  console.log('DATABASE_URL:', process.env.DATABASE_URL);
  console.log('-----------------------------------------------------------');

  // Connectivity check
  await prisma.$queryRaw`SELECT 1`;
  console.log('✅ Database connection OK\n');

  await seedPlanteles();
  await seedJobTitles();
  await seedChecklistTemplates();

  console.log('\n🌱 Seed completed successfully!');
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
