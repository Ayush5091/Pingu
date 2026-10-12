import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { createAccessToken } from '@/lib/auth';

export async function POST(request: Request) {
    try {
        const { email, password } = await request.json();
        if (!email || !password) {
            return NextResponse.json({ detail: "Email and password required" }, { status: 400 });
        }

        // Extremely basic password check since the DB password column isn't hashed
        const { rows } = await db.query('SELECT id FROM admins WHERE email = $1 AND password = $2', [email, password]);
        if (rows.length === 0) {
            return NextResponse.json({ detail: "Invalid email or password" }, { status: 401 });
        }

        const adminId = rows[0].id;
        const token = createAccessToken({ user_id: adminId, role: 'admin' });

        return NextResponse.json({ access_token: token, token_type: 'bearer' });
    } catch (error) {
        return NextResponse.json({ detail: "Server error" }, { status: 500 });
    }
}
