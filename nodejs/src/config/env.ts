import { z } from 'zod';

const schema = z.object({
  PORT:                      z.string().default('3000'),
  SUPABASE_URL:              z.string().url(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  GOOGLE_DRIVE_FOLDER_ID:   z.string().optional(),
  GOOGLE_CLIENT_EMAIL:      z.string().optional(),
  GOOGLE_PRIVATE_KEY:       z.string().optional(),
  FRONTEND_URL:             z.string().default('http://localhost:4200'),
})

export const env = schema.parse(process.env);