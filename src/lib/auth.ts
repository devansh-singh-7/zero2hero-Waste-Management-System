import { cookies } from 'next/headers';
import { db } from '@/lib/db';
import { Users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { verifyToken } from '@/lib/customAuth';

export async function auth() {
  const cookieStore = cookies();
  const token = cookieStore.get('auth_token')?.value;
  
  if (!token) {
    return null;
  }

  try {
    const payload = verifyToken(token);
    if (!payload || !payload.id) {
      return null;
    }

    const users = await db
      .select({
        id: Users.id,
        email: Users.email,
        name: Users.name,
      })
      .from(Users)
      .where(eq(Users.id, payload.id))
      .limit(1);

    const user = users[0];
    if (!user) {
      return null;
    }

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name || undefined
      }
    };
  } catch (error) {
    console.error('Auth error:', error);
    return null;
  }
}

export async function getUserFromSession() {
  const cookieStore = cookies();
  const token = cookieStore.get('auth_token')?.value;
  
  if (!token) {
    return null;
  }

  try {
    const payload = verifyToken(token);
    if (!payload || !payload.id) {
      return null;
    }

    const users = await db
      .select({
        id: Users.id,
        email: Users.email,
        name: Users.name,
      })
      .from(Users)
      .where(eq(Users.id, payload.id))
      .limit(1);

    return users[0] || null;
  } catch (error) {
    console.error('Auth error:', error);
    return null;
  }
}
