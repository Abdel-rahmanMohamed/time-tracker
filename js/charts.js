// Data visualization and analytics

class Visualizations {
    constructor() {
        // Chart instances
        this.categoryChart = null;
        this.dailyChart = null;
        
        // Chart containers
        this.categoryChartContainer = document.getElementById('category-chart');
        this.dailyChartContainer = document.getElementById('daily-chart');
        this.streakCalendarContainer = document.getElementById('streak-calendar');
    }
    
    // Initialize charts
    async initialize() {
        await this.updateAllCharts();
    }
    
    // Update all visualizations
    async updateAllCharts() {
        await Promise.all([
            this.updateCategoryChart(),
            this.updateDailyChart(),
            this.updateStreakCalendar()
        ]);
    }
    
    // Update category distribution chart
    async updateCategoryChart() {
        try {
            // Get all activities
            const activities = await db.getAll('activities');
            if (!activities || activities.length === 0) return;
            
            // Get categories for lookup
            const categories = await db.getAll('categories');
            const categoryMap = {};
            categories.forEach(category => {
                categoryMap[category.id] = {
                    name: category.name,
                    color: category.color
                };
            });
            
            // Calculate time spent per category
            const categoryStats = {};
            activities.forEach(activity => {
                const category = categoryMap[activity.categoryId];
                if (!category) return;
                
                const categoryId = activity.categoryId;
                const startTime = new Date(activity.startTime);
                const endTime = new Date(activity.endTime);
                const durationMs = endTime - startTime;
                
                if (!categoryStats[categoryId]) {
                    categoryStats[categoryId] = {
                        name: category.name,
                        color: category.color,
                        totalMs: 0
                    };
                }
                
                categoryStats[categoryId].totalMs += durationMs;
            });
            
            // Convert to chart data
            const chartData = {
                labels: [],
                datasets: [{
                    data: [],
                    backgroundColor: [],
                    borderWidth: 1
                }]
            };
            
            Object.values(categoryStats).forEach(stat => {
                // Convert ms to hours with 1 decimal
                const hours = (stat.totalMs / (1000 * 60 * 60)).toFixed(1);
                chartData.labels.push(`${stat.name} (${hours}h)`);
                chartData.datasets[0].data.push(stat.totalMs);
                chartData.datasets[0].backgroundColor.push(stat.color);
            });
            
            // Create or update chart
            if (this.categoryChart) {
                this.categoryChart.data = chartData;
                this.categoryChart.update();
            } else {
                this.categoryChart = new Chart(this.categoryChartContainer, {
                    type: 'pie',
                    data: chartData,
                    options: {
                        responsive: true,
                        plugins: {
                            legend: {
                                position: 'right',
                            },
                            tooltip: {
                                callbacks: {
                                    label: (context) => {
                                        const ms = context.raw;
                                        const hours = (ms / (1000 * 60 * 60)).toFixed(1);
                                        const percent = Math.round(context.parsed * 10) / 10;
                                        return `${context.label}: ${hours}h (${percent}%)`;
                                    }
                                }
                            }
                        }
                    }
                });
            }
        } catch (error) {
            console.error('Error updating category chart:', error);
        }
    }
    
