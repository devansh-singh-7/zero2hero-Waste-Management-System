import { db } from '@/lib/db';
import { users, reports, rewards, collectedWastes, notifications, transactions } from '@/lib/db/schema';
import { eq, sql, and, desc, ne } from 'drizzle-orm';

export async function createUser(email: string, name: string) {
  try {
    if (!db) throw new Error('Database not initialized');
    let user = await getUserByEmail(email);
    if (user) {
      return user;
    }
    [user] = await db.insert(users).values({ email, name }).returning();
    return user;
  } catch (error) {
    console.error("Error creating user:", error);
    return null;
  }
}

export async function getUserByEmail(email: string) {
  try {
    if (!db) throw new Error('Database not initialized');
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  } catch (error) {
    console.error("Error fetching user by email:", error);
    return null;
  }
}

export async function createReport(
  userId: number | null,
  location: string,
  wasteType: string,
  amount: string,
  imageUrl?: string,
  type?: string,
  verificationResult?: any
) {
  console.log('Creating report with the following data:', { userId, location, wasteType, amount, imageUrl, verificationResult });
  try {
    if (!db) throw new Error('Database not initialized');
    const [report] = await db
      .insert(reports)
      .values({
        userId: userId as any,
        location,
        wasteType,
        amount,
        imageUrl,
        verificationResult,
        status: "pending",
      })
      .returning();

    console.log('Report created successfully:', report);

    // Only award points and create transactions if user is authenticated
    if (userId) {
      // Award 10 points for reporting waste
      const pointsEarned = 10;
      await updateRewardPoints(userId, pointsEarned);

      // Create a transaction for the earned points
      await createTransaction(userId, 'earned_report', pointsEarned, 'Points earned for reporting waste');

      // Create a notification for the user
      await createNotification(
        userId,
        `You've earned ${pointsEarned} points for reporting waste!`,
        'reward'
      );
    }

    return report;
  } catch (error) {
    console.error("Error creating report:", error);
    return null;
  }
}

export async function getReportsByUserId(userId: number) {
  try {
    if (!db) throw new Error('Database not initialized');
    const userReports = await db.select().from(reports).where(eq(reports.userId, userId));
    return userReports;
  } catch (error) {
    console.error("Error fetching reports:", error);
    return [];
  }
}

export async function getOrCreateReward(userId: number) {
  try {
    if (!db) throw new Error('Database not initialized');
    let [reward] = await db.select().from(rewards).where(eq(rewards.userId, userId));
    if (!reward) {
      [reward] = await db.insert(rewards).values({
        userId,
        name: 'Default Reward',
        collectionInfo: 'Default Collection Info',
        points: 0,
        level: 1,
        isAvailable: true,
      }).returning();
    }
    return reward;
  } catch (error) {
    console.error("Error getting or creating reward:", error);
    return null;
  }
}

export async function updateRewardPoints(userId: number, pointsToAdd: number) {
  try {
    if (!db) throw new Error('Database not initialized');
    const [updatedReward] = await db
      .update(rewards)
      .set({ 
        points: sql`${rewards.points} + ${pointsToAdd}`,
        updatedAt: new Date()
      })
      .where(eq(rewards.userId, userId))
      .returning();
    return updatedReward;
  } catch (error) {
    console.error("Error updating reward points:", error);
    return null;
  }
}

export async function createCollectedWaste(reportId: number, collectorId: number, notes?: string) {
  try {
    if (!db) throw new Error('Database not initialized');
    const [collectedWaste] = await db
      .insert(collectedWastes)
      .values({
        reportId,
        collectorId,
        collectionDate: new Date(),
      })
      .returning();
    return collectedWaste;
  } catch (error) {
    console.error("Error creating collected waste:", error);
    return null;
  }
}

export async function getCollectedWastesByCollector(collectorId: number) {
  try {
    if (!db) throw new Error('Database not initialized');
    return await db.select().from(collectedWastes).where(eq(collectedWastes.collectorId, collectorId));
  } catch (error) {
    console.error("Error fetching collected wastes:", error);
    return [];
  }
}

export async function createNotification(userId: number, message: string, type: string) {
  try {
    if (!db) throw new Error('Database not initialized');
    const [notification] = await db
      .insert(notifications)
      .values({ userId, message, type })
      .returning();
    return notification;
  } catch (error) {
    console.error("Error creating notification:", error);
    return null;
  }
}

