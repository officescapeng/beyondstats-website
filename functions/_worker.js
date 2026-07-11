export async function onRequest(context) {
  const url = new URL(context.request.url);
  const response = await context.env.ASSETS.fetch(context.request);
  if (response.status === 404) {
    return context.env.ASSETS.fetch(new URL("/index.html", url));
  }
  return response;
}
