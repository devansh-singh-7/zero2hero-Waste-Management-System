import { db } from '@/lib/db';
import { 
  Users,
  Reports,
  Rewards,
  CollectedWastes,
  Notifications,
  Transactions
} from '@/lib/db/schema';
import { eq, sql, and, desc, ne } from 'drizzle-orm';

const getDb = async () => {
  if (!db) {
    throw new Error('Database not initialized');
  }
  return db;
};

// Report operations
interface CreateReportInput {
  userId: number;
  location: string;
  wasteType: string;
  amount: string;
  imageUrl?: string;
  verificationResult?: any;
}

export const createReport = async ({
  userId,
  location,
  wasteType,
  amount,
  imageUrl,
  verificationResult
}: CreateReportInput) => {
  const database = await getDb();
  
  const [report] = await database.insert(Reports).values({
    userId,
    location,
    wasteType,
    amount,
    imageUrl,
    verificationResult,
    status: 'pending'
  }).returning();

  return report;
};

// Basic user operations
export const getUserByEmail = async (email: string) => {
  if (!email) {
    console.error("No email provided to getUserByEmail");
    return null;
  }

  try {
    const database = await getDb();
    const result = await database
      .select({
        id: Users.id,
        email: Users.email,
        name: Users.name,
        createdAt: Users.createdAt,
        image: Users.image,
        updatedAt: Users.updatedAt
      })
      .from(Users)
      .where(eq(Users.email, email))
      .execute();
    
    return result[0] || null;
  } catch (error) {
    console.error("Error fetching user by email:", error);
    return null;
  }
};

export const createUser = async (email: string, name: string) => {
  try {
    const database = await getDb();
    
    // First, check if user exists
    const existing = await getUserByEmail(email);
    if (existing) {
      return existing;
    }

    // Create new user
    const [user] = await database.insert(Users).values({
      email,
      name,
      password: '', // Provide a default or generated hash here
      createdAt: new Date(),
      updatedAt: new Date()
    }).returning({
      id: Users.id,
      email: Users.email,
      name: Users.name,
      createdAt: Users.createdAt,
      image: Users.image,
      updatedAt: Users.updatedAt
    });

    return user;
  } catch (error) {
    console.error("Error creating user:", error);
    return null;
  }
};



export async function getReportsByUserId(userId: number) {
  try {
    if (!db) throw new Error('Database not initialized');
    const userReports = await db.select().from(Reports).where(eq(Reports.userId, userId));
    return userReports;
  } catch (error) {
    console.error("Error fetching reports:", error);
    return [];
  }
}

