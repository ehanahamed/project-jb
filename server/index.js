import Fastify from 'fastify';
import multipart from '@fastify/multipart';
import fs from 'fs';
import path from 'path';
import { randomUUID } from 'crypto';
import mime from 'mime-types';

const PORT = parseInt(process.env.PORT ?? "3000")

const fastify = Fastify();
const uploadDir = path.join(process.cwd(), 'uploads');
const logDir = path.join(process.cwd(), 'logs');

await fastify.register(multipart);

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir);
}

fastify.get('/uploads/:filename', async (request, reply) => {
  const { filename } = request.params;
  const filePath = path.join(uploadDir, filename);

  if (!fs.existsSync(filePath)) {
    return reply.code(404).send('File not found');
  }

  const mimeType = mime.lookup(filePath) || 'application/octet-stream';
  reply.type(mimeType);

  return reply.send(fs.createReadStream(filePath));
});

async function logReq(req, filename) {
  const filePath = path.join(logDir, filename);
  let logs = [];
  if (fs.existsSync(filename)) {
    const raw = fs.readFileSync(filePath, 'utf-8');
    logs = JSON.parse(raw);
  }
  logs.push({
    timestamp: Date.now(),
    ip: req.ip,
    headers: req.headers,
  })
  fs.writeFileSync(logFile, JSON.stringify(logs, null, 2));
}

fastify.get("/server/logs/:filename", async (req, reply) => {
  const filename = request.params.filename;
  const filePath = path.join(logDir, filename);
  if (!fs.existsSync(filePath)) {
    return reply.send([]);
  } else {
    return reply.send(
      JSON.parse(fs.readFileSync(filePath, 'utf-8'))
    );
  }
})

fastify.post('/server/upload', async function (req, reply) {
  const data = await req.file();
  var uuid = randomUUID();
  const filePath = path.join(uploadDir, uuid);
  await pump(data.file, fs.createWriteStream(filePath));
  return { url: `/uploads/${ uuid }` };
});

// Needed for piping file stream
import { pipeline } from 'stream';
import { promisify } from 'util';
const pump = promisify(pipeline);

fastify.listen({ port: PORT }, (err, address) => {
  if (err) throw err;
  console.log('Server listening on ' + address);
});