export async function getUnreadNotifications(userId: number) {
  try {
    if (!db) throw new Error('Database not initialized');
    return await db.select().from(notifications).where(
      and(
        eq(notifications.userId, userId),
        eq(notifications.isRead, false)
      )
    );
  } catch (error) {
    console.error("Error fetching unread notifications:", error);
    return [];
  }
}

export async function markNotificationAsRead(notificationId: number) {
  try {
    if (!db) throw new Error('Database not initialized');
    await db.update(notifications).set({ isRead: true }).where(eq(notifications.id, notificationId));
  } catch (error) {
    console.error("Error marking notification as read:", error);
  }
}

export async function getPendingReports() {
  try {
    if (!db) throw new Error('Database not initialized');
    return await db.select().from(reports).where(eq(reports.status, "pending"));
  } catch (error) {
    console.error("Error fetching pending reports:", error);
    return [];
  }
}

export async function updateReportStatus(reportId: number, status: string) {
  try {
    if (!db) throw new Error('Database not initialized');
    const [updatedReport] = await db
      .update(reports)
      .set({ status })
      .where(eq(reports.id, reportId))
      .returning();
    return updatedReport;
  } catch (error) {
    console.error("Error updating report status:", error);
    return null;
  }
}

export async function getRecentReports(limit: number = 10) {
  try {
    if (!db) throw new Error('Database not initialized');
    const recentReports = await db
      .select()
      .from(reports)
      .orderBy(desc(reports.createdAt))
      .limit(limit);
    return recentReports;
  } catch (error) {
    console.error("Error fetching recent reports:", error);
    return [];
  }
}

export async function getWasteCollectionTasks(limit: number = 20) {
  try {
    if (!db) throw new Error('Database not initialized');
    const tasks = await db
      .select({
        id: reports.id,
        location: reports.location,
        wasteType: reports.wasteType,
        amount: reports.amount,
        status: reports.status,
        date: reports.createdAt,
        collectorId: reports.collectorId,
      })
      .from(reports)
      .limit(limit);

    return tasks.map(task => ({
      ...task,
      date: task.date.toISOString().split('T')[0], // Format date as YYYY-MM-DD
    }));
  } catch (error) {
    console.error("Error fetching waste collection tasks:", error);
    return [];
  }
}

export async function saveReward(userId: number, amount: number) {
  try {
    if (!db) throw new Error('Database not initialized');
    const [reward] = await db
      .insert(rewards)
      .values({
        userId,
        name: 'Waste Collection Reward',
        collectionInfo: 'Points earned from waste collection',
        points: amount,
        level: 1,
        isAvailable: true,
      })
      .returning();
    
    // Create a transaction for this reward
    await createTransaction(userId, 'earned_collect', amount, 'Points earned for collecting waste');

    return reward;
  } catch (error) {
    console.error("Error saving reward:", error);
    throw error;
  }
}

export async function saveCollectedWaste(reportId: number, collectorId: number, verificationResult: any) {
  try {
    if (!db) throw new Error('Database not initialized');
    const [collectedWaste] = await db
      .insert(collectedWastes)
      .values({
        reportId,
        collectorId,
        collectionDate: new Date(),
        status: 'verified',
      })
      .returning();
    return collectedWaste;
  } catch (error) {
    console.error("Error saving collected waste:", error);
    throw error;
  }
}

export async function updateTaskStatus(reportId: number, newStatus: string, collectorId?: number) {
  try {
    if (!db) throw new Error('Database not initialized');
    const updateData: any = { status: newStatus };
    if (collectorId !== undefined) {
      updateData.collectorId = collectorId;
    }
    const [updatedReport] = await db
      .update(reports)
      .set(updateData)
      .where(eq(reports.id, reportId))
      .returning();
    return updatedReport;
  } catch (error) {
    console.error("Error updating task status:", error);
    throw error;
  }
}

export async function getAllRewards() {
  try {
    if (!db) throw new Error('Database not initialized');
    const allRewards = await db
      .select({
        id: rewards.id,
        userId: rewards.userId,
        points: rewards.points,
        level: rewards.level,
        createdAt: rewards.createdAt,
        userName: users.name,
      })
      .from(rewards)
      .leftJoin(users, eq(rewards.userId, users.id))
      .orderBy(desc(rewards.points));

    return allRewards;
  } catch (error) {
    console.error("Error fetching all rewards:", error);
    return [];
  }
}

