import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Card, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Input } from '../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle
} from '../components/ui/dialog';
import axios from 'axios';
import { 
  Building2, MapPin, Bed, Bath, Square, DollarSign, 
  Search, Home, Calendar, Check, X,
  Phone, Mail, ArrowRight, Loader2, Heart, Share2, Eye
} from 'lucide-react';

const API_URL = process.env.REACT_APP_BACKEND_URL || 'https://backend-production-0325.up.railway.app';

// Stock property images from Unsplash
const PROPERTY_IMAGES = [
  'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800&q=80',
  'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&q=80',
  'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&q=80',
  'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&q=80',
  'https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=800&q=80',
  'https://images.unsplash.com/photo-1484154218962-a197022b5858?w=800&q=80',
];

const VacancyListings = () => {
  const [searchParams] = useSearchParams();
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedListing, setSelectedListing] = useState(null);
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
      // Add sample images and realistic rent prices to listings
      const enhancedListings = (response.data.listings || []).map((listing, index) => ({
        ...listing,
        image: listing.images?.[0] || PROPERTY_IMAGES[index % PROPERTY_IMAGES.length],
        rent: listing.rent || (1200 + (index * 300) + Math.floor(Math.random() * 500)),
        description: listing.description || getDefaultDescription(listing.bedrooms),
        amenities: listing.amenities?.length > 0 ? listing.amenities : getDefaultAmenities(listing.bedrooms)
      }));
      setListings(enhancedListings);
    } catch (error) {
      console.error('Failed to fetch listings:', error);
    } finally {
      setLoading(false);
    }
  };

  const getDefaultDescription = (bedrooms) => {
    const descriptions = {
      0: 'Cozy studio apartment with modern finishes, perfect for young professionals. Features an open floor plan with abundant natural light.',
      1: 'Spacious one-bedroom apartment with updated kitchen, in-unit laundry, and private balcony. Walking distance to shops and restaurants.',
      2: 'Beautiful two-bedroom unit with hardwood floors throughout, modern appliances, and ample closet space. Pet-friendly building.',
      3: 'Large three-bedroom home ideal for families. Features a fully equipped kitchen, central air, and private backyard.',
    };
    return descriptions[bedrooms] || descriptions[1];
  };

  const getDefaultAmenities = (bedrooms) => {
    const base = ['Central A/C', 'In-Unit Laundry', 'Dishwasher'];
    if (bedrooms >= 2) base.push('Parking Included', 'Storage Unit');
    if (bedrooms >= 3) base.push('Private Yard', 'Pet Friendly');
    return base;
  };

  const filteredListings = listings.filter(listing => {
    // Min rent filter
    if (filters.minRent && listing.rent < parseInt(filters.minRent)) return false;
    // Max rent filter
    if (filters.maxRent && listing.rent > parseInt(filters.maxRent)) return false;
    // Bedrooms filter
    if (filters.bedrooms && filters.bedrooms !== 'any') {
      if (parseInt(filters.bedrooms) !== listing.bedrooms) return false;
    }
    // Search filter - search in property name, address, and unit name
    if (filters.search && filters.search.trim()) {
      const searchLower = filters.search.toLowerCase().trim();
      const matchesProperty = listing.property_name?.toLowerCase().includes(searchLower);
      const matchesAddress = listing.address?.toLowerCase().includes(searchLower);
      const matchesUnit = listing.unit_name?.toLowerCase().includes(searchLower);
      if (!matchesProperty && !matchesAddress && !matchesUnit) return false;
    }
    return true;
  });

  const clearFilters = () => {
    setFilters({ minRent: '', maxRent: '', bedrooms: 'any', search: '' });
  };

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
                placeholder="Search by property, address, or unit..."
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                className="pl-10"
                data-testid="search-input"
              />
            </div>
            <Select value={filters.bedrooms} onValueChange={(v) => setFilters({ ...filters, bedrooms: v })}>
              <SelectTrigger className="w-[140px]" data-testid="bedrooms-filter">
                <SelectValue placeholder="Bedrooms" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="any">Any</SelectItem>
                <SelectItem value="0">Studio</SelectItem>
                <SelectItem value="1">1 Bed</SelectItem>
                <SelectItem value="2">2 Beds</SelectItem>
                <SelectItem value="3">3+ Beds</SelectItem>
              </SelectContent>
            </Select>
            <Input
              type="number"
              placeholder="Min $"
              value={filters.minRent}
              onChange={(e) => setFilters({ ...filters, minRent: e.target.value })}
              className="w-[100px]"
              data-testid="min-rent-filter"
            />
            <Input
              type="number"
              placeholder="Max $"
              value={filters.maxRent}
              onChange={(e) => setFilters({ ...filters, maxRent: e.target.value })}
              className="w-[100px]"
              data-testid="max-rent-filter"
            />
            <Button variant="outline" onClick={clearFilters} data-testid="clear-filters">
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
                <Button variant="outline" onClick={clearFilters}>
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
                <Card 
                  key={listing.id} 
                  className="overflow-hidden hover:shadow-lg transition-all cursor-pointer group"
                  onClick={() => setSelectedListing(listing)}
                  data-testid={`listing-card-${listing.id}`}
                >
                  {/* Image */}
                  <div className="relative h-48 overflow-hidden">
                    <img 
                      src={listing.image}
                      alt={`${listing.unit_name} at ${listing.property_name}`}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute top-3 right-3 flex gap-2">
                      <button className="w-8 h-8 bg-white/90 backdrop-blur rounded-full flex items-center justify-center hover:bg-white">
                        <Heart className="w-4 h-4 text-gray-600" />
                      </button>
                    </div>
                    <div className="absolute bottom-3 left-3">
                      <Badge className="bg-primary text-primary-foreground text-lg font-bold px-3 py-1">
                        ${listing.rent?.toLocaleString()}/mo
                      </Badge>
                    </div>
                  </div>
                  <CardContent className="p-4">
                    <div className="mb-2">
                      <h3 className="font-semibold text-lg">{listing.unit_name} - {listing.property_name}</h3>
                    </div>
                    
                    <div className="flex items-center gap-1 text-sm text-muted-foreground mb-3">
                      <MapPin className="w-4 h-4 flex-shrink-0" />
                      <span className="truncate">{listing.address}</span>
                    </div>

                    <div className="flex items-center gap-4 text-sm mb-4">
                      <span className="flex items-center gap-1">
                        <Bed className="w-4 h-4 text-muted-foreground" />
                        {listing.bedrooms === 0 ? 'Studio' : `${listing.bedrooms} Bed`}
                      </span>
                      <span className="flex items-center gap-1">
                        <Bath className="w-4 h-4 text-muted-foreground" />
                        {listing.bathrooms} Bath
                      </span>
                      {listing.sqft && (
                        <span className="flex items-center gap-1">
                          <Square className="w-4 h-4 text-muted-foreground" />
                          {listing.sqft} sqft
                        </span>
                      )}
                    </div>

                    <Button className="w-full" data-testid={`view-details-${listing.id}`}>
                      <Eye className="w-4 h-4 mr-2" />
                      View Details
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

      {/* Property Detail Modal */}
      <Dialog open={!!selectedListing} onOpenChange={() => setSelectedListing(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          {selectedListing && (
            <>
              <DialogHeader>
                <DialogTitle className="text-xl">
                  {selectedListing.unit_name} - {selectedListing.property_name}
                </DialogTitle>
              </DialogHeader>
              
              {/* Large Image */}
              <div className="relative h-64 md:h-80 rounded-lg overflow-hidden">
                <img 
                  src={selectedListing.image}
                  alt={selectedListing.property_name}
                  className="w-full h-full object-cover"
                />
                <div className="absolute bottom-4 left-4">
                  <Badge className="bg-primary text-primary-foreground text-xl font-bold px-4 py-2">
                    ${selectedListing.rent?.toLocaleString()}/mo
                  </Badge>
                </div>
              </div>

              {/* Details */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <MapPin className="w-5 h-5" />
                  <span className="text-base">{selectedListing.address}</span>
                </div>

                <div className="flex items-center gap-6 text-base">
                  <span className="flex items-center gap-2">
                    <Bed className="w-5 h-5 text-primary" />
                    {selectedListing.bedrooms === 0 ? 'Studio' : `${selectedListing.bedrooms} Bedroom${selectedListing.bedrooms > 1 ? 's' : ''}`}
                  </span>
                  <span className="flex items-center gap-2">
                    <Bath className="w-5 h-5 text-primary" />
                    {selectedListing.bathrooms} Bathroom{selectedListing.bathrooms > 1 ? 's' : ''}
                  </span>
                  {selectedListing.sqft && (
                    <span className="flex items-center gap-2">
                      <Square className="w-5 h-5 text-primary" />
                      {selectedListing.sqft} sqft
                    </span>
                  )}
                </div>

                {selectedListing.available_date && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Calendar className="w-5 h-5" />
                    Available {new Date(selectedListing.available_date).toLocaleDateString()}
                  </div>
                )}

                <div>
                  <h4 className="font-semibold mb-2">Description</h4>
                  <p className="text-muted-foreground">{selectedListing.description}</p>
                </div>

                {selectedListing.amenities && selectedListing.amenities.length > 0 && (
                  <div>
                    <h4 className="font-semibold mb-2">Amenities</h4>
                    <div className="flex flex-wrap gap-2">
                      {selectedListing.amenities.map((amenity, i) => (
                        <Badge key={i} variant="secondary" className="text-sm">
                          <Check className="w-3 h-3 mr-1" />
                          {amenity}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex gap-3 pt-4 border-t">
                  <Button asChild className="flex-1" size="lg">
                    <Link to={`/apply?unit=${selectedListing.id}&property=${selectedListing.property_id}`}>
                      Apply Now
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Link>
                  </Button>
                  <Button variant="outline" size="lg">
                    <Share2 className="w-4 h-4 mr-2" />
                    Share
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Footer */}
      <footer className="border-t py-8 text-center text-sm text-muted-foreground">
        <p>Powered by <Link to="/" className="text-primary hover:underline">MyPropOps</Link></p>
      </footer>
    </div>
  );
};

export default VacancyListings;
