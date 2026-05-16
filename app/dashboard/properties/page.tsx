'use client'

import { useState } from 'react'
import Link from 'next/link'
import useSWR from 'swr'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Plus, Search, MapPin, Bed, Bath, Maximize } from 'lucide-react'
import { formatCurrency, formatNumber, propertyStatusConfig, propertyTypeLabels } from '@/lib/format'
import { PropertyStatus, PropertyType } from '@/lib/types'
import type { Property, PaginatedResponse } from '@/lib/types'

// Demo data
const demoProperties: Property[] = [
  {
    property_id: 1,
    agent_id: 1,
    title: 'Luxury Marina Apartment',
    description: 'Stunning 3-bedroom apartment with marina views',
    location: 'Dubai Marina, Tower A',
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
    agent: { agent_id: 1, agency_id: 1, first_name: 'Sarah', last_name: 'Johnson', email: 'sarah@proptrack.com', commission_rate: 0.025, is_active: true, created_at: '', updated_at: '' },
  },
  {
    property_id: 2,
    agent_id: 2,
    title: 'Palm Jumeirah Villa',
    description: 'Exclusive 5-bedroom villa on the Palm',
    location: 'Palm Jumeirah, Frond M',
    city: 'Dubai',
    price: 15000000,
    area_sqft: 8500,
    property_type: PropertyType.VILLA,
    status: PropertyStatus.UNDER_NEGOTIATION,
    bedrooms: 5,
    bathrooms: 6,
    listed_at: '2024-01-10',
    created_at: '2024-01-10',
    updated_at: '2024-01-10',
    agent: { agent_id: 2, agency_id: 1, first_name: 'Ahmed', last_name: 'Hassan', email: 'ahmed@proptrack.com', commission_rate: 0.025, is_active: true, created_at: '', updated_at: '' },
  },
  {
    property_id: 3,
    agent_id: 1,
    title: 'Downtown Office Space',
    description: 'Premium office space in DIFC',
    location: 'DIFC, Gate Village',
    city: 'Dubai',
    price: 8500000,
    area_sqft: 4500,
    property_type: PropertyType.OFFICE,
    status: PropertyStatus.AVAILABLE,
    bedrooms: undefined,
    bathrooms: 2,
    listed_at: '2024-01-08',
    created_at: '2024-01-08',
    updated_at: '2024-01-08',
    agent: { agent_id: 1, agency_id: 1, first_name: 'Sarah', last_name: 'Johnson', email: 'sarah@proptrack.com', commission_rate: 0.025, is_active: true, created_at: '', updated_at: '' },
  },
  {
    property_id: 4,
    agent_id: 3,
    title: 'JBR Beachfront Studio',
    description: 'Cozy studio with beach access',
    location: 'JBR, Sadaf Tower',
    city: 'Dubai',
    price: 950000,
    area_sqft: 550,
    property_type: PropertyType.APARTMENT,
    status: PropertyStatus.SOLD,
    bedrooms: 0,
    bathrooms: 1,
    listed_at: '2024-01-05',
    created_at: '2024-01-05',
    updated_at: '2024-01-20',
    agent: { agent_id: 3, agency_id: 1, first_name: 'Maria', last_name: 'Garcia', email: 'maria@proptrack.com', commission_rate: 0.025, is_active: true, created_at: '', updated_at: '' },
  },
  {
    property_id: 5,
    agent_id: 2,
    title: 'Arabian Ranches Townhouse',
    description: 'Family-friendly townhouse with garden',
    location: 'Arabian Ranches 2',
    city: 'Dubai',
    price: 2800000,
    area_sqft: 3200,
    property_type: PropertyType.TOWNHOUSE,
    status: PropertyStatus.AVAILABLE,
    bedrooms: 4,
    bathrooms: 4,
    listed_at: '2024-01-12',
    created_at: '2024-01-12',
    updated_at: '2024-01-12',
    agent: { agent_id: 2, agency_id: 1, first_name: 'Ahmed', last_name: 'Hassan', email: 'ahmed@proptrack.com', commission_rate: 0.025, is_active: true, created_at: '', updated_at: '' },
  },
  {
    property_id: 6,
    agent_id: 1,
    title: 'Business Bay Retail',
    description: 'Ground floor retail space',
    location: 'Business Bay, Bay Square',
    city: 'Dubai',
    price: 4200000,
    area_sqft: 1800,
    property_type: PropertyType.RETAIL,
    status: PropertyStatus.RENTED,
    bedrooms: undefined,
    bathrooms: 1,
    listed_at: '2024-01-03',
    created_at: '2024-01-03',
    updated_at: '2024-01-18',
    agent: { agent_id: 1, agency_id: 1, first_name: 'Sarah', last_name: 'Johnson', email: 'sarah@proptrack.com', commission_rate: 0.025, is_active: true, created_at: '', updated_at: '' },
  },
]

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