export async function getRewardTransactions(userId: number) {
  try {
    if (!db) throw new Error('Database not initialized');
    console.log('Fetching transactions for user ID:', userId)
    const userTransactions = await db
      .select({
        id: transactions.id,
        type: transactions.type,
        amount: transactions.amount,
        description: transactions.description,
        date: transactions.date,
      })
      .from(transactions)
      .where(eq(transactions.userId, userId))
      .orderBy(desc(transactions.date))
      .limit(10);

    console.log('Raw transactions from database:', userTransactions)

    const formattedTransactions = userTransactions.map(t => ({
      ...t,
      date: t.date.toISOString().split('T')[0], // Format date as YYYY-MM-DD
    }));

    console.log('Formatted transactions:', formattedTransactions)
    return formattedTransactions;
  } catch (error) {
    console.error("Error fetching reward transactions:", error);
    return [];
  }
}

export async function getAvailableRewards(userId: number) {
  try {
    if (!db) throw new Error('Database not initialized');
    console.log('Fetching available rewards for user:', userId);
    
    // Get user's total points
    const userTransactions = await getRewardTransactions(userId);
    const userPoints = userTransactions.reduce((total, transaction) => {
      return transaction.type.startsWith('earned') ? total + transaction.amount : total - transaction.amount;
    }, 0);

    console.log('User total points:', userPoints);

    // Get available rewards from the database
    const dbRewards = await db
      .select({
        id: rewards.id,
        name: rewards.name,
        cost: rewards.points,
        description: rewards.description,
        collectionInfo: rewards.collectionInfo,
      })
      .from(rewards)
      .where(eq(rewards.isAvailable, true));

    console.log('Rewards from database:', dbRewards);

    // Combine user points and database rewards
    const allRewards = [
      {
        id: 0, // Use a special ID for user's points
        name: "Your Points",
        cost: userPoints,
        description: "Redeem your earned points",
        collectionInfo: "Points earned from reporting and collecting waste"
      },
      ...dbRewards
    ];

    console.log('All available rewards:', allRewards);
    return allRewards;
  } catch (error) {
    console.error("Error fetching available rewards:", error);
    return [];
  }
}

export async function createTransaction(userId: number, type: 'earned_report' | 'earned_collect' | 'redeemed', amount: number, description: string) {
  try {
    if (!db) throw new Error('Database not initialized');
    const [transaction] = await db
      .insert(transactions)
      .values({ userId, type, amount, description })
      .returning();
    return transaction;
  } catch (error) {
    console.error("Error creating transaction:", error);
    throw error;
  }
}

export async function redeemReward(userId: number, rewardId: number) {
  try {
    if (!db) throw new Error('Database not initialized');
    const userReward = await getOrCreateReward(userId) as any;
    
    if (rewardId === 0) {
      // Redeem all points
      const [updatedReward] = await db.update(rewards)
        .set({ 
          points: 0,
          updatedAt: new Date(),
        })
        .where(eq(rewards.userId, userId))
        .returning();

      // Create a transaction for this redemption
      await createTransaction(userId, 'redeemed', userReward.points, `Redeemed all points: ${userReward.points}`);

      return updatedReward;
    } else {
      // Existing logic for redeeming specific rewards
      const availableReward = await db.select().from(rewards).where(eq(rewards.id, rewardId));

      if (!userReward || !availableReward[0] || userReward.points < availableReward[0].points) {
        throw new Error("Insufficient points or invalid reward");
      }

      const [updatedReward] = await db.update(rewards)
        .set({ 
          points: sql`${rewards.points} - ${availableReward[0].points}`,
          updatedAt: new Date(),
        })
        .where(eq(rewards.userId, userId))
        .returning();

      // Create a transaction for this redemption
      await createTransaction(userId, 'redeemed', availableReward[0].points, `Redeemed: ${availableReward[0].name}`);

      return updatedReward;
    }
  } catch (error) {
    console.error("Error redeeming reward:", error);
    throw error;
  }
}

export async function getUserBalance(userId: number): Promise<number> {
  const userTransactions = await getRewardTransactions(userId);
  const balance = userTransactions.reduce((acc, transaction) => {
    return transaction.type.startsWith('earned') ? acc + transaction.amount : acc - transaction.amount
  }, 0);
  return Math.max(balance, 0); // Ensure balance is never negative
}

