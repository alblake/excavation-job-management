# Excavation Job Management System

An advanced excavation job management system designed to streamline cubic yard estimation and project tracking for construction and earthwork professionals.

## Features

### Job Management
- Create and manage excavation jobs with detailed information
- Track job locations and status
- Organize multiple estimates per job

### Volume Calculations
- Precise cubic yard calculations from pipe length, trench depth, and width
- Automatic conversion from cubic feet to cubic yards
- Material weight calculations with customizable density (default: 145 lbs/ft³)

### Cost Estimations
- **Material Costs**: Import unit cost calculations per ton
- **Haul-off Costs**: $37.50 per cubic yard disposal charges
- **Equipment Labor Costs**:
  - 250 Series Excavator: $250/hour
  - 200 Series Excavator: $200/hour
  - 320 Series Loader: $200/hour
- Total equipment cost summaries

### Data Management
- Persistent storage with Supabase database
- Individual estimate tracking with custom material weights and costs
- Real-time calculations and updates

## Technology Stack

- **Frontend**: React with TypeScript, Tailwind CSS, shadcn/ui components
- **Backend**: Express.js with TypeScript
- **Database**: Supabase (PostgreSQL)
- **ORM**: Drizzle ORM
- **Build Tool**: Vite
- **Forms**: React Hook Form with Zod validation

## Installation

1. Clone the repository:
```bash
git clone https://github.com/alblake/excavation-job-management.git
cd excavation-job-management
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
# Create a .env file with your Supabase database URL
DATABASE_URL=your_supabase_connection_string
```

4. Run the development server:
```bash
npm run dev
```

## Usage

1. **Create Jobs**: Add new excavation projects with names and locations
2. **Add Estimates**: Create detailed estimates for each job with:
   - Pipe length (feet)
   - Trench width (feet)
   - Trench depth (feet)
   - Material weight (lbs/ft³)
   - Import unit cost ($/ton)
   - Estimated labor hours
3. **View Calculations**: See real-time calculations for:
   - Volume in cubic feet and cubic yards
   - Material weight in tons
   - Import costs
   - Haul-off and disposal charges
   - Equipment labor costs
   - Total project costs

## Database Schema

### Jobs Table
- `id`: Primary key
- `name`: Job name
- `location`: Job location
- `status`: Job status

### Estimates Table
- `id`: Primary key
- `jobId`: Foreign key to jobs
- `description`: Estimate description
- `pipeLength`: Pipe length in feet
- `trenchWidth`: Trench width in feet
- `trenchDepth`: Trench depth in feet
- `materialWeight`: Material weight in lbs/ft³
- `importUnitCost`: Import cost per ton
- `estimatedHours`: Labor hours estimate
- `notes`: Additional notes

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is open source and available under the MIT License.