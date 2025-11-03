/**
 * TRONIC Platform - Health Check Function
 * Netlify serverless function for health monitoring
 */

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
};

exports.handler = async (event, context) => {
  // Handle CORS preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: corsHeaders,
      body: '',
    };
  }

  try {
    const healthData = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: Date.now(),
      environment: 'netlify',
      version: '1.0.0',
      platform: 'TRONIC',
      services: {
        supabase: process.env.REACT_SUPABASE_URL ? 'configured' : 'missing',
        gemini: process.env.REACT_GEMINI_API_KEY ? 'configured' : 'missing',
        jwt: process.env.REACT_JWT_SECRET ? 'configured' : 'missing'
      }
    };

    return {
      statusCode: 200,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(healthData),
    };
  } catch (error) {
    console.error('Health check error:', error);
    
    return {
      statusCode: 500,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        status: 'unhealthy',
        error: error.message,
        timestamp: new Date().toISOString(),
      }),
    };
  }
};