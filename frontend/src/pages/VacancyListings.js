import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Input } from '../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import axios from 'axios';
import { 
  Building2, MapPin, Bed, Bath, Square, DollarSign, 
  Search, SlidersHorizontal, Home, Calendar, Check,
  Phone, Mail, ArrowRight, Loader2
} from 'lucide-react';

const API_URL = process.env.REACT_APP_BACKEND_URL || 'https://backend-production-0325.up.railway.app';

const VacancyListings = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    minRent: searchParams.get('minRent') || '',
    maxRent: searchParams.get('maxRent') || '',
    bedrooms: searchParams.get('bedrooms') || 'any',
    search: searchParams.get('search') || ''
  });

  useEffect(() => {
    fetchListings();
  }, []);

  const fetchListings = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/public/vacancies`);
      setListings(response.data.listings || []);
    } catch (error) {
      console.error('Failed to fetch listings:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredListings = listings.filter(listing => {
    if (filters.minRent && listing.rent < parseInt(filters.minRent)) return false;
    if (filters.maxRent && listing.rent > parseInt(filters.maxRent)) return false;
    if (filters.bedrooms && filters.bedrooms !== 'any' && listing.bedrooms !== parseInt(filters.bedrooms)) return false;
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      if (!listing.property_name?.toLowerCase().includes(searchLower) &&
          !listing.address?.toLowerCase().includes(searchLower)) return false;
    }
    return true;
  });

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-primary text-primary-foreground">
        <div className="max-w-6xl mx-auto px-4 py-12">
          <Link to="/" className="inline-flex items-center gap-2 text-primary-foreground/80 hover:text-primary-foreground mb-4">
            <Home className="w-4 h-4" />
            Back to MyPropOps
          </Link>
          <h1 className="text-3xl md:text-4xl font-bold mb-2">Available Rentals</h1>
          <p className="text-primary-foreground/80 text-lg">
            Find your next home from our quality-managed properties
          </p>
        </div>
      </header>

      {/* Filters */}
      <div className="border-b bg-card sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex flex-wrap gap-4 items-center">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search by location..."
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                className="pl-10"
              />
            </div>
            <Select value={filters.bedrooms} onValueChange={(v) => setFilters({ ...filters, bedrooms: v })}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Bedrooms" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="any">Any</SelectItem>
                <SelectItem value="0">Studio</SelectItem>
                <SelectItem value="1">1 Bed</SelectItem>
                <SelectItem value="2">2 Beds</SelectItem>
                <SelectItem value="3">3 Beds</SelectItem>
                <SelectItem value="4">4+ Beds</SelectItem>
              </SelectContent>
            </Select>
            <Input
              type="number"
              placeholder="Min $"
              value={filters.minRent}
              onChange={(e) => setFilters({ ...filters, minRent: e.target.value })}
              className="w-[100px]"
            />
            <Input
              type="number"
              placeholder="Max $"
              value={filters.maxRent}
              onChange={(e) => setFilters({ ...filters, maxRent: e.target.value })}
              className="w-[100px]"
            />
            <Button variant="outline" onClick={() => setFilters({ minRent: '', maxRent: '', bedrooms: 'any', search: '' })}>
              Clear
            </Button>
          </div>
        </div>
      </div>

      {/* Listings */}
      <main className="max-w-6xl mx-auto px-4 py-8">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : filteredListings.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Building2 className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Available Units</h3>
              <p className="text-muted-foreground mb-4">
                {listings.length === 0 
                  ? "Check back soon for new listings!"
                  : "Try adjusting your filters to see more results."}
              </p>
              {listings.length > 0 && (
                <Button variant="outline" onClick={() => setFilters({ minRent: '', maxRent: '', bedrooms: 'any', search: '' })}>
                  Clear Filters
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <>
            <p className="text-muted-foreground mb-6">
              {filteredListings.length} available unit{filteredListings.length !== 1 ? 's' : ''}
            </p>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredListings.map((listing) => (
                <Card key={listing.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                  {/* Image placeholder */}
                  <div className="h-48 bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                    <Building2 className="w-16 h-16 text-primary/40" />
                  </div>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="font-semibold text-lg">{listing.unit_name}</h3>
                        <p className="text-sm text-muted-foreground">{listing.property_name}</p>
                      </div>
                      <Badge variant="secondary" className="text-lg font-bold">
                        ${listing.rent?.toLocaleString()}/mo
                      </Badge>
                    </div>
                    
                    <div className="flex items-center gap-1 text-sm text-muted-foreground mb-4">
                      <MapPin className="w-4 h-4" />
                      <span className="truncate">{listing.address}</span>
                    </div>

                    <div className="flex items-center gap-4 text-sm mb-4">
                      <span className="flex items-center gap-1">
                        <Bed className="w-4 h-4" />
                        {listing.bedrooms === 0 ? 'Studio' : `${listing.bedrooms} Bed`}
                      </span>
                      <span className="flex items-center gap-1">
                        <Bath className="w-4 h-4" />
                        {listing.bathrooms} Bath
                      </span>
                      {listing.sqft && (
                        <span className="flex items-center gap-1">
                          <Square className="w-4 h-4" />
                          {listing.sqft} sqft
                        </span>
                      )}
                    </div>

                    {listing.available_date && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
                        <Calendar className="w-4 h-4" />
                        Available {new Date(listing.available_date).toLocaleDateString()}
                      </div>
                    )}

                    {listing.amenities && listing.amenities.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-4">
                        {listing.amenities.slice(0, 3).map((amenity, i) => (
                          <Badge key={i} variant="outline" className="text-xs">
                            {amenity}
                          </Badge>
                        ))}
                        {listing.amenities.length > 3 && (
                          <Badge variant="outline" className="text-xs">
                            +{listing.amenities.length - 3} more
                          </Badge>
                        )}
                      </div>
                    )}

                    <Button asChild className="w-full">
                      <Link to={`/apply?unit=${listing.id}&property=${listing.property_id}`}>
                        Apply Now
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </>
        )}

        {/* Info Section */}
        <Card className="mt-12 bg-muted/30">
          <CardContent className="py-8">
            <div className="grid md:grid-cols-3 gap-8 text-center">
              <div>
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Check className="w-6 h-6 text-primary" />
                </div>
                <h3 className="font-semibold mb-1">Quality Properties</h3>
                <p className="text-sm text-muted-foreground">All listings are professionally managed and well-maintained</p>
              </div>
              <div>
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Phone className="w-6 h-6 text-primary" />
                </div>
                <h3 className="font-semibold mb-1">Responsive Management</h3>
                <p className="text-sm text-muted-foreground">24/7 maintenance support and quick response times</p>
              </div>
              <div>
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Mail className="w-6 h-6 text-primary" />
                </div>
                <h3 className="font-semibold mb-1">Easy Application</h3>
                <p className="text-sm text-muted-foreground">Apply online in minutes with our simple form</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>

      {/* Footer */}
      <footer className="border-t py-8 text-center text-sm text-muted-foreground">
        <p>Powered by <Link to="/" className="text-primary hover:underline">MyPropOps</Link></p>
      </footer>
    </div>
  );
};

export default VacancyListings;
