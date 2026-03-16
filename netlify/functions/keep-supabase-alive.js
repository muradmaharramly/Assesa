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

    // To ensure Supabase counts this as "activity", we perform a real (but tiny) query.
    // Querying one record from 'categories' forces a real SQL execution.
    const response = await fetch(`${supabaseUrl}/rest/v1/categories?select=id&limit=1`, {
      method: 'GET',
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`
      }
    });

    if (response.ok) {
      console.log(`Successfully queried Supabase: Status ${response.status}`);
      return new Response('Supabase Activity Generated', { status: 200 });
    } else {
      const errorText = await response.text();
      console.error(`Supabase activity failed: ${response.status} - ${errorText}`);
      return new Response('Supabase Query Failed', { status: response.status });
    }
  } catch (error) {
    console.error('Error during Supabase keep-alive request:', error.message);
    return new Response('Internal Server Error', { status: 500 });
  }
};

// Netlify configuration for the scheduled function
export const config = {
  // Every 6 hours (00:00, 06:00, 12:00, 18:00)
  schedule: "0 */6 * * *"
};
