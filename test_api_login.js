
import axios from 'axios';

const email = 'ojidelawrence@gmail.com';
const password = 'Password123!';

async function testApiLogin() {
    console.log('Testing login against Render API...');
    console.log(`Target: https://church-management-api-p709.onrender.com/api/auth/login`);
    console.log(`Creds: ${email} / ${password}`);

    try {
        const resp = await axios.post('https://church-management-api-p709.onrender.com/api/auth/login', {
            email,
            password
        });
        console.log('✅ API Login Success!');
        console.log('Token received:', !!resp.data?.data?.accessToken);
        console.log('User Role:', resp.data?.data?.user?.role);
    } catch (error) {
        console.log('❌ API Login Failed');
        if (error.response) {
            console.log('Status:', error.response.status);
            console.log('Data:', error.response.data);
        } else {
            console.log('Error:', error.message);
        }
    }
}

testApiLogin();
