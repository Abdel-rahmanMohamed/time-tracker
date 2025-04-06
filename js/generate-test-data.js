// Script to generate test data for TimeTracker
// Run this in the browser console to populate the database with sample data

async function generateTestData() {
    console.log('Generating test data...');
    
    // Make sure DB is initialized
    if (!db.db) {
        console.log('Database not initialized. Initializing...');
        await db.init();
    }
    
    // Check if categories exist, if not add default ones
    const categories = await db.getAll('categories');
    let categoryMap = {};
    
    if (!categories || categories.length === 0) {
        console.log('Adding default categories...');
        const defaultCategories = [
            { name: 'Work', color: '#4285f4' },
            { name: 'Study', color: '#34a853' },
            { name: 'Personal', color: '#fbbc05' },
            { name: 'Exercise', color: '#ea4335' },
            { name: 'Entertainment', color: '#9c27b0' }
        ];
        
        for (const category of defaultCategories) {
            const id = await db.addItem('categories', category);
            categoryMap[category.name] = id;
        }
    } else {
        // Map existing categories by name
        categories.forEach(category => {
            categoryMap[category.name] = category.id;
        });
    }
    
    // Add some sample tags
    console.log('Adding sample tags...');
    const sampleTags = [
        'important', 'meeting', 'coding', 'reading', 'writing', 
        'planning', 'research', 'design', 'calls', 'documentation',
        'learning', 'admin', 'creative', 'thinking', 'review'
    ];
    
    const tagMap = {};
    for (const tagName of sampleTags) {
        // Check if tag already exists
        const existingTags = await db.getAll('tags');
        let existingTag = existingTags.find(tag => tag.name.toLowerCase() === tagName.toLowerCase());
        
        if (existingTag) {
            tagMap[tagName] = existingTag.id;
        } else {
            const id = await db.addItem('tags', { name: tagName });
            tagMap[tagName] = id;
        }
    }
    
    // Generate activities spanning the last 7 days
    console.log('Generating activities for the past 7 days...');
    
    // Activity templates with realistic descriptions
    const activityTemplates = {
        'Work': [
            'Team standup meeting',
            'Working on project plan',
            'Client call',
            'Code review',
            'Bug fixing',
            'Feature development',
            'Documentation writing',
            'Performance optimization',
            'Testing new features',
            'Deployment preparation'
        ],
        'Study': [
            'Reading technical book',
            'Online course session',
            'Practice exercises',
            'Research paper review',
            'Study group meeting',
            'Watching tutorial videos',
            'Creating study notes',
            'Problem solving practice',
            'Learning new framework',
            'Language practice'
        ],
        'Personal': [
            'Journaling',
            'Planning weekly schedule',
            'Personal project work',
            'Administrative tasks',
            'Email organization',
            'Financial planning',
            'Home organization',
            'Digital decluttering',
            'Reading personal development book',
            'Setting monthly goals'
        ],
        'Exercise': [
            'Morning run',
            'Strength training',
            'Yoga session',
            'HIIT workout',
            'Cycling',
            'Swimming laps',
            'Stretching routine',
            'Hiking trip',
            'Exercise planning',
            'Walking meditation'
        ],
        'Entertainment': [
            'Reading fiction book',
            'Watching documentary',
            'Playing video games',
            'Movie night',
            'Listening to podcast',
            'Music practice',
            'Art project',
            'Board game session',
            'Cooking new recipe',
            'Social media break'
        ]
    };
    
    // Tag associations with each category
    const categoryTags = {
        'Work': ['important', 'meeting', 'coding', 'documentation', 'calls', 'planning', 'review'],
        'Study': ['reading', 'research', 'learning', 'writing', 'thinking'],
        'Personal': ['planning', 'admin', 'important', 'creative', 'thinking'],
        'Exercise': ['important'],
        'Entertainment': ['creative', 'reading']
    };
    
    // Generate activities for each day
    const now = new Date();
    const activities = [];
    
    for (let dayOffset = 0; dayOffset < 7; dayOffset++) {
        const date = new Date();
        date.setDate(now.getDate() - dayOffset);
        date.setHours(9, 0, 0, 0); // Start at 9 AM
        
        // Generate 3-8 activities per day
        const numActivities = Math.floor(Math.random() * 6) + 3;
        
        for (let i = 0; i < numActivities; i++) {
            // Select random category
            const categoryNames = Object.keys(categoryMap);
            const categoryName = categoryNames[Math.floor(Math.random() * categoryNames.length)];
            const categoryId = categoryMap[categoryName];
            
            // Select random activity description from the category
            const descriptions = activityTemplates[categoryName];
            const description = descriptions[Math.floor(Math.random() * descriptions.length)];
            
            // Generate start and end times
            const startHour = 9 + Math.floor(Math.random() * 8); // Between 9 AM and 5 PM
            const startMinute = Math.floor(Math.random() * 60);
            
            const startTime = new Date(date);
            startTime.setHours(startHour, startMinute, 0, 0);
            
            // Duration between 15 minutes and 2 hours
            const durationMinutes = Math.floor(Math.random() * 105) + 15;
            
            const endTime = new Date(startTime);
            endTime.setMinutes(endTime.getMinutes() + durationMinutes);
            
            // Select random tags (0-3) from the category's associated tags
            const availableTags = categoryTags[categoryName] || [];
            const numTags = Math.floor(Math.random() * 3);
            const activityTags = [];
            
            for (let t = 0; t < numTags && t < availableTags.length; t++) {
                const randomIndex = Math.floor(Math.random() * availableTags.length);
                const tagName = availableTags[randomIndex];
                
                // Avoid duplicate tags
                if (!activityTags.includes(tagMap[tagName])) {
                    activityTags.push(tagMap[tagName]);
                }
                
                // Remove the selected tag to avoid duplicates
                availableTags.splice(randomIndex, 1);
            }
            
            // Create activity object
            const activity = {
                description,
                startTime: startTime.toISOString(),
                endTime: endTime.toISOString(),
                categoryId,
                tags: activityTags,
                createdAt: new Date().toISOString()
            };
            
            activities.push(activity);
        }
    }
    
    // Sort activities by start time
    activities.sort((a, b) => new Date(a.startTime) - new Date(b.startTime));
    
    // Add activities to database
    console.log(`Adding ${activities.length} activities to the database...`);
    for (const activity of activities) {
        await db.addItem('activities', activity);
    }
    
    console.log('Test data generation complete!');
    console.log('Refreshing activity list and visualizations...');
    
    // Refresh the UI
    await app.refreshActivityList();
    await visualizations.updateAllCharts();
    
    return {
        categories: Object.keys(categoryMap).length,
        tags: Object.keys(tagMap).length,
        activities: activities.length
    };
}

// Call this function in the browser console to generate test data
// generateTestData().then(stats => console.log('Generated:', stats));