import axios from 'axios';

const API_URL = 'http://localhost:5001/api/auth';

// Test data
const testUser = {
  username: 'testuser',
  email: 'test@example.com',
  password: 'password123'
};

const loginData = {
  email: 'test@example.com',
  password: 'password123'
};

async function testAuthEndpoints() {
  try {
    console.log('🧪 Testing Authentication Endpoints...\n');

    // Test 1: Register user
    console.log('1. Testing user registration...');
    try {
      const registerResponse = await axios.post(`${API_URL}/register`, testUser);
      console.log('✅ Registration successful:', registerResponse.data);
    } catch (error) {
      if (error.response?.status === 400 && error.response?.data?.message === 'User already exists') {
        console.log('ℹ️  User already exists (this is expected on subsequent runs)');
      } else {
        console.log('❌ Registration failed:', error.response?.data?.message || error.message);
      }
    }

    // Test 2: Login user
    console.log('\n2. Testing user login...');
    try {
      const loginResponse = await axios.post(`${API_URL}/login`, loginData);
      console.log('✅ Login successful:', loginResponse.data);
    } catch (error) {
      console.log('❌ Login failed:', error.response?.data?.message || error.message);
    }

    // Test 3: Test invalid login
    console.log('\n3. Testing invalid login...');
    try {
      await axios.post(`${API_URL}/login`, {
        email: 'test@example.com',
        password: 'wrongpassword'
      });
      console.log('❌ Invalid login should have failed');
    } catch (error) {
      if (error.response?.status === 401) {
        console.log('✅ Invalid login correctly rejected');
      } else {
        console.log('❌ Unexpected error:', error.response?.data?.message || error.message);
      }
    }

    console.log('\n🎉 Authentication tests completed!');

  } catch (error) {
    console.error('💥 Test setup failed:', error.message);
    console.log('\n🔧 Make sure:');
    console.log('1. MongoDB is running on localhost:27017');
    console.log('2. Backend server is running on port 5001');
    console.log('3. Environment variables are properly set');
  }
}

// Run tests if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  testAuthEndpoints();
}

export default testAuthEndpoints;
