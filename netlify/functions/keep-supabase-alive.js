/**
 * Netlify Scheduled Function to keep Supabase project active.
 * This function runs every 6 hours to prevent the Supabase Free plan from pausing.
 */

export default async (req, context) => {
  // Use environment variables for Supabase connection
  // These should be set in the Netlify Dashboard
  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase environment variables');
    return new Response('Configuration Error', { status: 500 });
  }

  try {
    console.log('Sending keep-alive request to Supabase...');

    // Sending a lightweight REST request to the Supabase PostgREST endpoint
    // This is equivalent to "SELECT 1" but via a simple HTTP GET
    // We target a common system table or just a health check if available
    // Here we just hit the root API which returns the OpenAPI spec (minimal activity)
    const response = await fetch(`${supabaseUrl}/rest/v1/`, {
      method: 'GET',
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`
      }
    });

    if (response.ok) {
      console.log(`Successfully pinged Supabase: Status ${response.status}`);
      return new Response('Supabase Keep-Alive Success', { status: 200 });
    } else {
      const errorText = await response.text();
      console.error(`Supabase ping failed: ${response.status} - ${errorText}`);
      return new Response('Supabase Ping Failed', { status: response.status });
    }
  } catch (error) {
    console.error('Error during Supabase keep-alive request:', error.message);
    return new Response('Internal Server Error', { status: 500 });
  }
};

// Netlify configuration for the scheduled function
export const config = {
  // Every day at 00:00
  schedule: "0 0 * * *"
};
