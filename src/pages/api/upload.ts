/* eslint-disable no-underscore-dangle */
import nextConnect from 'next-connect';
import crypto from 'crypto';
import multer from 'multer';
import Translit from 'cyrillic-to-translit-js';
import type { NextApiResponse } from 'next';
import Cors from 'cors';
import { writeFile } from 'fs';
import { promisify } from 'util';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

import { formFieldName } from '../../utils/upload';

const writeFileAsync = promisify(writeFile);

export const config = {
    api: {
        bodyParser: false,
    },
};

const cors = Cors({
    origin: false,
    methods: ['HEAD', 'OPTIONS', 'POST'],
});

const upload = multer({ storage: multer.memoryStorage() });

const route = nextConnect({
    onError(error: Error, _, res: NextApiResponse) {
        res.status(500).json({ error: `Something went wrong: ${error.message}` });
    },
    onNoMatch: (_, res: NextApiResponse) => {
        res.status(400).json({ error: 'We are sorry, but it is impossible' });
    },
}).use(cors);

const saveFileInPublic = async (filename: string, buffer: Buffer, path = `/public/${filename}`) =>
    writeFileAsync(`./${path}`, buffer).then(() => `/${filename}`);

// eslint-disable-next-line @typescript-eslint/no-explicit-any
route.post(upload.array(formFieldName, 10), async (req: any, res: NextApiResponse) => {
    const { folder = 'common', uniqueNames = true } = req.body;

    let s3Client: S3Client | null = null;

    if (process.env.S3_ENDPOINT && process.env.S3_ACCESS_KEY && process.env.S3_SECRET && process.env.S3_BUCKET) {
        s3Client = new S3Client({
            tls: Boolean(Number(process.env.S3_TLS)),
            forcePathStyle: Boolean(Number(process.env.S3_PATH_STYLE)),
            endpoint: process.env.S3_ENDPOINT,
            credentials: {
                accessKeyId: process.env.S3_ACCESS_KEY,
                secretAccessKey: process.env.S3_SECRET,
            },
            region: process.env.S3_REGION,
        });
    }

    const result = await Promise.all(
        req[formFieldName].map(
            async ({ originalname, mimetype, buffer }: { originalname: string; mimetype: string; buffer: Buffer }) => {
                // @ts-ignore Translit is any ¯\_(ツ)_/¯
                let fileName = new Translit({ preset: 'ru' }).transform(originalname, '_');

                if (JSON.parse(uniqueNames)) {
                    const hashSum = crypto.createHash('sha256');
                    hashSum.update(buffer);
                    const hex = hashSum.digest('hex');

                    fileName = `${hex.slice(0, 8)}_${fileName}`;
                }

                if (!s3Client) {
                    return saveFileInPublic(fileName, buffer);
                }

                return Promise.resolve(
                    s3Client.send(
                        new PutObjectCommand({
                            Bucket: process.env.S3_BUCKET,
                            BucketKeyEnabled: false,
                            Key: `${folder}/${fileName}`,
                            Body: buffer,
                            ACL: 'authenticated-read',
                            CacheControl: 'max-age=630720000, public',
                            ContentType: mimetype,
                        }),
                    ),
                ).then(() => `${process.env.PUBLIC_URL}/static/${folder}/${fileName}`);
            },
        ),
    );

    res.status(200).json(result);
});

export default route;