    // Update daily activity chart
    async updateDailyChart() {
        try {
            // Get all activities
            const activities = await db.getAll('activities');
            if (!activities || activities.length === 0) return;
            
            // Get date range (last 14 days)
            const endDate = new Date();
            const startDate = new Date();
            startDate.setDate(startDate.getDate() - 13);
            
            // Generate daily data
            const dailyData = {};
            
            // Initialize all days with zero
            for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
                const dateString = d.toISOString().split('T')[0];
                dailyData[dateString] = 0;
            }
            
            // Sum activity durations by day
            activities.forEach(activity => {
                const startTime = new Date(activity.startTime);
                const dateString = startTime.toISOString().split('T')[0];
                
                // Only include activities within our date range
                if (dailyData.hasOwnProperty(dateString)) {
                    const endTime = new Date(activity.endTime);
                    const durationMs = endTime - startTime;
                    const durationHours = durationMs / (1000 * 60 * 60);
                    
                    dailyData[dateString] += durationHours;
                }
            });
            
            // Convert to chart data
            const labels = Object.keys(dailyData).map(dateString => {
                const date = new Date(dateString);
                return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
            });
            
            const data = Object.values(dailyData).map(hours => parseFloat(hours.toFixed(1)));
            
            // Create or update chart
            if (this.dailyChart) {
                this.dailyChart.data.labels = labels;
                this.dailyChart.data.datasets[0].data = data;
                this.dailyChart.update();
            } else {
                this.dailyChart = new Chart(this.dailyChartContainer, {
                    type: 'bar',
                    data: {
                        labels: labels,
                        datasets: [{
                            label: 'Hours tracked',
                            data: data,
                            backgroundColor: '#4285f4',
                            borderColor: '#3367d6',
                            borderWidth: 1
                        }]
                    },
                    options: {
                        responsive: true,
                        scales: {
                            y: {
                                beginAtZero: true,
                                title: {
                                    display: true,
                                    text: 'Hours'
                                }
                            }
                        }
                    }
                });
            }
        } catch (error) {
            console.error('Error updating daily chart:', error);
        }
    }
    
    // Update streak calendar
    async updateStreakCalendar() {
        try {
            // Get all activities
            const activities = await db.getAll('activities');
            if (!activities || activities.length === 0) return;
            
            // Map to track days with activities
            const daysWithActivities = new Set();
            
            activities.forEach(activity => {
                const date = new Date(activity.startTime);
                const dateString = date.toISOString().split('T')[0];
                daysWithActivities.add(dateString);
            });
            
            // Generate calendar for the last 28 days
            const today = new Date();
            const calendarDays = [];
            
            for (let i = 27; i >= 0; i--) {
                const date = new Date(today);
                date.setDate(date.getDate() - i);
                const dateString = date.toISOString().split('T')[0];
                const dayOfMonth = date.getDate();
                const hasActivity = daysWithActivities.has(dateString);
                
                calendarDays.push({
                    date: dateString,
                    day: dayOfMonth,
                    hasActivity: hasActivity
                });
            }
            
            // Clear container
            this.streakCalendarContainer.innerHTML = '';
            
            // Create day elements
            calendarDays.forEach(day => {
                const dayElement = document.createElement('div');
                dayElement.className = `calendar-day${day.hasActivity ? ' has-activity' : ''}`;
                dayElement.textContent = day.day;
                dayElement.title = new Date(day.date).toLocaleDateString();
                this.streakCalendarContainer.appendChild(dayElement);
            });
            
            // Calculate current streak
            let currentStreak = 0;
            let maxStreak = 0;
            let streakEndDate = today;
            
            for (let i = 0; i < 28; i++) {
                const date = new Date(today);
                date.setDate(date.getDate() - i);
                const dateString = date.toISOString().split('T')[0];
                
                if (daysWithActivities.has(dateString)) {
                    currentStreak++;
                    
                    if (i === 0) {
                        streakEndDate = date;
                    }
                } else {
                    break;
                }
            }
            
            // Find maximum streak in the last 28 days
            let tempStreak = 0;
            for (let i = 0; i < 28; i++) {
                const date = new Date(today);
                date.setDate(date.getDate() - i);
                const dateString = date.toISOString().split('T')[0];
                
                if (daysWithActivities.has(dateString)) {
                    tempStreak++;
                } else {
                    maxStreak = Math.max(maxStreak, tempStreak);
                    tempStreak = 0;
                }
            }
            maxStreak = Math.max(maxStreak, tempStreak);
            
            // Add streak information
            const streakInfo = document.createElement('div');
            streakInfo.className = 'streak-info';
            
            if (currentStreak > 0) {
                streakInfo.innerHTML = `<p>Current streak: <strong>${currentStreak} day${currentStreak !== 1 ? 's' : ''}</strong></p>`;
            } else {
                streakInfo.innerHTML = `<p>No current streak. Start tracking today!</p>`;
            }
            
            if (maxStreak > 0) {
                streakInfo.innerHTML += `<p>Longest streak in last 28 days: <strong>${maxStreak} day${maxStreak !== 1 ? 's' : ''}</strong></p>`;
            }
            
            this.streakCalendarContainer.appendChild(streakInfo);
        } catch (error) {
            console.error('Error updating streak calendar:', error);
        }
    }
    
    // Generate tag analytics
    async generateTagStats() {
        try {
            // Get all activities
            const activities = await db.getAll('activities');
            if (!activities || activities.length === 0) return null;
            
            // Get tags for lookup
            const tags = await db.getAll('tags');
            const tagMap = {};
            tags.forEach(tag => {
                tagMap[tag.id] = tag.name;
            });
            
            // Calculate tag statistics
            const tagStats = {};
            activities.forEach(activity => {
                if (!activity.tags || !Array.isArray(activity.tags)) return;
                
                activity.tags.forEach(tagId => {
                    if (!tagMap[tagId]) return;
                    
                    if (!tagStats[tagId]) {
                        tagStats[tagId] = {
                            name: tagMap[tagId],
                            count: 0,
                            totalMs: 0
                        };
                    }
                    
                    const startTime = new Date(activity.startTime);
                    const endTime = new Date(activity.endTime);
                    const durationMs = endTime - startTime;
                    
                    tagStats[tagId].count++;
                    tagStats[tagId].totalMs += durationMs;
                });
            });
            
            return Object.values(tagStats).sort((a, b) => b.count - a.count);
        } catch (error) {
            console.error('Error generating tag statistics:', error);
            return null;
        }
    }
    
    // Calculate productivity metrics
    async calculateProductivityMetrics() {
        try {
            // Get all activities
            const activities = await db.getAll('activities');
            if (!activities || activities.length === 0) return null;
            
            // Calculate total tracked time
            let totalTrackedMs = 0;
            activities.forEach(activity => {
                const startTime = new Date(activity.startTime);
                const endTime = new Date(activity.endTime);
                totalTrackedMs += (endTime - startTime);
            });
            
            // Calculate daily averages (last 7 days)
            const today = new Date();
            const last7Days = {};
            
            for (let i = 0; i < 7; i++) {
                const date = new Date(today);
                date.setDate(date.getDate() - i);
                const dateString = date.toISOString().split('T')[0];
                last7Days[dateString] = 0;
            }
            
            // Sum activity durations by day
            activities.forEach(activity => {
                const startTime = new Date(activity.startTime);
                const dateString = startTime.toISOString().split('T')[0];
                
                if (last7Days.hasOwnProperty(dateString)) {
                    const endTime = new Date(activity.endTime);
                    const durationMs = endTime - startTime;
                    last7Days[dateString] += durationMs;
                }
            });
            
            // Calculate average
            const dailyTotals = Object.values(last7Days);
            const averageDailyMs = dailyTotals.reduce((sum, ms) => sum + ms, 0) / 7;
            
            // Count days with tracked activities
            const daysWithActivities = new Set();
            activities.forEach(activity => {
                const date = new Date(activity.startTime);
                const dateString = date.toISOString().split('T')[0];
                daysWithActivities.add(dateString);
            });
            
            // Return metrics
            return {
                totalTrackedTime: this.formatDuration(totalTrackedMs),
                totalTrackedHours: (totalTrackedMs / (1000 * 60 * 60)).toFixed(1),
                averageDailyHours: (averageDailyMs / (1000 * 60 * 60)).toFixed(1),
                totalActivities: activities.length,
                totalDaysTracked: daysWithActivities.size
            };
        } catch (error) {
            console.error('Error calculating productivity metrics:', error);
            return null;
        }
    }
    
    // Format duration for display
    formatDuration(durationMs) {
        const totalSeconds = Math.floor(durationMs / 1000);
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        
        if (hours > 0) {
            return `${hours}h ${minutes}m`;
        } else {
            return `${minutes}m`;
        }
    }
}

// Create visualizations instance
const visualizations = new Visualizations();