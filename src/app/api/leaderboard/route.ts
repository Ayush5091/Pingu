import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { getAuthErrorStatus, requireAuth } from '@/lib/auth';

// Batch leaderboard: students who share the same admission year (from the USN),
// ranked by activity points. Only first name + last initial is exposed.
function displayName(name: string) {
    const parts = (name || 'Student').trim().split(/\s+/);
    return parts.length > 1 ? `${parts[0]} ${parts[parts.length - 1][0]}.` : parts[0];
}

export async function GET(request: Request) {
    try {
        const user = requireAuth(request, 'student');
        const { searchParams } = new URL(request.url);
        const scope = searchParams.get('scope') === 'department' ? 'department' : 'batch';

        const me = await db.query(`SELECT id, usn, department FROM students WHERE id = $1`, [user.user_id]);
        const student = me.rows[0];
        if (!student) {
            return NextResponse.json({ detail: 'Student not found' }, { status: 404 });
        }

        const batch = String(student.usn || '').match(/\d{2}/)?.[0] ?? null;
        const params: any[] = [];
        let where = '1=1';
        if (scope === 'batch' && batch) {
            // Same rule as calculateSemester: the first two digits of the USN are the admission year.
            params.push(batch);
            where = `SUBSTRING(usn FROM '[0-9]{2}') = $1`;
        } else if (scope === 'department' && student.department) {
            params.push(student.department);
            where = `department = $1`;
        }

        const { rows } = await db.query(
            `SELECT id, name, department, COALESCE(total_points, 0) AS total_points,
                    RANK() OVER (ORDER BY COALESCE(total_points, 0) DESC) AS rank
             FROM students
             WHERE ${where}
             ORDER BY total_points DESC NULLS LAST, name ASC`,
            params
        );

        const entries = rows.map((r) => ({
            rank: Number(r.rank),
            name: displayName(r.name),
            department: r.department,
            points: Number(r.total_points),
            isMe: String(r.id) === String(student.id),
        }));

        const top = entries.slice(0, 30);
        const meEntry = entries.find((e) => e.isMe) ?? null;
        if (meEntry && !top.some((e) => e.isMe)) top.push(meEntry);

        return NextResponse.json({ scope, batch: batch ? `20${batch}` : null, total: entries.length, entries: top, me: meEntry });
    } catch (err: any) {
        const authStatus = getAuthErrorStatus(err);
        return NextResponse.json({ detail: err?.message || 'Error' }, { status: authStatus ?? 500 });
    }
}
