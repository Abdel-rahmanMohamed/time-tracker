// Export utilities for CSV and JSON data

class ExportUtility {
    constructor() {
        // DOM elements
        this.exportCsvButton = document.getElementById('export-csv');
        
        // Bind event handlers
        this.exportCsvButton.addEventListener('click', this.exportToCsv.bind(this));
    }
    
    // Export activities to CSV format
    async exportToCsv() {
        try {
            // Get all activities
            const activities = await db.getAll('activities');
            if (!activities || activities.length === 0) {
                alert('No activities to export.');
                return;
            }
            
            // Get categories for lookup
            const categories = await db.getAll('categories');
            const categoryMap = {};
            categories.forEach(category => {
                categoryMap[category.id] = category.name;
            });
            
            // Get tags for lookup
            const tags = await db.getAll('tags');
            const tagMap = {};
            tags.forEach(tag => {
                tagMap[tag.id] = tag.name;
            });
            
            // Convert to CSV format
            const headers = ['ID', 'Description', 'Start Time', 'End Time', 'Duration', 'Category', 'Tags'];
            const rows = activities.map(activity => {
                // Calculate duration
                const startTime = new Date(activity.startTime);
                const endTime = new Date(activity.endTime);
                const durationMs = endTime - startTime;
                const duration = this.formatDuration(durationMs);
                
                // Format tags
                const tagNames = activity.tags ? activity.tags.map(tagId => tagMap[tagId] || '').filter(Boolean).join(', ') : '';
                
                return [
                    activity.id,
                    activity.description,
                    startTime.toISOString(),
                    endTime.toISOString(),
                    duration,
                    categoryMap[activity.categoryId] || '',
                    tagNames
                ];
            });
            
            // Build CSV content
            let csvContent = headers.join(',') + '\n';
            rows.forEach(row => {
                // Properly escape fields with quotes if they contain commas
                const escapedRow = row.map(field => {
                    if (String(field).includes(',')) {
                        return `"${field.replace(/"/g, '""')}"`;
                    }
                    return field;
                });
                csvContent += escapedRow.join(',') + '\n';
            });
            
            // Create and download file
            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.setAttribute('href', url);
            link.setAttribute('download', `time-tracker-export-${new Date().toISOString().slice(0, 10)}.csv`);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } catch (error) {
            console.error('Error exporting to CSV:', error);
            alert('Error exporting data. See console for details.');
        }
    }
    
    // Export all data as JSON for backup
    async exportToJson() {
        try {
            const jsonData = await db.exportData();
            
            // Create and download file
            const blob = new Blob([jsonData], { type: 'application/json;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.setAttribute('href', url);
            link.setAttribute('download', `time-tracker-backup-${new Date().toISOString().slice(0, 10)}.json`);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            return true;
        } catch (error) {
            console.error('Error exporting to JSON:', error);
            alert('Error creating backup. See console for details.');
            return false;
        }
    }
    
    // Import data from JSON backup
    async importFromJson(jsonData) {
        try {
            const success = await db.importData(jsonData);
            return success;
        } catch (error) {
            console.error('Error importing from JSON:', error);
            return false;
        }
    }
    
    // Format duration as HH:MM:SS
    formatDuration(durationMs) {
        const totalSeconds = Math.floor(durationMs / 1000);
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const seconds = totalSeconds % 60;
        
        return [
            hours.toString().padStart(2, '0'),
            minutes.toString().padStart(2, '0'),
            seconds.toString().padStart(2, '0')
        ].join(':');
    }
}

// Create export utility instance
const exportUtil = new ExportUtility();