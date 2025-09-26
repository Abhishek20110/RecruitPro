# Database Schema Documentation

This document describes the MongoDB database schema design for the Recruitment Platform.

## Database Overview

The platform uses MongoDB as the primary database with Mongoose as the ODM (Object Document Mapper). The database is designed to be scalable, maintainable, and secure.

### Connection Configuration

```javascript
// Connection options for optimal performance
{
  maxPoolSize: 10,           // Maximum number of connections
  serverSelectionTimeoutMS: 5000,  // Server selection timeout
  socketTimeoutMS: 45000,    // Socket timeout
  bufferCommands: false,     // Disable mongoose buffering
}
```

## Collections

### Users Collection

The core collection storing user information for both candidates and recruiters.

#### Schema Definition

```javascript
{
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    index: true,
    match: /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/
  },
  password: {
    type: String,
    required: true,
    minlength: 8,
    // Validates: uppercase, lowercase, number
    validate: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/
  },
  firstName: {
    type: String,
    required: true,
    trim: true,
    maxlength: 50
  },
  lastName: {
    type: String,
    required: true,
    trim: true,
    maxlength: 50
  },
  role: {
    type: String,
    enum: ['candidate', 'recruiter', 'admin'],
    default: 'candidate'
  },
  profilePicture: {
    type: String,
    default: ''
  },
  phone: {
    type: String,
    trim: true,
    match: /^\+?[\d\s-()]+$/
  },
  bio: {
    type: String,
    maxlength: 500
  },
  skills: [{
    type: String,
    trim: true
  }],
  experience: {
    type: String,
    maxlength: 2000
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}
```

#### Indexes

```javascript
// Primary indexes for performance
{
  email: 1,          // Unique index for email lookups
  _id: 1,           // Default MongoDB index
  role: 1,          // For role-based queries
  "skills": 1,      // For skill-based searching
  createdAt: -1     // For chronological sorting
}

// Compound indexes for complex queries
{
  role: 1, 
  createdAt: -1
}
```

#### Validation Rules

**Email Validation:**
- Must be valid email format
- Converted to lowercase
- Trimmed of whitespace
- Unique across collection
- Indexed for fast lookups

**Password Validation:**
- Minimum 8 characters
- At least one uppercase letter
- At least one lowercase letter  
- At least one number
- Hashed with bcrypt (salt rounds: 12)
- Never returned in API responses

**Name Fields:**
- Required fields
- Maximum 50 characters each
- Trimmed of whitespace

**Phone Validation:**
- Optional field
- Must match international phone format
- Supports various formats: +1234567890, (123) 456-7890, etc.

**Bio and Experience:**
- Optional fields
- Bio: 500 character limit
- Experience: 2000 character limit

**Skills Array:**
- Array of strings
- Each skill trimmed
- Used for skill matching

#### Security Features

**Password Hashing:**
```javascript
// Pre-save middleware
UserSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  const saltRounds = 12;
  this.password = await bcrypt.hash(this.password, saltRounds);
  next();
});
```

**Password Comparison:**
```javascript
// Instance method for password verification
UserSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};
```

**Data Sanitization:**
```javascript
// toJSON transformation removes password
toJSON: { 
  transform: function(doc, ret) {
    delete ret.password;
    return ret;
  }
}
```

#### Sample Document

```json
{
  "_id": "507f1f77bcf86cd799439011",
  "email": "john.doe@example.com",
  "firstName": "John",
  "lastName": "Doe",
  "role": "candidate",
  "phone": "+1 (555) 123-4567",
  "bio": "Experienced full-stack developer with 5 years in modern web technologies.",
  "skills": ["JavaScript", "React", "Node.js", "MongoDB", "TypeScript"],
  "experience": "Senior Software Developer at TechCorp (2020-2025)\n- Led development of customer portal using React and Node.js\n- Implemented microservices architecture\n- Mentored junior developers",
  "profilePicture": "",
  "createdAt": "2025-01-01T10:00:00.000Z",
  "updatedAt": "2025-01-01T15:30:00.000Z"
}
```

## Database Design Principles

### 1. Data Integrity

**Validation at Multiple Levels:**
- Mongoose schema validation
- Application-level validation using Zod
- Database constraints and indexes

**Referential Integrity:**
- Proper foreign key relationships
- Cascade delete operations where appropriate
- Data consistency checks

