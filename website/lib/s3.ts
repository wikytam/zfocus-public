const S3_BASE_URL = process.env['NEXT_PUBLIC_S3_BASE_URL'] || 'https://storage.gpems.app/agritrade/zfocus';

export const s3Image = (filename: string): string => `${S3_BASE_URL}/${filename}`;
