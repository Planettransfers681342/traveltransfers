"""
Test suite for Quote Management System
- Tests all Quote API endpoints (POST, GET, PUT, DELETE)
- Tests quote status management (new, responded, converted, closed)
"""

import pytest
import requests
import os
import uuid

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestQuotesAPI:
    """Tests for Quote Management endpoints"""

    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup test data and cleanup tracking"""
        self.created_quote_ids = []
        yield
        # Cleanup: Delete test quotes
        for quote_id in self.created_quote_ids:
            try:
                requests.delete(f"{BASE_URL}/api/quotes/{quote_id}")
            except:
                pass

    def create_test_quote(self, suffix=""):
        """Helper to create a test quote"""
        unique_id = str(uuid.uuid4())[:8]
        quote_data = {
            "trip_type": "one-way",
            "pickup_location": f"TEST_Airport_{unique_id}",
            "dropoff_location": f"TEST_Hotel_{unique_id}",
            "pickup_date": "2026-03-15",
            "pickup_time": "10:00",
            "return_date": None,
            "return_time": None,
            "passengers": 2,
            "luggage": 3,
            "vehicle_preference": "Economy",
            "passenger_name": f"TEST_User_{unique_id}",
            "passenger_email": f"test_{unique_id}@example.com",
            "passenger_phone": "+447123456789",
            "flight_number": "BA123",
            "special_requests": "Child seat required"
        }
        return quote_data

    # ==================== POST /api/quotes ====================
    
    def test_create_quote_success(self):
        """Test creating a new quote - should return 200 with quote data"""
        quote_data = self.create_test_quote()
        
        response = requests.post(f"{BASE_URL}/api/quotes", json=quote_data)
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        # Verify response structure
        assert "id" in data, "Response missing 'id'"
        assert data["passenger_name"] == quote_data["passenger_name"]
        assert data["passenger_email"] == quote_data["passenger_email"]
        assert data["pickup_location"] == quote_data["pickup_location"]
        assert data["dropoff_location"] == quote_data["dropoff_location"]
        assert data["passengers"] == 2
        assert data["luggage"] == 3
        assert data["status"] == "new", "New quote should have status 'new'"
        
        # Track for cleanup
        self.created_quote_ids.append(data["id"])
        print(f"✓ Created quote with ID: {data['id']}")

    def test_create_quote_round_trip(self):
        """Test creating a round-trip quote with return date/time"""
        unique_id = str(uuid.uuid4())[:8]
        quote_data = {
            "trip_type": "round-trip",
            "pickup_location": f"TEST_Airport_{unique_id}",
            "dropoff_location": f"TEST_Hotel_{unique_id}",
            "pickup_date": "2026-03-15",
            "pickup_time": "10:00",
            "return_date": "2026-03-20",
            "return_time": "14:00",
            "passengers": 4,
            "luggage": 5,
            "vehicle_preference": "Group",
            "passenger_name": f"TEST_RoundTrip_{unique_id}",
            "passenger_email": f"roundtrip_{unique_id}@example.com",
            "passenger_phone": "+447987654321",
            "flight_number": "LH456",
            "special_requests": "Need wheelchair accessible vehicle"
        }
        
        response = requests.post(f"{BASE_URL}/api/quotes", json=quote_data)
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert data["trip_type"] == "round-trip"
        assert data["return_date"] == "2026-03-20"
        assert data["return_time"] == "14:00"
        
        self.created_quote_ids.append(data["id"])
        print(f"✓ Created round-trip quote with ID: {data['id']}")

    def test_create_quote_minimal_fields(self):
        """Test creating quote with only required fields"""
        unique_id = str(uuid.uuid4())[:8]
        quote_data = {
            "trip_type": "one-way",
            "pickup_location": f"TEST_MinimalPickup_{unique_id}",
            "dropoff_location": f"TEST_MinimalDropoff_{unique_id}",
            "pickup_date": "2026-04-01",
            "pickup_time": "08:00",
            "passengers": 1,
            "luggage": 1,
            "passenger_name": f"TEST_Minimal_{unique_id}",
            "passenger_email": f"minimal_{unique_id}@test.com",
            "passenger_phone": "+441234567890"
        }
        
        response = requests.post(f"{BASE_URL}/api/quotes", json=quote_data)
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert data["vehicle_preference"] is None
        assert data["flight_number"] is None
        assert data["special_requests"] is None
        
        self.created_quote_ids.append(data["id"])
        print(f"✓ Created minimal quote with ID: {data['id']}")

    # ==================== GET /api/quotes ====================
    
    def test_get_all_quotes(self):
        """Test retrieving all quotes"""
        response = requests.get(f"{BASE_URL}/api/quotes")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert isinstance(data, list), "Response should be a list"
        print(f"✓ Retrieved {len(data)} quotes")

    def test_get_all_quotes_returns_existing_test_quote(self):
        """Test that pre-existing test quote (John Test) is returned"""
        response = requests.get(f"{BASE_URL}/api/quotes")
        
        assert response.status_code == 200
        data = response.json()
        
        # Find the John Test quote mentioned in the context
        john_quote = next((q for q in data if q.get("passenger_name") == "John Test"), None)
        
        if john_quote:
            assert john_quote["passenger_email"] == "john@test.com"
            assert john_quote["passenger_phone"] == "+447123456789"
            print(f"✓ Found pre-existing John Test quote: {john_quote['id'][:8]}...")
        else:
            print("⚠ John Test quote not found - may have been deleted")

    # ==================== GET /api/quotes/{quote_id} ====================
    
    def test_get_single_quote_success(self):
        """Test retrieving a single quote by ID"""
        # First create a quote
        quote_data = self.create_test_quote()
        create_response = requests.post(f"{BASE_URL}/api/quotes", json=quote_data)
        assert create_response.status_code == 200
        quote_id = create_response.json()["id"]
        self.created_quote_ids.append(quote_id)
        
        # Now retrieve it
        response = requests.get(f"{BASE_URL}/api/quotes/{quote_id}")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert data["id"] == quote_id
        assert data["passenger_name"] == quote_data["passenger_name"]
        assert data["passenger_email"] == quote_data["passenger_email"]
        print(f"✓ Retrieved single quote: {quote_id[:8]}...")

    def test_get_single_quote_not_found(self):
        """Test retrieving a non-existent quote returns 404"""
        fake_id = "non-existent-quote-id-12345"
        
        response = requests.get(f"{BASE_URL}/api/quotes/{fake_id}")
        
        assert response.status_code == 404, f"Expected 404, got {response.status_code}"
        print("✓ 404 returned for non-existent quote")

    # ==================== PUT /api/quotes/{quote_id}/status ====================
    
    def test_update_quote_status_to_responded(self):
        """Test updating quote status from 'new' to 'responded'"""
        # Create a quote
        quote_data = self.create_test_quote()
        create_response = requests.post(f"{BASE_URL}/api/quotes", json=quote_data)
        assert create_response.status_code == 200
        quote_id = create_response.json()["id"]
        self.created_quote_ids.append(quote_id)
        
        # Update status
        update_response = requests.put(
            f"{BASE_URL}/api/quotes/{quote_id}/status",
            json={"status": "responded"}
        )
        
        assert update_response.status_code == 200, f"Expected 200, got {update_response.status_code}"
        
        # Verify with GET
        get_response = requests.get(f"{BASE_URL}/api/quotes/{quote_id}")
        assert get_response.json()["status"] == "responded"
        print(f"✓ Updated quote status to 'responded'")

    def test_update_quote_status_to_converted(self):
        """Test updating quote status to 'converted'"""
        # Create a quote
        quote_data = self.create_test_quote()
        create_response = requests.post(f"{BASE_URL}/api/quotes", json=quote_data)
        quote_id = create_response.json()["id"]
        self.created_quote_ids.append(quote_id)
        
        # Update status
        update_response = requests.put(
            f"{BASE_URL}/api/quotes/{quote_id}/status",
            json={"status": "converted"}
        )
        
        assert update_response.status_code == 200
        
        # Verify persistence
        get_response = requests.get(f"{BASE_URL}/api/quotes/{quote_id}")
        assert get_response.json()["status"] == "converted"
        print(f"✓ Updated quote status to 'converted'")

    def test_update_quote_status_to_closed(self):
        """Test updating quote status to 'closed'"""
        # Create a quote
        quote_data = self.create_test_quote()
        create_response = requests.post(f"{BASE_URL}/api/quotes", json=quote_data)
        quote_id = create_response.json()["id"]
        self.created_quote_ids.append(quote_id)
        
        # Update status
        update_response = requests.put(
            f"{BASE_URL}/api/quotes/{quote_id}/status",
            json={"status": "closed"}
        )
        
        assert update_response.status_code == 200
        
        # Verify persistence
        get_response = requests.get(f"{BASE_URL}/api/quotes/{quote_id}")
        assert get_response.json()["status"] == "closed"
        print(f"✓ Updated quote status to 'closed'")

    def test_update_quote_status_with_admin_notes(self):
        """Test updating quote status with admin notes"""
        # Create a quote
        quote_data = self.create_test_quote()
        create_response = requests.post(f"{BASE_URL}/api/quotes", json=quote_data)
        quote_id = create_response.json()["id"]
        self.created_quote_ids.append(quote_id)
        
        admin_note = "Contacted customer, quote sent via email"
        
        # Update status with notes
        update_response = requests.put(
            f"{BASE_URL}/api/quotes/{quote_id}/status",
            json={"status": "responded", "admin_notes": admin_note}
        )
        
        assert update_response.status_code == 200
        
        # Verify notes persisted
        get_response = requests.get(f"{BASE_URL}/api/quotes/{quote_id}")
        data = get_response.json()
        assert data["status"] == "responded"
        assert data["admin_notes"] == admin_note
        print(f"✓ Updated quote status with admin notes")

    def test_update_quote_status_invalid(self):
        """Test updating quote with invalid status returns 400"""
        # Create a quote
        quote_data = self.create_test_quote()
        create_response = requests.post(f"{BASE_URL}/api/quotes", json=quote_data)
        quote_id = create_response.json()["id"]
        self.created_quote_ids.append(quote_id)
        
        # Try invalid status
        update_response = requests.put(
            f"{BASE_URL}/api/quotes/{quote_id}/status",
            json={"status": "invalid_status"}
        )
        
        assert update_response.status_code == 400, f"Expected 400, got {update_response.status_code}"
        print("✓ 400 returned for invalid status")

    def test_update_quote_status_not_found(self):
        """Test updating non-existent quote returns 404"""
        fake_id = "non-existent-quote-id-99999"
        
        update_response = requests.put(
            f"{BASE_URL}/api/quotes/{fake_id}/status",
            json={"status": "responded"}
        )
        
        assert update_response.status_code == 404, f"Expected 404, got {update_response.status_code}"
        print("✓ 404 returned for non-existent quote")

    # ==================== DELETE /api/quotes/{quote_id} ====================
    
    def test_delete_quote_success(self):
        """Test deleting a quote"""
        # Create a quote
        quote_data = self.create_test_quote()
        create_response = requests.post(f"{BASE_URL}/api/quotes", json=quote_data)
        assert create_response.status_code == 200
        quote_id = create_response.json()["id"]
        
        # Delete the quote
        delete_response = requests.delete(f"{BASE_URL}/api/quotes/{quote_id}")
        
        assert delete_response.status_code == 200, f"Expected 200, got {delete_response.status_code}"
        
        # Verify deletion with GET
        get_response = requests.get(f"{BASE_URL}/api/quotes/{quote_id}")
        assert get_response.status_code == 404, "Quote should be deleted"
        print(f"✓ Successfully deleted quote")

    def test_delete_quote_not_found(self):
        """Test deleting non-existent quote returns 404"""
        fake_id = "non-existent-quote-to-delete"
        
        delete_response = requests.delete(f"{BASE_URL}/api/quotes/{fake_id}")
        
        assert delete_response.status_code == 404, f"Expected 404, got {delete_response.status_code}"
        print("✓ 404 returned for non-existent quote delete")

    # ==================== Data Validation Tests ====================
    
    def test_quote_created_at_timestamp(self):
        """Test that created_at timestamp is set correctly"""
        quote_data = self.create_test_quote()
        
        response = requests.post(f"{BASE_URL}/api/quotes", json=quote_data)
        
        assert response.status_code == 200
        data = response.json()
        
        assert "created_at" in data, "Response should include created_at"
        assert data["created_at"] is not None
        # Should be ISO format
        assert "T" in data["created_at"], "created_at should be ISO format"
        
        self.created_quote_ids.append(data["id"])
        print(f"✓ Quote created with timestamp: {data['created_at'][:19]}")


class TestAdminQuotesIntegration:
    """Test admin-related quote functionality"""
    
    def test_admin_login(self):
        """Test admin login with correct password"""
        response = requests.post(
            f"{BASE_URL}/api/admin/login",
            json={"password": "planet2024"}
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        data = response.json()
        assert data["success"] == True
        print("✓ Admin login successful")

    def test_admin_login_invalid_password(self):
        """Test admin login with wrong password"""
        response = requests.post(
            f"{BASE_URL}/api/admin/login",
            json={"password": "wrongpassword"}
        )
        
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        print("✓ Admin login rejected with invalid password")
