import { PrismaClient, Prisma, type AttributeType } from "@prisma/client";

const prisma = new PrismaClient();

/** Build a translatable label record across the five launch locales. */
function t(es: string, en: string, pt: string, zh: string, ru: string) {
  return { es, en, pt, zh, ru };
}

type AttrSeed = {
  key: string;
  label: ReturnType<typeof t>;
  type: AttributeType;
  unit?: string;
  required?: boolean;
  filterable?: boolean;
  options?: { value: string; label: ReturnType<typeof t> }[];
};

type CategorySeed = {
  slug: string;
  name: ReturnType<typeof t>;
  icon?: string;
  children?: CategorySeed[];
  attributes?: AttrSeed[];
};

const realEstateAttrs: AttrSeed[] = [
  { key: "bedrooms", label: t("Dormitorios", "Bedrooms", "Quartos", "卧室", "Спальни"), type: "NUMBER" },
  { key: "bathrooms", label: t("Baños", "Bathrooms", "Banheiros", "浴室", "Ванные"), type: "NUMBER" },
  { key: "area", label: t("Superficie", "Area", "Área", "面积", "Площадь"), type: "NUMBER", unit: "m²", required: true },
  { key: "parking", label: t("Estacionamientos", "Parking spots", "Vagas", "车位", "Парковка"), type: "NUMBER" },
  { key: "furnished", label: t("Amoblado", "Furnished", "Mobiliado", "带家具", "С мебелью"), type: "BOOLEAN" },
  { key: "yearBuilt", label: t("Año de construcción", "Year built", "Ano de construção", "建造年份", "Год постройки"), type: "NUMBER" },
];

const categories: CategorySeed[] = [
  {
    slug: "real-estate",
    name: t("Bienes raíces", "Real estate", "Imóveis", "房地产", "Недвижимость"),
    icon: "building-2",
    children: [
      {
        slug: "houses",
        name: t("Casas", "Houses", "Casas", "房屋", "Дома"),
        icon: "home",
        attributes: realEstateAttrs,
      },
      {
        slug: "apartments",
        name: t("Departamentos", "Apartments", "Apartamentos", "公寓", "Квартиры"),
        icon: "building",
        attributes: realEstateAttrs,
      },
      {
        slug: "land",
        name: t("Terrenos", "Land", "Terrenos", "土地", "Земля"),
        icon: "trees",
        attributes: [
          { key: "area", label: t("Superficie", "Area", "Área", "面积", "Площадь"), type: "NUMBER", unit: "m²", required: true },
          {
            key: "zoning",
            label: t("Uso de suelo", "Zoning", "Zoneamento", "用途", "Зонирование"),
            type: "ENUM",
            options: [
              { value: "residential", label: t("Residencial", "Residential", "Residencial", "住宅", "Жилое") },
              { value: "commercial", label: t("Comercial", "Commercial", "Comercial", "商业", "Коммерческое") },
              { value: "agricultural", label: t("Agrícola", "Agricultural", "Agrícola", "农业", "Сельхоз") },
            ],
          },
          { key: "hasUtilities", label: t("Servicios básicos", "Utilities", "Serviços básicos", "公用设施", "Коммуникации"), type: "BOOLEAN" },
        ],
      },
    ],
  },
  {
    slug: "vehicles",
    name: t("Vehículos", "Vehicles", "Veículos", "车辆", "Транспорт"),
    icon: "car",
    children: [
      {
        slug: "cars",
        name: t("Autos", "Cars", "Carros", "汽车", "Автомобили"),
        icon: "car",
        attributes: [
          { key: "make", label: t("Marca", "Make", "Marca", "品牌", "Марка"), type: "TEXT", required: true },
          { key: "model", label: t("Modelo", "Model", "Modelo", "型号", "Модель"), type: "TEXT", required: true },
          { key: "year", label: t("Año", "Year", "Ano", "年份", "Год"), type: "NUMBER", required: true },
          { key: "mileage", label: t("Kilometraje", "Mileage", "Quilometragem", "里程", "Пробег"), type: "NUMBER", unit: "km" },
          {
            key: "fuel",
            label: t("Combustible", "Fuel", "Combustível", "燃料", "Топливо"),
            type: "ENUM",
            options: [
              { value: "gasoline", label: t("Gasolina", "Gasoline", "Gasolina", "汽油", "Бензин") },
              { value: "diesel", label: t("Diésel", "Diesel", "Diesel", "柴油", "Дизель") },
              { value: "electric", label: t("Eléctrico", "Electric", "Elétrico", "电动", "Электро") },
              { value: "hybrid", label: t("Híbrido", "Hybrid", "Híbrido", "混合动力", "Гибрид") },
            ],
          },
          {
            key: "transmission",
            label: t("Transmisión", "Transmission", "Transmissão", "变速箱", "Коробка"),
            type: "ENUM",
            options: [
              { value: "manual", label: t("Manual", "Manual", "Manual", "手动", "Механика") },
              { value: "automatic", label: t("Automática", "Automatic", "Automática", "自动", "Автомат") },
            ],
          },
          { key: "color", label: t("Color", "Color", "Cor", "颜色", "Цвет"), type: "TEXT" },
        ],
      },
    ],
  },
];

