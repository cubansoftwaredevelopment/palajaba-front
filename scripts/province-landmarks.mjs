/**
 * Lugares emblemáticos por provincia (Cuba) e imágenes en Wikimedia Commons.
 * Usado por gen-cuba-locations.mjs y download-province-images.mjs
 */

export const PROVINCE_LANDMARKS = {
  'pinar-del-rio': {
    landmark: 'Valle de Viñales',
    imageAlt: 'Mogotes del Valle de Viñales, Pinar del Río',
    commonsFile: 'File:Vinales vue mogotes.jpg',
  },
  artemisa: {
    landmark: 'Las Terrazas',
    imageAlt: 'Comunidad ecológica Las Terrazas, Artemisa',
    commonsFile: 'File:Las Terrazas (Cuba).jpg',
  },
  'la-habana': {
    landmark: 'Castillo del Morro',
    imageAlt: 'Castillo del Morro, La Habana',
    commonsFile: 'File:Castillo del Morro Habana 2.JPG',
  },
  mayabeque: {
    landmark: 'Viaducto de Bacunayagua',
    imageAlt: 'Viaducto de Bacunayagua, Mayabeque',
    commonsFile: 'File:Viaducto de Bacunayagua.jpg',
  },
  matanzas: {
    landmark: 'Puente de la Concordia',
    imageAlt: 'Puente de la Concordia sobre el Yumurí, Matanzas',
    commonsFile: 'File:Matanzas - Puente de la Concordia.jpg',
  },
  cienfuegos: {
    landmark: 'Estatua de Benny Moré',
    imageAlt: 'Estatua de Benny Moré en el Paseo del Prado, Cienfuegos',
    commonsFile: 'File:Statue of Benny Moré, Cienfuegos, Cuba (11805692713).jpg',
  },
  'villa-clara': {
    landmark: 'Monumento al Che Guevara',
    imageAlt: 'Monumento a Ernesto Che Guevara, Santa Clara',
    commonsFile: 'File:Che Guevara Monument, Santa Clara, Cuba.jpg',
  },
  'sancti-spiritus': {
    landmark: 'Trinidad',
    imageAlt: 'Centro histórico de Trinidad, Sancti Spíritus',
    commonsFile: 'File:Trinidad, Cuba (15052855676).jpg',
  },
  'ciego-de-avila': {
    landmark: 'Cayo Coco',
    imageAlt: 'Playa de Cayo Coco, Ciego de Ávila',
    commonsFile: 'File:Cayo Coco beach Cuba.jpg',
  },
  camaguey: {
    landmark: 'Centro histórico de Camagüey',
    imageAlt: 'Iglesia del Sagrado Corazón de Jesús, Camagüey',
    commonsFile: 'File:Camagüey, Cuba.jpg',
  },
  'las-tunas': {
    landmark: 'Plaza Martiana',
    imageAlt: 'Plaza Martiana, Las Tunas',
    commonsFile: 'File:Las Tunas, Cuba.jpg',
  },
  holguin: {
    landmark: 'Loma de la Cruz',
    imageAlt: 'Loma de la Cruz, Holguín',
    commonsFile: 'File:Loma de la Cruz, Holguin.jpg',
  },
  granma: {
    landmark: 'Plaza de la Patria, Bayamo',
    imageAlt: 'Catedral de Bayamo, Granma',
    commonsFile: 'File:Catedral de Bayamo, Cuba.jpg',
  },
  'santiago-de-cuba': {
    landmark: 'Castillo San Pedro de la Roca',
    imageAlt: 'Castillo San Pedro de la Roca, Santiago de Cuba',
    commonsFile: 'File:Castillo San Pedro de la Roca 2008.jpg',
  },
  guantanamo: {
    landmark: 'El Yunque de Baracoa',
    imageAlt: 'El Yunque de Baracoa, Guantánamo',
    commonsFile: 'File:El Yunque de Baracoa.jpg',
  },
  'isla-de-la-juventud': {
    landmark: 'Presidio Modelo',
    imageAlt: 'Presidio Modelo, Isla de la Juventud',
    commonsFile: 'File:Presidio Modelo Cuba.jpg',
  },
}

/** Archivos en public/images/provinces/ cuando el nombre no coincide con {id}.jpg */
export const PROVINCE_IMAGE_FILES = {
  'pinar-del-rio': 'pinar.jpg',
  'villa-clara': 'santa-clara.jpg',
  'sancti-spiritus': 'santi-spiritu.jpg',
}

export function provinceImageFilename(provinceId) {
  return PROVINCE_IMAGE_FILES[provinceId] ?? `${provinceId}.jpg`
}