export default function PropertiesPage() {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [cityFilter, setCityFilter] = useState<string>('all')

  const { data, isLoading } = useSWR<PaginatedResponse<Property> | Property[]>(
    `${API_URL}/properties`,
    fetcher,
    { fallbackData: demoProperties, revalidateOnFocus: false }
  )

  const properties = Array.isArray(data) ? data : data?.items || demoProperties

  // Apply filters
  const filteredProperties = properties.filter((property) => {
    const matchesSearch = property.title.toLowerCase().includes(search.toLowerCase()) ||
      property.location.toLowerCase().includes(search.toLowerCase())
    const matchesStatus = statusFilter === 'all' || property.status === statusFilter
    const matchesType = typeFilter === 'all' || property.property_type === typeFilter
    const matchesCity = cityFilter === 'all' || property.city.toLowerCase() === cityFilter.toLowerCase()
    return matchesSearch && matchesStatus && matchesType && matchesCity
  })

  const cities = [...new Set(properties.map(p => p.city))]

  return (
    <div className="flex flex-col gap-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Properties</h1>
          <p className="text-muted-foreground">Manage your property listings</p>
        </div>
        <Button asChild>
          <Link href="/dashboard/properties/new">
            <Plus data-icon="inline-start" />
            Add Property
          </Link>
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-4 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search properties..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-40">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            {Object.entries(PropertyStatus).map(([key, value]) => (
              <SelectItem key={value} value={value}>
                {propertyStatusConfig[value].label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-full sm:w-40">
            <SelectValue placeholder="Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            {Object.entries(PropertyType).map(([key, value]) => (
              <SelectItem key={value} value={value}>
                {propertyTypeLabels[value]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={cityFilter} onValueChange={setCityFilter}>
          <SelectTrigger className="w-full sm:w-40">
            <SelectValue placeholder="City" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Cities</SelectItem>
            {cities.map((city) => (
              <SelectItem key={city} value={city.toLowerCase()}>
                {city}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Properties Grid */}
      {isLoading ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i}>
              <Skeleton className="h-48 w-full rounded-t-lg" />
              <CardContent className="p-4">
                <Skeleton className="mb-2 h-5 w-3/4" />
                <Skeleton className="mb-4 h-4 w-1/2" />
                <Skeleton className="h-6 w-24" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filteredProperties.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <p className="mb-2 text-lg font-medium">No properties found</p>
            <p className="text-muted-foreground">Try adjusting your search or filters</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filteredProperties.map((property) => (
            <PropertyCard key={property.property_id} property={property} />
          ))}
        </div>
      )}
    </div>
  )
}

function PropertyCard({ property }: { property: Property }) {
  const statusConfig = propertyStatusConfig[property.status]

  return (
    <Link href={`/dashboard/properties/${property.property_id}`}>
      <Card className="overflow-hidden transition-shadow hover:shadow-md">
        {/* Placeholder image */}
        <div className="relative h-48 bg-muted">
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-4xl text-muted-foreground/30">
              {propertyTypeLabels[property.property_type].charAt(0)}
            </div>
          </div>
          <div className="absolute right-3 top-3">
            <Badge variant={statusConfig.variant}>{statusConfig.label}</Badge>
          </div>
        </div>
        <CardContent className="p-4">
          <h3 className="mb-1 truncate font-semibold">{property.title}</h3>
          <div className="mb-3 flex items-center gap-1 text-sm text-muted-foreground">
            <MapPin className="size-3" />
            <span className="truncate">{property.location}</span>
          </div>
          <div className="mb-3 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
            {property.bedrooms !== undefined && property.bedrooms !== null && (
              <span className="flex items-center gap-1">
                <Bed className="size-3" />
                {property.bedrooms} {property.bedrooms === 1 ? 'Bed' : 'Beds'}
              </span>
            )}
            {property.bathrooms && (
              <span className="flex items-center gap-1">
                <Bath className="size-3" />
                {property.bathrooms} {property.bathrooms === 1 ? 'Bath' : 'Baths'}
              </span>
            )}
            {property.area_sqft && (
              <span className="flex items-center gap-1">
                <Maximize className="size-3" />
                {formatNumber(property.area_sqft)} sqft
              </span>
            )}
          </div>
          <div className="flex items-center justify-between">
            <span className="text-lg font-semibold">{formatCurrency(property.price)}</span>
            <Badge variant="outline">{propertyTypeLabels[property.property_type]}</Badge>
          </div>
          {property.agent && (
            <p className="mt-2 text-xs text-muted-foreground">
              Agent: {property.agent.first_name} {property.agent.last_name}
            </p>
          )}
        </CardContent>
      </Card>
    </Link>
  )
}