export const getOrCreateReward = async (userId: number) => {
  try {
    const database = await getDb();
    let [reward] = await database.select().from(Rewards).where(eq(Rewards.userId, userId));
    if (!reward) {
      [reward] = await database.insert(Rewards).values({
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
};

export const updateRewardPoints = async (userId: number, pointsToAdd: number) => {
  try {
    const database = await getDb();
    const [updatedReward] = await database
      .update(Rewards)
      .set({ 
        points: sql`${Rewards.points} + ${pointsToAdd}`,
        updatedAt: new Date()
      })
      .where(eq(Rewards.userId, userId))
      .returning();
    return updatedReward;
  } catch (error) {
    console.error("Error updating reward points:", error);
    return null;
  }
};

export const updateUserBalance = async (userId: number, amount: number) => {
  try {
    const database = await getDb();
    const [updatedUser] = await database
      .update(Users)
      .set({ 
        balance: sql`${Users.balance} + ${amount}`,
        updatedAt: new Date()
      })
      .where(eq(Users.id, userId))
      .returning();
    return updatedUser;
  } catch (error) {
    console.error("Error updating user balance:", error);
    return null;
  }
};

export const recordTransaction = async (userId: number, type: string, amount: number, description: string) => {
  try {
    const database = await getDb();
    const [transaction] = await database
      .insert(Transactions)
      .values({
        userId,
        type,
        amount,
        description,
        date: new Date()
      })
      .returning();
    return transaction;
  } catch (error) {
    console.error("Error recording transaction:", error);
    return null;
  }
};

export const getCollectedWastesByCollector = async (collectorId: number) => {
  try {
    const database = await getDb();
    return await database.select().from(CollectedWastes).where(eq(CollectedWastes.collectorId, collectorId));
  } catch (error) {
    console.error("Error fetching collected wastes:", error);
    return [];
  }
};

export const createNotification = async (
  userId: number, 
  message: string, 
  type: string, 
  imageUrl?: string, 
  metadata?: any
) => {
  try {
    const database = await getDb();
    const [notification] = await database
      .insert(Notifications)
      .values({ 
        userId, 
        message, 
        type,
        imageUrl,
        metadata
      })
      .returning();
    return notification;
  } catch (error) {
    console.error("Error creating notification:", error);
    throw error;
  }
};

export const getUserNotifications = async (userId: number) => {
  try {
    const database = await getDb();
    return await database
      .select()
      .from(Notifications)
      .where(
        and(
          eq(Notifications.userId, userId),
          eq(Notifications.isRead, false)
        )
      );
  } catch (error) {
    console.error("Error fetching user notifications:", error);
    return [];
  }
};

export const markNotificationAsRead = async (notificationId: number) => {
  try {
    const database = await getDb();
    await database
      .update(Notifications)
      .set({ isRead: true })
      .where(eq(Notifications.id, notificationId));
    return true;
  } catch (error) {
    console.error("Error marking notification as read:", error);
    throw error; // Propagate error to caller
  }
};

export const getPendingReports = async () => {
  try {
    const database = await getDb();
    return await database
      .select()
      .from(Reports)
      .where(eq(Reports.status, "pending"));
  } catch (error) {
    console.error("Error fetching pending reports:", error);
    return [];
  }
};

type ReportStatus = 'pending' | 'collected' | 'verified' | 'rejected';

export const updateReportStatus = async (reportId: number, status: ReportStatus) => {
  try {
    const database = await getDb();
    const [updatedReport] = await database
      .update(Reports)
      .set({ status })
      .where(eq(Reports.id, reportId))
      .returning();
    return updatedReport;
  } catch (error) {
    console.error("Error updating report status:", error);
    return null;
  }
};



export const getWasteCollectionTasks = async (limit: number = 20) => {
  try {
    const database = await getDb();
    const tasks = await database
      .select({
        id: Reports.id,
        userId: Reports.userId,
        location: Reports.location,
        wasteType: Reports.wasteType,
        amount: Reports.amount,
        imageUrl: Reports.imageUrl,
        verificationResult: Reports.verificationResult,
        status: Reports.status,
        createdAt: Reports.createdAt,
        collectorId: Reports.collectorId,
        userName: Users.name,
        userEmail: Users.email
      })
      .from(Reports)
      .leftJoin(Users, eq(Reports.userId, Users.id))
      .orderBy(desc(Reports.createdAt))
      .limit(limit);

    return tasks;
  } catch (error) {
    console.error("Error fetching waste collection tasks:", error);
    return [];
  }
};

export const getRecentReports = async (limit: number = 10) => {
  try {
    const database = await getDb();
    const reports = await database
      .select()
      .from(Reports)
      .orderBy(desc(Reports.createdAt))
      .limit(limit);
    return reports;
  } catch (error) {
    console.error("Error fetching recent reports:", error);
    return [];
  }
};

export const saveReward = async (userId: number, amount: number) => {
  try {
    const database = await getDb();
    const [reward] = await database
      .insert(Rewards)
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
};

interface TaskUpdateData {
  status: string;
  collectorId?: number;
}

export const updateTaskStatus = async (reportId: number, newStatus: string, collectorId?: number) => {
  try {
    const database = await getDb();
    const updateData: TaskUpdateData = { status: newStatus };
    if (collectorId !== undefined) {
      updateData.collectorId = collectorId;
    }
    const [updatedReport] = await database
      .update(Reports)
      .set(updateData)
      .where(eq(Reports.id, reportId))
      .returning();
    return updatedReport;
  } catch (error) {
    console.error("Error updating task status:", error);
    throw error;
  }
};

export const completeTaskWithRewards = async (
  reportId: number, 
  collectorId: number, 
  verificationResult?: any,
  imageUrl?: string
) => {
  try {
    const database = await getDb();
    
    // Get the report details first
    const [report] = await database
      .select()
      .from(Reports)
      .where(eq(Reports.id, reportId))
      .limit(1);

    if (!report || !report.userId) {
      throw new Error('Report not found or missing user ID');
    }

    // Update report status to completed
    const [updatedReport] = await database
      .update(Reports)
      .set({ 
        status: 'completed',
        collectorId: collectorId,
        verificationResult: verificationResult,
        imageUrl: imageUrl
      })
      .where(eq(Reports.id, reportId))
      .returning();

    // Calculate rewards based on waste type and amount
    const getRewardAmount = (wasteType: string, amount: string) => {
      // Fixed reward amount for task completion as requested
      return 75; // Always give 75 points when a task is completed
    };

    const rewardAmount = getRewardAmount(report.wasteType, report.amount);

    // Record transaction - this is what determines the balance
    await recordTransaction(
      report.userId, 
      'earned_collection', 
      rewardAmount, 
      `Waste collection completed (75 tokens for task completion): ${report.wasteType} at ${report.location}`
    );

    // Update/create reward points
    await getOrCreateReward(report.userId);
    await updateRewardPoints(report.userId, rewardAmount);

    // Create notification with completion photo
    const notificationMessage = `🎉 Your waste report has been collected! You earned ${rewardAmount} tokens (75 tokens for task completion). ${imageUrl ? 'Check out the completion photo below!' : ''}`;
    const notificationMetadata = {
      reportId: reportId,
      rewardAmount: rewardAmount,
      wasteType: report.wasteType,
      location: report.location,
      collectionDate: new Date().toISOString()
    };

    await createNotification(
      report.userId,
      notificationMessage,
      'completion_with_photo',
      imageUrl,
      notificationMetadata
    );

    // Create collected waste record
    const [collectedWaste] = await database
      .insert(CollectedWastes)
      .values({
        reportId: reportId,
        collectorId: collectorId,
        collectionDate: new Date(),
        verificationResult: verificationResult
      })
      .returning();

    return {
      updatedReport,
      collectedWaste,
      rewardAmount,
      userId: report.userId
    };
  } catch (error) {
    console.error("Error completing task with rewards:", error);
    throw error;
  }
};

export const getAllRewards = async () => {
  try {
    const database = await getDb();
    const allRewards = await database
      .select({
        id: Rewards.id,
        userId: Rewards.userId,
        points: Rewards.points,
        level: Rewards.level,
        createdAt: Rewards.createdAt,
        userName: Users.name,
      })
      .from(Rewards)
      .leftJoin(Users, eq(Rewards.userId, Users.id))
      .orderBy(desc(Rewards.points));

    return allRewards;
  } catch (error) {
    console.error("Error fetching all rewards:", error);
    return [];
  }
};

export const getRewardTransactions = async (userId: number) => {
  try {
    const database = await getDb();
    const userTransactions = await database
      .select({
        id: Transactions.id,
        type: Transactions.type,
        amount: Transactions.amount,
        description: Transactions.description,
        date: Transactions.date,
      })
      .from(Transactions)
      .where(eq(Transactions.userId, userId))
      .orderBy(desc(Transactions.date))
      .limit(10);

    interface Transaction {
      id: number;
      type: string;
      amount: number;
      description: string;
      date: Date;
    }

    const formattedTransactions = userTransactions.map((t: Transaction) => ({
      ...t,
      date: t.date.toISOString().split('T')[0], // Format date as YYYY-MM-DD
    }));

    return formattedTransactions;
  } catch (error) {
    console.error("Error fetching reward transactions:", error);
    return [];
  }
};

export const getAvailableRewards = async (userId: number) => {
  try {
    const database = await getDb();
    
    // Get user's total points
    const userTransactions = await getRewardTransactions(userId);
    const userPoints = userTransactions.reduce((total: number, transaction: any) => {
      return transaction.type.startsWith('earned') ? total + transaction.amount : total - transaction.amount;
    }, 0);

    // Get available rewards from the database
    const dbRewards = await database
      .select({
        id: Rewards.id,
        name: Rewards.name,
        cost: Rewards.points,
        description: Rewards.description,
        collectionInfo: Rewards.collectionInfo,
      })
      .from(Rewards)
      .where(eq(Rewards.isAvailable, true));

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

    return allRewards;
  } catch (error) {
    console.error("Error fetching available rewards:", error);
    return [];
  }
};

export const createTransaction = async (userId: number, type: 'earned_report' | 'earned_collect' | 'redeemed', amount: number, description: string) => {
  try {
    const database = await getDb();
    const [transaction] = await database
      .insert(Transactions)
      .values({ userId, type, amount, description })
      .returning();
    return transaction;
  } catch (error) {
    console.error("Error creating transaction:", error);
    throw error;
  }
};

export const redeemReward = async (userId: number, rewardId: number) => {
  try {
    const database = await getDb();
    const userReward = await getOrCreateReward(userId);
    if (!userReward) {
      throw new Error("Failed to get or create user reward");
    }
    
    if (rewardId === 0) {
      // Redeem all points
      const [updatedReward] = await database.update(Rewards)
        .set({ 
          points: 0,
          updatedAt: new Date(),
        })
        .where(eq(Rewards.userId, userId))
        .returning();

      // Create a transaction for this redemption
      await createTransaction(userId, 'redeemed', userReward.points, `Redeemed all points: ${userReward.points}`);

      return updatedReward;
    } else {
      // Existing logic for redeeming specific rewards
      const availableReward = await database.select().from(Rewards).where(eq(Rewards.id, rewardId));

      if (!userReward || !availableReward[0] || userReward.points < availableReward[0].points) {
        throw new Error("Insufficient points or invalid reward");
      }

      const [updatedReward] = await database.update(Rewards)
        .set({ 
          points: sql`${Rewards.points} - ${availableReward[0].points}`,
          updatedAt: new Date(),
        })
        .where(eq(Rewards.userId, userId))
        .returning();

      // Create a transaction for this redemption
      await createTransaction(userId, 'redeemed', availableReward[0].points, `Redeemed: ${availableReward[0].name}`);

      return updatedReward;
    }
  } catch (error) {
    console.error("Error redeeming reward:", error);
    throw error;
  }
};

interface TransactionSummary {
  type: string;
  amount: number;
}

export const getUserBalance = async (userId: number): Promise<number> => {
  try {
    // Get ALL transactions for this user to calculate correct balance
    const allTransactions = await db
      .select({
        type: Transactions.type,
        amount: Transactions.amount,
      })
      .from(Transactions)
      .where(eq(Transactions.userId, userId));

    const balance = allTransactions.reduce((acc: number, transaction: any) => {
      // Define which transaction types add to balance vs subtract from balance
      const earningTypes = ['earned_report', 'earned_collection', 'earned_collect', 'reward'];
      const spendingTypes = ['redeemed', 'spent'];
      
      let newBalance = acc;
      if (earningTypes.includes(transaction.type)) {
        newBalance = acc + transaction.amount;
      } else if (spendingTypes.includes(transaction.type)) {
        newBalance = acc - transaction.amount;
      }
      
      return newBalance;
    }, 0);
    
    return Math.max(balance, 0);
  } catch (error) {
    console.error("Error calculating user balance:", error);
    return 0;
  }
};

export const saveCollectedWaste = async (
  reportId: number, 
  collectorId: number, 
  verificationResult: any
) => {
  try {
    const database = await getDb();

    // Save the collected waste record
    const [collectedWaste] = await database.insert(CollectedWastes)
      .values({
        reportId,
        collectorId,
        collectionDate: new Date(),
        status: 'collected',
        verificationResult: verificationResult ? JSON.stringify(verificationResult) : null,
      })
      .returning();

    if (!collectedWaste) {
      throw new Error('Failed to create collected waste record');
    }

    // Update the report status
    await database.update(Reports)
      .set({ 
        status: 'collected',
        collectorId,
      })
      .where(eq(Reports.id, reportId));

    // Create a notification for the waste reporter
    const [report] = await database.select({
      userId: Reports.userId,
      location: Reports.location,
    })
    .from(Reports)
    .where(eq(Reports.id, reportId));

    if (report && report.userId) {
      await database.insert(Notifications)
        .values({
          userId: report.userId,
          message: `Your reported waste at ${report.location} has been collected and verified!`,
          type: 'collection_complete',
          isRead: false,
        });

      // Award points for collecting waste
      const pointsEarned = 20;
      await updateRewardPoints(collectorId, pointsEarned);

      // Create a transaction for the earned points
      await createTransaction(
        collectorId,
        'earned_collect',
        pointsEarned,
        'Points earned for collecting waste'
      );

      // Create a notification for the collector
      await createNotification(
        collectorId,
        `You've earned ${pointsEarned} points for collecting waste!`,
        'reward'
      );
    }

    return collectedWaste;
  } catch (error) {
    console.error('Error saving collected waste:', error);
    throw error;
  }
};
  