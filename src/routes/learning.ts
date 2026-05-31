import { Router, Response } from 'express';
import { authenticateToken, AuthenticatedRequest } from '../middleware/auth';
import { db } from '../db';

const router = Router();

/**
 * 1. GET /api/learning/progress
 * Retrieves the user's active learning states, levels, XP, and badges.
 */
router.get('/progress', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  try {
    const [courses] = await db.query(
      'SELECT course_id, current_level, experience_points, completed_lessons, badges FROM user_courses WHERE user_id = ?',
      [user.id]
    );

    // Format JSON columns safely
    const formatted = courses.map((c: any) => ({
      course_id: c.course_id,
      current_level: c.current_level,
      experience_points: c.experience_points,
      completed_lessons: typeof c.completed_lessons === 'string' ? JSON.parse(c.completed_lessons) : (c.completed_lessons || []),
      badges: typeof c.badges === 'string' ? JSON.parse(c.badges) : (c.badges || [])
    }));

    return res.status(200).json({
      success: true,
      courses: formatted,
      totalXp: formatted.reduce((acc: number, curr: any) => acc + curr.experience_points, 0)
    });
  } catch (err: any) {
    console.error('Error fetching learning progress:', err);
    return res.status(500).json({ error: 'Server error reading student transcript.' });
  }
});

/**
 * 2. POST /api/learning/complete-lesson
 * Completes a lesson module, awards +50 XP, check levelups and badges.
 */
router.post('/complete-lesson', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  const { course_id, lesson_id } = req.body;
  const user = req.user!;

  if (!course_id || !lesson_id) {
    return res.status(400).json({ error: 'Course identifier and Lesson identifier are required.' });
  }

  const baseXpReward = 50;

  try {
    const [courses] = await db.query(
      'SELECT * FROM user_courses WHERE user_id = ? AND course_id = ?',
      [user.id, course_id]
    );

    let completedList: string[] = [];
    let badgeList: string[] = [];
    let currentXp = baseXpReward;
    let currentLevel = 1;
    let recordId: number | null = null;

    if (courses && courses.length > 0) {
      const course = courses[0];
      recordId = course.id;
      currentXp = course.experience_points + baseXpReward;
      currentLevel = course.current_level;

      completedList = typeof course.completed_lessons === 'string' 
        ? JSON.parse(course.completed_lessons) 
        : (course.completed_lessons || []);

      badgeList = typeof course.badges === 'string' 
        ? JSON.parse(course.badges) 
        : (course.badges || []);
    }

    // Append lesson if new
    if (!completedList.includes(lesson_id)) {
      completedList.push(lesson_id);
    }

    // Core Gamification triggers:
    // Level-up logic: Level shifts per 3 completed lessons
    const calculatedLevel = Math.max(currentLevel, Math.floor(completedList.length / 3) + 1);
    const didLevelUp = calculatedLevel > currentLevel;
    currentLevel = calculatedLevel;

    // Badges distribution based on milestones
    let newBadgeAwarded: string | null = null;
    if (completedList.length === 1 && !badgeList.includes('first_step')) {
      newBadgeAwarded = 'first_step'; // Green Seedling Badge
      badgeList.push('first_step');
    } else if (completedList.length === 3 && !badgeList.includes('soil_explorer')) {
      newBadgeAwarded = 'soil_explorer'; // Earthworm Companion
      badgeList.push('soil_explorer');
    } else if (completedList.length >= 6 && !badgeList.includes('master_farmer')) {
      newBadgeAwarded = 'master_farmer'; // Golden Harvest Crown
      badgeList.push('master_farmer');
    }

    const completedJson = JSON.stringify(completedList);
    const badgesJson = JSON.stringify(badgeList);

    if (recordId !== null) {
      // Update existing course tracker
      await db.query(
        'UPDATE user_courses SET current_level = ?, experience_points = ?, completed_lessons = ?, badges = ? WHERE id = ?',
        [currentLevel, currentXp, completedJson, badgesJson, recordId]
      );
    } else {
      // Register new course tracker
      await db.query(
        'INSERT INTO user_courses (user_id, course_id, current_level, experience_points, completed_lessons, badges) VALUES (?, ?, ?, ?, ?, ?)',
        [user.id, course_id, currentLevel, currentXp, completedJson, badgesJson]
      );
    }

    console.log(`🏆 [Learning Gamification] User ID: ${user.id} completed Lesson: ${lesson_id} in Course: ${course_id}. XP now: ${currentXp}`);

    return res.status(200).json({
      success: true,
      message: 'Lesson completed!',
      awardedXp: baseXpReward,
      currentXp,
      currentLevel,
      didLevelUp,
      newBadgeAwarded,
      allBadges: badgeList,
      completedLessonsCount: completedList.length
    });
  } catch (err: any) {
    console.error('Error saving lesson progress:', err);
    return res.status(500).json({ error: 'Server error saving study records.' });
  }
});

export { router as learningRouter };
export default router;