async function upsertCategory(seed: CategorySeed, parentId: string | null, order: number) {
  const category = await prisma.category.upsert({
    where: { slug: seed.slug },
    update: { name: seed.name, icon: seed.icon, parentId, order },
    create: { slug: seed.slug, name: seed.name, icon: seed.icon, parentId, order },
  });

  if (seed.attributes) {
    for (let i = 0; i < seed.attributes.length; i++) {
      const a = seed.attributes[i]!;
      await prisma.attributeDefinition.upsert({
        where: { categoryId_key: { categoryId: category.id, key: a.key } },
        update: {
          label: a.label,
          type: a.type,
          unit: a.unit,
          options: a.options ?? undefined,
          required: a.required ?? false,
          filterable: a.filterable ?? true,
          order: i,
        },
        create: {
          categoryId: category.id,
          key: a.key,
          label: a.label,
          type: a.type,
          unit: a.unit,
          options: a.options ?? undefined,
          required: a.required ?? false,
          filterable: a.filterable ?? true,
          order: i,
        },
      });
    }
  }

  if (seed.children) {
    for (let i = 0; i < seed.children.length; i++) {
      await upsertCategory(seed.children[i]!, category.id, i);
    }
  }
}

// ─────────────────────────────────────────────────────────────────────────
// Demo content — a sample seller + listings so the UI looks alive in a demo.
// ─────────────────────────────────────────────────────────────────────────

type DemoListing = {
  categorySlug: string;
  type: "RENT" | "SALE";
  title: string;
  description: string;
  price: number;
  currency: string;
  city: string;
  country: string;
  verificationStatus: "VERIFIED" | "PENDING" | "UNVERIFIED";
  attributes: Record<string, unknown>;
  images: string[]; // picsum seeds
};

