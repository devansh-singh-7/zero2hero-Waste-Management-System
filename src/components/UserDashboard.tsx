import { useState, useEffect } from 'react';
import { getOrCreateReward, getUserNotifications, markNotificationAsRead, getUserBalance } from '@/lib/db/actions';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface Notification {
  id: number;
  message: string;
  type: string;
  createdAt?: Date;
}

interface Reward {
  points: number;
  level: number;
  name?: string;
  collectionInfo?: string;
}

export function UserDashboard({ userId }: { userId: number }) {
  const [reward, setReward] = useState<Reward | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [balance, setBalance] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch all user data in parallel
        const [userReward, userNotifications, userBalance] = await Promise.all([
          getOrCreateReward(userId),
          getUserNotifications(userId),
          getUserBalance(userId)
        ]);

        setReward(userReward);
        setNotifications(userNotifications);
        setBalance(userBalance);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load user data');
        console.error('Error loading user data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [userId]);

  const handleNotificationRead = async (notificationId: number) => {
    try {
      await markNotificationAsRead(notificationId);
      setNotifications(prevNotifications => 
        prevNotifications.filter(n => n.id !== notificationId)
      );
    } catch (err) {
      console.error('Error marking notification as read:', err);
      // You could also set an error state here to show to the user
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  const getNotificationBadgeColor = (type: string) => {
    switch (type) {
      case 'reward':
        return 'bg-green-500';
      case 'collection_complete':
        return 'bg-blue-500';
      default:
        return 'bg-gray-500';
    }
  };

  return (
    <div className="space-y-6 p-6">
      <h2 className="text-2xl font-bold">User Dashboard</h2>
      
      <Card className="p-6">
        <h3 className="text-xl font-semibold mb-4">Rewards & Points</h3>
        {reward && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-500">Available Points</p>
              <p className="text-3xl font-bold">{balance}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Level</p>
              <p className="text-3xl font-bold">{reward.level}</p>
            </div>
            {reward.name && (
              <div className="col-span-2">
                <p className="text-sm text-gray-500">Current Reward Status</p>
                <p>{reward.name}</p>
                {reward.collectionInfo && (
                  <p className="text-sm text-gray-400">{reward.collectionInfo}</p>
                )}
              </div>
            )}
          </div>
        )}
      </Card>

      <Card className="p-6">
        <h3 className="text-xl font-semibold mb-4">Notifications</h3>
        {notifications.length === 0 ? (
          <p className="text-gray-500">No new notifications</p>
        ) : (
          <ul className="space-y-4">
            {notifications.map(notification => (
              <li key={notification.id} className="flex items-start justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-start space-x-3">
                  <Badge className={getNotificationBadgeColor(notification.type)}>
                    {notification.type}
                  </Badge>
                  <div>
                    <p className="text-sm">{notification.message}</p>
                    {notification.createdAt && (
                      <p className="text-xs text-gray-500">
                        {new Date(notification.createdAt).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => handleNotificationRead(notification.id)}
                  className="text-sm text-blue-500 hover:text-blue-700"
                >
                  Mark as Read
                </button>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}