import fetch from 'node-fetch';

const testAPI = async () => {
    try {
        console.log('Testing API endpoint: http://localhost:5000/students/stats\n');
        
        const response = await fetch('http://localhost:5000/students/stats');
        const data = await response.json();
        
        console.log('API Response:');
        console.log('='.repeat(60));
        console.log(JSON.stringify(data, null, 2));
        console.log('='.repeat(60));
        
        if (data.inactiveUsers !== undefined) {
            console.log('\n✅ inactiveUsers is in the response!');
        } else {
            console.log('\n❌ inactiveUsers is MISSING from response!');
        }
        
    } catch (error) {
        console.error('❌ Error:', error.message);
    }
};

testAPI();
