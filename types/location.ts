export type GymLocation = {
  id: string
  name: string
  address: string
  city: string
  province: string
  country: string
  latitude: number
  longitude: number
}

export type TrainerLocation = {
  trainer_id: string
  gym_location_id: string
  is_primary: boolean
  latitude: number
  longitude: number
}

export type TrainerLocationWithGym = {
  trainer_id: string
  gym_location_id: string
  is_primary: boolean
  gym_location: GymLocation
}

export type TrainerMapEntry = {
  trainer_id: string // UUID
  trainer_internal_id: number
  gym_location_id: string
  trainer_name: string
  avatar: string | null
  specialties: string[]
  price_per_session: number
  city: string
  latitude: number
  longitude: number
}
