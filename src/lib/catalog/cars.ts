import type { CatalogCar } from '@/lib/game/types'

/**
 * The seed vehicle catalog. Specs are the single source of truth for cards:
 * a card stores what was seen (model, colour, place), the catalog stores
 * what the car is. Quarter-mile times are never stored — they are computed
 * from power, weight and drivetrain so that mods can change race outcomes.
 *
 * Prices are approximate current market values in USD, not original MSRP,
 * and are meant to be refreshed monthly.
 */
export const CATALOG: CatalogCar[] = [
  // ---------------------------------------------------------------- hypercar
  { id: 'bugatti-chiron', make: 'Bugatti', model: 'Chiron', generation: '2016-2022', yearStart: 2016, yearEnd: 2022, category: 'hypercar', horsepower: 1479, weightLbs: 4400, topSpeedMph: 261, priceUsd: 3400000, drivetrain: 'awd', status: 'approved' },
  { id: 'bugatti-chiron-super-sport', make: 'Bugatti', model: 'Chiron', trim: 'Super Sport 300+', yearStart: 2021, category: 'hypercar', horsepower: 1578, weightLbs: 4360, topSpeedMph: 304, priceUsd: 5200000, drivetrain: 'awd', status: 'approved' },
  { id: 'koenigsegg-jesko', make: 'Koenigsegg', model: 'Jesko', trim: 'Absolut', yearStart: 2022, category: 'hypercar', horsepower: 1600, weightLbs: 3131, topSpeedMph: 310, priceUsd: 3800000, drivetrain: 'rwd', status: 'approved' },
  { id: 'rimac-nevera', make: 'Rimac', model: 'Nevera', yearStart: 2021, category: 'hypercar', horsepower: 1914, weightLbs: 5070, topSpeedMph: 258, priceUsd: 2400000, drivetrain: 'awd', status: 'approved' },
  { id: 'mclaren-p1', make: 'McLaren', model: 'P1', yearStart: 2013, yearEnd: 2015, category: 'hypercar', horsepower: 903, weightLbs: 3411, topSpeedMph: 217, priceUsd: 2100000, drivetrain: 'rwd', status: 'approved' },
  { id: 'ferrari-laferrari', make: 'Ferrari', model: 'LaFerrari', yearStart: 2013, yearEnd: 2016, category: 'hypercar', horsepower: 949, weightLbs: 3495, topSpeedMph: 217, priceUsd: 3600000, drivetrain: 'rwd', status: 'approved' },
  { id: 'porsche-918', make: 'Porsche', model: '918 Spyder', yearStart: 2013, yearEnd: 2015, category: 'hypercar', horsepower: 887, weightLbs: 3715, topSpeedMph: 214, priceUsd: 1900000, drivetrain: 'awd', status: 'approved' },
  { id: 'pagani-huayra', make: 'Pagani', model: 'Huayra', yearStart: 2012, category: 'hypercar', horsepower: 730, weightLbs: 2976, topSpeedMph: 238, priceUsd: 2700000, drivetrain: 'rwd', status: 'approved' },
  { id: 'aston-valkyrie', make: 'Aston Martin', model: 'Valkyrie', yearStart: 2021, category: 'hypercar', horsepower: 1139, weightLbs: 2954, topSpeedMph: 217, priceUsd: 3200000, drivetrain: 'rwd', status: 'approved' },

  // ---------------------------------------------------------------- supercar
  { id: 'lamborghini-huracan-evo', make: 'Lamborghini', model: 'Huracán', trim: 'EVO', yearStart: 2019, category: 'supercar', horsepower: 631, weightLbs: 3400, topSpeedMph: 202, priceUsd: 265000, drivetrain: 'awd', status: 'approved' },
  { id: 'lamborghini-aventador-svj', make: 'Lamborghini', model: 'Aventador', trim: 'SVJ', yearStart: 2018, yearEnd: 2022, category: 'supercar', horsepower: 759, weightLbs: 3362, topSpeedMph: 217, priceUsd: 620000, drivetrain: 'awd', status: 'approved' },
  { id: 'lamborghini-revuelto', make: 'Lamborghini', model: 'Revuelto', yearStart: 2024, category: 'supercar', horsepower: 1001, weightLbs: 3907, topSpeedMph: 218, priceUsd: 680000, drivetrain: 'awd', status: 'approved' },
  { id: 'ferrari-f8-tributo', make: 'Ferrari', model: 'F8 Tributo', yearStart: 2019, yearEnd: 2023, category: 'supercar', horsepower: 710, weightLbs: 3164, topSpeedMph: 211, priceUsd: 345000, drivetrain: 'rwd', status: 'approved' },
  { id: 'ferrari-296-gtb', make: 'Ferrari', model: '296 GTB', yearStart: 2022, category: 'supercar', horsepower: 819, weightLbs: 3241, topSpeedMph: 205, priceUsd: 395000, drivetrain: 'rwd', status: 'approved' },
  { id: 'mclaren-720s', make: 'McLaren', model: '720S', yearStart: 2017, yearEnd: 2023, category: 'supercar', horsepower: 710, weightLbs: 3167, topSpeedMph: 212, priceUsd: 245000, drivetrain: 'rwd', status: 'approved' },
  { id: 'audi-r8-v10', make: 'Audi', model: 'R8', trim: 'V10 Performance', yearStart: 2019, yearEnd: 2023, category: 'supercar', horsepower: 602, weightLbs: 3737, topSpeedMph: 205, priceUsd: 185000, drivetrain: 'awd', status: 'approved' },
  { id: 'porsche-911-turbo-s', make: 'Porsche', model: '911', trim: 'Turbo S', generation: '992', yearStart: 2020, category: 'supercar', horsepower: 640, weightLbs: 3636, topSpeedMph: 205, priceUsd: 235000, drivetrain: 'awd', status: 'approved', aliases: ['992 Turbo S', 'Porsche 911 Turbo'] },
  { id: 'porsche-911-gt3-rs', make: 'Porsche', model: '911', trim: 'GT3 RS', generation: '992', yearStart: 2023, category: 'supercar', horsepower: 518, weightLbs: 3268, topSpeedMph: 184, priceUsd: 330000, drivetrain: 'rwd', status: 'approved' },
  { id: 'nissan-gtr-r35', make: 'Nissan', model: 'GT-R', trim: 'Premium', generation: 'R35', yearStart: 2009, category: 'supercar', horsepower: 565, weightLbs: 3933, topSpeedMph: 196, priceUsd: 125000, drivetrain: 'awd', status: 'approved', aliases: ['Nissan Skyline GT-R R35'] },
  { id: 'corvette-z06-c8', make: 'Chevrolet', model: 'Corvette', trim: 'Z06', generation: 'C8', yearStart: 2023, category: 'supercar', horsepower: 670, weightLbs: 3650, topSpeedMph: 189, priceUsd: 135000, drivetrain: 'rwd', status: 'approved' },
  { id: 'acura-nsx-2nd', make: 'Acura', model: 'NSX', generation: 'NC1', yearStart: 2017, yearEnd: 2022, category: 'supercar', horsepower: 573, weightLbs: 3878, topSpeedMph: 191, priceUsd: 145000, drivetrain: 'awd', status: 'approved' },

  // ------------------------------------------------------------------ sports
  { id: 'toyota-gr-supra', make: 'Toyota', model: 'GR Supra', trim: '3.0', generation: 'A90', yearStart: 2020, category: 'sports', horsepower: 382, weightLbs: 3400, topSpeedMph: 155, priceUsd: 56000, drivetrain: 'rwd', status: 'approved', aliases: ['Toyota Supra MkV'] },
  { id: 'bmw-m3-g80', make: 'BMW', model: 'M3', trim: 'Competition', generation: 'G80', yearStart: 2021, category: 'sports', horsepower: 503, weightLbs: 3890, topSpeedMph: 180, priceUsd: 82000, drivetrain: 'rwd', status: 'approved' },
  { id: 'bmw-m2-g87', make: 'BMW', model: 'M2', generation: 'G87', yearStart: 2023, category: 'sports', horsepower: 453, weightLbs: 3814, topSpeedMph: 177, priceUsd: 66000, drivetrain: 'rwd', status: 'approved' },
  { id: 'porsche-718-cayman-gts', make: 'Porsche', model: '718 Cayman', trim: 'GTS 4.0', yearStart: 2020, category: 'sports', horsepower: 394, weightLbs: 3143, topSpeedMph: 182, priceUsd: 98000, drivetrain: 'rwd', status: 'approved' },
  { id: 'subaru-wrx-sti', make: 'Subaru', model: 'WRX STI', generation: 'VA', yearStart: 2015, yearEnd: 2021, category: 'sports', horsepower: 310, weightLbs: 3471, topSpeedMph: 159, priceUsd: 42000, drivetrain: 'awd', status: 'approved' },
  { id: 'mitsubishi-evo-x', make: 'Mitsubishi', model: 'Lancer Evolution', trim: 'MR', generation: 'X', yearStart: 2008, yearEnd: 2015, category: 'sports', horsepower: 291, weightLbs: 3516, topSpeedMph: 155, priceUsd: 38000, drivetrain: 'awd', status: 'approved', aliases: ['Mitsubishi Evo X'] },
  { id: 'nissan-silvia-s15', make: 'Nissan', model: 'Silvia', trim: 'Spec-R', generation: 'S15', yearStart: 1999, yearEnd: 2002, category: 'sports', horsepower: 247, weightLbs: 2778, topSpeedMph: 149, priceUsd: 45000, drivetrain: 'rwd', status: 'approved' },
  { id: 'mazda-rx7-fd', make: 'Mazda', model: 'RX-7', trim: 'Spirit R', generation: 'FD', yearStart: 1992, yearEnd: 2002, category: 'sports', horsepower: 276, weightLbs: 2822, topSpeedMph: 155, priceUsd: 72000, drivetrain: 'rwd', status: 'approved' },
  { id: 'honda-civic-type-r-fl5', make: 'Honda', model: 'Civic Type R', generation: 'FL5', yearStart: 2023, category: 'sports', horsepower: 315, weightLbs: 3188, topSpeedMph: 171, priceUsd: 46000, drivetrain: 'fwd', status: 'approved' },
  { id: 'toyota-gr86', make: 'Toyota', model: 'GR86', yearStart: 2022, category: 'sports', horsepower: 228, weightLbs: 2811, topSpeedMph: 140, priceUsd: 32000, drivetrain: 'rwd', status: 'approved' },
  { id: 'mazda-mx5-nd', make: 'Mazda', model: 'MX-5 Miata', generation: 'ND', yearStart: 2016, category: 'sports', horsepower: 181, weightLbs: 2341, topSpeedMph: 136, priceUsd: 29000, drivetrain: 'rwd', status: 'approved' },
  { id: 'nissan-z-rz34', make: 'Nissan', model: 'Z', trim: 'Performance', generation: 'RZ34', yearStart: 2023, category: 'sports', horsepower: 400, weightLbs: 3486, topSpeedMph: 155, priceUsd: 54000, drivetrain: 'rwd', status: 'approved' },

  // -------------------------------------------------------------- luxury SUV
  { id: 'lamborghini-urus-s', make: 'Lamborghini', model: 'Urus', trim: 'S', yearStart: 2023, category: 'luxury_suv', horsepower: 657, weightLbs: 4850, topSpeedMph: 190, priceUsd: 265000, drivetrain: 'awd', status: 'approved' },
  { id: 'porsche-cayenne-turbo-gt', make: 'Porsche', model: 'Cayenne', trim: 'Turbo GT', yearStart: 2022, category: 'luxury_suv', horsepower: 650, weightLbs: 4988, topSpeedMph: 186, priceUsd: 210000, drivetrain: 'awd', status: 'approved' },
  { id: 'amg-g63', make: 'Mercedes-AMG', model: 'G63', generation: 'W463A', yearStart: 2019, category: 'luxury_suv', horsepower: 577, weightLbs: 5820, topSpeedMph: 149, priceUsd: 195000, drivetrain: 'awd', status: 'approved', aliases: ['Mercedes G Wagon AMG'] },
  { id: 'bmw-x5-m-competition', make: 'BMW', model: 'X5 M', trim: 'Competition', yearStart: 2020, category: 'luxury_suv', horsepower: 617, weightLbs: 5425, topSpeedMph: 177, priceUsd: 135000, drivetrain: 'awd', status: 'approved' },
  { id: 'range-rover-sport-svr', make: 'Land Rover', model: 'Range Rover Sport', trim: 'SVR', yearStart: 2018, yearEnd: 2022, category: 'luxury_suv', horsepower: 575, weightLbs: 5265, topSpeedMph: 176, priceUsd: 98000, drivetrain: 'awd', status: 'approved' },
  { id: 'bentley-bentayga-speed', make: 'Bentley', model: 'Bentayga', trim: 'Speed', yearStart: 2020, category: 'luxury_suv', horsepower: 626, weightLbs: 5340, topSpeedMph: 190, priceUsd: 265000, drivetrain: 'awd', status: 'approved' },

  // ------------------------------------------------------------ luxury sedan
  { id: 'amg-s63-e-performance', make: 'Mercedes-AMG', model: 'S63', trim: 'E Performance', yearStart: 2024, category: 'luxury_sedan', horsepower: 791, weightLbs: 5560, topSpeedMph: 180, priceUsd: 215000, drivetrain: 'awd', status: 'approved', aliases: ['AMG S63 EP', 'Mercedes S63 E Performance'] },
  { id: 'bmw-m5-f90', make: 'BMW', model: 'M5', trim: 'Competition', generation: 'F90', yearStart: 2018, yearEnd: 2023, category: 'luxury_sedan', horsepower: 617, weightLbs: 4370, topSpeedMph: 190, priceUsd: 95000, drivetrain: 'awd', status: 'approved' },
  { id: 'audi-rs7', make: 'Audi', model: 'RS7', trim: 'Sportback', generation: 'C8', yearStart: 2020, category: 'luxury_sedan', horsepower: 591, weightLbs: 4740, topSpeedMph: 190, priceUsd: 135000, drivetrain: 'awd', status: 'approved' },
  { id: 'porsche-taycan-turbo-s', make: 'Porsche', model: 'Taycan', trim: 'Turbo S', yearStart: 2020, category: 'luxury_sedan', horsepower: 750, weightLbs: 5121, topSpeedMph: 161, priceUsd: 190000, drivetrain: 'awd', status: 'approved' },
  { id: 'rolls-royce-ghost', make: 'Rolls-Royce', model: 'Ghost', yearStart: 2021, category: 'luxury_sedan', horsepower: 563, weightLbs: 5628, topSpeedMph: 155, priceUsd: 395000, drivetrain: 'awd', status: 'approved' },
  { id: 'bentley-flying-spur-w12', make: 'Bentley', model: 'Flying Spur', trim: 'W12', yearStart: 2020, yearEnd: 2024, category: 'luxury_sedan', horsepower: 626, weightLbs: 5373, topSpeedMph: 207, priceUsd: 250000, drivetrain: 'awd', status: 'approved' },

  // ------------------------------------------------------------------ muscle
  { id: 'dodge-challenger-hellcat', make: 'Dodge', model: 'Challenger', trim: 'SRT Hellcat', yearStart: 2015, yearEnd: 2023, category: 'muscle', horsepower: 717, weightLbs: 4448, topSpeedMph: 199, priceUsd: 78000, drivetrain: 'rwd', status: 'approved' },
  { id: 'dodge-charger-redeye', make: 'Dodge', model: 'Charger', trim: 'SRT Hellcat Redeye', yearStart: 2021, yearEnd: 2023, category: 'muscle', horsepower: 797, weightLbs: 4586, topSpeedMph: 203, priceUsd: 95000, drivetrain: 'rwd', status: 'approved' },
  { id: 'ford-mustang-gt-s650', make: 'Ford', model: 'Mustang', trim: 'GT', generation: 'S650', yearStart: 2024, category: 'muscle', horsepower: 480, weightLbs: 3800, topSpeedMph: 155, priceUsd: 48000, drivetrain: 'rwd', status: 'approved' },
  { id: 'ford-mustang-gt500', make: 'Ford', model: 'Mustang', trim: 'Shelby GT500', generation: 'S550', yearStart: 2020, yearEnd: 2022, category: 'muscle', horsepower: 760, weightLbs: 4171, topSpeedMph: 180, priceUsd: 105000, drivetrain: 'rwd', status: 'approved' },
  { id: 'chevrolet-camaro-zl1', make: 'Chevrolet', model: 'Camaro', trim: 'ZL1', generation: '6th', yearStart: 2017, yearEnd: 2024, category: 'muscle', horsepower: 650, weightLbs: 3883, topSpeedMph: 198, priceUsd: 72000, drivetrain: 'rwd', status: 'approved' },
  { id: 'chevrolet-chevelle-ss454', make: 'Chevrolet', model: 'Chevelle', trim: 'SS 454 LS6', yearStart: 1970, yearEnd: 1970, category: 'muscle', horsepower: 450, weightLbs: 3900, topSpeedMph: 125, priceUsd: 165000, drivetrain: 'rwd', status: 'approved' },
  { id: 'ford-mustang-boss-429', make: 'Ford', model: 'Mustang', trim: 'Boss 429', yearStart: 1969, yearEnd: 1970, category: 'muscle', horsepower: 375, weightLbs: 3870, topSpeedMph: 118, priceUsd: 420000, drivetrain: 'rwd', status: 'approved' },
  { id: 'pontiac-trans-am-ws6', make: 'Pontiac', model: 'Firebird Trans Am', trim: 'WS6', yearStart: 1998, yearEnd: 2002, category: 'muscle', horsepower: 325, weightLbs: 3500, topSpeedMph: 160, priceUsd: 42000, drivetrain: 'rwd', status: 'approved' },
]

const BY_ID = new Map(CATALOG.map((c) => [c.id, c]))

export function catalogCar(id: string): CatalogCar | undefined {
  return BY_ID.get(id)
}

export function carName(car: CatalogCar): string {
  return [car.make, car.model, car.trim].filter(Boolean).join(' ')
}

/** Starter cars offered during onboarding, per the design plan. */
export const STARTER_CAR_IDS = ['toyota-gr-supra', 'ford-mustang-gt-s650', 'bmw-m3-g80']
