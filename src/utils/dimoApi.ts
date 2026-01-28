// DIMO API utility functions
export interface DimoDevice {
  id: string;
  name: string;
  make: string;
  model: string;
  year: number;
  vin?: string;
}

export interface DimoTrip {
  id: string;
  deviceId: string;
  startTime: string;
  endTime: string;
  distance: number;
  fuelEfficiency: number;
  ecoScore: number;
}

export interface DimoDeviceData {
  deviceId: string;
  timestamp: string;
  speed: number;
  rpm: number;
  fuelLevel: number;
  ecoScore: number;
  location: {
    latitude: number;
    longitude: number;
  };
}

// Mock implementation - replace with actual DIMO API calls
export const getUserDevices = async (): Promise<DimoDevice[]> => {
  try {
    // Placeholder implementation
    // This would typically make an API call to DIMO
    const mockDevices: DimoDevice[] = [
      {
        id: 'device_1',
        name: 'My Tesla Model 3',
        make: 'Tesla',
        model: 'Model 3',
        year: 2023,
        vin: '1HGBH41JXMN109186'
      },
      {
        id: 'device_2',
        name: 'Family SUV',
        make: 'Toyota',
        model: 'Highlander',
        year: 2022,
        vin: '2T1BURHE0JC123456'
      }
    ];
    
    console.log('Fetching user devices from DIMO API');
    return mockDevices;
  } catch (error) {
    console.error('Error fetching user devices:', error);
    return [];
  }
};

export const getDeviceData = async (deviceId: string): Promise<DimoDeviceData[]> => {
  try {
    // Placeholder implementation
    // This would typically make an API call to DIMO for device data
    const mockData: DimoDeviceData[] = [
      {
        deviceId,
        timestamp: new Date().toISOString(),
        speed: 65,
        rpm: 2500,
        fuelLevel: 75,
        ecoScore: 85,
        location: {
          latitude: 40.7128,
          longitude: -74.0060
        }
      }
    ];
    
    console.log('Fetching device data from DIMO API for device:', deviceId);
    return mockData;
  } catch (error) {
    console.error('Error fetching device data:', error);
    return [];
  }
};

export const getDeviceTrips = async (deviceId: string): Promise<DimoTrip[]> => {
  try {
    // Placeholder implementation
    // This would typically make an API call to DIMO for trip data
    const mockTrips: DimoTrip[] = [
      {
        id: 'trip_1',
        deviceId,
        startTime: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
        endTime: new Date().toISOString(),
        distance: 25.5,
        fuelEfficiency: 28.5,
        ecoScore: 87
      }
    ];
    
    console.log('Fetching device trips from DIMO API for device:', deviceId);
    return mockTrips;
  } catch (error) {
    console.error('Error fetching device trips:', error);
    return [];
  }
};

