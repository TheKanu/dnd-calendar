const config = {
  API_BASE_URL: process.env.NODE_ENV === 'production' 
    ? 'https://cal.catto.at' 
    : 'http://localhost:3002',
  
  SOCKET_URL: process.env.NODE_ENV === 'production'
    ? 'https://cal.catto.at'
    : 'http://localhost:3002'
};

export default config;