### 2. Security

**Password Security:**
- Bcrypt hashing with high salt rounds
- Password strength requirements
- No password storage in plain text

**Data Sanitization:**
- Input validation and sanitization
- Protection against NoSQL injection
- Proper data type enforcement

### 3. Performance

**Indexing Strategy:**
- Email field indexed for login performance
- Role-based indexes for user type queries
- Skill array indexed for search functionality
- Compound indexes for complex queries

**Query Optimization:**
- Lean queries for list operations
- Projection to limit returned fields
- Connection pooling for concurrent requests

### 4. Scalability

**Document Structure:**
- Embedded arrays for skills (limited growth)
- Separate collections for relationships with high growth
- Flexible schema for future extensions

**Horizontal Scaling Considerations:**
- Designed for MongoDB sharding
- Proper shard key selection (email or _id)
- Replica set configuration support

## Database Operations

### Connection Management

```javascript
// Singleton pattern for database connection
let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

export async function connectToDatabase() {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    cached.promise = mongoose.connect(MONGODB_URI, opts);
  }
  
  cached.conn = await cached.promise;
  return cached.conn;
}
```

### Error Handling

**Mongoose Validation Errors:**
```javascript
// Handle validation errors
if (error.name === 'ValidationError') {
  const errors = {};
  Object.keys(error.errors).forEach(key => {
    errors[key] = [error.errors[key].message];
  });
  return { error: 'Validation failed', details: errors };
}
```

**Duplicate Key Errors:**
```javascript
// Handle unique constraint violations
if (error.code === 11000) {
  const field = Object.keys(error.keyPattern)[0];
  return { error: `${field} already exists` };
}
```

### Migration Strategy

**Schema Evolution:**
- Backward compatible changes preferred
- Migration scripts for breaking changes
- Version tracking for schema updates

**Data Migration Example:**
```javascript
// Example migration for adding new field
db.users.updateMany(
  { newField: { $exists: false } },
  { $set: { newField: "defaultValue" } }
);
```

## Performance Optimization

### Query Patterns

**Efficient User Lookup:**
```javascript
// Login query with email index
const user = await User.findOne({ email }).select('+password');
```

**Profile Updates:**
```javascript
// Atomic update with validation
const user = await User.findByIdAndUpdate(
  userId, 
  updateData, 
  { new: true, runValidators: true }
);
```

### Monitoring and Metrics

**Key Performance Indicators:**
- Query execution time
- Index hit ratio
- Connection pool utilization
- Document growth rate

**Database Monitoring:**
```javascript
// Example performance monitoring
mongoose.connection.on('connected', () => {
  console.log('MongoDB connected');
});

mongoose.connection.on('error', (err) => {
  console.error('MongoDB connection error:', err);
});
```

## Security Considerations

### Access Control

**Database Authentication:**
- Strong authentication credentials
- Role-based access control
- Network security (IP whitelisting)

**Connection Security:**
- SSL/TLS encryption in transit
- Encrypted connections to MongoDB
- Secure credential storage

### Data Privacy

**PII Protection:**
- Password hashing and salting
- Email normalization
- Sensitive data exclusion from logs

**GDPR Compliance:**
- Data retention policies
- Right to deletion implementation
- Data export capabilities

## Backup and Recovery

### Backup Strategy

**Automated Backups:**
- Daily full backups
- Point-in-time recovery capability
- Cross-region backup replication

**Testing and Validation:**
- Regular backup restoration tests
- Data integrity verification
- Recovery time objective (RTO) compliance

### Disaster Recovery

**High Availability:**
- MongoDB replica sets
- Automatic failover
- Read replica distribution

**Monitoring:**
- Real-time health checks
- Alert systems for failures
- Performance degradation detection

## Future Considerations

### Planned Extensions

**Additional Collections:**
- Jobs collection for job postings
- Applications collection for job applications
- Companies collection for employer data
- Messages collection for communication

**Enhanced Features:**
- Full-text search capabilities
- Advanced analytics data
- Audit trail implementation
- Document versioning

### Scaling Roadmap

**Performance Improvements:**
- Query optimization analysis
- Advanced indexing strategies
- Caching layer implementation

**Architecture Evolution:**
- Microservices data separation
- Event-driven architecture
- CQRS pattern implementation