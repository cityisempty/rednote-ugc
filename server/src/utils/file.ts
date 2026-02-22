// server/src/utils/file.ts
import fs from 'fs';
import path from 'path';
import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';

const UPLOADS_DIR = path.join(__dirname, '../../uploads');

// Ensure uploads directory exists
if (!fs.existsSync(UPLOADS_DIR)) {
    fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

/**
 * Saves an image from a URL or base64 string to the local uploads directory
 * Returns the public URL of the saved image
 */
export async function saveImageLocally(imageData: string): Promise<string> {
    const filename = `${uuidv4()}.png`;
    const filePath = path.join(UPLOADS_DIR, filename);

    if (imageData.startsWith('data:image')) {
        // Handle base64
        const base64Data = imageData.split(';base64,').pop();
        if (!base64Data) throw new Error('Invalid base64 data');
        fs.writeFileSync(filePath, base64Data, { encoding: 'base64' });
    } else if (imageData.startsWith('http')) {
        // Handle URL
        const response = await axios.get(imageData, { responseType: 'arraybuffer', timeout: 30000 });
        fs.writeFileSync(filePath, Buffer.from(response.data));
    } else {
        throw new Error('Invalid image data format');
    }

    // Return the relative URL that can be reached via express.static
    // The client will combine this with the backend base URL
    return `/uploads/${filename}`;
}
