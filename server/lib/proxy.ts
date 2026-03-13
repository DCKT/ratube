/** Fetch an upstream URL and pipe back with range support. */
export async function proxyStream(
  upstreamUrl: string,
  request: Request,
  contentType: string
): Promise<Response> {
  const headers: Record<string, string> = {};

  // Forward Range header for seeking
  const range = request.headers.get("Range");
  if (range) {
    headers["Range"] = range;
  }

  const upstream = await fetch(upstreamUrl, { headers, redirect: "follow" });

  if (!upstream.ok && upstream.status !== 206) {
    return new Response(`Upstream error: ${upstream.status}`, { status: 502 });
  }

  const responseHeaders: Record<string, string> = {
    "Content-Type": contentType,
    "Accept-Ranges": "bytes",
    "Access-Control-Allow-Origin": "*",
  };

  const contentRange = upstream.headers.get("Content-Range");
  if (contentRange) {
    responseHeaders["Content-Range"] = contentRange;
  }

  const contentLength = upstream.headers.get("Content-Length");
  if (contentLength) {
    responseHeaders["Content-Length"] = contentLength;
  }

  return new Response(upstream.body, {
    status: upstream.status,
    headers: responseHeaders,
  });
}
