import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { getAuthErrorStatus, requireAuth } from '@/lib/auth';
import { calculateSemester } from '@/lib/student';
import { ActivityItem, computeJourney } from '@/lib/journey';

export async function GET(request: Request) {
    try {
        const user = requireAuth(request, 'student');

        const [studentRes, eventRes, activityRes, requestRes] = await Promise.all([
            db.query(
                `SELECT id, name, email, usn, department, semester, COALESCE(total_points, 0) AS total_points
                 FROM students WHERE id = $1`,
                [user.user_id]
            ),
            db.query(
                `SELECT es.id, es.status, es.submitted_at, es.points_awarded,
                        e.name, e.category, e.points,
                        (COALESCE(e.is_personal, false) AND e.personal_owner_id = es.student_id) AS conducted
                 FROM event_submissions es
                 JOIN events e ON es.event_id = e.id
                 WHERE es.student_id = $1`,
                [user.user_id]
            ),
            db.query(
                `SELECT s.id, s.status, s.submitted_at, s.activity_date, a.name, a.category, a.points
                 FROM submissions s
                 JOIN activity_requests r ON s.request_id = r.id
                 JOIN activities a ON r.activity_id = a.id
                 WHERE r.student_id = $1`,
                [user.user_id]
            ),
            db.query(
                `SELECT requested_at FROM activity_requests WHERE student_id = $1`,
                [user.user_id]
            ),
        ]);

        const student = studentRes.rows[0];
        if (!student) {
            return NextResponse.json({ detail: 'Student not found' }, { status: 404 });
        }

        const items: ActivityItem[] = [];
        let pending = 0;

        for (const r of eventRes.rows) {
            if (r.status === 'verified') {
                items.push({
                    id: `event-${r.id}`,
                    title: r.name,
                    category: r.category,
                    points: Number(r.points_awarded ?? r.points ?? 0),
                    date: r.submitted_at,
                    source: 'event',
                    conducted: Boolean(r.conducted),
                });
            } else if (r.status === 'pending_review') {
                pending++;
            }
        }

        for (const r of activityRes.rows) {
            if (r.status === 'approved' || r.status === 'verified') {
                items.push({
                    id: `activity-${r.id}`,
                    title: r.name,
                    category: r.category,
                    points: Number(r.points ?? 0),
                    date: r.activity_date || r.submitted_at,
                    source: 'activity',
                });
            } else if (r.status === 'pending') {
                pending++;
            }
        }

        const activityDates = [
            ...eventRes.rows.map((r) => r.submitted_at),
            ...activityRes.rows.map((r) => r.submitted_at),
            ...requestRes.rows.map((r) => r.requested_at),
        ];

        const semester = calculateSemester(student.email, student.usn) ?? student.semester;
        const journey = computeJourney({
            totalPoints: Number(student.total_points),
            semester,
            items,
            activityDates,
        });

        return NextResponse.json({
            student: {
                name: student.name,
                usn: student.usn,
                department: student.department,
                semester,
            },
            pending,
            journey,
        });
    } catch (err: any) {
        const authStatus = getAuthErrorStatus(err);
        return NextResponse.json({ detail: err?.message || 'Error' }, { status: authStatus ?? 500 });
    }
}
