export async function onRequest() {
  return new Response('Hello from function!', {
    headers: { 'Content-Type': 'text/plain' }
  });
}
