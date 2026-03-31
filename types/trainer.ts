/** Subset of Trainer used for list/card views (matches the columns fetched by getTrainers). */
export type TrainerListItem = {
  id: number
  user_id: string | null
  name: string
  avatar_url: string | null
  specialty: string
  rating: number
  reviews: number
  price: number
  location: string
  distance: string
  specializations: string[]
}

export type TrainerReview = {
  id: number
  name: string
  rating: number
  date: string
  comment: string
}

export type Trainer = {
  id: number
  user_id: string | null
  name: string
  avatar_url: string | null
  specialty: string
  specializations: string[]
  certifications: string[]
  rating: number
  reviews: number
  price: number
  location: string
  distance: string
  bio: string
  experience: string
  clients_helped: number
  availability: Record<string, string[]>
  reviews_list: TrainerReview[]
}

export type TrainerApplication = {
  id: string
  user_id: string
  name: string
  email: string
  phone: string | null
  location: string | null
  specializations: string[]
  certifications: string[]
  experience: string | null
  hourly_rate: number | null
  bio: string | null
  status: "pending" | "approved" | "rejected"
  created_at: string | null
}
