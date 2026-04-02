"use client"

import Link from "next/link"
import { AthleteDashboardShell } from "@/components/dashboard/AthleteDashboardShell"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Star,
  MapPin,
  MessageCircle,
  Calendar,
  Award,
  Clock,
  CheckCircle,
  ArrowLeft,
  Heart,
  Share2,
  Dumbbell
} from "lucide-react"
import type { Trainer } from "@/types/trainer"

const DAYS = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"] as const

export function TrainerProfileView({ trainer }: { trainer: Trainer | null | undefined }) {
  if (!trainer) {
    return (
      <AthleteDashboardShell title="Trainer Profile">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="h-16 flex items-center justify-between border-b border-border mb-8">
            <Link href="/trainers" className="flex items-center gap-2 text-foreground hover:text-primary transition-colors">
              <ArrowLeft className="w-5 h-5" />
              <span className="hidden sm:inline">Back to Trainers</span>
            </Link>
          </div>
          <div className="rounded-lg border border-border bg-card p-6 text-muted-foreground">
            Loading trainer profile...
          </div>
        </div>
      </AthleteDashboardShell>
    )
  }

  return (
    <AthleteDashboardShell title="Trainer Profile">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="h-16 flex items-center justify-between border-b border-border mb-8">
          <Link href="/trainers" className="flex items-center gap-2 text-foreground hover:text-primary transition-colors">
            <ArrowLeft className="w-5 h-5" />
            <span className="hidden sm:inline">Back to Trainers</span>
          </Link>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon">
              <Heart className="w-5 h-5 text-muted-foreground" />
            </Button>
            <Button variant="ghost" size="icon">
              <Share2 className="w-5 h-5 text-muted-foreground" />
            </Button>
          </div>
        </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              <div className="flex flex-col sm:flex-row items-start gap-6">
                <div className="w-32 h-32 rounded-2xl bg-secondary shrink-0" />
                <div className="flex-1">
                  <div className="flex items-start justify-between">
                    <div>
                      <h1 className="text-2xl font-bold text-foreground">{trainer.name}</h1>
                      <p className="text-muted-foreground">{trainer.specialty}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-primary">${trainer.price}</p>
                      <p className="text-sm text-muted-foreground">per session</p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-4 mt-4">
                    <div className="flex items-center gap-1">
                      <Star className="w-5 h-5 text-primary fill-primary" />
                      <span className="font-medium text-foreground">{trainer.rating}</span>
                      <span className="text-muted-foreground">({trainer.reviews} reviews)</span>
                    </div>
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <MapPin className="w-4 h-4" />
                      <span>{trainer.distance}</span>
                    </div>
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <Clock className="w-4 h-4" />
                      <span>{trainer.experience}</span>
                    </div>
                  </div>
                </div>
              </div>

              <Tabs defaultValue="about" className="space-y-6">
                <TabsList className="bg-secondary w-full justify-start">
                  <TabsTrigger value="about" className="data-[state=active]:bg-background">About</TabsTrigger>
                  <TabsTrigger value="reviews" className="data-[state=active]:bg-background">Reviews</TabsTrigger>
                  <TabsTrigger value="availability" className="data-[state=active]:bg-background">Availability</TabsTrigger>
                </TabsList>

                <TabsContent value="about" className="space-y-6">
                  <Card className="bg-card border-border">
                    <CardHeader>
                      <CardTitle className="text-card-foreground">Bio</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-muted-foreground leading-relaxed">{trainer.bio}</p>
                    </CardContent>
                  </Card>

                  <Card className="bg-card border-border">
                    <CardHeader>
                      <CardTitle className="text-card-foreground">Specializations</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-wrap gap-2">
                        {trainer.specializations.map((spec) => (
                          <span key={spec} className="px-3 py-1 rounded-full bg-primary/10 text-primary text-sm">
                            {spec}
                          </span>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-card border-border">
                    <CardHeader>
                      <CardTitle className="text-card-foreground">Certifications</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {trainer.certifications.map((cert) => (
                        <div key={cert} className="flex items-center gap-3">
                          <Award className="w-5 h-5 text-primary" />
                          <span className="text-card-foreground">{cert}</span>
                        </div>
                      ))}
                    </CardContent>
                  </Card>

                  <Card className="bg-card border-border">
                    <CardHeader>
                      <CardTitle className="text-card-foreground">Location</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-start gap-3">
                        <MapPin className="w-5 h-5 text-primary mt-0.5" />
                        <div>
                          <p className="text-card-foreground">{trainer.location}</p>
                          <p className="text-sm text-muted-foreground">{trainer.distance} from you</p>
                        </div>
                      </div>
                      <div className="mt-4 h-48 bg-secondary rounded-lg flex items-center justify-center">
                        <span className="text-muted-foreground">Map Preview</span>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="reviews" className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Star className="w-6 h-6 text-primary fill-primary" />
                      <span className="text-2xl font-bold text-foreground">{trainer.rating}</span>
                      <span className="text-muted-foreground">({trainer.reviews} reviews)</span>
                    </div>
                  </div>

                  {trainer.reviews_list.length === 0 ? (
                    <p className="text-muted-foreground">No reviews yet.</p>
                  ) : (
                    trainer.reviews_list.map((review) => (
                      <Card key={review.id} className="bg-card border-border">
                        <CardContent className="p-6">
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-secondary" />
                              <div>
                                <p className="font-medium text-card-foreground">{review.name}</p>
                                <p className="text-sm text-muted-foreground">{review.date}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-1">
                              {[...Array(review.rating)].map((_, i) => (
                                <Star key={i} className="w-4 h-4 text-primary fill-primary" />
                              ))}
                            </div>
                          </div>
                          <p className="text-muted-foreground">{review.comment}</p>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </TabsContent>

                <TabsContent value="availability" className="space-y-4">
                  <p className="text-muted-foreground">Select a day to see available time slots</p>
                  {DAYS.map((day) => (
                    <Card key={day} className="bg-card border-border">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-3">
                          <h3 className="font-medium text-card-foreground capitalize">{day}</h3>
                          {(!trainer.availability[day] || trainer.availability[day].length === 0) && (
                            <span className="text-sm text-muted-foreground">Not available</span>
                          )}
                        </div>
                        {trainer.availability[day]?.length > 0 && (
                          <div className="flex flex-wrap gap-2">
                            {trainer.availability[day].map((time) => (
                              <button
                                key={time}
                                className="px-3 py-1.5 text-sm rounded-lg border border-border text-muted-foreground hover:border-primary hover:text-primary transition-colors"
                              >
                                {time}
                              </button>
                            ))}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </TabsContent>
              </Tabs>
            </div>

            <div className="lg:col-span-1">
              <div className="sticky top-24">
                <Card className="bg-card border-border">
                  <CardContent className="p-6 space-y-4">
                    <div className="text-center">
                      <p className="text-3xl font-bold text-primary">${trainer.price}</p>
                      <p className="text-muted-foreground">per session (60 min)</p>
                    </div>

                    <div className="space-y-3 py-4 border-y border-border">
                      <div className="flex items-center gap-3 text-sm">
                        <CheckCircle className="w-5 h-5 text-primary" />
                        <span className="text-card-foreground">Free consultation call</span>
                      </div>
                      <div className="flex items-center gap-3 text-sm">
                        <CheckCircle className="w-5 h-5 text-primary" />
                        <span className="text-card-foreground">Personalized training plan</span>
                      </div>
                      <div className="flex items-center gap-3 text-sm">
                        <CheckCircle className="w-5 h-5 text-primary" />
                        <span className="text-card-foreground">Progress tracking</span>
                      </div>
                      <div className="flex items-center gap-3 text-sm">
                        <CheckCircle className="w-5 h-5 text-primary" />
                        <span className="text-card-foreground">Chat support between sessions</span>
                      </div>
                    </div>

                    <Link href={`/booking/${trainer.id}`} className="block">
                      <Button className="w-full bg-primary text-primary-foreground hover:bg-primary/90" size="lg">
                        <Calendar className="w-5 h-5 mr-2" />
                        Book Session
                      </Button>
                    </Link>

                    <Link href={`/messages?new_chat=${trainer.id}&name=${encodeURIComponent(trainer.name)}&avatar=${encodeURIComponent(trainer.avatar_url ?? "")}`} className="block">
                      <Button variant="outline" className="w-full border-border text-foreground hover:bg-secondary" size="lg">
                        <MessageCircle className="w-5 h-5 mr-2" />
                        Message Trainer
                      </Button>
                    </Link>

                    <div className="flex items-center justify-center gap-2 pt-2 text-sm text-muted-foreground">
                      <Dumbbell className="w-4 h-4" />
                      <span>{trainer.clients_helped}+ clients trained</span>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
      </div>
    </AthleteDashboardShell>
  )
}