const DEMO_LISTINGS: DemoListing[] = [
  {
    categorySlug: "houses",
    type: "SALE",
    title: "Casa moderna con jardín en Equipetrol",
    description:
      "Hermosa casa de dos plantas en zona residencial, amplio jardín, garaje para dos autos y acabados de primera. Documentación al día en Derechos Reales.",
    price: 245000,
    currency: "USD",
    city: "Santa Cruz de la Sierra",
    country: "Bolivia",
    verificationStatus: "VERIFIED",
    attributes: { bedrooms: 4, bathrooms: 3, area: 320, parking: 2, furnished: false, yearBuilt: 2019 },
    images: ["house-1a", "house-1b", "house-1c"],
  },
  {
    categorySlug: "houses",
    type: "RENT",
    title: "Casa familiar amoblada cerca del centro",
    description: "Casa amoblada lista para habitar, ideal para familias. Incluye servicios y mantenimiento del jardín.",
    price: 850,
    currency: "USD",
    city: "Cochabamba",
    country: "Bolivia",
    verificationStatus: "PENDING",
    attributes: { bedrooms: 3, bathrooms: 2, area: 210, parking: 1, furnished: true, yearBuilt: 2015 },
    images: ["house-2a", "house-2b"],
  },
  {
    categorySlug: "apartments",
    type: "RENT",
    title: "Departamento con vista panorámica",
    description: "Moderno departamento en piso 12 con balcón, gimnasio y seguridad 24/7. Excelente ubicación.",
    price: 600,
    currency: "USD",
    city: "La Paz",
    country: "Bolivia",
    verificationStatus: "VERIFIED",
    attributes: { bedrooms: 2, bathrooms: 2, area: 95, parking: 1, furnished: true, yearBuilt: 2021 },
    images: ["apt-1a", "apt-1b", "apt-1c"],
  },
  {
    categorySlug: "land",
    type: "SALE",
    title: "Terreno comercial sobre avenida principal",
    description: "Excelente terreno con uso de suelo comercial, ideal para emprendimiento. Servicios básicos disponibles.",
    price: 180000,
    currency: "USD",
    city: "Santa Cruz de la Sierra",
    country: "Bolivia",
    verificationStatus: "VERIFIED",
    attributes: { area: 1200, zoning: "commercial", hasUtilities: true },
    images: ["land-1a", "land-1b"],
  },
  {
    categorySlug: "land",
    type: "SALE",
    title: "Terreno agrícola con acceso a riego",
    description: "Amplio terreno agrícola de gran potencial productivo, con acceso a riego y camino consolidado.",
    price: 95000,
    currency: "USD",
    city: "Tarija",
    country: "Bolivia",
    verificationStatus: "UNVERIFIED",
    attributes: { area: 5000, zoning: "agricultural", hasUtilities: false },
    images: ["land-2a"],
  },
  {
    categorySlug: "cars",
    type: "SALE",
    title: "Toyota Hilux 2020 4x4 Diesel",
    description: "Camioneta en excelente estado, único dueño, mantenimientos en agencia. Lista para transferencia.",
    price: 32000,
    currency: "USD",
    city: "Santa Cruz de la Sierra",
    country: "Bolivia",
    verificationStatus: "VERIFIED",
    attributes: { make: "Toyota", model: "Hilux", year: 2020, mileage: 68000, fuel: "diesel", transmission: "automatic", color: "Blanco" },
    images: ["car-1a", "car-1b", "car-1c"],
  },
  {
    categorySlug: "cars",
    type: "SALE",
    title: "Nissan Versa 2018 — Económico",
    description: "Sedán ideal para ciudad, bajo consumo, papeles al día. Excelente primer auto.",
    price: 12500,
    currency: "USD",
    city: "Cochabamba",
    country: "Bolivia",
    verificationStatus: "PENDING",
    attributes: { make: "Nissan", model: "Versa", year: 2018, mileage: 94000, fuel: "gasoline", transmission: "manual", color: "Gris" },
    images: ["car-2a", "car-2b"],
  },
  {
    categorySlug: "apartments",
    type: "SALE",
    title: "Departamento de estreno en zona norte",
    description: "Departamento nuevo, nunca habitado, dos dormitorios, cocina equipada y parqueo cubierto.",
    price: 89000,
    currency: "USD",
    city: "La Paz",
    country: "Bolivia",
    verificationStatus: "VERIFIED",
    attributes: { bedrooms: 2, bathrooms: 1, area: 78, parking: 1, furnished: false, yearBuilt: 2023 },
    images: ["apt-2a", "apt-2b"],
  },
];

async function seedDemoListings() {
  const seller = await prisma.user.upsert({
    where: { email: "demo.seller@atria.app" },
    update: { role: "SELLER" },
    create: {
      email: "demo.seller@atria.app",
      name: "Demo Inmobiliaria",
      emailVerified: true,
      role: "SELLER",
    },
  });

  const existing = await prisma.listing.count({ where: { sellerId: seller.id } });
  if (existing > 0) {
    console.log(`ℹ️  Demo listings already present (${existing}) — skipping.`);
    return;
  }

  for (const item of DEMO_LISTINGS) {
    const category = await prisma.category.findUnique({ where: { slug: item.categorySlug } });
    if (!category) continue;
    await prisma.listing.create({
      data: {
        sellerId: seller.id,
        categoryId: category.id,
        type: item.type,
        status: "ACTIVE",
        verificationStatus: item.verificationStatus,
        title: item.title,
        description: item.description,
        price: item.price,
        currency: item.currency,
        city: item.city,
        country: item.country,
        sourceLocale: "es",
        attributes: item.attributes as Prisma.InputJsonValue,
        media: {
          create: item.images.map((seed, i) => ({
            url: `https://picsum.photos/seed/atria-${seed}/800/600`,
            key: `demo/${seed}.jpg`,
            order: i,
            isCover: i === 0,
          })),
        },
      },
    });
  }
  console.log(`✅ Seeded ${DEMO_LISTINGS.length} demo listings (seller: ${seller.email}).`);
}

async function main() {
  console.log("🌱 Seeding categories & attribute definitions…");
  for (let i = 0; i < categories.length; i++) {
    await upsertCategory(categories[i]!, null, i);
  }
  await seedDemoListings();
  console.log("✅ Seed complete.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
