'use client'

import { use } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import useSWR from 'swr'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { ArrowLeft, Edit, MapPin, Bed, Bath, Maximize, Calendar, User } from 'lucide-react'
import { formatCurrency, formatNumber, formatDate, propertyStatusConfig, propertyTypeLabels, getFullName } from '@/lib/format'
import { PropertyStatus, PropertyType } from '@/lib/types'
import type { Property } from '@/lib/types'

// Demo property for fallback
const demoProperty: Property = {
  property_id: 1,
  agent_id: 1,
  title: 'Luxury Marina Apartment',
  description: 'Stunning 3-bedroom apartment with breathtaking marina views. This premium property features high-end finishes throughout, floor-to-ceiling windows, a modern open-plan kitchen with top-of-the-line appliances, and a spacious balcony perfect for entertaining. The building offers world-class amenities including a swimming pool, gym, and 24/7 concierge service.',
  location: 'Dubai Marina, Tower A, Unit 2501',
  city: 'Dubai',
  price: 3500000,
  area_sqft: 2200,
  property_type: PropertyType.APARTMENT,
  status: PropertyStatus.AVAILABLE,
  bedrooms: 3,
  bathrooms: 3,
  listed_at: '2024-01-15',
  created_at: '2024-01-15',
  updated_at: '2024-01-15',
  agent: { agent_id: 1, agency_id: 1, first_name: 'Sarah', last_name: 'Johnson', email: 'sarah@proptrack.com', phone: '+971 50 123 4567', commission_rate: 0.025, is_active: true, created_at: '', updated_at: '' },
}

const fetcher = async (url: string) => {
  const token = document.cookie.split('; ').find(row => row.startsWith('access_token='))?.split('=')[1]
  const res = await fetch(url, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  })
  if (!res.ok) throw new Error('Failed to fetch')
  const data = await res.json()
  return data.data || data
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

export default function PropertyDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()

  const { data: property, isLoading, error } = useSWR<Property>(
    `${API_URL}/properties/${id}`,
    fetcher,
    { fallbackData: { ...demoProperty, property_id: parseInt(id) }, revalidateOnFocus: false }
  )

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <p className="mb-4 text-lg font-medium">Property not found</p>
        <Button variant="outline" onClick={() => router.back()}>
          Go Back
        </Button>
      </div>
    )
  }

  const statusConfig = property ? propertyStatusConfig[property.status] : propertyStatusConfig[PropertyStatus.AVAILABLE]

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="size-4" />
          </Button>
          <div>
            {isLoading ? (
              <>
                <Skeleton className="mb-2 h-7 w-64" />
                <Skeleton className="h-4 w-48" />
              </>
            ) : (
              <>
                <h1 className="text-2xl font-semibold tracking-tight">{property?.title}</h1>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <MapPin className="size-4" />
                  <span>{property?.location}, {property?.city}</span>
                </div>
              </>
            )}
          </div>
        </div>
        <div className="flex items-center gap-3">
          {!isLoading && <Badge variant={statusConfig.variant}>{statusConfig.label}</Badge>}
          <Button asChild>
            <Link href={`/dashboard/properties/${id}/edit`}>
              <Edit data-icon="inline-start" />
              Edit Property
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Content */}
        <div className="flex flex-col gap-6 lg:col-span-2">
          {/* Image Placeholder */}
          <Card>
            <CardContent className="p-0">
              <div className="flex h-64 items-center justify-center rounded-lg bg-muted md:h-96">
                {isLoading ? (
                  <Skeleton className="size-full" />
                ) : (
                  <div className="text-6xl text-muted-foreground/30">
                    {property ? propertyTypeLabels[property.property_type].charAt(0) : 'P'}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Description */}
          <Card>
            <CardHeader>
              <CardTitle>Description</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex flex-col gap-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                </div>
              ) : (
                <p className="leading-relaxed text-muted-foreground">
                  {property?.description || 'No description available.'}
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="flex flex-col gap-6">
          {/* Price & Details */}
          <Card>
            <CardHeader>
              <CardTitle>
                {isLoading ? (
                  <Skeleton className="h-8 w-32" />
                ) : (
                  formatCurrency(property?.price || 0)
                )}
              </CardTitle>
              <CardDescription>
                {isLoading ? (
                  <Skeleton className="h-4 w-24" />
                ) : (
                  <Badge variant="outline">{property ? propertyTypeLabels[property.property_type] : ''}</Badge>
                )}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex flex-col gap-3">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <Skeleton key={i} className="h-5 w-full" />
                  ))}
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  {property?.bedrooms !== undefined && property.bedrooms !== null && (
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-2 text-muted-foreground">
                        <Bed className="size-4" />
                        Bedrooms
                      </span>
                      <span className="font-medium">{property.bedrooms}</span>
                    </div>
                  )}
                  {property?.bathrooms && (
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-2 text-muted-foreground">
                        <Bath className="size-4" />
                        Bathrooms
                      </span>
                      <span className="font-medium">{property.bathrooms}</span>
                    </div>
                  )}
                  {property?.area_sqft && (
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-2 text-muted-foreground">
                        <Maximize className="size-4" />
                        Area
                      </span>
                      <span className="font-medium">{formatNumber(property.area_sqft)} sqft</span>
                    </div>
                  )}
                  {property?.listed_at && (
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-2 text-muted-foreground">
                        <Calendar className="size-4" />
                        Listed
                      </span>
                      <span className="font-medium">{formatDate(property.listed_at)}</span>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Agent Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Listing Agent</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex items-center gap-3">
                  <Skeleton className="size-10 rounded-full" />
                  <div>
                    <Skeleton className="mb-1 h-4 w-24" />
                    <Skeleton className="h-3 w-32" />
                  </div>
                </div>
              ) : property?.agent ? (
                <div className="flex items-center gap-3">
                  <div className="flex size-10 items-center justify-center rounded-full bg-secondary">
                    <User className="size-5 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="font-medium">
                      {getFullName(property.agent.first_name, property.agent.last_name)}
                    </p>
                    <p className="text-sm text-muted-foreground">{property.agent.email}</p>
                    {property.agent.phone && (
                      <p className="text-sm text-muted-foreground">{property.agent.phone}</p>
                    )}
                  </div>
                </div>
              ) : (
                <p className="text-muted-foreground">No agent assigned</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
