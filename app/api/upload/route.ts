import { NextRequest, NextResponse } from 'next/server';
import { v2 as cloudinary } from 'cloudinary';
import { getSession } from '@/lib/auth';

// Config
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Security Constraints
const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB limit
const ALLOWED_MIME_TYPES = new Set([
    'image/jpeg',
    'image/png',
    'image/webp',
    'application/pdf',
]);
const ALLOWED_EXTENSIONS = new Set(['.jpg', '.jpeg', '.png', '.webp', '.pdf']);

export async function POST(request: NextRequest) {
    try {
        // 1. Enforce Authentication (Defense-in-depth)
        const session = await getSession();
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized. Please sign in.' }, { status: 401 });
        }

        const formData = await request.formData();
        const file = formData.get('file') as File;
        const rawFilename = (formData.get('filename') as string || file?.name || '').trim();
        const folderType = formData.get('folderType') as string || 'photo';

        if (!file) {
            return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
        }

        // 2. Validate File Size
        if (file.size > MAX_FILE_SIZE_BYTES) {
            return NextResponse.json({ 
                error: `File size exceeds the 10MB limit. Current size: ${(file.size / (1024 * 1024)).toFixed(2)}MB` 
            }, { status: 400 });
        }

        // 3. Validate MIME Type and Extension
        const mimeType = (file.type || '').toLowerCase();
        const extMatch = (file.name || '').match(/\.[^.]+$/);
        const extension = extMatch ? extMatch[0].toLowerCase() : '';

        if (!ALLOWED_MIME_TYPES.has(mimeType) || !ALLOWED_EXTENSIONS.has(extension)) {
            return NextResponse.json({ 
                error: 'Invalid file format. Only JPEG, PNG, WebP images and PDF documents are allowed.' 
            }, { status: 400 });
        }

        // 4. Sanitize Filename (prevent directory traversal)
        const safeFilename = rawFilename.replace(/[^a-zA-Z0-9._-]/g, '_');

        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        // Determine Folder
        let folder = 'passports/photos';
        if (folderType === 'copy') folder = 'passports/copies';
        else if (folderType === 'adhar') folder = 'passports/adhar';
        else if (folderType === 'pancard') folder = 'passports/pancard';
        else if (folderType === 'passbook') folder = 'passports/passbook';
        else if (folderType === 'medical') folder = 'passports/medical';

        const isPdf = extension === '.pdf' || mimeType === 'application/pdf';
        const publicId = isPdf ? safeFilename : safeFilename.replace(/\.[^/.]+$/, "");

        const result: any = await new Promise((resolve, reject) => {
            const uploadStream = cloudinary.uploader.upload_stream(
                {
                    folder: folder,
                    public_id: publicId,
                    resource_type: 'auto',
                    overwrite: true,
                },
                (error, result) => {
                    if (error) reject(error);
                    else resolve(result);
                }
            );
            uploadStream.end(buffer);
        });

        return NextResponse.json({
            success: true,
            fileId: result.public_id,
            webViewLink: result.secure_url,
        });

    } catch (error: any) {
        console.error('Upload Error:', error);
        return NextResponse.json({ error: error.message || 'Upload failed' }, { status: 500 });
    }
}

export async function DELETE(request: NextRequest) {
    try {
        // Enforce Authentication
        const session = await getSession();
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized. Please sign in.' }, { status: 401 });
        }

        const body = await request.json();
        const { url, publicId } = body;

        if (!url && !publicId) {
            return NextResponse.json({ error: 'URL or Public ID is required' }, { status: 400 });
        }

        let idToDelete = publicId;

        if (!idToDelete && url) {
            const regex = /\/upload\/(?:v\d+\/)?(.+)$/;
            const match = url.match(regex);

            if (match && match[1]) {
                const captured = match[1];
                if (captured.toLowerCase().endsWith('.pdf')) {
                    idToDelete = captured;
                } else {
                    idToDelete = captured.replace(/\.[^/.]+$/, "");
                }
            } else {
                return NextResponse.json({ error: 'Invalid Cloudinary URL' }, { status: 400 });
            }
        }

        const result = await cloudinary.uploader.destroy(idToDelete);

        return NextResponse.json({ success: true, result });
    } catch (error: any) {
        console.error('Delete Error:', error);
        return NextResponse.json({ error: error.message || 'Delete failed' }, { status: 500 });
    }
}
