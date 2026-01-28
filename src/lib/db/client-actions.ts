export type CollectionTask = {
  id: number;
  location: string;
  wasteType: string;
  amount: string;
  status: 'pending' | 'in_progress' | 'completed' | 'verified';
  date: string;
  collectorId: number | null;
};

export const getWasteCollectionTasks = async (limit: number = 20) => {
  try {
    const response = await fetch('/api/waste-collection-tasks');
    const data = await response.json();
    return data.tasks || [];
  } catch (error) {
    console.error("Error fetching waste collection tasks:", error);
    return [];
  }
};

export const updateTaskStatus = async (reportId: number, newStatus: string) => {
  try {
    const response = await fetch(`/api/waste-collection-tasks/${reportId}/status`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ status: newStatus }),
    });
    if (!response.ok) {
      throw new Error('Failed to update task status');
    }
    const data = await response.json();
    return data.task;
  } catch (error) {
    console.error("Error updating task status:", error);
    throw error;
  }
};

export const saveReward = async (amount: number) => {
  try {
    const response = await fetch('/api/rewards', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ amount }),
    });
    const data = await response.json();
    return data.reward;
  } catch (error) {
    console.error("Error saving reward:", error);
    throw error;
  }
};

export const saveCollectedWaste = async (reportId: number, amount: string, verificationResult: any) => {
  try {
    const response = await fetch('/api/collected-waste', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ reportId, amount, verificationResult }),
    });
    const data = await response.json();
    return data.collectedWaste;
  } catch (error) {
    console.error("Error saving collected waste:", error);
    throw error;
  }
};

export const createUser = async (email: string, name: string) => {
  try {
    const response = await fetch('/api/auth/signup', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, name }),
    });

    const data = await response.json();
    if (data.error) {
      throw new Error(data.error);
    }

    return data.user;
  } catch (error) {
    console.error("Error creating user:", error);
    return null;
  }
};

export const getUserByEmail = async (email: string) => {
  try {
    const response = await fetch(`/api/users/email/${email}`);
    const data = await response.json();
    return data.user || null;
  } catch (error) {
    console.error("Error fetching user by email:", error);
    return null;
  }
};

export const createReport = async (
  location: string,
  wasteType: string,
  amount: string,
  imageUrl?: string,
  type?: string,
  verificationResult?: any
) => {
  try {
    const response = await fetch('/api/reports', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        location,
        wasteType,
        amount,
        imageUrl,
        type,
        verificationResult
      }),
    });

    const data = await response.json();
    return data.report;
  } catch (error) {
    console.error("Error creating report:", error);
    return null;
  }
};

export const getRecentReports = async (limit: number = 10) => {
  try {
    const response = await fetch(`/api/reports?limit=${limit}`);
    const data = await response.json();
    return data.reports || [];
  } catch (error) {
    console.error("Error fetching recent reports:", error);
    return [];
  }
};
