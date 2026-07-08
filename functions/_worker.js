export async function onRequest(context) {
  const { request, env } = context;
  const response = await env.ASSETS.fetch(request);
  if (response.status === 404) {
    return env.ASSETS.fetch(new URL("/index.html", request.url));
  }
  return response;
}
