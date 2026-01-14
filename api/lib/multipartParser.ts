/**
 * Multipart Form Data Parser
 * Parses multipart/form-data requests in Vercel serverless functions
 */
import type { IncomingMessage } from 'http';

export interface ParsedFile {
  buffer: Buffer;
  filename: string;
  mimeType: string;
  size: number;
}

export interface ParsedFormData {
  files: ParsedFile[];
  fields: Record<string, string>;
}

/**
 * Parse multipart/form-data from an incoming request
 * This is a lightweight implementation for Vercel serverless functions
 */
export async function parseMultipartFormData(
  req: IncomingMessage & { body?: Buffer | string }
): Promise<ParsedFormData> {
  const contentType = req.headers['content-type'] || '';
  
  if (!contentType.includes('multipart/form-data')) {
    throw new Error('Content-Type must be multipart/form-data');
  }
  
  // Extract boundary from content-type header
  const boundaryMatch = contentType.match(/boundary=(?:"([^"]+)"|([^;\s]+))/);
  if (!boundaryMatch) {
    throw new Error('No boundary found in Content-Type header');
  }
  const boundary = boundaryMatch[1] || boundaryMatch[2];
  
  // Get body as Buffer
  let bodyBuffer: Buffer;
  if (Buffer.isBuffer(req.body)) {
    bodyBuffer = req.body;
  } else if (typeof req.body === 'string') {
    bodyBuffer = Buffer.from(req.body, 'binary');
  } else {
    // Read body from stream
    bodyBuffer = await readRequestBody(req);
  }
  
  const files: ParsedFile[] = [];
  const fields: Record<string, string> = {};
  
  // Parse the multipart data
  const boundaryBuffer = Buffer.from(`--${boundary}`);
  const parts = splitBuffer(bodyBuffer, boundaryBuffer);
  
  for (const part of parts) {
    if (part.length === 0) continue;
    
    // Find the double CRLF that separates headers from content
    const headerEndIndex = findDoubleNewline(part);
    if (headerEndIndex === -1) continue;
    
    const headersStr = part.slice(0, headerEndIndex).toString('utf-8');
    const content = part.slice(headerEndIndex + 4); // Skip \r\n\r\n
    
    // Skip the closing boundary marker
    if (content.toString('utf-8').trim() === '--') continue;
    
    // Parse headers
    const contentDisposition = extractHeader(headersStr, 'content-disposition');
    const partContentType = extractHeader(headersStr, 'content-type');
    
    if (!contentDisposition) continue;
    
    const name = extractAttribute(contentDisposition, 'name');
    const filename = extractAttribute(contentDisposition, 'filename');
    
    if (filename && partContentType) {
      // This is a file
      // Remove trailing CRLF if present
      let fileContent = content;
      if (fileContent.length >= 2 && 
          fileContent[fileContent.length - 2] === 0x0d && 
          fileContent[fileContent.length - 1] === 0x0a) {
        fileContent = fileContent.slice(0, -2);
      }
      
      files.push({
        buffer: fileContent,
        filename: filename,
        mimeType: partContentType.trim(),
        size: fileContent.length,
      });
    } else if (name) {
      // This is a field
      let value = content.toString('utf-8');
      // Remove trailing CRLF if present
      if (value.endsWith('\r\n')) {
        value = value.slice(0, -2);
      }
      fields[name] = value;
    }
  }
  
  return { files, fields };
}

/**
 * Read request body as Buffer
 */
async function readRequestBody(req: IncomingMessage): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    
    req.on('data', (chunk: Buffer) => {
      chunks.push(chunk);
    });
    
    req.on('end', () => {
      resolve(Buffer.concat(chunks));
    });
    
    req.on('error', reject);
  });
}

/**
 * Split a buffer by a delimiter
 */
function splitBuffer(buffer: Buffer, delimiter: Buffer): Buffer[] {
  const parts: Buffer[] = [];
  let start = 0;
  
  while (start < buffer.length) {
    const index = buffer.indexOf(delimiter, start);
    if (index === -1) {
      parts.push(buffer.slice(start));
      break;
    }
    
    if (index > start) {
      parts.push(buffer.slice(start, index));
    }
    start = index + delimiter.length;
  }
  
  return parts;
}

/**
 * Find the index of double newline (\r\n\r\n)
 */
function findDoubleNewline(buffer: Buffer): number {
  const pattern = Buffer.from('\r\n\r\n');
  return buffer.indexOf(pattern);
}

/**
 * Extract a header value from headers string
 */
function extractHeader(headers: string, name: string): string | null {
  const regex = new RegExp(`^${name}:\\s*(.+)$`, 'im');
  const match = headers.match(regex);
  return match ? match[1].trim() : null;
}

/**
 * Extract an attribute from a header value (e.g., name="value")
 */
function extractAttribute(header: string, attribute: string): string | null {
  const regex = new RegExp(`${attribute}="([^"]*)"`, 'i');
  const match = header.match(regex);
  return match ? match[1] : null;
}
