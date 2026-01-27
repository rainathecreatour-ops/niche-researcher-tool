export async function onRequestPost({ request, env }) {
  try {
    const { sessionToken } = await request.json();

    if (!sessionToken) {
      return new Response(
        JSON.stringify({ authenticated: false }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ 
        authenticated: true,
        email: 'user@nicheresearcher.com'
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    return new Response(
      JSON.stringify({ authenticated: false, error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
