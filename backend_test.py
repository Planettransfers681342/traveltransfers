import requests
import sys
from datetime import datetime
import json

class PlanetTransfersAPITester:
    def __init__(self, base_url="https://continue-chat-14.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.tests_run = 0
        self.tests_passed = 0
        self.admin_auth = None
        self.test_booking_id = None

    def run_test(self, name, method, endpoint, expected_status, data=None, headers=None):
        """Run a single API test"""
        url = f"{self.api_url}/{endpoint}"
        test_headers = {'Content-Type': 'application/json'}
        if headers:
            test_headers.update(headers)

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        print(f"   URL: {url}")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=test_headers)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=test_headers)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=test_headers)
            elif method == 'DELETE':
                response = requests.delete(url, headers=test_headers)

            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                try:
                    resp_data = response.json()
                    if isinstance(resp_data, list) and len(resp_data) > 0:
                        print(f"   Response: Found {len(resp_data)} items")
                    elif isinstance(resp_data, dict) and resp_data:
                        print(f"   Response: {list(resp_data.keys())[:5]}")
                    return success, resp_data
                except:
                    return success, {}
            else:
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                try:
                    print(f"   Error: {response.text}")
                except:
                    pass
                return False, {}

        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            return False, {}

    def test_basic_endpoints(self):
        """Test basic API endpoints"""
        print("\n📋 TESTING BASIC ENDPOINTS")
        
        # Test root endpoint
        success, _ = self.run_test(
            "API Root",
            "GET",
            "",
            200
        )
        
        # Test vehicles endpoint
        success, vehicles = self.run_test(
            "Get Vehicles",
            "GET", 
            "vehicles",
            200
        )
        
        if success and vehicles:
            print(f"   Found {len(vehicles)} vehicle types: {[v.get('name') for v in vehicles]}")
        
        return success

    def test_route_prices(self):
        """Test route prices endpoints"""
        print("\n📋 TESTING ROUTE PRICES")
        
        # Seed data first
        self.run_test("Seed Route Data", "POST", "seed", 200)
        
        # Get all route prices
        success, routes = self.run_test(
            "Get Route Prices",
            "GET",
            "routes/prices", 
            200
        )
        
        if success and routes:
            print(f"   Found {len(routes)} routes")
            for route in routes[:3]:  # Show first 3
                print(f"   Route: {route.get('from_location')} → {route.get('to_location')}")
        
        # Test quote endpoint
        success, quote = self.run_test(
            "Get Quote",
            "GET",
            "quote?from_location=London Heathrow&to_location=London City Center&vehicle_type=economy&trip_type=one-way",
            200
        )
        
        if success and quote:
            print(f"   Quote: £{quote.get('price')} for economy vehicle")
        
        return success

    def test_admin_functionality(self):
        """Test admin login and functionality"""
        print("\n📋 TESTING ADMIN FUNCTIONALITY")
        
        # Test admin login
        success, response = self.run_test(
            "Admin Login",
            "POST",
            "admin/login",
            200,
            {"password": "planet2024"}
        )
        
        if success and response.get('success'):
            self.admin_auth = True
            print("   Admin authenticated successfully")
        
        # Test admin stats
        success, stats = self.run_test(
            "Admin Stats",
            "GET", 
            "admin/stats",
            200
        )
        
        if success and stats:
            print(f"   Stats: {stats.get('total_bookings')} bookings, £{stats.get('total_revenue')} revenue")
        
        return success

    def test_booking_flow(self):
        """Test complete booking flow"""
        print("\n📋 TESTING BOOKING FLOW")
        
        # Create a test booking
        booking_data = {
            "trip_type": "one-way",
            "pickup_location": "London Heathrow", 
            "dropoff_location": "London City Center",
            "pickup_date": "2025-01-15",
            "pickup_time": "14:30",
            "passengers": 2,
            "luggage": 2,
            "vehicle_type": "economy",
            "passenger_name": "John Test",
            "passenger_email": "john.test@example.com",
            "passenger_phone": "+44 7123 456789"
        }
        
        success, booking = self.run_test(
            "Create Booking",
            "POST",
            "bookings", 
            200,
            booking_data
        )
        
        if success and booking:
            self.test_booking_id = booking.get('id')
            print(f"   Booking created with ID: {self.test_booking_id}")
            print(f"   Price: £{booking.get('price')}")
        
        # Get booking by ID
        if self.test_booking_id:
            success, retrieved = self.run_test(
                "Get Booking by ID",
                "GET",
                f"bookings/{self.test_booking_id}",
                200
            )
            
            if success:
                print(f"   Retrieved booking for: {retrieved.get('passenger_name')}")
        
        # Get all bookings
        success, all_bookings = self.run_test(
            "Get All Bookings",
            "GET",
            "bookings",
            200
        )
        
        if success and all_bookings:
            print(f"   Total bookings in system: {len(all_bookings)}")
        
        return success

    def test_checkout_flow(self):
        """Test Stripe checkout flow (without actual payment)"""
        print("\n📋 TESTING CHECKOUT FLOW")
        
        if not self.test_booking_id:
            print("❌ No test booking available for checkout test")
            return False
        
        # Create checkout session
        success, checkout = self.run_test(
            "Create Checkout Session",
            "POST",
            "checkout/create",
            200,
            {
                "booking_id": self.test_booking_id,
                "origin_url": "https://example.com"
            }
        )
        
        if success and checkout:
            print(f"   Checkout session created")
            print(f"   Session ID: {checkout.get('session_id')[:20]}...")
            return True
        
        return success

    def test_route_crud(self):
        """Test route CRUD operations"""
        print("\n📋 TESTING ROUTE CRUD OPERATIONS")
        
        # Create a new route
        route_data = {
            "from_location": "Test Airport",
            "to_location": "Test City Center", 
            "economy_price": 40.0,
            "business_price": 65.0,
            "group_price": 95.0,
            "bus_price": 200.0
        }
        
        success, route = self.run_test(
            "Create Route Price",
            "POST",
            "routes/prices",
            200,
            route_data
        )
        
        route_id = None
        if success and route:
            route_id = route.get('id')
            print(f"   Route created with ID: {route_id}")
        
        # Update the route
        if route_id:
            update_data = route_data.copy()
            update_data['economy_price'] = 45.0
            
            success, updated = self.run_test(
                "Update Route Price", 
                "PUT",
                f"routes/prices/{route_id}",
                200,
                update_data
            )
            
            if success:
                print(f"   Route updated - new economy price: £{updated.get('economy_price')}")
        
        # Delete the test route
        if route_id:
            success, _ = self.run_test(
                "Delete Route Price",
                "DELETE",
                f"routes/prices/{route_id}",
                200
            )
            
            if success:
                print("   Test route deleted successfully")
        
        return success

def main():
    """Main test execution"""
    print("🌍 PLANET TRANSFERS API TESTING")
    print("=" * 50)
    
    tester = PlanetTransfersAPITester()
    
    # Run all tests
    tests = [
        tester.test_basic_endpoints,
        tester.test_route_prices, 
        tester.test_admin_functionality,
        tester.test_booking_flow,
        tester.test_checkout_flow,
        tester.test_route_crud
    ]
    
    overall_success = True
    for test in tests:
        try:
            result = test()
            if not result:
                overall_success = False
        except Exception as e:
            print(f"❌ Test failed with exception: {e}")
            overall_success = False
    
    # Print final results
    print("\n" + "=" * 50)
    print(f"📊 FINAL RESULTS")
    print(f"Tests passed: {tester.tests_passed}/{tester.tests_run}")
    success_rate = (tester.tests_passed / tester.tests_run * 100) if tester.tests_run > 0 else 0
    print(f"Success rate: {success_rate:.1f}%")
    
    if overall_success and success_rate >= 80:
        print("🎉 Backend API testing PASSED!")
        return 0
    else:
        print("❌ Backend API testing FAILED!")
        return 1

if __name__ == "__main__":
    sys.exit(main())