import { writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const __dirname = dirname(fileURLToPath(import.meta.url))

const data = {
  'pinar-del-rio': {
    name: 'Pinar del Río',
    landmark: 'Valle de Viñales',
    municipalities: [
      'Consolación del Sur',
      'Guane',
      'La Palma',
      'Los Palacios',
      'Mantua',
      'Minas de Matahambre',
      'Pinar del Río',
      'San Juan y Martínez',
      'San Luis',
      'Sandino',
      'Viñales',
    ],
  },
  artemisa: {
    name: 'Artemisa',
    landmark: 'Sierra del Rosario',
    municipalities: [
      'Alquízar',
      'Artemisa',
      'Bahía Honda',
      'Bauta',
      'Caimito',
      'Candelaria',
      'Guanajay',
      'Güira de Melena',
      'Mariel',
      'San Antonio de los Baños',
      'San Cristóbal',
    ],
  },
  'la-habana': {
    name: 'La Habana',
    landmark: 'El Malecón',
    municipalities: [
      'Arroyo Naranjo',
      'Boyeros',
      'Centro Habana',
      'Cerro',
      'Cotorro',
      'Diez de Octubre',
      'Guanabacoa',
      'La Habana del Este',
      'La Habana Vieja',
      'La Lisa',
      'Marianao',
      'Playa',
      'Plaza de la Revolución',
      'Regla',
      'San Miguel del Padrón',
    ],
  },
  mayabeque: {
    name: 'Mayabeque',
    landmark: 'San José de las Lajas',
    municipalities: [
      'Batabanó',
      'Bejucal',
      'Güines',
      'Jaruco',
      'Madruga',
      'Melena del Sur',
      'Nueva Paz',
      'Quivicán',
      'San José de las Lajas',
      'San Nicolás',
      'Santa Cruz del Norte',
    ],
  },
  matanzas: {
    name: 'Matanzas',
    landmark: 'Varadero',
    municipalities: [
      'Calimete',
      'Cárdenas',
      'Ciénaga de Zapata',
      'Colón',
      'Jagüey Grande',
      'Jovellanos',
      'Limonar',
      'Los Arabos',
      'Martí',
      'Matanzas',
      'Pedro Betancourt',
      'Perico',
      'Unión de Reyes',
    ],
  },
  cienfuegos: {
    name: 'Cienfuegos',
    landmark: 'Centro histórico',
    municipalities: [
      'Abreus',
      'Aguada de Pasajeros',
      'Cienfuegos',
      'Cruces',
      'Cumanayagua',
      'Lajas',
      'Palmira',
      'Rodas',
    ],
  },
  'villa-clara': {
    name: 'Villa Clara',
    landmark: 'Santa Clara',
    municipalities: [
      'Caibarién',
      'Camajuaní',
      'Cifuentes',
      'Corralillo',
      'Encrucijada',
      'Manicaragua',
      'Placetas',
      'Quemado de Güines',
      'Ranchuelo',
      'San Juan de los Remedios',
      'Sagua la Grande',
      'Santa Clara',
      'Santo Domingo',
    ],
  },
  'sancti-spiritus': {
    name: 'Sancti Spíritus',
    landmark: 'Trinidad',
    municipalities: [
      'Cabaiguán',
      'Fomento',
      'Jatibonico',
      'La Sierpe',
      'Sancti Spíritus',
      'Taguasco',
      'Trinidad',
      'Yaguajay',
    ],
  },
  'ciego-de-avila': {
    name: 'Ciego de Ávila',
    landmark: 'Cayo Coco',
    municipalities: [
      'Baraguá',
      'Bolivia',
      'Chambas',
      'Ciego de Ávila',
      'Ciro Redondo',
      'Florencia',
      'Majagua',
      'Morón',
      'Primero de Enero',
      'Venezuela',
    ],
  },
  camaguey: {
    name: 'Camagüey',
    landmark: 'Centro histórico',
    municipalities: [
      'Camagüey',
      'Carlos M. de Céspedes',
      'Esmeralda',
      'Florida',
      'Guáimaro',
      'Jimaguayú',
      'Minas',
      'Najasa',
      'Nuevitas',
      'Santa Cruz del Sur',
      'Sibanicú',
      'Sierra de Cubitas',
      'Vertientes',
    ],
  },
  'las-tunas': {
    name: 'Las Tunas',
    landmark: 'Victoria de Las Tunas',
    municipalities: [
      'Amancio',
      'Colombia',
      'Jesús Menéndez',
      'Jobabo',
      'Las Tunas',
      'Majibacoa',
      'Manatí',
      'Puerto Padre',
    ],
  },
  holguin: {
    name: 'Holguín',
    landmark: 'Guardalavaca',
    municipalities: [
      'Antilla',
      'Báguanos',
      'Banes',
      'Cacocum',
      'Calixto García',
      'Cueto',
      'Frank País',
      'Gibara',
      'Holguín',
      'Mayarí',
      'Moa',
      'Rafael Freyre',
      'Sagua de Tánamo',
      'Urbano Noris',
    ],
  },
  granma: {
    name: 'Granma',
    landmark: 'Bayamo',
    municipalities: [
      'Bartolomé Masó',
      'Bayamo',
      'Buey Arriba',
      'Campechuela',
      'Cauto Cristo',
      'Guisa',
      'Jiguaní',
      'Manzanillo',
      'Media Luna',
      'Niquero',
      'Pilón',
      'Río Cauto',
      'Yara',
    ],
  },
  'santiago-de-cuba': {
    name: 'Santiago de Cuba',
    landmark: 'Castillo del Morro',
    municipalities: [
      'Contramaestre',
      'Guamá',
      'Mella',
      'Palma Soriano',
      'San Luis',
      'Santiago de Cuba',
      'Segundo Frente',
      'Songo-La Maya',
      'Tercer Frente',
    ],
  },
  guantanamo: {
    name: 'Guantánamo',
    landmark: 'Baracoa',
    municipalities: [
      'Baracoa',
      'Caimanera',
      'El Salvador',
      'Guantánamo',
      'Imías',
      'Maisí',
      'Manuel Tames',
      'Niceto Pérez',
      'San Antonio del Sur',
      'Yateras',
    ],
  },
  'isla-de-la-juventud': {
    name: 'Isla de la Juventud',
    landmark: 'Nueva Gerona',
    municipalities: ['Isla de la Juventud'],
  },
}

const capitals = {
  'pinar-del-rio': 'Pinar del Río',
  artemisa: 'Artemisa',
  'la-habana': 'La Habana',
  mayabeque: 'San José de las Lajas',
  matanzas: 'Matanzas',
  cienfuegos: 'Cienfuegos',
  'villa-clara': 'Santa Clara',
  'sancti-spiritus': 'Sancti Spíritus',
  'ciego-de-avila': 'Ciego de Ávila',
  camaguey: 'Camagüey',
  'las-tunas': 'Las Tunas',
  holguin: 'Holguín',
  granma: 'Bayamo',
  'santiago-de-cuba': 'Santiago de Cuba',
  guantanamo: 'Guantánamo',
  'isla-de-la-juventud': 'Isla de la Juventud',
}

function slug(name) {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

const provinces = Object.entries(data).map(([id, province]) => ({
  id,
  name: province.name,
  landmark: province.landmark,
  imageUrl: `https://picsum.photos/seed/cuba-${id}/400/400`,
  imageAlt: `${province.landmark}, ${province.name}`,
  municipalities: province.municipalities.map((name) => ({
    id: slug(name),
    name,
    isCapital: name === capitals[id],
  })),
}))

const output = `/** Provincias y municipios de Cuba (división territorial 2011). Generado por scripts/gen-cuba-locations.mjs */

export const CUBA_PROVINCES = ${JSON.stringify(provinces, null, 2)}

export function getProvinceById(provinceId) {
  return CUBA_PROVINCES.find((province) => province.id === provinceId) ?? null
}

export function getMunicipalityById(provinceId, municipalityId) {
  const province = getProvinceById(provinceId)
  if (!province) return null
  return province.municipalities.find((municipality) => municipality.id === municipalityId) ?? null
}
`

writeFileSync(join(__dirname, '../src/constants/cubaLocations.js'), output, 'utf8')

const municipalityMap = Object.fromEntries(
  provinces.map((province) => [
    province.id,
    Object.fromEntries(province.municipalities.map((m) => [m.id, m.name])),
  ]),
)

const provinceNames = Object.fromEntries(provinces.map((p) => [p.id, p.name]))

const pyOutput = `"""Provincias y municipios de Cuba. Generado por scripts/gen-cuba-locations.mjs."""

from __future__ import annotations

from fastapi import HTTPException, status

PROVINCE_NAMES: dict[str, str] = ${JSON.stringify(provinceNames, null, 4)}

MUNICIPALITIES_BY_PROVINCE: dict[str, dict[str, str]] = ${JSON.stringify(municipalityMap, null, 4)}


def validate_business_area(
    province_id: str,
    province_name: str,
    municipality_id: str,
    municipality_name: str,
) -> dict[str, str]:
    expected_province = PROVINCE_NAMES.get(province_id)
    if not expected_province:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Provincia no válida.",
        )
    if province_name.strip() != expected_province:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El nombre de la provincia no coincide.",
        )

    municipalities = MUNICIPALITIES_BY_PROVINCE.get(province_id, {})
    expected_municipality = municipalities.get(municipality_id)
    if not expected_municipality:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Municipio no válido para la provincia seleccionada.",
        )
    if municipality_name.strip() != expected_municipality:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El nombre del municipio no coincide.",
        )

    return {
        "province_id": province_id,
        "province_name": expected_province,
        "municipality_id": municipality_id,
        "municipality_name": expected_municipality,
    }
`

writeFileSync(join(__dirname, '../../backend/app/services/cuba_locations.py'), pyOutput, 'utf8')
console.log('Wrote', provinces.length, 'provinces')
