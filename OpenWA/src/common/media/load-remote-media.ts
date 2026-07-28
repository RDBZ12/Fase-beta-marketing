export interface RemoteMediaResult {
  data: Buffer;
  mimetype: string;
  filename?: string;
}

/**
 * Downloads a remote media file from a URL.
 */
export async function loadRemoteMediaBuffer(
  url: string,
  defaultMimetype: string = 'application/octet-stream'
): Promise<RemoteMediaResult> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch media from URL: ${response.statusText}`);
  }
  
  const arrayBuffer = await response.arrayBuffer();
  const data = Buffer.from(arrayBuffer);
  
  let mimetype = response.headers.get('content-type') || defaultMimetype;
  mimetype = mimetype.split(';')[0].trim();

  let filename: string | undefined;
  try {
    const parsedUrl = new URL(url);
    const pathParts = parsedUrl.pathname.split('/');
    const lastPart = pathParts[pathParts.length - 1];
    if (lastPart && lastPart.includes('.')) {
      filename = lastPart;
    }
  } catch (e) {
    // Ignore URL parse errors
  }

  return { data, mimetype, filename };
}
