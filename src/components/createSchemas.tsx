import { createSchemas } from '@/utils/signSchemas';
import { useEffect } from 'react';
// import { createSchemas } from '../utils/signSchemas';

const CreateSchemas = () => {
  useEffect(() => {
    const run = async () => {
      try {
        // Create sample schemas for testing
        const sampleSchemas = [
          {
            id: 'waste_report',
            name: 'Waste Report Schema',
            description: 'Schema for reporting waste collection',
            fields: [
              { name: 'location', type: 'string', required: true },
              { name: 'wasteType', type: 'string', required: true },
              { name: 'amount', type: 'string', required: true }
            ]
          }
        ];
        
        const schemaIds = await createSchemas(sampleSchemas);
        console.log('Schema IDs:', schemaIds);
        alert(`Schema IDs: ${JSON.stringify(schemaIds)}`);
      } catch (error) {
        console.error('Error creating schemas:', error);
        alert('Failed to create schemas. Check console for details.');
      }
    };

    run();
  }, []);

  return (
    <div>
      <h1>Creating Schemas...</h1>
    </div>
  );
};

export default CreateSchemas;